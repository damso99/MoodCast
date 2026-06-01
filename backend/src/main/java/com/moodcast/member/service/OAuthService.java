package com.moodcast.member.service;

import com.moodcast.member.dao.LoginDao;
import com.moodcast.member.dao.OAuthDao;
import com.moodcast.member.dao.SignupDao;
import com.moodcast.member.dto.login.LoginResult;
import com.moodcast.member.dto.oauth.KakaoLoginRequest;
import com.moodcast.member.dto.oauth.OAuthLoginResult;
import com.moodcast.member.dto.oauth.PendingSocialSignup;
import com.moodcast.member.dto.oauth.SocialExtraSignupRequest;
import com.moodcast.member.dto.oauth.SocialUserInfo;
import com.moodcast.member.dto.signup.SignupTermsAgreementRequest;
import com.moodcast.member.vo.Member;
import com.moodcast.member.vo.OAuthAccount;
import com.moodcast.member.vo.Terms;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class OAuthService {
    private static final String KAKAO = "KAKAO";
    private static final Pattern NAME_PATTERN = Pattern.compile("^[가-힣]{2,10}$");
    private static final Pattern NICKNAME_PATTERN = Pattern.compile("^[가-힣A-Za-z0-9]{2,12}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^010[0-9]{8}$");

    @Value("${oauth.kakao.client-id:}")
    private String kakaoClientId;

    @Value("${oauth.kakao.client-secret:}")
    private String kakaoClientSecret;

    private final OAuthDao oAuthDao;
    private final LoginDao loginDao;
    private final SignupDao signupDao;
    private final LoginService loginService;
    private final MemberValidationService memberValidationService;
    private final AuthCodeRedisService authCodeRedisService;
    private final SocialPendingSignupRedisService pendingSignupRedisService;
    private final RestTemplate restTemplate = new RestTemplate();

    public OAuthService(
            OAuthDao oAuthDao,
            LoginDao loginDao,
            SignupDao signupDao,
            LoginService loginService,
            MemberValidationService memberValidationService,
            AuthCodeRedisService authCodeRedisService,
            SocialPendingSignupRedisService pendingSignupRedisService
    ) {
        this.oAuthDao = oAuthDao;
        this.loginDao = loginDao;
        this.signupDao = signupDao;
        this.loginService = loginService;
        this.memberValidationService = memberValidationService;
        this.authCodeRedisService = authCodeRedisService;
        this.pendingSignupRedisService = pendingSignupRedisService;
    }

    // 카카오 code로 사용자 정보를 조회하고 기존 연결/신규/이메일 충돌을 분기함
    @Transactional
    public OAuthLoginResult loginWithKakao(KakaoLoginRequest request) {
        SocialUserInfo socialUserInfo = requestKakaoUserInfo(request);

        OAuthAccount connectedAccount = oAuthDao.findByProviderAndProviderUserId(
                KAKAO,
                socialUserInfo.getProviderUserId()
        );

        if (connectedAccount != null) {
            Member member = loginDao.findMemberById(connectedAccount.getMemberId());
            if (member == null) {
                throw new IllegalArgumentException("연결된 회원 정보를 찾을 수 없습니다.");
            }

            loginService.checkLoginAllowed(member);
            oAuthDao.updateLastLoginAt(KAKAO, socialUserInfo.getProviderUserId());
            loginDao.updateLastLoginAt(member.getMemberId());

            return OAuthLoginResult.loginSuccess(loginService.issueLoginTokens(member));
        }

        Member existingMember = loginDao.findMemberByEmail(socialUserInfo.getEmail());
        if (existingMember != null) {
            return OAuthLoginResult.emailConflict(socialUserInfo.getEmail());
        }

        PendingSocialSignup pendingSocialSignup = new PendingSocialSignup();
        pendingSocialSignup.setProvider(KAKAO);
        pendingSocialSignup.setProviderUserId(socialUserInfo.getProviderUserId());
        pendingSocialSignup.setProviderEmail(socialUserInfo.getEmail());
        pendingSocialSignup.setProviderNickname(socialUserInfo.getNickname());
        pendingSocialSignup.setProfileImageUrl(socialUserInfo.getProfileImageUrl());

        String pendingToken = pendingSignupRedisService.save(pendingSocialSignup);

        return OAuthLoginResult.needExtraSignup(
                pendingToken,
                socialUserInfo.getEmail(),
                socialUserInfo.getNickname()
        );
    }

    // pendingToken과 추가정보로 members 생성 후 member_oauth_accounts에 연결함
    @Transactional
    public LoginResult completeSocialSignup(SocialExtraSignupRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("소셜 회원가입 정보가 없습니다.");
        }

        PendingSocialSignup pendingSocialSignup = pendingSignupRedisService.get(request.getPendingToken());
        String email = memberValidationService.normalizeEmail(pendingSocialSignup.getProviderEmail());
        String name = normalizeName(request.getName());
        String nickname = normalizeNickname(request.getNickname());
        String phone = normalizePhone(request.getPhone());

        if (signupDao.countByEmail(email) > 0) {
            throw new IllegalArgumentException("이미 사용중인 이메일입니다.");
        }

        if (signupDao.countByPhone(phone) > 0) {
            throw new IllegalArgumentException("이미 사용중인 전화번호입니다.");
        }

        if (nickname != null && signupDao.countByNickname(nickname) > 0) {
            throw new IllegalArgumentException("이미 사용중인 닉네임입니다.");
        }

        if (!authCodeRedisService.isVerified("SIGNUP", "PHONE", phone)) {
            throw new IllegalArgumentException("휴대폰 인증 시간이 만료되었습니다. 다시 시도해주세요");
        }

        checkRequiredTermsAgreed(request.getAgreements());

        Member member = new Member();
        member.setEmail(email);
        member.setPasswordHash(null);
        member.setName(name);
        member.setNickname(nickname);
        member.setPhone(phone);
        member.setProfileImageUrl(pendingSocialSignup.getProfileImageUrl());
        member.setEmailVerified(1);
        member.setPhoneVerified(1);

        int memberResult = signupDao.insertMember(member);
        if (memberResult != 1) {
            throw new IllegalStateException("소셜 회원가입 처리에 실패했습니다.");
        }

        insertTermsAgreements(member.getMemberId(), request.getAgreements());
        insertOAuthAccount(member.getMemberId(), pendingSocialSignup);

        authCodeRedisService.clearAuth("SIGNUP", "PHONE", phone);
        pendingSignupRedisService.delete(request.getPendingToken());

        Member savedMember = loginDao.findMemberById(member.getMemberId());
        return loginService.issueLoginTokens(savedMember);
    }

    // 현재 로그인 회원이 카카오 계정을 연결했는지 확인함
    public boolean isKakaoLinked(String authorizationHeader) {
        Long memberId = loginService.getLoginMemberByHeader(authorizationHeader).getMemberId();
        return oAuthDao.countByMemberIdAndProvider(memberId, KAKAO) > 0;
    }

    // 로그인된 일반 회원에게 카카오 계정을 연결함
    @Transactional
    public Member linkKakaoAccount(String authorizationHeader, KakaoLoginRequest request) {
        Long memberId = loginService.getLoginMemberByHeader(authorizationHeader).getMemberId();
        Member member = loginDao.findMemberById(memberId);
        if (member == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        loginService.checkLoginAllowed(member);

        SocialUserInfo socialUserInfo = requestKakaoUserInfo(request);
        if (!member.getEmail().equalsIgnoreCase(socialUserInfo.getEmail())) {
            throw new IllegalArgumentException("현재 로그인 계정 이메일과 카카오 이메일이 일치하지 않습니다.");
        }

        if (oAuthDao.countByMemberIdAndProvider(memberId, KAKAO) > 0) {
            throw new IllegalArgumentException("이미 카카오 계정이 연결되어 있습니다.");
        }

        OAuthAccount connectedAccount = oAuthDao.findByProviderAndProviderUserId(
                KAKAO,
                socialUserInfo.getProviderUserId()
        );
        if (connectedAccount != null) {
            throw new IllegalArgumentException("이미 다른 회원에게 연결된 카카오 계정입니다.");
        }

        PendingSocialSignup pendingSocialSignup = new PendingSocialSignup();
        pendingSocialSignup.setProvider(KAKAO);
        pendingSocialSignup.setProviderUserId(socialUserInfo.getProviderUserId());
        pendingSocialSignup.setProviderEmail(socialUserInfo.getEmail());
        pendingSocialSignup.setProviderNickname(socialUserInfo.getNickname());
        pendingSocialSignup.setProfileImageUrl(socialUserInfo.getProfileImageUrl());

        insertOAuthAccount(memberId, pendingSocialSignup);
        return member;
    }

    private void insertOAuthAccount(Long memberId, PendingSocialSignup pendingSocialSignup) {
        if (oAuthDao.countByMemberIdAndProvider(memberId, pendingSocialSignup.getProvider()) > 0) {
            throw new IllegalArgumentException("이미 연결된 소셜 계정입니다.");
        }

        OAuthAccount oAuthAccount = new OAuthAccount();
        oAuthAccount.setMemberId(memberId);
        oAuthAccount.setProvider(pendingSocialSignup.getProvider());
        oAuthAccount.setProviderUserId(pendingSocialSignup.getProviderUserId());
        oAuthAccount.setProviderEmail(pendingSocialSignup.getProviderEmail());
        oAuthAccount.setProviderNickname(pendingSocialSignup.getProviderNickname());

        int oauthResult = oAuthDao.insertOAuthAccount(oAuthAccount);
        if (oauthResult != 1) {
            throw new IllegalStateException("소셜 계정 연결에 실패했습니다.");
        }
    }

    private SocialUserInfo requestKakaoUserInfo(KakaoLoginRequest request) {
        if (request == null || request.getCode() == null || request.getCode().trim().isEmpty()) {
            throw new IllegalArgumentException("카카오 인증 코드가 없습니다.");
        }

        if (request.getRedirectUri() == null || request.getRedirectUri().trim().isEmpty()) {
            throw new IllegalArgumentException("카카오 redirectUri가 없습니다.");
        }

        if (kakaoClientId == null || kakaoClientId.trim().isEmpty()) {
            throw new IllegalStateException("카카오 client id 설정이 없습니다.");
        }

        String kakaoAccessToken = requestKakaoAccessToken(request.getCode(), request.getRedirectUri());
        Map<String, Object> kakaoUser = requestKakaoUser(kakaoAccessToken);

        SocialUserInfo socialUserInfo = parseKakaoUserInfo(kakaoUser);

        if (socialUserInfo.getEmail() == null || socialUserInfo.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("카카오 계정에서 이메일을 제공하지 않아 가입할 수 없습니다.");
        }

        socialUserInfo.setEmail(memberValidationService.normalizeEmail(socialUserInfo.getEmail()));

        return socialUserInfo;
    }

    private String requestKakaoAccessToken(String code, String redirectUri) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("client_id", kakaoClientId);
        body.add("redirect_uri", redirectUri);
        body.add("code", code);

        if (kakaoClientSecret != null && !kakaoClientSecret.trim().isEmpty()) {
            body.add("client_secret", kakaoClientSecret);
        }

        ResponseEntity<Map> response;
        try {
            response = restTemplate.postForEntity(
                    "https://kauth.kakao.com/oauth/token",
                    new HttpEntity<>(body, headers),
                    Map.class
            );
        } catch (RestClientResponseException e) {
            throw new IllegalArgumentException("카카오 access token 발급에 실패했습니다. " + e.getResponseBodyAsString());
        }

        Object accessToken = response.getBody() == null ? null : response.getBody().get("access_token");
        if (accessToken == null) {
            throw new IllegalArgumentException("카카오 access token 발급에 실패했습니다.");
        }

        return accessToken.toString();
    }

    private Map<String, Object> requestKakaoUser(String kakaoAccessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(kakaoAccessToken);

        ResponseEntity<Map> response;
        try {
            response = restTemplate.exchange(
                    "https://kapi.kakao.com/v2/user/me",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            );
        } catch (RestClientResponseException e) {
            throw new IllegalArgumentException("카카오 사용자 정보를 가져오지 못했습니다. " + e.getResponseBodyAsString());
        }

        if (response.getBody() == null) {
            throw new IllegalArgumentException("카카오 사용자 정보를 가져오지 못했습니다.");
        }

        return response.getBody();
    }

    @SuppressWarnings("unchecked")
    private SocialUserInfo parseKakaoUserInfo(Map<String, Object> kakaoUser) {
        Object id = kakaoUser.get("id");
        Map<String, Object> kakaoAccount = (Map<String, Object>) kakaoUser.get("kakao_account");

        if (id == null || kakaoAccount == null) {
            throw new IllegalArgumentException("카카오 사용자 정보가 올바르지 않습니다.");
        }

        Map<String, Object> profile = kakaoAccount.get("profile") instanceof Map
                ? (Map<String, Object>) kakaoAccount.get("profile")
                : new HashMap<>();

        SocialUserInfo socialUserInfo = new SocialUserInfo();
        socialUserInfo.setProvider(KAKAO);
        socialUserInfo.setProviderUserId(id.toString());
        socialUserInfo.setEmail(kakaoAccount.get("email") == null ? null : kakaoAccount.get("email").toString());
        socialUserInfo.setNickname(profile.get("nickname") == null ? null : profile.get("nickname").toString());
        socialUserInfo.setProfileImageUrl(profile.get("profile_image_url") == null ? null : profile.get("profile_image_url").toString());

        return socialUserInfo;
    }

    private String normalizeName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("이름을 입력해주세요.");
        }

        name = name.trim();
        if (!NAME_PATTERN.matcher(name).matches()) {
            throw new IllegalArgumentException("이름은 한글 2~10자로 입력해주세요.");
        }

        return name;
    }

    private String normalizeNickname(String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            return null;
        }

        nickname = nickname.trim();
        if (!NICKNAME_PATTERN.matcher(nickname).matches()) {
            throw new IllegalArgumentException("닉네임은 한글, 영문, 숫자 2~12자로 입력해주세요.");
        }

        return nickname;
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            throw new IllegalArgumentException("전화번호를 입력해주세요.");
        }

        phone = phone.trim();
        if (!PHONE_PATTERN.matcher(phone).matches()) {
            throw new IllegalArgumentException("전화번호 형식이 올바르지 않습니다.");
        }

        return phone;
    }

    private void checkRequiredTermsAgreed(List<SignupTermsAgreementRequest> agreements) {
        if (agreements == null || agreements.isEmpty()) {
            throw new IllegalArgumentException("약관 동의 정보가 없습니다.");
        }

        Map<Long, Boolean> agreedMap = new HashMap<>();
        for (SignupTermsAgreementRequest agreement : agreements) {
            if (agreement == null || agreement.getTermsId() == null || agreement.getAgreed() == null) {
                throw new IllegalArgumentException("약관 정보가 올바르지 않습니다.");
            }

            agreedMap.put(agreement.getTermsId(), agreement.getAgreed());
        }

        List<Terms> requiredTerms = signupDao.findRequiredTerms();
        for (Terms requiredTerm : requiredTerms) {
            if (!Boolean.TRUE.equals(agreedMap.get(requiredTerm.getTermsId()))) {
                throw new IllegalArgumentException("필수 약관에 동의해주세요.");
            }
        }
    }

    private void insertTermsAgreements(Long memberId, List<SignupTermsAgreementRequest> agreements) {
        for (SignupTermsAgreementRequest agreement : agreements) {
            signupDao.insertMemberTermsAgreement(
                    memberId,
                    agreement.getTermsId(),
                    Boolean.TRUE.equals(agreement.getAgreed()) ? 1 : 0
            );
        }
    }
}

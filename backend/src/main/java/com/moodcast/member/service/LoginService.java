package com.moodcast.member.service;

import com.moodcast.common.exception.AuthException;
import com.moodcast.member.dao.LoginDao;
import com.moodcast.member.dao.PasswordHistoryDao;
import com.moodcast.member.dto.follow.FollowCheckResponse;
import com.moodcast.member.dto.follow.FollowItemResponse;
import com.moodcast.member.dto.follow.FollowResponse;
import com.moodcast.member.dto.follow.MentionCandidateResponse;
import com.moodcast.member.dto.login.LoginMemberResponse;
import com.moodcast.member.dto.login.LoginRequest;
import com.moodcast.member.dto.login.LoginResult;
import com.moodcast.member.dto.login.RefreshTokenInfo;
import com.moodcast.member.dto.login.UpdateProfileRequest;
import com.moodcast.member.dto.password.PasswordChangeRequest;
import com.moodcast.member.dto.withdraw.WithdrawRequest;
import com.moodcast.member.vo.Member;
import io.jsonwebtoken.JwtException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class LoginService {
    private static final String WITHDRAW_PURPOSE = "WITHDRAW";
    private static final String EMAIL_TARGET_TYPE = "EMAIL";
    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[?!@#$%^&*])[A-Za-z\\d?!@#$%^&*]{8,20}$");
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Autowired
    private LoginDao loginDao;

    @Autowired
    private PasswordHistoryDao passwordHistoryDao;

    @Autowired
    private MemberValidationService memberValidationService;

    @Autowired
    private RefreshTokenRedisService refreshTokenRedisService;

    @Autowired
    private LoginAttemptRedisService loginAttemptRedisService;

    @Autowired
    private AuthCodeRedisService authCodeRedisService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Value("${app.dev-return-auth-code:false}")
    private boolean devReturnAuthCode;

    private String createAuthCode() {
        int number = SECURE_RANDOM.nextInt(900000) + 100000;
        return String.valueOf(number);
    }

    // 비밀번호 null, 빈값 체크
    private String checkPasswordInput(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("비밀번호를 입력해주세요.");
        }

        return password;
    }

    // 새 비밀번호 정책과 확인값 일치를 검증함
    private void checkNewPassword(String newPassword, String newPasswordConfirm) {
        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("새 비밀번호를 입력해주세요.");
        }

        if (!PASSWORD_PATTERN.matcher(newPassword).matches()) {
            throw new IllegalArgumentException("비밀번호는 영문, 숫자, 특수문자를 포함한 8~20자입니다.");
        }

        if (newPasswordConfirm == null || newPasswordConfirm.trim().isEmpty()) {
            throw new IllegalArgumentException("새 비밀번호 확인을 입력해주세요.");
        }

        if (!newPassword.equals(newPasswordConfirm)) {
            throw new IllegalArgumentException("새 비밀번호가 일치하지 않습니다.");
        }
    }

    // 회원이 로그인 가능한 상태인지 체크
    // 인증 미완료, 탈퇴, 정지 체크
    public void checkLoginAllowed(Member member) {
        if ("SUSPENDED".equals(member.getStatus())) {
            throw new IllegalArgumentException("현재 이용이 제한된 계정입니다. 계정 상태를 확인해주세요.");
        }

        if ("WITHDRAW".equals(member.getStatus()) || member.getDeletedAt() != null) {
            throw new IllegalArgumentException("탈퇴 처리된 계정입니다. 다른 계정으로 로그인해주세요.");
        }

        if (!Integer.valueOf(1).equals(member.getEmailVerified())) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않은 계정입니다.");
        }

        if (!Integer.valueOf(1).equals(member.getPhoneVerified())) {
            throw new IllegalArgumentException("휴대폰 인증이 완료되지 않은 계정입니다.");
        }
    }

    private String getLoginMemberEmail(String authorizationHeader) {
        Long memberId = getMemberIdFromHeader(authorizationHeader);
        Member member = loginDao.findMemberById(memberId);

        if (member == null) {
            throw new AuthException("로그인이 필요합니다.");
        }

        checkLoginAllowed(member);

        return memberValidationService.normalizeEmail(member.getEmail());
    }

    private void checkWithdrawAuthCode(String email, String authCode) {
        if (authCode == null || authCode.trim().isEmpty()) {
            throw new IllegalArgumentException("인증번호를 입력해주세요.");
        }

        authCode = authCode.trim();
        if (!authCode.matches("^[0-9]{6}$")) {
            throw new IllegalArgumentException("인증번호는 6자리 숫자입니다.");
        }

        String savedHashCode = authCodeRedisService.getAuthCodeHash(WITHDRAW_PURPOSE, EMAIL_TARGET_TYPE, email);
        if (savedHashCode == null || savedHashCode.trim().isEmpty()) {
            throw new IllegalArgumentException("인증번호 시간이 만료되었습니다. 다시 요청해주세요.");
        }

        long currentAttemptCount = authCodeRedisService.getAttemptCount(WITHDRAW_PURPOSE, EMAIL_TARGET_TYPE, email);
        if (currentAttemptCount >= 5) {
            throw new IllegalArgumentException("인증번호 입력 횟수를 초과했습니다. 인증번호를 다시 요청해주세요.");
        }

        if (!passwordEncoder.matches(authCode, savedHashCode)) {
            Long attemptCount = authCodeRedisService.increaseAttempt(WITHDRAW_PURPOSE, EMAIL_TARGET_TYPE, email);
            long remainingCount = Math.max(0, 5 - attemptCount);
            throw new IllegalArgumentException("인증번호가 올바르지 않습니다. 남은 시도 횟수: " + remainingCount + "회");
        }

        authCodeRedisService.markVerified(WITHDRAW_PURPOSE, EMAIL_TARGET_TYPE, email);
    }

    private LoginMemberResponse toLoginMemberResponse(Member member) {
        return new LoginMemberResponse(
                member.getMemberId(),
                member.getEmail(),
                member.getName(),
                member.getNickname(),
                member.getProfileImageUrl(),
                member.getBio(),
                member.getRole(),
                member.getCreatedAt()
        );
    }

    // 이메일/비밀번호 실패 메시지를 통일하고 Redis 실패 횟수를 기록함
    private void failLogin(String email) {
        loginAttemptRedisService.recordFailure(email);

        throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    @Transactional
    public LoginResult login(LoginRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("이메일과 비밀번호를 입력해주세요.");
        }

        String email = memberValidationService.normalizeEmail(request.getEmail());
        String password = checkPasswordInput(request.getPassword());

        loginAttemptRedisService.checkLocked(email);

        Member member = loginDao.findMemberByEmail(email);
        String passwordHash = loginDao.findPasswordHashByEmail(email);

        if (member == null || passwordHash == null || passwordHash.trim().isEmpty()) {
            failLogin(email);
        }

        boolean matches = passwordEncoder.matches(password, passwordHash);
        if (!matches) {
            failLogin(email);
        }

        loginAttemptRedisService.clear(email);

        checkLoginAllowed(member);

        int result = loginDao.updateLastLoginAt(member.getMemberId());
        if (result <= 0) {
            throw new IllegalStateException("로그인 처리에 실패했습니다.");
        }

        return issueLoginTokens(member);
    }


    // 일반 로그인과 소셜 로그인이 같은 방식으로 access/refresh 토큰을 발급받게 함
    public LoginResult issueLoginTokens(Member member) {
        if (member == null || member.getMemberId() == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        String accessToken = jwtService.createAccessToken(member);
        String tokenId = UUID.randomUUID().toString();
        String refreshToken = jwtService.createRefreshToken(member, tokenId);

        refreshTokenRedisService.saveRefreshToken(
                member.getMemberId(),
                tokenId,
                refreshToken,
                jwtService.getRefreshTokenMaxAgeSeconds()
        );

        LoginMemberResponse loginMemberResponse = toLoginMemberResponse(member);

        return new LoginResult(
                accessToken,
                refreshToken,
                loginMemberResponse
        );
    }


    public LoginMemberResponse getLoginMember(String accessToken) {
        if (accessToken == null || accessToken.trim().isEmpty()) {
            throw new AuthException("로그인이 필요합니다.");
        }

        Long memberId = jwtService.getMemberIdFromAccessToken(accessToken);
        Member member = loginDao.findMemberById(memberId);

        if (member == null) {
            throw new AuthException("로그인이 필요합니다.");
        }

        checkLoginAllowed(member);

        LoginMemberResponse loginMemberResponse = toLoginMemberResponse(member);

        return loginMemberResponse;
    }

    public LoginMemberResponse getLoginMemberByHeader(String authorizationHeader) {
        String accessToken = extractAccessToken(authorizationHeader);

        return getLoginMember(accessToken);
    }

    // 비밀번호 변경 후 모든 refresh 세션을 삭제해서 재로그인을 강제함
    @Transactional
    public void changePassword(String authorizationHeader, PasswordChangeRequest request) {
        Long memberId = getMemberIdFromHeader(authorizationHeader);
        Member member = loginDao.findMemberById(memberId);

        if (member == null) {
            throw new AuthException("로그인이 필요합니다.");
        }

        checkLoginAllowed(member);

        if (request == null) {
            throw new IllegalArgumentException("비밀번호 변경 정보를 입력해주세요.");
        }

        String currentPassword = checkPasswordInput(request.getCurrentPassword());
        checkNewPassword(request.getNewPassword(), request.getNewPasswordConfirm());

        String currentPasswordHash = loginDao.findPasswordHashByMemberId(memberId);

        if (currentPasswordHash == null || currentPasswordHash.trim().isEmpty()) {
            throw new IllegalArgumentException("소셜 로그인 계정은 비밀번호 변경을 사용할 수 없습니다. 연결된 소셜 로그인을 이용해주세요.");
        }

        if (!passwordEncoder.matches(currentPassword, currentPasswordHash)) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), currentPasswordHash)) {
            throw new IllegalArgumentException("현재 비밀번호와 다른 비밀번호를 사용해주세요.");
        }

        List<String> recentPasswordHashes = passwordHistoryDao.findRecentPasswordHashes(memberId, 3);
        for (String recentPasswordHash : recentPasswordHashes) {
            if (passwordEncoder.matches(request.getNewPassword(), recentPasswordHash)) {
                throw new IllegalArgumentException("최근 사용한 비밀번호는 다시 사용할 수 없습니다.");
            }
        }

        String newPasswordHash = passwordEncoder.encode(request.getNewPassword());

        int updateResult = loginDao.updatePasswordHash(memberId, newPasswordHash);
        if (updateResult != 1) {
            throw new IllegalStateException("비밀번호 변경에 실패했습니다.");
        }

        passwordHistoryDao.insertPasswordHistory(memberId, currentPasswordHash);
        refreshTokenRedisService.deleteAllRefreshTokens(memberId);
    }

    // 회원 row는 삭제하지 않고 WITHDRAW 상태와 deleted_at으로 탈퇴 처리함
    @Transactional
    public String sendWithdrawEmailAuthCode(String authorizationHeader, String clientIp) {
        String email = getLoginMemberEmail(authorizationHeader);

        authCodeRedisService.checkCooldown(WITHDRAW_PURPOSE, EMAIL_TARGET_TYPE, email);
        authCodeRedisService.checkAndIncreaseIpSendCount(WITHDRAW_PURPOSE, EMAIL_TARGET_TYPE, clientIp);
        authCodeRedisService.checkAndIncreaseSendCount(WITHDRAW_PURPOSE, EMAIL_TARGET_TYPE, email);

        String authCode = createAuthCode();
        authCodeRedisService.saveAuthCode(WITHDRAW_PURPOSE, EMAIL_TARGET_TYPE, email, passwordEncoder.encode(authCode));

        try {
            emailService.sendWithdrawAuthCode(email, authCode);
        } catch (MailException e) {
            authCodeRedisService.clearAuth(WITHDRAW_PURPOSE, EMAIL_TARGET_TYPE, email);
            throw new IllegalStateException("이메일 인증번호를 발송하지 못했습니다. 이메일 주소를 확인하거나 잠시 후 다시 시도해주세요.");
        }

        if (devReturnAuthCode) {
            System.out.println("회원 탈퇴 이메일 인증번호: " + authCode);
        }

        return email;
    }

    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public void verifyWithdrawEmailAuthCode(String authorizationHeader, String authCode) {
        String email = getLoginMemberEmail(authorizationHeader);
        checkWithdrawAuthCode(email, authCode);
    }

    // 회원 row는 삭제하지 않고 WITHDRAW 상태와 deleted_at으로 탈퇴 처리함
    @Transactional
    public void withdraw(String authorizationHeader, WithdrawRequest request) {
        Long memberId = getMemberIdFromHeader(authorizationHeader);
        Member member = loginDao.findMemberById(memberId);

        if (member == null) {
            throw new AuthException("로그인이 필요합니다.");
        }

        checkLoginAllowed(member);

        if (request == null) {
            throw new IllegalArgumentException("회원 탈퇴 정보를 입력해주세요.");
        }

        if (!"탈퇴합니다".equals(request.getConfirmText())) {
            throw new IllegalArgumentException("탈퇴 확인 문구는 '탈퇴합니다'로 정확히 입력해주세요.");
        }

        String email = memberValidationService.normalizeEmail(member.getEmail());
        if (!authCodeRedisService.isVerified(WITHDRAW_PURPOSE, EMAIL_TARGET_TYPE, email)) {
            throw new IllegalArgumentException("이메일 인증이 필요합니다. 인증번호 확인 후 다시 시도해주세요.");
        }

        int result = loginDao.withdrawMember(memberId);
        if (result != 1) {
            throw new IllegalStateException("회원 탈퇴 처리에 실패했습니다.");
        }

        authCodeRedisService.clearAuth(WITHDRAW_PURPOSE, EMAIL_TARGET_TYPE, email);
        refreshTokenRedisService.deleteAllRefreshTokens(memberId);
    }

    public LoginMemberResponse getMemberById(Long memberId) {
        Member member = loginDao.findMemberById(memberId);
        if (member == null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }
        return toLoginMemberResponse(member);
    }

    public Long getMemberIdFromHeaderOptional(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String accessToken = authHeader.substring(7).trim();
        if (accessToken.isEmpty()) {
            return null;
        }
        try {
            return jwtService.getMemberIdFromAccessToken(accessToken);
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        } catch (AuthException e) {
            return null;
        }
    }

    @Transactional
    public LoginMemberResponse updateProfile(String authorizationHeader, UpdateProfileRequest request) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new AuthException("로그인이 필요합니다.");
        }

        String accessToken = authorizationHeader.substring(7).trim();
        if (accessToken.isEmpty()) {
            throw new AuthException("로그인이 필요합니다.");
        }

        if (request == null || request.getNickname() == null || request.getNickname().trim().isEmpty()) {
            throw new IllegalArgumentException("닉네임을 입력해주세요.");
        }

        Long memberId = jwtService.getMemberIdFromAccessToken(accessToken);
        Member member = loginDao.findMemberById(memberId);

        if (member == null) {
            throw new AuthException("로그인이 필요합니다.");
        }

        checkLoginAllowed(member);

        loginDao.updateMemberProfile(memberId, request.getNickname().trim(), request.getBio(), request.getProfileImageUrl());

        Member updated = loginDao.findMemberById(memberId);
        if (updated == null) {
            throw new IllegalStateException("프로필 정보를 불러올 수 없습니다.");
        }

        return toLoginMemberResponse(updated);
    }

    @Transactional
    public FollowResponse toggleFollow(String authHeader, Long followingId) {
        Long followerId = getMemberIdFromHeader(authHeader);
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("자기 자신을 팔로우할 수 없습니다.");
        }

        boolean isFollowing = loginDao.isFollowing(followerId, followingId) > 0;
        if (isFollowing) {
            loginDao.unfollow(followerId, followingId);
            return new FollowResponse(true, "팔로우가 취소되었습니다.", false);
        } else {
            loginDao.follow(followerId, followingId);
            return new FollowResponse(true, "팔로우되었습니다.", true);
        }
    }

    public FollowCheckResponse getFollowStatus(String authHeader, Long targetMemberId) {
        Long currentMemberId = 0L;
        try {
            currentMemberId = getMemberIdFromHeader(authHeader);
        } catch (Exception ignored) {}

        boolean following = false;
        if (currentMemberId > 0 && !currentMemberId.equals(targetMemberId)) {
            following = loginDao.isFollowing(currentMemberId, targetMemberId) > 0;
        }

        long followerCount = loginDao.countFollowers(targetMemberId);
        long followingCount = loginDao.countFollowing(targetMemberId);
        long postCount = loginDao.countPosts(targetMemberId);
        long savedCount = loginDao.countSavedPosts(targetMemberId);

        // 감정 공감률 계산: 내가 쓴 게시물에 대한 좋아요 비율임
        // 좋아요, 댓글, 저장을 모두 반응으로 보고, 그중 좋아요 비율을 퍼센트로 계산함
        long likes = loginDao.countPostLikes(targetMemberId);
        long comments = loginDao.countPostComments(targetMemberId);
        long saves = loginDao.countPostSaves(targetMemberId);
        long totalReactions = likes + comments + saves;
        int emotionEmpathyRate = totalReactions == 0 ? 0 : (int) Math.round((double) likes * 100 / totalReactions);

        // 주간 반응 계산: 최근 7일간 내 게시물에 달린 좋아요/댓글/저장 수 합임
        long weeklyReactions = loginDao.countWeeklyPostReactions(targetMemberId);

        return new FollowCheckResponse(true, following, followerCount, followingCount, postCount, savedCount, emotionEmpathyRate, weeklyReactions);
    }

    public List<FollowItemResponse> getFollowerList(String authHeader, Long targetId) {
        Long loginId = 0L;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                loginId = getMemberIdFromHeader(authHeader);
            } catch (Exception ignored) {
            }
        }
        return loginDao.getFollowerList(targetId, loginId);
    }

    public List<FollowItemResponse> getFollowingList(String authHeader, Long targetId) {
        Long loginId = 0L;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                loginId = getMemberIdFromHeader(authHeader);
            } catch (Exception ignored) {
            }
        }
        return loginDao.getFollowingList(targetId, loginId);
    }

    public List<MentionCandidateResponse> getMentionCandidates(Long memberId, String keyword) {
        if (memberId == null) {
            throw new IllegalArgumentException("멤버 ID가 필요합니다.");
        }

        String normalizedKeyword = keyword == null ? null : keyword.trim();
        if (normalizedKeyword != null && normalizedKeyword.isEmpty()) {
            normalizedKeyword = null;
        }

        return loginDao.getMentionCandidates(memberId, normalizedKeyword);
    }

    private Long getMemberIdFromHeader(String authHeader) {
        String token = extractAccessToken(authHeader);

        return jwtService.getMemberIdFromAccessToken(token);
    }

    private String extractAccessToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new AuthException("로그인이 필요합니다.");
        }

        String token = authHeader.substring(7).trim();

        if (token.isEmpty()) {
            throw new AuthException("로그인이 필요합니다.");
        }
        return token;
    }

    // accessToken 재발급
    public LoginResult refreshAccessToken(String refreshToken) {
        // 토큰 검증 및 memberId 추출
        RefreshTokenInfo refreshTokenInfo = jwtService.getRefreshTokenInfo(refreshToken);
        Long memberId = refreshTokenInfo.getMemberId();
        String tokenId = refreshTokenInfo.getTokenId();

        // redis의 최신 refreshToken과 일치하는지 체크
        if (!refreshTokenRedisService.matchesRefreshToken(memberId, tokenId, refreshToken)) {
            throw new AuthException("로그인이 필요합니다.");
        }

        // 회원있는지 체크
        Member member = loginDao.findMemberById(memberId);
        if (member == null) {
            throw new AuthException("로그인이 필요합니다.");
        }

        // 로그인 가능여부 서비스 정책 체크
        checkLoginAllowed(member);

        // 기존 refreshToken은 재사용하지 못하게 삭제
        refreshTokenRedisService.deleteRefreshToken(memberId, tokenId);

        // 새 로그인 세션 tokenId 생성
        String newTokenId = UUID.randomUUID().toString();

        // accessToken과 refreshToken 새로 발급
        String newAccessToken = jwtService.createAccessToken(member);
        String newRefreshToken = jwtService.createRefreshToken(member, newTokenId);

        // 새 refreshToken을 Redis에 저장
        refreshTokenRedisService.saveRefreshToken(
                member.getMemberId(),
                newTokenId,
                newRefreshToken,
                jwtService.getRefreshTokenMaxAgeSeconds()
        );

        LoginMemberResponse loginMemberResponse = toLoginMemberResponse(member);

        return new LoginResult(
                newAccessToken,
                newRefreshToken,
                loginMemberResponse
        );
    }

    // 로그아웃 시 refreshToken 있으면 redis에서 삭제
    public void logout(String refreshToken) {
        RefreshTokenInfo refreshTokenInfo = jwtService.getRefreshTokenInfo(refreshToken);
        refreshTokenRedisService.deleteRefreshToken(refreshTokenInfo.getMemberId(), refreshTokenInfo.getTokenId());
    }
}

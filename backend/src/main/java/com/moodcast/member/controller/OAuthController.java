package com.moodcast.member.controller;

import com.moodcast.common.ClientIpResolver;
import com.moodcast.member.dto.login.LoginResponse;
import com.moodcast.member.dto.login.LoginResult;
import com.moodcast.member.dto.oauth.KakaoLoginRequest;
import com.moodcast.member.dto.oauth.OAuthLoginResult;
import com.moodcast.member.dto.oauth.SocialExtraSignupRequest;
import com.moodcast.member.dto.oauth.SocialLoginResponse;
import com.moodcast.member.service.JwtService;
import com.moodcast.member.service.LoginAuditService;
import com.moodcast.member.service.OAuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

import com.moodcast.member.vo.Member;

@RestController
@RequestMapping("oauth")
public class OAuthController {
    private final OAuthService oAuthService;
    private final JwtService jwtService;
    private final LoginAuditService loginAuditService;
    private final ClientIpResolver clientIpResolver;

    public OAuthController(
            OAuthService oAuthService,
            JwtService jwtService,
            LoginAuditService loginAuditService,
            ClientIpResolver clientIpResolver
    ) {
        this.oAuthService = oAuthService;
        this.jwtService = jwtService;
        this.loginAuditService = loginAuditService;
        this.clientIpResolver = clientIpResolver;
    }

    private String getClientIp(HttpServletRequest request) {
        return clientIpResolver.resolve(request);
    }

    private String getUserAgent(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }

    private ResponseEntity<?> handleSocialLoginResult(
            String provider,
            String providerLabel,
            OAuthLoginResult result,
            HttpServletRequest httpRequest
    ) {
        if ("EMAIL_CONFLICT".equals(result.getStatus())) {
            loginAuditService.record(
                    null,
                    result.getProviderEmail(),
                    provider,
                    "SOCIAL_EMAIL_CONFLICT",
                    false,
                    "SOCIAL_EMAIL_CONFLICT",
                    getClientIp(httpRequest),
                    getUserAgent(httpRequest)
            );

            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    SocialLoginResponse.emailConflict(provider, result.getProviderEmail())
            );
        }

        if ("NEED_EXTRA_SIGNUP".equals(result.getStatus())) {
            return ResponseEntity.ok(
                    SocialLoginResponse.needExtraSignup(
                            result.getPendingToken(),
                            provider,
                            result.getProviderEmail(),
                            result.getProviderNickname()
                    )
            );
        }

        LoginResult loginResult = result.getLoginResult();
        ResponseCookie refreshCookie = jwtService.createRefreshCookie(loginResult.getRefreshToken());

        loginAuditService.record(
                loginResult.getMember().getMemberId(),
                loginResult.getMember().getEmail(),
                provider,
                "SOCIAL_LOGIN_SUCCESS",
                true,
                null,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(new LoginResponse(true, providerLabel + " 로그인 성공", loginResult.getAccessToken(), loginResult.getMember()));
    }

    // 카카오 인가 code를 검증하고 기존 연결 계정이면 바로 로그인 처리함
    @PostMapping("kakao/login")
    public ResponseEntity<?> loginWithKakao(@RequestBody KakaoLoginRequest request, HttpServletRequest httpRequest) {
        return handleSocialLoginResult("KAKAO", "카카오", oAuthService.loginWithKakao(request), httpRequest);
    }

    // Google 인가 code를 검증하고 기존 연결 계정이면 바로 로그인 처리함
    @PostMapping("google/login")
    public ResponseEntity<?> loginWithGoogle(@RequestBody KakaoLoginRequest request, HttpServletRequest httpRequest) {
        return handleSocialLoginResult("GOOGLE", "Google", oAuthService.loginWithGoogle(request), httpRequest);
    }

    // 현재 로그인 회원의 카카오 연결 여부를 조회함
    @GetMapping("kakao/status")
    public ResponseEntity<?> getKakaoLinkStatus(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "linked", oAuthService.isKakaoLinked(authorizationHeader)
                )
        );
    }

    // 현재 로그인 회원의 Google 연결 여부를 조회함
    @GetMapping("google/status")
    public ResponseEntity<?> getGoogleLinkStatus(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "linked", oAuthService.isGoogleLinked(authorizationHeader)
                )
        );
    }

    private ResponseEntity<?> linkSocialAccount(
            String provider,
            String providerLabel,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody KakaoLoginRequest request,
            HttpServletRequest httpRequest
    ) {
        try {
            Member member = "GOOGLE".equals(provider)
                    ? oAuthService.linkGoogleAccount(authorizationHeader, request)
                    : oAuthService.linkKakaoAccount(authorizationHeader, request);

            loginAuditService.record(
                    member.getMemberId(),
                    member.getEmail(),
                    provider,
                    "SOCIAL_LINK_SUCCESS",
                    true,
                    null,
                    getClientIp(httpRequest),
                    getUserAgent(httpRequest)
            );

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", providerLabel + " 계정이 연결되었습니다."
                    )
            );
        } catch (IllegalArgumentException | IllegalStateException e) {
            loginAuditService.record(
                    null,
                    null,
                    provider,
                    "SOCIAL_LINK_FAIL",
                    false,
                    "SOCIAL_LINK_FAIL",
                    getClientIp(httpRequest),
                    getUserAgent(httpRequest)
            );

            throw e;
        }
    }

    // 로그인된 일반 회원에게 카카오 계정을 연결함
    @PostMapping("kakao/link")
    public ResponseEntity<?> linkKakaoAccount(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody KakaoLoginRequest request,
            HttpServletRequest httpRequest
    ) {
        return linkSocialAccount("KAKAO", "카카오", authorizationHeader, request, httpRequest);
    }

    // 로그인된 일반 회원에게 Google 계정을 연결함
    @PostMapping("google/link")
    public ResponseEntity<?> linkGoogleAccount(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody KakaoLoginRequest request,
            HttpServletRequest httpRequest
    ) {
        return linkSocialAccount("GOOGLE", "Google", authorizationHeader, request, httpRequest);
    }

    // 신규 소셜 사용자의 추가정보 입력 후 회원가입과 소셜 계정 연결을 완료함
    @PostMapping("social/signup")
    public ResponseEntity<?> completeSocialSignup(
            @RequestBody SocialExtraSignupRequest request,
            HttpServletRequest httpRequest
    ) {
        String provider = oAuthService.getPendingProvider(request.getPendingToken());
        LoginResult loginResult = oAuthService.completeSocialSignup(request);
        ResponseCookie refreshCookie = jwtService.createRefreshCookie(loginResult.getRefreshToken());

        loginAuditService.record(
                loginResult.getMember().getMemberId(),
                loginResult.getMember().getEmail(),
                provider,
                "SOCIAL_LOGIN_SUCCESS",
                true,
                null,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(new LoginResponse(true, "소셜 회원가입 성공", loginResult.getAccessToken(), loginResult.getMember()));
    }
}

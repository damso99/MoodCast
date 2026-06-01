package com.moodcast.member.controller;

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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("oauth")
public class OAuthController {
    private final OAuthService oAuthService;
    private final JwtService jwtService;
    private final LoginAuditService loginAuditService;

    public OAuthController(OAuthService oAuthService, JwtService jwtService, LoginAuditService loginAuditService) {
        this.oAuthService = oAuthService;
        this.jwtService = jwtService;
        this.loginAuditService = loginAuditService;
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

    private String getUserAgent(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }

    // 카카오 인가 code를 검증하고 기존 연결 계정이면 바로 로그인 처리함
    @PostMapping("kakao/login")
    public ResponseEntity<?> loginWithKakao(@RequestBody KakaoLoginRequest request, HttpServletRequest httpRequest) {
        OAuthLoginResult result = oAuthService.loginWithKakao(request);

        if ("EMAIL_CONFLICT".equals(result.getStatus())) {
            loginAuditService.record(
                    null,
                    result.getProviderEmail(),
                    "KAKAO",
                    "SOCIAL_EMAIL_CONFLICT",
                    false,
                    "SOCIAL_EMAIL_CONFLICT",
                    getClientIp(httpRequest),
                    getUserAgent(httpRequest)
            );

            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    SocialLoginResponse.emailConflict(result.getProviderEmail())
            );
        }

        if ("NEED_EXTRA_SIGNUP".equals(result.getStatus())) {
            return ResponseEntity.ok(
                    SocialLoginResponse.needExtraSignup(
                            result.getPendingToken(),
                            "KAKAO",
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
                "KAKAO",
                "SOCIAL_LOGIN_SUCCESS",
                true,
                null,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(new LoginResponse(true, "카카오 로그인 성공", loginResult.getAccessToken(), loginResult.getMember()));
    }

    // 카카오 신규 사용자의 추가정보 입력 후 회원가입과 소셜 계정 연결을 완료함
    @PostMapping("social/signup")
    public ResponseEntity<?> completeSocialSignup(
            @RequestBody SocialExtraSignupRequest request,
            HttpServletRequest httpRequest
    ) {
        LoginResult loginResult = oAuthService.completeSocialSignup(request);
        ResponseCookie refreshCookie = jwtService.createRefreshCookie(loginResult.getRefreshToken());

        loginAuditService.record(
                loginResult.getMember().getMemberId(),
                loginResult.getMember().getEmail(),
                "KAKAO",
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

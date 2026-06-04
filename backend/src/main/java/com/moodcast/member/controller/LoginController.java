package com.moodcast.member.controller;

import com.moodcast.common.ClientIpResolver;
import com.moodcast.common.exception.AuthException;
import com.moodcast.member.dto.login.LoginRequest;
import com.moodcast.member.dto.login.LoginResponse;
import com.moodcast.member.dto.login.LoginResult;
import com.moodcast.member.dto.login.LoginMemberResponse;
import com.moodcast.member.dto.login.RefreshTokenInfo;
import com.moodcast.member.dto.login.UpdateProfileRequest;
import com.moodcast.member.dto.password.PasswordChangeRequest;
import com.moodcast.member.dto.recovery.FindEmailCodeRequest;
import com.moodcast.member.dto.recovery.FindEmailResult;
import com.moodcast.member.dto.recovery.FindEmailVerifyRequest;
import com.moodcast.member.dto.recovery.PasswordResetCodeRequest;
import com.moodcast.member.dto.recovery.PasswordResetRequest;
import com.moodcast.member.dto.recovery.PasswordResetVerifyRequest;
import com.moodcast.member.dto.signup.EmailAuthSendResult;
import com.moodcast.member.dto.withdraw.WithdrawRequest;
import com.moodcast.member.dto.follow.FollowResponse;
import com.moodcast.member.dto.follow.FollowCheckResponse;
import com.moodcast.member.dto.follow.FollowItemResponse;
import com.moodcast.member.service.AccountRecoveryService;
import com.moodcast.member.service.LoginAuditService;
import com.moodcast.member.service.LoginService;
import com.moodcast.member.service.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("auth")
public class LoginController {
    @Autowired
    private LoginService loginService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private LoginAuditService loginAuditService;

    @Autowired
    private AccountRecoveryService accountRecoveryService;

    @Autowired
    private ClientIpResolver clientIpResolver;

    @Value("${app.dev-return-auth-code:false}")
    private boolean devReturnAuthCode;

    private String getClientIp(HttpServletRequest request) {
        return clientIpResolver.resolve(request);
    }

    private String getUserAgent(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }

    private String getAuditEmail(LoginRequest request) {
        if (request == null || request.getEmail() == null) {
            return null;
        }

        return request.getEmail().trim().toLowerCase();
    }

    private String getLoginFailReason(Exception e) {
        String message = e.getMessage();

        if (message == null) {
            return "UNKNOWN";
        }

        if (message.contains("실패 횟수")) {
            return "ACCOUNT_LOCKED";
        }

        if (message.contains("정지")) {
            return "SUSPENDED";
        }

        if (message.contains("탈퇴")) {
            return "WITHDRAW";
        }

        if (message.contains("이메일 인증")) {
            return "EMAIL_NOT_VERIFIED";
        }

        if (message.contains("비밀번호")) {
            return "PASSWORD_MISMATCH";
        }

        return "UNKNOWN";
    }

    private LoginMemberResponse getAuditMemberFromRefreshToken(String refreshToken) {
        try {
            RefreshTokenInfo refreshTokenInfo = jwtService.getRefreshTokenInfo(refreshToken);
            return loginService.getMemberById(refreshTokenInfo.getMemberId());
        } catch (Exception e) {
            return null;
        }
    }

    private Long getAuditMemberId(LoginMemberResponse member) {
        return member == null ? null : member.getMemberId();
    }

    private String getAuditMemberEmail(LoginMemberResponse member) {
        return member == null ? null : member.getEmail();
    }

    private String getRefreshFailReason(Exception e, LoginMemberResponse auditMember) {
        String message = e.getMessage();

        if (message == null) {
            return "UNKNOWN";
        }

        if (message.contains("정지")) {
            return "SUSPENDED";
        }

        if (message.contains("탈퇴")) {
            return "WITHDRAW";
        }

        if (message.contains("이메일 인증")) {
            return "EMAIL_NOT_VERIFIED";
        }

        if (auditMember != null && message.contains("로그인")) {
            return "REFRESH_MISMATCH";
        }

        return "REFRESH_EXPIRED";
    }

    @PostMapping("login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        try {
            LoginResult result = loginService.login(request);

            loginAuditService.record(
                    result.getMember().getMemberId(),
                    result.getMember().getEmail(),
                    null,
                    "PASSWORD_LOGIN_SUCCESS",
                    true,
                    null,
                    getClientIp(httpRequest),
                    getUserAgent(httpRequest)
            );

            ResponseCookie refreshCookie = jwtService.createRefreshCookie(result.getRefreshToken());

            LoginResponse response = new LoginResponse(
                    true,
                    "로그인 성공",
                    result.getAccessToken(),
                    result.getMember()
            );

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            String failReason = getLoginFailReason(e);

            loginAuditService.record(
                    null,
                    getAuditEmail(request),
                    null,
                    "ACCOUNT_LOCKED".equals(failReason) ? "ACCOUNT_LOCKED" : "PASSWORD_LOGIN_FAIL",
                    false,
                    failReason,
                    getClientIp(httpRequest),
                    getUserAgent(httpRequest)
            );

            throw e;
        }
    }

    @GetMapping("me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new AuthException("로그인이 필요합니다.");
        }

        String accessToken = authorization.substring(7);

        LoginMemberResponse loginMemberResponse = loginService.getLoginMember(accessToken);

        return ResponseEntity.ok(loginMemberResponse);
    }

    @PutMapping("profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "프로필이 수정되었습니다.",
                        "member", loginService.updateProfile(authorizationHeader, request)
                )
        );
    }

    @PostMapping("password/change")
    public ResponseEntity<?> changePassword(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody PasswordChangeRequest request,
            HttpServletRequest httpRequest
    ) {
        LoginMemberResponse loginMember = loginService.getLoginMemberByHeader(authorizationHeader);
        loginService.changePassword(authorizationHeader, request);

        loginAuditService.record(
                loginMember.getMemberId(),
                loginMember.getEmail(),
                null,
                "PASSWORD_CHANGE",
                true,
                null,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );

        ResponseCookie deleteCookie = jwtService.createDeleteRefreshCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body(
                        Map.of(
                                "success", true,
                                "message", "비밀번호가 변경되었습니다. 다시 로그인해주세요."
                        )
                );
    }

    @PostMapping("recovery/email/send-code")
    public ResponseEntity<?> sendFindEmailCode(
            @RequestBody FindEmailCodeRequest request,
            HttpServletRequest httpRequest
    ) {
        EmailAuthSendResult result = accountRecoveryService.sendFindEmailCode(request, getClientIp(httpRequest));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "가입 이메일로 인증번호를 발송했습니다. 3분 안에 입력해주세요.");
        response.put("email", result.getEmail());
        if (devReturnAuthCode) {
            response.put("authCode", result.getAuthCode());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("recovery/email/verify")
    public ResponseEntity<?> verifyFindEmailCode(@RequestBody FindEmailVerifyRequest request) {
        FindEmailResult result = accountRecoveryService.verifyFindEmailCode(request);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "가입 계정을 찾았습니다.",
                        "email", result.getEmail(),
                        "kakaoLinked", result.isKakaoLinked(),
                        "googleLinked", result.isGoogleLinked(),
                        "naverLinked", result.isNaverLinked()
                )
        );
    }

    @PostMapping("recovery/password/send-code")
    public ResponseEntity<?> sendPasswordResetCode(
            @RequestBody PasswordResetCodeRequest request,
            HttpServletRequest httpRequest
    ) {
        EmailAuthSendResult result = accountRecoveryService.sendPasswordResetCode(request, getClientIp(httpRequest));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "비밀번호 재설정 이메일 인증번호를 발송했습니다. 3분 안에 입력해주세요.");
        response.put("email", result.getEmail());
        if (devReturnAuthCode) {
            response.put("authCode", result.getAuthCode());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("recovery/password/verify")
    public ResponseEntity<?> verifyPasswordResetCode(@RequestBody PasswordResetVerifyRequest request) {
        accountRecoveryService.verifyPasswordResetCode(request);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "이메일 인증이 완료되었습니다. 새 비밀번호를 입력해주세요."
                )
        );
    }

    @PostMapping("recovery/password/reset")
    public ResponseEntity<?> resetPassword(
            @RequestBody PasswordResetRequest request,
            HttpServletRequest httpRequest
    ) {
        accountRecoveryService.resetPassword(request);

        loginAuditService.record(
                null,
                request == null || request.getEmail() == null ? null : request.getEmail().trim().toLowerCase(),
                null,
                "PASSWORD_RESET",
                true,
                null,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "비밀번호가 재설정되었습니다. 다시 로그인해주세요."
                )
        );
    }

    @PostMapping("withdraw/email/send")
    public ResponseEntity<?> sendWithdrawEmailCode(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            HttpServletRequest httpRequest
    ) {
        EmailAuthSendResult result = loginService.sendWithdrawEmailAuthCode(authorizationHeader, getClientIp(httpRequest));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "탈퇴 확인 이메일 인증번호를 발송했습니다. 3분 안에 입력해주세요.");
        response.put("email", result.getEmail());
        if (devReturnAuthCode) {
            response.put("authCode", result.getAuthCode());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("withdraw/email/verify")
    public ResponseEntity<?> verifyWithdrawEmailCode(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody WithdrawRequest request
    ) {
        loginService.verifyWithdrawEmailAuthCode(authorizationHeader, request.getAuthCode());

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "탈퇴 이메일 인증이 완료되었습니다."
                )
        );
    }

    @PostMapping("withdraw")
    public ResponseEntity<?> withdraw(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody WithdrawRequest request,
            HttpServletRequest httpRequest
    ) {
        LoginMemberResponse loginMember = loginService.getLoginMemberByHeader(authorizationHeader);
        loginService.withdraw(authorizationHeader, request);

        loginAuditService.record(
                loginMember.getMemberId(),
                loginMember.getEmail(),
                null,
                "WITHDRAW",
                true,
                null,
                getClientIp(httpRequest),
                getUserAgent(httpRequest)
        );

        ResponseCookie deleteCookie = jwtService.createDeleteRefreshCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body(
                        Map.of(
                                "success", true,
                                "message", "회원 탈퇴가 완료되었습니다."
                        )
                );
    }

    @GetMapping("member/{memberId}")
    public ResponseEntity<?> getMemberProfile(@PathVariable("memberId") Long memberId) {
        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "member", loginService.getMemberById(memberId)
                )
        );
    }

    // 팔로우 토글
    @PostMapping("follow/{memberId}")
    public ResponseEntity<FollowResponse> toggleFollow(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable("memberId") Long memberId
    ) {
        return ResponseEntity.ok(loginService.toggleFollow(authHeader, memberId));
    }

    // 팔로우 상태 및 카운트 조회
    @GetMapping("follow/status/{memberId}")
    public ResponseEntity<FollowCheckResponse> getFollowStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable("memberId") Long memberId
    ) {
        return ResponseEntity.ok(loginService.getFollowStatus(authHeader, memberId));
    }

    @GetMapping("follow/followers/{memberId}")
    public ResponseEntity<List<FollowItemResponse>> getFollowers(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable("memberId") Long memberId
    ) {
        return ResponseEntity.ok(loginService.getFollowerList(authHeader, memberId));
    }

    @GetMapping("follow/following/{memberId}")
    public ResponseEntity<List<FollowItemResponse>> getFollowing(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable("memberId") Long memberId
    ) {
        return ResponseEntity.ok(loginService.getFollowingList(authHeader, memberId));
    }

    // 로그아웃
    @PostMapping("logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        String refreshToken = null;

        // 쿠키에서 리프레시 토큰 찾기
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (jwtService.getRefreshCookieName().equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken != null && !refreshToken.isBlank()) {
            LoginMemberResponse auditMember = getAuditMemberFromRefreshToken(refreshToken);

            try {
                loginService.logout(refreshToken);
                loginAuditService.record(
                        getAuditMemberId(auditMember),
                        getAuditMemberEmail(auditMember),
                        null,
                        "LOGOUT",
                        true,
                        null,
                        getClientIp(request),
                        getUserAgent(request)
                );
            } catch (AuthException | IllegalArgumentException e) {
                // refresh token이 이미 만료/삭제되어도 로그아웃은 쿠키 정리까지 성공 처리함
                loginAuditService.record(
                        getAuditMemberId(auditMember),
                        getAuditMemberEmail(auditMember),
                        null,
                        "LOGOUT",
                        false,
                        getRefreshFailReason(e, auditMember),
                        getClientIp(request),
                        getUserAgent(request)
                );
            }
        }

        ResponseCookie deleteCookie = jwtService.createDeleteRefreshCookie();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body(
                        Map.of(
                                "success", true,
                                "message", "로그아웃되었습니다."
                        )
                );
    }

    @PostMapping("refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request) {
        String refreshToken = null;

        // npe 방어
        if (request.getCookies() != null) {
            // 쿠키 하나씩 꺼내서 변수에 담기
            for (Cookie cookie : request.getCookies()) {
                // 쿠키중에 리프레시 쿠키 이름 있으면
                if (jwtService.getRefreshCookieName().equals(cookie.getName())) {
                    // 리프레시 토큰 꺼내서 담기
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        LoginResult result;
        LoginMemberResponse auditMember = getAuditMemberFromRefreshToken(refreshToken);

        try {
            result = loginService.refreshAccessToken(refreshToken);
            loginAuditService.recordRefreshSuccess(
                    result.getMember().getMemberId(),
                    result.getMember().getEmail(),
                    getClientIp(request),
                    getUserAgent(request)
            );
        } catch (AuthException | IllegalArgumentException | IllegalStateException e) {
            loginAuditService.record(
                    getAuditMemberId(auditMember),
                    getAuditMemberEmail(auditMember),
                    null,
                    "REFRESH_FAIL",
                    false,
                    getRefreshFailReason(e, auditMember),
                    getClientIp(request),
                    getUserAgent(request)
            );

            throw e;
        }

        // dto에 담아서
        LoginResponse response = new LoginResponse(
                true,
                "토큰 재발급 성공",
                result.getAccessToken(),
                result.getMember()
        );
        // 새 refreshToken을 쿠키에 다시 저장
        ResponseCookie refreshCookie = jwtService.createRefreshCookie(result.getRefreshToken());

        // 응답
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(response);
    }
}

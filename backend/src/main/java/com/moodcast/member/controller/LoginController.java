package com.moodcast.member.controller;

import com.moodcast.member.dto.login.LoginRequest;
import com.moodcast.member.dto.login.LoginResponse;
import com.moodcast.member.dto.login.LoginResult;
import com.moodcast.member.dto.login.LoginMemberResponse;
import com.moodcast.member.dto.login.UpdateProfileRequest;
import com.moodcast.member.dto.password.PasswordChangeRequest;
import com.moodcast.member.dto.recovery.FindEmailCodeRequest;
import com.moodcast.member.dto.recovery.FindEmailVerifyRequest;
import com.moodcast.member.dto.recovery.PasswordResetCodeRequest;
import com.moodcast.member.dto.recovery.PasswordResetRequest;
import com.moodcast.member.dto.signup.PhoneAuthSendResult;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

        if (message.contains("휴대폰 인증")) {
            return "PHONE_NOT_VERIFIED";
        }

        if (message.contains("비밀번호")) {
            return "PASSWORD_MISMATCH";
        }

        return "UNKNOWN";
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
            throw new IllegalArgumentException("로그인이 필요합니다.");
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
        loginService.changePassword(authorizationHeader, request);

        loginAuditService.record(
                null,
                null,
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

    @PostMapping("recovery/email/send-phone-code")
    public ResponseEntity<?> sendFindEmailPhoneCode(
            @RequestBody FindEmailCodeRequest request,
            HttpServletRequest httpRequest
    ) {
        PhoneAuthSendResult result = accountRecoveryService.sendFindEmailPhoneCode(request, getClientIp(httpRequest));

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "인증번호가 발송되었습니다.",
                        "phone", result.getPhone(),
                        "authCode", result.getAuthCode()
                )
        );
    }

    @PostMapping("recovery/email/verify")
    public ResponseEntity<?> verifyFindEmailCode(@RequestBody FindEmailVerifyRequest request) {
        String maskedEmail = accountRecoveryService.verifyFindEmailCode(request);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "계정을 찾았습니다.",
                        "email", maskedEmail
                )
        );
    }

    @PostMapping("recovery/password/send-phone-code")
    public ResponseEntity<?> sendPasswordResetPhoneCode(
            @RequestBody PasswordResetCodeRequest request,
            HttpServletRequest httpRequest
    ) {
        PhoneAuthSendResult result = accountRecoveryService.sendPasswordResetPhoneCode(request, getClientIp(httpRequest));

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "인증번호가 발송되었습니다.",
                        "phone", result.getPhone(),
                        "authCode", result.getAuthCode()
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
                "PASSWORD_CHANGE",
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

    @PostMapping("withdraw")
    public ResponseEntity<?> withdraw(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody WithdrawRequest request,
            HttpServletRequest httpRequest
    ) {
        loginService.withdraw(authorizationHeader, request);

        loginAuditService.record(
                null,
                null,
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
            try {
                loginService.logout(refreshToken);
                loginAuditService.record(
                        null,
                        null,
                        null,
                        "LOGOUT",
                        true,
                        null,
                        getClientIp(request),
                        getUserAgent(request)
                );
            } catch (IllegalArgumentException e) {
                // refresh token이 이미 만료/삭제되어도 로그아웃은 쿠키 정리까지 성공 처리함
                loginAuditService.record(
                        null,
                        null,
                        null,
                        "LOGOUT",
                        false,
                        "REFRESH_EXPIRED",
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

        try {
            result = loginService.refreshAccessToken(refreshToken);
            loginAuditService.record(
                    result.getMember().getMemberId(),
                    result.getMember().getEmail(),
                    null,
                    "REFRESH_SUCCESS",
                    true,
                    null,
                    getClientIp(request),
                    getUserAgent(request)
            );
        } catch (IllegalArgumentException | IllegalStateException e) {
            loginAuditService.record(
                    null,
                    null,
                    null,
                    "REFRESH_FAIL",
                    false,
                    "REFRESH_EXPIRED",
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

package com.moodcast.member.controller;

import com.moodcast.member.dto.login.LoginMemberResponse;
import com.moodcast.member.dto.login.LoginRequest;
import com.moodcast.member.dto.login.LoginResponse;
import com.moodcast.member.dto.login.LoginResult;
import com.moodcast.member.service.JwtService;
import com.moodcast.member.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController

@RequestMapping(value="auth")
public class LoginController {
    @Autowired
    private LoginService loginService;

    @Autowired
    private JwtService jwtService;

    // 로그인 검증 + 검증 성공 시 토큰 생성
    @PostMapping("login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        LoginResult result = loginService.login(request);

        ResponseCookie refreshCookie = jwtService.createRefreshCookie(result.getRefreshToken());

        LoginResponse response = new LoginResponse(
                true,
                "로그인 성공",
                result.getAccessToken(),
                result.getMember()
        );

        return ResponseEntity.ok()
                .header((HttpHeaders.SET_COOKIE), refreshCookie.toString())
                .body(response);
    }

    // 로그아웃
    @PostMapping("logout")
    public ResponseEntity<?> logout() {
        ResponseCookie deleteCookie = jwtService.createDeleteRefreshCookie();

        Map<String, Object> response = Map.of(
                "success", true,
                "message", "로그아웃되었습니다."
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body(response);
    }

    //
    @GetMapping("me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        String accessToken = authorization.substring(7);

        LoginMemberResponse loginMemberResponse = loginService.getLoginMember(accessToken);

        return ResponseEntity.ok(loginMemberResponse);
    }

}

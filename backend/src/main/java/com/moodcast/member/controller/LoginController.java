package com.moodcast.member.controller;

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

@RestController
@CrossOrigin(
        origins = {"http://localhost:5173", "http://127.0.0.1:5173"},
        allowCredentials = "true" // 쿠키 요청 응답
)
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
}

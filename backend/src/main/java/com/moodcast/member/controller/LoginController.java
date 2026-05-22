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
@CrossOrigin("*")
@RequestMapping(value="auth")
public class LoginController {
    @Autowired
    private LoginService loginService;

    // 로그인 검증 + 검증 성공 시 토큰 생성 
    @PostMapping("login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        LoginResult result = loginService.login(request);

        JwtService jwtService = new JwtService();

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

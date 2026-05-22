package com.moodcast.member.controller;

import com.moodcast.member.dto.login.LoginRequest;
import com.moodcast.member.dto.login.LoginResponse;
import com.moodcast.member.dto.login.LoginResult;
import com.moodcast.member.dto.login.UpdateProfileRequest;
import com.moodcast.member.dto.follow.FollowResponse;
import com.moodcast.member.dto.follow.FollowCheckResponse;
import com.moodcast.member.dto.follow.FollowItemResponse;
import com.moodcast.member.service.AuthService;
import com.moodcast.member.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(
        origins = {"http://localhost:5173", "http://127.0.0.1:5173"},
        allowCredentials = "true"
)
@RequestMapping("auth")
public class AuthController {
    @Autowired
    private AuthService authService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        LoginResult result = authService.login(request);

        ResponseCookie refreshCookie = ResponseCookie
                .from(jwtService.getRefreshCookieName(), result.getRefreshToken())
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofSeconds(jwtService.getRefreshTokenMaxAgeSeconds()))
                .build();

        LoginResponse response = new LoginResponse(
                true,
                "로그인되었습니다.",
                result.getAccessToken(),
                result.getMember()
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(response);
    }

    @GetMapping("me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "member", authService.getLoginMember(authorizationHeader)
                )
        );
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
                        "member", authService.updateProfile(authorizationHeader, request)
                )
        );
    }

    @GetMapping("member/{memberId}")
    public ResponseEntity<?> getMemberProfile(@PathVariable("memberId") Long memberId) {
        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "member", authService.getMemberById(memberId)
                )
        );
    }

    // 팔로우 토글
    @PostMapping("follow/{memberId}")
    public ResponseEntity<FollowResponse> toggleFollow(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable("memberId") Long memberId
    ) {
        return ResponseEntity.ok(authService.toggleFollow(authHeader, memberId));
    }

    // 팔로우 상태 및 카운트 조회
    @GetMapping("follow/status/{memberId}")
    public ResponseEntity<FollowCheckResponse> getFollowStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable("memberId") Long memberId
    ) {
        return ResponseEntity.ok(authService.getFollowStatus(authHeader, memberId));
    }

    @GetMapping("follow/followers/{memberId}")
    public ResponseEntity<List<FollowItemResponse>> getFollowers(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable("memberId") Long memberId
    ) {
        return ResponseEntity.ok(authService.getFollowerList(authHeader, memberId));
    }

    @GetMapping("follow/following/{memberId}")
    public ResponseEntity<List<FollowItemResponse>> getFollowing(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable("memberId") Long memberId
    ) {
        return ResponseEntity.ok(authService.getFollowingList(authHeader, memberId));
    }

    @PostMapping("logout")
    public ResponseEntity<?> logout() {
        ResponseCookie deleteCookie = ResponseCookie
                .from(jwtService.getRefreshCookieName(), "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body(
                        Map.of(
                                "success", true,
                                "message", "로그아웃되었습니다."
                        )
                );
    }
}

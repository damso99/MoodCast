package com.moodcast.member.controller;

import com.moodcast.member.dto.login.LoginRequest;
import com.moodcast.member.dto.login.LoginResponse;
import com.moodcast.member.dto.login.LoginResult;
import com.moodcast.member.dto.login.LoginMemberResponse;
import com.moodcast.member.dto.login.UpdateProfileRequest;
import com.moodcast.member.dto.follow.FollowResponse;
import com.moodcast.member.dto.follow.FollowCheckResponse;
import com.moodcast.member.dto.follow.FollowItemResponse;
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
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(response);
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

        // 찾으면 로그아웃 서비스 호출
        if (refreshToken != null && !refreshToken.isBlank()) {
            // 리프레시 토큰 있으면 삭제시킴
            loginService.logout(refreshToken);
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

        // 리프레시 토큰 찾았으니까 엑세스 토큰 재발급 요청
        LoginResult result = loginService.refreshAccessToken(refreshToken);

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

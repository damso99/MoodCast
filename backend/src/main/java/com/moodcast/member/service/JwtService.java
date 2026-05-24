package com.moodcast.member.service;

import com.moodcast.member.vo.Member;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String jwtSecret;                           // 서버 마스터키
    @Value("${jwt.issuer}")
    private String issuer;                              // 토큰 발급주체
    @Value("${jwt.access-token-expire-minutes}")
    private Long accessTokenExpireMinutes;              // 엑세스 토큰 만료시간
    @Value("${jwt.refresh-token-expire-days}")
    private Long refreshTokenExpireDays;                // 리프레시 토큰 만료시간
    @Value("${jwt.refresh-cookie-name}")
    private String refreshCookieName;                   // 리프레시 토큰 담을 쿠키 이름

    // JWT_SECRET 문자열을 byte 배열로 쪼갬 (jwtSecret.getBytes(StandardCharsets.UTF_8)
    // 암호화에 사용할 수 있는 진짜 key로 변환 Keys.hmacShaKeyFor(byte 배열)
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    // 로그인 성공 시 api 요청에 사용할 access token 생성
    public String createAccessToken(Member member) {
        Instant now = Instant.now(); // 현재시간
        Instant expiresAt = now.plus(accessTokenExpireMinutes, ChronoUnit.MINUTES); // 엑세스 토큰 만료시간 = 현재시간 + 엑세스 토큰 유효시간 (분)

        return Jwts.builder() // jwt 생성
                .issuer(issuer) // 발급 주체 세팅
                .subject(String.valueOf(member.getMemberId())) // 토큰의 핵심 -> 회원 pk 넣기
                .claim("type", "ACCESS") // Access 토큰 명시
                .claim("email", member.getEmail()) // 회원 이메일 넣기
                .claim("role", member.getRole()) // 회원 권한 넣기
                .issuedAt(Date.from(now))       // 발급시간
                .expiration(Date.from(expiresAt))       // 만료 시간
                .signWith(getSigningKey(), Jwts.SIG.HS256)  // 도장찍기
                .compact(); // 설정한 정보들을 긴 String 형태 (aaaa.bbbb.cccc)로 압축
    }

    // Access Token이 만료됐을 때 새 토큰을 받기 위한 Refresh Token 생성
    public String createRefreshToken(Member member) {
        Instant now = Instant.now();                                            // 현재시간
        Instant expiresAt = now.plus(refreshTokenExpireDays, ChronoUnit.DAYS);  // 리프레시 토큰 만료시간 = 현재시간 + 리프레시 토큰 유효시간 (일)

        return Jwts.builder()
                .issuer(issuer) // 발급 주체
                .subject(String.valueOf(member.getMemberId())) // 회원 pk 넣기
                .claim("type", "REFRESH")           // refresh 토큰 명시
                .issuedAt(Date.from(now))                       // 발급시간
                .expiration(Date.from(expiresAt))               // 만료시간
                .signWith(getSigningKey(), Jwts.SIG.HS256)      // 도장찍기
                .compact();                                     // 위에랑 똑같음
    }

    public String getRefreshCookieName() {
        return refreshCookieName;
    }

    public long getRefreshTokenMaxAgeSeconds() {
        return refreshTokenExpireDays * 24 * 60 * 60;       // 14일 24시간 60분 60초 초단위로 변경
    }


    public ResponseCookie createRefreshCookie(String refreshToken) {
        return ResponseCookie
                .from(refreshCookieName, refreshToken) // 쿠키 이름, 리프레시 토큰 세팅
                .httpOnly(true) // 핵심 자바스크립트로 이 쿠키에 접근 불가능
                .secure(false) // https 환경에서만 쿠키를 전송할지 설정,  !배포 HTTPS에서는 true로 바꿔야 함.
                .sameSite("Lax") // CSRF 공격 방어, 다른 도메인에서 오는 요청에는 쿠키 안보냄
                .path("/") // 모든 경로
                .maxAge(Duration.ofSeconds(getRefreshTokenMaxAgeSeconds())) // 쿠키 수명 설정
                .build(); // 위 세팅으로 조립
    }



}

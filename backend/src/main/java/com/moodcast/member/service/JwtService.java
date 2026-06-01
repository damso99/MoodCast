package com.moodcast.member.service;

import com.moodcast.member.vo.Member;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
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
    private String jwtSecret;

    @Value("${jwt.issuer}")
    private String issuer;

    @Value("${jwt.access-token-expire-minutes}")
    private Long accessTokenExpireMinutes;

    @Value("${jwt.refresh-token-expire-days}")
    private Long refreshTokenExpireDays;

    @Value("${jwt.refresh-cookie-name}")
    private String refreshCookieName;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(Member member) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(accessTokenExpireMinutes, ChronoUnit.MINUTES);

        return Jwts.builder()
                .issuer(issuer)
                .subject(String.valueOf(member.getMemberId()))
                .claim("type", "ACCESS")
                .claim("email", member.getEmail())
                .claim("role", member.getRole())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    // memberId + tokenId
    // pc접속중 모바일로 접속했을때 토큰을 덮어쓰지 않게 하려고 수정함
    public String createRefreshToken(Member member, String tokenId) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(refreshTokenExpireDays, ChronoUnit.DAYS);

        return Jwts.builder()
                .issuer(issuer)
                .subject(String.valueOf(member.getMemberId()))
                .claim("type", "REFRESH")
                .claim("tokenId", tokenId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    public Long getMemberIdFromAccessToken(String accessToken) {
        if (accessToken == null || accessToken.trim().isEmpty()) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        try {
            Claims claims = parseToken(accessToken);
            String tokenType = claims.get("type", String.class);

            if (!"ACCESS".equals(tokenType)) {
                throw new IllegalArgumentException("로그인이 필요합니다.");
            }

            return Long.parseLong(claims.getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
    }

    private Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getRefreshCookieName() {
        return refreshCookieName;
    }

    public long getRefreshTokenMaxAgeSeconds() {
        return refreshTokenExpireDays * 24 * 60 * 60;
    }

    public ResponseCookie createRefreshCookie(String refreshToken) {
        return ResponseCookie
                .from(refreshCookieName, refreshToken)
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofSeconds(getRefreshTokenMaxAgeSeconds()))
                .build();
    }

    public ResponseCookie createDeleteRefreshCookie() {
        return ResponseCookie
                .from(refreshCookieName, "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
    }

    // refresh 토큰 검증 및 memberId 꺼내서 리턴
    public Long getMemberIdFromRefreshToken(String refreshToken) {
        // 토큰 유무 및 공백 검증
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        try {
            // 토큰 파싱
            Claims claims = parseToken(refreshToken);
            // 토큰 타입 꺼내기
            String tokenType = claims.get("type", String.class);

            // 토큰 타입이 REFRESH인지 체크
            // npe 방어
            if (!"REFRESH".equals(tokenType)) {
                throw new IllegalArgumentException("로그인이 필요합니다.");
            }

            return Long.parseLong(claims.getSubject());

            // 통합 예외처리 (구체적인 원인은 안알려줌)
        } catch (JwtException | IllegalArgumentException e) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
    }

    public String getTokenIdFromRefreshToken(String refreshToken) {
        // 토큰 유무 및 공백 검증
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        try {
            // 토큰 파싱
            Claims claims = parseToken(refreshToken);
            // 토큰 타입 꺼내기
            String tokenType = claims.get("type", String.class);

            // 토큰 타입이 REFRESH인지 체크
            // npe 방어
            if (!"REFRESH".equals(tokenType)) {
                throw new IllegalArgumentException("로그인이 필요합니다.");
            }

            String tokenId = claims.get("tokenId", String.class);

            if (tokenId == null || tokenId.trim().isEmpty()) {
                throw new IllegalArgumentException("로그인이 필요합니다.");
            }

            return tokenId;

            // 통합 예외처리 (구체적인 원인은 안알려줌)
        } catch (JwtException | IllegalArgumentException e) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
    }
}

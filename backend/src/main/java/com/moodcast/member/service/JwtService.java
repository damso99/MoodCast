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

    public String createRefreshToken(Member member) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(refreshTokenExpireDays, ChronoUnit.DAYS);

        return Jwts.builder()
                .issuer(issuer)
                .subject(String.valueOf(member.getMemberId()))
                .claim("type", "REFRESH")
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
}

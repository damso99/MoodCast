package com.moodcast.member.service;

import com.moodcast.member.dao.AuthDao;
import com.moodcast.member.dto.follow.FollowCheckResponse;
import com.moodcast.member.dto.follow.FollowItemResponse;
import com.moodcast.member.dto.follow.FollowResponse;
import com.moodcast.member.dto.login.LoginMemberResponse;
import com.moodcast.member.dto.login.LoginRequest;
import com.moodcast.member.dto.login.LoginResult;
import com.moodcast.member.dto.login.UpdateProfileRequest;
import com.moodcast.member.vo.Member;
import io.jsonwebtoken.JwtException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class AuthService {
    @Autowired
    private AuthDao authDao;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private String normalizeEmail(String email) {
        if (email == null) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }

        email = email.trim().toLowerCase();

        if (email.isEmpty()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("이메일 형식이 올바르지 않습니다.");
        }

        return email;
    }

    private String checkPasswordInput(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("비밀번호를 입력해주세요.");
        }

        return password;
    }

    private void checkLoginAllowed(Member member) {
        if (!"ACTIVE".equals(member.getStatus()) || member.getDeletedAt() != null) {
            throw new IllegalArgumentException("로그인할 수 없는 계정입니다.");
        }

        if (!Integer.valueOf(1).equals(member.getEmailVerified())) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않은 계정입니다.");
        }

        if (!Integer.valueOf(1).equals(member.getPhoneVerified())) {
            throw new IllegalArgumentException("휴대폰 인증이 완료되지 않은 계정입니다.");
        }
    }

    private LoginMemberResponse toLoginMemberResponse(Member member) {
        return new LoginMemberResponse(
                member.getMemberId(),
                member.getEmail(),
                member.getName(),
                member.getNickname(),
                member.getProfileImageUrl(),
                member.getBio(),
                member.getRole()
        );
    }

    @Transactional
    public LoginResult login(LoginRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("로그인 정보를 입력해주세요.");
        }

        String email = normalizeEmail(request.getEmail());
        String password = checkPasswordInput(request.getPassword());

        Member member = authDao.findMemberByEmail(email);

        if (member == null || member.getPasswordHash() == null) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        boolean matches = passwordEncoder.matches(password, member.getPasswordHash());
        if (!matches) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        checkLoginAllowed(member);

        int result = authDao.updateLastLoginAt(member.getMemberId());
        if (result != 1) {
            throw new IllegalStateException("로그인 처리에 실패했습니다.");
        }

        String accessToken = jwtService.createAccessToken(member);
        String refreshToken = jwtService.createRefreshToken(member);

        return new LoginResult(accessToken, refreshToken, toLoginMemberResponse(member));
    }

    public LoginMemberResponse getLoginMember(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        String accessToken = authorizationHeader.substring(7).trim();

        if (accessToken.isEmpty()) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        try {
            Long memberId = jwtService.getMemberIdFromAccessToken(accessToken);
            Member member = authDao.findMemberById(memberId);

            if (member == null) {
                throw new IllegalArgumentException("로그인 정보를 찾을 수 없습니다.");
            }

            checkLoginAllowed(member);

            return toLoginMemberResponse(member);
        } catch (JwtException | IllegalArgumentException e) {
            throw new IllegalArgumentException("로그인이 만료되었습니다. 다시 로그인해주세요.");
        }
    }

    public LoginMemberResponse getMemberById(Long memberId) {
        Member member = authDao.findMemberById(memberId);
        if (member == null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }
        return toLoginMemberResponse(member);
    }

    @Transactional
    public LoginMemberResponse updateProfile(String authorizationHeader, UpdateProfileRequest request) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        String accessToken = authorizationHeader.substring(7).trim();
        if (accessToken.isEmpty()) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        if (request == null || request.getNickname() == null || request.getNickname().trim().isEmpty()) {
            throw new IllegalArgumentException("닉네임을 입력해주세요.");
        }

        try {
            Long memberId = jwtService.getMemberIdFromAccessToken(accessToken);
            Member member = authDao.findMemberById(memberId);

            if (member == null) {
                throw new IllegalArgumentException("로그인 정보를 찾을 수 없습니다.");
            }

            checkLoginAllowed(member);

            authDao.updateMemberProfile(memberId, request.getNickname().trim(), request.getBio());

            Member updated = authDao.findMemberById(memberId);
            if (updated == null) {
                throw new IllegalStateException("프로필 정보를 불러올 수 없습니다.");
            }

            return toLoginMemberResponse(updated);
        } catch (JwtException | IllegalArgumentException e) {
            throw new IllegalArgumentException("로그인이 만료되었습니다. 다시 로그인해주세요.");
        }
    }

    @Transactional
    public FollowResponse toggleFollow(String authHeader, Long followingId) {
        Long followerId = getMemberIdFromHeader(authHeader);
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("자기 자신을 팔로우할 수 없습니다.");
        }

        boolean isFollowing = authDao.isFollowing(followerId, followingId) > 0;
        System.out.println("DEBUG: followerId=" + followerId + ", followingId=" + followingId + ", currentlyIsFollowing=" + isFollowing);
        
        if (isFollowing) {
            authDao.unfollow(followerId, followingId);
            boolean stillFollowing = authDao.isFollowing(followerId, followingId) > 0;
            System.out.println("DEBUG: After unfollow, stillFollowing=" + stillFollowing);
            return new FollowResponse(true, "팔로우가 취소되었습니다.", false);
        } else {
            authDao.follow(followerId, followingId);
            boolean nowFollowing = authDao.isFollowing(followerId, followingId) > 0;
            System.out.println("DEBUG: After follow, nowFollowing=" + nowFollowing);
            return new FollowResponse(true, "팔로우되었습니다.", true);
        }
    }

    public FollowCheckResponse getFollowStatus(String authHeader, Long targetMemberId) {
        Long currentMemberId = 0L;
        try {
            currentMemberId = getMemberIdFromHeader(authHeader);
        } catch (Exception ignored) {}

        boolean following = false;
        if (currentMemberId > 0 && !currentMemberId.equals(targetMemberId)) {
            following = authDao.isFollowing(currentMemberId, targetMemberId) > 0;
        }

        long followerCount = authDao.countFollowers(targetMemberId);
        long followingCount = authDao.countFollowing(targetMemberId);
        long postCount = authDao.countPosts(targetMemberId);
        long savedCount = authDao.countSavedPosts(targetMemberId);

        return new FollowCheckResponse(true, following, followerCount, followingCount, postCount, savedCount);
    }

    public List<FollowItemResponse> getFollowerList(String authHeader, Long targetId) {
        Long loginId = 0L;
        try { loginId = getMemberIdFromHeader(authHeader); } catch (Exception ignored) {}
        return authDao.getFollowerList(targetId, loginId);
    }

    public List<FollowItemResponse> getFollowingList(String authHeader, Long targetId) {
        Long loginId = 0L;
        try { loginId = getMemberIdFromHeader(authHeader); } catch (Exception ignored) {}
        return authDao.getFollowingList(targetId, loginId);
    }

    private Long getMemberIdFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        String token = authHeader.substring(7).trim();
        return jwtService.getMemberIdFromAccessToken(token);
    }
}

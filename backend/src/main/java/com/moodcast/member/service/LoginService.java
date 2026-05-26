package com.moodcast.member.service;

import com.moodcast.member.dao.LoginDao;
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

@Service
public class LoginService {
    @Autowired
    private LoginDao loginDao;

    @Autowired
    private MemberValidationService memberValidationService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    // 비밀번호 null, 빈값 체크
    private String checkPasswordInput(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("비밀번호를 입력해주세요");
        }

        return password;
    }

    // 회원이 로그인 가능한 상태인지 체크
    // 인증 미완료, 탈퇴, 정지 체크
    private void checkLoginAllowed(Member member) {
        if ("SUSPENDED".equals(member.getStatus())) {
            throw new IllegalArgumentException("정지된 계정입니다.");
        }

        if ("WITHDRAW".equals(member.getStatus()) || member.getDeletedAt() != null) {
            throw new IllegalArgumentException("탈퇴한 계정입니다.");
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

        String email = memberValidationService.normalizeEmail(request.getEmail());
        String password = checkPasswordInput(request.getPassword());

        Member member = loginDao.findMemberByEmail(email);
        String passwordHash = loginDao.findPasswordHashByEmail(email);

        if (member == null || passwordHash == null || passwordHash.trim().isEmpty()) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        boolean matches = passwordEncoder.matches(password, passwordHash);
        if (!matches) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        checkLoginAllowed(member);

        int result = loginDao.updateLastLoginAt(member.getMemberId());
        if (result <= 0) {
            throw new IllegalStateException("로그인 처리에 실패했습니다.");
        }

        String accessToken = jwtService.createAccessToken(member);
        String refreshToken = jwtService.createRefreshToken(member);
        LoginMemberResponse loginMemberResponse = toLoginMemberResponse(member);

        LoginResult loginResult = new LoginResult(
                accessToken,
                refreshToken,
                loginMemberResponse
        );

        return loginResult;
    }

    public LoginMemberResponse getLoginMember(String accessToken) {
        if (accessToken == null || accessToken.trim().isEmpty()) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Long memberId = jwtService.getMemberIdFromAccessToken(accessToken);
        Member member = loginDao.findMemberById(memberId);

        if (member == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        checkLoginAllowed(member);

        LoginMemberResponse loginMemberResponse = toLoginMemberResponse(member);

        return loginMemberResponse;
    }

    public LoginMemberResponse getLoginMemberByHeader(String authorizationHeader) {
        String accessToken = extractAccessToken(authorizationHeader);

        return getLoginMember(accessToken);
    }

    public LoginMemberResponse getMemberById(Long memberId) {
        Member member = loginDao.findMemberById(memberId);
        if (member == null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }
        return toLoginMemberResponse(member);
    }

    public Long getMemberIdFromHeaderOptional(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String accessToken = authHeader.substring(7).trim();
        if (accessToken.isEmpty()) {
            return null;
        }
        try {
            return jwtService.getMemberIdFromAccessToken(accessToken);
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
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
            Member member = loginDao.findMemberById(memberId);

            if (member == null) {
                throw new IllegalArgumentException("로그인 정보를 찾을 수 없습니다.");
            }

            checkLoginAllowed(member);

            loginDao.updateMemberProfile(memberId, request.getNickname().trim(), request.getBio());

            Member updated = loginDao.findMemberById(memberId);
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

        boolean isFollowing = loginDao.isFollowing(followerId, followingId) > 0;
        if (isFollowing) {
            loginDao.unfollow(followerId, followingId);
            return new FollowResponse(true, "팔로우가 취소되었습니다.", false);
        } else {
            loginDao.follow(followerId, followingId);
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
            following = loginDao.isFollowing(currentMemberId, targetMemberId) > 0;
        }

        long followerCount = loginDao.countFollowers(targetMemberId);
        long followingCount = loginDao.countFollowing(targetMemberId);
        long postCount = loginDao.countPosts(targetMemberId);
        long savedCount = loginDao.countSavedPosts(targetMemberId);

        // 감정 공감률 계산: 내가 쓴 게시물에 대한 좋아요 비율임
        // 좋아요, 댓글, 저장을 모두 반응으로 보고, 그중 좋아요 비율을 퍼센트로 계산함
        long likes = authDao.countPostLikes(targetMemberId);
        long comments = authDao.countPostComments(targetMemberId);
        long saves = authDao.countPostSaves(targetMemberId);
        long totalReactions = likes + comments + saves;
        int emotionEmpathyRate = totalReactions == 0 ? 0 : (int) Math.round((double) likes * 100 / totalReactions);

        // 주간 반응 계산: 최근 7일간 내 게시물에 달린 좋아요/댓글/저장 수 합임
        long weeklyReactions = authDao.countWeeklyPostReactions(targetMemberId);

        return new FollowCheckResponse(true, following, followerCount, followingCount, postCount, savedCount, emotionEmpathyRate, weeklyReactions);
    }

    public List<FollowItemResponse> getFollowerList(String authHeader, Long targetId) {
        Long loginId = 0L;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                loginId = getMemberIdFromHeader(authHeader);
                System.out.println("DEBUG: getFollowerList - loginId found: " + loginId);
            } catch (Exception e) {
                System.out.println("DEBUG: getFollowerList - invalid token: " + e.getMessage());
            }
        } else {
            System.out.println("DEBUG: getFollowerList - NO AUTH HEADER RECEIVED");
        }
        return loginDao.getFollowerList(targetId, loginId);
    }

    public List<FollowItemResponse> getFollowingList(String authHeader, Long targetId) {
        Long loginId = 0L;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                loginId = getMemberIdFromHeader(authHeader);
                System.out.println("DEBUG: getFollowingList - loginId found: " + loginId);
            } catch (Exception e) {
                System.out.println("DEBUG: getFollowingList - invalid token: " + e.getMessage());
            }
        } else {
            System.out.println("DEBUG: getFollowingList - NO AUTH HEADER RECEIVED");
        }
        return loginDao.getFollowingList(targetId, loginId);
    }

    private Long getMemberIdFromHeader(String authHeader) {
        String token = extractAccessToken(authHeader);

        return jwtService.getMemberIdFromAccessToken(token);
    }

    private String extractAccessToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        String token = authHeader.substring(7).trim();

        if (token.isEmpty()) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        return token;
    }
}

package com.moodcast.member.service;

import com.moodcast.member.dao.LoginDao;
import com.moodcast.member.dto.login.LoginMemberResponse;
import com.moodcast.member.dto.login.LoginRequest;
import com.moodcast.member.dto.login.LoginResponse;
import com.moodcast.member.dto.login.LoginResult;
import com.moodcast.member.vo.Member;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    // 인증 미완료, 탈퇴,정지 체크
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

    // 로그인 성공 시 응답 dto
    private LoginMemberResponse toLoginMemberResponse(Member member) {
        return new LoginMemberResponse(
                member.getMemberId(),
                member.getEmail(),
                member.getName(),
                member.getNickname(),
                member.getProfileImageUrl(),
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

        LoginMemberResponse loginMemberResponse = toLoginMemberResponse(member);

        String accessToken = jwtService.createAccessToken(member); // 엑세스 토큰 생성
        String refreshToken = jwtService.createRefreshToken(member); // 리프레시 토큰 생성

        LoginResult loginResult = new LoginResult(
                accessToken,
                refreshToken,
                loginMemberResponse
        );

        return loginResult;
    }
}

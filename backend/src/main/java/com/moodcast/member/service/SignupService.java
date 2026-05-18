package com.moodcast.member.service;

import com.moodcast.member.dao.SignupDao;
import com.moodcast.member.vo.AuthCode;
import jakarta.validation.constraints.Email;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.regex.Pattern;

@Service
public class SignupService {
    @Autowired
    private SignupDao signupDao;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private EmailService emailService;

    // 이메일 정규식
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // 이메일 기본 검증 메서드
    private String normalizeEmail(String email) {
        if (email == null) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }
        // 공백제거, 소문자로 변경
        email = email.trim().toLowerCase();
        if (email.isEmpty()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("이메일 형식이 올바르지 않습니다.");
        }
        return email;
    }

    // 이메일 중복 검증 메서드
    private void checkEmailDuplicate(String email) {
        int emailCount = signupDao.countByEmail(email);

        if (emailCount > 0) {
            throw new IllegalArgumentException("이미 사용중인 이메일입니다.");
        }
    }

    // 인증코드 체크 메서드
    private void checkAuthCode(AuthCode lastAuthCode, String authCode) {
        if (authCode == null || authCode.trim().isEmpty()) {
            throw new IllegalArgumentException("인증번호를 입력해주세요.");
        }
        authCode = authCode.trim();

        if (!authCode.matches("^[0-9]{6}$")) {
            throw new IllegalArgumentException("인증번호는 숫자 6자리입니다.");
        }
        if (lastAuthCode == null) {
            throw new IllegalArgumentException("요청된 인증번호가 없습니다. 인증번호를 다시 요청해주세요.");
        }
        if (lastAuthCode.getUsedAt() != null) {
            throw new IllegalArgumentException("이미 사용된 인증번호입니다. 인증번호를 다시 요청해주세요.");
        }
        if (lastAuthCode.getVerifiedAt() != null) {
            throw new IllegalArgumentException("이미 인증이 완료된 인증번호입니다.");
        }
        if (LocalDateTime.now().isAfter(lastAuthCode.getExpiresAt())) {
            throw new IllegalArgumentException("인증번호가 만료되었습니다. 인증번호를 다시 요청해주세요.");
        }
        if (lastAuthCode.getAttemptCount() >= 5) {
            throw new IllegalArgumentException("인증번호 입력 횟수를 초과했습니다. 인증번호를 다시 요청해주세요.");
        }

        boolean matches = passwordEncoder.matches(authCode, lastAuthCode.getCodeHash());
        if (!matches) {
            int result = signupDao.incrementAttempt(lastAuthCode.getAuthCodeId());
            throw new IllegalArgumentException("인증번호가 올바르지 않습니다.");
        }
    }


    // 랜덤 난수 생성 -> 문자열로 리턴 메서드
    private String createAuthCode() {
        int number = SECURE_RANDOM.nextInt(900000) + 100000;
        return String.valueOf(number);
    }


    // 이메일 인증코드
    public String sendEmailAuthCode(String email) {
        email = normalizeEmail(email);

        checkEmailDuplicate(email);

        AuthCode lastAuthCode = signupDao.findLastAuthCode(email);

        if (lastAuthCode != null) {
            if (LocalDateTime.now().isBefore(lastAuthCode.getCreatedAt().plusSeconds(60))) {
                throw new IllegalArgumentException("인증번호 요청 후 60초 이후 재요청이 가능합니다.");
            }
        }

        String authCode = createAuthCode();
        String hashCode = passwordEncoder.encode(authCode);

        AuthCode authCodeInfo = new AuthCode();
        authCodeInfo.setMemberId(null);
        authCodeInfo.setTargetType("EMAIL");
        authCodeInfo.setTargetValue(email);
        authCodeInfo.setPurpose("SIGNUP");
        authCodeInfo.setCodeHash(hashCode);
        authCodeInfo.setExpiresAt(LocalDateTime.now().plusMinutes(3));
        authCodeInfo.setAttemptCount(0);

        int result = signupDao.insertAuthCode(authCodeInfo);

        if (result != 1) {
            throw new IllegalStateException("인증코드 저장에 실패했습니다.");
        }

        emailService.sendSignupAuthCode(email, authCode);

        return email;
    }



    public void verifyEmailAuthCode(String email, String authCode) {
        email = normalizeEmail(email);
        AuthCode lastAuthCode = signupDao.findLastAuthCode(email);

        checkAuthCode(lastAuthCode, authCode);

        int result = signupDao.updateEmailVerifiedAt(lastAuthCode.getAuthCodeId());
        if (result != 1) {
            throw new IllegalStateException("이메일 인증 처리에 실패했습니다.");
        }
    }
}

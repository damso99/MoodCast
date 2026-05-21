package com.moodcast.member.service;

import com.moodcast.member.dao.SignupDao;
import com.moodcast.member.vo.AuthCode;
import jakarta.validation.constraints.Email;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    @Autowired
    private PhoneService phoneService;

    private Integer testSendCount = 100;

    // 이메일 정규식
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    // 전화번호 정규식 - 010만 허용 010포함 11자리 고정
    private static final Pattern PHONE_PATTERN = Pattern.compile("^010[0-9]{8}$");

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

    // 전화번호 기본 검증 메서드
    private String normalizePhone(String phone) {
        if (phone == null) {
            throw new IllegalArgumentException("전화번호를 입력해주세요.");
        }
        phone = phone.trim();
        if (phone.isEmpty()) {
            throw new IllegalArgumentException("전화번호를 입력해주세요.");
        }
        if (!PHONE_PATTERN.matcher(phone).matches()) {
            throw new IllegalArgumentException("전화번호 형식이 올바르지 않습니다.");
        }
        return phone;
    }

    // 이메일 중복 검증 메서드
    private void checkEmailDuplicate(String email) {
        int emailCount = signupDao.countByEmail(email);

        if (emailCount > 0) {
            throw new IllegalArgumentException("이미 사용중인 이메일입니다.");
        }
    }

    // 전화번호 중복 검증 메서드
    public void checkPhoneDuplicate(String phone) {
        int phoneCount = signupDao.countByPhone(phone);
        if (phoneCount > 0) {
            throw new IllegalArgumentException("이미 사용중인 전화번호입니다.");
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

    // 인증번호 재요청 시간 체크 메서드
    private void reSendAuthCode(AuthCode lastAuthCode) {
        if (lastAuthCode != null &&
                LocalDateTime.now().isBefore(lastAuthCode.getCreatedAt().plusSeconds(60))) {
            throw new IllegalArgumentException("인증번호 요청 후 60초 이후 재요청이 가능합니다.");
        }
    }

    // 인증번호 일일 발송 횟수 체크 메서드
    private void checkAuthCodeSendLimit(String targetType, String targetValue, String purpose) {
        LocalDateTime from = LocalDateTime.now().minusDays(1);

        int sendCount = signupDao.countAuthCodeSend(targetType, targetValue, purpose, from);
        if (sendCount >= testSendCount) {
            throw new IllegalArgumentException("일일 인증번호 발송 횟수를 초과했습니다.");
        }
    }

    // 이메일 인증코드
    @Transactional
    public String sendEmailAuthCode(String email) {
        email = normalizeEmail(email);

        checkEmailDuplicate(email);

        AuthCode lastAuthCode = signupDao.findLastAuthCode("EMAIL", email, "SIGNUP");

        reSendAuthCode(lastAuthCode);

        checkAuthCodeSendLimit("EMAIL", email, "SIGNUP");

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

    // 휴대폰 인증코드
    @Transactional
    public String sendPhoneAuthCode(String phone) {
        phone = normalizePhone(phone);
        checkPhoneDuplicate(phone);
        AuthCode lastAuthCode = signupDao.findLastAuthCode("PHONE", phone, "SIGNUP");

        reSendAuthCode(lastAuthCode);
        checkAuthCodeSendLimit("PHONE", phone, "SIGNUP");

        String authCode = createAuthCode();
        String hashCode = passwordEncoder.encode(authCode);

        AuthCode authCodeInfo = new AuthCode();
        authCodeInfo.setMemberId(null);
        authCodeInfo.setTargetType("PHONE");
        authCodeInfo.setTargetValue(phone);
        authCodeInfo.setPurpose("SIGNUP");
        authCodeInfo.setCodeHash(hashCode);
        authCodeInfo.setExpiresAt(LocalDateTime.now().plusMinutes(3));
        authCodeInfo.setAttemptCount(0);

        int result = signupDao.insertAuthCode(authCodeInfo);
        if (result != 1) {
            throw new IllegalStateException("인증코드 저장에 실패했습니다.");
        }

        // phoneService.sendSignupAuthCode(phone, authCode); 포인트 없어서 일단 주석
        System.out.println("휴대폰 인증번호: " + authCode);
        return phone;
    }

    // 이메일 인증코드 확인
    // IllegalArgumentException 예외는 사용자 문제이므로 롤백 대상에서 제외
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public void verifyEmailAuthCode(String email, String authCode) {
        email = normalizeEmail(email);
        AuthCode lastAuthCode = signupDao.findLastAuthCode("EMAIL", email, "SIGNUP");

        checkAuthCode(lastAuthCode, authCode);

        int result = signupDao.updateVerifiedAt(lastAuthCode.getAuthCodeId());
        if (result != 1) {
            throw new IllegalStateException("이메일 인증 처리에 실패했습니다.");
        }
    }

    // 휴대폰 인증코드 확인
    @Transactional(noRollbackFor = IllegalArgumentException.class)
    public void verifyPhoneAuthCode(String phone, String authCode) {
        phone = normalizePhone(phone);
        AuthCode lastAuthCode = signupDao.findLastAuthCode("PHONE", phone, "SIGNUP");

        checkAuthCode(lastAuthCode, authCode);

        int result = signupDao.updateVerifiedAt(lastAuthCode.getAuthCodeId());
        if (result != 1) {
            throw new IllegalStateException("휴대폰 인증 처리에 실패했습니다.");
        }
    }

    // 이메일 기본검사, 중복여부
    public boolean checkEmailAvailable(String email) {
        email = normalizeEmail(email);
        int emailCount = signupDao.countByEmail(email);
        return emailCount == 0;
    }
}

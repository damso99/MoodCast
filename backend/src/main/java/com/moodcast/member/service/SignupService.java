package com.moodcast.member.service;

import com.moodcast.member.dao.SignupDao;
import com.moodcast.member.dto.signup.SignupRequest;
import com.moodcast.member.dto.signup.SignupTermsAgreementRequest;
import com.moodcast.member.vo.AuthCode;
import com.moodcast.member.vo.Member;
import com.moodcast.member.vo.Terms;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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

    // 이름 정규식 (실명 한글만 2~10자)
    private static final Pattern NAME_PATTERN = Pattern.compile("^[가-힣]{2,10}$");

    // 닉네임 정규식 (한글 영대소문자 숫자 2~12자)
    private static final Pattern NICKNAME_PATTERN = Pattern.compile("^[가-힣A-Za-z0-9]{2,12}$");

    // 비밀번호 정규식
    // (?=.*[A-Za-z]) 영문자 필수 포함
    // (?=.*\d) 숫자 필수 포함
    // (?=.*[?!@#$%^&*]) 특수문자 ?!@#$%^&* 중 하나 필수포함
    // [A-Za-z\d?!@#$%^&*] 이 문자들 외에 전부 차단
    // {8,20} 최소 8자 최대 20자
    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[?!@#$%^&*])[A-Za-z\\d?!@#$%^&*]{8,20}$");

    // 전화번호 정규식 - 010만 허용 010포함 11자리 고정
    private static final Pattern PHONE_PATTERN = Pattern.compile("^010[0-9]{8}$");

    // 랜덤 난수
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

    // 이름 (실명) 기본검증 메서드
    private String normalizeName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("이름을 입력해주세요.");
        }

        name = name.trim();

        if (!NAME_PATTERN.matcher(name).matches()) {
            throw new IllegalArgumentException("이름은 한글 2~10자로 입력해주세요.");
        }

        return name;
    }

    // 닉네임 기본 검증 메서드
    private String normalizeNickname(String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            return null;
        }

        nickname = nickname.trim();

        if (!NICKNAME_PATTERN.matcher(nickname).matches()) {
            throw new IllegalArgumentException("닉네임은 한글, 영문, 숫자 2~12자로 입력해주세요.");
        }

        return nickname;
    }

    // 비밀번호 기본 검증 + 일치여부
    private void checkPassword(String password, String passwordConfirm) {
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("비밀번호를 입력해주세요.");
        }

        if (!PASSWORD_PATTERN.matcher(password).matches()) {
            throw new IllegalArgumentException("비밀번호는 영문, 숫자, 특수문자를 포함한 8~20자입니다.");
        }

        if (passwordConfirm == null || passwordConfirm.trim().isEmpty()) {
            throw new IllegalArgumentException("비밀번호 확인을 입력해주세요.");
        }

        if (!password.equals(passwordConfirm)) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }
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

    // 닉네임 중복 검증 메서드
    public void checkNicknameDuplicate(String nickname) {
        int nicknameCount = signupDao.countByNickname(nickname);
        if (nicknameCount > 0) {
            throw new IllegalArgumentException("이미 사용중인 닉네임입니다.");
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
            if (result != 1) {
                throw new IllegalStateException("인증번호 확인 처리에 실패했습니다. 500 Server");
            }
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

    // 이메일 인증 완료여부
    private void checkEmailVerified(String email) {
        int verifiedCount = signupDao.countVerifiedEmailAuthCode(email);

        if (verifiedCount == 0) {
            throw new IllegalArgumentException("이메일 인증 시간이 만료되었습니다. 다시 인증해주세요");
        }
    }

    // 휴대폰 인증 완료여부
    private void checkPhoneVerified(String phone) {
        int verifiedCount = signupDao.countVerifiedPhoneAuthCode(phone);

        if (verifiedCount == 0) {
            throw new IllegalArgumentException("휴대폰 인증 시간이 만료되었습니다. 다시 인증해주세요");
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
            throw new IllegalStateException("인증코드 저장에 실패했습니다. 500 Server");
        }

        try {
            emailService.sendSignupAuthCode(email, authCode);
        } catch (MailException e) { // 메일 서버 인증 실패, SMTP 문제, 계정 문제, 수신 주소 문제 등등 Spring Mail 계열 에러
            throw new IllegalStateException("이메일 발송에 실패했습니다. 500 Server");
        } catch (IllegalStateException e) {
            throw new IllegalStateException("이메일 발송 중 오류가 발생했습니다. 500 Server");
        }


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
            throw new IllegalStateException("인증코드 저장에 실패했습니다. 500 Server");
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
            throw new IllegalStateException("이메일 인증 처리에 실패했습니다. 500 Server");
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
            throw new IllegalStateException("휴대폰 인증 처리에 실패했습니다. 500 Server");
        }
    }

    // 이메일 기본검사, 중복여부
    public boolean checkEmailAvailable(String email) {
        email = normalizeEmail(email);
        int emailCount = signupDao.countByEmail(email);
        return emailCount == 0;
    }

    // 닉네임 기본검사, 중복여부
    public boolean checkNicknameAvailable(String nickname) {
        nickname = normalizeNickname(nickname);

        if (nickname == null) {
            return true;
        }

        int nicknameCount = signupDao.countByNickname(nickname);
        return nicknameCount == 0;
    }

    public List<Terms> getActiveTerms() {
        return signupDao.findActiveTerms();
    }

    // 필수 약관 동의 여부 검증
    private void checkRequiredTermsAgreed(List<SignupTermsAgreementRequest> agreements) {
        if (agreements == null || agreements.isEmpty()) {
            throw new IllegalArgumentException("필수 약관에 동의해주세요.");
        }

        List<Terms> requiredTerms = signupDao.findRequiredTerms();
        if (requiredTerms.isEmpty()) {
            throw new IllegalStateException("필수 약관 정보를 찾을 수 없습니다.");
        }

        Set<Long> agreedTermsIds = new HashSet<>();

        for (SignupTermsAgreementRequest agreement : agreements) {
            if (agreement.getTermsId() == null) {
                throw new IllegalArgumentException("약관 정보가 올바르지 않습니다.");
            }

            if (Boolean.TRUE.equals(agreement.getAgreed())) {
                agreedTermsIds.add(agreement.getTermsId());
            }
        }

        for (Terms requiredTerm : requiredTerms) {
            if (!agreedTermsIds.contains(requiredTerm.getTermsId())) {
                throw new IllegalArgumentException("필수 약관에 동의해주세요.");
            }
        }
    }

    // 회원 약관 동의 기록 저장
    private void insertTermsAgreements(Long memberId, List<SignupTermsAgreementRequest> agreements) {
        if (agreements == null || agreements.isEmpty()) {
            throw new IllegalArgumentException("약관 동의 정보가 없습니다.");
        }

        for (SignupTermsAgreementRequest agreement : agreements) {
            if (agreement.getTermsId() == null) {
                throw new IllegalArgumentException("약관 정보가 올바르지 않습니다.");
            }

            Integer agreed = Boolean.TRUE.equals(agreement.getAgreed()) ? 1 : 0;
            int result = signupDao.insertMemberTermsAgreement(memberId, agreement.getTermsId(), agreed);

            if (result != 1) {
                throw new IllegalStateException("약관 동의 저장에 실패했습니다.");
            }
        }
    }

    // 회원가입 step1 검증
    public void validateBasic(String name, String nickname, String email, String password, String passwordConfirm) {
        normalizeName(name);
        nickname = normalizeNickname(nickname);
        email = normalizeEmail(email);
        checkPassword(password, passwordConfirm);
        if (nickname != null) {
            checkNicknameDuplicate(nickname);
        }
        checkEmailVerified(email);
    }

    // 회원가입 step2 검증
    public void validatePhone(String phone) {
        phone = normalizePhone(phone);
        checkPhoneDuplicate(phone);
        checkPhoneVerified(phone);
    }

    // 회원가입 최종 검증
    @Transactional
    public void completeSignup(SignupRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("회원가입 정보가 없습니다.");
        }

        String name = normalizeName(request.getName());
        String nickname = normalizeNickname(request.getNickname());
        String email = normalizeEmail(request.getEmail());
        String phone = normalizePhone(request.getPhone());

        checkPassword(request.getPassword(), request.getPasswordConfirm());

        checkEmailDuplicate(email);
        checkPhoneDuplicate(phone);

        if (nickname != null) {
            checkNicknameDuplicate(nickname);
        }

        checkEmailVerified(email);
        checkPhoneVerified(phone);
        checkRequiredTermsAgreed(request.getAgreements());

        String passwordHash = passwordEncoder.encode(request.getPassword());

        Member member = new Member();
        member.setEmail(email);
        member.setPasswordHash(passwordHash);
        member.setName(name);
        member.setNickname(nickname);
        member.setPhone(phone);
        member.setEmailVerified(1);
        member.setPhoneVerified(1);

        int memberResult = signupDao.insertMember(member);

        if (memberResult != 1) {
            throw new IllegalStateException("회원가입 처리에 실패했습니다.");
        }

        insertTermsAgreements(member.getMemberId(), request.getAgreements());

        int emailUsedResult = signupDao.updateAuthCodeUsed("EMAIL", email, "SIGNUP");
        int phoneUsedResult = signupDao.updateAuthCodeUsed("PHONE", phone, "SIGNUP");

        if (emailUsedResult < 1) {
            throw new IllegalStateException("이메일 인증 사용 처리에 실패했습니다.");
        }

        if (phoneUsedResult < 1) {
            throw new IllegalStateException("휴대폰 인증 사용 처리에 실패했습니다.");
        }
    }
}

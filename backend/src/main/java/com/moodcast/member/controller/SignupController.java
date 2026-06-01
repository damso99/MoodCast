package com.moodcast.member.controller;

import com.moodcast.member.dto.signup.*;
import com.moodcast.member.service.SignupService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(value="signup")
public class SignupController {
    @Autowired
    private SignupService signupService;

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

    // =======================================================================================
    // SignupController의 예외는 moodcast.common.exception의 MemberExceptionHandler가 잡음
    // 그래서 정상 응답만 직접 처리함, 예외는 작성X
    // 400, 500 예외

    // 회원가입 이메일 인증번호 발송
    @PostMapping(value="auth/email/send")
    public ResponseEntity<?> sendEmailAuthCode(
            @RequestBody EmailAuthSendRequest request,
            HttpServletRequest httpRequest
    ) {

            String email = signupService.sendEmailAuthCode(request.getEmail(), getClientIp(httpRequest));
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "인증번호가 발송되었습니다.",
                            "email", email
                    )
            );
    }

    // 회원가입 이메일 인증번호 확인
    @PostMapping(value="auth/email/verify")
    public ResponseEntity<?> verifyEmailAuthCode(@RequestBody EmailAuthVerifyRequest request) {

            signupService.verifyEmailAuthCode(request.getEmail(), request.getAuthCode());
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "인증이 완료되었습니다."
                    )
            );
    }

    // 회원가입 휴대폰 인증 발송
    @PostMapping(value="auth/phone/send")
    public ResponseEntity<?> sendPhoneAuthCode(
            @RequestBody PhoneAuthSendRequest request,
            HttpServletRequest httpRequest
    ) {

            PhoneAuthSendResult result = signupService.sendPhoneAuthCode(request.getPhone(), getClientIp(httpRequest));
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "인증번호가 발송되었습니다.",
                            "phone", result.getPhone(),
                            "authCode", result.getAuthCode()
                    )
            );
    }

    // 회원가입 휴대폰 인증 확인
    @PostMapping(value="auth/phone/verify")
    public ResponseEntity<?> verifyPhoneAuthCode(@RequestBody PhoneAuthVerifyRequest request) {
            signupService.verifyPhoneAuthCode(request.getPhone(), request.getAuthCode());
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "인증이 완료되었습니다."
                    )
            );
    }

    // 이메일 기본검사, 중복체크
    @GetMapping(value="check/email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
            boolean available = signupService.checkEmailAvailable(email);
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "available", available
                    )
            );
    }

    // 닉네임 기본검사, 중복체크
    @GetMapping(value="check/nickname")
    public ResponseEntity<?> checkNickname(@RequestParam String nickname) {
        boolean available = signupService.checkNicknameAvailable(nickname);
        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "available", available
                )
        );
    }

    // 이용약관 조회
    @GetMapping("terms")
    public ResponseEntity<?> getTerms() {

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "terms", signupService.getActiveTerms()
                    )
            );
    }

    // 회원가입 step1 검증
    @PostMapping("validate/basic")
    public ResponseEntity<?> validateBasic(@RequestBody ValidateBasicRequest request) {
            signupService.validateBasic(
                    request.getName(), request.getNickname(), request.getEmail(), request.getPassword(), request.getPasswordConfirm());

            return ResponseEntity.ok(
                    Map.of(
                            "success", true
                    )
            );
    }

    // 회원가입 step2 검증
    @PostMapping("validate/phone")
    public ResponseEntity<?> validatePhone (@RequestBody PhoneAuthSendRequest request) {
        signupService.validatePhone (
                request.getPhone());

        return ResponseEntity.ok(
                Map.of(
                        "success", true
                )
        );
    }

    @PostMapping("complete")
    public ResponseEntity<?> completeSignup (@RequestBody SignupRequest request) {
        signupService.completeSignup(request);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "회원가입이 완료되었습니다."
                )
        );
    }

}

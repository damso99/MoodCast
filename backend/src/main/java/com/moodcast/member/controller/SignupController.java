package com.moodcast.member.controller;

import com.moodcast.member.dto.EmailAuthSendRequest;
import com.moodcast.member.dto.EmailAuthVerifyRequest;
import com.moodcast.member.dto.PhoneAuthSendRequest;
import com.moodcast.member.dto.PhoneAuthVerifyRequest;
import com.moodcast.member.service.PhoneService;
import com.moodcast.member.service.SignupService;
import org.apache.coyote.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Map;

@RestController
@CrossOrigin("*")
@RequestMapping(value="signup")
public class SignupController {
    @Autowired
    private SignupService signupService;
    @Autowired
    private PhoneService phoneService;

    // 회원가입 이메일 인증번호 발송
    @PostMapping(value="auth/email/send")
    public ResponseEntity<?> sendEmailAuthCode(@RequestBody EmailAuthSendRequest request) {
        try {
            String email = signupService.sendEmailAuthCode(request.getEmail());
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "인증번호가 발송되었습니다.",
                            "email", email
                    )
            );
        } catch (IllegalArgumentException e) { // 사용자 문제
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        } catch (IllegalStateException e) { // 서버 문제
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        }
    }

    // 회원가입 이메일 인증번호 확인
    @PostMapping(value="auth/email/verify")
    public ResponseEntity<?> verifyEmailAuthCode(@RequestBody EmailAuthVerifyRequest request) {
        try {
            signupService.verifyEmailAuthCode(request.getEmail(), request.getAuthCode());
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "인증이 완료되었습니다."
                    )
            );
        } catch(IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        } catch (IllegalStateException e) {
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        }
    }

    // 회원가입 휴대폰 인증 발송
    @PostMapping(value="auth/phone/send")
    public ResponseEntity<?> sendPhoneAuthCode(@RequestBody PhoneAuthSendRequest request) {
        try {
            String phone = signupService.sendPhoneAuthCode(request.getPhone());
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "인증번호가 발송되었습니다.",
                            "phone", phone
                    )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        } catch (IllegalStateException e) {
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        }
    }

    // 회원가입 휴대폰 인증 확인
    @PostMapping(value="auth/phone/verify")
    public ResponseEntity<?> verifyPhoneAuthCode(@RequestBody PhoneAuthVerifyRequest request) {
        try {
            signupService.verifyPhoneAuthCode(request.getPhone(), request.getAuthCode());
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "인증이 완료되었습니다."
                    )
            );
        } catch(IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        } catch(IllegalStateException e) {
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        }
    }

    // 이메일 기본검사, 중복체크
    @GetMapping(value="check/email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        try {
            boolean available = signupService.checkEmailAvailable(email);
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "available", available
                    )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );
        }
    }
}

package com.moodcast.common.exception;

import com.moodcast.member.controller.LoginController;
import com.moodcast.member.controller.OAuthController;
import com.moodcast.member.controller.SignupController;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

// SignupController와 LoginController에서 발생한 예외를 함께 처리한다.
@RestControllerAdvice(assignableTypes = {
        SignupController.class,
        LoginController.class,
        OAuthController.class
})
public class MemberExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(
                Map.of(
                        "success", false,
                        "message", e.getMessage()
                )
        );
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<?> handleIllegalStateException(IllegalStateException e) {
        return ResponseEntity.internalServerError().body(
                Map.of(
                        "success", false,
                        "message", e.getMessage()
                )
        );
    }

    @ExceptionHandler(DuplicateKeyException.class)
    public ResponseEntity<?> handleDuplicateKeyException(DuplicateKeyException e) {
        String message = "이미 사용 중인 정보입니다.";
        String detail = e.getMessage();

        if (detail != null) {
            if (detail.contains("uk_members_email")) {
                message = "이미 사용 중인 이메일입니다.";
            } else if (detail.contains("uk_members_phone")) {
                message = "이미 사용 중인 휴대폰 번호입니다.";
            } else if (detail.contains("uk_members_nickname")) {
                message = "이미 사용 중인 닉네임입니다.";
            } else if (detail.contains("uk_oauth_provider_user") || detail.contains("uk_oauth_member_provider")) {
                message = "이미 연결된 소셜 계정입니다.";
            }
        }

        return ResponseEntity.badRequest().body(
                Map.of(
                        "success", false,
                        "message", message
                )
        );
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MissingServletRequestParameterException.class
    })
    public ResponseEntity<?> handleBadRequestException(Exception e) {
        return ResponseEntity.badRequest().body(
                Map.of(
                        "success", false,
                        "message", "입력값 형식이 올바르지 않습니다. 다시 확인해주세요."
                )
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception e) {
        return ResponseEntity.internalServerError().body(
                Map.of(
                        "success", false,
                        "message", "서버에서 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요."
                )
        );
    }
}

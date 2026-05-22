package com.moodcast.common.exception;

import com.moodcast.member.controller.SignupController;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

// SignupController에서 발생한 예외만 여기서 잡음
@RestControllerAdvice(assignableTypes = SignupController.class)
public class SignupExceptionHandler {

    // 사용자 입력문제 예외 400
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(
                Map.of(
                        "success", false,
                        "message", e.getMessage()
                )
        );
    }

    // 서버 처리 문제 500
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<?> handleIllegalStateException(IllegalStateException e) {
        return ResponseEntity.internalServerError().body(
                Map.of(
                        "success", false,
                        "message", e.getMessage()
                )
        );
    }

    // 요청 body가 잘못됐거나 필수 파라미터가 빠진 경우 400
    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MissingServletRequestParameterException.class
    })
    public ResponseEntity<?> handleBadRequestException(Exception e) {
        return ResponseEntity.badRequest().body(
                Map.of(
                        "success", false,
                        "message", "요청값이 올바르지 않습니다."
                )
        );
    }

    // 약관 조회 중 DB 에러
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception e) {
        return ResponseEntity.internalServerError().body(
                Map.of(
                        "success", false,
                        "message", "서버 오류가 발생했습니다. 500 Server"
                )
        );
    }
}

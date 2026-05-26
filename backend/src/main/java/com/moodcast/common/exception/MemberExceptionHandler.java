package com.moodcast.common.exception;

import com.moodcast.member.controller.LoginController;
import com.moodcast.member.controller.SignupController;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

// SignupController와 LoginController에서 발생한 예외를 함께 처리한다.
@RestControllerAdvice(assignableTypes = {
        SignupController.class,
        LoginController.class
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

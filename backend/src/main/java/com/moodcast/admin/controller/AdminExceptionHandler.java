package com.moodcast.admin.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/* ==========================================================================
 * 관리자 API 예외 처리
 * --------------------------------------------------------------------------
 * AdminController에서 발생한 예외를 프론트가 이해하기 쉬운 JSON 응답으로 바꿉니다.
 *
 * 필요한 이유:
 * - 로그인하지 않은 사용자가 관리자 API를 호출하면 401로 응답해야 합니다.
 * - 로그인했지만 관리자가 아니면 403으로 응답해야 합니다.
 * - 예외 처리가 없으면 단순 권한 문제도 500 서버 오류처럼 보일 수 있습니다.
 * ========================================================================== */
@RestControllerAdvice(assignableTypes = AdminController.class)
public class AdminExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(AdminExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("[ADMIN_API] IllegalArgumentException message={}", e.getMessage(), e);

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(
                        Map.of(
                                "success", false,
                                "message", e.getMessage()
                        )
                );
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> handleResponseStatusException(ResponseStatusException e) {
        log.warn(
                "[ADMIN_API] ResponseStatusException status={} reason={}",
                e.getStatusCode(),
                e.getReason(),
                e
        );

        return ResponseEntity.status(e.getStatusCode())
                .body(
                        Map.of(
                                "success", false,
                                "message", e.getReason() == null ? "요청을 처리할 수 없습니다." : e.getReason()
                        )
                );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception e) {
        log.error("[ADMIN_API] Unhandled exception occurred in admin API", e);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(
                        Map.of(
                                "success", false,
                                "message", "관리자 API 처리 중 오류가 발생했습니다."
                        )
                );
    }
}

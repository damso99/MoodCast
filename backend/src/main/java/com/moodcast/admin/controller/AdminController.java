package com.moodcast.admin.controller;

import com.moodcast.admin.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/* ==========================================================================
 * 관리자 페이지 공통 컨트롤러
 * --------------------------------------------------------------------------
 * 관리자 페이지에서 사용할 API 요청을 가장 먼저 받는 클래스입니다.
 *
 * 컨트롤러 역할:
 * - 프론트엔드에서 들어온 HTTP 요청을 받습니다.
 * - 실제 비즈니스 처리는 service 계층에 맡깁니다.
 * - service에서 받은 결과를 프론트엔드가 사용할 수 있는 JSON 형태로 응답합니다.
 *
 * 현재 단계:
 * - 관리자 기능 개발을 시작하기 위한 기본 구조만 준비합니다.
 * - 실제 사용자 관리, 공지사항, 신고 처리 API는 이후 이 컨트롤러에 메서드를
 *   추가하거나 기능별 컨트롤러로 분리해서 확장할 수 있습니다.
 *
 * 주의:
 * - 지금은 admin 패키지 내부 파일만 만들기 위해 다른 패키지 파일은 수정하지 않습니다.
 * ========================================================================== */
@RestController // 이 클래스가 JSON 응답을 반환하는 REST API 컨트롤러라는 뜻입니다.
@RequestMapping("/admin/api") // 관리자 API 주소의 공통 시작 경로입니다.
public class AdminController {

    @Autowired // Spring이 AdminService 객체를 자동으로 연결해줍니다.
    private AdminService adminService;
}

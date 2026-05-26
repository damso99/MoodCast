package com.moodcast.admin.controller;

import com.moodcast.admin.service.AdminService;
import com.moodcast.admin.vo.AdminDashboardSummary;
import com.moodcast.admin.vo.AdminMember;
import com.moodcast.admin.vo.AdminMemberDetail;
import com.moodcast.admin.vo.AdminMemberSuspendRequest;
import com.moodcast.admin.vo.AdminProfile;
import com.moodcast.admin.vo.AdminProfileUpdateRequest;
import com.moodcast.admin.vo.AdminRoleUpdateRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

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

    /* ==========================================================================
     * 전체 회원 수 조회 API
     * --------------------------------------------------------------------------
     * 사용자 관리 페이지의 "전체 회원" 카드에 표시할 숫자를 조회합니다.
     *
     * 요청 주소:
     * - GET /admin/api/members/count
     *
     * 응답 예시:
     * - { "totalMemberCount": 5 }
     * ========================================================================== */
    @GetMapping("/members/count") // 브라우저에서 이 주소로 GET 요청이 오면 아래 메서드가 실행됩니다.
    public Map<String, Long> getTotalMemberCount(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return Map.of("totalMemberCount", adminService.getTotalMemberCount(authorizationHeader));
    }

    /* ==========================================================================
     * 전체 회원 목록 조회 API
     * --------------------------------------------------------------------------
     * 사용자 관리 페이지의 "전체 목록" 테이블에 표시할 회원 목록을 조회합니다.
     *
     * 요청 주소:
     * - GET /admin/api/members
     *
     * 현재 조회 정보:
     * - 사용자: name
     * - 상태: status
     * - 가입일: created_at
     * - 권한: role
     * ========================================================================== */
    @GetMapping("/members") // 브라우저에서 이 주소로 GET 요청이 오면 전체 회원 목록을 반환합니다.
    public Map<String, List<AdminMember>> getMembers(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return Map.of("members", adminService.getMembers(authorizationHeader));
    }

    /* ==========================================================================
     * 회원 상세 정보 조회 API
     * --------------------------------------------------------------------------
     * 사용자 관리 페이지에서 "회원 정보 전체 보기" 버튼을 눌렀을 때 사용하는 API입니다.
     *
     * 요청 주소:
     * - GET /admin/api/members/{memberId}
     *
     * 응답 기준:
     * - members 테이블에 저장된 개인정보 관련 값을 반환합니다.
     * - password_hash는 절대 반환하지 않습니다.
     * ========================================================================== */
    @GetMapping("/members/{memberId}")
    public AdminMemberDetail getMemberDetail(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long memberId
    ) {
        return adminService.getMemberDetail(authorizationHeader, memberId);
    }

    /* ==========================================================================
     * 회원 정지 처리 API
     * --------------------------------------------------------------------------
     * 사용자 관리 패널에서 일시 정지 또는 영구 정지를 확정했을 때 호출됩니다.
     *
     * 요청 주소:
     * - PUT /admin/api/members/{memberId}/suspend
     *
     * 요청 body 예시:
     * - { "suspendType": "TEMPORARY", "suspendDays": 7 }
     * - { "suspendType": "TEMPORARY", "suspendedUntil": "2026-06-08" }
     * - { "suspendType": "PERMANENT" }
     * ========================================================================== */
    @PutMapping("/members/{memberId}/suspend")
    public Map<String, Object> suspendMember(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long memberId,
            @RequestBody AdminMemberSuspendRequest request
    ) {
        return Map.of(
                "success", true,
                "message", "회원 정지 처리가 완료되었습니다.",
                "member", adminService.suspendMember(authorizationHeader, memberId, request)
        );
    }

    /* ==========================================================================
     * 회원 정지 해제 API
     * --------------------------------------------------------------------------
     * 사용자 관리 패널에서 정지된 회원의 "정지 해제" 버튼을 눌렀을 때 호출합니다.
     *
     * 요청 주소:
     * - PUT /admin/api/members/{memberId}/restore
     * ========================================================================== */
    @PutMapping("/members/{memberId}/restore")
    public Map<String, Object> restoreSuspendedMember(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long memberId
    ) {
        return Map.of(
                "success", true,
                "message", "회원 정지 해제가 완료되었습니다.",
                "member", adminService.restoreSuspendedMember(authorizationHeader, memberId)
        );
    }

    /* ==========================================================================
     * 관리자 권한 관리 대상 회원 검색 API
     * --------------------------------------------------------------------------
     * 관리자 권한 관리 페이지에서 기존 회원을 이메일 또는 실명으로 검색할 때 사용합니다.
     *
     * 요청 주소:
     * - GET /admin/api/members/admin-promotion/search?searchType=email&keyword=test@example.com
     * - GET /admin/api/members/admin-promotion/search?searchType=name&keyword=문건우
     *
     * searchType 값:
     * - email: members.email 기준 검색
     * - name: members.name 기준 검색
     * ========================================================================== */
    @GetMapping("/members/admin-promotion/search")
    public Map<String, List<AdminMember>> searchMembersForAdminPromotion(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestParam(defaultValue = "email") String searchType,
            @RequestParam(defaultValue = "") String keyword
    ) {
        return Map.of(
                "members",
                adminService.searchMembersForAdminPromotion(authorizationHeader, searchType, keyword)
        );
    }

    /* ==========================================================================
     * 회원 관리자 등급 변경 API
     * --------------------------------------------------------------------------
     * 관리자 권한 관리 페이지에서 선택한 ACTIVE 회원을 일반 회원 또는 관리자 등급으로 변경합니다.
     *
     * 요청 주소:
     * - PUT /admin/api/members/{memberId}/role
     *
     * 요청 body:
     * - { "role": "USER" }
     * - { "role": "NORMAL_ADMIN" }
     * - { "role": "SUPER_ADMIN" }
     * ========================================================================== */
    @PutMapping("/members/{memberId}/role")
    public Map<String, Object> promoteMemberToAdmin(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long memberId,
            @RequestBody AdminRoleUpdateRequest request
    ) {
        adminService.promoteMemberToAdmin(authorizationHeader, memberId, request.getRole());

        return Map.of(
                "success", true,
                "message", "관리자 등급이 변경되었습니다."
        );
    }

    /* ==========================================================================
     * 관리자 대시보드 요약 조회 API
     * --------------------------------------------------------------------------
     * 대시보드 상단 카드에 필요한 숫자를 한 번에 조회합니다.
     *
     * 요청 주소:
     * - GET /admin/api/dashboard/summary
     *
     * 현재 응답 값:
     * - totalMemberCount: 전체 회원 수
     * - todayNewMemberCount: 오늘 가입한 신규 가입자 수
     * - postCount: 삭제되지 않은 게시글 수
     * ========================================================================== */
    @GetMapping("/dashboard/summary")
    public AdminDashboardSummary getDashboardSummary(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return adminService.getDashboardSummary(authorizationHeader);
    }

    /* ==========================================================================
     * 관리자 개인 정보 조회 API
     * --------------------------------------------------------------------------
     * 로그인한 관리자 본인의 실명, 닉네임, 전화번호를 조회합니다.
     *
     * 요청 주소:
     * - GET /admin/api/profile
     * ========================================================================== */
    @GetMapping("/profile")
    public AdminProfile getAdminProfile(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return adminService.getAdminProfile(authorizationHeader);
    }

    /* ==========================================================================
     * 관리자 개인 정보 수정 API
     * --------------------------------------------------------------------------
     * 로그인한 관리자 본인의 실명, 닉네임, 전화번호를 수정합니다.
     *
     * 요청 주소:
     * - PUT /admin/api/profile
     * ========================================================================== */
    @PutMapping("/profile")
    public Map<String, Object> updateAdminProfile(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody AdminProfileUpdateRequest request
    ) {
        return Map.of(
                "success", true,
                "message", "관리자 정보가 수정되었습니다.",
                "profile", adminService.updateAdminProfile(authorizationHeader, request)
        );
    }
}

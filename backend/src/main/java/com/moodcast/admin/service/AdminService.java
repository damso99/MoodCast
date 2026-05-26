package com.moodcast.admin.service;

import com.moodcast.admin.dao.AdminDao;
import com.moodcast.admin.vo.AdminDashboardSummary;
import com.moodcast.admin.vo.AdminMember;
import com.moodcast.admin.vo.AdminProfile;
import com.moodcast.admin.vo.AdminProfileUpdateRequest;
import com.moodcast.member.dto.login.LoginMemberResponse;
import com.moodcast.member.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;

/* ==========================================================================
 * 관리자 페이지 공통 서비스
 * --------------------------------------------------------------------------
 * 컨트롤러가 받은 요청을 실제로 처리하는 비즈니스 로직 계층입니다.
 *
 * 서비스 역할:
 * - 컨트롤러가 직접 DB 작업을 하지 않도록 중간에서 로직을 담당합니다.
 * - 필요한 경우 DAO를 통해 DB 데이터를 조회하거나 수정합니다.
 * - 관리자 권한 검사, 데이터 가공, 처리 규칙을 이 위치에 작성할 예정입니다.
 *
 * 현재 단계:
 * - 관리자 백엔드 구조를 잡기 위한 기본 서비스만 준비합니다.
 * - 아직 실제 DB 조회 로직은 작성하지 않습니다.
 * ========================================================================== */
@Service // Spring이 이 클래스를 서비스 객체로 등록하게 합니다.
public class AdminService {

    @Autowired // 나중에 DB 조회가 필요할 때 사용할 DAO를 연결합니다.
    private AdminDao adminDao;

    @Autowired // 기존 로그인 토큰 검증 로직을 재사용하기 위해 LoginService를 연결합니다.
    private LoginService loginService;

    /* ==========================================================================
     * 관리자 권한 확인
     * --------------------------------------------------------------------------
     * 관리자 API는 반드시 로그인한 관리자만 사용할 수 있어야 합니다.
     *
     * 처리 순서:
     * 1. Authorization 헤더의 accessToken으로 현재 로그인 회원을 조회합니다.
     * 2. 회원 role이 ADMIN, NORMAL_ADMIN, SUPER_ADMIN 중 하나인지 확인합니다.
     * 3. 일반 회원이면 403 FORBIDDEN으로 막습니다.
     *
     * NORMAL_ADMIN을 포함한 이유:
     * - 프로젝트 규칙에서 일반 관리자 role 이름으로 NORMAL_ADMIN을 사용한 기록이 있습니다.
     * - 현재 DB가 ADMIN을 쓰더라도, NORMAL_ADMIN 데이터가 있어도 막히지 않게 하기 위함입니다.
     * ========================================================================== */
    private LoginMemberResponse validateAdmin(String authorizationHeader) {
        LoginMemberResponse loginMember = loginService.getLoginMemberByHeader(authorizationHeader);
        String role = loginMember.getRole();

        boolean isAdmin =
                "ADMIN".equals(role)
                        || "NORMAL_ADMIN".equals(role)
                        || "SUPER_ADMIN".equals(role);

        if (!isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다.");
        }

        return loginMember;
    }

    /* ==========================================================================
     * 전체 회원 수 조회
     * --------------------------------------------------------------------------
     * 컨트롤러에서 요청을 받으면 DAO를 통해 members 테이블의 전체 회원 수를 조회합니다.
     *
     * 지금은 단순 조회만 하지만 Service를 거치는 이유:
     * - 나중에 "삭제 회원 제외" 같은 정책이 생기면 이 위치에서 처리 기준을 정리할 수 있습니다.
     * ========================================================================== */
    public Long getTotalMemberCount(String authorizationHeader) {
        validateAdmin(authorizationHeader);
        return adminDao.selectTotalMemberCount();
    }

    /* ==========================================================================
     * 전체 회원 목록 조회
     * --------------------------------------------------------------------------
     * members 테이블의 회원 목록을 조회해서 사용자 관리 테이블에 전달합니다.
     *
     * 지금은 "전체" 탭에만 표시할 데이터이므로 별도 조건을 걸지 않습니다.
     * 나중에 일반 회원, 정지 회원, 관리자 회원 탭을 실제로 동작시킬 때는
     * 이 메서드에 role/status 조건을 추가하거나 별도 메서드로 분리하면 됩니다.
     * ========================================================================== */
    public List<AdminMember> getMembers(String authorizationHeader) {
        validateAdmin(authorizationHeader);
        return adminDao.selectMembers();
    }

    /* ==========================================================================
     * 관리자 승급 대상 회원 검색
     * --------------------------------------------------------------------------
     * 관리자 추가 페이지에서 "이메일" 또는 "실명" 기준으로 기존 회원을 찾습니다.
     *
     * searchType 설명:
     * - "email"이면 members.email 컬럼에서 검색합니다.
     * - "name"이면 members.name 컬럼에서 검색합니다.
     *
     * keyword 설명:
     * - 검색창에 입력한 실제 검색어입니다.
     * - 비어 있는 검색어로 전체 회원이 한 번에 조회되지 않도록 빈 배열을 반환합니다.
     * ========================================================================== */
    public List<AdminMember> searchMembersForAdminPromotion(
            String authorizationHeader,
            String searchType,
            String keyword
    ) {
        validateAdmin(authorizationHeader);

        if (keyword == null || keyword.trim().isEmpty()) {
            return Collections.emptyList();
        }

        String normalizedSearchType =
                "name".equals(searchType) || "nickname".equals(searchType)
                        ? searchType
                        : "email";
        String normalizedKeyword = keyword.trim();

        return adminDao.searchMembersForAdminPromotion(normalizedSearchType, normalizedKeyword);
    }

    /* ==========================================================================
     * 일반 회원을 관리자 등급으로 변경
     * --------------------------------------------------------------------------
     * 관리자 추가 페이지에서 선택한 ACTIVE 일반 회원의 role을 변경합니다.
     *
     * 처리 규칙:
     * - 변경 가능한 role은 NORMAL_ADMIN, SUPER_ADMIN 두 가지입니다.
     * - SQL에서도 ACTIVE 상태와 일반 회원 role 조건을 다시 확인합니다.
     * - 조건에 맞지 않으면 400 BAD_REQUEST로 실패 처리합니다.
     * ========================================================================== */
    @Transactional
    public void promoteMemberToAdmin(
            String authorizationHeader,
            Long memberId,
            String role
    ) {
        validateAdmin(authorizationHeader);

        if (memberId == null) {
            throw new IllegalArgumentException("관리자로 승급할 회원을 선택해주세요.");
        }

        String normalizedRole = normalizeAdminRole(role);
        int updated = adminDao.updateMemberRoleForAdminPromotion(memberId, normalizedRole);

        if (updated != 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "ACTIVE 상태의 일반 회원만 관리자로 승급할 수 있습니다."
            );
        }
    }

    private String normalizeAdminRole(String role) {
        if ("SUPER_ADMIN".equals(role)) {
            return "SUPER_ADMIN";
        }

        if ("NORMAL_ADMIN".equals(role)) {
            return "NORMAL_ADMIN";
        }

        throw new IllegalArgumentException("관리자 등급을 올바르게 선택해주세요.");
    }

    /* ==========================================================================
     * 관리자 대시보드 요약 조회
     * --------------------------------------------------------------------------
     * 대시보드 상단 카드에 필요한 숫자를 한 번에 조회합니다.
     *
     * Polling을 사용할 때 API를 여러 번 호출하지 않기 위해,
     * 회원수/신규 가입자/게시글 수를 하나의 응답으로 묶습니다.
     * ========================================================================== */
    public AdminDashboardSummary getDashboardSummary(String authorizationHeader) {
        validateAdmin(authorizationHeader);
        return adminDao.selectDashboardSummary();
    }

    /* ==========================================================================
     * 관리자 개인 정보 조회
     * --------------------------------------------------------------------------
     * 로그인한 관리자의 memberId를 기준으로 DB에 저장된 실명, 닉네임, 전화번호를 조회합니다.
     * ========================================================================== */
    public AdminProfile getAdminProfile(String authorizationHeader) {
        LoginMemberResponse loginMember = validateAdmin(authorizationHeader);
        AdminProfile adminProfile = adminDao.selectAdminProfile(loginMember.getMemberId());

        if (adminProfile == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "관리자 정보를 찾을 수 없습니다.");
        }

        return adminProfile;
    }

    /* ==========================================================================
     * 관리자 개인 정보 수정
     * --------------------------------------------------------------------------
     * 로그인한 관리자 본인의 실명, 닉네임, 전화번호를 수정합니다.
     *
     * 주의:
     * - 다른 사람 정보를 수정하지 않도록 token에서 얻은 memberId만 사용합니다.
     * - 프론트에서 memberId를 보내더라도 신뢰하지 않는 구조입니다.
     * ========================================================================== */
    @Transactional
    public AdminProfile updateAdminProfile(
            String authorizationHeader,
            AdminProfileUpdateRequest request
    ) {
        LoginMemberResponse loginMember = validateAdmin(authorizationHeader);

        if (request == null) {
            throw new IllegalArgumentException("수정할 정보를 입력해주세요.");
        }

        String name = normalizeRequiredText(request.getName(), "이름을 입력해주세요.");
        String nickname = normalizeRequiredText(request.getNickname(), "닉네임을 입력해주세요.");
        String phone = normalizeRequiredText(request.getPhone(), "전화번호를 입력해주세요.");

        int updated = adminDao.updateAdminProfile(loginMember.getMemberId(), name, nickname, phone);

        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "관리자 정보 수정에 실패했습니다.");
        }

        return getAdminProfile(authorizationHeader);
    }

    private String normalizeRequiredText(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }
}

package com.moodcast.admin.dao;

import com.moodcast.admin.vo.AdminDashboardSummary;
import com.moodcast.admin.vo.AdminMember;
import com.moodcast.admin.vo.AdminMemberDetail;
import com.moodcast.admin.vo.AdminProfile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.time.LocalDateTime;

/* ==========================================================================
 * 관리자 페이지 공통 DAO
 * --------------------------------------------------------------------------
 * DB와 직접 연결되는 MyBatis Mapper 인터페이스입니다.
 *
 * DAO 역할:
 * - service에서 필요한 DB 조회/수정 요청을 실제 SQL과 연결합니다.
 * - 회원 정보는 기존 member 패키지의 members 테이블 구조를 참고해서 사용할 예정입니다.
 *
 * 현재 단계:
 * - 다른 폴더의 mapper XML 파일을 수정하지 않기 위해 메서드는 아직 추가하지 않습니다.
 * - 나중에 관리자 회원 목록 조회, 관리자 승급/강등, 공지사항 관리 등이 필요해지면
 *   이 인터페이스에 메서드를 추가하고 mapper XML을 연결하면 됩니다.
 * ========================================================================== */
@Mapper // MyBatis가 이 인터페이스를 DB Mapper로 인식하게 합니다.
public interface AdminDao {

    /* members 테이블에 있는 전체 회원 수를 조회합니다. */
    Long selectTotalMemberCount();

    /* members 테이블에 있는 전체 회원 목록을 조회합니다. */
    List<AdminMember> selectMembers();

    /* 회원 정보 전체 보기에서 사용할 단건 상세 정보를 조회합니다. */
    AdminMemberDetail selectMemberDetail(@Param("memberId") Long memberId);

    /* 관리자 권한 관리 페이지에서 이메일 또는 실명으로 회원을 검색합니다. */
    List<AdminMember> searchMembersForAdminPromotion(
            @Param("searchType") String searchType,
            @Param("keyword") String keyword
    );

    /* ACTIVE 상태의 일반 회원을 관리자 등급으로 변경합니다. */
    int updateMemberRoleForAdminPromotion(
            @Param("memberId") Long memberId,
            @Param("role") String role
    );

    /* 선택한 회원을 정지 상태로 변경합니다. suspendedUntil이 null이면 영구 정지입니다. */
    int suspendMember(
            @Param("memberId") Long memberId,
            @Param("suspendedUntil") LocalDateTime suspendedUntil
    );

    /* 정지된 회원을 다시 ACTIVE 상태로 변경합니다. */
    int restoreSuspendedMember(@Param("memberId") Long memberId);

    /* 관리자 작업 로그에 회원 정지 이력을 추가합니다. */
    int insertAdminActionLog(
            @Param("adminId") Long adminId,
            @Param("actionType") String actionType,
            @Param("targetType") String targetType,
            @Param("targetId") Long targetId,
            @Param("actionDetail") String actionDetail
    );

    /* 관리자 대시보드 상단 카드에 표시할 요약 숫자를 조회합니다. */
    AdminDashboardSummary selectDashboardSummary();

    /* 로그인한 관리자 본인의 개인 정보를 조회합니다. */
    AdminProfile selectAdminProfile(@Param("memberId") Long memberId);

    /* 로그인한 관리자 본인의 실명, 닉네임, 전화번호를 수정합니다. */
    int updateAdminProfile(
            @Param("memberId") Long memberId,
            @Param("name") String name,
            @Param("nickname") String nickname,
            @Param("phone") String phone
    );
}

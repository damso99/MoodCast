package com.moodcast.admin.dao;

import com.moodcast.admin.vo.AdminActionLogView;
import com.moodcast.admin.vo.AdminActiveUserStat;
import com.moodcast.admin.vo.AdminContentComment;
import com.moodcast.admin.vo.AdminContentHashtag;
import com.moodcast.admin.vo.AdminContentPost;
import com.moodcast.admin.vo.AdminDashboardSummary;
import com.moodcast.admin.vo.AdminEmotionActivity;
import com.moodcast.admin.vo.AdminMember;
import com.moodcast.admin.vo.AdminMemberDetail;
import com.moodcast.admin.vo.AdminProfile;
import com.moodcast.admin.vo.AdminRecentActivity;
import com.moodcast.admin.vo.AdminRecentMember;
import com.moodcast.admin.vo.AdminStatisticsSummary;
import com.moodcast.admin.vo.AdminStatisticsTrend;
import com.moodcast.admin.vo.AdminUserManagementSummary;
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

    /* 콘텐츠 관리 페이지에서 사용할 게시글 목록을 조회합니다. */
    List<AdminContentPost> selectAdminContentPosts();

    /* 콘텐츠 관리 댓글 탭에서 사용할 댓글 목록을 조회합니다. */
    List<AdminContentComment> selectAdminContentComments();

    /* 콘텐츠 관리 해시태그 탭에서 사용할 해시태그 목록을 조회합니다. */
    List<AdminContentHashtag> selectAdminContentHashtags();

    /*
     * 관리자 콘텐츠 관리에서 게시글 작업 후 최신 상태를 다시 조회합니다.
     * 프론트에서는 이 결과로 카드 한 장만 갱신할 수 있습니다.
     */
    AdminContentPost selectAdminContentPostById(@Param("postId") Long postId);

    /*
     * 게시글 숨김 처리입니다.
     * post_tbl.visibility를 PRIVATE로 바꿔 일반 피드에서 공개 상태가 아니게 만듭니다.
     */
    int hideAdminContentPost(@Param("postId") Long postId);

    /*
     * 숨김 게시글 복구 처리입니다.
     * post_tbl.visibility를 PUBLIC으로 되돌립니다.
     */
    int restoreHiddenAdminContentPost(@Param("postId") Long postId);

    /*
     * 게시글 삭제 처리입니다.
     * 프로젝트 정책에 맞춰 처음 삭제는 post_tbl.deleted_yn을 Y로 바꾸는 soft delete입니다.
     */
    int softDeleteAdminContentPost(@Param("postId") Long postId);

    /*
     * 삭제 탭에서 사용하는 게시글 복구 처리입니다.
     * post_tbl.deleted_yn을 N으로 되돌리고, 공개 상태도 PUBLIC으로 맞춥니다.
     */
    int restoreDeletedAdminContentPost(@Param("postId") Long postId);

    /*
     * 삭제 탭에서 사용하는 완전 삭제 전 연결 데이터 정리입니다.
     * FK 제약 때문에 게시글 본문을 지우기 전에 댓글, 좋아요, 저장, 해시태그 연결을 먼저 정리합니다.
     */
    int deleteAdminPostComments(@Param("postId") Long postId);

    int deleteAdminPostLikes(@Param("postId") Long postId);

    int deleteAdminPostSaves(@Param("postId") Long postId);

    int deleteAdminPostHashtags(@Param("postId") Long postId);

    /*
     * 삭제 탭에서 사용하는 게시글 완전 삭제입니다.
     * 로그 테이블은 append-only 정책이므로 삭제하지 않습니다.
     */
    int hardDeleteAdminContentPost(@Param("postId") Long postId);

    /* 사용자 관리 하단의 전체/일반/관리자/정지 회원 수를 한 번에 조회합니다. */
    AdminUserManagementSummary selectUserManagementSummaryCounts();

    /* 사용자 관리 하단 카드에 표시할 가장 최근 가입 회원 1명을 조회합니다. */
    AdminRecentMember selectLatestJoinedMember();

    /* 사용자 관리 하단 카드에 표시할 가장 최근 제재 회원 1명을 조회합니다. */
    AdminRecentMember selectLatestSanctionedMember();

    /* 사용자 관리 하단에 표시할 최근 권한 변경/제재 로그를 조회합니다. */
    List<AdminActionLogView> selectRecentAdminActionLogs();

    /* 전체 로그 보기 팝업에서 사용할 권한 변경/제재 로그 전체 목록을 조회합니다. */
    List<AdminActionLogView> selectAllAdminActionLogs();

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

    /* 관리자 대시보드의 감정별 게시글 활동 수를 일/주/월 단위로 조회합니다. */
    List<AdminEmotionActivity> selectDashboardEmotionActivity(@Param("period") String period);

    /* 관리자 대시보드의 시간별 활성 사용자 수를 일/주/월 단위로 조회합니다. */
    List<AdminActiveUserStat> selectDashboardActiveUsers(@Param("period") String period);

    /* 관리자 대시보드의 최근 활동을 최신 10개만 조회합니다. */
    List<AdminRecentActivity> selectRecentDashboardActivities();

    /* 관리자 대시보드의 전체 활동 보기 팝업에서 사용할 모든 활동 로그를 조회합니다. */
    List<AdminRecentActivity> selectAllDashboardActivities();

    /* 통계 대시보드 상단 카드와 하단 요약에 사용할 기간별 요약 숫자를 조회합니다. */
    AdminStatisticsSummary selectStatisticsSummary(@Param("period") String period);

    /* 통계 대시보드 가입자 추이 차트에 사용할 기간별 가입자 흐름을 조회합니다. */
    List<AdminStatisticsTrend> selectStatisticsSubscriberTrend(@Param("period") String period);

    /* 통계 대시보드 콘텐츠 활동 막대 그래프에 사용할 게시글/댓글/공감 수를 조회합니다. */
    List<AdminStatisticsTrend> selectStatisticsContentActivity(@Param("period") String period);

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

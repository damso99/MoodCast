package com.moodcast.admin.service;

import com.moodcast.admin.dao.AdminDao;
import com.moodcast.admin.vo.AdminDashboardSummary;
import com.moodcast.admin.vo.AdminActionLogView;
import com.moodcast.admin.vo.AdminContentPost;
import com.moodcast.admin.vo.AdminMember;
import com.moodcast.admin.vo.AdminMemberDetail;
import com.moodcast.admin.vo.AdminMemberSuspendRequest;
import com.moodcast.admin.vo.AdminProfile;
import com.moodcast.admin.vo.AdminProfileUpdateRequest;
import com.moodcast.admin.vo.AdminUserManagementSummary;
import com.moodcast.member.dto.login.LoginMemberResponse;
import com.moodcast.member.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;

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

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

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
        log.info("[ADMIN_API] validateAdmin start hasAuthorizationHeader={}", authorizationHeader != null && !authorizationHeader.isBlank());

        LoginMemberResponse loginMember = loginService.getLoginMemberByHeader(authorizationHeader);
        String role = loginMember.getRole();

        boolean isAdmin =
                "ADMIN".equals(role)
                        || "NORMAL_ADMIN".equals(role)
                        || "SUPER_ADMIN".equals(role);

        if (!isAdmin) {
            log.warn("[ADMIN_API] validateAdmin forbidden memberId={} role={}", loginMember.getMemberId(), role);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다.");
        }

        log.info("[ADMIN_API] validateAdmin success memberId={} role={}", loginMember.getMemberId(), role);

        return loginMember;
    }

    /*
     * 슈퍼 관리자 권한 확인
     * --------------------------------------------------------------------------
     * 관리자 추가와 관리자 권한 변경처럼 높은 권한이 필요한 작업에서만 사용합니다.
     *
     * 처리 흐름:
     * 1. validateAdmin()으로 로그인 여부와 관리자 권한 여부를 먼저 확인합니다.
     * 2. role이 SUPER_ADMIN인지 한 번 더 확인합니다.
     * 3. 일반 관리자라면 403 FORBIDDEN으로 요청을 막습니다.
     */
    private LoginMemberResponse validateSuperAdmin(String authorizationHeader) {
        LoginMemberResponse loginMember = validateAdmin(authorizationHeader);

        if (!"SUPER_ADMIN".equals(loginMember.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "슈퍼 관리자 권한이 필요합니다.");
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
        log.info("[ADMIN_API] selectTotalMemberCount start");
        Long totalMemberCount = adminDao.selectTotalMemberCount();
        log.info("[ADMIN_API] selectTotalMemberCount success totalMemberCount={}", totalMemberCount);

        return totalMemberCount;
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
        log.info("[ADMIN_API] selectMembers start");
        List<AdminMember> members = adminDao.selectMembers();
        log.info("[ADMIN_API] selectMembers success size={}", members == null ? 0 : members.size());

        return members;
    }

    /* ==========================================================================
     * 콘텐츠 관리 게시글 목록 조회
     * --------------------------------------------------------------------------
     * 관리자 콘텐츠 관리 페이지에서 게시글 카드 목록을 만들기 위한 데이터를 조회합니다.
     *
     * 초보자 설명:
     * - 컨트롤러는 요청을 받고, 서비스는 관리자 권한 확인을 먼저 합니다.
     * - 권한 확인이 끝나면 DAO를 통해 DB에서 게시글 목록을 가져옵니다.
     * - 검색, 감정 필터, 페이지네이션은 화면 반응이 빠르도록 프론트에서 처리합니다.
     * ========================================================================== */
    public List<AdminContentPost> getAdminContentPosts(String authorizationHeader) {
        validateAdmin(authorizationHeader);
        log.info("[ADMIN_API] selectAdminContentPosts start");
        List<AdminContentPost> posts = adminDao.selectAdminContentPosts();
        log.info("[ADMIN_API] selectAdminContentPosts success size={}", posts == null ? 0 : posts.size());

        return posts;
    }

    /*
     * 관리자 콘텐츠 관리 게시글 숨김 처리
     * --------------------------------------------------------------------------
     * 초보자 설명:
     * - 숨김은 삭제가 아니라 visibility 값을 PRIVATE로 바꾸는 작업입니다.
     * - deleted_yn이 Y인 게시글은 이미 삭제 탭에 들어간 상태이므로 숨김 처리하지 않습니다.
     * - 작업 후에는 selectAdminContentPostById로 최신 게시글 한 건을 다시 조회해 프론트에 돌려줍니다.
     */
    @Transactional
    public AdminContentPost hideAdminContentPost(String authorizationHeader, Long postId) {
        LoginMemberResponse loginMember = validateAdmin(authorizationHeader);
        validatePostId(postId);

        int updated = adminDao.hideAdminContentPost(postId);

        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "숨김 처리할 수 있는 게시글이 아닙니다.");
        }

        adminDao.insertAdminActionLog(
                loginMember.getMemberId(),
                "HIDE_POST",
                "POST",
                postId,
                "게시글 숨김 처리"
        );

        return selectRequiredAdminContentPost(postId);
    }

    /*
     * 관리자 콘텐츠 관리 게시글 숨김 복구
     * --------------------------------------------------------------------------
     * visibility를 PUBLIC으로 되돌려 공개 상태로 복구합니다.
     */
    @Transactional
    public AdminContentPost restoreHiddenAdminContentPost(String authorizationHeader, Long postId) {
        LoginMemberResponse loginMember = validateAdmin(authorizationHeader);
        validatePostId(postId);

        int updated = adminDao.restoreHiddenAdminContentPost(postId);

        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "숨김 복구할 수 있는 게시글이 아닙니다.");
        }

        adminDao.insertAdminActionLog(
                loginMember.getMemberId(),
                "RESTORE_POST_VISIBILITY",
                "POST",
                postId,
                "게시글 숨김 복구"
        );

        return selectRequiredAdminContentPost(postId);
    }

    /*
     * 관리자 콘텐츠 관리 게시글 삭제
     * --------------------------------------------------------------------------
     * 처음 삭제는 deleted_yn을 Y로 바꾸는 soft delete입니다.
     * 이렇게 해야 삭제 탭에서 복구 또는 완전 삭제를 선택할 수 있습니다.
     */
    @Transactional
    public AdminContentPost softDeleteAdminContentPost(String authorizationHeader, Long postId) {
        LoginMemberResponse loginMember = validateAdmin(authorizationHeader);
        validatePostId(postId);

        int updated = adminDao.softDeleteAdminContentPost(postId);

        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "삭제 처리할 수 있는 게시글이 아닙니다.");
        }

        adminDao.insertAdminActionLog(
                loginMember.getMemberId(),
                "DELETE_POST",
                "POST",
                postId,
                "게시글 삭제 상태 전환"
        );

        return selectRequiredAdminContentPost(postId);
    }

    /*
     * 삭제 탭 게시글 복구
     * --------------------------------------------------------------------------
     * deleted_yn을 N으로 되돌리고 visibility를 PUBLIC으로 맞춥니다.
     */
    @Transactional
    public AdminContentPost restoreDeletedAdminContentPost(String authorizationHeader, Long postId) {
        LoginMemberResponse loginMember = validateAdmin(authorizationHeader);
        validatePostId(postId);

        int updated = adminDao.restoreDeletedAdminContentPost(postId);

        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "복구할 수 있는 삭제 게시글이 아닙니다.");
        }

        adminDao.insertAdminActionLog(
                loginMember.getMemberId(),
                "RESTORE_DELETED_POST",
                "POST",
                postId,
                "삭제 게시글 복구"
        );

        return selectRequiredAdminContentPost(postId);
    }

    /*
     * 삭제 탭 게시글 완전 삭제
     * --------------------------------------------------------------------------
     * 삭제 상태(deleted_yn = Y)에 있는 게시글만 실제 DB에서 제거합니다.
     * 댓글/좋아요/저장/해시태그 연결은 FK 제약 때문에 먼저 삭제합니다.
     */
    @Transactional
    public void hardDeleteAdminContentPost(String authorizationHeader, Long postId) {
        LoginMemberResponse loginMember = validateAdmin(authorizationHeader);
        validatePostId(postId);

        AdminContentPost post = selectRequiredAdminContentPost(postId);

        if (!"Y".equals(post.getDeletedYn())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "삭제 탭에 있는 게시글만 완전 삭제할 수 있습니다.");
        }

        adminDao.deleteAdminPostComments(postId);
        adminDao.deleteAdminPostLikes(postId);
        adminDao.deleteAdminPostSaves(postId);
        adminDao.deleteAdminPostHashtags(postId);

        int deleted = adminDao.hardDeleteAdminContentPost(postId);

        if (deleted != 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "게시글 완전 삭제에 실패했습니다.");
        }

        adminDao.insertAdminActionLog(
                loginMember.getMemberId(),
                "HARD_DELETE_POST",
                "POST",
                postId,
                "게시글 완전 삭제"
        );
    }

    private void validatePostId(Long postId) {
        if (postId == null) {
            throw new IllegalArgumentException("게시글을 선택해주세요.");
        }
    }

    private AdminContentPost selectRequiredAdminContentPost(Long postId) {
        AdminContentPost post = adminDao.selectAdminContentPostById(postId);

        if (post == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글 정보를 찾을 수 없습니다.");
        }

        return post;
    }

    /* ==========================================================================
     * 사용자 관리 하단 요약 조회
     * --------------------------------------------------------------------------
     * 사용자 관리 페이지 하단의 회원 비율, 최근 가입 회원, 최근 제재 회원,
     * 권한/제재 로그를 한 번에 조회합니다.
     *
     * 초보자 설명:
     * - Controller는 요청만 받고, Service가 어떤 DAO를 조합할지 결정합니다.
     * - count 조회, 최근 회원 조회, 로그 조회는 SQL이 서로 다르기 때문에
     *   DAO 메서드를 나눠 호출한 뒤 하나의 응답 객체에 담습니다.
     * ========================================================================== */
    public AdminUserManagementSummary getUserManagementSummary(String authorizationHeader) {
        validateAdmin(authorizationHeader);
        log.info("[ADMIN_API] getUserManagementSummary start");

        AdminUserManagementSummary summary = selectUserManagementSummaryCountsSafely();
        summary.setLatestJoinedMember(selectLatestJoinedMemberSafely());
        summary.setLatestSanctionedMember(selectLatestSanctionedMemberSafely());
        summary.setActionLogs(selectRecentAdminActionLogsSafely());

        log.info(
                "[ADMIN_API] getUserManagementSummary success total={} normal={} admin={} suspended={} logs={}",
                summary.getTotalMemberCount(),
                summary.getNormalMemberCount(),
                summary.getAdminMemberCount(),
                summary.getSuspendedMemberCount(),
                summary.getActionLogs() == null ? 0 : summary.getActionLogs().size()
        );

        return summary;
    }

    /*
     * 사용자 관리 하단 요약 숫자를 안전하게 조회합니다.
     *
     * 초보자 설명:
     * - 이 API는 화면 하단의 보조 정보라서, 특정 조회 하나가 실패해도
     *   사용자 관리 페이지 전체가 500 에러로 멈추면 안 됩니다.
     * - 회원 목록 API는 정상인데 요약 API만 실패하는 상황을 막기 위해
     *   각 조회를 작은 단위로 나누고 실패 시 기본값을 내려줍니다.
     */
    private AdminUserManagementSummary selectUserManagementSummaryCountsSafely() {
        AdminUserManagementSummary summary = null;

        try {
            log.info("[ADMIN_API] selectUserManagementSummaryCounts start");
            summary = adminDao.selectUserManagementSummaryCounts();
        } catch (RuntimeException e) {
            log.error("[ADMIN_API] selectUserManagementSummaryCounts failed. fallback to selectMembers", e);
            summary = buildSummaryCountsFromMemberList();
        }

        if (summary == null) {
            summary = new AdminUserManagementSummary();
        }

        summary.setTotalMemberCount(defaultLong(summary.getTotalMemberCount()));
        summary.setNormalMemberCount(defaultLong(summary.getNormalMemberCount()));
        summary.setAdminMemberCount(defaultLong(summary.getAdminMemberCount()));
        summary.setSuspendedMemberCount(defaultLong(summary.getSuspendedMemberCount()));
        summary.setActionLogs(Collections.emptyList());

        return summary;
    }

    /*
     * 요약 count 전용 SQL이 실패했을 때 사용하는 예비 계산입니다.
     *
     * 초보자 설명:
     * - 현재 회원 목록 API는 정상 동작하고 있으므로 같은 목록 데이터를 다시 가져와서
     *   Java 코드에서 회원 수를 계산합니다.
     * - DB count 쿼리 하나 때문에 화면 하단 전체가 실패하는 것을 막기 위한 안전장치입니다.
     */
    private AdminUserManagementSummary buildSummaryCountsFromMemberList() {
        AdminUserManagementSummary summary = new AdminUserManagementSummary();

        try {
            log.info("[ADMIN_API] buildSummaryCountsFromMemberList start");
            List<AdminMember> members = adminDao.selectMembers();

            long totalMemberCount = members == null ? 0L : members.size();
            long normalMemberCount = 0L;
            long adminMemberCount = 0L;
            long suspendedMemberCount = 0L;

            if (members != null) {
                for (AdminMember member : members) {
                    String role = member.getRole();
                    String status = member.getStatus();

                    if ("USER".equals(role) || "MEMBER".equals(role)) {
                        normalMemberCount++;
                    }

                    if ("ADMIN".equals(role) || "NORMAL_ADMIN".equals(role) || "SUPER_ADMIN".equals(role)) {
                        adminMemberCount++;
                    }

                    if ("SUSPENDED".equals(status)) {
                        suspendedMemberCount++;
                    }
                }
            }

            summary.setTotalMemberCount(totalMemberCount);
            summary.setNormalMemberCount(normalMemberCount);
            summary.setAdminMemberCount(adminMemberCount);
            summary.setSuspendedMemberCount(suspendedMemberCount);
            log.info(
                    "[ADMIN_API] buildSummaryCountsFromMemberList success total={} normal={} admin={} suspended={}",
                    totalMemberCount,
                    normalMemberCount,
                    adminMemberCount,
                    suspendedMemberCount
            );
        } catch (RuntimeException e) {
            log.error("[ADMIN_API] buildSummaryCountsFromMemberList failed", e);
            summary.setTotalMemberCount(0L);
            summary.setNormalMemberCount(0L);
            summary.setAdminMemberCount(0L);
            summary.setSuspendedMemberCount(0L);
        }

        return summary;
    }

    private Long defaultLong(Long value) {
        return value == null ? 0L : value;
    }

    /*
     * 최근 가입 회원 조회가 실패해도 요약 API 전체가 실패하지 않도록 null을 반환합니다.
     * 프론트에서는 null인 경우 "가입 정보 없음"처럼 안전한 문구를 표시합니다.
     */
    private com.moodcast.admin.vo.AdminRecentMember selectLatestJoinedMemberSafely() {
        try {
            log.info("[ADMIN_API] selectLatestJoinedMember start");
            return adminDao.selectLatestJoinedMember();
        } catch (RuntimeException e) {
            log.error("[ADMIN_API] selectLatestJoinedMember failed", e);
            return null;
        }
    }

    /*
     * 최근 제재 회원 조회는 admin_action_logs를 함께 보기 때문에
     * 데이터 형태가 예상과 다르면 실패할 수 있어 별도로 보호합니다.
     */
    private com.moodcast.admin.vo.AdminRecentMember selectLatestSanctionedMemberSafely() {
        try {
            log.info("[ADMIN_API] selectLatestSanctionedMember start");
            return adminDao.selectLatestSanctionedMember();
        } catch (RuntimeException e) {
            log.error("[ADMIN_API] selectLatestSanctionedMember failed", e);
            return null;
        }
    }

    /*
     * 최근 작업 로그 목록 조회 실패 시 빈 목록을 내려줍니다.
     * 이렇게 하면 원형 그래프와 최근 가입 회원 정보는 계속 표시될 수 있습니다.
     */
    private List<AdminActionLogView> selectRecentAdminActionLogsSafely() {
        try {
            log.info("[ADMIN_API] selectRecentAdminActionLogs start");
            List<AdminActionLogView> actionLogs = adminDao.selectRecentAdminActionLogs();
            log.info("[ADMIN_API] selectRecentAdminActionLogs success size={}", actionLogs == null ? 0 : actionLogs.size());

            return actionLogs == null ? Collections.emptyList() : actionLogs;
        } catch (RuntimeException e) {
            log.error("[ADMIN_API] selectRecentAdminActionLogs failed", e);
            return Collections.emptyList();
        }
    }

    /*
     * 전체 권한 변경 로그 조회
     * --------------------------------------------------------------------------
     * 사용자 관리 페이지의 "전체 로그 보기" 팝업에서 사용하는 목록입니다.
     * 하단 요약 영역은 최근 10개만 보여주고, 전체 로그는 버튼을 눌렀을 때만 조회합니다.
     */
    public List<AdminActionLogView> getAllAdminActionLogs(String authorizationHeader) {
        validateAdmin(authorizationHeader);
        log.info("[ADMIN_API] selectAllAdminActionLogs start");

        List<AdminActionLogView> actionLogs = adminDao.selectAllAdminActionLogs();
        log.info("[ADMIN_API] selectAllAdminActionLogs success size={}", actionLogs == null ? 0 : actionLogs.size());

        return actionLogs == null ? Collections.emptyList() : actionLogs;
    }

    /* ==========================================================================
     * 회원 상세 정보 조회
     * --------------------------------------------------------------------------
     * 사용자 관리 페이지에서 "회원 정보 전체 보기" 버튼을 눌렀을 때 호출됩니다.
     *
     * 처리 흐름:
     * 1. 요청자가 관리자 권한을 가진 사용자인지 먼저 확인합니다.
     * 2. memberId가 비어 있으면 잘못된 요청으로 처리합니다.
     * 3. DAO를 통해 members 테이블의 상세 정보를 조회합니다.
     * 4. 조회 결과가 없으면 404 NOT_FOUND로 응답합니다.
     *
     * 보안 기준:
     * - password_hash는 VO와 SQL에서 제외되어 있어 응답에 포함되지 않습니다.
     * ========================================================================== */
    public AdminMemberDetail getMemberDetail(String authorizationHeader, Long memberId) {
        validateAdmin(authorizationHeader);

        if (memberId == null) {
            throw new IllegalArgumentException("조회할 회원을 선택해주세요.");
        }

        AdminMemberDetail memberDetail = adminDao.selectMemberDetail(memberId);

        if (memberDetail == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "회원 정보를 찾을 수 없습니다.");
        }

        return memberDetail;
    }

    /* ==========================================================================
     * 회원 정지 처리
     * --------------------------------------------------------------------------
     * 사용자 관리 패널에서 "일시 정지" 또는 "영구 정지"를 확정했을 때 실행됩니다.
     *
     * 처리 흐름:
     * 1. 요청자가 관리자 권한인지 확인합니다.
     * 2. 정지 대상 회원이 존재하는지 확인합니다.
     * 3. 정지 유형에 따라 suspended_until 값을 계산합니다.
     *    - TEMPORARY: 미래 날짜 저장
     *    - PERMANENT: null 저장
     * 4. members.status를 SUSPENDED로 변경합니다.
     * 5. admin_action_logs에 관리자 작업 기록을 남깁니다.
     *
     * warning_count 안내 문구는 프론트에서 보여주지만,
     * 실제 정지 처리는 백엔드에서 한 번 더 권한과 대상 존재 여부를 확인합니다.
     * ========================================================================== */
    @Transactional
    public AdminMemberDetail suspendMember(
            String authorizationHeader,
            Long memberId,
            AdminMemberSuspendRequest request
    ) {
        LoginMemberResponse loginMember = validateAdmin(authorizationHeader);

        if (memberId == null) {
            throw new IllegalArgumentException("정지할 회원을 선택해주세요.");
        }

        if (request == null) {
            throw new IllegalArgumentException("정지 정보를 입력해주세요.");
        }

        AdminMemberDetail targetMember = adminDao.selectMemberDetail(memberId);

        if (targetMember == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "정지할 회원 정보를 찾을 수 없습니다.");
        }

        LocalDateTime suspendedUntil = calculateSuspendedUntil(request);
        int updated = adminDao.suspendMember(memberId, suspendedUntil);

        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "회원 정지 처리에 실패했습니다.");
        }

        String actionDetail = buildSuspendActionDetail(request.getSuspendType(), suspendedUntil);
        adminDao.insertAdminActionLog(
                loginMember.getMemberId(),
                "SUSPEND",
                "USER",
                memberId,
                actionDetail
        );

        return adminDao.selectMemberDetail(memberId);
    }

    private LocalDateTime calculateSuspendedUntil(AdminMemberSuspendRequest request) {
        String suspendType = request.getSuspendType();

        if ("PERMANENT".equals(suspendType)) {
            return null;
        }

        if (!"TEMPORARY".equals(suspendType)) {
            throw new IllegalArgumentException("정지 유형을 올바르게 선택해주세요.");
        }

        if (request.getSuspendedUntil() != null && !request.getSuspendedUntil().trim().isEmpty()) {
            LocalDateTime customSuspendedUntil = LocalDate.parse(request.getSuspendedUntil().trim()).atTime(23, 59, 59);

            if (!customSuspendedUntil.isAfter(LocalDateTime.now())) {
                throw new IllegalArgumentException("정지 해제일은 현재보다 이후 날짜로 선택해주세요.");
            }

            return customSuspendedUntil;
        }

        Integer suspendDays = request.getSuspendDays();

        if (suspendDays == null || suspendDays <= 0) {
            throw new IllegalArgumentException("정지 기간을 선택해주세요.");
        }

        return LocalDateTime.now().plusDays(suspendDays);
    }

    private String buildSuspendActionDetail(String suspendType, LocalDateTime suspendedUntil) {
        if ("PERMANENT".equals(suspendType)) {
            return "회원 영구 정지";
        }

        return "회원 일시 정지, 해제 예정일: " + suspendedUntil;
    }

    /* ==========================================================================
     * 회원 정지 해제 처리
     * --------------------------------------------------------------------------
     * 정지 상태인 회원을 다시 ACTIVE 상태로 되돌립니다.
     *
     * 처리 기준:
     * - 정지 이력은 사라지면 안 되므로 suspension_count는 변경하지 않습니다.
     * - suspended_until만 null로 비우고 status를 ACTIVE로 변경합니다.
     * - admin_action_logs에는 RESTORE 작업을 append-only 방식으로 추가합니다.
     * ========================================================================== */
    @Transactional
    public AdminMemberDetail restoreSuspendedMember(String authorizationHeader, Long memberId) {
        LoginMemberResponse loginMember = validateAdmin(authorizationHeader);

        if (memberId == null) {
            throw new IllegalArgumentException("정지 해제할 회원을 선택해주세요.");
        }

        AdminMemberDetail targetMember = adminDao.selectMemberDetail(memberId);

        if (targetMember == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "정지 해제할 회원 정보를 찾을 수 없습니다.");
        }

        int updated = adminDao.restoreSuspendedMember(memberId);

        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "정지 상태인 회원만 정지 해제할 수 있습니다.");
        }

        adminDao.insertAdminActionLog(
                loginMember.getMemberId(),
                "RESTORE",
                "USER",
                memberId,
                "회원 정지 해제"
        );

        return adminDao.selectMemberDetail(memberId);
    }

    /* ==========================================================================
     * 관리자 권한 관리 대상 회원 검색
     * --------------------------------------------------------------------------
     * 관리자 권한 관리 페이지에서 "이메일" 또는 "실명" 기준으로 기존 회원을 찾습니다.
     *
     * searchType 설명:
     * - "email"이면 members.email 컬럼에서 검색합니다.
     * - "name"이면 members.name 컬럼에서 검색합니다.
     *
     * keyword 설명:
     * - 검색창에 입력한 실제 검색어입니다.
     * - 비어 있는 검색어면 전체 권한 관리 대상 회원을 조회합니다.
     * ========================================================================== */
    public List<AdminMember> searchMembersForAdminPromotion(
            String authorizationHeader,
            String searchType,
            String keyword
    ) {
        validateSuperAdmin(authorizationHeader);

        String normalizedSearchType =
                "name".equals(searchType) || "nickname".equals(searchType)
                        ? searchType
                        : "email";
        String normalizedKeyword = keyword == null ? "" : keyword.trim();

        log.info(
                "[ADMIN_API] searchMembersForAdminPromotion start searchType={} keywordLength={}",
                normalizedSearchType,
                normalizedKeyword.length()
        );
        List<AdminMember> members = adminDao.searchMembersForAdminPromotion(normalizedSearchType, normalizedKeyword);
        log.info("[ADMIN_API] searchMembersForAdminPromotion success size={}", members == null ? 0 : members.size());

        return members;
    }

    /* ==========================================================================
     * 회원 관리자 등급 변경
     * --------------------------------------------------------------------------
     * 관리자 권한 관리 페이지에서 선택한 ACTIVE 회원의 role을 변경합니다.
     *
     * 처리 규칙:
     * - 변경 가능한 role은 USER, NORMAL_ADMIN, SUPER_ADMIN 세 가지입니다.
     * - SQL에서도 ACTIVE 상태와 변경 가능한 role 조건을 다시 확인합니다.
     * - 조건에 맞지 않으면 400 BAD_REQUEST로 실패 처리합니다.
     * ========================================================================== */
    @Transactional
    public void promoteMemberToAdmin(
            String authorizationHeader,
            Long memberId,
            String role
    ) {
        LoginMemberResponse loginMember = validateSuperAdmin(authorizationHeader);

        if (memberId == null) {
            throw new IllegalArgumentException("관리자 등급을 변경할 회원을 선택해주세요.");
        }

        String normalizedRole = normalizeAdminRole(role);
        int updated = adminDao.updateMemberRoleForAdminPromotion(memberId, normalizedRole);

        if (updated != 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "ACTIVE 상태의 회원만 관리자 등급을 변경할 수 있습니다."
            );
        }

        adminDao.insertAdminActionLog(
                loginMember.getMemberId(),
                "UPDATE_ADMIN_ROLE",
                "USER",
                memberId,
                "회원 관리자 등급 변경: " + normalizedRole
        );
    }

    private String normalizeAdminRole(String role) {
        if ("SUPER_ADMIN".equals(role)) {
            return "SUPER_ADMIN";
        }

        if ("NORMAL_ADMIN".equals(role)) {
            return "NORMAL_ADMIN";
        }

        if ("USER".equals(role)) {
            return "USER";
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

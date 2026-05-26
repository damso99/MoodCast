import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import GppMaybeOutlinedIcon from "@mui/icons-material/GppMaybeOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { AdminLayout } from "../common/AdminLayout";
import { EmptyState } from "../common/EmptyState";
import { EmptyTableRow, TableShell } from "../common/TableShell";
import { MetricCard } from "../common/MetricCard";
import { SearchBar } from "../common/SearchBar";
import { SegmentedControl } from "../common/SegmentedControl";
import { UserManagementDrawer } from "./UserManagementDrawer";
import { useAuthStore } from "../../../../hooks/useAuthStore";
import { formatKoreanDate } from "../../../../shared/lib/dateTime";
import styles from "../../adminComponentsCss/userManagement/UserManagementPage.module.css";

/* ==========================================================================
 * 사용자 관리 페이지
 * --------------------------------------------------------------------------
 * 일반 회원, 정지 회원, 관리자 회원의 계정 권한을 관리하는 화면입니다.
 *
 * 담당 기능:
 * - 회원 상태별 필터 버튼
 * - 이름/아이디 검색창
 * - 회원 상태 요약 카드
 * - 사용자 목록 테이블
 * - 관리자 권한 관리 페이지로 이동하는 버튼
 * - 권한 변경 로그 영역
 *
 * selectedUserType 상태 설명:
 * - 사용자가 "전체 / 일반 회원 / 정지 회원 / 관리자 회원" 탭을 누르면
 *   어떤 탭이 선택됐는지 기억하는 값입니다.
 * - 지금은 백엔드 데이터가 없어서 실제 목록 필터링은 하지 않고,
 *   선택한 탭에 맞는 제목과 안내 문구만 바꿔서 UI 동작을 확인할 수 있게 했습니다.
 *
 * totalMemberCount 상태 설명:
 * - members 테이블에 저장된 전체 회원 수를 기억하는 값입니다.
 * - 화면의 기존 구성은 그대로 두고, "전체 회원" 카드의 숫자만 이 값으로 교체합니다.
 *
 * members 상태 설명:
 * - members 테이블에서 조회한 전체 회원 목록을 기억하는 배열입니다.
 * - "전체 / 일반 회원 / 관리자 회원" 탭에 맞춰 화면에서 필터링해서 출력합니다.
 * - 정지 회원 탭은 status가 SUSPENDED인 회원만 보여줍니다.
 *
 * searchField / searchKeyword 상태 설명:
 * - searchField는 이름, 닉네임, 이메일 중 어떤 기준으로 검색할지 기억합니다.
 * - searchKeyword는 검색창에 입력한 실제 검색어를 기억합니다.
 *
 * selectedManagedMember 상태 설명:
 * - 전체 목록에서 "관리" 버튼을 누른 회원 정보를 기억합니다.
 * - 값이 있으면 오른쪽에 회원 관리 패널을 열고, 값이 null이면 패널을 닫습니다.
 * - 지금 패널은 현재 목록 API에서 받은 기본 회원 정보로 구성되어 있습니다.
 *   신고 횟수, 게시글 수, 댓글 수처럼 아직 별도 API가 없는 값은 안전한 기본값을 표시합니다.
 * ========================================================================== */
export function UserManagementPage() {
  const [selectedUserType, setSelectedUserType] = useState("전체");
  const [searchField, setSearchField] = useState("name");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMemberCount, setTotalMemberCount] = useState(null);
  const [totalMemberCountError, setTotalMemberCountError] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(false);
  const [selectedManagedMember, setSelectedManagedMember] = useState(null);
  const { accessToken } = useAuthStore();

  const BACKSERVER = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";
  const MEMBERS_PER_PAGE = 10; // 한 페이지에 보여줄 회원 수입니다.
  const PAGE_BUTTON_COUNT = 10; // 페이지 번호 버튼은 1~10처럼 최대 10개씩 보여줍니다.

  const userTypeDescriptions = {
    전체: "전체 회원 목록이 이 영역에 표시됩니다.",
    "일반 회원": "정상 이용 중인 일반 회원 목록이 이 영역에 표시됩니다.",
    "정지 회원":
      "일시정지 또는 이용 제한 상태의 회원 목록이 이 영역에 표시됩니다.",
    "관리자 회원": "관리자 권한을 가진 계정 목록이 이 영역에 표시됩니다.",
  };

  const searchPlaceholder = {
    name: "이름으로 검색",
    nickname: "닉네임으로 검색",
    email: "이메일로 검색",
  };

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    /* ========================================================================
     * 전체 회원 수 조회
     * ------------------------------------------------------------------------
     * 이 요청은 상단의 "전체 회원" 카드 숫자만 바꾸기 위한 요청입니다.
     *
     * 주의:
     * - 기존 사용자 관리 화면의 탭, 검색창, 관리자 추가 버튼, 목록 영역은 건드리지 않습니다.
     * - 요청이 실패해도 화면 전체가 깨지지 않도록 숫자만 "-"로 유지합니다.
     * ======================================================================== */
    axios
      .get(`${BACKSERVER}/admin/api/members/count`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((res) => {
        const count = res.data?.totalMemberCount;

        setTotalMemberCount(typeof count === "number" ? count : 0);
        setTotalMemberCountError(false);
      })
      .catch((error) => {
        console.log(error);
        setTotalMemberCount(null);
        setTotalMemberCountError(true);
      });
  }, [BACKSERVER, accessToken]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    /* ========================================================================
     * 전체 회원 목록 조회
     * ------------------------------------------------------------------------
     * 이 요청은 "전체" 탭에 표시할 테이블 행을 만들기 위한 요청입니다.
     *
     * 주의:
     * - 기존 테이블 구조와 컬럼은 유지합니다.
     * - 현재는 전체 탭만 실제 데이터로 채우고, 다른 탭은 기존처럼 빈 상태로 둡니다.
     * ======================================================================== */
    setMembersLoading(true);
    setMembersError(false);

    axios
      .get(`${BACKSERVER}/admin/api/members`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((res) => {
        const nextMembers = Array.isArray(res.data?.members)
          ? res.data.members
          : [];

        setMembers(nextMembers);
      })
      .catch((error) => {
        console.log(error);
        setMembers([]);
        setMembersError(true);
      })
      .finally(() => {
        setMembersLoading(false);
      });
  }, [BACKSERVER, accessToken]);

  const tabFilteredMembers = members.filter((member) => {
    if (selectedUserType === "일반 회원") {
      return member.role === "USER";
    }

    if (selectedUserType === "관리자 회원") {
      return ["ADMIN", "NORMAL_ADMIN", "SUPER_ADMIN"].includes(member.role);
    }

    if (selectedUserType === "정지 회원") {
      return member.status === "SUSPENDED";
    }

    return true;
  });

  const visibleMembers = tabFilteredMembers.filter((member) => {
    const trimmedKeyword = searchKeyword.trim().toLowerCase();

    if (!trimmedKeyword) {
      return true;
    }

    const targetValue = String(member[searchField] || "").toLowerCase();

    return targetValue.includes(trimmedKeyword);
  });

  const totalPageCount = Math.max(
    1,
    Math.ceil(visibleMembers.length / MEMBERS_PER_PAGE),
  );
  const pageStartIndex = (currentPage - 1) * MEMBERS_PER_PAGE;
  const paginatedMembers = visibleMembers.slice(
    pageStartIndex,
    pageStartIndex + MEMBERS_PER_PAGE,
  );
  const pageGroupStart =
    Math.floor((currentPage - 1) / PAGE_BUTTON_COUNT) * PAGE_BUTTON_COUNT + 1;
  const pageGroupEnd = Math.min(
    pageGroupStart + PAGE_BUTTON_COUNT - 1,
    totalPageCount,
  );
  const pageNumbers = Array.from(
    { length: pageGroupEnd - pageGroupStart + 1 },
    (_, index) => pageGroupStart + index,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUserType, searchField, searchKeyword]);

  useEffect(() => {
    if (currentPage > totalPageCount) {
      setCurrentPage(totalPageCount);
    }
  }, [currentPage, totalPageCount]);

  const normalMemberCount = members.filter(
    (member) => member.role === "USER",
  ).length;

  // members 목록 중 status가 SUSPENDED인 회원만 세어서 "정지 회원" 카드에 표시합니다.
  // 백엔드에서 이미 회원 목록을 받아오고 있으므로, 별도 API를 만들지 않고 현재 화면 데이터 기준으로 계산합니다.
  const suspendedMemberCount = members.filter(
    (member) => member.status === "SUSPENDED",
  ).length;

  const adminMemberCount = members.filter((member) =>
    ["ADMIN", "NORMAL_ADMIN", "SUPER_ADMIN"].includes(member.role),
  ).length;

  const formatDate = (value) => {
    return formatKoreanDate(value);
  };

  const getStatusLabel = (status) => {
    if (status === "ACTIVE") {
      return "정상";
    }

    if (status === "SUSPENDED") {
      return "정지";
    }

    if (status === "DELETED") {
      return "삭제";
    }

    return status || "-";
  };

  const isSuspendedMember = (member) => {
    return member?.status === "SUSPENDED";
  };

  const isPermanentSuspension = (member) => {
    return isSuspendedMember(member) && !member?.suspendedUntil;
  };

  const isTemporarySuspension = (member) => {
    return isSuspendedMember(member) && Boolean(member?.suspendedUntil);
  };

  const getMemberStatusLabel = (member) => {
    if (isPermanentSuspension(member)) {
      return "영구 정지";
    }

    if (isTemporarySuspension(member)) {
      return "일시 정지";
    }

    return getStatusLabel(member?.status);
  };

  const getRoleLabel = (role) => {
    if (role === "USER") {
      return "일반 회원";
    }

    if (role === "ADMIN" || role === "NORMAL_ADMIN") {
      return "관리자";
    }

    if (role === "SUPER_ADMIN") {
      return "슈퍼 관리자";
    }

    return role || "-";
  };

  const handleMemberUpdated = (updatedMember) => {
    setMembers((prevMembers) =>
      prevMembers.map((member) =>
        member.memberId === updatedMember.memberId
          ? { ...member, ...updatedMember }
          : member,
      ),
    );
    setSelectedManagedMember((prevMember) =>
      prevMember ? { ...prevMember, ...updatedMember } : prevMember,
    );
  };

  return (
    <AdminLayout
      title="사용자 관리"
      description="회원 정보를 확인하고 계정 권한을 관리하세요."
    >
      <section className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <SegmentedControl
            labels={["전체", "일반 회원", "정지 회원", "관리자 회원"]}
            selectedLabel={selectedUserType}
            onSelect={setSelectedUserType}
          />
          <div className={styles.searchControls}>
            <select
              className={styles.searchSelect}
              value={searchField}
              onChange={(event) => setSearchField(event.target.value)}
              aria-label="회원 검색 기준"
            >
              <option value="name">이름</option>
              <option value="nickname">닉네임</option>
              <option value="email">이메일</option>
            </select>
            <SearchBar
              placeholder={searchPlaceholder[searchField]}
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </div>
        </div>
        <NavLink className={styles.primaryLinkButton} to="/admin/users/new">
          관리자 권한 관리
        </NavLink>
      </section>

      <section className={styles.metricGrid}>
        <MetricCard
          label="전체 회원"
          value={
            totalMemberCount === null ? "-" : totalMemberCount.toLocaleString()
          }
          helperText={totalMemberCountError ? "조회 실패" : ""}
          icon={<GroupOutlinedIcon />}
        />
        <MetricCard
          label="일반 회원"
          value={normalMemberCount.toLocaleString()}
          icon={<AccountCircleOutlinedIcon />}
          accent="blue"
        />
        <MetricCard
          label="정지 회원"
          value={suspendedMemberCount.toLocaleString()}
          icon={<GppMaybeOutlinedIcon />}
          accent="orange"
        />
        <MetricCard
          label="관리자 회원"
          value={adminMemberCount.toLocaleString()}
          icon={<DashboardOutlinedIcon />}
          accent="pink"
        />
      </section>

      <TableShell
        title={`${selectedUserType} 목록`}
        columns={["사용자", "이메일", "상태", "가입일", "권한", "작업"]}
        className={styles.userTable}
        footer={
          visibleMembers.length > 0 ? (
            <nav className={styles.pagination} aria-label="회원 목록 페이지 이동">
              <div className={styles.paginationButtons}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  이전
                </button>
                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={
                      pageNumber === currentPage ? styles.activePage : ""
                    }
                    aria-current={
                      pageNumber === currentPage ? "page" : undefined
                    }
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPageCount}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPageCount, page + 1),
                    )
                  }
                >
                  다음
                </button>
              </div>
            </nav>
          ) : null
        }
      >
        {membersLoading ? (
          <EmptyTableRow colSpan={6} label="회원 목록을 불러오는 중입니다." />
        ) : membersError ? (
          <EmptyTableRow colSpan={6} label="회원 목록 조회 실패" />
        ) : visibleMembers.length === 0 ? (
          <EmptyTableRow colSpan={6} label={`${selectedUserType} 데이터 없음`} />
        ) : (
          paginatedMembers.map((member) => (
            <tr key={member.memberId}>
              <td>
                <div className={styles.userCell}>
                  <strong>{member.name || "-"}</strong>
                  <span>
                    {member.nickname ? `@${member.nickname}` : "닉네임 없음"}
                  </span>
                </div>
              </td>
              <td>
                <span className={styles.emailText}>{member.email || "-"}</span>
              </td>
              <td>
                <span
                  className={`${styles.statusBadge} ${
                    member.status === "SUSPENDED" ? styles.warningBadge : ""
                  } ${isPermanentSuspension(member) ? styles.permanentStatusBadge : ""}`}
                >
                  {getMemberStatusLabel(member)}
                </span>
              </td>
              <td>{formatDate(member.createdAt)}</td>
              <td>{getRoleLabel(member.role)}</td>
              <td>
                <button
                  type="button"
                  className={styles.tableActionButton}
                  onClick={() => setSelectedManagedMember(member)}
                >
                  관리
                </button>
              </td>
            </tr>
          ))
        )}
      </TableShell>

      <section className={styles.infoGrid}>
        <article className={styles.infoBox}>
          <strong>{selectedUserType} 탭 역할</strong>
          <p>{userTypeDescriptions[selectedUserType]}</p>
        </article>
        <article className={styles.infoBox}>
          <strong>관리자 권한 관리 정보</strong>
          <p>
            관리자 권한 관리 버튼을 누르면 가입된 회원을 이메일 또는 이름으로
            검색한 뒤 관리자 권한을 부여하거나 해제하는 화면으로 이동합니다.
          </p>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>권한 변경 로그</h2>
        </div>
        <EmptyState
          title="변경 내역 없음"
          description="권한 변경 이력이 생기면 최신순으로 표시됩니다."
        />
      </section>

      {/* 회원 관리 우측 패널: 관리 버튼을 누른 회원의 상세 정보와 정지/해제 작업을 담당합니다. */}
      <UserManagementDrawer
        selectedManagedMember={selectedManagedMember}
        onClose={() => setSelectedManagedMember(null)}
        onMemberUpdated={handleMemberUpdated}
      />
    </AdminLayout>
  );
}


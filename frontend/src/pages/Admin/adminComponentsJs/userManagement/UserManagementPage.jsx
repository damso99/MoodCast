import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import GppMaybeOutlinedIcon from "@mui/icons-material/GppMaybeOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PauseCircleOutlineOutlinedIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import { AdminLayout } from "../common/AdminLayout";
import { EmptyState } from "../common/EmptyState";
import { EmptyTableRow, TableShell } from "../common/TableShell";
import { MetricCard } from "../common/MetricCard";
import { SearchBar } from "../common/SearchBar";
import { SegmentedControl } from "../common/SegmentedControl";
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
 * - 관리자 추가 페이지로 이동하는 버튼
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
 * - 정지 회원 탭은 정지 기준이 확정되지 않았으므로 아직 실제 필터링을 연결하지 않습니다.
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
  const [totalMemberCount, setTotalMemberCount] = useState(null);
  const [totalMemberCountError, setTotalMemberCountError] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(false);
  const [selectedManagedMember, setSelectedManagedMember] = useState(null);
  const [memberDetail, setMemberDetail] = useState(null);
  const [memberDetailLoading, setMemberDetailLoading] = useState(false);
  const [memberDetailError, setMemberDetailError] = useState("");
  const [suspendModalType, setSuspendModalType] = useState(null);
  const [selectedSuspendDays, setSelectedSuspendDays] = useState(7);
  const [customSuspendDate, setCustomSuspendDate] = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [suspendError, setSuspendError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const { accessToken } = useAuthStore();

  const BACKSERVER = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";

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
    setMemberDetail(null);
    setMemberDetailError("");
    setMemberDetailLoading(false);
    setSuspendModalType(null);
    setSelectedSuspendDays(7);
    setCustomSuspendDate("");
    setSuspendError("");
    setSuspendLoading(false);
    setActionMessage("");
  }, [selectedManagedMember?.memberId]);

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

    if (role === "ADMIN") {
      return "관리자";
    }

    if (role === "SUPER_ADMIN") {
      return "슈퍼 관리자";
    }

    return role || "-";
  };

  const getLastLoginLabel = (member) => {
    return formatDate(member?.lastLoginAt) || "기록 없음";
  };

  const getLoginMethodLabel = (member) => {
    return member?.passwordHash === null ? "소셜 로그인" : "이메일 / 비밀번호";
  };

  const getWarningCount = (member) => {
    return Number(member?.warningCount ?? 0);
  };

  const getSuspendConfirmMessage = (member) => {
    const warningCount = getWarningCount(member);

    if (warningCount >= 3) {
      return `해당 회원의 경고 횟수는 ${warningCount}회입니다. 정지 처리를 진행하시겠습니까?`;
    }

    return `해당 회원의 경고 횟수는 ${warningCount}회입니다. 경고 누적이 3회 미만이므로 무고한 제재가 되지 않도록 한 번 더 확인해주세요. 그래도 정지하시겠습니까?`;
  };

  const getVerifiedLabel = (value) => {
    return value === 1 ? "인증 완료" : "미인증";
  };

  const getEmptySafeText = (value) => {
    return value === null || value === undefined || value === "" ? "-" : value;
  };

  const handleMemberDetailClick = () => {
    if (!selectedManagedMember || !accessToken) {
      return;
    }

    setMemberDetailLoading(true);
    setMemberDetailError("");

    axios
      .get(`${BACKSERVER}/admin/api/members/${selectedManagedMember.memberId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((res) => {
        setMemberDetail(res.data);
      })
      .catch((error) => {
        console.log(error);
        setMemberDetail(null);
        setMemberDetailError("회원 상세 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        setMemberDetailLoading(false);
      });
  };

  const openSuspendModal = (type) => {
    setSuspendModalType(type);
    setSelectedSuspendDays(7);
    setCustomSuspendDate("");
    setSuspendError("");
  };

  const closeSuspendModal = () => {
    if (suspendLoading) {
      return;
    }

    setSuspendModalType(null);
    setSuspendError("");
  };

  const handleSuspendConfirm = () => {
    if (!selectedManagedMember || !accessToken) {
      return;
    }

    const requestBody =
      suspendModalType === "PERMANENT"
        ? { suspendType: "PERMANENT" }
        : {
            suspendType: "TEMPORARY",
            suspendDays: customSuspendDate ? null : selectedSuspendDays,
            suspendedUntil: customSuspendDate || null,
          };

    setSuspendLoading(true);
    setSuspendError("");

    axios
      .put(
        `${BACKSERVER}/admin/api/members/${selectedManagedMember.memberId}/suspend`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )
      .then((res) => {
        const updatedMember = res.data?.member;
        const resultText =
          suspendModalType === "PERMANENT"
            ? "회원을 영구 정지했습니다."
            : "회원을 일시 정지했습니다.";

        if (updatedMember) {
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
          setMemberDetail((prevDetail) =>
            prevDetail ? { ...prevDetail, ...updatedMember } : prevDetail,
          );
        }

        setActionMessage(resultText);
        setSuspendModalType(null);
      })
      .catch((error) => {
        console.log(error);
        setSuspendError("회원 정지 처리에 실패했습니다. 잠시 후 다시 시도해주세요.");
      })
      .finally(() => {
        setSuspendLoading(false);
      });
  };

  const handleRestoreConfirm = () => {
    if (!selectedManagedMember || !accessToken) {
      return;
    }

    const confirmed = window.confirm(
      `${selectedManagedMember.name || "선택한 회원"} 회원의 정지를 해제하시겠습니까?`,
    );

    if (!confirmed) {
      return;
    }

    setSuspendLoading(true);
    setSuspendError("");

    axios
      .put(
        `${BACKSERVER}/admin/api/members/${selectedManagedMember.memberId}/restore`,
        null,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )
      .then((res) => {
        const updatedMember = res.data?.member;

        if (updatedMember) {
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
          setMemberDetail((prevDetail) =>
            prevDetail ? { ...prevDetail, ...updatedMember } : prevDetail,
          );
        }

        setActionMessage("회원 정지를 해제했습니다.");
      })
      .catch((error) => {
        console.log(error);
        setSuspendError("회원 정지 해제에 실패했습니다. 잠시 후 다시 시도해주세요.");
      })
      .finally(() => {
        setSuspendLoading(false);
      });
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
          관리자 추가
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
      >
        {membersLoading ? (
          <EmptyTableRow colSpan={6} label="회원 목록을 불러오는 중입니다." />
        ) : membersError ? (
          <EmptyTableRow colSpan={6} label="회원 목록 조회 실패" />
        ) : visibleMembers.length === 0 ? (
          <EmptyTableRow colSpan={6} label={`${selectedUserType} 데이터 없음`} />
        ) : (
          visibleMembers.map((member) => (
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
          <strong>관리자 추가 정보</strong>
          <p>
            관리자 추가 버튼을 누르면 가입된 회원을 이메일 또는 이름으로 검색한
            뒤 관리자 권한으로 승급하는 화면으로 이동합니다.
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

      {selectedManagedMember && (
        <div className={styles.memberDrawerLayer}>
          <button
            type="button"
            className={styles.memberDrawerDim}
            aria-label="회원 관리 패널 닫기"
            onClick={() => setSelectedManagedMember(null)}
          />

          <aside
            className={styles.memberDrawer}
            aria-label={`${selectedManagedMember.name || "회원"} 관리 패널`}
          >
            <header className={styles.memberDrawerHeader}>
              <h2>회원 관리</h2>
              <button
                type="button"
                className={styles.drawerCloseButton}
                aria-label="회원 관리 패널 닫기"
                onClick={() => setSelectedManagedMember(null)}
              >
                <CloseOutlinedIcon fontSize="small" />
              </button>
            </header>

            <section className={styles.memberSummary}>
              <div className={styles.memberAvatar}>
                <AccountCircleOutlinedIcon />
              </div>
              <div className={styles.memberSummaryText}>
                <div className={styles.memberNameLine}>
                  <strong>{selectedManagedMember.name || "-"}</strong>
                  <span
                    className={`${styles.normalStatusBadge} ${
                      isTemporarySuspension(selectedManagedMember)
                        ? styles.temporarySummaryBadge
                        : ""
                    } ${
                      isPermanentSuspension(selectedManagedMember)
                        ? styles.permanentSummaryBadge
                        : ""
                    }`}
                  >
                    {getMemberStatusLabel(selectedManagedMember)}
                  </span>
                </div>
                <p>
                  {selectedManagedMember.nickname
                    ? `@${selectedManagedMember.nickname}`
                    : "닉네임 없음"}
                </p>
                <small>
                  {getRoleLabel(selectedManagedMember.role)} <span>|</span> 가입일{" "}
                  {formatDate(selectedManagedMember.createdAt)}
                </small>
              </div>
            </section>

            {actionMessage && (
              <p className={styles.actionMessage}>{actionMessage}</p>
            )}

            <section className={styles.drawerCard}>
              <h3>제재 관리</h3>
              <div className={styles.sanctionGrid}>
                {isTemporarySuspension(selectedManagedMember) ? (
                  <button
                    type="button"
                    className={styles.restoreSanctionButton}
                    onClick={handleRestoreConfirm}
                    disabled={suspendLoading}
                  >
                    <PauseCircleOutlineOutlinedIcon />
                    <strong>정지 해제</strong>
                    <span>일시 정지 상태 해제</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.temporarySanctionButton}
                    onClick={() => openSuspendModal("TEMPORARY")}
                    disabled={isPermanentSuspension(selectedManagedMember)}
                  >
                    <PauseCircleOutlineOutlinedIcon />
                    <strong>일시 정지</strong>
                    <span>특정 기간 동안 활동 제한</span>
                  </button>
                )}
                {isPermanentSuspension(selectedManagedMember) ? (
                  <button
                    type="button"
                    className={styles.restoreSanctionButton}
                    onClick={handleRestoreConfirm}
                    disabled={suspendLoading}
                  >
                    <LockOutlinedIcon />
                    <strong>정지 해제</strong>
                    <span>영구 정지 상태 해제</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.permanentSanctionButton}
                    onClick={() => openSuspendModal("PERMANENT")}
                  >
                    <LockOutlinedIcon />
                    <strong>영구 정지</strong>
                    <span>계정 영구 이용 제한</span>
                  </button>
                )}
              </div>
            </section>

            <section className={styles.drawerCard}>
              <div className={styles.drawerCardHead}>
                <h3>회원 정보</h3>
                <button
                  type="button"
                  className={styles.copyButton}
                  aria-label="회원 이메일 복사"
                  onClick={() =>
                    navigator.clipboard?.writeText(selectedManagedMember.email || "")
                  }
                >
                  <ContentCopyOutlinedIcon fontSize="small" />
                </button>
              </div>
              <dl className={styles.memberInfoList}>
                <div>
                  <dt>이메일</dt>
                  <dd>{selectedManagedMember.email || "-"}</dd>
                </div>
                <div>
                  <dt>최근 로그인</dt>
                  <dd>{getLastLoginLabel(selectedManagedMember)}</dd>
                </div>
                <div>
                  <dt>가입일</dt>
                  <dd>{formatDate(selectedManagedMember.createdAt)}</dd>
                </div>
                <div>
                  <dt>신고 횟수</dt>
                  <dd>{selectedManagedMember.reportCount ?? 0}회</dd>
                </div>
                <div>
                  <dt>게시글 수</dt>
                  <dd>{selectedManagedMember.postCount ?? 0}개</dd>
                </div>
                <div>
                  <dt>댓글 수</dt>
                  <dd>{selectedManagedMember.commentCount ?? 0}개</dd>
                </div>
                <div>
                  <dt>로그인 방식</dt>
                  <dd>{getLoginMethodLabel(selectedManagedMember)}</dd>
                </div>
              </dl>
              <button
                type="button"
                className={styles.fullInfoButton}
                onClick={handleMemberDetailClick}
                disabled={memberDetailLoading}
              >
                {memberDetailLoading ? "회원 정보 불러오는 중" : "회원 정보 전체 보기"}
              </button>
              {memberDetailError && (
                <p className={styles.detailErrorText}>{memberDetailError}</p>
              )}
              {memberDetail && (
                <div className={styles.fullInfoPanel}>
                  <div>
                    <span>회원 번호</span>
                    <strong>{memberDetail.memberId}</strong>
                  </div>
                  <div>
                    <span>이메일</span>
                    <strong>{getEmptySafeText(memberDetail.email)}</strong>
                  </div>
                  <div>
                    <span>이름</span>
                    <strong>{getEmptySafeText(memberDetail.name)}</strong>
                  </div>
                  <div>
                    <span>닉네임</span>
                    <strong>{getEmptySafeText(memberDetail.nickname)}</strong>
                  </div>
                  <div>
                    <span>전화번호</span>
                    <strong>{getEmptySafeText(memberDetail.phone)}</strong>
                  </div>
                  <div>
                    <span>이메일 인증</span>
                    <strong>{getVerifiedLabel(memberDetail.emailVerified)}</strong>
                  </div>
                  <div>
                    <span>전화번호 인증</span>
                    <strong>{getVerifiedLabel(memberDetail.phoneVerified)}</strong>
                  </div>
                  <div>
                    <span>경고 횟수</span>
                    <strong>{getWarningCount(memberDetail)}회</strong>
                  </div>
                  <div>
                    <span>누적 정지</span>
                    <strong>{memberDetail.suspensionCount ?? 0}회</strong>
                  </div>
                  <div>
                    <span>정지 해제일</span>
                    <strong>{formatDate(memberDetail.suspendedUntil) || "-"}</strong>
                  </div>
                  <div>
                    <span>권한</span>
                    <strong>{getRoleLabel(memberDetail.role)}</strong>
                  </div>
                  <div>
                    <span>상태</span>
                    <strong>{getMemberStatusLabel(memberDetail)}</strong>
                  </div>
                  <div>
                    <span>최근 로그인</span>
                    <strong>{formatDate(memberDetail.lastLoginAt) || "기록 없음"}</strong>
                  </div>
                  <div>
                    <span>가입일</span>
                    <strong>{formatDate(memberDetail.createdAt)}</strong>
                  </div>
                  <div>
                    <span>수정일</span>
                    <strong>{formatDate(memberDetail.updatedAt) || "-"}</strong>
                  </div>
                  <div>
                    <span>삭제일</span>
                    <strong>{formatDate(memberDetail.deletedAt) || "-"}</strong>
                  </div>
                </div>
              )}
            </section>

            <section className={styles.drawerCard}>
              <h3>제재 이력</h3>
              <div className={styles.emptySanctionHistory}>
                <DescriptionOutlinedIcon />
                <strong>제재 이력이 없습니다.</strong>
              </div>
            </section>
          </aside>

          {suspendModalType && (
            <section className={styles.suspendModal} aria-label="회원 정지 확인">
              <button
                type="button"
                className={styles.suspendModalClose}
                aria-label="정지 확인 창 닫기"
                onClick={closeSuspendModal}
              >
                <CloseOutlinedIcon fontSize="small" />
              </button>

              <div
                className={
                  suspendModalType === "PERMANENT"
                    ? styles.permanentModalIcon
                    : styles.temporaryModalIcon
                }
              >
                {suspendModalType === "PERMANENT" ? (
                  <LockOutlinedIcon />
                ) : (
                  <PauseCircleOutlineOutlinedIcon />
                )}
              </div>

              <h3>
                {suspendModalType === "PERMANENT"
                  ? "회원 영구 정지"
                  : "회원 일시 정지"}
              </h3>
              <p className={styles.suspendTargetText}>
                {selectedManagedMember.name || "-"} (
                {selectedManagedMember.nickname
                  ? `@${selectedManagedMember.nickname}`
                  : "닉네임 없음"}
                ) 회원을 정지하시겠습니까?
              </p>
              <p
                className={
                  getWarningCount(selectedManagedMember) >= 3
                    ? styles.warningConfirmText
                    : styles.cautionConfirmText
                }
              >
                {getSuspendConfirmMessage(selectedManagedMember)}
              </p>

              {suspendModalType === "TEMPORARY" && (
                <div className={styles.suspendPeriodBox}>
                  <strong>정지 기간</strong>
                  {[7, 30, 90].map((days) => (
                    <label key={days} className={styles.suspendRadioLabel}>
                      <input
                        type="radio"
                        name="suspendDays"
                        checked={!customSuspendDate && selectedSuspendDays === days}
                        onChange={() => {
                          setSelectedSuspendDays(days);
                          setCustomSuspendDate("");
                        }}
                      />
                      <span>{days}일</span>
                    </label>
                  ))}
                  <label className={styles.suspendRadioLabel}>
                    <input
                      type="radio"
                      name="suspendDays"
                      checked={Boolean(customSuspendDate)}
                      onChange={() => setCustomSuspendDate("")}
                    />
                    <span>직접 설정</span>
                  </label>
                  <input
                    type="date"
                    className={styles.customDateInput}
                    value={customSuspendDate}
                    onChange={(event) => setCustomSuspendDate(event.target.value)}
                  />
                </div>
              )}

              {suspendModalType === "PERMANENT" && (
                <div className={styles.permanentNoticeBox}>
                  영구 정지는 해제 예정일 없이 계정 이용을 제한합니다. 진행 전
                  대상 회원과 경고 이력을 다시 확인해주세요.
                </div>
              )}

              {suspendError && (
                <p className={styles.detailErrorText}>{suspendError}</p>
              )}

              <div className={styles.suspendModalActions}>
                <button
                  type="button"
                  className={styles.suspendCancelButton}
                  onClick={closeSuspendModal}
                  disabled={suspendLoading}
                >
                  취소
                </button>
                <button
                  type="button"
                  className={styles.suspendConfirmButton}
                  onClick={handleSuspendConfirm}
                  disabled={suspendLoading}
                >
                  {suspendLoading
                    ? "처리 중"
                    : suspendModalType === "PERMANENT"
                      ? "영구 정지"
                      : "일시 정지"}
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

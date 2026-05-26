import { useEffect, useState } from "react";
import axios from "axios";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PauseCircleOutlineOutlinedIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import { useAuthStore } from "../../../../stores/useAuthStore";
import { formatKoreanDate } from "../../../../shared/lib/dateTime";
import styles from "../../adminComponentsCss/userManagement/UserManagementPage.module.css";

/* ==========================================================================
 * 사용자 관리 우측 패널 컴포넌트
 * --------------------------------------------------------------------------
 * 사용자 관리 목록에서 "관리" 버튼을 눌렀을 때 오른쪽에서 열리는 패널입니다.
 *
 * 담당 기능:
 * - 선택한 회원의 기본 정보 표시
 * - 일시 정지 / 영구 정지 / 정지 해제 버튼 표시
 * - 회원 정보 전체 보기 결과 표시
 * - 정지 확인 모달 표시
 *
 * 분리 이유:
 * - UserManagementPage.jsx 안에 목록, 검색, 카드, 패널, 모달 코드가 모두 있으면
 *   한 파일이 너무 길어져서 유지보수가 어려워집니다.
 * - 이 컴포넌트는 "오른쪽 회원 관리 패널"만 담당하게 분리했습니다.
 * ========================================================================== */
export function UserManagementDrawer({
  selectedManagedMember,
  onClose,
  onMemberUpdated,
}) {
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

  if (!selectedManagedMember) {
    return null;
  }

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
    if (!accessToken) {
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
    if (!accessToken) {
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
          onMemberUpdated(updatedMember);
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
    if (!accessToken) {
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
          onMemberUpdated(updatedMember);
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
    <div className={styles.memberDrawerLayer}>
      <button
        type="button"
        className={styles.memberDrawerDim}
        aria-label="회원 관리 패널 닫기"
        onClick={onClose}
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
            onClick={onClose}
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
  );
}

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
import styles from "../../adminComponentsCss/userManagement/UserManagementDrawer.module.css";

/* ==========================================================================
 * 사용자 관리 오른쪽 패널 컴포넌트
 * --------------------------------------------------------------------------
 * 사용자 관리 목록에서 "관리" 버튼을 눌렀을 때 오른쪽에서 열리는 상세 패널입니다.
 *
 * 담당 기능:
 * - 선택한 회원의 기본 정보 표시
 * - 회원 상세 정보 조회
 * - 일시 정지 / 영구 정지 / 정지 해제 처리
 * - 슈퍼 관리자 계정과 로그인한 관리자 본인 계정에 대한 제재 차단
 *
 * 초보자 설명:
 * - selectedManagedMember는 목록에서 선택한 회원입니다.
 * - currentAdminMemberId는 현재 로그인한 관리자 본인의 memberId입니다.
 * - 프론트에서 버튼을 비활성화해도 API를 직접 호출할 수 있으므로,
 *   백엔드에서도 같은 규칙을 한 번 더 검사합니다.
 * ========================================================================== */
export function UserManagementDrawer({
  selectedManagedMember,
  currentAdminMemberId,
  currentAdminRole,
  onClose,
  onMemberUpdated,
}) {
  const [memberDetail, setMemberDetail] = useState(null); // "회원 정보 전체 보기" API 응답을 저장합니다.
  const [memberDetailLoading, setMemberDetailLoading] = useState(false); // 상세 정보 조회 중인지 표시합니다.
  const [memberDetailError, setMemberDetailError] = useState(""); // 상세 정보 조회 실패 메시지입니다.
  const [suspendModalType, setSuspendModalType] = useState(null); // TEMPORARY 또는 PERMANENT 모달 종류입니다.
  const [selectedSuspendDays, setSelectedSuspendDays] = useState(7); // 일시 정지 기간 라디오 값입니다.
  const [customSuspendDate, setCustomSuspendDate] = useState(""); // 직접 선택한 정지 해제 날짜입니다.
  const [suspendLoading, setSuspendLoading] = useState(false); // 정지/해제 API 호출 중인지 표시합니다.
  const [suspendError, setSuspendError] = useState(""); // 정지/해제 실패 메시지입니다.
  const [actionResultPopup, setActionResultPopup] = useState(null); // 정지/해제 API가 끝난 뒤 성공/실패 결과를 하나의 팝업으로 보여주기 위한 상태입니다.
  const [isClosing, setIsClosing] = useState(false); // 패널을 닫을 때 바로 사라지지 않고 닫힘 애니메이션을 보여주기 위한 상태입니다.
  const { accessToken } = useAuthStore();

  const BACKSERVER = (
    import.meta.env.VITE_BACKSERVER || "http://localhost:8080"
  ).replace(/\/$/, "");

  /*
   * 선택 회원이 바뀔 때 패널 내부 상태 초기화
   * ------------------------------------------------------------------------
   * 초보자 설명:
   * - 이전 회원에서 열어둔 모달이나 에러 메시지가 다음 회원에게 남아 있으면 헷갈립니다.
   * - 그래서 memberId가 바뀔 때마다 상세 정보, 모달, 메시지를 초기값으로 되돌립니다.
   */
  useEffect(() => {
    setMemberDetail(null);
    setMemberDetailError("");
    setMemberDetailLoading(false);
    setSuspendModalType(null);
    setSelectedSuspendDays(7);
    setCustomSuspendDate("");
    setSuspendError("");
    setSuspendLoading(false);
    setActionResultPopup(null);
    setIsClosing(false);
  }, [selectedManagedMember?.memberId]);

  if (!selectedManagedMember) {
    return null;
  }

  const handleDrawerClose = () => {
    /*
     * 우측 관리 패널 닫기 함수
     * ----------------------------------------------------------------------
     * 초보자 설명:
     * - 기존에는 닫기 버튼을 누르면 부모의 onClose가 바로 실행되어 패널이 즉시 사라졌습니다.
     * - 닫힐 때도 슬라이드 효과를 보여주려면, 먼저 isClosing을 true로 바꿔 CSS 닫힘 애니메이션을 실행합니다.
     * - 220ms 뒤에 실제 onClose를 호출해서 부모 상태(selectedManagedMember)를 비우고 패널을 제거합니다.
     */
    if (isClosing) {
      return;
    }

    setIsClosing(true);
    window.setTimeout(() => {
      onClose();
    }, 220);
  };

  const isCurrentAdminSuperAdmin = currentAdminRole === "SUPER_ADMIN";
  const isTargetSelf =
    Number(selectedManagedMember.memberId) === Number(currentAdminMemberId);
  const isTargetSuperAdmin = selectedManagedMember.role === "SUPER_ADMIN";
  const isAdminBlockedTarget = isTargetSelf || isTargetSuperAdmin;
  const blockReason = isTargetSelf
    ? "본인 계정은 정지하거나 정지 해제할 수 없습니다."
    : "슈퍼 관리자 계정은 정지하거나 정지 해제할 수 없습니다.";

  const formatDate = (value) => formatKoreanDate(value);

  const getStatusLabel = (status) => {
    if (status === "ACTIVE") return "정상";
    if (status === "SUSPENDED") return "정지";
    if (status === "DELETED") return "삭제";
    return status || "-";
  };

  const isSuspendedMember = (member) => member?.status === "SUSPENDED";
  const isPermanentSuspension = (member) =>
    isSuspendedMember(member) && !member?.suspendedUntil;
  const isTemporarySuspension = (member) =>
    isSuspendedMember(member) && Boolean(member?.suspendedUntil);

  const getMemberStatusLabel = (member) => {
    if (isPermanentSuspension(member)) return "영구 정지";
    if (isTemporarySuspension(member)) return "일시 정지";
    return getStatusLabel(member?.status);
  };

  const getRoleLabel = (role) => {
    if (role === "USER" || role === "MEMBER") return "일반 회원";
    if (role === "ADMIN" || role === "NORMAL_ADMIN") return "관리자";
    if (role === "SUPER_ADMIN") return "슈퍼 관리자";
    return role || "-";
  };

  const getWarningCount = (member) => Number(member?.warningCount ?? 0);

  const getSuspendConfirmMessage = (member) => {
    const warningCount = getWarningCount(member);

    if (warningCount >= 3) {
      return `해당 회원의 경고 횟수는 ${warningCount}회입니다. 정지 처리를 진행하시겠습니까?`;
    }

    return `해당 회원의 경고 횟수는 ${warningCount}회입니다. 경고 누적이 3회 미만이므로 무고한 제재가 되지 않도록 한 번 더 확인해주세요. 그래도 정지하시겠습니까?`;
  };

  const getVerifiedLabel = (value) => (value === 1 ? "인증 완료" : "미인증");
  const getEmptySafeText = (value) =>
    value === null || value === undefined || value === "" ? "-" : value;

  const handleMemberDetailClick = () => {
    if (!accessToken) return;

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
    if (isAdminBlockedTarget) {
      setSuspendError(blockReason);
      return;
    }

    setSuspendModalType(type);
    setSelectedSuspendDays(7);
    setCustomSuspendDate("");
    setSuspendError("");
  };

  const openActionResultPopup = (type, title, message) => {
    /*
     * 정지/해제 결과 팝업 표시 함수
     * ----------------------------------------------------------------------
     * 초보자 설명:
     * - type은 "success" 또는 "error"입니다. CSS에서 색상을 다르게 보여주기 위해 사용합니다.
     * - title은 팝업의 굵은 제목이고, message는 아래 설명 문구입니다.
     * - 기존에는 성공은 패널 안 문구, 실패는 정지 확인 모달 안 문구로 따로 나왔습니다.
     *   이제는 성공/실패 모두 이 함수 하나로 같은 위치의 팝업에 표시합니다.
     */
    setActionResultPopup({
      type,
      title,
      message,
    });
  };

  const closeActionResultPopup = () => {
    setActionResultPopup(null);
  };

  const closeSuspendModal = () => {
    if (suspendLoading) return;

    setSuspendModalType(null);
    setSuspendError("");
  };

  const handleSuspendConfirm = () => {
    if (!accessToken || isAdminBlockedTarget) {
      setSuspendError(blockReason);
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
            ? "회원이 영구 정지되었습니다."
            : "회원이 일시 정지되었습니다.";

        if (updatedMember) {
          onMemberUpdated(updatedMember);
          setMemberDetail((prevDetail) =>
            prevDetail ? { ...prevDetail, ...updatedMember } : prevDetail,
          );
        }

        openActionResultPopup("success", "처리 완료", resultText);
        setSuspendModalType(null);
      })
      .catch((error) => {
        console.log(error);
        setSuspendModalType(null);
        openActionResultPopup(
          "error",
          "처리 실패",
          error.response?.data?.message ||
            "회원 정지 처리에 실패했습니다. 잠시 후 다시 시도해주세요.",
        );
      })
      .finally(() => {
        setSuspendLoading(false);
      });
  };

  const handleRestoreConfirm = () => {
    if (!accessToken || isAdminBlockedTarget) {
      setSuspendError(blockReason);
      return;
    }

    const confirmed = window.confirm(
      `${selectedManagedMember.name || "선택한 회원"} 회원의 정지를 해제하시겠습니까?`,
    );

    if (!confirmed) return;

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

        openActionResultPopup("success", "처리 완료", "회원 정지를 해제했습니다.");
      })
      .catch((error) => {
        console.log(error);
        openActionResultPopup(
          "error",
          "처리 실패",
          error.response?.data?.message ||
            "회원 정지 해제에 실패했습니다. 잠시 후 다시 시도해주세요.",
        );
      })
      .finally(() => {
        setSuspendLoading(false);
      });
  };

  return (
    <div
      className={`${styles.memberDrawerLayer} ${
        isClosing ? styles.memberDrawerLayerClosing : ""
      }`}
    >
      <button
        type="button"
        className={`${styles.memberDrawerDim} ${
          isClosing ? styles.memberDrawerDimClosing : ""
        }`}
        aria-label="회원 관리 패널 닫기"
        onClick={handleDrawerClose}
      />

      <aside
        className={`${styles.memberDrawer} ${
          isClosing ? styles.memberDrawerClosing : ""
        }`}
        aria-label={`${selectedManagedMember.name || "회원"} 관리 패널`}
      >
        <header className={styles.memberDrawerHeader}>
          <h2>회원 관리</h2>
          <button
            type="button"
            className={styles.drawerCloseButton}
            aria-label="회원 관리 패널 닫기"
            onClick={handleDrawerClose}
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

        {isAdminBlockedTarget && (
          <p className={styles.detailErrorText}>{blockReason}</p>
        )}

        {!isCurrentAdminSuperAdmin && isTargetSuperAdmin && (
          <p className={styles.detailErrorText}>
            일반 관리자는 슈퍼 관리자 계정을 관리할 수 없습니다.
          </p>
        )}

        <section className={styles.drawerCard}>
          <h3>제재 관리</h3>
          <div className={styles.sanctionGrid}>
            {isTemporarySuspension(selectedManagedMember) ? (
              <button
                type="button"
                className={styles.restoreSanctionButton}
                onClick={handleRestoreConfirm}
                disabled={suspendLoading || isAdminBlockedTarget}
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
                disabled={
                  isPermanentSuspension(selectedManagedMember) ||
                  isAdminBlockedTarget
                }
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
                disabled={suspendLoading || isAdminBlockedTarget}
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
                disabled={isAdminBlockedTarget}
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
              <dd>{formatDate(selectedManagedMember.lastLoginAt) || "기록 없음"}</dd>
            </div>
            <div>
              <dt>가입일</dt>
              <dd>{formatDate(selectedManagedMember.createdAt)}</dd>
            </div>
            <div>
              <dt>경고 횟수</dt>
              <dd>{getWarningCount(selectedManagedMember)}회</dd>
            </div>
            <div>
              <dt>누적 정지</dt>
              <dd>{selectedManagedMember.suspensionCount ?? 0}회</dd>
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
            </div>
          )}
        </section>

        <section className={styles.drawerCard}>
          <h3>제재 이력</h3>
          <div className={styles.emptySanctionHistory}>
            <DescriptionOutlinedIcon />
            <strong>제재 이력은 추후 상세 API와 연결됩니다.</strong>
          </div>
        </section>
      </aside>

      {/* 정지/해제 결과 팝업: 성공과 실패를 같은 팝업 하나로 통일해서 보여줍니다. */}
      {actionResultPopup && (
        <section
          className={styles.actionResultLayer}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="member-action-result-title"
        >
          <button
            type="button"
            className={styles.actionResultDim}
            aria-label="정지 처리 결과 팝업 닫기"
            onClick={closeActionResultPopup}
          />

          <article className={styles.actionResultPopup}>
            <span
              className={`${styles.actionResultBadge} ${
                actionResultPopup.type === "success"
                  ? styles.actionResultSuccess
                  : styles.actionResultError
              }`}
            >
              {actionResultPopup.type === "success" ? "성공" : "실패"}
            </span>
            <h3 id="member-action-result-title">{actionResultPopup.title}</h3>
            <p>{actionResultPopup.message}</p>
            <button type="button" onClick={closeActionResultPopup}>
              확인
            </button>
          </article>
        </section>
      )}

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

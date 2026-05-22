import { useMemo, useState } from "react";
import { AdminLayout } from "../common/AdminLayout";
import { SearchBar } from "../common/SearchBar";
import {
  reportStatusTabs,
  reportTypeTabs,
  sanctionOptions,
  todayText,
} from "./reportConstants";
import {
  countReportsByStatus,
  countReportsByType,
  getReleaseDate,
} from "./reportUtils";
import { ReportCompletionToast } from "./ReportCompletionToast";
import { ReportDrawer } from "./ReportDrawer";
import { ReportList } from "./ReportList";
import { ReportResultModal } from "./ReportResultModal";
import { ReportStatusTabs } from "./ReportStatusTabs";
import { ReportTypeTabs } from "./ReportTypeTabs";
import styles from "../../adminComponentsCss/reportManagement/ReportManagementPage.module.css";

/* ==========================================================================
 * 신고 및 제재 관리 페이지
 * --------------------------------------------------------------------------
 * 신고된 사용자/게시글/댓글을 확인하고, 검토 후 경고/일시 정지/영구 정지/반려
 * 중 하나로 처리하는 관리자 화면입니다.
 *
 * 이 파일의 역할:
 * - 신고 목록 데이터 상태 관리
 * - 현재 선택된 필터 상태 관리
 * - 오른쪽 사이드 패널 단계 관리
 * - 제재 확정 시 신고 상태 변경
 * - 분리된 컴포넌트들을 한 화면으로 조립
 *
 * 컴포넌트를 분리한 이유:
 * - 기존 파일이 너무 길어져서 어떤 코드가 어떤 UI를 담당하는지 파악하기 어려웠습니다.
 * - 페이지 파일은 "상태와 흐름"만 담당하고, 실제 UI 덩어리는 별도 컴포넌트가 담당하게 했습니다.
 *
 * selectedStatusTab 상태 설명:
 * - "전체 / 처리 대기 / 검토 중 / 처리 완료 / 반려" 중 현재 선택한 상태 탭입니다.
 * - 이 값에 따라 신고 목록에 보여줄 데이터가 달라집니다.
 *
 * panelStep 상태 설명:
 * - 오른쪽 사이드 패널에서 현재 보고 있는 단계를 뜻합니다.
 * - detail: 신고 상세 정보
 * - option: 처리 옵션 선택
 * - reason: 경고/영구 정지 사유 설정
 * - temporary: 일시 정지 상세 설정
 * - confirm: 최종 제재 확인
 * ========================================================================== */
export function ReportManagementPage() {
  const [reports, setReports] = useState([]); // 신고 목록 데이터입니다. 더미데이터를 제거했기 때문에 백엔드 연결 전에는 빈 배열로 시작합니다.
  const [selectedStatusTab, setSelectedStatusTab] = useState("전체"); // 현재 선택한 처리 상태 필터입니다.
  const [selectedTypeTab, setSelectedTypeTab] = useState("전체"); // 현재 선택한 신고 대상 유형 필터입니다.
  const [selectedReport, setSelectedReport] = useState(null); // 오른쪽 패널에서 자세히 볼 신고 1건입니다.
  const [selectedResultReport, setSelectedResultReport] = useState(null); // 처리 완료/반려 결과 팝업에 보여줄 신고 1건입니다.
  const [panelStep, setPanelStep] = useState("detail"); // 오른쪽 패널이 보여줄 현재 단계입니다.
  const [selectedAction, setSelectedAction] = useState(""); // 경고/일시 정지/영구 정지/반려 중 선택한 처리 옵션입니다.
  const [selectedReason, setSelectedReason] = useState("욕설/비하"); // 제재 사유 선택값입니다.
  const [reasonDetail, setReasonDetail] = useState(""); // 관리자가 추가로 입력하는 상세 설명입니다.
  const [selectedPeriod, setSelectedPeriod] = useState(7); // 일시 정지 기간 선택값입니다.
  const [customPeriod, setCustomPeriod] = useState(""); // 직접 입력 기간을 선택했을 때 사용할 값입니다.
  const [completionMessage, setCompletionMessage] = useState(""); // 제재 확정 후 상단에 보여줄 완료 안내 문구입니다.

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const statusMatched =
        selectedStatusTab === "전체" || report.status === selectedStatusTab; // 상태 탭 조건입니다.
      const typeMatched =
        selectedTypeTab === "전체" || report.type === selectedTypeTab; // 유형 탭 조건입니다.
      return statusMatched && typeMatched; // 두 조건을 모두 만족하는 신고만 목록에 보여줍니다.
    });
  }, [reports, selectedStatusTab, selectedTypeTab]);

  const selectedActionMeta = sanctionOptions.find(
    (option) => option.id === selectedAction,
  ); // 선택한 제재 옵션의 라벨/설명을 찾습니다.
  const releaseDate = getReleaseDate(
    selectedPeriod === "custom"
      ? Number(customPeriod) || "custom"
      : selectedPeriod,
  ); // 일시 정지 예상 해제 일시입니다.
  const statusCounts = useMemo(
    () => countReportsByStatus(reports, reportStatusTabs),
    [reports],
  ); // 상태 탭에 표시할 신고 개수입니다.
  const typeCounts = useMemo(
    () => countReportsByType(reports, reportTypeTabs),
    [reports],
  ); // 유형 탭에 표시할 신고 개수입니다.

  const completionToast = completionMessage ? (
    <ReportCompletionToast
      message={completionMessage}
      onClose={() => setCompletionMessage("")}
    />
  ) : null; // 제재/반려 완료 후 상단에 완료 메시지를 보여주는 컴포넌트입니다.

  const statusTabs = (
    <ReportStatusTabs
      tabs={reportStatusTabs}
      selectedTab={selectedStatusTab}
      counts={statusCounts}
      onSelect={setSelectedStatusTab}
    />
  ); // 전체/처리 대기/검토 중/처리 완료/반려 상태 필터를 보여주는 컴포넌트입니다.

  const typeTabs = (
    <ReportTypeTabs
      tabs={reportTypeTabs}
      selectedTab={selectedTypeTab}
      counts={typeCounts}
      onSelect={setSelectedTypeTab}
    />
  ); // 전체/유저/게시글/댓글 신고 대상 유형 필터를 보여주는 컴포넌트입니다.

  const reportList = (
    <ReportList reports={filteredReports} onOpenReport={openDetailPanel} />
  ); // 필터링된 신고 목록을 카드 형태로 보여주는 컴포넌트입니다.

  const reportDrawer = selectedReport ? (
    <ReportDrawer
      report={selectedReport}
      panelStep={panelStep}
      selectedAction={selectedAction}
      selectedActionMeta={selectedActionMeta}
      selectedReason={selectedReason}
      reasonDetail={reasonDetail}
      selectedPeriod={selectedPeriod}
      customPeriod={customPeriod}
      releaseDate={releaseDate}
      onClose={closePanel}
      onProcess={() => setPanelStep("option")}
      onBackToDetail={() => setPanelStep("detail")}
      onBackToOption={() => setPanelStep("option")}
      onSelectAction={setSelectedAction}
      onNextFromOption={moveNextFromOption}
      onChangeReason={setSelectedReason}
      onChangeDetail={setReasonDetail}
      onChangePeriod={setSelectedPeriod}
      onChangeCustomPeriod={setCustomPeriod}
      onGoConfirm={() => setPanelStep("confirm")}
      onBackFromConfirm={() =>
        selectedAction === "temporary"
          ? setPanelStep("temporary")
          : setPanelStep(selectedAction === "reject" ? "option" : "reason")
      }
      onConfirm={confirmSanction}
    />
  ) : null; // 신고 상세 확인부터 제재 확정까지 오른쪽에서 단계별로 보여주는 사이드 패널 컴포넌트입니다.

  const resultModal = selectedResultReport ? (
    <ReportResultModal
      report={selectedResultReport}
      onClose={() => setSelectedResultReport(null)}
    />
  ) : null; // 이미 처리 완료/반려된 신고의 처리 결과를 조회하는 팝업 컴포넌트입니다.

  function openDetailPanel(report) {
    if (report.status === "처리 완료" || report.status === "반려") {
      setSelectedResultReport(report); // 이미 처리된 신고는 검토 화면이 아니라 결과 조회 팝업으로 엽니다.
      return;
    }

    const nextReport =
      report.status === "처리 대기" ? { ...report, status: "검토 중" } : report; // 처음 클릭한 신고는 검토 중으로 바꿉니다.

    if (report.status === "처리 대기") {
      setReports((prevReports) =>
        prevReports.map((item) => (item.id === report.id ? nextReport : item)),
      ); // 목록 상태도 검토 중으로 갱신합니다.
    }

    setSelectedReport(nextReport); // 오른쪽 패널에 보여줄 신고를 저장합니다.
    setPanelStep("detail"); // 패널 첫 화면은 신고 상세 정보입니다.
    setSelectedAction(""); // 이전에 선택했던 제재 옵션을 초기화합니다.
    setSelectedReason(report.reason); // 신고 사유를 기본 제재 사유로 넣습니다.
    setReasonDetail(""); // 추가 설명 입력값을 초기화합니다.
    setSelectedPeriod(7); // 일시 정지 기본 기간을 7일로 둡니다.
    setCustomPeriod(""); // 직접 입력 기간을 초기화합니다.
  }

  function closePanel() {
    setSelectedReport(null); // 선택된 신고를 비우면 오른쪽 패널이 닫힙니다.
  }

  function moveNextFromOption() {
    if (!selectedAction) return; // 옵션을 고르지 않았다면 다음 단계로 이동하지 않습니다.
    if (selectedAction === "temporary")
      setPanelStep("temporary"); // 일시 정지는 기간 설정 화면으로 이동합니다.
    else if (selectedAction === "reject")
      setPanelStep("confirm"); // 반려는 별도 설정 없이 최종 확인으로 이동합니다.
    else setPanelStep("reason"); // 경고/영구 정지는 사유 입력 화면으로 이동합니다.
  }

  function confirmSanction() {
    const nextStatus = selectedAction === "reject" ? "반려" : "처리 완료"; // 반려만 반려 상태로, 나머지는 처리 완료로 바꿉니다.
    const periodLabel =
      selectedPeriod === "custom"
        ? `${customPeriod || 0}일`
        : `${selectedPeriod}일`; // 결과 조회에 보여줄 정지 기간입니다.
    const sanctionResult = {
      actionLabel: selectedActionMeta?.label,
      reason: selectedAction === "reject" ? "반려" : selectedReason,
      detail:
        selectedAction === "reject"
          ? "신고가 부적절하다고 판단되어 반려합니다."
          : reasonDetail || selectedReport.detail,
      periodLabel: selectedAction === "temporary" ? periodLabel : "",
      startAt: selectedAction === "temporary" ? todayText : "",
      releaseDate: selectedAction === "temporary" ? releaseDate : "",
      handledAt: todayText,
      adminName: "관리자",
    };

    setReports((prevReports) =>
      prevReports.map((report) =>
        report.id === selectedReport.id
          ? {
              ...report,
              status: nextStatus,
              sanctionResult,
            }
          : report,
      ),
    ); // 백엔드 연동 전까지는 프론트 상태만 바꿔 처리 결과를 확인합니다.

    setCompletionMessage(
      selectedAction === "reject"
        ? `${selectedReport.title} 신고를 반려 처리했습니다.`
        : `${selectedReport.title} 신고에 ${selectedActionMeta?.label} 제재를 완료했습니다.`,
    ); // 어떤 신고에 어떤 제재/반려를 완료했는지 화면에 알려줍니다.

    closePanel(); // 제재 확정 후 오른쪽 패널을 닫습니다.
  }

  return (
    <AdminLayout
      title="신고 및 제재 관리"
      description="신고된 콘텐츠와 사용자를 검토하고 적절한 제재를 관리합니다."
    >
      {completionToast}

      <section className={styles.topTabs} aria-label="신고 관리 상위 탭">
        {["신고 목록", "제재 이력", "통계"].map((label) => (
          <button
            key={label}
            className={label === "신고 목록" ? styles.activeTopTab : ""}
            type="button"
          >
            {label}
          </button>
        ))}
      </section>

      <section className={styles.filterHeader}>
        {statusTabs}
        <SearchBar placeholder="신고자, 대상, 신고 사유 검색" />
      </section>

      <section className={styles.reportPanel}>
        <div className={styles.panelTitleRow}>
          <div>
            <h2>전체 신고 목록 ({reports.length})</h2>
            <p>유저, 게시글, 댓글 신고를 한 화면에서 확인합니다.</p>
          </div>
          <select aria-label="신고 목록 정렬">
            <option>최신순</option>
            <option>신고 수 많은 순</option>
            <option>오래된 순</option>
          </select>
        </div>

        {typeTabs}
        {reportList}
      </section>

      {reportDrawer}
      {resultModal}
    </AdminLayout>
  );
}

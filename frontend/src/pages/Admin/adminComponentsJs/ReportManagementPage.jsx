import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { EmptyTableRow, TableShell } from './TableShell';
import { SearchBar } from './SearchBar';
import { SegmentedControl } from './SegmentedControl';
import styles from '../adminComponentsCss/ReportManagementPage.module.css';

const reportFilterDescriptions = {
  전체: '접수된 전체 신고 목록을 확인하는 기본 보기입니다.',
  '신고 유형': '욕설/비방, 스팸, 개인정보 노출, 허위 정보 등 신고 사유별로 분류하는 보기입니다.',
  '긴급 여부': '동일 대상에 신고가 짧은 시간 안에 집중되었거나 위험 유형 신고인 경우 우선 검토하는 보기입니다.',
  '처리 상태': '접수, 검토, 반려, 제재 완료 등 현재 처리 단계별로 신고를 확인하는 보기입니다.',
};

/* ==========================================================================
 * 신고 및 제재 관리 페이지
 * --------------------------------------------------------------------------
 * 신고 접수, 검토, 반려, 경고, 일시정지, 영구정지를 처리하는 화면입니다.
 *
 * 담당 기능:
 * - 신고 목록을 필터링하고 검색하는 영역
 * - 신고 목록 테이블
 * - 제재 옵션 버튼
 * - 접수부터 완료까지 처리 진행 단계를 보여주는 영역
 *
 * 나중에 실제 신고 데이터를 붙이면 "신고 목록 테이블"과 "제재 옵션 버튼"에
 * 클릭 이벤트와 API 요청을 연결하면 됩니다.
 * ========================================================================== */
export function ReportManagementPage() {
  const [selectedReportFilter, setSelectedReportFilter] = useState('전체');

  return (
    <AdminLayout title="신고 및 제재 관리" description="신고 접수부터 제재 처리까지 관리하세요.">
      <section className={styles.toolbar}>
        <SegmentedControl
          labels={['전체', '신고 유형', '긴급 여부', '처리 상태']}
          selectedLabel={selectedReportFilter}
          onSelect={setSelectedReportFilter}
        />
        <SearchBar placeholder="신고자, 대상, 내용 검색" />
      </section>

      <section className={styles.infoGrid}>
        <article className={styles.infoBox}>
          <strong>{selectedReportFilter} 기준</strong>
          <p>{reportFilterDescriptions[selectedReportFilter]}</p>
        </article>
        <article className={styles.infoBox}>
          <strong>긴급 여부 판단 기준</strong>
          <p>동일 게시글/댓글/사용자에 일정 시간 내 신고가 집중되는지와 신고 유형의 위험도를 함께 기준으로 삼습니다.</p>
        </article>
      </section>

      <TableShell title={`${selectedReportFilter} 신고 목록`} columns={['ID', '분류', '신고 대상', '신고자', '검수 시간', '상태', '작업']}>
        <EmptyTableRow colSpan={7} label="신고 데이터 없음" />
      </TableShell>

      <section className={styles.twoColumn}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>제재 옵션</h2>
          </div>
          <div className={styles.dangerActions}>
            {['경고', '일시정지', '영구정지', '반려'].map((label) => (
              <button key={label} type="button">
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>처리 진행 단계</h2>
          </div>
          <ol className={styles.steps}>
            {['접수', '검토', '답변', '완료'].map((label, index) => (
              <li key={label}>
                <span>{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        </section>
      </section>
    </AdminLayout>
  );
}

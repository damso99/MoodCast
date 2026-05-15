import { AdminLayout } from './AdminLayout';
import { EmptyTableRow, TableShell } from './TableShell';
import { SearchBar } from './SearchBar';
import { SegmentedControl } from './SegmentedControl';
import styles from '../AdminPages.module.css';

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
  return (
    <AdminLayout title="신고 및 제재 관리" description="신고 접수부터 제재 처리까지 관리하세요.">
      <section className={styles.toolbar}>
        <SegmentedControl labels={['전체', '신고 유형', '긴급 여부', '처리 상태']} />
        <SearchBar placeholder="신고자, 대상, 내용 검색" />
      </section>

      <TableShell title="신고 목록" columns={['ID', '분류', '신고 대상', '신고자', '검수 시간', '상태', '작업']}>
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

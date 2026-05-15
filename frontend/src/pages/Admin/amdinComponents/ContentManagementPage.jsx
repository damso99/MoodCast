import { AdminLayout } from './AdminLayout';
import { EmptyTableRow, TableShell } from './TableShell';
import { SearchBar } from './SearchBar';
import { SegmentedControl } from './SegmentedControl';
import styles from '../AdminPages.module.css';

/* ==========================================================================
 * 콘텐츠 관리 페이지
 * --------------------------------------------------------------------------
 * 게시글, 댓글, 이미지, 해시태그를 조회하고 숨김/삭제 처리하는 화면입니다.
 *
 * 담당 기능:
 * - 콘텐츠 종류별 필터
 * - 제목, 작성자, 해시태그 검색창
 * - 콘텐츠 목록 테이블
 * - 숨김/삭제/복구 같은 일괄 작업 버튼
 *
 * 실제 숨김/삭제 처리는 서버 데이터 변경이 필요하므로 지금은 버튼 형태만 둡니다.
 * ========================================================================== */
export function ContentManagementPage() {
  return (
    <AdminLayout title="콘텐츠 관리" description="콘텐츠를 조회하고 숨김/삭제 처리하세요.">
      <section className={styles.toolbar}>
        <SegmentedControl labels={['게시글', '댓글', '이미지', '해시태그']} />
        <SearchBar placeholder="제목, 작성자, 해시태그 검색" />
      </section>

      <section className={styles.actionStrip}>
        {['공개', '숨김', '삭제됨', '선택됨'].map((label) => (
          <button key={label} type="button">
            {label}
          </button>
        ))}
      </section>

      <TableShell title="콘텐츠 목록" columns={['ID', '제목', '작성자', '상태', '신고', '작업']}>
        <EmptyTableRow colSpan={6} label="콘텐츠 데이터 없음" />
      </TableShell>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>일괄 작업</h2>
        </div>
        <div className={styles.dangerActions}>
          <button type="button">숨김 처리</button>
          <button type="button">삭제 처리</button>
          <button type="button">복구</button>
        </div>
      </section>
    </AdminLayout>
  );
}

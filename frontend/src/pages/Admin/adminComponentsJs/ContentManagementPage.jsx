import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { EmptyState } from './EmptyState';
import { EmptyTableRow, TableShell } from './TableShell';
import { SearchBar } from './SearchBar';
import { SegmentedControl } from './SegmentedControl';
import styles from '../adminComponentsCss/ContentManagementPage.module.css';

const contentColumnMap = {
  게시글: ['ID', '제목', '작성자', '상태', '신고', '작업'],
  댓글: ['ID', '댓글 내용', '작성자', '게시글', '상태', '작업'],
  이미지: ['ID', '파일명', '연결 게시글', '용량', '검토 상태', '작업'],
  해시태그: ['ID', '해시태그', '게시글 수', '상태', '등록일', '작업'],
};

const contentDescriptions = {
  게시글: '게시글 제목, 작성자, 신고 수를 기준으로 숨김/삭제/복구 처리를 준비하는 영역입니다.',
  댓글: '댓글 목록을 조회하고 부적절한 댓글을 삭제하거나 숨김 처리하기 위한 영역입니다. 대댓글 기능은 포함하지 않습니다.',
  이미지: '게시글에 첨부된 이미지 파일을 검토하고 부적절한 이미지를 숨김/삭제 처리하기 위한 영역입니다.',
  해시태그: '해시태그 사용 현황을 확인하고 금지 또는 숨김 처리를 준비하는 영역입니다.',
};

/* ==========================================================================
 * 콘텐츠 관리 페이지
 * --------------------------------------------------------------------------
 * 게시글, 댓글, 이미지, 해시태그를 조회하고 숨김/삭제 처리하는 화면입니다.
 *
 * selectedContentType 상태 설명:
 * - 사용자가 "게시글 / 댓글 / 이미지 / 해시태그" 탭을 클릭하면
 *   현재 어떤 콘텐츠 종류를 보고 있는지 기억하는 값입니다.
 * - 선택값에 따라 테이블 제목, 컬럼, 안내 문구가 바뀝니다.
 *
 * 실제 숨김/삭제 처리는 서버 데이터 변경이 필요하므로 지금은 UI 구조만 둡니다.
 * ========================================================================== */
export function ContentManagementPage() {
  const [selectedContentType, setSelectedContentType] = useState('게시글');

  return (
    <AdminLayout title="콘텐츠 관리" description="콘텐츠를 조회하고 숨김/삭제 처리하세요.">
      <section className={styles.toolbar}>
        <SegmentedControl
          labels={['게시글', '댓글', '이미지', '해시태그']}
          selectedLabel={selectedContentType}
          onSelect={setSelectedContentType}
        />
        <SearchBar placeholder="제목, 작성자, 해시태그 검색" />
      </section>

      <section className={styles.actionStrip}>
        {['공개', '숨김', '삭제됨', '선택됨'].map((label) => (
          <button key={label} type="button">
            {label}
          </button>
        ))}
      </section>

      <section className={styles.infoGrid}>
        <article className={styles.infoBox}>
          <strong>{selectedContentType} 관리 방식</strong>
          <p>{contentDescriptions[selectedContentType]}</p>
        </article>
      </section>

      <TableShell title={`${selectedContentType} 목록`} columns={contentColumnMap[selectedContentType]}>
        <EmptyTableRow colSpan={contentColumnMap[selectedContentType].length} label={`${selectedContentType} 데이터 없음`} />
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
        <EmptyState title="선택된 콘텐츠 없음" description="체크박스 기능이 연결되면 선택한 항목을 일괄 처리할 수 있습니다." />
      </section>
    </AdminLayout>
  );
}

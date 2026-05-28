import { AdminLayout } from "../common/AdminLayout";
import { ContentPostManagement } from "./ContentPostManagement";

/* ==========================================================================
 * 콘텐츠 관리 페이지
 * --------------------------------------------------------------------------
 * 관리자 레이아웃의 제목과 설명만 담당하고, 게시글 조회/검색/필터/선택/처리 기능은
 * ContentPostManagement 컴포넌트가 직접 관리합니다.
 *
 * 초보자 설명:
 * - 이 파일은 "페이지 껍데기" 역할입니다.
 * - 실제 게시글 데이터를 가져오고 버튼을 눌렀을 때 처리하는 코드는 별도 컴포넌트에
 *   모아두면 파일 하나가 너무 길어지는 것을 막을 수 있습니다.
 * ========================================================================== */
export function ContentManagementPage() {
  return (
    <AdminLayout
      title="콘텐츠 관리"
      description="게시글을 검색하고 상태별로 관리하세요."
    >
      <ContentPostManagement />
    </AdminLayout>
  );
}

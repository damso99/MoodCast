import { useState } from "react";
import { NavLink } from "react-router-dom";
import { AdminLayout } from "../common/AdminLayout";
import { EmptyState } from "../common/EmptyState";
import { EmptyTableRow, TableShell } from "../common/TableShell";
import styles from "../../adminComponentsCss/userManagement/AdminCreatePage.module.css";

/* ==========================================================================
 * 관리자 추가 페이지
 * --------------------------------------------------------------------------
 * 새 관리자 계정을 직접 생성하는 화면이 아니라,
 * 이미 회원가입을 완료한 일반 회원을 검색해서 관리자 권한으로 승급시키는 화면입니다.
 *
 * 변경된 관리자 추가 방식:
 * - 회원 테이블과 관리자 테이블을 따로 나누지 않고 하나의 회원 테이블을 사용합니다.
 * - 관리자는 "새로 가입시키는 대상"이 아니라 "기존 회원 중 권한이 올라간 대상"입니다.
 * - 이메일, 이름 중 하나만 입력해도 검색할 수 있고 둘 다 입력해서 더 정확히 찾을 수도 있습니다.
 *
 * selectedRole 상태 설명:
 * - 검색한 회원에게 어떤 관리자 등급을 부여할지 기억하는 React 상태입니다.
 * - 일반 관리자와 슈퍼 관리자 중 하나를 선택하면 아래 권한 설명 문구가 바뀝니다.
 *
 * 실제 검색/승급 처리:
 * - 지금은 백엔드 API가 연결되지 않았기 때문에 검색 결과는 비어 있는 상태로 보여줍니다.
 * - 추후 백엔드가 연결되면 이메일/이름 값을 API로 보내고, 응답받은 회원 목록을 테이블에 표시하면 됩니다.
 * ========================================================================== */
export function AdminCreatePage() {
  const [selectedRole, setSelectedRole] = useState("NORMAL_ADMIN");

  const roleDescription =
    selectedRole === "SUPER_ADMIN"
      ? "슈퍼 관리자는 관리자 추가, 관리자 삭제 기능까지 사용할 수 있습니다."
      : "일반 관리자는 관리자 추가와 삭제를 제외한 관리자 기능을 사용할 수 있습니다.";

  return (
    <AdminLayout
      title="관리자 추가"
      description="가입된 회원을 검색한 뒤 관리자 권한으로 승급하세요."
    >
      <section className={`${styles.panel} ${styles.formPanel}`}>
        <div className={styles.panelHead}>
          <h2>회원 검색</h2>
          <NavLink className={styles.secondaryLinkButton} to="/admin/users">
            사용자 관리로 돌아가기
          </NavLink>
        </div>

        <form className={styles.searchForm}>
          <label>
            이메일
            <input type="email" placeholder="member@moodcast.com" />
          </label>

          <label>
            이름
            <input type="text" placeholder="회원 이름" />
          </label>

          <button type="button">회원 검색</button>
        </form>

        <EmptyState
          title="검색 결과 없음"
          description="이메일 또는 이름으로 회원을 검색하면 승급 가능한 회원 목록이 표시됩니다."
        />
      </section>

      <TableShell
        title="승급 대상 선택"
        columns={["회원", "이메일", "현재 권한", "가입일", "선택"]}
      >
        <EmptyTableRow colSpan={5} label="검색된 회원 데이터 없음" />
      </TableShell>

      <section className={`${styles.panel} ${styles.formPanel}`}>
        <div className={styles.panelHead}>
          <h2>관리자 등급 설정</h2>
        </div>

        <form className={styles.adminForm}>
          <fieldset>
            <legend>관리자 등급</legend>
            <label>
              <input
                type="radio"
                name="adminRole"
                checked={selectedRole === "NORMAL_ADMIN"}
                onChange={() => setSelectedRole("NORMAL_ADMIN")}
              />
              일반 관리자
            </label>
            <label>
              <input
                type="radio"
                name="adminRole"
                checked={selectedRole === "SUPER_ADMIN"}
                onChange={() => setSelectedRole("SUPER_ADMIN")}
              />
              슈퍼 관리자
            </label>
          </fieldset>

          <div className={styles.roleGuide}>
            <strong>
              {selectedRole === "SUPER_ADMIN"
                ? "슈퍼 관리자 권한"
                : "일반 관리자 권한"}
            </strong>
            <p>{roleDescription}</p>
          </div>

          <div className={styles.formActions}>
            <button type="button">선택 초기화</button>
            <button type="button">관리자로 승급</button>
          </div>
        </form>
      </section>
    </AdminLayout>
  );
}

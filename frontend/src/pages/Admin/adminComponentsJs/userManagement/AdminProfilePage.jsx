import { useRef, useState } from "react";
import { AdminLayout } from "../common/AdminLayout";
import styles from "../../adminComponentsCss/userManagement/AdminProfilePage.module.css";

/* ==========================================================================
 * 관리자 개인 정보 수정 페이지
 * --------------------------------------------------------------------------
 * 로그인한 관리자 본인의 프로필 정보를 수정하는 화면입니다.
 *
 * 수정 가능한 정보:
 * - 이름(실명)
 * - 닉네임
 * - 프로필 이미지 파일
 * - 전화번호
 * - 현재 비밀번호 / 새 비밀번호 / 새 비밀번호 확인
 *
 * profilePreview 상태 설명:
 * - 사용자가 이미지 파일을 선택하면 브라우저에서 바로 볼 수 있는 임시 URL을 저장합니다.
 * - 이 값은 실제 서버 업로드 결과가 아니라, 화면에서 선택한 이미지가 어떻게 보이는지
 *   확인하기 위한 프론트 미리보기 값입니다.
 *
 * 비밀번호 검증은 아직 추가하지 않습니다.
 * 나중에 백엔드 또는 프론트 검증을 붙일 때 아래 조건을 추가하면 됩니다.
 * - 현재 비밀번호가 실제 계정 비밀번호와 일치하는지 확인
 * - 새 비밀번호와 새 비밀번호 확인 값이 서로 일치하는지 확인
 * ========================================================================== */
export function AdminProfilePage() {
  const [profilePreview, setProfilePreview] = useState("");
  const fileInputRef = useRef(null);

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setProfilePreview("");
      return;
    }

    setProfilePreview(URL.createObjectURL(file));
  };

  const handleProfileImageDelete = () => {
    setProfilePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <AdminLayout
      title="관리자 개인 정보 수정"
      description="관리자 프로필과 연락처 정보를 관리하세요."
    >
      <section className={`${styles.panel} ${styles.formPanel}`}>
        <div className={styles.panelHead}>
          <h2>프로필 정보</h2>
        </div>

        <div className={styles.profileEditLayout}>
          <aside className={styles.profilePreviewArea}>
            <div className={styles.profileImageCircle}>
              {profilePreview ? (
                <img src={profilePreview} alt="선택한 관리자 프로필 미리보기" />
              ) : (
                <span>Profile</span>
              )}
            </div>
            <div className={styles.profileImageActions}>
              <label className={styles.fileSelectButton}>
                프로필 이미지 선택
                <input
                  ref={fileInputRef}
                  className={styles.hiddenFileInput}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                />
              </label>
              <button type="button" onClick={handleProfileImageDelete}>
                프로필 이미지 삭제
              </button>
            </div>
          </aside>

          <form className={styles.adminForm}>
            <label>
              이름(실명)
              <input type="text" placeholder="관리자" />
            </label>

            <label>
              닉네임
              <input type="text" placeholder="관리자 닉네임" />
            </label>

            <label>
              전화번호
              <input type="tel" placeholder="010-0000-0000" />
            </label>

            <label>
              현재 비밀번호
              <input type="password" placeholder="현재 비밀번호" />
            </label>

            <label>
              새 비밀번호
              <input type="password" placeholder="새 비밀번호" />
            </label>

            <label>
              새 비밀번호 확인
              <input type="password" placeholder="새 비밀번호 확인" />
            </label>

            <div className={styles.formActions}>
              <button type="button">취소</button>
              <button type="button">저장</button>
            </div>
          </form>
        </div>
      </section>
    </AdminLayout>
  );
}

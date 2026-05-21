import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './PostEditPage.module.css';

export function PostEditPage() {
  const desktop = useIsDesktop();
  const navigate = useNavigate();
  const { id } = useParams();
  const [content, setContent] = useState('오늘 저녁 하늘이 정말 아름다웠어요!');
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    setContent(event.target.value);
  };

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = () => {
    setSaving(true);
    window.setTimeout(() => {
      navigate('/app/feed');
    }, 800);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const contentArea = (
    <section className={styles.wrap}>
      <div className={styles.hero}>
        <strong>게시물 수정</strong>
        <p>게시물을 수정하고 변경 내용을 저장할 수 있습니다.</p>
      </div>
      <div className={styles.card}>
        <div className={styles.field}>
          <label htmlFor="postContent">수정할 내용</label>
          <textarea
            id="postContent"
            value={content}
            onChange={handleChange}
            placeholder="게시물 내용을 입력하세요."
          />
        </div>

        <div className={styles.field}>
          <label className={styles.uploadButton}>
            이미지 변경
            <input type="file" accept="image/*" onChange={handleImage} />
          </label>
          {imagePreview ? (
            <div className={styles.imagePreview}>
              <img src={imagePreview} alt="수정 이미지 미리보기" />
            </div>
          ) : null}
        </div>

        <div className={styles.buttonRow}>
          <button type="button" className={styles.backButton} onClick={handleCancel}>
            취소
          </button>
          <button type="button" className={styles.saveButton} onClick={handleSave}>
            저장하기
          </button>
        </div>

        {saving ? <div className={styles.message}>저장 중입니다...</div> : null}
      </div>
    </section>
  );

  if (!desktop) return <MobileShell title="게시물 수정" hideSearch>{contentArea}</MobileShell>;
  return <DesktopShell>{contentArea}</DesktopShell>;
}

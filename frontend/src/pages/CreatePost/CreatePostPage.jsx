import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useRef, useState } from 'react';
import styles from './CreatePostPage.module.css';

export function CreatePostPage() {
  const desktop = useIsDesktop();
  const editorRef = useRef(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const editor = editorRef.current;

    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      const id = `${file.name}-${file.size}-${Date.now()}`;
      const html = `<img src="${url}" alt="${file.name}" data-id="${id}" class="${styles.editorImage}" />`;
      editor.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const fragment = range.createContextualFragment(html);
        range.insertNode(fragment);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editor.insertAdjacentHTML('beforeend', html);
      }
    });

    setContent(editor.innerHTML);
    event.target.value = '';
  };

  const handleAttachmentUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const next = files.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}`,
      file,
    }));
    setAttachments((prev) => [...prev, ...next]);
    event.target.value = '';
  };

  const handleRemoveImage = (id) => {
    const editor = editorRef.current;
    if (!editor) return;
    const image = Array.from(editor.querySelectorAll('img')).find((img) => img.dataset.id === id);
    if (image) {
      image.remove();
      setContent(editor.innerHTML);
    }
  };

  const handleSubmit = () => {
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setTitle('');
      setContent('');
      setTags('');
      setAttachments([]);
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
      window.alert('게시물이 저장되었습니다. (미리보기용 동작)');
    }, 900);
  };

  const contentArea = (
    <section className={styles.wrap}>
      <div className={styles.hero}>
        <strong>새 게시물 작성</strong>
        <p>감정, 사진, 파일, 영상까지 함께 담아 게시물을 만들 수 있습니다.</p>
      </div>
      <div className={styles.card}>
        <div className={styles.field}>
          <label htmlFor="postTitle">제목</label>
          <input
            id="postTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="게시물 제목을 입력하세요."
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="postContent">본문</label>
          <div
            id="postContent"
            ref={editorRef}
            className={styles.editor}
            contentEditable
            suppressContentEditableWarning
            data-placeholder="오늘의 감정과 생각을 적어보세요."
            onInput={(e) => setContent(e.currentTarget.innerHTML)}
          />
        </div>

        <div className={styles.uploadSection}>
          <div className={styles.uploadGroup}>
            <label className={styles.uploadButton}>
              본문 이미지 첨부
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
            </label>
            <span className={styles.uploadDescription}>본문에 올라갈 이미지를 첨부하세요.</span>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="postTags">해시태그</label>
          <input
            id="postTags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="#감성 #기록 #무드"
          />
        </div>

        <div className={styles.uploadSection}>
          <div className={styles.uploadGroup}>
            <label className={styles.uploadButtonSecondary}>
              첨부파일 추가
              <input type="file" accept="image/*,video/*,application/*" multiple onChange={handleAttachmentUpload} />
            </label>
            <span className={styles.uploadDescription}>사진, 영상, 문서 등 다양한 파일을 업로드하세요.</span>
          </div>
        </div>

        {attachments.length > 0 ? (
          <div className={styles.attachmentList}>
            {attachments.map((item) => (
              <div key={item.id} className={styles.attachmentItem}>
                <span>{item.file.name}</span>
                <button type="button" onClick={() => handleRemoveAttachment(item.id)}>
                  삭제
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <button type="button" className={styles.submitButton} onClick={handleSubmit}>
          게시하기
        </button>
        {saving ? <div className={styles.message}>게시물을 저장하는 중입니다...</div> : null}
      </div>
    </section>
  );

  if (!desktop) return <MobileShell title="새 게시물 작성" hideSearch>{contentArea}</MobileShell>;
  return <DesktopShell>{contentArea}</DesktopShell>;
}

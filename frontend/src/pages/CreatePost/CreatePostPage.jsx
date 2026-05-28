import axios from 'axios';
import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import styles from './CreatePostPage.module.css';
import { uploadImage } from '../../shared/lib/uploadImage';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SpaIcon from '@mui/icons-material/Spa';
import MoodBadIcon from '@mui/icons-material/MoodBad';
import CelebrationIcon from '@mui/icons-material/Celebration';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';

const EMOTIONS = [
  { id: 1, name: '행복', icon: EmojiEmotionsIcon, color: '#FFD700' },
  { id: 2, name: '슬픔', icon: SentimentDissatisfiedIcon, color: '#4A90E2' },
  { id: 3, name: '차분함', icon: SpaIcon, color: '#F4A460' },
  { id: 4, name: '화남', icon: MoodBadIcon, color: '#E74C3C' },
  { id: 5, name: '신남', icon: CelebrationIcon, color: '#FF69B4' },
  { id: 6, name: '무감정', icon: SentimentNeutralIcon, color: '#95A5A6' },
];

export function CreatePostPage() {
  const desktop = useIsDesktop();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const tagInputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagList, setTagList] = useState([]); // 배열로 관리
  const [tagInput, setTagInput] = useState(''); // 현재 입력 중인 값
  const [selectedEmotion, setSelectedEmotion] = useState(null); // 선택된 감정
  const [emotionError, setEmotionError] = useState('');
  const [saving, setSaving] = useState(false);
  const { accessToken: token } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const editor = editorRef.current;
    const effectiveToken = token || window.sessionStorage.getItem('moodcast-access-token');

    for (const file of files) {
      // 미리보기용 임시 플레이스홀더 삽입
      const tempId = `tmp-${Date.now()}-${Math.random()}`;
      const placeholder = `<span id="${tempId}" style="color:#aaa">[업로드 중...]</span>`;
      editor.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(range.createContextualFragment(placeholder));
        range.collapse(false);
      } else {
        editor.insertAdjacentHTML('beforeend', placeholder);
      }

      try {
        const url = await uploadImage(file, effectiveToken, BACKSERVER, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          cropSquare: false,
          folderType: 'post-images',
        });
        const imgHtml = `<img src="${url}" alt="${file.name}" class="${styles.editorImage}" />`;
        const el = document.getElementById(tempId);
        if (el) el.outerHTML = imgHtml;
      } catch (err) {
        const el = document.getElementById(tempId);
        if (el) el.remove();
        alert(`이미지 업로드 실패: ${err.message}`);
      }
    }

    setContent(editor.innerHTML);
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

  const handleTagInput = (e) => {
    const value = e.target.value;
    setTagInput(value);
  };

  const handleTagKeyDown = (e) => {
    // 💡 한글 조합 중일 때는 이벤트 무시 (끝자리 따라가는 현상 방지)
    if (e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = tagInput.trim();
      
      // # 기호 없으면 추가, 있으면 # 제거 후 소문자로 변환
      const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
      const normalizedTag = cleanTag.toLowerCase();
      
      // 유효성 검사: 빈 태그, 중복 태그 제외
      if (normalizedTag.length > 1 && !tagList.includes(normalizedTag)) {
        setTagList([...tagList, normalizedTag]);
        setTagInput(''); // 입력 필드 초기화
        tagInputRef.current?.focus(); // 포커스 유지
      } else if (tagList.includes(normalizedTag)) {
        alert('이미 추가된 해시태그입니다.');
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    setTagList(tagList.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async () => {
    const effectiveToken = token || window.sessionStorage.getItem('moodcast-access-token');
    if (!effectiveToken) {
      alert('로그인이 필요합니다.');
      navigate('/auth/login');
      return;
    }

    if (!title.trim() && !content.trim()) {
      alert('제목 또는 본문을 입력해주세요.');
      return;
    }

    if (!selectedEmotion) {
      setEmotionError('오늘의 감정을 꼭 선택해주세요.');
      return;
    }

    setEmotionError('');
    setSaving(true);
    try {
      // tagList를 공백으로 구분된 문자열로 변환 (예: "#감성 #기록 #무드")
      const tagsString = tagList.join(' ');
      
      const requestData = {
        title: title.trim(),
        content,
        tags: tagsString,
        emotionId: selectedEmotion.id, // 선택된 감정 ID
      };
      
      console.log('📤 게시물 요청 데이터:', requestData);
      
      const response = await axios.post(
        `${BACKSERVER}/posts`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${effectiveToken}`,
          },
        }
      );
      
      console.log('✅ 게시물 저장 성공:', response.data);
      
      setTitle('');
      setContent('');
      setTagList([]);
      setTagInput('');
      setSelectedEmotion(null); // 감정 초기화
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
      window.alert('게시물이 저장되었습니다.');
      navigate('/app');
    } catch (error) {
      console.error('❌ 게시물 저장 오류:', error);
      console.error('📋 오류 응답:', error.response?.data);
      alert(error.response?.data?.message || error.message || '게시물 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
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
          <label>오늘의 감정</label>
          <div className={styles.emotionGrid}>
            {EMOTIONS.map((emotion) => {
              const IconComponent = emotion.icon;
              return (
                <button
                  key={emotion.id}
                  type="button"
                  className={`${styles.emotionButton} ${selectedEmotion?.id === emotion.id ? styles.emotionSelected : ''}`}
                  onClick={() => {
                    setSelectedEmotion(emotion);
                    setEmotionError('');
                  }}
                  style={selectedEmotion?.id === emotion.id ? { borderColor: emotion.color, backgroundColor: emotion.color + '20' } : {}}
                >
                  <IconComponent sx={{ fontSize: '1.8rem', color: emotion.color }} />
                  <span className={styles.emotionName}>{emotion.name}</span>
                </button>
              );
            })}
          </div>
          {emotionError ? <p className={styles.fieldError}>{emotionError}</p> : null}
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

        <div className={`${styles.uploadSection} ${styles.bodyUploadSection}`}>
          <div className={styles.uploadGroup}>
            <label className={styles.uploadButton}>
              사진 첨부
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
            <span className={styles.uploadDescription}>본문에 들어갈 사진을 선택하세요.</span>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="postTags">해시태그</label>
          
          {/* 추가된 해시태그 칩 표시 */}
          {tagList.length > 0 && (
            <div className={styles.tagContainer}>
              {tagList.map((tag, index) => (
                <div key={index} className={styles.tagChip}>
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className={styles.tagChipButton}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* 해시태그 입력 필드 */}
          <input
            ref={tagInputRef}
            id="postTags"
            value={tagInput}
            onChange={handleTagInput}
            onKeyDown={handleTagKeyDown}
            placeholder={tagList.length === 0 ? "#태그를 입력하고 엔터를 누르세요" : "추가할 태그를 입력하고 엔터"}
            style={{ width: '100%' }}
          />
          
          {/* 도움말 텍스트 */}
          <small className={styles.tagHelpText}>
            추가된 태그: {tagList.length}개
            {tagList.length > 0 && ` (${tagList.join(', ')})`}
          </small>
        </div>

        <button type="button" className={styles.submitButton} onClick={handleSubmit} disabled={saving || !selectedEmotion}>
          게시하기
        </button>
        {saving ? <div className={styles.message}>게시물을 저장하는 중입니다...</div> : null}
      </div>
    </section>
  );

  if (!desktop) return <MobileShell title="새 게시물 작성" hideSearch>{contentArea}</MobileShell>;
  return <DesktopShell>{contentArea}</DesktopShell>;
}

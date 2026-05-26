import axios from 'axios';
import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import styles from './EditPostPage.module.css';

const EMOTIONS = [
  { id: 1, name: '행복', emoji: '😊', color: '#FFD700' },
  { id: 2, name: '슬픔', emoji: '😢', color: '#4A90E2' },
  { id: 3, name: '차분함', emoji: '😌', color: '#F4A460' },
  { id: 4, name: '화남', emoji: '😠', color: '#E74C3C' },
  { id: 5, name: '신나감', emoji: '🤩', color: '#FF69B4' },
  { id: 6, name: '무감정', emoji: '😐', color: '#95A5A6' },
];

export function EditPostPage() {
  const desktop = useIsDesktop();
  const navigate = useNavigate();
  const { postId } = useParams();
  const editorRef = useRef(null);
  const tagInputRef = useRef(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagList, setTagList] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { accessToken: token } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  // 게시물 정보 불러오기
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(
          `${BACKSERVER}/posts/${postId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const post = response.data;
        
        setTitle(post.title || '');
        setContent(post.content || '');

        if (editorRef.current) {
          editorRef.current.innerHTML = post.content || '';
        }
        
        // 태그 파싱 (공백으로 구분된 문자열을 배열로 변환)
        if (post.tags) {
          const tags = post.tags.trim().split(/\s+/).filter(t => t);
          setTagList(tags);
        }
        
        // 감정 설정
        if (post.emotionId) {
          const emotion = EMOTIONS.find(e => e.id === post.emotionId);
          if (emotion) setSelectedEmotion(emotion);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('❌ 게시물 불러오기 실패:', error);
        alert('게시물을 불러오지 못했습니다.');
        navigate('/app');
      }
    };

    fetchPost();
  }, [postId, token, BACKSERVER, navigate]);

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

  const handleTagInput = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagKeyDown = (e) => {
    if (e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = tagInput.trim();
      const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
      const normalizedTag = cleanTag.toLowerCase();
      
      if (normalizedTag.length > 1 && !tagList.includes(normalizedTag)) {
        setTagList([...tagList, normalizedTag]);
        setTagInput('');
        tagInputRef.current?.focus();
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

    setSaving(true);
    try {
      const tagsString = tagList.join(' ');
      
      const requestData = {
        title: title.trim(),
        content,
        tags: tagsString,
        emotionId: selectedEmotion?.id || null,
      };
      
      console.log('📤 게시물 수정 요청 데이터:', requestData);
      
      const response = await axios.put(
        `${BACKSERVER}/posts/${postId}`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${effectiveToken}`,
          },
        }
      );
      
      console.log('✅ 게시물 수정 성공:', response.data);
      alert('게시물이 수정되었습니다.');
      navigate('/app');
    } catch (error) {
      console.error('❌ 게시물 수정 오류:', error);
      console.error('📋 오류 응답:', error.response?.data);
      alert(error.response?.data?.message || error.message || '게시물 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>;
  }

  const contentArea = (
    <section className={styles.wrap}>
      <div className={styles.hero}>
        <strong>게시물 수정</strong>
        <p>게시물의 내용을 수정할 수 있습니다.</p>
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
            {EMOTIONS.map((emotion) => (
              <button
                key={emotion.id}
                type="button"
                className={`${styles.emotionButton} ${selectedEmotion?.id === emotion.id ? styles.emotionSelected : ''}`}
                onClick={() => setSelectedEmotion(emotion)}
                style={selectedEmotion?.id === emotion.id ? { borderColor: emotion.color, backgroundColor: emotion.color + '20' } : {}}
              >
                <span className={styles.emotionEmoji}>{emotion.emoji}</span>
                <span className={styles.emotionName}>{emotion.name}</span>
              </button>
            ))}
          </div>
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
          
          <input
            ref={tagInputRef}
            id="postTags"
            value={tagInput}
            onChange={handleTagInput}
            onKeyDown={handleTagKeyDown}
            placeholder={tagList.length === 0 ? "#태그를 입력하고 엔터를 누르세요" : "추가할 태그를 입력하고 엔터"}
            style={{ width: '100%' }}
          />
          
          <small className={styles.tagHelpText}>
            추가된 태그: {tagList.length}개
            {tagList.length > 0 && ` (${tagList.join(', ')})`}
          </small>
        </div>

        <div className={styles.buttonGroup}>
          <button type="button" className={styles.cancelButton} onClick={() => navigate('/app')}>
            취소
          </button>
          <button type="button" className={styles.submitButton} onClick={handleSubmit}>
            수정하기
          </button>
        </div>
        {saving ? <div className={styles.message}>게시물을 수정하는 중입니다...</div> : null}
      </div>
    </section>
  );

  if (!desktop) return <MobileShell title="게시물 수정" hideSearch>{contentArea}</MobileShell>;
  return <DesktopShell>{contentArea}</DesktopShell>;
}

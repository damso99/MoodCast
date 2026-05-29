import axios from 'axios';
import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import styles from './CreatePostPage.module.css';
import { uploadImage } from '../../shared/lib/uploadImage';
import { fetchMentionCandidates } from '../../shared/api/followApi';
import { defaultAvatarSrc } from '../../shared/lib/defaultAvatar';
import {
  getActiveMentionStateFromText,
  insertMentionIntoText,
  reconcileMentionsAfterTextChange,
} from '../../shared/lib/mentionUtils';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SpaIcon from '@mui/icons-material/Spa';
import MoodBadIcon from '@mui/icons-material/MoodBad';
import CelebrationIcon from '@mui/icons-material/Celebration';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';

const EMOTIONS = [
  { id: 1, name: '?됰났', icon: EmojiEmotionsIcon, color: '#FFD700' },
  { id: 2, name: '?ы뵒', icon: SentimentDissatisfiedIcon, color: '#4A90E2' },
  { id: 3, name: '李⑤텇', icon: SpaIcon, color: '#F4A460' },
  { id: 4, name: '?붾궓', icon: MoodBadIcon, color: '#E74C3C' },
  { id: 5, name: '?좊궓', icon: CelebrationIcon, color: '#FF69B4' },
  { id: 6, name: '以묐┰', icon: SentimentNeutralIcon, color: '#95A5A6' },
];

export function CreatePostPage() {
  const desktop = useIsDesktop();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const tagInputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagList, setTagList] = useState([]); // 諛곗뿴濡?愿由?
  const [tagInput, setTagInput] = useState(''); // ?꾩옱 ?낅젰 以묒씤 媛?
  const [selectedEmotion, setSelectedEmotion] = useState(null); // ?좏깮??媛먯젙
  const [emotionError, setEmotionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [mentionKeyword, setMentionKeyword] = useState('');
  const [mentionCandidates, setMentionCandidates] = useState([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionRange, setMentionRange] = useState(null);
  const [mentions, setMentions] = useState([]);
  const mentionMode = mentionOpen;
  const { accessToken: token, member } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  const closeMentionBox = () => {
    setMentionKeyword('');
    setMentionOpen(false);
    setMentionRange(null);
  };

  useEffect(() => {
    const loadMentionCandidates = async () => {
      const currentMemberId = member?.memberId;
      console.log('[寃뚯떆臾??묒꽦 硫섏뀡] ?곹깭', {
        currentMemberId,
        mentionOpen,
        mentionKeyword,
        hasToken: Boolean(token || window.sessionStorage.getItem('moodcast-access-token')),
      });
      if (!currentMemberId || !mentionOpen) {
        setMentionCandidates([]);
        return;
      }

      setMentionLoading(true);
      try {
        const candidates = await fetchMentionCandidates(
          currentMemberId,
          mentionKeyword,
          token || window.sessionStorage.getItem('moodcast-access-token'),
        );
        setMentionCandidates(candidates);
      } catch (error) {
        console.error('硫섏뀡 ?꾨낫 議고쉶 ?ㅽ뙣', error);
        setMentionCandidates([]);
      } finally {
        setMentionLoading(false);
      }
    };

    loadMentionCandidates();
  }, [mentionKeyword, mentionOpen, token, member]);

  const syncMentionState = (value, caretIndex) => {
    const state = getActiveMentionStateFromText(value, caretIndex);
    if (!state) {
      closeMentionBox();
      return;
    }

    setMentionKeyword(state.query);
    setMentionRange(state);
    setMentionOpen(true);
  };

  const handleContentChange = (event) => {
    const nextContent = event.target.value;
    const nextMentions = reconcileMentionsAfterTextChange(content, nextContent, mentions);
    setContent(nextContent);
    setMentions(nextMentions);
    syncMentionState(nextContent, event.target.selectionStart ?? nextContent.length);
  };

  const handleMentionSelect = (candidate) => {
    const inserted = insertMentionIntoText(content, mentionRange, candidate, mentions);
    if (!inserted) {
      return;
    }

    setContent(inserted.content);
    setMentions(inserted.mentions);
    setMentionKeyword('');
    setMentionOpen(false);
    setMentionRange(null);
    setMentionCandidates([]);

    window.requestAnimationFrame(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(inserted.caretIndex, inserted.caretIndex);
    });
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const effectiveToken = token || window.sessionStorage.getItem('moodcast-access-token');

    for (const file of files) {
      try {
        const url = await uploadImage(file, effectiveToken, BACKSERVER, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          cropSquare: false,
          folderType: 'post-images',
        });
        const imageHtml = `<img src="${url}" alt="${file.name}" />`;
        setContent((prev) => `${prev}${prev ? '\n' : ''}${imageHtml}`);
      } catch (err) {
        alert(`?대?吏 ?낅줈???ㅽ뙣: ${err.message}`);
      }
    }

    event.target.value = '';
  };

  const handleTagInput = (e) => {
    const value = e.target.value;
    setTagInput(value);
  };

  const handleTagKeyDown = (e) => {
    // ?쒓? 議고빀 以묒씤 寃쎌슦???뷀꽣 泥섎━?섏? ?딅뒗??
    if (e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = tagInput.trim();
      
      // # # 湲고샇媛 ?놁쑝硫?異붽??섍퀬, ?덉쑝硫??쒓굅 ?놁씠 ?뚮Ц?먮쭔 ?뺢퇋?뷀븳??
      const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
      const normalizedTag = cleanTag.toLowerCase();
      
      // ?좏슚??寃?? 鍮??쒓렇? 以묐났 ?쒓렇瑜??쒖쇅?쒕떎.
      if (normalizedTag.length > 1 && !tagList.includes(normalizedTag)) {
        setTagList([...tagList, normalizedTag]);
        setTagInput(''); // ?낅젰 移?珥덇린??
        tagInputRef.current?.focus(); // ?ъ빱???좎?
      } else if (tagList.includes(normalizedTag)) {
        alert('?대? 異붽????댁떆?쒓렇?낅땲??');
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
      alert('濡쒓렇?몄씠 ?꾩슂?⑸땲??');
      navigate('/auth/login');
      return;
    }

    const editorContent = content;

    if (!title.trim() && !editorContent.trim()) {
      alert('?쒕ぉ ?먮뒗 蹂몃Ц???낅젰?댁＜?몄슂.');
      return;
    }

    if (!selectedEmotion) {
      setEmotionError('?ㅻ뒛??媛먯젙???좏깮?댁＜?몄슂.');
      return;
    }

    setEmotionError('');
    setSaving(true);
    try {
      // ?쒓렇 諛곗뿴??怨듬갚 援щ텇 臾몄옄?대줈 蹂?섑븳??
      const tagsString = tagList.join(' ');
      
      const requestData = {
        title: title.trim(),
        content: editorContent,
        tags: tagsString,
        emotionId: selectedEmotion.id, // ?좏깮??媛먯젙 ID
        mentions,
      };
      
      console.log('[寃뚯떆臾??묒꽦] ?붿껌 ?곗씠??', requestData);
      
      const response = await axios.post(
        `${BACKSERVER}/api/posts`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${effectiveToken}`,
          },
        }
      );
      
      console.log('[寃뚯떆臾??묒꽦] ????깃났:', response.data);
      
      setTitle('');
      setContent('');
      setTagList([]);
      setTagInput('');
      setSelectedEmotion(null); // 媛먯젙 珥덇린??      setMentionKeyword('');
      setMentionCandidates([]);
      setMentionOpen(false);
      setMentionRange(null);
      setMentionLoading(false);
      setMentions([]);
      window.alert('寃뚯떆臾쇱씠 ??λ릺?덉뒿?덈떎.');
      navigate('/app');
    } catch (error) {
      console.error('[寃뚯떆臾??묒꽦] ????ㅻ쪟:', error);
      console.error('[寃뚯떆臾??묒꽦] ?ㅻ쪟 ?묐떟:', error.response?.data);
      alert(error.response?.data?.message || error.message || '寃뚯떆臾???μ뿉 ?ㅽ뙣?덉뒿?덈떎.');
    } finally {
      setSaving(false);
    }
  };

  const contentArea = (
    <section className={styles.wrap}>
      <div className={styles.hero}>
        <strong>寃뚯떆臾??묒꽦</strong>
        <p>媛먯젙, ?ъ쭊, ?쒓렇, ?곸긽源뚯? ?④퍡 ?ｌ뼱 寃뚯떆臾쇱쓣 留뚮뱾 ???덉뒿?덈떎.</p>
      </div>
      <div className={styles.card}>
        <div className={styles.field}>
          <label htmlFor="postTitle">?쒕ぉ</label>
          <input
            id="postTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="寃뚯떆臾??쒕ぉ???낅젰?섏꽭??"
          />
        </div>

        <div className={styles.field}>
          <label>?ㅻ뒛??媛먯젙</label>
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
          <label htmlFor="postContent">蹂몃Ц</label>
          <div className={styles.mentionInputWrap}>
            <textarea
              id="postContent"
              ref={editorRef}
              className={styles.editor}
              value={content}
              placeholder="?ㅻ뒛??媛먯젙怨??앷컖???곸뼱蹂댁꽭??"
              onChange={handleContentChange}
              onKeyUp={(event) => syncMentionState(event.currentTarget.value, event.currentTarget.selectionStart)}
              onClick={(event) => syncMentionState(event.currentTarget.value, event.currentTarget.selectionStart)}
            />
            {mentionMode ? (
              <div className={styles.mentionBox}>
                {mentionLoading ? (
                  <div className={styles.mentionItem}>
                    <span className={styles.mentionText}>硫섏뀡 ?꾨낫瑜?遺덈윭?ㅻ뒗 以묒엯?덈떎.</span>
                  </div>
                ) : mentionCandidates.length > 0 ? (
                  mentionCandidates.map((candidate) => (
                    <button
                      key={candidate.userId}
                      type="button"
                      className={styles.mentionItem}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleMentionSelect(candidate);
                      }}
                    >
                      <span className={styles.mentionCandidateAvatar}>
                        <img src={candidate.profileImage || defaultAvatarSrc} alt={candidate.nickname || "회원"} />
                      </span>
                      <span className={styles.mentionCandidateMeta}>
                        <strong>{candidate.nickname || `회원 ${candidate.userId}`}</strong>
                        <span>{`@${candidate.nickname || ''}`}</span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className={styles.mentionItem}>
                    <span className={styles.mentionText}>?쇱튂?섎뒗 硫섏뀡 ?꾨낫媛 ?놁뒿?덈떎.</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className={`${styles.uploadSection} ${styles.bodyUploadSection}`}>
          <div className={styles.uploadGroup}>
            <label className={styles.uploadButton}>
              ?ъ쭊 泥⑤?
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
            <span className={styles.uploadDescription}>蹂몃Ц???ㅼ뼱媛??ъ쭊???좏깮?섏꽭??</span>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="postTags">?댁떆?쒓렇</label>
          
          {/* 異붽????댁떆?쒓렇 ?쒖떆 */}
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
                    횞
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* ?댁떆?쒓렇 ?낅젰 ?꾨뱶 */}
          <input
            ref={tagInputRef}
            id="postTags"
            value={tagInput}
            onChange={handleTagInput}
            onKeyDown={handleTagKeyDown}
            placeholder={tagList.length === 0 ? "#?쒓렇瑜??낅젰?섍퀬 ?뷀꽣瑜??꾨Ⅴ?몄슂" : "異붽????쒓렇瑜??낅젰?섍퀬 ?뷀꽣"}
            style={{ width: '100%' }}
          />
          
          {/* ?낅젰 ?꾩?留?*/}
          <small className={styles.tagHelpText}>
            異붽????쒓렇: {tagList.length}媛?
            {tagList.length > 0 && ` (${tagList.join(', ')})`}
          </small>
        </div>

        <button type="button" className={styles.submitButton} onClick={handleSubmit} disabled={saving || !selectedEmotion}>
          寃뚯떆?섍린
        </button>
        {saving ? <div className={styles.message}>寃뚯떆臾쇱쓣 ??ν븯??以묒엯?덈떎...</div> : null}
      </div>
    </section>
  );

  if (!desktop) return <MobileShell title="寃뚯떆臾??묒꽦" hideSearch>{contentArea}</MobileShell>;
  return <DesktopShell>{contentArea}</DesktopShell>;
}


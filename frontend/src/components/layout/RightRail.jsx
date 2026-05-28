import { memo, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import styles from './RightRail.module.css';
import { EmotionBadge } from '../common/EmotionBadge';
import { EMOTION_RANGE_OPTIONS, buildEmotionStats, filterPostsByRange } from '../../shared/lib/emotionStats';

function RangeFilter({ label, value, onChange, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const currentLabel = EMOTION_RANGE_OPTIONS.find((option) => option.value === value)?.label || '전체';

  return (
    <div ref={wrapRef} className={styles.filterWrap}>
      <button
        type="button"
        className={styles.filterButton}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${label} 범위 선택`}
      >
        <span className={styles.filterText}>{currentLabel}</span>
        <KeyboardArrowDownRoundedIcon className={`${styles.filterIcon} ${open ? styles.filterIconOpen : ''}`} />
      </button>

      {open ? (
        <div
          className={`${styles.filterMenu} ${align === 'left' ? styles.filterMenuLeft : ''}`}
          role="menu"
          aria-label={`${label} 범위 메뉴`}
        >
          {EMOTION_RANGE_OPTIONS.map((option) => {
            const active = value === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className={`${styles.filterMenuItem} ${active ? styles.filterMenuItemActive : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                role="menuitemradio"
                aria-checked={active}
              >
                <span>{option.label}</span>
                {active ? <span className={styles.filterMenuDot} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function formatTagCount(value) {
  const count = Number(value);

  if (Number.isNaN(count)) {
    return '0';
  }

  if (count >= 1000) {
    const divided = count / 1000;
    const text = Number.isInteger(divided) ? String(divided) : divided.toFixed(1).replace(/\.0$/, '');
    return `${text}k`;
  }

  return String(count);
}

function RightRailBase({ posts = [], isLoading = false }) {
  const [selectedMoodRange, setSelectedMoodRange] = useState('all');
  const [trendingTags, setTrendingTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [expandedTags, setExpandedTags] = useState(false);
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  const moodStats = useMemo(() => {
    const filteredPosts = filterPostsByRange(posts, selectedMoodRange);
    return buildEmotionStats(filteredPosts);
  }, [posts, selectedMoodRange]);

  useEffect(() => {
    let isMounted = true;

    const loadTrendingTags = async () => {
      setLoadingTags(true);

      try {
        const response = await axios.get(`${BACKSERVER}/search/hashtags`, {
          params: { limit: 10 },
        });
        const results = response.data?.results || [];

        if (!isMounted) return;
        setTrendingTags(results);
      } catch (error) {
        console.error('해시태그 순위를 불러오지 못했습니다.', error);
        if (!isMounted) return;
        setTrendingTags([]);
      } finally {
        if (isMounted) {
          setLoadingTags(false);
        }
      }
    };

    loadTrendingTags();

    return () => {
      isMounted = false;
    };
  }, [BACKSERVER]);

  const visibleTags = expandedTags ? trendingTags : trendingTags.slice(0, 5);
  const hasMoreTags = trendingTags.length > 5;
  const isInitialTagLoading = loadingTags && trendingTags.length === 0;

  return (
    <div className={styles.stack}>
      <section className={styles.card}>
        <div className={styles.header}>
          <strong>감정 통계</strong>
          <RangeFilter label="감정 통계" value={selectedMoodRange} onChange={setSelectedMoodRange} />
        </div>

        {isLoading ? (
          <div className={styles.loadingText}>게시글 감정 통계를 불러오는 중입니다.</div>
        ) : (
          <div className={styles.moodList}>
            {moodStats.map((item) => (
              <div key={item.id} className={styles.moodCard}>
                <div className={styles.moodTopRow}>
                  <EmotionBadge emotion={item} count={item.count} />
                  <span className={styles.percent}>{item.percent}%</span>
                </div>
                <div className={styles.bar}>
                  <i style={{ width: `${item.percent}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.card}>
        <div className={styles.header}>
          <strong>인기 해시태그</strong>
          <span>{trendingTags.length}개</span>
        </div>

        {isInitialTagLoading ? (
          <div className={styles.loadingText}>해시태그 순위를 불러오는 중입니다.</div>
        ) : trendingTags.length === 0 ? (
          <div className={styles.loadingText}>표시할 해시태그가 없습니다.</div>
        ) : (
          <>
            <div className={styles.trendList}>
              {visibleTags.map((tag, index) => (
                <div key={tag.hashtagId} className={styles.trendRow}>
                  <span className={styles.rank}>{index + 1}</span>
                  <div>
                    <strong>#{tag.hashtag}</strong>
                    <p>{formatTagCount(tag.useCount)}</p>
                  </div>
                </div>
              ))}
            </div>
            {hasMoreTags ? (
              <button
                type="button"
                className={styles.moreButton}
                onClick={() => setExpandedTags((prev) => !prev)}
                disabled={loadingTags}
              >
                {expandedTags ? '접기' : '더보기'}
              </button>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

export const RightRail = memo(RightRailBase);

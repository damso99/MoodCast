import { useEffect, useMemo, useRef, useState } from 'react';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import styles from './RightRail.module.css';
import { EmotionBadge } from '../common/EmotionBadge';
import { EMOTION_RANGE_OPTIONS, buildEmotionStats, filterPostsByRange } from '../../shared/lib/emotionStats';

export function RightRail({ posts = [], trendingTags, isLoading = false }) {
  const [selectedRange, setSelectedRange] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const selectedRangeLabel =
    EMOTION_RANGE_OPTIONS.find((option) => option.value === selectedRange)?.label || '전체';

  const moodStats = useMemo(() => {
    const filteredPosts = filterPostsByRange(posts, selectedRange);
    return buildEmotionStats(filteredPosts);
  }, [posts, selectedRange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSelectRange = (value) => {
    setSelectedRange(value);
    setMenuOpen(false);
  };

  return (
    <div className={styles.stack}>
      <section className={styles.card}>
        <div className={styles.header}>
          <strong>감정 통계</strong>
          <div ref={menuRef} className={styles.filterWrap}>
            <button
              type="button"
              className={styles.filterButton}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="감정 통계 범위 선택"
            >
              <span className={styles.filterText}>{selectedRangeLabel}</span>
              <KeyboardArrowDownRoundedIcon className={`${styles.filterIcon} ${menuOpen ? styles.filterIconOpen : ''}`} />
            </button>

            {menuOpen ? (
              <div className={styles.filterMenu} role="menu" aria-label="감정 통계 범위 메뉴">
                {EMOTION_RANGE_OPTIONS.map((option) => {
                  const active = selectedRange === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.filterMenuItem} ${active ? styles.filterMenuItemActive : ''}`}
                      onClick={() => handleSelectRange(option.value)}
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
        </div>

        {isLoading ? (
          <div className={styles.loadingText}>게시물 감정 통계를 불러오는 중입니다.</div>
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
          <span>실시간</span>
        </div>
        <div className={styles.trendList}>
          {trendingTags.map((tag, index) => (
            <div key={tag.name} className={styles.trendRow}>
              <span className={styles.rank}>{index + 1}</span>
              <div>
                <strong>{tag.name}</strong>
                <p>{tag.count}</p>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className={styles.moreButton}>
          더 보기
        </button>
      </section>
    </div>
  );
}

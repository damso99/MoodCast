import styles from './RightRail.module.css';

export function RightRail({ moodStats, trendingTags }) {
  return (
    <div className={styles.stack}>
      <section className={styles.card}>
        <div className={styles.header}>
          <strong>감정 통계</strong>
          <span>이번 주</span>
        </div>
        <div className={styles.moodList}>
          {moodStats.map((item) => (
            <div key={item.name} className={styles.moodRow}>
              <div className={styles.dot} style={{ background: item.color }} />
              <div className={styles.moodMeta}>
                <strong>{item.name}</strong>
                <span>{item.percent}%</span>
              </div>
              <div className={styles.bar}>
                <i style={{ width: `${item.percent}%`, background: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.header}>
          <strong>트렌딩 해시태그</strong>
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

import styles from '../AdminPages.module.css';

/* ==========================================================================
 * MetricCard 컴포넌트
 * --------------------------------------------------------------------------
 * 회원수, 신규 가입자, 게시글 수처럼 "핵심 숫자"를 보여주는 카드입니다.
 *
 * props 설명:
 * - label: 카드 제목입니다. 예: "회원수"
 * - icon: 오른쪽 위에 표시할 아이콘입니다.
 * - accent: 아이콘 배경 색상을 바꾸기 위한 이름입니다. 예: "blue", "pink"
 *
 * 현재는 백엔드를 구현하지 않기로 했기 때문에 실제 숫자 대신 "-"를 보여줍니다.
 * 나중에 API가 연결되면 value 같은 prop을 추가해서 숫자를 표시하면 됩니다.
 * ========================================================================== */
export function MetricCard({ label, icon, accent = 'purple' }) {
  return (
    <article className={styles.metricCard}>
      <div>
        <span>{label}</span>
        <strong>-</strong>
        <p>데이터 연결 전</p>
      </div>
      <div className={`${styles.metricIcon} ${styles[accent] || ''}`}>{icon}</div>
    </article>
  );
}

import styles from '../AdminPages.module.css';

/* ==========================================================================
 * SegmentedControl 컴포넌트
 * --------------------------------------------------------------------------
 * 여러 선택지를 탭 버튼처럼 보여주는 컴포넌트입니다.
 *
 * 사용 예시:
 * - 대시보드: 일 / 주 / 월
 * - 사용자 관리: 전체 / 일반 회원 / 정지 회원 / 관리자 회원
 *
 * 현재는 첫 번째 버튼만 선택된 것처럼 보이게 만들었습니다.
 * 실제 필터 기능을 붙일 때는 selectedValue, onChange 같은 props를 추가하면 됩니다.
 * ========================================================================== */
export function SegmentedControl({ labels }) {
  return (
    <div className={styles.segmented}>
      {labels.map((label, index) => (
        <button key={label} type="button" className={index === 0 ? styles.selected : ''}>
          {label}
        </button>
      ))}
    </div>
  );
}

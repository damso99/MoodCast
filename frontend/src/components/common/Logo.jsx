import { NavLink } from 'react-router-dom';
import styles from './Logo.module.css';

export function Logo({ compact = false }) {
  return (
    <NavLink to="/app/feed" className={`${styles.brand} ${compact ? styles.compact : ''}`}>
      <img className={`${styles.image} ${compact ? styles.imageCompact : ''}`} src="/MoodCast-logo.svg" alt="MoodCast" />
      {!compact ? (
        <div className={styles.text}>
          <strong>MoodCast</strong>
          <p>감정을 공유하는 감성 SNS</p>
        </div>
      ) : null}
    </NavLink>
  );
}

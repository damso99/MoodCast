import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import MoodOutlinedIcon from '@mui/icons-material/MoodOutlined';
import { useNavigate } from 'react-router-dom';
import styles from './ComposerCard.module.css';

export function ComposerCard() {
  const navigate = useNavigate();

  return (
    <article className={styles.card} onClick={() => navigate('/app/write')} role="presentation">
      <button type="button" className={styles.avatar} aria-label="작성">
        <span />
      </button>
      <button type="button" className={styles.input} onClick={() => navigate('/app/write')}>
        무슨 생각을 하고 계신가요?
      </button>
      <div className={styles.actions}>
        <button type="button" className={`${styles.action} ${styles.video}`} onClick={() => navigate('/app/write')} aria-label="영상">
          <VideocamOutlinedIcon />
        </button>
        <button type="button" className={`${styles.action} ${styles.image}`} onClick={() => navigate('/app/write')} aria-label="이미지">
          <ImageOutlinedIcon />
        </button>
        <button type="button" className={`${styles.action} ${styles.mood}`} onClick={() => navigate('/app/write')} aria-label="감정">
          <MoodOutlinedIcon />
        </button>
      </div>
    </article>
  );
}

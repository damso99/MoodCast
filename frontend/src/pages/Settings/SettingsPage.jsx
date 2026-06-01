import { useEffect, useState } from 'react';
import axios from 'axios';
import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useAuthStore } from '../../stores/useAuthStore';
import { startKakaoLink } from '../Auth/socialAuth';
import AuthToast from '../Auth/components/AuthToast';
import AuthConfirmModal from '../Auth/components/AuthConfirmModal';
import { getToastDuration } from '../Auth/authFeedback';
import styles from './SettingsPage.module.css';

const sections = ['계정', '알림', '보안'];

export function SettingsPage() {
  const desktop = useIsDesktop();
  const { accessToken } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';
  const [kakaoLinked, setKakaoLinked] = useState(false);
  const [kakaoLinkModalOpen, setKakaoLinkModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  const showToast = (type, message) => {
    const duration = getToastDuration(type);
    setToast({ show: true, type, message, duration });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), duration);
  };

  const handleKakaoLink = () => {
    if (kakaoLinked) {
      showToast('success', '이미 카카오 계정이 연결되어 있습니다.');
      return;
    }

    setKakaoLinkModalOpen(true);
  };

  const confirmKakaoLink = () => {
    try {
      setKakaoLinkModalOpen(false);
      startKakaoLink();
    } catch (error) {
      showToast('error', error.message);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    axios
      .get(`${BACKSERVER}/oauth/kakao/status`, {
        headers: {
          Authorization: 'Bearer ' + accessToken,
        },
      })
      .then((res) => {
        setKakaoLinked(Boolean(res.data?.linked));
      })
      .catch(() => {
        setKakaoLinked(false);
      });
  }, [BACKSERVER, accessToken]);

  const content = (
    <section className={styles.wrap}>
      <AuthToast toast={toast} />
      <AuthConfirmModal
        open={kakaoLinkModalOpen}
        title="카카오 계정을 연결할까요?"
        description="현재 MoodCast 계정에 카카오 로그인을 추가합니다. 연결 후에는 같은 이메일의 카카오 계정으로도 로그인할 수 있습니다."
        cancelText="취소"
        confirmText="연결하기"
        onCancel={() => setKakaoLinkModalOpen(false)}
        onConfirm={confirmKakaoLink}
      />
      <div className={styles.hero}>
        <strong>설정</strong>
        <p>계정, 알림, 보안 관련 옵션을 한곳에서 관리할 수 있습니다.</p>
      </div>
      <div className={styles.grid}>
        {sections.map((title) => (
          <article key={title} className={styles.card}>
            <h2>{title}</h2>
            {title === '계정' ? (
              <>
                <p className={styles.cardText}>
                  {kakaoLinked
                    ? '카카오 계정이 연결되어 있습니다.'
                    : '일반 계정에 카카오 로그인을 연결합니다.'}
                </p>
                <button type="button" onClick={handleKakaoLink} disabled={kakaoLinked}>
                  {kakaoLinked ? '카카오 연결완료' : '카카오 계정 연결'}
                </button>
              </>
            ) : (
              <button type="button">세부 설정</button>
            )}
          </article>
        ))}
      </div>
    </section>
  );

  if (!desktop) return <MobileShell title="설정" hideSearch>{content}</MobileShell>;
  return <DesktopShell>{content}</DesktopShell>;
}

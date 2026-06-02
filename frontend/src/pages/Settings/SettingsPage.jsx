import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useAuthStore } from '../../stores/useAuthStore';
import { startKakaoLink } from '../Auth/socialAuth';
import AuthToast from '../Auth/components/AuthToast';
import AuthConfirmModal from '../Auth/components/AuthConfirmModal';
import { getApiMessage, getToastDuration } from '../Auth/authFeedback';
import styles from './SettingsPage.module.css';

const sections = ['계정', '알림', '보안'];
const passwordRegex =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[?!@#$%^&*])[A-Za-z\d?!@#$%^&*]{8,20}$/;
const passwordPolicyMessage =
  '비밀번호는 영문, 숫자, 특수문자(? ! @ # $ % ^ & *)를 포함한 8~20자입니다.';
const initialPasswordForm = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
};
const initialWithdrawForm = {
  password: '',
  confirmText: '',
};

export function SettingsPage() {
  const desktop = useIsDesktop();
  const navigate = useNavigate();
  const { accessToken, clearAuthData } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';
  const [kakaoLinked, setKakaoLinked] = useState(false);
  const [kakaoLinkModalOpen, setKakaoLinkModalOpen] = useState(false);
  const [passwordSuccessModalOpen, setPasswordSuccessModalOpen] = useState(false);
  const [withdrawConfirmModalOpen, setWithdrawConfirmModalOpen] = useState(false);
  const [withdrawSuccessModalOpen, setWithdrawSuccessModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [withdrawForm, setWithdrawForm] = useState(initialWithdrawForm);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);
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

  const handlePasswordInputChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWithdrawInputChange = (event) => {
    const { name, value } = event.target;
    setWithdrawForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    const payload = {
      currentPassword: passwordForm.currentPassword.trim(),
      newPassword: passwordForm.newPassword.trim(),
      newPasswordConfirm: passwordForm.newPasswordConfirm.trim(),
    };

    if (!payload.currentPassword) {
      showToast('error', '현재 비밀번호를 입력해주세요.');
      return;
    }

    if (!passwordRegex.test(payload.newPassword)) {
      showToast('error', passwordPolicyMessage);
      return;
    }

    if (payload.newPassword !== payload.newPasswordConfirm) {
      showToast('error', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setIsPasswordLoading(true);
      await axios.post(`${BACKSERVER}/auth/password/change`, payload, {
        headers: {
          Authorization: 'Bearer ' + accessToken,
        },
        withCredentials: true,
      });

      clearAuthData();
      setPasswordForm(initialPasswordForm);
      setPasswordSuccessModalOpen(true);
    } catch (error) {
      showToast('error', getApiMessage(error, '비밀번호 변경에 실패했습니다.'));
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const confirmPasswordSuccess = () => {
    setPasswordSuccessModalOpen(false);
    navigate('/auth/login', { replace: true });
  };

  const requestWithdraw = (event) => {
    event.preventDefault();

    if (withdrawForm.confirmText.trim() !== '탈퇴합니다') {
      showToast('error', "탈퇴 확인 문구는 '탈퇴합니다'로 정확히 입력해주세요.");
      return;
    }

    setWithdrawConfirmModalOpen(true);
  };

  const confirmWithdraw = async () => {
    try {
      setIsWithdrawLoading(true);
      setWithdrawConfirmModalOpen(false);

      await axios.post(
        `${BACKSERVER}/auth/withdraw`,
        {
          password: withdrawForm.password.trim(),
          confirmText: withdrawForm.confirmText.trim(),
        },
        {
          headers: {
            Authorization: 'Bearer ' + accessToken,
          },
          withCredentials: true,
        },
      );

      clearAuthData();
      setWithdrawForm(initialWithdrawForm);
      setWithdrawSuccessModalOpen(true);
    } catch (error) {
      showToast('error', getApiMessage(error, '회원 탈퇴에 실패했습니다.'));
    } finally {
      setIsWithdrawLoading(false);
    }
  };

  const confirmWithdrawSuccess = () => {
    setWithdrawSuccessModalOpen(false);
    navigate('/auth/login', { replace: true });
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
      <AuthConfirmModal
        open={passwordSuccessModalOpen}
        title="비밀번호가 변경되었습니다."
        description="보안을 위해 다시 로그인해주세요."
        confirmOnly
        confirmText="로그인하기"
        onConfirm={confirmPasswordSuccess}
      />
      <AuthConfirmModal
        open={withdrawConfirmModalOpen}
        title="정말 탈퇴할까요?"
        description="탈퇴하면 현재 로그인 세션이 모두 종료되고, 같은 계정으로 다시 로그인할 수 없습니다."
        cancelText="취소"
        confirmText={isWithdrawLoading ? '처리 중' : '탈퇴하기'}
        onCancel={() => setWithdrawConfirmModalOpen(false)}
        onConfirm={confirmWithdraw}
      />
      <AuthConfirmModal
        open={withdrawSuccessModalOpen}
        title="회원 탈퇴가 완료되었습니다."
        description="그동안 MoodCast를 이용해주셔서 감사합니다."
        confirmOnly
        confirmText="로그인 화면으로"
        onConfirm={confirmWithdrawSuccess}
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
                <form className={styles.withdrawForm} onSubmit={requestWithdraw}>
                  <div className={styles.dangerHeader}>
                    <strong>회원 탈퇴</strong>
                    <p>탈퇴 후에는 계정 로그인이 차단됩니다.</p>
                  </div>
                  <label>
                    <span>비밀번호</span>
                    <input
                      type="password"
                      name="password"
                      value={withdrawForm.password}
                      onChange={handleWithdrawInputChange}
                      placeholder="일반 계정만 입력"
                      autoComplete="current-password"
                    />
                  </label>
                  <label>
                    <span>소셜 전용 계정 확인 문구</span>
                    <input
                      type="text"
                      name="confirmText"
                      value={withdrawForm.confirmText}
                      onChange={handleWithdrawInputChange}
                      placeholder="탈퇴합니다"
                    />
                  </label>
                  <button type="submit" className={styles.dangerButton} disabled={isWithdrawLoading}>
                    {isWithdrawLoading ? '처리 중' : '회원 탈퇴'}
                  </button>
                </form>
              </>
            ) : title === '보안' ? (
              <form className={styles.passwordForm} onSubmit={handlePasswordChange}>
                <p className={styles.cardText}>
                  비밀번호 변경 후 모든 기기에서 다시 로그인해야 합니다.
                </p>
                <label>
                  <span>현재 비밀번호</span>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInputChange}
                    autoComplete="current-password"
                  />
                </label>
                <label>
                  <span>새 비밀번호</span>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    autoComplete="new-password"
                  />
                </label>
                <label>
                  <span>새 비밀번호 확인</span>
                  <input
                    type="password"
                    name="newPasswordConfirm"
                    value={passwordForm.newPasswordConfirm}
                    onChange={handlePasswordInputChange}
                    autoComplete="new-password"
                  />
                </label>
                <p className={styles.helperText}>{passwordPolicyMessage}</p>
                <button type="submit" disabled={isPasswordLoading}>
                  {isPasswordLoading ? '변경 중' : '비밀번호 변경'}
                </button>
              </form>
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

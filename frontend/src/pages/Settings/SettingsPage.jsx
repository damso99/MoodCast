import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useAuthStore } from '../../stores/useAuthStore';
import { startGoogleLink, startKakaoLink } from '../Auth/socialAuth';
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
  confirmText: '',
  authCode: '',
};

export function SettingsPage() {
  const desktop = useIsDesktop();
  const navigate = useNavigate();
  const { accessToken, member, clearAuthData } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';
  const [kakaoLinked, setKakaoLinked] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [kakaoLinkModalOpen, setKakaoLinkModalOpen] = useState(false);
  const [googleLinkModalOpen, setGoogleLinkModalOpen] = useState(false);
  const [passwordSuccessModalOpen, setPasswordSuccessModalOpen] = useState(false);
  const [withdrawConfirmModalOpen, setWithdrawConfirmModalOpen] = useState(false);
  const [withdrawSuccessModalOpen, setWithdrawSuccessModalOpen] = useState(false);
  const [withdrawPanelOpen, setWithdrawPanelOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [withdrawForm, setWithdrawForm] = useState(initialWithdrawForm);
  const [withdrawEmailCodeSent, setWithdrawEmailCodeSent] = useState(false);
  const [withdrawEmailVerified, setWithdrawEmailVerified] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);
  const [isWithdrawEmailSending, setIsWithdrawEmailSending] = useState(false);
  const [isWithdrawEmailVerifying, setIsWithdrawEmailVerifying] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  const showToast = (type, message) => {
    const duration = getToastDuration(type);
    setToast({ show: true, type, message, duration });
    setTimeout(() => setToast({ show: false, type: '', message: '' }), duration);
  };

  const logDevAuthCode = (label, authCode) => {
    if (authCode) {
      console.log(`[MoodCast 개발용 인증번호] ${label}: ${authCode}`);
    }
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

  const handleGoogleLink = () => {
    if (googleLinked) {
      showToast('success', '이미 Google 계정이 연결되어 있습니다.');
      return;
    }

    setGoogleLinkModalOpen(true);
  };

  const confirmGoogleLink = () => {
    try {
      setGoogleLinkModalOpen(false);
      startGoogleLink();
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

    if (name === 'authCode' && withdrawEmailVerified) {
      setWithdrawEmailVerified(false);
    }
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

  const toggleWithdrawPanel = () => {
    if (withdrawPanelOpen) {
      setWithdrawForm(initialWithdrawForm);
      setWithdrawEmailCodeSent(false);
      setWithdrawEmailVerified(false);
    }

    setWithdrawPanelOpen((prev) => !prev);
  };

  const sendWithdrawEmailCode = async () => {
    try {
      setIsWithdrawEmailSending(true);
      const res = await axios.post(
        `${BACKSERVER}/auth/withdraw/email/send`,
        {},
        {
          headers: {
            Authorization: 'Bearer ' + accessToken,
          },
        },
      );

      setWithdrawEmailCodeSent(true);
      setWithdrawEmailVerified(false);
      logDevAuthCode('회원 탈퇴 이메일', res.data?.authCode);
      showToast('success', res.data?.message || '탈퇴 확인 이메일 인증번호를 발송했습니다.');
    } catch (error) {
      showToast('error', getApiMessage(error, '탈퇴 확인 이메일 인증번호 발송에 실패했습니다.'));
    } finally {
      setIsWithdrawEmailSending(false);
    }
  };

  const verifyWithdrawEmailCode = async () => {
    if (!withdrawForm.authCode.trim()) {
      showToast('error', '이메일 인증번호를 입력해주세요.');
      return;
    }

    try {
      setIsWithdrawEmailVerifying(true);
      const res = await axios.post(
        `${BACKSERVER}/auth/withdraw/email/verify`,
        {
          authCode: withdrawForm.authCode.trim(),
        },
        {
          headers: {
            Authorization: 'Bearer ' + accessToken,
          },
        },
      );

      setWithdrawEmailVerified(true);
      showToast('success', res.data?.message || '탈퇴 이메일 인증이 완료되었습니다.');
    } catch (error) {
      showToast('error', getApiMessage(error, '이메일 인증번호를 확인해주세요.'));
    } finally {
      setIsWithdrawEmailVerifying(false);
    }
  };

  const requestWithdraw = (event) => {
    event.preventDefault();

    if (!withdrawEmailVerified) {
      showToast('error', '이메일 인증을 먼저 완료해주세요.');
      return;
    }

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
      setWithdrawPanelOpen(false);
      setWithdrawEmailCodeSent(false);
      setWithdrawEmailVerified(false);
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

    const headers = {
      Authorization: 'Bearer ' + accessToken,
    };

    Promise.allSettled([
      axios.get(`${BACKSERVER}/oauth/kakao/status`, { headers }),
      axios.get(`${BACKSERVER}/oauth/google/status`, { headers }),
    ]).then(([kakaoResult, googleResult]) => {
      setKakaoLinked(
        kakaoResult.status === 'fulfilled' && Boolean(kakaoResult.value.data?.linked),
      );
      setGoogleLinked(
        googleResult.status === 'fulfilled' && Boolean(googleResult.value.data?.linked),
      );
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
        open={googleLinkModalOpen}
        title="Google 계정을 연결할까요?"
        description="현재 MoodCast 계정에 Google 로그인을 추가합니다. 연결 후에는 같은 이메일의 Google 계정으로도 로그인할 수 있습니다."
        cancelText="취소"
        confirmText="연결하기"
        onCancel={() => setGoogleLinkModalOpen(false)}
        onConfirm={confirmGoogleLink}
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
                  일반 계정에 소셜 로그인을 연결합니다. 현재 로그인한 이메일과 같은 소셜 계정만 연결할 수 있습니다.
                </p>
                <div className={styles.providerList}>
                  <div className={styles.providerRow}>
                    <div className={styles.providerMeta}>
                      <strong>카카오</strong>
                      <span>{kakaoLinked ? '연결됨' : '미연결'}</span>
                    </div>
                    <button type="button" onClick={handleKakaoLink} disabled={kakaoLinked}>
                      {kakaoLinked ? '연결완료' : '연결'}
                    </button>
                  </div>
                  <div className={styles.providerRow}>
                    <div className={styles.providerMeta}>
                      <strong>Google</strong>
                      <span>{googleLinked ? '연결됨' : '미연결'}</span>
                    </div>
                    <button type="button" onClick={handleGoogleLink} disabled={googleLinked}>
                      {googleLinked ? '연결완료' : '연결'}
                    </button>
                  </div>
                </div>
                <div className={styles.dangerZone}>
                  <button
                    type="button"
                    className={styles.textDangerButton}
                    onClick={toggleWithdrawPanel}
                    aria-expanded={withdrawPanelOpen}
                    aria-controls="withdrawPanel"
                  >
                    {withdrawPanelOpen ? '계정 관리 접기' : '계정 관리 더보기'}
                  </button>
                  {withdrawPanelOpen ? (
                    <form id="withdrawPanel" className={styles.withdrawForm} onSubmit={requestWithdraw}>
                      <div className={styles.dangerHeader}>
                        <strong>회원 탈퇴</strong>
                        <p>계정 이메일 인증 후 탈퇴할 수 있습니다.</p>
                      </div>
                      <div className={styles.emailVerifyBox}>
                        <p>{member?.email || '현재 로그인한 이메일'}로 인증번호를 보냅니다.</p>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={sendWithdrawEmailCode}
                          disabled={isWithdrawEmailSending || withdrawEmailVerified}
                        >
                          {isWithdrawEmailSending
                            ? '발송 중'
                            : withdrawEmailVerified
                              ? '인증완료'
                              : withdrawEmailCodeSent
                                ? '인증번호 재발송'
                                : '인증번호 발송'}
                        </button>
                      </div>
                      <label>
                        <span>이메일 인증번호</span>
                        <div className={styles.inlineAction}>
                          <input
                            type="text"
                            name="authCode"
                            value={withdrawForm.authCode}
                            onChange={handleWithdrawInputChange}
                            placeholder="6자리 숫자"
                            readOnly={withdrawEmailVerified}
                          />
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={verifyWithdrawEmailCode}
                            disabled={!withdrawEmailCodeSent || isWithdrawEmailVerifying || withdrawEmailVerified}
                          >
                            {withdrawEmailVerified ? '확인완료' : isWithdrawEmailVerifying ? '확인 중' : '인증 확인'}
                          </button>
                        </div>
                      </label>
                      <label>
                        <span>확인 문구</span>
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
                  ) : null}
                </div>
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

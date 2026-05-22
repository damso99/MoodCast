import axios from 'axios';
import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthState } from '../../hooks/useAuthState';
import styles from './ProfileEditPage.module.css';

const defaultProfile = {
  nickname: 'Lena_Parks',
  bio: '감정을 기록하고 커뮤니티와 함께하는 라이프로그 스타일의 프로필입니다.',
};

export function ProfileEditPage() {
  const desktop = useIsDesktop();
  const navigate = useNavigate();
  const { member, accessToken, setAuthData } = useAuthState();
  const [profile, setProfile] = useState(defaultProfile);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!member) return;
    setProfile((prev) => ({
      ...prev,
      nickname: member.nickname || prev.nickname,
      bio: member.bio || prev.bio,
    }));
  }, [member]);

  const handleInput = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSaved(false);
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setSaved(false);
  };

  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  const handleSave = () => {
    if (!member || !accessToken) {
      setSaved(false);
      return;
    }

    axios
      .put(
        `${BACKSERVER}/auth/profile`,
        {
          nickname: profile.nickname,
          bio: profile.bio,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then((res) => {
        if (res.data?.member) {
          setAuthData(accessToken, res.data.member);
        }
        setSaved(true);
        window.setTimeout(() => {
          navigate('/app/profile');
        }, 800);
      })
      .catch((error) => {
        console.error('프로필 저장 실패', error);
      });
  };

  const handleBack = () => {
    navigate('/app/profile');
  };

  const content = (
    <section className={styles.wrap}>
      <div className={styles.hero}>
        <strong>프로필 편집</strong>
        <p>닉네임, 자기소개, 프로필 사진을 수정할 수 있습니다.</p>
      </div>

      <div className={styles.card}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>
            {photoPreview ? <img src={photoPreview} alt="프로필 사진 미리보기" /> : profile.nickname.charAt(0).toUpperCase()}
          </div>
          <label className={styles.uploadButton}>
            사진 변경
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
          </label>
          <span className={styles.helper}>권장 이미지 크기: 320x320</span>
        </div>

        <div className={styles.field}>
          <label htmlFor="nickname">닉네임</label>
          <input
            id="nickname"
            name="nickname"
            value={profile.nickname}
            onChange={handleInput}
            placeholder="닉네임을 입력하세요"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="bio">자기소개</label>
          <textarea
            id="bio"
            name="bio"
            value={profile.bio}
            onChange={handleInput}
            placeholder="자기소개를 작성해보세요."
          />
        </div>

        <div className={styles.buttonRow}>
          <button type="button" className={styles.backButton} onClick={handleBack}>
            취소
          </button>
          <button type="button" className={styles.saveButton} onClick={handleSave}>
            완료
          </button>
        </div>

        {saved ? <div className={styles.message}>프로필 변경 사항이 저장되었습니다.</div> : null}
      </div>
    </section>
  );

  if (!desktop) return <MobileShell title="프로필 편집" hideSearch>{content}</MobileShell>;
  return <DesktopShell>{content}</DesktopShell>;
}

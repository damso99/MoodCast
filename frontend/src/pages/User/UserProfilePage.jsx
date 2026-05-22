import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../hooks/useAuthStore';
import styles from './UserProfilePage.module.css';

export function UserProfilePage() {
  const desktop = useIsDesktop();
  const { handle } = useParams(); // URL 파라미터 :handle (현재는 클릭한 사용자의 memberId가 들어옴)
  const [user, setUser] = useState(null); // API로 받아온 사용자 정보를 저장하는 상태
  const [loading, setLoading] = useState(true); // 데이터를 불러오는 중인지 확인하는 상태
  const { member: currentMember } = useAuthStore(); // 현재 로그인한 내 정보를 가져옴
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  useEffect(() => {
    // 페이지에 접속하거나 handle(ID)이 바뀌면 사용자 정보를 다시 불러옵니다.
    setLoading(true);
    
    // 백엔드의 특정 사용자 조회 API 호출
    axios.get(`${BACKSERVER}/auth/member/${handle}`)
      .then(res => {
        if (res.data.success) {
          setUser(res.data.member); // 성공 시 사용자 정보를 상태에 저장
        }
      })
      .catch(err => {
        console.error('사용자 정보 조회 실패:', err);
      })
      .finally(() => {
        setLoading(false); // 로딩 종료
      });
  }, [handle, BACKSERVER]);

  // '현재 보고 있는 프로필'이 '내 프로필'인지 확인합니다.
  const isOwnProfile = currentMember && String(currentMember.memberId) === String(handle);

  // 데이터를 불러오는 중일 때 보여줄 화면
  if (loading) {
    const loader = <div style={{ padding: '20px', textAlign: 'center' }}>프로필을 불러오는 중...</div>;
    if (!desktop) return <MobileShell title="사용자 프로필" hideSearch>{loader}</MobileShell>;
    return <DesktopShell>{loader}</DesktopShell>;
  }

  // 사용자가 존재하지 않을 때 보여줄 화면
  if (!user) {
    const noUser = <div style={{ padding: '20px', textAlign: 'center' }}>사용자를 찾을 수 없습니다.</div>;
    if (!desktop) return <MobileShell title="사용자 프로필" hideSearch>{noUser}</MobileShell>;
    return <DesktopShell>{noUser}</DesktopShell>;
  }

  // 실제 프로필 화면 UI 구성
  const content = (
    <section className={styles.wrap}>
      <div className={styles.hero}>
        {/* 프로필 이미지 (없으면 닉네임 첫 글자 표시) */}
        <div className={styles.avatar}>{user?.nickname?.charAt(0) || 'U'}</div>
        
        <div className={styles.heroInfo}>
          <div className={styles.nameRow}>
            <strong>{user?.nickname || '사용자'}</strong>
            
            {/* 내 프로필이 아닐 때만 '팔로우'와 '채팅' 버튼을 보여줍니다. */}
            {!isOwnProfile && (
              <div className={styles.actions}>
                <button type="button" className={styles.followBtn}>팔로잉 하기</button>
                <button type="button" className={styles.chatBtn}>채팅하기</button>
              </div>
            )}
          </div>
          
          <span>@{user?.memberId || handle}</span>
          {/* 사용자 소개글 (API의 bio 필드 사용) */}
          <p>{user?.bio || '안녕하세요! MoodCast 사용자입니다.'}</p>
        </div>
      </div>
      
      {/* 통계 정보 (게시물, 팔로워 등) - 현재는 목업 데이터 */}
      <div className={styles.stats}>
        <article>
          <strong>18</strong>
          <span>게시물</span>
        </article>
        <article>
          <strong>254</strong>
          <span>팔로워</span>
        </article>
        <article>
          <strong>98</strong>
          <span>팔로잉</span>
        </article>
      </div>
    </section>
  );

  if (!desktop) return <MobileShell title="사용자 프로필" hideSearch>{content}</MobileShell>;
  return <DesktopShell>{content}</DesktopShell>;
}

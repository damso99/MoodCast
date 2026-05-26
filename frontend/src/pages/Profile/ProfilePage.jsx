import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../hooks/useAuthStore';
import { FeedCard } from '../../components/common/FeedCard';
import { profileHighlights } from '../../data/moodcastData';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const desktop = useIsDesktop();
  const navigate = useNavigate();
  const { handle } = useParams(); // URL 파라미터 :handle (memberId)
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [followInfo, setFollowInfo] = useState({ 
    following: false, 
    followerCount: 0, 
    followingCount: 0,
    postCount: 0,
    savedCount: 0
  });
  
  const { member: currentMember, accessToken: token, isLoggedIn } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  // 실제 조회할 ID 결정 (파라미터 없으면 내 ID)
  const targetId = handle || currentMember?.memberId;

  // 팔로우 상태 및 카운트 조회 함수
  const fetchFollowStatus = useCallback(() => {
    if (!targetId) return;
    
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    
    axios.get(`${BACKSERVER}/auth/follow/status/${targetId}`, config)
      .then(res => {
        if (res.data.success) {
          setFollowInfo({
            following: res.data.following,
            followerCount: res.data.followerCount,
            followingCount: res.data.followingCount,
            postCount: res.data.postCount,
            savedCount: res.data.savedCount
          });
        }
      })
      .catch(err => console.error('팔로우 상태 조회 실패:', err));
  }, [targetId, BACKSERVER, token]);

  useEffect(() => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // 1. 사용자 기본 정보 조회
    axios.get(`${BACKSERVER}/auth/member/${targetId}`)
      .then(res => {
        if (res.data.success) {
          setUser(res.data.member);
          // 2. 팔로우 정보 조회 (실제 데이터)
          fetchFollowStatus();
        }
      })
      .catch(err => {
        console.error('사용자 정보 조회 실패:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [targetId, BACKSERVER, fetchFollowStatus]);

  useEffect(() => {
    if (!targetId) {
      setPosts([]);
      setPostsLoading(false);
      return;
    }

    setPostsLoading(true);
    axios.get(`${BACKSERVER}/posts`, { params: { memberId: targetId } })
      .then(res => {
        if (res.data.success) {
          setPosts(res.data.results || []);
        } else {
          setPosts([]);
        }
      })
      .catch(err => {
        console.error('프로필 게시물 조회 실패:', err);
        setPosts([]);
      })
      .finally(() => {
        setPostsLoading(false);
      });
  }, [targetId, BACKSERVER]);

  const isOwnProfile = currentMember && String(currentMember.memberId) === String(targetId);

  // 팔로우 처리 함수
  const handleFollowToggle = () => {
    if (!token) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/auth/login');
      return;
    }

    axios.post(`${BACKSERVER}/auth/follow/${targetId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (res.data.success) {
        // 성공 시 로컬 상태 업데이트
        fetchFollowStatus();
      }
    })
    .catch(err => {
      console.error('팔로우 처리 실패:', err);
      alert(err.response?.data?.message || '팔로우 처리 중 오류가 발생했습니다.');
    });
  };

  const handleStatClick = (label) => {
    if (label === '저장됨' && isOwnProfile) navigate('/app/saved');
    if (label === '팔로워') {
      const id = targetId || currentMember?.memberId;
      navigate(`/app/followers/${id}`);
    }
    if (label === '팔로잉') {
      const id = targetId || currentMember?.memberId;
      navigate(`/app/following/${id}`);
    }
  };

  if (loading) {
    const loader = <div style={{ padding: '20px', textAlign: 'center' }}>프로필을 불러오는 중...</div>;
    if (!desktop) return <MobileShell title="프로필" hideSearch>{loader}</MobileShell>;
    return <DesktopShell>{loader}</DesktopShell>;
  }

  if (!user) {
    const noUser = <div style={{ padding: '20px', textAlign: 'center' }}>사용자를 찾을 수 없습니다.</div>;
    if (!desktop) return <MobileShell title="프로필" hideSearch>{noUser}</MobileShell>;
    return <DesktopShell>{noUser}</DesktopShell>;
  }

  const displayName = user?.nickname || user?.name || 'MoodCast 사용자';
  const displayInitial = displayName.charAt(0).toUpperCase();
  const displayText = user?.bio || (isOwnProfile ? '감성을 기록하고 커뮤니티 참여를 즐기는 MoodCast 프로필입니다.' : '안녕하세요! MoodCast 사용자입니다.');
  const handleChatClick = () => {
    const searchParams = new URLSearchParams({
      partnerId: String(targetId),
      partnerName: displayName,
    });

    navigate(`/app/chat?${searchParams.toString()}`);
  };

  const content = (
    <section className={styles.wrap}>
      {/* 히어로 섹션 - 풍성하게 수정함 */}
      <article className={styles.hero}>
        <div className={styles.avatar}>{displayInitial}</div>
        <div className={styles.heroContent}>
          <strong>{displayName}</strong>
          <p>{displayText}</p>
          <span className={styles.handle}>
            @{user?.email ? user.email.split('@')[0] : (user?.memberId || targetId)}
          </span>
        </div>
        
        {isOwnProfile ? (
          <button 
            type="button" 
            className={styles.editBtnRich}
            onClick={() => navigate('/app/profile/edit')}
          >
            프로필 편집
          </button>
        ) : isLoggedIn ? (
          <div className={styles.actionsRich}>
            <button 
              type="button" 
              className={followInfo.following ? styles.unfollowBtnRich : styles.followBtnRich}
              onClick={handleFollowToggle}
            >
              {followInfo.following ? '언팔로우' : '팔로우'}
            </button>
            <button type="button" className={styles.chatBtn} onClick={handleChatClick}>채팅하기</button>
          </div>
        ) : null}
      </article>

      {/* 통계 섹션 - 실제 데이터 적용 */}
      <div className={styles.stats}>
        {[
          { label: '게시물', value: followInfo.postCount },
          { label: '저장됨', value: followInfo.savedCount },
          { label: '팔로워', value: followInfo.followerCount },
          { label: '팔로잉', value: followInfo.followingCount },
        ].map((item) => {
          const isClickable = ['저장됨', '팔로워', '팔로잉'].includes(item.label);
          
          // 저장됨의 경우 타인 프로필이면 클릭은 안 되게 처리함
          const canClick = isClickable && (item.label !== '저장됨' || isOwnProfile);
          
          if (!canClick) {
            return (
              <div key={item.label} className={styles.statCard}>
                <strong>{item.label === '저장됨' && !isOwnProfile ? '0' : item.value}</strong>
                <span>{item.label}</span>
              </div>
            );
          }
          return (
            <button
              key={item.label}
              type="button"
              className={styles.statCard}
              onClick={() => handleStatClick(item.label)}
            >
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 하이라이트 섹션 추가함 */}
      <section className={styles.highlights}>
        {profileHighlights.map((item) => (
          <div key={item.label} className={styles.highlight}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>

      {/* 최근 게시물 섹션 추가함 */}
      <section className={styles.recent}>
        <div className={styles.sectionHeader}>
          <h2>최근 게시물</h2>
          {isOwnProfile && (
            <button type="button" onClick={() => navigate('/app/write')}>
              + 새 게시물
            </button>
          )}
        </div>
        <div className={styles.postList}>
          {postsLoading ? (
            <div className={styles.emptyState}>게시물을 불러오는 중입니다...</div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <FeedCard key={post.postId} post={post} compact />
            ))
          ) : (
            <div className={styles.emptyState}>작성한 게시물이 없습니다.</div>
          )}
        </div>
      </section>
    </section>
  );

  if (!desktop) return <MobileShell title="프로필" hideSearch>{content}</MobileShell>;
  return <DesktopShell>{content}</DesktopShell>;
}

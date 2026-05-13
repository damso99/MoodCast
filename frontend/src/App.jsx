import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bookmark,
  Camera,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  Image as ImageIcon,
  LogIn,
  LogOut,
  MessageCircle,
  MessagesSquare,
  MoreHorizontal,
  Palette,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smile,
  Sparkles,
  Trash2,
  User,
  UserCircle2,
  X,
} from 'lucide-react';
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';

const posts = [
  {
    id: 1,
    author: 'Lena Parks',
    avatar: 'L',
    time: '2시간 전',
    text: '오늘은 오후 햇살이 너무 좋아서 창가에 앉아 잠깐 숨을 고르며 기록을 남겼어요. 이런 순간을 모아두면 마음이 조금씩 정리되는 느낌이에요.',
    tone: 'sunset',
    likes: 128,
    comments: 24,
    vibes: 32,
    previewComment: { author: 'Mina', time: '방금', text: '사진 색감이 너무 좋아요.' },
    commentsList: [
      { id: 1, author: 'Juno', time: '1분 전', text: '분위기 너무 좋네요.' },
      { id: 2, author: 'Mina', time: '방금', text: '이런 글 자주 보고 싶어요.' },
    ],
  },
  {
    id: 2,
    author: 'Jordan K.',
    avatar: 'J',
    time: '3시간 전',
    text: '카페에서 조용히 프로젝트를 정리하는 중이에요. 오늘은 해야 할 일을 너무 많이 적기보다 중요한 것부터 차근차근 풀어가려 합니다.',
    tone: 'coffee',
    likes: 94,
    comments: 17,
    vibes: 19,
    previewComment: { author: 'Haru', time: '12분 전', text: '저도 이런 루틴이 필요해요.' },
    commentsList: [{ id: 1, author: 'Haru', time: '12분 전', text: '아주 공감돼요.' }],
  },
  {
    id: 3,
    author: 'Mina',
    avatar: 'M',
    time: '5시간 전',
    text: '새 프로젝트를 시작했어요. 오늘의 기분을 짧은 문장으로 적어두고, 나중에 다시 돌아보려고 합니다.',
    tone: 'pastel',
    likes: 211,
    comments: 37,
    vibes: 42,
    previewComment: { author: 'Kai', time: '1시간 전', text: '벌써 기대돼요.' },
    commentsList: [{ id: 1, author: 'Kai', time: '1시간 전', text: '응원할게요.' }],
  },
];

const savedPosts = [
  { id: 1, tag: '#감성', title: '오늘 하루를 정리하는 짧은 글', detail: '조용한 배경과 감성적인 문장들을 저장해둔 카드입니다.' },
  { id: 2, tag: '#작업', title: '프로젝트 시작 기록', detail: '나중에 다시 보고 싶을 때 꺼내볼 메모 카드입니다.' },
];

const communities = [
  { name: 'Mindful Creators', members: '8.7K members', tone: 'mountain' },
  { name: 'Nature Lovers', members: '12.3K members', tone: 'leaf' },
  { name: 'Coffee Talks', members: '5.1K members', tone: 'coffee' },
  { name: 'Fitness Journey', members: '9.2K members', tone: 'fitness' },
];

const moodStats = [
  ['Happy', '42%', '#4da6ff'],
  ['Calm', '27%', '#8b75ff'],
  ['Excited', '18%', '#d93cff'],
  ['Sad', '13%', '#5e84ff'],
];

const topics = ['오늘의 기분', '마음 정리', '감성 플레이리스트', '여행 기록', '취향 공유'];

const searchUsers = [
  ['Alex Chen', '@alexchen'],
  ['Lisa Wang', '@lisawang'],
  ['Mike Brown', '@mikebrown'],
];

const chatThreads = [
  { id: 1, name: 'Sarah Kim', preview: '오늘 사진 분위기 너무 좋았어요.', time: '2분 전', unread: 2 },
  { id: 2, name: 'John Park', preview: '프로젝트 준비는 어떻게 되고 있어요?', time: '15분 전', unread: 0 },
  { id: 3, name: 'Emma Lee', preview: '카페 추천 하나 더 보내드릴게요.', time: '1시간 전', unread: 0 },
];

const chatMessages = {
  1: [
    { id: 1, sender: 'them', text: '오늘 사진 분위기 너무 좋았어요.', time: '2:15 PM' },
    { id: 2, sender: 'me', text: '감사해요. 오늘은 마음이 편안했어요.', time: '2:16 PM' },
  ],
  2: [
    { id: 1, sender: 'them', text: '프로젝트 준비는 어떻게 되고 있어요?', time: '10:10 AM' },
    { id: 2, sender: 'me', text: '조금씩 정리 중이에요. 우선 핵심부터 잡고 있어요.', time: '10:12 AM' },
  ],
  3: [
    { id: 1, sender: 'them', text: '카페 추천 하나 더 보내드릴게요.', time: '어제' },
    { id: 2, sender: 'me', text: '좋아요. 주말에 가볼게요.', time: '어제' },
  ],
};

const profileStats = [
  ['게시물', '128'],
  ['저장됨', '42'],
  ['참여', '18'],
];

const profileHighlights = [
  ['감정 공감률', '72%'],
  ['주간 반응', '94'],
  ['프로필 상태', '완료'],
];

const interestTags = ['감성', '감정', '여행', '카페', '사진', '운동', '기록', '플레이리스트'];

function useViewportWidth() {
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 0 : window.innerWidth));

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

function useIsDesktop() {
  return useViewportWidth() >= 1024;
}

function useAuthState() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const stored = window.localStorage.getItem('moodcast-auth');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    window.localStorage.setItem('moodcast-auth', String(isLoggedIn));
  }, [isLoggedIn]);

  return { isLoggedIn, setIsLoggedIn };
}

function useBodyLock(open) {
  useEffect(() => {
    if (!open) return undefined;
    const { body, documentElement } = document;
    const prevBody = body.style.overflow;
    const prevHtml = documentElement.style.overflow;
    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevBody;
      documentElement.style.overflow = prevHtml;
    };
  }, [open]);
}

function Logo({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`}>
      <img className={`brandLogo ${compact ? 'brandLogo--compact' : ''}`} src="/MoodCast-logo.svg" alt="MoodCast" />
      {!compact ? (
        <div>
          <strong>MoodCast</strong>
          <p>감정을 기록하고 공유하는 감성 SNS</p>
        </div>
      ) : null}
    </div>
  );
}

function MoodVisual({ tone = 'sunset', large = false }) {
  return (
    <div className={`moodVisual moodVisual--${tone} ${large ? 'large' : ''}`}>
      {tone === 'sunset' ? (
        <>
          <div className="moodSun" />
          <div className="moodSea" />
          <div className="moodMountains" />
        </>
      ) : tone === 'coffee' ? (
        <>
          <div className="moodCup" />
          <div className="moodSteam" />
          <div className="moodGlow" />
        </>
      ) : (
        <>
          <div className="moodBubble moodBubble--one" />
          <div className="moodBubble moodBubble--two" />
        </>
      )}
      <span>{tone === 'coffee' ? 'Calm' : tone === 'pastel' ? 'Excited' : 'Happy'}</span>
    </div>
  );
}

function SearchModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const isDesktop = useIsDesktop();

  useBodyLock(open);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveTab('posts');
  }, [open]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (activeTab === 'users') {
      return searchUsers.filter(([name, handle]) => `${name} ${handle}`.toLowerCase().includes(normalized));
    }
    if (activeTab === 'hashtags') {
      return topics.filter((topic) => topic.toLowerCase().includes(normalized));
    }
    return posts.filter((post) => `${post.author} ${post.text}`.toLowerCase().includes(normalized));
  }, [activeTab, query]);

  if (!open) return null;

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <section className={`modal searchModal ${isDesktop ? '' : 'searchModal--mobile'}`} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <strong>검색</strong>
            <p>게시물, 사용자, 해시태그를 바로 찾아볼 수 있어요.</p>
          </div>
          <button type="button" className="iconButton" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <label className="searchField">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="검색어를 입력하세요" />
        </label>

        <div className="tabs">
          <button type="button" className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>
            게시글
          </button>
          <button type="button" className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
            사용자
          </button>
          <button type="button" className={activeTab === 'hashtags' ? 'active' : ''} onClick={() => setActiveTab('hashtags')}>
            해시태그
          </button>
        </div>

        <div className="list">
          {results.length ? (
            results.map((item) => {
              if (Array.isArray(item)) {
                return (
                  <article key={item[1]} className="listItem">
                    <strong>{item[0]}</strong>
                    <p>{item[1]}</p>
                  </article>
                );
              }

              if (typeof item === 'string') {
                return (
                  <article key={item} className="listItem">
                    <strong>#{item}</strong>
                    <p>인기 해시태그</p>
                  </article>
                );
              }

              return (
                <article key={item.id} className="listItem">
                  <strong>{item.author}</strong>
                  <p>{item.text}</p>
                </article>
              );
            })
          ) : (
            <article className="listItem">
              <strong>검색 결과가 없어요</strong>
              <p>다른 검색어로 다시 시도해 보세요.</p>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}

function CommentModal({ open, post, comments, onClose, onSubmit }) {
  const [comment, setComment] = useState('');
  const isDesktop = useIsDesktop();

  useBodyLock(open);

  useEffect(() => {
    if (open) setComment('');
  }, [open]);

  if (!open || !post) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) return;
    onSubmit({
      id: Date.now(),
      author: 'Me',
      time: '방금',
      text: trimmed,
    });
    setComment('');
  };

  return (
    <div className="overlay commentOverlay" onClick={onClose} role="presentation">
      <section className={`modal commentModal ${isDesktop ? '' : 'commentModal--mobile'}`} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <strong>댓글</strong>
            <p>{post.author}님의 게시물에 달린 반응을 확인해보세요.</p>
          </div>
          <button type="button" className="iconButton" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <form className="commentComposer" onSubmit={handleSubmit}>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="댓글을 남겨보세요" />
          <div className="commentComposerFooter">
            <span>{comment.length}/200</span>
            <button type="submit" className="gradientButton">
              <Send size={16} />
              등록
            </button>
          </div>
        </form>

        <div className="commentList">
          {comments.map((item) => (
            <article key={item.id} className="commentItem">
              <div className="commentTop">
                <div className="commentAvatar">{item.author[0]}</div>
                <div>
                  <strong>{item.author}</strong>
                  <p>{item.time}</p>
                </div>
              </div>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function FeedCard({ post, compact = false }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(post.commentsList);

  return (
    <>
      <article className={`feedCard ${compact ? 'compact' : ''}`}>
        <div className="postHead">
          <div className="avatar">{post.avatar}</div>
          <div>
            <strong>{post.author}</strong>
            <p>{post.time}</p>
          </div>
          <button type="button" className="iconButton" aria-label="더보기">
            <MoreHorizontal size={18} />
          </button>
        </div>

        <p className="postText">{post.text}</p>
        <MoodVisual tone={post.tone} large={!compact} />

        <div className="postActions">
          <span>
            <Heart size={18} fill="currentColor" />
            {post.likes}
          </span>
          <button type="button" className="postActionButton" onClick={() => setCommentsOpen(true)}>
            <MessageCircle size={18} />
            {comments.length}
          </button>
          <span>
            <Sparkles size={18} />
            {post.vibes}
          </span>
          <button type="button" className="iconButton" aria-label="저장">
            <Bookmark size={18} />
          </button>
        </div>

        {post.previewComment ? (
          <div className="commentPreview">
            <strong>{post.previewComment.author}</strong>
            <span>{post.previewComment.time}</span>
            <p>{post.previewComment.text}</p>
          </div>
        ) : null}
      </article>

      <CommentModal
        open={commentsOpen}
        post={post}
        comments={comments}
        onClose={() => setCommentsOpen(false)}
        onSubmit={(newComment) => setComments((prev) => [...prev, newComment])}
      />
    </>
  );
}

function Sidebar() {
  const links = [
    { label: '홈', icon: Home, to: '/app/feed' },
    { label: '저장된 게시물', icon: Bookmark, to: '/app/saved' },
    { label: 'Mood Chat', icon: MessagesSquare, to: '/app/mood-chat' },
    { label: '프로필', icon: User, to: '/app/profile' },
    { label: '설정', icon: Settings, to: '/app/settings' },
  ];

  return (
    <aside className="sidebar">
      <Logo />
      <nav className="sideNav">
        {links.map(({ label, icon: Icon, to }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sideItem ${isActive ? 'active' : ''}`}>
            <span>
              <Icon size={18} />
              {label}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function BottomNav() {
  const tabs = [
    { label: '홈', icon: Home, to: '/app/mobile-feed' },
    { label: '저장된 게시물', icon: Bookmark, to: '/app/saved' },
    { label: '새 게시물 작성', icon: Plus, to: '/app/write', centerAction: true },
    { label: 'Mood Chat', icon: MessageCircle, to: '/app/chat' },
    { label: '프로필', icon: User, to: '/app/profile' },
  ];

  return (
    <nav className="bottomNav">
      {tabs.map(({ label, icon: Icon, to, centerAction }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `bottomNavItem ${isActive ? 'active' : ''} ${centerAction ? 'centerAction' : ''}`}
        >
          <span className={centerAction ? 'bottomNavIcon' : 'bottomNavIcon small'}>
            <Icon size={centerAction ? 22 : 17} />
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function DesktopUtilityIcons({ onSearch }) {
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn } = useAuthState();
  const [menuOpen, setMenuOpen] = useState(false);

  const actions = isLoggedIn
    ? [
        { label: '프로필 보기', icon: User, action: () => navigate('/app/profile') },
        { label: '로그아웃', icon: LogOut, action: () => { setIsLoggedIn(false); navigate('/auth/login'); } },
      ]
    : [{ label: '로그인', icon: LogIn, action: () => navigate('/auth/login') }];

  return (
    <div className="topUtilityIcons">
      <button type="button" className="iconOnly" onClick={onSearch} aria-label="검색">
        <Search size={28} />
      </button>
      <button type="button" className="iconOnly iconOnly--badge" aria-label="알림">
        <Bell size={26} />
        <span />
      </button>
      <div className="profileMenu">
        <button type="button" className="iconOnly profileCircle" onClick={() => setMenuOpen((value) => !value)} aria-label="프로필 메뉴">
          <UserCircle2 size={32} />
        </button>
        {menuOpen ? (
          <div className="profileMenuPanel">
            {actions.map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  action();
                  setMenuOpen(false);
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TopBar({ onSearch }) {
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn } = useAuthState();
  const [menuOpen, setMenuOpen] = useState(false);

  const actions = isLoggedIn
    ? [
        { label: '프로필 보기', icon: User, action: () => navigate('/app/profile') },
        { label: '로그아웃', icon: LogOut, action: () => { setIsLoggedIn(false); navigate('/auth/login'); } },
      ]
    : [{ label: '로그인', icon: LogIn, action: () => navigate('/auth/login') }];

  return (
    <header className="topBar">
      <div className="topBarActions">
        <button type="button" className="roundIcon" onClick={onSearch} aria-label="검색">
          <Search size={18} />
        </button>
        <button type="button" className="roundIcon" aria-label="알림">
          <Bell size={18} />
        </button>
        <div className="profileMenu">
          <button type="button" className="roundIcon" onClick={() => setMenuOpen((value) => !value)} aria-label="프로필">
            <UserCircle2 size={19} />
          </button>
          {menuOpen ? (
            <div className="profileMenuPanel">
              {actions.map(({ label, icon: Icon, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    action();
                    setMenuOpen(false);
                  }}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function RightWidgets() {
  return (
    <div className="dashboardStack">
      <section className="widget">
        <div className="widgetTitle">
          <strong>오늘의 감정 분포</strong>
          <span>최근 1주</span>
        </div>
        {moodStats.map(([name, percent, color]) => (
          <div className="moodRow" key={name}>
            <i>
              <Smile size={16} />
            </i>
            <div>
              <strong>{name}</strong>
              <p>{percent}</p>
            </div>
            <em style={{ background: color }} />
          </div>
        ))}
      </section>

      <section className="widget">
        <div className="widgetTitle">
          <strong>트렌딩 주제</strong>
          <span>실시간</span>
        </div>
        {topics.map((topic, index) => (
          <div className="trendingItem" key={topic}>
            <span className="trendingRank">{index + 1}</span>
            <div>
              <strong>#{topic}</strong>
              <p>지금 많이 공유되고 있어요.</p>
            </div>
          </div>
        ))}
      </section>

      <section className="widget">
        <div className="widgetTitle">
          <strong>추천 커뮤니티</strong>
          <span>팔로우</span>
        </div>
        {communities.map((community) => (
          <article className="communityMini" key={community.name}>
            <div className={`communityThumb communityThumb--${community.tone}`} />
            <div>
              <strong>{community.name}</strong>
              <p>{community.members}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function ComposerCard() {
  const navigate = useNavigate();

  return (
    <article className="composerCard">
      <div className="composerTop">
        <div className="avatar avatar--large">M</div>
        <div>
          <strong>오늘의 기분을 기록해보세요</strong>
          <p>짧은 글과 이미지를 붙여 감성적인 게시물을 만들 수 있어요.</p>
        </div>
      </div>
      <div className="composerActions">
        <button type="button" onClick={() => navigate('/app/write')}>
          <ImageIcon size={16} />
          사진 추가
        </button>
        <button type="button" onClick={() => navigate('/app/write')}>
          <Palette size={16} />
          분위기 선택
        </button>
        <button type="button" className="gradientButton" onClick={() => navigate('/app/write')}>
          <Plus size={16} />
          새 게시물 작성
        </button>
      </div>
    </article>
  );
}

function DesktopShell({ children, withSearch = true }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <main className="desktopShell">
      <Sidebar />
      <section className="centerColumn">
        {withSearch ? <TopBar onSearch={() => setSearchOpen(true)} /> : null}
        {children}
      </section>
      <aside className="rightColumn">
        <DesktopUtilityIcons onSearch={() => setSearchOpen(true)} />
        <RightWidgets />
      </aside>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </main>
  );
}

function MobileFrame({ title, children, showSearch = true, fixedAction = null }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="mobileStage">
      <main className="phoneFrame">
        <header className="mobileTopBar">
          <h1>{title}</h1>
          <div className="mobileTopActions">
            {showSearch ? (
              <button type="button" className="mobileTopIcon" onClick={() => setSearchOpen(true)} aria-label="검색">
                <Search size={22} />
              </button>
            ) : null}
            <button type="button" className="mobileTopIcon mobileTopIcon--badge" aria-label="알림">
              <Bell size={22} />
              <span />
            </button>
            <button type="button" className="mobileTopAvatar" aria-label="프로필">
              <UserCircle2 size={28} />
            </button>
          </div>
        </header>

        {children}

        <BottomNav />
        {fixedAction}
      </main>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function HomeFeedPage() {
  return (
    <DesktopShell>
      <div className="feedColumn">
        <ComposerCard />
        {posts.map((post) => (
          <FeedCard key={post.id} post={post} />
        ))}
      </div>
    </DesktopShell>
  );
}

function MobileFeedPage() {
  return (
    <MobileFrame
      title="MoodCast"
      fixedAction={
        <NavLink className="floatingCompose" to="/app/write" aria-label="새 게시물 작성">
          <Plus size={24} />
        </NavLink>
      }
    >
      <section className="mobileFeedList">
        <ComposerCard />
        {posts.map((post) => (
          <FeedCard key={post.id} post={post} compact />
        ))}
      </section>
    </MobileFrame>
  );
}

function SavedPage() {
  const desktop = useIsDesktop();

  if (!desktop) {
    return (
      <MobileFrame title="저장된 게시물" showSearch={false}>
        <section className="mobileContentStack">
          {savedPosts.map((post) => (
            <article key={post.id} className="savedCard">
              <span>{post.tag}</span>
              <h2>{post.title}</h2>
              <p>{post.detail}</p>
            </article>
          ))}
        </section>
      </MobileFrame>
    );
  }

  return (
    <DesktopShell>
      <div className="feedColumn">
        <article className="pageHero">
          <Bookmark size={18} />
          <div>
            <strong>저장된 게시물</strong>
            <p>나중에 다시 보고 싶은 글과 이미지를 모아두는 공간입니다.</p>
          </div>
        </article>
        <div className="savedGrid">
          {savedPosts.map((post) => (
            <article key={post.id} className="savedCard">
              <span>{post.tag}</span>
              <h2>{post.title}</h2>
              <p>{post.detail}</p>
              <div className="savedActions">
                <button type="button">열기</button>
                <button type="button">
                  <Trash2 size={16} />
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </DesktopShell>
  );
}

function MoodChatPage() {
  const desktop = useIsDesktop();
  const [activeThreadId, setActiveThreadId] = useState(chatThreads[0].id);

  if (!desktop) {
    const messages = chatMessages[activeThreadId] ?? chatMessages[1];
    return (
      <MobileFrame title="Mood Chat">
        <section className="chatRoomCard chatRoomCard--mobile">
          {messages.map((message) => (
            <div key={message.id} className={`chatBubble ${message.sender === 'me' ? 'me' : 'them'}`}>
              <p>{message.text}</p>
              <span>{message.time}</span>
            </div>
          ))}
        </section>
        <form className="chatComposer chatComposer--mobile" onSubmit={(event) => event.preventDefault()}>
          <button type="button" aria-label="파일 첨부">
            <Paperclip size={18} />
          </button>
          <input placeholder="메시지를 입력하세요" />
          <button type="submit" className="chatSend">
            <Send size={18} />
          </button>
        </form>
      </MobileFrame>
    );
  }

  const messages = chatMessages[activeThreadId] ?? chatMessages[1];
  const activeThread = chatThreads.find((thread) => thread.id === activeThreadId);

  return (
    <DesktopShell>
      <div className="feedColumn chatColumn">
        <article className="pageHero">
          <MessagesSquare size={18} />
          <div>
            <strong>Mood Chat</strong>
            <p>감정을 주제로 대화를 이어갈 수 있는 채팅 공간입니다.</p>
          </div>
        </article>
        <div className="chatDesktopGrid">
          <aside className="chatThreadList">
            {chatThreads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`chatThreadItem ${thread.id === activeThreadId ? 'active' : ''}`}
                onClick={() => setActiveThreadId(thread.id)}
              >
                <div>
                  <strong>{thread.name}</strong>
                  <p>{thread.preview}</p>
                </div>
                <span>{thread.time}</span>
              </button>
            ))}
          </aside>

          <section className="chatRoomCard">
            <header className="chatRoomHeader">
              <div>
                <strong>{activeThread?.name}</strong>
                <span>온라인</span>
              </div>
            </header>
            <div className="chatMessages">
              {messages.map((message) => (
                <div key={message.id} className={`chatBubble ${message.sender === 'me' ? 'me' : 'them'}`}>
                  <p>{message.text}</p>
                  <span>{message.time}</span>
                </div>
              ))}
            </div>
            <form className="chatComposer" onSubmit={(event) => event.preventDefault()}>
              <button type="button" aria-label="파일 첨부">
                <Paperclip size={18} />
              </button>
              <input placeholder="메시지를 입력하세요" />
              <button type="button" aria-label="이모지">
                <Smile size={18} />
              </button>
              <button type="submit" className="chatSend">
                <Send size={18} />
              </button>
            </form>
          </section>
        </div>
      </div>
    </DesktopShell>
  );
}

function SettingsPage() {
  const desktop = useIsDesktop();
  const cards = ['계정', '알림', '보안'];

  if (!desktop) {
    return (
      <MobileFrame title="설정" showSearch={false}>
        <section className="mobileContentStack">
          {cards.map((title) => (
            <article key={title} className="settingsCard">
              <h2>{title}</h2>
              <button type="button" className="settingsItem">
                <span>세부 설정</span>
                <ChevronRight size={16} />
              </button>
            </article>
          ))}
        </section>
      </MobileFrame>
    );
  }

  return (
    <DesktopShell>
      <div className="feedColumn">
        <article className="pageHero">
          <ShieldCheck size={18} />
          <div>
            <strong>설정</strong>
            <p>계정, 알림, 보안 관련 옵션을 한곳에서 관리할 수 있습니다.</p>
          </div>
        </article>
        <div className="settingsGrid">
          {cards.map((title) => (
            <section key={title} className="settingsCard">
              <h2>{title}</h2>
              <button type="button" className="settingsItem">
                <span>세부 설정</span>
                <ChevronRight size={16} />
              </button>
            </section>
          ))}
        </div>
      </div>
    </DesktopShell>
  );
}

function ProfilePage() {
  return (
    <MobileFrame title="프로필" showSearch={false}>
      <section className="profileHero profileHero--mobile">
        <div className="bigAvatar">L</div>
        <p>MOODCAST PROFILE</p>
        <h1>Lena_Parks</h1>
        <span>감정을 기록하고 커뮤니티에 참여하는 라이프로그 스타일의 프로필입니다.</span>
      </section>
      <section className="statsGrid">
        {profileStats.map(([label, value]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>
      <div className="profilePill">
        <Heart size={18} />
        {profileHighlights[0][0]} {profileHighlights[0][1]}
      </div>
      <div className="profilePill">
        <MessageCircle size={18} />
        {profileHighlights[1][0]} {profileHighlights[1][1]}
      </div>
      <div className="profilePill small">
        <ShieldCheck size={18} />
        {profileHighlights[2][0]} {profileHighlights[2][1]}
      </div>
    </MobileFrame>
  );
}

function ProfileDesktopPage() {
  const navigate = useNavigate();

  return (
    <DesktopShell>
      <div className="feedColumn">
        <article className="pageHero profileHeroCard">
          <div className="profileAvatarLarge">L</div>
          <div>
            <strong>Lena Parks</strong>
            <p>감성 기록과 커뮤니티 참여를 즐기는 MoodCast의 프로필 화면입니다.</p>
          </div>
          <button type="button" onClick={() => navigate('/app/write')}>
            새 게시물 작성
          </button>
        </article>

        <div className="profileStatsGrid">
          {profileStats.map(([label, value]) => (
            <div key={label} className="profileStatCard">
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <section className="profileEmotionCard widget">
          {profileHighlights.map(([label, value]) => (
            <div className="profileHighlightRow" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        <section className="profileRecentSection">
          <div className="sectionHeader">
            <h2>최근 게시물</h2>
            <button type="button" onClick={() => navigate('/app/write')}>
              + 새 게시물
            </button>
          </div>
          {posts.slice(0, 2).map((post) => (
            <FeedCard key={post.id} post={post} compact />
          ))}
        </section>
      </div>
    </DesktopShell>
  );
}

function SearchPage() {
  const desktop = useIsDesktop();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('posts');

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (activeTab === 'users') {
      return searchUsers.filter(([name, handle]) => `${name} ${handle}`.toLowerCase().includes(normalized));
    }
    if (activeTab === 'hashtags') {
      return topics.filter((topic) => topic.toLowerCase().includes(normalized));
    }
    return posts.filter((post) => `${post.author} ${post.text}`.toLowerCase().includes(normalized));
  }, [activeTab, query]);

  if (!desktop) {
    return (
      <MobileFrame title="검색" showSearch={false}>
        <label className="searchField">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="검색어를 입력하세요" />
        </label>
        <div className="tabs">
          <button type="button" className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>
            게시글
          </button>
          <button type="button" className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
            사용자
          </button>
          <button type="button" className={activeTab === 'hashtags' ? 'active' : ''} onClick={() => setActiveTab('hashtags')}>
            해시태그
          </button>
        </div>
        <section className="mobileContentStack">
          {results.map((item) => {
            if (Array.isArray(item)) {
              return (
                <article key={item[1]} className="listItem">
                  <strong>{item[0]}</strong>
                  <p>{item[1]}</p>
                </article>
              );
            }

            if (typeof item === 'string') {
              return (
                <article key={item} className="listItem">
                  <strong>#{item}</strong>
                  <p>인기 해시태그</p>
                </article>
              );
            }

            return (
              <article key={item.id} className="listItem">
                <strong>{item.author}</strong>
                <p>{item.text}</p>
              </article>
            );
          })}
        </section>
      </MobileFrame>
    );
  }

  return (
    <DesktopShell>
      <div className="feedColumn">
        <article className="searchPageCard">
          <label className="searchField">
            <Search size={20} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="게시글, 사용자, 해시태그 검색" />
          </label>
          <div className="tabs">
            <button type="button" className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>
              게시글
            </button>
            <button type="button" className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
              사용자
            </button>
            <button type="button" className={activeTab === 'hashtags' ? 'active' : ''} onClick={() => setActiveTab('hashtags')}>
              해시태그
            </button>
          </div>
          <div className="list">
            {results.map((item) => {
              if (Array.isArray(item)) {
                return (
                  <article key={item[1]} className="listItem">
                    <strong>{item[0]}</strong>
                    <p>{item[1]}</p>
                  </article>
                );
              }

              if (typeof item === 'string') {
                return (
                  <article key={item} className="listItem">
                    <strong>#{item}</strong>
                    <p>인기 해시태그</p>
                  </article>
                );
              }

              return (
                <article key={item.id} className="listItem">
                  <strong>{item.author}</strong>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </div>
        </article>
      </div>
    </DesktopShell>
  );
}

function CreatePostPage() {
  const desktop = useIsDesktop();

  const content = (
    <>
      <section className="writeContent">
        <p className="question">지금 어떤 기분인가요?</p>
        <div className="emotionRow">
          {['Happy', 'Calm', 'Excited', 'Sad', 'Anxious'].map((emotion, index) => (
            <button key={emotion} className={index === 0 ? 'active' : ''} type="button">
              {index === 0 ? '☺' : '○'}
              <span>{emotion}</span>
            </button>
          ))}
        </div>
        <label className="sliderLabel">
          감정 강도 <span>보통</span>
        </label>
        <input className="moodSlider" type="range" defaultValue="62" />
        <textarea placeholder="오늘의 감정과 생각을 적어보세요." maxLength="500" />
        <small>0/500</small>
        <div className="previewRow">
          <MoodVisual tone="sunset" />
          <MoodVisual tone="coffee" />
          <button className="addImage" type="button" aria-label="이미지 추가">
            <Plus size={28} />
          </button>
        </div>
        <div className="toggleLine">
          <b>전체 공개</b>
          <span />
        </div>
      </section>
      <button type="button" className="gradientButton bottomButton">
        게시하기
      </button>
    </>
  );

  if (!desktop) {
    return (
      <MobileFrame title="새 게시물 작성" showSearch={false}>
        {content}
      </MobileFrame>
    );
  }

  return (
    <DesktopShell>
      <div className="feedColumn">
        <article className="pageHero">
          <ImageIcon size={18} />
          <div>
            <strong>새 게시물 작성</strong>
            <p>감정, 사진, 분위기를 함께 담아 게시물을 만들 수 있습니다.</p>
          </div>
        </article>
        {content}
      </div>
    </DesktopShell>
  );
}

function ProfileSetupPage() {
  const [selected, setSelected] = useState(['감성']);
  const toggle = (chip) => {
    setSelected((prev) => {
      if (prev.includes(chip)) return prev.filter((item) => item !== chip);
      if (prev.length >= 3) return prev;
      return [...prev, chip];
    });
  };

  return (
    <MobileFrame title="프로필 설정" showSearch={false}>
      <section className="setupContent">
        <div className="photoUpload">
          <div className="portrait" />
          <button type="button" aria-label="프로필 사진 변경">
            <Camera size={16} />
          </button>
        </div>
        <label className="fieldLabel">닉네임</label>
        <div className="inputLine">
          Lena_Parks <b>수정</b>
        </div>
        <label className="fieldLabel">
          관심사 선택 <span>(최대 3개)</span>
        </label>
        <div className="chipGrid">
          {interestTags.map((chip) => (
            <button key={chip} onClick={() => toggle(chip)} className={selected.includes(chip) ? 'active' : ''} type="button">
              {chip}
            </button>
          ))}
        </div>
      </section>
      <button type="button" className="gradientButton bottomButton">
        완료
      </button>
    </MobileFrame>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useAuthState();

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/app/feed');
  };

  return (
    <div className="mobileStage">
      <main className="phoneFrame loginPhone">
        <section className="loginCenter">
          <Logo compact />
          <h1>MoodCast</h1>
          <p>감정을 기록하고, 저장하고, 공유하는 감성 SNS</p>
          <button className="gradientButton" type="button" onClick={handleLogin}>
            로그인
          </button>
          <button className="wideGhost" type="button" onClick={handleLogin}>
            비회원으로 시작
          </button>
          <div className="or">
            <span />
            또는
            <span />
          </div>
          <div className="socials">
            <button type="button">G</button>
            <button type="button" aria-label="애플 로그인">
              
            </button>
            <button className="kakao" type="button">
              K
            </button>
          </div>
        </section>
        <p className="loginFooter">
          계정이 없다면 <b>회원가입</b> 버튼으로 시작해 보세요.
        </p>
      </main>
    </div>
  );
}

function CommunityPage() {
  return (
    <DesktopShell>
      <div className="feedColumn">
        <div className="pageTitle">
          <h1>커뮤니티</h1>
          <div className="tabs">
            <button className="active" type="button">
              추천
            </button>
            <button type="button">새 커뮤니티</button>
            <button type="button">참여 중</button>
          </div>
        </div>
        <div className="communityGrid">
          {communities.map((community) => (
            <article className="communityCard" key={community.name}>
              <div className={`communityThumb communityThumb--${community.tone}`} />
              <div>
                <strong>{community.name}</strong>
                <p>{community.members}</p>
                <button type="button">가입하기</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </DesktopShell>
  );
}

function MobileCommunityPage() {
  return (
    <MobileFrame title="커뮤니티" showSearch={false}>
      <div className="mobileTabs">
        <button className="active" type="button">
          추천
        </button>
        <button type="button">새 커뮤니티</button>
        <button type="button">참여 중</button>
      </div>
      <section className="mobileCommunityList">
        {communities.map((community) => (
          <article key={community.name} className="mobileCommunityCard">
            <div className={`communityThumb communityThumb--${community.tone}`} />
            <div>
              <strong>{community.name}</strong>
              <p>{community.members}</p>
            </div>
            <button type="button">가입</button>
          </article>
        ))}
      </section>
    </MobileFrame>
  );
}

function AppRoutes() {
  const desktop = useIsDesktop();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/feed" replace />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/setup" element={<ProfileSetupPage />} />
      <Route path="/app/login" element={<LoginPage />} />
      <Route path="/app/profile-setup" element={<ProfileSetupPage />} />
      <Route path="/app/feed" element={desktop ? <HomeFeedPage /> : <Navigate to="/app/mobile-feed" replace />} />
      <Route path="/app/mobile-feed" element={<MobileFeedPage />} />
      <Route path="/app/community" element={desktop ? <CommunityPage /> : <MobileCommunityPage />} />
      <Route path="/app/write" element={<CreatePostPage />} />
      <Route path="/app/create" element={<CreatePostPage />} />
      <Route path="/app/saved" element={<SavedPage />} />
      <Route path="/app/mood-chat" element={<MoodChatPage />} />
      <Route path="/app/chat" element={<MoodChatPage />} />
      <Route path="/app/profile" element={desktop ? <ProfileDesktopPage /> : <ProfilePage />} />
      <Route path="/app/profile-mobile" element={<ProfilePage />} />
      <Route path="/app/settings" element={<SettingsPage />} />
      <Route path="/app/search" element={<SearchPage />} />
      <Route path="/app/mood" element={<Navigate to="/app/write" replace />} />
      <Route path="*" element={<Navigate to="/app/feed" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}

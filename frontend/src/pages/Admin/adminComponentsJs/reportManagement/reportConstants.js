import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import DoneOutlinedIcon from '@mui/icons-material/DoneOutlined';
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

/* ==========================================================================
 * 신고 및 제재 관리 상수
 * --------------------------------------------------------------------------
 * 화면에서 반복해서 사용하는 탭 이름, 상태 색상, 제재 옵션, 정지 기간을
 * 한 곳에 모아둔 파일입니다.
 * ========================================================================== */
export const reportStatusTabs = ['전체', '처리 대기', '검토 중', '처리 완료', '반려'];
export const reportTypeTabs = ['전체', '유저', '게시글', '댓글'];

export const statusMeta = {
  '처리 대기': { className: 'pending' },
  '검토 중': { className: 'reviewing' },
  '처리 완료': { className: 'resolved' },
  반려: { className: 'rejected' },
};

export const typeMeta = {
  전체: { icon: ReportGmailerrorredOutlinedIcon, count: 194 },
  유저: { icon: PersonOutlineOutlinedIcon, count: 45 },
  게시글: { icon: ArticleOutlinedIcon, count: 96 },
  댓글: { icon: ChatBubbleOutlineOutlinedIcon, count: 53 },
};

export const sanctionOptions = [
  {
    id: 'warning',
    label: '경고',
    tone: 'warning',
    icon: WarningAmberOutlinedIcon,
    description: '사용자에게 경고 메시지를 발송하고 주의를 줍니다.',
  },
  {
    id: 'temporary',
    label: '일시 정지',
    tone: 'temporary',
    icon: ScheduleOutlinedIcon,
    description: '계정 활동을 일정 기간 제한합니다.',
  },
  {
    id: 'permanent',
    label: '영구 정지',
    tone: 'permanent',
    icon: GppBadOutlinedIcon,
    description: '계정을 영구적으로 정지합니다.',
  },
  {
    id: 'reject',
    label: '반려',
    tone: 'reject',
    icon: DoneOutlinedIcon,
    description: '신고가 부적절하다고 판단되어 반려합니다.',
  },
];

export const reasonOptions = ['욕설/비하', '스팸/도배', '개인정보 노출', '저작권 침해', '혐오/차별/비하'];
export const suspensionPeriods = [
  { label: '1일', value: 1, description: '24시간 동안 계정 이용이 제한됩니다.' },
  { label: '3일', value: 3, description: '72시간 동안 계정 이용이 제한됩니다.' },
  { label: '7일', value: 7, description: '168시간 동안 계정 이용이 제한됩니다.' },
  { label: '30일', value: 30, description: '720시간 동안 계정 이용이 제한됩니다.' },
  { label: '직접 입력', value: 'custom', description: '원하는 기간을 직접 입력해주세요.' },
];

export const todayText = '2026.05.21 14:30';

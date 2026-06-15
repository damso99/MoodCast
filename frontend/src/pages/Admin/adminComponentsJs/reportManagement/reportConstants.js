import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import DoneOutlinedIcon from "@mui/icons-material/DoneOutlined";
import GppBadOutlinedIcon from "@mui/icons-material/GppBadOutlined";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

export const REPORT_LABELS = {
  all: "전체",
  pending: "처리 대기",
  reviewing: "검토 중",
  done: "처리 완료",
  post: "게시글",
  comment: "댓글",
  warning: "경고",
  temporary: "일시정지",
  permanent: "영구정지",
  reject: "반려",
  spam: "스팸 또는 광고",
  insult: "욕설 또는 비방",
  sexual: "음란물 또는 성적 콘텐츠",
  fraud: "사기 또는 거짓 정보",
  selfHarm: "자해 또는 자살 관련 콘텐츠",
  copyright: "지적 재산권 침해",
  etc: "기타",
};

export const reportStatusTabs = [
  REPORT_LABELS.all,
  REPORT_LABELS.pending,
  REPORT_LABELS.reviewing,
  REPORT_LABELS.done,
];

export const reportTypeTabs = [
  REPORT_LABELS.all,
  REPORT_LABELS.post,
  REPORT_LABELS.comment,
];

export const processResultTabs = [
  REPORT_LABELS.all,
  REPORT_LABELS.warning,
  REPORT_LABELS.temporary,
  REPORT_LABELS.permanent,
  REPORT_LABELS.reject,
];

export const statusMeta = {
  [REPORT_LABELS.pending]: { className: "pending" },
  [REPORT_LABELS.reviewing]: { className: "reviewing" },
  [REPORT_LABELS.done]: { className: "resolved" },
};

export const typeMeta = {
  [REPORT_LABELS.all]: { icon: ReportGmailerrorredOutlinedIcon, count: 0 },
  [REPORT_LABELS.post]: { icon: ArticleOutlinedIcon, count: 0 },
  [REPORT_LABELS.comment]: { icon: ChatBubbleOutlineOutlinedIcon, count: 0 },
};

export const sanctionOptions = [
  {
    id: "warning",
    label: REPORT_LABELS.warning,
    tone: "warning",
    icon: WarningAmberOutlinedIcon,
    description: "계정에 경고를 기록합니다.",
  },
  {
    id: "temporary",
    label: REPORT_LABELS.temporary,
    tone: "temporary",
    icon: ScheduleOutlinedIcon,
    description: "계정 활동을 일정 기간 제한합니다.",
  },
  {
    id: "permanent",
    label: REPORT_LABELS.permanent,
    tone: "permanent",
    icon: GppBadOutlinedIcon,
    description: "계정 이용을 영구적으로 제한합니다.",
  },
  {
    id: "reject",
    label: REPORT_LABELS.reject,
    tone: "reject",
    icon: DoneOutlinedIcon,
    description: "신고가 부적절하다고 판단하여 반려합니다.",
  },
];

export const reasonOptions = [
  REPORT_LABELS.spam,
  REPORT_LABELS.insult,
  REPORT_LABELS.sexual,
  REPORT_LABELS.fraud,
  REPORT_LABELS.selfHarm,
  REPORT_LABELS.copyright,
  REPORT_LABELS.etc,
];

export const suspensionPeriods = [
  {
    label: "1일",
    value: 1,
    description: "24시간 동안 계정 이용을 제한합니다.",
  },
  {
    label: "3일",
    value: 3,
    description: "72시간 동안 계정 이용을 제한합니다.",
  },
  {
    label: "7일",
    value: 7,
    description: "168시간 동안 계정 이용을 제한합니다.",
  },
  {
    label: "30일",
    value: 30,
    description: "720시간 동안 계정 이용을 제한합니다.",
  },
  {
    label: "직접 입력",
    value: "custom",
    description: "원하는 기간을 직접 입력합니다.",
  },
];

export const todayText = "2026.05.21 14:30";

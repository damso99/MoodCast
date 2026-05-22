import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { DrawerHeader } from "./ReportDrawerHeader";
import styles from "../../adminComponentsCss/reportManagement/ReportManagementPage.module.css";

export function ReportDetailStep({ report, onClose, onProcess }) {
  return (
    <>
      <DrawerHeader title={report.title} onClose={onClose} />

      <div className={styles.drawerBody}>
        {/* 신고 개요 ---------------------------------- */}
        <section className={styles.detailSection}>
          <h3>신고 개요</h3>
          <div className={styles.overviewCard}>
            <div className={styles.profileThumb}>
              <PersonOutlineOutlinedIcon />
            </div>
            <dl>
              <div>
                <dt>신고 대상</dt>
                <dd>
                  <strong>{report.targetName}</strong>
                  <span>{report.targetHandle}</span>
                </dd>
              </div>
              <div>
                <dt>신고 수</dt>
                <dd>{report.reportCount}건</dd>
              </div>
              <div>
                <dt>최초 신고</dt>
                <dd>{report.firstReportedAt}</dd>
              </div>
              <div>
                <dt>최근 신고</dt>
                <dd>{report.latestReportedAt}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* 신고 사유 ---------------------------------- */}
        <section className={styles.detailSection}>
          <h3>신고 사유</h3>
          <strong className={styles.reasonText}>{report.reason}</strong>
          <p>{report.detail}</p>
        </section>

        {/* 신고자 목록 ---------------------------------- */}
        <section className={styles.detailSection}>
          <div className={styles.sectionHead}>
            <h3>신고자 ({report.reportCount})</h3>
            <button type="button">전체 보기</button>
          </div>
          <div className={styles.reporterList}>
            {report.reporters.map((reporter, index) => (
              <div key={reporter}>
                <span>{index + 1}</span>
                <strong>{reporter}</strong>
                <small>{index + 2}시간 전</small>
              </div>
            ))}
          </div>
        </section>

        {/* 대상 사용자 정보 ---------------------------------- */}
        <section className={styles.detailSection}>
          <h3>대상 사용자 정보</h3>
          <div className={styles.userInfoCard}>
            <div>
              <strong>{report.targetName}</strong>
              <span>{report.targetHandle}</span>
            </div>
            <dl>
              <div>
                <dt>가입일</dt>
                <dd>{report.joinedAt}</dd>
              </div>
              <div>
                <dt>게시글</dt>
                <dd>{report.postCount}</dd>
              </div>
              <div>
                <dt>댓글</dt>
                <dd>{report.commentCount}</dd>
              </div>
              <div>
                <dt>좋아요</dt>
                <dd>{report.likeCount}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* 최근 활동 ---------------------------------- */}
        <section className={styles.detailSection}>
          <h3>최근 활동</h3>
          <ul className={styles.activityList}>
            {report.activities.map((activity) => (
              <li key={`${activity.type}-${activity.time}`}>
                <strong>{activity.type}</strong>
                <span>{activity.text}</span>
                <time>{activity.time}</time>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className={styles.drawerFooter}>
        {/* 상세 단계 하단 버튼 ---------------------------------- */}
        <button className={styles.secondaryButton} type="button">
          전체 활동 보기
        </button>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={onProcess}
        >
          신고 검토 및 처리
        </button>
      </footer>
    </>
  );
}

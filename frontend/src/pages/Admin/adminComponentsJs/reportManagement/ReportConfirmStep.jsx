import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import { todayText } from './reportConstants';
import { DrawerHeader } from './ReportDrawerHeader';
import styles from '../../adminComponentsCss/reportManagement/ReportManagementPage.module.css';

export function ReportConfirmStep({
  report,
  actionMeta,
  selectedReason,
  reasonDetail,
  selectedPeriod,
  customPeriod,
  releaseDate,
  onBack,
  onClose,
  onConfirm,
}) {
  const periodLabel = selectedPeriod === 'custom' ? `${customPeriod || 0}일` : `${selectedPeriod}일`; // 최종 확인 화면에 보여줄 정지 기간입니다.
  const isTemporary = actionMeta?.id === 'temporary'; // 일시 정지인지 판단합니다.
  const isReject = actionMeta?.id === 'reject'; // 반려인지 판단합니다.

  return (
    <>
      <DrawerHeader title="제재 내용 확인" onBack={onBack} onClose={onClose} />

      <div className={styles.drawerBody}>
        <p className={styles.guideText}>아래 내용을 확인하고 제재를 최종 확정해주세요.</p>

        {/* 신고 대상 확인 ---------------------------------- */}
        <section className={styles.confirmTarget}>
          <div className={styles.profileThumb}>
            <PersonOutlineOutlinedIcon />
          </div>
          <div>
            <strong>{report.targetName}</strong>
            <span>{report.targetHandle}</span>
          </div>
          <dl>
            <div>
              <dt>신고 수</dt>
              <dd>{report.reportCount}건</dd>
            </div>
            <div>
              <dt>가입일</dt>
              <dd>{report.joinedAt}</dd>
            </div>
          </dl>
        </section>

        {/* 제재 사유 확인 ---------------------------------- */}
        <section className={styles.confirmTable}>
          <h3>제재 사유</h3>
          <dl>
            <div>
              <dt>{isReject ? '처리 유형' : '제재 사유'}</dt>
              <dd>{isReject ? '반려' : selectedReason}</dd>
            </div>
            <div>
              <dt>상세 설명</dt>
              <dd>{isReject ? '신고가 부적절하다고 판단되어 반려합니다.' : reasonDetail || report.detail}</dd>
            </div>
          </dl>
        </section>

        {/* 제재 내용 확인 ---------------------------------- */}
        <section className={styles.confirmTable}>
          <h3>제재 내용</h3>
          <dl>
            <div>
              <dt>{isReject ? '처리 유형' : '제재 유형'}</dt>
              <dd>{actionMeta?.label}</dd>
            </div>
            {isTemporary && (
              <>
                <div>
                  <dt>정지 기간</dt>
                  <dd>{periodLabel}</dd>
                </div>
                <div>
                  <dt>시작 시간</dt>
                  <dd>{todayText}</dd>
                </div>
                <div>
                  <dt>예상 해제 시간</dt>
                  <dd>{releaseDate}</dd>
                </div>
                <div>
                  <dt>적용 범위</dt>
                  <dd>로그인 및 서비스 이용 제한</dd>
                </div>
              </>
            )}
            {!isTemporary && (
              <div>
                <dt>처리 내용</dt>
                <dd>
                  {actionMeta?.id === 'warning' && '사용자에게 경고 메시지를 발송합니다.'}
                  {actionMeta?.id === 'permanent' && '해당 사용자의 계정을 영구 정지합니다.'}
                  {actionMeta?.id === 'reject' && '신고가 부적절하다고 판단되어 반려합니다.'}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* 최종 확인 안내 ---------------------------------- */}
        <section className={styles.warningBox}>
          <ErrorOutlineOutlinedIcon />
          <div>
            <strong>{actionMeta?.label} 처리를 적용하면?</strong>
            <p>제재를 확정하면 되돌릴 수 없으므로 신중하게 결정해주세요.</p>
          </div>
        </section>

        {!isReject && (
          <section className={styles.checkSection}>
            {/* 알림 옵션 ---------------------------------- */}
            <h3>추가 옵션</h3>
            <label>
              <input type="checkbox" defaultChecked />
              신고자에게 결과 알림
            </label>
            <label>
              <input type="checkbox" defaultChecked />
              사용자에게 결과 알림
            </label>
          </section>
        )}
      </div>

      <footer className={styles.drawerFooter}>
        <button className={styles.secondaryButton} type="button" onClick={onBack}>
          취소
        </button>
        <button className={styles.primaryButton} type="button" onClick={onConfirm}>
          제재 확정
        </button>
      </footer>
    </>
  );
}

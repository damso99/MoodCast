import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import GppMaybeOutlinedIcon from '@mui/icons-material/GppMaybeOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { AdminLayout } from '../common/AdminLayout';
import { EmptyState } from '../common/EmptyState';
import { EmptyTableRow, TableShell } from '../common/TableShell';
import { MetricCard } from '../common/MetricCard';
import { SearchBar } from '../common/SearchBar';
import { SegmentedControl } from '../common/SegmentedControl';
import styles from '../../adminComponentsCss/userManagement/UserManagementPage.module.css';

/* ==========================================================================
 * 사용자 관리 페이지
 * --------------------------------------------------------------------------
 * 일반 회원, 정지 회원, 관리자 회원의 계정 권한을 관리하는 화면입니다.
 *
 * 담당 기능:
 * - 회원 상태별 필터 버튼
 * - 이름/아이디 검색창
 * - 회원 상태 요약 카드
 * - 사용자 목록 테이블
 * - 관리자 추가 페이지로 이동하는 버튼
 * - 권한 변경 로그 영역
 *
 * selectedUserType 상태 설명:
 * - 사용자가 "전체 / 일반 회원 / 정지 회원 / 관리자 회원" 탭을 누르면
 *   어떤 탭이 선택됐는지 기억하는 값입니다.
 * - 지금은 백엔드 데이터가 없어서 실제 목록 필터링은 하지 않고,
 *   선택한 탭에 맞는 제목과 안내 문구만 바꿔서 UI 동작을 확인할 수 있게 했습니다.
 * ========================================================================== */
export function UserManagementPage() {
  const [selectedUserType, setSelectedUserType] = useState('전체');

  const userTypeDescriptions = {
    전체: '전체 회원 목록이 이 영역에 표시됩니다.',
    '일반 회원': '정상 이용 중인 일반 회원 목록이 이 영역에 표시됩니다.',
    '정지 회원': '일시정지 또는 이용 제한 상태의 회원 목록이 이 영역에 표시됩니다.',
    '관리자 회원': '관리자 권한을 가진 계정 목록이 이 영역에 표시됩니다.',
  };

  return (
    <AdminLayout title="사용자 관리" description="회원 정보를 확인하고 계정 권한을 관리하세요.">
      <section className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <SegmentedControl
            labels={['전체', '일반 회원', '정지 회원', '관리자 회원']}
            selectedLabel={selectedUserType}
            onSelect={setSelectedUserType}
          />
          <SearchBar placeholder="이름, 아이디 검색" />
        </div>
        <NavLink className={styles.primaryLinkButton} to="/admin/users/new">
          관리자 추가
        </NavLink>
      </section>

      <section className={styles.metricGrid}>
        <MetricCard label="전체 회원" icon={<GroupOutlinedIcon />} />
        <MetricCard label="일반 회원" icon={<AccountCircleOutlinedIcon />} accent="blue" />
        <MetricCard label="정지 회원" icon={<GppMaybeOutlinedIcon />} accent="orange" />
        <MetricCard label="관리자 회원" icon={<DashboardOutlinedIcon />} accent="pink" />
      </section>

      <TableShell title={`${selectedUserType} 목록`} columns={['사용자', '상태', '가입일', '권한', '작업']}>
        <EmptyTableRow colSpan={5} label={`${selectedUserType} 데이터 없음`} />
      </TableShell>

      <section className={styles.infoGrid}>
        <article className={styles.infoBox}>
          <strong>{selectedUserType} 탭 역할</strong>
          <p>{userTypeDescriptions[selectedUserType]}</p>
        </article>
        <article className={styles.infoBox}>
          <strong>관리자 추가 정보</strong>
          <p>관리자 추가 버튼을 누르면 가입된 회원을 이메일 또는 이름으로 검색한 뒤 관리자 권한으로 승급하는 화면으로 이동합니다.</p>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>권한 변경 로그</h2>
        </div>
        <EmptyState title="변경 내역 없음" description="권한 변경 이력이 생기면 최신순으로 표시됩니다." />
      </section>
    </AdminLayout>
  );
}

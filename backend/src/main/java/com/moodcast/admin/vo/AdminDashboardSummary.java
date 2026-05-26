package com.moodcast.admin.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/* ==========================================================================
 * 관리자 대시보드 요약 VO
 * --------------------------------------------------------------------------
 * 관리자 대시보드 상단 카드에 표시할 숫자를 담는 객체입니다.
 *
 * 현재 포함하는 값:
 * - totalMemberCount: 전체 회원 수
 * - todayNewMemberCount: 오늘 가입한 신규 가입자 수
 * - postCount: 삭제되지 않은 게시글 수
 *
 * 실시간 반영 방식:
 * - 백엔드가 값을 계속 밀어주는 WebSocket 방식은 아직 사용하지 않습니다.
 * - 프론트에서 일정 시간마다 이 데이터를 다시 조회하는 Polling 방식으로 갱신합니다.
 * ========================================================================== */
@NoArgsConstructor
@AllArgsConstructor
@Data
public class AdminDashboardSummary {
    private Long totalMemberCount;
    private Long todayNewMemberCount;
    private Long postCount;
}

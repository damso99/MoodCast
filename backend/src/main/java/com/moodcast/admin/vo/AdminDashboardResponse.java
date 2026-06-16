package com.moodcast.admin.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/*
 * 관리자 메인 대시보드 통합 응답 객체입니다.
 * 기존 개별 API 응답 형태는 유지하고, 메인 대시보드 첫 화면에 필요한 데이터만
 * 한 번에 묶어 내려 프론트의 반복 호출 수를 줄입니다.
 */
@NoArgsConstructor
@AllArgsConstructor
@Data
public class AdminDashboardResponse {
    private AdminDashboardSummary summary;
    private List<AdminEmotionActivity> emotionActivity;
    private List<AdminActiveUserStat> activeUsers;
    private List<AdminRecentActivity> recentActivities;
}

package com.moodcast.admin.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/*
 * 통계 대시보드 통합 응답 VO입니다.
 * --------------------------------------------------------------------------
 * 프론트가 기존에 5개 API로 나누어 받던 통계 데이터를 한 번에 내려줍니다.
 *
 * 초보자 설명:
 * - summary: 상단 숫자 카드와 하단 요약에 표시할 집계입니다.
 * - subscriberTrend: 가입자 추이 차트 데이터입니다.
 * - activeUserTrend: 활성 사용자 추이 차트 데이터입니다.
 * - contentActivity: 게시글/댓글/공감 활동 데이터입니다.
 * - emotionActivity: 감정별 활동 분포 데이터입니다.
 */
@NoArgsConstructor
@AllArgsConstructor
@Data
public class AdminStatisticsDashboardResponse {

    private AdminStatisticsSummary summary;

    private List<AdminStatisticsTrend> subscriberTrend;

    private List<AdminActiveUserStat> activeUserTrend;

    private List<AdminStatisticsTrend> contentActivity;

    private List<AdminEmotionActivity> emotionActivity;
}

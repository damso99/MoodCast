package com.moodcast.admin.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/* ==========================================================================
 * 공지사항 VO
 * --------------------------------------------------------------------------
 * DB의 notices_tbl 테이블 한 행을 Java 객체로 표현하는 클래스입니다.
 *
 * notices_tbl 테이블 목적:
 * - 관리자 페이지에서 작성한 공지사항을 저장합니다.
 * - 일반 공지, 업데이트 공지, 긴급 공지를 구분해서 관리합니다.
 *
 * soft delete 정책:
 * - 공지사항은 바로 DB에서 삭제하지 않습니다.
 * - 삭제 처리하면 deleted_at에 삭제 시간이 들어갑니다.
 * - deleted_at이 null이면 정상 공지입니다.
 * - deleted_at에 값이 있으면 삭제된 공지입니다.
 *
 * Java 필드명 규칙:
 * - DB 컬럼은 snake_case입니다. 예: created_by_admin_id
 * - Java 필드는 camelCase입니다. 예: createdByAdminId
 * - MyBatis mapper에서 두 이름을 연결해서 사용합니다.
 * ========================================================================== */
@NoArgsConstructor // 파라미터 없는 기본 생성자를 Lombok이 자동으로 만들어줍니다.
@AllArgsConstructor // 모든 필드를 받는 생성자를 Lombok이 자동으로 만들어줍니다.
@Data // getter, setter, toString 등을 Lombok이 자동으로 만들어줍니다.
public class Notice {

    private Long noticeId; // notices_tbl.notice_id: 공지사항의 PK입니다.

    private String title; // notices_tbl.title: 공지사항 제목입니다.

    private String content; // notices_tbl.content: 공지사항 본문 내용입니다.

    private String noticeType; // notices_tbl.notice_type: NORMAL, UPDATE, EMERGENCY 같은 공지 분류입니다.

    private Long createdByAdminId; // notices_tbl.created_by_admin_id: 공지사항을 작성한 관리자 member_id입니다.

    private Long updatedByAdminId; // notices_tbl.updated_by_admin_id: 공지사항을 마지막으로 수정한 관리자 member_id입니다.

    private LocalDateTime createdAt; // notices_tbl.created_at: 공지사항 최초 작성 시간입니다.

    private LocalDateTime updatedAt; // notices_tbl.updated_at: 공지사항 마지막 수정 시간입니다.

    private LocalDateTime deletedAt; // notices_tbl.deleted_at: soft delete 처리 시간입니다. null이면 삭제되지 않은 공지입니다.
}

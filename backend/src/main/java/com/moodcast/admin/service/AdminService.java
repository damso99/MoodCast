package com.moodcast.admin.service;

import com.moodcast.admin.dao.AdminDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/* ==========================================================================
 * 관리자 페이지 공통 서비스
 * --------------------------------------------------------------------------
 * 컨트롤러가 받은 요청을 실제로 처리하는 비즈니스 로직 계층입니다.
 *
 * 서비스 역할:
 * - 컨트롤러가 직접 DB 작업을 하지 않도록 중간에서 로직을 담당합니다.
 * - 필요한 경우 DAO를 통해 DB 데이터를 조회하거나 수정합니다.
 * - 관리자 권한 검사, 데이터 가공, 처리 규칙을 이 위치에 작성할 예정입니다.
 *
 * 현재 단계:
 * - 관리자 백엔드 구조를 잡기 위한 기본 서비스만 준비합니다.
 * - 아직 실제 DB 조회 로직은 작성하지 않습니다.
 * ========================================================================== */
@Service // Spring이 이 클래스를 서비스 객체로 등록하게 합니다.
public class AdminService {

    @Autowired // 나중에 DB 조회가 필요할 때 사용할 DAO를 연결합니다.
    private AdminDao adminDao;
}

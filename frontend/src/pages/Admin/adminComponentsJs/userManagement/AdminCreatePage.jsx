import { useState } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import { AdminLayout } from "../common/AdminLayout";
import { EmptyState } from "../common/EmptyState";
import { EmptyTableRow, TableShell } from "../common/TableShell";
import { useAuthStore } from "../../../../stores/useAuthStore";
import { formatKoreanDate } from "../../../../shared/lib/dateTime";
import styles from "../../adminComponentsCss/userManagement/AdminCreatePage.module.css";

/* ==========================================================================
 * 관리자 추가 페이지
 * --------------------------------------------------------------------------
 * 새 관리자 계정을 직접 생성하는 화면이 아니라,
 * 이미 회원가입을 완료한 일반 회원을 관리자 권한으로 승급시키는 화면입니다.
 *
 * 담당 기능:
 * - 이름, 닉네임, 이메일 기준으로 회원 검색
 * - ACTIVE 상태이면서 일반 회원인 대상만 검색 결과로 표시
 * - 검색 결과에서 승급 대상 회원 선택
 * - 일반 관리자 / 슈퍼 관리자 중 하나를 선택해 등급 변경
 *
 * searchType 상태 설명:
 * - 검색 기준을 기억합니다.
 * - name: members.name 기준 검색
 * - nickname: members.nickname 기준 검색
 * - email: members.email 기준 검색
 *
 * searchKeyword 상태 설명:
 * - 검색창에 입력한 실제 검색어입니다.
 * - 검색 버튼을 누르면 백엔드 API에 전달됩니다.
 *
 * selectedMemberId 상태 설명:
 * - 검색 결과 중 어떤 회원을 관리자 승급 대상으로 선택했는지 기억합니다.
 *
 * selectedRole 상태 설명:
 * - 선택한 회원에게 부여할 관리자 등급입니다.
 * - NORMAL_ADMIN 또는 SUPER_ADMIN 값이 백엔드로 전달됩니다.
 * ========================================================================== */
export function AdminCreatePage() {
  const [searchType, setSearchType] = useState("name"); // 현재 선택된 검색 기준입니다.
  const [searchKeyword, setSearchKeyword] = useState(""); // 사용자가 입력한 검색어입니다.
  const [searched, setSearched] = useState(false); // 검색 버튼을 한 번이라도 눌렀는지 확인합니다.
  const [searchLoading, setSearchLoading] = useState(false); // 검색 요청 진행 여부입니다.
  const [promoteLoading, setPromoteLoading] = useState(false); // 관리자 등급 변경 요청 진행 여부입니다.
  const [searchError, setSearchError] = useState(""); // 검색 또는 승급 실패 메시지입니다.
  const [successMessage, setSuccessMessage] = useState(""); // 승급 성공 메시지입니다.
  const [members, setMembers] = useState([]); // 검색 결과 회원 목록입니다.
  const [selectedMemberId, setSelectedMemberId] = useState(null); // 선택된 회원의 memberId입니다.
  const [selectedRole, setSelectedRole] = useState("NORMAL_ADMIN"); // 선택된 관리자 등급입니다.
  const { accessToken } = useAuthStore(); // 관리자 API 호출에 필요한 JWT 토큰입니다.

  const BACKSERVER = import.meta.env.VITE_BACKSERVER || "http://localhost:8080"; // 백엔드 서버 주소입니다.

  const roleDescription =
    selectedRole === "SUPER_ADMIN"
      ? "슈퍼 관리자는 관리자 추가, 관리자 삭제 기능까지 사용할 수 있습니다."
      : "일반 관리자는 관리자 추가와 삭제를 제외한 관리자 기능을 사용할 수 있습니다.";

  const searchPlaceholder = {
    name: "회원 이름",
    nickname: "회원 닉네임",
    email: "member@moodcast.com",
  };

  const getRoleLabel = (role) => {
    if (role === "SUPER_ADMIN") {
      return "슈퍼 관리자";
    }

    if (role === "ADMIN" || role === "NORMAL_ADMIN") {
      return "일반 관리자";
    }

    if (role === "USER" || role === "MEMBER") {
      return "일반 회원";
    }

    return role || "-";
  };

  const formatDate = (value) => {
    return formatKoreanDate(value);
  };

  const getSelectedMemberName = () => {
    const selectedMember = members.find(
      (member) => member.memberId === selectedMemberId
    );

    return selectedMember?.name || "선택한 회원";
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault(); // form 제출 시 화면이 새로고침되는 기본 동작을 막습니다.

    const trimmedKeyword = searchKeyword.trim(); // 검색어 앞뒤 공백을 제거합니다.

    if (!trimmedKeyword) {
      setSearched(true);
      setMembers([]);
      setSelectedMemberId(null);
      setSuccessMessage("");
      setSearchError("검색어를 입력해주세요.");
      return;
    }

    if (!accessToken) {
      setSearched(true);
      setMembers([]);
      setSelectedMemberId(null);
      setSuccessMessage("");
      setSearchError("로그인 정보가 없어 회원을 검색할 수 없습니다.");
      return;
    }

    setSearched(true);
    setSearchLoading(true);
    setSearchError("");
    setSuccessMessage("");
    setSelectedMemberId(null);

    axios
      .get(`${BACKSERVER}/admin/api/members/search`, {
        headers: {
          Authorization: `Bearer ${accessToken}`, // 백엔드에서 관리자 권한을 확인할 수 있도록 보냅니다.
        },
        params: {
          searchType, // name, nickname, email 중 현재 선택한 검색 기준입니다.
          keyword: trimmedKeyword, // 사용자가 입력한 검색어입니다.
        },
      })
      .then((res) => {
        const nextMembers = Array.isArray(res.data?.members)
          ? res.data.members
          : [];

        setMembers(nextMembers);
      })
      .catch((error) => {
        console.log(error);
        setMembers([]);
        setSearchError("회원 검색 중 문제가 발생했습니다.");
      })
      .finally(() => {
        setSearchLoading(false);
      });
  };

  const handlePromoteMember = () => {
    if (!selectedMemberId) {
      setSearchError("관리자로 승급할 회원을 먼저 선택해주세요.");
      return;
    }

    if (!accessToken) {
      setSearchError("로그인 정보가 없어 관리자 등급을 변경할 수 없습니다.");
      return;
    }

    setPromoteLoading(true);
    setSearchError("");
    setSuccessMessage("");

    axios
      .put(
        `${BACKSERVER}/admin/api/members/${selectedMemberId}/role`,
        {
          role: selectedRole, // NORMAL_ADMIN 또는 SUPER_ADMIN 값입니다.
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then(() => {
        const selectedName = getSelectedMemberName();

        setSuccessMessage(`${selectedName} 회원의 관리자 등급이 변경되었습니다.`);
        setMembers((prevMembers) =>
          prevMembers.filter((member) => member.memberId !== selectedMemberId)
        );
        setSelectedMemberId(null);
        setSelectedRole("NORMAL_ADMIN");
      })
      .catch((error) => {
        console.log(error);
        setSearchError("관리자 등급 변경 중 문제가 발생했습니다.");
      })
      .finally(() => {
        setPromoteLoading(false);
      });
  };

  return (
    <AdminLayout
      title="관리자 추가"
      description="가입된 회원을 검색한 뒤 관리자 권한으로 승급하세요."
    >
      <section className={`${styles.panel} ${styles.formPanel}`}>
        <div className={styles.panelHead}>
          <h2>회원 검색</h2>
          <NavLink className={styles.secondaryLinkButton} to="/admin/users">
            사용자 관리로 돌아가기
          </NavLink>
        </div>

        <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
          <label>
            검색 기준
            <select
              value={searchType}
              onChange={(event) => {
                setSearchType(event.target.value); // 선택한 검색 기준을 저장합니다.
                setSearchKeyword(""); // 기준이 바뀌면 이전 검색어를 비웁니다.
                setSearchError(""); // 이전 오류 메시지도 지웁니다.
                setSuccessMessage(""); // 이전 성공 메시지도 지웁니다.
              }}
            >
              <option value="name">이름</option>
              <option value="nickname">닉네임</option>
              <option value="email">이메일</option>
            </select>
          </label>

          <label>
            검색어
            <input
              type={searchType === "email" ? "email" : "text"}
              inputMode={searchType === "email" ? "email" : "text"}
              lang={searchType === "email" ? "en" : "ko"}
              autoCapitalize="none"
              spellCheck={false}
              placeholder={searchPlaceholder[searchType]}
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </label>

          <button type="submit" disabled={searchLoading}>
            {searchLoading ? "검색 중" : "회원 검색"}
          </button>
        </form>

        {searchError && <p className={styles.errorText}>{searchError}</p>}
        {successMessage && <p className={styles.successText}>{successMessage}</p>}

        {!searched && (
          <EmptyState
            title="검색 전"
            description="이름, 닉네임, 이메일로 ACTIVE 상태의 일반 회원을 검색할 수 있습니다."
          />
        )}
      </section>

      <TableShell
        title="승급 대상 선택"
        columns={["회원", "이메일", "현재 권한", "가입일", "선택"]}
      >
        {searched && !searchLoading && members.length === 0 && (
          <EmptyTableRow colSpan={5} label="검색된 회원 데이터 없음" />
        )}

        {searchLoading && <EmptyTableRow colSpan={5} label="회원 검색 중" />}

        {members.map((member) => (
          <tr key={member.memberId}>
            <td>
              <strong>{member.name || "-"}</strong>
              <span className={styles.memberNickname}>
                {member.nickname ? `@${member.nickname}` : "닉네임 없음"}
              </span>
            </td>
            <td>{member.email || "-"}</td>
            <td>{getRoleLabel(member.role)}</td>
            <td>{formatDate(member.createdAt)}</td>
            <td>
              <label className={styles.selectMemberLabel}>
                <input
                  type="radio"
                  name="selectedMember"
                  checked={selectedMemberId === member.memberId}
                  onChange={() => setSelectedMemberId(member.memberId)}
                />
                선택
              </label>
            </td>
          </tr>
        ))}
      </TableShell>

      <section className={`${styles.panel} ${styles.formPanel}`}>
        <div className={styles.panelHead}>
          <h2>관리자 등급 설정</h2>
        </div>

        <form className={styles.adminForm}>
          <fieldset>
            <legend>관리자 등급</legend>
            <label>
              <input
                type="radio"
                name="adminRole"
                checked={selectedRole === "NORMAL_ADMIN"}
                onChange={() => setSelectedRole("NORMAL_ADMIN")}
              />
              일반 관리자
            </label>
            <label>
              <input
                type="radio"
                name="adminRole"
                checked={selectedRole === "SUPER_ADMIN"}
                onChange={() => setSelectedRole("SUPER_ADMIN")}
              />
              슈퍼 관리자
            </label>
          </fieldset>

          <div className={styles.roleGuide}>
            <strong>
              {selectedRole === "SUPER_ADMIN"
                ? "슈퍼 관리자 권한"
                : "일반 관리자 권한"}
            </strong>
            <p>{roleDescription}</p>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => {
                setSelectedMemberId(null);
                setSelectedRole("NORMAL_ADMIN");
                setSearchError("");
                setSuccessMessage("");
              }}
            >
              선택 초기화
            </button>
            <button
              type="button"
              disabled={!selectedMemberId || promoteLoading}
              onClick={handlePromoteMember}
            >
              {promoteLoading ? "변경 중" : "관리자 등급 변경"}
            </button>
          </div>
        </form>
      </section>
    </AdminLayout>
  );
}

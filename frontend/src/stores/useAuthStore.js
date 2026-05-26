import { create } from "zustand";

const ACCESS_TOKEN_KEY = "moodcast-access-token";
const MEMBER_KEY = "moodcast-member";

// 새로고침 후 accessToken 복구 함수
const readAccessToken = () => {
    return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
};

// 새로고침 후 member 복구 함수
const readMember = () => {
    const memberText = window.sessionStorage.getItem(MEMBER_KEY);

    if (!memberText) {
        return null;
    }

    try {
        return JSON.parse(memberText);
    } catch (e) {
        return null;
    }
};

export const useAuthStore = create((set) => ({
    // 초기 상태 세팅
    accessToken: readAccessToken(), 
    member: readMember(),
    isLoggedIn: Boolean(readAccessToken()), // 토큰 존재여부

    // 로그인 성공 시
    setAuthData: (accessToken, member) => {
        // sessionStorage에 보관
        window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        window.sessionStorage.setItem(MEMBER_KEY, JSON.stringify(member)); // json 객체 보관 불가 

        // 상태 업데이트
        set({
            accessToken: accessToken,
            member: member,
            isLoggedIn: true,
        });
    },

    // 로그아웃 
    clearAuthData: () => { 
        // sessionStorage에 보관한 엑세스 토큰, 회원 삭제
        window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        window.sessionStorage.removeItem(MEMBER_KEY); 

        // 상태 업데이트
        set({ 
        accessToken: null,
        member: null, 
        isLoggedIn: false, 
        }); 
    },
}));

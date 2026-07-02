/* ============================================================
   common.js
   모든 페이지가 공유하는 공통 스크립트
   - apiFetch: 서버 요청 유틸 (Authorization 자동 첨부)
   - 공통 헤더(로고 + 프로필 드롭다운) 주입 및 동작
   ============================================================ */

const API_BASE_URL = "http://localhost:8080/";

const apiFetch = (path, options = {}) => {
    const userUuid = localStorage.getItem("userUuid");

    return fetch(API_BASE_URL + path, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: userUuid,
        },
    });
};

/* ------------------------------------------------------------
   공통 헤더
   - 각 페이지는 <div id="app-header"></div> 자리만 두고,
     이 스크립트가 그 안에 헤더를 그려 넣는다.
   - 뒤로가기 버튼이 필요한 페이지는 자리에 data-back="true" 를 준다:
       <div id="app-header" data-back="true"></div>  → 뒤로가기 있음(상세·작성·수정)
       <div id="app-header"></div>                    → 뒤로가기 없음(목록·마이페이지)
   - 헤더 안의 링크는 루트 기준 절대경로(/features/...)로 통일해
     어느 폴더 깊이의 페이지에서 불러도 깨지지 않게 한다.
   ------------------------------------------------------------ */

const buildHeaderHtml = (showBack) => {
    const backHtml = showBack
        ? `<button type="button" class="app-header__back" id="backButton" aria-label="뒤로가기">&lt;</button>`
        : "";

    return `
        <header class="articles-header">
            <div class="articles-header__inner">
                ${backHtml}
                <a class="articles-header__logo" href="/features/articles/articles.html">아무 말 대잔치</a>

                <div class="profile-menu" id="profileMenu">
                    <button
                        type="button"
                        class="articles-header__profile"
                        id="profileMenuButton"
                        aria-haspopup="true"
                        aria-expanded="false"
                        aria-label="프로필 메뉴"
                    >
                        <span class="articles-header__profile-image" role="img" aria-label="내 프로필"></span>
                    </button>

                    <ul class="profile-menu__dropdown" id="profileDropdown" hidden>
                        <li><a class="profile-menu__item" href="/features/mypage/member-edit.html">회원정보수정</a></li>
                        <li><a class="profile-menu__item" href="/features/mypage/password-edit.html">비밀번호수정</a></li>
                        <li><button type="button" class="profile-menu__item" id="logoutButton">로그아웃</button></li>
                    </ul>
                </div>
            </div>
        </header>
    `;
};

const bindHeaderEvents = () => {
    const profileMenuButton = document.getElementById("profileMenuButton");
    const profileDropdown = document.getElementById("profileDropdown");
    const logoutButton = document.getElementById("logoutButton");
    const backButton = document.getElementById("backButton");   // 없는 페이지도 있음

    profileMenuButton.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = profileDropdown.hidden;
        profileDropdown.hidden = !willOpen;
        profileMenuButton.setAttribute("aria-expanded", String(willOpen));
    });

    document.addEventListener("click", (event) => {
        if (!profileDropdown.hidden && !event.target.closest(".profile-menu")) {
            profileDropdown.hidden = true;
            profileMenuButton.setAttribute("aria-expanded", "false");
        }
    });

    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("userUuid");
        window.location.href = "/features/auth/login.html";
    });

    if (backButton) {
        backButton.addEventListener("click", () => history.back());
    }
};

const renderHeader = () => {
    const mount = document.getElementById("app-header");
    if (!mount) return;   // 헤더 자리가 없는 페이지(로그인/회원가입)는 건너뜀

    mount.innerHTML = buildHeaderHtml(mount.dataset.back === "true");
    bindHeaderEvents();   // 그려넣은 "뒤에" 이벤트를 붙여야 요소가 존재함
};

document.addEventListener("DOMContentLoaded", renderHeader);
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

const buildHeaderHtml = (showBack) => {
    const backHtml = showBack
        ? `<button type="button" class="app-header__back-nav" id="backButton" aria-label="뒤로가기">&lt;</button>`
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
    const backButton = document.getElementById("backButton");

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
    if (!mount) return;

    mount.innerHTML = buildHeaderHtml(mount.dataset.back === "true");
    bindHeaderEvents();
};

document.addEventListener("DOMContentLoaded", renderHeader);
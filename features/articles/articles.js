const writeButton = document.getElementById("write-article-button");
const articleList = document.getElementById("article-list");
const loadingArea = document.getElementById("article-list-loading");
const emptyArea = document.getElementById("article-list-empty");
const errorArea = document.getElementById("article-list-error");

const hideAllStatus = () => {
    articleList.hidden = true;
    loadingArea.hidden = true;
    emptyArea.hidden = true;
    errorArea.hidden = true;
};

const showLoading = () => {
    hideAllStatus();
    loadingArea.hidden = false;
};

const showList = () => {
    hideAllStatus();
    articleList.hidden = false;
};

const showEmpty = () => {
    hideAllStatus();
    emptyArea.hidden = false;
};

const showError = () => {
    hideAllStatus();
    errorArea.hidden = false;
};

const formatDate = (isoString) => {
    const date = new Date(isoString);
    if (isNaN(date)) return isoString;

    const pad = (n) => String(n).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const createArticleCard = (article) => {
    const card = document.createElement("article");
    card.className = "article-card";
    card.dataset.articleId = article.articleUuid;

    card.innerHTML = `
        <div class="article-card__body">
            <h2 class="article-card__title"></h2>
            <div class="article-card__meta">
                <ul class="article-card__stats">
                    <li class="article-card__stat">좋아요 <span></span></li>
                    <li class="article-card__stat">댓글 <span></span></li>
                    <li class="article-card__stat">조회수 <span></span></li>
                </ul>
                <time class="article-card__date"></time>
            </div>
        </div>
        <div class="article-card__author">
            <span class="article-card__author-image"></span>
            <span class="article-card__author-name"></span>
        </div>
    `;

    card.querySelector(".article-card__title").textContent = article.title;

    const stats = card.querySelectorAll(".article-card__stat span");
    stats[0].textContent = article.likeCount;
    stats[1].textContent = article.commentCount;
    stats[2].textContent = article.viewCount;

    const dateEl = card.querySelector(".article-card__date");
    dateEl.textContent = formatDate(article.createdAt);
    dateEl.setAttribute("datetime", article.createdAt);

    card.querySelector(".article-card__author-name").textContent = article.writer;

    return card;
};

const renderArticles = (articles) => {
    articles.forEach((article) => {
        const card = createArticleCard(article);
        articleList.appendChild(card);
    });
};

const handleWriteClick = () => {
    window.location.href = "article-create.html";
};

const handleListClick = (event) => {
    const card = event.target.closest(".article-card");
    if (!card) return;

    const articleId = card.dataset.articleId;
    window.location.href = "article-detail.html?uuid=" + articleId;
};

writeButton.addEventListener("click", handleWriteClick);
articleList.addEventListener("click", handleListClick);

let lastArticleUuid = null;
let hasNext = true;
let isLoading = false;

const loadArticles = async () => {
    isLoading = true;

    let url = "articles?size=20";
    if (lastArticleUuid) {
        url += `&lastArticleUuid=${lastArticleUuid}`;
    }

    try {
        const response = await apiFetch(url, { method: "GET" });

        if (!response.ok) {
            showError();
            return false;
        }

        const data = await response.json();
        const articles = data.articles;

        if (lastArticleUuid === null && (!articles || articles.length === 0)) {
            showEmpty();
            hasNext = false;
            return false;
        }

        if (lastArticleUuid === null) {
            articleList.innerHTML = "";
        }

        renderArticles(articles);
        showList();

        hasNext = data.hasNext;
        lastArticleUuid = data.nextCursor;

        return true;
    } catch (error) {
        console.error(error);
        showError();
        return false;
    } finally {
        isLoading = false;
    }
};

const sentinel = document.getElementById("scroll-sentinel");

const observer = new IntersectionObserver(async (entries) => {
    if (!entries[0].isIntersecting) return;
    if (isLoading || !hasNext) return;

    await loadArticles();

    if (!hasNext) {
        observer.unobserve(sentinel);
    }
});

// 목록을 첫 페이지부터 다시 그린다 (최초 로드 + 뒤로가기 복원 공용)
const reloadArticles = async () => {
    // 무한스크롤 상태 리셋 (안 하면 이전 커서부터 이어붙어 중복됨)
    lastArticleUuid = null;
    hasNext = true;
    isLoading = false;
    articleList.innerHTML = "";

    observer.unobserve(sentinel);   // 중복 감시 방지 위해 일단 끊고

    showLoading();
    const success = await loadArticles();

    if (success && hasNext) {
        observer.observe(sentinel); // 더 있으면 다시 감시 시작
    }
};

// pageshow: 최초 로드(persisted=false)와 뒤로가기 복원(persisted=true) 모두 여기서 처리
window.addEventListener("pageshow", async (event) => {
    const userUuid = localStorage.getItem("userUuid");
    if (!userUuid) {
        window.location.href = "../auth/login.html";
        return;
    }

    await reloadArticles();
});
console.log("article-detail.js 연결됨");

const articleTitle = document.getElementById("articleTitle");
const articleAuthorName = document.getElementById("articleAuthorName");
const articleDate = document.getElementById("articleDate");
const articleImage = document.getElementById("articleImage");
const articleBody = document.getElementById("articleBody");
const likeButton = document.getElementById("likeButton");
const likeCount = document.getElementById("likeCount");
const viewCount = document.getElementById("viewCount");
const commentCount = document.getElementById("commentCount");

const articleOwnerActions = document.getElementById("articleOwnerActions");
const articleEditButton = document.getElementById("articleEditButton");
const articleDeleteButton = document.getElementById("articleDeleteButton");

const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");
const commentSubmitButton = document.getElementById("commentSubmitButton");
const commentList = document.getElementById("commentList");
const commentEmptyMessage = document.getElementById("commentEmptyMessage");
const commentErrorMessage = document.getElementById("commentErrorMessage");

const articleErrorMessage = document.getElementById("articleErrorMessage");

const articleDeleteModal = document.getElementById("articleDeleteModal");
const articleDeleteConfirmButton = document.getElementById("articleDeleteConfirmButton");
const commentDeleteModal = document.getElementById("commentDeleteModal");
const commentDeleteConfirmButton = document.getElementById("commentDeleteConfirmButton");

const params = new URLSearchParams(window.location.search);
const articleUuid = params.get("uuid");
const myUuid = localStorage.getItem("userUuid");
console.log("게시글 uuid:", articleUuid);

const formatDate = (isoString) => {
    const date = new Date(isoString);
    if (isNaN(date)) return isoString;
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
        + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const handleAuthError = (status) => {
    if (status === 401) {
        window.location.href = "../auth/login.html";
        return true;
    }
    return false;
};

const openModal = (modal) => modal.classList.add("article-modal--open");
const closeModal = (modal) => modal.classList.remove("article-modal--open");

const renderArticle = (article) => {
    articleTitle.textContent = article.title;
    articleAuthorName.textContent = article.writer;

    articleDate.textContent = formatDate(article.createdAt);
    articleDate.setAttribute("datetime", article.createdAt);

    articleBody.textContent = article.content;

    if (article.imageUrl) {
        articleImage.src = article.imageUrl;
        articleImage.hidden = false;
    } else {
        articleImage.hidden = true;
    }

    likeCount.textContent = article.likeCount;
    viewCount.textContent = article.viewCount;
    commentCount.textContent = article.commentCount;

    likeButton.dataset.liked = article.isLiked ? "true" : "false";
    likeButton.setAttribute("aria-pressed", article.isLiked ? "true" : "false");

    articleOwnerActions.hidden = article.userUuid !== myUuid;
};

// 댓글 하나(li) 생성 (ai 활용)
const createCommentItem = (comment) => {
    const li = document.createElement("li");
    li.className = "article-comment-item";
    li.dataset.commentId = comment.commentUuid;

    li.innerHTML = `
        <div class="article-comment-item__head">
            <div class="article-comment-item__author">
                <span class="article-comment-item__author-image" aria-hidden="true"></span>
                <span class="article-comment-item__author-name"></span>
                <time class="article-comment-item__date"></time>
            </div>
            <div class="article-comment-item__actions" hidden>
                <button type="button" class="article-comment-item__action-button" data-action="comment-edit">수정</button>
                <button type="button" class="article-comment-item__action-button" data-action="comment-delete">삭제</button>
            </div>
            <div class="article-comment-item__edit-actions">
                <button type="button" class="article-comment-item__action-button" data-action="comment-edit-save">완료</button>
                <button type="button" class="article-comment-item__action-button" data-action="comment-edit-cancel">취소</button>
            </div>
        </div>
        <p class="article-comment-item__body"></p>
        <textarea class="article-comment-item__edit-input" rows="2"></textarea>
    `;

    li.querySelector(".article-comment-item__author-name").textContent = comment.writer;

    const timeEl = li.querySelector(".article-comment-item__date");
    timeEl.textContent = formatDate(comment.createdAt);
    timeEl.setAttribute("datetime", comment.createdAt);

    li.querySelector(".article-comment-item__body").textContent = comment.content;
    li.querySelector(".article-comment-item__edit-input").value = comment.content;

    if (comment.userUuid === myUuid) {
        li.querySelector(".article-comment-item__actions").hidden = false;
    }

    return li;
};

const renderComments = (comments) => {
    commentList.innerHTML = "";
    comments.forEach((c) => commentList.appendChild(createCommentItem(c)));
    commentEmptyMessage.hidden = comments.length > 0;
};

const loadArticleDetail = async () => {
    if (!articleUuid) {
        articleErrorMessage.hidden = false;
        return;
    }

    try {
        const response = await apiFetch("articles/" + articleUuid);

        if (!response.ok) {
            if (handleAuthError(response.status)) return;
            articleErrorMessage.hidden = false;
            return;
        }

        const data = await response.json();
        articleErrorMessage.hidden = true;
        renderArticle(data);
        renderComments(data.comments || []);
    } catch (error) {
        console.error(error);
        articleErrorMessage.hidden = false;
    }
};

likeButton.addEventListener("click", async () => {
    const liked = likeButton.dataset.liked === "true";
    const method = liked ? "DELETE" : "POST";

    try {
        const response = await apiFetch("articles/" + articleUuid + "/like", { method });

        if (!response.ok) {
            if (handleAuthError(response.status)) return;
            console.error("좋아요 실패:", response.status);
            return;
        }

        const data = await response.json();
        likeCount.textContent = data.likeCount;
        likeButton.dataset.liked = data.isLiked ? "true" : "false";
        likeButton.setAttribute("aria-pressed", data.isLiked ? "true" : "false");
    } catch (error) {
        console.error(error);
    }
});

articleEditButton.addEventListener("click", () => {
    window.location.href = "article-edit.html?uuid=" + articleUuid;
});

articleDeleteButton.addEventListener("click", () => openModal(articleDeleteModal));
articleDeleteModal.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-modal-close")) closeModal(articleDeleteModal);
});

articleDeleteConfirmButton.addEventListener("click", async () => {
    try {
        const response = await apiFetch("articles/" + articleUuid, { method: "DELETE" });

        if (!response.ok) {
            if (handleAuthError(response.status)) return;
            console.error("게시글 삭제 실패:", response.status);
            closeModal(articleDeleteModal);
            return;
        }

        window.location.href = "articles.html";
    } catch (error) {
        console.error(error);
        closeModal(articleDeleteModal);
    }
});

commentInput.addEventListener("input", () => {
    commentSubmitButton.disabled = commentInput.value.trim().length === 0;
});

commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const content = commentInput.value.trim();
    if (!content) return;

    commentSubmitButton.disabled = true;
    commentErrorMessage.textContent = "";

    try {
        const response = await apiFetch("articles/" + articleUuid + "/comments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        });

        if (!response.ok) {
            if (handleAuthError(response.status)) return;
            commentErrorMessage.textContent = "댓글 등록에 실패했습니다.";
            return;
        }

        commentInput.value = "";
        await loadArticleDetail();
    } catch (error) {
        console.error(error);
        commentErrorMessage.textContent = "네트워크 오류로 등록하지 못했습니다.";
    }
});

commentList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const li = button.closest(".article-comment-item");
    if (!li) return;
    const commentUuid = li.dataset.commentId;

    if (action === "comment-delete") {
        commentDeleteModal.dataset.commentId = commentUuid;
        openModal(commentDeleteModal);
        return;
    }

    if (action === "comment-edit") {
        const editing = commentList.querySelector(".article-comment-item--editing");
        if (editing && editing !== li) cancelEdit(editing);

        const body = li.querySelector(".article-comment-item__body");
        const input = li.querySelector(".article-comment-item__edit-input");
        input.dataset.original = body.textContent;
        input.value = body.textContent;

        li.classList.add("article-comment-item--editing");
        input.focus();
        return;
    }

    if (action === "comment-edit-save") {
        const input = li.querySelector(".article-comment-item__edit-input");
        const next = input.value.trim();
        if (!next) return;

        try {
            const response = await apiFetch(
                "articles/" + articleUuid + "/comments/" + commentUuid,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: next }),
                }
            );

            if (!response.ok) {
                if (handleAuthError(response.status)) return;
                console.error("댓글 수정 실패:", response.status);
                return;
            }

            li.querySelector(".article-comment-item__body").textContent = next;
            li.classList.remove("article-comment-item--editing");
        } catch (error) {
            console.error(error);
        }
        return;
    }

    if (action === "comment-edit-cancel") {
        cancelEdit(li);
        return;
    }
});

const cancelEdit = (li) => {
    const input = li.querySelector(".article-comment-item__edit-input");
    input.value = input.dataset.original || "";
    li.classList.remove("article-comment-item--editing");
};

commentDeleteModal.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-modal-close")) closeModal(commentDeleteModal);
});

commentDeleteConfirmButton.addEventListener("click", async () => {
    const commentUuid = commentDeleteModal.dataset.commentId;

    try {
        const response = await apiFetch(
            "articles/" + articleUuid + "/comments/" + commentUuid,
            { method: "DELETE" }
        );

        if (!response.ok) {
            if (handleAuthError(response.status)) return;
            console.error("댓글 삭제 실패:", response.status);
            closeModal(commentDeleteModal);
            return;
        }

        closeModal(commentDeleteModal);
        await loadArticleDetail();  
    } catch (error) {
        console.error(error);
        closeModal(commentDeleteModal);
    }
});

loadArticleDetail();
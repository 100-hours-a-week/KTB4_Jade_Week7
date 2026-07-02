document.addEventListener("DOMContentLoaded", () => {

    const createForm = document.getElementById("createForm");
    const titleInput = document.getElementById("titleInput");
    const contentInput = document.getElementById("contentInput");
    const imageInput = document.getElementById("imageInput");

    const titleField = document.getElementById("titleField");
    const contentField = document.getElementById("contentField");

    const titleMessage = document.getElementById("titleMessage");
    const contentMessage = document.getElementById("contentMessage");
    const imageFileName = document.getElementById("imageFileName");

    const submitButton = document.getElementById("submitButton");
    const requestMessage = document.getElementById("requestMessage");

    const myUuid = localStorage.getItem("userUuid");

    const TITLE_MAX = 26;

    const setFieldError = (field, messageEl, text) => {
        field.classList.add("article-form-field--invalid");
        messageEl.textContent = text;
    };
    const clearFieldError = (field, messageEl) => {
        field.classList.remove("article-form-field--invalid");
        messageEl.textContent = "";
    };

    const validateTitle = () => {
        const value = titleInput.value.trim();
        if (value.length === 0) {
            setFieldError(titleField, titleMessage, "제목을 입력해주세요.");
            return false;
        }
        if (value.length > TITLE_MAX) {
            setFieldError(titleField, titleMessage, `제목은 최대 ${TITLE_MAX}자까지 가능합니다.`);
            return false;
        }
        clearFieldError(titleField, titleMessage);
        return true;
    };

    const validateContent = () => {
        const value = contentInput.value.trim();
        if (value.length === 0) {
            setFieldError(contentField, contentMessage, "내용을 입력해주세요.");
            return false;
        }
        clearFieldError(contentField, contentMessage);
        return true;
    };

    const refreshSubmitState = () => {
        const titleOk = titleInput.value.trim().length > 0
                     && titleInput.value.trim().length <= TITLE_MAX;
        const contentOk = contentInput.value.trim().length > 0;
        submitButton.disabled = !(titleOk && contentOk);
    };

    titleInput.addEventListener("input", refreshSubmitState);
    contentInput.addEventListener("input", refreshSubmitState);
    titleInput.addEventListener("blur", validateTitle);
    contentInput.addEventListener("blur", validateContent);

    imageInput.addEventListener("change", () => {
        imageFileName.textContent = imageInput.files.length > 0
            ? imageInput.files[0].name
            : "파일을 선택해주세요.";
    });

    createForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        requestMessage.hidden = true;
        requestMessage.textContent = "";

        const titleOk = validateTitle();
        const contentOk = validateContent();
        if (!titleOk || !contentOk) return;

        if (!myUuid) {
            requestMessage.hidden = false;
            requestMessage.textContent = "로그인이 필요합니다.";
            return;
        }

        const body = {
            title: titleInput.value.trim(),
            content: contentInput.value.trim(),
        };

        submitButton.disabled = true;
        submitButton.textContent = "작성 중...";

        try {
            const response = await apiFetch("articles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                const data = await response.json();
                window.location.href = "./article-detail.html?uuid=" + data.articleUuid;
                return;
            }

            await handleErrorResponse(response);

        } catch (error) {
            console.error(error);
            requestMessage.hidden = false;
            requestMessage.textContent = "네트워크 오류로 작성하지 못했습니다.";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "완료";
            refreshSubmitState();
        }
    });

    const handleErrorResponse = async (response) => {
        let data = null;
        try { data = await response.json(); } catch (_) {}

        if (response.status === 401) {
            requestMessage.hidden = false;
            requestMessage.textContent = (data && data.message) || "인증되지 않은 사용자입니다.";
            return;
        }

        if (response.status === 400 || response.status === 422) {
            const fields = (data && data.fields) || {};
            if (fields.title) setFieldError(titleField, titleMessage, fields.title);
            if (fields.content) setFieldError(contentField, contentMessage, fields.content);
            if (!fields.title && !fields.content) {
                requestMessage.hidden = false;
                requestMessage.textContent = (data && data.message) || "입력값을 확인해주세요.";
            }
            return;
        }

        requestMessage.hidden = false;
        requestMessage.textContent = (data && data.message) || "게시글 작성에 실패했습니다.";
    };

    refreshSubmitState();
});
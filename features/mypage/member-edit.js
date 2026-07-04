document.addEventListener("DOMContentLoaded", () => {
    const emailText = document.getElementById("emailText");
    const nicknameInput = document.getElementById("nicknameInput");
    const profilePreview = document.getElementById("profilePreview");
    const profileInput = document.getElementById("profileInput");

    const editForm = document.getElementById("editForm");
    const submitButton = document.getElementById("submitButton");
    const nicknameField = document.getElementById("nicknameField");
    const nicknameMessage = document.getElementById("nicknameMessage");
    const requestMessage = document.getElementById("requestMessage");

    const withdrawButton = document.getElementById("withdrawButton");
    const withdrawModal = document.getElementById("withdrawModal");
    const withdrawConfirmButton = document.getElementById("withdrawConfirmButton");

    const myUuid = localStorage.getItem("userUuid");

    const openModal = (modal) => modal.classList.add("app-modal--open");
    const closeModal = (modal) => modal.classList.remove("app-modal--open");

    const setNicknameError = (text) => {
        nicknameField.classList.add("member-form-field--invalid");
        nicknameMessage.textContent = text;
    };
    const clearNicknameError = () => {
        nicknameField.classList.remove("member-form-field--invalid");
        nicknameMessage.textContent = "* helper text";
    };

    const logout = () => {
        localStorage.removeItem("userUuid");
        window.location.href = "../auth/login.html";
    };

    const applyProfileImage = (url) => {
        if (!url) return;
        profilePreview.style.backgroundImage = `url("${url}")`;
    };

    const loadMyInfo = async () => {
        try {
            const response = await apiFetch("me/basic-info");

            if (!response.ok) {
                if (response.status === 401) { logout(); return; }
                requestMessage.hidden = false;
                requestMessage.textContent = "정보를 불러오지 못했습니다.";
                return;
            }

            const data = await response.json();
            emailText.textContent = data.email;
            nicknameInput.value = data.nickname;
            applyProfileImage(data.profileImageUrl);
            clearNicknameError();
        } catch (error) {
            console.error(error);
            requestMessage.hidden = false;
            requestMessage.textContent = "네트워크 오류로 불러오지 못했습니다.";
        }
    };

    const validateNickname = () => {
        const value = nicknameInput.value;

        if (value.trim().length === 0) {
            setNicknameError("닉네임을 입력해주세요.");
            return false;
        }
        if (/\s/.test(value)) {  
            setNicknameError("띄어쓰기 없이 입력해주세요.");
            return false;
        }
        if (value.length > 10) {
            setNicknameError("10글자 이내로 입력해주세요.");
            return false;
        }
        clearNicknameError();
        return true;
    };

    nicknameInput.addEventListener("input", validateNickname);

    profileInput.addEventListener("change", () => {
        if (profileInput.files.length === 0) return;
        const file = profileInput.files[0];

        const previewUrl = URL.createObjectURL(file);
        profilePreview.style.backgroundImage = `url("${previewUrl}")`;
    });

    editForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        requestMessage.hidden = true;
        requestMessage.textContent = "";

        if (!validateNickname()) return;

        if (!myUuid) { logout(); return; }

        const body = { nickname: nicknameInput.value };

        submitButton.disabled = true;
        submitButton.textContent = "수정 중...";

        try {
            const response = await apiFetch("me/basic-info", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                const data = await response.json();
                applyProfileImage(data.profileImageUrl);
                requestMessage.hidden = false;
                nicknameInput.value = data.nickname;
                requestMessage.style.color = "#2e7d32";
                requestMessage.textContent = "수정되었습니다.";
                return;
            }

            await handleEditError(response);
        } catch (error) {
            console.error(error);
            requestMessage.hidden = false;
            requestMessage.style.color = "";
            requestMessage.textContent = "네트워크 오류로 수정하지 못했습니다.";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "수정하기";
        }
    });

    const handleEditError = async (response) => {
        let data = null;
        try { data = await response.json(); } catch (_) {}

        if (response.status === 401) { logout(); return; }

        if (response.status === 409) {
            setNicknameError((data && data.message) || "중복된 닉네임입니다.");
            return;
        }
        if (response.status === 422) {
            const fields = (data && data.fields) || {};
            setNicknameError(fields.nickname || (data && data.message) || "닉네임 형식을 확인해주세요.");
            return;
        }
        if (response.status === 400) {
            requestMessage.hidden = false;
            requestMessage.style.color = "";
            requestMessage.textContent = (data && data.message) || "변경할 내용을 입력해주세요.";
            return;
        }
        requestMessage.hidden = false;
        requestMessage.style.color = "";
        requestMessage.textContent = (data && data.message) || "수정에 실패했습니다.";
    };

    withdrawButton.addEventListener("click", () => openModal(withdrawModal));

    withdrawModal.addEventListener("click", (event) => {
        if (event.target.hasAttribute("data-modal-close")) closeModal(withdrawModal);
    });

    withdrawConfirmButton.addEventListener("click", async () => {
        try {
            const response = await apiFetch("me", { method: "DELETE" });

            if (response.ok) {
                localStorage.removeItem("userUuid");
                window.location.href = "../auth/login.html";
                return;
            }

            if (response.status === 401) { logout(); return; }

            closeModal(withdrawModal);
            requestMessage.hidden = false;
            requestMessage.style.color = "";
            requestMessage.textContent = "탈퇴에 실패했습니다.";
        } catch (error) {
            console.error(error);
            closeModal(withdrawModal);
            requestMessage.hidden = false;
            requestMessage.style.color = "";
            requestMessage.textContent = "네트워크 오류로 탈퇴하지 못했습니다.";
        }
    });

    loadMyInfo();
});
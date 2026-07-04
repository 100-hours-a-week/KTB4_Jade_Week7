document.addEventListener("DOMContentLoaded", () => {
    // 조회/표시
    const emailText = document.getElementById("emailText");
    const nicknameInput = document.getElementById("nicknameInput");
    const profilePreview = document.getElementById("profilePreview");
    const profileInput = document.getElementById("profileInput");

    // 수정
    const editForm = document.getElementById("editForm");
    const submitButton = document.getElementById("submitButton");
    const nicknameField = document.getElementById("nicknameField");
    const nicknameMessage = document.getElementById("nicknameMessage");
    const requestMessage = document.getElementById("requestMessage");

    // 탈퇴 모달
    const withdrawButton = document.getElementById("withdrawButton");
    const withdrawModal = document.getElementById("withdrawModal");
    const withdrawConfirmButton = document.getElementById("withdrawConfirmButton");

    const myUuid = localStorage.getItem("userUuid");

    //공통 유틸
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

    // 로그아웃 처리: 401 응답 시에도 호출되므로 함수는 유지
    const logout = () => {
        localStorage.removeItem("userUuid");
        window.location.href = "../auth/login.html";
    };

    // 프로필 이미지 URL 을 본문 미리보기에 반영 (헤더는 common.js 담당)
    const applyProfileImage = (url) => {
        if (!url) return;
        profilePreview.style.backgroundImage = `url("${url}")`;
    };

    //내 정보 조회
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

    //닉네임 검증
    const validateNickname = () => {
        const value = nicknameInput.value;

        if (value.trim().length === 0) {
            setNicknameError("닉네임을 입력해주세요.");
            return false;
        }
        if (/\s/.test(value)) {   // 공백 문자 포함 여부
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

    // 프로필 사진 변경 (미리보기만, 업로드 API 는 이후)
    profileInput.addEventListener("change", () => {
        if (profileInput.files.length === 0) return;
        const file = profileInput.files[0];

        const previewUrl = URL.createObjectURL(file);
        profilePreview.style.backgroundImage = `url("${previewUrl}")`;
    });

    // 수정하기
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

    // 수정 오류 처리
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

            // 성공
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
document.addEventListener("DOMContentLoaded", () => {
    const passwordInput = document.getElementById("passwordInput");
    const checkPasswordInput = document.getElementById("checkPasswordInput");

    const passwordField = document.getElementById("passwordField");
    const checkPasswordField = document.getElementById("checkPasswordField");

    const passwordMessage = document.getElementById("passwordMessage");
    const checkPasswordMessage = document.getElementById("checkPasswordMessage");

    const passwordForm = document.getElementById("passwordForm");
    const submitButton = document.getElementById("submitButton");
    const requestMessage = document.getElementById("requestMessage");

    const myUuid = localStorage.getItem("userUuid");

    const logout = () => {
        localStorage.removeItem("userUuid");
        window.location.href = "../auth/login.html";
    };

    const setFieldError = (field, messageEl, text) => {
        field.classList.add("member-form-field--invalid");
        messageEl.textContent = text;
    };
    const clearFieldError = (field, messageEl) => {
        field.classList.remove("member-form-field--invalid");
        messageEl.textContent = "* helper text";
    };

    // 8~20자 + 대문자·소문자·숫자·특수문자 각 1개 이상
    const validatePassword = () => {
        const value = passwordInput.value;
        const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,20}$/;

        if (value.length === 0) {
            setFieldError(passwordField, passwordMessage, "비밀번호를 입력해주세요.");
            return false;
        }
        if (!pattern.test(value)) {
            setFieldError(passwordField, passwordMessage, "8자 이상 20자 이하, 대문자·소문자·숫자·특수문자를 각각 1개 이상 포함해주세요.");
            return false;
        }
        clearFieldError(passwordField, passwordMessage);
        return true;
    };

    const validateCheckPassword = () => {
        const value = checkPasswordInput.value;

        if (value.length === 0) {
            setFieldError(checkPasswordField, checkPasswordMessage, "비밀번호 확인을 입력해주세요.");
            return false;
        }
        if (value !== passwordInput.value) {
            setFieldError(checkPasswordField, checkPasswordMessage, "비밀번호가 다릅니다.");
            return false;
        }
        clearFieldError(checkPasswordField, checkPasswordMessage);
        return true;
    };

    const refreshSubmitState = () => {
        const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,20}$/;
        const passwordOk = pattern.test(passwordInput.value);
        const checkOk = checkPasswordInput.value.length > 0
                     && checkPasswordInput.value === passwordInput.value;
        submitButton.disabled = !(passwordOk && checkOk);
    };

    passwordInput.addEventListener("input", () => {
        validatePassword();
        // 비밀번호가 바뀌면 확인란도 다시 검사
        if (checkPasswordInput.value.length > 0) validateCheckPassword();
        refreshSubmitState();
    });

    checkPasswordInput.addEventListener("input", () => {
        validateCheckPassword();
        refreshSubmitState();
    });

    const fieldMap = {
        password: { field: passwordField, message: passwordMessage },
        checkPassword: { field: checkPasswordField, message: checkPasswordMessage },
    };

    const showServerFieldErrors = (fields) => {
        for (const key in fields) {
            const target = fieldMap[key];
            if (target) setFieldError(target.field, target.message, fields[key]);
        }
    };

    const handleErrorResponse = async (response) => {
        let data = null;
        try { data = await response.json(); } catch (_) {}

        if (response.status === 401) { logout(); return; }

        if (data && data.fields) {
            showServerFieldErrors(data.fields);
            return;
        }

        requestMessage.hidden = false;
        requestMessage.style.color = "";
        requestMessage.textContent = (data && data.message) || "수정에 실패했습니다.";
    };

    passwordForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        requestMessage.hidden = true;
        requestMessage.textContent = "";

        const passwordOk = validatePassword();
        const checkOk = validateCheckPassword();
        if (!passwordOk || !checkOk) return;

        if (!myUuid) { logout(); return; }

        const body = {
            password: passwordInput.value,
            checkPassword: checkPasswordInput.value,
        };

        submitButton.disabled = true;
        submitButton.textContent = "수정 중...";

        try {
            const response = await apiFetch("me/security", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                requestMessage.hidden = false;
                requestMessage.style.color = "#2e7d32";
                requestMessage.textContent = "비밀번호가 수정되었습니다.";
                passwordInput.value = "";
                checkPasswordInput.value = "";
                refreshSubmitState();
                return;
            }

            await handleErrorResponse(response);
        } catch (error) {
            console.error(error);
            requestMessage.hidden = false;
            requestMessage.style.color = "";
            requestMessage.textContent = "네트워크 오류로 수정하지 못했습니다.";
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "수정하기";
            refreshSubmitState();
        }
    });

    refreshSubmitState();
});
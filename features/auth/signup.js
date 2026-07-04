
const profileInput = document.getElementById("profile-image");
const profilePreview = document.getElementById("profile-preview");
const profileUploader = document.querySelector(".profile-uploader");
const profileHelper = document.getElementById("profileImageUrl-helper");

let profileFile = null;

const validateProfile = () => {
    if (profileFile === null) return "프로필 사진을 추가해주세요.";
    return "";
};

const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(email)) return "";
    return "올바른 이메일 주소 형식을 입력해주세요.";
};

const validatePassword = (password) => {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,20}$/;
    if (passwordPattern.test(password)) return "";
    return "8자 이상 20자 이하, 대문자·소문자·숫자·특수문자를 각각 1개 이상 포함해주세요.";
};

const validateNickname = (nickname) => {
    if (nickname.trim().length === 0) return "닉네임을 입력해주세요.";
    if (nickname.includes(" ")) return "띄어쓰기 없이 10글자 이내로 입력해주세요.";
    if (nickname.length > 10) return "띄어쓰기 없이 10글자 이내로 입력해주세요.";
    return "";
};

function setHelper(helperElement, message) {
    helperElement.textContent = message;
    helperElement.classList.toggle("is-error", message !== "");
}

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const checkPasswordInput = document.getElementById("check-password");
const nicknameInput = document.getElementById("nickname");

const validateCheckPassword = (checkPassword) => {
    if (checkPassword.length === 0) return "비밀번호를 한번 더 입력해주세요.";
    if (checkPassword !== passwordInput.value) return "비밀번호가 다릅니다.";
    return "";
};

const isSignupFormValid = () => {
    return (
        validateProfile() === "" &&
        validateEmail(emailInput.value) === "" &&
        validatePassword(passwordInput.value) === "" &&
        validateCheckPassword(checkPasswordInput.value) === "" &&
        validateNickname(nicknameInput.value) === ""
    );
};

const submitButton = document.getElementById("signup-submit");

const updateSubmitButton = () => {
    submitButton.disabled = !isSignupFormValid();
};

const emailHelper = document.getElementById("email-helper");
const passwordHelper = document.getElementById("password-helper");
const checkPasswordHelper = document.getElementById("checkPassword-helper");
const nicknameHelper = document.getElementById("nickname-helper");

const handleProfileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
        profileFile = file;
        const reader = new FileReader();
        reader.onload = () => {
            profilePreview.style.backgroundImage = `url(${reader.result})`;
            profilePreview.style.backgroundSize = "cover";
            profilePreview.style.backgroundPosition = "center";
            profilePreview.textContent = "";
            profileUploader.classList.add("has-image");
        };
        reader.readAsDataURL(file);
    } else {
        profileFile = null;
        profileUploader.classList.remove("has-image");
    }

    setHelper(profileHelper, validateProfile());
    updateSubmitButton();
};

const handleEmailInput = (event) => {
    setHelper(emailHelper, validateEmail(event.target.value));
    updateSubmitButton();
};

const handlePasswordInput = (event) => {
    setHelper(passwordHelper, validatePassword(event.target.value));
    setHelper(checkPasswordHelper, validateCheckPassword(checkPasswordInput.value));
    updateSubmitButton();
};

const handleCheckPasswordInput = (event) => {
    setHelper(checkPasswordHelper, validateCheckPassword(event.target.value));
    updateSubmitButton();
};

const handleNicknameInput = (event) => {
    setHelper(nicknameHelper, validateNickname(event.target.value));
    updateSubmitButton();
};

profileInput.addEventListener("change", handleProfileChange);
emailInput.addEventListener("input", handleEmailInput);
passwordInput.addEventListener("input", handlePasswordInput);
checkPasswordInput.addEventListener("input", handleCheckPasswordInput);
nicknameInput.addEventListener("input", handleNicknameInput);

const formError = document.getElementById("signup-form-error");

const fieldHelperMap = {
    profileImageUrl: profileHelper,
    email: emailHelper,
    password: passwordHelper,
    checkPassword: checkPasswordHelper,
    nickname: nicknameHelper,
};

const showServerFieldErrors = (fields) => {
    for (const key in fields) {
        const helper = fieldHelperMap[key];
        if (helper) setHelper(helper, fields[key]);
    }
};

const handleSignupForm = async (event) => {
    event.preventDefault();
    formError.textContent = "";

    const requestBody = {
        email: emailInput.value,
        password: passwordInput.value,
        checkPassword: checkPasswordInput.value,
        nickname: nicknameInput.value,
        profileImageUrl: "temp-profile-url",
    };

    const response = await fetch(API_BASE_URL + "auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
    });

    const data = await response.json().catch(() => null);

    if (response.status === 201) {
        window.location.href = "login.html";
        return;
    }

    if (data.fields) {
        showServerFieldErrors(data.fields);
    } else {
        formError.textContent = data.message;
    }
};

const signupForm = document.getElementById("signup-form");
signupForm.addEventListener("submit", handleSignupForm);

const backButton = document.getElementById("back-button");
backButton.addEventListener("click", () => {
    window.history.back();
});
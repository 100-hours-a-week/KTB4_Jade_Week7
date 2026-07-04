

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(email)) return "";
    return "올바른 이메일 주소 형식을 입력해주세요.";
};

const validatePassword = (password) => {
    if (password.trim().length === 0) return "비밀번호를 입력해주세요.";
    return "";
};

const emailHelper = document.getElementById("email-helper");
const passwordHelper = document.getElementById("password-helper");

/*
classList?
: HTML 요소에 적용된 CSS 클래스 목록을 다루는 객체.
  add(), remove(), toggle() 등으로 클래스를 추가하거나 제거할 수 있다.

toggle?
: 클래스가 없으면 추가하고, 있으면 제거한다.
  두 번째 인자를 넣으면 true일 때 추가, false일 때 제거한다.
*/

function setHelper(helperElement, message) {
    helperElement.textContent = message;
    helperElement.classList.toggle("is-error", message !== "");
}

// ===는 값과 자료형이 모두 같은지 비교하는 엄격한 비교 연산자.
// ==는 자료형을 자동으로 변환한 뒤 비교하므로, 보통 === 사용을 권장한다.

const isLoginFormValid = () => {
    const emailMessage = validateEmail(emailInput.value);
    const passwordMessage = validatePassword(passwordInput.value);
    return emailMessage === "" && passwordMessage === "";
}

const submitButton = document.getElementById("login-submit");

const updateSubmitButton = () => {
    submitButton.disabled = !isLoginFormValid();
};

/*
event?
: 사용자의 입력, 클릭 같은 동작이 발생했을 때
  브라우저가 함수에 전달해주는 이벤트 정보 객체.

event.target?
: 이벤트가 발생한 실제 HTML 요소.
  여기서는 사용자가 값을 입력한 input 요소를 뜻한다.
*/

const handleEmailInput = (event) => {
    setHelper(emailHelper, validateEmail(event.target.value));
    updateSubmitButton();
}

const handlePasswordInput = (event) => {
    setHelper(passwordHelper, validatePassword(event.target.value));
    updateSubmitButton();
};

/*
addEventListener(이벤트 타입, 실행할 함수)

첫 번째 인자: 어떤 이벤트가 발생했을 때 실행할지 지정
- "input": input 값이 입력·삭제될 때마다 발생
- "click": 요소를 클릭했을 때 발생
- "submit": form을 제출했을 때 발생

두 번째 인자: 해당 이벤트가 발생했을 때 실행할 함수
*/
emailInput.addEventListener("input", handleEmailInput);
passwordInput.addEventListener("input", handlePasswordInput);

const handleLoginForm = async (event) => {
    event.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;

    // 폼 전체 오류 메시지 자리 (실패 시 여기에 표시)
    const formError = document.getElementById("login-form-error");
    formError.textContent = "";  // 이전 시도의 오류 메시지 초기화

    try {

        const response = await fetch(API_BASE_URL + "auth/sign-in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            const data = await response.json().catch(() => null);

            localStorage.setItem("userUuid", data.userUuid);
            window.location.href = "../articles/articles.html";
        } else {
            const data = await response.json().catch(() => null);
            formError.textContent =
                (data && data.message) || "이메일 또는 비밀번호를 확인해주세요.";
        }
    } catch (error) {

        console.log(error)
        formError.textContent = "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.";
    }
};

const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", handleLoginForm);
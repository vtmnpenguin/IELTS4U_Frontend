const WARNING_ICON = `<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><path d="M10 1.5 19 17H1L10 1.5z" fill="currentColor"/><rect x="9" y="7" width="2" height="5" rx="1" fill="#fff"/><rect x="9" y="13.5" width="2" height="2" rx="1" fill="#fff"/></svg>`;

function showNotice(message) {
  const notice = document.getElementById("loginNotice");
  const icon = document.getElementById("loginNoticeIcon");
  const text = document.getElementById("loginNoticeText");
  const action = document.getElementById("loginNoticeAction");
  notice.classList.remove("is-error");
  notice.classList.add("is-warning");
  icon.innerHTML = WARNING_ICON;
  text.textContent = message;
  action.hidden = true;
  action.onclick = null;
  notice.hidden = false;
}

function hideNotice() {
  document.getElementById("loginNotice").hidden = true;
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const button = document.getElementById("loginButton");
    emailError.textContent = "";
    passwordError.textContent = "";
    hideNotice();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      emailError.textContent = "Vui lòng nhập email hợp lệ.";
    if (!password) passwordError.textContent = "Vui lòng nhập mật khẩu.";
    if (emailError.textContent || passwordError.textContent) return;

    // Tài khoản demo để thử giao diện. Đây KHÔNG phải xác thực bảo mật thật.
    const demo = JSON.parse(localStorage.getItem("demoAccount") || "null");
    button.disabled = true;
    button.textContent = "Đang đăng nhập...";

    setTimeout(() => {
      button.disabled = false;
      button.textContent = "Đăng nhập";

      if (demo && demo.email === email && demo.password === password) {
        location.href = "home.html";
      } else {
        showNotice("Email hoặc mật khẩu không chính xác");
      }
    }, 700);
  });
}

document.getElementById("googleLogin")?.addEventListener("click", () => {
  alert(
    "Đây là nút Google mô phỏng giao diện. Đăng nhập Google thật cần tích hợp Google OAuth và backend.",
  );
});

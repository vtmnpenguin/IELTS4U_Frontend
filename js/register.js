const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("fullName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirm = document.getElementById("confirmPassword").value;
    const agree = document.getElementById("agree").checked;
    const set = (id, message) =>
      (document.getElementById(id).textContent = message);

    set("nameError", name ? "" : "Vui lòng nhập họ và tên.");
    set(
      "regEmailError",
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Email không hợp lệ.",
    );
    set(
      "regPasswordError",
      password.length >= 8 ? "" : "Mật khẩu cần tối thiểu 8 ký tự.",
    );
    set(
      "confirmError",
      password === confirm && confirm ? "" : "Mật khẩu xác nhận không khớp.",
    );
    set("agreeError", agree ? "" : "Bạn cần đồng ý với điều khoản.");

    if (
      !name ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8 ||
      password !== confirm ||
      !agree
    )
      return;

    localStorage.setItem(
      "demoAccount",
      JSON.stringify({ name, email, password, verified: false }),
    );
    sessionStorage.setItem("pendingEmail", email);
    sessionStorage.setItem("emailPurpose", "register");
    // Đăng ký mới = liên kết xác thực mới, nên xóa đồng hồ hết hạn cũ (nếu có)
    sessionStorage.removeItem("verifyLinkExpiresAt");
    location.href = "check-email.html";
  });
}

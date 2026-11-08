// Các thao tác dùng chung cho những trang xác thực (bản mô phỏng frontend).

const EYE_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a21.8 21.8 0 015.06-5.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 7 11 7a21.8 21.8 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24"/><path d="M1 1l22 22"/></svg>`;
const ERROR_DOT_ICON = `<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="currentColor"/><rect x="9" y="5" width="2" height="7" rx="1" fill="#fff"/><rect x="9" y="13.5" width="2" height="2" rx="1" fill="#fff"/></svg>`;

document.querySelectorAll(".show-password").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.innerHTML = isPassword ? EYE_OFF_ICON : EYE_ICON;
    button.setAttribute(
      "aria-label",
      isPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu",
    );
  });
});

// ============================================================
// Giới hạn số lần yêu cầu gửi email (đăng ký / đặt lại mật khẩu),
// dùng CHUNG giữa forgot-password.html (bấm "Gửi liên kết đặt lại")
// và check-email.html (bấm "Gửi lại email") — quy tắc thật: tối đa
// 5 lần/giờ; demo rút ngắn còn 60 giây cho dễ test.
// ============================================================
const EMAIL_REQUEST_MAX = 5;
const EMAIL_REQUEST_LOCK_MS = 60 * 1000;
function emailRequestLimiter(purpose) {
  const countKey = `emailRequestCount_${purpose}`;
  const lockKey = `emailRequestLockUntil_${purpose}`;
  return {
    lockUntil() {
      return Number(sessionStorage.getItem(lockKey) || 0);
    },
    isLocked() {
      return this.lockUntil() > Date.now();
    },
    // Ghi nhận 1 lần yêu cầu; trả về true nếu vừa chạm ngưỡng và bị khóa
    registerAttempt() {
      const count = Number(sessionStorage.getItem(countKey) || 0) + 1;
      sessionStorage.setItem(countKey, String(count));
      if (count >= EMAIL_REQUEST_MAX) {
        sessionStorage.setItem(
          lockKey,
          String(Date.now() + EMAIL_REQUEST_LOCK_MS),
        );
        return true;
      }
      return false;
    },
    clear() {
      sessionStorage.removeItem(countKey);
      sessionStorage.removeItem(lockKey);
    },
  };
}
function fmtMMSS(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

// Mỗi luồng (đăng ký / quên mật khẩu) có một "link xác thực" demo riêng,
// tự hết hạn sau LINK_TTL_MS để có thể demo cả 2 kết quả (thành công /
// hết hạn) mà không cần chờ thật.
const LINK_TTL_MS = 60 * 1000; // 60 giây cho dễ kiểm thử — đổi thành giá trị thật khi có backend
const LINK_FLOWS = {
  register: {
    sessionKey: "verifyLinkExpiresAt",
    ok: "verify-result.html",
    expired: "verify-result.html?status=failed",
  },
  reset: {
    sessionKey: "resetLinkExpiresAt",
    ok: "reset-password.html",
    expired: "reset-password.html?status=expired",
  },
};

const checkEmailMessage = document.getElementById("checkEmailMessage");
if (checkEmailMessage) {
  const email = sessionStorage.getItem("pendingEmail") || "";
  const purpose = sessionStorage.getItem("emailPurpose") || "register";

  function maskEmail(addr) {
    const at = addr.indexOf("@");
    if (at <= 0) return addr;
    return `${addr.charAt(0)}***${addr.slice(at)}`;
  }

  const titleEl = document.getElementById("checkEmailTitle");
  if (titleEl) {
    titleEl.textContent =
      purpose === "reset"
        ? "KIỂM TRA EMAIL CỦA BẠN"
        : "KIỂM TRA HỘP THƯ CỦA BẠN";
  }
  // Quên mật khẩu: KHÔNG hiện email (tránh lộ thông tin tài khoản có tồn
  // tại hay không). Đăng ký: ghép email (đã che bớt) chung vào 1 câu.
  checkEmailMessage.textContent =
    purpose === "reset"
      ? "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (kể cả mục spam)."
      : `Chúng tôi đã gửi link xác thực tới ${maskEmail(email)}`;

  const continueAction = document.getElementById("continueEmailAction");
  if (continueAction) {
    continueAction.textContent =
      purpose === "reset"
        ? "Mô phỏng mở email đặt lại mật khẩu"
        : "Mô phỏng mở email xác thực";
  }
  const changeEmailAction = document.getElementById("changeEmailAction");
  if (changeEmailAction) {
    changeEmailAction.href =
      purpose === "reset" ? "forgot-password.html" : "register.html";
  }

  const flow = LINK_FLOWS[purpose] || LINK_FLOWS.register;
  const resend = document.getElementById("resendButton");

  function linkExpiry() {
    let v = Number(sessionStorage.getItem(flow.sessionKey) || 0);
    if (!v) {
      v = Date.now() + LINK_TTL_MS;
      sessionStorage.setItem(flow.sessionKey, String(v));
    }
    return v;
  }
  // Chỉ cập nhật đích đến của link mô phỏng (thành công/hết hạn) — không
  // hiện riêng dòng đếm ngược nữa, đồng hồ giờ nằm hẳn trong nút resend.
  function refreshContinueLink() {
    if (!continueAction) return;
    continueAction.href = Date.now() >= linkExpiry() ? flow.expired : flow.ok;
  }
  refreshContinueLink();
  setInterval(refreshContinueLink, 1000);

  // Giới hạn số lần bấm "Gửi lại email" (dùng chung khóa với forgot-password.html)
  const limiter = emailRequestLimiter(purpose);
  const resendNotice = document.getElementById("resendNotice");
  const resendNoticeIcon = document.getElementById("resendNoticeIcon");
  const resendNoticeText = document.getElementById("resendNoticeText");
  let resendLockTimer = null;

  function showResendLimitNotice(message) {
    if (!resendNotice) return;
    resendNotice.classList.add("is-error");
    resendNoticeIcon.innerHTML = ERROR_DOT_ICON;
    resendNoticeText.textContent = message;
    resendNotice.hidden = false;
  }
  function hideResendLimitNotice() {
    if (resendNotice) resendNotice.hidden = true;
  }
  function startResendLockCountdown() {
    resend.classList.remove("attention");
    const tick = () => {
      const remain = limiter.lockUntil() - Date.now();
      if (remain <= 0) {
        limiter.clear();
        hideResendLimitNotice();
        resend.disabled = false;
        resend.textContent = "Gửi lại email";
        if (resendLockTimer) {
          clearInterval(resendLockTimer);
          resendLockTimer = null;
        }
        return;
      }
      resend.disabled = true;
      showResendLimitNotice(
        `Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau ${fmtMMSS(remain)}`,
      );
    };
    tick();
    resendLockTimer = setInterval(tick, 1000);
  }
  if (limiter.isLocked()) {
    startResendLockCountdown();
  }

  const status = document.getElementById("resendStatus");
  const statusText = document.getElementById("resendStatusText");
  let seconds = 60;
  function renderResendCountdown() {
    resend.textContent = `Gửi lại sau ${fmtMMSS(seconds * 1000)}`;
  }
  // showConfirm=false: dùng khi vừa vào trang (email đã được gửi từ bước
  // trước đó rồi, không cần hiện lại khung xác nhận xanh lá).
  // showConfirm=true: dùng khi người dùng CHỦ ĐỘNG bấm "Gửi lại email".
  function runResendCooldown(showConfirm) {
    hideResendLimitNotice();
    resend.disabled = true;
    resend.classList.remove("attention");
    if (showConfirm) {
      if (statusText)
        statusText.textContent =
          purpose === "reset"
            ? "Đã gửi email đặt lại mật khẩu"
            : "Đã gửi email xác thực";
      status.hidden = false;
    }
    seconds = 60;
    renderResendCountdown();
    const timer = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        clearInterval(timer);
        resend.disabled = false;
        resend.textContent = "Gửi lại email";
        resend.classList.add("attention"); // nhắc người dùng: có thể cần gửi lại
        status.hidden = true;
      } else {
        renderResendCountdown();
      }
    }, 1000);
  }

  resend.addEventListener("click", () => {
    if (limiter.isLocked()) {
      startResendLockCountdown();
      return;
    }
    if (limiter.registerAttempt()) {
      startResendLockCountdown();
      return;
    }
    // Gửi lại email = cấp liên kết mới, nên reset lại đồng hồ hết hạn
    sessionStorage.setItem(flow.sessionKey, String(Date.now() + LINK_TTL_MS));
    refreshContinueLink();
    runResendCooldown(true);
  });

  // Vừa vào trang này = email vừa được gửi ở bước trước, nên tự chạy
  // đồng hồ chờ luôn, không cần người dùng bấm lần đầu.
  if (!limiter.isLocked()) {
    runResendCooldown(false);
  }
}

const goalForm = document.getElementById("goalForm");
if (goalForm) {
  goalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = [
      ...goalForm.querySelectorAll('input[type="checkbox"]:checked'),
    ].map((x) => x.value);
    localStorage.setItem(
      "learningGoal",
      JSON.stringify({
        band:
          goalForm.querySelector('input[name="band"]:checked')?.value || "6.5",
        date: document.getElementById("examDate").value,
        level: document.getElementById("level").value,
        skills: selected,
      }),
    );
    location.href = "home.html";
  });
}

const forgotForm = document.getElementById("forgotForm");
if (forgotForm) {
  const limiter = emailRequestLimiter("reset");
  let forgotLockTimer = null;

  function forgotNoticeEls() {
    return {
      notice: document.getElementById("forgotNotice"),
      icon: document.getElementById("forgotNoticeIcon"),
      text: document.getElementById("forgotNoticeText"),
    };
  }
  function showForgotNotice(message) {
    const { notice, icon, text } = forgotNoticeEls();
    if (!notice) return;
    notice.classList.add("is-error");
    icon.innerHTML = ERROR_DOT_ICON;
    text.textContent = message;
    notice.hidden = false;
  }
  function hideForgotNotice() {
    const { notice } = forgotNoticeEls();
    if (notice) notice.hidden = true;
  }
  function startForgotLockCountdown() {
    const button = forgotForm.querySelector('button[type="submit"]');
    const tick = () => {
      const remain = limiter.lockUntil() - Date.now();
      if (remain <= 0) {
        limiter.clear();
        hideForgotNotice();
        if (button) button.disabled = false;
        if (forgotLockTimer) {
          clearInterval(forgotLockTimer);
          forgotLockTimer = null;
        }
        return;
      }
      if (button) button.disabled = true;
      showForgotNotice(
        `Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau ${fmtMMSS(remain)}`,
      );
    };
    tick();
    forgotLockTimer = setInterval(tick, 1000);
  }
  if (limiter.isLocked()) {
    startForgotLockCountdown();
  }

  forgotForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (limiter.isLocked()) {
      startForgotLockCountdown();
      return;
    }

    const emailInput = document.getElementById("forgotEmail");
    const email = emailInput.value.trim();
    const error = document.getElementById("forgotError");
    error.textContent = "";
    emailInput.classList.remove("input-error");
    hideForgotNotice();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      error.textContent = "Vui lòng nhập địa chỉ email hợp lệ.";
      emailInput.classList.add("input-error");
      return;
    }

    if (limiter.registerAttempt()) {
      startForgotLockCountdown();
      return;
    }

    sessionStorage.setItem("pendingEmail", email);
    sessionStorage.setItem("emailPurpose", "reset");
    // Yêu cầu mới = liên kết mới, xóa đồng hồ hết hạn cũ (nếu có)
    sessionStorage.removeItem("resetLinkExpiresAt");
    location.href = "check-email.html";
  });
}

const resetForm = document.getElementById("resetForm");
if (resetForm) {
  resetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const first = document.getElementById("newPassword").value;
    const second = document.getElementById("newPasswordConfirm").value;
    const error = document.getElementById("resetError");
    if (first.length < 8) {
      error.textContent = "Mật khẩu phải có ít nhất 8 ký tự.";
      return;
    }
    if (first !== second) {
      error.textContent = "Hai mật khẩu không khớp.";
      return;
    }
    error.textContent = "";
    sessionStorage.removeItem("resetLinkExpiresAt");
    alert("Đặt lại mật khẩu thành công (mô phỏng). Vui lòng đăng nhập lại.");
    location.href = "login.html";
  });
}

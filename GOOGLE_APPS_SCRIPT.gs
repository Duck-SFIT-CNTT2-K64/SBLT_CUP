/**
 * Google Apps Script — Tự động sync Google Form submissions đến SBLT CUP web app
 *
 * Hướng dẫn:
 * 1. Mở Google Form → Extensions → Apps Script
 * 2. Copy toàn bộ code này vào editor
 * 3. Thay đổi WEBHOOK_URL và WEBHOOK_SECRET bên dưới
 * 4. Chạy function `setupTrigger()` lần đầu để tạo trigger
 * 5. Deploy: Run → Deploy as web app (hoặc chỉ cần save, trigger sẽ tự chạy)
 */

// ==================== CONFIG ====================
const WEBHOOK_URL = "https://sbltcup.dev/api/webhooks/google-forms";
const WEBHOOK_SECRET = "YOUR_WEBHOOK_SECRET_HERE"; // Thay bằng secret từ .env

// ==================== FIELD MAPPING ====================
// Map Google Form câu hỏi → field name
// Thứ tự câu hỏi trong form (bắt đầu từ 0):
// 0: Email
// 1: Họ và tên (Trên CCCD)
// 2: Số điện thoại
// 3: Tên Ingame + Riot ID
// 4: Mức rank hiện tại

function onFormSubmit(e) {
  try {
    const responses = e.response.getItemResponses();

    // Extract answers theo thứ tự câu hỏi
    const email = responses[0].getResponse();
    const name = responses[1].getResponse();
    const phone = responses[2].getResponse();
    const ign = responses[3].getResponse();
    const rank = responses[4].getResponse();

    // Validate cơ bản
    if (!email || !name || !phone || !ign || !rank) {
      console.error("Missing required fields:", { email, name, phone, ign, rank });
      return;
    }

    // Gửi đến webhook
    const payload = {
      email: email.trim(),
      name: name.trim(),
      phone: phone.trim(),
      ign: ign.trim(),
      rank: rank.trim(),
      timestamp: new Date().toISOString(),
    };

    const options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-webhook-secret": WEBHOOK_SECRET,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    const statusCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (statusCode === 201) {
      console.log("✅ Đăng ký thành công:", email, "→", ign);
    } else if (statusCode === 409) {
      console.warn("⚠️ Trùng lặp:", email, "-", responseBody);
    } else {
      console.error("❌ Lỗi webhook:", statusCode, responseBody);
    }
  } catch (error) {
    console.error("❌ Script error:", error.toString());
  }
}

/**
 * Chạy function này lần đầu để tạo trigger tự động
 */
function setupTrigger() {
  // Xóa trigger cũ nếu có
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach((trigger) => {
    if (trigger.getHandlerFunction() === "onFormSubmit") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Lấy form hiện tại (phải chạy từ editor của Form)
  const form = FormApp.getActiveForm();

  // Tạo trigger mới
  ScriptApp.newTrigger("onFormSubmit")
    .forForm(form)
    .onFormSubmit()
    .create();

  console.log("✅ Trigger đã được tạo! Form submissions sẽ tự động sync đến webhook.");
}

/**
 * Test function — chạy để kiểm tra kết nối webhook
 */
function testWebhook() {
  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-webhook-secret": WEBHOOK_SECRET,
    },
    payload: JSON.stringify({
      email: "test@example.com",
      name: "Test User",
      phone: "0912345678",
      ign: "TestPlayer#VN1",
      rank: "Cao Thủ",
      timestamp: new Date().toISOString(),
    }),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
  console.log("Status:", response.getResponseCode());
  console.log("Body:", response.getContentText());
}

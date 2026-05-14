/**
 * Background Worker — chạy ngầm qua PM2
 * Thay đổi logic bên trong hàm tick() theo nhu cầu.
 * Vòng lặp có try/catch chống crash + sleep nhả CPU.
 */

const SLEEP_MS = 5000; // 5 giây giữa mỗi lần tick

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tick() {
  // TODO: Thêm logic worker của bạn ở đây
  // Ví dụ: xử lý queue, sync data, cleanup expired records, ...
}

async function main() {
  console.log(`[worker] Started — polling every ${SLEEP_MS}ms`);
  while (true) {
    try {
      await tick();
    } catch (err) {
      console.error("[worker] Tick error:", err.message || err);
    }
    await sleep(SLEEP_MS);
  }
}

main();

export function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function generateOtp() {
  // 6 chữ số, không bắt đầu bằng 0
  return String(Math.floor(100000 + Math.random() * 900000));
}

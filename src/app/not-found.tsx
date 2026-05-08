import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-[#dc2626] font-[family-name:var(--font-oswald)]">404</h1>
        <h2 className="text-2xl font-semibold text-white mt-4">Không tìm thấy trang</h2>
        <p className="text-gray-400 mt-2 max-w-md mx-auto">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <Link
          href="/"
          className="inline-block mt-8 px-6 py-3 bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] transition-colors font-medium"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

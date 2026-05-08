export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Đang tải...</p>
      </div>
    </div>
  );
}

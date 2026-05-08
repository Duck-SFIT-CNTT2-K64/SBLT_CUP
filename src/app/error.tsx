"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#dc2626] font-[family-name:var(--font-oswald)]">Lỗi</h1>
        <h2 className="text-xl text-white mt-4">Đã xảy ra lỗi không mong muốn</h2>
        <p className="text-gray-400 mt-2 max-w-md mx-auto">
          Chúng tôi đã ghi nhận lỗi này và sẽ khắc phục sớm nhất có thể.
        </p>
        <button
          onClick={reset}
          className="inline-block mt-8 px-6 py-3 bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] transition-colors font-medium"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Share2, Link2, Check, Globe, MessageCircle } from "lucide-react";

interface ShareButtonProps {
  title: string;
  url?: string;
  text?: string;
}

export function ShareButton({ title, url, text }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.href;
  const shareText = text || title;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
  };

  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error("Failed to share:", error);
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#888] hover:text-[#f5f5f5] bg-[#111] border border-[#222] rounded-lg hover:border-[#444] transition-colors"
      >
        <Share2 className="h-4 w-4" />
        Chia sẻ
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#111] border border-[#222] rounded-lg shadow-xl z-50 py-2">
            <button
              onClick={handleShareTwitter}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[#888] hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-colors"
            >
              <Globe className="h-4 w-4" />
              Twitter / X
            </button>
            <button
              onClick={handleShareFacebook}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[#888] hover:text-[#4267B2] hover:bg-[#4267B2]/10 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Facebook
            </button>
            <div className="border-t border-[#222] my-1" />
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[#888] hover:text-[#f5f5f5] hover:bg-white/5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-400" />
                  <span className="text-green-400">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Sao chép liên kết
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

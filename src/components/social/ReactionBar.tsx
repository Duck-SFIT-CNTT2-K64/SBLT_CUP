"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ThumbsUp, Flame, Trophy, HandMetal } from "lucide-react";

const REACTION_CONFIG = {
  LIKE: { icon: ThumbsUp, label: "Thích", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  FIRE: { icon: Flame, label: "Fire", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  TROPHY: { icon: Trophy, label: "Trophy", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  CLAP: { icon: HandMetal, label: "Vỗ tay", color: "text-purple-400", bgColor: "bg-purple-500/20" },
};

interface ReactionBarProps {
  type: string;
  entityId: string;
}

export function ReactionBar({ type, entityId }: ReactionBarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/reactions/${type}/${entityId}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setCounts(data.counts);
          setUserReactions(data.userReactions);
        }
      } catch (error) {
        console.error("Failed to fetch reactions:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [type, entityId]);

  const handleReaction = async (reactionType: string) => {
    if (!session) {
      router.push("/auth/login");
      return;
    }

    try {
      const res = await fetch(`/api/reactions/${type}/${entityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.action === "added") {
          setCounts((prev) => ({ ...prev, [reactionType]: (prev[reactionType] || 0) + 1 }));
          setUserReactions((prev) => [...prev, reactionType]);
        } else {
          setCounts((prev) => ({ ...prev, [reactionType]: Math.max(0, (prev[reactionType] || 0) - 1) }));
          setUserReactions((prev) => prev.filter((r) => r !== reactionType));
        }
      }
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-2">
        {Object.keys(REACTION_CONFIG).map((key) => (
          <div key={key} className="w-16 h-8 bg-[#111] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(REACTION_CONFIG).map(([key, config]) => {
        const count = counts[key] || 0;
        const isActive = userReactions.includes(key);
        const Icon = config.icon;

        return (
          <button
            key={key}
            onClick={() => handleReaction(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? `${config.bgColor} ${config.color} border border-current/25`
                : "bg-[#111] text-[#888] border border-[#222] hover:border-[#444]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

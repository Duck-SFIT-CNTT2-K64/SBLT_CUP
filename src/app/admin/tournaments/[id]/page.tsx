"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Save, Trash2, ArrowLeft, Users, X, Trophy, Pencil, Check, Shuffle, ChevronRight, UserCheck, Activity } from "lucide-react";

interface Player { id: string; ign: string; isGuest: boolean; }
interface GroupPlayer { id: string; playerId: string; player: Player; totalPoints: number; }
interface GameResult { id: string; playerId: string; placement: number; points: number; player: Player; }
interface Game { id: string; gameNumber: number; status: string; results: GameResult[]; }
interface Group { id: string; name: string; groupOrder: number; players: GroupPlayer[]; games: Game[]; }
interface Stage { id: string; name: string; stageType: string; stageOrder: number; date: string; startTime: string; totalGames: number; status: string; groups: Group[]; }
interface Tournament { id: string; name: string; season: number; status: string; stages: Stage[]; registrations: { id: string; status: string; player: Player; }[]; }

interface DrawPreview { groupId: string; groupName: string; players: { id: string; ign: string; rank: string | null; isGuest: boolean }[]; }
interface AdvancePreview { groupName: string; players: { playerId: string; ign: string; totalPoints: number; top1Count: number; rank: number; advancing: boolean }[]; }
interface CheckinSummary { total: number; checkedIn: number; notCheckedIn: number; registrations: { id: string; checkedIn: boolean; checkInTime: string | null; player: { ign: string; isGuest: boolean } }[]; }
interface StatusInfo { currentStatus: string; currentLabel: string; validTransitions: { status: string; label: string }[]; suggestions: { status: string; label: string; reason: string }[]; stats: { approvedPlayers: number; maxPlayers: number } }

const SCORING: Record<number, number> = { 1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 };

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: "bg-zinc-700 text-gray-300",
  REGISTRATION_OPEN: "bg-green-600/20 text-green-400",
  REGISTRATION_CLOSED: "bg-yellow-600/20 text-yellow-400",
  IN_PROGRESS: "bg-blue-600/20 text-blue-400",
  COMPLETED: "bg-purple-600/20 text-purple-400",
  CANCELLED: "bg-red-600/20 text-red-400",
};

export default function AdminTournamentDetailPage() {
  const params = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editingResults, setEditingResults] = useState<{ playerId: string; placement: number }[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [showCreateStage, setShowCreateStage] = useState(false);

  // Tool panels
  const [activePanel, setActivePanel] = useState<"status" | "checkin" | "draw" | "advance" | null>(null);
  const [statusInfo, setStatusInfo] = useState<StatusInfo | null>(null);
  const [checkinData, setCheckinData] = useState<CheckinSummary | null>(null);
  const [drawPreview, setDrawPreview] = useState<DrawPreview[] | null>(null);
  const [advancePreview, setAdvancePreview] = useState<AdvancePreview[] | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelMsg, setPanelMsg] = useState<string | null>(null);
  const [stageForm, setStageForm] = useState({ name: "", stageType: "QUALIFIER", stageOrder: 1, date: "", startTime: "", totalGames: 3 });

  useEffect(() => { fetchTournament(); }, [params.id]);

  const fetchTournament = async () => {
    try {
      const res = await fetch(`/api/tournaments/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setTournament(data);
        if (data.stages.length > 0 && !selectedStage) setSelectedStage(data.stages[0].id);
      }
    } finally { setLoading(false); }
  };

  // ── Tool panel handlers ────────────────────────────────
  const openPanel = async (panel: typeof activePanel) => {
    setActivePanel(panel);
    setPanelMsg(null);
    setPanelLoading(true);
    try {
      if (panel === "status") {
        const res = await fetch(`/api/tournaments/${params.id}/status`);
        if (res.ok) setStatusInfo(await res.json());
      } else if (panel === "checkin") {
        const res = await fetch(`/api/tournaments/${params.id}/checkin`);
        if (res.ok) setCheckinData(await res.json());
      } else if (panel === "draw" && selectedStage) {
        const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/draw`);
        if (res.ok) { const d = await res.json(); setDrawPreview(d.preview); }
      } else if (panel === "advance" && selectedStage) {
        const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/advance`);
        if (res.ok) { const d = await res.json(); setAdvancePreview(d.preview); }
      }
    } finally { setPanelLoading(false); }
  };

  const handleStatusChange = async (newStatus: string) => {
    const res = await fetch(`/api/tournaments/${params.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    setPanelMsg(data.message || data.error);
    if (res.ok) { fetchTournament(); openPanel("status"); }
  };

  const handleStageStatus = async (stageId: string, newStatus: string) => {
    const res = await fetch(`/api/tournaments/${params.id}/stages/${stageId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    setPanelMsg(data.message || data.error);
    if (res.ok) fetchTournament();
  };

  const handleCheckinAction = async (registrationId: string, action: string) => {
    const res = await fetch(`/api/tournaments/${params.id}/checkin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId, action }),
    });
    const data = await res.json();
    setPanelMsg(data.message || data.error);
    if (res.ok) openPanel("checkin");
  };

  const handleConfirmDraw = async () => {
    if (!selectedStage || !drawPreview) return;
    const assignments = drawPreview.map((g) => ({
      groupId: g.groupId,
      playerIds: g.players.map((p) => p.id),
    }));
    const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/draw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignments }),
    });
    const data = await res.json();
    setPanelMsg(data.message || data.error);
    if (res.ok) { fetchTournament(); setDrawPreview(null); }
  };

  const handleConfirmAdvance = async () => {
    if (!selectedStage) return;
    const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setPanelMsg(data.message || data.error);
    if (res.ok) { fetchTournament(); setAdvancePreview(null); }
  };

  // ── Stage ──────────────────────────────────────────────
  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/tournaments/${params.id}/stages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...stageForm, date: new Date(stageForm.date).toISOString() }),
    });
    if (res.ok) {
      setShowCreateStage(false);
      setStageForm({ name: "", stageType: "QUALIFIER", stageOrder: 1, date: "", startTime: "", totalGames: 3 });
      fetchTournament();
    }
  };

  // ── Groups ─────────────────────────────────────────────
  const handleCreateGroups = async (stageId: string, count: number) => {
    const stage = tournament?.stages.find((s) => s.id === stageId);
    if (!stage) return;
    const existing = stage.groups.length;
    await Promise.all(
      Array.from({ length: count }, (_, i) => {
        const n = existing + i + 1;
        return fetch(`/api/tournaments/${params.id}/stages/${stageId}/groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: `Bảng ${String.fromCharCode(64 + n)}`, groupOrder: n }),
        });
      })
    );
    fetchTournament();
  };

  const handleRenameGroup = async (groupId: string, newName: string) => {
    const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) { setEditingGroupId(null); fetchTournament(); }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Xóa bảng đấu này? Tất cả dữ liệu trong bảng sẽ bị xóa.")) return;
    const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/groups/${groupId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      if (selectedGroup === groupId) setSelectedGroup(null);
      fetchTournament();
    }
  };

  // ── Players ────────────────────────────────────────────
  const handleAddPlayer = async (groupId: string, playerId: string) => {
    const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/groups/${groupId}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    if (res.ok) fetchTournament();
  };

  const handleRemovePlayer = async (groupId: string, playerId: string) => {
    if (!confirm("Xóa tuyển thủ này khỏi bảng?")) return;
    const res = await fetch(
      `/api/tournaments/${params.id}/stages/${selectedStage}/groups/${groupId}/players?playerId=${playerId}`,
      { method: "DELETE" }
    );
    if (res.ok) fetchTournament();
  };

  // ── Games ──────────────────────────────────────────────
  const handleCreateGames = async (groupId: string, count: number) => {
    const group = tournament?.stages.flatMap((s) => s.groups).find((g) => g.id === groupId);
    if (!group) return;
    const existing = group.games.length;
    await Promise.all(
      Array.from({ length: count }, (_, i) =>
        fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/groups/${groupId}/games`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameNumber: existing + i + 1 }),
        })
      )
    );
    fetchTournament();
  };

  // ── Quick score entry ──────────────────────────────────
  const handleQuickScore = async (group: Group) => {
    // Find last game without results, or create a new one
    const sortedGames = [...group.games].sort((a, b) => a.gameNumber - b.gameNumber);
    const targetGame = sortedGames.find((g) => g.results.length === 0)
      ?? (sortedGames.length > 0 && sortedGames[sortedGames.length - 1].results.length > 0 ? null : null);

    if (targetGame) {
      startEditing(targetGame, group.players);
      return;
    }

    // All games have results (or no games) — create a new one
    const newGameNumber = group.games.length + 1;
    const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/groups/${group.id}/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameNumber: newGameNumber }),
    });
    if (res.ok) {
      const newGame: Game = await res.json();
      // Refresh then open edit for the new game
      await fetchTournament();
      // After fetch, open editing with fresh data — use the returned game id
      const defaultResults = group.players.map((gp, i) => ({ playerId: gp.playerId, placement: i + 1 }));
      setEditingResults(defaultResults);
      setEditingGameId(newGame.id);
    }
  };

  // ── Results ────────────────────────────────────────────
  const startEditing = (game: Game, players: GroupPlayer[]) => {
    // Pre-fill with existing results or default placement order
    const existing = game.results.map((r) => ({ playerId: r.playerId, placement: r.placement }));
    const missing = players
      .filter((gp) => !existing.find((r) => r.playerId === gp.playerId))
      .map((gp, i) => ({ playerId: gp.playerId, placement: existing.length + i + 1 }));
    setEditingResults([...existing, ...missing]);
    setEditingGameId(game.id);
  };

  const handleSaveResults = async (gameId: string) => {
    const res = await fetch(`/api/tournaments/${params.id}/games/${gameId}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results: editingResults }),
    });
    if (res.ok) {
      setEditingResults([]);
      setEditingGameId(null);
      fetchTournament();
    }
  };

  // Move player up/down in placement order
  const movePlacement = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= editingResults.length) return;
    const arr = [...editingResults];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    // Re-assign placements by position
    setEditingResults(arr.map((r, i) => ({ ...r, placement: i + 1 })));
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Đang tải...</div>;
  if (!tournament) return <div className="p-8 text-center text-gray-400">Không tìm thấy giải đấu</div>;

  const currentStage = tournament.stages.find((s) => s.id === selectedStage);
  const currentGroup = currentStage?.groups.find((g) => g.id === selectedGroup);
  const approvedPlayers = tournament.registrations.filter((r) => r.status === "APPROVED").map((r) => r.player);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/tournaments" className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{tournament.name}</h1>
            <p className="text-gray-400 text-sm">Mùa {tournament.season} — Quản lý chi tiết</p>
          </div>
          <Link
            href={`/admin/tournaments/${params.id}/prizes`}
            className="ml-auto bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          >
            <Trophy className="h-4 w-4 text-red-500" /> Giải thưởng
          </Link>
          <div className="flex gap-1">
            {["registrations", "standings", "results", "prizes"].map((type) => (
              <a
                key={type}
                href={`/api/tournaments/${params.id}/export?type=${type}`}
                download
                className="bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white text-xs px-2 py-1.5 rounded-lg transition-colors"
                title={`Export ${type} CSV`}
              >
                ↓ {type === "registrations" ? "ĐK" : type === "standings" ? "XH" : type === "results" ? "KQ" : "GT"}
              </a>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Vòng đấu", value: tournament.stages.length },
            { label: "Bảng đấu", value: tournament.stages.reduce((s, st) => s + st.groups.length, 0) },
            { label: "Tuyển thủ", value: tournament.registrations.filter((r) => r.status === "APPROVED").length },
            { label: "Trận đấu", value: tournament.stages.reduce((s, st) => s + st.groups.reduce((gs, g) => gs + g.games.length, 0), 0) },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Stage tabs */}
        {/* Tool buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => activePanel === "status" ? setActivePanel(null) : openPanel("status")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${activePanel === "status" ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"}`}>
            <Activity className="h-3.5 w-3.5" /> Trạng thái
          </button>
          <button onClick={() => activePanel === "checkin" ? setActivePanel(null) : openPanel("checkin")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${activePanel === "checkin" ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"}`}>
            <UserCheck className="h-3.5 w-3.5" /> Check-in
          </button>
          {selectedStage && <>
            <button onClick={() => activePanel === "draw" ? setActivePanel(null) : openPanel("draw")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${activePanel === "draw" ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"}`}>
              <Shuffle className="h-3.5 w-3.5" /> Bốc thăm
            </button>
            <button onClick={() => activePanel === "advance" ? setActivePanel(null) : openPanel("advance")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${activePanel === "advance" ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"}`}>
              <ChevronRight className="h-3.5 w-3.5" /> Thăng hạng
            </button>
          </>}
        </div>

        {/* Tool Panel */}
        {activePanel && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">
                {activePanel === "status" && "Quản lý trạng thái giải đấu"}
                {activePanel === "checkin" && "Check-in tuyển thủ"}
                {activePanel === "draw" && "Bốc thăm chia bảng"}
                {activePanel === "advance" && "Xếp hạng & Thăng hạng"}
              </h3>
              <button onClick={() => { setActivePanel(null); setPanelMsg(null); }} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            {panelMsg && (
              <div className="bg-zinc-800 border border-zinc-600 text-sm px-3 py-2 rounded-lg mb-4 text-gray-200">{panelMsg}</div>
            )}

            {panelLoading ? (
              <div className="text-center text-gray-400 py-4 text-sm">Đang tải...</div>
            ) : (
              <>
                {activePanel === "status" && statusInfo && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">Hiện tại:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[statusInfo.currentStatus]}`}>{statusInfo.currentLabel}</span>
                      <span className="text-xs text-gray-500">{statusInfo.stats.approvedPlayers}/{statusInfo.stats.maxPlayers} tuyển thủ</span>
                    </div>
                    {statusInfo.suggestions.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Gợi ý:</p>
                        {statusInfo.suggestions.map((s) => (
                          <div key={s.status} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2 mb-1.5">
                            <div><span className="text-sm font-medium">{s.label}</span><span className="text-xs text-gray-400 ml-2">— {s.reason}</span></div>
                            <button onClick={() => handleStatusChange(s.status)} className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-lg">Chuyển</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Chuyển thủ công:</p>
                      <div className="flex flex-wrap gap-2">
                        {statusInfo.validTransitions.map((t) => (
                          <button key={t.status} onClick={() => handleStatusChange(t.status)} className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg border border-zinc-700">→ {t.label}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Trạng thái vòng đấu:</p>
                      <div className="space-y-1.5">
                        {tournament.stages.map((stage) => (
                          <div key={stage.id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2">
                            <span className="text-sm">{stage.name}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${stage.status === "COMPLETED" ? "bg-green-500/20 text-green-400" : stage.status === "IN_PROGRESS" ? "bg-blue-500/20 text-blue-400" : "bg-zinc-700 text-gray-400"}`}>
                                {stage.status === "COMPLETED" ? "Xong" : stage.status === "IN_PROGRESS" ? "Đang đấu" : "Chờ"}
                              </span>
                              {stage.status === "SCHEDULED" && <button onClick={() => handleStageStatus(stage.id, "IN_PROGRESS")} className="text-xs text-blue-400 hover:text-blue-300">Bắt đầu</button>}
                              {stage.status === "IN_PROGRESS" && <button onClick={() => handleStageStatus(stage.id, "COMPLETED")} className="text-xs text-green-400 hover:text-green-300">Kết thúc</button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activePanel === "checkin" && checkinData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-800 rounded-lg p-3 text-center"><div className="text-xl font-bold">{checkinData.total}</div><div className="text-xs text-gray-400">Tổng</div></div>
                      <div className="bg-green-500/10 rounded-lg p-3 text-center"><div className="text-xl font-bold text-green-400">{checkinData.checkedIn}</div><div className="text-xs text-gray-400">Đã check-in</div></div>
                      <div className="bg-red-500/10 rounded-lg p-3 text-center"><div className="text-xl font-bold text-red-400">{checkinData.notCheckedIn}</div><div className="text-xs text-gray-400">Chưa check-in</div></div>
                    </div>
                    {checkinData.notCheckedIn > 0 && (
                      <button onClick={() => handleCheckinAction("", "bulk_reject_no_checkin")} className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm py-2 rounded-lg border border-red-600/30">
                        Từ chối tất cả {checkinData.notCheckedIn} người chưa check-in
                      </button>
                    )}
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {checkinData.registrations.map((r) => (
                        <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-zinc-800 rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${r.checkedIn ? "bg-green-400" : "bg-red-400"}`} />
                            <span>{r.player.ign}</span>
                            {r.player.isGuest && <span className="text-xs text-red-400">Khách</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            {r.checkedIn ? (
                              <span className="text-xs text-green-400">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString("vi-VN") : "✓"}</span>
                            ) : (
                              <button onClick={() => handleCheckinAction(r.id, "checkin")} className="text-xs text-blue-400 hover:text-blue-300">Force check-in</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePanel === "draw" && (
                  <div className="space-y-4">
                    {drawPreview ? (
                      <>
                        <p className="text-xs text-gray-400">Preview — ★ = Khách mời. Bấm "Xác nhận" để lưu hoặc "Bốc lại" để random lại.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto">
                          {drawPreview.map((group) => (
                            <div key={group.groupId} className="bg-zinc-800 rounded-lg p-3">
                              <p className="text-xs font-semibold text-gray-300 mb-2">{group.groupName}</p>
                              {group.players.map((p) => (
                                <div key={p.id} className="text-xs text-gray-400 py-0.5 flex items-center gap-1">
                                  {p.isGuest && <span className="text-red-400">★</span>}{p.ign}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleConfirmDraw} className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg">✓ Xác nhận</button>
                          <button onClick={() => openPanel("draw")} className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm px-4 py-2 rounded-lg">↺ Bốc lại</button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-400 text-sm mb-3">Bốc thăm ngẫu nhiên có seeding theo rank</p>
                        <button onClick={() => openPanel("draw")} className="bg-red-600 hover:bg-red-700 text-white text-sm px-6 py-2 rounded-lg">Bốc thăm</button>
                      </div>
                    )}
                  </div>
                )}

                {activePanel === "advance" && (
                  <div className="space-y-4">
                    {advancePreview ? (
                      <>
                        <p className="text-xs text-gray-400">Xếp hạng: Tổng điểm → Top1 → Top4 → Placement tốt nhất. Màu xanh = thăng hạng.</p>
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                          {advancePreview.map((group) => (
                            <div key={group.groupName} className="bg-zinc-800 rounded-lg p-3">
                              <p className="text-xs font-semibold text-gray-300 mb-2">{group.groupName}</p>
                              {group.players.map((p) => (
                                <div key={p.playerId} className={`flex items-center justify-between text-xs py-1 ${p.advancing ? "text-green-400" : "text-gray-500"}`}>
                                  <span>{p.rank}. {p.ign}</span>
                                  <span>{p.totalPoints}đ {p.advancing ? "→ Thăng" : ""}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                        <button onClick={handleConfirmAdvance} className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg">✓ Xác nhận & Chuyển sang vòng sau</button>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-400 text-sm mb-3">Tính xếp hạng và chọn tuyển thủ thăng hạng</p>
                        <button onClick={() => openPanel("advance")} className="bg-red-600 hover:bg-red-700 text-white text-sm px-6 py-2 rounded-lg">Xem kết quả xếp hạng</button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Stage tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tournament.stages.map((stage) => (
            <button
              key={stage.id}
              onClick={() => { setSelectedStage(stage.id); setSelectedGroup(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedStage === stage.id ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
              }`}
            >
              {stage.name}
            </button>
          ))}
          <button
            onClick={() => setShowCreateStage(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-zinc-800 text-red-400 hover:bg-zinc-700 flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Thêm vòng
          </button>
        </div>

        {currentStage && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Group list */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Bảng đấu</h2>
                  <button onClick={() => handleCreateGroups(currentStage.id, 1)} className="text-red-500 hover:text-red-400">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {currentStage.groups.map((group) => (
                    <div
                      key={group.id}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors group/item flex items-center justify-between ${
                        selectedGroup === group.id
                          ? "bg-red-600/15 border border-red-600/40"
                          : "bg-zinc-800 hover:bg-zinc-700"
                      }`}
                    >
                      {editingGroupId === group.id ? (
                        /* ── Inline rename ── */
                        <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                          <input
                            autoFocus
                            value={editingGroupName}
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameGroup(group.id, editingGroupName);
                              if (e.key === "Escape") setEditingGroupId(null);
                            }}
                            className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-600"
                          />
                          <button
                            onClick={() => handleRenameGroup(group.id, editingGroupName)}
                            className="text-green-400 hover:text-green-300"
                            title="Lưu"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingGroupId(null)}
                            className="text-gray-400 hover:text-white"
                            title="Hủy"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            className="flex-1 text-left"
                            onClick={() => setSelectedGroup(group.id)}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{group.name}</span>
                              <span className="text-xs text-gray-400">{group.players.length} người</span>
                            </div>
                          </button>
                          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingGroupId(group.id);
                                setEditingGroupName(group.name);
                              }}
                              className="text-gray-400 hover:text-white p-1 rounded"
                              title="Đổi tên"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGroup(group.id);
                              }}
                              className="text-gray-400 hover:text-red-400 p-1 rounded"
                              title="Xóa bảng"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {currentStage.groups.length === 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-gray-500 text-center mb-3">Tạo nhanh</p>
                    {[{ n: 8, label: "8 bảng (Vòng Loại)" }, { n: 4, label: "4 bảng (Vòng 2)" }, { n: 2, label: "2 bảng (Vòng 3)" }].map((opt) => (
                      <button
                        key={opt.n}
                        onClick={() => handleCreateGroups(currentStage.id, opt.n)}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Group detail */}
            <div className="lg:col-span-2">
              {currentGroup ? (
                <div className="space-y-5">
                  {/* Players section */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{currentGroup.name} — Tuyển thủ</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuickScore(currentGroup)}
                          className="bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          title="Nhập điểm nhanh"
                        >
                          🎮 Nhập điểm nhanh
                        </button>
                        <select
                          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                          onChange={(e) => {
                            if (e.target.value) { handleAddPlayer(currentGroup.id, e.target.value); e.target.value = ""; }
                          }}
                        >
                          <option value="">+ Thêm tuyển thủ</option>
                          {approvedPlayers
                            .filter((p) => !currentGroup.players.find((gp) => gp.playerId === p.id))
                            .map((p) => (
                              <option key={p.id} value={p.id}>{p.ign}{p.isGuest ? " (Khách mời)" : ""}</option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {currentGroup.players.length > 0 ? (
                      <div className="space-y-1.5">
                        {[...currentGroup.players]
                          .sort((a, b) => b.totalPoints - a.totalPoints)
                          .map((gp, idx) => (
                            <div
                              key={gp.id}
                              className="flex items-center justify-between px-3 py-2.5 bg-zinc-800 rounded-lg group"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 w-5">{idx + 1}</span>
                                <span className="text-sm font-medium">{gp.player.ign}</span>
                                {gp.player.isGuest && (
                                  <span className="text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full">Khách mời</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-red-400">{gp.totalPoints} điểm</span>
                                <button
                                  onClick={() => handleRemovePlayer(currentGroup.id, gp.playerId)}
                                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                                  title="Xóa khỏi bảng"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 text-sm py-4">Chưa có tuyển thủ</p>
                    )}
                  </div>

                  {/* Games section */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Trận đấu</h3>
                      <button
                        onClick={() => handleCreateGames(currentGroup.id, 1)}
                        className="text-red-500 hover:text-red-400"
                        title="Thêm game"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>

                    {currentGroup.games.length === 0 ? (
                      <div className="space-y-2">
                        <p className="text-center text-gray-500 text-sm py-2">Chưa có trận đấu</p>
                        {currentGroup.players.length >= 2 && (
                          <button
                            onClick={() => handleCreateGames(currentGroup.id, 3)}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm"
                          >
                            Tạo 3 games (BO3)
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {[...currentGroup.games]
                          .sort((a, b) => a.gameNumber - b.gameNumber)
                          .map((game) => (
                            <div key={game.id} className="bg-zinc-800 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium">Game {game.gameNumber}</h4>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  game.status === "COMPLETED" ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-gray-400"
                                }`}>
                                  {game.status === "COMPLETED" ? "Đã xong" : "Chưa bắt đầu"}
                                </span>
                              </div>

                              {editingGameId === game.id ? (
                                /* ── Edit mode ── */
                                <div>
                                  <p className="text-xs text-gray-500 mb-3">
                                    Kéo thứ tự hoặc dùng ↑↓ để sắp xếp. Điểm tự tính theo placement.
                                  </p>
                                  <div className="space-y-1.5 mb-4">
                                    {editingResults.map((r, idx) => {
                                      const player = currentGroup.players.find((gp) => gp.playerId === r.playerId);
                                      const pts = SCORING[r.placement] ?? 0;
                                      return (
                                        <div key={r.playerId} className="flex items-center gap-2 bg-zinc-700 rounded-lg px-3 py-2">
                                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                            r.placement === 1 ? "bg-red-600 text-white" :
                                            r.placement <= 4 ? "bg-zinc-500 text-white" : "bg-zinc-600 text-gray-300"
                                          }`}>
                                            {r.placement}
                                          </span>
                                          <span className="flex-1 text-sm">{player?.player.ign ?? "?"}</span>
                                          <span className="text-xs text-red-400 font-semibold w-12 text-right">{pts} điểm</span>
                                          <div className="flex flex-col gap-0.5">
                                            <button onClick={() => movePlacement(idx, -1)} disabled={idx === 0}
                                              className="text-gray-400 hover:text-white disabled:opacity-20 text-xs leading-none">▲</button>
                                            <button onClick={() => movePlacement(idx, 1)} disabled={idx === editingResults.length - 1}
                                              className="text-gray-400 hover:text-white disabled:opacity-20 text-xs leading-none">▼</button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSaveResults(game.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                                    >
                                      <Save className="h-4 w-4" /> Lưu kết quả
                                    </button>
                                    <button
                                      onClick={() => { setEditingResults([]); setEditingGameId(null); }}
                                      className="text-gray-400 hover:text-white px-4 py-2 text-sm"
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* ── View mode ── */
                                <>
                                  {game.results.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-1.5 mb-3">
                                      {[...game.results]
                                        .sort((a, b) => a.placement - b.placement)
                                        .map((r) => (
                                          <div key={r.id} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm ${
                                            r.placement <= 4 ? "bg-zinc-700" : "bg-zinc-700/50"
                                          }`}>
                                            <div className="flex items-center gap-2">
                                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                                r.placement === 1 ? "bg-red-600 text-white" : "bg-zinc-600 text-gray-300"
                                              }`}>{r.placement}</span>
                                              <span className="text-gray-200 truncate max-w-[80px]">{r.player.ign}</span>
                                            </div>
                                            <span className="text-red-400 font-semibold">{r.points}đ</span>
                                          </div>
                                        ))}
                                    </div>
                                  ) : (
                                    <p className="text-center text-gray-500 text-sm py-2 mb-2">Chưa có kết quả</p>
                                  )}
                                  <button
                                    onClick={() => startEditing(game, currentGroup.players)}
                                    className="text-red-500 hover:text-red-400 text-sm font-medium"
                                  >
                                    {game.results.length > 0 ? "✏️ Sửa kết quả" : "➕ Nhập kết quả"}
                                  </button>
                                </>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                  <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">Chọn bảng đấu</h3>
                  <p className="text-gray-500 text-sm">Chọn một bảng bên trái để quản lý tuyển thủ và nhập điểm</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Stage Modal */}
      {showCreateStage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">Tạo vòng đấu mới</h2>
              <button onClick={() => setShowCreateStage(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tên vòng đấu *</label>
                <input type="text" value={stageForm.name} onChange={(e) => setStageForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Vòng Loại" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Loại vòng *</label>
                <select value={stageForm.stageType} onChange={(e) => setStageForm((p) => ({ ...p, stageType: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600">
                  <option value="QUALIFIER">Vòng Loại</option>
                  <option value="SEMI_1">Bán Kết 1</option>
                  <option value="SEMI_2">Bán Kết 2</option>
                  <option value="FINAL">Chung Kết</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Thứ tự *</label>
                  <input type="number" value={stageForm.stageOrder} min={1}
                    onChange={(e) => setStageForm((p) => ({ ...p, stageOrder: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Số games</label>
                  <input type="number" value={stageForm.totalGames} min={1}
                    onChange={(e) => setStageForm((p) => ({ ...p, totalGames: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Ngày thi đấu *</label>
                <input type="date" value={stageForm.date} onChange={(e) => setStageForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Giờ bắt đầu *</label>
                <input type="text" value={stageForm.startTime} placeholder="19:00"
                  onChange={(e) => setStageForm((p) => ({ ...p, startTime: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600" required />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateStage(false)} className="px-4 py-2 text-gray-400 hover:text-white">Hủy</button>
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg">Tạo vòng đấu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

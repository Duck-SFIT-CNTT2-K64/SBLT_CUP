"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Save, Trash2, ArrowLeft, Users, X, Trophy, Pencil, Check, Shuffle, ChevronRight, UserCheck, Activity, Target } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import WheelSpinner from "@/components/WheelSpinner";

interface Player { id: string; ign: string; isGuest: boolean; }
interface GroupPlayer { id: string; playerId: string; player: Player; totalPoints: number; }
interface GameResult { id: string; playerId: string; placement: number; points: number; player: Player; }
interface Game { id: string; gameNumber: number; status: string; results: GameResult[]; }
interface Group { id: string; name: string; groupOrder: number; players: GroupPlayer[]; games: Game[]; }
interface Stage { id: string; name: string; stageType: string; stageOrder: number; date: string; startTime: string; totalGames: number; status: string; groups: Group[]; }
interface Tournament { id: string; name: string; season: number; status: string; stages: Stage[]; registrations: { id: string; status: string; player: Player; }[]; }

interface DrawPreview { groupId: string; groupName: string; players: { id: string; ign: string; rank: string | null; isGuest: boolean }[]; }
interface AdvancePreview { groupName: string; players: { playerId: string; ign: string; totalPoints: number; top1Count: number; rank: number; advancing: boolean }[]; }
interface WheelItemData { id: string; label: string; type: "advancing" | "guest"; fromGroup?: string; }
interface Semi1DrawData {
  stageType: string;
  advancingPlayers: { id: string; ign: string; rank: string | null; fromGroup: string; finalRank: number }[];
  guestPlayers: { id: string; ign: string; rank: string | null; isGuest: boolean }[];
  allWheelItems: WheelItemData[];
  groups: { id: string; name: string; currentCount: number }[];
  totalAdvancing: number;
  totalGuests: number;
}
interface CheckinSummary { total: number; checkedIn: number; notCheckedIn: number; registrations: { id: string; checkedIn: boolean; checkInTime: string | null; player: { ign: string; isGuest: boolean } }[]; }
interface StatusInfo { currentStatus: string; currentLabel: string; validTransitions: { status: string; label: string }[]; suggestions: { status: string; label: string; reason: string }[]; stats: { approvedPlayers: number; maxPlayers: number } }

const SCORING: Record<number, number> = { 1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 };

const STATUS_MAP: Record<string, { label: string; variant: "default" | "green" | "yellow" | "blue" | "live" | "red" }> = {
  UPCOMING: { label: "Sắp diễn ra", variant: "default" },
  REGISTRATION_OPEN: { label: "Đang mở đăng ký", variant: "green" },
  REGISTRATION_CLOSED: { label: "Đã đóng đăng ký", variant: "yellow" },
  IN_PROGRESS: { label: "Đang diễn ra", variant: "blue" },
  COMPLETED: { label: "Đã kết thúc", variant: "default" },
  CANCELLED: { label: "Đã hủy", variant: "red" },
};

const STAGE_STATUS_MAP: Record<string, { label: string; variant: "default" | "green" | "blue" }> = {
  SCHEDULED: { label: "Chờ", variant: "default" },
  IN_PROGRESS: { label: "Đang đấu", variant: "blue" },
  COMPLETED: { label: "Xong", variant: "green" },
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

  const [activePanel, setActivePanel] = useState<"status" | "checkin" | "draw" | "advance" | "predictions" | null>(null);
  const [statusInfo, setStatusInfo] = useState<StatusInfo | null>(null);
  const [checkinData, setCheckinData] = useState<CheckinSummary | null>(null);
  const [drawPreview, setDrawPreview] = useState<DrawPreview[] | null>(null);
  const [semi1DrawData, setSemi1DrawData] = useState<Semi1DrawData | null>(null);
  const [drawMode, setDrawMode] = useState<"random" | "wheel" | null>(null);
  const [advancePreview, setAdvancePreview] = useState<AdvancePreview[] | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelMsg, setPanelMsg] = useState<string | null>(null);
  const [stageForm, setStageForm] = useState({ name: "", stageType: "QUALIFIER", stageOrder: 1, date: "", startTime: "", totalGames: 3 });
  const [playerSearch, setPlayerSearch] = useState("");
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => { fetchTournament(); }, [params.id]);

  const fetchTournament = async () => {
    try {
      const res = await fetch(`/api/tournaments/${params.id}`);
      if (res.ok) { const data = await res.json(); setTournament(data); if (data.stages.length > 0 && !selectedStage) setSelectedStage(data.stages[0].id); }
    } finally { setLoading(false); }
  };

  const openPanel = async (panel: typeof activePanel) => {
    setActivePanel(panel); setPanelMsg(null); setPanelLoading(true); setDrawMode(null); setSemi1DrawData(null); setDrawPreview(null);
    try {
      if (panel === "status") { const res = await fetch(`/api/tournaments/${params.id}/status`); if (res.ok) setStatusInfo(await res.json()); }
      else if (panel === "checkin") { const res = await fetch(`/api/tournaments/${params.id}/checkin`); if (res.ok) setCheckinData(await res.json()); }
      else if (panel === "draw" && selectedStage) {
        const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/draw`);
        if (res.ok) {
          const d = await res.json();
          if (d.stageType === "SEMI_1") {
            setSemi1DrawData(d);
          } else {
            setDrawPreview(d.preview);
          }
        }
      }
      else if (panel === "advance" && selectedStage) { const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/advance`); if (res.ok) { const d = await res.json(); setAdvancePreview(d.preview); } }
      else if (panel === "predictions") { /* No data to fetch — uses tournament.stages directly */ }
    } finally { setPanelLoading(false); }
  };

  const handleStatusChange = async (newStatus: string) => {
    const res = await fetch(`/api/tournaments/${params.id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    const data = await res.json();
    setPanelMsg(data.message || data.error);
    if (res.ok) { fetchTournament(); openPanel("status"); }
  };

  const handleStageStatus = async (stageId: string, newStatus: string) => {
    const res = await fetch(`/api/tournaments/${params.id}/stages/${stageId}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    const data = await res.json();
    setPanelMsg(data.message || data.error);
    if (res.ok) fetchTournament();
  };

  const handleCheckinAction = async (registrationId: string, action: string) => {
    const res = await fetch(`/api/tournaments/${params.id}/checkin`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registrationId, action }) });
    const data = await res.json();
    setPanelMsg(data.message || data.error);
    if (res.ok) openPanel("checkin");
  };

  const handleConfirmDraw = async () => {
    if (!selectedStage || !drawPreview) return;
    const assignments = drawPreview.map((g) => ({ groupId: g.groupId, playerIds: g.players.map((p) => p.id) }));
    const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/draw`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignments }) });
    const data = await res.json();
    setPanelMsg(data.message || data.error);
    if (res.ok) { fetchTournament(); setDrawPreview(null); }
  };

  const handleRandomDrawSemi1 = async () => {
    if (!selectedStage) return;
    setPanelLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawType: "random_seeded" }),
      });
      const data = await res.json();
      setPanelMsg(data.message || data.error);
      if (res.ok) { fetchTournament(); openPanel("draw"); }
    } finally { setPanelLoading(false); }
  };

  const handleWheelSpinComplete = async (assignments: { groupId: string; playerIds: string[] }[]) => {
    if (!selectedStage) return;
    setPanelLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawType: "wheel_spin", assignments }),
      });
      const data = await res.json();
      setPanelMsg(data.message || data.error);
      if (res.ok) { fetchTournament(); setSemi1DrawData(null); setDrawMode(null); }
    } finally { setPanelLoading(false); }
  };

  const handleConfirmAdvance = async () => {
    if (!selectedStage) return;
    const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/advance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const data = await res.json();
    setPanelMsg(data.message || data.error);
    if (res.ok) { fetchTournament(); setAdvancePreview(null); }
  };

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/tournaments/${params.id}/stages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...stageForm, date: new Date(stageForm.date).toISOString() }) });
    if (res.ok) { setShowCreateStage(false); setStageForm({ name: "", stageType: "QUALIFIER", stageOrder: 1, date: "", startTime: "", totalGames: 3 }); fetchTournament(); }
  };

  const handleCreateGroups = async (stageId: string, count: number) => {
    const stage = tournament?.stages.find((s) => s.id === stageId);
    if (!stage) return;
    const existing = stage.groups.length;
    await Promise.all(Array.from({ length: count }, (_, i) => {
      const n = existing + i + 1;
      return fetch(`/api/tournaments/${params.id}/stages/${stageId}/groups`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `Bảng ${String.fromCharCode(64 + n)}`, groupOrder: n }) });
    }));
    fetchTournament();
  };

  const handleRenameGroup = async (groupId: string, newName: string) => {
    const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/groups/${groupId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }) });
    if (res.ok) { setEditingGroupId(null); fetchTournament(); }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Xóa bảng đấu này? Tất cả dữ liệu trong bảng sẽ bị xóa.")) return;
    const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/groups/${groupId}`, { method: "DELETE" });
    if (res.ok) { if (selectedGroup === groupId) setSelectedGroup(null); fetchTournament(); }
  };

  const handleAddPlayer = async (groupId: string, playerId: string) => {
    const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/groups/${groupId}/players`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId }) });
    if (res.ok) fetchTournament();
  };

  const handleRemovePlayer = async (groupId: string, playerId: string) => {
    if (!confirm("Xóa tuyển thủ này khỏi bảng?")) return;
    const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/groups/${groupId}/players?playerId=${playerId}`, { method: "DELETE" });
    if (res.ok) fetchTournament();
  };

  const handleCreateGames = async (groupId: string, count: number) => {
    const group = tournament?.stages.flatMap((s) => s.groups).find((g) => g.id === groupId);
    if (!group) return;
    const existing = group.games.length;
    await Promise.all(Array.from({ length: count }, (_, i) =>
      fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/groups/${groupId}/games`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameNumber: existing + i + 1 }) })
    ));
    fetchTournament();
  };

  const handleQuickScore = async (group: Group) => {
    const sortedGames = [...group.games].sort((a, b) => a.gameNumber - b.gameNumber);
    const targetGame = sortedGames.find((g) => g.results.length === 0);
    if (targetGame) { startEditing(targetGame, group.players); return; }
    const newGameNumber = group.games.length + 1;
    const res = await fetch(`/api/tournaments/${params.id}/stages/${selectedStage}/groups/${group.id}/games`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameNumber: newGameNumber }) });
    if (res.ok) { const newGame: Game = await res.json(); await fetchTournament(); const defaultResults = group.players.map((gp, i) => ({ playerId: gp.playerId, placement: i + 1 })); setEditingResults(defaultResults); setEditingGameId(newGame.id); }
  };

  const startEditing = (game: Game, players: GroupPlayer[]) => {
    const existing = game.results.map((r) => ({ playerId: r.playerId, placement: r.placement }));
    const missing = players.filter((gp) => !existing.find((r) => r.playerId === gp.playerId)).map((gp, i) => ({ playerId: gp.playerId, placement: existing.length + i + 1 }));
    setEditingResults([...existing, ...missing]);
    setEditingGameId(game.id);
  };

  const handleSaveResults = async (gameId: string) => {
    const res = await fetch(`/api/tournaments/${params.id}/games/${gameId}/results`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ results: editingResults }) });
    if (res.ok) { setEditingResults([]); setEditingGameId(null); fetchTournament(); }
  };

  const movePlacement = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= editingResults.length) return;
    const arr = [...editingResults];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    setEditingResults(arr.map((r, i) => ({ ...r, placement: i + 1 })));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const arr = [...editingResults];
    const [moved] = arr.splice(dragIdx, 1);
    arr.splice(idx, 0, moved);
    setEditingResults(arr.map((r, i) => ({ ...r, placement: i + 1 })));
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const inputClass = "w-full px-4 py-2.5 bg-sblt-dark border border-sblt-border rounded-xl text-white placeholder:text-sblt-border focus:outline-none focus:ring-2 focus:ring-sblt-red";

  if (loading) return <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-2 border-sblt-red/30 border-t-sblt-red rounded-full animate-spin" /></div>;
  if (!tournament) return <div className="p-8 text-center text-sblt-muted">Không tìm thấy giải đấu</div>;

  const currentStage = tournament.stages.find((s) => s.id === selectedStage);
  const currentGroup = currentStage?.groups.find((g) => g.id === selectedGroup);
  const approvedPlayers = tournament.registrations.filter((r) => r.status === "APPROVED").map((r) => r.player);

  return (
    <>
      <div className="p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/tournaments" className="text-sblt-muted hover:text-white"><ArrowLeft className="h-6 w-6" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{tournament.name}</h1>
            <p className="text-sblt-muted text-sm">Mùa {tournament.season} — Quản lý chi tiết</p>
          </div>
          <Link href={`/admin/tournaments/${params.id}/prizes`} className="ml-auto bg-sblt-dark hover:bg-sblt-border text-sblt-white text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
            <Trophy className="h-4 w-4 text-sblt-red" /> Giải thưởng
          </Link>
          <div className="flex gap-1">
            {["registrations", "standings", "results", "prizes"].map((type) => (
              <a key={type} href={`/api/tournaments/${params.id}/export?type=${type}`} download
                className="bg-sblt-dark hover:bg-sblt-border text-sblt-muted hover:text-white text-xs px-2 py-1.5 rounded-lg transition-colors"
                title={`Export ${type} CSV`}>
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
            <Card key={stat.label} hover={false} className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-sblt-muted mt-1">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Tool buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(["status", "checkin", "draw", "advance", "predictions"] as const).map((panel) => {
            const icons = { status: Activity, checkin: UserCheck, draw: Shuffle, advance: ChevronRight, predictions: Target };
            const labels = { status: "Trạng thái", checkin: "Check-in", draw: "Bốc thăm", advance: "Thăng hạng", predictions: "Dự đoán" };
            const Icon = icons[panel];
            if ((panel === "draw" || panel === "advance") && !selectedStage) return null;
            return (
              <button key={panel} onClick={() => activePanel === panel ? setActivePanel(null) : openPanel(panel)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${activePanel === panel ? "bg-sblt-red text-white" : "bg-sblt-dark text-sblt-muted hover:text-white hover:bg-sblt-border"}`}>
                <Icon className="h-3.5 w-3.5" /> {labels[panel]}
              </button>
            );
          })}
        </div>

        {/* Tool Panel */}
        {activePanel && (
          <Card hover={false} className="p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-white">
                {activePanel === "status" && "Quản lý trạng thái giải đấu"}
                {activePanel === "checkin" && "Check-in tuyển thủ"}
                {activePanel === "draw" && "Bốc thăm chia bảng"}
                {activePanel === "advance" && "Xếp hạng & Thăng hạng"}
                {activePanel === "predictions" && "Quản lý dự đoán"}
              </h3>
              <button onClick={() => { setActivePanel(null); setPanelMsg(null); }} className="text-sblt-muted hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            {panelMsg && <div className="bg-sblt-dark border border-sblt-border text-sm px-3 py-2 rounded-xl mb-4 text-sblt-white">{panelMsg}</div>}

            {panelLoading ? (
              <div className="text-center text-sblt-muted py-4 text-sm">Đang tải...</div>
            ) : (
              <>
                {activePanel === "status" && statusInfo && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-sblt-muted">Hiện tại:</span>
                      <Badge variant={STATUS_MAP[statusInfo.currentStatus]?.variant || "default"}>{statusInfo.currentLabel}</Badge>
                      <span className="text-xs text-sblt-border">{statusInfo.stats.approvedPlayers}/{statusInfo.stats.maxPlayers} tuyển thủ</span>
                    </div>
                    {statusInfo.suggestions.length > 0 && (
                      <div>
                        <p className="text-xs text-sblt-muted mb-2">Gợi ý:</p>
                        {statusInfo.suggestions.map((s) => (
                          <div key={s.status} className="flex items-center justify-between bg-sblt-dark rounded-xl px-3 py-2 mb-1.5">
                            <div><span className="text-sm font-medium text-white">{s.label}</span><span className="text-xs text-sblt-muted ml-2">— {s.reason}</span></div>
                            <Button size="sm" onClick={() => handleStatusChange(s.status)}>Chuyển</Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-sblt-muted mb-2">Chuyển thủ công:</p>
                      <div className="flex flex-wrap gap-2">
                        {statusInfo.validTransitions.map((t) => (
                          <button key={t.status} onClick={() => handleStatusChange(t.status)} className="bg-sblt-dark hover:bg-sblt-border text-sblt-white text-xs px-3 py-1.5 rounded-lg border border-sblt-border transition-colors">→ {t.label}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-sblt-muted mb-2">Trạng thái vòng đấu:</p>
                      <div className="space-y-1.5">
                        {tournament.stages.map((stage) => (
                          <div key={stage.id} className="flex items-center justify-between bg-sblt-dark rounded-xl px-3 py-2">
                            <span className="text-sm text-white">{stage.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={STAGE_STATUS_MAP[stage.status]?.variant || "default"}>{STAGE_STATUS_MAP[stage.status]?.label || stage.status}</Badge>
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
                      {[
                        { label: "Tổng", value: checkinData.total, color: "text-white" },
                        { label: "Đã check-in", value: checkinData.checkedIn, color: "text-green-400" },
                        { label: "Chưa check-in", value: checkinData.notCheckedIn, color: "text-sblt-red" },
                      ].map((s) => (
                        <Card key={s.label} hover={false} className="p-3 text-center">
                          <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                          <div className="text-xs text-sblt-muted">{s.label}</div>
                        </Card>
                      ))}
                    </div>
                    {checkinData.notCheckedIn > 0 && (
                      <button onClick={() => handleCheckinAction("", "bulk_reject_no_checkin")} className="w-full bg-sblt-red/20 hover:bg-sblt-red/30 text-sblt-red text-sm py-2 rounded-xl border border-sblt-red/30 transition-colors">
                        Từ chối tất cả {checkinData.notCheckedIn} người chưa check-in
                      </button>
                    )}
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {checkinData.registrations.map((r) => (
                        <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-sblt-dark rounded-xl text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${r.checkedIn ? "bg-green-400" : "bg-red-400"}`} />
                            <span className="text-white">{r.player.ign}</span>
                            {r.player.isGuest && <span className="text-xs text-sblt-red">Khách</span>}
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
                    {/* SEMI_1: Bốc thăm khách mời */}
                    {semi1DrawData ? (
                      <>
                        {/* Tổng quan players */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-sblt-dark rounded-lg px-3 py-2">
                            <p className="text-xs text-sblt-muted">Người đi tiếp</p>
                            <p className="text-lg font-bold text-green-400">{semi1DrawData.totalAdvancing}</p>
                          </div>
                          <div className="bg-sblt-dark rounded-lg px-3 py-2">
                            <p className="text-xs text-sblt-muted">Khách mời</p>
                            <p className="text-lg font-bold text-sblt-red">{semi1DrawData.totalGuests}</p>
                          </div>
                        </div>

                        {/* Chọn cách bốc thăm */}
                        {!drawMode && (
                          <div>
                            <p className="text-xs font-semibold text-white mb-2">
                              Bốc thăm {semi1DrawData.totalAdvancing + semi1DrawData.totalGuests} tuyển thủ vào {semi1DrawData.groups.length} bảng
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setDrawMode("random")}
                                className="flex-1 bg-sblt-dark hover:bg-sblt-red/20 border border-sblt-border hover:border-sblt-red text-white text-sm py-3 rounded-xl transition-colors"
                              >
                                <Shuffle className="h-4 w-4 inline mr-2" />
                                Bốc thăm nhanh (chỉ khách mời)
                              </button>
                              <button
                                onClick={() => setDrawMode("wheel")}
                                className="flex-1 bg-sblt-dark hover:bg-sblt-red/20 border border-sblt-border hover:border-sblt-red text-white text-sm py-3 rounded-xl transition-colors"
                              >
                                🎡 Quay vòng quay (tất cả)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Random seeded draw */}
                        {drawMode === "random" && (
                          <div className="text-center py-4">
                            <p className="text-sblt-muted text-sm mb-3">
                              Chia {semi1DrawData.totalGuests} khách mời đều vào {semi1DrawData.groups.length} bảng (ngẫu nhiên)
                            </p>
                            <p className="text-xs text-yellow-400 mb-3">
                              Lưu ý: Chỉ bốc thăm khách mời. Players đi tiếp cần được gán qua vòng quay hoặc thủ công.
                            </p>
                            <div className="flex gap-2 justify-center">
                              <Button size="sm" onClick={handleRandomDrawSemi1} disabled={panelLoading}>
                                {panelLoading ? "Đang xử lý..." : "✓ Xác nhận bốc thăm"}
                              </Button>
                              <button onClick={() => setDrawMode(null)} className="text-sblt-muted hover:text-white text-sm px-4 py-2">Hủy</button>
                            </div>
                          </div>
                        )}

                        {/* Wheel spinner — quay cả advancing + guests */}
                        {drawMode === "wheel" && (
                          <div>
                            <WheelSpinner
                              items={semi1DrawData.allWheelItems}
                              groups={semi1DrawData.groups}
                              onAssignmentsComplete={handleWheelSpinComplete}
                              onCancel={() => setDrawMode(null)}
                              addableItems={approvedPlayers
                                .filter((p) => !semi1DrawData.allWheelItems.find((w) => w.id === p.id))
                                .map((p) => ({ id: p.id, label: p.ign }))}
                            />
                          </div>
                        )}
                      </>
                    ) : drawPreview ? (
                      /* QUALIFIER: Bốc thăm regular players */
                      <>
                        <p className="text-xs text-sblt-muted">Preview — Bấm &quot;Xác nhận&quot; để lưu hoặc &quot;Bốc lại&quot; để random lại.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto">
                          {drawPreview.map((group) => (
                            <Card key={group.groupId} hover={false} className="p-3">
                              <p className="text-xs font-semibold text-sblt-white mb-2">{group.groupName}</p>
                              {group.players.map((p) => (
                                <div key={p.id} className="text-xs text-sblt-muted py-0.5 flex items-center gap-1">
                                  {p.ign}
                                </div>
                              ))}
                            </Card>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleConfirmDraw}>✓ Xác nhận</Button>
                          <button onClick={() => openPanel("draw")} className="bg-sblt-dark hover:bg-sblt-border text-sblt-white text-sm px-4 py-2 rounded-lg transition-colors">↺ Bốc lại</button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sblt-muted text-sm mb-3">Bốc thăm ngẫu nhiên có seeding theo rank</p>
                        <Button onClick={() => openPanel("draw")}>Bốc thăm</Button>
                      </div>
                    )}
                  </div>
                )}

                {activePanel === "advance" && (
                  <div className="space-y-4">
                    {advancePreview ? (
                      <>
                        <p className="text-xs text-sblt-muted">Xếp hạng: Tổng điểm → Top1 → Top4 → Placement tốt nhất. Màu xanh = thăng hạng.</p>
                        {currentStage?.stageType === "QUALIFIER" && (
                          <p className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2">
                            Lưu ý: Khách mời sẽ không được tự động thêm vào Vòng 2. Sau khi thăng hạng, hãy bốc thăm khách mời riêng.
                          </p>
                        )}
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                          {advancePreview.map((group) => (
                            <Card key={group.groupName} hover={false} className="p-3">
                              <p className="text-xs font-semibold text-sblt-white mb-2">{group.groupName}</p>
                              {group.players.map((p) => (
                                <div key={p.playerId} className={`flex items-center justify-between text-xs py-1 ${p.advancing ? "text-green-400" : "text-sblt-muted"}`}>
                                  <span>{p.rank}. {p.ign}</span>
                                  <span>{p.totalPoints}đ {p.advancing ? "→ Thăng" : ""}</span>
                                </div>
                              ))}
                            </Card>
                          ))}
                        </div>
                        <Button onClick={handleConfirmAdvance}>✓ Xác nhận & Chuyển sang vòng sau</Button>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sblt-muted text-sm mb-3">Tính xếp hạng và chọn tuyển thủ thăng hạng</p>
                        <Button onClick={() => openPanel("advance")}>Xem kết quả xếp hạng</Button>
                      </div>
                    )}
                  </div>
                )}

                {activePanel === "predictions" && (
                  <div className="space-y-4">
                    <p className="text-xs text-sblt-muted">
                      Quản lý cửa sổ dự đoán cho các vòng Semi 1, Semi 2, và Chung Kết.
                    </p>
                    <div className="space-y-2">
                      {tournament.stages
                        .filter((s) => ["SEMI_1", "SEMI_2", "FINAL"].includes(s.stageType))
                        .map((stage) => {
                          const hasPlayers = stage.groups.some((g) => g.players.length > 0);
                          let status: string;
                          let statusVariant: "green" | "yellow" | "blue" | "default";
                          if (stage.status === "COMPLETED") { status = "Đã chấm điểm"; statusVariant = "blue"; }
                          else if (stage.status === "IN_PROGRESS") { status = "Đã khóa"; statusVariant = "yellow"; }
                          else if (hasPlayers) { status = "Đang mở"; statusVariant = "green"; }
                          else { status = "Chưa sẵn sàng"; statusVariant = "default"; }

                          return (
                            <div key={stage.id} className="flex items-center justify-between bg-sblt-dark rounded-lg px-4 py-3">
                              <div>
                                <span className="text-sm text-white font-medium">{stage.name}</span>
                                <span className="text-xs text-sblt-muted ml-2">({stage.groups.length} bảng)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={statusVariant}>{status}</Badge>
                                <Link
                                  href={`/tournaments/${tournament.id}/predictions/${stage.id}/leaderboard`}
                                  className="text-xs text-sblt-muted hover:text-white"
                                  target="_blank"
                                >
                                  Xem BXH
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    <Link
                      href={`/tournaments/${tournament.id}/predictions`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-sblt-muted hover:text-white"
                    >
                      Xem trang dự đoán →
                    </Link>
                  </div>
                )}
              </>
            )}
          </Card>
        )}

        {/* Stage tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tournament.stages.map((stage) => (
            <button key={stage.id} onClick={() => { setSelectedStage(stage.id); setSelectedGroup(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedStage === stage.id ? "bg-sblt-red text-white" : "bg-sblt-dark text-sblt-muted hover:text-white hover:bg-sblt-border"}`}>
              {stage.name}
            </button>
          ))}
          <button onClick={() => setShowCreateStage(true)} className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap bg-sblt-dark text-sblt-red hover:bg-sblt-border flex items-center gap-1 transition-colors">
            <Plus className="h-4 w-4" /> Thêm vòng
          </button>
        </div>

        {currentStage && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Group list */}
            <div className="lg:col-span-1">
              <Card hover={false} className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-white">Bảng đấu</h2>
                  <button onClick={() => handleCreateGroups(currentStage.id, 1)} className="text-sblt-red hover:text-red-400"><Plus className="h-5 w-5" /></button>
                </div>
                <div className="space-y-2">
                  {currentStage.groups.map((group) => (
                    <div key={group.id}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-colors group/item flex items-center justify-between ${
                        selectedGroup === group.id ? "bg-sblt-red/15 border border-sblt-red/40" : "bg-sblt-dark hover:bg-sblt-border"}`}>
                      {editingGroupId === group.id ? (
                        <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                          <input autoFocus value={editingGroupName} onChange={(e) => setEditingGroupName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleRenameGroup(group.id, editingGroupName); if (e.key === "Escape") setEditingGroupId(null); }}
                            className="flex-1 bg-sblt-dark border border-sblt-border rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sblt-red" />
                          <button onClick={() => handleRenameGroup(group.id, editingGroupName)} className="text-green-400 hover:text-green-300" title="Lưu"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditingGroupId(null)} className="text-sblt-muted hover:text-white" title="Hủy"><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <>
                          <button className="flex-1 text-left" onClick={() => setSelectedGroup(group.id)}>
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-white">{group.name}</span>
                              <span className={`text-xs font-medium ${group.players.length >= 8 ? "text-red-400" : "text-sblt-muted"}`}>{group.players.length}/8</span>
                            </div>
                          </button>
                          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); setEditingGroupId(group.id); setEditingGroupName(group.name); }} className="text-sblt-muted hover:text-white p-1 rounded" title="Đổi tên"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }} className="text-sblt-muted hover:text-red-400 p-1 rounded" title="Xóa bảng"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {currentStage.groups.length === 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-sblt-muted text-center mb-3">Tạo nhanh</p>
                    {[{ n: 8, label: "8 bảng (Vòng Loại)" }, { n: 4, label: "4 bảng (Vòng 2)" }, { n: 2, label: "2 bảng (Vòng 3)" }].map((opt) => (
                      <button key={opt.n} onClick={() => handleCreateGroups(currentStage.id, opt.n)} className="w-full bg-sblt-dark hover:bg-sblt-border text-white py-2 rounded-xl text-sm transition-colors">{opt.label}</button>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Group detail */}
            <div className="lg:col-span-2">
              {currentGroup ? (
                <div className="space-y-5">
                  {/* Players section */}
                  <Card hover={false} className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">{currentGroup.name} — Tuyển thủ</h3>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleQuickScore(currentGroup)} className="bg-sblt-red/20 hover:bg-sblt-red/30 text-sblt-red hover:text-red-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors" title="Nhập điểm nhanh">🎮 Nhập điểm nhanh</button>
                        {currentGroup.players.length >= 8 ? (
                          <span className="text-xs text-red-400 bg-red-400/10 px-3 py-1.5 rounded-lg">Đã đủ 8/8</span>
                        ) : (
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="+ Thêm tuyển thủ"
                              value={playerSearch}
                              onChange={(e) => { setPlayerSearch(e.target.value); setShowPlayerDropdown(true); }}
                              onFocus={() => setShowPlayerDropdown(true)}
                              onBlur={() => setTimeout(() => setShowPlayerDropdown(false), 200)}
                              className="bg-sblt-dark border border-sblt-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sblt-red w-48"
                            />
                            {showPlayerDropdown && playerSearch.length > 0 && (
                              <div className="absolute z-10 top-full mt-1 w-full bg-sblt-dark border border-sblt-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {approvedPlayers
                                  .filter((p) => !currentGroup.players.find((gp) => gp.playerId === p.id))
                                  .filter((p) => p.ign.toLowerCase().includes(playerSearch.toLowerCase()))
                                  .map((p) => (
                                    <button
                                      key={p.id}
                                      onMouseDown={(e) => { e.preventDefault(); handleAddPlayer(currentGroup.id, p.id); setPlayerSearch(""); setShowPlayerDropdown(false); }}
                                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-sblt-border transition-colors"
                                    >
                                      {p.ign}{p.isGuest ? " (Khách mời)" : ""}
                                    </button>
                                  ))}
                                {approvedPlayers
                                  .filter((p) => !currentGroup.players.find((gp) => gp.playerId === p.id))
                                  .filter((p) => p.ign.toLowerCase().includes(playerSearch.toLowerCase())).length === 0 && (
                                  <div className="px-3 py-2 text-sm text-sblt-muted">Không tìm thấy</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {currentGroup.players.length > 0 ? (
                      <div className="space-y-1.5">
                        {[...currentGroup.players].sort((a, b) => b.totalPoints - a.totalPoints).map((gp, idx) => (
                          <div key={gp.id} className="flex items-center justify-between px-3 py-2.5 bg-sblt-dark rounded-xl group">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-sblt-muted w-5">{idx + 1}</span>
                              <span className="text-sm font-medium text-white">{gp.player.ign}</span>
                              {gp.player.isGuest && <Badge variant="red">Khách mời</Badge>}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-sblt-red">{gp.totalPoints} điểm</span>
                              <button onClick={() => handleRemovePlayer(currentGroup.id, gp.playerId)} className="opacity-0 group-hover:opacity-100 text-sblt-muted hover:text-red-400 transition-all" title="Xóa khỏi bảng"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-sblt-muted text-sm py-4">Chưa có tuyển thủ</p>
                    )}
                  </Card>

                  {/* Games section */}
                  <Card hover={false} className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">Trận đấu</h3>
                      <button onClick={() => handleCreateGames(currentGroup.id, 1)} className="text-sblt-red hover:text-red-400" title="Thêm game"><Plus className="h-5 w-5" /></button>
                    </div>
                    {currentGroup.games.length === 0 ? (
                      <div className="space-y-2">
                        <p className="text-center text-sblt-muted text-sm py-2">Chưa có trận đấu</p>
                        {currentGroup.players.length >= 2 && (
                          <button onClick={() => handleCreateGames(currentGroup.id, 3)} className="w-full bg-sblt-dark hover:bg-sblt-border text-white py-2 rounded-xl text-sm transition-colors">Tạo 3 games (BO3)</button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {[...currentGroup.games].sort((a, b) => a.gameNumber - b.gameNumber).map((game) => (
                          <Card key={game.id} hover={false} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-white">Game {game.gameNumber}</h4>
                              <Badge variant={game.status === "COMPLETED" ? "green" : "default"}>{game.status === "COMPLETED" ? "Đã xong" : "Chưa bắt đầu"}</Badge>
                            </div>
                            {editingGameId === game.id ? (
                              <div>
                                <p className="text-xs text-sblt-muted mb-3">Kéo thứ tự hoặc dùng ↑↓ để sắp xếp. Điểm tự tính theo placement.</p>
                                <div className="space-y-1.5 mb-4">
                                  {editingResults.map((r, idx) => {
                                    const player = currentGroup.players.find((gp) => gp.playerId === r.playerId);
                                    const pts = SCORING[r.placement] ?? 0;
                                    return (
                                      <div key={r.playerId}
                                        draggable
                                        onDragStart={() => handleDragStart(idx)}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDragEnd={handleDragEnd}
                                        className={`flex items-center gap-2 bg-sblt-dark rounded-xl px-3 py-2 cursor-grab active:cursor-grabbing ${dragIdx === idx ? "opacity-50" : ""}`}>
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                          r.placement === 1 ? "bg-sblt-red text-white" : r.placement <= 4 ? "bg-zinc-500 text-white" : "bg-sblt-border text-sblt-white"
                                        }`}>{r.placement}</span>
                                        <span className="flex-1 text-sm text-white">{player?.player.ign ?? "?"}</span>
                                        <span className="text-xs text-sblt-red font-semibold w-12 text-right">{pts} điểm</span>
                                        <div className="flex flex-col gap-0.5">
                                          <button onClick={() => movePlacement(idx, -1)} disabled={idx === 0} className="text-sblt-muted hover:text-white disabled:opacity-20 text-xs leading-none">▲</button>
                                          <button onClick={() => movePlacement(idx, 1)} disabled={idx === editingResults.length - 1} className="text-sblt-muted hover:text-white disabled:opacity-20 text-xs leading-none">▼</button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSaveResults(game.id)}><Save className="h-4 w-4" /> Lưu kết quả</Button>
                                  <button onClick={() => { setEditingResults([]); setEditingGameId(null); }} className="text-sblt-muted hover:text-white px-4 py-2 text-sm">Hủy</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {game.results.length > 0 ? (
                                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                                    {[...game.results].sort((a, b) => a.placement - b.placement).map((r) => (
                                      <div key={r.id} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm ${r.placement <= 4 ? "bg-sblt-dark" : "bg-sblt-dark/50"}`}>
                                        <div className="flex items-center gap-2">
                                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${r.placement === 1 ? "bg-sblt-red text-white" : "bg-sblt-border text-sblt-white"}`}>{r.placement}</span>
                                          <span className="text-sblt-white truncate max-w-[80px]">{r.player.ign}</span>
                                        </div>
                                        <span className="text-sblt-red font-semibold">{r.points}đ</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-center text-sblt-muted text-sm py-2 mb-2">Chưa có kết quả</p>
                                )}
                                <button onClick={() => startEditing(game, currentGroup.players)} className="text-sblt-red hover:text-red-400 text-sm font-medium">
                                  {game.results.length > 0 ? "✏️ Sửa kết quả" : "➕ Nhập kết quả"}
                                </button>
                              </>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              ) : (
                <Card hover={false} className="p-12 text-center">
                  <Users className="h-12 w-12 text-sblt-border mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-sblt-muted mb-2">Chọn bảng đấu</h3>
                  <p className="text-sblt-border text-sm">Chọn một bảng bên trái để quản lý tuyển thủ và nhập điểm</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Stage Modal */}
      {showCreateStage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card hover={false} className="p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-white">Tạo vòng đấu mới</h2>
              <button onClick={() => setShowCreateStage(false)} className="text-sblt-muted hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateStage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sblt-muted mb-1.5">Tên vòng đấu *</label>
                <input type="text" value={stageForm.name} onChange={(e) => setStageForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="Vòng Loại" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-sblt-muted mb-1.5">Loại vòng *</label>
                <select value={stageForm.stageType} onChange={(e) => setStageForm((p) => ({ ...p, stageType: e.target.value }))} className={inputClass}>
                  <option value="QUALIFIER">Vòng Loại</option>
                  <option value="SEMI_1">Bán Kết 1</option>
                  <option value="SEMI_2">Bán Kết 2</option>
                  <option value="FINAL">Chung Kết</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sblt-muted mb-1.5">Thứ tự *</label>
                  <input type="number" value={stageForm.stageOrder} min={1} onChange={(e) => setStageForm((p) => ({ ...p, stageOrder: parseInt(e.target.value) }))} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sblt-muted mb-1.5">Số games</label>
                  <input type="number" value={stageForm.totalGames} min={1} onChange={(e) => setStageForm((p) => ({ ...p, totalGames: parseInt(e.target.value) }))} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-sblt-muted mb-1.5">Ngày thi đấu *</label>
                <input type="date" value={stageForm.date} onChange={(e) => setStageForm((p) => ({ ...p, date: e.target.value }))} className={inputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-sblt-muted mb-1.5">Giờ bắt đầu *</label>
                <input type="text" value={stageForm.startTime} placeholder="19:00" onChange={(e) => setStageForm((p) => ({ ...p, startTime: e.target.value }))} className={inputClass} required />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateStage(false)} className="px-4 py-2 text-sblt-muted hover:text-white">Hủy</button>
                <Button type="submit">Tạo vòng đấu</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}

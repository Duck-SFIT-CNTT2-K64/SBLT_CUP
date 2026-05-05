"use client";

import { useState, useEffect, Fragment } from "react";
import { ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  ip: string | null;
  createdAt: string;
  user: { name: string; email: string; role: string };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE_GAME_RESULTS: "text-green-400",
  UPDATE_GAME_RESULTS: "text-yellow-400",
  UPDATE_DISPUTE: "text-blue-400",
  UPDATE_REGISTRATION: "text-purple-400",
  DELETE: "text-red-400",
};

const ENTITY_LABELS: Record<string, string> = {
  Game: "Trận đấu", Tournament: "Giải đấu", Registration: "Đăng ký", Dispute: "Kháng nghị",
  Stage: "Vòng đấu", Group: "Bảng đấu", User: "Tài khoản", Prize: "Giải thưởng",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 30;

  useEffect(() => { fetchLogs(); }, [page, entityTypeFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (entityTypeFilter) params.set("entityType", entityTypeFilter);
    const res = await fetch(`/api/admin/audit-logs?${params}`);
    if (res.ok) { const data = await res.json(); setLogs(data.logs); setTotal(data.total); }
    setLoading(false);
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) return <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-2 border-sblt-red/30 border-t-sblt-red rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Nhật ký hoạt động</h1>
          <p className="text-sblt-muted mt-1">Xem lịch sử thay đổi của admin</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-sblt-muted">Lọc theo loại:</span>
          <select value={entityTypeFilter} onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
            className="bg-sblt-dark border border-sblt-border rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sblt-red">
            <option value="">Tất cả</option>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="text-xs text-sblt-muted mb-4">{total} bản ghi</div>

      <Card hover={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sblt-dark border-b-2 border-sblt-red">
                <th className="text-left py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Thời gian</th>
                <th className="text-left py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Admin</th>
                <th className="text-left py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Hành động</th>
                <th className="text-left py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Đối tượng</th>
                <th className="text-left py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider">IP</th>
                <th className="text-right py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <Fragment key={log.id}>
                  <tr className="border-b border-sblt-border hover:bg-sblt-red/3 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                    <td className="py-3 px-4 text-sblt-muted text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-white">{log.user.name}</div>
                      <div className="text-xs text-sblt-border">{log.user.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-mono font-semibold ${ACTION_COLORS[log.action] || "text-sblt-white"}`}>{log.action}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-sblt-dark px-2 py-0.5 rounded-lg text-sblt-white">{ENTITY_LABELS[log.entityType] || log.entityType}</span>
                      <span className="text-xs text-sblt-border ml-1 font-mono">{log.entityId.slice(0, 8)}...</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-sblt-muted">{log.ip || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs text-sblt-muted">{expandedId === log.id ? "▲" : "▼"}</span>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr key={`${log.id}-detail`} className="border-b border-sblt-border bg-sblt-black">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="grid grid-cols-2 gap-4">
                          {log.before != null && (
                            <div>
                              <p className="text-xs text-sblt-muted mb-1">Trước:</p>
                              <pre className="text-xs text-red-300 bg-sblt-dark rounded-xl p-2 overflow-auto max-h-32">{JSON.stringify(log.before as Record<string, unknown>, null, 2)}</pre>
                            </div>
                          )}
                          {log.after != null && (
                            <div>
                              <p className="text-xs text-sblt-muted mb-1">Sau:</p>
                              <pre className="text-xs text-green-300 bg-sblt-dark rounded-xl p-2 overflow-auto max-h-32">{JSON.stringify(log.after as Record<string, unknown>, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && <div className="text-center py-12"><ClipboardList className="h-12 w-12 text-sblt-border mx-auto mb-4" /><p className="text-sblt-muted">Chưa có nhật ký nào</p></div>}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-sblt-muted">Trang {page} / {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 bg-sblt-dark hover:bg-sblt-border disabled:opacity-40 rounded-lg transition-colors"><ChevronLeft className="h-4 w-4 text-white" /></button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 bg-sblt-dark hover:bg-sblt-border disabled:opacity-40 rounded-lg transition-colors"><ChevronRight className="h-4 w-4 text-white" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

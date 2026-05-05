"use client";

import { useState, useEffect, Fragment } from "react";
import { ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";

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
  Game: "Trận đấu",
  Tournament: "Giải đấu",
  Registration: "Đăng ký",
  Dispute: "Kháng nghị",
  Stage: "Vòng đấu",
  Group: "Bảng đấu",
  User: "Tài khoản",
  Prize: "Giải thưởng",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const limit = 30;

  useEffect(() => {
    fetchLogs();
  }, [page, entityTypeFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (entityTypeFilter) params.set("entityType", entityTypeFilter);

    const res = await fetch(`/api/admin/audit-logs?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-red-600" /> Nhật ký hoạt động
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Lọc theo loại:</span>
          <select
            value={entityTypeFilter}
            onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="">Tất cả</option>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-4">{total} bản ghi</div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/50">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Thời gian</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Admin</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Hành động</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Đối tượng</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">IP</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <Fragment key={log.id}>
                  <tr
                    className="border-b border-zinc-800 hover:bg-zinc-800/30 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium">{log.user.name}</div>
                      <div className="text-xs text-gray-500">{log.user.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-mono font-semibold ${ACTION_COLORS[log.action] || "text-gray-300"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-gray-300">
                        {ENTITY_LABELS[log.entityType] || log.entityType}
                      </span>
                      <span className="text-xs text-gray-600 ml-1 font-mono">{log.entityId.slice(0, 8)}...</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{log.ip || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs text-gray-500">{expandedId === log.id ? "▲" : "▼"}</span>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr key={`${log.id}-detail`} className="border-b border-zinc-800 bg-zinc-950">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="grid grid-cols-2 gap-4">
                          {log.before != null && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Trước:</p>
                              <pre className="text-xs text-red-300 bg-zinc-900 rounded p-2 overflow-auto max-h-32">
                                {JSON.stringify(log.before as Record<string, unknown>, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.after != null && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Sau:</p>
                              <pre className="text-xs text-green-300 bg-zinc-900 rounded p-2 overflow-auto max-h-32">
                                {JSON.stringify(log.after as Record<string, unknown>, null, 2)}
                              </pre>
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

          {logs.length === 0 && (
            <div className="text-center py-12 text-gray-500">Chưa có nhật ký nào</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500">Trang {page} / {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import axios from "axios";

interface AuditLog {
  audit_id: number;
  table_name: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  primary_key: any;
  changed_by: string | null;
  changed_at: string;
  row_data: any;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/audit`)
      .then(res => setLogs(Array.isArray(res.data) ? res.data : res.data.data || []))
      .catch(err => console.error(err));
  }, []);

  const badgeColor = (op: string) => {
    if (op.startsWith("I")) return "bg-green-100 text-green-800";
    if (op.startsWith("U")) return "bg-blue-100 text-blue-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Audit Logs</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">Time</th>
              <th className="px-6 py-3 text-left">Action</th>
              <th className="px-6 py-3 text-left">Table</th>
              <th className="px-6 py-3 text-left">User</th>
              <th className="px-6 py-3 text-center">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.audit_id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-gray-500">{new Date(log.changed_at).toLocaleString()}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${badgeColor(log.operation)}`}>
                    {log.operation}
                  </span>
                </td>
                <td className="px-6 py-3 font-medium">{log.table_name} <span className="text-gray-400">#{log.primary_key}</span></td>
                <td className="px-6 py-3 text-gray-600">{log.changed_by || "System"}</td>
                <td className="px-6 py-3 text-center">
                  <button onClick={() => setSelected(log)} className="text-blue-600 hover:underline font-medium">View Changes</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simple Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold">Audit Details #{selected.audit_id}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-red-500 text-xl">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {selected.row_data?.old || selected.row_data?.new ? (
                // Diff View for Updates
                <table className="w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr><th className="p-2 text-left">Field</th><th className="p-2 text-left">Old</th><th className="p-2 text-left">New</th></tr>
                  </thead>
                  <tbody>
                    {Array.from(new Set([...Object.keys(selected.row_data.old || {}), ...Object.keys(selected.row_data.new || {})])).map(key => {
                      const oldV = JSON.stringify(selected.row_data.old?.[key]);
                      const newV = JSON.stringify(selected.row_data.new?.[key]);
                      if (oldV === newV) return null;
                      return (
                        <tr key={key} className="border-t">
                          <td className="p-2 font-semibold text-gray-700">{key}</td>
                          <td className="p-2 text-red-600 bg-red-50 break-all">{String(selected.row_data.old?.[key] ?? "-")}</td>
                          <td className="p-2 text-green-600 bg-green-50 break-all">{String(selected.row_data.new?.[key] ?? "-")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                // Raw View for Inserts/Deletes
                <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selected.row_data, null, 2)}
                </pre>
              )}
            </div>
            <div className="p-4 border-t text-right">
              <button onClick={() => setSelected(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
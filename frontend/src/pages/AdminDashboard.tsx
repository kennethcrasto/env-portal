import { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, Search, AlertCircle } from "lucide-react";

interface Complaint {
  complaint_id: number;
  category: string;
  description: string;
  location: string;
  status: string;
  submitted_at: string;
  citizen_name?: string;
}

const statusOptions = ["Pending", "In Progress", "Resolved", "Closed", "Rejected"];

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Resolved: "bg-green-100 text-green-700",
  Closed: "bg-gray-200 text-gray-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/complaints`);
      setComplaints(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching complaints:", err);
      setError("Failed to load complaints. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdating(id);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/complaints/${id}/status`, { status: newStatus });
      setComplaints(prev =>
        prev.map(c => (c.complaint_id === id ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status.");
    } finally {
      setUpdating(null);
    }
  };

  // ✅ NEW: Delete Functionality
  const deleteComplaint = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this complaint? This action cannot be undone.")) {
      return;
    }

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/complaints/${id}`);
      // Remove from state immediately
      setComplaints(prev => prev.filter(c => c.complaint_id !== id));
    } catch (err) {
      console.error("Error deleting complaint:", err);
      alert("Failed to delete complaint. Check console for details.");
    }
  };

  const filteredComplaints = complaints.filter(c =>
    [c.category, c.description, c.location, c.status]
      .some(field => field?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-green-600">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
      <span className="ml-2 font-medium">Loading complaints...</span>
    </div>
  );

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-green-800 flex items-center gap-2">
          🛠️ Admin Complaint Manager
        </h2>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none shadow-sm"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="overflow-hidden shadow-lg rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-green-50 text-green-900 uppercase text-xs font-bold tracking-wider border-b border-green-100">
              <tr>
                <th className="px-6 py-4 text-left">ID</th>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4 text-left">Description</th>
                <th className="px-6 py-4 text-left">Location</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Submitted</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500 flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-gray-300" />
                    <p>No complaints found matching your search.</p>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map(c => (
                  <tr
                    key={c.complaint_id}
                    className="hover:bg-green-50/50 transition-colors duration-150 group"
                  >
                    <td className="px-6 py-4 font-mono text-gray-500">#{c.complaint_id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{c.category}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs">
                      <p className="truncate" title={c.description}>{c.description}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{c.location}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          statusColors[c.status] || "bg-gray-100 text-gray-700 border-gray-200"
                        } border-opacity-20`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(c.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <select
                          value={c.status}
                          onChange={e => updateStatus(c.complaint_id, e.target.value)}
                          disabled={updating === c.complaint_id}
                          className="border border-gray-300 rounded-md py-1 pl-2 pr-6 text-xs bg-white focus:ring-2 focus:ring-green-500 cursor-pointer hover:border-green-400 transition-colors"
                        >
                          {statusOptions.map(opt => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => deleteComplaint(c.complaint_id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
                          title="Delete Complaint"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
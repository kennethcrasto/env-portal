import { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#eab308", "#3b82f6", "#22c55e", "#6b7280", "#ef4444"];

export default function ComplaintStats() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/views/complaint_summary`
      );

      // Build counts from the array of complaints
      const counts: Record<string, number> = {};
      res.data.forEach((c: any) => {
        const status = c.status || "Unknown";
        counts[status] = (counts[status] || 0) + 1;
      });

      console.log("✅ Complaint Summary Counts:", counts);
      setStats(counts);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching complaint stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // auto-refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const totalComplaints = Object.values(stats).reduce((a, b) => a + b, 0);

  const categories = [
    { key: "Pending", label: "Pending" },
    { key: "In Progress", label: "In Progress" },
    { key: "Resolved", label: "Resolved" },
    { key: "Closed", label: "Closed" },
    { key: "Rejected", label: "Rejected" },
  ];

  const data = categories.map((cat) => ({
    name: cat.label,
    value: stats[cat.key] || 0,
  }));

  const percent = (count: number) =>
    totalComplaints > 0 ? ((count / totalComplaints) * 100).toFixed(1) : "0.0";

  if (Object.keys(stats).length === 0) {
    return <p className="p-6 text-gray-600">Loading complaint statistics...</p>;
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-green-700">📊 Complaint Statistics</h2>
        {lastUpdated && (
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-green-100 p-6 rounded-xl shadow text-center">
          <h3 className="text-lg font-semibold text-green-800">Total Complaints</h3>
          <p className="text-4xl font-bold text-green-700 mt-2">{totalComplaints}</p>
        </div>

        {data.map((cat, i) => (
          <div
            key={cat.name}
            className="bg-white border border-gray-200 p-5 rounded-xl shadow text-center"
          >
            <h3 className="text-lg font-semibold text-gray-700">{cat.name}</h3>
            <p
              className="text-3xl font-bold mt-2"
              style={{ color: COLORS[i % COLORS.length] }}
            >
              {cat.value}
            </p>
            <p className="text-sm text-gray-500 mt-1">{percent(cat.value)}% of total</p>
          </div>
        ))}
      </div>

      {/* Chart + Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Pie Chart */}
        <div className="w-full h-[350px] flex justify-center items-center bg-white rounded-xl shadow">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                label={(entry) => `${entry.name}: ${percent(entry.value)}%`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Progress Overview
          </h3>
          {data.map((cat, i) => (
            <div key={cat.name}>
              <p className="text-sm text-gray-600 mb-1 flex justify-between">
                <span>{cat.name}</span>
                <span>{percent(cat.value)}%</span>
              </p>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="h-4 rounded-full transition-all"
                  style={{
                    width: `${percent(cat.value)}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

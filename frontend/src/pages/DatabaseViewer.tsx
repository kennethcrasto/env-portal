import { useEffect, useState } from "react";
import axios from "axios";

interface DatabaseData {
  [table: string]: any[];
}

export default function DatabaseViewer() {
  const [data, setData] = useState<DatabaseData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/database`)
      .then((res) => {
        // Filter out the audit_log table and assert correct type
        const filteredData = Object.fromEntries(
          Object.entries(res.data).filter(([table]) => table !== "auditlog")
        ) as DatabaseData;

        setData(filteredData);
      })
      .catch((err) => console.error("Error fetching database:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6 text-gray-500">Loading database...</p>;

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-3xl font-bold text-green-700">Database Viewer</h2>

      {Object.keys(data).map((table) => (
        <div key={table} className="border rounded-xl shadow bg-white p-5">
          <h3 className="text-xl font-semibold text-green-800 mb-3">{table}</h3>

          {data[table].length === 0 ? (
            <p className="text-gray-500 italic">No rows in this table</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm border-collapse">
                <thead className="bg-green-100 text-gray-800">
                  <tr>
                    {Object.keys(data[table][0]).map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 border-b border-gray-300 text-left font-medium"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data[table].map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-green-50 even:bg-gray-50 transition"
                    >
                      {Object.values(row).map((val, j) => (
                        <td
                          key={j}
                          className="px-3 py-2 border-b border-gray-200 text-gray-700 whitespace-nowrap"
                        >
                          {typeof val === "object" && val !== null
                            ? JSON.stringify(val, null, 2)
                            : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
import { useEffect, useState } from "react";
import axios from "axios";

// 1. Update Interface to match actual API data (it sends user_id, not name)
interface Complaint {
  complaint_id: number;
  description: string;
  status: string;
  user_id: number; // <--- The API sends this
}

interface User {
  user_id: number;
  name: string;
}

const ComplaintList: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Store users here to look them up

  useEffect(() => {
    // 2. Fetch BOTH Complaints and Users
    const fetchData = async () => {
      try {
        const [resComplaints, resUsers] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/complaints`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/users`),
        ]);

        // Handle list vs {data: list} structure safely
        const complaintData = Array.isArray(resComplaints.data) ? resComplaints.data : resComplaints.data.data || [];
        const userData = Array.isArray(resUsers.data) ? resUsers.data : resUsers.data.data || [];

        setComplaints(complaintData);
        setUsers(userData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  // 3. Helper to find name by ID
  const getCitizenName = (id: number) => {
    const user = users.find((u) => u.user_id === id);
    return user ? user.name : `Unknown (ID: ${id})`;
  };

  return (
    <div>
      <h2 className="text-3xl font-semibold mb-6 text-green-700">
        Complaints
      </h2>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full border-collapse">
          <thead className="bg-green-100 text-green-800 text-sm uppercase">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Citizen</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => (
              <tr
                key={c.complaint_id}
                className="border-t hover:bg-gray-50 transition"
              >
                <td className="p-3">{c.complaint_id}</td>
                <td className="p-3">{c.description}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      c.status === "Resolved"
                        ? "bg-green-100 text-green-700"
                        : c.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                {/* 4. Use the helper to display the name */}
                <td className="p-3 font-medium text-gray-700">
                  {getCitizenName(c.user_id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComplaintList;
import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface User {
  user_id: number;
  name: string;
}

export default function RegisterComplaint() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    user_id: "",
    category: "",
    description: "",
    location: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // ✅ Fetch users
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/users`)
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  // ✅ Handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Register new complaint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/complaints`, form);
      if (res.status === 201) {
        setMessage("✅ Complaint registered successfully!");
        setForm({ user_id: "", category: "", description: "", location: "" });
      }
    } catch (err) {
      console.error("Error submitting complaint:", err);
      setMessage("❌ Failed to register complaint. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-8 flex justify-center items-start">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-md p-8 max-w-lg w-full border border-gray-100"
      >
        <h2 className="text-3xl font-bold text-green-700 mb-6 text-center">
          📝 Register New Complaint
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Select User</label>
            <select
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-400 outline-none"
              required
            >
              <option value="">-- Choose a User --</option>
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Redirect to Register User Page */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="mt-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition text-sm font-medium"
            >
              ➕ Register New User
            </button>
          </div>

          {/* Complaint Info */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-400 outline-none"
              required
            >
              <option value="">Select a category</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Garbage Issue">Garbage Issue</option>
              <option value="Air Pollution">Air Pollution</option>
              <option value="Noise Pollution">Noise Pollution</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Enter location"
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the issue"
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-400 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            Submit Complaint
          </button>

          {message && (
            <p
              className={`text-center mt-3 font-medium ${
                message.startsWith("✅") ? "text-green-600" : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
}
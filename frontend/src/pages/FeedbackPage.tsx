import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Star, User, MessageSquare, Send } from "lucide-react";

// --- Types ---
interface UserData {
  user_id: number;
  name: string;
  email: string;
  role?: string;
}

interface ComplaintData {
  complaint_id: number;
  category: string;
  description: string;
}

interface FeedbackData {
  feedback_id: number;
  citizen_name?: string;
  complaint_category?: string;
  rating: number;
  comments: string;
  submitted_at: string;
}

export default function FeedbackPage() {
  // --- State ---
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  
  const [formData, setFormData] = useState({
    user_id: "",
    complaint_id: "",
    rating: 5,
    comments: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- Fetch Data on Load ---
  useEffect(() => {
    fetchPageData();
  }, []);

  const fetchPageData = async () => {
    setLoading(true);
    try {
      const API = import.meta.env.VITE_API_URL;
      console.log("📡 Connecting to:", API);

      // Promise.allSettled ensures one failure doesn't break the whole page
      const results = await Promise.allSettled([
        axios.get(`${API}/api/feedback`),
        axios.get(`${API}/api/users`),
        axios.get(`${API}/api/complaints`),
      ]);

      // Helper to extract data safely
      const extract = (res: PromiseSettledResult<any>) => 
        res.status === "fulfilled" ? (Array.isArray(res.value.data) ? res.value.data : []) : [];

      setFeedbacks(extract(results[0]));
      setUsers(extract(results[1]));
      setComplaints(extract(results[2]));

    } catch (error) {
      console.error("🔥 Critical Error loading page:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Submit Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id || !formData.complaint_id || !formData.comments) {
      alert("⚠️ Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user_id: Number(formData.user_id),
        complaint_id: Number(formData.complaint_id),
        rating: Number(formData.rating),
        comments: formData.comments
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/api/feedback`, payload);
      
      // Reset form and reload list
      setFormData({ user_id: "", complaint_id: "", rating: 5, comments: "" });
      fetchPageData();
      alert("✅ Feedback submitted successfully!");

    } catch (err: any) {
      console.error("❌ Submit Error:", err);
      alert(`Failed: ${err.response?.data?.detail || "Unknown Error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Loading State ---
  if (loading) return (
    <div className="flex items-center justify-center h-screen text-green-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        
        {/* --- LEFT: Form Section --- */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" /> Give Feedback
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Select User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Who are you?</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <select
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white"
                  >
                    <option value="">Select Citizen...</option>
                    {users.filter(u => u.role === 'citizen').map(u => (
                      <option key={u.user_id} value={u.user_id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Select Complaint */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Regarding Complaint</label>
                <select
                  value={formData.complaint_id}
                  onChange={(e) => setFormData({ ...formData, complaint_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white text-sm"
                >
                  <option value="">Select Complaint...</option>
                  {complaints.map(c => (
                    <option key={c.complaint_id} value={c.complaint_id}>
                      #{c.complaint_id} - {c.category} ({c.description.substring(0, 20)}...)
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Stars */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rate Resolution</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className={`p-2 rounded-lg transition-all ${
                        formData.rating >= star 
                          ? "bg-yellow-400 text-white shadow-sm scale-110" 
                          : "bg-gray-100 text-gray-400 hover:bg-yellow-100"
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none h-24 resize-none"
                  placeholder="How was the service?"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {submitting ? "Submitting..." : <>Submit Feedback <Send className="w-4 h-4" /></>}
              </button>

            </form>
          </div>
        </div>

        {/* --- RIGHT: List Section --- */}
        <div className="lg:col-span-2 space-y-6">
           <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Feedback</h2>
           
           {feedbacks.length === 0 ? (
             <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
               <p className="text-gray-500">No feedback received yet.</p>
             </div>
           ) : (
             <div className="grid gap-4">
               {feedbacks.map((fb) => (
                 <motion.div 
                   key={fb.feedback_id}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition"
                 >
                   <div className="flex justify-between items-start mb-2">
                     <div>
                       <h3 className="font-bold text-gray-800">{fb.citizen_name || "Unknown Citizen"}</h3>
                       <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                         Regarding: {fb.complaint_category || `Complaint #${fb.feedback_id}`}
                       </p>
                     </div>
                     <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                       <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                       <span className="font-bold text-yellow-700">{fb.rating}/5</span>
                     </div>
                   </div>
                   <p className="text-gray-600 text-sm leading-relaxed">"{fb.comments}"</p>
                   <p className="text-right text-xs text-gray-400 mt-3">
                     {new Date(fb.submitted_at).toLocaleDateString()}
                   </p>
                 </motion.div>
               ))}
             </div>
           )}
        </div>

      </motion.div>
    </div>
  );
}
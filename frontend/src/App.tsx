import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import ComplaintList from "./pages/ComplaintList";
import ComplaintStats from "./pages/ComplaintStats";
import DatabaseViewer from "./pages/DatabaseViewer";
import AdminDashboard from "./pages/AdminDashboard";
import RegisterComplaint from "./pages/RegisterComplaint";
import RegisterUser from "./pages/RegisterUser";
import AuditLogPage from "./pages/AuditLogPage";
import FeedbackPage from "./pages/FeedbackPage";


export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/complaints" element={<ComplaintList />} />
          <Route path="/stats" element={<ComplaintStats />} />
          <Route path="/database" element={<DatabaseViewer />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/complaints/new" element={<RegisterComplaint />} />
          <Route path="/register" element={<RegisterUser />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
        </Routes>
      </div>
    </div>
  );
}
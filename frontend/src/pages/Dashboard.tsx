import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Database,
  AlertTriangle,
  PieChart,
  PlusCircle,
  ClipboardList,
  MessageSquare,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  // Static navigation cards configuration
  const cards = [
    {
      title: "Register Complaint",
      desc: "File a new environmental issue with location details.",
      icon: <PlusCircle className="h-10 w-10 text-white" />,
      bg: "bg-green-600",
      action: () => navigate("/complaints/new"),
    },
    {
      title: "View Complaints",
      desc: "Browse, search, and manage existing records.",
      icon: <AlertTriangle className="h-10 w-10 text-white" />,
      bg: "bg-yellow-500",
      action: () => navigate("/complaints"),
    },
    {
      title: "Complaint Stats",
      desc: "Visualize data and monitor resolution rates.",
      icon: <PieChart className="h-10 w-10 text-white" />,
      bg: "bg-blue-600",
      action: () => navigate("/stats"),
    },
    {
      title: "Submit Feedback",
      desc: "Rate your experience and resolution quality.",
      icon: <MessageSquare className="h-10 w-10 text-white" />,
      bg: "bg-indigo-600",
      action: () => navigate("/feedback"),
    },
    {
      title: "Database Viewer",
      desc: "Direct access to raw database tables.",
      icon: <Database className="h-10 w-10 text-white" />,
      bg: "bg-amber-600",
      action: () => navigate("/database"),
    },
    {
      title: "Audit Log",
      desc: "Track system changes and administrative actions.",
      icon: <ClipboardList className="h-10 w-10 text-white" />,
      bg: "bg-red-600",
      action: () => navigate("/audit-log"),
    },
    {
      title: "Register User",
      desc: "Onboard new officers, citizens, or admins.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4m8-8a8 8 0 100 16 8 8 0 000-16z"
          />
        </svg>
      ),
      bg: "bg-purple-600",
      action: () => navigate("/register"),
    },
  ];

  // ✅ Typed as Variants to fix the "type: string" inference error
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // ✅ Typed as Variants
  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 mt-8"
        >
          <h1 className="text-5xl font-extrabold text-green-800 mb-4 tracking-tight">
            Environmental Portal
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Streamlined management for environmental complaints, monitoring, and administrative actions.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {cards.map((card, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              onClick={card.action}
              className="group cursor-pointer bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300"
            >
              <div className="p-8 flex items-start space-x-6">
                <div
                  className={`flex-shrink-0 p-4 rounded-2xl shadow-lg ${card.bg} transform group-hover:scale-110 transition-transform duration-300`}
                >
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-green-700 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    {card.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <footer className="mt-20 text-center border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-400 font-medium">
            © {new Date().getFullYear()} Environmental Management System
          </p>
        </footer>
      </div>
    </div>
  );
}
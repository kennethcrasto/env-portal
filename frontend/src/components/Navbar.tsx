import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export default function Navbar() {
  const location = useLocation();

  const links = [
  { path: "/", label: "Dashboard" },
  { path: "/complaints", label: "Complaints" },
  { path: "/stats", label: "Statistics" },
  { path: "/database", label: "Database" },
  { path: "/admin", label: "Admin" }, // new
];


  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo / Brand */}
        <motion.h1
          className="text-lg sm:text-xl font-semibold text-green-700 flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          🌿 ECMP
        </motion.h1>

        {/* Nav Links */}
        <div className="flex gap-6 text-sm sm:text-base">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative transition-colors duration-200 ${
                  isActive ? "text-green-700 font-medium" : "text-gray-600 hover:text-green-600"
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.span
                    layoutId="underline"
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-green-600 rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
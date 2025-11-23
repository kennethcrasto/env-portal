import React from "react";
import Navbar from "./components/Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-inter">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  );
};

export default Layout;

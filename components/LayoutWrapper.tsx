"use client";

import React, { useState } from "react";
import { Sidebar, MobileSidebar } from "@/components/Sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ThemeProvider } from "next-themes";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex h-screen overflow-hidden">
        <div
          className={`hidden md:flex md:flex-col ${
            isCollapsed ? "md:w-16" : "md:w-64"
          }`}
        >
          <Sidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        </div>
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between px-4 py-4 md:px-6 border-b">
            <div className="flex items-center">
              <MobileSidebar />
              <h1 className="text-2xl font-semibold ml-4">Receipt Manager</h1>
            </div>
            {/* Add user menu or other header items here */}
          </header>
          <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-6">
            {/* <Breadcrumbs /> */}
            <div className="mt-4">{children}</div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

"use client";

import { Toaster } from "sonner";
import SVMOffsetCalculator from "./components/SVMOffsetCalculator";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { ProjectSidebar } from "./components/ProjectSidebar";
import { useProjectStore } from "./stores/store";

export default function Home() {

  const { isSidebarOpen, setIsSidebarOpen } = useProjectStore();
  return (
    <div className="flex">
      <ProjectSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col gap-y-12 w-full">
          <div className="absolute left-0 top-0 w-px h-full bg-border z-20"></div>
          <div className="absolute right-0 top-0 w-px h-full bg-border z-20"></div>
          <Header />
          <SVMOffsetCalculator />
          <Toaster />
          <Footer />
      </div>
    </div>
  );
}

"use client";

import { Button } from "@blueshift-gg/ui-components";
import { useProjectStore } from "../stores/store";
import { toast } from "./Toast";

export default function Header() {
  const {
    setIsSidebarOpen,
    isSidebarOpen,
    currentProject,
    projects,
    createNewProject,
    prepareShare,
    setShareModalOpen,
    accounts,
    language,
  } = useProjectStore();

  const handleExportProject = () => {
    if (!currentProject) {
      toast.error("No project selected to export.");
      return;
    }
    const projectData = {
      id: currentProject.id,
      name: currentProject.name || "Untitled Project",
      accounts,
      language,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectData.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    prepareShare();
    setShareModalOpen(true);
  };

  const handleImportFromWelcome = () => {
    setIsSidebarOpen(true);
  };

  return (
    <header className="sticky top-0 border-b border-b-border bg-background relative z-10">
      <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            icon={{ name: "Table" }}
            hideLabel
          />
        <div className="flex items-center gap-2 sm:gap-2 ">
          {projects.length === 0 ? (
            <>
              <Button
                onClick={createNewProject}
                variant="primary"
                size="sm"
                icon={{ name: "Add" }}
                label="New Project"
                className="hidden sm:flex"
              />
              <Button
                onClick={createNewProject}
                variant="primary"
                size="sm"
                icon={{ name: "Add" }}
                label="New"
                className="flex sm:hidden"
              />
              <Button
                onClick={handleImportFromWelcome}
                variant="outline"
                size="sm"
                icon={{ name: "Upload" }}
                label="Import Project"
                className="hidden sm:flex"
              />
              <Button
                onClick={handleImportFromWelcome}
                variant="outline"
                size="sm"
                icon={{ name: "Upload" }}
                label="Import"
                className="flex sm:hidden"
              />
            </>
          ) : currentProject ? (
            <>
              <Button
                onClick={handleExportProject}
                variant="primary"
                size="sm"
                icon={{ name: "Download" }}
                label="Export"
                className="hidden sm:flex"
              />
              <Button
                onClick={handleExportProject}
                variant="primary"
                size="sm"
                icon={{ name: "Download" }}
                label="Save"
                className="flex sm:hidden"
              />
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                icon={{ name: "Share" }}
                label="Share"
              />
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

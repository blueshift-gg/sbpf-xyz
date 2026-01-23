"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { Button, Icon } from "@blueshift-gg/ui-components";
import { Project } from "../types";
import { useProjectStore } from "../stores/store";
import { toast } from "./Toast";
import { v4 as uuidv4 } from "uuid";
import { useClickAway, useMediaQuery } from "@uidotdev/usehooks";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectSidebar = ({ isOpen, onClose }: ProjectSidebarProps) => {
  const {
    projects,
    currentProject,
    selectProject,
    importProject,
    setProjectToDelete,
    setDeleteConfirmOpen,
    createNewProject,
    renameProject,
  } = useProjectStore();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const editInputRef = React.useRef<HTMLInputElement>(null);
  const isXlScreen = useMediaQuery("(min-width: 1280px)");
  const [editingProjectId, setEditingProjectId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");

  React.useEffect(() => {
    if (editingProjectId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingProjectId]);

  // Close sidebar when transitioning from desktop to smaller screen
  React.useEffect(() => {
    if (!isXlScreen && isOpen) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isXlScreen]);

  const sidebarRef = useClickAway<HTMLDivElement>(() => {
    // Only close on click-away for smaller screens (below XL)
    if (!isXlScreen && isOpen) {
      onClose();
    }
  });

  const handleSelectProject = (project: Project) => {
    selectProject(project);
    // Only close sidebar on smaller screens
    if (!isXlScreen) {
      onClose();
    }
  };

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  };

  const handleStartEditing = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingName(project.name);
  };

  const handleConfirmRename = () => {
    if (editingProjectId && editingName.trim()) {
      renameProject(editingProjectId, editingName.trim());
    }
    setEditingProjectId(null);
    setEditingName("");
  };

  const handleCancelRename = () => {
    setEditingProjectId(null);
    setEditingName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirmRename();
    } else if (e.key === "Escape") {
      handleCancelRename();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error("No file selected.");
      return;
    }
    if (!file.name.endsWith(".json")) {
      toast.error("Please upload a .json file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const projectData = JSON.parse(e.target?.result as string) as Project;
        if (
          !projectData.id ||
          !projectData.name ||
          !Array.isArray(projectData.accounts) ||
          (projectData.language &&
            !["ASM", "Rust", "C"].includes(projectData.language))
        ) {
          toast.error("Invalid project file", "Missing or incorrect required fields.");
          return;
        }
        const validAccountTypes = [
          "System",
          "SPL Token",
          "SPL Mint",
          "Token2022 Account",
          "Token2022 Mint",
          "Sysvar Clock",
          "Sysvar Rent",
          "TypedAccount",
        ];
        const isValidAccounts = projectData.accounts.every((account) =>
          validAccountTypes.includes(account.type)
        );
        if (!isValidAccounts) {
          toast.error("Invalid project file", "Contains invalid account types.");
          return;
        }
        importProject({
          ...projectData,
          id: uuidv4(),
          lastModified: Date.now(),
        });
        toast.success("Project imported successfully!");
      } catch (error) {
        console.error("Failed to parse project file:", error);
        toast.error("Failed to import project", "Invalid JSON format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className={cn("w-72 fixed xl:relative duration-200 ease-in-out z-100 shrink-0", isOpen ? "w-72" : "w-0")}
    >
      <div
        ref={sidebarRef}
        className={cn("fixed left-0 top-0 h-dvh w-72 bg-card-solid xl:bg-card-solid/50 flex flex-col z-50 transition-transform", isOpen ? "translate-x-0" : "-translate-x-full")}>
        <div
          className="px-3.5 pr-2.5 min-h-[66px] flex justify-between items-center"
        >
          <h2
            className="font-semibold text-brand-primary text-xl"
          >
            sbpf.xyz
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            icon={{ name: "Cross", size: 14 }}
            className="xl:hidden"
            hideLabel
          />
        </div>

        {/* Scrollable projects list */}
        <div className="flex flex-col gap-y-0 px-3.5 flex-1 pt-4">
          <h2
            className="font-semibold border-border-light text-lg flex items-center gap-x-1.5"
          >
            <Icon name="SmartContract" />
            Projects
          </h2>
          <div className="h-full max-h-[75dvh] overflow-y-auto">
            {projects.length > 0 ? (
              <div className="space-y-2 py-4">
                {projects
                  .sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))
                  .map((project) => (
                    <div key={project.id} className={cn("relative flex items-center gap-2", currentProject?.id === project.id && "before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-brand-primary")}>
                      <div onClick={() => editingProjectId !== project.id && handleSelectProject(project)} className="w-full py-2.5 pl-3.5 pr-2 border border-border hover:border-border-light hover:cursor-pointer hover:bg-card-foreground/25 transition flex items-center justify-between">
                        <input
                          ref={editingProjectId === project.id ? editInputRef : undefined}
                          type="text"
                          value={editingProjectId === project.id ? editingName : project.name}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={handleKeyDown}
                          disabled={editingProjectId !== project.id}
                          className={cn(
                            "outline-none text-sm text-shade-tertiary font-mono bg-transparent w-full",
                            editingProjectId !== project.id && "pointer-events-none"
                          )}
                        />
                        {editingProjectId === project.id ? (
                          <div className="flex items-center gap-1">
                            <div className="p-1 flex items-center justify-center hover:text-state-success" onClick={(e) => { handleConfirmRename(); e.stopPropagation(); }}>
                              <Icon name="Check" size={12} />
                            </div>
                            <div className="p-1 flex items-center justify-center hover:text-shade-primary" onClick={(e) => { handleCancelRename(); e.stopPropagation(); }}>
                              <Icon name="Cross" size={12} />
                            </div>
                          </div>
                        ) : (
                          <div className="p-1 flex items-center justify-center" onClick={(e) => { handleStartEditing(project); e.stopPropagation(); }}>
                            <Icon name="Pen" size={12} />
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => handleDeleteClick(project)}
                        icon={{ name: "Bin" }}
                        hideLabel
                        className="shrink-0 text-state-error before:bg-state-error/15! hover:bg-state-error/5! hover:text-state-error!"
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex items-center justify-center border border-border py-4 mt-4">
                <p className="text-sm text-shade-tertiary font-mono">No projects found</p>
              </div>
            )}
          </div>
        </div>

        {/* Sticky bottom buttons */}
        <div
          className="p-3.5 border-t space-y-3 border-t-border"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
          <Button
            variant="primary"
            className="w-full"
            onClick={createNewProject}
            icon={{ name: "Add" }}
            label="New Project"
            size="md"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            icon={{ name: "Upload" }}
            label="Import Project"
            size="md"
          />
        </div>
      </div>
    </div>
  );
};


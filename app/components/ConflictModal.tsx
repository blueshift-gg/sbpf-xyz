"use client";

import { Button } from "@blueshift-gg/ui-components";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useProjectStore } from "../stores/store";
import { toast } from "./Toast";
import { v4 as uuidv4 } from "uuid";
import { Account } from "../types";

export const ConflictModal = () => {
  const {
    conflictModalOpen,
    setConflictModalOpen,
    conflictProject,
    setConflictProject,
    setCurrentProject,
    setProjects,
    projects,
    saveLastProjectId,
    setShowWelcome,
  } = useProjectStore();

  const migrateCustomFields = (accounts: Account[]): Account[] => {
    return accounts.map((account) => {
      if (account.type === "TypedAccount" && account.customFields) {
        return {
          ...account,
          customFields: account.customFields.map((field) =>
            field.id ? field : { ...field, id: uuidv4() }
          ),
        };
      }
      return account;
    });
  };

  const loadSharedProject = (override: boolean = false) => {
    if (!conflictProject) return;

    const migratedAccounts = migrateCustomFields(conflictProject.accounts);
    let finalProject;

    if (override) {
      // Override existing project
      const existingIndex = projects.findIndex(
        (p) => p.id === conflictProject.id
      );
      finalProject = {
        ...conflictProject,
        accounts: migratedAccounts,
        lastModified: Date.now(),
      };
      if (existingIndex >= 0) {
        const updatedProjects = [...projects];
        updatedProjects[existingIndex] = finalProject;
        setProjects(updatedProjects);
      } else {
        setProjects([...projects, finalProject]);
      }
    } else {
      // Create new project with new UUID
      finalProject = {
        ...conflictProject,
        accounts: migratedAccounts,
        id: uuidv4(),
        lastModified: Date.now(),
      };
      setProjects([...projects, finalProject]);
    }

    setCurrentProject(finalProject);
    setShowWelcome(false);
    saveLastProjectId(finalProject.id);

    if (typeof window !== "undefined") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    toast.success(`Loaded shared project: ${finalProject.name}`);
    setConflictModalOpen(false);
    setConflictProject(null);
  };

  const handleOverrideProject = () => {
    loadSharedProject(true);
  };

  const handleCreateNewProject = () => {
    loadSharedProject(false);
  };

  return (
    <Dialog open={conflictModalOpen} onOpenChange={setConflictModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Project Already Exists</DialogTitle>
          <DialogDescription>
            A project with the same ID already exists locally. Would you like to
            override it or create a new project with the same name?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Shared Project:</h4>
            <p className="text-sm">
              <strong>Name:</strong> {conflictProject?.name}
            </p>
            <p className="text-sm">
              <strong>Accounts:</strong> {conflictProject?.accounts.length || 0}
            </p>
            <p className="text-sm">
              <strong>Language:</strong> {conflictProject?.language}
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose onClick={() => setConflictModalOpen(false)}>
            Cancel
          </DialogClose>
          <Button variant="outline" onClick={handleCreateNewProject}>
            Create New Project
          </Button>
          <Button variant="primary" onClick={handleOverrideProject}>
            Override Existing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

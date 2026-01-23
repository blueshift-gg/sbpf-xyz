import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";
import {
  Account,
  Project,
  Language,
  InstructionDataField,
} from "../types";

const AUTOSAVE_DELAY = 1000;
const LAST_PROJECT_KEY = "svm-last-project-id";
const PROJECTS_STORAGE_KEY = "svm-projects";

interface ProjectStore {
  // UI State
  isSidebarOpen: boolean;
  showWelcome: boolean;
  deleteConfirmOpen: boolean;
  shareModalOpen: boolean;
  conflictModalOpen: boolean;

  // Project State
  projects: Project[];
  currentProject: Project | null;
  projectToDelete: Project | null;
  conflictProject: Project | null;

  // Current Project Data
  accounts: Account[];
  instructionData: InstructionDataField[];
  language: Language;

  // Share Modal State
  projectJson: string;
  shareUrl: string;

  // Actions
  setIsSidebarOpen: (open: boolean) => void;
  setShowWelcome: (show: boolean) => void;
  setDeleteConfirmOpen: (open: boolean) => void;
  setShareModalOpen: (open: boolean) => void;
  setConflictModalOpen: (open: boolean) => void;
  setProjectToDelete: (project: Project | null) => void;
  setConflictProject: (project: Project | null) => void;

  // Project Management
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  loadProjects: () => Project[];
  saveProjects: () => void;
  saveLastProjectId: (projectId: string) => void;
  getLastProjectId: () => string | null;

  // Account Management
  setAccounts: (accounts: Account[]) => void;
  addAccount: () => void;
  updateAccount: (index: number, updatedAccount: Account) => void;
  removeAccount: (index: number) => void;
  reorderAccounts: (oldIndex: number, newIndex: number) => void;

  // Instruction Data Management
  setInstructionData: (data: InstructionDataField[]) => void;
  addInstructionDataField: () => void;
  updateInstructionDataField: (
    index: number,
    field: InstructionDataField
  ) => void;
  removeInstructionDataField: (index: number) => void;
  reorderInstructionData: (oldIndex: number, newIndex: number) => void;

  // Language
  setLanguage: (language: Language) => void;

  // Project Operations
  createNewProject: () => void;
  selectProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  importProject: (projectData: Project) => void;
  updateProjectName: (name: string) => void;
  renameProject: (projectId: string, newName: string) => void;
  autosave: () => void;

  // Share Operations
  prepareShare: () => void;
  setProjectJson: (json: string) => void;
  setShareUrl: (url: string) => void;
}

// Helper function to migrate custom fields
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

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      // Initial State
      isSidebarOpen: true,
      showWelcome: false,
      deleteConfirmOpen: false,
      shareModalOpen: false,
      conflictModalOpen: false,
      projects: [],
      currentProject: null,
      projectToDelete: null,
      conflictProject: null,
      accounts: [],
      instructionData: [],
      language: "ASM",
      projectJson: "",
      shareUrl: "",

      // UI Actions
      setIsSidebarOpen: (open) => set({ isSidebarOpen: open }),
      setShowWelcome: (show) => set({ showWelcome: show }),
      setDeleteConfirmOpen: (open) => set({ deleteConfirmOpen: open }),
      setShareModalOpen: (open) => set({ shareModalOpen: open }),
      setConflictModalOpen: (open) => set({ conflictModalOpen: open }),
      setProjectToDelete: (project) => set({ projectToDelete: project }),
      setConflictProject: (project) => set({ conflictProject: project }),

      // Project Management
      setProjects: (projects) => {
        set({ projects });
        try {
          localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
        } catch (error) {
          console.error("Error saving projects:", error);
        }
      },
      setCurrentProject: (project) => {
        set({ currentProject: project });
        if (project) {
          set({
            accounts: migrateCustomFields(project.accounts),
            instructionData: project.instructionData || [],
            language: project.language || "ASM",
          });
          get().saveLastProjectId(project.id);
        } else {
          set({
            accounts: [],
            instructionData: [],
            language: "ASM",
          });
        }
      },
      loadProjects: () => {
        try {
          const savedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
          if (savedProjects) {
            const parsedProjects = JSON.parse(savedProjects) as Project[];
            set({ projects: parsedProjects });
            return parsedProjects;
          }
        } catch (error) {
          console.error("Error loading projects:", error);
        }
        return [];
      },
      saveProjects: () => {
        const { projects } = get();
        try {
          localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
        } catch (error) {
          console.error("Error saving projects:", error);
        }
      },
      saveLastProjectId: (projectId) => {
        try {
          localStorage.setItem(LAST_PROJECT_KEY, projectId);
        } catch (error) {
          console.error("Error saving last project ID:", error);
        }
      },
      getLastProjectId: () => {
        try {
          return localStorage.getItem(LAST_PROJECT_KEY);
        } catch (error) {
          console.error("Error getting last project ID:", error);
          return null;
        }
      },

      // Account Management
      setAccounts: (accounts) => set({ accounts }),
      addAccount: () => {
        const { accounts } = get();
        const newAccount: Account = {
          name: `ACCOUNT${accounts.length + 1}`,
          type: "System",
          dataLength: 0,
          extensions: [],
        };
        set({ accounts: [...accounts, newAccount] });
        get().autosave();
      },
      updateAccount: (index, updatedAccount) => {
        const { accounts } = get();
        const updated = [...accounts];
        updated[index] = updatedAccount;
        set({ accounts: updated });
        get().autosave();
      },
      removeAccount: (index) => {
        const { accounts } = get();
        set({ accounts: accounts.filter((_, i) => i !== index) });
        get().autosave();
      },
      reorderAccounts: (oldIndex, newIndex) => {
        const { accounts } = get();
        const reordered = arrayMove(accounts, oldIndex, newIndex);
        set({ accounts: reordered });
        get().autosave();
      },

      // Instruction Data Management
      setInstructionData: (data) => set({ instructionData: data }),
      addInstructionDataField: () => {
        const { instructionData } = get();
        const newField: InstructionDataField = {
          name: `field_${instructionData.length + 1}`,
          type: "u8",
        };
        set({ instructionData: [...instructionData, newField] });
        get().autosave();
      },
      updateInstructionDataField: (index, field) => {
        const { instructionData } = get();
        const updated = [...instructionData];
        updated[index] = field;
        set({ instructionData: updated });
        get().autosave();
      },
      removeInstructionDataField: (index) => {
        const { instructionData } = get();
        set({
          instructionData: instructionData.filter((_, i) => i !== index),
        });
        get().autosave();
      },
      reorderInstructionData: (oldIndex, newIndex) => {
        const { instructionData } = get();
        const reordered = arrayMove(instructionData, oldIndex, newIndex);
        set({ instructionData: reordered });
        get().autosave();
      },

      // Language
      setLanguage: (language) => {
        set({ language });
        get().autosave();
      },

      // Project Operations
      createNewProject: () => {
        const { projects } = get();
        
        // Generate unique project name
        const baseName = "New Project";
        let projectName = baseName;
        let counter = 2;
        
        const existingNames = new Set(projects.map((p) => p.name));
        while (existingNames.has(projectName)) {
          projectName = `${baseName} ${counter}`;
          counter++;
        }
        
        const newProject: Project = {
          id: uuidv4(),
          name: projectName,
          accounts: [],
          lastModified: Date.now(),
        };
        const updatedProjects = [...projects, newProject];
        set({
          currentProject: newProject,
          projects: updatedProjects,
          showWelcome: false,
        });
        get().saveProjects();
        get().saveLastProjectId(newProject.id);
        get().setCurrentProject(newProject);
      },
      selectProject: (project) => {
        get().setCurrentProject(project);
        get().setShowWelcome(false);
      },
      deleteProject: (projectId) => {
        const { projects, currentProject } = get();
        const updatedProjects = projects.filter((p) => p.id !== projectId);
        set({ projects: updatedProjects });
        get().saveProjects();

        if (currentProject?.id === projectId) {
          if (updatedProjects.length > 0) {
            const nextProject = updatedProjects[0];
            get().setCurrentProject(nextProject);
            get().setShowWelcome(false);
            get().saveLastProjectId(nextProject.id);
          } else {
            set({
              currentProject: null,
              showWelcome: true,
            });
            get().setCurrentProject(null);
            try {
              localStorage.removeItem(LAST_PROJECT_KEY);
            } catch (error) {
              console.error("Error removing last project ID:", error);
            }
          }
        }
      },
      importProject: (projectData) => {
        const migratedAccounts = migrateCustomFields(projectData.accounts);
        const newProject: Project = {
          ...projectData,
          accounts: migratedAccounts,
          id: uuidv4(),
          lastModified: Date.now(),
        };
        const { projects } = get();
        set({
          projects: [...projects, newProject],
          currentProject: newProject,
          showWelcome: false,
        });
        get().setCurrentProject(newProject);
        get().setIsSidebarOpen(false);
      },
      updateProjectName: (name) => {
        const { currentProject } = get();
        if (currentProject) {
          set({
            currentProject: { ...currentProject, name },
          });
          get().autosave();
        }
      },
      renameProject: (projectId, newName) => {
        const { projects, currentProject } = get();
        const updatedProjects = projects.map((p) =>
          p.id === projectId ? { ...p, name: newName, lastModified: Date.now() } : p
        );
        set({ projects: updatedProjects });
        // Also update currentProject if it's the one being renamed
        if (currentProject && currentProject.id === projectId) {
          set({ currentProject: { ...currentProject, name: newName } });
        }
      },
      autosave: () => {
        const { currentProject, accounts, instructionData, language, projects } =
          get();
        if (currentProject) {
          const timeoutId = setTimeout(() => {
            const updatedProject: Project = {
              ...currentProject,
              accounts,
              instructionData,
              language,
              lastModified: Date.now(),
            };

            const existingProjectIndex = projects.findIndex(
              (p) => p.id === currentProject.id
            );
            let updatedProjects;

            if (existingProjectIndex >= 0) {
              updatedProjects = [...projects];
              updatedProjects[existingProjectIndex] = updatedProject;
            } else {
              updatedProjects = [...projects, updatedProject];
            }

            set({ projects: updatedProjects, currentProject: updatedProject });
            get().saveProjects();
          }, AUTOSAVE_DELAY);

          return () => clearTimeout(timeoutId);
        }
      },

      // Share Operations
      prepareShare: () => {
        const { currentProject, accounts } = get();
        if (!currentProject) return;

        const projectData: Project = {
          id: currentProject.id,
          name: currentProject.name || "Untitled Project",
          accounts,
        };

        const json = JSON.stringify(projectData, null, 2);
        set({ projectJson: json });

        const baseUrl =
          typeof window !== "undefined" &&
            window.location.hostname === "localhost"
            ? "http://localhost:3000"
            : "https://sbpf.xyz";

        const encodedData = encodeURIComponent(
          btoa(JSON.stringify(projectData))
        );
        const url = `${baseUrl}?project=${encodedData}`;
        set({ shareUrl: url });
      },
      setProjectJson: (json) => set({ projectJson: json }),
      setShareUrl: (url) => set({ shareUrl: url }),
    }),
    {
      name: "project-store",
      partialize: (state) => ({
        // Only persist certain state, not everything
        projects: state.projects,
      }),
    }
  )
);

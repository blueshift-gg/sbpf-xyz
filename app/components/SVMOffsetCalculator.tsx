"use client";

import React, { useEffect, useState } from "react";
import { Button, CrosshairCorners, Icon, Tabs } from "@blueshift-gg/ui-components";
import { Project, Account } from "../types";
import OffsetDisplay from "./OffsetDisplay";
import { toast } from "./Toast";
import { useProjectStore } from "../stores/store";
import { WelcomeScreen } from "./WelcomeScreen";
import { ShareModal } from "./ShareModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { ConflictModal } from "./ConflictModal";
import { v4 as uuidv4 } from "uuid";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableAccountEntry } from "./AccountEntry";
import { SortableInstructionDataEntry } from "./InstructionDataEntry";

const SVMOffsetCalculator = () => {
  const {
    showWelcome,
    setShowWelcome,
    accounts,
    instructionData,
    language,
    currentProject,
    setProjects,
    setCurrentProject,
    addAccount,
    updateAccount,
    removeAccount,
    reorderAccounts,
    addInstructionDataField,
    updateInstructionDataField,
    removeInstructionDataField,
    reorderInstructionData,
    setLanguage,
    setConflictModalOpen,
    setConflictProject,
    loadProjects,
    getLastProjectId,
    saveLastProjectId,
  } = useProjectStore();

  // Collapse state for sections
  const [isAccountsCollapsed, setIsAccountsCollapsed] = useState(false);
  const [isInstructionDataCollapsed, setIsInstructionDataCollapsed] = useState(false);

  // Wrapper to expand accounts section when adding
  const handleAddAccount = () => {
    if (isAccountsCollapsed) {
      setIsAccountsCollapsed(false);
    }
    addAccount();
  };

  // Wrapper to expand instruction data section when adding
  const handleAddInstructionDataField = () => {
    if (isInstructionDataCollapsed) {
      setIsInstructionDataCollapsed(false);
    }
    addInstructionDataField();
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle account reordering
  const handleAccountDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = active.id as number;
      const newIndex = over.id as number;
      reorderAccounts(oldIndex, newIndex);
    }
  };

  // Handle instruction data reordering
  const handleInstructionDataDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = active.id as number;
      const newIndex = over.id as number;
      reorderInstructionData(oldIndex, newIndex);
    }
  };

  // Migrate custom fields helper
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

  // Load projects from localStorage on mount and restore last project
  useEffect(() => {
    try {
      const parsedProjects = loadProjects();
      if (!parsedProjects || parsedProjects.length === 0) {
        // No projects loaded, show welcome
        setShowWelcome(true);
        return;
      }

      // Check for shared project in URL
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedProject = urlParams.get("project");

        if (sharedProject) {
          try {
            const decodedData = atob(decodeURIComponent(sharedProject));
            const projectData = JSON.parse(decodedData) as Project;

            // Check if a project with this UUID already exists
            const existingProject = parsedProjects.find(
              (p: Project) => p.id === projectData.id
            );

            if (existingProject) {
              // UUID conflict - show modal to ask user
              setConflictProject(projectData);
              setConflictModalOpen(true);
            } else {
              // No conflict - load directly
              const migratedAccounts = migrateCustomFields(
                projectData.accounts
              );

              // Create project with migrated accounts
              const projectWithMigratedAccounts: Project = {
                ...projectData,
                accounts: migratedAccounts,
              };

              setCurrentProject(projectWithMigratedAccounts);
              setShowWelcome(false);
              saveLastProjectId(projectData.id);

              // Clean up URL
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname
              );
              toast.success(`Loaded shared project: ${projectData.name}`);
            }
            return;
          } catch (error) {
            console.error("Error loading shared project:", error);
            toast.error("Error loading shared project", "Invalid data.");
          }
        }

        // Restore last opened project if no shared project
        try {
          const lastProjectId = getLastProjectId();
          if (lastProjectId && parsedProjects.length > 0) {
            const lastProject = parsedProjects.find(
              (p: Project) => p.id === lastProjectId
            );
            if (lastProject) {
              setCurrentProject(lastProject);
              setShowWelcome(false);
            } else {
              setShowWelcome(true);
            }
          } else {
            setShowWelcome(true);
          }
        } catch (error) {
          console.error("Error accessing last project:", error);
          setShowWelcome(true);
        }
      }
    } catch (error) {
      console.error("Error loading initial state:", error);
      setShowWelcome(true);
      setProjects([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabsItems = [
    {
      label: "ASM",
      value: "ASM",
      selected: language === "ASM",
      onClick: () => setLanguage("ASM"),
    },
    {
      label: "Rust",
      value: "Rust",
      selected: language === "Rust",
      onClick: () => setLanguage("Rust"),
    },
    {
      label: "C",
      value: "C",
      selected: language === "C",
      onClick: () => setLanguage("C"),
    },
  ];

  return (
    <div>
      <ShareModal />
      <DeleteConfirmModal />
      <ConflictModal />
        {showWelcome || !currentProject ? (
          <WelcomeScreen />
        ) : (
          <div className="xl:flex-row flex flex-col gap-y-12 items-center xl:items-start gap-x-6 w-full mx-auto px-4 xl:px-12 min-h-[calc(100vh-128px)]">
            <div className="flex flex-col gap-y-4 w-full">
              <div className="relative p-0.5 px-2 w-max">
                <span className="px-1 text-xl text-shade-primary font-medium">Inputs</span>
                <CrosshairCorners animationDelay={0} size={4} spacingX={0} className="text-shade-mute" />
              </div>
              <div className="p-3 flex flex-col gap-y-4 bg-card-solid/50">
                <div className="flex flex-col gap-y-4 p-2.5 sm:p-4 bg-card-foreground/50 border border-border">
                  <div className="gap-y-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-x-2">
                      {accounts.length > 0 && (
                        <button
                          onClick={() => setIsAccountsCollapsed(!isAccountsCollapsed)}
                          className="flex items-center justify-center p-1 hover:bg-card-foreground transition rounded cursor-pointer"
                        >
                          <Icon name={isAccountsCollapsed ? "Plus" : "Minus"} size={16} />
                        </button>
                      )}
                      <span className="font-mono text-shade-primary">
                        Accounts
                      </span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <Button
                        onClick={handleAddAccount}
                        variant="primary"
                        icon={{ name: "Add" }}
                        label="Add Account"
                        size="sm"
                      />
                    </div>
                  </div>
                  {accounts.length > 0 && !isAccountsCollapsed && (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleAccountDragEnd}
                    >
                      <SortableContext
                        items={accounts.map((_, index) => index)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex flex-col gap-y-2">
                          {accounts.map((account, index) => (
                            <SortableAccountEntry
                              key={index}
                              index={index}
                              account={account}
                              accounts={accounts}
                              updateAccount={updateAccount}
                              removeAccount={removeAccount}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>

                <div className="flex flex-col gap-y-4 p-2.5 sm:p-4 bg-card-foreground/50 border border-border">
                  <div className="gap-y-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-x-2">
                      {instructionData.length > 0 && (
                        <button
                          onClick={() => setIsInstructionDataCollapsed(!isInstructionDataCollapsed)}
                          className="flex items-center justify-center p-1 hover:bg-card-foreground transition rounded cursor-pointer"
                        >
                          <Icon name={isInstructionDataCollapsed ? "Plus" : "Minus"} size={16} />
                        </button>
                      )}
                      <span className="font-mono text-shade-primary">
                        Instruction Data
                      </span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <Button
                        onClick={handleAddInstructionDataField}
                        variant="primary"
                        icon={{ name: "Add" }}
                        label="Add Field"
                        size="sm"
                      />
                    </div>
                  </div>
                  {instructionData.length > 0 && !isInstructionDataCollapsed && (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleInstructionDataDragEnd}
                    >
                      <SortableContext
                        items={instructionData.map((_, index) => index)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex flex-col gap-y-2">
                          {instructionData.map((field, index) => (
                            <SortableInstructionDataEntry
                              key={index}
                              index={index}
                              field={field}
                              fields={instructionData}
                              updateField={updateInstructionDataField}
                              removeField={removeInstructionDataField}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-y-4 w-full xl:max-w-[500px]">
              <div className="relative p-0.5 px-2 w-max">
                <span className="px-1 text-xl text-shade-primary font-medium">Offsets Result</span>
                <CrosshairCorners animationDelay={0} size={4} spacingX={0} className="text-shade-mute" />
              </div>
              <div className="p-3 flex flex-col gap-y-4 bg-card-solid/50">
                <Tabs
                  variant="tab"
                  theme="primary"
                  items={tabsItems}
                  className="flex-1"
                />
                <OffsetDisplay
                  accounts={accounts}
                  instructionData={instructionData}
                  language={language}
                />
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default SVMOffsetCalculator;

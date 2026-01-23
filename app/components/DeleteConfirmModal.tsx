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

export const DeleteConfirmModal = () => {
  const {
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    projectToDelete,
    setProjectToDelete,
    deleteProject,
  } = useProjectStore();

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      toast.success("Project deleted successfully.");
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setProjectToDelete(null);
  };

  return (
    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{projectToDelete?.name}
            &quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose onClick={cancelDelete}>Cancel</DialogClose>
          <Button variant="primary" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

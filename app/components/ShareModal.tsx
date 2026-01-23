"use client";

import { Button, Icon } from "@blueshift-gg/ui-components";
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

export const ShareModal = () => {
  const {
    shareModalOpen,
    setShareModalOpen,
    shareUrl,
    projectJson,
    currentProject,
  } = useProjectStore();

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share URL copied to clipboard!");
    } catch (error) {
      console.error("Error copying URL:", error);
      toast.error("Error copying URL", "Please try selecting and copying manually.");
    }
  };

  const copyProjectJson = async () => {
    try {
      await navigator.clipboard.writeText(projectJson);
      toast.success("JSON copied to clipboard!");
    } catch (error) {
      console.error("Error copying JSON:", error);
      toast.error("Error copying JSON", "Please try selecting and copying manually.");
    }
  };

  const downloadProjectJson = () => {
    if (!currentProject) return;

    const blob = new Blob([projectJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentProject.name
      .toLowerCase()
      .replace(/\s+/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Project JSON downloaded!");
  };

  return (
    <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription>
            Share your project with others using a URL or export it as a JSON
            file.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-y-6 mt-6">
          {/* Share URL Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Share URL</h3>
            <div className="bg-background p-3 flex justify-between items-center">
              <span className="text-sm text-shade-secondary font-medium font-code truncate w-[calc(100%-100px)]">{shareUrl}</span>
              <Button
                onClick={copyShareUrl}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Icon name="Copy" />
              </Button>
            </div>
            <p className="text-xs text-shade-secondary">
              Anyone with this URL can view and import your project
              configuration.
            </p>
          </div>

          {/* Export JSON Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Export JSON</h3>
            <div className="bg-background p-3 flex flex-col gap-y-2">
              <pre className="text-xs whitespace-pre-wrap break-all">
                {projectJson}
              </pre>
              <div className="flex w-full justify-end gap-2">
                <Button size="xs" onClick={copyProjectJson} variant="secondary">
                  <Icon name="Copy" size={12} />
                  Copy JSON
                </Button>
                <Button size="xs" onClick={downloadProjectJson} variant="secondary">
                  <Icon name="Download" />
                  Download JSON
                </Button>
              </div>
            </div>
            <p className="text-xs text-shade-secondary">
              Save the project configuration as a JSON file or copy it to your
              clipboard.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

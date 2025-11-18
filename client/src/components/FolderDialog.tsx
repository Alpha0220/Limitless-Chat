import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "rename" | "delete";
  folderId?: number;
  folderName?: string;
  onSuccess?: () => void;
}

export function FolderDialog({
  open,
  onOpenChange,
  mode,
  folderId,
  folderName,
  onSuccess,
}: FolderDialogProps) {
  const [name, setName] = useState(folderName || "");
  const createMutation = trpc.folders.create.useMutation();
  const updateMutation = trpc.folders.update.useMutation();
  const deleteMutation = trpc.folders.delete.useMutation();
  const utils = trpc.useUtils();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Folder name cannot be empty");
      return;
    }

    try {
      await createMutation.mutateAsync({ name: name.trim() });
      toast.success("Folder created successfully");
      setName("");
      onOpenChange(false);
      utils.folders.list.invalidate();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create folder"
      );
    }
  };

  const handleRename = async () => {
    if (!name.trim() || !folderId) {
      toast.error("Folder name cannot be empty");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        folderId,
        name: name.trim(),
      });
      toast.success("Folder renamed successfully");
      setName("");
      onOpenChange(false);
      utils.folders.list.invalidate();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to rename folder"
      );
    }
  };

  const handleDelete = async () => {
    if (!folderId) return;

    try {
      await deleteMutation.mutateAsync({ folderId });
      toast.success("Folder deleted successfully");
      onOpenChange(false);
      utils.folders.list.invalidate();
      utils.chat.list.invalidate();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete folder"
      );
    }
  };

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" && "Create New Folder"}
            {mode === "rename" && "Rename Folder"}
            {mode === "delete" && "Delete Folder"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" && "Create a new folder to organize your chats"}
            {mode === "rename" && "Enter a new name for this folder"}
            {mode === "delete" &&
              "Are you sure? Chats in this folder will be moved to the root"}
          </DialogDescription>
        </DialogHeader>

        {mode !== "delete" && (
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Folder name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  mode === "create" ? handleCreate() : handleRename();
                }
              }}
              disabled={isLoading}
              autoFocus
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (mode === "create") handleCreate();
              else if (mode === "rename") handleRename();
              else handleDelete();
            }}
            disabled={isLoading}
            variant={mode === "delete" ? "destructive" : "default"}
          >
            {isLoading ? "Loading..." : mode === "delete" ? "Delete" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

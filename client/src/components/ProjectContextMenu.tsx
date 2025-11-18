import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ProjectContextMenuProps {
  projectId: number;
  projectName: string;
  children: React.ReactNode;
  onRename?: () => void;
  onDelete?: () => void;
}

export function ProjectContextMenu({
  projectId,
  projectName,
  children,
  onRename,
  onDelete,
}: ProjectContextMenuProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAction, setDeleteAction] = useState<"delete" | "move">("move");
  const [newName, setNewName] = useState(projectName);

  const utils = trpc.useUtils();

  const renameProject = trpc.projects.rename.useMutation({
    onSuccess: () => {
      toast.success("Project renamed successfully");
      setRenameDialogOpen(false);
      utils.projects.list.invalidate();
      utils.chat.list.invalidate();
      onRename?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to rename project");
    },
  });

  const deleteProject = trpc.projects.deleteWithOptions.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully");
      setDeleteDialogOpen(false);
      utils.projects.list.invalidate();
      utils.chat.list.invalidate();
      onDelete?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete project");
    },
  });

  const handleRename = () => {
    if (newName.trim() && newName !== projectName) {
      renameProject.mutate({
        projectId,
        name: newName.trim(),
      });
    } else {
      setRenameDialogOpen(false);
    }
  };

  const handleDelete = () => {
    deleteProject.mutate({
      projectId,
      action: deleteAction,
    });
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() => {
              setNewName(projectName);
              setRenameDialogOpen(true);
            }}
            className="cursor-pointer"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="cursor-pointer text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Rename Dialog */}
      <AlertDialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Project</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new project name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={handleRename}
              disabled={renameProject.isPending || !newName.trim()}
            >
              Rename
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              What would you like to do with the chats inside?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="delete-action"
                value="move"
                checked={deleteAction === "move"}
                onChange={(e) => setDeleteAction(e.target.value as "delete" | "move")}
              />
              <span>Move chats to Recent Chats</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="delete-action"
                value="delete"
                checked={deleteAction === "delete"}
                onChange={(e) => setDeleteAction(e.target.value as "delete" | "move")}
              />
              <span>Delete all chats</span>
            </label>
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
  } from "@/components/ui/dialog";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Folder, Trash2, FolderPlus, Plus, Pencil } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ChatContextMenuProps {
  chatId: number;
  children: React.ReactNode;
  onDelete?: () => void;
  onMove?: () => void;
  initialTitle?: string;
}

export function ChatContextMenu({
  chatId,
  children,
  onDelete,
  onMove,
}: ChatContextMenuProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  
  const deleteMutation = trpc.chat.delete.useMutation();
  const renameMutation = trpc.chat.updateTitle.useMutation();
  const moveToFolderMutation = trpc.chat.moveToFolder.useMutation();
  const moveToProjectMutation = trpc.chat.moveToProject.useMutation();
  const createProjectMutation = trpc.projects.create.useMutation();
  const createFolderMutation = trpc.folders.create.useMutation();
  
  const projectsQuery = trpc.projects.list.useQuery();
  const foldersQuery = trpc.folders.list.useQuery();
  const utils = trpc.useUtils();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ chatId });
      toast.success("Chat deleted successfully");
      utils.chat.list.invalidate();
      onDelete?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete chat"
      );
    }
    setShowDeleteConfirm(false);
  };
  const handleRename = async () => {
    if (!newChatName.trim()) {
      toast.error("Chat name cannot be empty");
      return;
    }
    try {
      await renameMutation.mutateAsync({ chatId, title: newChatName.trim() });
      toast.success("Chat renamed successfully");
      utils.chat.list.invalidate();
      setShowRenameDialog(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to rename chat"
      );
    }
  };

  const handleMoveToFolder = async (folderId: number) => {
    try {
      // First clear project if it has one
      await moveToProjectMutation.mutateAsync({ chatId, projectId: undefined });
      // Then move to folder
      await moveToFolderMutation.mutateAsync({ chatId, folderId });
      toast.success("Chat moved to folder successfully");
      utils.chat.list.invalidate();
      utils.folders.list.invalidate();
      utils.projects.list.invalidate();
      onMove?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to move chat"
      );
    }
  };

  const handleMoveToRoot = async () => {
    try {
      // Clear both project and folder
      await moveToProjectMutation.mutateAsync({ chatId, projectId: undefined });
      await moveToFolderMutation.mutateAsync({ chatId, folderId: undefined });
      toast.success("Chat moved to recent chats");
      utils.chat.list.invalidate();
      utils.folders.list.invalidate();
      utils.projects.list.invalidate();
      onMove?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to move chat"
      );
    }
  };

  const handleMoveToProject = async (projectId: number) => {
    try {
      // First clear folder if it has one
      await moveToFolderMutation.mutateAsync({ chatId, folderId: undefined });
      // Then move to project
      await moveToProjectMutation.mutateAsync({ chatId, projectId });
      toast.success("Chat moved to project successfully");
      utils.chat.list.invalidate();
      utils.projects.list.invalidate();
      utils.folders.list.invalidate();
      onMove?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to move chat"
      );
    }
  };

  const handleCreateNewProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Project name cannot be empty");
      return;
    }
    try {
      const newProject = await createProjectMutation.mutateAsync({
        name: newProjectName,
      });
      
      // Move chat to the newly created project
      if (newProject.projectId) {
        await handleMoveToProject(newProject.projectId);
      }
      
      toast.success("Project created and chat moved successfully");
      utils.projects.list.invalidate();
      setNewProjectName("");
      setShowNewProjectDialog(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create project"
      );
    }
  };

  const handleCreateNewFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name cannot be empty");
      return;
    }
    try {
      const newFolder = await createFolderMutation.mutateAsync({
        name: newFolderName,
      });
      
      // Move chat to the newly created folder
      if (newFolder.folderId) {
        await handleMoveToFolder(newFolder.folderId);
      }
      
      toast.success("Folder created and chat moved successfully");
      utils.folders.list.invalidate();
      setNewFolderName("");
      setShowNewFolderDialog(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create folder"
      );
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          {/* Rename */}
          <ContextMenuItem
            onClick={() => setShowRenameDialog(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            <span>Rename</span>
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Move to Project */}
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <FolderPlus className="mr-2 h-4 w-4" />
              <span>Move to project</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onClick={() => setShowNewProjectDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New project
              </ContextMenuItem>
              {projectsQuery.data && projectsQuery.data.length > 0 && (
                <>
                  <ContextMenuSeparator />
                  {projectsQuery.data.map((project) => (
                    <ContextMenuItem
                      key={project.id}
                      onClick={() => handleMoveToProject(project.id)}
                    >
                      {project.name}
                    </ContextMenuItem>
                  ))}
                </>
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Move to Folder */}
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Folder className="mr-2 h-4 w-4" />
              <span>Move to folder</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onClick={() => setShowNewFolderDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New folder
              </ContextMenuItem>
              <ContextMenuItem onClick={handleMoveToRoot}>
                Root (No folder)
              </ContextMenuItem>
              {foldersQuery.data && foldersQuery.data.length > 0 && (
                <>
                  <ContextMenuSeparator />
                  {foldersQuery.data.map((folder) => (
                    <ContextMenuItem
                      key={folder.id}
                      onClick={() => handleMoveToFolder(folder.id)}
                    >
                      {folder.name}
                    </ContextMenuItem>
                  ))}
                </>
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator />

          <ContextMenuItem
            onClick={() => setShowDeleteConfirm(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>
              Enter a new name for your chat.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Chat name"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={renameMutation.isPending}
            >
              {renameMutation.isPending ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Enter a name for your new project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateNewProject();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewProjectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewProject}
              disabled={createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateNewFolder();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewFolderDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewFolder}
              disabled={createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

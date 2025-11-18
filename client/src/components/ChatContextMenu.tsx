import { useState } from "react";
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
import { Folder, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ChatContextMenuProps {
  chatId: number;
  children: React.ReactNode;
  onDelete?: () => void;
  onMove?: () => void;
}

export function ChatContextMenu({
  chatId,
  children,
  onDelete,
  onMove,
}: ChatContextMenuProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteMutation = trpc.chat.delete.useMutation();
  const moveToFolderMutation = trpc.chat.moveToFolder.useMutation();
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

  const handleMoveToFolder = async (folderId: number) => {
    try {
      await moveToFolderMutation.mutateAsync({ chatId, folderId });
      toast.success("Chat moved successfully");
      utils.chat.list.invalidate();
      utils.folders.list.invalidate();
      onMove?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to move chat"
      );
    }
  };

  const handleMoveToRoot = async () => {
    try {
      await moveToFolderMutation.mutateAsync({ chatId });
      toast.success("Chat moved to root");
      utils.chat.list.invalidate();
      utils.folders.list.invalidate();
      onMove?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to move chat"
      );
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Folder className="mr-2 h-4 w-4" />
              <span>Move to folder</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
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
    </>
  );
}

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  FileText,
  Folder,
  MessageSquare,
  Settings,
  CreditCard,
  Coins,
  Image,
  LogOut,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ProjectsSection } from "@/components/ProjectsSection";
import { useAuth } from "@/_core/hooks/useAuth";
import { SearchBar } from "@/components/SearchBar";
import { FolderDialog } from "@/components/FolderDialog";
import { ChatContextMenu } from "@/components/ChatContextMenu";
import { useState } from "react";
import { toast } from "sonner";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedChatId: number | null;
  onSelectChat: (chatId: number | null) => void;
  selectedProjectId: number | null;
  onSelectProject: (projectId: number | null) => void;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  selectedChatId,
  onSelectChat,
  selectedProjectId,
  onSelectProject,
}: SidebarProps) {
  const [, setLocation] = useLocation();
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<{ type: "folder" | "project"; id: number } | null>(null);
  
  // Fetch user info
  const { user, logout } = useAuth();
  
  // Fetch projects
  const { data: projectsData } = trpc.projects.list.useQuery();
  
  // Fetch folders
  const { data: foldersData } = trpc.folders.list.useQuery();
  
  // Fetch recent chats (without project or folder)
  const { data: recentChatsData } = trpc.chat.getRecent.useQuery();
  
  // Fetch credit balance
  const { data: balance } = trpc.credits.getBalance.useQuery();

  // Get chats for a specific project
  const getProjectChats = (projectId: number) => {
    const { data } = trpc.chat.getByProject.useQuery({ projectId });
    return data || [];
  };

  // Get chats for a specific folder
  const getFolderChats = (folderId: number) => {
    const { data } = trpc.chat.getByFolder.useQuery({ folderId });
    return data || [];
  };

  // Delete folder mutation
  const deleteFolder = trpc.folders.deleteWithOptions.useMutation({
    onSuccess: () => {
      toast.success("Folder deleted successfully");
      setDeleteDialogOpen(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete folder");
    },
  });

  // Delete project mutation
  const deleteProject = trpc.projects.deleteWithOptions.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully");
      setDeleteDialogOpen(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete project");
    },
  });

  const handleNewChat = () => {
    onSelectChat(null);
    setLocation("/");
  };

  const handleSignout = async () => {
    await logout();
    setLocation("/");
  };

  const handleDeleteFolderOrProject = (action: "delete" | "move") => {
    if (!deleteDialogOpen) return;

    if (deleteDialogOpen.type === "folder") {
      deleteFolder.mutate({
        folderId: deleteDialogOpen.id,
        action,
      });
    } else {
      deleteProject.mutate({
        projectId: deleteDialogOpen.id,
        action,
      });
    }
  };

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 shadow-sm overflow-hidden max-w-xs",
        isCollapsed ? "w-16" : "w-64",
        // Mobile: Full-width overlay when open, hidden when collapsed
        "md:relative md:translate-x-0",
        isCollapsed ? "fixed -translate-x-full md:translate-x-0" : "fixed inset-y-0 left-0 z-50 w-full md:w-64 md:max-w-[255px]"
      )}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0 overflow-hidden">
        {!isCollapsed && (
          <h1 className="text-lg font-semibold text-sidebar-foreground truncate flex-1">Limitless Chat</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navigation - Scrollable */}
      <ScrollArea className="flex-1 overflow-hidden w-full">
        <div className="px-0 py-4 space-y-1 w-full">
          {/* New Chat Button */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent font-medium truncate px-3",
              isCollapsed && "justify-center px-2"
            )}
            onClick={handleNewChat}
          >
            <Plus className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 truncate">New Chat</span>}
          </Button>

          {/* Search Bar */}
          {!isCollapsed && (
            <div className="px-3 py-2">
              <SearchBar className="w-full" onSelectChat={onSelectChat} />
            </div>
          )}

          {/* Templates */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent truncate px-3",
              isCollapsed && "justify-center px-2"
            )}
            onClick={() => setLocation("/templates")}
          >
            <FileText className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 truncate">Templates</span>}
          </Button>

          {/* Media Creation */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent truncate px-3",
              isCollapsed && "justify-center px-2"
            )}
            onClick={() => setLocation("/media")}
          >
            <Image className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 truncate">Media Creation</span>}
          </Button>
        </div>

        {!isCollapsed && (
          <>
            <div className="px-0 py-4">
              <Separator className="bg-sidebar-border" />
            </div>

            {/* Accordion for collapsible sections */}
            <Accordion type="multiple" defaultValue={["projects", "folders", "recent-chats"]} className="w-full px-0">
              {/* Projects Section */}
              <AccordionItem value="projects" className="border-none px-3">
                <AccordionTrigger className="py-2 hover:bg-sidebar-accent rounded-md text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0 flex justify-between items-center group">
                  <span>Projects</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation("/");
                    }}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-sidebar-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Create project"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-2 w-full px-0">
                  {projectsData && projectsData.length > 0 ? (
                    projectsData.map((project) => {
                      const projectChats = getProjectChats(project.id);
                      return (
                        <div key={project.id} className="space-y-1">
                          <div className="flex items-center justify-between group px-3">
                            <Button
                              variant="ghost"
                              className="flex-1 justify-start text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent truncate"
                              title={project.name}
                              onClick={() => onSelectProject(project.id)}
                            >
                              <Folder className="h-4 w-4 flex-shrink-0" />
                              <span className="ml-3 truncate">{project.name}</span>
                              <span className="ml-2 text-xs text-muted-foreground flex-shrink-0">({projectChats.length})</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteDialogOpen({ type: "project", id: project.id });
                              }}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {/* Project chats */}
                          {projectChats.length > 0 && (
                            <div className="ml-4 space-y-1">
                              {projectChats.map((chat) => (
                                <ChatContextMenu
                                  key={chat.id}
                                  chatId={chat.id}
                                  onDelete={() => onSelectChat(null)}
                                >
                                  <div className="group relative flex items-center w-full">
                                    <Button
                                      variant="ghost"
                                      className={cn(
                                        "flex-1 justify-start text-left text-xs text-muted-foreground hover:bg-sidebar-accent truncate px-2",
                                        selectedChatId === chat.id && "bg-sidebar-accent text-sidebar-foreground"
                                      )}
                                      onClick={() => onSelectChat(chat.id)}
                                      title={chat.title || "New Chat"}
                                    >
                                      <MessageSquare className="h-3 w-3 flex-shrink-0" />
                                      <span className="ml-2 truncate">{chat.title || "New Chat"}</span>
                                    </Button>
                                  </div>
                                </ChatContextMenu>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="px-3 text-xs text-muted-foreground">No projects yet</p>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Folders Section */}
              <AccordionItem value="folders" className="border-none px-3">
                <AccordionTrigger className="py-2 hover:bg-sidebar-accent rounded-md text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0 flex justify-between items-center group">
                  <span>Folders</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFolderDialogOpen(true);
                    }}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-sidebar-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Create folder"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-2 w-full px-0">
                  {foldersData && foldersData.length > 0 ? (
                    foldersData.map((folder) => {
                      const folderChats = getFolderChats(folder.id);
                      return (
                        <div key={folder.id} className="space-y-1">
                          <div className="flex items-center justify-between group px-3">
                            <Button
                              variant="ghost"
                              className="flex-1 justify-start text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent truncate"
                              title={folder.name}
                            >
                              <Folder className="h-4 w-4 flex-shrink-0" />
                              <span className="ml-3 truncate">{folder.name}</span>
                              <span className="ml-2 text-xs text-muted-foreground flex-shrink-0">({folderChats.length})</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteDialogOpen({ type: "folder", id: folder.id });
                              }}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete folder"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {/* Folder chats */}
                          {folderChats.length > 0 && (
                            <div className="ml-4 space-y-1">
                              {folderChats.map((chat) => (
                                <ChatContextMenu
                                  key={chat.id}
                                  chatId={chat.id}
                                  onDelete={() => onSelectChat(null)}
                                >
                                  <div className="group relative flex items-center w-full">
                                    <Button
                                      variant="ghost"
                                      className={cn(
                                        "flex-1 justify-start text-left text-xs text-muted-foreground hover:bg-sidebar-accent truncate px-2",
                                        selectedChatId === chat.id && "bg-sidebar-accent text-sidebar-foreground"
                                      )}
                                      onClick={() => onSelectChat(chat.id)}
                                      title={chat.title || "New Chat"}
                                    >
                                      <MessageSquare className="h-3 w-3 flex-shrink-0" />
                                      <span className="ml-2 truncate">{chat.title || "New Chat"}</span>
                                    </Button>
                                  </div>
                                </ChatContextMenu>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="px-3 text-xs text-muted-foreground">No folders yet</p>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Recent Chats */}
              <AccordionItem value="recent-chats" className="border-none px-3">
                <AccordionTrigger className="py-2 hover:bg-sidebar-accent rounded-md text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0">
                  Recent Chats
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-1 w-full px-0">
                  {recentChatsData && recentChatsData.length > 0 ? (
                    recentChatsData.map((chat) => (
                      <ChatContextMenu
                        key={chat.id}
                        chatId={chat.id}
                        onDelete={() => onSelectChat(null)}
                      >
                        <div className="group relative flex items-center w-full">
                          <Button
                            variant="ghost"
                            className={cn(
                              "flex-1 justify-start text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent truncate px-3",
                              selectedChatId === chat.id && "bg-sidebar-accent"
                            )}
                            onClick={() => onSelectChat(chat.id)}
                            title={chat.title || "New Chat"}
                          >
                            <MessageSquare className="h-4 w-4 flex-shrink-0" />
                            <span className="ml-3 truncate">{chat.title || "New Chat"}</span>
                          </Button>
                        </div>
                      </ChatContextMenu>
                    ))
                  ) : (
                    <p className="px-3 text-xs text-muted-foreground">No recent chats</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
      </ScrollArea>

      {/* Footer - Fixed, No Scroll */}
      {!isCollapsed && (
        <div className="border-t border-sidebar-border p-3 space-y-2 flex-shrink-0 overflow-hidden">
          {/* User Info Display */}
          {user && (
            <div className="px-3 py-2 rounded-lg bg-sidebar-accent overflow-hidden">
              <p className="text-xs text-muted-foreground truncate">Logged in as</p>
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name || user.email || "User"}
              </p>
            </div>
          )}

          {/* Credits Display */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-sidebar-accent overflow-hidden">
            <div className="flex items-center gap-2 min-w-0">
              <Coins className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-sidebar-foreground truncate">Credits</span>
            </div>
            <span className="text-sm font-bold text-sidebar-foreground flex-shrink-0">
              {balance?.credits || 0}
            </span>
          </div>
          <p className="text-xs text-muted-foreground px-3 truncate">
            {balance?.billingType === "prepaid" ? "Pre-paid" : "Pay-as-you-go"}
          </p>

          {/* Buy Credits Button */}
          <Button
            variant="outline"
            className="w-full justify-start border-sidebar-border hover:bg-sidebar-accent truncate"
            onClick={() => setLocation("/pricing")}
          >
            <CreditCard className="h-4 w-4 flex-shrink-0" />
            <span className="ml-2 truncate">Buy Credits</span>
          </Button>

          {/* Settings Button */}
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent truncate"
            onClick={() => setLocation("/settings")}
          >
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span className="ml-2 truncate">Settings</span>
          </Button>

          {/* Sign Out Button with AlertDialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950 truncate"
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span className="ml-2 truncate">Sign Out</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign Out</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to sign out? You'll need to log in again to access your chats and credits.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex gap-3 justify-end">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSignout}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sign Out
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Folder Dialog */}
      <FolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        mode="create"
      />

      {/* Delete Folder/Project Dialog */}
      <AlertDialog open={!!deleteDialogOpen} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteDialogOpen?.type === "folder" ? "Folder" : "Project"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              What would you like to do with the chats inside?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => handleDeleteFolderOrProject("move")}
              disabled={deleteFolder.isPending || deleteProject.isPending}
            >
              Move to Recent
            </Button>
            <AlertDialogAction
              onClick={() => handleDeleteFolderOrProject("delete")}
              disabled={deleteFolder.isPending || deleteProject.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

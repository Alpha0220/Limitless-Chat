import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  
  // Fetch user info
  const { user, logout } = useAuth();
  
  // Fetch chats from backend
  const { data: chatsData } = trpc.chat.list.useQuery();
  
  // Fetch folders
  const { data: foldersData } = trpc.folders.list.useQuery();
  
  // Filter chats by selected project
  const chats = (chatsData || []).filter(chat => {
    if (selectedProjectId === null) return true; // Show all chats
    return chat.projectId === selectedProjectId; // Show only project chats
  });
  
  // Fetch credit balance
  const { data: balance } = trpc.credits.getBalance.useQuery();

  const handleNewChat = () => {
    onSelectChat(null);
    setLocation("/");
  };

  const handleSignout = async () => {
    await logout();
    setLocation("/");
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
              <SearchBar className="w-full" />
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

            {/* Projects Section */}
            <div className="px-3 pb-4 overflow-hidden">
              <ProjectsSection
                selectedProjectId={selectedProjectId}
                onSelectProject={onSelectProject}
              />
            </div>

            <div className="px-0 pb-4">
              <Separator className="bg-sidebar-border" />
            </div>

            {/* Folders Section */}
            <div className="px-0 pb-4 space-y-2 overflow-hidden w-full">
              <div className="px-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Folders
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFolderDialogOpen(true)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-sidebar-foreground"
                  title="Create folder"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1 w-full">
                {foldersData && foldersData.length > 0 ? (
                  foldersData.map((folder) => (
                    <Button
                      key={folder.id}
                      variant="ghost"
                      className="w-full justify-start text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent truncate px-3"
                      title={folder.name}
                    >
                      <Folder className="h-4 w-4 flex-shrink-0" />
                      <span className="ml-3 truncate">{folder.name}</span>
                    </Button>
                  ))
                ) : (
                  <p className="px-3 text-xs text-muted-foreground">No folders yet</p>
                )}
              </div>
            </div>

            <div className="px-0 pb-4">
              <Separator className="bg-sidebar-border" />
            </div>

            {/* Recent Chats */}
            <div className="px-0 pb-4 space-y-2 overflow-hidden w-full">
              <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Chats
              </h2>
              <div className="space-y-1 w-full">
                {chats.map((chat) => (
                  <ChatContextMenu
                    key={chat.id}
                    chatId={chat.id}
                    onDelete={() => onSelectChat(null)}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent truncate px-3",
                        selectedChatId === chat.id && "bg-sidebar-accent"
                      )}
                      onClick={() => onSelectChat(chat.id)}
                      title={chat.title || "New Chat"}
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <span className="ml-3 truncate">{chat.title || "New Chat"}</span>
                    </Button>
                  </ChatContextMenu>
                ))}
              </div>
            </div>
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
    </div>
  );
}

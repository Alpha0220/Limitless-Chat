import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ProjectsSection } from "@/components/ProjectsSection";

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
  
  // Fetch chats from backend
  const { data: chatsData } = trpc.chat.list.useQuery();
  
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

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 shadow-sm",
        isCollapsed ? "w-16" : "w-64",
        // Mobile: Full-width overlay when open, hidden when collapsed
        "md:relative md:translate-x-0",
        isCollapsed ? "fixed -translate-x-full md:translate-x-0" : "fixed inset-y-0 left-0 z-50 w-full md:w-64"
      )}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0">
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

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {/* New Chat Button */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent font-medium",
              isCollapsed && "justify-center px-2"
            )}
            onClick={handleNewChat}
          >
            <Plus className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">New Chat</span>}
          </Button>

          {/* Search */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent",
              isCollapsed && "justify-center px-2"
            )}
          >
            <Search className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Search</span>}
          </Button>

          {/* Notes */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent",
              isCollapsed && "justify-center px-2"
            )}
          >
            <FileText className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Notes</span>}
          </Button>

          {/* Templates */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent",
              isCollapsed && "justify-center px-2"
            )}
            onClick={() => setLocation("/templates")}
          >
            <FileText className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Templates</span>}
          </Button>

          {/* Media Creation */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent",
              isCollapsed && "justify-center px-2"
            )}
            onClick={() => setLocation("/media")}
          >
            <Image className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Media Creation</span>}
          </Button>

          {/* Duplicate Search */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent",
              isCollapsed && "justify-center px-2"
            )}
          >
            <Search className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Search</span>}
          </Button>

          {/* Duplicate Notes */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent",
              isCollapsed && "justify-center px-2"
            )}
          >
            <FileText className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Notes</span>}
          </Button>
        </div>

        {!isCollapsed && (
          <>
            <Separator className="my-4 bg-sidebar-border" />

            {/* Projects Section */}
            <ProjectsSection
              selectedProjectId={selectedProjectId}
              onSelectProject={onSelectProject}
            />

            <Separator className="my-4 bg-sidebar-border" />

            {/* Recent Chats */}
            <div className="space-y-2">
              <h2 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Chats
              </h2>
              <div className="space-y-1">
                {chats.map((chat) => (
                  <Button
                    key={chat.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent truncate",
                      selectedChatId === chat.id && "bg-sidebar-accent"
                    )}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    <span className="ml-3 truncate">{chat.title || "New Chat"}</span>
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </ScrollArea>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {/* Credits Display */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-sidebar-accent">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-sidebar-foreground">Credits</span>
            </div>
            <span className="text-sm font-bold text-sidebar-foreground">
              {balance?.credits || 0}
            </span>
          </div>
          <p className="text-xs text-muted-foreground px-3">
            {balance?.billingType === "prepaid" ? "Pre-paid" : "Pay-as-you-go"}
          </p>

          {/* Buy Credits Button */}
          <Button
            variant="outline"
            className="w-full justify-start border-sidebar-border hover:bg-sidebar-accent"
            onClick={() => setLocation("/pricing")}
          >
            <CreditCard className="h-4 w-4" />
            <span className="ml-2">Buy Credits</span>
          </Button>

          {/* Settings Button */}
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Settings className="h-4 w-4" />
            <span className="ml-2">Settings</span>
          </Button>
        </div>
      )}
    </div>
  );
}

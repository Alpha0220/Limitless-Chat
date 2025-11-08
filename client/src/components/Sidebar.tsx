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
        "flex h-screen flex-col border-r border-border bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        // Mobile: Full-width overlay when open, hidden when collapsed
        "md:relative md:translate-x-0",
        isCollapsed ? "fixed -translate-x-full md:translate-x-0" : "fixed inset-y-0 left-0 z-50 w-full md:w-64"
      )}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-gray-800">
        {!isCollapsed && (
          <h1 className="text-lg font-semibold text-white">Limitless Chat</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-2">
          {/* New Chat Button */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800",
              isCollapsed && "justify-center px-2"
            )}
            onClick={handleNewChat}
          >
            <Plus className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">New Chat</span>}
          </Button>

          {/* Search */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800",
              isCollapsed && "justify-center px-2"
            )}
          >
            <Search className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Search</span>}
          </Button>

          {/* Notes Button */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800",
              isCollapsed && "justify-center px-2"
            )}
            onClick={() => setLocation("/notes")}
          >
            <FileText className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Notes</span>}
          </Button>

          {/* Templates Button */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800",
              isCollapsed && "justify-center px-2"
            )}
            onClick={() => setLocation("/templates")}
          >
            <FileText className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Templates</span>}
          </Button>
          
          {/* Media Creation */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800",
              isCollapsed && "justify-center px-2"
            )}
            onClick={() => setLocation("/media")}
          >
            <Image className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Media Creation</span>}
          </Button>       {/* Search */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800",
              isCollapsed && "justify-center px-2"
            )}
          >
            <Search className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Search</span>}
          </Button>

          {/* Notes */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800",
              isCollapsed && "justify-center px-2"
            )}
          >
            <FileText className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Notes</span>}
          </Button>

          {!isCollapsed && (
            <>
              <Separator className="my-4 bg-gray-800" />              {/* Projects Section */}
              <ProjectsSection
                selectedProjectId={selectedProjectId}
                onSelectProject={onSelectProject}
              />    {/* Chats Section */}
              <div className="space-y-1">
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                  Recent Chats
                </div>
                {chats.length === 0 ? (
                  <div className="px-2 py-2 text-sm text-gray-500">
                    No chats yet
                  </div>
                ) : (
                  chats.map((chat) => (
                    <Button
                      key={chat.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800",
                        selectedChatId === chat.id && "bg-gray-800 text-white"
                      )}
                      onClick={() => onSelectChat(chat.id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="ml-2 truncate">{chat.title}</span>
                    </Button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-gray-800 p-2 space-y-1">
        {/* Credits Display */}
        {!isCollapsed && balance && (
          <div className="px-3 py-2 mb-2 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="text-gray-300">Credits</span>
              </div>
              <span className="font-semibold text-white">{balance.credits}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {balance.billingType === "prepaid" ? "Pre-paid" : "Pay-as-you-go"}
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800",
            isCollapsed && "justify-center px-2"
          )}
          onClick={() => setLocation("/pricing")}
        >
          <CreditCard className="h-5 w-5" />
          {!isCollapsed && <span className="ml-2">Buy Credits</span>}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800",
            isCollapsed && "justify-center px-2"
          )}
          onClick={() => setLocation("/settings")}
        >
          <Settings className="h-5 w-5" />
          {!isCollapsed && <span className="ml-2">Settings</span>}
        </Button>
      </div>
    </div>
  );
}

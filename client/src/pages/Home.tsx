import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { ModelSwitcher } from "@/components/ModelSwitcher";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with Model Switcher */}
        <header className="h-14 border-b border-gray-800 flex items-center justify-center px-4">
          <ModelSwitcher
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </header>

        {/* Chat Area */}
        <ChatArea
          chatId={selectedChatId}
          selectedModel={selectedModel}
          onChatCreated={(chatId) => setSelectedChatId(chatId)}
        />
      </div>
    </div>
  );
}

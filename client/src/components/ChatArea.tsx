import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, Mic, Sparkles, Loader2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  creditsUsed?: number;
}

interface ChatAreaProps {
  chatId: number | null;
  selectedModel: string;
  onChatCreated?: (chatId: number) => void;
}

const suggestedPrompts = [
  {
    title: "Grammar check",
    description: "rewrite it for better readability",
  },
  {
    title: "Tell me a fun fact",
    description: "about the Roman Empire",
  },
  {
    title: "Help me study",
    description: "vocabulary for a college entrance exam",
  },
];

export function ChatArea({ chatId, selectedModel, onChatCreated }: ChatAreaProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // Fetch messages for current chat
  const { data: messagesData, isLoading: messagesLoading } = trpc.chat.getMessages.useQuery(
    { chatId: chatId! },
    { enabled: !!chatId }
  );

  const messages = messagesData || [];

  // Send message mutation
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      if (chatId) {
        utils.chat.getMessages.invalidate({ chatId });
      }
      utils.chat.list.invalidate();
      utils.credits.getBalance.invalidate();

      // If new chat was created, notify parent
      if (!chatId && data.chatId && onChatCreated) {
        onChatCreated(data.chatId);
      }

      toast.success(`Response received! ${data.creditsUsed} credits used.`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sendMessageMutation.isPending) return;

    const messageContent = input;
    setInput("");

    sendMessageMutation.mutate({
      chatId: chatId || undefined,
      model: selectedModel,
      content: messageContent,
      title: messageContent.slice(0, 50),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: { title: string; description: string }) => {
    setInput(`${prompt.title}: ${prompt.description}`);
  };

  if (messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {messages.length === 0 ? (
        // Empty state with logo and suggested prompts
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-2xl w-full space-y-8">
            {/* Logo and Model Name */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">
                {selectedModel.toUpperCase()}
              </h1>
            </div>

            {/* Suggested Prompts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Sparkles className="h-4 w-4" />
                <span>Suggested</span>
              </div>
              <div className="grid gap-3">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      handleSuggestedPrompt(prompt)
                    }
                    className="text-left p-4 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors border border-gray-800"
                  >
                    <div className="font-medium text-white mb-1">
                      {prompt.title}
                    </div>
                    <div className="text-sm text-gray-400">
                      {prompt.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Messages view
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-4",
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-white"
                  )}
                >
                  <Streamdown>{message.content}</Streamdown>
                  {message.creditsUsed && message.creditsUsed > 0 && (
                    <div className="text-xs text-gray-400 mt-2">
                      {message.creditsUsed} credits used
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sendMessageMutation.isPending && (
              <div className="flex gap-4 justify-start">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-800 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-gray-900 rounded-lg border border-gray-800 p-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
              disabled
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="How can I help you today?"
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white resize-none min-h-[24px] max-h-[200px]"
              rows={1}
              disabled={sendMessageMutation.isPending}
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
              disabled
            >
              <Mic className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sendMessageMutation.isPending}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <div className="text-xs text-gray-500 text-center mt-2">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, Mic, Sparkles } from "lucide-react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  creditsUsed?: number;
}

interface ChatAreaProps {
  chatId: number | null;
  selectedModel: string;
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

export function ChatArea({ chatId, selectedModel }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // TODO: Implement actual API call
    setTimeout(() => {
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "This is a placeholder response. The actual chat functionality will be implemented with the Limitless API integration.",
        creditsUsed: 10,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

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
                      handleSuggestedPrompt(
                        `${prompt.title}: ${prompt.description}`
                      )
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
                  {message.creditsUsed && (
                    <div className="text-xs text-gray-400 mt-2">
                      {message.creditsUsed} credits used
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
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
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <Mic className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-5 w-5" />
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

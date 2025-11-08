import { useState, useEffect, useRef } from "react";
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
  creditsUsed?: number | null;
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // Fetch messages for current chat
  const { data: messagesData, isLoading: messagesLoading } = trpc.chat.getMessages.useQuery(
    { chatId: chatId! },
    { enabled: !!chatId }
  );

  // Update local messages when data changes
  useEffect(() => {
    if (messagesData) {
      setLocalMessages(messagesData);
    }
  }, [messagesData]);

  const messages = localMessages;

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSendStreaming = async () => {
    if (!input.trim() || isStreaming) return;

    const messageContent = input;
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    // Add user message optimistically
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: messageContent,
    };
    setLocalMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("/api/stream-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          chatId: chatId || undefined,
          model: selectedModel,
          content: messageContent,
          title: messageContent.slice(0, 50),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start streaming");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let fullContent = "";
      let newChatId = chatId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);

              if (parsed.type === "start") {
                newChatId = parsed.chatId;
                if (!chatId && onChatCreated && newChatId !== null) {
                  onChatCreated(newChatId);
                }
              } else if (parsed.type === "chunk") {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              } else if (parsed.type === "done") {
                // Add assistant message
                const assistantMessage: Message = {
                  id: Date.now() + 1,
                  role: "assistant",
                  content: fullContent,
                  creditsUsed: parsed.creditsUsed,
                };
                setLocalMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent("");

                // Invalidate queries
                if (newChatId !== null) {
                  utils.chat.getMessages.invalidate({ chatId: newChatId });
                }
                utils.chat.list.invalidate();
                utils.credits.getBalance.invalidate();

                toast.success(`Response received! ${parsed.creditsUsed} credits used.`);
              } else if (parsed.type === "error") {
                throw new Error(parsed.message);
              }
            } catch (e) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      // Remove optimistic user message on error
      setLocalMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendStreaming();
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
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
        {messages.length === 0 && !streamingContent && (
          <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto">
            {/* Model Icon */}
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-6">
              <Sparkles className="h-8 w-8 text-white" />
            </div>

            {/* Model Name */}
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8 md:mb-12 text-center px-4">
              {selectedModel.toUpperCase()}
            </h2>

            {/* Suggested Prompts */}
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 text-gray-400 mb-4">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">Suggested</span>
              </div>

              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="w-full text-left p-3 md:p-4 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors border border-gray-800 touch-manipulation"
                >
                  <div className="font-medium text-white">{prompt.title}</div>
                  <div className="text-sm text-gray-400 mt-1">{prompt.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] md:max-w-[80%] rounded-2xl px-3 md:px-4 py-2 md:py-3 text-sm md:text-base",
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-100"
                )}
              >
                <Streamdown>{message.content}</Streamdown>
                {message.role === "assistant" && message.creditsUsed !== undefined && (
                  <div className="text-xs text-gray-400 mt-2">
                    {message.creditsUsed} credits used
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-800 text-gray-100">
                <Streamdown>{streamingContent}</Streamdown>
                <div className="flex items-center gap-1 mt-2">
                  <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                  <span className="text-xs text-gray-400">Generating...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-gray-800 p-3 md:p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-gray-900 rounded-2xl border border-gray-800">
            <div className="flex items-end gap-1 md:gap-2 p-2 md:p-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white shrink-0 h-9 w-9 md:h-10 md:w-10"
              >
                <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
              </Button>

              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="How can I help you today?"
                className="min-h-[24px] max-h-[200px] resize-none border-0 bg-transparent text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base"
                rows={1}
              />

              <div className="flex items-center gap-1 md:gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white h-9 w-9 md:h-10 md:w-10"
                >
                  <Mic className="h-4 w-4 md:h-5 md:w-5" />
                </Button>

                <Button
                  onClick={handleSendStreaming}
                  disabled={!input.trim() || isStreaming}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700 text-white h-9 w-9 md:h-10 md:w-10"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

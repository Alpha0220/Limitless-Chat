import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, Mic, Sparkles, Loader2, Minimize2, Maximize2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

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

const MODEL_CREDITS: Record<string, number> = {
  "openai/gpt-5": 15,
  "openai/gpt-5-pro": 25,
  "openai/gpt-4-turbo": 10,
  "openai/gpt-4o": 8,
  "anthropic/claude-opus-4.1": 20,
  "anthropic/claude-3.5-sonnet": 12,
  "anthropic/claude-3.5-sonnet-20241022": 12,
  "anthropic/claude-3-sonnet": 10,
  "anthropic/claude-3-haiku": 6,
  "perplexity/llama-3.1-sonar-small-128k-online": 3,
  "perplexity/llama-3.1-sonar-large-128k-online": 8,
  "google/gemini-2.0-flash-001": 2,
};

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
  const [isMinimized, setIsMinimized] = useState(false);
  const [showMinMaxButton, setShowMinMaxButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const utils = trpc.useUtils();

  // Fetch messages for current chat
  const { data: messagesData, isLoading: messagesLoading } = trpc.chat.getMessages.useQuery(
    { chatId: chatId! },
    { enabled: !!chatId }
  );

  // Fetch current user's credit balance
  const { data: creditBalance } = trpc.credits.getBalance.useQuery();

  // Fetch personalization settings
  const { data: personalizationSettings } = trpc.personalization.getSettings.useQuery();
  const { data: searchPersonalizationStatus } = trpc.personalization.getSearchPersonalizationStatus.useQuery();

  // Update local messages when data changes
  useEffect(() => {
    if (messagesData) {
      setLocalMessages(messagesData);
    }
  }, [messagesData]);

  // Clear messages and input when starting a new chat
  useEffect(() => {
    if (chatId === null) {
      setLocalMessages([]);
      setInput("");
      setStreamingContent("");
    }
  }, [chatId]);

  const messages = localMessages;

  // Show suggested prompts when no chatId (new chat) or when no messages
  const showSuggestedPrompts = chatId === null || (messages.length === 0 && !streamingContent);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Check if textarea height exceeds 2.5rem (40px)
  useEffect(() => {
    const checkTextareaHeight = () => {
      if (textareaRef.current) {
        const height = textareaRef.current.scrollHeight;
        const minHeight = 40; // 2.5rem = 40px
        setShowMinMaxButton(height > minHeight);
      }
    };

    // Check on mount and when input changes
    checkTextareaHeight();
    const interval = setInterval(checkTextareaHeight, 100);
    
    return () => clearInterval(interval);
  }, [input]);

  const handleSendStreaming = async () => {
    if (!input.trim() || isStreaming) return;

    const messageContent = input;
    const creditsNeeded = MODEL_CREDITS[selectedModel] || 10;

    // Check if user has enough credits (frontend check)
    if (creditBalance && creditBalance.credits < creditsNeeded) {
      toast.error("Insufficient credits", {
        description: `You need ${creditsNeeded} credits for this model. You have ${creditBalance.credits} credits.`,
        descriptionClassName: "text-gray-600 dark:text-gray-300",
        action: {
          label: "Buy Credits",
          onClick: () => {
            window.location.href = "/pricing";
          },
        },
        duration: 5000,
      });
      return;
    }

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
        // Parse error response to provide specific error message
        let errorMessage = "Failed to start streaming";
        let errorData: any = null;
        try {
          errorData = await response.json();
          if (errorData.error === "Insufficient credits") {
            errorMessage = "You don't have enough credits. Please buy more credits.";
            // Show toast with action button for insufficient credits
            toast.error("Insufficient credits", {
              description: "You need more credits to continue. Click to buy credits.",
              descriptionClassName: "text-gray-600 dark:text-gray-300",
              action: {
                label: "Buy Credits",
                onClick: () => {
                  window.location.href = "/pricing";
                },
              },
              duration: 5000,
            });
            return;
          } else if (errorData.error === "Invalid session") {
            errorMessage = "Your session has expired. Please refresh the page.";
          } else if (errorData.error === "Unauthorized") {
            errorMessage = "Authentication failed. Please log in again.";
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If response is not JSON, use status code
          if (response.status === 401) {
            errorMessage = "Authentication failed. Please log in again.";
          } else if (response.status === 403) {
            errorMessage = "You don't have permission to perform this action.";
          } else if (response.status === 400) {
            errorMessage = "Invalid request. Please try again.";
          }
        }
        throw new Error(errorMessage);
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

                // Invalidate queries to refresh chat list and credits
                // Note: Don't invalidate getMessages as it causes a race condition
                // The optimistic update above is sufficient
                utils.chat.list.invalidate();
                utils.credits.getBalance.invalidate();

                toast.success(`Response received! ${parsed.creditsUsed} credits used.`, {
                  className: "[&>div:nth-child(2)]:text-gray-600 dark:[&>div:nth-child(2)]:text-gray-300",
                });
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
      toast.error(error instanceof Error ? error.message : "Failed to send message", {
        className: "[&>div:nth-child(2)]:text-gray-600 dark:[&>div:nth-child(2)]:text-gray-300",
      });
      // Remove optimistic user message on error
      setLocalMessages((prev) => prev.slice(0, -1));
      // Invalidate credits on error too (in case partial deduction occurred)
      utils.credits.getBalance.invalidate();
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
      <ScrollArea className="flex-1 px-4 py-6 max-h-[calc(100vh-130px)]" ref={scrollRef}>
        {/* Messages */}
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex mb-4", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] md:max-w-[70%] rounded-lg px-4 py-3 border",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-muted text-foreground rounded-bl-none border-border"
              )}
            >
              {msg.role === "assistant" ? (
                <Streamdown>{msg.content}</Streamdown>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {showSuggestedPrompts && (
          <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto">
            {/* Model Icon */}
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>

            {/* Model Name */}
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-8 md:mb-12 text-center px-4">
              {selectedModel.toUpperCase()}
            </h2>

            {/* Personalization Status Badges */}
            {(personalizationSettings?.data?.styleTone_baseTone || 
              personalizationSettings?.data?.nickname ||
              personalizationSettings?.data?.memorySettings_allowSavedMemory) && (
              <div className="mb-6 flex flex-wrap gap-2 justify-center">
                {personalizationSettings.data?.styleTone_baseTone && (
                  <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-medium text-primary">
                    🎨 {personalizationSettings.data.styleTone_baseTone}
                  </div>
                )}
                {personalizationSettings.data?.nickname && (
                  <div className="px-3 py-1 bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300">
                    👤 {personalizationSettings.data.nickname}
                  </div>
                )}
                {personalizationSettings.data?.memorySettings_allowSavedMemory && (
                  <div className="px-3 py-1 bg-green-100 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-full text-xs font-medium text-green-700 dark:text-green-300">
                    💾 Memory
                  </div>
                )}
              </div>
            )}

            {/* Suggested Prompts */}
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">Suggested</span>
              </div>
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div className="font-medium text-sm text-foreground">{prompt.title}</div>
                  <div className="text-xs text-muted-foreground">{prompt.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Streaming Content */}
        {streamingContent && (
          <div className="flex mb-4 justify-start">
            <div className="max-w-[80%] md:max-w-[70%] rounded-lg px-4 py-3 bg-muted text-foreground rounded-bl-none border border-border">
              <Streamdown>{streamingContent}</Streamdown>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Input Area - Fixed at bottom, textarea grows upward up to 50vh */}
      <div className="absolute bottom-0 z-10 w-full border-t border-border bg-background p-4 flex-shrink-0">
        <div className="flex gap-2 max-w-4xl mx-auto items-end">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="How can I help you today?"
              className={cn(
                "w-full resize-none overflow-y-auto min-h-[2.5rem]",
                isMinimized ? "max-h-[2.5rem]" : "max-h-[50vh]"
              )}
              rows={1}
            />
            {/* Minimize/Maximize Button */}
            {showMinMaxButton && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-4 h-6 w-6 text-slate-500 bg-slate-100 hover:text-white hover:bg-primary/50"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <Mic className="h-5 w-5" />
          </Button>

          <Button
            onClick={handleSendStreaming}
            disabled={isStreaming || !input.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
            size="icon"
          >
            {isStreaming ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

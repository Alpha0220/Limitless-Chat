import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, Plus, Mic, Sparkles, Loader2, Minimize2, Maximize2, ChevronDown, Upload, Monitor, Camera, Image, Brain, Globe } from "lucide-react";
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

export function ChatArea({ chatId, selectedModel, onChatCreated, onModelChange }: ChatAreaProps & { onModelChange?: (model: string) => void }) {
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

  const cleanModelName = (modelId: string) => {
    const parts = modelId.split('/');
    return parts.length > 1 ? parts[1].replace(/-/g, ' ') : modelId;
  };

  if (messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
        <div className="max-w-3xl mx-auto pb-4">
          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex mb-6", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm overflow-hidden",
                  msg.role === "user"
                    ? "bg-primary/10 text-primary rounded-br-none"
                    : "bg-muted/50 text-foreground rounded-bl-none"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="break-words">
                    <Streamdown>{msg.content}</Streamdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed break-words break-all">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {showSuggestedPrompts && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] transition-all animate-in fade-in duration-500">
              {/* Model Icon */}
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-8 shadow-sm">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>

              {/* Model Name */}
              <h2 className="text-3xl font-medium text-foreground mb-12 text-center tracking-tight">
                {cleanModelName(selectedModel).toUpperCase()}
              </h2>

              {/* Suggested Prompts */}
              <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="flex flex-col text-left p-4 rounded-2xl bg-muted/30 hover:bg-muted/60 transition-all border border-transparent hover:border-border/50"
                  >
                    <span className="font-medium text-sm text-foreground mb-1">{prompt.title}</span>
                    <span className="text-xs text-muted-foreground">{prompt.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Streaming Content */}
          {streamingContent && (
            <div className="flex mb-6 justify-start">
              <div className="max-w-[85%] rounded-2xl px-5 py-3.5 bg-muted/50 text-foreground rounded-bl-none shadow-sm">
                <Streamdown>{streamingContent}</Streamdown>
              </div>
            </div>
          )}
          
          {/* Spacer for fixed bottom input */}
          <div className="h-32" /> 
        </div>
      </ScrollArea>

      {/* Input Area - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-background via-background to-transparent pb-6 pt-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className={cn(
            "bg-muted/40 backdrop-blur-xl border border-input rounded-[28px] shadow-sm transition-all duration-200",
            "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 focus-within:bg-background"
          )}>
            {/* Upper Section: Textarea */}
            <div className="relative p-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className={cn(
                  "w-full resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 text-base py-3 px-4 min-h-[60px]",
                  isMinimized ? "max-h-[60px]" : "max-h-[200px]"
                )}
                rows={1}
              />
            </div>

            {/* Separator / Layout Indicator */}
            {/* The user requested a layout with spacing/dots. We use a subtle padding logic instead of a hard line to keep it modern, or a very subtle border if desired.
                Gemini uses empty space. We'll add a small spacer. */}
            
            {/* Lower Section: Controls */}
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              {/* Left Controls */}
              {/* Left Controls */}
              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      title="Attach files"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-1.5" align="start" side="top">
                    <div className="grid gap-0.5">
                      <Button variant="ghost" className="justify-start gap-2 h-9 px-2 text-sm font-normal">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Upload className="h-4 w-4" />
                        </div>
                        <span className="truncate">Add photos & files</span>
                      </Button>
                      <Button variant="ghost" className="justify-start gap-2 h-9 px-2 text-sm font-normal">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <Monitor className="h-4 w-4" />
                        </div>
                        <span className="truncate">Take screenshot</span>
                      </Button>
                      <Button variant="ghost" className="justify-start gap-2 h-9 px-2 text-sm font-normal">
                         <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <Camera className="h-4 w-4" />
                        </div>
                        <span className="truncate">Take photo</span>
                      </Button>
                      
                      <div className="my-1 border-t border-border/50" />
                      
                      <Button variant="ghost" className="justify-start gap-2 h-9 px-2 text-sm font-normal">
                        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                          <Image className="h-4 w-4" />
                        </div>
                        <span className="truncate">Create image</span>
                      </Button>
                      <Button variant="ghost" className="justify-start gap-2 h-9 px-2 text-sm font-normal">
                        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                          <Brain className="h-4 w-4" />
                        </div>
                        <span className="truncate">Thinking</span>
                      </Button>
                      <Button variant="ghost" className="justify-start gap-2 h-9 px-2 text-sm font-normal">
                         <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <Globe className="h-4 w-4" />
                        </div>
                        <span className="truncate">Deep research</span>
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                {/* Model Selector dropdown */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 pl-3 pr-2 gap-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    >
                      {selectedModel.split('/')[1]?.replace(/-/g, ' ').substring(0, 15) || 'Model'}
                      <ChevronDown className="h-3 w-3 opacity-70" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="end" side="top">
                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Select Model</div>
                      {Object.keys(MODEL_CREDITS).map((modelId) => (
                        <Button
                          key={modelId}
                          variant={selectedModel === modelId ? "secondary" : "ghost"}
                          className="w-full justify-start text-sm h-auto py-2 px-3"
                          onClick={() => onModelChange?.(modelId)}
                        >
                          <div className="flex flex-col items-start gap-0.5">
                            <span>{cleanModelName(modelId)}</span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                              {MODEL_CREDITS[modelId]} local credits
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="h-4 w-[1px] bg-border mx-1" />

                <Button
                  onClick={handleSendStreaming}
                  disabled={isStreaming || !input.trim()}
                  className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all p-0 flex items-center justify-center"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 ml-0.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-2.5">
            <p className="text-[10px] text-muted-foreground/60">
              AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


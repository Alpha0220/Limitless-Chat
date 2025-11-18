import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SearchBarProps {
  onSelectChat?: (chatId: number) => void;
  className?: string;
}

export function SearchBar({ onSelectChat, className = "" }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Use query to search
  const searchQuery = trpc.chat.search.useQuery(
    { query: debouncedQuery, limit: 10 },
    { enabled: debouncedQuery.length > 0 }
  );

  const handleSelectChat = (chatId: number) => {
    setQuery("");
    setOpen(false);
    if (onSelectChat) {
      onSelectChat(chatId);
    } else {
      navigate(`/?chatId=${chatId}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query.trim() && setOpen(true)}
              className="pl-10 pr-10"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </DropdownMenuTrigger>

        {query.trim() && (
          <DropdownMenuContent align="start" className="w-80">
            {searchQuery.isLoading && (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                Searching...
              </div>
            )}

            {!searchQuery.isLoading && (!searchQuery.data || searchQuery.data.length === 0) && (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                No chats found
              </div>
            )}

            {searchQuery.data && searchQuery.data.length > 0 && (
              <>
                {searchQuery.data.map((chat) => (
                  <DropdownMenuItem
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className="flex flex-col items-start gap-1 py-2"
                  >
                    <div className="font-medium truncate max-w-xs">
                      {chat.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {chat.model} • {new Date(chat.updatedAt).toLocaleDateString()}
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  );
}

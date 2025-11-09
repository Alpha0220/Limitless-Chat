import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  credits: number;
  description: string;
}

const models: ModelOption[] = [
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    credits: 10,
    description: "Most capable, best for complex tasks",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    credits: 3,
    description: "Fast and efficient for most tasks",
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    credits: 8,
    description: "Excellent for writing and analysis",
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    credits: 5,
    description: "Balanced performance and cost",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    provider: "Perplexity",
    credits: 3,
    description: "Best for research and fact-checking",
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    credits: 2,
    description: "Fast and cost-effective",
  },
];

interface ModelSwitcherProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ModelSwitcher({
  selectedModel,
  onModelChange,
}: ModelSwitcherProps) {
  const currentModel = models.find((m) => m.id === selectedModel) || models[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-1 md:gap-2 text-foreground hover:bg-accent px-2 md:px-4"
        >
          <div className="flex flex-col items-start">
            <span className="font-medium text-sm md:text-base">{currentModel.name}</span>
            <span className="text-xs text-muted-foreground">
              {currentModel.credits} credits per message
            </span>
          </div>
          <ChevronDown className="h-3 w-3 md:h-4 md:w-4 ml-1 md:ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[90vw] md:w-80 max-w-md bg-popover border-border text-popover-foreground shadow-lg">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelChange(model.id)}
            className={cn(
              "flex items-start gap-3 p-3 cursor-pointer hover:bg-accent focus:bg-accent",
              selectedModel === model.id && "bg-accent"
            )}
          >
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-muted-foreground">
                  {model.credits} credits
                </span>
              </div>
              <div className="text-xs text-muted-foreground mb-1">{model.provider}</div>
              <div className="text-xs text-muted-foreground/80">{model.description}</div>
            </div>
            {selectedModel === model.id && (
              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

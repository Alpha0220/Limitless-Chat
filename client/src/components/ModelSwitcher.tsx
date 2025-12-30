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
    id: "openai/gpt-5",
    name: "GPT-5",
    provider: "OpenAI",
    credits: 15,
    description: "OpenAI's most advanced model with superior reasoning",
  },
  {
    id: "openai/gpt-5-pro",
    name: "GPT-5 Pro",
    provider: "OpenAI",
    credits: 25,
    description: "Premium GPT-5 with enhanced capabilities",
  },
  {
    id: "openai/gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    credits: 10,
    description: "Most capable GPT-4, best for complex tasks",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    credits: 8,
    description: "Optimized GPT-4 with improved performance",
  },
  {
    id: "anthropic/claude-opus-4.1",
    name: "Claude Opus 4.1",
    provider: "Anthropic",
    credits: 20,
    description: "Flagship model with exceptional reasoning",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    credits: 12,
    description: "Advanced Sonnet optimized for coding workflows",
  },
  {
    id: "anthropic/claude-3.5-sonnet-20241022",
    name: "Claude 3.5 Sonnet (Latest)",
    provider: "Anthropic",
    credits: 12,
    description: "Latest Claude 3.5 Sonnet with newest improvements",
  },
  {
    id: "anthropic/claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    credits: 10,
    description: "Enhanced capabilities with improved precision",
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    credits: 6,
    description: "Fastest and most efficient Claude model",
  },
  {
    id: "perplexity/llama-3.1-sonar-small-128k-online",
    name: "Sonar Small",
    provider: "Perplexity",
    credits: 3,
    description: "Lightweight and fast for Q&A with citations",
  },
  {
    id: "perplexity/llama-3.1-sonar-large-128k-online",
    name: "Sonar Large",
    provider: "Perplexity",
    credits: 8,
    description: "Advanced search and research capabilities",
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

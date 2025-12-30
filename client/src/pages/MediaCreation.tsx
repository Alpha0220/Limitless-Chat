import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, Sparkles, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function MediaCreation() {
  const [, setLocation] = useLocation();
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("fal-ai:flux-schnell");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedModel, setGeneratedModel] = useState<string | null>(null);

  // Fetch available models
  const { data: availableModels = [] } = trpc.imageGeneration.getModels.useQuery();

  // Get current model config
  const currentModel = availableModels.find((m) => m.modelId === selectedModel);
  const modelCost = currentModel?.cost ?? 5;

  // Fetch credit balance
  const { data: balance } = trpc.credits.getBalance.useQuery();

  // Image generation mutation
  const generateMutation = trpc.imageGeneration.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedImageUrl(data.imageUrl);
      setGeneratedModel(data.modelName);
      toast.success(`Image generated with ${data.modelName}! ${data.creditsUsed} credits used. ${data.creditsRemaining} credits remaining.`);
      setPrompt("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate image");
    },
  });

  // Fetch image history
  const { data: imageHistory } = trpc.imageGeneration.getHistory.useQuery({
    limit: 12,
    offset: 0,
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (balance && balance.credits < modelCost) {
      toast.error(`Insufficient credits. You need ${modelCost} credits to generate an image with this model. You have ${balance.credits} credits.`);
      return;
    }

    generateMutation.mutate({
      prompt,
      modelId: selectedModel as any,
    });
  };

  const handleDownload = (imageUrl: string, prompt: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${prompt.slice(0, 30).replace(/[^a-z0-9]/gi, "_")}.png`;
    link.target = "_blank";
    link.click();
    toast.success("Image download started!");
  };

  // Group models by provider
  const modelsByProvider: Record<string, typeof availableModels> = {};
  availableModels.forEach((model) => {
    if (!modelsByProvider[model.provider]) {
      modelsByProvider[model.provider] = [];
    }
    modelsByProvider[model.provider].push(model);
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 bg-background">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Media Creation
              </h1>
              <p className="text-sm text-muted-foreground">Generate images with AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{balance?.credits ?? 0}</div>
              <div className="text-xs text-muted-foreground">Credits</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Generation Section */}
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Select Model
                </label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(modelsByProvider).map(([provider, models]) => (
                      <div key={provider}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                          {provider === "fal-ai" ? "FAL AI" : provider === "openai" ? "OpenAI" : "Google"}
                        </div>
                        {models.map((model) => (
                          <SelectItem key={model.modelId} value={model.modelId}>
                            <span className="flex items-center gap-2">
                              {model.displayName}
                              <span className="text-xs text-muted-foreground">({model.cost} credits)</span>
                            </span>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                {currentModel && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {currentModel.description} • {currentModel.cost} credits per image
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Prompt
                </label>
                <Textarea
                  placeholder="Describe the image you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-24 resize-none"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Image ({modelCost} credits)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Image */}
          {generatedImageUrl && (
            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Generated Image</h3>
                    {generatedModel && (
                      <p className="text-sm text-muted-foreground">Model: {generatedModel}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(generatedImageUrl, prompt)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="rounded-lg overflow-hidden bg-muted">
                  <img
                    src={generatedImageUrl}
                    alt="Generated"
                    className="w-full h-auto"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image History */}
          {imageHistory && imageHistory.length > 0 && (
            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground">Recent Generations</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imageHistory.map((image) => (
                    <div
                      key={image.id}
                      className="group relative rounded-lg overflow-hidden bg-muted cursor-pointer"
                      onClick={() => {
                        setGeneratedImageUrl(image.imageUrl);
                        setGeneratedModel(image.model);
                      }}
                    >
                      <img
                        src={image.imageUrl}
                        alt={image.prompt}
                        className="w-full h-32 object-cover group-hover:opacity-75 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <ImageIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

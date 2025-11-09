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
import { Loader2, Download, Sparkles, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const IMAGE_MODELS = [
  { id: "flux-pro", name: "Flux Pro", credits: 8, description: "Highest quality, photorealistic" },
  { id: "flux-dev", name: "Flux Dev", credits: 5, description: "Fast, high quality" },
  { id: "stable-diffusion-xl", name: "Stable Diffusion XL", credits: 3, description: "Versatile, detailed" },
  { id: "dall-e-3", name: "DALL-E 3", credits: 10, description: "Creative, artistic" },
];

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  createdAt: Date;
}

export default function MediaCreation() {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("flux-dev");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const currentModel = IMAGE_MODELS.find((m) => m.id === selectedModel);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    
    try {
      // TODO: Implement actual image generation API call
      // For now, simulate with a delay
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: `https://placehold.co/512x512/f5f5f7/333333?text=${encodeURIComponent(prompt.slice(0, 20))}`,
        prompt,
        model: selectedModel,
        createdAt: new Date(),
      };
      
      setGeneratedImages((prev) => [newImage, ...prev]);
      toast.success(`Image generated! ${currentModel?.credits} credits used.`);
      setPrompt("");
    } catch (error) {
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (imageUrl: string, prompt: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${prompt.slice(0, 30)}.png`;
    link.click();
    toast.success("Image downloaded!");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 bg-background">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Media Creation
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate images using AI models
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Generation Form */}
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              {/* Model Selector */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Select Model
                </label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {IMAGE_MODELS.map((model) => (
                      <SelectItem
                        key={model.id}
                        value={model.id}
                        className="text-popover-foreground hover:bg-accent focus:bg-accent"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{model.name}</span>
                          <span className="text-xs text-muted-foreground ml-4">
                            {model.credits} credits
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentModel && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentModel.description}
                  </p>
                )}
              </div>

              {/* Prompt Input */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Describe your image
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A serene landscape with mountains at sunset, photorealistic, 4k..."
                  className="min-h-[120px] bg-input border-border text-foreground placeholder:text-muted-foreground resize-none"
                  disabled={isGenerating}
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Image ({currentModel?.credits} credits)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Images Gallery */}
          {generatedImages.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Generated Images
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedImages.map((image) => (
                  <Card
                    key={image.id}
                    className="bg-card border-border overflow-hidden group shadow-sm"
                  >
                    <div className="relative aspect-square">
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          onClick={() => handleDownload(image.url, image.prompt)}
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-foreground line-clamp-2 mb-2">
                        {image.prompt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{IMAGE_MODELS.find((m) => m.id === image.model)?.name}</span>
                        <span>{image.createdAt.toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {generatedImages.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No images generated yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Enter a prompt above to generate your first image
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

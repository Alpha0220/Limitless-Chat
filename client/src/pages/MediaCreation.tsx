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

const IMAGE_SIZES = [
  { id: "landscape_16_9", name: "Landscape 16:9", description: "1920×1080" },
  { id: "landscape_4_3", name: "Landscape 4:3", description: "1024×768" },
  { id: "portrait_16_9", name: "Portrait 16:9", description: "1080×1920" },
  { id: "portrait_4_3", name: "Portrait 4:3", description: "768×1024" },
  { id: "square_hd", name: "Square HD", description: "1024×1024" },
  { id: "square", name: "Square", description: "512×512" },
] as const;

const IMAGE_GENERATION_COST = 5; // credits per image

export default function MediaCreation() {
  const [, setLocation] = useLocation();
  const [prompt, setPrompt] = useState("");
  const [selectedSize, setSelectedSize] = useState<typeof IMAGE_SIZES[number]["id"]>("landscape_16_9");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const currentSize = IMAGE_SIZES.find((s) => s.id === selectedSize);

  // Fetch credit balance
  const { data: balance } = trpc.credits.getBalance.useQuery();

  // Image generation mutation
  const generateMutation = trpc.imageGeneration.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedImageUrl(data.imageUrl);
      toast.success(`Image generated! ${data.creditsUsed} credits used. ${data.creditsRemaining} credits remaining.`);
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

    if (balance && balance.credits < IMAGE_GENERATION_COST) {
      toast.error(`Insufficient credits. You need ${IMAGE_GENERATION_COST} credits to generate an image.`);
      return;
    }

    generateMutation.mutate({
      prompt,
      imageSize: selectedSize,
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
              <p className="text-sm text-muted-foreground mt-1">
                Generate images using FAL AI Flux model
              </p>
            </div>
          </div>
          {balance && (
            <div className="text-sm text-muted-foreground">
              Credits: <span className="font-semibold text-foreground">{balance.credits}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Generation Form */}
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              {/* Image Size Selector */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Image Size
                </label>
                <Select value={selectedSize} onValueChange={(value: any) => setSelectedSize(value)}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {IMAGE_SIZES.map((size) => (
                      <SelectItem
                        key={size.id}
                        value={size.id}
                        className="text-popover-foreground hover:bg-accent focus:bg-accent"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{size.name}</span>
                          <span className="text-xs text-muted-foreground ml-4">
                            {size.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  disabled={generateMutation.isPending}
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !prompt.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Image ({IMAGE_GENERATION_COST} credits)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Currently Generated Image */}
          {generatedImageUrl && (
            <Card className="bg-card border-border overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={generatedImageUrl}
                    alt="Generated"
                    className="w-full h-auto"
                  />
                  <div className="absolute top-4 right-4">
                    <Button
                      onClick={() => handleDownload(generatedImageUrl, "generated-image")}
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image History */}
          {imageHistory && imageHistory.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Recent Images
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {imageHistory.map((image) => (
                  <Card
                    key={image.id}
                    className="bg-card border-border overflow-hidden group shadow-sm"
                  >
                    <div className="relative aspect-square">
                      <img
                        src={image.imageUrl}
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          onClick={() => handleDownload(image.imageUrl, image.prompt)}
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
                        <span>{image.imageSize}</span>
                        <span>{new Date(image.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!generatedImageUrl && (!imageHistory || imageHistory.length === 0) && (
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

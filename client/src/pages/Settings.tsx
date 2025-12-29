import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Save, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Validation schema for settings form
 */
const settingsFormSchema = z.object({
  openaiApiKey: z.string().optional().or(z.literal("")),
  anthropicApiKey: z.string().optional().or(z.literal("")),
  limitlessApiKey: z.string().optional().or(z.literal("")),
  selectedModel: z.string().min(1, "Please select a model"),
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

export default function Settings() {
  const { user } = useAuth();
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showLimitlessKey, setShowLimitlessKey] = useState(false);

  // Form setup (must be before useEffect that uses reset)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
    setValue,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      openaiApiKey: "",
      anthropicApiKey: "",
      limitlessApiKey: "",
      selectedModel: "google/gemini-2.0-flash-001",
    },
  });

  // Fetch settings and available models
  const { data: settings, isLoading } = trpc.settings.getSettings.useQuery();

  // Populate form when settings are loaded
  useEffect(() => {
    if (settings) {
      reset({
        openaiApiKey: settings.openaiApiKey || "",
        anthropicApiKey: settings.anthropicApiKey || "",
        limitlessApiKey: settings.limitlessApiKey || "",
        selectedModel: settings.selectedModel || "google/gemini-2.0-flash-001",
      });
    }
  }, [settings, reset]);

  const { data: availableModels = [] } = trpc.settings.getAvailableModels.useQuery(undefined, {
    staleTime: Infinity, // Models list doesn't change
  });

  // Update mutation
  const updateMutation = trpc.settings.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  const selectedModel = watch("selectedModel");

  // Handle form submission
  const onSubmit = async (data: SettingsFormData) => {
    await updateMutation.mutateAsync({
      openaiApiKey: data.openaiApiKey || undefined,
      anthropicApiKey: data.anthropicApiKey || undefined,
      limitlessApiKey: data.limitlessApiKey || undefined,
      selectedModel: data.selectedModel,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-gray-600">Manage your API keys and preferences</p>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* AI Configuration Section */}
          <section className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded"></span>
              AI Configuration
            </h2>

            <div className="space-y-4">
              {/* OpenAI API Key */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    {...register("openaiApiKey")}
                    type={showOpenAIKey ? "text" : "password"}
                    placeholder="sk-..."
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showOpenAIKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.openaiApiKey && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.openaiApiKey.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    OpenAI Platform
                  </a>
                </p>
              </div>

              {/* Anthropic API Key */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Anthropic API Key
                </label>
                <div className="relative">
                  <input
                    {...register("anthropicApiKey")}
                    type={showAnthropicKey ? "text" : "password"}
                    placeholder="sk-ant-..."
                    className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showAnthropicKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.anthropicApiKey && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.anthropicApiKey.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from{" "}
                  <a
                    href="https://console.anthropic.com/account/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Anthropic Console
                  </a>
                </p>
              </div>

              {/* Default Model Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Default AI Model
                </label>
                <Select
                  value={selectedModel}
                  onValueChange={(value) => setValue("selectedModel", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.selectedModel && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.selectedModel.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Limitless Integration Section */}
          <section className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded"></span>
              Limitless Integration
            </h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Limitless API Key
              </label>
              <div className="relative">
                <input
                  {...register("limitlessApiKey")}
                  type={showLimitlessKey ? "text" : "password"}
                  placeholder="limitless_..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowLimitlessKey(!showLimitlessKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showLimitlessKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.limitlessApiKey && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.limitlessApiKey.message}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Connect your Limitless pendant to access your personal data in conversations
              </p>
            </div>
          </section>

          {/* Account Section */}
          <section className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-green-500 rounded"></span>
              Account
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="text-foreground font-medium">{user?.email || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                <p className="text-foreground font-medium">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={!isDirty || updateMutation.isPending}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || updateMutation.isPending}
              className="gap-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

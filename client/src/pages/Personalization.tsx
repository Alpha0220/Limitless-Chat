import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, RotateCcw, Save } from "lucide-react";

export default function Personalization() {
  const { user, loading: authLoading } = useAuth();
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    styleTone_baseTone: "friendly" as "formal" | "friendly" | "concise" | "detailed",
    styleTone_additionalPreferences: "",
    nickname: "",
    occupation: "",
    aboutUser_interests: "",
    aboutUser_values: "",
    aboutUser_communicationPreferences: "",
    memorySettings_allowSavedMemory: true,
    chatHistorySettings_allowReferenceHistory: true,
  });

  // Fetch personalization settings
  const { data: settingsData, isLoading: isLoadingSettings } =
    trpc.personalization.getSettings.useQuery(undefined, {
      enabled: !!user,
    });

  // Get search personalization status
  const { data: searchStatusData } = trpc.personalization.getSearchPersonalizationStatus.useQuery(
    undefined,
    {
      enabled: !!user,
    }
  );

  // Update settings mutation
  const updateSettingsMutation = trpc.personalization.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Personalization settings updated successfully");
      setIsDirty(false);
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error("Failed to update settings: " + error.message);
      setIsSaving(false);
    },
  });

  // Reset to defaults mutation
  const resetMutation = trpc.personalization.resetToDefaults.useMutation({
    onSuccess: () => {
      toast.success("Settings reset to defaults");
      setIsDirty(false);
      // Reload settings
      window.location.reload();
    },
    onError: (error) => {
      toast.error("Failed to reset settings: " + error.message);
    },
  });

  // Load settings into form
  useEffect(() => {
    console.log("[Personalization] settingsData:", settingsData);
    if (settingsData?.data) {
      const settings = settingsData.data;
      console.log("[Personalization] Loaded settings:", settings);
      setFormData({
        styleTone_baseTone: (settings.styleTone_baseTone as any) || "friendly",
        styleTone_additionalPreferences: settings.styleTone_additionalPreferences || "",
        nickname: settings.nickname || "",
        occupation: settings.occupation || "",
        aboutUser_interests: settings.aboutUser_interests || "",
        aboutUser_values: settings.aboutUser_values || "",
        aboutUser_communicationPreferences: settings.aboutUser_communicationPreferences || "",
        memorySettings_allowSavedMemory: settings.memorySettings_allowSavedMemory ?? true,
        chatHistorySettings_allowReferenceHistory:
          settings.chatHistorySettings_allowReferenceHistory ?? true,
      });
    }
  }, [settingsData]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    updateSettingsMutation.mutate(formData);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      resetMutation.mutate();
    }
  };

  if (authLoading || isLoadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please log in to access personalization settings</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Personalization Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize how the AI responds to you by configuring your preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Section 1: Style & Tone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎨</span> Style & Tone
              </CardTitle>
              <CardDescription>
                Choose how you want the AI to communicate with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseTone">Base Tone</Label>
                <Select
                  value={formData.styleTone_baseTone}
                  onValueChange={(value) =>
                    handleInputChange("styleTone_baseTone", value)
                  }
                >
                  <SelectTrigger id="baseTone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">
                      Formal - Professional and precise
                    </SelectItem>
                    <SelectItem value="friendly">
                      Friendly - Warm and conversational
                    </SelectItem>
                    <SelectItem value="concise">
                      Concise - Brief and direct
                    </SelectItem>
                    <SelectItem value="detailed">
                      Detailed - Comprehensive and thorough
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalPreferences">
                  Additional Preferences (comma-separated)
                </Label>
                <Input
                  id="additionalPreferences"
                  placeholder="e.g., use examples, include code snippets, explain like I'm 5"
                  value={formData.styleTone_additionalPreferences}
                  onChange={(e) =>
                    handleInputChange("styleTone_additionalPreferences", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: User Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👤</span> User Identity
              </CardTitle>
              <CardDescription>
                Tell the AI about yourself so it can tailor responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input
                    id="nickname"
                    placeholder="How should the AI address you?"
                    value={formData.nickname}
                    onChange={(e) => handleInputChange("nickname", e.target.value)}
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    placeholder="e.g., Software Engineer, Designer"
                    value={formData.occupation}
                    onChange={(e) => handleInputChange("occupation", e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests">Interests</Label>
                <Textarea
                  id="interests"
                  placeholder="What are you interested in? (e.g., AI, music, sports)"
                  value={formData.aboutUser_interests}
                  onChange={(e) => handleInputChange("aboutUser_interests", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="values">Values</Label>
                <Textarea
                  id="values"
                  placeholder="What do you value? (e.g., sustainability, innovation, family)"
                  value={formData.aboutUser_values}
                  onChange={(e) => handleInputChange("aboutUser_values", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="communicationPreferences">Communication Preferences</Label>
                <Textarea
                  id="communicationPreferences"
                  placeholder="How do you prefer to communicate? (e.g., direct and concise, detailed with examples)"
                  value={formData.aboutUser_communicationPreferences}
                  onChange={(e) =>
                    handleInputChange("aboutUser_communicationPreferences", e.target.value)
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Memory & History Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💾</span> Memory & History
              </CardTitle>
              <CardDescription>
                Control how the AI remembers and references your conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base">Allow Saved Memory</Label>
                  <p className="text-sm text-muted-foreground">
                    Let the AI store and learn from your preferences over time
                  </p>
                </div>
                <Switch
                  checked={formData.memorySettings_allowSavedMemory}
                  onCheckedChange={(checked) =>
                    handleInputChange("memorySettings_allowSavedMemory", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base">Allow Reference History</Label>
                  <p className="text-sm text-muted-foreground">
                    Let the AI reference previous messages in this conversation
                  </p>
                </div>
                <Switch
                  checked={formData.chatHistorySettings_allowReferenceHistory}
                  onCheckedChange={(checked) =>
                    handleInputChange("chatHistorySettings_allowReferenceHistory", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Search Personalization Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔍</span> Search Personalization Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold">
                  {searchStatusData?.data?.enabled ? "✅ Enabled" : "❌ Disabled"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchStatusData?.data?.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={!isDirty || isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>

                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

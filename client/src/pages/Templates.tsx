import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2, Copy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Templates() {
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    content: "",
    category: "",
    isPublic: false,
  });

  const { data: templates, refetch } = trpc.templates.list.useQuery();
  const createTemplateMutation = trpc.templates.create.useMutation();
  const deleteTemplateMutation = trpc.templates.delete.useMutation();

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast.error("Name and content are required");
      return;
    }

    try {
      await createTemplateMutation.mutateAsync(newTemplate);
      toast.success("Template created successfully");
      setNewTemplate({
        name: "",
        description: "",
        content: "",
        category: "",
        isPublic: false,
      });
      setIsCreateDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to create template");
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await deleteTemplateMutation.mutateAsync({ id: templateId });
      toast.success("Template deleted");
      refetch();
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  const handleCopyTemplate = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Template copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Prompt Templates</h1>
              <p className="text-gray-400 mt-1">
                Create and manage reusable prompts for your chats
              </p>
            </div>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Create a reusable prompt template with variables like {"{{topic}}"} or {"{{style}}"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Template Name *
                  </label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, name: e.target.value })
                    }
                    placeholder="e.g., Blog Post Outline"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description
                  </label>
                  <Input
                    value={newTemplate.description}
                    onChange={(e) =>
                      setNewTemplate({
                        ...newTemplate,
                        description: e.target.value,
                      })
                    }
                    placeholder="Brief description of this template"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Template Content *
                  </label>
                  <Textarea
                    value={newTemplate.content}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, content: e.target.value })
                    }
                    placeholder="Write a blog post about {{topic}} in a {{style}} tone..."
                    className="bg-gray-800 border-gray-700 text-white min-h-[150px]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {"{{variable}}"} for dynamic placeholders
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Category
                  </label>
                  <Input
                    value={newTemplate.category}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, category: e.target.value })
                    }
                    placeholder="e.g., Writing, Coding, Research"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newTemplate.isPublic}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, isPublic: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="isPublic" className="text-sm">
                    Make this template public (visible to all users)
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={createTemplateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((template) => (
            <Card
              key={template.id}
              className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">
                      {template.name}
                    </CardTitle>
                    {template.category && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded">
                        {template.category}
                      </span>
                    )}
                  </div>
                </div>
                {template.description && (
                  <CardDescription className="text-gray-400 mt-2">
                    {template.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="bg-gray-800 rounded p-3 text-sm text-gray-300 font-mono max-h-32 overflow-y-auto">
                  {template.content}
                </div>
                {template.usageCount > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Used {template.usageCount} times
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyTemplate(template.content)}
                  className="flex-1 bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="bg-transparent border-gray-700 text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}

          {templates?.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 text-lg">
                No templates yet. Create your first template to get started!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

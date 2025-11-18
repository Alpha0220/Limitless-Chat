import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FolderOpen, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProjectsSectionProps {
  selectedProjectId: number | null;
  onSelectProject: (projectId: number | null) => void;
}

export function ProjectsSection({
  selectedProjectId,
  onSelectProject,
}: ProjectsSectionProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");

  const { data: projects, refetch } = trpc.projects.list.useQuery();
  const createProjectMutation = trpc.projects.create.useMutation();
  const deleteProjectMutation = trpc.projects.delete.useMutation();

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      await createProjectMutation.mutateAsync({
        name: newProjectName,
        description: newProjectDescription,
      });

      toast.success("Project created successfully");
      setNewProjectName("");
      setNewProjectDescription("");
      setIsCreateDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      await deleteProjectMutation.mutateAsync({ id: projectId });
      toast.success("Project deleted");
      if (selectedProjectId === projectId) {
        onSelectProject(null);
      }
      refetch();
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  return (
    <div className="overflow-hidden w-full space-y-1">
      <div className="flex justify-end mb-2">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
              title="Create project"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-popover border-border text-popover-foreground">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Organize your chats into projects for better management.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Project Name
                </label>
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., Work, Personal, Research"
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description (Optional)
                </label>
                <Input
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Brief description of this project"
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="bg-transparent border-border text-foreground hover:bg-accent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={createProjectMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* All Chats option */}
      <button
        onClick={() => onSelectProject(null)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
          selectedProjectId === null
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
      >
        <FolderOpen className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">All Chats</span>
      </button>

      {/* Projects list */}
      {projects && projects.length > 0 ? (
        projects.map((project) => (
          <div
            key={project.id}
            className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors"
          >
            <button
              onClick={() => onSelectProject(project.id)}
              className={cn(
                "flex-1 flex items-center gap-2 text-left text-sm truncate",
                selectedProjectId === project.id
                  ? "text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FolderOpen className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{project.name}</span>
            </button>
            <button
              onClick={() => handleDeleteProject(project.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded text-muted-foreground hover:text-destructive"
              title="Delete project"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))
      ) : (
        <p className="text-xs text-muted-foreground px-3 py-2">No projects yet</p>
      )}
    </div>
  );
}

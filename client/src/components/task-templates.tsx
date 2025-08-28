import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Repeat, Trash2, Users } from "lucide-react";
import { TaskTemplateModal } from "./task-template-modal";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { TaskTemplate, User } from "@shared/schema";

export function TaskTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/task-templates"],
    enabled: !!(user as any)?.householdId,
  });

  const { data: householdMembers = [] } = useQuery<User[]>({
    queryKey: ["/api/households", (user as any)?.householdId, "members"],
    enabled: !!(user as any)?.householdId,
  });

  const createTaskMutation = useMutation({
    mutationFn: async ({ templateId, assignedTo }: { templateId: string; assignedTo?: string }) => {
      const response = await apiRequest("POST", `/api/task-templates/${templateId}/create-task`, { assignedTo });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Aufgabe erstellt",
        description: "Neue Aufgabe wurde aus der Vorlage erstellt",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Nicht autorisiert",
          description: "Sie sind abgemeldet. Werden neu angemeldet...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await apiRequest("DELETE", `/api/task-templates/${templateId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vorlage gelöscht",
        description: "Aufgabenvorlage wurde deaktiviert",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/task-templates"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Nicht autorisiert",
          description: "Sie sind abgemeldet. Werden neu angemeldet...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Fehler",
        description: "Vorlage konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });

  const getRecurrenceLabel = (recurrence: string) => {
    switch (recurrence) {
      case "daily": return "Täglich";
      case "weekly": return "Wöchentlich";
      case "monthly": return "Monatlich";
      default: return recurrence;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Aufgaben-Vorlagen</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Aufgaben-Vorlagen</h2>
        {user?.role === "admin" && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Neue Vorlage
          </Button>
        )}
      </div>

      {templates.length === 0 ? (
        <Card className="p-8 text-center">
          <Repeat className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Keine Vorlagen vorhanden</h3>
          <p className="text-gray-600 mb-4">
            Erstellen Sie wiederkehrende Aufgaben-Vorlagen für häufige Tätigkeiten
          </p>
          {user?.role === "admin" && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Erste Vorlage erstellen
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template: TaskTemplate) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  <div className="flex space-x-1">
                    <Badge variant={getPriorityColor(template.priority)}>
                      {template.priority}
                    </Badge>
                    <Badge variant="outline">
                      {getRecurrenceLabel(template.recurrence)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.description && (
                  <p className="text-sm text-gray-600">{template.description}</p>
                )}
                
                <div className="flex items-center text-sm text-gray-500">
                  <span>⏱️ {template.estimatedMinutes} Min.</span>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => createTaskMutation.mutate({ templateId: template.id })}
                    disabled={createTaskMutation.isPending}
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Aufgabe erstellen
                  </Button>
                  
                  {user?.role === "admin" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTemplateMutation.mutate(template.id)}
                      disabled={deleteTemplateMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <details className="group">
                    <summary className="flex items-center cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                      <Users className="w-4 h-4 mr-1" />
                      Für Mitglied zuweisen
                    </summary>
                    <div className="mt-2 space-y-1">
                      {householdMembers.map((member) => (
                        <Button
                          key={member.id}
                          size="sm"
                          variant="ghost"
                          onClick={() => createTaskMutation.mutate({ 
                            templateId: template.id, 
                            assignedTo: member.id 
                          })}
                          disabled={createTaskMutation.isPending}
                          className="w-full justify-start text-xs"
                        >
                          {member.displayName || member.firstName || member.email}
                        </Button>
                      ))}
                    </div>
                  </details>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TaskTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["/api/task-templates"] });
        }}
      />
    </div>
  );
}
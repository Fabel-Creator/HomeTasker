import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Check, 
  Clock,
  Calendar,
  User,
  CheckSquare
} from "lucide-react";
import type { Task } from "@shared/schema";

export function MyTasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: assignedTasks = [], isLoading } = useQuery({
    queryKey: ["/api/tasks/assigned"],
    enabled: !!user,
  });

  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, actualMinutes }: { taskId: string; actualMinutes: number }) => {
      const response = await apiRequest("PUT", `/api/tasks/${taskId}/complete`, { actualMinutes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/daily"] });
      toast({
        title: "Erfolg",
        description: "Aufgabe wurde als erledigt markiert.",
      });
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
        description: "Aufgabe konnte nicht abgeschlossen werden.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Badge variant="secondary">Zugewiesen</Badge>;
      case 'completed':
        return <Badge variant="outline">Abgeschlossen</Badge>;
      case 'pending_approval':
        return <Badge className="bg-amber-100 text-amber-800">Warten auf Freigabe</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Genehmigt</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Abgelehnt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const handleCompleteTask = (task: Task) => {
    completeTaskMutation.mutate({ 
      taskId: task.id, 
      actualMinutes: task.estimatedMinutes || 30 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Meine Aufgaben</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <h2 className="text-2xl font-bold">Meine Aufgaben</h2>
        <Badge variant="outline" className="text-sm">
          {assignedTasks.length} Aufgaben
        </Badge>
      </div>

      {assignedTasks.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Keine Aufgaben zugewiesen</h3>
          <p className="text-gray-600">
            Sie haben aktuell keine zugewiesenen Aufgaben. Genießen Sie die freie Zeit!
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedTasks.map((task: Task) => (
            <Card 
              key={task.id} 
              className={`hover:shadow-md transition-shadow border-l-4 ${getPriorityColor(task.priority)}`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  {getStatusBadge(task.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <p className="text-sm text-gray-600">{task.description}</p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{task.estimatedMinutes} Min.</span>
                  </div>
                  {task.deadline && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{new Date(task.deadline).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                </div>

                {task.status === 'assigned' && (
                  <Button
                    onClick={() => handleCompleteTask(task)}
                    disabled={completeTaskMutation.isPending}
                    className="w-full"
                    size="sm"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Als erledigt markieren
                  </Button>
                )}

                {task.status === 'completed' && (
                  <div className="text-center text-sm text-gray-500">
                    ✓ Abgeschlossen - Warten auf Admin-Bestätigung
                  </div>
                )}

                {task.status === 'approved' && (
                  <div className="text-center text-sm text-green-600">
                    ✓ Genehmigt - Gut gemacht!
                  </div>
                )}

                {task.status === 'rejected' && (
                  <div className="text-center text-sm text-red-600">
                    ✗ Abgelehnt - Bitte nochmal versuchen
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
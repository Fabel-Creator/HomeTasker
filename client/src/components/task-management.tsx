import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Filter, 
  Check, 
  X, 
  MoreVertical,
  Clock,
  Calendar,
  User
} from "lucide-react";

interface TaskManagementProps {
  onAddTask: () => void;
}

export default function TaskManagement({ onAddTask }: TaskManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  const { data: householdMembers = [] } = useQuery({
    queryKey: ["/api/households", user?.householdId, "members"],
    enabled: !!user?.householdId,
  });

  const reviewTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/tasks/${taskId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Erfolg",
        description: "Aufgabe wurde aktualisiert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht aktualisiert werden.",
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

  const getMemberName = (userId: string) => {
    const member = householdMembers.find((m: any) => m.id === userId);
    return member ? `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email : 'Unbekannt';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const taskStatusOptions = [
    { value: 'all', label: 'Alle', count: tasks.length },
    { value: 'assigned', label: 'Zugewiesen', count: tasks.filter((t: any) => t.status === 'assigned').length },
    { value: 'completed', label: 'Abgeschlossen', count: tasks.filter((t: any) => t.status === 'completed').length },
    { value: 'pending_approval', label: 'Warten auf Freigabe', count: tasks.filter((t: any) => t.status === 'pending_approval').length },
    { value: 'approved', label: 'Genehmigt', count: tasks.filter((t: any) => t.status === 'approved').length },
  ];

  return (
    <div className="space-y-6">
      {/* Task Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Aufgabenverwaltung</h2>
              <p className="text-gray-600 mt-1">Verwalten Sie Ihre Haushaltsaufgaben</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button onClick={onAddTask} className="flex items-center">
                <Plus className="mr-2" size={16} />
                Neue Aufgabe
              </Button>
              <Button variant="outline" className="flex items-center">
                <Filter className="mr-2" size={16} />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            {taskStatusOptions.map((option) => (
              <Button
                key={option.value}
                variant={option.value === 'all' ? 'default' : 'outline'}
                size="sm"
                className="text-sm"
              >
                {option.label} ({option.count})
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">Keine Aufgaben vorhanden</p>
              <p className="text-gray-400 text-sm mt-2">
                Erstellen Sie Ihre erste Aufgabe, um zu beginnen.
              </p>
              <Button onClick={onAddTask} className="mt-4">
                <Plus className="mr-2" size={16} />
                Erste Aufgabe erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task: any) => (
            <Card key={task.id} className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                      {getStatusBadge(task.status)}
                    </div>
                    {task.description && (
                      <p className="text-gray-600 mb-3">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {task.assignedTo && (
                        <span className="flex items-center">
                          <User className="mr-1" size={14} />
                          Zugewiesen an: <span className="font-medium ml-1">{getMemberName(task.assignedTo)}</span>
                        </span>
                      )}
                      {task.actualMinutes ? (
                        <span className="flex items-center">
                          <Clock className="mr-1" size={14} />
                          Erfasste Zeit: <span className="font-medium ml-1">{task.actualMinutes} Min</span>
                        </span>
                      ) : task.estimatedMinutes && (
                        <span className="flex items-center">
                          <Clock className="mr-1" size={14} />
                          Geschätzte Zeit: <span className="font-medium ml-1">{task.estimatedMinutes} Min</span>
                        </span>
                      )}
                      {task.deadline && (
                        <span className="flex items-center">
                          <Calendar className="mr-1" size={14} />
                          Fällig: <span className="font-medium ml-1">{formatDate(task.deadline)}</span>
                        </span>
                      )}
                      {task.completedAt && (
                        <span className="flex items-center">
                          <Calendar className="mr-1" size={14} />
                          Abgeschlossen: <span className="font-medium ml-1">{formatDate(task.completedAt)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {user?.role === 'admin' && task.status === 'pending_approval' && (
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => reviewTaskMutation.mutate({ taskId: task.id, status: 'approved' })}
                        disabled={reviewTaskMutation.isPending}
                      >
                        <Check size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => reviewTaskMutation.mutate({ taskId: task.id, status: 'rejected' })}
                        disabled={reviewTaskMutation.isPending}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  )}
                  
                  <Button variant="ghost" size="sm" className="ml-2">
                    <MoreVertical size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

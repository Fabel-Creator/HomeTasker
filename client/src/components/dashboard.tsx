import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Target, 
  Clock, 
  Plus,
  Timer,
  Users,
  BarChart3,
  Copy,
  QrCode
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  onAddTask: () => void;
  onLogTime: () => void;
  onManageTargets?: () => void;
}

export default function Dashboard({ onAddTask, onLogTime, onManageTargets }: DashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: progress } = useQuery({
    queryKey: ["/api/progress/daily"],
    enabled: !!user,
    staleTime: 0, // Always refetch to ensure fresh data
    gcTime: 0, // Don't cache to prevent stale data (v5 syntax)
  });

  const { data: assignedTasks = [] } = useQuery({
    queryKey: ["/api/tasks/assigned"],
    enabled: !!user,
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  const { data: recentTimeLogs = [] } = useQuery({
    queryKey: ["/api/time-logs/my"],
    enabled: !!user,
  });

  const { data: household } = useQuery({
    queryKey: ["/api/households", (user as any)?.householdId],
    enabled: !!(user as any)?.householdId,
  });

  const copyInviteCode = async () => {
    if (household?.inviteCode) {
      try {
        await navigator.clipboard.writeText(household.inviteCode);
        toast({
          title: "Code kopiert!",
          description: "Der Einladungscode wurde in die Zwischenablage kopiert.",
        });
      } catch (err) {
        toast({
          title: "Fehler",
          description: "Code konnte nicht kopiert werden.",
          variant: "destructive",
        });
      }
    }
  };

  const progressPercentage = progress 
    ? Math.min((progress.completedMinutes / progress.targetMinutes) * 100, 100)
    : 0;

  const currentDay = new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const openTasks = assignedTasks.filter((task: any) => 
    task.status === 'assigned' || task.status === 'pending_approval'
  );

  const recentTasks = allTasks.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Willkommen zurück, {user?.firstName || user?.displayName || 'User'}!
              </h2>
              <p className="text-gray-600 mt-1">
                Ihre Haushaltsübersicht für heute
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Heute</div>
              <div className="text-lg font-semibold text-gray-900">
                {currentDay}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Code for Admins */}
      {user?.role === 'admin' && household && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Users className="mr-2" size={20} />
              Haushalt: {household.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-blue-700 mb-3">
                Teilen Sie diesen Code mit Mitgliedern, damit sie dem Haushalt beitreten können:
              </p>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Einladungscode</div>
                  <div className="text-2xl font-mono font-bold text-blue-900 tracking-wider">
                    {household.inviteCode}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyInviteCode}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Copy size={16} className="mr-2" />
                  Kopieren
                </Button>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Mitglieder können unter <strong>/guest</strong> beitreten oder den Button "Als Mitglied beitreten" auf der Startseite verwenden.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Erledigte Zeit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progress?.completedMinutes || 0} Min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Target className="text-primary" size={20} />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tagesziel</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progress?.targetMinutes || 60} Min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-amber-600" size={20} />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Verbleibend</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.max((progress?.targetMinutes || 60) - (progress?.completedMinutes || 0), 0)} Min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tagesfortschritt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {progress?.completedMinutes || 0} von {progress?.targetMinutes || 60} Minuten
            </span>
            <span className="font-medium text-primary">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
          <p className="text-sm text-gray-600 flex items-center">
            <CheckCircle className="mr-1" size={16} />
            {progressPercentage >= 100 
              ? "Tagesziel erreicht! 🎉" 
              : `Noch ${Math.max((progress?.targetMinutes || 60) - (progress?.completedMinutes || 0), 0)} Minuten bis zum Tagesziel!`
            }
          </p>
        </CardContent>
      </Card>

      {/* Recent Activities & Assigned Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Letzte Aktivitäten</CardTitle>
            <Button variant="ghost" size="sm">
              Alle anzeigen
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTimeLogs.slice(0, 3).map((log: any) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    log.status === 'approved' ? 'bg-green-500' : 
                    log.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{log.title}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(log.logDate)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {log.minutes} Min
                </span>
              </div>
            ))}
            {recentTimeLogs.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                Noch keine Aktivitäten erfasst
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Aktuelle Aufgaben</CardTitle>
            <Badge className="bg-blue-100 text-blue-800">
              {allTasks.length} gesamt
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.map((task: any) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{task.title}</h4>
                  {getStatusBadge(task.status)}
                </div>
                {task.description && (
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  {task.estimatedMinutes && (
                    <span>
                      <Clock className="inline mr-1" size={12} />
                      Geschätzt: {task.estimatedMinutes} Min
                    </span>
                  )}
                  {task.deadline && (
                    <span>
                      <Target className="inline mr-1" size={12} />
                      Bis: {formatDate(task.deadline)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {allTasks.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                Noch keine Aufgaben erstellt
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Schnellaktionen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(user as any)?.role === 'admin' && (
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center p-6 h-auto border-dashed hover:border-primary hover:bg-primary/5"
                onClick={onAddTask}
              >
                <Plus className="text-2xl mb-2 text-gray-400 group-hover:text-primary" size={32} />
                <span className="text-sm font-medium">Aufgabe hinzufügen</span>
              </Button>
            )}
            
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center p-6 h-auto border-dashed hover:border-green-500 hover:bg-green-50"
              onClick={onLogTime}
            >
              <Timer className="text-2xl mb-2 text-gray-400 group-hover:text-green-500" size={32} />
              <span className="text-sm font-medium">Zeit erfassen</span>
            </Button>

            {(user as any)?.role === 'admin' && onManageTargets && (
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center p-6 h-auto border-dashed hover:border-amber-500 hover:bg-amber-50"
                onClick={onManageTargets}
              >
                <Users className="text-2xl mb-2 text-gray-400 group-hover:text-amber-500" size={32} />
                <span className="text-sm font-medium">Tagesziele verwalten</span>
              </Button>
            )}

            <Button
              variant="outline"
              className="flex flex-col items-center justify-center p-6 h-auto border-dashed hover:border-purple-500 hover:bg-purple-50"
              disabled
            >
              <BarChart3 className="text-2xl mb-2 text-gray-400" size={32} />
              <span className="text-sm font-medium">Berichte anzeigen</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get week number
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function() {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

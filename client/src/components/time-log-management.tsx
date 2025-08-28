import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Clock, Check, X, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface TimeLogWithUser {
  id: string;
  title: string;
  description: string;
  minutes: number;
  status: "pending_approval" | "approved" | "rejected";
  logDate: string;
  createdAt: string;
  userId: string;
  user?: {
    id: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    isGuest: boolean;
  };
}

export default function TimeLogManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only show for admins
  if ((user as any)?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nur Admins können Zeitlogs verwalten.</p>
      </div>
    );
  }

  const { data: timeLogs = [], isLoading } = useQuery({
    queryKey: ["/api/time-logs"],
    enabled: !!user,
  });

  const reviewTimeLogMutation = useMutation({
    mutationFn: async ({ timeLogId, status }: { timeLogId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/time-logs/${timeLogId}/review`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      toast({
        title: "Erfolg",
        description: "Zeitlog wurde aktualisiert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Zeitlog konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const getUserDisplayName = (timeLog: TimeLogWithUser) => {
    if (timeLog.user?.isGuest) {
      return timeLog.user.displayName || "Gast";
    }
    if (timeLog.user?.firstName && timeLog.user?.lastName) {
      return `${timeLog.user.firstName} ${timeLog.user.lastName}`;
    }
    return timeLog.user?.displayName || "Unbekannt";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Akzeptiert</Badge>;
      case "rejected":
        return <Badge variant="destructive">Abgelehnt</Badge>;
      case "pending_approval":
        return <Badge variant="secondary">Wartet auf Freigabe</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingLogs = (timeLogs as TimeLogWithUser[]).filter((log: TimeLogWithUser) => log.status === "pending_approval");
  const recentLogs = (timeLogs as TimeLogWithUser[]).filter((log: TimeLogWithUser) => log.status !== "pending_approval").slice(0, 10);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Zeitlog-Verwaltung</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock size={16} />
          <span>{pendingLogs.length} warten auf Freigabe</span>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <Clock className="mr-2" size={20} />
              Wartende Freigaben ({pendingLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingLogs.map((log: TimeLogWithUser) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <User size={16} className="text-gray-500" />
                    <span className="font-medium text-gray-900">
                      {getUserDisplayName(log)}
                    </span>
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {format(new Date(log.logDate), "dd.MM.yyyy", { locale: de })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{log.title}</h3>
                  {log.description && (
                    <p className="text-sm text-gray-600 mb-2">{log.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="font-medium">{log.minutes} Minuten</span>
                    <span>
                      Eingereicht: {format(new Date(log.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() =>
                      reviewTimeLogMutation.mutate({ timeLogId: log.id, status: "approved" })
                    }
                    disabled={reviewTimeLogMutation.isPending}
                  >
                    <Check size={16} className="mr-1" />
                    Akzeptieren
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() =>
                      reviewTimeLogMutation.mutate({ timeLogId: log.id, status: "rejected" })
                    }
                    disabled={reviewTimeLogMutation.isPending}
                  >
                    <X size={16} className="mr-1" />
                    Ablehnen
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Time Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Zeitlogs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 && pendingLogs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Noch keine Zeitlogs vorhanden.
            </p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log: TimeLogWithUser) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <User size={14} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {getUserDisplayName(log)}
                      </span>
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {format(new Date(log.logDate), "dd.MM.yyyy", { locale: de })}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{log.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{log.minutes} Min</span>
                      {getStatusBadge(log.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
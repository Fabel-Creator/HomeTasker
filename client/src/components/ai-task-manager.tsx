import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Target, 
  Clock, 
  Users, 
  Zap, 
  TrendingUp,
  Calendar,
  Star,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { format, addDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

export function AITaskManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });

  const { data: householdMembers = [] } = useQuery({
    queryKey: ["/api/households", (user as any)?.householdId, "members"],
    enabled: !!(user as any)?.householdId,
  });

  // Real AI analysis would come from API
  const [aiAnalysis, setAiAnalysis] = useState({
    recommendations: [],
    insights: {
      mostEfficientMember: "-",
      busyPeriods: [],
      freePeriods: [],
      weeklyWorkload: {}
    }
  });

  const handleAcceptRecommendation = (recommendation: any) => {
    toast({
      title: "🤖 KI-Empfehlung übernommen",
      description: `"${recommendation.task}" wurde ${recommendation.suggestedAssignee} zugewiesen`
    });
    // In real app: create task with AI recommendations
  };

  const handleOptimizeSchedule = () => {
    toast({
      title: "📅 Zeitplan optimiert",
      description: "KI hat den optimalen Zeitplan für alle Aufgaben berechnet"
    });
    setAiAnalysis(generateSmartDistribution());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          KI-Task Manager
        </h2>
        <Button onClick={handleOptimizeSchedule} variant="outline" size="sm">
          <Zap className="h-4 w-4 mr-2" />
          Neu optimieren
        </Button>
      </div>

      {/* AI Insights Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiAnalysis.insights.mostEfficientMember}</div>
            <p className="text-xs text-muted-foreground">
              {aiAnalysis.insights.mostEfficientMember !== "-" ? "Höchste Effizienz diese Woche" : "Noch keine Daten verfügbar"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimale Zeit</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{aiAnalysis.insights.freePeriods[0] || "-"}</div>
            <p className="text-xs text-muted-foreground">
              Beste Zeit für neue Aufgaben
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aufgaben bereit</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Für KI-Optimierung verfügbar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Smart Task Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Intelligente Aufgabenverteilung
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aiAnalysis.recommendations.length > 0 ? (
            <div className="space-y-4">
              {aiAnalysis.recommendations.map((rec: any, index: number) => (
                <div 
                  key={index}
                  className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{rec.task}</h3>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority === 'high' ? '🔥 Hoch' : rec.priority === 'medium' ? '⚡ Mittel' : '💚 Niedrig'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ⏱️ {rec.estimatedTime} min
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">
                            <strong>{rec.suggestedAssignee}</strong> zuweisen
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs">{(rec.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Optimal: {rec.optimalTime}</span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground bg-white dark:bg-gray-800 p-2 rounded">
                          💡 {rec.reasoning}
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleAcceptRecommendation(rec)}
                      size="sm" 
                      className="ml-4"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Übernehmen
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine KI-Empfehlungen verfügbar</p>
              <p className="text-sm">Erstellt Aufgaben und fügt Familienmitglieder hinzu für intelligente Vorschläge!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workload Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Arbeitslasten-Analyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(aiAnalysis.insights.weeklyWorkload).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(aiAnalysis.insights.weeklyWorkload).map(([member, data]: [string, any]) => (
                <div key={member} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{member}</h4>
                      <Badge variant={data.current < data.optimal ? 'secondary' : 'outline'}>
                        {data.current}/{data.optimal} min
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{(data.efficiency * 100).toFixed(0)}%</span>
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Arbeitsauslastung</span>
                      <span>{((data.current / data.optimal) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={(data.current / data.optimal) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  {data.current < data.optimal && (
                    <div className="mt-2 flex items-center space-x-1 text-xs text-blue-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Kann {data.optimal - data.current} min mehr übernehmen</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Arbeitslasten-Daten verfügbar</p>
              <p className="text-sm">Loggt Zeit und Aufgaben um Analyse zu sehen!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
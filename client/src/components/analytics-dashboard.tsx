import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Award,
  Users,
  Calendar,
  Zap
} from "lucide-react";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export function AnalyticsDashboard() {
  const { user } = useAuth();

  // Use real API data
  const { data: weeklyStats } = useQuery({
    queryKey: ["/api/analytics/weekly"],
    enabled: !!user,
  });

  const { data: memberStats } = useQuery({
    queryKey: ["/api/analytics/members"], 
    enabled: !!user,
  });

  const { data: trends } = useQuery({
    queryKey: ["/api/analytics/trends"],
    enabled: !!user,
  });

  const { data: achievements } = useQuery({
    queryKey: ["/api/analytics/achievements"],
    enabled: !!user,
  });

  // Use real data from queries or show empty/default state
  const currentWeeklyStats = weeklyStats || {
    totalMinutes: 0,
    completedTasks: 0,
    targetMinutes: (user as any)?.weeklyTarget || 350,
    productivity: 0,
    dailyBreakdown: [0, 0, 0, 0, 0, 0, 0]
  };

  const currentMemberStats = memberStats || [];
  const currentTrends = trends || {
    weekOverWeek: 0,
    mostProductiveDay: '-',
    mostProductiveTime: '-', 
    topTaskCategory: '-'
  };
  const currentAchievements = achievements || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-white">📊 Analytics Dashboard</h2>
        <Badge variant="outline" className="text-xs">
          {format(new Date(), 'PPP', { locale: de })}
        </Badge>
      </div>

      {/* Wöchentliche Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wochenminuten</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentWeeklyStats.totalMinutes}</div>
            {currentTrends.weekOverWeek !== 0 && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+{currentTrends.weekOverWeek}%</span>
                <span>vs. letzte Woche</span>
              </div>
            )}
            <Progress 
              value={(currentWeeklyStats.totalMinutes / currentWeeklyStats.targetMinutes) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erledigte Aufgaben</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentWeeklyStats.completedTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Produktivster Tag: {currentTrends.mostProductiveDay}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produktivität</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentWeeklyStats.productivity}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Beste Zeit: {currentTrends.mostProductiveTime}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Kategorie</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{currentTrends.topTaskCategory}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Häufigste Aufgaben-Art
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Familienmitglieder Leistung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Familien-Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentMemberStats.length > 0 ? (
            <div className="space-y-4">
              {currentMemberStats.map((member: any, index: number) => (
                <div key={member.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.minutes} Min • {member.tasks} Aufgaben
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant={member.streak >= 5 ? 'default' : 'secondary'}>
                        🔥 {member.streak}
                      </Badge>
                      <span className="text-sm font-medium">{member.efficiency}%</span>
                    </div>
                    <Progress value={member.efficiency} className="w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Familiendaten verfügbar</p>
              <p className="text-sm">Loggt euch Zeit ein, um hier Statistiken zu sehen!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Erfolge & Meilensteine */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Erfolge & Meilensteine
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentAchievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentAchievements.map((achievement: any, index: number) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${
                    achievement.recent 
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                      {achievement.recent && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Neu
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Erfolge erreicht</p>
              <p className="text-sm">Erfüllt Aufgaben und erreicht Ziele für erste Erfolge!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wöchentlicher Verlauf */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Wöchentlicher Verlauf
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map((day, index) => (
              <div key={day} className="flex items-center space-x-3">
                <div className="w-20 text-sm text-muted-foreground">{day}</div>
                <div className="flex-1">
                  <Progress 
                    value={currentWeeklyStats.dailyBreakdown[index] || 0} 
                    className="h-3"
                  />
                </div>
                <div className="w-12 text-sm font-medium text-right">
                  {currentWeeklyStats.dailyBreakdown[index] || 0} min
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
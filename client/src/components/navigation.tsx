import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Home, BarChart3, ListTodo, User, Repeat, ShoppingCart, Bell, CheckSquare, Clock, Users, Brain, Sparkles, Calendar } from "lucide-react";
import { NotificationBell } from "@/components/notifications";

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { user } = useAuth();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "tasks", label: "Aufgaben", icon: ListTodo },
    { id: "my-tasks", label: "Meine", icon: CheckSquare },
    { id: "family", label: "Familie", icon: Users },
    ...(((user as any)?.role === 'admin') ? [{ id: "time-logs", label: "Zeit", icon: Clock }] : []),
    { id: "shopping", label: "Einkauf", icon: ShoppingCart },
    { id: "analytics", label: "Stats", icon: BarChart3 },
    { id: "notifications", label: "Info", icon: Bell },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary dark:text-primary-400">
                <Home className="inline mr-2" size={20} />
                HaushaltsManager
              </h1>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onViewChange(item.id)}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="mr-2" size={16} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onViewChange("notifications")}
              className="relative p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
            >
              <NotificationBell />
            </button>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
              <Badge variant={(user as any)?.role === 'admin' ? 'default' : 'secondary'}>
                {(user as any)?.role === 'admin' ? 'Admin' : 'Mitglied'}
              </Badge>
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <User className="mr-2" size={16} />
              Abmelden
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

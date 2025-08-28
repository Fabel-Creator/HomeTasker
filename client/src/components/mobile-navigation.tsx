import { Home, ListTodo, Repeat, ShoppingCart, Bell, CheckSquare, Users, Clock, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSwipeGestures } from "@/hooks/useSwipeGestures";

interface MobileNavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export default function MobileNavigation({ currentView, onViewChange }: MobileNavigationProps) {
  const { user } = useAuth();
  
  const baseNavItems = [
    { id: "dashboard", label: "Start", icon: Home },
    { id: "family", label: "Familie", icon: Users },
    { id: "my-tasks", label: "Meine", icon: CheckSquare },
    { id: "shopping", label: "Einkauf", icon: ShoppingCart },
    { id: "notifications", label: "Nachrichten", icon: Bell },
  ];
  
  const adminNavItems = (user as any)?.role === 'admin' ? [
    { id: "time-logs", label: "Zeit", icon: Clock },
  ] : [];
  
  const navItems = [...baseNavItems.slice(0, 2), ...adminNavItems, ...baseNavItems.slice(2)];
  
  // Find current index for swipe navigation
  const currentIndex = navItems.findIndex(item => item.id === currentView);
  
  const swipeHandlers = useSwipeGestures({
    onSwipeLeft: () => {
      const nextIndex = (currentIndex + 1) % navItems.length;
      onViewChange(navItems[nextIndex].id);
    },
    onSwipeRight: () => {
      const prevIndex = currentIndex === 0 ? navItems.length - 1 : currentIndex - 1;
      onViewChange(navItems[prevIndex].id);
    },
  });

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden z-50 touch-none"
      {...swipeHandlers}
    >
      <div className={`grid gap-1 ${navItems.length <= 5 ? `grid-cols-${navItems.length}` : 'grid-cols-5'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center py-2 px-1 transition-colors ${
                isActive
                  ? "text-primary dark:text-primary-400 bg-primary/5 dark:bg-primary/10 rounded-lg"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <Icon className="text-xl mb-1" size={20} />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Smartphone, Bell } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export function PWAInstallBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { isInstallable, installApp, requestNotificationPermission } = usePWA();
  
  if (!isInstallable || dismissed) return null;

  const handleInstall = async () => {
    await installApp();
    // Auch gleich Notification-Permission anfragen
    await requestNotificationPermission();
    setDismissed(true);
  };

  return (
    <Card className="mx-4 my-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                App installieren
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Schneller Zugriff + Push-Benachrichtigungen
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleInstall}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="install-app-button"
            >
              <Download className="h-4 w-4 mr-1" />
              Installieren
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              data-testid="dismiss-install-banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
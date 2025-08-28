import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  Bell, 
  MapPin,
  Users,
  Plus,
  Settings
} from "lucide-react";
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

export function CalendarIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedServices, setConnectedServices] = useState({
    googleCalendar: false,
    outlookCalendar: false,
    appleCalendar: false
  });

  // Mock calendar events for demo
  const mockCalendarEvents = [
    {
      id: '1',
      title: 'Küche putzen',
      start: new Date(2025, 7, 28, 14, 0),
      end: new Date(2025, 7, 28, 14, 30),
      type: 'household',
      assignee: 'Anna',
      status: 'scheduled',
      source: 'haushalts-app'
    },
    {
      id: '2', 
      title: 'Familieneinkauf',
      start: new Date(2025, 7, 29, 10, 0),
      end: new Date(2025, 7, 29, 11, 30),
      type: 'shopping',
      assignee: 'Tom',
      status: 'scheduled',
      source: 'google-calendar',
      location: 'REWE Markt'
    },
    {
      id: '3',
      title: 'Wochenbesprechung Familie',
      start: new Date(2025, 7, 30, 19, 0),
      end: new Date(2025, 7, 30, 20, 0),
      type: 'meeting',
      status: 'confirmed',
      source: 'outlook',
      attendees: ['Anna', 'Tom', 'Lisa']
    }
  ];

  const handleConnectService = async (service: string) => {
    setIsConnecting(true);
    
    // Simulate OAuth flow
    setTimeout(() => {
      setConnectedServices(prev => ({ ...prev, [service]: true }));
      toast({
        title: `📅 ${service} verbunden!`,
        description: "Deine Haushaltsaufgaben werden jetzt automatisch synchronisiert"
      });
      setIsConnecting(false);
    }, 2000);
  };

  const handleSyncCalendar = () => {
    toast({
      title: "🔄 Kalender synchronisiert",
      description: "Alle Aufgaben und Termine wurden aktualisiert"
    });
  };

  const handleCreateCalendarEvent = () => {
    toast({
      title: "📅 Termin erstellt",
      description: "Aufgabe wurde in deinen Kalender eingetragen"
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'household': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shopping': return 'bg-green-100 text-green-800 border-green-200';
      case 'meeting': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'google-calendar': return '📊';
      case 'outlook': return '📧';
      case 'apple-calendar': return '🍎';
      default: return '🏠';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          Kalender Integration
        </h2>
        <Button onClick={handleSyncCalendar} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Synchronisieren
        </Button>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: 'googleCalendar', name: 'Google Calendar', icon: '📊', color: 'blue' },
          { key: 'outlookCalendar', name: 'Outlook Calendar', icon: '📧', color: 'orange' }, 
          { key: 'appleCalendar', name: 'Apple Calendar', icon: '🍎', color: 'gray' }
        ].map((service) => (
          <Card key={service.key}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{service.icon}</span>
                  <h3 className="font-medium text-sm">{service.name}</h3>
                </div>
                {connectedServices[service.key as keyof typeof connectedServices] ? (
                  <Badge variant="secondary" className="text-xs text-green-600">
                    ✓ Verbunden
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Nicht verbunden
                  </Badge>
                )}
              </div>
              
              {!connectedServices[service.key as keyof typeof connectedServices] ? (
                <Button 
                  onClick={() => handleConnectService(service.key)}
                  disabled={isConnecting}
                  size="sm" 
                  className="w-full"
                >
                  {isConnecting ? '⏳ Verbinden...' : 'Verbinden'}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Einstellungen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Anstehende Termine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockCalendarEvents.map((event) => (
              <div 
                key={event.id}
                className="p-4 border rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge className={getEventTypeColor(event.type)}>
                        {event.type === 'household' ? '🏠 Haushalt' : 
                         event.type === 'shopping' ? '🛒 Einkauf' : '👥 Meeting'}
                      </Badge>
                      <span className="text-lg">{getSourceIcon(event.source)}</span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(event.start, 'PPP p', { locale: de })} - {format(event.end, 'p', { locale: de })}
                        </span>
                      </div>
                      
                      {event.assignee && (
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Zugewiesen an: {event.assignee}</span>
                        </div>
                      )}
                      
                      {event.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      
                      {event.attendees && (
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>Teilnehmer: {event.attendees.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Bell className="h-4 w-4 mr-1" />
                      Erinnern
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            Schnellaktionen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleCreateCalendarEvent}
              variant="outline" 
              className="justify-start h-auto p-4"
            >
              <div className="text-left">
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Aufgabe terminieren</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Haushaltsaufgabe in Kalender eintragen
                </p>
              </div>
            </Button>
            
            <Button 
              onClick={() => toast({
                title: "📱 WhatsApp Reminder",
                description: "Familie wird über anstehende Aufgaben benachrichtigt"
              })}
              variant="outline" 
              className="justify-start h-auto p-4"
            >
              <div className="text-left">
                <div className="flex items-center space-x-2 mb-1">
                  <Bell className="h-4 w-4" />
                  <span className="font-medium">WhatsApp Erinnerung</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Familie per WhatsApp benachrichtigen
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Smart Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            Intelligente Terminplanung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-medium mb-2">🤖 KI-Vorschlag für heute</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Die beste Zeit für "Küche putzen" ist um 14:00-14:30, da Anna dann verfügbar ist und historisch sehr effizient bei Küchenaufgaben ist.
              </p>
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleCreateCalendarEvent}>
                  📅 In Kalender eintragen
                </Button>
                <Button size="sm" variant="outline">
                  ⏰ Erinnerung setzen
                </Button>
              </div>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              💡 Die KI lernt aus euren Gewohnheiten und schlägt optimale Zeiten vor
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
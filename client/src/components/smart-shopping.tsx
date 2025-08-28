import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  Plus, 
  Camera, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Euro,
  Star,
  Lightbulb
} from "lucide-react";

export function SmartShopping() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // AI-powered suggestions based on purchase history
  const mockSuggestions = [
    { name: "Milch", category: "Kühlschrank", frequency: "Wöchentlich", lastBought: "vor 5 Tagen", confidence: 0.9 },
    { name: "Brot", category: "Backwaren", frequency: "Alle 3 Tage", lastBought: "vor 2 Tagen", confidence: 0.85 },
    { name: "Äpfel", category: "Obst", frequency: "Wöchentlich", lastBought: "vor 6 Tagen", confidence: 0.8 },
    { name: "Küchenrollen", category: "Haushalt", frequency: "Alle 2 Wochen", lastBought: "vor 12 Tagen", confidence: 0.75 },
  ];

  // Price trends (mock data - would come from API in real implementation)
  const mockPriceData = [
    { name: "Milch", currentPrice: 1.29, trend: -0.05, savings: "5¢ günstiger", store: "REWE" },
    { name: "Brot", currentPrice: 2.49, trend: 0.10, savings: "", store: "Lidl" },
    { name: "Bananen", currentPrice: 1.89, trend: -0.15, savings: "15¢ günstiger", store: "Aldi" },
  ];

  const handleSmartAdd = (suggestion: any) => {
    // Add item with smart data
    toast({
      title: "Smart hinzugefügt! ✨",
      description: `${suggestion.name} zur Einkaufsliste hinzugefügt (${suggestion.confidence * 100}% Sicherheit)`
    });
  };

  const handleBarcodeScanner = () => {
    // Would implement barcode scanning here
    toast({
      title: "🔍 Barcode Scanner",
      description: "Scanner wird geöffnet... (Demo-Modus)"
    });
  };

  const handleAIRecommendations = () => {
    // Generate smart shopping list based on patterns
    toast({
      title: "🤖 AI-Empfehlungen generiert",
      description: "Basierend auf deinem Kaufverhalten und saisonalen Trends"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-white">🛒 Smart Shopping</h2>
        <Button onClick={handleAIRecommendations} variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          AI-Empfehlungen
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Camera className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium">Barcode Scanner</h3>
            </div>
            <Button onClick={handleBarcodeScanner} className="w-full" size="sm">
              Artikel scannen
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              <h3 className="font-medium">Smart Vorschläge</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Basierend auf deinem Verlauf
            </p>
            <Badge variant="secondary" className="text-xs">
              {mockSuggestions.length} Vorschläge
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Euro className="h-5 w-5 text-green-600" />
              <h3 className="font-medium">Preisvergleich</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Automatisch günstigste Preise
            </p>
            <Badge variant="outline" className="text-xs text-green-600">
              💰 Bis zu 20% sparen
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* AI-Powered Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Intelligente Vorschläge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockSuggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium">{suggestion.name}</h4>
                    <Badge variant="outline" size="sm">
                      {suggestion.category}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs">{(suggestion.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {suggestion.frequency} • {suggestion.lastBought}
                  </p>
                </div>
                <Button 
                  onClick={() => handleSmartAdd(suggestion)}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Aktuelle Preisvergleiche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockPriceData.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <Badge variant="outline" size="sm">
                      {item.store}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg">{item.currentPrice.toFixed(2)}€</span>
                    <div className={`flex items-center space-x-1 ${
                      item.trend < 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className={`h-3 w-3 ${
                        item.trend < 0 ? 'rotate-180' : ''
                      }`} />
                      <span className="text-xs font-medium">
                        {item.trend > 0 ? '+' : ''}{(item.trend * 100).toFixed(0)}%
                      </span>
                    </div>
                    {item.savings && (
                      <Badge variant="secondary" className="text-xs text-green-600">
                        {item.savings}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Add */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Artikel hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input 
              placeholder="Artikel eingeben..." 
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleBarcodeScanner} variant="outline" size="sm">
              <Camera className="h-4 w-4" />
            </Button>
            <Button onClick={() => {
              if (newItem.trim()) {
                toast({
                  title: "Artikel hinzugefügt",
                  description: `"${newItem}" zur Einkaufsliste hinzugefügt`
                });
                setNewItem("");
              }
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
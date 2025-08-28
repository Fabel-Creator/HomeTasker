import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, ShoppingCart, Trash2, Check } from "lucide-react";
import { ShoppingListModal } from "./shopping-list-modal";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ShoppingList, ShoppingItem } from "@shared/schema";

export function ShoppingLists() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItems, setNewItems] = useState<{ [listId: string]: string }>({});

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ["/api/shopping-lists"],
    enabled: !!(user as any)?.householdId,
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ listId, name, quantity }: { listId: string; name: string; quantity?: string }) => {
      const response = await apiRequest("POST", `/api/shopping-lists/${listId}/items`, { name, quantity });
      return response.json();
    },
    onSuccess: (_, { listId }) => {
      setNewItems(prev => ({ ...prev, [listId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists", listId, "items"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Nicht autorisiert",
          description: "Sie sind abgemeldet. Werden neu angemeldet...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Fehler",
        description: "Artikel konnte nicht hinzugefügt werden",
        variant: "destructive",
      });
    },
  });

  const toggleItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest("PATCH", `/api/shopping-items/${itemId}/toggle`, {});
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all shopping list items
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Nicht autorisiert",
          description: "Sie sind abgemeldet. Werden neu angemeldet...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Fehler",
        description: "Status konnte nicht geändert werden",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest("DELETE", `/api/shopping-items/${itemId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Nicht autorisiert",
          description: "Sie sind abgemeldet. Werden neu angemeldet...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Fehler",
        description: "Artikel konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });

  const handleAddItem = (listId: string) => {
    const itemName = newItems[listId]?.trim();
    if (!itemName) return;

    addItemMutation.mutate({
      listId,
      name: itemName,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent, listId: string) => {
    if (e.key === "Enter") {
      handleAddItem(listId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Einkaufslisten</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Einkaufslisten</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neue Liste
        </Button>
      </div>

      {lists.length === 0 ? (
        <Card className="p-8 text-center">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Keine Einkaufslisten vorhanden</h3>
          <p className="text-gray-600 mb-4">
            Erstellen Sie gemeinsame Einkaufslisten für Ihren Haushalt
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Erste Liste erstellen
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list: ShoppingList & { items?: ShoppingItem[] }) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              newItemValue={newItems[list.id] || ""}
              onNewItemChange={(value) => setNewItems(prev => ({ ...prev, [list.id]: value }))}
              onAddItem={() => handleAddItem(list.id)}
              onKeyPress={(e) => handleKeyPress(e, list.id)}
              onToggleItem={(itemId) => toggleItemMutation.mutate(itemId)}
              onDeleteItem={(itemId) => deleteItemMutation.mutate(itemId)}
              isAddingItem={addItemMutation.isPending}
            />
          ))}
        </div>
      )}

      <ShoppingListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists"] });
        }}
      />
    </div>
  );
}

interface ShoppingListCardProps {
  list: ShoppingList & { items?: ShoppingItem[] };
  newItemValue: string;
  onNewItemChange: (value: string) => void;
  onAddItem: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  isAddingItem: boolean;
}

function ShoppingListCard({
  list,
  newItemValue,
  onNewItemChange,
  onAddItem,
  onKeyPress,
  onToggleItem,
  onDeleteItem,
  isAddingItem,
}: ShoppingListCardProps) {
  const { data: items = [] } = useQuery<ShoppingItem[]>({
    queryKey: ["/api/shopping-lists", list.id, "items"],
  });

  const checkedCount = items.filter(item => item.isChecked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{list.name}</CardTitle>
          {list.isCompleted ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" />
              Abgeschlossen
            </Badge>
          ) : (
            <Badge variant="outline">
              {checkedCount}/{totalCount}
            </Badge>
          )}
        </div>
        {!list.isCompleted && totalCount > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Noch keine Artikel hinzugefügt
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center space-x-2 p-2 rounded-md ${
                  item.isChecked ? "bg-gray-50" : "hover:bg-gray-50"
                }`}
              >
                <Checkbox
                  checked={item.isChecked}
                  onCheckedChange={() => onToggleItem(item.id)}
                  className="flex-shrink-0"
                />
                <span
                  className={`flex-1 text-sm ${
                    item.isChecked ? "line-through text-gray-500" : ""
                  }`}
                >
                  {item.name}
                  {item.quantity && (
                    <span className="text-gray-400 ml-1">({item.quantity})</span>
                  )}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDeleteItem(item.id)}
                  className="p-1 h-auto flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {!list.isCompleted && (
          <div className="flex space-x-2 pt-2 border-t">
            <Input
              placeholder="Artikel hinzufügen..."
              value={newItemValue}
              onChange={(e) => onNewItemChange(e.target.value)}
              onKeyPress={onKeyPress}
              className="flex-1"
              disabled={isAddingItem}
            />
            <Button
              size="sm"
              onClick={onAddItem}
              disabled={!newItemValue.trim() || isAddingItem}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
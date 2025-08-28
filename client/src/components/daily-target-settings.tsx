import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserTargetSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Users, Target } from "lucide-react";

type TargetForm = z.infer<typeof updateUserTargetSchema>;

interface DailyTargetSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DailyTargetSettings({ isOpen, onClose }: DailyTargetSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: householdMembers = [] } = useQuery({
    queryKey: ["/api/households", (user as any)?.householdId, "members"],
    enabled: !!(user as any)?.householdId && isOpen,
  });

  const form = useForm<TargetForm>({
    resolver: zodResolver(updateUserTargetSchema),
    defaultValues: {
      userId: "",
      dailyTargetMinutes: 60,
    },
  });

  const updateTargetMutation = useMutation({
    mutationFn: async (data: TargetForm) => {
      const response = await apiRequest("PUT", "/api/users/daily-target", data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate ALL relevant queries to refresh progress data
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Erfolg",
        description: "Tagesziel wurde erfolgreich aktualisiert!",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Tagesziel konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TargetForm) => {
    updateTargetMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Only show for admins
  if ((user as any)?.role !== 'admin') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="mr-2" size={20} />
            Tagesziele verwalten
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Members */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 flex items-center">
              <Users className="mr-2" size={16} />
              Aktuelle Mitglieder
            </h3>
            <div className="space-y-2">
              {(householdMembers as any[]).map((member: any) => (
                <Card key={member.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {`${member.firstName || ''} ${member.lastName || ''}`.trim() || 
                         member.displayName || 
                         member.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.role === 'admin' ? 'Administrator' : 'Mitglied'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm">
                        <Target className="mr-1" size={14} />
                        {member.dailyTargetMinutes || 60} Min/Tag
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Update Target Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mitglied auswählen</FormLabel>
                    <FormControl>
                      <select 
                        {...field}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Mitglied auswählen...</option>
                        {(householdMembers as any[]).map((member: any) => (
                          <option key={member.id} value={member.id}>
                            {`${member.firstName || ''} ${member.lastName || ''}`.trim() || 
                             member.displayName || 
                             member.email}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dailyTargetMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neues Tagesziel (Minuten)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        placeholder="60"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTargetMutation.isPending}
                >
                  {updateTargetMutation.isPending ? "Aktualisiere..." : "Ziel aktualisieren"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
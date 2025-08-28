import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTimeLogSchema } from "@shared/schema";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const timeLogFormSchema = insertTimeLogSchema.extend({
  logDate: z.string(),
}).omit({
  userId: true,
  householdId: true,
});

type TimeLogForm = z.infer<typeof timeLogFormSchema>;

interface LogTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogTimeModal({ isOpen, onClose }: LogTimeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TimeLogForm>({
    resolver: zodResolver(timeLogFormSchema),
    defaultValues: {
      title: "",
      description: "",
      minutes: 0,
      logDate: new Date().toISOString().split('T')[0], // Today's date
    },
  });

  const createTimeLogMutation = useMutation({
    mutationFn: async (data: TimeLogForm) => {
      const timeLogData = {
        ...data,
        logDate: data.logDate,
      };
      const response = await apiRequest("POST", "/api/time-logs", timeLogData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-logs/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      toast({
        title: "Erfolg",
        description: "Zeit wurde erfolgreich erfasst!",
      });
      form.reset({
        title: "",
        description: "",
        minutes: 0,
        logDate: new Date().toISOString().split('T')[0],
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Zeit konnte nicht erfasst werden.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TimeLogForm) => {
    createTimeLogMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset({
      title: "",
      description: "",
      minutes: 0,
      logDate: new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Zeit erfassen</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Was haben Sie erledigt? *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Badezimmer geputzt" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={2} 
                      placeholder="Zusätzliche Details..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dauer (Minuten) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="logDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datum</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                disabled={createTimeLogMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createTimeLogMutation.isPending ? "Erfasse..." : "Zeit erfassen"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

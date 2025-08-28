import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const listSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
});

type ListFormData = z.infer<typeof listSchema>;

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ShoppingListModal({ isOpen, onClose, onSuccess }: ShoppingListModalProps) {
  const { toast } = useToast();

  const form = useForm<ListFormData>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      name: "",
    },
  });

  const createListMutation = useMutation({
    mutationFn: async (data: ListFormData) => {
      const response = await apiRequest("POST", "/api/shopping-lists", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Liste erstellt",
        description: "Neue Einkaufsliste wurde erfolgreich erstellt",
      });
      form.reset();
      onSuccess();
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
        description: "Liste konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ListFormData) => {
    createListMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Einkaufsliste erstellen</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name der Liste</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="z.B. Wocheneinkauf, Getränke, etc." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={createListMutation.isPending}
                className="flex-1"
              >
                {createListMutation.isPending ? "Erstelle..." : "Liste erstellen"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
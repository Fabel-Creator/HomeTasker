import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Crown, User, Clock, Target, Calendar, UserMinus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface FamilyMember {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  role: "admin" | "member";
  isGuest: boolean;
  dailyTargetMinutes?: number;
  createdAt: string;
  profileImageUrl?: string;
}

interface MemberProgress {
  completedMinutes: number;
  targetMinutes: number;
  todayMinutes: number;
  weeklyMinutes: number;
}

export default function FamilyMembers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["/api/households", (user as any)?.householdId, "members"],
    enabled: !!(user as any)?.householdId,
  });

  const { data: household } = useQuery({
    queryKey: ["/api/households", (user as any)?.householdId],
    enabled: !!(user as any)?.householdId,
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/households/members/${userId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      toast({
        title: "Mitglied entfernt",
        description: "Das Mitglied wurde erfolgreich aus der Familie entfernt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Mitglied konnte nicht entfernt werden.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveMember = (userId: string) => {
    removeMemberMutation.mutate(userId);
  };

  const getUserDisplayName = (member: FamilyMember) => {
    if (member.isGuest) {
      return member.displayName || "Gast";
    }
    if (member.firstName && member.lastName) {
      return `${member.firstName} ${member.lastName}`;
    }
    return member.displayName || member.email || "Unbekannt";
  };

  const getUserInitials = (member: FamilyMember) => {
    if (member.isGuest) {
      return (member.displayName || "G").substring(0, 2).toUpperCase();
    }
    if (member.firstName && member.lastName) {
      return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
    }
    if (member.displayName) {
      return member.displayName.substring(0, 2).toUpperCase();
    }
    if (member.email) {
      return member.email.substring(0, 2).toUpperCase();
    }
    return "?";
  };

  const getRoleBadge = (role: string, isGuest: boolean) => {
    if (role === "admin") {
      return (
        <Badge className="bg-purple-100 text-purple-800">
          <Crown size={12} className="mr-1" />
          Admin
        </Badge>
      );
    }
    if (isGuest) {
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-300">
          <User size={12} className="mr-1" />
          Gast
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <User size={12} className="mr-1" />
        Mitglied
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Familie</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Users size={16} />
          <span>{(members as FamilyMember[]).length.toString()} Mitglieder</span>
        </div>
      </div>

      {/* Household Info */}
      {household && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Users className="mr-2" size={20} />
              {(household as any).name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-blue-700">
              <p>Erstellt am: {format(new Date((household as any).createdAt), "dd.MM.yyyy", { locale: de })}</p>
              {(user as any)?.role === 'admin' && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 mb-1">Einladungscode</p>
                  <p className="font-mono font-bold text-blue-900">{(household as any).inviteCode}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(members as FamilyMember[]).map((member: FamilyMember) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.profileImageUrl} />
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {getUserInitials(member)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {getUserDisplayName(member)}
                    </h3>
                    {member.id === (user as any)?.id && (
                      <Badge variant="outline" className="text-xs">Du</Badge>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    {getRoleBadge(member.role, member.isGuest)}
                  </div>

                  {!member.isGuest && member.email && (
                    <p className="text-sm text-gray-500 mb-2 truncate">{member.email}</p>
                  )}

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Target size={14} />
                      <span>Tagesziel: {member.dailyTargetMinutes || 60} Min</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} />
                      <span>
                        Beigetreten: {format(new Date(member.createdAt), "dd.MM.yyyy", { locale: de })}
                      </span>
                    </div>
                    
                    {/* Remove member button - only for admins and not for self */}
                    {(user as any)?.role === 'admin' && member.id !== (user as any)?.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full text-red-600 border-red-200 hover:bg-red-50"
                              disabled={removeMemberMutation.isPending}
                            >
                              <UserMinus className="h-4 w-4 mr-1" />
                              Aus Familie entfernen
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Mitglied entfernen</AlertDialogTitle>
                              <AlertDialogDescription>
                                Sind Sie sicher, dass Sie <strong>{getUserDisplayName(member)}</strong> aus der Familie entfernen möchten? 
                                Diese Aktion kann nicht rückgängig gemacht werden.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMember(member.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Entfernen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(members as FamilyMember[]).length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Familienmitglieder</h3>
            <p className="text-gray-500">
              {(user as any)?.role === 'admin' 
                ? 'Teilen Sie Ihren Einladungscode, damit andere beitreten können.'
                : 'Warten Sie darauf, dass andere Mitglieder dem Haushalt beitreten.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { useNavigate, Navigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Mail, CalendarDays, BookOpen, ArrowLeft, LogOut, Loader2 } from "lucide-react";

const links = [
  {
    title: "Annuaire",
    description: "Gérer les fiches membres : podcasteurs, pros et soutiens. Modifier, activer/désactiver, supprimer.",
    icon: BookOpen,
    to: "/admin/podcasts",
  },
  {
    title: "Adhésions",
    description: "Gérer les adhésions : consulter, modifier, supprimer, importer et exporter.",
    icon: Users,
    to: "/admin/adhesions",
  },
  {
    title: "Messages de contact",
    description: "Consulter, changer le statut et supprimer les demandes reçues.",
    icon: Mail,
    to: "/admin/contacts",
  },
  {
    title: "Événements",
    description: "Créer, modifier, supprimer et publier les événements.",
    icon: CalendarDays,
    to: "/admin/evenements",
  },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading, signOut } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-3xl text-foreground">Administration</h1>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Déconnexion
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {links.map((link) => (
            <Card
              key={link.to}
              className="cursor-pointer transition-shadow hover:shadow-lg border-border hover:border-primary/40"
              onClick={() => navigate(link.to)}
            >
              <CardHeader>
                <link.icon className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

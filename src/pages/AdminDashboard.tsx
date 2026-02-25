import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Mail, CalendarDays, Mic, ArrowLeft, LogOut, Loader2 } from "lucide-react";

const links = [
  {
    title: "Podcasts",
    description: "Voir toutes les fiches, activer/désactiver la visibilité dans le flux.",
    icon: Mic,
    to: "/admin/podcasts",
  },
  {
    title: "Adhésions",
    description: "Gérer les membres et exporter la liste des adhérents.",
    icon: Users,
    to: "/admin/adhesions",
  },
  {
    title: "Messages de contact",
    description: "Consulter et suivre les demandes reçues via le formulaire.",
    icon: Mail,
    to: "/admin/contacts",
  },
  {
    title: "Événements",
    description: "Créer, modifier et publier les événements de l'association.",
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
    navigate("/admin/login");
    return null;
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

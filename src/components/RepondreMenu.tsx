import { Copy, ExternalLink, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { gmailHref, mailtoHref, type Reponse } from "@/lib/repondre";

type Props = Reponse & {
  /** Texte du bouton (« Répondre », « Transmettre »…). */
  libelle?: string;
  /** Précision lue par les lecteurs d'écran (« à Léa Martin »). */
  precision?: string;
  /** Boîte Gmail à ouvrir quand plusieurs comptes sont connectés. */
  compteGmail?: string;
  className?: string;
  /** Appelé dès qu'une façon de répondre est choisie. */
  onChoisi?: () => void;
};

/**
 * Bouton « Répondre » avec trois façons de faire : Gmail en ligne, la messagerie de
 * l'ordinateur, ou copier l'adresse. Un simple lien « mailto » ne s'ouvre pas quand
 * aucune messagerie n'est installée.
 */
const RepondreMenu = ({ libelle = "Répondre", precision, compteGmail, className, onChoisi, ...reponse }: Props) => {
  const copier = async () => {
    onChoisi?.();
    try {
      await navigator.clipboard.writeText(reponse.to);
      toast.success(`Adresse copiée : ${reponse.to}`);
    } catch {
      window.prompt("Copiez l'adresse :", reponse.to);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          className ??
          "inline-flex items-center gap-1.5 min-h-[36px] px-3 bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-encre"
        }
      >
        <Mail className="w-4 h-4" aria-hidden />
        {libelle}
        {precision && <span className="sr-only"> {precision}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-none min-w-[230px]">
        <DropdownMenuItem asChild className="rounded-none cursor-pointer min-h-[40px]">
          <a href={gmailHref(reponse, compteGmail)} target="_blank" rel="noopener noreferrer" onClick={onChoisi}>
            <ExternalLink className="w-4 h-4 mr-2" aria-hidden /> Avec Gmail
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-none cursor-pointer min-h-[40px]">
          <a href={mailtoHref(reponse)} onClick={onChoisi}>
            <Mail className="w-4 h-4 mr-2" aria-hidden /> Avec ma messagerie
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-none cursor-pointer min-h-[40px]" onSelect={copier}>
          <Copy className="w-4 h-4 mr-2" aria-hidden /> Copier l'adresse
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RepondreMenu;

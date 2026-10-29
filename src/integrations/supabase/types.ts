export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      adhesion_rattachements: {
        Row: {
          adhesion_id: string
          created_at: string
          created_by: string | null
          email_membre: string
          id: string
        }
        Insert: {
          adhesion_id: string
          created_at?: string
          created_by?: string | null
          email_membre: string
          id?: string
        }
        Update: {
          adhesion_id?: string
          created_at?: string
          created_by?: string | null
          email_membre?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adhesion_rattachements_adhesion_id_fkey"
            columns: ["adhesion_id"]
            isOneToOne: false
            referencedRelation: "adhesions"
            referencedColumns: ["id"]
          },
        ]
      }
      adhesions: {
        Row: {
          annee: number | null
          created_at: string
          date_adhesion: string | null
          date_echeance: string | null
          email: string | null
          formule: string | null
          helloasso_order_id: string | null
          id: string
          montant: number | null
          nom: string | null
          prenom: string | null
          raw_payload: Json | null
          statut: string
          telephone: string | null
          type_adhesion: string | null
        }
        Insert: {
          annee?: number | null
          created_at?: string
          date_adhesion?: string | null
          date_echeance?: string | null
          email?: string | null
          formule?: string | null
          helloasso_order_id?: string | null
          id?: string
          montant?: number | null
          nom?: string | null
          prenom?: string | null
          raw_payload?: Json | null
          statut?: string
          telephone?: string | null
          type_adhesion?: string | null
        }
        Update: {
          annee?: number | null
          created_at?: string
          date_adhesion?: string | null
          date_echeance?: string | null
          email?: string | null
          formule?: string | null
          helloasso_order_id?: string | null
          id?: string
          montant?: number | null
          nom?: string | null
          prenom?: string | null
          raw_payload?: Json | null
          statut?: string
          telephone?: string | null
          type_adhesion?: string | null
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          created_at: string
          devis_id: string | null
          id: string
          lu_le: string | null
          message: string
          recipient_id: string
          sender_email: string
          sender_name: string
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          devis_id?: string | null
          id?: string
          lu_le?: string | null
          message: string
          recipient_id: string
          sender_email: string
          sender_name: string
          status?: string
          type?: string
        }
        Update: {
          created_at?: string
          devis_id?: string | null
          id?: string
          lu_le?: string | null
          message?: string
          recipient_id?: string
          sender_email?: string
          sender_name?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_requests_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "demandes_devis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_requests_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          nom: string
          objet: string
          prenom: string
          profil: string
          statut: string
          structure: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          nom: string
          objet: string
          prenom: string
          profil: string
          statut?: string
          structure?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          nom?: string
          objet?: string
          prenom?: string
          profil?: string
          statut?: string
          structure?: string | null
        }
        Relationships: []
      }
      demandes_devis: {
        Row: {
          besoins: string[]
          created_at: string
          departement: string | null
          description: string
          email: string
          format: string | null
          id: string
          nb_studios: number
          nom: string
          periode: string | null
          studio_vise: string | null
        }
        Insert: {
          besoins?: string[]
          created_at?: string
          departement?: string | null
          description: string
          email: string
          format?: string | null
          id?: string
          nb_studios?: number
          nom: string
          periode?: string | null
          studio_vise?: string | null
        }
        Update: {
          besoins?: string[]
          created_at?: string
          departement?: string | null
          description?: string
          email?: string
          format?: string | null
          id?: string
          nb_studios?: number
          nom?: string
          periode?: string | null
          studio_vise?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demandes_devis_studio_vise_fkey"
            columns: ["studio_vise"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          audio_url: string
          date_publication: string | null
          duree_secondes: number | null
          guid: string
          id: string
          image_url: string | null
          lien: string | null
          mis_a_jour: string
          podcast_id: string
          resume: string | null
          titre: string
        }
        Insert: {
          audio_url: string
          date_publication?: string | null
          duree_secondes?: number | null
          guid: string
          id?: string
          image_url?: string | null
          lien?: string | null
          mis_a_jour?: string
          podcast_id: string
          resume?: string | null
          titre: string
        }
        Update: {
          audio_url?: string
          date_publication?: string | null
          duree_secondes?: number | null
          guid?: string
          id?: string
          image_url?: string | null
          lien?: string | null
          mis_a_jour?: string
          podcast_id?: string
          resume?: string | null
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      evenement_inscriptions: {
        Row: {
          created_at: string
          email: string
          evenement_id: string
          id: string
          nom: string
          prenom: string
          statut: string
          structure: string | null
          telephone: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          evenement_id: string
          id?: string
          nom: string
          prenom: string
          statut?: string
          structure?: string | null
          telephone?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          evenement_id?: string
          id?: string
          nom?: string
          prenom?: string
          statut?: string
          structure?: string | null
          telephone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evenement_inscriptions_evenement_id_fkey"
            columns: ["evenement_id"]
            isOneToOne: false
            referencedRelation: "evenements"
            referencedColumns: ["id"]
          },
        ]
      }
      evenements: {
        Row: {
          adresse: string | null
          created_at: string
          date_debut: string
          date_fin: string | null
          description: string | null
          format: string
          id: string
          image_url: string | null
          inscription_activee: boolean
          lien_connexion: string | null
          lien_externe: string | null
          lieu: string | null
          motif_refus: string | null
          origine: string
          places: number | null
          podcasts_invites: Json | null
          propose_par: string | null
          propose_par_nom: string | null
          publie: boolean
          slug: string | null
          sous_titre: string | null
          statut: string
          structure_id: string | null
          tarif: string | null
          titre: string
          type: string
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          date_debut: string
          date_fin?: string | null
          description?: string | null
          format?: string
          id?: string
          image_url?: string | null
          inscription_activee?: boolean
          lien_connexion?: string | null
          lien_externe?: string | null
          lieu?: string | null
          motif_refus?: string | null
          origine?: string
          places?: number | null
          podcasts_invites?: Json | null
          propose_par?: string | null
          propose_par_nom?: string | null
          publie?: boolean
          slug?: string | null
          sous_titre?: string | null
          statut?: string
          structure_id?: string | null
          tarif?: string | null
          titre: string
          type?: string
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          description?: string | null
          format?: string
          id?: string
          image_url?: string | null
          inscription_activee?: boolean
          lien_connexion?: string | null
          lien_externe?: string | null
          lieu?: string | null
          motif_refus?: string | null
          origine?: string
          places?: number | null
          podcasts_invites?: Json | null
          propose_par?: string | null
          propose_par_nom?: string | null
          publie?: boolean
          slug?: string | null
          sous_titre?: string | null
          statut?: string
          structure_id?: string | null
          tarif?: string | null
          titre?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evenements_propose_par_fkey"
            columns: ["propose_par"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      evenements_proposeurs: {
        Row: {
          created_at: string
          email: string
          evenement_id: string
          podcast_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          evenement_id: string
          podcast_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          evenement_id?: string
          podcast_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evenements_proposeurs_evenement_id_fkey"
            columns: ["evenement_id"]
            isOneToOne: true
            referencedRelation: "evenements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_proposeurs_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      fiches_lieux: {
        Row: {
          acces_transports: string | null
          accessibilite: string | null
          capacite_voix: number | null
          equipement: Json
          faq: Json
          intitule_membres: string
          liens: Json
          photos: string[]
          podcast_id: string
          podcasts_lies: Json
          presse: Json
          propositions: Json
          services: string[]
          tarif_heure: number | null
          updated_at: string
        }
        Insert: {
          acces_transports?: string | null
          accessibilite?: string | null
          capacite_voix?: number | null
          equipement?: Json
          faq?: Json
          intitule_membres?: string
          liens?: Json
          photos?: string[]
          podcast_id: string
          podcasts_lies?: Json
          presse?: Json
          propositions?: Json
          services?: string[]
          tarif_heure?: number | null
          updated_at?: string
        }
        Update: {
          acces_transports?: string | null
          accessibilite?: string | null
          capacite_voix?: number | null
          equipement?: Json
          faq?: Json
          intitule_membres?: string
          liens?: Json
          photos?: string[]
          podcast_id?: string
          podcasts_lies?: Json
          presse?: Json
          propositions?: Json
          services?: string[]
          tarif_heure?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiches_lieux_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: true
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      flux_etat: {
        Row: {
          confirmation: string
          confirme_le: string | null
          confirme_par: string | null
          derniere_lecture: string
          flux_auteur: string | null
          flux_titre: string | null
          flux_url: string | null
          message: string | null
          nb_episodes: number
          podcast_id: string
          source: string | null
          statut: string
        }
        Insert: {
          confirmation?: string
          confirme_le?: string | null
          confirme_par?: string | null
          derniere_lecture?: string
          flux_auteur?: string | null
          flux_titre?: string | null
          flux_url?: string | null
          message?: string | null
          nb_episodes?: number
          podcast_id: string
          source?: string | null
          statut: string
        }
        Update: {
          confirmation?: string
          confirme_le?: string | null
          confirme_par?: string | null
          derniere_lecture?: string
          flux_auteur?: string | null
          flux_titre?: string | null
          flux_url?: string | null
          message?: string | null
          nb_episodes?: number
          podcast_id?: string
          source?: string | null
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "flux_etat_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: true
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      images_en_attente: {
        Row: {
          bucket_cible: string
          chemin: string
          created_at: string
          email: string
          id: string
          lot: string
          statut: string
          taille: number
          traite_at: string | null
          type_mime: string
        }
        Insert: {
          bucket_cible: string
          chemin: string
          created_at?: string
          email: string
          id?: string
          lot: string
          statut?: string
          taille: number
          traite_at?: string | null
          type_mime: string
        }
        Update: {
          bucket_cible?: string
          chemin?: string
          created_at?: string
          email?: string
          id?: string
          lot?: string
          statut?: string
          taille?: number
          traite_at?: string | null
          type_mime?: string
        }
        Relationships: []
      }
      podcasts: {
        Row: {
          apporte_choix: string[]
          apporte_precision: string | null
          besoin: string | null
          besoins_podcast: string[] | null
          bio_750: string | null
          cherche_choix: string[]
          cherche_collaboration: string[] | null
          cherche_precision: string | null
          city_insee_code: string | null
          city_name: string | null
          city_postcode: string | null
          consent_contact: boolean
          consent_mise_en_relation: boolean
          created_at: string
          department_code: string | null
          department_label: string | null
          description: string
          disponibilite: string | null
          email: string
          flux_rss: string | null
          format_collaboration: string | null
          frequence_publication: string | null
          id: string
          lien_ecoute: string
          lien_linkedin: string | null
          lien_principal: string | null
          metier_principal: string | null
          monetise: string | null
          niveau_avancement: string | null
          nom: string | null
          nom_podcast: string
          peut_apporter: string[] | null
          photo_profil_url: string | null
          prenom: string | null
          priorite_actuelle: string | null
          score_dynamique: number
          score_fiche: number
          score_global: number
          score_opportunite: number
          segment_pds: string
          services_3: string[] | null
          slug: string | null
          structure: string | null
          studio_data: Json | null
          telephone: string | null
          thematique: string | null
          type_podcast: string | null
          type_profil: string
          valide: boolean
          vignette_url: string | null
          ville: string | null
          visible_sans_adhesion: boolean
        }
        Insert: {
          apporte_choix?: string[]
          apporte_precision?: string | null
          besoin?: string | null
          besoins_podcast?: string[] | null
          bio_750?: string | null
          cherche_choix?: string[]
          cherche_collaboration?: string[] | null
          cherche_precision?: string | null
          city_insee_code?: string | null
          city_name?: string | null
          city_postcode?: string | null
          consent_contact?: boolean
          consent_mise_en_relation?: boolean
          created_at?: string
          department_code?: string | null
          department_label?: string | null
          description: string
          disponibilite?: string | null
          email: string
          flux_rss?: string | null
          format_collaboration?: string | null
          frequence_publication?: string | null
          id?: string
          lien_ecoute: string
          lien_linkedin?: string | null
          lien_principal?: string | null
          metier_principal?: string | null
          monetise?: string | null
          niveau_avancement?: string | null
          nom?: string | null
          nom_podcast: string
          peut_apporter?: string[] | null
          photo_profil_url?: string | null
          prenom?: string | null
          priorite_actuelle?: string | null
          score_dynamique?: number
          score_fiche?: number
          score_global?: number
          score_opportunite?: number
          segment_pds?: string
          services_3?: string[] | null
          slug?: string | null
          structure?: string | null
          studio_data?: Json | null
          telephone?: string | null
          thematique?: string | null
          type_podcast?: string | null
          type_profil?: string
          valide?: boolean
          vignette_url?: string | null
          ville?: string | null
          visible_sans_adhesion?: boolean
        }
        Update: {
          apporte_choix?: string[]
          apporte_precision?: string | null
          besoin?: string | null
          besoins_podcast?: string[] | null
          bio_750?: string | null
          cherche_choix?: string[]
          cherche_collaboration?: string[] | null
          cherche_precision?: string | null
          city_insee_code?: string | null
          city_name?: string | null
          city_postcode?: string | null
          consent_contact?: boolean
          consent_mise_en_relation?: boolean
          created_at?: string
          department_code?: string | null
          department_label?: string | null
          description?: string
          disponibilite?: string | null
          email?: string
          flux_rss?: string | null
          format_collaboration?: string | null
          frequence_publication?: string | null
          id?: string
          lien_ecoute?: string
          lien_linkedin?: string | null
          lien_principal?: string | null
          metier_principal?: string | null
          monetise?: string | null
          niveau_avancement?: string | null
          nom?: string | null
          nom_podcast?: string
          peut_apporter?: string[] | null
          photo_profil_url?: string | null
          prenom?: string | null
          priorite_actuelle?: string | null
          score_dynamique?: number
          score_fiche?: number
          score_global?: number
          score_opportunite?: number
          segment_pds?: string
          services_3?: string[] | null
          slug?: string | null
          structure?: string | null
          studio_data?: Json | null
          telephone?: string | null
          thematique?: string | null
          type_podcast?: string | null
          type_profil?: string
          valide?: boolean
          vignette_url?: string | null
          ville?: string | null
          visible_sans_adhesion?: boolean
        }
        Relationships: []
      }
      rappels_adhesion: {
        Row: {
          adhesion_id: string
          envoye_le: string
          envoye_par: string | null
          id: string
          palier: number
        }
        Insert: {
          adhesion_id: string
          envoye_le?: string
          envoye_par?: string | null
          id?: string
          palier: number
        }
        Update: {
          adhesion_id?: string
          envoye_le?: string
          envoye_par?: string | null
          id?: string
          palier?: number
        }
        Relationships: [
          {
            foreignKeyName: "rappels_adhesion_adhesion_id_fkey"
            columns: ["adhesion_id"]
            isOneToOne: false
            referencedRelation: "adhesions"
            referencedColumns: ["id"]
          },
        ]
      }
      relances_profil: {
        Row: {
          email: string
          envoye_le: string
          envoye_par: string | null
          id: string
          manques: string[]
        }
        Insert: {
          email: string
          envoye_le?: string
          envoye_par?: string | null
          id?: string
          manques?: string[]
        }
        Update: {
          email?: string
          envoye_le?: string
          envoye_par?: string | null
          id?: string
          manques?: string[]
        }
        Relationships: []
      }
      stats_empreintes: {
        Row: {
          empreinte: string
          jour: string
          podcast_id: string
          type: string
        }
        Insert: {
          empreinte: string
          jour: string
          podcast_id: string
          type: string
        }
        Update: {
          empreinte?: string
          jour?: string
          podcast_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stats_empreintes_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      stats_fiches_jour: {
        Row: {
          ecoutes: number
          jour: string
          podcast_id: string
          vues: number
        }
        Insert: {
          ecoutes?: number
          jour: string
          podcast_id: string
          vues?: number
        }
        Update: {
          ecoutes?: number
          jour?: string
          podcast_id?: string
          vues?: number
        }
        Relationships: [
          {
            foreignKeyName: "stats_fiches_jour_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_episodes_runs: {
        Row: {
          episodes: number | null
          finished_at: string | null
          id: number
          podcasts: number | null
          started_at: string
        }
        Insert: {
          episodes?: number | null
          finished_at?: string | null
          id?: never
          podcasts?: number | null
          started_at?: string
        }
        Update: {
          episodes?: number | null
          finished_at?: string | null
          id?: never
          podcasts?: number | null
          started_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verifications_flux: {
        Row: {
          appareil: string
          created_at: string
          id: number
        }
        Insert: {
          appareil: string
          created_at?: string
          id?: never
        }
        Update: {
          appareil?: string
          created_at?: string
          id?: never
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_flux: {
        Args: never
        Returns: {
          confirmation: string
          confirme_le: string
          derniere_lecture: string
          flux_auteur: string
          flux_titre: string
          flux_url: string
          lien_ecoute: string
          message: string
          nb_episodes: number
          nom_podcast: string
          podcast_id: string
          porteur: string
          source: string
          statut: string
        }[]
      }
      admin_membres: {
        Args: never
        Returns: {
          adhesion_id: string
          annee: number
          date_paiement: string
          email: string
          etat: string
          fiche_validee: boolean
          fiche_visible: boolean
          formule: string
          montant: number
          nb_fiches: number
          nom: string
          sursis: boolean
          type_profil: string
        }[]
      }
      admin_profils_a_completer: {
        Args: never
        Returns: {
          derniere_relance: string
          email: string
          fiche_validee: boolean
          nb_relances: number
          nom: string
          podcasts_sans_pochette: string[]
          podcasts_sans_rss: string[]
          sans_collab: boolean
          sans_photo: boolean
          type_profil: string
        }[]
      }
      annee_adhesion: { Args: { _podcast_id: string }; Returns: number }
      annee_couverte: { Args: { _email: string }; Returns: number }
      compter_stat: {
        Args: {
          _email_visiteur?: string
          _empreinte: string
          _podcast_id: string
          _type: string
        }
        Returns: boolean
      }
      confirmer_flux: {
        Args: { _decision: string; _podcast_id: string }
        Returns: boolean
      }
      demarrer_sync_episodes: { Args: never; Returns: number }
      effacer_donnees_membre: { Args: { _email: string }; Returns: string[] }
      episodes_visibles: { Args: { _podcast_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      je_viens_deja: { Args: { _evenement_id: string }; Returns: boolean }
      lieu_visible: { Args: { _id: string }; Returns: boolean }
      marquer_demande_lue: { Args: { _id: string }; Returns: boolean }
      membre_a_jour: { Args: { _email: string }; Returns: boolean }
      membre_a_jour_le: {
        Args: { _email: string; _quand: string }
        Returns: boolean
      }
      mes_demandes: {
        Args: never
        Returns: {
          created_at: string
          devis_besoins: string[]
          devis_departement: string
          devis_format: string
          devis_periode: string
          id: string
          lu_le: string
          message: string
          recipient_id: string
          sender_email: string
          sender_name: string
          type: string
        }[]
      }
      mes_evenements: {
        Args: never
        Returns: {
          date_debut: string
          id: string
          motif_refus: string
          nb_venues: number
          publie: boolean
          slug: string
          statut: string
          titre: string
        }[]
      }
      mes_flux: {
        Args: never
        Returns: {
          confirmation: string
          derniere_lecture: string
          message: string
          nb_episodes: number
          podcast_id: string
          source: string
          statut: string
        }[]
      }
      mes_stats: {
        Args: never
        Returns: {
          demandes: number
          ecoutes: number
          mois: string
          vues: number
        }[]
      }
      mes_venues: {
        Args: { _evenement_id: string }
        Returns: {
          created_at: string
          email: string
          nom: string
          prenom: string
        }[]
      }
      mon_adhesion: {
        Args: never
        Returns: {
          annee: number
          annee_renouvellement: number
          date_adhesion: string
          etat: string
          formule: string
          montant: number
          statut: string
          type_adhesion: string
        }[]
      }
      mon_evenement: { Args: { _id: string }; Returns: boolean }
      mon_lieu: { Args: { _id: string }; Returns: boolean }
      nb_venues: { Args: { _evenement_id: string }; Returns: number }
      pds_collab_codes: { Args: never; Returns: string[] }
      pds_collab_depuis_texte: { Args: { t: string }; Returns: string[] }
      pds_email: { Args: { required?: boolean; v: string }; Returns: string }
      pds_evenement_champs: {
        Args: { new: Database["public"]["Tables"]["evenements"]["Row"] }
        Returns: {
          adresse: string | null
          created_at: string
          date_debut: string
          date_fin: string | null
          description: string | null
          format: string
          id: string
          image_url: string | null
          inscription_activee: boolean
          lien_connexion: string | null
          lien_externe: string | null
          lieu: string | null
          motif_refus: string | null
          origine: string
          places: number | null
          podcasts_invites: Json | null
          propose_par: string | null
          propose_par_nom: string | null
          publie: boolean
          slug: string | null
          sous_titre: string | null
          statut: string
          structure_id: string | null
          tarif: string | null
          titre: string
          type: string
          updated_at: string
        }
        SetofOptions: {
          from: "evenements"
          to: "evenements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      pds_jsonb_txt: {
        Args: { label: string; maxlen: number; v: Json }
        Returns: string
      }
      pds_services_studio: { Args: never; Returns: string[] }
      pds_tel: { Args: { v: string }; Returns: string }
      pds_trop_d_envois: { Args: never; Returns: undefined }
      pds_txt: {
        Args: { label: string; maxlen: number; required?: boolean; v: string }
        Returns: string
      }
      pds_url: {
        Args: { label: string; maxlen?: number; v: string }
        Returns: string
      }
      peut_proposer_evenement: { Args: never; Returns: boolean }
      podcast_visible: { Args: { _id: string }; Returns: boolean }
      sursis_adhesion: {
        Args: { _actif: boolean; _email: string }
        Returns: number
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

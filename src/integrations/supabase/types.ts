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
      adhesions: {
        Row: {
          created_at: string
          date_adhesion: string | null
          email: string | null
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
          created_at?: string
          date_adhesion?: string | null
          email?: string | null
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
          created_at?: string
          date_adhesion?: string | null
          email?: string | null
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
      evenements: {
        Row: {
          adresse: string | null
          created_at: string
          date_debut: string
          date_fin: string | null
          description: string | null
          id: string
          image_url: string | null
          lien_externe: string | null
          lieu: string | null
          places: number | null
          publie: boolean
          sous_titre: string | null
          titre: string
          type: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          date_debut: string
          date_fin?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          lien_externe?: string | null
          lieu?: string | null
          places?: number | null
          publie?: boolean
          sous_titre?: string | null
          titre: string
          type?: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          lien_externe?: string | null
          lieu?: string | null
          places?: number | null
          publie?: boolean
          sous_titre?: string | null
          titre?: string
          type?: string
        }
        Relationships: []
      }
      podcasts: {
        Row: {
          besoin: string | null
          besoins_podcast: string[] | null
          bio_750: string | null
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
          frequence_publication: string | null
          id: string
          lien_ecoute: string
          lien_principal: string | null
          metier_principal: string | null
          monetise: string | null
          niveau_avancement: string | null
          nom: string | null
          nom_podcast: string
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
          telephone: string | null
          thematique: string | null
          type_podcast: string | null
          type_profil: string
          valide: boolean
          vignette_url: string | null
          ville: string | null
        }
        Insert: {
          besoin?: string | null
          besoins_podcast?: string[] | null
          bio_750?: string | null
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
          frequence_publication?: string | null
          id?: string
          lien_ecoute: string
          lien_principal?: string | null
          metier_principal?: string | null
          monetise?: string | null
          niveau_avancement?: string | null
          nom?: string | null
          nom_podcast: string
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
          telephone?: string | null
          thematique?: string | null
          type_podcast?: string | null
          type_profil?: string
          valide?: boolean
          vignette_url?: string | null
          ville?: string | null
        }
        Update: {
          besoin?: string | null
          besoins_podcast?: string[] | null
          bio_750?: string | null
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
          frequence_publication?: string | null
          id?: string
          lien_ecoute?: string
          lien_principal?: string | null
          metier_principal?: string | null
          monetise?: string | null
          niveau_avancement?: string | null
          nom?: string | null
          nom_podcast?: string
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
          telephone?: string | null
          thematique?: string | null
          type_podcast?: string | null
          type_profil?: string
          valide?: boolean
          vignette_url?: string | null
          ville?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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

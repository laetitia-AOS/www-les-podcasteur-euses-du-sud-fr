import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const useAdminAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const initialCheckDone = useRef(false);

  useEffect(() => {
    const checkAdmin = async (currentUser: User | null) => {
      if (currentUser) {
        const { data } = await supabase.rpc("has_role", {
          _user_id: currentUser.id,
          _role: "admin",
        });
        setIsAdmin(!!data);
      } else {
        setIsAdmin(false);
      }
      setUser(currentUser);
      setLoading(false);
    };

    // Get initial session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!initialCheckDone.current) {
        initialCheckDone.current = true;
        checkAdmin(session?.user ?? null);
      }
    });

    // Then listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (initialCheckDone.current) {
          checkAdmin(session?.user ?? null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  return { user, isAdmin, loading, signOut };
};

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const sessionQueryKey = ["auth", "session"] as const;

export function useSession() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: sessionQueryKey,
    queryFn: async (): Promise<Session | null> => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
      queryClient.setQueryData(sessionQueryKey, session);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return { session: query.data ?? null, user: query.data?.user ?? null, isLoading: query.isLoading };
}

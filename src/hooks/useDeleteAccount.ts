import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { deleteAccountFn, DELETE_CONFIRMATION } from "@/lib/account.functions";
import { ANON_ID_KEY } from "@/lib/analytics";
import { draftKey } from "@/lib/lesson-draft";
import { useSession } from "./useAuth";

/**
 * Deletes the signed-in learner's account, then clears everything this browser
 * still holds for it. The server has already removed the user, so signing out
 * is local only — there is no session left to revoke.
 */
export function useDeleteAccount() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useSession();
  return useMutation({
    mutationFn: () => deleteAccountFn({ data: { confirm: DELETE_CONFIRMATION } }),
    onSuccess: async () => {
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut({ scope: "local" });
      // Drafts and the analytics id live in this browser, not the database, but
      // someone deleting their account expects them gone too. Only this
      // learner's drafts: a shared computer may hold someone else's.
      try {
        const ownDrafts = user ? draftKey(user.id, "", "").replace(/::$/, ":") : null;
        for (const key of Object.keys(localStorage)) {
          if (key === ANON_ID_KEY || (ownDrafts && key.startsWith(ownDrafts))) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        // Storage can be unavailable (private mode); nothing to clear then.
      }
      await navigate({ to: "/", replace: true });
    },
  });
}

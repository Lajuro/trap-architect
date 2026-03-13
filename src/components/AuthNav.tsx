"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { hydrateFromProfile } from "@/lib/cosmetics-sync";

export default function AuthNav() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      setLoading(false);

      // Hydrate cosmetics from DB on login
      if (user) {
        try {
          const res = await fetch("/api/shop/inventory");
          if (res.ok) {
            const data = await res.json();
            // Also fetch campaign progress
            const profileRes = await fetch("/api/profile");
            const profileData = profileRes.ok ? await profileRes.json() : null;
            hydrateFromProfile({
              equipped_skin: data.equipped_skin,
              equipped_trail: data.equipped_trail,
              equipped_death_effect: data.equipped_death_effect,
              equipped_frame: data.equipped_frame,
              unlocked_cosmetics: data.unlocked_cosmetics,
              campaign_progress: profileData?.profile?.campaign_progress || {},
              campaign_completed: profileData?.profile?.campaign_completed || false,
            });
          }
        } catch {
          // Offline fallback — use existing localStorage
        }
      }
    });
  }, [supabase.auth]);

  if (loading) {
    return <div className="w-16 h-8" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/browse"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Explorar
        </Link>
        <Link
          href="/editor"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Criar Nível
        </Link>
        <Link
          href="/profile"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Perfil
        </Link>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.refresh();
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/browse"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Explorar
      </Link>
      <Link
        href="/editor"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Criar Nível
      </Link>
      <Link
        href="/login"
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
      >
        Entrar
      </Link>
    </div>
  );
}

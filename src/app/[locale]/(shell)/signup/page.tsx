"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Link, useRouter } from "@/i18n/navigation";
import FloatingBackground from "@/components/ui/FloatingBackground";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon } from "@/components/ui/PixelIcon";

export default function SignupPage() {
  const t = useTranslations("auth");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      setError(t("nicknameError"));
      return;
    }

    setLoading(true);

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname: trimmed },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    router.push("/login?registered=1");
  }

  async function handleOAuth(provider: "github" | "google") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <FloatingBackground count={12} />
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-6">
          <PixelIcon name="cat" size={40} color="#ff8c00" />
        </div>
        <HudPanel>
          <h1 className="text-[11px] font-bold text-center mb-1 uppercase tracking-wider">{t("signup")}</h1>
          <p className="text-center text-muted-foreground text-[8px] mb-6">
            {t("signupSubtitle")}
          </p>

          {error && (
            <div className="bg-red-500/10 border-2 border-red-500/30 text-red-400 px-3 py-2 mb-4 text-[8px]">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-3 mb-4">
            <div>
              <label htmlFor="nickname" className="block text-[8px] font-bold mb-1 uppercase tracking-wider">{t("nickname")}</label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                minLength={2}
                maxLength={30}
                className="w-full border-2 border-border bg-background px-3 py-2 text-[9px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t("nicknamePlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-[8px] font-bold mb-1 uppercase tracking-wider">{t("email")}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-2 border-border bg-background px-3 py-2 text-[9px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t("emailPlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[8px] font-bold mb-1 uppercase tracking-wider">{t("password")}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border-2 border-border bg-background px-3 py-2 text-[9px] focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t("passwordPlaceholder")}
              />
              <p className="text-[7px] text-muted-foreground mt-1">{t("passwordHint")}</p>
            </div>
            <HudButton type="submit" disabled={loading} variant="primary" className="w-full">
              {loading ? t("creatingAccount") : t("signup")}
            </HudButton>
          </form>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-border" />
            </div>
            <div className="relative flex justify-center text-[7px] uppercase tracking-wider">
              <span className="bg-card px-2 text-muted-foreground">{t("orContinueWith")}</span>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <HudButton onClick={() => handleOAuth("github")} variant="secondary" className="flex-1">
              GitHub
            </HudButton>
            <HudButton onClick={() => handleOAuth("google")} variant="secondary" className="flex-1">
              Google
            </HudButton>
          </div>

          <p className="text-center text-[8px] text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t("login")}
            </Link>
          </p>
        </HudPanel>
      </div>
    </div>
  );
}

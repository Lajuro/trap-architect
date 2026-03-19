"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import HudPanel from "@/components/ui/HudPanel";
import HudButton from "@/components/ui/HudButton";
import { PixelIcon } from "@/components/ui/PixelIcon";

interface LoginOverlayProps {
  onSuccess: () => void;
}

export default function LoginOverlay({ onSuccess }: LoginOverlayProps) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    onSuccess();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      setError("Nickname deve ter entre 2 e 30 caracteres");
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

    // After signup, try auto-login
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      // Signup succeeded but needs email confirmation
      setError("Conta criada! Verifique seu e-mail para confirmar.");
      setLoading(false);
      return;
    }
    onSuccess();
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
    <div className="fixed inset-0 z-[45] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Cat icon */}
        <div className="text-center mb-4">
          <PixelIcon name="cat" size={36} color="#ff8c00" />
        </div>

        <HudPanel>
          {/* Tabs */}
          <div className="flex border-b-2 border-border mb-4">
            <button
              onClick={() => { setTab("login"); setError(null); }}
              className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                tab === "login"
                  ? "text-primary border-b-2 border-primary -mb-[2px]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setTab("signup"); setError(null); }}
              className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                tab === "signup"
                  ? "text-primary border-b-2 border-primary -mb-[2px]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Criar Conta
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border-2 border-red-500/30 text-red-400 px-3 py-2 mb-4 text-[8px]">
              {error}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3 mb-4">
              <div>
                <label htmlFor="login-email" className="block text-[8px] font-bold mb-1 uppercase tracking-wider">
                  E-mail
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border-2 border-border bg-background px-3 py-2 text-[9px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-[8px] font-bold mb-1 uppercase tracking-wider">
                  Senha
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border-2 border-border bg-background px-3 py-2 text-[9px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="------"
                />
              </div>
              <HudButton type="submit" disabled={loading} variant="primary" className="w-full">
                {loading ? "Entrando..." : "Entrar"}
              </HudButton>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3 mb-4">
              <div>
                <label htmlFor="signup-nickname" className="block text-[8px] font-bold mb-1 uppercase tracking-wider">
                  Nickname
                </label>
                <input
                  id="signup-nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                  minLength={2}
                  maxLength={30}
                  className="w-full border-2 border-border bg-background px-3 py-2 text-[9px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="TrollMaster2000"
                />
              </div>
              <div>
                <label htmlFor="signup-email" className="block text-[8px] font-bold mb-1 uppercase tracking-wider">
                  E-mail
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border-2 border-border bg-background px-3 py-2 text-[9px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label htmlFor="signup-password" className="block text-[8px] font-bold mb-1 uppercase tracking-wider">
                  Senha
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border-2 border-border bg-background px-3 py-2 text-[9px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="------"
                />
                <p className="text-[7px] text-muted-foreground mt-1">Minimo 6 caracteres</p>
              </div>
              <HudButton type="submit" disabled={loading} variant="primary" className="w-full">
                {loading ? "Criando..." : "Criar Conta"}
              </HudButton>
            </form>
          )}

          {/* OAuth divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-border" />
            </div>
            <div className="relative flex justify-center text-[7px] uppercase tracking-wider">
              <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
            </div>
          </div>

          <div className="flex gap-2">
            <HudButton onClick={() => handleOAuth("github")} variant="secondary" className="flex-1">
              GitHub
            </HudButton>
            <HudButton onClick={() => handleOAuth("google")} variant="secondary" className="flex-1">
              Google
            </HudButton>
          </div>
        </HudPanel>
      </div>
    </div>
  );
}

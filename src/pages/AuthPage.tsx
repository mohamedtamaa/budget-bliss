import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email("Invalid email").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72);
const nameSchema = z.string().trim().min(1, "Name required").max(80);

export default function AuthPage() {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  if (!loading && user) return <Navigate to="/" replace />;

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const e1 = emailSchema.safeParse(email);
      if (!e1.success) return toast.error(e1.error.errors[0].message);

      setBusy(true);
      if (mode === "forgot") {
        const { error } = await resetPassword(email);
        if (error) return toast.error(error);
        toast.success("Reset link sent. Check your email.");
        setMode("login");
        return;
      }
      const p = passwordSchema.safeParse(password);
      if (!p.success) return toast.error(p.error.errors[0].message);

      if (mode === "signup") {
        const n = nameSchema.safeParse(displayName);
        if (!n.success) return toast.error(n.error.errors[0].message);
        const { error } = await signUp(email, password, displayName);
        if (error) return toast.error(error);
        toast.success("Account created. Check your email to verify (or sign in if auto-confirm is on).");
        setMode("login");
      } else {
        const { error } = await signIn(email, password);
        if (error) return toast.error(error);
        navigate("/");
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-40" style={{
        background: "radial-gradient(60% 50% at 50% 0%, hsl(var(--primary) / 0.25), transparent), radial-gradient(40% 40% at 80% 100%, hsl(var(--info) / 0.15), transparent)"
      }} />

      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Wallet className="text-primary-foreground" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Money Manager <span className="gradient-text">Pro</span></h1>
            <p className="text-xs text-muted-foreground">Premium personal finance tracking</p>
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8">
          {mode !== "forgot" ? (
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" />
              <TabsContent value="signup" />
            </Tabs>
          ) : (
            <h2 className="text-lg font-semibold mb-4">Reset password</h2>
          )}

          <form onSubmit={handle} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Mohamed" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required minLength={6} />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" size={16} />}
              {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-2">
              {mode === "login" && (
                <button type="button" className="hover:text-primary" onClick={() => setMode("forgot")}>Forgot password?</button>
              )}
              {mode === "forgot" && (
                <button type="button" className="hover:text-primary" onClick={() => setMode("login")}>Back to sign in</button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Demo data is auto-loaded on first sign up
        </p>
      </div>
    </div>
  );
}

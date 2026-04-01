"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const role = await login(email, password);
      // Use full navigation (not client-side) so cookies from Set-Cookie are sent
      if (role === "admin") window.location.href = "/admin/dashboard";
      else if (role === "volunteer") window.location.href = "/volunteer/dashboard";
      else if (role === "participant") window.location.href = "/participant/dashboard";
      else window.location.href = "/";
    } catch (err: any) {
      if (err.message === "PENDING_APPROVAL") {
        router.push("/pending-approval");
      } else {
        setError(err.message || "Failed to login");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Card className="shadow-[0_32px_64px_-12px_rgba(25,28,26,0.04)] border-0 ring-0 bg-card rounded-[20px]">
            <CardHeader className="text-center pb-2 pt-10">
              <CardTitle className="text-4xl font-serif font-medium text-foreground tracking-tight mb-2">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-foreground/50 text-[11px] uppercase tracking-[0.12em] font-bold">
                Sign in to your archive
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="flex flex-col gap-6 pt-8 px-8">
                {error && (
                  <div className="p-4 rounded-[8px] bg-destructive/[0.06] text-destructive text-sm font-medium">
                    {error}
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  <label htmlFor="login-email" className="text-[11px] uppercase tracking-[0.12em] font-bold text-foreground/40">
                    Email Address
                  </label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-muted/30 border-foreground/[0.06] focus-visible:ring-primary focus-visible:border-primary transition-all rounded-[8px] h-12"
                    required
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label htmlFor="login-password" className="text-[11px] uppercase tracking-[0.12em] font-bold text-foreground/40">
                    Password
                  </label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-muted/30 border-foreground/[0.06] focus-visible:ring-primary focus-visible:border-primary transition-all rounded-[8px] h-12"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-6 pb-10 pt-4 px-8">
                <Button
                  type="submit"
                  className="w-full h-14 text-base shadow-none hover:bg-primary/95 transition-all rounded-[8px]"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In to Archive"}
                  {!loading && <ArrowRight size={16} className="ml-2" />}
                </Button>
                <p className="text-sm text-foreground/50 text-center">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="text-primary font-semibold underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all"
                  >
                    Join the Archive
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}

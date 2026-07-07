"use client";

import { Suspense, useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Mail, Lock } from "lucide-react";
import { KyraLogo } from "@/components/ui/KyraLogo";
import { Button } from "@/components/ui/Button";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { toast } from "sonner";

function LoginForm() {
  const router      = useRouter();
  const params      = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/app";

  const emailRef    = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const email    = emailRef.current?.value.trim() ?? "";
    const password = passwordRef.current?.value ?? "";

    if (!email || !password) {
      setError("Please fill in both fields.");
      setLoading(false);
      return;
    }

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password. Try naya@example.com / kyra2026");
      return;
    }

    toast.success("Welcome back!");
    // Hard navigate — forces a fresh server render with the new session cookie,
    // bypassing Next.js router cache which would otherwise show stale content.
    window.location.href = callbackUrl;
  }

  return (
    <motion.div
      variants={staggerContainer(0.1, 0)}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Logo */}
      <motion.div variants={fadeUp} className="flex justify-center">
        <Link href="/">
          <KyraLogo size={40} showWordmark />
        </Link>
      </motion.div>

      {/* Card */}
      <motion.div variants={fadeUp} className="glass rounded-3xl p-8 space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-serif text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-white/40 font-sans">Sign in to your savings circle</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-coral-500/10 border border-coral-500/20 px-4 py-3 text-sm text-coral-400 font-sans"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-medium text-white/50 font-sans uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input
                id="email"
                ref={emailRef}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                className="w-full rounded-xl pl-10 pr-4 py-3 bg-white/4 border border-white/8 text-white text-sm font-sans placeholder:text-white/20 focus:outline-none focus:border-gold-400/50 focus:bg-white/6 transition-all duration-200"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-medium text-white/50 font-sans uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input
                id="password"
                ref={passwordRef}
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                className="w-full rounded-xl pl-10 pr-11 py-3 bg-white/4 border border-white/8 text-white text-sm font-sans placeholder:text-white/20 focus:outline-none focus:border-gold-400/50 focus:bg-white/6 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="mt-2">
            Sign in
            {!loading && <ArrowRight className="w-4 h-4" />}
          </Button>
        </form>

        {/* Demo hint */}
        <div className="rounded-xl bg-gold-400/5 border border-gold-400/10 px-4 py-3 text-xs text-white/40 font-sans space-y-0.5">
          <p className="font-medium text-gold-400/70">Demo credentials</p>
          <p>Email: naya@example.com</p>
          <p>Password: kyra2026</p>
        </div>
      </motion.div>

      <motion.p variants={fadeUp} className="text-center text-sm text-white/35 font-sans">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
          Create one
        </Link>
      </motion.p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

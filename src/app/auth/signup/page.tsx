"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, CheckCircle2 } from "lucide-react";
import { KyraLogo } from "@/components/ui/KyraLogo";
import { Button } from "@/components/ui/Button";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { toast } from "sonner";

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "bg-coral-500", "bg-gold-500", "bg-gold-400", "bg-mint-500"];

function getStrength(password: string): number {
  if (password.length === 0) return 0;
  let score = 0;
  if (password.length >= 8)                        score++;
  if (/[A-Z]/.test(password))                      score++;
  if (/[0-9]/.test(password))                      score++;
  if (/[^A-Za-z0-9]/.test(password))               score++;
  return score;
}

export default function SignupPage() {
  const router = useRouter();

  const nameRef     = useRef<HTMLInputElement>(null);
  const emailRef    = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [showPwd,   setShowPwd]   = useState(false);
  const [password,  setPassword]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const strength = getStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const name     = nameRef.current?.value.trim() ?? "";
    const email    = emailRef.current?.value.trim() ?? "";
    const pwd      = passwordRef.current?.value ?? "";

    if (!name || !email || !pwd) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    // Create account
    const signupRes = await fetch("/api/auth/signup", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, email, password: pwd }),
    });

    if (!signupRes.ok) {
      const data = await signupRes.json();
      setError(data.error ?? "Signup failed. Please try again.");
      setLoading(false);
      return;
    }

    // Auto-sign-in after account creation
    const res = await signIn("credentials", {
      email,
      password: pwd,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Account created but sign-in failed. Please log in manually.");
      return;
    }

    toast.success(`Welcome to Kyra, ${name.split(" ")[0]}! Let's get you set up.`);
    // Hard navigate — forces a fresh server render with the new session cookie.
    window.location.href = "/app/account";
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
        {/* Heading */}
        <div className="space-y-1 text-center">
          <h1 className="font-serif text-2xl font-bold text-white">
            Create your account
          </h1>
          <p className="text-sm text-white/40 font-sans">
            Join a savings circle and start building wealth together
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-coral-500/10 border border-coral-500/20 px-4 py-3 text-sm text-coral-400 font-sans"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full name */}
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="block text-xs font-medium text-white/50 font-sans uppercase tracking-wider"
            >
              Full name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input
                id="name"
                ref={nameRef}
                type="text"
                autoComplete="name"
                placeholder="Naya Okafor"
                required
                className="
                  w-full rounded-xl pl-10 pr-4 py-3
                  bg-white/4 border border-white/8
                  text-white text-sm font-sans placeholder:text-white/20
                  focus:outline-none focus:border-gold-400/50 focus:bg-white/6
                  transition-all duration-200
                "
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-medium text-white/50 font-sans uppercase tracking-wider"
            >
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
                className="
                  w-full rounded-xl pl-10 pr-4 py-3
                  bg-white/4 border border-white/8
                  text-white text-sm font-sans placeholder:text-white/20
                  focus:outline-none focus:border-gold-400/50 focus:bg-white/6
                  transition-all duration-200
                "
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-white/50 font-sans uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input
                id="password"
                ref={passwordRef}
                type={showPwd ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full rounded-xl pl-10 pr-11 py-3
                  bg-white/4 border border-white/8
                  text-white text-sm font-sans placeholder:text-white/20
                  focus:outline-none focus:border-gold-400/50 focus:bg-white/6
                  transition-all duration-200
                "
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

            {/* Strength meter */}
            {password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-1.5 pt-1"
              >
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        strength >= level
                          ? strengthColors[strength]
                          : "bg-white/8"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-white/35 font-sans">
                  {strengthLabels[strength]}
                </p>
              </motion.div>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            className="mt-2"
          >
            Create account
            {!loading && <ArrowRight className="w-4 h-4" />}
          </Button>
        </form>

        {/* Trust points */}
        <div className="flex flex-col gap-2">
          {[
            "No credit card required",
            "Free to join a savings circle",
            "Payments secured by Nomba",
          ].map((point) => (
            <div key={point} className="flex items-center gap-2 text-xs text-white/30 font-sans">
              <CheckCircle2 className="w-3.5 h-3.5 text-mint-400/50 flex-shrink-0" />
              {point}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Switch to login */}
      <motion.p
        variants={fadeUp}
        className="text-center text-sm text-white/35 font-sans"
      >
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-gold-400 hover:text-gold-300 transition-colors font-medium"
        >
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Shield,
  Paperclip,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    await signIn("google", { callbackUrl: "/" });
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Sign up failed"); setLoading(false); return; }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: brand + value props ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: "linear-gradient(135deg, #1a6b58 0%, #2D9B83 50%, #3dbfa0 100%)" }}
      >
        {/* Background decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-48 -right-24 w-[500px] h-[500px] rounded-full opacity-10 bg-white" />
        <div className="absolute top-1/3 right-12 w-64 h-64 rounded-full opacity-5 bg-white" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-[72px] h-[72px] rounded-xl overflow-hidden">
            <img src="/logo_dark.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-white text-xl font-bold tracking-tight">Shipper Chat</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-bold text-white leading-tight mb-5">
            Where great<br />
            <span className="text-white/70">teams</span> talk.
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-10">
            Real-time messaging built for teams who move fast. Chat, share files,
            and stay in sync — all in one place.
          </p>

          {/* Value props */}
          <div className="space-y-4">
            {[
              { icon: Zap,        text: "Messages delivered in milliseconds" },
              { icon: Paperclip, text: "Share images, docs, and files instantly" },
              { icon: Shield,    text: "Secure sessions with Google OAuth or email" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-white" strokeWidth={2} />
                </div>
                <span className="text-white/80 text-[15px]">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating chat bubbles preview */}
        <div className="relative z-10 space-y-3 opacity-90">
          {[
            { me: false, text: "Hey, can you send over the latest designs?",    time: "10:14 AM" },
            { me: true,  text: "On it! Uploading them now 📎",                  time: "10:15 AM" },
            { me: false, text: "Perfect, thanks! You're a lifesaver 🙌",         time: "10:15 AM" },
          ].map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.me ? "justify-end" : "justify-start"}`}
              style={{ animation: `fadeSlideUp 0.5s ease ${i * 0.15}s both` }}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                  msg.me
                    ? "bg-white text-gray-800 rounded-tr-md"
                    : "bg-white/20 text-white rounded-tl-md"
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-[10px] mt-0.5 ${msg.me ? "text-gray-400" : "text-white/60"}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: auth form ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-[52px] h-[52px] rounded-xl overflow-hidden">
              <img src="/logo_dark.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-gray-900 text-lg font-bold">Shipper Chat</span>
          </div>

          <h2 className="text-[26px] font-bold text-gray-900 mb-1">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-gray-500 text-[14px] mb-7">
            {mode === "signin"
              ? "Sign in to your account to continue"
              : "Join thousands of teams already on Shipper"}
          </p>

          {/* Google OAuth button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-2xl text-gray-700 font-semibold text-[14px] hover:border-[#2D9B83] hover:bg-[#2D9B83]/5 transition-all duration-200 mb-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-gray-300 border-t-[#2D9B83] rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[12px] text-gray-400 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Credentials form */}
          <form onSubmit={handleCredentials} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-[14px] text-gray-800 placeholder-gray-400 outline-none focus:border-[#2D9B83] focus:bg-white transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-[14px] text-gray-800 placeholder-gray-400 outline-none focus:border-[#2D9B83] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-[14px] text-gray-800 placeholder-gray-400 outline-none focus:border-[#2D9B83] focus:bg-white transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-[13px] text-red-500 bg-red-50 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#2D9B83] hover:bg-[#257a68] text-white font-semibold text-[14px] rounded-2xl transition-all duration-200 mt-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#2D9B83]/30"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Sign in" : "Create account"}
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Toggle sign-in / sign-up */}
          <p className="text-center text-[13px] text-gray-500 mt-5">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
              className="text-[#2D9B83] font-semibold hover:underline"
            >
              {mode === "signin" ? "Sign up free" : "Sign in"}
            </button>
          </p>

          {/* Social proof (sign-in only) */}
          {mode === "signin" && (
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2">
              <CheckCircle2 size={14} className="text-[#2D9B83]" />
              <span className="text-[12px] text-gray-400">
                Trusted by 1,000+ teams worldwide
              </span>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

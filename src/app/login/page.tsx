// src/app/login/page.tsx
"use client";

import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import Link from "next/link";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-1.9 3.1l3.1 2.4C20.4 18.2 21.3 15.8 21.3 13c0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M6.5 14.3l-.8.6-2.5 1.9C4.6 19.8 8.1 21.6 12 21.6c2.6 0 4.7-.9 6.2-2.1l-3.1-2.4c-.8.6-1.8 1-3.1 1-2.4 0-4.4-1.6-5.1-3.8z"
      />
      <path
        fill="#4A90E2"
        d="M3.2 7.5C2.4 8.8 2 10.3 2 11.8s.4 3 1.2 4.3l3.3-2.6c-.2-.6-.4-1.2-.4-1.9s.1-1.3.4-1.9L3.2 7.5z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.3c1.4 0 2.6.5 3.5 1.3l2.6-2.6C16.7 2.8 14.6 2 12 2 8.1 2 4.6 3.8 3.2 7.5l3.3 2.6c.7-2.2 2.7-3.8 5.5-3.8z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);

      // Keep redirect URL in sessionStorage - it will be read by auth callback
      // after OAuth completes

      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (err) {
      console.error("Google login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700;800&family=Rajdhani:wght@400;500;600;700&display=swap');

        .login-bg {
          background: 
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255, 7, 58, 0.12), transparent 50%),
            radial-gradient(ellipse 60% 40% at 100% 100%, rgba(0, 240, 255, 0.08), transparent 50%),
            #08080c;
        }

        .card-glass {
          background: rgba(16, 16, 22, 0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .glow-red {
          text-shadow: 0 0 20px rgba(255, 7, 58, 0.5),
                       0 0 40px rgba(255, 7, 58, 0.25);
        }

        .glow-cyan {
          text-shadow: 0 0 15px rgba(0, 240, 255, 0.5);
        }

        .btn-google {
          background: white;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .btn-google:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        }

        .btn-google:active {
          transform: translateY(0);
        }

        .btn-google:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .feature-chip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .live-dot {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <main className="min-h-screen login-bg text-white">
        <div className="min-h-screen flex flex-col">
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col lg:flex-row items-center justify-center px-4 py-8 gap-8 lg:gap-16">
            
            {/* Left Side - Hero (Hidden on mobile, shown on lg+) */}
            <section 
              className={`hidden lg:block lg:w-[400px] xl:w-[450px] ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '0.1s' }}
            >
              {/* Live Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1.5 mb-6 border border-zinc-800/50">
                <span className="live-dot h-2 w-2 rounded-full bg-emerald-400" />
                <span 
                  className="text-xs font-medium text-zinc-300"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  Live slots available now
                </span>
              </div>

              {/* Title */}
              <h1 
                className="text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-4"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                <span className="text-white">Reserve Your</span>
                <br />
                <span className="text-[#ff073a] glow-red">Gaming Seat</span>
              </h1>

              <p 
                className="text-base text-zinc-400 mb-6 max-w-sm"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                Book consoles at premium gaming cafés near you. No calls, no queues — just tap and play.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2">
                <span 
                  className="feature-chip rounded-full px-3 py-1.5 text-xs font-medium text-zinc-300"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  🎮 PS5 • PC • Xbox
                </span>
                <span 
                  className="feature-chip rounded-full px-3 py-1.5 text-xs font-medium text-zinc-300"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  ⚡ Instant Booking
                </span>
                <span 
                  className="feature-chip rounded-full px-3 py-1.5 text-xs font-medium text-zinc-300"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  🏆 Tournaments
                </span>
              </div>

              {/* Stats */}
              <div className="mt-8 flex items-center gap-6">
                <div>
                  <div 
                    className="text-2xl font-bold text-white"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    50+
                  </div>
                  <div 
                    className="text-xs text-zinc-500"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Gaming Cafés
                  </div>
                </div>
                <div className="w-px h-10 bg-zinc-800" />
                <div>
                  <div 
                    className="text-2xl font-bold text-white"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    1K+
                  </div>
                  <div 
                    className="text-xs text-zinc-500"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Happy Gamers
                  </div>
                </div>
                <div className="w-px h-10 bg-zinc-800" />
                <div>
                  <div 
                    className="text-2xl font-bold text-[#00f0ff]"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    24/7
                  </div>
                  <div 
                    className="text-xs text-zinc-500"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Availability
                  </div>
                </div>
              </div>
            </section>

            {/* Right Side - Login Card */}
            <section 
              className={`w-full max-w-[380px] ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '0.2s' }}
            >
              <div className="card-glass rounded-2xl p-6 sm:p-8">
                
                {/* Mobile Hero - Only on small screens */}
                <div className="lg:hidden text-center mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1.5 mb-4 border border-zinc-800/50">
                    <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span 
                      className="text-[10px] font-medium text-zinc-400"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                    >
                      Live slots available
                    </span>
                  </div>
                  
                  <h1 
                    className="text-xl sm:text-2xl font-black tracking-tight mb-2"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    <span className="text-white">Reserve Your </span>
                    <span className="text-[#ff073a] glow-red">Gaming Seat</span>
                  </h1>
                  
                  <p 
                    className="text-sm text-zinc-400"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Book consoles at gaming cafés near you
                  </p>
                </div>

                {/* Card Header - Desktop */}
                <div className="hidden lg:block mb-6">
                  <h2 
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    Welcome
                  </h2>
                  <p 
                    className="mt-1 text-sm text-zinc-400"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Sign in to manage bookings and find open slots
                  </p>
                </div>

                {/* Divider with text - Mobile */}
                <div className="lg:hidden flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span 
                    className="text-xs text-zinc-500"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Sign in to continue
                  </span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>

                {/* Google Sign In Button */}
                <button
                  onClick={signInWithGoogle}
                  disabled={loading}
                  className="btn-google w-full flex items-center justify-center gap-3 rounded-xl py-3.5 text-sm font-semibold text-zinc-800"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  {loading ? (
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(0, 0, 0, 0.1)",
                        borderTopColor: "#ff073a",
                        borderRadius: "50%",
                        animation: "spin 0.6s linear infinite",
                      }}
                    />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>{loading ? "Connecting..." : "Continue with Google"}</span>
                </button>

                {/* Privacy Note */}
                <p 
                  className="mt-4 text-center text-[11px] text-zinc-500 leading-relaxed"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  We only use your email to create your gaming profile.
                  <br className="hidden sm:block" />
                  No spam, ever. 🎮
                </p>

                {/* Mobile Feature Pills */}
                <div className="lg:hidden mt-6 pt-5 border-t border-zinc-800/50">
                  <div className="flex flex-wrap justify-center gap-2">
                    <span 
                      className="feature-chip rounded-full px-2.5 py-1 text-[10px] font-medium text-zinc-400"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                    >
                      🎮 PS5 • PC • Xbox
                    </span>
                    <span 
                      className="feature-chip rounded-full px-2.5 py-1 text-[10px] font-medium text-zinc-400"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                    >
                      ⚡ Instant Booking
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                  <span 
                    className="text-[10px] text-zinc-600"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Secure login via Supabase
                  </span>
                  <span 
                    className="text-[10px] text-zinc-600 font-mono"
                  >
                    v1.0 beta
                  </span>
                </div>
              </div>

              {/* Back to Home Link */}
              <div className="mt-4 text-center">
                <Link 
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Home
                </Link>
              </div>
            </section>
          </div>

          {/* Bottom Safe Area Spacer for Mobile */}
          <div className="h-6 sm:h-0" />
        </div>
      </main>
    </>
  );
}
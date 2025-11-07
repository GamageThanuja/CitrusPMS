"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, Check } from "lucide-react";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslatedText } from "@/lib/translation";
import { TranslationProvider } from "@/lib/translation";
import { _signInWithGoogle } from "@/lib/GoogleSigninHelper";

import {
  seedInitialTokens,
  refreshToken,
  setTokenPersistence, // ✅ NEW
  isAuthenticated, // ✅ NEW (use in effect)
} from "@/lib/tokenManager";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const QRLoginComponent = dynamic(
  () => import("@/components/QRLoginComponent"),
  { ssr: false }
);

export function AnimatedGradientBackground({
  children,
  colors = ["#ff6b6b", "#feca57", "#1dd1a1", "#54a0ff", "#5f27cd"],
  angle = -45,
  speed = 18,
  className = "min-h-screen flex items-center justify-center text-white",
}: {
  children?: ReactNode;
  colors?: string[];
  angle?: number;
  speed?: number;
  className?: string;
}) {
  const gradientString = `linear-gradient(${angle}deg, ${colors.join(", ")})`;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Animated gradient layer */}
      <div
        className="absolute inset-0 animated-gradient"
        style={{
          backgroundImage: gradientString,
          backgroundSize: "400% 400%",
          animationDuration: `${speed}s`,
        }}
      />
      {/* Soft bloom */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-30"
        style={{
          background:
            "radial-gradient(1200px 800px at 20% 30%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(900px 600px at 80% 70%, rgba(255,255,255,0.2), transparent 60%)",
        }}
      />
      <div className="relative z-10">{children}</div>
      <style jsx>{`
        .animated-gradient {
          animation-name: gradientShift;
          animation-timing-function: ease;
          animation-iteration-count: infinite;
        }
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPageWrapper() {
  return (
    <div className="notranslate">
      <TranslationProvider>
        <LoginForm />
      </TranslationProvider>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const welcomeBackText = useTranslatedText("Welcome back");
  const enterCredentialsText = useTranslatedText(
    "Enter your credentials to access your account"
  );
  const emailText = useTranslatedText("Email");
  const passwordText = useTranslatedText("Password");
  const rememberMeText = useTranslatedText("Remember me");
  const forgotPasswordText = useTranslatedText("Forgot password?");
  const signInText = useTranslatedText("Sign in");
  const dontHaveAccountText = useTranslatedText("New to Hotel Mate? ");
  const signUpText = useTranslatedText("Create your property");
  const orContinueWithText = useTranslatedText("Or continue with");

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    const savedRemember = localStorage.getItem("rememberMe") === "true";

    if (savedRemember && savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/Auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: email, password }),
      });

      if (!res.ok) {
        const msg = await res.text();
        let msgText = msg;
        try {
          const parsed = JSON.parse(msg);
          if (parsed?.title === "Invalid credentials.") {
            msgText =
              "Invalid credentials, Please check your email and password.";
          }
        } catch (_) {
          // fallback to default message
        }
        throw new Error(msgText || "Login failed. Please try again.");
      }
      const data = await res.json(); // ✅ Only once
      console.log("✅ Login success:", data);

      const { accessToken: initialAccess, refreshToken: initialRefresh } = data;

      setTokenPersistence(rememberMe ? "local" : "session");

      seedInitialTokens(initialAccess, initialRefresh);
      // await refreshToken();

      // ✅ Decode and store token claims
      const payloadBase64 = initialAccess.split(".")[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      console.log("Decoded Payload:", decodedPayload);

      localStorage.setItem(
        "userId",
        decodedPayload[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
        ]
      );
      localStorage.setItem(
        "userRole",
        decodedPayload[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ]
      );
      localStorage.setItem("fullName", decodedPayload.fullName);
      localStorage.setItem("email", decodedPayload.email);
      localStorage.setItem("hotels", decodedPayload.hotels);

      localStorage.setItem("tokenExp", decodedPayload.exp.toString());
      localStorage.setItem("tokenIssuer", decodedPayload.iss);
      localStorage.setItem("tokenAudience", decodedPayload.aud);
      try {
        const hotels = decodedPayload.hotels;
        const selectedRaw = localStorage.getItem("selectedProperty");
        const selected = selectedRaw ? JSON.parse(selectedRaw) : null;

        if (hotels && selected) {
          const matchedHotel = hotels.find(
            (hotel: any) => hotel.id === selected.id
          );
          if (matchedHotel?.currencyCode) {
            localStorage.setItem("currencyCode", matchedHotel.currencyCode);
          }
        }
      } catch (error) {
        console.error("Failed to set currency code after login", error);
      }

      // ✅ Remember credentials
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberedPassword", password);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
        localStorage.setItem("rememberMe", "false");
      }

      localStorage.setItem("status", "logged in");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      if (isAuthenticated()) {
        router.replace("/dashboard");
      }
    } catch {}
  }, [router]);

  const handleGoogleSignIn = async () => {
    try {
      const user = await _signInWithGoogle();
      if (user) router.push("/dashboard");
    } catch (err) {
      console.error("Google sign in failed", err);
    }
  };

  const handleAppleSignIn = () => {
    alert("Apple sign in clicked");
  };

  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     // User is already logged in → skip login UI
  //     try {
  //       const exp = Number(localStorage.getItem("tokenExp"));
  //       const at =
  //         localStorage.getItem("hotelmateTokens") ||
  //         localStorage.getItem("accessToken");
  //       const now = Math.floor(Date.now() / 1000);
  //       if (at && exp && exp > now) {
  //         router.replace("/dashboard");
  //       }
  //     } catch {}
  //   }
  // }, [router]);

  return (
    <div
      className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-black text-white notranslate"
      translate="no"
    >
      {/* Left Panel */}
      <div className="flex flex-col justify-center items-center px-6 md:px-16 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 text-4xl font-semibold mb-6">
            <img
              src="/app-icon.png"
              alt="Hotel Mate Logo"
              className="h-12 w-12"
            />
            Hotel Mate
          </div>

          <Card className="bg-black border border-gray-700 text-white shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold mb-1 text-white text-center">
                {welcomeBackText}
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm mb-4">
                {enterCredentialsText}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 mb-2">
                <div>
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-1 text-sm font-medium text-white mb-1"
                  >
                    <Mail className="h-4 w-4" />
                    {emailText}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="bg-zinc-900 text-white border border-gray-600 rounded-md px-4 py-2"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="password"
                    className="flex items-center gap-1 text-sm font-medium text-white mb-1"
                  >
                    <Lock className="h-4 w-4" />
                    {passwordText}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="bg-zinc-900 text-white border border-gray-600 rounded-md px-4 py-2"
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute top-2 right-3 text-gray-500"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* {error && <p className="text-sm text-red-500 mb-2">{error}</p>} */}

                <div className="flex items-center justify-between">
                  <label
                    htmlFor="rememberMe"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="relative w-5 h-5">
                      <input
                        id="rememberMe"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="appearance-none w-full h-full rounded-sm border border-gray-400 bg-transparent checked:bg-black"
                      />
                      {rememberMe && (
                        <span
                          className="absolute inset-0 flex items-center justify-center text-white text-[14px] font-extrabold pointer-events-none"
                          style={{ lineHeight: "1" }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-white">{rememberMeText}</span>
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-sm text-white hover:underline"
                  >
                    {forgotPasswordText}
                  </Link>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full bg-white text-black font-semibold py-2 rounded-md hover:bg-gray-200 transition"
                  disabled={loading}
                >
                  {loading ? "Processing..." : signInText}
                </Button>
                <p className="text-sm text-center text-gray-300">
                  {dontHaveAccountText}{" "}
                  <Link
                    href="/signup"
                    className="text-white font-medium hover:underline"
                  >
                    {signUpText}
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>

          {/* <div className="mt-6 text-center">
            <p className="mb-4 text-sm text-gray-600">{orContinueWithText}</p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleGoogleSignIn}
                className="flex-1 bg-white text-black border border-gray-300 hover:bg-gray-100"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="h-5 w-5 mr-2"
                />
                Google
              </Button>
              <Button
                onClick={handleAppleSignIn}
                className="flex-1 bg-white text-black border border-gray-300 hover:bg-gray-100"
              >
                <img src="/apple-logo-black.svg" alt="Apple" className="h-5 w-5 mr-2" />
                Apple ID
              </Button>
            </div>
          </div> */}
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden md:block">
        <AnimatedGradientBackground
          /* tweak palette/angle/speed as desired */
          colors={["#0ea5e9", "#8b5cf6", "#ef4444", "#10b981", "#f59e0b"]}
          angle={-35}
          speed={22}
          className="w-full h-full min-h-screen flex items-center justify-center text-white"
        >
          <div className="px-8 py-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-4 text-4xl font-semibold">
              <img
                src="/app-icon.png"
                alt="Hotel Mate Logo"
                className="h-10 w-10"
              />
              Hotel Mate
            </div>
            <p className="mb-8 text-sm opacity-90">
              Simple Way to Manage Your Property
            </p>

            <div className="z-10 mt-6">
              <QRLoginComponent
                onLoginSuccess={() => {
                  localStorage.setItem("qrLogin", "true");
                  router.push("/dashboard");
                }}
              />
            </div>
          </div>
        </AnimatedGradientBackground>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, Check } from "lucide-react";
import dynamic from "next/dynamic";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/redux/store";

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
  userMasAuth, 
  selectUserMasAuthLoading, 
  selectUserMasAuthError, 
  selectUserMasAuthSuccess, 
  selectUserMasAuthData,
  clearUserMasAuth
} from "@/redux/slices/userMasAuthSlice";



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
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const loading = useSelector(selectUserMasAuthLoading);
  const error = useSelector(selectUserMasAuthError);
  const success = useSelector(selectUserMasAuthSuccess);
  const authData = useSelector(selectUserMasAuthData);

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [hotelCode, setHotelCode] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const welcomeBackText = useTranslatedText("Welcome back");
  const enterCredentialsText = useTranslatedText(
    "Enter your credentials to access your account"
  );
  // const emailText = useTranslatedText("Email");
  const passwordText = useTranslatedText("Password");
  const rememberMeText = useTranslatedText("Remember me");
  const forgotPasswordText = useTranslatedText("Forgot password?");
  const signInText = useTranslatedText("Sign in");
  const dontHaveAccountText = useTranslatedText("New to Hotel Mate? ");
  const signUpText = useTranslatedText("Create your property");
  const orContinueWithText = useTranslatedText("Or continue with");

  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    const savedPassword = localStorage.getItem("rememberedPassword");
    const savedRemember = localStorage.getItem("rememberMe") === "true";

    if (savedRemember && savedUsername && savedPassword) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
    
    // Set default hotel code if not already set
    if (!hotelCode) {
      setHotelCode("1097");
    }
  }, []);

  // Handle successful authentication
  useEffect(() => {
    if (success && authData) {
      // // Store authentication data
      // localStorage.setItem("authToken", authData.accessToken || authData.token || "");
      // if (authData.refreshToken) {
      //   localStorage.setItem("refreshToken", authData.refreshToken);
      // }
      if (authData.user) {
        localStorage.setItem("userData", JSON.stringify(authData.user));
      }
      
      // Store hotel code
      const finalHotelCode = hotelCode || "1097";
      localStorage.setItem("hotelCode", finalHotelCode);
      
      // Set up selectedProperty for useClientStorage hook
      const selectedProperty = {
        id: finalHotelCode,
        name: "Hotel Property",
        code: finalHotelCode
      };
      localStorage.setItem("selectedProperty", JSON.stringify(selectedProperty));
      
      // Remember credentials if checkbox is checked
      if (rememberMe) {
        localStorage.setItem("rememberedUsername", username);
        localStorage.setItem("rememberedPassword", password);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedUsername");
        localStorage.removeItem("rememberedPassword");
        localStorage.setItem("rememberMe", "false");
      }
      
      // Navigate to dashboard
      router.push("/dashboard");
    }
  }, [success, authData, hotelCode, rememberMe, username, password, router]);

  // Clear auth state on unmount or when starting new authentication
  useEffect(() => {
    return () => {
      if (success || error) {
        dispatch(clearUserMasAuth());
      }
    };
  }, [success, error, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      return;
    }

    // Clear any previous auth state
    dispatch(clearUserMasAuth());
    
    // Dispatch the authentication action 
    dispatch(userMasAuth({
      username: username,
      password: password,
      hotelCode: hotelCode,
    }));
  };



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
              src="https://citrus-internal.s3.us-east-1.amazonaws.com/citrus_logo_w.png"
              alt="Hotel Mate Logo"
              className="h-auto w-[13rem]"
            />
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
                    htmlFor="hotelCode"
                    className="flex items-center gap-1 text-sm font-medium text-white mb-1"
                  >
                    <Check className="h-4 w-4" />
                    Hotel Code
                  </Label>
                  <Input
                    id="hotelCode"
                    type="text"
                    value={hotelCode}
                    onChange={(e) => setHotelCode(e.target.value)}
                    placeholder="Enter your hotel code"
                    required
                    className="bg-zinc-900 text-white border border-gray-600 rounded-md px-4 py-2"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="username"
                    className="flex items-center gap-1 text-sm font-medium text-white mb-1"
                  >
                    <Mail className="h-4 w-4" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
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

                {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

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
          <div className="flex justify-between px-4 pt-2">
            <div />
            <p className="text-xs">V.25.10.07</p>
          </div>
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
              src="https://citrus-internal.s3.us-east-1.amazonaws.com/citrus_logo.png"
              alt="Hotel Mate Logo"
              className="h-auto w-[13rem]"
            />
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

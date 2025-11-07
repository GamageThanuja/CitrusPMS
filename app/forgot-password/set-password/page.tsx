"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function ForgotPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  const rawEmail = searchParams?.get("email") ?? "";
  const rawToken = searchParams?.get("token") ?? "";

  const email = decodeURIComponent(rawEmail);
  const token = decodeURIComponent(rawToken).replace(/ /g, "+");

  console.log("Decoded token:", token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!email || !token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/Auth/update-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: email,
          token: token,
          password: password,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setError("");
      } else {
        const data = await response.json();
        setError(
          data.message || "Failed to update password. Please try again."
        );
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-center gap-2 text-4xl font-semibold mb-6">
        <img src="/app-icon.png" alt="Hotel Mate Logo" className="h-12 w-12" />
        Hotel Mate
      </div>

      <Card className="bg-black text-white border border-gray-700 shadow-xl rounded-2xl">
        {!success ? (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Set your new password
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm mb-4">
                Enter a new password to continue.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <Label
                  htmlFor="password"
                  className="flex items-center gap-1 text-sm font-medium text-white mb-1"
                >
                  <Lock className="h-4 w-4" />
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
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

                <Label
                  htmlFor="confirm-password"
                  className="flex items-center gap-1 text-sm font-medium text-white mb-1"
                >
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="bg-zinc-900 text-white border border-gray-600 rounded-md px-4 py-2"
                />

                {error && <p className="text-sm text-red-500">{error}</p>}
              </CardContent>

              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-white text-black font-semibold py-2 rounded-md hover:bg-gray-200 transition"
                  disabled={loading}
                >
                  {loading ? "Setting..." : "Set Password"}
                </Button>
              </CardFooter>
            </form>
          </>
        ) : (
          <div className="text-center px-6 py-10">
            <CheckCircle className="mx-auto w-12 h-12 text-green-600 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Password Updated</h2>
            <p className="text-gray-300">
              You have set a new password successfully. Redirecting to login...
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ForgotPasswordSetPage() {
  return (
    <div
      className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-black text-white notranslate"
      translate="no"
    >
      {/* Left Panel */}
      <div className="bg-black text-white flex flex-col justify-center items-center px-6 md:px-16 py-12">
        <Suspense fallback={<div>Loading...</div>}>
          <ForgotPasswordForm />
        </Suspense>
      </div>

      {/* Right Panel */}
      <div className="hidden md:flex flex-col justify-center items-center px-8 py-12 bg-white dark:bg-black bg-[url('/background.png')] bg-cover bg-center relative text-black dark:text-white">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(circle,rgba(0,0,0,0.05)_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>

        <div className="text-center z-10">
          <div className="flex items-center justify-center gap-2 mb-4 text-4xl font-semibold">
            <img
              src="/app-icon.png"
              alt="Hotel Mate Logo"
              className="h-10 w-10"
            />
            Hotel Mate
          </div>
          <p className="mb-8 text-sm">Simple Way to Manage Your Property</p>

          <div className="flex gap-6 flex-wrap justify-center bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-black/10">
            {/* App Store */}
            <div className="flex flex-col items-center">
              <div className="bg-white/30 dark:bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-md border border-black/10 transition hover:scale-105">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://apps.apple.com"
                  alt="App Store QR"
                  className="w-[140px] h-[140px]"
                />
              </div>
              <img
                src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                alt="Download on the App Store"
                className="h-10 mt-3"
              />
            </div>

            {/* Google Play */}
            <div className="flex flex-col items-center">
              <div className="bg-white/30 dark:bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-md border border-black/10 transition hover:scale-105">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://play.google.com"
                  alt="Google Play QR"
                  className="w-[140px] h-[140px]"
                />
              </div>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Get it on Google Play"
                className="h-10 mt-3"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

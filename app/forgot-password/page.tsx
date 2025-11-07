"use client";

import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/Auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: email,
          password: "password",
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setError("");
      } else {
        const data = await response.json();
        setError(data.message || "Failed to reset password.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-black text-white notranslate"
      translate="no"
    >
      {/* Left Panel */}
      <div className="bg-black text-white flex flex-col justify-center items-center px-6 md:px-16 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 text-4xl font-semibold mb-6">
            <img
              src="/app-icon.png"
              alt="Hotel Mate Logo"
              className="h-12 w-12"
            />
            Hotel Mate
          </div>

          <Card className="bg-black text-white border border-gray-700 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Reset your password
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm mb-4">
                Enter your email to receive a password reset link.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-1 text-sm font-medium text-white mb-1"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="bg-zinc-900 text-white border border-gray-600 rounded-md px-4 py-2"
                    disabled={loading || submitted}
                  />
                </div>

                {/* Status Messages */}
                {submitted && (
                  <p className="text-green-600 text-sm">
                    Check your inbox for reset instructions.
                  </p>
                )}
                {error && <p className="text-red-600 text-sm">{error}</p>}
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                {!submitted && (
                  <Button
                    type="submit"
                    className="w-full bg-white text-black font-semibold py-2 rounded-md hover:bg-gray-200 transition"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Send Reset Link"}
                  </Button>
                )}
                <Link
                  href="/login"
                  className="text-sm text-white hover:underline flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </CardFooter>
            </form>
          </Card>
        </div>
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

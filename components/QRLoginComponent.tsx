// components/QRLoginComponent.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { QRCode } from "react-qrcode-logo";
import { seedInitialTokens, refreshToken } from "@/lib/tokenManager";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const QRLoginComponent = ({
  onLoginSuccess,
}: {
  onLoginSuccess: (tokens: any) => void;
}) => {
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState<
    "generating" | "waiting" | "authenticated" | "expired"
  >("generating");
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [showExpiredPrompt, setShowExpiredPrompt] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasRunRef = useRef(false);
  const generatingRef = useRef(false);

  const generateQRSession = async () => {
    if (localStorage.getItem("status") === "loggedIn") return;
    const storedSessionId = sessionStorage.getItem("qr_session_id");
    if (storedSessionId && status === "waiting") {
      setSessionId(storedSessionId);
      setTimeLeft(60);
      setShowExpiredPrompt(false);
      startPolling(storedSessionId);
      const countdown = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setStatus("expired");
            setShowExpiredPrompt(true);
            sessionStorage.removeItem("qr_session_id");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return;
    }
    if (generatingRef.current) return;
    if (sessionId && status === "waiting") return;
    generatingRef.current = true;
    try {
      const response = await fetch(`${BASE_URL}/api/QrLogin/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        setTimeLeft(60);
        setShowExpiredPrompt(false);
        sessionStorage.setItem("qr_session_id", data.sessionId);
        setStatus("waiting");
        startPolling(data.sessionId);
        const countdown = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(countdown);
              if (pollIntervalRef.current)
                clearInterval(pollIntervalRef.current);
              setStatus("expired");
              setShowExpiredPrompt(true);
              sessionStorage.removeItem("qr_session_id");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        generatingRef.current = false;
      } else {
        setError("Failed to generate QR code");
        generatingRef.current = false;
      }
    } catch {
      setError("Network error occurred");
      generatingRef.current = false;
    }
  };

  const startPolling = (sessionId: string) => {
    if (localStorage.getItem("status") === "loggedIn") return;

    if (!sessionId || status === "expired") return;

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const lastStatusRef = { current: "" };

    pollIntervalRef.current = setInterval(async () => {
      if (localStorage.getItem("status") === "loggedIn") return;
      try {
        const response = await fetch(
          `${BASE_URL}/api/QrLogin/status/${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${
                localStorage.getItem("accessToken") || ""
              }`,
              Accept: "text/plain",
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.status !== lastStatusRef.current) {
            console.log(`Polling status for session ${sessionId}:`, data);
            lastStatusRef.current = data.status;
          }

          if (data.expired) {
            setStatus("expired");
            sessionStorage.removeItem("qr_session_id");
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          } else if (data.status === "authenticated") {
            setStatus("authenticated");
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            await loginWithQR(sessionId);
          }
          // If status is 'pending', do nothing (ignore and continue polling)
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    setTimeout(() => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (status === "waiting") {
        setStatus("expired");
        sessionStorage.removeItem("qr_session_id");
      }
    }, 300000);
  };

  const loginWithQR = async (sessionId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/QrLogin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const tokens = await response.json();
        seedInitialTokens(tokens.accessToken, tokens.refreshToken);
        await refreshToken();

        const payloadBase64 = tokens.accessToken.split(".")[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));

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
        localStorage.setItem("status", "loggedIn");
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }

        sessionStorage.removeItem("qr_session_id");
        onLoginSuccess(tokens);
      } else {
        setError("Login failed");
      }
    } catch {
      setError("Login error occurred");
    }
  };

  useEffect(() => {
    if (!hasRunRef.current && localStorage.getItem("status") !== "loggedIn") {
      hasRunRef.current = true;
      generateQRSession();
    }
  }, []);

  const qrValue = sessionId ? `qrlogin://${sessionId}` : "";

  return (
    <div className="qr-login-container">
      {status === "generating" && <div>Generating QR Code...</div>}

      {status === "waiting" && sessionId && (
        <div className="flex flex-col items-center bg-white/30 backdrop-blur-md rounded-xl p-6 shadow-md border border-black/10 space-y-4">
          <QRCode value={qrValue} size={180} />
          <p className="text-sm text-gray-800">
            Scan this QR code with your mobile app
          </p>
          <p className="text-xs text-gray-500">Expires in {timeLeft} seconds</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-black rounded hover:bg-gray-800 transition"
          >
            Generate New Code
          </button>
        </div>
      )}

      {status === "authenticated" && (
        <div>Authentication successful! Logging you in...</div>
      )}

      {status === "expired" && (
        <div>
          <p>QR code has expired</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 text-sm font-medium text-white bg-black rounded hover:bg-gray-800 transition"
          >
            Generate New Code
          </button>
        </div>
      )}

      {error && (
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={generateQRSession}>Retry</button>
        </div>
      )}
    </div>
  );
};

export default QRLoginComponent;

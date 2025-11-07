"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mail,
  Phone,
  Eye,
  EyeOff,
  User,
  Globe,
  Lock,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "next-themes";
import { toast } from "@/components/ui/use-toast";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import Logo from "../assets/images/HotelMate_Logo.png";
import fingerNavigation from "../assets/icons/fingernavigation.png";

// redux
import { register } from "@/redux/slices/authSlice";
import type { AppDispatch, RootState } from "@/redux/store";
import Bnb from "../assets/icons/property/bnb.png";
import HomeStay from "../assets/icons/property/homestay.png";
import Hostel from "../assets/icons/property/hostel.png";
import Hotel from "../assets/icons/property/hotel.png";
import Inn from "../assets/icons/property/inn.png";
import Resort from "../assets/icons/property/resort.png";
import RestHouse from "../assets/icons/property/restHouse.png";
import Villa from "../assets/icons/property/villa.png";
import {
  sendCustomEmail,
  selectEmailSending,
  selectEmailError,
  selectEmailLastResponse,
} from "@/redux/slices/emailSendSlice";
import VideoOverlay from "./videoOverlay";
import VideoButton from "./videoButton";
import {
  updateUserPhone,
  selectUpdateUserPhoneLoading,
  selectUpdateUserPhoneError,
  selectUpdateUserPhoneSuccess,
} from "@/redux/slices/updateUserPhoneSlice";

import { fetchEmailTemplates } from "@/redux/slices/fetchEmailTemplateSlice";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function SignupFlow() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);
  const { setTheme } = useTheme();

  const emailSending = useSelector(selectEmailSending);
  const emailError = useSelector(selectEmailError);
  const emailResp = useSelector(selectEmailLastResponse);
  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState(
    "https://scribehow.com/embed/How_To_Complete_Guest_Check-In_Process__PWh6uoISToyWmZ_QKri7rA?as=video"
  );

  const [showCoach, setShowCoach] = useState(false);

  useEffect(() => {
    // only show once per browser
    const seen = localStorage.getItem("signup_video_hint_seen");
    if (!seen) setShowCoach(true);
  }, []);

  const closeCoach = () => {
    setShowCoach(false);
    localStorage.setItem("signup_video_hint_seen", "1");
  };

  // avoid duplicate sends if the component re-renders
  const welcomeSentRef = useRef(false);

  // Force light theme (from old code)
  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  // Persist/restore step (from old code)
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("signupStep");
      if (saved !== null) {
        const val = parseInt(saved, 10);
        // old behavior: skip 0 on reloads; we keep the exact value to match new UI count
        return val;
      }
    }
    return 0; // Welcome
  });
  useEffect(() => {
    localStorage.setItem("signupStep", String(currentStep));
  }, [currentStep]);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    country: "",
    phone: "",
    email: "",
    emailOtp: "",
    phoneOtp: "",
    password: "",
    confirmPassword: "",
  });

  // form field refs used in old flow (kept for parity)
  const emailOtpRef = useRef<HTMLInputElement>(null);
  const phoneOtpRef = useRef<HTMLInputElement>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [countryList, setCountryList] = useState<
    { countryId: number; country: string; dialCode: string; flagCode: string }[]
  >([]);

  // --- LocalStorage keys
  const LS = {
    STEP: "signupStep",
    EMAIL: "signup_email",
    PHONE: "signup_phone",
    EMAIL_OTP: "signup_email_otp",
    PHONE_OTP: "signup_phone_otp",

    REG_DONE: "signup_reg_done", // boolean (string "1"/"0")
    EMAIL_OTP_SENT: "signup_email_otp_sent", // boolean
    EMAIL_VERIFIED: "signup_email_verified", // boolean
    PHONE_UPDATED: "signup_phone_updated", // boolean
    PHONE_OTP_SENT: "signup_phone_otp_sent", // boolean
    PHONE_VERIFIED: "signup_phone_verified", // boolean
  };

  // small LS utils
  const setLS = (k: string, v: string | number | boolean) =>
    localStorage.setItem(k, String(v));
  const getLS = (k: string) =>
    typeof window !== "undefined" ? localStorage.getItem(k) : null;
  const getBool = (k: string) => getLS(k) === "1";

  // Fetch countries (from both versions)
  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch(`${BASE_URL}/api/SignUp/get-all-countries`);
        if (!res.ok) throw new Error("Failed to fetch countries");
        setCountryList(await res.json());
      } catch (err) {
        console.error(err);
      }
    }
    fetchCountries();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const email = getLS(LS.EMAIL) ?? "";
    const phone = getLS(LS.PHONE) ?? "";
    const emailOtp = getLS(LS.EMAIL_OTP) ?? "";
    const phoneOtp = getLS(LS.PHONE_OTP) ?? "";

    setFormData((prev) => ({
      ...prev,
      email,
      phone,
      emailOtp,
      phoneOtp,
    }));

    // decide step
    const regDone = getBool(LS.REG_DONE);
    const emailVerified = getBool(LS.EMAIL_VERIFIED);
    const phoneVerified = getBool(LS.PHONE_VERIFIED);

    // prefer explicit saved step if present; otherwise infer
    const savedStepStr = getLS(LS.STEP);
    let step = savedStepStr ? Math.max(0, parseInt(savedStepStr, 10)) : 0;

    if (regDone && !emailVerified) step = 4;

    // if email verified but phone not verified -> force Phone INPUT step
    if (regDone && emailVerified && !phoneVerified) step = 5;
    // if all verified but password not set, keep 7; after success you redirect anyway

    setCurrentStep(step);
  }, []);

  function problemToMessage(problem: any): string {
    if (!problem) return "Registration failed";
    if (problem.errors) {
      // Prefer specific keys
      if (
        Array.isArray(problem.errors.DuplicateUserName) &&
        problem.errors.DuplicateUserName[0]
      ) {
        return problem.errors.DuplicateUserName[0]; // "Username 'x' is already taken."
      }
      if (Array.isArray(problem.errors.Email) && problem.errors.Email[0]) {
        return problem.errors.Email[0];
      }
      // Fall back to first error array if present
      const firstKey = Object.keys(problem.errors)[0];
      if (
        firstKey &&
        Array.isArray(problem.errors[firstKey]) &&
        problem.errors[firstKey][0]
      ) {
        return problem.errors[firstKey][0];
      }
    }
    return (
      problem.title ||
      problem.detail ||
      problem.message ||
      "Registration failed"
    );
  }

  function problemTargetsEmail(problem: any): boolean {
    if (!problem?.errors) return false;
    return Boolean(
      problem.errors.DuplicateUserName ||
        problem.errors.Email ||
        Object.keys(problem.errors).some((k) =>
          k.toLowerCase().includes("email")
        )
    );
  }

  const emailTemplates = useSelector(
    (state: RootState) => state.emailTemplate.data
  ) as any[];
  const emailTemplatesLoading = useSelector(
    (state: RootState) => state.emailTemplate.loading
  );

  // Fetch email templates on mount
  useEffect(() => {
    dispatch(fetchEmailTemplates() as any);
  }, [dispatch]);
  function renderTemplate(body: string, vars: Record<string, string>) {
    let out = body || "";
    // support {{var}} or [[var]] or {var}
    Object.entries(vars).forEach(([k, v]) => {
      const patterns = [
        new RegExp(`{{\\s*${k}\\s*}}`, "g"),
        new RegExp(`\\[\\[\\s*${k}\\s*\\]\\]`, "g"),
        new RegExp(`{\\s*${k}\\s*}`, "g"),
        new RegExp(`%%\\s*${k}\\s*%%`, "g"),
      ];
      patterns.forEach((rx) => (out = out.replace(rx, v)));
    });
    return out;
  }
  function getDynamicWelcomeEmailHTML(params: {
    fullName: string;
    email: string;
  }) {
    try {
      const tpl = (emailTemplates || []).find(
        (t) => (t?.templateName || "").toLowerCase() === "welcome"
      );
      if (
        tpl &&
        typeof tpl.emailBody === "string" &&
        tpl.emailBody.trim().length > 0
      ) {
        return renderTemplate(tpl.emailBody, {
          fullName: params.fullName,
          email: params.email,
        });
      }
    } catch {}
    return "";
  }

  // === Validators (use old rules) ===
  const validateField = (field: string, value: string) => {
    let message = "";
    switch (field) {
      case "fullName":
        if (!value.trim()) message = "Full name is required";
        else if (value.trim().length < 2)
          message = "Name must be at least 2 characters";
        break;
      case "email":
        if (!/^\S+@\S+\.\S+$/.test(value)) message = "Invalid email address";
        break;
      case "phone":
        if (!/^\+\d{7,15}$/.test(value))
          message = "Phone must be + and 7–15 digits";
        break;
      case "password":
        if (value.length < 8) message = "At least 8 characters";
        else if (!/\d/.test(value)) message = "Must include a number";
        else if (!/\W/.test(value))
          message = "Must include a special character";
        break;
      case "confirmPassword":
        if (value !== formData.password) message = "Passwords do not match";
        break;
      case "emailOtp":
        if (!/^\d{4}$/.test(value)) message = "Please enter a 4-digit code";
        break;
      case "phoneOtp":
        if (!/^\d{4}$/.test(value)) message = "Please enter a 4-digit code";
        break;
      default:
        break;
    }
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
    return !message;
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // persist key fields
    if (field === "email") setLS(LS.EMAIL, value);
    if (field === "phone") setLS(LS.PHONE, value);
    if (field === "emailOtp") setLS(LS.EMAIL_OTP, value);
    if (field === "phoneOtp") setLS(LS.PHONE_OTP, value);

    validateField(field, value);
  };

  const handleRegister = async () => {
    setError(null);
    setLoading(true);

    // guard same as before...
    if (
      !formData.fullName.trim() ||
      !formData.country ||
      fieldErrors.email ||
      !formData.email
    ) {
      setError("Please fix errors before continuing.");
      setLoading(false);
      return false;
    }

    try {
      // ✅ If already registered (e.g., returning after refresh), skip hitting the API again
      if (getBool(LS.REG_DONE)) {
        return true;
      }

      const result = await dispatch(
        register({
          fullName: formData.fullName,
          username: formData.email, // email as username
          country: formData.country,
          // phone is NOT part of register now
          email: formData.email,
          password: "HOTELmate123$",
          role: "Owner",
          authenticator: 0,
          authenticatorUUID: "",
          isUserVerified: false,
        })
      );

      if (register.rejected.match(result)) {
        const problem = result.payload as any;
        const msg = problemToMessage(problem);

        // If server complains about duplicate username/email, mark the email field
        if (problemTargetsEmail(problem)) {
          setFieldErrors((prev) => ({ ...prev, email: msg }));
        }

        setError(msg);
        return false; // block moving to next step
      }

      if (!register.fulfilled.match(result)) {
        console.log("Registration error:", result);
        throw new Error(auth.error || "Registration failed");
      }

      // ✅ Persist registration state & email, and auto-send Email OTP
      setLS(LS.REG_DONE, 1);
      setLS(LS.EMAIL, formData.email);

      // Immediately create/send email verification (use your resend endpoint)
      try {
        const res = await fetch(`${BASE_URL}/api/SignUp/resend-email-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        });
        if (!res.ok) {
          // try to read text/json for better message, but don't block user
          let msg = "Failed to send verification code";
          try {
            const data = await res.json();
            msg = data?.message || msg;
          } catch {}
          // surface but continue
          toast({
            title: "Email OTP",
            description: msg,
            variant: "destructive",
          });
          setLS(LS.EMAIL_OTP_SENT, 0);
        } else {
          setLS(LS.EMAIL_OTP_SENT, 1);
        }
      } catch {
        setLS(LS.EMAIL_OTP_SENT, 0);
      }

      return true;
    } catch (err: any) {
      if (
        err.message?.includes("already registered") ||
        auth.error?.includes("already registered")
      ) {
        // Treat as registered so user can continue to OTP
        setLS(LS.REG_DONE, 1);
        return true;
      }
      setError(err.message || auth.error || "Registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setError(null);
    setLoading(true);
    if (!validateField("emailOtp", formData.emailOtp)) {
      setLoading(false);
      return false;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/SignUp/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: formData.emailOtp }),
      });
      console.log(
        "verify-email-otp response:",
        res,
        formData.email,
        formData.emailOtp
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Email verification failed");
      }

      setLS(LS.EMAIL_VERIFIED, 1);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmailOTP = async () => {
    setError(null);
    setLoading(true);

    setFormData((p) => ({ ...p, emailOtp: "" }));
    setLS(LS.EMAIL_OTP, "");
    try {
      const res = await fetch(`${BASE_URL}/api/SignUp/resend-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to resend email OTP");
      }
      setLS(LS.EMAIL_OTP_SENT, 1);
      toast({
        title: "Resent email",
        description: `A new code was sent to ${formData.email}`,
      });
    } catch (err: any) {
      setError(err.message);
      setLS(LS.EMAIL_OTP_SENT, 0);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneVerification = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/api/SignUp/send-phone-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: formData.phone,
            email: formData.email,
            verificationCode: "",
          }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send phone OTP");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    setError(null);
    setLoading(true);
    if (!validateField("phoneOtp", formData.phoneOtp)) {
      setLoading(false);
      return false;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/SignUp/verify-phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formData.phone,
          email: formData.email,
          otp: formData.phoneOtp,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Phone verification failed");
      }
      setLS(LS.PHONE_VERIFIED, 1);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setError(null);
    setLoading(true);
    if (
      !validateField("password", formData.password) ||
      !validateField("confirmPassword", formData.confirmPassword)
    ) {
      setLoading(false);
      return false;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/SignUp/update-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          oldPassword: "HOTELmate123$",
          newPassword: formData.password,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update password");
      }

      if (!welcomeSentRef.current) {
        welcomeSentRef.current = true;

        const htmlBody = getDynamicWelcomeEmailHTML({
          fullName: formData.fullName,
          email: formData.email,
        });

        if (!htmlBody || htmlBody.trim().length === 0) {
          // as an extreme fallback
          return true;
        }

        dispatch(
          sendCustomEmail({
            toEmail: formData.email,
            subject: "Welcome to HOTELmate ✨",
            body: htmlBody,
            isHtml: true,
            senderName: "HOTELMATE",
            // Optional:
            // ccEmails: "team@hotelmate.app",
            // bccEmails: "audit@hotelmate.app",
            // replyToEmail: "support@hotelmate.app",
            // priority: 0,
          })
        )
          .unwrap()
          .then(() => {
            // optional toast, we also show a global one in the effect below
          })
          .catch(() => {
            // swallow here; global effect shows error
          });
      }

      // confetti + toast (old behavior)
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast({
        title: "Account created successfully!",
        description: "Welcome to our platform!",
      });
      [
        LS.REG_DONE,
        LS.EMAIL_OTP_SENT,
        LS.EMAIL_VERIFIED,
        LS.PHONE_UPDATED,
        LS.PHONE_OTP_SENT,
        LS.PHONE_VERIFIED,
        LS.EMAIL_OTP,
        LS.PHONE_OTP,
        LS.STEP,
      ].forEach((k) => localStorage.removeItem(k));
      router.replace("/create-property"); // redirect to create-property
      return true; // go to success
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  function OtpBoxes({
    value,
    onChange,
    length = 4,
    onComplete,
    autoFocus = true,
    className = "",
    inputRefExternal,
  }: {
    value: string; // controlled value: "12", "1234"
    onChange: (next: string) => void; // update state in parent
    length?: number;
    onComplete?: (code: string) => void;
    autoFocus?: boolean;
    className?: string;
    inputRefExternal?: React.RefObject<HTMLInputElement>;
  }) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Focus the hidden input so typing goes there
    useEffect(() => {
      if (!autoFocus) return;
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }, [autoFocus]);

    const clampDigits = (s: string) => s.replace(/\D/g, "").slice(0, length);

    const handleInput = (raw: string) => {
      const next = clampDigits(raw);
      onChange(next);
      if (next.length === length) onComplete?.(next);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Let the native input handle typing/backspace. We only normalize onChange.
      // Prevent Enter from submitting an outer form accidentally.
      if (e.key === "Enter") e.preventDefault();
    };

    // Click anywhere on the boxes to focus the real input
    const focusInput = () => inputRef.current?.focus();

    const chars = Array.from({ length }, (_, i) => value[i] ?? "");
    const activeIndex = Math.min(value.length, length - 1);

    return (
      <div className={className}>
        {/* Hidden real input (captures typing & paste) */}
        <input
          ref={(el) => {
            inputRef.current = el;
            if (inputRefExternal) (inputRefExternal as any).current = el; // NEW
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          // Visually hidden but focusable
          style={{
            position: "absolute",
            opacity: 0,
            width: 1,
            height: 1,
            pointerEvents: "none",
          }}
          aria-label="One-time passcode"
        />

        {/* Visual boxes */}
        <div
          className="flex justify-center gap-3"
          onClick={focusInput}
          role="group"
          aria-label="OTP input"
        >
          {chars.map((ch, i) => {
            const isActive = i === activeIndex && value.length < length;
            return (
              <div
                key={i}
                className={[
                  "w-14 h-14 rounded-xl border-2 text-xl font-bold",
                  "flex items-center justify-center select-none",
                  "bg-white text-black border-slate-200",
                  isActive ? "ring-2 ring-sky-500 border-sky-500" : "",
                ].join(" ")}
              >
                {ch || ""}
              </div>
            );
          })}
        </div>

        {/* Make the whole area keyboard-focusable (optional) */}
        <div
          tabIndex={0}
          onFocus={focusInput}
          style={{ outline: "none" }}
          aria-hidden
        />
      </div>
    );
  }

  function getWelcomeEmailHTML(params: { fullName: string; email: string }) {
    const { fullName, email } = params;
    // 🔁 Replace this with your full HTML. Keep it a string.
    return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <title>Welcome to HotelMate - Your Journey Begins</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

  <style>
    @media screen and (max-width: 620px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .hero-text { font-size: 32px !important; line-height: 38px !important; }
      .hero-subtitle { font-size: 16px !important; }
      .section-padding { padding: 32px 20px !important; }
      .feature-grid { display: block !important; }
      .feature-item { width: 100% !important; margin-bottom: 16px !important; }
    }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc;">

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8fafc;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <center>

          <!-- Main Container -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:0; overflow:hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
            
            <!-- Hero Section with Background Image -->
            <tr>
              <td style="position:relative; background-image: url('https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1200'); background-size: cover; background-position: center; padding: 60px 40px; text-align: center;" class="section-padding">
                <!-- Dark overlay -->
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.75) 100%);"></div>
                
                <table role="presentation" width="100%" style="position: relative; z-index: 2;">
                  <tr>
                    <td align="center">
                      <!-- Logo -->
                      <img src="https://hotelmate.co.uk/images/hotelmate_logo.png" width="180" alt="HotelMate Logo" style="display:block; border:0; margin-bottom: 32px;">
                      
                      <!-- Hero Text -->
                      <h1 style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 42px; font-weight: 300; color: #ffffff; margin: 0 0 16px 0; letter-spacing: 2px; line-height: 48px;" class="hero-text">
                        HELLO<br>
                        WELCOME TO<br>
                        <span style="font-weight: 700;">HOTELMATE</span>
                      </h1>
                      
                      <!-- Subtitle -->
                      <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 18px; color: #cbd5e1; margin: 0 0 32px 0; max-width: 480px; line-height: 28px;" class="hero-subtitle">
                        Your account has been successfully created. Welcome to the future of hotel management where efficiency meets excellence.
                      </p>
                      
                      <!-- CTA Button -->
                      <a href="https://web.hotelmate.co.uk" target="_blank" rel="noopener noreferrer"
                         style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; padding: 16px 32px; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); transition: all 0.3s ease;">
                        ACCESS YOUR DASHBOARD
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Features Section with Background -->
            <tr>
              <td style="background-image: url('https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1200'); background-size: cover; background-position: center; padding: 60px 40px; position: relative;" class="section-padding">
                <!-- Overlay -->
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.9) 100%);"></div>
                
                <table role="presentation" width="100%" style="position: relative; z-index: 2;">
                  <tr>
                    <td align="center">
                      <h2 style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 32px; font-weight: 300; color: #0f172a; margin: 0 0 16px 0; letter-spacing: 1px;">
                        YOUR COMPLETE TOOLKIT
                      </h2>
                      <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #64748b; margin: 0 0 40px 0;">
                        Six powerful modules designed to revolutionize your hotel operations
                      </p>
                      
                      <!-- Features Grid -->
                      <table role="presentation" width="100%" class="feature-grid">
                        <tr>
                          <td width="50%" style="padding: 0 8px 16px 0;" class="feature-item">
                            <div style="background: rgba(255, 255, 255, 0.9); padding: 24px; border-radius: 12px; border-left: 4px solid #3b82f6; backdrop-filter: blur(10px);">
                              <h3 style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;">
                                🏨 Front Desk Management
                              </h3>
                              <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #475569; margin: 0; line-height: 20px;">
                                Streamline check-ins, check-outs, and guest services with our intuitive front desk solution.
                              </p>
                            </div>
                          </td>
                          <td width="50%" style="padding: 0 0 16px 8px;" class="feature-item">
                            <div style="background: rgba(255, 255, 255, 0.9); padding: 24px; border-radius: 12px; border-left: 4px solid #10b981; backdrop-filter: blur(10px);">
                              <h3 style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;">
                                📱 Guest Self Services
                              </h3>
                              <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #475569; margin: 0; line-height: 20px;">
                                Empower guests with mobile check-in, room service requests, and self-service options.
                              </p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td width="50%" style="padding: 0 8px 16px 0;" class="feature-item">
                            <div style="background: rgba(255, 255, 255, 0.9); padding: 24px; border-radius: 12px; border-left: 4px solid #f59e0b; backdrop-filter: blur(10px);">
                              <h3 style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;">
                                📅 Reservations System
                              </h3>
                              <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #475569; margin: 0; line-height: 20px;">
                                Manage bookings, availability, and guest information with our comprehensive reservation system.
                              </p>
                            </div>
                          </td>
                          <td width="50%" style="padding: 0 0 16px 8px;" class="feature-item">
                            <div style="background: rgba(255, 255, 255, 0.9); padding: 24px; border-radius: 12px; border-left: 4px solid #8b5cf6; backdrop-filter: blur(10px);">
                              <h3 style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;">
                                🧹 Housekeeping Management
                              </h3>
                              <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #475569; margin: 0; line-height: 20px;">
                                Coordinate cleaning schedules, track room status, and ensure optimal guest satisfaction.
                              </p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td width="50%" style="padding: 0 8px 0 0;" class="feature-item">
                            <div style="background: rgba(255, 255, 255, 0.9); padding: 24px; border-radius: 12px; border-left: 4px solid #ef4444; backdrop-filter: blur(10px);">
                              <h3 style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;">
                                💳 Point of Sales
                              </h3>
                              <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #475569; margin: 0; line-height: 20px;">
                                Process payments, manage restaurant orders, and handle all sales transactions seamlessly.
                              </p>
                            </div>
                          </td>
                          <td width="50%" style="padding: 0 0 0 8px;" class="feature-item">
                            <div style="background: rgba(255, 255, 255, 0.9); padding: 24px; border-radius: 12px; border-left: 4px solid #06b6d4; backdrop-filter: blur(10px);">
                              <h3 style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;">
                                🌐 Channel Manager
                              </h3>
                              <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #475569; margin: 0; line-height: 20px;">
                                Sync inventory and rates across all booking platforms to maximize your online presence.
                              </p>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Call to Action Section -->
            <tr>
              <td style="background-image: url('https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg?auto=compress&cs=tinysrgb&w=1200'); background-size: cover; background-position: center; padding: 60px 40px; text-align: center; position: relative;" class="section-padding">
                <!-- Dark overlay -->
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%);"></div>
                
                <table role="presentation" width="100%" style="position: relative; z-index: 2;">
                  <tr>
                    <td align="center">
                      <h2 style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 28px; font-weight: 300; color: #ffffff; margin: 0 0 16px 0; letter-spacing: 1px;">
                        READY TO TRANSFORM YOUR HOTEL?
                      </h2>
                      <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #cbd5e1; margin: 0 0 32px 0; max-width: 480px; line-height: 24px;">
                        Your journey to operational excellence starts now. Access your dashboard and discover the power of modern hotel management.
                      </p>
                      
                      <a href="https://web.hotelmate.co.uk" target="_blank" rel="noopener noreferrer"
                         style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; padding: 16px 32px; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); margin-right: 16px;">
                        GET STARTED
                      </a>
                      
                      <a href="mailto:support@hotelmate.co.uk"
                         style="background: transparent; color: #ffffff; text-decoration: none; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; padding: 16px 32px; border-radius: 50px; display: inline-block; border: 2px solid rgba(255, 255, 255, 0.3);">
                        NEED HELP?
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Signature Section -->
            <tr>
              <td style="padding: 40px; text-align: center; background-color: #ffffff;">
                <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #475569; margin: 0 0 16px 0;">
                  Thank you for choosing HotelMate!
                </p>
                <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
                  HotelMate Team
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #0f172a; padding: 32px 40px; text-align: center;">
                <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #64748b; margin-bottom: 8px;">
                  © 2025 HotelMate. All rights reserved.
                </div>
                <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #475569;">
                  Colombo, Sri Lanka
                </div>
                
                <!-- Social Links -->
                <table role="presentation" style="margin: 20px auto 0 auto;">
                  <tr>
                    <td style="padding: 0 8px;">
                      <a href="https://hotelmate.co.uk" target="_blank" style="color: #64748b; text-decoration: none; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                        VISIT WEBSITE
                      </a>
                    </td>
                    <td style="padding: 0 8px; color: #475569;">•</td>
                    <td style="padding: 0 8px;">
                      <a href="mailto:support@hotelmate.co.uk" style="color: #64748b; text-decoration: none; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                        SUPPORT
                      </a>
                    </td>
                    <td style="padding: 0 8px; color: #475569;">•</td>
                    <td style="padding: 0 8px;">
                      <a href="https://hotelmate.co.uk/help" target="_blank" style="color: #64748b; text-decoration: none; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                        HELP CENTER
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

        </center>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  }

  // Auto actions when entering Phone-OTP step
  useEffect(() => {
    if (currentStep !== 6) return;

    (async () => {
      try {
        // ✅ Update phone on backend (only once)
        if (!getBool(LS.PHONE_UPDATED)) {
          const r = await dispatch(
            updateUserPhone({
              email: formData.email,
              phoneNumber: formData.phone,
            })
          );
          if (updateUserPhone.fulfilled.match(r)) {
            setLS(LS.PHONE_UPDATED, 1);
          } else {
            // show but continue to allow OTP attempt later
            const msg =
              (r.payload as any)?.detail ||
              r.error?.message ||
              "Failed to update phone";
            toast({
              title: "Phone save failed",
              description: msg,
              variant: "destructive",
            });
          }
        }

        // ✅ Send phone OTP (only once per visit; you can allow resend separately)
        if (!getBool(LS.PHONE_OTP_SENT)) {
          const res = await fetch(
            `${BASE_URL}/api/SignUp/send-phone-verification`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phoneNumber: formData.phone,
                email: formData.email,
                verificationCode: "",
              }),
            }
          );
          setLS(LS.PHONE_OTP_SENT, res.ok ? 1 : 0);
          if (!res.ok) {
            let msg = "Failed to send phone OTP";
            try {
              const data = await res.json();
              msg = data?.message || msg;
            } catch {}
            toast({
              title: "Phone OTP",
              description: msg,
              variant: "destructive",
            });
          }
        }
      } catch {}
      // focus first box
      setTimeout(() => phoneOtpRef.current?.focus(), 0);
    })();
  }, [currentStep, dispatch, formData.email, formData.phone]);

  useEffect(() => {
    if (emailResp?.success) {
      toast({
        title: "Welcome email sent",
        description: `We emailed ${formData.email}`,
      });
    } else if (emailError) {
      toast({
        title: "Email send failed",
        description: emailError,
        variant: "destructive",
      });
      // Allow re-try on next attempt
      welcomeSentRef.current = false;
    }
  }, [emailResp, emailError]);

  // === Steps UI (unchanged visually) ===
  const steps = [
    // 0: Welcome
    {
      title: "Welcome! Let's get you started",
      subtitle: "Create your property in just a few simple steps",
      content: (
        <div className="text-center space-y-8 py-8">
          <div className="mx-auto w-24 h-24  rounded-full flex items-center justify-center">
            <Image
              src={Logo}
              alt="Logo"
              className="w-24 h-24"
              width={48}
              height={48}
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">
              Join thousands of users
            </h2>
            <p className="text-slate-600 max-w-sm mx-auto">
              Experience the best hotel management platform. Let's create
              something amazing together.
            </p>
          </div>
        </div>
      ),
    },
    // 1: Full Name
    {
      title: "What's your  name?",
      subtitle: "We'd love to know what to call you",
      content: (
        <div className="space-y-6 py-4">
          <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-teal-600" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-slate-700 font-medium">
              Your Name
            </Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => updateFormData("fullName", e.target.value)}
              className="h-12 text-lg border-2 border-slate-200 focus:border-sky-400 rounded-xl bg-white text-black"
              onBlur={(e) => validateField("fullName", e.target.value)}
            />
            {fieldErrors.fullName && (
              <p className="text-red-500 text-sm">{fieldErrors.fullName}</p>
            )}
          </div>
        </div>
      ),
    },

    // 2: Country
    {
      title: "Where are you from?",
      subtitle: "Select your country",
      content: (
        <div className="space-y-6 py-4">
          <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <Globe className="w-8 h-8 text-teal-600" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Country</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => {
                updateFormData("country", value);
                const c = countryList.find((x) => x.country === value);
                if (c) {
                  // prefix phone with dial code like old code
                  updateFormData("phone", `${c.dialCode}`);
                }
              }}
            >
              <SelectTrigger className="h-12 text-lg border-2 border-slate-200 focus:border-sky-400 rounded-xl bg-white text-black">
                <SelectValue
                  placeholder="Select your country"
                  className="bg-white text-black"
                />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                {countryList.map((country) => (
                  <SelectItem key={country.countryId} value={country.country}>
                    <div className="flex items-center gap-2">
                      <span>{country.flagCode}</span>
                      <span>{country.country}</span>
                      <span className="text-slate-500">{country.dialCode}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    // 3: Phone

    // 4: Email
    {
      title: "What's your email address?",
      subtitle: "We'll send you a verification code",
      content: (
        <div className="space-y-6 py-4">
          <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-teal-600" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              onBlur={(e) => validateField("email", e.target.value)}
              className="h-12 text-lg border-2 border-slate-200 focus:border-sky-400 bg-white text-black rounded-xl"
            />
            {/* {fieldErrors.email && (
              <p className="text-red-500 text-sm">{fieldErrors.email}</p>
            )} */}
          </div>
        </div>
      ),
    },
    // 5: Email Verification
    {
      title: "Check your email",
      subtitle: `We sent a code to ${formData.email}`,
      content: (
        <div className="space-y-6 py-4">
          <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-teal-600" />
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-slate-600">
                Enter the 4-digit code we sent to
              </p>
              <p className="font-medium text-slate-800">{formData.email}</p>
            </div>
            <OtpBoxes
              value={formData.emailOtp}
              onChange={(next) => updateFormData("emailOtp", next)}
              onComplete={() => nextStep()}
              inputRefExternal={emailOtpRef}
            />
            {fieldErrors.emailOtp && (
              <p className="text-red-500 text-sm text-center">
                {fieldErrors.emailOtp}
              </p>
            )}
            {/* keep UI minimal; still allow resending via a subtle link */}
            <div className="text-center">
              <Button
                variant="link"
                type="button"
                onClick={handleResendEmailOTP}
                disabled={loading}
              >
                Resend code
              </Button>
            </div>
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </div>
        </div>
      ),
    },
    // 6: Phone Verification
    {
      title: "What's your phone number?",
      subtitle: "We'll use this to verify your account",
      content: (
        <div className="space-y-6 py-4">
          <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <Phone className="w-8 h-8 text-teal-600" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-700 font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => updateFormData("phone", e.target.value)}
              onBlur={(e) => validateField("phone", e.target.value)}
              className="h-12 text-lg border-2 border-slate-200 focus:border-sky-400 rounded-xl bg-white text-black"
            />
            {fieldErrors.phone && (
              <p className="text-red-500 text-sm">{fieldErrors.phone}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Verify your phone",
      subtitle: `We sent a code to ${formData.phone}`,
      content: (
        <div className="space-y-6 py-4">
          <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <Phone className="w-8 h-8  bg-white text-black" />
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-slate-600">
                Enter the 4-digit code we sent to
              </p>
              <p className="font-medium text-slate-800">{formData.phone}</p>
            </div>
            <OtpBoxes
              value={formData.phoneOtp}
              onChange={(next) => updateFormData("phoneOtp", next)}
              onComplete={() => nextStep()}
              inputRefExternal={phoneOtpRef}
            />
            {fieldErrors.phoneOtp && (
              <p className="text-red-500 text-sm text-center">
                {fieldErrors.phoneOtp}
              </p>
            )}
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </div>
        </div>
      ),
    },
    // 7: Password
    {
      title: "Create a secure password",
      subtitle: "Choose a strong password to protect your account",
      content: (
        <div className="space-y-6 py-4">
          <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-teal-600" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  onBlur={(e) => validateField("password", e.target.value)}
                  className="h-12 text-lg border-2 border-slate-200 focus:border-sky-400 bg-white text-black rounded-xl pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-slate-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-500 text-sm">{fieldErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-slate-700 font-medium"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    updateFormData("confirmPassword", e.target.value)
                  }
                  onBlur={(e) =>
                    validateField("confirmPassword", e.target.value)
                  }
                  className="h-12 text-lg border-2 border-slate-200 focus:border-sky-400 bg-white text-black rounded-xl pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-slate-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-500 text-sm">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </div>
      ),
    },
    // 8: Success
    {
      title: "Welcome aboard! 🎉",
      subtitle: "Your account has been created successfully",
      content: (
        <div className="text-center space-y-8 py-8">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <Check className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">
              You're all set!
            </h2>
            <p className="text-slate-600 max-w-sm mx-auto">
              Welcome to our platform, {formData.fullName}! You can now start
              exploring all the amazing features we have to offer.
            </p>
          </div>
        </div>
      ),
    },
  ];

  // total steps should reflect actual array length (fixes mismatch)
  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];

  const canContinue = (() => {
    switch (currentStep) {
      case 1:
        return !!formData.fullName && !fieldErrors.fullName;
      case 2:
        return !!formData.country;
      case 3: // Email (moved up)
        return !!formData.email && !fieldErrors.email;
      case 4: // Email OTP
        return formData.emailOtp.length === 4;
      case 5: // Phone (moved down)
        return !!formData.phone && !fieldErrors.phone;
      case 6: // Phone OTP
        return formData.phoneOtp.length === 4;
      case 7:
        return (
          !!formData.password &&
          !!formData.confirmPassword &&
          !fieldErrors.password &&
          !fieldErrors.confirmPassword
        );
      default:
        return true;
    }
  })();

  const nextStep = async () => {
    // Email (3) -> Register + send email OTP -> Email OTP (4)
    if (currentStep === 3) {
      const ok = await handleRegister();
      if (!ok) return;
      setCurrentStep(4);
      return;
    }

    // Email OTP (4) -> verify -> Phone input (5)
    if (currentStep === 4) {
      const ok = await handleVerifyEmail();
      if (!ok) return;
      setCurrentStep(5);
      return;
    }

    // Phone input (5) -> go to Phone OTP (6)
    if (currentStep === 5) {
      // Validation already covered by canContinue; just advance
      setCurrentStep(6);
      return;
    }

    // Phone OTP (6) -> verify -> Password (7)
    if (currentStep === 6) {
      const ok = await handleVerifyPhone();
      if (!ok) return;
      setCurrentStep(7);
      return;
    }

    // Password (7) -> update -> Success (8)
    if (currentStep === 7) {
      const ok = await handleUpdatePassword();
      if (!ok) return;
      setCurrentStep(8);
      return;
    }

    setCurrentStep((p) => Math.min(p + 1, totalSteps - 1));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <div className="absolute top-6 right-6 z-[70] pointer-events-auto">
        {/* subtle pulse ring when coach is visible */}
        {showCoach && (
          <span className="absolute inset-0 rounded-full animate-ping ring-2 ring-sky-400" />
        )}
        <VideoButton
          onClick={() => {
            setShowRawOverlay(true);
            // also mark the coach as seen if they clicked it
            if (showCoach) closeCoach();
          }}
          label="Watch Video"
        />
      </div>

      <div className="w-full max-w-md">
        {/* Progress Header */}

        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="text-sm font-medium text-slate-600">
            {currentStep + 1}/{totalSteps}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 mb-8">
          <div
            className="bg-gradient-to-r from-sky-400 to-sky-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Main Card */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                {currentStepData.title}
              </h1>
              <p className="text-slate-600">{currentStepData.subtitle}</p>
            </div>

            {currentStepData.content}

            {/* Error banner (from old code) */}
            {error && currentStep < totalSteps - 1 && (
              <p className="text-red-500 text-sm text-center mt-4">{error}</p>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-center mt-8">
              {currentStep < totalSteps - 1 ? (
                <Button
                  onClick={nextStep}
                  disabled={loading || !canContinue}
                  className="w-full h-12 bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-400 hover:to-sky-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full h-12 bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-400 hover:to-sky-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <VideoOverlay
        videoUrl={videoUrl}
        isOpen={showRawOverlay}
        onClose={() => setShowRawOverlay(false)}
      />
      {showCoach && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[1px]"
          onClick={closeCoach} // click anywhere to dismiss
          aria-label="Coachmark overlay"
        >
          {/* Bubble + finger, positioned near the top-right button */}
          <div className="absolute right-14 top-6 flex items-center gap-3 select-none pointer-events-none">
            {/* Tip bubble */}
            <div className="hidden sm:block pointer-events-auto bg-white/95 text-slate-800 rounded-xl shadow-xl px-4 py-3">
              <div className="text-sm font-semibold">Need a help?</div>
              <div className="text-xs text-slate-500">Watch Video Guide</div>
            </div>

            <Image
              src={fingerNavigation}
              alt="Tap here"
              className="w-12 h-12 animate-bounce drop-shadow-xl pointer-events-none"
            />
          </div>

          {/* Optional 'Close' hint at bottom */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-6 text-white/80 text-xs">
            Click anywhere to close
          </div>
        </div>
      )}
    </div>
  );
}

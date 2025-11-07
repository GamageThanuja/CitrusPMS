"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mail,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "@/components/ui/use-toast";
import { InputWithIcon } from "@/components/ui/input-with-icon"; // optional if using an Input with icon
import { debounce } from "lodash"; // for optimized search
import { useRef } from "react";
import confetti from "canvas-confetti";
import { useWindowSize } from "react-use";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { register } from "@/redux/slices/authSlice";
import type { AppDispatch, RootState } from "@/redux/store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function SignupFlow() {
  const { width, height } = useWindowSize();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);
  const { setTheme } = useTheme();

  // Force light theme
  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  const [step, setStep] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("signupStep");
      if (saved !== null) {
        const val = parseInt(saved, 10);
        // Skip the initial welcome screen when email is the only sign‑up option
        return val === 0 ? 1 : val;
      }
    }
    // Default to step 1 (Create account)
    return 1;
  });

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
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<string, string>>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [countryList, setCountryList] = useState<
    { countryId: number; country: string; dialCode: string; flagCode: string }[]
  >([]);

  // fetch countries
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

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "phone" || field === "email") {
      localStorage.setItem(field, value);
    }
    validateField(field, value);
  };

  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailOtpRef = useRef<HTMLInputElement>(null);
  const phoneOtpRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem("signupStep", step.toString());
  }, [step]);

  const validateField = (field: string, value: string) => {
    let message = "";
    switch (field) {
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
      default:
        break;
    }
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  };

  // Step 1: Register
  const handleRegister = async () => {
    setError(null);
    setLoading(true);

    // Client-side validation check before submitting
    if (
      !formData.fullName.trim() ||
      !formData.country ||
      fieldErrors.email ||
      fieldErrors.phone ||
      !formData.email ||
      !formData.phone
    ) {
      setError("Please fix errors before continuing.");
      setLoading(false);
      return;
    }

    try {
      const result = await dispatch(
        register({
          fullName: formData.fullName,
          username: formData.email, // email as username
          country: formData.country,
          phoneNumber: formData.phone,
          email: formData.email,
          password: "HOTELmate123$",
          role: "Owner",
          authenticator: 0,
          authenticatorUUID: "",
          isUserVerified: false,
        })
      );

      if (register.fulfilled.match(result)) {
        setStep(2); // go to OTP verification step
      } else {
        throw new Error(auth.error || "Registration failed");
      }
    } catch (err: any) {
      if (
        err.message?.includes("already registered") ||
        auth.error?.includes("already registered")
      ) {
        setError("You have already registered with Hotel Mate");
      } else {
        setError(err.message || auth.error || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Email OTP
  const handleVerifyEmail = async () => {
    setError(null);
    setLoading(true);
    if (!/^\d{4}$/.test(formData.emailOtp)) {
      setError("Please enter a valid 4‑digit code.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/SignUp/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.emailOtp,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Email verification failed");
      }
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleResendEmailOTP = async () => {
    setError(null);
    setLoading(true);

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

      // ✅ Place the toast here after success
      toast({
        title: "Resent email",
        description: `A new code was sent to ${formData.email}`,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Send Phone OTP
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

  // Step 4: Verify Phone OTP
  const handleVerifyPhone = async () => {
    setError(null);
    setLoading(true);
    if (!/^\d{4}$/.test(formData.phoneOtp)) {
      setError("Please enter a valid 4‑digit code.");
      setLoading(false);
      return;
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
      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleUpdatePassword = async () => {
    setError(null);
    setLoading(true);

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

      setStep(5);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // auto‑send phone OTP
  useEffect(() => {
    if (step === 3) handleSendPhoneVerification();
  }, [step]);

  const steps = [
    // Step 0: Welcome
    {
      title: "Welcome to Hotel Mate",
      description: "Create an account to get started",
      content: (
        <div className="space-y-4 py-4">
          {/* <Button className="w-full bg-white/60 text-black backdrop-blur-md border border-white/20 hover:bg-white/80">
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="h-5 w-5 mr-2"
            />
            Sign up with Google
          </Button>
          <Button className="w-full bg-white/60 text-black backdrop-blur-md border border-white/20 hover:bg-white/80">
          <img
                  src="/apple-logo-black.svg"
                  alt="Apple logo"
                  className="mr-2 h-5 w-5"
                />
            Sign up with Apple
          </Button>
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="">
                Or continue with
              </span>
            </div>
          </div> */}
          <Button className="w-full" onClick={() => setStep(1)}>
            <Mail className="mr-2 h-4 w-4" />
            Sign up with Email
          </Button>
        </div>
      ),
      footer: (
        <CardFooter>
          <p className="w-full text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a
              href="/login"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign in
            </a>
          </p>
        </CardFooter>
      ),
    },

    // Step 1: Create account
    {
      title: "Create your account",
      description: "Enter your information to get started",
      content: (
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Your full name"
              value={formData.fullName}
              onChange={(e) => updateFormData("fullName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={formData.country}
              onValueChange={(val) => {
                const country = countryList.find((c) => c.country === val);
                updateFormData("country", val);
                if (country) {
                  updateFormData("phone", `${country.dialCode}`);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                <Input
                  placeholder="Search country..."
                  className="mx-2 my-2"
                  onChange={(e) => {
                    const search = e.target.value.toLowerCase();
                    setCountryList((prev) =>
                      prev.filter((c) =>
                        c.country.toLowerCase().includes(search)
                      )
                    );
                  }}
                />
                {countryList.map((c) => (
                  <SelectItem key={c.countryId} value={c.country}>
                    {c.country} ({c.dialCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+1234567890"
              value={formData.phone}
              onChange={(e) => updateFormData("phone", e.target.value)}
              onBlur={(e) => validateField("phone", e.target.value)}
            />
            {fieldErrors.phone && (
              <p className="text-red-500 text-sm">{fieldErrors.phone}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              onBlur={(e) => validateField("email", e.target.value)}
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-sm">{fieldErrors.email}</p>
            )}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      ),
      footer: (
        <CardFooter>
          <div className="w-full flex justify-between items-center">
            <Button variant="outline" onClick={() => router.push("/login")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleRegister}
              disabled={
                loading ||
                !!fieldErrors.email ||
                !!fieldErrors.phone ||
                !formData.fullName ||
                !formData.country ||
                !formData.email ||
                !formData.phone
              }
            >
              {loading ? "Processing..." : "Continue"}{" "}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      ),
    },

    // Step 2: Email OTP
    {
      title: "Verify your email",
      description: "We've sent a code to your email",
      content: (
        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center space-y-2">
            <Mail className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              We've sent a verification code to
              <br />
              <span className="font-medium text-foreground">
                {formData.email}
              </span>
            </p>
          </div>
          <div className="space-y-2 flex flex-col items-center">
            <Label>Enter 4‑digit code</Label>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3].map((i) => (
                <Input
                  key={i}
                  name={`otp-${i}`}
                  className="h-12 w-12 text-center text-lg"
                  maxLength={1}
                  value={formData.emailOtp.charAt(i) || ""}
                  onPaste={(e) => {
                    const paste = e.clipboardData.getData("text").trim();
                    if (/^\d{4}$/.test(paste)) {
                      updateFormData("emailOtp", paste);
                      const inputs =
                        document.querySelectorAll<HTMLInputElement>(
                          'input[name^="otp-"]'
                        );
                      paste.split("").forEach((ch, idx) => {
                        if (inputs[idx]) inputs[idx].value = ch;
                      });
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^\d?$/.test(v)) {
                      const arr = formData.emailOtp.split("");
                      arr[i] = v;
                      updateFormData("emailOtp", arr.join(""));
                      if (v && i < 3) {
                        const nxt = document.querySelector<HTMLInputElement>(
                          `input[name="otp-${i + 1}"]`
                        );
                        nxt?.focus();
                      }
                    }
                  }}
                />
              ))}
            </div>
          </div>
          <Button
            variant="link"
            className="mx-auto block"
            onClick={handleResendEmailOTP}
          >
            Resend code
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      ),
      footer: (
        <CardFooter>
          <div className="w-full flex justify-between items-center">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleVerifyEmail} disabled={loading}>
              {loading ? "Processing..." : "Continue"}{" "}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      ),
    },

    // Step 3: Phone OTP
    {
      title: "Verify your phone number",
      description: "We've sent a code to your phone",
      content: (
        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center space-y-2">
            <Phone className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              We've sent a verification code to
              <br />
              <span className="font-medium text-foreground">
                {formData.phone}
              </span>
            </p>
          </div>
          <div className="space-y-2 flex flex-col items-center">
            <Label>Enter 4‑digit code</Label>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3].map((i) => (
                <Input
                  key={i}
                  name={`phone-otp-${i}`}
                  className="h-12 w-12 text-center text-lg"
                  maxLength={1}
                  value={formData.phoneOtp.charAt(i) || ""}
                  onPaste={(e) => {
                    const paste = e.clipboardData.getData("text").trim();
                    if (/^\d{4}$/.test(paste)) {
                      updateFormData("phoneOtp", paste);
                      const inputs =
                        document.querySelectorAll<HTMLInputElement>(
                          'input[name^="phone-otp-"]'
                        );
                      paste.split("").forEach((ch, idx) => {
                        if (inputs[idx]) inputs[idx].value = ch;
                      });
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^\d?$/.test(v)) {
                      const arr = formData.phoneOtp.split("");
                      arr[i] = v;
                      updateFormData("phoneOtp", arr.join(""));
                      if (v && i < 3) {
                        const nxt = document.querySelector<HTMLInputElement>(
                          `input[name="phone-otp-${i + 1}"]`
                        );
                        nxt?.focus();
                      }
                    }
                  }}
                />
              ))}
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Resend code in <span className="font-medium">01:59</span>
          </p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      ),
      footer: (
        <CardFooter>
          <div className="w-full flex justify-between items-center">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleVerifyPhone} disabled={loading}>
              {loading ? "Processing..." : "Continue"}{" "}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      ),
    },

    // Step 4: Set password
    {
      title: "Set your password",
      description: "Create a secure password for your account",
      content: (
        <div className="space-y-4 py-2">
          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="pr-10" // ← extra right padding
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
                onBlur={(e) => validateField("password", e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center z-20"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-red-500 text-sm">{fieldErrors.password}</p>
            )}
          </div>
          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className="pr-10" // ← extra right padding
                value={formData.confirmPassword}
                onChange={(e) =>
                  updateFormData("confirmPassword", e.target.value)
                }
                onBlur={(e) => validateField("confirmPassword", e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center z-20"
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-red-500 text-sm">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>
      ),
      footer: (
        <CardFooter>
          <div className="w-full flex justify-between items-center">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleUpdatePassword}
              disabled={
                !!fieldErrors.password ||
                !!fieldErrors.confirmPassword ||
                !formData.password ||
                !formData.confirmPassword
              }
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      ),
    },

    // Step 5: Success
    {
      title: "Account created successfully!",
      description: "You're all set up and ready to go",
      content: (
        <div className="relative">
          <div className="flex flex-col items-center justify-center space-y-4 py-6 relative z-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-medium">Welcome to Hotel Mate</h3>
              <p className="text-muted-foreground">
                Your account has been created successfully. You can now sign in
                to access your dashboard.
              </p>
            </div>
          </div>
        </div>
      ),
      footer: (
        <CardFooter>
          <div className="w-full flex justify-end">
            <Button onClick={() => router.push("/create-property")}>
              Done
            </Button>
          </div>
        </CardFooter>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[url('/background.png')] bg-cover bg-center p-4 notranslate"
      translate="no"
    >
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 flex items-center justify-center">
          <div className="p-2 rounded-lg shadow-md">
            <img
              src="/app-icon.png"
              alt="Hotel Mate Logo"
              className="h-10 w-10"
            />
          </div>
          <h1 className="ml-2 text-xl font-bold">Hotel Mate</h1>
        </div>
        <Card className="bg-white/20 backdrop-blur-md shadow-lg border border-white/10">
          <CardHeader>
            <CardTitle>{current.title}</CardTitle>
            <CardDescription>{current.description}</CardDescription>
          </CardHeader>
          <CardContent>{current.content}</CardContent>
          {current.footer}
        </Card>

        {step > 0 && step < steps.length - 1 && (
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-2">
              {steps.slice(1, steps.length - 1).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 w-10 rounded-full ${
                    idx + 1 === step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

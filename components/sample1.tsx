// components/create-property-flow.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Globe,
  DollarSign,
  CheckCircle,
  ChevronRight,
  Info,
  User,
  Mail,
  Languages,
  Flag,
  Home,
  MapIcon,
  FileText,
  ImageIcon,
  Check,
  Sparkles,
  Trash2,
  Loader2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getAllHotelTypes } from "@/controllers/AllHotelTypesController";
import { getAllCurrencies } from "@/controllers/AllCurrenciesController";
import { getAllLanguages } from "@/controllers/AllLanguagesController";
import { getAllCountries } from "@/controllers/AllCountriesController";
import { createHotel } from "@/controllers/hotelController";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import MapPicker from "./mapPickerProperty";
import { Label } from "./ui/label";
import { useDispatch } from "react-redux";
import { fetchHotelImagesByHotelId } from "@/redux/slices/fetchHotelImageSlice";
import { updateHotelImage } from "@/redux/slices/updateHotelImageSlice";
import { createHotelImage } from "@/redux/slices/hotelImageSlice";
import { uploadHotelImage } from "@/redux/slices/hotelImageUploadSlice";
import Image from "next/image";

import { deleteHotelImage } from "@/redux/slices/hotelImageDeleteSlice";
import VideoButton from "./videoButton";
import VideoOverlay from "./videoOverlay";
import Bnb from "../assets/icons/property/bnb.png";
import HomeStay from "../assets/icons/property/homestay.png";
import Hostel from "../assets/icons/property/hostel.png";
import Hotel from "../assets/icons/property/hotel.png";
import Inn from "../assets/icons/property/inn.png";
import Resort from "../assets/icons/property/resort.png";
import RestHouse from "../assets/icons/property/restHouse.png";
import Villa from "../assets/icons/property/villa.png";
import Logo from "../assets/images/hotelmateLogo.jpeg";
import { sendCustomEmail } from "@/redux/slices/emailSendSlice";
import { useTutorial } from "@/hooks/useTutorial";
import { useSearchParams } from "next/navigation";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const GOOGLE_API_KEY = "AIzaSyAY_eNoCO6CCES64t6ege7HdllxqyC0Bgc"!;

// For legacy plan mapping if ever needed
const PLAN_ID_MAP: Record<string, number> = {
  "start-up": 1,
  premium: 2,
  growing: 3,
};

export interface HotelImage {
  imageID: number;
  hotelID: number;
  imageFileName: string;
  description: string;
  isMain: boolean;
  finAct: boolean;
  createdOn: string;
  createdBy: string;
  updatedOn?: string;
  updatedBy: string;
  base64Image: string;
}

type HotelImageCreate = {
  imageID: 0;
  hotelID: 0;
  imageFileName: string;
  description: string;
  isMain: true;
  finAct: true | false;
  createdOn: string;
  createdBy: string;
  updatedOn: string;
  updatedBy: string;
  base64Image: string; // REQUIRED by Swagger
  bucketName: string; // REQUIRED by Swagger
};

/** ---------------- Component ---------------- */
export default function CreatePropertyFlow() {
  const pad = (n: number) => String(n).padStart(2, "0");

  const today = new Date();
  const THIS_YEAR = today.getFullYear();
  const THIS_MONTH = today.getMonth() + 1; // 1-12
  const THIS_DAY = today.getDate();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [startYear, setStartYear] = useState<number | null>(THIS_YEAR);
  const [startMonth, setStartMonth] = useState<number | null>(THIS_MONTH);
  const [startDay, setStartDay] = useState<number | null>(THIS_DAY);
  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial(
    "onBoarding",
    "property creation"
  );
  const search = useSearchParams();

  const [checkoutClientSecret, setCheckoutClientSecret] = useState<
    string | null
  >(null);
  const [paymentComplete, setPaymentComplete] = useState(false);

  console.log("videoUrl : ", videoUrl);

  useEffect(() => {
    const sid = search.get("session_id") || search.get("checkout_session_id");
    if (!sid) return;

    (async () => {
      try {
        const res = await fetch(
          `/api/stripe/checkout-session?session_id=${sid}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Lookup failed");

        setPaymentComplete(true);

        const created = await createHotelNow();
        if (!created) return;

        const imagesIdx = steps.findIndex((s) =>
          s.title.toLowerCase().includes("upload property images")
        );
        if (imagesIdx >= 0) setCurrentStep(imagesIdx);
      } catch (e) {
        console.error("Stripe session verify failed:", (e as any)?.message);
        setPaymentComplete(false);
      }
    })();
  }, [search]);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  const INITIAL_ISO = `${THIS_YEAR}-${pad(THIS_MONTH)}-${pad(THIS_DAY)}`;
  const dispatch = useDispatch();
  const [createdHotel, setCreatedHotel] = useState<null | {
    id: number;
    guid?: string | null;
  }>(null);
  const [hasPostedHotel, setHasPostedHotel] = useState(false);

  // If there's a session_id in the URL, auto-create the hotel and move on.
  useEffect(() => {
    const sessionId = search.get("session_id");
    if (sessionId && !hasPostedHotel) {
      (async () => {
        const created = await createHotelNow();
        if (created) {
          setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
        }
      })();
    }
  }, [search]);

  // prefer this when you need the id (createdHotel first, else selectedProperty)
  const getEffectiveHotelId = () => {
    if (createdHotel?.id) return Number(createdHotel.id);
    try {
      const sp = localStorage.getItem("selectedProperty");
      if (sp) return Number(JSON.parse(sp).id || 0) || null;
    } catch {}
    return null;
  };

  const slugify = (input?: string) => {
    if (!input) return "";
    return input
      .normalize("NFKD") // split accents
      .replace(/[\u0300-\u036f]/g, "") // strip accents
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // non-url chars -> -
      .replace(/^-+|-+$/g, "") // trim -
      .slice(0, 80); // keep it short-ish
  };

  const propertyEmailSentRef = useRef(false);

  async function startEmbeddedCheckout(params: {
    rooms: number;
    currency: string;
    email?: string;
    propertyName?: string;
    city?: string;
    country?: string;
  }) {
    const returnUrl = `${window.location.origin}${window.location.pathname}?session_id={CHECKOUT_SESSION_ID}`;

    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, returnUrl }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || "Failed to create checkout session");
    }
    const { client_secret } = await res.json();
    setCheckoutClientSecret(client_secret);
  }

  async function handleWriteWithAI() {
    try {
      setAiBusy(true);

      const res = await fetch("/api/ai/describe-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyName: formData.propertyName,
          propertyType: formData.propertyType,
          city: formData.city,
          country: formData.country,
          address: formData.address,
          currency: formData.currency,
          language: formData.language,
          website: formData.website,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          rooms: roomCount,
          descriptionSeed: formData.description, // let model refine what’s there
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }

      const { text } = await res.json();
      if (text) updateFormData("description", text);
    } catch (e: any) {
      console.error(e);
      alert("AI write failed: " + (e?.message || "Unknown error"));
    } finally {
      setAiBusy(false);
    }
  }

  function getPropertyCreatedEmailHTML(params: {
    propertyName: string;
    city?: string;
    country?: string;
    url?: string;
  }) {
    const { propertyName, city, country, url } = params;
    const where = [city, country].filter(Boolean).join(", ");
    return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <meta charset="UTF-8">
  <title>Welcome to HotelMate - Your Journey Begins</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <style>
    /* Mobile tweaks */
    @media screen and (max-width: 620px) {
      .container {
        width: 100% !important;
        max-width: 100% !important;
      }

      .hero-text {
        font-size: 32px !important;
        line-height: 38px !important;
      }

      .hero-subtitle {
        font-size: 16px !important;
      }

      .section-padding {
        padding: 32px 20px !important;
      }

      .feature-grid {
        display: block !important;
      }

      .feature-item {
        width: 100% !important;
        margin-bottom: 16px !important;
      }

      .eq {
        height: auto !important;
      }

      /* make equal-height tiles auto on small screens */
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
    }
  </style>
</head>

<body style="margin:0; padding:0; background-color:#f8fafc;">

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8fafc;">
    <tr>
      <td align="center" style="padding:20px 12px;">
        <center>

          <!-- Main Container -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container"
            style="width:600px; max-width:600px; background-color:#ffffff; border-radius:0; overflow:hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">

            <!-- Hero Section with Background Image -->
            <!-- Add this in the <head> of your email -->
            <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700&display=swap"
              rel="stylesheet">

            <!-- Hero Section with Urbanist font -->
            <tr>
              <td class="section-padding" style="padding:60px 40px; text-align:center; background-color:#191970;">
                <table role="presentation" width="100%">
                  <tr>
                    <td align="center">
                      <!-- Logo -->
                      <img src="https://hotelmate.co.uk/images/logo_bg_white.jpeg" width="180" alt="HotelMate Logo"
                        style="display:block; border:0; margin-bottom: 20px;">

                      <!-- Hero Text -->
                      <h1 class="hero-text"
                        style="font-family: 'Urbanist', Arial, sans-serif; font-size: 42px; font-weight: 300; color: #ffffff; margin: 0 0 16px 0; letter-spacing: 2px; line-height: 48px;">
                        HELLO<br>
                        WELCOME TO<br>
                        <span style="font-weight: 500;">HOTELMATE</span>
                      </h1>

                      <!-- Subtitle -->
                      <p class="hero-subtitle"
                        style="font-family: 'Urbanist', Arial, sans-serif; font-size: 18px; color: #cbd5e1; margin: 0 0 32px 0; max-width: 480px; line-height: 28px;">
                        Your account has been successfully created. Welcome to the future of hotel management where
                        efficiency meets excellence.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Features Section (no background image) -->
            <tr>
              <td class="section-padding" style="padding:60px 40px; background-color:#f1f5f9;">
                <table role="presentation" width="100%">
                  <tr>
                    <td align="center">
                      <h2
                        style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 32px; font-weight: 300; color: #0f172a; margin: 0 0 16px 0; letter-spacing: 1px;">
                        YOUR COMPLETE TOOLKIT
                      </h2>
                      <p
                        style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #64748b; margin: 0 0 40px 0;">
                        Powerful modules designed to revolutionize your hotel operations
                      </p>

                      <!-- Features Grid -->
                      <table role="presentation" width="100%" class="feature-grid" style="table-layout:fixed;">
                        <!-- Row 1 -->
                        <tr>
                          <td width="50%" class="feature-item" style="padding:0 8px 16px 0;" valign="top" align="left">
                            <!-- Equal-height card -->
                            <table role="presentation" width="100%"
                              style="border-collapse:separate; background:#ffffff; border-left:4px solid #3b82f6; border-radius:12px;">
                              <tr>
                                <td class="eq" style="padding:24px; height:160px; mso-line-height-rule:exactly;"
                                  valign="top">
                                  <h3
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:16px; font-weight:600; color:#0f172a; margin:0 0 8px 0;">
                                    🏨 Front Desk Management
                                  </h3>
                                  <p
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:14px; color:#475569; margin:0; line-height:20px;">
                                    Streamline check-ins, check-outs, and guest services with an intuitive front desk.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td width="50%" class="feature-item" style="padding:0 0 16px 8px;" valign="top" align="left">
                            <table role="presentation" width="100%"
                              style="border-collapse:separate; background:#ffffff; border-left:4px solid #10b981; border-radius:12px;">
                              <tr>
                                <td class="eq" style="padding:24px; height:160px; mso-line-height-rule:exactly;"
                                  valign="top">
                                  <h3
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:16px; font-weight:600; color:#0f172a; margin:0 0 8px 0;">
                                    📱 Guest Self Services
                                  </h3>
                                  <p
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:14px; color:#475569; margin:0; line-height:20px;">
                                    Mobile check-in/out, requests, and more—put guests in control.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <!-- Row 2 -->
                        <tr>
                          <td width="50%" class="feature-item" style="padding:0 8px 16px 0;" valign="top" align="left">
                            <table role="presentation" width="100%"
                              style="border-collapse:separate; background:#ffffff; border-left:4px solid #f59e0b; border-radius:12px;">
                              <tr>
                                <td class="eq" style="padding:24px; height:160px; mso-line-height-rule:exactly;"
                                  valign="top">
                                  <h3
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:16px; font-weight:600; color:#0f172a; margin:0 0 8px 0;">
                                    📅 Reservations System
                                  </h3>
                                  <p
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:14px; color:#475569; margin:0; line-height:20px;">
                                    Manage bookings, availability, guest profiles, and policies.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td width="50%" class="feature-item" style="padding:0 0 16px 8px;" valign="top" align="left">
                            <table role="presentation" width="100%"
                              style="border-collapse:separate; background:#ffffff; border-left:4px solid #8b5cf6; border-radius:12px;">
                              <tr>
                                <td class="eq" style="padding:24px; height:160px; mso-line-height-rule:exactly;"
                                  valign="top">
                                  <h3
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:16px; font-weight:600; color:#0f172a; margin:0 0 8px 0;">
                                    🧹 Housekeeping Management
                                  </h3>
                                  <p
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:14px; color:#475569; margin:0; line-height:20px;">
                                    Scheduling, room status, and task tracking to keep operations tidy.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <!-- Row 3 -->
                        <tr>
                          <td width="50%" class="feature-item" style="padding:0 8px 16px 0;" valign="top" align="left">
                            <table role="presentation" width="100%"
                              style="border-collapse:separate; background:#ffffff; border-left:4px solid #ef4444; border-radius:12px;">
                              <tr>
                                <td class="eq" style="padding:24px; height:160px; mso-line-height-rule:exactly;"
                                  valign="top">
                                  <h3
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:16px; font-weight:600; color:#0f172a; margin:0 0 8px 0;">
                                    💳 Point of Sales
                                  </h3>
                                  <p
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:14px; color:#475569; margin:0; line-height:20px;">
                                    Restaurant, bar, spa—unified POS with room posting and taxes.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td width="50%" class="feature-item" style="padding:0 0 16px 8px;" valign="top" align="left">
                            <table role="presentation" width="100%"
                              style="border-collapse:separate; background:#ffffff; border-left:4px solid #06b6d4; border-radius:12px;">
                              <tr>
                                <td class="eq" style="padding:24px; height:160px; mso-line-height-rule:exactly;"
                                  valign="top">
                                  <h3
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:16px; font-weight:600; color:#0f172a; margin:0 0 8px 0;">
                                    🌐 Channel Manager
                                  </h3>
                                  <p
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:14px; color:#475569; margin:0; line-height:20px;">
                                    Sync inventory and rates across OTAs to reduce overbookings.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <!-- Row 4 -->
                        <tr>
                          <td width="50%" class="feature-item" style="padding:0 8px 16px 0;" valign="top" align="left">
                            <table role="presentation" width="100%"
                              style="border-collapse:separate; background:#ffffff; border-left:4px solid #0ea5e9; border-radius:12px;">
                              <tr>
                                <td class="eq" style="padding:24px; height:160px; mso-line-height-rule:exactly;"
                                  valign="top">
                                  <h3
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:16px; font-weight:600; color:#0f172a; margin:0 0 8px 0;">
                                    🧾 Direct Booking Engine
                                  </h3>
                                  <p
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:14px; color:#475569; margin:0; line-height:20px;">
                                    Commission-free website bookings with promo codes and upsells.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td width="50%" class="feature-item" style="padding:0 0 16px 8px;" valign="top" align="left">
                            <table role="presentation" width="100%"
                              style="border-collapse:separate; background:#ffffff; border-left:4px solid #16a34a; border-radius:12px;">
                              <tr>
                                <td class="eq" style="padding:24px; height:160px; mso-line-height-rule:exactly;"
                                  valign="top">
                                  <h3
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:16px; font-weight:600; color:#0f172a; margin:0 0 8px 0;">
                                    🧮 Accounting
                                  </h3>
                                  <p
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:14px; color:#475569; margin:0; line-height:20px;">
                                    Folios, ledgers, taxes, and reconciliations aligned with your policies.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <!-- Row 5 -->
                        <tr>
                          <td width="50%" class="feature-item" style="padding:0 8px 0 0;" valign="top" align="left">
                            <table role="presentation" width="100%"
                              style="border-collapse:separate; background:#ffffff; border-left:4px solid #ea580c; border-radius:12px;">
                              <tr>
                                <td class="eq" style="padding:24px; height:160px; mso-line-height-rule:exactly;"
                                  valign="top">
                                  <h3
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:16px; font-weight:600; color:#0f172a; margin:0 0 8px 0;">
                                    📊 Insights
                                  </h3>
                                  <p
                                    style="font-family:'Segoe UI', Arial, sans-serif; font-size:14px; color:#475569; margin:0; line-height:20px;">
                                    Real-time dashboards for ADR, RevPAR, occupancy, and forecasting.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <!-- /Features Grid -->
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Call to Action Section (no background image) -->
            <tr>
              <td class="section-padding" style="padding:60px 40px; text-align:center; background-color:#0f172a;">
                <table role="presentation" width="100%">
                  <tr>
                    <td align="center">
                      <h2
                        style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 28px; font-weight: 300; color: #ffffff; margin: 0 0 16px 0; letter-spacing: 1px;">
                        READY TO TRANSFORM YOUR HOTEL?
                      </h2>
                      <p
                        style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #cbd5e1; margin: 0 0 32px 0; max-width: 480px; line-height: 24px;">
                        Your journey to operational excellence starts now. Access your dashboard and discover the power
                        of modern hotel management.
                      </p>

                      <a href="https://web.hotelmate.co.uk" target="_blank" rel="noopener noreferrer"
                        style="background-color:#2563eb; color:#ffffff; text-decoration:none; font-weight:600; font-family:'Segoe UI', Arial, sans-serif; font-size:16px; padding:16px 32px; border-radius:50px; display:inline-block; margin-right:16px;">
                        GET STARTED
                      </a>

                      <a href="mailto:support@hotelmate.co.uk"
                        style="background:transparent; color:#ffffff; text-decoration:none; font-weight:600; font-family:'Segoe UI', Arial, sans-serif; font-size:16px; padding:16px 32px; border-radius:50px; display:inline-block; border:2px solid rgba(255,255,255,0.3);">
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
                <p
                  style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; color: #475569; margin: 0 0 16px 0;">
                  Thank you for choosing HotelMate!
                </p>
                <div
                  style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
                  HotelMate Team
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #0f172a; padding: 32px 40px; text-align: center;">
                <div
                  style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #64748b; margin-bottom: 8px;">
                  © 2025 HotelMate. All rights reserved.
                </div>
                <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #475569;">
                  Colombo, Sri Lanka
                </div>

                <!-- Social Links -->
                <table role="presentation" style="margin: 20px auto 0 auto;">
                  <tr>
                    <td style="padding: 0 8px;">
                      <a href="https://hotelmate.co.uk" target="_blank"
                        style="color: #64748b; text-decoration: none; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                        VISIT WEBSITE
                      </a>
                    </td>
                    <td style="padding: 0 8px; color: #475569;">•</td>
                    <td style="padding: 0 8px;">
                      <a href="mailto:support@hotelmate.co.uk"
                        style="color: #64748b; text-decoration: none; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                        SUPPORT
                      </a>
                    </td>
                    <td style="padding: 0 8px; color: #475569;">•</td>
                    <td style="padding: 0 8px;">
                      <a href="https://hotelmate.co.uk/help" target="_blank"
                        style="color: #64748b; text-decoration: none; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
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

</html>`;
  }

  // Logo (single file) — staged until hotel exists, then auto-upload on submit
  const [stagedLogo, setStagedLogo] = useState<{
    name: string;
    base64: string;
    preview: string;
  } | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const handleLogoFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const [item] = await Promise.all([fileToDataUrl(file)]);
    setStagedLogo(item);
  };

  const clearLogo = () => setStagedLogo(null);

  const [formData, setFormData] = useState({
    propertyType: "",
    propertyName: "",
    currency: "",
    language: "",
    country: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    latitude: "",
    longitude: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    description: "",
    logoURL: "",
    mainImage: null as HotelImage | null,
    hotelStartDate: INITIAL_ISO,
  });

  const [hotelTypes, setHotelTypes] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);

  /** ---------- New subscription (rooms-based) ---------- */
  const [roomCount, setRoomCount] = useState<number>(5);

  const computeTotal = (rooms: number) => {
    const base = 39; // starting price
    const included = 5; // first 5 rooms included
    const extras = Math.max(0, rooms - included);
    return base + extras * 2; // $2 per extra room
  };

  // Persist a flexible plan (so submit can resolve planId)
  useEffect(() => {
    const total = computeTotal(roomCount);
    localStorage.setItem(
      "selectedPlan",
      JSON.stringify({
        id: "flex",
        name: "Flexible Rooms Plan",
        rooms: roomCount,
        monthlyTotal: total,
        planId: 2, // premium by default; change if your backend differs
      })
    );
  }, [roomCount]);

  /** ---------- Load dropdown data ---------- */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [hotelTypesData, currenciesData, languagesData, countriesData] =
          await Promise.all([
            getAllHotelTypes(),
            getAllCurrencies(),
            getAllLanguages(),
            getAllCountries(),
          ]);

        setHotelTypes(hotelTypesData);
        setCurrencies(currenciesData);
        setLanguages(languagesData);
        setCountries(countriesData);
      } catch (error) {
        console.error("Failed to load sign-up data:", error);
      }
    };

    loadData();
  }, []);

  function setHotelCurrency(v: string) {
    try {
      localStorage.setItem("hotelCurrency", v);

      // keep selectedProperty in sync if it already exists
      const sp = localStorage.getItem("selectedProperty");
      if (sp) {
        const obj = JSON.parse(sp);
        const next = { ...obj, hotelCurrency: v };
        localStorage.setItem("selectedProperty", JSON.stringify(next));
      }
    } catch {
      // ignore localStorage errors (SSR or quota)
    }
  }

  const updateFormData = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  /** ---------- Old utilities brought forward (tokens, seeding, hotels upsert) ---------- */
  function decodeJwt<T = any>(jwt?: string | null): Partial<T> {
    try {
      if (!jwt) return {};
      const [_h, p] = jwt.split(".");
      const pad = "=".repeat((4 - (p.length % 4)) % 4);
      return JSON.parse(decodeURIComponent(escape(atob(p + pad))));
    } catch {
      return {};
    }
  }

  function setIfMissing(key: string, value: any) {
    if (
      localStorage.getItem(key) === null ||
      localStorage.getItem(key) === undefined
    ) {
      localStorage.setItem(
        key,
        typeof value === "string" ? value : JSON.stringify(value)
      );
    }
  }

  function persistNewHotel(created: any) {
    const entry = {
      id: created?.hotelID ?? created?.id ?? 0,
      guid: created?.hotelGUID ?? created?.guid ?? null,
      name: created?.hotelName ?? created?.name ?? "",
      hotelCode: String(
        created?.hotelCode ??
          created?.code ??
          Math.floor(1000 + Math.random() * 9000)
      ),
      currency: created?.currencyCode ?? created?.currency ?? "",
    };
    upsertHotelsList(entry);
    setSelectedProperty(entry);
    return entry;
  }

  function getMainHotelImageForCreate(
    stagedFiles: { name: string; base64: string }[],
    description: string,
    author: string
  ): HotelImageCreate | null {
    if (!stagedFiles?.length) return null;

    const first = stagedFiles[0];
    const now = new Date().toISOString();

    return {
      imageID: 0,
      hotelID: 0, // server binds this to the new hotel
      imageFileName: `hotel-image-${Date.now()}-main-${first.name}`,
      description: description || "Main image",
      isMain: true,
      finAct: true, // ok to send true on create
      createdOn: now,
      createdBy: author,
      updatedOn: now,
      updatedBy: author,
      base64Image: first.base64, // <-- CRITICAL
      bucketName: "hotelimage",
    };
  }

  function upsertHotelsList(entry: {
    id: number | string;
    guid: string | null;
    name: string;
    hotelCode: string;
    currency?: string;
  }) {
    const existing = localStorage.getItem("hotels");
    const hotels: any[] = existing ? JSON.parse(existing) : [];

    const idx = hotels.findIndex(
      (h) =>
        (entry.guid && h.guid === entry.guid) ||
        String(h.id) === String(entry.id)
    );
    if (idx >= 0) {
      hotels[idx] = { ...hotels[idx], ...entry };
    } else {
      hotels.push(entry);
    }
    localStorage.setItem("hotels", JSON.stringify(hotels));
  }

  function setSelectedProperty(entry: {
    id: number | string;
    guid: string | null;
    name: string;
    hotelCode: string;
    currency?: string;
  }) {
    localStorage.setItem(
      "selectedProperty",
      JSON.stringify({
        id: entry.id,
        name: entry.name,
        guid: entry.guid,
        hotelCode: entry.hotelCode,
        hotelCurrency: entry.currency ?? "",
      })
    );
  }

  function seedLocalUserIfMissing(accessToken: string) {
    const claims = decodeJwt<{
      sub?: string;
      jti?: string;
      name?: string;
      unique_name?: string;
      email?: string;
      role?: string | string[];
      iss?: string;
      aud?: string | string[];
      exp?: number;
    }>(accessToken);

    setIfMissing("hnPersist", "local");
    setIfMissing("status", "logged in");

    const uid = claims.jti || claims.sub || crypto.randomUUID();
    setIfMissing("userId", uid);

    const role = Array.isArray(claims.role)
      ? claims.role[0]
      : claims.role || "Owner";
    setIfMissing("userRole", role);

    const storedEmail = localStorage.getItem("email") || "";
    const fullName =
      claims.name || claims.unique_name || (storedEmail?.split("@")[0] ?? "");
    setIfMissing("fullName", fullName);
    setIfMissing("email", claims.email || storedEmail || "");

    if (claims.iss) setIfMissing("tokenIssuer", claims.iss);
    if (claims.aud)
      setIfMissing(
        "tokenAudience",
        Array.isArray(claims.aud) ? claims.aud[0] : claims.aud
      );
    if (claims.exp) setIfMissing("tokenExp", String(claims.exp));

    setIfMissing("showDayEndModal", "false");
  }

  // build slug from form data
  const slug = React.useMemo(() => {
    const hotelName = slugify(formData.propertyName);
    const city = slugify(formData.city);
    if (!hotelName && !city) return "";
    if (hotelName && city) return `${hotelName}-${city}`;
    return hotelName || city;
  }, [formData.propertyName, formData.city]);

  const prettyUrl = slug
    ? `https://hotelmate.net/hotels/${slug}`
    : `https://hotelmate.net/hotels/`;

  /** ---------- Submit (uses OLD, proven payload + fallbacks) ---------- */
  const createHotelNow = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const raw = localStorage.getItem("hotelmateTokens");
      if (!raw) throw new Error("No access token found. Please log in again.");
      const { accessToken } = JSON.parse(raw);

      // 1) Ensure logo gets uploaded now (even if user didn't click "Upload Logo")
      const resolvedLogoURL =
        (await uploadLogoAndGetUrl(dispatch, stagedLogo, getFullName)) ||
        formData.logoURL || // if already uploaded earlier
        "";

      // 2) Ensure a proper main image object is built (first staged image)
      const mainImage = buildMainHotelImagePayload(
        stagedFiles,
        imageDescription,
        getFullName()
      );

      const now = new Date().toISOString();

      const payload: any = {
        hotelGUID: null,
        finAct: false,
        hotelName: formData.propertyName,
        hotelCode: 101,
        userGUID_HotelOwner: null,
        hotelType: formData.propertyType,
        hotelAddress: formData.address,
        city: formData.city,
        zipCode: formData.zipCode,
        country:
          countries.find((c) => c.country === formData.country)?.flagCode || "",
        hotelPhone: formData.contactPhone,
        hotelEmail: formData.contactEmail,
        hotelWeb: formData.website,
        noOfRooms: Number.isFinite(roomCount) ? roomCount : 0,
        latitude: formData.latitude,
        longitude: formData.longitude,
        currencyCode: formData.currency,
        languageCode: formData.language,
        createdOn: now,
        createdTimeStamp: now,
        lastUpdatedOn: now,
        lastUpdatedTimeStamp: now,
        lastUpdatedBy_UserGUID: null,
        starCatgeory: 0,
        cM_PropertyID: null,
        hotelDesc: formData.description || "",
        isCMActive: false,
        isIBEActive: true,
        ibE_CancellationPolicy: "",
        ibE_ChildPolicy: "",
        ibE_TaxPolicy: "",
        logoURL: resolvedLogoURL, // <-- guaranteed here
        slug: prettyUrl,
        hotelDate: formData.hotelStartDate
          ? new Date(formData.hotelStartDate + "T00:00:00.000Z").toISOString()
          : now,
        isOnTrial: true,
        planId: 1,
        lowestRate: 0,
      };

      // Always include hotelImage in payload (even if null) to match Swagger spec
      payload.hotelImage = mainImage;
      seedLocalUserIfMissing(accessToken);
      console.log("payload : ", JSON.stringify(payload));

      const created = await createHotel({ token: accessToken, payload });
      console.log("payload : ", payload);

      const newHotel = persistNewHotel(created);
      setCreatedHotel({ id: Number(newHotel.id), guid: newHotel.guid });
      setHasPostedHotel(true);

      // Upload the rest of the gallery AFTER create (skip index 0 which we sent in payload)
      // if (stagedFiles.length > 1) {
      //   const rest = stagedFiles.slice(1);
      //   const afterNow = new Date().toISOString();
      //   const fullName = getFullName();
      //   await Promise.allSettled(
      //     rest.map((f, idx) =>
      //       (
      //         dispatch(
      //           createHotelImage({
      //             imageID: 0,
      //             imageFileName: `hotel-image-${Date.now()}-${idx + 1}-${
      //               f.name
      //             }`,
      //             description: imageDescription || "Gallery",
      //             isMain: false,
      //             finAct: false,
      //             createdOn: afterNow,
      //             createdBy: fullName,
      //             updatedBy: fullName,
      //             base64Image: f.base64,
      //             hotelID: Number(newHotel.id),
      //             bucketName: "hotelimage",
      //           } as any)
      //         ) as any
      //       ).unwrap()
      //     )
      //   );
      // }

      await (dispatch(fetchHotelImagesByHotelId(Number(newHotel.id))) as any);
      clearImageForm();
      if (typeof clearLogo === "function") clearLogo();

      // confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

      return created;
      // setTimeout(() => router.replace(`/meal-allocation`), 900);
    } catch (err: any) {
      console.error(err);
      alert("Failed to submit property: " + (err?.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendCongratsEmailOnce = async () => {
    if (propertyEmailSentRef.current) return;
    propertyEmailSentRef.current = true;

    try {
      const toEmail = (
        formData.contactEmail ||
        localStorage.getItem("email") ||
        ""
      ).trim();

      if (!toEmail) return;

      const html = getPropertyCreatedEmailHTML({
        propertyName: formData.propertyName,
        city: formData.city,
        country: formData.country,
        url: slug ? `https://hotelmate.net/hotels/${slug}` : undefined,
      });

      await (dispatch as any)(
        sendCustomEmail({
          toEmail,
          subject: `Property created: ${formData.propertyName}`,
          body: html,
          isHtml: true,
          senderName: "HOTELmate",
        })
      ).unwrap();
    } catch {
      // swallow errors to keep celebration smooth
    }
  };

  const [imageDescription, setImageDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<HotelImage | null>(null);
  const [mainImageId, setMainImageId] = useState<number | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // Files you pick in this step (prior to hotel creation)
  const [stagedFiles, setStagedFiles] = useState<
    { name: string; base64: string; preview: string }[]
  >([]);

  const [uploading, setUploading] = useState(false);

  const getFullName = () =>
    localStorage.getItem("fullName") ||
    JSON.parse(localStorage.getItem("hotelmateTokens") || "{}")?.unique_name ||
    "System";

  const getSelectedHotelId = () => getEffectiveHotelId();

  const fileToDataUrl = (file: File) =>
    new Promise<{ name: string; base64: string; preview: string }>(
      (resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve({
            name: file.name,
            base64: result.split(",")[1], // strip data:image/...;base64,
            preview: result,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }
    );

  const markDeleting = (id: number, on: boolean) =>
    setDeletingIds((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });

  const clearImageForm = () => {
    setSelectedImage(null);
    setImageDescription("");
    setStagedFiles([]);
    setMainImageId(null);
  };

  /** When you pick files in the wizard’s image step */
  const handleWizardFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const items = await Promise.all(files.map(fileToDataUrl));
    setStagedFiles(items);
  };

  /** Upload now if editing existing hotel; otherwise keep staged until submit */
  // REPLACE handleWizardUpload with this:
  const handleWizardUpload = async () => {
    if (!stagedFiles.length) return;

    const hotelId = getEffectiveHotelId();
    if (!hotelId) return; // still no id → stop

    setUploading(true);
    try {
      const now = new Date().toISOString();
      const author = getFullName();

      await Promise.allSettled(
        stagedFiles.map((f, idx) =>
          (
            dispatch(
              createHotelImage({
                imageID: 0,
                hotelID: Number(hotelId), // << attach id
                imageFileName: `hotel-image-${Date.now()}-${idx}-${f.name}`,
                description:
                  imageDescription || (idx === 0 ? "Main image" : "Gallery"),
                isMain: idx === 0,
                finAct: false,
                createdOn: now,
                createdBy: author,
                updatedBy: author,
                base64Image: f.base64,
                bucketName: "hotelimage",
              } as any)
            ) as any
          ).unwrap()
        )
      );

      setStagedFiles([]);
      await (dispatch(fetchHotelImagesByHotelId(Number(hotelId))) as any);
    } catch (e) {
      console.error("Upload failed:", e);
    } finally {
      setUploading(false);
    }
  };

  /** Delete image (only for existing hotels) */
  const handleDeleteImage = async (img: HotelImage) => {
    const hotelId = getSelectedHotelId();
    if (!hotelId) return; // cannot delete staged preview; user can Clear instead

    markDeleting(img.imageID, true);
    try {
      const deletedId = await (
        dispatch(deleteHotelImage(img.imageID)) as any
      ).unwrap();
      if (deletedId) {
        await (dispatch(fetchHotelImagesByHotelId(hotelId)) as any);
      }
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      markDeleting(img.imageID, false);
    }
  };

  function LogoUploadButton() {
    const dispatch = useDispatch() as any;
    const [busy, setBusy] = useState(false);

    const getSelectedHotelId = () => {
      try {
        const sp = localStorage.getItem("selectedProperty");
        if (!sp) return null;
        const { id } = JSON.parse(sp);
        return id || null;
      } catch {
        return null;
      }
    };

    const handleLogoUploadNow = async () => {
      if (!stagedLogo) return;
      setBusy(true);
      try {
        // Reuse the robust helper so body matches the API contract
        const url = await uploadLogoAndGetUrl(
          dispatch,
          stagedLogo,
          getFullName
        );
        if (url) updateFormData("logoURL", url);
        clearLogo();
      } catch (e) {
        console.error("Logo upload failed:", e);
      } finally {
        setBusy(false);
      }
    };

    return (
      <Button
        onClick={handleLogoUploadNow}
        disabled={busy}
        className="rounded-xl"
      >
        {busy ? (
          <span className="inline-flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading logo…
          </span>
        ) : (
          "Upload Logo"
        )}
      </Button>
    );
  }

  async function uploadLogoAndGetUrl(
    dispatch: any,
    stagedLogo: { name: string; base64: string } | null,
    getFullName: () => string
  ): Promise<string | null> {
    if (!stagedLogo) return null;

    const body = {
      imageFileName: `hotel-logo-${Date.now()}-${stagedLogo.name}`,
      base64Image: stagedLogo.base64,
      isMain: false,
      finAct: false,
      createdBy: getFullName(),
      updatedBy: getFullName(),
      bucketName: "hotellogo",
      hotelID: 0, // logo can be independent of hotel if your API allows
    };

    try {
      const res = await (dispatch(uploadHotelImage(body)) as any).unwrap();
      // normalize
      const url = res?.imageUrl || res?.displayUrl || res?.url || null;
      if (url) return url;

      // If API only returns a key/filename, construct your CDN URL here if you have a pattern
      const key = res?.imageFileName || res?.objectKey || null;
      // Example: return key ? `https://cdn.hotelmate.app/hotellogo/${key}` : null;
      return key; // or build CDN URL if needed
    } catch (e) {
      console.error("Logo pre-upload failed:", e);
      return null;
    }
  }

  function buildMainHotelImagePayload(
    stagedFiles: { name: string; base64: string }[],
    description: string,
    author: string
  ) {
    if (!stagedFiles.length) return null;

    const first = stagedFiles[0];
    const now = new Date().toISOString();

    return {
      imageID: 0,
      hotelID: 0, // server binds this to the new hotel
      imageFileName: `hotel-image-${Date.now()}-main-${first.name}`,
      description: description || "Main image",
      isMain: true, // ensure main
      finAct: true, // <-- make this true on create
      createdOn: now,
      createdBy: author,
      updatedOn: now,
      updatedBy: author,
      base64Image: first.base64, // REQUIRED by Swagger
      bucketName: "hotelimage", // REQUIRED by Swagger
    };
  }

  /** Save “Main” choice (only when editing existing hotel) */
  const handleSaveMainImage = async () => {
    const hotelId = getSelectedHotelId();
    if (!hotelId || mainImageId == null) return;

    // Need current list to know previous main (optional optimization)
    // You can fetch & compute here if you don’t keep images in this file.
    await (dispatch(fetchHotelImagesByHotelId(hotelId)) as any);
    // If you already have images in a selector, compute prev/new and put both.
    // To keep snippet compact, just PUT the chosen one to isMain=true
    const fullName = getFullName();

    try {
      // mark chosen as main
      await (
        dispatch(
          updateHotelImage({
            imageID: mainImageId,
            // other fields must be provided by your slice’s API – if you
            // require full object, refetch images and merge fields here.
            isMain: true,
            updatedBy: fullName,
          } as any)
        ) as any
      ).unwrap();

      // backend should unset others; if not, loop others and set false.
      await (dispatch(fetchHotelImagesByHotelId(hotelId)) as any);
    } catch (e) {
      console.error("Set main failed:", e);
    }
  };

  useEffect(() => {
    const hid = getSelectedHotelId();
    if (hid) dispatch(fetchHotelImagesByHotelId(hid) as any);
  }, [dispatch, currentStep]);

  console.log("formData : ", formData);

  const range = (a: number, b: number) =>
    Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate(); // m: 1-12

  // compute selectable years (oldest 1950 → this year)
  const selectableYears = range(1950, THIS_YEAR);

  // compute selectable months respecting "no future"
  const selectableMonths = (() => {
    if (!startYear || startYear < THIS_YEAR) return range(1, 12);
    return range(1, THIS_MONTH);
  })();

  // compute selectable days respecting month + "no future"
  const selectableDays = (() => {
    if (!startYear || !startMonth) return [];
    const dim = daysInMonth(startYear, startMonth);
    const maxDay =
      startYear === THIS_YEAR && startMonth === THIS_MONTH
        ? Math.min(dim, THIS_DAY)
        : dim;
    return range(1, maxDay);
  })();

  // whenever Y/M/D change, sync a proper YYYY-MM-DD to formData (and clamp future)
  useEffect(() => {
    if (!startYear || !startMonth || !startDay) return;

    // Clamp to today if user somehow selected a future combo
    let y = startYear;
    let m = startMonth;
    let d = startDay;

    if (y > THIS_YEAR) y = THIS_YEAR;
    if (y === THIS_YEAR && m > THIS_MONTH) m = THIS_MONTH;
    const maxForMonth = daysInMonth(y, m);
    let maxD = maxForMonth;
    if (y === THIS_YEAR && m === THIS_MONTH)
      maxD = Math.min(maxForMonth, THIS_DAY);
    if (d > maxD) d = maxD;

    const pad = (n: number) => String(n).padStart(2, "0");
    const iso = `${y}-${pad(m)}-${pad(d)}`;

    setFormData((prev) => ({ ...prev, hotelStartDate: iso }));
  }, [startYear, startMonth, startDay]);

  /** ---------- Steps (kept new UI) ---------- */
  const steps = [
    {
      title: "Welcome to Hotel Mate",
      subtitle: "Your property creation journey begins now!",
      icon: <Building2 className="w-16 h-16 text-teal-600" />,
      content: (
        <div className="text-center space-y-8 py-8">
          <div className="w-32 h-32 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Building2 className="w-16 h-16 text-teal-600" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent">
              Create Your Property
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              We'll guide you through setting up your property profile step by
              step. This will only take a few minutes.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
            <div className="w-2 h-2 bg-gradient-to-r from-sky-400 to-sky-600 rounded-full"></div>
            <span>Quick & Easy Setup</span>
          </div>
        </div>
      ),
    },
    {
      title: "What type of Property Type do you want to create?",
      subtitle: "Choose most suitable Property type from the list",
      icon: <Building2 className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-8 h-8 text-teal-600" />
            </div>
            <p className="text-sm text-slate-500">
              Choose the most suitable Property type from the list
            </p>
          </div>

          {/* Two-column card list, no images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hotelTypes.map((t) => {
              const isSelected = formData.propertyType === t.hotelType;
              return (
                <button
                  type="button"
                  key={t.hotelTypeID}
                  onClick={() => updateFormData("propertyType", t.hotelType)}
                  className={`relative w-full text-left rounded-xl border p-4 transition-all duration-200 focus:outline-none focus:ring-2 ${
                    isSelected
                      ? "border-sky-400 ring-sky-600 bg-white"
                      : "border-slate-200 hover:shadow"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-sky-600 text-white shadow">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <div className="font-medium text-slate-800 text-sm">
                        {t.hotelType}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      title: "When do you want to start reservations from Hotel Mate?",
      subtitle: "",
      icon: <Calendar className="w-8 h-8 text-teal-600" />, // you already import Calendar elsewhere; if not, import it from lucide-react
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow">
              <Calendar className="w-8 h-8 text-teal-600" />
            </div>
            <p className="text-sm text-slate-500">
              Choose year, month, and day — no typing needed
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Year */}
              <div className="space-y-1">
                <Label className="text-slate-600">Year</Label>
                <Select
                  value={startYear ? String(startYear) : ""}
                  onValueChange={(v) => {
                    const y = Number(v);
                    setStartYear(y);
                    // if month/day currently beyond today for this year, they will be clamped via effect
                  }}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-white text-black">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white text-black">
                    {selectableYears
                      .slice() // ensure non-mutation
                      .reverse() // newest first
                      .map((y) => (
                        <SelectItem
                          key={y}
                          value={String(y)}
                          className="py-2 text-black"
                        >
                          {y}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month */}
              <div className="space-y-1">
                <Label className="text-slate-600">Month</Label>
                <Select
                  value={startMonth ? String(startMonth) : ""}
                  onValueChange={(v) => setStartMonth(Number(v))}
                  disabled={!startYear}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-white disabled:opacity-60 text-black">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white text-black">
                    {selectableMonths.map((m) => (
                      <SelectItem key={m} value={String(m)} className="py-2">
                        {new Date(2000, m - 1, 1).toLocaleString(undefined, {
                          month: "long",
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Day */}
              <div className="space-y-1">
                <Label className="text-slate-600">Day</Label>
                <Select
                  value={startDay ? String(startDay) : ""}
                  onValueChange={(v) => setStartDay(Number(v))}
                  disabled={!startYear || !startMonth}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-white disabled:opacity-60 text-black">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white max-h-72 text-black">
                    {selectableDays.map((d) => (
                      <SelectItem
                        key={d}
                        value={String(d)}
                        className="py-2 text-black"
                      >
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Friendly hint + selected chip */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* <div className="rounded-xl bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-200 px-3 py-1.5 text-xs text-sky-800">
                Max: {THIS_YEAR}-{String(THIS_MONTH).padStart(2, "0")}-
                {String(THIS_DAY).padStart(2, "0")}
              </div> */}
              {formData.hotelStartDate && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-900">
                  Selected: {formData.hotelStartDate}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },

    {
      title: "What's your property name?",
      subtitle: "Enter the name guests will see when booking",
      icon: <FileText className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-sky-600" />
            </div>
          </div>
          <div className="space-y-4">
            <Input
              placeholder="Enter your property name"
              value={formData.propertyName}
              onChange={(e) => updateFormData("propertyName", e.target.value)}
              className="h-16 bg-white/80 backdrop-blur-sm border-slate-200 rounded-2xl text-black text-lg px-6 shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Select your home currency",
      subtitle: "This will be used for pricing and financial reports",
      icon: <DollarSign className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-10 h-10 text-teal-600" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              {/* <HoverCard openDelay={100} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <Info className="h-5 w-5 text-slate-400 cursor-help" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80 rounded-xl">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Home Currency</p>
                    <p className="text-sm text-slate-600">
                      This will be the default currency for your property
                      pricing and financial reports. It cannot be changed later.
                    </p>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <span className="text-sm text-slate-500">
                Currency cannot be changed later
              </span> */}
            </div>
            <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-100 border border-amber-200 shadow-sm p-4 flex items-start gap-3">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Please note
                </p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  This currency will be used for all accounting and financial
                  reports in your property, and{" "}
                  <span className="font-medium">
                    cannot be changed once confirmed
                  </span>
                  .
                </p>
              </div>
            </div>
            <Select
              value={formData.currency}
              onValueChange={(v) => {
                updateFormData("currency", v);
                setHotelCurrency(v);
              }}
            >
              <SelectTrigger className="h-16 bg-white/80 backdrop-blur-sm border-slate-200 rounded-2xl text-lg shadow-sm hover:shadow-md transition-all duration-200">
                <SelectValue placeholder="Choose your currency" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white hover:bg-slate-100">
                {currencies.map((c) => (
                  <SelectItem
                    key={c.currencyID ?? c.currencyId ?? c.currencyCode}
                    value={c.currencyCode}
                    className="py-3 text-base"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-500">
                        {c.currencyCode}
                      </span>
                      <span className="text-slate-500">- {c.currencyName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      title: "Choose your primary language",
      subtitle: "Select the main language for your property",
      icon: <Languages className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Languages className="w-10 h-10 text-teal-600" />
            </div>
          </div>
          <div className="space-y-4">
            <Select
              value={formData.language}
              onValueChange={(v) => updateFormData("language", v)}
            >
              <SelectTrigger className="h-16 bg-white backdrop-blur-sm border-slate-200 rounded-2xl text-lg text-black shadow-sm hover:shadow-md transition-all duration-200">
                <SelectValue placeholder="Select primary language" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white hover:bg-slate-100">
                {languages.map((l) => (
                  <SelectItem
                    key={l.languageID ?? l.languageId ?? l.languageCode}
                    value={l.languageCode}
                    className="py-3 text-base text-black bg-white"
                  >
                    {l.language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      title: "Which country is your property in?",
      subtitle: "Select your property's location",
      icon: <Flag className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flag className="w-10 h-10 text-teal-600" />
            </div>
          </div>
          <div className="space-y-4">
            <Select
              value={formData.country}
              onValueChange={(v) => updateFormData("country", v)}
            >
              <SelectTrigger className="h-16 bg-white/80 backdrop-blur-sm border-slate-200 rounded-2xl text-lg text-black shadow-sm hover:shadow-md transition-all duration-200">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white">
                {countries.map((c) => (
                  <SelectItem
                    key={c.countryId ?? c.country}
                    value={c.country}
                    className="py-3 text-base text-black"
                  >
                    {c.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      title: "What's your street address?",
      subtitle: "Enter the full street address of your property",
      icon: <Home className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-10 h-10 text-teal-600" />
            </div>
          </div>
          <div className="space-y-4">
            <Input
              placeholder="123 Main Street, Suite 100"
              value={formData.address}
              onChange={(e) => updateFormData("address", e.target.value)}
              className="h-16 bg-white/80 backdrop-blur-sm border-slate-200 rounded-2xl text-lg text-black px-6 shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Which city is your property in?",
      subtitle: "Enter the city name",
      icon: <MapIcon className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapIcon className="w-10 h-10 text-teal-600" />
            </div>
          </div>
          <div className="space-y-4">
            <Input
              placeholder="Enter city name"
              value={formData.city}
              onChange={(e) => updateFormData("city", e.target.value)}
              className="h-16 bg-white/80 backdrop-blur-sm border-slate-200 rounded-2xl text-lg text-black px-6 shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
        </div>
      ),
    },

    {
      title: "What's your ZIP or postal code?",
      subtitle: "Enter your postal code",
      icon: <Mail className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-10 h-10 text-teal-600" />
            </div>
          </div>
          <div className="space-y-4">
            <Input
              placeholder="Enter ZIP or postal code"
              value={formData.zipCode}
              onChange={(e) => updateFormData("zipCode", e.target.value)}
              className="h-16 bg-white/80 backdrop-blur-sm border-slate-200 rounded-2xl text-lg text-black px-6 shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Pin your property on the map",
      subtitle: "Drag the pin or click to set exact GPS coordinates",
      icon: <MapPin className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-teal-600" />
            </div>
          </div>

          {/** Build "City, Country" (or just "Country") */}
          <MapPicker
            apiKey={GOOGLE_API_KEY}
            lat={formData.latitude}
            lng={formData.longitude}
            geocodeParts={{
              propertyName: (formData.propertyName || "").trim(),
              city: (formData.city || "").trim(),
              country: (formData.country || "").trim(),
            }}
            // Optional: if you already build a combined string elsewhere
            // geocodeAddress={[formData.propertyName, formData.city, formData.country].filter(Boolean).join(", ")}
            showSearchBar
            onChange={({ latitude, longitude }) => {
              setFormData((prev) => ({ ...prev, latitude, longitude }));
            }}
          />

          <div className="text-center text-sm text-slate-500">
            These coordinates will be saved as{" "}
            <span className="font-semibold text-slate-700">Latitude</span> and{" "}
            <span className="font-semibold text-slate-700">Longitude</span> in
            your property profile.
          </div>
        </div>
      ),
    },

    {
      title: "What's your property email?",
      subtitle:
        "You will receive Booking Notification & Guest Inquiries to this Email",
      icon: <Mail className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-10 h-10 text-teal-600" />
            </div>
          </div>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="contact@yourproperty.com"
              value={formData.contactEmail}
              onChange={(e) => updateFormData("contactEmail", e.target.value)}
              className="h-16 bg-white/80 backdrop-blur-sm border-slate-200 rounded-2xl text-lg text-black px-6 shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
        </div>
      ),
    },
    {
      title: "What's property phone number?",
      subtitle: "Enter the phone number for guest contact",
      icon: <Phone className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-10 h-10 text-teal-600" />
            </div>
          </div>
          <div className="space-y-4">
            <Input
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.contactPhone}
              onChange={(e) => updateFormData("contactPhone", e.target.value)}
              className="h-16 bg-white/80 backdrop-blur-sm border-slate-200 rounded-2xl text-lg text-black px-6 shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Do you have a website?",
      subtitle: "Enter your website URL (optional)",
      icon: <Globe className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-10 h-10 text-teal-600" />
            </div>
          </div>
          <div className="space-y-4">
            <Input
              type="url"
              placeholder="https://yourproperty.com"
              value={formData.website}
              onChange={(e) => updateFormData("website", e.target.value)}
              className="h-16 bg-white/80 backdrop-blur-sm border-slate-200 rounded-2xl text-lg text-black px-6 shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500">
              You can skip this step if you don't have a website
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Tell us about your property",
      subtitle: "Describe what makes your property special",
      icon: <FileText className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-teal-600" />
            </div>
          </div>
          <div className="space-y-4">
            <Textarea
              placeholder="Describe your property, amenities, and what makes it special for guests..."
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              className="min-h-32 bg-white/80 backdrop-blur-sm border-slate-200 rounded-2xl text-lg text-black px-6 py-4 shadow-sm hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
            />

            {/* Write with AI button */}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleWriteWithAI}
                disabled={aiBusy}
                className="rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow hover:brightness-110 transition-all duration-200"
              >
                {aiBusy ? (
                  <span className="inline-flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Writing…
                  </span>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Write with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ),
    },

    {
      title: "Upload your property logo",
      subtitle: "A square logo looks best (e.g., 512×512)",
      icon: <ImageIcon className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="space-y-6 py-4">
          {/* Dropzone (single file) */}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 sm:p-6 text-center hover:border-sky-300 hover:bg-white transition">
            <label
              htmlFor="property-logo"
              className="inline-flex cursor-pointer select-none items-center gap-2 rounded-xl px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <ImageIcon className="h-5 w-5 text-slate-500" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">Click to upload logo</div>
                <div className="text-xs text-slate-500">
                  PNG / JPG — square preferred
                </div>
              </div>
            </label>
            <Input
              id="property-logo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoFileChange}
            />
          </div>

          {/* Preview */}
          {stagedLogo && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">{stagedLogo.name}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearLogo}
                  disabled={logoUploading}
                >
                  Clear
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="relative overflow-hidden rounded-xl border bg-white shadow-sm aspect-square">
                  <img
                    src={stagedLogo.preview}
                    alt="Logo preview"
                    className="w-full h-full object-contain p-3"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Your logo will upload when you press <b>Continue</b>.
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Choose your subscription",
      subtitle: "First 5 rooms $39/mo • Then $2 per extra room",
      icon: <DollarSign className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="py-4">
          {/* no checkout UI here; just the rooms/pricing selector */}
          <div className="py-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-400 to-sky-600 p-1 shadow-lg">
              <div className="rounded-[22px] bg-white/95 backdrop-blur p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-500">
                      Estimated monthly
                    </div>
                    <div className="mt-1 leading-none">
                      <span className="text-4xl font-extrabold text-slate-900">
                        ${computeTotal(roomCount).toFixed(2)}
                      </span>
                      <span className="ml-2 text-slate-500">/mo</span>
                    </div>
                  </div>

                  <div className="rounded-full bg-teal-600/10 text-sky-700 px-3 py-1 text-xs font-semibold">
                    $
                    {(computeTotal(roomCount) / Math.max(1, roomCount)).toFixed(
                      2
                    )}{" "}
                    per room
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-slate-700">
                      Rooms
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {roomCount}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 w-9 rounded-xl"
                        onClick={() => setRoomCount((n) => Math.max(5, n - 1))}
                      >
                        −
                      </Button>
                      <Input
                        type="number"
                        min={5}
                        max={200}
                        value={roomCount}
                        onChange={(e) => {
                          const v = Math.max(
                            5,
                            Math.min(200, Number(e.target.value || 5))
                          );
                          setRoomCount(v);
                        }}
                        className="h-9 w-20 text-center rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 w-9 rounded-xl"
                        onClick={() =>
                          setRoomCount((n) => Math.min(200, n + 1))
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={5}
                    max={200}
                    value={roomCount}
                    onChange={(e) =>
                      setRoomCount(parseInt(e.target.value || "5", 10))
                    }
                    className="mt-3 w-full accent-teal-600"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                    <span>5</span>
                    <span>200</span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">
                      Base
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                      $39
                    </div>
                    <div className="text-[11px] text-slate-500">Up to 10</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">
                      Extras
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                      {Math.max(0, roomCount - 5)} × $2
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ${(Math.max(0, roomCount - 5) * 2).toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">
                      Total
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">
                      ${computeTotal(roomCount).toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-500">Per month</div>
                  </div>
                </div>

                <div className="mt-4 text-center text-xs text-slate-500">
                  Adjust rooms anytime as your property grows.
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // NEW: Payment step immediately after the plan selection
    {
      title: "Pay for your subscription",
      subtitle: "Secure checkout powered by Stripe (embedded)",
      icon: <DollarSign className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="py-4">
          {!checkoutClientSecret ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Click the button to open checkout right here. No redirects.
              </p>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    await startEmbeddedCheckout({
                      rooms: roomCount,
                      currency: (formData.currency || "USD").toLowerCase(),
                      email: (
                        formData.contactEmail ||
                        localStorage.getItem("email") ||
                        ""
                      ).trim(),
                      propertyName: formData.propertyName,
                      city: formData.city,
                      country: formData.country,
                    });
                  } catch (e: any) {
                    alert("Checkout error: " + (e?.message || "Unknown error"));
                  }
                }}
                className="rounded-2xl"
              >
                Open embedded checkout
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border bg-white p-2">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{
                  clientSecret: checkoutClientSecret,
                  onComplete: () => {
                    setPaymentComplete(true);
                  },
                }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>

              <div className="mt-3 text-xs text-slate-500">
                After successful payment, you’ll be brought back here with a
                green “Continue” button to proceed.
              </div>
            </div>
          )}

          {paymentComplete && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 text-sm">
              ✅ Payment confirmed. You can continue.
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Upload property images",
      subtitle: "Add a few great shots and pick a main image",
      icon: <ImageIcon className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="space-y-6 py-4">
          {/* Dropzone */}
          <div
            className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 sm:p-6 text-center hover:border-sky-300 hover:bg-white transition"
            onPaste={(e) => {
              const items = Array.from(e.clipboardData?.items ?? []);
              const files = items
                .map((it) => (it.kind === "file" ? it.getAsFile() : null))
                .filter(Boolean) as File[];
              if (files.length) {
                const fake = { target: { files } } as any;
                handleWizardFileChange(fake);
              }
            }}
          >
            <label
              htmlFor="property-images"
              className="inline-flex cursor-pointer select-none items-center gap-2 rounded-xl px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <ImageIcon className="h-5 w-5 text-slate-500" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">Click to upload</div>
                <div className="text-xs text-slate-500">
                  or drag & drop / paste (PNG, JPG)
                </div>
              </div>
            </label>
            <Input
              id="property-images"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleWizardFileChange}
            />
          </div>

          {/* Staged previews (pre-submit if no hotel; or pre-upload before pressing Upload) */}
          {stagedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {stagedFiles.length} file{stagedFiles.length > 1 ? "s" : ""}{" "}
                  ready
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStagedFiles([])}
                  disabled={uploading}
                >
                  Clear
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {stagedFiles.map((f, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-xl border bg-white shadow-sm"
                  >
                    <img
                      src={f.preview}
                      alt={f.name}
                      className="h-36 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setStagedFiles((arr) =>
                          arr.filter((_, idx) => idx !== i)
                        )
                      }
                      className="absolute right-2 top-2 hidden rounded-full  p-1 shadow group-hover:block "
                      title="Remove"
                    >
                      <Trash2 />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 text-[11px] text-white">
                      {f.name}
                    </div>
                  </div>
                ))}
              </div>

              {/* Only show description field when needed */}
              <Textarea
                placeholder="Optional description (e.g., Lobby, Pool, Deluxe Room)"
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                className="min-h-20 rounded-2xl"
              />

              <p className="text-[11px] text-slate-400">
                No property yet? These will upload automatically right after
                creation.
              </p>
            </div>
          )}

          {/* Existing gallery (only when a hotel is already selected) */}
        </div>
      ),
    },
    {
      title: "Pay for your subscription",
      subtitle: "Secure checkout powered by Stripe (embedded)",
      icon: <DollarSign className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="py-4">
          {!checkoutClientSecret ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Click the button to open checkout right here. No redirects.
              </p>
              <Button
                type="button"
                onClick={async () => {
                  try {
                    await startEmbeddedCheckout({
                      rooms: roomCount,
                      currency: (formData.currency || "USD").toLowerCase(),
                      email: (
                        formData.contactEmail ||
                        localStorage.getItem("email") ||
                        ""
                      ).trim(),
                      propertyName: formData.propertyName,
                      city: formData.city,
                      country: formData.country,
                    });
                  } catch (e: any) {
                    alert("Checkout error: " + (e?.message || "Unknown error"));
                  }
                }}
                className="rounded-2xl"
              >
                Open embedded checkout
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border bg-white p-2">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret: checkoutClientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>

              <div className="mt-3 text-xs text-slate-500">
                After successful payment, you’ll be brought back here with a
                green “Continue” button to proceed.
              </div>
            </div>
          )}

          {paymentComplete && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 text-sm">
              ✅ Payment confirmed. You can continue.
            </div>
          )}
        </div>
      ),
    },

    {
      title: "Your property is ready to be created!",
      subtitle: "We'll set everything up for you",
      icon: <CheckCircle className="w-8 h-8 text-teal-600" />,
      content: (
        <div className="text-center space-y-8 py-8">
          <div className="w-32 h-32 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle className="w-16 h-16 text-teal-600" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent">
              All Set!
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              Your property profile is complete. We'll create your account and
              take you to your dashboard.
            </p>
          </div>
          {isSubmitting && (
            <div className="flex items-center justify-center space-x-3">
              <div className="w-6 h-6 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-600 font-medium">
                Creating your property...
              </span>
            </div>
          )}
        </div>
      ),
    },
  ];

  /** ---------- Guard for “Continue” button ---------- */
  // helpers (put above canProceed)
  const isNonEmpty = (s?: string) => (s ?? "").trim().length > 0;
  const isEmail = (s?: string) =>
    !!s && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

  /** ---------- Guard for “Continue” button (title-based, resilient) ---------- */
  const canProceed = () => {
    const title = steps[currentStep].title.toLowerCase();

    if (title.includes("welcome")) return true;
    if (title.includes("what type of property"))
      return isNonEmpty(formData.propertyType);
    if (title.includes("when do you want"))
      return isNonEmpty(formData.hotelStartDate);
    if (title.includes("what's your property name"))
      return isNonEmpty(formData.propertyName);
    if (title.includes("select your home currency"))
      return isNonEmpty(formData.currency);
    if (title.includes("choose your primary language"))
      return isNonEmpty(formData.language);
    if (title.includes("which country is your property"))
      return isNonEmpty(formData.country);
    if (title.includes("what's your street address"))
      return isNonEmpty(formData.address);
    if (title.includes("which city is your property"))
      return isNonEmpty(formData.city);
    if (title.includes("zip") || title.includes("postal"))
      return isNonEmpty(formData.zipCode);

    if (title.includes("pin your property")) {
      const lat = Number.parseFloat(formData.latitude);
      const lng = Number.parseFloat(formData.longitude);
      return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
      );
    }

    if (title.includes("what's your property email"))
      return isEmail(formData.contactEmail);
    if (title.includes("what's property phone number"))
      return isNonEmpty(formData.contactPhone);
    if (title.includes("do you have a website")) return true; // optional
    if (title.includes("tell us about your property"))
      return isNonEmpty(formData.description);
    if (title.includes("choose your subscription")) return true;
    if (title.includes("pay for your subscription")) return true;
    if (title.includes("your property is ready")) return true;

    return true;
  };

  const nextStep = async () => {
    const title = steps[currentStep].title.toLowerCase();
    const isLast = currentStep === steps.length - 1;

    const nextIndex = currentStep + 1;
    const nextTitle = steps[nextIndex]?.title?.toLowerCase?.() || "";

    // 0) If we’re about to show the payment step, pre-create a Checkout session (nice UX)
    if (
      nextTitle.includes("pay for your subscription") &&
      !checkoutClientSecret
    ) {
      try {
        await startEmbeddedCheckout({
          rooms: roomCount,
          currency: (formData.currency || "USD").toLowerCase(),
          email: (
            formData.contactEmail ||
            localStorage.getItem("email") ||
            ""
          ).trim(),
          propertyName: formData.propertyName,
          city: formData.city,
          country: formData.country,
        });
      } catch {
        // Non-blocking; user can click the button inside the step.
      }
    }

    // 1) Create the hotel exactly when leaving "Choose your subscription"
    if (title.includes("choose your subscription") && !hasPostedHotel) {
      const created = await createHotelNow();
      if (!created) return; // stop if creation failed
    }

    // 2) If we’re on the images step and we already have a hotel, push staged files
    if (title.includes("upload property images")) {
      const hid = getEffectiveHotelId();
      if (stagedFiles.length > 0 && hid) {
        await handleWizardUpload();
      }
    }

    // 3) If we’re on the logo step and we have a staged logo, upload it
    if (title.includes("upload your property logo") && stagedLogo) {
      setLogoUploading(true);
      try {
        const url = await uploadLogoAndGetUrl(
          dispatch,
          stagedLogo,
          getFullName
        );
        if (url) updateFormData("logoURL", url);
        clearLogo();
      } catch (e) {
        console.error("Logo upload failed:", e);
      } finally {
        setLogoUploading(false);
      }
    }

    // 4) Navigate forward or finish
    if (!isLast) {
      setCurrentStep((s) => s + 1);
      return;
    }

    // Final step: send email + confetti + navigate
    await sendCongratsEmailOnce();
    confetti({ particleCount: 140, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => router.replace(`/meal-allocation`), 900);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  /** ---------- Render ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex flex-col">
      <div className="top-10 right-10 absolute">
        <VideoButton
          onClick={() => setShowRawOverlay(true)}
          label="Watch Video"
        />
      </div>
      {/* Header */}
      <div className="flex items-center justify-around p-6">
        <Button
          variant="ghost"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 hover:bg-white/50 rounded-xl px-4 py-2 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="text-sm font-medium text-slate-600  px-4 py-2 rounded-full flex flex-row gap-6 items-center">
          <div>
            {currentStep + 1}/{steps.length}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center mb-2">
        <Image src={Logo} alt="Logo" className="mx-auto w-auto h-8" />
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-8">
        <div className="w-full bg-white/30 rounded-full h-3 shadow-inner">
          <div
            className="bg-gradient-to-r from-sky-400 to-sky-600 h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8 flex items-center justify-center">
        <Card className="max-w-lg w-full border-0 shadow-2xl bg-white/90 backdrop-blur-md rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-6 pt-8">
            <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription className="text-slate-600 text-base">
              {steps[currentStep].subtitle}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8">
            {steps[currentStep].content}
          </CardContent>

          <CardFooter className="px-8 pt-6 pb-8">
            <Button
              onClick={nextStep}
              disabled={
                !canProceed() ||
                isSubmitting ||
                logoUploading ||
                (steps[currentStep].title
                  .toLowerCase()
                  .includes("upload property images") &&
                  uploading)
              }
              className="w-full h-16 bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-800 hover:to-sky-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
            >
              {currentStep === steps.length - 1 ? (
                isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Property...
                  </div>
                ) : (
                  "Create Property"
                )
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <VideoOverlay
        videoUrl={videoUrl}
        isOpen={showRawOverlay}
        onClose={() => setShowRawOverlay(false)}
      />
    </div>
  );
}

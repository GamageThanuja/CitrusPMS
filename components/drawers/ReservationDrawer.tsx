"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Copy,
  Facebook,
  Percent,
  DollarSign,
  MailIcon,
  MessageCircle,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useTranslatedText } from "@/lib/translation";
import { toast } from "sonner";

// ⬇️ add your typed hooks
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchHotelByGuid,
  selectHotelByGuid,
} from "@/redux/slices/fetchHotelByGuidSlice";
import {
  sendCustomEmail,
  selectEmailSending,
} from "@/redux/slices/emailSendSlice";
import VideoOverlay from "../videoOverlay";
import VideoButton from "../videoButton";
import { useTutorial } from "@/hooks/useTutorial";

type ReservationDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function slugify(v?: string) {
  return (v || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ReservationDrawer({
  open,
  onOpenChange,
}: ReservationDrawerProps) {
  const [discountType, setDiscountType] = useState<"percentage" | "amount">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState("");
  const reservationLinkRef = useRef<HTMLInputElement>(null);
  const [showEmailField, setShowEmailField] = useState(false);
  const [emailTo, setEmailTo] = useState("");

  const dispatch = useAppDispatch();
  const { data: hotel, status, error } = useAppSelector(selectHotelByGuid);

  // i18n
  const createReservation = useTranslatedText("Create Reservation");
  const discountSettings = useTranslatedText("Discount Settings");
  const percentage = useTranslatedText("Percentage");
  const amount = useTranslatedText("Amount");
  const reservationLink = useTranslatedText("Reservation Link");
  const shareVia = useTranslatedText("Share via");
  const apply = useTranslatedText("Apply");
  const shareTextT = useTranslatedText("Book your stay at");
  const reservationLinkFor = useTranslatedText("Reservation link for");
  const ourHotel = useTranslatedText("our hotel");
  const autoFrom = useTranslatedText("Auto from");
  const share = useTranslatedText("Share");

  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial("onBoarding", "taxes");

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  // fetch the hotel when the drawer opens
  useEffect(() => {
    if (open) dispatch(fetchHotelByGuid());
  }, [open, dispatch]);

  // build slug from API data
  const slug = useMemo(() => {
    const hotelName = slugify(hotel?.hotelName);
    const city = slugify(hotel?.city);
    if (!hotelName && !city) return "";
    if (hotelName && city) return `${hotelName}-${city}`;
    return hotelName || city;
  }, [hotel]);

  const prettyUrl = slug
    ? `https://hotelmate.net/hotels/${slug}`
    : `https://hotelmate.net/hotels/`;

  const copyReservationLink = async () => {
    try {
      await navigator.clipboard.writeText(prettyUrl);
    } catch {
      if (reservationLinkRef.current) {
        reservationLinkRef.current.select();
        document.execCommand("copy");
      }
    }
  };

  const shareMessage = `${shareTextT} ${hotel?.hotelName || ""} ${
    hotel?.city ? "• " + hotel.city : ""
  } — ${prettyUrl}`;
  const encodedMsg = encodeURIComponent(shareMessage);
  const encodedURL = encodeURIComponent(prettyUrl);
  const encodedSubject = encodeURIComponent(
    `${reservationLinkFor} ${hotel?.hotelName || ourHotel}`
  );

  const whatsappHref = `https://wa.me/?text=${encodedMsg}`;
  const smsHref = `sms:?&body=${encodedMsg}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodedURL}`;

  const canUseWebShare =
    typeof navigator !== "undefined" && "share" in navigator;
  const onNativeShare = async () => {
    try {
      await navigator.share({
        title: hotel?.hotelName || "Hotel",
        text: shareMessage,
        url: prettyUrl,
      });
    } catch {}
  };

  const emailSubject = `${reservationLinkFor} ${hotel?.hotelName || ourHotel}`;
  const emailBody = `${shareTextT} ${hotel?.hotelName || ""} ${
    hotel?.city ? "• " + hotel.city : ""
  } — ${prettyUrl}`;
  const sendingEmail = useAppSelector(selectEmailSending);
  const onSendEmail = () => {
    if (!emailTo?.trim()) return;
    const target = emailTo.trim();
    dispatch(
      sendCustomEmail({
        toEmail: target,
        subject: emailSubject,
        body: emailBody,
        isHtml: false,
      })
    )
      .unwrap()
      .then(() => {
        setEmailTo("");
        setShowEmailField(false);
        toast.success("Email sent", {
          description: `Reservation link shared to ${target}`,
        });
      });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle>{createReservation}</SheetTitle>
          <SheetDescription>
            {useTranslatedText(
              "Create a new reservation and share it with your guests."
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 py-4 ">
          <Separator className="my-4" />

          {/* Reservation / Slug Link */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base">{reservationLink}</Label>
              {(hotel?.hotelName || hotel?.city) && (
                <span className="text-xs text-muted-foreground">
                  {autoFrom} {hotel?.hotelName || "—"}{" "}
                  {hotel?.city ? `• ${hotel.city}` : ""}
                  {status === "loading" ? " — loading…" : ""}
                  {status === "failed" && error ? ` — ${error}` : ""}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Input ref={reservationLinkRef} readOnly value={prettyUrl} />
              <Button
                variant="outline"
                size="icon"
                onClick={copyReservationLink}
                className="rounded-full"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-2 relative">
            <Label className="text-base">{shareVia}</Label>
            <div className="flex items-center gap-2 mt-1">
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <Button variant="outline" className="rounded-full px-4">
                  {/* WhatsApp glyph */}
                  <svg
                    className="h-4 w-4 mr-2"
                    viewBox="0 0 32 32"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M19.11 17.04c-.25-.12-1.46-.72-1.7-.8-.23-.08-.39-.12-.55.12-.16.23-.64.8-.79.96-.15.16-.29.18-.54.06-.25-.12-1.05-.38-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.38-.43.13-.14.16-.25.25-.41.08-.16.04-.3-.02-.42-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43-.14 0-.31-.01-.47-.01s-.43.06-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.44 1.01 2.61.12.17 1.74 2.71 4.22 3.8.59.26 1.05.41 1.41.53.59.19 1.12.17 1.55.1.47-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29z" />
                    <path d="M16 3C9.37 3 4 8.37 4 15c0 2.15.63 4.15 1.71 5.83L4 29l8.35-1.64C14.1 27.78 15.04 28 16 28c6.63 0 12-5.37 12-12S22.63 3 16 3zm0 22.5c-.86 0-1.7-.13-2.49-.38l-.18-.06-4.93.97.95-4.81-.09-.19C8.5 19.2 8 17.15 8 15 8 9.93 12.02 6 16.99 6 22.07 6 26 9.93 26 15s-3.93 10.5-10 10.5z" />
                  </svg>
                  WhatsApp
                </Button>
              </a>

              <Button
                variant="outline"
                className="rounded-full px-4 flex items-center"
                onClick={() => setShowEmailField(!showEmailField)}
              >
                <MailIcon className="h-4 w-4 mr-2" />
                Email
              </Button>

              <a href={smsHref}>
                <Button variant="outline" className="rounded-full px-4">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  SMS
                </Button>
              </a>

              <a href={facebookHref} target="_blank" rel="noreferrer">
                <Button variant="outline" className="rounded-full px-4">
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
              </a>
            </div>

            {showEmailField && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50">
                <div className="flex items-center gap-2">
                  <Input
                    type="email"
                    placeholder="Enter email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full flex-1"
                  />
                  <Button
                    variant="secondary"
                    className="rounded-full"
                    onClick={onSendEmail}
                    disabled={sendingEmail || !emailTo.trim()}
                  >
                    {sendingEmail ? "Sending..." : share}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <VideoOverlay
          videoUrl={videoUrl}
          isOpen={showRawOverlay}
          onClose={() => setShowRawOverlay(false)}
        />

        <div className="top-10 right-10 absolute">
          <VideoButton
            onClick={() => setShowRawOverlay(true)}
            label="Watch Video"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

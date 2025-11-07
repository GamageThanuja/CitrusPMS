// --- SecondGuestDrawer.tsx (or place below in same file) ---
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDispatch } from "react-redux";

// controllers/slices you already use elsewhere
import { createGuestProfile } from "@/controllers/guestProfileMasterController";
import { getAllCountries } from "@/controllers/countryController";
import { createGuestProfileByRoom } from "@/redux/slices/createGuestProfileByRoomSlice";
import { uploadReservationAttachment } from "@/redux/slices/reservationAttachmentSlice";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type SecondGuestDrawerProps = {
  reservationId: number;
  reservationDetailId: number;
  onClose: () => void;
  onSuccess?: (guest: any) => void;
  countryListFromWalkIn?: string[];
};

export function SecondGuestDrawer({
  reservationId,
  reservationDetailId,
  onClose,
  onSuccess,
  countryListFromWalkIn,
}: SecondGuestDrawerProps) {
  const dispatch = useDispatch();
  const { fullName } = useUserFromLocalStorage();

  const [isClient, setIsClient] = useState(false);

  // Basic fields
  const [isRepeatGuest, setIsRepeatGuest] = useState(false);
  const [title, setTitle] = useState("");
  const [guestName, setGuestName] = useState("");
  const [dob, setDob] = useState(""); // yyyy-mm-dd
  const [country, setCountry] = useState("");
  const [nationality, setNationality] = useState("");
  const [idType, setIdType] = useState("Passport");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Suggestions
  const [guestData, setGuestData] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Countries
  const [countryList, setCountryList] = useState<string[]>([]);

  // Attachments (ID only, keep it simple)
  const [idPreviews, setIdPreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load countries
  useEffect(() => {
    if (!isClient) return;

    if (countryListFromWalkIn?.length) {
      setCountryList(countryListFromWalkIn);
      return;
    }

    const loadCountries = async () => {
      try {
        const tokens = JSON.parse(
          localStorage.getItem("hotelmateTokens") || "{}"
        );
        const accessToken = tokens?.accessToken;
        if (!accessToken) return;

        const data = await getAllCountries(accessToken);
        const names =
          Array.isArray(data) && data.length
            ? data
                .map((c: any) => c.country)
                .filter((name: any): name is string => !!name)
            : [];
        setCountryList(names);
      } catch (e) {
        console.warn("Failed to load countries", e);
      }
    };
    loadCountries();
  }, [isClient, countryListFromWalkIn]);

  // Load guest suggestions for current hotel
  useEffect(() => {
    if (!isClient) return;
    (async () => {
      const token = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      )?.accessToken;
      const hotelId = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      )?.id;
      if (!token || !hotelId) return;

      try {
        const res = await fetch(`${BASE_URL}/api/GuestProfileMaster`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const guests = await res.json();
        const filtered = guests.filter((g: any) => g.hotelId === hotelId);
        setGuestData(filtered);
      } catch (e) {
        console.warn("Failed to load guest profiles", e);
      }
    })();
  }, [isClient]);

  function onGuestChange(v: string) {
    setGuestName(v);
    setShowSuggestions(!!v);
  }

  function selectGuest(g: any) {
    setGuestName(g.guestName || "");
    setTitle(g.title || "");
    setDob(g.dob ? g.dob.split("T")[0] : "");
    setCountry(g.country || "");
    setNationality(g.nationality || g.country || "");
    setIdNumber(g.ppNo || "");
    setEmail(g.email || "");
    setPhone(g.phone || "");
    setShowSuggestions(false);
  }

  function handleIdAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 15MB`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // For PDFs, store a placeholder preview but keep actual data for upload
        if (file.type === "application/pdf") {
          const pdfPlaceholder = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="120" viewBox="0 0 100 120"><rect width="100%" height="100%" fill="%23f2f2f2"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%23333" text-anchor="middle" dominant-baseline="middle">${file.name}</text></svg>`;
          setIdPreviews((prev) => [...prev, pdfPlaceholder]);
        } else {
          setIdPreviews((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  async function handleSubmit() {
    if (!isClient) return;
    if (!guestName.trim()) {
      toast.error("Please enter guest name");
      return;
    }
    setSubmitting(true);

    try {
      const token = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      )?.accessToken;
      const hotelId = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      )?.id;

      if (!token || !hotelId) throw new Error("Missing auth or hotel");

      // 1) find or create guest profile
      let guestProfileId = 0;

      if (isRepeatGuest) {
        const m = guestData.find(
          (g) => (g.guestName || "").toLowerCase() === guestName.toLowerCase()
        );
        if (m) guestProfileId = m.guestProfileId;
        if (!guestProfileId) {
          toast.error("Selected 'Repeat Guest' but no match found");
          setSubmitting(false);
          return;
        }
      } else {
        const payload = {
          profileId: 0,
          hotelId,
          title,
          guestName,
          dob: dob ? new Date(dob).toISOString() : "",
          address: "",
          city: "",
          zipCode: "",
          country,
          nationality: nationality || country,
          ppNo: idNumber,
          phone,
          email,
          createdOn: new Date().toISOString(),
          createdBy: fullName || "",
          updatedOn: new Date().toISOString(),
          updatedBy: fullName || "",
        };

        const created = await createGuestProfile({ token, payload });
        guestProfileId = created?.profileId || 0;
        if (!guestProfileId) throw new Error("Failed to create guest profile");
      }

      // 2) link guest to reservation detail
      await dispatch(
        createGuestProfileByRoom({
          finAct: true,
          guestProfileId,
          reservationDetailId,
          createdBy: fullName || "system",
        })
      ).unwrap();

      // 3) upload ID attachments (optional)
      for (const preview of idPreviews) {
        try {
          await dispatch(
            uploadReservationAttachment({
              reservationID: reservationId,
              reservationDetailID: reservationDetailId,
              description: "Second Guest - ID Document",
              createdBy: fullName || "",
              base64File: preview,
              originalFileName: `SecondGuest_ID_${Date.now()}.jpg`,
            })
          ).unwrap();
        } catch (e) {
          console.warn("Second guest ID upload failed:", e);
        }
      }

      // done
      if (onSuccess) onSuccess();
      else {
        toast.success("Second guest linked");
        onClose();
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to add second guest");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Add Second Guest</h3>
      <Separator />

      {/* Repeat Guest */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="repeatSecond"
          checked={isRepeatGuest}
          onCheckedChange={(c) => setIsRepeatGuest(!!c)}
        />
        <Label htmlFor="repeatSecond" className="text-sm">
          Repeat Guest
        </Label>
      </div>

      {/* Title + Name */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label htmlFor="title">Title</Label>
          <select
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
          >
            <option value="">Title</option>
            <option value="Mr">Mr</option>
            <option value="Ms">Ms</option>
            <option value="Mrs">Mrs</option>
            <option value="Dr">Dr</option>
            <option value="Prof">Prof</option>
          </select>
        </div>
        <div className="col-span-2 relative">
          <Label htmlFor="guestName">Guest Name</Label>
          <Input
            id="guestName"
            value={guestName}
            onChange={(e) => onGuestChange(e.target.value)}
            onFocus={() => setShowSuggestions(guestName.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            autoComplete="off"
          />
          {showSuggestions && isRepeatGuest && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-40 overflow-y-auto">
              {guestData
                .filter((g) =>
                  (g.guestName || "")
                    .toLowerCase()
                    .includes(guestName.toLowerCase())
                )
                .slice(0, 50)
                .map((g, i) => (
                  <div
                    key={i}
                    className="px-3 py-1 cursor-pointer text-sm hover:bg-gray-100"
                    onClick={() => selectGuest(g)}
                  >
                    {`${g.guestName} — ${g.ppNo || ""} — ${g.email || ""}`}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* DOB / Country */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <select
            id="country"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              if (!nationality) setNationality(e.target.value);
            }}
            className="h-10 w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
          >
            <option value="">Select Country</option>
            {countryList.map((c, idx) => (
              <option key={idx} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      {/* ID */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="idType">ID Type</Label>
          <select
            id="idType"
            value={idType}
            onChange={(e) => setIdType(e.target.value)}
            className="h-10 w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
          >
            <option value="">Select ID Type</option>
            <option value="National ID">National ID</option>
            <option value="Passport">Passport</option>
            <option value="Driver's License">Driver's License</option>
            <option value="Business ID">Business ID</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <Label htmlFor="idNumber">ID Number</Label>
          <div className="flex items-center gap-2">
            <Input
              id="idNumber"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="Enter ID number"
            />
            <Button
              type="button"
              onClick={() =>
                document.getElementById("second-id-upload")?.click()
              }
              variant="default"
              size="sm"
              className="ml-2 whitespace-nowrap"
            >
              <FileText className="h-4 w-4" /> Upload ID
            </Button>
            <Input
              id="second-id-upload"
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleIdAttachmentChange}
              className="hidden"
            />
          </div>
          {idPreviews.length > 0 && (
            <div className="flex flex-wrap mt-2">
              {idPreviews.map((p, idx) => (
                <div
                  key={idx}
                  className="relative w-max group mt-2 inline-block mr-2"
                >
                  <img
                    src={p}
                    alt={`Second ID ${idx + 1}`}
                    className="max-h-40 rounded border"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setIdPreviews((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="absolute top-1 right-1 p-1 bg-white rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

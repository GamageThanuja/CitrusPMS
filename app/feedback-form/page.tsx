"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { TimePicker } from "antd";
import { Phone, Mail, Star } from "lucide-react";

export function SelfCheckinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hotelCode = searchParams?.get("hotelcode");
  const reservationID = searchParams?.get("reservationID");
  const [idType, setIdType] = useState("");
  const [uploadedIdAttachment, setUploadedIdAttachment] = useState<File | null>(
    null
  );
  const [hotelName, setHotelName] = useState("");
  const [hotelAddress, setHotelAddress] = useState("");
  const [hotelImageUrl, setHotelImageUrl] = useState("");
  const [hotelPhone, setHotelPhone] = useState("");
  const [hotelEmail, setHotelEmail] = useState("");
  const [rating, setRating] = useState(0);
  const { fullName } = useUserFromLocalStorage();

  interface ReservationRoom {
    adults?: number;
    child?: number;
    roomType?: string;
    roomNumber?: string;
  }

  interface ReservationData {
    reservationNo?: string;
    status?: string;
    rooms?: ReservationRoom[];
    totalRooms?: number;
    type?: string;
    resCheckIn?: string;
    resCheckOut?: string;
    totalNights?: number;
    currencyCode?: string;
    totalAmount?: number;
    sourceOfBooking?: string;
    createdBy?: string;
    email?: string;
    phone?: string;
    bookerFullName?: string;
  }

  const [reservationData, setReservationData] =
    useState<ReservationData | null>(null);
  // Guest profile id captured from the reservation response
  const [profileId, setProfileId] = useState<string | null>(null);
  const [uploadedPhoneAttachment, setUploadedPhoneAttachment] =
    useState<File | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddress, setGuestAddress] = useState("");
  const [guestCity, setGuestCity] = useState("");
  const [guestZipCode, setGuestZipCode] = useState("");
  const [guestTitle, setGuestTitle] = useState("");
  const [arrivalTime, setArrivalTime] = useState<string>("");
  // New guest info fields
  const [guestCountry, setGuestCountry] = useState("");
  const [guestNationality, setGuestNationality] = useState("");
  const [guestPassport, setGuestPassport] = useState("");

  // useEffect(() => {
  //   const selectedProperty = hotelCode; // Replace with actual selected property if different

  //   if (!hotelCode || !selectedProperty) return;

  //   fetch('', {
  //     headers: {
  //       'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiMTYwN2I5OWMtOTVhMy00YzA2LWEzMjQtOWM4ZmYyZTg0YzJlIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiSWJlVXNlciIsImZ1bGxOYW1lIjoiSUJFIFVzZXIiLCJlbWFpbCI6ImliZXVzZXJAc29tZXRoaW5nLmNvbSIsIm5iZiI6MTc0ODc1NjQ2MywiZXhwIjoyNTM0MDIyODEwMDAsImlzcyI6IkhvdGVsTWF0ZUlzc3VlciIsImF1ZCI6IkhvdGVsTWF0ZU1hbmFnZXIifQ.oDMnqcxsVic1Pke47zwo3f4qyA0v6Fu6UnNDbjskST0'
  //     }
  //   })
  //     .then(res => res.json())
  //     .then(data => {
  //       const matchedHotel = data.find(
  //         (hotel: any) =>
  //           hotel.hotelCode?.toString() === hotelCode &&
  //           hotel.hotelCode?.toString() === selectedProperty
  //       );
  //       if (matchedHotel) {
  //         setHotelName(matchedHotel.hotelName);
  //         setHotelAddress(matchedHotel.hotelAddress);
  //         setHotelImageUrl(matchedHotel.hotelImage?.imageFileName || '');
  //         setHotelPhone(matchedHotel.hotelPhone || '');
  //         setHotelEmail(matchedHotel.hotelEmail || '');
  //         // Store hotel details in localStorage
  //         localStorage.setItem(
  //           'self-checkin-hotel-details',
  //           JSON.stringify({
  //             hotelID: matchedHotel.hotelID,
  //             hotelName: matchedHotel.hotelName,
  //             hotelAddress: matchedHotel.hotelAddress,
  //             hotelPhone: matchedHotel.hotelPhone,
  //             hotelEmail: matchedHotel.hotelEmail,
  //             hotelImageUrl: matchedHotel.hotelImage?.imageFileName || '',
  //             hotelCode: matchedHotel.hotelCode
  //           })
  //         );
  //       }
  //     })
  //     .catch(err => console.error('Error fetching hotel data:', err));
  // }, [hotelCode]);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        if (!hotelCode) return;

        // Load token safely from localStorage
        const tokensString = localStorage.getItem("hotelmateTokens");
        if (!tokensString) throw new Error("No tokens found in localStorage");
        const tokens = JSON.parse(tokensString);
        const accessToken = tokens.accessToken;
        if (!accessToken) throw new Error("No access token available");

        // Call your helper
        const hotels = await getAdminAllHotels({ token: accessToken });

        // Find the hotel matching the code
        const matchedHotel = hotels.find(
          (hotel) => hotel.hotelCode?.toString() === hotelCode
        );

        if (!matchedHotel) {
          console.warn("No matching hotel found for code:", hotelCode);
          return;
        }

        // Update state
        setHotelName(matchedHotel.hotelName);
        setHotelAddress(matchedHotel.hotelAddress);
        setHotelImageUrl(matchedHotel.hotelImage?.imageFileName || "");
        setHotelPhone(matchedHotel.hotelPhone || "");
        setHotelEmail(matchedHotel.hotelEmail || "");

        // Store in localStorage
        localStorage.setItem(
          "self-checkin-hotel-details",
          JSON.stringify({
            hotelID: matchedHotel.hotelID,
            hotelName: matchedHotel.hotelName,
            hotelAddress: matchedHotel.hotelAddress,
            hotelPhone: matchedHotel.hotelPhone,
            hotelEmail: matchedHotel.hotelEmail,
            hotelImageUrl: matchedHotel.hotelImage?.imageFileName || "",
            hotelCode: matchedHotel.hotelCode,
          })
        );
      } catch (err) {
        console.error("Error fetching hotel data:", err);
      }
    };

    fetchHotelDetails();
  }, [hotelCode]);

  useEffect(() => {
    const fetchReservation = async () => {
      if (!reservationID) return;

      try {
        // Get token
        const tokensString = localStorage.getItem("hotelmateTokens");
        if (!tokensString) throw new Error("Authentication token not found.");
        const { accessToken } = JSON.parse(tokensString);

        // Fetch reservation
        const data = await getReservationById({
          token: accessToken,
          reservationId: Number(reservationID),
        });

        // Update state
        setReservationData(data);
        setProfileId(data.guestProfileId?.toString() ?? null);

        // Store in localStorage
        localStorage.setItem("reservation-detail", JSON.stringify(data));
        localStorage.setItem(
          "guest-profile-id",
          data.guestProfileId?.toString() || ""
        );

        console.log("Fetched reservation data:", data);
      } catch (err) {
        console.error("Error fetching reservation data:", err);
      }
    };

    fetchReservation();
  }, [reservationID]);

  // Fetch guest profile once we have the profileId
  // useEffect(() => {
  //   if (!profileId) return;

  //   fetch(``, {
  //     headers: {
  //       Authorization:
  //         "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiMTYwN2I5OWMtOTVhMy00YzA2LWEzMjQtOWM4ZmYyZTg0YzJlIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiSWJlVXNlciIsImZ1bGxOYW1lIjoiSUJFIFVzZXIiLCJlbWFpbCI6ImliZXVzZXJAc29tZXRoaW5nLmNvbSIsIm5iZiI6MTc0ODc1NjQ2MywiZXhwIjoyNTM0MDIyODEwMDAsImlzcyI6IkhvdGVsTWF0ZUlzc3VlciIsImF1ZCI6IkhvdGVsTWF0ZU1hbmFnZXIifQ.oDMnqcxsVic1Pke47zwo3f4qyA0v6Fu6UnNDbjskST0",
  //     },
  //   })
  //     .then((res) => res.json())
  //     .then((profile) => {
  //       setGuestName(profile.guestName || "");
  //       setGuestEmail(profile.email || "");
  //       setGuestPhone(profile.phone || "");
  //       setGuestAddress(profile.address || "");
  //       setGuestCity(profile.city || "");
  //       setGuestZipCode(profile.zipCode || "");
  //       setGuestTitle(profile.title || "");
  //       setGuestCountry(profile.country || "");
  //       setGuestNationality(profile.nationality || "");
  //       setGuestPassport(profile.ppNo || "");
  //       // Store full guest profile JSON in localStorage
  //       localStorage.setItem("guest-profile-detail", JSON.stringify(profile));
  //     })
  //     .catch((err) => console.error("Error fetching guest profile:", err));
  // }, [profileId]);

  useEffect(() => {
    const fetchGuestProfile = async () => {
      if (!profileId) return;

      try {
        const tokensString = localStorage.getItem("hotelmateTokens");
        if (!tokensString) throw new Error("Authentication token not found.");
        const { accessToken } = JSON.parse(tokensString);

        const profile = await getGuestProfileById({
          token: accessToken,
          profileId: Number(profileId),
        });

        setGuestName(profile.guestName || "");
        setGuestEmail(profile.email || "");
        setGuestPhone(profile.phone || "");
        setGuestAddress(profile.address || "");
        setGuestCity(profile.city || "");
        setGuestZipCode(profile.zipCode || "");
        setGuestTitle(profile.title || "");
        setGuestCountry(profile.country || "");
        setGuestNationality(profile.nationality || "");
        setGuestPassport(profile.ppNo || "");

        // Store full guest profile JSON in localStorage
        localStorage.setItem("guest-profile-detail", JSON.stringify(profile));
      } catch (err) {
        console.error("Error fetching guest profile:", err);
      }
    };

    fetchGuestProfile();
  }, [profileId]);

  // Helper function to handle check-in
  // const handleCheckIn = async () => {
  //   try {
  //     // Retrieve reservation info from state or localStorage
  //     const stored = localStorage.getItem("reservation-detail");
  //     const reservation = stored ? JSON.parse(stored) : reservationData;

  //     if (
  //       !reservation ||
  //       !reservation.rooms ||
  //       reservation.rooms.length === 0
  //     ) {
  //       alert("Reservation details not found.");
  //       return;
  //     }

  //     const reservationDetailId = reservation.rooms[0].reservationDetailID;

  //     // Get hotel info from localStorage
  //     const hotelDetails = localStorage.getItem("self-checkin-hotel-details");
  //     const hotelData = hotelDetails ? JSON.parse(hotelDetails) : null;

  //     // Prepare GuestProfileMaster payload
  //     const guestProfilePayload = {
  //       profileId: 0,
  //       hotelId: hotelData?.hotelID ?? 0,
  //       title: "", // If you want to pass selected title from dropdown, add a state and bind it here
  //       guestName,
  //       dob: new Date().toISOString(),
  //       address: "",
  //       city: "",
  //       zipCode: "",
  //       country: "",
  //       nationality: "",
  //       ppNo: "",
  //       phone: guestPhone,
  //       email: guestEmail,
  //       createdOn: new Date().toISOString(),
  //       createdBy: guestName || "Guest",
  //       updatedOn: new Date().toISOString(),
  //       updatedBy: "guest",
  //     };

  //     // Submit guest profile and capture profileId
  //     const guestProfileRes = await fetch(
  //       "",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization:
  //             "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiMTYwN2I5OWMtOTVhMy00YzA2LWEzMjQtOWM4ZmYyZTg0YzJlIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiSWJlVXNlciIsImZ1bGxOYW1lIjoiSUJFIFVzZXIiLCJlbWFpbCI6ImliZXVzZXJAc29tZXRoaW5nLmNvbSIsIm5iZiI6MTc0ODc1NjQ2MywiZXhwIjoyNTM0MDIyODEwMDAsImlzcyI6IkhvdGVsTWF0ZUlzc3VlciIsImF1ZCI6IkhvdGVsTWF0ZU1hbmFnZXIifQ.oDMnqcxsVic1Pke47zwo3f4qyA0v6Fu6UnNDbjskST0",
  //         },
  //         body: JSON.stringify(guestProfilePayload),
  //       }
  //     );

  //     if (!guestProfileRes.ok) {
  //       throw new Error("Guest profile creation failed.");
  //     }

  //     const guestProfileData = await guestProfileRes.json();
  //     const guestProfileId = guestProfileData?.profileId ?? 0;

  //     const payload = {
  //       reservationDetailId,
  //       reservationStatusId: "4",
  //       checkINat: new Date().toISOString(),
  //       checkedInBy: guestName || "SELF CHECK-IN",
  //       guestProfileId,
  //       isRepeatGuest: false,
  //     };

  //     const response = await fetch(
  //       ``,
  //       {
  //         method: "PUT",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization:
  //             "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiMTYwN2I5OWMtOTVhMy00YzA2LWEzMjQtOWM4ZmYyZTg0YzJlIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiSWJlVXNlciIsImZ1bGxOYW1lIjoiSUJFIFVzZXIiLCJlbWFpbCI6ImliZXVzZXJAc29tZXRoaW5nLmNvbSIsIm5iZiI6MTc0ODc1NjQ2MywiZXhwIjoyNTM0MDIyODEwMDAsImlzcyI6IkhvdGVsTWF0ZUlzc3VlciIsImF1ZCI6IkhvdGVsTWF0ZU1hbmFnZXIifQ.oDMnqcxsVic1Pke47zwo3f4qyA0v6Fu6UnNDbjskST0",
  //         },
  //         body: JSON.stringify(payload),
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error(`Check‑in failed: ${response.statusText}`);
  //     }

  //     alert("Check‑in successful!");
  //     // Optionally redirect or refresh
  //     router.refresh?.();
  //   } catch (err: any) {
  //     console.error(err);
  //     alert(err.message || "Check‑in failed.");
  //   }
  // };

  const handleCheckIn = async () => {
    try {
      // Retrieve reservation info
      const stored = localStorage.getItem("reservation-detail");
      const reservation = stored ? JSON.parse(stored) : reservationData;

      const tokensString = localStorage.getItem("hotelmateTokens");
      if (!tokensString) throw new Error("Authentication token not found.");
      const { accessToken } = JSON.parse(tokensString);

      if (!reservation || !reservation.rooms?.length) {
        alert("Reservation details not found.");
        return;
      }

      const reservationDetailId = reservation.rooms[0].reservationDetailID;

      // Get hotel info
      const hotelDetails = localStorage.getItem("self-checkin-hotel-details");
      const hotelData = hotelDetails ? JSON.parse(hotelDetails) : null;

      if (!accessToken) {
        throw new Error("Authentication token is missing.");
      }

      // Create guest profile
      const guestProfilePayload = {
        profileId: 0,
        hotelId: hotelData?.hotelID ?? 0,
        title: "", // Optional
        guestName,
        dob: new Date().toISOString(),
        address: "",
        city: "",
        zipCode: "",
        country: "",
        nationality: "",
        ppNo: "",
        phone: guestPhone,
        email: guestEmail,
        createdOn: new Date().toISOString(),
        createdBy: fullName || "",
        updatedOn: new Date().toISOString(),
        updatedBy: "guest",
      };

      const createdProfile = await createGuestProfile({
        token: accessToken,
        payload: guestProfilePayload,
      });

      const guestProfileId = createdProfile?.profileId ?? 0;

      // Check in reservation detail
      await checkInReservationDetail({
        token: accessToken,
        reservationDetailId,
        payload: {
          reservationDetailId,
          reservationStatusId: 4, // 'Checked In' status
          checkINat: new Date().toISOString(),
          checkedInBy: guestName || "SELF CHECK-IN",
          guestProfileId,
          isRepeatGuest: false,
        },
      });

      alert("Check-in successful!");
      router.refresh?.();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Check-in failed.");
    }
  };

  // Star Rating Component
  const StarRating = () => {
    const handleStarClick = (starIndex: number, isHalf: boolean = false) => {
      const newRating = starIndex + (isHalf ? 0.5 : 1);
      setRating(newRating);
    };

    const renderStar = (starIndex: number) => {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;
      const isFullStar = starIndex < fullStars;
      const isHalfStar = starIndex === fullStars && hasHalfStar;

      return (
        <div key={starIndex} className="relative inline-block cursor-pointer">
          {/* Full star background */}
          <Star
            size={32}
            className={`${
              isFullStar ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            } transition-colors duration-200`}
          />
          {/* Half star overlay */}
          {isHalfStar && (
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: "50%" }}
            >
              <Star
                size={32}
                className="text-yellow-400 fill-yellow-400 transition-colors duration-200"
              />
            </div>
          )}
          {/* Invisible clickable areas for half and full star */}
          <div className="absolute inset-0 flex">
            <div
              className="w-1/2 h-full"
              onClick={() => handleStarClick(starIndex, true)}
            />
            <div
              className="w-1/2 h-full"
              onClick={() => handleStarClick(starIndex, false)}
            />
          </div>
        </div>
      );
    };

    // New JSX structure for centering label over stars
    return (
      <div className="space-y-2">
        <label className="block text-lg font-semibold mb-2">
          Overall Rating
        </label>
        <div className="relative inline-block">
          <div className="flex items-center space-x-1">
            {[0, 1, 2, 3, 4].map(renderStar)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen font-sans bg-white text-black p-4 sm:p-8 max-w-full">
      {hotelCode ? (
        <>
          {hotelName && (
            <div className="flex justify-center items-center flex-col mb-2">
              <h1 className="text-4xl font-extrabold text-black tracking-wide drop-shadow-sm">
                {hotelName}
              </h1>
            </div>
          )}
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-black">
              Guest Feedback Form
            </h2>
          </div>
          <form className="mt-8 bg-white shadow-lg border border-gray-300 rounded-lg p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
            {/* Guest Details */}
            <section className="space-y-6">
              <h3 className="text-xl font-bold border-b border-gray-700 pb-2 mb-4">
                Guest Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Title input */}
                <div>
                  <label className="block text-lg font-semibold mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={guestTitle}
                    readOnly
                    className="p-3 border border-gray-700 rounded-lg w-full bg-gray-100 text-black font-medium text-base placeholder-gray-600"
                    placeholder="Title"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold mb-1">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    readOnly
                    className="p-3 border border-gray-700 rounded-lg w-full bg-gray-100 text-black font-medium text-base"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    readOnly
                    className="p-3 border border-gray-700 rounded-lg w-full bg-gray-100 text-black font-medium text-base"
                    placeholder="Email Address"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={guestPhone}
                    readOnly
                    className="p-3 border border-gray-700 rounded-lg w-full bg-gray-100 text-black font-medium text-base"
                    placeholder="Phone Number"
                  />
                </div>
                {/* Booking Source below phone */}
                <div>
                  <label className="block text-lg font-semibold mb-1">
                    Booking Source
                  </label>
                  <input
                    type="text"
                    value={reservationData?.sourceOfBooking || ""}
                    readOnly
                    className="p-3 border border-gray-700 rounded-lg w-full bg-gray-100 text-black font-medium text-base"
                  />
                </div>
                {/* New fields: Country, Nationality, Passport Number */}
                <div>
                  <label className="block text-lg font-semibold mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={guestCountry}
                    readOnly
                    className="p-3 border border-gray-700 rounded-lg w-full bg-gray-100 text-black font-medium text-base"
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold mb-1">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={guestNationality}
                    readOnly
                    className="p-3 border border-gray-700 rounded-lg w-full bg-gray-100 text-black font-medium text-base"
                    placeholder="Nationality"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold mb-1">
                    Identification Number
                  </label>
                  <input
                    type="text"
                    value={guestPassport}
                    readOnly
                    className="p-3 border border-gray-700 rounded-lg w-full bg-gray-100 text-black font-medium text-base"
                    placeholder="Identification Number"
                  />
                </div>
              </div>
            </section>
            {/* Contact Info */}
            <section className="space-y-6">
              <h3 className="text-xl font-bold border-b border-gray-700 pb-2 mb-4">
                Contact Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-lg font-semibold mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="Address"
                    value={guestAddress}
                    readOnly
                    className="p-3 border border-gray-700 rounded-lg w-full bg-gray-100 text-black font-medium text-base"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="City"
                    value={guestCity}
                    readOnly
                    className="p-3 border border-gray-700 rounded-lg w-full bg-gray-100 text-black font-medium text-base"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold mb-1">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    placeholder="Zip Code"
                    value={guestZipCode}
                    readOnly
                    className="p-3 border border-gray-700 rounded-lg w-full bg-gray-100 text-black font-medium text-base"
                  />
                </div>
              </div>
            </section>
            {/* Reservation Meta */}
            <section className="space-y-6">
              <h3 className="text-xl font-bold border-b border-gray-700 pb-2 mb-4">
                Reservation Details
              </h3>
              {/* Room cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-4">
                {reservationData?.rooms?.map((room: any, idx: number) => {
                  const statusText =
                    room.reservationStatusMaster?.reservationStatus ||
                    room.status ||
                    "";
                  // Preformat check-in and check-out dates
                  const formattedCheckIn = room.checkInDate
                    ? new Date(room.checkInDate).toLocaleDateString()
                    : reservationData.resCheckIn
                    ? new Date(reservationData.resCheckIn).toLocaleDateString()
                    : "-";
                  const formattedCheckOut = room.checkOutDate
                    ? new Date(room.checkOutDate).toLocaleDateString()
                    : reservationData.resCheckOut
                    ? new Date(reservationData.resCheckOut).toLocaleDateString()
                    : "-";
                  return (
                    <div
                      key={idx}
                      className="rounded-lg shadow border border-black p-4 w-full"
                      style={{ backgroundColor: "white" }}
                    >
                      <div className="font-bold text-lg mb-2">
                        Room {room.roomNumber ? `#${room.roomNumber}` : idx + 1}
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <strong>Room Type:</strong> {room.roomType || "-"}
                        </div>
                        <div>
                          <strong>Basis:</strong> {room.basis || "-"}
                        </div>
                        <div>
                          <strong>Check-in:</strong> {formattedCheckIn}
                        </div>
                        <div>
                          <strong>Check-out:</strong> {formattedCheckOut}
                        </div>
                        <div>
                          <strong>Adults:</strong> {room.adults ?? 0}
                        </div>
                        <div>
                          <strong>Children:</strong> {room.child ?? 0}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            {/* File Uploads & ID */}
            <section className="space-y-6">
              <h3 className="text-xl font-bold border-b border-gray-700 pb-2 mb-4">
                Feedback
              </h3>
            </section>
            {/* Special Requests & Options */}
            <section className="space-y-6">
              {/* Star Rating */}
              <StarRating />
              {/* Display the selected rating so the guest sees their choice */}
              <div className="text-lg font-medium text-gray-700">
                {rating > 0
                  ? `You rated your stay: ${rating} / 5`
                  : "No rating selected"}
              </div>

              <div>
                <textarea
                  placeholder="Please provide your feedback here..."
                  className="p-3 border border-gray-700 rounded-lg w-full bg-white h-24 "
                ></textarea>
              </div>
            </section>
            <button
              type="button"
              onClick={handleCheckIn}
              className="w-full bg-gradient-to-r from-black to-gray-800 text-white font-semibold py-3 px-4 rounded-lg text-lg hover:from-gray-900 hover:to-black transition duration-300 mt-4"
            >
              Give Feedback
            </button>
          </form>
          {(hotelName || hotelAddress) && (
            <footer className="mt-5 w-full bg-transparent text-black py-10 px-6">
              <div className="text-center space-y-2">
                <h4 className="text-xl font-bold">{hotelName}</h4>
                {hotelAddress && (
                  <p className="text-sm text-black">{hotelAddress}</p>
                )}
                <div className="flex justify-center items-center gap-4 mt-2">
                  {hotelPhone && (
                    <a
                      href={`tel:${hotelPhone}`}
                      className="flex items-center gap-1 text-black font-medium hover:text-gray-300 transition"
                    >
                      <Phone size={18} /> {hotelPhone}
                    </a>
                  )}
                  {hotelEmail && (
                    <a
                      href={`mailto:${hotelEmail}`}
                      className="flex items-center gap-1 text-black font-medium hover:text-gray-300 transition"
                    >
                      <Mail size={18} /> {hotelEmail}
                    </a>
                  )}
                </div>
              </div>
            </footer>
          )}
        </>
      ) : (
        <p>No hotel code provided.</p>
      )}
    </div>
  );
}

import { Suspense } from "react";
import { getAdminAllHotels } from "@/controllers/adminAllHotelsController";
import {
  checkInReservationDetail,
  getReservationById,
} from "@/controllers/reservationController";
import {
  createGuestProfile,
  getGuestProfileById,
} from "@/controllers/guestProfileMasterController";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SelfCheckinPage />
    </Suspense>
  );
}

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { TimePicker } from "antd";
import { Phone, Mail } from "lucide-react";
import { Suspense } from "react";
import { getAdminAllHotels } from "@/controllers/adminAllHotelsController";
import {
  checkInReservationDetail,
  getReservationById,
} from "@/controllers/reservationController";
import { createReservationActivityLog } from "@/controllers/reservationActivityLogController";
import { createGuestProfile } from "@/controllers/guestProfileMasterController";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";

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
  // Add state for title, address, city, zipCode
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  // New state for nationality, country, idNumber
  const [nationality, setNationality] = useState("");
  const [country, setCountry] = useState("");
  const [idNumber, setIdNumber] = useState("");
  // State for country and nationality lists
  const [countryList, setCountryList] = useState<string[]>([]);
  const [nationalityList, setNationalityList] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries/positions"
        );
        const json = await res.json();

        if (!json || !Array.isArray(json.data)) {
          console.error("Unexpected countriesnow response:", json);
          setCountryList;
          setNationalityList;
          return;
        }

        const countries = json.data.map((c: any) => c.name).sort();
        const nationalities = countries
          .map((name: string) => `${name} National`)
          .sort();

        setCountryList(countries);
        setNationalityList(nationalities);
      } catch (err) {
        console.error("Failed to fetch countries:", err);
        setCountryList;
        setNationalityList;
      }
    })();
  }, []);
  interface ReservationRoom {
    adults?: number;
    child?: number;
    roomType?: string;
    roomNumber?: string;
  }

  interface ReservationData {
    reservationNo?: string | null;
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
  const [uploadedPhoneAttachment, setUploadedPhoneAttachment] =
    useState<File | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [arrivalTime, setArrivalTime] = useState<string>("");
  // Modal state for check-in success
  const [isCheckInSuccess, setIsCheckInSuccess] = useState(false);
  // State for reservation expired
  const [isReservationExpired, setIsReservationExpired] = useState(false);
  const { fullName } = useUserFromLocalStorage();

  // useEffect(() => {
  //   const selectedProperty = hotelCode; // Replace with actual selected property if different

  //   if (!hotelCode || !selectedProperty) return;

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
    const loadHotelData = async () => {
      try {
        if (!hotelCode) return;

        const tokensRaw = localStorage.getItem("hotelmateTokens");
        if (!tokensRaw) {
          console.error("Token not found in localStorage");
          return;
        }
        const { accessToken } = JSON.parse(tokensRaw);
        if (!accessToken) {
          console.error("Access token missing");
          return;
        }

        // Call the helper
        const allHotels = await getAdminAllHotels({
          token: accessToken,
        });

        const matchedHotel = allHotels.find(
          (hotel) => hotel.hotelCode?.toString() === hotelCode
        );

        if (matchedHotel) {
          setHotelName(matchedHotel.hotelName);
          setHotelAddress(matchedHotel.hotelAddress);
          setHotelImageUrl(matchedHotel.hotelImage?.imageFileName || "");
          setHotelPhone(matchedHotel.hotelPhone || "");
          setHotelEmail(matchedHotel.hotelEmail || "");

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
        } else {
          console.warn("No matching hotel found for code:", hotelCode);
        }
      } catch (err) {
        console.error("Error fetching hotel data:", err);
      }
    };

    loadHotelData();
  }, [hotelCode]);

  // useEffect(() => {
  //   if (!reservationID) return;

  //     headers: {
  //       Authorization:
  //         "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiMTYwN2I5OWMtOTVhMy00YzA2LWEzMjQtOWM4ZmYyZTg0YzJlIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiSWJlVXNlciIsImZ1bGxOYW1lIjoiSUJFIFVzZXIiLCJlbWFpbCI6ImliZXVzZXJAc29tZXRoaW5nLmNvbSIsIm5iZiI6MTc0ODc1NjQ2MywiZXhwIjoyNTM0MDIyODEwMDAsImlzcyI6IkhvdGVsTWF0ZUlzc3VlciIsImF1ZCI6IkhvdGVsTWF0ZU1hbmFnZXIifQ.oDMnqcxsVic1Pke47zwo3f4qyA0v6Fu6UnNDbjskST0",
  //     },
  //   })
  //     .then((res) => res.json())
  //     .then((data) => {
  //       setReservationData(data);
  //       // Store full reservation JSON in localStorage
  //       localStorage.setItem("reservation-detail", JSON.stringify(data));
  //       setGuestName(data.bookerFullName || "");
  //       setGuestEmail(data.email || "");
  //       setGuestPhone(data.phone || "");
  //       // Check if reservation is expired (checked-in)
  //       if (
  //         data?.rooms?.[0]?.reservationStatusMaster?.reservationStatusID === 4
  //       ) {
  //         setIsReservationExpired(true);
  //       }
  //       console.log("Fetched reservation data:", data);
  //     })
  //     .catch((err) => console.error("Error fetching reservation data:", err));
  // }, [reservationID]);

  // Helper function to handle check-in

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        if (!reservationID) return;

        const tokensRaw = localStorage.getItem("hotelmateTokens");
        if (!tokensRaw) {
          console.error("No tokens found in localStorage.");
          return;
        }

        const { accessToken } = JSON.parse(tokensRaw);
        if (!accessToken) {
          console.error("Access token missing.");
          return;
        }

        // Use your helper
        const data = await getReservationById({
          token: accessToken,
          reservationId: Number(reservationID),
        });

        // Set state
        setReservationData(data);
        localStorage.setItem("reservation-detail", JSON.stringify(data));

        setGuestName(data.bookerFullName || "");
        setGuestEmail(data.email || "");
        setGuestPhone(data.phone || "");

        // Check if reservation is expired (checked-in)
        if (
          data?.rooms?.[0]?.reservationStatusMaster?.reservationStatusID === 4
        ) {
          setIsReservationExpired(true);
        }

        console.log("Fetched reservation data:", data);
      } catch (err) {
        console.error("Error fetching reservation data:", err);
      }
    };

    fetchReservation();
  }, [reservationID]);

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
  //       title,
  //       guestName,
  //       dob: new Date().toISOString(),
  //       address,
  //       city,
  //       zipCode,
  //       country,
  //       nationality,
  //       ppNo: idNumber,
  //       phone: guestPhone,
  //       email: guestEmail,
  //       createdOn: new Date().toISOString(),
  //       createdBy: guestName || "Guest",
  //       updatedOn: new Date().toISOString(),
  //       updatedBy: "guest",
  //     };

  //     // Submit guest profile and capture profileId
  //     const guestProfileRes = await fetch(

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

  //     setIsCheckInSuccess(true);
  //     // Optionally redirect or refresh
  //     router.refresh?.();
  //   } catch (err: any) {
  //     console.error(err);
  //     alert(err.message || "Check‑in failed.");
  //   }
  // };

  const handleCheckIn = async () => {
    try {
      // Retrieve reservation from state or localStorage
      const stored = localStorage.getItem("reservation-detail");
      const reservation = stored ? JSON.parse(stored) : reservationData;

      if (
        !reservation ||
        !reservation.rooms ||
        reservation.rooms.length === 0
      ) {
        alert("Reservation details not found.");
        return;
      }

      const reservationDetailId = reservation.rooms[0].reservationDetailID;

      // Get hotel info
      const hotelDetails = localStorage.getItem("self-checkin-hotel-details");
      const hotelData = hotelDetails ? JSON.parse(hotelDetails) : null;

      const tokensRaw = localStorage.getItem("hotelmateTokens");
      if (!tokensRaw) throw new Error("No tokens found.");
      const { accessToken } = JSON.parse(tokensRaw);
      if (!accessToken) throw new Error("Access token missing.");

      // Prepare GuestProfile payload
      const guestProfilePayload = {
        profileId: 0,
        hotelId: hotelData?.hotelID ?? 0,
        title,
        guestName,
        dob: new Date().toISOString(),
        address,
        city,
        zipCode,
        country,
        nationality,
        ppNo: idNumber,
        phone: guestPhone,
        email: guestEmail,
        createdOn: new Date().toISOString(),
        createdBy: fullName || "",
        updatedOn: new Date().toISOString(),
        updatedBy: fullName || "",
      };

      // Create guest profile using helper
      const guestProfile = await createGuestProfile({
        token: accessToken,
        payload: guestProfilePayload,
      });

      const guestProfileId = guestProfile?.profileId ?? 0;

      // Check-in payload
      const checkInPayload = {
        reservationDetailId,
        reservationStatusId: 4, // Ensure this is numeric
        checkINat: new Date().toISOString(),
        checkedInBy: guestName || "SELF CHECK-IN",
        guestProfileId,
        isRepeatGuest: false,
      };

      // Perform check-in using helper
      await checkInReservationDetail({
        token: accessToken,
        reservationDetailId,
        payload: checkInPayload,
      });

      // Log the check-in action
      await createReservationActivityLog({
        token: accessToken,
        payload: {
          username: guestName || "SELF CHECK-IN",
          hotelId: hotelData?.hotelID ?? 0,
          reservationId: reservation.reservationID,
          reservationDetailId,
          resLog: "Reservation checked in via self-checkin",
          createdOn: new Date().toISOString(),
          platform: "Web",
          reservationNo: reservation.reservationNo || "",
          roomNumber: reservation.rooms[0]?.roomNumber || "",
        },
      });

      setIsCheckInSuccess(true);
      alert("Check-in successful!");
      router.refresh?.();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Check-in failed.");
    }
  };

  return (
    <>
      <div className="min-h-screen font-sans bg-white text-black p-4 sm:p-8 max-w-full">
        {isReservationExpired && (
          <div className="flex items-center justify-center h-full text-center py-32 px-4">
            <div className="bg-white border border-black shadow-lg p-8 rounded-xl max-w-md mx-auto text-black">
              <h2 className="text-2xl font-bold mb-2">
                This Check-In Link Has Expired
              </h2>
              <p>The reservation is already marked as checked-in.</p>
            </div>
          </div>
        )}
        {!isReservationExpired && (
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
                Guest Self Check in Form
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
                    <select
                      className="p-3 border border-gray-700 rounded-lg w-full bg-white text-black font-medium text-base"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    >
                      <option value="">Select Title</option>
                      <option value="Mr">Mr</option>
                      <option value="Ms">Ms</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Dr">Dr</option>
                      <option value="Prof">Prof</option>
                      <option value="Rev">Rev</option>
                      <option value="Mx">Mx</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-lg font-semibold mb-1">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="p-3 border border-gray-700 rounded-lg w-full bg-white text-black font-medium text-base placeholder-gray-600"
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
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="p-3 border border-gray-700 rounded-lg w-full bg-white text-black font-medium text-base placeholder-gray-600"
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
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="p-3 border border-gray-700 rounded-lg w-full bg-white text-black font-medium text-base placeholder-gray-600"
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
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="p-3 border border-gray-700 rounded-lg w-full bg-white text-black text-base placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="p-3 border border-gray-700 rounded-lg w-full bg-white text-black text-base placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold mb-1">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      placeholder="Zip Code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="p-3 border border-gray-700 rounded-lg w-full bg-white text-black text-base placeholder-gray-600"
                    />
                  </div>
                  {/* Country select */}
                  <div>
                    <label className="block text-lg font-semibold mb-1">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="p-3 border border-gray-700 rounded-lg w-full bg-white text-black text-base"
                    >
                      <option value="">Select Country</option>
                      {countryList.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Nationality select */}
                  <div>
                    <label className="block text-lg font-semibold mb-1">
                      Nationality
                    </label>
                    <select
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="p-3 border border-gray-700 rounded-lg w-full bg-white text-black text-base"
                    >
                      <option value="">Select Nationality</option>
                      {nationalityList.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
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
                      ? new Date(
                          reservationData.resCheckIn
                        ).toLocaleDateString()
                      : "-";
                    const formattedCheckOut = room.checkOutDate
                      ? new Date(room.checkOutDate).toLocaleDateString()
                      : reservationData.resCheckOut
                      ? new Date(
                          reservationData.resCheckOut
                        ).toLocaleDateString()
                      : "-";
                    return (
                      <div
                        key={idx}
                        className="rounded-lg shadow border border-black p-4 w-full"
                        style={{ backgroundColor: "white" }}
                      >
                        <div className="font-bold text-lg mb-2">
                          Room{" "}
                          {room.roomNumber ? `#${room.roomNumber}` : idx + 1}
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          <div>
                            <strong>Room Type:</strong> {room.roomType || "-"}
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
                          <div>
                            <strong>Basis:</strong> {room.basis || "-"}
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
                  Uploads & Identification
                </h3>
                <div className="space-y-6">
                  {/* ID Type and ID Number in a two-column row */}
                  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-lg font-semibold mb-1">
                        ID Type
                      </label>
                      <select
                        className="h-[52px] px-4 py-3 border border-gray-700 rounded-lg w-full bg-white text-black text-base"
                        value={idType}
                        onChange={(e) => setIdType(e.target.value)}
                      >
                        <option value="">Select ID Type</option>
                        <option>Passport</option>
                        <option>National ID</option>
                        <option>Driver's License</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-lg font-semibold mb-1">
                        ID Number
                      </label>
                      <input
                        type="text"
                        placeholder={
                          idType
                            ? `${
                                idType.charAt(0).toUpperCase() + idType.slice(1)
                              } Number`
                            : "ID Number"
                        }
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        className="p-3 border border-gray-700 rounded-lg w-full bg-white text-black text-base placeholder-gray-600"
                      />
                    </div>
                  </div>
                  {/* Upload ID Photo below, with preview */}
                  {idType && (
                    <div className="md:col-span-3">
                      <label className="block text-lg font-semibold mb-1">
                        Upload ID Photo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="p-3 border border-gray-700 rounded-lg w-full bg-white text-black text-base"
                        placeholder="Attach ID Photo"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setUploadedIdAttachment(file);
                        }}
                      />
                      {uploadedIdAttachment && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-1">Preview:</p>
                          <img
                            src={URL.createObjectURL(uploadedIdAttachment)}
                            alt="ID Attachment Preview"
                            className="max-w-xs max-h-48 border rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
              {/* Special Requests & Options */}
              <section className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold mb-1">
                    Special Requests
                  </label>
                  <textarea
                    placeholder="Any special requests or notes"
                    className="p-3 border border-gray-700 rounded-lg w-full bg-white h-24 "
                  ></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                  <div>
                    <label className="block text-lg font-semibold mb-1">
                      Expected Arrival Time
                    </label>
                    <TimePicker
                      use12Hours
                      format="h:mm a"
                      className="w-full h-[52px] text-base font-medium"
                      onChange={(_, timeString) => {
                        if (typeof timeString === "string")
                          setArrivalTime(timeString);
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center text-base font-medium">
                      <input
                        type="checkbox"
                        className="mr-2 w-5 h-5 border border-gray-400 rounded"
                        style={{
                          appearance: "checkbox",
                          WebkitAppearance: "checkbox",
                          accentColor: "black",
                          backgroundColor: "white",
                        }}
                      />
                      Early Check-in
                    </label>
                    <label className="inline-flex items-center text-base font-medium">
                      <input
                        type="checkbox"
                        className="mr-2 w-5 h-5 border border-gray-400 rounded"
                        style={{
                          appearance: "checkbox",
                          WebkitAppearance: "checkbox",
                          accentColor: "black",
                          backgroundColor: "white",
                        }}
                      />
                      Late Check-out
                    </label>
                  </div>
                </div>
              </section>
              <button
                type="button"
                onClick={handleCheckIn}
                className="w-full bg-gradient-to-r from-black to-gray-800 text-white font-semibold py-3 px-4 rounded-lg text-lg hover:from-gray-900 hover:to-black transition duration-300 mt-4"
              >
                Check In
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
        )}
        {/* Modal for check-in success */}
        {isCheckInSuccess && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center space-y-4 w-full max-w-md border border-black text-black">
              <h2 className="text-3xl font-extrabold text-black">
                Check-In Successful!
              </h2>
              <p className="text-black text-base font-medium">
                Your check-in has been completed successfully.
              </p>
              <button
                onClick={() => setIsCheckInSuccess(false)}
                className="inline-block mt-4 px-6 py-3 bg-black text-white rounded-lg font-semibold text-base hover:bg-white hover:text-black hover:border hover:border-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SelfCheckinPage />
    </Suspense>
  );
}

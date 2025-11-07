"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchHotelMealAllocations,
  selectHotelMealAllocations,
} from "@/redux/slices/fetchHotelMealAllocationSlice";
import {
  createHotelMealAllocation,
  resetCreateHotelMealAllocationState,
  selectCreateHotelMealAllocation,
} from "@/redux/slices/createHotelMealAllocationSlice";
import {
  updateHotelMealAllocation,
  resetUpdateHotelMealAllocationState,
  selectUpdateHotelMealAllocation,
} from "@/redux/slices/updateHotelMealAllocationSlice";
import {
  deleteHotelMealAllocation,
  selectDeleteHotelMealAllocation,
} from "@/redux/slices/deleteHotelMealAllocationSlice";
import { ArrowLeft, ArrowRight, Check, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "../../assets/images/HotelMate_Logo.png";
import VideoButton from "@/components/videoButton";
import VideoOverlay from "@/components/videoOverlay";
import { useTutorial } from "@/hooks/useTutorial";

type Mode = "create" | "edit";

interface MealAllocationFlowProps {
  defaultCurrency?: string;
  skipHref?: string;
  onSkip?: () => void;
}

export default function MealAllocationFlow({
  defaultCurrency,
  skipHref,
  onSkip,
}: MealAllocationFlowProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial(
    "onBoarding",
    "meal allocation"
  );

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);
  const homeCurrency = useMemo(() => {
    try {
      const stored = localStorage.getItem("hotelCurrency"); // <-- your key
      if (stored) return stored;

      // sensible fallbacks if hotelCurrency isn't set yet
      const hotelData = localStorage.getItem("hotelData");
      const parsedHotel = hotelData ? JSON.parse(hotelData) : {};
      return parsedHotel?.currencyCode || defaultCurrency || "USD";
    } catch {
      return defaultCurrency || "USD";
    }
  }, [defaultCurrency]);

  const { hotelID, currencyCodeFromHotel } = useMemo(() => {
    try {
      const selectedProperty = localStorage.getItem("selectedProperty");
      const hotel = selectedProperty ? JSON.parse(selectedProperty) : null;
      const hotelID = hotel?.id ?? hotel?.hotelID ?? null;
      const hotelData = localStorage.getItem("hotelData");
      const parsedHotel = hotelData ? JSON.parse(hotelData) : {};
      const currencyCodeFromHotel =
        parsedHotel?.currencyCode || defaultCurrency || "USD";
      return { hotelID, currencyCodeFromHotel };
    } catch {
      return { hotelID: null, currencyCodeFromHotel: defaultCurrency || "USD" };
    }
  }, [defaultCurrency]);

  const listState = (useSelector(selectHotelMealAllocations) as any) ?? {
    data: [],
    status: "idle",
    error: null,
  };
  const createState = (useSelector(selectCreateHotelMealAllocation) as any) ?? {
    status: "idle",
    error: null,
  };
  const updateState = (useSelector(selectUpdateHotelMealAllocation) as any) ?? {
    status: "idle",
    error: null,
  };
  const deleteState = (useSelector(selectDeleteHotelMealAllocation) as any) ?? {
    status: "idle",
    error: null,
  };

  const handleSkip = () => {
    if (onSkip) return onSkip();
    router.push(skipHref || "/dashboard");
  };

  const [mode, setMode] = useState<Mode>("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formErrors, setFormErrors] = useState<
    Record<string, string | undefined>
  >({});
  // ⬇️ allow empty strings so users can erase the value
  const [formData, setFormData] = useState({
    id: 0,
    breakfast: "",
    lunch: "",
    dinner: "",
    currencyCode: homeCurrency,
    ai: true,
  });

  useEffect(() => {
    dispatch(fetchHotelMealAllocations() as any);
  }, [dispatch]);

  useEffect(() => {
    if (
      createState.status === "succeeded" ||
      updateState.status === "succeeded"
    ) {
      setMode("create");
      setFormData((f) => ({
        id: 0,
        breakfast: "",
        lunch: "",
        dinner: "",
        currencyCode: f.currencyCode || homeCurrency,
        ai: false,
      }));
      dispatch(resetCreateHotelMealAllocationState() as any);
      dispatch(resetUpdateHotelMealAllocationState() as any);
      dispatch(fetchHotelMealAllocations() as any);
      setCurrentStep(steps.length - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createState.status, updateState.status]);

  // ⬇️ do not force "0" while typing; let it be empty
  const numChange =
    (key: "breakfast" | "lunch" | "dinner") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [key]: digits }));
      setFormErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  // Optional UX: clear an initial "0" on focus, restore "0" on blur if still empty
  const onZeroFocus = (key: "breakfast" | "lunch" | "dinner") => () =>
    setFormData((f) => (f[key] === "0" ? { ...f, [key]: "" } : f));
  const onZeroBlur = (key: "breakfast" | "lunch" | "dinner") => () =>
    setFormData((f) => (f[key] === "" ? { ...f, [key]: "" } : f)); // keep empty; submit will coerce to 0

  const validateStep = (idx: number) => {
    const err: Record<string, string | undefined> = {};
    switch (idx) {
      case 0: {
        const n = Number(formData.breakfast || 0);
        if (Number.isNaN(n) || n < 0)
          err.breakfast = "Breakfast must be a non-negative number.";
        break;
      }
      case 1: {
        const n = Number(formData.lunch || 0);
        if (Number.isNaN(n) || n < 0)
          err.lunch = "Lunch must be a non-negative number.";
        break;
      }
      case 2: {
        const n = Number(formData.dinner || 0);
        if (Number.isNaN(n) || n < 0)
          err.dinner = "Dinner must be a non-negative number.";
        break;
      }
      case 3: {
        if (!formData.currencyCode) err.currencyCode = "Currency is required.";
        break;
      }
      default:
        break;
    }
    setFormErrors(err);
    return Object.values(err).every((v) => v === undefined);
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const handlePrev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    setIsSubmitting(true);

    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;
    try {
      const payload = {
        id: hotelId,
        breakfast: Number(formData.breakfast || 0),
        lunch: Number(formData.lunch || 0),
        dinner: Number(formData.dinner || 0),
        currencyCode: formData.currencyCode,
        ai: true,
      };
      console.log("Submitting meal allocation:", payload, "Mode:", mode);

      if (mode === "create") {
        await dispatch(createHotelMealAllocation(payload) as any).unwrap();
      } else {
        await dispatch(updateHotelMealAllocation(payload) as any).unwrap();
      }
      router.replace("/create-taxes");
    } finally {
      setIsSubmitting(false);
    }
  };

  function RightAdornment({ text }: { text: string }) {
    return (
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 text-sm">
        {text}
      </span>
    );
  }

  const StepIcon = <Settings className="w-6 h-6" />;

  const steps = [
    {
      id: "breakfast",
      title: "Breakfast",
      description: "How much are you charging for breakfast?",
      icon: StepIcon,
      component: (
        <div className="space-y-2">
          <Label>Breakfast</Label>
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formData.breakfast}
              onChange={numChange("breakfast")}
              onFocus={onZeroFocus("breakfast")}
              onBlur={onZeroBlur("breakfast")}
              className="bg-white text-black pr-16" // <-- add padding-right
            />
            <RightAdornment text={homeCurrency} />{" "}
            {/* <-- shows on the right */}
          </div>
          {formErrors.breakfast && (
            <p className="text-sm text-red-500">{formErrors.breakfast}</p>
          )}
        </div>
      ),
    },
    {
      id: "lunch",
      title: "Lunch",
      description: "How much are you charging for a Lunch?",
      icon: StepIcon,
      component: (
        <div className="space-y-2">
          <Label>Lunch</Label>
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formData.lunch}
              onChange={numChange("lunch")}
              onFocus={onZeroFocus("lunch")}
              onBlur={onZeroBlur("lunch")}
              className="bg-white text-black pr-16" // padding-right for currency
            />
            <RightAdornment text={homeCurrency} /> {/* show currency */}
          </div>
          {formErrors.lunch && (
            <p className="text-sm text-red-500">{formErrors.lunch}</p>
          )}
        </div>
      ),
    },
    {
      id: "dinner",
      title: "Dinner",
      description: "How much are you charging for a Dinner?",
      icon: StepIcon,
      component: (
        <div className="space-y-2">
          <Label>Dinner</Label>
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formData.dinner}
              onChange={numChange("dinner")}
              onFocus={onZeroFocus("dinner")}
              onBlur={onZeroBlur("dinner")}
              className="bg-white text-black pr-16" // padding-right for currency
            />
            <RightAdornment text={homeCurrency} /> {/* show currency */}
          </div>
          {formErrors.dinner && (
            <p className="text-sm text-red-500">{formErrors.dinner}</p>
          )}
        </div>
      ),
    },
    // {
    //   id: "meta",
    //   title: "Plan Meta",
    //   description: "Currency & all-inclusive",
    //   icon: StepIcon,
    //   component: (
    //     <div className="space-y-6">
    //       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    //         <div>
    //           <Label>Currency</Label>
    //           <Select
    //             value={formData.currencyCode}
    //             onValueChange={(val) => {
    //               setFormData((f) => ({ ...f, currencyCode: val }));
    //               setFormErrors((prev) => ({
    //                 ...prev,
    //                 currencyCode: undefined,
    //               }));
    //             }}
    //           >
    //             <SelectTrigger className="bg-white text-black">
    //               <SelectValue
    //                 placeholder="Select currency"
    //                 className="bg-white text-black"
    //               />
    //             </SelectTrigger>
    //             <SelectContent className="bg-white text-black">
    //               {["USD", "LKR", "EUR", "GBP", "INR"].map((c) => (
    //                 <SelectItem key={c} value={c}>
    //                   {c}
    //                 </SelectItem>
    //               ))}
    //             </SelectContent>
    //           </Select>
    //           {formErrors.currencyCode && (
    //             <p className="text-sm text-red-500">
    //               {formErrors.currencyCode}
    //             </p>
    //           )}
    //         </div>
    //         {/* <div className="flex items-center gap-3">
    //           <Label>All-Inclusive</Label>
    //           <Switch
    //             checked={formData.ai}
    //             onCheckedChange={(v) => setFormData((f) => ({ ...f, ai: v }))}
    //           />
    //         </div> */}
    //       </div>
    //     </div>
    //   ),
    // },
    {
      id: "review",
      title: "Review & Submit",
      description: "Confirm your meal allocation",
      icon: <Check className="w-6 h-6" />,
      component: (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Breakfast:</span>
              <p className="text-gray-900">{formData.breakfast || "0"}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Lunch:</span>
              <p className="text-gray-900">{formData.lunch || "0"}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Dinner:</span>
              <p className="text-gray-900">{formData.dinner || "0"}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Currency:</span>
              <p className="text-gray-900">{formData.currencyCode}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">All-Inclusive:</span>
              <p className="text-gray-900">{formData.ai ? "Yes" : "No"}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Mode:</span>
              <p className="text-gray-900">
                {mode === "create" ? "Create" : "Edit"}
              </p>
            </div>
          </div>
          {createState.status === "failed" && createState.error && (
            <p className="text-sm text-red-600">
              Create error: {createState.error}
            </p>
          )}
          {updateState.status === "failed" && updateState.error && (
            <p className="text-sm text-red-600">
              Update error: {updateState.error}
            </p>
          )}
        </div>
      ),
    },
  ];

  const current = steps[currentStep];
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 flex items-center justify-center">
      <div className="top-10 right-10 absolute">
        <VideoButton
          onClick={() => setShowRawOverlay(true)}
          label="Watch Video"
        />
      </div>
      <div className="w-full max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex flex-row items-center justify-around mb-2">
          <div />
          <div className="flex flex-col">
            <Image
              src={Logo}
              alt="Logo"
              className="mx-auto"
              width={34}
              height={34}
            />
            <h1 className="font-extrabold text-slate-800 mt-2">HOTEL MATE</h1>
          </div>
          <div />
        </div>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <div className="flex items-center gap-4">
              {/* Updated Button Position */}

              <span className="text-sm text-gray-500">
                {progress}% Complete
              </span>
              <VideoButton
                onClick={() => setShowRawOverlay(true)}
                label="Watch Video"
              />
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Card className="border-0 shadow-xl bg-white max-w-2xl w-full">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 flex items-center justify-center text-white">
                  {current.icon}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {current.title}
                  </h1>
                  <p className="text-sm text-gray-600">{current.description}</p>
                </div>
              </div>

              <div className="mb-8">{current.component}</div>

              {/* Nav */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={currentStep === 0 ? handleSkip : handlePrev}
                  disabled={false} // allow skipping at step 1
                  className="flex items-center gap-2 bg-transparent text-black"
                >
                  {currentStep === 0 ? (
                    "Skip"
                  ) : (
                    <>
                      <ArrowLeft className="w-4 h-4" />
                      Previous
                    </>
                  )}
                </Button>

                {currentStep === steps.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      isSubmitting ||
                      createState.status === "loading" ||
                      updateState.status === "loading"
                    }
                    className="bg-gradient-to-r  from-teal-500  to-blue-500 hover:from-teal-600 hover:to-blue-600 flex items-center gap-2"
                  >
                    {isSubmitting ||
                    createState.status === "loading" ||
                    updateState.status === "loading"
                      ? "Saving..."
                      : mode === "create"
                      ? "Create Allocation"
                      : "Update Allocation"}
                    <Check className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Video Overlay */}
      <VideoOverlay
        videoUrl={videoUrl}
        isOpen={showRawOverlay}
        onClose={() => setShowRawOverlay(false)}
      />
    </div>
  );
}

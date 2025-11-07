// @ts-nocheck
"use client";

import { useDebounce } from "use-debounce";

import React from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { clearTokens } from "@/lib/tokenManager";
import {
  BarChart3,
  BedDouble,
  Bed,
  Building2,
  ChevronDown,
  Check,
  CreditCard,
  DollarSign,
  Globe,
  Hotel,
  LogOut,
  LogIn,
  MessageSquare,
  MessagesSquare,
  Archive,
  ShoppingCart,
  ShoppingBag,
  Users,
  UserRound,
  Bell,
  HelpCircle,
  LayoutDashboard,
  CalendarCheck,
  Home,
  Utensils,
  Banknote,
  ConciergeBell,
  FileText,
  DoorOpen,
  Tag,
  SatelliteDish,
  Boxes,
  Receipt,
  FileMinus,
  ArrowUpCircle,
  ArrowDownCircle,
  LineChart,
  Settings2,
  Coins,
  Percent,
  MapPin,
  Truck,
  LayoutList,
  Settings,
  BadgeDollarSign,
  Bot,
  X,
  Image,
  ListChecks,
  NotebookPen,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RootState } from "@/lib/store";
import { useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import LanguageSelector from "@/components/LanguageSelector";
import { ThemeSelector } from "@/components/theme-selector";
import {
  TranslationProvider,
  useTranslatedText,
  LANGUAGES,
  useTranslation,
} from "@/lib/translation";
import { getHotelByGuid } from "@/controllers/getHotelByGuidController";
import { getAdminAllHotels } from "@/controllers/adminAllHotelsController";
import { createReservationActivityLog } from "@/controllers/reservationActivityLogController";
import { createNightAudit } from "@/controllers/nightAuditController";

interface MenuGroup {
  label: string;
  icon: React.ComponentType<any>;
  items?: { name: string; href: string; icon: React.ComponentType<any> }[];
  href?: string;
}

const menuGroups: MenuGroup[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Reservation",
    icon: CalendarCheck,
    items: [
      { name: "Front Desk", href: "/reservation/front-desk", icon: LayoutList },
      { name: "Bookings", href: "/reservation/bookings", icon: NotebookPen },
      { name: "Arrivals", href: "/reservation/arrivals", icon: LogIn },
      { name: "Departures", href: "/reservation/departures", icon: LogOut },
      { name: "In-House", href: "/reservation/inhouse", icon: DoorOpen },
      { name: "Travel Agents", href: "/settings/travel-agents", icon: MapPin },
    ],
  },
  {
    label: "Room & Rates",
    icon: Home,
    items: [
      { name: "Rooms", href: "/rooms/types", icon: Bed },
      { name: "Rates", href: "/rooms/rates", icon: Tag },
      { name: "Channels", href: "/rooms/channels", icon: SatelliteDish },
      { name: "Inventory", href: "/rooms/inventory", icon: Boxes },
    ],
  },
  {
    label: "POS",
    icon: Utensils,
    href: "/pos",
  },

  {
    label: "Financials",
    icon: Banknote,
    items: [
      { name: "Transactions", href: "/financials/transactions", icon: Receipt },
      { name: "Purchases", href: "/financials/purchases", icon: ShoppingBag },
      { name: "Expenses", href: "/financials/expenses", icon: FileMinus },
      { name: "Payables", href: "/financials/payables", icon: ArrowUpCircle },
      {
        name: "Receivables",
        href: "/financials/receivables",
        icon: ArrowDownCircle,
      },
      {
        name: "Profit & Loss",
        href: "/financials/profit-loss",
        icon: LineChart,
      },
    ],
  },
  {
    label: "Reports",
    icon: FileText,
    href: "/reports",
  },
  // Insert "Logs" before "Settings"
  {
    label: "Logs",
    icon: ListChecks,
    href: "/logs",
  },
  {
    label: "Gallery",
    icon: Image,
    href: "/gallery",
  },
  {
    label: "Settings",
    icon: Settings,
    items: [
      { name: "Users", href: "/settings/users", icon: UserRound },
      { name: "Property", href: "/settings/property", icon: Hotel },
      { name: "Currency", href: "/settings/currency", icon: Coins },
      { name: "Taxes", href: "/settings/taxes", icon: Percent },
      { name: "Suppliers", href: "/settings/suppliers", icon: Truck },
    ],
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setLanguage } = useTranslation();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartCount = cartItems?.length ?? 0;

  // State for day end modal visibility
  const [showDayEndModal, setShowDayEndModal] = useState(() => {
    if (typeof window === "undefined") return false;
    const shouldShow = localStorage.getItem("showDayEndModal") === "true";
    if (!shouldShow) return false;

    const nextPrompt = Number(localStorage.getItem("nextDayEndPrompt") || "0");
    return !nextPrompt || Date.now() >= nextPrompt;
  });
  // State for help slider visibility (persisted across route changes)
  const [showHelpModal, setShowHelpModal] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("helpSliderOpen") === "true";
  });
  // Hide modal and snooze for 5 minutes
  const handleRemindLater = () => {
    const nextTime = Date.now() + 5 * 60 * 1000; // 5 minutes
    localStorage.setItem("nextDayEndPrompt", String(nextTime));
    setShowDayEndModal(false);
  };

  // Reload the page once per session
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !sessionStorage.getItem("pageReloaded")
    ) {
      sessionStorage.setItem("pageReloaded", "true");
      window.location.reload();
    }
  }, []);
  // SidebarHeaderWithState: wrapper to inject sidebar state
  function SidebarHeaderWithState(
    props: React.ComponentProps<typeof SidebarHeader>
  ) {
    const { state } = useSidebar();
    return <SidebarHeader {...props} state={state} />;
  }

  // SidebarFooterWithState: wrapper to inject sidebar state
  function SidebarFooterWithState(
    props: React.ComponentProps<typeof SidebarFooter>
  ) {
    const { state } = useSidebar();
    return <SidebarFooter {...props} state={state} />;
  }

  const [activeHotel, setActiveHotel] = useState("");
  const [hotels, setHotels] = useState<
    { id: number; name: string; guid: string | null; hotelCode?: string }[]
  >([]);
  const [fullName, setFullName] = useState("User");
  const [email, setEmail] = useState("user@example.com");
  const [systemDate, setSystemDate] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 200);
  const filteredHotels = hotels.filter(
    (hotel) =>
      hotel.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (hotel.hotelCode ? String(hotel.hotelCode).toLowerCase() : "").includes(
        debouncedQuery.toLowerCase()
      )
  );
  // Dropdown state for SidebarHeaderContent
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef<number>(0);

  useEffect(() => {
    async function checkHotelDate() {
      const selectedProperty = localStorage.getItem("selectedProperty");
      const selected = selectedProperty ? JSON.parse(selectedProperty) : null;
      const guid = selected?.guid;

      console.log("Checking hotel date for guid:", guid);

      if (guid) {
        try {
          const tokenString = localStorage.getItem("hotelmateTokens");
          const accessToken = tokenString
            ? JSON.parse(tokenString).accessToken
            : null;

          if (!accessToken) {
            console.error(
              "Missing access token — cannot authorize hotel data request."
            );
            return;
          }

          const hotel = await getHotelByGuid({
            token: accessToken,
            hotelGuid: guid,
          });
          const hotelDate = hotel?.hotelDate?.split("T")[0];

          setSystemDate(hotelDate);
          const today = new Date().toISOString().split("T")[0];
          if (hotelDate < today) {
            const nextPrompt = Number(
              localStorage.getItem("nextDayEndPrompt") || "0"
            );
            if (!nextPrompt || Date.now() >= nextPrompt) {
              localStorage.setItem("showDayEndModal", "true");
              setShowDayEndModal(true);
            }
          } else {
            localStorage.setItem("showDayEndModal", "false");
            setShowDayEndModal(false);
          }
        } catch (err) {
          console.error("Failed to fetch hotel data:", err);
        }
      }
    }

    async function initializeHotels() {
      const storedName = localStorage.getItem("fullName");
      const storedEmail = localStorage.getItem("email");
      const userRole = localStorage.getItem("userRole");

      if (storedName) setFullName(storedName);
      if (storedEmail) setEmail(storedEmail);

      const tokenString = localStorage.getItem("hotelmateTokens");
      const token = tokenString ? JSON.parse(tokenString).accessToken : null;
      const storedHotels = localStorage.getItem("hotels");

      let parsedHotels: {
        id: number;
        name: string;
        guid: string | null;
        hotelCode?: string;
      }[] = [];

      if (userRole === "SuperAdmin" || userRole === "Admin") {
        try {
          if (!token) return;

          const data = await getAdminAllHotels({
            token,
          });

          const parsedHotels = data.map((hotel: any) => ({
            id: hotel.hotelID,
            guid: hotel.hotelGUID,
            hotelCode: hotel.hotelCode,
            name: hotel.hotelName,
          }));

          localStorage.setItem("hotels", JSON.stringify(parsedHotels));
        } catch (error) {
          console.error("Error fetching hotels:", error);
          return;
        }
      } else if (storedHotels) {
        try {
          parsedHotels = JSON.parse(storedHotels);
        } catch (error) {
          console.error("Failed to parse local hotels:", error);
        }
      }

      const isQrLogin = localStorage.getItem("qrLogin") === "true";
      setHotels(parsedHotels);
      if (parsedHotels.length === 0) {
        router.push(isQrLogin ? "/dashboard" : "/create-property");
        return;
      }

      const urlParams = window.location.search;
      const hotelCodeMatch = urlParams.match(/hotelCode(?:%3A|:)?(\d{4})/);
      const hotelCodeParam = hotelCodeMatch ? hotelCodeMatch[1] : "";

      let selectedHotel =
        parsedHotels.find((h) => String(h.hotelCode) === hotelCodeParam) ||
        (() => {
          const stored = localStorage.getItem("selectedProperty");
          if (stored) {
            const parsed = JSON.parse(stored);
            return parsedHotels.find((h) => h.id === parsed.id);
          }
          return undefined;
        })() ||
        parsedHotels[0];

      if (selectedHotel) {
        const selected = {
          id: selectedHotel.id,
          name: selectedHotel.name,
          guid: selectedHotel.guid,
          hotelCode: selectedHotel.hotelCode,
          currencyCode: selectedHotel.currencyCode,
        };
        localStorage.setItem("selectedProperty", JSON.stringify(selected));
        setActiveHotel(selectedHotel.name);
        await checkHotelDate();
      }
    }

    initializeHotels();
    // After initializeHotels, check hotelDate
    checkHotelDate();
  }, [typeof window !== "undefined" ? window.location.search : ""]);

  // Poll every minute; reopen modal once snooze interval has passed
  useEffect(() => {
    const interval = setInterval(() => {
      if (localStorage.getItem("showDayEndModal") === "true") {
        const nextPrompt = Number(
          localStorage.getItem("nextDayEndPrompt") || "0"
        );
        if (!nextPrompt || Date.now() >= nextPrompt) {
          localStorage.removeItem("nextDayEndPrompt");
          window.dispatchEvent(new CustomEvent("showDayEndReminder"));
        }
      }
    }, 60 * 1000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  // Listen for day end reminder event
  useEffect(() => {
    function handleReminder() {
      setShowDayEndModal(true);
    }
    window.addEventListener("showDayEndReminder", handleReminder);
    return () =>
      window.removeEventListener("showDayEndReminder", handleReminder);
  }, []);

  // Persist help slider open state across client-side navigations
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "helpSliderOpen",
        showHelpModal ? "true" : "false"
      );
    }
  }, [showHelpModal]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => {
      const defaults: Record<string, boolean> = {};
      menuGroups.forEach((group) => {
        if (group.items?.length) {
          defaults[group.label] = true;
        }
      });
      try {
        const saved = localStorage.getItem("expandedSidebarGroups");
        if (saved) {
          return { ...defaults, ...JSON.parse(saved) };
        }
      } catch (_) {}
      return defaults;
    }
  );

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const updated = { ...prev, [label]: !prev[label] };
      localStorage.setItem("expandedSidebarGroups", JSON.stringify(updated));
      return updated;
    });
  };

  const handleLogout = () => {
    clearTokens();
    localStorage.clear();
    sessionStorage.clear();
    router.push("/login");
  };

  // Handler for Day End Process button (fetch hotel details first, use hotelDate as systemTime/dateTime)
  // const handleDayEndProcess = async () => {
  //   const selectedProperty = localStorage.getItem("selectedProperty");
  //   const tokens = localStorage.getItem("hotelmateTokens");

  //   if (!selectedProperty || !tokens) {
  //     alert("Missing credentials for Night Audit.");
  //     return;
  //   }

  //   const { id, guid } = JSON.parse(selectedProperty);
  //   const { accessToken } = JSON.parse(tokens);
  //   const fullName = localStorage.getItem("fullName") || "";

  //   try {
  //     // Fetch hotel details to get system time
  //     const hotelData = await getHotelByGuid({
  //       token: accessToken,
  //       hotelGuid: guid,
  //     });

  //     const hotelDate = hotelData?.hotelDate;
  //     const hotelDate = hotelData[0]?.hotelDate;

  //     if (!hotelDate) {
  //       alert("Hotel date not found.");
  //       return;
  //     }

  //     // Calculate dateTime as one day after the nightAuditDate
  //     const nextDateTimeISO = (() => {
  //       const d = new Date(hotelDate);
  //       d.setDate(d.getDate() + 1);
  //       return d.toISOString();
  //     })();

  //     // Log "Night Audit started" before NightAudit POST
  //     await createReservationActivityLog({
  //       token: accessToken,
  //       payload: {
  //         logId: 0,
  //         username: fullName,
  //         hotelId: id,
  //         reservationId: 0,
  //         reservationDetailId: 0,
  //         resLog: "Night Audit started",
  //         createdOn: new Date().toISOString(),
  //         platform: "Web",
  //         reservationNo: "",
  //         roomNumber: "",
  //       },
  //     });

  //     await createNightAudit({
  //       token: accessToken,
  //       payload: {
  //         nightAuditDate: hotelDate,
  //         currentTimeStamp: nextDateTimeISO,
  //         hotelId: id,
  //         platform: "Web",
  //       },
  //     });

  //     if (!res.ok) throw new Error(`Night Audit failed: ${res.statusText}`);

  //     // Log "Night Audit completed successfully" after NightAudit POST
  //     await createReservationActivityLog({
  //       token: accessToken,
  //       payload: {
  //         logId: 0,
  //         username: fullName,
  //         hotelId: id,
  //         reservationId: 0,
  //         reservationDetailId: 0,
  //         resLog: "Night Audit completed successfully",
  //         createdOn: new Date().toISOString(),
  //         platform: "Web",
  //         reservationNo: "",
  //         roomNumber: "",
  //       },
  //     });

  //     localStorage.setItem("showDayEndModal", "false");
  //     setShowDayEndModal(false);
  //     localStorage.removeItem("nextDayEndPrompt");

  //     alert("Day End Process completed successfully.");
  //     // Reload the page to reflect the updated system date
  //     window.location.reload();
  //   } catch (err) {
  //     console.error(err);
  //     alert("Failed to complete Day End Process.");
  //   }
  // };

  // Modal for day end process
  const dayEndModal = showDayEndModal && (
    <Dialog open={true} onOpenChange={(open) => setShowDayEndModal(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Day End Process Required</DialogTitle>
          <DialogDescription>
            The hotel’s system date&nbsp;
            <strong>{systemDate ?? "Unknown"}</strong>&nbsp;does not match
            today’s date&nbsp;
            <strong>{new Date().toISOString().split("T")[0]}</strong>
            .&nbsp;Please run the Day&nbsp;End&nbsp;Process.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="default" onClick={handleDayEndProcess}>
            Run Day End Process
          </Button>
          <Button variant="outline" onClick={handleRemindLater}>
            Remind me in 5&nbsp;minutes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Sliding panel for help section
  const helpSlider = showHelpModal && (
    <div className="w-[480px] h-full flex flex-col border-l bg-background shadow-lg">
      <header className="flex items-center justify-between h-14 lg:h-[60px] border-b px-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="text-base font-semibold">Hotel Mate AI</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowHelpModal(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </header>
      <ChatPdfChatPanel
        sourceId="cha_HPgux7KjNvrmA8aVlzI93"
        apiKey="sec_E8Qrux50P2yaQn7Zxk5PWQLfSIE3BWst"
      />
    </div>
  );

  // Notification drawer state and component
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const notificationDrawer = showNotificationDrawer && (
    <div className="w-[480px] h-full flex flex-col border-l bg-background shadow-lg">
      <header className="flex items-center justify-between h-14 lg:h-[60px] border-b px-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <span className="text-base font-semibold">Notifications</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNotificationDrawer(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </header>
      <div className="flex-1 overflow-auto p-4 space-y-2 text-sm">
        <div className="p-3 border rounded-md shadow-sm bg-muted">
          Reservation #10234 has been confirmed.
        </div>
        <div className="p-3 border rounded-md shadow-sm bg-muted">
          New support ticket from guest John Doe.
        </div>
        <div className="p-3 border rounded-md shadow-sm bg-muted">
          Night Audit completed successfully.
        </div>
      </div>
    </div>
  );

  return (
    <TranslationProvider
      language={
        typeof window !== "undefined"
          ? localStorage.getItem("language") || "en"
          : "en"
      }
    >
      <SidebarProvider defaultOpen={false}>
        <div className="flex h-screen w-full group relative">
          {dayEndModal}
          <Sidebar className="border-r border-border/40 transition-all duration-300 shrink-0 bg-sidebar/20 backdrop-blur-lg backdrop-saturate-150">
            <SidebarHeaderWithState className="">
              <MemoizedSidebarHeaderContent
                activeHotel={activeHotel}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredHotels={filteredHotels}
                setActiveHotel={setActiveHotel}
                isDropdownOpen={isDropdownOpen}
                setIsDropdownOpen={setIsDropdownOpen}
              />
            </SidebarHeaderWithState>

            <SidebarContent>
              <ScrollArea className="h-full -mt-2" ref={scrollRef}>
                <SidebarMenuList
                  pathname={pathname ?? ""}
                  expandedGroups={expandedGroups}
                  toggleGroup={toggleGroup}
                />
              </ScrollArea>
            </SidebarContent>

            <SidebarFooterWithState fullName={fullName}>
              <SidebarFooterContent
                fullName={fullName}
                email={email}
                handleLogout={handleLogout}
              />
            </SidebarFooterWithState>

            <SidebarRail />
          </Sidebar>

          <div className="flex flex-1 flex-col overflow-hidden">
            <header className="flex h-14 items-center border-b bg-background pe-4 ps-4 lg:h-[60px] lg:pe-6">
              <SidebarTrigger />
              <h1 className="ml-3 text-xl font-semibold">
                <PageTitle />
              </h1>
              <div className="ml-auto flex items-center gap-4">
                {systemDate && (
                  <div className="text-sm text-muted-foreground">
                    System Date: {systemDate}
                  </div>
                )}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/pos")}
                  >
                    <ShoppingBag className="h-5 w-5" />
                  </Button>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow">
                      {cartCount}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowHelpModal(false);
                    setShowNotificationDrawer(true);
                  }}
                >
                  <Bell className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNotificationDrawer(false);
                    setShowHelpModal(true);
                  }}
                >
                  <Bot className="h-4 w-4" />
                  AI
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/support")}
                >
                  <HelpCircle className="h-4 w-4" />
                  Support
                </Button>
                <ThemeSelector />
                <LanguageSelector />
              </div>
            </header>
            <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
          </div>
          {helpSlider}
          {notificationDrawer}
        </div>
      </SidebarProvider>
    </TranslationProvider>
  );
}

function TranslatedText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const translatedText = useTranslatedText(text);
  return <span className={className}>{translatedText}</span>;
}

function PageTitle() {
  let title = "Dashboard";
  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    if (path.includes("/dashboard")) title = "Dashboard";
    else if (path.includes("/reports")) title = "Reports";
    else if (path.includes("/support")) title = "Support";
    else if (path.includes("/logs")) title = "Logs";
    else if (path.includes("/chat")) title = "Messages";
    else if (path.includes("/gallery")) title = "Gallery";
    else if (path.includes("/reservation/front-desk")) title = "Front Desk";
    else if (path.includes("/reservation/bookings")) title = "Bookings";
    else if (path.includes("/reservation/arrivals")) title = "Arrivals";
    else if (path.includes("/reservation/departures")) title = "Departures";
    else if (path.includes("/reservation/inhouse")) title = "In-House";
    else if (path.includes("/rooms/types")) title = "Rooms";
    else if (path.includes("/rooms/rates")) title = "Rates";
    else if (path.includes("/rooms/channels")) title = "Channels";
    else if (path.includes("/rooms/inventory")) title = "Inventory";
    else if (path.includes("/pos")) title = "Point of Sale";
    else if (path.includes("/financials/purchases")) title = "Purchases";
    else if (path.includes("/financials/expenses")) title = "Expenses";
    else if (path.includes("/financials/payables")) title = "Payables";
    else if (path.includes("/financials/receivables")) title = "Receivables";
    else if (path.includes("/financials/profit-loss")) title = "Profit & Loss";
    else if (path.includes("/financials/transactions")) title = "Transactions";
    else if (path.includes("/settings/users")) title = "Users";
    else if (path.includes("/settings/currency")) title = "Currency";
    else if (path.includes("/settings/taxes")) title = "Taxes";
    else if (path.includes("/settings/travel-agents")) title = "Travel Agents";
    else if (path.includes("/settings/suppliers")) title = "Suppliers";
    else if (path.includes("/settings/property")) title = "Property";
    else if (path.includes("/account")) title = "Account";
    else if (path.includes("/billing")) title = "Billing";
    else if (path.includes("/notifications")) title = "Notifications";
  }
  return <TranslatedText text={title} />;
}

// SidebarHeaderContent: Collapsed/Expanded header logic
function SidebarHeaderContent({
  activeHotel,
  searchQuery,
  setSearchQuery,
  filteredHotels,
  setActiveHotel,
  isDropdownOpen,
  setIsDropdownOpen,
}: {
  activeHotel: string;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  filteredHotels: {
    id: number;
    name: string;
    guid: string | null;
    hotelCode?: string;
  }[];
  setActiveHotel: (name: string) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (val: boolean) => void;
}) {
  const { state } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isDropdownOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const dropdown = document.getElementById("hotel-selector-dropdown");
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);
  if (state === "collapsed") {
    return (
      <div className="flex items-center justify-center mt-[-16px]">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-muted/60 shadow-inner border border-border hover:ring-2 hover:ring-primary transition-colors">
              <img
                src="/app-icon.png"
                alt="Hotel Mate Logo"
                className="h-7 w-7 object-contain"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">Hotel Mate</TooltipContent>
        </Tooltip>
      </div>
    );
  }
  // Expanded header (custom dropdown)
  // Get selected hotel id from localStorage
  const storedHotel =
    typeof window !== "undefined"
      ? localStorage.getItem("selectedProperty")
      : null;
  const selectedHotelId = storedHotel ? JSON.parse(storedHotel).id : null;
  return (
    <div className="px-2 py-2 bg-muted/40 border border-border rounded-md">
      <div className="relative">
        <Button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full justify-start gap-2 px-2 bg-secondary text-primary hover:bg-secondary"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-secondary text-primary">
              <img
                src="/app-icon.png"
                alt="Hotel Mate Logo"
                className="h-6 w-6"
              />
            </div>
            <div className="flex flex-1 flex-col items-start overflow-hidden">
              {/* Render hotel name as raw text, never translated */}
              <div
                className="text-sm font-medium leading-none text-primary notranslate"
                translate="no"
              >
                {activeHotel}
              </div>
              <span
                className="text-xs text-sidebar-foreground/60 notranslate"
                translate="no"
              >
                Hotel Mate
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
        {isDropdownOpen && (
          <div
            id="hotel-selector-dropdown"
            className="absolute z-50 mt-1 w-full rounded-md border bg-secondary p-2 shadow"
          >
            <div className="p-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search Hotels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border px-2 py-1 text-sm focus:outline-none"
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredHotels.length === 0 && (
                <div className="text-center text-sm text-muted-foreground p-2">
                  No hotels found
                </div>
              )}
              {filteredHotels.slice(0, 10).map((hotel) => (
                <div
                  key={hotel.id}
                  className={`cursor-pointer px-2 py-1 rounded-md transition-colors ${
                    selectedHotelId === hotel.id
                      ? "bg-muted-foreground/10 text-primary hover:bg-muted-foreground/10"
                      : "hover:bg-muted/40"
                  }`}
                  onClick={() => {
                    const selected = {
                      id: hotel.id,
                      name: hotel.name,
                      guid: hotel.guid,
                      hotelCode: hotel.hotelCode,
                    };
                    const previous = localStorage.getItem("selectedProperty");
                    localStorage.setItem(
                      "selectedProperty",
                      JSON.stringify(selected)
                    );
                    setActiveHotel(hotel.name);
                    if (!previous || JSON.parse(previous).id !== hotel.id) {
                      window.location.reload();
                    }
                  }}
                >
                  <div className="flex flex-col">
                    {/* Render hotel name as raw text, never translated */}
                    <span className="text-sm">{hotel.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {hotel.hotelCode || "-"}
                    </span>
                  </div>
                </div>
              ))}
              <div className="mt-2 text-center">
                <Link
                  href="/create-property"
                  className="text-sm text-primary hover:underline"
                >
                  + <TranslatedText text="Add Property" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// SidebarFooterContent: Collapsed/Expanded footer logic
function SidebarFooterContent({
  fullName,
  email,
  handleLogout,
}: {
  fullName: string;
  email: string;
  handleLogout: () => void;
}) {
  const { state } = useSidebar();
  if (state === "collapsed") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/60 shadow-inner border border-border hover:ring-2 hover:ring-primary transition-colors">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            {/* Render fullName as raw text, never translated */}
            {fullName}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/60 shadow-inner border border-border hover:ring-2 hover:ring-primary transition-colors">
              <Link href="/billing">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </Link>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <TranslatedText text="View Subscription" />
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }
  // Expanded footer (DropdownMenu and View Subscription link)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start px-2">
            <div className="flex w-full items-center gap-2">
              <div className="h-8 w-8 flex items-center justify-center rounded-full border">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col items-start text-left">
                {/* Render fullName as raw text, never translated */}
                <p
                  className="text-sm font-medium leading-none notranslate"
                  translate="no"
                >
                  {fullName}
                </p>
                <p className="text-xs text-muted-foreground max-w-[140px] truncate">
                  {email}
                </p>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>
            <TranslatedText text="My Account" />
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Check className="mr-2 h-4 w-4" />
            <Link href="/account">
              <TranslatedText text="Account" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" />
            <Link href="/notifications">
              <TranslatedText text="Notifications" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-rose-500 focus:bg-rose-500/10 focus:text-rose-500"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <TranslatedText text="Log Out" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="p-2">
        <Link href="/billing">
          <Button className="w-full" variant="outline">
            <BadgeDollarSign className="mr-2 h-4 w-4" />
            <TranslatedText text="View Subscription" />
          </Button>
        </Link>
      </div>
    </>
  );
}
// SidebarMenuList: renders menu groups using useSidebar inside provider
function SidebarMenuList({
  pathname,
  expandedGroups,
  toggleGroup,
}: {
  pathname: string;
  expandedGroups: Record<string, boolean>;
  toggleGroup: (label: string) => void;
}) {
  const { state } = useSidebar();
  // Update: aggressively compress vertical spacing between collapsed items
  const collapsedButtonClasses =
    "rounded-lg h-6 w-6 flex items-right justify-right hover:bg-muted/40 transition-colors group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!h-5 group-data-[collapsible=icon]:!my-[-2px]";
  const menuSpacingClass =
    state === "collapsed" ? "space-y-[1px]" : "space-y-1";
  const activeButtonClasses = "bg-muted-foreground/20 text-primary";
  const router = useRouter();
  return (
    <>
      {menuGroups.map((group) => {
        const hasSubItems = !!group.items?.length;
        const isGroupActive =
          pathname &&
          (group.href === pathname ||
            group.items?.some((item) => pathname.startsWith(item.href)));
        // Updated logic for isExpanded: allow toggling even when expanded
        const isExpanded = expandedGroups[group.label] ?? false;
        const handleToggle = () => {
          toggleGroup(group.label);
          // Do nothing – just toggle
        };

        return (
          <SidebarGroup key={group.label}>
            <SidebarGroupContent>
              <SidebarMenu className={menuSpacingClass}>
                <SidebarMenuItem>
                  {hasSubItems ? (
                    <>
                      <SidebarMenuButton
                        tooltip={group.label}
                        className={`${
                          isGroupActive ? activeButtonClasses : ""
                        } ${
                          state === "collapsed" ? collapsedButtonClasses : ""
                        }`}
                        onClick={handleToggle}
                      >
                        <group.icon className="h-4 w-4" />
                        {state !== "collapsed" && (
                          <>
                            <TranslatedText text={group.label} />
                            <ChevronDown
                              className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </>
                        )}
                      </SidebarMenuButton>
                      {state !== "collapsed" && isExpanded && (
                        <SidebarMenuSub className="!block">
                          {(group.items ?? []).map((item) => {
                            const isActive = pathname === item.href;
                            return (
                              <SidebarMenuSubItem key={item.name}>
                                <SidebarMenuSubButton asChild>
                                  <Link
                                    href={item.href}
                                    className={`flex items-center ${
                                      isActive
                                        ? `${activeButtonClasses} font-medium`
                                        : ""
                                    }`}
                                  >
                                    <item.icon className="h-4 w-4 mr-2" />
                                    <TranslatedText text={item.name} />
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      )}
                    </>
                  ) : (
                    <SidebarMenuButton asChild tooltip={group.label}>
                      <Link
                        href={group.href || "#"}
                        className={`flex items-center ${
                          pathname === group.href
                            ? `${activeButtonClasses} font-medium`
                            : ""
                        } ${
                          state === "collapsed" ? collapsedButtonClasses : ""
                        }`}
                      >
                        <group.icon className="h-4 w-4 mr-2" />
                        {state !== "collapsed" && (
                          <TranslatedText text={group.label} />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}

function ChatPdfChatPanel({
  sourceId,
  apiKey,
}: {
  sourceId: string;
  apiKey: string;
}) {
  // Guard against missing / malformed IDs
  if (
    !sourceId ||
    (!sourceId.startsWith("src_") && !sourceId.startsWith("cha_"))
  ) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-sm text-red-500">
        Invalid ChatPDF source ID. It must start with <code>src_</code> or{" "}
        <code>cha_</code>.
      </div>
    );
  }
  const [messages, setMessages] = React.useState<
    { role: "user" | "assistant"; content: string }[]
  >([{ role: "assistant", content: "Hi! Ask me anything about Hotel Mate." }]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function sendMessage() {
    const question = input.trim();
    if (!question) return;

    const updated = [...messages, { role: "user", content: question }];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://api.chatpdf.com/v1/chats/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          sourceId,
          messages: updated.slice(-6), // ChatPDF allows up to 6 prior messages
        }),
      });
      const data = await res.json();

      if (data?.content) {
        setMessages([...updated, { role: "assistant", content: data.content }]);
      } else {
        setMessages([
          ...updated,
          {
            role: "assistant",
            content: `Error: ${data?.error ?? "Unknown error"}`,
          },
        ]);
      }
    } catch (err: any) {
      setMessages([
        ...updated,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Message history */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-md p-3 text-sm ${
              m.role === "user"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="rounded-md p-3 bg-muted animate-pulse text-muted-foreground">
            ChatPDF is thinking…
          </div>
        )}
      </div>

      {/* Input box */}
      <div className="border-t p-4 flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder="Type your question and press Enter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button onClick={sendMessage} disabled={loading}>
          Send
        </Button>
      </div>
    </div>
  );
}

const MemoizedSidebarHeaderContent = React.memo(SidebarHeaderContent);

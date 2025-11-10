"use client";

import * as signalR from "@microsoft/signalr";

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
  UserRoundCheck,
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
  Activity,
  Palette,
  KeyRound,
  Fullscreen,
  Minimize2,
  ExternalLink,
  Building,
  Sun,
  LayoutGrid,
  Calendar,
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
import { useSignalR } from "@/lib/SignalRContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useStoredCurrencyCode } from "@/hooks/useStoredCurrencyCode";
import { RootState } from "@/redux/store";
import { ChangePasswordDrawer } from "./drawers/change-password-drawer";
import { useClientTelemetry } from "@/hooks/useClientTelemetry";
import { usePublicIp } from "@/hooks/usePublicIp";
import { useHotelMateTelemetry } from "@/hooks/useHotelMateTelemetry";
import {
  NotificationDrawer,
  ToDoDrawerContent,
} from "@/components/drawers/notification-drawer";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Function to get current hotel code from localStorage (client-side only)
const getCurrentHotelCode = () => {
  if (typeof window !== "undefined") {
    const selectedProperty = localStorage.getItem("selectedProperty");
    if (selectedProperty) {
      try {
        const parsed = JSON.parse(selectedProperty);
        return parsed.hotelCode || "";
      } catch (error) {
        console.error("Error parsing selectedProperty:", error);
        return "";
      }
    }
  }
  return "";
};

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
    label: "Front Desk",
    icon: LayoutList,
    href: "/front-desk",
  },
  {
    label: "Reservation",
    icon: CalendarCheck,
    items: [
      // { name: "Front Desk", href: "/reservation/front-desk", icon: LayoutList },
      { name: "Bookings", href: "/reservation/bookings", icon: NotebookPen },
      { name: "Arrivals", href: "/reservation/arrivals", icon: LogIn },
      { name: "Departures", href: "/reservation/departures", icon: LogOut },
      { name: "In-House", href: "/reservation/inhouse", icon: DoorOpen },
      { name: "Travel Agents", href: "/settings/travel-agents", icon: MapPin },
      {
        name: "Guest Profile",
        href: "/reservation/guest-profiles",
        icon: Users,
      },
    ],
  },
  {
    label: "Room & Rates",
    icon: Home,
    items: [
      { name: "Inventory", href: "/rooms/inventory", icon: Boxes },
      { name: "Basis", href: "/rooms/basis", icon: Tag },
      { name: "Category", href: "/rooms/category", icon: Utensils },
      { name: "Seasons", href: "/rooms/seasons", icon: Sun },
      { name: "Markets", href: "/rooms/markets", icon: ShoppingBag },
    ],
  },
    {
    label: "Configuration",
    icon: Home,
    items: [
      { name: "Meal Allocation", href: "/configuration/meal-allocation", icon: Boxes },
      { name: "Nationality", href: "/configuration/nationality", icon: Tag },
      { name: "Tax Table", href: "/configuration/tax-table", icon: Utensils },
      { name: "Reservation Resource", href: "/configuration/reservation-resource", icon: Sun },
    ],
  },
  
  {
    label: "POS",
    icon: Utensils,
    href: "/pos",
  },
  {
    label: "Property",
    icon: Building,
    items: [
      { name: "audit", href: "/property/audit", icon: FileText },
    ],
  },
  {
    label: "Housekeeping",
    icon: ConciergeBell,
    items: [
      { name: "Housekeeping", href: "/housekeeping", icon: Boxes },
      { name: "Room View", href: "/housekeeping/room-view", icon: LayoutGrid },
    ],
    // href: "/housekeeping",
  },
  {
    label: "Events",
    icon: Calendar,
    items: [
      { name: "Events List", href: "/events/event-list", icon: Calendar },
      { name: "Event Types", href: "/events/event-types", icon: CalendarCheck },
      { name: "Venues", href: "/events/venues", icon: Building2 },
    ],
  },
  {
    label: "Reports",
    icon: FileText,
    href: "/reports",
  },
  {
    label: "Night Audit",
    icon: Activity,
    href: "/night-audit",
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setLanguage } = useTranslation();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartCount = cartItems?.length ?? 0;

  // SignalR notification state

  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const connectionRef = useRef<any>(null);
  const [defaultTestSent, setDefaultTestSent] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const currency = useStoredCurrencyCode();

  console.log("Current Currency:", currency);

  const { onReservationUpdate, isConnected } = useSignalR();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isSignalRConnected, setIsSignalRConnected] = useState(false);
  const [showFullBoard, setShowFullBoard] = useState(false);

  useEffect(() => {
    const open = () => setShowFullBoard(true);
    window.addEventListener("open-todo-full-board", open);
    return () => window.removeEventListener("open-todo-full-board", open);
  }, []);

  console.log(
    "🔔 SignalR Connection Status:",
    isConnected ? "Connected" : "Disconnected"
  );

  useEffect(() => {
    onReservationUpdate((data: any) => {
      console.log("🔔 SignalR Notification:", data);
      setNotifications((prev) => [data, ...prev]);
      setIsSignalRConnected(true); // ✅ update connection status
    });
  }, [onReservationUpdate]);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.error("Fullscreen toggle failed:", e);
    }
  };

  const [showDayEndModal, setShowDayEndModal] = useState(false); // Night Audit disabled
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

  useEffect(() => {
    function openDrawer() {
      setShowChangePassword(true);
    }
    window.addEventListener("open-change-password-drawer", openDrawer);
    return () =>
      window.removeEventListener("open-change-password-drawer", openDrawer);
  }, []);

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

  const notificationItems: NotificationItem[] = notifications.map(
    (n: any, i: number) => ({
      id: n.id ?? i,
      title: n.title, // if exists in your payload
      message: typeof n === "string" ? n : n.message ?? JSON.stringify(n),
      createdAt: n.createdAt, // if exists
    })
  );

  useEffect(() => {
    async function initializeHotels() {
      try {
        const codeFromStorage =
          (typeof window !== "undefined" &&
            (localStorage.getItem("hotelCode") || "")) ||
          "";
        const hotelCode =
          codeFromStorage && codeFromStorage.trim() !== ""
            ? codeFromStorage
            : "1097";

        // Fetch the single hotel by code — no auth headers required
        const url = `${BASE_URL}/api/HotelMas?hotelCode=${encodeURIComponent(hotelCode)}`;
        const resp = await axios.get(url);
        const data = resp.data;
        // The API returns an array; pick the one that matches our code or the first item
        const matched =
          (Array.isArray(data) ? data : []).find(
            (h) => String(h?.hotelCode) === String(hotelCode)
          ) || (Array.isArray(data) ? data[0] : null);

        if (!matched) {
          console.error("No hotel found for code:", hotelCode);
          return;
        }

        const normalized = {
          id: matched.hotelID ?? matched.id ?? 0,
          name: matched.hotelName ?? matched.name ?? "Hotel",
          guid: matched.guid ?? matched.hotelGUID ?? null,
          hotelCode: String(matched.hotelCode ?? hotelCode),
        };

        // Persist a single-item hotels list and always select 1097
        const list = [normalized];
        setHotels(list);

        const selected = {
          id: normalized.id,
          name: normalized.name,
          guid: normalized.guid,
          hotelCode: normalized.hotelCode,
        };
        localStorage.setItem("selectedProperty", JSON.stringify(selected));
        // Also persist the hotelCode key if not present
        if (!localStorage.getItem("hotelCode")) {
          localStorage.setItem("hotelCode", normalized.hotelCode);
        }
        setActiveHotel(normalized.name);

        // Night Audit flow intentionally disabled:
        // - do not check hotel system date
        // - do not show Day End modal
        setShowDayEndModal(false);
      } catch (err) {
        console.error("initializeHotels failed:", err);
      }
    }

    initializeHotels();
  }, [typeof window !== "undefined" ? window.location.search : ""]);

  /* Night Audit disabled
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
  */

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

  const THEME_KEY = "theme"; // e.g., "hotelmate-theme" if you changed it

  const handleLogout = () => {
    try {
      // 1) Snapshot current theme before clearing anything
      const currentTheme =
        localStorage.getItem(THEME_KEY) ||
        (document.documentElement.classList.contains("dark")
          ? "dark"
          : "light");

      // 2) Do your logout cleanup
      clearTokens?.();
      localStorage.clear();
      sessionStorage.clear();

      // 3) Restore ONLY the theme state
      if (currentTheme) {
        localStorage.setItem(THEME_KEY, currentTheme);

        // Apply immediately to prevent a flash of wrong theme
        if (currentTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }

      // 4) Go to login
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      router.push("/login");
    }
  };

  /* Night Audit disabled
  const handleDayEndProcess = async () => {
    // Night Audit process has been disabled per requirements.
  };
  */

  // Night Audit modal disabled
  const dayEndModal = null;

  // Sliding panel for help section
  const helpSlider = showHelpModal && (
    <div className="w-[480px] h-full flex flex-col border-l bg-background shadow-lg">
      <header className="flex items-center justify-between h-14 lg:h-[60px] border-b px-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="text-base font-semibold">AI</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowHelpModal(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </header>
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        src="https://bot.hotelmate.app/"
      ></iframe>
    </div>
  );

  // Notification drawer state and component
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const notificationDrawer = showNotificationDrawer && (
    <NotificationDrawer
      open={showNotificationDrawer}
      onClose={() => setShowNotificationDrawer(false)}
      title="To-Do"
      rightActions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFullBoard(true)}
        >
          <ExternalLink className="h-4 w-4 mr-1" /> Full Board
        </Button>
      }
    >
      <ToDoDrawerContent />
    </NotificationDrawer>
  );

  return (
    <TranslationProvider
      language={
        typeof window !== "undefined"
          ? localStorage.getItem("language") || "en"
          : "en"
      }
    >
      <SidebarProvider defaultOpen={true}>
        <div className="relative flex h-screen w-full group">
          {/* <div className={`absolute top-4 right-4 w-4 h-4 rounded-full ${connectionStatus === "Connected" && defaultTestSent ? "bg-green-500" : "bg-red-500"}`} /> */}
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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
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
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  aria-label={
                    isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"
                  }
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Fullscreen className="h-4 w-4" />
                  )}
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
            <main className="flex-1 overflow-auto p-4 lg:p-3">{children}</main>
          </div>
          {helpSlider}
          {notificationDrawer}
        </div>
        <ChangePasswordDrawer
          open={showChangePassword}
          onOpenChange={setShowChangePassword}
        />
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
  const [title, setTitle] = useState("Dashboard");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      let resolvedTitle = "Dashboard";
      if (path.includes("/dashboard")) resolvedTitle = "Dashboard";
      else if (path.includes("/reports")) resolvedTitle = "Reports";
      else if (path.includes("/support")) resolvedTitle = "Support";
      // else if (path.includes("/logs")) resolvedTitle = "Logs";
      else if (path.includes("/night-audit")) resolvedTitle = "Night Audit";
      else if (path.includes("/chat")) resolvedTitle = "Messages";
      // else if (path.includes("/gallery")) resolvedTitle = "Gallery";
      else if (path.includes("/housekeeping/room-view")) resolvedTitle = "Room View";
      else if (path.includes("/housekeeping")) resolvedTitle = "Housekeeping";
      else if (path.includes("/events/event-list")) resolvedTitle = "Events List";
      else if (path.includes("/events/event-types")) resolvedTitle = "Event Types";
      else if (path.includes("/events/venues")) resolvedTitle = "Venues";
      else if (path.includes("/reservation/front-desk"))
        resolvedTitle = "Front Desk";
      else if (path.includes("/reservation/bookings"))
        resolvedTitle = "Bookings";
      else if (path.includes("/reservation/arrivals"))
        resolvedTitle = "Arrivals";
      else if (path.includes("/reservation/departures"))
        resolvedTitle = "Departures";
      else if (path.includes("/reservation/inhouse"))
        resolvedTitle = "In-House";
      else if (path.includes("/reservation/guest-profiles"))
        resolvedTitle = "Guest Profiles";
      // else if (path.includes("/rooms/types")) resolvedTitle = "Rooms";
      // else if (path.includes("/rooms/rates")) resolvedTitle = "Rates";
      // else if (path.includes("/rooms/channels")) resolvedTitle = "Channels";
      else if (path.includes("/rooms/inventory")) resolvedTitle = "Inventory";
      else if (path.includes("/rooms/basis")) resolvedTitle = "Basis";
      else if (path.includes("/rooms/category")) resolvedTitle = "Category";
      else if (path.includes("/rooms/seasons")) resolvedTitle = "Seasons";
      else if (path.includes("/rooms/markets")) resolvedTitle = "Markets";
      else if (path.includes("/configuration/meal-allocation")) resolvedTitle = "Meal Allocation";
      else if (path.includes("/configuration/nationality")) resolvedTitle = "Nationality";
      else if (path.includes("/configuration/tax-table")) resolvedTitle = "Tax Table";
      else if (path.includes("/configuration/reservation-resource")) resolvedTitle = "Reservation Resource";
      else if (path.includes("/pos")) resolvedTitle = "Point of Sale";
      else if (path.includes("/property/audit")) resolvedTitle = "Audit";
      // else if (path.includes("/financials/purchases"))
      //   resolvedTitle = "Purchases";
      // else if (path.includes("/financials/expenses"))
      //   resolvedTitle = "Expenses";
      // else if (path.includes("/financials/payables"))
      //   resolvedTitle = "Payables";
      // else if (path.includes("/financials/receivables"))
      //   resolvedTitle = "Receivables";
      // else if (path.includes("/financials/profit-loss"))
      //   resolvedTitle = "Profit & Loss";
      // else if (path.includes("/financials/transactions"))
      //   resolvedTitle = "Transactions";
      // else if (path.includes("/settings/users")) resolvedTitle = "Users";
      // else if (path.includes("/settings/currency")) resolvedTitle = "Currency";
      // else if (path.includes("/settings/taxes")) resolvedTitle = "Taxes";
      else if (path.includes("/settings/travel-agents"))
        resolvedTitle = "Travel Agents";
      // else if (path.includes("/settings/suppliers"))
      //   resolvedTitle = "Suppliers";
      // else if (path.includes("/settings/property")) resolvedTitle = "Property";
      // else if (path.includes("/account")) resolvedTitle = "Account";
      // else if (path.includes("/billing")) resolvedTitle = "Billing";
      // else if (path.includes("/notifications")) resolvedTitle = "Notifications";

      setTitle(resolvedTitle);
    }
  }, []);

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
                    {
                      // Force selected property to always be 1097
                      const codeFromStorage =
                        (typeof window !== "undefined" &&
                          (localStorage.getItem("hotelCode") || "")) ||
                        "";
                      const hotelCode = codeFromStorage && codeFromStorage.trim() !== ""
                        ? codeFromStorage
                        : "1097";
                      const selected = {
                        id: hotel.id,
                        name: hotel.name,
                        guid: hotel.guid,
                        hotelCode,
                      };
                      localStorage.setItem("hotelCode", hotelCode);
                      localStorage.setItem("selectedProperty", JSON.stringify(selected));
                      setActiveHotel(hotel.name);
                      // Reload to ensure global context uses 1097 everywhere
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
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              // open the right-side drawer
              const evt = new CustomEvent("open-change-password-drawer");
              window.dispatchEvent(evt);
            }}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            <span>Change Password</span>
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
  // Function to get href for menu items
  const getMenuHref = (group: MenuGroup) => group.href || "#";

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
                        href={getMenuHref(group)}
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

const MemoizedSidebarHeaderContent = React.memo(SidebarHeaderContent);

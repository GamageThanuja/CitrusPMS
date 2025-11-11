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
  List,
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
  ForkKnife,
  Lock,
  Gift,
  ClipboardList,
  Clock,
  Sliders,
  Package,
  Inbox,
  Scale,
  Wallet,
  BarChart,
  ListOrdered,
  CheckSquare,
  MonitorPlay,
  ReceiptText,
  ScrollText,
  Briefcase,
  TrendingUp,
  UserCheck,
 
  CalendarX,
  CalendarDays,
  Megaphone,
  Store,
  ChefHat
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

interface MenuItem {
  name: string;
  href?: string;
  icon?: React.ComponentType<any>;
  items?: MenuItem[];
}

interface MenuGroup {
  label: string;
  icon: React.ComponentType<any>;
  items?: MenuItem[];
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
    label: "Rates",
    icon: Home,
    items: [
      
      { name: "Seasons", href: "/rates/seasons", icon: Sun },
      { name: "Markets", href: "/rates/markets", icon: ShoppingBag },
      { name: "Rooms Rates", href: "/rates/rooms-rates", icon: Percent },
      { name: "Rate Codes", href: "/rates/rate-codes", icon: BadgeDollarSign },
      { name: "Supplements", href: "/rates/supplements", icon: Gift },
    ],
  },
  {
    label: "Admin",
    icon: Home,
    items: [
      {
        name: "Configuration",
        icon: Settings2,
        // nested configuration submenu
        items: [
          {
            name: "Meal Allocation",
            href: "/admin/configuration/meal-allocation",
            icon: ForkKnife,
          },
          {
            name: "Nationality",
            href: "/admin/configuration/nationality",
            icon: Globe,
          },
          {
            name: "Tax Table",
            href: "/admin/configuration/tax-table",
            icon: Receipt,
          },
          {
            name: "Reservation Source",
            href: "/admin/configuration/reservation-source",
            icon: CalendarCheck,
          },
          {
            name: "Meal Plan",
            href: "/admin/configuration/meal-plan",
            icon: ChefHat,
          },
        ],
      },
      {
        name: "Point of Sales",
        icon: ShoppingCart,
        items: [
          {
            name: "Add-on Items",
            href: "/admin/point-of-sales/add-on-items",
            icon: ArrowUpCircle,
          },
          {
            name: "Attach Bar Items",
            href: "/admin/point-of-sales/attach-bar-items",
            icon: Settings,
          },
          {
            name: "Attach POS Items",
            href: "/admin/point-of-sales/attach-pos-items",
            icon: Settings,
          },
          {
            name: "Base Category",
            href: "/admin/point-of-sales/base-category",
            icon: LayoutGrid,
          },
          {
            name: "Compliment Types",
            href: "/admin/point-of-sales/compliment-types",
            icon: Tag,
          },
          {
            name: "Import POS Items",
            href: "/admin/point-of-sales/import-pos-items",
            icon: ArrowUpCircle,
          },
          {
            name: "Item Category",
            href: "/admin/point-of-sales/item-category",
            icon: Tag,
          },
          {
            name: "Item List",
            href: "/admin/point-of-sales/item-list",
            icon: LayoutList,
          },
          {
            name: "New Item",
            href: "/admin/point-of-sales/new-item",
            icon: ArrowUpCircle,
          },
          {
            name: "POS Center",
            href: "/admin/point-of-sales/POS-center",
            icon: SatelliteDish,
          },
          {
            name: "Service Items",
            href: "/admin/point-of-sales/service-items",
            icon: Settings,
          },
          { name: "SKU", href: "/admin/point-of-sales/SKU", icon: Tag },
          {
            name: "Sub Item",
            href: "/admin/point-of-sales/sub-item",
            icon: ArrowDownCircle,
          },
        ],
      },
      {
        name: "Property",
        icon: Building,
        items: [
          {
            name: "Audit Trail",
            href: "/admin/property/audit-trail",
            icon: FileText,
          },
          { name: "Backup", href: "/admin/property/backup", icon: Archive },
          { name: "Idea Hub", href: "/admin/property/idea-hub", icon: Palette },
          {
            name: "Property Detail",
            href: "/admin/property/property-detail",
            icon: Building2,
          },
          {
            name: "Property Preferences",
            href: "/admin/property/property-preferences",
            icon: Settings,
          },
          {
            name: "User Permissions",
            href: "/admin/property/user-permissions",
            icon: Lock,
          },
          {
            name: "User Roles",
            href: "/admin/property/user-roles",
            icon: Users,
          },
          { name: "Users", href: "/admin/property/users", icon: UserRound },
        ],
      },
      {
        name: "Rooms",
        icon: BedDouble,
        items: [
          {
            name: "Cross Booking",
            href: "/admin/rooms/croos-booking",
            icon: CalendarCheck,
          },
          {
            name: "Extra Charge",
            href: "/admin/rooms/extra-charge",
            icon: DollarSign,
          },
          {
            name: "Extra Charge Types",
            href: "/admin/rooms/extra-charge-types",
            icon: CreditCard,
          },
          {
            name: "Room Comp Category",
            href: "/admin/rooms/room-comp-category",
            icon: Tag,
          },
          { name: "Rooms", href: "/admin/rooms/rooms", icon: BedDouble },
          { name: "Room Type", href: "/admin/rooms/roomType", icon: Home },
        ],
      },
      {
        name: "Transactions",
        icon: Receipt,
        items: [
          {
            name: "Approvals",
            href: "/admin/transactions/approvals",
            icon: Check,
          },
          {
            name: "Change Res Status",
            href: "/admin/transactions/change-res-status",
            icon: Settings,
          },
          {
            name: "Import BB eZee",
            href: "/admin/transactions/import-bb-eZee",
            icon: ArrowDownCircle,
          },
          {
            name: "Import Res eZee",
            href: "/admin/transactions/import-res-eZee",
            icon: ArrowDownCircle,
          },
          {
            name: "Res Import IDS",
            href: "/admin/transactions/res-import-IDS",
            icon: ArrowDownCircle,
          },
          {
            name: "Room Bill Adv Proc",
            href: "/admin/transactions/room-bill-adv-proc",
            icon: FileText,
          },
          {
            name: "Super Admin",
            href: "/admin/transactions/super-admin",
            icon: Settings2,
          },
          {
            name: "System Update",
            href: "/admin/transactions/system-update",
            icon: Settings,
          },
          {
            name: "Tran Master",
            href: "/admin/transactions/tran-master",
            icon: Receipt,
          },
          {
            name: "Unlock Rate Table",
            href: "/admin/transactions/unlock-rate-table",
            icon: Settings,
          },
          {
            name: "Update Meal Alloc",
            href: "/admin/transactions/update-meal-alloc",
            icon: Utensils,
          },
        ],
      },
      {
        name: "Travel Agents",
        icon: MapPin,
        items: [
          {
            name: "Agent List",
            href: "/admin/travel-agents/agent-list",
            icon: LayoutList,
          },
          {
            name: "Create Agent",
            href: "/admin/travel-agents/create-agent",
            icon: ArrowUpCircle,
          },
        ],
      },
    ],
  },
  {
    label: "POS",
    icon: Utensils,
    items: [
      { name: "POS", href: "/point-of-sale/pos", icon: Utensils },
      { name: "POS Bill List", href: "/point-of-sale/pos-bill-list", icon: FileText },
      { name: "POS Order List", href: "/point-of-sale/pos-order-list", icon: LayoutList },
    ],
  },
  {
    label: "IBE",
    icon: Building,
    items: [
  { name: "IBE-Home", href: "/IBE/ibe-home", icon: FileText },
  { name: "User Permission", href: "/IBE/user-permission", icon: Lock },
  { name: "IBE Min Stay", href: "/IBE/IBE-min-stay", icon: Clock },
  { name: "IBE Packages", href: "/IBE/IBE-packages", icon: Package },
  { name: "IBE Preference", href: "/IBE/IBE-preference", icon: Sliders },
  { name: "IBE Promo", href: "/IBE/IBE-promo", icon: Tag },
  { name: "IBE Rates", href: "/IBE/rates", icon: DollarSign },
    ],
  },
    {
    label: "Channel Manager",
    icon: Globe,
    items: [
  { name: "Get Booking By ID", href: "/channel-manager/get-booking-by-id", icon: FileText },
  { name: "Bookings", href: "/channel-manager/bookings", icon: LayoutList },
  { name: "Full Refresh", href: "/channel-manager/full-refresh", icon: Clock },
  { name: "Process Pending IBE Booking", href: "/channel-manager/pending-ibe-booking", icon: Users },
  { name: "Rates Management", href: "/channel-manager/rates-management", icon: Sliders },
  { name: "Receive Log", href: "/channel-manager/receive-log", icon: Inbox },
  { name: "Reversations", href: "/channel-manager/reversations", icon: DollarSign },
  { name : "Room Mapping", href: "/channel-manager/room-mapping", icon: Settings}
    ],
  },
  {
    label: "Housekeeping",
    icon: ConciergeBell,
    items: [
      { name: "Housekeeping", href: "/housekeeping", icon: Boxes },
      { name: "Room View", href: "/housekeeping/room-view", icon: LayoutGrid },
      { name: "Housekeeping Home", href: "/housekeeping/hk-home", icon: Home },
      { name: "Housekeeping Board", href: "/housekeeping/hk-board", icon: ClipboardList },
      { name: "Housekeeping Log", href: "/housekeeping/hk-log", icon: ClipboardList },
      { name: "Housekeeping Staff", href: "/housekeeping/hk-staff", icon: Users },
      { name: "Laundry Jobs", href: "/housekeeping/laundry-jobs", icon: ShoppingBag },
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
      {
        name: "Create Event",
        href: "/events/create-event",
        icon: CalendarCheck,
      },
      {
        name: "Events Calendar",
        href: "/events/events-calender",
        icon: Calendar,
      },
      { name: "Leads Center", href: "/events/leads-center", icon: Users },
      {
        name: "Table Booking",
        href: "/events/table-booking",
        icon: LayoutList,
      },
      {
        name: "Table Booking List",
        href: "/events/table-booking-list",
        icon: LayoutList,
      },
    ],
  },
  {
    label: "Reports",
    icon: FileText,
    items: [
      {  
        name: "Reports",
        icon: FileText,
        href: "/reports",
      },  
      {  
        name: "Collection",
        icon: Wallet,
        items: [
          {
            name: "City Ledger",
            href: "/reports/collection/city-ledger",
            icon: Scale,
          },
          {
            name: "Collection Summary",
            href: "/reports/collection/collection-summary",
            icon: BarChart,
          },
          {
            name: "Collection Summary 2",
            href: "/reports/collection/collection-summary2",
            icon: ListOrdered,
          },
          {
            name: "Deposit Ledger",
            href: "/reports/collection/deposit-ledger",
            icon: Banknote,
          },
          {
            name: "Settlement Summary",
            href: "/reports/collection/settlement-summary",
            icon: CheckSquare,
          },
        ]
      },  
      {  
        name: "Point Of Sales",
        icon: MonitorPlay,
        items: [
          {
            name: "Item List",
            href: "/reports/point-of-sales/item-list",
            icon: Package,
          },
          {
            name: "KOT/BOT",
            href: "/reports/point-of-sales/kot-bot",
            icon: ReceiptText,
          },
          {
            name: "Meal Allocation",
            href: "/reports/point-of-sales/meal-allocation",
            icon: ForkKnife,
          },
          {
            name: "POS Bills",
            href: "/reports/point-of-sales/pos-bills",
            icon: ScrollText,
          },
          {
            name: "POS Bills Complementary",
            href: "/reports/point-of-sales/pos-bills-complementary",
            icon: Gift,
          },
          {
            name: "POS Bills Dept Charge",
            href: "/reports/point-of-sales/pos-bills-dept-charge",
            icon: Building,
          },
        ]
      },  
      {  
        name: "Property",
        icon: Building2,
        items: [
          {
            name: "Business On The Book",
            href: "/reports/property/business-on-the-book",
            icon: Briefcase,
          },
          {
            name: "Occupancy Forecast",
            href: "/reports/property/occupancy-forecast",
            icon: TrendingUp,
          },
          {
            name: "Occupancy Report",
            href: "/reports/property/occupancy-report",
            icon: UserCheck,
          },
          {
            name: "Reservation/Sales",
            href: "/reports/property/reservation-or-sales",
            icon: CalendarCheck,
          },
          {
            name: "Revenue Forecast",
            href: "/reports/property/revenue-forecast",
            icon: LineChart,
          },
          {
            name: "Revenue Overview",
            href: "/reports/property/revenue-overview",
            icon: Wallet,
          },
          {
            name: "Revenue Report",
            href: "/reports/property/revenue-report",
            icon: Receipt,
          },
          {
            name: "Room Revenue Report",
            href: "/reports/property/room-revenue-report",
            icon: Bed,
          },
        ]
      },  
      {  
        name: "Reservations",
        icon: CalendarDays,
        items: [
          {
            name: "Arrivals",
            href: "/reports/reservations/arrivals",
            icon: LogIn,
          },
          {
            name: "Cancellaations",
            href: "/reports/reservations/cancellations",
            icon: CalendarX,
          },
          {
            name: "Check-in/Check-out Detail",
            href: "/reports/reservations/check-in-check-out-detail",
            icon: Clock,
          },
          {
            name: "Departures",
            href: "/reports/reservations/departures",
            icon: LogOut,
          },
          {
            name: "In-house Guest List",
            href: "/reports/reservations/in-house-guest-list",
            icon: Users,
          },
          {
            name: "Information Sheet",
            href: "/reports/reservations/information-sheet",
            icon: FileText,
          },
          {
            name: "List Of Reservations",
            href: "/reports/reservations/list-of-reservations",
            icon: ListChecks,
          },
          {
            name: "Meal Forecast",
            href: "/reports/reservations/meal-forecast",
            icon: ForkKnife,
          },
        ]
      },  
      {  
        name: "Sales",
        icon: DollarSign,
        items: [
          {
            name: "Events Sales",
            href: "/reports/sales/events-sales",
            icon: Megaphone,
          },
          {
            name: "Outlet Sales",
            href: "/reports/sales/outlet-sales",
            icon: Store,
          },
          {
            name: "Rooms Sales",
            href: "/reports/sales/rooms-sales",
            icon: BedDouble,
          },
        ]
      },  
    ],
  },
   {
    label: "BI",
    icon: BarChart3,
    items: [
      { name: "Occupancy", href: "/BI/occupancy", icon: BarChart3 },
      { name: "Revenue", href: "/BI/revenue", icon: FileText },
      { name: "Snapshot", href: "/BI/snapshot", icon: LayoutList },
      { name: "Travellers", href: "/BI/travellers", icon: Users },
    ],
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
        const url = `${BASE_URL}/api/HotelMas?hotelCode=${encodeURIComponent(
          hotelCode
        )}`;
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
          // Also set default expanded state for sub-menus
          group.items.forEach((item) => {
            if (item.items?.length) {
              const subMenuKey = `${group.label}-${item.name}`;
              defaults[subMenuKey] = true;
            }
          });
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
      else if (path.includes("/reports/collection/city-ledger")) resolvedTitle = "City Ledger";
      else if (path.includes("/reports/collection/collection-summary2")) resolvedTitle = "Collection Summary 2";
      else if (path.includes("/reports/collection/collection-summary")) resolvedTitle = "Collection Summary";
      else if (path.includes("/reports/collection/deposit-ledger")) resolvedTitle = "Deposit Ledger";
      else if (path.includes("/reports/collection/settlement-summary")) resolvedTitle = "Settlement Summary";
      else if (path.includes("/reports/point-of-sales/item-list")) resolvedTitle = "Item List";
      else if (path.includes("/reports/point-of-sales/kot-bot")) resolvedTitle = "KOT/BOT";
      else if (path.includes("/reports/point-of-sales/meal-allocation")) resolvedTitle = "Meal Allocation";
      else if (path.includes("/reports/point-of-sales/pos-bills-complementary")) resolvedTitle = "POS Bills Complementary";
      else if (path.includes("/reports/point-of-sales/pos-bills")) resolvedTitle = "POS Bills";
      else if (path.includes("/reports/point-of-sales/pos-bills-dept-charge")) resolvedTitle = "POS Bills Dept Charge";
      else if (path.includes("/reports/property/business-on-the-book")) resolvedTitle = "Business On The Book";
      else if (path.includes("/reports/property/occupancy-forecast")) resolvedTitle = "Occupancy Forecast";
      else if (path.includes("/reports/property/occupancy-report")) resolvedTitle = "Occupancy Report";
      else if (path.includes("/reports/property/reservation-or-sales")) resolvedTitle = "Reservation/Sales";
      else if (path.includes("/reports/property/revenue-forecast")) resolvedTitle = "Revenue Forecast";
      else if (path.includes("/reports/property/revenue-overview")) resolvedTitle = "Revenue Overview";
      else if (path.includes("/reports/property/revenue-report")) resolvedTitle = "Revenue Report";
      else if (path.includes("/reports/property/room-revenue-report")) resolvedTitle = "Room Revenue Report";
      else if (path.includes("/reports/reservations/arrivals")) resolvedTitle = "Arrivals";
      else if (path.includes("/reports/reservations/cancellations")) resolvedTitle = "Cancellations";
      else if (path.includes("/reports/reservations/check-in-check-out-detail")) resolvedTitle = "Check-in/Check-out Detail";
      else if (path.includes("/reports/reservations/departures")) resolvedTitle = "Departures";
      else if (path.includes("/reports/reservations/in-house-guest-list")) resolvedTitle = "In-house Guest List";
      else if (path.includes("/reports/reservations/information-sheet")) resolvedTitle = "Information Sheet";
      else if (path.includes("/reports/reservations/list-of-reservations")) resolvedTitle = "List Of Reservations";
      else if (path.includes("/reports/reservations/meal-forecast")) resolvedTitle = "Meal Forecast";
      else if (path.includes("/reports/sales/events-sales")) resolvedTitle = "Events Sales";
      else if (path.includes("/reports/sales/outlet-sales")) resolvedTitle = "Outlet Sales";
      else if (path.includes("/reports/sales/rooms-sales")) resolvedTitle = "Rooms Sales";
      else if (path.includes("/reports")) resolvedTitle = "Reports";
      else if (path.includes("/support")) resolvedTitle = "Support";
      // else if (path.includes("/logs")) resolvedTitle = "Logs";
      else if (path.includes("/night-audit")) resolvedTitle = "Night Audit";
      else if (path.includes("/chat")) resolvedTitle = "Messages";
      // else if (path.includes("/gallery")) resolvedTitle = "Gallery";
      else if (path.includes("/housekeeping/room-view"))
        resolvedTitle = "Room View";
      else if (path.includes("/housekeeping")) resolvedTitle = "Housekeeping";
      else if (path.includes("/housekeeping/hk-home"))
        resolvedTitle = "Housekeeping Home";
      else if (path.includes("/housekeeping/hk-board"))
        resolvedTitle = "Housekeeping Board";
      else if (path.includes("/housekeeping/hk-log"))
        resolvedTitle = "Housekeeping Log";
      else if (path.includes("/housekeeping/hk-staff"))
        resolvedTitle = "Housekeeping Staff";
      else if (path.includes("/housekeeping/laundry-jobs"))
        resolvedTitle = "Laundry Jobs";
      else if (path.includes("/events/event-list"))
        resolvedTitle = "Events List";
      else if (path.includes("/events/event-types"))
        resolvedTitle = "Event Types";
      else if (path.includes("/events/venues")) resolvedTitle = "Venues";
      else if (path.includes("/events/create-event"))
        resolvedTitle = "Create Event";
      else if (path.includes("/events/events-calender"))
        resolvedTitle = "Events Calendar";
      else if (path.includes("/events/leads-center"))
        resolvedTitle = "Leads Center";
      else if (path.includes("/events/table-booking"))
        resolvedTitle = "Table Booking";
      else if (path.includes("/events/table-booking-list"))
        resolvedTitle = "Table Booking List";
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
      else if (path.includes("/rates/inventory")) resolvedTitle = "Inventory";
      else if (path.includes("/rates/basis")) resolvedTitle = "Basis";
      else if (path.includes("/rates/category")) resolvedTitle = "Category";
      else if (path.includes("/rates/seasons")) resolvedTitle = "Seasons";
      else if (path.includes("/rates/markets")) resolvedTitle = "Markets";
      else if (path.includes("/admin/configuration/meal-allocation"))
        resolvedTitle = "Meal Allocation";
      else if (path.includes("/admin/configuration/nationality"))
        resolvedTitle = "Nationality";
      else if (path.includes("/admin/configuration/tax-table"))
        resolvedTitle = "Tax Table";
      else if (path.includes("/admin/configuration/reservation-source"))
        resolvedTitle = "Reservation Source";
      else if (path.includes("/admin/configuration/meal-plan"))
        resolvedTitle = "Meal Plan";
      else if (path.includes("/admin/point-of-sales/add-on-items"))
        resolvedTitle = "Add-on Items";
      else if (path.includes("/admin/point-of-sales/attach-bar-items"))
        resolvedTitle = "Attach Bar Items";
      else if (path.includes("/admin/point-of-sales/attach-pos-items"))
        resolvedTitle = "Attach POS Items";
      else if (path.includes("/admin/point-of-sales/base-category"))
        resolvedTitle = "Base Category";
      else if (path.includes("/admin/point-of-sales/compliment-types"))
        resolvedTitle = "Compliment Types";
      else if (path.includes("/admin/point-of-sales/import-pos-items"))
        resolvedTitle = "Import POS Items";
      else if (path.includes("/admin/point-of-sales/item-category"))
        resolvedTitle = "Item Category";
      else if (path.includes("/admin/point-of-sales/item-list"))
        resolvedTitle = "Item List";
      else if (path.includes("/admin/point-of-sales/new-item"))
        resolvedTitle = "New Item";
      else if (path.includes("/admin/point-of-sales/POS-center"))
        resolvedTitle = "POS Center";
      else if (path.includes("/admin/point-of-sales/service-items"))
        resolvedTitle = "Service Items";
      else if (path.includes("/admin/point-of-sales/SKU"))
        resolvedTitle = "SKU";
      else if (path.includes("/admin/point-of-sales/sub-item"))
        resolvedTitle = "Sub Item";
      else if (path.includes("/admin/property/audit-trail"))
        resolvedTitle = "Audit Trail";
      else if (path.includes("/admin/property/backup"))
        resolvedTitle = "Backup";
      else if (path.includes("/admin/property/idea-hub"))
        resolvedTitle = "Idea Hub";
      else if (path.includes("/admin/property/property-detail"))
        resolvedTitle = "Property Detail";
      else if (path.includes("/admin/property/property-preferences"))
        resolvedTitle = "Property Preferences";
      else if (path.includes("/admin/property/user-permissions"))
        resolvedTitle = "User Permissions";
      else if (path.includes("/admin/property/user-roles"))
        resolvedTitle = "User Roles";
      else if (path.includes("/admin/property/users")) resolvedTitle = "Users";
      else if (path.includes("/admin/rooms/croos-booking"))
        resolvedTitle = "Cross Booking";
      else if (path.includes("/admin/rooms/extra-charge-types"))
        resolvedTitle = "Extra Charge Types";
      else if (path.includes("/admin/rooms/extra-charge"))
        resolvedTitle = "Extra Charge";
      else if (path.includes("/admin/rooms/room-comp-category"))
        resolvedTitle = "Room Comp Category";
      else if (path.includes("/admin/rooms/rooms"))
        resolvedTitle = "Admin Rooms";
      else if (path.includes("/admin/rooms/roomType"))
        resolvedTitle = "Admin Room Type";
      else if (path.includes("/admin/transactions/approvals"))
        resolvedTitle = "Approvals";
      else if (path.includes("/admin/transactions/change-res-status"))
        resolvedTitle = "Change Res Status";
      else if (path.includes("/admin/transactions/import-bb-eZee"))
        resolvedTitle = "Import BB eZee";
      else if (path.includes("/admin/transactions/import-res-eZee"))
        resolvedTitle = "Import Res eZee";
      else if (path.includes("/admin/transactions/res-import-IDS"))
        resolvedTitle = "Res Import IDS";
      else if (path.includes("/admin/transactions/room-bill-adv-proc"))
        resolvedTitle = "Room Bill Adv Proc";
      else if (path.includes("/admin/transactions/super-admin"))
        resolvedTitle = "Super Admin";
      else if (path.includes("/admin/transactions/system-update"))
        resolvedTitle = "System Update";
      else if (path.includes("/admin/transactions/tran-master"))
        resolvedTitle = "Tran Master";
      else if (path.includes("/admin/transactions/unlock-rate-table"))
        resolvedTitle = "Unlock Rate Table";
      else if (path.includes("/admin/transactions/update-meal-alloc"))
        resolvedTitle = "Update Meal Alloc";
      else if (path.includes("/admin/travel-agents/agent-list"))
        resolvedTitle = "Agent List";
      else if (path.includes("/admin/travel-agents/create-agent"))
        resolvedTitle = "Create Agent";
      else if (path.includes("/point-of-sale/pos-bill-list"))
        resolvedTitle = "POS Bill List";
      else if (path.includes("/point-of-sale/pos-order-list"))
        resolvedTitle = "POS Order List";
      else if (path.includes("/point-of-sale/pos")) resolvedTitle = "Point of Sale";
      else if (path.includes("/settings/travel-agents"))
        resolvedTitle = "Travel Agents";
      else if (path.includes("/IBE/IBE-home")) resolvedTitle = "IBE Home";
      else if (path.includes("/IBE/IBE-min-stay")) resolvedTitle = "IBE Min Stay";
      else if (path.includes("/IBE/IBE-packages")) resolvedTitle = "IBE Packages";
      else if (path.includes("/IBE/IBE-preference"))
        resolvedTitle = "IBE Preference";
      else if (path.includes("/IBE/IBE-promo")) resolvedTitle = "IBE Promo";
      else if (path.includes("/IBE/rates")) resolvedTitle = "IBE Rates";
      else if (path.includes("/channel-manager/get-booking-by-id"))
        resolvedTitle = "Get Booking By ID";
      else if (path.includes("/channel-manager/bookings"))
        resolvedTitle = "Bookings";
      else if (path.includes("/channel-manager/full-refresh"))
        resolvedTitle = "Full Refresh";
      else if (path.includes("/channel-manager/pending-ibe-booking"))
        resolvedTitle = "Process Pending IBE Booking";
      else if (path.includes("/channel-manager/rates-management"))
        resolvedTitle = "Rates Management";
      else if (path.includes("/channel-manager/receive-log"))
        resolvedTitle = "Receive Log";
      else if (path.includes("/channel-manager/reversations"))
        resolvedTitle = "Reversations";
      else if (path.includes("/channel-manager/room-mapping"))
        resolvedTitle = "Room Mapping";

      else if (path.includes("/BI/occupancy")) resolvedTitle = "Occupancy";
      else if (path.includes("/BI/revenue")) resolvedTitle = "Revenue";
      else if (path.includes("/BI/snapshot")) resolvedTitle = "Snapshot";
      else if (path.includes("/BI/travellers")) resolvedTitle = "Travellers";

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
                      const hotelCode =
                        codeFromStorage && codeFromStorage.trim() !== ""
                          ? codeFromStorage
                          : "1097";
                      const selected = {
                        id: hotel.id,
                        name: hotel.name,
                        guid: hotel.guid,
                        hotelCode,
                      };
                      localStorage.setItem("hotelCode", hotelCode);
                      localStorage.setItem(
                        "selectedProperty",
                        JSON.stringify(selected)
                      );
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
            group.items?.some((item) => {
              if (item.href && pathname.startsWith(item.href)) {
                return true;
              }
              // Check nested items
              if (item.items) {
                return item.items.some(
                  (subItem) => subItem.href && pathname.startsWith(subItem.href)
                );
              }
              return false;
            }));
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
                            // Handle nested menu items (like Configuration submenu)
                            if (item.items && item.items.length > 0) {
                              const subMenuKey = `${group.label}-${item.name}`;
                              const isSubExpanded =
                                expandedGroups[subMenuKey] ?? false;
                              const isSubMenuActive = item.items.some(
                                (subItem) =>
                                  subItem.href &&
                                  pathname.startsWith(subItem.href)
                              );

                              return (
                                <SidebarMenuSubItem key={item.name}>
                                  <SidebarMenuSubButton
                                    className={`flex items-center justify-between w-full ${
                                      isSubMenuActive ? activeButtonClasses : ""
                                    }`}
                                    onClick={() => toggleGroup(subMenuKey)}
                                  >
                                    <div className="flex items-center">
                                      {item.icon && (
                                        <item.icon className="h-4 w-4 mr-2" />
                                      )}
                                      <TranslatedText text={item.name} />
                                    </div>
                                    <ChevronDown
                                      className={`h-3 w-3 transition-transform duration-200 ${
                                        isSubExpanded ? "rotate-180" : ""
                                      }`}
                                    />
                                  </SidebarMenuSubButton>
                                  {isSubExpanded && (
                                    <div className="ml-6 mt-1 space-y-1">
                                      {item.items.map((subItem) => {
                                        const isSubActive =
                                          pathname === subItem.href;
                                        return (
                                          <SidebarMenuSubButton
                                            key={subItem.name}
                                            asChild
                                          >
                                            <Link
                                              href={subItem.href || "#"}
                                              className={`flex items-center text-sm py-1 ${
                                                isSubActive
                                                  ? `${activeButtonClasses} font-medium`
                                                  : ""
                                              }`}
                                            >
                                              {subItem.icon && (
                                                <subItem.icon className="h-3 w-3 mr-2" />
                                              )}
                                              <TranslatedText
                                                text={subItem.name}
                                              />
                                            </Link>
                                          </SidebarMenuSubButton>
                                        );
                                      })}
                                    </div>
                                  )}
                                </SidebarMenuSubItem>
                              );
                            }

                            // Regular menu items
                            const isActive = pathname === item.href;
                            return (
                              <SidebarMenuSubItem key={item.name}>
                                <SidebarMenuSubButton asChild>
                                  <Link
                                    href={item.href || "#"}
                                    className={`flex items-center ${
                                      isActive
                                        ? `${activeButtonClasses} font-medium`
                                        : ""
                                    }`}
                                  >
                                    {item.icon && (
                                      <item.icon className="h-4 w-4 mr-2" />
                                    )}
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

"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Palette, Sun, Moon, Monitor, RotateCcw, Tag } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";

interface ReservationStatus {
  id: number;
  name: string;
  color: string;
  description: string;
}

export default function ThemePage() {
  const [theme, setTheme] = useState("light");
  const [autoTheme, setAutoTheme] = useState(false);
  const [accentColor, setAccentColor] = useState("blue");
  const [reservationStatuses, setReservationStatuses] = useState<
    ReservationStatus[]
  >([
    {
      id: 1,
      name: "Confirmed Reservation",
      color: "#10b981",
      description: "Confirmed bookings",
    },
    {
      id: 2,
      name: "Tentative",
      color: "#f59e0b",
      description: "Tentative reservations",
    },
    {
      id: 3,
      name: "Checked-out",
      color: "#ef4444",
      description: "Guests who have checked out",
    },
    {
      id: 4,
      name: "Checked-in",
      color: "#06b6d4",
      description: "Guests currently checked in",
    },
    {
      id: 5,
      name: "Cancelled",
      color: "#6b7280",
      description: "Cancelled reservations",
    },
    {
      id: 6,
      name: "No Show",
      color: "#78716c",
      description: "Guests who didn't show up",
    },
    {
      id: 7,
      name: "No-Show (Surcharge)",
      color: "#57534e",
      description: "No-show with surcharge applied",
    },
    { id: 8, name: "Block", color: "#a855f7", description: "Blocked rooms" },
    {
      id: 9,
      name: "OUT OF ORDER",
      color: "#1f2937",
      description: "Rooms out of order",
    },
    {
      id: 10,
      name: "InvalidCC",
      color: "#be185d",
      description: "Invalid credit card",
    },
  ]);
  const [hasReservationChanges, setHasReservationChanges] = useState(false);

  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    const savedAutoTheme = localStorage.getItem("autoTheme") === "true";
    const savedAccentColor = localStorage.getItem("accentColor") || "blue";

    setTheme(savedTheme);
    setAutoTheme(savedAutoTheme);
    setAccentColor(savedAccentColor);

    if (savedAutoTheme) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      if (savedTheme !== systemTheme) {
        applyTheme(systemTheme);
      }
    }

    const savedColors = localStorage.getItem("reservationStatusColors");
    if (savedColors) {
      try {
        const parsedColors = JSON.parse(savedColors);
        setReservationStatuses((prev) =>
          prev.map((status) => ({
            ...status,
            color: parsedColors[status.id] || status.color,
          }))
        );
      } catch (error) {
        console.error("Error loading saved colors:", error);
      }
    }
  }, []);

  // Apply theme changes
  const applyTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    // Apply theme to document
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleAutoThemeChange = (enabled: boolean) => {
    setAutoTheme(enabled);
    localStorage.setItem("autoTheme", enabled.toString());

    if (enabled) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      if (theme !== systemTheme) {
        applyTheme(systemTheme);
      }
    }
  };

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color);
    localStorage.setItem("accentColor", color);

    // Apply accent color to document
    document.documentElement.style.setProperty("--accent-color", color);
  };

  const handleReservationColorChange = (statusId: number, newColor: string) => {
    setReservationStatuses((prev) =>
      prev.map((status) =>
        status.id === statusId ? { ...status, color: newColor } : status
      )
    );
    setHasReservationChanges(true);
  };

  const saveReservationColors = () => {
    const colorMap = reservationStatuses.reduce((acc, status) => {
      acc[status.id] = status.color;
      return acc;
    }, {} as Record<number, string>);

    localStorage.setItem("reservationStatusColors", JSON.stringify(colorMap));
    setHasReservationChanges(false);

    alert("Reservation colors saved successfully!");
  };

  const resetReservationColors = () => {
    const defaultStatuses = [
      {
        id: 1,
        name: "Confirmed Reservation",
        color: "#10b981",
        description: "Confirmed bookings",
      },
      {
        id: 2,
        name: "Tentative",
        color: "#f59e0b",
        description: "Tentative reservations",
      },
      {
        id: 3,
        name: "Checked-out",
        color: "#ef4444",
        description: "Guests who have checked out",
      },
      {
        id: 4,
        name: "Checked-in",
        color: "#06b6d4",
        description: "Guests currently checked in",
      },
      {
        id: 5,
        name: "Cancelled",
        color: "#6b7280",
        description: "Cancelled reservations",
      },
      {
        id: 6,
        name: "No Show",
        color: "#78716c",
        description: "Guests who didn't show up",
      },
      {
        id: 7,
        name: "No-Show (Surcharge)",
        color: "#57534e",
        description: "No-show with surcharge applied",
      },
      { id: 8, name: "Block", color: "#a855f7", description: "Blocked rooms" },
      {
        id: 9,
        name: "OUT OF ORDER",
        color: "#1f2937",
        description: "Rooms out of order",
      },
      {
        id: 10,
        name: "InvalidCC",
        color: "#be185d",
        description: "Invalid credit card",
      },
    ];

    setReservationStatuses(defaultStatuses);
    localStorage.removeItem("reservationStatusColors");
    setHasReservationChanges(false);
  };

  const accentColors = [
    { name: "Blue", value: "blue", color: "bg-blue-500" },
    { name: "Green", value: "green", color: "bg-green-500" },
    { name: "Purple", value: "purple", color: "bg-purple-500" },
    { name: "Red", value: "red", color: "bg-red-500" },
    { name: "Orange", value: "orange", color: "bg-orange-500" },
    { name: "Pink", value: "pink", color: "bg-pink-500" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Palette className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Theme Settings</h1>
        </div>

        {/* Theme Mode */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Mode</CardTitle>
            <CardDescription>
              Choose your preferred theme mode for the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-theme"
                checked={autoTheme}
                onCheckedChange={handleAutoThemeChange}
              />
              <Label htmlFor="auto-theme">Auto-detect system theme</Label>
            </div>

            {!autoTheme && (
              <RadioGroup value={theme} onValueChange={applyTheme}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light Mode
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark Mode
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    System Default
                  </Label>
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        {/* Accent Color */}
        <Card>
          <CardHeader>
            <CardTitle>Accent Color</CardTitle>
            <CardDescription>
              Choose your preferred accent color for buttons and highlights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 ">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleAccentColorChange(color.value)}
                  className={`flex items-center  gap-3 p-3 rounded-lg border-2 transition-colors ${
                    accentColor === color.value
                      ? "border-gray-900 bg-gray-50  "
                      : "border-gray-200 hover:border-gray-300 "
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${color.color}`} />
                  <span className="font-medium ">{color.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>See how your theme settings look</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Sample Content</h3>
                <Button size="sm">Sample Button</Button>
              </div>
              <p className="text-gray-600">
                This is how your content will appear with the selected theme
                settings.
              </p>
              <div className="flex gap-2">
                <Button variant="default" size="sm">
                  Primary
                </Button>
                <Button variant="outline" size="sm">
                  Secondary
                </Button>
                <Button variant="ghost" size="sm">
                  Ghost
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reservation Status Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Reservation Status Colors
            </CardTitle>
            <CardDescription>
              Customize colors for different reservation statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reservationStatuses.map((status) => (
                <div
                  key={status.id}
                  className="flex items-center gap-4 p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <div
                        className="w-5 h-5 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: status.color }}
                      />
                      <h4 className="font-medium text-sm">{status.name}</h4>
                    </div>
                    <p className="text-xs text-gray-600">
                      {status.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={status.color}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleReservationColorChange(status.id, e.target.value)
                      }
                      className="w-12 h-8 p-1 border rounded cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={status.color}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleReservationColorChange(status.id, e.target.value)
                      }
                      className="w-20 text-xs font-mono"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}

              {/* Preview */}
              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="text-sm font-medium mb-3">Preview</h4>
                <div className="flex flex-wrap gap-2">
                  {reservationStatuses.map((status) => (
                    <div
                      key={status.id}
                      className="flex items-center gap-1 px-2 py-1 rounded text-white text-xs font-medium"
                      style={{ backgroundColor: status.color }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                      {status.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={saveReservationColors}
                  disabled={!hasReservationChanges}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Palette className="h-4 w-4" />
                  Save Colors
                </Button>
                <Button
                  variant="outline"
                  onClick={resetReservationColors}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
              {hasReservationChanges && (
                <p className="text-sm text-orange-600 mt-2">
                  You have unsaved changes. Click "Save Colors" to apply them.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reset */}
        <Card>
          <CardHeader>
            <CardTitle>Reset Theme</CardTitle>
            <CardDescription>
              Reset all theme settings to default values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => {
                applyTheme("light");
                setAutoTheme(false);
                handleAccentColorChange("blue");
                localStorage.removeItem("theme");
                localStorage.removeItem("autoTheme");
                localStorage.removeItem("accentColor");
              }}
            >
              Reset to Default
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

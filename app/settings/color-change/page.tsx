"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const RES_STATUS_COLORS_KEY = "reservationStatusColors";

const defaultStatuses = [
  "Confirmed",
  "Checked In",
  "Checked Out",
  "Cancelled",
  "No Show",
  "Pending",
];

export default function ColorSettingsPage() {
  const [colors, setColors] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem(RES_STATUS_COLORS_KEY);
    if (saved) {
      setColors(JSON.parse(saved));
    } else {
      const defaults: Record<string, string> = {};
      defaultStatuses.forEach((s) => {
        defaults[s] = "#cccccc";
      });
      setColors(defaults);
    }
  }, []);

  const handleColorChange = (status: string, color: string) => {
    const updated = { ...colors, [status]: color };
    setColors(updated);
    localStorage.setItem(RES_STATUS_COLORS_KEY, JSON.stringify(updated));
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">
          Customize Reservation Status Colors
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          {defaultStatuses.map((status) => (
            <Card key={status} className="transition hover:shadow-md">
              <CardContent className="flex items-center gap-6 py-6 px-4">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: colors[status] || "#cccccc" }}
                />
                <div className="flex-1">
                  <p className="font-medium text-white">{status}</p>
                  <p className="text-sm text-muted-foreground">
                    Current: <span className="font-mono">{colors[status]}</span>
                  </p>
                </div>
                <label
                  className="relative cursor-pointer group"
                  title="Click to change color"
                >
                  <input
                    type="color"
                    value={colors[status] || "#cccccc"}
                    onChange={(e) => handleColorChange(status, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div
                    className="w-10 h-10 rounded-full border-2 transition-all duration-200 shadow-inner group-hover:scale-110"
                    style={{
                      backgroundColor: colors[status] || "#cccccc",
                      borderColor: "#ccc",
                    }}
                  />
                </label>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <Button
            variant="default"
            onClick={() => {
              localStorage.setItem(
                RES_STATUS_COLORS_KEY,
                JSON.stringify(colors)
              );
              alert("Colors saved to local storage!");
            }}
          >
            Save Colors
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

"use client";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardContent } from "@/components/dashboard-content"

export default function DashboardPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.hash = "#googtrans(en|en)";
    }
  }, []);

  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  )
}

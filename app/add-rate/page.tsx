"use client";
import { AddRateMultiStep } from "@/components/add-rate-multi-step";

export default function AddRatePage() {
  return (
    <div className="min-h-screen">
      <AddRateMultiStep
        onComplete={(data) => {
          console.log("Rate plan created:", data);
        }}
      />
    </div>
  );
}

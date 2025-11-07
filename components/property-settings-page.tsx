"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PropertyDetailTab from "./tabs/property-detail-tab";

export default function PropertySettingsPage() {
  const router = useRouter();
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <>
      <Script
        id="google-maps"
        src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyAY_eNoCO6CCES64t6ege7HdllxqyC0Bgc&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setMapLoaded(true)}
      />

      <PropertyDetailTab mapLoaded={mapLoaded} />

      <style jsx>{`
        .tab-trigger {
          @apply data-[state=active]:bg-white
          data-[state=active]:text-black
          data-[state=active]:font-semibold
          rounded-md px-4 py-2 text-sm whitespace-nowrap;
        }
      `}</style>
    </>
  );
}

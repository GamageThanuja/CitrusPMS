// components/mapPickerProperty.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

type Parts = { country?: string; city?: string; propertyName?: string };

export default function MapPicker({
  lat,
  lng,
  onChange,
  apiKey,
  geocodeAddress, // still supported
  geocodeParts, // NEW: { propertyName, city, country }
  showSearchBar = true, // NEW: toggle search UI
}: {
  lat?: string;
  lng?: string;
  onChange: (next: { latitude: string; longitude: string }) => void;
  apiKey: string;
  geocodeAddress?: string;
  geocodeParts?: Parts;
  showSearchBar?: boolean;
}) {
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const markerRef = React.useRef<any>(null);
  const mapInstanceRef = React.useRef<any>(null);

  // Build a combined query from parts (Property Name → City → Country)
  const partsQuery = useMemo(() => {
    if (!geocodeParts) return "";
    const { propertyName, city, country } = geocodeParts;
    return [propertyName, city, country].filter(Boolean).join(", ");
  }, [geocodeParts]);

  // Local query state for the search bar (seeded from parts or geocodeAddress)
  const [query, setQuery] = useState<string>(
    geocodeAddress || partsQuery || ""
  );

  useEffect(() => {
    // keep query in sync if the form changes country/city/name upstream
    const next = geocodeAddress || partsQuery || "";
    if (next && next !== query) setQuery(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geocodeAddress, partsQuery]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initMap = () => {
      if (!mapRef.current || (window as any).google?.maps == null) return;

      const startLat = parseFloat(lat ?? "");
      const startLng = parseFloat(lng ?? "");
      const hasCoords = Number.isFinite(startLat) && Number.isFinite(startLng);

      const center = hasCoords
        ? { lat: startLat, lng: startLng }
        : { lat: 6.9271, lng: 79.8612 }; // Colombo default

      const map = new (window as any).google.maps.Map(mapRef.current, {
        center,
        zoom: hasCoords ? 14 : 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;

      const marker = new (window as any).google.maps.Marker({
        position: center,
        map,
        draggable: true,
        title: "Drag to set location",
      });
      markerRef.current = marker;

      (window as any).google.maps.event.addListener(marker, "dragend", () => {
        const pos = marker.getPosition();
        if (!pos) return;
        onChange({ latitude: String(pos.lat()), longitude: String(pos.lng()) });
      });

      (window as any).google.maps.event.addListener(map, "click", (e: any) => {
        const pos = e.latLng;
        marker.setPosition(pos);
        onChange({ latitude: String(pos.lat()), longitude: String(pos.lng()) });
      });

      // One-time auto-geocode if we don't have coords yet
      const initialAddress = (geocodeAddress || partsQuery || "").trim();
      if (!hasCoords && initialAddress) {
        geocode(initialAddress);
      }
    };

    const ensureScript = () => {
      if ((window as any).google?.maps) {
        initMap();
        return;
      }
      const id = "gmaps-sdk";
      const existing = document.getElementById(id) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", initMap);
        return;
      }
      const s = document.createElement("script");
      s.id = id;
      s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      s.async = true;
      s.defer = true;
      s.onload = initMap;
      document.head.appendChild(s);
    };

    ensureScript();
    // include partsQuery so it can retrigger if user changes city/country/name before map load
  }, [lat, lng, apiKey, onChange, geocodeAddress, partsQuery]);

  const centerTo = (ll: { lat: number; lng: number }, zoom = 12) => {
    if (!markerRef.current) return;
    markerRef.current.setPosition(ll);
    const map = markerRef.current.getMap();
    map?.setCenter(ll);
    map?.setZoom(zoom);
    onChange({ latitude: String(ll.lat), longitude: String(ll.lng) });
  };

  const geocode = (address: string) => {
    const g = (window as any)?.google;
    if (!g?.maps?.Geocoder) return;
    const geocoder = new g.maps.Geocoder();
    geocoder.geocode({ address }, (results: any, status: any) => {
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const p = results[0].geometry.location;
        centerTo({ lat: p.lat(), lng: p.lng() });
      }
    });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        centerTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 15),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-3">
      {showSearchBar && (
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: Property, City, Country (e.g., Ocean View, Galle, Sri Lanka)"
            className="h-10"
          />
          <Button
            type="button"
            className="h-10"
            onClick={() => query.trim() && geocode(query.trim())}
          >
            Find
          </Button>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden border border-slate-200">
        <div ref={mapRef} className="h-72 w-full bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          value={lat ?? ""}
          onChange={(e) =>
            onChange({ latitude: e.target.value, longitude: lng ?? "" })
          }
          placeholder="Latitude"
          className="h-12"
        />
        <Input
          value={lng ?? ""}
          onChange={(e) =>
            onChange({ latitude: lat ?? "", longitude: e.target.value })
          }
          placeholder="Longitude"
          className="h-12"
        />
        <Button
          type="button"
          onClick={useMyLocation}
          className="h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
        >
          Use my location
        </Button>
      </div>

      <p className="text-xs text-slate-500">
        Drag the pin or click on the map to set your exact property location.
      </p>
    </div>
  );
}

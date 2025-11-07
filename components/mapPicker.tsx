import { useEffect, useRef } from "react";

export function MapPicker({
  lat,
  lng,
  onChange,
  height = 240, // compact editor map
  zoom = 15,
  className = "",
  disabled = false,
}: {
  lat?: number | string;
  lng?: number | string;
  onChange: (next: { lat: number; lng: number }) => void;
  height?: number;
  zoom?: number;
  className?: string;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !window.google?.maps) return;

    const toNum = (v: any, fallback: number) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    const center = {
      lat: toNum(lat, 6.9271), // fallback: Colombo
      lng: toNum(lng, 79.8612),
    };

    const map = new window.google.maps.Map(containerRef.current, {
      center,
      zoom,
      gestureHandling: "greedy",
      disableDefaultUI: false,
    });
    mapRef.current = map;

    const marker = new window.google.maps.Marker({
      position: center,
      map,
      draggable: !disabled,
    });
    markerRef.current = marker;

    const dragEnd = window.google.maps.event.addListener(
      marker,
      "dragend",
      () => {
        const pos = marker.getPosition();
        if (!pos) return;
        onChange({ lat: pos.lat(), lng: pos.lng() });
      }
    );

    return () => {
      window.google.maps.event.removeListener(dragEnd);
      marker.setMap(null);
    };
  }, [lat, lng, zoom, disabled, onChange]);

  // keep marker in sync if lat/lng props change from inputs
  useEffect(() => {
    const toNum = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const latN = toNum(lat);
    const lngN = toNum(lng);
    if (latN == null || lngN == null) return;

    if (markerRef.current) {
      const pos = new window.google.maps.LatLng(latN, lngN);
      markerRef.current.setPosition(pos);
    }
    if (mapRef.current) {
      mapRef.current.setCenter({ lat: latN, lng: lngN });
    }
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-md border ${className}`}
      style={{ height }}
    />
  );
}

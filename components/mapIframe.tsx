// components/mapIframe.tsx
export function MapIframe({
  lat,
  lng,
  zoom = 15,
  height = 400, // <- default smaller
  className = "",
}: {
  lat?: number | string;
  lng?: number | string;
  zoom?: number;
  height?: number;
  className?: string;
}) {
  const toNum = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const latN = toNum(lat);
  const lngN = toNum(lng);

  if (latN === null || lngN === null) {
    return (
      <p className="text-xs text-muted-foreground">
        Enter valid latitude & longitude to preview the map.
      </p>
    );
  }

  const src = `https://www.google.com/maps?q=${latN},${lngN}&z=${zoom}&output=embed`;

  return (
    <div
      className={`w-full rounded-md border overflow-hidden ${className}`}
      style={{ height }}
    >
      <iframe
        key={`${latN},${lngN}`}
        src={src}
        className="h-full w-full"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Property location"
      />
    </div>
  );
}

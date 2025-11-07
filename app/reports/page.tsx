"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { EyeIcon, Maximize2, Minimize2, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getAllReports } from "@/controllers/reportsController";
import { useHotelMateTelemetry } from "@/hooks/useHotelMateTelemetry";

interface Report {
  reportID: number;
  finAct: boolean;
  reportCategory: string;
  reportName: string;
  engine: string | null;
  reportURL: string | null;
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const { data, loading, error } = useHotelMateTelemetry();

  console.log(
    "Client Telemetry Data:",
    JSON.stringify(data, null, 2) // 2-space indent
  );

  // Group reports by category whenever data changes
  const groupedReports = useMemo(() => {
    return reports.reduce<Record<string, Report[]>>((acc, rpt) => {
      (acc[rpt.reportCategory] ||= []).push(rpt);
      return acc;
    }, {});
  }, [reports]);

  function getSelectedHotelCode(): number | undefined {
    try {
      const raw = localStorage.getItem("selectedProperty");
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      const code = parsed?.hotelCode;
      return typeof code === "number" ? code : undefined;
    } catch {
      return undefined;
    }
  }

  // useEffect(() => {
  //   try {
  //     const tokensRaw = localStorage.getItem("hotelmateTokens")
  //     if (!tokensRaw) return
  //     const { accessToken } = JSON.parse(tokensRaw)
  //     if (!accessToken) return

  //       headers: {
  //         Authorization: `Bearer ${accessToken}`,
  //       },
  //     })
  //       .then((res) => res.json())
  //       .then((data: Report[]) => {
  //         // Add ?hotelcode={code} to CR-engine report URLs
  //         let hotelCode: number | undefined
  //         try {
  //           const selectedRaw = localStorage.getItem("selectedProperty")
  //           if (selectedRaw) {
  //             const { hotelCode: code } = JSON.parse(selectedRaw)
  //             hotelCode = code
  //           }
  //         } catch (err) {
  //           console.error("Unable to read selected property", err)
  //         }

  //         const transformed = data.map((r) => {
  //           if (r.engine === "CR" && r.reportURL && hotelCode) {
  //             const joiner = r.reportURL.includes("?") ? "&" : "?"
  //             return {
  //               ...r,
  //               reportURL: `${r.reportURL}${joiner}hotelcode=${hotelCode}`,
  //             }
  //           }
  //           return r
  //         })
  //         setReports(transformed)
  //       })
  //       .catch((err) => console.error("Failed to fetch reports", err))
  //   } catch (err) {
  //     console.error("Unable to read access token", err)
  //   }
  // }, [])

  function addHotelCodeParam(url: string | null, hotelCode?: number) {
    if (!url) return "";
    if (!hotelCode && hotelCode !== 0) return url;

    // preserve any #hash
    const [base, hash = ""] = url.split("#");
    const h = hash ? `#${hash}` : "";

    // If it already has hotelCode/HotelCode/etc., replace it in-place (case-insensitive)
    const replaceRe = /([?&])(hotelcode)=([^&#]*)/i;
    if (replaceRe.test(base)) {
      return base.replace(replaceRe, `$1HotelCode=${hotelCode}`) + h;
    }

    // Try the URL API; fallback to manual join for relative-only strings
    try {
      const u = new URL(base, window.location.origin);
      u.searchParams.set("HotelCode", String(hotelCode));
      return u.toString().replace(/#.*$/, "") + h;
    } catch {
      const joiner = base.includes("?") ? "&" : "?";
      return `${base}${joiner}HotelCode=${hotelCode}${h}`;
    }
  }

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Get token from localStorage
        const tokensRaw = localStorage.getItem("hotelmateTokens");
        if (!tokensRaw) return;

        const { accessToken } = JSON.parse(tokensRaw);
        if (!accessToken) return;

        // Get hotelCode from selected property
        let hotelCode: number | undefined;
        const selectedRaw = localStorage.getItem("selectedProperty");
        if (selectedRaw) {
          try {
            const { hotelCode: code } = JSON.parse(selectedRaw);
            hotelCode = code;
          } catch (err) {
            console.error("Unable to parse selected property", err);
          }
        }

        // Fetch reports via your API helper
        const data = await getAllReports({ token: accessToken });

        setReports(data);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      }
    };

    fetchReports();
  }, []);

  const handleCloseReport = () => {
    setActiveReport(null);
    setIsExpanded(false);
  };

  return (
    <DashboardLayout>
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            View and Download your Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(groupedReports).map(([category, categoryReports]) => (
            <Card key={category} className="border rounded-md shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categoryReports.map((rpt) => (
                  <div
                    key={rpt.reportID}
                    className={`flex items-center justify-between ${
                      rpt.reportURL
                        ? "cursor-pointer hover:text-primary"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (!rpt.reportURL) return;
                      const code = getSelectedHotelCode();
                      const finalUrl = addHotelCodeParam(rpt.reportURL, code);
                      setActiveReport({ ...rpt, reportURL: finalUrl });
                    }}
                  >
                    <span>{rpt.reportName}</span>
                    {rpt.reportURL && <EyeIcon className="h-4 w-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Sheet open={!!activeReport} onOpenChange={handleCloseReport}>
            <SheetContent
              side="right"
              className={
                isExpanded
                  ? "w-screen h-screen max-w-none p-0 m-0 overflow-hidden"
                  : "w-full lg:max-w-4xl xl:max-w-6xl overflow-y-auto"
              }
              style={
                isExpanded
                  ? {
                      width: "100vw",
                      height: "100vh",
                      maxWidth: "none",
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      transform: "none",
                    }
                  : undefined
              }
            >
              {/* Control buttons */}
              <div className="absolute top-2 right-2 flex items-center gap-2 z-50">
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="p-2 rounded-md hover:bg-muted transition-colors"
                  title={isExpanded ? "Minimize" : "Maximize"}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseReport}
                  className="p-2 rounded-md hover:bg-muted transition-colors"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Report content */}
              <div className={isExpanded ? "h-full w-full" : "py-4 h-full"}>
                {!isExpanded}

                <div className={isExpanded ? "h-full w-full" : "h-full"}>
                  <iframe
                    key={activeReport?.reportURL ?? "empty"}
                    id="report-frame"
                    src={activeReport?.reportURL ?? ""}
                    width="100%"
                    height="100%"
                    className="w-full h-full border-0"
                    frameBorder={0}
                    allowFullScreen
                    style={{
                      border: "0",
                      background: "transparent",
                      minHeight: isExpanded ? "100vh" : "80vh",
                    }}
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

"use client";

import { useEffect, useState } from "react";
import { FileDown, Filter as FilterIcon } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getHotelByGuid } from "@/controllers/getHotelByGuidController";
import {
  createReservationActivityLog,
  getReservationActivityLog,
} from "@/controllers/reservationActivityLogController";
import { createNightAudit } from "@/controllers/nightAuditController";

type Log = {
  logId: number;
  createdOn: string;
  username: string;
  resLog: string;
  platform: string;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [username, setUsername] = useState("");
  const [activity, setActivity] = useState("");
  const [platform, setPlatform] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditProcessing, setAuditProcessing] = useState(false);
  const [systemDate, setSystemDate] = useState<string | null>(null);
  const [hotelDate, setHotelDate] = useState<string | null>(null);
  const todayStr = new Date().toISOString().split("T")[0];
  const systemDateObj = systemDate ? new Date(systemDate + "T00:00:00") : null;
  const todayDateObj = new Date(todayStr + "T00:00:00");
  const isFutureDate = systemDateObj ? systemDateObj > todayDateObj : false;
  const canAudit = !isFutureDate;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const storedSystemDate = localStorage.getItem("systemDate");
    if (storedSystemDate) {
      setSystemDate(storedSystemDate);
    } else {
      // Fallback: try to get it from selectedProperty if present
      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      if (selectedProperty && selectedProperty.systemDate) {
        setSystemDate(selectedProperty.systemDate);
      }
      const { id, guid } = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const { accessToken } = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const fullName = localStorage.getItem("fullName") || "";
    }
  }, []);

  // Fetch the current hotel system date from the API
  useEffect(() => {
    const fetchSystemDateFromAPI = async () => {
      try {
        // Get token & GUID
        const accessToken = JSON.parse(
          localStorage.getItem("hotelmateTokens") || "{}"
        )?.accessToken;
        const selectedProperty = JSON.parse(
          localStorage.getItem("selectedProperty") || "{}"
        );
        const guid = selectedProperty?.guid;

        if (!guid) {
          throw new Error("Hotel GUID not found in selectedProperty.");
        }

        // Call helper
        const hotelData = await getHotelByGuid({
          token: accessToken,
          hotelGuid: guid,
        });

        if (!hotelData?.hotelDate) {
          alert("Hotel date not found.");
          return;
        }

        setHotelDate(hotelData.hotelDate);
        setSystemDate(hotelData.hotelDate);

        // If you want to store other hotel info:
        // setHotelName(hotelData.hotelName);
        // setHotelId(hotelData.hotelID);
      } catch (error) {
        console.error("Error retrieving system date from API:", error);
      }
    };

    fetchSystemDateFromAPI();
  }, []);

  // Move fetchLogs to top-level and call it in useEffect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!systemDate) return;
    fetchLogs();
  }, [systemDate, currentPage, username, activity, platform, filterDate]);

  // fetchLogs function moved to top-level inside LogsPage
  // const fetchLogs = async () => {
  //   try {
  //     console.log("Fetching logs with params:", {
  //       username,
  //       activity,
  //       platform,
  //       filterDate,
  //     });
  //     const selectedProperty = JSON.parse(
  //       localStorage.getItem("selectedProperty") || "{}"
  //     );
  //     const hotelIdLocal =
  //       selectedProperty && selectedProperty.id ? selectedProperty.id : null;
  //     if (!hotelIdLocal) return;

  //     const fullName = localStorage.getItem("fullName") || "";
  //     const accessToken = JSON.parse(
  //       localStorage.getItem("hotelmateTokens") || "{}"
  //     ).accessToken;

  //     const url = new URL(

  //     );
  //     url.searchParams.append("hotelId", hotelIdLocal);
  //     url.searchParams.append("page", currentPage.toString());
  //     url.searchParams.append("pageSize", "10");
  //     if (username) url.searchParams.append("username", username);
  //     if (activity) url.searchParams.append("resLog", activity);
  //     if (platform) url.searchParams.append("platform", platform);
  //     if (filterDate) {
  //       // Format to full ISO format YYYY-MM-DDT00:00:00Z and YYYY-MM-DDT23:59:59Z
  //       const startDateISO = new Date(filterDate + "T00:00:00Z").toISOString();
  //       const endDateISO = new Date(filterDate + "T23:59:59Z").toISOString();
  //       url.searchParams.append("startDate", startDateISO);
  //       url.searchParams.append("endDate", endDateISO);
  //     }

  //     const res = await fetch(url.toString(), {
  //       headers: {
  //         Authorization: `Bearer ${accessToken}`,
  //         Accept: "application/json",
  //       },
  //     });

  //     if (!res.ok) throw new Error("Failed to fetch logs");
  //     const data = await res.json();
  //     console.log("Fetched activity log data:", data);
  //     setLogs(Array.isArray(data.logs) ? data.logs : []);
  //     setTotalPages(Math.ceil(data.totalCount / 10) || 1);
  //   } catch (error) {
  //     console.error("Error fetching logs:", error);
  //   }
  // };

  const fetchLogs = async () => {
    try {
      console.log("Fetching logs with params:", {
        username,
        activity,
        platform,
        filterDate,
      });

      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const hotelIdLocal = selectedProperty?.id ?? null;
      if (!hotelIdLocal) return;

      const accessToken = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      ).accessToken;

      // Build optional date filters
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (filterDate) {
        startDate = new Date(`${filterDate}T00:00:00Z`).toISOString();
        endDate = new Date(`${filterDate}T23:59:59Z`).toISOString();
      }

      // Call API helper
      const data = await getReservationActivityLog({
        token: accessToken,
        hotelId: hotelIdLocal,
        reservationId: 0, // Assuming you want all logs, not filtered by reservation
        username, // Assuming you want all logs, not filtered by reservation
        page: currentPage,
        pageSize: 10,
      });

      console.log("Fetched activity log data:", data);

      setLogs(
        Array.isArray(data.logs)
          ? data.logs.map((log: any) => ({
              logId: log.activityLogID ?? log.logId ?? 0,
              createdOn: log.createdOn,
              username: log.createdBy ?? log.username ?? "",
              resLog: log.activity ?? log.resLog ?? "",
              platform: log.platform ?? "",
            }))
          : []
      );
      setTotalPages(Math.ceil(data.totalCount / 10) || 1);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  // const handleNightAudit = async () => {
  //   setAuditProcessing(true);
  //   try {
  //     const fullName = localStorage.getItem("fullName") || "";
  //     const accessToken = JSON.parse(
  //       localStorage.getItem("hotelmateTokens") || "{}"
  //     ).accessToken;

  //     // Get hotelId directly from localStorage selectedProperty
  //     const selectedProperty = JSON.parse(
  //       localStorage.getItem("selectedProperty") || "{}"
  //     );
  //     const hotelId = selectedProperty?.id;

  //     const log = async (message: string) => {

  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${accessToken}`,
  //         },
  //         body: JSON.stringify({
  //           logId: 0,
  //           username: fullName,
  //           hotelId: hotelId,
  //           reservationId: 0,
  //           reservationDetailId: 0,
  //           resLog: message,
  //           createdOn: new Date().toISOString(),
  //           platform: "Web",
  //           reservationNo: "",
  //           roomNumber: "",
  //         }),
  //       });
  //     };

  //     await log("Night Audit started");

  //     const payload = {
  //       nightAuditDate: hotelDate ? new Date(hotelDate).toISOString() : null,
  //       currentTimeStamp: new Date().toISOString(),
  //       hotelId: hotelId,
  //       platform: "web",
  //     };
  //     console.log("Night Audit payload:", payload);

  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${accessToken}`,
  //       },
  //       body: JSON.stringify(payload),
  //     });

  //     if (!res.ok) {
  //       throw new Error("Failed to perform Night Audit");
  //     }

  //     await log("Night Audit completed successfully");

  //     alert("Night Audit Process completed and logged.");
  //     // Reload the page so the UI reflects the updated system date
  //     window.location.reload();
  //   } catch (err) {
  //     console.error("Night Audit failed:", err);
  //     alert("Night Audit failed.");
  //   } finally {
  //     setAuditProcessing(false);
  //     setShowAuditModal(false);
  //   }
  // };

  const handleNightAudit = async () => {
    setAuditProcessing(true);
    // Guard clause: prevent Night Audit if system date is ahead of today's date
    if (isFutureDate) {
      alert(
        "Night Audit cannot proceed: system date is ahead of today's date."
      );
      setShowAuditModal(false);
      return;
    }
    try {
      const fullName = localStorage.getItem("fullName") || "";
      const tokenString = localStorage.getItem("hotelmateTokens");
      const hotelString = localStorage.getItem("selectedProperty");
      if (!tokenString || !hotelString) {
        throw new Error("Authentication or hotel data not found.");
      }

      const { accessToken } = JSON.parse(tokenString);
      const { id: hotelId } = JSON.parse(hotelString);
      if (!hotelId) throw new Error("Hotel ID not found.");

      // Log helper using your controller
      const log = async (message: string) => {
        await createReservationActivityLog({
          token: accessToken,
          payload: {
            logId: 0,
            username: fullName,
            hotelId: hotelId,
            reservationId: 0,
            reservationDetailId: 0,
            resLog: message,
            createdOn: new Date().toISOString(),
            platform: "Web",
            reservationNo: "",
            roomNumber: "",
          },
        });
      };

      await log("Night Audit started");

      const payload = {
        nightAuditDate: hotelDate
          ? new Date(hotelDate).toISOString()
          : new Date().toISOString(),
        currentTimeStamp: new Date().toISOString(),
        hotelId: hotelId,
        platform: "Web",
      };

      console.log("Night Audit payload:", payload);

      // Call your createNightAudit controller
      await createNightAudit({
        token: accessToken,
        payload,
      });

      await log("Night Audit completed successfully");

      alert("Night Audit Process completed and logged.");
      window.location.reload();
    } catch (err: any) {
      console.error("Night Audit failed:", err);
      alert(err.message || "Night Audit failed.");
    } finally {
      setAuditProcessing(false);
      setShowAuditModal(false);
    }
  };

  return (
    <>
      <Dialog open={showAuditModal} onOpenChange={setShowAuditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Night Audit</DialogTitle>
            <DialogDescription>
              {isFutureDate ? (
                <>
                  Night&nbsp;Audit has already been completed for today.
                  <br />
                  System&nbsp;Date:&nbsp;<strong>{systemDate}</strong>
                  &nbsp;|&nbsp;Today:&nbsp;<strong>{todayStr}</strong>
                </>
              ) : (
                <>
                  The hotel’s system date&nbsp;
                  <strong>{systemDate ?? "Unknown"}</strong>&nbsp;does not match
                  today’s date&nbsp;
                  <strong>{todayStr}</strong>.&nbsp;Proceed with the
                  Night&nbsp;Audit?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuditModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleNightAudit}
              disabled={auditProcessing || !canAudit}
            >
              {isFutureDate
                ? "Not Available"
                : auditProcessing
                ? "Processing..."
                : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DashboardLayout>
        <Card className="shadow-lg rounded-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="text-2xl font-bold">Activity Logs</CardTitle>
            <Button size="sm" onClick={() => setShowAuditModal(true)}>
              Night Audit Process
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-between items-end">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Search by user"
                  className="border px-2 py-1 rounded w-[18rem]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Activity
                </label>
                <input
                  type="text"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  placeholder="Search by activity"
                  className="border px-2 py-1 rounded w-[18rem]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Platform
                </label>
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="Search by platform"
                  className="border px-2 py-1 rounded w-[18rem]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="border px-2 py-1 rounded w-[18rem]"
                />
              </div>
              <Button
                variant="default"
                className="bg-black text-white hover:bg-neutral-800 flex items-center gap-2 "
                onClick={() => {
                  const csvContent =
                    "data:text/csv;charset=utf-8," +
                    [
                      "Date,User,Activity,Platform",
                      ...logs.map(
                        (log) =>
                          `"${new Date(log.createdOn).toLocaleString()}","${
                            log.username
                          }","${log.resLog}","${log.platform}"`
                      ),
                    ].join("\n");
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `logs_page_${currentPage}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <FileDown className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Platform</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: any) => (
                    <TableRow key={log.logId}>
                      <TableCell>
                        {new Date(log.createdOn).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.username}</TableCell>
                      <TableCell>{log.resLog}</TableCell>
                      <TableCell>{log.platform}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 text-sm text-black disabled:text-gray-400"
              >
                <span>&lt;</span> Previous
              </button>

              <span className="px-3 py-1 rounded bg-black text-white text-sm">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 text-sm text-black disabled:text-gray-400"
              >
                Next <span>&gt;</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    </>
  );
}

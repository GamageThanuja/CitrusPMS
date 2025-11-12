"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search as SearchIcon,
  UserPen,
  ArrowDown,
  ArrowUp,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
// import { getAllGuestProfiles } from "@/controllers/guestProfileMasterController";
import type { GuestProfilePayload } from "@/types/guestProfileMaster";
import EditGuestProfileDrawer from "@/components/drawers/edit-guest-profile-drawer";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useDispatch, useSelector } from "react-redux";
// import { fetchGuestProfiles } from "@/redux/slices/guestProfileByHotelIdSlice";
import { fetchGuestMas } from "@/redux/slices/fetchGuestMasSlice";
import { RootState } from "@/redux/store";

const TableHeader = ({
  label,
  sortKey,
  currentSort,
  onSort,
}: {
  label: string;
  sortKey: keyof GuestProfilePayload;
  currentSort: { key: keyof GuestProfilePayload; order: "asc" | "desc" };
  onSort: (key: keyof GuestProfilePayload) => void;
}) => {
  const isActive = currentSort.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="px-4 py-2 text-left text-xs font-semibold cursor-pointer select-none text-gray-600 dark:text-white uppercase tracking-wider"
    >
      {label}
      {isActive ? (
        currentSort.order === "asc" ? (
          <ArrowUp className="inline-block w-3 h-3 ml-1" />
        ) : (
          <ArrowDown className="inline-block w-3 h-3 ml-1" />
        )
      ) : null}
    </th>
  );
};

const GuestProfilesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingProfile, setEditingProfile] =
    useState<GuestProfilePayload | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [dobFrom, setDobFrom] = useState<string>(""); // NEW: DOB range
  const [dobTo, setDobTo] = useState<string>(""); // NEW: DOB range

  // Column filter states
  const [fResId, setFResId] = useState("");
  const [fName, setFName] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fNationality, setFNationality] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fNICPP, setFNICPP] = useState("");
  const [fDOB, setFDOB] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof GuestProfilePayload;
    order: "asc" | "desc";
  }>({
    key: "guestName",
    order: "asc",
  });

  const toDateISO = (d: any): string => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toISOString().slice(0, 10);
  };

  const dispatch = useDispatch<any>();
  const selectGuestMas = (state: RootState) => state.fetchGuestMas;
  const {
    items: guestProfiles = [],
    loading,
    error,
  } = useSelector(selectGuestMas);

  useEffect(() => {
    setPageIndex(1);
  }, [
    searchQuery,
    filterCountry,
    filterEmail,
    fResId,
    fName,
    fPhone,
    fNationality,
    fEmail,
    fNICPP,
    fDOB,
    pageSize,
  ]);

  useEffect(() => {
    dispatch(fetchGuestMas());
  }, [dispatch]);

  const handleSort = (key: keyof GuestProfilePayload) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const countries = useMemo(
    () => [...new Set(guestProfiles.map((p) => p.country).filter(Boolean))],
    [guestProfiles]
  );
  const emails = useMemo(
    () => [...new Set(guestProfiles.map((p) => p.email).filter(Boolean))],
    [guestProfiles]
  );
  const filteredProfiles = guestProfiles
    .filter((p) => {
      // quick search
      const quick =
        !searchQuery ||
        p.ppNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.country?.toLowerCase().includes(searchQuery.toLowerCase());

      // dropdown filters
      const dropdowns =
        (!filterCountry || p.country === filterCountry) &&
        (!filterEmail || p.email === filterEmail);

      // column filters
      const resId = (
        (p as any).guestID ??
        (p as any).guestId ??
        p.reservationId ??
        p.resId ??
        p.profileId ??
        ""
      ).toString();
      const name = p.guestName ?? "";
      const phone = p.phone ?? "";
      const nationality = p.country ?? "";
      const email = p.email ?? "";
      const nicpp = p.ppNo ?? p.nic ?? "";
      const dobISO = toDateISO(p.dob ?? p.dateOfBirth ?? p.dobStr); // <- normalized DOB

      const columns =
        (!fResId || resId.toLowerCase().includes(fResId.toLowerCase())) &&
        (!fName || name.toLowerCase().includes(fName.toLowerCase())) &&
        (!fPhone || phone.toLowerCase().includes(fPhone.toLowerCase())) &&
        (!fNationality ||
          nationality.toLowerCase().includes(fNationality.toLowerCase())) &&
        (!fEmail || email.toLowerCase().includes(fEmail.toLowerCase())) &&
        (!fNICPP || nicpp.toLowerCase().includes(fNICPP.toLowerCase())) &&
        (!fDOB || (dobISO && dobISO.includes(fDOB)));

      // NEW: DOB range filter
      const inDobRange =
        (!dobFrom || (dobISO && dobISO >= dobFrom)) &&
        (!dobTo || (dobISO && dobISO <= dobTo));

      return quick && dropdowns && columns && inDobRange;
    })
    .sort((a, b) => {
      const aValue = (a[sortConfig.key] as any) ?? "";
      const bValue = (b[sortConfig.key] as any) ?? "";
      return sortConfig.order === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

  // NEW: export current filtered rows (all pages) to CSV (opens in Excel)
  const exportCsv = () => {
    const rows = filteredProfiles.map((p) => {
      const dobISO = toDateISO(p.dob ?? p.dateOfBirth ?? p.dobStr);
      return {
        GuestID: (p as any).guestID ?? "",
        Name: p.guestName ?? "",
        Phone: p.phone ?? "",
        Nationality: p.country ?? "",
        Email: p.email ?? "",
        NIC_PP: p.ppNo ?? (p as any).nic ?? "",
        DOB: dobISO,
      };
    });

    const headers = Object.keys(
      rows[0] ?? {
        GuestID: "",
        Name: "",
        Phone: "",
        Nationality: "",
        Email: "",
        NIC_PP: "",
        DOB: "",
      }
    );

    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const val = (r as any)[h] ?? "";
            const needsQuotes = /[",\n]/.test(String(val));
            const escaped = String(val).replace(/"/g, '""');
            return needsQuotes ? `"${escaped}"` : escaped;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "guest_profiles.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / pageSize));
  const canPrev = pageIndex > 1 && !loading;
  const canNext = !loading && pageIndex < totalPages;

  const handlePrev = () => canPrev && setPageIndex((p) => p - 1);
  const handleNext = () => canNext && setPageIndex((p) => p + 1);
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value) || 10);
    setPageIndex(1);
  };

  const currentProfiles = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    const end = start + pageSize;
    return filteredProfiles.slice(start, end);
  }, [filteredProfiles, pageIndex, pageSize]);

  return (
    <DashboardLayout>
      <div className="p-4 space-y-6">
        {/* Header + DOB search row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-black-700">
              Guest Profiles
            </h1>
            <p className="text-sm text-gray-500 -mt-1">
              View/ Edit/ Filter Guest Details
            </p>
          </div>

          <button
            onClick={exportCsv}
            className="px-4 py-2 rounded-md bg-black hover:bg-gray-800 text-white"
          >
            Export to Excel
          </button>
        </div>

        {/* DOB range controls */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Search: DOB (Datefrom)
            </label>
            <input
              type="date"
              value={dobFrom}
              onChange={(e) => setDobFrom(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white dark:border-gray-700"
              placeholder="YYYY-MM-DD"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Search: DOB (DateTo)
            </label>
            <input
              type="date"
              value={dobTo}
              onChange={(e) => setDobTo(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md dark:bg-black dark:text-white dark:border-gray-700"
              placeholder="YYYY-MM-DD"
            />
          </div>

          <div className="flex sm:justify-start">
            <button
              onClick={() => setPageIndex(1)}
              className="h-10 px-4 mt-6 rounded-md bg-black hover:bg-gray-700 text-white inline-flex items-center gap-2"
            >
              <SearchIcon className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>
        {/* Table */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg p-4 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">
            Guest Profiles
          </h2>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-white">
              {/* Labels row */}
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  #
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Guest ID
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Booker Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Phone No
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nationality
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  NIC/PP
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  DOB
                </th>
              </tr>
              {/* Filter inputs row */}
              <tr className="border-t border-gray-200">
                <th className="px-3 py-2" />
                <th className="px-3 py-2">
                  <input
                    value={fResId}
                    onChange={(e) => {
                      setFResId(e.target.value);
                      setPageIndex(1);
                    }}
                    className="w-full border rounded px-2 py-1 text-sm dark:bg-black dark:text-white font- dark:border-gray-700"
                  />
                </th>
                <th className="px-3 py-2">
                  <input
                    value={fName}
                    onChange={(e) => {
                      setFName(e.target.value);
                      setPageIndex(1);
                    }}
                    className="w-full border rounded px-2 py-1 text-sm dark:bg-black dark:text-white dark:border-gray-700"
                  />
                </th>
                <th className="px-3 py-2">
                  <input
                    value={fPhone}
                    onChange={(e) => {
                      setFPhone(e.target.value);
                      setPageIndex(1);
                    }}
                    className="w-full border rounded px-2 py-1 text-sm dark:bg-black dark:text-white dark:border-gray-700"
                  />
                </th>
                <th className="px-3 py-2">
                  <input
                    value={fNationality}
                    onChange={(e) => {
                      setFNationality(e.target.value);
                      setPageIndex(1);
                    }}
                    className="w-full border rounded px-2 py-1 text-sm dark:bg-black dark:text-white dark:border-gray-700"
                  />
                </th>
                <th className="px-3 py-2">
                  <input
                    value={fEmail}
                    onChange={(e) => {
                      setFEmail(e.target.value);
                      setPageIndex(1);
                    }}
                    className="w-full border rounded px-2 py-1 text-sm dark:bg-black dark:text-white dark:border-gray-700"
                  />
                </th>
                <th className="px-3 py-2">
                  <input
                    value={fNICPP}
                    onChange={(e) => {
                      setFNICPP(e.target.value);
                      setPageIndex(1);
                    }}
                    className="w-full border rounded px-2 py-1 text-sm dark:bg-black dark:text-white dark:border-gray-700"
                  />
                </th>
                <th className="px-3 py-2">
                  <input
                    value={fDOB}
                    onChange={(e) => {
                      setFDOB(e.target.value);
                      setPageIndex(1);
                    }}
                    placeholder="YYYY-MM-DD"
                    className="w-full border rounded px-2 py-1 text-sm dark:bg-black dark:text-white dark:border-gray-700"
                  />
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {currentProfiles.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    No data to display
                  </td>
                </tr>
              ) : (
                currentProfiles.map((p, idx) => {
                  const guestID = (p as any).guestID ?? "—";
                  const name = p.guestName ?? "—";
                  const phone = p.phone ?? "—";
                  const nationality = p.country ?? "—";
                  const email = p.email ?? "—";
                  const nicpp = p.ppNo ?? p.nic ?? "—";
                  const dob =
                    p.dob ?? p.dateOfBirth ?? ""
                      ? new Date(
                          p.dob ?? (p.dateOfBirth as any)
                        ).toLocaleDateString()
                      : "—";

                  return (
                    <tr
                      key={p.profileId ?? `${guestID}-${idx}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProfile(p as any);
                            setIsEditDrawerOpen(true);
                          }}
                          className="text-blue-600 hover:underline text-sm"
                          title="Edit guest"
                        >
                          Edit
                        </button>
                      </td>
                      <td className="px-3 py-2 dark:text-white">{guestID}</td>
                      <td className="px-3 py-2 dark:text-white">{name}</td>
                      <td className="px-3 py-2 dark:text-white">{phone}</td>
                      <td className="px-3 py-2 dark:text-white">
                        {nationality}
                      </td>
                      <td className="px-3 py-2 dark:text-white">{email}</td>
                      <td className="px-3 py-2 dark:text-white">{nicpp}</td>
                      <td className="px-3 py-2 dark:text-white">{dob}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          <div className="hidden sm:block" />
          <div className="flex justify-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrev}
                disabled={!canPrev}
                className="flex items-center gap-1 text-sm text-black disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="px-3 py-1 rounded bg-black text-white text-sm">
                {pageIndex} / {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={!canNext}
                className="flex items-center gap-1 text-sm text-black disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-gray-600">
                Rows per page:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={handlePageSizeChange}
                className="px-2 py-1 text-sm border rounded bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <EditGuestProfileDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        profileData={editingProfile}
      />
    </DashboardLayout>
  );
};

export default GuestProfilesPage;

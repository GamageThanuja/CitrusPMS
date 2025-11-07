"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserPen, ArrowDown, ArrowUp, X } from "lucide-react";
import { getAllGuestProfiles } from "@/controllers/guestProfileMasterController";
import type { GuestProfilePayload } from "@/types/guestProfileMaster";
import EditGuestProfileDrawer from "@/components/drawers/edit-guest-profile-drawer";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useDispatch, useSelector } from "react-redux";
import { fetchGuestProfiles } from "@/redux/slices/guestProfileByHotelIdSlice";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProfile, setEditingProfile] =
    useState<GuestProfilePayload | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof GuestProfilePayload;
    order: "asc" | "desc";
  }>({
    key: "guestName",
    order: "asc",
  });
  const itemsPerPage = 10;

  const dispatch = useDispatch<any>();
  const selectGuestProfilesByHotel = (state: RootState) =>
    state.guestProfileByHotelId;
  const { data: guestProfiles } = useSelector(selectGuestProfilesByHotel);

  useEffect(() => {
    dispatch(fetchGuestProfiles());
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
    .filter(
      (profile) =>
        (!searchQuery ||
          profile.ppNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.guestName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          profile.country?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (!filterCountry || profile.country === filterCountry) &&
        (!filterEmail || profile.email === filterEmail)
    )
    .sort((a, b) => {
      const aValue = a[sortConfig.key] ?? "";
      const bValue = b[sortConfig.key] ?? "";
      return sortConfig.order === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProfiles = filteredProfiles.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);

  return (
    <DashboardLayout>
      <div className="p-4 space-y-6">
        {/* Search */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search by name, passport, country..."
                className="pl-10 pr-2 py-2 border dark:border-gray-700 border-gray-300 rounded-md w-full dark:bg-black dark:text-white"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Country Filter */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">
              Filter by Country
            </label>
            <div className="flex items-center gap-2">
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-700 border-gray-300 rounded-md dark:bg-black dark:text-white"
              >
                <option value="">All</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              {filterCountry && (
                <button
                  onClick={() => setFilterCountry("")}
                  className="text-xs text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Email Filter */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">
              Filter by Email
            </label>
            <div className="flex items-center gap-2">
              <select
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-700 border-gray-300 rounded-md dark:bg-black dark:text-white"
              >
                <option value="">All</option>
                {emails.map((email) => (
                  <option key={email} value={email}>
                    {email}
                  </option>
                ))}
              </select>
              {filterEmail && (
                <button
                  onClick={() => setFilterEmail("")}
                  className="text-xs text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg p-4 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">
            Guest Profiles
          </h2>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider">
                  Passport
                </th>
                <TableHeader
                  label="Name"
                  sortKey="guestName"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider">
                  Phone
                </th>
                <TableHeader
                  label="Country"
                  sortKey="country"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-white uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {currentProfiles.map((profile) => (
                <tr
                  key={profile.profileId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <td className="px-4 py-2 dark:text-white">
                    {profile.ppNo || "N/A"}
                  </td>
                  <td className="px-4 py-2 dark:text-white">
                    {profile.guestName || "N/A"}
                  </td>
                  <td className="px-4 py-2 dark:text-white">
                    {profile.phone || "N/A"}
                  </td>
                  <td className="px-4 py-2 dark:text-white">
                    {profile.country || "N/A"}
                  </td>
                  <td className="px-4 py-2 dark:text-white">
                    {profile.email || "N/A"}
                  </td>
                  <td className="px-4 py-2 dark:text-white">
                    <UserPen
                      onClick={() => {
                        setEditingProfile(profile);
                        setIsEditDrawerOpen(true);
                      }}
                      className="w-4 h-4 text-blue-500 hover:text-blue-700 cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="text-sm px-3 py-1 border rounded disabled:opacity-50 dark:text-white"
          >
            &lt; Previous
          </button>
          <span className="text-sm dark:text-white">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="text-sm px-3 py-1 border rounded disabled:opacity-50 dark:text-white"
          >
            Next &gt;
          </button>
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

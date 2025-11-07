import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import TimePicker from "react-time-picker";
import DatePicker from "react-date-picker";

import { useEffect, useState } from "react";

export default function CheckInDateTime({
  checkInDate,
  setCheckInDate,
  checkInTime,
  setCheckInTime,
}: {
  checkInDate: Date | null;
  setCheckInDate: (d: Date) => void;
  checkInTime: string;
  setCheckInTime: (t: string) => void;
}) {
  const [combinedDateTime, setCombinedDateTime] = useState<Date | null>(null);

  useEffect(() => {
    if (checkInDate && checkInTime) {
      const [hours, minutes] = checkInTime.split(":").map(Number);
      const updated = new Date(checkInDate);
      updated.setHours(hours);
      updated.setMinutes(minutes);
      setCombinedDateTime(updated);
    }
  }, [checkInDate, checkInTime]);

  return (
    <>
      {/* Check-in Date */}
      <div className="grid grid-cols-1 gap-2">
        <label className="text-sm font-medium block mb-1">Check-in Date</label>
        <div className="rounded-md border px-3 py-2 bg-white dark:bg-zinc-900 dark:border-zinc-700">
          <DatePicker
            value={checkInDate}
            onChange={(date) => setCheckInDate(date as Date)}
            minDate={new Date()}
            clearIcon={null}
            calendarIcon={null}
            className="w-full text-sm"
          />
        </div>
      </div>

      {/* Check-in Time */}
      <div className="grid grid-cols-1 gap-2">
        <label className="text-sm font-medium block mb-1">Check-in Time</label>
        <div className="rounded-md border px-3 py-2 bg-white dark:bg-zinc-900 dark:border-zinc-700">
          <TimePicker
            value={checkInTime}
            onChange={(time) => setCheckInTime(time || "12:00")}
            disableClock={false}
            clearIcon={null}
            className="w-full text-sm"
            clockClassName="dark:bg-zinc-800 dark:text-white"
          />
        </div>
      </div>
    </>
  );
}

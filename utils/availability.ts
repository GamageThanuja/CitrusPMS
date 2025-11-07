// utils/availability.ts
export function findAvailabilityDips(
  roomCount: number,
  availability: { date: string; count: number }[]
) {
  return availability
    .filter((a) => a.count < roomCount)
    .map((a) => ({ date: a.date, available: a.count, expected: roomCount }));
}
// usage
// const dips = findAvailabilityDips(3, data[0].availability);
// -> [{ date: "2025-08-26T00:00:00Z", available: 2, expected: 3 }]

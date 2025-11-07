import { AxiosError } from "axios";
import { axiosInstance, HotelPosCenter } from "@/config/axiosConfig";

export interface PosCenter {
  hotelPosCenterId: number; // note: backend uses this casing
  hotelId: number;
  posCenter: string;
  serviceCharge: number;
  taxes: number;
  createdBy: string;
  createdOn: string;
}

export const getPosCenter = async ({
  token,
  hotelId,
}: {
  token: string;
  hotelId: number;
}): Promise<PosCenter[]> => {
  try {
    const response = await axiosInstance.get<PosCenter[]>(
      `${HotelPosCenter}/hotel/${hotelId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.data;
  } catch (error) {
    throw error as AxiosError;
  }
};

/** Find a POS Center by name (case-insensitive) within a hotel */
export const getPosCenterByName = async ({
  token,
  hotelId,
  name,
}: {
  token: string;
  hotelId: number;
  name: string;
}): Promise<PosCenter | null> => {
  const all = await getPosCenter({ token, hotelId });
  const target = name.trim().toLowerCase();
  // If multiple with same name, choose the most recent by createdOn
  const matches = all.filter(
    (r) =>
      String(r.posCenter || "")
        .trim()
        .toLowerCase() === target
  );
  if (!matches.length) return null;
  if (matches.length === 1) return matches[0];
  return matches
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
    )[0];
};

export interface CreateHotelPosCenterPayload {
  hotelId: number;
  posCenter: string;
  serviceCharge: number;
  taxes: number;
  createdBy: string;
}

/**
 * Create a Hotel POS Center and return the created record
 * - Attempts to use response.data if present
 * - Tries Location header if present
 * - Falls back to reading it back by (hotelId + posCenter) if needed
 */
export const createHotelPosCenter = async ({
  token,
  payload,
}: {
  token: string;
  payload: CreateHotelPosCenterPayload;
}): Promise<PosCenter> => {
  try {
    // IMPORTANT: use the constant, not the literal string
    const response = await axiosInstance.post(`${HotelPosCenter}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // If the API sometimes returns plain text, accept anything
      validateStatus: () => true,
    });

    if (response.status !== 200 && response.status !== 201) {
      // Try to surface backend-provided message if any
      const msg =
        (typeof response.data === "string" && response.data) ||
        (response.data?.message as string) ||
        (response.data?.detail as string) ||
        `HTTP error! Status: ${response.status}`;
      throw new Error(msg);
    }

    // 1) If backend returns the created entity, prefer that
    if (response.data && typeof response.data === "object") {
      const d = response.data as any;
      // normalize: some backends return wrapped objects { data: {...} }
      const candidate = d?.data && typeof d.data === "object" ? d.data : d;

      // ensure we at least have the core fields
      if (
        candidate?.hotelPosCenterId ||
        candidate?.hotelPOSCenterId ||
        candidate?.id
      ) {
        // Coerce into PosCenter-like object
        const pos: PosCenter = {
          hotelPosCenterId: Number(
            candidate.hotelPosCenterId ??
              candidate.hotelPOSCenterId ??
              candidate.id
          ),
          hotelId: Number(candidate.hotelId ?? payload.hotelId),
          posCenter: String(candidate.posCenter ?? payload.posCenter),
          serviceCharge: Number(
            candidate.serviceCharge ?? payload.serviceCharge
          ),
          taxes: Number(candidate.taxes ?? payload.taxes),
          createdBy: String(candidate.createdBy ?? payload.createdBy ?? ""),
          createdOn: String(candidate.createdOn ?? new Date().toISOString()),
        };
        return pos;
      }
    }

    // 2) Some APIs set the Location header to /HotelPosCenter/{id}
    const loc =
      (response.headers as any)?.location ||
      (response.headers as any)?.Location;
    if (loc && typeof loc === "string") {
      const m = loc.match(/(\d+)(?!.*\d)/);
      const id = m ? Number(m[1]) : NaN;
      if (Number.isFinite(id) && id > 0) {
        // fetch the entity to return a full PosCenter
        const list = await getPosCenter({ token, hotelId: payload.hotelId });
        const found =
          list.find((r) => r.hotelPosCenterId === id) ??
          // fallback by name if id not present in list yet
          (await getPosCenterByName({
            token,
            hotelId: payload.hotelId,
            name: payload.posCenter,
          }));
        if (found) return found;
        // last resort: synthesize object with known bits
        return {
          hotelPosCenterId: id,
          hotelId: payload.hotelId,
          posCenter: payload.posCenter,
          serviceCharge: payload.serviceCharge,
          taxes: payload.taxes,
          createdBy: payload.createdBy,
          createdOn: new Date().toISOString(),
        };
      }
    }

    // 3) Final fallback: read back by (hotelId + posCenter)
    const readBack = await getPosCenterByName({
      token,
      hotelId: payload.hotelId,
      name: payload.posCenter,
    });
    if (readBack) return readBack;

    throw new Error("Create succeeded but could not resolve created id.");
  } catch (error) {
    throw error as AxiosError | Error;
  }
};

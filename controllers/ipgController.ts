// controllers/ipgController.ts (dummy mode)

import { PaymentGatewaySetting } from "@/types/ipg";

const dummyData: PaymentGatewaySetting = {
  hotelID: 123,
  isActive: true,
  ipgBankName: "HNB",
  ipgName: "CYBERSOURCE",
  merchantIdUSD: "10057900",
  profileIdUSD: "6D7F91BB-63F-4960-81A1-68AF55C0BEC0",
  accessKeyUSD: "a2a61ce56d6e33c5badff354d12e57cb",
  secretKeyUSD: "5fc2a5a7a59473db5ad4b2d3915cb97bed50003",
  merchantIdLKR: "20012345",
  profileIdLKR: "A1B2C3D4-E5F6-1234-5678-90ABCDEF1234",
  accessKeyLKR: "b1234567890abcdef1234567890abcd",
  secretKeyLKR: "def1234567890abcdef1234567890abcd",
};

export async function getIpgSettings(
  hotelId: number,
  token: string
): Promise<PaymentGatewaySetting> {
  console.log("✅ Using dummy IPG get for hotel:", hotelId);
  return new Promise(
    (resolve) => setTimeout(() => resolve(dummyData), 500) // simulate network delay
  );
}

export async function upsertIpgSettings(
  payload: PaymentGatewaySetting,
  token: string
): Promise<PaymentGatewaySetting> {
  console.log("✅ Dummy save called with:", payload);
  return new Promise(
    (resolve) => setTimeout(() => resolve(payload), 500) // echo back payload
  );
}

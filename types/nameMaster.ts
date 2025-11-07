export interface NameMasterPayload {
  nameID: number;
  hotelID: number | null;
  code: string;
  name: string;
  nameType: string;
  taType: string;
  finAct: boolean;
  createdBy: string;
  createdOn: string;
  updatedOn: string | null;
  updatedBy: string | null;
  hotelCode: number;
  tranCode: string;
  phoneNo: string;
  email: string;
  address: string;
  vatNo: string;
}

export interface ItemMaster {
  categoryID: number | null;
  itemID: number;
  hotelID: number;
  itemCode: string;
  itemName: string;
  description: string;
  salesAccountID: number;
  price: number;
  imageURL: string;
  finAct: boolean;
  createdBy: string;
  createdOn: string;
  updatedBy: string | null;
  updatedOn: string | null;
}

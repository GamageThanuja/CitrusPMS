import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string | null;
};

type AddToCartPayload = Product & {
  outlets: any | null;
};

type CartItem = AddToCartPayload & {
  quantity: number;
};

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<AddToCartPayload>) => {
      const existing = state.items.find(
        (item) =>
          item.id === action.payload.id &&
          item.outlets?.hotelPosCenterId ===
            action.payload.outlets?.hotelPosCenterId
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },
    removeFromCart: (
      state,
      action: PayloadAction<{ id: string; outlets: any | null }>
    ) => {
      const index = state.items.findIndex(
        (item) =>
          item.id === action.payload.id &&
          item.outlets?.hotelPosCenterId ===
            action.payload.outlets?.hotelPosCenterId
      );
      if (index !== -1) {
        if (state.items[index].quantity > 1) {
          state.items[index].quantity -= 1;
        } else {
          state.items.splice(index, 1);
        }
      }
    },

    // ✅ New reducer to remove entire item
    removeItemCompletely: (
      state,
      action: PayloadAction<{ id: string; outlets: any | null }>
    ) => {
      state.items = state.items.filter(
        (item) =>
          !(
            item.id === action.payload.id &&
            item.outlets?.hotelPosCenterId ===
              action.payload.outlets?.hotelPosCenterId
          )
      );
    },

    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, clearCart, removeItemCompletely } =
  cartSlice.actions;
export default cartSlice.reducer;

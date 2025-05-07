import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ICourse } from "@/types/course";

interface CartState {
  items: ICourse[];
  userId: string | null;
}

const initialState: CartState = {
  items: [],
  userId: null,
};

// Helper function to get cart key for localStorage
const getCartKey = (userId: string) => `cart_${userId}`;

// Helper function to load cart from localStorage
const loadCartFromStorage = (userId: string): ICourse[] => {
  const cartKey = getCartKey(userId);
  const storedCart = localStorage.getItem(cartKey);
  return storedCart ? JSON.parse(storedCart) : [];
};

// Helper function to save cart to localStorage
const saveCartToStorage = (userId: string, items: ICourse[]) => {
  const cartKey = getCartKey(userId);
  localStorage.setItem(cartKey, JSON.stringify(items));
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ course: ICourse; userId: string }>) => {
      const { course, userId } = action.payload;
      
      // Prevent duplicate courses in cart
      if (!state.items.find(item => item._id === course._id)) {
        state.items.push(course);
        state.userId = userId;
        saveCartToStorage(userId, state.items);
      }
    },
    removeFromCart: (state, action: PayloadAction<{ courseId: string; userId: string }>) => {
      const { courseId, userId } = action.payload;
      state.items = state.items.filter(item => item._id !== courseId);
      state.userId = userId;
      saveCartToStorage(userId, state.items);
    },
    clearCart: (state, action: PayloadAction<{ userId: string }>) => {
      const { userId } = action.payload;
      state.items = [];
      state.userId = userId;
      saveCartToStorage(userId, []);
    },
    setCart: (state, action: PayloadAction<{ items: ICourse[]; userId: string }>) => {
      const { items, userId } = action.payload;
      state.items = items;
      state.userId = userId;
      saveCartToStorage(userId, items);
    },
    loadUserCart: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      state.items = loadCartFromStorage(userId);
      state.userId = userId;
    },
  },
});

export const { addToCart, removeFromCart, clearCart, setCart, loadUserCart } = cartSlice.actions;
export default cartSlice.reducer;

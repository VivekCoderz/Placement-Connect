import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  details: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginState: (state, action) => {
      state.user = action.payload.user;
      state.details = action.payload.details || null;
      state.isAuthenticated = true;
    },
    logoutState: (state) => {
      state.user = null;
      state.details = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    updateStudentDetails: (state, action) => {
      state.details = action.payload;
    },
  },
});

export const { loginState, logoutState, setLoading, updateStudentDetails } = authSlice.actions;
export default authSlice.reducer;

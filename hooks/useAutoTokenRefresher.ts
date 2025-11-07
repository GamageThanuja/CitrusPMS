import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { refreshToken } from "../redux/slices/authSlice";
import { RootState } from "@/redux/store";

export const useAutoTokenRefresher = () => {
  const dispatch = useDispatch();
  const tokenExpiry = useSelector((state: RootState) => state.auth.tokenExpiry);

  useEffect(() => {
    if (!tokenExpiry) return;

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = tokenExpiry - now;

    const refreshTime = Math.max((timeUntilExpiry - 300) * 1000, 1000);

    const timeoutId = setTimeout(() => {
      dispatch(refreshToken());
    }, refreshTime);

    return () => clearTimeout(timeoutId);
  }, [tokenExpiry, dispatch]);
};

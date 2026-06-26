import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar";
import type { UserProfileResponse, ApiError } from "../../types/vehicle";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../Toast/useToast";
import { userApi } from "../../services/api";
import { NotificationBell } from "../Notifications";
import ProfileDropdown from "../ProfileDropdown";

export default function UserLayout() {
  const [userProfile, setUserProfile] = useState<UserProfileResponse>();
  const toast = useToast();
  const hasFetchedRef = useRef(false);

  const fetchUserProfile = useCallback(async () => {
    try {
      const profile = await userApi.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      const apiError = error as ApiError;
      toast.error(apiError.message || "Failed to fetch user profile");
    }
  }, [toast]);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUserProfile();
    }
  }, [fetchUserProfile]);

  return (
    <div className="relative isolate flex h-dvh max-h-dvh min-h-0 w-full min-w-0 flex-col overflow-x-clip">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 min-h-dvh min-w-full bg-app-background"
      />
      <Sidebar />
      <main className="relative z-10 ml-20 flex min-h-0 flex-1 flex-col overflow-hidden pl-4 pr-6 py-4 sm:pl-6">
        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col min-w-0 overflow-hidden">
          <div className="relative mb-8 mt-5 flex shrink-0 items-center justify-between">
            <div className="w-10" />
            <h2 className="absolute left-1/2 -translate-x-1/2 text-center text-3xl font-bold text-white sm:text-4xl">
              Welcome,{" "}
              <span className="text-neon-green">
                {userProfile?.name ?? "User"}
              </span>
            </h2>
            <div className="mr-[140px] flex items-center gap-3">
              <NotificationBell />
              <ProfileDropdown name={userProfile?.name} />
            </div>
          </div>
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

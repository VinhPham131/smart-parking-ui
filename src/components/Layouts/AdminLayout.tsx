import { Outlet } from "react-router-dom";
import AdminSidebar from "../AdminSidebar";
import { NotificationBell } from "../Notifications";
import { AiAgentChatWidget } from "../AiAgentChat";

export default function AdminLayout() {
  return (
    <div className="relative isolate flex h-dvh max-h-dvh min-h-0 w-full min-w-0 flex-col overflow-x-clip">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 min-h-dvh min-w-full bg-app-background"
      />
      <AdminSidebar />
      <main className="relative z-10 ml-20 flex min-h-0 flex-1 flex-col overflow-hidden pl-4 pr-6 py-4 sm:pl-6">
        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col min-w-0 overflow-hidden">
          <div className="relative mb-8 mt-5 flex shrink-0 items-center justify-between">
            <div className="w-10" />
            <h2 className="absolute left-1/2 -translate-x-1/2 text-3xl font-bold text-white sm:text-4xl">
              <span className="text-neon-green">Admin</span> Dashboard
            </h2>
            <NotificationBell className="mr-35" />
          </div>
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
            <Outlet />
          </div>
        </div>
      </main>
      <AiAgentChatWidget />
    </div>
  );
}

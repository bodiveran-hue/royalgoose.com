import { Navigate, Route, Routes } from "react-router-dom";
import { canAccess, useApp } from "./context/AppContext";
import { AppShell } from "./components/AppShell";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { PlayerProfile, Players } from "./pages/Players";
import { Tactics } from "./pages/Tactics";
import { VideoPage } from "./pages/Video";
import { Scouting } from "./pages/Scouting";
import { Transfers } from "./pages/Transfers";
import { Medical } from "./pages/Medical";
import { Performance } from "./pages/Performance";
import { CalendarPage } from "./pages/Calendar";
import { Messages } from "./pages/Messages";
import { AgentsPage, ControlCenter, DesignAI } from "./pages/AiOps";
import { Reports, Tasks } from "./pages/Ops";
import { Admin, Audit } from "./pages/Admin";
import { Billing, Settings } from "./pages/Billing";
import type { ReactNode } from "react";

function Guard({ children }: { children: ReactNode }) {
  const { user, ready, locale } = useApp();
  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        {locale === "fr" ? "Chargement de la session…" : "Loading session…"}
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleGate({ path, children }: { path: string; children: ReactNode }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccess(user.role, path)) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/app"
        element={
          <Guard>
            <AppShell />
          </Guard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="players" element={<Players />} />
        <Route path="players/:id" element={<PlayerProfile />} />
        <Route path="tactics" element={<RoleGate path="/app/tactics"><Tactics /></RoleGate>} />
        <Route path="video" element={<VideoPage />} />
        <Route path="scouting" element={<Scouting />} />
        <Route path="transfers" element={<RoleGate path="/app/transfers"><Transfers /></RoleGate>} />
        <Route path="medical" element={<Medical />} />
        <Route path="performance" element={<Performance />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="messages" element={<Messages />} />
        <Route path="design" element={<DesignAI />} />
        <Route path="control" element={<ControlCenter />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="reports" element={<Reports />} />
        <Route path="admin" element={<RoleGate path="/app/admin"><Admin /></RoleGate>} />
        <Route path="audit" element={<RoleGate path="/app/audit"><Audit /></RoleGate>} />
        <Route path="billing" element={<RoleGate path="/app/billing"><Billing /></RoleGate>} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

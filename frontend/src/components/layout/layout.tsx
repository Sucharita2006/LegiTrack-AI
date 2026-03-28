import { Outlet } from "react-router-dom";
import { Navbar } from "./navbar";

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRoya } from "@/components/RoyaProvider";

const NAV_ITEMS = [
  { href: "/", label: "Script", icon: "📜" },
  { href: "/screenplay", label: "Scenes", icon: "🎬" },
  { href: "/schedule", label: "Schedule", icon: "📅" },
  { href: "/board", label: "Board", icon: "📋" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { reset } = useRoya();

  const isActive = (item: { href: string }) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

  return (
    <>
      {/* Desktop fixed sidebar (unchanged) */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-dark-800 border-r border-dark-500 flex-col z-50">
        <div className="p-5 border-b border-dark-500">
          <h1 className="text-xl font-bold text-amber-500 flex items-center gap-2">
            <span className="text-2xl">🎬</span> ROYA
          </h1>
          <p className="text-xs text-gray-500 mt-1">AI Film Production Manager</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive(item)
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-gray-400 hover:bg-dark-700 hover:text-gray-200 border border-transparent"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-dark-500 space-y-2">
          <div className="card !p-3 text-center">
            <p className="text-xs text-gray-500">WebMCP Challenge</p>
            <p className="text-[10px] text-gray-600 mt-1">8 tools registered</p>
          </div>
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 btn-secondary text-sm min-h-[44px]"
          >
            ↺ Reset
          </button>
        </div>
      </aside>

      {/* Mobile top bar (md:hidden) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-dark-800 border-b border-dark-500">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <h1 className="text-lg font-bold text-amber-500 flex items-center gap-2">
            <span className="text-xl">🎬</span> ROYA
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-gray-500">WebMCP · 8 tools</p>
            <button
              onClick={reset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-dark-600 hover:bg-dark-500 text-gray-200 border border-dark-500 min-h-[44px]"
            >
              ↺ Reset
            </button>
          </div>
        </div>
        <nav className="flex flex-wrap gap-1 px-2 pb-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 min-h-[44px] ${
                isActive(item)
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-gray-400 hover:bg-dark-700 hover:text-gray-200 border border-transparent"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}

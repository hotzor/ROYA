"use client";

import type { CallSheet } from "@/lib/store";

interface CallSheetProps {
  sheet: CallSheet;
  onExport?: (format: "text" | "html") => void;
}

export default function CallSheetDisplay({ sheet, onExport }: CallSheetProps) {
  return (
    <div className="card space-y-6">
      <div className="flex items-center justify-between border-b border-dark-500 pb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-400">
            🎬 Call Sheet — Day {sheet.dayNumber}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{sheet.date}</p>
        </div>
        <div className="flex gap-2">
          {onExport && (
            <>
              <button onClick={() => onExport("text")} className="btn-secondary text-xs">
                📄 Export TXT
              </button>
              <button onClick={() => onExport("html")} className="btn-primary text-xs">
                🌐 Export HTML
              </button>
            </>
          )}
        </div>
      </div>

      {sheet.weather && (
        <div className="bg-dark-800 rounded-lg p-4 border border-dark-500">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Weather</h3>
          <p className="text-lg">
            {sheet.weather.icon} {sheet.weather.conditions}, {sheet.weather.temp}°C
            <span className="ml-3 text-sm text-gray-500">
              Rain: {sheet.weather.rainPercent}%
            </span>
          </p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3">
          Scenes ({sheet.scenes.length})
        </h3>
        <div className="space-y-2">
          {sheet.scenes.map((scene) => (
            <div key={scene.id} className="bg-dark-800 rounded-lg p-3 border border-dark-500 flex items-start gap-3">
              <span className="text-amber-400 font-mono text-xs mt-0.5">
                {scene.id.replace("sc-", "#")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-100">{scene.heading}</p>
                <p className="text-xs text-gray-500 mt-1">{scene.location}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Cast: {scene.cast.join(", ")}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <span className={scene.type === "INT" ? "badge-int" : "badge-ext"}>
                  {scene.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Cast Call Times</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-500">
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">Time</th>
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">Name</th>
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">Scenes</th>
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {sheet.cast.map((member) => (
                <tr key={member.name} className="border-b border-dark-600">
                  <td className="py-2 px-3 font-mono text-amber-400">{member.callTime}</td>
                  <td className="py-2 px-3 text-gray-100">{member.name}</td>
                  <td className="py-2 px-3 text-gray-400 text-xs">{member.scenes.join(", ")}</td>
                  <td className="py-2 px-3 text-gray-500 text-xs">{member.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sheet.notes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Notes</h3>
          <ul className="space-y-1">
            {sheet.notes.map((note, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                <span className="text-amber-500">▸</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

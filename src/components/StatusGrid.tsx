"use client";

import type { ProductionStatus } from "@/lib/store";

interface StatusGridProps {
  status: ProductionStatus;
}

export default function StatusGrid({ status }: StatusGridProps) {
  const cards = [
    {
      label: "Total Scenes",
      value: status.totalScenes,
      sub: `${status.completedScenes} completed`,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Tasks",
      value: status.totalTasks,
      sub: `${status.completedTasks} done`,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Shooting Days",
      value: status.shootingDays,
      sub: status.nextShootDate ? `Next: ${status.nextShootDate}` : "Not scheduled",
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Completion",
      value: `${status.completionPercent}%`,
      sub: "Overall progress",
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`card border ${card.bg} !p-4`}>
          <p className="text-xs text-gray-500 mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}

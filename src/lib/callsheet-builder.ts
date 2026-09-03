import type { Scene, CallSheet, CallSheetCastEntry, WeatherForecast } from "./store";

export function buildCallSheet(
  scenes: Scene[],
  date: string,
  castFilter?: string[]
): CallSheet {
  const dayScenes = scenes
    .filter((s) => s.scheduledDate === date)
    .sort((a, b) => (a.id.localeCompare(b.id)));

  const castMap = new Map<string, CallSheetCastEntry>();
  for (const scene of dayScenes) {
    for (const member of scene.cast) {
      if (castFilter && !castFilter.includes(member)) continue;
      if (!castMap.has(member)) {
        castMap.set(member, {
          name: member,
          scenes: [],
          callTime: "06:00",
          notes: "",
        });
      }
      castMap.get(member)!.scenes.push(scene.slug);
    }
  }

  const cast = Array.from(castMap.values());
  assignCallTimes(cast, dayScenes);

  const weather = dayScenes[0]?.weather || null;

  const notes: string[] = [];
  if (weather && weather.rainPercent > 50) {
    notes.push(`⚠️ WEATHER ALERT: ${weather.rainPercent}% rain chance — cover exterior equipment.`);
  }
  if (dayScenes.some((s) => s.type === "EXT")) {
    notes.push("Exterior scenes scheduled — check weather updates morning of shoot.");
  }
  notes.push("All cast report to holding 30 minutes before call time.");
  notes.push("Production office opens at 05:30.");

  return {
    date,
    dayNumber: dayScenes[0]?.dayNumber || 1,
    scenes: dayScenes,
    cast,
    weather,
    notes,
  };
}

function assignCallTimes(
  cast: CallSheetCastEntry[],
  scenes: Scene[]
): void {
  for (const entry of cast) {
    const firstScene = scenes.find((s) => s.cast.includes(entry.name));
    if (!firstScene) continue;

    const sceneIndex = scenes.indexOf(firstScene);
    if (sceneIndex === 0) {
      entry.callTime = "06:00";
    } else if (sceneIndex < 3) {
      entry.callTime = "07:00";
    } else {
      entry.callTime = "08:00";
    }

    if (firstScene.type === "EXT") {
      entry.notes = "Exterior location — check weather";
    }
  }
}

export function formatCallSheetText(sheet: CallSheet): string {
  const lines: string[] = [];
  const sep = "═".repeat(60);
  const thin = "─".repeat(60);

  lines.push(sep);
  lines.push(`  🎬 CALL SHEET — DAY ${sheet.dayNumber}`);
  lines.push(`  📅 ${formatDate(sheet.date)}`);
  lines.push(sep);
  lines.push("");

  if (sheet.weather) {
    lines.push(`  WEATHER: ${sheet.weather.icon} ${sheet.weather.conditions}, ${sheet.weather.temp}°C`);
    lines.push(`  Rain chance: ${sheet.weather.rainPercent}%`);
    lines.push("");
  }

  lines.push(`  SCENES (${sheet.scenes.length})`);
  lines.push(thin);
  for (const scene of sheet.scenes) {
    lines.push(`  ${scene.heading}`);
    lines.push(`    Location: ${scene.location}`);
    lines.push(`    Cast: ${scene.cast.join(", ")}`);
    lines.push("");
  }

  lines.push(`  CAST CALL TIMES`);
  lines.push(thin);
  for (const member of sheet.cast) {
    lines.push(`  ${member.callTime}  ${member.name}`);
    lines.push(`           Scenes: ${member.scenes.join(", ")}`);
    if (member.notes) lines.push(`           Note: ${member.notes}`);
    lines.push("");
  }

  if (sheet.notes.length > 0) {
    lines.push(`  NOTES`);
    lines.push(thin);
    for (const note of sheet.notes) {
      lines.push(`  ${note}`);
    }
    lines.push("");
  }

  lines.push(sep);
  lines.push("  ROYA — AI Film Production Manager");
  lines.push(sep);

  return lines.join("\n");
}

export function formatCallSheetHTML(sheet: CallSheet): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Call Sheet — Day ${sheet.dayNumber} — ${formatDate(sheet.date)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; background: #0a0a0f; color: #f5f5f5; padding: 40px; }
    .header { text-align: center; border-bottom: 3px solid #f59e0b; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 24px; color: #f59e0b; }
    .header p { color: #a0a0b0; margin-top: 5px; }
    .section { margin-bottom: 25px; }
    .section h2 { color: #f59e0b; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #2e2e46; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; color: #f59e0b; padding: 8px 12px; border-bottom: 1px solid #2e2e46; }
    td { padding: 8px 12px; border-bottom: 1px solid #1a1a2e; }
    .weather { background: #1a1a2e; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .notes { background: #1a1a2e; padding: 15px; border-radius: 8px; }
    .notes li { margin-bottom: 8px; list-style: none; }
    .footer { text-align: center; margin-top: 40px; color: #555; border-top: 1px solid #2e2e46; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎬 CALL SHEET — DAY ${sheet.dayNumber}</h1>
    <p>📅 ${formatDate(sheet.date)}</p>
  </div>

  ${sheet.weather ? `
  <div class="weather">
    <strong>WEATHER:</strong> ${sheet.weather.icon} ${sheet.weather.conditions}, ${sheet.weather.temp}°C — Rain: ${sheet.weather.rainPercent}%
  </div>` : ""}

  <div class="section">
    <h2>SCENES (${sheet.scenes.length})</h2>
    <table>
      <thead><tr><th>Scene</th><th>Type</th><th>Location</th><th>Cast</th></tr></thead>
      <tbody>
        ${sheet.scenes.map((s) => `<tr><td>${s.heading}</td><td>${s.type}</td><td>${s.location}</td><td>${s.cast.join(", ")}</td></tr>`).join("\n        ")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>CAST CALL TIMES</h2>
    <table>
      <thead><tr><th>Time</th><th>Name</th><th>Scenes</th><th>Notes</th></tr></thead>
      <tbody>
        ${sheet.cast.map((c) => `<tr><td>${c.callTime}</td><td>${c.name}</td><td>${c.scenes.join(", ")}</td><td>${c.notes}</td></tr>`).join("\n        ")}
      </tbody>
    </table>
  </div>

  ${sheet.notes.length > 0 ? `
  <div class="notes">
    <h2 style="color:#f59e0b;margin-bottom:10px;">NOTES</h2>
    <ul>${sheet.notes.map((n) => `<li>${n}</li>`).join("\n      ")}</ul>
  </div>` : ""}

  <div class="footer">ROYA — AI Film Production Manager</div>
</body>
</html>`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

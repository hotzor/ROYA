import type { Scene } from "./store";

const MOCK_SCENES: Scene[] = [
  {
    id: "sc-1",
    slug: "01-mission-control-night",
    heading: "1. INT. MISSION CONTROL - NIGHT",
    type: "INT",
    timeOfDay: "NIGHT",
    location: "Studio A — Mission Control Set",
    summary: "Alex discovers the signal has returned after 18 months.",
    cast: ["Alex Mercer", "Mira Chen"],
    props: ["Monitors", "Coffee cups", "Workstation"],
    departmentNotes: { Camera: "Static wide + handheld close-ups", Lighting: "Blue monitor wash" },
    dayNumber: null,
    scheduledDate: null,
    status: "pending",
  },
];

export async function analyzeScript(script: string): Promise<Scene[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return extractScenesFromScript(script);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are a film production assistant. Extract scenes from screenplays and return JSON.
Return a JSON object with key "scenes" containing an array of scene objects.
Each scene has: id (string "sc-N"), slug (kebab-case), heading (full scene heading), type ("INT"|"EXT"), timeOfDay ("DAY"|"NIGHT"), location (studio/real location suggestion), summary (1-2 sentences), cast (array of character names), props (array), departmentNotes (object with Camera/Lighting/Art/Sound/Wardrobe/Props keys).
Day number should be null. scheduledDate should be null. status should be "pending".`,
          },
          { role: "user", content: `Extract all scenes from this screenplay:\n\n${script}` },
        ],
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status);
      return extractScenesFromScript(script);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return extractScenesFromScript(script);

    const parsed = JSON.parse(content) as { scenes: Scene[] };
    if (Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
      return parsed.scenes.map((s, i) => ({
        ...s,
        id: s.id || `sc-${i + 1}`,
        dayNumber: null,
        scheduledDate: null,
        status: "pending" as const,
      }));
    }
    return extractScenesFromScript(script);
  } catch (err) {
    console.error("AI analysis failed, using regex extraction:", err);
    return extractScenesFromScript(script);
  }
}

function extractScenesFromScript(script: string): Scene[] {
  const sceneRegex = /^(\d+)\.\s+(INT|EXT)\.\s+(.+?)\s+-\s+(DAY|NIGHT)/gm;
  const scenes: Scene[] = [];
  let match: RegExpExecArray | null;

  while ((match = sceneRegex.exec(script)) !== null) {
    const num = match[1];
    const type = match[2] as "INT" | "EXT";
    const locationPart = match[3].trim();
    const timeOfDay = match[4] as "DAY" | "NIGHT";

    const startIdx = match.index;
    const nextMatch = sceneRegex.exec(script);
    const endIdx = nextMatch ? nextMatch.index : script.length;
    sceneRegex.lastIndex = endIdx;
    const sceneText = script.slice(startIdx, endIdx);

    const characters = extractCharacters(sceneText);

    scenes.push({
      id: `sc-${num}`,
      slug: `${num.padStart(2, "0")}-${locationPart.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}-${timeOfDay.toLowerCase()}`,
      heading: `${num}. ${type}. ${locationPart} - ${timeOfDay}`,
      type,
      timeOfDay,
      location: suggestLocation(type, locationPart),
      summary: generateSummary(sceneText),
      cast: characters,
      props: extractProps(sceneText),
      departmentNotes: generateDepartmentNotes(type, timeOfDay, locationPart),
      dayNumber: null,
      scheduledDate: null,
      status: "pending",
    });
  }

  return scenes.length > 0 ? scenes : MOCK_SCENES;
}

function extractCharacters(text: string): string[] {
  const charRegex = /^([A-Z][A-Z\s]+):/gm;
  const chars = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = charRegex.exec(text)) !== null) {
    const name = m[1].trim();
    if (name.length > 2 && name.length < 30 && !["INT", "EXT", "FADE", "CUT", "THE"].includes(name)) {
      chars.add(name);
    }
  }
  return Array.from(chars);
}

function extractProps(text: string): string[] {
  const props: string[] = [];
  const propKeywords = [
    "monitor", "screen", "coffee", "tablet", "phone", "whiteboard", "dish",
    "satellite", "server", "console", "printout", "briefcase", "suv", "tarp",
    "file", "folder", "keycard", "badge", "paper", "notebook", "pen",
  ];
  const lower = text.toLowerCase();
  for (const p of propKeywords) {
    if (lower.includes(p)) props.push(p.charAt(0).toUpperCase() + p.slice(1));
  }
  return props.length > 0 ? props : ["Set dressing TBD"];
}

function suggestLocation(type: string, part: string): string {
  if (type === "INT") return `Studio A — ${part} Set`;
  return `Exterior — ${part}`;
}

function generateSummary(text: string): string {
  const lines = text.split("\n").filter((l) => l.trim() && !l.match(/^\d+\.\s+(INT|EXT)/));
  const dialogue = lines.filter((l) => l.match(/^[A-Z][A-Z\s]+:/));
  if (dialogue.length >= 2) {
    return `${dialogue[0].split(":")[0].trim()} confronts ${dialogue[1].split(":")[0].trim()} about a critical discovery.`;
  }
  return "Key scene in the production sequence.";
}

function generateDepartmentNotes(type: string, time: string, loc: string): Record<string, string> {
  const ext = type === "EXT";
  return {
    Camera: ext ? "Exterior coverage — prepare for natural light changes." : "Interior coverage — controlled lighting environment.",
    Lighting: time === "NIGHT"
      ? (ext ? "Night exterior — practicals and moonlight simulation." : "Night interior — controlled mood lighting.")
      : (ext ? "Natural daylight — schedule for best light window." : "Daylight interior — window light simulation."),
    Art: `Dress ${loc} per script requirements.`,
    Sound: ext ? "Exterior ambient — wind, traffic, nature." : "Interior controlled — room tone, electronics.",
    Wardrobe: "Costumes per character breakdown.",
    Props: "Props per scene listing.",
  };
}

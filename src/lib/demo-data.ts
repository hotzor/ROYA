import type { Scene, Task } from "./store";

const CAST = ["Alex Mercer", "Mira Chen", "Chef Dolan", "Agent Reyes", "Captain Park", "Dr. Wells"];

const DEPARTMENTS = ["Camera", "Lighting", "Art", "Sound", "Wardrobe", "Props"];

const demoScript = `THE LAST SIGNAL

Written by A. Nolan

FADE IN:

1. INT. MISSION CONTROL - NIGHT
   Banks of monitors cast blue light across ALEX MERCER's face. He's been here for forty hours. Coffee cups form a small city around his workstation.
   ALEX: "Signal's back. Same coordinates. Same pattern."
   MIRA CHEN steps up behind him, holding two mugs.
   MIRA: "That's impossible. Meridian-7 went dark eighteen months ago."

2. INT. MISSION CONTROL - BACKUP ROOM - DAY
   Night has become day. ALEX paces in front of whiteboards covered in frequency charts. AGENT REYES watches from the doorway.
   AGENT REYES: "The board wants this buried. Whatever Meridian-7 found up there, they don't want it getting out."
   ALEX: "People died for that signal. My team died."

3. EXT. RESEARCH FACILITY - ROOFTOP - DAY
   MIRA adjusts a satellite dish the size of a car. Wind whips her jacket. Below, security guards patrol with dogs.
   MIRA: "If I can boost the gain on this dish, I can isolate the source frequency. But I need clear sky."
   She glances up at gathering clouds.

4. INT. MISSION CONTROL - MAIN FLOOR - NIGHT
   Full crew now. TECHNICIANS at every station. The main screen shows a waveform pulsing like a heartbeat.
   ALEX: "There. You see that? It's not random noise. It's a response pattern."
   CAPTAIN PARK enters from the military liaison office.
   CAPTAIN PARK: "You have thirty-six hours before the decommission order takes effect."

5. INT. KITCHEN SET - BREAK ROOM - DAY
   CHEF DOLAN serves coffee and sandwiches to the night shift. He notices MIRA staring at her tablet.
   CHEF DOLAN: "You look like my soufflé fell. What's the trouble?"
   MIRA: "The signal... it's using our own handshake protocol. Meridian-7 is using OUR language."

6. EXT. RESEARCH FACILITY - PARKING LOT - NIGHT
   A black SUV idles near the fence. AGENT REYES approaches the driver's window. A briefcase changes hands.
   AGENT REYES: "This changes nothing. I agreed to protect the project, not expose it."
   The SUV drives off. REYES watches it go, jaw tight.

7. INT. MISSION CONTROL - SERVER ROOM - DAY
   DR. WELLS runs diagnostics on humming server racks. She holds a printout with shaking hands.
   DR. WELLS: "Alex, the signal contains biological data. Protein folding patterns. It's not a message — it's a blueprint."
   The room goes silent.

8. EXT. RESEARCH FACILITY - ROOFTOP - NIGHT
   Rain hammers down. MIRA shelters under a makeshift tarp, shielding equipment with her body. The dish spins wildly.
   MIRA: "I've got lock! Signal acquired! But the storm — I can't hold it steady!"

9. INT. MISSION CONTROL - MAIN FLOOR - NIGHT
   Screens flash red. Warning klaxons. CAPTAIN PARK is on the phone, shouting.
   CAPTAIN PARK: "Get me the Secretary! Tell them the signal just changed frequency — it's adapting to our countermeasures!"
   ALEX stares at the waveform, which has become something new. Something alive.

10. INT. DR. WELLS' LAB - NIGHT
    DR. WELLS works alone, surrounded by protein models on screens. She makes a connection and gasps.
    DR. WELLS: "Oh god. It's not from out there. The protein patterns match terrestrial organisms. This signal has been on Earth the whole time."
    She reaches for the phone.

11. INT. MISSION CONTROL - MAIN FLOOR - NIGHT
    Everyone gathered. The main screen shows two waveforms — the incoming signal and DR. WELLS' decoded sequence — overlapping perfectly.
    ALEX: "Meridian-7 didn't find something in space. It found something that was already here. Something that's been waiting."
    MIRA: "The question is — now that we've answered... what happens next?"
    The waveform pulses once. Twice. Then: silence.

12. INT. MISSION CONTROL - MAIN FLOOR - DAWN
    First light through the windows. Everyone exhausted, unshaven, coffee cold. ALEX sits alone at his console.
    The screen flickers. A new signal appears.
    Text renders letter by letter: "WELCOME HOME."
    ALEX stares. He picks up the phone.
    ALEX: "Get me everyone. We're just getting started."

    FADE OUT.

    THE END`;

const demoScenes: Scene[] = [
  {
    id: "sc-1",
    slug: "01-mission-control-night",
    heading: "1. INT. MISSION CONTROL - NIGHT",
    type: "INT",
    timeOfDay: "NIGHT",
    location: "Studio A — Mission Control Set",
    summary: "Alex discovers the signal has returned after 18 months. Mira joins him with coffee, skeptical.",
    cast: ["Alex Mercer", "Mira Chen"],
    props: ["Monitors", "Coffee cups", "Workstation", "Frequency charts"],
    departmentNotes: {
      Camera: "Static wide + handheld close-ups on Alex. Blue monitor lighting dominates.",
      Lighting: "Blue monitor wash, practicals. Minimal key light — faces lit by screens.",
      Art: "Build-up coffee cups. Control panels active. Meridian-7 mission patch visible.",
      Sound: "Low hum of electronics. Quiet beeping. Whispered dialogue.",
      Wardrobe: "Alex in wrinkled mission polo. Mira in hoodie over sleepwear.",
      Props: "Coffee mugs (6+), tablets, printed frequency readouts.",
    },
    dayNumber: 1,
    scheduledDate: null,
    status: "scheduled",
  },
  {
    id: "sc-2",
    slug: "02-backup-room-day",
    heading: "2. INT. MISSION CONTROL - BACKUP ROOM - DAY",
    type: "INT",
    timeOfDay: "DAY",
    location: "Studio A — Backup Room Set",
    summary: "Agent Reyes warns Alex the board wants the project buried. Alex reveals his team died for the signal.",
    cast: ["Alex Mercer", "Agent Reyes"],
    props: ["Whiteboards", "Frequency charts", "Coffee"],
    departmentNotes: {
      Camera: "Two-shot through doorway, then reverse singles. Tight framing for tension.",
      Lighting: "Harsh fluorescent overhead. Reyes silhouetted in doorway.",
      Art: "Whiteboards covered in dense frequency analysis. Red circles around key data.",
      Sound: "Room tone, distant voices through walls. Tense underscore.",
      Wardrobe: "Reyes in sharp suit. Alex same as before — hasn't changed.",
      Props: "Whiteboard markers, reference papers.",
    },
    dayNumber: 1,
    scheduledDate: null,
    status: "scheduled",
  },
  {
    id: "sc-3",
    slug: "03-rooftop-dish-day",
    heading: "3. EXT. RESEARCH FACILITY - ROOFTOP - DAY",
    type: "EXT",
    timeOfDay: "DAY",
    location: "Rooftop Location — Satellite Dish",
    summary: "Mira adjusts a massive satellite dish. Gathering clouds threaten her work.",
    cast: ["Mira Chen"],
    props: ["Satellite dish", "Tablet", "Wind jacket", "Security footage monitors"],
    departmentNotes: {
      Camera: "Low angle looking up at dish. Drone possibility for establishing shot.",
      Lighting: "Natural daylight — schedule for golden hour if possible.",
      Art: "Satellite dish (practical or VFX combo). Security detail visible below.",
      Sound: "Wind, metal creaking, distant barking dogs. Dialogue partially shouted.",
      Wardrobe: "Mira in heavy jacket, hair tied back, practical boots.",
      Props: "Tablet with frequency readout, wrench, cable connectors.",
    },
    dayNumber: 2,
    scheduledDate: null,
    status: "scheduled",
  },
  {
    id: "sc-4",
    slug: "04-main-floor-night",
    heading: "4. INT. MISSION CONTROL - MAIN FLOOR - NIGHT",
    type: "INT",
    timeOfDay: "NIGHT",
    location: "Studio A — Main Control Floor",
    summary: "Full crew activated. The waveform pulses like a heartbeat. Captain Park delivers a 36-hour deadline.",
    cast: ["Alex Mercer", "Mira Chen", "Captain Park"],
    props: ["Main screen", "Waveform display", "Station monitors", "Military badges"],
    departmentNotes: {
      Camera: "Dolly across stations, hero shot on main screen reveal. Captain Park entrance coverage.",
      Lighting: "Full control room — active screens, alert status reds and blues.",
      Art: "Full crew at stations. Captain Park in dress uniform with military ID.",
      Sound: "Controlled chaos — keyboards, quiet comms, the pulsing signal audio.",
      Wardrobe: "Park in military dress. Alex and Mira unchanged.",
      Props: "Military badges, status boards, decommission order folder.",
    },
    dayNumber: 1,
    scheduledDate: null,
    status: "scheduled",
  },
  {
    id: "sc-5",
    slug: "05-break-room-day",
    heading: "5. INT. KITCHEN SET - BREAK ROOM - DAY",
    type: "INT",
    timeOfDay: "DAY",
    location: "Studio B — Break Room Set",
    summary: "Chef Dolan serves coffee. Mira realizes the signal is using their own communication protocol.",
    cast: ["Mira Chen", "Chef Dolan"],
    props: ["Coffee service", "Sandwiches", "Tablet", "Break room furniture"],
    departmentNotes: {
      Camera: "Warm two-shot. Slow push on Mira's realization moment.",
      Lighting: "Warm practical lighting — a contrast to control room coldness.",
      Art: "Cozy break room. Clock on wall, motivational posters, coffee machine.",
      Sound: "Coffee machine, quiet radio in background, clinking cups.",
      Wardrobe: "Chef Dolan in whites and apron. Mira still in rooftop gear.",
      Props: "Full coffee service, plate of sandwiches, Mira's tablet.",
    },
    dayNumber: 2,
    scheduledDate: null,
    status: "scheduled",
  },
  {
    id: "sc-6",
    slug: "06-parking-lot-night",
    heading: "6. EXT. RESEARCH FACILITY - PARKING LOT - NIGHT",
    type: "EXT",
    timeOfDay: "NIGHT",
    location: "Exterior — Parking Lot",
    summary: "Agent Reyes meets a mysterious SUV. A briefcase changes hands. She questions her loyalty.",
    cast: ["Agent Reyes"],
    props: ["Black SUV", "Briefcase", "Fence", "Security lights"],
    departmentNotes: {
      Camera: "Wide establishing, tight on briefcase exchange, close on Reyes' face after.",
      Lighting: "Practical security lights only. SUV headlights. High contrast noir feel.",
      Art: "Chain-link fence, restricted area signs, wet pavement (rain fx).",
      Sound: "Engine idle, gravel, distant facility hum. Minimal dialogue.",
      Wardrobe: "Reyes in dark coat over suit. Driver unseen (gloves only).",
      Props: "Metal briefcase, security badge, SUV with tinted windows.",
    },
    dayNumber: 2,
    scheduledDate: null,
    status: "scheduled",
  },
  {
    id: "sc-7",
    slug: "07-server-room-day",
    heading: "7. INT. MISSION CONTROL - SERVER ROOM - DAY",
    type: "INT",
    timeOfDay: "DAY",
    location: "Studio A — Server Room Set",
    summary: "Dr. Wells decodes the signal: it contains biological blueprints. Not a message — a blueprint.",
    cast: ["Dr. Wells", "Alex Mercer"],
    props: ["Server racks", "Printouts", "Protein models", "Diagnostic tools"],
    departmentNotes: {
      Camera: "Close on Wells' hands, then face. Pull back to include Alex's reaction.",
      Lighting: "Cold server room LED strips. Wells' face lit by diagnostic screen.",
      Art: "Rows of humming servers. Protein folding models on adjacent screens.",
      Sound: "Server hum, typing, the moment of silence after the revelation.",
      Wardrobe: "Wells in lab coat over casual clothes. Alex enters from previous scene.",
      Props: "Printout with protein diagrams, diagnostic tablet, server status lights.",
    },
    dayNumber: 2,
    scheduledDate: null,
    status: "scheduled",
  },
  {
    id: "sc-8",
    slug: "08-rooftop-rain-night",
    heading: "8. EXT. RESEARCH FACILITY - ROOFTOP - NIGHT",
    type: "EXT",
    timeOfDay: "NIGHT",
    location: "Rooftop Location — Rain Sequence",
    summary: "Rain hammers Mira on the rooftop. She fights to hold the dish steady as she acquires the signal.",
    cast: ["Mira Chen"],
    props: ["Satellite dish", "Tarp", "Rain equipment", "Tablet"],
    departmentNotes: {
      Camera: "Handheld in rain. Water on lens (intentional). Hero shot on signal lock.",
      Lighting: "Storm lighting — occasional lightning flashes. Equipment LED glow.",
      Art: "Dish spinning in wind. Makeshift tarp shelter. Water everywhere.",
      Sound: "Rain, wind, shouted dialogue over storm. Signal tone cutting through.",
      Wardrobe: "Drenched clothes, jacket soaked. Hair plastered. Waterproof boots.",
      Props: "Waterproof tarp, cable ties, dish controller, rain covers for gear.",
    },
    dayNumber: 3,
    scheduledDate: null,
    status: "scheduled",
  },
  {
    id: "sc-9",
    slug: "09-main-floor-red-alert",
    heading: "9. INT. MISSION CONTROL - MAIN FLOOR - NIGHT",
    type: "INT",
    timeOfDay: "NIGHT",
    location: "Studio A — Main Control Floor (Alert State)",
    summary: "Red alert. The signal adapts to countermeasures. Captain Park calls the Secretary. The waveform comes alive.",
    cast: ["Alex Mercer", "Mira Chen", "Captain Park"],
    props: ["Alert screens", "Phones", "Red alert lighting", "Waveform display"],
    departmentNotes: {
      Camera: "Fast cuts, dutch angles. Hero shot on Alex watching the living waveform.",
      Lighting: "Red alert wash rotating. Emergency lighting. Dramatic shadows.",
      Art: "All screens flashing red. Crew scrambling. Captain Park on phone.",
      Sound: "Klaxon alarms, urgent voices, the signal's new frequency pattern.",
      Wardrobe: "Same characters, more disheveled. Park's uniform loosened.",
      Props: "Military phone, alert keycards, decommission order (discarded).",
    },
    dayNumber: 3,
    scheduledDate: null,
    status: "scheduled",
  },
  {
    id: "sc-10",
    slug: "10-wells-lab-night",
    heading: "10. INT. DR. WELLS' LAB - NIGHT",
    type: "INT",
    timeOfDay: "NIGHT",
    location: "Studio B — Lab Set",
    summary: "Dr. Wells works alone and makes a horrifying discovery: the signal is terrestrial, not extraterrestrial.",
    cast: ["Dr. Wells"],
    props: ["Protein models", "Lab equipment", "Screens", "Phone"],
    departmentNotes: {
      Camera: "Slow orbit around Wells as she works. Dramatic push-in on revelation.",
      Lighting: "Single desk lamp. Monitor glow. Deep shadows. Horror-film framing.",
      Art: "Dense lab clutter. Protein models everywhere. Whiteboard with equations.",
      Sound: "Quiet typing, model pieces clicking, her gasp, then the phone pickup.",
      Wardrobe: "Wells in lab coat, hair messy, glasses pushed up. Exhausted.",
      Props: "3D protein models, laptop, printed sequences, landline phone.",
    },
    dayNumber: 3,
    scheduledDate: null,
    status: "scheduled",
  },
  {
    id: "sc-11",
    slug: "11-main-floor-convergence",
    heading: "11. INT. MISSION CONTROL - MAIN FLOOR - NIGHT",
    type: "INT",
    timeOfDay: "NIGHT",
    location: "Studio A — Main Control Floor (Full Crew)",
    summary: "The two waveforms overlap perfectly. The signal was on Earth all along. Mira asks: what happens now?",
    cast: ["Alex Mercer", "Mira Chen", "Captain Park", "Dr. Wells", "Agent Reyes"],
    props: ["Dual waveform display", "Full crew stations", "Decoded sequence"],
    departmentNotes: {
      Camera: "Wide ensemble shot. Individual reactions. The overlapping waveforms.",
      Lighting: "Return to normal lighting. The calm after the storm. Warm undertones.",
      Art: "All key players assembled. Screens showing decoded data. Unity moment.",
      Sound: "The signal's dual waveform. Silence. Then the heartbeat pulse. Twice.",
      Wardrobe: "All characters present. Exhausted but unified.",
      Props: "Dr. Wells' printout on main screen. Two waveforms merging.",
    },
    dayNumber: 3,
    scheduledDate: null,
    status: "scheduled",
  },
  {
    id: "sc-12",
    slug: "12-mission-control-dawn",
    heading: "12. INT. MISSION CONTROL - MAIN FLOOR - DAWN",
    type: "INT",
    timeOfDay: "DAY",
    location: "Studio A — Main Control Floor (Dawn Light)",
    summary: "Dawn breaks. Alex alone. A new signal arrives with a chilling message: WELCOME HOME.",
    cast: ["Alex Mercer"],
    props: ["Console", "Window with dawn light", "Phone", "New signal display"],
    departmentNotes: {
      Camera: "Slow push on Alex. Hold on the text appearing letter by letter. Final wide.",
      Lighting: "Natural dawn light through windows mixing with monitor glow. Golden hour interior.",
      Art: "Empty control room. Cold coffee. Exhaustion everywhere. Dawn sky visible.",
      Sound: "Near silence. Keyboard clatter of text appearing. Phone pickup. FADE.",
      Wardrobe: "Alex alone. Wrinkled, exhausted, unshaven. The weight of discovery.",
      Props: "Phone, cold coffee, crumpled papers, console with new signal.",
    },
    dayNumber: 3,
    scheduledDate: null,
    status: "scheduled",
  },
];

const demoTasks: Task[] = [
  {
    id: "task-1",
    sceneId: "sc-1",
    sceneSlug: "01-mission-control-night",
    department: "Lighting",
    task: "Set up blue monitor wash lighting rig",
    assignee: "Tech: Jordan",
    status: "done",
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "task-2",
    sceneId: "sc-1",
    sceneSlug: "01-mission-control-night",
    department: "Art",
    task: "Dress control room with coffee cups and papers",
    assignee: "Art: Sam",
    status: "in_progress",
    createdAt: "2025-01-15T10:05:00Z",
  },
  {
    id: "task-3",
    sceneId: "sc-3",
    sceneSlug: "03-rooftop-dish-day",
    department: "Props",
    task: "Source or build satellite dish prop (practical + VFX)",
    assignee: "Props: Dana",
    status: "todo",
    createdAt: "2025-01-15T10:10:00Z",
  },
  {
    id: "task-4",
    sceneId: "sc-8",
    sceneSlug: "08-rooftop-rain-night",
    department: "Camera",
    task: "Prepare rain covers for camera equipment",
    assignee: "DP: Kim",
    status: "todo",
    createdAt: "2025-01-15T10:15:00Z",
  },
  {
    id: "task-5",
    sceneId: "sc-8",
    sceneSlug: "08-rooftop-rain-night",
    department: "Lighting",
    task: "Set up rain effect lighting (practical rain + lightning rigs)",
    assignee: "Tech: Jordan",
    status: "todo",
    createdAt: "2025-01-15T10:20:00Z",
  },
  {
    id: "task-6",
    sceneId: "sc-7",
    sceneSlug: "07-server-room-day",
    department: "Art",
    task: "Build protein folding models for lab screens",
    assignee: "Art: Sam",
    status: "done",
    createdAt: "2025-01-15T10:25:00Z",
  },
  {
    id: "task-7",
    sceneId: "sc-10",
    sceneSlug: "10-wells-lab-night",
    department: "Wardrobe",
    task: "Age Dr. Wells' lab coat (stains, wrinkles)",
    assignee: "Wardrobe: Chris",
    status: "in_progress",
    createdAt: "2025-01-15T10:30:00Z",
  },
  {
    id: "task-8",
    sceneId: "sc-12",
    sceneSlug: "12-mission-control-dawn",
    department: "Sound",
    task: "Record silence ambience + keyboard typing SFX",
    assignee: "Sound: Lee",
    status: "todo",
    createdAt: "2025-01-15T10:35:00Z",
  },
];

export { demoScript, demoScenes, demoTasks, CAST, DEPARTMENTS };

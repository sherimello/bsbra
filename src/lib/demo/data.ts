import type {
  Album,
  AuditEntry,
  CommitteeMember,
  ContactMessage,
  DocumentRecord,
  IndustryStatistic,
  LabourStatistic,
  MeetingMinutes,
  Member,
  PastPresident,
  Photo,
  Post,
  Profile,
  TideEntry,
  Vessel,
  VesselStatus,
  VesselType,
  Yard,
  YardStatus,
} from "@/lib/types";
import { FIXTURE_TIMESTAMP, meta, uid } from "./ids";

/**
 * Sample data for the preview build and the optional demo seed.
 * Yards, vessels and statistics are ILLUSTRATIVE — fictional yard names,
 * IMO-format numbers outside the range used for real ships (1xxxxxx), and
 * representative figures. Replace with official BSBRA records before launch.
 */

// ---------------------------------------------------------------------------
// Deterministic pseudo-random numbers
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261011);
const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)];
const between = (min: number, max: number) => Math.round(min + rand() * (max - min));

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** IMO-format number with a valid check digit, in the 1xxxxxx range (never a real ship). */
function sampleImo(n: number) {
  const base = String(100000 + ((n * 7919) % 90000));
  const digits = base.split("").map(Number);
  const check = digits.reduce((acc, d, i) => acc + d * (7 - i), 0) % 10;
  return `${base}${check}`;
}

// ---------------------------------------------------------------------------
// Yards
// ---------------------------------------------------------------------------
const facilities = {
  en: [
    "Impermeable reinforced-concrete secondary cutting area",
    "Heavy-lift cranes for block handling",
    "Dedicated zones for primary cutting, secondary cutting and storage",
    "On-site training centre",
    "Medical room with trained first-aiders",
    "Worker canteen, rest area and sanitation",
  ],
  bn: [
    "অভেদ্য রিইনফোর্সড কংক্রিটের সেকেন্ডারি কাটিং এলাকা",
    "ব্লক উত্তোলনের জন্য ভারী ক্রেন",
    "প্রাইমারি কাটিং, সেকেন্ডারি কাটিং ও সংরক্ষণের নির্দিষ্ট এলাকা",
    "ইয়ার্ডে প্রশিক্ষণ কেন্দ্র",
    "প্রশিক্ষিত কর্মীসহ চিকিৎসা কক্ষ",
    "শ্রমিকদের ক্যান্টিন, বিশ্রামাগার ও পয়ঃনিষ্কাশন",
  ],
};
const environmental = {
  en: ["Drainage to an oil–water separator", "Run-off collection and treatment", "Air, water and soil monitoring", "Spill kits and containment booms"],
  bn: ["তেল–পানি বিভাজকে যুক্ত ড্রেনেজ", "বৃষ্টির পানি সংগ্রহ ও শোধন", "বায়ু, পানি ও মাটির মান পর্যবেক্ষণ", "স্পিল কিট ও কনটেইনমেন্ট বুম"],
};
const safety = {
  en: ["Permit-to-work and gas-free testing", "PPE issued to every worker", "Fire-fighting equipment and fire watch", "Emergency response plan and ambulance"],
  bn: ["পারমিট-টু-ওয়ার্ক ও গ্যাস-ফ্রি পরীক্ষা", "প্রত্যেক শ্রমিককে পিপিই সরবরাহ", "অগ্নিনির্বাপণ সরঞ্জাম ও ফায়ার ওয়াচ", "জরুরি সাড়াদান পরিকল্পনা ও অ্যাম্বুলেন্স"],
};
const waste = {
  en: ["Roofed, bunded hazardous-material store", "Asbestos removal unit with decontamination", "Segregation bays for recyclable materials", "Documented hand-over to authorised operators"],
  bn: ["ছাদযুক্ত, বাঁধ-ঘেরা বিপজ্জনক উপকরণের গুদাম", "ডিকন্টামিনেশনসহ অ্যাসবেস্টস অপসারণ ইউনিট", "পুনর্ব্যবহারযোগ্য উপকরণের পৃথকীকরণ এলাকা", "অনুমোদিত প্রতিষ্ঠানের কাছে নথিভুক্ত হস্তান্তর"],
};

interface YardSeed {
  slug: string;
  name_en: string;
  name_bn: string;
  status: YardStatus;
  owner: string;
  lat: number;
  lng: number;
  area: number;
  capacity: number;
  certifier: string | null;
  issued: string | null;
  cover: string;
}

const yardSeeds: YardSeed[] = [
  { slug: "meridian-green-ship-recycling", name_en: "Meridian Green Ship Recycling", name_bn: "মেরিডিয়ান গ্রিন শিপ রিসাইক্লিং", status: "green", owner: "Meridian Steel Group", lat: 22.452, lng: 91.721, area: 48000, capacity: 180000, certifier: "ClassNK", issued: "2024-03-18", cover: "/art/shoreline.svg" },
  { slug: "bluewater-ship-recycling", name_en: "Bluewater Ship Recycling", name_bn: "ব্লুওয়াটার শিপ রিসাইক্লিং", status: "green", owner: "Bluewater Industries Ltd.", lat: 22.468, lng: 91.716, area: 42000, capacity: 150000, certifier: "RINA", issued: "2023-11-02", cover: "/art/harbour.svg" },
  { slug: "horizon-eco-yard", name_en: "Horizon Eco Yard", name_bn: "হরাইজন ইকো ইয়ার্ড", status: "green", owner: "Horizon Holdings", lat: 22.481, lng: 91.712, area: 39000, capacity: 140000, certifier: "Indian Register of Shipping", issued: "2024-08-21", cover: "/art/estuary.svg" },
  { slug: "northstar-ship-recycling", name_en: "Northstar Ship Recycling", name_bn: "নর্থস্টার শিপ রিসাইক্লিং", status: "green", owner: "Northstar Re-Rolling Mills", lat: 22.497, lng: 91.707, area: 45000, capacity: 165000, certifier: "ClassNK", issued: "2025-03-18", cover: "/art/current.svg" },
  { slug: "coastline-recycling-industries", name_en: "Coastline Recycling Industries", name_bn: "কোস্টলাইন রিসাইক্লিং ইন্ডাস্ট্রিজ", status: "progressive", owner: "Coastline Group", lat: 22.512, lng: 91.703, area: 36000, capacity: 120000, certifier: null, issued: null, cover: "/art/tidal-flat.svg" },
  { slug: "anchorage-steel-recycling", name_en: "Anchorage Steel Recycling", name_bn: "অ্যাঙ্কোরেজ স্টিল রিসাইক্লিং", status: "progressive", owner: "Anchorage Steel Ltd.", lat: 22.526, lng: 91.699, area: 33000, capacity: 110000, certifier: null, issued: null, cover: "/art/bathymetry.svg" },
  { slug: "silverline-recycling", name_en: "Silverline Recycling", name_bn: "সিলভারলাইন রিসাইক্লিং", status: "progressive", owner: "Silverline Enterprises", lat: 22.539, lng: 91.694, area: 30000, capacity: 95000, certifier: null, issued: null, cover: "/art/dusk.svg" },
  { slug: "tidewater-ship-breaking", name_en: "Tidewater Ship Breaking", name_bn: "টাইডওয়াটার শিপ ব্রেকিং", status: "conventional", owner: "Tidewater Traders", lat: 22.553, lng: 91.689, area: 26000, capacity: 80000, certifier: null, issued: null, cover: "/art/ridge.svg" },
];

export const yards: Yard[] = yardSeeds.map((y, i) => {
  const isGreen = y.status === "green";
  const isProgressive = y.status === "progressive";
  const certified = isGreen && y.issued;
  return {
    ...meta(`yard:${y.slug}`),
    slug: y.slug,
    name_en: y.name_en,
    name_bn: y.name_bn,
    status: y.status,
    owner_company: y.owner,
    address_en: "Sitakunda, Chattogram, Bangladesh",
    address_bn: "সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    latitude: y.lat,
    longitude: y.lng,
    contact_person: null,
    phone: null,
    email: null,
    website: null,
    show_contact: true,
    yard_area_sqm: y.area,
    capacity_ldt_per_year: y.capacity,
    hkc_compliant: isGreen,
    certifying_body: y.certifier,
    certificate_no: certified ? `SOC-${y.issued!.slice(0, 4)}-${String(101 + i)}` : null,
    certificate_issued_on: y.issued,
    certificate_expires_on: certified ? addDays(y.issued!, 5 * 365) : null,
    description_en: isGreen
      ? `${y.name_en} operates a Hong Kong Convention-compliant facility on the Sitakunda coast, with an impermeable secondary cutting area, heavy-lift cranes and a dedicated hazardous-material store.`
      : isProgressive
        ? `${y.name_en} is upgrading its facility towards Hong Kong Convention compliance, with civil works, equipment and training under way.`
        : `${y.name_en} is a conventional yard on the Sitakunda coast.`,
    description_bn: isGreen
      ? `${y.name_bn} সীতাকুণ্ড উপকূলে একটি হংকং কনভেনশন-সম্মত স্থাপনা পরিচালনা করে — যেখানে অভেদ্য সেকেন্ডারি কাটিং এলাকা, ভারী ক্রেন ও বিপজ্জনক উপকরণের নির্দিষ্ট গুদাম রয়েছে।`
      : isProgressive
        ? `${y.name_bn} হংকং কনভেনশন কমপ্লায়েন্সের লক্ষ্যে স্থাপনা উন্নয়ন করছে; পূর্ত কাজ, যন্ত্রপাতি সংযোজন ও প্রশিক্ষণ চলমান।`
        : `${y.name_bn} সীতাকুণ্ড উপকূলের একটি প্রচলিত ইয়ার্ড।`,
    facilities_en: isGreen ? facilities.en : facilities.en.slice(2, 5),
    facilities_bn: isGreen ? facilities.bn : facilities.bn.slice(2, 5),
    environmental_en: isGreen ? environmental.en : isProgressive ? environmental.en.slice(0, 2) : [],
    environmental_bn: isGreen ? environmental.bn : isProgressive ? environmental.bn.slice(0, 2) : [],
    safety_en: isGreen || isProgressive ? safety.en : safety.en.slice(0, 2),
    safety_bn: isGreen || isProgressive ? safety.bn : safety.bn.slice(0, 2),
    waste_en: isGreen ? waste.en : isProgressive ? waste.en.slice(0, 2) : [],
    waste_bn: isGreen ? waste.bn : isProgressive ? waste.bn.slice(0, 2) : [],
    cover_image: y.cover,
    gallery: [],
    sort_order: i + 1,
    is_published: true,
  };
});

// ---------------------------------------------------------------------------
// Vessels
// ---------------------------------------------------------------------------
const vesselNames = [
  "Ocean Pioneer", "Sea Harmony", "Golden Meridian", "Pacific Venture", "Atlantic Grace", "Silver Horizon",
  "Coral Trader", "Eastern Promise", "Blue Fortune", "Northern Star", "Southern Cross", "Emerald Bay",
  "Crystal Wave", "Royal Mariner", "Island Spirit", "Morning Glory", "Evening Breeze", "Jade Explorer",
  "Amber Voyager", "Lucky Sailor", "Great Endeavour", "Ruby Ocean", "Sapphire Sky", "Iron Duke",
  "Steel Navigator", "Cape Liberty", "Bright Trader", "Unity Express", "Harbour Light", "Grand Victory",
  "Ocean Majesty", "Sea Falcon", "Orient Pearl", "Delta Queen", "Polar Bear", "Desert Rose",
  "Monsoon Trader", "Tropic Sun", "Bengal Star", "Kestrel Bay", "Arctic Tern", "Seagull Pride",
  "Neptune Grace", "Aurora Borealis", "Coastal Breeze", "Fair Wind", "Silver Spray", "Galaxy Trader",
  "Hope Venture", "Liberty Bell", "Oriental Jade", "Prime Mariner", "Queen of Tides", "Rising Sun",
  "Summit Trader", "Titan Hope", "Vega Star", "Western Glory", "Zephyr Bay", "Lotus Harmony",
] as const;

const flags = ["Panama", "Liberia", "Marshall Islands", "Comoros", "Palau", "Saint Kitts and Nevis", "Togo", "Tuvalu", "Sierra Leone", "Tanzania", "Mongolia", "Belize"] as const;

const typeWeights: [VesselType, number][] = [
  ["bulk_carrier", 34], ["oil_tanker", 16], ["general_cargo", 14], ["container", 12], ["chemical_tanker", 6],
  ["gas_carrier", 4], ["reefer", 4], ["ro_ro", 3], ["passenger", 2], ["offshore", 3], ["tug", 2],
];

function pickType(): VesselType {
  const total = typeWeights.reduce((a, [, w]) => a + w, 0);
  let r = rand() * total;
  for (const [type, weight] of typeWeights) {
    if ((r -= weight) <= 0) return type;
  }
  return "other";
}

const ldtRange: Record<VesselType, [number, number]> = {
  bulk_carrier: [7000, 26000], oil_tanker: [9000, 38000], chemical_tanker: [4000, 12000], gas_carrier: [6000, 18000],
  container: [8000, 24000], general_cargo: [3000, 9000], ro_ro: [6000, 14000], passenger: [5000, 15000],
  reefer: [3500, 8000], offshore: [2000, 7000], tug: [400, 1500], other: [2000, 6000],
};

const yearCounts: Record<number, number> = { 2022: 12, 2023: 11, 2024: 12, 2025: 13, 2026: 12 };

export const vessels: Vessel[] = (() => {
  const rows: Vessel[] = [];
  let n = 0;
  for (const [yearKey, count] of Object.entries(yearCounts)) {
    const year = Number(yearKey);
    for (let i = 0; i < count; i++) {
      const type = pickType();
      const [lo, hi] = ldtRange[type];
      const ldt = between(lo, hi);
      const month = year === 2026 ? between(1, 9) : between(1, 12);
      const arrival = isoDate(year, month, between(1, 26));
      const beaching = addDays(arrival, between(2, 9));
      const cuttingStart = addDays(beaching, between(5, 20));
      const isRecent = year === 2026 && month >= 7;
      const status: VesselStatus = isRecent ? (month >= 9 ? "beached" : "cutting") : "completed";
      // Green yards take the bulk of recent tonnage.
      const yardPool = year >= 2025 ? yards.filter((y) => y.status !== "conventional") : yards;
      const yard = pick(yardPool);
      const name = vesselNames[n % vesselNames.length];
      rows.push({
        ...meta(`vessel:${n}`),
        yard_id: yard.id,
        vessel_name: name.toUpperCase(),
        former_names: rand() > 0.7 ? `${pick(vesselNames).toUpperCase()}` : null,
        imo_number: sampleImo(n + 11),
        flag: pick(flags),
        vessel_type: type,
        ldt,
        gross_tonnage: Math.round(ldt * (2.1 + rand() * 0.8)),
        dwt: Math.round(ldt * (4 + rand() * 2.5)),
        year_built: between(1994, 2008),
        arrival_date: arrival,
        beaching_date: beaching,
        cutting_started_on: status === "beached" ? null : cuttingStart,
        cutting_completed_on: status === "completed" ? addDays(cuttingStart, between(90, 200)) : null,
        status,
        recycling_year: Number(beaching.slice(0, 4)),
        ihm_available: year >= 2024 ? true : rand() > 0.5,
        noc_number: null,
        remarks: null,
        is_published: true,
      });
      n++;
    }
  }
  return rows.sort((a, b) => (b.beaching_date ?? "").localeCompare(a.beaching_date ?? ""));
})();

// ---------------------------------------------------------------------------
// Year-wise statistics (illustrative)
// ---------------------------------------------------------------------------
const statSeeds: [number, number, number, number, number, number, number, number][] = [
  // year, recycled, beached, LDT, active yards, green yards, workers, global share %
  [2016, 222, 226, 2380000, 95, 0, 30000, 26],
  [2017, 214, 219, 2560000, 90, 1, 29000, 25],
  [2018, 219, 223, 2670000, 88, 1, 28500, 27],
  [2019, 236, 240, 2620000, 85, 1, 28000, 35],
  [2020, 144, 150, 1840000, 70, 1, 22000, 22],
  [2021, 254, 258, 3150000, 78, 3, 30000, 33],
  [2022, 160, 166, 1920000, 72, 4, 25000, 36],
  [2023, 118, 121, 1160000, 60, 6, 21000, 26],
  [2024, 132, 135, 1380000, 58, 9, 22000, 30],
  [2025, 104, 109, 1050000, 45, 17, 19000, 28],
];

export const industryStatistics: IndustryStatistic[] = statSeeds.map(
  ([year, recycled, beached, ldt, active, green, workers, share]) => ({
    ...meta(`stat:${year}`),
    year,
    vessels_recycled: recycled,
    vessels_beached: beached,
    total_ldt: ldt,
    active_yards: active,
    green_yards: green,
    steel_output_tonnes: Math.round(ldt * 0.82),
    workers_employed: workers,
    global_share_percent: share,
    notes_en: null,
    notes_bn: null,
    source: "Illustrative sample data — replace with official BSBRA figures",
    is_published: true,
  }),
);

export const labourStatistics: LabourStatistic[] = [
  [2020, 22000, 4200, 120, 6500, 22000, 18],
  [2021, 30000, 6800, 165, 9800, 30000, 22],
  [2022, 25000, 7400, 180, 11200, 25000, 26],
  [2023, 21000, 8100, 196, 12600, 21000, 31],
  [2024, 22000, 9600, 228, 14900, 22000, 35],
  [2025, 19000, 11200, 262, 16400, 19000, 41],
].map(([year, workers, trained, sessions, checkups, insured, welfare]) => ({
  ...meta(`labour:${year}`),
  year,
  workers_employed: workers,
  workers_trained: trained,
  training_sessions: sessions,
  health_checkups: checkups,
  insured_workers: insured,
  welfare_programmes: welfare,
  notes_en: null,
  notes_bn: null,
  is_published: true,
}));

// ---------------------------------------------------------------------------
// Leadership — office bearers elected on 4 July 2026 (as reported in the press)
// ---------------------------------------------------------------------------
function committee(
  key: string,
  input: Pick<CommitteeMember, "name_en" | "name_bn" | "designation_en" | "designation_bn" | "sort_order"> &
    Partial<CommitteeMember>,
): CommitteeMember {
  return {
    ...meta(`committee:${key}`),
    organization_en: null,
    organization_bn: null,
    category: "office_bearer",
    term_label: "2026–2028",
    is_current: true,
    photo: null,
    email: null,
    phone: null,
    show_contact: false,
    bio_en: null,
    bio_bn: null,
    is_published: true,
    ...input,
  };
}

export const committeeMembers: CommitteeMember[] = [
  committee("president", {
    name_en: "Mohammad Mohsin Chowdhury",
    name_bn: "মোহাম্মদ মোহসিন চৌধুরী",
    designation_en: "President",
    designation_bn: "সভাপতি",
    organization_en: "Vice Chairman, PHP Family",
    organization_bn: "ভাইস চেয়ারম্যান, পিএইচপি ফ্যামিলি",
    sort_order: 1,
  }),
  committee("senior-vp", {
    name_en: "Mohammad Selim Uddin",
    name_bn: "মোহাম্মদ সেলিম উদ্দিন",
    designation_en: "Senior Vice President",
    designation_bn: "সিনিয়র সহ-সভাপতি",
    sort_order: 2,
  }),
  committee("vp-1", {
    name_en: "Nur Uddin",
    name_bn: "নুর উদ্দিন",
    designation_en: "Vice President",
    designation_bn: "সহ-সভাপতি",
    sort_order: 3,
  }),
  committee("vp-2", {
    name_en: "Gazi Mukarram Ali Chowdhury",
    name_bn: "গাজী মুকাররম আলী চৌধুরী",
    designation_en: "Vice President",
    designation_bn: "সহ-সভাপতি",
    sort_order: 4,
  }),
];

export const pastPresidents: PastPresident[] = [];

// ---------------------------------------------------------------------------
// Newsroom
// ---------------------------------------------------------------------------
type PostInput = Pick<Post, "slug" | "type" | "title_en" | "title_bn" | "published_at"> & Partial<Post>;

function post(input: PostInput): Post {
  return {
    ...meta(`post:${input.slug}`, input.published_at ?? FIXTURE_TIMESTAMP),
    excerpt_en: null,
    excerpt_bn: null,
    body_en: null,
    body_bn: null,
    cover_image: null,
    gallery: [],
    source_name: null,
    external_url: null,
    video_url: null,
    event_date: null,
    event_location_en: null,
    event_location_bn: null,
    csr_area: null,
    tags: [],
    is_featured: false,
    status: "published",
    access_level: "public",
    ...input,
  };
}

export const posts: Post[] = [
  post({
    slug: "bsbra-platform-launch",
    type: "announcement",
    published_at: "2026-10-01T09:00:00.000Z",
    is_featured: true,
    cover_image: "/art/bathymetry.svg",
    title_en: "BSBRA launches its new digital platform",
    title_bn: "বিএসবিআরএ-এর নতুন ডিজিটাল প্ল্যাটফর্ম চালু",
    excerpt_en:
      "Industry statistics, a yard-wise vessel database, green yard profiles, tide tables and a members' portal — now in one bilingual platform.",
    excerpt_bn:
      "শিল্প পরিসংখ্যান, ইয়ার্ডভিত্তিক জাহাজ ডেটাবেস, গ্রিন ইয়ার্ডের তথ্য, জোয়ার-ভাটার সারণি ও সদস্য পোর্টাল — এখন একটি দ্বিভাষিক প্ল্যাটফর্মে।",
    body_en: `BSBRA's new platform brings the Bangladesh ship recycling industry's information together in one place, in English and Bangla.

## What's new
- **Industry statistics** — year-wise vessels, LDT, beachings and active yards, with downloadable data.
- **Vessel database** — a searchable, yard-wise record of vessels beached and recycled.
- **Green & progressive yards** — profiles of Hong Kong Convention-compliant facilities.
- **Tide & beaching** — monthly high and low tide tables.
- **Members' portal** — circulars, minutes and resources for members and corporate partners.

Members and partners can request an account from the sign-in page.`,
    body_bn: `বিএসবিআরএ-এর নতুন প্ল্যাটফর্ম বাংলাদেশের জাহাজ পুনর্ব্যবহার শিল্পের তথ্য এক জায়গায়, ইংরেজি ও বাংলায় নিয়ে এসেছে।

## নতুন যা আছে
- **শিল্প পরিসংখ্যান** — বছরভিত্তিক জাহাজ, এলডিটি, বিচিং ও সক্রিয় ইয়ার্ড, ডাউনলোডযোগ্য তথ্যসহ।
- **জাহাজ ডেটাবেস** — বিচিং ও পুনর্ব্যবহৃত জাহাজের ইয়ার্ডভিত্তিক, অনুসন্ধানযোগ্য রেকর্ড।
- **গ্রিন ও প্রগ্রেসিভ ইয়ার্ড** — হংকং কনভেনশন-সম্মত স্থাপনাগুলোর পরিচিতি।
- **জোয়ার-ভাটা ও বিচিং** — মাসিক জোয়ার-ভাটার সারণি।
- **সদস্য পোর্টাল** — সদস্য ও কর্পোরেট অংশীদারদের জন্য সার্কুলার, কার্যবিবরণী ও রিসোর্স।

সদস্য ও অংশীদাররা সাইন-ইন পৃষ্ঠা থেকে অ্যাকাউন্টের অনুরোধ করতে পারেন।`,
  }),
  post({
    slug: "bsbra-elects-executive-committee-2026-2028",
    type: "activity",
    published_at: "2026-07-05T08:00:00.000Z",
    is_featured: true,
    cover_image: "/art/meridian.svg",
    event_date: "2026-07-04T04:00:00.000Z",
    event_location_en: "Chattogram",
    event_location_bn: "চট্টগ্রাম",
    title_en: "BSBRA elects its Executive Committee for 2026–2028",
    title_bn: "২০২৬–২০২৮ মেয়াদের কার্যনির্বাহী কমিটি নির্বাচিত",
    excerpt_en:
      "Mohammad Mohsin Chowdhury has been elected President of BSBRA, following an election held in Chattogram on 4 July 2026.",
    excerpt_bn: "২০২৬ সালের ৪ জুলাই চট্টগ্রামে অনুষ্ঠিত নির্বাচনে মোহাম্মদ মোহসিন চৌধুরী বিএসবিআরএ-এর সভাপতি নির্বাচিত হয়েছেন।",
    body_en: `Members of the Bangladesh Ship Breakers & Recyclers Association elected a new Executive Committee for the 2026–27 and 2027–28 terms on 4 July 2026 in Chattogram. Of the association's 84 voters, 71 cast their ballots.

## Office bearers
- **President:** Mohammad Mohsin Chowdhury
- **Senior Vice President:** Mohammad Selim Uddin
- **Vice Presidents:** Nur Uddin and Gazi Mukarram Ali Chowdhury

The new committee takes office as the industry continues its transition to recycling under the Hong Kong Convention.`,
    body_bn: `২০২৬ সালের ৪ জুলাই চট্টগ্রামে বাংলাদেশ শিপ ব্রেকার্স অ্যান্ড রিসাইক্লার্স অ্যাসোসিয়েশনের সদস্যরা ২০২৬–২৭ ও ২০২৭–২৮ মেয়াদের জন্য নতুন কার্যনির্বাহী কমিটি নির্বাচন করেছেন। সংগঠনের ৮৪ জন ভোটারের মধ্যে ৭১ জন ভোট দিয়েছেন।

## পদাধিকারী
- **সভাপতি:** মোহাম্মদ মোহসিন চৌধুরী
- **সিনিয়র সহ-সভাপতি:** মোহাম্মদ সেলিম উদ্দিন
- **সহ-সভাপতি:** নুর উদ্দিন ও গাজী মুকাররম আলী চৌধুরী

হংকং কনভেনশনের আওতায় শিল্পের রূপান্তর অব্যাহত থাকার এই সময়ে নতুন কমিটি দায়িত্ব নিচ্ছে।`,
  }),
  post({
    slug: "yard-safety-week-2026",
    type: "event",
    published_at: "2026-09-20T09:00:00.000Z",
    cover_image: "/art/swell.svg",
    event_date: "2026-11-15T03:00:00.000Z",
    event_location_en: "Sitakunda, Chattogram",
    event_location_bn: "সীতাকুণ্ড, চট্টগ্রাম",
    title_en: "Yard Safety Week 2026",
    title_bn: "ইয়ার্ড সেফটি উইক ২০২৬",
    excerpt_en: "A week of drills, training and awareness sessions across member yards, focused on hot-work and fire safety.",
    excerpt_bn: "হট-ওয়ার্ক ও অগ্নি নিরাপত্তাকে কেন্দ্র করে সদস্য ইয়ার্ডগুলোতে এক সপ্তাহের মহড়া, প্রশিক্ষণ ও সচেতনতা কার্যক্রম।",
    body_en: `Member yards will run fire drills, gas-free testing demonstrations and refresher training throughout the week. Supervisors will receive updated guidance on permit-to-work procedures.`,
    body_bn: `সপ্তাহজুড়ে সদস্য ইয়ার্ডগুলোতে অগ্নি মহড়া, গ্যাস-ফ্রি পরীক্ষার প্রদর্শনী ও রিফ্রেশার প্রশিক্ষণ হবে। সুপারভাইজাররা পারমিট-টু-ওয়ার্ক পদ্ধতি বিষয়ে হালনাগাদ নির্দেশনা পাবেন।`,
  }),
  post({
    slug: "workshop-ship-recycling-facility-plans",
    type: "workshop",
    published_at: "2026-08-22T09:00:00.000Z",
    cover_image: "/art/monsoon.svg",
    event_date: "2026-08-20T04:00:00.000Z",
    event_location_en: "Chattogram",
    event_location_bn: "চট্টগ্রাম",
    title_en: "Workshop: preparing Ship Recycling Facility Plans",
    title_bn: "কর্মশালা: শিপ রিসাইক্লিং ফ্যাসিলিটি প্ল্যান প্রস্তুতি",
    excerpt_en: "Yard managers worked through the elements of a Ship Recycling Facility Plan under the Hong Kong Convention.",
    excerpt_bn: "হংকং কনভেনশনের আওতায় শিপ রিসাইক্লিং ফ্যাসিলিটি প্ল্যানের উপাদানগুলো নিয়ে ইয়ার্ড ব্যবস্থাপকরা কাজ করেছেন।",
    body_en: `The workshop covered facility layout, hazardous-material management, emergency preparedness, worker training and record keeping — the building blocks of a compliant Ship Recycling Facility Plan.`,
    body_bn: `কর্মশালায় স্থাপনার বিন্যাস, বিপজ্জনক উপকরণ ব্যবস্থাপনা, জরুরি প্রস্তুতি, শ্রমিক প্রশিক্ষণ ও রেকর্ড সংরক্ষণ — একটি কমপ্লায়েন্ট শিপ রিসাইক্লিং ফ্যাসিলিটি প্ল্যানের মূল উপাদানগুলো আলোচনা করা হয়।`,
  }),
  post({
    slug: "hong-kong-convention-enters-into-force",
    type: "industry_update",
    published_at: "2025-06-26T06:00:00.000Z",
    cover_image: "/art/delta.svg",
    title_en: "The Hong Kong Convention enters into force",
    title_bn: "হংকং কনভেনশন কার্যকর",
    excerpt_en:
      "From 26 June 2025, ships flagged to parties may be recycled only at authorised facilities that meet the convention's requirements.",
    excerpt_bn: "২০২৫ সালের ২৬ জুন থেকে পক্ষভুক্ত দেশের পতাকাবাহী জাহাজ কেবল কনভেনশনের শর্ত পূরণকারী অনুমোদিত স্থাপনায় পুনর্ব্যবহার করা যাবে।",
    body_en: `The IMO's Hong Kong International Convention for the Safe and Environmentally Sound Recycling of Ships entered into force on 26 June 2025, sixteen years after its adoption.

The convention covers the whole life of a ship — from design and an Inventory of Hazardous Materials to the authorisation of recycling facilities and the preparation of a ship-specific recycling plan.

For Bangladesh, which acceded in 2023, entry into force marks the start of a new operating standard for every yard.`,
    body_bn: `আইএমও-র জাহাজের নিরাপদ ও পরিবেশসম্মত পুনর্ব্যবহার বিষয়ক হংকং আন্তর্জাতিক কনভেনশন গৃহীত হওয়ার ষোলো বছর পর ২০২৫ সালের ২৬ জুন কার্যকর হয়েছে।

কনভেনশনটি জাহাজের পুরো জীবনচক্র জুড়ে প্রযোজ্য — নকশা ও বিপজ্জনক উপকরণের তালিকা থেকে শুরু করে পুনর্ব্যবহার স্থাপনার অনুমোদন এবং জাহাজভিত্তিক পুনর্ব্যবহার পরিকল্পনা পর্যন্ত।

২০২৩ সালে যোগ দেওয়া বাংলাদেশের জন্য এটি প্রতিটি ইয়ার্ডে নতুন কর্মমানের সূচনা।`,
  }),
  post({
    slug: "tide-tables-2026-published",
    type: "announcement",
    published_at: "2026-01-05T09:00:00.000Z",
    title_en: "Tide tables for 2026 published",
    title_bn: "২০২৬ সালের জোয়ার-ভাটার সারণি প্রকাশিত",
    excerpt_en: "Monthly high and low tide tables for the Sitakunda coast are now available on the Tide & Beaching page.",
    excerpt_bn: "সীতাকুণ্ড উপকূলের মাসিক জোয়ার-ভাটার সারণি এখন জোয়ার-ভাটা ও বিচিং পৃষ্ঠায় পাওয়া যাচ্ছে।",
  }),
  post({
    slug: "bangladesh-accedes-to-hong-kong-convention",
    type: "international",
    published_at: "2023-06-26T06:00:00.000Z",
    cover_image: "/art/delta.svg",
    title_en: "Bangladesh accedes to the Hong Kong Convention",
    title_bn: "হংকং কনভেনশনে বাংলাদেশের যোগদান",
    excerpt_en:
      "Bangladesh's accession, alongside Liberia's, met the convention's entry-into-force criteria, setting the date for 26 June 2025.",
    excerpt_bn: "লাইবেরিয়ার সঙ্গে বাংলাদেশের যোগদানে কনভেনশন কার্যকর হওয়ার শর্ত পূরণ হয়, যা ২০২৫ সালের ২৬ জুন তারিখ নির্ধারণ করে।",
    body_en: `Bangladesh deposited its instrument of accession to the Hong Kong Convention with the IMO in June 2023. Together with Liberia's accession, it satisfied the convention's entry-into-force conditions, which took effect 24 months later.`,
    body_bn: `২০২৩ সালের জুনে বাংলাদেশ আইএমও-তে হংকং কনভেনশনে যোগদানের দলিল জমা দেয়। লাইবেরিয়ার যোগদানের সঙ্গে মিলে এতে কনভেনশন কার্যকর হওয়ার শর্ত পূরণ হয়, যা ২৪ মাস পর কার্যকর হয়েছে।`,
  }),
  post({
    slug: "sensrec-cooperation",
    type: "international",
    published_at: "2026-03-10T06:00:00.000Z",
    cover_image: "/art/drift.svg",
    title_en: "Building capacity with the IMO's SENSREC project",
    title_bn: "আইএমও-র সেনস্রেক প্রকল্পের মাধ্যমে সক্ষমতা উন্নয়ন",
    excerpt_en:
      "The IMO-executed, Norway-funded SENSREC project has supported studies, training and planning for safe and environmentally sound ship recycling in Bangladesh.",
    excerpt_bn:
      "আইএমও-বাস্তবায়িত ও নরওয়ের অর্থায়নে সেনস্রেক প্রকল্প বাংলাদেশে নিরাপদ ও পরিবেশসম্মত জাহাজ পুনর্ব্যবহারের জন্য গবেষণা, প্রশিক্ষণ ও পরিকল্পনায় সহায়তা দিয়েছে।",
    body_en: `Through the SENSREC project (Safe and Environmentally Sound Ship Recycling in Bangladesh), the IMO and the Government of Bangladesh have worked on economic and environmental studies, worker training and improvements to the government's one-stop service for ship recycling permissions.`,
    body_bn: `সেনস্রেক (সেইফ অ্যান্ড এনভায়রনমেন্টালি সাউন্ড শিপ রিসাইক্লিং ইন বাংলাদেশ) প্রকল্পের মাধ্যমে আইএমও ও বাংলাদেশ সরকার অর্থনৈতিক ও পরিবেশগত গবেষণা, শ্রমিক প্রশিক্ষণ এবং জাহাজ পুনর্ব্যবহারের অনুমতির জন্য সরকারের ওয়ান-স্টপ সেবার উন্নয়নে কাজ করেছে।`,
  }),
  post({
    slug: "statement-hkc-transition",
    type: "statement",
    published_at: "2025-07-02T06:00:00.000Z",
    title_en: "Statement on the industry's transition to HKC-compliant recycling",
    title_bn: "এইচকেসি-সম্মত পুনর্ব্যবহারে শিল্পের রূপান্তর বিষয়ে বিবৃতি",
    excerpt_en: "BSBRA reaffirms its commitment to supporting every member yard through certification under the Hong Kong Convention.",
    excerpt_bn: "হংকং কনভেনশনের আওতায় সনদপ্রাপ্তিতে প্রতিটি সদস্য ইয়ার্ডকে সহায়তার অঙ্গীকার পুনর্ব্যক্ত করেছে বিএসবিআরএ।",
    body_en: `With the Hong Kong Convention now in force, BSBRA will continue to work with the Bangladesh Ship Recycling Board, classification societies and development partners so that every operating member yard can meet the convention's requirements.`,
    body_bn: `হংকং কনভেনশন কার্যকর হওয়ায় প্রতিটি সক্রিয় সদস্য ইয়ার্ড যাতে কনভেনশনের শর্ত পূরণ করতে পারে, সেজন্য বিএসবিআরএ বাংলাদেশ শিপ রিসাইক্লিং বোর্ড, ক্লাসিফিকেশন সোসাইটি ও উন্নয়ন সহযোগীদের সঙ্গে কাজ অব্যাহত রাখবে।`,
  }),
  post({
    slug: "coverage-bsbra-election-today",
    type: "media_coverage",
    published_at: "2026-07-04T02:00:00.000Z",
    source_name: "The Financial Express",
    external_url: "https://today.thefinancialexpress.com.bd/trade-market/bsbra-election-today-1783097128",
    title_en: "BSBRA election today",
    title_bn: "আজ বিএসবিআরএ নির্বাচন",
    excerpt_en: "Coverage of the long-delayed BSBRA election held in Chattogram.",
    excerpt_bn: "চট্টগ্রামে অনুষ্ঠিত দীর্ঘ প্রতীক্ষিত বিএসবিআরএ নির্বাচনের সংবাদ।",
  }),
  post({
    slug: "coverage-new-president-elected",
    type: "media_coverage",
    published_at: "2026-07-06T02:00:00.000Z",
    source_name: "The Daily Observer",
    external_url: "https://observerbd.com/news/582040",
    title_en: "Mohsin Chowdhury elected BSBRA president",
    title_bn: "বিএসবিআরএ সভাপতি নির্বাচিত মোহসিন চৌধুরী",
    excerpt_en: "Report on the results of the BSBRA Executive Committee election.",
    excerpt_bn: "বিএসবিআরএ কার্যনির্বাহী কমিটি নির্বাচনের ফলাফল নিয়ে প্রতিবেদন।",
  }),
  post({
    slug: "health-camp-sitakunda",
    type: "csr",
    csr_area: "health",
    published_at: "2026-05-14T06:00:00.000Z",
    cover_image: "/art/lagoon.svg",
    title_en: "Free health camp for workers' families in Sitakunda",
    title_bn: "সীতাকুণ্ডে শ্রমিক পরিবারের জন্য বিনামূল্যে স্বাস্থ্য ক্যাম্প",
    excerpt_en: "General check-ups, eye care and medicines for workers' families and neighbouring communities.",
    excerpt_bn: "শ্রমিক পরিবার ও আশপাশের জনগোষ্ঠীর জন্য সাধারণ স্বাস্থ্য পরীক্ষা, চক্ষুসেবা ও ওষুধ।",
  }),
  post({
    slug: "scholarships-workers-children",
    type: "csr",
    csr_area: "education",
    published_at: "2026-02-08T06:00:00.000Z",
    cover_image: "/art/sandbar.svg",
    title_en: "Scholarships for workers' children",
    title_bn: "শ্রমিকদের সন্তানদের জন্য বৃত্তি",
    excerpt_en: "Member yards support secondary and higher-secondary education for the children of yard workers.",
    excerpt_bn: "ইয়ার্ড শ্রমিকদের সন্তানদের মাধ্যমিক ও উচ্চমাধ্যমিক শিক্ষায় সহায়তা করছে সদস্য ইয়ার্ডগুলো।",
  }),
  post({
    slug: "mangrove-planting",
    type: "csr",
    csr_area: "environment",
    published_at: "2025-08-30T06:00:00.000Z",
    cover_image: "/art/estuary.svg",
    title_en: "Coastal tree-planting along the Sitakunda shore",
    title_bn: "সীতাকুণ্ড উপকূলে বৃক্ষরোপণ",
    excerpt_en: "Volunteers from member yards planted saplings to strengthen the coastal green belt.",
    excerpt_bn: "উপকূলীয় সবুজ বেষ্টনী শক্তিশালী করতে সদস্য ইয়ার্ডগুলোর স্বেচ্ছাসেবকরা চারা রোপণ করেছেন।",
  }),
];

// ---------------------------------------------------------------------------
// Publications & downloads. Documents with a file_path exist only in the
// preview (served from /samples); the SQL seed keeps external links only.
// ---------------------------------------------------------------------------
type DocInput = Pick<DocumentRecord, "title_en" | "title_bn" | "category" | "year"> & Partial<DocumentRecord>;

function doc(key: string, input: DocInput): DocumentRecord {
  return {
    ...meta(`document:${key}`),
    description_en: null,
    description_bn: null,
    published_on: null,
    file_path: null,
    file_name: null,
    file_size: null,
    mime_type: null,
    external_url: null,
    status: "published",
    access_level: "public",
    published_at: FIXTURE_TIMESTAMP,
    ...input,
  };
}

const samplePdf = { file_name: "bsbra-sample.pdf", file_size: 1840, mime_type: "application/pdf" };

export const documents: DocumentRecord[] = [
  doc("hkc", {
    title_en: "Hong Kong Convention — text and guidelines (IMO)",
    title_bn: "হংকং কনভেনশন — মূল পাঠ ও নির্দেশিকা (আইএমও)",
    description_en: "The convention and its supporting guidelines, published by the International Maritime Organization.",
    description_bn: "আন্তর্জাতিক সমুদ্র সংস্থা প্রকাশিত কনভেনশন ও সহায়ক নির্দেশিকা।",
    category: "law_regulation",
    year: 2009,
    external_url: "https://www.imo.org/en/ourwork/environment/pages/ship-recycling.aspx",
  }),
  doc("bsr-act", {
    title_en: "Bangladesh Ship Recycling Act, 2018",
    title_bn: "বাংলাদেশ শিপ রিসাইক্লিং আইন, ২০১৮",
    description_en: "Act No. 8 of 2018 — record in the UNEP Law and Environment Assistance Platform (FAOLEX).",
    description_bn: "২০১৮ সালের ৮ নং আইন — ইউএনইপি ল অ্যান্ড এনভায়রনমেন্ট অ্যাসিস্ট্যান্স প্ল্যাটফর্মে (এফএওলেক্স) সংরক্ষিত।",
    category: "law_regulation",
    year: 2018,
    external_url: "https://leap.unep.org/en/countries/bd/national-legislation/bangladesh-ship-recycling-act-2018-act-no-8-2018",
  }),
  doc("basel", {
    title_en: "Basel Convention — text",
    title_bn: "বাসেল কনভেনশন — মূল পাঠ",
    category: "law_regulation",
    year: 1989,
    external_url: "https://www.basel.int",
  }),
  doc("sensrec-wp3", {
    title_en: "SENSREC WP3 — Refinement of the Government One-Stop Service",
    title_bn: "সেনস্রেক ডব্লিউপি৩ — সরকারের ওয়ান-স্টপ সেবার উন্নয়ন",
    description_en: "IMO project report on streamlining permissions for ship recycling in Bangladesh.",
    description_bn: "বাংলাদেশে জাহাজ পুনর্ব্যবহারের অনুমতি প্রক্রিয়া সহজীকরণ বিষয়ে আইএমও প্রকল্প প্রতিবেদন।",
    category: "research_paper",
    year: 2019,
    external_url:
      "https://wwwcdn.imo.org/localresources/en/OurWork/PartnershipsProjects/Documents/Ship%20recycling/WP3%20Refinement%20of%20Government%20One-Stop%20Service.pdf",
  }),
  doc("annual-report-2025", {
    title_en: "BSBRA Annual Report 2025",
    title_bn: "বিএসবিআরএ বার্ষিক প্রতিবেদন ২০২৫",
    description_en: "Activities, finances and industry overview for 2025.",
    description_bn: "২০২৫ সালের কার্যক্রম, আর্থিক বিবরণী ও শিল্পের সার্বিক চিত্র।",
    category: "annual_report",
    year: 2025,
    published_on: "2026-03-31",
    file_path: "annual-reports/bsbra-annual-report-2025.pdf",
    ...samplePdf,
  }),
  doc("industry-report-2025", {
    title_en: "Ship recycling in Bangladesh: industry review 2025",
    title_bn: "বাংলাদেশে জাহাজ পুনর্ব্যবহার: শিল্প পর্যালোচনা ২০২৫",
    category: "industry_report",
    year: 2025,
    published_on: "2026-02-15",
    file_path: "reports/industry-review-2025.pdf",
    ...samplePdf,
  }),
  doc("hazmat-guideline", {
    title_en: "Guideline: handling hazardous materials on board",
    title_bn: "নির্দেশিকা: জাহাজে বিপজ্জনক উপকরণ ব্যবস্থাপনা",
    category: "guideline",
    year: 2026,
    published_on: "2026-04-10",
    file_path: "guidelines/hazardous-materials.pdf",
    ...samplePdf,
  }),
  doc("membership-form", {
    title_en: "Membership application form",
    title_bn: "সদস্যপদের আবেদন ফরম",
    category: "form",
    year: 2026,
    published_on: "2026-01-02",
    file_path: "forms/membership-application.pdf",
    ...samplePdf,
  }),
  doc("circular-hkc-documents", {
    title_en: "Circular: submission of HKC compliance documents",
    title_bn: "সার্কুলার: এইচকেসি কমপ্লায়েন্স ডকুমেন্ট দাখিল",
    description_en: "Deadlines and checklist for members submitting facility documents.",
    description_bn: "স্থাপনার ডকুমেন্ট দাখিলের সময়সীমা ও চেকলিস্ট।",
    category: "circular",
    year: 2026,
    published_on: "2026-08-01",
    access_level: "members",
    file_path: "circulars/2026-08-hkc-documents.pdf",
    ...samplePdf,
  }),
  doc("notice-agm-2026", {
    title_en: "Notice: Annual General Meeting 2026",
    title_bn: "বিজ্ঞপ্তি: বার্ষিক সাধারণ সভা ২০২৬",
    category: "notice",
    year: 2026,
    published_on: "2026-09-15",
    access_level: "members",
    file_path: "notices/agm-2026.pdf",
    ...samplePdf,
  }),
  doc("corporate-briefing", {
    title_en: "Corporate briefing: investing in green yards",
    title_bn: "কর্পোরেট ব্রিফিং: গ্রিন ইয়ার্ডে বিনিয়োগ",
    category: "publication",
    year: 2026,
    published_on: "2026-06-30",
    access_level: "corporate",
    file_path: "publications/corporate-briefing-green-yards.pdf",
    ...samplePdf,
  }),
];

// ---------------------------------------------------------------------------
// Minutes (preview only)
// ---------------------------------------------------------------------------
function minutes(key: string, input: Pick<MeetingMinutes, "title_en" | "title_bn" | "meeting_type" | "meeting_date"> & Partial<MeetingMinutes>): MeetingMinutes {
  return {
    ...meta(`minutes:${key}`),
    meeting_no: null,
    venue: "BSBRA Secretariat, Chattogram",
    summary_en: null,
    summary_bn: null,
    file_path: `minutes/${key}.pdf`,
    ...samplePdf,
    status: "approved",
    approved_at: FIXTURE_TIMESTAMP,
    access_level: "members",
    ...input,
  };
}

export const meetingMinutes: MeetingMinutes[] = [
  minutes("ec-2026-09", {
    title_en: "Executive Committee meeting — September 2026",
    title_bn: "কার্যনির্বাহী কমিটির সভা — সেপ্টেম্বর ২০২৬",
    meeting_type: "executive_committee",
    meeting_no: "EC/2026/03",
    meeting_date: "2026-09-08",
    summary_en: "Review of HKC certification progress, Yard Safety Week planning and the digital platform launch.",
    summary_bn: "এইচকেসি সনদ অগ্রগতি পর্যালোচনা, ইয়ার্ড সেফটি উইক পরিকল্পনা ও ডিজিটাল প্ল্যাটফর্ম চালু।",
  }),
  minutes("ec-2026-08", {
    title_en: "Executive Committee meeting — August 2026",
    title_bn: "কার্যনির্বাহী কমিটির সভা — আগস্ট ২০২৬",
    meeting_type: "executive_committee",
    meeting_no: "EC/2026/02",
    meeting_date: "2026-08-11",
    access_level: "internal",
    summary_en: "Budget for 2026–27, sub-committee formation and engagement with the BSRB.",
    summary_bn: "২০২৬–২৭ বাজেট, উপ-কমিটি গঠন ও বিএসআরবির সঙ্গে সম্পৃক্ততা।",
  }),
  minutes("ec-2026-07", {
    title_en: "First meeting of the 2026–2028 Executive Committee",
    title_bn: "২০২৬–২০২৮ কার্যনির্বাহী কমিটির প্রথম সভা",
    meeting_type: "executive_committee",
    meeting_no: "EC/2026/01",
    meeting_date: "2026-07-12",
    summary_en: "Handover, portfolio allocation and priorities for the term.",
    summary_bn: "দায়িত্ব হস্তান্তর, দায়িত্ব বণ্টন ও মেয়াদের অগ্রাধিকার।",
  }),
  minutes("board-2026-10-draft", {
    title_en: "Board meeting — October 2026 (draft)",
    title_bn: "বোর্ড সভা — অক্টোবর ২০২৬ (খসড়া)",
    meeting_type: "board",
    meeting_date: "2026-10-06",
    status: "draft",
    approved_at: null,
    access_level: "internal",
  }),
];

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------
interface AlbumSeed {
  slug: string;
  title_en: string;
  title_bn: string;
  category: Album["category"];
  date: string;
  images: string[];
}

const albumSeeds: AlbumSeed[] = [
  { slug: "green-yards-2026", title_en: "Green yards of Sitakunda", title_bn: "সীতাকুণ্ডের গ্রিন ইয়ার্ড", category: "green_yards", date: "2026-09-12", images: ["estuary", "shoreline", "harbour", "tidal-flat"] },
  { slug: "election-2026", title_en: "BSBRA election 2026", title_bn: "বিএসবিআরএ নির্বাচন ২০২৬", category: "events", date: "2026-07-04", images: ["meridian", "monsoon"] },
  { slug: "safety-training", title_en: "Safety training", title_bn: "নিরাপত্তা প্রশিক্ষণ", category: "seminars", date: "2026-06-18", images: ["swell", "monsoon", "ridge"] },
  { slug: "ship-recycling-operations", title_en: "Ship recycling operations", title_bn: "জাহাজ পুনর্ব্যবহার কার্যক্রম", category: "operations", date: "2026-05-02", images: ["current", "bathymetry", "dusk"] },
  { slug: "international-cooperation", title_en: "International cooperation", title_bn: "আন্তর্জাতিক সহযোগিতা", category: "international", date: "2026-03-10", images: ["delta", "drift"] },
  { slug: "community-programmes", title_en: "Community programmes", title_bn: "কমিউনিটি কর্মসূচি", category: "csr", date: "2026-05-14", images: ["lagoon", "sandbar"] },
];

export const albums: Album[] = albumSeeds.map((a, i) => ({
  ...meta(`album:${a.slug}`),
  slug: a.slug,
  title_en: a.title_en,
  title_bn: a.title_bn,
  description_en: null,
  description_bn: null,
  category: a.category,
  event_date: a.date,
  cover_image: `/art/${a.images[0]}.svg`,
  sort_order: i + 1,
  is_published: true,
}));

export const photos: Photo[] = albumSeeds.flatMap((a) =>
  a.images.map((image, i) => ({
    ...meta(`photo:${a.slug}:${i}`),
    album_id: uid(`album:${a.slug}`),
    image_path: `/art/${image}.svg`,
    video_url: null,
    caption_en: `${a.title_en} — ${i + 1}`,
    caption_bn: `${a.title_bn} — ${i + 1}`,
    credit: "BSBRA",
    width: 1600,
    height: 1000,
    allow_download: true,
    sort_order: i + 1,
  })),
);

// ---------------------------------------------------------------------------
// Member registry
// ---------------------------------------------------------------------------
export const members: Member[] = yards.map((y, i) => ({
  ...meta(`member:${y.slug}`),
  membership_no: `BSBRA-${String(101 + i).padStart(4, "0")}`,
  company_name: y.owner_company ?? y.name_en,
  company_name_bn: null,
  yard_id: y.id,
  representative_name: null,
  representative_designation: "Managing Director",
  phone: null,
  email: null,
  address: "Sitakunda, Chattogram",
  website: null,
  status: y.status === "conventional" ? "applicant" : "active",
  joined_on: `20${String(5 + i).padStart(2, "0")}-01-15`,
  notes: null,
}));

// ---------------------------------------------------------------------------
// Tide tables — synthesised from M2/S2/K1/O1 constituents for the preview.
// NOT real predictions. Load official tables via Admin → Tides → Import.
// ---------------------------------------------------------------------------
function synthesiseTides(year: number, station: string): TideEntry[] {
  const hour = 3600_000;
  // Constituent angular speeds (radians per hour).
  const M2 = (2 * Math.PI) / 12.4206;
  const S2 = (2 * Math.PI) / 12.0;
  const K1 = (2 * Math.PI) / 23.9345;
  const O1 = (2 * Math.PI) / 25.8193;
  // Align spring tides with the new moon of 18 Jan 2026 (~19:52 UTC) plus a ~1.5-day tidal age.
  const epoch = Date.UTC(2026, 0, 18, 19, 52) + 36 * hour;
  const height = (t: number) => {
    const h = (t - epoch) / hour;
    return 2.55 + 1.72 * Math.cos(M2 * h) + 0.62 * Math.cos(S2 * h) + 0.24 * Math.cos(K1 * h + 0.6) + 0.12 * Math.cos(O1 * h + 1.1);
  };

  const start = Date.UTC(year, 0, 1) - 6 * hour; // local midnight (UTC+6)
  const end = Date.UTC(year + 1, 0, 1) - 6 * hour;
  const step = 6 * 60_000;
  const out: TideEntry[] = [];
  let prev = height(start - step);
  let curr = height(start);
  for (let t = start; t < end; t += step) {
    const next = height(t + step);
    const isHigh = curr > prev && curr >= next;
    const isLow = curr < prev && curr <= next;
    if (isHigh || isLow) {
      const local = new Date(t + 6 * hour);
      const date = local.toISOString().slice(0, 10);
      const time = local.toISOString().slice(11, 16) + ":00";
      out.push({
        ...meta(`tide:${station}:${date}:${time}`),
        station,
        tide_date: date,
        tide_time: time,
        tide_type: isHigh ? "high" : "low",
        height_m: Math.round(curr * 100) / 100,
        notes: null,
      });
    }
    prev = curr;
    curr = next;
  }
  return out;
}

export const tideEntries: TideEntry[] = synthesiseTides(2026, "Sitakunda Coast");

// ---------------------------------------------------------------------------
// Preview-only records: accounts, messages and audit history
// ---------------------------------------------------------------------------
export const previewProfiles: Profile[] = (
  [
    ["super_admin", "Controlling Authority", "BSBRA Secretariat"],
    ["admin", "Platform Administrator", "BSBRA Secretariat"],
    ["editor", "Communications Editor", "BSBRA Secretariat"],
    ["data_entry", "Data Officer", "BSBRA Secretariat"],
    ["committee", "Committee Member", "Executive Committee"],
    ["member", "Member Representative", "Meridian Steel Group"],
    ["corporate", "Corporate Partner", "Partner Bank Ltd."],
    ["guest", "New Registrant", "Pending organisation"],
  ] as const
).map(([role, name, org]) => ({
  id: uid(`profile:${role}`),
  email: `${role.replace("_", "")}@example.org`,
  full_name: name,
  organization: org,
  designation: null,
  phone: null,
  avatar_url: null,
  role,
  is_active: true,
  member_id: role === "member" ? members[0].id : null,
  last_sign_in_at: "2026-10-10T08:30:00.000Z",
  created_at: "2026-09-01T08:00:00.000Z",
  updated_at: "2026-10-10T08:30:00.000Z",
}));

export const contactMessages: ContactMessage[] = [
  {
    id: uid("message:1"),
    name: "Sample Visitor",
    email: "visitor@example.org",
    phone: null,
    organization: "Example Shipping Co.",
    subject: "Membership enquiry",
    message: "We would like to know more about BSBRA membership requirements for a new yard.",
    locale: "en",
    status: "new",
    handled_by: null,
    handled_at: null,
    created_at: "2026-10-09T05:12:00.000Z",
  },
  {
    id: uid("message:2"),
    name: "Research Team",
    email: "research@example.org",
    phone: null,
    organization: "Example University",
    subject: "Data request",
    message: "Could we obtain the yard-wise vessel data for 2020–2025 for an academic study?",
    locale: "en",
    status: "read",
    handled_by: null,
    handled_at: null,
    created_at: "2026-10-04T10:40:00.000Z",
  },
];

export const auditLog: AuditEntry[] = (() => {
  const actor = previewProfiles[2];
  const dataOfficer = previewProfiles[3];
  const admin = previewProfiles[1];
  const entries: Omit<AuditEntry, "id">[] = [
    { occurred_at: "2026-10-10T09:14:00.000Z", actor_id: actor.id, actor_email: actor.email, actor_role: actor.role, action: "update", table_name: "posts", record_id: posts[0].id, record_label: posts[0].title_en, changed_fields: ["excerpt_en", "is_featured"], old_data: null, new_data: null },
    { occurred_at: "2026-10-10T08:52:00.000Z", actor_id: dataOfficer.id, actor_email: dataOfficer.email, actor_role: dataOfficer.role, action: "insert", table_name: "vessels", record_id: vessels[0].id, record_label: vessels[0].vessel_name, changed_fields: null, old_data: null, new_data: null },
    { occurred_at: "2026-10-09T15:20:00.000Z", actor_id: admin.id, actor_email: admin.email, actor_role: admin.role, action: "update", table_name: "profiles", record_id: previewProfiles[5].id, record_label: previewProfiles[5].full_name, changed_fields: ["role"], old_data: { role: "guest" }, new_data: { role: "member" } },
    { occurred_at: "2026-10-09T11:03:00.000Z", actor_id: dataOfficer.id, actor_email: dataOfficer.email, actor_role: dataOfficer.role, action: "import", table_name: "activity", record_id: "tide_entries", record_label: "tide_entries", changed_fields: null, old_data: null, new_data: { rows: tideEntries.length, year: 2026 } },
    { occurred_at: "2026-10-08T07:45:00.000Z", actor_id: actor.id, actor_email: actor.email, actor_role: actor.role, action: "insert", table_name: "documents", record_id: documents[8].id, record_label: documents[8].title_en, changed_fields: null, old_data: null, new_data: null },
    { occurred_at: "2026-10-07T13:30:00.000Z", actor_id: admin.id, actor_email: admin.email, actor_role: admin.role, action: "update", table_name: "meeting_minutes", record_id: meetingMinutes[0].id, record_label: meetingMinutes[0].title_en, changed_fields: ["status"], old_data: { status: "draft" }, new_data: { status: "approved" } },
    { occurred_at: "2026-10-07T09:02:00.000Z", actor_id: admin.id, actor_email: admin.email, actor_role: admin.role, action: "sign_in", table_name: "activity", record_id: null, record_label: null, changed_fields: null, old_data: null, new_data: {} },
    { occurred_at: "2026-10-06T16:18:00.000Z", actor_id: dataOfficer.id, actor_email: dataOfficer.email, actor_role: dataOfficer.role, action: "update", table_name: "industry_statistics", record_id: industryStatistics[9].id, record_label: "Year 2025", changed_fields: ["green_yards", "total_ldt"], old_data: null, new_data: null },
    { occurred_at: "2026-10-05T10:11:00.000Z", actor_id: actor.id, actor_email: actor.email, actor_role: actor.role, action: "delete", table_name: "links", record_id: uid("link:obsolete"), record_label: "Obsolete link", changed_fields: null, old_data: null, new_data: null },
    { occurred_at: "2026-10-04T08:40:00.000Z", actor_id: admin.id, actor_email: admin.email, actor_role: admin.role, action: "export", table_name: "activity", record_id: "audit_log", record_label: "audit_log", changed_fields: null, old_data: null, new_data: { format: "csv" } },
  ];
  return entries.map((e, i) => ({ id: entries.length - i, ...e }));
})();

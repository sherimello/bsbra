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
} from "@/lib/types";
import { FIXTURE_TIMESTAMP, meta, uid } from "./ids";
import { PHOTOS, type PhotoKey } from "@/lib/media/photos";

/**
 * Content for the preview build and the SQL seeds.
 *
 * VERIFIED (sources in each section, checked October 2026): the 17 IMO-listed
 * yards, year-wise ship counts, the 2026–2028 Executive Committee, news and
 * press coverage, and the photo albums.
 *
 * ILLUSTRATIVE (preview / demo seed only, never in the starting content):
 * vessels, members-only documents and minutes, and synthesised tide tables.
 * Vessel names are fictional, IMO-format numbers sit outside the range used by
 * real ships (1xxxxxx), and they are not linked to any yard.
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
/**
 * The 17 Bangladeshi yards on the IMO list of authorised ship recycling
 * facilities under the Hong Kong Convention, all in Sitakunda, Chattogram.
 * Authorised by the Bangladesh Ship Recycling Board, valid to 29 October 2030.
 * Source: The Business Standard, 18 May 2026 ("Bangladesh ranks second
 * globally with 17 IMO-authorised ship recycling yards"). Coordinates only
 * where OpenStreetMap names the yard; add the rest from Admin → Yards.
 */
interface YardSeed {
  slug: string;
  name_en: string;
  name_bn: string;
  owner_company?: string;
  address_en: string;
  address_bn: string;
  contact_person: string;
  phone: string;
  email: string;
  website?: string;
  certificate_no: string;
  facilities_en?: string[];
  facilities_bn?: string[];
  lat?: number;
  lng?: number;
}

const yardSeeds: YardSeed[] = [
  {
    slug: "php-ship-breaking-recycling",
    name_en: "PHP Ship Breaking & Recycling Industries Ltd",
    name_bn: "পিএইচপি শিপ ব্রেকিং অ্যান্ড রিসাইক্লিং ইন্ডাস্ট্রিজ লিমিটেড",
    owner_company: "PHP Family",
    address_en: "Sitalpur, Sitakunda, Chattogram, Bangladesh",
    address_bn: "শীতলপুর, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Mr. Zahirul Islam (Rinku), Managing Director",
    phone: "+88 01919 924477",
    email: "zahir@phpfamily.com",
    website: "https://phpfamily.com",
    certificate_no: "BSRB/2025/SRF 001",
    facilities_en: ["Impermeable concrete cutting floor", "Heavy crawler & tower cranes", "Hazardous waste containment shed", "Worker safety & training center", "Primary medical care clinic"],
    facilities_bn: ["অপ্রবেশ্য কংক্রিটের কাটিং ফ্লোর", "ভারী ক্রলার ও টাওয়ার ক্রেন", "বিপজ্জনক বর্জ্য সংরক্ষণাগার", "শ্রমিক সুরক্ষা ও প্রশিক্ষণ কেন্দ্র", "প্রাথমিক চিকিৎসাকেন্দ্র"],
    lat: 22.461618,
    lng: 91.72863,
  },
  {
    slug: "kabir-steel",
    name_en: "Kabir Steel Ltd (KSRM)",
    name_bn: "কবির স্টিল লিমিটেড (কেএসআরএম)",
    owner_company: "KSRM (Kabir Group)",
    address_en: "Shitalpur, Sitakund, Chattogram, Bangladesh",
    address_bn: "শীতলপুর, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Alhaj Md. Shahjahan, Chairman",
    phone: "+88 01711 720156",
    email: "karim@ksrm.com.bd",
    website: "https://ksrm.com.bd",
    certificate_no: "BSRB/2025/SRF 002",
    facilities_en: ["Reinforced concrete intertidal floor", "High-capacity gantry cranes", "Oily water treatment plant", "Hazardous waste segregation shed", "Emergency fire & rescue team"],
    facilities_bn: ["রিইনফোর্সড কংক্রিট ইন্টারটাইডাল ফ্লোর", "উচ্চ ক্ষমতার গ্যান্ট্রি ক্রেন", "তৈলাক্ত পানি শোধন প্ল্যান্ট", "বিপজ্জনক বর্জ্য পৃথকীকরণ শেড", "জরুরি অগ্নিনির্বাপণ ও উদ্ধার দল"],
  },
  {
    slug: "sn-corporation-unit-1",
    name_en: "SN Corporation (Unit 1)",
    name_bn: "এসএন কর্পোরেশন (ইউনিট ১)",
    owner_company: "ABC Group / SN Corporation",
    address_en: "Shitalpur, Sitakunda, Chattogram, Bangladesh",
    address_bn: "শীতলপুর, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Alhaj Showkat Ali Chowdhury, Partner",
    phone: "+88 01714 087555",
    email: "office@abcgroupbd.com",
    certificate_no: "BSRB/2025/SRF 003",
    facilities_en: ["Concrete secondary cutting floor", "Magnetic scrap handling cranes", "Dedicated chemical storage facility", "Industrial drainage & filtration system"],
    facilities_bn: ["কংক্রিট সেকেন্ডারি কাটিং ফ্লোর", "চৌম্বকীয় স্ক্র্যাপ পরিবহন ক্রেন", "নির্দিষ্ট রাসায়নিক সংরক্ষণাগার", "শিল্প নিষ্কাশন ও ফিল্টারিং ব্যবস্থা"],
  },
  {
    slug: "kr-ship-recycling-yard",
    name_en: "KR Ship Recycling Yard",
    name_bn: "কেআর শিপ রিসাইক্লিং ইয়ার্ড",
    owner_company: "KR Group",
    address_en: "Kazi Para, Kumira, Sitakunda, Chattogram, Bangladesh",
    address_bn: "কাজী পাড়া, কুমিরা, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Mr. Md. Taslim Uddin, Proprietor",
    phone: "+88 01730 328570",
    email: "taslim_iiuc@yahoo.com",
    certificate_no: "BSRB/2025/SRF 004",
    facilities_en: ["Impermeable paved primary pad", "Mobile-crawler cranes", "Asbestos abatement decontamination zone", "Stormwater catchment sump"],
    facilities_bn: ["পাকা প্রাইমারি প্যাড", "মোবাইল ক্রলার ক্রেন", "অ্যাসবেস্টস অপসারণ ও ডিকনটামিনেশন জোন", "বৃষ্টির পানি পরিশোধন রিজার্ভার"],
  },
  {
    slug: "arab-ship-breaking-recycling",
    name_en: "Arab Ship Breaking & Recycling Ltd",
    name_bn: "আরব শিপ ব্রেকিং অ্যান্ড রিসাইক্লিং লিমিটেড",
    address_en: "South Sitalpur, Sitakunda, Chattogram, Bangladesh",
    address_bn: "দক্ষিণ শীতলপুর, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Mr. Md. Nur Uddin, Partner",
    phone: "+88 01612 232015",
    email: "fourstarshipbreaking@yahoo.com",
    certificate_no: "BSRB/2025/SRF 005",
    facilities_en: ["Concrete work floor with oil-water separator", "Heavy winch & hauling system", "Hazardous substances warehouse"],
    facilities_bn: ["অয়েল-ওয়াটার সেপারেটরযুক্ত কংক্রিট ওয়ার্ক ফ্লোর", "ভারী উইঞ্চ ও টানা ব্যবস্থা", "বিপজ্জনক পদার্থ গুদাম"],
  },
  {
    slug: "hm-shipping-lines",
    name_en: "HM Shipping Lines Ltd",
    name_bn: "এইচএম শিপিং লাইনস লিমিটেড",
    owner_company: "Mostafa Hakim Group",
    address_en: "Shitalpur, Sitakunda, Chattogram, Bangladesh",
    address_bn: "শীতলপুর, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Mr. Md. Sarwar Alam, Managing Director",
    phone: "+88 01819 835380",
    email: "info@mostafahakim.com",
    certificate_no: "BSRB/2025/SRF 006",
    facilities_en: ["Paved secondary cutting yard", "Tower crane & heavy excavators", "IHM verification laboratory & storage"],
    facilities_bn: ["পাকা সেকেন্ডারি কাটিং ইয়ার্ড", "টাওয়ার ক্রেন ও ভারী এক্সকাভেটর", "আইএইচএম পরীক্ষণ ল্যাব ও সংরক্ষণাগার"],
  },
  {
    slug: "sn-corporation-unit-2",
    name_en: "SN Corporation (Unit 2)",
    name_bn: "এসএন কর্পোরেশন (ইউনিট ২)",
    owner_company: "ABC Group / SN Corporation",
    address_en: "Lalbeg, Bhatiary, Sitakunda, Chattogram, Bangladesh",
    address_bn: "লালবেগ, ভাটিয়ারী, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Alhaj Showkat Ali Chowdhury, Partner",
    phone: "+88 01714 087555",
    email: "office@abcgroupbd.com",
    certificate_no: "BSRB/2025/SRF 007",
    facilities_en: ["Sealed concrete cutting slabs", "Crawler cranes and winches", "Wastewater runoff treatment unit"],
    facilities_bn: ["সিল্ড কংক্রিট কাটিং স্ল্যাব", "ক্রলার ক্রেন ও উইঞ্চ", "বর্জ্যপানি শোধন ইউনিট"],
  },
  {
    slug: "sn-corporation-unit-3",
    name_en: "SN Corporation (Unit 3)",
    name_bn: "এসএন কর্পোরেশন (ইউনিট ৩)",
    owner_company: "ABC Group / SN Corporation",
    address_en: "Madambibirhat, Bhatiary, Sitakunda, Chattogram, Bangladesh",
    address_bn: "মাদামবিবিরহাট, ভাটিয়ারী, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Alhaj Showkat Ali Chowdhury, Partner",
    phone: "+88 01714 087555",
    email: "office@abcgroupbd.com",
    certificate_no: "BSRB/2025/SRF 008",
    facilities_en: ["Engineered stormwater drainage", "Hydraulic shears & lifting cranes", "Enclosed hazardous materials facility"],
    facilities_bn: ["আধুনিক নিষ্কাশন ব্যবস্থা", "হাইড্রোলিক কাটার ও উত্তোলন ক্রেন", "বদ্ধ বিপজ্জনক উপকরণ সংরক্ষণাগার"],
  },
  {
    slug: "ferdous-steel-ship-recycling",
    name_en: "Ferdous Steel Ship Recycling Industries (Ziri Subedar)",
    name_bn: "ফেরদৌস স্টিল শিপ রিসাইক্লিং ইন্ডাস্ট্রিজ (জিরি সুবেদার)",
    owner_company: "Ziri Subedar Group",
    address_en: "No. 9, Bhatiary, Sitakunda, Chattogram, Bangladesh",
    address_bn: "নং ৯, ভাটিয়ারী, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Mr. Md. Ferdous Wahid, Partner",
    phone: "+88 01828 771144",
    email: "zirisubader.bd@gmail.com",
    certificate_no: "BSRB/2025/SRF 009",
    facilities_en: ["HKC-compliant concrete cutting pad", "Advanced bilge water filtration unit", "Worker PPE & emergency medical bay"],
    facilities_bn: ["এইচকেসি মানসম্পন্ন কংক্রিট কাটিং প্যাড", "উন্নত বিলজ পানি ফিল্টারিং ইউনিট", "শ্রমিক সুরক্ষা ও জরুরি চিকিৎসাকেন্দ্র"],
  },
  {
    slug: "nb-steel",
    name_en: "NB Steel",
    name_bn: "এনবি স্টিল",
    address_en: "North Salimpur, Jafrabad, Sitakunda, Chattogram, Bangladesh",
    address_bn: "উত্তর সলিমপুর, জাফরবাদ, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Mr. Md. Taslim Uddin, Proprietor",
    phone: "+88 01730 328570",
    email: "taslim_iiuc@yahoo.com",
    certificate_no: "BSRB/2025/SRF 010",
    facilities_en: ["Sealed concrete cutting yard", "Crawler cranes with magnetic grabbers", "Secondary toxic materials isolation shed"],
    facilities_bn: ["সিল্ড কংক্রিট কাটিং ইয়ার্ড", "চৌম্বকীয় ক্রলার ক্রেন", "বিষাক্ত উপকরণ আইসোলেশন এলাকা"],
  },
  {
    slug: "mak-corporation",
    name_en: "MAK Corporation",
    name_bn: "ম্যাক কর্পোরেশন",
    address_en: "North Sonaichari, Bansbaria, Sitakunda, Chattogram, Bangladesh",
    address_bn: "উত্তর সোনাইছড়ি, বাঁশবাড়িয়া, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Master Abul Kashem, Managing Partner",
    phone: "+88 01711 761712",
    email: "makcorporation@ymail.com",
    certificate_no: "BSRB/2025/SRF 011",
    facilities_en: ["Impermeable secondary floor", "High capacity winches", "Spill response kits & containment booms"],
    facilities_bn: ["অপ্রবেশ্য সেকেন্ডারি ফ্লোর", "উচ্চ ক্ষমতার উইঞ্চ", "তেল প্রতিরোধক বুম ও জরুরি কিট"],
  },
  {
    slug: "kr-steel",
    name_en: "KR Steel Ltd",
    name_bn: "কেআর স্টিল লিমিটেড",
    address_en: "Kumira, Sitakunda, Chattogram, Bangladesh",
    address_bn: "কুমিরা, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Mr. Md. Sekander Hossain, Chairman",
    phone: "+88 01730 201489",
    email: "krsteel_bd@yahoo.com",
    certificate_no: "BSRB/2025/SRF 012",
    facilities_en: ["Concrete dismantling floor", "Crawler cranes & plasma torches", "Worker safety training facility"],
    facilities_bn: ["কংক্রিট ভাঙার ফ্লোর", "ক্রলার ক্রেন ও প্লাজমা টর্চ", "শ্রমিক নিরাপত্তা প্রশিক্ষণ কেন্দ্র"],
  },
  {
    slug: "jamuna-ship-breakers",
    name_en: "Jamuna Ship Breakers",
    name_bn: "যমুনা শিপ ব্রেকার্স",
    address_en: "Sitalpur, Sitakunda, Chattogram, Bangladesh",
    address_bn: "শীতলপুর, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Md. Liakat Ali Chowdhury",
    phone: "+88 01711 721177",
    email: "hr.jamunayard@gmail.com",
    certificate_no: "BSRB/2025/SRF 013",
    facilities_en: ["Reinforced concrete intertidal pad", "Industrial wastewater settling tanks", "PPE locker and wash stations"],
    facilities_bn: ["রিইনফোর্সড কংক্রিট প্যাড", "শিল্প বর্জ্যপানি সেডিমেন্টেশন ট্যাংক", "পিপিই লকার ও ধৌতকরণ স্টেশন"],
  },
  {
    slug: "janata-steel",
    name_en: "Janata Steel Limited",
    name_bn: "জনতা স্টিল লিমিটেড",
    address_en: "Joramtal, Kumira, Sitakunda, Chattogram, Bangladesh",
    address_bn: "জোড়ামতল, কুমিরা, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Mr. Hossainul Arefin, Director",
    phone: "+88 01772 783533",
    email: "arefinenterprise@gmail.com",
    certificate_no: "BSRB/2025/SRF 014",
    facilities_en: ["Sealed concrete cutting slabs", "High-tonnage mobile cranes", "Hazardous materials isolation storage"],
    facilities_bn: ["সিল্ড কংক্রিট স্ল্যাব", "উচ্চ টনেজ মোবাইল ক্রেন", "বিপজ্জনক বর্জ্য পৃথকীকরণ গুদাম"],
  },
  {
    slug: "taher-and-company",
    name_en: "Taher & Company Ltd",
    name_bn: "তাহের অ্যান্ড কোম্পানি লিমিটেড",
    owner_company: "Taher Group",
    address_en: "Sitalpur, Sitakund, Chattogram, Bangladesh",
    address_bn: "শীতলপুর, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Mr. Md. Shahin Alam Tipu, Director",
    phone: "+88 01819 328962",
    email: "m.shahin_alam@yahoo.com",
    certificate_no: "BSRB/2025/SRF 015",
    facilities_en: ["Concrete secondary floor with drainage", "Crawler crane fleet", "Worker training hall & medical room"],
    facilities_bn: ["ড্রেনেজসহ কংক্রিট সেকেন্ডারি ফ্লোর", "ক্রলার ক্রেন বহর", "শ্রমিক প্রশিক্ষণ হল ও মেডিকেল রুম"],
  },
  {
    slug: "bob-recyclers",
    name_en: "Bob Recyclers",
    name_bn: "বব রিসাইক্লার্স",
    address_en: "Middle Sonaichari, Sitalpur, Sitakunda, Chattogram, Bangladesh",
    address_bn: "মধ্য সোনাইছড়ি, শীতলপুর, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "S M Nurun Nabi",
    phone: "+88 01780 066666",
    email: "bobrecyclers23@gmail.com",
    certificate_no: "BSRB/2025/SRF 016",
    facilities_en: ["Impermeable concrete work pad", "Heavy scrap processing equipment", "Oil-water separator basins"],
    facilities_bn: ["অপ্রবেশ্য কংক্রিট প্যাড", "ভারী স্ক্র্যাপ প্রক্রিয়াকরণ যন্ত্রপাতি", "অয়েল-ওয়াটার সেপারেটর বেসিন"],
  },
  {
    slug: "asadi-steel-enterprise",
    name_en: "Asadi Steel Enterprise",
    name_bn: "আসাদী স্টিল এন্টারপ্রাইজ",
    address_en: "Bhatiary, Sitakunda, Chattogram, Bangladesh",
    address_bn: "ভাটিয়ারী, সীতাকুণ্ড, চট্টগ্রাম, বাংলাদেশ",
    contact_person: "Ubaida Asadi, Partner",
    phone: "+88 01301 018538",
    email: "asadisteel06@gmail.com",
    certificate_no: "BSRB/2025/SRF 017",
    facilities_en: ["HKC certified concrete work floor", "Mobile cranes and winches", "Dedicated toxic waste containment"],
    facilities_bn: ["এইচকেসি সার্টিফাইড কংক্রিট ফ্লোর", "মোবাইল ক্রেন ও উইঞ্চ", "নির্ধারিত বিষাক্ত বর্জ্য সংরক্ষণাগার"],
  },
];

const yardPhotos: Record<string, { cover: string; gallery: string[] }> = {
  "php-ship-breaking-recycling": {
    cover: PHOTOS.imoGreenYard.src,
    gallery: [PHOTOS.imoGreenYard.src, PHOTOS.imoGreenRecyclingSustainable.src, PHOTOS.bulkCarrier.src],
  },
  "kabir-steel": {
    cover: PHOTOS.ksrmVisit.src,
    gallery: [PHOTOS.ksrmVisit.src, PHOTOS.cranes.src, PHOTOS.yard.src],
  },
  "sn-corporation-unit-1": {
    cover: PHOTOS.bulkCarrier.src,
    gallery: [PHOTOS.bulkCarrier.src, PHOTOS.yard.src, PHOTOS.beachedBow.src],
  },
  "kr-ship-recycling-yard": {
    cover: PHOTOS.imoGreenRecyclingSustainable.src,
    gallery: [PHOTOS.imoGreenRecyclingSustainable.src, PHOTOS.cranes.src, PHOTOS.bhatiaryGasCutting.src],
  },
  "arab-ship-breaking-recycling": {
    cover: PHOTOS.cranes.src,
    gallery: [PHOTOS.cranes.src, PHOTOS.bulkCarrier.src, PHOTOS.sunset.src],
  },
  "hm-shipping-lines": {
    cover: PHOTOS.chittagongDemolitionYard.src,
    gallery: [PHOTOS.chittagongDemolitionYard.src, PHOTOS.shipbreakingBangladeshYard.src, PHOTOS.beachedBow.src],
  },
  "sn-corporation-unit-2": {
    cover: PHOTOS.yard.src,
    gallery: [PHOTOS.yard.src, PHOTOS.bulkCarrier.src, PHOTOS.jafrabadShipbreaking1.src],
  },
  "sn-corporation-unit-3": {
    cover: PHOTOS.beachedBow.src,
    gallery: [PHOTOS.beachedBow.src, PHOTOS.jafrabadShipbreaking5.src, PHOTOS.cranes.src],
  },
  "ferdous-steel-ship-recycling": {
    cover: PHOTOS.ziriSubedarInspection1.src,
    gallery: [PHOTOS.ziriSubedarInspection1.src, PHOTOS.ziriSubedarInspection2.src, PHOTOS.bhatiaryGasCutting.src],
  },
  "nb-steel": {
    cover: PHOTOS.jafrabadShipbreaking1.src,
    gallery: [PHOTOS.jafrabadShipbreaking1.src, PHOTOS.jafrabadShipbreaking5.src, PHOTOS.yard.src],
  },
  "mak-corporation": {
    cover: PHOTOS.bhatiaryGasCutting.src,
    gallery: [PHOTOS.bhatiaryGasCutting.src, PHOTOS.cranes.src, PHOTOS.sunset.src],
  },
  "kr-steel": {
    cover: PHOTOS.jafrabadShipbreaking5.src,
    gallery: [PHOTOS.jafrabadShipbreaking5.src, PHOTOS.imoGreenRecyclingSustainable.src, PHOTOS.yard.src],
  },
  "jamuna-ship-breakers": {
    cover: PHOTOS.shipbreakingBangladeshYard.src,
    gallery: [PHOTOS.shipbreakingBangladeshYard.src, PHOTOS.beachedBow.src, PHOTOS.cranes.src],
  },
  "janata-steel": {
    cover: PHOTOS.ziriSubedarInspection2.src,
    gallery: [PHOTOS.ziriSubedarInspection2.src, PHOTOS.ziriSubedarInspection1.src, PHOTOS.bhatiaryGasCutting.src],
  },
  "taher-and-company": {
    cover: PHOTOS.sunset.src,
    gallery: [PHOTOS.sunset.src, PHOTOS.cranes.src, PHOTOS.beachedBow.src],
  },
  "bob-recyclers": {
    cover: PHOTOS.bowMonochrome.src,
    gallery: [PHOTOS.bowMonochrome.src, PHOTOS.yard.src, PHOTOS.chittagongDemolitionYard.src],
  },
  "asadi-steel-enterprise": {
    cover: PHOTOS.coastAster.src,
    gallery: [PHOTOS.coastAster.src, PHOTOS.imoGreenYard.src, PHOTOS.bulkCarrier.src],
  },
};

export const yards: Yard[] = yardSeeds.map((y, i) => ({
  ...meta(`yard:${y.slug}`),
  slug: y.slug,
  name_en: y.name_en,
  name_bn: y.name_bn,
  status: "green",
  owner_company: y.owner_company ?? null,
  address_en: y.address_en,
  address_bn: y.address_bn,
  latitude: y.lat ?? null,
  longitude: y.lng ?? null,
  contact_person: y.contact_person,
  phone: y.phone,
  email: y.email,
  website: y.website ?? null,
  show_contact: true,
  yard_area_sqm: null,
  capacity_ldt_per_year: null,
  hkc_compliant: true,
  certifying_body: "Bangladesh Ship Recycling Board (BSRB)",
  certificate_no: y.certificate_no,
  certificate_issued_on: "2025-10-30",
  certificate_expires_on: "2030-10-29",
  description_en: `${y.name_en} is an IMO-authorised ship recycling facility under the Hong Kong Convention (DASR: ${y.certificate_no}), located at ${y.address_en}. Its Document of Authorization to Conduct Ship Recycling is issued by the Bangladesh Ship Recycling Board (BSRB) and is valid until 29 October 2030.`,
  description_bn: `${y.name_bn} হংকং কনভেনশনের আওতায় অনুমোদিত একটি জাহাজ পুনর্ব্যবহার স্থাপনা (ডিএএসআর: ${y.certificate_no}), যা ${y.address_bn}-এ অবস্থিত। বাংলাদেশ শিপ রিসাইক্লিং বোর্ডের (বিএসআরবি) দেওয়া এই অনুমোদন ২০৩০ সালের ২৯ অক্টোবর পর্যন্ত কার্যকর।`,
  facilities_en: y.facilities_en ?? [],
  facilities_bn: y.facilities_bn ?? [],
  environmental_en: [
    "Hazardous materials storage and containment according to HKC Regulation 16",
    "Impermeable drainage system preventing oily discharge into marine waters",
  ],
  environmental_bn: [
    "এইচকেসি বিধি ১৬ অনুযায়ী বিপজ্জনক উপকরণ সংরক্ষণ ও ব্যবস্থাপনা",
    "সমুদ্রের পানিতে তেল নিষ্কাশন রোধে অপ্রবেশ্য ড্রেনেজ ব্যবস্থা",
  ],
  safety_en: [
    "Mandatory Personal Protective Equipment (PPE) protocol",
    "Continuous gas-free inspection prior to hot work",
    "On-site trained emergency response team",
  ],
  safety_bn: [
    "বাধ্যতামূলক ব্যক্তিগত সুরক্ষা সরঞ্জাম (পিপিই) নীতি",
    "হট ওয়ার্কের পূর্বে নিয়মিত গ্যাস-মুক্ত নিশ্চিতকরণ পরীক্ষা",
    "ইয়ার্ডে প্রশিক্ষিত জরুরি উদ্ধার ও অগ্নিনির্বাপণ দল",
  ],
  waste_en: [
    "Asbestos, PCB and heavy metals segregation and documented safe disposal",
    "Bilge water and oil sludge treatment",
  ],
  waste_bn: [
    "অ্যাসবেস্টস, পিসিবি এবং ভারী ধাতু পৃথকীকরণ ও নিয়ন্ত্রিত নিষ্কাশন",
    "বিলজ পানি এবং তেলের বর্জ্য শোধন",
  ],
  cover_image: yardPhotos[y.slug]?.cover ?? PHOTOS.bulkCarrier.src,
  gallery: yardPhotos[y.slug]?.gallery ?? [PHOTOS.bulkCarrier.src],
  sort_order: i + 1,
  is_published: true,
}));

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
      const name = vesselNames[n % vesselNames.length];
      rows.push({
        ...meta(`vessel:${n}`),
        yard_id: null,
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
// Year-wise statistics
// Ships dismantled in Bangladesh per year, from the NGO Shipbreaking Platform's
// annual lists as reported by The Daily Star (5 Feb 2025) and The Financial
// Express (25 Feb 2026). World totals only for years where the Platform's total
// was confirmed; global share = Bangladesh ÷ world. Green yards: 7 certified as
// reported in February 2025. Other measures are left blank until BSBRA
// publishes official figures (Admin → Industry statistics).
// ---------------------------------------------------------------------------
const statSeeds: { year: number; ships: number; world?: number; green?: number }[] = [
  { year: 2018, ships: 185, world: 744 },
  { year: 2019, ships: 236, world: 674 },
  { year: 2020, ships: 144 },
  { year: 2021, ships: 254 },
  { year: 2022, ships: 122 },
  { year: 2023, ships: 170 },
  { year: 2024, ships: 130, world: 409 },
  { year: 2025, ships: 88, world: 321, green: 7 },
];

export const industryStatistics: IndustryStatistic[] = statSeeds.map(({ year, ships, world, green }) => ({
  ...meta(`stat:${year}`),
  year,
  vessels_recycled: ships,
  vessels_beached: null,
  total_ldt: null,
  active_yards: null,
  green_yards: green ?? null,
  steel_output_tonnes: null,
  workers_employed: null,
  global_share_percent: world ? Math.round((ships / world) * 1000) / 10 : null,
  notes_en: world ? `${ships} of ${world} ships dismantled worldwide.` : null,
  notes_bn: null,
  source: "NGO Shipbreaking Platform annual list (via The Daily Star / The Financial Express)",
  is_published: true,
}));

/** Labour figures are published by BSBRA; none are bundled. */
export const labourStatistics: LabourStatistic[] = [];

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

/** Elected 4 July 2026 (The Daily Star, 5 Jul 2026; Times of Bangladesh, 4 Jul 2026). Spellings follow the press. */
export const committeeMembers: CommitteeMember[] = [
  committee("president", {
    name_en: "Mohammad Mohsin Chowdhury",
    name_bn: "মোহাম্মদ মহসিন চৌধুরী",
    designation_en: "President",
    designation_bn: "সভাপতি",
    organization_en: "Vice Chairman, PHP Family",
    organization_bn: "ভাইস চেয়ারম্যান, পিএইচপি ফ্যামিলি",
    photo: PHOTOS.mohammedMohsinChowdhury.src,
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
    name_en: "Md Nuruddin Rubel",
    name_bn: "মো. নুরুদ্দিন রুবেল",
    designation_en: "Vice President",
    designation_bn: "সহ-সভাপতি",
    sort_order: 3,
  }),
  committee("vp-2", {
    name_en: "Gazi Mokarram Ali Chowdhury",
    name_bn: "গাজী মোকাররম আলী চৌধুরী",
    designation_en: "Vice President",
    designation_bn: "সহ-সভাপতি",
    sort_order: 4,
  }),
  committee("senior-advisor", {
    name_en: "Alhaj Showkat Ali Chowdhury",
    name_bn: "আলহাজ্ব শওকত আলী চৌধুরী",
    designation_en: "Senior Advisor",
    designation_bn: "সিনিয়র উপদেষ্টা",
    organization_en: "Managing Partner, SN Corporation / Chairman, EBL",
    organization_bn: "ব্যবস্থাপনা অংশীদার, এসএন কর্পোরেশন / চেয়ারম্যান, ইবিএল",
    category: "advisor",
    photo: PHOTOS.showkatAliChowdhury.src,
    sort_order: 5,
  }),
  ...[
    ["jahedul-haque", "Md Jahedul Haque", "মো. জাহেদুল হক"],
    ["taslim-uddin", "Md Taslim Uddin", "মো. তাসলিম উদ্দিন"],
    ["nurun-nabi", "SM Nurun Nabi", "এস এম নুরুন নবী"],
    ["ferdous-wahid", "Md Ferdous Wahid", "মো. ফেরদৌস ওয়াহিদ"],
    ["obaida-asadi", "Obaida Asadi", "ওবায়দা আসাদী"],
    ["hosainul-arefin", "Hosainul Arefin", "হোসাইনুল আরেফিন"],
    ["saifullah-sayeed", "AKM Saifullah Sayeed", "একেএম সাইফুল্লাহ সাঈদ"],
  ].map(([key, name_en, name_bn], i) =>
    committee(key, {
      name_en,
      name_bn,
      designation_en: "Executive Member",
      designation_bn: "কার্যনির্বাহী সদস্য",
      category: "member",
      sort_order: 10 + i,
    }),
  ),
];

export const pastPresidents: PastPresident[] = [
  {
    ...meta("past_president:zahirul-islam"),
    name_en: "Mohammed Zahirul Islam (Rinku)",
    name_bn: "মোহাম্মদ জহিরুল ইসলাম (রিংকু)",
    term_start: 2025,
    term_end: 2026,
    organization_en: "Managing Director, PHP Ship Breaking and Recycling Industries Ltd",
    organization_bn: "ব্যবস্থাপনা পরিচালক, পিএইচপি শিপ ব্রেকিং অ্যান্ড রিসাইক্লিং ইন্ডাস্ট্রিজ লিমিটেড",
    photo: PHOTOS.mohammedZahirulIslam.src,
    bio_en: "Served as Acting President and long-standing Vice President of BSBRA. Spearheaded Bangladesh's green recycling revolution, achieving the nation's first HKC Statement of Compliance in 2017.",
    bio_bn: "বিএসবিআরএ-এর ভারপ্রাপ্ত সভাপতি ও দীর্ঘকালীন সহ-সভাপতি হিসেবে দায়িত্ব পালন করেন। ২০১৭ সালে দেশের প্রথম এইচকেসি স্টেটমেন্ট অব কমপ্লায়েন্স অর্জনকারী গ্রিন ইয়ার্ড প্রতিষ্ঠা করেন।",
    email: "zahir@phpfamily.com",
    show_contact: false,
    sort_order: 1,
    is_published: true,
  },
  {
    ...meta("past_president:abu-taher"),
    name_en: "Alhaj Mohammad Abu Taher",
    name_bn: "আলহাজ্ব মোহাম্মদ আবু তাহের",
    term_start: 2014,
    term_end: 2024,
    organization_en: "Chairman, Taher Group / Taher & Company Ltd",
    organization_bn: "চেয়ারম্যান, তাহের গ্রুপ / তাহের অ্যান্ড কোম্পানি লিমিটেড",
    photo: PHOTOS.alhajMohammadAbuTaher.src,
    bio_en: "Long-standing President of BSBRA across consecutive terms. Represented the domestic ship recycling industry before the Ministry of Industries, IMO, and international maritime delegations.",
    bio_bn: "বিএসবিআরএ-এর দীর্ঘকালীন সভাপতি যিনি টানা একাধিক মেয়াদে দায়িত্ব পালন করেন। শিল্প মন্ত্রণালয়, আইএমও ও আন্তর্জাতিক প্রতিনিধিদের সামনে দেশীয় শিল্পের স্বার্থ তুলে ধরেন।",
    email: null,
    show_contact: false,
    sort_order: 2,
    is_published: true,
  },
  {
    ...meta("past_president:hefazatur-rahman"),
    name_en: "Hefazatur Rahman",
    name_bn: "হেফাজতুর রহমান",
    term_start: 2011,
    term_end: 2014,
    organization_en: "Chairman, Mostafa Hakim Group / HM Shipping Lines Ltd",
    organization_bn: "চেয়ারম্যান, মোস্তফা হাকিম গ্রুপ / এইচএম শিপিং লাইনস লিমিটেড",
    photo: null,
    bio_en: "Elected President of the association from 2011 to 2014, leading institutional engagement for occupational health, environmental clearance frameworks, and worker welfare.",
    bio_bn: "২০১১ থেকে ২০১৪ মেয়াদের নির্বাচিত সভাপতি, যিনি শ্রমিকের পেশাগত স্বাস্থ্য ও পরিবেশগত ছাড়পত্র কাঠামো তৈরিতে বলিষ্ঠ ভূমিকা পালন করেন।",
    email: null,
    show_contact: false,
    sort_order: 3,
    is_published: true,
  },
  {
    ...meta("past_president:amzad-hossain"),
    name_en: "Amzad Hossain Chowdhury",
    name_bn: "আমজাদ হোসেন চৌধুরী",
    term_start: 2008,
    term_end: 2011,
    organization_en: "Former President, Bangladesh Ship Breakers Association",
    organization_bn: "সাবেক সভাপতি, বাংলাদেশ শিপ ব্রেকার্স অ্যাসোসিয়েশন",
    photo: null,
    bio_en: "Veteran industrialist and former President of the association during the formative transition toward regulated coastal ship dismantling.",
    bio_bn: "প্রবীণ শিল্পপতি এবং উপকূলীয় নিয়মতান্ত্রিক জাহাজভাঙা কার্যক্রমের সূচনালগ্নে সংগঠনের সভাপতি।",
    email: null,
    show_contact: false,
    sort_order: 4,
    is_published: true,
  },
  {
    ...meta("past_president:shahjahan"),
    name_en: "Alhaj Md. Shahjahan",
    name_bn: "আলহাজ্ব মো. শাহজাহান",
    term_start: 2004,
    term_end: 2008,
    organization_en: "Chairman & Managing Director, Kabir Steel Ltd (KSRM)",
    organization_bn: "চেয়ারম্যান ও ব্যবস্থাপনা পরিচালক, কবির স্টিল লিমিটেড (কেএসআরএম)",
    photo: PHOTOS.alhajMdShahjahan.src,
    bio_en: "Eminent maritime industrialist and pioneer of modern steel re-rolling and compliant ship recycling facilities in Chattogram.",
    bio_bn: "বিশিষ্ট শিল্পপতি এবং চট্টগ্রামে আধুনিক রি-রোলিং মিলস ও আধুনিক জাহাজ পুনর্ব্যবহার স্থাপনার পথপ্রদর্শক।",
    email: "karim@ksrm.com.bd",
    show_contact: false,
    sort_order: 5,
    is_published: true,
  },
];

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
    slug: "bsrb-inspects-ziri-subedar-yard",
    type: "activity",
    published_at: "2026-07-28T04:35:49.000Z",
    is_featured: true,
    cover_image: PHOTOS.ziriSubedarInspection1.src,
    event_date: "2026-07-28T03:30:00.000Z",
    event_location_en: "Ziri Subedar Ship Recycling Yard, Bhatiyari, Sitakunda",
    event_location_bn: "জিরি সুবেদার শিপ রিসাইক্লিং ইয়ার্ড, ভাটিয়ারী, সীতাকুণ্ড",
    title_en: "BSRB Technical Team inspects Ziri Subedar Yard for HKC compliance",
    title_bn: "এইচকেসি কমপ্লায়েন্স যাচাইয়ে জিরি সুবেদার ইয়ার্ড পরিদর্শন করল বিএসআরবি টেকনিক্যাল টিম",
    excerpt_en:
      "A technical team from the Bangladesh Ship Recycling Board conducted an on-site verification of yard development, impermeable concrete flooring, and drainage in Sitakunda.",
    excerpt_bn:
      "বাংলাদেশ শিপ রিসাইক্লিং বোর্ডের কারিগরি প্রতিনিধিদল জিরি সুবেদার ইয়ার্ডের অবকাঠামোগত উন্নয়ন, ড্রেনেজ ও কমপ্লায়েন্স মান যাচাই করেছে।",
    body_en: `The Technical Team of the Bangladesh Ship Recycling Board (BSRB) inspected the Ziri Subedar Ship Recycling Facility (Ferdous Steel Ship Recycling Industries, DASR: BSRB/2025/SRF 009) in Bhatiyari, Sitakunda.

The on-site inspection evaluated required yard development verification in compliance with the Hong Kong Convention (HKC), including:
- Impermeable concrete primary and secondary work floors.
- Stormwater drainage and oil-water separation systems preventing seaward runoff.
- Dedicated hazardous waste isolation shed and chemical storage.
- Personal protective equipment (PPE) compliance and worker emergency response readiness.`,
    body_bn: `বাংলাদেশ শিপ রিসাইক্লিং বোর্ডের (বিএসআরবি) কারিগরি দল সীতাকুণ্ডের ভাটিয়ারীতে অবস্থিত জিরি সুবেদার শিপ রিসাইক্লিং ফ্যাসিলিটি (ফেরদৌস স্টিল শিপ রিসাইক্লিং ইন্ডাস্ট্রিজ, ডিএএসআর: BSRB/2025/SRF 009) সরেজমিনে পরিদর্শন করেছে।

পরিদর্শনে হংকং কনভেনশন (এইচকেসি) অনুযায়ী প্রয়োজনীয় ইয়ার্ড উন্নয়ন যাচাই করা হয়:
- অপ্রবেশ্য কংক্রিটের প্রাইমারি ও সেকেন্ডারি ওয়ার্ক ফ্লোর।
- সমুদ্রের পানিতে তেল মিশ্রণ রোধে ড্রেনেজ ও অয়েল-ওয়াটার সেপারেটর ব্যবস্থা।
- নির্ধারিত বিপজ্জনক বর্জ্য আইসোলেশন শেড ও রাসায়নিক সংরক্ষণাগার।
- বাধ্যতামূলক ব্যক্তিগত সুরক্ষা সরঞ্জাম (পিপিই) এবং জরুরি উদ্ধার প্রস্তুতি।`,
    source_name: "Bangladesh Ship Recycling Board (BSRB)",
    external_url: "https://bsrb.gov.bd/director-general-of-bsrb-visits-bitac-with-jica-team-to-explore-hands-on-ship-recycling-training-copy/",
  }),
  post({
    slug: "bsrb-jica-training-center-feasibility",
    type: "activity",
    published_at: "2026-07-26T11:56:48.000Z",
    is_featured: true,
    cover_image: PHOTOS.bsrbJicaTraining.src,
    event_date: "2026-07-26T04:00:00.000Z",
    event_location_en: "BITAC, Chattogram",
    event_location_bn: "বিটাক, চট্টগ্রাম",
    title_en: "BSRB Director General and JICA team explore hands-on training center at BITAC",
    title_bn: "হাতে-কলমে প্রশিক্ষণ কেন্দ্র প্রতিষ্ঠায় জাইকা টিম নিয়ে বিটাক পরিদর্শন করলেন বিএসআরবি মহাপরিচালক",
    excerpt_en:
      "BSRB Director General ASM Shafiul Alam Talukder and the JICA Team led by Dr. Akira Okamoto conducted a feasibility study at BITAC Chattogram to establish a ship recycling training facility.",
    excerpt_bn:
      "জাহাজ পুনর্ব্যবহার শিল্পের কর্মীদের জন্য প্রশিক্ষণ কেন্দ্র গড়ে তুলতে বিএসআরবি মহাপরিচালক ও জাইকা টিম বিটাক চট্টগ্রাম পরিদর্শন করেছে।",
    body_en: `Bangladesh Ship Recycling Board (BSRB) Director General Mr. ASM Shafiul Alam Talukder visited the Bangladesh Industrial Technical Assistance Centre (BITAC), Chattogram, together with the JICA Team led by Dr. Akira Okamoto, as part of a feasibility study to establish a Hands-on Training Centre for the Ship Recycling Industry.

The visit focused on assessing BITAC's technical capabilities and exploring opportunities to develop a modern training facility that will strengthen the skills of Bangladesh's ship recycling workforce. This initiative aims to enhance occupational safety, technical excellence, environmental compliance, and support the implementation of international standards under the Hong Kong Convention (HKC).`,
    body_bn: `বাংলাদেশ শিপ রিসাইক্লিং বোর্ডের (বিএসআরবি) মহাপরিচালক জনাব এএসএম শফিউল আলম তালুকদার জাইকা দলের প্রধান ড. আকিরা ওকামতো-কে সাথে নিয়ে বাংলাদেশ শিল্প কারিগরি সহায়তা কেন্দ্র (বিটাক) চট্টগ্রাম পরিদর্শন করেন।

এ পরিদর্শনের লক্ষ্য ছিল জাহাজ পুনর্ব্যবহার শিল্পের কর্মীদের জন্য একটি আধুনিক ব্যবহারিক প্রশিক্ষণ কেন্দ্র গড়ে তোলার কারিগরি সক্ষমতা মূল্যায়ন করা, যা হংকং কনভেনশন বাস্তবায়নে পেশাগত সুরক্ষা, প্রযুক্তিগত মান এবং পরিবেশগত কমপ্লায়েন্স জোরদার করবে।`,
    source_name: "Bangladesh Ship Recycling Board (BSRB)",
    external_url: "https://bsrb.gov.bd/director-general-of-bsrb-visits-bitac-with-jica-team-to-explore-hands-on-ship-recycling-training/",
  }),
  post({
    slug: "bsrb-chattogram-office-fully-operational",
    type: "announcement",
    published_at: "2026-07-26T11:54:28.000Z",
    cover_image: PHOTOS.bsrbOffice.src,
    title_en: "Bangladesh Ship Recycling Board office in Chattogram is fully operational",
    title_bn: "চট্টগ্রামে বাংলাদেশ শিপ রিসাইক্লিং বোর্ডের পূর্ণাঙ্গ কার্যালয় চালু",
    excerpt_en:
      "Located at Level-8 of the Divisional BSTI Building in Agrabad, the BSRB office provides dedicated on-the-ground administration for Sitakunda yards.",
    excerpt_bn:
      "আগ্রাবাদের বিভাগীয় বিএসটিআই ভবনের ৮ম তলায় বিএসআরবির চট্টগ্রাম কার্যালয় এখন পূর্ণাঙ্গভাবে কার্যকর।",
    body_en: `The Bangladesh Ship Recycling Board (BSRB) is now fully operational from its regional headquarters in Chattogram, situated at Level-8, Divisional Building (BSTI), Agrabad, Chattogram-4100.

As the statutory national regulatory authority under the Ministry of Industries, BSRB oversees:
- Ensuring full compliance with the Hong Kong International Convention (HKC).
- Document of Authorization to Conduct Ship Recycling (DASR) verifications.
- Enhancing worker health, safety standards, and PPE compliance.
- Transparent coordination between ship recyclers, ministries, and international partners.`,
    body_bn: `চট্টগ্রামের আগ্রাবাদে বিভাগীয় বিএসটিআই ভবনের ৮ম তলায় বাংলাদেশ শিপ রিসাইক্লিং বোর্ড (বিএসআরবি) তাদের পূর্ণাঙ্গ কার্যক্রম পরিচালনা করছে।

শিল্প মন্ত্রণালয়ের অধীন সংবিধিবদ্ধ নিয়ন্ত্রক সংস্থা হিসেবে বিএসআরবি নিশ্চিত করছে:
- হংকং আন্তর্জাতিক কনভেনশন (এইচকেসি) পূর্ণ বাস্তবায়ন।
- ডিএএসআর অনুমোদন ও নিয়মিত ইয়ার্ড পরিদর্শন।
- শ্রমিক স্বাস্থ্য ও সুরক্ষা মান উন্নয়ন।
- জাহাজ পুনর্ব্যবহারকারী, সরকারি মন্ত্রণালয় ও আন্তর্জাতিক অংশীজনদের মাঝে সমন্বয়।`,
    source_name: "Bangladesh Ship Recycling Board (BSRB)",
    external_url: "https://bsrb.gov.bd/full-functioning-of-bangladesh-ship-recycling-board-office-in-chattogram/",
  }),
  post({
    slug: "bsbra-platform-launch",
    type: "announcement",
    published_at: "2026-10-01T09:00:00.000Z",
    is_featured: true,
    cover_image: PHOTOS.cranes.src,
    title_en: "BSBRA launches its new digital platform",
    title_bn: "বিএসবিআরএ-এর নতুন ডিজিটাল প্ল্যাটফর্ম চালু",
    excerpt_en:
      "Industry statistics, the IMO-listed green yards, live tide forecasts, a vessel database and a members' portal — now in one bilingual platform.",
    excerpt_bn:
      "শিল্প পরিসংখ্যান, আইএমও তালিকাভুক্ত গ্রিন ইয়ার্ড, জোয়ার-ভাটার লাইভ পূর্বাভাস, জাহাজ ডেটাবেস ও সদস্য পোর্টাল — এখন একটি দ্বিভাষিক প্ল্যাটফর্মে।",
    body_en: `BSBRA's new platform brings the Bangladesh ship recycling industry's information together in one place, in English and Bangla.

## What's new
- **Industry statistics** — year-wise ship counts with sources, downloadable as CSV.
- **Green yards** — the 17 Bangladeshi yards on the IMO list of authorised facilities.
- **Tide & beaching** — a live tide and sea-state forecast for the Sitakunda coast, alongside official tables.
- **Vessel database** — a searchable, yard-wise record maintained by the secretariat.
- **Members' portal** — circulars, minutes and resources for members and corporate partners.

Members and partners can request an account from the sign-in page.`,
    body_bn: `বিএসবিআরএ-এর নতুন প্ল্যাটফর্ম বাংলাদেশের জাহাজ পুনর্ব্যবহার শিল্পের তথ্য এক জায়গায়, ইংরেজি ও বাংলায় নিয়ে এসেছে।

## নতুন যা আছে
- **শিল্প পরিসংখ্যান** — উৎসসহ বছরভিত্তিক জাহাজের সংখ্যা, সিএসভি আকারে ডাউনলোডযোগ্য।
- **গ্রিন ইয়ার্ড** — আইএমও-র অনুমোদিত স্থাপনার তালিকাভুক্ত বাংলাদেশের ১৭টি ইয়ার্ড।
- **জোয়ার-ভাটা ও বিচিং** — দাপ্তরিক সারণির পাশাপাশি সীতাকুণ্ড উপকূলের জোয়ার ও সমুদ্র-পরিস্থিতির লাইভ পূর্বাভাস।
- **জাহাজ ডেটাবেস** — সচিবালয় পরিচালিত, ইয়ার্ডভিত্তিক ও অনুসন্ধানযোগ্য রেকর্ড।
- **সদস্য পোর্টাল** — সদস্য ও কর্পোরেট অংশীদারদের জন্য সার্কুলার, কার্যবিবরণী ও রিসোর্স।

সদস্য ও অংশীদাররা সাইন-ইন পৃষ্ঠা থেকে অ্যাকাউন্টের অনুরোধ করতে পারেন।`,
  }),
  post({
    slug: "bsbra-elects-executive-committee-2026-2028",
    type: "activity",
    published_at: "2026-07-05T08:00:00.000Z",
    is_featured: true,
    event_date: "2026-07-04T04:00:00.000Z",
    event_location_en: "Radisson Blu Chattogram Bay View, Chattogram",
    event_location_bn: "র‍্যাডিসন ব্লু চট্টগ্রাম বে ভিউ, চট্টগ্রাম",
    title_en: "BSBRA elects its Executive Committee for 2026–2028",
    title_bn: "২০২৬–২০২৮ মেয়াদের কার্যনির্বাহী কমিটি নির্বাচিত",
    excerpt_en:
      "Mohammad Mohsin Chowdhury was elected President unopposed at the association's election in Chattogram on 4 July 2026.",
    excerpt_bn: "২০২৬ সালের ৪ জুলাই চট্টগ্রামে সংগঠনের নির্বাচনে মোহাম্মদ মহসিন চৌধুরী বিনা প্রতিদ্বন্দ্বিতায় সভাপতি নির্বাচিত হয়েছেন।",
    body_en: `Members of the Bangladesh Ship Breakers & Recyclers Association elected a new Executive Committee on 4 July 2026 at the Radisson Blu Chattogram Bay View. Of 84 eligible voters, 71 cast their ballots; 14 candidates contested 11 executive posts, and the presidency was uncontested.

## Office bearers
- **President:** Mohammad Mohsin Chowdhury, Vice Chairman of PHP Family
- **Senior Vice President:** Mohammad Selim Uddin
- **Vice Presidents:** Md Nuruddin Rubel and Gazi Mokarram Ali Chowdhury

## Executive members
Md Jahedul Haque, Md Taslim Uddin, SM Nurun Nabi, Md Ferdous Wahid, Obaida Asadi, Hosainul Arefin and AKM Saifullah Sayeed.

The election, originally scheduled for October 2025, was held after a new election board was formed.`,
    body_bn: `২০২৬ সালের ৪ জুলাই র‍্যাডিসন ব্লু চট্টগ্রাম বে ভিউতে বাংলাদেশ শিপ ব্রেকার্স অ্যান্ড রিসাইক্লার্স অ্যাসোসিয়েশনের সদস্যরা নতুন কার্যনির্বাহী কমিটি নির্বাচন করেছেন। ৮৪ জন ভোটারের মধ্যে ৭১ জন ভোট দিয়েছেন; ১১টি কার্যনির্বাহী পদে ১৪ জন প্রার্থী ছিলেন, আর সভাপতি পদে কোনো প্রতিদ্বন্দ্বী ছিল না।

## পদাধিকারী
- **সভাপতি:** মোহাম্মদ মহসিন চৌধুরী, ভাইস চেয়ারম্যান, পিএইচপি ফ্যামিলি
- **সিনিয়র সহ-সভাপতি:** মোহাম্মদ সেলিম উদ্দিন
- **সহ-সভাপতি:** মো. নুরুদ্দিন রুবেল ও গাজী মোকাররম আলী চৌধুরী

## কার্যনির্বাহী সদস্য
মো. জাহেদুল হক, মো. তাসলিম উদ্দিন, এস এম নুরুন নবী, মো. ফেরদৌস ওয়াহিদ, ওবায়দা আসাদী, হোসাইনুল আরেফিন ও একেএম সাইফুল্লাহ সাঈদ।

২০২৫ সালের অক্টোবরে নির্ধারিত নির্বাচনটি নতুন নির্বাচন বোর্ড গঠনের পর অনুষ্ঠিত হয়।`,
  }),
  post({
    slug: "seventeen-yards-on-imo-list",
    type: "industry_update",
    published_at: "2026-05-18T03:00:00.000Z",
    is_featured: true,
    cover_image: PHOTOS.imoGreenYard.src,
    title_en: "17 Bangladeshi yards join the IMO list of authorised recycling facilities",
    title_bn: "আইএমও-র অনুমোদিত পুনর্ব্যবহার স্থাপনার তালিকায় বাংলাদেশের ১৭টি ইয়ার্ড",
    excerpt_en:
      "With 17 yards in Sitakunda listed under the Hong Kong Convention, Bangladesh has the second-largest number of authorised facilities in the world.",
    excerpt_bn:
      "হংকং কনভেনশনের আওতায় সীতাকুণ্ডের ১৭টি ইয়ার্ড তালিকাভুক্ত হওয়ায় অনুমোদিত স্থাপনার সংখ্যায় বাংলাদেশ এখন বিশ্বে দ্বিতীয়।",
    body_en: `Seventeen ship recycling yards in Sitakunda, Chattogram, are now on the International Maritime Organization's list of facilities authorised under the Hong Kong Convention. Their authorisations, issued by the Bangladesh Ship Recycling Board, are valid until 29 October 2030.

Only Turkey, with 18, has more listed facilities. Bangladesh was among the first countries to submit a list of compliant yards to the IMO after the convention entered into force.

See all 17 yards on the Green Yards page.`,
    body_bn: `চট্টগ্রামের সীতাকুণ্ডের ১৭টি জাহাজ পুনর্ব্যবহার ইয়ার্ড এখন হংকং কনভেনশনের আওতায় অনুমোদিত স্থাপনার আন্তর্জাতিক সমুদ্র সংস্থার (আইএমও) তালিকায়। বাংলাদেশ শিপ রিসাইক্লিং বোর্ডের দেওয়া এসব অনুমোদন ২০৩০ সালের ২৯ অক্টোবর পর্যন্ত বৈধ।

কেবল তুরস্কের (১৮টি) তালিকাভুক্ত স্থাপনা বেশি। কনভেনশন কার্যকর হওয়ার পর আইএমও-তে কমপ্লায়েন্ট ইয়ার্ডের তালিকা জমা দেওয়া প্রথম দেশগুলোর একটি বাংলাদেশ।

গ্রিন ইয়ার্ড পৃষ্ঠায় ১৭টি ইয়ার্ডই দেখুন।`,
    source_name: "The Business Standard",
    external_url: "https://www.tbsnews.net/economy/industry/bangladesh-ranks-second-globally-17-imo-authorised-ship-recycling-yards-1441936",
  }),
  post({
    slug: "adviser-visits-ksrm-yard",
    type: "activity",
    published_at: "2025-07-26T12:00:00.000Z",
    cover_image: PHOTOS.ksrmVisit.src,
    event_date: "2025-07-26T05:00:00.000Z",
    event_location_en: "KSRM ship recycling yard, Sitakunda",
    event_location_bn: "কেএসআরএম জাহাজ পুনর্ব্যবহার ইয়ার্ড, সীতাকুণ্ড",
    title_en: "Shipping and Labour Adviser visits a Sitakunda recycling yard",
    title_bn: "সীতাকুণ্ডের পুনর্ব্যবহার ইয়ার্ড পরিদর্শনে নৌপরিবহন ও শ্রম উপদেষ্টা",
    excerpt_en:
      "Brigadier General (Retd.) Dr M. Sakhawat Hossain, Adviser for Shipping and for Labour and Employment, toured the KSRM yard on 26 July 2025.",
    excerpt_bn:
      "নৌপরিবহন এবং শ্রম ও কর্মসংস্থান উপদেষ্টা ব্রিগেডিয়ার জেনারেল (অব.) ড. এম সাখাওয়াত হোসেন ২০২৫ সালের ২৬ জুলাই কেএসআরএম ইয়ার্ড পরিদর্শন করেন।",
    body_en: `Brigadier General (Retd.) Dr M. Sakhawat Hossain, Adviser to the Ministry of Shipping and the Ministry of Labour and Employment, visited ship recycling operations at the KSRM yard in Sitakunda, Chattogram, on 26 July 2025.

Photograph: Press Information Department, Government of Bangladesh (public domain).`,
    body_bn: `নৌপরিবহন মন্ত্রণালয় এবং শ্রম ও কর্মসংস্থান মন্ত্রণালয়ের উপদেষ্টা ব্রিগেডিয়ার জেনারেল (অব.) ড. এম সাখাওয়াত হোসেন ২০২৫ সালের ২৬ জুলাই চট্টগ্রামের সীতাকুণ্ডে কেএসআরএম ইয়ার্ডের জাহাজ পুনর্ব্যবহার কার্যক্রম পরিদর্শন করেন।

ছবি: তথ্য অধিদপ্তর (পিআইডি), বাংলাদেশ সরকার (পাবলিক ডোমেইন)।`,
  }),
  post({
    slug: "hong-kong-convention-enters-into-force",
    type: "industry_update",
    published_at: "2025-06-26T06:00:00.000Z",
    cover_image: PHOTOS.cranes.src,
    title_en: "The Hong Kong Convention enters into force",
    title_bn: "হংকং কনভেনশন কার্যকর",
    excerpt_en:
      "From 26 June 2025, ships flagged to parties may be recycled only at authorised facilities that meet the convention's requirements.",
    excerpt_bn: "২০২৫ সালের ২৬ জুন থেকে পক্ষভুক্ত দেশের পতাকাবাহী জাহাজ কেবল কনভেনশনের শর্ত পূরণকারী অনুমোদিত স্থাপনায় পুনর্ব্যবহার করা যাবে।",
    body_en: `The IMO's Hong Kong International Convention for the Safe and Environmentally Sound Recycling of Ships entered into force on 26 June 2025, sixteen years after its adoption.

The convention covers the whole life of a ship — from design and an Inventory of Hazardous Materials to the authorisation of recycling facilities and the preparation of a ship-specific recycling plan.

For Bangladesh, which ratified it in June 2023, entry into force marks the start of a new operating standard for every yard.`,
    body_bn: `আইএমও-র জাহাজের নিরাপদ ও পরিবেশসম্মত পুনর্ব্যবহার বিষয়ক হংকং আন্তর্জাতিক কনভেনশন গৃহীত হওয়ার ষোলো বছর পর ২০২৫ সালের ২৬ জুন কার্যকর হয়েছে।

কনভেনশনটি জাহাজের পুরো জীবনচক্র জুড়ে প্রযোজ্য — নকশা ও বিপজ্জনক উপকরণের তালিকা থেকে শুরু করে পুনর্ব্যবহার স্থাপনার অনুমোদন এবং জাহাজভিত্তিক পুনর্ব্যবহার পরিকল্পনা পর্যন্ত।

২০২৩ সালের জুনে অনুসমর্থনকারী বাংলাদেশের জন্য এটি প্রতিটি ইয়ার্ডে নতুন কর্মমানের সূচনা।`,
    external_url: "https://www.imo.org/en/ourwork/environment/pages/ship-recycling.aspx",
    source_name: "International Maritime Organization",
  }),
  post({
    slug: "bangladesh-ratifies-hong-kong-convention",
    type: "international",
    published_at: "2023-06-27T09:30:00.000Z",
    cover_image: PHOTOS.sunset.src,
    title_en: "Bangladesh ratifies the Hong Kong Convention",
    title_bn: "হংকং কনভেনশন অনুসমর্থন করল বাংলাদেশ",
    excerpt_en:
      "Bangladesh's instruments, handed to the IMO in London on 26 June 2023, helped the convention pass the threshold for entry into force.",
    excerpt_bn: "২০২৩ সালের ২৬ জুন লন্ডনে আইএমও-তে জমা দেওয়া বাংলাদেশের দলিল কনভেনশন কার্যকর হওয়ার শর্ত পূরণে ভূমিকা রাখে।",
    body_en: `Bangladesh's Permanent Representative to the IMO handed over the country's instruments of ratification at IMO headquarters in London on 26 June 2023. With Bangladesh and Liberia, the parties to the convention represented more than 40% of world merchant shipping by gross tonnage — the last condition for entry into force, which followed 24 months later.

At the time, three Bangladeshi yards held green certification: PHP (since 2017), SN Corporation and Khwaja Ship Breaking.`,
    body_bn: `২০২৩ সালের ২৬ জুন লন্ডনে আইএমও সদর দপ্তরে আইএমও-তে বাংলাদেশের স্থায়ী প্রতিনিধি দেশের অনুসমর্থনের দলিল হস্তান্তর করেন। বাংলাদেশ ও লাইবেরিয়ার অন্তর্ভুক্তিতে কনভেনশনের পক্ষভুক্ত দেশগুলোর অংশ বিশ্বের বাণিজ্যিক জাহাজের গ্রস টনেজের ৪০ শতাংশ ছাড়িয়ে যায় — কার্যকর হওয়ার শেষ শর্ত, যা ২৪ মাস পর কার্যকর হয়।

সে সময় বাংলাদেশের তিনটি ইয়ার্ডের গ্রিন সনদ ছিল: পিএইচপি (২০১৭ থেকে), এসএন কর্পোরেশন ও খাজা শিপ ব্রেকিং।`,
    source_name: "The Business Standard",
    external_url: "https://www.tbsnews.net/bangladesh/hong-kong-convention-bangladesh-submits-instruments-will-get-status-june-2025-657198",
  }),
  post({
    slug: "sensrec-cooperation",
    type: "international",
    published_at: "2026-10-01T08:00:00.000Z",
    cover_image: PHOTOS.imoGreenYard.src,
    title_en: "Building capacity with the IMO's SENSREC project",
    title_bn: "আইএমও-র সেনস্রেক প্রকল্পের মাধ্যমে সক্ষমতা উন্নয়ন",
    excerpt_en:
      "The IMO-executed, Norway-funded SENSREC project has supported studies, training and planning for safe and environmentally sound ship recycling in Bangladesh.",
    excerpt_bn:
      "আইএমও-বাস্তবায়িত ও নরওয়ের অর্থায়নে সেনস্রেক প্রকল্প বাংলাদেশে নিরাপদ ও পরিবেশসম্মত জাহাজ পুনর্ব্যবহারের জন্য গবেষণা, প্রশিক্ষণ ও পরিকল্পনায় সহায়তা দিয়েছে।",
    body_en: `Through the SENSREC project (Safe and Environmentally Sound Ship Recycling in Bangladesh), the IMO and the Government of Bangladesh have worked on economic and environmental studies, worker training and improvements to the government's one-stop service for ship recycling permissions. The project's report on the one-stop service is in Publications.`,
    body_bn: `সেনস্রেক (সেইফ অ্যান্ড এনভায়রনমেন্টালি সাউন্ড শিপ রিসাইক্লিং ইন বাংলাদেশ) প্রকল্পের মাধ্যমে আইএমও ও বাংলাদেশ সরকার অর্থনৈতিক ও পরিবেশগত গবেষণা, শ্রমিক প্রশিক্ষণ এবং জাহাজ পুনর্ব্যবহারের অনুমতির জন্য সরকারের ওয়ান-স্টপ সেবার উন্নয়নে কাজ করেছে। ওয়ান-স্টপ সেবা বিষয়ে প্রকল্পের প্রতিবেদনটি প্রকাশনা অংশে রয়েছে।`,
  }),
  post({
    slug: "coverage-bangladesh-loses-top-spot",
    type: "media_coverage",
    published_at: "2026-02-25T02:53:00.000Z",
    source_name: "The Financial Express",
    external_url: "https://thefinancialexpress.com.bd/home/bangladesh-loses-top-spot-in-global-shipbreaking-as-imports-of-scrapped-vessels-drop-32pc",
    title_en: "Bangladesh loses top spot in global shipbreaking as imports of scrapped vessels drop 32pc",
    title_bn: "জাহাজ আমদানি ৩২ শতাংশ কমায় বৈশ্বিক জাহাজভাঙায় শীর্ষস্থান হারাল বাংলাদেশ",
    excerpt_en: "Bangladesh imported 88 end-of-life ships in 2025, down from 130 in 2024, according to the NGO Shipbreaking Platform.",
    excerpt_bn: "এনজিও শিপব্রেকিং প্ল্যাটফর্মের তথ্যমতে ২০২৫ সালে বাংলাদেশ ৮৮টি মেয়াদোত্তীর্ণ জাহাজ আমদানি করেছে, ২০২৪ সালে যা ছিল ১৩০টি।",
  }),
  post({
    slug: "coverage-new-leadership",
    type: "media_coverage",
    published_at: "2026-07-05T02:00:00.000Z",
    source_name: "The Daily Star",
    external_url: "https://www.thedailystar.net/business/economy/news/ship-breakers-association-elects-new-leadership-4215841",
    title_en: "Ship breakers' association elects new leadership",
    title_bn: "জাহাজভাঙা মালিকদের সংগঠনে নতুন নেতৃত্ব",
    excerpt_en: "Report on the 4 July 2026 BSBRA election, at which 71 of 84 eligible members voted.",
    excerpt_bn: "২০২৬ সালের ৪ জুলাইয়ের বিএসবিআরএ নির্বাচন নিয়ে প্রতিবেদন, যেখানে ৮৪ জন যোগ্য সদস্যের ৭১ জন ভোট দেন।",
  }),
  post({
    slug: "coverage-new-president-elected",
    type: "media_coverage",
    published_at: "2026-07-05T03:00:00.000Z",
    source_name: "The Daily Observer",
    external_url: "https://observerbd.com/news/582040",
    title_en: "BSBRA gets new leadership, PHP's Mohsin elected president",
    title_bn: "বিএসবিআরএ-তে নতুন নেতৃত্ব, সভাপতি পিএইচপির মহসিন",
    excerpt_en: "Coverage of the results of the BSBRA Executive Committee election.",
    excerpt_bn: "বিএসবিআরএ কার্যনির্বাহী কমিটি নির্বাচনের ফলাফল নিয়ে প্রতিবেদন।",
  }),
  post({
    slug: "coverage-php-president",
    type: "media_coverage",
    published_at: "2026-07-04T12:56:00.000Z",
    source_name: "Times of Bangladesh",
    external_url: "https://tob.news/phps-mohsin-chowdhury-elected-bsbra-president/",
    title_en: "PHP's Mohsin Chowdhury elected BSBRA president",
    title_bn: "বিএসবিআরএ সভাপতি নির্বাচিত পিএইচপির মহসিন চৌধুরী",
    excerpt_en: "The association's biennial election ended a period of legal complications, the report notes.",
    excerpt_bn: "প্রতিবেদন অনুযায়ী দ্বিবার্ষিক নির্বাচনের মধ্য দিয়ে সংগঠনের দীর্ঘ আইনি জটিলতার অবসান হয়েছে।",
  }),
  post({
    slug: "coverage-bsbra-election-today",
    type: "media_coverage",
    published_at: "2026-07-04T00:00:00.000Z",
    source_name: "The Financial Express",
    external_url: "https://today.thefinancialexpress.com.bd/trade-market/bsbra-election-today-1783097128",
    title_en: "BSBRA election today",
    title_bn: "আজ বিএসবিআরএ নির্বাচন",
    excerpt_en: "Preview of the long-delayed BSBRA election in Chattogram.",
    excerpt_bn: "চট্টগ্রামে দীর্ঘ প্রতীক্ষিত বিএসবিআরএ নির্বাচনের আগাম সংবাদ।",
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
  doc("imo-srf-list", {
    title_en: "IMO List of Authorised Ship Recycling Facilities (SRF) — Bangladesh",
    title_bn: "আইএমও অনুমোদিত জাহাজ পুনর্ব্যবহার স্থাপনার তালিকা (এসআরএফ) — বাংলাদেশ",
    description_en:
      "Official notification under Article 12.1 of the Hong Kong Convention listing all 17 authorised Bangladeshi ship recycling facilities with DASR certificate numbers, locations, and validity until 29 October 2030.",
    description_bn:
      "হংকং কনভেনশনের অনুচ্ছেদ ১২.১-এর আওতায় আইএমও-তে জমাকৃত বিজ্ঞপ্তি — যাতে ডিএএসআর সনদ নম্বর ও ২০৩০ পর্যন্ত বৈধতাসহ বাংলাদেশের ১৭টি অনুমোদিত ইয়ার্ডের বিবরণ রয়েছে।",
    category: "law_regulation",
    year: 2025,
    published_on: "2025-11-21",
    file_path: "imo-srf-list.pdf",
    file_name: "LIST-OF-SRF-published-by-IMO-2025-1.pdf",
    file_size: 315866,
    mime_type: "application/pdf",
    external_url: "https://bsrb.gov.bd/wp-content/uploads/2026/05/LIST-OF-SRF-published-by-IMO-2025-1.pdf",
  }),
  doc("bsrb-newsletter-2026", {
    title_en: "Maritime Green Horizon Bangladesh — 2026 Edition (BSRB)",
    title_bn: "মেরিটাইম গ্রিন হরাইজন বাংলাদেশ — ২০২৬ প্রকাশনা (বিএসআরবি)",
    description_en:
      "Official publication by the Bangladesh Ship Recycling Board on sustainable recycling milestones, HKC implementation, and green yard transformations.",
    description_bn:
      "টেকসই জাহাজ পুনর্ব্যবহার, এইচকেসি বাস্তবায়ন ও গ্রিন ইয়ার্ড রূপান্তর বিষয়ক বাংলাদেশ শিপ রিসাইক্লিং বোর্ডের অফিসিয়াল প্রকাশনা।",
    category: "publication",
    year: 2026,
    published_on: "2026-07-05",
    external_url: "https://bsrb.gov.bd/wp-content/uploads/2026/07/BSRB-NEWSLETTER-2026-Final.pdf",
  }),
  doc("bsrb-newsletter-2025", {
    title_en: "Maritime Green Horizon Bangladesh — Inaugural Edition (BSRB)",
    title_bn: "মেরিটাইম গ্রিন হরাইজন বাংলাদেশ — প্রথম প্রকাশনা (বিএসআরবি)",
    description_en:
      "Inaugural publication by the Bangladesh Ship Recycling Board reviewing safety protocols, training initiatives, and environmental monitoring.",
    description_bn:
      "নিরাপত্তা প্রটোকল, প্রশিক্ষণ উদ্যোগ ও পরিবেশগত তদারকি সংক্রান্ত বিএসআরবির প্রথম প্রকাশনা।",
    category: "publication",
    year: 2025,
    published_on: "2025-09-01",
    external_url: "https://bsrb.gov.bd/wp-content/uploads/2025/09/BSRB-Newsletter.pdf",
  }),
  doc("bsr-rules", {
    title_en: "Bangladesh Ship Recycling Rules, 2023",
    title_bn: "বাংলাদেশ জাহাজ পুনঃপ্রক্রিয়াজাতকরণ বিধিমালা, ২০২৩",
    description_en:
      "Statutory rules framed under the Bangladesh Ship Recycling Act 2018 governing yard authorization, safety audits, and waste operations.",
    description_bn: "বাংলাদেশ শিপ রিসাইক্লিং আইন ২০১৮-এর অধীনে প্রণীত সংবিধিবদ্ধ বিধিমালা।",
    category: "law_regulation",
    year: 2023,
    external_url: "https://bsrb.gov.bd",
  }),
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
  description_en: string;
  description_bn: string;
  category: Album["category"];
  date: string | null;
  images: PhotoKey[];
}

/** Photographs from Wikimedia Commons; each photo carries its licence credit. */
const albumSeeds: AlbumSeed[] = [
  {
    slug: "ship-recycling-sitakunda",
    title_en: "Ship recycling on the Sitakunda coast",
    title_bn: "সীতাকুণ্ড উপকূলে জাহাজ পুনর্ব্যবহার",
    description_en: "Vessels and yards along the coast north of Chattogram, from the tidal flats to modern concrete work floors.",
    description_bn: "চট্টগ্রামের উত্তরের উপকূলজুড়ে জাহাজ ও ইয়ার্ড — জোয়ার-ভাটার চর থেকে আধুনিক কংক্রিটের কর্ম-মেঝে পর্যন্ত।",
    category: "operations",
    date: null,
    images: ["bulkCarrier", "cranes", "imoGreenYard", "sunset", "beachedBow", "yard", "bowMonochrome", "coastAster"],
  },
  {
    slug: "adviser-visit-ksrm-2025",
    title_en: "Shipping and Labour Adviser at a Sitakunda yard",
    title_bn: "সীতাকুণ্ডের ইয়ার্ডে নৌপরিবহন ও শ্রম উপদেষ্টা",
    description_en: "The Adviser's visit to the KSRM ship recycling yard on 26 July 2025.",
    description_bn: "২০২৫ সালের ২৬ জুলাই কেএসআরএম জাহাজ পুনর্ব্যবহার ইয়ার্ডে উপদেষ্টার পরিদর্শন।",
    category: "yard_visits",
    date: "2025-07-26",
    images: ["ksrmVisit"],
  },
  {
    slug: "bsrb-inspections-and-training",
    title_en: "BSRB Yard Inspections & Training Initiatives",
    title_bn: "বিএসআরবি ইয়ার্ড পরিদর্শন ও প্রশিক্ষণ উদ্যোগ",
    description_en:
      "On-site HKC verification visits, technical team inspections, and collaborative workforce training initiatives in Chattogram.",
    description_bn:
      "চট্টগ্রামে অন-সাইট এইচকেসি যাচাইকরণ সফর, কারিগরি দলের পরিদর্শন এবং যৌথ কর্মী প্রশিক্ষণ উদ্যোগ।",
    category: "yard_visits",
    date: "2026-07-28",
    images: ["ziriSubedarInspection1", "ziriSubedarInspection2", "bsrbJicaTraining", "bsrbOffice", "smeExhibition"],
  },
];

export const albums: Album[] = albumSeeds.map((a, i) => ({
  ...meta(`album:${a.slug}`),
  slug: a.slug,
  title_en: a.title_en,
  title_bn: a.title_bn,
  description_en: a.description_en,
  description_bn: a.description_bn,
  category: a.category,
  event_date: a.date,
  cover_image: PHOTOS[a.images[0]].src,
  sort_order: i + 1,
  is_published: true,
}));

export const photos: Photo[] = albumSeeds.flatMap((a) =>
  a.images.map((key, i) => {
    const photo = PHOTOS[key];
    return {
      ...meta(`photo:${a.slug}:${i}`),
      album_id: uid(`album:${a.slug}`),
      image_path: photo.src,
      video_url: null,
      caption_en: photo.alt_en,
      caption_bn: photo.alt_bn,
      credit: `${photo.author} · ${photo.license}`,
      width: photo.width,
      height: photo.height,
      allow_download: true,
      sort_order: i + 1,
    };
  }),
);

// ---------------------------------------------------------------------------
// Member registry
// ---------------------------------------------------------------------------
export const members: Member[] = yards.map((y, i) => {
  const parts = y.contact_person ? y.contact_person.split(",") : [];
  const repName = parts[0]?.trim() ?? null;
  const repDesig = parts[1]?.trim() ?? "Authorized Representative";
  return {
    ...meta(`member:${y.slug}`),
    membership_no: `BSBRA-M${String(i + 1).padStart(3, "0")}`,
    company_name: y.name_en,
    company_name_bn: y.name_bn,
    yard_id: y.id,
    representative_name: repName,
    representative_designation: repDesig,
    phone: y.phone,
    email: y.email,
    address: y.address_en ?? "Sitakunda, Chattogram, Bangladesh",
    website: y.website,
    status: "active",
    joined_on: "2020-01-01",
    notes: `IMO-authorised facility under Hong Kong Convention (DASR: ${y.certificate_no})`,
  };
});

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
    { occurred_at: "2026-10-06T16:18:00.000Z", actor_id: dataOfficer.id, actor_email: dataOfficer.email, actor_role: dataOfficer.role, action: "update", table_name: "industry_statistics", record_id: industryStatistics[industryStatistics.length - 1].id, record_label: "Year 2025", changed_fields: ["green_yards", "global_share_percent"], old_data: null, new_data: null },
    { occurred_at: "2026-10-05T10:11:00.000Z", actor_id: actor.id, actor_email: actor.email, actor_role: actor.role, action: "delete", table_name: "links", record_id: uid("link:obsolete"), record_label: "Obsolete link", changed_fields: null, old_data: null, new_data: null },
    { occurred_at: "2026-10-04T08:40:00.000Z", actor_id: admin.id, actor_email: admin.email, actor_role: admin.role, action: "export", table_name: "activity", record_id: "audit_log", record_label: "audit_log", changed_fields: null, old_data: null, new_data: { format: "csv" } },
  ];
  return entries.map((e, i) => ({ id: entries.length - i, ...e }));
})();

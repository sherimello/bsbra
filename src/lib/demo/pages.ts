import type { Page } from "@/lib/types";
import { meta } from "./ids";

type PageInput = Pick<Page, "slug" | "title_en" | "title_bn" | "summary_en" | "summary_bn" | "body_en" | "body_bn"> & {
  sort_order?: number;
};

function page(input: PageInput): Page {
  return {
    ...meta(`page:${input.slug}`),
    hero_image: null,
    sort_order: input.sort_order ?? 0,
    status: "published",
    access_level: "public",
    published_at: "2026-10-01T09:00:00.000Z",
    ...input,
  };
}

/**
 * Initial CMS copy for BSBRA. Every page is editable in Admin → Pages.
 * Level-2 headings (## …) become the animated sections on the public site.
 */
export const pages: Page[] = [
  page({
    slug: "about-history",
    sort_order: 1,
    title_en: "History & background",
    title_bn: "ইতিহাস ও পটভূমি",
    summary_en: "From a single stranded vessel in 1960 to one of the world's leading ship recycling nations.",
    summary_bn: "১৯৬০ সালে আটকে পড়া একটি জাহাজ থেকে বিশ্বের শীর্ষস্থানীয় জাহাজ পুনর্ব্যবহারকারী দেশগুলোর একটিতে।",
    body_en: `Ship recycling in Bangladesh began by accident. In 1960 a severe cyclone drove the Greek vessel *MD Alpine* ashore on the coast of Sitakunda, north of Chattogram. Attempts to refloat her failed, and she was eventually dismantled for her steel — revealing what the long, gently sloping beaches of the Bay of Bengal could offer.

From the 1970s, and especially through the 1980s, commercial ship breaking took hold as the country's demand for steel grew. The coastline between Fauzdarhat and Kumira became home to a line of recycling yards, and over the following decades the industry grew into one of the largest in the world by tonnage — supplying a substantial share of Bangladesh's steel raw material.

The Bangladesh Ship Breakers & Recyclers Association (BSBRA) brings these yards together. It represents its members before government and regulators, works with international partners, and leads the industry's transition to safe and environmentally sound recycling under the Hong Kong Convention.`,
    body_bn: `বাংলাদেশে জাহাজ পুনর্ব্যবহারের সূচনা হয়েছিল এক দুর্ঘটনার মধ্য দিয়ে। ১৯৬০ সালে এক প্রবল ঘূর্ণিঝড় গ্রিক জাহাজ *এমডি আলপাইন*-কে চট্টগ্রামের উত্তরে সীতাকুণ্ড উপকূলে তুলে দেয়। জাহাজটি আর ভাসানো সম্ভব হয়নি; পরে এর ইস্পাতের জন্য সেটি কেটে ফেলা হয় — আর তখনই বোঝা যায় বঙ্গোপসাগরের দীর্ঘ, মৃদু ঢালের সৈকত কী সম্ভাবনা ধারণ করে।

সত্তরের দশক থেকে, বিশেষ করে আশির দশকে, দেশে ইস্পাতের চাহিদা বাড়ার সঙ্গে সঙ্গে বাণিজ্যিকভাবে জাহাজ ভাঙা শুরু হয়। ফৌজদারহাট থেকে কুমিরা পর্যন্ত উপকূলে একের পর এক ইয়ার্ড গড়ে ওঠে, এবং পরবর্তী দশকগুলোতে এ শিল্প টনেজের হিসাবে বিশ্বের অন্যতম বৃহৎ শিল্পে পরিণত হয় — যা দেশের ইস্পাত কাঁচামালের উল্লেখযোগ্য অংশের জোগান দেয়।

বাংলাদেশ শিপ ব্রেকার্স অ্যান্ড রিসাইক্লার্স অ্যাসোসিয়েশন (বিএসবিআরএ) এই ইয়ার্ডগুলোকে এক ছাতার নিচে নিয়ে এসেছে। সংগঠনটি সরকার ও নিয়ন্ত্রক সংস্থার কাছে সদস্যদের প্রতিনিধিত্ব করে, আন্তর্জাতিক অংশীদারদের সঙ্গে কাজ করে এবং হংকং কনভেনশনের আওতায় নিরাপদ ও পরিবেশসম্মত পুনর্ব্যবহারে শিল্পের রূপান্তরে নেতৃত্ব দেয়।`,
  }),
  page({
    slug: "about-objectives",
    sort_order: 2,
    title_en: "Objectives & activities",
    title_bn: "উদ্দেশ্য ও কার্যক্রম",
    summary_en: "What BSBRA works for, on behalf of its members and the nation.",
    summary_bn: "সদস্য ও দেশের পক্ষে বিএসবিআরএ যে লক্ষ্যে কাজ করে।",
    body_en: `## Our objectives
- Represent and protect the interests of ship recycling yards in Bangladesh.
- Promote safe, environmentally sound recycling in line with the Hong Kong Convention and national law.
- Work with the Bangladesh Ship Recycling Board, ministries and regulators on policy and compliance.
- Advance worker safety, training, health and welfare across member yards.
- Present the Bangladesh ship recycling industry to international stakeholders, ship owners and investors.

## Our activities
- Policy dialogue and representation with government and regulators.
- Training, seminars and workshops on safety, environment and compliance.
- Collection and publication of industry data and statistics.
- Support for members on certification, documentation and green-yard upgrades.
- International cooperation, conferences and delegation visits.
- CSR and community programmes along the Sitakunda coast.`,
    body_bn: `## আমাদের উদ্দেশ্য
- বাংলাদেশের জাহাজ পুনর্ব্যবহার ইয়ার্ডগুলোর স্বার্থের প্রতিনিধিত্ব ও সুরক্ষা।
- হংকং কনভেনশন ও জাতীয় আইন অনুযায়ী নিরাপদ ও পরিবেশসম্মত পুনর্ব্যবহারে উৎসাহ দেওয়া।
- নীতি ও কমপ্লায়েন্স বিষয়ে বাংলাদেশ শিপ রিসাইক্লিং বোর্ড, মন্ত্রণালয় ও নিয়ন্ত্রক সংস্থার সঙ্গে কাজ করা।
- সদস্য ইয়ার্ডগুলোতে শ্রমিকের নিরাপত্তা, প্রশিক্ষণ, স্বাস্থ্য ও কল্যাণ এগিয়ে নেওয়া।
- আন্তর্জাতিক অংশীজন, জাহাজমালিক ও বিনিয়োগকারীদের কাছে বাংলাদেশের জাহাজ পুনর্ব্যবহার শিল্পকে তুলে ধরা।

## আমাদের কার্যক্রম
- সরকার ও নিয়ন্ত্রক সংস্থার সঙ্গে নীতি-সংলাপ ও প্রতিনিধিত্ব।
- নিরাপত্তা, পরিবেশ ও কমপ্লায়েন্স বিষয়ে প্রশিক্ষণ, সেমিনার ও কর্মশালা।
- শিল্প-সংক্রান্ত তথ্য ও পরিসংখ্যান সংগ্রহ ও প্রকাশ।
- সনদ, ডকুমেন্টেশন ও গ্রিন ইয়ার্ডে রূপান্তরে সদস্যদের সহায়তা।
- আন্তর্জাতিক সহযোগিতা, সম্মেলন ও প্রতিনিধিদলের সফর।
- সীতাকুণ্ড উপকূলে সিএসআর ও কমিউনিটি কর্মসূচি।`,
  }),
  page({
    slug: "about-mission",
    sort_order: 3,
    title_en: "Mission",
    title_bn: "মিশন",
    summary_en:
      "To lead Bangladesh's ship recycling industry towards safe, environmentally sound and globally competitive operations — protecting workers, communities and the environment while supplying the nation with essential raw materials.",
    summary_bn:
      "বাংলাদেশের জাহাজ পুনর্ব্যবহার শিল্পকে নিরাপদ, পরিবেশসম্মত ও বিশ্বমানের প্রতিযোগিতামূলক পথে এগিয়ে নেওয়া — শ্রমিক, কমিউনিটি ও পরিবেশ সুরক্ষার পাশাপাশি দেশের জন্য প্রয়োজনীয় কাঁচামালের জোগান নিশ্চিত করা।",
    body_en: null,
    body_bn: null,
  }),
  page({
    slug: "about-vision",
    sort_order: 4,
    title_en: "Vision",
    title_bn: "ভিশন",
    summary_en:
      "A world-class, fully compliant Bangladesh ship recycling industry, recognised internationally as a model of the circular economy.",
    summary_bn:
      "একটি বিশ্বমানের, পূর্ণ কমপ্লায়েন্ট বাংলাদেশি জাহাজ পুনর্ব্যবহার শিল্প — যা সার্কুলার অর্থনীতির দৃষ্টান্ত হিসেবে আন্তর্জাতিকভাবে স্বীকৃত।",
    body_en: null,
    body_bn: null,
  }),
  page({
    slug: "about-why-ship-recycling",
    sort_order: 5,
    title_en: "Why ship recycling?",
    title_bn: "কেন জাহাজ পুনর্ব্যবহার?",
    summary_en: "Every ship reaches the end of its working life. Recycling is the most responsible way to retire it.",
    summary_bn: "প্রতিটি জাহাজের কর্মজীবন একসময় শেষ হয়। পুনর্ব্যবহারই তাকে অবসরে পাঠানোর সবচেয়ে দায়িত্বশীল উপায়।",
    body_en: `- **Circular economy.** The great majority of a ship's materials — above all its steel — can be recovered and reused.
- **Lower-carbon steel.** Making steel from scrap uses far less energy, and emits far less CO₂, than making it from iron ore.
- **Safe handling of hazardous materials.** Proper recycling identifies and manages asbestos, oils, PCBs and other hazardous materials rather than leaving them at sea.
- **A second life for equipment.** Engines, generators, cables, furniture and fittings are reused through local markets.
- **Economic value.** The industry creates jobs, revenue and supply chains for downstream industries.`,
    body_bn: `- **সার্কুলার অর্থনীতি।** জাহাজের উপকরণের সিংহভাগ — বিশেষ করে ইস্পাত — উদ্ধার ও পুনরায় ব্যবহার করা যায়।
- **কম কার্বনের ইস্পাত।** আকরিক লোহার তুলনায় স্ক্র্যাপ থেকে ইস্পাত তৈরিতে অনেক কম জ্বালানি লাগে এবং কার্বন নিঃসরণও অনেক কম হয়।
- **বিপজ্জনক উপকরণের নিরাপদ ব্যবস্থাপনা।** যথাযথ পুনর্ব্যবহারে অ্যাসবেস্টস, তেল, পিসিবি ও অন্যান্য বিপজ্জনক উপকরণ চিহ্নিত করে নিরাপদে ব্যবস্থাপনা করা হয়।
- **যন্ত্রপাতির দ্বিতীয় জীবন।** ইঞ্জিন, জেনারেটর, কেবল, আসবাব ও ফিটিংস স্থানীয় বাজারে আবার ব্যবহৃত হয়।
- **অর্থনৈতিক মূল্য।** এ শিল্প কর্মসংস্থান, রাজস্ব এবং সহযোগী শিল্পের সরবরাহ শৃঙ্খল তৈরি করে।`,
  }),
  page({
    slug: "about-why-bangladesh",
    sort_order: 6,
    title_en: "Why ship recycling in Bangladesh?",
    title_bn: "কেন বাংলাদেশে জাহাজ পুনর্ব্যবহার?",
    summary_en: "A natural coastline, an industrial ecosystem and a growing commitment to international standards.",
    summary_bn: "প্রাকৃতিক উপকূল, শিল্প-বাস্তুতন্ত্র এবং আন্তর্জাতিক মানের প্রতি ক্রমবর্ধমান অঙ্গীকার।",
    body_en: `- **Steel demand.** A fast-growing economy needs steel for roads, bridges, housing and industry; recycled ship plate is a vital domestic source.
- **An integrated value chain.** Re-rolling mills, foundries and second-hand markets around Chattogram absorb almost everything a ship yields.
- **An experienced workforce.** Decades of practice have built a large workforce skilled in cutting, rigging and materials handling.
- **International commitment.** Bangladesh acceded to the Hong Kong Convention in 2023, and a growing number of yards hold Statements of Compliance.
- **A dedicated legal framework.** The Bangladesh Ship Recycling Act, 2018 and its rules provide a regulatory regime overseen by the Bangladesh Ship Recycling Board.`,
    body_bn: `- **ইস্পাতের চাহিদা।** দ্রুত বর্ধনশীল অর্থনীতির সড়ক, সেতু, আবাসন ও শিল্পের জন্য ইস্পাত প্রয়োজন; পুনর্ব্যবহৃত জাহাজের প্লেট এর গুরুত্বপূর্ণ দেশীয় উৎস।
- **সমন্বিত মূল্য শৃঙ্খল।** চট্টগ্রামের আশপাশের রি-রোলিং মিল, ফাউন্ড্রি ও পুরনো পণ্যের বাজার জাহাজ থেকে পাওয়া প্রায় সবকিছুই কাজে লাগায়।
- **অভিজ্ঞ শ্রমশক্তি।** কয়েক দশকের অভিজ্ঞতায় কাটিং, রিগিং ও উপকরণ ব্যবস্থাপনায় দক্ষ বিশাল শ্রমশক্তি গড়ে উঠেছে।
- **আন্তর্জাতিক অঙ্গীকার।** বাংলাদেশ ২০২৩ সালে হংকং কনভেনশনে যোগ দিয়েছে, এবং ক্রমবর্ধমান সংখ্যক ইয়ার্ড কমপ্লায়েন্স সনদ অর্জন করেছে।
- **নির্দিষ্ট আইনি কাঠামো।** বাংলাদেশ শিপ রিসাইক্লিং আইন, ২০১৮ ও এর বিধিমালা বাংলাদেশ শিপ রিসাইক্লিং বোর্ডের তত্ত্বাবধানে একটি নিয়ন্ত্রণ-ব্যবস্থা প্রতিষ্ঠা করেছে।`,
  }),
  page({
    slug: "about-geography",
    sort_order: 7,
    title_en: "Geographical advantages",
    title_bn: "ভৌগোলিক সুবিধা",
    summary_en: "The Sitakunda coast is shaped for beaching.",
    summary_bn: "সীতাকুণ্ড উপকূল যেন বিচিংয়ের জন্যই গড়া।",
    body_en: `- **Gently sloping intertidal beaches.** The long, flat mudflats north of Chattogram let vessels be beached safely at high water.
- **A large tidal range.** Spring tides in the north-eastern Bay of Bengal rise several metres, carrying ships far up the beach.
- **Close to Chattogram Port.** The country's principal seaport — with shipping services, customs and logistics — is within easy reach.
- **Road and rail links.** The Dhaka–Chattogram highway and railway run alongside the yards, connecting recovered materials to markets nationwide.
- **A strategic location.** On the eastern Bay of Bengal, close to the shipping lanes and markets of South and South-East Asia.`,
    body_bn: `- **মৃদু ঢালের আন্তঃজোয়ার সৈকত।** চট্টগ্রামের উত্তরের দীর্ঘ, সমতল কাদাচর ভরা জোয়ারে নিরাপদে জাহাজ বিচিংয়ের সুযোগ দেয়।
- **জোয়ার-ভাটার বড় পার্থক্য।** বঙ্গোপসাগরের উত্তর-পূর্বাঞ্চলে ভরা কাটালের জোয়ার কয়েক মিটার পর্যন্ত ওঠে, যা জাহাজকে সৈকতের অনেক ভেতরে নিয়ে আসে।
- **চট্টগ্রাম বন্দরের নিকটবর্তী।** দেশের প্রধান সমুদ্রবন্দর — শিপিং সেবা, কাস্টমস ও লজিস্টিকসসহ — খুব কাছেই।
- **সড়ক ও রেল যোগাযোগ।** ঢাকা–চট্টগ্রাম মহাসড়ক ও রেলপথ ইয়ার্ডগুলোর পাশ দিয়ে গেছে, যা উদ্ধারকৃত উপকরণকে সারা দেশের বাজারের সঙ্গে যুক্ত করে।
- **কৌশলগত অবস্থান।** বঙ্গোপসাগরের পূর্বপ্রান্তে, দক্ষিণ ও দক্ষিণ-পূর্ব এশিয়ার নৌপথ ও বাজারের কাছাকাছি।`,
  }),
  page({
    slug: "about-strengths",
    sort_order: 8,
    title_en: "Strengths of the industry",
    title_bn: "শিল্পের শক্তি",
    summary_en: "Scale, experience and a value chain few countries can match.",
    summary_bn: "পরিসর, অভিজ্ঞতা ও এমন এক মূল্য শৃঙ্খল যা খুব কম দেশেরই আছে।",
    body_en: `- One of the largest ship recycling industries in the world by light displacement tonnage.
- A significant domestic source of re-rollable steel for construction and manufacturing.
- An expanding group of Hong Kong Convention-compliant green yards.
- Employment for thousands of workers directly, and many more in linked industries.
- A dedicated regulator — the Bangladesh Ship Recycling Board — and a one-stop service for permissions.
- Strong cooperation with international organisations, classification societies and ship owners.`,
    body_bn: `- লাইট ডিসপ্লেসমেন্ট টনেজের হিসাবে বিশ্বের অন্যতম বৃহৎ জাহাজ পুনর্ব্যবহার শিল্প।
- নির্মাণ ও উৎপাদন খাতের জন্য রি-রোলযোগ্য ইস্পাতের উল্লেখযোগ্য দেশীয় উৎস।
- হংকং কনভেনশন-সম্মত গ্রিন ইয়ার্ডের ক্রমবর্ধমান সংখ্যা।
- প্রত্যক্ষভাবে হাজারো শ্রমিক এবং সহযোগী শিল্পে আরও অনেকের কর্মসংস্থান।
- নির্দিষ্ট নিয়ন্ত্রক সংস্থা — বাংলাদেশ শিপ রিসাইক্লিং বোর্ড — এবং অনুমতির জন্য ওয়ান-স্টপ সেবা।
- আন্তর্জাতিক সংস্থা, ক্লাসিফিকেশন সোসাইটি ও জাহাজমালিকদের সঙ্গে দৃঢ় সহযোগিতা।`,
  }),
  page({
    slug: "about-future",
    sort_order: 9,
    title_en: "Future prospects",
    title_bn: "ভবিষ্যৎ সম্ভাবনা",
    summary_en: "The next chapter is green, skilled and data-driven.",
    summary_bn: "পরবর্তী অধ্যায় হবে সবুজ, দক্ষ ও তথ্যনির্ভর।",
    body_en: `- **Full HKC compliance.** Every operating yard upgraded and certified under the Hong Kong Convention.
- **Hazardous-waste infrastructure.** Shared treatment, storage and disposal facilities for ship-generated hazardous waste.
- **Skills and safety.** Accredited training, certification and health services for every worker.
- **Investment.** Modern equipment, cranes and impermeable work areas, supported by green finance.
- **Transparency.** Open, verifiable industry data shared through platforms like this one.
- **Regional leadership.** Bangladesh as a preferred destination for responsible ship owners worldwide.`,
    body_bn: `- **পূর্ণ এইচকেসি কমপ্লায়েন্স।** প্রতিটি সক্রিয় ইয়ার্ডের হংকং কনভেনশন অনুযায়ী উন্নয়ন ও সনদপ্রাপ্তি।
- **বিপজ্জনক বর্জ্যের অবকাঠামো।** জাহাজ থেকে উৎপন্ন বিপজ্জনক বর্জ্যের জন্য সম্মিলিত শোধন, সংরক্ষণ ও নিষ্কাশন সুবিধা।
- **দক্ষতা ও নিরাপত্তা।** প্রত্যেক শ্রমিকের জন্য স্বীকৃত প্রশিক্ষণ, সনদ ও স্বাস্থ্যসেবা।
- **বিনিয়োগ।** গ্রিন ফাইন্যান্সের সহায়তায় আধুনিক যন্ত্রপাতি, ক্রেন ও অভেদ্য কর্ম-এলাকা।
- **স্বচ্ছতা।** এই প্ল্যাটফর্মের মতো মাধ্যমে উন্মুক্ত ও যাচাইযোগ্য শিল্প-তথ্য।
- **আঞ্চলিক নেতৃত্ব।** বিশ্বের দায়িত্বশীল জাহাজমালিকদের পছন্দের গন্তব্য হিসেবে বাংলাদেশ।`,
  }),
  page({
    slug: "compliance-overview",
    title_en: "Green ship recycling in Bangladesh",
    title_bn: "বাংলাদেশে গ্রিন শিপ রিসাইক্লিং",
    summary_en: "How Bangladesh is moving from conventional beaching yards to certified, environmentally sound recycling facilities.",
    summary_bn: "প্রচলিত বিচিং ইয়ার্ড থেকে সনদপ্রাপ্ত, পরিবেশসম্মত পুনর্ব্যবহার স্থাপনায় বাংলাদেশের অগ্রযাত্রা।",
    body_en: `## Green ship recycling facilities
A green yard replaces bare-earth working with impermeable concrete floors, drainage to treatment systems, heavy-lift cranes and dedicated zones for each stage of dismantling — so that blocks cut from a ship are lifted, not dropped, and nothing reaches the soil or sea.

## Green yard development
Yards upgrade in phases: a Ship Recycling Facility Plan, civil works, equipment, hazardous-material stores, training centres and medical facilities, followed by inspection and a Statement of Compliance from a recognised classification society.

## Environmental compliance
Every yard requires environmental clearance from the Department of Environment and must monitor air, water and soil. Run-off from work areas is collected and treated, and oily water is separated before discharge.

## Ship recycling compliance
Before a vessel arrives, its Inventory of Hazardous Materials (IHM) is verified, a Ship Recycling Plan is prepared and the necessary permissions are obtained through the Bangladesh Ship Recycling Board's one-stop service. Gas-free certification is required before any hot work.

## Occupational health & safety compliance
Yards maintain safety management systems, risk assessments, permit-to-work procedures, trained supervisors, first aid and emergency response — in line with national law and ILO guidance.

## Waste management compliance
Hazardous materials are removed by trained teams, labelled, stored in dedicated facilities and handed only to authorised operators. Every movement is recorded, from ship to final treatment.`,
    body_bn: `## গ্রিন শিপ রিসাইক্লিং স্থাপনা
গ্রিন ইয়ার্ডে খোলা মাটির পরিবর্তে অভেদ্য কংক্রিটের মেঝে, শোধনাগারে যুক্ত ড্রেনেজ, ভারী ক্রেন এবং ভাঙার প্রতিটি ধাপের জন্য নির্দিষ্ট এলাকা থাকে — জাহাজ থেকে কাটা অংশ ফেলে না দিয়ে তুলে নামানো হয়, এবং কিছুই মাটি বা সমুদ্রে পৌঁছায় না।

## গ্রিন ইয়ার্ড উন্নয়ন
ইয়ার্ডগুলো ধাপে ধাপে উন্নীত হয়: শিপ রিসাইক্লিং ফ্যাসিলিটি প্ল্যান, পূর্ত কাজ, যন্ত্রপাতি, বিপজ্জনক উপকরণের গুদাম, প্রশিক্ষণ কেন্দ্র ও চিকিৎসা সুবিধা — এরপর স্বীকৃত ক্লাসিফিকেশন সোসাইটির পরিদর্শন ও কমপ্লায়েন্স সনদ।

## পরিবেশগত কমপ্লায়েন্স
প্রতিটি ইয়ার্ডের পরিবেশ অধিদপ্তরের ছাড়পত্র প্রয়োজন এবং বায়ু, পানি ও মাটির মান পর্যবেক্ষণ করতে হয়। কর্ম-এলাকার পানি সংগ্রহ করে শোধন করা হয় এবং তেলযুক্ত পানি আলাদা করে তবেই নিষ্কাশন করা হয়।

## শিপ রিসাইক্লিং কমপ্লায়েন্স
জাহাজ আসার আগেই এর বিপজ্জনক উপকরণের তালিকা (আইএইচএম) যাচাই করা হয়, শিপ রিসাইক্লিং প্ল্যান তৈরি হয় এবং বাংলাদেশ শিপ রিসাইক্লিং বোর্ডের ওয়ান-স্টপ সেবার মাধ্যমে প্রয়োজনীয় অনুমতি নেওয়া হয়। যেকোনো হট-ওয়ার্কের আগে গ্যাস-ফ্রি সনদ বাধ্যতামূলক।

## পেশাগত স্বাস্থ্য ও নিরাপত্তা কমপ্লায়েন্স
ইয়ার্ডগুলো জাতীয় আইন ও আইএলও নির্দেশনা অনুযায়ী নিরাপত্তা ব্যবস্থাপনা পদ্ধতি, ঝুঁকি মূল্যায়ন, পারমিট-টু-ওয়ার্ক, প্রশিক্ষিত সুপারভাইজার, প্রাথমিক চিকিৎসা ও জরুরি সাড়াদান ব্যবস্থা বজায় রাখে।

## বর্জ্য ব্যবস্থাপনা কমপ্লায়েন্স
প্রশিক্ষিত দল বিপজ্জনক উপকরণ অপসারণ করে, লেবেল লাগিয়ে নির্দিষ্ট গুদামে রাখে এবং কেবল অনুমোদিত প্রতিষ্ঠানের কাছে হস্তান্তর করে। জাহাজ থেকে চূড়ান্ত শোধন পর্যন্ত প্রতিটি ধাপ রেকর্ড করা হয়।`,
  }),
  page({
    slug: "our-compliances",
    title_en: "Our compliances",
    title_bn: "আমাদের কমপ্লায়েন্স",
    summary_en:
      "BSBRA holds itself and its members to clear commitments on environment, safety, labour and transparency. This is where we report on them.",
    summary_bn:
      "পরিবেশ, নিরাপত্তা, শ্রম ও স্বচ্ছতা বিষয়ে বিএসবিআরএ নিজেকে ও সদস্যদের সুস্পষ্ট অঙ্গীকারে আবদ্ধ রাখে। এখানে আমরা সে অঙ্গীকারের অগ্রগতি জানাই।",
    body_en: null,
    body_bn: null,
  }),
  page({
    slug: "waste-management",
    title_en: "Waste management",
    title_bn: "বর্জ্য ব্যবস্থাপনা",
    summary_en: "Identifying, separating and safely handling every material a ship contains — from the first survey to final disposal.",
    summary_bn: "প্রথম জরিপ থেকে চূড়ান্ত নিষ্কাশন পর্যন্ত — জাহাজের প্রতিটি উপকরণ চিহ্নিত, পৃথক ও নিরাপদে ব্যবস্থাপনা।",
    body_en: `## Hazardous waste management
Asbestos, PCBs, heavy metals, residual oils, sludge and refrigerants are identified through the vessel's Inventory of Hazardous Materials and removed by trained, protected teams before general dismantling begins.

## Non-hazardous waste management
Steel, non-ferrous metals, timber, plastics, glass and furnishings are recovered and sold for reuse or recycling through licensed channels.

## Waste segregation
Materials are separated at source into clearly marked streams — hazardous, recyclable, reusable and residual — so they never mix on the work floor.

## Storage and handling
Hazardous materials are double-bagged or drummed, labelled and kept in roofed, bunded and access-controlled stores, away from drains and the tidal zone.

## Recycling and disposal
Recyclable materials go to authorised buyers; hazardous wastes go only to approved treatment, storage and disposal operators, with documentation for every consignment.

## Environmental protection measures
Impermeable floors, oil-water separators, spill kits, booms and drainage control keep contaminants out of soil and coastal waters. Air, water and soil are monitored regularly.

## Waste treatment and management facilities
Green yards maintain dedicated hazardous-material stores, effluent treatment, incinerator or authorised disposal arrangements and decontamination units for workers.`,
    body_bn: `## বিপজ্জনক বর্জ্য ব্যবস্থাপনা
জাহাজের বিপজ্জনক উপকরণের তালিকা (আইএইচএম) দেখে অ্যাসবেস্টস, পিসিবি, ভারী ধাতু, অবশিষ্ট তেল, স্লাজ ও রেফ্রিজারেন্ট চিহ্নিত করা হয় এবং সাধারণ ভাঙা শুরুর আগেই প্রশিক্ষিত ও সুরক্ষিত দল সেগুলো অপসারণ করে।

## অ-বিপজ্জনক বর্জ্য ব্যবস্থাপনা
ইস্পাত, অলৌহ ধাতু, কাঠ, প্লাস্টিক, কাচ ও আসবাব উদ্ধার করে লাইসেন্সপ্রাপ্ত মাধ্যমে পুনঃব্যবহার বা পুনর্ব্যবহারের জন্য বিক্রি করা হয়।

## বর্জ্য পৃথকীকরণ
উৎসেই উপকরণগুলো সুস্পষ্টভাবে চিহ্নিত ধারায় আলাদা করা হয় — বিপজ্জনক, পুনর্ব্যবহারযোগ্য, পুনঃব্যবহারযোগ্য ও অবশিষ্ট — যাতে কর্ম-মেঝেতে কখনো মিশে না যায়।

## সংরক্ষণ ও পরিবহন
বিপজ্জনক উপকরণ দ্বিস্তর ব্যাগ বা ড্রামে ভরে, লেবেল লাগিয়ে, ছাদযুক্ত, বাঁধ-ঘেরা ও নিয়ন্ত্রিত প্রবেশের গুদামে রাখা হয় — ড্রেন ও জোয়ার-এলাকা থেকে দূরে।

## পুনর্ব্যবহার ও নিষ্কাশন
পুনর্ব্যবহারযোগ্য উপকরণ অনুমোদিত ক্রেতার কাছে যায়; বিপজ্জনক বর্জ্য কেবল অনুমোদিত শোধন, সংরক্ষণ ও নিষ্কাশন প্রতিষ্ঠানের কাছে — প্রতিটি চালানের নথিসহ।

## পরিবেশ সুরক্ষা ব্যবস্থা
অভেদ্য মেঝে, তেল-পানি বিভাজক, স্পিল কিট, বুম ও ড্রেনেজ নিয়ন্ত্রণ দূষণকারী পদার্থকে মাটি ও উপকূলীয় পানি থেকে দূরে রাখে। নিয়মিত বায়ু, পানি ও মাটির মান পর্যবেক্ষণ করা হয়।

## বর্জ্য শোধন ও ব্যবস্থাপনা সুবিধা
গ্রিন ইয়ার্ডে বিপজ্জনক উপকরণের নির্দিষ্ট গুদাম, বর্জ্যপানি শোধনাগার, অনুমোদিত নিষ্কাশন ব্যবস্থা এবং শ্রমিকদের জন্য ডিকন্টামিনেশন ইউনিট থাকে।`,
  }),
  page({
    slug: "safety",
    title_en: "Site safety & occupational health",
    title_bn: "সাইট নিরাপত্তা ও পেশাগত স্বাস্থ্য",
    summary_en: "Every worker goes home safe. These are the systems, equipment and training that make it possible.",
    summary_bn: "প্রত্যেক শ্রমিক নিরাপদে বাড়ি ফিরবেন। এটি সম্ভব করে যে ব্যবস্থা, সরঞ্জাম ও প্রশিক্ষণ।",
    body_en: `## Site safety measures
Clearly zoned work areas, controlled access, safe walkways, adequate lighting and daily supervisor inspections underpin every operation.

## Worker safety
Permit-to-work systems, job hazard analyses and toolbox talks ensure that every task is planned, briefed and supervised.

## PPE and safety equipment
Helmets, safety boots, gloves, goggles, face shields, fall-arrest harnesses, respirators and fire-retardant clothing are issued free of charge and their use is enforced.

## Fire safety
Fire-fighting equipment, trained fire teams, fire watches during hot work and regular drills reduce the risk of fire on board and ashore.

## Emergency response
Each yard maintains an emergency response plan, first-aid stations, trained first-aiders, ambulances and agreements with nearby hospitals.

## Gas-free and hot-work safety
No cutting begins until spaces are certified gas-free. Atmospheres are re-tested regularly, and hot work proceeds only under a valid permit.

## Occupational health
Pre-employment and periodic medical check-ups, health records and monitoring for exposure to asbestos, fumes and noise protect long-term health.

## Safety training and awareness
Induction for every new worker, task-specific training, refresher courses and awareness campaigns build a culture of safety.

## Worker welfare initiatives
Clean drinking water, canteens, rest areas, sanitation, insurance cover and welfare funds support workers and their families.`,
    body_bn: `## সাইট নিরাপত্তা ব্যবস্থা
সুস্পষ্টভাবে বিভক্ত কর্ম-এলাকা, নিয়ন্ত্রিত প্রবেশ, নিরাপদ চলাচলের পথ, পর্যাপ্ত আলো এবং সুপারভাইজারের দৈনিক পরিদর্শন প্রতিটি কাজের ভিত্তি।

## শ্রমিকের নিরাপত্তা
পারমিট-টু-ওয়ার্ক, কাজের ঝুঁকি বিশ্লেষণ ও টুলবক্স আলোচনার মাধ্যমে প্রতিটি কাজ পরিকল্পিত, ব্যাখ্যাকৃত ও তত্ত্বাবধানে সম্পন্ন হয়।

## পিপিই ও নিরাপত্তা সরঞ্জাম
হেলমেট, সেফটি বুট, গ্লাভস, গগলস, ফেস শিল্ড, ফল-অ্যারেস্ট হারনেস, রেসপিরেটর ও অগ্নিরোধী পোশাক বিনামূল্যে সরবরাহ করা হয় এবং এর ব্যবহার নিশ্চিত করা হয়।

## অগ্নি নিরাপত্তা
অগ্নিনির্বাপণ সরঞ্জাম, প্রশিক্ষিত ফায়ার টিম, হট-ওয়ার্কের সময় ফায়ার ওয়াচ এবং নিয়মিত মহড়া জাহাজে ও স্থলে আগুনের ঝুঁকি কমায়।

## জরুরি সাড়াদান
প্রতিটি ইয়ার্ডে জরুরি সাড়াদান পরিকল্পনা, প্রাথমিক চিকিৎসা কেন্দ্র, প্রশিক্ষিত কর্মী, অ্যাম্বুলেন্স এবং নিকটবর্তী হাসপাতালের সঙ্গে চুক্তি থাকে।

## গ্যাস-ফ্রি ও হট-ওয়ার্ক নিরাপত্তা
কোনো স্থান গ্যাস-ফ্রি সনদপ্রাপ্ত না হওয়া পর্যন্ত কাটিং শুরু হয় না। নিয়মিত বায়ু পুনঃপরীক্ষা করা হয় এবং বৈধ পারমিট ছাড়া হট-ওয়ার্ক হয় না।

## পেশাগত স্বাস্থ্য
নিয়োগপূর্ব ও নিয়মিত স্বাস্থ্য পরীক্ষা, স্বাস্থ্য রেকর্ড এবং অ্যাসবেস্টস, ধোঁয়া ও শব্দের সংস্পর্শ পর্যবেক্ষণ দীর্ঘমেয়াদি স্বাস্থ্য সুরক্ষা দেয়।

## নিরাপত্তা প্রশিক্ষণ ও সচেতনতা
প্রত্যেক নতুন শ্রমিকের জন্য প্রাথমিক পরিচিতি, কাজভিত্তিক প্রশিক্ষণ, রিফ্রেশার কোর্স ও সচেতনতা কর্মসূচি নিরাপত্তার সংস্কৃতি গড়ে তোলে।

## শ্রমিক কল্যাণ উদ্যোগ
বিশুদ্ধ পানীয় জল, ক্যান্টিন, বিশ্রামাগার, পয়ঃনিষ্কাশন, বিমা সুরক্ষা ও কল্যাণ তহবিল শ্রমিক ও তাঁদের পরিবারকে সহায়তা করে।`,
  }),
  page({
    slug: "labour",
    title_en: "Labour & welfare",
    title_bn: "শ্রম ও কল্যাণ",
    summary_en: "Fair, safe and dignified work is the foundation of a responsible industry.",
    summary_bn: "ন্যায্য, নিরাপদ ও মর্যাদাপূর্ণ কাজই দায়িত্বশীল শিল্পের ভিত্তি।",
    body_en: `## Worker welfare
Member yards provide appointment letters, wages through formal channels, accommodation support where needed, drinking water, canteens and rest areas.

## Occupational health & safety
Medical check-ups, health records, protective equipment and on-site medical facilities protect workers throughout their employment.

## Training and awareness
Induction, task-specific and refresher training — on cutting, rigging, hazardous materials, fire and first aid — is delivered with national and international partners.

## Labour welfare activities
Insurance cover for every worker, welfare funds, festival bonuses and support for workers' families in times of need.

## CSR and labour initiatives
Health camps, scholarships for workers' children and skills programmes that open new career paths.`,
    body_bn: `## শ্রমিক কল্যাণ
সদস্য ইয়ার্ডগুলো নিয়োগপত্র, আনুষ্ঠানিক মাধ্যমে মজুরি, প্রয়োজনে আবাসন সহায়তা, পানীয় জল, ক্যান্টিন ও বিশ্রামাগারের ব্যবস্থা করে।

## পেশাগত স্বাস্থ্য ও নিরাপত্তা
স্বাস্থ্য পরীক্ষা, স্বাস্থ্য রেকর্ড, সুরক্ষা সরঞ্জাম ও ইয়ার্ডে চিকিৎসা সুবিধা চাকরির পুরো সময় শ্রমিকদের সুরক্ষা দেয়।

## প্রশিক্ষণ ও সচেতনতা
জাতীয় ও আন্তর্জাতিক অংশীদারদের সঙ্গে কাটিং, রিগিং, বিপজ্জনক উপকরণ, অগ্নি ও প্রাথমিক চিকিৎসা বিষয়ে প্রাথমিক, কাজভিত্তিক ও রিফ্রেশার প্রশিক্ষণ দেওয়া হয়।

## শ্রম কল্যাণ কার্যক্রম
প্রত্যেক শ্রমিকের বিমা সুরক্ষা, কল্যাণ তহবিল, উৎসব ভাতা এবং প্রয়োজনের সময় শ্রমিক পরিবারকে সহায়তা।

## সিএসআর ও শ্রম উদ্যোগ
স্বাস্থ্য ক্যাম্প, শ্রমিকদের সন্তানদের জন্য বৃত্তি এবং নতুন কর্মজীবনের পথ খুলে দেওয়া দক্ষতা কর্মসূচি।`,
  }),
  page({
    slug: "tides",
    title_en: "Beaching guidance",
    title_bn: "বিচিং নির্দেশিকা",
    summary_en: "How tides govern beaching on the Sitakunda coast.",
    summary_bn: "সীতাকুণ্ড উপকূলে জোয়ার-ভাটা কীভাবে বিচিং নির্ধারণ করে।",
    body_en: `## Why tides matter
Vessels are run ashore at high water so that they come to rest as far up the intertidal beach as possible, where they can be safely accessed and dismantled at low water.

## Spring and neap tides
Around new and full moon, spring tides bring the highest high waters of the fortnight. Most beachings are planned for these windows.

## Planning a beaching
Combine the tide tables with weather and swell forecasts, the vessel's draught and the yard's beach profile. Confirm timings with the harbour authority and the pilot before committing.

## Data sources
Tide tables on this page are published annually by BSBRA from official hydrographic predictions. Always cross-check with the Chittagong Port Authority's tide tables.`,
    body_bn: `## কেন জোয়ার-ভাটা গুরুত্বপূর্ণ
ভরা জোয়ারে জাহাজকে সৈকতে তোলা হয়, যাতে সেটি আন্তঃজোয়ার সৈকতের যতটা সম্ভব ভেতরে স্থির হয় এবং ভাটার সময় নিরাপদে পৌঁছে কাটার কাজ করা যায়।

## ভরা ও মরা কাটাল
অমাবস্যা ও পূর্ণিমার কাছাকাছি সময়ে ভরা কাটালে পক্ষকালের সর্বোচ্চ জোয়ার হয়। অধিকাংশ বিচিং এই সময়েই পরিকল্পনা করা হয়।

## বিচিং পরিকল্পনা
জোয়ারের সারণির সঙ্গে আবহাওয়া ও ঢেউয়ের পূর্বাভাস, জাহাজের ড্রাফট এবং ইয়ার্ডের সৈকতের ঢাল বিবেচনা করুন। চূড়ান্ত করার আগে বন্দর কর্তৃপক্ষ ও পাইলটের সঙ্গে সময় নিশ্চিত করুন।

## তথ্যসূত্র
এই পৃষ্ঠার জোয়ার-ভাটার সারণি অফিসিয়াল হাইড্রোগ্রাফিক পূর্বাভাস থেকে বিএসবিআরএ প্রতি বছর প্রকাশ করে। সবসময় চট্টগ্রাম বন্দর কর্তৃপক্ষের সারণির সঙ্গে মিলিয়ে নিন।`,
  }),
  page({
    slug: "csr",
    title_en: "Corporate social responsibility",
    title_bn: "করপোরেট সামাজিক দায়বদ্ধতা",
    summary_en:
      "Our members have grown with the communities of Sitakunda. Through education, health, welfare and environmental programmes, we invest in their future.",
    summary_bn:
      "আমাদের সদস্যরা সীতাকুণ্ডের জনপদের সঙ্গে বেড়ে উঠেছেন। শিক্ষা, স্বাস্থ্য, কল্যাণ ও পরিবেশ কর্মসূচির মাধ্যমে আমরা তাদের ভবিষ্যতে বিনিয়োগ করি।",
    body_en: null,
    body_bn: null,
  }),
  page({
    slug: "international",
    title_en: "International initiatives",
    title_bn: "আন্তর্জাতিক উদ্যোগ",
    summary_en:
      "Ship recycling is a global industry. BSBRA works with the IMO, governments, classification societies, ship owners and development partners to raise standards worldwide.",
    summary_bn:
      "জাহাজ পুনর্ব্যবহার একটি বৈশ্বিক শিল্প। বিশ্বজুড়ে মান উন্নয়নে বিএসবিআরএ আইএমও, বিভিন্ন সরকার, ক্লাসিফিকেশন সোসাইটি, জাহাজমালিক ও উন্নয়ন সহযোগীদের সঙ্গে কাজ করে।",
    body_en: null,
    body_bn: null,
  }),
  page({
    slug: "privacy-policy",
    title_en: "Privacy policy",
    title_bn: "গোপনীয়তা নীতি",
    summary_en: "How BSBRA collects, uses and protects personal information on this platform.",
    summary_bn: "এই প্ল্যাটফর্মে বিএসবিআরএ কীভাবে ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার ও সুরক্ষা করে।",
    body_en: `## Information we collect
We collect the details you provide when you contact us or request an account — such as your name, organisation, email address and phone number — and basic, anonymised analytics about how the site is used.

## How we use it
We use your information to respond to enquiries, manage member and corporate accounts, and improve the platform. We do not sell personal information.

## Security
Data is stored with an access-controlled database provider, encrypted in transit, and visible only to authorised BSBRA personnel according to their role. All changes to records are logged.

## Your choices
You may ask us to correct or delete your personal information by contacting the secretariat.`,
    body_bn: `## আমরা যে তথ্য সংগ্রহ করি
আপনি যোগাযোগ বা অ্যাকাউন্টের অনুরোধ করার সময় যে তথ্য দেন — যেমন নাম, প্রতিষ্ঠান, ইমেইল ও ফোন নম্বর — এবং সাইট ব্যবহারের প্রাথমিক, নামহীন বিশ্লেষণ তথ্য আমরা সংগ্রহ করি।

## আমরা যেভাবে ব্যবহার করি
অনুসন্ধানের উত্তর দিতে, সদস্য ও কর্পোরেট অ্যাকাউন্ট পরিচালনা করতে এবং প্ল্যাটফর্ম উন্নত করতে আমরা আপনার তথ্য ব্যবহার করি। আমরা ব্যক্তিগত তথ্য বিক্রি করি না।

## নিরাপত্তা
তথ্য প্রবেশাধিকার-নিয়ন্ত্রিত ডেটাবেসে সংরক্ষিত থাকে, আদান-প্রদানের সময় এনক্রিপ্ট করা হয় এবং কেবল দায়িত্বপ্রাপ্ত বিএসবিআরএ কর্মীরা তাঁদের ভূমিকা অনুযায়ী দেখতে পারেন। রেকর্ডের সব পরিবর্তন লগে সংরক্ষিত হয়।

## আপনার অধিকার
সচিবালয়ে যোগাযোগ করে আপনি আপনার ব্যক্তিগত তথ্য সংশোধন বা মুছে ফেলার অনুরোধ করতে পারেন।`,
  }),
  page({
    slug: "terms-of-use",
    title_en: "Terms of use",
    title_bn: "ব্যবহারের শর্তাবলি",
    summary_en: "The terms that apply when you use the BSBRA platform.",
    summary_bn: "বিএসবিআরএ প্ল্যাটফর্ম ব্যবহারের ক্ষেত্রে প্রযোজ্য শর্তাবলি।",
    body_en: `## Use of information
Information on this platform is provided for general reference. While we take care to keep it accurate, official decisions should rely on the relevant authority's publications.

## Accounts
Member and corporate accounts are personal. Keep your credentials confidential and tell us promptly if you suspect unauthorised use.

## Intellectual property
Content, photographs and publications belong to BSBRA or their respective owners and may be reused only with attribution, unless stated otherwise.

## Changes
We may update these terms from time to time. Continued use of the platform means you accept the current terms.`,
    body_bn: `## তথ্যের ব্যবহার
এই প্ল্যাটফর্মের তথ্য সাধারণ রেফারেন্সের জন্য দেওয়া হয়েছে। নির্ভুল রাখতে আমরা যত্নশীল হলেও দাপ্তরিক সিদ্ধান্তের জন্য সংশ্লিষ্ট কর্তৃপক্ষের প্রকাশনার ওপর নির্ভর করা উচিত।

## অ্যাকাউন্ট
সদস্য ও কর্পোরেট অ্যাকাউন্ট ব্যক্তিগত। আপনার লগইন তথ্য গোপন রাখুন এবং অননুমোদিত ব্যবহারের সন্দেহ হলে দ্রুত আমাদের জানান।

## মেধাস্বত্ব
কনটেন্ট, ছবি ও প্রকাশনা বিএসবিআরএ বা সংশ্লিষ্ট মালিকের সম্পত্তি; ভিন্ন কিছু উল্লেখ না থাকলে সূত্র উল্লেখ করে পুনর্ব্যবহার করা যাবে।

## পরিবর্তন
আমরা সময়ে সময়ে এই শর্তাবলি হালনাগাদ করতে পারি। প্ল্যাটফর্মের ব্যবহার অব্যাহত রাখার অর্থ আপনি বর্তমান শর্তাবলি মেনে নিচ্ছেন।`,
  }),
];

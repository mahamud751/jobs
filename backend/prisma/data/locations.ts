export type AreaSeed = { en: string; bn: string; kind: "UPAZILA" | "THANA" };
export type DistrictSeed = {
  en: string;
  bn: string;
  code: string;
  active?: boolean;
  areas: AreaSeed[];
};
export type DivisionSeed = {
  en: string;
  bn: string;
  code: string;
  districts: DistrictSeed[];
};

const sadar: AreaSeed[] = [{ en: "Sadar", bn: "সদর", kind: "UPAZILA" }];

const dhakaAreas: AreaSeed[] = [
  { en: "Dhanmondi", bn: "ধানমন্ডি", kind: "THANA" },
  { en: "Gulshan", bn: "গুলশান", kind: "THANA" },
  { en: "Banani", bn: "বনানী", kind: "THANA" },
  { en: "Baridhara", bn: "বারিধারা", kind: "THANA" },
  { en: "Mirpur", bn: "মিরপুর", kind: "THANA" },
  { en: "Uttara", bn: "উত্তরা", kind: "THANA" },
  { en: "Mohammadpur", bn: "মোহাম্মদপুর", kind: "THANA" },
  { en: "Motijheel", bn: "মতিঝিল", kind: "THANA" },
  { en: "Tejgaon", bn: "তেজগাঁও", kind: "THANA" },
  { en: "Ramna", bn: "রমনা", kind: "THANA" },
  { en: "Shahbagh", bn: "শাহবাগ", kind: "THANA" },
  { en: "Lalbagh", bn: "লালবাগ", kind: "THANA" },
  { en: "Kotwali", bn: "কোতোয়ালি", kind: "THANA" },
  { en: "Sutrapur", bn: "সূত্রাপুর", kind: "THANA" },
  { en: "Demra", bn: "ডেমরা", kind: "THANA" },
  { en: "Khilgaon", bn: "খিলগাঁও", kind: "THANA" },
  { en: "Badda", bn: "বাড্ডা", kind: "THANA" },
  { en: "Cantonment", bn: "ক্যান্টনমেন্ট", kind: "THANA" },
  { en: "Pallabi", bn: "পল্লবী", kind: "THANA" },
  { en: "Jatrabari", bn: "যাত্রাবাড়ী", kind: "THANA" },
  { en: "Adabor", bn: "আদাবর", kind: "THANA" },
  { en: "Kafrul", bn: "কাফরুল", kind: "THANA" },
  { en: "Bimanbandar", bn: "বিমানবন্দর", kind: "THANA" },
  { en: "Khilkhet", bn: "খিলক্ষেত", kind: "THANA" },
  { en: "Shyampur", bn: "শ্যামপুর", kind: "THANA" },
  { en: "Hazaribagh", bn: "হাজারীবাগ", kind: "THANA" },
  { en: "New Market", bn: "নিউ মার্কেট", kind: "THANA" },
  { en: "Kalabagan", bn: "কলাবাগান", kind: "THANA" },
  { en: "Savar", bn: "সাভার", kind: "UPAZILA" },
  { en: "Dhamrai", bn: "ধামরাই", kind: "UPAZILA" },
  { en: "Keraniganj", bn: "কেরানীগঞ্জ", kind: "UPAZILA" },
  { en: "Nawabganj", bn: "নবাবগঞ্জ", kind: "UPAZILA" },
  { en: "Dohar", bn: "দোহার", kind: "UPAZILA" },
];

const chattogramAreas: AreaSeed[] = [
  { en: "Kotwali", bn: "কোতোয়ালি", kind: "THANA" },
  { en: "Double Mooring", bn: "ডবল মুরিং", kind: "THANA" },
  { en: "Pahartali", bn: "পাহাড়তলী", kind: "THANA" },
  { en: "Panchlaish", bn: "পাঁচলাইশ", kind: "THANA" },
  { en: "Chandgaon", bn: "চান্দগাঁও", kind: "THANA" },
  { en: "Bakalia", bn: "বাকলিয়া", kind: "THANA" },
  { en: "Bayazid", bn: "বায়েজিদ", kind: "THANA" },
  { en: "Halishahar", bn: "হালিশহর", kind: "THANA" },
  { en: "Khulshi", bn: "খুলশী", kind: "THANA" },
  { en: "Patenga", bn: "পতেঙ্গা", kind: "THANA" },
  { en: "Bandar", bn: "বন্দর", kind: "THANA" },
  { en: "Anwara", bn: "আনোয়ারা", kind: "UPAZILA" },
  { en: "Banshkhali", bn: "বাঁশখালী", kind: "UPAZILA" },
  { en: "Boalkhali", bn: "বোয়ালখালী", kind: "UPAZILA" },
  { en: "Chandanaish", bn: "চন্দনাইশ", kind: "UPAZILA" },
  { en: "Fatikchhari", bn: "ফটিকছড়ি", kind: "UPAZILA" },
  { en: "Hathazari", bn: "হাটহাজারী", kind: "UPAZILA" },
  { en: "Lohagara", bn: "লোহাগাড়া", kind: "UPAZILA" },
  { en: "Mirsharai", bn: "মীরসরাই", kind: "UPAZILA" },
  { en: "Patiya", bn: "পটিয়া", kind: "UPAZILA" },
  { en: "Rangunia", bn: "রাঙ্গুনিয়া", kind: "UPAZILA" },
  { en: "Raozan", bn: "রাউজান", kind: "UPAZILA" },
  { en: "Sandwip", bn: "সন্দ্বীপ", kind: "UPAZILA" },
  { en: "Satkania", bn: "সাতকানিয়া", kind: "UPAZILA" },
  { en: "Sitakunda", bn: "সীতাকুণ্ড", kind: "UPAZILA" },
];

function district(
  en: string,
  bn: string,
  code: string,
  active = false,
  areas: AreaSeed[] = sadar,
): DistrictSeed {
  return { en, bn, code, active, areas };
}

export const locations: DivisionSeed[] = [
  {
    en: "Dhaka",
    bn: "ঢাকা",
    code: "dhaka",
    districts: [
      district("Dhaka", "ঢাকা", "dhaka", true, dhakaAreas),
      district("Faridpur", "ফরিদপুর", "faridpur"),
      district("Gazipur", "গাজীপুর", "gazipur"),
      district("Gopalganj", "গোপালগঞ্জ", "gopalganj"),
      district("Kishoreganj", "কিশোরগঞ্জ", "kishoreganj"),
      district("Madaripur", "মাদারীপুর", "madaripur"),
      district("Manikganj", "মানিকগঞ্জ", "manikganj"),
      district("Munshiganj", "মুন্সীগঞ্জ", "munshiganj"),
      district("Narayanganj", "নারায়ণগঞ্জ", "narayanganj"),
      district("Narsingdi", "নরসিংদী", "narsingdi"),
      district("Rajbari", "রাজবাড়ী", "rajbari"),
      district("Shariatpur", "শরিয়তপুর", "shariatpur"),
      district("Tangail", "টাঙ্গাইল", "tangail"),
    ],
  },
  {
    en: "Chattogram",
    bn: "চট্টগ্রাম",
    code: "chattogram",
    districts: [
      district("Bandarban", "বান্দরবান", "bandarban"),
      district("Brahmanbaria", "ব্রাহ্মণবাড়িয়া", "brahmanbaria"),
      district("Chandpur", "চাঁদপুর", "chandpur"),
      district("Chattogram", "চট্টগ্রাম", "chattogram", true, chattogramAreas),
      district("Cumilla", "কুমিল্লা", "cumilla"),
      district("Cox's Bazar", "কক্সবাজার", "coxs-bazar"),
      district("Feni", "ফেনী", "feni"),
      district("Khagrachhari", "খাগড়াছড়ি", "khagrachhari"),
      district("Lakshmipur", "লক্ষ্মীপুর", "lakshmipur"),
      district("Noakhali", "নোয়াখালী", "noakhali"),
      district("Rangamati", "রাঙ্গামাটি", "rangamati"),
    ],
  },
  {
    en: "Rajshahi",
    bn: "রাজশাহী",
    code: "rajshahi",
    districts: [
      district("Bogura", "বগুড়া", "bogura"),
      district("Joypurhat", "জয়পুরহাট", "joypurhat"),
      district("Naogaon", "নওগাঁ", "naogaon"),
      district("Natore", "নাটোর", "natore"),
      district("Chapainawabganj", "চাঁপাইনবাবগঞ্জ", "chapainawabganj"),
      district("Pabna", "পাবনা", "pabna"),
      district("Rajshahi", "রাজশাহী", "rajshahi"),
      district("Sirajganj", "সিরাজগঞ্জ", "sirajganj"),
    ],
  },
  {
    en: "Khulna",
    bn: "খুলনা",
    code: "khulna",
    districts: [
      district("Bagerhat", "বাগেরহাট", "bagerhat"),
      district("Chuadanga", "চুয়াডাঙ্গা", "chuadanga"),
      district("Jashore", "যশোর", "jashore"),
      district("Jhenaidah", "ঝিনাইদহ", "jhenaidah"),
      district("Khulna", "খুলনা", "khulna"),
      district("Kushtia", "কুষ্টিয়া", "kushtia"),
      district("Magura", "মাগুরা", "magura"),
      district("Meherpur", "মেহেরপুর", "meherpur"),
      district("Narail", "নড়াইল", "narail"),
      district("Satkhira", "সাতক্ষীরা", "satkhira"),
    ],
  },
  {
    en: "Barishal",
    bn: "বরিশাল",
    code: "barishal",
    districts: [
      district("Barguna", "বরগুনা", "barguna"),
      district("Barishal", "বরিশাল", "barishal"),
      district("Bhola", "ভোলা", "bhola"),
      district("Jhalokati", "ঝালকাঠি", "jhalokati"),
      district("Patuakhali", "পটুয়াখালী", "patuakhali"),
      district("Pirojpur", "পিরোজপুর", "pirojpur"),
    ],
  },
  {
    en: "Sylhet",
    bn: "সিলেট",
    code: "sylhet",
    districts: [
      district("Habiganj", "হবিগঞ্জ", "habiganj"),
      district("Moulvibazar", "মৌলভীবাজার", "moulvibazar"),
      district("Sunamganj", "সুনামগঞ্জ", "sunamganj"),
      district("Sylhet", "সিলেট", "sylhet"),
    ],
  },
  {
    en: "Rangpur",
    bn: "রংপুর",
    code: "rangpur",
    districts: [
      district("Dinajpur", "দিনাজপুর", "dinajpur"),
      district("Gaibandha", "গাইবান্ধা", "gaibandha"),
      district("Kurigram", "কুড়িগ্রাম", "kurigram"),
      district("Lalmonirhat", "লালমনিরহাট", "lalmonirhat"),
      district("Nilphamari", "নীলফামারী", "nilphamari"),
      district("Panchagarh", "পঞ্চগড়", "panchagarh"),
      district("Rangpur", "রংপুর", "rangpur"),
      district("Thakurgaon", "ঠাকুরগাঁও", "thakurgaon"),
    ],
  },
  {
    en: "Mymensingh",
    bn: "ময়মনসিংহ",
    code: "mymensingh",
    districts: [
      district("Jamalpur", "জামালপুর", "jamalpur"),
      district("Mymensingh", "ময়মনসিংহ", "mymensingh"),
      district("Netrokona", "নেত্রকোনা", "netrokona"),
      district("Sherpur", "শেরপুর", "sherpur"),
    ],
  },
];

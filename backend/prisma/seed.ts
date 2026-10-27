import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  ApplicationStatus,
  ComplaintStatus,
  ComplaintType,
  DrivingCategory,
  EmployerType,
  JobStatus,
  JobType,
  LicenseClass,
  PlanInterval,
  PrismaClient,
  Role,
  VehicleType,
  VerificationStatus,
} from "../src/generated/prisma/client";
import * as bcrypt from "bcrypt";
import { locations } from "./data/locations";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function seedLocations() {
  for (const [index, division] of locations.entries()) {
    const savedDivision = await prisma.division.upsert({
      where: { code: division.code },
      create: { nameEn: division.en, nameBn: division.bn, code: division.code, sortOrder: index + 1 },
      update: { nameEn: division.en, nameBn: division.bn, sortOrder: index + 1 },
    });
    for (const district of division.districts) {
      const existing = await prisma.district.findUnique({ where: { code: district.code } });
      const saved = existing
        ? await prisma.district.update({
            where: { code: district.code },
            data: { nameEn: district.en, nameBn: district.bn, divisionId: savedDivision.id },
          })
        : await prisma.district.create({
            data: {
              divisionId: savedDivision.id,
              nameEn: district.en,
              nameBn: district.bn,
              code: district.code,
              serviceActive: !!district.active,
              launchedAt: district.active ? new Date() : null,
            },
          });
      for (const area of district.areas) {
        await prisma.area.upsert({
          where: { districtId_nameEn: { districtId: saved.id, nameEn: area.en } },
          create: { districtId: saved.id, nameEn: area.en, nameBn: area.bn, kind: area.kind },
          update: { nameBn: area.bn, kind: area.kind },
        });
      }
    }
  }
}

async function areaId(districtCode: string, nameEn: string) {
  const district = await prisma.district.findUniqueOrThrow({ where: { code: districtCode } });
  const area = await prisma.area.findUniqueOrThrow({
    where: { districtId_nameEn: { districtId: district.id, nameEn } },
  });
  return { districtId: district.id, areaId: area.id };
}

async function ensureUser(input: {
  phone: string;
  email?: string;
  name: string;
  password: string;
  role: Role;
  phoneVerified?: boolean;
}) {
  const existing = await prisma.user.findUnique({ where: { phone: input.phone } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      phone: input.phone,
      email: input.email,
      name: input.name,
      role: input.role,
      phoneVerified: input.phoneVerified ?? true,
      passwordHash: await bcrypt.hash(input.password, 10),
    },
  });
}

async function main() {
  await seedLocations();

  const plans = [
    ["FREE_JOB", "Free job post", "বিনামূল্যে বিজ্ঞাপন", "One standard job post.", "একটি সাধারণ চাকরির বিজ্ঞাপন।", 0, PlanInterval.ONE_TIME, true, false],
    ["PAID_JOB", "Paid job post", "পেইড জব পোস্ট", "Proposed price. Gateway not connected.", "প্রস্তাবিত মূল্য। পেমেন্ট গেটওয়ে এখনো যুক্ত নয়।", 500, PlanInterval.ONE_TIME, false, true],
    ["PREMIUM_AD", "Premium advertisement", "প্রিমিয়াম বিজ্ঞাপন", "Featured placement. Not billed yet.", "ফিচার্ড স্থান। এখন চার্জ করা হয় না।", 1500, PlanInterval.ONE_TIME, false, true],
    ["SEARCH_PACK", "Driver search pack", "ড্রাইভার সার্চ প্যাকেজ", "Highlighted search for employers.", "নিয়োগকর্তার জন্য হাইলাইট সার্চ।", 2000, PlanInterval.ONE_TIME, false, true],
    ["COMPANY_MONTHLY", "Company monthly", "কোম্পানি মাসিক", "Monthly company subscription.", "কোম্পানির মাসিক সাবস্ক্রিপশন।", 3000, PlanInterval.MONTHLY, false, true],
    ["COMPANY_YEARLY", "Company yearly", "কোম্পানি বার্ষিক", "Yearly company subscription.", "কোম্পানির বার্ষিক সাবস্ক্রিপশন।", 30000, PlanInterval.YEARLY, false, true],
    ["PLACEMENT_FEE", "Placement fee", "নিয়োগ সার্ভিস ফি", "Fee per successful hire. Rate not set.", "সফল নিয়োগে সার্ভিস ফি। হার এখনো নির্ধারিত নয়।", 0, PlanInterval.ONE_TIME, false, true],
  ] as const;
  for (const [code, nameEn, nameBn, descriptionEn, descriptionBn, priceBdt, interval, isActive, isFuture] of plans) {
    await prisma.plan.upsert({
      where: { code },
      create: { code, nameEn, nameBn, descriptionEn, descriptionBn, priceBdt, interval, isActive, isFuture, features: [] },
      update: { nameEn, nameBn, descriptionEn, descriptionBn, priceBdt, interval, isFuture },
    });
  }

  const pages = [
    {
      slug: "about",
      titleBn: "চালক সম্পর্কে",
      titleEn: "About Chalok",
      bodyBn: "চালক বাংলাদেশের ড্রাইভার নিয়োগ ও চাকরির প্ল্যাটফর্ম। গাড়ির মালিক, পরিবার ও প্রতিষ্ঠান এখানে ড্রাইভার খুঁজতে পারেন। ড্রাইভাররা নিজেদের যোগ্যতা অনুযায়ী চাকরি দেখে আবেদন করতে পারেন।\n\nপ্রথম পর্যায়ে সেবা চালু আছে ঢাকা ও চট্টগ্রামে। বিভাগ, জেলা ও উপজেলা বা থানার কাঠামো শুরু থেকেই সারা দেশের জন্য রাখা হয়েছে। নতুন জেলা চালু করতে সাইটের কোড বদলাতে হয় না — অ্যাডমিন প্যানেল থেকে সেই জেলার সেবা চালু করলেই হয়।\n\nলাইসেন্স নম্বর ও জাতীয় পরিচয় সাধারণ দর্শক দেখতে পান না। সার্চ থেকে ফোন নম্বর তখনই খোলে, যখন ড্রাইভার যোগাযোগের অনুমতি দেন। চাকরিতে আবেদন করলে সেই নিয়োগকর্তা আবেদনের জন্য ফোন নম্বর দেখতে পান।",
      bodyEn: "Chalok connects vehicle owners, families, and companies with drivers across Bangladesh. Drivers can publish a profile, read job posts, and apply online.\n\nDhaka and Chattogram are live first. Divisions, districts, and upazilas or thanas are already in the database, so opening another district does not require a new build. An admin turns that district on.\n\nLicense numbers and identity documents are not public. A phone number from search is shared only after the driver accepts. Applying for a job shares the driver's phone with that employer for the application.",
    },
    {
      slug: "privacy",
      titleBn: "গোপনীয়তা নীতি",
      titleEn: "Privacy policy",
      bodyBn: "আমরা অ্যাকাউন্ট, প্রোফাইল, লাইসেন্স যাচাই, চাকরির আবেদন ও যোগাযোগের জন্য তথ্য সংগ্রহ করি। এর মধ্যে নাম, মোবাইল, ঠিকানার এলাকা, গাড়ির ধরন, অভিজ্ঞতা এবং আপনি দিলে লাইসেন্স নম্বর ও পরিচয়পত্র থাকে।\n\nমোবাইল নম্বর, লাইসেন্স নম্বর, এনআইডি ও বিস্তারিত ঠিকানা প্রকাশ্য প্রোফাইলে দেখানো হয় না। লাইসেন্সের শ্রেণি নিয়োগের জন্য দেখানো হয়। চাকরিতে আবেদন করলে সেই নিয়োগকর্তা আপনার মোবাইল নম্বর দেখতে পান। সার্চ থেকে কেউ যোগাযোগ চাইলে আপনি না দিলে নম্বর যায় না।\n\nতথ্য প্ল্যাটফর্ম চালানো, যাচাই, নিয়োগ ও নিরাপত্তার জন্য ব্যবহার হয়। আপনি ড্যাশবোর্ড থেকে তথ্য রপ্তানি করতে এবং মুছে ফেলার অনুরোধ করতে পারেন। অনুরোধ অ্যাডমিন পর্যালোচনা করেন।\n\nএই নীতি একটি কার্যকর শুরু। প্রকাশের আগে স্থানীয় আইনজীবীর পর্যালোচনা নেওয়া উচিত।",
      bodyEn: "We collect account, profile, licence, application, and contact details so the marketplace can run. Public profiles hide your phone, licence number, NID, and street address. Licence class is visible because employers need it.\n\nApplying for a job shares your phone with that employer. A contact request from search shares your phone only if you accept.\n\nYou can export your data and request deletion from the dashboard. An administrator reviews deletion requests.\n\nThis is a working policy for the product. Have a lawyer review it before a public launch.",
    },
    {
      slug: "terms",
      titleBn: "শর্তাবলি",
      titleEn: "Terms of use",
      bodyBn: "চালক একটি পরিচিতি ও নিয়োগের প্ল্যাটফর্ম। আমরা ড্রাইভার বা নিয়োগকর্তার আচরণের নিশ্চয়তা দিই না। নিয়োগের চূড়ান্ত সিদ্ধান্ত, বেতন ও কাজের শর্ত পক্ষগুলোর।\n\nবিজ্ঞাপন প্রকাশের আগে অ্যাডমিন অনুমোদন লাগে। ভুয়া তথ্য, প্রতারণা বা হয়রানির অ্যাকাউন্ট বন্ধ করা হতে পারে। ব্যবহারকারী সঠিক তথ্য দিতে এবং অন্যের তথ্য অপব্যবহার না করতে রাজি হন।\n\nপ্রাথমিক সংস্করণে নিবন্ধন ও সাধারণ বিজ্ঞাপন বিনামূল্যে। ভবিষ্যতের পেইড সেবা আলাদাভাবে চালু হবে। তৃতীয় পক্ষের এসএমএস, ইমেইল বা পেমেন্ট চার্জ প্রযোজ্য হলে তা আলাদা।",
      bodyEn: "Chalok is a hiring marketplace. It does not guarantee a driver's conduct or an employer's offer. Pay and working terms are agreed by the parties.\n\nJob posts need admin approval. Fake listings, fraud, and harassment can lead to a blocked account. You agree to provide accurate information and not misuse someone else's contact details.\n\nRegistration and a standard job post are free in this version. Paid services, SMS, and payment-gateway fees will be separate when they are switched on.",
    },
    {
      slug: "help",
      titleBn: "সহায়তা",
      titleEn: "Help",
      bodyBn: "ড্রাইভার: মোবাইল দিয়ে অ্যাকাউন্ট খুলুন, প্রোফাইল ও গাড়ির ধরন যোগ করুন, তারপর মোবাইল যাচাই করুন। যাচাই না হলে প্রোফাইল সার্চে আসে না। লাইসেন্সের কপি দিলে অ্যাডমিন যাচাইয়ের স্ট্যাটাস বদলাতে পারেন।\n\nনিয়োগকর্তা: অ্যাকাউন্ট খুলে বিজ্ঞাপন পাঠান। অনুমোদনের পর সেটি প্রকাশ পায়। মেয়াদ শেষ হলে বিজ্ঞাপন নিজে থেকে বন্ধ হয়। আবেদনকারীর তালিকা থেকে পর্যালোচনা, সাক্ষাৎকার বা নিয়োগ চিহ্নিত করুন।\n\nড্রাইভার খুঁজলে ফোন সরাসরি খোলে না। যোগাযোগের অনুরোধ পাঠান। ড্রাইভার রাজি হলে নম্বর দেখা যাবে।\n\nনতুন জেলা চালু: অ্যাডমিন প্যানেলের এলাকা পাতায় জেলার সেবা চালু করুন। দরকার হলে উপজেলা বা থানা যোগ করুন।",
      bodyEn: "Drivers: register with a mobile number, add vehicles, then verify the number. Unverified profiles stay out of search. An admin can mark a licence as verified.\n\nEmployers: submit a job and wait for approval. It expires automatically. Review applicants and mark interview or hired.\n\nFinding a driver does not reveal a phone number. Send a contact request. The number appears only after the driver accepts.\n\nTo open a new district, turn the service on in the admin areas screen and add upazilas or thanas if needed.",
    },
  ];
  for (const page of pages) {
    await prisma.contentPage.upsert({ where: { slug: page.slug }, create: page, update: page });
  }

  await ensureUser({ phone: "01700000000", email: "admin@chalok.test", name: "Chalok Admin", password: "Admin@12345", role: Role.SUPER_ADMIN });
  await ensureUser({ phone: "01700000002", email: "content@chalok.test", name: "Content Manager", password: "Staff@12345", role: Role.CONTENT_MANAGER });
  await ensureUser({ phone: "01700000003", email: "support@chalok.test", name: "Support Staff", password: "Staff@12345", role: Role.SUPPORT });

  const tanvir = await ensureUser({ phone: "01722222221", email: "tanvir@chalok.test", name: "Tanvir Hasan", password: "Employer@12345", role: Role.EMPLOYER });
  const city = await ensureUser({ phone: "01722222222", email: "citylink@chalok.test", name: "CityLink Logistics", password: "Employer@12345", role: Role.EMPLOYER });
  const padma = await ensureUser({ phone: "01722222223", email: "padma@chalok.test", name: "Padma Transport", password: "Employer@12345", role: Role.EMPLOYER });
  const nusrat = await ensureUser({ phone: "01722222224", email: "nusrat@chalok.test", name: "Nusrat Jahan", password: "Employer@12345", role: Role.EMPLOYER });

  async function employer(userId: string, data: { type: EmployerType; displayName: string; companyName?: string; about: string; district: string; verified?: boolean }) {
    const place = await prisma.district.findUniqueOrThrow({ where: { code: data.district } });
    return prisma.employerProfile.upsert({
      where: { userId },
      create: {
        userId,
        type: data.type,
        displayName: data.displayName,
        companyName: data.companyName,
        about: data.about,
        districtId: place.id,
        isVerified: !!data.verified,
      },
      update: { about: data.about, isVerified: !!data.verified },
    });
  }

  const tanvirProfile = await employer(tanvir.id, { type: EmployerType.INDIVIDUAL, displayName: "তানভীর হাসান", about: "গুলশানে একটি পরিবারের গাড়ি। অভিজ্ঞ ও ভদ্র ড্রাইভার খুঁজছি।", district: "dhaka" });
  const cityProfile = await employer(city.id, { type: EmployerType.COMPANY, displayName: "সিটিলিংক লজিস্টিকস", companyName: "CityLink Logistics", about: "ঢাকায় অফিস পরিবহন ও হালকা বিতরণ।", district: "dhaka", verified: true });
  const padmaProfile = await employer(padma.id, { type: EmployerType.COMPANY, displayName: "পদ্মা ট্রান্সপোর্ট", companyName: "Padma Transport", about: "চট্টগ্রাম ও ঢাকায় বাণিজ্যিক পরিবহন।", district: "chattogram", verified: true });
  const nusratProfile = await employer(nusrat.id, { type: EmployerType.INDIVIDUAL, displayName: "নুসরাত জাহান", about: "হালিশহরে পারিবারিক গাড়ির জন্য ড্রাইভার।", district: "chattogram" });

  const deadline = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000);
  const jobs = [
    {
      slug: "private-car-driver-dhaka-demo1",
      employerId: tanvirProfile.id,
      title: "প্রাইভেট কার ড্রাইভার",
      description: "গুলশান এলাকায় একটি পরিবারের প্রাইভেট কার চালানোর জন্য অভিজ্ঞ ড্রাইভার নেওয়া হবে। সময়মতো আসা, নম্র আচরণ এবং শহরের রাস্তা চেনা বাধ্যতামূলক।",
      place: ["dhaka", "Gulshan"],
      areaText: "গুলশান ২",
      vehicleType: VehicleType.PRIVATE_CAR,
      salaryMin: 25000,
      salaryMax: 32000,
      workingHours: "সকাল ৮টা থেকে সন্ধ্যা ৬টা",
      holidays: "সাপ্তাহিক একদিন",
      experienceRequired: 3,
      licenseClass: LicenseClass.PROFESSIONAL_LIGHT,
      jobType: JobType.FULL_TIME,
      drivingCategory: DrivingCategory.PERSONAL,
      status: JobStatus.ACTIVE,
      featured: true,
    },
    {
      slug: "microbus-driver-dhaka-demo2",
      employerId: cityProfile.id,
      title: "অফিস মাইক্রোবাস ড্রাইভার",
      description: "মতিঝিল অফিসের স্টাফ আনা-নেওয়ার জন্য মাইক্রোবাস ড্রাইভার। সকালের শিফট ঠিক রাখতে হবে। লাইসেন্স যাচাই করা হবে।",
      place: ["dhaka", "Motijheel"],
      areaText: "দিলকুশা",
      vehicleType: VehicleType.MICROBUS,
      salaryMin: 28000,
      salaryMax: 35000,
      workingHours: "সকাল ৭টা থেকে বিকেল ৫টা",
      holidays: "শুক্রবার",
      experienceRequired: 4,
      licenseClass: LicenseClass.MEDIUM,
      jobType: JobType.FULL_TIME,
      drivingCategory: DrivingCategory.OFFICE,
      status: JobStatus.ACTIVE,
      featured: false,
    },
    {
      slug: "pickup-driver-dhaka-demo3",
      employerId: cityProfile.id,
      title: "পিকআপ বিতরণ ড্রাইভার",
      description: "তেজগাঁও থেকে শহরের ভেতরে হালকা মাল বিতরণ। পিকআপ ভ্যান চালানোর অভিজ্ঞতা থাকতে হবে।",
      place: ["dhaka", "Tejgaon"],
      areaText: "তেজগাঁও শিল্প এলাকা",
      vehicleType: VehicleType.PICKUP,
      salaryMin: 26000,
      salaryMax: 30000,
      workingHours: "সকাল ৯টা থেকে সন্ধ্যা ৬টা",
      holidays: "সাপ্তাহিক একদিন",
      experienceRequired: 5,
      licenseClass: LicenseClass.PROFESSIONAL_LIGHT,
      jobType: JobType.FULL_TIME,
      drivingCategory: DrivingCategory.COMMERCIAL,
      status: JobStatus.ACTIVE,
      featured: false,
    },
    {
      slug: "private-car-driver-chattogram-demo4",
      employerId: nusratProfile.id,
      title: "পারিবারিক গাড়ির ড্রাইভার",
      description: "হালিশহরে একটি পরিবারের গাড়ি। স্কুল আনা-নেওয়া ও বাজারের কাজ। আবাসিক এলাকায় কাজের অভিজ্ঞতা অগ্রাধিকার।",
      place: ["chattogram", "Halishahar"],
      areaText: "হালিশহর",
      vehicleType: VehicleType.PRIVATE_CAR,
      salaryMin: 20000,
      salaryMax: 24000,
      workingHours: "সকাল ৭টা থেকে বিকেল ৪টা",
      holidays: "সাপ্তাহিক একদিন",
      experienceRequired: 2,
      licenseClass: LicenseClass.NON_PROFESSIONAL_LIGHT,
      jobType: JobType.FULL_TIME,
      drivingCategory: DrivingCategory.RESIDENTIAL,
      status: JobStatus.ACTIVE,
      featured: true,
    },
    {
      slug: "truck-driver-chattogram-demo5",
      employerId: padmaProfile.id,
      title: "কন্ট্রাক্ট ট্রাক ড্রাইভার",
      description: "পটিয়া থেকে চট্টগ্রাম বন্দর এলাকায় মালামাল পরিবহন। ভারী যানবাহনের লাইসেন্স লাগবে। চুক্তিভিত্তিক নিয়োগ।",
      place: ["chattogram", "Patiya"],
      areaText: "পটিয়া",
      vehicleType: VehicleType.TRUCK,
      salaryMin: 35000,
      salaryMax: 45000,
      workingHours: "কাজের দিন অনুযায়ী",
      holidays: "চুক্তি অনুযায়ী",
      experienceRequired: 7,
      licenseClass: LicenseClass.HEAVY,
      jobType: JobType.CONTRACT,
      drivingCategory: DrivingCategory.COMMERCIAL,
      status: JobStatus.ACTIVE,
      featured: false,
    },
    {
      slug: "part-time-driver-dhaka-demo6",
      employerId: tanvirProfile.id,
      title: "পার্ট-টাইম ব্যক্তিগত ড্রাইভার",
      description: "বনানীতে সন্ধ্যায় ও সাপ্তাহিক ছুটির দিনে গাড়ি চালানোর জন্য পার্ট-টাইম ড্রাইভার।",
      place: ["dhaka", "Banani"],
      areaText: "বনানী",
      vehicleType: VehicleType.PRIVATE_CAR,
      salaryMin: 15000,
      salaryMax: 18000,
      workingHours: "সন্ধ্যা ৫টা থেকে রাত ১০টা",
      holidays: "আলোচনাসাপেক্ষ",
      experienceRequired: 2,
      licenseClass: LicenseClass.PROFESSIONAL_LIGHT,
      jobType: JobType.PART_TIME,
      drivingCategory: DrivingCategory.PERSONAL,
      status: JobStatus.PENDING_APPROVAL,
      featured: false,
    },
    {
      slug: "pool-car-chattogram-demo7",
      employerId: padmaProfile.id,
      title: "পুল কার ড্রাইভার",
      description: "অফিস পুল কার। বিবরণে কর্মঘণ্টা ও বেতন পরিষ্কার নয় বলে এটি নমুনা বাতিল বিজ্ঞাপন।",
      place: ["chattogram", "Double Mooring"],
      areaText: "আগ্রাবাদ",
      vehicleType: VehicleType.PRIVATE_CAR,
      salaryMin: 18000,
      salaryMax: 18000,
      workingHours: "নির্ধারিত নয়",
      holidays: "নির্ধারিত নয়",
      experienceRequired: 1,
      licenseClass: LicenseClass.PROFESSIONAL_LIGHT,
      jobType: JobType.FULL_TIME,
      drivingCategory: DrivingCategory.OFFICE,
      status: JobStatus.REJECTED,
      featured: false,
      rejectionReason: "বেতন ও কর্মঘণ্টা স্পষ্ট করে আবার পাঠান।",
    },
  ] as const;

  const jobIds: Record<string, string> = {};
  for (const job of jobs) {
    const place = await areaId(job.place[0], job.place[1]);
    const saved = await prisma.jobPost.upsert({
      where: { slug: job.slug },
      create: {
        slug: job.slug,
        employerId: job.employerId,
        title: job.title,
        description: job.description,
        districtId: place.districtId,
        areaId: place.areaId,
        areaText: job.areaText,
        vehicleType: job.vehicleType,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        workingHours: job.workingHours,
        holidays: job.holidays,
        experienceRequired: job.experienceRequired,
        licenseClass: job.licenseClass,
        jobType: job.jobType,
        drivingCategory: job.drivingCategory,
        deadline,
        expiresAt: job.status === JobStatus.ACTIVE ? deadline : null,
        status: job.status,
        featured: job.featured,
        approvedAt: job.status === JobStatus.ACTIVE ? new Date() : null,
        rejectionReason: "rejectionReason" in job ? job.rejectionReason : null,
        applyInstructions: "অনলাইনে আবেদন করুন। নিয়োগকর্তা ড্যাশবোর্ড থেকে যোগাযোগ করবেন।",
      },
      update: { status: job.status, title: job.title },
    });
    jobIds[job.slug] = saved.id;
  }

  const drivers = [
    ["01711111111", "rahim@chalok.test", "রহিম উদ্দিন", "dhaka", "Dhanmondi", [VehicleType.PRIVATE_CAR], 8, 20000, 25000, JobType.FULL_TIME, [DrivingCategory.PERSONAL, DrivingCategory.RESIDENTIAL], LicenseClass.PROFESSIONAL_LIGHT, VerificationStatus.VERIFIED, "এসএসসি", "ঢাকার ভেতরে আট বছর প্রাইভেট কার চালিয়েছি।"],
    ["01711111112", "karim@chalok.test", "করিম হোসেন", "dhaka", "Uttara", [VehicleType.MICROBUS, VehicleType.PRIVATE_CAR], 6, 22000, 28000, JobType.FULL_TIME, [DrivingCategory.OFFICE], LicenseClass.MEDIUM, VerificationStatus.VERIFIED, "এইচএসসি", "অফিস মাইক্রোবাস ও প্রাইভেট কার — দুটোই চালাই।"],
    ["01711111113", "jahangir@chalok.test", "জাহাঙ্গীর আলম", "dhaka", "Tejgaon", [VehicleType.PICKUP, VehicleType.COVERED_VAN], 10, 25000, 30000, JobType.FULL_TIME, [DrivingCategory.COMMERCIAL], LicenseClass.PROFESSIONAL_LIGHT, VerificationStatus.VERIFIED, "এসএসসি", "পিকআপ ও কাভার্ড ভ্যানে মাল বিতরণের অভিজ্ঞতা।"],
    ["01711111114", "shafiq@chalok.test", "শফিকুল ইসলাম", "chattogram", "Halishahar", [VehicleType.PRIVATE_CAR], 4, 18000, 22000, JobType.FULL_TIME, [DrivingCategory.PERSONAL], LicenseClass.NON_PROFESSIONAL_LIGHT, VerificationStatus.VERIFIED, "এসএসসি", "চট্টগ্রাম শহরে পারিবারিক গাড়ি চালাই।"],
    ["01711111115", "nasrin@chalok.test", "নাসরিন আক্তার", "dhaka", "Gulshan", [VehicleType.PRIVATE_CAR], 5, 28000, 35000, JobType.FULL_TIME, [DrivingCategory.RESIDENTIAL, DrivingCategory.PERSONAL], LicenseClass.PROFESSIONAL_LIGHT, VerificationStatus.VERIFIED, "স্নাতক", "আবাসিক এলাকায় পরিবারের গাড়ি চালানোর অভিজ্ঞতা।"],
    ["01711111116", "mojnu@chalok.test", "মজনু মিয়া", "chattogram", "Patiya", [VehicleType.TRUCK], 12, 30000, 40000, JobType.CONTRACT, [DrivingCategory.COMMERCIAL], LicenseClass.HEAVY, VerificationStatus.VERIFIED, "অষ্টম শ্রেণি", "ভারী ট্রাকে জেলা ও বন্দর এলাকায় কাজ করেছি।"],
    ["01711111117", "faruk@chalok.test", "ফারুক আহমেদ", "dhaka", "Motijheel", [VehicleType.PRIVATE_CAR], 3, 15000, 20000, JobType.PART_TIME, [DrivingCategory.OFFICE], LicenseClass.PROFESSIONAL_LIGHT, VerificationStatus.PENDING, "এইচএসসি", "পার্ট-টাইম অফিস গাড়ি। লাইসেন্স যাচাই এখনো বাকি।"],
    ["01711111118", "sumon@chalok.test", "সুমন চন্দ্র দাস", "chattogram", "Khulshi", [VehicleType.MICROBUS], 7, 20000, 26000, JobType.FULL_TIME, [DrivingCategory.OFFICE], LicenseClass.MEDIUM, VerificationStatus.VERIFIED, "এসএসসি", "খুলশী ও আগ্রাবাদ এলাকায় মাইক্রোবাস চালাই।"],
  ] as const;

  const driverIds: Record<string, string> = {};
  for (const row of drivers) {
    const [phone, email, fullName, districtCode, areaName, vehicles, years, minSalary, maxSalary, preference, categories, license, verification, education, bio] = row;
    const user = await ensureUser({ phone, email, name: fullName, password: "Driver@12345", role: Role.DRIVER });
    const place = await areaId(districtCode, areaName);
    const profile = await prisma.driverProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        fullName,
        bio,
        districtId: place.districtId,
        areaId: place.areaId,
        workDistrictId: place.districtId,
        licenseClass: license,
        licenseNumber: `DEMO-${phone.slice(-4)}`,
        licenseExpiry: new Date("2028-12-31"),
        experienceYears: years,
        expectedSalaryMin: minSalary,
        expectedSalaryMax: maxSalary,
        jobPreference: preference,
        drivingCategories: [...categories],
        verificationStatus: verification,
        verifiedAt: verification === VerificationStatus.VERIFIED ? new Date() : null,
        educationLevel: education,
        addressLine: "নমুনা ঠিকানা — প্রকাশ্য প্রোফাইলে দেখানো হয় না",
      },
      update: { bio, verificationStatus: verification },
    });
    await prisma.driverVehicle.deleteMany({ where: { driverId: profile.id } });
    await prisma.driverVehicle.createMany({ data: vehicles.map((type) => ({ driverId: profile.id, type })) });
    const exp = await prisma.workExperience.findFirst({ where: { driverId: profile.id } });
    if (!exp) {
      await prisma.workExperience.create({
        data: {
          driverId: profile.id,
          employer: "পূর্বের নিয়োগকর্তা",
          role: "ড্রাইভার",
          vehicleType: vehicles[0],
          category: categories[0],
          startYear: 2024 - years,
          endYear: 2025,
          description: "নিয়মিত শহর ও আশপাশের রুট।",
        },
      });
    }
    driverIds[phone] = profile.id;
  }

  const applications = [
    [driverIds["01711111111"], jobIds["private-car-driver-dhaka-demo1"], ApplicationStatus.SUBMITTED, "গুলশানে কাজ করতে আগ্রহী।"],
    [driverIds["01711111112"], jobIds["microbus-driver-dhaka-demo2"], ApplicationStatus.UNDER_REVIEW, "মাইক্রোবাস ছয় বছর চালিয়েছি।"],
    [driverIds["01711111115"], jobIds["private-car-driver-dhaka-demo1"], ApplicationStatus.INTERVIEW, "আগামী সপ্তাহে কথা বলতে পারি।"],
    [driverIds["01711111117"], jobIds["part-time-driver-dhaka-demo6"], ApplicationStatus.SUBMITTED, "পার্ট-টাইম সময় মিলবে।"],
  ] as const;
  for (const [driverId, jobId, status, note] of applications) {
    if (!driverId || !jobId) continue;
    await prisma.application.upsert({
      where: { jobId_driverId: { jobId, driverId } },
      create: {
        jobId,
        driverId,
        status,
        coverNote: note,
        history: { create: { status, note, actorId: null } },
      },
      update: { status },
    });
  }

  const nasrin = await prisma.driverProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { phone: "01711111115" } })).id } });
  const existingContact = await prisma.contactRequest.findFirst({ where: { fromUserId: tanvir.id, driverId: nasrin.id } });
  if (!existingContact) {
    await prisma.contactRequest.create({
      data: {
        fromUserId: tanvir.id,
        toUserId: nasrin.userId,
        driverId: nasrin.id,
        message: "গুলশানের গাড়ির জন্য কথা বলতে চাই।",
      },
    });
  }

  const complaint = await prisma.complaint.findFirst({ where: { againstJobId: jobIds["pool-car-chattogram-demo7"] } });
  if (!complaint) {
    await prisma.complaint.create({
      data: {
        reporterId: (await prisma.user.findUniqueOrThrow({ where: { phone: "01711111111" } })).id,
        againstJobId: jobIds["pool-car-chattogram-demo7"],
        type: ComplaintType.FAKE_JOB,
        description: "এই বিজ্ঞাপনে বেতন ও সময় পরিষ্কার নয়। দয়া করে দেখে নিন।",
        status: ComplaintStatus.OPEN,
      },
    });
  }

  console.log("Seed complete");
  console.log("Admin 01700000000 / Admin@12345");
  console.log("Driver 01711111111 / Driver@12345");
  console.log("Employer 01722222221 / Employer@12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

#!/usr/bin/env node
/**
 * seed-leads-from-slack.mjs
 *
 * Inserts leads scraped from #leads Slack channel into the Prisma `leads` table.
 * Deduplicates by phone number. Run from backend/:
 *   node scripts/seed-leads-from-slack.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Lead data extracted from Slack #leads channel
// ---------------------------------------------------------------------------

const leads = [
  // ── NAIL SALONS (20) ────────────────────────────────────────────────────
  { name: "Solar Nails and Spa", phone: "(573) 582-1177", address: "4690 S Clark St, Mexico, MO 65265", rating: 4.6, reviews: 341, businessType: "Nail Salon" },
  { name: "Nails Tip", phone: "(573) 581-0015", address: "1108 E Liberty St, Mexico, MO 65265", rating: 3.9, reviews: 74, businessType: "Nail Salon" },
  { name: "Chloe Nails", phone: "(573) 592-4888", address: "1879 N Bluff St, Fulton, MO 65251", rating: 4.1, reviews: 117, businessType: "Nail Salon" },
  { name: "Sugar Nails", phone: "(573) 673-8091", address: "518 Court St, Fulton, MO 65251", rating: 5, reviews: 22, businessType: "Nail Salon" },
  { name: "Serenity Therapeutic Massage, Spa & Salon", phone: "(573) 581-9575", address: "1816 E Liberty St, Mexico, MO 65265", rating: 4.7, reviews: 57, businessType: "Nail Salon" },
  { name: "Vicki's Trend-Setter", phone: "(573) 581-3820", address: "114 E Whitley, Mexico, MO 65265", rating: 4.9, reviews: 31, businessType: "Nail Salon" },
  { name: "Queen Nails", phone: "(573) 667-6868", address: "5614 E St Charles Rd Suite C, Columbia, MO 65202", rating: 4.5, reviews: 270, website: "queennailscolumbia.com", businessType: "Nail Salon" },
  { name: "The Edge Salon & Spa", phone: "(573) 592-8188", address: "101 E St Eunice Rd, Fulton, MO 65251", rating: 4.7, reviews: 44, businessType: "Nail Salon" },
  { name: "Aura Nails", phone: "(573) 228-6975", address: "2716 Paris Rd suite 6, Columbia, MO 65202", rating: 4.9, reviews: 263, website: "auranailscomo.com", businessType: "Nail Salon" },
  { name: "Pro nail spa 2", phone: "(573) 228-6057", address: "21 Conley Rd Ste T, Columbia, MO 65201", rating: 5, reviews: 45, businessType: "Nail Salon" },
  { name: "Spa Nails II Columbia", phone: "(573) 228-9354", address: "600 Cooper Dr N Suite 101, Columbia, MO 65201", rating: 4.7, reviews: 884, businessType: "Nail Salon" },
  { name: "Dreamy Nails", phone: "(573) 488-0049", address: "108 W Broadway, Ashland, MO 65010", rating: 4.3, reviews: 26, businessType: "Nail Salon" },
  { name: "FAIRY Nails and Spa", phone: "(870) 333-6718", address: "1325 Grindstone Plaza Dr. #104, Columbia, MO 65201", rating: 4.7, reviews: 99, website: "fairynailscomo.com", businessType: "Nail Salon" },
  { name: "COCOA Nail Spa", phone: "(636) 465-3986", address: "520 Warren County Ctr, Warrenton, MO 63383", rating: 5, reviews: 365, website: "cocoanail.com", businessType: "Nail Salon" },
  { name: "Bombshells Salon & Spa", phone: "(573) 544-5942", address: "8 W 6th St, Fulton, MO 65251", rating: 5, reviews: 41, website: "bombshellssalonspa.com", businessType: "Nail Salon" },
  { name: "Nara nails", phone: "(573) 814-1415", address: "3305 Clark Ln STE E, Columbia, MO 65202", rating: 4.3, reviews: 81, businessType: "Nail Salon" },
  { name: "My Perfect Nails", phone: "(573) 228-6079", address: "2601 Rangeline St #107, Columbia, MO 65202", rating: 4.5, reviews: 200, website: "myperfectnails.com", businessType: "Nail Salon" },
  { name: "Spa Nails 1", phone: "(573) 228-6716", address: "805 E Nifong Blvd suite a, Columbia, MO 65201", rating: 4.5, reviews: 428, website: "spanails1columbiamo.com", businessType: "Nail Salon" },
  { name: "SueSan Nails Spa Columbia", phone: "(573) 239-6796", address: "1729 W Broadway #13, Columbia, MO 65203", rating: 4.9, reviews: 137, website: "suesannailspa.com", businessType: "Nail Salon" },
  { name: "JIMMY NAILS", phone: "(573) 823-0961", address: "1305 Grindstone Pkwy STE 105, Columbia, MO 65201", rating: 4.8, reviews: 126, website: "jimmynailsandspa.com", businessType: "Nail Salon" },

  // ── HAIR SALONS (18) ───────────────────────────────────────────────────
  { name: "Studio 306 West Hair Salon", phone: "(573) 256-1104", address: "1200 E Walnut St suite 106, Columbia, MO 65201", rating: 4.9, reviews: 364, businessType: "Hair Salon" },
  { name: "Hair Therapy Salon & Day Spa", phone: "(573) 474-4555", address: "2411 N Stadium Blvd, Columbia, MO 65202", rating: 4.9, reviews: 594, website: "hairtherapysalonanddayspa.com", businessType: "Hair Salon" },
  { name: "Broadway Hair Co.", phone: "(573) 443-0731", address: "1001 Cherry St #101, Columbia, MO 65201", rating: 4.7, reviews: 240, website: "broadwayhairco.com", businessType: "Hair Salon" },
  { name: "Green Meadows Hair Co & Spa", phone: "(573) 255-0167", address: "209 Grn Mdws Rd STE C, Columbia, MO 65203", rating: 4.7, reviews: 118, website: "greenmeadowshairco.com", businessType: "Hair Salon" },
  { name: "The Strand Salon and Spa", phone: "(573) 875-3008", address: "1100 Club Village Dr # 105, Columbia, MO 65203", rating: 4.5, reviews: 256, website: "thestrandsalonandspa.com", businessType: "Hair Salon" },
  { name: "Great Reflections Salon & Spa", phone: "(573) 657-4636", address: "501 Henry Clay Blvd, Ashland, MO 65010", rating: 4.8, reviews: 50, businessType: "Hair Salon" },
  { name: "mk LUSH Salon and Spa", phone: "(573) 777-1030", address: "1006 Artist Alley, Columbia, MO 65201", rating: 4.8, reviews: 181, website: "mklush.com", businessType: "Hair Salon" },
  { name: "Great Clips", phone: "(573) 874-1415", address: "2703 E Broadway Ste 228, Columbia, MO 65201", rating: 4.1, reviews: 300, businessType: "Hair Salon" },
  { name: "The Formula Salon", phone: "(573) 817-2566", address: "4603 John Garry Dr #4, Columbia, MO 65203", rating: 4.9, reviews: 56, website: "theformulasalon.com", businessType: "Hair Salon" },
  { name: "Foxy Boss Salon", phone: "(573) 607-3699", address: "28 N 9th St, Columbia, MO 65201", rating: 4.8, reviews: 74, website: "foxybosssalon.com", businessType: "Hair Salon" },
  { name: "Salon Nefisa", phone: "(573) 507-6328", address: "3304 W Broadway Business Park Ct Suite A, Columbia, MO 65203", rating: 4.6, reviews: 93, website: "salonnefisa.com", businessType: "Hair Salon" },
  { name: "The Hilltop Salon", phone: "(573) 642-6318", address: "6381 State Road Z, Fulton, MO 65251", rating: 5, reviews: 44, businessType: "Hair Salon" },
  { name: "Twisted Shears", phone: "(573) 673-7951", address: "1301 Vandiver Dr G, Columbia, MO 65202", rating: 4.8, reviews: 66, website: "twistedshearscomo.com", businessType: "Hair Salon" },
  { name: "The Clip Joint Salon & Spa", phone: "(573) 445-3176", address: "1608 Chapel Hill Rd Suite A, Columbia, MO 65203", rating: 4.6, reviews: 188, website: "theclipjointsalon.com", businessType: "Hair Salon" },
  { name: "Ell & Co Salon & Spa", phone: "(573) 443-4949", address: "30 E Southampton Dr UNIT 115, Columbia, MO 65203", rating: 4.9, reviews: 52, website: "ellandcompany.com", businessType: "Hair Salon" },
  { name: "Trendie's Salon", phone: "(573) 582-0399", address: "110 N Jefferson St, Mexico, MO 65265", rating: 4.6, reviews: 67, businessType: "Hair Salon" },
  { name: "Studio 1 Salon Co.", phone: "(573) 634-2127", address: "801 W High St, Jefferson City, MO 65101", rating: 4.9, reviews: 493, website: "studio1jeffcity.com", businessType: "Hair Salon" },
  { name: "Salon Envie", phone: "(573) 442-5433", address: "212 Grn Mdws Rd, Columbia, MO 65203", rating: 4.7, reviews: 92, website: "salonenvie.com", businessType: "Hair Salon" },

  // ── BARBER SHOPS (18) ──────────────────────────────────────────────────
  { name: "Clean Cut Barbershop", phone: "(573) 442-1904", address: "510 Grn Mdws Rd STE 105, Columbia, MO 65201", website: "cleancutmidmo.com", businessType: "Barber Shop" },
  { name: "RD FIRST CLASS BARBER SHOP LLC", phone: "(573) 810-1114", address: "607 N Providence Rd, Columbia, MO 65203", rating: 5, reviews: 193, businessType: "Barber Shop" },
  { name: "Pro Kutz Barbershop", phone: "(573) 442-5811", address: "1004 Old 63 N, Columbia, MO 65202", rating: 4.6, reviews: 48, businessType: "Barber Shop" },
  { name: "Elite Barber Shop", phone: "(573) 214-2842", address: "3601 Buttonwood Dr, Columbia, MO 65201", rating: 4.7, reviews: 255, website: "elitebarbershop.org", businessType: "Barber Shop" },
  { name: "Studio 104 Barbershop", phone: "(573) 507-0258", address: "2101 Corona Rd Ste 103 Studio 104, Columbia, MO 65203", rating: 5, reviews: 31, website: "studio104barbershop.com", businessType: "Barber Shop" },
  { name: "Southside Barber Shop", phone: "(573) 310-6191", address: "1210 N Bluff St, Fulton, MO 65251", rating: 4.7, reviews: 78, businessType: "Barber Shop" },
  { name: "Big Four Barber Shop", phone: "(573) 642-2466", address: "109 W 5th St, Fulton, MO 65251", rating: 4.9, reviews: 129, businessType: "Barber Shop" },
  { name: "Tj's Barber Shop", phone: "(573) 442-9835", address: "915 Business Loop 70 E, Columbia, MO 65201", rating: 4.8, reviews: 32, businessType: "Barber Shop" },
  { name: "The Como Barbershop", phone: "(573) 550-4888", address: "20 N 2nd St A, Columbia, MO 65203", rating: 4.8, reviews: 60, website: "thecomobarbershop.com", businessType: "Barber Shop" },
  { name: "M.Boss Barber and Salon", phone: "(573) 443-2677", address: "26 N 9th St, Columbia, MO 65201", rating: 4.6, reviews: 248, website: "mbossbarber.com", businessType: "Barber Shop" },
  { name: "Renz Blendz Barbershop", phone: "(573) 424-7522", address: "32 N 8th St, Columbia, MO 65201", rating: 4.6, reviews: 60, businessType: "Barber Shop" },
  { name: "Art of Fadez Studio LLC", phone: "(573) 607-9124", address: "2601 Rangeline St suite105, Columbia, MO 65202", rating: 4.5, reviews: 68, businessType: "Barber Shop" },
  { name: "Diamond Cutz Barber Studio", phone: "(573) 424-7520", address: "2101 W Broadway #206, Columbia, MO 65203", rating: 4.6, reviews: 36, website: "diamondcutzcomo.com", businessType: "Barber Shop" },
  { name: "LT's Barber Shop", phone: "(573) 488-0202", address: "127 E Broadway, Ashland, MO 65010", rating: 4.9, reviews: 23, businessType: "Barber Shop" },
  { name: "Fuz Kutz LLC.", phone: "(573) 289-8328", address: "1002 Old 63 N, Columbia, MO 65201", rating: 4.8, reviews: 17, businessType: "Barber Shop" },
  { name: "Tiger Barber Shop", phone: "(573) 449-5951", address: "118 S 9th St, Columbia, MO 65201", rating: 4.8, reviews: 153, businessType: "Barber Shop" },
  { name: "Centralia Barber Shop", phone: "(573) 682-2242", address: "206 W Singleton St, Centralia, MO 65240", rating: 4.7, reviews: 35, businessType: "Barber Shop" },
  { name: "Rob's Barber Shop", phone: "(660) 833-8766", address: "209 N Williams St, Moberly, MO 65270", rating: 4.8, reviews: 108, businessType: "Barber Shop" },

  // ── PLUMBERS (20) ──────────────────────────────────────────────────────
  { name: "Brian Wear Plumbing & Restoration", phone: "(573) 864-4463", address: "2501 Rangeline St Suite B, Columbia, MO 65202", rating: 4.9, reviews: 1903, website: "brianwearplumbing.com", businessType: "Plumber" },
  { name: "MasterTech Plumbing, Heating, and Cooling", phone: "(573) 777-3660", address: "5150 Interstate 70 Dr SW, Columbia, MO 65203", rating: 4.8, reviews: 2434, website: "mastertechplumbing.com", businessType: "Plumber" },
  { name: "Royal Flush Plumbing & waterproofing", phone: "(573) 253-3287", address: "219 N Clark St, Mexico, MO 65265", rating: 4.8, reviews: 65, businessType: "Plumber" },
  { name: "All Star Plumbing", phone: "(573) 815-7273", address: "3400 W Broadway Business Park Ct Ste 101, Columbia, MO 65203", rating: 4.9, reviews: 57, website: "theallstarplumbers.com", businessType: "Plumber" },
  { name: "1-Tom-Plumber", phone: "(573) 203-5766", address: "5751 MO-163, Columbia, MO 65201", rating: 5, reviews: 116, website: "1tomplumber.com/columbia-mo", businessType: "Plumber" },
  { name: "White Lightning Plumbing, LLC", phone: "(636) 235-1392", address: "321 W 2nd St, Montgomery City, MO 63361", rating: 5, reviews: 25, website: "whitelightningplumbing.com", businessType: "Plumber" },
  { name: "Mr. Rooter Plumbing of Columbia Missouri", phone: "(573) 474-0225", address: "8501 E Richland Rd, Columbia, MO 65201", rating: 4.7, reviews: 243, website: "mrrooter.com/columbia-missouri", businessType: "Plumber" },
  { name: "Scotty On The Spot", phone: "(573) 289-7755", address: "2404 Lizzie Ln, Rocheport, MO 65279", rating: 5, reviews: 65, website: "scottyonthespot.com", businessType: "Plumber" },
  { name: "FastFlow Columbia Plumbers", phone: "(573) 615-0246", address: "101 Corporate Lake Dr, Columbia, MO 65203", rating: 5, reviews: 15, website: "fastflowcolumbia.com", businessType: "Plumber" },
  { name: "Columbia Plumbing & Water Heater Repair", phone: "(573) 354-0485", address: "2601 Rangeline St, Columbia, MO 65202", rating: 5, reviews: 14, businessType: "Plumber" },
  { name: "Adam's Plumbing LLC", phone: "(573) 808-4786", address: "4200 W Rollins Rd, Columbia, MO 65203", rating: 5, reviews: 25, businessType: "Plumber" },
  { name: "Grace Plumbing and Drain Cleaning LLC", phone: "(573) 619-2667", address: "6107 MO-179, Centertown, MO 65023", rating: 5, reviews: 17, businessType: "Plumber" },
  { name: "Tallmage Plumbing, LLC", phone: "(573) 239-3829", address: "1720 Boyd Ln, Columbia, MO 65202", rating: 4.5, reviews: 22, businessType: "Plumber" },
  { name: "Magic City Plumbing", phone: "(660) 651-8689", address: "1907 Darwood Cir, Moberly, MO 65270", rating: 4.8, reviews: 35, businessType: "Plumber" },
  { name: "Affordable Plumbing Maintenance LLC", phone: "(660) 621-1812", address: "24267 MO-98, Boonville, MO 65233", rating: 4.8, reviews: 20, businessType: "Plumber" },
  { name: "Chapman Heating, Cooling, and Plumbing", phone: "(573) 445-4489", address: "3150 Paris Rd #108, Columbia, MO 65202", rating: 5, reviews: 1741, website: "chapmanhvac.com", businessType: "Plumber" },
  { name: "Anchor City Plumbing LLC", phone: "(573) 881-5770", address: "430 N Barr St, Centralia, MO 65240", rating: 4.7, reviews: 9, businessType: "Plumber" },
  { name: "Garrett & Campbell Inc", phone: "(573) 642-3264", address: "523 Nichols St, Fulton, MO 65251", rating: 4.6, reviews: 74, website: "garrettandcampbell.com", businessType: "Plumber" },
  { name: "Cochran Plumbing", phone: "(573) 696-1387", address: "3500 E McGee Rd, Columbia, MO 65202", rating: 5, reviews: 11, businessType: "Plumber" },
  { name: "T G Plumbing Llc", phone: "(573) 219-1479", address: "4107 White Tiger Ln, Columbia, MO 65202", rating: 5, reviews: 1, businessType: "Plumber" },

  // ── ELECTRICIANS (14) ──────────────────────────────────────────────────
  { name: "Mr. Electric of Central Missouri", phone: "(573) 207-3160", address: "303 N Stadium Blvd #200, Columbia, MO 65203", rating: 4.8, reviews: 218, businessType: "Electrician" },
  { name: "Goodies Electrical Solutions LLC", phone: "(573) 933-5195", address: "13258 Audrain Rd 977, Thompson, MO 65285", rating: 4.5, reviews: 17, businessType: "Electrician" },
  { name: "Scott Electric", phone: "(573) 999-6052", address: "200 Old 63 S suite 301, Columbia, MO 65201", rating: 4.9, reviews: 176, website: "scottelectricmo.com", businessType: "Electrician" },
  { name: "Rick's Electric", phone: "(573) 253-4529", address: "1020 Francis St, Mexico, MO 65265", rating: 4.8, reviews: 50, businessType: "Electrician" },
  { name: "Midway Electric", phone: "(573) 446-2484", address: "7301 W Henderson Rd suite a, Columbia, MO 65202", rating: 4.8, reviews: 95, website: "midwayelectricinc.com", businessType: "Electrician" },
  { name: "Mid Missouri Electric", phone: "(573) 875-1545", address: "1917 Paris Rd, Columbia, MO 65201", rating: 4.8, reviews: 18, website: "midmissourielectric.com", businessType: "Electrician" },
  { name: "Withrow Electric Inc", phone: "(573) 445-8086", address: "500 Big Bear Blvd, Columbia, MO 65202", rating: 4.6, reviews: 101, website: "withrowelectric.com", businessType: "Electrician" },
  { name: "Coast To Coast Electricans", phone: "(573) 802-0177", address: "303 N Stadium Blvd, Columbia, MO 65203", rating: 5, reviews: 9, businessType: "Electrician" },
  { name: "Gooch Electric LLC", phone: "(573) 893-2715", address: "618 Apache Trail, Jefferson City, MO 65109", rating: 5, reviews: 24, website: "goochelectricllc.com", businessType: "Electrician" },
  { name: "Terrell Electric", phone: "(573) 673-2522", address: "1515 S Morley St Bldg 3 Suite C, Moberly, MO 65270", rating: 3.5, reviews: 31, website: "terrellelectric.com", businessType: "Electrician" },
  { name: "Precision Electric, Inc", phone: "(573) 351-2564", address: "600 Hillsdale Rd #101, Columbia, MO 65201", rating: 4.9, reviews: 16, website: "iwantprecision.com", businessType: "Electrician" },
  { name: "Trustar Electric and Communication Services LLC", phone: "(479) 657-0882", address: "609 Kathryn St, Nixa, MO 65714", rating: 4.6, reviews: 10, website: "trustarelectric.com", businessType: "Electrician" },
  { name: "Jeffries Electrical Services, Inc.", phone: "(573) 676-5100", address: "10931 Evergreen Drive, Holts Summit, MO 65043", rating: 4.8, reviews: 5, businessType: "Electrician" },
  { name: "ABC Electric Co", phone: "(660) 651-2082", address: "307 S Ault St #2207, Moberly, MO 65270", rating: 3.4, reviews: 10, businessType: "Electrician" },

  // ── HVAC (17) ──────────────────────────────────────────────────────────
  { name: "Accurate Heating & Cooling", phone: "(573) 442-7312", address: "1208 Cosmos Pl, Columbia, MO 65202", rating: 4.9, reviews: 436, website: "accurateheatcool.com", businessType: "HVAC" },
  { name: "Star Heating and Air Conditioning Company Inc.", phone: "(573) 449-3784", address: "1702 Commerce Ct, Columbia, MO 65202", rating: 4.7, reviews: 345, website: "starheat.com", businessType: "HVAC" },
  { name: "Stevens Heating & Cooling, LLC", phone: "(573) 682-0067", address: "323 N Barr St, Centralia, MO 65240", rating: 5, reviews: 70, website: "stevens-hvac.com", businessType: "HVAC" },
  { name: "Aire Serv of Columbia, MO", phone: "(573) 303-3022", address: "6620 Stephens Station Rd # B, Columbia, MO 65202", rating: 4.9, reviews: 686, businessType: "HVAC" },
  { name: "Comfort Doc Heating and Air", phone: "(417) 218-0866", address: "310 Tiger Ln suite #201a, Columbia, MO 65203", rating: 5, reviews: 104, businessType: "HVAC" },
  { name: "Peters Heating & Air Conditioning", phone: "(573) 443-3660", address: "3801 Waco Rd, Columbia, MO 65202", rating: 4.5, reviews: 138, businessType: "HVAC" },
  { name: "Mommens Heating & Cooling", phone: "(573) 581-7970", address: "1320 Paris Rd, Mexico, MO 65265", rating: 4.6, reviews: 65, website: "mommenshvac.com", businessType: "HVAC" },
  { name: "Comfort Crew of Columbia, LLC", phone: "(573) 355-1494", address: "1904 Vandiver Dr, Columbia, MO 65202", rating: 4.6, reviews: 85, website: "comfortcrewofcolumbia.com", businessType: "HVAC" },
  { name: "Cal-Air Mechanical LLC", phone: "(573) 826-3333", address: "300 N Ravine St, Fulton, MO 65251", rating: 4.8, reviews: 88, website: "calairmechanical.com", businessType: "HVAC" },
  { name: "COLUMBIA HEATING & COOLING", phone: "(573) 449-0888", address: "7301 N Rogers Rd, Columbia, MO 65202", rating: 4.8, reviews: 21, businessType: "HVAC" },
  { name: "Vaughn Heating & Cooling LLC", phone: "(573) 239-3611", address: "695 Co Rd 416, Rocheport, MO 65279", rating: 4.9, reviews: 351, businessType: "HVAC" },
  { name: "Centralia Heating & Air Conditioning", phone: "(573) 229-8778", address: "105 N Allen St, Centralia, MO 65240", rating: 4.6, reviews: 27, businessType: "HVAC" },
  { name: "Reed Heating & AC", phone: "(573) 445-4112", address: "1806 Business Loop 70 W, Columbia, MO 65202", rating: 4.2, reviews: 83, website: "reedhvac.com", businessType: "HVAC" },
  { name: "Albright Heating & Air Conditioning", phone: "(573) 875-7888", address: "2207 Burlington St E, Columbia, MO 65202", rating: 4.7, reviews: 48, website: "albrighthvac.com", businessType: "HVAC" },
  { name: "Crigler's Heating and Air Conditioning", phone: "(660) 651-6485", address: "301 MO-151, Madison, MO 65263", rating: 4.9, reviews: 70, website: "criglersheatingandair.com", businessType: "HVAC" },
  { name: "W.W. Hawkins, L.L.C.", phone: "(573) 642-5751", address: "300 N Ravine St, Fulton, MO 65251", rating: 4.1, reviews: 36, businessType: "HVAC" },
  { name: "Central Heating & Cooling Inc", phone: "(573) 564-3020", address: "1230 Aguilar Dr, Montgomery City, MO 63361", rating: 4.5, reviews: 8, website: "centralheatcool.com", businessType: "HVAC" },

  // ── HANDYMAN (9) ───────────────────────────────────────────────────────
  { name: "Fouts HandyMan Services", phone: "(573) 326-4577", address: "12081 County Rd 4001, Holts Summit, MO 65043", rating: 4.9, reviews: 123, businessType: "Handyman" },
  { name: "All around Handyman & Remodeling Services", phone: "(573) 673-0881", address: "14885 North St #124, Hallsville, MO 65255", rating: 5, reviews: 6, website: "allaroundhandymancomo.com", businessType: "Handyman" },
  { name: "Handy-Matt LLC", phone: "(573) 489-4320", address: "3700 Monterey Dr #1a, Columbia, MO 65203", rating: 4.2, reviews: 12, businessType: "Handyman" },
  { name: "CS Maintenance and Home Repair, LLC", phone: "(573) 814-9699", address: "2210 Faulkner Ct, Columbia, MO 65202", rating: 4.5, reviews: 15, businessType: "Handyman" },
  { name: "Handyman Solutions", phone: "(573) 635-2708", address: "113 Jaycee Dr #108, Jefferson City, MO 65109", rating: 4.1, reviews: 27, website: "handymansolutions.org", businessType: "Handyman" },
  { name: "Carl Handyman LLC", phone: "(573) 488-0088", address: "100 E Broadway, Ashland, MO 65010", rating: 3, reviews: 4, businessType: "Handyman" },
  { name: "Blue Collar Boys (handyman Service)", phone: "(573) 864-1583", address: "Jefferson City, MO 65101", rating: 4.8, reviews: 18, businessType: "Handyman" },
  { name: "Consider It Done Home Repairs", phone: "(573) 657-8544", address: "6740 American Setter Dr, Ashland, MO 65010", rating: 5, reviews: 2, website: "cidhomerepairs.com", businessType: "Handyman" },
  { name: "Mr. Handyman of St. Charles Co. and Chesterfield Valley", phone: "(636) 888-0017", address: "4051 N St Peters Pkwy Unit 4053C, St Peters, MO 63304", rating: 4.9, reviews: 558, businessType: "Handyman" },

  // ── CARPENTERS (13) ────────────────────────────────────────────────────
  { name: "IDEA by Taylor'd Woodworks", phone: "(573) 253-3819", address: "15703 State Hwy FF, Thompson, MO 65285", businessType: "Carpenter" },
  { name: "Central Missouri Carpenters", phone: "(573) 825-6500", address: "404 Tiger Ln suite d, Columbia, MO 65203", businessType: "Carpenter" },
  { name: "On the Level Carpentry", phone: "(573) 445-5053", address: "209 Alexander Ave, Columbia, MO 65203", rating: 5, reviews: 1, businessType: "Carpenter" },
  { name: "Central Missouri Carpenters' Union Apprenticeship", phone: "(573) 636-4600", address: "5218 Bus 50 W, Jefferson City, MO 65109", rating: 5, reviews: 2, businessType: "Carpenter" },
  { name: "Carpenter Street Baptist Church", phone: "(660) 263-6201", address: "501 E Carpenter St, Moberly, MO 65270", rating: 4.8, reviews: 14, businessType: "Carpenter" },
  { name: "Doolittle Woodworks", phone: "(573) 721-9364", address: "411 S Jefferson St, Mexico, MO 65265", rating: 5, reviews: 3, website: "doolittleww.com", businessType: "Carpenter" },
  { name: "Restoration Carpentry", phone: "(816) 716-0890", address: "12419 Monroe Ave, Grandview, MO 64030", rating: 4.9, reviews: 78, businessType: "Carpenter" },
  { name: "Son of a Carpenter, LLC", phone: "(816) 965-7100", address: "433 NW 1771st Rd, Kingsville, MO 64061", rating: 5, reviews: 56, website: "soacllc.com", businessType: "Carpenter" },
  { name: "Bradley B Carpentry", phone: "(636) 887-5704", address: "23 Kingsway Dr, Wentzville, MO 63385", rating: 5, reviews: 3, businessType: "Carpenter" },
  { name: "Carpenters Local Union", phone: "(573) 445-5212", address: "404 Tiger Ln suite d, Columbia, MO 65203", businessType: "Carpenter" },
  { name: "Wieberg Painting & Remodel", phone: "(573) 721-1557", address: "326 W Love St, Mexico, MO 65265", rating: 3.5, reviews: 13, businessType: "Carpenter" },
  { name: "Q&M Carpentry LLC", phone: "(636) 900-1630", address: "4846 S Point Rd, Washington, MO 63090", rating: 4.8, reviews: 18, businessType: "Carpenter" },
  { name: "Drake Carpentry Inc.", phone: "(636) 305-1449", address: "1123 Gravois Rd, Fenton, MO 63026", rating: 3, reviews: 2, website: "drakecarpentry.com", businessType: "Carpenter" },

  // ── TATTOO SHOPS (17) ──────────────────────────────────────────────────
  { name: "Iron Moe's", phone: "(573) 489-2643", address: "816 E Broadway, Columbia, MO 65201", rating: 5, reviews: 1194, website: "ironmoes.com", businessType: "Tattoo Shop" },
  { name: "Century Tattoo", phone: "(573) 488-0010", address: "100 E Broadway A, Ashland, MO 65010", rating: 4.9, reviews: 57, website: "centurytattoos.com", businessType: "Tattoo Shop" },
  { name: "Newinked Studio", phone: "(573) 268-5988", address: "101 Corporate Lake Dr A, Columbia, MO 65203", rating: 4.9, reviews: 130, businessType: "Tattoo Shop" },
  { name: "Madd Goat tattoo", phone: "(660) 988-8543", address: "1301 Vandiver Dr suite c, Columbia, MO 65202", rating: 4.9, reviews: 265, businessType: "Tattoo Shop" },
  { name: "Living Canvas Tattoo & Body Piercing", phone: "(573) 442-8287", address: "520 E Broadway, Columbia, MO 65201", rating: 4.5, reviews: 757, website: "tattoocolumbia.com", businessType: "Tattoo Shop" },
  { name: "C.R. Ink Tattoo", phone: "(573) 777-8212", address: "15 South 10th Street, Columbia, MO 65201", rating: 4.5, reviews: 246, businessType: "Tattoo Shop" },
  { name: "Sinful Ink", phone: "(754) 259-4632", address: "731 E Liberty St, Mexico, MO 65265", rating: 5, reviews: 23, businessType: "Tattoo Shop" },
  { name: "Iron Tiger Tattoo", phone: "(573) 499-1200", address: "11 N 10th St, Columbia, MO 65201", rating: 4.3, reviews: 535, website: "irontigertattoo.com", businessType: "Tattoo Shop" },
  { name: "Tattoo You", phone: "(573) 875-7850", address: "1204 Rangeline St, Columbia, MO 65201", rating: 4.6, reviews: 159, website: "tattooyoucolumbia.com", businessType: "Tattoo Shop" },
  { name: "Blackheart Collective", phone: "(660) 998-3974", address: "535 W Coates St, Moberly, MO 65270", rating: 5, reviews: 99, website: "blackheartcollective22.com", businessType: "Tattoo Shop" },
  { name: "The Gilded Lily Tattoo and Piercing", phone: "(660) 998-0130", address: "120 E Coates St, Moberly, MO 65270", rating: 4.7, reviews: 97, website: "gildedlilytat2.com", businessType: "Tattoo Shop" },
  { name: "True Heart Tattoo", phone: "(573) 443-1023", address: "908 E Walnut St, Columbia, MO 65201", rating: 5, reviews: 75, website: "truehearttattoo.com", businessType: "Tattoo Shop" },
  { name: "Under The Gun Tattoos", phone: "(573) 355-2230", address: "313 I-70BL, Columbia, MO 65203", rating: 4.8, reviews: 155, businessType: "Tattoo Shop" },
  { name: "Immortal Art", phone: "(573) 818-9398", address: "2807 W Broadway #101, Columbia, MO 65203", rating: 4.7, reviews: 79, website: "immortalart.shop", businessType: "Tattoo Shop" },
  { name: "Fonzie's Tattoo Parlor", phone: "(573) 864-3500", address: "2305 Hillsboro Dr, Columbia, MO 65202", rating: 4.6, reviews: 21, businessType: "Tattoo Shop" },
  { name: "The Tattoo Shop", phone: "(660) 621-0153", address: "316 Main St, Boonville, MO 65233", rating: 4.9, reviews: 74, businessType: "Tattoo Shop" },
  { name: "Blackheart Collective", phone: "(660) 670-0259", address: "914 N College Ave #3, Columbia, MO 65201", rating: 5, reviews: 1, website: "blackheartcollective22.com", businessType: "Tattoo Shop" },
];

// ---------------------------------------------------------------------------
// Build the message field with metadata (rating, reviews, address, website)
// ---------------------------------------------------------------------------
function buildMessage(lead) {
  const parts = [];
  if (lead.address) parts.push(`Address: ${lead.address}`);
  if (lead.rating != null) parts.push(`Rating: ${lead.rating}`);
  if (lead.reviews != null) parts.push(`Reviews: ${lead.reviews}`);
  if (lead.website) parts.push(`Website: ${lead.website}`);
  return parts.length > 0 ? parts.join(" | ") : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nSeed leads from Slack #leads channel`);
  console.log(`Total leads to process: ${leads.length}\n`);

  // Fetch existing phones for dedup
  const existing = await prisma.lead.findMany({ select: { phone: true } });
  const existingPhones = new Set(existing.map((l) => l.phone));
  console.log(`Existing leads in DB: ${existing.length}`);

  let inserted = 0;
  let skipped = 0;

  for (const lead of leads) {
    if (existingPhones.has(lead.phone)) {
      console.log(`  SKIP (dup phone): ${lead.name} — ${lead.phone}`);
      skipped++;
      continue;
    }

    await prisma.lead.create({
      data: {
        name: lead.name,
        email: "",
        phone: lead.phone,
        businessName: lead.name,
        businessType: lead.businessType,
        message: buildMessage(lead),
        source: "google_places",
      },
    });

    existingPhones.add(lead.phone); // prevent intra-batch dupes
    inserted++;
    console.log(`  INSERT: ${lead.name} (${lead.businessType}) — ${lead.phone}`);
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped (duplicates): ${skipped}`);
  console.log(`Total leads now: ${existing.length + inserted}\n`);
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

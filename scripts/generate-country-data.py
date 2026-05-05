#!/usr/bin/env python3
"""
Generate ExploreAll country data — safety ratings, travel summaries, common
tips, common scams, visa notes, and best time to visit — for every ISO 3166-1
country.

Output: supabase/all-country-data.sql

The SQL is idempotent and PRESERVES existing curated data:
- safety_ratings rows are inserted with ON CONFLICT DO NOTHING (won't overwrite
  rich entries you already have for JP, IT, TH, FR, US, MX, ID, PT, IS, AU,
  GR, VN from schema.sql).
- countries fields (best_time_to_visit, travel_summary, common_tips,
  common_scams, visa_notes) are only updated when the field is NULL or empty.

Re-run the script any time you tweak the dataset; it will only fill in gaps.
"""

from textwrap import dedent

# ---------------------------------------------------------------------------
# Per-country dataset.
#
# Each entry: (score, level, summary, best_time, tips_list, scams_list, visa_text)
#
# Score: 0–10 (rough composite of GPI, Numbeo, US/UK travel advisories).
# Level: one of safe / mostly_safe / caution / high_risk / do_not_travel.
# Tips and scams: short, traveler-actionable. Aim 2–4 per country.
# Visa: a one-liner; users should always verify with their gov't site.
#
# These are best-effort placeholders meant to be useful for travelers. Refine
# per country at any time; the SQL is idempotent.
# ---------------------------------------------------------------------------

# Region-shared templates so we don't repeat ourselves
WEU_TIPS  = ['Pickpockets target tourists in big cities — keep bags zipped',
             'Validate train tickets before boarding',
             'Tipping is optional, rounding up is appreciated']
WEU_SCAMS = ['Petition / ring-drop scams near major monuments',
             'Friendship-bracelet street performers',
             'Taxi meter "broken" trick — use Uber/Bolt']

EEU_TIPS  = ['Carry small notes — many places dislike large bills',
             'Validate trams/metro tickets at the platform machine',
             'Tap water is generally safe in capitals']
EEU_SCAMS = ['Taxi overcharging from airports — book via app',
             'Currency-exchange "0% commission" with bad rates',
             'Attractive stranger inviting you to expensive bars']

NORDIC_TIPS  = ['Card-only is normal — bring contactless',
                'Layer up year-round; weather flips fast',
                'Tap water is excellent everywhere']
NORDIC_SCAMS = ['Overpriced taxi tours pretending to be official',
                'Rental-car gravel-damage charges (Iceland)']

NA_TIPS  = ['Tip 18–22% at sit-down restaurants',
            'Carry ID; some venues require it',
            'Distances are huge — rent a car outside cities']
NA_SCAMS = ['Times-Square-style costumed-character "tip" demands',
            'Rideshare overcharges from non-app drivers',
            'ATM skimmers in tourist areas']

LATAM_TIPS  = ['Use Uber/Didi/Cabify in big cities',
               'Drink bottled or filtered water',
               'Carry small change; cash still rules in markets']
LATAM_SCAMS = ['ATM skimming — use bank-lobby ATMs only',
               'Express kidnappings: don\'t flag street taxis at night',
               'Distraction theft on city buses']

CARIB_TIPS  = ['Cash is useful at small shops and beaches',
               'Reef-safe sunscreen is required in many islands',
               'Negotiate fares before getting in private taxis']
CARIB_SCAMS = ['Inflated tour prices at cruise terminals',
               'Aggressive timeshare touts at airports']

MENA_TIPS  = ['Dress modestly at religious sites (cover shoulders & knees)',
              'Friday is the rest day — many shops close',
              'Greet with right hand; it\'s the polite default']
MENA_SCAMS = ['"Free" guide who later demands a large tip',
              'Henna pushy-sales in tourist medinas',
              'Spice-shop / carpet-shop bait-and-switch']

SSA_TIPS  = ['Get yellow-fever and malaria advice before flying',
             'Avoid driving at night outside cities',
             'Carry photocopies of your passport, not the original']
SSA_SCAMS = ['Fake-charity collectors at tourist spots',
             'Police-impersonator "fines" — ask for ID and station',
             'Inflated taxi fares from airports']

SEA_TIPS  = ['Helmet on every scooter ride',
             'Drink bottled water; avoid tap and ice in small towns',
             'Carry small notes for street food']
SEA_SCAMS = ['Tuk-tuk gem-shop / temple-closed scam',
             'Money-changer short-changing — count twice',
             'Jet-ski "damage" claims at beach resorts']

EAS_TIPS  = ['Cash is still common — don\'t rely on cards alone',
             'Bow lightly when greeting (Japan/Korea)',
             'Public transit is the fastest way around big cities']
EAS_SCAMS = ['Touts in nightlife districts (Kabukicho, Itaewon)',
             'Tea-ceremony scam in Beijing/Shanghai',
             'Overpriced "scenic" taxis from major airports']

SAS_TIPS  = ['Drink only sealed bottled water',
             'Use prepaid airport taxis — never flag at curbside',
             'Keep digital + paper copies of your passport']
SAS_SCAMS = ['"Government tourism office" off the airport — fake',
              'Train-station porter overcharging',
              'Auto-rickshaw meter "broken" — agree price first']

OCE_TIPS  = ['Sun is brutal — SPF 50, hat, and shade',
             'Swim between the flags on patrolled beaches',
             'Outback distances are huge — fuel up at every chance']
OCE_SCAMS = ['Backpacker-hostel deposit fraud',
             'Inflated diving-gear rental near reef hotspots']

ANTARCTIC_TIPS  = ['Travel only with IAATO-certified operators',
                   'Pack proper polar-rated clothing — temps can drop fast',
                   'Strict biosecurity: clean every item before stepping ashore']
ANTARCTIC_SCAMS = ['Unverified "expedition" operators selling cut-rate trips']


# Default visa text by broad region (override per country as needed)
SCHENGEN_VISA = 'Schengen Area — 90 days visa-free for many passports.'
EU_NONSCHENGEN = 'EU member outside Schengen — 90 days visa-free for many passports.'
COMMON_VISA_FREE = '30–90 days visa-free for many Western passports — verify on the gov\'t site before booking.'
EVISA = 'eVisa available online for most nationalities.'
VOA = 'Visa-on-arrival available for many passports — fee in USD typical.'
RESTRICTIVE = 'Visa required in advance for most nationalities. Check the embassy site early.'
NO_TRAVEL = 'Active conflict — visas not generally issued to tourists.'

# Compact dataset. Format:
#   "CC": (score, level, "summary", "best_time", tips_or_None, scams_or_None, visa_or_None)
# If tips/scams/visa is None we use the regional template.
#
# Existing rich entries from schema.sql (JP, IT, TH, FR, US, MX, ID, PT, IS, AU, GR, VN)
# are NOT overwritten by the upsert — listing them here is harmless.

DATA = {
    # ===== Western Europe (Schengen, very safe) =====
    "AT": (8.9, "safe",        "Vienna and the Alps — orderly, safe, and clean.",                          "May–Sep, Dec ski season",  WEU_TIPS, WEU_SCAMS, SCHENGEN_VISA),
    "BE": (8.4, "safe",        "Brussels, Bruges, beer and chocolate. Watch big-city pickpockets.",         "Apr–Sep",                  WEU_TIPS, WEU_SCAMS, SCHENGEN_VISA),
    "CH": (9.4, "safe",        "Among the safest in the world. Trains run on time, prices high.",          "Jun–Sep, Dec–Feb skiing",  WEU_TIPS, ['Currency-exchange short-changing','Inflated taxi fares — use Uber/Bolt'], 'Schengen — 90 days visa-free for many passports.'),
    "DE": (8.6, "safe",        "Reliable and well-organized. Pickpockets in major train hubs.",            "May–Sep, Dec markets",     WEU_TIPS, WEU_SCAMS, SCHENGEN_VISA),
    "DK": (9.3, "safe",        "Copenhagen leads the safety ranking. Bike-friendly, cashless.",            "May–Aug",                  NORDIC_TIPS, NORDIC_SCAMS, SCHENGEN_VISA),
    "ES": (8.3, "safe",        "Spain is welcoming; Barcelona pickpockets are aggressive.",                "Apr–Jun, Sep–Oct",         WEU_TIPS, WEU_SCAMS, SCHENGEN_VISA),
    "FI": (9.3, "safe",        "Quiet, safe, low-crime. Auroras Sep–Mar in Lapland.",                       "Jun–Aug, Feb–Mar auroras", NORDIC_TIPS, NORDIC_SCAMS, SCHENGEN_VISA),
    "GB": (8.5, "safe",        "Generally safe; petty theft in central London.",                            "May–Sep",                   WEU_TIPS, WEU_SCAMS, '6 months visa-free for many passports.'),
    "IE": (8.9, "safe",        "Friendly and safe. Watch crowded bars in Dublin.",                         "May–Sep",                  WEU_TIPS, WEU_SCAMS, '90 days visa-free for many passports.'),
    "LU": (9.0, "safe",        "Tiny, very safe, mostly French/German speaking.",                          "May–Sep",                  WEU_TIPS, WEU_SCAMS, SCHENGEN_VISA),
    "MC": (9.3, "safe",        "Monaco is small, expensive, and very safe.",                               "Apr–Oct",                  WEU_TIPS, ['Yacht/casino "agent" scams asking for fees'], SCHENGEN_VISA),
    "NL": (8.7, "safe",        "Amsterdam pickpockets in Centraal — otherwise excellent.",                  "Apr–Sep",                  WEU_TIPS, WEU_SCAMS, SCHENGEN_VISA),
    "NO": (9.3, "safe",        "Stunning fjords, very safe. Expensive — plan budget.",                     "Jun–Aug, Feb–Mar auroras", NORDIC_TIPS, NORDIC_SCAMS, SCHENGEN_VISA),
    "SE": (8.7, "safe",        "Safe and clean. Stockholm has occasional gang-related news, tourists unaffected.","May–Sep",                  NORDIC_TIPS, NORDIC_SCAMS, SCHENGEN_VISA),
    "AD": (9.0, "safe",        "Tiny Pyrenean principality — duty-free shopping and skiing.",              "Dec–Mar ski, Jun–Sep hike", WEU_TIPS, ['Inflated ski-equipment-rental fees'], 'Use Schengen visa or visa-free entry to enter via FR/ES.'),
    "LI": (9.4, "safe",        "Tiny, alpine, and one of the safest places anywhere.",                     "May–Sep",                  WEU_TIPS, WEU_SCAMS, SCHENGEN_VISA),
    "SM": (8.9, "safe",        "Microstate inside Italy — medieval old town, very safe.",                  "Apr–Oct",                  WEU_TIPS, WEU_SCAMS, 'Enter via Italy — same Schengen rules.'),
    "VA": (8.5, "safe",        "Vatican City — pickpockets common in St. Peter\'s queues.",                "Apr–Oct",                  ['Cover shoulders/knees inside St. Peter\'s','Buy timed-entry tickets online'], ['Pickpockets in St. Peter\'s Square','Fake "skip-the-line" guides outside the Vatican'], 'Enter via Italy — Schengen rules apply.'),
    "MT": (8.5, "safe",        "Sunny island nation, very safe. English widely spoken.",                   "Apr–Jun, Sep–Oct",         WEU_TIPS, WEU_SCAMS, SCHENGEN_VISA),
    "FO": (9.4, "safe",        "Faroe Islands — remote, dramatic, very safe.",                             "May–Sep",                  NORDIC_TIPS, ['Few — book accommodation early; supply is limited'], 'Enter via Denmark/Schengen.'),
    "GL": (9.0, "safe",        "Greenland — tiny crime, harsh nature is the real risk.",                   "Jun–Sep",                  NORDIC_TIPS, ['Few — but isolated, prepare properly'], 'Enter via Denmark.'),
    "AX": (9.4, "safe",        "Åland Islands — Finnish autonomous archipelago, very safe.",               "Jun–Aug",                  NORDIC_TIPS, NORDIC_SCAMS, 'Schengen via Finland.'),
    "GG": (9.0, "safe",        "Channel Island — quiet, safe, English-speaking.",                          "May–Sep",                  WEU_TIPS, WEU_SCAMS, 'Common Travel Area with the UK.'),
    "JE": (9.0, "safe",        "Channel Island — quiet, safe, English-speaking.",                          "May–Sep",                  WEU_TIPS, WEU_SCAMS, 'Common Travel Area with the UK.'),
    "IM": (9.0, "safe",        "Isle of Man — quiet, safe, English-speaking.",                             "May–Sep",                  WEU_TIPS, WEU_SCAMS, 'Common Travel Area with the UK.'),

    # ===== Eastern / Southern Europe =====
    "BG": (7.5, "mostly_safe", "Bulgaria is welcoming and budget-friendly. Mind taxi scams in Sofia.",      "May–Sep, Dec–Feb skiing",  EEU_TIPS, ['"OK Taxi" or "OK Supertrans" lookalikes — use Yellow!Cars or InTaxi','Sofia airport taxi-touts pre-arrivals — use the official Yellow!Cars desk'], EU_NONSCHENGEN),
    "RO": (8.0, "safe",        "Romania is safer than its old reputation — Transylvania is gorgeous.",      "May–Sep",                  EEU_TIPS, EEU_SCAMS, EU_NONSCHENGEN),
    "HR": (8.4, "safe",        "Croatia is calm; Old Town Dubrovnik is safe but expensive in summer.",      "May–Jun, Sep",             EEU_TIPS, EEU_SCAMS, SCHENGEN_VISA),
    "CZ": (8.9, "safe",        "Prague is very safe. Petty theft in Old Town and night trams.",            "Apr–Jun, Sep",             EEU_TIPS, EEU_SCAMS, SCHENGEN_VISA),
    "HU": (8.2, "safe",        "Budapest is safe; only common scam is overcharging in tourist taxis.",     "Apr–Jun, Sep",             EEU_TIPS, EEU_SCAMS, SCHENGEN_VISA),
    "PL": (8.5, "safe",        "Poland is safe and increasingly popular for city breaks.",                  "May–Sep",                  EEU_TIPS, EEU_SCAMS, SCHENGEN_VISA),
    "SK": (8.2, "safe",        "Slovakia — Bratislava and the High Tatras. Safe and cheap.",                "Jun–Sep",                  EEU_TIPS, EEU_SCAMS, SCHENGEN_VISA),
    "SI": (9.0, "safe",        "Slovenia is one of Europe\'s safest. Lake Bled is the postcard.",          "May–Sep",                  EEU_TIPS, EEU_SCAMS, SCHENGEN_VISA),
    "EE": (8.5, "safe",        "Estonia — digital society, low crime, walkable old towns.",                 "May–Sep",                  NORDIC_TIPS, EEU_SCAMS, SCHENGEN_VISA),
    "LV": (8.2, "safe",        "Latvia — Riga old town is safe; mind nightlife in Old Riga.",              "May–Sep",                  EEU_TIPS, ['Tourist-trap bars in Old Riga charging huge bills'], SCHENGEN_VISA),
    "LT": (8.3, "safe",        "Lithuania — Vilnius is safe and walkable.",                                  "May–Sep",                  EEU_TIPS, EEU_SCAMS, SCHENGEN_VISA),
    "AL": (7.0, "mostly_safe", "Albania — friendly people, dramatic coast. Drive carefully.",               "May–Oct",                  EEU_TIPS, EEU_SCAMS, COMMON_VISA_FREE),
    "BA": (7.0, "mostly_safe", "Bosnia and Herzegovina — Sarajevo and Mostar are safe; mind landmines off-trail.","May–Oct",       EEU_TIPS + ['Stick to marked trails — landmines remain in some rural areas'], EEU_SCAMS, COMMON_VISA_FREE),
    "ME": (7.4, "mostly_safe", "Montenegro — beautiful coast, friendly. Mind summer crowds.",               "May–Oct",                  EEU_TIPS, EEU_SCAMS, COMMON_VISA_FREE),
    "MK": (7.3, "mostly_safe", "North Macedonia — Skopje and Ohrid are calm and welcoming.",                "May–Oct",                  EEU_TIPS, EEU_SCAMS, COMMON_VISA_FREE),
    "RS": (7.0, "mostly_safe", "Serbia — Belgrade has a great nightlife; mind taxi touts at the airport.",  "May–Oct",                  EEU_TIPS, EEU_SCAMS, COMMON_VISA_FREE),
    "XK": (6.8, "mostly_safe", "Kosovo — friendly to Western travelers. Pristina is calm.",                 "May–Oct",                  EEU_TIPS, EEU_SCAMS, COMMON_VISA_FREE),
    "MD": (7.0, "mostly_safe", "Moldova — quiet, off-the-beaten-path. Avoid Transnistria without research.","May–Oct",                  EEU_TIPS + ['Don\'t enter Transnistria without checking advisories'], EEU_SCAMS, EVISA),
    "BY": (7.0, "mostly_safe", "Belarus — politically tense, register your stay. Travel sparingly.",        "May–Sep",                  EEU_TIPS + ['Carry your passport at all times — checks are common'], EEU_SCAMS + ['Avoid political topics in public'], 'Visa or eVisa typically required.'),
    "UA": (5.5, "caution",     "Ukraine — active conflict zones. Western Ukraine quieter; consult advisories.","Spring/Summer (advisory dependent)", EEU_TIPS + ['Heed air-raid sirens and shelters','Avoid unmarked roads'], ['Avoid all eastern oblasts','Power outages possible — bring torches'], 'Visa-free for many Western passports for short stays.'),
    "RU": (5.8, "caution",     "Russia — political situation makes travel difficult; many advisories warn against.","Mar–Oct",       EEU_TIPS, EEU_SCAMS, RESTRICTIVE),
    "TR": (6.8, "caution",     "Türkiye — Istanbul is safe; avoid SE border regions.",                      "Apr–Jun, Sep–Oct",         EEU_TIPS, ['"Free" tea and shisha that becomes a $200 bill','Carpet-shop bait-and-switch in the Grand Bazaar'], 'eVisa available for many passports.'),
    "CY": (7.7, "mostly_safe", "Cyprus — relaxed and safe; both north and south are generally fine.",        "Apr–Jun, Sep–Oct",         WEU_TIPS, WEU_SCAMS, EU_NONSCHENGEN),

    # ===== Caucasus / Central Asia =====
    "AM": (7.5, "mostly_safe", "Armenia — friendly, walkable, very welcoming to foreigners.",                "May–Oct",                  EEU_TIPS, EEU_SCAMS, EVISA),
    "AZ": (7.0, "mostly_safe", "Azerbaijan — modern Baku, mind the Karabakh region.",                       "Apr–Oct",                  EEU_TIPS, EEU_SCAMS, EVISA),
    "GE": (7.6, "mostly_safe", "Georgia — Tbilisi is safe; avoid breakaway regions.",                       "May–Oct",                  EEU_TIPS, EEU_SCAMS, '1 year visa-free for many passports.'),
    "KZ": (7.5, "mostly_safe", "Kazakhstan — modern cities, vast steppe.",                                   "May–Sep",                  EEU_TIPS, EEU_SCAMS, '30 days visa-free for many passports.'),
    "KG": (7.0, "mostly_safe", "Kyrgyzstan — beautiful mountains, very welcoming.",                          "Jun–Sep",                  EEU_TIPS, EEU_SCAMS, '60 days visa-free for many passports.'),
    "TJ": (6.5, "mostly_safe", "Tajikistan — remote, friendly. Mind border zones.",                          "Jun–Sep",                  EEU_TIPS + ['Carry permits for Pamir Highway / GBAO'], EEU_SCAMS, EVISA + ' GBAO permit required for the Pamirs.'),
    "TM": (5.5, "caution",     "Turkmenistan — restrictive police state; tours-only travel.",                 "Apr–Jun, Sep–Oct",         EEU_TIPS, ['Avoid photographing govt buildings','Stay with your assigned guide'], 'Tourist visa requires a tour-operator letter.'),
    "UZ": (7.5, "mostly_safe", "Uzbekistan — Silk Road cities, easy travel.",                                "Apr–Jun, Sep–Oct",         EEU_TIPS, EEU_SCAMS, '30 days visa-free for many passports.'),
    "MN": (7.5, "mostly_safe", "Mongolia — welcoming, vast steppe. Ulaanbaatar pickpockets.",                "Jun–Sep",                  EEU_TIPS, EEU_SCAMS, '30 days visa-free for many passports.'),

    # ===== East Asia =====
    "CN": (8.0, "safe",        "China — extremely low street crime; bigger issue is censored internet.",     "Apr–May, Sep–Oct",         EAS_TIPS + ['Install a VPN before arrival','Carry cash plus Alipay/WeChat'], ['"Tea ceremony" trap near Tiananmen','English-speaking "art student" gallery scam'], 'Visa-free transit / 30-day visa-free for many countries (rules vary).'),
    "HK": (8.0, "safe",        "Hong Kong — efficient and safe. Pickpockets in MTR rush hour.",              "Oct–Dec, Mar–May",         EAS_TIPS, EAS_SCAMS, '90 days visa-free for many passports.'),
    "MO": (8.4, "safe",        "Macau — casinos and Portuguese-influenced food. Very safe.",                 "Oct–Dec",                  EAS_TIPS, EAS_SCAMS, '30 days visa-free for many passports.'),
    "TW": (8.5, "safe",        "Taiwan — friendly, clean, very safe.",                                       "Oct–Dec, Mar–May",         EAS_TIPS, EAS_SCAMS, '90 days visa-free for many passports.'),
    "KR": (8.4, "safe",        "South Korea — extremely safe, world-class transit.",                          "Apr–Jun, Sep–Nov",         EAS_TIPS, ['Late-night Itaewon overcharging at unlicensed bars'], '90 days visa-free with K-ETA for many passports.'),
    "KP": (2.0, "do_not_travel","North Korea — heavily controlled tours only. US passports barred.",         "May–Oct (advisory dependent)", ['Travel only with state-approved guides','Never criticize leadership in public'], ['Don\'t carry religious literature','Don\'t take photos of soldiers'], 'Tourist visa via state operator only — many advisories warn against.'),

    # ===== Southeast Asia =====
    "MY": (7.4, "mostly_safe", "Malaysia — diverse, easy travel; mind petty theft in KL.",                    "Mar–Oct (peninsula)",      SEA_TIPS, SEA_SCAMS, '90 days visa-free for many passports.'),
    "SG": (9.5, "safe",        "Singapore — among the safest cities anywhere. Strict laws — read them.",     "Year-round",               SEA_TIPS + ['No chewing gum imports','Don\'t litter — fines are real'], ['Few — but inflated taxi fares from changi via flagged cabs'], '90 days visa-free for many passports.'),
    "PH": (6.5, "mostly_safe", "Philippines — friendly islands; mind Mindanao security warnings.",            "Dec–Apr",                  SEA_TIPS, ['Manila taxi meter "broken" — use Grab','Beach-resort jet-ski "damage" claims'], '30 days visa-free for many passports.'),
    "KH": (6.5, "mostly_safe", "Cambodia — Angkor and Phnom Penh; bag-snatching from scooters in PP.",       "Nov–Mar",                  SEA_TIPS, ['Bag-snatching from scooters in Phnom Penh','Tuk-tuk taking you to "the only open temple"'], 'eVisa or VOA for most nationalities.'),
    "LA": (7.2, "mostly_safe", "Laos — laid-back, gorgeous, slow-paced.",                                     "Nov–Apr",                  SEA_TIPS, ['Tubing-related thefts in Vang Vieng','Money-changer short-changing'], 'eVisa or VOA for most nationalities.'),
    "MM": (4.5, "high_risk",   "Myanmar — civil conflict and military regime; most advisories warn against.","Nov–Feb (advisory dependent)", SEA_TIPS + ['Avoid all conflict zones — most of the country','Carry US dollars in pristine condition'], ['Internet kill-switches','ATM/credit-card systems unreliable'], 'eVisa for most nationalities — security situation severe.'),
    "BN": (8.5, "safe",        "Brunei — tiny, oil-rich, very safe and orderly.",                             "Year-round (avoid monsoon spikes)", SEA_TIPS, ['Few — alcohol is banned, do not bring any'], '90 days visa-free for many Western passports.'),
    "TL": (6.5, "mostly_safe", "Timor-Leste — emerging, friendly, off-grid.",                                 "May–Nov",                  SEA_TIPS, SEA_SCAMS, '30-day VOA for many passports.'),

    # ===== South Asia =====
    "IN": (6.0, "caution",     "India — dazzling but intense. Street smarts essential in mega-cities.",       "Oct–Mar (most regions)",   SAS_TIPS, SAS_SCAMS, 'eVisa for most nationalities.'),
    "PK": (4.5, "high_risk",   "Pakistan — friendly people, but security advisories warn against many regions.","Mar–May, Sep–Nov",         SAS_TIPS, SAS_SCAMS + ['Avoid Balochistan and KPK borders'], 'eVisa for many nationalities.'),
    "BD": (5.5, "caution",     "Bangladesh — chaotic megacity (Dhaka), warm hospitality.",                    "Nov–Feb",                  SAS_TIPS, SAS_SCAMS, 'VOA available for many passports.'),
    "LK": (7.0, "mostly_safe", "Sri Lanka — recovering tourism; safe for travelers, fuel can be tight.",      "Dec–Mar (south/west)",     SAS_TIPS, ['Tuk-tuk friend "shop tour" scam','Inflated train-ticket "agent" prices'], 'eTA / ETA online before arrival.'),
    "NP": (7.0, "mostly_safe", "Nepal — Himalayan trekking gold standard. Kathmandu pollution is real.",      "Oct–Nov, Mar–May",         SAS_TIPS, ['Fake trekking-permit "agencies"','Inflated taxi fares from KTM airport'], 'VOA for most nationalities.'),
    "BT": (8.6, "safe",        "Bhutan — tightly regulated tourism, very safe and pristine.",                  "Mar–May, Sep–Nov",         SAS_TIPS, ['Few — official-tour-only travel limits scams'], 'Daily fee + visa via licensed tour operator.'),
    "MV": (8.4, "safe",        "Maldives — resort-island travel is extremely safe.",                          "Nov–Apr",                  SAS_TIPS, ['Inflated dive-equipment rentals at lower-tier resorts'], '30 days visa-free for most passports.'),
    "AF": (1.5, "do_not_travel","Afghanistan — active conflict; nearly all governments warn against.",        "Year-round (advisory dependent)", ['Don\'t travel — most embassies cannot help'], ['Kidnapping','Mines'], NO_TRAVEL),

    # ===== Middle East =====
    "AE": (8.3, "safe",        "UAE — Dubai/AbuDhabi very safe; respect local laws and dress in public.",    "Nov–Mar",                  MENA_TIPS, ['Inflated "VIP" club entry fees','Tour overcharging in souks'], '30 days visa-free for many passports.'),
    "BH": (8.0, "safe",        "Bahrain — small, modern Gulf state; safe for travelers.",                     "Nov–Mar",                  MENA_TIPS, MENA_SCAMS, 'eVisa or VOA for many passports.'),
    "QA": (8.4, "safe",        "Qatar — extremely safe; respect the conservative culture.",                    "Nov–Mar",                  MENA_TIPS, ['Few — but be careful with PDA, it can lead to fines'], '30 days visa-free for many passports.'),
    "OM": (8.5, "safe",        "Oman — calm, hospitable, dramatic landscapes.",                                "Oct–Apr",                  MENA_TIPS, MENA_SCAMS, 'eVisa for most nationalities.'),
    "SA": (7.3, "mostly_safe", "Saudi Arabia — newly opened to tourism; respect strict cultural norms.",       "Nov–Mar",                  MENA_TIPS + ['Women: avoid solo nighttime walks in unfamiliar areas'], MENA_SCAMS, 'eVisa for many Western passports.'),
    "KW": (8.0, "safe",        "Kuwait — small Gulf state; safe and conservative.",                            "Nov–Mar",                  MENA_TIPS, MENA_SCAMS, 'eVisa for many nationalities.'),
    "JO": (7.5, "mostly_safe", "Jordan — Petra, Wadi Rum, hospitable. Border regions need caution.",          "Mar–May, Sep–Nov",         MENA_TIPS, ['"Free" guide in Petra ramps up to large tip','Inflated camel rides — agree price first'], 'Jordan Pass includes visa for many passports.'),
    "LB": (4.0, "high_risk",   "Lebanon — vibrant Beirut, but ongoing political/economic crisis.",            "May–Sep (advisory dependent)", MENA_TIPS, MENA_SCAMS + ['Currency black market — research before exchanging'], 'Visa-on-arrival for many passports — situation volatile.'),
    "IL": (6.5, "caution",     "Israel — modern but security situation can change rapidly. Heed alerts.",     "Spring/Fall",               MENA_TIPS + ['Heed air-raid alerts and shelters'], MENA_SCAMS, '90 days visa-free for many passports.'),
    "PS": (5.0, "caution",     "Palestinian Territories — conditions vary widely; consult advisories.",       "Spring/Fall (advisory dependent)", MENA_TIPS, MENA_SCAMS, 'Enter via Israel/Jordan; check restrictions.'),
    "IQ": (3.0, "high_risk",   "Iraq — active threats outside Kurdistan; consult advisories.",                "Spring/Fall (advisory dependent)", MENA_TIPS, ['Kidnapping risk','IED threats off-route'], 'eVisa or VOA in Kurdistan; mainland Iraq more restrictive.'),
    "IR": (5.0, "caution",     "Iran — friendly people, but US/UK passports face severe restrictions.",       "Mar–May, Sep–Nov",         MENA_TIPS + ['No alcohol or pork; women must wear hijab'], MENA_SCAMS, 'Visa via authorized tour operator for many Western passports.'),
    "SY": (1.5, "do_not_travel","Syria — civil war ongoing; nearly all governments warn against.",            "Year-round (advisory dependent)", ['Don\'t travel'], ['Active conflict','Kidnapping'], NO_TRAVEL),
    "YE": (1.5, "do_not_travel","Yemen — active war and humanitarian crisis.",                                "Year-round (advisory dependent)", ['Don\'t travel'], ['Active conflict','Kidnapping'], NO_TRAVEL),

    # ===== North Africa =====
    "EG": (6.0, "caution",     "Egypt — Pyramids, Nile, Red Sea. Pickpocket and tout pressure is intense.",   "Oct–Apr",                  MENA_TIPS + ['Carry small change for tips ("baksheesh")'], ['"Closed temple" trick — temples are open','Camel rides at pyramids escalating fees','Restaurant menu without prices'], 'eVisa for many nationalities.'),
    "MA": (6.5, "caution",     "Morocco — Marrakech medina is intense; cities calm at night.",                "Mar–May, Sep–Nov",         MENA_TIPS, ['Henna pushy sellers','"Free" guide leading you to a shop','Wrong-direction "shortcut" through medina'], '90 days visa-free for many passports.'),
    "TN": (6.0, "caution",     "Tunisia — coast and ancient sites; mind border regions.",                      "Apr–Jun, Sep–Nov",         MENA_TIPS, MENA_SCAMS, '90 days visa-free for many passports.'),
    "DZ": (5.5, "caution",     "Algeria — beautiful but bureaucratic; most travel needs guides.",              "Mar–May, Sep–Nov",         MENA_TIPS, MENA_SCAMS, 'Visa required in advance — invitation often needed.'),
    "LY": (3.0, "high_risk",   "Libya — ongoing instability; most governments warn against.",                  "Year-round (advisory dependent)", MENA_TIPS, ['Active conflict','Kidnapping'], 'Visa restrictions severe.'),
    "SD": (2.5, "do_not_travel","Sudan — civil war; nearly all governments warn against.",                    "Year-round (advisory dependent)", ['Don\'t travel'], ['Active conflict','Famine'], NO_TRAVEL),
    "EH": (5.0, "caution",     "Western Sahara — disputed territory; consult advisories.",                    "Year-round (advisory dependent)", MENA_TIPS, ['Mine areas off-track','Border tensions'], 'Enter via Morocco; restrictions apply.'),

    # ===== Sub-Saharan Africa =====
    "ZA": (5.5, "caution",     "South Africa — incredible nature; high crime requires city smarts.",          "Mar–May, Sep–Nov",         SSA_TIPS + ['Don\'t walk after dark in cities','Use ride-hailing, never flag'], ['Smash-and-grab at traffic lights','Card skimming at petrol stations'], '90 days visa-free for many passports.'),
    "KE": (5.5, "caution",     "Kenya — safari heaven; Nairobi requires caution at night.",                   "Jun–Oct, Jan–Feb",         SSA_TIPS, SSA_SCAMS, 'eTA online before arrival.'),
    "TZ": (6.0, "caution",     "Tanzania — Serengeti, Kilimanjaro, Zanzibar. Generally safe with sense.",     "Jun–Oct, Jan–Feb",         SSA_TIPS, SSA_SCAMS, 'eVisa available; VOA for many.'),
    "UG": (5.5, "caution",     "Uganda — gorillas and friendly people; mind borders.",                        "Jun–Aug, Dec–Feb",         SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "RW": (7.0, "mostly_safe", "Rwanda — exceptionally safe and clean. Gorilla tracking world-class.",        "Jun–Sep, Dec–Feb",         SSA_TIPS, ['Few — but motorbike-taxi accidents are real'], '30 days visa-free for many passports.'),
    "ET": (4.5, "high_risk",   "Ethiopia — ongoing internal conflict. Addis is calmer than the regions.",     "Oct–Mar (advisory dependent)", SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "GH": (6.5, "mostly_safe", "Ghana — friendly West African gateway. Yellow-fever vax required.",            "Nov–Apr",                  SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "SN": (6.5, "mostly_safe", "Senegal — Dakar is welcoming; mind petty theft.",                              "Nov–May",                  SSA_TIPS, SSA_SCAMS, '90 days visa-free for many passports.'),
    "CI": (6.0, "caution",     "Côte d\'Ivoire — Abidjan is modern; rural roads risky.",                       "Nov–Mar",                  SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "BW": (7.5, "mostly_safe", "Botswana — Okavango Delta safari, very orderly.",                              "May–Oct",                  SSA_TIPS, SSA_SCAMS, '90 days visa-free for many passports.'),
    "NA": (7.0, "mostly_safe", "Namibia — incredible deserts, low crime, self-drive friendly.",                "May–Oct",                  SSA_TIPS, ['Vehicle rental damage charges — photograph everything'], '90 days visa-free for many passports.'),
    "ZM": (6.0, "caution",     "Zambia — Vic Falls, walking safaris. Friendly, low-key.",                      "May–Oct",                  SSA_TIPS, SSA_SCAMS, 'eVisa or VOA.'),
    "ZW": (6.0, "caution",     "Zimbabwe — Vic Falls, Hwange. Cash flow is tight; bring USD.",                 "May–Oct",                  SSA_TIPS + ['Bring cash USD — ATMs unreliable'], SSA_SCAMS, 'VOA for many passports.'),
    "MZ": (5.0, "caution",     "Mozambique — Indian Ocean coast; mind northern Cabo Delgado security.",       "May–Oct",                  SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "MG": (6.0, "caution",     "Madagascar — unique wildlife; rural travel is slow and rough.",                 "Apr–Nov",                  SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "MU": (7.7, "mostly_safe", "Mauritius — beach paradise, very safe.",                                       "May–Dec",                  SSA_TIPS, ['Inflated taxi fares from airport — agree first'], '60 days visa-free for many passports.'),
    "SC": (7.8, "mostly_safe", "Seychelles — pristine beaches, very safe.",                                    "Apr–May, Oct–Nov",         SSA_TIPS, ['Tour operators inflating prices off-season'], '90 days visa-free for many passports.'),
    "RE": (7.5, "mostly_safe", "Réunion — French overseas dept, hiking and volcanoes.",                        "Apr–Nov",                  WEU_TIPS, WEU_SCAMS, 'Schengen rules via France.'),
    "CV": (7.0, "mostly_safe", "Cape Verde — laid-back island chain, calm.",                                    "Nov–Jun",                  SSA_TIPS, SSA_SCAMS, 'EASE pre-registration online for many passports.'),
    "ST": (6.5, "mostly_safe", "São Tomé — small, sleepy, undiscovered.",                                       "Jun–Sep",                  SSA_TIPS, SSA_SCAMS, '15 days visa-free for many EU passports.'),
    "AO": (5.5, "caution",     "Angola — emerging tourism; mostly safe in cities, expensive.",                  "Apr–Oct",                  SSA_TIPS, SSA_SCAMS, 'Visa or eVisa required.'),
    "NG": (4.0, "high_risk",   "Nigeria — Lagos requires city smarts; northern regions unsafe.",                "Nov–Mar (advisory dependent)", SSA_TIPS, SSA_SCAMS + ['Sham 419/cyber scams continue offline'], 'eVisa available; situation regional.'),
    "CM": (4.5, "high_risk",   "Cameroon — Yaoundé/Douala; avoid northwest/southwest regions.",                 "Nov–Mar (advisory dependent)", SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "ML": (3.0, "high_risk",   "Mali — terrorism threat across most of country.",                              "Nov–Feb (advisory dependent)", SSA_TIPS, ['Kidnapping','Terrorism'], 'Visa required; advisories warn against.'),
    "BF": (3.5, "high_risk",   "Burkina Faso — terrorism in much of country.",                                 "Nov–Feb (advisory dependent)", SSA_TIPS, ['Kidnapping','Terrorism'], 'Visa required; advisories warn against.'),
    "NE": (3.5, "high_risk",   "Niger — terrorism / coup-related instability.",                                "Nov–Feb (advisory dependent)", SSA_TIPS, ['Kidnapping','Border tensions'], 'Visa required; advisories warn against.'),
    "TD": (3.5, "high_risk",   "Chad — political instability and terrorism in border regions.",                "Nov–Feb (advisory dependent)", SSA_TIPS, SSA_SCAMS, 'Visa required.'),
    "MR": (5.0, "caution",     "Mauritania — desert nation; security in border regions varies.",               "Nov–Mar",                  SSA_TIPS, SSA_SCAMS, 'VOA for some passports — check advisories.'),
    "GM": (6.5, "mostly_safe", "Gambia — small, friendly, English-speaking West African gateway.",             "Nov–Mar",                  SSA_TIPS, SSA_SCAMS, '90 days visa-free for many passports.'),
    "GN": (5.0, "caution",     "Guinea — political volatility; rural travel slow.",                             "Nov–Apr (advisory dependent)", SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "GW": (5.0, "caution",     "Guinea-Bissau — small, calm but politically volatile.",                         "Nov–Apr",                  SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "SL": (5.5, "caution",     "Sierra Leone — Freetown is welcoming; rural roads tough.",                      "Nov–Apr",                  SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "LR": (5.0, "caution",     "Liberia — friendly capital, limited tourism infrastructure.",                  "Nov–Apr",                  SSA_TIPS, SSA_SCAMS, 'Visa required.'),
    "TG": (6.0, "mostly_safe", "Togo — small, calm West African nation.",                                       "Nov–Mar",                  SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "BJ": (6.0, "mostly_safe", "Benin — voodoo heritage and friendly people.",                                  "Nov–Mar",                  SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "CG": (5.0, "caution",     "Republic of Congo — rainforests and gorillas; off-the-beaten-path.",            "Jun–Aug",                  SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "CD": (3.0, "high_risk",   "DRC — large country with widespread security issues.",                         "May–Sep (advisory dependent)", SSA_TIPS, ['Armed-group activity','Kidnapping in eastern DRC'], 'Visa required; many advisories warn.'),
    "GA": (6.0, "mostly_safe", "Gabon — Libreville and pristine rainforest national parks.",                    "Jun–Sep",                  SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "GQ": (5.0, "caution",     "Equatorial Guinea — restrictive, oil-money infrastructure.",                    "Year-round",               SSA_TIPS, SSA_SCAMS, 'Visa required; restrictive.'),
    "CF": (2.5, "do_not_travel","Central African Republic — civil conflict.",                                  "Year-round (advisory dependent)", ['Don\'t travel'], ['Active conflict','Kidnapping'], NO_TRAVEL),
    "SS": (2.0, "do_not_travel","South Sudan — civil conflict and humanitarian crisis.",                       "Year-round (advisory dependent)", ['Don\'t travel'], ['Active conflict','Famine'], NO_TRAVEL),
    "SO": (1.5, "do_not_travel","Somalia — terrorism and piracy.",                                             "Year-round (advisory dependent)", ['Don\'t travel'], ['Terrorism','Kidnapping'], NO_TRAVEL),
    "DJ": (6.5, "mostly_safe", "Djibouti — Horn of Africa gateway, expat-friendly.",                            "Nov–Mar",                  SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "ER": (4.0, "high_risk",   "Eritrea — heavily restricted travel; permits required.",                        "Year-round",               SSA_TIPS, SSA_SCAMS, 'Visa via embassy required.'),
    "BI": (4.5, "high_risk",   "Burundi — political fragility; rural areas tense.",                            "Year-round (advisory dependent)", SSA_TIPS, SSA_SCAMS, 'eVisa available.'),
    "MW": (6.0, "mostly_safe", "Malawi — friendly, lake-side, off-grid.",                                       "May–Oct",                  SSA_TIPS, SSA_SCAMS, 'eVisa or VOA for many.'),
    "LS": (6.0, "mostly_safe", "Lesotho — mountain kingdom inside South Africa.",                                "Sep–Apr",                  SSA_TIPS, SSA_SCAMS, '90 days visa-free for many passports.'),
    "SZ": (6.5, "mostly_safe", "Eswatini — small, calm kingdom near SA.",                                       "May–Sep",                  SSA_TIPS, SSA_SCAMS, '30 days visa-free for many passports.'),
    "KM": (6.0, "mostly_safe", "Comoros — small Indian Ocean archipelago.",                                     "May–Oct",                  SSA_TIPS, SSA_SCAMS, 'VOA for most passports.'),
    "YT": (7.0, "mostly_safe", "Mayotte — French overseas dept in the Indian Ocean.",                           "May–Oct",                  WEU_TIPS, WEU_SCAMS, 'Schengen rules via France.'),
    "SH": (8.0, "safe",        "Saint Helena — remote South Atlantic island.",                                  "Year-round",               WEU_TIPS, ['Few — flights are infrequent, plan well ahead'], '6 months visa-free for many passports.'),

    # ===== North America =====
    "CA": (8.8, "safe",        "Canada — friendly, vast, and very safe.",                                      "May–Oct (varies by region)", NA_TIPS, NA_SCAMS, 'eTA for many visa-free passports.'),
    # ===== Caribbean =====
    "BS": (7.5, "mostly_safe", "Bahamas — Nassau is busy; out-islands very calm.",                              "Dec–Apr",                  CARIB_TIPS, CARIB_SCAMS, '90 days visa-free for many passports.'),
    "BB": (7.5, "mostly_safe", "Barbados — laid-back, English-speaking.",                                       "Dec–Apr",                  CARIB_TIPS, CARIB_SCAMS, '6 months visa-free for many passports.'),
    "TT": (5.5, "caution",     "Trinidad & Tobago — fun culture; mind crime in Port of Spain.",                "Jan–May",                  CARIB_TIPS, CARIB_SCAMS, '90 days visa-free for many passports.'),
    "CU": (7.5, "mostly_safe", "Cuba — slow internet, classic cars, friendly. Bring cash USD/EUR.",            "Nov–Apr",                  CARIB_TIPS + ['Bring crisp USD/EUR — cards rarely work','Two currencies — read change carefully'], ['"Friend" leading you to a paladar with kickback','Cigar street-sellers selling fakes'], 'Tourist card required — usually included with airline.'),
    "DO": (6.5, "mostly_safe", "Dominican Republic — resort areas safe; cities mind crime.",                    "Nov–Apr",                  CARIB_TIPS, CARIB_SCAMS, 'Tourist card included on entry.'),
    "JM": (5.5, "caution",     "Jamaica — beach resorts safe; cities require caution.",                          "Nov–Apr",                  CARIB_TIPS, CARIB_SCAMS, '90 days visa-free for many passports.'),
    "HT": (3.0, "do_not_travel","Haiti — gang violence severe in Port-au-Prince.",                              "Year-round (advisory dependent)", ['Don\'t travel'], ['Kidnapping','Active gang activity'], 'Visa rules vary; many advisories warn against.'),
    "PR": (7.5, "mostly_safe", "Puerto Rico — beautiful beaches, US territory rules apply.",                     "Dec–Apr",                  NA_TIPS, NA_SCAMS, 'No visa for US/visa-free entry.'),
    "AW": (8.0, "safe",        "Aruba — sunny island, very safe.",                                              "Year-round",               CARIB_TIPS, CARIB_SCAMS, '30 days visa-free for many passports.'),
    "CW": (7.5, "mostly_safe", "Curaçao — Dutch Caribbean, colorful Willemstad.",                                "May–Nov (less rain)",      CARIB_TIPS, CARIB_SCAMS, '90 days visa-free for many passports.'),
    "SX": (7.5, "mostly_safe", "Sint Maarten — duty-free Caribbean half.",                                       "Dec–Apr",                  CARIB_TIPS, CARIB_SCAMS, '90 days visa-free for many passports.'),
    "BM": (8.5, "safe",        "Bermuda — pink sand and pastel houses; very safe.",                              "Apr–Oct",                  CARIB_TIPS, CARIB_SCAMS, '6 months visa-free for many passports.'),
    "KY": (8.7, "safe",        "Cayman Islands — clean, safe, expensive.",                                       "Nov–May",                  CARIB_TIPS, CARIB_SCAMS, '6 months visa-free for many passports.'),
    "TC": (8.0, "safe",        "Turks & Caicos — quiet, very safe.",                                             "Nov–Apr",                  CARIB_TIPS, CARIB_SCAMS, '90 days visa-free for many passports.'),
    "VG": (8.0, "safe",        "British Virgin Islands — sailing and beaches.",                                   "Dec–May",                  CARIB_TIPS, CARIB_SCAMS, '6 months visa-free for many passports.'),
    "VI": (7.5, "mostly_safe", "US Virgin Islands — beaches and rum.",                                            "Dec–Apr",                  CARIB_TIPS, CARIB_SCAMS, 'No visa for US — visa-free for many.'),
    "AI": (8.0, "safe",        "Anguilla — quiet, upscale Caribbean.",                                            "Dec–Apr",                  CARIB_TIPS, CARIB_SCAMS, '90 days visa-free for many passports.'),
    "AG": (7.5, "mostly_safe", "Antigua & Barbuda — beach-per-day; safe.",                                        "Dec–Apr",                  CARIB_TIPS, CARIB_SCAMS, '6 months visa-free for many passports.'),
    "DM": (7.0, "mostly_safe", "Dominica — eco-tourism, hot springs, hiking.",                                   "Feb–May",                  CARIB_TIPS, CARIB_SCAMS, '6 months visa-free for many passports.'),
    "GD": (7.0, "mostly_safe", "Grenada — spice island; calm and welcoming.",                                    "Jan–May",                  CARIB_TIPS, CARIB_SCAMS, '90 days visa-free for many passports.'),
    "KN": (7.5, "mostly_safe", "Saint Kitts & Nevis — small, calm island pair.",                                  "Dec–Apr",                  CARIB_TIPS, CARIB_SCAMS, '90 days visa-free for many passports.'),
    "LC": (7.0, "mostly_safe", "Saint Lucia — Pitons and resorts; safe.",                                         "Dec–Apr",                  CARIB_TIPS, CARIB_SCAMS, '6 weeks visa-free for many passports.'),
    "VC": (7.0, "mostly_safe", "Saint Vincent & the Grenadines — sailing paradise.",                              "Dec–Apr",                  CARIB_TIPS, CARIB_SCAMS, '30 days visa-free for many passports.'),
    "MS": (7.0, "mostly_safe", "Montserrat — volcano half-island; quiet.",                                        "Year-round",               CARIB_TIPS, CARIB_SCAMS, '90 days visa-free for many passports.'),
    "BL": (8.0, "safe",        "Saint Barthélemy — luxury French Caribbean.",                                     "Dec–Apr",                  WEU_TIPS, WEU_SCAMS, 'Schengen rules via France.'),
    "MF": (7.0, "mostly_safe", "Saint Martin — French half of the island.",                                       "Dec–Apr",                  WEU_TIPS, WEU_SCAMS, 'Schengen rules via France.'),
    "GP": (7.0, "mostly_safe", "Guadeloupe — French Antilles, beaches, hiking.",                                  "Dec–Apr",                  WEU_TIPS, WEU_SCAMS, 'Schengen rules via France.'),
    "MQ": (7.0, "mostly_safe", "Martinique — French Antilles; great beaches.",                                    "Dec–Apr",                  WEU_TIPS, WEU_SCAMS, 'Schengen rules via France.'),
    "PM": (8.0, "safe",        "Saint Pierre & Miquelon — French outpost off Canada.",                            "Jun–Sep",                  NORDIC_TIPS, ['Few — limited tourism'], 'Schengen rules via France.'),
    "BQ": (8.0, "safe",        "Bonaire, St Eustatius, Saba — Dutch Caribbean.",                                  "Apr–Nov",                  CARIB_TIPS, CARIB_SCAMS, '90 days visa-free for many passports.'),

    # ===== Central America =====
    "GT": (5.0, "caution",     "Guatemala — Tikal and Antigua are safe; mind cities.",                          "Nov–Apr",                  LATAM_TIPS, LATAM_SCAMS, '90 days visa-free for many passports.'),
    "HN": (4.5, "high_risk",   "Honduras — Roatán resort area safe; cities high crime.",                        "Nov–Apr",                  LATAM_TIPS, LATAM_SCAMS + ['Don\'t walk in San Pedro Sula or Tegucigalpa at night'], '90 days visa-free for many passports.'),
    "SV": (5.0, "caution",     "El Salvador — quickly improving; surf coast popular.",                          "Nov–Apr",                  LATAM_TIPS, LATAM_SCAMS, '90 days visa-free for many passports.'),
    "NI": (5.5, "caution",     "Nicaragua — politically tense; Granada and Ometepe still calm.",                "Nov–Apr",                  LATAM_TIPS, LATAM_SCAMS, '90 days visa-free for many passports.'),
    "BZ": (6.0, "mostly_safe", "Belize — barrier reef and Maya ruins; English-speaking.",                        "Nov–Apr",                  LATAM_TIPS, LATAM_SCAMS, '30 days visa-free for many passports.'),
    "CR": (7.0, "mostly_safe", "Costa Rica — eco-tourism gold standard; very welcoming.",                         "Dec–Apr",                  LATAM_TIPS, LATAM_SCAMS, '90 days visa-free for many passports.'),
    "PA": (7.0, "mostly_safe", "Panama — Casco Viejo Panama City + Bocas del Toro.",                              "Dec–Apr",                  LATAM_TIPS, LATAM_SCAMS, '90 days visa-free for many passports.'),

    # ===== South America =====
    "AR": (6.5, "mostly_safe", "Argentina — Buenos Aires, Patagonia, wine country.",                              "Oct–Apr (region varies)",  LATAM_TIPS, ['Counterfeit peso change — count notes carefully','BA bus / "Blue dollar" exchange complications'], '90 days visa-free for many passports.'),
    "BR": (5.8, "caution",     "Brazil — incredible nature; cities require sensible caution.",                    "Sep–Mar (region varies)",  LATAM_TIPS, ['Cellphone snatching at red lights','Beach-vendor inflated prices'], '90 days visa-free for many passports.'),
    "CL": (7.5, "mostly_safe", "Chile — Patagonia, Atacama; mostly very calm.",                                   "Oct–Apr (varies)",         LATAM_TIPS, LATAM_SCAMS, '90 days visa-free for many passports.'),
    "CO": (5.5, "caution",     "Colombia — Bogotá, Medellín, coast all welcoming; rural border zones risky.",     "Dec–Mar (varies)",         LATAM_TIPS, LATAM_SCAMS + ['Scopolamine ("Devil\'s breath") drug-and-rob — don\'t accept open drinks'], '90 days visa-free for many passports.'),
    "PE": (6.0, "mostly_safe", "Peru — Machu Picchu, Lima, Sacred Valley.",                                       "May–Sep",                  LATAM_TIPS, LATAM_SCAMS + ['Cusco "guide" leading to a friend\'s shop'], '180 days visa-free for many passports.'),
    "EC": (5.0, "caution",     "Ecuador — Galapagos and Andes; cities require caution.",                          "Jun–Sep, Dec–Jan",         LATAM_TIPS, LATAM_SCAMS, '90 days visa-free for many passports.'),
    "BO": (6.0, "mostly_safe", "Bolivia — high altitude; La Paz can be intense.",                                 "May–Oct",                  LATAM_TIPS, LATAM_SCAMS + ['Fake police "wallet check" — never hand over docs in the street'], '90 days visa-free for many passports.'),
    "PY": (6.5, "mostly_safe", "Paraguay — calm, rural, off-the-beaten-path.",                                    "Apr–Sep",                  LATAM_TIPS, LATAM_SCAMS, '90 days visa-free for many passports.'),
    "UY": (8.0, "safe",        "Uruguay — relaxed, safe, often called the Switzerland of South America.",       "Dec–Mar",                  LATAM_TIPS, LATAM_SCAMS, '90 days visa-free for many passports.'),
    "VE": (3.5, "high_risk",   "Venezuela — economic and political crisis; widespread risk.",                     "Dec–Apr (advisory dependent)", LATAM_TIPS, ['Express kidnapping','Severe shortages'], 'Visa required for many — advisories warn against.'),
    "GY": (6.0, "mostly_safe", "Guyana — English-speaking, jungle-rich.",                                          "Sep–Mar",                  LATAM_TIPS, LATAM_SCAMS, '90 days visa-free for many passports.'),
    "SR": (6.5, "mostly_safe", "Suriname — Dutch-speaking, off-grid jungles.",                                     "Aug–Nov",                  LATAM_TIPS, LATAM_SCAMS, '90 days visa-free for many passports (Tourist Card).'),
    "GF": (6.5, "mostly_safe", "French Guiana — French overseas dept; rocket launches at Kourou.",                 "Jul–Nov",                  WEU_TIPS, WEU_SCAMS, 'Schengen rules via France.'),
    "FK": (8.5, "safe",        "Falkland Islands — remote, safe, British overseas territory.",                     "Nov–Mar",                  ['Wear weatherproof gear year-round','Ask before crossing private fields'], ['Few — limited tourism'], '4 weeks visa-free for many passports.'),

    # ===== Oceania =====
    "NZ": (9.2, "safe",        "New Zealand — incredibly safe, world-class outdoors.",                            "Nov–Apr (Sep–Nov for skiing)", OCE_TIPS, ['Rental-car damage charges — photograph everything'], 'eTA / NZeTA before arrival.'),
    "FJ": (7.0, "mostly_safe", "Fiji — friendly islanders; resort areas very safe.",                              "May–Oct",                  OCE_TIPS, ['Inflated taxi fares — agree before riding'], '4 months visa-free for many passports.'),
    "PG": (5.0, "caution",     "Papua New Guinea — adventurous; security in Port Moresby tight.",                 "May–Oct",                  OCE_TIPS, ['"Raskol" gang activity — avoid walking in cities'], 'Visa or VOA depending on passport.'),
    "SB": (6.5, "mostly_safe", "Solomon Islands — remote, friendly, undeveloped.",                                "May–Oct",                  OCE_TIPS, ['Few — limited infrastructure'], '90 days visa-free for many passports.'),
    "VU": (7.5, "mostly_safe", "Vanuatu — small islands, volcanoes, kava.",                                       "May–Oct",                  OCE_TIPS, ['Few — small tourism'], '30 days visa-free for many passports.'),
    "WS": (7.5, "mostly_safe", "Samoa — laid-back, friendly Pacific island.",                                     "May–Oct",                  OCE_TIPS, ['Few'], '60 days visa-free for many passports.'),
    "TO": (7.5, "mostly_safe", "Tonga — quiet kingdom; whale-watching season Jul–Oct.",                            "May–Oct",                  OCE_TIPS, ['Few'], '31 days visa-free for many passports.'),
    "PW": (8.0, "safe",        "Palau — diving paradise.",                                                         "Nov–Apr",                  OCE_TIPS, ['Few'], '30 days visa-free for many passports.'),
    "FM": (7.5, "mostly_safe", "Micronesia — island-hopping, WWII history.",                                       "Nov–Apr",                  OCE_TIPS, ['Few'], '30 days visa-free for many passports.'),
    "KI": (7.0, "mostly_safe", "Kiribati — remote atolls; climate-vulnerable.",                                    "May–Oct",                  OCE_TIPS, ['Few — limited infrastructure'], '30 days visa-free for many passports.'),
    "TV": (7.5, "mostly_safe", "Tuvalu — tiny, friendly, off-grid.",                                               "May–Oct",                  OCE_TIPS, ['Few'], '30 days visa-free for many passports.'),
    "NR": (7.0, "mostly_safe", "Nauru — smallest republic; quiet.",                                                "May–Oct",                  OCE_TIPS, ['Few'], 'Visa required, with sponsor letter.'),
    "MH": (7.0, "mostly_safe", "Marshall Islands — atolls, WWII history.",                                         "May–Oct",                  OCE_TIPS, ['Few'], '30 days visa-free for many passports.'),
    "PF": (8.0, "safe",        "French Polynesia — Bora Bora, Tahiti.",                                            "May–Oct",                  WEU_TIPS, WEU_SCAMS, 'Schengen rules via France.'),
    "NC": (7.7, "mostly_safe", "New Caledonia — French Pacific.",                                                  "May–Oct",                  WEU_TIPS, WEU_SCAMS, 'Schengen rules via France.'),
    "WF": (7.5, "mostly_safe", "Wallis and Futuna — French Pacific outpost.",                                      "Year-round",               WEU_TIPS, ['Few'], 'Schengen rules via France.'),
    "CK": (8.0, "safe",        "Cook Islands — Polynesian, very welcoming.",                                       "Apr–Nov",                  OCE_TIPS, ['Few'], '31 days visa-free for many passports.'),
    "NU": (8.0, "safe",        "Niue — tiny island state; quiet, very safe.",                                      "May–Oct",                  OCE_TIPS, ['Few'], '30 days visa-free for many passports.'),
    "TK": (7.5, "mostly_safe", "Tokelau — remote NZ-administered atolls.",                                         "May–Oct",                  OCE_TIPS, ['Few'], 'Enter via Samoa with permit.'),
    "AS": (8.0, "safe",        "American Samoa — US territory, Polynesian culture.",                              "May–Oct",                  OCE_TIPS, ['Few'], 'No visa for US; visa-free for many.'),
    "GU": (8.0, "safe",        "Guam — US territory, beach getaway.",                                              "Dec–Jun (drier)",          OCE_TIPS, ['Few'], 'No visa for US; eVisa-free for many.'),
    "MP": (7.5, "mostly_safe", "Northern Mariana Islands — US Commonwealth.",                                      "Dec–Jun",                  OCE_TIPS, ['Few'], 'No visa for US; visa-free for many.'),
    "PN": (8.5, "safe",        "Pitcairn — Bounty descendants, only ~50 people.",                                  "Year-round",               ['Travel via supply ship from NZ — book months ahead'], ['Few'], 'Permit required.'),
    "NF": (8.0, "safe",        "Norfolk Island — Australian external territory.",                                  "Year-round",               OCE_TIPS, ['Few'], 'Enter via Australia.'),
    "CX": (8.0, "safe",        "Christmas Island — Aussie external territory; red crab migration.",               "Year-round (crab Oct–Dec)", OCE_TIPS, ['Few'], 'Enter via Australia.'),
    "CC": (8.0, "safe",        "Cocos (Keeling) Islands — remote Aussie atolls.",                                  "Apr–Oct",                  OCE_TIPS, ['Few'], 'Enter via Australia.'),

    # ===== Antarctica & misc =====
    "AQ": (8.0, "safe",        "Antarctica — only via licensed expedition operators.",                            "Nov–Mar (Austral summer)", ANTARCTIC_TIPS, ANTARCTIC_SCAMS, 'No visa — depends on expedition flag state.'),
    "GS": (8.0, "safe",        "South Georgia & the South Sandwich Islands — Antarctic expedition stop.",         "Nov–Mar",                  ANTARCTIC_TIPS, ANTARCTIC_SCAMS, 'Permit through expedition operator.'),
    "BV": (None, None,         None, None, None, None, None),  # uninhabited
    "TF": (None, None,         None, None, None, None, None),  # mostly uninhabited
    "HM": (None, None,         None, None, None, None, None),  # uninhabited
    "IO": (None, None,         "British Indian Ocean Territory — restricted military zone.",                       None, None, None, 'Restricted access — permit required.'),
    "UM": (None, None,         "U.S. Minor Outlying Islands — uninhabited or US-only.",                            None, None, None, 'Generally restricted access.'),
    "SJ": (8.5, "safe",        "Svalbard / Jan Mayen — Arctic outposts; polar bear country.",                     "Mar–Sep",                  ['Carry rifle and flare gun outside settlements (Svalbard rule)'], ['Few — wildlife is the main hazard'], 'Schengen via Norway / special Svalbard rules.'),
    "GI": (8.5, "safe",        "Gibraltar — UK territory; safe, but tourist-heavy.",                              "Apr–Oct",                  WEU_TIPS, ['Few — apes will steal food, don\'t feed them'], 'UK rules; entry usually via Spain.'),
}

LEAD_HEADER = """-- ===========================================================================
-- ExploreAll — country travel data for every ISO 3166-1 country.
-- Generated by scripts/generate-country-data.py — do not edit by hand.
--
-- Run this once in the Supabase SQL editor.
--
-- Idempotent:
--   * countries:       any code referenced below that's missing from the
--                      countries table is inserted first (handles XK Kosovo
--                      and other user-assigned codes).
--   * safety_ratings:  insert ... on conflict do nothing (won't overwrite
--                      richer rows like JP/IT/TH already in the table).
--   * countries trip-info columns are updated ONLY where currently NULL or
--                      empty. Existing curated entries stay untouched.
-- ===========================================================================
"""

# Countries that may not be in the standard ISO 3166-1 list. Inserted first
# so the safety_ratings FK doesn't fail.
EXTRA_COUNTRIES = [
    # (code, name, capital, continent, flag_emoji)
    ('XK', 'Kosovo', 'Pristina', 'Europe', '🇽🇰'),
]

def sql_str(v):
    if v is None: return 'null'
    return "'" + str(v).replace("'", "''") + "'"

def sql_arr(items):
    if items is None: return 'null'
    if not items: return 'null'
    inside = ', '.join(sql_str(s) for s in items)
    return f"ARRAY[{inside}]::text[]"

def sql_num(v):
    return 'null' if v is None else f"{v:.1f}"


def build_safety_ratings():
    rows = []
    for code, t in DATA.items():
        score, level, summary, *_ = t
        if score is None or level is None: continue
        rows.append(f"  ({sql_str(code)}, {sql_num(score)}, {sql_str(level)}, {sql_str(summary)})")
    return ",\n".join(rows)


def build_country_updates():
    rows = []
    for code, t in DATA.items():
        score, level, summary, best_time, tips, scams, visa = t
        if all(v is None for v in (summary, best_time, tips, scams, visa)):
            continue
        rows.append(f"  ({sql_str(code)}, {sql_str(best_time)}, {sql_str(summary)}, {sql_arr(tips)}, {sql_arr(scams)}, {sql_str(visa)})")
    return ",\n".join(rows)


def main():
    out = []
    out.append(LEAD_HEADER)
    out.append("")
    out.append("-- =====================  EXTRA / NON-ISO COUNTRIES  =====================")
    out.append("-- Inserted first so the safety_ratings FK below doesn't fail.")
    out.append("insert into public.countries (code, name, capital, continent, flag_emoji) values")
    extra_rows = []
    for code, name, capital, continent, flag in EXTRA_COUNTRIES:
        extra_rows.append(f"  ({sql_str(code)}, {sql_str(name)}, {sql_str(capital)}, {sql_str(continent)}, {sql_str(flag)})")
    out.append(",\n".join(extra_rows))
    out.append("on conflict (code) do nothing;")
    out.append("")
    out.append("-- =====================  SAFETY RATINGS  =====================")
    out.append("insert into public.safety_ratings (country_code, score, level, summary) values")
    out.append(build_safety_ratings())
    out.append("on conflict (country_code) do nothing;")
    out.append("")
    out.append("-- =====================  COUNTRY TRIP INFO  =====================")
    out.append("-- Fills in best_time_to_visit / travel_summary / common_tips / common_scams /")
    out.append("-- visa_notes only where they are currently empty. Curated rows stay untouched.")
    out.append("with data(code, best_time, summary, tips, scams, visa) as (")
    out.append("  values")
    out.append(build_country_updates())
    out.append(")")
    out.append("update public.countries c set")
    out.append("  best_time_to_visit = coalesce(nullif(c.best_time_to_visit, ''), data.best_time),")
    out.append("  travel_summary     = coalesce(nullif(c.travel_summary, ''),     data.summary),")
    out.append("  common_tips        = case when coalesce(array_length(c.common_tips, 1), 0) = 0  then data.tips  else c.common_tips  end,")
    out.append("  common_scams       = case when coalesce(array_length(c.common_scams, 1), 0) = 0 then data.scams else c.common_scams end,")
    out.append("  visa_notes         = coalesce(nullif(c.visa_notes, ''),         data.visa)")
    out.append("from data")
    out.append("where c.code = data.code;")
    out.append("")

    output_path = '/Users/dimitarkorshumov/Desktop/forum/supabase/all-country-data.sql'
    with open(output_path, 'w') as f:
        f.write("\n".join(out))
    print(f"Wrote {output_path}")
    print(f"Total countries with data: {sum(1 for v in DATA.values() if v[0] is not None)}")

if __name__ == '__main__':
    main()

// Major airlines that operate flights to / from each country.
// Logos resolved at render time via https://pics.avs.io/<W>/<H>/<IATA>.png
// (free CDN, transparent PNGs, no auth required).
//
// Curated for the most-traveled destinations. Countries not listed here just
// show a small "data coming soon" hint on the page — the rest of the country
// page still renders normally.

export type Airline = {
  name: string;
  iata: string; // 2-letter IATA code, used for logo lookup
  flagCarrier?: boolean;
};

export const AIRLINES_BY_COUNTRY: Record<string, Airline[]> = {
  // EUROPE
  AL: [{ name: "Air Albania", iata: "ZB", flagCarrier: true }, { name: "Wizz Air", iata: "W6" }, { name: "Lufthansa", iata: "LH" }, { name: "Turkish Airlines", iata: "TK" }],
  AT: [{ name: "Austrian Airlines", iata: "OS", flagCarrier: true }, { name: "Lufthansa", iata: "LH" }, { name: "Ryanair", iata: "FR" }, { name: "easyJet", iata: "U2" }, { name: "Wizz Air", iata: "W6" }],
  BE: [{ name: "Brussels Airlines", iata: "SN", flagCarrier: true }, { name: "Ryanair", iata: "FR" }, { name: "TUI fly Belgium", iata: "TB" }, { name: "Lufthansa", iata: "LH" }],
  BG: [{ name: "Bulgaria Air", iata: "FB", flagCarrier: true }, { name: "Wizz Air", iata: "W6" }, { name: "Ryanair", iata: "FR" }, { name: "Lufthansa", iata: "LH" }, { name: "Turkish Airlines", iata: "TK" }],
  BA: [{ name: "FlyBosnia", iata: "FK", flagCarrier: true }, { name: "Lufthansa", iata: "LH" }, { name: "Turkish Airlines", iata: "TK" }, { name: "Wizz Air", iata: "W6" }],
  HR: [{ name: "Croatia Airlines", iata: "OU", flagCarrier: true }, { name: "Ryanair", iata: "FR" }, { name: "Lufthansa", iata: "LH" }, { name: "easyJet", iata: "U2" }],
  CY: [{ name: "Cyprus Airways", iata: "CY", flagCarrier: true }, { name: "Ryanair", iata: "FR" }, { name: "easyJet", iata: "U2" }, { name: "Wizz Air", iata: "W6" }],
  CZ: [{ name: "Czech Airlines", iata: "OK", flagCarrier: true }, { name: "Smartwings", iata: "QS" }, { name: "Ryanair", iata: "FR" }, { name: "Lufthansa", iata: "LH" }],
  DK: [{ name: "Scandinavian Airlines", iata: "SK", flagCarrier: true }, { name: "Norwegian", iata: "DY" }, { name: "Ryanair", iata: "FR" }, { name: "easyJet", iata: "U2" }],
  EE: [{ name: "airBaltic", iata: "BT" }, { name: "Lufthansa", iata: "LH" }, { name: "Ryanair", iata: "FR" }, { name: "Wizz Air", iata: "W6" }],
  FI: [{ name: "Finnair", iata: "AY", flagCarrier: true }, { name: "Norwegian", iata: "DY" }, { name: "Ryanair", iata: "FR" }, { name: "Lufthansa", iata: "LH" }],
  FR: [{ name: "Air France", iata: "AF", flagCarrier: true }, { name: "easyJet", iata: "U2" }, { name: "Transavia", iata: "TO" }, { name: "Ryanair", iata: "FR" }, { name: "Lufthansa", iata: "LH" }, { name: "British Airways", iata: "BA" }],
  DE: [{ name: "Lufthansa", iata: "LH", flagCarrier: true }, { name: "Eurowings", iata: "EW" }, { name: "Condor", iata: "DE" }, { name: "Ryanair", iata: "FR" }, { name: "easyJet", iata: "U2" }, { name: "Air France", iata: "AF" }],
  GR: [{ name: "Aegean Airlines", iata: "A3", flagCarrier: true }, { name: "Olympic Air", iata: "OA" }, { name: "Sky Express", iata: "GQ" }, { name: "Ryanair", iata: "FR" }, { name: "easyJet", iata: "U2" }],
  HU: [{ name: "Wizz Air", iata: "W6", flagCarrier: true }, { name: "Ryanair", iata: "FR" }, { name: "Lufthansa", iata: "LH" }, { name: "Turkish Airlines", iata: "TK" }],
  IS: [{ name: "Icelandair", iata: "FI", flagCarrier: true }, { name: "Play", iata: "OG" }, { name: "easyJet", iata: "U2" }, { name: "British Airways", iata: "BA" }],
  IE: [{ name: "Aer Lingus", iata: "EI", flagCarrier: true }, { name: "Ryanair", iata: "FR" }, { name: "British Airways", iata: "BA" }, { name: "Emirates", iata: "EK" }],
  IT: [{ name: "ITA Airways", iata: "AZ", flagCarrier: true }, { name: "Ryanair", iata: "FR" }, { name: "easyJet", iata: "U2" }, { name: "Wizz Air", iata: "W6" }, { name: "Lufthansa", iata: "LH" }, { name: "Air France", iata: "AF" }],
  LV: [{ name: "airBaltic", iata: "BT", flagCarrier: true }, { name: "Lufthansa", iata: "LH" }, { name: "Ryanair", iata: "FR" }, { name: "Wizz Air", iata: "W6" }],
  LT: [{ name: "airBaltic", iata: "BT" }, { name: "Ryanair", iata: "FR" }, { name: "Wizz Air", iata: "W6" }, { name: "Lufthansa", iata: "LH" }],
  LU: [{ name: "Luxair", iata: "LG", flagCarrier: true }, { name: "Lufthansa", iata: "LH" }, { name: "British Airways", iata: "BA" }, { name: "easyJet", iata: "U2" }],
  MT: [{ name: "Air Malta", iata: "KM", flagCarrier: true }, { name: "Ryanair", iata: "FR" }, { name: "easyJet", iata: "U2" }, { name: "Lufthansa", iata: "LH" }],
  MD: [{ name: "Air Moldova", iata: "9U", flagCarrier: true }, { name: "Wizz Air", iata: "W6" }, { name: "Lufthansa", iata: "LH" }, { name: "Turkish Airlines", iata: "TK" }],
  ME: [{ name: "Air Montenegro", iata: "4O", flagCarrier: true }, { name: "Wizz Air", iata: "W6" }, { name: "Turkish Airlines", iata: "TK" }, { name: "Ryanair", iata: "FR" }],
  NL: [{ name: "KLM", iata: "KL", flagCarrier: true }, { name: "Transavia", iata: "HV" }, { name: "easyJet", iata: "U2" }, { name: "Ryanair", iata: "FR" }, { name: "Air France", iata: "AF" }],
  MK: [{ name: "Wizz Air", iata: "W6" }, { name: "Turkish Airlines", iata: "TK" }, { name: "Lufthansa", iata: "LH" }, { name: "Pegasus Airlines", iata: "PC" }],
  NO: [{ name: "Norwegian", iata: "DY", flagCarrier: true }, { name: "Scandinavian Airlines", iata: "SK" }, { name: "Widerøe", iata: "WF" }, { name: "Ryanair", iata: "FR" }],
  PL: [{ name: "LOT Polish Airlines", iata: "LO", flagCarrier: true }, { name: "Ryanair", iata: "FR" }, { name: "Wizz Air", iata: "W6" }, { name: "Lufthansa", iata: "LH" }],
  PT: [{ name: "TAP Portugal", iata: "TP", flagCarrier: true }, { name: "Ryanair", iata: "FR" }, { name: "easyJet", iata: "U2" }, { name: "Lufthansa", iata: "LH" }],
  RO: [{ name: "TAROM", iata: "RO", flagCarrier: true }, { name: "Wizz Air", iata: "W6" }, { name: "Ryanair", iata: "FR" }, { name: "Lufthansa", iata: "LH" }, { name: "Turkish Airlines", iata: "TK" }],
  RS: [{ name: "Air Serbia", iata: "JU", flagCarrier: true }, { name: "Wizz Air", iata: "W6" }, { name: "Ryanair", iata: "FR" }, { name: "Turkish Airlines", iata: "TK" }, { name: "Lufthansa", iata: "LH" }],
  SK: [{ name: "Ryanair", iata: "FR" }, { name: "Wizz Air", iata: "W6" }, { name: "Smartwings", iata: "QS" }, { name: "Lufthansa", iata: "LH" }],
  SI: [{ name: "Lufthansa", iata: "LH" }, { name: "Air France", iata: "AF" }, { name: "Turkish Airlines", iata: "TK" }, { name: "Wizz Air", iata: "W6" }],
  ES: [{ name: "Iberia", iata: "IB", flagCarrier: true }, { name: "Vueling", iata: "VY" }, { name: "Air Europa", iata: "UX" }, { name: "Ryanair", iata: "FR" }, { name: "easyJet", iata: "U2" }, { name: "Lufthansa", iata: "LH" }],
  SE: [{ name: "Scandinavian Airlines", iata: "SK", flagCarrier: true }, { name: "Norwegian", iata: "DY" }, { name: "Ryanair", iata: "FR" }, { name: "Lufthansa", iata: "LH" }],
  CH: [{ name: "Swiss International Air Lines", iata: "LX", flagCarrier: true }, { name: "Edelweiss Air", iata: "WK" }, { name: "easyJet", iata: "U2" }, { name: "Lufthansa", iata: "LH" }],
  TR: [{ name: "Turkish Airlines", iata: "TK", flagCarrier: true }, { name: "Pegasus Airlines", iata: "PC" }, { name: "SunExpress", iata: "XQ" }, { name: "Lufthansa", iata: "LH" }],
  UA: [{ name: "Ukraine International Airlines", iata: "PS", flagCarrier: true }, { name: "Wizz Air", iata: "W6" }, { name: "Ryanair", iata: "FR" }, { name: "Lufthansa", iata: "LH" }],
  GB: [{ name: "British Airways", iata: "BA", flagCarrier: true }, { name: "Virgin Atlantic", iata: "VS" }, { name: "easyJet", iata: "U2" }, { name: "Ryanair", iata: "FR" }, { name: "Jet2", iata: "LS" }, { name: "TUI Airways", iata: "BY" }],

  // ASIA
  AE: [{ name: "Emirates", iata: "EK", flagCarrier: true }, { name: "Etihad Airways", iata: "EY" }, { name: "flydubai", iata: "FZ" }, { name: "Air Arabia", iata: "G9" }, { name: "Wizz Air", iata: "W6" }],
  CN: [{ name: "Air China", iata: "CA", flagCarrier: true }, { name: "China Southern", iata: "CZ" }, { name: "China Eastern", iata: "MU" }, { name: "Hainan Airlines", iata: "HU" }, { name: "Cathay Pacific", iata: "CX" }],
  HK: [{ name: "Cathay Pacific", iata: "CX", flagCarrier: true }, { name: "HK Express", iata: "UO" }, { name: "Greater Bay Airlines", iata: "HB" }, { name: "Singapore Airlines", iata: "SQ" }],
  IN: [{ name: "Air India", iata: "AI", flagCarrier: true }, { name: "IndiGo", iata: "6E" }, { name: "SpiceJet", iata: "SG" }, { name: "Vistara", iata: "UK" }, { name: "Emirates", iata: "EK" }, { name: "Qatar Airways", iata: "QR" }],
  ID: [{ name: "Garuda Indonesia", iata: "GA", flagCarrier: true }, { name: "Lion Air", iata: "JT" }, { name: "Citilink", iata: "QG" }, { name: "Singapore Airlines", iata: "SQ" }, { name: "AirAsia", iata: "AK" }],
  IL: [{ name: "El Al", iata: "LY", flagCarrier: true }, { name: "Israir", iata: "6H" }, { name: "Arkia", iata: "IZ" }, { name: "Lufthansa", iata: "LH" }, { name: "easyJet", iata: "U2" }],
  JP: [{ name: "Japan Airlines", iata: "JL", flagCarrier: true }, { name: "ANA", iata: "NH" }, { name: "Peach Aviation", iata: "MM" }, { name: "Jetstar Japan", iata: "GK" }, { name: "Singapore Airlines", iata: "SQ" }, { name: "United Airlines", iata: "UA" }],
  JO: [{ name: "Royal Jordanian", iata: "RJ", flagCarrier: true }, { name: "Jazeera Airways", iata: "J9" }, { name: "Turkish Airlines", iata: "TK" }, { name: "Emirates", iata: "EK" }],
  KZ: [{ name: "Air Astana", iata: "KC", flagCarrier: true }, { name: "SCAT Airlines", iata: "DV" }, { name: "Lufthansa", iata: "LH" }, { name: "Turkish Airlines", iata: "TK" }],
  KH: [{ name: "Cambodia Airways", iata: "KR" }, { name: "Vietnam Airlines", iata: "VN" }, { name: "AirAsia", iata: "AK" }, { name: "Singapore Airlines", iata: "SQ" }],
  KR: [{ name: "Korean Air", iata: "KE", flagCarrier: true }, { name: "Asiana Airlines", iata: "OZ" }, { name: "Jeju Air", iata: "7C" }, { name: "T'way Air", iata: "TW" }, { name: "Singapore Airlines", iata: "SQ" }],
  KW: [{ name: "Kuwait Airways", iata: "KU", flagCarrier: true }, { name: "Jazeera Airways", iata: "J9" }, { name: "Emirates", iata: "EK" }, { name: "Turkish Airlines", iata: "TK" }],
  LB: [{ name: "Middle East Airlines", iata: "ME", flagCarrier: true }, { name: "Turkish Airlines", iata: "TK" }, { name: "Emirates", iata: "EK" }, { name: "Lufthansa", iata: "LH" }],
  MY: [{ name: "Malaysia Airlines", iata: "MH", flagCarrier: true }, { name: "AirAsia", iata: "AK" }, { name: "Batik Air Malaysia", iata: "OD" }, { name: "Singapore Airlines", iata: "SQ" }],
  MV: [{ name: "Maldivian", iata: "Q2", flagCarrier: true }, { name: "Emirates", iata: "EK" }, { name: "Qatar Airways", iata: "QR" }, { name: "Singapore Airlines", iata: "SQ" }],
  NP: [{ name: "Nepal Airlines", iata: "RA", flagCarrier: true }, { name: "Buddha Air", iata: "U4" }, { name: "Yeti Airlines", iata: "YT" }, { name: "Qatar Airways", iata: "QR" }],
  OM: [{ name: "Oman Air", iata: "WY", flagCarrier: true }, { name: "SalamAir", iata: "OV" }, { name: "Emirates", iata: "EK" }, { name: "Qatar Airways", iata: "QR" }],
  PK: [{ name: "Pakistan International Airlines", iata: "PK", flagCarrier: true }, { name: "AirBlue", iata: "PA" }, { name: "Emirates", iata: "EK" }, { name: "Qatar Airways", iata: "QR" }],
  PH: [{ name: "Philippine Airlines", iata: "PR", flagCarrier: true }, { name: "Cebu Pacific", iata: "5J" }, { name: "AirAsia Philippines", iata: "Z2" }, { name: "Singapore Airlines", iata: "SQ" }],
  QA: [{ name: "Qatar Airways", iata: "QR", flagCarrier: true }, { name: "Emirates", iata: "EK" }, { name: "Etihad Airways", iata: "EY" }, { name: "British Airways", iata: "BA" }],
  SA: [{ name: "Saudia", iata: "SV", flagCarrier: true }, { name: "flynas", iata: "XY" }, { name: "flyadeal", iata: "F3" }, { name: "Emirates", iata: "EK" }],
  SG: [{ name: "Singapore Airlines", iata: "SQ", flagCarrier: true }, { name: "Scoot", iata: "TR" }, { name: "Jetstar Asia", iata: "3K" }, { name: "Cathay Pacific", iata: "CX" }],
  LK: [{ name: "SriLankan Airlines", iata: "UL", flagCarrier: true }, { name: "Emirates", iata: "EK" }, { name: "Qatar Airways", iata: "QR" }, { name: "Singapore Airlines", iata: "SQ" }],
  TW: [{ name: "China Airlines", iata: "CI", flagCarrier: true }, { name: "EVA Air", iata: "BR" }, { name: "Starlux", iata: "JX" }, { name: "Cathay Pacific", iata: "CX" }],
  TH: [{ name: "Thai Airways", iata: "TG", flagCarrier: true }, { name: "Bangkok Airways", iata: "PG" }, { name: "Thai AirAsia", iata: "FD" }, { name: "Thai Vietjet", iata: "VZ" }, { name: "Singapore Airlines", iata: "SQ" }],
  VN: [{ name: "Vietnam Airlines", iata: "VN", flagCarrier: true }, { name: "VietJet Air", iata: "VJ" }, { name: "Bamboo Airways", iata: "QH" }, { name: "Singapore Airlines", iata: "SQ" }],

  // AMERICAS
  AR: [{ name: "Aerolíneas Argentinas", iata: "AR", flagCarrier: true }, { name: "FlyBondi", iata: "FO" }, { name: "JetSmart", iata: "WJ" }, { name: "LATAM", iata: "LA" }],
  BR: [{ name: "LATAM Brasil", iata: "LA", flagCarrier: true }, { name: "GOL", iata: "G3" }, { name: "Azul", iata: "AD" }, { name: "American Airlines", iata: "AA" }, { name: "Air France", iata: "AF" }],
  CA: [{ name: "Air Canada", iata: "AC", flagCarrier: true }, { name: "WestJet", iata: "WS" }, { name: "Porter Airlines", iata: "PD" }, { name: "Flair Airlines", iata: "F8" }, { name: "American Airlines", iata: "AA" }],
  CL: [{ name: "LATAM", iata: "LA", flagCarrier: true }, { name: "Sky Airline", iata: "H2" }, { name: "JetSmart", iata: "JA" }, { name: "American Airlines", iata: "AA" }],
  CO: [{ name: "Avianca", iata: "AV", flagCarrier: true }, { name: "LATAM Colombia", iata: "LA" }, { name: "Wingo", iata: "P5" }, { name: "American Airlines", iata: "AA" }],
  CR: [{ name: "Avianca Costa Rica", iata: "LR" }, { name: "Sansa", iata: "RZ" }, { name: "American Airlines", iata: "AA" }, { name: "Delta", iata: "DL" }],
  CU: [{ name: "Cubana de Aviación", iata: "CU", flagCarrier: true }, { name: "Aeroméxico", iata: "AM" }, { name: "Air France", iata: "AF" }, { name: "Iberia", iata: "IB" }],
  DO: [{ name: "Arajet", iata: "DM" }, { name: "Sky Cana", iata: "8I" }, { name: "American Airlines", iata: "AA" }, { name: "JetBlue", iata: "B6" }],
  EC: [{ name: "Avianca Ecuador", iata: "AV" }, { name: "Aeroregional", iata: "RW" }, { name: "LATAM", iata: "LA" }, { name: "American Airlines", iata: "AA" }],
  MX: [{ name: "Aeroméxico", iata: "AM", flagCarrier: true }, { name: "Volaris", iata: "Y4" }, { name: "VivaAerobus", iata: "VB" }, { name: "American Airlines", iata: "AA" }, { name: "Delta", iata: "DL" }],
  PA: [{ name: "Copa Airlines", iata: "CM", flagCarrier: true }, { name: "Wingo", iata: "P5" }, { name: "American Airlines", iata: "AA" }, { name: "Iberia", iata: "IB" }],
  PE: [{ name: "LATAM Peru", iata: "LA" }, { name: "Sky Airline", iata: "H2" }, { name: "JetSmart", iata: "JA" }, { name: "American Airlines", iata: "AA" }],
  US: [{ name: "American Airlines", iata: "AA", flagCarrier: true }, { name: "Delta Air Lines", iata: "DL" }, { name: "United Airlines", iata: "UA" }, { name: "Southwest Airlines", iata: "WN" }, { name: "JetBlue", iata: "B6" }, { name: "Alaska Airlines", iata: "AS" }],
  UY: [{ name: "Sky Airline", iata: "H2" }, { name: "JetSmart", iata: "JA" }, { name: "LATAM", iata: "LA" }, { name: "Iberia", iata: "IB" }],
  VE: [{ name: "Conviasa", iata: "V0", flagCarrier: true }, { name: "Avior Airlines", iata: "9V" }, { name: "Iberia", iata: "IB" }, { name: "Air Europa", iata: "UX" }],

  // OCEANIA
  AU: [{ name: "Qantas", iata: "QF", flagCarrier: true }, { name: "Virgin Australia", iata: "VA" }, { name: "Jetstar", iata: "JQ" }, { name: "Singapore Airlines", iata: "SQ" }, { name: "Emirates", iata: "EK" }],
  FJ: [{ name: "Fiji Airways", iata: "FJ", flagCarrier: true }, { name: "Qantas", iata: "QF" }, { name: "Virgin Australia", iata: "VA" }, { name: "Air New Zealand", iata: "NZ" }],
  NZ: [{ name: "Air New Zealand", iata: "NZ", flagCarrier: true }, { name: "Jetstar", iata: "JQ" }, { name: "Qantas", iata: "QF" }, { name: "Singapore Airlines", iata: "SQ" }],

  // AFRICA
  DZ: [{ name: "Air Algérie", iata: "AH", flagCarrier: true }, { name: "Tassili Airlines", iata: "SF" }, { name: "Air France", iata: "AF" }, { name: "Turkish Airlines", iata: "TK" }],
  EG: [{ name: "EgyptAir", iata: "MS", flagCarrier: true }, { name: "Nile Air", iata: "NP" }, { name: "Air Cairo", iata: "SM" }, { name: "Turkish Airlines", iata: "TK" }, { name: "Emirates", iata: "EK" }],
  ET: [{ name: "Ethiopian Airlines", iata: "ET", flagCarrier: true }, { name: "Emirates", iata: "EK" }, { name: "Turkish Airlines", iata: "TK" }, { name: "Lufthansa", iata: "LH" }],
  GH: [{ name: "Africa World Airlines", iata: "AW" }, { name: "Passion Air", iata: "OP" }, { name: "Emirates", iata: "EK" }, { name: "Ethiopian Airlines", iata: "ET" }],
  KE: [{ name: "Kenya Airways", iata: "KQ", flagCarrier: true }, { name: "Jambojet", iata: "JM" }, { name: "Ethiopian Airlines", iata: "ET" }, { name: "Emirates", iata: "EK" }],
  MA: [{ name: "Royal Air Maroc", iata: "AT", flagCarrier: true }, { name: "Air Arabia Maroc", iata: "3O" }, { name: "Ryanair", iata: "FR" }, { name: "easyJet", iata: "U2" }],
  MU: [{ name: "Air Mauritius", iata: "MK", flagCarrier: true }, { name: "Emirates", iata: "EK" }, { name: "Air France", iata: "AF" }, { name: "British Airways", iata: "BA" }],
  NG: [{ name: "Air Peace", iata: "P4" }, { name: "Arik Air", iata: "W3" }, { name: "Dana Air", iata: "9J" }, { name: "Emirates", iata: "EK" }, { name: "British Airways", iata: "BA" }],
  RW: [{ name: "RwandAir", iata: "WB", flagCarrier: true }, { name: "Kenya Airways", iata: "KQ" }, { name: "Ethiopian Airlines", iata: "ET" }, { name: "Qatar Airways", iata: "QR" }],
  SN: [{ name: "Air Senegal", iata: "HC", flagCarrier: true }, { name: "Royal Air Maroc", iata: "AT" }, { name: "Air France", iata: "AF" }, { name: "Iberia", iata: "IB" }],
  ZA: [{ name: "South African Airways", iata: "SA", flagCarrier: true }, { name: "FlySafair", iata: "FA" }, { name: "Lift", iata: "GE" }, { name: "Emirates", iata: "EK" }, { name: "Qatar Airways", iata: "QR" }],
  TZ: [{ name: "Air Tanzania", iata: "TC", flagCarrier: true }, { name: "Precision Air", iata: "PW" }, { name: "Kenya Airways", iata: "KQ" }, { name: "KLM", iata: "KL" }],
  TN: [{ name: "Tunisair", iata: "TU", flagCarrier: true }, { name: "Nouvelair", iata: "BJ" }, { name: "Air France", iata: "AF" }, { name: "Lufthansa", iata: "LH" }],
  UG: [{ name: "Uganda Airlines", iata: "UR", flagCarrier: true }, { name: "Kenya Airways", iata: "KQ" }, { name: "Ethiopian Airlines", iata: "ET" }, { name: "Emirates", iata: "EK" }],
};

export function airlineLogoUrl(iata: string, w = 200, h = 80) {
  return `https://pics.avs.io/${w}/${h}/${iata.toUpperCase()}.png`;
}

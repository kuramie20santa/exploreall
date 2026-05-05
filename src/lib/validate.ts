// Anti-bot / anti-spam validation helpers.
// Used by the signup form. Server-side enforcement also happens via Supabase
// email confirmation + the email_verified RLS policies in supabase/harden.sql.

// A reasonably strict email regex — rejects obvious junk.
// Not RFC-perfect (nothing is) but blocks 99% of fake patterns.
const EMAIL_RE =
  /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

// A growing list of disposable / temp / "10-minute mail" providers.
// Source: curated from popular open lists. Keep this fresh by editing the file.
const DISPOSABLE_DOMAINS = new Set<string>([
  "10minutemail.com", "10minutemail.net", "20minutemail.com", "30minutemail.com",
  "anonbox.net", "anonymbox.com", "boun.cr", "bouncr.com",
  "deadaddress.com", "discard.email", "discardmail.com", "discardmail.de",
  "dispostable.com", "dropmail.me", "drdrb.com", "drdrb.net",
  "easytrashmail.com", "emailondeck.com", "emailtemporanea.net", "emailtemporanea.com",
  "emltmp.com", "fakeinbox.com", "fakemail.fr", "fakemailgenerator.com",
  "fakemymail.com", "fastmazda.com", "filzmail.com", "fleckens.hu",
  "gerda.lt", "getairmail.com", "getmail.cn", "getnada.com",
  "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrillamail.info",
  "guerrillamailblock.com", "harakirimail.com", "hidemail.de", "incognitomail.com",
  "incognitomail.net", "incognitomail.org", "inboxalias.com", "inboxbear.com",
  "jetable.org", "kasmail.com", "kaspop.com", "klzlk.com",
  "kurzepost.de", "letthemeatspam.com", "lookugly.com", "lroid.com",
  "mail-temp.com", "mail-temporaire.fr", "mail-temporaire.com", "mail.btb.tw",
  "mail.tmail.io", "mailcatch.com", "maildrop.cc", "mailedge.com",
  "maileimer.de", "mailexpire.com", "mailforspam.com", "mailfreeonline.com",
  "mailguard.me", "mailimate.com", "mailin8r.com", "mailinator.com",
  "mailinator.net", "mailinator2.com", "mailmoat.com", "mailnator.com",
  "mailnesia.com", "mailnull.com", "mailshell.com", "mailsiphon.com",
  "mailtemp.info", "mailtemporaire.com", "mailtothis.com", "mailzilla.com",
  "mintemail.com", "moburl.com", "moncourrier.fr.nf", "monemail.fr.nf",
  "mt2009.com", "mt2014.com", "mt2015.com", "mvrht.com",
  "mytrashmail.com", "neomailbox.com", "nepwk.com", "nervmich.net",
  "no-spam.ws", "noclickemail.com", "nomail.xl.cx", "nospam.ze.tc",
  "objectmail.com", "obobbo.com", "oneoffemail.com", "online.ms",
  "owlpic.com", "pjjkp.com", "plexolan.de", "poofy.org",
  "pookmail.com", "privacy.net", "privatdemail.net", "proxymail.eu",
  "punkass.com", "putthisinyourspamdatabase.com", "quickinbox.com", "rcpt.at",
  "recode.me", "regbypass.com", "rmqkr.net", "rppkn.com",
  "s0ny.net", "safe-mail.net", "selfdestructingmail.com", "sharklasers.com",
  "shieldedmail.com", "shitmail.me", "shortmail.net", "skim.com",
  "slopsbox.com", "smashmail.de", "smellfear.com", "snakemail.com",
  "sneakemail.com", "sofort-mail.de", "spam.la", "spam4.me",
  "spamavert.com", "spambog.com", "spambog.de", "spambog.ru",
  "spambox.us", "spamcero.com", "spamday.com", "spamex.com",
  "spamfree24.com", "spamfree24.de", "spamfree24.eu", "spamfree24.info",
  "spamfree24.net", "spamfree24.org", "spamgoes.in", "spamgourmet.com",
  "spamgourmet.net", "spamgourmet.org", "spamherelots.com", "spamhereplease.com",
  "spamhole.com", "spamify.com", "spaml.com", "spammotel.com",
  "spamoff.de", "spamslicer.com", "spamspot.com", "spamthis.co.uk",
  "spamtroll.net", "speed.1s.fr", "supergreatmail.com", "supermailer.jp",
  "superrito.com", "suremail.info", "talkinator.com", "tempail.com",
  "tempalias.com", "tempe-mail.com", "tempemail.biz", "tempemail.com",
  "tempemail.net", "tempemail.org", "tempemailaddress.com", "tempinbox.co.uk",
  "tempinbox.com", "tempmail.de", "tempmail.eu", "tempmail.it",
  "tempmail.us", "tempmail2.com", "tempmaildemand.com", "tempmailer.com",
  "tempmailer.de", "tempomail.fr", "temporarily.de", "temporarioemail.com.br",
  "temporaryemail.net", "temporaryemail.us", "temporaryforwarding.com", "temporaryinbox.com",
  "temporarymailaddress.com", "tempsky.com", "tempymail.com", "thanksnospam.info",
  "thankyou2010.com", "thecloudindex.com", "thisisnotmyrealemail.com", "throwaway.email",
  "throwawaymail.com", "tilien.com", "tmail.ws", "tmpeml.info",
  "trash-amil.com", "trash-mail.at", "trash-mail.com", "trash-mail.de",
  "trash2009.com", "trashdevil.com", "trashemail.de", "trashinbox.com",
  "trashmail.at", "trashmail.com", "trashmail.de", "trashmail.me",
  "trashmail.net", "trashmail.org", "trashymail.com", "trbvm.com",
  "tyldd.com", "uggsrock.com", "upliftnow.com", "veryrealemail.com",
  "wegwerfemail.de", "wegwerfemail.net", "wegwerfemailadresse.com", "wegwerfmail.de",
  "wegwerfmail.info", "wegwerfmail.net", "wegwerfmail.org", "wh4f.org",
  "whyspam.me", "wilemail.com", "willhackforfood.biz", "willselfdestruct.com",
  "wuzup.net", "wuzupmail.net", "yopmail.com", "yopmail.fr",
  "yopmail.net", "you-spam.com", "yuurok.com", "zehnminutenmail.de",
  "zoemail.net", "tmail.io", "minutemail.com", "moakt.com",
  "mfsa.ru", "anonmail.io", "tempinbox.xyz", "1secmail.com",
]);

// Reserved usernames (route names, fake authority, profanity-light).
const RESERVED_USERNAMES = new Set<string>([
  "admin", "administrator", "mod", "moderator", "support", "help", "team",
  "official", "staff", "owner", "root", "system", "wander", "exploreall",
  "settings", "login", "signup", "auth", "create", "explore", "forum",
  "country", "profile", "saved", "api", "null", "undefined", "anonymous",
  "guest", "user", "users", "me", "self", "test", "example",
]);

export type ValidationError = string;

export function validateEmail(raw: string): ValidationError | null {
  const email = raw.trim().toLowerCase();
  if (!email) return "Email is required.";
  if (email.length > 254) return "Email is too long.";
  if (!EMAIL_RE.test(email)) return "That email address doesn't look right.";
  const domain = email.split("@")[1];
  if (!domain) return "That email address doesn't look right.";
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return "Disposable email providers aren't allowed. Please use a real address.";
  }
  // Block "+tag" patterns that are commonly abused for sock-puppets on free
  // providers (gmail, outlook). Real users almost never use them at signup.
  const local = email.split("@")[0];
  if (local.includes("+") && (domain === "gmail.com" || domain === "googlemail.com")) {
    return "Please sign up with your primary email — no “+tag” aliases.";
  }
  return null;
}

export function validateUsername(raw: string): ValidationError | null {
  const u = raw.trim().toLowerCase();
  if (!u) return "Username is required.";
  if (u.length < 3) return "Username must be at least 3 characters.";
  if (u.length > 20) return "Username must be 20 characters or fewer.";
  if (!/^[a-z0-9_]+$/.test(u)) return "Use only lowercase letters, numbers, and underscores.";
  if (/^[0-9_]/.test(u)) return "Username must start with a letter.";
  if (RESERVED_USERNAMES.has(u)) return "That username is reserved.";
  return null;
}

export function validatePassword(raw: string): ValidationError | null {
  if (!raw) return "Password is required.";
  if (raw.length < 8) return "Password must be at least 8 characters.";
  if (raw.length > 128) return "Password is too long.";
  // Block the obvious common ones — protection that doesn't cost UX.
  const COMMON = new Set([
    "password", "password1", "password123", "qwerty", "qwerty123",
    "11111111", "12345678", "123456789", "1234567890", "abc123456",
    "letmein", "welcome", "iloveyou", "admin1234", "password!",
  ]);
  if (COMMON.has(raw.toLowerCase())) return "That password is too common.";
  return null;
}

export function validateFullName(raw: string): ValidationError | null {
  const v = raw.trim();
  if (!v) return "Name is required.";
  if (v.length < 2) return "Name is too short.";
  if (v.length > 60) return "Name is too long.";
  // Block names that look like emails / urls / pure numbers (bot patterns)
  if (/[<>@/\\]/.test(v)) return "That name looks invalid.";
  if (/^https?:/i.test(v)) return "That name looks invalid.";
  if (/^\d+$/.test(v)) return "Please enter a real name.";
  return null;
}

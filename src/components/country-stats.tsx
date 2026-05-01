import { Globe, Languages, Phone, Clock, Car, Users, Map, Plug } from "lucide-react";
import type { CountryExtras } from "@/lib/country-data";
import { formatNumber } from "@/lib/country-data";

export function CountryStats({ extras }: { extras: CountryExtras }) {
  const items: { icon: React.ReactNode; label: string; value: string }[] = [];

  if (extras.population != null) {
    items.push({
      icon: <Users className="h-4 w-4" />,
      label: "Population",
      value: formatNumber(extras.population),
    });
  }
  if (extras.area_km2 != null) {
    items.push({
      icon: <Map className="h-4 w-4" />,
      label: "Area",
      value: `${formatNumber(Math.round(extras.area_km2))} km²`,
    });
  }
  if (extras.languages.length) {
    items.push({
      icon: <Languages className="h-4 w-4" />,
      label: extras.languages.length === 1 ? "Language" : "Languages",
      value: extras.languages.slice(0, 4).join(", "),
    });
  }
  if (extras.timezones.length) {
    items.push({
      icon: <Clock className="h-4 w-4" />,
      label: extras.timezones.length === 1 ? "Timezone" : "Timezones",
      value:
        extras.timezones.length > 2
          ? `${extras.timezones[0]} +${extras.timezones.length - 1} more`
          : extras.timezones.join(", "),
    });
  }
  if (extras.calling_code) {
    items.push({
      icon: <Phone className="h-4 w-4" />,
      label: "Calling code",
      value: extras.calling_code,
    });
  }
  if (extras.drives_on) {
    items.push({
      icon: <Car className="h-4 w-4" />,
      label: "Drives on",
      value: extras.drives_on === "left" ? "Left" : "Right",
    });
  }
  if (extras.region) {
    items.push({
      icon: <Globe className="h-4 w-4" />,
      label: "Region",
      value: extras.subregion ? `${extras.subregion}, ${extras.region}` : extras.region,
    });
  }
  if (extras.currency_code) {
    items.push({
      icon: <Plug className="h-4 w-4" />,
      label: "Currency",
      value: `${extras.currency_name ?? extras.currency_code} (${extras.currency_symbol ?? extras.currency_code})`,
    });
  }

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-2xl font-semibold tracking-tight mb-4">At a glance</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger">
        {items.map((it) => (
          <div
            key={it.label}
            className="rounded-2xl bg-card hairline p-4 lift transition"
          >
            <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wide">
              {it.icon}
              {it.label}
            </div>
            <p className="mt-2 text-[15px] font-medium leading-snug">{it.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

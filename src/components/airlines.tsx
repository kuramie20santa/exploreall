"use client";

import * as React from "react";
import { Plane } from "lucide-react";
import type { Airline } from "@/data/airlines";
import { airlineLogoUrl } from "@/data/airlines";

export function AirlinesSection({ airlines, countryName }: { airlines: Airline[]; countryName: string }) {
  if (!airlines || airlines.length === 0) {
    return (
      <section>
        <h2 className="font-display text-2xl font-semibold tracking-tight mb-4 flex items-center gap-2">
          <Plane className="h-5 w-5" /> Airlines
        </h2>
        <div className="rounded-3xl hairline bg-card p-6 text-sm text-muted-foreground animate-fadeIn">
          Airline data for {countryName} is coming soon.
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-display text-2xl font-semibold tracking-tight mb-4 flex items-center gap-2">
        <Plane className="h-5 w-5" /> Airlines
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Major carriers operating to and from {countryName}.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger">
        {airlines.map((a) => (
          <AirlineCard key={a.iata} airline={a} />
        ))}
      </div>
    </section>
  );
}

function AirlineCard({ airline }: { airline: Airline }) {
  const [failed, setFailed] = React.useState(false);
  return (
    <div className="rounded-2xl bg-card hairline p-4 lift transition flex items-center gap-3 min-h-[76px]">
      <div className="h-12 w-12 shrink-0 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
        {failed ? (
          <span className="text-xs font-bold text-muted-foreground">{airline.iata}</span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={airlineLogoUrl(airline.iata, 96, 96)}
            alt=""
            width={48}
            height={48}
            className="object-contain h-10 w-10"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[14px] truncate">{airline.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {airline.iata}
          {airline.flagCarrier ? <span className="ml-1.5">· Flag carrier</span> : null}
        </p>
      </div>
    </div>
  );
}

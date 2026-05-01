"use client";

import * as React from "react";
import { ArrowLeftRight, RefreshCw } from "lucide-react";
import { convertCurrency, formatMoney } from "@/lib/country-data";

type Props = {
  localCurrency: string; // e.g. "BGN"
  localName?: string | null;
  rates: Record<string, number>;
  updatedAt?: string;
};

const QUICK_AMOUNTS = [1, 5, 10, 50, 100];
const POPULAR_TARGETS = ["USD", "EUR", "GBP", "JPY"];

export function CurrencyWidget({ localCurrency, localName, rates, updatedAt }: Props) {
  const [amount, setAmount] = React.useState<number>(1);
  const [target, setTarget] = React.useState<string>(
    localCurrency === "USD" ? "EUR" : "USD"
  );
  const [reversed, setReversed] = React.useState(false);

  const from = reversed ? target : localCurrency;
  const to = reversed ? localCurrency : target;
  const result = convertCurrency(amount, from, to, rates);

  const tableRows = QUICK_AMOUNTS.map((a) => ({
    amount: a,
    converted: convertCurrency(a, localCurrency, target, rates),
  }));

  return (
    <section>
      <h2 className="font-display text-2xl font-semibold tracking-tight mb-4">Currency</h2>

      <div className="rounded-3xl bg-card hairline shadow-soft p-5 sm:p-6 animate-fadeIn">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Local currency</p>
            <p className="font-display text-xl font-semibold tracking-tight mt-0.5">
              {localName ?? localCurrency} <span className="text-muted-foreground text-base">· {localCurrency}</span>
            </p>
          </div>
          {updatedAt ? (
            <span className="text-[11px] text-muted-foreground">
              Rates updated {new Date(updatedAt).toLocaleDateString()}
            </span>
          ) : null}
        </div>

        {/* Converter */}
        <div className="mt-5 grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div>
            <label className="text-[11px] uppercase tracking-wide text-muted-foreground">From {from}</label>
            <input
              type="number"
              min={0}
              step="any"
              value={Number.isFinite(amount) ? amount : ""}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="mt-1.5 h-12 w-full rounded-2xl bg-muted px-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>

          <button
            type="button"
            onClick={() => setReversed((r) => !r)}
            className="h-12 w-12 mb-0 sm:mb-0 rounded-full bg-muted hover:bg-muted/70 inline-flex items-center justify-center press transition"
            aria-label="Swap direction"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground">To {to}</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="h-7 rounded-full bg-muted px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {POPULAR_TARGETS.filter((c) => c !== localCurrency).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                {!POPULAR_TARGETS.includes(target) && target !== localCurrency ? (
                  <option value={target}>{target}</option>
                ) : null}
              </select>
            </div>
            <div className="mt-1.5 h-12 w-full rounded-2xl bg-muted/60 px-4 text-lg font-semibold flex items-center">
              {result == null ? "—" : formatMoney(result, to)}
            </div>
          </div>
        </div>

        {/* Quick conversions */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2 stagger">
          {tableRows.map((r) => (
            <div
              key={r.amount}
              className="rounded-2xl bg-muted/40 hairline px-3 py-2.5 text-center"
            >
              <p className="text-xs text-muted-foreground">{formatMoney(r.amount, localCurrency)}</p>
              <p className="text-sm font-semibold mt-0.5">
                {r.converted == null ? "—" : formatMoney(r.converted, target)}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
          <RefreshCw className="h-3 w-3" />
          Rates from open.er-api.com — refreshed hourly
        </p>
      </div>
    </section>
  );
}

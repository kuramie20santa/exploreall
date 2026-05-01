"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ImagePlus, Plus, X } from "lucide-react";

type Country = { code: string; name: string; flag_emoji: string | null };
type Tag = { slug: string; label: string };

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 32);
}

export function CreatePostForm({
  countries,
  tags,
  userId,
}: {
  countries: Country[];
  tags: Tag[];
  userId: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [countryQuery, setCountryQuery] = React.useState("");
  const [city, setCity] = React.useState("");
  const [tripStart, setTripStart] = React.useState("");
  const [tripEnd, setTripEnd] = React.useState("");

  const [picked, setPicked] = React.useState<string[]>([]);
  const [customTag, setCustomTag] = React.useState("");
  const [customLabels, setCustomLabels] = React.useState<Record<string, string>>({});

  const [files, setFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const filteredCountries = React.useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q);
  }, [countries, countryQuery]);

  const knownTagSlugs = React.useMemo(() => new Set(tags.map((t) => t.slug)), [tags]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list).slice(0, 8 - files.length);
    setFiles((f) => [...f, ...arr]);
    setPreviews((p) => [...p, ...arr.map((f) => URL.createObjectURL(f))]);
  }

  function removeFile(i: number) {
    setFiles((f) => f.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  }

  function toggleTag(slug: string) {
    setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : [...p, slug].slice(0, 12)));
  }

  function addCustomTag() {
    const raw = customTag.trim();
    if (!raw) return;
    const slug = slugify(raw);
    if (!slug) return;
    setCustomLabels((m) => ({ ...m, [slug]: raw }));
    setPicked((p) => (p.includes(slug) ? p : [...p, slug].slice(0, 12)));
    setCustomTag("");
  }

  function onTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCustomTag();
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (title.trim().length < 3) { setErr("Title must be at least 3 characters."); return; }
    if (content.trim().length < 1) { setErr("Story can't be empty."); return; }
    setBusy(true);

    // Upsert any new tags so they show up in the curated sidebar later
    const newOnes = picked.filter((s) => !knownTagSlugs.has(s));
    if (newOnes.length > 0) {
      await supabase.from("tags").upsert(
        newOnes.map((s) => ({
          slug: s,
          label: customLabels[s] || s.replace(/-/g, " "),
        })),
        { onConflict: "slug", ignoreDuplicates: true }
      );
    }

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        author_id: userId,
        title: title.trim(),
        content: content.trim(),
        country_code: country || null,
        city: city.trim() || null,
        trip_start: tripStart || null,
        trip_end: tripEnd || null,
        tags: picked,
      })
      .select("id")
      .single();

    if (error || !post) {
      setBusy(false);
      setErr(error?.message ?? "Failed to create post.");
      return;
    }

    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/${post.id}/${i}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("post-images").upload(path, file, { upsert: false });
        if (upErr) continue;
        const { data: pub } = supabase.storage.from("post-images").getPublicUrl(path);
        await supabase.from("post_images").insert({
          post_id: post.id,
          storage_path: path,
          url: pub.publicUrl,
          position: i,
        });
      }
    }

    router.push(`/forum/${post.id}`);
    router.refresh();
  }

  const allTagOptions: Tag[] = React.useMemo(() => {
    const fromCustom = Object.entries(customLabels).map(([slug, label]) => ({ slug, label }));
    const known = new Set(tags.map((t) => t.slug));
    const merged = [...tags];
    for (const t of fromCustom) if (!known.has(t.slug)) merged.push(t);
    return merged;
  }, [tags, customLabels]);

  return (
    <form onSubmit={submit} className="space-y-6 animate-slideUp">
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A weekend in Lisbon" maxLength={160} />
      </div>

      <div>
        <Label>Your story</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What did you do, see, eat? Anything to warn or recommend?" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Country</Label>
          <Input
            placeholder="Search by name or code…"
            value={countryQuery}
            onChange={(e) => setCountryQuery(e.target.value)}
          />
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            size={6}
            className="mt-2 w-full rounded-2xl bg-muted px-2 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— None —</option>
            {filteredCountries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag_emoji} {c.name} ({c.code})
              </option>
            ))}
          </select>
          {country ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Selected: {countries.find((c) => c.code === country)?.flag_emoji} {countries.find((c) => c.code === country)?.name}
            </p>
          ) : null}
        </div>
        <div className="space-y-4">
          <div>
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lisbon" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Trip start</Label>
              <Input type="date" value={tripStart} onChange={(e) => setTripStart(e.target.value)} />
            </div>
            <div>
              <Label>Trip end</Label>
              <Input type="date" value={tripEnd} onChange={(e) => setTripEnd(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {allTagOptions.map((t) => {
            const on = picked.includes(t.slug);
            return (
              <button
                type="button"
                key={t.slug}
                onClick={() => toggleTag(t.slug)}
                className={`inline-flex h-8 items-center justify-center px-3 rounded-full text-xs font-medium leading-none press transition ${
                  on
                    ? "bg-foreground text-background animate-pop"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70"
                }`}
              >
                #{t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={onTagKeyDown}
              placeholder="Add your own tag (Enter to add)"
              maxLength={32}
            />
          </div>
          <Button type="button" variant="outline" onClick={addCustomTag} disabled={!customTag.trim()}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        {picked.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {picked.map((slug) => {
              const label = allTagOptions.find((t) => t.slug === slug)?.label ?? slug;
              return (
                <span
                  key={slug}
                  className="inline-flex h-7 items-center gap-1.5 px-2.5 rounded-full bg-foreground text-background text-xs animate-fadeIn"
                >
                  #{label}
                  <button type="button" onClick={() => toggleTag(slug)} className="opacity-70 hover:opacity-100" aria-label="Remove tag">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      <div>
        <Label>Photos <span className="text-muted-foreground font-normal">(up to 8)</span></Label>
        <label className="flex items-center justify-center gap-2 h-28 rounded-2xl bg-muted hairline cursor-pointer hover:bg-muted/80 transition text-sm text-muted-foreground press">
          <ImagePlus className="h-5 w-5" />
          Click to upload
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>
        {previews.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3 stagger">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-muted hairline">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-background/90 hairline flex items-center justify-center press"
                  aria-label="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {err ? <p className="text-sm text-red-500 animate-fadeIn">{err}</p> : null}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button>
        <Button type="submit" disabled={busy}>{busy ? "Publishing…" : "Publish"}</Button>
      </div>
    </form>
  );
}

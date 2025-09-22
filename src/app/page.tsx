"use client";

import { useEffect, useMemo, useState } from "react";
import type { Place } from "@/types/place";
import { hydratePlaces } from "@/lib/importPlaces";
import Map from "@/components/Map";

const ALL_CATEGORIES = ["sights", "restaurants", "drinks", "street"] as const;
type UiCategory = (typeof ALL_CATEGORIES)[number];

function deriveCategoryFromTags(tags?: string[]): UiCategory {
  if (tags?.includes("restaurant")) return "restaurants";
  if (tags?.includes("cocktails")) return "drinks";
  if (tags?.includes("street")) return "street";
  return "sights";
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<UiCategory>>(
    new Set(ALL_CATEGORIES),
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await fetch("/places.seed.json").then((r) => r.json());
        const hydrated = await hydratePlaces(raw as any[]);
        if (!cancelled) setPlaces(hydrated);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const p of places) {
      for (const t of p.tags ?? []) s.add(t);
    }
    return Array.from(s).sort();
  }, [places]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places.filter((p) => {
      const cat = deriveCategoryFromTags(p.tags);
      if (!selectedCategories.has(cat)) return false;
      const matchesQuery = q
        ? p.name.toLowerCase().includes(q) || (p.notes ?? "").toLowerCase().includes(q)
        : true;
      const matchesTags = selectedTags.size
        ? (p.tags ?? []).some((t) => selectedTags.has(t))
        : true;
      return matchesQuery && matchesTags;
    });
  }, [places, query, selectedCategories, selectedTags]);

  function toggleCategory(cat: UiCategory): void {
    const next = new Set(selectedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setSelectedCategories(next);
  }

  function toggleTag(tag: string): void {
    const next = new Set(selectedTags);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    setSelectedTags(next);
  }

  return (
    <div className="min-h-screen w-full flex justify-center p-8">
      <main className="w-full max-w-4xl flex flex-col gap-8">
        <header className="flex flex-col items-center text-center gap-3 lowercase">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
            🇮🇹 cata's milan trip research lol
          </h1>
          <p className="text-base md:text-lg text-black/80 max-w-2xl">
            after a morning of scrolling and saving, why not turn it into
            structured data and a tiny app to actually use in milan
          </p>
        </header>

        <section aria-label="map" className="w-full">
          <Map places={places} className="w-full aspect-[16/9] border border-black" />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {ALL_CATEGORIES.map((cat) => {
                const active = selectedCategories.has(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1 border border-black text-sm lowercase ${
                      active ? "bg-black text-white" : "bg-white text-black"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search locations..."
              className="w-full md:w-64 border border-black px-3 py-1 text-sm lowercase bg-white text-black"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {allTags.map((tag) => {
              const active = selectedTags.has(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-1 border border-black text-xs lowercase ${
                    active ? "bg-black text-white" : "bg-white text-black"
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const cat = deriveCategoryFromTags(p.tags);
            return (
            <article key={p.id} className="border border-black p-4 flex flex-col gap-2">
              <h2 className="text-lg font-semibold lowercase">{p.name}</h2>
              <div className="text-xs text-black/70 lowercase">{cat}</div>
              {p.notes ? (
                <p className="text-sm text-black/80 lowercase">{p.notes}</p>
              ) : null}
              <div className="flex flex-wrap gap-1">
                {(p.tags ?? []).map((t) => (
                  <span key={t} className="text-[11px] px-2 py-0.5 border border-black lowercase">
                    #{t}
                  </span>
                ))}
              </div>
              <div className="mt-2">
                <a
                  href={p.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline underline-offset-2"
                >
                  open in maps ↗
                </a>
              </div>
            </article>
          );})}
        </section>

        <footer className="text-center text-xs text-black/60 lowercase py-8">
          built for fun — will add ai plan + nearest button next
        </footer>
      </main>
    </div>
  );
}

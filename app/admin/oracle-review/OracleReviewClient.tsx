"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdminTabs from "@/app/components/admin/AdminTabs";
import { Card, CARD_TYPES, TIMING } from "@/app/lib/types/card";
import {
  ATTRIBUTION, REVIEW_FIELDS, OracleCard, ReviewDraft, ReviewEntry, ReviewField, ReviewStatus,
  currentDraft, effectiveStatus, hasChanges, isStale, makeBackup, newEntry, parseBackup,
  sourceWarnings, validateDraft,
} from "@/app/lib/utils/oracleReview";

const inputClass = "w-full rounded-md border border-algomancy-purple/30 bg-algomancy-dark px-3 py-2 text-sm text-white focus:outline-none focus:border-algomancy-gold disabled:opacity-50";
const buttonClass = "rounded-md border border-algomancy-purple/30 px-3 py-2 text-sm text-gray-200 hover:border-algomancy-gold/60 disabled:opacity-40 disabled:cursor-not-allowed";
const labels: Record<ReviewStatus, string> = { pending: "To review", approved: "Approved draft", deferred: "Needs checking", kept: "Keep current" };

function download(value: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface Props { userId: string; cards: Card[]; oracle: OracleCard[]; batchId: string }

export default function OracleReviewClient({ userId, cards, oracle, batchId }: Props) {
  const catalog = useMemo(() => new Map(cards.map(card => [card.id, card])), [cards]);
  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    for (const source of oracle) if (source.algomancer_id) counts.set(source.algomancer_id, (counts.get(source.algomancer_id) || 0) + 1);
    return oracle.filter(source => source.algomancer_id && catalog.has(source.algomancer_id) && counts.get(source.algomancer_id) === 1)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [oracle, catalog]);
  const allowedIds = useMemo(() => new Set(sources.map(source => source.algomancer_id!)), [sources]);
  const defaults = useMemo(() => Object.fromEntries(sources.map(source => [source.algomancer_id!, newEntry(catalog.get(source.algomancer_id!)!, source)])), [sources, catalog]);
  const unmatched = oracle.filter(source => !source.algomancer_id || !allowedIds.has(source.algomancer_id));
  const [entries, setEntries] = useState<Record<string, ReviewEntry>>({});
  const [selectedId, setSelectedId] = useState(sources[0]?.algomancer_id || "");
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [saveMessage, setSaveMessage] = useState("Loading saved review…");
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const cardHeading = useRef<HTMLHeadingElement>(null);
  const storageKey = `algomancer:oracle-review:v1:${userId}:${batchId}`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const backup = parseBackup(JSON.parse(stored), batchId, allowedIds);
        setEntries(backup.entries);
        if (backup.selectedId) setSelectedId(backup.selectedId);
      }
      setSaveMessage(stored ? "Saved review restored from this browser." : "Progress saves in this browser. Download a backup before switching devices.");
    } catch {
      setBlocked(true);
      setError("Saved progress could not be read. Download it below before starting a new review. Nothing has been overwritten.");
    }
    setReady(true);
    const changed = (event: StorageEvent) => {
      if (event.key === storageKey) {
        setBlocked(true);
        setError("This review changed in another tab. Reload to use the latest saved progress. You can download this tab's backup first.");
      }
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [storageKey, batchId, allowedIds]);

  function persist(next: Record<string, ReviewEntry>, selection = selectedId) {
    setEntries(next); setSelectedId(selection);
    try {
      localStorage.setItem(storageKey, JSON.stringify(makeBackup(batchId, next, selection)));
      setSaveMessage("Saved in this browser. Live cards have not changed.");
    } catch {
      setSaveMessage("Not saved to browser storage. Download a backup before leaving this page.");
      setError("Browser storage is unavailable or full. Your edits remain in this tab; download a backup to keep them.");
    }
  }

  const counts = { pending: 0, approved: 0, deferred: 0, kept: 0 };
  for (const source of sources) {
    const id = source.algomancer_id!;
    counts[effectiveStatus(entries[id] || defaults[id], catalog.get(id)!)]++;
  }
  const visible = sources.filter(source => {
    const id = source.algomancer_id!;
    const entry = entries[id] || defaults[id];
    const matches = filter === "all" || (filter === "changed" ? hasChanges(entry) : effectiveStatus(entry, catalog.get(id)!) === filter);
    return matches && `${source.name} ${id}`.toLowerCase().includes(search.toLowerCase());
  });
  // Keep the selected card visible after an edit changes its filter membership.
  const source = sources.find(item => item.algomancer_id === selectedId);
  const card = catalog.get(selectedId);
  const entry = entries[selectedId] || defaults[selectedId];
  const baseline = card ? currentDraft(card) : null;
  const stale = card && entry ? isStale(entry, card) : false;
  const issues = entry ? validateDraft(entry.draft) : [];
  const currentIndex = visible.findIndex(item => item.algomancer_id === selectedId);
  const editable = ready && !blocked;

  function focusCard() {
    requestAnimationFrame(() => cardHeading.current?.focus());
  }
  function choose(id: string) { if (id) { persist(entries, id); focusCard(); } }
  function edit(draft: ReviewDraft, note = entry.note) {
    setError("");
    persist({ ...entries, [selectedId]: { ...entry, draft, note, status: "pending", updatedAt: new Date().toISOString() } });
  }
  function decide(status: ReviewStatus) {
    if (!editable || (status === "approved" && (stale || issues.length))) return;
    const nextEntry = { ...entry, status, updatedAt: new Date().toISOString() };
    const nextEntries = { ...entries, [selectedId]: nextEntry };
    const nextId = visible.slice(currentIndex + 1).find(item => item.algomancer_id !== selectedId)?.algomancer_id;
    persist(nextEntries, nextId || selectedId);
    setAnnouncement(`${card!.name}: ${labels[status]}. ${nextId ? "Next card opened." : "End of this list."}`);
    if (nextId) focusCard();
  }
  async function restore(file?: File) {
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Backup is too large (maximum 10 MB).");
      const backup = parseBackup(JSON.parse(await file.text()), batchId, allowedIds);
      if (Object.keys(entries).length && !window.confirm("Replace this browser's review with the backup? Download your current backup first if you want to keep both.")) return;
      setBlocked(false); setError("");
      persist(backup.entries, backup.selectedId || sources[0]?.algomancer_id || "");
      setAnnouncement("Review backup restored. Changed catalog cards must be checked again.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not restore the backup."); }
  }
  function exportApproved() {
    const approved = Object.fromEntries(Object.entries(entries).filter(([id, item]) => catalog.has(id) && effectiveStatus(item, catalog.get(id)!) === "approved" && !validateDraft(item.draft).length));
    download(makeBackup(batchId, approved, ""), "oracle-approved-drafts.json");
  }

  const field = (key: ReviewField, multiline = false) => {
    const changed = baseline![key] !== entry.draft[key];
    const choices = key === "mainType" ? Object.values(CARD_TYPES) : key === "timing" ? Object.values(TIMING) : null;
    return <div key={key} className='grid gap-2 border-b border-white/10 py-3 md:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)]'>
      <label htmlFor={`review-${key}`} className={`text-sm ${changed ? "text-algomancy-gold" : "text-gray-300"}`}>{REVIEW_FIELDS[key]}{changed && <span className='block text-xs'>Changed</span>}</label>
      <div className='min-w-0 whitespace-pre-wrap break-words text-sm text-gray-400'>
        <span className='mr-2 text-xs text-gray-500 md:hidden'>Current:</span>{baseline![key] || "—"}
      </div>
      {choices ? <select id={`review-${key}`} className={inputClass} value={entry.draft[key]} onChange={event => edit({ ...entry.draft, [key]: event.target.value })}>
        {choices.map(choice => <option key={choice}>{choice}</option>)}
      </select> : multiline ? <textarea id={`review-${key}`} rows={key === "rulesText" ? 7 : 2} className={`${inputClass} resize-y`} value={entry.draft[key]} onChange={event => edit({ ...entry.draft, [key]: event.target.value })} /> :
        <input id={`review-${key}`} className={inputClass} value={entry.draft[key]} onChange={event => edit({ ...entry.draft, [key]: event.target.value })} />}
    </div>;
  };

  return <main className='mx-auto max-w-7xl px-4 py-8 text-white'>
    <h1 className='mb-2 text-2xl font-semibold'>Oracle review</h1>
    <p className='mb-5 max-w-3xl text-sm text-gray-400'>Compare each card with the supplied oracle export. Edit the proposal, then approve it or leave it for another check. Approval saves a draft; publishing is a separate step.</p>
    <AdminTabs />
    <div className='mb-4 flex flex-wrap items-center gap-2'>
      <button className={buttonClass} disabled={!ready} onClick={() => download(makeBackup(batchId, entries, selectedId), "oracle-review-backup.json")}>Download backup</button>
      <button className={buttonClass} disabled={!ready || !counts.approved} onClick={exportApproved}>Download approved ({counts.approved})</button>
      <label className={`${buttonClass} cursor-pointer`} htmlFor='restore-review'>Restore backup</label>
      <input id='restore-review' type='file' accept='.json,application/json' className='sr-only' disabled={!ready} onChange={event => { void restore(event.target.files?.[0]); event.target.value = ""; }} />
      <span className='text-xs text-gray-400'>Source: algomancy.online · 21 Sep 2026</span>
    </div>
    <p role='status' className='mb-2 text-sm text-gray-400'>{saveMessage}</p>
    {error && <div role='alert' className='mb-4 border-l-2 border-amber-400 pl-3 text-sm text-amber-200'>
      <p>{error}</p>
      {blocked && <div className='mt-2 flex flex-wrap gap-2'>
        <button className={buttonClass} onClick={() => window.location.reload()}>Reload saved progress</button>
        <button className={buttonClass} onClick={() => {
          try { download({ rawSavedData: localStorage.getItem(storageKey) }, "oracle-storage-recovery.json"); }
          catch { setError("Browser storage cannot be accessed. Download this tab's backup instead."); }
        }}>Download saved data</button>
        <button className={buttonClass} onClick={() => {
          if (window.confirm("Start a new review in this browser? This replaces saved progress. Download it first to keep a copy.")) {
            setBlocked(false); setError(""); persist({}, sources[0]?.algomancer_id || "");
          }
        }}>Start new review</button>
      </div>}
    </div>}
    <p className='mb-4 text-sm text-gray-300'>{sources.length} matched · {counts.approved} approved · {counts.kept} kept current · {counts.deferred} need checking · {counts.pending} to review</p>
    <fieldset disabled={!editable} className='mb-5 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]'>
      <label className='text-sm'>Find a card
        <input className={`${inputClass} mt-1`} placeholder='Name or card ID' value={search} onChange={event => setSearch(event.target.value)} />
      </label>
      <label className='text-sm'>Show
        <select aria-label='Show' className={`${inputClass} mt-1`} value={filter} onChange={event => setFilter(event.target.value)}>
          <option value='pending'>To review</option><option value='changed'>With differences</option><option value='approved'>Approved drafts</option><option value='deferred'>Needs checking</option><option value='kept'>Kept current</option><option value='all'>All matched cards</option>
        </select>
      </label>
      <label className='min-w-0 text-sm sm:col-span-2'>Cards in this list ({visible.length})
        <select aria-label='Select card' className={`${inputClass} mt-1`} value={currentIndex >= 0 ? selectedId : ""} onChange={event => choose(event.target.value)}>
          <option value='' disabled>{visible.length ? "Choose a card" : "No cards in this list"}</option>
          {visible.map(item => <option key={item.algomancer_id} value={item.algomancer_id!}>{item.name} — {labels[effectiveStatus(entries[item.algomancer_id!] || defaults[item.algomancer_id!], catalog.get(item.algomancer_id!)!)]}</option>)}
        </select>
      </label>
    </fieldset>
    <p aria-live='polite' className='mb-3 text-sm text-algomancy-gold'>{announcement}</p>
    {source && card && entry && baseline ? <>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4'>
        <div><h2 ref={cardHeading} tabIndex={-1} className='text-xl font-semibold outline-none'>{card.name}</h2><p className='text-xs text-gray-400'>{card.id} · {labels[effectiveStatus(entry, card)]}</p></div>
        <div className='flex gap-2'>
          <button className={buttonClass} disabled={!editable || currentIndex <= 0} onClick={() => choose(visible[currentIndex - 1]?.algomancer_id || "")}>Previous</button>
          <button className={buttonClass} disabled={!editable || !visible.length || currentIndex === visible.length - 1} onClick={() => choose(visible[currentIndex + 1]?.algomancer_id || "")}>Next</button>
        </div>
      </div>
      {stale && <div className='mb-4 border-l-2 border-amber-400 pl-3 text-sm text-amber-200'>
        <p>The catalog changed since this draft was started. Compare the new current values below before approving again.</p>
        <button disabled={!editable} className={`${buttonClass} mt-2`} onClick={() => persist({ ...entries, [selectedId]: { ...entry, baseline, baselineImage: card.imageUrl, baselineVersion: card.rulesVersion || 1, status: "pending", updatedAt: new Date().toISOString() } })}>I have checked the current version</button>
      </div>}
      <div className='grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]'>
        <aside className='min-w-0 lg:sticky lg:top-4'>
          <a href={card.imageUrl} target='_blank' rel='noreferrer' className='block' aria-label={`Open current image of ${card.name}`}>
            {/* Keep the source image unmodified and allow opening it at full size. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={card.imageUrl} src={card.imageUrl} alt={card.name} width={720} height={1000} className='mx-auto h-auto w-full max-w-xs rounded-md' />
          </a>
          <p className='mt-2 text-xs text-gray-400'>Current Algomancer image. Click to enlarge. The oracle export does not contain new images.</p>
          <details className='mt-4 text-sm text-gray-400'>
            <summary className='cursor-pointer text-gray-200'>Source notes ({sourceWarnings(card, source).length})</summary>
            <ul className='mt-2 list-disc space-y-2 pl-4'>{sourceWarnings(card, source).map(message => <li key={message}>{message}</li>)}</ul>
          </details>
          <details className='mt-4 text-sm text-gray-400'>
            <summary className='cursor-pointer text-gray-200'>Original oracle text &amp; type</summary>
            <p className='mt-2 whitespace-pre-wrap break-words'>{source.type_line}</p>
            <p className='mt-3 whitespace-pre-wrap break-words'>{source.text || "No printed rules text."}</p>
          </details>
        </aside>
        <fieldset disabled={!editable} className='min-w-0'>
          <div className='hidden gap-2 border-b border-white/20 pb-2 text-xs text-gray-400 md:grid md:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)]'><span>Field</span><span>Current catalog</span><span>Editable proposal</span></div>
          {(["name", "manaCost", "affinity", "mainType", "subType", "attributes", "power", "defense", "timing"] as ReviewField[]).map(key => field(key))}
          <p className='mt-2 text-xs text-gray-500'>Affinity: element counts, e.g. light: 1, wood: 1. Attributes: comma-separated. X is kept as X.</p>
          {field("rulesText", true)}
          <section className='border-b border-white/10 py-4' aria-label='Prophecy alternative cost'>
            <label className='flex items-center gap-2 text-sm text-gray-200'><input type='checkbox' checked={entry.draft.prophecy !== null} onChange={event => edit({ ...entry.draft, prophecy: event.target.checked ? { mana: "", affinity: "", condition: "" } : null })} />Has a Prophecy alternative cost</label>
            <p className='mt-2 text-xs text-gray-400'>Separate from the full mana cost and rules text. The card waits for the Prophecy condition before being played. Our current catalog has no separate Prophecy field.</p>
            {entry.draft.prophecy && <div className='mt-3 grid gap-3 sm:grid-cols-2'>
              {(["mana", "affinity", "condition"] as const).map(key => <label key={key} className={`text-sm ${key === "condition" ? "sm:col-span-2" : ""}`}>Prophecy {key}
                <input aria-label={`Prophecy ${key}`} className={`${inputClass} mt-1`} value={entry.draft.prophecy![key]} onChange={event => edit({ ...entry.draft, prophecy: { ...entry.draft.prophecy!, [key]: event.target.value } })} />
              </label>)}
            </div>}
          </section>
          {field("augmentTransfers")}
          <details className='border-b border-white/10 py-3'>
            <summary className='cursor-pointer text-sm text-gray-300'>Set and complexity (kept from our catalog)</summary>
            {field("setName")}{field("complexity")}
          </details>
          <label className='mt-4 block text-sm text-gray-300'>Review note (optional)
            <textarea aria-label='Review note' rows={2} className={`${inputClass} mt-1 resize-y`} value={entry.note} onChange={event => edit(entry.draft, event.target.value)} placeholder='What needs checking, or why you corrected a value…' />
          </label>
          <button className={`${buttonClass} mt-3`} onClick={() => {
            if (window.confirm("Reset this proposal to the supplied oracle values? Your note will be kept.")) edit(defaults[selectedId].draft);
          }}>Reset proposal</button>
          {issues.length > 0 && <ul className='mt-3 list-disc pl-5 text-sm text-amber-200'>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
        </fieldset>
      </div>
      <div className='sticky bottom-0 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-algomancy-purple/30 bg-algomancy-darker py-4'>
        <span className='text-xs text-gray-400'>Draft review only · no live updates</span>
        <div className='flex flex-wrap gap-2'>
          <button className={buttonClass} disabled={!editable || !!stale} onClick={() => decide("kept")}>Keep current &amp; next</button>
          <button className={buttonClass} disabled={!editable} onClick={() => decide("deferred")}>Check later &amp; next</button>
          <button className='rounded-md bg-algomancy-purple px-4 py-2 text-sm font-medium text-white hover:bg-algomancy-purple-dark disabled:cursor-not-allowed disabled:opacity-40' disabled={!editable || !!stale || issues.length > 0} onClick={() => decide("approved")}>Approve draft &amp; next</button>
        </div>
      </div>
    </> : <p className='py-8 text-gray-400'>There are no matched cards to review.</p>}
    <details className='mt-8 border-t border-white/10 pt-4 text-sm text-gray-400'>
      <summary className='cursor-pointer'>Unmatched or ambiguous export entries ({unmatched.length})</summary>
      <p className='mt-2'>These are not created or matched by name. They need a separate identity check.</p>
      <ul className='mt-2 list-disc pl-5'>{unmatched.map((item, index) => <li key={`${item.name}-${index}`}>{item.name}{item.algomancer_id ? ` (${item.algomancer_id})` : " — no Algomancer ID"}</li>)}</ul>
    </details>
    <p className='mt-6 text-xs text-gray-500'>{ATTRIBUTION}</p>
  </main>;
}

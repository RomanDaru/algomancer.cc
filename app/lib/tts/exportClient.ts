"use client";

// Client-side helper to download the TTS export for a deck
export async function downloadDeckTTS(deckId: string, deckName?: string) {
  const res = await fetch(`/api/tts/export/${deckId}`);
  if (!res.ok) {
    let message = `Failed to export deck (${res.status})`;
    try {
      const err = await res.json();
      if (err?.error) message = err.error;
    } catch {}
    throw new Error(message);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const suggested =
    match?.[1] ||
    `${(deckName || "deck").replace(/[^\w\-\s\.]/g, "_").replace(/\s+/g, "_")}.json`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggested;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}


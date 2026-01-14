"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  ChevronDownIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";
import { toPng } from "html-to-image";
import type { Card } from "@/app/lib/types/card";
import type { Deck } from "@/app/lib/types/user";

interface DeckOptionsMenuProps {
  deck: Deck;
  cards: Card[];
  deckId: string;
  isOwner: boolean;
  className?: string;
  exportTargetRef?: React.RefObject<HTMLElement | null>;
}

export default function DeckOptionsMenu({
  deck,
  cards,
  deckId,
  isOwner,
  className = "",
  exportTargetRef,
}: DeckOptionsMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [exportImageUrl, setExportImageUrl] = useState<string | null>(null);
  const [exportImageError, setExportImageError] = useState<string | null>(null);
  const [deckUrl, setDeckUrl] = useState("");
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );

  useEffect(() => {
    if (!open) return;
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const width = 224; // w-56
    setMenuPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.right + window.scrollX - width,
    });

    const handleReposition = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      setMenuPos({ top: r.bottom + window.scrollY + 8, left: r.right + window.scrollX - width });
    };
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideRoot = rootRef.current?.contains(target) ?? false;
      const insideMenu = menuRef.current?.contains(target) ?? false;
      if (!insideRoot && !insideMenu) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside, true);
    return () => document.removeEventListener("mousedown", handleOutside, true);
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDeckUrl(`${window.location.origin}/decks/${deckId}`);
  }, [deckId]);

  const handleCopyDeck = async () => {
    setIsCopying(true);
    try {
      const payload = {
        name: `${deck.name} (Copy)`,
        description: deck.description || "",
        youtubeUrl: deck.youtubeUrl || "",
        cards: deck.cards,
        isPublic: false,
      };
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to copy deck");
      }
      const created = await res.json();
      toast.success("Deck copied");
      setOpen(false);
      router.push(`/decks/${created._id}`);
    } catch (e) {
      console.error("Copy deck failed:", e);
      toast.error(e instanceof Error ? e.message : "Copy failed");
    } finally {
      setIsCopying(false);
    }
  };

  const handleExportTxt = async () => {
    try {
      const lines: string[] = [];
      lines.push(deck.name);
      lines.push("");
      deck.cards.forEach((dc) => {
        const c = cards.find((x) => x.id === dc.cardId);
        if (c) lines.push(`${dc.quantity}x ${c.name}`);
      });
      const content = lines.join("\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${deck.name.replace(/[^\w\-\s\.]/g, "_").replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (e) {
      console.error("Export txt failed:", e);
      toast.error("Export .txt failed");
    }
  };

  const handleExportTss = async () => {
    try {
      const res = await fetch(`/api/tts/export/${deckId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to export deck (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const suggested =
        (match && match[1]) ||
        `${deck.name.replace(/[^\w\-\s\.]/g, "_").replace(/\s+/g, "_")}.json`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = suggested;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("TTS export downloaded");
      setOpen(false);
    } catch (e) {
      console.error("Export TTS failed:", e);
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  };

  const handleOpenExportImage = async () => {
    setOpen(false);
    setIsExportModalOpen(true);
    setExportImageError(null);
    setExportImageUrl(null);

    const target = exportTargetRef?.current;
    if (!target) {
      setExportImageError("Deck preview is not available.");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const dataUrl = await toPng(target, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0b0b12",
        skipFonts: true,
        filter: (node) => {
          if (node instanceof HTMLElement) {
            return node.dataset.exportHide !== "true";
          }
          return true;
        },
      });
      setExportImageUrl(dataUrl);
    } catch (e) {
      console.error("Export image failed:", e);
      setExportImageError("Failed to generate the image preview.");
      toast.error("Export image failed");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadImage = () => {
    if (!exportImageUrl) return;
    const safeName = deck.name
      .replace(/[^\w\-\s\.]/g, "_")
      .replace(/\s+/g, "_");
    const a = document.createElement("a");
    a.href = exportImageUrl;
    a.download = `${safeName || "deck"}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleCopyLink = async () => {
    if (!deckUrl) return;
    try {
      await navigator.clipboard.writeText(deckUrl);
      toast.success("Link copied");
    } catch (e) {
      console.error("Copy link failed:", e);
      toast.error("Copy failed");
    }
  };

  const handleCloseExportModal = () => {
    setIsExportModalOpen(false);
    setExportImageUrl(null);
    setExportImageError(null);
  };

  const handleEdit = () => {
    setOpen(false);
    router.push(`/decks/${deckId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this deck? This action cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete deck");
      }
      toast.success("Deck deleted successfully");
      setOpen(false);
      router.push("/profile/decks");
    } catch (error) {
      console.error("Error deleting deck:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete deck");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className='inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/20 hover:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30'
        aria-haspopup='menu'
        aria-expanded={open}
      >
        Options
        <ChevronDownIcon className='w-4 h-4' />
      </button>

      {open && menuPos &&
        createPortal(
          <div
            ref={menuRef}
            className='fixed z-[1000] w-56 bg-algomancy-darker border border-algomancy-purple/30 rounded shadow-lg overflow-visible'
            role='menu'
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <button
              onClick={handleCopyDeck}
              disabled={isCopying}
              className='w-full text-left px-4 py-2 text-sm text-white hover:bg-algomancy-purple/30 focus:outline-none focus:ring-1 focus:ring-algomancy-purple/40 disabled:opacity-50 flex items-center'
              role='menuitem'
            >
              <DocumentDuplicateIcon className='w-4 h-4 mr-2' />
              {isCopying ? "Copying Deck…" : "Copy Deck"}
            </button>
            <button
              onClick={handleOpenExportImage}
              className='w-full text-left px-4 py-2 text-sm text-white hover:bg-algomancy-purple/30 focus:outline-none focus:ring-1 focus:ring-algomancy-purple/40 flex items-center'
              role='menuitem'
            >
              <PhotoIcon className='w-4 h-4 mr-2' />
              Export as Image
            </button>
            <button
              onClick={handleExportTxt}
              className='w-full text-left px-4 py-2 text-sm text-white hover:bg-algomancy-purple/30 focus:outline-none focus:ring-1 focus:ring-algomancy-purple/40 flex items-center'
              role='menuitem'
            >
              <DocumentTextIcon className='w-4 h-4 mr-2' />
              Export deck .txt
            </button>
            <button
              onClick={handleExportTss}
              className='w-full text-left px-4 py-2 text-sm text-white hover:bg-algomancy-purple/30 focus:outline-none focus:ring-1 focus:ring-algomancy-purple/40 flex items-center'
              role='menuitem'
            >
              <DocumentArrowDownIcon className='w-4 h-4 mr-2' />
              Export to JSON (TSS)
            </button>
            {isOwner && (
              <>
                <div className='my-1 border-t border-algomancy-purple/20' />
                <button
                  onClick={handleEdit}
                  className='w-full text-left px-4 py-2 text-sm text-white hover:bg-algomancy-purple/30 focus:outline-none focus:ring-1 focus:ring-algomancy-purple/40 flex items-center'
                  role='menuitem'
                >
                  <PencilIcon className='w-4 h-4 mr-2' />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className='w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 focus:outline-none focus:ring-1 focus:ring-red-400/40 disabled:opacity-50 flex items-center'
                  role='menuitem'
                >
                  <TrashIcon className='w-4 h-4 mr-2' />
                  {isDeleting ? "Deleting…" : "Delete"}
                </button>
              </>
            )}
          </div>,
          document.body
        )}

      {isExportModalOpen &&
        createPortal(
          <div className='fixed inset-0 z-[1001] flex items-center justify-center p-4'>
            <div
              className='absolute inset-0 bg-black/60'
              onClick={handleCloseExportModal}
            />
            <div
              className='relative bg-algomancy-darker border border-algomancy-purple/30 rounded-lg w-full max-w-2xl p-6'
              role='dialog'
              aria-modal='true'
              aria-label='Export deck image'
            >
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-white'>
                  Export deck image
                </h3>
                <button
                  onClick={handleCloseExportModal}
                  className='text-gray-400 hover:text-white'
                  aria-label='Close export modal'
                >
                  <XMarkIcon className='w-5 h-5' />
                </button>
              </div>

              <div className='rounded-lg border border-white/10 bg-black/30 p-3'>
                {isGeneratingImage && (
                  <div className='flex items-center justify-center py-16'>
                    <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-algomancy-purple' />
                  </div>
                )}
                {!isGeneratingImage && exportImageUrl && (
                  <div className='flex justify-center'>
                    <img
                      src={exportImageUrl}
                      alt={`Preview of ${deck.name}`}
                      className='max-h-48 max-w-[240px] w-auto h-auto rounded shadow'
                    />
                  </div>
                )}
                {!isGeneratingImage && !exportImageUrl && (
                  <div className='text-sm text-gray-400 py-10 text-center'>
                    {exportImageError || "Preview not available."}
                  </div>
                )}
              </div>

              <div className='mt-4 space-y-3'>
                <div>
                  <label className='block text-xs uppercase tracking-wide text-gray-400 mb-1'>
                    Share link
                  </label>
                  <div className='flex gap-2'>
                    <input
                      type='text'
                      value={deckUrl}
                      readOnly
                      className='flex-1 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-200'
                    />
                    <button
                      type='button'
                      onClick={handleCopyLink}
                      className='px-3 py-2 rounded-md border border-algomancy-purple/40 text-sm text-white hover:bg-algomancy-purple/30'
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className='mt-5 flex justify-end gap-2'>
                <button
                  type='button'
                  onClick={handleCloseExportModal}
                  className='px-4 py-2 rounded-md border border-white/10 text-sm text-gray-300 hover:text-white'
                >
                  Close
                </button>
                <button
                  type='button'
                  onClick={handleDownloadImage}
                  disabled={!exportImageUrl}
                  className='px-4 py-2 rounded-md bg-algomancy-purple text-sm text-white hover:bg-algomancy-purple-dark disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Download PNG
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}


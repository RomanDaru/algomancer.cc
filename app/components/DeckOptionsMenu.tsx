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
} from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";
import type { Card } from "@/app/lib/types/card";
import type { Deck } from "@/app/lib/types/user";

interface DeckOptionsMenuProps {
  deck: Deck;
  cards: Card[];
  deckId: string;
  isOwner: boolean;
  className?: string;
}

export default function DeckOptionsMenu({
  deck,
  cards,
  deckId,
  isOwner,
  className = "",
}: DeckOptionsMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
        className='flex items-center px-4 py-2 bg-algomancy-dark text-white border border-algomancy-purple/30 rounded hover:bg-algomancy-dark/80 focus:outline-none focus:ring-1 focus:ring-algomancy-purple/50'
        aria-haspopup='menu'
        aria-expanded={open}
      >
        Options
        <ChevronDownIcon className='w-4 h-4 ml-2' />
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
    </div>
  );
}


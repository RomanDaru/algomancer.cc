"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/cards", label: "Cards" },
  { href: "/admin/competitions", label: "Competitions" },
];

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav
      className='mb-6 flex flex-wrap gap-2'
      aria-label='Admin navigation'>
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href || pathname?.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-md border px-3 py-2 text-sm transition-colors ${
              isActive
                ? "border-algomancy-gold/40 bg-algomancy-gold/10 text-algomancy-gold"
                : "border-algomancy-purple/25 bg-algomancy-darker text-gray-300 hover:border-algomancy-purple/40 hover:text-white"
            }`}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

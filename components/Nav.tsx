"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "War Room" },
  { href: "/moneyball", label: "Moneyball" },
  { href: "/waivers", label: "Waivers" },
  { href: "/injuries", label: "Injuries" },
  { href: "/players", label: "Players" },
  { href: "/teams", label: "Team Context" },
  { href: "/method", label: "Method" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Main">
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

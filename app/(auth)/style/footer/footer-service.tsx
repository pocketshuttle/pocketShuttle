import Link from "next/link"
import { useMemo } from "react"
const BASE_URL = "https://www.pocketshuttle.com"

export const FooterService = () => {
    const links = useMemo(() => [
        { href: "/terms", label: "Terms of Service" },
        { href: "/privacy", label: "privacy" },
        { href: "/faq", label: "Frequently Asked Questions (FAQ)" }
    ], [])

    const linkStyle = "text-slate-600 text-sm hover:text-blue-700 transition"

    return (
        <div className="flex flex-col md:flex-row items-center justify-between px-2 gap-x-2 py-3 gap-y-2">
            {
                links.map(({ href, label }) => {
                    return (
                        <Link
                            key={href}
                            className={linkStyle}
                            href={`${BASE_URL}${href}`}
                            prefetch
                        >
                            {label}
                        </Link>
                    )
                })
            }
        </div>
    )
}

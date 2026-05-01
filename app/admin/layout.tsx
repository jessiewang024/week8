import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { LogoutButton } from "./logout-button";
import { ThemeProvider, ThemeToggle } from "./theme-provider";

const navGroups = [
    {
        label: "Humor",
        links: [
            { href: "/admin/humor-flavors", text: "Humor Flavors" },
            { href: "/admin/humor-flavor-steps", text: "Flavor Steps" },
            { href: "/admin/generate-captions", text: "Test Captions" },
        ],
    },
    {
        label: "LLM",
        links: [
            { href: "/admin/llm-models", text: "LLM Models" },
            { href: "/admin/llm-providers", text: "LLM Providers" },
        ],
    },
];

export default async function AdminLayout({
                                              children,
                                          }: {
    children: React.ReactNode;
}) {
    await requireAdmin();

    return (
        <ThemeProvider>
            <div className="admin-layout">
                <nav className="admin-sidebar">
                    <div className="sidebar-header">
                        <h2>Humor Flavors</h2>
                    </div>

                    <div className="sidebar-nav">
                        {navGroups.map((group) => (
                            <div key={group.label} className="nav-group">
                                <div className="nav-group-label">{group.label}</div>

                                {group.links.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="nav-link"
                                    >
                                        {link.text}
                                    </Link>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="sidebar-footer">
                        <ThemeToggle />
                        <LogoutButton />
                    </div>
                </nav>

                <main className="admin-main">{children}</main>
            </div>
        </ThemeProvider>
    );
}
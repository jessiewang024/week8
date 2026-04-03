import { createServiceClient } from "@/lib/supabase/service";

/**
 * Captions page — READ only.
 * Displays the most recent 100 captions from the database.
 * Supports filtering by humor flavor via caption_requests.
 */
export default async function CaptionsPage({
    searchParams,
}: {
    searchParams: Promise<{ flavor?: string }>;
}) {
    const { flavor } = await searchParams;
    const admin = createServiceClient();

    // Fetch humor flavors for the filter dropdown
    const { data: flavors } = await admin
        .from("humor_flavors")
        .select("id, slug")
        .order("slug");

    // Build the captions query — optionally filter by humor flavor
    let query = admin.from("captions").select("*").limit(100);

    if (flavor) {
        query = query.eq("humor_flavor_id", flavor);
    }

    const { data: captions, error } = await query;

    const selectedFlavorSlug = flavors?.find((f: any) => String(f.id) === flavor)?.slug;

    return (
        <div>
            <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Captions</h1>
            <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
                {selectedFlavorSlug
                    ? `Filtered by humor flavor: ${selectedFlavorSlug}.`
                    : "Showing all captions."}{" "}
                Total shown: {captions?.length ?? 0} (read-only, max 100)
            </p>

            {/* ── Humor Flavor Filter ──────────────────────────── */}
            <form method="GET" style={{ marginBottom: "20px", display: "flex", gap: "8px", alignItems: "center" }}>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Filter by Humor Flavor:</label>
                <select
                    name="flavor"
                    defaultValue={flavor ?? ""}
                    style={{
                        padding: "6px 10px",
                        border: "1px solid var(--input-border)",
                        borderRadius: "6px",
                        backgroundColor: "var(--input-bg)",
                        color: "var(--foreground)",
                        fontSize: "13px",
                    }}
                >
                    <option value="">All Flavors</option>
                    {flavors?.map((f: any) => (
                        <option key={f.id} value={f.id}>{f.slug}</option>
                    ))}
                </select>
                <button
                    type="submit"
                    style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: "var(--accent)",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "13px",
                    }}
                >
                    Filter
                </button>
                {flavor && (
                    <a
                        href="/admin/captions"
                        style={{ fontSize: "13px", color: "var(--accent)", textDecoration: "underline" }}
                    >
                        Clear
                    </a>
                )}
            </form>

            {error && (
                <p style={{ color: "var(--danger)", marginBottom: "16px" }}>
                    Error loading captions: {error.message}
                </p>
            )}

            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>Image ID</th>
                        <th style={thStyle}>Caption</th>
                        <th style={thStyle}>Created</th>
                    </tr>
                </thead>
                <tbody>
                    {captions?.map((c: any) => (
                        <tr key={c.id}>
                            <td style={{ ...tdStyle, fontSize: "11px", fontFamily: "monospace" }}>
                                {c.id}
                            </td>
                            <td style={{ ...tdStyle, fontSize: "11px", fontFamily: "monospace" }}>
                                {c.image_id}
                            </td>
                            <td style={{ ...tdStyle, maxWidth: "400px" }}>
                                {c.content ?? "—"}
                            </td>
                            <td style={tdStyle}>
                                {c.created_datetime_utc ? new Date(c.created_datetime_utc).toLocaleDateString() : "—"}
                            </td>
                        </tr>
                    ))}
                    {(!captions || captions.length === 0) && !error && (
                        <tr>
                            <td style={tdStyle} colSpan={4}>No captions found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ── Style constants ─────────────────────────────────────────

const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    borderRadius: "10px",
    overflow: "hidden",
};

const thStyle: React.CSSProperties = {
    borderBottom: "1px solid var(--card-border)",
    textAlign: "left",
    padding: "10px 14px",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--muted)",
    backgroundColor: "var(--table-header-bg)",
    textTransform: "uppercase",
};

const tdStyle: React.CSSProperties = {
    borderBottom: "1px solid var(--card-border)",
    textAlign: "left",
    padding: "10px 14px",
    fontSize: "13px",
};

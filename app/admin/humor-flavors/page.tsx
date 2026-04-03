import { createServiceClient } from "@/lib/supabase/service";
import { createHumorFlavor, updateHumorFlavor, deleteHumorFlavor } from "./actions";

/**
 * Humor Flavors page — full CRUD.
 * A "humor flavor" defines a style of humor (e.g. sarcasm, puns, dark humor).
 * Each flavor has a set of steps (prompt chain) that generates captions.
 */
export default async function HumorFlavorsPage() {
    const admin = createServiceClient();

    const { data: flavors, error } = await admin
        .from("humor_flavors")
        .select("*")
        .limit(100);

    return (
        <div>
            <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Humor Flavors</h1>
            <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
                Manage humor flavor configurations.
            </p>

            {error && (
                <p style={{ color: "var(--danger)", marginBottom: "16px" }}>
                    Error: {error.message}
                </p>
            )}

            {/* ── Create Form ────────────────────────────────── */}
            <section style={cardStyle}>
                <h2 style={{ marginBottom: "16px" }}>Create Humor Flavor</h2>
                <form action={createHumorFlavor} style={{ display: "grid", gap: "12px", maxWidth: "600px" }}>
                    <label style={labelStyle}>Slug</label>
                    <input name="slug" placeholder="e.g. sarcastic-wit" style={inputStyle} required />

                    <label style={labelStyle}>Description</label>
                    <textarea name="description" style={textareaStyle} />

                    <button type="submit" style={buttonStyle}>Create Flavor</button>
                </form>
            </section>

            {/* ── Table ───────────────────────────────────────── */}
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>Slug</th>
                        <th style={thStyle}>Description</th>
                        <th style={thStyle}>Created</th>
                        <th style={thStyle}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {flavors?.map((f: any) => (
                        <tr key={f.id}>
                            <td style={monoTdStyle}>{f.id}</td>
                            <td style={tdStyle}>{f.slug}</td>
                            <td style={{ ...tdStyle, maxWidth: "250px" }}>{f.description ?? "—"}</td>
                            <td style={tdStyle}>
                                {f.created_datetime_utc ? new Date(f.created_datetime_utc).toLocaleDateString() : "—"}
                            </td>
                            <td style={tdStyle}>
                                {/* Edit form inside collapsible details */}
                                <details>
                                    <summary style={{ cursor: "pointer", color: "var(--accent)" }}>Edit</summary>
                                    <form action={updateHumorFlavor} style={{ display: "grid", gap: "8px", marginTop: "8px", minWidth: "250px" }}>
                                        <input type="hidden" name="id" value={f.id} />
                                        <input name="slug" defaultValue={f.slug ?? ""} style={inputStyle} />
                                        <textarea name="description" defaultValue={f.description ?? ""} style={textareaStyle} />
                                        <button type="submit" style={buttonStyle}>Update</button>
                                    </form>
                                </details>

                                {/* Delete button */}
                                <form action={deleteHumorFlavor} style={{ marginTop: "8px" }}>
                                    <input type="hidden" name="id" value={f.id} />
                                    <button type="submit" style={dangerButtonStyle}>Delete</button>
                                </form>
                            </td>
                        </tr>
                    ))}
                    {(!flavors || flavors.length === 0) && !error && (
                        <tr><td style={tdStyle} colSpan={5}>No humor flavors found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ── Style constants ─────────────────────────────────────────

const cardStyle: React.CSSProperties = {
    border: "1px solid var(--card-border)",
    borderRadius: "12px",
    padding: "20px",
    backgroundColor: "var(--card-bg)",
    marginBottom: "24px",
};

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
    verticalAlign: "top",
};

const monoTdStyle: React.CSSProperties = {
    ...tdStyle,
    fontSize: "11px",
    fontFamily: "monospace",
};

const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--muted)",
    textTransform: "uppercase",
};

const inputStyle: React.CSSProperties = {
    padding: "8px 12px",
    border: "1px solid var(--input-border)",
    borderRadius: "6px",
    backgroundColor: "var(--input-bg)",
    color: "var(--foreground)",
    fontSize: "14px",
};

const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: "60px",
    resize: "vertical",
};

const buttonStyle: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "var(--accent)",
    color: "white",
    cursor: "pointer",
    fontSize: "13px",
};

const dangerButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "var(--danger)",
};

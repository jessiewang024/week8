import { createServiceClient } from "@/lib/supabase/service";
import {
    createFlavor,
    updateFlavor,
    deleteFlavor,
    duplicateHumorFlavor,
} from "./actions";

/**
 * Humor Flavors page.
 * Admin can create, update, delete, and duplicate humor flavors.
 * Duplicating a flavor also duplicates all related prompt chain steps.
 */
export default async function HumorFlavorsPage() {
    const admin = createServiceClient();

    const [{ data: flavors, error }, { data: steps }] = await Promise.all([
        admin
            .from("humor_flavors")
            .select("*")
            .order("id", { ascending: false }),
        admin
            .from("humor_flavor_steps")
            .select("id, humor_flavor_id"),
    ]);

    const stepCounts: Record<string, number> = {};

    for (const step of steps ?? []) {
        const flavorId = String(step.humor_flavor_id);
        stepCounts[flavorId] = (stepCounts[flavorId] ?? 0) + 1;
    }

    return (
        <div>
            <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>
                Humor Flavors
            </h1>

            <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
                Create, edit, delete, and duplicate humor flavors. Duplicating a flavor also copies all of its steps.
            </p>

            {error && (
                <p style={{ color: "var(--danger)", marginBottom: "16px" }}>
                    Error: {error.message}
                </p>
            )}

            <section style={cardStyle}>
                <h2 style={{ marginBottom: "16px" }}>Create Humor Flavor</h2>

                <form
                    action={createFlavor}
                    style={{
                        display: "grid",
                        gap: "12px",
                        maxWidth: "600px",
                    }}
                >
                    <label style={labelStyle}>Flavor Name</label>
                    <input
                        name="slug"
                        placeholder="e.g., dry-humor-like-the-office"
                        style={inputStyle}
                        required
                    />

                    <label style={labelStyle}>Description</label>
                    <textarea
                        name="description"
                        placeholder="Describe what this humor flavor is supposed to do..."
                        style={textareaStyle}
                        rows={3}
                    />

                    <button type="submit" style={buttonStyle}>
                        Create Flavor
                    </button>
                </form>
            </section>

            <section style={cardStyle}>
                <h2 style={{ marginBottom: "16px" }}>Existing Humor Flavors</h2>

                <table style={tableStyle}>
                    <thead>
                    <tr>
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>Flavor Name</th>
                        <th style={thStyle}>Description</th>
                        <th style={thStyle}>Steps</th>
                        <th style={thStyle}>Created</th>
                        <th style={thStyle}>Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {flavors?.map((flavor: any) => (
                        <tr key={flavor.id}>
                            <td style={monoTdStyle}>{flavor.id}</td>

                            <td style={tdStyle}>
                                <strong>{flavor.slug}</strong>
                            </td>

                            <td style={{ ...tdStyle, maxWidth: "320px" }}>
                                {flavor.description ?? "—"}
                            </td>

                            <td style={tdStyle}>
                                {stepCounts[String(flavor.id)] ?? 0}
                            </td>

                            <td style={tdStyle}>
                                {flavor.created_datetime_utc
                                    ? new Date(flavor.created_datetime_utc).toLocaleDateString()
                                    : "—"}
                            </td>

                            <td style={tdStyle}>
                                <details>
                                    <summary style={summaryStyle}>
                                        Edit
                                    </summary>

                                    <form
                                        action={updateFlavor}
                                        style={{
                                            display: "grid",
                                            gap: "8px",
                                            marginTop: "8px",
                                            minWidth: "280px",
                                        }}
                                    >
                                        <input
                                            type="hidden"
                                            name="id"
                                            value={flavor.id}
                                        />

                                        <label style={labelStyle}>Flavor Name</label>
                                        <input
                                            name="slug"
                                            defaultValue={flavor.slug ?? ""}
                                            style={inputStyle}
                                            required
                                        />

                                        <label style={labelStyle}>Description</label>
                                        <textarea
                                            name="description"
                                            defaultValue={flavor.description ?? ""}
                                            style={textareaStyle}
                                            rows={3}
                                        />

                                        <button type="submit" style={buttonStyle}>
                                            Update Flavor
                                        </button>
                                    </form>
                                </details>

                                <details style={{ marginTop: "8px" }}>
                                    <summary style={summaryStyle}>
                                        Duplicate
                                    </summary>

                                    <form
                                        action={duplicateHumorFlavor}
                                        style={{
                                            display: "grid",
                                            gap: "8px",
                                            marginTop: "8px",
                                            minWidth: "280px",
                                        }}
                                    >
                                        <input
                                            type="hidden"
                                            name="id"
                                            value={flavor.id}
                                        />

                                        <label style={labelStyle}>
                                            New Unique Flavor Name
                                        </label>

                                        <input
                                            name="new_slug"
                                            placeholder={`${flavor.slug}-copy`}
                                            style={inputStyle}
                                            required
                                        />

                                        <button type="submit" style={buttonStyle}>
                                            Duplicate Flavor
                                        </button>
                                    </form>
                                </details>

                                <form
                                    action={deleteFlavor}
                                    style={{ marginTop: "8px" }}
                                >
                                    <input
                                        type="hidden"
                                        name="id"
                                        value={flavor.id}
                                    />

                                    <button type="submit" style={dangerButtonStyle}>
                                        Delete
                                    </button>
                                </form>
                            </td>
                        </tr>
                    ))}

                    {(!flavors || flavors.length === 0) && !error && (
                        <tr>
                            <td style={tdStyle} colSpan={6}>
                                No humor flavors found.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </section>
        </div>
    );
}

const cardStyle: React.CSSProperties = {
    border: "1px solid var(--card-border)",
    borderRadius: "12px",
    padding: "20px",
    backgroundColor: "var(--card-bg)",
    marginBottom: "20px",
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
    minHeight: "70px",
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

const summaryStyle: React.CSSProperties = {
    cursor: "pointer",
    color: "var(--accent)",
    fontWeight: 500,
};
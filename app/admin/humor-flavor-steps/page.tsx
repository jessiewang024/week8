import { createServiceClient } from "@/lib/supabase/service";
import { createStep, updateStep, deleteStep, reorderStep } from "./actions";

/**
 * Humor Flavor Steps page — full CRUD + reorder.
 * Each humor flavor has a series of steps (a "prompt chain").
 * Steps are ordered by the "order_by" column.
 */
export default async function HumorFlavorStepsPage() {
    const admin = createServiceClient();

    // Fetch all steps and all flavors (for the dropdown)
    const [{ data: steps, error }, { data: flavors }] = await Promise.all([
        admin
            .from("humor_flavor_steps")
            .select("*")
            .order("humor_flavor_id")
            .order("order_by", { ascending: true })
            .limit(200),
        admin.from("humor_flavors").select("id, slug"),
    ]);

    // Group steps by their humor_flavor_id so we can display them per flavor
    const grouped: Record<string, { flavor_name: string; steps: any[] }> = {};
    for (const step of steps ?? []) {
        const fid = step.humor_flavor_id;
        if (!grouped[fid]) {
            const flavor = flavors?.find((f: any) => f.id === fid);
            grouped[fid] = { flavor_name: flavor?.slug ?? String(fid), steps: [] };
        }
        grouped[fid].steps.push(step);
    }

    return (
        <div>
            <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Humor Flavor Steps</h1>
            <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
                Manage the prompt chain steps for each humor flavor. Use the arrows to reorder.
            </p>

            {error && (
                <p style={{ color: "var(--danger)", marginBottom: "16px" }}>
                    Error: {error.message}
                </p>
            )}

            {/* ── Create Step Form ───────────────────────────── */}
            <section style={cardStyle}>
                <h2 style={{ marginBottom: "16px" }}>Create Step</h2>
                <form action={createStep} style={{ display: "grid", gap: "12px", maxWidth: "600px" }}>
                    <label style={labelStyle}>Humor Flavor</label>
                    <select name="humor_flavor_id" style={inputStyle} required>
                        <option value="">Select flavor...</option>
                        {flavors?.map((f: any) => (
                            <option key={f.id} value={f.id}>{f.slug}</option>
                        ))}
                    </select>

                    <label style={labelStyle}>Order</label>
                    <input name="order_by" type="number" defaultValue="1" style={inputStyle} required />

                    <label style={labelStyle}>System Prompt</label>
                    <textarea name="llm_system_prompt" style={textareaStyle} rows={3} />

                    <label style={labelStyle}>User Prompt</label>
                    <textarea name="llm_user_prompt" style={textareaStyle} rows={3} />

                    <label style={labelStyle}>Description</label>
                    <input name="description" style={inputStyle} />

                    <label style={labelStyle}>LLM Model ID</label>
                    <input name="llm_model_id" type="number" style={inputStyle} required />

                    <label style={labelStyle}>LLM Input Type ID</label>
                    <input name="llm_input_type_id" type="number" style={inputStyle} required />

                    <label style={labelStyle}>LLM Output Type ID</label>
                    <input name="llm_output_type_id" type="number" style={inputStyle} required />

                    <label style={labelStyle}>Humor Flavor Step Type ID</label>
                    <input name="humor_flavor_step_type_id" type="number" style={inputStyle} required />

                    <label style={labelStyle}>LLM Temperature</label>
                    <input name="llm_temperature" type="number" step="0.01" style={inputStyle} />

                    <button type="submit" style={buttonStyle}>Create Step</button>
                </form>
            </section>

            {/* ── Steps grouped by flavor ─────────────────────── */}
            {Object.entries(grouped).map(([fid, group]) => (
                <section key={fid} style={{ ...cardStyle, marginBottom: "24px" }}>
                    <h3 style={{ marginBottom: "12px" }}>
                        Flavor: {group.flavor_name}
                    </h3>

                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Order</th>
                                <th style={thStyle}>System Prompt</th>
                                <th style={thStyle}>User Prompt</th>
                                <th style={thStyle}>Description</th>
                                <th style={thStyle}>Model ID</th>
                                <th style={thStyle}>Reorder</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {group.steps.map((s: any) => (
                                <tr key={s.id}>
                                    <td style={tdStyle}><strong>{s.order_by}</strong></td>
                                    <td style={{ ...tdStyle, maxWidth: "200px" }}>{s.llm_system_prompt ?? "—"}</td>
                                    <td style={{ ...tdStyle, maxWidth: "200px" }}>{s.llm_user_prompt ?? "—"}</td>
                                    <td style={tdStyle}>{s.description ?? "—"}</td>
                                    <td style={tdStyle}>{s.llm_model_id ?? "—"}</td>

                                    {/* Reorder buttons */}
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", gap: "4px" }}>
                                            <form action={reorderStep}>
                                                <input type="hidden" name="id" value={s.id} />
                                                <input type="hidden" name="direction" value="up" />
                                                <input type="hidden" name="humor_flavor_id" value={fid} />
                                                <button type="submit" style={smallButtonStyle}>↑</button>
                                            </form>
                                            <form action={reorderStep}>
                                                <input type="hidden" name="id" value={s.id} />
                                                <input type="hidden" name="direction" value="down" />
                                                <input type="hidden" name="humor_flavor_id" value={fid} />
                                                <button type="submit" style={smallButtonStyle}>↓</button>
                                            </form>
                                        </div>
                                    </td>

                                    <td style={tdStyle}>
                                        <details>
                                            <summary style={{ cursor: "pointer", color: "var(--accent)" }}>Edit</summary>
                                            <form action={updateStep} style={{ display: "grid", gap: "8px", marginTop: "8px", minWidth: "250px" }}>
                                                <input type="hidden" name="id" value={s.id} />
                                                <input name="order_by" type="number" defaultValue={s.order_by} style={inputStyle} />
                                                <textarea name="llm_system_prompt" defaultValue={s.llm_system_prompt ?? ""} placeholder="System prompt" style={textareaStyle} />
                                                <textarea name="llm_user_prompt" defaultValue={s.llm_user_prompt ?? ""} placeholder="User prompt" style={textareaStyle} />
                                                <input name="description" defaultValue={s.description ?? ""} placeholder="Description" style={inputStyle} />
                                                <input name="llm_model_id" type="number" defaultValue={s.llm_model_id ?? ""} placeholder="Model ID" style={inputStyle} />
                                                <input name="llm_temperature" type="number" step="0.01" defaultValue={s.llm_temperature ?? ""} placeholder="Temperature" style={inputStyle} />
                                                <button type="submit" style={buttonStyle}>Update</button>
                                            </form>
                                        </details>
                                        <form action={deleteStep} style={{ marginTop: "8px" }}>
                                            <input type="hidden" name="id" value={s.id} />
                                            <button type="submit" style={dangerButtonStyle}>Delete</button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            ))}

            {Object.keys(grouped).length === 0 && !error && (
                <p>No humor flavor steps found.</p>
            )}
        </div>
    );
}

// ── Style constants ─────────────────────────────────────────

const cardStyle: React.CSSProperties = { border: "1px solid var(--card-border)", borderRadius: "12px", padding: "20px", backgroundColor: "var(--card-bg)", marginBottom: "20px" };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "10px", overflow: "hidden" };
const thStyle: React.CSSProperties = { borderBottom: "1px solid var(--card-border)", textAlign: "left", padding: "10px 14px", fontSize: "12px", fontWeight: 600, color: "var(--muted)", backgroundColor: "var(--table-header-bg)", textTransform: "uppercase" };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid var(--card-border)", textAlign: "left", padding: "10px 14px", fontSize: "13px", verticalAlign: "top" };
const labelStyle: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" };
const inputStyle: React.CSSProperties = { padding: "8px 12px", border: "1px solid var(--input-border)", borderRadius: "6px", backgroundColor: "var(--input-bg)", color: "var(--foreground)", fontSize: "14px" };
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: "60px", resize: "vertical" };
const buttonStyle: React.CSSProperties = { padding: "8px 16px", borderRadius: "6px", border: "none", backgroundColor: "var(--accent)", color: "white", cursor: "pointer", fontSize: "13px" };
const dangerButtonStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: "var(--danger)" };
const smallButtonStyle: React.CSSProperties = { padding: "4px 10px", borderRadius: "4px", border: "1px solid var(--card-border)", backgroundColor: "var(--card-bg)", color: "var(--foreground)", cursor: "pointer", fontSize: "14px" };

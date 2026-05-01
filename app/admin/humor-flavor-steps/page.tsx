import { createServiceClient } from "@/lib/supabase/service";
import { createStep, updateStep, deleteStep, reorderStep } from "./actions";

/**
 * Humor Flavor Steps page — full CRUD + reorder.
 * Newer humor flavors appear at the top.
 */
export default async function HumorFlavorStepsPage() {
    const admin = createServiceClient();

    const [
        { data: steps, error },
        { data: flavors },
        { data: models },
        { data: inputTypes },
        { data: outputTypes },
        { data: stepTypes },
    ] = await Promise.all([
        admin
            .from("humor_flavor_steps")
            .select("*")
            .order("humor_flavor_id", { ascending: false })
            .order("order_by", { ascending: true }),

        admin
            .from("humor_flavors")
            .select("id, slug")
            .order("id", { ascending: false }),

        admin.from("llm_models").select("*").order("id"),
        admin.from("llm_input_types").select("*").order("id"),
        admin.from("llm_output_types").select("*").order("id"),
        admin.from("humor_flavor_step_types").select("*").order("id"),
    ]);

    const flavorGroups =
        flavors?.map((flavor: any) => ({
            flavor_id: flavor.id,
            flavor_name: flavor.slug ?? String(flavor.id),
            steps: (steps ?? [])
                .filter((step: any) => String(step.humor_flavor_id) === String(flavor.id))
                .sort((a: any, b: any) => Number(a.order_by ?? 0) - Number(b.order_by ?? 0)),
        })) ?? [];

    return (
        <div>
            <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>
                Humor Flavor Steps
            </h1>

            <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
                Manage the prompt chain steps for each humor flavor. Use the arrows to reorder.
            </p>

            {error && (
                <p style={{ color: "var(--danger)", marginBottom: "16px" }}>
                    Error: {error.message}
                </p>
            )}

            <section style={cardStyle}>
                <h2 style={{ marginBottom: "16px" }}>Create Step</h2>

                <form
                    action={createStep}
                    style={{ display: "grid", gap: "12px", maxWidth: "720px" }}
                >
                    <label style={labelStyle}>Humor Flavor</label>
                    <select name="humor_flavor_id" style={inputStyle} required>
                        <option value="">Select flavor...</option>
                        {flavors?.map((f: any) => (
                            <option key={f.id} value={f.id}>
                                {f.slug}
                            </option>
                        ))}
                    </select>

                    <label style={labelStyle}>Order</label>
                    <input
                        name="order_by"
                        type="number"
                        defaultValue="1"
                        style={inputStyle}
                        required
                    />

                    <label style={labelStyle}>Description</label>
                    <input
                        name="description"
                        placeholder="e.g., Describe the image"
                        style={inputStyle}
                    />

                    <label style={labelStyle}>Step Type</label>
                    <select name="humor_flavor_step_type_id" style={inputStyle} required>
                        <option value="">Select step type...</option>
                        {stepTypes?.map((t: any) => (
                            <option key={t.id} value={t.id}>
                                {getOptionLabel(t)}
                            </option>
                        ))}
                    </select>

                    <label style={labelStyle}>LLM Model</label>
                    <select name="llm_model_id" style={inputStyle} required>
                        <option value="">Select model...</option>
                        {models?.map((m: any) => (
                            <option key={m.id} value={m.id}>
                                {getOptionLabel(m)}
                            </option>
                        ))}
                    </select>

                    <label style={labelStyle}>Input Type</label>
                    <select name="llm_input_type_id" style={inputStyle} required>
                        <option value="">Select input type...</option>
                        {inputTypes?.map((t: any) => (
                            <option key={t.id} value={t.id}>
                                {getOptionLabel(t)}
                            </option>
                        ))}
                    </select>

                    <label style={labelStyle}>Output Type</label>
                    <select name="llm_output_type_id" style={inputStyle} required>
                        <option value="">Select output type...</option>
                        {outputTypes?.map((t: any) => (
                            <option key={t.id} value={t.id}>
                                {getOptionLabel(t)}
                            </option>
                        ))}
                    </select>

                    <label style={labelStyle}>Temperature</label>
                    <input
                        name="llm_temperature"
                        type="number"
                        step="0.01"
                        defaultValue="0.7"
                        style={inputStyle}
                    />

                    <label style={labelStyle}>System Prompt</label>
                    <textarea
                        name="llm_system_prompt"
                        placeholder="Enter the system prompt..."
                        style={textareaStyle}
                        rows={4}
                    />

                    <label style={labelStyle}>User Prompt</label>
                    <textarea
                        name="llm_user_prompt"
                        placeholder="Enter the user prompt template..."
                        style={textareaStyle}
                        rows={4}
                    />

                    <button type="submit" style={buttonStyle}>
                        Create Step
                    </button>
                </form>
            </section>

            {flavorGroups.map((group: any) => (
                <section
                    key={group.flavor_id}
                    style={{ ...cardStyle, marginBottom: "24px" }}
                >
                    <h3 style={{ marginBottom: "12px" }}>
                        Flavor: {group.flavor_name}
                    </h3>

                    <table style={tableStyle}>
                        <thead>
                        <tr>
                            <th style={thStyle}>Order</th>
                            <th style={thStyle}>Description</th>
                            <th style={thStyle}>Step Type</th>
                            <th style={thStyle}>LLM Model</th>
                            <th style={thStyle}>Input</th>
                            <th style={thStyle}>Output</th>
                            <th style={thStyle}>Reorder</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {group.steps.length === 0 && (
                            <tr>
                                <td style={tdStyle} colSpan={8}>
                                    No steps yet for this flavor.
                                </td>
                            </tr>
                        )}

                        {group.steps.map((s: any) => (
                            <tr key={s.id}>
                                <td style={tdStyle}>
                                    <strong>{s.order_by}</strong>
                                </td>

                                <td style={tdStyle}>
                                    {s.description ?? "—"}
                                </td>

                                <td style={tdStyle}>
                                    {getOptionLabelById(
                                        stepTypes,
                                        s.humor_flavor_step_type_id
                                    )}
                                </td>

                                <td style={tdStyle}>
                                    {getOptionLabelById(models, s.llm_model_id)}
                                </td>

                                <td style={tdStyle}>
                                    {getOptionLabelById(
                                        inputTypes,
                                        s.llm_input_type_id
                                    )}
                                </td>

                                <td style={tdStyle}>
                                    {getOptionLabelById(
                                        outputTypes,
                                        s.llm_output_type_id
                                    )}
                                </td>

                                <td style={tdStyle}>
                                    <div style={{ display: "flex", gap: "4px" }}>
                                        <form action={reorderStep}>
                                            <input type="hidden" name="id" value={s.id} />
                                            <input
                                                type="hidden"
                                                name="direction"
                                                value="up"
                                            />
                                            <input
                                                type="hidden"
                                                name="humor_flavor_id"
                                                value={group.flavor_id}
                                            />
                                            <button type="submit" style={smallButtonStyle}>
                                                ↑
                                            </button>
                                        </form>

                                        <form action={reorderStep}>
                                            <input type="hidden" name="id" value={s.id} />
                                            <input
                                                type="hidden"
                                                name="direction"
                                                value="down"
                                            />
                                            <input
                                                type="hidden"
                                                name="humor_flavor_id"
                                                value={group.flavor_id}
                                            />
                                            <button type="submit" style={smallButtonStyle}>
                                                ↓
                                            </button>
                                        </form>
                                    </div>
                                </td>

                                <td style={tdStyle}>
                                    <details>
                                        <summary
                                            style={{
                                                cursor: "pointer",
                                                color: "var(--accent)",
                                            }}
                                        >
                                            Edit
                                        </summary>

                                        <form
                                            action={updateStep}
                                            style={{
                                                display: "grid",
                                                gap: "8px",
                                                marginTop: "8px",
                                                minWidth: "320px",
                                            }}
                                        >
                                            <input type="hidden" name="id" value={s.id} />

                                            <label style={labelStyle}>Order</label>
                                            <input
                                                name="order_by"
                                                type="number"
                                                defaultValue={s.order_by}
                                                style={inputStyle}
                                            />

                                            <label style={labelStyle}>Description</label>
                                            <input
                                                name="description"
                                                defaultValue={s.description ?? ""}
                                                style={inputStyle}
                                            />

                                            <label style={labelStyle}>Step Type</label>
                                            <select
                                                name="humor_flavor_step_type_id"
                                                defaultValue={
                                                    s.humor_flavor_step_type_id ?? ""
                                                }
                                                style={inputStyle}
                                            >
                                                <option value="">Select step type...</option>
                                                {stepTypes?.map((t: any) => (
                                                    <option key={t.id} value={t.id}>
                                                        {getOptionLabel(t)}
                                                    </option>
                                                ))}
                                            </select>

                                            <label style={labelStyle}>LLM Model</label>
                                            <select
                                                name="llm_model_id"
                                                defaultValue={s.llm_model_id ?? ""}
                                                style={inputStyle}
                                            >
                                                <option value="">Select model...</option>
                                                {models?.map((m: any) => (
                                                    <option key={m.id} value={m.id}>
                                                        {getOptionLabel(m)}
                                                    </option>
                                                ))}
                                            </select>

                                            <label style={labelStyle}>Input Type</label>
                                            <select
                                                name="llm_input_type_id"
                                                defaultValue={s.llm_input_type_id ?? ""}
                                                style={inputStyle}
                                            >
                                                <option value="">Select input type...</option>
                                                {inputTypes?.map((t: any) => (
                                                    <option key={t.id} value={t.id}>
                                                        {getOptionLabel(t)}
                                                    </option>
                                                ))}
                                            </select>

                                            <label style={labelStyle}>Output Type</label>
                                            <select
                                                name="llm_output_type_id"
                                                defaultValue={s.llm_output_type_id ?? ""}
                                                style={inputStyle}
                                            >
                                                <option value="">Select output type...</option>
                                                {outputTypes?.map((t: any) => (
                                                    <option key={t.id} value={t.id}>
                                                        {getOptionLabel(t)}
                                                    </option>
                                                ))}
                                            </select>

                                            <label style={labelStyle}>Temperature</label>
                                            <input
                                                name="llm_temperature"
                                                type="number"
                                                step="0.01"
                                                defaultValue={s.llm_temperature ?? ""}
                                                style={inputStyle}
                                            />

                                            <label style={labelStyle}>System Prompt</label>
                                            <textarea
                                                name="llm_system_prompt"
                                                defaultValue={s.llm_system_prompt ?? ""}
                                                style={textareaStyle}
                                            />

                                            <label style={labelStyle}>User Prompt</label>
                                            <textarea
                                                name="llm_user_prompt"
                                                defaultValue={s.llm_user_prompt ?? ""}
                                                style={textareaStyle}
                                            />

                                            <button type="submit" style={buttonStyle}>
                                                Update
                                            </button>
                                        </form>
                                    </details>

                                    <form action={deleteStep} style={{ marginTop: "8px" }}>
                                        <input type="hidden" name="id" value={s.id} />
                                        <button type="submit" style={dangerButtonStyle}>
                                            Delete
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </section>
            ))}

            {flavorGroups.length === 0 && !error && (
                <p>No humor flavors found.</p>
            )}
        </div>
    );
}

function getOptionLabel(item: any) {
    if (!item) return "—";

    return (
        item.name ??
        item.slug ??
        item.label ??
        item.title ??
        item.value ??
        item.type ??
        String(item.id)
    );
}

function getOptionLabelById(items: any[] | null | undefined, id: any) {
    const found = items?.find((item: any) => String(item.id) === String(id));

    if (!found) {
        return id ? String(id) : "—";
    }

    return getOptionLabel(found);
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
    minHeight: "80px",
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

const smallButtonStyle: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: "4px",
    border: "1px solid var(--card-border)",
    backgroundColor: "var(--card-bg)",
    color: "var(--foreground)",
    cursor: "pointer",
    fontSize: "14px",
};
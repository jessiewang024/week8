"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Generate Captions page — Week 8 feature.
 * This page lets admins test a humor flavor by:
 *   1. Selecting a humor flavor from the dropdown
 *   2. Picking one or more test images
 *   3. Calling the REST API (api.almostcrackd.ai) to generate captions
 *   4. Displaying the results inline
 *
 * This is a client component because it uses state and makes
 * fetch calls from the browser.
 */

type HumorFlavor = { id: string; slug: string };
type ImageRow = { id: string; url: string; image_description: string | null };

export default function GenerateCaptionsPage() {
    const [flavors, setFlavors] = useState<HumorFlavor[]>([]);
    const [images, setImages] = useState<ImageRow[]>([]);
    const [selectedFlavor, setSelectedFlavor] = useState("");
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [results, setResults] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Load flavors and images on mount
    useEffect(() => {
        const supabase = createClient();
        Promise.all([
            supabase.from("humor_flavors").select("id, slug"),
            supabase.from("images").select("id, url, image_description").limit(50),
        ]).then(([flavorsRes, imagesRes]) => {
            if (flavorsRes.data) setFlavors(flavorsRes.data);
            if (imagesRes.data) setImages(imagesRes.data);
        });
    }, []);

    // Toggle an image selection on/off
    const toggleImage = (id: string) => {
        setSelectedImages((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    // Call the REST API to generate captions for each selected image
    const generateCaptions = async () => {
        if (!selectedFlavor) {
            setError("Please select a humor flavor.");
            return;
        }
        if (selectedImages.length === 0) {
            setError("Please select at least one image.");
            return;
        }

        setLoading(true);
        setError("");
        setResults({});

        // Process each image one at a time
        for (const imageId of selectedImages) {
            try {
                const res = await fetch(
                    `https://api.almostcrackd.ai/captions/generate`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            image_id: imageId,
                            humor_flavor_id: selectedFlavor,
                        }),
                    }
                );

                if (!res.ok) {
                    const text = await res.text();
                    setResults((prev) => ({
                        ...prev,
                        [imageId]: `Error: ${res.status} - ${text}`,
                    }));
                } else {
                    const data = await res.json();
                    // Try to extract captions from the response
                    const caption =
                        data.captions?.join("\n") ??
                        data.caption ??
                        data.result ??
                        JSON.stringify(data, null, 2);
                    setResults((prev) => ({ ...prev, [imageId]: caption }));
                }
            } catch (err: any) {
                setResults((prev) => ({
                    ...prev,
                    [imageId]: `Error: ${err.message}`,
                }));
            }
        }

        setLoading(false);
    };

    return (
        <div>
            <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Generate Captions</h1>
            <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
                Test a humor flavor by generating captions using the REST API (api.almostcrackd.ai).
            </p>

            {error && (
                <p style={{ color: "var(--danger)", marginBottom: "16px" }}>{error}</p>
            )}

            {/* ── Configuration ──────────────────────────────── */}
            <section style={cardStyle}>
                <h2 style={{ marginBottom: "16px" }}>Configuration</h2>

                {/* Humor flavor dropdown */}
                <label style={labelStyle}>Humor Flavor</label>
                <select
                    style={{ ...inputStyle, marginBottom: "16px" }}
                    value={selectedFlavor}
                    onChange={(e) => setSelectedFlavor(e.target.value)}
                >
                    <option value="">Select a flavor...</option>
                    {flavors.map((f) => (
                        <option key={f.id} value={f.id}>{f.slug}</option>
                    ))}
                </select>

                {/* Image selection grid — click to toggle */}
                <label style={labelStyle}>
                    Select Test Images ({selectedImages.length} selected)
                </label>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                        gap: "8px",
                        marginTop: "8px",
                        marginBottom: "16px",
                    }}
                >
                    {images.map((img) => (
                        <div
                            key={img.id}
                            onClick={() => toggleImage(img.id)}
                            style={{
                                border: selectedImages.includes(img.id)
                                    ? "2px solid var(--accent)"
                                    : "1px solid var(--card-border)",
                                borderRadius: "8px",
                                padding: "8px",
                                cursor: "pointer",
                                backgroundColor: selectedImages.includes(img.id)
                                    ? "var(--table-row-hover)"
                                    : "var(--card-bg)",
                            }}
                        >
                            {img.url && (
                                <img
                                    src={img.url}
                                    alt={img.image_description || "Image"}
                                    style={{
                                        width: "100%",
                                        height: "100px",
                                        objectFit: "cover",
                                        borderRadius: "4px",
                                    }}
                                />
                            )}
                            <div style={{ fontSize: "11px", marginTop: "4px", color: "var(--muted)" }}>
                                {img.image_description ?? img.id.slice(0, 8)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Generate button */}
                <button
                    style={{
                        ...buttonStyle,
                        opacity: loading ? 0.6 : 1,
                    }}
                    onClick={generateCaptions}
                    disabled={loading}
                >
                    {loading ? "Generating..." : "Generate Captions"}
                </button>
            </section>

            {/* ── Results ────────────────────────────────────── */}
            {Object.keys(results).length > 0 && (
                <section style={cardStyle}>
                    <h2 style={{ marginBottom: "16px" }}>Results</h2>

                    {Object.entries(results).map(([imageId, result]) => {
                        const img = images.find((i) => i.id === imageId);
                        return (
                            <div
                                key={imageId}
                                style={{
                                    border: "1px solid var(--card-border)",
                                    borderRadius: "8px",
                                    padding: "12px",
                                    marginBottom: "12px",
                                    display: "flex",
                                    gap: "16px",
                                }}
                            >
                                {img?.url && (
                                    <img
                                        src={img.url}
                                        alt="Test image"
                                        style={{
                                            width: "80px",
                                            height: "80px",
                                            objectFit: "cover",
                                            borderRadius: "6px",
                                        }}
                                    />
                                )}
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>
                                        Image: {imageId}
                                    </p>
                                    <pre
                                        style={{
                                            whiteSpace: "pre-wrap",
                                            wordBreak: "break-word",
                                            fontSize: "13px",
                                            backgroundColor: "var(--table-header-bg)",
                                            padding: "12px",
                                            borderRadius: "6px",
                                            margin: 0,
                                        }}
                                    >
                                        {result}
                                    </pre>
                                </div>
                            </div>
                        );
                    })}
                </section>
            )}
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

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--muted)",
    textTransform: "uppercase",
    marginBottom: "4px",
};

const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    maxWidth: "400px",
    padding: "8px 12px",
    border: "1px solid var(--input-border)",
    borderRadius: "6px",
    backgroundColor: "var(--input-bg)",
    color: "var(--foreground)",
    fontSize: "14px",
};

const buttonStyle: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "var(--accent)",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
};

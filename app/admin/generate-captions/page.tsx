"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Generate Captions page.
 * Admins can test a humor flavor by selecting images and calling
 * the REST API at api.almostcrackd.ai.
 */

type HumorFlavor = {
    id: string;
    slug: string;
};

type ImageRow = {
    id: string;
    url: string;
    image_description: string | null;
};

export default function GenerateCaptionsPage() {
    const [flavors, setFlavors] = useState<HumorFlavor[]>([]);
    const [images, setImages] = useState<ImageRow[]>([]);
    const [selectedFlavor, setSelectedFlavor] = useState("");
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [results, setResults] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const supabase = createClient();

        Promise.all([
            supabase
                .from("humor_flavors")
                .select("id, slug")
                .order("id", { ascending: false }),

            supabase
                .from("images")
                .select("id, url, image_description")
                .limit(50),
        ]).then(([flavorsRes, imagesRes]) => {
            if (flavorsRes.error) {
                setError(flavorsRes.error.message);
            }

            if (imagesRes.error) {
                setError(imagesRes.error.message);
            }

            if (flavorsRes.data) {
                setFlavors(flavorsRes.data);
            }

            if (imagesRes.data) {
                setImages(imagesRes.data);
            }
        });
    }, []);

    const toggleImage = (id: string) => {
        setSelectedImages((prev) =>
            prev.includes(id)
                ? prev.filter((imageId) => imageId !== id)
                : [...prev, id]
        );
    };

    const extractCaptionText = (data: any) => {
        if (Array.isArray(data?.captions)) {
            return data.captions.join("\n");
        }

        if (Array.isArray(data?.caption)) {
            return data.caption.join("\n");
        }

        if (typeof data?.captions === "string") {
            return data.captions;
        }

        if (typeof data?.caption === "string") {
            return data.caption;
        }

        if (typeof data?.result === "string") {
            return data.result;
        }

        if (Array.isArray(data?.result)) {
            return data.result.join("\n");
        }

        return JSON.stringify(data, null, 2);
    };

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

        for (const imageId of selectedImages) {
            try {
                const url = new URL("https://api.almostcrackd.ai/captions/generate");

                url.searchParams.set("image_id", imageId);
                url.searchParams.set("humor_flavor_id", selectedFlavor);

                const res = await fetch("https://api.almostcrackd.ai/caption_requests", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        image_id: imageId,
                        humor_flavor_id: selectedFlavor,
                        caption_count: 5,
                    }),
                });

                const text = await res.text();

                if (!res.ok) {
                    setResults((prev) => ({
                        ...prev,
                        [imageId]: `Error: ${res.status} - ${text}`,
                    }));
                    continue;
                }

                let data: any;

                try {
                    data = JSON.parse(text);
                } catch {
                    data = text;
                }

                const caption =
                    typeof data === "string" ? data : extractCaptionText(data);

                setResults((prev) => ({
                    ...prev,
                    [imageId]: caption,
                }));
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
            <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>
                Generate Captions
            </h1>

            <p style={{ color: "var(--muted)", marginBottom: "20px" }}>
                Test a humor flavor by generating captions using the REST API.
            </p>

            {error && (
                <p style={{ color: "var(--danger)", marginBottom: "16px" }}>
                    {error}
                </p>
            )}

            <section style={cardStyle}>
                <h2 style={{ marginBottom: "16px" }}>Configuration</h2>

                <label style={labelStyle}>Humor Flavor</label>
                <select
                    style={{ ...inputStyle, marginBottom: "16px" }}
                    value={selectedFlavor}
                    onChange={(e) => setSelectedFlavor(e.target.value)}
                >
                    <option value="">Select a flavor...</option>
                    {flavors.map((flavor) => (
                        <option key={flavor.id} value={flavor.id}>
                            {flavor.slug}
                        </option>
                    ))}
                </select>

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
                    {images.map((image) => {
                        const isSelected = selectedImages.includes(image.id);

                        return (
                            <div
                                key={image.id}
                                onClick={() => toggleImage(image.id)}
                                style={{
                                    border: isSelected
                                        ? "2px solid var(--accent)"
                                        : "1px solid var(--card-border)",
                                    borderRadius: "8px",
                                    padding: "8px",
                                    cursor: "pointer",
                                    backgroundColor: isSelected
                                        ? "var(--table-row-hover)"
                                        : "var(--card-bg)",
                                }}
                            >
                                {image.url && (
                                    <img
                                        src={image.url}
                                        alt={image.image_description || "Test image"}
                                        style={{
                                            width: "100%",
                                            height: "100px",
                                            objectFit: "cover",
                                            borderRadius: "4px",
                                        }}
                                    />
                                )}

                                <div
                                    style={{
                                        fontSize: "11px",
                                        marginTop: "4px",
                                        color: "var(--muted)",
                                    }}
                                >
                                    {image.image_description ?? image.id.slice(0, 8)}
                                </div>
                            </div>
                        );
                    })}
                </div>

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

            {Object.keys(results).length > 0 && (
                <section style={cardStyle}>
                    <h2 style={{ marginBottom: "16px" }}>Results</h2>

                    {Object.entries(results).map(([imageId, result]) => {
                        const image = images.find((img) => img.id === imageId);

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
                                {image?.url && (
                                    <img
                                        src={image.url}
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
                                    <p
                                        style={{
                                            fontSize: "11px",
                                            color: "var(--muted)",
                                            marginBottom: "4px",
                                        }}
                                    >
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
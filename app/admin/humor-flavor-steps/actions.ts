"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserId } from "@/lib/current-user";

function emptyToNull(value: FormDataEntryValue | null) {
    const text = String(value ?? "").trim();
    return text === "" ? null : text;
}

function toNumberOrNull(value: FormDataEntryValue | null) {
    const text = String(value ?? "").trim();
    if (text === "") return null;
    const num = Number(text);
    return isNaN(num) ? null : num;
}

export async function createStep(formData: FormData) {
    const admin = createServiceClient();
    const userId = await getCurrentUserId();

    const { error } = await admin.from("humor_flavor_steps").insert({
        humor_flavor_id: Number(formData.get("humor_flavor_id")),
        order_by: Number(formData.get("order_by")),
        llm_system_prompt: emptyToNull(formData.get("llm_system_prompt")),
        llm_user_prompt: emptyToNull(formData.get("llm_user_prompt")),
        description: emptyToNull(formData.get("description")),
        llm_model_id: Number(formData.get("llm_model_id")),
        llm_input_type_id: Number(formData.get("llm_input_type_id")),
        llm_output_type_id: Number(formData.get("llm_output_type_id")),
        humor_flavor_step_type_id: Number(formData.get("humor_flavor_step_type_id")),
        llm_temperature: toNumberOrNull(formData.get("llm_temperature")),
        created_by_user_id: userId,
        modified_by_user_id: userId,
    });

    if (error) throw new Error(error.message);
    revalidatePath("/admin/humor-flavor-steps");
    revalidatePath("/admin");
}

export async function updateStep(formData: FormData) {
    const admin = createServiceClient();
    const userId = await getCurrentUserId();
    const id = Number(formData.get("id"));

    const { error } = await admin.from("humor_flavor_steps").update({
        order_by: Number(formData.get("order_by")),
        llm_system_prompt: emptyToNull(formData.get("llm_system_prompt")),
        llm_user_prompt: emptyToNull(formData.get("llm_user_prompt")),
        description: emptyToNull(formData.get("description")),
        llm_model_id: toNumberOrNull(formData.get("llm_model_id")),
        llm_temperature: toNumberOrNull(formData.get("llm_temperature")),
        modified_by_user_id: userId,
    }).eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/humor-flavor-steps");
}

export async function deleteStep(formData: FormData) {
    const admin = createServiceClient();
    const id = Number(formData.get("id"));

    const { error } = await admin.from("humor_flavor_steps").delete().eq("id", id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/humor-flavor-steps");
    revalidatePath("/admin");
}

export async function reorderStep(formData: FormData) {
    const admin = createServiceClient();
    const id = Number(formData.get("id"));
    const direction = String(formData.get("direction"));
    const humorFlavorId = Number(formData.get("humor_flavor_id"));

    const { data: steps, error: fetchError } = await admin
        .from("humor_flavor_steps")
        .select("id, order_by")
        .eq("humor_flavor_id", humorFlavorId)
        .order("order_by", { ascending: true });

    if (fetchError || !steps) throw new Error(fetchError?.message ?? "Failed to fetch steps");

    const currentIndex = steps.findIndex((s) => s.id === id);
    if (currentIndex === -1) return;

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= steps.length) return;

    const currentOrder = steps[currentIndex].order_by;
    const swapOrder = steps[swapIndex].order_by;

    await Promise.all([
        admin.from("humor_flavor_steps").update({ order_by: swapOrder }).eq("id", steps[currentIndex].id),
        admin.from("humor_flavor_steps").update({ order_by: currentOrder }).eq("id", steps[swapIndex].id),
    ]);

    revalidatePath("/admin/humor-flavor-steps");
}

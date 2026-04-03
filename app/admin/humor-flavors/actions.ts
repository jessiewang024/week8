"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserId } from "@/lib/current-user";

function emptyToNull(value: FormDataEntryValue | null) {
    const text = String(value ?? "").trim();
    return text === "" ? null : text;
}

export async function createHumorFlavor(formData: FormData) {
    const admin = createServiceClient();
    const userId = await getCurrentUserId();

    const { error } = await admin.from("humor_flavors").insert({
        slug: String(formData.get("slug") || "").trim(),
        description: emptyToNull(formData.get("description")),
        created_by_user_id: userId,
        modified_by_user_id: userId,
    });

    if (error) throw new Error(error.message);

    revalidatePath("/admin/humor-flavors");
    revalidatePath("/admin");
}

export async function updateHumorFlavor(formData: FormData) {
    const admin = createServiceClient();
    const userId = await getCurrentUserId();
    const id = String(formData.get("id")).trim();

    const { error } = await admin.from("humor_flavors").update({
        slug: String(formData.get("slug") || "").trim(),
        description: emptyToNull(formData.get("description")),
        modified_by_user_id: userId,
    }).eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/admin/humor-flavors");
    revalidatePath("/admin");
}

export async function deleteHumorFlavor(formData: FormData) {
    const admin = createServiceClient();
    const id = String(formData.get("id")).trim();

    const { error } = await admin.from("humor_flavors").delete().eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/admin/humor-flavors");
    revalidatePath("/admin");
}

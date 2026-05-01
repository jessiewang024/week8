"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserId } from "@/lib/current-user";

function emptyToNull(value: FormDataEntryValue | null) {
    const text = String(value ?? "").trim();
    return text === "" ? null : text;
}

function getRequiredText(value: FormDataEntryValue | null, fieldName: string) {
    const text = String(value ?? "").trim();

    if (!text) {
        throw new Error(`${fieldName} is required.`);
    }

    return text;
}

export async function createFlavor(formData: FormData) {
    const admin = createServiceClient();
    const userId = await getCurrentUserId();

    const slug = getRequiredText(formData.get("slug"), "Flavor name");
    const description = emptyToNull(formData.get("description"));

    const { data: existingFlavor, error: existingError } = await admin
        .from("humor_flavors")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

    if (existingError) {
        throw new Error(existingError.message);
    }

    if (existingFlavor) {
        throw new Error("A humor flavor with this name already exists.");
    }

    const { error } = await admin.from("humor_flavors").insert({
        slug,
        description,
        created_by_user_id: userId,
        modified_by_user_id: userId,
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/humor-flavors");
    revalidatePath("/admin/humor-flavor-steps");
    revalidatePath("/admin");
}

export async function updateFlavor(formData: FormData) {
    const admin = createServiceClient();
    const userId = await getCurrentUserId();

    const id = Number(formData.get("id"));
    const slug = getRequiredText(formData.get("slug"), "Flavor name");
    const description = emptyToNull(formData.get("description"));

    if (!id) {
        throw new Error("Missing humor flavor id.");
    }

    const { data: existingFlavor, error: existingError } = await admin
        .from("humor_flavors")
        .select("id")
        .eq("slug", slug)
        .neq("id", id)
        .maybeSingle();

    if (existingError) {
        throw new Error(existingError.message);
    }

    if (existingFlavor) {
        throw new Error("Another humor flavor with this name already exists.");
    }

    const { error } = await admin
        .from("humor_flavors")
        .update({
            slug,
            description,
            modified_by_user_id: userId,
        })
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/humor-flavors");
    revalidatePath("/admin/humor-flavor-steps");
    revalidatePath("/admin");
}

export async function deleteFlavor(formData: FormData) {
    const admin = createServiceClient();

    const id = Number(formData.get("id"));

    if (!id) {
        throw new Error("Missing humor flavor id.");
    }

    const { error: stepsError } = await admin
        .from("humor_flavor_steps")
        .delete()
        .eq("humor_flavor_id", id);

    if (stepsError) {
        throw new Error(stepsError.message);
    }

    const { error } = await admin
        .from("humor_flavors")
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/admin/humor-flavors");
    revalidatePath("/admin/humor-flavor-steps");
    revalidatePath("/admin");
}

export async function duplicateHumorFlavor(formData: FormData) {
    const admin = createServiceClient();
    const userId = await getCurrentUserId();

    const sourceFlavorId = Number(formData.get("id"));
    const newSlug = getRequiredText(formData.get("new_slug"), "New flavor name");

    if (!sourceFlavorId) {
        throw new Error("Missing source humor flavor id.");
    }

    const { data: existingFlavor, error: existingError } = await admin
        .from("humor_flavors")
        .select("id")
        .eq("slug", newSlug)
        .maybeSingle();

    if (existingError) {
        throw new Error(existingError.message);
    }

    if (existingFlavor) {
        throw new Error("A humor flavor with this name already exists. Please choose a unique name.");
    }

    const { data: sourceFlavor, error: sourceFlavorError } = await admin
        .from("humor_flavors")
        .select("*")
        .eq("id", sourceFlavorId)
        .single();

    if (sourceFlavorError || !sourceFlavor) {
        throw new Error(sourceFlavorError?.message ?? "Original humor flavor not found.");
    }

    const { data: newFlavor, error: createFlavorError } = await admin
        .from("humor_flavors")
        .insert({
            slug: newSlug,
            description: sourceFlavor.description ?? null,
            created_by_user_id: userId,
            modified_by_user_id: userId,
        })
        .select("id")
        .single();

    if (createFlavorError || !newFlavor) {
        throw new Error(createFlavorError?.message ?? "Failed to duplicate humor flavor.");
    }

    const { data: sourceSteps, error: sourceStepsError } = await admin
        .from("humor_flavor_steps")
        .select("*")
        .eq("humor_flavor_id", sourceFlavorId)
        .order("order_by", { ascending: true });

    if (sourceStepsError) {
        throw new Error(sourceStepsError.message);
    }

    if (sourceSteps && sourceSteps.length > 0) {
        const duplicatedSteps = sourceSteps.map((step: any) => ({
            humor_flavor_id: newFlavor.id,
            order_by: step.order_by,
            llm_system_prompt: step.llm_system_prompt ?? null,
            llm_user_prompt: step.llm_user_prompt ?? null,
            description: step.description ?? null,
            llm_model_id: step.llm_model_id ?? null,
            llm_input_type_id: step.llm_input_type_id ?? null,
            llm_output_type_id: step.llm_output_type_id ?? null,
            humor_flavor_step_type_id: step.humor_flavor_step_type_id ?? null,
            llm_temperature: step.llm_temperature ?? null,
            created_by_user_id: userId,
            modified_by_user_id: userId,
        }));

        const { error: duplicateStepsError } = await admin
            .from("humor_flavor_steps")
            .insert(duplicatedSteps);

        if (duplicateStepsError) {
            throw new Error(duplicateStepsError.message);
        }
    }

    revalidatePath("/admin/humor-flavors");
    revalidatePath("/admin/humor-flavor-steps");
    revalidatePath("/admin");
}
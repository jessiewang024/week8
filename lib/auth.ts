import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * requireAdmin() — used by the admin layout to protect all /admin routes.
 *
 * This function checks two things:
 *   1. Is the user logged in? If not, redirect to /login.
 *   2. Is the user a superadmin OR matrix admin? If not, redirect to /not-authorized.
 *
 * Week 8 requires that both is_superadmin and is_matrix_admin users can access
 * the admin area, so we check for either one.
 */
export async function requireAdmin() {
    const supabase = await createClient();

    // Check if the user is logged in
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Look up the user's profile to check admin status
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, is_superadmin, is_matrix_admin")
        .eq("id", user.id)
        .single();

    // If profile lookup failed or user is not an admin, deny access
    if (error || (!profile?.is_superadmin && !profile?.is_matrix_admin)) {
        redirect("/not-authorized");
    }

    return { user, profile };
}

/**
 * requireSuperadmin() — stricter version that only allows superadmins.
 * Currently not used in the layout, but available if needed for
 * specific routes that should be superadmin-only.
 */
export async function requireSuperadmin() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, is_superadmin")
        .eq("id", user.id)
        .single();

    if (error || !profile?.is_superadmin) {
        redirect("/not-authorized");
    }

    return { user, profile };
}

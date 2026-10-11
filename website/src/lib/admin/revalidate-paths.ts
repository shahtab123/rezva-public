import { revalidatePath } from "next/cache";
import type { AdminApplication } from "@/lib/admin/types";
import { applicationListHref } from "@/lib/admin/application-review";

export function revalidateApplicationPaths(
  id?: string,
  kind?: AdminApplication["kind"],
) {
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/applications/businesses");
  revalidatePath("/admin/applications/businesses/pending");
  revalidatePath("/admin/applications/providers");
  revalidatePath("/admin/applications/providers/pending");
  if (kind) {
    revalidatePath(applicationListHref(kind));
    revalidatePath(`${applicationListHref(kind)}/pending`);
  }
  if (id) {
    revalidatePath(`/admin/applications/${id}`);
  }
}

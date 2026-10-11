import { redirect } from "next/navigation";

export default function Page() {
  redirect("/admin/registry/name-reviews?status=verified");
}

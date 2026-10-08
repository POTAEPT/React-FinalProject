import { redirect } from "next/navigation";

export default async function DiscoverPage({ searchParams }) {
  const params = await searchParams;
  const category = typeof params?.category === "string" ? params.category : "";
  redirect(category ? `/?category=${encodeURIComponent(category)}` : "/");
}
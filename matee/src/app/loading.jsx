import { PartyFeedSkeleton } from "@/components/party-card-skeleton";

// Shown while any route without its own loading.jsx streams in.
export default function Loading() {
  return <PartyFeedSkeleton />;
}

import { BuilderShell } from "@/components/layout/builder-shell";
import { ItineraryProvider } from "@/store/itinerary-store";

export default function Home() {
  return (
    <ItineraryProvider>
      <BuilderShell />
    </ItineraryProvider>
  );
}

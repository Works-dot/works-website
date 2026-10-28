import { useEffect } from "react";
import { trackContactLinkClick } from "@/lib/interaction-tracking";

export function InteractionTracking() {
  useEffect(() => {
    document.addEventListener("click", trackContactLinkClick);
    return () => document.removeEventListener("click", trackContactLinkClick);
  }, []);
  return null;
}

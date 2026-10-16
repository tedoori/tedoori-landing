import { permanentRedirect } from "next/navigation";

export default function JournalRedirect() {
  permanentRedirect("/blog");
}

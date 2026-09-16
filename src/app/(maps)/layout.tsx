import type { ReactNode } from "react";
import BotModal from "@/components/bot/botmodal";

export default function MapsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <BotModal />
    </>
  );
}

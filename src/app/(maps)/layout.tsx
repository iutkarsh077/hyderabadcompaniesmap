import type { ReactNode } from "react";
import BotModal from "@/components/bot/botmodal";
import AddStreak from "@/components/AddStreak";

export default function MapsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <BotModal />
    </>
  );
}

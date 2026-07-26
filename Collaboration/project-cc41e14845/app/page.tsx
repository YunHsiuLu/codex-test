import type { Metadata } from "next";
import { BulletinBoard } from "./BulletinBoard";

export const metadata: Metadata = {
  title: "建功班務｜班級佈告板",
  description: "班級公告、已讀確認與行事提醒。",
};

export default function Home() {
  return <BulletinBoard />;
}

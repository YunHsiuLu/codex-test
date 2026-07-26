import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "建功班務｜班級佈告板",
  description: "班級公告、已讀確認與行事提醒。",
};

export const viewport: Viewport = { themeColor: "#f7f8fc" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}

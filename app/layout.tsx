import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "陈贞里 — Personal Voice Twin",
  description: "一个基于工作、研究与兴趣构建的 AI counterpart。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

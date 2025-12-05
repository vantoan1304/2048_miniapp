// src/app/layout.tsx
import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

export const metadata: Metadata = {
  title: "Game 2048",
  description: "Play game 2048",
  other: {
    "fc:miniapp": `{
      "version": "1",
      "imageUrl": "https://2048-miniapp-three.vercel.app/gm.png",
      "button": {
        "title": "Open Game2048",
        "action": {
          "type": "launch_frame",
          "name": "Game2048",
          "url": "https://2048-miniapp-three.vercel.app/",
          "splashImageUrl": "https://2048-miniapp-three.vercel.app/gm.png",
          "splashBackgroundColor": "#000000"
        }
      }
    }`
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

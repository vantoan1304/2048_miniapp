// src/app/layout.tsx
import { Providers } from "./providers";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

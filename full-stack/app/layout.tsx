import type { Metadata, Viewport } from "next";
import "./globals.css";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
export const metadata: Metadata = {
  title: {
    default: "Banashree silk and sarees | Bangalore",
    template: "%s | Banashree silk and sarees",
  },
  description:
    "Explore silk, Kanjivaram, Banarasi, cotton and occasion sarees at Banashree, Bangalore. Shipping across India. Sample catalogue in test mode.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN">
      <head>
        <link
          rel="preload"
          href="/fonts/PlayfairDisplay-Bold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

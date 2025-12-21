import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import Aurora from "@/components/Aurora";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Script from "next/script";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = DM_Serif_Display({ variable: "--font-display", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Jahrbuch – Schulzentrum Oberes Elztal",
    description: "Gemacht vom Jahrbuch-Team der SMV",
};

export const viewport: Viewport = {
    themeColor: "#1a1714",
    colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    // html bekommt direkt "dark", damit der erste SSR-Paint schon dunkel ist
    const initialHtmlClass = "scroll-smooth noise dark";
    return (
        <html
            lang="de"
            className={initialHtmlClass}
            suppressHydrationWarning
            style={{ colorScheme: "dark" }}
        >
        <head>
            {/* **Meta**: dunkles Farbschema überall */}
            <meta name="color-scheme" content="dark" />
            <meta name="supported-color-schemes" content="dark" />
            <meta name="theme-color" content="#1a1714" />

            {/* **Early apply**: läuft VOR erstem Paint in allen Browsern */}
            <Script id="force-dark" strategy="beforeInteractive">
                {`
            (function () {
              try {
                var d = document.documentElement;
                if (!d.classList.contains('dark')) d.classList.add('dark');
                d.style.colorScheme = 'dark';
                // Optionale Persistenz (falls du mal einen Toggle einbaust)
                document.cookie = 'jahrbuch-theme=dark;path=/;max-age=31536000';
                try { localStorage.setItem('jahrbuch-theme','dark'); } catch {}
              } catch {}
            })();
          `}
            </Script>
        </head>
        <body
            className={[
                geistSans.variable,
                geistMono.variable,
                display.variable,
                "antialiased min-h-dvh text-[#f5f1ed]",
            ].join(" ")}
            style={{ colorScheme: "dark" }}
        >
        <Aurora />
        <Header />
        <div className="h-16 md:hidden" aria-hidden />
        <div className="relative">{children}</div>
        <Footer />
        </body>
        </html>
    );
}

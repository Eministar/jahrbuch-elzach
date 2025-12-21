// app/api/admin/pdf/class-logins/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import { jsPDF } from "jspdf";

export const dynamic = "force-dynamic";
// Erzwinge Node-Laufzeit für Buffer-Unterstützung
export const runtime = "nodejs";

// PDF Generator für kompakte Klassen-Kupons (ohne QR/AutoTable)
type UserRow = {
  id: number;
  username: string;
  password_plain: string;
  class: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const className = searchParams.get("class");
    if (!className) {
      return NextResponse.json({ error: "Klasse fehlt" }, { status: 400 });
    }

    // Hole alle User der Klasse MIT Klartext-Passwort
    const users = await query<UserRow[]>(
        "SELECT id, username, password_plain, class FROM users WHERE class = ? ORDER BY username ASC",
        [className]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "Keine Benutzer in dieser Klasse gefunden" }, { status: 404 });
    }

    // Basis-Setup
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    // Optionale jsPDF-APIs, die in den Typen fehlen könnten
    const anyDoc = doc as unknown as {
      setLineDash?: (pattern: number[], phase?: number) => void;
      setCharSpace?: (value: number) => void;
    };

    // Layout-Parameter (kompakt + sauber)
    const page = { width: 210, height: 297 };
    const margins = { top: 18, bottom: 12, left: 10, right: 10 };
    const gutterX = 5; // Spaltengasse
    const cols = 2;

    // Kupon-Größe (kompakt)
    const couponWidth = (page.width - margins.left - margins.right - gutterX) / cols; // ~92.5mm
    const couponHeight = 32; // ~32mm pro Kupon → viele passen auf eine Seite

    const usableHeight = page.height - margins.top - margins.bottom - 8; // 8mm Puffer unter Header
    const rowsPerPage = Math.max(1, Math.floor(usableHeight / couponHeight));
    const couponsPerPage = rowsPerPage * cols;
    const totalPages = Math.ceil(users.length / couponsPerPage);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://jahrbuch-elzach.info";
    const loginUrl = `${baseUrl}/login`;

    // Helpers
    const drawPageHeader = () => {
      // Schlanker Kopf: Linie + Titel + Klasse + Datum
      doc.setDrawColor(217, 119, 87); // #d97757
      doc.setLineWidth(0.6);
      doc.line(margins.left, margins.top - 6, page.width - margins.right, margins.top - 6);

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Jahrbuch – Login-Kupons", margins.left, margins.top - 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const dateStr = new Date().toLocaleDateString("de-DE");
      doc.text(`Klasse: ${className}`, page.width - margins.right, margins.top - 11, { align: "right" });
      doc.text(`Datum: ${dateStr}`, page.width - margins.right, margins.top - 6, { align: "right" });

      // dezenter Warnhinweis
      doc.setTextColor(200, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("VERTRAULICH – nur für Klassenlehrkräfte", margins.left, margins.top - 1);
      doc.setTextColor(0, 0, 0);
    };

    const drawFooter = (p: number, total: number) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(
          `Seite ${p} / ${total} • Bitte ausschneiden und einzeln verteilen.`,
          page.width / 2,
          page.height - 5,
          { align: "center" }
      );
      doc.setTextColor(0, 0, 0);
    };

    const drawCutGrid = () => {
      // Gestrichelte Hilfslinien zwischen Spalten/Zeilen (nur innerhalb Nutzfläche)
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);

      // Gestrichelt, falls verfügbar
      if (anyDoc.setLineDash) anyDoc.setLineDash([1.5, 1.5], 0);

      // Vertikale Trennlinie(n)
      const firstColRightX = margins.left + couponWidth;
      doc.line(firstColRightX + gutterX / 2, margins.top, firstColRightX + gutterX / 2, page.height - margins.bottom);

      // Horizontale Trennlinien je Reihe
      for (let r = 1; r < rowsPerPage; r++) {
        const y = margins.top + r * couponHeight;
        doc.line(margins.left, y, page.width - margins.right, y);
      }

      // Reset Dash
      if (anyDoc.setLineDash) anyDoc.setLineDash([]);
      doc.setDrawColor(0, 0, 0);
    };

    const drawCoupon = (x: number, y: number, username: string, password: string) => {
      // Rahmen (sehr dünn, nicht gefüllt)
      doc.setDrawColor(210, 205, 200);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, couponWidth, couponHeight, 2, 2);

      const padX = 3.5;
      const padY = 3.2;
      let cursorY = y + padY;

      // Kopfzeile Kupon
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("Zugangsdaten Jahrbuch", x + padX, cursorY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Klasse ${className}`, x + couponWidth - padX, cursorY, { align: "right" });

      // Username/Passwort (leichter monospace-Look via CharSpace, falls verfügbar)
      cursorY += 6;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("Benutzer:", x + padX, cursorY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      doc.text(username, x + padX + 22, cursorY);
      if (anyDoc.setCharSpace) anyDoc.setCharSpace(0);

      cursorY += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("Passwort:", x + padX, cursorY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(180, 0, 0);

      doc.text(password || "", x + padX + 22, cursorY);
      if (anyDoc.setCharSpace) anyDoc.setCharSpace(0);
      doc.setTextColor(0, 0, 0);

      // Login-Link (klein, einzeilig)
      cursorY += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("Login:", x + padX, cursorY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const linkText = loginUrl.replace(/^https?:\/\//, "");
      doc.text(linkText, x + padX + 14, cursorY, {
        maxWidth: couponWidth - (padX * 2 + 14),
      });

      // Minileiste unten: VERTRAULICH
      cursorY = y + couponHeight - 3.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(200, 0, 0);
      doc.text("Vertraulich – nur an den/die Schüler*in ausgeben", x + padX, cursorY);
      doc.setTextColor(0, 0, 0);
    };

    // Seiten zeichnen
    let userIndex = 0;
    for (let p = 1; p <= totalPages; p++) {
      if (p > 1) doc.addPage();
      drawPageHeader();
      drawCutGrid();

      for (let r = 0; r < rowsPerPage; r++) {
        for (let c = 0; c < cols; c++) {
          if (userIndex >= users.length) break;
          const u = users[userIndex++];
          const x = margins.left + c * (couponWidth + (c === 0 ? gutterX : 0));
          const y = margins.top + r * couponHeight;
          drawCoupon(x, y, u.username, u.password_plain || "");
        }
      }

      drawFooter(p, totalPages);
    }

    // PDF als Buffer generieren
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Login-Daten-${className}-VERTRAULICH.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF-Generierungsfehler:", error);
    return NextResponse.json({ error: "Fehler beim Generieren der PDF" }, { status: 500 });
  }
}

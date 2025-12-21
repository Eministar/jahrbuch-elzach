import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import { Heart, Mail, ArrowLeft, CheckCircle, Info, Star } from "lucide-react";

export const metadata = {
  title: "Sponsoring Info - Jahrbuch Elzach",
  description: "Informationen über Sponsoring-Möglichkeiten für unser Jahrbuch-Projekt",
};

export default function SponsoringInfoPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#1a1714] via-[#221e1a] to-[#1a1714]">
      <div className="hidden md:block pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[#e89a7a]/6 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[420px] w-[420px] rounded-full bg-[#8faf9d]/6 blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/sponsoren"
            className="inline-flex items-center gap-2 text-sm text-[#e89a7a] hover:text-[#e89a7a]/80 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zu Sponsoren
          </Link>
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#e89a7a]/10 border border-[#e89a7a]/20">
              <Info className="h-4 w-4 text-[#e89a7a]" />
              <span className="text-xs font-medium tracking-wide uppercase text-[#e89a7a]">
        Sponsoring
      </span>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#f5f1ed] mb-4">
            Sponsoring-Informationen
          </h1>
          <p className="text-lg text-[#b8aea5] leading-relaxed">
            Werden Sie Teil unseres Jahrbuch-Projekts und unterstützen Sie die nächste Generation.
          </p>
        </div>

        {/* Main Content */}
        <GlassCard className="mb-8">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-[#f5f1ed] mb-4 flex items-center gap-3">
                <Heart className="h-6 w-6 text-[#e89a7a]" />
                Warum Sponsor werden?
              </h2>
              <p className="text-[#d4cdc5] leading-relaxed mb-4">
                Unser Jahrbuch ist mehr als nur eine Sammlung von Fotos – es ist eine Chronik voller Erinnerungen,
                Erfolge und besonderer Momente unserer Schülerinnen und Schüler. Mit Ihrer Unterstützung helfen Sie
                uns, diese wichtigen Erinnerungen für die Ewigkeit festzuhalten.
              </p>
              <p className="text-[#d4cdc5] leading-relaxed">
                Als Sponsor zeigen Sie Ihr Engagement für Bildung und die lokale Gemeinschaft. Gleichzeitig erhöhen
                Sie die Sichtbarkeit Ihres Unternehmens bei Schülern, Eltern und der gesamten Schulgemeinschaft.
              </p>
            </div>

            <div className="border-t border-[#e89a7a]/10 pt-8">
              <h2 className="text-2xl font-bold text-[#f5f1ed] mb-6 flex items-center gap-3">
                <Star className="h-6 w-6 text-[#e89a7a]" />
                Ihre Vorteile
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "Logo im gedruckten Jahrbuch",
                  "Präsenz auf unserer Website",
                  "Erwähnung in sozialen Medien",
                  "Sichtbarkeit in der Schulgemeinschaft",
                  "Unterstützung der lokalen Bildung",
                  "Positive PR für Ihr Unternehmen"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-[#8faf9d]/5 border border-[#8faf9d]/10">
                    <CheckCircle className="h-5 w-5 text-[#8faf9d] shrink-0 mt-0.5" />
                    <span className="text-sm text-[#d4cdc5]">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>


          </div>
        </GlassCard>

        {/* Contact CTA */}
        <GlassCard className="bg-gradient-to-br from-[#2a2520]/95 to-[#38302b]/90">
          <div className="text-center py-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e89a7a]/10 mb-4">
              <Mail className="h-8 w-8 text-[#e89a7a]" />
            </div>
            <h2 className="text-2xl font-bold text-[#f5f1ed] mb-3">
              Interessiert?
            </h2>
            <p className="text-[#b8aea5] mb-6 max-w-md mx-auto">
              Kontaktieren Sie uns für ein individuelles Angebot und weitere Details zu unseren Sponsoring-Möglichkeiten.
            </p>
            <a
              href="mailto:sekretariat@schulzentrumoe.de"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-[#d97757] to-[#c96846] text-white font-medium hover:from-[#e89a7a] hover:to-[#d97757] transition-all shadow-lg shadow-[#d97757]/20"
            >
              <Mail className="h-4 w-4" />
              sekretariat@schulzentrumoe.de
            </a>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

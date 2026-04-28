"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import {
  Award,
  Download,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getVolunteerCertificates } from "./actions";

type Certificate = {
  id: string;
  certificateNumber: string | null;
  eventTitle: string | null;
  recipientName: string | null;
  recipientRole: string | null;
  qrVerifyUrl: string | null;
  isVisible: boolean;
  isAutoIssued: boolean;
  eventDate: string | null;
  issuedDate: string | null;
};

function CertificateCard({ cert }: { cert: Certificate }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleLabel =
    cert.recipientRole === "volunteer" ? "Volunteering" : "Participation";

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`/api/certificates/${cert.id}/download`);
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${cert.certificateNumber ?? cert.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative bg-card rounded-[24px] overflow-hidden flex flex-col ring-1 ring-primary/15 shadow-[0_20px_60px_-12px_rgba(25,28,26,0.06)]">
      {/* Decorative top bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/40" />

      {/* Watermark icon */}
      <div className="absolute top-6 right-6 text-primary/[0.06] pointer-events-none">
        <Award size={96} strokeWidth={0.8} />
      </div>

      <div className="p-8 flex flex-col gap-4 flex-1 relative z-10">
        {/* Badge row */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[9px] uppercase tracking-[0.12em] font-bold border-primary/30 text-primary bg-primary/5 shadow-none rounded-sm"
          >
            Certificate of {roleLabel}
          </Badge>
          {cert.isAutoIssued && (
            <Badge
              variant="secondary"
              className="text-[9px] uppercase tracking-[0.10em] font-bold shadow-none rounded-sm"
            >
              Auto-issued
            </Badge>
          )}
        </div>

        {/* Event title */}
        <h3 className="text-xl font-serif font-medium leading-[1.3] text-foreground">
          {cert.eventTitle ?? "Event"}
        </h3>

        {/* Recipient */}
        <p className="text-sm text-foreground/60 font-light">
          Awarded to{" "}
          <span className="font-semibold text-foreground">
            {cert.recipientName}
          </span>
        </p>

        {/* Meta */}
        <div className="flex flex-col gap-1 text-xs text-foreground/45 font-mono">
          {cert.eventDate && (
            <span>
              Event:{" "}
              {new Date(cert.eventDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
          {cert.issuedDate && (
            <span>
              Issued:{" "}
              {new Date(cert.issuedDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
          {cert.certificateNumber && (
            <span className="text-primary/60 font-bold mt-1">
              {cert.certificateNumber}
            </span>
          )}
        </div>

        {error && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}
      </div>

      {/* Action footer */}
      <div className="px-8 pb-8 flex gap-3">
        <Button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] uppercase tracking-[0.12em] font-bold shadow-none rounded-[10px] gap-2 transition-all"
        >
          {downloading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          {downloading ? "Generating…" : "Download PDF"}
        </Button>

        {cert.qrVerifyUrl && (
          <a
            href={cert.qrVerifyUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shadow-none rounded-[10px] border-foreground/[0.08] hover:bg-muted text-foreground/50 hover:text-primary transition-colors"
              title="Verify certificate"
            >
              <ShieldCheck size={16} />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

export default function VolunteerCertificatesPage() {
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await getVolunteerCertificates();
        setCertificates(data.certificates ?? []);
      } catch {
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-8 lg:p-16 text-foreground max-w-7xl">
      {/* Header */}
      <header className="mb-16">
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-primary/70 mb-3">
          Operative Station
        </p>
        <h1 className="text-5xl font-serif tracking-tight text-foreground mb-4">
          My Certificates
        </h1>
        <p className="text-foreground/60 font-light max-w-lg leading-relaxed">
          Download your service certificates. Certificates are issued by the admin
          once your attendance has been marked at an event.
        </p>
      </header>

      {loading ? (
        <div className="p-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : certificates.length === 0 ? (
        /* Empty state */
        <div className="p-16 rounded-[24px] bg-muted/30 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
            <Award className="w-8 h-8 text-primary/30" strokeWidth={1} />
          </div>
          <div>
            <h3 className="font-serif text-2xl mb-2 text-foreground">
              No Certificates Yet
            </h3>
            <p className="text-sm text-foreground/50 font-light max-w-sm leading-relaxed">
              Certificates are issued after you attend an event and the admin
              marks your attendance. Check back after your next assignment.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {certificates.map((cert) => (
            <CertificateCard key={cert.id} cert={cert} />
          ))}
        </div>
      )}
    </div>
  );
}

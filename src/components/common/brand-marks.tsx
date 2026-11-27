import {
  siApplepay,
  siFacebook,
  siInstagram,
  siMastercard,
  siPaypal,
  siTiktok,
  siVisa,
  siWhatsapp,
  siX,
  siYoutube,
  type SimpleIcon,
} from "simple-icons";

const social: Record<string, SimpleIcon | undefined> = {
  facebook: siFacebook,
  x: siX,
  instagram: siInstagram,
  youtube: siYoutube,
  tiktok: siTiktok,
  whatsapp: siWhatsapp,
};

const socialLabels: Record<string, string> = {
  facebook: "Facebook",
  x: "X",
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
};

export function socialLabel(platform: string) {
  return socialLabels[platform] ?? platform;
}

export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const icon = social[platform];
  if (!icon) {
    // simple-icons has no LinkedIn mark (trademark policy); use a neutral text glyph.
    return (
      <span aria-hidden className={className} style={{ fontWeight: 800, fontSize: "0.95em", lineHeight: 1 }}>
        {platform === "linkedin" ? "in" : platform.slice(0, 2)}
      </span>
    );
  }
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d={icon.path} />
    </svg>
  );
}

const payment: Record<string, { icon?: SimpleIcon; label: string }> = {
  visa: { icon: siVisa, label: "Visa" },
  mastercard: { icon: siMastercard, label: "Mastercard" },
  paypal: { icon: siPaypal, label: "PayPal" },
  applepay: { icon: siApplepay, label: "Apple Pay" },
  verve: { label: "Verve" },
};

export function PaymentMark({ mark }: { mark: string }) {
  const m = payment[mark] ?? { label: mark };
  return (
    <span
      title={m.label}
      className="rounded-brand inline-flex h-7 min-w-11 items-center justify-center bg-white px-2 text-[11px] font-bold text-[#1a1f36]"
    >
      {m.icon ? (
        <svg role="img" aria-label={m.label} viewBox="0 0 24 24" className="h-5 w-8" fill={`#${m.icon.hex}`}>
          <path d={m.icon.path} />
        </svg>
      ) : (
        m.label
      )}
    </span>
  );
}

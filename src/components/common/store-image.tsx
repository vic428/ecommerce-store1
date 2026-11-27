import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";

const publicDir = path.join(process.cwd(), "public");

/** True if a site path like "/demo/x.jpg" is a file inside public/ (never outside it). */
function localFileExists(src: string) {
  if (!src.startsWith("/") || src.startsWith("//")) return false;
  const resolved = path.resolve(publicDir, "." + src.split("?")[0]);
  return resolved.startsWith(publicDir + path.sep) && existsSync(resolved);
}

/**
 * Image for catalogue/config content. Local paths are served through next/image; if the file is
 * missing (e.g. demo images not added yet) a neutral placeholder renders instead of a broken image.
 * Remote https images are rendered unoptimised so we never proxy arbitrary hosts.
 */
export function StoreImage({
  src,
  alt,
  sizes,
  priority,
  className,
  fit = "contain",
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  fit?: "contain" | "cover";
}) {
  const available = src && (src.startsWith("https://") || localFileExists(src));

  if (!available) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn("bg-surface text-muted flex h-full w-full items-center justify-center", className)}
      >
        <ImageOff aria-hidden className="h-8 w-8 opacity-40" strokeWidth={1.25} />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={src.startsWith("https://")}
      className={cn(fit === "cover" ? "object-cover" : "object-contain", className)}
    />
  );
}

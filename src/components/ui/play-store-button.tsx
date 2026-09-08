import * as React from "react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

type PlayStoreButtonProps = Omit<React.ComponentPropsWithoutRef<"a">, "children">;

export function PlayStoreButton({ className, ...props }: PlayStoreButtonProps) {
  return (
    <Button asChild className={cn("h-12 gap-2.5 rounded-xl bg-[#c63c33] px-4 text-white shadow-none hover:bg-[#ad3029]", className)}>
      <a {...props}>
        <GooglePlayIcon className="size-6" aria-hidden="true" />
        <span className="flex flex-col items-start justify-center pr-1 text-left">
          <span className="text-[10px] leading-none tracking-tight">GET IT ON</span>
          <span className="mt-0.5 text-[15px] font-bold leading-none">Google Play</span>
        </span>
      </a>
    </Button>
  );
}

function GooglePlayIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 40 40" {...props}>
      <path fill="#EA4335" d="m20.72 19.42-10.65 11.3c.33 1.23 1.45 2.13 2.78 2.13.53 0 1.03-.14 1.46-.4l.03-.02 11.98-6.91-5.6-6.1Z" />
      <path fill="#FBBC04" d="M31.49 17.5h-.01l-5.17-3.01-5.83 5.19 5.85 5.85 5.15-2.97a2.89 2.89 0 0 0 .01-5.06Z" />
      <path fill="#4285F4" d="M10.07 9.28a2.9 2.9 0 0 0-.1.74v19.97c0 .26.03.5.1.74l11.01-11.01L10.07 9.28Z" />
      <path fill="#34A853" d="m20.8 20 5.51-5.51-11.97-6.94a2.9 2.9 0 0 0-4.27 1.72L20.8 20Z" />
    </svg>
  );
}

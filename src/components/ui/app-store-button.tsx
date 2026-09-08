import * as React from "react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

type AppStoreButtonProps = Omit<React.ComponentPropsWithoutRef<"a">, "children">;

export function AppStoreButton({ className, ...props }: AppStoreButtonProps) {
  return (
    <Button asChild className={cn("h-12 gap-2.5 rounded-xl bg-[#c63c33] px-4 text-white shadow-none hover:bg-[#ad3029]", className)}>
      <a {...props}>
        <AppleIcon className="size-5" aria-hidden="true" />
        <span className="flex flex-col items-start justify-center pr-1 text-left">
          <span className="text-[10px] leading-none tracking-tight">Download on the</span>
          <span className="mt-0.5 text-[15px] font-bold leading-none">App Store</span>
        </span>
      </a>
    </Button>
  );
}

function AppleIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.546 12.763c.024-1.87 1.004-3.597 2.597-4.576-1.009-1.442-2.64-2.323-4.399-2.378-1.851-.194-3.645 1.107-4.588 1.107-.961 0-2.413-1.088-3.977-1.056C6.122 5.927 4.25 7.068 3.249 8.867c-2.131 3.69-.542 9.114 1.5 12.097 1.022 1.461 2.215 3.092 3.778 3.035 1.529-.063 2.1-.975 3.945-.975 1.828 0 2.364.975 3.958.938 1.64-.027 2.674-1.467 3.66-2.942.734-1.041 1.299-2.191 1.673-3.408-1.948-.824-3.215-2.733-3.217-4.849Z" />
      <path d="M15.535 3.847c.894-1.074 1.335-2.454 1.228-3.847-1.366.144-2.629.797-3.535 1.829-.895 1.019-1.349 2.351-1.261 3.705 1.385.014 2.7-.608 3.568-1.687Z" />
    </svg>
  );
}

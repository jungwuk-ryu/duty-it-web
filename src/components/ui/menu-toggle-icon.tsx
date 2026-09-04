import { Menu, X } from "lucide-react";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Menu> & {
    open: boolean;
};

export function MenuToggleIcon({ open, ...props }: Props) {
    return open ? <X {...props} /> : <Menu {...props} />;
}

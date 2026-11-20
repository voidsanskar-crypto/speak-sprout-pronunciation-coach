import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "tactile-btn tactile-emerald",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "tactile-btn tactile-neutral border border-input",
        secondary: "tactile-btn tactile-neutral bg-secondary text-secondary-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        energy: "rounded-2xl tactile-btn tactile-sun font-display font-bold",
        special: "rounded-2xl tactile-btn tactile-violet font-display font-bold",
        hero: "rounded-2xl tactile-btn tactile-emerald font-display font-bold",
        mint: "rounded-2xl tactile-btn tactile-neutral bg-gradient-mint text-secondary-foreground font-display font-semibold",
        soft: "rounded-xl tactile-btn tactile-neutral font-semibold border border-border",
        chip: "rounded-xl tactile-btn tactile-neutral bg-secondary text-secondary-foreground font-semibold",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        xl: "h-16 px-8 text-lg [&_svg]:size-6",
        pill: "h-12 px-6 text-base [&_svg]:size-5",
        "icon-lg": "h-12 w-12 rounded-full [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

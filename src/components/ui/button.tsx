import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    "bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:bg-blue-800",
                destructive:
                    "bg-red-600 text-white shadow-lg hover:bg-red-700 active:bg-red-800",
                outline:
                    "border-2 border-blue-600 bg-white text-blue-700 shadow hover:bg-blue-50 hover:text-blue-800",
                secondary:
                    "bg-green-600 text-white shadow-lg hover:bg-green-700 active:bg-green-800",
                ghost: "hover:bg-blue-100 text-blue-700",
                link: "text-blue-700 underline-offset-4 hover:underline font-bold",
            },
            size: {
                default: "h-10 px-5 py-2.5 text-base",
                sm: "h-9 rounded-lg px-3 text-sm",
                lg: "h-12 rounded-xl px-8 text-lg",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };

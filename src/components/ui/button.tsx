import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-[16px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none px-5 py-3 gap-2",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground hover:bg-accent/90",
        primary: "bg-accent text-accent-foreground hover:bg-accent/90",
        accent: "bg-accent text-accent-foreground hover:bg-accent/80",
        secondary: "bg-muted text-muted-foreground hover:bg-muted/80",
        outline: "border border-input bg-background text-foreground hover:bg-muted/50",
        ghost: "bg-transparent text-foreground hover:bg-muted/50",
      },
      size: {
        default: "h-11 px-5 py-3 text-[16px]",
        sm: "h-9 px-4 py-2 text-[15px]",
        lg: "h-14 px-8 py-4 text-[18px]",
        icon: "h-11 w-11 p-0 text-[16px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

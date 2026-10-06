import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center font-heading font-bold whitespace-nowrap transition-all duration-100 outline-none select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#CEF431] text-[#161514] border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:bg-[#D8F74E]",
        secondary:
          "bg-[#03D26F] text-[#161514] border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:bg-[#10E57E]",
        outline:
          "bg-white text-[#161514] border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:bg-[#F8FAFC]",
        ghost:
          "text-[#161514] border-2 border-transparent hover:bg-[#F1EFEA] hover:border-[#161514]/20 active:bg-[#E2E0D8]",
        destructive:
          "bg-[#EF4444] text-white border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:bg-[#DC2626]",
        accent:
          "bg-[#C084FC] text-[#161514] border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:bg-[#CC99FD]",
        link: "text-[#161514] underline-offset-4 hover:underline border-none shadow-none active:translate-x-0 active:translate-y-0",
      },
      size: {
        default: "min-h-[40px] px-4 py-2 text-sm rounded-xl gap-2",
        xs: "min-h-[28px] px-2 py-1 text-xs rounded-lg gap-1 [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-[34px] px-3 py-1.5 text-xs rounded-lg gap-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "min-h-[44px] px-5 py-2.5 text-base rounded-xl gap-2.5",
        icon: "size-10 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]",
        "icon-xs": "size-7 rounded-lg border-2 border-[#161514] shadow-[1px_1px_0px_0px_#161514] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8.5 rounded-lg border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]",
        "icon-lg": "size-11 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

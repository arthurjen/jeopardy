import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface GameButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  icon?: LucideIcon;
  variant?:
    | "default"
    | "yellow"
    | "blue"
    | "green"
    | "red"
    | "orange"
    | "ghost";
  size?: "sm" | "md" | "lg";
}

const GameButton = ({
  onClick,
  disabled,
  children,
  className,
  icon: Icon,
  variant = "default",
  size = "md",
}: GameButtonProps) => {
  const variantStyles = {
    default: "bg-blue-400 hover:bg-blue-500 text-white",
    yellow: "bg-yellow-500 hover:bg-yellow-600 text-blue-900",
    blue: "bg-blue-600 hover:bg-blue-700 text-yellow-400",
    green: "bg-green-500 hover:bg-green-600 text-white",
    red: "bg-red-500 hover:bg-red-600 text-white",
    orange: "bg-orange-600 hover:bg-orange-700 text-white",
    ghost: "bg-transparent hover:bg-blue-700 text-white",
  };

  const sizeStyles = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-8 py-6 text-lg",
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "font-bold rounded-lg shadow-lg transform transition hover:scale-105 cursor-pointer",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {Icon && <Icon className={cn("h-5 w-5", children ? "mr-2" : "")} />}
      {children}
    </Button>
  );
};

export default GameButton;

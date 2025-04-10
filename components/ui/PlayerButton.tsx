import { cn } from "@/lib/utils";
import { AlertCircle, User } from "lucide-react";

interface PlayerButtonProps {
  id: number;
  name: string;
  onClick: (id: number) => void;
  isSelected?: boolean;
  isDisabled?: boolean;
  hasAttempted?: boolean;
  className?: string;
}

const PlayerButton = ({
  id,
  name,
  onClick,
  isSelected = false,
  isDisabled = false,
  hasAttempted = false,
  className,
}: PlayerButtonProps) => {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-start p-2 h-auto rounded-md",
        isDisabled
          ? "opacity-50 cursor-not-allowed bg-blue-950"
          : "cursor-pointer",
        isSelected
          ? "bg-blue-700 ring-1 ring-yellow-400"
          : isDisabled
          ? ""
          : "bg-blue-900 hover:bg-blue-700",
        className
      )}
      onClick={() => !isDisabled && onClick(id)}
      disabled={isDisabled}
    >
      <span
        className={cn(
          "flex items-center text-white [text-shadow:_0_1px_2px_rgba(0,0,0,0.5)]",
          isDisabled ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        {hasAttempted ? (
          <AlertCircle className="h-4 w-4 mr-2 text-red-400" />
        ) : (
          <User className="h-4 w-4 mr-2" />
        )}
        {name}
      </span>
    </button>
  );
};

export default PlayerButton;

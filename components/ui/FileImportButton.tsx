import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ChangeEvent, ReactNode } from "react";

interface FileImportButtonProps {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  children: ReactNode;
  className?: string;
  icon?: LucideIcon;
  size?: "sm" | "md" | "lg";
}

const FileImportButton = ({
  onChange,
  accept = ".json",
  children,
  className,
  icon: Icon,
  size = "md",
}: FileImportButtonProps) => {
  const sizeStyles = {
    sm: "px-2 py-1 text-sm h-6",
    md: "px-4 py-2 h-8",
    lg: "px-8 py-6 text-lg h-10",
  };

  return (
    <label
      className={cn(
        "bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 flex items-center justify-center cursor-pointer",
        sizeStyles[size],
        className
      )}
    >
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
      />
      {Icon && <Icon className={cn("h-5 w-5", children ? "mr-2" : "")} />}
      {children}
    </label>
  );
};

export default FileImportButton;

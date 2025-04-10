import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModalContentProps {
  children: ReactNode;
  className?: string;
  withSpacing?: boolean;
  withBorder?: boolean;
}

const ModalContent = ({
  children,
  className,
  withSpacing = true,
  withBorder = false,
}: ModalContentProps) => {
  return (
    <div
      className={cn(
        withSpacing && "space-y-4",
        withBorder && "border border-blue-600 rounded-lg p-4 bg-blue-700/30",
        className
      )}
    >
      {children}
    </div>
  );
};

export default ModalContent;

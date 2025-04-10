import { ReactNode } from "react";
import { motion } from "framer-motion";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import GameButton from "./GameButton";

interface GameModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children: ReactNode;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
  width?: "sm" | "md" | "lg" | "auto";
  centered?: boolean;
}

const modalVariants = {
  initial: { scale: 0.8, y: 20, opacity: 0 },
  animate: { scale: 1, y: 0, opacity: 1 },
  exit: { scale: 0.8, y: 20, opacity: 0 },
  transition: { type: "spring", damping: 20, stiffness: 300 },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const GameModal = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  className,
  contentClassName,
  width = "md",
  centered = false,
}: GameModalProps) => {
  if (!isOpen) return null;

  const widthClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    auto: "max-w-fit",
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      {...fadeIn}
    >
      <motion.div
        className={cn(
          "bg-blue-800 rounded-lg p-8",
          widthClasses[width],
          "w-full",
          centered && "text-center",
          className
        )}
        {...modalVariants}
      >
        {title && (
          <div className="flex justify-between items-center mb-4 w-full">
            <h2 className="text-2xl font-bold text-white [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)] w-full">
              {title}
            </h2>
            {showCloseButton && onClose && (
              <GameButton variant="ghost" size="sm" onClick={onClose}>
                <XIcon className="h-6 w-6 text-white" />
              </GameButton>
            )}
          </div>
        )}
        <div className={contentClassName}>{children}</div>
      </motion.div>
    </motion.div>
  );
};

export default GameModal;

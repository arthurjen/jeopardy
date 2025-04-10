import { Clock, DollarSign } from "lucide-react";
import GameButton from "./GameButton";

interface QuestionTitleProps {
  value: number;
  onTimesUp?: () => void;
  isDailyDouble?: boolean;
}

const QuestionTitle = ({
  value,
  onTimesUp,
  isDailyDouble = false,
}: QuestionTitleProps) => {
  return (
    <div className="flex items-center justify-between w-full">
      <span className="text-white">${value}</span>
      {!isDailyDouble && onTimesUp && (
        <GameButton variant="orange" size="sm" icon={Clock} onClick={onTimesUp}>
          Out of Time
        </GameButton>
      )}
      {isDailyDouble && (
        <span className="flex items-center">
          <span className="text-yellow-300 mr-2">DAILY DOUBLE!</span>
          <DollarSign className="h-6 w-6 text-yellow-300" />
        </span>
      )}
    </div>
  );
};

export default QuestionTitle;

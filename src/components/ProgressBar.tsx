
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percentage: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const ProgressBar = ({
  percentage,
  size = "md",
  showLabel = true,
  className,
}: ProgressBarProps) => {
  // Ensure percentage is between 0 and 100
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  
  // Size variants
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-4",
  };
  
  return (
    <div className={cn("w-full flex flex-col gap-1", className)}>
      <div className={cn("w-full bg-gray-100 rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className="bg-edu-purple h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      
      {showLabel && (
        <div className="text-xs text-gray-500 flex justify-end">
          {clampedPercentage}% Complete
        </div>
      )}
    </div>
  );
};

export default ProgressBar;

import clsx from "clsx";
import { BrainCircuit } from "lucide-react";
import LoadingSpinner from "@/app/components/loading-spinner";

interface GuaCardProps {
  response?: {
    origin: string;
    variation: string;
    summary: string;
  };
  className?: string;
  style?: React.CSSProperties;
}

const AiCard = ({ className, style, response, ...props }: GuaCardProps) => {
  return (
    <div
      className={clsx(
        className,
        "flex flex-col gap-2 max-w-96 min-w-80 rounded-3xl shadow-lg p-8 overflow-hidden relative"
      )}
      style={{
        ...style,
      }}
      {...props}
    >
      <div className="flex flex-col gap-2">
        <BrainCircuit size={60} className="text-white mb-6" />
        {response ? (
          <>
            <div className="text-sm">
              <span className="font-bold">本卦：</span>
              <span>{response.origin}</span>
            </div>
            <div className="text-sm">
              <span className="font-bold">变卦：</span>
              <span>{response.variation}</span>
            </div>
            <div className="text-sm leading-6">
              <span className="font-bold">总结：</span>
              <div className="overflow-y-scroll">{response.summary}</div>
            </div>
          </>
        ) : (
          <LoadingSpinner size={60} className="invert"/>
        )}
      </div>
    </div>
  );
};

export default AiCard;

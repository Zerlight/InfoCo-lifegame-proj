import clsx from "clsx";
import { BrainCircuit } from "lucide-react";
import LoadingSpinner from "@/app/components/loading-spinner";
import { Dictionary } from "../utils/dictionaries";

interface GuaCardProps {
  response?: {
    origin: string;
    variation: string;
    summary: string;
  };
  className?: string;
  style?: React.CSSProperties;
  lang: Dictionary;
}

const AiCard = ({
  className,
  style,
  response,
  lang,
  ...props
}: GuaCardProps) => {
  return (
    <div
      className={clsx(
        className,
        "flex flex-col gap-2 max-w-96 min-w-72 min-h-96 max-h-[520px] mx-1 rounded-3xl shadow-lg p-8 overflow-hidden relative select-none flex-1"
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
              <span className="font-bold">{lang.benGua}</span>
              <span>{response.origin}</span>
            </div>
            <div className="text-sm">
              <span className="font-bold">{lang.bianGua}</span>
              <span>{response.variation}</span>
            </div>
            <div className="text-sm leading-6">
              <span className="font-bold">{lang.summary}</span>
              <div className="overflow-y-scroll max-h-72">
                {response.summary}
              </div>
            </div>
          </>
        ) : (
          <LoadingSpinner size={60} className="invert" />
        )}
      </div>
    </div>
  );
};

export default AiCard;

import clsx from "clsx";
import { BrainCircuit } from "lucide-react";
import LoadingSpinner from "@/components/loading-spinner";
import { Dictionary } from "@/utils/dictionaries";

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
        "flex flex-col gap-3 max-w-96 min-w-72 mx-1 rounded-3xl p-6 relative select-none flex-1",
        "bg-gradient-to-br from-slate-50/95 to-slate-100/90 dark:from-slate-800/75 dark:to-slate-900/70 backdrop-blur-sm",
        "border border-slate-300/60 dark:border-slate-600/40 shadow-[0_4px_10px_-2px_rgba(0,0,0,0.14),0_2px_4px_-1px_rgba(0,0,0,0.07)] dark:shadow-[0_6px_18px_-6px_rgba(0,0,0,0.45),0_2px_6px_-2px_rgba(0,0,0,0.30)]",
        "text-slate-800 dark:text-slate-100 transition-colors duration-300 hover:border-slate-400/70 dark:hover:border-slate-500/70",
        className
      )}
      style={style}
      {...props}
    >
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <div className="flex items-center gap-3">
          <BrainCircuit
            size={42}
            className="text-slate-600 dark:text-slate-300"
          />
          <span className="text-base font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-300">
            AI
          </span>
        </div>
        {response ? (
          response.origin || response.variation || response.summary ? (
            <div className="space-y-4 overflow-y-auto pr-1 custom-scroll-thin min-h-0 flex-1">
              {response.origin && (
                <div className="text-sm leading-6">
                  <span className="font-bold mr-1 text-slate-700 dark:text-slate-300">
                    {lang.benGua}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {response.origin}
                  </span>
                </div>
              )}
              {response.variation && (
                <div className="text-sm leading-6">
                  <span className="font-bold mr-1 text-slate-700 dark:text-slate-300">
                    {lang.bianGua}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {response.variation}
                  </span>
                </div>
              )}
              {response.summary && (
                <div className="text-sm leading-6">
                  <span className="font-bold block mb-1 text-slate-700 dark:text-slate-300">
                    {lang.summary}
                  </span>
                  <div className="overflow-y-auto max-h-56 whitespace-pre-wrap custom-scroll-thin text-slate-700 dark:text-slate-300">
                    {response.summary}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner size={48} className="dark:invert opacity-75" />
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner size={48} className="dark:invert opacity-75" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AiCard;

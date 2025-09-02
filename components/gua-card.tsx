import { useState } from "react";
import { useSpring, animated } from "@react-spring/web";
import clsx from "clsx";
import { BookOpenText, BrainCircuit } from "lucide-react";
import LoadingSpinner from "@/components/loading-spinner";
import { Dictionary } from "../utils/dictionaries";

interface GuaCardProps {
  gua: {
    name: string;
    binary: string;
    "gua-detail": string;
    "yao-detail": string[];
  };
  aiResponse: string | null;
  className?: string;
  style?: React.CSSProperties;
  lang: Dictionary;
  onFlip?: () => void; // retained for API consistency (unused after fade refactor)
}

const GuaCard = ({
  gua,
  className,
  style,
  aiResponse,
  lang,
  onFlip,
  ...props
}: GuaCardProps) => {
  const [showDetail, setShowDetail] = useState(false);
  const frontSpring = useSpring({
    opacity: showDetail ? 0 : 1,
    config: { tension: 240, friction: 26 },
  });
  const backSpring = useSpring({
    opacity: showDetail ? 1 : 0,
    config: { tension: 240, friction: 26 },
    onRest: () => {
      onFlip?.();
    },
  });

  return (
    <div
      className={clsx(
  "group flex flex-col gap-2 max-w-96 min-w-72 mx-1 rounded-3xl p-5 sm:p-6 overflow-hidden relative select-none flex-1 card-3d",
        // Light / dark adaptive surface with subtle gradient + glass effect
        "bg-gradient-to-br from-slate-50/95 to-slate-100/90 dark:from-slate-800/75 dark:to-slate-900/70 backdrop-blur-sm",
        // Border + shadow tuned for dark mode depth
        "border border-slate-300/60 dark:border-slate-600/40 shadow-[0_4px_10px_-2px_rgba(0,0,0,0.14),0_2px_4px_-1px_rgba(0,0,0,0.07)] dark:shadow-[0_6px_18px_-6px_rgba(0,0,0,0.45),0_2px_6px_-2px_rgba(0,0,0,0.30)]",
        // Text defaults
        "text-slate-800 dark:text-slate-100",
        // Hover / active accents
        "transition-colors duration-300 hover:border-slate-400/70 dark:hover:border-slate-500/70",
        className
      )}
      style={{ ...style }}
      {...props}
    >
      {/* FRONT */}
      <animated.div
        style={{ ...frontSpring, pointerEvents: showDetail ? "none" : "auto" }}
        className={clsx(
          "inset-0 flex flex-col h-full w-full",
          "[backface-visibility:hidden]"
        )}
      >
        <div className="flex-1 min-h-0 flex flex-col">
          <div
            className="flex-1 min-h-0 overflow-y-auto custom-scroll-thin pr-1 space-y-4"
            style={{ touchAction: "pan-y" }}
          >
            <div className="flex flex-col gap-3">
              <span className="text-4xl sm:text-5xl font-bold font-serif text-slate-900 dark:text-slate-100">
                {gua.name}
              </span>
              <span className="text-6xl sm:text-7xl opacity-10 dark:opacity-20 font-bold font-mono absolute -top-4 -right-2 select-none pointer-events-none text-slate-900 dark:text-slate-100">
                {`#${gua.binary}`}
              </span>
              <BookOpenText className="mt-2" />
              <span className="text-sm leading-6 text-slate-700 dark:text-slate-300 block">
                {gua["gua-detail"]}
              </span>
            </div>
            {aiResponse ? (
              <div>
                <BrainCircuit className="mb-2" />
                <div className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {aiResponse}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <LoadingSpinner size={48} className="dark:invert opacity-75" />
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowDetail(true);
          }}
          className="pt-2 cursor-pointer text-center text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide w-full outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 rounded"
        >
          {lang.flipPrompt}
        </button>
      </animated.div>
      {/* BACK */}
      <animated.div
        style={{ ...backSpring, pointerEvents: showDetail ? "auto" : "none" }}
        className={clsx(
          "absolute inset-0 flex flex-col h-full w-full p-5 sm:p-6",
          "[backface-visibility:hidden]"
        )}
      >
        <div
          className="flex-1 min-h-0 overflow-y-auto custom-scroll-thin pr-1 flex flex-col gap-3"
          style={{ touchAction: "pan-y" }}
        >
          {gua["yao-detail"].map((detail, index) => (
            <span
              key={index}
              className="text-sm leading-6 text-slate-700 dark:text-slate-300"
            >
              {detail}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowDetail(false);
          }}
          className="pt-2 cursor-pointer text-center text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide w-full outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 rounded"
        >
          {lang.flipPrompt2}
        </button>
      </animated.div>
    </div>
  );
};

export default GuaCard;

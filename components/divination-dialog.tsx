import React, { useState } from "react";
import { useSpring, animated } from "@react-spring/web";
import clsx from "clsx";
import { X, BookOpen, Brain } from "lucide-react";
import LoadingSpinner from "@/components/loading-spinner";
import { Dictionary } from "@/utils/dictionaries";

interface GuaResult {
  name: string;
  binary: string;
  "gua-detail": string;
  "yao-detail": string[];
}

interface DivinationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  guaResults: {
    originResult?: GuaResult;
    variationResult?: GuaResult;
  } | null;
  openaiResponse: {
    origin?: string;
    variation?: string;
    summary?: string;
  } | null;
  dict: Dictionary;
}

const DivinationDialog: React.FC<DivinationDialogProps> = ({
  isOpen,
  onClose,
  guaResults,
  openaiResponse,
  dict,
}) => {
  const [activeTab, setActiveTab] = useState<"origin" | "variation" | "ai">(
    "origin"
  );
  const [showDetail, setShowDetail] = useState(false);

  const backdropSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    config: { tension: 280, friction: 30 },
  });

  const dialogSpring = useSpring({
    transform: isOpen
      ? "scale(1) translateY(0%)"
      : "scale(0.95) translateY(10%)",
    opacity: isOpen ? 1 : 0,
    config: { tension: 280, friction: 30 },
  });

  if (!isOpen) return null;

  const currentGua =
    activeTab === "origin"
      ? guaResults?.originResult
      : guaResults?.variationResult;
  const currentAI =
    activeTab === "origin" ? openaiResponse?.origin : openaiResponse?.variation;

  return (
    <animated.div
      style={backdropSpring}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <animated.div
        style={dialogSpring}
        className="relative bg-white dark:bg-neutral-900 rounded-none sm:rounded-2xl shadow-2xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {dict.divine}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Tab Navigation - Only show when both gua results and AI response are available */}
        {guaResults && openaiResponse && (
          <div className="flex border-b dark:border-slate-700">
            <button
              onClick={() => setActiveTab("origin")}
              className={clsx(
                "flex-1 px-6 py-3 text-sm font-medium transition-colors flex items-center justify-center",
                activeTab === "origin"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {dict.benGua || "本卦"}
            </button>
            <button
              onClick={() => setActiveTab("variation")}
              className={clsx(
                "flex-1 px-6 py-3 text-sm font-medium transition-colors flex items-center justify-center",
                activeTab === "variation"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {dict.bianGua || "变卦"}
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={clsx(
                "flex-1 px-6 py-3 text-sm font-medium transition-colors flex items-center justify-center",
                activeTab === "ai"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <Brain size={16} className="mr-2 flex-shrink-0" />
              <span>AI {dict.summary || "总结"}</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 sm:max-h-[60vh]">
          {!guaResults || !openaiResponse ? (
            <div className="flex flex-col items-center justify-center py-16">
              <LoadingSpinner size={48} className="opacity-70 dark:invert" />
              <span className="mt-4 text-slate-600 dark:text-slate-400">
                {dict.loadingDivination || "正在解卦..."}
              </span>
            </div>
          ) : (
            <>
              {activeTab === "ai" ? (
                <div className="space-y-4">
                  {openaiResponse ? (
                    <>
                      {openaiResponse.origin && (
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            {dict.benGua || "本卦"}
                          </h3>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {openaiResponse.origin}
                          </p>
                        </div>
                      )}
                      {openaiResponse.variation && (
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            {dict.bianGua || "变卦"}
                          </h3>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {openaiResponse.variation}
                          </p>
                        </div>
                      )}
                      {openaiResponse.summary && (
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            <Brain size={18} className="inline mr-2" />
                            {dict.summary || "总结"}
                          </h3>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {openaiResponse.summary}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner size={48} className="opacity-70 dark:invert" />
                      <span className="ml-4 text-slate-600 dark:text-slate-400">
                        {dict.loadingAI || "AI分析中..."}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                currentGua && (
                  <div className="space-y-6">
                    {/* Gua Header */}
                    <div className="text-center">
                      <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2 font-serif">
                        {currentGua.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                        #{currentGua.binary}
                      </p>
                    </div>

                    {/* Gua Detail */}
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
                        <BookOpen size={18} className="mr-2" />
                        卦辞
                      </h4>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {currentGua["gua-detail"]}
                      </p>
                    </div>

                    {/* AI Analysis */}
                    {currentAI && (
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
                          <Brain size={18} className="mr-2" />
                          AI 解析
                        </h4>
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {currentAI}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Yao Detail Toggle */}
                    <div>
                      <button
                        onClick={() => setShowDetail(!showDetail)}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        {showDetail ? "隐藏爻辞" : "显示爻辞"}
                      </button>

                      {showDetail && (
                        <div className="mt-4 space-y-3">
                          {currentGua["yao-detail"].map((detail, index) => (
                            <div
                              key={index}
                              className="border-l-4 border-slate-300 dark:border-slate-600 pl-4"
                            >
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                {detail}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </animated.div>
    </animated.div>
  );
};

export default DivinationDialog;

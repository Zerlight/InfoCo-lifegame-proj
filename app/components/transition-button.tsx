import clsx from "clsx";
import { useSpring, animated } from "@react-spring/web";
import useMeasure from "react-use-measure";

export default function TButton({
  children,
  className,
  activated,
  activatedContent,
  disabled,
  hidden,
  onClick,
  ...props
}: {
  children:
    | React.ReactNode
    | [React.ReactNode]
    | [React.ReactNode, React.ReactNode];
  className?: string;
  activated?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  onClick?: () => void;
  [key: string]: any;
}) {
  const [textRef, textMeasure] = useMeasure();
  const [buttonRef, buttonMeasure] = useMeasure();
  const textSpring = useSpring({
    width: activated ? textMeasure.width : 0,
    opacity: activated ? 1 : 0,
    config: { tension: 180, friction: 24 },
  });
  const buttonSpring = useSpring({
    width: hidden ? 0 : buttonMeasure.width,
    opacity: hidden ? 0 : 1,
    config: { tension: 180, friction: 24 },
  });

  return (
    <animated.div
      style={{
        ...buttonSpring,
        pointerEvents: hidden ? "none" : "auto",
      }}
    >
      <button
        className={clsx(
          activated
            ? "dark:bg-slate-600 bg-slate-500 dark:hover:bg-slate-700 hover:bg-slate-600 text-white gap-2"
            : !disabled
            ? "dark:hover:bg-gray-800 hover:bg-gray-100"
            : "opacity-25",
          "flex rounded-full transition-all px-4 py-2 items-center font-semibold dark:outline-slate-600 outline-slate-400 overflow-hidden",
          className
        )}
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
        ref={buttonRef}
        {...props}
      >
        {Array.isArray(children) ? (
          <>
            {children[0]}
            {children[1] && (
              <animated.div
                style={{
                  ...textSpring,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                <span ref={textRef} style={{ display: "inline-block" }}>
                  {children[1]}
                </span>
              </animated.div>
            )}
          </>
        ) : (
          children
        )}
      </button>
    </animated.div>
  );
}

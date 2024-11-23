import { useState } from "react";
import { useSpring, animated } from "@react-spring/web";
import clsx from "clsx";
import { BookOpenText, BrainCircuit } from "lucide-react";
import LoadingSpinner from "@/app/components/loading-spinner";

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
}

const GuaCard = ({
  gua,
  className,
  style,
  aiResponse,
  ...props
}: GuaCardProps) => {
  const [showDetail, setShowDetail] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const spring = useSpring({
    to: {
      rotateY: flipped ? 180 : 0,
    },
    config: { mass: 5, tension: 500, friction: 80 },
    onChange: (props) => {
      if (props.value.rotateY > 90 && !showDetail) {
        setShowDetail(true);
      } else if (props.value.rotateY <= 90 && showDetail) {
        setShowDetail(false);
      }
    },
  });

  return (
    <animated.div
      onClick={() => setFlipped((state) => !state)}
      className={clsx(
        className,
        "flex flex-col gap-2 max-w-96 min-w-80 rounded-3xl shadow-lg p-8 overflow-hidden relative cursor-pointer"
      )}
      style={{
        ...style,
        transform: spring.rotateY.to(
          (rot) => `perspective(600px) rotateY(${rot}deg)`
        ),
      }}
      {...props}
    >
      <div className={clsx("relative", showDetail && "opacity-0")}>
        <span className="text-6xl font-bold font-serif text-white">
          {gua.name}
        </span>
        <span className="text-7xl opacity-10 font-bold font-mono absolute -top-10 -right-9">
          {`#${gua.binary}`}
        </span>
        <BookOpenText className="mt-6 mb-2" />
        <span className="text-sm">{gua["gua-detail"]}</span>
        {aiResponse ? (
          <>
            <BrainCircuit className="mt-6 mb-2" />
            <span className="text-sm overflow-y-scroll">{aiResponse}</span>
          </>
        ) : (
          <LoadingSpinner className="invert opacity-75 mt-4" />
        )}
      </div>
      <div
        className={clsx(
          "absolute inset-0 flex flex-col justify-evenly p-8 ",
          !showDetail && "hidden"
        )}
        style={{
          transform: "rotateY(180deg)",
        }}
      >
        {gua["yao-detail"].map((detail, index) => (
          <span key={index} className="text-sm block">
            {detail}
          </span>
        ))}
      </div>
    </animated.div>
  );
};

export default GuaCard;

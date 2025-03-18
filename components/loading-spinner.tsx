import Image from "next/image";
import spin from "./loading-spin.svg";

const LoadingSpinner = ({
  size = 24,
  className,
  ...props
}: {
  size?: number;
  className?: string;
}) => {
  return (
    <Image
      src={spin}
      height={size}
      width={size}
      alt="Loading"
      className={className}
      {...props}
    />
  );
};

export default LoadingSpinner;

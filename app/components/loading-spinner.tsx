import Image from "next/image";
import spin from "./loading-spin.svg"

const LoadingSpinner = ({ size = 24, ...props }: { size?: number }) => {
  return <Image src={spin} height={size} width={size} alt="Loading" {...props} />;
};

export default LoadingSpinner;

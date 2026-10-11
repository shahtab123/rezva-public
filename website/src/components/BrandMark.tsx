import Image from "next/image";

export function BrandMark({
  className = "brand-mark",
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

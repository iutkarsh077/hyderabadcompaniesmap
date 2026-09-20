import Link from "next/link";
import React from "react";

interface ProductHuntCardProps {
  href?: string;
}

const ProductHuntCard: React.FC<ProductHuntCardProps> = ({
  href = "#",
}) => {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block w-full max-w-4xl overflow-hidden rounded-2xl border border-[#f5c7c0] bg-[#d83b2d] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex min-h-10 items-center gap-4 px-5 py-4 sm:px-7">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-white shadow-md">
          <div className="text-center leading-none">
            <div className="text-md">🐱</div>
            <span className="text-[7px] font-bold text-[#da552f]">
              Product Hunt
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 text-white">
          <h2 className="text-md font-extrabold tracking-tight">
            🚀 We&apos;re live on Product Hunt now!
          </h2>

          <p className="mt-1 text-sm font-semibold text-white/90 sm:text-base">
            Would love your support 🙏
          </p>
        </div>

        <div className="hidden shrink-0 text-2xl font-bold text-white transition-transform duration-300 group-hover:translate-x-1 sm:block">
          →
        </div>
      </div>
    </Link>
  );
};

export default ProductHuntCard;
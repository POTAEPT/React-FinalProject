import Image from "next/image";

// The MaTee logo, without a background tile: only the dots and the wordmark. Both theme variants are rendered and CSS shows the one that
// matches the active theme (see .brand-light / .brand-dark in globals.css), so
// there is no flash when the theme changes.
const FILES = {
  icon: { light: "/brand/matee-mark.png", dark: "/brand/matee-mark-dark.png", width: 112, height: 124 },
  full: { light: "/brand/matee-lockup.png", dark: "/brand/matee-lockup-dark.png", width: 494, height: 133 },
};

export function BrandLogo({ variant = "full", className = "", priority = false }) {
  const file = FILES[variant];

  return (
    <>
      <Image
        src={file.light}
        alt="MaTee มาตี้กัน"
        width={file.width}
        height={file.height}
        priority={priority}
        className={`brand-light ${className}`}
      />
      <Image
        src={file.dark}
        alt="MaTee มาตี้กัน"
        width={file.width}
        height={file.height}
        priority={priority}
        className={`brand-dark ${className}`}
      />
    </>
  );
}

import localFont from "next/font/local";
import { Noto_Sans_Bengali } from "next/font/google";

/**
 * Google Sans Flex (OFL) is the typeface everywhere. The bundled woff2 is a
 * Latin subset of src/assets/fonts/GoogleSansFlex-…ttf with the weight and
 * optical-size axes kept variable (width, grade, roundness and slant pinned to
 * their defaults), so headlines automatically get the display cut.
 * Bangla glyphs fall through to Noto Sans Bengali, which English pages never
 * download.
 */
export const googleSansFlex = localFont({
  src: "../assets/fonts/google-sans-flex.woff2",
  variable: "--font-flex",
  weight: "1 1000",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const bengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bengali",
  display: "swap",
  preload: false,
});

export const fontVariables = `${googleSansFlex.variable} ${bengali.variable}`;

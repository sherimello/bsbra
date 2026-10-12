/** localStorage key holding the visitor's explicit choice ("light" | "dark"). */
export const THEME_STORAGE_KEY = "bsbra-theme";

/**
 * Applies a saved dark-theme choice before first paint, so returning visitors
 * never see a flash of the light theme. Light is the default: without a saved
 * choice nothing happens. Render it inside <head>.
 */
export function ThemeScript() {
  const code = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

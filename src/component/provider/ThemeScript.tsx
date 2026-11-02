// Runs before paint so the saved/system theme is applied without a flash.
const script = `(function(){try{var s=JSON.parse(localStorage.getItem("theme")||"null");var t=s&&s.state&&s.state.theme;if(!t){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}})();`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

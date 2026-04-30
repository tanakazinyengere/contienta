import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("clippedin-theme");
    if (stored === "light") {
      setIsDark(false);
      document.documentElement.classList.add("light");
    }
  }, []);

  const toggle = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("clippedin-theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("clippedin-theme", "light");
    }
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors press-effect"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};

export default ThemeToggle;

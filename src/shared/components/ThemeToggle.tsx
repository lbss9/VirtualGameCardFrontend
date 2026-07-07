import Icon from "./Icon";
import { useTheme } from "../theme/useTheme";

interface Props {
  floating?: boolean;
}

export default function ThemeToggle({ floating = false }: Props) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle ${floating ? "floating" : ""}`}
      onClick={toggleTheme}
      aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={dark ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <Icon name="sun" />
        <Icon name="moon" />
        <i className={dark ? "theme-toggle-thumb dark" : "theme-toggle-thumb"}>
          <Icon name={dark ? "moon" : "sun"} />
        </i>
      </span>
      <span className="theme-toggle-label">{dark ? "Escuro" : "Claro"}</span>
    </button>
  );
}


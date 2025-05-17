import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../../../context/ThemeContext";
import "./QuickActions.css";

const QuickActions = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="quick-actions-wrapper">
      <div className="quick-actions-theme" onClick={toggleTheme}>
        <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
      </div>
      <div className="quick-actions-language">en</div>
    </div>
  );
};

export default QuickActions;

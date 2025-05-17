import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import "./QuickActions.css";

const LANGUAGES = [{ code: "en" }, { code: "fr" }, { code: "de" }];

const QuickActions = () => {
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();

  return (
    <div className="quick-actions-wrapper">
      <div className="quick-actions-theme" onClick={toggleTheme}>
        <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
      </div>
      <div className="quick-actions-languages">
        {LANGUAGES.map((lang) => (
          <div
            key={lang.code}
            className="quick-actions-language"
            data-active={i18n.language === lang.code ? "true" : "false"}
            onClick={() => i18n.changeLanguage(lang.code)}
          >
            {lang.code}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;

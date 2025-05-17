import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { pelletConfig, type Indicator } from "../../../utils/feedbackPellet";
import { useTranslation } from "react-i18next";
import "./Prompt.css";

interface PromptProps {
  indicator?: Indicator;
}

const Prompt = ({ indicator = "great" }: PromptProps) => {
  const [promptInput, setPromptInput] = useState<string>("");
  const { color, translationKey } = pelletConfig[indicator];
  const { t } = useTranslation();

  return (
    <div className="prompt-wrapper">
      <div className="prompt-wrapper-inner">
        <textarea
          placeholder={t("prompt_placeholder")}
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
        />
        <div className="prompt-actions-wrapper">
          <div className="prompt-feedback-wrapper">
            <div
              className="prompt-feedback-pastel"
              style={{ backgroundColor: color }}
            ></div>
            <span className="prompt-feedback-label">{t(translationKey)}</span>
          </div>
          <div
            className="prompt-action-wrapper"
            data-active={promptInput.replace(/\s+/g, "") != ""}
          >
            <FontAwesomeIcon icon={faArrowUp} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prompt;

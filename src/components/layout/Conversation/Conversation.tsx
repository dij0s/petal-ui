import { useState } from "react";
import Prompt from "../../ui/Prompt";
import { useTranslation } from "react-i18next";
import "./Conversation.css";

type Message = { role: "user" | "assistant"; content: string };

interface ConversationProps {
  messages: Message[];
  onSendPrompt: (prompt: string) => void;
}

const Conversation = ({ messages, onSendPrompt }: ConversationProps) => {
  console.log(messages);

  const [promptInput, setPromptInput] = useState<string>("");
  const { t } = useTranslation();

  return (
    <main>
      <div
        className={"conversation-fallback-wrapper"}
        data-visible={promptInput.trim() === ""}
      >
        <div className="conversation-fallback-welcome">
          {t("welcome_message")}
        </div>
        <div className="conversation-fallback-prompts">
          {(Array.isArray(t("prompt_propositions", { returnObjects: true }))
            ? (t("prompt_propositions", { returnObjects: true }) as string[])
            : []
          ).map((proposition: string, index: number) => (
            <div key={index} className="conversation-fallback-prompt-wrapper">
              <div
                className="conversation-fallback-prompt"
                onClick={() => {
                  setPromptInput(proposition);
                  const input =
                    document.querySelector<HTMLInputElement>(
                      ".prompt-textarea",
                    );
                  if (input) input.focus();
                }}
              >
                {proposition}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Prompt
        promptInput={promptInput}
        setPromptInput={setPromptInput}
        onSend={(prompt) => {
          if (prompt.trim() != "") {
            onSendPrompt(prompt);
            setPromptInput("");
          }
        }}
      />
    </main>
  );
};

export default Conversation;

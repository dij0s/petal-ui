import { useState } from "react";
import Prompt from "../../ui/Prompt";
import { useTranslation } from "react-i18next";
import type { Message } from "../../../types/Message";
import "./Conversation.css";
import Chat from "../../ui/Chat";

interface ConversationProps {
  messages: Message[];
  onSendPrompt: (prompt: string) => void;
  isStreaming: boolean;
}

const Conversation = ({
  messages,
  onSendPrompt,
  isStreaming,
}: ConversationProps) => {
  const [promptInput, setPromptInput] = useState<string>("");
  const { t } = useTranslation();

  return (
    <main>
      {messages.length === 0 && (
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
      )}
      {messages.length > 0 && (
        <div className="conversation-messages-wrapper">
          {messages.map((msg, index) => (
            <Chat key={index} message={msg} />
          ))}
        </div>
      )}
      <Prompt
        promptInput={promptInput}
        setPromptInput={setPromptInput}
        onSend={(prompt) => {
          if (prompt.trim() != "") {
            onSendPrompt(prompt);
            setPromptInput("");
          }
        }}
        disabled={isStreaming}
      />
    </main>
  );
};

export default Conversation;

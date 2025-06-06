import { useState, useRef, useEffect } from "react";
import Prompt from "../../ui/Prompt";
import { useTranslation } from "react-i18next";
import type { Message } from "../../../types/Message";
import Chat from "../../ui/Chat";
import loader from "../../../assets/loader.webp";
import "./Conversation.css";

interface ConversationProps {
  messages: Message[];
  onSendPrompt: (prompt: string) => void;
  isStreaming: boolean;
  processingStatus: string;
  toolCalls: string[];
  thinkingContent?: string;
  isThinking?: boolean;
}

const Conversation = ({
  messages,
  onSendPrompt,
  isStreaming,
  processingStatus,
  thinkingContent = "",
  isThinking = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toolCalls: _toolCalls,
}: ConversationProps) => {
  const [promptInput, setPromptInput] = useState<string>("");
  const { t } = useTranslation();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesWrapperRef = useRef<HTMLDivElement>(null);

  // scroll to bottom whenever
  // a message's content changes
  // or the processing status changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [processingStatus, messages]);

  // scroll during streaming
  useEffect(() => {
    if (isStreaming && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [isStreaming]);

  return (
    <main>
      {isThinking && thinkingContent && (
        <div className="conversation-thinking-notepad">
          <div className="conversation-thinking-header">
            <div className="conversation-thinking-indicator"></div>
            thinking...
          </div>
          <div className="conversation-thinking-content">{thinkingContent}</div>
        </div>
      )}

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
        <div ref={messagesWrapperRef} className="conversation-messages-wrapper">
          {messages.map((msg, index) => (
            <Chat
              key={index}
              message={msg}
              isStreaming={isStreaming && index === messages.length - 1}
            />
          ))}
          {processingStatus !== "" && (
            <div className="conversation-status">
              <div className="conversation-status-loader-wrapper">
                <img
                  src={loader}
                  alt=""
                  className="conversation-status-loader"
                />
              </div>
              <div className="conversation-processing-status">
                {processingStatus}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
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

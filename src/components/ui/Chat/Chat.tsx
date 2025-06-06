import type { Message } from "../../../types/Message";
import ReactMarkdown from "react-markdown";
import "./Chat.css";

interface ChatProps {
  message: Message;
  isStreaming?: boolean;
}

const Chat = ({ message, isStreaming = false }: ChatProps) => {
  return (
    <div className="chat-wrapper" data-source={message.role}>
      <div className="chat">
        {message.role === "assistant" ? (
          <div className="chat-markdown-content">
            <ReactMarkdown
              components={{
                h3: ({ children }) => (
                  <h3 className="chat-markdown-h3">{children}</h3>
                ),
                h4: ({ children }) => (
                  <h4 className="chat-markdown-h4">{children}</h4>
                ),
                p: ({ children }) => (
                  <p className="chat-markdown-p">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="chat-markdown-strong">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="chat-markdown-em">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="chat-markdown-ul">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="chat-markdown-ol">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="chat-markdown-li">{children}</li>
                ),
                hr: ({ children }) => (
                  <hr className="chat-markdown-hr">{children}</hr>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            {isStreaming && <span className="typewriter-cursor"></span>}
          </div>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
};

export default Chat;

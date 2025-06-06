import type { Message } from "../../../types/Message";
import "./Chat.css";

interface ChatProps {
  message: Message;
  isStreaming?: boolean;
}

const Chat = ({ message, isStreaming = false }: ChatProps) => {
  return (
    <div className="chat-wrapper" data-source={message.role}>
      <div className="chat">
        {message.content}
        {isStreaming && message.role === "assistant" && (
          <span className="typewriter-cursor"></span>
        )}
      </div>
    </div>
  );
};

export default Chat;

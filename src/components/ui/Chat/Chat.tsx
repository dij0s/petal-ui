import type { Message } from "../../../types/Message";
import "./Chat.css";

interface ChatProps {
  message: Message;
}

const Chat = ({ message }: ChatProps) => {
  return (
    <div className="chat-wrapper" data-source={message.role}>
      <div className="chat">{message.content}</div>
    </div>
  );
};

export default Chat;

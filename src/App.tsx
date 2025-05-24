import { useState, useRef } from "react";
import Layout from "./components/layout";
import Conversation from "./components/layout/Conversation";
import type { Message } from "./types/Message";
import "./i18n";
import "./App.css";

function App() {
  const [sidebarState, setSidebarState] = useState<"collapsed" | "expanded">(
    "collapsed",
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const [mapState, setMapState] = useState<"hidden" | "visible">("hidden");

  const eventSourceRef = useRef<EventSource | null>(null);
  const USER_ID = "1";

  const handleSendPrompt = async (prompt: string) => {
    setMessages((msgs) => [...msgs, { role: "user", content: prompt }]);
    // send prompt to backend
    const response = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: USER_ID, prompt }),
    });
    if (response.status !== 200) {
      return;
    }

    // start streaming
    if (eventSourceRef.current) eventSourceRef.current.close();
    const es = new EventSource(`/api/stream?user_id=${USER_ID}`);

    setIsStreaming(true);
    let assistantMsg = "";
    es.addEventListener("token", (e) => {
      assistantMsg += e.data;
      setMessages((msgs) => {
        if (msgs[msgs.length - 1]?.role === "assistant") {
          return [
            ...msgs.slice(0, -1),
            { role: "assistant", content: assistantMsg },
          ];
        } else {
          return [...msgs, { role: "assistant", content: assistantMsg }];
        }
      });
    });

    es.addEventListener("end", () => {
      es.close();
      setIsStreaming(false);
    });
    eventSourceRef.current = es;
  };

  return (
    <Layout
      sidebarState={sidebarState}
      setSidebarState={setSidebarState}
      setMapState={setMapState}
      mapState={mapState}
    >
      <Conversation
        messages={messages}
        onSendPrompt={handleSendPrompt}
        isStreaming={isStreaming}
      />
    </Layout>
  );
}

export default App;

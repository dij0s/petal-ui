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

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [toolCalls, setToolCalls] = useState<string[]>([]);

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

    // handle incoming tokens
    es.addEventListener("token", (e) => {
      // reset processing status
      setProcessingStatus("");

      // build message token by token
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

    // handle status updates
    es.addEventListener("info", (e) => {
      const data = JSON.parse(e.data);
      setProcessingStatus(data.content);
    });

    // handle tool call updates
    es.addEventListener("tool_call", (e) => {
      try {
        const data = JSON.parse(e.data);
        setToolCalls((prev) => {
          if (data.isFinished) {
            // remove the tool name if finished
            return prev.filter((name) => name !== data.name);
          } else {
            // add the tool name if
            // not already present
            if (!prev.includes(data.name)) {
              return [...prev, data.name];
            }
            return prev;
          }
        });
      } catch (err) {
        console.error("Invalid tool_call event data", err);
      }
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
        processingStatus={processingStatus}
        toolCalls={toolCalls}
      />
    </Layout>
  );
}

export default App;

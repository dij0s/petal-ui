import { useState, useRef, useCallback } from "react";
import Layout from "./components/layout";
import Conversation from "./components/layout/Conversation";
import { useTranslation } from "react-i18next";
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [toolCalls, _setToolCalls] = useState<string[]>([]);

  const [mapLayers, setMapLayers] = useState<string[]>([]);
  const [mapFocusedMunicipality, setMapFocusedMunicipality] = useState<
    number | null
  >(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const tokenBufferRef = useRef<string>("");
  const animationFrameRef = useRef<number | null>(null);
  const isFirstTokenRef = useRef<boolean>(true);

  const USER_ID = "0";
  const THREAD_ID = "0";

  const { i18n } = useTranslation();

  const flushTokenBuffer = useCallback(() => {
    if (tokenBufferRef.current) {
      const accumulatedTokens = tokenBufferRef.current;
      // flush current tokens buffer
      // and update the message's content
      setMessages((msgs) => {
        if (msgs[msgs.length - 1]?.role === "assistant") {
          return [
            ...msgs.slice(0, -1),
            { role: "assistant", content: accumulatedTokens },
          ];
        } else {
          return [...msgs, { role: "assistant", content: accumulatedTokens }];
        }
      });
    }
    animationFrameRef.current = null;
  }, []);

  const scheduleTokenUpdate = useCallback(() => {
    // schedule current tokens
    // batch flushing
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(flushTokenBuffer);
    }
  }, [flushTokenBuffer]);

  const handleSendPrompt = async (prompt: string) => {
    setMessages((msgs) => [...msgs, { role: "user", content: prompt }]);

    // reset token buffer
    tokenBufferRef.current = "";
    isFirstTokenRef.current = true;

    // cancel pending animation frame
    // presents no risk as frontend
    // disallows prompting as request
    // has not yet been answered
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // send prompt to backend
    const response = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: USER_ID,
        thread_id: THREAD_ID,
        prompt: prompt,
        lang: i18n.language,
      }),
    });
    if (response.status !== 200) {
      return;
    }

    // start streaming
    if (eventSourceRef.current) eventSourceRef.current.close();
    const es = new EventSource(`/api/stream?user_id=${USER_ID}`);

    setIsStreaming(true);

    // handle incoming tokens
    es.addEventListener("token", (e) => {
      // reset processing status
      // on very first received token
      if (isFirstTokenRef.current) {
        setProcessingStatus("");
        isFirstTokenRef.current = false;
      }
      // push token in buffer
      tokenBufferRef.current += e.data;
      // schedule update
      scheduleTokenUpdate();
    });

    // handle status updates
    es.addEventListener("info", (e) => {
      const data = JSON.parse(e.data);
      setProcessingStatus(data.content);
    });

    // handle focused geometry update
    es.addEventListener("sfso_number", (e) => {
      const data = JSON.parse(e.data);
      setMapFocusedMunicipality(Number(data.sfso_number));
    });

    // handle layers update
    es.addEventListener("layers", (e) => {
      const data = JSON.parse(e.data);
      setMapLayers(data.layers);
    });

    // handle end event
    es.addEventListener("end", () => {
      // flush remaining tokens
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      flushTokenBuffer();

      es.close();
      setIsStreaming(false);
    });
    eventSourceRef.current = es;
  };

  return (
    <Layout
      sidebarState={sidebarState}
      setSidebarState={setSidebarState}
      mapLayers={mapLayers}
      focusedMunicipalitySFSO={mapFocusedMunicipality}
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

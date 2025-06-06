import { useState } from "react";
import Layout from "./components/layout";
import Conversation from "./components/layout/Conversation";
import { useTranslation } from "react-i18next";
import { useStreamingChat } from "./utils/useStreamingChat";
import "./i18n";
import "./App.css";

function App() {
  const [sidebarState, setSidebarState] = useState<"collapsed" | "expanded">(
    "collapsed",
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [toolCalls, _setToolCalls] = useState<string[]>([]);

  const USER_ID = "0";
  const THREAD_ID = "0";

  const { i18n } = useTranslation();

  const [streamingState, streamingActions] = useStreamingChat({
    userId: USER_ID,
    threadId: THREAD_ID,
    language: i18n.language,
  });

  return (
    <Layout
      sidebarState={sidebarState}
      setSidebarState={setSidebarState}
      mapLayers={streamingState.mapLayers}
      focusedMunicipalitySFSO={streamingState.mapFocusedMunicipality}
    >
      <Conversation
        messages={streamingState.messages}
        onSendPrompt={streamingActions.sendPrompt}
        isStreaming={streamingState.isStreaming}
        processingStatus={streamingState.processingStatus}
        toolCalls={toolCalls}
      />
    </Layout>
  );
}

export default App;

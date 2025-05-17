import { useState } from "react";
import Layout from "./components/layout";
import Conversation from "./components/layout/Conversation";
import "./i18n";
import "./App.css";

function App() {
  const [sidebarState, setSidebarState] = useState<"collapsed" | "expanded">(
    "collapsed",
  );
  const [mapState, setMapState] = useState<"hidden" | "visible">("hidden");

  return (
    <Layout
      sidebarState={sidebarState}
      setSidebarState={setSidebarState}
      setMapState={setMapState}
      mapState={mapState}
    >
      <Conversation />
    </Layout>
  );
}

export default App;

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Map from "./Map";
import QuickActions from "../ui/QuickActions";
import "./Layout.css";

interface LayoutProps {
  children: ReactNode;
  sidebarState: "collapsed" | "expanded";
  setSidebarState: (state: "collapsed" | "expanded") => void;
  mapState: "hidden" | "visible";
  setMapState: (state: "hidden" | "visible") => void;
}

const Layout = ({
  children,
  sidebarState,
  setSidebarState,
  mapState,
  setMapState,
}: LayoutProps) => {
  return (
    <div
      className="layout-wrapper"
      data-sidebar={sidebarState}
      data-map={mapState}
    >
      <Sidebar sidebarState={sidebarState} setSidebarState={setSidebarState} />
      <div className="main-wrapper">{children}</div>
      {mapState === "visible" && <Map />}
      <QuickActions />
    </div>
  );
};

export default Layout;

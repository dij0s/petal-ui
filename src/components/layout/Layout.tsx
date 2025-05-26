import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Map from "./Map";
import QuickActions from "../ui/QuickActions";
import "./Layout.css";

interface LayoutProps {
  children: ReactNode;
  sidebarState: "collapsed" | "expanded";
  setSidebarState: (state: "collapsed" | "expanded") => void;
  mapLayers: string[];
  focusedMunicipalitySFSO: number | null;
}

const Layout = ({
  children,
  sidebarState,
  setSidebarState,
  mapLayers,
  focusedMunicipalitySFSO,
}: LayoutProps) => {
  return (
    <div
      className="layout-wrapper"
      data-sidebar={sidebarState}
      data-map={mapLayers.length === 0 ? "hidden" : "visible"}
    >
      <Sidebar sidebarState={sidebarState} setSidebarState={setSidebarState} />
      <div className="main-wrapper">{children}</div>
      {mapLayers.length !== 0 && (
        <Map
          mapLayers={mapLayers}
          focusedMunicipalitySFSO={focusedMunicipalitySFSO}
        />
      )}
      <QuickActions />
    </div>
  );
};

export default Layout;

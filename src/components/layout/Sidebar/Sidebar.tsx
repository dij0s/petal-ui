import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTableColumns, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import "./Sidebar.css";

interface SidebarProps {
  sidebarState: "collapsed" | "expanded";
  setSidebarState: (state: "collapsed" | "expanded") => void;
}

const Sidebar = ({ sidebarState, setSidebarState }: SidebarProps) => {
  const { t } = useTranslation();
  const isCollapsed = sidebarState === "collapsed";

  // expand panel container
  const expandPanel = (
    <div className="panel-actions-action">
      <div className="panel-actions-action-sidebar-wrapper panel-actions-action-inner">
        <FontAwesomeIcon
          icon={faTableColumns}
          onClick={() =>
            setSidebarState(isCollapsed ? "expanded" : "collapsed")
          }
        />
      </div>
      <span className="panel-actions-label">
        {isCollapsed ? "" : t("side_panel_close_label")}
      </span>
    </div>
  );

  // new conversation container
  const newConversation = (
    <div className="panel-actions-action">
      <div className="panel-actions-action-conversation-wrapper panel-actions-action-inner">
        <FontAwesomeIcon
          icon={faPlus}
          className="panel-actions-action-conversation"
        />
      </div>
      <span className="panel-actions-label">
        {isCollapsed ? "" : t("side_panel_new_conversation_label")}
      </span>
    </div>
  );

  return (
    <aside>
      <div className="panel-actions-wrapper">
        {expandPanel}
        {newConversation}
      </div>
      {!isCollapsed && <div className="panel-history-wrapper"></div>}
    </aside>
  );
};

export default Sidebar;

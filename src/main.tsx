import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "dexie-export-import";
import { Link, Router } from "react-router-dom";
import { Route, Switch, HashRouter } from "react-router-dom";

import { Categories } from "./categories";
import Memo from "./home";
import { kv } from "./kv";
import { initDevTools } from "./lib/devtools";
import { NotePage } from "./note";
import { Settings } from "./settings";
import { Webdav } from "./settings/webdav";
import { syncHelper } from "./sync/sync-helper";
import { Trash } from "./trash";
import { initCordova } from "./utils/cordova";
(window as any)["syncHelper"] = syncHelper;
(window as any)["kv"] = kv;
initCordova();

function Main() {
  useEffect(() => {
    syncHelper.sync();
    let sync = () => {
      if (document.visibilityState === "visible") {
        syncHelper.sync();
      }
    };
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.addEventListener("visibilitychange", sync);
    };
  }, []);
  return (
    <React.StrictMode>
      <HashRouter>
        <Switch>
          <Route path="/" exact>
            <Memo />
          </Route>
          <Route path="/note/:id">
            <NotePage />
          </Route>
          <Route path="/settings">
            <Settings />
          </Route>
          <Route path="/settings/webdav" component={Webdav} />
          <Route path="/trash" component={Trash} />
          <Route path="/categories" component={Categories} />
          <Route>
            <div>No Match</div>
          </Route>
        </Switch>
      </HashRouter>
    </React.StrictMode>
  );
}
initDevTools().then(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <Main />
  );
});

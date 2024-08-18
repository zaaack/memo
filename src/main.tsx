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
import { Trash } from "./trash";
import { initCordova } from "./utils/cordova";
import { AnimatedSwitch } from "./lib/AnimatedSwitch";
(window as any)["kv"] = kv;
initCordova();

function Main() {
  return (
    <React.StrictMode>
      <HashRouter>
        <AnimatedSwitch>
          <Route path="/" exact>
            <Memo />
          </Route>
          <Route path="/note/:folder/:filename">
            <NotePage />
          </Route>
          <Route path="/settings/webdav" exact component={Webdav} />
          <Route path="/settings" exact>
            <Settings />
          </Route>
          <Route path="/trash" exact component={Trash} />
          <Route path="/categories" exact component={Categories} />
          <Route>
            <div>No Match</div>
          </Route>
        </AnimatedSwitch>
      </HashRouter>
    </React.StrictMode>
  );
}
initDevTools().then(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <Main />
  );
});

import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "dexie-export-import";
import { BrowserRouter, Link, Router } from "react-router-dom";
import { Route, Switch, HashRouter } from "react-router-dom";

import { Folders as Folders } from "./categories";
import Memo from "./home";
import { kv } from "./utils/kv";
import { initDevTools } from "./utils/devtools";
import { NotePage } from "./note";
import { Settings } from "./settings";
import { Webdav } from "./settings/webdav";
import { Trash } from "./trash";
import { initCordova } from "./utils/cordova";
import { AnimatedSwitch } from "./components/AnimatedSwitch";
(window as any)["kv"] = kv;
initCordova();

function Main() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <AnimatedSwitch>
          <Route path="/" exact component={Memo}></Route>
          <Route path="/note/:folder/:filename" component={NotePage}></Route>
          <Route path="/settings/webdav" exact component={Webdav} />
          <Route path="/settings" exact component={Settings}></Route>
          <Route path="/trash" exact component={Trash} />
          <Route path="/folders" exact component={Folders} />
          <Route>
            <div>No Match</div>
          </Route>
        </AnimatedSwitch>
      </BrowserRouter>
    </React.StrictMode>
  );
}
initDevTools().then(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <Main />
  );
});

import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import 'dexie-export-import'
import { Link, Router } from 'react-router-dom'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Categories } from './categories'
import Memo from './home'
import { kv } from './kv'
import { initDevTools } from './lib/devtools'
import { NotePage } from './note'
import { Settings } from './settings'
import { Webdav } from './settings/webdav'
import { syncHelper } from './sync/sync-helper'
;import { Trash } from './trash'
(window as any)['syncHelper'] = syncHelper
;(window as any)['kv'] = kv
function Main() {
  useEffect(() => {
    syncHelper.sync()
    let sync = () => {
      if (document.visibilityState === 'visible') {
        syncHelper.sync()
      }
    }
    document.addEventListener('visibilitychange', sync)
    return () => {
      document.addEventListener('visibilitychange', sync)
    }
  }, [])
  return (
    <React.StrictMode>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Memo />} />
          <Route path="/note/:id" element={<NotePage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/webdav" element={<Webdav />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/categories" element={<Categories />} />

        </Routes>
      </HashRouter>
    </React.StrictMode>
  )
}
initDevTools().then(() => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <Main />
  )
})

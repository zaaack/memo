if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,r)=>{const t=e||("document"in self?document.currentScript.src:"")||location.href;if(s[t])return;let o={};const l=e=>i(e,t),f={module:{uri:t},exports:o,require:l};s[t]=Promise.all(n.map((e=>f[e]||l(e)))).then((e=>(r(...e),o)))}}define(["./workbox-3625d7b0"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/index-4f46357a.css",revision:null},{url:"assets/index-b6f45763.js",revision:null},{url:"index.html",revision:"4914039804230bf7ec2665aeb3b3373e"},{url:"registerSW.js",revision:"402b66900e731ca748771b6fc5e7a068"},{url:"manifest.webmanifest",revision:"3bfa2611436ff9ea6b786bff9bbfe4e3"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));

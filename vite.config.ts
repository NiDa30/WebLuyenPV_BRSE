import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { readdirSync, writeFileSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
export default defineConfig({
  server:{proxy:{'/api':{target:'http://127.0.0.1:8080',changeOrigin:false}}},
  preview:{proxy:{'/api':{target:'http://127.0.0.1:8080',changeOrigin:false}}},
  plugins: [vue(), {
    name:'offline-shell', apply:'build',
    closeBundle() {
      const assets=readdirSync('dist/assets').map(f=>`/assets/${f}`)
      const version=createHash('sha256').update(assets.join()+readFileSync('dist/index.html','utf8')).digest('hex').slice(0,12)
      writeFileSync('dist/sw.js', `const CACHE='brse-shell-${version}';const ASSETS=${JSON.stringify(['/','/index.html',...assets])};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('brse-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;if(ASSETS.includes(u.pathname)&&u.pathname.startsWith('/assets/')){e.respondWith(caches.open(CACHE).then(c=>c.match(u.pathname,{ignoreVary:true})).then(r=>r||fetch(e.request)));return}if(e.request.mode==='navigate')e.respondWith(fetch(e.request).catch(()=>caches.open(CACHE).then(c=>c.match('/index.html',{ignoreVary:true}))))});`)
    }
  }], test: { include: ['tests/*.test.ts'] }
})

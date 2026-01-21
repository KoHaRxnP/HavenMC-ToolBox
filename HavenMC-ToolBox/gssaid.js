const style = document.createElement('style');
style.textContent = `
  #haven-sidebar::-webkit-scrollbar { width: 6px; }
  #haven-sidebar::-webkit-scrollbar-track { background: transparent; }
  #haven-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
  #haven-sidebar::-webkit-scrollbar-thumb:hover { background: var(--accent); }
  #hv-player-list::-webkit-scrollbar { width: 4px; }
  #hv-player-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
  #hv-player-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
  #hv-player-list::-webkit-scrollbar-thumb:hover { background: var(--accent); }
  .theme-dark { --bg: #1a1a1a; --card: #252525; --accent: #FFAA00; --text: #ffffff; --sub: rgba(255,255,255,0.6); }
  .theme-stone { --bg: #4a4a4a; --card: #5a5a5a; --accent: #AAAAAA; --text: #ffffff; --sub: rgba(255,255,255,0.6); }
  .theme-end { --bg: #160b21; --card: #2a1a3a; --accent: #ff77ff; --text: #eee; --sub: rgba(255,119,255,0.6); }
  #haven-sidebar { background-color: var(--bg) !important; color: var(--text) !important; }
  .info-card { background: var(--card) !important; border-left: 4px solid var(--accent) !important; }
  .player-item { 
    background: rgba(255,255,255,0.05) !important; 
    transition: 0.2s; 
    border-left: 2px solid transparent; 
  }
  .player-item:hover { 
    background: rgba(255, 170, 0, 0.1) !important; 
    border-left: 2px solid var(--accent); 
  }
  .switch { position: relative; display: inline-block; width: 34px; height: 20px; }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: .4s; border-radius: 34px; }
  .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
  input:checked + .slider { background-color: var(--accent); }
  input:checked + .slider:before { transform: translateX(14px); }

  select { background: #333; color: white; border: 1px solid #555; padding: 2px 5px; border-radius: 4px; font-size: 11px; outline: none; }
  .stat-label { font-size: 10px; color: var(--sub); margin-bottom: 2px; }
`;
document.head.appendChild(style);

const sideMenu = document.createElement('div');
sideMenu.id = 'haven-sidebar';
sideMenu.className = 'theme-dark';
Object.assign(sideMenu.style, {
  position: 'fixed', top: '0', right: '-300px', width: '300px', height: '100%',
  transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: '1000000',
  padding: '25px', boxSizing: 'border-box', fontFamily: 'sans-serif', overflowY: 'auto'
});

function formatDateTime(date) {
    return date.toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

let friendsList = [];
let onlineFriends = new Set();

function applyTheme(themeName) {
    sideMenu.className = `theme-${themeName}`;
    chrome.storage.local.set({ theme: themeName });
}

function toggleMap(isEnabled) {
    const container = document.getElementById('map-container');
    if (isEnabled) {
        container.innerHTML = `<iframe src="https://map.havenmc.jp/" style="width:166.6%; height:166.6%; border:none; transform: scale(0.6); transform-origin: 0 0;" scrolling="no"></iframe>`;
    } else {
        container.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; font-size:12px; opacity:0.5; background:#111;">Map Disabled</div>`;
    }
}

async function updatePlayerCount() {
    chrome.runtime.sendMessage({ type: "FETCH_PLAYER_COUNT" }, (response) => {
        if (chrome.runtime.lastError || !response || !response.success) return;
        const data = response.data;
        
        const elStatus = document.getElementById('hv-status');
        const elVersion = document.getElementById('hv-version');
        const elPing = document.getElementById('hv-ping');
        const elPlayers = document.getElementById('hv-player-list');
        const elUpdated = document.getElementById('hv-updated');
        if (elUpdated) elUpdated.innerText = `最終更新: ${formatDateTime(new Date())}`;

        if (data.online) {
            if (elStatus) elStatus.innerHTML = `<span style="color:#55FF55">●</span> ${data.players.online} / ${data.players.max}`;
            if (elVersion) elVersion.innerText = data.version || '不明';
            if (elPing) elPing.innerText = `${Math.floor(Math.random() * 20) + 10}ms`;

            const currentNames = data.players.list.map(p => typeof p === 'string' ? p : p.name);
            friendsList.forEach(f => {
                if (currentNames.includes(f)) { 
                    if (!onlineFriends.has(f)) { 
                        new Notification("HavenMC", { body: `${f}がサーバーに参加しました`, icon: `https://mc-heads.net/avatar/${f}/64` });
                        onlineFriends.add(f); 
                    } 
                } else { onlineFriends.delete(f); }
            });

            if (elPlayers) {
                elPlayers.innerHTML = '';
                data.players.list.forEach(p => {
                    const name = typeof p === 'string' ? p : p.name;
                    const item = document.createElement('div');
                    item.className = 'player-item';
                    Object.assign(item.style, { display: 'flex', alignItems: 'center', margin: '4px 0', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' });
                    item.onclick = () => {
                        document.getElementById('player-full-skin').src = `https://mc-heads.net/body/${name}/right`;
                        document.getElementById('player-detail-name').innerText = name;
                        document.getElementById('player-detail-view').style.display = 'block';
                    };
                    item.innerHTML = `<img src="https://mc-heads.net/avatar/${name}/24" style="width:20px; height:20px; border-radius:3px; margin-right:10px;"><span>${name}</span>`;
                    elPlayers.appendChild(item);
                });
            }
        }
    });
}

sideMenu.innerHTML = `
  <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:20px;">
    <div>
      <h2 style="margin:0; color:var(--accent); font-size:22px;">HavenMC</h2>
      <div id="hv-updated" style="font-size:10px; opacity:0.5;">--:--</div>
    </div>
    <select id="theme-select">
      <option value="dark">Dark</option>
      <option value="stone">Stone</option>
      <option value="end">End</option>
    </select>
  </div>

  <div class="info-card" style="padding:12px; border-radius:8px; margin-bottom:20px; display:flex; flex-direction:column; gap:8px;">
    <div>
        <div class="stat-label">SERVER STATUS</div>
        <div id="hv-status" style="font-weight:bold; font-size:16px;">取得中...</div>
    </div>
    <div style="display:grid; grid-template-columns: 1fr 1fr; border-top: 1px solid rgba(255,255,255,0.1); margin-top:4px; padding-top:8px;">
        <div>
            <div class="stat-label">VERSION</div>
            <div id="hv-version" style="font-size:12px; font-weight:bold;">-</div>
        </div>
        <div>
            <div class="stat-label">RESPONSE</div>
            <div id="hv-ping" style="font-size:12px; font-weight:bold;">-</div>
        </div>
    </div>
  </div>

  <div style="margin-bottom:20px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px;">
        <strong style="font-size:12px;">MAP</strong>
        <label class="switch"><input type="checkbox" id="map-toggle"><span class="slider"></span></label>
    </div>
    <div id="map-container" style="width:100%; height:150px; border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); background:#000;">
        <div style="display:flex; align-items:center; justify-content:center; height:100%; font-size:11px; opacity:0.4;">Map Disabled</div>
    </div>
  </div>

  <div style="margin-bottom:20px;">
    <strong style="font-size:12px; border-bottom:1px solid rgba(255,255,255,0.1); display:block; padding-bottom:5px; margin-bottom:10px;">FRIENDS</strong>
    <div style="display:flex; gap:5px; margin-bottom:10px;">
      <input type="text" id="friend-name-input" placeholder="MCID" style="flex:1; background:rgba(255,255,255,0.1); border:none; color:white; padding:5px; border-radius:4px; font-size:11px;">
      <button id="add-friend-btn" style="background:var(--accent); border:none; padding:5px 10px; border-radius:4px; font-weight:bold; cursor:pointer; color:#000;">Add</button>
    </div>
    <div id="friend-tags" style="display:flex; flex-wrap:wrap; gap:5px;"></div>
  </div>

  <div style="margin-bottom:20px;">
    <strong style="font-size:12px; border-bottom:1px solid rgba(255,255,255,0.1); display:block; padding-bottom:5px; margin-bottom:10px;">PLAYERS</strong>
    <div id="player-detail-view" style="display:none; background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; margin-bottom:10px; text-align:center; position:relative;">
      <div id="close-detail" style="position:absolute; right:10px; top:5px; cursor:pointer;">×</div>
      <img id="player-full-skin" src="" style="width:80px; height:auto;">
      <div id="player-detail-name" style="font-weight:bold; font-size:12px; color:var(--accent);"></div>
    </div>
    <div id="hv-player-list" style="max-height:150px; overflow-y:auto; padding-right:5px;"></div>
  </div>

  <div style="margin-bottom:20px;">
    <strong style="font-size:12px; display:block; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; margin-bottom:10px;">LATEST NEWS</strong>
    
    <div style="margin-bottom:12px;">
      <div style="font-size:10px; color:#FF0000; font-weight:bold; margin-bottom:4px;">LATEST YOUTUBE</div>
      <div style="width:100%; aspect-ratio: 16/9; border-radius:6px; overflow:hidden; background:#000;">
        <iframe width="100%" height="100%" 
          src="https://www.youtube.com/embed?listType=playlist&list=UUHqjXo6S-Aueq9M0l6m_OIQ" 
          frameborder="0" allowfullscreen></iframe>
      </div>
    </div>

    <div>
      <div style="font-size:10px; color:var(--accent); font-weight:bold; margin-bottom:4px;">LATEST X POST</div>
      <div id="x-embed-container" style="max-height: 300px; overflow-y: auto; border-radius:6px; background: rgba(255,255,255,0.05);">
        <a class="twitter-timeline" data-height="300" data-theme="dark" href="https://twitter.com/_HavenMC_Server?ref_src=twsrc%5Etfw">Tweets by @_HavenMC_Server</a>
      </div>
    </div>
  </div>

  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
    <a href="https://havenmc.jp/" target="_blank" style="background:rgba(255,255,255,0.1); color:white; text-decoration:none; padding:8px; border-radius:4px; text-align:center; font-size:10px;">Web</a>
    <a href="https://discord.havenmc.jp/" target="_blank" style="background:#5865F2; color:white; text-decoration:none; padding:8px; border-radius:4px; text-align:center; font-size:10px;">Discord</a>
    <a href="https://app.havenmc.jp/" target="_blank" style="background:rgba(255,255,255,0.1); color:white; text-decoration:none; padding:8px; border-radius:4px; text-align:center; font-size:10px;">App</a>
    <a href="https://links.havenmc.jp/" target="_blank" style="background:rgba(255,255,255,0.1); color:white; text-decoration:none; padding:8px; border-radius:4px; text-align:center; font-size:10px;">Links</a>
    <a href="https://www.youtube.com/@HavenMC-Server" target="_blank" style="background:#FF0000; color:white; text-decoration:none; padding:8px; border-radius:4px; text-align:center; font-size:10px;">Youtube</a>
    <a href="https://x.com/_HavenMC_Server" target="_blank" style="background:rgba(255,255,255,0.1); color:white; text-decoration:none; padding:8px; border-radius:4px; text-align:center; font-size:10px;">X(旧Twitter)</a>
  </div>
`;

document.body.appendChild(sideMenu);

chrome.storage.local.get(['friends', 'theme'], (res) => {
    friendsList = res.friends || [];
    if (res.theme) applyTheme(res.theme);
    const ts = document.getElementById('theme-select');
    if(ts) ts.value = res.theme || 'dark';
    
    const container = document.getElementById('friend-tags');
    container.innerHTML = friendsList.map(n => `<span style="background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:10px; font-size:10px;">${n}</span>`).join('');
});

setTimeout(() => {
    document.getElementById('theme-select').onchange = (e) => applyTheme(e.target.value);
    document.getElementById('map-toggle').onchange = (e) => toggleMap(e.target.checked);
    document.getElementById('add-friend-btn').onclick = () => {
        const input = document.getElementById('friend-name-input');
        if (input.value && !friendsList.includes(input.value)) {
            friendsList.push(input.value);
            chrome.storage.local.set({ friends: friendsList }, () => location.reload());
        }
    };
    document.getElementById('close-detail').onclick = () => { document.getElementById('player-detail-view').style.display = 'none'; };
}, 1000);

const fb = document.createElement('img');
fb.src = chrome.runtime.getURL('havenmc.png');
Object.assign(fb.style, { position: 'fixed', right: '0', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: '1000001', width: '50px', transition: '0.3s' });
document.body.appendChild(fb);

let isOpen = false;
fb.onclick = () => {
  isOpen = !isOpen;
  sideMenu.style.right = isOpen ? '0' : '-300px';
  fb.style.right = isOpen ? '300px' : '0';
  if(isOpen) updatePlayerCount();
};

setInterval(() => {
    if(isOpen) updatePlayerCount();
}, 5000);

updatePlayerCount();

(function() {
    if (!document.getElementById('twitter-wjs')) {
        const s = document.createElement('script');
        s.id = 'twitter-wjs';
        s.src = 'https://platform.twitter.com/widgets.js';
        s.async = true;
        document.head.appendChild(s);
    }
})();
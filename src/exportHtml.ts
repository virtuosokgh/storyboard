import { Badge, FigmaFrame } from './types'

async function imageUrlToBase64(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function exportAsHtml(frame: FigmaFrame, badges: Badge[]): Promise<void> {
  const base64 = await imageUrlToBase64(frame.imageUrl)

  const badgesJson = JSON.stringify(
    badges.map(b => ({ id: b.id, label: b.label, x: b.x, y: b.y, description: b.description }))
  )

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${escHtml(frame.name)} — Storyboard</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0f0f11;--surface:#1a1a1f;--surface2:#242429;--border:#2e2e36;
  --accent:#7c6ef7;--text:#e8e8ef;--text-muted:#7a7a8a;
  --badge:#7c6ef7;--radius:8px;
}
html,body{height:100%;background:var(--bg);color:var(--text);
  font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;
  font-size:14px;line-height:1.5}
button{cursor:pointer;border:none;background:none;font:inherit;color:inherit}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}

/* ── 레이아웃 ── */
.app{display:flex;flex-direction:column;height:100vh;overflow:hidden}
.topbar{
  display:flex;align-items:center;justify-content:space-between;
  padding:0 20px;height:52px;background:var(--surface);
  border-bottom:1px solid var(--border);flex-shrink:0;gap:16px
}
.brand{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700}
.brand svg{flex-shrink:0}
.frame-label{font-size:13px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.figma-link{
  display:flex;align-items:center;gap:6px;font-size:12px;color:var(--accent);
  text-decoration:none;font-weight:500;white-space:nowrap;transition:color .15s
}
.figma-link:hover{color:#9b90f9}
.body{display:flex;flex:1;overflow:hidden}

/* ── 캔버스 ── */
.canvas{
  flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;
  background:
    radial-gradient(circle,rgba(124,110,247,.04) 0%,transparent 70%),
    repeating-conic-gradient(rgba(255,255,255,.03) 0% 25%,transparent 0% 50%) 0 0/24px 24px;
  padding:32px;position:relative
}
.img-wrap{position:relative;display:inline-block;line-height:0}
.img-wrap img{
  max-width:100%;height:auto;border-radius:6px;
  box-shadow:0 8px 40px rgba(0,0,0,.6);display:block;user-select:none
}

/* ── 뱃지 ── */
.badge{
  position:absolute;transform:translate(-50%,-50%);
  width:28px;height:28px;border-radius:50%;
  background:var(--badge);color:#fff;
  font-size:11px;font-weight:700;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;user-select:none;
  box-shadow:0 2px 8px rgba(0,0,0,.5),0 0 0 2px rgba(255,255,255,.12);
  transition:transform .15s,box-shadow .15s;z-index:10
}
.badge:hover{transform:translate(-50%,-50%) scale(1.15);box-shadow:0 4px 16px rgba(124,110,247,.6),0 0 0 2px rgba(255,255,255,.2)}
.badge.active{
  background:#fff;color:var(--accent);
  box-shadow:0 0 0 3px var(--accent),0 4px 16px rgba(124,110,247,.5);
  transform:translate(-50%,-50%) scale(1.15);z-index:20
}

/* ── 사이드 패널 ── */
.panel{
  width:300px;min-width:300px;background:var(--surface);
  border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden
}
.panel-head{
  display:flex;align-items:center;gap:8px;
  padding:16px 20px;border-bottom:1px solid var(--border);flex-shrink:0
}
.panel-head h2{font-size:14px;font-weight:700}
.cnt{
  background:var(--accent);color:#fff;font-size:11px;font-weight:700;
  padding:1px 6px;border-radius:10px;line-height:18px
}
.list{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.entry{
  background:var(--surface2);border:1px solid var(--border);
  border-radius:var(--radius);padding:12px 14px;cursor:pointer;
  transition:border-color .15s,background .15s
}
.entry:hover{border-color:rgba(124,110,247,.4)}
.entry.active{border-color:var(--accent);background:rgba(124,110,247,.08)}
.entry-top{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.pin{
  width:24px;height:24px;border-radius:50%;background:var(--badge);color:#fff;
  font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0
}
.entry.active .pin{background:#9b90f9;box-shadow:0 0 0 2px rgba(124,110,247,.4)}
.entry-label{font-size:13px;font-weight:600;color:var(--text)}
.entry-desc{font-size:13px;color:var(--text);line-height:1.6;white-space:pre-wrap;word-break:break-word}
.entry-desc.empty{color:var(--text-muted);font-style:italic}

.empty-state{
  flex:1;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:16px;padding:32px;color:var(--text-muted);text-align:center
}
.empty-state svg{opacity:.3}
.empty-state p{font-size:13px;line-height:1.6}

/* ── 반응형 ── */
@media(max-width:640px){
  .panel{width:100%;min-width:unset;border-left:none;border-top:1px solid var(--border);max-height:40vh}
  .body{flex-direction:column}
}
</style>
</head>
<body>
<div class="app">
  <header class="topbar">
    <div class="brand">
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="7" fill="#7c6ef7"/>
        <path d="M8 10h6a4 4 0 010 8H8V10z" fill="white" opacity=".9"/>
        <circle cx="20" cy="22" r="4" fill="white" opacity=".7"/>
      </svg>
      Storyboard
    </div>
    <span class="frame-label">${escHtml(frame.name)}</span>
    <a class="figma-link" href="${escHtml(frame.figmaUrl)}" target="_blank" rel="noreferrer">
      <svg width="14" height="14" viewBox="0 0 38 57" fill="none">
        <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" fill="#1ABCFE"/>
        <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 0 1-19 0z" fill="#0ACF83"/>
        <path d="M19 0v19h9.5a9.5 9.5 0 0 0 0-19H19z" fill="#FF7262"/>
        <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" fill="#F24E1E"/>
        <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" fill="#A259FF"/>
      </svg>
      Figma에서 디자인 스펙 확인 ↗
    </a>
  </header>

  <div class="body">
    <div class="canvas" id="canvas">
      <div class="img-wrap" id="imgWrap">
        <img id="mainImg" src="${base64}" alt="${escHtml(frame.name)}" draggable="false"/>
      </div>
    </div>

    <aside class="panel">
      <div class="panel-head">
        <h2>주석</h2>
        <span class="cnt" id="cnt">0</span>
      </div>
      <div class="list" id="list"></div>
    </aside>
  </div>
</div>

<script>
(function(){
  const badges = ${badgesJson};
  const img = document.getElementById('mainImg');
  const wrap = document.getElementById('imgWrap');
  const list = document.getElementById('list');
  const cnt  = document.getElementById('cnt');
  let selected = null;

  cnt.textContent = badges.length;

  function renderBadges(){
    wrap.querySelectorAll('.badge').forEach(el => el.remove());
    badges.forEach(b => {
      const el = document.createElement('div');
      el.className = 'badge' + (b.id === selected ? ' active' : '');
      el.style.left = (b.x * 100) + '%';
      el.style.top  = (b.y * 100) + '%';
      el.textContent = b.label;
      el.dataset.id = b.id;
      el.addEventListener('click', () => selectBadge(b.id));
      wrap.appendChild(el);
    });
  }

  function renderList(){
    list.innerHTML = '';
    if(badges.length === 0){
      list.innerHTML = '<div class="empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 2"/><path d="M12 8v4m0 4h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><p>등록된 주석이 없습니다.</p></div>';
      return;
    }
    badges.forEach((b, i) => {
      const el = document.createElement('div');
      el.className = 'entry' + (b.id === selected ? ' active' : '');
      el.dataset.id = b.id;
      el.innerHTML = \`
        <div class="entry-top">
          <div class="pin">\${esc(b.label)}</div>
          <span class="entry-label">#\${i+1} \${esc(b.label)}</span>
        </div>
        <div class="entry-desc \${b.description ? '' : 'empty'}">\${esc(b.description || '설명 없음')}</div>
      \`;
      el.addEventListener('click', () => selectBadge(b.id));
      list.appendChild(el);
    });
  }

  function selectBadge(id){
    selected = selected === id ? null : id;
    renderBadges();
    renderList();
    if(selected){
      const entry = list.querySelector('[data-id="'+selected+'"]');
      if(entry) entry.scrollIntoView({block:'nearest',behavior:'smooth'});
    }
  }

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

  img.addEventListener('load', () => { renderBadges(); renderList(); });
  if(img.complete) { renderBadges(); renderList(); }
})();
</script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `storyboard-${frame.name.replace(/\s+/g, '-')}.html`
  a.click()
  URL.revokeObjectURL(url)
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

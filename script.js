(() => {
  const cfg = window.PORTFOLIO_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  function setCfg() {
    $$("[data-cfg]").forEach(el => {
      const key = el.dataset.cfg;
      if (cfg[key] != null) el.textContent = cfg[key];
    });
    $("#heroAvatar").src = cfg.avatar || "https://mc-heads.net/avatar/Steve/256";
    $("#emailText").textContent = cfg.email || "No configurado";
    $("#emailLink").href = cfg.email ? `mailto:${cfg.email}` : "#";
    $("#discordText").textContent = cfg.discord || "Discord";
    $("#discordLink").href = cfg.discordInvite || "#";
    $("#year").textContent = new Date().getFullYear();
  }

  function renderMetrics() {
    $("#metrics").innerHTML = (cfg.metrics || []).map((m,i)=>`
      <article class="metric glass reveal" style="--d:${i*80}ms"><strong>${esc(m.value)}</strong><span>${esc(m.label)}</span></article>`).join("");
  }

  function renderExperience() {
    $("#experienceList").innerHTML = (cfg.experience || []).map((e,i)=>`
      <article class="timeline-item reveal" style="--d:${i*100}ms">
        <div class="timeline-dot"></div><div class="timeline-card">
          <div class="timeline-top"><div><small>${esc(e.server)}</small><h3>${esc(e.role)}</h3></div><b>${esc(e.players)}</b></div>
          <p>${esc(e.text)}</p><div class="tags">${(e.tags||[]).map(t=>`<span>#${esc(t)}</span>`).join("")}</div>
        </div>
      </article>`).join("");
  }

  function renderSkills() {
    $("#skills").innerHTML = (cfg.skills || []).map((s,i)=>`
      <article class="skill-card reveal" style="--d:${i*70}ms"><div class="skill-icon">${esc(s.icon)}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><div class="skill-line"></div></article>`).join("");
  }

  function renderServers() {
    $("#servers").innerHTML = (cfg.servers || []).map((s,i)=>`
      <article class="server-card reveal" style="--d:${i*70}ms"><div class="server-logo">${esc((s.name||"?")[0])}</div><div><small>${esc(s.status)}</small><h3>${esc(s.name)}</h3><p>${esc(s.role)}</p></div><span>${esc(s.accent || "AZUL")}</span></article>`).join("");
  }

  function esc(v){ return String(v ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

  function reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if(e.isIntersecting){ e.target.classList.add("show"); io.unobserve(e.target); }
    }), {threshold:.12});
    $$(".reveal").forEach(el => io.observe(el));
  }

  async function discordStatus() {
    const id = cfg.discordUserId;
    if (!id) return setDiscord("offline","Discord no configurado","");
    try {
      const r = await fetch(`https://api.lanyard.rest/v1/users/${encodeURIComponent(id)}`, {cache:"no-store"});
      if (!r.ok) throw new Error();
      const d = await r.json();
      const st = d.data?.discord_status || "offline";
      const map = {online:["ONLINE","online"],idle:["AUSENTE","idle"],dnd:["NO MOLESTAR","dnd"],offline:["DESCONectado","offline"]};
      const [label,cls] = map[st] || map.offline;
      const activity = d.data?.activities?.find(a => a.type === 0);
      setDiscord(cls,label, activity ? `• ${activity.name}` : "• Discord");
    } catch { setDiscord("offline","NO DISPONIBLE","• Configura Lanyard para presencia real"); }
  }
  function setDiscord(cls,label,activity){
    const dot=$("#discordDot"); dot.className="status-dot "+cls;
    $("#discordStatus").textContent=label;
    $("#discordActivity").textContent=activity;
    $("#statusCard").textContent=`● ${label}`;
  }

  $("#menuBtn").addEventListener("click",()=>$("#navLinks").classList.toggle("open"));
  $$("#navLinks a").forEach(a=>a.addEventListener("click",()=>$("#navLinks").classList.remove("open")));
  $("#contactForm").addEventListener("submit",e=>{
    e.preventDefault();
    const name=$("#fName").value.trim(), discord=$("#fDiscord").value.trim(), msg=$("#fMessage").value.trim();
    const target = cfg.email || "";
    const subject = encodeURIComponent(`Contacto desde portafolio — ${name}`);
    const body = encodeURIComponent(`Nombre: ${name}\nDiscord: ${discord}\n\nMensaje:\n${msg}`);
    if(target) location.href=`mailto:${target}?subject=${subject}&body=${body}`;
    else alert("Configura un correo en config.js.");
  });

  setCfg(); renderMetrics(); renderExperience(); renderSkills(); renderServers(); reveal(); discordStatus();
})();
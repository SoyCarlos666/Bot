(() => {
  const KEY="hadessei_admin_config_v2";
  const original=JSON.parse(JSON.stringify(window.PORTFOLIO_CONFIG||{}));
  let data=JSON.parse(localStorage.getItem(KEY)||"null")||JSON.parse(JSON.stringify(original));
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const save=()=>{localStorage.setItem(KEY,JSON.stringify(data));toast("Guardado en este navegador");};
  const toast=t=>{const x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1600)};
  function render(){
    $$("[data-key]").forEach(el=>{const k=el.dataset.key;el.value=data[k]??""});
    renderList("metrics",["value","label"],["Valor","Etiqueta"]);
    renderList("experience",["server","role","players","text","tags"],["Servidor","Rol","Jugadores","Descripción","Etiquetas (separadas por coma)"]);
    renderList("skills",["icon","title","text"],["Icono","Título","Descripción"]);
    renderList("servers",["name","role","status","accent"],["Nombre","Rol","Estado","Color"]);
  }
  function renderList(type,fields,labels){
    const box=$("#"+type+"Editor"); if(!box)return;
    box.innerHTML=(data[type]||[]).map((item,i)=>`<div class="editor-card"><button class="remove" data-remove="${type}" data-i="${i}">Eliminar</button><h3>${type.toUpperCase()} ${i+1}</h3>${fields.map((f,j)=>`<label>${labels[j]}<${f==="text"||f==="tags"?"textarea":"input"} data-list="${type}" data-i="${i}" data-f="${f}">${f==="tags"?Array.isArray(item[f])?item[f].join(", "):item[f]||"":f==="text"?item[f]||"":item[f]||""}</${f==="text"||f==="tags"?"textarea":"input"}></label>`).join("")}</div>`).join("");
  }
  function bind(){
    $$("[data-key]").forEach(el=>el.oninput=()=>{data[el.dataset.key]=el.value;save()});
    $$("[data-list]").forEach(el=>el.oninput=()=>{const {list,i,f}=el.dataset;data[list][i][f]=f==="tags"?el.value.split(",").map(x=>x.trim()).filter(Boolean):el.value;save()});
    $$("[data-remove]").forEach(b=>b.onclick=()=>{data[b.dataset.remove].splice(+b.dataset.i,1);save();render();bind()});
  }
  $$(".tab").forEach(b=>b.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));$$(".panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#"+b.dataset.tab).classList.add("active")});
  $$("[data-add]").forEach(b=>b.onclick=()=>{const t=b.dataset.add;const blank={metrics:{value:"0+",label:"NUEVA MÉTRICA"},experience:{server:"NUEVO SERVIDOR",role:"Rol",players:"0+ Jugadores",text:"Descripción del trabajo.",tags:["Gestión"]},skills:{icon:"◆",title:"NUEVA HABILIDAD",text:"Descripción."},servers:{name:"NUEVO SERVIDOR",role:"Rol",status:"Próximamente",accent:"AZUL"}};data[t].push(blank[t]);save();render();bind()});
  $("#loginBtn").onclick=()=>{if($("#pass").value==="Hades661"){$("#login").classList.add("hidden");$("#app").classList.remove("hidden");render();bind()}else toast("Contraseña incorrecta")};
  $("#pass").addEventListener("keydown",e=>{if(e.key==="Enter")$("#loginBtn").click()});
  $("#logoutBtn").onclick=()=>location.reload();
  $("#resetBtn").onclick=()=>{if(confirm("¿Restaurar la configuración inicial?")){data=JSON.parse(JSON.stringify(original));save();render();bind()}};
  $("#exportBtn").onclick=()=>{
    const js="window.PORTFOLIO_CONFIG = "+JSON.stringify(data,null,2)+";\n";
    const blob=new Blob([js],{type:"text/javascript"}),a=document.createElement("a");
    a.href=URL.createObjectURL(blob);a.download="config.js";a.click();URL.revokeObjectURL(a.href);toast("config.js exportado");
  };
})();
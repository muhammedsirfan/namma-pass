const $=i=>document.getElementById(i),O={x:0,y:0},SP=18,WT=3,TR=44;
const AREAS=[["HSR Layout",-3,-5],["Koramangala",-6,-6.5],["Sarjapur Road",3,-6.5],["Marathahalli",6,3.5],["BTM Layout",-7,-9.5]];
const MAXV=()=>+$("v").value;
const inr=v=>"₹"+Math.round(v).toLocaleString("en-IN");
const hm=t=>String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0");
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const px=x=>(x+10)*20,py=y=>(6-y)*20,col=i=>`hsl(${(i*47)%360} 62% 46%)`;
let seed=7,sel=0,R=[],G=[],W=[];
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function gen(n){const r=rng(seed),g=()=>Math.sqrt(-2*Math.log(1-r()))*Math.cos(6.2832*r());R=[];
 for(let i=0;i<n;i++){const a=AREAS[Math.floor(r()*AREAS.length)];let t=Math.round((510+g()*45)/5)*5;t=Math.max(420,Math.min(600,t));
  R.push({id:i+1,area:a[0],x:a[1]+g()*1.1,y:a[2]+g()*1.1,t})}}
function order(g){const o=[g[0]],rest=g.slice(1);while(rest.length){const l=o[o.length-1];rest.sort((a,b)=>d(a,l)-d(b,l));o.push(rest.shift())}return o}
function ev(g){const o=order(g),n=o.length,leg=o.map((r,i)=>d(r,i<n-1?o[i+1]:O));let rem=0;const add=[];
 for(let i=n-1;i>=0;i--){rem+=leg[i];add[i]=rem*1.3/SP*60+WT*(n-1-i)-d(o[i],O)*1.3/SP*60}
 return{o,add,max:Math.max(...add)}}
function mk(g,idx){const e=ev(g),f=1.4/g.length;
 const rs=e.o.map((r,i)=>{const fare=Math.round(30+8*d(r,O)*1.3);return{...r,fare,seat:Math.round(fare*f),add:e.add[i]}});
 const col_=rs.reduce((s,r)=>s+r.seat,0),pay=col_;
 return{idx,rs,size:rs.length,collected:col_,pay,margin:col_-pay,max:e.max,t0:Math.min(...rs.map(r=>r.t)),t1:Math.max(...rs.map(r=>r.t)),area:rs[0].area}}
function build(cap){G=[];W=[];const un=[...R].sort((a,b)=>d(b,O)-d(a,O));
 while(un.length){const s=un.shift();
  let g=[s,...un.filter(r=>Math.abs(r.t-s.t)<=15&&d(r,s)<=3.5).sort((a,b)=>d(a,s)-d(b,s)).slice(0,MAXV()-1)];
  while(g.length>=3&&ev(g).max>cap)g.pop();
  if(g.length>=3){g.slice(1).forEach(r=>un.splice(un.indexOf(r),1));G.push(mk(g,G.length))}else W.push(s)}}
function render(){
 const cap=+$("c").value,disc=0,emp=+$("e").value/100;
 $("vN").textContent=$("n").value;$("vC").textContent=cap+" min";
 build(cap);
 const gr=G.flatMap(g=>g.rs),sf=gr.reduce((s,r)=>s+r.fare,0),ss=gr.reduce((s,r)=>s+r.seat,0),
  bill=gr.length?ss/gr.length*TR*(1-emp):0,solo=gr.length?sf/gr.length*TR:0,
  sub=MAXV()==3?25:90,pd=G.length?G.reduce((s,g)=>s+g.collected,0)/G.length*2-sub:0,
  sd=G.length?G.reduce((s,g)=>s+g.rs.reduce((a,r)=>a+r.fare,0)/g.size,0)/G.length*2-sub:0;
 $("kpis").innerHTML=[
  [gr.length+" of "+R.length,"riders placed in groups ("+W.length+" waitlisted)"],
  [gr.length?Math.round((1-ss/sf)*100)+"%":"–","cheaper per trip than a solo ride"],
  [(gr.length-G.length)+" fewer vehicles","on the road in the peak windows"],
  [inr(bill)+" a month","average rider bill, against "+inr(solo)+" solo"],
  [inr(pd)+" a day","driver net from the two peak trips, against "+inr(sd)+" solo (after the ₹"+sub+" daily subscription)"],
  ["₹0","commission. Every fare goes to the driver"],
  [G.length?G.filter(g=>g.size==MAXV()).length+" of "+G.length:"–","groups at full strength ("+MAXV()+" riders)"],
  [G.length?Math.round(G.reduce((s,g)=>s+g.max,0)/G.length)+" min":"–","average worst extra time per group"]
 ].map(k=>`<div class="kpi"><strong>${k[0]}</strong><span>${k[1]}</span></div>`).join("");
 if(sel>=G.length)sel=0;
 $("gc").textContent="("+G.length+")";
 $("list").innerHTML=G.map((g,i)=>`<li tabindex="0" role="option" data-i="${i}" aria-selected="${i==sel}"><span class="dot" style="background:${col(i)}"></span><span>${g.area} group<small>${hm(g.t0)} to ${hm(g.t1)} pickup, ${g.size} riders, up to ${Math.round(g.max)} min extra</small></span><span style="text-align:right">${inr(g.rs[0].seat)}<small>a seat</small></span></li>`).join("")||"<li>No groups. Raise the extra-time cap or add riders.</li>";
 drawMap();detail(disc,emp)}
function drawMap(){let s="";
 [-8,-4,0,4,8].forEach(x=>s+=`<line x1="${px(x)}" y1="0" x2="${px(x)}" y2="360" stroke="var(--line)" stroke-width=".5"/>`);
 [-10,-6,-2,2,6].forEach(y=>s+=`<line x1="0" y1="${py(y)}" x2="380" y2="${py(y)}" stroke="var(--line)" stroke-width=".5"/>`);
 AREAS.forEach(a=>s+=`<text x="${px(a[1])}" y="${py(a[2])-30}" font-size="9" fill="var(--mute)" text-anchor="middle">${a[0]}</text>`);
 W.forEach(r=>s+=`<circle cx="${px(r.x)}" cy="${py(r.y)}" r="3" fill="none" stroke="var(--mute)" stroke-width="1"/>`);
 G.forEach((g,i)=>g.rs.forEach(r=>s+=`<circle cx="${px(r.x)}" cy="${py(r.y)}" r="${i==sel?4.2:3}" fill="${col(i)}" opacity="${i==sel?1:.75}"/>`));
 const g=G[sel];
 if(g){const pts=g.rs.map(r=>px(r.x)+","+py(r.y)).concat(px(0)+","+py(0)).join(" ");
  s+=`<polyline points="${pts}" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-dasharray="4 3"/>`;
  g.rs.forEach((r,i)=>s+=`<circle cx="${px(r.x)}" cy="${py(r.y)}" r="7" fill="var(--ink)"/><text x="${px(r.x)}" y="${py(r.y)+3.5}" font-size="10" font-weight="700" fill="var(--card)" text-anchor="middle">${i+1}</text>`)}
 s+=`<path d="M${px(0)} ${py(0)-9}l2.6 6.2 6.4.4-5 4.2 1.7 6.3-5.7-3.5-5.7 3.5 1.7-6.3-5-4.2 6.4-.4z" fill="var(--y)" stroke="var(--ink)" stroke-width="1"/>`;
 $("map").innerHTML=s}
function detail(disc,emp){const g=G[sel];
 if(!g){$("dt").textContent="Select a group";$("tb").innerHTML="";return}
 $("dt").textContent=g.area+" group: pickup order and prices";
 $("tb").innerHTML=`<tr><th>Stop</th><th>Area</th><th>Pickup</th><th class="n">Extra time</th><th class="n">Solo fare</th><th class="n">Seat</th><th class="n">Monthly</th></tr>`+
 g.rs.map((r,i)=>`<tr><td>${i+1}</td><td>${r.area}</td><td>${hm(r.t)}</td><td class="n ${r.add>+$("c").value*.9?"warn":""}">${Math.round(r.add)} min</td><td class="n">${inr(r.fare)}</td><td class="n">${inr(r.seat)}</td><td class="n">${inr(r.seat*TR*(1-disc)*(1-emp))}</td></tr>`).join("")+
 `<tr><td colspan="5"><b>Group total per trip</b>: riders pay ${inr(g.collected)}, all of it goes to the driver</td><td class="n" colspan="2"><b>Commission ₹0</b></td></tr>`}
$("list").addEventListener("click",e=>{const li=e.target.closest("li[data-i]");if(li){sel=+li.dataset.i;render()}});
$("list").addEventListener("keydown",e=>{if(e.key=="Enter"||e.key==" "){const li=e.target.closest("li[data-i]");if(li){e.preventDefault();sel=+li.dataset.i;render()}}});
$("n").oninput=()=>{gen(+$("n").value);render()};
["c","v","e"].forEach(i=>$(i).oninput=render);
$("r").onclick=()=>{seed=Math.floor(Math.random()*9999)+1;gen(+$("n").value);render()};
gen(250);render();

const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=s=>document.querySelector(s)||document.createElement('div'); /* missing element on this page -> harmless stand-in */
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;

/* ================= data ================= */
const ARROW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
/* real portfolio slides from Adverex's own portfolio folder: [file, platform, service, location, goal] */
const WORK=[["g02.webp","google","Roadside Assistance","United Kingdom","Leads"],["g03.webp","google","E-commerce","Pakistan","Sales"],["g04.webp","google","E-commerce","Pakistan","Leads"],["g05.webp","google","E-commerce","Pakistan","Sales"],["g06.webp","google","Towing","United States","Calls"],["g07.webp","google","Construction","United States","Calls"],["g08.webp","google","Catering","United States","Leads"],["g09.webp","google","Landscaping","United States","Calls"],["g10.webp","google","Med Spa","United States","Leads"],["g11.webp","google","Water Filtration","United States","Leads"],["g12.webp","google","Home Automation","United States","Leads"],["g13.webp","google","Towing & Breakdown","United States","Leads"],["g14.webp","google","Fire Alarm Installation","United States","Leads"],["g15.webp","google","Massage","United States","Leads"],["g16.webp","google","Window Tinting","United States","Leads"],["g17.webp","google","Realtor","United States","Leads"],["g18.webp","google","Auto","United States","Leads"],["m20.webp","meta","E-commerce","Pakistan","Sales"],["m21.webp","meta","E-commerce","Saudi Arabia","Sales"],["m22.webp","meta","Online Quran Academy","Gulf Countries","Leads"],["m23.webp","meta","Event Management","Pakistan","Leads"],["m24.webp","meta","Consultation","Dubai","Leads"],["m25.webp","meta","Umrah Travel","United States","Leads"],["m26.webp","meta","Umrah Travel","United States","Leads"],["m27.webp","meta","Umrah Travel","United States","Leads"],["m28.webp","meta","Umrah Travel","United States","Leads"],["m29.webp","meta","Umrah Travel","United States","Leads"],["m30.webp","meta","Consultation Certification","United States","Leads"]];
const KIND={google:'Google Ads',meta:'Meta Ads'};
const EXTRA=[{"f":"posts/p01.webp","t":"Why most businesses lose money on ads","s":"Social post","c":"Social posts"},{"f":"posts/p02.webp","t":"Running ads but not getting results?","s":"Social post","c":"Social posts"},{"f":"posts/p03.webp","t":"We help businesses grow profitably","s":"Social post","c":"Social posts"},{"f":"posts/p04.webp","t":"Who we work with","s":"Social post","c":"Social posts"},{"f":"posts/p05.webp","t":"What we do at Adverex Solution","s":"Social post","c":"Social posts"},{"f":"posts/p06.webp","t":"More ad budget is not more sales","s":"Social post","c":"Social posts"},{"f":"posts/p07.webp","t":"Who we work with","s":"Social post","c":"Social posts"},{"f":"posts/p08.webp","t":"What actually lowers cost per lead","s":"Social post","c":"Social posts"},{"f":"posts/p09.webp","t":"Clicks do not pay bills. Conversions do.","s":"Social post","c":"Social posts"},{"f":"posts/c01.webp","t":"5 Meta ads mistakes killing your sales","s":"Carousel 1 of 7","c":"Social posts"},{"f":"posts/c02.webp","t":"No clear campaign goal","s":"Carousel 2 of 7","c":"Social posts"},{"f":"posts/c03.webp","t":"Poor creatives, no hook","s":"Carousel 3 of 7","c":"Social posts"},{"f":"posts/c04.webp","t":"Wrong audience targeting","s":"Carousel 4 of 7","c":"Social posts"},{"f":"posts/c05.webp","t":"Sending traffic to weak pages","s":"Carousel 5 of 7","c":"Social posts"},{"f":"posts/c06.webp","t":"No tracking and optimisation","s":"Carousel 6 of 7","c":"Social posts"},{"f":"posts/c07.webp","t":"Fix the system, then scale","s":"Carousel 7 of 7","c":"Social posts"},{"f":"posts/cover-fb.webp","t":"Facebook page cover","s":"Branding","c":"Social posts"},{"f":"posts/cover-li.webp","t":"LinkedIn page cover","s":"Branding","c":"Social posts"},{"f":"ads/a01.webp","t":"What we do","s":"Ad creative","c":"Ad creatives"},{"f":"ads/a02.webp","t":"Meta Ads for your business","s":"Ad creative","c":"Ad creatives"},{"f":"ads/a03.webp","t":"Let us run your Meta Ads","s":"Ad creative","c":"Ad creatives"},{"f":"ads/a04.webp","t":"Grow with Meta Ads","s":"Ad creative","c":"Ad creatives"},{"f":"ads/a05.webp","t":"Professional digital marketing","s":"Ad creative","c":"Ad creatives"},{"f":"ads/a06.webp","t":"Why you need Google Ads","s":"Ad creative","c":"Ad creatives"},{"f":"ads/a07.webp","t":"Ads that work while you rest","s":"Ad creative","c":"Ad creatives"},{"f":"ads/a08.webp","t":"Need a website?","s":"Ad creative","c":"Ad creatives"},{"f":"ads/a09.webp","t":"Websites that build your business","s":"Ad creative","c":"Ad creatives"},{"f":"ads/a10.webp","t":"7 services, one solution","s":"Ad creative","c":"Ad creatives"},{"f":"ads/a11.webp","t":"Our core services","s":"Ad creative","c":"Ad creatives"},{"f":"ads/b01.webp","t":"Why you need Google Ads","s":"Ad creative","c":"Ad creatives"},{"f":"ads/b02.webp","t":"Meta Ads planning","s":"Ad creative","c":"Ad creatives"},{"f":"ads/b03.webp","t":"Appear first when people search","s":"Ad creative","c":"Ad creatives"},{"f":"ads/b04.webp","t":"Get an expert campaign manager","s":"Ad creative","c":"Ad creatives"},{"f":"smm/s01.webp","t":"Business Chalao","s":"Social media management","c":"Social plans"},{"f":"smm/s02.webp","t":"Growth plan","s":"Social media management","c":"Social plans"},{"f":"smm/s03.webp","t":"Hire a social media manager","s":"Social media management","c":"Social plans"},{"f":"smm/s04.webp","t":"Basic plan","s":"Social media management","c":"Social plans"},{"f":"smm/s05.webp","t":"Premium plan","s":"Social media management","c":"Social plans"},{"f":"ss/ss1.webp","t":"Google Ads success story","s":"Success story","c":"Success stories"},{"f":"ss/ss2.webp","t":"Google Ads success story","s":"Success story","c":"Success stories"},{"f":"ss/ss3.webp","t":"Google Ads success story","s":"Success story","c":"Success stories"},{"f":"ss/ss4.webp","t":"Google Ads success story","s":"Success story","c":"Success stories"},{"f":"ss/ss5.webp","t":"Google Ads success story","s":"Success story","c":"Success stories"},{"f":"ss/ss6.webp","t":"Google Ads success story","s":"Success story","c":"Success stories"},{"f":"clients/al-safar-01.webp","t":"Umrah package 1","s":"Safar Al Noor Travel","c":"Client work"},{"f":"clients/al-safar-02.webp","t":"Umrah package 2","s":"Safar Al Noor Travel","c":"Client work"},{"f":"clients/al-safar-03.webp","t":"Umrah package 3","s":"Safar Al Noor Travel","c":"Client work"},{"f":"clients/al-safar-04.webp","t":"Umrah package 4","s":"Safar Al Noor Travel","c":"Client work"},{"f":"clients/al-safar-05.webp","t":"Umrah package 5","s":"Safar Al Noor Travel","c":"Client work"},{"f":"clients/al-safar-06.webp","t":"Umrah package 6","s":"Safar Al Noor Travel","c":"Client work"},{"f":"clients/al-safar-07.webp","t":"Umrah package 7","s":"Safar Al Noor Travel","c":"Client work"},{"f":"clients/al-safar-08.webp","t":"Umrah package 8","s":"Safar Al Noor Travel","c":"Client work"},{"f":"clients/al-safar-09.webp","t":"Umrah package 9","s":"Safar Al Noor Travel","c":"Client work"},{"f":"clients/al-safar-10.webp","t":"Umrah package 10","s":"Safar Al Noor Travel","c":"Client work"},{"f":"clients/al-safar-11.webp","t":"Umrah package 11","s":"Safar Al Noor Travel","c":"Client work"},{"f":"clients/al-safar-12.webp","t":"Umrah package 12","s":"Safar Al Noor Travel","c":"Client work"},{"f":"clients/build-it-all-01.webp","t":"Bathroom renovation","s":"Build IT All","c":"Client work"},{"f":"clients/build-it-all-02.webp","t":"Kitchen makeover","s":"Build IT All","c":"Client work"},{"f":"clients/build-it-all-03.webp","t":"Kitchen renovation","s":"Build IT All","c":"Client work"},{"f":"clients/build-it-all-04.webp","t":"Fencing and privacy","s":"Build IT All","c":"Client work"},{"f":"clients/build-it-all-05.webp","t":"Outdoor decking","s":"Build IT All","c":"Client work"},{"f":"clients/build-it-all-06.webp","t":"Fence replacement","s":"Build IT All","c":"Client work"},{"f":"clients/build-it-all-07.webp","t":"Deck builds","s":"Build IT All","c":"Client work"},{"f":"clients/faizan-book-01.webp","t":"Petitions and bonds drafting","s":"Faizan Book Store","c":"Client work"},{"f":"clients/faizan-book-02.webp","t":"Summary suit and trial","s":"Faizan Book Store","c":"Client work"},{"f":"clients/faizan-book-03.webp","t":"Criminal trial","s":"Faizan Book Store","c":"Client work"},{"f":"clients/faizan-book-04.webp","t":"Drafting and pleadings","s":"Faizan Book Store","c":"Client work"},{"f":"clients/faizan-book-05.webp","t":"Shamilat-e-Deh","s":"Faizan Book Store","c":"Client work"},{"f":"clients/faizan-book-06.webp","t":"Law book offer","s":"Faizan Book Store","c":"Client work"},{"f":"clients/faizan-book-07.webp","t":"High Court practice","s":"Faizan Book Store","c":"Client work"},{"f":"clients/faizan-book-08.webp","t":"Criminal trial (Urdu)","s":"Faizan Book Store","c":"Client work"},{"f":"clients/get-me-tutor-01.webp","t":"Struggling in math?","s":"Get Me Tutor","c":"Client work"},{"f":"clients/get-me-tutor-02.webp","t":"Science confusing?","s":"Get Me Tutor","c":"Client work"},{"f":"clients/get-me-tutor-03.webp","t":"Weak in English?","s":"Get Me Tutor","c":"Client work"},{"f":"clients/get-me-tutor-04.webp","t":"We fix it all","s":"Get Me Tutor","c":"Client work"},{"f":"clients/get-me-tutor-05.webp","t":"Boost your SAT score","s":"Get Me Tutor","c":"Client work"},{"f":"clients/get-me-tutor-06.webp","t":"SAT is about strategy","s":"Get Me Tutor","c":"Client work"},{"f":"clients/get-me-tutor-07.webp","t":"Start SAT prep free","s":"Get Me Tutor","c":"Client work"},{"f":"clients/get-me-tutor-08.webp","t":"Math tutoring trial","s":"Get Me Tutor","c":"Client work"},{"f":"clients/get-me-tutor-09.webp","t":"Science made simple","s":"Get Me Tutor","c":"Client work"},{"f":"clients/get-me-tutor-10.webp","t":"Build confidence in English","s":"Get Me Tutor","c":"Client work"},{"f":"clients/get-me-tutor-11.webp","t":"Falling behind in school?","s":"Get Me Tutor","c":"Client work"},{"f":"clients/get-me-tutor-12.webp","t":"Complete academic support","s":"Get Me Tutor","c":"Client work"},{"f":"clients/get-me-tutor-13.webp","t":"Track your child's progress","s":"Get Me Tutor","c":"Client work"},{"f":"clients/signature-spa-01.webp","t":"Back pain relief","s":"Signature Premium Spa","c":"Client work"},{"f":"clients/signature-spa-02.webp","t":"Stress gone","s":"Signature Premium Spa","c":"Client work"},{"f":"clients/signature-spa-03.webp","t":"Hot stone therapy","s":"Signature Premium Spa","c":"Client work"},{"f":"clients/signature-spa-04.webp","t":"Weekend relax plan","s":"Signature Premium Spa","c":"Client work"},{"f":"clients/signature-spa-05.webp","t":"Release the stress","s":"Signature Premium Spa","c":"Client work"},{"f":"clients/signature-spa-06.webp","t":"A little time for yourself","s":"Signature Premium Spa","c":"Client work"},{"f":"clients/signature-spa-07.webp","t":"A soft ending to a long day","s":"Signature Premium Spa","c":"Client work"},{"f":"clients/sheffield-01.webp","t":"Mobile tyre service","s":"Sheffield Mobile Tyres","c":"Client work"},{"f":"clients/sheffield-02.webp","t":"Branded fleet","s":"Sheffield Mobile Tyres","c":"Client work"},{"f":"clients/sheffield-03.webp","t":"Workshop branding","s":"Sheffield Mobile Tyres","c":"Client work"},{"f":"clients/sheffield-04.webp","t":"Van branding","s":"Sheffield Mobile Tyres","c":"Client work"},{"f":"clients/sheffield-05.webp","t":"Fleet vans","s":"Sheffield Mobile Tyres","c":"Client work"},{"f":"clients/sheffield-06.webp","t":"Brand logo","s":"Sheffield Mobile Tyres","c":"Client work"},{"f":"clients/silent-bed-01.webp","t":"Ambassador bed","s":"Silent Night Beds","c":"Client work"},{"f":"clients/silent-bed-02.webp","t":"Divan bed","s":"Silent Night Beds","c":"Client work"},{"f":"clients/silent-bed-03.webp","t":"Divan bed","s":"Silent Night Beds","c":"Client work"},{"f":"clients/silent-bed-04.webp","t":"Hilton bed","s":"Silent Night Beds","c":"Client work"},{"f":"clients/silent-bed-05.webp","t":"Hilton bed","s":"Silent Night Beds","c":"Client work"},{"f":"clients/silent-bed-06.webp","t":"Oxford bed","s":"Silent Night Beds","c":"Client work"},{"f":"clients/silent-bed-07.webp","t":"Oxford bed","s":"Silent Night Beds","c":"Client work"},{"f":"clients/silent-bed-08.webp","t":"Panel bed","s":"Silent Night Beds","c":"Client work"},{"f":"clients/silent-bed-09.webp","t":"Panel bumper bed","s":"Silent Night Beds","c":"Client work"},{"f":"clients/silent-bed-10.webp","t":"Sleigh bed","s":"Silent Night Beds","c":"Client work"},{"f":"clients/silent-bed-11.webp","t":"Wingback bed","s":"Silent Night Beds","c":"Client work"},{"f":"clients/empower-edge-01.webp","t":"Amazon course","s":"Empower Edge","c":"Client work"},{"f":"clients/empower-edge-02.webp","t":"eBay course","s":"Empower Edge","c":"Client work"},{"f":"clients/empower-edge-03.webp","t":"Etsy course","s":"Empower Edge","c":"Client work"},{"f":"clients/empower-edge-04.webp","t":"Shopify course","s":"Empower Edge","c":"Client work"},{"f":"clients/empower-edge-05.webp","t":"TikTok Shop course","s":"Empower Edge","c":"Client work"},{"f":"clients/empower-edge-06.webp","t":"Grow in e-commerce","s":"Empower Edge","c":"Client work"},{"f":"clients/chai-jan-01.webp","t":"Family combo deal","s":"Chai Jan","c":"Client work"},{"f":"clients/chai-jan-02.webp","t":"Midnight deal 2","s":"Chai Jan","c":"Client work"},{"f":"clients/chai-jan-03.webp","t":"Crazy paratha deal","s":"Chai Jan","c":"Client work"},{"f":"clients/chai-jan-04.webp","t":"Midnight deal 1","s":"Chai Jan","c":"Client work"},{"f":"clients/case-bazar-01.webp","t":"USB-C power adapter","s":"Case Bazar","c":"Client work"},{"f":"clients/case-bazar-02.webp","t":"20W adapter","s":"Case Bazar","c":"Client work"},{"f":"clients/case-bazar-03.webp","t":"Buds 3 Pro","s":"Case Bazar","c":"Client work"},{"f":"clients/case-bazar-04.webp","t":"AirPods Pro 2","s":"Case Bazar","c":"Client work"},{"f":"clients/case-bazar-05.webp","t":"Wireless headphones","s":"Case Bazar","c":"Client work"},{"f":"clients/mso-01.webp","t":"Premium finishing","s":"MSO Real Estate","c":"Client work"},{"f":"clients/mso-02.webp","t":"Gray structure","s":"MSO Real Estate","c":"Client work"},{"f":"clients/mso-03.webp","t":"Gray structure rates","s":"MSO Real Estate","c":"Client work"},{"c":"Reels","f":"video/v01.webp","v":"video/v01.mp4","t":"Motion ad 1","s":"Reel"},{"c":"Reels","f":"video/v02.webp","v":"video/v02.mp4","t":"Motion ad 2","s":"Reel"},{"c":"Reels","f":"video/v03.webp","v":"video/v03.mp4","t":"Motion ad 3","s":"Reel"},{"c":"Reels","f":"video/v04.webp","v":"video/v04.mp4","t":"Motion ad 4","s":"Reel"},{"c":"Reels","f":"video/v05.webp","v":"video/v05.mp4","t":"Motion ad 5","s":"Reel"},{"c":"Reels","f":"video/v06.webp","v":"video/v06.mp4","t":"Motion ad 6","s":"Reel"},{"c":"Reels","f":"video/v07.webp","v":"video/v07.mp4","t":"Motion ad 7","s":"Reel"},{"c":"Reels","f":"video/v08.webp","v":"video/v08.mp4","t":"Motion ad 8","s":"Reel"},{"c":"Reels","f":"video/v09.webp","v":"video/v09.mp4","t":"Motion ad 9","s":"Reel"},{"c":"Reels","f":"video/v10.webp","v":"video/v10.mp4","t":"Motion ad 10","s":"Reel"},{"c":"Reels","f":"video/v11.webp","v":"video/v11.mp4","t":"Motion ad 11","s":"Reel"},{"c":"Reels","f":"video/v12.webp","v":"video/v12.mp4","t":"Motion ad 12","s":"Reel"},{"c":"Reels","f":"video/v13.webp","v":"video/v13.mp4","t":"Motion ad 13","s":"Reel"},{"c":"Reels","f":"video/v14.webp","v":"video/v14.mp4","t":"Motion ad 14","s":"Reel"},{"c":"Reels","f":"video/v15.webp","v":"video/v15.mp4","t":"Motion ad 15","s":"Reel"},{"c":"Reels","f":"video/v16.webp","v":"video/v16.mp4","t":"Motion ad 16","s":"Reel"}];
const _res=WORK.map(w=>({f:'work/'+w[0],c:KIND[w[1]],t:w[2],s:w[3]+' \u00b7 Goal: '+w[4]}));
const _all=[..._res,...EXTRA];
/* interleave the categories so the grid reads as a varied mix of real work */
const _cats=['Google Ads','Meta Ads','Success stories','Ad creatives','Social posts','Social plans','Reels','Client work'];
const _by=_cats.map(c=>_all.filter(x=>x.c===c));
const work=[];for(let k=0;_by.some(a=>k<a.length);k++)_by.forEach(a=>{if(k<a.length)work.push(a[k])});
const services=[
 ['Google Ads Management','Reach customers actively searching for what you sell.',['Search campaigns','Performance Max','Conversion tracking','Monthly reporting']],
 ['Meta Ads Management','Leads, sales and awareness on Facebook and Instagram.',['Lead generation','Retargeting','Creative testing','Audience building']],
 ['WordPress Development','Fast, professional websites that represent your business.',['Custom design','Speed & mobile','Easy to edit','Care plans']],
 ['Shopify Development','Custom stores built for smooth shopping and growth.',['Store setup','Theme customisation','Checkout','Product pages']],
 ['SEO','Better rankings and qualified traffic from search.',['On-page SEO','Technical SEO','Content','Local SEO']],
 ['Landing Page Design','Pages built to turn ad clicks into enquiries.',['Conversion design','Fast loading','A/B ready','Form & call tracking']]
];
const industries=['Healthcare','Finance','Hospitality','Education','Wellness','E-commerce','Automotive','Construction'];
const quotes=[
 ['The team helped us increase our website traffic by 200% in just 3 months. Their strategies really work, and the results speak for themselves.','Daniel Lee'],
 ['Our Instagram engagement skyrocketed after working with them. We now have a strong online presence and loyal customers.','Michael Anderson'],
 ['They redesigned our website beautifully and optimized it for conversions. Our sales have never been better.','James Carter']
];

/* ================= render ================= */
const tiles=$('#tiles');
const hasLb=!!document.querySelector('#lb');
const PLAY='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
(document.querySelector('#tiles')?work:[]).forEach((w,i)=>{
  const a=document.createElement('a');
  a.className='tile'+(w.v?' vt':''); a.href=hasLb?'#':'portfolio.html'; a.dataset.cat=w.c; a.dataset.i=i;
  a.setAttribute('aria-label',`${w.c}: ${w.t}${w.s?', '+w.s:''}. ${hasLb?'Open larger':'View portfolio'}`);
  const _k={'Google Ads':'g','Meta Ads':'m','Success stories':'s','Ad creatives':'c','Social posts':'p','Social plans':'l','Reels':'r','Client work':'w'}[w.c]||'g';
  const _M={g:'<circle cx="46" cy="46" r="26" fill="none" stroke="currentColor" stroke-width="8"/><path d="M66 66l28 28" stroke="currentColor" stroke-width="10" stroke-linecap="round"/><path d="M24 110v-22M40 110V76M56 110V60" stroke="currentColor" stroke-width="9" stroke-linecap="round"/>',m:'<circle cx="38" cy="60" r="26" fill="none" stroke="currentColor" stroke-width="9"/><circle cx="82" cy="60" r="26" fill="none" stroke="currentColor" stroke-width="9"/>',s:'<path d="M60 8l13 30 32 3-24 22 8 32-29-17-29 17 8-32-24-22 32-3z" fill="currentColor"/>',c:'<rect x="8" y="22" width="64" height="64" rx="12" fill="none" stroke="currentColor" stroke-width="8"/><rect x="40" y="46" width="64" height="64" rx="12" fill="currentColor" opacity=".55"/>',p:'<path d="M60 100S14 72 14 42a24 24 0 0 1 46-10 24 24 0 0 1 46 10c0 30-46 58-46 58z" fill="currentColor"/>',l:'<rect x="10" y="20" width="100" height="84" rx="12" fill="none" stroke="currentColor" stroke-width="8"/><path d="M10 46h100M38 8v22M82 8v22" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><circle cx="40" cy="76" r="6" fill="currentColor"/><circle cx="62" cy="76" r="6" fill="currentColor"/><circle cx="84" cy="76" r="6" fill="currentColor"/>',r:'<path d="M34 18v84l72-42z" fill="currentColor"/>'}[_k];
  const _n=String(i+1).padStart(2,'0');
  a.dataset.k=_k;
  a.innerHTML=`<div class="th"><svg class="mo" viewBox="0 0 120 120" aria-hidden="true">${_M}</svg><span class="bgw" aria-hidden="true">${w.c}</span><span class="nn">${_n}</span><div class="tt"><b>${w.t}</b></div><div class="mk"><img src="assets/${w.f}" alt="" loading="lazy" decoding="async"></div><span class="st s1">${w.c}</span>${w.s?`<span class="st s2">${w.s.replace(/ ?\u00b7 ?Goal: ?/,' \u00b7 ')}</span>`:''}<span class="hv">Hover to preview</span></div><div class="pl"><img src="assets/${w.f}" alt="${w.c}: ${w.t}" loading="lazy" decoding="async" width="540" height="675"></div><div class="ov"><b>${w.t}</b><small>${w.c}${w.s?' · '+w.s:''}</small></div><span class="tg">${w.c}</span>
   <div class="cap"><span class="go">${w.v?PLAY:ARROW}</span></div>`;
  a.addEventListener('pointerenter',e=>{const r=a.getBoundingClientRect();a.style.setProperty('--mx',(e.clientX-r.left)+'px');a.style.setProperty('--my',(e.clientY-r.top)+'px')});
  a.addEventListener('pointerleave',e=>{const r=a.getBoundingClientRect();a.style.setProperty('--mx',(e.clientX-r.left)+'px');a.style.setProperty('--my',(e.clientY-r.top)+'px')});
  if(matchMedia('(hover:none)').matches&&'IntersectionObserver' in window){(window._tio=window._tio||new IntersectionObserver(es=>es.forEach(x=>x.target.classList.toggle('peek',x.isIntersecting)),{rootMargin:'-38% 0px -38% 0px'})).observe(a)}

  if(hasLb)a.addEventListener('click',e=>{e.preventDefault();openLb(i)});
  tiles.appendChild(a);
});
let curCat='All',limit=+(tiles.dataset.limit||12);
function applyFilter(init){
  let shown=0,total=0;
  tiles.querySelectorAll('.tile').forEach(t=>{
    const ok=curCat==='All'||t.dataset.cat===curCat; if(ok)total++;
    const vis=ok&&shown<limit; t.hidden=!vis; if(vis)shown++;
  });
  $('#more').hidden=shown>=total; $('#empty').style.display=total?'none':'block'; if(!init)kick();
}
$('#moreBtn').addEventListener('click',()=>{limit+=8;applyFilter()});
/* lightbox */
const lb=$('#lb'); let lbi=0;
function lbShow(i){
  const list=work.map((w,k)=>k).filter(k=>curCat==='All'||work[k].c===curCat);
  lbi=i; const w=work[i]; const v=$('#lbvid'),im=$('#lbimg');
  if(w.v){im.style.display='none';v.style.display='block';v.src='assets/'+w.v;v.poster='assets/'+w.f;v.play().catch(()=>{})}
  else{v.pause();v.removeAttribute('src');v.style.display='none';im.style.display='block';im.src='assets/'+w.f;im.alt=w.c+': '+w.t}
  $('#lbcap').textContent=`${w.c} \u00b7 ${w.t}${w.s?' \u00b7 '+w.s:''}`;
  lb._list=list;
}
lb.addEventListener('close',()=>{const v=$('#lbvid');v.pause()});
function openLb(i){lbShow(i);if(!lb.open)lb.showModal()}
function lbStep(d){const L=lb._list,p=L.indexOf(lbi);lbShow(L[(p+d+L.length)%L.length])}
$('#lbp').addEventListener('click',()=>lbStep(-1));$('#lbn').addEventListener('click',()=>lbStep(1));
$('#lbx').addEventListener('click',()=>lb.close());
lb.addEventListener('click',e=>{if(e.target===lb||e.target.classList.contains('lbin'))lb.close()});
lb.addEventListener('keydown',e=>{if(e.key==='ArrowRight')lbStep(1);if(e.key==='ArrowLeft')lbStep(-1)});

const rail=$('#rail');
rail.insertAdjacentHTML('afterbegin','<div class="svc-intro"><b>Big ideas. Loud results.</b>Every service below is built around one thing: more of the right customers finding you. Hover a line to see what is inside.</div>');
services.forEach((s,i)=>{
  const d=document.createElement('article'); d.className='svc';
  d.innerHTML=`<h3>${s[0]}</h3><ul>${s[2].map(x=>`<li><a href="contact.html">${x}</a></li>`).join('')}</ul>`;
  rail.appendChild(d);
});
const micon={"Healthcare": "<path d=\"M12 5v14M5 12h14\"/>", "Finance": "<path d=\"M5 19V11M12 19V5M19 19v-9\"/>", "Hospitality": "<path d=\"M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z\"/>", "Education": "<path d=\"M2 9l10-5 10 5-10 5zM6 11.5V16c3 2.4 9 2.4 12 0v-4.5\"/>", "Wellness": "<path d=\"M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z\"/>", "Automotive": "<path d=\"M4 15l1.6-5a2 2 0 011.9-1.4h9a2 2 0 011.9 1.4L20 15v3H4zM7.5 15h.01M16.5 15h.01\"/>", "E-commerce": "<path d=\"M5 8h14l-1.2 11H6.2zM9 8a3 3 0 016 0\"/>", "Construction": "<path d=\"M3 20h18M6 20V10l6-6 6 6v10M10 20v-5h4v5\"/>"};
const mcol={Healthcare:'#2d6fd6',Finance:'#14805a',Hospitality:'#b9602a',Education:'#5b4bd1',Wellness:'#c46a8a',Automotive:'#2b2f36','E-commerce':'#1f9d62',Construction:'#c28a12'};
$('#track').innerHTML=[...industries,...industries].map(x=>`<span class="mi" data-c="${mcol[x]}" data-l="${x[0]}" style="--c:${mcol[x]}"><span class="nm">${x}</span><span class="lg" aria-hidden="true"><svg viewBox="0 0 24 24">${micon[x]}</svg>${x}</span></span>`).join('');

const cats=['All',..._cats.filter(c=>work.some(w=>w.c===c))];
const fw=$('#filters');
cats.forEach((c,i)=>{
  const n=c==='All'?work.length:work.filter(w=>w.c===c).length;
  const b=document.createElement('button'); b.type='button'; b.setAttribute('aria-pressed',i===0);
  b.innerHTML=`${c}<sup>${n}</sup>`;
  b.addEventListener('click',()=>{
    fw.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));
    curCat=c; limit=12; applyFilter();
  });
  fw.appendChild(b);
});
applyFilter(true);

/* ================= testimonials slider ================= */
let qi=0; const sq=$('#sq'),sn=$('#sn'),sav=$('#sav'),slide=$('#slide'),dashes=$('#dashes');
quotes.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Show testimonial '+(i+1));b.addEventListener('click',()=>go(i));dashes.appendChild(b)});
function paint(){
  sq.textContent='"'+quotes[qi][0]+'"'; sn.textContent=quotes[qi][1]; sav.textContent=quotes[qi][1][0];
  [...dashes.children].forEach((b,i)=>b.setAttribute('aria-current',i===qi));
}
function go(n,dir){
  const next=(n+quotes.length)%quotes.length; dir=dir||(next>=qi?1:-1);
  if(reduce||!slide.animate){qi=next;paint();return}
  slide.animate([{opacity:1,transform:'none'},{opacity:0,transform:`translateX(${-40*dir}px)`}],{duration:260,easing:'ease-in'}).onfinish=()=>{
    qi=next;paint();
    slide.animate([{opacity:0,transform:`translateX(${40*dir}px)`},{opacity:1,transform:'none'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'});
  };
}
let qTimer,qHover=false,qSeen=false;
function qStart(){clearInterval(qTimer);if(reduce)return;qTimer=setInterval(()=>{if(qHover||!qSeen||document.hidden||paused)return;go(qi+1,1)},3000)}
$('#prev').addEventListener('click',()=>{go(qi-1,-1);qStart()});
$('#next').addEventListener('click',()=>{go(qi+1,1);qStart()});
dashes.addEventListener('click',qStart);
const qs=$('#slider');
qs.addEventListener('pointerenter',()=>qHover=true);qs.addEventListener('pointerleave',()=>qHover=false);
qs.addEventListener('focusin',()=>qHover=true);qs.addEventListener('focusout',()=>qHover=false);
new IntersectionObserver(e=>{qSeen=e[0].isIntersecting},{threshold:.4}).observe(qs);
qStart();
paint();

/* ================= headline cycling + pause ================= */
const swap=$('#swap'); const words=['Google Ads','Meta Ads','WordPress','Shopify','SEO']; let wi=0,paused=false;
setInterval(()=>{
  if(paused||reduce)return;
  swap.classList.add('out');
  setTimeout(()=>{wi=(wi+1)%words.length;swap.textContent=words[wi];swap.classList.remove('out')},400);
},2600);
const pb=$('#pause');
pb.addEventListener('click',()=>{
  paused=!paused; document.documentElement.toggleAttribute('data-paused',paused);
  pb.setAttribute('aria-pressed',paused); pb.textContent=paused?'Play motion':'Pause motion';
});

/* ================= count-up ================= */
function count(el){
  const end=+el.dataset.count,dec=+(el.dataset.dec||0),suf=el.dataset.suffix||'';
  const f=n=>n.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec})+suf;
  if(reduce){el.textContent=f(end);return}
  const t0=performance.now(),dur=1500;
  (function tick(t){const p=Math.min((t-t0)/dur,1),e=1-Math.pow(1-p,3);el.textContent=f(end*e);if(p<1)requestAnimationFrame(tick)})(t0);
}
const co=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){count(e.target);co.unobserve(e.target)}}),{threshold:.5});
document.querySelectorAll('[data-count]').forEach(el=>co.observe(el));

/* ================= preloader + intro ================= */
(function(){
  const pre=$('#pre');
  let seen=false;try{seen=!!sessionStorage.getItem('adv-pre');sessionStorage.setItem('adv-pre','1')}catch(e){}
  if(reduce||seen||!pre.parentNode){pre.remove();document.documentElement.classList.add('intro');return}
  const pct=$('#pct'),hello=$('#hello'),names=['Adverex','Growth','Results'],t0=performance.now(),dur=1100;
  (function tick(t){
    const p=Math.min((t-t0)/dur,1);
    pct.textContent=Math.round(p*100);
    hello.textContent=names[Math.min(Math.floor(p*names.length),names.length-1)];
    if(p<1)requestAnimationFrame(tick);
    else{pre.classList.add('done');document.documentElement.classList.add('intro');setTimeout(()=>pre.remove(),1000)}
  })(t0);
})();
if(reduce)document.documentElement.classList.add('intro');

/* ================= cursor dot ================= */
(function(){
  if(matchMedia('(pointer:coarse)').matches||reduce)return;
  const dot=$('#dot');let x=0,y=0,tx=0,ty=0,run=false;
  addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY;dot.classList.add('on');if(!run){run=true;loop()}});
  document.addEventListener('pointerleave',()=>dot.classList.remove('on'));
  function loop(){x+=(tx-x)*.2;y+=(ty-y)*.2;dot.style.transform=`translate3d(${x}px,${y}px,0)`;requestAnimationFrame(loop)}
  document.addEventListener('pointerover',e=>{dot.classList.toggle('big',!!e.target.closest('.tile'))});
})();

/* footer wordmark reveal */
(function(){const w=$('#fword');if(reduce||!('IntersectionObserver' in window)){w.classList.add('in');return}
new IntersectionObserver((e,o)=>{if(e[0].isIntersecting){w.classList.add('in');o.disconnect()}},{threshold:.2}).observe(w)})();


/* ================= wheel of work (hero showreel) ================= */
(function(){
  const reelEl=$('#reel'),host=$('#wheel');
  const pick=['work/g02','ss/ss1','ads/a06','posts/c02','work/m20','smm/s02','work/g10','ads/a08','posts/p08','work/g12','ss/ss2','ads/a02'];
  const files=pick.map(p=>work.find(w=>w.f.startsWith(p)));
  const N=files.length;
  host.innerHTML='<div class="wring" id="wr1"></div><div class="wring" id="wr2"></div>'+
    files.map(w=>`<div class="wc"><img src="assets/${w.f}" alt="" decoding="async"></div>`).join('')+
    '<i class="wdot"></i><i class="wdot"></i><i class="wdot"></i>';
  const cards=[...host.querySelectorAll('.wc')],dots=[...host.querySelectorAll('.wdot')],r1=$('#wr1'),r2=$('#wr2');
  let W=0,H=0,S=0,R=0,cw=0,ch=0;
  function size(){
    W=reelEl.clientWidth;H=reelEl.clientHeight;
    S=Math.min(W*1.05,H*.84);R=S*.355;cw=S*(W<600?.165:.15);ch=cw*1.25;
    reelEl.style.setProperty('--S',S+'px');
    cards.forEach(c=>{c.style.width=cw+'px';c.style.height=ch+'px'});
    r1.style.width=r1.style.height=(2*R)+'px';
    r2.style.width=r2.style.height=(2*R*1.2)+'px';
  }
  let ang=0,lastT=0,lastY=scrollY,run=false,raf=0;
  function draw(){
    for(let i=0;i<N;i++){
      const a=(ang+i*360/N-90)*Math.PI/180,x=Math.cos(a)*R,y=Math.sin(a)*R;
      const sc=1+.07*Math.sin(a+Math.PI);                 /* a touch larger at the top, so it reads as a turning wheel */
      cards[i].style.transform=`translate3d(${x-cw/2}px,${y-ch/2}px,0) scale(${sc})`;
      cards[i].style.zIndex=Math.round(10+y/R*5);
    }
    for(let k=0;k<3;k++){
      const a=(-ang*.55+k*120)*Math.PI/180,rr=R*1.2;
      dots[k].style.transform=`translate3d(${Math.cos(a)*rr}px,${Math.sin(a)*rr}px,0)`;
    }
  }
  function loop(t){
    const dt=Math.min(64,t-(lastT||t));lastT=t;
    const y=scrollY;
    if(!(typeof paused!=='undefined'&&paused)) ang+=dt*.011;     /* about 11 degrees a second */
    ang+=(y-lastY)*.07; lastY=y;                                  /* scrolling spins the wheel faster */
    draw();
    raf=run?requestAnimationFrame(loop):0;
  }
  size();draw();
  if(reduce)return;
  addEventListener('resize',()=>{size();draw()});
  new ResizeObserver(()=>{size();draw()}).observe(reelEl);
  new IntersectionObserver(e=>{
    run=e[0].isIntersecting;
    if(run&&!raf){lastT=0;lastY=scrollY;raf=requestAnimationFrame(loop)}
  },{threshold:0}).observe(reelEl);
})();

/* ================= smooth scroll (inertia glide) ================= */
(function(){
  return; /* replaced by Lenis (assets/motion.js) */
  const LERP=.1, WHEEL=.5;
  let cur=scrollY,tgt=scrollY,raf=0,last=0,own=false;
  const max=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);
  const clampY=v=>Math.min(max(),Math.max(0,v));
  function step(t){
    const dt=Math.min(64,t-(last||t-16.7));last=t;
    const k=1-Math.pow(1-LERP,dt/16.667);
    cur+=(tgt-cur)*k;
    if(Math.abs(tgt-cur)<.15){cur=tgt;own=true;scrollTo(0,cur);own=false;raf=0;last=0;return}
    own=true;scrollTo(0,cur);own=false;
    raf=requestAnimationFrame(step);
  }
  function go(y){tgt=clampY(y);if(!raf)raf=requestAnimationFrame(step)}
  addEventListener('wheel',e=>{
    if(e.ctrlKey||e.defaultPrevented||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
    if(document.querySelector('dialog[open]')){e.preventDefault();return}
    if(e.target.closest&&e.target.closest('textarea,select,input[type=number]'))return;
    e.preventDefault();
    const m=e.deltaMode===1?18:e.deltaMode===2?innerHeight:1;
    if(!raf){cur=tgt=scrollY}
    go(tgt+e.deltaY*m*WHEEL);
  },{passive:false});
  /* scrollbar drag / keyboard / anchors etc. keep the same position model */
  addEventListener('scroll',()=>{if(!own&&!raf){cur=tgt=scrollY}},{passive:true});
  addEventListener('resize',()=>{tgt=clampY(tgt);cur=clampY(cur)});
  addEventListener('keydown',e=>{
    if(/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement.tagName))return;
    const k=e.key,h=innerHeight;let d=0;
    if(k==='ArrowDown')d=60;else if(k==='ArrowUp')d=-60;else if(k==='PageDown'||(k===' '&&!e.shiftKey))d=h*.85;else if(k==='PageUp'||(k===' '&&e.shiftKey))d=-h*.85;
    else if(k==='Home'){e.preventDefault();go(0);return}else if(k==='End'){e.preventDefault();go(max());return}
    if(d){e.preventDefault();if(!raf){cur=tgt=scrollY}go(tgt+d)}
  });
  /* in-page links glide with the same inertia */
  document.addEventListener('click',e=>{
    const a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a||e.defaultPrevented)return;
    const id=a.getAttribute('href');if(id.length<2&&id!=='#')return;
    const el=id==='#'?document.body:document.querySelector(id);if(!el)return;
    e.preventDefault();
    if(!raf){cur=tgt=scrollY}
    go(id==='#top'?0:el.getBoundingClientRect().top+scrollY-(id==='#services'?0:20));
  });
})();

/* ================= contact form ================= */
$('#qform').addEventListener('submit',e=>{e.preventDefault();const f=e.target,v=n=>(f.querySelectorAll('input[type=text],input[type=email],input[type=tel],textarea,select')[n]||{}).value||'';
  const pick=i=>[...f.querySelectorAll('fieldset')[i].querySelectorAll('label')].filter(l=>l.querySelector('input').checked).map(l=>l.textContent.trim()).join(', ');
  const t=['Hello Adverex, I would like to talk about a project.','Name: '+v(0),'Email: '+v(1),'Phone: '+v(2),'Company: '+v(3),'Role: '+v(4),'Heard about you via: '+v(5),'Interested in: '+pick(0),'Budget: '+pick(1),'Message: '+v(6)].filter(x=>!/: $/.test(x)).join('\n');
  $('#thanks').style.display='block';window.open('https://wa.me/923082451415?text='+encodeURIComponent(t),'_blank','noopener')});

/* =====================================================================
   SCROLL ENGINE  (no libraries). Every effect below is scroll-linked and
   eased,: tilted reel straightening, tile unmasking with
   inner parallax, headline lines sliding in opposite directions, sideways
   pinned services, grey-to-black word reveal, bento tiles rising.
   Only transform / opacity / clip-path / colour are touched.
   ===================================================================== */
const scrubs=[]; let VH=innerHeight,VW=innerWidth,ticking=false;
/* get() -> target 0..1, set(p) applies it. Eased towards the target for smoothness. */
function scrub(get,set,ease=.12){scrubs.push({get,set,ease,cur:null,tgt:0})}
function kick(){if(!ticking){ticking=true;requestAnimationFrame(frame)}}
function frame(){
  let busy=false;
  for(const s of scrubs)s.tgt=s.get();            /* read phase */
  for(const s of scrubs){                          /* write phase */
    if(s.cur===null){s.cur=s.tgt;s.set(s.cur);continue}
    const d=s.tgt-s.cur;
    if(Math.abs(d)>.0004){s.cur+=d*s.ease;s.set(s.cur);busy=true}
    else if(s.cur!==s.tgt){s.cur=s.tgt;s.set(s.cur)}
  }
  if(busy)requestAnimationFrame(frame);else ticking=false;
}
/* progress of element: 0 when its top is at startVh*VH, 1 when at endVh*VH */
const vis=(el,a,b)=>{const r=el.getBoundingClientRect();return clamp((a*VH-r.top)/((a-b)*VH))};

if(!reduce){
  document.documentElement.classList.add('eng');

  /* 1. hero reel: it rises into the first viewport tilted, then PINS to the top of the
        screen; while pinned it straightens and grows until it fills the screen. Only then does the page scroll on. */
  const reel=$('#reel'),rwrap=$('#reelwrap');
  scrub(()=>{
    const r=rwrap.getBoundingClientRect();
    const rise=clamp((VH*.98-r.top)/(VH*.98));            /* wrapper travelling up to the top of the screen */
    const pinned=clamp(-r.top/(VH*.8));
    return rise*.4+pinned*.6;
  },P=>{
    const q=1-P, e=P*P*(3-2*P);                             /* smoothstep for a softer finish */
    reel.style.transform=`rotateX(${26*q}deg) rotateZ(${-4*q}deg) scale(${lerp(.6,1,e)})`;
    reel.style.clipPath=P>.995?'none':`polygon(${lerp(2,0,e)}% 0%, 100% ${lerp(6,0,e)}%, ${lerp(97,100,e)}% 100%, 0% ${lerp(94,100,e)}%)`;
  },.1);

  /* 1b. cinematic scenes inside the pinned frame: one camera, the scene changes as you scroll */
  const SC=[...document.querySelectorAll('.scn')],NS=SC.length;
  const hm=[...document.querySelectorAll('#hudmenu li')],hn=$('#hudn'),hb=$('#hudbar');
  function setScenes(x){
    SC.forEach((s,k)=>{
      const d=k-x,ad=Math.abs(d),op=clamp(1-(ad-.2)/.34);
      s.style.opacity=op;s.style.visibility=op<.01?'hidden':'visible';s.style.pointerEvents=op>.6?'auto':'none';
      const t=s.querySelector('.txt');if(t)t.style.transform=`translate3d(0,${d*60}px,0)`;
      s.querySelectorAll('[data-px]').forEach(e=>{e.style.transform=`translate3d(0,${d*(+e.dataset.px)}px,0) scale(${1-ad*.07})`});
    });
    const a=Math.round(x);hm.forEach((l,k)=>l.classList.toggle('on',k===a));
    hn.textContent=String(a+1).padStart(2,'0')+' / '+String(NS).padStart(2,'0');
    hb.style.transform=`scaleX(${NS>1?x/(NS-1):0})`;
  }
  if(NS){
    setScenes(0);
    scrub(()=>{const r=rwrap.getBoundingClientRect(),pd=rwrap.offsetHeight-VH;return clamp((-r.top-VH*.4)/(pd-VH*.4))},p=>setScenes(p*(NS-1)),.08);
  }

  /* 2. work tiles: unmask from the edges + image drifts inside */
  function bindTile(t){
    const pl=t.querySelector('.pl');
    scrub(()=>vis(t,1.02,.5),p=>{
      const q=1-p;
      t.style.clipPath=p>.998?'none':`inset(${q*16}% ${q*6}% ${q*16}% ${q*6}% round 26px)`;
    },.1);
    scrub(()=>vis(t,1.1,-.3),p=>{pl.style.transform=`translate3d(0,${(.5-p)*22}px,0) scale(1.05)`},.12);
  }
  tiles.querySelectorAll('.tile').forEach(bindTile);

  /* 3. services: headline lines slide from opposite sides, then the pinned rail scrolls sideways */
  const wrap=$('#pinwrap'),stage=$('#services'),l1=$('#l1'),l2=$('#l2');
  let dist=0,hold=0;
  function measure(){
    VH=innerHeight;VW=innerWidth;
    wrap.classList.add('pin-on');
    const gap=parseFloat(getComputedStyle(stage).paddingLeft)||40;   /* last card stops one page-margin short of the screen edge */
    dist=Math.max(0,rail.scrollWidth-stage.clientWidth+gap);
    hold=Math.round(VH*.45);                                          /* the stage stays pinned a beat after the last card lands */
    wrap.style.height=(dist+VH+hold)+'px';
    kick();
  }
  scrub(()=>vis(stage,1.0,.2),p=>{
    l1.style.transform=`translate3d(${lerp(-14,0,p)}vw,0,0)`;
    l2.style.transform=`translate3d(${lerp(14,0,p)}vw,0,0)`;
  },.1);
  scrub(()=>{const r=wrap.getBoundingClientRect();return dist?clamp(-r.top/dist):0},p=>{
    rail.style.transform=`translate3d(${-p*dist}px,0,0)`;
  },.1);

  /* 4. grey -> black word reveal (about statement + bento paragraph) */
  function wordReveal(el,from,to,startVh,endVh){
    const accent=el.dataset.accent;
    const parts=el.textContent.split(/(\s+)/);
    el.textContent='';
    const spans=[];
    parts.forEach(w=>{
      if(!w)return;
      const s=document.createElement('span');s.textContent=w;
      if(/\S/.test(w)){s.className='wd';spans.push(s)}
      el.appendChild(s);
    });
    const A=[31,157,98];
    scrub(()=>vis(el,startVh,endVh),p=>{
      const n=spans.length;
      spans.forEach((s,i)=>{
        const k=clamp(p*(n+4)-i,0,1);
        const isA=accent&&s.textContent.replace(/[^\w]/g,'')===accent;
        const t=isA?A:to;
        s.style.color=`rgb(${Math.round(lerp(from[0],t[0],k))},${Math.round(lerp(from[1],t[1],k))},${Math.round(lerp(from[2],t[2],k))})`;
      });
    },.14);
  }
  wordReveal($('#stmt'),[211,214,212],[10,10,10],.92,.32);
  wordReveal($('#why'),[211,214,212],[10,10,10],.95,.45);

  /* 5. bento tiles rise and scale in; their art drifts */
  document.querySelectorAll('#bento .bt').forEach(b=>{
    scrub(()=>vis(b,1.02,.72),p=>{
      b.style.opacity=clamp(p*1.6,0,1);
      b.style.transform=`translate3d(0,${(1-p)*60}px,0) scale(${.92+.08*p})`;
    },.1);
    const pl=b.querySelector('.pl');
    if(pl)scrub(()=>vis(b,1.1,-.3),p=>{pl.style.transform=`translate3d(0,${(.5-p)*60}px,0) scale(1.08)`},.12);
  });

  /* 6. contact heading rises in */
  const ch=$('#c-h');
  scrub(()=>vis(ch,1.0,.55),p=>{ch.style.transform=`translate3d(0,${(1-p)*70}px,0)`;ch.style.opacity=clamp(p*1.5,0,1)},.1);

  addEventListener('scroll',kick,{passive:true});
  addEventListener('resize',()=>{measure()});
  addEventListener('load',measure);
  document.fonts&&document.fonts.ready.then(measure);
  measure();
}

/* ================= mobile menu + reveal-on-scroll (multi-page additions) ================= */
(function(){
  const b=$('#mbtn'),n=$('#nav'),h=document.documentElement;
  function close(){n.classList.remove('open');b.setAttribute('aria-expanded','false');b.textContent='Menu';h.classList.remove('lock')}
  b.addEventListener('click',()=>{const o=n.classList.toggle('open');b.setAttribute('aria-expanded',o);b.textContent=o?'Close':'Menu';h.classList.toggle('lock',o)});
  n.addEventListener('click',e=>{if(e.target.closest('a'))close()});
  addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  addEventListener('resize',()=>{if(innerWidth>900)close()});
})();
(function(){
  const els=document.querySelectorAll('.rv');if(!els.length)return;
  if(reduce||!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'));return}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
  els.forEach(e=>io.observe(e));
})();

/* looping reels play only while on screen */
(function(){
  const vs=document.querySelectorAll('.vloop');if(!vs.length)return;
  const io=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting&&!reduce&&!paused)v.play().catch(()=>{});else v.pause()}),{threshold:.35});
  vs.forEach(v=>io.observe(v));
})();

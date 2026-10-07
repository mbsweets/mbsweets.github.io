/* MB Sweets website — language switch, live prices/stock from the shop list, open status, bulk-order form. */
(function(){
'use strict';
var LS='mbw-lang';
var lang='hi';
try{lang=localStorage.getItem(LS)==='en'?'en':'hi';}catch(e){}
function $(s,r){return (r||document).querySelector(s);}
function $all(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}

/* ---------- language ---------- */
function applyLang(){
  document.documentElement.lang=lang==='en'?'en':'hi';
  $all('[data-en]').forEach(function(el){
    if(el.tagName==='OPTION'){
      if(el.dataset.hi==null)el.dataset.hi=el.textContent;
      el.textContent=lang==='en'?el.dataset.en:el.dataset.hi;return;
    }
    if(el.dataset.hi==null)el.dataset.hi=el.innerHTML;
    el.innerHTML=lang==='en'?el.dataset.en:el.dataset.hi;
  });
  $all('[data-en-ph]').forEach(function(el){
    if(el.dataset.hiPh==null)el.dataset.hiPh=el.getAttribute('placeholder')||'';
    el.setAttribute('placeholder',lang==='en'?el.dataset.enPh:el.dataset.hiPh);
  });
  $all('[data-en-href]').forEach(function(el){
    if(el.dataset.hiHref==null)el.dataset.hiHref=el.getAttribute('href');
    el.setAttribute('href',lang==='en'?el.dataset.enHref:el.dataset.hiHref);
  });
  var b=$('#lang');if(b)b.textContent=lang==='en'?'हिंदी':'English';
  status();
  applyPrices();applyNotice();
}
document.addEventListener('click',function(ev){
  if(ev.target.closest('#lang')){lang=lang==='en'?'hi':'en';try{localStorage.setItem(LS,lang);}catch(e){}applyLang();return;}
  var a=ev.target.closest('a[data-order]');
  if(a){
    // the order menu opens in the same language as the website
    var h=a.getAttribute('href').replace(/([?&])lang=(hi|en)&?/,'$1').replace(/[?&]$/,'').replace(/[?&](#|$)/,'$1');
    var i=h.indexOf('#'),base=i<0?h:h.slice(0,i),hash=i<0?'':h.slice(i);
    a.setAttribute('href',base+(base.indexOf('?')<0?'?':'&')+'lang='+lang+hash);
  }
  var mb=ev.target.closest('[data-loadmap]');
  if(mb){
    var box=mb.closest('[data-map]');
    if(box)box.innerHTML='<iframe src="'+box.getAttribute('data-map')+'" title="MB Sweets map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
  }
});

/* ---------- shop open / closed (India time) ---------- */
function istHour(){var d=new Date();return ((d.getUTCHours()*60+d.getUTCMinutes()+330)%1440)/60;}
function status(){
  var el=$('#status');if(!el)return;
  var C=window.MB_CATALOG,o=(C&&C.shop&&C.shop.openHour)||7,c=(C&&C.shop&&C.shop.closeHour)||21,h=istHour();
  var open=h>=o&&h<c;
  el.className='status '+(open?'open':'shut');
  var txt=open?(lang==='en'?'Open now · till 9 pm':'अभी खुली है · रात 9 बजे तक'):(lang==='en'?'Closed now · opens 7 am · you can still order for tomorrow':'अभी बंद है · सुबह 7 बजे खुलेगी · अगले दिन का ऑर्डर अभी दे सकते हैं');
  el.lastElementChild.textContent=txt;
}

/* ---------- live prices & stock from the shop's list ---------- */
function applyPrices(){
  var C=window.MB_CATALOG;if(!C||!C.items)return;
  var P={};C.items.forEach(function(r){P[r[0]]=r[4];});
  $all('[data-pid]').forEach(function(el){var v=P[el.getAttribute('data-pid')];if(v!=null)el.textContent='₹'+v;});
}
function applyNotice(){
  var C=window.MB_CATALOG,n=$('#notice');if(!C||!n)return;
  var msg='';
  if(C.pause)msg=lang==='en'?'Sorry, online orders are closed today — you can still buy at the shop.':'माफ़ कीजिए, आज ऑनलाइन ऑर्डर बंद है — आप दुकान पर आकर ले सकते हैं।';
  else if(C.noticeHi)msg=lang==='en'&&C.noticeEn?C.noticeEn:C.noticeHi;
  n.textContent=msg;n.classList.toggle('on',!!msg);
}
function applyCatalog(){
  var C=window.MB_CATALOG;if(!C||!C.items)return;
  applyPrices();
  var off={};(C.off||[]).forEach(function(id){off[id]=1;});
  $all('[data-ids]').forEach(function(el){
    var ids=el.getAttribute('data-ids').split(',');
    el.classList.toggle('is-off',ids.every(function(id){return off[id];}));
  });
  applyNotice();
}

/* ---------- bulk order form → WhatsApp ---------- */
function pad(n){return n<10?'0'+n:''+n;}
/* show a form error where the customer can see it (not hidden under the bottom bar) */
function clearErr(box){
  var form=box.closest('form');
  $all('[aria-invalid]',form).forEach(function(x){x.removeAttribute('aria-invalid');});
  $all('.ferr',form).forEach(function(x){x.remove();});
  box.textContent='';
}
function showErr(box,msg,field){
  clearErr(box);
  box.textContent=field?'':msg;
  if(field){
    field.setAttribute('aria-invalid','true');
    var host=field.closest('.qty')||field.closest('.f');
    if(host){var d=document.createElement('div');d.className='ferr';d.setAttribute('role','alert');d.textContent=msg;host.appendChild(d);}
    try{field.focus({preventScroll:true});}catch(e){}
  }
  var target=field||box;
  try{target.scrollIntoView({block:'center',behavior:'smooth'});}catch(e){target.scrollIntoView();}
}
function dateKey(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
var MONTHS=['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];
function setupForm(){
  var f=$('#bulkform');if(!f)return;
  var min=new Date();min.setDate(min.getDate()+2);
  var di=$('#b-date');di.min=dateKey(min);
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var err=$('#b-err');clearErr(err);
    var name=$('#b-name').value.trim(),phone=$('#b-phone').value.replace(/\D/g,'').slice(-10);
    var sw=$all('input[name=sw]:checked').map(function(x){return x.value;});
    var qty=$('#b-qty').value.trim();
    var E=lang==='en';
    if(!di.value){showErr(err,E?'Please choose the date.':'कृपया तारीख चुनिए।',di);return;}
    if(di.value<dateKey(min)){showErr(err,E?'Bulk orders need at least 2 days — please pick a later date, or call us.':'बड़े ऑर्डर के लिए हमें कम से कम 2 दिन चाहिए — कृपया आगे की तारीख चुनिए, या हमें कॉल कीजिए।',di);return;}
    if(!sw.length&&!qty){showErr(err,E?'Tick the sweets you need, or write the total quantity.':'जो मिठाई चाहिए, कृपया उस पर टिक कीजिए या कुल मात्रा लिख दीजिए।',$('#b-qty'));return;}
    if(!name){showErr(err,E?'Please write your name.':'कृपया अपना नाम लिखिए।',$('#b-name'));return;}
    if(!/^[6-9]\d{9}$/.test(phone)){showErr(err,E?'Please write a 10-digit mobile number.':'कृपया 10 अंकों का मोबाइल नंबर लिखिए।',$('#b-phone'));return;}
    var p=di.value.split('-');
    var L=['नमस्ते MB Sweets 🙏','*बड़ा ऑर्डर (वेबसाइट से)*',
      'मौका: '+$('#b-occ').value,
      'तारीख: '+(+p[2])+' '+MONTHS[+p[1]-1]+' '+p[0],
      'मिठाई: '+(sw.length?sw.join(', '):'—'),
      'मात्रा: '+(qty||'—'),
      'लेने का तरीका: '+$('#b-mode').value,
      'नाम: '+name,'मोबाइल: '+phone];
    var place=$('#b-place').value.trim(),note=$('#b-note').value.trim();
    if(place)L.push('जगह: '+place);
    if(note)L.push('नोट: '+note);
    var url='https://api.whatsapp.com/send?phone=918002010218&text='+encodeURIComponent(L.join('\n'));
    var w=window.open(url,'_blank');if(!w)location.href=url;
  });
}

/* ---------- bulk dairy form → WhatsApp (tomorrow if before 2 pm India time) ---------- */
function istNow(){var d=new Date();return new Date(d.getTime()+(330+d.getTimezoneOffset())*60000);}
function setupDairy(){
  var f=$('#dairyform');if(!f)return;
  var now=istNow(),min=new Date(now.getFullYear(),now.getMonth(),now.getDate()+(now.getHours()<14?1:2));
  var di=$('#d-date');di.min=dateKey(min);
  function ruleText(){
    var E=lang==='en',d=min.getDate()+' '+(E?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][min.getMonth()]:MONTHS[min.getMonth()]);
    return E?('Earliest date for a new order: '+d+'.'):('नए ऑर्डर की सबसे जल्दी तारीख: '+d+'।');
  }
  var rule=$('#d-rule');if(rule)rule.textContent=ruleText();
  document.addEventListener('click',function(ev){if(ev.target.closest('#lang')&&rule)setTimeout(function(){rule.textContent=ruleText();},0);});
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var err=$('#d-err');clearErr(err);
    // the page may have been open since before 2 pm — work the earliest date out again
    var n2=istNow();min=new Date(n2.getFullYear(),n2.getMonth(),n2.getDate()+(n2.getHours()<14?1:2));di.min=dateKey(min);
    var E=lang==='en';
    function q(id){var v=parseFloat(($(id).value||'').replace(',','.'));return isFinite(v)&&v>0?v:0;}
    var fc=q('#d-fc'),tm=q('#d-tm'),dahi=q('#d-dahi'),pn=q('#d-paneer');
    var name=$('#d-name').value.trim(),phone=$('#d-phone').value.replace(/\D/g,'').slice(-10);
    if(!di.value){showErr(err,E?'Please choose the date.':'कृपया तारीख चुनिए।',di);return;}
    if(di.value<dateKey(min)){showErr(err,E?'That date is too soon — for tomorrow, order by 2 pm today. Please pick a later date, or call us.':'माफ़ कीजिए, यह तारीख बहुत जल्दी है — कल के लिए आज दोपहर 2 बजे तक ऑर्डर देना होता है। कृपया आगे की तारीख चुनिए, या हमें कॉल कीजिए।',di);return;}
    if(!(fc||tm||dahi||pn)){showErr(err,E?'Write how much milk, curd or paneer you need.':'कृपया लिखिए कि कितना दूध, दही या पनीर चाहिए।',$('#d-fc'));return;}
    if(!name){showErr(err,E?'Please write your name.':'कृपया अपना नाम लिखिए।',$('#d-name'));return;}
    if(!/^[6-9]\d{9}$/.test(phone)){showErr(err,E?'Please write a 10-digit mobile number.':'कृपया 10 अंकों का मोबाइल नंबर लिखिए।',$('#d-phone'));return;}
    var p=di.value.split('-');
    var L=['नमस्ते MB Sweets 🙏','*थोक दूध-दही-पनीर (वेबसाइट से)*',
      'अवसर: '+$('#d-occ').value,
      'तारीख: '+(+p[2])+' '+MONTHS[+p[1]-1]+' '+p[0]+', '+$('#d-time').value];
    if(fc)L.push('• दूध फुल क्रीम: '+fc+' लीटर');
    if(tm)L.push('• दूध टोंड: '+tm+' लीटर');
    if(dahi)L.push('• दही: '+dahi+' किलो');
    if(pn)L.push('• पनीर: '+pn+' किलो');
    var br=$('#d-brand').value.trim();if(br)L.push('कंपनी: '+br);
    L.push('लेने का तरीका: '+$('#d-mode').value,'नाम: '+name,'मोबाइल: '+phone);
    var place=$('#d-place').value.trim(),note=$('#d-note').value.trim();
    if(place)L.push('जगह: '+place);
    if(note)L.push('नोट: '+note);
    L.push('बड़ी मात्रा का रेट बताइए।');
    var url='https://api.whatsapp.com/send?phone=918002010218&text='+encodeURIComponent(L.join('\n'));
    var w=window.open(url,'_blank');if(!w)location.href=url;
  });
}

function showCurrentPill(){
  var strip=$('.pills'),on=strip&&strip.querySelector('[aria-current=page]');
  if(on&&strip.scrollWidth>strip.clientWidth)strip.scrollLeft=Math.max(0,on.offsetLeft-strip.clientWidth/2+on.offsetWidth/2);
}
function start(){
  var y=$('#yr');if(y)y.textContent=new Date().getFullYear();
  applyCatalog();applyLang();setupForm();setupDairy();showCurrentPill();
  setInterval(status,60000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

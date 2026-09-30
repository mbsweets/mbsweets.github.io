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
  var b=$('#lang');if(b)b.textContent=lang==='en'?'हिंदी':'English';
  status();
}
document.addEventListener('click',function(ev){
  if(ev.target.closest('#lang')){lang=lang==='en'?'hi':'en';try{localStorage.setItem(LS,lang);}catch(e){}applyLang();return;}
  var a=ev.target.closest('a[data-order]');
  if(a&&lang==='en'){
    var h=a.getAttribute('href');
    if(h.indexOf('lang=')<0){var i=h.indexOf('#');a.setAttribute('href',i<0?h+'?lang=en':h.slice(0,i)+'?lang=en'+h.slice(i));}
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
function applyCatalog(){
  var C=window.MB_CATALOG;if(!C||!C.items)return;
  var P={};C.items.forEach(function(r){P[r[0]]=r[4];});
  $all('[data-pid]').forEach(function(el){var v=P[el.getAttribute('data-pid')];if(v!=null)el.textContent='₹'+v;});
  var off={};(C.off||[]).forEach(function(id){off[id]=1;});
  $all('[data-ids]').forEach(function(el){
    var ids=el.getAttribute('data-ids').split(',');
    el.classList.toggle('is-off',ids.every(function(id){return off[id];}));
  });
  var n=$('#notice');
  if(n){
    var msg='';
    if(C.pause)msg=lang==='en'?'Online orders are closed today — you can still buy at the shop.':'आज ऑनलाइन ऑर्डर बंद है — दुकान पर आकर ले सकते हैं।';
    else if(C.noticeHi)msg=lang==='en'&&C.noticeEn?C.noticeEn:C.noticeHi;
    n.textContent=msg;n.classList.toggle('on',!!msg);
  }
}

/* ---------- bulk order form → WhatsApp ---------- */
function pad(n){return n<10?'0'+n:''+n;}
function dateKey(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
var MONTHS=['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];
function setupForm(){
  var f=$('#bulkform');if(!f)return;
  var min=new Date();min.setDate(min.getDate()+2);
  var di=$('#b-date');di.min=dateKey(min);
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var err=$('#b-err');err.textContent='';
    var name=$('#b-name').value.trim(),phone=$('#b-phone').value.replace(/\D/g,'').slice(-10);
    var sw=$all('input[name=sw]:checked').map(function(x){return x.value;});
    var E=lang==='en';
    if(!di.value){err.textContent=E?'Please choose the date.':'तारीख चुनिए।';di.focus();return;}
    if(di.value<dateKey(min)){err.textContent=E?'Bulk orders need at least 2 days — please pick a later date, or call us.':'बड़े ऑर्डर के लिए कम से कम 2 दिन चाहिए — आगे की तारीख चुनें, या कॉल करें।';di.focus();return;}
    if(!name){err.textContent=E?'Please write your name.':'अपना नाम लिखिए।';$('#b-name').focus();return;}
    if(!/^[6-9]\d{9}$/.test(phone)){err.textContent=E?'Please write a 10-digit mobile number.':'10 अंकों का मोबाइल नंबर लिखिए।';$('#b-phone').focus();return;}
    var p=di.value.split('-');
    var L=['नमस्ते MB Sweets 🙏','*बड़ा ऑर्डर (वेबसाइट से)*',
      'मौका: '+$('#b-occ').value,
      'तारीख: '+(+p[2])+' '+MONTHS[+p[1]-1]+' '+p[0],
      'मिठाई: '+(sw.length?sw.join(', '):'—'),
      'मात्रा: '+($('#b-qty').value.trim()||'—'),
      'लेने का तरीका: '+$('#b-mode').value,
      'नाम: '+name,'मोबाइल: '+phone];
    var place=$('#b-place').value.trim(),note=$('#b-note').value.trim();
    if(place)L.push('जगह: '+place);
    if(note)L.push('नोट: '+note);
    var url='https://api.whatsapp.com/send?phone=918002010218&text='+encodeURIComponent(L.join('\n'));
    var w=window.open(url,'_blank');if(!w)location.href=url;
  });
}

function start(){
  var y=$('#yr');if(y)y.textContent=new Date().getFullYear();
  applyCatalog();applyLang();setupForm();
  setInterval(status,60000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

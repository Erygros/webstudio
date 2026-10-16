export const leadinfoConsentKey = "webstudio-leadinfo-consent-v1";
export const leadinfoConsentDays = 180;

export function allowsLeadinfo(pathname: string) {
  return (
    !/^\/(crm|api)(\/|$)/.test(pathname) &&
    !/^\/bewertungen\/auftrag(\/|$)/.test(pathname) &&
    !/^\/leads\/download(\/|$)/.test(pathname)
  );
}

// Runs in <head>, before any provider request. No preload/preconnect without consent.
export const leadinfoBootstrap = `
(function(){
  if(/^\\/(crm|api)(\\/|$)/.test(location.pathname)||/^\\/bewertungen\\/auftrag(\\/|$)/.test(location.pathname)||/^\\/leads\\/download(\\/|$)/.test(location.pathname))return;
  try{
    var consent=JSON.parse(localStorage.getItem('${leadinfoConsentKey}')||'null');
    if(!consent||consent.allowed!==true||typeof consent.expires!=='number'||consent.expires<=Date.now())return;
  }catch(e){return;}
  window.addEventListener('storage',function(event){
    if(event.key==='${leadinfoConsentKey}'||event.key===null)location.reload();
  });
  // Full document navigation prevents an active tracker surviving into the CRM
  // or a private order page, and records public page visits without SPA hooks.
  document.addEventListener('click',function(event){
    if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    var anchor=event.target instanceof Element?event.target.closest('a[href]'):null;
    if(!anchor||anchor.hasAttribute('download')||(anchor.target&&anchor.target!=='_self'))return;
    var url=new URL(anchor.href,location.href);
    if(url.origin!==location.origin||(url.pathname===location.pathname&&url.search===location.search&&url.hash))return;
    event.preventDefault();event.stopImmediatePropagation();location.assign(url.href);
  },true);
  (function(l,e,a,d,i,n,f,o){if(!l[i]){l.GlobalLeadinfoNamespace=l.GlobalLeadinfoNamespace||[];
  l.GlobalLeadinfoNamespace.push(i);l[i]=function(){(l[i].q=l[i].q||[]).push(arguments)};l[i].t=l[i].t||n;
  l[i].q=l[i].q||[];o=e.createElement(a);f=e.getElementsByTagName(a)[0];o.async=1;o.src=d;f.parentNode.insertBefore(o,f);}
  }(window,document,'script','https://cdn.leadinfo.eu/ping.js','leadinfo','LI-6AD2003ABA2D7'));
})();`;

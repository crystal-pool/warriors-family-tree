"use strict";(self.webpackChunkwarriors_family_tree=self.webpackChunkwarriors_family_tree||[]).push([[440],{5834:(e,t,n)=>{n.d(t,{ZP:()=>l});var a=n(2122),o=n(7294),r=(n(5697),n(4670)),s={WebkitFontSmoothing:"antialiased",MozOsxFontSmoothing:"grayscale",boxSizing:"border-box"},i=function(e){return(0,a.Z)({color:e.palette.text.primary},e.typography.body2,{backgroundColor:e.palette.background.default,"@media print":{backgroundColor:e.palette.common.white}})};const l=(0,r.Z)((function(e){return{"@global":{html:s,"*, *::before, *::after":{boxSizing:"inherit"},"strong, b":{fontWeight:e.typography.fontWeightBold},body:(0,a.Z)({margin:0},i(e),{"&::backdrop":{backgroundColor:e.palette.background.default}})}}}),{name:"MuiCssBaseline"})((function(e){var t=e.children,n=void 0===t?null:t;return e.classes,o.createElement(o.Fragment,null,n)}))},2440:(e,t,n)=>{n.r(t),n.d(t,{AppEmbed:()=>w});var a=n(5834),o=n(7294),r=n(3073),s=n(5711),i=n(3782),l=n(8797);function c(){return window.parent!==window?window.parent:window.opener instanceof Window?window.opener:void 0}let d;function m(e){const t=c();return!!t&&(!!d&&(e.token=d,t.postMessage(e,"*"),!0))}let u,p,g=!1;async function b(e){if(g)throw new Error("ready message has already been posted");if(d=e,l.Hu.trackEvent({name:"postReadyMessage.embedReady",properties:{token:e}}),!m({type:"ready",revision:"35c68109764207c30d1ef3e8f9afe159dcf0bbbe",buildTimestamp:1658030663331}))return void l.Hu.trackTrace({message:"postReadyMessage: postInteropMessage failed.",severityLevel:s._.Warning});g=!0;const t=await function(e,t){const n=new i.GF,a=t&&t.subscribe((()=>{window.removeEventListener("message",o),n.tryCancel()}));function o(t){if(t.data&&"object"==typeof t.data&&t.data.token===d&&t.data.type===e)try{n.tryResolve(t.data)}finally{a&&a.dispose(),window.removeEventListener("message",o)}}return window.addEventListener("message",o),n.promiseLike}("initialize");l.Hu.trackEvent({name:"postReadyMessage.hostInitialize",properties:{message:t}}),p=t.settings||{},p.observeDocumentHeight&&function(){if(u)return;let e=0;u=new window.ResizeObserver((()=>{const t=document.documentElement.offsetHeight;t!==e&&(m({type:"documentHeightChanged",height:t}),e=t)})),u.observe(document.documentElement)}(),document.body.classList.add("embed"),p.scrollable||document.body.classList.add("noscroll")}var f=n(2663),y=n(3050);const w=e=>(o.useEffect((()=>{const t=!!c();t&&e.postMessageToken?b(e.postMessageToken):l.Hu.trackTrace({message:"Not posting embed ready message.",properties:{ownerPresent:t,postMessageToken:e.postMessageToken}})}),[]),o.createElement("main",{...(0,f.e5)("app:embed")},o.createElement(a.ZP,null),o.createElement(o.Suspense,{fallback:o.createElement(r.InitializationScreen,null)},o.createElement(y.d,{embed:!0}))))},3050:(e,t,n)=>{n.d(t,{d:()=>i});var a=n(7294),o=n(6974),r=n(7745);const s=(async()=>{const e=await Promise.resolve().then(n.bind(n,3073));return()=>a.createElement(o.Z5,null,a.createElement(o.AW,{path:e.routePaths.welcome,element:a.createElement(e.Welcome,null)}),a.createElement(o.AW,{path:e.routePaths.familyTree,element:a.createElement(e.FamilyTree,null)}),a.createElement(o.AW,{path:e.routePaths.entityProfile,element:a.createElement(e.EntityProfile,null)}))})(),i=a.lazy((async()=>(await r.c.initialization,{default:await s})))}}]);
//# sourceMappingURL=440.index.js.map
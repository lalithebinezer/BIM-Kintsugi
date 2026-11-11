var e=globalThis,t=e.ShadowRoot&&(e.ShadyCSS===void 0||e.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,n=Symbol(),r=new WeakMap,i=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,n=this.t;if(t&&e===void 0){let t=n!==void 0&&n.length===1;t&&(e=r.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&r.set(n,e))}return e}toString(){return this.cssText}},a=e=>new i(typeof e==`string`?e:e+``,void 0,n),o=(e,...t)=>new i(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,n),s=(n,r)=>{if(t)n.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let t of r){let r=document.createElement(`style`),i=e.litNonce;i!==void 0&&r.setAttribute(`nonce`,i),r.textContent=t.cssText,n.appendChild(r)}},c=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return a(t)})(e):e,{is:l,defineProperty:u,getOwnPropertyDescriptor:d,getOwnPropertyNames:f,getOwnPropertySymbols:p,getPrototypeOf:m}=Object,h=globalThis,g=h.trustedTypes,_=g?g.emptyScript:``,v=h.reactiveElementPolyfillSupport,y=(e,t)=>e,b={toAttribute(e,t){switch(t){case Boolean:e=e?_:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},x=(e,t)=>!l(e,t),S={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:x};Symbol.metadata??=Symbol(`metadata`),h.litPropertyMetadata??=new WeakMap;var C=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=S){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&u(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??S}static _$Ei(){if(this.hasOwnProperty(y(`elementProperties`)))return;let e=m(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(y(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y(`properties`))){let e=this.properties,t=[...f(e),...p(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(c(e))}else e!==void 0&&t.push(c(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return s(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?b:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?b:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??x)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};C.elementStyles=[],C.shadowRootOptions={mode:`open`},C[y(`elementProperties`)]=new Map,C[y(`finalized`)]=new Map,v?.({ReactiveElement:C}),(h.reactiveElementVersions??=[]).push(`2.1.2`);var w=globalThis,T=e=>e,E=w.trustedTypes,ee=E?E.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,te=`$lit$`,D=`lit$${Math.random().toFixed(9).slice(2)}$`,ne=`?`+D,re=`<${ne}>`,ie=document,ae=()=>ie.createComment(``),oe=e=>e===null||typeof e!=`object`&&typeof e!=`function`,se=Array.isArray,ce=e=>se(e)||typeof e?.[Symbol.iterator]==`function`,le=`[ 	
\f\r]`,ue=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,de=/-->/g,fe=/>/g,pe=RegExp(`>|${le}(?:([^\\s"'>=/]+)(${le}*=${le}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),me=/'/g,he=/"/g,ge=/^(?:script|style|textarea|title)$/i,O=(e=>(t,...n)=>({_$litType$:e,strings:t,values:n}))(1),_e=Symbol.for(`lit-noChange`),k=Symbol.for(`lit-nothing`),ve=new WeakMap,ye=ie.createTreeWalker(ie,129);function be(e,t){if(!se(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return ee===void 0?t:ee.createHTML(t)}var xe=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=ue;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===ue?c[1]===`!--`?o=de:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=pe):(ge.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=pe):o=fe:o===pe?c[0]===`>`?(o=i??ue,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?pe:c[3]===`"`?he:me):o===he||o===me?o=pe:o===de||o===fe?o=ue:(o=pe,i=void 0);let d=o===pe&&e[t+1].startsWith(`/>`)?` `:``;a+=o===ue?n+re:l>=0?(r.push(s),n.slice(0,l)+te+n.slice(l)+D+d):n+D+(l===-2?t:d)}return[be(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},Se=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=xe(t,n);if(this.el=e.createElement(l,r),ye.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=ye.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(te)){let t=u[o++],n=i.getAttribute(e).split(D),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?De:r[1]===`?`?Oe:r[1]===`@`?ke:Ee}),i.removeAttribute(e)}else e.startsWith(D)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(ge.test(i.tagName)){let e=i.textContent.split(D),t=e.length-1;if(t>0){i.textContent=E?E.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],ae()),ye.nextNode(),c.push({type:2,index:++a});i.append(e[t],ae())}}}else if(i.nodeType===8){if(i.data===ne)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(D,e+1))!==-1;)c.push({type:7,index:a}),e+=D.length-1}}a++}}static createElement(e,t){let n=ie.createElement(`template`);return n.innerHTML=e,n}};function Ce(e,t,n=e,r){if(t===_e)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=oe(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=Ce(e,i._$AS(e,t.values),i,r)),t}var we=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??ie).importNode(t,!0);ye.currentNode=r;let i=ye.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new Te(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new Ae(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=ye.nextNode(),a++)}return ye.currentNode=ie,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},Te=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=k,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Ce(this,e,t),oe(e)?e===k||e==null||e===``?(this._$AH!==k&&this._$AR(),this._$AH=k):e!==this._$AH&&e!==_e&&this._(e):e._$litType$===void 0?e.nodeType===void 0?ce(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==k&&oe(this._$AH)?this._$AA.nextSibling.data=e:this.T(ie.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=Se.createElement(be(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new we(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=ve.get(e.strings);return t===void 0&&ve.set(e.strings,t=new Se(e)),t}k(t){se(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(ae()),this.O(ae()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=T(e).nextSibling;T(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},Ee=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=k,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=k}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=Ce(this,e,t,0),a=!oe(e)||e!==this._$AH&&e!==_e,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=Ce(this,r[n+o],t,o),s===_e&&(s=this._$AH[o]),a||=!oe(s)||s!==this._$AH[o],s===k?e=k:e!==k&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===k?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},De=class extends Ee{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===k?void 0:e}},Oe=class extends Ee{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==k)}},ke=class extends Ee{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=Ce(this,e,t,0)??k)===_e)return;let n=this._$AH,r=e===k&&n!==k||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==k&&(n===k||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Ae=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){Ce(this,e)}},je={M:te,P:D,A:ne,C:1,L:xe,R:we,D:ce,V:Ce,I:Te,H:Ee,N:Oe,U:ke,B:De,F:Ae},Me=w.litHtmlPolyfillSupport;Me?.(Se,Te),(w.litHtmlVersions??=[]).push(`3.3.3`);var Ne=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new Te(t.insertBefore(ae(),e),e,void 0,n??{})}return i._$AI(e),i},Pe=globalThis,A=class extends C{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Ne(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return _e}};A._$litElement$=!0,A.finalized=!0,Pe.litElementHydrateSupport?.({LitElement:A});var Fe=Pe.litElementPolyfillSupport;Fe?.({LitElement:A}),(Pe.litElementVersions??=[]).push(`4.2.2`);var Ie={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:x},Le=(e=Ie,t,n)=>{let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function j(e){return(t,n)=>typeof n==`object`?Le(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}function M(e){return j({...e,state:!0,attribute:!1})}var Re=(e,t,n)=>(n.configurable=!0,n.enumerable=!0,Reflect.decorate&&typeof t!=`object`&&Object.defineProperty(e,t,n),n);function ze(e,t){return(n,r,i)=>{let a=t=>t.renderRoot?.querySelector(e)??null;if(t){let{get:e,set:t}=typeof r==`object`?n:i??(()=>{let e=Symbol();return{get(){return this[e]},set(t){this[e]=t}}})();return Re(n,r,{get(){let n=e.call(this);return n===void 0&&(n=a(this),(n!==null||this.hasUpdated)&&t.call(this,n)),n}})}return Re(n,r,{get(){return a(this)}})}}var{I:Be}=je,Ve=e=>e,He=e=>e.strings===void 0,Ue=()=>document.createComment(``),We=(e,t,n)=>{let r=e._$AA.parentNode,i=t===void 0?e._$AB:t._$AA;if(n===void 0)n=new Be(r.insertBefore(Ue(),i),r.insertBefore(Ue(),i),e,e.options);else{let t=n._$AB.nextSibling,a=n._$AM,o=a!==e;if(o){let t;n._$AQ?.(e),n._$AM=e,n._$AP!==void 0&&(t=e._$AU)!==a._$AU&&n._$AP(t)}if(t!==i||o){let e=n._$AA;for(;e!==t;){let t=Ve(e).nextSibling;Ve(r).insertBefore(e,i),e=t}}}return n},Ge=(e,t,n=e)=>(e._$AI(t,n),e),Ke={},qe=(e,t=Ke)=>e._$AH=t,Je=e=>e._$AH,Ye=e=>{e._$AR(),e._$AA.remove()},Xe={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Ze=e=>(...t)=>({_$litDirective$:e,values:t}),Qe=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}},$e=(e,t)=>{let n=e._$AN;if(n===void 0)return!1;for(let e of n)e._$AO?.(t,!1),$e(e,t);return!0},et=e=>{let t,n;do{if((t=e._$AM)===void 0)break;n=t._$AN,n.delete(e),e=t}while(n?.size===0)},tt=e=>{for(let t;t=e._$AM;e=t){let n=t._$AN;if(n===void 0)t._$AN=n=new Set;else if(n.has(e))break;n.add(e),it(t)}};function nt(e){this._$AN===void 0?this._$AM=e:(et(this),this._$AM=e,tt(this))}function rt(e,t=!1,n=0){let r=this._$AH,i=this._$AN;if(i!==void 0&&i.size!==0){if(t){if(Array.isArray(r))for(let e=n;e<r.length;e++)$e(r[e],!1),et(r[e]);else r!=null&&($e(r,!1),et(r))}else $e(this,e)}}var it=e=>{e.type==Xe.CHILD&&(e._$AP??=rt,e._$AQ??=nt)},at=class extends Qe{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,t,n){super._$AT(e,t,n),tt(this),this.isConnected=e._$AU}_$AO(e,t=!0){e!==this.isConnected&&(this.isConnected=e,e?this.reconnected?.():this.disconnected?.()),t&&($e(this,e),et(this))}setValue(e){if(He(this._$Ct))this._$Ct._$AI(e,this);else{let t=[...this._$Ct._$AH];t[this._$Ci]=e,this._$Ct._$AI(t,this,0)}}disconnected(){}reconnected(){}},ot=()=>new st,st=class{},ct=new WeakMap,lt=Ze(class extends at{render(e){return k}update(e,[t]){let n=t!==this.G;return n&&this.rt(void 0),(n||this.lt!==this.ct)&&(this.G=t,this.ht=e.options?.host,this.rt(this.ct=e.element)),k}rt(e){if(this.G!==void 0){if(this.isConnected||(e=void 0),typeof this.G==`function`){let t=this.ht??globalThis,n=ct.get(t);n===void 0&&(n=new WeakMap,ct.set(t,n)),n.get(this.G)!==void 0&&this.G.call(this.ht,void 0),n.set(this.G,e),e!==void 0&&this.G.call(this.ht,e)}else this.G.value=e}}get lt(){return typeof this.G==`function`?ct.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),ut=e=>e??k,dt=(e,t,n)=>{let r=new Map;for(let i=t;i<=n;i++)r.set(e[i],i);return r},ft=Ze(class extends Qe{constructor(e){if(super(e),e.type!==Xe.CHILD)throw Error(`repeat() can only be used in text expressions`)}dt(e,t,n){let r;n===void 0?n=t:t!==void 0&&(r=t);let i=[],a=[],o=0;for(let t of e)i[o]=r?r(t,o):o,a[o]=n(t,o),o++;return{values:a,keys:i}}render(e,t,n){return this.dt(e,t,n).values}update(e,[t,n,r]){let i=Je(e),{values:a,keys:o}=this.dt(t,n,r);if(!Array.isArray(i))return this.ut=o,a;let s=this.ut??=[],c=[],l,u,d=0,f=i.length-1,p=0,m=a.length-1;for(;d<=f&&p<=m;)if(i[d]===null)d++;else if(i[f]===null)f--;else if(s[d]===o[p])c[p]=Ge(i[d],a[p]),d++,p++;else if(s[f]===o[m])c[m]=Ge(i[f],a[m]),f--,m--;else if(s[d]===o[m])c[m]=Ge(i[d],a[m]),We(e,c[m+1],i[d]),d++,m--;else if(s[f]===o[p])c[p]=Ge(i[f],a[p]),We(e,i[d],i[f]),f--,p++;else if(l===void 0&&(l=dt(o,p,m),u=dt(s,d,f)),l.has(s[d])){if(l.has(s[f])){let t=u.get(o[p]),n=t===void 0?null:i[t];if(n===null){let t=We(e,i[d]);Ge(t,a[p]),c[p]=t}else c[p]=Ge(n,a[p]),We(e,i[d],n),i[t]=null;p++}else Ye(i[f]),f--}else Ye(i[d]),d++;for(;p<=m;){let t=We(e,c[m+1]);Ge(t,a[p]),c[p++]=t}for(;d<=f;){let e=i[d++];e!==null&&Ye(e)}return this.ut=o,qe(e,c),_e}}),pt=Ze(class extends Qe{constructor(e){if(super(e),e.type!==Xe.ATTRIBUTE||e.name!==`class`||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return` `+Object.keys(e).filter(t=>e[t]).join(` `)+` `}update(e,[t]){if(this.st===void 0){this.st=new Set,e.strings!==void 0&&(this.nt=new Set(e.strings.join(` `).split(/\s/).filter(e=>e!==``)));for(let e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}let n=e.element.classList;for(let e of this.st)e in t||(n.remove(e),this.st.delete(e));for(let e in t){let r=!!t[e];r===this.st.has(e)||this.nt?.has(e)||(r?(n.add(e),this.st.add(e)):(n.remove(e),this.st.delete(e)))}return _e}}),mt=`important`,ht=` !important`,gt=Ze(class extends Qe{constructor(e){if(super(e),e.type!==Xe.ATTRIBUTE||e.name!==`style`||e.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,n)=>{let r=e[n];return r==null?t:t+`${n=n.includes(`-`)?n:n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,`-$&`).toLowerCase()}:${r};`},``)}update(e,[t]){let{style:n}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(let e of this.ft)t[e]??(this.ft.delete(e),e.includes(`-`)?n.removeProperty(e):n[e]=null);for(let e in t){let r=t[e];if(r!=null){this.ft.add(e);let t=typeof r==`string`&&r.endsWith(ht);e.includes(`-`)||t?n.setProperty(e,t?r.slice(0,-11):r,t?mt:``):n[e]=r}}return _e}});function _t(e,t,n){return e?t(e):n?.(e)}var vt=Ze(class extends Qe{constructor(e){if(super(e),e.type!==Xe.PROPERTY&&e.type!==Xe.ATTRIBUTE&&e.type!==Xe.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!He(e))throw Error("`live` bindings can only contain a single expression")}render(e){return e}update(e,[t]){if(t===_e||t===k)return t;let n=e.element,r=e.name;if(e.type===Xe.PROPERTY){if(t===n[r])return _e}else if(e.type===Xe.BOOLEAN_ATTRIBUTE){if(!!t===n.hasAttribute(r))return _e}else if(e.type===Xe.ATTRIBUTE&&n.getAttribute(r)===t+``)return _e;return qe(e),t}}),yt=Object.defineProperty,bt=(e,t,n)=>t in e?yt(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,N=(e,t,n)=>(bt(e,typeof t==`symbol`?t:t+``,n),n),xt=Object.freeze({left:0,top:0,width:16,height:16}),St=Object.freeze({rotate:0,vFlip:!1,hFlip:!1}),Ct=Object.freeze({...xt,...St}),wt=Object.freeze({...Ct,body:``,hidden:!1}),Tt=Object.freeze({width:null,height:null}),Et=Object.freeze({...Tt,...St});function Dt(e,t=0){let n=e.replace(/^-?[0-9.]*/,``);function r(e){for(;e<0;)e+=4;return e%4}if(n===``){let t=parseInt(e);return isNaN(t)?0:r(t)}if(n!==e){let t=0;switch(n){case`%`:t=25;break;case`deg`:t=90}if(t){let i=parseFloat(e.slice(0,e.length-n.length));return isNaN(i)?0:(i/=t,i%1==0?r(i):0)}}return t}var Ot=/[\s,]+/;function kt(e,t){t.split(Ot).forEach(t=>{switch(t.trim()){case`horizontal`:e.hFlip=!0;break;case`vertical`:e.vFlip=!0}})}var At={...Et,preserveAspectRatio:``};function jt(e){let t={...At},n=(t,n)=>e.getAttribute(t)||n;return t.width=n(`width`,null),t.height=n(`height`,null),t.rotate=Dt(n(`rotate`,``)),kt(t,n(`flip`,``)),t.preserveAspectRatio=n(`preserveAspectRatio`,n(`preserveaspectratio`,``)),t}function Mt(e,t){for(let n in At)if(e[n]!==t[n])return!0;return!1}var Nt=/^[a-z0-9]+(-[a-z0-9]+)*$/,Pt=(e,t,n,r=``)=>{let i=e.split(`:`);if(e.slice(0,1)===`@`){if(i.length<2||i.length>3)return null;r=i.shift().slice(1)}if(i.length>3||!i.length)return null;if(i.length>1){let e=i.pop(),n=i.pop(),a={provider:i.length>0?i[0]:r,prefix:n,name:e};return t&&!Ft(a)?null:a}let a=i[0],o=a.split(`-`);if(o.length>1){let e={provider:r,prefix:o.shift(),name:o.join(`-`)};return t&&!Ft(e)?null:e}if(n&&r===``){let e={provider:r,prefix:``,name:a};return t&&!Ft(e,n)?null:e}return null},Ft=(e,t)=>e?!!((t&&e.prefix===``||e.prefix)&&e.name):!1;function It(e,t){let n=e.icons,r=e.aliases||Object.create(null),i=Object.create(null);function a(e){if(n[e])return i[e]=[];if(!(e in i)){i[e]=null;let t=r[e]&&r[e].parent,n=t&&a(t);n&&(i[e]=[t].concat(n))}return i[e]}return Object.keys(n).concat(Object.keys(r)).forEach(a),i}function Lt(e,t){let n={};!e.hFlip!=!t.hFlip&&(n.hFlip=!0),!e.vFlip!=!t.vFlip&&(n.vFlip=!0);let r=((e.rotate||0)+(t.rotate||0))%4;return r&&(n.rotate=r),n}function Rt(e,t){let n=Lt(e,t);for(let r in wt)r in St?r in e&&!(r in n)&&(n[r]=St[r]):r in t?n[r]=t[r]:r in e&&(n[r]=e[r]);return n}function zt(e,t,n){let r=e.icons,i=e.aliases||Object.create(null),a={};function o(e){a=Rt(r[e]||i[e],a)}return o(t),n.forEach(o),Rt(e,a)}function Bt(e,t){let n=[];if(typeof e!=`object`||typeof e.icons!=`object`)return n;e.not_found instanceof Array&&e.not_found.forEach(e=>{t(e,null),n.push(e)});let r=It(e);for(let i in r){let a=r[i];a&&(t(i,zt(e,i,a)),n.push(i))}return n}var Vt={provider:``,aliases:{},not_found:{},...xt};function Ht(e,t){for(let n in t)if(n in e&&typeof e[n]!=typeof t[n])return!1;return!0}function Ut(e){if(typeof e!=`object`||!e)return null;let t=e;if(typeof t.prefix!=`string`||!e.icons||typeof e.icons!=`object`||!Ht(e,Vt))return null;let n=t.icons;for(let e in n){let t=n[e];if(!e||typeof t.body!=`string`||!Ht(t,wt))return null}let r=t.aliases||Object.create(null);for(let e in r){let t=r[e],i=t.parent;if(!e||typeof i!=`string`||!n[i]&&!r[i]||!Ht(t,wt))return null}return t}var Wt=Object.create(null);function Gt(e,t){return{provider:e,prefix:t,icons:Object.create(null),missing:new Set}}function Kt(e,t){let n=Wt[e]||(Wt[e]=Object.create(null));return n[t]||(n[t]=Gt(e,t))}function qt(e,t){return Ut(t)?Bt(t,(t,n)=>{n?e.icons[t]=n:e.missing.add(t)}):[]}function Jt(e,t,n){try{if(typeof n.body==`string`)return e.icons[t]={...n},!0}catch{}return!1}function Yt(e,t){let n=[];return(typeof e==`string`?[e]:Object.keys(Wt)).forEach(e=>{(typeof e==`string`&&typeof t==`string`?[t]:Object.keys(Wt[e]||{})).forEach(t=>{let r=Kt(e,t);n=n.concat(Object.keys(r.icons).map(n=>(e===``?``:`@`+e+`:`)+t+`:`+n))})}),n}var Xt=!1;function Zt(e){return typeof e==`boolean`&&(Xt=e),Xt}function Qt(e){let t=typeof e==`string`?Pt(e,!0,Xt):e;if(t){let e=Kt(t.provider,t.prefix),n=t.name;return e.icons[n]||(e.missing.has(n)?null:void 0)}}function $t(e,t){let n=Pt(e,!0,Xt);if(!n)return!1;let r=Kt(n.provider,n.prefix);return t?Jt(r,n.name,t):(r.missing.add(n.name),!0)}function en(e,t){if(typeof e!=`object`)return!1;if(typeof t!=`string`&&(t=e.provider||``),Xt&&!t&&!e.prefix){let t=!1;return Ut(e)&&(e.prefix=``,Bt(e,(e,n)=>{$t(e,n)&&(t=!0)})),t}let n=e.prefix;return Ft({prefix:n,name:`a`})?!!qt(Kt(t,n),e):!1}function tn(e){return!!Qt(e)}function nn(e){let t=Qt(e);return t&&{...Ct,...t}}function rn(e,t){e.forEach(e=>{let n=e.loaderCallbacks;n&&(e.loaderCallbacks=n.filter(e=>e.id!==t))})}function an(e){e.pendingCallbacksFlag||(e.pendingCallbacksFlag=!0,setTimeout(()=>{e.pendingCallbacksFlag=!1;let t=e.loaderCallbacks?e.loaderCallbacks.slice(0):[];if(!t.length)return;let n=!1,r=e.provider,i=e.prefix;t.forEach(t=>{let a=t.icons,o=a.pending.length;a.pending=a.pending.filter(t=>{if(t.prefix!==i)return!0;let o=t.name;if(e.icons[o])a.loaded.push({provider:r,prefix:i,name:o});else if(e.missing.has(o))a.missing.push({provider:r,prefix:i,name:o});else return n=!0,!0;return!1}),a.pending.length!==o&&(n||rn([e],t.id),t.callback(a.loaded.slice(0),a.missing.slice(0),a.pending.slice(0),t.abort))})}))}var on=0;function sn(e,t,n){let r=on++,i=rn.bind(null,n,r);if(!t.pending.length)return i;let a={id:r,icons:t,callback:e,abort:i};return n.forEach(e=>{(e.loaderCallbacks||=[]).push(a)}),i}function cn(e){let t={loaded:[],missing:[],pending:[]},n=Object.create(null);e.sort((e,t)=>e.provider===t.provider?e.prefix===t.prefix?e.name.localeCompare(t.name):e.prefix.localeCompare(t.prefix):e.provider.localeCompare(t.provider));let r={provider:``,prefix:``,name:``};return e.forEach(e=>{if(r.name===e.name&&r.prefix===e.prefix&&r.provider===e.provider)return;r=e;let i=e.provider,a=e.prefix,o=e.name,s=n[i]||(n[i]=Object.create(null)),c=s[a]||(s[a]=Kt(i,a)),l;l=o in c.icons?t.loaded:a===``||c.missing.has(o)?t.missing:t.pending;let u={provider:i,prefix:a,name:o};l.push(u)}),t}var ln=Object.create(null);function un(e,t){ln[e]=t}function dn(e){return ln[e]||ln[``]}function fn(e,t=!0,n=!1){let r=[];return e.forEach(e=>{let i=typeof e==`string`?Pt(e,t,n):e;i&&r.push(i)}),r}function pn(e){let t;if(typeof e.resources==`string`)t=[e.resources];else if(t=e.resources,!(t instanceof Array)||!t.length)return null;return{resources:t,path:e.path||`/`,maxURL:e.maxURL||500,rotate:e.rotate||750,timeout:e.timeout||5e3,random:e.random===!0,index:e.index||0,dataAfterTimeout:e.dataAfterTimeout!==!1}}for(var mn=Object.create(null),hn=[`https://api.simplesvg.com`,`https://api.unisvg.com`],gn=[];hn.length>0;)hn.length===1||Math.random()>.5?gn.push(hn.shift()):gn.push(hn.pop());mn[``]=pn({resources:[`https://api.iconify.design`].concat(gn)});function _n(e,t){let n=pn(t);return n!==null&&(mn[e]=n,!0)}function vn(e){return mn[e]}function yn(){return Object.keys(mn)}var bn={resources:[],index:0,timeout:2e3,rotate:750,random:!1,dataAfterTimeout:!1};function xn(e,t,n,r){let i=e.resources.length,a=e.random?Math.floor(Math.random()*i):e.index,o;if(e.random){let t=e.resources.slice(0);for(o=[];t.length>1;){let e=Math.floor(Math.random()*t.length);o.push(t[e]),t=t.slice(0,e).concat(t.slice(e+1))}o=o.concat(t)}else o=e.resources.slice(a).concat(e.resources.slice(0,a));let s=Date.now(),c=`pending`,l=0,u,d=null,f=[],p=[];typeof r==`function`&&p.push(r);function m(){d&&=(clearTimeout(d),null)}function h(){c===`pending`&&(c=`aborted`),m(),f.forEach(e=>{e.status===`pending`&&(e.status=`aborted`)}),f=[]}function g(e,t){t&&(p=[]),typeof e==`function`&&p.push(e)}function _(){return{startTime:s,payload:t,status:c,queriesSent:l,queriesPending:f.length,subscribe:g,abort:h}}function v(){c=`failed`,p.forEach(e=>{e(void 0,u)})}function y(){f.forEach(e=>{e.status===`pending`&&(e.status=`aborted`)}),f=[]}function b(t,n,r){let i=n!==`success`;switch(f=f.filter(e=>e!==t),c){case`pending`:break;case`failed`:if(i||!e.dataAfterTimeout)return;break;default:return}if(n===`abort`){u=r,v();return}if(i){u=r,f.length||(o.length?x():v());return}if(m(),y(),!e.random){let n=e.resources.indexOf(t.resource);n!==-1&&n!==e.index&&(e.index=n)}c=`completed`,p.forEach(e=>{e(r)})}function x(){if(c!==`pending`)return;m();let r=o.shift();if(r===void 0){if(f.length){d=setTimeout(()=>{m(),c===`pending`&&(y(),v())},e.timeout);return}v();return}let i={status:`pending`,resource:r,callback:(e,t)=>{b(i,e,t)}};f.push(i),l++,d=setTimeout(x,e.rotate),n(r,t,i.callback)}return setTimeout(x),_}function Sn(e){let t={...bn,...e},n=[];function r(){n=n.filter(e=>e().status===`pending`)}function i(e,i,a){let o=xn(t,e,i,(e,t)=>{r(),a&&a(e,t)});return n.push(o),o}function a(e){return n.find(t=>e(t))||null}return{query:i,find:a,setIndex:e=>{t.index=e},getIndex:()=>t.index,cleanup:r}}function Cn(){}var wn=Object.create(null);function Tn(e){if(!wn[e]){let t=vn(e);if(!t)return;wn[e]={config:t,redundancy:Sn(t)}}return wn[e]}function En(e,t,n){let r,i;if(typeof e==`string`){let t=dn(e);if(!t)return n(void 0,424),Cn;i=t.send;let a=Tn(e);a&&(r=a.redundancy)}else{let t=pn(e);if(t){r=Sn(t);let n=dn(e.resources?e.resources[0]:``);n&&(i=n.send)}}return!r||!i?(n(void 0,424),Cn):r.query(t,i,n)().abort}function Dn(){}function On(e){e.iconsLoaderFlag||(e.iconsLoaderFlag=!0,setTimeout(()=>{e.iconsLoaderFlag=!1,an(e)}))}function kn(e){let t=[],n=[];return e.forEach(e=>{(e.match(Nt)?t:n).push(e)}),{valid:t,invalid:n}}function An(e,t,n){function r(){let n=e.pendingIcons;t.forEach(t=>{n&&n.delete(t),e.icons[t]||e.missing.add(t)})}if(n&&typeof n==`object`)try{if(!qt(e,n).length){r();return}}catch(e){console.error(e)}r(),On(e)}function jn(e,t){e instanceof Promise?e.then(e=>{t(e)}).catch(()=>{t(null)}):t(e)}function Mn(e,t){e.iconsToLoad=e.iconsToLoad?e.iconsToLoad.concat(t).sort():t,e.iconsQueueFlag||(e.iconsQueueFlag=!0,setTimeout(()=>{e.iconsQueueFlag=!1;let{provider:t,prefix:n}=e,r=e.iconsToLoad;if(delete e.iconsToLoad,!r||!r.length)return;let i=e.loadIcon;if(e.loadIcons&&(r.length>1||!i)){jn(e.loadIcons(r,n,t),t=>{An(e,r,t)});return}if(i){r.forEach(r=>{jn(i(r,n,t),t=>{An(e,[r],t?{prefix:n,icons:{[r]:t}}:null)})});return}let{valid:a,invalid:o}=kn(r);if(o.length&&An(e,o,null),!a.length)return;let s=n.match(Nt)?dn(t):null;if(!s){An(e,a,null);return}s.prepare(t,n,a).forEach(n=>{En(t,n,t=>{An(e,n.icons,t)})})}))}var Nn=(e,t)=>{let n=cn(fn(e,!0,Zt()));if(!n.pending.length){let e=!0;return t&&setTimeout(()=>{e&&t(n.loaded,n.missing,n.pending,Dn)}),()=>{e=!1}}let r=Object.create(null),i=[],a,o;return n.pending.forEach(e=>{let{provider:t,prefix:n}=e;if(n===o&&t===a)return;a=t,o=n,i.push(Kt(t,n));let s=r[t]||(r[t]=Object.create(null));s[n]||(s[n]=[])}),n.pending.forEach(e=>{let{provider:t,prefix:n,name:i}=e,a=Kt(t,n),o=a.pendingIcons||=new Set;o.has(i)||(o.add(i),r[t][n].push(i))}),i.forEach(e=>{let t=r[e.provider][e.prefix];t.length&&Mn(e,t)}),t?sn(t,n,i):Dn},Pn=e=>new Promise((t,n)=>{let r=typeof e==`string`?Pt(e,!0):e;if(!r){n(e);return}Nn([r||e],i=>{if(i.length&&r){let e=Qt(r);if(e){t({...Ct,...e});return}}n(e)})});function Fn(e){try{let t=typeof e==`string`?JSON.parse(e):e;if(typeof t.body==`string`)return{...t}}catch{}}function In(e,t){if(typeof e==`object`)return{data:Fn(e),value:e};if(typeof e!=`string`)return{value:e};if(e.includes(`{`)){let t=Fn(e);if(t)return{data:t,value:e}}let n=Pt(e,!0,!0);if(!n)return{value:e};let r=Qt(n);return r!==void 0||!n.prefix?{value:e,name:n,data:r}:{value:e,name:n,loading:Nn([n],()=>t(e,n,Qt(n)))}}var Ln=!1;try{Ln=navigator.vendor.indexOf(`Apple`)===0}catch{}function Rn(e,t){switch(t){case`svg`:case`bg`:case`mask`:return t}return t!==`style`&&(Ln||e.indexOf(`<a`)===-1)?`svg`:e.indexOf(`currentColor`)===-1?`bg`:`mask`}var zn=/(-?[0-9.]*[0-9]+[0-9.]*)/g,Bn=/^-?[0-9.]*[0-9]+[0-9.]*$/g;function Vn(e,t,n){if(t===1)return e;if(n||=100,typeof e==`number`)return Math.ceil(e*t*n)/n;if(typeof e!=`string`)return e;let r=e.split(zn);if(r===null||!r.length)return e;let i=[],a=r.shift(),o=Bn.test(a);for(;;){if(o){let e=parseFloat(a);isNaN(e)?i.push(a):i.push(Math.ceil(e*t*n)/n)}else i.push(a);if(a=r.shift(),a===void 0)return i.join(``);o=!o}}function Hn(e,t=`defs`){let n=``,r=e.indexOf(`<`+t);for(;r>=0;){let i=e.indexOf(`>`,r),a=e.indexOf(`</`+t);if(i===-1||a===-1)break;let o=e.indexOf(`>`,a);if(o===-1)break;n+=e.slice(i+1,a).trim(),e=e.slice(0,r).trim()+e.slice(o+1)}return{defs:n,content:e}}function Un(e,t){return e?`<defs>`+e+`</defs>`+t:t}function Wn(e,t,n){let r=Hn(e);return Un(r.defs,t+r.content+n)}var Gn=e=>e===`unset`||e===`undefined`||e===`none`;function Kn(e,t){let n={...Ct,...e},r={...Et,...t},i={left:n.left,top:n.top,width:n.width,height:n.height},a=n.body;[n,r].forEach(e=>{let t=[],n=e.hFlip,r=e.vFlip,o=e.rotate;n?r?o+=2:(t.push(`translate(`+(i.width+i.left).toString()+` `+(0-i.top).toString()+`)`),t.push(`scale(-1 1)`),i.top=i.left=0):r&&(t.push(`translate(`+(0-i.left).toString()+` `+(i.height+i.top).toString()+`)`),t.push(`scale(1 -1)`),i.top=i.left=0);let s;switch(o<0&&(o-=Math.floor(o/4)*4),o%=4,o){case 1:s=i.height/2+i.top,t.unshift(`rotate(90 `+s.toString()+` `+s.toString()+`)`);break;case 2:t.unshift(`rotate(180 `+(i.width/2+i.left).toString()+` `+(i.height/2+i.top).toString()+`)`);break;case 3:s=i.width/2+i.left,t.unshift(`rotate(-90 `+s.toString()+` `+s.toString()+`)`)}o%2==1&&(i.left!==i.top&&(s=i.left,i.left=i.top,i.top=s),i.width!==i.height&&(s=i.width,i.width=i.height,i.height=s)),t.length&&(a=Wn(a,`<g transform="`+t.join(` `)+`">`,`</g>`))});let o=r.width,s=r.height,c=i.width,l=i.height,u,d;o===null?(d=s===null?`1em`:s===`auto`?l:s,u=Vn(d,c/l)):(u=o===`auto`?c:o,d=s===null?Vn(u,l/c):s===`auto`?l:s);let f={},p=(e,t)=>{Gn(t)||(f[e]=t.toString())};p(`width`,u),p(`height`,d);let m=[i.left,i.top,c,l];return f.viewBox=m.join(` `),{attributes:f,viewBox:m,body:a}}function qn(e,t){let n=e.indexOf(`xlink:`)===-1?``:` xmlns:xlink="http://www.w3.org/1999/xlink"`;for(let e in t)n+=` `+e+`="`+t[e]+`"`;return`<svg xmlns="http://www.w3.org/2000/svg"`+n+`>`+e+`</svg>`}function Jn(e){return e.replace(/"/g,`'`).replace(/%/g,`%25`).replace(/#/g,`%23`).replace(/</g,`%3C`).replace(/>/g,`%3E`).replace(/\s+/g,` `)}function Yn(e){return`data:image/svg+xml,`+Jn(e)}function Xn(e){return`url("`+Yn(e)+`")`}var Zn=(()=>{let e;try{if(e=fetch,typeof e==`function`)return e}catch{}})();function Qn(e){Zn=e}function $n(){return Zn}function er(e,t){let n=vn(e);if(!n)return 0;let r;if(!n.maxURL)r=0;else{let e=0;n.resources.forEach(t=>{e=Math.max(e,t.length)});let i=t+`.json?icons=`;r=n.maxURL-e-n.path.length-i.length}return r}function tr(e){return e===404}var nr=(e,t,n)=>{let r=[],i=er(e,t),a=`icons`,o={type:a,provider:e,prefix:t,icons:[]},s=0;return n.forEach((n,c)=>{s+=n.length+1,s>=i&&c>0&&(r.push(o),o={type:a,provider:e,prefix:t,icons:[]},s=n.length),o.icons.push(n)}),r.push(o),r};function rr(e){if(typeof e==`string`){let t=vn(e);if(t)return t.path}return`/`}var ir={prepare:nr,send:(e,t,n)=>{if(!Zn){n(`abort`,424);return}let r=rr(t.provider);switch(t.type){case`icons`:{let e=t.prefix,n=t.icons.join(`,`),i=new URLSearchParams({icons:n});r+=e+`.json?`+i.toString();break}case`custom`:{let e=t.uri;r+=e.slice(0,1)===`/`?e.slice(1):e;break}default:n(`abort`,400);return}let i=503;Zn(e+r).then(e=>{let t=e.status;if(t!==200){setTimeout(()=>{n(tr(t)?`abort`:`next`,t)});return}return i=501,e.json()}).then(e=>{if(typeof e!=`object`||!e){setTimeout(()=>{e===404?n(`abort`,e):n(`next`,i)});return}setTimeout(()=>{n(`success`,e)})}).catch(()=>{n(`next`,i)})}};function ar(e,t,n){Kt(n||``,t).loadIcons=e}function or(e,t,n){Kt(n||``,t).loadIcon=e}var sr=`data-style`,cr=``;function lr(e){cr=e}function ur(e,t){let n=Array.from(e.childNodes).find(e=>e.hasAttribute&&e.hasAttribute(sr));n||(n=document.createElement(`style`),n.setAttribute(sr,sr),e.appendChild(n)),n.textContent=`:host{display:inline-block;vertical-align:`+(t?`-0.125em`:`0`)+`}span,svg{display:block;margin:auto}`+cr}function dr(){un(``,ir),Zt(!0);let e;try{e=window}catch{}if(e){if(e.IconifyPreload!==void 0){let t=e.IconifyPreload,n=`Invalid IconifyPreload syntax.`;typeof t==`object`&&t&&(t instanceof Array?t:[t]).forEach(e=>{try{(typeof e!=`object`||!e||e instanceof Array||typeof e.icons!=`object`||typeof e.prefix!=`string`||!en(e))&&console.error(n)}catch{console.error(n)}})}if(e.IconifyProviders!==void 0){let t=e.IconifyProviders;if(typeof t==`object`&&t)for(let e in t){let n=`IconifyProviders[`+e+`] is invalid.`;try{let r=t[e];if(typeof r!=`object`||!r||r.resources===void 0)continue;_n(e,r)||console.error(n)}catch{console.error(n)}}}}return{iconLoaded:tn,getIcon:nn,listIcons:Yt,addIcon:$t,addCollection:en,calculateSize:Vn,buildIcon:Kn,iconToHTML:qn,svgToURL:Xn,loadIcons:Nn,loadIcon:Pn,addAPIProvider:_n,setCustomIconLoader:or,setCustomIconsLoader:ar,appendCustomStyle:lr,_api:{getAPIConfig:vn,setAPIModule:un,sendAPIQuery:En,setFetch:Qn,getFetch:$n,listAPIProviders:yn}}}var fr={"background-color":`currentColor`},pr={"background-color":`transparent`},mr={image:`var(--svg)`,repeat:`no-repeat`,size:`100% 100%`},hr={"-webkit-mask":fr,mask:fr,background:pr};for(let e in hr){let t=hr[e];for(let n in mr)t[e+`-`+n]=mr[n]}function gr(e){return e?e+(e.match(/^[-0-9.]+$/)?`px`:``):`inherit`}function _r(e,t,n){let r=document.createElement(`span`),i=e.body;i.indexOf(`<a`)!==-1&&(i+=`<!-- `+Date.now()+` -->`);let a=e.attributes,o=Xn(qn(i,{...a,width:t.width+``,height:t.height+``})),s=r.style,c={"--svg":o,width:gr(a.width),height:gr(a.height),...n?fr:pr};for(let e in c)s.setProperty(e,c[e]);return r}var vr;function yr(){try{vr=window.trustedTypes.createPolicy(`iconify`,{createHTML:e=>e})}catch{vr=null}}function br(e){return vr===void 0&&yr(),vr?vr.createHTML(e):e}function xr(e){let t=document.createElement(`span`),n=e.attributes,r=``;return n.width||(r=`width: inherit;`),n.height||(r+=`height: inherit;`),r&&(n.style=r),t.innerHTML=br(qn(e.body,n)),t.firstChild}function Sr(e){return Array.from(e.childNodes).find(e=>{let t=e.tagName&&e.tagName.toUpperCase();return t===`SPAN`||t===`SVG`})}function Cr(e,t){let n=t.icon.data,r=t.customisations,i=Kn(n,r);r.preserveAspectRatio&&(i.attributes.preserveAspectRatio=r.preserveAspectRatio);let a=t.renderedMode,o;switch(a){case`svg`:o=xr(i);break;default:o=_r(i,{...Ct,...n},a===`mask`)}let s=Sr(e);s?o.tagName===`SPAN`&&s.tagName===o.tagName?s.setAttribute(`style`,o.getAttribute(`style`)):e.replaceChild(o,s):e.appendChild(o)}function wr(e,t,n){return{rendered:!1,inline:t,icon:e,lastRender:n&&(n.rendered?n:n.lastRender)}}function Tr(e=`iconify-icon`){let t,n;try{t=window.customElements,n=window.HTMLElement}catch{return}if(!t||!n)return;let r=t.get(e);if(r)return r;let i=[`icon`,`mode`,`inline`,`noobserver`,`width`,`height`,`rotate`,`flip`],a=class extends n{constructor(){super(),N(this,`_shadowRoot`),N(this,`_initialised`,!1),N(this,`_state`),N(this,`_checkQueued`,!1),N(this,`_connected`,!1),N(this,`_observer`,null),N(this,`_visible`,!0);let e=this._shadowRoot=this.attachShadow({mode:`open`}),t=this.hasAttribute(`inline`);ur(e,t),this._state=wr({value:``},t),this._queueCheck()}connectedCallback(){this._connected=!0,this.startObserver()}disconnectedCallback(){this._connected=!1,this.stopObserver()}static get observedAttributes(){return i.slice(0)}attributeChangedCallback(e){switch(e){case`inline`:{let e=this.hasAttribute(`inline`),t=this._state;e!==t.inline&&(t.inline=e,ur(this._shadowRoot,e));break}case`noobserver`:this.hasAttribute(`noobserver`)?this.startObserver():this.stopObserver();break;default:this._queueCheck()}}get icon(){let e=this.getAttribute(`icon`);if(e&&e.slice(0,1)===`{`)try{return JSON.parse(e)}catch{}return e}set icon(e){typeof e==`object`&&(e=JSON.stringify(e)),this.setAttribute(`icon`,e)}get inline(){return this.hasAttribute(`inline`)}set inline(e){e?this.setAttribute(`inline`,`true`):this.removeAttribute(`inline`)}get observer(){return this.hasAttribute(`observer`)}set observer(e){e?this.setAttribute(`observer`,`true`):this.removeAttribute(`observer`)}restartAnimation(){let e=this._state;if(e.rendered){let t=this._shadowRoot;if(e.renderedMode===`svg`)try{t.lastChild.setCurrentTime(0);return}catch{}Cr(t,e)}}get status(){let e=this._state;return e.rendered?`rendered`:e.icon.data===null?`failed`:`loading`}_queueCheck(){this._checkQueued||(this._checkQueued=!0,setTimeout(()=>{this._check()}))}_check(){if(!this._checkQueued)return;this._checkQueued=!1;let e=this._state,t=this.getAttribute(`icon`);if(t!==e.icon.value){this._iconChanged(t);return}if(!e.rendered||!this._visible)return;let n=this.getAttribute(`mode`),r=jt(this);(e.attrMode!==n||Mt(e.customisations,r)||!Sr(this._shadowRoot))&&this._renderIcon(e.icon,r,n)}_iconChanged(e){let t=In(e,(e,t,n)=>{let r=this._state;if(r.rendered||this.getAttribute(`icon`)!==e)return;let i={value:e,name:t,data:n};i.data?this._gotIconData(i):r.icon=i});t.data?this._gotIconData(t):this._state=wr(t,this._state.inline,this._state)}_forceRender(){if(!this._visible){let e=Sr(this._shadowRoot);e&&this._shadowRoot.removeChild(e);return}this._queueCheck()}_gotIconData(e){this._checkQueued=!1,this._renderIcon(e,jt(this),this.getAttribute(`mode`))}_renderIcon(e,t,n){let r=Rn(e.data.body,n),i=this._state.inline;Cr(this._shadowRoot,this._state={rendered:!0,icon:e,inline:i,customisations:t,attrMode:n,renderedMode:r})}startObserver(){if(!this._observer&&!this.hasAttribute(`noobserver`))try{this._observer=new IntersectionObserver(e=>{let t=e.some(e=>e.isIntersecting);t!==this._visible&&(this._visible=t,this._forceRender())}),this._observer.observe(this)}catch{if(this._observer){try{this._observer.disconnect()}catch{}this._observer=null}}}stopObserver(){this._observer&&(this._observer.disconnect(),this._observer=null,this._visible=!0,this._connected&&this._forceRender())}};i.forEach(e=>{e in a.prototype||Object.defineProperty(a.prototype,e,{get:function(){return this.getAttribute(e)},set:function(t){t===null?this.removeAttribute(e):this.setAttribute(e,t)}})});let o=dr();for(let e in o)a[e]=a.prototype[e]=o[e];return t.define(e,a),a}var{iconLoaded:Er,getIcon:Dr,listIcons:Or,addIcon:kr,addCollection:Ar,calculateSize:jr,buildIcon:Mr,iconToHTML:Nr,svgToURL:Pr,loadIcons:Fr,loadIcon:Ir,setCustomIconLoader:Lr,setCustomIconsLoader:Rr,addAPIProvider:zr,_api:Br}=Tr()||dr(),Vr={scrollbar:o`
  ::-webkit-scrollbar {
    width: 0.4rem;
    height: 0.4rem;
    overflow: hidden;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 0.25rem;
    background-color: var(
      --bim-scrollbar--c,
      var(--bim-ui_bg-contrast-60)
    );
  }

  ::-webkit-scrollbar-track {
    background-color: var(--bim-scrollbar--bgc, var(--bim-ui_bg-contrast-40));
  }
`,globalStyles:o`
  :root {
    /* Grayscale Colors */
    --bim-ui_gray-0: #19191E; /* app background */
    --bim-ui_gray-1: #262629; /* card / elevated surface */
    --bim-ui_gray-2: #3C3C41; /* button bg / component surface */
    --bim-ui_gray-3: #46464B; /* button hover */
    --bim-ui_gray-4: #5F5F64;
    --bim-ui_gray-5: #76767B;
    --bim-ui_gray-6: #909095;
    --bim-ui_gray-7: #A7A7AB; /* icon / secondary text */
    --bim-ui_gray-8: #BEBEC2;
    --bim-ui_gray-9: #D7D7DA;
    --bim-ui_gray-10: #F0F0F0; /* near-white text / light bg */

    /* Brand Colors */
    --bim-ui_main-base: #6528d7;
    --bim-ui_accent-base: #bcf124;

    /* Brand Colors Contrasts */
    --bim-ui_main-contrast: var(--bim-ui_gray-10);
    --bim-ui_accent-contrast: var(--bim-ui_gray-0);

    /* Status Colors */
    --bim-ui_danger-base: #f04f4f;
    --bim-ui_danger-contrast: var(--bim-ui_gray-10);
    --bim-ui_warning-base: #f0a030;
    --bim-ui_warning-contrast: var(--bim-ui_gray-0);
    --bim-ui_success-base: #4caf72;
    --bim-ui_success-contrast: var(--bim-ui_gray-0);
    --bim-ui_info-base: #4a90d9;
    --bim-ui_info-contrast: var(--bim-ui_gray-10);

    /* Sizes */
    --bim-ui_size-4xs: 0.0625rem; /* 1px */
    --bim-ui_size-3xs: 0.1875rem; /* 3px */
    --bim-ui_size-2xs: 0.3125rem; /* 5px */
    --bim-ui_size-xs: 0.4375rem; /* 7px */
    --bim-ui_size-sm: 0.5625rem; /* 9px */
    --bim-ui_size-base: 0.6875rem; /* 11px */
    --bim-ui_size-lg: 0.8125rem; /* 13px */
    --bim-ui_size-xl: 0.9375rem; /* 15px */
    --bim-ui_size-2xl: 1.0625rem; /* 17px */
    --bim-ui_size-3xl: 1.1875rem; /* 19px */
    --bim-ui_size-4xl: 1.3125rem; /* 21px */
    --bim-ui_size-5xl: 1.4375rem; /* 23px */
    --bim-ui_size-6xl: 1.5625rem; /* 25px */
    --bim-ui_size-7xl: 1.6875rem; /* 27px */
    --bim-ui_size-8xl: 1.8125rem; /* 29px */
    --bim-ui_size-9xl: 1.9375rem; /* 31px */
    --bim-ui_size-10xl: 2.0625rem; /* 33px */
    --bim-ui_size-11xl: 2.1875rem; /* 35px */
    --bim-ui_size-12xl: 2.3125rem; /* 37px */
    --bim-ui_size-13xl: 2.4375rem; /* 39px */
    --bim-ui_size-14xl: 2.5625rem; /* 41px */
    --bim-ui_size-15xl: 2.6875rem; /* 43px */
    --bim-ui_size-16xl: 2.8125rem; /* 45px */
    --bim-ui_size-17xl: 2.9375rem; /* 47px */
    --bim-ui_size-18xl: 3.0625rem; /* 49px */
    --bim-ui_size-19xl: 3.1875rem; /* 51px */
    --bim-ui_size-20xl: 3.3125rem; /* 53px */
    --bim-ui_size-21xl: 3.4375rem; /* 55px */
    --bim-ui_size-22xl: 3.5625rem; /* 57px */
  }

  /* Background Colors */
  @media (prefers-color-scheme: dark) {
    :root {
      --bim-ui_bg-base: var(--bim-ui_gray-0);
      --bim-ui_bg-contrast-10: var(--bim-ui_gray-1);
      --bim-ui_bg-contrast-20: var(--bim-ui_gray-2);
      --bim-ui_bg-contrast-30: var(--bim-ui_gray-3);
      --bim-ui_bg-contrast-40: var(--bim-ui_gray-4);
      --bim-ui_bg-contrast-50: var(--bim-ui_gray-5);
      --bim-ui_bg-contrast-60: var(--bim-ui_gray-6);
      --bim-ui_bg-contrast-70: var(--bim-ui_gray-7);
      --bim-ui_bg-contrast-80: var(--bim-ui_gray-8);
      --bim-ui_bg-contrast-90: var(--bim-ui_gray-9);
      --bim-ui_bg-contrast-100: var(--bim-ui_gray-10);
    }
  }

  @media (prefers-color-scheme: light) {
    :root {
      --bim-ui_bg-base: var(--bim-ui_gray-10);
      --bim-ui_bg-contrast-10: var(--bim-ui_gray-9);
      --bim-ui_bg-contrast-20: var(--bim-ui_gray-8);
      --bim-ui_bg-contrast-30: var(--bim-ui_gray-7);
      --bim-ui_bg-contrast-40: var(--bim-ui_gray-6);
      --bim-ui_bg-contrast-50: var(--bim-ui_gray-5);
      --bim-ui_bg-contrast-60: var(--bim-ui_gray-4);
      --bim-ui_bg-contrast-70: var(--bim-ui_gray-3);
      --bim-ui_bg-contrast-80: var(--bim-ui_gray-2);
      --bim-ui_bg-contrast-90: var(--bim-ui_gray-1);
      --bim-ui_bg-contrast-100: var(--bim-ui_gray-0);
      --bim-ui_accent-base: #6528d7;
    }
  }

  .theme-transition-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    filter: drop-shadow(0 0 10px var(--bim-ui_bg-base));
    z-index: 9999;
  }

  .theme-transition-overlay > div {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--bim-ui_bg-base);
  }

  html.bim-ui-dark {
    --bim-ui_bg-base: var(--bim-ui_gray-0);
    --bim-ui_bg-contrast-10: var(--bim-ui_gray-1);
    --bim-ui_bg-contrast-20: var(--bim-ui_gray-2);
    --bim-ui_bg-contrast-30: var(--bim-ui_gray-3);
    --bim-ui_bg-contrast-40: var(--bim-ui_gray-4);
    --bim-ui_bg-contrast-50: var(--bim-ui_gray-5);
    --bim-ui_bg-contrast-60: var(--bim-ui_gray-6);
    --bim-ui_bg-contrast-70: var(--bim-ui_gray-7);
    --bim-ui_bg-contrast-80: var(--bim-ui_gray-8);
    --bim-ui_bg-contrast-90: var(--bim-ui_gray-9);
    --bim-ui_bg-contrast-100: var(--bim-ui_gray-10);
  }

  html.bim-ui-light {
    --bim-ui_bg-base: var(--bim-ui_gray-10);
    --bim-ui_bg-contrast-10: var(--bim-ui_gray-9);
    --bim-ui_bg-contrast-20: var(--bim-ui_gray-8);
    --bim-ui_bg-contrast-30: var(--bim-ui_gray-7);
    --bim-ui_bg-contrast-40: var(--bim-ui_gray-6);
    --bim-ui_bg-contrast-50: var(--bim-ui_gray-5);
    --bim-ui_bg-contrast-60: var(--bim-ui_gray-4);
    --bim-ui_bg-contrast-70: var(--bim-ui_gray-3);
    --bim-ui_bg-contrast-80: var(--bim-ui_gray-2);
    --bim-ui_bg-contrast-90: var(--bim-ui_gray-1);
    --bim-ui_bg-contrast-100: var(--bim-ui_gray-0);
    --bim-ui_accent-base: #6528d7;
  }

  @keyframes toggleOverlay {
    0%,
    99% {
      display: block;
    }

    100% {
      display: none;
    }
  }

  @keyframes toggleThemeAnimation {
    0% {
      clip-path: circle(0% at center top);
    }
    45%,
    55% {
      clip-path: circle(150% at center center);
    }
    100% {
      clip-path: circle(0% at center bottom);
    }
  }

  [data-context-dialog]::backdrop {
    background-color: transparent;
  }
`},Hr=class e{static set config(t){this._config={...e._config,...t}}static get config(){return e._config}static addGlobalStyles(){let e=document.querySelector(`style[id='bim-ui']`);if(e)return;e=document.createElement(`style`),e.id=`bim-ui`,e.textContent=Vr.globalStyles.cssText;let t=document.head.firstChild;t?document.head.insertBefore(e,t):document.head.append(e)}static preloadIcons(e,t=!1){Fr(e,(e,n,r)=>{t&&(console.log(`Icons loaded:`,e),n.length&&console.warn(`Icons missing:`,n),r.length&&console.info(`Icons pending:`,r))})}static addIconsCollection(e,t){Ar({prefix:t?.prefix??`bim`,icons:e,width:24,height:24})}static defineCustomElement(e,t){customElements.get(e)||customElements.define(e,t)}static registerComponents(){e.init()}static init(t=``,n=!0){e.addGlobalStyles(),e.defineCustomElement(`bim-button`,ii),e.defineCustomElement(`bim-checkbox`,ui),e.defineCustomElement(`bim-color-input`,yi),e.defineCustomElement(`bim-context-menu`,uo),e.defineCustomElement(`bim-dropdown`,_o),e.defineCustomElement(`bim-empty-state`,So),e.defineCustomElement(`bim-grid`,Io),e.defineCustomElement(`bim-icon`,Bo),e.defineCustomElement(`bim-input`,Wo),e.defineCustomElement(`bim-label`,Jo),e.defineCustomElement(`bim-number-input`,hi),e.defineCustomElement(`bim-option`,fo),e.defineCustomElement(`bim-panel`,$o),e.defineCustomElement(`bim-panel-section`,rs),e.defineCustomElement(`bim-selector`,ss),e.defineCustomElement(`bim-table`,Ns),e.defineCustomElement(`bim-tabs`,Us),e.defineCustomElement(`bim-tab`,Rs),e.defineCustomElement(`bim-table-cell`,ys),e.defineCustomElement(`bim-table-children`,xs),e.defineCustomElement(`bim-table-group`,Ts),e.defineCustomElement(`bim-table-row`,ks),e.defineCustomElement(`bim-text-input`,Ys),e.defineCustomElement(`bim-toolbar`,lc),e.defineCustomElement(`bim-toolbar-group`,ec),e.defineCustomElement(`bim-toolbar-section`,ac),e.defineCustomElement(`bim-viewport`,pc),e.defineCustomElement(`bim-chart-legend`,_c),e.defineCustomElement(`bim-chart`,Z),e.defineCustomElement(`bim-tooltip`,Iy),e.defineCustomElement(`bim-slider`,$),e.defineCustomElement(`bim-paper-space`,Wy),e.defineCustomElement(`bim-modal`,Jy),e.defineCustomElement(`bim-sortable-list`,$y),n&&this.animateOnLoad(t)}static newRandomId(){let e=``;for(let t=0;t<10;t++){let t=Math.floor(Math.random()*62);e+=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`.charAt(t)}return e}static animateOnLoad(e=``){let t=[];function n(e,t=document,r=new Set){let i=[];return Array.from(t.querySelectorAll(e)).forEach(e=>{r.has(e)||(r.add(e),i.push(e))}),Array.from(t.querySelectorAll(`*`)).filter(e=>e.shadowRoot).forEach(t=>{r.has(t)||(r.add(t),i.push(...n(e,t.shadowRoot,r)))}),i}requestAnimationFrame(()=>{n(e||`
      bim-input,
      bim-button,
      bim-checkbox,
      bim-selector,
      bim-table-row,
      bim-panel-section,
      bim-table-children .branch-vertical,
      .switchers
    `).forEach(e=>{let n=e,r=`auto`;r=window.getComputedStyle(n).getPropertyValue(`transition`),n.style.setProperty(`opacity`,`0`),n.style.setProperty(`transition`,`none`),requestAnimationFrame(()=>{n.style.setProperty(`transition`,r)}),t.push(n)});let r=()=>{t.forEach(e=>{let t=e,n=(t.getBoundingClientRect().x+t.getBoundingClientRect().y)/(window.innerWidth+window.innerHeight),r=window.getComputedStyle(t).getPropertyValue(`transform`),i=200+n*1e3;window.matchMedia(`(prefers-reduced-motion: reduce)`).matches||(t.animate([{transform:`translateY(-20px)`,opacity:`0`},{transform:`translateY(0)`,opacity:`1`}],{duration:400,easing:`ease-in-out`,delay:i}),setTimeout(()=>{t.style.removeProperty(`opacity`),r===`none`?t.style.removeProperty(`transform`):t.style.setProperty(`transform`,r)},i+400))})};document.readyState===`complete`?r():window.addEventListener(`load`,r)})}static toggleTheme(e=!0){let t=document.querySelector(`html`);if(!t)return;let n=()=>{t.classList.contains(`bim-ui-dark`)?t.classList.replace(`bim-ui-dark`,`bim-ui-light`):t.classList.contains(`bim-ui-light`)?t.classList.replace(`bim-ui-light`,`bim-ui-dark`):t.classList.add(`bim-ui-light`)};if(e){let e=document.createElement(`div`);e.classList.add(`theme-transition-overlay`);let t=document.createElement(`div`);e.appendChild(t),t.style.setProperty(`transition`,`background-color ${1e3/3200}s`),document.body.appendChild(e),e.style.setProperty(`animation`,`toggleOverlay 1s ease-in forwards`),t.style.setProperty(`animation`,`toggleThemeAnimation 1s ease forwards`),setTimeout(()=>{n()},250),setTimeout(()=>{document.body.querySelectorAll(`.theme-transition-overlay`).forEach(e=>{document.body.removeChild(e)})},1e3)}else n()}};Hr._config={sectionLabelOnVerticalToolbar:!1,internalComponentNameAttribute:`bim-element-name`};var Ur=Hr,Wr=class extends A{constructor(){super(...arguments),this._lazyLoadObserver=null,this._visibleElements=[],this.ELEMENTS_BEFORE_OBSERVER=20,this.useObserver=!1,this.elements=new Set,this.observe=e=>{if(!this.useObserver)return;for(let t of e)this.elements.add(t);let t=e.slice(this.ELEMENTS_BEFORE_OBSERVER);for(let e of t)e.remove();this.observeLastElement()}}set visibleElements(e){this._visibleElements=this.useObserver?e:[],this.requestUpdate()}get visibleElements(){return this._visibleElements}getLazyObserver(){if(!this.useObserver)return null;if(this._lazyLoadObserver)return this._lazyLoadObserver;let e=new IntersectionObserver(t=>{let n=t[0];if(!n.isIntersecting)return;let r=n.target;e.unobserve(r);let i=this.ELEMENTS_BEFORE_OBSERVER+this.visibleElements.length,a=[...this.elements][i];a&&(this.visibleElements=[...this.visibleElements,a],e.observe(a))},{threshold:.5});return e}observeLastElement(){let e=this.getLazyObserver();if(!e)return;let t=this.ELEMENTS_BEFORE_OBSERVER+this.visibleElements.length-1,n=[...this.elements][t];n&&e.observe(n)}resetVisibleElements(){let e=this.getLazyObserver();if(e){for(let t of this.elements)e.unobserve(t);this.visibleElements=[],this.observeLastElement()}}static create(e,t){let n=document.createDocumentFragment();if(e.length===0)return Ne(e(),n),n.firstElementChild;if(!t)throw Error(`UIComponent: Initial state is required for statefull components.`);let r=t,i=e,a=e=>(r={...r,...e},Ne(i(r,a),n),r);a(t);let o=n.firstElementChild,s={getElement:e=>o.querySelector(`[data-${Ur.config.internalComponentNameAttribute}="${e}"]`),getCurrentState:()=>r,dispose:()=>{o.remove(),r={},s.updates={}},updates:{}};return[o,a,s]}},Gr=(e,t={},n=!0)=>{let r={};for(let i of e.children){let e=i,a=e.getAttribute(`name`)||e.getAttribute(`label`),o=a?t[a]:void 0;if(a){if(`value`in e&&typeof e.value<`u`&&e.value!==null){let t=e.value;if(typeof t==`object`&&!Array.isArray(t)&&Object.keys(t).length===0)continue;r[a]=o?o(e.value):e.value}else if(n){let n=Gr(e,t);if(Object.keys(n).length===0)continue;r[a]=o?o(n):n}}else n&&(r={...r,...Gr(e,t)})}return r},Kr=e=>e===`true`||e===`false`?e===`true`:e&&!isNaN(Number(e))&&e.trim()!==``?Number(e):e,qr=[`>=`,`<=`,`=`,`>`,`<`,`?`,`/`,`#`];function Jr(e){let t=qr.find(t=>e.split(t).length===2),[n,r]=e.split(t).map(e=>e.trim());return{key:n,condition:t,value:r.startsWith(`'`)&&r.endsWith(`'`)?r.replace(/'/g,``):Kr(r)}}var Yr=e=>{try{let t=[],n=e.split(/&(?![^()]*\))/).map(e=>e.trim());for(let e of n){let n=!e.startsWith(`(`)&&!e.endsWith(`)`),r=e.startsWith(`(`)&&e.endsWith(`)`);if(n){let n=Jr(e);t.push(n)}if(r){let n={operator:`&`,queries:e.replace(/^(\()|(\))$/g,``).split(`&`).map(e=>e.trim()).map((e,t)=>{let n=Jr(e);return t>0&&(n.operator=`&`),n})};t.push(n)}}return t}catch{return null}},Xr=(e,t,n)=>{let r=!1;switch(t){case`=`:r=e===n;break;case`?`:r=String(e).includes(String(n));break;case`<`:(typeof e==`number`||typeof n==`number`)&&(r=e<n);break;case`<=`:(typeof e==`number`||typeof n==`number`)&&(r=e<=n);break;case`>`:(typeof e==`number`||typeof n==`number`)&&(r=e>n);break;case`>=`:(typeof e==`number`||typeof n==`number`)&&(r=e>=n);break;case`/`:r=String(e).startsWith(String(n))}return r},Zr=class{constructor(){this.enabled=!0,this.trigger=e=>{if(!this.enabled)return;let t=this.handlers.slice(0);for(let n of t)n(e)},this.handlers=[]}add(e){this.handlers.push(e)}remove(e){this.handlers=this.handlers.filter(t=>t!==e)}reset(){this.handlers.length=0}},Qr=class extends Set{constructor(e){super(e),this.onUpdated=new Zr,this.onItemAdded=new Zr,this.onBeforeDelete=new Zr,this.onItemDeleted=new Zr,this.onCleared=new Zr,this.guard=()=>!0,this.deleteGuard=()=>!0}set eventsEnabled(e){this.onUpdated.enabled=e,this.onItemAdded.enabled=e,this.onItemDeleted.enabled=e,this.onBeforeDelete.enabled=e,this.onCleared.enabled=e}clear(){for(let e of this)this.onBeforeDelete.trigger(e);super.clear(),this.onCleared.trigger(),this.onUpdated.trigger()}add(...e){for(let t of e)this.has(t)||!(this.guard??(()=>!0))(t)||(super.add(t),this.onItemAdded||=new Zr,this.onItemAdded.trigger(t));return this.onUpdated||=new Zr,this.onUpdated.trigger(),this}delete(e){if(!this.has(e)||!this.deleteGuard(e))return!1;this.onBeforeDelete.trigger(e);let t=super.delete(e);return t&&(this.onItemDeleted.trigger(e),this.onUpdated.trigger()),t}deleteIf(e){for(let t of this)e(t)&&this.delete(t)}getIndex(e){let t=0;for(let n of this){if(n===e)return t;t++}return-1}dispose(){this.clear(),this.onItemAdded.reset(),this.onItemDeleted.reset(),this.onCleared.reset(),this.onBeforeDelete.reset(),this.onUpdated.reset()}},$r=Object.defineProperty,ei=Object.getOwnPropertyDescriptor,ti=(e,t,n,r)=>{for(var i=r>1?void 0:r?ei(t,n):t,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=(r?o(t,n,i):o(i))||i);return r&&i&&$r(t,n,i),i},ni,ri=(ni=class extends A{constructor(){super(),this.labelHidden=!1,this.active=!1,this.disabled=!1,this.vertical=!1,this.ghost=!1,this._loading=!1,this._menuDialog=ot(),this._movedChildren=[],this._onParentClick=e=>{e.stopPropagation(),!this.disabled&&!this._loading&&this.dispatchEvent(new Event(`click`))},this._onHostClick=()=>{!this.disabled&&!this._loading&&this._hasContextMenu()&&this._openMenu()},this._onKeyDown=e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this._onParentClick(e))},this._onDialogClick=e=>{e.stopPropagation(),e.target===this._menuDialog.value&&this._closeMenu()},this._onDialogCancel=e=>{e.preventDefault(),this._closeMenu()},this.hasAttribute(`role`)||this.setAttribute(`role`,`button`),this.hasAttribute(`tabindex`)||this.setAttribute(`tabindex`,`0`)}get tooltipTime(){return this._tooltipTime}set tooltipTime(e){let t=this._tooltipTime;this._tooltipTime=e,e!==void 0&&console.warn(`[bim-button] tooltipTime is deprecated. Use <bim-tooltip timeout="..."> inside the button instead.`),this.requestUpdate(`tooltipTime`,t)}get tooltipTitle(){return this._tooltipTitle}set tooltipTitle(e){let t=this._tooltipTitle;this._tooltipTitle=e,e!==void 0&&console.warn(`[bim-button] tooltipTitle is deprecated. Use <bim-tooltip> inside the button instead.`),this.requestUpdate(`tooltipTitle`,t)}get tooltipText(){return this._tooltipText}set tooltipText(e){let t=this._tooltipText;this._tooltipText=e,e!==void 0&&console.warn(`[bim-button] tooltipText is deprecated. Use <bim-tooltip> inside the button instead.`),this.requestUpdate(`tooltipText`,t)}set loading(e){let t=this._loading;this._loading=e,this.requestUpdate(`loading`,t)}get loading(){return this._loading}_hasContextMenu(){return!!(this.querySelector(`bim-context-menu`)||this.contextMenuTemplate)}_updateMenuPosition(){let e=this._menuDialog.value;if(!e)return;let t=window.innerWidth,n=window.innerHeight,r=this.getBoundingClientRect(),i=e.getBoundingClientRect(),a=r.right+10,o=r.top;a+i.width>t-5&&(a=r.left-i.width-10),o+i.height>n-5&&(o=n-i.height-5),o=Math.max(5,o),e.style.left=`${a}px`,e.style.top=`${o}px`}_openMenu(){let e=this._menuDialog.value;if(!e)return;for(;e.firstChild;)e.removeChild(e.firstChild);this._movedChildren=[];let t=this.querySelector(`bim-context-menu`);if(this.contextMenuTemplate){let t=document.createElement(`div`);Ne(this.contextMenuTemplate(),t);let n=t.querySelector(`bim-context-menu`)??t;for(let t of[...n.children])e.append(t)}else if(t){this._movedChildren=[...t.children];for(let t of this._movedChildren)e.append(t)}if(e.children.length){if(this.getAttribute(`data-context-group`)){this.closeNestedContexts();let t=Ur.newRandomId();for(let n of e.children)n.tagName===`BIM-BUTTON`&&n.setAttribute(`data-context-group`,t)}ni._openMenuButtons.add(this),e.showModal(),this._updateMenuPosition()}}_closeMenu(){let e=this._menuDialog.value;if(!e||!e.open)return;e.close(),ni._openMenuButtons.delete(this),this.dispatchEvent(new Event(`menuclose`,{bubbles:!0,composed:!0}));let t=this.querySelector(`bim-context-menu`);if(t&&this._movedChildren.length)for(let e of this._movedChildren)t.append(e);for(this._movedChildren=[];e.firstChild;)e.removeChild(e.firstChild);for(let t of[...e.children])t.tagName===`BIM-BUTTON`&&t.removeAttribute(`data-context-group`);this.dispatchEvent(new Event(`hidden`))}closeNestedContexts(){let e=this.getAttribute(`data-context-group`);if(e)for(let t of ni._openMenuButtons)t!==this&&t.getAttribute(`data-context-group`)===e&&(t._closeMenu(),t.removeAttribute(`data-context-group`))}click(){!this.disabled&&!this._loading&&this.dispatchEvent(new Event(`click`))}connectedCallback(){super.connectedCallback(),this.addEventListener(`click`,this._onHostClick),this.addEventListener(`keydown`,this._onKeyDown)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(`click`,this._onHostClick),this.removeEventListener(`keydown`,this._onKeyDown),this._closeMenu()}updated(e){super.updated(e),(e.has(`disabled`)||e.has(`loading`))&&(this.disabled||this._loading?this.setAttribute(`aria-disabled`,`true`):this.removeAttribute(`aria-disabled`)),(e.has(`label`)||e.has(`labelHidden`)||e.has(`icon`)||e.has(`tooltipTitle`))&&(this.labelHidden&&this.label?this.setAttribute(`aria-label`,this.label):!this.label&&this.icon&&this.setAttribute(`aria-label`,this._tooltipTitle??this.icon))}render(){let e=this._hasContextMenu(),t=this._loading?`eos-icons:loading`:this.icon,n=O`${this.label}`;return e&&this.label&&(n=O`
        <div style="display: flex; align-items: center;">
          ${this.label}
          ${ni._chevron}
        </div>
      `),O`
      <div class="parent" @click=${this._onParentClick}>
        ${this.label||t?O`
              <div class="button">
                <bim-label
                  .icon=${t}
                  .vertical=${this.vertical}
                  .labelHidden=${this.labelHidden}
                  >${n}</bim-label
                >
              </div>
            `:null}
      </div>
      <slot></slot>
      <dialog
        ${lt(this._menuDialog)}
        @click=${this._onDialogClick}
        @cancel=${this._onDialogCancel}
      ></dialog>
    `}},ni._chevron=O`<svg
    xmlns="http://www.w3.org/2000/svg"
    height="1.125rem"
    viewBox="0 0 24 24"
    width="1.125rem"
    class="chevron"
  >
    <path d="M0 0h24v24H0V0z" fill="none" />
    <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
  </svg>`,ni._openMenuButtons=new Set,ni.styles=o`
    :host {
      --bim-label--c: var(--bim-ui_bg-contrast-100, white);
      position: relative;
      display: block;
      pointer-events: none;
      background-color: var(--bim-button--bgc, var(--bim-ui_bg-contrast-20));
      border-radius: var(--bim-ui_size-2xs);
      transition: background-color 0.15s;
    }

    :host(:not([disabled]):not([loading]):hover) {
      background-color: var(--bim-button--bgc-h, var(--bim-ui_bg-contrast-30));
      cursor: pointer;
    }

    :host(:focus-visible) {
      outline: 2px solid var(--bim-ui_main-base);
      outline-offset: 2px;
    }

    bim-label {
      pointer-events: none;
    }

    .parent {
      --bim-icon--c: var(--bim-label--c);
      position: relative;
      display: flex;
      height: 100%;
      user-select: none;
      row-gap: 0.125rem;
      min-height: 25px;
      min-width: 25px;
    }

    .button,
    .children {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
    }

    .children {
      padding: 0 0.375rem;
      position: absolute;
      height: 100%;
      right: 0;
    }

    :host(:not([label-hidden])[icon][vertical]) .parent {
      min-height: var(--bim-ui_size-10xl);
      min-width: var(--bim-ui_size-10xl);
    }

    .button {
      flex-grow: 1;
    }

    :host(:not([label-hidden])[label]) .button {
      justify-content: var(--bim-button--jc, center);
    }

    :host([active]) {
      --bim-label--c: var(--bim-ui_main-contrast);
      background-color: var(--bim-ui_main-base);
    }

    :host(:not([label]):not([icon])) .children {
      flex: 1;
    }

    :host([vertical]) .parent {
      justify-content: center;
    }

    :host(:not([label-hidden])[label]) .button {
      padding: 0 6px;
    }

    :host([disabled]),
    :host([loading]) {
      --bim-label--c: var(--bim-ui_bg-contrast-50);
      background-color: var(--bim-button--disabled-bgc, var(--bim-ui_bg-contrast-20));
    }

    :host([ghost]) {
      background-color: transparent;
      --bim-label--c: var(--bim-ui_bg-contrast-60);
    }

    :host([ghost]:not([disabled]):not([loading]):hover) {
      background-color: transparent;
      --bim-label--c: var(--bim-ui_bg-contrast-100);
    }

    :host([ghost][disabled]),
    :host([ghost][loading]) {
      background-color: transparent;
    }

    .chevron {
      fill: var(--bim-label--c);
      flex-shrink: 0;
    }

    /* Buttons inside the context menu dialog */
    dialog bim-button {
      --bim-icon--fz: var(--bim-ui_size-base);
      --bim-button--bdrs: var(--bim-ui_size-4xs);
      --bim-button--bgc: transparent;
      --bim-button--bgc-h: var(--bim-ui_bg-contrast-20);
      --bim-button--olw: 0;
      --bim-button--olc: transparent;
    }

    dialog {
      position: fixed;
      margin: 0;
      padding: 0.375rem;
      border: none;
      outline: none;
      border-radius: 4px;
      background-color: var(--bim-ui_bg-contrast-10);
      box-shadow: 1px 2px 8px 2px rgba(0, 0, 0, 0.15);
      overflow: auto;
      max-height: 20rem;
      min-width: 3rem;
      display: none;
      flex-direction: column;
      pointer-events: auto;
    }

    dialog[open] {
      display: flex;
    }

    dialog::backdrop {
      background: transparent;
      pointer-events: auto;
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        transition: none;
      }
    }
  `,ni);ti([j({type:String,reflect:!0})],ri.prototype,`label`,2),ti([j({type:Boolean,attribute:`label-hidden`,reflect:!0})],ri.prototype,`labelHidden`,2),ti([j({type:Boolean,reflect:!0})],ri.prototype,`active`,2),ti([j({type:Boolean,reflect:!0,attribute:`disabled`})],ri.prototype,`disabled`,2),ti([j({type:String,reflect:!0})],ri.prototype,`icon`,2),ti([j({type:Boolean,reflect:!0})],ri.prototype,`vertical`,2),ti([j({type:Boolean,reflect:!0})],ri.prototype,`ghost`,2),ti([j({type:Number,attribute:`tooltip-time`,reflect:!0})],ri.prototype,`tooltipTime`,1),ti([j({type:String,attribute:`tooltip-title`,reflect:!0})],ri.prototype,`tooltipTitle`,1),ti([j({type:String,attribute:`tooltip-text`,reflect:!0})],ri.prototype,`tooltipText`,1),ti([j({type:Boolean,reflect:!0})],ri.prototype,`loading`,1);var ii=ri,ai=Object.defineProperty,oi=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&ai(t,n,i),i},si=O`<svg part="checkmark" viewBox="0 0 21 21"><polyline points="5 10.75 8.5 14.25 16 6"></polyline></svg>`,ci=O`<svg part="checkmark" viewBox="0 0 21 21"><line x1="5" y1="10.5" x2="16" y2="10.5"></line></svg>`,li=class extends A{constructor(){super(...arguments),this.checked=!1,this.indeterminate=!1,this.disabled=!1,this.inverted=!1,this.onValueChange=new Event(`change`)}get value(){return this.checked}set value(e){this.checked=e}updated(e){super.updated(e),e.has(`disabled`)&&this.setAttribute(`aria-disabled`,String(this.disabled))}onChange(e){e.stopPropagation();let t=e.target;t&&(this.checked=t.checked,this.indeterminate=!1,this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0})))}render(){return O`
      <label class="parent-label">
        ${this.icon||this.label?O`<bim-label .icon="${this.icon}">${this.label??``}</bim-label>`:k}
        <div class="input-container">
          <input
            part="input"
            type="checkbox"
            name=${ut(this.name)}
            aria-label=${this.label||this.name||`Checkbox Input`}
            @change="${this.onChange}"
            .checked="${this.checked}"
            .indeterminate="${this.indeterminate}"
            .disabled="${this.disabled}"
          />
          ${this.indeterminate?ci:si}
        </div>
      </label>
    `}};li.shadowRootOptions={...A.shadowRootOptions,delegatesFocus:!0},li.styles=o`
    :host {
      display: block;
    }

    .parent-label {
      --background: var(--bim-checkbox--bg, var(--bim-ui_bg-contrast-30));
      --border: var(--bim-checkbox--bd-c, var(--bim-ui_bg-contrast-50));
      --stroke: var(--bim-checkbox--stroke-c, var(--bim-ui_main-contrast));
      --border-hover: var(--bim-checkbox--bd-h-c, var(--bim-ui_bg-contrast-70));
      --border-active: var(--bim-checkbox--bd-active-c, var(--bim-ui_main-base));
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      width: 100%;
      height: 25px;
      column-gap: 0.25rem;
      position: relative;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }

    :host([inverted]) .parent-label {
      flex-direction: row-reverse;
      justify-content: start;
    }

    :host([disabled]) {
      cursor: not-allowed;
    }

    :host([disabled]) .parent-label {
      pointer-events: none;
      opacity: 0.4;
    }

    input,
    svg {
      width: 1rem;
      height: 1rem;
      display: block;
    }

    .input-container {
      position: relative;
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    input {
      -webkit-appearance: none;
      -moz-appearance: none;
      outline: none;
      background: var(--background);
      border: none;
      margin: 0;
      padding: 0;
      cursor: pointer;
      border-radius: var(--bim-checkbox--bdrs, 4px);
      transition: box-shadow 0.3s;
      box-shadow: inset 0 0 0 var(--s, 1px) var(--b, var(--border));
    }

    input:focus-visible {
      outline: 2px solid var(--bim-ui_main-base);
      outline-offset: 2px;
    }

    svg {
      pointer-events: none;
      fill: none;
      stroke-width: 2.2px;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke: var(--stroke, var(--border-active));
      transform: translateY(-100%) scale(0);
      position: absolute;
      width: 1rem;
      height: 1rem;
    }

    input:hover {
      --s: 2px;
      --b: var(--border-hover);
    }

    input:checked,
    input:indeterminate {
      --b: var(--border-active);
      --s: 11px;
    }

    input:checked + svg,
    input:indeterminate + svg {
      -webkit-animation: bounce 0.4s linear forwards 0.2s;
      animation: bounce 0.4s linear forwards 0.2s;
    }

    @keyframes bounce {
      0% {
        transform: translateY(-100%) scale(0);
      }
      50% {
        transform: translateY(-100%) scale(1.2);
      }
      75% {
        transform: translateY(-100%) scale(0.9);
      }
      100% {
        transform: translateY(-100%) scale(1);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      input:checked + svg,
      input:indeterminate + svg {
        animation: none;
        transform: translateY(-100%) scale(1);
      }
    }
  `;var ui=li;oi([j({type:String,reflect:!0})],ui.prototype,`icon`),oi([j({type:String})],ui.prototype,`name`),oi([j({type:String,reflect:!0})],ui.prototype,`label`),oi([j({type:Boolean})],ui.prototype,`checked`),oi([j({type:Boolean})],ui.prototype,`indeterminate`),oi([j({type:Boolean,reflect:!0})],ui.prototype,`disabled`),oi([j({type:Boolean,reflect:!0})],ui.prototype,`inverted`);var di=Object.defineProperty,fi=Object.getOwnPropertyDescriptor,pi=(e,t,n,r)=>{for(var i=r>1?void 0:r?fi(t,n):t,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=(r?o(t,n,i):o(i))||i);return r&&i&&di(t,n,i),i},mi=class extends A{constructor(){super(...arguments),this._value=0,this.vertical=!1,this.slider=!1,this._input=ot(),this.onValueChange=new Event(`change`)}set value(e){Number.isFinite(e)&&this.setValue(e.toString())}get value(){return this._value}onChange(e){e.stopPropagation();let{value:t}=this._input;t&&this.setValue(t.value)}onInput(e){e.stopPropagation();let t=e.target,n=t.value,r=n.replace(/[^0-9.-]/g,``);if(r===n)return;let i=t.selectionStart??r.length,a=n.slice(0,i).length-n.slice(0,i).replace(/[^0-9.-]/g,``).length;t.value=r;let o=i-a;t.setSelectionRange(o,o)}onInputKeyDown(e){e.key!==`ArrowUp`&&e.key!==`ArrowDown`||(e.preventDefault(),this.stepValue(e.key===`ArrowUp`?1:-1))}onSliderKeyDown(e){let t=0;if(e.key===`ArrowUp`||e.key===`ArrowRight`)t=1;else if(e.key===`ArrowDown`||e.key===`ArrowLeft`)t=-1;else return;e.preventDefault(),this.stepValue(t)}stepValue(e){let t=this.step??1,n=t.toString().split(`.`)[1]?.length||0;this.setValue((this.value+e*t).toFixed(n))}setValue(e){let{value:t}=this._input,n=e;if(n=n.replace(/[^0-9.-]/g,``),n=n.replace(/(\..*)\./g,`$1`),n.endsWith(`.`)||(n.lastIndexOf(`-`)>0&&(n=n[0]+n.substring(1).replace(/-/g,``)),n===`-`||n===`-0`))return;let r=Number(n);Number.isNaN(r)||(r=this.min===void 0?r:Math.max(r,this.min),r=this.max===void 0?r:Math.min(r,this.max),this.value!==r&&(this._value=r,t&&(t.value=this.value.toString()),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))))}onBlur(){this._escapeKeyListener&&=(window.removeEventListener(`keydown`,this._escapeKeyListener),void 0);let{value:e}=this._input;e&&(this.setValue(e.value),e.value=this.value.toString())}onSliderMouseDown(e){document.body.style.cursor=`w-resize`;let{clientX:t}=e,n=this.value,r=!1,i=e=>{r=!0;let{clientX:i}=e,a=this.step??1,o=a.toString().split(`.`)[1]?.length||0,s=1/(this.sensitivity??1),c=(i-t)/s;if(Math.floor(Math.abs(c))!==Math.abs(c))return;let l=n+c*a;this.setValue(l.toFixed(o))},a=()=>{this.slider=!0,this.removeEventListener(`blur`,a)},o=()=>{document.removeEventListener(`mousemove`,i),document.removeEventListener(`mouseup`,o),this._sliderMouseMove=void 0,this._sliderMouseUp=void 0,document.body.style.cursor=`default`,r?r=!1:(this.addEventListener(`blur`,a),this.slider=!1,requestAnimationFrame(()=>this.focus()))};this._sliderMouseMove=i,this._sliderMouseUp=o,document.addEventListener(`mousemove`,i),document.addEventListener(`mouseup`,o)}onFocus(){this._escapeKeyListener&&window.removeEventListener(`keydown`,this._escapeKeyListener),this._escapeKeyListener=e=>{e.key===`Escape`&&this.blur()},window.addEventListener(`keydown`,this._escapeKeyListener)}connectedCallback(){super.connectedCallback(),this.min!==void 0&&this.min>this._value&&(this._value=this.min),this.max!==void 0&&this.max<this._value&&(this._value=this.max)}disconnectedCallback(){super.disconnectedCallback(),this._sliderMouseMove&&=(document.removeEventListener(`mousemove`,this._sliderMouseMove),void 0),this._sliderMouseUp&&=(document.removeEventListener(`mouseup`,this._sliderMouseUp),void 0),this._escapeKeyListener&&=(window.removeEventListener(`keydown`,this._escapeKeyListener),void 0)}updated(e){if(!e.has(`min`)&&!e.has(`max`))return;let t=this._value;this.min!==void 0&&(t=Math.max(t,this.min)),this.max!==void 0&&(t=Math.min(t,this.max)),t!==this._value&&(this._value=t)}focus(e){let{value:t}=this._input;t&&t.focus(e)}renderRegular(){return O`
      ${this.pref?O`<bim-label class="affix" @mousedown=${this.onSliderMouseDown}
            >${this.pref}</bim-label
          >`:null}
      <input
        ${lt(this._input)}
        type="text"
        role="spinbutton"
        aria-label=${this.label||this.name||`Number Input`}
        aria-valuenow=${this.value}
        aria-valuemin=${ut(this.min)}
        aria-valuemax=${ut(this.max)}
        size="1"
        @input=${this.onInput}
        @change=${this.onChange}
        @blur=${this.onBlur}
        @focus=${this.onFocus}
        @keydown=${this.onInputKeyDown}
        .value=${this.value.toString()}
      />
      ${this.suffix?O`<bim-label class="affix" @mousedown=${this.onSliderMouseDown}
            >${this.suffix}</bim-label
          >`:null}
    `}renderSlider(){let e=this.min??-1/0,t=this.max??1/0,n=100*(this.value-e)/(t-e);return this.style.setProperty(`--_number-input-slider-pct`,Number.isFinite(n)?`${n}%`:`0%`),O`
      <div
        class="slider"
        role="slider"
        tabindex="0"
        aria-label=${this.label||this.name||`Slider`}
        aria-valuenow=${this.value}
        aria-valuemin=${ut(this.min)}
        aria-valuemax=${ut(this.max)}
        @mousedown=${this.onSliderMouseDown}
        @keydown=${this.onSliderKeyDown}
      >
        <div class="slider-indicator"></div>
        ${this.pref?O`<bim-label class="affix slider-affix pref"
              >${`${this.pref}: `}</bim-label
            >`:null}
        <bim-label class="affix slider-affix">${this.value}</bim-label>
        ${this.suffix?O`<bim-label class="affix slider-affix">${this.suffix}</bim-label>`:null}
      </div>
    `}render(){let e=`${this.label||this.name||this.pref?`${this.label||this.name||this.pref}: `:``}${this.value}${this.suffix??``}`;return O`
      <div class="parent">
        ${this.label||this.icon?O`<bim-label .icon=${this.icon}>${this.label}</bim-label>`:null}
        <div class="input" title=${e}>
          ${this.slider?this.renderSlider():this.renderRegular()}
        </div>
      </div>
    `}};mi.styles=o`
    :host {
      display: block;
    }

    .parent {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      user-select: none;
      flex: 1;
      align-items: normal;
    }

    :host(:not([vertical])) .parent {
      justify-content: space-between;
    }

    :host([vertical]) .parent {
      flex-direction: column;
    }

    bim-label {
      margin-top: var(--bim-input--label-mt, 0);
      pointer-events: none;
    }

    .input {
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      height: 25px;
      min-width: 3rem;
      gap: 4px;
      padding: 0 7px;
      background-color: var(--bim-input--bgc, var(--bim-ui_bg-contrast-20));
      border: var(--bim-input--olw, 2px) solid var(--bim-input--olc, transparent);
      border-radius: var(--bim-input--bdrs, var(--bim-ui_size-2xs));
      transition: border-color 0.15s;
    }

    :host(:not([vertical])) .input {
      flex: 1;
      justify-content: flex-end;
    }

    :host(:not([vertical])[label]) .input {
      max-width: var(--bim-input--maxw, fit-content);
    }

    :host(:focus-within) .input {
      border-color: var(--bim-number-input--focus-c, var(--bim-ui_bg-contrast-40));
    }

    input {
      background-color: transparent;
      outline: none;
      border: none;
      padding: 0;
      flex-grow: 1;
      text-align: right;
      font-family: inherit;
      font-feature-settings: inherit;
      font-variation-settings: inherit;
      font-size: var(--bim-ui_size-base);
      color: var(--bim-number-input--c, var(--bim-ui_bg-contrast-100));
      color-scheme: dark;
    }

    :host-context(html.bim-ui-light) input {
      color-scheme: light;
    }

    @media (prefers-color-scheme: light) {
      input {
        color-scheme: light;
      }
    }

    :host([suffix]:not([pref])) input {
      text-align: left;
    }

    bim-label.affix {
      pointer-events: auto;
      --bim-label--c: var(--bim-ui_bg-contrast-80);
      --bim-label--fz: var(--bim-ui_size-sm);
    }

    :host([slider]) .input {
      padding: 0;
    }

    .slider {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      padding: 0 0.5rem;
    }

    .slider bim-label.affix {
      --bim-label--c: var(--bim-ui_bg-contrast-100);
    }

    .slider-affix {
      position: relative;
      z-index: 1;
    }

    .slider-affix.pref {
      margin-right: 0.125rem;
    }

    .slider-indicator {
      height: 100%;
      width: var(--_number-input-slider-pct, 0%);
      background-color: var(--bim-ui_main-base);
      position: absolute;
      top: 0;
      left: 0;
      border-radius: var(--bim-input--bdrs, var(--bim-ui_size-2xs));
    }

    @media (prefers-reduced-motion: reduce) {
      .input {
        transition: none;
      }
    }
  `;var hi=mi;pi([j({type:String,reflect:!0})],hi.prototype,`name`,2),pi([j({type:String,reflect:!0})],hi.prototype,`icon`,2),pi([j({type:String,reflect:!0})],hi.prototype,`label`,2),pi([j({type:String,reflect:!0})],hi.prototype,`pref`,2),pi([j({type:Number,reflect:!0})],hi.prototype,`min`,2),pi([M()],hi.prototype,`_value`,2),pi([j({type:Number})],hi.prototype,`value`,1),pi([j({type:Number})],hi.prototype,`step`,2),pi([j({type:Number})],hi.prototype,`sensitivity`,2),pi([j({type:Number,reflect:!0})],hi.prototype,`max`,2),pi([j({type:String,reflect:!0})],hi.prototype,`suffix`,2),pi([j({type:Boolean,reflect:!0})],hi.prototype,`vertical`,2),pi([j({type:Boolean,reflect:!0})],hi.prototype,`slider`,2);var gi=Object.defineProperty,_i=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&gi(t,n,i),i},vi=class extends A{constructor(){super(...arguments),this.vertical=!1,this.color=`#ffffff`,this.disabled=!1,this._colorInput=ot(),this._textInput=ot(),this.onValueChange=new Event(`input`)}set value(e){let{color:t,opacity:n}=e;this.color=t,n!==void 0&&(this.opacity=n)}get value(){let e={color:this.color};return this.opacity!==void 0&&(e.opacity=this.opacity),e}updated(e){super.updated(e),e.has(`disabled`)&&(this.disabled?this.setAttribute(`aria-disabled`,`true`):this.removeAttribute(`aria-disabled`))}_onColorInput(e){e.stopPropagation();let t=this._colorInput.value;t&&(this.color=t.value,this.dispatchEvent(new Event(`input`,{bubbles:!0,composed:!0})))}_onTextInput(e){e.stopPropagation();let t=this._textInput.value;if(!t)return;let n=`#`+t.value.replace(/[^a-fA-F0-9]/g,``).slice(0,6);t.value=n,n.length===7&&(this.color=n,this.dispatchEvent(new Event(`input`,{bubbles:!0,composed:!0})))}_onOpacityInput(e){e.target instanceof hi&&(this.opacity=Math.max(0,Math.min(100,e.target.value)),this.dispatchEvent(new Event(`input`,{bubbles:!0,composed:!0})))}focus(){var e;(e=this._textInput.value)==null||e.focus()}render(){return O`
      <div class="parent">
        ${this.label||this.icon?O`<bim-label .icon=${this.icon}>${this.label}</bim-label>`:k}
        <div
          class="input"
          role="group"
          aria-label=${this.label||this.name||`Color input`}
          style="--_swatch-c: ${this.color}"
        >
          <input
            ${lt(this._colorInput)}
            type="color"
            .value=${this.color}
            ?disabled=${this.disabled}
            aria-hidden="true"
            tabindex="-1"
            @input=${this._onColorInput}
          />
          <button
            class="sample"
            type="button"
            aria-label="Open color picker"
            ?disabled=${this.disabled}
            @click=${()=>this._colorInput.value?.click()}
          ></button>
          <input
            ${lt(this._textInput)}
            type="text"
            .value=${this.color}
            ?disabled=${this.disabled}
            aria-label=${this.label||this.name||`Hex color value (e.g. #FF0000)`}
            @input=${this._onTextInput}
          />
          ${this.opacity===void 0?k:O`<bim-number-input
                label="Opacity"
                label-hidden
                suffix="%"
                min="0"
                max="100"
                slider
                .value=${this.opacity}
                @change=${this._onOpacityInput}
              ></bim-number-input>`}
        </div>
      </div>
    `}};vi.styles=o`
    :host {
      display: block;
    }

    .parent {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      user-select: none;
    }

    :host(:not([vertical])) .parent {
      justify-content: space-between;
    }

    :host([vertical]) .parent {
      flex-direction: column;
    }

    bim-label {
      margin-top: var(--bim-input--label-mt, 0);
    }

    .input {
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      height: 25px;
      min-width: 3rem;
      gap: var(--bim-input--g, var(--bim-ui_size-4xs));
      padding: 0 7px;
      background-color: var(--bim-input--bgc, var(--bim-ui_bg-contrast-20));
      border: var(--bim-input--olw, 2px) solid var(--bim-input--olc, transparent);
      border-radius: var(--bim-input--bdrs, var(--bim-ui_size-2xs));
      transition: border-color 0.15s;
    }

    :host(:not([vertical])) .input {
      flex: 1;
    }

    :host(:not([vertical])[label]) .input,
    :host(:not([vertical])[icon]) .input {
      max-width: var(--bim-input--maxw, fit-content);
    }

    :host(:focus-within) .input {
      border-color: var(--bim-ui_bg-contrast-40);
    }

    input[type="color"] {
      position: absolute;
      visibility: hidden;
      width: 0;
      height: 0;
    }

    .sample {
      width: var(--bim-color-input--swatch-sz, 1rem);
      height: var(--bim-color-input--swatch-sz, 1rem);
      border-radius: var(--bim-color-input--swatch-bdrs, var(--bim-ui_size-4xs));
      border: none;
      padding: 0;
      cursor: pointer;
      flex-shrink: 0;
      background-color: var(--_swatch-c);
    }

    :host([disabled]) .sample {
      cursor: default;
      pointer-events: none;
    }

    .sample:focus-visible {
      outline: 2px solid var(--bim-ui_accent-base);
      outline-offset: 1px;
    }

    input[type="text"] {
      height: 100%;
      flex: 1;
      min-width: 0;
      text-transform: uppercase;
      font-size: var(--bim-ui_size-sm);
      font-family: inherit;
      background-color: transparent;
      padding: 0;
      outline: none;
      border: none;
      color: var(--bim-color-input--c, var(--bim-ui_bg-contrast-100));
    }

    :host([disabled]) input[type="text"] {
      color: var(--bim-ui_bg-contrast-60);
    }

    bim-number-input {
      flex-shrink: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .input {
        transition: none;
      }
    }
  `;var yi=vi;_i([j({type:String,reflect:!0})],yi.prototype,`name`),_i([j({type:String,reflect:!0})],yi.prototype,`label`),_i([j({type:String,reflect:!0})],yi.prototype,`icon`),_i([j({type:Boolean,reflect:!0})],yi.prototype,`vertical`),_i([j({type:Number})],yi.prototype,`opacity`),_i([j({type:String})],yi.prototype,`color`),_i([j({type:Boolean,reflect:!0})],yi.prototype,`disabled`);var bi=Math.min,xi=Math.max,Si=Math.round,Ci=e=>({x:e,y:e}),wi={left:`right`,right:`left`,bottom:`top`,top:`bottom`};function Ti(e,t,n){return xi(e,bi(t,n))}function Ei(e,t){return typeof e==`function`?e(t):e}function Di(e){return e.split(`-`)[0]}function Oi(e){return e.split(`-`)[1]}function ki(e){return e===`x`?`y`:`x`}function Ai(e){return e===`y`?`height`:`width`}function ji(e){let t=e[0];return t===`t`||t===`b`?`y`:`x`}function Mi(e){return ki(ji(e))}function Ni(e,t,n){n===void 0&&(n=!1);let r=Oi(e),i=Mi(e),a=Ai(i),o=i===`x`?r===(n?`end`:`start`)?`right`:`left`:r===`start`?`bottom`:`top`;return t.reference[a]>t.floating[a]&&(o=Hi(o)),[o,Hi(o)]}function Pi(e){let t=Hi(e);return[Fi(e),t,Fi(t)]}function Fi(e){return e.includes(`start`)?e.replace(`start`,`end`):e.replace(`end`,`start`)}var Ii=[`left`,`right`],Li=[`right`,`left`],Ri=[`top`,`bottom`],zi=[`bottom`,`top`];function Bi(e,t,n){switch(e){case`top`:case`bottom`:return n?t?Li:Ii:t?Ii:Li;case`left`:case`right`:return t?Ri:zi;default:return[]}}function Vi(e,t,n,r){let i=Oi(e),a=Bi(Di(e),n===`start`,r);return i&&(a=a.map(e=>e+`-`+i),t&&(a=a.concat(a.map(Fi)))),a}function Hi(e){let t=Di(e);return wi[t]+e.slice(t.length)}function Ui(e){return{top:e.top??0,right:e.right??0,bottom:e.bottom??0,left:e.left??0}}function Wi(e){return typeof e==`number`?{top:e,right:e,bottom:e,left:e}:Ui(e)}function Gi(e){let{x:t,y:n,width:r,height:i}=e;return{width:r,height:i,top:n,left:t,right:t+r,bottom:n+i,x:t,y:n}}function Ki(e,t,n){let{reference:r,floating:i}=e,a=ji(t),o=Mi(t),s=Ai(o),c=Di(t),l=a===`y`,u=r.x+r.width/2-i.width/2,d=r.y+r.height/2-i.height/2,f=r[s]/2-i[s]/2,p;switch(c){case`top`:p={x:u,y:r.y-i.height};break;case`bottom`:p={x:u,y:r.y+r.height};break;case`right`:p={x:r.x+r.width,y:d};break;case`left`:p={x:r.x-i.width,y:d};break;default:p={x:r.x,y:r.y}}let m=Oi(t);return m&&(p[o]+=f*(m===`end`?1:-1)*(n&&l?-1:1)),p}async function qi(e,t){var n;t===void 0&&(t={});let{x:r,y:i,platform:a,rects:o,elements:s,strategy:c}=e,{boundary:l=`clippingAncestors`,rootBoundary:u=`viewport`,elementContext:d=`floating`,altBoundary:f=!1,padding:p=0}=Ei(t,e),m=Wi(p),h=s[f?d===`floating`?`reference`:`floating`:d],g=Gi(await a.getClippingRect({element:(n=await(a.isElement==null?void 0:a.isElement(h)))==null||n?h:h.contextElement||await(a.getDocumentElement==null?void 0:a.getDocumentElement(s.floating)),boundary:l,rootBoundary:u,strategy:c})),_=d===`floating`?{x:r,y:i,width:o.floating.width,height:o.floating.height}:o.reference,v=await(a.getOffsetParent==null?void 0:a.getOffsetParent(s.floating)),y=await(a.isElement==null?void 0:a.isElement(v))&&await(a.getScale==null?void 0:a.getScale(v))||{x:1,y:1},b=Gi(a.convertOffsetParentRelativeRectToViewportRelativeRect?await a.convertOffsetParentRelativeRectToViewportRelativeRect({elements:s,rect:_,offsetParent:v,strategy:c}):_);return{top:(g.top-b.top+m.top)/y.y,bottom:(b.bottom-g.bottom+m.bottom)/y.y,left:(g.left-b.left+m.left)/y.x,right:(b.right-g.right+m.right)/y.x}}var Ji=50,Yi=async(e,t,n)=>{let{placement:r=`bottom`,strategy:i=`absolute`,middleware:a=[],platform:o}=n,s=o.detectOverflow?o:{...o,detectOverflow:qi},c=await(o.isRTL==null?void 0:o.isRTL(t)),l=await o.getElementRects({reference:e,floating:t,strategy:i}),{x:u,y:d}=Ki(l,r,c),f=r,p=0,m={};for(let n=0;n<a.length;n++){let h=a[n];if(!h)continue;let{name:g,fn:_}=h,{x:v,y,data:b,reset:x}=await _({x:u,y:d,initialPlacement:r,placement:f,strategy:i,middlewareData:m,rects:l,platform:s,elements:{reference:e,floating:t}});u=v??u,d=y??d,m[g]={...m[g],...b},x&&p<Ji&&(p++,typeof x==`object`&&(x.placement&&(f=x.placement),x.rects&&(l=x.rects===!0?await o.getElementRects({reference:e,floating:t,strategy:i}):x.rects),{x:u,y:d}=Ki(l,f,c)),n=-1)}return{x:u,y:d,placement:f,strategy:i,middlewareData:m}},Xi=function(e){return e===void 0&&(e={}),{name:`flip`,options:e,async fn(t){var n;let{placement:r,middlewareData:i,rects:a,initialPlacement:o,platform:s,elements:c}=t,{mainAxis:l=!0,crossAxis:u=!0,fallbackPlacements:d,fallbackStrategy:f=`bestFit`,fallbackAxisSideDirection:p=`none`,flipAlignment:m=!0,...h}=Ei(e,t);if((n=i.arrow)!=null&&n.alignmentOffset)return{};let g=Di(r),_=ji(o),v=Di(o)===o,y=await(s.isRTL==null?void 0:s.isRTL(c.floating)),b=d||(v||!m?[Hi(o)]:Pi(o)),x=p!==`none`;!d&&x&&b.push(...Vi(o,m,p,y));let S=[o,...b],C=await s.detectOverflow(t,h),w=[],T=i.flip?.overflows||[];if(l&&w.push(C[g]),u){let e=Ni(r,a,y);w.push(C[e[0]],C[e[1]])}if(T=[...T,{placement:r,overflows:w}],!w.every(e=>e<=0)){let e=(i.flip?.index||0)+1,t=S[e];if(t&&(u!==`alignment`||_===ji(t)||T.every(e=>ji(e.placement)!==_||e.overflows[0]>0)))return{data:{index:e,overflows:T},reset:{placement:t}};let n=T.filter(e=>e.overflows[0]<=0).sort((e,t)=>e.overflows[1]-t.overflows[1])[0]?.placement;if(!n)switch(f){case`bestFit`:{let e=T.filter(e=>{if(x){let t=ji(e.placement);return t===_||t===`y`}return!0}).map(e=>[e.placement,e.overflows.filter(e=>e>0).reduce((e,t)=>e+t,0)]).sort((e,t)=>e[1]-t[1])[0]?.[0];e&&(n=e);break}case`initialPlacement`:n=o;break}if(r!==n)return{reset:{placement:n}}}return{}}}};function Zi(e){let t=bi(...e.map(e=>e.left)),n=bi(...e.map(e=>e.top)),r=xi(...e.map(e=>e.right)),i=xi(...e.map(e=>e.bottom));return{x:t,y:n,width:r-t,height:i-n}}function Qi(e){let t=e.slice().sort((e,t)=>e.y-t.y),n=[],r=null;for(let e=0;e<t.length;e++){let i=t[e];!r||i.y-r.y>r.height/2?n.push([i]):n[n.length-1].push(i),r=i}return n.map(e=>Gi(Zi(e)))}var $i=function(e){return e===void 0&&(e={}),{name:`inline`,options:e,async fn(t){let{placement:n,elements:r,rects:i,platform:a,strategy:o}=t,{padding:s=2,x:c,y:l}=Ei(e,t),u=Array.from(await(a.getClientRects==null?void 0:a.getClientRects(r.reference))||[]);if(!u.length)return{};let d=Qi(u),f=Gi(Zi(u)),p=Wi(s);function m(){if(d.length===2&&(d[0].left>d[1].right||d[1].left>d[0].right)&&c!=null&&l!=null)return d.find(e=>c>e.left-p.left&&c<e.right+p.right&&l>e.top-p.top&&l<e.bottom+p.bottom)||f;if(d.length>=2){if(ji(n)===`y`){let e=d[0],t=d[d.length-1],r=Di(n)===`top`,i=e.top,a=t.bottom,o=r?e.left:t.left;return Gi({x:o,y:i,width:(r?e.right:t.right)-o,height:a-i})}let e=Di(n)===`left`,t=xi(...d.map(e=>e.right)),r=bi(...d.map(e=>e.left)),i=d.filter(n=>e?n.left===r:n.right===t),a=i[0].top,o=i[i.length-1].bottom;return Gi({x:r,y:a,width:t-r,height:o-a})}return f}let h=await a.getElementRects({reference:{getBoundingClientRect:m},floating:r.floating,strategy:o});return i.reference.x!==h.reference.x||i.reference.y!==h.reference.y||i.reference.width!==h.reference.width||i.reference.height!==h.reference.height?{reset:{rects:h}}:{}}}},ea=new Set([`left`,`top`]);async function ta(e,t){let{placement:n,platform:r,elements:i}=e,a=await(r.isRTL==null?void 0:r.isRTL(i.floating)),o=Di(n),s=Oi(n),c=ji(n)===`y`,l=ea.has(o)?-1:1,u=a&&c?-1:1,d=Ei(t,e),{mainAxis:f,crossAxis:p,alignmentAxis:m}=typeof d==`number`?{mainAxis:d,crossAxis:0,alignmentAxis:null}:{mainAxis:d.mainAxis||0,crossAxis:d.crossAxis||0,alignmentAxis:d.alignmentAxis};return s&&typeof m==`number`&&(p=s===`end`?m*-1:m),c?{x:p*u,y:f*l}:{x:f*l,y:p*u}}var na=function(e){return{name:`offset`,options:e,async fn(t){var n;let{x:r,y:i,placement:a,middlewareData:o}=t,s=await ta(t,e);return a===o.offset?.placement&&(n=o.arrow)!=null&&n.alignmentOffset?{}:{x:r+s.x,y:i+s.y,data:{...s,placement:a}}}}},ra=function(e){return e===void 0&&(e={}),{name:`shift`,options:e,async fn(t){let{x:n,y:r,placement:i,platform:a}=t,{mainAxis:o=!0,crossAxis:s=!1,limiter:c={fn:e=>{let{x:t,y:n}=e;return{x:t,y:n}}},...l}=Ei(e,t),u={x:n,y:r},d=await a.detectOverflow(t,l),f=ji(i),p=ki(f),m=u[p],h=u[f],g=(e,t)=>Ti(t+d[e===`y`?`top`:`left`],t,t-d[e===`y`?`bottom`:`right`]);o&&(m=g(p,m)),s&&(h=g(f,h));let _=c.fn({...t,[p]:m,[f]:h});return{..._,data:{x:_.x-n,y:_.y-r,enabled:{[p]:o,[f]:s}}}}}};function ia(){return typeof window<`u`}function aa(e){return ca(e)?(e.nodeName||``).toLowerCase():`#document`}function oa(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function sa(e){return((ca(e)?e.ownerDocument:e.document)||window.document)?.documentElement}function ca(e){return ia()?e instanceof Node||e instanceof oa(e).Node:!1}function la(e){return ia()?e instanceof Element||e instanceof oa(e).Element:!1}function ua(e){return ia()?e instanceof HTMLElement||e instanceof oa(e).HTMLElement:!1}function da(e){return!ia()||typeof ShadowRoot>`u`?!1:e instanceof ShadowRoot||e instanceof oa(e).ShadowRoot}function fa(e){let{overflow:t,overflowX:n,overflowY:r,display:i}=Ca(e);return/auto|scroll|overlay|hidden|clip/.test(t+r+n)&&i!==`inline`&&i!==`contents`}function pa(e){return/^(table|td|th)$/.test(aa(e))}function ma(e){try{if(e.matches(`:popover-open`))return!0}catch{}try{return e.matches(`:modal`)}catch{return!1}}var ha=/transform|translate|scale|rotate|perspective|filter/,ga=/paint|layout|strict|content/,_a=e=>!!e&&e!==`none`,va;function ya(e){let t=la(e)?Ca(e):e;return _a(t.transform)||_a(t.translate)||_a(t.scale)||_a(t.rotate)||_a(t.perspective)||!xa()&&(_a(t.backdropFilter)||_a(t.filter))||ha.test(t.willChange||``)||ga.test(t.contain||``)}function ba(e){let t=Ta(e);for(;ua(t)&&!Sa(t);){if(ya(t))return t;if(ma(t))return null;t=Ta(t)}return null}function xa(){return va??=typeof CSS<`u`&&CSS.supports&&CSS.supports(`-webkit-backdrop-filter`,`none`),va}function Sa(e){return/^(html|body|#document)$/.test(aa(e))}function Ca(e){return oa(e).getComputedStyle(e)}function wa(e){return la(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function Ta(e){if(aa(e)===`html`)return e;let t=e.assignedSlot||e.parentNode||da(e)&&e.host||sa(e);return da(t)?t.host:t}function Ea(e){let t=Ta(e);return Sa(t)?(e.ownerDocument||e).body:ua(t)&&fa(t)?t:Ea(t)}function Da(e,t,n){t===void 0&&(t=[]);let r=Ea(e),i=r===e.ownerDocument?.body,a=oa(r);return i?(Oa(a),t.concat(a,a.visualViewport||[],fa(r)?r:[],[])):t.concat(r,Da(r,[]))}function Oa(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function ka(e){let t=Ca(e),n=parseFloat(t.width)||0,r=parseFloat(t.height)||0,i=ua(e),a=i?e.offsetWidth:n,o=i?e.offsetHeight:r,s=Si(n)!==a||Si(r)!==o;return s&&(n=a,r=o),{width:n,height:r,$:s}}function Aa(e){return la(e)?e:e.contextElement}function ja(e){let t=Aa(e);if(!ua(t))return Ci(1);let n=t.getBoundingClientRect(),{width:r,height:i,$:a}=ka(t),o=(a?Si(n.width):n.width)/r,s=(a?Si(n.height):n.height)/i;return(!o||!Number.isFinite(o))&&(o=1),(!s||!Number.isFinite(s))&&(s=1),{x:o,y:s}}var Ma=Ci(0);function Na(e){let t=oa(e);return!xa()||!t.visualViewport?Ma:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function Pa(e,t,n){return t===void 0&&(t=!1),!n||t&&n!==oa(e)?!1:t}function Fa(e,t,n,r){t===void 0&&(t=!1),n===void 0&&(n=!1);let i=e.getBoundingClientRect(),a=Aa(e),o=Ci(1);t&&(r?la(r)&&(o=ja(r)):o=ja(e));let s=Pa(a,n,r)?Na(a):Ci(0),c=(i.left+s.x)/o.x,l=(i.top+s.y)/o.y,u=i.width/o.x,d=i.height/o.y;if(a){let e=oa(a),t=r&&la(r)?oa(r):r,n=e,i=n.frameElement;for(;i&&r&&t!==n;){let e=ja(i),t=i.getBoundingClientRect(),r=Ca(i),a=t.left+(i.clientLeft+parseFloat(r.paddingLeft))*e.x,o=t.top+(i.clientTop+parseFloat(r.paddingTop))*e.y;c*=e.x,l*=e.y,u*=e.x,d*=e.y,c+=a,l+=o,n=oa(i),i=n.frameElement}}return Gi({width:u,height:d,x:c,y:l})}var Ia=[`:popover-open`,`:modal`];function La(e){return Ia.some(t=>{try{return e.matches(t)}catch{return!1}})}function Ra(e){let{elements:t,rect:n,offsetParent:r,strategy:i}=e,a=i===`fixed`,o=sa(r),s=t?La(t.floating):!1;if(r===o||s&&a)return n;let c={scrollLeft:0,scrollTop:0},l=Ci(1),u=Ci(0),d=ua(r);if((d||!d&&!a)&&((aa(r)!==`body`||fa(o))&&(c=wa(r)),ua(r))){let e=Fa(r);l=ja(r),u.x=e.x+r.clientLeft,u.y=e.y+r.clientTop}return{width:n.width*l.x,height:n.height*l.y,x:n.x*l.x-c.scrollLeft*l.x+u.x,y:n.y*l.y-c.scrollTop*l.y+u.y}}function za(e){return Array.from(e.getClientRects())}function Ba(e){return Fa(sa(e)).left+wa(e).scrollLeft}function Va(e){let t=sa(e),n=wa(e),r=e.ownerDocument.body,i=xi(t.scrollWidth,t.clientWidth,r.scrollWidth,r.clientWidth),a=xi(t.scrollHeight,t.clientHeight,r.scrollHeight,r.clientHeight),o=-n.scrollLeft+Ba(e),s=-n.scrollTop;return Ca(r).direction===`rtl`&&(o+=xi(t.clientWidth,r.clientWidth)-i),{width:i,height:a,x:o,y:s}}function Ha(e,t){let n=oa(e),r=sa(e),i=n.visualViewport,a=r.clientWidth,o=r.clientHeight,s=0,c=0;if(i){a=i.width,o=i.height;let e=xa();(!e||e&&t===`fixed`)&&(s=i.offsetLeft,c=i.offsetTop)}return{width:a,height:o,x:s,y:c}}function Ua(e,t){let n=Fa(e,!0,t===`fixed`),r=n.top+e.clientTop,i=n.left+e.clientLeft,a=ua(e)?ja(e):Ci(1);return{width:e.clientWidth*a.x,height:e.clientHeight*a.y,x:i*a.x,y:r*a.y}}function Wa(e,t,n){let r;if(t===`viewport`)r=Ha(e,n);else if(t===`document`)r=Va(sa(e));else if(la(t))r=Ua(t,n);else{let n=Na(e);r={...t,x:t.x-n.x,y:t.y-n.y}}return Gi(r)}function Ga(e,t){let n=Ta(e);return n===t||!la(n)||Sa(n)?!1:Ca(n).position===`fixed`||Ga(n,t)}function Ka(e,t){let n=t.get(e);if(n)return n;let r=Da(e,[]).filter(e=>la(e)&&aa(e)!==`body`),i=null,a=Ca(e).position===`fixed`,o=a?Ta(e):e;for(;la(o)&&!Sa(o);){let t=Ca(o),n=ya(o);!n&&t.position===`fixed`&&(i=null),(a?!n&&!i:!n&&t.position===`static`&&i&&[`absolute`,`fixed`].includes(i.position)||fa(o)&&!n&&Ga(e,o))?r=r.filter(e=>e!==o):i=t,o=Ta(o)}return t.set(e,r),r}function qa(e){let{element:t,boundary:n,rootBoundary:r,strategy:i}=e,a=[...n===`clippingAncestors`?Ka(t,this._c):[].concat(n),r],o=a[0],s=a.reduce((e,n)=>{let r=Wa(t,n,i);return e.top=xi(r.top,e.top),e.right=bi(r.right,e.right),e.bottom=bi(r.bottom,e.bottom),e.left=xi(r.left,e.left),e},Wa(t,o,i));return{width:s.right-s.left,height:s.bottom-s.top,x:s.left,y:s.top}}function Ja(e){let{width:t,height:n}=ka(e);return{width:t,height:n}}function Ya(e,t,n){let r=ua(t),i=sa(t),a=n===`fixed`,o=Fa(e,!0,a,t),s={scrollLeft:0,scrollTop:0},c=Ci(0);if(r||!r&&!a){if((aa(t)!==`body`||fa(i))&&(s=wa(t)),r){let e=Fa(t,!0,a,t);c.x=e.x+t.clientLeft,c.y=e.y+t.clientTop}else i&&(c.x=Ba(i))}return{x:o.left+s.scrollLeft-c.x,y:o.top+s.scrollTop-c.y,width:o.width,height:o.height}}function Xa(e,t){return!ua(e)||Ca(e).position===`fixed`?null:t?t(e):e.offsetParent}function Za(e,t){let n=oa(e);if(!ua(e)||La(e))return n;let r=Xa(e,t);for(;r&&pa(r)&&Ca(r).position===`static`;)r=Xa(r,t);return r&&(aa(r)===`html`||aa(r)===`body`&&Ca(r).position===`static`&&!ya(r))?n:r||ba(e)||n}var Qa=async function(e){let t=this.getOffsetParent||Za,n=this.getDimensions;return{reference:Ya(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,...await n(e.floating)}}};function $a(e){return Ca(e).direction===`rtl`}var eo={convertOffsetParentRelativeRectToViewportRelativeRect:Ra,getDocumentElement:sa,getClippingRect:qa,getOffsetParent:Za,getElementRects:Qa,getClientRects:za,getDimensions:Ja,getScale:ja,isElement:la,isRTL:$a},to=ra,no=Xi,ro=$i,io=(e,t,n)=>{let r=new Map,i={platform:eo,...n},a={...i.platform,_c:r};return Yi(e,t,{...i,platform:a})},ao=Object.defineProperty,oo=Object.getOwnPropertyDescriptor,so=(e,t,n,r)=>{for(var i=oo(t,n),a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&ao(t,n,i),i},co,lo=(co=class extends A{constructor(){super(...arguments),this._previousContainer=null,this._visible=!1}get placement(){return this._placement}set placement(e){this._placement=e,this.updatePosition()}static removeMenus(){for(let e of[...co.dialog.children])e instanceof co&&(e.remove(),e.visible=!1);setTimeout(()=>{co.dialog.close(),co.dialog.remove()},310)}get visible(){return this._visible}set visible(e){this._visible=e,e?(co.dialog.parentElement||document.body.append(co.dialog),this._previousContainer=this.parentElement,co.dialog.style.top=`${window.scrollY||document.documentElement.scrollTop}px`,this.style.setProperty(`display`,`flex`),co.dialog.append(this),co.dialog.showModal(),this.updatePosition(),this.dispatchEvent(new Event(`visible`))):setTimeout(()=>{var e;(e=this._previousContainer)==null||e.append(this),this._previousContainer=null,this.style.setProperty(`display`,`none`),this.dispatchEvent(new Event(`hidden`))},310)}async updatePosition(){if(!(this.visible&&this._previousContainer))return;let e=this.placement??`right`,{x:t,y:n}=await io(this._previousContainer,this,{placement:e,middleware:[na(10),ro(),no(),to({padding:5})]});this.style.left=`${t}px`,this.style.top=`${n}px`}connectedCallback(){super.connectedCallback(),this.visible?(this.style.setProperty(`width`,`auto`),this.style.setProperty(`height`,`auto`)):(this.style.setProperty(`display`,`none`),this.style.setProperty(`width`,`0`),this.style.setProperty(`height`,`0`))}render(){return O` <slot></slot> `}},co.styles=[Vr.scrollbar,o`
      :host {
        pointer-events: auto;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 999;
        overflow: auto;
        max-height: 20rem;
        min-width: 3rem;
        flex-direction: column;
        box-shadow: 1px 2px 8px 2px rgba(0, 0, 0, 0.15);
        padding: 0.5rem;
        border-radius: var(--bim-ui_size-4xs);
        display: flex;
        transform-origin: top left;
        transform: scale(1);
        clip-path: circle(150% at top left);
        background-color: var(--bim-ui_bg-contrast-50);
        transition:
          clip-path 0.2s cubic-bezier(0.72, 0.1, 0.43, 0.93),
          transform 0.3s cubic-bezier(0.72, 0.1, 0.45, 2.35);
      }

      ::slotted(bim-button) {
        background-color: transparent;
      }

      :host(:not([visible])) {
        transform: scale(0.8);
        clip-path: circle(0 at top left);
      }
    `],co.dialog=Wr.create(()=>O` <dialog
      @click=${e=>{e.target===co.dialog&&co.removeMenus()}}
      @cancel=${()=>co.removeMenus()}
      data-context-dialog
      style="
      width: 0;
      height: 0;
      position: relative;
      padding: 0;
      border: none;
      outline: none;
      margin: none;
      overflow: visible;
      background-color: transparent;
    "
    ></dialog>`),co);so([j({type:String,reflect:!0})],lo.prototype,`placement`),so([j({type:Boolean,reflect:!0})],lo.prototype,`visible`);var uo=lo,fo=class extends HTMLElement{get label(){return this.getAttribute(`label`)??void 0}set label(e){e==null?this.removeAttribute(`label`):this.setAttribute(`label`,e)}get icon(){return this.getAttribute(`icon`)??void 0}set icon(e){e==null?this.removeAttribute(`icon`):this.setAttribute(`icon`,e)}get img(){return this.getAttribute(`img`)??void 0}set img(e){e==null?this.removeAttribute(`img`):this.setAttribute(`img`,e)}get checked(){return this.hasAttribute(`checked`)}set checked(e){e?this.setAttribute(`checked`,``):this.removeAttribute(`checked`)}get noMark(){return this.hasAttribute(`no-mark`)}set noMark(e){e?this.setAttribute(`no-mark`,``):this.removeAttribute(`no-mark`)}get vertical(){return this.hasAttribute(`vertical`)}set vertical(e){e?this.setAttribute(`vertical`,``):this.removeAttribute(`vertical`)}get checkbox(){return this.hasAttribute(`checkbox`)}set checkbox(e){e?this.setAttribute(`checkbox`,``):this.removeAttribute(`checkbox`)}get value(){if(this._value!==void 0)return this._value;let e=this.getAttribute(`value`);if(e!==null)return Kr(e);if(this.label)return Kr(this.label)}set value(e){this._value=e}},po=Object.defineProperty,mo=Object.getOwnPropertyDescriptor,ho=(e,t,n,r)=>{for(var i=r>1?void 0:r?mo(t,n):t,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=(r?o(t,n,i):o(i))||i);return r&&i&&po(t,n,i),i},go=class extends A{constructor(){super(...arguments),this.multiple=!1,this.required=!1,this.vertical=!1,this.searchBox=!1,this._visible=!1,this._options=[],this._value=new Set,this._searchValue=``,this._dirty=!1,this.onValueChange=new Event(`change`),this._dialog=ot(),this._trigger=ot(),this._mutationObserver=new MutationObserver(()=>this._syncOptions()),this._onTriggerKeydown=e=>{e.key===`Enter`||e.key===` `?(e.preventDefault(),this.visible?this.visible=!1:this._openWithFocus()):e.key===`ArrowDown`?(e.preventDefault(),this.visible?this._focusOption(0):this._openWithFocus()):e.key===`ArrowUp`&&(e.preventDefault(),this.visible?this._focusOption(-1):this._openWithFocus())},this._onOptionKeydown=(e,t,n)=>{e.key===`Enter`||e.key===` `?(e.preventDefault(),this._onOptionClick(t)):e.key===`ArrowDown`?(e.preventDefault(),this._focusOption(n+1)):e.key===`ArrowUp`?(e.preventDefault(),this._focusOption(n-1)):e.key===`Home`?(e.preventDefault(),this._focusOption(0)):e.key===`End`?(e.preventDefault(),this._focusOption(-1)):e.key===`Escape`&&(e.preventDefault(),this.visible=!1)},this._onDialogClick=e=>{e.target===this._dialog.value&&(this.visible=!1)},this._onCancel=e=>{e.preventDefault(),this.visible=!1},this._onOptionClick=e=>{let t=this._value.has(e);!this.multiple&&!this.required&&!t?this._value=new Set([e]):!this.multiple&&!this.required&&t?this._value=new Set([]):!this.multiple&&this.required&&!t?this._value=new Set([e]):!this.multiple&&this.required&&t?this._value=new Set([]):this.multiple&&!this.required&&!t?this._value=new Set([...this._value,e]):this.multiple&&!this.required&&t?this._value=new Set([...this._value].filter(t=>t!==e)):this.multiple&&this.required&&!t?this._value=new Set([...this._value,e]):this.multiple&&this.required&&t&&(this._value=new Set([...this._value].filter(t=>t!==e))),this._dirty=!0,this._updateOptionsState(),this.dispatchEvent(new Event(`change`))},this._onSearch=e=>{this._searchValue=(e.target.value??``).toLowerCase()}}set visible(e){var t,n;let r=this._visible;if(e!==r){if(this._visible=e,e){let e=this._dialog.value;if(!e){this._visible=!1;return}e.showModal(),this._updatePosition()}else(t=this._dialog.value)==null||t.close(),this._resetState(),(n=this._trigger.value)==null||n.focus(),this.dispatchEvent(new Event(`close`,{bubbles:!0,composed:!0}));this.requestUpdate(`visible`,r)}}get visible(){return this._visible}get validation(){return this._validation}set validation(e){this._validation=e,this.requestUpdate()}get isValid(){return this._dirty?this.required&&this.value.length===0?!1:this._currentValidation?.valid??!0:!0}get _validationMessage(){return this.required&&this.value.length===0?`This field is required.`:this._currentValidation?.message}get _hasVisibleOptions(){return this._searchValue?this._options.some(e=>(e.label??String(e.value)??``).toLowerCase().includes(this._searchValue)):this._options.length>0}set value(e){let t=new Set;for(let n of e){let r=this._findOption(n);if(r&&(t.add(r),!this.multiple&&e.length===1))break}this._value=t,this._updateOptionsState(),this.dispatchEvent(new Event(`change`))}get value(){return[...this._value].filter(e=>e instanceof fo&&e.checked).map(e=>e.value)}connectedCallback(){super.connectedCallback(),this._mutationObserver.observe(this,{childList:!0}),customElements.whenDefined(`bim-option`).then(()=>this._syncOptions())}disconnectedCallback(){super.disconnectedCallback(),this._mutationObserver.disconnect()}willUpdate(e){this._currentValidation=this._validation?this._validation(this.value):void 0}updated(){this.toggleAttribute(`invalid`,!this.isValid)}firstUpdated(){var e;this._visible&&((e=this._dialog.value)==null||e.showModal(),this._updatePosition())}_syncOptions(){let e=Array.from(this.children).filter(e=>e.tagName===`BIM-OPTION`);this._options=e;let t=new Set(e.filter(e=>e.hasAttribute(`checked`))),n=[...this._value].some(e=>!t.has(e));this._value=t,n&&this.dispatchEvent(new Event(`change`))}_findOption(e){for(let t of Array.from(this.children))if(t instanceof fo&&(t.label===e||t.value===e))return t}_updateOptionsState(){for(let e of Array.from(this.children))e instanceof fo&&(e.checked=this._value.has(e))}_updatePosition(){let e=this._dialog.value,t=this._trigger.value;if(!e||!t)return;let n=window.innerWidth,r=window.innerHeight,i=t.getBoundingClientRect(),a=e.getBoundingClientRect(),o=i.left,s=i.bottom+4;s+a.height>r-5&&(s=i.top-a.height-4),o+a.width>n-5&&(o=i.right-a.width),o=Math.max(5,Math.min(o,n-a.width-5)),s=Math.max(5,Math.min(s,r-a.height-5)),e.style.minWidth=`${i.width}px`,e.style.left=`${o}px`,e.style.top=`${s}px`}_resetState(){this._searchValue=``;for(let e of Array.from(this.children))e instanceof fo&&(e.style.display=``)}_focusOption(e){var t;let n=[...this._dialog.value?.querySelectorAll(`.option`)??[]];if(!n.length)return;let r=e<0?n.length+e:e;(t=n[Math.max(0,Math.min(r,n.length-1))])==null||t.focus()}_openWithFocus(){this.visible=!0,requestAnimationFrame(()=>{var e;let t=this._dialog.value;if(!t)return;let n=t.querySelector(`.option.checked`),r=t.querySelector(`.option`);(e=n??r)==null||e.focus()})}_renderOption(e,t){let n=this._value.has(e);return this._searchValue&&!(e.label??String(e.value)??``).toLowerCase().includes(this._searchValue)?k:O`
      <div
        class=${pt({option:!0,checked:n})}
        role="option"
        aria-selected=${n}
        tabindex="-1"
        @click=${()=>this._onOptionClick(e)}
        @keydown=${n=>this._onOptionKeydown(n,e,t)}
      >
        <bim-label
          .icon=${e.icon}
          .img=${e.img}
          .vertical=${e.vertical}
        >${e.label}</bim-label>
        ${n&&!e.noMark?O`<svg xmlns="http://www.w3.org/2000/svg" height="1.125rem" viewBox="0 0 24 24" width="1.125rem">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>`:k}
      </div>
    `}render(){let e,t,n;if(this._value.size===0)e=this.placeholder??`Select an option...`;else if(this._value.size===1){let r=[...this._value][0];e=r?.label??String(r?.value??``),t=r?.img,n=r?.icon}else e=this.multipleLabel?this.multipleLabel(this._value.size):`Multiple (${this._value.size})`;return O`
      <div class="parent" title=${this.label??``}>
        ${this.label||this.icon?O`<bim-label class="field-label" .icon=${this.icon}>${this.label}</bim-label>`:null}
        <div class="wrapper">
          <div
            ${lt(this._trigger)}
            class="input"
            tabindex="0"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded=${this.visible}
            aria-controls="bim-dropdown-listbox"
            aria-label=${this.label??`Dropdown`}
            @click=${()=>this.visible=!this.visible}
            @keydown=${this._onTriggerKeydown}
          >
            <bim-label aria-hidden="true" .img=${t} .icon=${n}>${e}</bim-label>
            <svg xmlns="http://www.w3.org/2000/svg" height="1.125rem" viewBox="0 0 24 24" width="1.125rem">
              <path d="M0 0h24v24H0V0z" fill="none"/>
              <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
          </div>
        </div>
      </div>
      ${!this.isValid&&this._validationMessage?O`<span class="validation-message">${this._validationMessage}</span>`:k}
      <dialog
        id="bim-dropdown-listbox"
        role="listbox"
        aria-label=${this.label??`Options`}
        aria-multiselectable=${this.multiple}
        ${lt(this._dialog)}
        @click=${this._onDialogClick}
        @cancel=${this._onCancel}
      >
        ${this.searchBox?O`<bim-text-input
              @input=${this._onSearch}
              placeholder="Search..."
              debounce="200"
            ></bim-text-input>`:k}
        ${ft(this._options,e=>e,(e,t)=>this._renderOption(e,t))}
        ${this._hasVisibleOptions?k:O`<bim-label class="no-options">No options found...</bim-label>`}
      </dialog>
    `}};go.styles=[Vr.scrollbar,o`
      :host {
        --bim-input--olw: 2px;
        --bim-input--olc: transparent;
        --bim-input--bdrs: var(--bim-ui_size-2xs);
        --bim-input--bgc: var(--bim-ui_bg-contrast-20);
        display: block;
      }

      :host([visible]) {
        --bim-input--olc: var(--bim-ui_accent-base);
      }

      :host(:focus-within:not([visible])) {
        --bim-input--olc: var(--bim-ui_bg-contrast-40);
      }

      .parent {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        user-select: none;
        flex: 1;
        align-items: normal;
      }

      :host(:not([vertical])) .parent {
        justify-content: space-between;
      }

      :host([vertical]) .parent {
        flex-direction: column;
      }

      bim-label.field-label {
        margin-top: var(--bim-input--label-mt, 0);
      }

      .wrapper {
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        min-height: 25px;
        min-width: 3rem;
        gap: var(--bim-input--g, var(--bim-ui_size-4xs));
        padding: var(--bim-input--p, 0 7px);
        background-color: var(--bim-input--bgc, var(--bim-ui_bg-contrast-50));
        border: var(--bim-input--olw, 2px) solid var(--bim-input--olc, transparent);
        border-radius: var(--bim-input--bdrs, var(--bim-ui_size-2xs));
        transition: border-color 0.15s;
      }

      :host(:not([vertical])) .wrapper {
        flex: 1;
      }

      :host(:not([vertical])[label]) .wrapper {
        max-width: var(--bim-input--maxw, fit-content);
      }

      @media (prefers-reduced-motion: reduce) {
        .wrapper {
          transition: none;
        }
      }

      /* --bim-dropdown--c: color of the trigger label and chevron. Default: --bim-ui_bg-contrast-100 */
      .input {
        --bim-label--c: var(--bim-dropdown--c, var(--bim-ui_bg-contrast-100));
        height: 100%;
        display: flex;
        flex: 1;
        overflow: hidden;
        column-gap: 0.25rem;
        outline: none;
        cursor: pointer;
        align-items: center;
        justify-content: space-between;
      }

      .input bim-label {
        pointer-events: none;
        overflow: hidden;
      }

      .input svg {
        flex-shrink: 0;
        fill: var(--bim-dropdown--c, var(--bim-ui_bg-contrast-100));
      }

      dialog {
        position: fixed;
        margin: 0;
        padding: 0.375rem 0;
        border: none;
        outline: none;
        border-radius: 4px;
        background-color: var(--bim-ui_bg-contrast-10);
        box-shadow: 1px 2px 8px 2px rgba(0, 0, 0, 0.15);
        overflow: auto;
        max-height: 20rem;
        min-width: 3rem;
        display: none;
        flex-direction: column;
        transform-origin: top left;
      }

      dialog[open] {
        display: flex;
        animation: bim-dropdown-open 0.15s cubic-bezier(0.72, 0.1, 0.45, 2.35);
      }

      dialog::backdrop {
        background: transparent;
      }

      dialog bim-text-input {
        --bim-input--bgc: var(--bim-ui_bg-contrast-30);
        margin: 0 0.375rem 0.125rem;
      }

      .option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        column-gap: 0.5rem;
        padding: 0 0.5rem;
        min-height: 1.75rem;
        cursor: pointer;
        user-select: none;
        box-sizing: border-box;
      }

      .option:hover {
        background-color: var(--bim-ui_bg-contrast-20);
      }

      .option:focus-visible {
        outline: 2px solid var(--bim-ui_accent-base);
        outline-offset: -2px;
      }

      .option.checked {
        --bim-label--c: color-mix(in lab, var(--bim-ui_main-base), white 30%);
      }

      .option.checked svg {
        flex-shrink: 0;
        fill: color-mix(in lab, var(--bim-ui_main-base), white 30%);
      }

      .no-options {
        --bim-label--c: var(--bim-ui_bg-contrast-60);
        padding: 0.25rem 0.5rem;
      }

      :host([invalid]) {
        --bim-input--olc: var(--bim-ui_danger-base);
      }

      .validation-message {
        display: block;
        font-size: var(--bim-ui_size-base);
        color: var(--bim-ui_danger-base);
        padding: 2px var(--bim-ui_size-xs);
      }

      :host(:not([vertical])) .validation-message {
        text-align: right;
      }

      @keyframes bim-dropdown-open {
        from { opacity: 0; transform: scale(0.95); }
        to   { opacity: 1; transform: scale(1); }
      }

      @media (prefers-reduced-motion: reduce) {
        dialog[open] { animation: none; }
      }
    `];var _o=go;ho([j({type:String,reflect:!0})],_o.prototype,`name`,2),ho([j({type:String,reflect:!0})],_o.prototype,`icon`,2),ho([j({type:String,reflect:!0})],_o.prototype,`label`,2),ho([j({type:Boolean,reflect:!0})],_o.prototype,`multiple`,2),ho([j({type:Boolean,reflect:!0})],_o.prototype,`required`,2),ho([j({type:Boolean,reflect:!0})],_o.prototype,`vertical`,2),ho([j({type:String,reflect:!0})],_o.prototype,`placeholder`,2),ho([j({type:Boolean,reflect:!0,attribute:`search-box`})],_o.prototype,`searchBox`,2),ho([j({type:Boolean,reflect:!0})],_o.prototype,`visible`,1),ho([M()],_o.prototype,`_options`,2),ho([M()],_o.prototype,`_value`,2),ho([M()],_o.prototype,`_searchValue`,2);var vo=Object.defineProperty,yo=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&vo(t,n,i),i},bo,xo=(bo=class extends A{render(){return O`
      <div class="parent">
        <div class="content">
          <div class="illustration">
            ${bo._illustration}
            ${this.label?O`<bim-label class="title">${this.label}</bim-label>`:null}
          </div>
          ${this.description?O`<bim-label class="description">${this.description}</bim-label>`:null}
        </div>
        <slot></slot>
      </div>
    `}},bo._illustration=O`<svg
    width="157"
    height="156"
    viewBox="0 0 157 156"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clip-path="url(#bim-empty-state-clip)">
      <mask
        id="bim-empty-state-mask"
        style="mask-type:alpha"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="157"
        height="156"
      >
        <ellipse cx="78.5" cy="78" rx="78.5" ry="78" fill="url(#bim-empty-state-radial)" />
      </mask>
      <g mask="url(#bim-empty-state-mask)">
        <path d="M2.33321 94.9001H34.2999C38.7803 94.9001 41.0205 94.9001 42.7318 94.0281C44.2371 93.2611 45.4609 92.0373 46.2279 90.532C47.0999 88.8207 47.0999 86.5805 47.0999 82.1V50.4353C47.0999 48.1467 47.0999 47.0024 46.8058 45.948C46.5453 45.0139 46.1172 44.135 45.5423 43.3541C44.8933 42.4726 43.9922 41.7672 42.1902 40.3565L28.9883 30.0212C27.6995 29.0123 27.0551 28.5078 26.3403 28.1493C25.7061 27.8311 25.0324 27.5988 24.3369 27.4583C23.5531 27.3 22.7347 27.3 21.098 27.3H2.33321C-2.14722 27.3 -4.38743 27.3 -6.09872 28.172C-7.60402 28.939 -8.82786 30.1628 -9.59485 31.6681C-10.4668 33.3794 -10.4668 35.6196 -10.4668 40.1V82.1001C-10.4668 86.5805 -10.4668 88.8207 -9.59485 90.532C-8.82786 92.0373 -7.60402 93.2611 -6.09872 94.0281C-4.38743 94.9001 -2.14722 94.9001 2.33321 94.9001Z" fill="#F8F8F8" fill-opacity="0.08" style="mix-blend-mode:luminosity" />
        <path d="M2.33321 94.9001H34.2999C38.7803 94.9001 41.0205 94.9001 42.7318 94.0281C44.2371 93.2611 45.4609 92.0373 46.2279 90.532C47.0999 88.8207 47.0999 86.5805 47.0999 82.1V50.4353C47.0999 48.1467 47.0999 47.0024 46.8058 45.948C46.5453 45.0139 46.1172 44.135 45.5423 43.3541C44.8933 42.4726 43.9922 41.7672 42.1902 40.3565L28.9883 30.0212C27.6995 29.0123 27.0551 28.5078 26.3403 28.1493C25.7061 27.8311 25.0324 27.5988 24.3369 27.4583C23.5531 27.3 22.7347 27.3 21.098 27.3H2.33321C-2.14722 27.3 -4.38743 27.3 -6.09872 28.172C-7.60402 28.939 -8.82786 30.1628 -9.59485 31.6681C-10.4668 33.3794 -10.4668 35.6196 -10.4668 40.1V82.1001C-10.4668 86.5805 -10.4668 88.8207 -9.59485 90.532C-8.82786 92.0373 -7.60402 93.2611 -6.09872 94.0281C-4.38743 94.9001 -2.14722 94.9001 2.33321 94.9001Z" stroke="white" stroke-opacity="0.15" stroke-width="1.5" />
        <path d="M154.667 61.0999H122.7C118.22 61.0999 115.98 61.0999 114.268 61.9719C112.763 62.7389 111.539 63.9627 110.772 65.468C109.9 67.1793 109.9 69.4195 109.9 73.9V105.565C109.9 107.853 109.9 108.998 110.194 110.052C110.455 110.986 110.883 111.865 111.458 112.646C112.107 113.527 113.008 114.233 114.81 115.644L128.012 125.979C129.3 126.988 129.945 127.492 130.66 127.851C131.294 128.169 131.968 128.401 132.663 128.542C133.447 128.7 134.265 128.7 135.902 128.7H154.667C159.147 128.7 161.387 128.7 163.099 127.828C164.604 127.061 165.828 125.837 166.595 124.332C167.467 122.621 167.467 120.38 167.467 115.9V73.8999C167.467 69.4195 167.467 67.1793 166.595 65.468C165.828 63.9627 164.604 62.7389 163.099 61.9719C161.387 61.0999 159.147 61.0999 154.667 61.0999Z" fill="#F8F8F8" fill-opacity="0.08" style="mix-blend-mode:luminosity" />
        <path d="M84.758 182H116.725C121.205 182 123.445 182 125.157 181.128C126.662 180.361 127.886 179.137 128.653 177.632C129.525 175.921 129.525 173.68 129.525 169.2V137.535C129.525 135.247 129.525 134.102 129.231 133.048C128.97 132.114 128.542 131.235 127.967 130.454C127.318 129.573 126.417 128.867 124.615 127.456L111.413 117.121C110.124 116.112 109.48 115.608 108.765 115.249C108.131 114.931 107.457 114.699 106.762 114.558C105.978 114.4 105.16 114.4 103.523 114.4H84.758C80.2776 114.4 78.0374 114.4 76.3261 115.272C74.8208 116.039 73.5969 117.263 72.83 118.768C71.958 120.479 71.958 122.72 71.958 127.2V169.2C71.958 173.68 71.958 175.921 72.83 177.632C73.5969 179.137 74.8208 180.361 76.3261 181.128C78.0374 182 80.2776 182 84.758 182Z" fill="#F8F8F8" fill-opacity="0.08" style="mix-blend-mode:luminosity" />
      </g>
      <path d="M63.2502 111.583H93.7502C98.2306 111.583 100.471 111.583 102.182 110.711C103.687 109.944 104.911 108.721 105.678 107.215C106.55 105.504 106.55 103.264 106.55 98.7833V67.3691C106.55 65.1068 106.55 63.9756 106.262 62.9315C106.007 62.0065 105.588 61.1349 105.024 60.3584C104.387 59.482 103.503 58.7763 101.735 57.3651L89.0157 47.2126C87.7173 46.1763 87.0681 45.6581 86.3455 45.2897C85.7044 44.9628 85.0221 44.7239 84.3172 44.5794C83.5226 44.4166 82.6919 44.4166 81.0307 44.4166H63.2502C58.7698 44.4166 56.5296 44.4166 54.8183 45.2886C53.313 46.0556 52.0891 47.2794 51.3221 48.7847C50.4502 50.496 50.4502 52.7362 50.4502 57.2166V98.7833C50.4502 103.264 50.4502 105.504 51.3221 107.215C52.0891 108.721 53.313 109.944 54.8183 110.711C56.5296 111.583 58.7698 111.583 63.2502 111.583Z" fill="#F8F8F8" fill-opacity="0.05" style="mix-blend-mode:luminosity" />
      <g filter="url(#bim-empty-state-shadow)">
        <path d="M62.6 109H94.4C97.7603 109 99.4405 109 100.724 108.346C101.853 107.771 102.771 106.853 103.346 105.724C104 104.44 104 102.76 104 99.4V67.0766C104 65.3954 104 64.5548 103.788 63.7778C103.599 63.0894 103.29 62.4402 102.873 61.8605C102.404 61.2062 101.751 60.677 100.445 59.6184L87.5178 49.1419C86.5385 48.3482 86.0489 47.9514 85.5023 47.6691C85.0175 47.4187 84.5007 47.2355 83.9664 47.1248C83.364 47 82.7338 47 81.4733 47H62.6C59.2397 47 57.5595 47 56.2761 47.654C55.1471 48.2292 54.2292 49.1471 53.654 50.2761C53 51.5595 53 53.2397 53 56.6V99.4C53 102.76 53 104.44 53.654 105.724C54.2292 106.853 55.1471 107.771 56.2761 108.346C57.5595 109 59.2397 109 62.6 109Z" fill="#F8F8F8" fill-opacity="0.08" style="mix-blend-mode:luminosity" />
        <path d="M62.6 109H94.4C97.7603 109 99.4405 109 100.724 108.346C101.853 107.771 102.771 106.853 103.346 105.724C104 104.44 104 102.76 104 99.4V67.0766C104 65.3954 104 64.5548 103.788 63.7778C103.599 63.0894 103.29 62.4402 102.873 61.8605C102.404 61.2062 101.751 60.677 100.445 59.6184L87.5178 49.1419C86.5385 48.3482 86.0489 47.9514 85.5023 47.6691C85.0175 47.4187 84.5007 47.2355 83.9664 47.1248C83.364 47 82.7338 47 81.4733 47H62.6C59.2397 47 57.5595 47 56.2761 47.654C55.1471 48.2292 54.2292 49.1471 53.654 50.2761C53 51.5595 53 53.2397 53 56.6V99.4C53 102.76 53 104.44 53.654 105.724C54.2292 106.853 55.1471 107.771 56.2761 108.346C57.5595 109 59.2397 109 62.6 109Z" stroke="white" stroke-opacity="0.18" stroke-width="1.5" />
      </g>
      <path d="M75.9031 85.0833C74.6481 85.0833 73.5803 84.6373 72.6998 83.7452C71.8192 82.8531 71.3789 81.7713 71.3789 80.5V75.5C71.3789 74.2286 71.8192 73.1468 72.6998 72.2548C73.5803 71.3627 74.6481 70.9166 75.9031 70.9166H80.8386C82.0936 70.9166 83.1613 71.3627 84.0419 72.2548C84.9225 73.1468 85.3628 74.2286 85.3628 75.5V80.5C85.3628 81.7713 84.9225 82.8531 84.0419 83.7452C83.1613 84.6373 82.0936 85.0833 80.8386 85.0833H75.9031ZM77.5483 79.2885L76.1721 77.8941C76.0582 77.7788 75.915 77.7198 75.7425 77.717C75.5702 77.7144 75.4244 77.7734 75.3051 77.8941C75.1859 78.015 75.1264 78.1613 75.1264 78.3333C75.1264 78.5052 75.1859 78.6516 75.3051 78.7725L77.0278 80.5177C77.1765 80.6682 77.35 80.7435 77.5483 80.7435C77.7465 80.7435 77.92 80.6682 78.0688 80.5177L81.7656 76.7725C81.8794 76.657 81.9377 76.512 81.9404 76.3373C81.943 76.1627 81.8848 76.015 81.7656 75.8941C81.6464 75.7734 81.5019 75.7131 81.3321 75.7131C81.1624 75.7131 81.0179 75.7734 80.8986 75.8941L77.5483 79.2885Z" fill="#F8F8F8" fill-opacity="0.85" />
    </g>
    <defs>
      <filter id="bim-empty-state-shadow" x="20.25" y="14.25" width="116.5" height="143.5" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dy="24" />
        <feGaussianBlur stdDeviation="12" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
        <feBlend mode="multiply" in2="BackgroundImageFix" result="bim-empty-state-shadow-blend" />
        <feBlend mode="normal" in="SourceGraphic" in2="bim-empty-state-shadow-blend" result="shape" />
      </filter>
      <radialGradient id="bim-empty-state-radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(78.5 78) rotate(90) scale(78 78.5)">
        <stop stop-color="#D9D9D9" />
        <stop offset="1" stop-color="#737373" stop-opacity="0" />
      </radialGradient>
      <clipPath id="bim-empty-state-clip">
        <rect width="157" height="156" fill="white" />
      </clipPath>
    </defs>
  </svg>`,bo.styles=o`
    :host {
      display: block;
    }

    .parent {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      height: 100%;
      min-height: 12rem;
      padding: 1rem;
      text-align: center;
    }

    .content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .illustration {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    svg {
      width: 7.5rem;
      height: auto;
      opacity: 0.9;
      flex-shrink: 0;
    }

    bim-label.title {
      font-size: var(--bim-ui_size-lg);
      font-weight: 500;
    }

    bim-label.description {
      --bim-label--c: var(--bim-ui_bg-contrast-60);
      max-width: 220px;
      white-space: normal;
    }
  `,bo);yo([j({type:String,reflect:!0})],xo.prototype,`label`),yo([j({type:String,reflect:!0})],xo.prototype,`description`);var So=xo;function Co(e){let t=[],n=``,r=0;for(let i of e)i===`[`||i===`(`?(r++,n+=i):i===`]`||i===`)`?(r--,n+=i):i===` `&&r===0?n!==``&&(t.push(n===`.`?null:n),n=``):n+=i;return n!==``&&t.push(n===`.`?null:n),t}function wo(e){let t=[],n=/(["'])(.*?)\1/g,r;for(;(r=n.exec(e))!==null;){let e=r[2].trim();if(e===``){t.push([]);continue}t.push(Co(e))}if(t.length===0){let n=e.split(/\r?\n/).map(e=>e.trim()).filter(Boolean);for(let e of n){let n=e.replace(/^["']|["']$/g,``).trim();n&&t.push(Co(n))}}return t}function To(e){let t=wo(e),n=new Set;for(let e of t)for(let t of e)t!==null&&t!==``&&n.add(t);return[...n]}function Eo(e){let t=[],n=e.length,r=e[0]?.length||0;for(let i=0;i<n;i++)for(let n=0;n<r-1;n++){let r=e[i][n],a=e[i][n+1];if(r!==a){let e=t.find(e=>e.type===`vertical`&&e.from[0]===n+1&&e.to[0]===n+1&&e.from[1]<=i&&e.to[1]>=i);e?(e.to[1]=i+1,e.left&&r&&e.left.push(r),e.right&&a&&e.right.push(a)):t.push({type:`vertical`,from:[n+1,i],to:[n+1,i+1],left:r?[r]:[],right:a?[a]:[]})}}for(let i=0;i<n-1;i++)for(let n=0;n<r;n++){let r=e[i][n],a=e[i+1][n];if(r!==a){let e=t.find(e=>e.type===`horizontal`&&e.from[1]===i+1&&e.to[1]===i+1&&e.from[0]<=n&&e.to[0]>=n);e?(e.to[0]=n+1,e.above&&r&&e.above.push(r),e.below&&a&&e.below.push(a)):t.push({type:`horizontal`,from:[n,i+1],to:[n+1,i+1],above:r?[r]:[],below:a?[a]:[]})}}return Do(t)}function Do(e){for(let t of e)t.left&&=[...new Set(t.left)],t.right&&=[...new Set(t.right)],t.above&&=[...new Set(t.above)],t.below&&=[...new Set(t.below)];return e}function Oo(e,t,n,r){let i=(parseFloat(e.colSizesComputed[n-1])||0)+t,a;return a=(parseFloat(e.colSizesComputed[n])||0)-t,{left:i,right:a}}function ko(e,t,n,r){let i=(parseFloat(e.rowSizesComputed[n-1])||0)+t,a;return a=(parseFloat(e.rowSizesComputed[n])||0)-t,{top:i,bottom:a}}function Ao(e,t,n,r){return!(e<r&&n<0||t<r&&n>0)}function jo(e,t,n,r){return!(e<r&&n<0||t<r&&n>0)}function Mo(e,t){let[n,r]=e.from,[i,a]=e.to,o=t.gap.split(` `),s=o[1]||o[0]||`0px`,c=o[0]||`0px`,l=e.type===`horizontal`?`0`:`calc(-50% - ${s} / 2)`,u=e.type===`horizontal`?`calc(-50% - ${c} / 2)`:`0`,d={"grid-column":`${n+1} / ${i+1}`,"grid-row":`${r+1} / ${a+1}`,transform:`translate(${l}, ${u})`},f=parseFloat(t.fontSize);return e.type===`vertical`?d.width=`${Math.max(parseFloat(s),f)}px`:d.height=`${Math.max(parseFloat(c),f)}px`,d}var No=Object.defineProperty,Po=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&No(t,n,i),i},Fo=class extends A{constructor(){super(...arguments),this.floating=!1,this.resizeableAreas=!1,this.areasResizeExceptions=[],this._layouts={},this._elements={},this.areaGroups={},this._templateIds=new Map,this._updateFunctions={},this._slotNames={notAllowed:`not-allowed`,notFound:`not-found`,emptyLayout:`empty-layout`},this._colSizesRaw=[],this._rowSizesRaw=[],this._colSizesComputed=[],this._rowSizesComputed=[],this._start=null,this.layoutsResize={},this._onMouseMove=e=>{if(!this._start||!this.layout)return;let t=e.clientX-this._start.x,n=e.clientY-this._start.y,r=this._start.divider,i=getComputedStyle(this),a=parseFloat(i.fontSize)*3;if(r.type===`vertical`){let e=r.from[0],n=e===this._colSizesRaw.length-1,i=Oo(this._start,t,e,n);if(!Ao(i.left,i.right,t,a))return;let o=Math.max(a,i.left),s=Math.max(a,i.right);this._colSizesRaw[e-1]=`${o}px`,this._colSizesRaw[e]=n?`1fr`:`${s}px`,this.style.gridTemplateColumns=this._colSizesRaw.join(` `)}if(r.type===`horizontal`){let e=r.from[1],t=e===this._rowSizesRaw.length-1,i=ko(this._start,n,e,t);if(!jo(i.top,i.bottom,n,a))return;let o=Math.max(a,i.top),s=Math.max(a,i.bottom);this._rowSizesRaw[e-1]=`${o}px`,this._rowSizesRaw[e]=t?`1fr`:`${s}px`,this.style.gridTemplateRows=this._rowSizesRaw.join(` `)}this.layoutsResize[this.layout]={cols:this._colSizesRaw,rows:this._rowSizesRaw}},this._onMouseUp=()=>{window.removeEventListener(`mousemove`,this._onMouseMove),window.removeEventListener(`mouseup`,this._onMouseUp),this._start=null},this.updateComponent={},this.emitLayoutChange=()=>{this.dispatchEvent(new Event(`layoutchange`))}}set layouts(e){this._layouts=e,this._templateIds.clear()}get layouts(){return this._layouts}set elements(e){this._elements=e,this.setUpdateFunctions()}get elements(){return this._elements}getLayoutAreas(e){return To(e.template)}setUpdateFunctions(){let e={};for(let[t,n]of Object.entries(this.elements))`template`in n&&(e[t]=e=>{var n,r;(r=(n=this._updateFunctions)[t])==null||r.call(n,e)});this.updateComponent=e}disconnectedCallback(){super.disconnectedCallback(),this._templateIds.clear(),this._updateFunctions={},this.updateComponent={}}getTemplateId(e){let t=this._templateIds.get(e);return t||(t=Ur.newRandomId(),this._templateIds.set(e,t)),t}isAreaResizeable(e){return!this.areasResizeExceptions.includes(e)&&this.resizeableAreas}canResizeVerticalDivider(e){let t=e.left||[],n=e.right||[];for(let e of t)if(!this.isAreaResizeable(e))return!1;for(let e of n)if(!this.isAreaResizeable(e))return!1;return!0}canResizeHorizontalDivider(e){let t=e.above||[],n=e.below||[];for(let e of t)if(!this.isAreaResizeable(e))return!1;for(let e of n)if(!this.isAreaResizeable(e))return!1;return!0}computeDividers(){if(!this.layout)return;let e=this.layouts[this.layout]?.template;if(!e)return;let t=Eo(wo(e)),n=getComputedStyle(this),r=[];for(let e of t){let t=!1;if(t=e.type===`vertical`?this.canResizeVerticalDivider(e):this.canResizeHorizontalDivider(e),!t)continue;let i=t=>{this._colSizesRaw=this.style.gridTemplateColumns.split(` `),this._rowSizesRaw=this.style.gridTemplateRows.split(` `),this._rowSizesComputed=n.gridTemplateRows.split(` `),this._colSizesComputed=n.gridTemplateColumns.split(` `),this._start={x:t.clientX,y:t.clientY,divider:e,colSizesRaw:[...this._colSizesRaw],rowSizesRaw:[...this._rowSizesRaw],colSizesComputed:[...this._colSizesComputed],rowSizesComputed:[...this._rowSizesComputed]},window.addEventListener(`mousemove`,this._onMouseMove),window.addEventListener(`mouseup`,this._onMouseUp)},a=e=>{e.preventDefault()},o=Mo(e,n),s=O`
        <div @mousedown=${i} @contextmenu=${a} class="grid-divider divider-${e.type}" style=${gt(o)}>
          <div></div>
        </div>
      `;r.push(s)}return r}parseTabToken(e){let t=e.match(/^(\w+)\[([^\]]+)\]$/);return t?{name:t[1],keys:t[2].split(`,`).map(e=>e.trim())}:e}parseTabElementTokens(e){let t=[],n=``,r=0;for(let i of e)if(i===`[`)r++,n+=i;else if(i===`]`)r--,n+=i;else if(i===`,`&&r===0){let e=n.trim();e&&t.push(this.parseTabToken(e)),n=``}else n+=i;return n.trim()&&t.push(this.parseTabToken(n.trim())),t}extractElementKeys(e){let t=e.match(/^\w+:\w+\(([^)]+)\)$/);return t?this.parseTabElementTokens(t[1]).flatMap(e=>typeof e==`string`?[e]:e.keys):[e]}cleanUpdateFunctions(){if(!this.layout){this._updateFunctions={};return}let e=this.layouts[this.layout],t=this.getLayoutAreas(e).flatMap(e=>this.extractElementKeys(e));for(let e in this.elements)t.includes(e)||delete this._updateFunctions[e]}clean(){this.style.gridTemplate=``;for(let e of[...this.children])Object.values(this._slotNames).some(t=>e.getAttribute(`slot`)===t)||e.remove();this.cleanUpdateFunctions()}emitElementCreation(e){this.dispatchEvent(new CustomEvent(`elementcreated`,{detail:e}))}getSanitizedLayoutTemplate(e){return e.replace(/\w+:(\w+)\([^)]*\)/g,`$1`)}createElementFromDefinition(e,t){if(t instanceof HTMLElement)return t;if(`template`in t){let{template:n,initialState:r}=t,i=this.getTemplateId(n),a=this.querySelector(`[data-grid-template-id="${i}"]`);if(a){let t=this._updateFunctions[e];if(!t){for(let[,e]of Object.entries(this._updateFunctions))if(this.querySelector(`[data-grid-template-id="${this.getTemplateId(n)}"]`)===a){t=e;break}}return t&&(this._updateFunctions[e]=t),a}let[o,s]=Wr.create(n,r);return o.setAttribute(`data-grid-template-id`,i),this._updateFunctions[e]=s,o}let n=this.getTemplateId(t),r=this.querySelector(`[data-grid-template-id="${n}"]`);if(r)return r;let i=Wr.create(t);return i.setAttribute(`data-grid-template-id`,this.getTemplateId(t)),i}render(){if(this.layout){let e=this.layouts[this.layout];if(e){if(!(e.guard??(()=>!0))())return this.clean(),O`<slot name=${this._slotNames.notAllowed}></slot>`;let t=this.getLayoutAreas(e),n=e=>e.split(`,`).map(e=>e.trim()).filter(Boolean),r=t=>e.elements?.[t]||this.elements[t],i=e=>{let t=r(e);return t&&typeof t==`object`&&`label`in t&&t.label?t.label:e},a=e=>{let t=r(e);if(t&&typeof t==`object`&&`icon`in t&&typeof t.icon==`string`)return t.icon},o=t.map(e=>{let t=e.match(/^tabs:([^(]+)\(([^)]+)\)$/),o=e.match(/^panel:([^(]+)\(([^)]+)\)$/);if(!t&&!o){let t=r(e);if(!t)return null;let n=this.createElementFromDefinition(e,t);return n?(this.emitElementCreation({name:e,element:n}),n.style.gridArea=e,n):null}let s=t?t[1]:o[1],c=n(t?t[2]:o[2]);if(t){let e=`tabs-${s}`,n=this.querySelector(`[data-grid-tabs-id="${e}"]`);n||(n=document.createElement(`bim-tabs`),n.setAttribute(`data-grid-tabs-id`,e));let o=this.areaGroups[s];o!=null&&o.switchersFull?n.setAttribute(`switchers-full`,``):n.removeAttribute(`switchers-full`),o!=null&&o.switchersCompact?n.setAttribute(`switchers-compact`,``):n.removeAttribute(`switchers-compact`),n.style.gridArea=s;let c=[],l=this.parseTabElementTokens(t[2]);for(let e of l)if(typeof e==`string`){let t=r(e);if(!t)continue;let o=this.createElementFromDefinition(e,t);if(!o)continue;this.emitElementCreation({name:e,element:o});let l=`tab-${s}-${e}`,u=n.querySelector(`[data-grid-tab-id="${l}"]`);u||(u=document.createElement(`bim-tab`),u.setAttribute(`data-grid-tab-id`,l),u.name=e),u.label=i(e),u.icon=a(e),u.innerHTML=``,u.appendChild(o),c.push(u)}else{let{name:t,keys:i}=e,a=this.areaGroups[t],o=`tab-${s}-${t}`,l=n.querySelector(`[data-grid-tab-id="${o}"]`);l||(l=document.createElement(`bim-tab`),l.setAttribute(`data-grid-tab-id`,o),l.name=t),l.label=a?.label??t,l.icon=a?.icon;let u=`panel-${s}-${t}`,d=l.querySelector(`[data-grid-panel-id="${u}"]`);d||(d=document.createElement(`bim-panel`),d.setAttribute(`data-grid-panel-id`,u)),d.innerHTML=``;for(let e of i){let t=r(e);if(!t)continue;let n=this.createElementFromDefinition(e,t);n&&(this.emitElementCreation({name:e,element:n}),d.appendChild(n))}l.innerHTML=``,l.appendChild(d),c.push(l)}return n.innerHTML=``,n.append(...c),n}let l=`panel-${s}`,u=this.querySelector(`[data-grid-panel-id="${l}"]`);u||(u=document.createElement(`bim-panel`),u.setAttribute(`data-grid-panel-id`,l));let d=this.areaGroups[s];d!=null&&d.label?u.setAttribute(`label`,d.label):u.removeAttribute(`label`),d!=null&&d.icon?u.setAttribute(`icon`,d.icon):u.removeAttribute(`icon`),u.style.gridArea=s;let f=[];for(let e of c){let t=r(e);if(!t)continue;let n=this.createElementFromDefinition(e,t);n&&(this.emitElementCreation({name:e,element:n}),f.push(n))}return u.innerHTML=``,u.append(...f),u}).filter(e=>e!==null);this.clean(),this.style.gridTemplate=this.getSanitizedLayoutTemplate(e.template);let s=this.layoutsResize[this.layout];s&&(this.style.gridTemplateColumns=s.cols.join(` `),this.style.gridTemplateRows=s.rows.join(` `)),this.append(...o),this.emitLayoutChange()}else return this.clean(),O`<slot name=${this._slotNames.notFound}></slot>`}else return this.clean(),this.emitLayoutChange(),O`<slot name=${this._slotNames.emptyLayout}></slot>`;return O`
      ${this.resizeableAreas?this.computeDividers():null}
      <slot></slot>
    `}};Fo.styles=o`
    :host {
      display: grid;
      height: 100%;
      width: 100%;
      overflow: hidden;
      box-sizing: border-box;
    }

    /* :host(:not([layout])) {
      display: none;
    } */

    :host([floating]) {
      --bim-panel--bdrs: var(--bim-ui_size-4xs);
      padding: 1rem;
      gap: 1rem;
      position: absolute;
      pointer-events: none;
      top: 0px;
      left: 0px;
    }

    :host(:not([floating])) {
      --bim-panel--bdrs: 0;
      /* background-color: var(--bim-ui_bg-base); */
      gap: 1px;
    }

    .grid-divider {
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      user-select: none;
    }

    .grid-divider > div {
      transition: background-color 150ms ease-in-out;
    }
    
    .grid-divider:hover > div {
      background-color: var(--bim-ui_accent-base);
    }
    
    .divider-horizontal {
      /* background-color: #ff00003d; */
      transform: translateY(-50%);
      cursor: n-resize;
    }
    
    .divider-horizontal > div {
      height: 3px;
      width: 100%;
      /* transform: translateY(-50%); */
    }
    
    .divider-vertical {
      /* background-color: #ff00003d; */
      transform: translateX(-50%);
      cursor: e-resize;
    }
    
    .divider-vertical > div {
      width: 3px;
      height: 100%;
      /* transform: translateX(-50%); */
    }
  `;var Io=Fo;Po([j({type:Boolean,reflect:!0})],Io.prototype,`floating`),Po([j({type:String,reflect:!0})],Io.prototype,`layout`),Po([j({type:Boolean,attribute:`areas-resizeable`,reflect:!0})],Io.prototype,`resizeableAreas`),Po([j({type:Array,attribute:!1})],Io.prototype,`areasResizeExceptions`);var Lo=Object.defineProperty,Ro=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&Lo(t,n,i),i},zo=class extends A{constructor(){super(...arguments),this.ariaLabel=null}updated(){this.ariaLabel?(this.setAttribute(`role`,`img`),this.removeAttribute(`aria-hidden`)):(this.removeAttribute(`role`),this.setAttribute(`aria-hidden`,`true`))}render(){return this.icon?O`
      <iconify-icon
        .icon=${this.icon}
        height="none"
        noobserver
        aria-hidden=${this.ariaLabel?k:`true`}
      ></iconify-icon>
    `:k}};zo.styles=o`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--bim-icon--sz, var(--bim-icon--fz, var(--bim-ui_size-xl)));
      height: var(--bim-icon--sz, var(--bim-icon--fz, var(--bim-ui_size-xl)));
    }

    iconify-icon {
      width: 100%;
      height: 100%;
      color: var(--bim-icon--c, currentColor);
      transition: color 0.15s, width 0.15s, height 0.15s;
      display: flex;
    }

    @media (prefers-reduced-motion: reduce) {
      iconify-icon {
        transition: none;
      }
    }
  `;var Bo=zo;Ro([j({type:String,reflect:!0})],Bo.prototype,`icon`),Ro([j({type:String,attribute:`aria-label`,reflect:!0})],Bo.prototype,`ariaLabel`);var Vo=Object.defineProperty,Ho=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&Vo(t,n,i),i},Uo=class extends A{constructor(){super(...arguments),this.vertical=!1,this.onValueChange=new Event(`change`)}connectedCallback(){super.connectedCallback(),console.warn(`[bim-input] This component is deprecated and will be removed in a future version of the library.`)}get value(){let e={};for(let t of this.children){let n=t;`value`in n?e[n.name||n.label]=n.value:`checked`in n&&(e[n.name||n.label]=n.checked)}return e}set value(e){let t=[...this.children];for(let n in e){let r=t.find(e=>{let t=e;return t.name===n||t.label===n});if(!r)continue;let i=r,a=e[n];typeof a==`boolean`?i.checked=a:i.value=a}}render(){return O`
      <div class="parent">
        ${this.label||this.icon?O`<bim-label .icon=${this.icon}>${this.label}</bim-label>`:null}
        <div class="input">
          <slot></slot>
        </div>
      </div>
    `}};Uo.styles=o`
    :host {
      flex: 1;
      display: block;
    }

    .parent {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      user-select: none;
      flex: 1;
      align-items: var(--bim-input--ai, normal);
    }

    bim-label {
      margin-top: var(--bim-input--label-mt, 0);
    }

    :host(:not([vertical])) .parent {
      justify-content: space-between;
    }

    :host([vertical]) .parent {
      flex-direction: column;
    }

    .input {
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      min-height: 25px;
      min-width: 3rem;
      gap: var(--bim-input--g, var(--bim-ui_size-4xs));
      padding: var(--bim-input--p, 0 12px);
      background-color: var(--bim-input--bgc, var(--bim-ui_bg-contrast-50));
      border: var(--bim-input--olw, 2px) solid
        var(--bim-input--olc, transparent);
      border-radius: var(--bim-input--bdrs, var(--bim-ui_size-2xs));
      transition: all 0.15s;
    }

    :host(:not([vertical])) .input {
      flex: 1;
      justify-content: flex-end;
    }

    :host(:not([vertical])[label]) .input {
      max-width: var(--bim-input--maxw, fit-content);
    }
  `;var Wo=Uo;Ho([j({type:String,reflect:!0})],Wo.prototype,`name`),Ho([j({type:String,reflect:!0})],Wo.prototype,`label`),Ho([j({type:String,reflect:!0})],Wo.prototype,`icon`),Ho([j({type:Boolean,reflect:!0})],Wo.prototype,`vertical`);var Go=Object.defineProperty,Ko=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&Go(t,n,i),i},qo,Jo=(qo=class extends A{constructor(){super(...arguments),this.labelHidden=!1,this.iconHidden=!1,this.vertical=!1}get value(){let e=(this.label??this.textContent)?.trim();if(e)return Kr(e)}updated(){let e=(this.label??this.textContent)?.trim()??``;this.labelHidden&&e?this.setAttribute(`aria-label`,e):this.removeAttribute(`aria-label`)}render(){let e=this.label??this.textContent??``;return O`
      <div class="parent" title=${e}>
        ${_t(this.img,()=>O`<img src=${this.img} alt=${e} />`)}
        ${_t(!this.iconHidden&&this.icon,()=>O`<bim-icon .icon=${this.icon}></bim-icon>`)}
        ${this.label===void 0?O`<p><slot></slot></p>`:this.label?O`<p>${this.label}</p>`:k}
      </div>
    `}},qo.styles=o`
    :host {
      --bim-icon--c: var(--bim-label--ic);
      box-sizing: border-box;
      color: var(--bim-label--c, var(--bim-ui_bg-contrast-80));
      font-size: var(--bim-label--fz, var(--bim-ui_size-base));
      display: block;
      white-space: nowrap;
      transition: color var(--bim-ui_duration-fast, 0.15s),
                  opacity var(--bim-ui_duration-fast, 0.15s);
      user-select: var(--bim-label--us, none);
      overflow: hidden;
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        transition: none;
      }
    }

    /* :host([icon]) {
      line-height: 1;
    } */

    .parent {
      display: flex;
      align-items: center;
      gap: var(--bim-label--gap, 0.375rem);
      height: 100%;
    }

    :host([vertical]) .parent {
      flex-direction: column;
    }

    .parent p {
      margin: 0;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    :host([label-hidden]) .parent p,
    :host(:empty) .parent p {
      display: none;
    }

    bim-icon {
      flex-shrink: 0;
      /* align-self: baseline; */
    }

    img {
      height: 100%;
      aspect-ratio: 1;
      border-radius: var(--bim-label_img--bdrs, 100%);
      margin-right: 0.125rem;
      flex-shrink: 0;
    }

    :host(:not([vertical])) img {
      max-height: var(
        --bim-label_icon--sz,
        calc(var(--bim-label--fz, var(--bim-ui_size-xs)) * 1.8)
      );
    }

    :host([vertical]) img {
      max-height: var(
        --bim-label_icon--sz,
        calc(var(--bim-label--fz, var(--bim-ui_size-xs)) * 4)
      );
    }
  `,qo);Ko([j({type:String})],Jo.prototype,`img`),Ko([j({type:Boolean,attribute:`label-hidden`,reflect:!0})],Jo.prototype,`labelHidden`),Ko([j({type:String,reflect:!0})],Jo.prototype,`icon`),Ko([j({type:Boolean,attribute:`icon-hidden`})],Jo.prototype,`iconHidden`),Ko([j({type:Boolean,reflect:!0})],Jo.prototype,`vertical`),Ko([j({type:String})],Jo.prototype,`label`);var Yo=Object.defineProperty,Xo=Object.getOwnPropertyDescriptor,Zo=(e,t,n,r)=>{for(var i=r>1?void 0:r?Xo(t,n):t,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=(r?o(t,n,i):o(i))||i);return r&&i&&Yo(t,n,i),i},Qo=class extends A{constructor(){super(...arguments),this._hidden=!1,this.headerHidden=!1,this.valueTransform={},this._animation=null}set hidden(e){this._hidden=e,this.isConnected&&(this.animatePanel(),this.dispatchEvent(new Event(`hiddenchange`)))}get hidden(){return this._hidden}get value(){return Gr(this,this.valueTransform)}get activationButton(){console.warn(`[bim-panel] activationButton is deprecated. Wire up your own bim-button instead: btn.onclick = () => (panel.hidden = !panel.hidden).`)}animatePanel(){var e;let t=[{maxHeight:`100vh`,maxWidth:`100vw`,opacity:1},{maxHeight:`100vh`,maxWidth:`100vw`,opacity:0},{maxHeight:0,maxWidth:0,opacity:0}];(e=this._animation)==null||e.cancel(),this._animation=this.animate(t,{duration:300,easing:`cubic-bezier(0.65, 0.05, 0.36, 1)`,direction:this.hidden?`normal`:`reverse`,fill:`forwards`})}disconnectedCallback(){super.disconnectedCallback()}collapseSections(){let e=this.querySelectorAll(`bim-panel-section`);for(let t of e)t.collapsed=!0}expandSections(){let e=this.querySelectorAll(`bim-panel-section`);for(let t of e)t.collapsed=!1}render(){return O`
      <div class="parent" role="region" aria-label=${this.label||this.name||k}>
        ${this.label||this.name||this.icon?O`
            <div class="header">
              <div class="title">
                <slot name="header-start"></slot>
                <bim-label .icon=${this.icon}>${this.label||this.name}</bim-label>
              </div>
              <div class="header-end">
                <slot name="header-end"></slot>
              </div>
            </div>`:null}
        <div class="sections">
          <slot></slot>
        </div>
      </div>
    `}};Qo.styles=[Vr.scrollbar,o`
      :host {
        flex: 1;
        /* display: flex; */
        display: block;
        height: 100%;
        background-color: var(--bim-panel--bg, var(--bim-ui_bg-contrast-10));
        overflow: auto;
        border-radius: 0.75rem;
        border: var(--bim-panel--border, 1px solid var(--bim-ui_bg-contrast-20));
        --bim-panel-section--header-display: flex;
        --bim-panel-section--border: none;
        --bim-panel-section--bdrs: 0;
        --bim-panel-section--bg: transparent;
      }

      :host([hidden]) {
        max-height: 0;
        max-width: 0;
        opacity: 0;
      }

      .parent {
        /* display: flex; */
        display: grid;
        grid-template: "header" auto "content" minmax(0, 1fr) / minmax(0, 1fr);
        height: 100%;
        overflow: auto;
        /* flex: 1; */
        /* flex-direction: column; */
        /* pointer-events: auto; */
      }

      .header {
        grid-area: header;
        display: var(--bim-panel--header-display, flex);
        align-items: center;
        justify-content: space-between;
        font-weight: 600;
        box-sizing: border-box;
        height: 35px;
        min-width: 180px;
        padding: 2px 6px;
        gap: 0.375rem;
        flex-shrink: 0;
        border-bottom: 1px solid var(--bim-ui_bg-contrast-20);
      }

      .title {
        display: flex;
        align-items: center;
        column-gap: 0.5rem;
        min-width: 0;
      }

      .title bim-label {
        --bim-label--c: transparent;
        --bim-icon--c: var(--bim-ui_bg-contrast-60);
        --bim-label--fz: var(--bim-panel--fz, var(--bim-ui_size-lg));
        background: linear-gradient(90deg, var(--bim-ui_bg-contrast-100) 0%, var(--bim-ui_bg-contrast-60) 130%);
        -webkit-background-clip: text;
        background-clip: text;
        pointer-events: none;
        min-width: 0;
      }

      .header-end {
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }

      :host([header-hidden]) .header {
        display: none;
      }

      .sections {
        grid-area: content;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: auto;
        flex: 1;
      }

    `];var $o=Qo;Zo([j({type:String,reflect:!0})],$o.prototype,`icon`,2),Zo([j({type:String,reflect:!0})],$o.prototype,`name`,2),Zo([j({type:String,reflect:!0})],$o.prototype,`label`,2),Zo([j({type:Boolean,reflect:!0})],$o.prototype,`hidden`,1),Zo([j({type:Boolean,attribute:`header-hidden`,reflect:!0})],$o.prototype,`headerHidden`,2);var es=Object.defineProperty,ts=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&es(t,n,i),i},ns=class extends A{constructor(){super(...arguments),this.scrollable=!1,this.valueTransform={}}connectedCallback(){super.connectedCallback(),this.fixed===void 0&&(this.fixed=!this.closest(`bim-panel`))}get value(){let e=this.parentElement,t;return e instanceof $o&&(t=e.valueTransform),Object.keys(this.valueTransform).length!==0&&(t=this.valueTransform),Gr(this,t)}onHeaderClick(){this.fixed||(this.collapsed=!this.collapsed)}onHeaderKeydown(e){(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.onHeaderClick())}render(){let e=this.label||this.icon||this.name||this.fixed,t=O`<svg
      xmlns="http://www.w3.org/2000/svg"
      height="1.125rem"
      viewBox="0 0 24 24"
      width="1.125rem"
      class="expand-icon"
      aria-hidden="true"
    >
      <path d="M0 0h24v24H0z" fill="none" />
      <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
    </svg>`,n=O`
      <div
        class="header"
        role="button"
        tabindex=${this.fixed?-1:0}
        aria-expanded=${!this.collapsed}
        title=${this.label||k}
        @click=${this.onHeaderClick}
        @keydown=${this.onHeaderKeydown}
      >
        <div class="title">
          <slot name="header-start"></slot>
          ${this.label||this.icon||this.name?O`<bim-label aria-hidden="true" .icon=${this.icon}>${this.label}</bim-label>`:null}
          <slot name="header-tag"></slot>
        </div>
        <div class="header-end">
          <slot name="header-end"></slot>
          ${this.fixed?null:t}
        </div>
      </div>
    `;return O`
      <div class="parent">
        ${e?n:null}
        <div class="components">
          <slot></slot>
        </div>
      </div>
    `}};ns.styles=[Vr.scrollbar,o`
      :host {
        /* flex: 1; */
        display: block;
        pointer-events: auto;
        background-color: var(--bim-panel-section--bg, var(--bim-ui_bg-contrast-10));
        border: var(--bim-panel-section--border, 1px solid var(--bim-ui_bg-contrast-20));
        border-radius: var(--bim-panel-section--bdrs, 0.75rem);
      }

      :host(:last-child:not([collapsed])) {
        flex: 1;
      }

      :host([scrollable]) {
        height: 100%;
      }

      :host .parent {
        display: grid;
        grid-template: "header" auto "content" minmax(0, 1fr) / minmax(0, 1fr);
        height: 100%;
        overflow: auto;
        /* display: flex; */
        /* flex-direction: column; */
        /* height: 100%; */
      }

      :host(:not([fixed])) .header:hover {
        cursor: pointer;
      }

      :host(:not([fixed])) .header:focus-visible {
        outline: 2px solid var(--bim-ui_accent-base);
        outline-offset: -2px;
      }

      @media (prefers-reduced-motion: reduce) {
        .expand-icon {
          transition: none;
        }
      }

      :host(:not([fixed])) .header:hover .title > bim-label {
        --bim-label--c: transparent;
        background: linear-gradient(90deg, var(--bim-ui_accent-base) 0%, color-mix(in srgb, var(--bim-ui_accent-base) 60%, var(--bim-ui_bg-contrast-60)) 130%);
        -webkit-background-clip: text;
        background-clip: text;
      }

      :host(:not([fixed])) .header:hover .expand-icon {
        fill: var(--bim-ui_accent-base);
      }

      .title > bim-label {
        --bim-label--fz: var(--bim-panel-section--fz, var(--bim-ui_size-lg));
        --bim-label--c: transparent;
        --bim-icon--c: var(--bim-ui_bg-contrast-60);
        background: linear-gradient(90deg, var(--bim-ui_bg-contrast-100) 0%, var(--bim-ui_bg-contrast-60) 130%);
        -webkit-background-clip: text;
        background-clip: text;
        min-width: 0;
      }

      .header {
        grid-area: header;
        display: var(--bim-panel-section--header-display, flex);
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        box-sizing: border-box;
        height: 35px;
        min-width: 180px;
        padding: 2px 6px;
        gap: 0.375rem;
      }

      .expand-icon {
        fill: var(--bim-ui_bg-contrast-80);
        transition: transform 0.2s, fill 0.15s;
      }

      :host([collapsed]) .expand-icon {
        transform: rotateZ(-180deg);
      }

      .title {
        display: flex;
        align-items: center;
        column-gap: 0.5rem;
        min-width: 0;
      }

      .title p {
        font-size: var(--bim-ui_size-sm);
      }

      .header {
        border-bottom: 1px solid var(--bim-ui_bg-contrast-20);
      }

      :host(:last-child[collapsed]) .header {
        border-bottom: none;
      }

      .components {
        grid-area: content;
        display: flex;
        flex-direction: column;
        flex: 1;
        padding: 0.5rem;
        gap: 0.5rem;
        box-sizing: border-box;
        overflow: auto;
      }

      :host(:not([fixed])[collapsed]) .components {
        display: none;
      }

      .header-start,
      .header-end {
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }

      bim-label {
        pointer-events: none;
      }

    `];var rs=ns;ts([j({type:String,reflect:!0})],rs.prototype,`icon`),ts([j({type:String,reflect:!0})],rs.prototype,`label`),ts([j({type:String,reflect:!0})],rs.prototype,`name`),ts([j({type:Boolean,reflect:!0})],rs.prototype,`fixed`),ts([j({type:Boolean,reflect:!0})],rs.prototype,`scrollable`),ts([j({type:Boolean,reflect:!0})],rs.prototype,`collapsed`);var is=Object.defineProperty,as=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&is(t,n,i),i},os=class extends A{constructor(){super(...arguments),this.vertical=!1,this.onValueChange=new Event(`change`),this._canEmitEvents=!1,this._pendingValue=void 0,this._mutationObserver=new MutationObserver(()=>this._syncOptions()),this._options=[],this._value=null,this._onOptionClick=e=>{for(let t of Array.from(this.children))t instanceof fo&&(t.checked=t===e);this._value=e,this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))},this._onKeyDown=e=>{let t=this._options;if(!t.length)return;let n=this._value?t.indexOf(this._value):0,r=n;if(e.key===`ArrowRight`||e.key===`ArrowDown`)e.preventDefault(),r=(n+1)%t.length;else if(e.key===`ArrowLeft`||e.key===`ArrowUp`)e.preventDefault(),r=(n-1+t.length)%t.length;else if(e.key===`Home`)e.preventDefault(),r=0;else if(e.key===`End`)e.preventDefault(),r=t.length-1;else return;this._onOptionClick(t[r]),this.updateComplete.then(()=>{var e;(e=this.renderRoot.querySelectorAll(`.option`)[r])==null||e.focus()})}}set value(e){let t=this._findOption(e);if(!t){this._pendingValue=e;return}this._pendingValue=void 0;for(let e of Array.from(this.children))e instanceof fo&&(e.checked=e===t);this._value=t,this._canEmitEvents&&this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}get value(){return this._value?.value}connectedCallback(){super.connectedCallback(),this._mutationObserver.observe(this,{childList:!0}),customElements.whenDefined(`bim-option`).then(()=>this._syncOptions())}disconnectedCallback(){super.disconnectedCallback(),this._mutationObserver.disconnect()}firstUpdated(){let e=Array.from(this.children).find(e=>e instanceof fo&&e.checked);e&&(this._value=e),this._canEmitEvents=!0}_syncOptions(){this._options=Array.from(this.children).filter(e=>e.tagName===`BIM-OPTION`),this._pendingValue!==void 0&&(this.value=this._pendingValue)}_findOption(e){for(let t of Array.from(this.children))if(t instanceof fo&&(t.label===e||t.value===e))return t}render(){return O`
      <div class="parent">
        ${this.label||this.icon?O`<bim-label class="field-label" .icon=${this.icon}>${this.label}</bim-label>`:null}
        <div class="wrapper">
          <div
            class="options"
            role="tablist"
            aria-label=${ut(this.label)}
            @keydown=${this._onKeyDown}
          >
            ${this._options.map(e=>{let t=e===this._value;return O`
                <div
                  class="option ${t?`checked`:``}"
                  role="tab"
                  aria-selected=${t}
                  tabindex=${t?0:-1}
                  @click=${()=>this._onOptionClick(e)}
                >
                  <bim-label
                    .icon=${e.icon}
                    .img=${e.img}
                    .vertical=${e.vertical}
                  >${e.label}</bim-label>
                </div>
              `})}
          </div>
        </div>
      </div>
    `}};os.styles=o`
    :host {
      display: block;
    }

    .parent {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      user-select: none;
      flex: 1;
      align-items: normal;
    }

    :host(:not([vertical])) .parent {
      justify-content: space-between;
    }

    :host([vertical]) .parent {
      flex-direction: column;
    }

    bim-label.field-label {
      margin-top: var(--bim-input--label-mt, 0);
    }

    .wrapper {
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      min-height: 25px;
      min-width: 3rem;
      background-color: var(--bim-input--bgc, var(--bim-ui_bg-contrast-20));
      border-radius: var(--bim-input--bdrs, var(--bim-ui_size-2xs));
    }

    :host(:not([vertical])) .wrapper {
      flex: 1;
    }

    :host(:not([vertical])[label]) .wrapper {
      max-width: var(--bim-input--maxw, fit-content);
    }

    .options {
      display: flex;
      flex: 1;
      align-self: stretch;
    }

    .option {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 0 0.5rem;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.15s;
      --bim-label--c: var(--bim-ui_bg-contrast-80);
    }

    .option:not(.checked):hover {
      background-color: var(--bim-selector--option-hover-bgc, var(--bim-ui_bg-contrast-30));
    }

    .option.checked {
      background-color: var(--bim-selector--option-checked-bgc, var(--bim-ui_bg-contrast-40));
      --bim-label--c: var(--bim-ui_bg-contrast-100);
    }

    .option:focus-visible {
      outline: 2px solid var(--bim-ui_main-base);
      outline-offset: -2px;
    }

    /* ── Underline variant ── */

    :host([variant="underline"]) {
      --bim-input--bgc: transparent;
      --bim-input--bdrs: 0;
    }

    :host([variant="underline"]) .option {
      border-radius: 0;
      --bim-label--c: var(--bim-ui_bg-contrast-80);
      border-bottom: 2px solid transparent;
      transition: border-color 0.15s;
    }

    :host([variant="underline"]) .option.checked {
      background-color: transparent;
      --bim-label--c: var(--bim-ui_accent-base);
      border-bottom-color: var(--bim-ui_accent-base);
    }

    :host([variant="underline"]) .option:not(.checked):hover {
      background-color: transparent;
      --bim-label--c: var(--bim-ui_bg-contrast-80);
    }

    :host([variant="underline"]) .option:focus-visible {
      outline-offset: -3px;
    }

    @media (prefers-reduced-motion: reduce) {
      .option,
      :host([variant="underline"]) .option {
        transition: none;
      }
    }
  `;var ss=os;as([j({type:String,reflect:!0})],ss.prototype,`name`),as([j({type:String,reflect:!0})],ss.prototype,`icon`),as([j({type:String,reflect:!0})],ss.prototype,`label`),as([j({type:Boolean,reflect:!0})],ss.prototype,`vertical`),as([j({type:String,reflect:!0})],ss.prototype,`variant`),as([M()],ss.prototype,`_options`),as([M()],ss.prototype,`_value`);function cs(e,t,n){return t.length===0||e.length===0?e:ls(Ns.flattenData(e),t,n)}function ls(e,t,n){if(t.length===0)return e;let[r,...i]=t,a=n?.[r];return a?us(e,r,a,i,n):fs(e,r,i,n)}function us(e,t,n,r,i){let a=new Map;for(let r of e){let e=r.data[t];if(e===void 0)continue;let i=n(e,r.data),o=i.join(`|`);a.has(o)||a.set(o,{path:i,rows:[]}),a.get(o).rows.push(r)}return ds(a,t,r,i)}function ds(e,t,n,r){let i=new ps;for(let{path:n,rows:r}of e.values())i.addPath(n,r,t);return i.buildResult(n,r)}function fs(e,t,n,r){let i=new Map;for(let n of e){let e=n.data[t];i.has(e)||i.set(e,[]),i.get(e).push(n)}let a=[];for(let[e,o]of i){let i=n.length>0?ls(o,n,r):o;a.push({data:{[t]:e},children:i,_isComputedGroup:!0})}return a}var ps=class{constructor(){this.tree=new Map}addPath(e,t,n){let r=this.tree;for(let i=0;i<e.length;i++){let a=e[i];r.has(a)||r.set(a,{value:a,column:n,children:new Map,rows:[]});let o=r.get(a);i===e.length-1&&o.rows.push(...t),r=o.children}}buildResult(e,t){return this.convertMapToResult(this.tree,e,t)}convertMapToResult(e,t,n){let r=[];for(let i of e.values()){let e=[];if(i.children.size>0&&e.push(...this.convertMapToResult(i.children,t,n)),i.rows.length>0){let r=t.length>0?ls(i.rows,t,n):i.rows;e.push(...r)}r.push({data:{[i.column]:i.value},children:e,_isComputedGroup:!0})}return r}},ms=()=>O`
    <style>
      div {
        display: flex;
        gap: 0.375rem;
        border-radius: 0.25rem;
        min-height: 1.25rem;
      }

      [data-type="row"] {
        background-color: var(--bim-ui_bg-contrast-20);
        animation: row-loading 1s linear infinite alternate;
        padding: 0.5rem;
      }

      [data-type="cell"] {
        background-color: var(--bim-ui_bg-contrast-40);
        flex: 0.25;
      }

      @keyframes row-loading {
        0% {
          background-color: var(--bim-ui_bg-contrast-20);
        }
        100% {
          background-color: var(--bim-ui_bg-contrast-40);
        }
      }
    </style>
    <div style="display: flex; flex-direction: column;">
      <div data-type="row" style="gap: 2rem">
        <div data-type="cell" style="flex: 1"></div>
        <div data-type="cell" style="flex: 2"></div>
        <div data-type="cell" style="flex: 1"></div>
        <div data-type="cell" style="flex: 0.5"></div>
      </div>
      <div style="display: flex;">
        <div data-type="row" style="flex: 1">
          <div data-type="cell" style="flex: 0.5"></div>
        </div>
        <div data-type="row" style="flex: 2">
          <div data-type="cell" style="flex: 0.75"></div>
        </div>
        <div data-type="row" style="flex: 1">
          <div data-type="cell"></div>
        </div>
        <div data-type="row" style="flex: 0.5">
          <div data-type="cell" style="flex: 0.75"></div>
        </div>
      </div>
      <div style="display: flex;">
        <div data-type="row" style="flex: 1">
          <div data-type="cell" style="flex: 0.75"></div>
        </div>
        <div data-type="row" style="flex: 2">
          <div data-type="cell"></div>
        </div>
        <div data-type="row" style="flex: 1">
          <div data-type="cell" style="flex: 0.5"></div>
        </div>
        <div data-type="row" style="flex: 0.5">
          <div data-type="cell" style="flex: 0.5"></div>
        </div>
      </div>
      <div style="display: flex;">
        <div data-type="row" style="flex: 1">
          <div data-type="cell"></div>
        </div>
        <div data-type="row" style="flex: 2">
          <div data-type="cell" style="flex: 0.5"></div>
        </div>
        <div data-type="row" style="flex: 1">
          <div data-type="cell" style="flex: 0.75"></div>
        </div>
        <div data-type="row" style="flex: 0.5">
          <div data-type="cell" style="flex: 0.7s5"></div>
        </div>
      </div>
    </div>
  `,hs=()=>O`
    <style>
      .loader {
        grid-area: Processing;
        position: relative;
        padding: 0.125rem;
      }
      .loader:before {
        content: "";
        position: absolute;
      }
      .loader .loaderBar {
        position: absolute;
        top: 0;
        right: 100%;
        bottom: 0;
        left: 0;
        background: var(--bim-ui_main-base);
        /* width: 25%; */
        width: 0;
        animation: borealisBar 2s linear infinite;
      }

      @keyframes borealisBar {
        0% {
          left: 0%;
          right: 100%;
          width: 0%;
        }
        10% {
          left: 0%;
          right: 75%;
          width: 25%;
        }
        90% {
          right: 0%;
          left: 75%;
          width: 25%;
        }
        100% {
          left: 100%;
          right: 0%;
          width: 0%;
        }
      }
    </style>
    <div class="loader">
      <div class="loaderBar"></div>
    </div>
  `,gs=Object.defineProperty,_s=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&gs(t,n,i),i},vs=class extends A{constructor(){super(...arguments),this.column=``,this.columnIndex=0,this.table=null,this.group=null,this.row=null,this.rowData={}}get data(){return this.column?this.rowData[this.column]:null}get dataTransform(){let e=this.row?.dataTransform?.[this.column],t=this.table?.dataTransform[this.column],n=this.table?.defaultContentTemplate;return e||t||n}get headersTransform(){return this.table?.headersTransform[this.column]}_renderValue(e){return typeof e==`string`||typeof e==`boolean`||typeof e==`number`?O`<bim-label>${e}</bim-label>`:e}get templateValue(){var e;let{data:t,rowData:n,group:r}=this;if((e=this.row)!=null&&e.isHeader){let e=this.headersTransform;return e&&t!=null?this._renderValue(e(this.column)):t==null?k:O`<bim-label>${t}</bim-label>`}let i=this.dataTransform;return i&&t!=null&&r?this._renderValue(i(t,n,r)):t==null?k:O`<bim-label>${t}</bim-label>`}connectedCallback(){var e,t;super.connectedCallback(),(e=this.group)!=null&&e.data._isComputedGroup&&(t=this.table)!=null&&t.groupedBy.includes(this.column)?(this.style.gridColumn=`1`,this.style.gridRow=`1`):this.style.gridArea=this.column.toString()}render(){return O`${this.templateValue}`}};vs.styles=o`
    :host {
      --bim-label--c: var(--bim-ui_bg-contrast-100);
      padding: var(--bim-table-cell--padding, 4px);
      display: flex;
      align-items: center;
      overflow: hidden;
    }
    
    :host([data-cell-header]) {
      --bim-label--c: var(--bim-ui_bg-contrast-80);
    }

    :host([data-column-index="0"]) {
      justify-content: normal;
    }

    :host([data-column-index="0"]:not([data-cell-header]))
      ::slotted(bim-label) {
      text-align: left;
    }

    ::slotted(*) {
      --bim-input--bgc: transparent;
      --bim-input--olc: var(--bim-ui_bg-contrast-20);
      --bim-input--olw: 1px;
    }

    ::slotted(bim-input) {
      --bim-input--olw: 0;
    }
  `;var ys=vs;_s([j({type:String,reflect:!0})],ys.prototype,`column`);var bs=class e extends A{constructor(){super(...arguments),this._groupCache=new WeakMap,this.group=this.closest(`bim-table-group`),this._data=[],this.table=this.closest(`bim-table`)}static _dataId(t){let n=e._dataIds.get(t);return n===void 0&&(n=e._nextDataId++,e._dataIds.set(t,n)),n}get data(){return this.group?.data.children??this._data}set data(e){this._data=e}render(){return O`
      <slot></slot>
      ${ft(this.data,t=>e._dataId(t),e=>{let t=this._groupCache.get(e);return t||(t=document.createElement(`bim-table-group`),t.table=this.table,t.data=e,t.depth=(this.group?.depth??-1)+1,this._groupCache.set(e,t)),t})}
    `}};bs.styles=o`
    :host {
      --bim-button--bgc: transparent;
      position: relative;
      display: block;
      overflow: hidden;
      grid-area: Children;
    }

    :host([hidden]) {
      height: 0;
      opacity: 0;
    }

    ::slotted(.branch.branch-vertical) {
      top: 0;
      bottom: 1.125rem;
    }
  `,bs._dataIds=new WeakMap,bs._nextDataId=0;var xs=bs,Ss=Object.defineProperty,Cs=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&Ss(t,n,i),i},ws=class extends A{constructor(){super(...arguments),this.childrenHidden=!0,this.table=null,this.depth=0,this.data={data:{}}}get rowElement(){let e=this.shadowRoot;return e?e.querySelector(`bim-table-row`):null}get childrenElement(){let e=this.shadowRoot;return e?e.querySelector(`bim-table-children`):null}get _isChildrenEmpty(){return!(this.data.children&&this.data.children.length!==0)}connectedCallback(){if(super.connectedCallback(),!this.table){this.childrenHidden=!0;return}let{expandedLevels:e}=this.table;this.childrenHidden=typeof e==`number`?this.depth>=e:!this.table.expanded}disconnectedCallback(){super.disconnectedCallback(),this.data={data:{}}}toggleChildren(e){this.childrenHidden=typeof e>`u`?!this.childrenHidden:!e,this.animateTableChildren(!0)}animateTableChildren(e=!0){if(!e){requestAnimationFrame(()=>{let e=this.renderRoot.querySelector(`.caret`),t=this.renderRoot.querySelector(`.branch-vertical`),n=this.renderRoot.querySelector(`bim-table-children`)?.querySelector(`.branch-vertical`);e.style.setProperty(`transform`,`translateY(-50%) rotate(${this.childrenHidden?`0`:`90`}deg)`),t.style.setProperty(`transform`,`scaleY(${this.childrenHidden?`0`:`1`})`),n?.style.setProperty(`transform`,`scaleY(${this.childrenHidden?`0`:`1`})`)});return}requestAnimationFrame(()=>{let e=this.renderRoot.querySelector(`bim-table-children`),t=this.renderRoot.querySelector(`.caret`),n=this.renderRoot.querySelector(`.branch-vertical`),r=this.renderRoot.querySelector(`bim-table-children`)?.querySelector(`.branch-vertical`);((e?.renderRoot)?.querySelectorAll(`bim-table-group`))?.forEach((e,t)=>{e.style.setProperty(`opacity`,`0`),e.style.setProperty(`left`,`-30px`),e.animate([{opacity:`0`,left:`-30px`},{opacity:`1`,left:`0`}],{duration:250,delay:50+t*0,easing:`cubic-bezier(0.65, 0.05, 0.36, 1)`,fill:`forwards`})}),t?.animate([{transform:`translateY(-50%) rotate(90deg)`},{transform:`translateY(-50%) rotate(0deg)`}],{duration:350,easing:`cubic-bezier(0.68, -0.55, 0.27, 1.55)`,fill:`forwards`,direction:this.childrenHidden?`normal`:`reverse`}),n?.animate([{transform:`scaleY(1)`},{transform:`scaleY(0)`}],{duration:200,easing:`cubic-bezier(0.4, 0, 0.2, 1)`,delay:0,fill:`forwards`,direction:this.childrenHidden?`normal`:`reverse`}),(()=>{let e=this.renderRoot.querySelector(`bim-table-row`)?.querySelector(`.branch-horizontal`);e&&(e.style.setProperty(`transform-origin`,`center right`),e.animate([{transform:`scaleX(0)`},{transform:`scaleX(1)`}],{duration:200,easing:`cubic-bezier(0.4, 0, 0.2, 1)`,fill:`forwards`,direction:this.childrenHidden?`normal`:`reverse`}))})(),r?.animate([{transform:`scaleY(0)`},{transform:`scaleY(1)`}],{duration:240,easing:`cubic-bezier(0.4, 0, 0.2, 1)`,fill:`forwards`,delay:140})})}firstUpdated(){this.renderRoot.querySelectorAll(`.caret`).forEach(e=>{if(!this.childrenHidden){e.style.setProperty(`transform`,`translateY(-50%) rotate(90deg)`);let t=e.parentElement?.querySelector(`.branch-horizontal`);t&&t.style.setProperty(`transform`,`scaleX(0)`),((e.parentElement?.parentElement)?.querySelectorAll(`.branch-vertical`))?.forEach(e=>{e.style.setProperty(`transform`,`scaleY(1)`)})}})}render(){var e;if(!this.table)return O`${k}`;let t=this.table.getGroupIndentation(this.data)??0,n;this.table.noIndentation||(n=O`<div style=${gt({left:`calc(${t-1} * var(--bim-table--indent-step, 1rem) + ${this.table.selectableRows?2.05:.5625}rem)`})} class="branch branch-horizontal"></div>`);let r=O`
      ${this.table.noIndentation?null:O`
            <style>
              .branch-vertical {
                left: calc(${t} * var(--bim-table--indent-step, 1rem) + ${this.table.selectableRows?1.9375:.5625}rem);
              }
            </style>
            <div class="branch branch-vertical"></div>
          `}
    `,i;if(!this.table.noIndentation){let e=document.createElementNS(`http://www.w3.org/2000/svg`,`svg`);if(e.setAttribute(`height`,`9.9`),e.setAttribute(`width`,`7.5`),e.setAttribute(`viewBox`,`0 0 4.6666672 7.7`),this.table.noCarets){let t=document.createElementNS(`http://www.w3.org/2000/svg`,`circle`);t.setAttribute(`cx`,`2.3333336`),t.setAttribute(`cy`,`3.85`),t.setAttribute(`r`,`2.5`),e.append(t)}else{let t=document.createElementNS(`http://www.w3.org/2000/svg`,`path`);t.setAttribute(`d`,`m 1.7470835,6.9583848 2.5899999,-2.59 c 0.39,-0.39 0.39,-1.02 0,-1.41 L 1.7470835,0.36838483 c -0.63,-0.62000003 -1.71000005,-0.18 -1.71000005,0.70999997 v 5.17 c 0,0.9 1.08000005,1.34 1.71000005,0.71 z`),e.append(t)}i=O`<div @click=${e=>{var t;(t=this.table)!=null&&t.noCarets||(e.stopPropagation(),this.toggleChildren())}} style=${gt({left:`calc(${t} * var(--bim-table--indent-step, 1rem) + ${this.table.selectableRows?1.5:.125}rem)`,cursor:`${this.table.noCarets?`unset`:`pointer`}`})} class="caret">${e}</div>`}let a=this.data.children?.some(e=>e._isComputedGroup)??!1,o=!this._isChildrenEmpty&&(!((e=this.table)!=null&&e.groupsOnly)||a),s;return o&&!this.childrenHidden&&(s=O`
        <bim-table-children ${lt(e=>{if(!e)return;let t=e;t.table=this.table,t.group=this})}>${r}</bim-table-children>
      `),O`
      <div class="parent">
        <bim-table-row ${lt(e=>{var t;if(!e)return;let n=e;n.table=this.table,n.group=this,(t=this.table)==null||t.dispatchEvent(new CustomEvent(`rowcreated`,{detail:{row:n}}))})}>
          ${_t(o,()=>r)}
          ${_t(t!==0,()=>n)}
          ${_t(!this.table.noIndentation&&o,()=>i)}
        </bim-table-row>
        ${s}
      </div>
    `}};ws.styles=o`
    :host {
      position: relative;
    }

    .parent {
      display: grid;
      grid-template-areas: "Data" "Children";
    }

    .branch {
      position: absolute;
      z-index: 1;
    }

    .branch-vertical {
      border-left: 1px dotted var(--bim-ui_bg-contrast-40);
      transform-origin: top center;
      transform: scaleY(0);
    }

    .branch-horizontal {
      top: 50%;
      width: 1rem;
      border-bottom: 1px dotted var(--bim-ui_bg-contrast-40);
    }

    .branch-horizontal {
      transform-origin: center left;
    }

    .caret {
      position: absolute;
      z-index: 2;
      transform: translateY(-50%) rotate(0deg);
      top: 50%;
      display: flex;
      width: 0.95rem;
      height: 0.95rem;
      justify-content: center;
      align-items: center;
    }

    .caret svg {
      fill: var(--bim-ui_bg-contrast-60);
    }
  `;var Ts=ws;Cs([j({type:Boolean,attribute:`children-hidden`,reflect:!0})],Ts.prototype,`childrenHidden`);var Es=Object.defineProperty,Ds=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&Es(t,n,i),i},Os=class extends A{constructor(){super(...arguments),this.selected=!1,this.group=null,this._data={},this.isHeader=!1,this.table=null,this.onTableColumnsChange=()=>{this.table&&this.requestUpdate()},this._intersecting=!1,this._timeOutDelay=250,this._observer=new IntersectionObserver(e=>{window.clearTimeout(this._intersectTimeout),this._intersectTimeout=void 0,e[0].isIntersecting?this._intersectTimeout=window.setTimeout(()=>{this._intersecting=!0},this._timeOutDelay):this._intersecting=!1},{rootMargin:`36px`}),this._isRangeClick=!1,this._onCheckboxClick=e=>{e.stopPropagation();let t=this.table?.rangeSelectKey??`ctrlKey`;this._isRangeClick=e[t]},this._headerCheckboxUpdatePending=!1,this._onDataSelected=()=>{if(this.isHeader){this._updateHeaderCheckbox();return}this.toggleAttribute(`selected`,this.table?.selection.has(this.data))},this._onDataDeselected=()=>{var e;if(this.isHeader){this._updateHeaderCheckbox();return}(e=this.table)!=null&&e.selection.has(this.data)||this.removeAttribute(`selected`)},this._onDataSelectionCleared=()=>{if(this.isHeader){this._updateHeaderCheckbox();return}this.removeAttribute(`selected`)},this.dataTransform=null,this._interval=null,this.clearDataTransform=()=>{this.dataTransform=null,this._interval!==null&&(clearInterval(this._interval),this._interval=null)}}get columns(){return this.table?.columns??[]}get hiddenColumns(){return this.table?.hiddenColumns??[]}get groupData(){return this.group?.data}get data(){return this.group?.data.data??this._data}set data(e){this._data=e}get _isSelected(){return this.table?.selection.has(this.data)}onSelectionChange(e){if(!this.table)return;let t=e.target;if(this.isHeader||(this.selected=t.value),t.value){if(!this.isHeader&&this._isRangeClick&&this.table._lastSelectedData){let e=Ns.flattenData(this.table.value).map(e=>e.data),t=e.indexOf(this.table._lastSelectedData),n=e.indexOf(this.data);if(t!==-1&&n!==-1){let[r,i]=t<n?[t,n]:[n,t];this.table.selection.add(...e.slice(r,i+1))}}else{let e=[this.data];this.isHeader&&(e=Ns.flattenData(this.table.value).map(e=>e.data)),this.table.selection.add(...e),this.isHeader&&this.table.dispatchEvent(new CustomEvent(`rowselected`,{detail:{data:this.data}})),this.isHeader||(this.table._lastSelectedData=this.data)}}else this.isHeader?this.table.selection.clear():(this.table.selection.delete(this.data),this.table.dispatchEvent(new CustomEvent(`rowdeselected`,{detail:{data:this.data}})));this._isRangeClick=!1}firstUpdated(e){super.firstUpdated(e),queueMicrotask(()=>{if(!this.isConnected)return;let e=this.getBoundingClientRect();e.top<window.innerHeight&&e.bottom>0&&(this._intersecting=!0),this._observer.observe(this)})}_updateHeaderCheckbox(){this._headerCheckboxUpdatePending||(this._headerCheckboxUpdatePending=!0,requestAnimationFrame(()=>{this._headerCheckboxUpdatePending=!1;let e=this.renderRoot.querySelector(`bim-checkbox`);if(!e||!this.table)return;let t=Ns.flattenData(this.table.value).map(e=>e.data),n=t.filter(e=>this.table.selection.has(e)).length;e.checked=n>0&&n===t.length,e.indeterminate=n>0&&!e.checked}))}connectedCallback(){super.connectedCallback(),this.table&&(this.table.addEventListener(`dataselected`,this._onDataSelected),this.table.addEventListener(`datadeselected`,this._onDataDeselected),this.table.addEventListener(`dataselectioncleared`,this._onDataSelectionCleared),this.toggleAttribute(`selected`,this._isSelected),this.table.addEventListener(`columnschange`,this.onTableColumnsChange))}disconnectedCallback(){var e,t,n;super.disconnectedCallback(),this._observer.unobserve(this),(e=this.table)==null||e.removeEventListener(`dataselected`,this._onDataSelected),(t=this.table)==null||t.removeEventListener(`datadeselected`,this._onDataDeselected),(n=this.table)==null||n.removeEventListener(`dataselectioncleared`,this._onDataSelectionCleared),this.data={},this.table=null}applyAdaptativeDataTransform(e){this.addEventListener(`pointerenter`,()=>{this.dataTransform=e,this._interval=window.setInterval(()=>{this.matches(`:hover`)||this.clearDataTransform()},50)})}render(){var e,t,n;if(!(this.table&&this._intersecting))return O`${k}`;let r=this.columns.filter(e=>!this.hiddenColumns.includes(e.name)),i=r.map(e=>e.name),a=r.map(e=>e.width);this.style.gridTemplateAreas=`"${this.table.selectableRows?`Selection`:``} ${i.join(` `)}"`,this.style.gridTemplateColumns=`${this.table.selectableRows?`1.6rem`:``} ${a.join(` `)}`;let o=!1,s=!1;if(this.isHeader&&this.table.selectableRows){let e=Ns.flattenData(this.table.value).map(e=>e.data),t=e.filter(e=>this.table.selection.has(e)).length;o=t>0&&t===e.length,s=t>0&&!o}let c=this.table.getRowIndentation(this.data)??0,l=[],u=this.data;if((e=this.groupData)!=null&&e._isComputedGroup){let e=this.table.dataKeys.filter(e=>{var t;return!((t=this.table)!=null&&t.hiddenColumns.includes(e))});for(let t of e)i.indexOf(t)!==0&&(u[t]=``)}for(let e in u){if(!((t=this.groupData)!=null&&t._isComputedGroup)&&this.hiddenColumns.includes(e))continue;let r=document.createElement(`bim-table-cell`);r.group=this.group,r.table=this.table,r.row=this,r.column=e;let a=(n=this.group)!=null&&n.data._isComputedGroup&&this.table.groupedBy.includes(e)?0:i.indexOf(e);a===0&&(r.style.marginLeft=this.table.noIndentation?`0`:`calc(${c} * var(--bim-table--indent-step, 1rem) + 0.9375rem)`),r.setAttribute(`data-column-index`,String(a)),r.toggleAttribute(`data-no-indentation`,a===0&&this.table.noIndentation),r.toggleAttribute(`data-cell-header`,this.isHeader),r.rowData=this.data,this.table.dispatchEvent(new CustomEvent(`cellcreated`,{detail:{cell:r}})),l.push(r)}return this._timeOutDelay=0,O`
      ${this.table.selectableRows?O`<bim-checkbox
            @click=${this._onCheckboxClick}
            @change=${this.onSelectionChange}
            .checked=${this.isHeader?o:this._isSelected??!1}
            .indeterminate=${s}
            .disabled=${this.table.rowsSelectionDisabled}
            style="align-self: center; justify-self: center"
          ></bim-checkbox>`:null}
      ${l}
      <slot></slot>
    `}};Os.styles=o`
    :host {
      position: relative;
      grid-area: Data;
      display: grid;
      min-height: var(--bim-table-row--min-h, 30px);
      transition: all 0.15s;
      gap: var(--bim-table-row--gap, 4px);
      /* Off by default; consumers opt into row dividers by setting the
         bim-table-row--border-bottom token on the bim-table host
         (e.g. 1px solid #2d2d33). */
      border-bottom: var(--bim-table-row--border-bottom, none);
    }

    ::slotted(.branch.branch-vertical) {
      top: 50%;
      bottom: 0;
    }

    :host([selected]) {
      background-color: color-mix(in lab, var(--bim-ui_bg-contrast-20) 30%, var(--bim-ui_bg-contrast-70) 10%);
    }

    :host([is-header]) {
      min-height: auto;
      height: var(--bim-ui_size-10xl);
      border-bottom: 1px solid var(--bim-ui_bg-contrast-20);
    }
  `;var ks=Os;Ds([j({type:Boolean,reflect:!0})],ks.prototype,`selected`),Ds([j({type:Boolean,attribute:`is-header`,reflect:!0})],ks.prototype,`isHeader`),Ds([M()],ks.prototype,`_intersecting`),Ds([M()],ks.prototype,`dataTransform`);var As=Object.defineProperty,js=Object.getOwnPropertyDescriptor,P=(e,t,n,r)=>{for(var i=r>1?void 0:r?js(t,n):t,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=(r?o(t,n,i):o(i))||i);return r&&i&&As(t,n,i),i},Ms,F=(Ms=class extends A{constructor(){super(),this._value=[],this.headersHidden=!1,this.minColWidth=`4rem`,this._columns=[],this._textDelimiters={comma:`,`,tab:`	`},this._queryString=null,this._data=[],this.expanded=!1,this.preserveStructureOnFilter=!1,this.indentationInText=!1,this.dataTransform={},this.headersTransform={},this.groupingTransform={},this.selectableRows=!1,this.selection=new Qr,this.rowsSelectionDisabled=!1,this.noIndentation=!1,this.noCarets=!1,this.groupsOnly=!1,this.loading=!1,this._groupedBy=[],this._lastSelectedData=null,this.rangeSelectKey=`ctrlKey`,this._errorLoading=!1,this._defaultVisibility=!0,this._visibilityExceptions=[],this.defaultContentTemplate=e=>O`<bim-label style="white-space: normal; user-select: text;"
      >${e}</bim-label
    >`,this._stringFilterFunction=(e,t)=>Object.values(t.data).some(t=>String(t).toLowerCase().includes(e.toLowerCase())),this._queryFilterFunction=(e,t)=>{let n=!1,r=Yr(e)??[];for(let e of r){if(`queries`in e){n=!1;break}let{condition:r,value:i}=e,{key:a}=e;if(a.startsWith(`[`)&&a.endsWith(`]`)){let e=a.replace(`[`,``).replace(`]`,``);a=e,n=Object.keys(t.data).filter(t=>t.includes(e)).map(e=>Xr(t.data[e],r,i)).some(e=>e)}else n=Xr(t.data[a],r,i);if(!n)break}return n},this.selection.deleteGuard=()=>!this.rowsSelectionDisabled,this.selection.onItemAdded.add(e=>this.emitDataSelected({data:e})),this.selection.onItemDeleted.add(e=>this.emitDataDeselected({data:e})),this.selection.onCleared.add(()=>{this.emitDataCleared(),this._lastSelectedData=null})}static flattenData(e){let t=[];for(let n of e)t.push({data:n.data}),n.children&&n.children.length>0&&t.push(...Ms.flattenData(n.children));return t}set columns(e){let t=[];for(let n of e){let e=typeof n==`string`?{name:n,width:`minmax(${this.minColWidth}, 1fr)`}:n;t.push(e)}this._columns=t,this.computeMissingColumns(this.data),this.dispatchEvent(new Event(`columnschange`))}get columns(){return this._columns}get _headerRowData(){let e={};for(let t of this.columns){let{name:n}=t;e[n]=String(n)}return e}get value(){return this._value}set queryString(e){this.toggleAttribute(`data-processing`,!0),this._queryString=e&&e.trim()!==``?e.trim():null,this.updateValue(),this.toggleAttribute(`data-processing`,!1)}get queryString(){return this._queryString}set data(e){this._data=e,this.updateValue(),this.computeMissingColumns(e)&&(this.columns=this._columns)}get data(){return this._data}get dataAsync(){return new Promise(e=>{setTimeout(()=>{e(this.data)})})}set groupedBy(e){this._groupedBy=e,this.updateValue()}get groupedBy(){return this._groupedBy}get body(){return this._bodyScroll??null}set defaultVisibility(e){this._defaultVisibility=e}get defaultVisibility(){return this._defaultVisibility}set visibilityExceptions(e){this._visibilityExceptions=e}get visibilityExceptions(){return this._visibilityExceptions}set hiddenColumns(e){this.defaultVisibility=!0,this.visibilityExceptions=e}get hiddenColumns(){let e=this.dataKeys,t=[];for(let n of e){let e=this._visibilityExceptions.includes(n);(this._defaultVisibility?e:!e)&&t.push(n)}return t}set visibleColumns(e){this.defaultVisibility=!1,this.visibilityExceptions=e}get visibleColumns(){let e=this.dataKeys,t=[];for(let n of e){let e=this._visibilityExceptions.includes(n);(this._defaultVisibility?!e:e)&&t.push(n)}return t}emitDataSelected(e){this.dispatchEvent(new CustomEvent(`dataselected`,{detail:e}))}emitDataDeselected(e){this.dispatchEvent(new CustomEvent(`datadeselected`,{detail:e}))}emitDataCleared(){this.dispatchEvent(new Event(`dataselectioncleared`))}filterData(e=this.data){let t=[];if(this.queryString){let n=this.filterFunction;n||=Yr(this.queryString)?this._queryFilterFunction:this._stringFilterFunction,t=this.filter(this.queryString,n,e),this.preserveStructureOnFilter&&(this._expandedBeforeFilter===void 0&&(this._expandedBeforeFilter=this.expanded),this.expanded=!0)}else this.preserveStructureOnFilter&&this._expandedBeforeFilter!==void 0&&(this.expanded=this._expandedBeforeFilter,this._expandedBeforeFilter=void 0),t=e;return t}computeMissingColumns(e){let t=!1;for(let n of e){let{children:e,data:r}=n;for(let e in r)this._columns.map(e=>typeof e==`string`?e:e.name).includes(e)||(this._columns.push({name:e,width:`minmax(${this.minColWidth}, 1fr)`}),t=!0);if(e){let n=this.computeMissingColumns(e);n&&!t&&(t=n)}}return t}generateText(e=`comma`,t=this.value,n=``,r=!0){let i=this._textDelimiters[e],a=``,o=this.columns.map(e=>e.name);if(r){this.indentationInText&&(a+=`Indentation${i}`);let e=`${o.join(i)}
`;a+=e}for(let[r,s]of t.entries()){let{data:t,children:c}=s,l=`${this.indentationInText?`${n}${r+1}${i}`:``}${o.map(e=>t[e]??``).join(i)}
`;a+=l,c&&(a+=this.generateText(e,s.children,`${n}${r+1}.`,!1))}return a}get csv(){return this.generateText(`comma`)}get tsv(){return this.generateText(`tab`)}get dataKeys(){let e=new Set,t=n=>{for(let r of n){for(let t in r.data)e.add(t);r.children&&t(r.children)}};return t(this.data),Array.from(e)}applyDataTransform(e){let t={};if(!e)return t;let{data:n}=e.data;for(let e of Object.keys(this.dataTransform)){let t=this.columns.find(t=>t.name===e);t&&t.forceDataTransform&&(e in n||(n[e]=``))}let r=n;for(let i in r){let a=this.dataTransform[i];t[i]=a?a(r[i],n,e):n[i]}return t}downloadData(e=`BIM Table Data`,t=`json`){let n=null;if(t===`json`&&(n=new File([JSON.stringify(this.value,void 0,2)],`${e}.json`)),t===`csv`&&(n=new File([this.csv],`${e}.csv`)),t===`tsv`&&(n=new File([this.tsv],`${e}.tsv`)),!n)return;let r=document.createElement(`a`);r.href=URL.createObjectURL(n),r.download=n.name,r.click(),URL.revokeObjectURL(r.href)}getRowIndentation(e,t=this.value,n=0){for(let r of t){if(r.data===e)return n;if(r.children){let t=this.getRowIndentation(e,r.children,n+1);if(t!==null)return t}}return null}getGroupIndentation(e,t=this.value,n=0){for(let r of t){if(r===e)return n;if(r.children){let t=this.getGroupIndentation(e,r.children,n+1);if(t!==null)return t}}return null}connectedCallback(){super.connectedCallback(),this.dispatchEvent(new Event(`connected`))}disconnectedCallback(){super.disconnectedCallback(),this.dispatchEvent(new Event(`disconnected`))}async loadData(e=!1){if(this._value.length!==0&&!e||!this.loadFunction)return!1;let t=this._value.length>0,n=this._bodyScroll?.scrollTop??0;t||(this.loading=!0);try{let e=await this.loadFunction();return this.data=e,this.loading=!1,this._errorLoading=!1,t&&n>0&&(await this.updateComplete,requestAnimationFrame(()=>{this._bodyScroll.scrollTop=n})),!0}catch(e){if(this.loading=!1,this._value.length!==0)return!1;let t=this.querySelector(`[slot='error-loading']`)?.querySelector(`[data-table-element='error-message']`);return e instanceof Error&&t&&e.message.trim()!==``&&(t.textContent=e.message),this._errorLoading=!0,!1}}groupData(e=this.data){return cs(e,this.groupedBy,this.groupingTransform)}updateValue(){let e=this.filterData(),t=this.groupData(e);this._value=t}filter(e,t=this.filterFunction??this._stringFilterFunction,n=this.data){let r=[];for(let i of n)if(t(e,i)){if(this.preserveStructureOnFilter){let n={data:i.data};if(i.children){let r=this.filter(e,t,i.children);r.length&&(n.children=r)}r.push(n)}else if(r.push({data:i.data}),i.children){let n=this.filter(e,t,i.children);r.push(...n)}}else if(i.children){let n=this.filter(e,t,i.children);this.preserveStructureOnFilter&&n.length?r.push({data:i.data,children:n}):r.push(...n)}return r}get _missingDataElement(){return this.querySelector(`[slot='missing-data']`)}getGroupingMessageTemplate(){return this.groupedBy.length===0?k:O`
      <bim-label
        part="grouping-message"
        style="
        background-color: var(--bim-ui_bg-contrast-10);
        border-bottom: 1px solid var(--bim-ui_bg-contrast-20);
        padding: 0.5rem 0.75rem;
        font-weight: 500;
        display: block;
      "
      >
        Grouped By: ${this.groupedBy.join(` → `)}
      </bim-label>
    `}render(){if(this.loading)return ms();if(this._errorLoading)return O`<slot name="error-loading"></slot>`;if(this._value.length===0&&this._missingDataElement)return O`<slot name="missing-data"></slot>`;let e=e=>{if(!e)return;let t=e;t.table=this,t.data=this._headerRowData,t.requestUpdate()};return O`
      <div class="parent">
        ${hs()}
        <div
          style="
          grid-area: Header;
          position: sticky;
          top: 0;
          z-index: 5;
        "
        >
          ${_t(!this.headersHidden,()=>O`<bim-table-row
                is-header
                ${lt(e)}
              ></bim-table-row>`)}
          ${this.getGroupingMessageTemplate()}
        </div>
        <div class="body-scroll" style="overflow-x: hidden; grid-area: Body">
          <bim-table-children
            ${lt(e=>{if(!e)return;let t=e;t.table=this,t.data=this.value,t.requestUpdate()})}
            style="grid-area: Body; background-color: transparent"
          ></bim-table-children>
        </div>
      </div>
    `}},Ms.styles=[Vr.scrollbar,o`
      :host {
        position: relative;
        overflow: auto;
        display: block;
        pointer-events: auto;
      }

      :host(:not([data-processing])) .loader {
        display: none;
      }

      .parent {
        display: grid;
        grid-template:
          "Header" auto
          "Processing" auto
          "Body" 1fr
          "Footer" auto;
        overflow: auto;
        height: 100%;
      }

      .parent > bim-table-row[is-header] {
        color: var(--bim-table_header--c, var(--bim-ui_bg-contrast-100));
      }

      .controls {
        display: flex;
        gap: 0.375rem;
        flex-wrap: wrap;
        margin-bottom: 0.5rem;
      }
    `],Ms);P([M()],F.prototype,`_value`,2),P([j({type:Boolean,attribute:`headers-hidden`,reflect:!0})],F.prototype,`headersHidden`,2),P([j({type:String,attribute:`min-col-width`,reflect:!0})],F.prototype,`minColWidth`,2),P([j({type:Array,attribute:!1})],F.prototype,`columns`,1),P([j({type:Array,attribute:!1})],F.prototype,`data`,1),P([j({type:Boolean,reflect:!0})],F.prototype,`expanded`,2),P([j({type:Number,attribute:`expanded-levels`,reflect:!0})],F.prototype,`expandedLevels`,2),P([j({attribute:!1})],F.prototype,`headersTransform`,2),P([j({attribute:!1})],F.prototype,`groupingTransform`,2),P([j({type:Boolean,reflect:!0,attribute:`selectable-rows`})],F.prototype,`selectableRows`,2),P([j({type:Boolean,attribute:`rows-selection-disabled`,reflect:!0})],F.prototype,`rowsSelectionDisabled`,2),P([j({type:Boolean,attribute:`no-indentation`,reflect:!0})],F.prototype,`noIndentation`,2),P([j({type:Boolean,attribute:`no-carets`,reflect:!0})],F.prototype,`noCarets`,2),P([j({type:Boolean,attribute:`groups-only`,reflect:!0})],F.prototype,`groupsOnly`,2),P([j({type:Boolean,reflect:!0})],F.prototype,`loading`,2),P([j({type:String,attribute:`grouped-by`,reflect:!0,converter:{toAttribute:e=>Array.isArray(e)&&e.length>0?e.join(`,`):null,fromAttribute:e=>e&&e.trim()!==``?e.split(`,`).map(e=>e.trim()):[]}})],F.prototype,`groupedBy`,1),P([j({type:String,attribute:`range-select-key`,reflect:!0})],F.prototype,`rangeSelectKey`,2),P([M()],F.prototype,`_errorLoading`,2),P([ze(`.body-scroll`)],F.prototype,`_bodyScroll`,2),P([j({type:Boolean,attribute:`columns-hidden`,reflect:!0,converter:{toAttribute:e=>e?null:``,fromAttribute:e=>e===null}})],F.prototype,`defaultVisibility`,1),P([j({type:String,attribute:`visibility-exceptions`,reflect:!0,converter:{toAttribute:e=>Array.isArray(e)&&e.length>0?e.join(`,`):null,fromAttribute:e=>e&&e.trim()!==``?e.split(`,`).map(e=>e.trim()):[]}})],F.prototype,`visibilityExceptions`,1);var Ns=F,Ps=Object.defineProperty,Fs=Object.getOwnPropertyDescriptor,Is=(e,t,n,r)=>{for(var i=r>1?void 0:r?Fs(t,n):t,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=(r?o(t,n,i):o(i))||i);return r&&i&&Ps(t,n,i),i},Ls=class extends A{constructor(){super(),this._defaultName=`__unnamed__`,this._autoNamed=!1,this.name=this._defaultName,this._hidden=!1,this.setAttribute(`role`,`tabpanel`)}set label(e){this._label=e,this.dispatchEvent(new CustomEvent(`tab-update`,{bubbles:!0}))}get label(){return this._label}set icon(e){this._icon=e,this.dispatchEvent(new CustomEvent(`tab-update`,{bubbles:!0}))}get icon(){return this._icon}set hidden(e){let t=this._hidden;this._hidden=e,this.requestUpdate(`hidden`,t),this.dispatchEvent(new CustomEvent(`hiddenchange`,{detail:{hidden:e}}))}get hidden(){return this._hidden}connectedCallback(){super.connectedCallback();let{parentElement:e}=this;if(e&&(this.name===this._defaultName||this._autoNamed)){let t=[...e.children].indexOf(this);this.name=`${this._defaultName}${t}`,this._autoNamed=!0}}render(){return O`<slot></slot>`}};Ls.styles=o`
    :host {
      display: block;
      height: 100%;
      grid-row-start: 1;
      grid-column-start: 1;
    }

    :host([hidden]) {
      display: none;
    }
  `;var Rs=Ls;Is([j({type:String,reflect:!0})],Rs.prototype,`name`,2),Is([j({type:String,reflect:!0})],Rs.prototype,`label`,1),Is([j({type:String,reflect:!0})],Rs.prototype,`icon`,1),Is([j({type:Boolean,reflect:!0})],Rs.prototype,`hidden`,1);var zs=Object.defineProperty,Bs=Object.getOwnPropertyDescriptor,Vs=(e,t,n,r)=>{for(var i=r>1?void 0:r?Bs(t,n):t,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=(r?o(t,n,i):o(i))||i);return r&&i&&zs(t,n,i),i},Hs=class extends A{constructor(){super(...arguments),this._switcherData=[],this._useDropdown=!1,this._initialized=!1,this._updatingTab=!1,this._dialogRef=ot(),this._triggerRef=ot(),this.bottom=!1,this.switchersHidden=!1,this.floating=!1,this.switchersFull=!1,this.switchersCompact=!1,this._onTabHiddenChange=e=>{if(this._updatingTab)return;let t=e.target;t instanceof Rs&&!t.hidden&&(this.tab=t.name)},this._updateSwitchers=()=>{for(let e of this.children){if(!(e instanceof Rs))continue;let t=this._switcherData.find(t=>t.name===e.name);t&&(t.label=e.label,t.icon=e.icon)}this.requestUpdate()},this._onSwitchersKeyDown=e=>{let t=[...this.renderRoot.querySelectorAll(`.switcher`)],n=t.length;if(!n)return;let r=t.findIndex(e=>e.getAttribute(`data-name`)===this._tab),i=r;if(e.key===`ArrowRight`||e.key===`ArrowDown`)e.preventDefault(),i=(r+1)%n;else if(e.key===`ArrowLeft`||e.key===`ArrowUp`)e.preventDefault(),i=(r-1+n)%n;else if(e.key===`Home`)e.preventDefault(),i=0;else if(e.key===`End`)e.preventDefault(),i=n-1;else return;let a=t[i];a&&(this.tab=a.getAttribute(`data-name`)??void 0,a.focus())}}set tab(e){if(!this._initialized&&e&&e!==`hidden`){this._pendingTab=e;return}let t=this._tab,n=[...this.children],r=n.find(t=>t instanceof Rs&&t.name===e);this._tab=r?e:`hidden`,this._updatingTab=!0;for(let e of n)e instanceof Rs&&(e.hidden=r!==e);this._updatingTab=!1,this.requestUpdate(`tab`,t)}get tab(){return this._tab}connectedCallback(){super.connectedCallback(),this.addEventListener(`tab-update`,this._updateSwitchers)}disconnectedCallback(){var e,t;super.disconnectedCallback(),this.removeEventListener(`tab-update`,this._updateSwitchers);for(let e of this.children)e instanceof Rs&&e.removeEventListener(`hiddenchange`,this._onTabHiddenChange);(e=this._ro)==null||e.disconnect(),(t=this._dialogRef.value)==null||t.close()}firstUpdated(){this._ro=new ResizeObserver(()=>this._checkOverflow()),this._ro.observe(this),requestAnimationFrame(()=>this._checkOverflow())}updated(e){super.updated(e),e.has(`_switcherData`)&&requestAnimationFrame(()=>this._checkOverflow())}_checkOverflow(){let e=this.renderRoot.querySelector(`.switchers-measure`);if(!e)return;let t=e.offsetWidth>this.clientWidth;t!==this._useDropdown&&(this._useDropdown=t)}_onTriggerClick(){let e=this._dialogRef.value,t=this._triggerRef.value;if(!e||!t)return;if(e.open){e.close();return}let n=t.getBoundingClientRect();e.style.top=`${n.top}px`,e.style.left=`${n.right+4}px`,e.showModal();let r=e.getBoundingClientRect();r.right>window.innerWidth-4&&(e.style.left=`${n.left-r.width-4}px`),r.bottom>window.innerHeight-4&&(e.style.top=`${Math.max(4,window.innerHeight-r.height-4)}px`)}_onDialogClick(e){let t=e.currentTarget,n=t.getBoundingClientRect();(e.clientX<n.left||e.clientX>n.right||e.clientY<n.top||e.clientY>n.bottom)&&t.close()}_createSwitchers(){this._switcherData=[];for(let e of this.children)e instanceof Rs&&(e.id||=`bim-tab-panel-${e.name}`,this._switcherData.push({name:e.name,label:e.label,icon:e.icon,panelId:e.id}))}_onSlotChange(e){this._initialized=!0,this._createSwitchers();let t=e.target.assignedElements(),n=this._pendingTab??this._tab;this._pendingTab=void 0;let r=t.find(e=>e instanceof Rs?n&&n!==`hidden`?e.name===n:!e.hidden:!1);r instanceof Rs&&(this.tab=r.name);for(let e of t){if(!(e instanceof Rs)){console.warn(`[bim-tabs] Only bim-tab elements are allowed as children. Removing:`,e),e.remove();continue}e.setAttribute(`aria-label`,e.label||e.name||``),e.removeEventListener(`hiddenchange`,this._onTabHiddenChange),r!==e&&(e.hidden=!0),e.addEventListener(`hiddenchange`,this._onTabHiddenChange)}}render(){let e=this._switcherData.find(e=>e.name===this._tab);return O`
      <div class="parent">
        <div class="switchers-measure" aria-hidden="true">
          ${this._switcherData.map(e=>O`
              <div class="switcher-ghost">
                <bim-label .icon=${e.icon}>${e.label??``}</bim-label>
              </div>
            `)}
        </div>
        <div
          class="switchers"
          role=${this._useDropdown?k:`tablist`}
          aria-label=${this.label??k}
          @keydown=${this._useDropdown?k:this._onSwitchersKeyDown}
        >
          ${this._useDropdown?O`
                <button
                  class="tab-trigger"
                  ${lt(this._triggerRef)}
                  @click=${this._onTriggerClick}
                  aria-haspopup="listbox"
                >
                  <bim-label .icon=${e?.icon}
                    >${e?.label??``}</bim-label
                  >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="10"
                    height="10"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M3 6l5 5 5-5" />
                  </svg>
                </button>
                <dialog ${lt(this._dialogRef)} @click=${this._onDialogClick}>
                  ${this._switcherData.map(e=>O`<div
                      class="tab-option"
                      ?data-active=${this._tab===e.name}
                      @click=${()=>{var t;this.tab=e.name,(t=this._dialogRef.value)==null||t.close()}}
                    >
                      <bim-label .icon=${e.icon}>${e.label??``}</bim-label>
                    </div>`)}
                </dialog>
              `:this._switcherData.map(e=>{let t=this._tab===e.name;return O`<div
                  class="switcher"
                  data-name=${e.name}
                  role="tab"
                  aria-selected=${t}
                  tabindex=${t?0:-1}
                  aria-controls=${e.panelId}
                  ?data-active=${t}
                  @click=${()=>{if(this._tab===e.name){this.floating&&(this.tab=void 0);return}this.tab=e.name}}
                ><bim-label .icon=${e.icon}>${e.label??``}</bim-label></div>`})}
        </div>
        <div class="content">
          <slot @slotchange=${this._onSlotChange}></slot>
        </div>
      </div>
    `}};Hs.styles=[Vr.scrollbar,o`
      * {
        box-sizing: border-box;
      }

      :host {
        flex: 1;
        display: block;
        height: 100%;
        background-color: var(--bim-tabs--bg, var(--bim-ui_bg-contrast-10));
        overflow: auto;
        border: var(--bim-tabs--border, 1px solid var(--bim-ui_bg-contrast-20));
        border-radius: 0.75rem;
        --bim-panel--header-display: none;
        --bim-panel-section--header-display: none;
        --bim-panel-section--border: none;
        --bim-panel-section--bdrs: 0;
        --bim-panel-section--bg: transparent;
        --bim-panel--border: none;
        --bim-toolbar--border: none;
        --bim-toolbar--bdrs: 0;
      }

      .parent {
        display: grid;
        overflow: hidden;
        position: relative;
        grid-template: "switchers" auto "content" 1fr;
        height: 100%;
      }

      :host([bottom]) .parent {
        grid-template: "content" 1fr "switchers" auto;
      }

      .switchers {
        height: 35px;
        border-bottom: 1px solid var(--bim-ui_bg-contrast-20);
        position: relative;
        display: flex;
        flex-wrap: wrap;
        grid-area: switchers;
        overflow: hidden;
      }

      :host([bottom]) .switchers {
        border-bottom: none;
        border-top: 1px solid var(--bim-ui_bg-contrast-20);
      }

      .switcher {
        --bim-label--c: var(--bim-ui_bg-contrast-80);
        position: relative;
        cursor: pointer;
        pointer-events: auto;
        padding: 0 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: var(--bim-tabs-switcher--z, 2);
        transition: background-color 0.15s;
        min-height: var(--bim-tabs-switcher--minh, 30px);
      }

      .switcher:not([data-active]):hover {
        background-color: var(--bim-ui_bg-contrast-20);
      }

      .switcher[data-active] {
        --bim-label--c: var(--bim-ui_bg-contrast-100);
        /* Active tab = the ThatOpen brand purple (main-base #6528d7) by default,
           not a gray. Themeable via --bim-tabs-switcher--active-bgc. */
        background-color: var(--bim-tabs-switcher--active-bgc, var(--bim-ui_main-base));
      }

      .switcher:focus-visible {
        outline: 2px solid var(--bim-ui_accent-base);
        outline-offset: -2px;
      }

      .switchers bim-label {
        pointer-events: none;
      }

      :host([switchers-full]) .switcher {
        flex: 1;
      }

      :host([switchers-hidden]) .switchers {
        display: none;
      }

      :host([switchers-compact]) .switchers {
        width: fit-content;
        border-bottom: none;
        padding: 0;
        margin: var(--bim-ui_size-sm);
        gap: 0;
        overflow: auto;
        border-radius: var(--bim-ui_size-2xs);
      }

      :host([switchers-compact]) .switcher {
        min-width: unset;
        padding: 0 var(--bim-ui_size-sm);
        border-radius: 0;
        background-color: var(--bim-ui_bg-contrast-20);
      }

      :host([switchers-compact]) .switcher[data-active] {
        background-color: var(--bim-tabs-switcher--active-bgc, var(--bim-ui_main-base));
      }

      /* Invisible measure strip — always rendered to detect overflow */
      .switchers-measure {
        position: absolute;
        top: 0;
        left: 0;
        height: 0;
        visibility: hidden;
        pointer-events: none;
        display: flex;
        flex-wrap: nowrap;
      }

      .switcher-ghost {
        padding: 0 0.75rem;
        display: flex;
        align-items: center;
        min-height: var(--bim-tabs-switcher--minh, 30px);
        flex-shrink: 0;
        white-space: nowrap;
      }

      /* Overflow dropdown trigger */
      .tab-trigger {
        --bim-label--c: var(--bim-ui_bg-contrast-80);
        all: unset;
        box-sizing: border-box;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.375rem;
        padding: 0 0.75rem;
        cursor: pointer;
        min-height: var(--bim-tabs-switcher--minh, 30px);
        user-select: none;
      }

      .tab-trigger svg {
        flex-shrink: 0;
      }

      .tab-trigger:hover {
        background-color: var(--bim-ui_bg-contrast-20);
      }

      .tab-trigger:focus-visible {
        outline: 2px solid var(--bim-ui_accent-base);
        outline-offset: -2px;
      }

      /* Overflow dropdown dialog */
      dialog {
        position: fixed;
        margin: 0;
        padding: 0.25rem 0;
        border: 1px solid var(--bim-ui_bg-contrast-20);
        border-radius: var(--bim-ui_size-2xs);
        background-color: var(--bim-ui_bg-contrast-10);
        box-shadow: 1px 2px 8px 2px rgba(0, 0, 0, 0.15);
        overflow: auto;
        max-height: 20rem;
        min-width: 8rem;
      }

      dialog::backdrop {
        background: transparent;
      }

      .tab-option {
        --bim-label--c: var(--bim-ui_bg-contrast-80);
        display: flex;
        align-items: center;
        padding: 0 0.75rem;
        min-height: var(--bim-tabs-switcher--minh, 30px);
        cursor: pointer;
        user-select: none;
        white-space: nowrap;
      }

      .tab-option:hover {
        background-color: var(--bim-ui_bg-contrast-20);
      }

      .tab-option[data-active] {
        --bim-label--c: var(--bim-ui_bg-contrast-100);
        background-color: var(--bim-ui_bg-contrast-30);
      }

      .content {
        position: relative;
        display: grid;
        grid-template-columns: 1fr;
        grid-area: content;
        overflow: auto;
      }

      :host([tab="hidden"]) .content {
        display: none;
      }

      :host([floating]) {
        background-color: transparent;
        border: none;
        --bim-toolbar--w: 100%;
        overflow: visible;
      }

      :host([floating]) .parent {
        overflow: visible;
      }

      :host([floating]) .switchers {
        justify-self: center;
        overflow: hidden;
        /* Switcher bar = panel surface (#262629 = bg-contrast-10). Themeable. */
        background-color: var(--bim-tabs--switchers-bgc, var(--bim-ui_bg-contrast-10));
      }

      /* Floating dock borders match the panel/toolbar border (1px bg-contrast-20
         = #3C3C41), so the whole dock frames uniformly. Was contrast-40
         (#5F5F64, lighter). Themeable via --bim-tabs--switchers-bdc. */
      :host([floating]:not([bottom])) .switchers {
        border-radius: var(--bim-ui_size-2xs) var(--bim-ui_size-2xs) 0 0;
        border: 1px solid var(--bim-tabs--switchers-bdc, var(--bim-ui_bg-contrast-20));
        border-bottom: none;
      }

      :host([floating][bottom]) .switchers {
        border-radius: 0 0 var(--bim-ui_size-2xs) var(--bim-ui_size-2xs);
        border: 1px solid var(--bim-tabs--switchers-bdc, var(--bim-ui_bg-contrast-20));
        border-top: none;
      }

      :host([floating][tab="hidden"]) .switchers {
        border-radius: var(--bim-ui_size-2xs);
        border: 1px solid var(--bim-tabs--switchers-bdc, var(--bim-ui_bg-contrast-20));
      }

      :host([floating]) .content {
        border: 1px solid var(--bim-tabs--switchers-bdc, var(--bim-ui_bg-contrast-20));
        border-radius: var(--bim-ui_size-2xs);
        background-color: var(--bim-ui_bg-base);
      }

      :host([floating][tab="hidden"]) .content {
        border: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .switcher {
          transition: none;
        }
      }
    `];var Us=Hs;Vs([M()],Us.prototype,`_switcherData`,2),Vs([M()],Us.prototype,`_useDropdown`,2),Vs([j({type:Boolean,reflect:!0})],Us.prototype,`bottom`,2),Vs([j({type:Boolean,attribute:`switchers-hidden`,reflect:!0})],Us.prototype,`switchersHidden`,2),Vs([j({type:Boolean,reflect:!0})],Us.prototype,`floating`,2),Vs([j({type:String,reflect:!0})],Us.prototype,`label`,2),Vs([j({type:String,reflect:!0})],Us.prototype,`tab`,1),Vs([j({type:Boolean,attribute:`switchers-full`,reflect:!0})],Us.prototype,`switchersFull`,2),Vs([j({type:Boolean,attribute:`switchers-compact`,reflect:!0})],Us.prototype,`switchersCompact`,2);var Ws=Object.defineProperty,Gs=Object.getOwnPropertyDescriptor,Ks=(e,t,n,r)=>{for(var i=r>1?void 0:r?Gs(t,n):t,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=(r?o(t,n,i):o(i))||i);return r&&i&&Ws(t,n,i),i},qs,Js=(qs=class extends A{constructor(){super(...arguments),this._type=`text`,this._cachedQuery=void 0,this._dirty=!1,this.value=``,this.vertical=!1,this.disabled=!1,this.iconInside=!1,this.resize=`vertical`,this.onValueChange=new Event(`input`)}set type(e){qs._inputTypes.includes(e)?this._type=e:console.warn(`[bim-text-input] Unknown type "${e}". Ignored.`)}get type(){return this._type}get query(){return this._cachedQuery===void 0&&(this._cachedQuery=Yr(this.value)),this._cachedQuery}get validation(){return this._validation}set validation(e){this._validation=e,this.requestUpdate()}get isValid(){return this._dirty?this._currentValidation?.valid??!0:!0}willUpdate(e){e.has(`value`)&&(this._cachedQuery=void 0),this._currentValidation=this._validation?this._validation(this.value):void 0}updated(){this.toggleAttribute(`invalid`,!this.isValid)}onInputChange(e){this._dirty=!0,e.stopPropagation();let t=e.target;clearTimeout(this._debounceTimeoutID),this.debounce==null?(this.value=t.value,this.dispatchEvent(new Event(`input`,{bubbles:!0,composed:!0}))):this._debounceTimeoutID=setTimeout(()=>{this.value=t.value,this.dispatchEvent(new Event(`input`,{bubbles:!0,composed:!0}))},this.debounce)}async focus(){await this.updateComplete,(this.shadowRoot?.querySelector(`input, textarea`))?.focus()}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this._debounceTimeoutID)}render(){var e;let t=this.iconInside&&this.type!==`area`,n=t?void 0:this.icon;return O`
      <div class="parent">
        ${this.label||n?O`<bim-label .icon=${n}>${this.label}</bim-label>`:k}
        <div class="input">
          ${t&&this.icon?O`<bim-label .icon=${this.icon}></bim-label>`:k}
          ${this.type===`area`?O`<textarea
                aria-label=${this.label||`Text Input`}
                .value=${this.value}
                .rows=${this.rows??5}
                ?disabled=${this.disabled}
                placeholder=${ut(this.placeholder)}
                @input=${this.onInputChange}
                style=${gt({"--bim-text-input--resize":this.resize})}
              ></textarea>`:O`<input
                aria-label=${this.label||`Text Input`}
                .type=${this.type}
                .value=${this.value}
                ?disabled=${this.disabled}
                placeholder=${ut(this.placeholder)}
                autocomplete=${ut(this.autocomplete)}
                @input=${this.onInputChange}
              />`}
        </div>
      </div>
      ${!this.isValid&&(e=this._currentValidation)!=null&&e.message?O`<span class="validation-message">${this._currentValidation.message}</span>`:k}
    `}},qs.styles=[Vr.scrollbar,o`
      :host {
        display: block;
      }

      .parent {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        user-select: none;
        flex: 1;
        align-items: normal;
      }

      :host(:not([vertical])) .parent {
        justify-content: space-between;
      }

      :host([vertical]) .parent {
        flex-direction: column;
      }

      :host(:not([vertical])[type="area"]) .parent {
        align-items: flex-start;
      }

      bim-label {
        margin-top: var(--bim-input--label-mt, 0);
      }

      :host(:not([vertical])[type="area"]) bim-label {
        margin-top: 4px;
      }

      .input {
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        height: 25px;
        min-width: 3rem;
        gap: var(--bim-input--g, var(--bim-ui_size-4xs));
        padding: 0 7px;
        background-color: var(--bim-input--bgc, var(--bim-ui_bg-contrast-20));
        border: var(--bim-input--olw, 2px) solid var(--bim-input--olc, transparent);
        border-radius: var(--bim-input--bdrs, var(--bim-ui_size-2xs));
        transition: border-color 0.15s;
      }

      :host([type="area"]) .input {
        height: auto;
        min-height: 25px;
        align-items: flex-start;
        padding: 4px 7px;
      }

      :host(:not([vertical])) .input {
        flex: 1;
        justify-content: flex-end;
      }

      :host(:not([vertical])[label]) .input {
        max-width: var(--bim-input--maxw, fit-content);
      }

      :host(:focus-within) .input {
        border-color: var(--bim-ui_bg-contrast-40);
      }

      :host([invalid]) .input {
        border-color: var(--bim-ui_danger-base);
      }

      input,
      textarea {
        font-size: var(--bim-ui_size-base);
        font-family: inherit;
        background-color: transparent;
        border: none;
        width: 100%;
        color: var(--bim-text-input--c, var(--bim-ui_bg-contrast-100));
      }

      input {
        outline: none;
        color-scheme: dark;
      }

      :host-context(html.bim-ui-light) input {
        color-scheme: light;
      }

      @media (prefers-color-scheme: light) {
        input {
          color-scheme: light;
        }
      }

      :host([disabled]) input,
      :host([disabled]) textarea {
        color: var(--bim-text-input--disabled-c, var(--bim-ui_bg-contrast-60));
      }

      textarea {
        line-height: 1.1rem;
        outline: none;
        resize: var(--bim-text-input--resize, vertical);
      }

      .validation-message {
        display: block;
        font-size: var(--bim-ui_size-base);
        color: var(--bim-ui_danger-base);
        padding: 2px var(--bim-ui_size-xs);
      }

      :host(:not([vertical])) .validation-message {
        text-align: right;
      }

      :host([icon-inside]) input,
      :host([icon-inside]) textarea {
        width: auto;
        flex: 1;
        min-width: 0;
      }

      @media (prefers-reduced-motion: reduce) {
        .input {
          transition: none;
        }
      }
    `],qs._inputTypes=[`date`,`datetime-local`,`email`,`month`,`password`,`search`,`tel`,`text`,`time`,`url`,`week`,`area`],qs);Ks([j({type:String,reflect:!0})],Js.prototype,`icon`,2),Ks([j({type:String,reflect:!0})],Js.prototype,`label`,2),Ks([j({type:String,reflect:!0})],Js.prototype,`name`,2),Ks([j({type:String,reflect:!0})],Js.prototype,`placeholder`,2),Ks([j({type:String})],Js.prototype,`value`,2),Ks([j({type:Boolean,reflect:!0})],Js.prototype,`vertical`,2),Ks([j({type:Number})],Js.prototype,`debounce`,2),Ks([j({type:Number})],Js.prototype,`rows`,2),Ks([j({type:Boolean,reflect:!0})],Js.prototype,`disabled`,2),Ks([j({type:String,reflect:!0})],Js.prototype,`autocomplete`,2),Ks([j({type:Boolean,reflect:!0,attribute:`icon-inside`})],Js.prototype,`iconInside`,2),Ks([j({type:String,reflect:!0})],Js.prototype,`resize`,2),Ks([j({type:String,reflect:!0})],Js.prototype,`type`,1);var Ys=Js,Xs=Object.defineProperty,Zs=Object.getOwnPropertyDescriptor,Qs=(e,t,n,r)=>{for(var i=Zs(t,n),a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&Xs(t,n,i),i},$s=class extends A{constructor(){super(...arguments),this._rows=2,this._vertical=!1,this._rafId=0,this._scheduleUpdateChildren=()=>{cancelAnimationFrame(this._rafId),this._rafId=requestAnimationFrame(()=>this.updateChildren())}}set rows(e){this._rows=Math.max(1,Math.floor(e))}get rows(){return this._rows}set vertical(e){e!==this._vertical&&(this._vertical=e,this.updateChildren())}get vertical(){return this._vertical}connectedCallback(){super.connectedCallback(),this.hasAttribute(`role`)||this.setAttribute(`role`,`group`)}disconnectedCallback(){super.disconnectedCallback(),cancelAnimationFrame(this._rafId)}updated(){this.style.setProperty(`--_flow`,this.vertical?`row`:`column`),this.style.setProperty(`--_rows`,String(this.rows))}updateChildren(){for(let e of this.children)e.tagName.startsWith(`BIM-`)&&e.toggleAttribute(`label-hidden`,this.vertical)}render(){return O`
      <div class="parent">
        <slot @slotchange=${this._scheduleUpdateChildren}></slot>
      </div>
    `}};$s.styles=o`
    :host(:focus-visible) {
      outline: 2px solid var(--bim-ui_accent-base);
      outline-offset: -2px;
    }

    .parent {
      display: grid;
      gap: 0.25rem;
      grid-auto-flow: var(--_flow, column);
      grid-template-rows: repeat(var(--_rows, 2), 1fr);
    }

    ::slotted(bim-button[label]:not([vertical])) {
      --bim-button--jc: flex-start;
    }
  `;var ec=$s;Qs([j({type:Number,reflect:!0})],ec.prototype,`rows`),Qs([j({type:Boolean,reflect:!0})],ec.prototype,`vertical`);var tc=Object.defineProperty,nc=Object.getOwnPropertyDescriptor,rc=(e,t,n,r)=>{for(var i=r>1?void 0:r?nc(t,n):t,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=(r?o(t,n,i):o(i))||i);return r&&i&&tc(t,n,i),i},ic=class extends A{constructor(){super(...arguments),this._vertical=!1,this._labelHidden=!1,this._rafId=0,this._scheduleUpdateChildren=()=>{cancelAnimationFrame(this._rafId),this._rafId=requestAnimationFrame(()=>this.updateChildren())}}set vertical(e){e!==this._vertical&&(this._vertical=e,this.updateChildren())}get vertical(){return this._vertical}set labelHidden(e){e!==this._labelHidden&&(this._labelHidden=e,this.updateChildren())}get labelHidden(){return this._labelHidden}connectedCallback(){super.connectedCallback(),this.hasAttribute(`role`)||this.setAttribute(`role`,`group`)}disconnectedCallback(){super.disconnectedCallback(),cancelAnimationFrame(this._rafId)}updated(){this.label&&this.setAttribute(`aria-label`,this.label)}updateChildren(){for(let e of this.children)e.tagName.startsWith(`BIM-`)&&(e instanceof ec&&(e.vertical=this.vertical),e.toggleAttribute(`label-hidden`,this.vertical))}render(){return O`
      <div class="parent">
        <div class="children">
          <slot @slotchange=${this._scheduleUpdateChildren}></slot>
        </div>
        ${!this.labelHidden&&(this.label||this.icon)?O`<bim-label class="name" .icon=${this.icon}>${this.label}</bim-label>`:null}
      </div>
    `}};ic.styles=o`
    :host {
      --bim-label--c: var(--bim-ui_bg-contrast-80);
      display: block;
      flex: 1;
    }

    :host(:focus-visible) {
      outline: 2px solid var(--bim-ui_accent-base);
      outline-offset: -2px;
    }

    :host(:not([vertical])) ::slotted(bim-button[vertical]) {
      --bim-icon--fz: var(--bim-ui_size-5xl);
      min-height: 3.75rem;
    }

    .parent {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1px;
      height: 100%;
      box-sizing: border-box;
      justify-content: space-between;
    }

    :host([vertical]) .parent {
      flex-direction: row-reverse;
    }

    :host([vertical]) .parent > bim-label {
      writing-mode: vertical-rl;
    }

    .name {
      height: 20px;
      padding: 0 10px;
      font-size: var(--bim-ui_size-sm);
      flex-shrink: 0;
    }

    .children {
      display: flex;
      gap: var(--bim-toolbar-section--gap, 6px);
      height: 100%;
      padding: var(--bim-toolbar-section--p, 4px);
    }

    :host([vertical]) .children {
      flex-direction: column;
    }
  `;var ac=ic;rc([j({type:String,reflect:!0})],ac.prototype,`label`,2),rc([j({type:String,reflect:!0})],ac.prototype,`name`,2),rc([j({type:String,reflect:!0})],ac.prototype,`icon`,2),rc([j({type:Boolean,reflect:!0})],ac.prototype,`vertical`,1),rc([j({type:Boolean,attribute:`label-hidden`,reflect:!0})],ac.prototype,`labelHidden`,1);var oc=Object.defineProperty,sc=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&oc(t,n,i),i},cc=class extends A{constructor(){super(...arguments),this.labelsHidden=!1,this.vertical=!1,this._onKeyDown=e=>{let t=Array.from(this.querySelectorAll(`bim-button:not([disabled])`));if(!t.length)return;let n=t.indexOf(document.activeElement);if(![`ArrowLeft`,`ArrowRight`,`ArrowUp`,`ArrowDown`,`Home`,`End`].includes(e.key))return;e.preventDefault();let r;r=e.key===`Home`?t[0]:e.key===`End`?t[t.length-1]:e.key===`ArrowRight`||e.key===`ArrowDown`?t[(n+1)%t.length]:t[(n-1+t.length)%t.length],r?.focus()}}set hidden(e){super.hidden=e,this.dispatchEvent(new Event(`hiddenchange`))}get hidden(){return super.hidden}connectedCallback(){super.connectedCallback(),this.hasAttribute(`role`)||this.setAttribute(`role`,`toolbar`),this.addEventListener(`keydown`,this._onKeyDown)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(`keydown`,this._onKeyDown)}updated(e){this.setAttribute(`aria-orientation`,this.vertical?`vertical`:`horizontal`),(e.has(`vertical`)||e.has(`labelsHidden`))&&this.updateSections()}updateSections(){for(let e of this.children)e instanceof ac&&(e.labelHidden=this.labelsHidden||this.vertical&&!Ur.config.sectionLabelOnVerticalToolbar,e.vertical=this.vertical)}render(){return O`
      <div class="parent">
        <slot @slotchange=${this.updateSections}></slot>
      </div>
    `}};cc.styles=o`
    :host {
      --bim-button--bgc: transparent;
      overflow: auto;
      display: block;
      contain: layout style;
      background-color: var(--bim-toolbar--bgc, var(--bim-ui_bg-contrast-10));
      border: var(--bim-toolbar--border, 1px solid var(--bim-ui_bg-contrast-20));
      border-radius: var(--bim-toolbar--bdrs, var(--bim-ui_size-2xs));
    }

    :host([hidden]) {
      display: none;
    }

    .parent {
      display: flex;
      width: var(--bim-toolbar--w, max-content);
      pointer-events: auto;
    }

    :host([vertical]) .parent {
      flex-direction: column;
    }

    :host([vertical]) {
      width: var(--bim-toolbar--vertical-w, min-content);
    }

    ::slotted(bim-toolbar-section:not(:last-child)) {
      border-right: var(--bim-toolbar--divider, 1px solid var(--bim-ui_bg-contrast-20));
      border-bottom: none;
    }

    :host([vertical]) ::slotted(bim-toolbar-section:not(:last-child)) {
      border-bottom: var(--bim-toolbar--divider, 1px solid var(--bim-ui_bg-contrast-20));
      border-right: none;
    }
  `;var lc=cc;sc([j({type:Boolean,attribute:`labels-hidden`,reflect:!0})],lc.prototype,`labelsHidden`),sc([j({type:Boolean,reflect:!0})],lc.prototype,`vertical`);var uc=Object.defineProperty,dc=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&uc(t,n,i),i},fc=class extends A{constructor(){super(),this._onResize=new Event(`resize`),new ResizeObserver(()=>{setTimeout(()=>{this.dispatchEvent(this._onResize)})}).observe(this)}render(){return O`
      <div class="parent">
        <slot></slot>
      </div>
    `}};fc.styles=o`
    :host {
      display: grid;
      min-width: 0;
      min-height: 0;
      height: 100%;
      /* border: 1px solid var(--bim-ui_bg-contrast-40); */
    }

    .parent {
      overflow: hidden;
      position: relative;
    }
  `;var pc=fc;dc([j({type:String,reflect:!0})],pc.prototype,`name`);var mc=Object.defineProperty,hc=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&mc(t,n,i),i},gc=class extends A{constructor(){super(...arguments),this.charts=[],this._charts=[],this.labels=[]}willUpdate(e){let t=[];this.charts&&t.push(...this.charts),this._charts=[...new Set(t)]}_getLabelColorMap(e){let t={};return e.colors&&this.labels.forEach((n,r)=>{t[n]=e.colors[r%e.colors.length]}),t}_getHideEventData(){let e={};for(let t in this.labels){let n=this.labels[t],r=[];for(let e of Object.values(this._charts[0].inputData.datasets))r.push(e[t]?.data);e[n]=r}return e}render(){if(this._charts.length===0||!this._charts[0].data)return O`<slot name="no-chart"></slot>`;let e=this._charts[0];this.labels=e.inputData.labels;let t=this._getLabelColorMap(e),n=this._getHideEventData();return this.labels.length===0?O`<slot name="missing-data"></slot>`:O`
      <div class="parent">
        ${this.labels.map(e=>O`
            <div style="display: flex; gap: 0.25rem; align-items: center;">
              <span
                style="
                display: inline-block;
                width: 0.6rem;
                height: 0.6rem;
                border-radius: 50%;
                background: ${t[e]??`gray`};
              "
                aria-hidden="true"
              ></span>
              <bim-label
                @click=${t=>{let r=t.currentTarget,i=r.style.textDecoration===`line-through`;r.style.textDecoration=i?`none`:`line-through`;let a=n[e];this.dispatchEvent(new CustomEvent(`label-click`,{detail:{label:e,data:a,visibility:i}}));for(let t of this._charts)t.filterByLabel(e)}}
              >
                ${e}
              </bim-label>
            </div>
          `)}
      </div>
    `}};gc.styles=o`
    :host {
      display: block;
      box-sizing: border-box;
      padding: 0.5rem;
    }

    .parent {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: center;
      /* height: 100%;
      width: 100%; */
    }
  `;var _c=gc;hc([j({type:Array,attribute:!1,hasChanged:()=>!0})],_c.prototype,`charts`);function vc(e){return e+.5|0}var yc=(e,t,n)=>Math.max(Math.min(e,n),t);function bc(e){return yc(vc(e*2.55),0,255)}function xc(e){return yc(vc(e*255),0,255)}function Sc(e){return yc(vc(e/2.55)/100,0,1)}function Cc(e){return yc(vc(e*100),0,100)}var wc={0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,A:10,B:11,C:12,D:13,E:14,F:15,a:10,b:11,c:12,d:13,e:14,f:15},Tc=[...`0123456789ABCDEF`],Ec=e=>Tc[e&15],Dc=e=>Tc[(e&240)>>4]+Tc[e&15],Oc=e=>(e&240)>>4==(e&15),kc=e=>Oc(e.r)&&Oc(e.g)&&Oc(e.b)&&Oc(e.a);function Ac(e){var t=e.length,n;return e[0]===`#`&&(t===4||t===5?n={r:255&wc[e[1]]*17,g:255&wc[e[2]]*17,b:255&wc[e[3]]*17,a:t===5?wc[e[4]]*17:255}:(t===7||t===9)&&(n={r:wc[e[1]]<<4|wc[e[2]],g:wc[e[3]]<<4|wc[e[4]],b:wc[e[5]]<<4|wc[e[6]],a:t===9?wc[e[7]]<<4|wc[e[8]]:255})),n}var jc=(e,t)=>e<255?t(e):``;function Mc(e){var t=kc(e)?Ec:Dc;return e?`#`+t(e.r)+t(e.g)+t(e.b)+jc(e.a,t):void 0}var Nc=/^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;function Pc(e,t,n){let r=t*Math.min(n,1-n),i=(t,i=(t+e/30)%12)=>n-r*Math.max(Math.min(i-3,9-i,1),-1);return[i(0),i(8),i(4)]}function Fc(e,t,n){let r=(r,i=(r+e/60)%6)=>n-n*t*Math.max(Math.min(i,4-i,1),0);return[r(5),r(3),r(1)]}function Ic(e,t,n){let r=Pc(e,1,.5),i;for(t+n>1&&(i=1/(t+n),t*=i,n*=i),i=0;i<3;i++)r[i]*=1-t-n,r[i]+=t;return r}function Lc(e,t,n,r,i){return e===i?(t-n)/r+(t<n?6:0):t===i?(n-e)/r+2:(e-t)/r+4}function Rc(e){let t=e.r/255,n=e.g/255,r=e.b/255,i=Math.max(t,n,r),a=Math.min(t,n,r),o=(i+a)/2,s,c,l;return i!==a&&(l=i-a,c=o>.5?l/(2-i-a):l/(i+a),s=Lc(t,n,r,l,i),s=s*60+.5),[s|0,c||0,o]}function zc(e,t,n,r){return(Array.isArray(t)?e(t[0],t[1],t[2]):e(t,n,r)).map(xc)}function Bc(e,t,n){return zc(Pc,e,t,n)}function Vc(e,t,n){return zc(Ic,e,t,n)}function Hc(e,t,n){return zc(Fc,e,t,n)}function Uc(e){return(e%360+360)%360}function Wc(e){let t=Nc.exec(e),n=255,r;if(!t)return;t[5]!==r&&(n=t[6]?bc(+t[5]):xc(+t[5]));let i=Uc(+t[2]),a=t[3]/100,o=t[4]/100;return r=t[1]===`hwb`?Vc(i,a,o):t[1]===`hsv`?Hc(i,a,o):Bc(i,a,o),{r:r[0],g:r[1],b:r[2],a:n}}function Gc(e,t){var n=Rc(e);n[0]=Uc(n[0]+t),n=Bc(n),e.r=n[0],e.g=n[1],e.b=n[2]}function Kc(e){if(!e)return;let t=Rc(e),n=t[0],r=Cc(t[1]),i=Cc(t[2]);return e.a<255?`hsla(${n}, ${r}%, ${i}%, ${Sc(e.a)})`:`hsl(${n}, ${r}%, ${i}%)`}var qc={x:`dark`,Z:`light`,Y:`re`,X:`blu`,W:`gr`,V:`medium`,U:`slate`,A:`ee`,T:`ol`,S:`or`,B:`ra`,C:`lateg`,D:`ights`,R:`in`,Q:`turquois`,E:`hi`,P:`ro`,O:`al`,N:`le`,M:`de`,L:`yello`,F:`en`,K:`ch`,G:`arks`,H:`ea`,I:`ightg`,J:`wh`},Jc={OiceXe:`f0f8ff`,antiquewEte:`faebd7`,aqua:`ffff`,aquamarRe:`7fffd4`,azuY:`f0ffff`,beige:`f5f5dc`,bisque:`ffe4c4`,black:`0`,blanKedOmond:`ffebcd`,Xe:`ff`,XeviTet:`8a2be2`,bPwn:`a52a2a`,burlywood:`deb887`,caMtXe:`5f9ea0`,KartYuse:`7fff00`,KocTate:`d2691e`,cSO:`ff7f50`,cSnflowerXe:`6495ed`,cSnsilk:`fff8dc`,crimson:`dc143c`,cyan:`ffff`,xXe:`8b`,xcyan:`8b8b`,xgTMnPd:`b8860b`,xWay:`a9a9a9`,xgYF:`6400`,xgYy:`a9a9a9`,xkhaki:`bdb76b`,xmagFta:`8b008b`,xTivegYF:`556b2f`,xSange:`ff8c00`,xScEd:`9932cc`,xYd:`8b0000`,xsOmon:`e9967a`,xsHgYF:`8fbc8f`,xUXe:`483d8b`,xUWay:`2f4f4f`,xUgYy:`2f4f4f`,xQe:`ced1`,xviTet:`9400d3`,dAppRk:`ff1493`,dApskyXe:`bfff`,dimWay:`696969`,dimgYy:`696969`,dodgerXe:`1e90ff`,fiYbrick:`b22222`,flSOwEte:`fffaf0`,foYstWAn:`228b22`,fuKsia:`ff00ff`,gaRsbSo:`dcdcdc`,ghostwEte:`f8f8ff`,gTd:`ffd700`,gTMnPd:`daa520`,Way:`808080`,gYF:`8000`,gYFLw:`adff2f`,gYy:`808080`,honeyMw:`f0fff0`,hotpRk:`ff69b4`,RdianYd:`cd5c5c`,Rdigo:`4b0082`,ivSy:`fffff0`,khaki:`f0e68c`,lavFMr:`e6e6fa`,lavFMrXsh:`fff0f5`,lawngYF:`7cfc00`,NmoncEffon:`fffacd`,ZXe:`add8e6`,ZcSO:`f08080`,Zcyan:`e0ffff`,ZgTMnPdLw:`fafad2`,ZWay:`d3d3d3`,ZgYF:`90ee90`,ZgYy:`d3d3d3`,ZpRk:`ffb6c1`,ZsOmon:`ffa07a`,ZsHgYF:`20b2aa`,ZskyXe:`87cefa`,ZUWay:`778899`,ZUgYy:`778899`,ZstAlXe:`b0c4de`,ZLw:`ffffe0`,lime:`ff00`,limegYF:`32cd32`,lRF:`faf0e6`,magFta:`ff00ff`,maPon:`800000`,VaquamarRe:`66cdaa`,VXe:`cd`,VScEd:`ba55d3`,VpurpN:`9370db`,VsHgYF:`3cb371`,VUXe:`7b68ee`,VsprRggYF:`fa9a`,VQe:`48d1cc`,VviTetYd:`c71585`,midnightXe:`191970`,mRtcYam:`f5fffa`,mistyPse:`ffe4e1`,moccasR:`ffe4b5`,navajowEte:`ffdead`,navy:`80`,Tdlace:`fdf5e6`,Tive:`808000`,TivedBb:`6b8e23`,Sange:`ffa500`,SangeYd:`ff4500`,ScEd:`da70d6`,pOegTMnPd:`eee8aa`,pOegYF:`98fb98`,pOeQe:`afeeee`,pOeviTetYd:`db7093`,papayawEp:`ffefd5`,pHKpuff:`ffdab9`,peru:`cd853f`,pRk:`ffc0cb`,plum:`dda0dd`,powMrXe:`b0e0e6`,purpN:`800080`,YbeccapurpN:`663399`,Yd:`ff0000`,Psybrown:`bc8f8f`,PyOXe:`4169e1`,saddNbPwn:`8b4513`,sOmon:`fa8072`,sandybPwn:`f4a460`,sHgYF:`2e8b57`,sHshell:`fff5ee`,siFna:`a0522d`,silver:`c0c0c0`,skyXe:`87ceeb`,UXe:`6a5acd`,UWay:`708090`,UgYy:`708090`,snow:`fffafa`,sprRggYF:`ff7f`,stAlXe:`4682b4`,tan:`d2b48c`,teO:`8080`,tEstN:`d8bfd8`,tomato:`ff6347`,Qe:`40e0d0`,viTet:`ee82ee`,JHt:`f5deb3`,wEte:`ffffff`,wEtesmoke:`f5f5f5`,Lw:`ffff00`,LwgYF:`9acd32`};function Yc(){let e={},t=Object.keys(Jc),n=Object.keys(qc),r,i,a,o,s;for(r=0;r<t.length;r++){for(o=s=t[r],i=0;i<n.length;i++)a=n[i],s=s.replace(a,qc[a]);a=parseInt(Jc[o],16),e[s]=[a>>16&255,a>>8&255,a&255]}return e}var Xc;function Zc(e){Xc||(Xc=Yc(),Xc.transparent=[0,0,0,0]);let t=Xc[e.toLowerCase()];return t&&{r:t[0],g:t[1],b:t[2],a:t.length===4?t[3]:255}}var Qc=/^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;function $c(e){let t=Qc.exec(e),n=255,r,i,a;if(t){if(t[7]!==r){let e=+t[7];n=t[8]?bc(e):yc(e*255,0,255)}return r=+t[1],i=+t[3],a=+t[5],r=255&(t[2]?bc(r):yc(r,0,255)),i=255&(t[4]?bc(i):yc(i,0,255)),a=255&(t[6]?bc(a):yc(a,0,255)),{r,g:i,b:a,a:n}}}function el(e){return e&&(e.a<255?`rgba(${e.r}, ${e.g}, ${e.b}, ${Sc(e.a)})`:`rgb(${e.r}, ${e.g}, ${e.b})`)}var tl=e=>e<=.0031308?e*12.92:e**(1/2.4)*1.055-.055,nl=e=>e<=.04045?e/12.92:((e+.055)/1.055)**2.4;function rl(e,t,n){let r=nl(Sc(e.r)),i=nl(Sc(e.g)),a=nl(Sc(e.b));return{r:xc(tl(r+n*(nl(Sc(t.r))-r))),g:xc(tl(i+n*(nl(Sc(t.g))-i))),b:xc(tl(a+n*(nl(Sc(t.b))-a))),a:e.a+n*(t.a-e.a)}}function il(e,t,n){if(e){let r=Rc(e);r[t]=Math.max(0,Math.min(r[t]+r[t]*n,t===0?360:1)),r=Bc(r),e.r=r[0],e.g=r[1],e.b=r[2]}}function al(e,t){return e&&Object.assign(t||{},e)}function ol(e){var t={r:0,g:0,b:0,a:255};return Array.isArray(e)?e.length>=3&&(t={r:e[0],g:e[1],b:e[2],a:255},e.length>3&&(t.a=xc(e[3]))):(t=al(e,{r:0,g:0,b:0,a:1}),t.a=xc(t.a)),t}function sl(e){return e.charAt(0)===`r`?$c(e):Wc(e)}var cl=class e{constructor(t){if(t instanceof e)return t;let n=typeof t,r;n===`object`?r=ol(t):n===`string`&&(r=Ac(t)||Zc(t)||sl(t)),this._rgb=r,this._valid=!!r}get valid(){return this._valid}get rgb(){var e=al(this._rgb);return e&&(e.a=Sc(e.a)),e}set rgb(e){this._rgb=ol(e)}rgbString(){return this._valid?el(this._rgb):void 0}hexString(){return this._valid?Mc(this._rgb):void 0}hslString(){return this._valid?Kc(this._rgb):void 0}mix(e,t){if(e){let n=this.rgb,r=e.rgb,i,a=t===i?.5:t,o=2*a-1,s=n.a-r.a,c=((o*s===-1?o:(o+s)/(1+o*s))+1)/2;i=1-c,n.r=255&c*n.r+i*r.r+.5,n.g=255&c*n.g+i*r.g+.5,n.b=255&c*n.b+i*r.b+.5,n.a=a*n.a+(1-a)*r.a,this.rgb=n}return this}interpolate(e,t){return e&&(this._rgb=rl(this._rgb,e._rgb,t)),this}clone(){return new e(this.rgb)}alpha(e){return this._rgb.a=xc(e),this}clearer(e){let t=this._rgb;return t.a*=1-e,this}greyscale(){let e=this._rgb;return e.r=e.g=e.b=vc(e.r*.3+e.g*.59+e.b*.11),this}opaquer(e){let t=this._rgb;return t.a*=1+e,this}negate(){let e=this._rgb;return e.r=255-e.r,e.g=255-e.g,e.b=255-e.b,this}lighten(e){return il(this._rgb,2,e),this}darken(e){return il(this._rgb,2,-e),this}saturate(e){return il(this._rgb,1,e),this}desaturate(e){return il(this._rgb,1,-e),this}rotate(e){return Gc(this._rgb,e),this}};function ll(e){return new cl(e)}function ul(){}var dl=(()=>{let e=0;return()=>e++})();function I(e){return e==null}function L(e){if(Array.isArray&&Array.isArray(e))return!0;let t=Object.prototype.toString.call(e);return t.slice(0,7)===`[object`&&t.slice(-6)===`Array]`}function R(e){return e!==null&&Object.prototype.toString.call(e)===`[object Object]`}function z(e){return(typeof e==`number`||e instanceof Number)&&isFinite(+e)}function fl(e,t){return z(e)?e:t}function B(e,t){return typeof e>`u`?t:e}var pl=(e,t)=>typeof e==`string`&&e.endsWith(`%`)?parseFloat(e)/100:+e/t,ml=(e,t)=>typeof e==`string`&&e.endsWith(`%`)?parseFloat(e)/100*t:+e;function V(e,t,n){if(e&&typeof e.call==`function`)return e.apply(n,t)}function H(e,t,n,r){let i,a,o;if(L(e))for(a=e.length,i=0;i<a;i++)t.call(n,e[i],i);else if(R(e))for(o=Object.keys(e),a=o.length,i=0;i<a;i++)t.call(n,e[o[i]],o[i])}function hl(e,t){let n,r,i,a;if(!e||!t||e.length!==t.length)return!1;for(n=0,r=e.length;n<r;++n)if(i=e[n],a=t[n],i.datasetIndex!==a.datasetIndex||i.index!==a.index)return!1;return!0}function gl(e){if(L(e))return e.map(gl);if(R(e)){let t=Object.create(null),n=Object.keys(e),r=n.length,i=0;for(;i<r;++i)t[n[i]]=gl(e[n[i]]);return t}return e}function _l(e){return[`__proto__`,`prototype`,`constructor`].indexOf(e)===-1}function vl(e,t,n,r){if(!_l(e))return;let i=t[e],a=n[e];R(i)&&R(a)?yl(i,a,r):t[e]=gl(a)}function yl(e,t,n){let r=L(t)?t:[t],i=r.length;if(!R(e))return e;n||={};let a=n.merger||vl,o;for(let t=0;t<i;++t){if(o=r[t],!R(o))continue;let i=Object.keys(o);for(let t=0,r=i.length;t<r;++t)a(i[t],e,o,n)}return e}function bl(e,t){return yl(e,t,{merger:xl})}function xl(e,t,n){if(!_l(e))return;let r=t[e],i=n[e];R(r)&&R(i)?bl(r,i):Object.prototype.hasOwnProperty.call(t,e)||(t[e]=gl(i))}var Sl={"":e=>e,x:e=>e.x,y:e=>e.y};function Cl(e){let t=e.split(`.`),n=[],r=``;for(let e of t)r+=e,r.endsWith(`\\`)?r=r.slice(0,-1)+`.`:(n.push(r),r=``);return n}function wl(e){let t=Cl(e);return e=>{for(let n of t){if(n===``)break;e&&=e[n]}return e}}function Tl(e,t){return(Sl[t]||(Sl[t]=wl(t)))(e)}function El(e){return e.charAt(0).toUpperCase()+e.slice(1)}var Dl=e=>typeof e<`u`,Ol=e=>typeof e==`function`,kl=(e,t)=>{if(e.size!==t.size)return!1;for(let n of e)if(!t.has(n))return!1;return!0};function Al(e){return e.type===`mouseup`||e.type===`click`||e.type===`contextmenu`}var U=Math.PI,W=2*U,jl=W+U,Ml=1/0,Nl=U/180,G=U/2,Pl=U/4,Fl=U*2/3,Il=Math.log10,Ll=Math.sign;function Rl(e,t,n){return Math.abs(e-t)<n}function zl(e){let t=Math.round(e);e=Rl(e,t,e/1e3)?t:e;let n=10**Math.floor(Il(e)),r=e/n;return(r<=1?1:r<=2?2:r<=5?5:10)*n}function Bl(e){let t=[],n=Math.sqrt(e),r;for(r=1;r<n;r++)e%r===0&&(t.push(r),t.push(e/r));return n===(n|0)&&t.push(n),t.sort((e,t)=>e-t).pop(),t}function Vl(e){return typeof e==`symbol`||typeof e==`object`&&!!e&&!(Symbol.toPrimitive in e||`toString`in e||`valueOf`in e)}function Hl(e){return!Vl(e)&&!isNaN(parseFloat(e))&&isFinite(e)}function Ul(e,t){let n=Math.round(e);return n-t<=e&&n+t>=e}function Wl(e,t,n){let r,i,a;for(r=0,i=e.length;r<i;r++)a=e[r][n],isNaN(a)||(t.min=Math.min(t.min,a),t.max=Math.max(t.max,a))}function Gl(e){return U/180*e}function Kl(e){return 180/U*e}function ql(e){if(!z(e))return;let t=1,n=0;for(;Math.round(e*t)/t!==e;)t*=10,n++;return n}function Jl(e,t){let n=t.x-e.x,r=t.y-e.y,i=Math.sqrt(n*n+r*r),a=Math.atan2(r,n);return a<-.5*U&&(a+=W),{angle:a,distance:i}}function Yl(e,t){return Math.sqrt((t.x-e.x)**2+(t.y-e.y)**2)}function Xl(e,t){return(e-t+jl)%W-U}function Zl(e){return(e%W+W)%W}function Ql(e,t,n,r){let i=Zl(e),a=Zl(t),o=Zl(n),s=Zl(a-i),c=Zl(o-i),l=Zl(i-a),u=Zl(i-o);return i===a||i===o||r&&a===o||s>c&&l<u}function K(e,t,n){return Math.max(t,Math.min(n,e))}function $l(e){return K(e,-32768,32767)}function eu(e,t,n,r=1e-6){return e>=Math.min(t,n)-r&&e<=Math.max(t,n)+r}function tu(e,t,n){n||=(n=>e[n]<t);let r=e.length-1,i=0,a;for(;r-i>1;)a=i+r>>1,n(a)?i=a:r=a;return{lo:i,hi:r}}var nu=(e,t,n,r)=>tu(e,n,r?r=>{let i=e[r][t];return i<n||i===n&&e[r+1][t]===n}:r=>e[r][t]<n),ru=(e,t,n)=>tu(e,n,r=>e[r][t]>=n);function iu(e,t,n){let r=0,i=e.length;for(;r<i&&e[r]<t;)r++;for(;i>r&&e[i-1]>n;)i--;return r>0||i<e.length?e.slice(r,i):e}var au=[`push`,`pop`,`shift`,`splice`,`unshift`];function ou(e,t){if(e._chartjs){e._chartjs.listeners.push(t);return}Object.defineProperty(e,"_chartjs",{configurable:!0,enumerable:!1,value:{listeners:[t]}}),au.forEach(t=>{let n=`_onData`+El(t),r=e[t];Object.defineProperty(e,t,{configurable:!0,enumerable:!1,value(...t){let i=r.apply(this,t);return e._chartjs.listeners.forEach(e=>{typeof e[n]==`function`&&e[n](...t)}),i}})})}function su(e,t){let n=e._chartjs;if(!n)return;let r=n.listeners,i=r.indexOf(t);i!==-1&&r.splice(i,1),!(r.length>0)&&(au.forEach(t=>{delete e[t]}),delete e._chartjs)}function cu(e){let t=new Set(e);return t.size===e.length?e:Array.from(t)}var lu=function(){return typeof window>`u`?function(e){return e()}:window.requestAnimationFrame}();function uu(e,t){let n=[],r=!1;return function(...i){n=i,r||(r=!0,lu.call(window,()=>{r=!1,e.apply(t,n)}))}}function du(e,t){let n;return function(...r){return t?(clearTimeout(n),n=setTimeout(e,t,r)):e.apply(this,r),t}}var fu=e=>e===`start`?`left`:e===`end`?`right`:`center`,pu=(e,t,n)=>e===`start`?t:e===`end`?n:(t+n)/2,mu=(e,t,n,r)=>e===(r?`left`:`right`)?n:e===`center`?(t+n)/2:t;function hu(e,t,n){let r=t.length,i=0,a=r;if(e._sorted){let{iScale:o,vScale:s,_parsed:c}=e,l=e.dataset&&e.dataset.options?e.dataset.options.spanGaps:null,u=o.axis,{min:d,max:f,minDefined:p,maxDefined:m}=o.getUserBounds();if(p){if(i=Math.min(nu(c,u,d).lo,n?r:nu(t,u,o.getPixelForValue(d)).lo),l){let e=c.slice(0,i+1).reverse().findIndex(e=>!I(e[s.axis]));i-=Math.max(0,e)}i=K(i,0,r-1)}if(m){let e=Math.max(nu(c,o.axis,f,!0).hi+1,n?0:nu(t,u,o.getPixelForValue(f),!0).hi+1);if(l){let t=c.slice(e-1).findIndex(e=>!I(e[s.axis]));e+=Math.max(0,t)}a=K(e,i,r)-i}else a=r-i}return{start:i,count:a}}function gu(e){let{xScale:t,yScale:n,_scaleRanges:r}=e,i={xmin:t.min,xmax:t.max,ymin:n.min,ymax:n.max};if(!r)return e._scaleRanges=i,!0;let a=r.xmin!==t.min||r.xmax!==t.max||r.ymin!==n.min||r.ymax!==n.max;return Object.assign(r,i),a}var _u=e=>e===0||e===1,vu=(e,t,n)=>-(2**(10*--e)*Math.sin((e-t)*W/n)),yu=(e,t,n)=>2**(-10*e)*Math.sin((e-t)*W/n)+1,bu={linear:e=>e,easeInQuad:e=>e*e,easeOutQuad:e=>-e*(e-2),easeInOutQuad:e=>(e/=.5)<1?.5*e*e:-.5*(--e*(e-2)-1),easeInCubic:e=>e*e*e,easeOutCubic:e=>--e*e*e+1,easeInOutCubic:e=>(e/=.5)<1?.5*e*e*e:.5*((e-=2)*e*e+2),easeInQuart:e=>e*e*e*e,easeOutQuart:e=>-(--e*e*e*e-1),easeInOutQuart:e=>(e/=.5)<1?.5*e*e*e*e:-.5*((e-=2)*e*e*e-2),easeInQuint:e=>e*e*e*e*e,easeOutQuint:e=>--e*e*e*e*e+1,easeInOutQuint:e=>(e/=.5)<1?.5*e*e*e*e*e:.5*((e-=2)*e*e*e*e+2),easeInSine:e=>-Math.cos(e*G)+1,easeOutSine:e=>Math.sin(e*G),easeInOutSine:e=>-.5*(Math.cos(U*e)-1),easeInExpo:e=>e===0?0:2**(10*(e-1)),easeOutExpo:e=>e===1?1:-(2**(-10*e))+1,easeInOutExpo:e=>_u(e)?e:e<.5?.5*2**(10*(e*2-1)):.5*(-(2**(-10*(e*2-1)))+2),easeInCirc:e=>e>=1?e:-(Math.sqrt(1-e*e)-1),easeOutCirc:e=>Math.sqrt(1- --e*e),easeInOutCirc:e=>(e/=.5)<1?-.5*(Math.sqrt(1-e*e)-1):.5*(Math.sqrt(1-(e-=2)*e)+1),easeInElastic:e=>_u(e)?e:vu(e,.075,.3),easeOutElastic:e=>_u(e)?e:yu(e,.075,.3),easeInOutElastic(e){return _u(e)?e:e<.5?.5*vu(e*2,.1125,.45):.5+.5*yu(e*2-1,.1125,.45)},easeInBack(e){return e*e*(2.70158*e-1.70158)},easeOutBack(e){return--e*e*(2.70158*e+1.70158)+1},easeInOutBack(e){let t=1.70158;return(e/=.5)<1?.5*(e*e*(((t*=1.525)+1)*e-t)):.5*((e-=2)*e*(((t*=1.525)+1)*e+t)+2)},easeInBounce:e=>1-bu.easeOutBounce(1-e),easeOutBounce(e){return e<1/2.75?7.5625*e*e:e<2/2.75?7.5625*(e-=1.5/2.75)*e+.75:e<2.5/2.75?7.5625*(e-=2.25/2.75)*e+.9375:7.5625*(e-=2.625/2.75)*e+.984375},easeInOutBounce:e=>e<.5?bu.easeInBounce(e*2)*.5:bu.easeOutBounce(e*2-1)*.5+.5};function xu(e){if(e&&typeof e==`object`){let t=e.toString();return t===`[object CanvasPattern]`||t===`[object CanvasGradient]`}return!1}function Su(e){return xu(e)?e:new cl(e)}function Cu(e){return xu(e)?e:new cl(e).saturate(.5).darken(.1).hexString()}var wu=[`x`,`y`,`borderWidth`,`radius`,`tension`],Tu=[`color`,`borderColor`,`backgroundColor`];function Eu(e){e.set(`animation`,{delay:void 0,duration:1e3,easing:`easeOutQuart`,fn:void 0,from:void 0,loop:void 0,to:void 0,type:void 0}),e.describe(`animation`,{_fallback:!1,_indexable:!1,_scriptable:e=>e!==`onProgress`&&e!==`onComplete`&&e!==`fn`}),e.set(`animations`,{colors:{type:`color`,properties:Tu},numbers:{type:`number`,properties:wu}}),e.describe(`animations`,{_fallback:`animation`}),e.set(`transitions`,{active:{animation:{duration:400}},resize:{animation:{duration:0}},show:{animations:{colors:{from:`transparent`},visible:{type:`boolean`,duration:0}}},hide:{animations:{colors:{to:`transparent`},visible:{type:`boolean`,easing:`linear`,fn:e=>e|0}}}})}function Du(e){e.set(`layout`,{autoPadding:!0,padding:{top:0,right:0,bottom:0,left:0}})}var Ou=new Map;function ku(e,t){t||={};let n=e+JSON.stringify(t),r=Ou.get(n);return r||(r=new Intl.NumberFormat(e,t),Ou.set(n,r)),r}function Au(e,t,n){return ku(t,n).format(e)}var ju={values(e){return L(e)?e:``+e},numeric(e,t,n){if(e===0)return`0`;let r=this.chart.options.locale,i,a=e;if(n.length>1){let t=Math.max(Math.abs(n[0].value),Math.abs(n[n.length-1].value));(t<1e-4||t>0x38d7ea4c68000)&&(i=`scientific`),a=Mu(e,n)}let o=Il(Math.abs(a)),s=isNaN(o)?1:Math.max(Math.min(-1*Math.floor(o),20),0),c={notation:i,minimumFractionDigits:s,maximumFractionDigits:s};return Object.assign(c,this.options.ticks.format),Au(e,r,c)},logarithmic(e,t,n){if(e===0)return`0`;let r=n[t].significand||e/10**Math.floor(Il(e));return[1,2,3,5,10,15].includes(r)||t>.8*n.length?ju.numeric.call(this,e,t,n):``}};function Mu(e,t){let n=t.length>3?t[2].value-t[1].value:t[1].value-t[0].value;return Math.abs(n)>=1&&e!==Math.floor(e)&&(n=e-Math.floor(e)),n}var Nu={formatters:ju};function Pu(e){e.set(`scale`,{display:!0,offset:!1,reverse:!1,beginAtZero:!1,bounds:`ticks`,clip:!0,grace:0,grid:{display:!0,lineWidth:1,drawOnChartArea:!0,drawTicks:!0,tickLength:8,tickWidth:(e,t)=>t.lineWidth,tickColor:(e,t)=>t.color,offset:!1},border:{display:!0,dash:[],dashOffset:0,width:1},title:{display:!1,text:``,padding:{top:4,bottom:4}},ticks:{minRotation:0,maxRotation:50,mirror:!1,textStrokeWidth:0,textStrokeColor:``,padding:3,display:!0,autoSkip:!0,autoSkipPadding:3,labelOffset:0,callback:Nu.formatters.values,minor:{},major:{},align:`center`,crossAlign:`near`,showLabelBackdrop:!1,backdropColor:`rgba(255, 255, 255, 0.75)`,backdropPadding:2}}),e.route(`scale.ticks`,`color`,``,`color`),e.route(`scale.grid`,`color`,``,`borderColor`),e.route(`scale.border`,`color`,``,`borderColor`),e.route(`scale.title`,`color`,``,`color`),e.describe(`scale`,{_fallback:!1,_scriptable:e=>!e.startsWith(`before`)&&!e.startsWith(`after`)&&e!==`callback`&&e!==`parser`,_indexable:e=>e!==`borderDash`&&e!==`tickBorderDash`&&e!==`dash`}),e.describe(`scales`,{_fallback:`scale`}),e.describe(`scale.ticks`,{_scriptable:e=>e!==`backdropPadding`&&e!==`callback`,_indexable:e=>e!==`backdropPadding`})}var Fu=Object.create(null),Iu=Object.create(null);function Lu(e,t){if(!t)return e;let n=t.split(`.`);for(let t=0,r=n.length;t<r;++t){let r=n[t];e=e[r]||(e[r]=Object.create(null))}return e}function Ru(e,t,n){return typeof t==`string`?yl(Lu(e,t),n):yl(Lu(e,``),t)}var q=new class{constructor(e,t){this.animation=void 0,this.backgroundColor=`rgba(0,0,0,0.1)`,this.borderColor=`rgba(0,0,0,0.1)`,this.color=`#666`,this.datasets={},this.devicePixelRatio=e=>e.chart.platform.getDevicePixelRatio(),this.elements={},this.events=[`mousemove`,`mouseout`,`click`,`touchstart`,`touchmove`],this.font={family:`'Helvetica Neue', 'Helvetica', 'Arial', sans-serif`,size:12,style:`normal`,lineHeight:1.2,weight:null},this.hover={},this.hoverBackgroundColor=(e,t)=>Cu(t.backgroundColor),this.hoverBorderColor=(e,t)=>Cu(t.borderColor),this.hoverColor=(e,t)=>Cu(t.color),this.indexAxis=`x`,this.interaction={mode:`nearest`,intersect:!0,includeInvisible:!1},this.maintainAspectRatio=!0,this.onHover=null,this.onClick=null,this.parsing=!0,this.plugins={},this.responsive=!0,this.scale=void 0,this.scales={},this.showLine=!0,this.drawActiveElementsOnTop=!0,this.describe(e),this.apply(t)}set(e,t){return Ru(this,e,t)}get(e){return Lu(this,e)}describe(e,t){return Ru(Iu,e,t)}override(e,t){return Ru(Fu,e,t)}route(e,t,n,r){let i=Lu(this,e),a=Lu(this,n),o=`_`+t;Object.defineProperties(i,{[o]:{value:i[t],writable:!0},[t]:{enumerable:!0,get(){let e=this[o],t=a[r];return R(e)?Object.assign({},t,e):B(e,t)},set(e){this[o]=e}}})}apply(e){e.forEach(e=>e(this))}}({_scriptable:e=>!e.startsWith(`on`),_indexable:e=>e!==`events`,hover:{_fallback:`interaction`},interaction:{_scriptable:!1,_indexable:!1}},[Eu,Du,Pu]);function zu(e){return!e||I(e.size)||I(e.family)?null:(e.style?e.style+` `:``)+(e.weight?e.weight+` `:``)+e.size+`px `+e.family}function Bu(e,t,n,r,i){let a=t[i];return a||(a=t[i]=e.measureText(i).width,n.push(i)),a>r&&(r=a),r}function Vu(e,t,n,r){r||={};let i=r.data=r.data||{},a=r.garbageCollect=r.garbageCollect||[];r.font!==t&&(i=r.data={},a=r.garbageCollect=[],r.font=t),e.save(),e.font=t;let o=0,s=n.length,c,l,u,d,f;for(c=0;c<s;c++)if(d=n[c],d!=null&&!L(d))o=Bu(e,i,a,o,d);else if(L(d))for(l=0,u=d.length;l<u;l++)f=d[l],f!=null&&!L(f)&&(o=Bu(e,i,a,o,f));e.restore();let p=a.length/2;if(p>n.length){for(c=0;c<p;c++)delete i[a[c]];a.splice(0,p)}return o}function Hu(e,t,n){let r=e.currentDevicePixelRatio,i=n===0?0:Math.max(n/2,.5);return Math.round((t-i)*r)/r+i}function Uu(e,t){!t&&!e||(t||=e.getContext(`2d`),t.save(),t.resetTransform(),t.clearRect(0,0,e.width,e.height),t.restore())}function Wu(e,t,n,r){Gu(e,t,n,r,null)}function Gu(e,t,n,r,i){let a,o,s,c,l,u,d,f,p=t.pointStyle,m=t.rotation,h=t.radius,g=(m||0)*Nl;if(p&&typeof p==`object`&&(a=p.toString(),a===`[object HTMLImageElement]`||a===`[object HTMLCanvasElement]`)){e.save(),e.translate(n,r),e.rotate(g),e.drawImage(p,-p.width/2,-p.height/2,p.width,p.height),e.restore();return}if(!(isNaN(h)||h<=0)){switch(e.beginPath(),p){default:i?e.ellipse(n,r,i/2,h,0,0,W):e.arc(n,r,h,0,W),e.closePath();break;case`triangle`:u=i?i/2:h,e.moveTo(n+Math.sin(g)*u,r-Math.cos(g)*h),g+=Fl,e.lineTo(n+Math.sin(g)*u,r-Math.cos(g)*h),g+=Fl,e.lineTo(n+Math.sin(g)*u,r-Math.cos(g)*h),e.closePath();break;case`rectRounded`:l=h*.516,c=h-l,o=Math.cos(g+Pl)*c,d=Math.cos(g+Pl)*(i?i/2-l:c),s=Math.sin(g+Pl)*c,f=Math.sin(g+Pl)*(i?i/2-l:c),e.arc(n-d,r-s,l,g-U,g-G),e.arc(n+f,r-o,l,g-G,g),e.arc(n+d,r+s,l,g,g+G),e.arc(n-f,r+o,l,g+G,g+U),e.closePath();break;case`rect`:if(!m){c=Math.SQRT1_2*h,u=i?i/2:c,e.rect(n-u,r-c,2*u,2*c);break}g+=Pl;case`rectRot`:d=Math.cos(g)*(i?i/2:h),o=Math.cos(g)*h,s=Math.sin(g)*h,f=Math.sin(g)*(i?i/2:h),e.moveTo(n-d,r-s),e.lineTo(n+f,r-o),e.lineTo(n+d,r+s),e.lineTo(n-f,r+o),e.closePath();break;case`crossRot`:g+=Pl;case`cross`:d=Math.cos(g)*(i?i/2:h),o=Math.cos(g)*h,s=Math.sin(g)*h,f=Math.sin(g)*(i?i/2:h),e.moveTo(n-d,r-s),e.lineTo(n+d,r+s),e.moveTo(n+f,r-o),e.lineTo(n-f,r+o);break;case`star`:d=Math.cos(g)*(i?i/2:h),o=Math.cos(g)*h,s=Math.sin(g)*h,f=Math.sin(g)*(i?i/2:h),e.moveTo(n-d,r-s),e.lineTo(n+d,r+s),e.moveTo(n+f,r-o),e.lineTo(n-f,r+o),g+=Pl,d=Math.cos(g)*(i?i/2:h),o=Math.cos(g)*h,s=Math.sin(g)*h,f=Math.sin(g)*(i?i/2:h),e.moveTo(n-d,r-s),e.lineTo(n+d,r+s),e.moveTo(n+f,r-o),e.lineTo(n-f,r+o);break;case`line`:o=i?i/2:Math.cos(g)*h,s=Math.sin(g)*h,e.moveTo(n-o,r-s),e.lineTo(n+o,r+s);break;case`dash`:e.moveTo(n,r),e.lineTo(n+Math.cos(g)*(i?i/2:h),r+Math.sin(g)*h);break;case!1:e.closePath()}e.fill(),t.borderWidth>0&&e.stroke()}}function Ku(e,t,n){return n||=.5,!t||e&&e.x>t.left-n&&e.x<t.right+n&&e.y>t.top-n&&e.y<t.bottom+n}function qu(e,t){e.save(),e.beginPath(),e.rect(t.left,t.top,t.right-t.left,t.bottom-t.top),e.clip()}function Ju(e){e.restore()}function Yu(e,t,n,r,i){if(!t)return e.lineTo(n.x,n.y);if(i===`middle`){let r=(t.x+n.x)/2;e.lineTo(r,t.y),e.lineTo(r,n.y)}else i===`after`==!!r?e.lineTo(n.x,t.y):e.lineTo(t.x,n.y);e.lineTo(n.x,n.y)}function Xu(e,t,n,r){if(!t)return e.lineTo(n.x,n.y);e.bezierCurveTo(r?t.cp1x:t.cp2x,r?t.cp1y:t.cp2y,r?n.cp2x:n.cp1x,r?n.cp2y:n.cp1y,n.x,n.y)}function Zu(e,t){t.translation&&e.translate(t.translation[0],t.translation[1]),I(t.rotation)||e.rotate(t.rotation),t.color&&(e.fillStyle=t.color),t.textAlign&&(e.textAlign=t.textAlign),t.textBaseline&&(e.textBaseline=t.textBaseline)}function Qu(e,t,n,r,i){if(i.strikethrough||i.underline){let a=e.measureText(r),o=t-a.actualBoundingBoxLeft,s=t+a.actualBoundingBoxRight,c=n-a.actualBoundingBoxAscent,l=n+a.actualBoundingBoxDescent,u=i.strikethrough?(c+l)/2:l;e.strokeStyle=e.fillStyle,e.beginPath(),e.lineWidth=i.decorationWidth||2,e.moveTo(o,u),e.lineTo(s,u),e.stroke()}}function $u(e,t){let n=e.fillStyle;e.fillStyle=t.color,e.fillRect(t.left,t.top,t.width,t.height),e.fillStyle=n}function ed(e,t,n,r,i,a={}){let o=L(t)?t:[t],s=a.strokeWidth>0&&a.strokeColor!==``,c,l;for(e.save(),e.font=i.string,Zu(e,a),c=0;c<o.length;++c)l=o[c],a.backdrop&&$u(e,a.backdrop),s&&(a.strokeColor&&(e.strokeStyle=a.strokeColor),I(a.strokeWidth)||(e.lineWidth=a.strokeWidth),e.strokeText(l,n,r,a.maxWidth)),e.fillText(l,n,r,a.maxWidth),Qu(e,n,r,l,a),r+=Number(i.lineHeight);e.restore()}function td(e,t){let{x:n,y:r,w:i,h:a,radius:o}=t;e.arc(n+o.topLeft,r+o.topLeft,o.topLeft,1.5*U,U,!0),e.lineTo(n,r+a-o.bottomLeft),e.arc(n+o.bottomLeft,r+a-o.bottomLeft,o.bottomLeft,U,G,!0),e.lineTo(n+i-o.bottomRight,r+a),e.arc(n+i-o.bottomRight,r+a-o.bottomRight,o.bottomRight,G,0,!0),e.lineTo(n+i,r+o.topRight),e.arc(n+i-o.topRight,r+o.topRight,o.topRight,0,-G,!0),e.lineTo(n+o.topLeft,r)}var nd=/^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/,rd=/^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/;function id(e,t){let n=(``+e).match(nd);if(!n||n[1]===`normal`)return t*1.2;switch(e=+n[2],n[3]){case`px`:return e;case`%`:e/=100}return t*e}var ad=e=>+e||0;function od(e,t){let n={},r=R(t),i=r?Object.keys(t):t,a=R(e)?r?n=>B(e[n],e[t[n]]):t=>e[t]:()=>e;for(let e of i)n[e]=ad(a(e));return n}function sd(e){return od(e,{top:`y`,right:`x`,bottom:`y`,left:`x`})}function cd(e){return od(e,[`topLeft`,`topRight`,`bottomLeft`,`bottomRight`])}function ld(e){let t=sd(e);return t.width=t.left+t.right,t.height=t.top+t.bottom,t}function J(e,t){e||={},t||=q.font;let n=B(e.size,t.size);typeof n==`string`&&(n=parseInt(n,10));let r=B(e.style,t.style);r&&!(``+r).match(rd)&&(console.warn(`Invalid font style specified: "`+r+`"`),r=void 0);let i={family:B(e.family,t.family),lineHeight:id(B(e.lineHeight,t.lineHeight),n),size:n,style:r,weight:B(e.weight,t.weight),string:``};return i.string=zu(i),i}function Y(e,t,n,r){let i,a,o;for(i=0,a=e.length;i<a;++i)if(o=e[i],o!==void 0&&(t!==void 0&&typeof o==`function`&&(o=o(t)),n!==void 0&&L(o)&&(o=o[n%o.length]),o!==void 0))return o}function ud(e,t,n){let{min:r,max:i}=e,a=ml(t,(i-r)/2),o=(e,t)=>n&&e===0?0:e+t;return{min:o(r,-Math.abs(a)),max:o(i,a)}}function dd(e,t){return Object.assign(Object.create(e),t)}function fd(e,t=[``],n,r,i=()=>e[0]){let a=n||e;return typeof r>`u`&&(r=Od(`_fallback`,e)),new Proxy({[Symbol.toStringTag]:`Object`,_cacheable:!0,_scopes:e,_rootScopes:a,_fallback:r,_getTarget:i,override:n=>fd([n,...e],t,a,r)},{deleteProperty(t,n){return delete t[n],delete t._keys,delete e[0][n],!0},get(n,r){return _d(n,r,()=>Dd(r,t,e,n))},getOwnPropertyDescriptor(e,t){return Reflect.getOwnPropertyDescriptor(e._scopes[0],t)},getPrototypeOf(){return Reflect.getPrototypeOf(e[0])},has(e,t){return kd(e).includes(t)},ownKeys(e){return kd(e)},set(e,t,n){let r=e._storage||=i();return e[t]=r[t]=n,delete e._keys,!0}})}function pd(e,t,n,r){let i={_cacheable:!1,_proxy:e,_context:t,_subProxy:n,_stack:new Set,_descriptors:md(e,r),setContext:t=>pd(e,t,n,r),override:i=>pd(e.override(i),t,n,r)};return new Proxy(i,{deleteProperty(t,n){return delete t[n],delete e[n],!0},get(e,t,n){return _d(e,t,()=>vd(e,t,n))},getOwnPropertyDescriptor(t,n){return t._descriptors.allKeys?Reflect.has(e,n)?{enumerable:!0,configurable:!0}:void 0:Reflect.getOwnPropertyDescriptor(e,n)},getPrototypeOf(){return Reflect.getPrototypeOf(e)},has(t,n){return Reflect.has(e,n)},ownKeys(){return Reflect.ownKeys(e)},set(t,n,r){return e[n]=r,delete t[n],!0}})}function md(e,t={scriptable:!0,indexable:!0}){let{_scriptable:n=t.scriptable,_indexable:r=t.indexable,_allKeys:i=t.allKeys}=e;return{allKeys:i,scriptable:n,indexable:r,isScriptable:Ol(n)?n:()=>n,isIndexable:Ol(r)?r:()=>r}}var hd=(e,t)=>e?e+El(t):t,gd=(e,t)=>R(t)&&e!==`adapters`&&(Object.getPrototypeOf(t)===null||t.constructor===Object);function _d(e,t,n){if(Object.prototype.hasOwnProperty.call(e,t)||t===`constructor`)return e[t];let r=n();return e[t]=r,r}function vd(e,t,n){let{_proxy:r,_context:i,_subProxy:a,_descriptors:o}=e,s=r[t];return Ol(s)&&o.isScriptable(t)&&(s=yd(t,s,e,n)),L(s)&&s.length&&(s=bd(t,s,e,o.isIndexable)),gd(t,s)&&(s=pd(s,i,a&&a[t],o)),s}function yd(e,t,n,r){let{_proxy:i,_context:a,_subProxy:o,_stack:s}=n;if(s.has(e))throw Error(`Recursion detected: `+Array.from(s).join(`->`)+`->`+e);s.add(e);let c=t(a,o||r);return s.delete(e),gd(e,c)&&(c=wd(i._scopes,i,e,c)),c}function bd(e,t,n,r){let{_proxy:i,_context:a,_subProxy:o,_descriptors:s}=n;if(typeof a.index<`u`&&r(e))return t[a.index%t.length];if(R(t[0])){let n=t,r=i._scopes.filter(e=>e!==n);t=[];for(let c of n){let n=wd(r,i,e,c);t.push(pd(n,a,o&&o[e],s))}}return t}function xd(e,t,n){return Ol(e)?e(t,n):e}var Sd=(e,t)=>e===!0?t:typeof e==`string`?Tl(t,e):void 0;function Cd(e,t,n,r,i){for(let a of t){let t=Sd(n,a);if(t){e.add(t);let a=xd(t._fallback,n,i);if(typeof a<`u`&&a!==n&&a!==r)return a}else if(t===!1&&typeof r<`u`&&n!==r)return null}return!1}function wd(e,t,n,r){let i=t._rootScopes,a=xd(t._fallback,n,r),o=[...e,...i],s=new Set;s.add(r);let c=Td(s,o,n,a||n,r);return c===null||typeof a<`u`&&a!==n&&(c=Td(s,o,a,c,r),c===null)?!1:fd(Array.from(s),[``],i,a,()=>Ed(t,n,r))}function Td(e,t,n,r,i){for(;n;)n=Cd(e,t,n,r,i);return n}function Ed(e,t,n){let r=e._getTarget();t in r||(r[t]={});let i=r[t];return L(i)&&R(n)?n:i||{}}function Dd(e,t,n,r){let i;for(let a of t)if(i=Od(hd(a,e),n),typeof i<`u`)return gd(e,i)?wd(n,r,e,i):i}function Od(e,t){for(let n of t){if(!n)continue;let t=n[e];if(typeof t<`u`)return t}}function kd(e){let t=e._keys;return t||=e._keys=Ad(e._scopes),t}function Ad(e){let t=new Set;for(let n of e)for(let e of Object.keys(n).filter(e=>!e.startsWith(`_`)))t.add(e);return Array.from(t)}function jd(e,t,n,r){let{iScale:i}=e,{key:a=`r`}=this._parsing,o=Array(r),s,c,l,u;for(s=0,c=r;s<c;++s)l=s+n,u=t[l],o[s]={r:i.parse(Tl(u,a),l)};return o}var Md=2**-52||1e-14,Nd=(e,t)=>t<e.length&&!e[t].skip&&e[t],Pd=e=>e===`x`?`y`:`x`;function Fd(e,t,n,r){let i=e.skip?t:e,a=t,o=n.skip?t:n,s=Yl(a,i),c=Yl(o,a),l=s/(s+c),u=c/(s+c);l=isNaN(l)?0:l,u=isNaN(u)?0:u;let d=r*l,f=r*u;return{previous:{x:a.x-d*(o.x-i.x),y:a.y-d*(o.y-i.y)},next:{x:a.x+f*(o.x-i.x),y:a.y+f*(o.y-i.y)}}}function Id(e,t,n){let r=e.length,i,a,o,s,c,l=Nd(e,0);for(let u=0;u<r-1;++u)if(c=l,l=Nd(e,u+1),!(!c||!l)){if(Rl(t[u],0,Md)){n[u]=n[u+1]=0;continue}i=n[u]/t[u],a=n[u+1]/t[u],s=i**2+a**2,!(s<=9)&&(o=3/Math.sqrt(s),n[u]=i*o*t[u],n[u+1]=a*o*t[u])}}function Ld(e,t,n=`x`){let r=Pd(n),i=e.length,a,o,s,c=Nd(e,0);for(let l=0;l<i;++l){if(o=s,s=c,c=Nd(e,l+1),!s)continue;let i=s[n],u=s[r];o&&(a=(i-o[n])/3,s[`cp1${n}`]=i-a,s[`cp1${r}`]=u-a*t[l]),c&&(a=(c[n]-i)/3,s[`cp2${n}`]=i+a,s[`cp2${r}`]=u+a*t[l])}}function Rd(e,t=`x`){let n=Pd(t),r=e.length,i=Array(r).fill(0),a=Array(r),o,s,c,l=Nd(e,0);for(o=0;o<r;++o)if(s=c,c=l,l=Nd(e,o+1),c){if(l){let e=l[t]-c[t];i[o]=e===0?0:(l[n]-c[n])/e}a[o]=s?l?Ll(i[o-1])===Ll(i[o])?(i[o-1]+i[o])/2:0:i[o-1]:i[o]}Id(e,i,a),Ld(e,a,t)}function zd(e,t,n){return Math.max(Math.min(e,n),t)}function Bd(e,t){let n,r,i,a,o,s=Ku(e[0],t);for(n=0,r=e.length;n<r;++n)o=a,a=s,s=n<r-1&&Ku(e[n+1],t),a&&(i=e[n],o&&(i.cp1x=zd(i.cp1x,t.left,t.right),i.cp1y=zd(i.cp1y,t.top,t.bottom)),s&&(i.cp2x=zd(i.cp2x,t.left,t.right),i.cp2y=zd(i.cp2y,t.top,t.bottom)))}function Vd(e,t,n,r,i){let a,o,s,c;if(t.spanGaps&&(e=e.filter(e=>!e.skip)),t.cubicInterpolationMode===`monotone`)Rd(e,i);else{let n=r?e[e.length-1]:e[0];for(a=0,o=e.length;a<o;++a)s=e[a],c=Fd(n,s,e[Math.min(a+1,o-+!r)%o],t.tension),s.cp1x=c.previous.x,s.cp1y=c.previous.y,s.cp2x=c.next.x,s.cp2y=c.next.y,n=s}t.capBezierPoints&&Bd(e,n)}function Hd(){return typeof window<`u`&&typeof document<`u`}function Ud(e){let t=e.parentNode;return t&&t.toString()===`[object ShadowRoot]`&&(t=t.host),t}function Wd(e,t,n){let r;return typeof e==`string`?(r=parseInt(e,10),e.indexOf(`%`)!==-1&&(r=r/100*t.parentNode[n])):r=e,r}var Gd=e=>e.ownerDocument.defaultView.getComputedStyle(e,null);function Kd(e,t){return Gd(e).getPropertyValue(t)}var qd=[`top`,`right`,`bottom`,`left`];function Jd(e,t,n){let r={};n=n?`-`+n:``;for(let i=0;i<4;i++){let a=qd[i];r[a]=parseFloat(e[t+`-`+a+n])||0}return r.width=r.left+r.right,r.height=r.top+r.bottom,r}var Yd=(e,t,n)=>(e>0||t>0)&&(!n||!n.shadowRoot);function Xd(e,t){let n=e.touches,r=n&&n.length?n[0]:e,{offsetX:i,offsetY:a}=r,o=!1,s,c;if(Yd(i,a,e.target))s=i,c=a;else{let e=t.getBoundingClientRect();s=r.clientX-e.left,c=r.clientY-e.top,o=!0}return{x:s,y:c,box:o}}function Zd(e,t){if(`native`in e)return e;let{canvas:n,currentDevicePixelRatio:r}=t,i=Gd(n),a=i.boxSizing===`border-box`,o=Jd(i,`padding`),s=Jd(i,`border`,`width`),{x:c,y:l,box:u}=Xd(e,n),d=o.left+(u&&s.left),f=o.top+(u&&s.top),{width:p,height:m}=t;return a&&(p-=o.width+s.width,m-=o.height+s.height),{x:Math.round((c-d)/p*n.width/r),y:Math.round((l-f)/m*n.height/r)}}function Qd(e,t,n){let r,i;if(t===void 0||n===void 0){let a=e&&Ud(e);if(!a)t=e.clientWidth,n=e.clientHeight;else{let e=a.getBoundingClientRect(),o=Gd(a),s=Jd(o,`border`,`width`),c=Jd(o,`padding`);t=e.width-c.width-s.width,n=e.height-c.height-s.height,r=Wd(o.maxWidth,a,`clientWidth`),i=Wd(o.maxHeight,a,`clientHeight`)}}return{width:t,height:n,maxWidth:r||Ml,maxHeight:i||Ml}}var $d=e=>Math.round(e*10)/10;function ef(e,t,n,r){let i=Gd(e),a=Jd(i,`margin`),o=Wd(i.maxWidth,e,`clientWidth`)||Ml,s=Wd(i.maxHeight,e,`clientHeight`)||Ml,c=Qd(e,t,n),{width:l,height:u}=c;if(i.boxSizing===`content-box`){let e=Jd(i,`border`,`width`),t=Jd(i,`padding`);l-=t.width+e.width,u-=t.height+e.height}return l=Math.max(0,l-a.width),u=Math.max(0,r?l/r:u-a.height),l=$d(Math.min(l,o,c.maxWidth)),u=$d(Math.min(u,s,c.maxHeight)),l&&!u&&(u=$d(l/2)),(t!==void 0||n!==void 0)&&r&&c.height&&u>c.height&&(u=c.height,l=$d(Math.floor(u*r))),{width:l,height:u}}function tf(e,t,n){let r=t||1,i=$d(e.height*r),a=$d(e.width*r);e.height=$d(e.height),e.width=$d(e.width);let o=e.canvas;return o.style&&(n||!o.style.height&&!o.style.width)&&(o.style.height=`${e.height}px`,o.style.width=`${e.width}px`),e.currentDevicePixelRatio!==r||o.height!==i||o.width!==a?(e.currentDevicePixelRatio=r,o.height=i,o.width=a,e.ctx.setTransform(r,0,0,r,0,0),!0):!1}var nf=function(){let e=!1;try{let t={get passive(){return e=!0,!1}};Hd()&&(window.addEventListener(`test`,null,t),window.removeEventListener(`test`,null,t))}catch{}return e}();function rf(e,t){let n=Kd(e,t),r=n&&n.match(/^(\d+)(\.\d+)?px$/);return r?+r[1]:void 0}function af(e,t,n,r){return{x:e.x+n*(t.x-e.x),y:e.y+n*(t.y-e.y)}}function of(e,t,n,r){return{x:e.x+n*(t.x-e.x),y:r===`middle`?n<.5?e.y:t.y:r===`after`?n<1?e.y:t.y:n>0?t.y:e.y}}function sf(e,t,n,r){let i={x:e.cp2x,y:e.cp2y},a={x:t.cp1x,y:t.cp1y},o=af(e,i,n),s=af(i,a,n),c=af(a,t,n);return af(af(o,s,n),af(s,c,n),n)}var cf=function(e,t){return{x(n){return e+e+t-n},setWidth(e){t=e},textAlign(e){return e===`center`?e:e===`right`?`left`:`right`},xPlus(e,t){return e-t},leftForLtr(e,t){return e-t}}},lf=function(){return{x(e){return e},setWidth(e){},textAlign(e){return e},xPlus(e,t){return e+t},leftForLtr(e,t){return e}}};function uf(e,t,n){return e?cf(t,n):lf()}function df(e,t){let n,r;(t===`ltr`||t===`rtl`)&&(n=e.canvas.style,r=[n.getPropertyValue(`direction`),n.getPropertyPriority(`direction`)],n.setProperty(`direction`,t,`important`),e.prevTextDirection=r)}function ff(e,t){t!==void 0&&(delete e.prevTextDirection,e.canvas.style.setProperty(`direction`,t[0],t[1]))}function pf(e){return e===`angle`?{between:Ql,compare:Xl,normalize:Zl}:{between:eu,compare:(e,t)=>e-t,normalize:e=>e}}function mf({start:e,end:t,count:n,loop:r,style:i}){return{start:e%n,end:t%n,loop:r&&(t-e+1)%n===0,style:i}}function hf(e,t,n){let{property:r,start:i,end:a}=n,{between:o,normalize:s}=pf(r),c=t.length,{start:l,end:u,loop:d}=e,f,p;if(d){for(l+=c,u+=c,f=0,p=c;f<p&&o(s(t[l%c][r]),i,a);++f)l--,u--;l%=c,u%=c}return u<l&&(u+=c),{start:l,end:u,loop:d,style:e.style}}function gf(e,t,n){if(!n)return[e];let{property:r,start:i,end:a}=n,o=t.length,{compare:s,between:c,normalize:l}=pf(r),{start:u,end:d,loop:f,style:p}=hf(e,t,n),m=[],h=!1,g=null,_,v,y,b=()=>c(i,y,_)&&s(i,y)!==0,x=()=>s(a,_)===0||c(a,y,_),S=()=>h||b(),C=()=>!h||x();for(let e=u,n=u;e<=d;++e)v=t[e%o],!v.skip&&(_=l(v[r]),_!==y&&(h=c(_,i,a),g===null&&S()&&(g=s(_,i)===0?e:n),g!==null&&C()&&(m.push(mf({start:g,end:e,loop:f,count:o,style:p})),g=null),n=e,y=_));return g!==null&&m.push(mf({start:g,end:d,loop:f,count:o,style:p})),m}function _f(e,t){let n=[],r=e.segments;for(let i=0;i<r.length;i++){let a=gf(r[i],e.points,t);a.length&&n.push(...a)}return n}function vf(e,t,n,r){let i=0,a=t-1;if(n&&!r)for(;i<t&&!e[i].skip;)i++;for(;i<t&&e[i].skip;)i++;for(i%=t,n&&(a+=i);a>i&&e[a%t].skip;)a--;return a%=t,{start:i,end:a}}function yf(e,t,n,r){let i=e.length,a=[],o=t,s=e[t],c;for(c=t+1;c<=n;++c){let n=e[c%i];n.skip||n.stop?s.skip||(r=!1,a.push({start:t%i,end:(c-1)%i,loop:r}),t=o=n.stop?c:null):(o=c,s.skip&&(t=c)),s=n}return o!==null&&a.push({start:t%i,end:o%i,loop:r}),a}function bf(e,t){let n=e.points,r=e.options.spanGaps,i=n.length;if(!i)return[];let a=!!e._loop,{start:o,end:s}=vf(n,i,a,r);return r===!0?xf(e,[{start:o,end:s,loop:a}],n,t):xf(e,yf(n,o,s<o?s+i:s,!!e._fullLoop&&o===0&&s===i-1),n,t)}function xf(e,t,n,r){return!r||!r.setContext||!n?t:Sf(e,t,n,r)}function Sf(e,t,n,r){let i=e._chart.getContext(),a=Cf(e.options),{_datasetIndex:o,options:{spanGaps:s}}=e,c=n.length,l=[],u=a,d=t[0].start,f=d;function p(e,t,r,i){let a=s?-1:1;if(e!==t){for(e+=c;n[e%c].skip;)e-=a;for(;n[t%c].skip;)t+=a;e%c!==t%c&&(l.push({start:e%c,end:t%c,loop:r,style:i}),u=i,d=t%c)}}for(let e of t){d=s?d:e.start;let t=n[d%c],a;for(f=d+1;f<=e.end;f++){let s=n[f%c];a=Cf(r.setContext(dd(i,{type:`segment`,p0:t,p1:s,p0DataIndex:(f-1)%c,p1DataIndex:f%c,datasetIndex:o}))),wf(a,u)&&p(d,f-1,e.loop,u),t=s,u=a}d<f-1&&p(d,f-1,e.loop,u)}return l}function Cf(e){return{backgroundColor:e.backgroundColor,borderCapStyle:e.borderCapStyle,borderDash:e.borderDash,borderDashOffset:e.borderDashOffset,borderJoinStyle:e.borderJoinStyle,borderWidth:e.borderWidth,borderColor:e.borderColor}}function wf(e,t){if(!t)return!1;let n=[],r=function(e,t){return xu(t)?(n.includes(t)||n.push(t),n.indexOf(t)):t};return JSON.stringify(e,r)!==JSON.stringify(t,r)}function Tf(e,t,n){return e.options.clip?e[n]:t[n]}function Ef(e,t){let{xScale:n,yScale:r}=e;return n&&r?{left:Tf(n,t,`left`),right:Tf(n,t,`right`),top:Tf(r,t,`top`),bottom:Tf(r,t,`bottom`)}:t}function Df(e,t){let n=t._clip;if(n.disabled)return!1;let r=Ef(t,e.chartArea);return{left:n.left===!1?0:r.left-(n.left===!0?0:n.left),right:n.right===!1?e.width:r.right+(n.right===!0?0:n.right),top:n.top===!1?0:r.top-(n.top===!0?0:n.top),bottom:n.bottom===!1?e.height:r.bottom+(n.bottom===!0?0:n.bottom)}}var Of=new class{constructor(){this._request=null,this._charts=new Map,this._running=!1,this._lastDate=void 0}_notify(e,t,n,r){let i=t.listeners[r],a=t.duration;i.forEach(r=>r({chart:e,initial:t.initial,numSteps:a,currentStep:Math.min(n-t.start,a)}))}_refresh(){this._request||=(this._running=!0,lu.call(window,()=>{this._update(),this._request=null,this._running&&this._refresh()}))}_update(e=Date.now()){let t=0;this._charts.forEach((n,r)=>{if(!n.running||!n.items.length)return;let i=n.items,a=i.length-1,o=!1,s;for(;a>=0;--a)s=i[a],s._active?(s._total>n.duration&&(n.duration=s._total),s.tick(e),o=!0):(i[a]=i[i.length-1],i.pop());o&&(r.draw(),this._notify(r,n,e,`progress`)),i.length||(n.running=!1,this._notify(r,n,e,`complete`),n.initial=!1),t+=i.length}),this._lastDate=e,t===0&&(this._running=!1)}_getAnims(e){let t=this._charts,n=t.get(e);return n||(n={running:!1,initial:!0,items:[],listeners:{complete:[],progress:[]}},t.set(e,n)),n}listen(e,t,n){this._getAnims(e).listeners[t].push(n)}add(e,t){!t||!t.length||this._getAnims(e).items.push(...t)}has(e){return this._getAnims(e).items.length>0}start(e){let t=this._charts.get(e);t&&(t.running=!0,t.start=Date.now(),t.duration=t.items.reduce((e,t)=>Math.max(e,t._duration),0),this._refresh())}running(e){if(!this._running)return!1;let t=this._charts.get(e);return!(!t||!t.running||!t.items.length)}stop(e){let t=this._charts.get(e);if(!t||!t.items.length)return;let n=t.items,r=n.length-1;for(;r>=0;--r)n[r].cancel();t.items=[],this._notify(e,t,Date.now(),`complete`)}remove(e){return this._charts.delete(e)}},kf=`transparent`,Af={boolean(e,t,n){return n>.5?t:e},color(e,t,n){let r=Su(e||kf),i=r.valid&&Su(t||kf);return i&&i.valid?i.mix(r,n).hexString():t},number(e,t,n){return e+(t-e)*n}},jf=class{constructor(e,t,n,r){let i=t[n];r=Y([e.to,r,i,e.from]);let a=Y([e.from,i,r]);this._active=!0,this._fn=e.fn||Af[e.type||typeof a],this._easing=bu[e.easing]||bu.linear,this._start=Math.floor(Date.now()+(e.delay||0)),this._duration=this._total=Math.floor(e.duration),this._loop=!!e.loop,this._target=t,this._prop=n,this._from=a,this._to=r,this._promises=void 0}active(){return this._active}update(e,t,n){if(this._active){this._notify(!1);let r=this._target[this._prop],i=n-this._start,a=this._duration-i;this._start=n,this._duration=Math.floor(Math.max(a,e.duration)),this._total+=i,this._loop=!!e.loop,this._to=Y([e.to,t,r,e.from]),this._from=Y([e.from,r,t])}}cancel(){this._active&&(this.tick(Date.now()),this._active=!1,this._notify(!1))}tick(e){let t=e-this._start,n=this._duration,r=this._prop,i=this._from,a=this._loop,o=this._to,s;if(this._active=i!==o&&(a||t<n),!this._active){this._target[r]=o,this._notify(!0);return}if(t<0){this._target[r]=i;return}s=t/n%2,s=a&&s>1?2-s:s,s=this._easing(Math.min(1,Math.max(0,s))),this._target[r]=this._fn(i,o,s)}wait(){let e=this._promises||=[];return new Promise((t,n)=>{e.push({res:t,rej:n})})}_notify(e){let t=e?`res`:`rej`,n=this._promises||[];for(let e=0;e<n.length;e++)n[e][t]()}},Mf=class{constructor(e,t){this._chart=e,this._properties=new Map,this.configure(t)}configure(e){if(!R(e))return;let t=Object.keys(q.animation),n=this._properties;Object.getOwnPropertyNames(e).forEach(r=>{let i=e[r];if(!R(i))return;let a={};for(let e of t)a[e]=i[e];(L(i.properties)&&i.properties||[r]).forEach(e=>{(e===r||!n.has(e))&&n.set(e,a)})})}_animateOptions(e,t){let n=t.options,r=Pf(e,n);if(!r)return[];let i=this._createAnimations(r,n);return n.$shared&&Nf(e.options.$animations,n).then(()=>{e.options=n},()=>{}),i}_createAnimations(e,t){let n=this._properties,r=[],i=e.$animations||={},a=Object.keys(t),o=Date.now(),s;for(s=a.length-1;s>=0;--s){let c=a[s];if(c.charAt(0)===`$`)continue;if(c===`options`){r.push(...this._animateOptions(e,t));continue}let l=t[c],u=i[c],d=n.get(c);if(u){if(d&&u.active()){u.update(d,l,o);continue}u.cancel()}if(!d||!d.duration){e[c]=l;continue}i[c]=u=new jf(d,e,c,l),r.push(u)}return r}update(e,t){if(this._properties.size===0){Object.assign(e,t);return}let n=this._createAnimations(e,t);if(n.length)return Of.add(this._chart,n),!0}};function Nf(e,t){let n=[],r=Object.keys(t);for(let t=0;t<r.length;t++){let i=e[r[t]];i&&i.active()&&n.push(i.wait())}return Promise.all(n)}function Pf(e,t){if(!t)return;let n=e.options;if(!n){e.options=t;return}return n.$shared&&(e.options=n=Object.assign({},n,{$shared:!1,$animations:{}})),n}function Ff(e,t){let n=e&&e.options||{},r=n.reverse,i=n.min===void 0?t:0,a=n.max===void 0?t:0;return{start:r?a:i,end:r?i:a}}function If(e,t,n){if(n===!1)return!1;let r=Ff(e,n),i=Ff(t,n);return{top:i.end,right:r.end,bottom:i.start,left:r.start}}function Lf(e){let t,n,r,i;return R(e)?(t=e.top,n=e.right,r=e.bottom,i=e.left):t=n=r=i=e,{top:t,right:n,bottom:r,left:i,disabled:e===!1}}function Rf(e,t){let n=[],r=e._getSortedDatasetMetas(t),i,a;for(i=0,a=r.length;i<a;++i)n.push(r[i].index);return n}function zf(e,t,n,r={}){let i=e.keys,a=r.mode===`single`,o,s,c,l;if(t===null)return;let u=!1;for(o=0,s=i.length;o<s;++o){if(c=+i[o],c===n){if(u=!0,r.all)continue;break}l=e.values[c],z(l)&&(a||t===0||Ll(t)===Ll(l))&&(t+=l)}return!u&&!r.all?0:t}function Bf(e,t){let{iScale:n,vScale:r}=t,i=n.axis===`x`?`x`:`y`,a=r.axis===`x`?`x`:`y`,o=Object.keys(e),s=Array(o.length),c,l,u;for(c=0,l=o.length;c<l;++c)u=o[c],s[c]={[i]:u,[a]:e[u]};return s}function Vf(e,t){let n=e&&e.options.stacked;return n||n===void 0&&t.stack!==void 0}function Hf(e,t,n){return`${e.id}.${t.id}.${n.stack||n.type}`}function Uf(e){let{min:t,max:n,minDefined:r,maxDefined:i}=e.getUserBounds();return{min:r?t:-1/0,max:i?n:1/0}}function Wf(e,t,n){let r=e[t]||(e[t]={});return r[n]||(r[n]={})}function Gf(e,t,n,r){for(let i of t.getMatchingVisibleMetas(r).reverse()){let t=e[i.index];if(n&&t>0||!n&&t<0)return i.index}return null}function Kf(e,t){let{chart:n,_cachedMeta:r}=e,i=n._stacks||={},{iScale:a,vScale:o,index:s}=r,c=a.axis,l=o.axis,u=Hf(a,o,r),d=t.length,f;for(let e=0;e<d;++e){let n=t[e],{[c]:a,[l]:d}=n,p=n._stacks||={};f=p[l]=Wf(i,u,a),f[s]=d,f._top=Gf(f,o,!0,r.type),f._bottom=Gf(f,o,!1,r.type);let m=f._visualValues||(f._visualValues={});m[s]=d}}function qf(e,t){let n=e.scales;return Object.keys(n).filter(e=>n[e].axis===t).shift()}function Jf(e,t){return dd(e,{active:!1,dataset:void 0,datasetIndex:t,index:t,mode:`default`,type:`dataset`})}function Yf(e,t,n){return dd(e,{active:!1,dataIndex:t,parsed:void 0,raw:void 0,element:n,index:t,mode:`default`,type:`data`})}function Xf(e,t){let n=e.controller.index,r=e.vScale&&e.vScale.axis;if(r){t||=e._parsed;for(let e of t){let t=e._stacks;if(!t||t[r]===void 0||t[r][n]===void 0)return;delete t[r][n],t[r]._visualValues!==void 0&&t[r]._visualValues[n]!==void 0&&delete t[r]._visualValues[n]}}}var Zf=e=>e===`reset`||e===`none`,Qf=(e,t)=>t?e:Object.assign({},e),$f=(e,t,n)=>e&&!t.hidden&&t._stacked&&{keys:Rf(n,!0),values:null},ep=class{constructor(e,t){this.chart=e,this._ctx=e.ctx,this.index=t,this._cachedDataOpts={},this._cachedMeta=this.getMeta(),this._type=this._cachedMeta.type,this.options=void 0,this._parsing=!1,this._data=void 0,this._objectData=void 0,this._sharedOptions=void 0,this._drawStart=void 0,this._drawCount=void 0,this.enableOptionSharing=!1,this.supportsDecimation=!1,this.$context=void 0,this._syncList=[],this.datasetElementType=new.target.datasetElementType,this.dataElementType=new.target.dataElementType,this.initialize()}initialize(){let e=this._cachedMeta;this.configure(),this.linkScales(),e._stacked=Vf(e.vScale,e),this.addElements(),this.options.fill&&!this.chart.isPluginEnabled(`filler`)&&console.warn(`Tried to use the 'fill' option without the 'Filler' plugin enabled. Please import and register the 'Filler' plugin and make sure it is not disabled in the options`)}updateIndex(e){this.index!==e&&Xf(this._cachedMeta),this.index=e}linkScales(){let e=this.chart,t=this._cachedMeta,n=this.getDataset(),r=(e,t,n,r)=>e===`x`?t:e===`r`?r:n,i=t.xAxisID=B(n.xAxisID,qf(e,`x`)),a=t.yAxisID=B(n.yAxisID,qf(e,`y`)),o=t.rAxisID=B(n.rAxisID,qf(e,`r`)),s=t.indexAxis,c=t.iAxisID=r(s,i,a,o),l=t.vAxisID=r(s,a,i,o);t.xScale=this.getScaleForId(i),t.yScale=this.getScaleForId(a),t.rScale=this.getScaleForId(o),t.iScale=this.getScaleForId(c),t.vScale=this.getScaleForId(l)}getDataset(){return this.chart.data.datasets[this.index]}getMeta(){return this.chart.getDatasetMeta(this.index)}getScaleForId(e){return this.chart.scales[e]}_getOtherScale(e){let t=this._cachedMeta;return e===t.iScale?t.vScale:t.iScale}reset(){this._update(`reset`)}_destroy(){let e=this._cachedMeta;this._data&&su(this._data,this),e._stacked&&Xf(e)}_dataCheck(){let e=this.getDataset(),t=e.data||=[],n=this._data;if(R(t)){let e=this._cachedMeta;this._data=Bf(t,e)}else if(n!==t){if(n){su(n,this);let e=this._cachedMeta;Xf(e),e._parsed=[]}t&&Object.isExtensible(t)&&ou(t,this),this._syncList=[],this._data=t}}addElements(){let e=this._cachedMeta;this._dataCheck(),this.datasetElementType&&(e.dataset=new this.datasetElementType)}buildOrUpdateElements(e){let t=this._cachedMeta,n=this.getDataset(),r=!1;this._dataCheck();let i=t._stacked;t._stacked=Vf(t.vScale,t),t.stack!==n.stack&&(r=!0,Xf(t),t.stack=n.stack),this._resyncElements(e),(r||i!==t._stacked)&&(Kf(this,t._parsed),t._stacked=Vf(t.vScale,t))}configure(){let e=this.chart.config,t=e.datasetScopeKeys(this._type),n=e.getOptionScopes(this.getDataset(),t,!0);this.options=e.createResolver(n,this.getContext()),this._parsing=this.options.parsing,this._cachedDataOpts={}}parse(e,t){let{_cachedMeta:n,_data:r}=this,{iScale:i,_stacked:a}=n,o=i.axis,s=e===0&&t===r.length||n._sorted,c=e>0&&n._parsed[e-1],l,u,d;if(this._parsing===!1)n._parsed=r,n._sorted=!0,d=r;else{d=L(r[e])?this.parseArrayData(n,r,e,t):R(r[e])?this.parseObjectData(n,r,e,t):this.parsePrimitiveData(n,r,e,t);let i=()=>u[o]===null||c&&u[o]<c[o];for(l=0;l<t;++l)n._parsed[l+e]=u=d[l],s&&(i()&&(s=!1),c=u);n._sorted=s}a&&Kf(this,d)}parsePrimitiveData(e,t,n,r){let{iScale:i,vScale:a}=e,o=i.axis,s=a.axis,c=i.getLabels(),l=i===a,u=Array(r),d,f,p;for(d=0,f=r;d<f;++d)p=d+n,u[d]={[o]:l||i.parse(c[p],p),[s]:a.parse(t[p],p)};return u}parseArrayData(e,t,n,r){let{xScale:i,yScale:a}=e,o=Array(r),s,c,l,u;for(s=0,c=r;s<c;++s)l=s+n,u=t[l],o[s]={x:i.parse(u[0],l),y:a.parse(u[1],l)};return o}parseObjectData(e,t,n,r){let{xScale:i,yScale:a}=e,{xAxisKey:o=`x`,yAxisKey:s=`y`}=this._parsing,c=Array(r),l,u,d,f;for(l=0,u=r;l<u;++l)d=l+n,f=t[d],c[l]={x:i.parse(Tl(f,o),d),y:a.parse(Tl(f,s),d)};return c}getParsed(e){return this._cachedMeta._parsed[e]}getDataElement(e){return this._cachedMeta.data[e]}applyStack(e,t,n){let r=this.chart,i=this._cachedMeta,a=t[e.axis];return zf({keys:Rf(r,!0),values:t._stacks[e.axis]._visualValues},a,i.index,{mode:n})}updateRangeFromParsed(e,t,n,r){let i=n[t.axis],a=i===null?NaN:i,o=r&&n._stacks[t.axis];r&&o&&(r.values=o,a=zf(r,i,this._cachedMeta.index)),e.min=Math.min(e.min,a),e.max=Math.max(e.max,a)}getMinMax(e,t){let n=this._cachedMeta,r=n._parsed,i=n._sorted&&e===n.iScale,a=r.length,o=this._getOtherScale(e),s=$f(t,n,this.chart),c={min:1/0,max:-1/0},{min:l,max:u}=Uf(o),d,f;function p(){f=r[d];let t=f[o.axis];return!z(f[e.axis])||l>t||u<t}for(d=0;d<a&&!(!p()&&(this.updateRangeFromParsed(c,e,f,s),i));++d);if(i){for(d=a-1;d>=0;--d)if(!p()){this.updateRangeFromParsed(c,e,f,s);break}}return c}getAllParsedValues(e){let t=this._cachedMeta._parsed,n=[],r,i,a;for(r=0,i=t.length;r<i;++r)a=t[r][e.axis],z(a)&&n.push(a);return n}getMaxOverflow(){return!1}getLabelAndValue(e){let t=this._cachedMeta,n=t.iScale,r=t.vScale,i=this.getParsed(e);return{label:n?``+n.getLabelForValue(i[n.axis]):``,value:r?``+r.getLabelForValue(i[r.axis]):``}}_update(e){let t=this._cachedMeta;this.update(e||`default`),t._clip=Lf(B(this.options.clip,If(t.xScale,t.yScale,this.getMaxOverflow())))}update(e){}draw(){let e=this._ctx,t=this.chart,n=this._cachedMeta,r=n.data||[],i=t.chartArea,a=[],o=this._drawStart||0,s=this._drawCount||r.length-o,c=this.options.drawActiveElementsOnTop,l;for(n.dataset&&n.dataset.draw(e,i,o,s),l=o;l<o+s;++l){let t=r[l];t.hidden||(t.active&&c?a.push(t):t.draw(e,i))}for(l=0;l<a.length;++l)a[l].draw(e,i)}getStyle(e,t){let n=t?`active`:`default`;return e===void 0&&this._cachedMeta.dataset?this.resolveDatasetElementOptions(n):this.resolveDataElementOptions(e||0,n)}getContext(e,t,n){let r=this.getDataset(),i;if(e>=0&&e<this._cachedMeta.data.length){let t=this._cachedMeta.data[e];i=t.$context||=Yf(this.getContext(),e,t),i.parsed=this.getParsed(e),i.raw=r.data[e],i.index=i.dataIndex=e}else i=this.$context||=Jf(this.chart.getContext(),this.index),i.dataset=r,i.index=i.datasetIndex=this.index;return i.active=!!t,i.mode=n,i}resolveDatasetElementOptions(e){return this._resolveElementOptions(this.datasetElementType.id,e)}resolveDataElementOptions(e,t){return this._resolveElementOptions(this.dataElementType.id,t,e)}_resolveElementOptions(e,t=`default`,n){let r=t===`active`,i=this._cachedDataOpts,a=e+`-`+t,o=i[a],s=this.enableOptionSharing&&Dl(n);if(o)return Qf(o,s);let c=this.chart.config,l=c.datasetElementScopeKeys(this._type,e),u=r?[`${e}Hover`,`hover`,e,``]:[e,``],d=c.getOptionScopes(this.getDataset(),l),f=Object.keys(q.elements[e]),p=c.resolveNamedOptions(d,f,()=>this.getContext(n,r,t),u);return p.$shared&&(p.$shared=s,i[a]=Object.freeze(Qf(p,s))),p}_resolveAnimations(e,t,n){let r=this.chart,i=this._cachedDataOpts,a=`animation-${t}`,o=i[a];if(o)return o;let s;if(r.options.animation!==!1){let r=this.chart.config,i=r.datasetAnimationScopeKeys(this._type,t),a=r.getOptionScopes(this.getDataset(),i);s=r.createResolver(a,this.getContext(e,n,t))}let c=new Mf(r,s&&s.animations);return s&&s._cacheable&&(i[a]=Object.freeze(c)),c}getSharedOptions(e){if(e.$shared)return this._sharedOptions||=Object.assign({},e)}includeOptions(e,t){return!t||Zf(e)||this.chart._animationsDisabled}_getSharedOptions(e,t){let n=this.resolveDataElementOptions(e,t),r=this._sharedOptions,i=this.getSharedOptions(n),a=this.includeOptions(t,i)||i!==r;return this.updateSharedOptions(i,t,n),{sharedOptions:i,includeOptions:a}}updateElement(e,t,n,r){Zf(r)?Object.assign(e,n):this._resolveAnimations(t,r).update(e,n)}updateSharedOptions(e,t,n){e&&!Zf(t)&&this._resolveAnimations(void 0,t).update(e,n)}_setStyle(e,t,n,r){e.active=r;let i=this.getStyle(t,r);this._resolveAnimations(t,n,r).update(e,{options:!r&&this.getSharedOptions(i)||i})}removeHoverStyle(e,t,n){this._setStyle(e,n,`active`,!1)}setHoverStyle(e,t,n){this._setStyle(e,n,`active`,!0)}_removeDatasetHoverStyle(){let e=this._cachedMeta.dataset;e&&this._setStyle(e,void 0,`active`,!1)}_setDatasetHoverStyle(){let e=this._cachedMeta.dataset;e&&this._setStyle(e,void 0,`active`,!0)}_resyncElements(e){let t=this._data,n=this._cachedMeta.data;for(let[e,t,n]of this._syncList)this[e](t,n);this._syncList=[];let r=n.length,i=t.length,a=Math.min(i,r);a&&this.parse(0,a),i>r?this._insertElements(r,i-r,e):i<r&&this._removeElements(i,r-i)}_insertElements(e,t,n=!0){let r=this._cachedMeta,i=r.data,a=e+t,o,s=e=>{for(e.length+=t,o=e.length-1;o>=a;o--)e[o]=e[o-t]};for(s(i),o=e;o<a;++o)i[o]=new this.dataElementType;this._parsing&&s(r._parsed),this.parse(e,t),n&&this.updateElements(i,e,t,`reset`)}updateElements(e,t,n,r){}_removeElements(e,t){let n=this._cachedMeta;if(this._parsing){let r=n._parsed.splice(e,t);n._stacked&&Xf(n,r)}n.data.splice(e,t)}_sync(e){if(this._parsing)this._syncList.push(e);else{let[t,n,r]=e;this[t](n,r)}this.chart._dataChanges.push([this.index,...e])}_onDataPush(){let e=arguments.length;this._sync([`_insertElements`,this.getDataset().data.length-e,e])}_onDataPop(){this._sync([`_removeElements`,this._cachedMeta.data.length-1,1])}_onDataShift(){this._sync([`_removeElements`,0,1])}_onDataSplice(e,t){t&&this._sync([`_removeElements`,e,t]);let n=arguments.length-2;n&&this._sync([`_insertElements`,e,n])}_onDataUnshift(){this._sync([`_insertElements`,0,arguments.length])}};N(ep,`defaults`,{}),N(ep,`datasetElementType`,null),N(ep,`dataElementType`,null);function tp(e,t){if(!e._cache.$bar){let n=e.getMatchingVisibleMetas(t),r=[];for(let t=0,i=n.length;t<i;t++)r=r.concat(n[t].controller.getAllParsedValues(e));e._cache.$bar=cu(r.sort((e,t)=>e-t))}return e._cache.$bar}function np(e){let t=e.iScale,n=tp(t,e.type),r=t._length,i,a,o,s,c=()=>{o===32767||o===-32768||(Dl(s)&&(r=Math.min(r,Math.abs(o-s)||r)),s=o)};for(i=0,a=n.length;i<a;++i)o=t.getPixelForValue(n[i]),c();for(s=void 0,i=0,a=t.ticks.length;i<a;++i)o=t.getPixelForTick(i),c();return r}function rp(e,t,n,r){let i=n.barThickness,a,o;return I(i)?(a=t.min*n.categoryPercentage,o=n.barPercentage):(a=i*r,o=1),{chunk:a/r,ratio:o,start:t.pixels[e]-a/2}}function ip(e,t,n,r){let i=t.pixels,a=i[e],o=e>0?i[e-1]:null,s=e<i.length-1?i[e+1]:null,c=n.categoryPercentage;o===null&&(o=a-(s===null?t.end-t.start:s-a)),s===null&&(s=a+a-o);let l=a-(a-Math.min(o,s))/2*c;return{chunk:Math.abs(s-o)/2*c/r,ratio:n.barPercentage,start:l}}function ap(e,t,n,r){let i=n.parse(e[0],r),a=n.parse(e[1],r),o=Math.min(i,a),s=Math.max(i,a),c=o,l=s;Math.abs(o)>Math.abs(s)&&(c=s,l=o),t[n.axis]=l,t._custom={barStart:c,barEnd:l,start:i,end:a,min:o,max:s}}function op(e,t,n,r){return L(e)?ap(e,t,n,r):t[n.axis]=n.parse(e,r),t}function sp(e,t,n,r){let i=e.iScale,a=e.vScale,o=i.getLabels(),s=i===a,c=[],l,u,d,f;for(l=n,u=n+r;l<u;++l)f=t[l],d={},d[i.axis]=s||i.parse(o[l],l),c.push(op(f,d,a,l));return c}function cp(e){return e&&e.barStart!==void 0&&e.barEnd!==void 0}function lp(e,t,n){return e===0?(t.isHorizontal()?1:-1)*(t.min>=n?1:-1):Ll(e)}function up(e){let t,n,r,i,a;return e.horizontal?(t=e.base>e.x,n=`left`,r=`right`):(t=e.base<e.y,n=`bottom`,r=`top`),t?(i=`end`,a=`start`):(i=`start`,a=`end`),{start:n,end:r,reverse:t,top:i,bottom:a}}function dp(e,t,n,r){let i=t.borderSkipped,a={};if(!i){e.borderSkipped=a;return}if(i===!0){e.borderSkipped={top:!0,right:!0,bottom:!0,left:!0};return}let{start:o,end:s,reverse:c,top:l,bottom:u}=up(e);i===`middle`&&n&&(e.enableBorderRadius=!0,(n._top||0)===r?i=l:(n._bottom||0)===r?i=u:(a[fp(u,o,s,c)]=!0,i=l)),a[fp(i,o,s,c)]=!0,e.borderSkipped=a}function fp(e,t,n,r){return r?(e=pp(e,t,n),e=mp(e,n,t)):e=mp(e,t,n),e}function pp(e,t,n){return e===t?n:e===n?t:e}function mp(e,t,n){return e===`start`?t:e===`end`?n:e}function hp(e,{inflateAmount:t},n){e.inflateAmount=t===`auto`?n===1?.33:0:t}var gp=class extends ep{parsePrimitiveData(e,t,n,r){return sp(e,t,n,r)}parseArrayData(e,t,n,r){return sp(e,t,n,r)}parseObjectData(e,t,n,r){let{iScale:i,vScale:a}=e,{xAxisKey:o=`x`,yAxisKey:s=`y`}=this._parsing,c=i.axis===`x`?o:s,l=a.axis===`x`?o:s,u=[],d,f,p,m;for(d=n,f=n+r;d<f;++d)m=t[d],p={},p[i.axis]=i.parse(Tl(m,c),d),u.push(op(Tl(m,l),p,a,d));return u}updateRangeFromParsed(e,t,n,r){super.updateRangeFromParsed(e,t,n,r);let i=n._custom;i&&t===this._cachedMeta.vScale&&(e.min=Math.min(e.min,i.min),e.max=Math.max(e.max,i.max))}getMaxOverflow(){return 0}getLabelAndValue(e){let{iScale:t,vScale:n}=this._cachedMeta,r=this.getParsed(e),i=r._custom,a=cp(i)?`[`+i.start+`, `+i.end+`]`:``+n.getLabelForValue(r[n.axis]);return{label:``+t.getLabelForValue(r[t.axis]),value:a}}initialize(){this.enableOptionSharing=!0,super.initialize();let e=this._cachedMeta;e.stack=this.getDataset().stack}update(e){let t=this._cachedMeta;this.updateElements(t.data,0,t.data.length,e)}updateElements(e,t,n,r){let i=r===`reset`,{index:a,_cachedMeta:{vScale:o}}=this,s=o.getBasePixel(),c=o.isHorizontal(),l=this._getRuler(),{sharedOptions:u,includeOptions:d}=this._getSharedOptions(t,r);for(let f=t;f<t+n;f++){let t=this.getParsed(f),n=i||I(t[o.axis])?{base:s,head:s}:this._calculateBarValuePixels(f),p=this._calculateBarIndexPixels(f,l),m=(t._stacks||{})[o.axis],h={horizontal:c,base:n.base,enableBorderRadius:!m||cp(t._custom)||a===m._top||a===m._bottom,x:c?n.head:p.center,y:c?p.center:n.head,height:c?p.size:Math.abs(n.size),width:c?Math.abs(n.size):p.size};d&&(h.options=u||this.resolveDataElementOptions(f,e[f].active?`active`:r));let g=h.options||e[f].options;dp(h,g,m,a),hp(h,g,l.ratio),this.updateElement(e[f],f,h,r)}}_getStacks(e,t){let{iScale:n}=this._cachedMeta,r=n.getMatchingVisibleMetas(this._type).filter(e=>e.controller.options.grouped),i=n.options.stacked,a=[],o=this._cachedMeta.controller.getParsed(t),s=o&&o[n.axis],c=e=>{let t=e._parsed.find(e=>e[n.axis]===s),r=t&&t[e.vScale.axis];if(I(r)||isNaN(r))return!0};for(let n of r)if(!(t!==void 0&&c(n))&&((i===!1||a.indexOf(n.stack)===-1||i===void 0&&n.stack===void 0)&&a.push(n.stack),n.index===e))break;return a.length||a.push(void 0),a}_getStackCount(e){return this._getStacks(void 0,e).length}_getAxisCount(){return this._getAxis().length}getFirstScaleIdForIndexAxis(){let e=this.chart.scales,t=this.chart.options.indexAxis;return Object.keys(e).filter(n=>e[n].axis===t).shift()}_getAxis(){let e={},t=this.getFirstScaleIdForIndexAxis();for(let n of this.chart.data.datasets)e[B(this.chart.options.indexAxis===`x`?n.xAxisID:n.yAxisID,t)]=!0;return Object.keys(e)}_getStackIndex(e,t,n){let r=this._getStacks(e,n),i=t===void 0?-1:r.indexOf(t);return i===-1?r.length-1:i}_getRuler(){let e=this.options,t=this._cachedMeta,n=t.iScale,r=[],i,a;for(i=0,a=t.data.length;i<a;++i)r.push(n.getPixelForValue(this.getParsed(i)[n.axis],i));let o=e.barThickness;return{min:o||np(t),pixels:r,start:n._startPixel,end:n._endPixel,stackCount:this._getStackCount(),scale:n,grouped:e.grouped,ratio:o?1:e.categoryPercentage*e.barPercentage}}_calculateBarValuePixels(e){let{_cachedMeta:{vScale:t,_stacked:n,index:r},options:{base:i,minBarLength:a}}=this,o=i||0,s=this.getParsed(e),c=s._custom,l=cp(c),u=s[t.axis],d=0,f=n?this.applyStack(t,s,n):u,p,m;f!==u&&(d=f-u,f=u),l&&(u=c.barStart,f=c.barEnd-c.barStart,u!==0&&Ll(u)!==Ll(c.barEnd)&&(d=0),d+=u);let h=!I(i)&&!l?i:d,g=t.getPixelForValue(h);if(p=this.chart.getDataVisibility(e)?t.getPixelForValue(d+f):g,m=p-g,Math.abs(m)<a){m=lp(m,t,o)*a,u===o&&(g-=m/2);let e=t.getPixelForDecimal(0),i=t.getPixelForDecimal(1);g=Math.max(Math.min(g,Math.max(e,i)),Math.min(e,i)),p=g+m,n&&!l&&(s._stacks[t.axis]._visualValues[r]=t.getValueForPixel(p)-t.getValueForPixel(g))}if(g===t.getPixelForValue(o)){let e=Ll(m)*t.getLineWidthForValue(o)/2;g+=e,m-=e}return{size:m,base:g,head:p,center:p+m/2}}_calculateBarIndexPixels(e,t){let n=t.scale,r=this.options,i=r.skipNull,a=B(r.maxBarThickness,1/0),o,s,c=this._getAxisCount();if(t.grouped){let n=i?this._getStackCount(e):t.stackCount,l=r.barThickness===`flex`?ip(e,t,r,n*c):rp(e,t,r,n*c),u=this.chart.options.indexAxis===`x`?this.getDataset().xAxisID:this.getDataset().yAxisID,d=this._getAxis().indexOf(B(u,this.getFirstScaleIdForIndexAxis())),f=this._getStackIndex(this.index,this._cachedMeta.stack,i?e:void 0)+d;o=l.start+l.chunk*f+l.chunk/2,s=Math.min(a,l.chunk*l.ratio)}else o=n.getPixelForValue(this.getParsed(e)[n.axis],e),s=Math.min(a,t.min*t.ratio);return{base:o-s/2,head:o+s/2,center:o,size:s}}draw(){let e=this._cachedMeta,t=e.vScale,n=e.data,r=n.length,i=0;for(;i<r;++i)this.getParsed(i)[t.axis]!==null&&!n[i].hidden&&n[i].draw(this._ctx)}};N(gp,`id`,`bar`),N(gp,`defaults`,{datasetElementType:!1,dataElementType:`bar`,categoryPercentage:.8,barPercentage:.9,grouped:!0,animations:{numbers:{type:`number`,properties:[`x`,`y`,`base`,`width`,`height`]}}}),N(gp,`overrides`,{scales:{_index_:{type:`category`,offset:!0,grid:{offset:!0}},_value_:{type:`linear`,beginAtZero:!0}}});var _p=class extends ep{initialize(){this.enableOptionSharing=!0,super.initialize()}parsePrimitiveData(e,t,n,r){let i=super.parsePrimitiveData(e,t,n,r);for(let e=0;e<i.length;e++)i[e]._custom=this.resolveDataElementOptions(e+n).radius;return i}parseArrayData(e,t,n,r){let i=super.parseArrayData(e,t,n,r);for(let e=0;e<i.length;e++){let r=t[n+e];i[e]._custom=B(r[2],this.resolveDataElementOptions(e+n).radius)}return i}parseObjectData(e,t,n,r){let i=super.parseObjectData(e,t,n,r);for(let e=0;e<i.length;e++){let r=t[n+e];i[e]._custom=B(r&&r.r&&+r.r,this.resolveDataElementOptions(e+n).radius)}return i}getMaxOverflow(){let e=this._cachedMeta.data,t=0;for(let n=e.length-1;n>=0;--n)t=Math.max(t,e[n].size(this.resolveDataElementOptions(n))/2);return t>0&&t}getLabelAndValue(e){let t=this._cachedMeta,n=this.chart.data.labels||[],{xScale:r,yScale:i}=t,a=this.getParsed(e),o=r.getLabelForValue(a.x),s=i.getLabelForValue(a.y),c=a._custom;return{label:n[e]||``,value:`(`+o+`, `+s+(c?`, `+c:``)+`)`}}update(e){let t=this._cachedMeta.data;this.updateElements(t,0,t.length,e)}updateElements(e,t,n,r){let i=r===`reset`,{iScale:a,vScale:o}=this._cachedMeta,{sharedOptions:s,includeOptions:c}=this._getSharedOptions(t,r),l=a.axis,u=o.axis;for(let d=t;d<t+n;d++){let t=e[d],n=!i&&this.getParsed(d),f={},p=f[l]=i?a.getPixelForDecimal(.5):a.getPixelForValue(n[l]),m=f[u]=i?o.getBasePixel():o.getPixelForValue(n[u]);f.skip=isNaN(p)||isNaN(m),c&&(f.options=s||this.resolveDataElementOptions(d,t.active?`active`:r),i&&(f.options.radius=0)),this.updateElement(t,d,f,r)}}resolveDataElementOptions(e,t){let n=this.getParsed(e),r=super.resolveDataElementOptions(e,t);r.$shared&&(r=Object.assign({},r,{$shared:!1}));let i=r.radius;return t!==`active`&&(r.radius=0),r.radius+=B(n&&n._custom,i),r}};N(_p,`id`,`bubble`),N(_p,`defaults`,{datasetElementType:!1,dataElementType:`point`,animations:{numbers:{type:`number`,properties:[`x`,`y`,`borderWidth`,`radius`]}}}),N(_p,`overrides`,{scales:{x:{type:`linear`},y:{type:`linear`}}});function vp(e,t,n){let r=1,i=1,a=0,o=0;if(t<W){let s=e,c=s+t,l=Math.cos(s),u=Math.sin(s),d=Math.cos(c),f=Math.sin(c),p=(e,t,r)=>Ql(e,s,c,!0)?1:Math.max(t,t*n,r,r*n),m=(e,t,r)=>Ql(e,s,c,!0)?-1:Math.min(t,t*n,r,r*n),h=p(0,l,d),g=p(G,u,f),_=m(U,l,d),v=m(U+G,u,f);r=(h-_)/2,i=(g-v)/2,a=-(h+_)/2,o=-(g+v)/2}return{ratioX:r,ratioY:i,offsetX:a,offsetY:o}}var yp=class extends ep{constructor(e,t){super(e,t),this.enableOptionSharing=!0,this.innerRadius=void 0,this.outerRadius=void 0,this.offsetX=void 0,this.offsetY=void 0}linkScales(){}parse(e,t){let n=this.getDataset().data,r=this._cachedMeta;if(this._parsing===!1)r._parsed=n;else{let i=e=>+n[e];if(R(n[e])){let{key:e=`value`}=this._parsing;i=t=>+Tl(n[t],e)}let a,o;for(a=e,o=e+t;a<o;++a)r._parsed[a]=i(a)}}_getRotation(){return Gl(this.options.rotation-90)}_getCircumference(){return Gl(this.options.circumference)}_getRotationExtents(){let e=W,t=-W;for(let n=0;n<this.chart.data.datasets.length;++n)if(this.chart.isDatasetVisible(n)&&this.chart.getDatasetMeta(n).type===this._type){let r=this.chart.getDatasetMeta(n).controller,i=r._getRotation(),a=r._getCircumference();e=Math.min(e,i),t=Math.max(t,i+a)}return{rotation:e,circumference:t-e}}update(e){let{chartArea:t}=this.chart,n=this._cachedMeta,r=n.data,i=this.getMaxBorderWidth()+this.getMaxOffset(r)+this.options.spacing,a=Math.max((Math.min(t.width,t.height)-i)/2,0),o=Math.min(pl(this.options.cutout,a),1),s=this._getRingWeight(this.index),{circumference:c,rotation:l}=this._getRotationExtents(),{ratioX:u,ratioY:d,offsetX:f,offsetY:p}=vp(l,c,o),m=(t.width-i)/u,h=(t.height-i)/d,g=Math.max(Math.min(m,h)/2,0),_=ml(this.options.radius,g),v=(_-Math.max(_*o,0))/this._getVisibleDatasetWeightTotal();this.offsetX=f*_,this.offsetY=p*_,n.total=this.calculateTotal(),this.outerRadius=_-v*this._getRingWeightOffset(this.index),this.innerRadius=Math.max(this.outerRadius-v*s,0),this.updateElements(r,0,r.length,e)}_circumference(e,t){let n=this.options,r=this._cachedMeta,i=this._getCircumference();return t&&n.animation.animateRotate||!this.chart.getDataVisibility(e)||r._parsed[e]===null||r.data[e].hidden?0:this.calculateCircumference(r._parsed[e]*i/W)}updateElements(e,t,n,r){let i=r===`reset`,a=this.chart,o=a.chartArea,s=a.options.animation,c=(o.left+o.right)/2,l=(o.top+o.bottom)/2,u=i&&s.animateScale,d=u?0:this.innerRadius,f=u?0:this.outerRadius,{sharedOptions:p,includeOptions:m}=this._getSharedOptions(t,r),h=this._getRotation(),g;for(g=0;g<t;++g)h+=this._circumference(g,i);for(g=t;g<t+n;++g){let t=this._circumference(g,i),n=e[g],a={x:c+this.offsetX,y:l+this.offsetY,startAngle:h,endAngle:h+t,circumference:t,outerRadius:f,innerRadius:d};m&&(a.options=p||this.resolveDataElementOptions(g,n.active?`active`:r)),h+=t,this.updateElement(n,g,a,r)}}calculateTotal(){let e=this._cachedMeta,t=e.data,n=0,r;for(r=0;r<t.length;r++){let i=e._parsed[r];i!==null&&!isNaN(i)&&this.chart.getDataVisibility(r)&&!t[r].hidden&&(n+=Math.abs(i))}return n}calculateCircumference(e){let t=this._cachedMeta.total;return t>0&&!isNaN(e)?Math.abs(e)/t*W:0}getLabelAndValue(e){let t=this._cachedMeta,n=this.chart,r=n.data.labels||[],i=Au(t._parsed[e],n.options.locale);return{label:r[e]||``,value:i}}getMaxBorderWidth(e){let t=0,n=this.chart,r,i,a,o,s;if(!e){for(r=0,i=n.data.datasets.length;r<i;++r)if(n.isDatasetVisible(r)){a=n.getDatasetMeta(r),e=a.data,o=a.controller;break}}if(!e)return 0;for(r=0,i=e.length;r<i;++r)s=o.resolveDataElementOptions(r),s.borderAlign!==`inner`&&(t=Math.max(t,s.borderWidth||0,s.hoverBorderWidth||0));return t}getMaxOffset(e){let t=0;for(let n=0,r=e.length;n<r;++n){let e=this.resolveDataElementOptions(n);t=Math.max(t,e.offset||0,e.hoverOffset||0)}return t}_getRingWeightOffset(e){let t=0;for(let n=0;n<e;++n)this.chart.isDatasetVisible(n)&&(t+=this._getRingWeight(n));return t}_getRingWeight(e){return Math.max(B(this.chart.data.datasets[e].weight,1),0)}_getVisibleDatasetWeightTotal(){return this._getRingWeightOffset(this.chart.data.datasets.length)||1}};N(yp,`id`,`doughnut`),N(yp,`defaults`,{datasetElementType:!1,dataElementType:`arc`,animation:{animateRotate:!0,animateScale:!1},animations:{numbers:{type:`number`,properties:[`circumference`,`endAngle`,`innerRadius`,`outerRadius`,`startAngle`,`x`,`y`,`offset`,`borderWidth`,`spacing`]}},cutout:`50%`,rotation:0,circumference:360,radius:`100%`,spacing:0,indexAxis:`r`}),N(yp,`descriptors`,{_scriptable:e=>e!==`spacing`,_indexable:e=>e!==`spacing`&&!e.startsWith(`borderDash`)&&!e.startsWith(`hoverBorderDash`)}),N(yp,`overrides`,{aspectRatio:1,plugins:{legend:{labels:{generateLabels(e){let t=e.data,{labels:{pointStyle:n,textAlign:r,color:i,useBorderRadius:a,borderRadius:o}}=e.legend.options;return t.labels.length&&t.datasets.length?t.labels.map((t,s)=>{let c=e.getDatasetMeta(0).controller.getStyle(s);return{text:t,fillStyle:c.backgroundColor,fontColor:i,hidden:!e.getDataVisibility(s),lineDash:c.borderDash,lineDashOffset:c.borderDashOffset,lineJoin:c.borderJoinStyle,lineWidth:c.borderWidth,strokeStyle:c.borderColor,textAlign:r,pointStyle:n,borderRadius:a&&(o||c.borderRadius),index:s}}):[]}},onClick(e,t,n){n.chart.toggleDataVisibility(t.index),n.chart.update()}}}});var bp=class extends ep{initialize(){this.enableOptionSharing=!0,this.supportsDecimation=!0,super.initialize()}update(e){let t=this._cachedMeta,{dataset:n,data:r=[],_dataset:i}=t,a=this.chart._animationsDisabled,{start:o,count:s}=hu(t,r,a);this._drawStart=o,this._drawCount=s,gu(t)&&(o=0,s=r.length),n._chart=this.chart,n._datasetIndex=this.index,n._decimated=!!i._decimated,n.points=r;let c=this.resolveDatasetElementOptions(e);this.options.showLine||(c.borderWidth=0),c.segment=this.options.segment,this.updateElement(n,void 0,{animated:!a,options:c},e),this.updateElements(r,o,s,e)}updateElements(e,t,n,r){let i=r===`reset`,{iScale:a,vScale:o,_stacked:s,_dataset:c}=this._cachedMeta,{sharedOptions:l,includeOptions:u}=this._getSharedOptions(t,r),d=a.axis,f=o.axis,{spanGaps:p,segment:m}=this.options,h=Hl(p)?p:1/0,g=this.chart._animationsDisabled||i||r===`none`,_=t+n,v=e.length,y=t>0&&this.getParsed(t-1);for(let n=0;n<v;++n){let p=e[n],v=g?p:{};if(n<t||n>=_){v.skip=!0;continue}let b=this.getParsed(n),x=I(b[f]),S=v[d]=a.getPixelForValue(b[d],n),C=v[f]=i||x?o.getBasePixel():o.getPixelForValue(s?this.applyStack(o,b,s):b[f],n);v.skip=isNaN(S)||isNaN(C)||x,v.stop=n>0&&Math.abs(b[d]-y[d])>h,m&&(v.parsed=b,v.raw=c.data[n]),u&&(v.options=l||this.resolveDataElementOptions(n,p.active?`active`:r)),g||this.updateElement(p,n,v,r),y=b}}getMaxOverflow(){let e=this._cachedMeta,t=e.dataset,n=t.options&&t.options.borderWidth||0,r=e.data||[];if(!r.length)return n;let i=r[0].size(this.resolveDataElementOptions(0)),a=r[r.length-1].size(this.resolveDataElementOptions(r.length-1));return Math.max(n,i,a)/2}draw(){let e=this._cachedMeta;e.dataset.updateControlPoints(this.chart.chartArea,e.iScale.axis),super.draw()}};N(bp,`id`,`line`),N(bp,`defaults`,{datasetElementType:`line`,dataElementType:`point`,showLine:!0,spanGaps:!1}),N(bp,`overrides`,{scales:{_index_:{type:`category`},_value_:{type:`linear`}}});var xp=class extends ep{constructor(e,t){super(e,t),this.innerRadius=void 0,this.outerRadius=void 0}getLabelAndValue(e){let t=this._cachedMeta,n=this.chart,r=n.data.labels||[],i=Au(t._parsed[e].r,n.options.locale);return{label:r[e]||``,value:i}}parseObjectData(e,t,n,r){return jd.bind(this)(e,t,n,r)}update(e){let t=this._cachedMeta.data;this._updateRadius(),this.updateElements(t,0,t.length,e)}getMinMax(){let e=this._cachedMeta,t={min:1/0,max:-1/0};return e.data.forEach((e,n)=>{let r=this.getParsed(n).r;!isNaN(r)&&this.chart.getDataVisibility(n)&&(r<t.min&&(t.min=r),r>t.max&&(t.max=r))}),t}_updateRadius(){let e=this.chart,t=e.chartArea,n=e.options,r=Math.min(t.right-t.left,t.bottom-t.top),i=Math.max(r/2,0),a=(i-Math.max(n.cutoutPercentage?i/100*n.cutoutPercentage:1,0))/e.getVisibleDatasetCount();this.outerRadius=i-a*this.index,this.innerRadius=this.outerRadius-a}updateElements(e,t,n,r){let i=r===`reset`,a=this.chart,o=a.options.animation,s=this._cachedMeta.rScale,c=s.xCenter,l=s.yCenter,u=s.getIndexAngle(0)-.5*U,d=u,f,p=360/this.countVisibleElements();for(f=0;f<t;++f)d+=this._computeAngle(f,r,p);for(f=t;f<t+n;f++){let t=e[f],n=d,m=d+this._computeAngle(f,r,p),h=a.getDataVisibility(f)?s.getDistanceFromCenterForValue(this.getParsed(f).r):0;d=m,i&&(o.animateScale&&(h=0),o.animateRotate&&(n=m=u));let g={x:c,y:l,innerRadius:0,outerRadius:h,startAngle:n,endAngle:m,options:this.resolveDataElementOptions(f,t.active?`active`:r)};this.updateElement(t,f,g,r)}}countVisibleElements(){let e=this._cachedMeta,t=0;return e.data.forEach((e,n)=>{!isNaN(this.getParsed(n).r)&&this.chart.getDataVisibility(n)&&t++}),t}_computeAngle(e,t,n){return this.chart.getDataVisibility(e)?Gl(this.resolveDataElementOptions(e,t).angle||n):0}};N(xp,`id`,`polarArea`),N(xp,`defaults`,{dataElementType:`arc`,animation:{animateRotate:!0,animateScale:!0},animations:{numbers:{type:`number`,properties:[`x`,`y`,`startAngle`,`endAngle`,`innerRadius`,`outerRadius`]}},indexAxis:`r`,startAngle:0}),N(xp,`overrides`,{aspectRatio:1,plugins:{legend:{labels:{generateLabels(e){let t=e.data;if(t.labels.length&&t.datasets.length){let{labels:{pointStyle:n,color:r}}=e.legend.options;return t.labels.map((t,i)=>{let a=e.getDatasetMeta(0).controller.getStyle(i);return{text:t,fillStyle:a.backgroundColor,strokeStyle:a.borderColor,fontColor:r,lineWidth:a.borderWidth,pointStyle:n,hidden:!e.getDataVisibility(i),index:i}})}return[]}},onClick(e,t,n){n.chart.toggleDataVisibility(t.index),n.chart.update()}}},scales:{r:{type:`radialLinear`,angleLines:{display:!1},beginAtZero:!0,grid:{circular:!0},pointLabels:{display:!1},startAngle:0}}});var Sp=class extends yp{};N(Sp,`id`,`pie`),N(Sp,`defaults`,{cutout:0,rotation:0,circumference:360,radius:`100%`});var Cp=class extends ep{getLabelAndValue(e){let t=this._cachedMeta.vScale,n=this.getParsed(e);return{label:t.getLabels()[e],value:``+t.getLabelForValue(n[t.axis])}}parseObjectData(e,t,n,r){return jd.bind(this)(e,t,n,r)}update(e){let t=this._cachedMeta,n=t.dataset,r=t.data||[],i=t.iScale.getLabels();if(n.points=r,e!==`resize`){let t=this.resolveDatasetElementOptions(e);this.options.showLine||(t.borderWidth=0);let a={_loop:!0,_fullLoop:i.length===r.length,options:t};this.updateElement(n,void 0,a,e)}this.updateElements(r,0,r.length,e)}updateElements(e,t,n,r){let i=this._cachedMeta.rScale,a=r===`reset`;for(let o=t;o<t+n;o++){let t=e[o],n=this.resolveDataElementOptions(o,t.active?`active`:r),s=i.getPointPositionForValue(o,this.getParsed(o).r),c=a?i.xCenter:s.x,l=a?i.yCenter:s.y,u={x:c,y:l,angle:s.angle,skip:isNaN(c)||isNaN(l),options:n};this.updateElement(t,o,u,r)}}};N(Cp,`id`,`radar`),N(Cp,`defaults`,{datasetElementType:`line`,dataElementType:`point`,indexAxis:`r`,showLine:!0,elements:{line:{fill:`start`}}}),N(Cp,`overrides`,{aspectRatio:1,scales:{r:{type:`radialLinear`}}});var wp=class extends ep{getLabelAndValue(e){let t=this._cachedMeta,n=this.chart.data.labels||[],{xScale:r,yScale:i}=t,a=this.getParsed(e),o=r.getLabelForValue(a.x),s=i.getLabelForValue(a.y);return{label:n[e]||``,value:`(`+o+`, `+s+`)`}}update(e){let t=this._cachedMeta,{data:n=[]}=t,r=this.chart._animationsDisabled,{start:i,count:a}=hu(t,n,r);if(this._drawStart=i,this._drawCount=a,gu(t)&&(i=0,a=n.length),this.options.showLine){this.datasetElementType||this.addElements();let{dataset:i,_dataset:a}=t;i._chart=this.chart,i._datasetIndex=this.index,i._decimated=!!a._decimated,i.points=n;let o=this.resolveDatasetElementOptions(e);o.segment=this.options.segment,this.updateElement(i,void 0,{animated:!r,options:o},e)}else this.datasetElementType&&=(delete t.dataset,!1);this.updateElements(n,i,a,e)}addElements(){let{showLine:e}=this.options;!this.datasetElementType&&e&&(this.datasetElementType=this.chart.registry.getElement(`line`)),super.addElements()}updateElements(e,t,n,r){let i=r===`reset`,{iScale:a,vScale:o,_stacked:s,_dataset:c}=this._cachedMeta,l=this.resolveDataElementOptions(t,r),u=this.getSharedOptions(l),d=this.includeOptions(r,u),f=a.axis,p=o.axis,{spanGaps:m,segment:h}=this.options,g=Hl(m)?m:1/0,_=this.chart._animationsDisabled||i||r===`none`,v=t>0&&this.getParsed(t-1);for(let l=t;l<t+n;++l){let t=e[l],n=this.getParsed(l),m=_?t:{},y=I(n[p]),b=m[f]=a.getPixelForValue(n[f],l),x=m[p]=i||y?o.getBasePixel():o.getPixelForValue(s?this.applyStack(o,n,s):n[p],l);m.skip=isNaN(b)||isNaN(x)||y,m.stop=l>0&&Math.abs(n[f]-v[f])>g,h&&(m.parsed=n,m.raw=c.data[l]),d&&(m.options=u||this.resolveDataElementOptions(l,t.active?`active`:r)),_||this.updateElement(t,l,m,r),v=n}this.updateSharedOptions(u,r,l)}getMaxOverflow(){let e=this._cachedMeta,t=e.data||[];if(!this.options.showLine){let e=0;for(let n=t.length-1;n>=0;--n)e=Math.max(e,t[n].size(this.resolveDataElementOptions(n))/2);return e>0&&e}let n=e.dataset,r=n.options&&n.options.borderWidth||0;if(!t.length)return r;let i=t[0].size(this.resolveDataElementOptions(0)),a=t[t.length-1].size(this.resolveDataElementOptions(t.length-1));return Math.max(r,i,a)/2}};N(wp,`id`,`scatter`),N(wp,`defaults`,{datasetElementType:!1,dataElementType:`point`,showLine:!1,fill:!1}),N(wp,`overrides`,{interaction:{mode:`point`},scales:{x:{type:`linear`},y:{type:`linear`}}});var Tp=Object.freeze({__proto__:null,BarController:gp,BubbleController:_p,DoughnutController:yp,LineController:bp,PieController:Sp,PolarAreaController:xp,RadarController:Cp,ScatterController:wp});function Ep(){throw Error(`This method is not implemented: Check that a complete date adapter is provided.`)}var Dp={_date:class e{constructor(e){N(this,`options`),this.options=e||{}}static override(t){Object.assign(e.prototype,t)}init(){}formats(){return Ep()}parse(){return Ep()}format(){return Ep()}add(){return Ep()}diff(){return Ep()}startOf(){return Ep()}endOf(){return Ep()}}};function Op(e,t,n,r){let{controller:i,data:a,_sorted:o}=e,s=i._cachedMeta.iScale,c=e.dataset&&e.dataset.options?e.dataset.options.spanGaps:null;if(s&&t===s.axis&&t!==`r`&&o&&a.length){let o=s._reversePixels?ru:nu;if(r){if(i._sharedOptions){let e=a[0],r=typeof e.getRange==`function`&&e.getRange(t);if(r){let e=o(a,t,n-r),i=o(a,t,n+r);return{lo:e.lo,hi:i.hi}}}}else{let r=o(a,t,n);if(c){let{vScale:t}=i._cachedMeta,{_parsed:n}=e,a=n.slice(0,r.lo+1).reverse().findIndex(e=>!I(e[t.axis]));r.lo-=Math.max(0,a);let o=n.slice(r.hi).findIndex(e=>!I(e[t.axis]));r.hi+=Math.max(0,o)}return r}}return{lo:0,hi:a.length-1}}function kp(e,t,n,r,i){let a=e.getSortedVisibleDatasetMetas(),o=n[t];for(let e=0,n=a.length;e<n;++e){let{index:n,data:s}=a[e],{lo:c,hi:l}=Op(a[e],t,o,i);for(let e=c;e<=l;++e){let t=s[e];t.skip||r(t,n,e)}}}function Ap(e){let t=e.indexOf(`x`)!==-1,n=e.indexOf(`y`)!==-1;return function(e,r){let i=t?Math.abs(e.x-r.x):0,a=n?Math.abs(e.y-r.y):0;return Math.sqrt(i**2+a**2)}}function jp(e,t,n,r,i){let a=[];return!i&&!e.isPointInArea(t)||kp(e,n,t,function(n,o,s){!i&&!Ku(n,e.chartArea,0)||n.inRange(t.x,t.y,r)&&a.push({element:n,datasetIndex:o,index:s})},!0),a}function Mp(e,t,n,r){let i=[];function a(e,n,a){let{startAngle:o,endAngle:s}=e.getProps([`startAngle`,`endAngle`],r),{angle:c}=Jl(e,{x:t.x,y:t.y});Ql(c,o,s)&&i.push({element:e,datasetIndex:n,index:a})}return kp(e,n,t,a),i}function Np(e,t,n,r,i,a){let o=[],s=Ap(n),c=1/0;function l(n,l,u){let d=n.inRange(t.x,t.y,i);if(r&&!d)return;let f=n.getCenterPoint(i);if(!(a||e.isPointInArea(f))&&!d)return;let p=s(t,f);p<c?(o=[{element:n,datasetIndex:l,index:u}],c=p):p===c&&o.push({element:n,datasetIndex:l,index:u})}return kp(e,n,t,l),o}function Pp(e,t,n,r,i,a){return!a&&!e.isPointInArea(t)?[]:n===`r`&&!r?Mp(e,t,n,i):Np(e,t,n,r,i,a)}function Fp(e,t,n,r,i){let a=[],o=n===`x`?`inXRange`:`inYRange`,s=!1;return kp(e,n,t,(e,r,c)=>{e[o]&&e[o](t[n],i)&&(a.push({element:e,datasetIndex:r,index:c}),s||=e.inRange(t.x,t.y,i))}),r&&!s?[]:a}var Ip={modes:{index(e,t,n,r){let i=Zd(t,e),a=n.axis||`x`,o=n.includeInvisible||!1,s=n.intersect?jp(e,i,a,r,o):Pp(e,i,a,!1,r,o),c=[];return s.length?(e.getSortedVisibleDatasetMetas().forEach(e=>{let t=s[0].index,n=e.data[t];n&&!n.skip&&c.push({element:n,datasetIndex:e.index,index:t})}),c):[]},dataset(e,t,n,r){let i=Zd(t,e),a=n.axis||`xy`,o=n.includeInvisible||!1,s=n.intersect?jp(e,i,a,r,o):Pp(e,i,a,!1,r,o);if(s.length>0){let t=s[0].datasetIndex,n=e.getDatasetMeta(t).data;s=[];for(let e=0;e<n.length;++e)s.push({element:n[e],datasetIndex:t,index:e})}return s},point(e,t,n,r){return jp(e,Zd(t,e),n.axis||`xy`,r,n.includeInvisible||!1)},nearest(e,t,n,r){let i=Zd(t,e),a=n.axis||`xy`,o=n.includeInvisible||!1;return Pp(e,i,a,n.intersect,r,o)},x(e,t,n,r){return Fp(e,Zd(t,e),`x`,n.intersect,r)},y(e,t,n,r){return Fp(e,Zd(t,e),`y`,n.intersect,r)}}},Lp=[`left`,`top`,`right`,`bottom`];function Rp(e,t){return e.filter(e=>e.pos===t)}function zp(e,t){return e.filter(e=>Lp.indexOf(e.pos)===-1&&e.box.axis===t)}function Bp(e,t){return e.sort((e,n)=>{let r=t?n:e,i=t?e:n;return r.weight===i.weight?r.index-i.index:r.weight-i.weight})}function Vp(e){let t=[],n,r,i,a,o,s;for(n=0,r=(e||[]).length;n<r;++n)i=e[n],{position:a,options:{stack:o,stackWeight:s=1}}=i,t.push({index:n,box:i,pos:a,horizontal:i.isHorizontal(),weight:i.weight,stack:o&&a+o,stackWeight:s});return t}function Hp(e){let t={};for(let n of e){let{stack:e,pos:r,stackWeight:i}=n;if(!e||!Lp.includes(r))continue;let a=t[e]||(t[e]={count:0,placed:0,weight:0,size:0});a.count++,a.weight+=i}return t}function Up(e,t){let n=Hp(e),{vBoxMaxWidth:r,hBoxMaxHeight:i}=t,a,o,s;for(a=0,o=e.length;a<o;++a){s=e[a];let{fullSize:o}=s.box,c=n[s.stack],l=c&&s.stackWeight/c.weight;s.horizontal?(s.width=l?l*r:o&&t.availableWidth,s.height=i):(s.width=r,s.height=l?l*i:o&&t.availableHeight)}return n}function Wp(e){let t=Vp(e),n=Bp(t.filter(e=>e.box.fullSize),!0),r=Bp(Rp(t,`left`),!0),i=Bp(Rp(t,`right`)),a=Bp(Rp(t,`top`),!0),o=Bp(Rp(t,`bottom`)),s=zp(t,`x`),c=zp(t,`y`);return{fullSize:n,leftAndTop:r.concat(a),rightAndBottom:i.concat(c).concat(o).concat(s),chartArea:Rp(t,`chartArea`),vertical:r.concat(i).concat(c),horizontal:a.concat(o).concat(s)}}function Gp(e,t,n,r){return Math.max(e[n],t[n])+Math.max(e[r],t[r])}function Kp(e,t){e.top=Math.max(e.top,t.top),e.left=Math.max(e.left,t.left),e.bottom=Math.max(e.bottom,t.bottom),e.right=Math.max(e.right,t.right)}function qp(e,t,n,r){let{pos:i,box:a}=n,o=e.maxPadding;if(!R(i)){n.size&&(e[i]-=n.size);let t=r[n.stack]||{size:0,count:1};t.size=Math.max(t.size,n.horizontal?a.height:a.width),n.size=t.size/t.count,e[i]+=n.size}a.getPadding&&Kp(o,a.getPadding());let s=Math.max(0,t.outerWidth-Gp(o,e,`left`,`right`)),c=Math.max(0,t.outerHeight-Gp(o,e,`top`,`bottom`)),l=s!==e.w,u=c!==e.h;return e.w=s,e.h=c,n.horizontal?{same:l,other:u}:{same:u,other:l}}function Jp(e){let t=e.maxPadding;function n(n){let r=Math.max(t[n]-e[n],0);return e[n]+=r,r}e.y+=n(`top`),e.x+=n(`left`),n(`right`),n(`bottom`)}function Yp(e,t){let n=t.maxPadding;function r(e){let r={left:0,top:0,right:0,bottom:0};return e.forEach(e=>{r[e]=Math.max(t[e],n[e])}),r}return r(e?[`left`,`right`]:[`top`,`bottom`])}function Xp(e,t,n,r){let i=[],a,o,s,c,l,u;for(a=0,o=e.length,l=0;a<o;++a){s=e[a],c=s.box,c.update(s.width||t.w,s.height||t.h,Yp(s.horizontal,t));let{same:o,other:d}=qp(t,n,s,r);l|=o&&i.length,u||=d,c.fullSize||i.push(s)}return l&&Xp(i,t,n,r)||u}function Zp(e,t,n,r,i){e.top=n,e.left=t,e.right=t+r,e.bottom=n+i,e.width=r,e.height=i}function Qp(e,t,n,r){let i=n.padding,{x:a,y:o}=t;for(let s of e){let e=s.box,c=r[s.stack]||{placed:0,weight:1},l=s.stackWeight/c.weight||1;if(s.horizontal){let r=t.w*l,a=c.size||e.height;Dl(c.start)&&(o=c.start),e.fullSize?Zp(e,i.left,o,n.outerWidth-i.right-i.left,a):Zp(e,t.left+c.placed,o,r,a),c.start=o,c.placed+=r,o=e.bottom}else{let r=t.h*l,o=c.size||e.width;Dl(c.start)&&(a=c.start),e.fullSize?Zp(e,a,i.top,o,n.outerHeight-i.bottom-i.top):Zp(e,a,t.top+c.placed,o,r),c.start=a,c.placed+=r,a=e.right}}t.x=a,t.y=o}var $p={addBox(e,t){e.boxes||=[],t.fullSize=t.fullSize||!1,t.position=t.position||`top`,t.weight=t.weight||0,t._layers=t._layers||function(){return[{z:0,draw(e){t.draw(e)}}]},e.boxes.push(t)},removeBox(e,t){let n=e.boxes?e.boxes.indexOf(t):-1;n!==-1&&e.boxes.splice(n,1)},configure(e,t,n){t.fullSize=n.fullSize,t.position=n.position,t.weight=n.weight},update(e,t,n,r){if(!e)return;let i=ld(e.options.layout.padding),a=Math.max(t-i.width,0),o=Math.max(n-i.height,0),s=Wp(e.boxes),c=s.vertical,l=s.horizontal;H(e.boxes,e=>{typeof e.beforeLayout==`function`&&e.beforeLayout()});let u=c.reduce((e,t)=>t.box.options&&t.box.options.display===!1?e:e+1,0)||1,d=Object.freeze({outerWidth:t,outerHeight:n,padding:i,availableWidth:a,availableHeight:o,vBoxMaxWidth:a/2/u,hBoxMaxHeight:o/2}),f=Object.assign({},i);Kp(f,ld(r));let p=Object.assign({maxPadding:f,w:a,h:o,x:i.left,y:i.top},i),m=Up(c.concat(l),d);Xp(s.fullSize,p,d,m),Xp(c,p,d,m),Xp(l,p,d,m)&&Xp(c,p,d,m),Jp(p),Qp(s.leftAndTop,p,d,m),p.x+=p.w,p.y+=p.h,Qp(s.rightAndBottom,p,d,m),e.chartArea={left:p.left,top:p.top,right:p.left+p.w,bottom:p.top+p.h,height:p.h,width:p.w},H(s.chartArea,t=>{let n=t.box;Object.assign(n,e.chartArea),n.update(p.w,p.h,{left:0,top:0,right:0,bottom:0})})}},em=class{acquireContext(e,t){}releaseContext(e){return!1}addEventListener(e,t,n){}removeEventListener(e,t,n){}getDevicePixelRatio(){return 1}getMaximumSize(e,t,n,r){return t=Math.max(0,t||e.width),n||=e.height,{width:t,height:Math.max(0,r?Math.floor(t/r):n)}}isAttached(e){return!0}updateConfig(e){}},tm=class extends em{acquireContext(e){return e&&e.getContext&&e.getContext(`2d`)||null}updateConfig(e){e.options.animation=!1}},nm=`$chartjs`,rm={touchstart:`mousedown`,touchmove:`mousemove`,touchend:`mouseup`,pointerenter:`mouseenter`,pointerdown:`mousedown`,pointermove:`mousemove`,pointerup:`mouseup`,pointerleave:`mouseout`,pointerout:`mouseout`},im=e=>e===null||e===``;function am(e,t){let n=e.style,r=e.getAttribute(`height`),i=e.getAttribute(`width`);if(e[nm]={initial:{height:r,width:i,style:{display:n.display,height:n.height,width:n.width}}},n.display=n.display||`block`,n.boxSizing=n.boxSizing||`border-box`,im(i)){let t=rf(e,`width`);t!==void 0&&(e.width=t)}if(im(r)){if(e.style.height===``)e.height=e.width/(t||2);else{let t=rf(e,`height`);t!==void 0&&(e.height=t)}}return e}var om=nf?{passive:!0}:!1;function sm(e,t,n){e&&e.addEventListener(t,n,om)}function cm(e,t,n){e&&e.canvas&&e.canvas.removeEventListener(t,n,om)}function lm(e,t){let n=rm[e.type]||e.type,{x:r,y:i}=Zd(e,t);return{type:n,chart:t,native:e,x:r===void 0?null:r,y:i===void 0?null:i}}function um(e,t){for(let n of e)if(n===t||n.contains(t))return!0}function dm(e,t,n){let r=e.canvas,i=new MutationObserver(e=>{let t=!1;for(let n of e)t||=um(n.addedNodes,r),t&&=!um(n.removedNodes,r);t&&n()});return i.observe(document,{childList:!0,subtree:!0}),i}function fm(e,t,n){let r=e.canvas,i=new MutationObserver(e=>{let t=!1;for(let n of e)t||=um(n.removedNodes,r),t&&=!um(n.addedNodes,r);t&&n()});return i.observe(document,{childList:!0,subtree:!0}),i}var pm=new Map,mm=0;function hm(){let e=window.devicePixelRatio;e!==mm&&(mm=e,pm.forEach((t,n)=>{n.currentDevicePixelRatio!==e&&t()}))}function gm(e,t){pm.size||window.addEventListener(`resize`,hm),pm.set(e,t)}function _m(e){pm.delete(e),pm.size||window.removeEventListener(`resize`,hm)}function vm(e,t,n){let r=e.canvas,i=r&&Ud(r);if(!i)return;let a=uu((e,t)=>{let r=i.clientWidth;n(e,t),r<i.clientWidth&&n()},window),o=new ResizeObserver(e=>{let t=e[0],n=t.contentRect.width,r=t.contentRect.height;n===0&&r===0||a(n,r)});return o.observe(i),gm(e,a),o}function ym(e,t,n){n&&n.disconnect(),t===`resize`&&_m(e)}function bm(e,t,n){let r=e.canvas,i=uu(t=>{e.ctx!==null&&n(lm(t,e))},e);return sm(r,t,i),i}var xm=class extends em{acquireContext(e,t){let n=e&&e.getContext&&e.getContext(`2d`);return n&&n.canvas===e?(am(e,t),n):null}releaseContext(e){let t=e.canvas;if(!t[nm])return!1;let n=t[nm].initial;[`height`,`width`].forEach(e=>{let r=n[e];I(r)?t.removeAttribute(e):t.setAttribute(e,r)});let r=n.style||{};return Object.keys(r).forEach(e=>{t.style[e]=r[e]}),t.width=t.width,delete t[nm],!0}addEventListener(e,t,n){this.removeEventListener(e,t);let r=e.$proxies||={};r[t]=({attach:dm,detach:fm,resize:vm}[t]||bm)(e,t,n)}removeEventListener(e,t){let n=e.$proxies||={},r=n[t];r&&(({attach:ym,detach:ym,resize:ym}[t]||cm)(e,t,r),n[t]=void 0)}getDevicePixelRatio(){return window.devicePixelRatio}getMaximumSize(e,t,n,r){return ef(e,t,n,r)}isAttached(e){let t=e&&Ud(e);return!!(t&&t.isConnected)}};function Sm(e){return!Hd()||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas?tm:xm}var Cm,wm=(Cm=class{constructor(){N(this,`x`),N(this,`y`),N(this,`active`,!1),N(this,`options`),N(this,`$animations`)}tooltipPosition(e){let{x:t,y:n}=this.getProps([`x`,`y`],e);return{x:t,y:n}}hasValue(){return Hl(this.x)&&Hl(this.y)}getProps(e,t){let n=this.$animations;if(!t||!n)return this;let r={};return e.forEach(e=>{r[e]=n[e]&&n[e].active()?n[e]._to:this[e]}),r}},N(Cm,`defaults`,{}),N(Cm,`defaultRoutes`),Cm);function Tm(e,t){let n=e.options.ticks,r=Em(e),i=Math.min(n.maxTicksLimit||r,r),a=n.major.enabled?Om(t):[],o=a.length,s=a[0],c=a[o-1],l=[];if(o>i)return km(t,l,a,o/i),l;let u=Dm(a,t,i);if(o>0){let e,n,r=o>1?Math.round((c-s)/(o-1)):null;for(Am(t,l,u,I(r)?0:s-r,s),e=0,n=o-1;e<n;e++)Am(t,l,u,a[e],a[e+1]);return Am(t,l,u,c,I(r)?t.length:c+r),l}return Am(t,l,u),l}function Em(e){let t=e.options.offset,n=e._tickSize(),r=e._length/n+ +!t,i=e._maxLength/n;return Math.floor(Math.min(r,i))}function Dm(e,t,n){let r=jm(e),i=t.length/n;if(!r)return Math.max(i,1);let a=Bl(r);for(let e=0,t=a.length-1;e<t;e++){let t=a[e];if(t>i)return t}return Math.max(i,1)}function Om(e){let t=[],n,r;for(n=0,r=e.length;n<r;n++)e[n].major&&t.push(n);return t}function km(e,t,n,r){let i=0,a=n[0],o;for(r=Math.ceil(r),o=0;o<e.length;o++)o===a&&(t.push(e[o]),i++,a=n[i*r])}function Am(e,t,n,r,i){let a=B(r,0),o=Math.min(B(i,e.length),e.length),s=0,c,l,u;for(n=Math.ceil(n),i&&(c=i-r,n=c/Math.floor(c/n)),u=a;u<0;)s++,u=Math.round(a+s*n);for(l=Math.max(a,0);l<o;l++)l===u&&(t.push(e[l]),s++,u=Math.round(a+s*n))}function jm(e){let t=e.length,n,r;if(t<2)return!1;for(r=e[0],n=1;n<t;++n)if(e[n]-e[n-1]!==r)return!1;return r}var Mm=e=>e===`left`?`right`:e===`right`?`left`:e,Nm=(e,t,n)=>t===`top`||t===`left`?e[t]+n:e[t]-n,Pm=(e,t)=>Math.min(t||e,e);function Fm(e,t){let n=[],r=e.length/t,i=e.length,a=0;for(;a<i;a+=r)n.push(e[Math.floor(a)]);return n}function Im(e,t,n){let r=e.ticks.length,i=Math.min(t,r-1),a=e._startPixel,o=e._endPixel,s=1e-6,c=e.getPixelForTick(i),l;if(!(n&&(l=r===1?Math.max(c-a,o-c):t===0?(e.getPixelForTick(1)-c)/2:(c-e.getPixelForTick(i-1))/2,c+=i<t?l:-l,c<a-s||c>o+s)))return c}function Lm(e,t){H(e,e=>{let n=e.gc,r=n.length/2,i;if(r>t){for(i=0;i<r;++i)delete e.data[n[i]];n.splice(0,r)}})}function Rm(e){return e.drawTicks?e.tickLength:0}function zm(e,t){if(!e.display)return 0;let n=J(e.font,t),r=ld(e.padding);return(L(e.text)?e.text.length:1)*n.lineHeight+r.height}function Bm(e,t){return dd(e,{scale:t,type:`scale`})}function Vm(e,t,n){return dd(e,{tick:n,index:t,type:`tick`})}function Hm(e,t,n){let r=fu(e);return(n&&t!==`right`||!n&&t===`right`)&&(r=Mm(r)),r}function Um(e,t,n,r){let{top:i,left:a,bottom:o,right:s,chart:c}=e,{chartArea:l,scales:u}=c,d=0,f,p,m,h=o-i,g=s-a;if(e.isHorizontal()){if(p=pu(r,a,s),R(n)){let e=Object.keys(n)[0],r=n[e];m=u[e].getPixelForValue(r)+h-t}else m=n===`center`?(l.bottom+l.top)/2+h-t:Nm(e,n,t);f=s-a}else{if(R(n)){let e=Object.keys(n)[0],r=n[e];p=u[e].getPixelForValue(r)-g+t}else p=n===`center`?(l.left+l.right)/2-g+t:Nm(e,n,t);m=pu(r,o,i),d=n===`left`?-G:G}return{titleX:p,titleY:m,maxWidth:f,rotation:d}}var Wm=class e extends wm{constructor(e){super(),this.id=e.id,this.type=e.type,this.options=void 0,this.ctx=e.ctx,this.chart=e.chart,this.top=void 0,this.bottom=void 0,this.left=void 0,this.right=void 0,this.width=void 0,this.height=void 0,this._margins={left:0,right:0,top:0,bottom:0},this.maxWidth=void 0,this.maxHeight=void 0,this.paddingTop=void 0,this.paddingBottom=void 0,this.paddingLeft=void 0,this.paddingRight=void 0,this.axis=void 0,this.labelRotation=void 0,this.min=void 0,this.max=void 0,this._range=void 0,this.ticks=[],this._gridLineItems=null,this._labelItems=null,this._labelSizes=null,this._length=0,this._maxLength=0,this._longestTextCache={},this._startPixel=void 0,this._endPixel=void 0,this._reversePixels=!1,this._userMax=void 0,this._userMin=void 0,this._suggestedMax=void 0,this._suggestedMin=void 0,this._ticksLength=0,this._borderValue=0,this._cache={},this._dataLimitsCached=!1,this.$context=void 0}init(e){this.options=e.setContext(this.getContext()),this.axis=e.axis,this._userMin=this.parse(e.min),this._userMax=this.parse(e.max),this._suggestedMin=this.parse(e.suggestedMin),this._suggestedMax=this.parse(e.suggestedMax)}parse(e,t){return e}getUserBounds(){let{_userMin:e,_userMax:t,_suggestedMin:n,_suggestedMax:r}=this;return e=fl(e,1/0),t=fl(t,-1/0),n=fl(n,1/0),r=fl(r,-1/0),{min:fl(e,n),max:fl(t,r),minDefined:z(e),maxDefined:z(t)}}getMinMax(e){let{min:t,max:n,minDefined:r,maxDefined:i}=this.getUserBounds(),a;if(r&&i)return{min:t,max:n};let o=this.getMatchingVisibleMetas();for(let s=0,c=o.length;s<c;++s)a=o[s].controller.getMinMax(this,e),r||(t=Math.min(t,a.min)),i||(n=Math.max(n,a.max));return t=i&&t>n?n:t,n=r&&t>n?t:n,{min:fl(t,fl(n,t)),max:fl(n,fl(t,n))}}getPadding(){return{left:this.paddingLeft||0,top:this.paddingTop||0,right:this.paddingRight||0,bottom:this.paddingBottom||0}}getTicks(){return this.ticks}getLabels(){let e=this.chart.data;return this.options.labels||(this.isHorizontal()?e.xLabels:e.yLabels)||e.labels||[]}getLabelItems(e=this.chart.chartArea){return this._labelItems||=this._computeLabelItems(e)}beforeLayout(){this._cache={},this._dataLimitsCached=!1}beforeUpdate(){V(this.options.beforeUpdate,[this])}update(e,t,n){let{beginAtZero:r,grace:i,ticks:a}=this.options,o=a.sampleSize;this.beforeUpdate(),this.maxWidth=e,this.maxHeight=t,this._margins=n=Object.assign({left:0,right:0,top:0,bottom:0},n),this.ticks=null,this._labelSizes=null,this._gridLineItems=null,this._labelItems=null,this.beforeSetDimensions(),this.setDimensions(),this.afterSetDimensions(),this._maxLength=this.isHorizontal()?this.width+n.left+n.right:this.height+n.top+n.bottom,this._dataLimitsCached||=(this.beforeDataLimits(),this.determineDataLimits(),this.afterDataLimits(),this._range=ud(this,i,r),!0),this.beforeBuildTicks(),this.ticks=this.buildTicks()||[],this.afterBuildTicks();let s=o<this.ticks.length;this._convertTicksToLabels(s?Fm(this.ticks,o):this.ticks),this.configure(),this.beforeCalculateLabelRotation(),this.calculateLabelRotation(),this.afterCalculateLabelRotation(),a.display&&(a.autoSkip||a.source===`auto`)&&(this.ticks=Tm(this,this.ticks),this._labelSizes=null,this.afterAutoSkip()),s&&this._convertTicksToLabels(this.ticks),this.beforeFit(),this.fit(),this.afterFit(),this.afterUpdate()}configure(){let e=this.options.reverse,t,n;this.isHorizontal()?(t=this.left,n=this.right):(t=this.top,n=this.bottom,e=!e),this._startPixel=t,this._endPixel=n,this._reversePixels=e,this._length=n-t,this._alignToPixels=this.options.alignToPixels}afterUpdate(){V(this.options.afterUpdate,[this])}beforeSetDimensions(){V(this.options.beforeSetDimensions,[this])}setDimensions(){this.isHorizontal()?(this.width=this.maxWidth,this.left=0,this.right=this.width):(this.height=this.maxHeight,this.top=0,this.bottom=this.height),this.paddingLeft=0,this.paddingTop=0,this.paddingRight=0,this.paddingBottom=0}afterSetDimensions(){V(this.options.afterSetDimensions,[this])}_callHooks(e){this.chart.notifyPlugins(e,this.getContext()),V(this.options[e],[this])}beforeDataLimits(){this._callHooks(`beforeDataLimits`)}determineDataLimits(){}afterDataLimits(){this._callHooks(`afterDataLimits`)}beforeBuildTicks(){this._callHooks(`beforeBuildTicks`)}buildTicks(){return[]}afterBuildTicks(){this._callHooks(`afterBuildTicks`)}beforeTickToLabelConversion(){V(this.options.beforeTickToLabelConversion,[this])}generateTickLabels(e){let t=this.options.ticks,n,r,i;for(n=0,r=e.length;n<r;n++)i=e[n],i.label=V(t.callback,[i.value,n,e],this)}afterTickToLabelConversion(){V(this.options.afterTickToLabelConversion,[this])}beforeCalculateLabelRotation(){V(this.options.beforeCalculateLabelRotation,[this])}calculateLabelRotation(){let e=this.options,t=e.ticks,n=Pm(this.ticks.length,e.ticks.maxTicksLimit),r=t.minRotation||0,i=t.maxRotation,a=r,o,s,c;if(!this._isVisible()||!t.display||r>=i||n<=1||!this.isHorizontal()){this.labelRotation=r;return}let l=this._getLabelSizes(),u=l.widest.width,d=l.highest.height,f=K(this.chart.width-u,0,this.maxWidth);o=e.offset?this.maxWidth/n:f/(n-1),u+6>o&&(o=f/(n-(e.offset?.5:1)),s=this.maxHeight-Rm(e.grid)-t.padding-zm(e.title,this.chart.options.font),c=Math.sqrt(u*u+d*d),a=Kl(Math.min(Math.asin(K((l.highest.height+6)/o,-1,1)),Math.asin(K(s/c,-1,1))-Math.asin(K(d/c,-1,1)))),a=Math.max(r,Math.min(i,a))),this.labelRotation=a}afterCalculateLabelRotation(){V(this.options.afterCalculateLabelRotation,[this])}afterAutoSkip(){}beforeFit(){V(this.options.beforeFit,[this])}fit(){let e={width:0,height:0},{chart:t,options:{ticks:n,title:r,grid:i}}=this,a=this._isVisible(),o=this.isHorizontal();if(a){let a=zm(r,t.options.font);if(o?(e.width=this.maxWidth,e.height=Rm(i)+a):(e.height=this.maxHeight,e.width=Rm(i)+a),n.display&&this.ticks.length){let{first:t,last:r,widest:i,highest:a}=this._getLabelSizes(),s=n.padding*2,c=Gl(this.labelRotation),l=Math.cos(c),u=Math.sin(c);if(o){let t=n.mirror?0:u*i.width+l*a.height;e.height=Math.min(this.maxHeight,e.height+t+s)}else{let t=n.mirror?0:l*i.width+u*a.height;e.width=Math.min(this.maxWidth,e.width+t+s)}this._calculatePadding(t,r,u,l)}}this._handleMargins(),o?(this.width=this._length=t.width-this._margins.left-this._margins.right,this.height=e.height):(this.width=e.width,this.height=this._length=t.height-this._margins.top-this._margins.bottom)}_calculatePadding(e,t,n,r){let{ticks:{align:i,padding:a},position:o}=this.options,s=this.labelRotation!==0,c=o!==`top`&&this.axis===`x`;if(this.isHorizontal()){let o=this.getPixelForTick(0)-this.left,l=this.right-this.getPixelForTick(this.ticks.length-1),u=0,d=0;s?c?(u=r*e.width,d=n*t.height):(u=n*e.height,d=r*t.width):i===`start`?d=t.width:i===`end`?u=e.width:i!==`inner`&&(u=e.width/2,d=t.width/2),this.paddingLeft=Math.max((u-o+a)*this.width/(this.width-o),0),this.paddingRight=Math.max((d-l+a)*this.width/(this.width-l),0)}else{let n=t.height/2,r=e.height/2;i===`start`?(n=0,r=e.height):i===`end`&&(n=t.height,r=0),this.paddingTop=n+a,this.paddingBottom=r+a}}_handleMargins(){this._margins&&(this._margins.left=Math.max(this.paddingLeft,this._margins.left),this._margins.top=Math.max(this.paddingTop,this._margins.top),this._margins.right=Math.max(this.paddingRight,this._margins.right),this._margins.bottom=Math.max(this.paddingBottom,this._margins.bottom))}afterFit(){V(this.options.afterFit,[this])}isHorizontal(){let{axis:e,position:t}=this.options;return t===`top`||t===`bottom`||e===`x`}isFullSize(){return this.options.fullSize}_convertTicksToLabels(e){this.beforeTickToLabelConversion(),this.generateTickLabels(e);let t,n;for(t=0,n=e.length;t<n;t++)I(e[t].label)&&(e.splice(t,1),n--,t--);this.afterTickToLabelConversion()}_getLabelSizes(){let e=this._labelSizes;if(!e){let t=this.options.ticks.sampleSize,n=this.ticks;t<n.length&&(n=Fm(n,t)),this._labelSizes=e=this._computeLabelSizes(n,n.length,this.options.ticks.maxTicksLimit)}return e}_computeLabelSizes(e,t,n){let{ctx:r,_longestTextCache:i}=this,a=[],o=[],s=Math.floor(t/Pm(t,n)),c=0,l=0,u,d,f,p,m,h,g,_,v,y,b;for(u=0;u<t;u+=s){if(p=e[u].label,m=this._resolveTickFontOptions(u),r.font=h=m.string,g=i[h]=i[h]||{data:{},gc:[]},_=m.lineHeight,v=y=0,!I(p)&&!L(p))v=Bu(r,g.data,g.gc,v,p),y=_;else if(L(p))for(d=0,f=p.length;d<f;++d)b=p[d],!I(b)&&!L(b)&&(v=Bu(r,g.data,g.gc,v,b),y+=_);a.push(v),o.push(y),c=Math.max(v,c),l=Math.max(y,l)}Lm(i,t);let x=a.indexOf(c),S=o.indexOf(l),C=e=>({width:a[e]||0,height:o[e]||0});return{first:C(0),last:C(t-1),widest:C(x),highest:C(S),widths:a,heights:o}}getLabelForValue(e){return e}getPixelForValue(e,t){return NaN}getValueForPixel(e){}getPixelForTick(e){let t=this.ticks;return e<0||e>t.length-1?null:this.getPixelForValue(t[e].value)}getPixelForDecimal(e){this._reversePixels&&(e=1-e);let t=this._startPixel+e*this._length;return $l(this._alignToPixels?Hu(this.chart,t,0):t)}getDecimalForPixel(e){let t=(e-this._startPixel)/this._length;return this._reversePixels?1-t:t}getBasePixel(){return this.getPixelForValue(this.getBaseValue())}getBaseValue(){let{min:e,max:t}=this;return e<0&&t<0?t:e>0&&t>0?e:0}getContext(e){let t=this.ticks||[];if(e>=0&&e<t.length){let n=t[e];return n.$context||=Vm(this.getContext(),e,n)}return this.$context||=Bm(this.chart.getContext(),this)}_tickSize(){let e=this.options.ticks,t=Gl(this.labelRotation),n=Math.abs(Math.cos(t)),r=Math.abs(Math.sin(t)),i=this._getLabelSizes(),a=e.autoSkipPadding||0,o=i?i.widest.width+a:0,s=i?i.highest.height+a:0;return this.isHorizontal()?s*n>o*r?o/n:s/r:s*r<o*n?s/n:o/r}_isVisible(){let e=this.options.display;return e===`auto`?this.getMatchingVisibleMetas().length>0:!!e}_computeGridLineItems(e){let t=this.axis,n=this.chart,r=this.options,{grid:i,position:a,border:o}=r,s=i.offset,c=this.isHorizontal(),l=this.ticks.length+ +!!s,u=Rm(i),d=[],f=o.setContext(this.getContext()),p=f.display?f.width:0,m=p/2,h=function(e){return Hu(n,e,p)},g,_,v,y,b,x,S,C,w,T,E,ee;if(a===`top`)g=h(this.bottom),x=this.bottom-u,C=g-m,T=h(e.top)+m,ee=e.bottom;else if(a===`bottom`)g=h(this.top),T=e.top,ee=h(e.bottom)-m,x=g+m,C=this.top+u;else if(a===`left`)g=h(this.right),b=this.right-u,S=g-m,w=h(e.left)+m,E=e.right;else if(a===`right`)g=h(this.left),w=e.left,E=h(e.right)-m,b=g+m,S=this.left+u;else if(t===`x`){if(a===`center`)g=h((e.top+e.bottom)/2+.5);else if(R(a)){let e=Object.keys(a)[0],t=a[e];g=h(this.chart.scales[e].getPixelForValue(t))}T=e.top,ee=e.bottom,x=g+m,C=x+u}else if(t===`y`){if(a===`center`)g=h((e.left+e.right)/2);else if(R(a)){let e=Object.keys(a)[0],t=a[e];g=h(this.chart.scales[e].getPixelForValue(t))}b=g-m,S=b-u,w=e.left,E=e.right}let te=B(r.ticks.maxTicksLimit,l),D=Math.max(1,Math.ceil(l/te));for(_=0;_<l;_+=D){let e=this.getContext(_),t=i.setContext(e),r=o.setContext(e),a=t.lineWidth,l=t.color,u=r.dash||[],f=r.dashOffset,p=t.tickWidth,m=t.tickColor,h=t.tickBorderDash||[],g=t.tickBorderDashOffset;v=Im(this,_,s),v!==void 0&&(y=Hu(n,v,a),c?b=S=w=E=y:x=C=T=ee=y,d.push({tx1:b,ty1:x,tx2:S,ty2:C,x1:w,y1:T,x2:E,y2:ee,width:a,color:l,borderDash:u,borderDashOffset:f,tickWidth:p,tickColor:m,tickBorderDash:h,tickBorderDashOffset:g}))}return this._ticksLength=l,this._borderValue=g,d}_computeLabelItems(e){let t=this.axis,n=this.options,{position:r,ticks:i}=n,a=this.isHorizontal(),o=this.ticks,{align:s,crossAlign:c,padding:l,mirror:u}=i,d=Rm(n.grid),f=d+l,p=u?-l:f,m=-Gl(this.labelRotation),h=[],g,_,v,y,b,x,S,C,w,T,E,ee,te=`middle`;if(r===`top`)x=this.bottom-p,S=this._getXAxisLabelAlignment();else if(r===`bottom`)x=this.top+p,S=this._getXAxisLabelAlignment();else if(r===`left`){let e=this._getYAxisLabelAlignment(d);S=e.textAlign,b=e.x}else if(r===`right`){let e=this._getYAxisLabelAlignment(d);S=e.textAlign,b=e.x}else if(t===`x`){if(r===`center`)x=(e.top+e.bottom)/2+f;else if(R(r)){let e=Object.keys(r)[0],t=r[e];x=this.chart.scales[e].getPixelForValue(t)+f}S=this._getXAxisLabelAlignment()}else if(t===`y`){if(r===`center`)b=(e.left+e.right)/2-f;else if(R(r)){let e=Object.keys(r)[0],t=r[e];b=this.chart.scales[e].getPixelForValue(t)}S=this._getYAxisLabelAlignment(d).textAlign}t===`y`&&(s===`start`?te=`top`:s===`end`&&(te=`bottom`));let D=this._getLabelSizes();for(g=0,_=o.length;g<_;++g){v=o[g],y=v.label;let e=i.setContext(this.getContext(g));C=this.getPixelForTick(g)+i.labelOffset,w=this._resolveTickFontOptions(g),T=w.lineHeight,E=L(y)?y.length:1;let t=E/2,n=e.color,s=e.textStrokeColor,l=e.textStrokeWidth,d=S;a?(b=C,S===`inner`&&(d=g===_-1?this.options.reverse?`left`:`right`:g===0?this.options.reverse?`right`:`left`:`center`),ee=r===`top`?c===`near`||m!==0?-E*T+T/2:c===`center`?-D.highest.height/2-t*T+T:-D.highest.height+T/2:c===`near`||m!==0?T/2:c===`center`?D.highest.height/2-t*T:D.highest.height-E*T,u&&(ee*=-1),m!==0&&!e.showLabelBackdrop&&(b+=T/2*Math.sin(m))):(x=C,ee=(1-E)*T/2);let f;if(e.showLabelBackdrop){let t=ld(e.backdropPadding),n=D.heights[g],r=D.widths[g],i=ee-t.top,a=0-t.left;switch(te){case`middle`:i-=n/2;break;case`bottom`:i-=n}switch(S){case`center`:a-=r/2;break;case`right`:a-=r;break;case`inner`:g===_-1?a-=r:g>0&&(a-=r/2)}f={left:a,top:i,width:r+t.width,height:n+t.height,color:e.backdropColor}}h.push({label:y,font:w,textOffset:ee,options:{rotation:m,color:n,strokeColor:s,strokeWidth:l,textAlign:d,textBaseline:te,translation:[b,x],backdrop:f}})}return h}_getXAxisLabelAlignment(){let{position:e,ticks:t}=this.options;if(-Gl(this.labelRotation))return e===`top`?`left`:`right`;let n=`center`;return t.align===`start`?n=`left`:t.align===`end`?n=`right`:t.align===`inner`&&(n=`inner`),n}_getYAxisLabelAlignment(e){let{position:t,ticks:{crossAlign:n,mirror:r,padding:i}}=this.options,a=this._getLabelSizes(),o=e+i,s=a.widest.width,c,l;return t===`left`?r?(l=this.right+i,n===`near`?c=`left`:n===`center`?(c=`center`,l+=s/2):(c=`right`,l+=s)):(l=this.right-o,n===`near`?c=`right`:n===`center`?(c=`center`,l-=s/2):(c=`left`,l=this.left)):t===`right`?r?(l=this.left+i,n===`near`?c=`right`:n===`center`?(c=`center`,l-=s/2):(c=`left`,l-=s)):(l=this.left+o,n===`near`?c=`left`:n===`center`?(c=`center`,l+=s/2):(c=`right`,l=this.right)):c=`right`,{textAlign:c,x:l}}_computeLabelArea(){if(this.options.ticks.mirror)return;let e=this.chart,t=this.options.position;if(t===`left`||t===`right`)return{top:0,left:this.left,bottom:e.height,right:this.right};if(t===`top`||t===`bottom`)return{top:this.top,left:0,bottom:this.bottom,right:e.width}}drawBackground(){let{ctx:e,options:{backgroundColor:t},left:n,top:r,width:i,height:a}=this;t&&(e.save(),e.fillStyle=t,e.fillRect(n,r,i,a),e.restore())}getLineWidthForValue(e){let t=this.options.grid;if(!this._isVisible()||!t.display)return 0;let n=this.ticks.findIndex(t=>t.value===e);return n>=0?t.setContext(this.getContext(n)).lineWidth:0}drawGrid(e){let t=this.options.grid,n=this.ctx,r=this._gridLineItems||=this._computeGridLineItems(e),i,a,o=(e,t,r)=>{!r.width||!r.color||(n.save(),n.lineWidth=r.width,n.strokeStyle=r.color,n.setLineDash(r.borderDash||[]),n.lineDashOffset=r.borderDashOffset,n.beginPath(),n.moveTo(e.x,e.y),n.lineTo(t.x,t.y),n.stroke(),n.restore())};if(t.display)for(i=0,a=r.length;i<a;++i){let e=r[i];t.drawOnChartArea&&o({x:e.x1,y:e.y1},{x:e.x2,y:e.y2},e),t.drawTicks&&o({x:e.tx1,y:e.ty1},{x:e.tx2,y:e.ty2},{color:e.tickColor,width:e.tickWidth,borderDash:e.tickBorderDash,borderDashOffset:e.tickBorderDashOffset})}}drawBorder(){let{chart:e,ctx:t,options:{border:n,grid:r}}=this,i=n.setContext(this.getContext()),a=n.display?i.width:0;if(!a)return;let o=r.setContext(this.getContext(0)).lineWidth,s=this._borderValue,c,l,u,d;this.isHorizontal()?(c=Hu(e,this.left,a)-a/2,l=Hu(e,this.right,o)+o/2,u=d=s):(u=Hu(e,this.top,a)-a/2,d=Hu(e,this.bottom,o)+o/2,c=l=s),t.save(),t.lineWidth=i.width,t.strokeStyle=i.color,t.beginPath(),t.moveTo(c,u),t.lineTo(l,d),t.stroke(),t.restore()}drawLabels(e){if(!this.options.ticks.display)return;let t=this.ctx,n=this._computeLabelArea();n&&qu(t,n);let r=this.getLabelItems(e);for(let e of r){let n=e.options,r=e.font,i=e.label,a=e.textOffset;ed(t,i,0,a,r,n)}n&&Ju(t)}drawTitle(){let{ctx:e,options:{position:t,title:n,reverse:r}}=this;if(!n.display)return;let i=J(n.font),a=ld(n.padding),o=n.align,s=i.lineHeight/2;t===`bottom`||t===`center`||R(t)?(s+=a.bottom,L(n.text)&&(s+=i.lineHeight*(n.text.length-1))):s+=a.top;let{titleX:c,titleY:l,maxWidth:u,rotation:d}=Um(this,s,t,o);ed(e,n.text,0,0,i,{color:n.color,maxWidth:u,rotation:d,textAlign:Hm(o,t,r),textBaseline:`middle`,translation:[c,l]})}draw(e){this._isVisible()&&(this.drawBackground(),this.drawGrid(e),this.drawBorder(),this.drawTitle(),this.drawLabels(e))}_layers(){let t=this.options,n=t.ticks&&t.ticks.z||0,r=B(t.grid&&t.grid.z,-1),i=B(t.border&&t.border.z,0);return!this._isVisible()||this.draw!==e.prototype.draw?[{z:n,draw:e=>{this.draw(e)}}]:[{z:r,draw:e=>{this.drawBackground(),this.drawGrid(e),this.drawTitle()}},{z:i,draw:()=>{this.drawBorder()}},{z:n,draw:e=>{this.drawLabels(e)}}]}getMatchingVisibleMetas(e){let t=this.chart.getSortedVisibleDatasetMetas(),n=this.axis+`AxisID`,r=[],i,a;for(i=0,a=t.length;i<a;++i){let a=t[i];a[n]===this.id&&(!e||a.type===e)&&r.push(a)}return r}_resolveTickFontOptions(e){return J(this.options.ticks.setContext(this.getContext(e)).font)}_maxDigits(){let e=this._resolveTickFontOptions(0).lineHeight;return(this.isHorizontal()?this.width:this.height)/e}},Gm=class{constructor(e,t,n){this.type=e,this.scope=t,this.override=n,this.items=Object.create(null)}isForType(e){return Object.prototype.isPrototypeOf.call(this.type.prototype,e.prototype)}register(e){let t=Object.getPrototypeOf(e),n;Jm(t)&&(n=this.register(t));let r=this.items,i=e.id,a=this.scope+`.`+i;if(!i)throw Error(`class does not have id: `+e);return i in r||(r[i]=e,Km(e,a,n),this.override&&q.override(e.id,e.overrides)),a}get(e){return this.items[e]}unregister(e){let t=this.items,n=e.id,r=this.scope;n in t&&delete t[n],r&&n in q[r]&&(delete q[r][n],this.override&&delete Fu[n])}};function Km(e,t,n){let r=yl(Object.create(null),[n?q.get(n):{},q.get(t),e.defaults]);q.set(t,r),e.defaultRoutes&&qm(t,e.defaultRoutes),e.descriptors&&q.describe(t,e.descriptors)}function qm(e,t){Object.keys(t).forEach(n=>{let r=n.split(`.`),i=r.pop(),a=[e].concat(r).join(`.`),o=t[n].split(`.`),s=o.pop(),c=o.join(`.`);q.route(a,i,c,s)})}function Jm(e){return`id`in e&&`defaults`in e}var Ym=new class{constructor(){this.controllers=new Gm(ep,`datasets`,!0),this.elements=new Gm(wm,`elements`),this.plugins=new Gm(Object,`plugins`),this.scales=new Gm(Wm,`scales`),this._typedRegistries=[this.controllers,this.scales,this.elements]}add(...e){this._each(`register`,e)}remove(...e){this._each(`unregister`,e)}addControllers(...e){this._each(`register`,e,this.controllers)}addElements(...e){this._each(`register`,e,this.elements)}addPlugins(...e){this._each(`register`,e,this.plugins)}addScales(...e){this._each(`register`,e,this.scales)}getController(e){return this._get(e,this.controllers,`controller`)}getElement(e){return this._get(e,this.elements,`element`)}getPlugin(e){return this._get(e,this.plugins,`plugin`)}getScale(e){return this._get(e,this.scales,`scale`)}removeControllers(...e){this._each(`unregister`,e,this.controllers)}removeElements(...e){this._each(`unregister`,e,this.elements)}removePlugins(...e){this._each(`unregister`,e,this.plugins)}removeScales(...e){this._each(`unregister`,e,this.scales)}_each(e,t,n){[...t].forEach(t=>{let r=n||this._getRegistryForType(t);n||r.isForType(t)||r===this.plugins&&t.id?this._exec(e,r,t):H(t,t=>{let r=n||this._getRegistryForType(t);this._exec(e,r,t)})})}_exec(e,t,n){let r=El(e);V(n[`before`+r],[],n),t[e](n),V(n[`after`+r],[],n)}_getRegistryForType(e){for(let t=0;t<this._typedRegistries.length;t++){let n=this._typedRegistries[t];if(n.isForType(e))return n}return this.plugins}_get(e,t,n){let r=t.get(e);if(r===void 0)throw Error(`"`+e+`" is not a registered `+n+`.`);return r}},Xm=class{constructor(){this._init=void 0}notify(e,t,n,r){if(t===`beforeInit`&&(this._init=this._createDescriptors(e,!0),this._notify(this._init,e,`install`)),this._init===void 0)return;let i=r?this._descriptors(e).filter(r):this._descriptors(e),a=this._notify(i,e,t,n);return t===`afterDestroy`&&(this._notify(i,e,`stop`),this._notify(this._init,e,`uninstall`),this._init=void 0),a}_notify(e,t,n,r){r||={};for(let i of e){let e=i.plugin,a=e[n];if(V(a,[t,r,i.options],e)===!1&&r.cancelable)return!1}return!0}invalidate(){I(this._cache)||(this._oldCache=this._cache,this._cache=void 0)}_descriptors(e){if(this._cache)return this._cache;let t=this._cache=this._createDescriptors(e);return this._notifyStateChanges(e),t}_createDescriptors(e,t){let n=e&&e.config,r=B(n.options&&n.options.plugins,{}),i=Zm(n);return r===!1&&!t?[]:$m(e,i,r,t)}_notifyStateChanges(e){let t=this._oldCache||[],n=this._cache,r=(e,t)=>e.filter(e=>!t.some(t=>e.plugin.id===t.plugin.id));this._notify(r(t,n),e,`stop`),this._notify(r(n,t),e,`start`)}};function Zm(e){let t={},n=[],r=Object.keys(Ym.plugins.items);for(let e=0;e<r.length;e++)n.push(Ym.getPlugin(r[e]));let i=e.plugins||[];for(let e=0;e<i.length;e++){let r=i[e];n.indexOf(r)===-1&&(n.push(r),t[r.id]=!0)}return{plugins:n,localIds:t}}function Qm(e,t){return!t&&e===!1?null:e===!0?{}:e}function $m(e,{plugins:t,localIds:n},r,i){let a=[],o=e.getContext();for(let s of t){let t=s.id,c=Qm(r[t],i);c!==null&&a.push({plugin:s,options:eh(e.config,{plugin:s,local:n[t]},c,o)})}return a}function eh(e,{plugin:t,local:n},r,i){let a=e.pluginScopeKeys(t),o=e.getOptionScopes(r,a);return n&&t.defaults&&o.push(t.defaults),e.createResolver(o,i,[``],{scriptable:!1,indexable:!1,allKeys:!0})}function th(e,t){let n=q.datasets[e]||{};return((t.datasets||{})[e]||{}).indexAxis||t.indexAxis||n.indexAxis||`x`}function nh(e,t){let n=e;return e===`_index_`?n=t:e===`_value_`&&(n=t===`x`?`y`:`x`),n}function rh(e,t){return e===t?`_index_`:`_value_`}function ih(e){if(e===`x`||e===`y`||e===`r`)return e}function ah(e){if(e===`top`||e===`bottom`)return`x`;if(e===`left`||e===`right`)return`y`}function oh(e,...t){if(ih(e))return e;for(let n of t){let t=n.axis||ah(n.position)||e.length>1&&ih(e[0].toLowerCase());if(t)return t}throw Error(`Cannot determine type of '${e}' axis. Please provide 'axis' or 'position' option.`)}function sh(e,t,n){if(n[t+`AxisID`]===e)return{axis:t}}function ch(e,t){if(t.data&&t.data.datasets){let n=t.data.datasets.filter(t=>t.xAxisID===e||t.yAxisID===e);if(n.length)return sh(e,`x`,n[0])||sh(e,`y`,n[0])}return{}}function lh(e,t){let n=Fu[e.type]||{scales:{}},r=t.scales||{},i=th(e.type,t),a=Object.create(null);return Object.keys(r).forEach(t=>{let o=r[t];if(!R(o))return console.error(`Invalid scale configuration for scale: ${t}`);if(o._proxy)return console.warn(`Ignoring resolver passed as options for scale: ${t}`);let s=oh(t,o,ch(t,e),q.scales[o.type]),c=rh(s,i),l=n.scales||{};a[t]=bl(Object.create(null),[{axis:s},o,l[s],l[c]])}),e.data.datasets.forEach(n=>{let i=n.type||e.type,o=n.indexAxis||th(i,t),s=(Fu[i]||{}).scales||{};Object.keys(s).forEach(e=>{let t=nh(e,o),i=n[t+`AxisID`]||t;a[i]=a[i]||Object.create(null),bl(a[i],[{axis:t},r[i],s[e]])})}),Object.keys(a).forEach(e=>{let t=a[e];bl(t,[q.scales[t.type],q.scale])}),a}function uh(e){let t=e.options||={};t.plugins=B(t.plugins,{}),t.scales=lh(e,t)}function dh(e){return e||={},e.datasets=e.datasets||[],e.labels=e.labels||[],e}function fh(e){return e||={},e.data=dh(e.data),uh(e),e}var ph=new Map,mh=new Set;function hh(e,t){let n=ph.get(e);return n||(n=t(),ph.set(e,n),mh.add(n)),n}var gh=(e,t,n)=>{let r=Tl(t,n);r!==void 0&&e.add(r)},_h=class{constructor(e){this._config=fh(e),this._scopeCache=new Map,this._resolverCache=new Map}get platform(){return this._config.platform}get type(){return this._config.type}set type(e){this._config.type=e}get data(){return this._config.data}set data(e){this._config.data=dh(e)}get options(){return this._config.options}set options(e){this._config.options=e}get plugins(){return this._config.plugins}update(){let e=this._config;this.clearCache(),uh(e)}clearCache(){this._scopeCache.clear(),this._resolverCache.clear()}datasetScopeKeys(e){return hh(e,()=>[[`datasets.${e}`,``]])}datasetAnimationScopeKeys(e,t){return hh(`${e}.transition.${t}`,()=>[[`datasets.${e}.transitions.${t}`,`transitions.${t}`],[`datasets.${e}`,``]])}datasetElementScopeKeys(e,t){return hh(`${e}-${t}`,()=>[[`datasets.${e}.elements.${t}`,`datasets.${e}`,`elements.${t}`,``]])}pluginScopeKeys(e){let t=e.id,n=this.type;return hh(`${n}-plugin-${t}`,()=>[[`plugins.${t}`,...e.additionalOptionScopes||[]]])}_cachedScopes(e,t){let n=this._scopeCache,r=n.get(e);return(!r||t)&&(r=new Map,n.set(e,r)),r}getOptionScopes(e,t,n){let{options:r,type:i}=this,a=this._cachedScopes(e,n),o=a.get(t);if(o)return o;let s=new Set;t.forEach(t=>{e&&(s.add(e),t.forEach(t=>gh(s,e,t))),t.forEach(e=>gh(s,r,e)),t.forEach(e=>gh(s,Fu[i]||{},e)),t.forEach(e=>gh(s,q,e)),t.forEach(e=>gh(s,Iu,e))});let c=Array.from(s);return c.length===0&&c.push(Object.create(null)),mh.has(t)&&a.set(t,c),c}chartOptionScopes(){let{options:e,type:t}=this;return[e,Fu[t]||{},q.datasets[t]||{},{type:t},q,Iu]}resolveNamedOptions(e,t,n,r=[``]){let i={$shared:!0},{resolver:a,subPrefixes:o}=vh(this._resolverCache,e,r),s=a;if(bh(a,t)){i.$shared=!1,n=Ol(n)?n():n;let t=this.createResolver(e,n,o);s=pd(a,n,t)}for(let e of t)i[e]=s[e];return i}createResolver(e,t,n=[``],r){let{resolver:i}=vh(this._resolverCache,e,n);return R(t)?pd(i,t,void 0,r):i}};function vh(e,t,n){let r=e.get(t);r||(r=new Map,e.set(t,r));let i=n.join(),a=r.get(i);return a||(a={resolver:fd(t,n),subPrefixes:n.filter(e=>!e.toLowerCase().includes(`hover`))},r.set(i,a)),a}var yh=e=>R(e)&&Object.getOwnPropertyNames(e).some(t=>Ol(e[t]));function bh(e,t){let{isScriptable:n,isIndexable:r}=md(e);for(let i of t){let t=n(i),a=r(i),o=(a||t)&&e[i];if(t&&(Ol(o)||yh(o))||a&&L(o))return!0}return!1}var xh=`4.5.1`,Sh=[`top`,`bottom`,`left`,`right`,`chartArea`];function Ch(e,t){return e===`top`||e===`bottom`||Sh.indexOf(e)===-1&&t===`x`}function wh(e,t){return function(n,r){return n[e]===r[e]?n[t]-r[t]:n[e]-r[e]}}function Th(e){let t=e.chart,n=t.options.animation;t.notifyPlugins(`afterRender`),V(n&&n.onComplete,[e],t)}function Eh(e){let t=e.chart,n=t.options.animation;V(n&&n.onProgress,[e],t)}function Dh(e){return Hd()&&typeof e==`string`?e=document.getElementById(e):e&&e.length&&(e=e[0]),e&&e.canvas&&(e=e.canvas),e}var Oh={},kh=e=>{let t=Dh(e);return Object.values(Oh).filter(e=>e.canvas===t).pop()};function Ah(e,t,n){let r=Object.keys(e);for(let i of r){let r=+i;if(r>=t){let a=e[i];delete e[i],(n>0||r>t)&&(e[r+n]=a)}}}function jh(e,t,n,r){return!n||e.type===`mouseout`?null:r?t:e}var Mh,Nh=(Mh=class{static register(...e){Ym.add(...e),Ph()}static unregister(...e){Ym.remove(...e),Ph()}constructor(e,t){let n=this.config=new _h(t),r=Dh(e),i=kh(r);if(i)throw Error(`Canvas is already in use. Chart with ID '`+i.id+`' must be destroyed before the canvas with ID '`+i.canvas.id+`' can be reused.`);let a=n.createResolver(n.chartOptionScopes(),this.getContext());this.platform=new(n.platform||(Sm(r))),this.platform.updateConfig(n);let o=this.platform.acquireContext(r,a.aspectRatio),s=o&&o.canvas,c=s&&s.height,l=s&&s.width;if(this.id=dl(),this.ctx=o,this.canvas=s,this.width=l,this.height=c,this._options=a,this._aspectRatio=this.aspectRatio,this._layers=[],this._metasets=[],this._stacks=void 0,this.boxes=[],this.currentDevicePixelRatio=void 0,this.chartArea=void 0,this._active=[],this._lastEvent=void 0,this._listeners={},this._responsiveListeners=void 0,this._sortedMetasets=[],this.scales={},this._plugins=new Xm,this.$proxies={},this._hiddenIndices={},this.attached=!1,this._animationsDisabled=void 0,this.$context=void 0,this._doResize=du(e=>this.update(e),a.resizeDelay||0),this._dataChanges=[],Oh[this.id]=this,!o||!s){console.error(`Failed to create chart: can't acquire context from the given item`);return}Of.listen(this,`complete`,Th),Of.listen(this,`progress`,Eh),this._initialize(),this.attached&&this.update()}get aspectRatio(){let{options:{aspectRatio:e,maintainAspectRatio:t},width:n,height:r,_aspectRatio:i}=this;return I(e)?t&&i?i:r?n/r:null:e}get data(){return this.config.data}set data(e){this.config.data=e}get options(){return this._options}set options(e){this.config.options=e}get registry(){return Ym}_initialize(){return this.notifyPlugins(`beforeInit`),this.options.responsive?this.resize():tf(this,this.options.devicePixelRatio),this.bindEvents(),this.notifyPlugins(`afterInit`),this}clear(){return Uu(this.canvas,this.ctx),this}stop(){return Of.stop(this),this}resize(e,t){Of.running(this)?this._resizeBeforeDraw={width:e,height:t}:this._resize(e,t)}_resize(e,t){let n=this.options,r=this.canvas,i=n.maintainAspectRatio&&this.aspectRatio,a=this.platform.getMaximumSize(r,e,t,i),o=n.devicePixelRatio||this.platform.getDevicePixelRatio(),s=this.width?`resize`:`attach`;this.width=a.width,this.height=a.height,this._aspectRatio=this.aspectRatio,tf(this,o,!0)&&(this.notifyPlugins(`resize`,{size:a}),V(n.onResize,[this,a],this),this.attached&&this._doResize(s)&&this.render())}ensureScalesHaveIDs(){H(this.options.scales||{},(e,t)=>{e.id=t})}buildOrUpdateScales(){let e=this.options,t=e.scales,n=this.scales,r=Object.keys(n).reduce((e,t)=>(e[t]=!1,e),{}),i=[];t&&(i=i.concat(Object.keys(t).map(e=>{let n=t[e],r=oh(e,n),i=r===`r`,a=r===`x`;return{options:n,dposition:i?`chartArea`:a?`bottom`:`left`,dtype:i?`radialLinear`:a?`category`:`linear`}}))),H(i,t=>{let i=t.options,a=i.id,o=oh(a,i),s=B(i.type,t.dtype);(i.position===void 0||Ch(i.position,o)!==Ch(t.dposition))&&(i.position=t.dposition),r[a]=!0;let c=null;a in n&&n[a].type===s?c=n[a]:(c=new(Ym.getScale(s))({id:a,type:s,ctx:this.ctx,chart:this}),n[c.id]=c),c.init(i,e)}),H(r,(e,t)=>{e||delete n[t]}),H(n,e=>{$p.configure(this,e,e.options),$p.addBox(this,e)})}_updateMetasets(){let e=this._metasets,t=this.data.datasets.length,n=e.length;if(e.sort((e,t)=>e.index-t.index),n>t){for(let e=t;e<n;++e)this._destroyDatasetMeta(e);e.splice(t,n-t)}this._sortedMetasets=e.slice(0).sort(wh(`order`,`index`))}_removeUnreferencedMetasets(){let{_metasets:e,data:{datasets:t}}=this;e.length>t.length&&delete this._stacks,e.forEach((e,n)=>{t.filter(t=>t===e._dataset).length===0&&this._destroyDatasetMeta(n)})}buildOrUpdateControllers(){let e=[],t=this.data.datasets,n,r;for(this._removeUnreferencedMetasets(),n=0,r=t.length;n<r;n++){let r=t[n],i=this.getDatasetMeta(n),a=r.type||this.config.type;if(i.type&&i.type!==a&&(this._destroyDatasetMeta(n),i=this.getDatasetMeta(n)),i.type=a,i.indexAxis=r.indexAxis||th(a,this.options),i.order=r.order||0,i.index=n,i.label=``+r.label,i.visible=this.isDatasetVisible(n),i.controller)i.controller.updateIndex(n),i.controller.linkScales();else{let t=Ym.getController(a),{datasetElementType:r,dataElementType:o}=q.datasets[a];Object.assign(t,{dataElementType:Ym.getElement(o),datasetElementType:r&&Ym.getElement(r)}),i.controller=new t(this,n),e.push(i.controller)}}return this._updateMetasets(),e}_resetElements(){H(this.data.datasets,(e,t)=>{this.getDatasetMeta(t).controller.reset()},this)}reset(){this._resetElements(),this.notifyPlugins(`reset`)}update(e){let t=this.config;t.update();let n=this._options=t.createResolver(t.chartOptionScopes(),this.getContext()),r=this._animationsDisabled=!n.animation;if(this._updateScales(),this._checkEventBindings(),this._updateHiddenIndices(),this._plugins.invalidate(),this.notifyPlugins(`beforeUpdate`,{mode:e,cancelable:!0})===!1)return;let i=this.buildOrUpdateControllers();this.notifyPlugins(`beforeElementsUpdate`);let a=0;for(let e=0,t=this.data.datasets.length;e<t;e++){let{controller:t}=this.getDatasetMeta(e),n=!r&&i.indexOf(t)===-1;t.buildOrUpdateElements(n),a=Math.max(+t.getMaxOverflow(),a)}a=this._minPadding=n.layout.autoPadding?a:0,this._updateLayout(a),r||H(i,e=>{e.reset()}),this._updateDatasets(e),this.notifyPlugins(`afterUpdate`,{mode:e}),this._layers.sort(wh(`z`,`_idx`));let{_active:o,_lastEvent:s}=this;s?this._eventHandler(s,!0):o.length&&this._updateHoverStyles(o,o,!0),this.render()}_updateScales(){H(this.scales,e=>{$p.removeBox(this,e)}),this.ensureScalesHaveIDs(),this.buildOrUpdateScales()}_checkEventBindings(){let e=this.options;(!kl(new Set(Object.keys(this._listeners)),new Set(e.events))||!!this._responsiveListeners!==e.responsive)&&(this.unbindEvents(),this.bindEvents())}_updateHiddenIndices(){let{_hiddenIndices:e}=this,t=this._getUniformDataChanges()||[];for(let{method:n,start:r,count:i}of t)Ah(e,r,n===`_removeElements`?-i:i)}_getUniformDataChanges(){let e=this._dataChanges;if(!e||!e.length)return;this._dataChanges=[];let t=this.data.datasets.length,n=t=>new Set(e.filter(e=>e[0]===t).map((e,t)=>t+`,`+e.splice(1).join(`,`))),r=n(0);for(let e=1;e<t;e++)if(!kl(r,n(e)))return;return Array.from(r).map(e=>e.split(`,`)).map(e=>({method:e[1],start:+e[2],count:+e[3]}))}_updateLayout(e){if(this.notifyPlugins(`beforeLayout`,{cancelable:!0})===!1)return;$p.update(this,this.width,this.height,e);let t=this.chartArea,n=t.width<=0||t.height<=0;this._layers=[],H(this.boxes,e=>{n&&e.position===`chartArea`||(e.configure&&e.configure(),this._layers.push(...e._layers()))},this),this._layers.forEach((e,t)=>{e._idx=t}),this.notifyPlugins(`afterLayout`)}_updateDatasets(e){if(this.notifyPlugins(`beforeDatasetsUpdate`,{mode:e,cancelable:!0})!==!1){for(let e=0,t=this.data.datasets.length;e<t;++e)this.getDatasetMeta(e).controller.configure();for(let t=0,n=this.data.datasets.length;t<n;++t)this._updateDataset(t,Ol(e)?e({datasetIndex:t}):e);this.notifyPlugins(`afterDatasetsUpdate`,{mode:e})}}_updateDataset(e,t){let n=this.getDatasetMeta(e),r={meta:n,index:e,mode:t,cancelable:!0};this.notifyPlugins(`beforeDatasetUpdate`,r)!==!1&&(n.controller._update(t),r.cancelable=!1,this.notifyPlugins(`afterDatasetUpdate`,r))}render(){this.notifyPlugins(`beforeRender`,{cancelable:!0})!==!1&&(Of.has(this)?this.attached&&!Of.running(this)&&Of.start(this):(this.draw(),Th({chart:this})))}draw(){let e;if(this._resizeBeforeDraw){let{width:e,height:t}=this._resizeBeforeDraw;this._resizeBeforeDraw=null,this._resize(e,t)}if(this.clear(),this.width<=0||this.height<=0||this.notifyPlugins(`beforeDraw`,{cancelable:!0})===!1)return;let t=this._layers;for(e=0;e<t.length&&t[e].z<=0;++e)t[e].draw(this.chartArea);for(this._drawDatasets();e<t.length;++e)t[e].draw(this.chartArea);this.notifyPlugins(`afterDraw`)}_getSortedDatasetMetas(e){let t=this._sortedMetasets,n=[],r,i;for(r=0,i=t.length;r<i;++r){let i=t[r];(!e||i.visible)&&n.push(i)}return n}getSortedVisibleDatasetMetas(){return this._getSortedDatasetMetas(!0)}_drawDatasets(){if(this.notifyPlugins(`beforeDatasetsDraw`,{cancelable:!0})===!1)return;let e=this.getSortedVisibleDatasetMetas();for(let t=e.length-1;t>=0;--t)this._drawDataset(e[t]);this.notifyPlugins(`afterDatasetsDraw`)}_drawDataset(e){let t=this.ctx,n={meta:e,index:e.index,cancelable:!0},r=Df(this,e);this.notifyPlugins(`beforeDatasetDraw`,n)!==!1&&(r&&qu(t,r),e.controller.draw(),r&&Ju(t),n.cancelable=!1,this.notifyPlugins(`afterDatasetDraw`,n))}isPointInArea(e){return Ku(e,this.chartArea,this._minPadding)}getElementsAtEventForMode(e,t,n,r){let i=Ip.modes[t];return typeof i==`function`?i(this,e,n,r):[]}getDatasetMeta(e){let t=this.data.datasets[e],n=this._metasets,r=n.filter(e=>e&&e._dataset===t).pop();return r||(r={type:null,data:[],dataset:null,controller:null,hidden:null,xAxisID:null,yAxisID:null,order:t&&t.order||0,index:e,_dataset:t,_parsed:[],_sorted:!1},n.push(r)),r}getContext(){return this.$context||=dd(null,{chart:this,type:`chart`})}getVisibleDatasetCount(){return this.getSortedVisibleDatasetMetas().length}isDatasetVisible(e){let t=this.data.datasets[e];if(!t)return!1;let n=this.getDatasetMeta(e);return typeof n.hidden==`boolean`?!n.hidden:!t.hidden}setDatasetVisibility(e,t){let n=this.getDatasetMeta(e);n.hidden=!t}toggleDataVisibility(e){this._hiddenIndices[e]=!this._hiddenIndices[e]}getDataVisibility(e){return!this._hiddenIndices[e]}_updateVisibility(e,t,n){let r=n?`show`:`hide`,i=this.getDatasetMeta(e),a=i.controller._resolveAnimations(void 0,r);Dl(t)?(i.data[t].hidden=!n,this.update()):(this.setDatasetVisibility(e,n),a.update(i,{visible:n}),this.update(t=>t.datasetIndex===e?r:void 0))}hide(e,t){this._updateVisibility(e,t,!1)}show(e,t){this._updateVisibility(e,t,!0)}_destroyDatasetMeta(e){let t=this._metasets[e];t&&t.controller&&t.controller._destroy(),delete this._metasets[e]}_stop(){let e,t;for(this.stop(),Of.remove(this),e=0,t=this.data.datasets.length;e<t;++e)this._destroyDatasetMeta(e)}destroy(){this.notifyPlugins(`beforeDestroy`);let{canvas:e,ctx:t}=this;this._stop(),this.config.clearCache(),e&&(this.unbindEvents(),Uu(e,t),this.platform.releaseContext(t),this.canvas=null,this.ctx=null),delete Oh[this.id],this.notifyPlugins(`afterDestroy`)}toBase64Image(...e){return this.canvas.toDataURL(...e)}bindEvents(){this.bindUserEvents(),this.options.responsive?this.bindResponsiveEvents():this.attached=!0}bindUserEvents(){let e=this._listeners,t=this.platform,n=(n,r)=>{t.addEventListener(this,n,r),e[n]=r},r=(e,t,n)=>{e.offsetX=t,e.offsetY=n,this._eventHandler(e)};H(this.options.events,e=>n(e,r))}bindResponsiveEvents(){this._responsiveListeners||={};let e=this._responsiveListeners,t=this.platform,n=(n,r)=>{t.addEventListener(this,n,r),e[n]=r},r=(n,r)=>{e[n]&&(t.removeEventListener(this,n,r),delete e[n])},i=(e,t)=>{this.canvas&&this.resize(e,t)},a,o=()=>{r(`attach`,o),this.attached=!0,this.resize(),n(`resize`,i),n(`detach`,a)};a=()=>{this.attached=!1,r(`resize`,i),this._stop(),this._resize(0,0),n(`attach`,o)},t.isAttached(this.canvas)?o():a()}unbindEvents(){H(this._listeners,(e,t)=>{this.platform.removeEventListener(this,t,e)}),this._listeners={},H(this._responsiveListeners,(e,t)=>{this.platform.removeEventListener(this,t,e)}),this._responsiveListeners=void 0}updateHoverStyle(e,t,n){let r=n?`set`:`remove`,i,a,o,s;for(t===`dataset`&&(i=this.getDatasetMeta(e[0].datasetIndex),i.controller[`_`+r+`DatasetHoverStyle`]()),o=0,s=e.length;o<s;++o){a=e[o];let t=a&&this.getDatasetMeta(a.datasetIndex).controller;t&&t[r+`HoverStyle`](a.element,a.datasetIndex,a.index)}}getActiveElements(){return this._active||[]}setActiveElements(e){let t=this._active||[],n=e.map(({datasetIndex:e,index:t})=>{let n=this.getDatasetMeta(e);if(!n)throw Error(`No dataset found at index `+e);return{datasetIndex:e,element:n.data[t],index:t}});!hl(n,t)&&(this._active=n,this._lastEvent=null,this._updateHoverStyles(n,t))}notifyPlugins(e,t,n){return this._plugins.notify(this,e,t,n)}isPluginEnabled(e){return this._plugins._cache.filter(t=>t.plugin.id===e).length===1}_updateHoverStyles(e,t,n){let r=this.options.hover,i=(e,t)=>e.filter(e=>!t.some(t=>e.datasetIndex===t.datasetIndex&&e.index===t.index)),a=i(t,e),o=n?e:i(e,t);a.length&&this.updateHoverStyle(a,r.mode,!1),o.length&&r.mode&&this.updateHoverStyle(o,r.mode,!0)}_eventHandler(e,t){let n={event:e,replay:t,cancelable:!0,inChartArea:this.isPointInArea(e)},r=t=>(t.options.events||this.options.events).includes(e.native.type);if(this.notifyPlugins(`beforeEvent`,n,r)===!1)return;let i=this._handleEvent(e,t,n.inChartArea);return n.cancelable=!1,this.notifyPlugins(`afterEvent`,n,r),(i||n.changed)&&this.render(),this}_handleEvent(e,t,n){let{_active:r=[],options:i}=this,a=t,o=this._getActiveElements(e,r,n,a),s=Al(e),c=jh(e,this._lastEvent,n,s);n&&(this._lastEvent=null,V(i.onHover,[e,o,this],this),s&&V(i.onClick,[e,o,this],this));let l=!hl(o,r);return(l||t)&&(this._active=o,this._updateHoverStyles(o,r,t)),this._lastEvent=c,l}_getActiveElements(e,t,n,r){if(e.type===`mouseout`)return[];if(!n)return t;let i=this.options.hover;return this.getElementsAtEventForMode(e,i.mode,i,r)}},N(Mh,`defaults`,q),N(Mh,`instances`,Oh),N(Mh,`overrides`,Fu),N(Mh,`registry`,Ym),N(Mh,`version`,xh),N(Mh,`getChart`,kh),Mh);function Ph(){return H(Nh.instances,e=>e._plugins.invalidate())}function Fh(e,t,n){let{startAngle:r,x:i,y:a,outerRadius:o,innerRadius:s,options:c}=t,{borderWidth:l,borderJoinStyle:u}=c,d=Math.min(l/o,Zl(r-n));if(e.beginPath(),e.arc(i,a,o-l/2,r+d/2,n-d/2),s>0){let t=Math.min(l/s,Zl(r-n));e.arc(i,a,s+l/2,n-t/2,r+t/2,!0)}else{let t=Math.min(l/2,o*Zl(r-n));if(u===`round`)e.arc(i,a,t,n-U/2,r+U/2,!0);else if(u===`bevel`){let o=2*t*t,s=-o*Math.cos(n+U/2)+i,c=-o*Math.sin(n+U/2)+a,l=o*Math.cos(r+U/2)+i,u=o*Math.sin(r+U/2)+a;e.lineTo(s,c),e.lineTo(l,u)}}e.closePath(),e.moveTo(0,0),e.rect(0,0,e.canvas.width,e.canvas.height),e.clip(`evenodd`)}function Ih(e,t,n){let{startAngle:r,pixelMargin:i,x:a,y:o,outerRadius:s,innerRadius:c}=t,l=i/s;e.beginPath(),e.arc(a,o,s,r-l,n+l),c>i?(l=i/c,e.arc(a,o,c,n+l,r-l,!0)):e.arc(a,o,i,n+G,r-G),e.closePath(),e.clip()}function Lh(e){return od(e,[`outerStart`,`outerEnd`,`innerStart`,`innerEnd`])}function Rh(e,t,n,r){let i=Lh(e.options.borderRadius),a=(n-t)/2,o=Math.min(a,r*t/2),s=e=>{let t=(n-Math.min(a,e))*r/2;return K(e,0,Math.min(a,t))};return{outerStart:s(i.outerStart),outerEnd:s(i.outerEnd),innerStart:K(i.innerStart,0,o),innerEnd:K(i.innerEnd,0,o)}}function zh(e,t,n,r){return{x:n+e*Math.cos(t),y:r+e*Math.sin(t)}}function Bh(e,t,n,r,i,a){let{x:o,y:s,startAngle:c,pixelMargin:l,innerRadius:u}=t,d=Math.max(t.outerRadius+r+n-l,0),f=u>0?u+r+n+l:0,p=0,m=i-c;if(r){let e=((u>0?u-r:0)+(d>0?d-r:0))/2;p=(m-(e===0?m:m*e/(e+r)))/2}let h=(m-Math.max(.001,m*d-n/U)/d)/2,g=c+h+p,_=i-h-p,{outerStart:v,outerEnd:y,innerStart:b,innerEnd:x}=Rh(t,f,d,_-g),S=d-v,C=d-y,w=g+v/S,T=_-y/C,E=f+b,ee=f+x,te=g+b/E,D=_-x/ee;if(e.beginPath(),a){let t=(w+T)/2;if(e.arc(o,s,d,w,t),e.arc(o,s,d,t,T),y>0){let t=zh(C,T,o,s);e.arc(t.x,t.y,y,T,_+G)}let n=zh(ee,_,o,s);if(e.lineTo(n.x,n.y),x>0){let t=zh(ee,D,o,s);e.arc(t.x,t.y,x,_+G,D+Math.PI)}let r=(_-x/f+(g+b/f))/2;if(e.arc(o,s,f,_-x/f,r,!0),e.arc(o,s,f,r,g+b/f,!0),b>0){let t=zh(E,te,o,s);e.arc(t.x,t.y,b,te+Math.PI,g-G)}let i=zh(S,g,o,s);if(e.lineTo(i.x,i.y),v>0){let t=zh(S,w,o,s);e.arc(t.x,t.y,v,g-G,w)}}else{e.moveTo(o,s);let t=Math.cos(w)*d+o,n=Math.sin(w)*d+s;e.lineTo(t,n);let r=Math.cos(T)*d+o,i=Math.sin(T)*d+s;e.lineTo(r,i)}e.closePath()}function Vh(e,t,n,r,i){let{fullCircles:a,startAngle:o,circumference:s}=t,c=t.endAngle;if(a){Bh(e,t,n,r,c,i);for(let t=0;t<a;++t)e.fill();isNaN(s)||(c=o+(s%W||W))}return Bh(e,t,n,r,c,i),e.fill(),c}function Hh(e,t,n,r,i){let{fullCircles:a,startAngle:o,circumference:s,options:c}=t,{borderWidth:l,borderJoinStyle:u,borderDash:d,borderDashOffset:f,borderRadius:p}=c,m=c.borderAlign===`inner`;if(!l)return;e.setLineDash(d||[]),e.lineDashOffset=f,m?(e.lineWidth=l*2,e.lineJoin=u||`round`):(e.lineWidth=l,e.lineJoin=u||`bevel`);let h=t.endAngle;if(a){Bh(e,t,n,r,h,i);for(let t=0;t<a;++t)e.stroke();isNaN(s)||(h=o+(s%W||W))}m&&Ih(e,t,h),c.selfJoin&&h-o>=U&&p===0&&u!==`miter`&&Fh(e,t,h),a||(Bh(e,t,n,r,h,i),e.stroke())}var Uh=class extends wm{constructor(e){super(),N(this,`circumference`),N(this,`endAngle`),N(this,`fullCircles`),N(this,`innerRadius`),N(this,`outerRadius`),N(this,`pixelMargin`),N(this,`startAngle`),this.options=void 0,this.circumference=void 0,this.startAngle=void 0,this.endAngle=void 0,this.innerRadius=void 0,this.outerRadius=void 0,this.pixelMargin=0,this.fullCircles=0,e&&Object.assign(this,e)}inRange(e,t,n){let{angle:r,distance:i}=Jl(this.getProps([`x`,`y`],n),{x:e,y:t}),{startAngle:a,endAngle:o,innerRadius:s,outerRadius:c,circumference:l}=this.getProps([`startAngle`,`endAngle`,`innerRadius`,`outerRadius`,`circumference`],n),u=(this.options.spacing+this.options.borderWidth)/2,d=B(l,o-a),f=Ql(r,a,o)&&a!==o,p=d>=W||f,m=eu(i,s+u,c+u);return p&&m}getCenterPoint(e){let{x:t,y:n,startAngle:r,endAngle:i,innerRadius:a,outerRadius:o}=this.getProps([`x`,`y`,`startAngle`,`endAngle`,`innerRadius`,`outerRadius`],e),{offset:s,spacing:c}=this.options,l=(r+i)/2,u=(a+o+c+s)/2;return{x:t+Math.cos(l)*u,y:n+Math.sin(l)*u}}tooltipPosition(e){return this.getCenterPoint(e)}draw(e){let{options:t,circumference:n}=this,r=(t.offset||0)/4,i=(t.spacing||0)/2,a=t.circular;if(this.pixelMargin=t.borderAlign===`inner`?.33:0,this.fullCircles=n>W?Math.floor(n/W):0,n===0||this.innerRadius<0||this.outerRadius<0)return;e.save();let o=(this.startAngle+this.endAngle)/2;e.translate(Math.cos(o)*r,Math.sin(o)*r);let s=r*(1-Math.sin(Math.min(U,n||0)));e.fillStyle=t.backgroundColor,e.strokeStyle=t.borderColor,Vh(e,this,s,i,a),Hh(e,this,s,i,a),e.restore()}};N(Uh,`id`,`arc`),N(Uh,`defaults`,{borderAlign:`center`,borderColor:`#fff`,borderDash:[],borderDashOffset:0,borderJoinStyle:void 0,borderRadius:0,borderWidth:2,offset:0,spacing:0,angle:void 0,circular:!0,selfJoin:!1}),N(Uh,`defaultRoutes`,{backgroundColor:`backgroundColor`}),N(Uh,`descriptors`,{_scriptable:!0,_indexable:e=>e!==`borderDash`});function Wh(e,t,n=t){e.lineCap=B(n.borderCapStyle,t.borderCapStyle),e.setLineDash(B(n.borderDash,t.borderDash)),e.lineDashOffset=B(n.borderDashOffset,t.borderDashOffset),e.lineJoin=B(n.borderJoinStyle,t.borderJoinStyle),e.lineWidth=B(n.borderWidth,t.borderWidth),e.strokeStyle=B(n.borderColor,t.borderColor)}function Gh(e,t,n){e.lineTo(n.x,n.y)}function Kh(e){return e.stepped?Yu:e.tension||e.cubicInterpolationMode===`monotone`?Xu:Gh}function qh(e,t,n={}){let r=e.length,{start:i=0,end:a=r-1}=n,{start:o,end:s}=t,c=Math.max(i,o),l=Math.min(a,s),u=i<o&&a<o||i>s&&a>s;return{count:r,start:c,loop:t.loop,ilen:l<c&&!u?r+l-c:l-c}}function Jh(e,t,n,r){let{points:i,options:a}=t,{count:o,start:s,loop:c,ilen:l}=qh(i,n,r),u=Kh(a),{move:d=!0,reverse:f}=r||{},p,m,h;for(p=0;p<=l;++p)m=i[(s+(f?l-p:p))%o],!m.skip&&(d?(e.moveTo(m.x,m.y),d=!1):u(e,h,m,f,a.stepped),h=m);return c&&(m=i[(s+(f?l:0))%o],u(e,h,m,f,a.stepped)),!!c}function Yh(e,t,n,r){let i=t.points,{count:a,start:o,ilen:s}=qh(i,n,r),{move:c=!0,reverse:l}=r||{},u=0,d=0,f,p,m,h,g,_,v=e=>(o+(l?s-e:e))%a,y=()=>{h!==g&&(e.lineTo(u,g),e.lineTo(u,h),e.lineTo(u,_))};for(c&&(p=i[v(0)],e.moveTo(p.x,p.y)),f=0;f<=s;++f){if(p=i[v(f)],p.skip)continue;let t=p.x,n=p.y,r=t|0;r===m?(n<h?h=n:n>g&&(g=n),u=(d*u+t)/++d):(y(),e.lineTo(t,n),m=r,d=0,h=g=n),_=n}y()}function Xh(e){let t=e.options,n=t.borderDash&&t.borderDash.length;return!e._decimated&&!e._loop&&!t.tension&&t.cubicInterpolationMode!==`monotone`&&!t.stepped&&!n?Yh:Jh}function Zh(e){return e.stepped?of:e.tension||e.cubicInterpolationMode===`monotone`?sf:af}function Qh(e,t,n,r){let i=t._path;i||(i=t._path=new Path2D,t.path(i,n,r)&&i.closePath()),Wh(e,t.options),e.stroke(i)}function $h(e,t,n,r){let{segments:i,options:a}=t,o=Xh(t);for(let s of i)Wh(e,a,s.style),e.beginPath(),o(e,t,s,{start:n,end:n+r-1})&&e.closePath(),e.stroke()}var eg=typeof Path2D==`function`;function tg(e,t,n,r){eg&&!t.options.segment?Qh(e,t,n,r):$h(e,t,n,r)}var ng=class extends wm{constructor(e){super(),this.animated=!0,this.options=void 0,this._chart=void 0,this._loop=void 0,this._fullLoop=void 0,this._path=void 0,this._points=void 0,this._segments=void 0,this._decimated=!1,this._pointsUpdated=!1,this._datasetIndex=void 0,e&&Object.assign(this,e)}updateControlPoints(e,t){let n=this.options;if((n.tension||n.cubicInterpolationMode===`monotone`)&&!n.stepped&&!this._pointsUpdated){let r=n.spanGaps?this._loop:this._fullLoop;Vd(this._points,n,e,r,t),this._pointsUpdated=!0}}set points(e){this._points=e,delete this._segments,delete this._path,this._pointsUpdated=!1}get points(){return this._points}get segments(){return this._segments||=bf(this,this.options.segment)}first(){let e=this.segments,t=this.points;return e.length&&t[e[0].start]}last(){let e=this.segments,t=this.points,n=e.length;return n&&t[e[n-1].end]}interpolate(e,t){let n=this.options,r=e[t],i=this.points,a=_f(this,{property:t,start:r,end:r});if(!a.length)return;let o=[],s=Zh(n),c,l;for(c=0,l=a.length;c<l;++c){let{start:l,end:u}=a[c],d=i[l],f=i[u];if(d===f){o.push(d);continue}let p=s(d,f,Math.abs((r-d[t])/(f[t]-d[t])),n.stepped);p[t]=e[t],o.push(p)}return o.length===1?o[0]:o}pathSegment(e,t,n){return Xh(this)(e,this,t,n)}path(e,t,n){let r=this.segments,i=Xh(this),a=this._loop;t||=0,n||=this.points.length-t;for(let o of r)a&=i(e,this,o,{start:t,end:t+n-1});return!!a}draw(e,t,n,r){let i=this.options||{};(this.points||[]).length&&i.borderWidth&&(e.save(),tg(e,this,n,r),e.restore()),this.animated&&(this._pointsUpdated=!1,this._path=void 0)}};N(ng,`id`,`line`),N(ng,`defaults`,{borderCapStyle:`butt`,borderDash:[],borderDashOffset:0,borderJoinStyle:`miter`,borderWidth:3,capBezierPoints:!0,cubicInterpolationMode:`default`,fill:!1,spanGaps:!1,stepped:!1,tension:0}),N(ng,`defaultRoutes`,{backgroundColor:`backgroundColor`,borderColor:`borderColor`}),N(ng,`descriptors`,{_scriptable:!0,_indexable:e=>e!==`borderDash`&&e!==`fill`});function rg(e,t,n,r){let i=e.options,{[n]:a}=e.getProps([n],r);return Math.abs(t-a)<i.radius+i.hitRadius}var ig=class extends wm{constructor(e){super(),N(this,`parsed`),N(this,`skip`),N(this,`stop`),this.options=void 0,this.parsed=void 0,this.skip=void 0,this.stop=void 0,e&&Object.assign(this,e)}inRange(e,t,n){let r=this.options,{x:i,y:a}=this.getProps([`x`,`y`],n);return(e-i)**2+(t-a)**2<(r.hitRadius+r.radius)**2}inXRange(e,t){return rg(this,e,`x`,t)}inYRange(e,t){return rg(this,e,`y`,t)}getCenterPoint(e){let{x:t,y:n}=this.getProps([`x`,`y`],e);return{x:t,y:n}}size(e){e=e||this.options||{};let t=e.radius||0;t=Math.max(t,t&&e.hoverRadius||0);let n=t&&e.borderWidth||0;return(t+n)*2}draw(e,t){let n=this.options;this.skip||n.radius<.1||!Ku(this,t,this.size(n)/2)||(e.strokeStyle=n.borderColor,e.lineWidth=n.borderWidth,e.fillStyle=n.backgroundColor,Wu(e,n,this.x,this.y))}getRange(){let e=this.options||{};return e.radius+e.hitRadius}};N(ig,`id`,`point`),N(ig,`defaults`,{borderWidth:1,hitRadius:1,hoverBorderWidth:1,hoverRadius:4,pointStyle:`circle`,radius:3,rotation:0}),N(ig,`defaultRoutes`,{backgroundColor:`backgroundColor`,borderColor:`borderColor`});function ag(e,t){let{x:n,y:r,base:i,width:a,height:o}=e.getProps([`x`,`y`,`base`,`width`,`height`],t),s,c,l,u,d;return e.horizontal?(d=o/2,s=Math.min(n,i),c=Math.max(n,i),l=r-d,u=r+d):(d=a/2,s=n-d,c=n+d,l=Math.min(r,i),u=Math.max(r,i)),{left:s,top:l,right:c,bottom:u}}function og(e,t,n,r){return e?0:K(t,n,r)}function sg(e,t,n){let r=e.options.borderWidth,i=e.borderSkipped,a=sd(r);return{t:og(i.top,a.top,0,n),r:og(i.right,a.right,0,t),b:og(i.bottom,a.bottom,0,n),l:og(i.left,a.left,0,t)}}function cg(e,t,n){let{enableBorderRadius:r}=e.getProps([`enableBorderRadius`]),i=e.options.borderRadius,a=cd(i),o=Math.min(t,n),s=e.borderSkipped,c=r||R(i);return{topLeft:og(!c||s.top||s.left,a.topLeft,0,o),topRight:og(!c||s.top||s.right,a.topRight,0,o),bottomLeft:og(!c||s.bottom||s.left,a.bottomLeft,0,o),bottomRight:og(!c||s.bottom||s.right,a.bottomRight,0,o)}}function lg(e){let t=ag(e),n=t.right-t.left,r=t.bottom-t.top,i=sg(e,n/2,r/2),a=cg(e,n/2,r/2);return{outer:{x:t.left,y:t.top,w:n,h:r,radius:a},inner:{x:t.left+i.l,y:t.top+i.t,w:n-i.l-i.r,h:r-i.t-i.b,radius:{topLeft:Math.max(0,a.topLeft-Math.max(i.t,i.l)),topRight:Math.max(0,a.topRight-Math.max(i.t,i.r)),bottomLeft:Math.max(0,a.bottomLeft-Math.max(i.b,i.l)),bottomRight:Math.max(0,a.bottomRight-Math.max(i.b,i.r))}}}}function ug(e,t,n,r){let i=t===null,a=n===null,o=e&&!(i&&a)&&ag(e,r);return o&&(i||eu(t,o.left,o.right))&&(a||eu(n,o.top,o.bottom))}function dg(e){return e.topLeft||e.topRight||e.bottomLeft||e.bottomRight}function fg(e,t){e.rect(t.x,t.y,t.w,t.h)}function pg(e,t,n={}){let r=e.x===n.x?0:-t,i=e.y===n.y?0:-t,a=(e.x+e.w===n.x+n.w?0:t)-r,o=(e.y+e.h===n.y+n.h?0:t)-i;return{x:e.x+r,y:e.y+i,w:e.w+a,h:e.h+o,radius:e.radius}}var mg=class extends wm{constructor(e){super(),this.options=void 0,this.horizontal=void 0,this.base=void 0,this.width=void 0,this.height=void 0,this.inflateAmount=void 0,e&&Object.assign(this,e)}draw(e){let{inflateAmount:t,options:{borderColor:n,backgroundColor:r}}=this,{inner:i,outer:a}=lg(this),o=dg(a.radius)?td:fg;e.save(),(a.w!==i.w||a.h!==i.h)&&(e.beginPath(),o(e,pg(a,t,i)),e.clip(),o(e,pg(i,-t,a)),e.fillStyle=n,e.fill(`evenodd`)),e.beginPath(),o(e,pg(i,t)),e.fillStyle=r,e.fill(),e.restore()}inRange(e,t,n){return ug(this,e,t,n)}inXRange(e,t){return ug(this,e,null,t)}inYRange(e,t){return ug(this,null,e,t)}getCenterPoint(e){let{x:t,y:n,base:r,horizontal:i}=this.getProps([`x`,`y`,`base`,`horizontal`],e);return{x:i?(t+r)/2:t,y:i?n:(n+r)/2}}getRange(e){return e===`x`?this.width/2:this.height/2}};N(mg,`id`,`bar`),N(mg,`defaults`,{borderSkipped:`start`,borderWidth:0,borderRadius:0,inflateAmount:`auto`,pointStyle:void 0}),N(mg,`defaultRoutes`,{backgroundColor:`backgroundColor`,borderColor:`borderColor`});var hg=Object.freeze({__proto__:null,ArcElement:Uh,BarElement:mg,LineElement:ng,PointElement:ig}),gg=[`rgb(54, 162, 235)`,`rgb(255, 99, 132)`,`rgb(255, 159, 64)`,`rgb(255, 205, 86)`,`rgb(75, 192, 192)`,`rgb(153, 102, 255)`,`rgb(201, 203, 207)`],_g=gg.map(e=>e.replace(`rgb(`,`rgba(`).replace(`)`,`, 0.5)`));function vg(e){return gg[e%gg.length]}function yg(e){return _g[e%_g.length]}function bg(e,t){return e.borderColor=vg(t),e.backgroundColor=yg(t),++t}function xg(e,t){return e.backgroundColor=e.data.map(()=>vg(t++)),t}function Sg(e,t){return e.backgroundColor=e.data.map(()=>yg(t++)),t}function Cg(e){let t=0;return(n,r)=>{let i=e.getDatasetMeta(r).controller;i instanceof yp?t=xg(n,t):i instanceof xp?t=Sg(n,t):i&&(t=bg(n,t))}}function wg(e){let t;for(t in e)if(e[t].borderColor||e[t].backgroundColor)return!0;return!1}function Tg(e){return e&&(e.borderColor||e.backgroundColor)}function Eg(){return q.borderColor!==`rgba(0,0,0,0.1)`||q.backgroundColor!==`rgba(0,0,0,0.1)`}var Dg={id:`colors`,defaults:{enabled:!0,forceOverride:!1},beforeLayout(e,t,n){if(!n.enabled)return;let{data:{datasets:r},options:i}=e.config,{elements:a}=i,o=wg(r)||Tg(i)||a&&wg(a)||Eg();if(!n.forceOverride&&o)return;let s=Cg(e);r.forEach(s)}};function Og(e,t,n,r,i){let a=i.samples||r;if(a>=n)return e.slice(t,t+n);let o=[],s=(n-2)/(a-2),c=0,l=t+n-1,u=t,d,f,p,m,h;for(o[c++]=e[u],d=0;d<a-2;d++){let r=0,i=0,a,l=Math.floor((d+1)*s)+1+t,g=Math.min(Math.floor((d+2)*s)+1,n)+t,_=g-l;for(a=l;a<g;a++)r+=e[a].x,i+=e[a].y;r/=_,i/=_;let v=Math.floor(d*s)+1+t,y=Math.min(Math.floor((d+1)*s)+1,n)+t,{x:b,y:x}=e[u];for(p=m=-1,a=v;a<y;a++)m=.5*Math.abs((b-r)*(e[a].y-x)-(b-e[a].x)*(i-x)),m>p&&(p=m,f=e[a],h=a);o[c++]=f,u=h}return o[c++]=e[l],o}function kg(e,t,n,r){let i=0,a=0,o,s,c,l,u,d,f,p,m,h,g=[],_=t+n-1,v=e[t].x,y=e[_].x-v;for(o=t;o<t+n;++o){s=e[o],c=(s.x-v)/y*r,l=s.y;let t=c|0;if(t===u)l<m?(m=l,d=o):l>h&&(h=l,f=o),i=(a*i+s.x)/++a;else{let n=o-1;if(!I(d)&&!I(f)){let t=Math.min(d,f),r=Math.max(d,f);t!==p&&t!==n&&g.push({...e[t],x:i}),r!==p&&r!==n&&g.push({...e[r],x:i})}o>0&&n!==p&&g.push(e[n]),g.push(s),u=t,a=0,m=h=l,d=f=p=o}}return g}function Ag(e){if(e._decimated){let t=e._data;delete e._decimated,delete e._data,Object.defineProperty(e,"data",{configurable:!0,enumerable:!0,writable:!0,value:t})}}function jg(e){e.data.datasets.forEach(e=>{Ag(e)})}function Mg(e,t){let n=t.length,r=0,i,{iScale:a}=e,{min:o,max:s,minDefined:c,maxDefined:l}=a.getUserBounds();return c&&(r=K(nu(t,a.axis,o).lo,0,n-1)),i=l?K(nu(t,a.axis,s).hi+1,r,n)-r:n-r,{start:r,count:i}}var Ng={id:`decimation`,defaults:{algorithm:`min-max`,enabled:!1},beforeElementsUpdate:(e,t,n)=>{if(!n.enabled){jg(e);return}let r=e.width;e.data.datasets.forEach((t,i)=>{let{_data:a,indexAxis:o}=t,s=e.getDatasetMeta(i),c=a||t.data;if(Y([o,e.options.indexAxis])===`y`||!s.controller.supportsDecimation)return;let l=e.scales[s.xAxisID];if(l.type!==`linear`&&l.type!==`time`||e.options.parsing)return;let{start:u,count:d}=Mg(s,c);if(d<=(n.threshold||4*r)){Ag(t);return}I(a)&&(t._data=c,delete t.data,Object.defineProperty(t,"data",{configurable:!0,enumerable:!0,get:function(){return this._decimated},set:function(e){this._data=e}}));let f;switch(n.algorithm){case`lttb`:f=Og(c,u,d,r,n);break;case`min-max`:f=kg(c,u,d,r);break;default:throw Error(`Unsupported decimation algorithm '${n.algorithm}'`)}t._decimated=f})},destroy(e){jg(e)}};function Pg(e,t,n){let r=e.segments,i=e.points,a=t.points,o=[];for(let e of r){let{start:r,end:s}=e;s=Lg(r,s,i);let c=Fg(n,i[r],i[s],e.loop);if(!t.segments){o.push({source:e,target:c,start:i[r],end:i[s]});continue}let l=_f(t,c);for(let t of l){let r=Fg(n,a[t.start],a[t.end],t.loop),s=gf(e,i,r);for(let e of s)o.push({source:e,target:t,start:{[n]:Rg(c,r,`start`,Math.max)},end:{[n]:Rg(c,r,`end`,Math.min)}})}}return o}function Fg(e,t,n,r){if(r)return;let i=t[e],a=n[e];return e===`angle`&&(i=Zl(i),a=Zl(a)),{property:e,start:i,end:a}}function Ig(e,t){let{x:n=null,y:r=null}=e||{},i=t.points,a=[];return t.segments.forEach(({start:e,end:t})=>{t=Lg(e,t,i);let o=i[e],s=i[t];r===null?n!==null&&(a.push({x:n,y:o.y}),a.push({x:n,y:s.y})):(a.push({x:o.x,y:r}),a.push({x:s.x,y:r}))}),a}function Lg(e,t,n){for(;t>e;t--){let e=n[t];if(!isNaN(e.x)&&!isNaN(e.y))break}return t}function Rg(e,t,n,r){return e&&t?r(e[n],t[n]):e?e[n]:t?t[n]:0}function zg(e,t){let n=[],r=!1;return L(e)?(r=!0,n=e):n=Ig(e,t),n.length?new ng({points:n,options:{tension:0},_loop:r,_fullLoop:r}):null}function Bg(e){return e&&e.fill!==!1}function Vg(e,t,n){let r=e[t].fill,i=[t],a;if(!n)return r;for(;r!==!1&&i.indexOf(r)===-1;){if(!z(r))return r;if(a=e[r],!a)return!1;if(a.visible)return r;i.push(r),r=a.fill}return!1}function Hg(e,t,n){let r=Kg(e);if(R(r))return!isNaN(r.value)&&r;let i=parseFloat(r);return z(i)&&Math.floor(i)===i?Ug(r[0],t,i,n):[`origin`,`start`,`end`,`stack`,`shape`].indexOf(r)>=0&&r}function Ug(e,t,n,r){return(e===`-`||e===`+`)&&(n=t+n),n===t||n<0||n>=r?!1:n}function Wg(e,t){let n=null;return e===`start`?n=t.bottom:e===`end`?n=t.top:R(e)?n=t.getPixelForValue(e.value):t.getBasePixel&&(n=t.getBasePixel()),n}function Gg(e,t,n){let r;return r=e===`start`?n:e===`end`?t.options.reverse?t.min:t.max:R(e)?e.value:t.getBaseValue(),r}function Kg(e){let t=e.options,n=t.fill,r=B(n&&n.target,n);return r===void 0&&(r=!!t.backgroundColor),r===!1||r===null?!1:r===!0?`origin`:r}function qg(e){let{scale:t,index:n,line:r}=e,i=[],a=r.segments,o=r.points,s=Jg(t,n);s.push(zg({x:null,y:t.bottom},r));for(let e=0;e<a.length;e++){let t=a[e];for(let e=t.start;e<=t.end;e++)Yg(i,o[e],s)}return new ng({points:i,options:{}})}function Jg(e,t){let n=[],r=e.getMatchingVisibleMetas(`line`);for(let e=0;e<r.length;e++){let i=r[e];if(i.index===t)break;i.hidden||n.unshift(i.dataset)}return n}function Yg(e,t,n){let r=[];for(let i=0;i<n.length;i++){let a=n[i],{first:o,last:s,point:c}=Xg(a,t,`x`);if(!(!c||o&&s)){if(o)r.unshift(c);else if(e.push(c),!s)break}}e.push(...r)}function Xg(e,t,n){let r=e.interpolate(t,n);if(!r)return{};let i=r[n],a=e.segments,o=e.points,s=!1,c=!1;for(let e=0;e<a.length;e++){let t=a[e],r=o[t.start][n],l=o[t.end][n];if(eu(i,r,l)){s=i===r,c=i===l;break}}return{first:s,last:c,point:r}}var Zg=class{constructor(e){this.x=e.x,this.y=e.y,this.radius=e.radius}pathSegment(e,t,n){let{x:r,y:i,radius:a}=this;return t||={start:0,end:W},e.arc(r,i,a,t.end,t.start,!0),!n.bounds}interpolate(e){let{x:t,y:n,radius:r}=this,i=e.angle;return{x:t+Math.cos(i)*r,y:n+Math.sin(i)*r,angle:i}}};function Qg(e){let{chart:t,fill:n,line:r}=e;if(z(n))return $g(t,n);if(n===`stack`)return qg(e);if(n===`shape`)return!0;let i=e_(e);return i instanceof Zg?i:zg(i,r)}function $g(e,t){let n=e.getDatasetMeta(t);return n&&e.isDatasetVisible(t)?n.dataset:null}function e_(e){return(e.scale||{}).getPointPositionForValue?n_(e):t_(e)}function t_(e){let{scale:t={},fill:n}=e,r=Wg(n,t);if(z(r)){let e=t.isHorizontal();return{x:e?r:null,y:e?null:r}}return null}function n_(e){let{scale:t,fill:n}=e,r=t.options,i=t.getLabels().length,a=r.reverse?t.max:t.min,o=Gg(n,t,a),s=[];if(r.grid.circular){let e=t.getPointPositionForValue(0,a);return new Zg({x:e.x,y:e.y,radius:t.getDistanceFromCenterForValue(o)})}for(let e=0;e<i;++e)s.push(t.getPointPositionForValue(e,o));return s}function r_(e,t,n){let r=Qg(t),{chart:i,index:a,line:o,scale:s,axis:c}=t,l=o.options,u=l.fill,d=l.backgroundColor,{above:f=d,below:p=d}=u||{},m=Df(i,i.getDatasetMeta(a));r&&o.points.length&&(qu(e,n),i_(e,{line:o,target:r,above:f,below:p,area:n,scale:s,axis:c,clip:m}),Ju(e))}function i_(e,t){let{line:n,target:r,above:i,below:a,area:o,scale:s,clip:c}=t,l=n._loop?`angle`:t.axis;e.save();let u=a;a!==i&&(l===`x`?(a_(e,r,o.top),s_(e,{line:n,target:r,color:i,scale:s,property:l,clip:c}),e.restore(),e.save(),a_(e,r,o.bottom)):l===`y`&&(o_(e,r,o.left),s_(e,{line:n,target:r,color:a,scale:s,property:l,clip:c}),e.restore(),e.save(),o_(e,r,o.right),u=i)),s_(e,{line:n,target:r,color:u,scale:s,property:l,clip:c}),e.restore()}function a_(e,t,n){let{segments:r,points:i}=t,a=!0,o=!1;e.beginPath();for(let s of r){let{start:r,end:c}=s,l=i[r],u=i[Lg(r,c,i)];a?(e.moveTo(l.x,l.y),a=!1):(e.lineTo(l.x,n),e.lineTo(l.x,l.y)),o=!!t.pathSegment(e,s,{move:o}),o?e.closePath():e.lineTo(u.x,n)}e.lineTo(t.first().x,n),e.closePath(),e.clip()}function o_(e,t,n){let{segments:r,points:i}=t,a=!0,o=!1;e.beginPath();for(let s of r){let{start:r,end:c}=s,l=i[r],u=i[Lg(r,c,i)];a?(e.moveTo(l.x,l.y),a=!1):(e.lineTo(n,l.y),e.lineTo(l.x,l.y)),o=!!t.pathSegment(e,s,{move:o}),o?e.closePath():e.lineTo(n,u.y)}e.lineTo(n,t.first().y),e.closePath(),e.clip()}function s_(e,t){let{line:n,target:r,property:i,color:a,scale:o,clip:s}=t,c=Pg(n,r,i);for(let{source:t,target:l,start:u,end:d}of c){let{style:{backgroundColor:c=a}={}}=t,f=r!==!0;e.save(),e.fillStyle=c,c_(e,o,s,f&&Fg(i,u,d)),e.beginPath();let p=!!n.pathSegment(e,t),m;if(f){p?e.closePath():l_(e,r,d,i);let t=!!r.pathSegment(e,l,{move:p,reverse:!0});m=p&&t,m||l_(e,r,u,i)}e.closePath(),e.fill(m?`evenodd`:`nonzero`),e.restore()}}function c_(e,t,n,r){let i=t.chart.chartArea,{property:a,start:o,end:s}=r||{};if(a===`x`||a===`y`){let t,r,c,l;a===`x`?(t=o,r=i.top,c=s,l=i.bottom):(t=i.left,r=o,c=i.right,l=s),e.beginPath(),n&&(t=Math.max(t,n.left),c=Math.min(c,n.right),r=Math.max(r,n.top),l=Math.min(l,n.bottom)),e.rect(t,r,c-t,l-r),e.clip()}}function l_(e,t,n,r){let i=t.interpolate(n,r);i&&e.lineTo(i.x,i.y)}var u_={id:`filler`,afterDatasetsUpdate(e,t,n){let r=(e.data.datasets||[]).length,i=[],a,o,s,c;for(o=0;o<r;++o)a=e.getDatasetMeta(o),s=a.dataset,c=null,s&&s.options&&s instanceof ng&&(c={visible:e.isDatasetVisible(o),index:o,fill:Hg(s,o,r),chart:e,axis:a.controller.options.indexAxis,scale:a.vScale,line:s}),a.$filler=c,i.push(c);for(o=0;o<r;++o)c=i[o],!(!c||c.fill===!1)&&(c.fill=Vg(i,o,n.propagate))},beforeDraw(e,t,n){let r=n.drawTime===`beforeDraw`,i=e.getSortedVisibleDatasetMetas(),a=e.chartArea;for(let t=i.length-1;t>=0;--t){let n=i[t].$filler;n&&(n.line.updateControlPoints(a,n.axis),r&&n.fill&&r_(e.ctx,n,a))}},beforeDatasetsDraw(e,t,n){if(n.drawTime!==`beforeDatasetsDraw`)return;let r=e.getSortedVisibleDatasetMetas();for(let t=r.length-1;t>=0;--t){let n=r[t].$filler;Bg(n)&&r_(e.ctx,n,e.chartArea)}},beforeDatasetDraw(e,t,n){let r=t.meta.$filler;!Bg(r)||n.drawTime!==`beforeDatasetDraw`||r_(e.ctx,r,e.chartArea)},defaults:{propagate:!0,drawTime:`beforeDatasetDraw`}},d_=(e,t)=>{let{boxHeight:n=t,boxWidth:r=t}=e;return e.usePointStyle&&(n=Math.min(n,t),r=e.pointStyleWidth||Math.min(r,t)),{boxWidth:r,boxHeight:n,itemHeight:Math.max(t,n)}},f_=(e,t)=>e!==null&&t!==null&&e.datasetIndex===t.datasetIndex&&e.index===t.index,p_=class extends wm{constructor(e){super(),this._added=!1,this.legendHitBoxes=[],this._hoveredItem=null,this.doughnutMode=!1,this.chart=e.chart,this.options=e.options,this.ctx=e.ctx,this.legendItems=void 0,this.columnSizes=void 0,this.lineWidths=void 0,this.maxHeight=void 0,this.maxWidth=void 0,this.top=void 0,this.bottom=void 0,this.left=void 0,this.right=void 0,this.height=void 0,this.width=void 0,this._margins=void 0,this.position=void 0,this.weight=void 0,this.fullSize=void 0}update(e,t,n){this.maxWidth=e,this.maxHeight=t,this._margins=n,this.setDimensions(),this.buildLabels(),this.fit()}setDimensions(){this.isHorizontal()?(this.width=this.maxWidth,this.left=this._margins.left,this.right=this.width):(this.height=this.maxHeight,this.top=this._margins.top,this.bottom=this.height)}buildLabels(){let e=this.options.labels||{},t=V(e.generateLabels,[this.chart],this)||[];e.filter&&(t=t.filter(t=>e.filter(t,this.chart.data))),e.sort&&(t=t.sort((t,n)=>e.sort(t,n,this.chart.data))),this.options.reverse&&t.reverse(),this.legendItems=t}fit(){let{options:e,ctx:t}=this;if(!e.display){this.width=this.height=0;return}let n=e.labels,r=J(n.font),i=r.size,a=this._computeTitleHeight(),{boxWidth:o,itemHeight:s}=d_(n,i),c,l;t.font=r.string,this.isHorizontal()?(c=this.maxWidth,l=this._fitRows(a,i,o,s)+10):(l=this.maxHeight,c=this._fitCols(a,r,o,s)+10),this.width=Math.min(c,e.maxWidth||this.maxWidth),this.height=Math.min(l,e.maxHeight||this.maxHeight)}_fitRows(e,t,n,r){let{ctx:i,maxWidth:a,options:{labels:{padding:o}}}=this,s=this.legendHitBoxes=[],c=this.lineWidths=[0],l=r+o,u=e;i.textAlign=`left`,i.textBaseline=`middle`;let d=-1,f=-l;return this.legendItems.forEach((e,p)=>{let m=n+t/2+i.measureText(e.text).width;(p===0||c[c.length-1]+m+2*o>a)&&(u+=l,c[c.length-(p>0?0:1)]=0,f+=l,d++),s[p]={left:0,top:f,row:d,width:m,height:r},c[c.length-1]+=m+o}),u}_fitCols(e,t,n,r){let{ctx:i,maxHeight:a,options:{labels:{padding:o}}}=this,s=this.legendHitBoxes=[],c=this.columnSizes=[],l=a-e,u=o,d=0,f=0,p=0,m=0;return this.legendItems.forEach((e,a)=>{let{itemWidth:h,itemHeight:g}=m_(n,t,i,e,r);a>0&&f+g+2*o>l&&(u+=d+o,c.push({width:d,height:f}),p+=d+o,m++,d=f=0),s[a]={left:p,top:f,col:m,width:h,height:g},d=Math.max(d,h),f+=g+o}),u+=d,c.push({width:d,height:f}),u}adjustHitBoxes(){if(!this.options.display)return;let e=this._computeTitleHeight(),{legendHitBoxes:t,options:{align:n,labels:{padding:r},rtl:i}}=this,a=uf(i,this.left,this.width);if(this.isHorizontal()){let i=0,o=pu(n,this.left+r,this.right-this.lineWidths[i]);for(let s of t)i!==s.row&&(i=s.row,o=pu(n,this.left+r,this.right-this.lineWidths[i])),s.top+=this.top+e+r,s.left=a.leftForLtr(a.x(o),s.width),o+=s.width+r}else{let i=0,o=pu(n,this.top+e+r,this.bottom-this.columnSizes[i].height);for(let s of t)s.col!==i&&(i=s.col,o=pu(n,this.top+e+r,this.bottom-this.columnSizes[i].height)),s.top=o,s.left+=this.left+r,s.left=a.leftForLtr(a.x(s.left),s.width),o+=s.height+r}}isHorizontal(){return this.options.position===`top`||this.options.position===`bottom`}draw(){if(this.options.display){let e=this.ctx;qu(e,this),this._draw(),Ju(e)}}_draw(){let{options:e,columnSizes:t,lineWidths:n,ctx:r}=this,{align:i,labels:a}=e,o=q.color,s=uf(e.rtl,this.left,this.width),c=J(a.font),{padding:l}=a,u=c.size,d=u/2,f;this.drawTitle(),r.textAlign=s.textAlign(`left`),r.textBaseline=`middle`,r.lineWidth=.5,r.font=c.string;let{boxWidth:p,boxHeight:m,itemHeight:h}=d_(a,u),g=function(e,t,n){if(isNaN(p)||p<=0||isNaN(m)||m<0)return;r.save();let i=B(n.lineWidth,1);if(r.fillStyle=B(n.fillStyle,o),r.lineCap=B(n.lineCap,`butt`),r.lineDashOffset=B(n.lineDashOffset,0),r.lineJoin=B(n.lineJoin,`miter`),r.lineWidth=i,r.strokeStyle=B(n.strokeStyle,o),r.setLineDash(B(n.lineDash,[])),a.usePointStyle){let o={radius:m*Math.SQRT2/2,pointStyle:n.pointStyle,rotation:n.rotation,borderWidth:i},c=s.xPlus(e,p/2),l=t+d;Gu(r,o,c,l,a.pointStyleWidth&&p)}else{let a=t+Math.max((u-m)/2,0),o=s.leftForLtr(e,p),c=cd(n.borderRadius);r.beginPath(),Object.values(c).some(e=>e!==0)?td(r,{x:o,y:a,w:p,h:m,radius:c}):r.rect(o,a,p,m),r.fill(),i!==0&&r.stroke()}r.restore()},_=function(e,t,n){ed(r,n.text,e,t+h/2,c,{strikethrough:n.hidden,textAlign:s.textAlign(n.textAlign)})},v=this.isHorizontal(),y=this._computeTitleHeight();f=v?{x:pu(i,this.left+l,this.right-n[0]),y:this.top+l+y,line:0}:{x:this.left+l,y:pu(i,this.top+y+l,this.bottom-t[0].height),line:0},df(this.ctx,e.textDirection);let b=h+l;this.legendItems.forEach((o,u)=>{r.strokeStyle=o.fontColor,r.fillStyle=o.fontColor;let m=r.measureText(o.text).width,h=s.textAlign(o.textAlign||=a.textAlign),x=p+d+m,S=f.x,C=f.y;s.setWidth(this.width),v?u>0&&S+x+l>this.right&&(C=f.y+=b,f.line++,S=f.x=pu(i,this.left+l,this.right-n[f.line])):u>0&&C+b>this.bottom&&(S=f.x=S+t[f.line].width+l,f.line++,C=f.y=pu(i,this.top+y+l,this.bottom-t[f.line].height));let w=s.x(S);if(g(w,C,o),S=mu(h,S+p+d,v?S+x:this.right,e.rtl),_(s.x(S),C,o),v)f.x+=x+l;else if(typeof o.text!=`string`){let e=c.lineHeight;f.y+=__(o,e)+l}else f.y+=b}),ff(this.ctx,e.textDirection)}drawTitle(){let e=this.options,t=e.title,n=J(t.font),r=ld(t.padding);if(!t.display)return;let i=uf(e.rtl,this.left,this.width),a=this.ctx,o=t.position,s=n.size/2,c=r.top+s,l,u=this.left,d=this.width;if(this.isHorizontal())d=Math.max(...this.lineWidths),l=this.top+c,u=pu(e.align,u,this.right-d);else{let t=this.columnSizes.reduce((e,t)=>Math.max(e,t.height),0);l=c+pu(e.align,this.top,this.bottom-t-e.labels.padding-this._computeTitleHeight())}let f=pu(o,u,u+d);a.textAlign=i.textAlign(fu(o)),a.textBaseline=`middle`,a.strokeStyle=t.color,a.fillStyle=t.color,a.font=n.string,ed(a,t.text,f,l,n)}_computeTitleHeight(){let e=this.options.title,t=J(e.font),n=ld(e.padding);return e.display?t.lineHeight+n.height:0}_getLegendItemAt(e,t){let n,r,i;if(eu(e,this.left,this.right)&&eu(t,this.top,this.bottom)){for(i=this.legendHitBoxes,n=0;n<i.length;++n)if(r=i[n],eu(e,r.left,r.left+r.width)&&eu(t,r.top,r.top+r.height))return this.legendItems[n]}return null}handleEvent(e){let t=this.options;if(!v_(e.type,t))return;let n=this._getLegendItemAt(e.x,e.y);if(e.type===`mousemove`||e.type===`mouseout`){let r=this._hoveredItem,i=f_(r,n);r&&!i&&V(t.onLeave,[e,r,this],this),this._hoveredItem=n,n&&!i&&V(t.onHover,[e,n,this],this)}else n&&V(t.onClick,[e,n,this],this)}};function m_(e,t,n,r,i){return{itemWidth:h_(r,e,t,n),itemHeight:g_(i,r,t.lineHeight)}}function h_(e,t,n,r){let i=e.text;return i&&typeof i!=`string`&&(i=i.reduce((e,t)=>e.length>t.length?e:t)),t+n.size/2+r.measureText(i).width}function g_(e,t,n){let r=e;return typeof t.text!=`string`&&(r=__(t,n)),r}function __(e,t){return t*(e.text?e.text.length:0)}function v_(e,t){return!!((e===`mousemove`||e===`mouseout`)&&(t.onHover||t.onLeave)||t.onClick&&(e===`click`||e===`mouseup`))}var y_={id:`legend`,_element:p_,start(e,t,n){let r=e.legend=new p_({ctx:e.ctx,options:n,chart:e});$p.configure(e,r,n),$p.addBox(e,r)},stop(e){$p.removeBox(e,e.legend),delete e.legend},beforeUpdate(e,t,n){let r=e.legend;$p.configure(e,r,n),r.options=n},afterUpdate(e){let t=e.legend;t.buildLabels(),t.adjustHitBoxes()},afterEvent(e,t){t.replay||e.legend.handleEvent(t.event)},defaults:{display:!0,position:`top`,align:`center`,fullSize:!0,reverse:!1,weight:1e3,onClick(e,t,n){let r=t.datasetIndex,i=n.chart;i.isDatasetVisible(r)?(i.hide(r),t.hidden=!0):(i.show(r),t.hidden=!1)},onHover:null,onLeave:null,labels:{color:e=>e.chart.options.color,boxWidth:40,padding:10,generateLabels(e){let t=e.data.datasets,{labels:{usePointStyle:n,pointStyle:r,textAlign:i,color:a,useBorderRadius:o,borderRadius:s}}=e.legend.options;return e._getSortedDatasetMetas().map(e=>{let c=e.controller.getStyle(n?0:void 0),l=ld(c.borderWidth);return{text:t[e.index].label,fillStyle:c.backgroundColor,fontColor:a,hidden:!e.visible,lineCap:c.borderCapStyle,lineDash:c.borderDash,lineDashOffset:c.borderDashOffset,lineJoin:c.borderJoinStyle,lineWidth:(l.width+l.height)/4,strokeStyle:c.borderColor,pointStyle:r||c.pointStyle,rotation:c.rotation,textAlign:i||c.textAlign,borderRadius:o&&(s||c.borderRadius),datasetIndex:e.index}},this)}},title:{color:e=>e.chart.options.color,display:!1,position:`center`,text:``}},descriptors:{_scriptable:e=>!e.startsWith(`on`),labels:{_scriptable:e=>![`generateLabels`,`filter`,`sort`].includes(e)}}},b_=class extends wm{constructor(e){super(),this.chart=e.chart,this.options=e.options,this.ctx=e.ctx,this._padding=void 0,this.top=void 0,this.bottom=void 0,this.left=void 0,this.right=void 0,this.width=void 0,this.height=void 0,this.position=void 0,this.weight=void 0,this.fullSize=void 0}update(e,t){let n=this.options;if(this.left=0,this.top=0,!n.display){this.width=this.height=this.right=this.bottom=0;return}this.width=this.right=e,this.height=this.bottom=t;let r=L(n.text)?n.text.length:1;this._padding=ld(n.padding);let i=r*J(n.font).lineHeight+this._padding.height;this.isHorizontal()?this.height=i:this.width=i}isHorizontal(){let e=this.options.position;return e===`top`||e===`bottom`}_drawArgs(e){let{top:t,left:n,bottom:r,right:i,options:a}=this,o=a.align,s=0,c,l,u;return this.isHorizontal()?(l=pu(o,n,i),u=t+e,c=i-n):(a.position===`left`?(l=n+e,u=pu(o,r,t),s=U*-.5):(l=i-e,u=pu(o,t,r),s=U*.5),c=r-t),{titleX:l,titleY:u,maxWidth:c,rotation:s}}draw(){let e=this.ctx,t=this.options;if(!t.display)return;let n=J(t.font),r=n.lineHeight/2+this._padding.top,{titleX:i,titleY:a,maxWidth:o,rotation:s}=this._drawArgs(r);ed(e,t.text,0,0,n,{color:t.color,maxWidth:o,rotation:s,textAlign:fu(t.align),textBaseline:`middle`,translation:[i,a]})}};function x_(e,t){let n=new b_({ctx:e.ctx,options:t,chart:e});$p.configure(e,n,t),$p.addBox(e,n),e.titleBlock=n}var S_={id:`title`,_element:b_,start(e,t,n){x_(e,n)},stop(e){let t=e.titleBlock;$p.removeBox(e,t),delete e.titleBlock},beforeUpdate(e,t,n){let r=e.titleBlock;$p.configure(e,r,n),r.options=n},defaults:{align:`center`,display:!1,font:{weight:`bold`},fullSize:!0,padding:10,position:`top`,text:``,weight:2e3},defaultRoutes:{color:`color`},descriptors:{_scriptable:!0,_indexable:!1}},C_=new WeakMap,w_={id:`subtitle`,start(e,t,n){let r=new b_({ctx:e.ctx,options:n,chart:e});$p.configure(e,r,n),$p.addBox(e,r),C_.set(e,r)},stop(e){$p.removeBox(e,C_.get(e)),C_.delete(e)},beforeUpdate(e,t,n){let r=C_.get(e);$p.configure(e,r,n),r.options=n},defaults:{align:`center`,display:!1,font:{weight:`normal`},fullSize:!0,padding:0,position:`top`,text:``,weight:1500},defaultRoutes:{color:`color`},descriptors:{_scriptable:!0,_indexable:!1}},T_={average(e){if(!e.length)return!1;let t,n,r=new Set,i=0,a=0;for(t=0,n=e.length;t<n;++t){let n=e[t].element;if(n&&n.hasValue()){let e=n.tooltipPosition();r.add(e.x),i+=e.y,++a}}return a===0||r.size===0?!1:{x:[...r].reduce((e,t)=>e+t)/r.size,y:i/a}},nearest(e,t){if(!e.length)return!1;let n=t.x,r=t.y,i=1/0,a,o,s;for(a=0,o=e.length;a<o;++a){let n=e[a].element;if(n&&n.hasValue()){let e=Yl(t,n.getCenterPoint());e<i&&(i=e,s=n)}}if(s){let e=s.tooltipPosition();n=e.x,r=e.y}return{x:n,y:r}}};function E_(e,t){return t&&(L(t)?Array.prototype.push.apply(e,t):e.push(t)),e}function D_(e){return(typeof e==`string`||e instanceof String)&&e.indexOf(`
`)>-1?e.split(`
`):e}function O_(e,t){let{element:n,datasetIndex:r,index:i}=t,a=e.getDatasetMeta(r).controller,{label:o,value:s}=a.getLabelAndValue(i);return{chart:e,label:o,parsed:a.getParsed(i),raw:e.data.datasets[r].data[i],formattedValue:s,dataset:a.getDataset(),dataIndex:i,datasetIndex:r,element:n}}function k_(e,t){let n=e.chart.ctx,{body:r,footer:i,title:a}=e,{boxWidth:o,boxHeight:s}=t,c=J(t.bodyFont),l=J(t.titleFont),u=J(t.footerFont),d=a.length,f=i.length,p=r.length,m=ld(t.padding),h=m.height,g=0,_=r.reduce((e,t)=>e+t.before.length+t.lines.length+t.after.length,0);if(_+=e.beforeBody.length+e.afterBody.length,d&&(h+=d*l.lineHeight+(d-1)*t.titleSpacing+t.titleMarginBottom),_){let e=t.displayColors?Math.max(s,c.lineHeight):c.lineHeight;h+=p*e+(_-p)*c.lineHeight+(_-1)*t.bodySpacing}f&&(h+=t.footerMarginTop+f*u.lineHeight+(f-1)*t.footerSpacing);let v=0,y=function(e){g=Math.max(g,n.measureText(e).width+v)};return n.save(),n.font=l.string,H(e.title,y),n.font=c.string,H(e.beforeBody.concat(e.afterBody),y),v=t.displayColors?o+2+t.boxPadding:0,H(r,e=>{H(e.before,y),H(e.lines,y),H(e.after,y)}),v=0,n.font=u.string,H(e.footer,y),n.restore(),g+=m.width,{width:g,height:h}}function A_(e,t){let{y:n,height:r}=t;return n<r/2?`top`:n>e.height-r/2?`bottom`:`center`}function j_(e,t,n,r){let{x:i,width:a}=r,o=n.caretSize+n.caretPadding;if(e===`left`&&i+a+o>t.width||e===`right`&&i-a-o<0)return!0}function M_(e,t,n,r){let{x:i,width:a}=n,{width:o,chartArea:{left:s,right:c}}=e,l=`center`;return r===`center`?l=i<=(s+c)/2?`left`:`right`:i<=a/2?l=`left`:i>=o-a/2&&(l=`right`),j_(l,e,t,n)&&(l=`center`),l}function N_(e,t,n){let r=n.yAlign||t.yAlign||A_(e,n);return{xAlign:n.xAlign||t.xAlign||M_(e,t,n,r),yAlign:r}}function P_(e,t){let{x:n,width:r}=e;return t===`right`?n-=r:t===`center`&&(n-=r/2),n}function F_(e,t,n){let{y:r,height:i}=e;return t===`top`?r+=n:r-=t===`bottom`?i+n:i/2,r}function I_(e,t,n,r){let{caretSize:i,caretPadding:a,cornerRadius:o}=e,{xAlign:s,yAlign:c}=n,l=i+a,{topLeft:u,topRight:d,bottomLeft:f,bottomRight:p}=cd(o),m=P_(t,s),h=F_(t,c,l);return c===`center`?s===`left`?m+=l:s===`right`&&(m-=l):s===`left`?m-=Math.max(u,f)+i:s===`right`&&(m+=Math.max(d,p)+i),{x:K(m,0,r.width-t.width),y:K(h,0,r.height-t.height)}}function L_(e,t,n){let r=ld(n.padding);return t===`center`?e.x+e.width/2:t===`right`?e.x+e.width-r.right:e.x+r.left}function R_(e){return E_([],D_(e))}function z_(e,t,n){return dd(e,{tooltip:t,tooltipItems:n,type:`tooltip`})}function B_(e,t){let n=t&&t.dataset&&t.dataset.tooltip&&t.dataset.tooltip.callbacks;return n?e.override(n):e}var V_={beforeTitle:ul,title(e){if(e.length>0){let t=e[0],n=t.chart.data.labels,r=n?n.length:0;if(this&&this.options&&this.options.mode===`dataset`)return t.dataset.label||``;if(t.label)return t.label;if(r>0&&t.dataIndex<r)return n[t.dataIndex]}return``},afterTitle:ul,beforeBody:ul,beforeLabel:ul,label(e){if(this&&this.options&&this.options.mode===`dataset`)return e.label+`: `+e.formattedValue||e.formattedValue;let t=e.dataset.label||``;t&&(t+=`: `);let n=e.formattedValue;return I(n)||(t+=n),t},labelColor(e){let t=e.chart.getDatasetMeta(e.datasetIndex).controller.getStyle(e.dataIndex);return{borderColor:t.borderColor,backgroundColor:t.backgroundColor,borderWidth:t.borderWidth,borderDash:t.borderDash,borderDashOffset:t.borderDashOffset,borderRadius:0}},labelTextColor(){return this.options.bodyColor},labelPointStyle(e){let t=e.chart.getDatasetMeta(e.datasetIndex).controller.getStyle(e.dataIndex);return{pointStyle:t.pointStyle,rotation:t.rotation}},afterLabel:ul,afterBody:ul,beforeFooter:ul,footer:ul,afterFooter:ul};function H_(e,t,n,r){let i=e[t].call(n,r);return typeof i>`u`?V_[t].call(n,r):i}var U_,W_=(U_=class extends wm{constructor(e){super(),this.opacity=0,this._active=[],this._eventPosition=void 0,this._size=void 0,this._cachedAnimations=void 0,this._tooltipItems=[],this.$animations=void 0,this.$context=void 0,this.chart=e.chart,this.options=e.options,this.dataPoints=void 0,this.title=void 0,this.beforeBody=void 0,this.body=void 0,this.afterBody=void 0,this.footer=void 0,this.xAlign=void 0,this.yAlign=void 0,this.x=void 0,this.y=void 0,this.height=void 0,this.width=void 0,this.caretX=void 0,this.caretY=void 0,this.labelColors=void 0,this.labelPointStyles=void 0,this.labelTextColors=void 0}initialize(e){this.options=e,this._cachedAnimations=void 0,this.$context=void 0}_resolveAnimations(){let e=this._cachedAnimations;if(e)return e;let t=this.chart,n=this.options.setContext(this.getContext()),r=n.enabled&&t.options.animation&&n.animations,i=new Mf(this.chart,r);return r._cacheable&&(this._cachedAnimations=Object.freeze(i)),i}getContext(){return this.$context||=z_(this.chart.getContext(),this,this._tooltipItems)}getTitle(e,t){let{callbacks:n}=t,r=H_(n,`beforeTitle`,this,e),i=H_(n,`title`,this,e),a=H_(n,`afterTitle`,this,e),o=[];return o=E_(o,D_(r)),o=E_(o,D_(i)),o=E_(o,D_(a)),o}getBeforeBody(e,t){return R_(H_(t.callbacks,`beforeBody`,this,e))}getBody(e,t){let{callbacks:n}=t,r=[];return H(e,e=>{let t={before:[],lines:[],after:[]},i=B_(n,e);E_(t.before,D_(H_(i,`beforeLabel`,this,e))),E_(t.lines,H_(i,`label`,this,e)),E_(t.after,D_(H_(i,`afterLabel`,this,e))),r.push(t)}),r}getAfterBody(e,t){return R_(H_(t.callbacks,`afterBody`,this,e))}getFooter(e,t){let{callbacks:n}=t,r=H_(n,`beforeFooter`,this,e),i=H_(n,`footer`,this,e),a=H_(n,`afterFooter`,this,e),o=[];return o=E_(o,D_(r)),o=E_(o,D_(i)),o=E_(o,D_(a)),o}_createItems(e){let t=this._active,n=this.chart.data,r=[],i=[],a=[],o=[],s,c;for(s=0,c=t.length;s<c;++s)o.push(O_(this.chart,t[s]));return e.filter&&(o=o.filter((t,r,i)=>e.filter(t,r,i,n))),e.itemSort&&(o=o.sort((t,r)=>e.itemSort(t,r,n))),H(o,t=>{let n=B_(e.callbacks,t);r.push(H_(n,`labelColor`,this,t)),i.push(H_(n,`labelPointStyle`,this,t)),a.push(H_(n,`labelTextColor`,this,t))}),this.labelColors=r,this.labelPointStyles=i,this.labelTextColors=a,this.dataPoints=o,o}update(e,t){let n=this.options.setContext(this.getContext()),r=this._active,i,a=[];if(!r.length)this.opacity!==0&&(i={opacity:0});else{let e=T_[n.position].call(this,r,this._eventPosition);a=this._createItems(n),this.title=this.getTitle(a,n),this.beforeBody=this.getBeforeBody(a,n),this.body=this.getBody(a,n),this.afterBody=this.getAfterBody(a,n),this.footer=this.getFooter(a,n);let t=this._size=k_(this,n),o=Object.assign({},e,t),s=N_(this.chart,n,o),c=I_(n,o,s,this.chart);this.xAlign=s.xAlign,this.yAlign=s.yAlign,i={opacity:1,x:c.x,y:c.y,width:t.width,height:t.height,caretX:e.x,caretY:e.y}}this._tooltipItems=a,this.$context=void 0,i&&this._resolveAnimations().update(this,i),e&&n.external&&n.external.call(this,{chart:this.chart,tooltip:this,replay:t})}drawCaret(e,t,n,r){let i=this.getCaretPosition(e,n,r);t.lineTo(i.x1,i.y1),t.lineTo(i.x2,i.y2),t.lineTo(i.x3,i.y3)}getCaretPosition(e,t,n){let{xAlign:r,yAlign:i}=this,{caretSize:a,cornerRadius:o}=n,{topLeft:s,topRight:c,bottomLeft:l,bottomRight:u}=cd(o),{x:d,y:f}=e,{width:p,height:m}=t,h,g,_,v,y,b;return i===`center`?(y=f+m/2,r===`left`?(h=d,g=h-a,v=y+a,b=y-a):(h=d+p,g=h+a,v=y-a,b=y+a),_=h):(g=r===`left`?d+Math.max(s,l)+a:r===`right`?d+p-Math.max(c,u)-a:this.caretX,i===`top`?(v=f,y=v-a,h=g-a,_=g+a):(v=f+m,y=v+a,h=g+a,_=g-a),b=v),{x1:h,x2:g,x3:_,y1:v,y2:y,y3:b}}drawTitle(e,t,n){let r=this.title,i=r.length,a,o,s;if(i){let c=uf(n.rtl,this.x,this.width);for(e.x=L_(this,n.titleAlign,n),t.textAlign=c.textAlign(n.titleAlign),t.textBaseline=`middle`,a=J(n.titleFont),o=n.titleSpacing,t.fillStyle=n.titleColor,t.font=a.string,s=0;s<i;++s)t.fillText(r[s],c.x(e.x),e.y+a.lineHeight/2),e.y+=a.lineHeight+o,s+1===i&&(e.y+=n.titleMarginBottom-o)}}_drawColorBox(e,t,n,r,i){let a=this.labelColors[n],o=this.labelPointStyles[n],{boxHeight:s,boxWidth:c}=i,l=J(i.bodyFont),u=L_(this,`left`,i),d=r.x(u),f=s<l.lineHeight?(l.lineHeight-s)/2:0,p=t.y+f;if(i.usePointStyle){let t={radius:Math.min(c,s)/2,pointStyle:o.pointStyle,rotation:o.rotation,borderWidth:1},n=r.leftForLtr(d,c)+c/2,l=p+s/2;e.strokeStyle=i.multiKeyBackground,e.fillStyle=i.multiKeyBackground,Wu(e,t,n,l),e.strokeStyle=a.borderColor,e.fillStyle=a.backgroundColor,Wu(e,t,n,l)}else{e.lineWidth=R(a.borderWidth)?Math.max(...Object.values(a.borderWidth)):a.borderWidth||1,e.strokeStyle=a.borderColor,e.setLineDash(a.borderDash||[]),e.lineDashOffset=a.borderDashOffset||0;let t=r.leftForLtr(d,c),n=r.leftForLtr(r.xPlus(d,1),c-2),o=cd(a.borderRadius);Object.values(o).some(e=>e!==0)?(e.beginPath(),e.fillStyle=i.multiKeyBackground,td(e,{x:t,y:p,w:c,h:s,radius:o}),e.fill(),e.stroke(),e.fillStyle=a.backgroundColor,e.beginPath(),td(e,{x:n,y:p+1,w:c-2,h:s-2,radius:o}),e.fill()):(e.fillStyle=i.multiKeyBackground,e.fillRect(t,p,c,s),e.strokeRect(t,p,c,s),e.fillStyle=a.backgroundColor,e.fillRect(n,p+1,c-2,s-2))}e.fillStyle=this.labelTextColors[n]}drawBody(e,t,n){let{body:r}=this,{bodySpacing:i,bodyAlign:a,displayColors:o,boxHeight:s,boxWidth:c,boxPadding:l}=n,u=J(n.bodyFont),d=u.lineHeight,f=0,p=uf(n.rtl,this.x,this.width),m=function(n){t.fillText(n,p.x(e.x+f),e.y+d/2),e.y+=d+i},h=p.textAlign(a),g,_,v,y,b,x,S;for(t.textAlign=a,t.textBaseline=`middle`,t.font=u.string,e.x=L_(this,h,n),t.fillStyle=n.bodyColor,H(this.beforeBody,m),f=o&&h!==`right`?a===`center`?c/2+l:c+2+l:0,y=0,x=r.length;y<x;++y){for(g=r[y],_=this.labelTextColors[y],t.fillStyle=_,H(g.before,m),v=g.lines,o&&v.length&&(this._drawColorBox(t,e,y,p,n),d=Math.max(u.lineHeight,s)),b=0,S=v.length;b<S;++b)m(v[b]),d=u.lineHeight;H(g.after,m)}f=0,d=u.lineHeight,H(this.afterBody,m),e.y-=i}drawFooter(e,t,n){let r=this.footer,i=r.length,a,o;if(i){let s=uf(n.rtl,this.x,this.width);for(e.x=L_(this,n.footerAlign,n),e.y+=n.footerMarginTop,t.textAlign=s.textAlign(n.footerAlign),t.textBaseline=`middle`,a=J(n.footerFont),t.fillStyle=n.footerColor,t.font=a.string,o=0;o<i;++o)t.fillText(r[o],s.x(e.x),e.y+a.lineHeight/2),e.y+=a.lineHeight+n.footerSpacing}}drawBackground(e,t,n,r){let{xAlign:i,yAlign:a}=this,{x:o,y:s}=e,{width:c,height:l}=n,{topLeft:u,topRight:d,bottomLeft:f,bottomRight:p}=cd(r.cornerRadius);t.fillStyle=r.backgroundColor,t.strokeStyle=r.borderColor,t.lineWidth=r.borderWidth,t.beginPath(),t.moveTo(o+u,s),a===`top`&&this.drawCaret(e,t,n,r),t.lineTo(o+c-d,s),t.quadraticCurveTo(o+c,s,o+c,s+d),a===`center`&&i===`right`&&this.drawCaret(e,t,n,r),t.lineTo(o+c,s+l-p),t.quadraticCurveTo(o+c,s+l,o+c-p,s+l),a===`bottom`&&this.drawCaret(e,t,n,r),t.lineTo(o+f,s+l),t.quadraticCurveTo(o,s+l,o,s+l-f),a===`center`&&i===`left`&&this.drawCaret(e,t,n,r),t.lineTo(o,s+u),t.quadraticCurveTo(o,s,o+u,s),t.closePath(),t.fill(),r.borderWidth>0&&t.stroke()}_updateAnimationTarget(e){let t=this.chart,n=this.$animations,r=n&&n.x,i=n&&n.y;if(r||i){let n=T_[e.position].call(this,this._active,this._eventPosition);if(!n)return;let a=this._size=k_(this,e),o=Object.assign({},n,this._size),s=N_(t,e,o),c=I_(e,o,s,t);(r._to!==c.x||i._to!==c.y)&&(this.xAlign=s.xAlign,this.yAlign=s.yAlign,this.width=a.width,this.height=a.height,this.caretX=n.x,this.caretY=n.y,this._resolveAnimations().update(this,c))}}_willRender(){return!!this.opacity}draw(e){let t=this.options.setContext(this.getContext()),n=this.opacity;if(!n)return;this._updateAnimationTarget(t);let r={width:this.width,height:this.height},i={x:this.x,y:this.y};n=Math.abs(n)<.001?0:n;let a=ld(t.padding),o=this.title.length||this.beforeBody.length||this.body.length||this.afterBody.length||this.footer.length;t.enabled&&o&&(e.save(),e.globalAlpha=n,this.drawBackground(i,e,r,t),df(e,t.textDirection),i.y+=a.top,this.drawTitle(i,e,t),this.drawBody(i,e,t),this.drawFooter(i,e,t),ff(e,t.textDirection),e.restore())}getActiveElements(){return this._active||[]}setActiveElements(e,t){let n=this._active,r=e.map(({datasetIndex:e,index:t})=>{let n=this.chart.getDatasetMeta(e);if(!n)throw Error(`Cannot find a dataset at index `+e);return{datasetIndex:e,element:n.data[t],index:t}}),i=!hl(n,r),a=this._positionChanged(r,t);(i||a)&&(this._active=r,this._eventPosition=t,this._ignoreReplayEvents=!0,this.update(!0))}handleEvent(e,t,n=!0){if(t&&this._ignoreReplayEvents)return!1;this._ignoreReplayEvents=!1;let r=this.options,i=this._active||[],a=this._getActiveElements(e,i,t,n),o=this._positionChanged(a,e),s=t||!hl(a,i)||o;return s&&(this._active=a,(r.enabled||r.external)&&(this._eventPosition={x:e.x,y:e.y},this.update(!0,t))),s}_getActiveElements(e,t,n,r){let i=this.options;if(e.type===`mouseout`)return[];if(!r)return t.filter(e=>this.chart.data.datasets[e.datasetIndex]&&this.chart.getDatasetMeta(e.datasetIndex).controller.getParsed(e.index)!==void 0);let a=this.chart.getElementsAtEventForMode(e,i.mode,i,n);return i.reverse&&a.reverse(),a}_positionChanged(e,t){let{caretX:n,caretY:r,options:i}=this,a=T_[i.position].call(this,e,t);return a!==!1&&(n!==a.x||r!==a.y)}},N(U_,`positioners`,T_),U_),G_=Object.freeze({__proto__:null,Colors:Dg,Decimation:Ng,Filler:u_,Legend:y_,SubTitle:w_,Title:S_,Tooltip:{id:`tooltip`,_element:W_,positioners:T_,afterInit(e,t,n){n&&(e.tooltip=new W_({chart:e,options:n}))},beforeUpdate(e,t,n){e.tooltip&&e.tooltip.initialize(n)},reset(e,t,n){e.tooltip&&e.tooltip.initialize(n)},afterDraw(e){let t=e.tooltip;if(t&&t._willRender()){let n={tooltip:t};if(e.notifyPlugins(`beforeTooltipDraw`,{...n,cancelable:!0})===!1)return;t.draw(e.ctx),e.notifyPlugins(`afterTooltipDraw`,n)}},afterEvent(e,t){if(e.tooltip){let n=t.replay;e.tooltip.handleEvent(t.event,n,t.inChartArea)&&(t.changed=!0)}},defaults:{enabled:!0,external:null,position:`average`,backgroundColor:`rgba(0,0,0,0.8)`,titleColor:`#fff`,titleFont:{weight:`bold`},titleSpacing:2,titleMarginBottom:6,titleAlign:`left`,bodyColor:`#fff`,bodySpacing:2,bodyFont:{},bodyAlign:`left`,footerColor:`#fff`,footerSpacing:2,footerMarginTop:6,footerFont:{weight:`bold`},footerAlign:`left`,padding:6,caretPadding:2,caretSize:5,cornerRadius:6,boxHeight:(e,t)=>t.bodyFont.size,boxWidth:(e,t)=>t.bodyFont.size,multiKeyBackground:`#fff`,displayColors:!0,boxPadding:0,borderColor:`rgba(0,0,0,0)`,borderWidth:0,animation:{duration:400,easing:`easeOutQuart`},animations:{numbers:{type:`number`,properties:[`x`,`y`,`width`,`height`,`caretX`,`caretY`]},opacity:{easing:`linear`,duration:200}},callbacks:V_},defaultRoutes:{bodyFont:`font`,footerFont:`font`,titleFont:`font`},descriptors:{_scriptable:e=>e!==`filter`&&e!==`itemSort`&&e!==`external`,_indexable:!1,callbacks:{_scriptable:!1,_indexable:!1},animation:{_fallback:!1},animations:{_fallback:`animation`}},additionalOptionScopes:[`interaction`]}}),K_=(e,t,n,r)=>(typeof t==`string`?(n=e.push(t)-1,r.unshift({index:n,label:t})):isNaN(t)&&(n=null),n);function q_(e,t,n,r){let i=e.indexOf(t);return i===-1?K_(e,t,n,r):i===e.lastIndexOf(t)?i:n}var J_=(e,t)=>e===null?null:K(Math.round(e),0,t);function Y_(e){let t=this.getLabels();return e>=0&&e<t.length?t[e]:e}var X_=class extends Wm{constructor(e){super(e),this._startValue=void 0,this._valueRange=0,this._addedLabels=[]}init(e){let t=this._addedLabels;if(t.length){let e=this.getLabels();for(let{index:n,label:r}of t)e[n]===r&&e.splice(n,1);this._addedLabels=[]}super.init(e)}parse(e,t){if(I(e))return null;let n=this.getLabels();return t=isFinite(t)&&n[t]===e?t:q_(n,e,B(t,e),this._addedLabels),J_(t,n.length-1)}determineDataLimits(){let{minDefined:e,maxDefined:t}=this.getUserBounds(),{min:n,max:r}=this.getMinMax(!0);this.options.bounds===`ticks`&&(e||(n=0),t||(r=this.getLabels().length-1)),this.min=n,this.max=r}buildTicks(){let e=this.min,t=this.max,n=this.options.offset,r=[],i=this.getLabels();i=e===0&&t===i.length-1?i:i.slice(e,t+1),this._valueRange=Math.max(i.length-+!n,1),this._startValue=this.min-(n?.5:0);for(let n=e;n<=t;n++)r.push({value:n});return r}getLabelForValue(e){return Y_.call(this,e)}configure(){super.configure(),this.isHorizontal()||(this._reversePixels=!this._reversePixels)}getPixelForValue(e){return typeof e!=`number`&&(e=this.parse(e)),e===null?NaN:this.getPixelForDecimal((e-this._startValue)/this._valueRange)}getPixelForTick(e){let t=this.ticks;return e<0||e>t.length-1?null:this.getPixelForValue(t[e].value)}getValueForPixel(e){return Math.round(this._startValue+this.getDecimalForPixel(e)*this._valueRange)}getBasePixel(){return this.bottom}};N(X_,`id`,`category`),N(X_,`defaults`,{ticks:{callback:Y_}});function Z_(e,t){let n=[],{bounds:r,step:i,min:a,max:o,precision:s,count:c,maxTicks:l,maxDigits:u,includeBounds:d}=e,f=i||1,p=l-1,{min:m,max:h}=t,g=!I(a),_=!I(o),v=!I(c),y=(h-m)/(u+1),b=zl((h-m)/p/f)*f,x,S,C,w;if(b<1e-14&&!g&&!_)return[{value:m},{value:h}];w=Math.ceil(h/b)-Math.floor(m/b),w>p&&(b=zl(w*b/p/f)*f),I(s)||(x=10**s,b=Math.ceil(b*x)/x),r===`ticks`?(S=Math.floor(m/b)*b,C=Math.ceil(h/b)*b):(S=m,C=h),g&&_&&i&&Ul((o-a)/i,b/1e3)?(w=Math.round(Math.min((o-a)/b,l)),b=(o-a)/w,S=a,C=o):v?(S=g?a:S,C=_?o:C,w=c-1,b=(C-S)/w):(w=(C-S)/b,w=Rl(w,Math.round(w),b/1e3)?Math.round(w):Math.ceil(w));let T=Math.max(ql(b),ql(S));x=10**(I(s)?T:s),S=Math.round(S*x)/x,C=Math.round(C*x)/x;let E=0;for(g&&(d&&S!==a?(n.push({value:a}),S<a&&E++,Rl(Math.round((S+E*b)*x)/x,a,Q_(a,y,e))&&E++):S<a&&E++);E<w;++E){let e=Math.round((S+E*b)*x)/x;if(_&&e>o)break;n.push({value:e})}return _&&d&&C!==o?n.length&&Rl(n[n.length-1].value,o,Q_(o,y,e))?n[n.length-1].value=o:n.push({value:o}):(!_||C===o)&&n.push({value:C}),n}function Q_(e,t,{horizontal:n,minRotation:r}){let i=Gl(r),a=(n?Math.sin(i):Math.cos(i))||.001,o=.75*t*(``+e).length;return Math.min(t/a,o)}var $_=class extends Wm{constructor(e){super(e),this.start=void 0,this.end=void 0,this._startValue=void 0,this._endValue=void 0,this._valueRange=0}parse(e,t){return I(e)||(typeof e==`number`||e instanceof Number)&&!isFinite(+e)?null:+e}handleTickRangeOptions(){let{beginAtZero:e}=this.options,{minDefined:t,maxDefined:n}=this.getUserBounds(),{min:r,max:i}=this,a=e=>r=t?r:e,o=e=>i=n?i:e;if(e){let e=Ll(r),t=Ll(i);e<0&&t<0?o(0):e>0&&t>0&&a(0)}if(r===i){let t=i===0?1:Math.abs(i*.05);o(i+t),e||a(r-t)}this.min=r,this.max=i}getTickLimit(){let{maxTicksLimit:e,stepSize:t}=this.options.ticks,n;return t?(n=Math.ceil(this.max/t)-Math.floor(this.min/t)+1,n>1e3&&(console.warn(`scales.${this.id}.ticks.stepSize: ${t} would result generating up to ${n} ticks. Limiting to 1000.`),n=1e3)):(n=this.computeTickLimit(),e||=11),e&&(n=Math.min(e,n)),n}computeTickLimit(){return 1/0}buildTicks(){let e=this.options,t=e.ticks,n=this.getTickLimit();n=Math.max(2,n);let r=Z_({maxTicks:n,bounds:e.bounds,min:e.min,max:e.max,precision:t.precision,step:t.stepSize,count:t.count,maxDigits:this._maxDigits(),horizontal:this.isHorizontal(),minRotation:t.minRotation||0,includeBounds:t.includeBounds!==!1},this._range||this);return e.bounds===`ticks`&&Wl(r,this,`value`),e.reverse?(r.reverse(),this.start=this.max,this.end=this.min):(this.start=this.min,this.end=this.max),r}configure(){let e=this.ticks,t=this.min,n=this.max;if(super.configure(),this.options.offset&&e.length){let r=(n-t)/Math.max(e.length-1,1)/2;t-=r,n+=r}this._startValue=t,this._endValue=n,this._valueRange=n-t}getLabelForValue(e){return Au(e,this.chart.options.locale,this.options.ticks.format)}},ev=class extends $_{determineDataLimits(){let{min:e,max:t}=this.getMinMax(!0);this.min=z(e)?e:0,this.max=z(t)?t:1,this.handleTickRangeOptions()}computeTickLimit(){let e=this.isHorizontal(),t=e?this.width:this.height,n=Gl(this.options.ticks.minRotation),r=(e?Math.sin(n):Math.cos(n))||.001,i=this._resolveTickFontOptions(0);return Math.ceil(t/Math.min(40,i.lineHeight/r))}getPixelForValue(e){return e===null?NaN:this.getPixelForDecimal((e-this._startValue)/this._valueRange)}getValueForPixel(e){return this._startValue+this.getDecimalForPixel(e)*this._valueRange}};N(ev,`id`,`linear`),N(ev,`defaults`,{ticks:{callback:Nu.formatters.numeric}});var tv=e=>Math.floor(Il(e)),nv=(e,t)=>10**(tv(e)+t);function rv(e){return e/10**tv(e)==1}function iv(e,t,n){let r=10**n,i=Math.floor(e/r);return Math.ceil(t/r)-i}function av(e,t){let n=tv(t-e);for(;iv(e,t,n)>10;)n++;for(;iv(e,t,n)<10;)n--;return Math.min(n,tv(e))}function ov(e,{min:t,max:n}){t=fl(e.min,t);let r=[],i=tv(t),a=av(t,n),o=a<0?10**Math.abs(a):1,s=10**a,c=i>a?10**i:0,l=Math.round((t-c)*o)/o,u=Math.floor((t-c)/s/10)*s*10,d=Math.floor((l-u)/10**a),f=fl(e.min,Math.round((c+u+d*10**a)*o)/o);for(;f<n;)r.push({value:f,major:rv(f),significand:d}),d>=10?d=d<15?15:20:d++,d>=20&&(a++,d=2,o=a>=0?1:o),f=Math.round((c+u+d*10**a)*o)/o;let p=fl(e.max,f);return r.push({value:p,major:rv(p),significand:d}),r}var sv=class extends Wm{constructor(e){super(e),this.start=void 0,this.end=void 0,this._startValue=void 0,this._valueRange=0}parse(e,t){let n=$_.prototype.parse.apply(this,[e,t]);if(n===0){this._zero=!0;return}return z(n)&&n>0?n:null}determineDataLimits(){let{min:e,max:t}=this.getMinMax(!0);this.min=z(e)?Math.max(0,e):null,this.max=z(t)?Math.max(0,t):null,this.options.beginAtZero&&(this._zero=!0),this._zero&&this.min!==this._suggestedMin&&!z(this._userMin)&&(this.min=e===nv(this.min,0)?nv(this.min,-1):nv(this.min,0)),this.handleTickRangeOptions()}handleTickRangeOptions(){let{minDefined:e,maxDefined:t}=this.getUserBounds(),n=this.min,r=this.max,i=t=>n=e?n:t,a=e=>r=t?r:e;n===r&&(n<=0?(i(1),a(10)):(i(nv(n,-1)),a(nv(r,1)))),n<=0&&i(nv(r,-1)),r<=0&&a(nv(n,1)),this.min=n,this.max=r}buildTicks(){let e=this.options,t=ov({min:this._userMin,max:this._userMax},this);return e.bounds===`ticks`&&Wl(t,this,`value`),e.reverse?(t.reverse(),this.start=this.max,this.end=this.min):(this.start=this.min,this.end=this.max),t}getLabelForValue(e){return e===void 0?`0`:Au(e,this.chart.options.locale,this.options.ticks.format)}configure(){let e=this.min;super.configure(),this._startValue=Il(e),this._valueRange=Il(this.max)-Il(e)}getPixelForValue(e){return(e===void 0||e===0)&&(e=this.min),e===null||isNaN(e)?NaN:this.getPixelForDecimal(e===this.min?0:(Il(e)-this._startValue)/this._valueRange)}getValueForPixel(e){let t=this.getDecimalForPixel(e);return 10**(this._startValue+t*this._valueRange)}};N(sv,`id`,`logarithmic`),N(sv,`defaults`,{ticks:{callback:Nu.formatters.logarithmic,major:{enabled:!0}}});function cv(e){let t=e.ticks;if(t.display&&e.display){let e=ld(t.backdropPadding);return B(t.font&&t.font.size,q.font.size)+e.height}return 0}function lv(e,t,n){return n=L(n)?n:[n],{w:Vu(e,t.string,n),h:n.length*t.lineHeight}}function uv(e,t,n,r,i){return e===r||e===i?{start:t-n/2,end:t+n/2}:e<r||e>i?{start:t-n,end:t}:{start:t,end:t+n}}function dv(e){let t={l:e.left+e._padding.left,r:e.right-e._padding.right,t:e.top+e._padding.top,b:e.bottom-e._padding.bottom},n=Object.assign({},t),r=[],i=[],a=e._pointLabels.length,o=e.options.pointLabels,s=o.centerPointLabels?U/a:0;for(let c=0;c<a;c++){let a=o.setContext(e.getPointLabelContext(c));i[c]=a.padding;let l=e.getPointPosition(c,e.drawingArea+i[c],s),u=J(a.font),d=lv(e.ctx,u,e._pointLabels[c]);r[c]=d;let f=Zl(e.getIndexAngle(c)+s),p=Math.round(Kl(f));fv(n,t,f,uv(p,l.x,d.w,0,180),uv(p,l.y,d.h,90,270))}e.setCenterPoint(t.l-n.l,n.r-t.r,t.t-n.t,n.b-t.b),e._pointLabelItems=hv(e,r,i)}function fv(e,t,n,r,i){let a=Math.abs(Math.sin(n)),o=Math.abs(Math.cos(n)),s=0,c=0;r.start<t.l?(s=(t.l-r.start)/a,e.l=Math.min(e.l,t.l-s)):r.end>t.r&&(s=(r.end-t.r)/a,e.r=Math.max(e.r,t.r+s)),i.start<t.t?(c=(t.t-i.start)/o,e.t=Math.min(e.t,t.t-c)):i.end>t.b&&(c=(i.end-t.b)/o,e.b=Math.max(e.b,t.b+c))}function pv(e,t,n){let r=e.drawingArea,{extra:i,additionalAngle:a,padding:o,size:s}=n,c=e.getPointPosition(t,r+i+o,a),l=Math.round(Kl(Zl(c.angle+G))),u=vv(c.y,s.h,l),d=gv(l),f=_v(c.x,s.w,d);return{visible:!0,x:c.x,y:u,textAlign:d,left:f,top:u,right:f+s.w,bottom:u+s.h}}function mv(e,t){if(!t)return!0;let{left:n,top:r,right:i,bottom:a}=e;return!(Ku({x:n,y:r},t)||Ku({x:n,y:a},t)||Ku({x:i,y:r},t)||Ku({x:i,y:a},t))}function hv(e,t,n){let r=[],i=e._pointLabels.length,a=e.options,{centerPointLabels:o,display:s}=a.pointLabels,c={extra:cv(a)/2,additionalAngle:o?U/i:0},l;for(let a=0;a<i;a++){c.padding=n[a],c.size=t[a];let i=pv(e,a,c);r.push(i),s===`auto`&&(i.visible=mv(i,l),i.visible&&(l=i))}return r}function gv(e){return e===0||e===180?`center`:e<180?`left`:`right`}function _v(e,t,n){return n===`right`?e-=t:n===`center`&&(e-=t/2),e}function vv(e,t,n){return n===90||n===270?e-=t/2:(n>270||n<90)&&(e-=t),e}function yv(e,t,n){let{left:r,top:i,right:a,bottom:o}=n,{backdropColor:s}=t;if(!I(s)){let n=cd(t.borderRadius),c=ld(t.backdropPadding);e.fillStyle=s;let l=r-c.left,u=i-c.top,d=a-r+c.width,f=o-i+c.height;Object.values(n).some(e=>e!==0)?(e.beginPath(),td(e,{x:l,y:u,w:d,h:f,radius:n}),e.fill()):e.fillRect(l,u,d,f)}}function bv(e,t){let{ctx:n,options:{pointLabels:r}}=e;for(let i=t-1;i>=0;i--){let t=e._pointLabelItems[i];if(!t.visible)continue;let a=r.setContext(e.getPointLabelContext(i));yv(n,a,t);let o=J(a.font),{x:s,y:c,textAlign:l}=t;ed(n,e._pointLabels[i],s,c+o.lineHeight/2,o,{color:a.color,textAlign:l,textBaseline:`middle`})}}function xv(e,t,n,r){let{ctx:i}=e;if(n)i.arc(e.xCenter,e.yCenter,t,0,W);else{let n=e.getPointPosition(0,t);i.moveTo(n.x,n.y);for(let a=1;a<r;a++)n=e.getPointPosition(a,t),i.lineTo(n.x,n.y)}}function Sv(e,t,n,r,i){let a=e.ctx,o=t.circular,{color:s,lineWidth:c}=t;!o&&!r||!s||!c||n<0||(a.save(),a.strokeStyle=s,a.lineWidth=c,a.setLineDash(i.dash||[]),a.lineDashOffset=i.dashOffset,a.beginPath(),xv(e,n,o,r),a.closePath(),a.stroke(),a.restore())}function Cv(e,t,n){return dd(e,{label:n,index:t,type:`pointLabel`})}var wv=class extends $_{constructor(e){super(e),this.xCenter=void 0,this.yCenter=void 0,this.drawingArea=void 0,this._pointLabels=[],this._pointLabelItems=[]}setDimensions(){let e=this._padding=ld(cv(this.options)/2),t=this.width=this.maxWidth-e.width,n=this.height=this.maxHeight-e.height;this.xCenter=Math.floor(this.left+t/2+e.left),this.yCenter=Math.floor(this.top+n/2+e.top),this.drawingArea=Math.floor(Math.min(t,n)/2)}determineDataLimits(){let{min:e,max:t}=this.getMinMax(!1);this.min=z(e)&&!isNaN(e)?e:0,this.max=z(t)&&!isNaN(t)?t:0,this.handleTickRangeOptions()}computeTickLimit(){return Math.ceil(this.drawingArea/cv(this.options))}generateTickLabels(e){$_.prototype.generateTickLabels.call(this,e),this._pointLabels=this.getLabels().map((e,t)=>{let n=V(this.options.pointLabels.callback,[e,t],this);return n||n===0?n:``}).filter((e,t)=>this.chart.getDataVisibility(t))}fit(){let e=this.options;e.display&&e.pointLabels.display?dv(this):this.setCenterPoint(0,0,0,0)}setCenterPoint(e,t,n,r){this.xCenter+=Math.floor((e-t)/2),this.yCenter+=Math.floor((n-r)/2),this.drawingArea-=Math.min(this.drawingArea/2,Math.max(e,t,n,r))}getIndexAngle(e){let t=W/(this._pointLabels.length||1),n=this.options.startAngle||0;return Zl(e*t+Gl(n))}getDistanceFromCenterForValue(e){if(I(e))return NaN;let t=this.drawingArea/(this.max-this.min);return this.options.reverse?(this.max-e)*t:(e-this.min)*t}getValueForDistanceFromCenter(e){if(I(e))return NaN;let t=e/(this.drawingArea/(this.max-this.min));return this.options.reverse?this.max-t:this.min+t}getPointLabelContext(e){let t=this._pointLabels||[];if(e>=0&&e<t.length){let n=t[e];return Cv(this.getContext(),e,n)}}getPointPosition(e,t,n=0){let r=this.getIndexAngle(e)-G+n;return{x:Math.cos(r)*t+this.xCenter,y:Math.sin(r)*t+this.yCenter,angle:r}}getPointPositionForValue(e,t){return this.getPointPosition(e,this.getDistanceFromCenterForValue(t))}getBasePosition(e){return this.getPointPositionForValue(e||0,this.getBaseValue())}getPointLabelPosition(e){let{left:t,top:n,right:r,bottom:i}=this._pointLabelItems[e];return{left:t,top:n,right:r,bottom:i}}drawBackground(){let{backgroundColor:e,grid:{circular:t}}=this.options;if(e){let n=this.ctx;n.save(),n.beginPath(),xv(this,this.getDistanceFromCenterForValue(this._endValue),t,this._pointLabels.length),n.closePath(),n.fillStyle=e,n.fill(),n.restore()}}drawGrid(){let e=this.ctx,t=this.options,{angleLines:n,grid:r,border:i}=t,a=this._pointLabels.length,o,s,c;if(t.pointLabels.display&&bv(this,a),r.display&&this.ticks.forEach((e,t)=>{if(t!==0||t===0&&this.min<0){s=this.getDistanceFromCenterForValue(e.value);let n=this.getContext(t),o=r.setContext(n),c=i.setContext(n);Sv(this,o,s,a,c)}}),n.display){for(e.save(),o=a-1;o>=0;o--){let r=n.setContext(this.getPointLabelContext(o)),{color:i,lineWidth:a}=r;!a||!i||(e.lineWidth=a,e.strokeStyle=i,e.setLineDash(r.borderDash),e.lineDashOffset=r.borderDashOffset,s=this.getDistanceFromCenterForValue(t.reverse?this.min:this.max),c=this.getPointPosition(o,s),e.beginPath(),e.moveTo(this.xCenter,this.yCenter),e.lineTo(c.x,c.y),e.stroke())}e.restore()}}drawBorder(){}drawLabels(){let e=this.ctx,t=this.options,n=t.ticks;if(!n.display)return;let r=this.getIndexAngle(0),i,a;e.save(),e.translate(this.xCenter,this.yCenter),e.rotate(r),e.textAlign=`center`,e.textBaseline=`middle`,this.ticks.forEach((r,o)=>{if(o===0&&this.min>=0&&!t.reverse)return;let s=n.setContext(this.getContext(o)),c=J(s.font);if(i=this.getDistanceFromCenterForValue(this.ticks[o].value),s.showLabelBackdrop){e.font=c.string,a=e.measureText(r.label).width,e.fillStyle=s.backdropColor;let t=ld(s.backdropPadding);e.fillRect(-a/2-t.left,-i-c.size/2-t.top,a+t.width,c.size+t.height)}ed(e,r.label,0,-i,c,{color:s.color,strokeColor:s.textStrokeColor,strokeWidth:s.textStrokeWidth})}),e.restore()}drawTitle(){}};N(wv,`id`,`radialLinear`),N(wv,`defaults`,{display:!0,animate:!0,position:`chartArea`,angleLines:{display:!0,lineWidth:1,borderDash:[],borderDashOffset:0},grid:{circular:!1},startAngle:0,ticks:{showLabelBackdrop:!0,callback:Nu.formatters.numeric},pointLabels:{backdropColor:void 0,backdropPadding:2,display:!0,font:{size:10},callback(e){return e},padding:5,centerPointLabels:!1}}),N(wv,`defaultRoutes`,{"angleLines.color":`borderColor`,"pointLabels.color":`color`,"ticks.color":`color`}),N(wv,`descriptors`,{angleLines:{_fallback:`grid`}});var Tv={millisecond:{common:!0,size:1,steps:1e3},second:{common:!0,size:1e3,steps:60},minute:{common:!0,size:6e4,steps:60},hour:{common:!0,size:36e5,steps:24},day:{common:!0,size:864e5,steps:30},week:{common:!1,size:6048e5,steps:4},month:{common:!0,size:2628e6,steps:12},quarter:{common:!1,size:7884e6,steps:4},year:{common:!0,size:3154e7}},Ev=Object.keys(Tv);function Dv(e,t){return e-t}function Ov(e,t){if(I(t))return null;let n=e._adapter,{parser:r,round:i,isoWeekday:a}=e._parseOpts,o=t;return typeof r==`function`&&(o=r(o)),z(o)||(o=typeof r==`string`?n.parse(o,r):n.parse(o)),o===null?null:(i&&(o=i===`week`&&(Hl(a)||a===!0)?n.startOf(o,`isoWeek`,a):n.startOf(o,i)),+o)}function kv(e,t,n,r){let i=Ev.length;for(let a=Ev.indexOf(e);a<i-1;++a){let e=Tv[Ev[a]],i=e.steps?e.steps:2**53-1;if(e.common&&Math.ceil((n-t)/(i*e.size))<=r)return Ev[a]}return Ev[i-1]}function Av(e,t,n,r,i){for(let a=Ev.length-1;a>=Ev.indexOf(n);a--){let n=Ev[a];if(Tv[n].common&&e._adapter.diff(i,r,n)>=t-1)return n}return Ev[n?Ev.indexOf(n):0]}function jv(e){for(let t=Ev.indexOf(e)+1,n=Ev.length;t<n;++t)if(Tv[Ev[t]].common)return Ev[t]}function Mv(e,t,n){if(!n)e[t]=!0;else if(n.length){let{lo:r,hi:i}=tu(n,t),a=n[r]>=t?n[r]:n[i];e[a]=!0}}function Nv(e,t,n,r){let i=e._adapter,a=+i.startOf(t[0].value,r),o=t[t.length-1].value,s,c;for(s=a;s<=o;s=+i.add(s,1,r))c=n[s],c>=0&&(t[c].major=!0);return t}function Pv(e,t,n){let r=[],i={},a=t.length,o,s;for(o=0;o<a;++o)s=t[o],i[s]=o,r.push({value:s,major:!1});return a===0||!n?r:Nv(e,r,i,n)}var Fv=class extends Wm{constructor(e){super(e),this._cache={data:[],labels:[],all:[]},this._unit=`day`,this._majorUnit=void 0,this._offsets={},this._normalized=!1,this._parseOpts=void 0}init(e,t={}){let n=e.time||={},r=this._adapter=new Dp._date(e.adapters.date);r.init(t),bl(n.displayFormats,r.formats()),this._parseOpts={parser:n.parser,round:n.round,isoWeekday:n.isoWeekday},super.init(e),this._normalized=t.normalized}parse(e,t){return e===void 0?null:Ov(this,e)}beforeLayout(){super.beforeLayout(),this._cache={data:[],labels:[],all:[]}}determineDataLimits(){let e=this.options,t=this._adapter,n=e.time.unit||`day`,{min:r,max:i,minDefined:a,maxDefined:o}=this.getUserBounds();function s(e){!a&&!isNaN(e.min)&&(r=Math.min(r,e.min)),!o&&!isNaN(e.max)&&(i=Math.max(i,e.max))}(!a||!o)&&(s(this._getLabelBounds()),(e.bounds!==`ticks`||e.ticks.source!==`labels`)&&s(this.getMinMax(!1))),r=z(r)&&!isNaN(r)?r:+t.startOf(Date.now(),n),i=z(i)&&!isNaN(i)?i:+t.endOf(Date.now(),n)+1,this.min=Math.min(r,i-1),this.max=Math.max(r+1,i)}_getLabelBounds(){let e=this.getLabelTimestamps(),t=1/0,n=-1/0;return e.length&&(t=e[0],n=e[e.length-1]),{min:t,max:n}}buildTicks(){let e=this.options,t=e.time,n=e.ticks,r=n.source===`labels`?this.getLabelTimestamps():this._generate();e.bounds===`ticks`&&r.length&&(this.min=this._userMin||r[0],this.max=this._userMax||r[r.length-1]);let i=this.min,a=this.max,o=iu(r,i,a);return this._unit=t.unit||(n.autoSkip?kv(t.minUnit,this.min,this.max,this._getLabelCapacity(i)):Av(this,o.length,t.minUnit,this.min,this.max)),this._majorUnit=!n.major.enabled||this._unit===`year`?void 0:jv(this._unit),this.initOffsets(r),e.reverse&&o.reverse(),Pv(this,o,this._majorUnit)}afterAutoSkip(){this.options.offsetAfterAutoskip&&this.initOffsets(this.ticks.map(e=>+e.value))}initOffsets(e=[]){let t=0,n=0,r,i;this.options.offset&&e.length&&(r=this.getDecimalForValue(e[0]),t=e.length===1?1-r:(this.getDecimalForValue(e[1])-r)/2,i=this.getDecimalForValue(e[e.length-1]),n=e.length===1?i:(i-this.getDecimalForValue(e[e.length-2]))/2);let a=e.length<3?.5:.25;t=K(t,0,a),n=K(n,0,a),this._offsets={start:t,end:n,factor:1/(t+1+n)}}_generate(){let e=this._adapter,t=this.min,n=this.max,r=this.options,i=r.time,a=i.unit||kv(i.minUnit,t,n,this._getLabelCapacity(t)),o=B(r.ticks.stepSize,1),s=a===`week`&&i.isoWeekday,c=Hl(s)||s===!0,l={},u=t,d,f;if(c&&(u=+e.startOf(u,`isoWeek`,s)),u=+e.startOf(u,c?`day`:a),e.diff(n,t,a)>1e5*o)throw Error(t+` and `+n+` are too far apart with stepSize of `+o+` `+a);let p=r.ticks.source===`data`&&this.getDataTimestamps();for(d=u,f=0;d<n;d=+e.add(d,o,a),f++)Mv(l,d,p);return(d===n||r.bounds===`ticks`||f===1)&&Mv(l,d,p),Object.keys(l).sort(Dv).map(e=>+e)}getLabelForValue(e){let t=this._adapter,n=this.options.time;return n.tooltipFormat?t.format(e,n.tooltipFormat):t.format(e,n.displayFormats.datetime)}format(e,t){let n=this.options.time.displayFormats,r=this._unit,i=t||n[r];return this._adapter.format(e,i)}_tickFormatFunction(e,t,n,r){let i=this.options,a=i.ticks.callback;if(a)return V(a,[e,t,n],this);let o=i.time.displayFormats,s=this._unit,c=this._majorUnit,l=s&&o[s],u=c&&o[c],d=n[t],f=c&&u&&d&&d.major;return this._adapter.format(e,r||(f?u:l))}generateTickLabels(e){let t,n,r;for(t=0,n=e.length;t<n;++t)r=e[t],r.label=this._tickFormatFunction(r.value,t,e)}getDecimalForValue(e){return e===null?NaN:(e-this.min)/(this.max-this.min)}getPixelForValue(e){let t=this._offsets,n=this.getDecimalForValue(e);return this.getPixelForDecimal((t.start+n)*t.factor)}getValueForPixel(e){let t=this._offsets,n=this.getDecimalForPixel(e)/t.factor-t.end;return this.min+n*(this.max-this.min)}_getLabelSize(e){let t=this.options.ticks,n=this.ctx.measureText(e).width,r=Gl(this.isHorizontal()?t.maxRotation:t.minRotation),i=Math.cos(r),a=Math.sin(r),o=this._resolveTickFontOptions(0).size;return{w:n*i+o*a,h:n*a+o*i}}_getLabelCapacity(e){let t=this.options.time,n=t.displayFormats,r=n[t.unit]||n.millisecond,i=this._tickFormatFunction(e,0,Pv(this,[e],this._majorUnit),r),a=this._getLabelSize(i),o=Math.floor(this.isHorizontal()?this.width/a.w:this.height/a.h)-1;return o>0?o:1}getDataTimestamps(){let e=this._cache.data||[],t,n;if(e.length)return e;let r=this.getMatchingVisibleMetas();if(this._normalized&&r.length)return this._cache.data=r[0].controller.getAllParsedValues(this);for(t=0,n=r.length;t<n;++t)e=e.concat(r[t].controller.getAllParsedValues(this));return this._cache.data=this.normalize(e)}getLabelTimestamps(){let e=this._cache.labels||[],t,n;if(e.length)return e;let r=this.getLabels();for(t=0,n=r.length;t<n;++t)e.push(Ov(this,r[t]));return this._cache.labels=this._normalized?e:this.normalize(e)}normalize(e){return cu(e.sort(Dv))}};N(Fv,`id`,`time`),N(Fv,`defaults`,{bounds:`data`,adapters:{},time:{parser:!1,unit:!1,round:!1,isoWeekday:!1,minUnit:`millisecond`,displayFormats:{}},ticks:{source:`auto`,callback:!1,major:{enabled:!1}}});function Iv(e,t,n){let r=0,i=e.length-1,a,o,s,c;n?(t>=e[r].pos&&t<=e[i].pos&&({lo:r,hi:i}=nu(e,`pos`,t)),{pos:a,time:s}=e[r],{pos:o,time:c}=e[i]):(t>=e[r].time&&t<=e[i].time&&({lo:r,hi:i}=nu(e,`time`,t)),{time:a,pos:s}=e[r],{time:o,pos:c}=e[i]);let l=o-a;return l?s+(c-s)*(t-a)/l:s}var Lv=class extends Fv{constructor(e){super(e),this._table=[],this._minPos=void 0,this._tableRange=void 0}initOffsets(){let e=this._getTimestampsForTable(),t=this._table=this.buildLookupTable(e);this._minPos=Iv(t,this.min),this._tableRange=Iv(t,this.max)-this._minPos,super.initOffsets(e)}buildLookupTable(e){let{min:t,max:n}=this,r=[],i=[],a,o,s,c,l;for(a=0,o=e.length;a<o;++a)c=e[a],c>=t&&c<=n&&r.push(c);if(r.length<2)return[{time:t,pos:0},{time:n,pos:1}];for(a=0,o=r.length;a<o;++a)l=r[a+1],s=r[a-1],c=r[a],Math.round((l+s)/2)!==c&&i.push({time:c,pos:a/(o-1)});return i}_generate(){let e=this.min,t=this.max,n=super.getDataTimestamps();return(!n.includes(e)||!n.length)&&n.splice(0,0,e),(!n.includes(t)||n.length===1)&&n.push(t),n.sort((e,t)=>e-t)}_getTimestampsForTable(){let e=this._cache.all||[];if(e.length)return e;let t=this.getDataTimestamps(),n=this.getLabelTimestamps();return e=t.length&&n.length?this.normalize(t.concat(n)):t.length?t:n,e=this._cache.all=e,e}getDecimalForValue(e){return(Iv(this._table,e)-this._minPos)/this._tableRange}getValueForPixel(e){let t=this._offsets,n=this.getDecimalForPixel(e)/t.factor-t.end;return Iv(this._table,n*this._tableRange+this._minPos,!0)}};N(Lv,`id`,`timeseries`),N(Lv,`defaults`,Fv.defaults);var Rv=[Tp,hg,G_,Object.freeze({__proto__:null,CategoryScale:X_,LinearScale:ev,LogarithmicScale:sv,RadialLinearScale:wv,TimeScale:Fv,TimeSeriesScale:Lv})];Nh.register(...Rv);var zv=function(){if(typeof window<`u`){if(window.devicePixelRatio)return window.devicePixelRatio;var e=window.screen;if(e)return(e.deviceXDPI||1)/(e.logicalXDPI||1)}return 1}(),Bv={toTextLines:function(e){var t=[],n;for(e=[].concat(e);e.length;)n=e.pop(),typeof n==`string`?t.unshift.apply(t,n.split(`
`)):Array.isArray(n)?e.push.apply(e,n):I(e)||t.unshift(``+n);return t},textSize:function(e,t,n){var r=[].concat(t),i=r.length,a=e.font,o=0,s;for(e.font=n.string,s=0;s<i;++s)o=Math.max(e.measureText(r[s]).width,o);return e.font=a,{height:i*n.lineHeight,width:o}},bound:function(e,t,n){return Math.max(e,Math.min(t,n))},arrayDiff:function(e,t){var n=e.slice(),r=[],i,a,o,s;for(i=0,o=t.length;i<o;++i)s=t[i],a=n.indexOf(s),a===-1?r.push([s,1]):n.splice(a,1);for(i=0,o=n.length;i<o;++i)r.push([n[i],-1]);return r},rasterize:function(e){return Math.round(e*zv)/zv}};function Vv(e,t){var n=t.x,r=t.y;if(n===null)return{x:0,y:-1};if(r===null)return{x:1,y:0};var i=e.x-n,a=e.y-r,o=Math.sqrt(i*i+a*a);return{x:o?i/o:0,y:o?a/o:-1}}function Hv(e,t,n,r,i){switch(i){case`center`:n=r=0;break;case`bottom`:n=0,r=1;break;case`right`:n=1,r=0;break;case`left`:n=-1,r=0;break;case`top`:n=0,r=-1;break;case`start`:n=-n,r=-r;break;case`end`:break;default:i*=Math.PI/180,n=Math.cos(i),r=Math.sin(i)}return{x:e,y:t,vx:n,vy:r}}var Uv=0,Wv=1,Gv=2,Kv=4,qv=8;function Jv(e,t,n){var r=Uv;return e<n.left?r|=Wv:e>n.right&&(r|=Gv),t<n.top?r|=qv:t>n.bottom&&(r|=Kv),r}function Yv(e,t){for(var n=e.x0,r=e.y0,i=e.x1,a=e.y1,o=Jv(n,r,t),s=Jv(i,a,t),c,l,u;!(!(o|s)||o&s);)c=o||s,c&qv?(l=n+(i-n)*(t.top-r)/(a-r),u=t.top):c&Kv?(l=n+(i-n)*(t.bottom-r)/(a-r),u=t.bottom):c&Gv?(u=r+(a-r)*(t.right-n)/(i-n),l=t.right):c&Wv&&(u=r+(a-r)*(t.left-n)/(i-n),l=t.left),c===o?(n=l,r=u,o=Jv(n,r,t)):(i=l,a=u,s=Jv(i,a,t));return{x0:n,x1:i,y0:r,y1:a}}function Xv(e,t){var n=t.anchor,r=e,i,a;return t.clamp&&(r=Yv(r,t.area)),n===`start`?(i=r.x0,a=r.y0):n===`end`?(i=r.x1,a=r.y1):(i=(r.x0+r.x1)/2,a=(r.y0+r.y1)/2),Hv(i,a,e.vx,e.vy,t.align)}var Zv={arc:function(e,t){var n=(e.startAngle+e.endAngle)/2,r=Math.cos(n),i=Math.sin(n),a=e.innerRadius,o=e.outerRadius;return Xv({x0:e.x+r*a,y0:e.y+i*a,x1:e.x+r*o,y1:e.y+i*o,vx:r,vy:i},t)},point:function(e,t){var n=Vv(e,t.origin),r=n.x*e.options.radius,i=n.y*e.options.radius;return Xv({x0:e.x-r,y0:e.y-i,x1:e.x+r,y1:e.y+i,vx:n.x,vy:n.y},t)},bar:function(e,t){var n=Vv(e,t.origin),r=e.x,i=e.y,a=0,o=0;return e.horizontal?(r=Math.min(e.x,e.base),a=Math.abs(e.base-e.x)):(i=Math.min(e.y,e.base),o=Math.abs(e.base-e.y)),Xv({x0:r,y0:i+o,x1:r+a,y1:i,vx:n.x,vy:n.y},t)},fallback:function(e,t){var n=Vv(e,t.origin);return Xv({x0:e.x,y0:e.y,x1:e.x+(e.width||0),y1:e.y+(e.height||0),vx:n.x,vy:n.y},t)}},Qv=Bv.rasterize;function $v(e){var t=e.borderWidth||0,n=e.padding,r=e.size.height,i=e.size.width,a=-i/2,o=-r/2;return{frame:{x:a-n.left-t,y:o-n.top-t,w:i+n.width+t*2,h:r+n.height+t*2},text:{x:a,y:o,w:i,h:r}}}function ey(e,t){var n=t.chart.getDatasetMeta(t.datasetIndex).vScale;if(!n)return null;if(n.xCenter!==void 0&&n.yCenter!==void 0)return{x:n.xCenter,y:n.yCenter};var r=n.getBasePixel();return e.horizontal?{x:r,y:null}:{x:null,y:r}}function ty(e){return e instanceof Uh?Zv.arc:e instanceof ig?Zv.point:e instanceof mg?Zv.bar:Zv.fallback}function ny(e,t,n,r,i,a){var o=Math.PI/2;if(a){var s=Math.min(a,i/2,r/2),c=t+s,l=n+s,u=t+r-s,d=n+i-s;e.moveTo(t,l),c<u&&l<d?(e.arc(c,l,s,-Math.PI,-o),e.arc(u,l,s,-o,0),e.arc(u,d,s,0,o),e.arc(c,d,s,o,Math.PI)):c<u?(e.moveTo(c,n),e.arc(u,l,s,-o,o),e.arc(c,l,s,o,Math.PI+o)):l<d?(e.arc(c,l,s,-Math.PI,0),e.arc(c,d,s,0,Math.PI)):e.arc(c,l,s,-Math.PI,Math.PI),e.closePath(),e.moveTo(t,n)}else e.rect(t,n,r,i)}function ry(e,t,n){var r=n.backgroundColor,i=n.borderColor,a=n.borderWidth;!r&&(!i||!a)||(e.beginPath(),ny(e,Qv(t.x)+a/2,Qv(t.y)+a/2,Qv(t.w)-a,Qv(t.h)-a,n.borderRadius),e.closePath(),r&&(e.fillStyle=r,e.fill()),i&&a&&(e.strokeStyle=i,e.lineWidth=a,e.lineJoin=`miter`,e.stroke()))}function iy(e,t,n){var r=n.lineHeight,i=e.w,a=e.x,o=e.y+r/2;return t===`center`?a+=i/2:(t===`end`||t===`right`)&&(a+=i),{h:r,w:i,x:a,y:o}}function ay(e,t,n){var r=e.shadowBlur,i=n.stroked,a=Qv(n.x),o=Qv(n.y),s=Qv(n.w);i&&e.strokeText(t,a,o,s),n.filled&&(r&&i&&(e.shadowBlur=0),e.fillText(t,a,o,s),r&&i&&(e.shadowBlur=r))}function oy(e,t,n,r){var i=r.textAlign,a=r.color,o=!!a,s=r.font,c=t.length,l=r.textStrokeColor,u=r.textStrokeWidth,d=l&&u,f;if(!(!c||!o&&!d))for(n=iy(n,i,s),e.font=s.string,e.textAlign=i,e.textBaseline=`middle`,e.shadowBlur=r.textShadowBlur,e.shadowColor=r.textShadowColor,o&&(e.fillStyle=a),d&&(e.lineJoin=`round`,e.lineWidth=u,e.strokeStyle=l),f=0,c=t.length;f<c;++f)ay(e,t[f],{stroked:d,filled:o,w:n.w,x:n.x,y:n.y+n.h*f})}var sy=function(e,t,n,r){var i=this;i._config=e,i._index=r,i._model=null,i._rects=null,i._ctx=t,i._el=n};yl(sy.prototype,{_modelize:function(e,t,n,r){var i=this,a=i._index,o=J(Y([n.font,{}],r,a)),s=Y([n.color,q.color],r,a);return{align:Y([n.align,`center`],r,a),anchor:Y([n.anchor,`center`],r,a),area:r.chart.chartArea,backgroundColor:Y([n.backgroundColor,null],r,a),borderColor:Y([n.borderColor,null],r,a),borderRadius:Y([n.borderRadius,0],r,a),borderWidth:Y([n.borderWidth,0],r,a),clamp:Y([n.clamp,!1],r,a),clip:Y([n.clip,!1],r,a),color:s,display:e,font:o,lines:t,offset:Y([n.offset,4],r,a),opacity:Y([n.opacity,1],r,a),origin:ey(i._el,r),padding:ld(Y([n.padding,4],r,a)),positioner:ty(i._el),rotation:Y([n.rotation,0],r,a)*(Math.PI/180),size:Bv.textSize(i._ctx,t,o),textAlign:Y([n.textAlign,`start`],r,a),textShadowBlur:Y([n.textShadowBlur,0],r,a),textShadowColor:Y([n.textShadowColor,s],r,a),textStrokeColor:Y([n.textStrokeColor,s],r,a),textStrokeWidth:Y([n.textStrokeWidth,0],r,a)}},update:function(e){var t=this,n=null,r=null,i=t._index,a=t._config,o,s,c,l=Y([a.display,!0],e,i);l&&(o=e.dataset.data[i],s=B(V(a.formatter,[o,e]),o),c=I(s)?[]:Bv.toTextLines(s),c.length&&(n=t._modelize(l,c,a,e),r=$v(n))),t._model=n,t._rects=r},geometry:function(){return this._rects?this._rects.frame:{}},rotation:function(){return this._model?this._model.rotation:0},visible:function(){return this._model&&this._model.opacity},model:function(){return this._model},draw:function(e,t){var n=this,r=e.ctx,i=n._model,a=n._rects,o;this.visible()&&(r.save(),i.clip&&(o=i.area,r.beginPath(),r.rect(o.left,o.top,o.right-o.left,o.bottom-o.top),r.clip()),r.globalAlpha=Bv.bound(0,i.opacity,1),r.translate(Qv(t.x),Qv(t.y)),r.rotate(i.rotation),ry(r,a.frame,i),oy(r,i.lines,a.text,i),r.restore())}});var cy=-(2**53-1)||-9007199254740991,ly=2**53-1||9007199254740991;function uy(e,t,n){var r=Math.cos(n),i=Math.sin(n),a=t.x,o=t.y;return{x:a+r*(e.x-a)-i*(e.y-o),y:o+i*(e.x-a)+r*(e.y-o)}}function dy(e,t){var n=ly,r=cy,i=t.origin,a,o,s,c,l;for(a=0;a<e.length;++a)o=e[a],s=o.x-i.x,c=o.y-i.y,l=t.vx*s+t.vy*c,n=Math.min(n,l),r=Math.max(r,l);return{min:n,max:r}}function fy(e,t){var n=t.x-e.x,r=t.y-e.y,i=Math.sqrt(n*n+r*r);return{vx:(t.x-e.x)/i,vy:(t.y-e.y)/i,origin:e,ln:i}}var py=function(){this._rotation=0,this._rect={x:0,y:0,w:0,h:0}};yl(py.prototype,{center:function(){var e=this._rect;return{x:e.x+e.w/2,y:e.y+e.h/2}},update:function(e,t,n){this._rotation=n,this._rect={x:t.x+e.x,y:t.y+e.y,w:t.w,h:t.h}},contains:function(e){var t=this,n=1,r=t._rect;return e=uy(e,t.center(),-t._rotation),!(e.x<r.x-n||e.y<r.y-n||e.x>r.x+r.w+n*2||e.y>r.y+r.h+n*2)},intersects:function(e){var t=this._points(),n=e._points(),r=[fy(t[0],t[1]),fy(t[0],t[3])],i,a,o;for(this._rotation!==e._rotation&&r.push(fy(n[0],n[1]),fy(n[0],n[3])),i=0;i<r.length;++i)if(a=dy(t,r[i]),o=dy(n,r[i]),a.max<o.min||o.max<a.min)return!1;return!0},_points:function(){var e=this,t=e._rect,n=e._rotation,r=e.center();return[uy({x:t.x,y:t.y},r,n),uy({x:t.x+t.w,y:t.y},r,n),uy({x:t.x+t.w,y:t.y+t.h},r,n),uy({x:t.x,y:t.y+t.h},r,n)]}});function my(e,t,n){var r=t.positioner(e,t),i=r.vx,a=r.vy;if(!i&&!a)return{x:r.x,y:r.y};var o=n.w,s=n.h,c=t.rotation,l=Math.abs(o/2*Math.cos(c))+Math.abs(s/2*Math.sin(c)),u=Math.abs(o/2*Math.sin(c))+Math.abs(s/2*Math.cos(c)),d=1/Math.max(Math.abs(i),Math.abs(a));return l*=i*d,u*=a*d,l+=t.offset*i,u+=t.offset*a,{x:r.x+l,y:r.y+u}}function hy(e,t){var n,r,i,a;for(n=e.length-1;n>=0;--n)for(i=e[n].$layout,r=n-1;r>=0&&i._visible;--r)a=e[r].$layout,a._visible&&i._box.intersects(a._box)&&t(i,a);return e}function gy(e){var t,n,r,i,a,o,s;for(t=0,n=e.length;t<n;++t)r=e[t],i=r.$layout,i._visible&&(s=new Proxy(r._el,{get:(e,t)=>e.getProps([t],!0)[t]}),a=r.geometry(),o=my(s,r.model(),a),i._box.update(o,a,r.rotation()));return hy(e,function(e,t){var n=e._hidable,r=t._hidable;n&&r||r?t._visible=!1:n&&(e._visible=!1)})}var _y={prepare:function(e){var t=[],n,r,i,a,o;for(n=0,i=e.length;n<i;++n)for(r=0,a=e[n].length;r<a;++r)o=e[n][r],t.push(o),o.$layout={_box:new py,_hidable:!1,_visible:!0,_set:n,_idx:o._index};return t.sort(function(e,t){var n=e.$layout,r=t.$layout;return n._idx===r._idx?r._set-n._set:r._idx-n._idx}),this.update(t),t},update:function(e){var t=!1,n,r,i,a,o;for(n=0,r=e.length;n<r;++n)i=e[n],a=i.model(),o=i.$layout,o._hidable=a&&a.display===`auto`,o._visible=i.visible(),t|=o._hidable;t&&gy(e)},lookup:function(e,t){var n,r;for(n=e.length-1;n>=0;--n)if(r=e[n].$layout,r&&r._visible&&r._box.contains(t))return e[n];return null},draw:function(e,t){var n,r,i,a,o,s;for(n=0,r=t.length;n<r;++n)i=t[n],a=i.$layout,a._visible&&(o=i.geometry(),s=my(i._el,i.model(),o),a._box.update(s,o,i.rotation()),i.draw(e,s))}},vy={align:`center`,anchor:`center`,backgroundColor:null,borderColor:null,borderRadius:0,borderWidth:0,clamp:!1,clip:!1,color:void 0,display:!0,font:{family:void 0,lineHeight:1.2,size:void 0,style:void 0,weight:null},formatter:function(e){if(I(e))return null;var t=e,n,r,i;if(R(e)){if(!I(e.label))t=e.label;else if(!I(e.r))t=e.r;else for(t=``,n=Object.keys(e),i=0,r=n.length;i<r;++i)t+=(i===0?``:`, `)+n[i]+`: `+e[n[i]]}return``+t},labels:void 0,listeners:{},offset:4,opacity:1,padding:{top:4,right:4,bottom:4,left:4},rotation:0,textAlign:`start`,textStrokeColor:void 0,textStrokeWidth:0,textShadowBlur:0,textShadowColor:void 0},yy=`$datalabels`,by=`$default`;function xy(e,t){var n=e.datalabels,r={},i=[],a,o;return n===!1?null:(n===!0&&(n={}),t=yl({},[t,n]),a=t.labels||{},o=Object.keys(a),delete t.labels,o.length?o.forEach(function(e){a[e]&&i.push(yl({},[t,a[e],{_key:e}]))}):i.push(t),r=i.reduce(function(e,t){return H(t.listeners||{},function(n,r){e[r]=e[r]||{},e[r][t._key||by]=n}),delete t.listeners,e},{}),{labels:i,listeners:r})}function Sy(e,t,n,r){if(t){var i=n.$context,a=n.$groups,o;t[a._set]&&(o=t[a._set][a._key],o&&V(o,[i,r])===!0&&(e[yy]._dirty=!0,n.update(i)))}}function Cy(e,t,n,r,i){var a,o;!n&&!r||(n?r?n!==r&&(o=a=!0):o=!0:a=!0,o&&Sy(e,t.leave,n,i),a&&Sy(e,t.enter,r,i))}function wy(e,t){var n=e[yy],r=n._listeners,i,a;if(!(!r.enter&&!r.leave)){if(t.type===`mousemove`)a=_y.lookup(n._labels,t);else if(t.type!==`mouseout`)return;i=n._hovered,n._hovered=a,Cy(e,r,i,a,t)}}function Ty(e,t){var n=e[yy],r=n._listeners.click,i=r&&_y.lookup(n._labels,t);i&&Sy(e,r,i,t)}var Ey={id:`datalabels`,defaults:vy,beforeInit:function(e){e[yy]={_actives:[]}},beforeUpdate:function(e){var t=e[yy];t._listened=!1,t._listeners={},t._datasets=[],t._labels=[]},afterDatasetUpdate:function(e,t,n){var r=t.index,i=e[yy],a=i._datasets[r]=[],o=e.isDatasetVisible(r),s=e.data.datasets[r],c=xy(s,n),l=t.meta.data||[],u=e.ctx,d,f,p,m,h,g,_,v;for(u.save(),d=0,p=l.length;d<p;++d)if(_=l[d],_[yy]=[],o&&_&&e.getDataVisibility(d)&&!_.skip)for(f=0,m=c.labels.length;f<m;++f)h=c.labels[f],g=h._key,v=new sy(h,u,_,d),v.$groups={_set:r,_key:g||by},v.$context={active:!1,chart:e,dataIndex:d,dataset:s,datasetIndex:r},v.update(v.$context),_[yy].push(v),a.push(v);u.restore(),yl(i._listeners,c.listeners,{merger:function(e,n,r){n[e]=n[e]||{},n[e][t.index]=r[e],i._listened=!0}})},afterUpdate:function(e){e[yy]._labels=_y.prepare(e[yy]._datasets)},afterDatasetsDraw:function(e){_y.draw(e,e[yy]._labels)},beforeEvent:function(e,t){if(e[yy]._listened){var n=t.event;switch(n.type){case`mousemove`:case`mouseout`:wy(e,n);break;case`click`:Ty(e,n)}}},afterEvent:function(e){var t=e[yy],n=t._actives,r=t._actives=e.getActiveElements(),i=Bv.arrayDiff(n,r),a,o,s,c,l,u,d;for(a=0,o=i.length;a<o;++a)if(l=i[a],l[1])for(d=l[0].element[yy]||[],s=0,c=d.length;s<c;++s)u=d[s],u.$context.active=l[1]===1,u.update(u.$context);(t._dirty||i.length)&&(_y.update(t._labels),e.render()),delete t._dirty}},Dy=()=>O`
    <style>
      .chart-skeleton {
        display: flex;
        gap: 1rem;
        height: 100%;
        width: 100%;
      }

      .y-axis {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding-bottom: 2.25rem; /* Space for x-axis labels and gap */
      }

      .y-label {
        height: 1rem;
        border-radius: 0.25rem;
        background-color: var(--bim-ui_bg-contrast-10);
        animation: bar-loading 1s linear infinite alternate;
      }

      .main-chart-area {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .bars-container {
        display: flex;
        justify-content: space-around;
        align-items: flex-end;
        flex-grow: 1;
        gap: 0.5rem;
        padding: 0 1rem;
        border-left: 2px solid var(--bim-ui_bg-contrast-20);
        border-bottom: 2px solid var(--bim-ui_bg-contrast-20);
        position: relative;
      }

      .grid-lines {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .grid-line {
        width: 100%;
        height: 1px;
        background-color: var(--bim-ui_bg-contrast-10);
        opacity: 0.5;
      }

      .bar {
        flex: 1;
        background-color: var(--bim-ui_bg-contrast-10);
        animation: bar-loading 1s linear infinite alternate;
        z-index: 1; /* To appear above grid lines */
      }

      .x-axis {
        display: flex;
        justify-content: space-around;
        gap: 0.5rem;
        padding: 0 1rem;
        height: 1.25rem;
        margin-top: 1rem;
      }

      .x-label {
        flex: 1;
        height: 100%;
        border-radius: 0.25rem;
        background-color: var(--bim-ui_bg-contrast-10);
        animation: bar-loading 1s linear infinite alternate;
      }

      @keyframes bar-loading {
        0% {
          background-color: var(--bim-ui_bg-contrast-10);
        }
        100% {
          background-color: var(--bim-ui_bg-contrast-20);
        }
      }
    </style>
    <div class="chart-skeleton">
      <div class="y-axis">
        <div class="y-label" style="width: 2.5rem"></div>
        <div class="y-label" style="width: 1.5rem"></div>
        <div class="y-label" style="width: 2rem"></div>
        <div class="y-label" style="width: 1rem"></div>
      </div>
      <div class="main-chart-area">
        <div class="bars-container">
          <div class="grid-lines">
            <div class="grid-line"></div>
            <div class="grid-line"></div>
            <div class="grid-line"></div>
            <div class="grid-line"></div>
            <div class="grid-line"></div>
          </div>
          <div class="bar" style="height: 60%"></div>
          <div class="bar" style="height: 30%"></div>
          <div class="bar" style="height: 80%"></div>
          <div class="bar" style="height: 50%"></div>
          <div class="bar" style="height: 90%"></div>
        </div>
        <div class="x-axis">
          <div class="x-label"></div>
          <div class="x-label"></div>
          <div class="x-label"></div>
          <div class="x-label"></div>
          <div class="x-label"></div>
        </div>
      </div>
    </div>
  `,Oy=Object.defineProperty,X=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&Oy(t,n,i),i};Nh.register(Ey);var ky=class extends A{constructor(){super(...arguments),this.colors=Array.from({length:20},(e,t)=>this.generateColor(t)),this.type=null,this.xBeginAtZero=!0,this.yBeginAtZero=!0,this.indexAxis=`x`,this.loading=!1,this.hoverBorderColor=`#ffffffff`,this.linePointStyle=`circle`,this.pointRadius=10,this.lineFill=!1,this.transparentBackground=!0,this.displayLabels=!0,this.dataLabelsColor=`#ffffffff`,this.smoothLine=!1,this.borderColor=`#000000`,this.inputData={labels:[],datasets:{}},this.colorfulBars=!1,this._errorLoading=!1,this._options={responsive:!1,maintainAspectRatio:!1,plugins:{legend:{position:`bottom`,display:!1},datalabels:{display:this.displayLabels,color:this.dataLabelsColor,font:{weight:`bold`,family:`'Plus Jakarta Sans', sans-serif, 'Fira Code'`}},title:{text:this.label,display:!0}},elements:{line:{tension:this.smoothLine?.4:0}}},this._chartCfg={type:this.type,data:{labels:[],datasets:[]},options:this._options},this._canvas=document.createElement(`canvas`)}generateColor(e){return`hsl(${e*137.5%360}, 70%, 50%)`}async loadData(e=!1){if(this.inputData.labels.length!==0&&!e||!this.loadFunction)return!1;this.loading=!0;try{let e=await this.loadFunction();return this.inputData=e,this.loading=!1,this._errorLoading=!1,this.dispatchEvent(new Event(`data-loaded`)),!0}catch(e){if(this.loading=!1,this.inputData.labels.length!==0)return!1;let t=this.querySelector(`[slot='error-loading']`)?.querySelector(`[data-chart-element='error-message']`);return e instanceof Error&&t&&e.message.trim()!==``&&(t.textContent=e.message),this._errorLoading=!0,!1}}get data(){return this.chart.data}_getDefaultColors(e){let t=Object.keys(e.datasets).length;return Array.from({length:t},(e,t)=>this.generateColor(t))}isScatterData(e){return`x`in e&&`y`in e}parseInputData(e){let{labels:t}=e,n=this.colors.length<Object.keys(e.datasets).length?this._getDefaultColors(e):this.colors;return{labels:t,datasets:Object.entries(e.datasets).map(([e,t],r)=>{let i=n[r%n.length],a=this.type===`scatter`||this.type===`bubble`,o=this.type===`bar`,s;return s=a||o&&!this.colorfulBars?this.transparentBackground?this.transparentize(i):i:this.transparentBackground?n.map(e=>this.transparentize(e)):n,{label:e,data:Object.values(t).map(e=>{if(a){if(this.isScatterData(e)){let t={x:e.x,y:e.y};return this.type===`bubble`&&e.r!==void 0&&(t.r=e.r),t}return{x:0,y:0}}return this.isScatterData(e)?0:e.value}),backgroundColor:s,borderColor:a?void 0:this.borderColor,pointStyle:a?void 0:this.linePointStyle,pointRadius:a?void 0:this.pointRadius,fill:a?void 0:this.lineFill,hoverBorderColor:a?void 0:this.hoverBorderColor}})}}transparentize(e,t){let n=t===void 0?.5:1-t;return ll(e).alpha(n).rgbString()}updateFromTable(e){let t=e.data,n=[],r={},i=[],a=0,o=`dataset_${a}`;a++;for(let e of t){let{data:t}=e,r,a;for(let[e,n]of Object.entries(t))e===`name`&&typeof n==`string`?r=n:typeof n==`number`&&(a=n);r&&a!==void 0&&(n.push(r),i.push({value:a}))}r[o]=i,this.inputData={labels:n,datasets:r}}highlight(e){if(!this.chart)return;let t=[],n=Object.values(this.inputData.datasets);for(let r in n){let i=n[r];for(let n in i){let a=i[n];if(!e(a))continue;let o={datasetIndex:Number(r),index:Number(n)};t.push(o)}}this.chart.setActiveElements(t),this.chart.update()}filterByValue(e){if(!this.chart)return;let t=structuredClone(this.inputData);for(let n of Object.values(t.datasets))for(let t in n)e(n[t])||delete n[t];this.chart.data=this.parseInputData(t),this.chart.update()}triggerFilter(e){this.dispatchEvent(new CustomEvent(`labelfilter`,{detail:e}))}filterByLabel(e){if(!this.chart||!this.chart.data.labels)return;let t=this.chart.data.labels.indexOf(e);if(t===-1)return;this.chart.toggleDataVisibility(t);let n=this.chart.data.labels.filter((e,t)=>this.chart.getDataVisibility(t)),r=this.chart.data.labels.filter((e,t)=>!this.chart.getDataVisibility(t));this.chart.update(),this.triggerFilter({label:e,visible:n,hidden:r})}reset(){this.chart.data=this.parseInputData(this.inputData),this.chart.update()}updated(e){var t,n;if(this.chart){if(e.has(`type`)||e.has(`indexAxis`)||e.has(`linePointStyle`)||e.has(`pointRadius`)||e.has(`lineFill`)){this.chart.destroy();let e=structuredClone(this._options);this.label!==void 0&&(e.plugins||={},e.plugins.title={text:this.label,display:!0}),this.indexAxis!==void 0&&(e.indexAxis=this.indexAxis),this.chart=new Nh(this._canvas,{type:this.type,data:this.parseInputData(this.inputData),options:e})}else for(let r of e.keys())switch(r){case`label`:this.chart.options.plugins.title={text:this.label,display:this.label!==void 0};break;case`inputData`:this.chart.data=this.parseInputData(this.inputData);break;case`smoothLine`:this.chart.options.elements&&this.chart.options.elements.line&&(this.chart.options.elements.line.tension=this.smoothLine?.4:0);break;case`dataLabelsColor`:this.chart.options.plugins.datalabels.color=this.dataLabelsColor;break;case`displayLabels`:this.chart.options.plugins.datalabels.display=this.displayLabels;break;case`borderColor`:this.chart.data.datasets.forEach(e=>{e.borderColor=this.borderColor});break;case`xStacked`:this.type===`bar`&&(t=this.chart.options.scales)!=null&&t.x&&Object.assign(this.chart.options.scales.x,{stacked:this.xStacked});break;case`yStacked`:this.type===`bar`&&(n=this.chart.options.scales)!=null&&n.y&&Object.assign(this.chart.options.scales.y,{stacked:this.yStacked});break;case`transparentBackground`:{let e=this.colors||this._getDefaultColors(this.inputData),t=this.type===`scatter`||this.type===`bubble`,n=this.type===`bar`;this.chart.data.datasets.forEach((r,i)=>{let a=e[i%e.length],o;o=t||n&&!this.colorfulBars?this.transparentBackground?this.transparentize(a):a:this.transparentBackground?e.map(e=>this.transparentize(e)):e,r.backgroundColor=o});break}case`colors`:{let e=this.colors||this._getDefaultColors(this.inputData),t=this.type===`scatter`||this.type===`bubble`,n=this.type===`bar`;this.chart.data.datasets.forEach((r,i)=>{let a=e[i%e.length],o;o=t||n&&!this.colorfulBars?this.transparentBackground?this.transparentize(a):a:this.transparentBackground?e.map(e=>this.transparentize(e)):e,r.backgroundColor=o});break}}this.chart.update(),this.chart.resize()}}updateChartTitle(){if(this.chart)try{let e=this.chart.options;e&&e.plugins&&e.plugins.title&&(e.plugins.title.text=this.label,this.chart.update())}catch(e){console.warn(`Chart: failed to update chart title`,e)}}firstUpdated(){this.chart=new Nh(this._canvas,this._chartCfg);let e=this.renderRoot.querySelector(`.parent`);e&&new ResizeObserver(()=>this.chart.resize()).observe(e),this._canvas.onclick=e=>{if(this.inputData.labels.length===0)return;let t=this.chart.getElementsAtEventForMode(e,`point`,{intersect:!0},!1);for(let e of t){let{index:t,datasetIndex:n}=e,r=this.inputData.labels[t],i=[];for(let e of Object.values(this.inputData.datasets))i.push(e[t]);let a={datasetIndex:n,index:t,values:i,label:r,value:{value:0}},o=()=>Object.values(this.inputData.datasets)?.[n]?.[t];Object.defineProperty(a,"value",{get:()=>o()}),this.dispatchEvent(new CustomEvent(`sectionclick`,{detail:a}))}}}render(){if(this.loading)return Dy();if(this._errorLoading)return O`<slot name="error-loading"></slot>`;let e;return this.inputData.labels.length===0?(this._canvas.style.display=`none`,e=O`
        <slot name="missing-data">
          <bim-label>No data to display in this chart.</bim-label>
        </slot>
      `):this._canvas.style.display=`block`,O`
      <div class="parent">
        ${e} ${this._canvas}
        <slot name="labels"></slot>
      </div>
    `}};ky.styles=o`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-width: 10rem;
      min-height: 10rem;
      padding: 1rem;
      box-sizing: border-box;
      flex: 1;
    }

    .parent {
      position: relative;
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `;var Z=ky;X([j({type:Array})],Z.prototype,`colors`),X([j({type:String,reflect:!0})],Z.prototype,`type`),X([j({type:Boolean,reflect:!0,attribute:`x-zero`})],Z.prototype,`xBeginAtZero`),X([j({type:Boolean,reflect:!0,attribute:`y-zero`})],Z.prototype,`yBeginAtZero`),X([j({type:String,reflect:!0,attribute:`index-axis`})],Z.prototype,`indexAxis`),X([j({type:Boolean,reflect:!0,attribute:`x-stacked`})],Z.prototype,`xStacked`),X([j({type:Boolean,reflect:!0,attribute:`y-stacked`})],Z.prototype,`yStacked`),X([j({type:Boolean,reflect:!0})],Z.prototype,`loading`),X([j({type:String,reflect:!1})],Z.prototype,`hoverBorderColor`),X([j({type:String,reflect:!0})],Z.prototype,`label`),X([j({type:String,reflect:!0,attribute:`point-style`})],Z.prototype,`linePointStyle`),X([j({type:Number,reflect:!0})],Z.prototype,`pointRadius`),X([j({type:String,reflect:!0})],Z.prototype,`lineFill`),X([j({type:Boolean,reflect:!0,attribute:`transparent-background`})],Z.prototype,`transparentBackground`),X([j({type:Boolean,reflect:!0})],Z.prototype,`displayLabels`),X([j({type:String,reflect:!0,attribute:`data-label-color`})],Z.prototype,`dataLabelsColor`),X([j({type:Boolean,reflect:!0})],Z.prototype,`smoothLine`),X([j({type:String,reflect:!0})],Z.prototype,`borderColor`),X([j({type:Object,attribute:!1})],Z.prototype,`inputData`),X([j({type:Boolean,reflect:!0})],Z.prototype,`colorfulBars`),X([M()],Z.prototype,`_errorLoading`);var Ay=Object.defineProperty,jy=Object.getOwnPropertyDescriptor,My=(e,t,n,r)=>{for(var i=r>1?void 0:r?jy(t,n):t,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=(r?o(t,n,i):o(i))||i);return r&&i&&Ay(t,n,i),i},Ny=[`top`,`top-start`,`top-end`,`right`,`right-start`,`right-end`,`bottom`,`bottom-start`,`bottom-end`,`left`,`left-start`,`left-end`],Py,Fy=(Py=class extends A{constructor(){super(...arguments),this.visible=!1,this._previousContainer=null,this._hostParent=null,this._scheduleShow=()=>{clearTimeout(this.timeoutId),this.timeoutId=setTimeout(()=>{this.visible=!0},this.timeout??800)},this._cancelAndHide=()=>{clearTimeout(this.timeoutId),this.visible=!1},this._onEscape=e=>{e.key===`Escape`&&(this.visible=!1)}}static get container(){return Py._container||(Py._container=document.createElement(`div`),Py._container.style.cssText=`
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        overflow: visible;
        pointer-events: none;
        z-index: var(--bim-tooltip--z, 9999);
      `),Py._container}set timeout(e){this._timeout=e===void 0||!Number.isFinite(e)?void 0:Math.max(0,e)}get timeout(){return this._timeout}set placement(e){if(e!==void 0&&!Ny.includes(e)){console.warn(`[bim-tooltip] Invalid placement "${e}". Ignored.`),this._placement=void 0;return}this._placement=e}get placement(){return this._placement}async _show(){if(!Py.container.isConnected){let e=document.querySelector(`[data-context-dialog]`);e?e.append(Py.container):document.body.append(Py.container)}this._previousContainer=this._hostParent,Py.container.style.top=`${window.scrollY||document.documentElement.scrollTop}px`,Py.container.append(this),this._escapeListener||(this._escapeListener=this._onEscape,document.addEventListener(`keydown`,this._escapeListener));try{await this._updatePosition()}catch(e){console.error(`[bim-tooltip] Failed to position tooltip.`,e)}}_hide(){this._escapeListener&&=(document.removeEventListener(`keydown`,this._escapeListener),void 0),this._previousContainer&&=(this._previousContainer.append(this),null),Py.container.children.length===0&&Py.container.parentElement&&(Py.container.remove(),Py._container=null)}async _updatePosition(){let e=this._previousContainer;if(!e)return;this.style.display=`block`,this.style.visibility=`hidden`,this.offsetHeight;let t=getComputedStyle(e).display,n=[na(10),no(),to({padding:8})];t.startsWith(`inline`)&&n.push(ro());let{x:r,y:i}=await io(e,this,{placement:this.placement,middleware:n});this.style.left=`${r}px`,this.style.top=`${i}px`,this.style.removeProperty(`display`),this.style.removeProperty(`visibility`)}updated(e){e.has(`visible`)&&(this.hidden=!this.visible,this.visible?this._show():this._hide())}connectedCallback(){if(super.connectedCallback(),this._hostParent)return;let e=this.parentElement;e&&(this._hostParent=e,this.id||=`bim-tooltip-${Ur.newRandomId()}`,this._hostParent.setAttribute(`aria-describedby`,this.id),this._hostParent.addEventListener(`mouseenter`,this._scheduleShow),this._hostParent.addEventListener(`mouseleave`,this._cancelAndHide),this._hostParent.addEventListener(`focus`,this._scheduleShow),this._hostParent.addEventListener(`blur`,this._cancelAndHide))}disconnectedCallback(){super.disconnectedCallback(),queueMicrotask(()=>{this.isConnected||(clearTimeout(this.timeoutId),this._escapeListener&&=(document.removeEventListener(`keydown`,this._escapeListener),void 0),this._hostParent&&=(this._hostParent.removeEventListener(`mouseenter`,this._scheduleShow),this._hostParent.removeEventListener(`mouseleave`,this._cancelAndHide),this._hostParent.removeEventListener(`focus`,this._scheduleShow),this._hostParent.removeEventListener(`blur`,this._cancelAndHide),this._hostParent.removeAttribute(`aria-describedby`),null))})}render(){return O`<bim-label role="tooltip" aria-live="polite"><slot></slot></bim-label>`}},Py.styles=o`
    :host {
      position: absolute;
      background: var(--bim-ui_bg-contrast-10);
      border-radius: 4px;
      box-shadow: var(--bim-tooltip--shadow, 0 0 10px 3px rgba(0, 0, 0, 0.2));
      padding: var(--bim-tooltip--p, 0.75rem);
      max-width: var(--bim-tooltip--maxw, 20rem);
      font-size: var(--bim-tooltip--fs, var(--bim-ui_size-xs, 0.875rem));
      display: none;
    }
    :host([visible]) {
      display: flex;
    }
  `,Py._container=null,Py);My([j({type:Boolean,reflect:!0})],Fy.prototype,`visible`,2),My([j({type:Number,reflect:!0})],Fy.prototype,`timeout`,1),My([j({type:String,reflect:!0})],Fy.prototype,`placement`,1);var Iy=Fy,Ly=Object.defineProperty,Ry=Object.getOwnPropertyDescriptor,Q=(e,t,n,r)=>{for(var i=r>1?void 0:r?Ry(t,n):t,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=(r?o(t,n,i):o(i))||i);return r&&i&&Ly(t,n,i),i},zy=class extends A{constructor(){super(...arguments),this.min=0,this.max=100,this.step=1,this.shiftStep=10,this.marks=[],this.showMarks=!1,this._value=0,this.valueLabelDisplay=`auto`,this.disableSwap=!1,this.disabled=!1,this.vertical=!1,this.markLabelOrientation=`horizontal`,this._activeThumb=-1,this.onValueChange=new Event(`change`),this._effectiveMarks=[],this._keydownHandlers=[]}set value(e){if(Array.isArray(e)){let t=[this._clamp(e[0]),this._clamp(e[1])];this._value=this.disableSwap?t:t.sort((e,t)=>e-t)}else this._value=this._clamp(e)}get value(){return this._value}_clamp(e){return Math.min(Math.max(e,this.min),this.max)}_valueToPercent(e){return(e-this.min)*100/(this.max-this.min)}_percentToValue(e){return(this.max-this.min)*e+this.min}_roundToStep(e,t){let n=Math.round((e-this.min)/t)*t+this.min,r=(t.toString().split(`.`)[1]??``).length;return Number(n.toFixed(r))}_findClosest(e,t){return e.length===0?-1:e.reduce((n,r,i)=>Math.abs(r-t)<Math.abs(e[n]-t)?i:n,0)}_getSnappedValue(e){let t=this._percentToValue(e);if(this.step!==null)t=this._roundToStep(t,this.step);else if(this.marks.length>0){let e=this.marks.map(e=>e.value);t=e[this._findClosest(e,t)]}return this._clamp(t)}_formatValue(e){let t=this.scale?this.scale(e):e;return typeof this.valueLabelFormat==`function`?this.valueLabelFormat(t):String(t)}_getFormattedValues(e){let t=`${e.join(`,`)}|${this.scale}|${this.valueLabelFormat}`;if(this._formatCache?.key===t)return this._formatCache.values;let n=e.map(e=>this._formatValue(e));return this._formatCache={key:t,values:n},n}_getValueLabelMinWidth(e){let t=this._formatValue(this.min),n=this._formatValue(this.max);return`${(e?`${t} – ${n}`:t.length>=n.length?t:n).length+.5}ch`}_getKeydownHandler(e){var t;return(t=this._keydownHandlers)[e]??(t[e]=t=>this._onKeyDown(t,e))}_getFraction(e,t){let n=this._trackWrapper;if(!n)return 0;let r=n.getBoundingClientRect();return this.vertical?1-(t-r.top)/r.height:(e-r.left)/r.width}_onPointerDown(e){if(this.disabled||e instanceof MouseEvent&&e.button!==0)return;let{clientX:t,clientY:n}=e instanceof TouchEvent?e.changedTouches[0]:e,r=this._getFraction(t,n),i=this._getSnappedValue(r),a=0;if(Array.isArray(this._value)){let e=this._value.map(e=>Math.abs(e-i));a=e[0]<=e[1]?0:1}this._activeThumb=a,this._focusInput(a),a=this._updateValue(i,a),this._activeThumb=a;let o=e=>{let{clientX:t,clientY:n}=e instanceof TouchEvent?e.changedTouches[0]:e,r=this._getFraction(t,n),i=this._getSnappedValue(r);a=this._updateValue(i,a),this._activeThumb=a},s=()=>{this._activeThumb=-1,this._dispatchChangeCommitted(),document.removeEventListener(`mousemove`,o),document.removeEventListener(`mouseup`,s),document.removeEventListener(`touchmove`,o),document.removeEventListener(`touchend`,s)};document.addEventListener(`mousemove`,o,{passive:!0}),document.addEventListener(`mouseup`,s),document.addEventListener(`touchmove`,o,{passive:!0}),document.addEventListener(`touchend`,s)}_focusInput(e){var t;(t=this.shadowRoot?.querySelectorAll(`input[type="range"]`)?.[e])==null||t.focus({preventScroll:!0})}_dispatchChange(){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this._value},bubbles:!0,composed:!0}))}_dispatchChangeCommitted(){this.dispatchEvent(new CustomEvent(`changecommitted`,{detail:{value:this._value},bubbles:!0,composed:!0}))}_updateValue(e,t){let n=t;if(Array.isArray(this._value)){let r=[...this._value];r[t]=e,!this.disableSwap&&r[0]>r[1]&&(r.sort((e,t)=>e-t),n=+(t===0)),this._value=r}else this._value=e;return this._dispatchChange(),n}_onKeyDown(e,t){if(![`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`,`PageUp`,`PageDown`,`Home`,`End`].includes(e.key))return;e.preventDefault();let n=Array.isArray(this._value)?this._value[t]:this._value,r=this.step??1,i=this.shiftStep,a=e.shiftKey,o=null,s=this.marks.map(e=>e.value);if(this.step!==null){let t=a?i:r;switch(e.key){case`ArrowRight`:case`ArrowUp`:o=this._clamp(n+t);break;case`ArrowLeft`:case`ArrowDown`:o=this._clamp(n-t);break;case`PageUp`:o=this._clamp(n+i);break;case`PageDown`:o=this._clamp(n-i);break;case`Home`:o=this.min;break;case`End`:o=this.max}}else if(s.length>0){let t=this._findClosest(s,n);switch(e.key){case`ArrowRight`:case`ArrowUp`:o=s[Math.min(t+1,s.length-1)];break;case`ArrowLeft`:case`ArrowDown`:o=s[Math.max(t-1,0)];break;case`Home`:o=s[0];break;case`End`:o=s[s.length-1]}}else{let t=a?i:1;switch(e.key){case`ArrowRight`:case`ArrowUp`:o=this._clamp(n+t);break;case`ArrowLeft`:case`ArrowDown`:o=this._clamp(n-t);break;case`Home`:o=this.min;break;case`End`:o=this.max}}o!==null&&(this._updateValue(o,t),this._dispatchChangeCommitted())}willUpdate(e){(e.has(`min`)||e.has(`max`))&&(this.min>=this.max&&console.error(`[bim-slider] min (${this.min}) must be less than max (${this.max}).`),this._value=Array.isArray(this._value)?[this._clamp(this._value[0]),this._clamp(this._value[1])].sort((e,t)=>e-t):this._clamp(this._value)),e.has(`step`)&&this.step!==null&&this.step<=0&&console.error(`[bim-slider] step (${this.step}) must be greater than 0.`),(e.has(`step`)||e.has(`marks`))&&this.step===null&&this.marks.length===0&&console.warn(`[bim-slider] step is null and marks is empty — the slider has no snap points. Set step or provide marks.`),(e.has(`showMarks`)||e.has(`step`)||e.has(`min`)||e.has(`max`)||e.has(`marks`))&&(this._effectiveMarks=this.showMarks&&this.step!==null?Array.from({length:Math.floor((this.max-this.min)/this.step)+1},(e,t)=>({value:this.min+this.step*t})):this.marks)}updated(){this.setAttribute(`aria-disabled`,String(this.disabled)),Array.isArray(this._value)?(this.setAttribute(`role`,`group`),this.label&&this.setAttribute(`aria-label`,this.label)):this.removeAttribute(`role`)}render(){let e=Array.isArray(this._value),t=e?this._value:[this._value],n=this._getFormattedValues(t),r=e?this._valueToPercent(t[0]):0,i=this._valueToPercent(t[t.length-1]),a=this.vertical?{bottom:`${r}%`,height:`${i-r}%`}:{left:`${r}%`,width:`${i-r}%`};return O`
      ${_t(this.label||this.icon,()=>O`
          <bim-label .icon=${this.icon}>${this.label}</bim-label>
        `)}

      <div class="track-row">
        <div
          class="track-wrapper"
          @mousedown=${this._onPointerDown}
          @touchstart=${this._onPointerDown}
        >
          <div class="rail"></div>
          <div class="track" style=${gt(a)}></div>

          ${this._effectiveMarks.map(n=>{let r=this._valueToPercent(n.value);return O`
              <div
                class="mark"
                ?data-active=${e?n.value>=t[0]&&n.value<=t[1]:n.value<=t[0]}
                style=${gt(this.vertical?{bottom:`${r}%`}:{left:`${r}%`})}
              ></div>
              ${_t(n.label,()=>O`
                  <span
                    class="mark-label"
                    style=${gt(this.vertical?{bottom:`${r}%`}:{left:`${r}%`})}
                  >
                    ${n.label}
                  </span>
                `)}
            `})}
          ${t.map((t,r)=>{let i=this._valueToPercent(t),a=this._activeThumb===r,o=this.label??(e?r===0?`Lower bound`:`Upper bound`:`Slider`);return O`
              <div
                class="thumb"
                ?data-active=${a}
                style=${gt(this.vertical?{bottom:`${i}%`,left:`50%`}:{left:`${i}%`,top:`50%`})}
              >
                ${_t(this.valueLabelDisplay!==`off`,()=>O`
                    <div class="value-label">${n[r]}</div>
                  `)}
                <input
                  type="range"
                  .min=${String(this.min)}
                  .max=${String(this.max)}
                  .step=${this.step===null?`any`:String(this.step)}
                  .value=${String(t)}
                  aria-label=${o}
                  aria-valuemin=${this.min}
                  aria-valuemax=${this.max}
                  aria-valuenow=${t}
                  data-index=${r}
                  ?disabled=${this.disabled}
                  @keydown=${this._getKeydownHandler(r)}
                />
              </div>
            `})}
        </div>

        ${_t(!this.vertical&&this.valueLabelDisplay!==`off`,()=>O`
            <bim-label
              class="value"
              style=${gt({minWidth:this._getValueLabelMinWidth(e)})}
            >
              ${e?`${n[0]} – ${n[1]}`:n[0]}
            </bim-label>
          `)}
      </div>
    `}};zy.styles=o`
    :host {
      display: block;
      user-select: none;
    }

    /* ── Track row (track + side value) ──────────────────────── */
    .track-row {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    /* ── Track wrapper ────────────────────────────────────────── */
    .track-wrapper {
      flex: 1;
      position: relative;
      height: var(--bim-slider_track--h, 0.25rem);
      margin: 0.75rem var(--bim-slider--mx, 0.5rem);
      display: flex;
      align-items: center;
    }


    /* ── Rail ─────────────────────────────────────────────────── */
    .rail {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: var(--bim-slider_rail--bdrs, var(--bim-ui_size-4xs));
      background-color: var(
        --bim-slider_rail--bgc,
        var(--bim-ui_bg-contrast-20)
      );
    }

    /* ── Track (filled portion) ───────────────────────────────── */
    .track {
      position: absolute;
      height: 100%;
      border-radius: var(--bim-slider_track--bdrs, var(--bim-ui_size-4xs));
      background-color: var(--bim-slider_track--bgc, var(--bim-ui_main-base));
      pointer-events: none;
    }

    /* ── Thumb ────────────────────────────────────────────────── */
    .thumb {
      position: absolute;
      width: var(--bim-slider_thumb--sz, 0.875rem);
      height: var(--bim-slider_thumb--sz, 0.875rem);
      border-radius: 50%;
      background-color: var(--bim-slider_thumb--bgc, var(--bim-ui_main-base));
      transform: translate(-50%, -50%);
      top: 50%;
      cursor: pointer;
      transition: box-shadow var(--bim-slider_thumb--transition-duration, 0.15s);
      z-index: var(--bim-slider_thumb--z, 2);
    }

    .thumb:hover,
    .thumb[data-active] {
      box-shadow: 0 0 0 0.5rem
        var(
          --bim-slider_thumb-focus--shadow,
          color-mix(in srgb, var(--bim-ui_main-base) 20%, transparent)
        );
    }

    /* ── Hidden native input (a11y + keyboard) ────────────────── */
    /* Sized/positioned to exactly cover its own thumb (not the whole track),
       so a focus-visible ring here reads as "this thumb is focused" rather
       than drawing around the entire slider. Kept pointer-events: none —
       the drag interaction is driven by .track-wrapper's own mousedown
       handler; removing it would let the native input's own click/drag
       behavior compete with that. Click-to-focus is instead done explicitly
       in _onPointerDown (inputEl.focus()), so keyboard users still get a
       correct, visible focus target without touching the hit-testing at all. */
    .thumb input[type="range"] {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      pointer-events: none;
      margin: 0;
    }

    .thumb input[type="range"]:focus-visible {
      outline: 2px solid var(--bim-ui_main-base);
      outline-offset: 2px;
      border-radius: 50%;
    }

    /* ── Side value label (next to the track) ────────────────── */
    .track-row bim-label.value {
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    }

    /* ── Value label (tooltip) ────────────────────────────────── */
    .value-label {
      position: absolute;
      bottom: calc(100% + 0.5rem);
      left: 50%;
      transform: translateX(-50%);
      background-color: var(
        --bim-slider_value-label--bgc,
        var(--bim-ui_bg-contrast-10)
      );
      color: var(--bim-slider_value-label--c, var(--bim-ui_bg-contrast-80));
      box-shadow: var(
        --bim-slider_value-label--shadow,
        0 0 10px 3px rgba(0, 0, 0, 0.2)
      );
      font-size: var(--bim-slider_value-label--fz, var(--bim-ui_size-sm));
      padding: var(--bim-slider_value-label--p, 0.125rem 0.375rem);
      border-radius: var(--bim-slider_value-label--bdrs, 4px);
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity var(--bim-slider_value-label--transition-duration, 0.15s);
    }

    .thumb:hover .value-label,
    .thumb[data-active] .value-label {
      opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
      .thumb,
      .value-label {
        transition: none;
      }
    }

    /* ── Marks ────────────────────────────────────────────────── */
    .mark {
      position: absolute;
      width: var(--bim-slider_mark--sz, 0.25rem);
      height: var(--bim-slider_mark--sz, 0.25rem);
      border-radius: 50%;
      background-color: var(
        --bim-slider_mark--bgc,
        var(--bim-ui_bg-contrast-40)
      );
      transform: translateX(-50%);
      pointer-events: none;
      z-index: var(--bim-slider_mark--z, 1);
    }

    .mark[data-active] {
      background-color: var(
        --bim-slider_mark-active--bgc,
        var(--bim-ui_bg-base)
      );
    }

    .mark-label {
      position: absolute;
      top: calc(100% + 0.375rem);
      transform: var(--bim-slider_mark-label--transform, translateX(-50%));
      font-size: var(--bim-slider_mark-label--fz, var(--bim-ui_size-xs));
      color: var(--bim-slider_mark-label--c, var(--bim-ui_bg-contrast-60));
      white-space: nowrap;
      pointer-events: none;
      transform-origin: top left;
    }

    /* ── Mark label orientations ───────────────────────────────── */
    :host([mark-label-orientation="vertical"]) .mark-label {
      transform: var(--bim-slider_mark-label--transform, translateX(-50%) rotate(90deg));
      transform-origin: top left;
    }

    :host([mark-label-orientation="diagonal"]) .mark-label {
      transform: var(--bim-slider_mark-label--transform, translateX(-100%) rotate(-45deg));
      transform-origin: top right;
    }

    /* ── Disabled state ───────────────────────────────────────── */
    :host([disabled]) {
      opacity: 0.4;
      pointer-events: none;
    }

    /* ── Vertical orientation ─────────────────────────────────── */
    :host([vertical]) .track-wrapper {
      width: var(--bim-slider_track--w, var(--bim-slider_track--h, 0.25rem));
      height: 100%;
      flex-direction: column;
      margin: var(--bim-slider--mx, 0.5rem) 0.75rem;
    }
  `;var $=zy;Q([j({type:String,reflect:!0})],$.prototype,`name`,2),Q([j({type:String,reflect:!0})],$.prototype,`label`,2),Q([j({type:String,reflect:!0})],$.prototype,`icon`,2),Q([j({type:Number,reflect:!0})],$.prototype,`min`,2),Q([j({type:Number,reflect:!0})],$.prototype,`max`,2),Q([j({reflect:!0,converter:{fromAttribute:e=>{if(e===null)return 1;if(e.toLowerCase()===`none`)return null;let t=Number(e);return Number.isFinite(t)?t:1},toAttribute:e=>e===null?`none`:String(e)}})],$.prototype,`step`,2),Q([j({type:Number,attribute:`shift-step`,reflect:!0})],$.prototype,`shiftStep`,2),Q([j({type:Array})],$.prototype,`marks`,2),Q([j({type:Boolean,attribute:`show-marks`,reflect:!0})],$.prototype,`showMarks`,2),Q([M()],$.prototype,`_value`,2),Q([j({attribute:!1})],$.prototype,`value`,1),Q([j({type:String,attribute:`value-label-display`,reflect:!0})],$.prototype,`valueLabelDisplay`,2),Q([j({attribute:!1})],$.prototype,`valueLabelFormat`,2),Q([j({attribute:!1})],$.prototype,`scale`,2),Q([j({type:Boolean,attribute:`disable-swap`,reflect:!0})],$.prototype,`disableSwap`,2),Q([j({type:Boolean,reflect:!0})],$.prototype,`disabled`,2),Q([j({type:Boolean,reflect:!0})],$.prototype,`vertical`,2),Q([j({type:String,attribute:`mark-label-orientation`,reflect:!0})],$.prototype,`markLabelOrientation`,2),Q([M()],$.prototype,`_activeThumb`,2),Q([ze(`.track-wrapper`)],$.prototype,`_trackWrapper`,2);var By=Object.defineProperty,Vy=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&By(t,n,i),i},Hy={A0:{width:841,height:1189},A1:{width:594,height:841},A2:{width:420,height:594},A3:{width:297,height:420},A4:{width:210,height:297}},Uy=class extends A{constructor(){super(...arguments),this.label=``,this.sheetNumber=``,this.size=`A4`,this.orientation=`portrait`,this.margin=10,this.debug=!1,this.ruler=!1,this.rulerLength=100,this._pxPerMm=3.7795275591,this._rulerPosition={x:20,y:20},this._rulerDragging=!1,this._rulerOrientation=`horizontal`,this._mediaQueryList=null,this._mediaQueryListener=null,this._rulerDragStart={x:0,y:0},this.handleRulerMouseMove=e=>{this._rulerDragging&&(this._rulerPosition={x:e.clientX-this._rulerDragStart.x,y:e.clientY-this._rulerDragStart.y},this.requestUpdate())},this.handleRulerMouseUp=()=>{this._rulerDragging=!1,this.removeRulerDragListeners()}}get widthMm(){let e=Hy[this.size];return this.orientation===`portrait`?e.width:e.height}get heightMm(){let e=Hy[this.size];return this.orientation===`portrait`?e.height:e.width}get pxPerMm(){return this._pxPerMm}get drawingAreaEl(){return this.shadowRoot.querySelector(`.printable-area`)}get drawingSlotEl(){return this.shadowRoot?.querySelector(`.drawing-slot`)??null}mmToPx(e){return e*this._pxPerMm}mm(e){return`${this.mmToPx(e)}px`}calibrate(){let e=this.shadowRoot?.querySelector(`.calibration-ruler`);if(!e)return;e.offsetHeight;let t=e.getBoundingClientRect().width;t>0&&(this._pxPerMm=t/100)}setupDPRListener(){let e=window.devicePixelRatio||1;this._mediaQueryList=window.matchMedia(`(resolution: ${e}dppx)`),this._mediaQueryListener=()=>{this.calibrate(),this.requestUpdate(),this._mediaQueryList&&this._mediaQueryListener&&this._mediaQueryList.removeEventListener(`change`,this._mediaQueryListener),this.setupDPRListener()},this._mediaQueryList.addEventListener(`change`,this._mediaQueryListener)}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this.calibrate(),this.setupDPRListener()})}disconnectedCallback(){super.disconnectedCallback(),this._mediaQueryList&&this._mediaQueryListener&&this._mediaQueryList.removeEventListener(`change`,this._mediaQueryListener),this._mediaQueryList=null,this._mediaQueryListener=null,this.removeRulerDragListeners()}handleRulerMouseDown(e){e.preventDefault(),this._rulerDragging=!0,this._rulerDragStart={x:e.clientX-this._rulerPosition.x,y:e.clientY-this._rulerPosition.y},document.addEventListener(`mousemove`,this.handleRulerMouseMove),document.addEventListener(`mouseup`,this.handleRulerMouseUp)}removeRulerDragListeners(){document.removeEventListener(`mousemove`,this.handleRulerMouseMove),document.removeEventListener(`mouseup`,this.handleRulerMouseUp)}toggleRulerOrientation(e){e.stopPropagation(),this._rulerOrientation=this._rulerOrientation===`horizontal`?`vertical`:`horizontal`}renderRulerGizmo(){if(!this.ruler)return null;let e=this.mmToPx(this.rulerLength),t=Math.floor(this.rulerLength/10),n=this._rulerOrientation===`horizontal`;return O`
      <div
        class="ruler-gizmo ${this._rulerOrientation}"
        style="left: ${this._rulerPosition.x}px; top: ${this._rulerPosition.y}px;"
        @mousedown=${this.handleRulerMouseDown}
      >
        <div class="ruler-label">${this.rulerLength}mm</div>
        <button
          class="ruler-rotate-btn"
          @click=${this.toggleRulerOrientation}
          title="Toggle horizontal/vertical"
        >
          ${n?`⇅`:`⇄`}
        </button>
        <div
          class="ruler-line ${this._rulerOrientation}"
          style="${n?`width: ${e}px`:`height: ${e}px`};"
        >
          ${Array.from({length:t+1},(e,r)=>{let i=r/t*100,a=r%1==0,o=r*10/10;return O`
              <div
                class="ruler-tick ${this._rulerOrientation} ${a?`cm-marker`:``}"
                style="${n?`left: ${i}%`:`top: ${i}%`};"
              >
                ${a?O`<div class="ruler-cm-label ${this._rulerOrientation}">
                      ${o}
                    </div>`:null}
              </div>
            `})}
        </div>
      </div>
    `}render(){let e=this.mmToPx(this.widthMm),t=this.mmToPx(this.heightMm);return this.style.width=`${e}px`,this.style.height=`${t}px`,this.style.padding=this.mm(this.margin),O`
      <!-- Calibration ruler: hidden element used to measure mm→px -->
      <div class="calibration-ruler"></div>

      <!-- Ruler gizmo for scale validation -->
      ${this.renderRulerGizmo()}

      <!-- Printable area -->
      <div class="printable-area ${this.debug?`debug`:``}">
        <!-- Title block template or drawing area slot -->
        ${this.titleBlockTemplate?this.titleBlockTemplate(this.mm.bind(this),O`<div class="drawing-slot"><slot></slot></div>`,{label:this.label,sheetNumber:this.sheetNumber}):O`<div class="drawing-slot"><slot></slot></div>`}
      </div>
    `}};Uy.styles=o`
    :host {
      display: inline-block;
      position: relative;
      overflow: visible;
      background: white;
      box-sizing: border-box;
    }

    .printable-area {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }

    .drawing-slot {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 0;
      min-width: 0;
      overflow: hidden;
    }

    .printable-area.debug {
      border: 1px dashed #999;
    }

    .calibration-ruler {
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 100mm;
      height: 100mm;
      visibility: hidden;
      pointer-events: none;
    }

    .ruler-gizmo {
      position: absolute;
      background: rgba(255, 255, 0, 0.15);
      border: 1px solid #ff9800;
      cursor: move;
      user-select: none;
      z-index: 1000;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .ruler-gizmo.vertical {
      flex-direction: column;
    }

    .ruler-gizmo:active {
      background: rgba(255, 255, 0, 0.3);
      cursor: grabbing;
    }

    .ruler-line {
      position: relative;
      background: #ff9800;
      border-radius: 2px;
    }

    .ruler-line.horizontal {
      height: 3px;
    }

    .ruler-line.vertical {
      width: 3px;
    }

    .ruler-tick {
      position: absolute;
      background: #ff9800;
    }

    .ruler-tick.horizontal {
      width: 1px;
      height: 8px;
      top: -2.5px;
    }

    .ruler-tick.vertical {
      width: 8px;
      height: 1px;
      left: -2.5px;
    }

    .ruler-tick.cm-marker.horizontal {
      height: 12px;
      top: -4.5px;
      width: 2px;
    }

    .ruler-tick.cm-marker.vertical {
      width: 12px;
      left: -4.5px;
      height: 2px;
    }

    .ruler-cm-label {
      position: absolute;
      color: #ff9800;
      font-weight: bold;
      font-size: 9px;
    }

    .ruler-cm-label.horizontal {
      top: -18px;
      transform: translateX(-50%);
    }

    .ruler-cm-label.vertical {
      left: -22px;
      transform: translateY(-50%);
    }

    .ruler-label {
      color: #ff9800;
      font-weight: bold;
      white-space: nowrap;
    }

    .ruler-rotate-btn {
      background: #ff9800;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 4px 6px;
      cursor: pointer;
      font-size: 10px;
      font-weight: bold;
      line-height: 1;
    }

    .ruler-rotate-btn:hover {
      background: #f57c00;
    }

    .ruler-rotate-btn:active {
      background: #ef6c00;
    }
  `;var Wy=Uy;Vy([j({type:String})],Wy.prototype,`label`),Vy([j({type:String})],Wy.prototype,`sheetNumber`),Vy([j({type:String})],Wy.prototype,`size`),Vy([j({type:String})],Wy.prototype,`orientation`),Vy([j({type:Number})],Wy.prototype,`margin`),Vy([j({type:Boolean})],Wy.prototype,`debug`),Vy([j({type:Boolean,attribute:`ruler`})],Wy.prototype,`ruler`),Vy([j({type:Number,attribute:`ruler-length`})],Wy.prototype,`rulerLength`),Vy([j({attribute:!1})],Wy.prototype,`titleBlockTemplate`),Vy([M()],Wy.prototype,`_pxPerMm`),Vy([M()],Wy.prototype,`_rulerPosition`),Vy([M()],Wy.prototype,`_rulerDragging`),Vy([M()],Wy.prototype,`_rulerOrientation`);var Gy=Object.defineProperty,Ky=(e,t,n,r)=>{for(var i=void 0,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=o(t,n,i)||i);return i&&Gy(t,n,i),i},qy=class extends A{constructor(){super(...arguments),this.confirmLabel=`Confirm`,this.cancelLabel=`Cancel`,this.open=!1,this.loading=!1,this._dialog=ot()}updated(e){if(super.updated(e),!e.has(`open`))return;let t=this._dialog.value;t&&(this.open?t.open||t.showModal():t.open&&t.close())}_confirm(){this.dispatchEvent(new Event(`confirm`,{bubbles:!0,composed:!0}))}_cancel(){this.open=!1,this.dispatchEvent(new Event(`cancel`,{bubbles:!0,composed:!0}))}_onDialogCancel(e){e.preventDefault(),!this.loading&&this._cancel()}_onDialogClose(){var e;this.loading&&((e=this._dialog.value)==null||e.showModal())}_onDialogClick(e){if(this.loading)return;let t=this._dialog.value;if(!t)return;let n=t.getBoundingClientRect();(e.clientX<n.left||e.clientX>n.right||e.clientY<n.top||e.clientY>n.bottom)&&this._cancel()}render(){return O`
      <dialog
        ${lt(this._dialog)}
        @cancel=${this._onDialogCancel}
        @close=${this._onDialogClose}
        @click=${this._onDialogClick}
      >
        ${this.label||this.icon?O`
          <div class="header">
            <bim-label .icon=${this.icon}>${this.label??``}</bim-label>
          </div>
        `:k}
        <div class="content">
          <slot></slot>
        </div>
        <div class="footer">
          <bim-button
            label=${this.cancelLabel}
            ?disabled=${this.loading}
            @click=${this._cancel}>
          </bim-button>
          <bim-button
            label=${this.confirmLabel}
            .loading=${this.loading}
            ?disabled=${this.loading}
            style="background-color: var(--bim-ui_main-base);"
            @click=${this._confirm}>
          </bim-button>
        </div>
      </dialog>
    `}};qy.styles=o`
    :host {
      display: contents;
    }

    dialog {
      padding: 0;
      border: none;
      border-radius: 0.75rem;
      background-color: var(--bim-modal--bg, var(--bim-ui_bg-contrast-10));
      color: var(--bim-modal--c, var(--bim-ui_bg-contrast-80));
      min-width: 20rem;
      max-width: min(90vw, 36rem);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }

    dialog::backdrop {
      background-color: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(2px);
    }

    .header {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      border-bottom: 1px solid var(--bim-ui_bg-contrast-20);
      box-sizing: border-box;
      height: 35px;
    }

    .header bim-label {
      flex: 1;
      font-weight: 600;
      font-size: 13px;
    }

    .content {
      padding: 1rem;
      max-height: 60vh;
      overflow-y: auto;
    }

    .footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
    }
  `;var Jy=qy;Ky([j({type:String,reflect:!0})],Jy.prototype,`label`),Ky([j({type:String,reflect:!0})],Jy.prototype,`icon`),Ky([j({type:String,attribute:`confirm-label`})],Jy.prototype,`confirmLabel`),Ky([j({type:String,attribute:`cancel-label`})],Jy.prototype,`cancelLabel`),Ky([j({type:Boolean,reflect:!0})],Jy.prototype,`open`),Ky([j({type:Boolean,reflect:!0})],Jy.prototype,`loading`);var Yy=Object.defineProperty,Xy=Object.getOwnPropertyDescriptor,Zy=(e,t,n,r)=>{for(var i=r>1?void 0:r?Xy(t,n):t,a=e.length-1,o;a>=0;a--)(o=e[a])&&(i=(r?o(t,n,i):o(i))||i);return r&&i&&Yy(t,n,i),i},Qy=class extends A{constructor(){super(...arguments),this.sortOnly=!1,this._items=[],this._activeIds=[],this._availableIds=[],this._dragIndex=-1,this._dragOverIndex=-1}set items(e){this._items=e;let t=new Set(e.map(e=>e.id));this._activeIds=this._activeIds.filter(e=>t.has(e)),this._availableIds=this._availableIds.filter(e=>t.has(e));let n=new Set([...this._activeIds,...this._availableIds]);for(let t of e)n.has(t.id)||(this._activeIds=[...this._activeIds,t.id])}get items(){return this._items}_byId(e){return this._items.find(t=>t.id===e)}_activate(e){this._availableIds=this._availableIds.filter(t=>t!==e),this._activeIds=[...this._activeIds,e],this._dispatchChange()}_deactivate(e){this._activeIds=this._activeIds.filter(t=>t!==e),this._availableIds=[...this._availableIds,e],this._dispatchChange()}_onDragStart(e,t){this._dragIndex=t,e.dataTransfer.effectAllowed=`move`,e.dataTransfer.setData(`text/plain`,String(t))}_onDragOver(e,t){e.preventDefault(),e.dataTransfer.dropEffect=`move`,this._dragOverIndex!==t&&(this._dragOverIndex=t)}_onDrop(e,t){e.preventDefault();let n=this._dragIndex;if(this._dragIndex=-1,this._dragOverIndex=-1,n===-1||n===t)return;let r=[...this._activeIds],[i]=r.splice(n,1);r.splice(t,0,i),this._activeIds=r,this._dispatchChange()}_onDragEnd(){this._dragIndex=-1,this._dragOverIndex=-1}_dispatchChange(){this.dispatchEvent(new CustomEvent(`change`,{detail:[...this._activeIds],bubbles:!0,composed:!0}))}render(){let e=this._activeIds.map(e=>this._byId(e)).filter(Boolean),t=this._availableIds.map(e=>this._byId(e)).filter(Boolean);return O`
      ${_t(!this.sortOnly&&e.length>0,()=>O`<bim-label>Active</bim-label>`)}

      <div class="fields-list">
        ${e.map((e,t)=>O`
            <div
              class=${pt({"field-item":!0,"field-item--dragging":this._dragIndex===t,"field-item--drag-over":this._dragOverIndex===t&&this._dragIndex!==t})}
              draggable="true"
              @dragstart=${e=>this._onDragStart(e,t)}
              @dragover=${e=>this._onDragOver(e,t)}
              @drop=${e=>this._onDrop(e,t)}
              @dragend=${()=>this._onDragEnd()}
            >
              <bim-label
                icon="tabler:grip-vertical"
                style="cursor:grab; color:var(--bim-ui_bg-contrast-60); flex-shrink:0;"
              ></bim-label>
              ${_t(!this.sortOnly,()=>O`
                  <bim-checkbox
                    .checked=${vt(!0)}
                    @change=${t=>{t.stopPropagation(),this._deactivate(e.id)}}
                  ></bim-checkbox>
                `)}
              <bim-label .icon=${e.icon} style="flex:1;"
                >${e.label}</bim-label
              >
            </div>
          `)}
      </div>

      ${_t(!this.sortOnly&&t.length>0,()=>O`
          <bim-label>Available</bim-label>
          <div class="fields-list">
            ${t.map(e=>O`
                <div class="field-item">
                  <bim-checkbox
                    .checked=${vt(!1)}
                    @change=${t=>{t.stopPropagation(),this._activate(e.id)}}
                  ></bim-checkbox>
                  <bim-label .icon=${e.icon} style="flex:1;"
                    >${e.label}</bim-label
                  >
                </div>
              `)}
          </div>
        `)}
    `}};Qy.styles=o`
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .fields-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .field-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      border-radius: 6px;
      user-select: none;
      min-height: 25px;
    }

    .field-item:hover {
      background: var(--bim-ui_bg-contrast-20);
    }

    .field-item--drag-over {
      border-top: 2px solid var(--bim-ui_accent-base);
      border-radius: 0;
    }

    .field-item--dragging {
      opacity: 0.4;
    }
  `;var $y=Qy;Zy([j({attribute:!1})],$y.prototype,`items`,1),Zy([j({attribute:!1})],$y.prototype,`sortOnly`,2),Zy([M()],$y.prototype,`_activeIds`,2),Zy([M()],$y.prototype,`_availableIds`,2),Zy([M()],$y.prototype,`_dragIndex`,2),Zy([M()],$y.prototype,`_dragOverIndex`,2);export{Wr as n,O as r,Ur as t};
(function(e){function t(t){for(var r,c,o=t[0],i=t[1],l=t[2],d=0,f=[];d<o.length;d++)c=o[d],Object.prototype.hasOwnProperty.call(a,c)&&a[c]&&f.push(a[c][0]),a[c]=0;for(r in i)Object.prototype.hasOwnProperty.call(i,r)&&(e[r]=i[r]);u&&u(t);while(f.length)f.shift()();return s.push.apply(s,l||[]),n()}function n(){for(var e,t=0;t<s.length;t++){for(var n=s[t],r=!0,o=1;o<n.length;o++){var i=n[o];0!==a[i]&&(r=!1)}r&&(s.splice(t--,1),e=c(c.s=n[0]))}return e}var r={},a={app:0},s=[];function c(t){if(r[t])return r[t].exports;var n=r[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,c),n.l=!0,n.exports}c.m=e,c.c=r,c.d=function(e,t,n){c.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},c.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},c.t=function(e,t){if(1&t&&(e=c(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(c.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)c.d(n,r,function(t){return e[t]}.bind(null,r));return n},c.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return c.d(t,"a",t),t},c.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},c.p="/";var o=window["webpackJsonp"]=window["webpackJsonp"]||[],i=o.push.bind(o);o.push=t,o=o.slice();for(var l=0;l<o.length;l++)t(o[l]);var u=i;s.push([0,"chunk-vendors"]),n()})({0:function(e,t,n){e.exports=n("56d7")},"034f":function(e,t,n){"use strict";var r=n("85ec"),a=n.n(r);a.a},"0ab0":function(e,t,n){"use strict";var r=n("c432"),a=n.n(r);a.a},"36f5":function(e,t,n){},4678:function(e,t,n){var r={"./af":"2bfb","./af.js":"2bfb","./ar":"8e73","./ar-dz":"a356","./ar-dz.js":"a356","./ar-kw":"423e","./ar-kw.js":"423e","./ar-ly":"1cfd","./ar-ly.js":"1cfd","./ar-ma":"0a84","./ar-ma.js":"0a84","./ar-sa":"8230","./ar-sa.js":"8230","./ar-tn":"6d83","./ar-tn.js":"6d83","./ar.js":"8e73","./az":"485c","./az.js":"485c","./be":"1fc1","./be.js":"1fc1","./bg":"84aa","./bg.js":"84aa","./bm":"a7fa","./bm.js":"a7fa","./bn":"9043","./bn.js":"9043","./bo":"d26a","./bo.js":"d26a","./br":"6887","./br.js":"6887","./bs":"2554","./bs.js":"2554","./ca":"d716","./ca.js":"d716","./cs":"3c0d","./cs.js":"3c0d","./cv":"03ec","./cv.js":"03ec","./cy":"9797","./cy.js":"9797","./da":"0f14","./da.js":"0f14","./de":"b469","./de-at":"b3eb","./de-at.js":"b3eb","./de-ch":"bb71","./de-ch.js":"bb71","./de.js":"b469","./dv":"598a","./dv.js":"598a","./el":"8d47","./el.js":"8d47","./en-au":"0e6b","./en-au.js":"0e6b","./en-ca":"3886","./en-ca.js":"3886","./en-gb":"39a6","./en-gb.js":"39a6","./en-ie":"e1d3","./en-ie.js":"e1d3","./en-il":"7333","./en-il.js":"7333","./en-in":"ec2e","./en-in.js":"ec2e","./en-nz":"6f50","./en-nz.js":"6f50","./en-sg":"b7e9","./en-sg.js":"b7e9","./eo":"65db","./eo.js":"65db","./es":"898b","./es-do":"0a3c","./es-do.js":"0a3c","./es-us":"55c9","./es-us.js":"55c9","./es.js":"898b","./et":"ec18","./et.js":"ec18","./eu":"0ff2","./eu.js":"0ff2","./fa":"8df4","./fa.js":"8df4","./fi":"81e9","./fi.js":"81e9","./fil":"d69a","./fil.js":"d69a","./fo":"0721","./fo.js":"0721","./fr":"9f26","./fr-ca":"d9f8","./fr-ca.js":"d9f8","./fr-ch":"0e49","./fr-ch.js":"0e49","./fr.js":"9f26","./fy":"7118","./fy.js":"7118","./ga":"5120","./ga.js":"5120","./gd":"f6b4","./gd.js":"f6b4","./gl":"8840","./gl.js":"8840","./gom-deva":"aaf2","./gom-deva.js":"aaf2","./gom-latn":"0caa","./gom-latn.js":"0caa","./gu":"e0c5","./gu.js":"e0c5","./he":"c7aa","./he.js":"c7aa","./hi":"dc4d","./hi.js":"dc4d","./hr":"4ba9","./hr.js":"4ba9","./hu":"5b14","./hu.js":"5b14","./hy-am":"d6b6","./hy-am.js":"d6b6","./id":"5038","./id.js":"5038","./is":"0558","./is.js":"0558","./it":"6e98","./it-ch":"6f12","./it-ch.js":"6f12","./it.js":"6e98","./ja":"079e","./ja.js":"079e","./jv":"b540","./jv.js":"b540","./ka":"201b","./ka.js":"201b","./kk":"6d79","./kk.js":"6d79","./km":"e81d","./km.js":"e81d","./kn":"3e92","./kn.js":"3e92","./ko":"22f8","./ko.js":"22f8","./ku":"2421","./ku.js":"2421","./ky":"9609","./ky.js":"9609","./lb":"440c","./lb.js":"440c","./lo":"b29d","./lo.js":"b29d","./lt":"26f9","./lt.js":"26f9","./lv":"b97c","./lv.js":"b97c","./me":"293c","./me.js":"293c","./mi":"688b","./mi.js":"688b","./mk":"6909","./mk.js":"6909","./ml":"02fb","./ml.js":"02fb","./mn":"958b","./mn.js":"958b","./mr":"39bd","./mr.js":"39bd","./ms":"ebe4","./ms-my":"6403","./ms-my.js":"6403","./ms.js":"ebe4","./mt":"1b45","./mt.js":"1b45","./my":"8689","./my.js":"8689","./nb":"6ce3","./nb.js":"6ce3","./ne":"3a39","./ne.js":"3a39","./nl":"facd","./nl-be":"db29","./nl-be.js":"db29","./nl.js":"facd","./nn":"b84c","./nn.js":"b84c","./oc-lnc":"167b","./oc-lnc.js":"167b","./pa-in":"f3ff","./pa-in.js":"f3ff","./pl":"8d57","./pl.js":"8d57","./pt":"f260","./pt-br":"d2d4","./pt-br.js":"d2d4","./pt.js":"f260","./ro":"972c","./ro.js":"972c","./ru":"957c","./ru.js":"957c","./sd":"6784","./sd.js":"6784","./se":"ffff","./se.js":"ffff","./si":"eda5","./si.js":"eda5","./sk":"7be6","./sk.js":"7be6","./sl":"8155","./sl.js":"8155","./sq":"c8f3","./sq.js":"c8f3","./sr":"cf1e","./sr-cyrl":"13e9","./sr-cyrl.js":"13e9","./sr.js":"cf1e","./ss":"52bd","./ss.js":"52bd","./sv":"5fbd","./sv.js":"5fbd","./sw":"74dc","./sw.js":"74dc","./ta":"3de5","./ta.js":"3de5","./te":"5cbb","./te.js":"5cbb","./tet":"576c","./tet.js":"576c","./tg":"3b1b","./tg.js":"3b1b","./th":"10e8","./th.js":"10e8","./tk":"5aff","./tk.js":"5aff","./tl-ph":"0f38","./tl-ph.js":"0f38","./tlh":"cf75","./tlh.js":"cf75","./tr":"0e81","./tr.js":"0e81","./tzl":"cf51","./tzl.js":"cf51","./tzm":"c109","./tzm-latn":"b53d","./tzm-latn.js":"b53d","./tzm.js":"c109","./ug-cn":"6117","./ug-cn.js":"6117","./uk":"ada2","./uk.js":"ada2","./ur":"5294","./ur.js":"5294","./uz":"2e8c","./uz-latn":"010e","./uz-latn.js":"010e","./uz.js":"2e8c","./vi":"2921","./vi.js":"2921","./x-pseudo":"fd7e","./x-pseudo.js":"fd7e","./yo":"7f33","./yo.js":"7f33","./zh-cn":"5c3a","./zh-cn.js":"5c3a","./zh-hk":"49ab","./zh-hk.js":"49ab","./zh-mo":"3a6c","./zh-mo.js":"3a6c","./zh-tw":"90ea","./zh-tw.js":"90ea"};function a(e){var t=s(e);return n(t)}function s(e){if(!n.o(r,e)){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}return r[e]}a.keys=function(){return Object.keys(r)},a.resolve=s,e.exports=a,a.id="4678"},"56d7":function(e,t,n){"use strict";n.r(t);n("e260"),n("e6cf"),n("cca6"),n("a79d");var r=n("2b0e"),a=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{attrs:{id:"app"}},[n("h1",{staticClass:"main-title"},[e._v("Freelance Scrap Projects")]),n("div",{staticClass:"tabs"},[n("div",{staticClass:"tabs-triggers"},e._l(e.flComponents,(function(t){return n("a",{key:t.title,staticClass:"tabs-triggers__item font-weight-bold",class:{active:e.isActive(t.title)},attrs:{href:"#"+t.title},on:{click:function(n){return n.preventDefault(),e.setActive(t.title)}}},[e._v(" "+e._s(t.title)+" "),e.newProjectsExists(t.newProjects)?n("b-icon",{attrs:{icon:"exclamation-circle-fill",variant:"danger"}}):e._e()],1)})),0),n("div",{staticClass:"tabs-content"},e._l(e.flComponents,(function(t){return n("div",{key:t.title,staticClass:"tabs-content__item",class:{active:e.isActive(t.title)},attrs:{id:t.title}},[n("Freelance",{tag:"component",attrs:{freelance:t.component,projects:t.projects,newProjects:t.newProjects}})],1)})),0)])])},s=[],c=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{staticClass:"freelance-section"},[n("h4",{staticClass:"bg-warning font-weight-bold mb-4 p-2"},[e._v(e._s(e.freelance))]),n("button",{staticClass:"load-btn mr-5",class:{disabled:e.loading||e.btnDisabled},attrs:{disabled:e.loading||e.btnDisabled},on:{click:e.load}},[e._v("Load")]),n("button",{staticClass:"abort-btn mr-5",class:{disabled:e.loading||!e.btnDisabled||e.abortBtnDisabled},attrs:{disabled:e.loading||!e.btnDisabled||e.abortBtnDisabled},on:{click:e.abortLoad}},[e._v("Abort")]),null!==e.updateTime?n("span",{staticClass:"text-danger font-weight-bold mr-5"},[e._v("Last Update: "),n("span",{staticClass:"text-dark"},[e._v(e._s(e.updateTime))])]):e._e(),null!==e.nextUpdate?n("span",{staticClass:"text-danger font-weight-bold"},[e._v("Next Update: "),n("span",{staticClass:"text-dark"},[e._v(e._s(e.nextUpdate))])]):e._e(),e.loading?n("p",[e._v("Loading...")]):e._e(),null!==e.projects?n("div",{staticClass:"sections"},e._l(e.projects,(function(t,r){return n("Section",{key:r,attrs:{projects:t,newProjects:void 0!==e.newProjects[r]?e.newProjects[r]:[],section:r,freelance:e.freelance}})})),1):n("div",[e._v(" Projects not loaded. ")])])},o=[],i=(n("96cf"),n("1da1")),l=n("c1df"),u=n.n(l),d=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("section",{staticClass:"section"},[n("h4",{staticClass:"section-title font-weight-bold d-flex align-items-center bg-primary p-1 mb-2",on:{click:function(t){e.opened=!e.opened}}},[n("span",[e._v(e._s(e.section)+" - "),n("span",{staticClass:"projects-count text-warning mr-5"},[e._v(e._s(e.projects.length))])]),e.newProjects.length?n("span",{staticClass:"new-count bg-light text-danger"},[e._v(e._s(e.newProjects.length))]):e._e()]),e.opened?n("div",{staticClass:"wrap"},[n("div",{staticClass:"pagination"},[n("button",{staticClass:"pagination-btn",class:0===e.currentPage?"disabled":"",attrs:{disabled:0===e.currentPage},on:{click:e.prevPage}},[e._v("prev")]),n("button",{staticClass:"pagination-btn",class:e.currentPage===e.pageCnt-1?"disabled":"",attrs:{disabled:e.currentPage===e.pageCnt-1},on:{click:e.nextPage}},[e._v("next")]),n("span",{staticClass:"page-count font-weight-bold"},[n("span",[e._v(e._s(e.currentPage+1))]),e._v(" / "),n("span",[e._v(e._s(e.pageCnt))])]),n("button",{staticClass:"pagination-btn all-btn",class:e.allOpened?"disabled":"",attrs:{disabled:e.allOpened},on:{click:e.cardsOpen}},[e._v("all")]),n("button",{staticClass:"pagination-btn new-btn",class:e.newProjects.length&&e.allOpened?"":"disabled",attrs:{disabled:!e.newProjects.length||!e.allOpened},on:{click:e.cardsOpen}},[e._v("new")]),n("button",{staticClass:"pagination-btn reset-btn",class:e.newProjects.length?"":"disabled",attrs:{disabled:!e.newProjects.length},on:{click:e.resetNew}},[e._v("reset new")])]),n("div",{staticClass:"cards"},e._l(e.projectsPerPage,(function(t){return n("Card",{key:t.link,attrs:{proj:t,section:e.section,freelance:e.freelance,newProjects:e.newProjects}})})),1),n("div",{staticClass:"pagination"},[n("button",{staticClass:"pagination-btn",class:0===e.currentPage?"disabled":"",attrs:{disabled:0===e.currentPage},on:{click:e.prevPage}},[e._v("prev")]),n("button",{staticClass:"pagination-btn",class:e.currentPage===e.pageCnt-1?"disabled":"",attrs:{disabled:e.currentPage===e.pageCnt},on:{click:e.nextPage}},[e._v("next")]),n("span",{staticClass:"page-count font-weight-bold"},[n("span",[e._v(e._s(e.currentPage+1))]),e._v(" / "),n("span",[e._v(e._s(e.pageCnt))])]),n("button",{staticClass:"pagination-btn all-btn",class:e.allOpened?"disabled":"",attrs:{disabled:e.allOpened},on:{click:e.cardsOpen}},[e._v("all")]),n("button",{staticClass:"pagination-btn new-btn",class:e.newProjects.length&&e.allOpened?"":"disabled",attrs:{disabled:!e.newProjects.length||!e.allOpened},on:{click:e.cardsOpen}},[e._v("new")]),n("button",{staticClass:"pagination-btn reset-btn",class:e.newProjects.length?"":"disabled",attrs:{disabled:!e.newProjects.length},on:{click:e.resetNew}},[e._v("reset new")])])]):e._e()])},f=[],b=(n("fb6a"),function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{staticClass:"card bg-light",on:{click:function(t){return e.cardOpen(t)}}},[n("h5",{staticClass:"mb-1 font-weight-bold"},[e._v(e._s(e.proj.title)+" "),void 0!==e.proj.premium&&e.proj.premium?n("span",{staticClass:"text-danger ml-2"},[e._v('"Premium"')]):e._e(),void 0!==e.proj.fast&&e.proj.fast?n("span",{staticClass:"text-danger ml-2"},[e._v('"Fast"')]):e._e(),void 0!==e.proj.fixed&&e.proj.fixed?n("span",{staticClass:"text-danger ml-2"},[e._v('"Fixed"')]):e._e(),e.newProj?n("span",{staticClass:"text-danger ml-2"},[e._v('"New"')]):e._e()]),n("a",{staticClass:"mb-1",attrs:{href:e.proj.link,target:"_blank",rel:"noopener noreferrer"}},[e._v(e._s(e.proj.link))]),n("span",{staticClass:"mb-1 font-weight-bold"},[e._v("Bets: "),n("span",{staticClass:"text-size",class:e.betsClass},[e._v(e._s(e.bets))])]),n("span",{staticClass:"mb-1 font-weight-bold"},[e._v("Time: "),n("span",{staticClass:"text-primary"},[e._v(e._s(e.time))])]),e.secondaryOpened?n("div",{staticClass:"secondary-container"},[n("div",{staticClass:"mb-1"},[e._v("Description: "+e._s(e.description))]),n("div",{staticClass:"mb-1 font-weight-bold"},[e._v("Budget: "),n("span",{class:"null"!==e.budget?"text-size text-success":"text-primary"},[e._v(e._s(e.budget))])]),n("div",{staticClass:"mb-1"},[e._v("Skills: "+e._s(e.skills))]),n("div",{staticClass:"mb-1"},[e._v("Published: "+e._s(e.published))]),void 0!==e.proj.fast?n("div",{staticClass:"mb-1"},[e._v("Fast: "+e._s(e.proj.fast))]):e._e(),void 0!==e.proj.fixed?n("div",{staticClass:"mb-1"},[e._v("Fixed: "+e._s(e.proj.fixed))]):e._e(),void 0!==e.proj.premium?n("div",{staticClass:"mb-1"},[e._v("Premium: "+e._s(e.proj.premium))]):e._e()]):e._e()])}),j=[],p=(n("a4d3"),n("e01a"),n("4160"),n("c975"),n("9911"),n("159b"),{props:["proj","newProjects","section","freelance"],data:function(){return{secondaryOpened:!1}},computed:{betsClass:function(){return parseInt(this.proj.bets)<=5?"text-success":parseInt(this.proj.bets)<=10?"text-warning":"text-danger"},bets:function(){return this.proj.bets},description:function(){return null===this.proj.description?"null":this.proj.description},budget:function(){return null===this.proj.budget?"null":this.proj.budget},skills:function(){return null===this.proj.skills?"null":this.proj.skills},time:function(){return null===this.proj.time?"null":this.proj.time},published:function(){return null===this.proj.published?"null":this.proj.published},newProj:function(){if(void 0!==this.newProjects){var e=[];return this.newProjects.forEach((function(t){e.push(t.link)})),-1!==e.indexOf(this.proj.link)}return!1}},methods:{cardOpen:function(e){"A"!==e.target.tagName&&(this.secondaryOpened=!this.secondaryOpened)}}}),g=p,h=(n("0ab0"),n("2877")),m=Object(h["a"])(g,b,j,!1,null,null,null),v=m.exports,w={props:["projects","newProjects","section","freelance"],components:{Card:v},data:function(){return{opened:!1,allOpened:!0,currentPage:0,allPage:0,newPage:0,cardsPerPage:6}},computed:{pageCnt:function(){var e=this.allOpened?this.projects.length:this.newProjects.length;return Math.ceil(e/this.cardsPerPage)},projectsPerPage:function(){var e=this.currentPage*this.cardsPerPage,t=e+this.cardsPerPage;return this.allOpened?this.projects.slice(e,t):this.newProjects.slice(e,t)}},methods:{nextPage:function(){this.currentPage!==this.pageCnt-1&&this.opened&&(this.allOpened?this.allPage++:this.newPage++,this.currentPage++)},prevPage:function(){0!==this.currentPage&&this.opened&&(this.allOpened?this.allPage--:this.newPage--,this.currentPage--)},cardsOpen:function(){this.allOpened=!this.allOpened,this.currentPage=this.allOpened?this.allPage:this.newPage},resetNew:function(){this.allOpened=!0,this.$store.commit("resetNewProjects",{freelance:this.freelance.toLowerCase(),section:this.section})}}},P=w,_=(n("c4b8"),Object(h["a"])(P,d,f,!1,null,null,null)),k=_.exports,x={props:["projects","newProjects","freelance"],components:{Section:k},created:function(){},data:function(){return{btnDisabled:!1,abortBtnDisabled:!1,updateTime:null,nextUpdate:null,interval:null,sound:null,firstTime:!0}},computed:{loading:function(){return this.$store.getters["is".concat(this.freelance,"Loading")]}},methods:{load:function(){var e=this;return Object(i["a"])(regeneratorRuntime.mark((function t(){var n;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.btnDisabled=!0,t.next=3,e.$store.dispatch("fetchProjects",{freelance:e.freelance.toLowerCase()});case 3:if(n=t.sent,!n.data.start){t.next=8;break}return t.next=7,e.recursiveLoad(e.firstTime);case 7:e.firstTime=!1;case 8:case"end":return t.stop()}}),t)})))()},recursiveLoad:function(e){var t=this;return Object(i["a"])(regeneratorRuntime.mark((function n(){var r;return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:return console.log("".concat(t.freelance," start projects read")),n.prev=1,n.next=4,t.$store.dispatch("readProjects",{freelance:t.freelance.toLowerCase(),firstTime:e});case 4:return r=n.sent,n.next=7,t.nextLoad(r);case 7:n.next=12;break;case 9:n.prev=9,n.t0=n["catch"](1),console.log(n.t0);case 12:case"end":return n.stop()}}),n,null,[[1,9]])})))()},nextLoad:function(e){var t=this;return Object(i["a"])(regeneratorRuntime.mark((function n(){var r,a;return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:r=u()("3:00","m:ss"),a=60*r.minutes(),t.updateTime=e,t.nextUpdate=r.format("m:ss"),t.interval=setInterval(Object(i["a"])(regeneratorRuntime.mark((function e(){return regeneratorRuntime.wrap((function(e){while(1)switch(e.prev=e.next){case 0:if(t.nextUpdate=r.subtract(1,"second").format("m:ss"),a--,0!==a){e.next=6;break}return clearInterval(t.interval),e.next=6,t.recursiveLoad(t.firstTime);case 6:case"end":return e.stop()}}),e)}))),1e3);case 5:case"end":return n.stop()}}),n)})))()},abortLoad:function(){var e=this;return Object(i["a"])(regeneratorRuntime.mark((function t(){var n,r;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:return e.abortBtnDisabled=!0,n=e.freelance.toLowerCase(),t.next=4,e.$store.dispatch("abortLoad",{freelance:n});case 4:r=t.sent,r.data.aborted&&(e.$store.commit("setLoading",{val:!1,freelance:n}),e.btnDisabled=!1,clearInterval(e.interval),e.nextUpdate="none",e.abortBtnDisabled=!1);case 6:case"end":return t.stop()}}),t)})))()}}},C=x,O=Object(h["a"])(C,c,o,!1,null,null,null),y=O.exports,N={name:"App",components:{Freelance:y},mounted:function(){},data:function(){return{activeItem:"Fl.hunt"}},computed:{flComponents:function(){return[{title:"Fl.hunt",component:"Flhunt",projects:this.$store.getters.getFlhuntProjects,newProjects:this.$store.getters.getFlhuntNewProjects},{title:"Weblancer",component:"Weblancer",projects:this.$store.getters.getWeblancerProjects,newProjects:this.$store.getters.getWeblancerNewProjects},{title:"Fl.habr",component:"Flhabr",projects:this.$store.getters.getFlhabrProjects,newProjects:this.$store.getters.getFlhabrNewProjects},{title:"Freelance.ru",component:"Freelanceru",projects:this.$store.getters.getFreelanceruProjects,newProjects:this.$store.getters.getFreelanceruNewProjects},{title:"Fl.ru",component:"Flru",projects:this.$store.getters.getFlruProjects,newProjects:this.$store.getters.getFlruNewProjects}]},newProjectsExists:function(){return function(e){for(var t in e)if(e[t].length)return!0;return!1}}},methods:{isActive:function(e){return this.activeItem===e},setActive:function(e){this.activeItem=e}}},L=N,F=(n("034f"),Object(h["a"])(L,a,s,!1,null,null,null)),z=F.exports,$=n("5f5b"),A=n("b1e0"),R=(n("99af"),n("4de4"),n("d81d"),n("a434"),n("2909")),E=n("2f62"),T=n("bc3a"),D=n.n(T);r["default"].use(E["a"]);var S=new E["a"].Store({state:{url:"",weblancerError:"",weblancerLoading:!1,weblancerProjects:null,weblancerNewProjects:{},weblancerNewProjectsAll:{},flhuntError:"",flhuntLoading:!1,flhuntProjects:null,flhuntNewProjects:{},flhuntNewProjectsAll:{},flhabrError:"",flhabrLoading:!1,flhabrProjects:null,flhabrNewProjects:{},flhabrNewProjectsAll:{},freelanceruError:"",freelanceruLoading:!1,freelanceruProjects:null,freelanceruNewProjects:{},freelanceruNewProjectsAll:{},flruError:"",flruLoading:!1,flruProjects:null,flruNewProjects:{},flruNewProjectsAll:{}},getters:{getWeblancerProjects:function(e){return e.weblancerProjects},getWeblancerNewProjects:function(e){return e.weblancerNewProjects},isWeblancerLoading:function(e){return e.weblancerLoading},getFlhuntProjects:function(e){return e.flhuntProjects},getFlhuntNewProjects:function(e){return e.flhuntNewProjects},isFlhuntLoading:function(e){return e.flhuntLoading},getFlhabrProjects:function(e){return e.flhabrProjects},getFlhabrNewProjects:function(e){return e.flhabrNewProjects},isFlhabrLoading:function(e){return e.flhabrLoading},getFreelanceruProjects:function(e){return e.freelanceruProjects},getFreelanceruNewProjects:function(e){return e.freelanceruNewProjects},isFreelanceruLoading:function(e){return e.freelanceruLoading},getFlruProjects:function(e){return e.flruProjects},getFlruNewProjects:function(e){return e.flruNewProjects},isFlruLoading:function(e){return e.flruLoading}},mutations:{setError:function(e,t){e.weblancerError=t},clearError:function(e){e.error=""},setLoading:function(e,t){e["".concat(t.freelance,"Loading")]=t.val},updateProjects:function(e,t){var n,a=t.freelance,s=t.arrName,c=t.projects,o=t.deleted;(null===e["".concat(a,"Projects")]&&(e["".concat(a,"Projects")]={}),o&&o.length&&(e["".concat(a,"Projects")][s]=e["".concat(a,"Projects")][s].filter((function(e){return-1===o.indexOf(e.link)}))),c&&c.length)&&(void 0===e["".concat(a,"Projects")][s]?r["default"].set(e["".concat(a,"Projects")],""+s,c.map((function(e){return Object.assign({},e)}))):(n=e["".concat(a,"Projects")][s]).unshift.apply(n,Object(R["a"])(c.map((function(e){return Object.assign({},e)})))))},resetNewProjects:function(e,t){while(0!==e["".concat(t.freelance,"NewProjects")][t.section].length)e["".concat(t.freelance,"NewProjects")][t.section].splice(0,1)},resetNewProjectsAll:function(e,t){var n=t.freelance,r=t.data.arrName,a=e["".concat(n,"NewProjects")],s=e["".concat(n,"NewProjectsAll")];void 0!==a[r]&&(a[r].length?s[r]=a[r].map((function(e){return e.link})):s[r]=[])}},actions:{abortLoad:function(e,t){return Object(i["a"])(regeneratorRuntime.mark((function n(){var r;return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:return r=e.state,e.commit,n.prev=1,n.next=4,D.a.get("".concat(r.url,"/api/").concat(t.freelance,"-abort"));case 4:return n.abrupt("return",n.sent);case 7:n.prev=7,n.t0=n["catch"](1),console.log(n.t0);case 10:case"end":return n.stop()}}),n,null,[[1,7]])})))()},setProjects:function(e,t){return Object(i["a"])(regeneratorRuntime.mark((function n(){var a,s,c,o,i,l,u,d,f,b,j;return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:return a=e.state,s=e.commit,c=t.data,o=c.arrName,i=c.deleted,l=t.data.newProjects,u=t.data[o],d=t.freelance,f=!1,null===a["".concat(d,"Projects")]&&(a["".concat(d,"Projects")]={}),r["default"].set(a["".concat(d,"Projects")],""+o,u.map((function(e){return Object.assign({},e)}))),null!==l&&(b=a["".concat(d,"NewProjects")],j=a["".concat(d,"NewProjectsAll")],j[o]=l.map((function(e){return e.link})),r["default"].set(b,""+o,l.map((function(e){return Object.assign({},e)}))),f=!0),s("updateProjects",{freelance:d,arrName:o,projects:l,deleted:i}),n.abrupt("return",f);case 11:case"end":return n.stop()}}),n)})))()},addNewProjects:function(e,t){return Object(i["a"])(regeneratorRuntime.mark((function n(){var a,s,c,o,i,l,u,d,f;return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:return a=e.state,s=e.commit,c=t.freelance,o=t.data.arrName,i=a["".concat(c,"NewProjects")],l=a["".concat(c,"NewProjectsAll")],u=t.data[o],d=t.data.deleted,f=!1,u.length&&(void 0===i[o]?(r["default"].set(i,""+o,u.map((function(e){return Object.assign({},e)}))),l[o]=u.map((function(e){return e.link})),f=!0):(u=u.filter((function(e){return-1===l[o].indexOf(e.link)})),u.length&&(console.log(o,u.length),l[o]=[].concat(Object(R["a"])(u.map((function(e){return e.link}))),Object(R["a"])(l[o])),r["default"].set(i,""+o,[].concat(Object(R["a"])(u.map((function(e){return Object.assign({},e)}))),Object(R["a"])(i[o].map((function(e){return Object.assign({},e)}))))),f=!0))),s("updateProjects",{freelance:c,arrName:o,projects:u,deleted:d}),n.abrupt("return",f);case 11:case"end":return n.stop()}}),n)})))()},fetchProjects:function(e,t){return Object(i["a"])(regeneratorRuntime.mark((function n(){var r,a,s,c;return regeneratorRuntime.wrap((function(n){while(1)switch(n.prev=n.next){case 0:r=e.state,a=e.commit,s=t.freelance,n.t0=s,n.next="weblancer"===n.t0?5:"flhunt"===n.t0?7:"flhabr"===n.t0?9:"freelanceru"===n.t0?11:"flru"===n.t0?13:15;break;case 5:return c="?type=cheerio",n.abrupt("break",15);case 7:return c="?type=cheerio",n.abrupt("break",15);case 9:return c="",n.abrupt("break",15);case 11:return c="",n.abrupt("break",15);case 13:return c="",n.abrupt("break",15);case 15:return a("clearError"),a("setLoading",{val:!0,freelance:s}),n.prev=17,n.next=20,D.a.get("".concat(r.url,"/api/").concat(s,"-start").concat(c));case 20:return n.abrupt("return",n.sent);case 23:n.prev=23,n.t1=n["catch"](17),console.log(n.t1);case 26:case"end":return n.stop()}}),n,null,[[17,23]])})))()},readProjects:function(e,t){return Object(i["a"])(regeneratorRuntime.mark((function r(){var a,s,c,o,i,l,u,d,f,b,j,p,g,h;return regeneratorRuntime.wrap((function(r){while(1)switch(r.prev=r.next){case 0:return a=e.state,s=e.dispatch,c=e.commit,o=t.freelance,i=t.firstTime,c("clearError"),c("setLoading",{val:!0,freelance:o}),r.prev=5,r.next=8,D.a.get("".concat(a.url,"/api/").concat(o,"-projects?cnt=0&firstTime=").concat(i));case 8:l=r.sent,u=l.data.cnt,d=l.data.date,f=!1;case 12:if(0===u){r.next=36;break}return r.next=15,D.a.get("".concat(a.url,"/api/").concat(o,"-projects?cnt=").concat(u,"&firstTime=").concat(i));case 15:if(b=r.sent,u=b.data.cnt,j=b.data.arrName,delete b.data.cnt,!i){r.next=26;break}return r.next=22,s("setProjects",{data:b.data,freelance:o});case 22:p=r.sent,f||(f=p),r.next=34;break;case 26:if(!b.data[j].length&&!b.data.deleted.length){r.next=33;break}return r.next=29,s("addNewProjects",{data:b.data,freelance:o});case 29:g=r.sent,f||(f=g),r.next=34;break;case 33:b.data.newProjectsCleaned&&c("resetNewProjectsAll",{data:b.data,freelance:o});case 34:r.next=12;break;case 36:return f&&(h=new Audio(n("cc6d")),h.volume=.8,h.play()),c("setLoading",{val:!1,freelance:o}),r.abrupt("return",d);case 41:r.prev=41,r.t0=r["catch"](5),console.log(r.t0),c("setLoading",{val:!1,freelance:o});case 45:case"end":return r.stop()}}),r,null,[[5,41]])})))()}}}),U=n("8c4f");r["default"].use(U["a"]);var I=new U["a"]({mode:"history",base:"/",linkActiveClass:"active",routes:[]});n("f9e3"),n("2dd8"),n("36f5");r["default"].use($["a"]),r["default"].use(A["a"]),r["default"].config.productionTip=!1,r["default"].config.devtools=!0,r["default"].config.performance=!0,new r["default"]({store:S,router:I,render:function(e){return e(z)}}).$mount("#app")},"85ec":function(e,t,n){},c432:function(e,t,n){},c4b8:function(e,t,n){"use strict";var r=n("e37d"),a=n.n(r);a.a},cc6d:function(e,t,n){e.exports=n.p+"media/sms.863c9ae1.mp3"},e37d:function(e,t,n){}});
//# sourceMappingURL=app.bb9678cc.js.map
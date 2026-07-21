import React from 'react';
import { useState, useEffect, useCallback, useRef } from "react";

const STATUS_FLOW = [
  { key: "Order Placed",     icon: "\uD83D\uDED2", label: "Order Placed",     desc: "Order received and confirmed" },
  { key: "In Process",       icon: "\uD83D\uDDC2",  label: "In Process",       desc: "Shipment being prepared" },
  { key: "In Transit",       icon: "\u2708\uFE0F",  label: "In Transit",       desc: "Shipment on its way" },
  { key: "Customs Check",    icon: "\uD83D\uDEC3",  label: "Customs Check",    desc: "Under customs inspection" },
  { key: "Out for Delivery", icon: "\uD83D\uDE9A",  label: "Out for Delivery", desc: "With delivery agent" },
  { key: "Delivered",        icon: "\u2705",         label: "Delivered",        desc: "Successfully delivered" },
];
const STATUS_KEYS = STATUS_FLOW.map(s => s.key);
const STATUS_STYLE = {
  "Order Placed":     { bg:"#f0fdf4", color:"#166534", border:"#4ade80" },
  "In Process":       { bg:"#fef3c7", color:"#92400e", border:"#f59e0b" },
  "In Transit":       { bg:"#dbeafe", color:"#1e40af", border:"#3b82f6" },
  "Customs Check":    { bg:"#fce7f3", color:"#9d174d", border:"#ec4899" },
  "Out for Delivery": { bg:"#ede9fe", color:"#5b21b6", border:"#8b5cf6" },
  "Delivered":        { bg:"#d1fae5", color:"#065f46", border:"#10b981" },
};

let _seq = Date.now();
const uid         = () => `${++_seq}_${Math.random().toString(36).slice(2,7)}`;
const genTracking = () => `YVC-${new Date().getFullYear()}-${Math.floor(Math.random()*900000+100000)}`;
const fmtDate     = d  => d ? new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : "TBD";
const fmtDT       = d  => new Date(d).toLocaleString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
const hashPw      = s  => btoa(encodeURIComponent(s));

const LS = {
  get: k     => { try { return JSON.parse(localStorage.getItem(k)); } catch(e) { return null; } },
  set: (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} },
  del: k     => { try { localStorage.removeItem(k); } catch(e) {} },
};

const SEED_USERS = [
  { id:"admin_001", name:"Admin", email:"admin@yvexcargo.com", password:hashPw("qwertyuiop22"), role:"admin", active:true, createdAt:"2024-01-01T00:00:00Z" },
];

const SEED_SHIPMENTS = [
  {
    id:"s001", trackingId:"YVC-2024-001847", userId:null,
    senderName:"Schneider Logistics GmbH", receiverName:"James Carter",
    origin:"Hamburg, Germany", destination:"New York, USA",
    service:"Sea Freight", weight:"250kg", description:"Electronics", estimatedDelivery:"2024-01-15",
    status:"Delivered", currentLocation:"New York, USA",
    createdAt:"2024-01-01T08:00:00Z", updatedAt:"2024-01-15T14:30:00Z",
    adminNotes:[{id:"n1",text:"Cleared by US customs without issues",visibleToCustomer:true,adminName:"Admin",createdAt:"2024-01-10T09:00:00Z"}],
    logs:[
      {id:"l1",status:"Order Placed",    location:"Hamburg, Germany",              note:"Order confirmed. Shipment booked.",                        time:"2024-01-01T08:00:00Z"},
      {id:"l2",status:"In Process",      location:"Hamburg, Germany",              note:"Received at origin warehouse. Packaging complete.",        time:"2024-01-01T10:00:00Z"},
      {id:"l3",status:"In Transit",      location:"Hamburg Port, Germany",         note:"Export customs cleared. Loaded on MV Atlantic Star.",      time:"2024-01-03T08:00:00Z"},
      {id:"l4",status:"Customs Check",   location:"Port Newark, NJ, USA",          note:"Presented to US Customs and Border Protection.",          time:"2024-01-10T07:00:00Z",customsLocation:"Port Newark CBP Office, NJ",customsNote:"Standard inspection. No issues flagged."},
      {id:"l5",status:"Out for Delivery",location:"YvexCargo Warehouse, New York", note:"US customs cleared. Assigned to delivery agent.",         time:"2024-01-14T09:00:00Z"},
      {id:"l6",status:"Delivered",       location:"New York, USA",                 note:"Delivered. Signed by James Carter.",                      time:"2024-01-15T14:30:00Z"},
    ],
  },
  {
    id:"s002", trackingId:"YVC-2024-003291", userId:null,
    senderName:"Dubois and Fils Trading", receiverName:"Michael Thompson",
    origin:"Lyon, France", destination:"Chicago, USA",
    service:"Express Courier", weight:"5kg", description:"Documents and Parcels", estimatedDelivery:"2024-02-20",
    status:"Out for Delivery", currentLocation:"Chicago, IL",
    createdAt:"2024-02-17T14:00:00Z", updatedAt:"2024-02-19T16:00:00Z",
    adminNotes:[],
    logs:[
      {id:"l7", status:"Order Placed",    location:"Lyon, France",       note:"Order received and confirmed.",                   time:"2024-02-17T14:00:00Z"},
      {id:"l8", status:"In Process",      location:"Lyon, France",       note:"Package collected and documented.",               time:"2024-02-18T09:00:00Z"},
      {id:"l9", status:"In Transit",      location:"CDG Airport, Paris", note:"Departed CDG on flight AF068 to Chicago.",       time:"2024-02-18T18:00:00Z"},
      {id:"l10",status:"Out for Delivery",location:"Chicago, IL",        note:"Cleared US customs. With local delivery agent.", time:"2024-02-19T16:00:00Z"},
    ],
  },
  {
    id:"s003", trackingId:"YVC-2024-005512", userId:null,
    senderName:"BioMed Solutions Ltd", receiverName:"Sophia Mueller",
    origin:"London, UK", destination:"Berlin, Germany",
    service:"Air Freight", weight:"18kg", description:"Medical Equipment", estimatedDelivery:"2024-02-28",
    status:"Customs Check", currentLocation:"Berlin Customs Office",
    createdAt:"2024-02-19T10:00:00Z", updatedAt:"2024-02-22T11:00:00Z",
    adminNotes:[
      {id:"n2",text:"Held — additional CE certification documents required",visibleToCustomer:false,adminName:"Admin",createdAt:"2024-02-22T11:00:00Z"},
      {id:"n3",text:"Documents submitted. Awaiting officer review.",visibleToCustomer:true,adminName:"Admin",createdAt:"2024-02-23T14:00:00Z"},
    ],
    logs:[
      {id:"l11",status:"Order Placed", location:"London, UK",               note:"Order placed by BioMed Solutions Ltd.",               time:"2024-02-19T10:00:00Z"},
      {id:"l12",status:"In Process",   location:"London, UK",               note:"Picked up. Export paperwork processed.",              time:"2024-02-20T07:00:00Z"},
      {id:"l13",status:"In Transit",   location:"Heathrow Airport, London", note:"Departed on flight BA902 to Berlin.",                time:"2024-02-20T22:00:00Z"},
      {id:"l14",status:"Customs Check",location:"Berlin Customs, Germany",  note:"Presented to German Federal Customs Office.",        time:"2024-02-22T11:00:00Z",customsLocation:"Zollamt Berlin, Wolfener Str. 32",customsNote:"CE certification documents required. Shipment held."},
    ],
  },
];

function dbInit() {
  // Always reset the admin user to ensure credentials stay current
  var users = LS.get("yvc_users") || [];
  var nonAdmins = users.filter(function(u){ return u.role !== "admin"; });
  LS.set("yvc_users", [SEED_USERS[0]].concat(nonAdmins));
  if (!LS.get("yvc_shipments")) LS.set("yvc_shipments", SEED_SHIPMENTS);
}
function dbGetUsers()       { return LS.get("yvc_users") || []; }
function dbSaveUsers(a)     { LS.set("yvc_users", a); }
function dbFindUser(email)  { return (LS.get("yvc_users")||[]).find(function(u){ return u.email===email; }); }
function dbGetShipments()   { return LS.get("yvc_shipments") || []; }
function dbSaveShipments(a) { LS.set("yvc_shipments", a); }
function dbFindShipment(id) { return (LS.get("yvc_shipments")||[]).find(function(s){ return s.id===id; }) || null; }
function dbFindByTracking(tid) {
  var upper = tid.toUpperCase();
  return (LS.get("yvc_shipments")||[]).find(function(s){ return s.trackingId.toUpperCase()===upper; }) || null;
}
function dbCreateShipment(ship) { var a=dbGetShipments(); a.push(ship); dbSaveShipments(a); }
function dbUpdateShipment(id, fields) {
  dbSaveShipments(dbGetShipments().map(function(s){ return s.id===id ? Object.assign({},s,fields,{updatedAt:new Date().toISOString()}) : s; }));
}
function dbDeleteShipment(id) { dbSaveShipments(dbGetShipments().filter(function(s){ return s.id!==id; })); }
function dbAppendLog(shipmentId, entry) {
  dbSaveShipments(dbGetShipments().map(function(s){
    if (s.id!==shipmentId) return s;
    return Object.assign({},s,{status:entry.status,currentLocation:entry.location,updatedAt:entry.time,logs:(s.logs||[]).concat([entry])});
  }));
}
function dbAddNote(shipmentId, note) {
  dbSaveShipments(dbGetShipments().map(function(s){
    return s.id===shipmentId ? Object.assign({},s,{adminNotes:(s.adminNotes||[]).concat([note])}) : s;
  }));
}
function dbUpdateNote(shipmentId, noteId, changes) {
  dbSaveShipments(dbGetShipments().map(function(s){
    if (s.id!==shipmentId) return s;
    return Object.assign({},s,{adminNotes:s.adminNotes.map(function(n){ return n.id===noteId ? Object.assign({},n,changes) : n; })});
  }));
}
function dbDeleteNote(shipmentId, noteId) {
  dbSaveShipments(dbGetShipments().map(function(s){
    if (s.id!==shipmentId) return s;
    return Object.assign({},s,{adminNotes:s.adminNotes.filter(function(n){ return n.id!==noteId; })});
  }));
}
function dbGetSession()   { return LS.get("yvc_session"); }
function dbSaveSession(s) { LS.set("yvc_session", s); }
function dbClearSession() { LS.del("yvc_session"); }

const DB = {
  init:dbInit, getUsers:dbGetUsers, saveUsers:dbSaveUsers, findUser:dbFindUser,
  getShipments:dbGetShipments, saveShipments:dbSaveShipments, findShipment:dbFindShipment, findByTracking:dbFindByTracking,
  createShipment:dbCreateShipment, updateShipment:dbUpdateShipment, deleteShipment:dbDeleteShipment,
  appendLog:dbAppendLog, addNote:dbAddNote, updateNote:dbUpdateNote, deleteNote:dbDeleteNote,
  getSession:dbGetSession, saveSession:dbSaveSession, clearSession:dbClearSession,
};

const Auth = {
  login: function(email, password) {
    var u = DB.findUser(email);
    if (!u || u.password !== hashPw(password)) return { error:"Invalid email or password" };
    if (!u.active) return { error:"Account suspended. Contact support." };
    var sess = { userId:u.id, role:u.role, name:u.name, email:u.email };
    DB.saveSession(sess);
    return { session:sess };
  },
  register: function(name, email, password) {
    if (DB.findUser(email)) return { error:"Email already registered" };
    var u = { id:uid(), name:name, email:email, password:hashPw(password), role:"user", active:true, createdAt:new Date().toISOString() };
    DB.saveUsers(DB.getUsers().concat([u]));
    return { user:u };
  },
  logout:  function() { DB.clearSession(); },
  current: function() { return DB.getSession(); },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
:root{--y:#f59e0b;--y2:#fbbf24;--yp:#fef3c7;--ypp:#fffbeb;--k:#111;--g2:#f4f4f4;--g3:#e5e5e5;--g4:#a3a3a3;--g5:#525252;--pu:#4d148c;--pu2:#6d28d9;}
body{font-family:'Sora',sans-serif;background:#fff;color:#111;line-height:1.6;}
button{cursor:pointer;font-family:inherit;border:none;outline:none;}
input,select,textarea{font-family:inherit;outline:none;}
.mono{font-family:'Space Mono',monospace;}
.fade{animation:fi .25s ease forwards;}
@keyframes fi{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}
.btn{display:inline-flex;align-items:center;gap:6px;border-radius:8px;font-weight:700;font-size:13px;transition:all .15s;padding:10px 20px;cursor:pointer;}
.btn-y{background:var(--y);color:#111;box-shadow:0 3px 10px rgba(245,158,11,.25);}
.btn-y:hover{background:var(--y2);transform:translateY(-1px);}
.btn-y:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.btn-k{background:#111;color:#fff;}.btn-k:hover{background:#333;}
.btn-o{background:transparent;color:#111;border:2px solid #111;}.btn-o:hover{background:#111;color:#fff;}
.btn-g{background:transparent;color:var(--g5);border:1.5px solid var(--g3);}.btn-g:hover{border-color:#111;color:#111;}
.btn-r{background:#fee2e2;color:#dc2626;}.btn-r:hover{background:#fca5a5;}
.sm{padding:6px 12px!important;font-size:12px!important;}
.inp{width:100%;padding:11px 14px;border:1.5px solid var(--g3);border-radius:8px;font-size:13px;background:#fff;color:#111;transition:border-color .2s,box-shadow .2s;}
.inp:focus{border-color:var(--y);box-shadow:0 0 0 3px rgba(245,158,11,.12);}
.inp::placeholder{color:var(--g4);}
.lbl{font-size:11px;font-weight:700;color:#111;margin-bottom:5px;display:block;letter-spacing:.04em;text-transform:uppercase;}
.fg{margin-bottom:14px;}
select.inp{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%23111' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px;}
.card{background:#fff;border:2px solid #111;border-radius:14px;padding:22px;box-shadow:0 2px 14px rgba(0,0,0,.07);}
.card-k{background:#111;border-radius:14px;padding:22px;}
table{width:100%;border-collapse:collapse;}
th{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:10px 14px;text-align:left;border-bottom:2px solid #111;background:var(--ypp);}
td{padding:11px 14px;font-size:13px;border-bottom:1px solid var(--g2);color:var(--g5);vertical-align:middle;}
tr:hover td{background:var(--ypp);}
tr:last-child td{border-bottom:none;}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;}
.mbox{background:#fff;border-radius:20px;padding:28px;width:100%;max-width:640px;max-height:92vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.18);border:2px solid #111;}
.sidebar{width:230px;min-width:230px;background:#111;min-height:100vh;display:flex;flex-direction:column;}
.slink{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:8px;color:rgba(255,255,255,.5);font-size:13px;font-weight:600;cursor:pointer;transition:all .13s;margin-bottom:3px;}
.slink:hover{background:rgba(255,255,255,.07);color:#fff;}
.slink.on{background:var(--y);color:#111;}
.nlink{color:var(--g5);font-size:13px;font-weight:600;padding:7px 13px;border-radius:8px;cursor:pointer;transition:all .13s;}
.nlink:hover{color:#111;background:var(--g2);}
.nlink.on{color:#111;background:var(--yp);}
.flink:hover{color:#111!important;text-decoration:underline;}
.tl-row{display:flex;gap:14px;position:relative;margin-bottom:8px;}
.tl-row:not(:last-child)::before{content:'';position:absolute;left:17px;top:38px;width:2px;bottom:-8px;background:var(--g3);z-index:0;}
.tl-row.is-past::before{background:var(--y);}
.tl-dot{width:36px;height:36px;min-width:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid var(--g3);background:#fff;z-index:1;position:relative;}
.tl-dot.is-past{border-color:var(--y);background:var(--yp);}
.tl-dot.is-cur{border-color:#111;background:#111;box-shadow:0 0 0 4px rgba(245,158,11,.28);}
.tl-body{flex:1;padding-bottom:4px;}
.stepbar{display:flex;align-items:center;}
.stepbar-seg{flex:1;height:4px;background:var(--g3);}
.stepbar-seg.done{background:var(--y);}
.stepbar-node{width:26px;height:26px;min-width:26px;border-radius:50%;border:2px solid var(--g3);background:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;transition:all .3s;}
.stepbar-node.done{background:var(--y);border-color:var(--y);color:#111;}
.stepbar-node.cur{background:#111;border-color:#111;color:var(--y);box-shadow:0 0 0 3px rgba(245,158,11,.3);}
.tabs{display:flex;gap:3px;background:var(--g2);padding:3px;border-radius:8px;border:1.5px solid var(--g3);width:fit-content;}
.tab{padding:7px 18px;border-radius:6px;font-size:13px;font-weight:600;color:var(--g5);cursor:pointer;transition:all .15s;}
.tab.on{background:var(--y);color:#111;}
.note-pub{background:var(--yp);border:1.5px solid var(--y);border-radius:10px;padding:12px 14px;margin-bottom:8px;}
.note-priv{background:var(--g2);border:1.5px solid var(--g3);border-radius:10px;padding:12px 14px;margin-bottom:8px;}
@keyframes bounce{0%,80%,100%{transform:translateY(0);}40%{transform:translateY(-6px);}}
@media(max-width:720px){.g2{grid-template-columns:1fr!important;}.g4{grid-template-columns:1fr 1fr!important;}.sidebar{width:190px;min-width:190px;}.hide-sm{display:none!important;}}

.reveal{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1);}
.reveal.in{opacity:1;transform:translateY(0);}

/* Ticker: slim, quiet, data-forward */
.ticker{overflow:hidden;white-space:nowrap;background:#0b0b0c;border-bottom:1px solid rgba(245,158,11,.3);}
.ticker-track{display:inline-block;padding:8px 0;animation:tick 38s linear infinite;}
.ticker-item{display:inline-flex;align-items:center;color:rgba(255,255,255,.4);font-size:10px;letter-spacing:.08em;padding:0 20px;}
.ticker-item b{color:rgba(255,255,255,.75);font-weight:700;margin-right:8px;letter-spacing:.12em;}
.ticker-dot{color:var(--y);margin-left:20px;opacity:.6;}
@keyframes tick{from{transform:translateX(0);}to{transform:translateX(-50%);}}

/* Hero: full-bleed cinematic photo, scrim for legibility, glass panel */
.hero-full{position:relative;min-height:600px;overflow:hidden;}
.hero-slide{position:absolute;inset:0;opacity:0;transition:opacity 1.4s ease;}
.hero-slide.on{opacity:1;}
.hero-slide img{width:100%;height:100%;object-fit:cover;display:block;}
.hero-scrim{position:absolute;inset:0;background:linear-gradient(100deg, rgba(10,10,11,.88) 0%, rgba(10,10,11,.6) 40%, rgba(10,10,11,.22) 68%, rgba(10,10,11,.08) 100%);}
.hero-scrim-b{position:absolute;inset:0;background:linear-gradient(0deg, rgba(10,10,11,.55) 0%, transparent 32%);}
.hero-content{position:relative;z-index:2;max-width:1200px;margin:0 auto;min-height:600px;display:flex;flex-direction:column;justify-content:center;padding:80px 20px 140px;}
.glass-panel{background:rgba(255,255,255,.08);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:18px 20px;max-width:420px;}
.stat-strip{position:absolute;left:0;right:0;bottom:0;z-index:2;background:rgba(10,10,11,.55);backdrop-filter:blur(10px);border-top:1px solid rgba(255,255,255,.12);}
.stat-strip-inner{max-width:1200px;margin:0 auto;display:flex;padding:18px 20px;}
.stat-strip-item{flex:1;padding:0 20px;border-left:1px solid rgba(255,255,255,.14);}
.stat-strip-item:first-child{border-left:none;padding-left:0;}

/* Service cards: quieter borders, larger editorial photos */
.svc-card{position:relative;border-radius:6px;overflow:hidden;border:1px solid rgba(0,0,0,.08);height:340px;box-shadow:0 1px 2px rgba(0,0,0,.04);}
.svc-card img{width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.16,1,.3,1);display:block;}
.svc-card:hover img{transform:scale(1.06);}
.svc-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.82) 100%);display:flex;flex-direction:column;justify-content:flex-end;padding:22px;}
.svc-tag{font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--y);margin-bottom:8px;}

/* Feature split */
.feat-photo{border-radius:6px;overflow:hidden;border:1px solid rgba(0,0,0,.08);height:420px;box-shadow:0 1px 2px rgba(0,0,0,.04);}
.feat-photo img{width:100%;height:100%;object-fit:cover;display:block;}
.feat-item{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--g2);}
.feat-item:last-child{border-bottom:none;}
.feat-check{width:20px;min-width:20px;font-size:14px;font-weight:700;color:var(--y);padding-top:3px;}

/* Testimonials: quiet, editorial, no boxes */
.test-card{padding:0 24px 0 0;border-right:1px solid var(--g3);height:100%;}
.test-quote-mark{font-family:'Space Mono',monospace;font-size:38px;color:var(--y);line-height:.5;display:block;margin-bottom:6px;}
.test-avatar{width:38px;height:38px;border-radius:50%;object-fit:cover;}

/* Parallax banner: cinematic, single accent, not costume-loud */
.parallax-banner{position:relative;height:360px;overflow:hidden;}
.parallax-banner img{position:absolute;inset:-10% 0;width:100%;height:120%;object-fit:cover;}
.parallax-tint{position:absolute;inset:0;background:linear-gradient(100deg, rgba(10,10,11,.82) 0%, rgba(10,10,11,.5) 45%, rgba(10,10,11,.18) 100%);}
.parallax-content{position:relative;z-index:2;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 20px;}
.eyebrow-line{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
.eyebrow-line span{font-weight:700;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--y);}
.eyebrow-line::after{content:"";flex:0 0 40px;height:1px;background:var(--y);opacity:.5;}

/* CTA: restrained, single accent underline */
.cta-quiet{background:#0b0b0c;position:relative;}
.cta-underline{width:56px;height:3px;background:var(--y);margin:0 auto 22px;}

.kb{animation:kb 16s ease-in-out infinite alternate;}
@keyframes kb{from{transform:scale(1);}to{transform:scale(1.1);}}

.track-hero{position:relative;height:340px;overflow:hidden;}
.track-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.track-hero-tint{position:absolute;inset:0;background:linear-gradient(100deg, rgba(10,10,11,.86) 0%, rgba(10,10,11,.6) 45%, rgba(10,10,11,.28) 100%);}
.track-hero-content{position:relative;z-index:2;max-width:900px;margin:0 auto;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 20px;}
@media(max-width:720px){.track-hero{height:300px;}}

.auth-wrap{display:grid;grid-template-columns:1fr 1fr;min-height:calc(100vh - 63px);}
.auth-photo{position:relative;overflow:hidden;}
.auth-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.auth-photo-tint{position:absolute;inset:0;background:linear-gradient(200deg, rgba(10,10,11,.15) 0%, rgba(10,10,11,.75) 100%);}
.auth-photo-content{position:relative;z-index:2;height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:48px;}
.auth-form-side{display:flex;align-items:center;justify-content:center;padding:40px 20px;}
@media(max-width:900px){.auth-wrap{grid-template-columns:1fr;}.auth-photo{display:none;}}
@media(prefers-reduced-motion:reduce){.reveal{transition:none;opacity:1;transform:none;}.ticker-track{animation:none;}.kb{animation:none;}}

/* Navbar mobile menu */
.nav-burger{display:none;flex-direction:column;justify-content:center;gap:5px;width:34px;height:34px;background:transparent;border:none;cursor:pointer;margin-left:auto;}
.nav-burger span{display:block;width:22px;height:2px;background:#111;border-radius:2px;}
.nav-mobile-menu{display:none;}

@media(max-width:760px){
  .nav-desktop{display:none!important;}
  .nav-burger{display:flex;}
  .nav-mobile-menu{display:flex;flex-direction:column;padding:14px 20px 18px;border-top:1px solid var(--g3);background:#fff;}
  .nav-mobile-link{padding:11px 4px;font-size:14px;font-weight:600;color:var(--g5);cursor:pointer;}
  .nav-mobile-link.on{color:#111;font-weight:800;}
}

/* Broader mobile pass */
@media(max-width:720px){
  .feat-photo{height:260px;}
  .hero-full{min-height:520px;}
  .hero-content{min-height:520px;padding:44px 20px 190px;}
  .hero-content h1{font-size:34px!important;}
  .glass-panel{max-width:100%;}
  .stat-strip-inner{flex-wrap:wrap;gap:14px 0;padding:14px 16px;}
  .stat-strip-item{flex:1 1 50%;border-left:none!important;padding-left:0!important;}
  .parallax-banner{height:220px;}
  .parallax-content h2{font-size:24px!important;}
  .svc-card{height:220px;}
  .test-card{border-right:none!important;padding-right:0!important;border-bottom:1px solid var(--g3);padding-bottom:24px;margin-bottom:24px;}
  .ticker-item{font-size:9px;padding:0 12px;}
}
@media(max-width:480px){
  .hero-content h1{font-size:28px!important;}
  .hero-content p{font-size:13px!important;}
  .stat-strip-item{flex:1 1 100%;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.12);}
}
`;

function YLogo(props) {
  var size = props.size || 36;
  var inv  = props.inv  || false;
  return React.createElement("svg", { width:size, height:size, viewBox:"0 0 100 100", fill:"none" },
    React.createElement("rect", { width:"100", height:"100", rx:"16", fill: inv ? "#fff" : "#111" }),
    React.createElement("path", { d:"M20 20L50 54", stroke:"#f59e0b", strokeWidth:"14", strokeLinecap:"round" }),
    React.createElement("path", { d:"M80 20L50 54", stroke:"#f59e0b", strokeWidth:"14", strokeLinecap:"round" }),
    React.createElement("path", { d:"M50 54L50 82", stroke:"#f59e0b", strokeWidth:"14", strokeLinecap:"round" })
  );
}

function Logo(props) {
  var inv = props.inv || false;
  return (
    <div style={{display:"flex",alignItems:"center",gap:9}}>
      <YLogo size={36} inv={inv} />
      <div style={{lineHeight:1.15}}>
        <div style={{fontWeight:900,fontSize:14,color:inv?"#fff":"#111",letterSpacing:"0.1em"}}>YVEXCARGO</div>
        <div style={{fontWeight:700,fontSize:8,color:"#f59e0b",letterSpacing:"0.14em"}}>INTERNATIONAL LOGISTICS</div>
      </div>
    </div>
  );
}

function SBadge(props) {
  var status = props.status;
  var s = STATUS_STYLE[status] || {bg:"#f4f4f4",color:"#525252",border:"#a3a3a3"};
  return (
    <span style={{background:s.bg,color:s.color,border:"1.5px solid "+s.border,padding:"3px 11px",borderRadius:100,fontSize:11,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
      <span style={{width:6,height:6,borderRadius:"50%",background:s.color}} />
      {status}
    </span>
  );
}

function Navbar(props) {
  var page=props.page, setPage=props.setPage, session=props.session, onLogout=props.onLogout;
  var [open, setOpen] = useState(false);
  function go(p){ return function(){ setPage(p); setOpen(false); }; }
  return (
    <nav style={{background:"#fff",borderBottom:"2px solid #111",position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",height:62}}>
        <div onClick={go("home")} style={{cursor:"pointer",marginRight:28}}><Logo /></div>
        <div className="nav-desktop" style={{display:"flex",gap:2,flex:1}}>
          {[["home","Home"],["services","Services"],["track","Track"]].map(function(item){
            return <span key={item[0]} className={"nlink "+(page===item[0]?"on":"")} onClick={go(item[0])}>{item[1]}</span>;
          })}
        </div>
        <div className="nav-desktop" style={{display:"flex",gap:8,alignItems:"center"}}>
          {session ? (
            <>
              <span className="nlink" style={{fontWeight:800}} onClick={go(session.role==="admin"?"admin":"dashboard")}>
                {session.role==="admin" ? "Admin" : "Hi, "+session.name.split(" ")[0]}
              </span>
              <button className="btn btn-g sm" onClick={onLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <span className="nlink" onClick={go("login")}>Sign In</span>
              <button className="btn btn-y sm" onClick={go("register")}>Get Started</button>
            </>
          )}
        </div>
        <button className="nav-burger" aria-label="Menu" onClick={function(){setOpen(!open);}}>
          <span /><span /><span />
        </button>
      </div>
      {open && (
        <div className="nav-mobile-menu">
          {[["home","Home"],["services","Services"],["track","Track"]].map(function(item){
            return <div key={item[0]} className={"nav-mobile-link "+(page===item[0]?"on":"")} onClick={go(item[0])}>{item[1]}</div>;
          })}
          <div style={{height:1,background:"var(--g3)",margin:"8px 0"}} />
          {session ? (
            <>
              <div className="nav-mobile-link" onClick={go(session.role==="admin"?"admin":"dashboard")}>
                {session.role==="admin" ? "Admin Dashboard" : "Hi, "+session.name.split(" ")[0]}
              </div>
              <button className="btn btn-g" style={{width:"100%",justifyContent:"center",marginTop:8}} onClick={function(){setOpen(false);onLogout();}}>Sign Out</button>
            </>
          ) : (
            <>
              <div className="nav-mobile-link" onClick={go("login")}>Sign In</div>
              <button className="btn btn-y" style={{width:"100%",justifyContent:"center",marginTop:8}} onClick={go("register")}>Get Started</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

function TrackingTimeline(props) {
  var shipment = props.shipment;
  var isAdmin  = props.isAdmin || false;
  var curIdx   = STATUS_KEYS.indexOf(shipment.status);
  var logs     = (shipment.logs || []).slice().reverse();
  var publicNotes = (shipment.adminNotes||[]).filter(function(n){return n.visibleToCustomer;});

  return (
    <div>
      <div style={{marginBottom:22}}>
        <div className="stepbar" style={{marginBottom:8}}>
          {STATUS_FLOW.map(function(s,i){
            return (
              <span key={s.key} style={{display:"contents"}}>
                {i>0 && <div className={"stepbar-seg "+(i<=curIdx?"done":"")} />}
                <div className={"stepbar-node "+(i<curIdx?"done":i===curIdx?"cur":"")} title={s.label}>
                  {i<curIdx ? "✓" : s.icon}
                </div>
              </span>
            );
          })}
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          {STATUS_FLOW.map(function(s,i){
            return (
              <div key={s.key} style={{flex:1,textAlign:i===0?"left":i===5?"right":"center",fontSize:9,fontWeight:700,color:i<=curIdx?"#111":"#a3a3a3",lineHeight:1.3}}>
                {s.label.split(" ").map(function(w,j){return <div key={j}>{w}</div>;})}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{background:"#111",borderRadius:12,padding:"13px 18px",marginBottom:18,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <span style={{fontSize:24}}>{STATUS_FLOW[curIdx] ? STATUS_FLOW[curIdx].icon : ""}</span>
        <div>
          <div style={{color:"#f59e0b",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase"}}>Current Status</div>
          <div style={{color:"#fff",fontWeight:800,fontSize:15}}>{shipment.status}</div>
          <div style={{color:"rgba(255,255,255,.5)",fontSize:12,marginTop:2}}>&#128205; {shipment.currentLocation}</div>
        </div>
        {shipment.status==="Customs Check" && (
          <div style={{marginLeft:"auto",background:"#fce7f3",border:"1.5px solid #ec4899",borderRadius:8,padding:"6px 12px",textAlign:"center"}}>
            <div style={{fontSize:9,fontWeight:700,color:"#9d174d",textTransform:"uppercase"}}>Customs</div>
            <div style={{fontSize:10,color:"#9d174d",fontWeight:600}}>Under Review</div>
          </div>
        )}
      </div>

      {!isAdmin && publicNotes.length>0 && (
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:700,color:"#525252",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Shipment Notices</div>
          {publicNotes.map(function(n){
            return (
              <div key={n.id} className="note-pub">
                <p style={{fontSize:13,color:"#111",lineHeight:1.6}}>{n.text}</p>
                <div style={{fontSize:11,color:"#92400e",marginTop:5,fontWeight:600}}>{fmtDT(n.createdAt)}</div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:700,color:"#525252",textTransform:"uppercase",letterSpacing:"0.08em"}}>Tracking History</div>
        <span style={{background:"#111",color:"#f59e0b",fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:100}}>
          {(shipment.logs||[]).length} event{(shipment.logs||[]).length!==1?"s":""}
        </span>
      </div>

      {logs.length===0 && (
        <div style={{background:"#fafafa",border:"1.5px dashed #e5e5e5",borderRadius:10,padding:"20px",textAlign:"center",color:"#a3a3a3",fontSize:13}}>No tracking events yet.</div>
      )}

      {logs.map(function(log, i){
        var isCur = i===0, isPast = i>0, isCustoms = log.status==="Customs Check";
        var sInfo = STATUS_FLOW.find(function(s){return s.key===log.status;});
        return (
          <div key={log.id||i} className={"tl-row "+(isPast?"is-past":"")}>
            <div className={"tl-dot "+(isCur?"is-cur":"is-past")}>{sInfo ? sInfo.icon : "●"}</div>
            <div className="tl-body">
              <div style={{background:isCur?"#fffbeb":isCustoms?"#fdf2f8":"#fafafa",border:"1.5px solid "+(isCur?"#f59e0b":isCustoms?"#f9a8d4":"#e5e5e5"),borderRadius:10,padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:4,marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span style={{fontWeight:800,fontSize:13,color:"#111"}}>{log.status}</span>
                    {isCur && <span style={{background:"#f59e0b",color:"#111",fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:100}}>CURRENT</span>}
                    {isCustoms && <span style={{background:"#fce7f3",color:"#9d174d",fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:100,border:"1px solid #ec4899"}}>CUSTOMS</span>}
                  </div>
                  <span style={{fontSize:11,color:"#a3a3a3",fontWeight:600,whiteSpace:"nowrap"}}>{fmtDT(log.time)}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:log.note?6:0}}>
                  <span>&#128205;</span>
                  <span style={{fontWeight:700,fontSize:12,color:"#111"}}>{log.location}</span>
                </div>
                {log.note && (
                  <>
                    <div style={{height:1,background:isCustoms?"#f9a8d4":"#e5e5e5",margin:"6px 0"}} />
                    <div style={{color:"#525252",fontSize:12,lineHeight:1.7}}>{log.note}</div>
                  </>
                )}
                {isCustoms && (log.customsLocation||log.customsNote) && (
                  <div style={{marginTop:10,background:"#fff",border:"1.5px solid #ec4899",borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#9d174d",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Customs Details</div>
                    {log.customsLocation && (
                      <div style={{display:"flex",gap:6,marginBottom:6}}>
                        <span>&#127963;</span>
                        <div>
                          <div style={{fontSize:10,fontWeight:700,color:"#9d174d",textTransform:"uppercase"}}>Customs Office</div>
                          <div style={{fontSize:12,color:"#111",fontWeight:600}}>{log.customsLocation}</div>
                        </div>
                      </div>
                    )}
                    {log.customsNote && (
                      <div style={{display:"flex",gap:6}}>
                        <span>&#128203;</span>
                        <div>
                          <div style={{fontSize:10,fontWeight:700,color:"#9d174d",textTransform:"uppercase"}}>Authority Note</div>
                          <div style={{fontSize:12,color:"#333",fontStyle:"italic",lineHeight:1.6}}>"{log.customsNote}"</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {isCustoms && !log.customsLocation && !log.customsNote && (
                  <div style={{marginTop:8,background:"#fce7f3",border:"1px solid #ec4899",borderRadius:7,padding:"6px 10px",fontSize:11,color:"#9d174d",fontWeight:600}}>
                    Clearance required before delivery can proceed.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminNotesPanel(props) {
  var shipment = props.shipment;
  var onUpdate = props.onUpdate;
  var [text, setText]   = useState("");
  var [vis,  setVis]    = useState(false);
  var [notes, setNotes] = useState(function(){ return DB.findShipment(shipment.id) ? DB.findShipment(shipment.id).adminNotes || [] : []; });

  function refresh() { var s=DB.findShipment(shipment.id); setNotes(s ? s.adminNotes||[] : []); }

  function addNote() {
    if (!text.trim()) return;
    DB.addNote(shipment.id, {id:uid(),text:text.trim(),visibleToCustomer:vis,adminName:"Admin",createdAt:new Date().toISOString()});
    setText(""); setVis(false); refresh(); onUpdate();
  }
  function deleteNote(nid) { DB.deleteNote(shipment.id, nid); refresh(); onUpdate(); }
  function toggleVis(nid) {
    var n = notes.find(function(x){return x.id===nid;});
    if (!n) return;
    DB.updateNote(shipment.id, nid, {visibleToCustomer:!n.visibleToCustomer});
    refresh(); onUpdate();
  }

  return (
    <div>
      <div style={{fontSize:11,fontWeight:700,color:"#525252",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Admin Notes</div>
      <div style={{border:"2px solid #f59e0b",borderRadius:10,padding:14,background:"#fffbeb",marginBottom:14}}>
        <textarea className="inp" rows={3} value={text} onChange={function(e){setText(e.target.value);}}
          placeholder="Held for inspection / Cleared by customs / Documents required"
          style={{resize:"vertical",marginBottom:10}} />
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:12,fontWeight:700}}>
            <input type="checkbox" checked={vis} onChange={function(e){setVis(e.target.checked);}} style={{accentColor:"#f59e0b"}} />
            Visible to customer
          </label>
          <button className="btn btn-y sm" onClick={addNote} disabled={!text.trim()}>+ Add Note</button>
        </div>
      </div>
      {notes.length===0 && <div style={{color:"#a3a3a3",fontSize:12,fontStyle:"italic"}}>No notes yet.</div>}
      {notes.map(function(n){
        return (
          <div key={n.id} className={n.visibleToCustomer?"note-pub":"note-priv"}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <p style={{fontSize:13,color:"#111",lineHeight:1.6,flex:1}}>{n.text}</p>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button className="btn btn-g sm" onClick={function(){toggleVis(n.id);}}>{n.visibleToCustomer?"Public":"Private"}</button>
                <button className="btn btn-r sm" onClick={function(){deleteNote(n.id);}}>X</button>
              </div>
            </div>
            <div style={{display:"flex",gap:12,marginTop:7,flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:"#525252",fontWeight:600}}>{fmtDT(n.createdAt)}</span>
              <span style={{fontSize:11,color:"#525252",fontWeight:600}}>{n.adminName}</span>
              {n.visibleToCustomer && <span style={{fontSize:10,background:"#fef3c7",color:"#92400e",fontWeight:700,padding:"1px 8px",borderRadius:100,border:"1px solid #f59e0b"}}>CUSTOMER VISIBLE</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UpdateStatusModal(props) {
  var shipment = props.shipment, onClose = props.onClose;
  var logs = shipment.logs || [];
  var [form, setForm] = useState({status:shipment.status, location:shipment.currentLocation||"", note:"", customsLocation:"", customsNote:""});
  function h(k){ return function(e){ setForm(function(f){ var o=Object.assign({},f); o[k]=e.target.value; return o; }); }; }
  var isCustoms = form.status==="Customs Check";

  function save() {
    if (!form.location.trim()) return;
    DB.appendLog(shipment.id, {
      id:uid(), status:form.status, location:form.location.trim(),
      note:form.note.trim()||("Status updated to "+form.status),
      time:new Date().toISOString(),
      customsLocation: isCustoms ? form.customsLocation.trim() : undefined,
      customsNote:     isCustoms ? form.customsNote.trim()     : undefined,
    });
    onClose();
  }

  return (
    <div className="overlay" onClick={function(e){if(e.target===e.currentTarget)onClose();}}>
      <div className="mbox">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h2 style={{fontWeight:900,fontSize:17,color:"#111"}}>Record Status Update</h2>
          <button className="btn btn-g sm" onClick={onClose}>X</button>
        </div>
        <div className="mono" style={{background:"#fef3c7",padding:"4px 12px",borderRadius:7,fontSize:12,fontWeight:700,marginBottom:14,display:"inline-block",border:"1.5px solid #f59e0b"}}>{shipment.trackingId}</div>
        <div style={{background:"#f0fdf4",border:"1.5px solid #4ade80",borderRadius:9,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#166534",fontWeight:600}}>
          Append-only — {logs.length} existing event{logs.length!==1?"s":""} preserved. This becomes event #{logs.length+1}.
        </div>
        {logs.length>0 && (
          <div style={{background:"#fafafa",border:"1.5px solid #e5e5e5",borderRadius:9,padding:"10px 14px",marginBottom:14,maxHeight:150,overflowY:"auto"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#111",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.04em"}}>Existing History</div>
            {logs.map(function(l,i){
              return (
                <div key={l.id||i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:5,paddingBottom:5,borderBottom:i<logs.length-1?"1px solid #e5e5e5":"none"}}>
                  <span style={{fontSize:10,color:"#a3a3a3",fontWeight:700,minWidth:24}}>#{i+1}</span>
                  <span style={{fontSize:11,color:"#111",fontWeight:700,minWidth:110}}>{l.status}</span>
                  <span style={{fontSize:11,color:"#525252",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.location}</span>
                  <span style={{fontSize:10,color:"#a3a3a3",whiteSpace:"nowrap"}}>{fmtDT(l.time)}</span>
                </div>
              );
            })}
          </div>
        )}
        <div className="fg">
          <label className="lbl">New Status</label>
          <select className="inp" value={form.status} onChange={h("status")}>
            {STATUS_KEYS.map(function(s){return <option key={s}>{s}</option>;})}
          </select>
        </div>
        <div className="fg">
          <label className="lbl">Current Location *</label>
          <input className="inp" value={form.location} onChange={h("location")} placeholder="City, facility or port" />
        </div>
        <div className="fg">
          <label className="lbl">Note (optional)</label>
          <textarea className="inp" rows={2} value={form.note} onChange={h("note")} placeholder="What happened at this stage?" style={{resize:"vertical"}} />
        </div>
        {isCustoms && (
          <div style={{background:"#fdf2f8",border:"2px solid #ec4899",borderRadius:10,padding:16,marginBottom:4}}>
            <div style={{fontWeight:800,color:"#9d174d",fontSize:13,marginBottom:12}}>Customs Check Details</div>
            <div className="fg">
              <label className="lbl" style={{color:"#9d174d"}}>Customs Office / Location</label>
              <input className="inp" value={form.customsLocation} onChange={h("customsLocation")} placeholder="e.g. Zollamt Berlin, Wolfener Str. 32" style={{borderColor:"#ec4899"}} />
            </div>
            <div>
              <label className="lbl" style={{color:"#9d174d"}}>Customs Authority Note</label>
              <textarea className="inp" rows={2} value={form.customsNote} onChange={h("customsNote")} placeholder="Held for inspection / Cleared / Additional documents required" style={{resize:"vertical",borderColor:"#ec4899"}} />
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:16}}>
          <button className="btn btn-o sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-y sm" onClick={save} disabled={!form.location.trim()}>+ Record Event #{logs.length+1}</button>
        </div>
      </div>
    </div>
  );
}

function CreateShipmentModal(props) {
  var onClose = props.onClose;
  var [step, setStep] = useState(1);
  var allUsers = DB.getUsers().filter(function(u){return u.role!=="admin";});
  var [det, setDet] = useState({senderName:"",receiverName:"",origin:"",destination:"",service:"Air Freight",weight:"",description:"",estimatedDelivery:"",assignedUserId:""});
  var [fs,  setFs]  = useState({status:"Order Placed",location:"",note:"",customsLocation:"",customsNote:""});
  function hd(k){ return function(e){ setDet(function(f){ var o=Object.assign({},f); o[k]=e.target.value; return o; }); }; }
  function hs(k){ return function(e){ setFs(function(f){ var o=Object.assign({},f); o[k]=e.target.value; return o; }); }; }
  var isCustoms = fs.status==="Customs Check";
  var detOk = det.senderName&&det.receiverName&&det.origin&&det.destination;

  function create() {
    if (!fs.location.trim()) return;
    var now = new Date().toISOString();
    var firstLog = {id:uid(),status:fs.status,location:fs.location.trim(),note:fs.note.trim()||("Shipment "+fs.status.toLowerCase()+"."),time:now};
    if (isCustoms) { firstLog.customsLocation=fs.customsLocation.trim(); firstLog.customsNote=fs.customsNote.trim(); }
    var ship = Object.assign({},det,{id:uid(),trackingId:genTracking(),userId:det.assignedUserId||null,status:fs.status,currentLocation:fs.location.trim(),createdAt:now,updatedAt:now,adminNotes:[],logs:[firstLog]});
    DB.createShipment(ship);
    onClose(ship.trackingId);
  }

  return (
    <div className="overlay" onClick={function(e){if(e.target===e.currentTarget)onClose();}}>
      <div className="mbox">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <h2 style={{fontWeight:900,fontSize:17,color:"#111"}}>Create New Shipment</h2>
            <div style={{display:"flex",gap:6,marginTop:6}}>
              {[1,2].map(function(n){
                return (
                  <div key={n} style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:step>=n?"#f59e0b":"#e5e5e5",color:step>=n?"#111":"#a3a3a3",fontWeight:800,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>{n}</div>
                    <span style={{fontSize:11,fontWeight:600,color:step>=n?"#111":"#a3a3a3"}}>{n===1?"Shipment Details":"Initial Status"}</span>
                    {n<2 && <span style={{color:"#e5e5e5",fontSize:14}}>›</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <button className="btn btn-g sm" onClick={function(){onClose();}}>X</button>
        </div>

        {step===1 && (
          <div className="fade">
            <div className="g2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["senderName","Sender Name","Company or person"],["receiverName","Receiver Name","Recipient"],["origin","Origin","City, Country"],["destination","Destination","City, Country"],["weight","Weight","e.g. 25kg"],["description","Cargo Description","Electronics, documents..."]].map(function(item){
                return <div key={item[0]}><label className="lbl">{item[1]}</label><input className="inp" placeholder={item[2]} value={det[item[0]]||""} onChange={hd(item[0])} /></div>;
              })}
              <div>
                <label className="lbl">Service Type</label>
                <select className="inp" value={det.service} onChange={hd("service")}>
                  {["Air Freight","Sea Freight","Road Delivery","Express Courier","Warehousing"].map(function(s){return <option key={s}>{s}</option>;})}
                </select>
              </div>
              <div><label className="lbl">Est. Delivery Date</label><input className="inp" type="date" value={det.estimatedDelivery} onChange={hd("estimatedDelivery")} /></div>
              <div style={{gridColumn:"1 / -1"}}>
                <label className="lbl">Assign to User (optional)</label>
                <select className="inp" value={det.assignedUserId} onChange={hd("assignedUserId")}>
                  <option value="">— Unassigned (track by code only) —</option>
                  {allUsers.map(function(u){return <option key={u.id} value={u.id}>{u.name} ({u.email})</option>;})}
                </select>
              </div>
            </div>
            <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:18}}>
              <button className="btn btn-o sm" onClick={function(){onClose();}}>Cancel</button>
              <button className="btn btn-y sm" onClick={function(){setStep(2);}} disabled={!detOk}>Next: Set Initial Status</button>
            </div>
          </div>
        )}

        {step===2 && (
          <div className="fade">
            <div style={{background:"#fef3c7",border:"2px solid #f59e0b",borderRadius:10,padding:"12px 14px",marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:700,color:"#92400e",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Shipment Summary</div>
              <div style={{fontSize:13,color:"#111",fontWeight:600}}>{det.senderName} to {det.receiverName}</div>
              <div style={{fontSize:12,color:"#525252"}}>{det.origin} to {det.destination} — {det.service}</div>
            </div>
            <div className="fg">
              <label className="lbl">Initial Status</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {STATUS_FLOW.map(function(s){
                  return (
                    <div key={s.key}
                      role="button" tabIndex={0}
                      onClick={function(){setFs(function(f){return Object.assign({},f,{status:s.key});});}}
                      onKeyDown={function(e){if(e.key==="Enter"||e.key===" ")setFs(function(f){return Object.assign({},f,{status:s.key});});}}
                      style={{border:"2px solid "+(fs.status===s.key?"#111":"#e5e5e5"),borderRadius:10,padding:"10px 12px",cursor:"pointer",background:fs.status===s.key?"#f59e0b":"#fff",transition:"all .15s",outline:"none"}}>
                      <div style={{fontSize:18,marginBottom:3}}>{s.icon}</div>
                      <div style={{fontSize:11,fontWeight:800,color:"#111",lineHeight:1.3}}>{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="fg">
              <label className="lbl">Current Location *</label>
              <input className="inp" value={fs.location} onChange={hs("location")} placeholder="Where is the shipment right now?" />
            </div>
            <div className="fg">
              <label className="lbl">Note (optional)</label>
              <textarea className="inp" rows={2} value={fs.note} onChange={hs("note")} placeholder="Describe the current situation..." style={{resize:"vertical"}} />
            </div>
            {isCustoms && (
              <div style={{background:"#fdf2f8",border:"2px solid #ec4899",borderRadius:10,padding:16,marginBottom:4}}>
                <div style={{fontWeight:800,color:"#9d174d",fontSize:13,marginBottom:12}}>Customs Details</div>
                <div className="fg"><label className="lbl" style={{color:"#9d174d"}}>Customs Office / Location</label><input className="inp" value={fs.customsLocation} onChange={hs("customsLocation")} placeholder="Customs facility name" style={{borderColor:"#ec4899"}} /></div>
                <div><label className="lbl" style={{color:"#9d174d"}}>Customs Authority Note</label><textarea className="inp" rows={2} value={fs.customsNote} onChange={hs("customsNote")} placeholder="Held for inspection..." style={{resize:"vertical",borderColor:"#ec4899"}} /></div>
              </div>
            )}
            <div style={{display:"flex",gap:9,justifyContent:"space-between",marginTop:18}}>
              <button className="btn btn-g sm" onClick={function(){setStep(1);}}>Back</button>
              <button className="btn btn-y sm" onClick={create} disabled={!fs.location.trim()}>Create Shipment</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EditShipmentModal(props) {
  var shipment = props.shipment, onClose = props.onClose;
  var allUsers = DB.getUsers().filter(function(u){return u.role!=="admin";});
  var [form, setForm] = useState(Object.assign({},shipment));
  function h(k){ return function(e){ setForm(function(f){ var o=Object.assign({},f); o[k]=e.target.value; return o; }); }; }
  function save() {
    DB.updateShipment(form.id, {senderName:form.senderName,receiverName:form.receiverName,origin:form.origin,destination:form.destination,service:form.service,weight:form.weight,description:form.description,estimatedDelivery:form.estimatedDelivery,userId:form.userId||null});
    onClose();
  }
  return (
    <div className="overlay" onClick={function(e){if(e.target===e.currentTarget)onClose();}}>
      <div className="mbox">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h2 style={{fontWeight:900,fontSize:17,color:"#111"}}>Edit Shipment</h2>
          <button className="btn btn-g sm" onClick={onClose}>X</button>
        </div>
        <div style={{background:"#fef3c7",border:"1.5px solid #f59e0b",borderRadius:9,padding:"8px 14px",marginBottom:14,fontSize:12,color:"#92400e",fontWeight:600}}>
          Status history is never modified — only metadata below can be edited.
        </div>
        <div className="mono" style={{background:"#fef3c7",padding:"4px 12px",borderRadius:7,fontSize:12,fontWeight:700,marginBottom:14,display:"inline-block",border:"1.5px solid #f59e0b"}}>{shipment.trackingId}</div>
        <div className="g2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[["senderName","Sender"],["receiverName","Receiver"],["origin","Origin"],["destination","Destination"],["weight","Weight"],["description","Description"]].map(function(item){
            return <div key={item[0]}><label className="lbl">{item[1]}</label><input className="inp" value={form[item[0]]||""} onChange={h(item[0])} /></div>;
          })}
          <div><label className="lbl">Est. Delivery</label><input className="inp" type="date" value={form.estimatedDelivery||""} onChange={h("estimatedDelivery")} /></div>
          <div>
            <label className="lbl">Service</label>
            <select className="inp" value={form.service} onChange={h("service")}>
              {["Air Freight","Sea Freight","Road Delivery","Express Courier","Warehousing"].map(function(s){return <option key={s}>{s}</option>;})}
            </select>
          </div>
          <div style={{gridColumn:"1 / -1"}}>
            <label className="lbl">Assigned User</label>
            <select className="inp" value={form.userId||""} onChange={h("userId")}>
              <option value="">— Unassigned —</option>
              {allUsers.map(function(u){return <option key={u.id} value={u.id}>{u.name} ({u.email})</option>;})}
            </select>
          </div>
        </div>
        <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:18}}>
          <button className="btn btn-o sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-y sm" onClick={save}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function ShipmentDetailModal(props) {
  var shipmentId = props.shipmentId, onClose = props.onClose;
  var [ship, setShip]         = useState(function(){ return DB.findShipment(shipmentId); });
  var [showUpdate, setShowUpdate] = useState(false);
  function refresh() { setShip(Object.assign({}, DB.findShipment(shipmentId))); }
  if (!ship) return null;
  return (
    <div className="overlay" onClick={function(e){if(e.target===e.currentTarget)onClose();}}>
      <div className="mbox" style={{maxWidth:700}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <h2 style={{fontWeight:900,fontSize:17,color:"#111"}}>Shipment Detail</h2>
            <div className="mono" style={{background:"#fef3c7",padding:"3px 11px",borderRadius:7,fontSize:12,fontWeight:700,marginTop:5,display:"inline-block",border:"1.5px solid #f59e0b"}}>{ship.trackingId}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-k sm" onClick={function(){setShowUpdate(true);}}>+ Update Status</button>
            <button className="btn btn-g sm" onClick={onClose}>X</button>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
          <SBadge status={ship.status} />
          <span style={{fontSize:12,color:"#525252",fontWeight:600}}>{ship.currentLocation}</span>
          <span style={{fontSize:12,color:"#525252",fontWeight:600}}>{ship.service}</span>
          <span style={{fontSize:12,color:"#f59e0b",fontWeight:700}}>{(ship.logs||[]).length} events</span>
        </div>
        <TrackingTimeline shipment={ship} isAdmin={true} />
        <div style={{borderTop:"2px solid #e5e5e5",marginTop:20,paddingTop:20}}>
          <AdminNotesPanel shipment={ship} onUpdate={refresh} />
        </div>
        {showUpdate && <UpdateStatusModal shipment={ship} onClose={function(){setShowUpdate(false);refresh();}} />}
      </div>
    </div>
  );
}

function AdminDashboard(props) {
  var session = props.session, setPage = props.setPage;
  var [view,       setView]       = useState("overview");
  var [ships,      setShips]      = useState(function(){ return DB.getShipments(); });
  var [users,      setUsers]      = useState(function(){ return DB.getUsers(); });
  var [showCreate, setShowCreate] = useState(false);
  var [editShipId, setEditShipId] = useState(null);
  var [detailId,   setDetailId]   = useState(null);
  var [msg,        setMsg]        = useState("");
  var [search,     setSearch]     = useState("");

  function refresh() { setShips(DB.getShipments()); setUsers(DB.getUsers()); }
  function flash(m)  { setMsg(m); setTimeout(function(){setMsg("");},3000); }

  var filtered = ships.filter(function(s){
    return [s.trackingId,s.senderName,s.receiverName,s.status,s.currentLocation||""].some(function(v){return v.toLowerCase().includes(search.toLowerCase());});
  });

  var stats = {
    total:     ships.length,
    customs:   ships.filter(function(s){return s.status==="Customs Check";}).length,
    inTransit: ships.filter(function(s){return s.status==="In Transit";}).length,
    delivered: ships.filter(function(s){return s.status==="Delivered";}).length,
  };

  var editShip = editShipId ? DB.findShipment(editShipId) : null;

  return (
    <div style={{display:"flex",minHeight:"100vh"}}>
      <div className="sidebar">
        <div style={{padding:"20px 16px",borderBottom:"1px solid rgba(255,255,255,.09)"}}>
          <Logo inv={true} />
          <div style={{fontSize:9,color:"rgba(255,255,255,.28)",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:5}}>Admin Panel</div>
        </div>
        <div style={{padding:"14px 10px",flex:1}}>
          {[["overview","Overview"],["shipments","Shipments"],["users","Users"]].map(function(item){
            return <div key={item[0]} className={"slink "+(view===item[0]?"on":"")} onClick={function(){setView(item[0]);}}>{item[1]}</div>;
          })}
          <div style={{borderTop:"1px solid rgba(255,255,255,.08)",marginTop:12,paddingTop:12}}>
            <div className="slink" onClick={function(){setShowCreate(true);}}>+ New Shipment</div>
            <div className="slink" onClick={function(){setPage("home");}}>Back to Site</div>
          </div>
        </div>
        <div style={{padding:"14px 16px",borderTop:"1px solid rgba(255,255,255,.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:30,height:30,background:"#f59e0b",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#111",fontSize:12}}>A</div>
            <div>
              <div style={{color:"#fff",fontSize:11,fontWeight:700}}>{session.name}</div>
              <div style={{color:"rgba(255,255,255,.3)",fontSize:9,fontWeight:600,textTransform:"uppercase"}}>Administrator</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{flex:1,background:"#fff",overflow:"auto"}}>
        <div style={{borderBottom:"2px solid #111",padding:"14px 24px",background:"#fafafa",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h2 style={{fontWeight:900,fontSize:17,color:"#111",textTransform:"capitalize"}}>{view}</h2>
          {msg && <div style={{background:"#fef3c7",border:"1.5px solid #f59e0b",color:"#92400e",padding:"7px 14px",borderRadius:8,fontSize:12,fontWeight:700}}>{msg}</div>}
        </div>
        <div style={{padding:24}}>

          {view==="overview" && (
            <div className="fade">
              <div className="g4" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
                {[{l:"Total",v:stats.total,y:true},{l:"In Transit",v:stats.inTransit},{l:"Customs",v:stats.customs},{l:"Delivered",v:stats.delivered}].map(function(c){
                  return (
                    <div key={c.l} style={{border:"2px solid #111",borderRadius:12,padding:18,background:c.y?"#f59e0b":"#fff"}}>
                      <div style={{fontWeight:900,fontSize:28,color:"#111"}}>{c.v}</div>
                      <div style={{fontSize:10,fontWeight:700,color:"#525252",textTransform:"uppercase",letterSpacing:"0.06em",marginTop:3}}>{c.l}</div>
                    </div>
                  );
                })}
              </div>
              {stats.customs>0 && (
                <div style={{background:"#fce7f3",border:"2px solid #ec4899",borderRadius:12,padding:"13px 18px",marginBottom:18,display:"flex",gap:12,alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:800,color:"#9d174d"}}>{stats.customs} shipment{stats.customs>1?"s":""} in Customs Check</div>
                    <div style={{color:"#be185d",fontSize:12,marginTop:2}}>Review and update when clearance confirmed.</div>
                  </div>
                  <button className="btn btn-g sm" style={{marginLeft:"auto",borderColor:"#ec4899",color:"#9d174d"}} onClick={function(){setView("shipments");}}>View</button>
                </div>
              )}
              <div className="g2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                <div style={{border:"2px solid #111",borderRadius:14,overflow:"hidden"}}>
                  <div style={{padding:"13px 18px",background:"#fef3c7",borderBottom:"2px solid #111"}}><h3 style={{fontWeight:800,fontSize:14}}>Recent Shipments</h3></div>
                  <table>
                    <thead><tr><th>Tracking ID</th><th>Status</th><th>Events</th></tr></thead>
                    <tbody>
                      {ships.slice(0,5).map(function(s){
                        return (
                          <tr key={s.id} style={{cursor:"pointer"}} onClick={function(){setDetailId(s.id);}}>
                            <td><span className="mono" style={{background:"#fef3c7",padding:"2px 7px",borderRadius:5,fontSize:10,fontWeight:700}}>{s.trackingId}</span></td>
                            <td><SBadge status={s.status} /></td>
                            <td style={{fontSize:11,fontWeight:700,color:"#f59e0b"}}>{(s.logs||[]).length}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{border:"2px solid #111",borderRadius:14,padding:20,background:"#111"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#f59e0b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:16}}>Pipeline</div>
                  {STATUS_FLOW.map(function(sf){
                    var v=ships.filter(function(s){return s.status===sf.key;}).length;
                    return (
                      <div key={sf.key} style={{marginBottom:11}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:700,marginBottom:4}}>
                          <span style={{color:"#fff"}}>{sf.icon} {sf.label}</span>
                          <span style={{color:"#f59e0b"}}>{v}</span>
                        </div>
                        <div style={{height:4,background:"rgba(255,255,255,.1)",borderRadius:100,overflow:"hidden"}}>
                          <div style={{height:"100%",background:"#f59e0b",borderRadius:100,width:(ships.length?(v/ships.length)*100:0)+"%"}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {view==="shipments" && (
            <div className="fade">
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
                <input className="inp" placeholder="Search by ID, name, status..." value={search} onChange={function(e){setSearch(e.target.value);}} style={{maxWidth:320,flex:1}} />
                <span style={{fontSize:12,color:"#525252",fontWeight:600}}>{filtered.length} result{filtered.length!==1?"s":""}</span>
                <button className="btn btn-y sm" onClick={function(){setShowCreate(true);}}>+ New Shipment</button>
              </div>
              <div style={{border:"2px solid #111",borderRadius:14,overflow:"hidden"}}>
                <div style={{overflowX:"auto"}}>
                  <table>
                    <thead><tr><th>Tracking ID</th><th>Sender / Receiver</th><th>Status</th><th className="hide-sm">Location</th><th>Events</th><th>Actions</th></tr></thead>
                    <tbody>
                      {filtered.map(function(s){
                        return (
                          <tr key={s.id}>
                            <td><span className="mono" style={{background:"#fef3c7",padding:"2px 7px",borderRadius:5,fontSize:11,fontWeight:700,cursor:"pointer"}} onClick={function(){setDetailId(s.id);}}>{s.trackingId}</span></td>
                            <td style={{fontSize:12}}><div style={{fontWeight:700,color:"#111"}}>{s.senderName}</div><div style={{color:"#a3a3a3"}}>{s.receiverName}</div></td>
                            <td><SBadge status={s.status} /></td>
                            <td className="hide-sm" style={{fontSize:11}}>{s.currentLocation}</td>
                            <td><span style={{background:"#fef3c7",border:"1px solid #f59e0b",borderRadius:100,fontSize:11,fontWeight:800,padding:"2px 10px",color:"#92400e"}}>{(s.logs||[]).length}</span></td>
                            <td>
                              <div style={{display:"flex",gap:5}}>
                                <button className="btn btn-g sm" onClick={function(){setDetailId(s.id);}}>View</button>
                                <button className="btn btn-g sm" onClick={function(){setEditShipId(s.id);}}>Edit</button>
                                <button className="btn btn-r sm" onClick={function(){DB.deleteShipment(s.id);refresh();flash("Deleted.");}}>Del</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {view==="users" && (
            <div className="fade">
              <p style={{color:"#525252",fontWeight:600,marginBottom:16,fontSize:13}}>{users.filter(function(u){return u.role!=="admin";}).length} registered users</p>
              <div style={{border:"2px solid #111",borderRadius:14,overflow:"hidden"}}>
                <table>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th className="hide-sm">Joined</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.map(function(u){
                      return (
                        <tr key={u.id}>
                          <td style={{fontWeight:700}}>{u.name}</td>
                          <td style={{fontSize:12}}>{u.email}</td>
                          <td><span style={{background:u.role==="admin"?"#f59e0b":"#e5e5e5",color:"#111",padding:"2px 9px",borderRadius:100,fontSize:11,fontWeight:700}}>{u.role}</span></td>
                          <td><span style={{background:u.active?"#d1fae5":"#fee2e2",color:u.active?"#065f46":"#dc2626",padding:"2px 9px",borderRadius:100,fontSize:11,fontWeight:700}}>{u.active?"Active":"Blocked"}</span></td>
                          <td className="hide-sm" style={{fontSize:11,color:"#a3a3a3",fontWeight:600}}>{(u.createdAt||"").split("T")[0]}</td>
                          <td>
                            {u.role!=="admin" && (
                              <div style={{display:"flex",gap:5}}>
                                <button className="btn btn-g sm" onClick={function(){DB.saveUsers(DB.getUsers().map(function(x){return x.id===u.id?Object.assign({},x,{active:!x.active}):x;}));refresh();flash("Updated.");}}>{u.active?"Block":"Activate"}</button>
                                <button className="btn btn-r sm" onClick={function(){DB.saveUsers(DB.getUsers().filter(function(x){return x.id!==u.id;}));refresh();flash("Deleted.");}}>Del</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreate && <CreateShipmentModal onClose={function(tid){setShowCreate(false);refresh();if(tid)flash("Created: "+tid);}} />}
      {editShip   && <EditShipmentModal   shipment={editShip}   onClose={function(){setEditShipId(null);refresh();flash("Updated.");}} />}
      {detailId   && <ShipmentDetailModal shipmentId={detailId} onClose={function(){setDetailId(null);refresh();}} />}
    </div>
  );
}

function UserDashboard(props) {
  var session=props.session, setPage=props.setPage, setTrackId=props.setTrackId;
  var [myShips,    setMyShips]    = useState(function(){ return DB.getShipments().filter(function(s){return s.userId===session.userId;}); });
  var [trackInput, setTrackInput] = useState("");
  var [trackResult,setTrackResult]= useState(null);
  var [trackErr,   setTrackErr]   = useState("");

  useEffect(function(){ setMyShips(DB.getShipments().filter(function(s){return s.userId===session.userId;})); }, [session.userId]);

  function doTrack() {
    if (!trackInput.trim()) return;
    setTrackErr(""); setTrackResult(null);
    var found = DB.findByTracking(trackInput.trim());
    if (found) setTrackResult(found); else setTrackErr("No shipment found with this tracking code.");
  }

  return (
    <div className="fade" style={{maxWidth:1100,margin:"0 auto",padding:"36px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:26,paddingBottom:18,borderBottom:"2px solid #111"}}>
        <div>
          <h1 style={{fontWeight:900,fontSize:24,color:"#111"}}>Welcome, {session.name.split(" ")[0]}</h1>
          <p style={{color:"#525252",fontSize:13,marginTop:3}}>Track shipments with your code or view assigned ones below</p>
        </div>
      </div>

      <div style={{border:"2px solid #111",borderRadius:14,padding:24,marginBottom:26,background:"#fffbeb"}}>
        <div style={{fontSize:11,fontWeight:700,color:"#92400e",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Track a Shipment by Code</div>
        <div style={{display:"flex",gap:10,marginBottom:12}}>
          <input className="inp" placeholder="Enter tracking code e.g. YVC-2024-001847" value={trackInput}
            onChange={function(e){setTrackInput(e.target.value);setTrackErr("");setTrackResult(null);}}
            onKeyDown={function(e){if(e.key==="Enter")doTrack();}} style={{flex:1}} />
          <button className="btn btn-y" onClick={doTrack} disabled={!trackInput.trim()}>Track</button>
        </div>
        {trackErr && <div style={{background:"#fee2e2",border:"1.5px solid #dc2626",color:"#dc2626",borderRadius:8,padding:"10px 14px",fontSize:13,fontWeight:600}}>{trackErr}</div>}
        {trackResult && (
          <div style={{background:"#fff",border:"2px solid #111",borderRadius:12,padding:18,marginTop:4}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:16}}>
              <div>
                <div className="mono" style={{background:"#111",color:"#f59e0b",fontSize:14,fontWeight:700,padding:"4px 12px",borderRadius:7,display:"inline-block"}}>{trackResult.trackingId}</div>
                <div style={{fontSize:12,color:"#525252",marginTop:5}}>{trackResult.senderName} to {trackResult.receiverName}</div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <SBadge status={trackResult.status} />
                <button className="btn btn-k sm" onClick={function(){setTrackId(trackResult.trackingId);setPage("track");}}>Full Details</button>
              </div>
            </div>
            <TrackingTimeline shipment={trackResult} />
          </div>
        )}
      </div>

      <div style={{border:"2px solid #111",borderRadius:14,overflow:"hidden"}}>
        <div style={{padding:"13px 18px",background:"#fef3c7",borderBottom:"2px solid #111",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{fontWeight:800,fontSize:14}}>My Assigned Shipments</h3>
          <span style={{fontSize:12,color:"#525252",fontWeight:600}}>{myShips.length} shipment{myShips.length!==1?"s":""}</span>
        </div>
        {myShips.length===0 ? (
          <div style={{padding:"40px 24px",textAlign:"center",color:"#a3a3a3"}}>
            <div style={{fontSize:40,marginBottom:12}}>📦</div>
            <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>No assigned shipments yet</div>
            <div style={{fontSize:13}}>Use the tracking code above, or wait for an admin to assign a shipment to you.</div>
          </div>
        ) : (
          <div style={{overflowX:"auto"}}>
            <table>
              <thead><tr><th>Tracking ID</th><th>Route</th><th>Status</th><th className="hide-sm">Events</th><th></th></tr></thead>
              <tbody>
                {myShips.map(function(s){
                  return (
                    <tr key={s.id}>
                      <td><span className="mono" style={{background:"#fef3c7",padding:"2px 7px",borderRadius:5,fontSize:11,fontWeight:700}}>{s.trackingId}</span></td>
                      <td style={{fontSize:12}}><span style={{fontWeight:600}}>{s.origin.split(",")[0]}</span><span style={{color:"#a3a3a3"}}> to {s.destination.split(",")[0]}</span></td>
                      <td><SBadge status={s.status} /></td>
                      <td className="hide-sm" style={{fontSize:11,fontWeight:700,color:"#f59e0b"}}>{(s.logs||[]).length}</td>
                      <td><button className="btn btn-g sm" onClick={function(){setTrackId(s.trackingId);setPage("track");}}>Track</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TrackPage(props) {
  var initialId = props.initialId;
  var [val,      setVal]      = useState(initialId || "");
  var [ship,     setShip]     = useState(null);
  var [err,      setErr]      = useState("");
  var [loading,  setLoading]  = useState(false);
  var [searched, setSearched] = useState(false);

  var doTrack = useCallback(function() {
    if (!val.trim()) return;
    setLoading(true); setErr(""); setShip(null);
    setTimeout(function(){
      var f = DB.findByTracking(val.trim());
      if (f) setShip(Object.assign({},f)); else setErr("No shipment found. Double-check the tracking ID and try again.");
      setLoading(false); setSearched(true);
    }, 400);
  }, [val]);

  useEffect(function(){ if (initialId) doTrack(); }, [initialId]);

  return (
    <div className="fade">
      <div className="track-hero">
        <Photo id="1578575437130-527eed3abbec" seed="trackhero" alt="Cargo ship at port" w={1600} h={700} className="kb" />
        <div className="track-hero-tint" />
        <div className="track-hero-content">
          <div className="eyebrow-line" style={{justifyContent:"flex-start"}}><span>Real-Time Tracking</span></div>
          <h1 style={{color:"#fff",fontSize:34,fontWeight:800,letterSpacing:"-0.02em",marginBottom:8}}>Track your shipment</h1>
          <p style={{color:"rgba(255,255,255,.65)",marginBottom:22,fontSize:14,maxWidth:440}}>Full history — every location, status and customs event, preserved.</p>
          <div className="glass-panel" style={{maxWidth:520,padding:16}}>
            <div style={{display:"flex",gap:9}}>
              <input className="inp" value={val} onChange={function(e){setVal(e.target.value);}}
                placeholder="e.g. YVC-2024-001847"
                style={{flex:1,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.2)",color:"#fff",fontSize:14}}
                onKeyDown={function(e){if(e.key==="Enter")doTrack();}} />
              <button className="btn btn-y" style={{padding:"11px 22px"}} onClick={doTrack} disabled={loading}>{loading?"…":"Track"}</button>
            </div>
            <p style={{color:"rgba(255,255,255,.4)",fontSize:10,marginTop:10,fontWeight:600,letterSpacing:"0.03em"}}>TRY: YVC-2024-001847 · YVC-2024-003291 · YVC-2024-005512</p>
          </div>
        </div>
      </div>

      <section style={{padding:"48px 20px 64px",background:"#fff",minHeight:280}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          {err && (
            <Reveal>
              <div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:12,padding:"16px 20px",display:"flex",gap:12,alignItems:"center"}}>
                <div><div style={{fontWeight:700,color:"#dc2626",fontSize:13}}>Not found</div><div style={{color:"#b91c1c",fontSize:13,marginTop:2}}>{err}</div></div>
              </div>
            </Reveal>
          )}
          {ship && (
            <div className="fade">
              <div className="card" style={{marginBottom:18,border:"1px solid var(--g3)",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:14,marginBottom:20}}>
                  <div>
                    <div style={{fontSize:10,color:"#a3a3a3",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Tracking ID</div>
                    <div className="mono" style={{background:"#111",color:"#f59e0b",fontSize:16,fontWeight:700,padding:"6px 14px",borderRadius:8,display:"inline-block"}}>{ship.trackingId}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:10,color:"#a3a3a3",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Est. Delivery</div>
                    <div style={{fontWeight:700,fontSize:14,color:"#111"}}>{fmtDate(ship.estimatedDelivery)}</div>
                    <div style={{marginTop:6}}><SBadge status={ship.status} /></div>
                  </div>
                </div>
                <TrackingTimeline shipment={ship} />
              </div>
              <div className="g2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div className="card" style={{border:"1px solid var(--g3)",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#a3a3a3",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Shipment Info</div>
                  {[["Service",ship.service],["Weight",ship.weight],["Description",ship.description],["Origin",ship.origin],["Destination",ship.destination]].map(function(item){
                    return (
                      <div key={item[0]} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--g2)"}}>
                        <span style={{color:"#a3a3a3",fontSize:11,fontWeight:700,textTransform:"uppercase"}}>{item[0]}</span>
                        <span style={{fontWeight:700,fontSize:12,color:"#111",textAlign:"right",maxWidth:200}}>{item[1]||"—"}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="card-k">
                  <div style={{fontSize:10,fontWeight:700,color:"#f59e0b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Parties</div>
                  <div style={{marginBottom:16}}>
                    <div style={{color:"rgba(255,255,255,.4)",fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Sender</div>
                    <div style={{fontWeight:700,fontSize:14,color:"#fff"}}>{ship.senderName}</div>
                    <div style={{color:"rgba(255,255,255,.5)",fontSize:12,marginTop:2}}>{ship.origin}</div>
                  </div>
                  <div style={{borderTop:"1px dashed rgba(255,255,255,.14)",paddingTop:16}}>
                    <div style={{color:"rgba(255,255,255,.4)",fontSize:10,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Receiver</div>
                    <div style={{fontWeight:700,fontSize:14,color:"#fff"}}>{ship.receiverName}</div>
                    <div style={{color:"rgba(255,255,255,.5)",fontSize:12,marginTop:2}}>{ship.destination}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {!searched && !loading && (
            <Reveal>
              <div style={{textAlign:"center",padding:"52px 0",color:"#a3a3a3"}}>
                <div style={{fontSize:13,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:6,color:"#f59e0b"}}>Standing by</div>
                <div style={{fontWeight:700,fontSize:16,color:"#374151"}}>Enter a tracking ID above to begin</div>
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </div>
  );
}

function AuthPage(props) {
  var mode=props.mode, setPage=props.setPage, onLogin=props.onLogin;
  var [form,    setForm]    = useState({name:"",email:"",password:"",confirm:""});
  var [err,     setErr]     = useState("");
  var [loading, setLoading] = useState(false);
  var [showPw,  setShowPw]  = useState(false);
  function h(k){ return function(e){ setForm(function(f){ var o=Object.assign({},f); o[k]=e.target.value; return o; }); }; }
  var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function submit() {
    setErr("");
    var name = form.name.trim(), email = form.email.trim().toLowerCase();
    if (mode==="register") {
      if (!name||!email||!form.password) return setErr("All fields are required.");
      if (!emailOk.test(email)) return setErr("Enter a valid email address.");
      if (form.password!==form.confirm) return setErr("Passwords do not match.");
      if (form.password.length<6) return setErr("Password must be at least 6 characters.");
      setLoading(true);
      setTimeout(function(){
        var r = Auth.register(name,email,form.password);
        if (r.error) { setErr(r.error); setLoading(false); return; }
        var res = Auth.login(email,form.password);
        onLogin(res.session); setPage("dashboard");
      }, 400);
    } else {
      if (!email||!form.password) return setErr("Email and password are required.");
      if (!emailOk.test(email)) return setErr("Enter a valid email address.");
      setLoading(true);
      setTimeout(function(){
        var r = Auth.login(email,form.password);
        if (r.error) { setErr(r.error); setLoading(false); return; }
        onLogin(r.session); setPage(r.session.role==="admin"?"admin":"dashboard");
      }, 400);
    }
  }

  return (
    <div className="fade auth-wrap">
      <div className="auth-photo">
        <Photo id="1494412574745-6e39fc09b28d" seed="authphoto" alt="Cargo containers at port" w={900} h={1200} className="kb" />
        <div className="auth-photo-tint" />
        <div className="auth-photo-content">
          <div className="eyebrow-line" style={{justifyContent:"flex-start"}}><span>YvexCargo</span></div>
          <p style={{color:"#fff",fontSize:22,fontWeight:700,lineHeight:1.3,maxWidth:320}}>Every shipment, logged the moment it moves.</p>
        </div>
      </div>
      <div className="auth-form-side">
        <div style={{width:"100%",maxWidth:380}}>
          <div style={{marginBottom:28}}>
            <div style={{display:"flex",marginBottom:16}}><YLogo size={40} /></div>
            <h1 style={{fontWeight:800,fontSize:26,color:"#111",letterSpacing:"-0.02em",marginBottom:6}}>{mode==="login"?"Welcome back":"Create your account"}</h1>
            <p style={{color:"#525252",fontSize:13}}>{mode==="login"?"Sign in to track and manage your shipments.":"Free to join — start booking shipments in minutes."}</p>
          </div>
          <div style={{border:"1px solid var(--g3)",borderRadius:14,padding:26,boxShadow:"0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04)"}}>
            {mode==="register" && <div className="fg"><label className="lbl">Full Name</label><input className="inp" placeholder="John Smith" value={form.name} onChange={h("name")} /></div>}
            <div className="fg"><label className="lbl">Email</label><input className="inp" type="email" placeholder="you@example.com" value={form.email} onChange={h("email")} /></div>
            <div className="fg">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <label className="lbl" style={{marginBottom:5}}>Password</label>
                {mode==="login" && <a href="mailto:support@yvexcargo.com?subject=Password%20reset" style={{fontSize:11,color:"#f59e0b",fontWeight:700,textDecoration:"none",marginBottom:5}}>Forgot password?</a>}
              </div>
              <div style={{position:"relative"}}>
                <input className="inp" type={showPw?"text":"password"} placeholder="••••••••" value={form.password} onChange={h("password")}
                  style={{paddingRight:56}}
                  onKeyDown={function(e){if(e.key==="Enter")submit();}} />
                <span onClick={function(){setShowPw(!showPw);}} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:11,fontWeight:700,color:"#a3a3a3",cursor:"pointer",userSelect:"none"}}>{showPw?"Hide":"Show"}</span>
              </div>
            </div>
            {mode==="register" && <div className="fg"><label className="lbl">Confirm Password</label><input className="inp" type={showPw?"text":"password"} placeholder="••••••••" value={form.confirm} onChange={h("confirm")} onKeyDown={function(e){if(e.key==="Enter")submit();}} /></div>}
            {err && <div style={{background:"#fef2f2",border:"1px solid #fca5a5",color:"#b91c1c",padding:"10px 13px",borderRadius:8,fontSize:12,fontWeight:600,marginBottom:14}}>{err}</div>}
            <button className="btn btn-y" style={{width:"100%",justifyContent:"center",padding:13}} onClick={submit} disabled={loading}>{loading?"Please wait…":mode==="login"?"Sign In":"Create Account"}</button>
          </div>
          <p style={{textAlign:"center",color:"#525252",fontSize:13,marginTop:18}}>
            {mode==="login"?"No account yet?":"Already have an account?"}{" "}
            <span style={{color:"#111",fontWeight:700,cursor:"pointer",textDecoration:"underline"}} onClick={function(){setErr("");setPage(mode==="login"?"register":"login");}}>
              {mode==="login"?"Create one":"Sign in"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function SupportChat(props) {
  var session = props.session;
  var [open,    setOpen]    = useState(false);
  var [input,   setInput]   = useState("");
  var [loading, setLoading] = useState(false);
  var [messages,setMessages]= useState([{role:"assistant",content:"Hi! I am the YvexCargo AI assistant.\n\nI can help you with:\n- Tracking your shipment\n- Customs check information\n- Delivery estimates\n- Service questions\n\nWhat can I help you with today?"}]);
  var bottomRef = useRef(null);
  var taRef     = useRef(null);

  useEffect(function(){
    if (open && bottomRef.current) bottomRef.current.scrollIntoView({behavior:"smooth"});
  }, [messages, open]);

  var SYSTEM = "You are a helpful customer support assistant for YvexCargo, an international logistics and cargo company.\n\nCompany info:\n- Phone: +1 509 305 2716\n- Email: support@yvexcargo.com\n- Address: New York City, USA\n- Hours: Mon-Fri 8am-6pm\n- Founded: 2006\n- Services: Air Freight (1-5 days, from $45/kg), Sea Freight (15-45 days, from $8/kg), Road Delivery (1-7 days, from $1.5/kg), Express Courier (24-48hrs, from $35), Warehousing (from $150/mo)\n\nStatuses in order: Order Placed, In Process, In Transit, Customs Check, Out for Delivery, Delivered.\n\nCustoms Check means shipment is under inspection. Customers should wait. Documents may be required.\n\nTracking code format: YVC-YEAR-XXXXXX\n\n"+(session?"Logged-in user: "+session.name+" ("+session.email+").":"User is not logged in.")+"\n\nBe concise, warm and professional. Never fabricate tracking data.";

  function send() {
    var text = input.trim();
    if (!text || loading) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    var updated = messages.concat([{role:"user",content:text}]);
    setMessages(updated);
    setLoading(true);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: updated.map(function(m){ return { role: m.role, content: m.content }; })
      }),
    }).then(function(res){ return res.json(); }).then(function(data){
      var reply = data.content || "Sorry, I could not get a response. Please try again.";
      setMessages(function(prev){ return prev.concat([{ role:"assistant", content:reply }]); });
      setLoading(false);
    }).catch(function(){
      setMessages(function(prev){ return prev.concat([{ role:"assistant", content:"I am having trouble connecting. Please email support@yvexcargo.com or call +1 509 305 2716." }]); });
      setLoading(false);
    });
  }

  var quickPrompts = ["Track my shipment","Customs check help","Delivery timeframes","Contact support","Service pricing"];

  return (
    <>
      <button onClick={function(){setOpen(function(o){return !o;});}}
        style={{position:"fixed",bottom:24,right:24,zIndex:9000,width:58,height:58,borderRadius:"50%",background:open?"#111":"#f59e0b",color:open?"#f59e0b":"#111",fontSize:24,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(0,0,0,.25)",border:"2px solid #111",transition:"all .2s"}}
        title={open?"Close chat":"AI Support"}>
        {open ? "X" : "?"}
      </button>
      {!open && <span style={{position:"fixed",bottom:72,right:24,zIndex:9001,background:"#ef4444",color:"#fff",borderRadius:100,fontSize:10,fontWeight:800,padding:"2px 7px",border:"2px solid #fff",pointerEvents:"none"}}>AI</span>}

      {open && (
        <div style={{position:"fixed",bottom:92,right:24,zIndex:8999,width:370,maxWidth:"calc(100vw - 32px)",background:"#fff",border:"2px solid #111",borderRadius:20,boxShadow:"0 8px 40px rgba(0,0,0,.18)",display:"flex",flexDirection:"column",height:520}}>
          <div style={{background:"#111",borderRadius:"18px 18px 0 0",padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,background:"#f59e0b",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#111"}}>AI</div>
            <div style={{flex:1}}>
              <div style={{color:"#fff",fontWeight:800,fontSize:14}}>YvexCargo AI Support</div>
              <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
                <span style={{width:7,height:7,background:"#4ade80",borderRadius:"50%",display:"inline-block"}} />
                <span style={{color:"rgba(255,255,255,.5)",fontSize:11}}>Online — Powered by Claude</span>
              </div>
            </div>
            <button onClick={function(){setMessages([{role:"assistant",content:"Chat cleared! How can I help you?"}]);}}
              style={{background:"rgba(255,255,255,.1)",border:"none",color:"rgba(255,255,255,.6)",borderRadius:8,padding:"5px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
              Clear
            </button>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"14px 13px",display:"flex",flexDirection:"column",gap:11}}>
            {messages.map(function(m,i){
              return (
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:8}}>
                  {m.role==="assistant" && <div style={{width:28,height:28,background:"#f59e0b",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#111",flexShrink:0,marginTop:2}}>AI</div>}
                  <div style={{maxWidth:"78%",background:m.role==="user"?"#111":"#f4f4f4",color:m.role==="user"?"#fff":"#111",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"10px 13px",fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word",border:m.role==="user"?"none":"1.5px solid #e5e5e5"}}>
                    {m.content}
                  </div>
                  {m.role==="user" && <div style={{width:28,height:28,background:"#e5e5e5",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0,marginTop:2,fontWeight:800,color:"#525252"}}>{session?session.name[0].toUpperCase():"?"}</div>}
                </div>
              );
            })}
            {loading && (
              <div style={{display:"flex",gap:8}}>
                <div style={{width:28,height:28,background:"#f59e0b",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#111"}}>AI</div>
                <div style={{background:"#f4f4f4",border:"1.5px solid #e5e5e5",borderRadius:"14px 14px 14px 4px",padding:"12px 16px",display:"flex",gap:5,alignItems:"center"}}>
                  {[0,1,2].map(function(ix){return <span key={ix} style={{width:7,height:7,background:"#a3a3a3",borderRadius:"50%",display:"inline-block",animation:"bounce .9s ease "+(ix*.15)+"s infinite"}} />;} )}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length<=1 && (
            <div style={{padding:"0 13px 10px",display:"flex",gap:5,flexWrap:"wrap"}}>
              {quickPrompts.map(function(q){
                return <button key={q} onClick={function(){setInput(q);if(taRef.current)taRef.current.focus();}} style={{background:"#fef3c7",border:"1.5px solid #f59e0b",color:"#92400e",borderRadius:100,fontSize:11,fontWeight:700,padding:"4px 11px",cursor:"pointer"}}>{q}</button>;
              })}
            </div>
          )}

          <div style={{padding:"12px 13px",borderTop:"2px solid #e5e5e5",display:"flex",gap:8,alignItems:"flex-end"}}>
            <textarea ref={taRef} value={input} onChange={function(e){setInput(e.target.value);}}
              onKeyDown={function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
              onInput={function(e){e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,90)+"px";}}
              placeholder="Ask anything about your shipment..." rows={1}
              style={{flex:1,border:"1.5px solid #e5e5e5",borderRadius:10,padding:"9px 12px",fontSize:13,resize:"none",fontFamily:"inherit",outline:"none",lineHeight:1.5,maxHeight:90,overflowY:"auto"}} />
            <button onClick={send} disabled={!input.trim()||loading}
              style={{width:38,height:38,background:input.trim()&&!loading?"#f59e0b":"#e5e5e5",border:"none",borderRadius:10,fontSize:16,cursor:input.trim()&&!loading?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background .15s"}}>
              →
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0);}40%{transform:translateY(-6px);}}`}</style>
    </>
  );
}

function useInView(threshold) {
  var ref = useRef(null);
  var [inView, setInView] = useState(false);
  useEffect(function(){
    var el = ref.current;
    if (!el) return;
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) {
          // Double rAF guarantees at least one painted frame at opacity:0 first,
          // so the transition is visible even when the element is already in
          // view on initial page load (otherwise the browser can coalesce the
          // 0->1 change into a single paint and it looks like nothing animated).
          requestAnimationFrame(function(){
            requestAnimationFrame(function(){ setInView(true); });
          });
          obs.unobserve(el);
        }
      });
    }, { threshold: threshold || 0.15, rootMargin: "0px 0px -40px 0px" });
    obs.observe(el);
    return function(){ obs.disconnect(); };
  }, []);
  return [ref, inView];
}

function Reveal(props) {
  var [ref, inView] = useInView(props.threshold);
  var style = Object.assign({ transitionDelay: (props.delay || 0) + "ms" }, props.style || {});
  return <div ref={ref} className={"reveal" + (inView ? " in" : "")} style={style}>{props.children}</div>;
}

function CountUp(props) {
  var [ref, inView] = useInView(0.5);
  var [val, setVal] = useState(0);
  useEffect(function(){
    if (!inView) return;
    var start = null, dur = props.duration || 1300, to = props.to;
    function step(ts){
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      setVal(Math.floor(p * to));
      if (p < 1) requestAnimationFrame(step); else setVal(to);
    }
    requestAnimationFrame(step);
  }, [inView]);
  return <span ref={ref}>{val}{props.suffix || ""}</span>;
}

function Photo(props) {
  var w = props.w || 1200, h = props.h || 800;
  var primary = "https://images.unsplash.com/photo-" + props.id + "?auto=format&fit=crop&w=" + w + "&q=80";
  var fallback = "https://picsum.photos/seed/" + props.seed + "/" + w + "/" + h;
  return (
    <img src={primary} loading="lazy" alt={props.alt || ""} className={props.className} style={props.style}
      onError={function(e){ e.target.onerror = null; e.target.src = fallback; }} />
  );
}

var TICKER_ITEMS = [
  "HAM \u2192 NYC \u00b7 SEA FREIGHT \u00b7 250KG",
  "LON \u2192 BER \u00b7 AIR FREIGHT \u00b7 18KG",
  "LYO \u2192 CHI \u00b7 EXPRESS \u00b7 5KG",
  "TYO \u2192 LAX \u00b7 SEA FREIGHT \u00b7 1.2T",
  "DXB \u2192 LHR \u00b7 AIR FREIGHT \u00b7 40KG",
  "NYC \u2192 SYD \u00b7 SEA FREIGHT \u00b7 800KG",
  "SGP \u2192 ROT \u00b7 SEA FREIGHT \u00b7 2.4T",
  "PAR \u2192 JNB \u00b7 EXPRESS \u00b7 12KG",
];

function Ticker() {
  var items = TICKER_ITEMS.concat(TICKER_ITEMS);
  return (
    <div className="ticker diag-band">
      <div className="ticker-track" style={{position:"relative",zIndex:2}}>
        {items.map(function(it, i){
          return <span key={i} className="mono ticker-item"><b>MANIFEST</b>{it}<span className="ticker-dot">{"\u25cf"}</span></span>;
        })}
      </div>
    </div>
  );
}

var SERVICES = [
  { tag:"Ocean", title:"Sea Freight", desc:"Full and part container loads across every major trade lane.", photo:"1578575437130-527eed3abbec", seed:"seafreight" },
  { tag:"Air",   title:"Air Freight", desc:"Time-critical cargo, airborne within 24 hours of pickup.", photo:"1436491865332-7a61a109cc05", seed:"airfreight" },
  { tag:"Ground",title:"Road Delivery", desc:"Cross-border trucking with live GPS on every leg.", photo:"1519003722824-194d4455a60c", seed:"roaddelivery" },
  { tag:"Express",title:"Express Courier", desc:"Documents and parcels, door-to-door in under 72 hours.", photo:"1595246140625-573b715d11dc", seed:"expresscourier" },
  { tag:"Storage",title:"Warehousing", desc:"Bonded and climate-controlled storage at 40+ hubs worldwide.", photo:"1553413077-190dd305871c", seed:"warehousing" },
];

var FEATURES = [
  "Live tracking on every leg, not just pickup and delivery",
  "Customs paperwork handled end-to-end — no surprise holds",
  "Cargo insured up to full declared value as standard",
  "Dedicated account manager for recurring shippers",
  "24/7 support, in your timezone",
  "Transparent pricing — no hidden fees at delivery",
];

var TESTIMONIALS = [
  { name:"Elena Marsh", role:"Freight Manager, Marsh & Voss Trading", quote:"Customs held one of our shipments for two days and we knew about it before our client even asked. That visibility changed how we plan.", photo:"1494790108377-be9c29b29330", seed:"testimonial1" },
  { name:"Daniel Osei", role:"Founder, Osei Electronics Exports", quote:"We ship 30-40 pallets a month. The status log means I stop answering \u201cwhere's my order\u201d emails myself.", photo:"1507003211169-0a1dd7228f2d", seed:"testimonial2" },
  { name:"Priya Nair", role:"Operations Lead, Nair Home Goods", quote:"Switched from two carriers to one. Onboarding took a day, and our delivery disputes dropped by half in the first quarter.", photo:"1500648767791-00dcc994a43e", seed:"testimonial3" },
];

var HERO_PHOTOS = [
  { id:"1494412574745-6e39fc09b28d", seed:"herocontainers", alt:"Cargo containers at port" },
  { id:"1578575437130-527eed3abbec", seed:"heroship", alt:"Cargo ship at sea" },
  { id:"1436491865332-7a61a109cc05", seed:"heroplane", alt:"Cargo plane wing above clouds" },
];

function HomePage(props) {
  var setPage=props.setPage, setTrackId=props.setTrackId;
  var [t, setT] = useState("");
  var [heroIdx, setHeroIdx] = useState(0);
  useEffect(function(){
    var iv = setInterval(function(){ setHeroIdx(function(i){ return (i+1) % HERO_PHOTOS.length; }); }, 4200);
    return function(){ clearInterval(iv); };
  }, []);
  return (
    <div className="fade">
      <Ticker />

      <div className="hero-full">
        {HERO_PHOTOS.map(function(p, i){
          return (
            <div key={p.id} className={"hero-slide" + (i===heroIdx ? " on" : "")}>
              <Photo id={p.id} seed={p.seed} alt={p.alt} w={1600} h={900} className={i===heroIdx ? "kb" : ""} />
            </div>
          );
        })}
        <div className="hero-scrim" />
        <div className="hero-scrim-b" />
        <div className="hero-content">
          <div className="eyebrow-line"><span>Serving 50+ Countries</span></div>
          <h1 style={{color:"#fff",fontSize:48,fontWeight:800,lineHeight:1.08,letterSpacing:"-0.02em",marginBottom:16,maxWidth:560}}>Your cargo,<br />tracked to the <span style={{color:"#f59e0b"}}>last mile.</span></h1>
          <p style={{color:"rgba(255,255,255,.72)",fontSize:15,lineHeight:1.7,marginBottom:28,maxWidth:420}}>Every location change, customs event and status update — recorded and preserved forever.</p>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:32}}>
            <button className="btn btn-y" style={{padding:"13px 28px"}} onClick={function(){setPage("register");}}>Create Free Account</button>
            <button className="btn" style={{padding:"13px 28px",background:"transparent",color:"#fff",border:"1.5px solid rgba(255,255,255,.4)"}} onClick={function(){setPage("track");}}>Track Shipment</button>
          </div>
          <div className="glass-panel">
            <p style={{color:"#f59e0b",fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:11}}>Quick Track</p>
            <div style={{display:"flex",gap:9}}>
              <input className="inp" placeholder="Enter tracking ID..." value={t} onChange={function(e){setT(e.target.value);}}
                style={{flex:1,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.2)",color:"#fff"}}
                onKeyDown={function(e){if(e.key==="Enter"&&t){setTrackId(t);setPage("track");}}} />
              <button className="btn btn-y" onClick={function(){if(t){setTrackId(t);setPage("track");}}}>Track</button>
            </div>
          </div>
        </div>
        <div className="stat-strip">
          <div className="stat-strip-inner">
            {[[50,"K+","Shipments Delivered"],[99.2,"%","On-Time Rate"],[50,"+","Countries Served"],[24,"/7","Support Coverage"]].map(function(item){
              return (
                <div key={item[2]} className="stat-strip-item">
                  <div className="mono" style={{fontSize:20,fontWeight:700,color:"#fff"}}><CountUp to={item[0]} suffix={item[1]} /></div>
                  <div style={{color:"rgba(255,255,255,.55)",fontSize:11,fontWeight:600,marginTop:2}}>{item[2]}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <section style={{padding:"88px 20px 72px",borderBottom:"1px solid var(--g2)"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <Reveal>
            <div className="eyebrow-line"><span>What We Move</span></div>
            <h2 style={{fontSize:32,fontWeight:800,color:"#111",marginBottom:36,maxWidth:460}}>A mode for every shipment</h2>
          </Reveal>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(230px, 1fr))",gap:20}}>
            {SERVICES.map(function(s, i){
              return (
                <Reveal key={s.title} delay={i*80}>
                  <div className="svc-card">
                    <Photo id={s.photo} seed={s.seed} alt={s.title} w={500} h={600} />
                    <div className="svc-overlay">
                      <span className="svc-tag">{s.tag}</span>
                      <div style={{color:"#fff",fontWeight:700,fontSize:17,marginBottom:6}}>{s.title}</div>
                      <div style={{color:"rgba(255,255,255,.7)",fontSize:12,lineHeight:1.5}}>{s.desc}</div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <div className="parallax-banner">
        <Photo id="1583508915901-b5f84c1dcde1" seed="cargoplane" alt="Cargo plane on the tarmac at dusk" w={1600} h={800} className="kb" />
        <div className="parallax-tint" />
        <div className="parallax-content" style={{maxWidth:1200,margin:"0 auto"}}>
          <Reveal>
            <div className="eyebrow-line"><span>Express Network</span></div>
            <h2 style={{color:"#fff",fontSize:32,fontWeight:800,letterSpacing:"-0.02em",maxWidth:520,lineHeight:1.15}}>On time. Every time. Anywhere.</h2>
          </Reveal>
        </div>
      </div>

      <section style={{padding:"88px 20px",borderBottom:"1px solid var(--g2)"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <Reveal>
            <div className="eyebrow-line"><span>Tracking Pipeline</span></div>
            <h2 style={{fontSize:28,fontWeight:800,color:"#111",marginBottom:40}}>Six stages, logged every time</h2>
          </Reveal>
          <div style={{position:"relative"}}>
            <div style={{position:"absolute",top:13,left:0,right:0,height:1,background:"var(--g3)"}} />
            <div style={{display:"flex",overflowX:"auto",gap:16,position:"relative"}}>
              {STATUS_FLOW.map(function(s,i){
                return (
                  <Reveal key={s.key} delay={i*80} style={{flex:"1 0 150px"}}>
                    <div>
                      <div style={{width:27,height:27,borderRadius:"50%",background:i===0?"var(--y)":"#fff",border:"1.5px solid "+(i===0?"var(--y)":"var(--g3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#111",marginBottom:16}} className="mono">{i+1}</div>
                      <div style={{fontWeight:700,fontSize:11,color:"#111",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{s.label}</div>
                      <div style={{fontSize:12,color:"#525252",lineHeight:1.65,paddingRight:10}}>{s.desc}</div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section style={{padding:"88px 20px",borderBottom:"1px solid var(--g2)"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:56,alignItems:"center"}} className="g2">
          <Reveal>
            <div className="feat-photo">
              <Photo id="1586528116311-ad8dd3c8310d" seed="warehouseworkers" alt="Logistics team checking shipment" w={800} h={700} className="kb" />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div>
              <div className="eyebrow-line"><span>Why Ship With Us</span></div>
              <h2 style={{fontSize:28,fontWeight:800,color:"#111",marginBottom:8}}>Built for businesses that ship often</h2>
              {FEATURES.map(function(f){
                return (
                  <div key={f} className="feat-item">
                    <div className="feat-check">{"\u2013"}</div>
                    <div style={{color:"#374151",fontSize:13,lineHeight:1.6}}>{f}</div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      <section style={{padding:"88px 20px",borderBottom:"1px solid var(--g2)"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <Reveal>
            <div style={{marginBottom:40}}>
              <div className="eyebrow-line"><span>Trusted By Shippers</span></div>
              <h2 style={{fontSize:28,fontWeight:800,color:"#111",maxWidth:440}}>What our customers say</h2>
            </div>
          </Reveal>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))",gap:0}}>
            {TESTIMONIALS.map(function(tm, i){
              return (
                <Reveal key={tm.name} delay={i*90}>
                  <div className="test-card" style={i===TESTIMONIALS.length-1?{borderRight:"none",paddingRight:0}:{}}>
                    <span className="test-quote-mark">{"\u201c"}</span>
                    <p style={{color:"#374151",fontSize:14,lineHeight:1.75,marginBottom:22,fontStyle:"italic"}}>{tm.quote}</p>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Photo id={tm.photo} seed={tm.seed} alt={tm.name} w={120} h={120} className="test-avatar" style={{width:38,height:38,borderRadius:"50%",objectFit:"cover"}} />
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:"#111"}}>{tm.name}</div>
                        <div style={{fontSize:11,color:"#a3a3a3"}}>{tm.role}</div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cta-quiet" style={{padding:"72px 20px"}}>
        <Reveal>
          <div style={{maxWidth:540,margin:"0 auto",textAlign:"center"}}>
            <div className="cta-underline" />
            <h2 style={{color:"#fff",fontSize:32,fontWeight:800,letterSpacing:"-0.02em",marginBottom:12}}>Ready to ship globally?</h2>
            <p style={{color:"rgba(255,255,255,.55)",fontSize:14,marginBottom:26}}>Join thousands of businesses that trust YvexCargo.</p>
            <button className="btn btn-y" style={{fontSize:14,padding:"13px 36px"}} onClick={function(){setPage("register");}}>Create Free Account</button>
          </div>
        </Reveal>
      </section>

      <SiteFooter setPage={setPage} />
    </div>
  );
}

function SiteFooter(props) {
  var setPage = props.setPage;
  function go(page){ return function(){ setPage(page); window.scrollTo(0,0); }; }
  return (
    <footer style={{background:"#fff",padding:"40px 20px 18px",borderTop:"1px solid var(--g3)"}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div className="g2" style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:32,paddingBottom:26,borderBottom:"1px solid var(--g3)"}}>
          <div><Logo /><p style={{color:"#525252",fontSize:12,lineHeight:1.7,maxWidth:230,marginTop:12}}>Global logistics with full transparency — every status recorded forever.</p></div>
          <div>
            <div style={{fontWeight:800,fontSize:11,color:"#111",marginBottom:11,letterSpacing:"0.08em",textTransform:"uppercase"}}>Services</div>
            {["Air Freight","Sea Freight","Road Delivery","Express Courier","Warehousing"].map(function(item){
              return <div key={item} className="flink" onClick={go("services")} style={{marginBottom:6,fontSize:12,color:"#525252",cursor:"pointer"}}>{item}</div>;
            })}
          </div>
          <div>
            <div style={{fontWeight:800,fontSize:11,color:"#111",marginBottom:11,letterSpacing:"0.08em",textTransform:"uppercase"}}>Company</div>
            {[["About Us","about"],["Careers","careers"],["News","news"],["Partners","partners"]].map(function(item){
              return <div key={item[0]} className="flink" onClick={go(item[1])} style={{marginBottom:6,fontSize:12,color:"#525252",cursor:"pointer"}}>{item[0]}</div>;
            })}
          </div>
          <div>
            <div style={{fontWeight:800,fontSize:11,color:"#111",marginBottom:11,letterSpacing:"0.08em",textTransform:"uppercase"}}>Contact</div>
            <a href="mailto:support@yvexcargo.com" style={{display:"block",marginBottom:6,fontSize:12,color:"#525252",textDecoration:"none"}}>support@yvexcargo.com</a>
            <a href="tel:+15093052716" style={{display:"block",marginBottom:6,fontSize:12,color:"#525252",textDecoration:"none"}}>+1 509 305 2716</a>
            <div style={{marginBottom:6,fontSize:12,color:"#525252"}}>New York City, USA</div>
            <div style={{marginBottom:6,fontSize:12,color:"#525252"}}>Mon-Fri 8am-6pm</div>
          </div>
        </div>
        <div style={{paddingTop:14,display:"flex",justifyContent:"space-between",fontSize:11,color:"#a3a3a3",fontWeight:600,flexWrap:"wrap",gap:8}}>
          <span>2006 YvexCargo. All rights reserved.</span>
          <span>
            <span className="flink" onClick={go("privacy")} style={{cursor:"pointer"}}>Privacy Policy</span> — <span className="flink" onClick={go("terms")} style={{cursor:"pointer"}}>Terms of Service</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

function PageHeader(props) {
  return (
    <section style={{padding:"56px 20px 40px",borderBottom:"1px solid var(--g2)"}}>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <Reveal>
          <div className="eyebrow-line"><span>{props.eyebrow}</span></div>
          <h1 style={{fontSize:36,fontWeight:800,color:"#111",letterSpacing:"-0.02em",marginBottom:14}}>{props.title}</h1>
          {props.sub && <p style={{color:"#525252",fontSize:15,lineHeight:1.7,maxWidth:640}}>{props.sub}</p>}
        </Reveal>
      </div>
    </section>
  );
}

var ABOUT_TIMELINE = [
  { year:"2006", text:"Founded in New York by a small team of freight forwarders tired of shipments disappearing into a black box after customs." },
  { year:"2011", text:"Opened our first overseas hub in Hamburg, connecting European exporters directly to US ports." },
  { year:"2016", text:"Launched our digital tracking platform, putting live status updates in front of customers for the first time." },
  { year:"2021", text:"Crossed 50 countries served, with bonded warehousing added at every major hub." },
  { year:"2024", text:"Introduced automatic customs-hold alerts, so customers hear about a delay before they have to ask." },
];

var ABOUT_VALUES = [
  { title:"Visibility first", desc:"If a shipment moves, changes hands, or gets held, it goes in the log. No status update is ever quietly skipped." },
  { title:"Own the delay", desc:"Customs holds and weather delays happen. We tell customers immediately instead of waiting for them to ask." },
  { title:"One point of contact", desc:"Recurring shippers get a dedicated account manager, not a rotating queue of support tickets." },
];

function AboutPage(props) {
  return (
    <div className="fade">
      <PageHeader eyebrow="Our Story" title="Built after one shipment went missing for nine days" sub="YvexCargo started as a reaction to a bad experience, not a business plan. Here's how a customs delay in 2006 became a logistics company serving 50+ countries." />
      <section style={{padding:"56px 20px",borderBottom:"1px solid var(--g2)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <Reveal>
            <p style={{color:"#374151",fontSize:14,lineHeight:1.8,marginBottom:20}}>In 2006, our founder was running a small import business and lost nine days — and a client — to a shipment that sat in customs with no explanation. Calls to the carrier went nowhere. The only update came after the client asked for a refund. That gap between "in transit" and "actually knowing what's happening" became the entire reason YvexCargo exists.</p>
            <p style={{color:"#374151",fontSize:14,lineHeight:1.8}}>We started with three people and a single trade lane between New York and Hamburg. Every shipment got a manual log: who touched it, where, and when. That habit never left — it's now the tracking pipeline every customer sees today.</p>
          </Reveal>
        </div>
      </section>
      <section style={{padding:"56px 20px",borderBottom:"1px solid var(--g2)",background:"#fafafa"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <Reveal><h2 style={{fontSize:22,fontWeight:800,color:"#111",marginBottom:28}}>How we got here</h2></Reveal>
          {ABOUT_TIMELINE.map(function(t, i){
            return (
              <Reveal key={t.year} delay={i*70}>
                <div style={{display:"flex",gap:20,paddingBottom:22,marginBottom:22,borderBottom:i<ABOUT_TIMELINE.length-1?"1px solid var(--g3)":"none"}}>
                  <div className="mono" style={{minWidth:56,fontWeight:700,color:"#f59e0b",fontSize:14}}>{t.year}</div>
                  <div style={{color:"#374151",fontSize:13,lineHeight:1.7}}>{t.text}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
      <section style={{padding:"56px 20px",borderBottom:"1px solid var(--g2)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <Reveal><h2 style={{fontSize:22,fontWeight:800,color:"#111",marginBottom:24}}>What that experience taught us</h2></Reveal>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:24}}>
            {ABOUT_VALUES.map(function(v, i){
              return (
                <Reveal key={v.title} delay={i*80}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:"#111",marginBottom:8}}>{v.title}</div>
                    <div style={{color:"#525252",fontSize:12,lineHeight:1.7}}>{v.desc}</div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
      <section className="cta-quiet" style={{padding:"56px 20px"}}>
        <Reveal>
          <div style={{maxWidth:480,margin:"0 auto",textAlign:"center"}}>
            <div className="cta-underline" />
            <h2 style={{color:"#fff",fontSize:24,fontWeight:800,marginBottom:20}}>Ship with a team that answers before you ask</h2>
            <button className="btn btn-y" style={{fontSize:14,padding:"13px 32px"}} onClick={function(){props.setPage("register");}}>Create Free Account</button>
          </div>
        </Reveal>
      </section>
      <SiteFooter setPage={props.setPage} />
    </div>
  );
}

var OPEN_ROLES = [
  { title:"Customs Compliance Specialist", loc:"New York, USA", type:"Full-time" },
  { title:"Operations Coordinator, Sea Freight", loc:"Hamburg, Germany", type:"Full-time" },
  { title:"Warehouse Associate", loc:"Singapore", type:"Full-time" },
  { title:"Backend Engineer, Tracking Platform", loc:"Remote", type:"Full-time" },
  { title:"Customer Support, Night Shift", loc:"Remote", type:"Part-time" },
];

function CareersPage(props) {
  return (
    <div className="fade">
      <PageHeader eyebrow="Careers" title="Help us close the gap between shipped and delivered" sub="We're a logistics company that happens to write a lot of software. Most roles sit close to an actual shipment, not a spreadsheet about one." />
      <section style={{padding:"48px 20px",borderBottom:"1px solid var(--g2)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <Reveal><h2 style={{fontSize:20,fontWeight:800,color:"#111",marginBottom:22}}>Open roles</h2></Reveal>
          {OPEN_ROLES.map(function(r, i){
            return (
              <Reveal key={r.title} delay={i*60}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,padding:"16px 0",borderBottom:i<OPEN_ROLES.length-1?"1px solid var(--g3)":"none"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:"#111",marginBottom:4}}>{r.title}</div>
                    <div style={{fontSize:12,color:"#a3a3a3"}}>{r.loc} · {r.type}</div>
                  </div>
                  <a href="mailto:careers@yvexcargo.com" className="btn btn-o sm">Apply</a>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
      <section style={{padding:"48px 20px",borderBottom:"1px solid var(--g2)",background:"#fafafa"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <Reveal>
            <div style={{textAlign:"center"}}>
              <h2 style={{fontSize:20,fontWeight:800,color:"#111",marginBottom:10}}>Don't see the right role?</h2>
              <p style={{color:"#525252",fontSize:13,marginBottom:18}}>We're always open to hearing from people who've worked customs, warehousing, or freight ops.</p>
              <a href="mailto:careers@yvexcargo.com" className="btn btn-y">Email careers@yvexcargo.com</a>
            </div>
          </Reveal>
        </div>
      </section>
      <SiteFooter setPage={props.setPage} />
    </div>
  );
}

var NEWS_POSTS = [
  { date:"14 May 2026", title:"YvexCargo opens third Asia-Pacific hub in Singapore", excerpt:"The new bonded warehouse adds 30,000 sq ft of climate-controlled storage and cuts average transit time to Southeast Asia by a day." },
  { date:"2 Feb 2026", title:"Introducing automatic customs-hold alerts", excerpt:"Customers now get an email the moment a shipment is flagged for inspection, with the reason and expected resolution time." },
  { date:"19 Nov 2025", title:"YvexCargo named a top 50 logistics startup", excerpt:"Recognized for our public shipment-status log — a feature most competitors keep behind a support ticket." },
  { date:"3 Sep 2025", title:"Expanding road delivery coverage across the EU", excerpt:"Cross-border trucking now covers 18 EU countries with live GPS tracking on every leg." },
];

function NewsPage(props) {
  return (
    <div className="fade">
      <PageHeader eyebrow="News" title="What's happening at YvexCargo" />
      <section style={{padding:"48px 20px"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          {NEWS_POSTS.map(function(p, i){
            return (
              <Reveal key={p.title} delay={i*70}>
                <div style={{padding:"24px 0",borderBottom:i<NEWS_POSTS.length-1?"1px solid var(--g3)":"none"}}>
                  <div className="mono" style={{fontSize:11,color:"#a3a3a3",marginBottom:8}}>{p.date}</div>
                  <div style={{fontWeight:700,fontSize:17,color:"#111",marginBottom:8}}>{p.title}</div>
                  <div style={{color:"#525252",fontSize:13,lineHeight:1.7}}>{p.excerpt}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
      <SiteFooter setPage={props.setPage} />
    </div>
  );
}

var PARTNER_GROUPS = [
  { title:"Ocean & Air Carriers", items:["Atlas Shipping Alliance","Meridian Air Cargo","Northbridge Container Lines"] },
  { title:"Customs & Compliance", items:["Meridian Customs Group","Harborview Brokerage Partners"] },
  { title:"Technology", items:["PortLink Technologies","Cargotrace Systems"] },
  { title:"Insurance", items:["Northbridge Insurance Partners","Freightguard Underwriters"] },
];

function PartnersPage(props) {
  return (
    <div className="fade">
      <PageHeader eyebrow="Partners" title="The network behind every shipment" sub="No single carrier covers 50 countries alone. These are the partners we route through, insure through, and build with." />
      <section style={{padding:"48px 20px",borderBottom:"1px solid var(--g2)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          {PARTNER_GROUPS.map(function(g, i){
            return (
              <Reveal key={g.title} delay={i*70}>
                <div style={{marginBottom:32}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#111",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>{g.title}</div>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                    {g.items.map(function(name){
                      return <div key={name} style={{border:"1px solid var(--g3)",borderRadius:8,padding:"10px 16px",fontSize:13,color:"#374151",fontWeight:600}}>{name}</div>;
                    })}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
      <section style={{padding:"48px 20px",background:"#fafafa"}}>
        <div style={{maxWidth:900,margin:"0 auto",textAlign:"center"}}>
          <Reveal>
            <h2 style={{fontSize:20,fontWeight:800,color:"#111",marginBottom:10}}>Want to partner with us?</h2>
            <p style={{color:"#525252",fontSize:13,marginBottom:18}}>We're expanding our carrier and brokerage network in Southeast Asia and Latin America.</p>
            <a href="mailto:partnerships@yvexcargo.com" className="btn btn-y">Email partnerships@yvexcargo.com</a>
          </Reveal>
        </div>
      </section>
      <SiteFooter setPage={props.setPage} />
    </div>
  );
}

function PrivacyPage(props) {
  var sections = [
    { h:"Information we collect", b:"When you create an account, we collect your name, email, and password. When you create a shipment, we collect sender and receiver names, addresses, and shipment details. We do not collect payment card information through this platform." },
    { h:"How we use it", b:"We use your information to create and track shipments, send status and customs-hold notifications, and provide support. We do not sell customer data to third parties." },
    { h:"What we share with partners", b:"Shipment details are shared with the specific carrier, customs broker, or warehouse handling that shipment — only as needed to move the cargo." },
    { h:"Data retention", b:"Shipment logs are retained indefinitely so tracking history stays available. Account data is retained until you request deletion." },
    { h:"Your rights", b:"You can request a copy of your data or ask us to delete your account at any time by contacting support@yvexcargo.com." },
    { h:"Changes to this policy", b:"If this policy changes materially, we'll notify account holders by email before the change takes effect." },
  ];
  return (
    <div className="fade">
      <PageHeader eyebrow="Legal" title="Privacy Policy" sub="Last updated 1 January 2026." />
      <section style={{padding:"48px 20px"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          {sections.map(function(s, i){
            return (
              <Reveal key={s.h} delay={i*50}>
                <div style={{marginBottom:28}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#111",marginBottom:8}}>{s.h}</div>
                  <div style={{color:"#525252",fontSize:13,lineHeight:1.8}}>{s.b}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
      <SiteFooter setPage={props.setPage} />
    </div>
  );
}

function TermsPage(props) {
  var sections = [
    { h:"Acceptance of terms", b:"By creating an account or booking a shipment through YvexCargo, you agree to these terms." },
    { h:"Service description", b:"YvexCargo arranges and tracks freight forwarding across sea, air, road, and express courier modes, and provides shipment visibility through this platform." },
    { h:"Your responsibilities", b:"You're responsible for providing accurate shipment details, including sender/receiver information and cargo description. Inaccurate declarations may delay customs clearance." },
    { h:"Fees and payment", b:"Fees are quoted per shipment prior to booking. Card application fees, where applicable, are informational and non-refundable once processing begins." },
    { h:"Limitation of liability", b:"YvexCargo insures cargo up to its full declared value as standard. Liability beyond the declared value is not assumed unless separately agreed in writing." },
    { h:"Governing law", b:"These terms are governed by the laws of the State of New York, USA." },
    { h:"Changes to these terms", b:"We may update these terms from time to time. Continued use of the platform after a change constitutes acceptance." },
  ];
  return (
    <div className="fade">
      <PageHeader eyebrow="Legal" title="Terms of Service" sub="Last updated 1 January 2026." />
      <section style={{padding:"48px 20px"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          {sections.map(function(s, i){
            return (
              <Reveal key={s.h} delay={i*50}>
                <div style={{marginBottom:28}}>
                  <div style={{fontWeight:700,fontSize:14,color:"#111",marginBottom:8}}>{s.h}</div>
                  <div style={{color:"#525252",fontSize:13,lineHeight:1.8}}>{s.b}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
      <SiteFooter setPage={props.setPage} />
    </div>
  );
}

function ServicesPage() {
  var svcs = [
    {icon:"\u2708\uFE0F",name:"Air Freight",      price:"From $45/kg",   time:"1-5 days",   desc:"Priority air cargo for time-sensitive international shipments.",      features:["Priority customs clearance","Temperature-controlled","Door-to-door"]},
    {icon:"\uD83D\uDEA2",name:"Sea Freight",      price:"From $8/kg",    time:"15-45 days", desc:"Economical ocean shipping for large volume and bulk cargo.",           features:["FCL and LCL options","Container tracking","Marine insurance"]},
    {icon:"\uD83D\uDE9A",name:"Road Delivery",    price:"From $1.5/kg",  time:"1-7 days",   desc:"Ground transport covering all major cities across continents.",        features:["GPS-tracked vehicles","Proof of delivery","Same-day options"]},
    {icon:"\u26A1",      name:"Express Courier",  price:"From $35 flat", time:"24-48 hrs",  desc:"Next-business-day delivery guaranteed for urgent parcels.",            features:["Next-day guarantee","SMS updates","Signature confirmation"]},
    {icon:"\uD83C\uDFED",name:"Warehousing",      price:"From $150/mo",  time:"Flexible",   desc:"Secure, climate-controlled storage with inventory management.",        features:["24/7 security","Inventory system","Pick-and-pack"]},
    {icon:"\uD83C\uDF0D",name:"International",    price:"Custom quote",  time:"Varies",     desc:"End-to-end logistics with customs brokerage included.",                features:["Customs brokerage","Documentation support","Trade compliance"]},
  ];
  return (
    <div className="fade">
      <section style={{background:"#111",padding:"48px 20px",borderBottom:"2px solid #111"}}>
        <div style={{maxWidth:1200,margin:"0 auto"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#f59e0b",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:7}}>What We Offer</div>
          <h1 style={{color:"#fff",fontSize:40,fontWeight:900,letterSpacing:"-0.03em"}}>Our Services</h1>
        </div>
      </section>
      <section style={{padding:"48px 20px",background:"#fff"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}} className="g2">
          {svcs.map(function(s,i){
            return (
              <div key={s.name} style={{border:"2px solid #111",borderRadius:14,padding:20,background:i===0?"#f59e0b":"#fff",transition:"transform .2s"}}
                onMouseEnter={function(e){e.currentTarget.style.transform="translateY(-3px)";}}
                onMouseLeave={function(e){e.currentTarget.style.transform="";}} >
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:11}}>
                  <div style={{width:44,height:44,background:i===0?"#111":"#fef3c7",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{s.icon}</div>
                  <span style={{background:"#111",color:"#f59e0b",padding:"3px 9px",borderRadius:100,fontSize:10,fontWeight:700,height:"fit-content"}}>{s.time}</span>
                </div>
                <h3 style={{fontWeight:900,fontSize:15,color:"#111",marginBottom:3}}>{s.name}</h3>
                <div style={{fontWeight:700,fontSize:12,color:i===0?"#333":"#525252",marginBottom:8}}>{s.price}</div>
                <p style={{color:i===0?"#333":"#525252",fontSize:12,lineHeight:1.7,marginBottom:11}}>{s.desc}</p>
                <div style={{borderTop:"2px solid "+(i===0?"#111":"#e5e5e5"),paddingTop:10}}>
                  {s.features.map(function(f){return <div key={f} style={{display:"flex",gap:7,marginBottom:4}}><span style={{fontWeight:900,fontSize:11}}>v</span><span style={{color:i===0?"#333":"#525252",fontSize:12}}>{f}</span></div>;})}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

var PAGE_PATHS = {
  home:"/", services:"/services", track:"/track", login:"/login", register:"/register",
  dashboard:"/dashboard", admin:"/admin", about:"/about", careers:"/careers",
  news:"/news", partners:"/partners", privacy:"/privacy", terms:"/terms",
};
var PATH_PAGES = (function(){
  var m = {};
  for (var k in PAGE_PATHS) m[PAGE_PATHS[k]] = k;
  return m;
})();
function pageFromLocation() {
  var path = window.location.pathname.replace(/\/+$/, "") || "/";
  return PATH_PAGES[path] || "home";
}

export default function App() {
  useEffect(function(){ DB.init(); }, []);
  var [page,    setPageState] = useState(pageFromLocation);
  var [session, setSession]   = useState(function(){ return DB.getSession(); });
  var [trackId, setTrackId]   = useState("");

  function setPage(p) {
    setPageState(p);
    var path = PAGE_PATHS[p] || "/";
    if (window.location.pathname !== path) window.history.pushState({ page:p }, "", path);
    window.scrollTo(0,0);
  }

  useEffect(function(){
    function onPop(){ setPageState(pageFromLocation()); }
    window.addEventListener("popstate", onPop);
    return function(){ window.removeEventListener("popstate", onPop); };
  }, []);

  function logout() { Auth.logout(); setSession(null); setPage("home"); }

  return (
    <>
      <style>{CSS}</style>
      {page!=="admin" && <Navbar page={page} setPage={setPage} session={session} onLogout={logout} />}
      {page==="home"      && <HomePage      setPage={setPage} setTrackId={setTrackId} />}
      {page==="services"  && <ServicesPage />}
      {page==="about"     && <AboutPage     setPage={setPage} />}
      {page==="careers"   && <CareersPage   setPage={setPage} />}
      {page==="news"      && <NewsPage      setPage={setPage} />}
      {page==="partners"  && <PartnersPage  setPage={setPage} />}
      {page==="privacy"   && <PrivacyPage   setPage={setPage} />}
      {page==="terms"     && <TermsPage     setPage={setPage} />}
      {page==="track"     && <TrackPage     initialId={trackId} />}
      {page==="login"     && <AuthPage mode="login"    setPage={setPage} onLogin={setSession} />}
      {page==="register"  && <AuthPage mode="register" setPage={setPage} onLogin={setSession} />}
      {page==="dashboard" &&  session  && <UserDashboard session={session} setPage={setPage} setTrackId={setTrackId} />}
      {page==="dashboard" && !session  && <AuthPage mode="login" setPage={setPage} onLogin={setSession} />}
      {page==="admin"     &&  session && session.role==="admin"  && <AdminDashboard session={session} setPage={setPage} />}
      {page==="admin"     && (!session || session.role!=="admin") && <AuthPage mode="login" setPage={setPage} onLogin={setSession} />}
      <SupportChat session={session} />
    </>
  );
}

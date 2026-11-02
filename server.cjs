const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const DB_DIR = path.join(ROOT, 'server', 'database');
const DB_FILE = path.join(DB_DIR, 'db.json');
const collections = ['users','campaigns','characters','rolls','initiatives','npcs','stores','categories','items','negotiations','sessions'];

// Serializa todas as operações de escrita. Sem isto, vários POST/PUT/DELETE
// feitos quase ao mesmo tempo podiam ler a mesma versão da DB e uma escrita
// sobrescrever a anterior.
let mutationQueue = Promise.resolve();
function enqueueMutation(operation) {
  const run = mutationQueue.then(operation, operation);
  mutationQueue = run.catch(() => {});
  return run;
}

function initialDb() {
  return Object.fromEntries(collections.map(c => [c, []]));
}
function ensureDb() {
  fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(initialDb(), null, 2));
}
function readDb() {
  ensureDb();
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    let changed = false;
    for (const name of collections) {
      if (!Array.isArray(db[name])) { db[name] = []; changed = true; }
    }
    if (changed) writeDb(db);
    return db;
  } catch { const db = initialDb(); writeDb(db); return db; }
}
function writeDb(db) {
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}
function send(res, status, data, type='application/json') {
  res.writeHead(status, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  });
  if (type === 'application/json') res.end(JSON.stringify(data)); else res.end(data);
}
function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const file = path.normalize(decoded).replace(/^([/\\])+/, '');
  const full = path.join(DIST, file);
  return full.startsWith(DIST) ? full : null;
}
function mime(file) {
  return ({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.webp':'image/webp'})[path.extname(file).toLowerCase()] || 'application/octet-stream';
}
async function body(req) {
  let raw=''; for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw new Error('JSON inválido'); }
}
function validCollection(c) { return collections.includes(c); }

const server = http.createServer(async (req,res) => {
  try {
    if (req.method === 'OPTIONS') return send(res,204,{});
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const parts = url.pathname.split('/').filter(Boolean);

    if (parts[0] === 'api' && parts[1] === 'health') return send(res,200,{ok:true, database:DB_FILE});
    if (parts[0] === 'api' && parts[1] === 'data') {
      const name = parts[2];
      const id = parts[3];
      if (!validCollection(name)) return send(res,404,{error:'Coleção inexistente'});
      const db = readDb();
      if (req.method === 'GET') {
        if (id) {
          const item = db[name].find(x => x.id === id);
          return item ? send(res,200,item) : send(res,404,{error:'Registo não encontrado'});
        }
        return send(res,200,db[name]);
      }
      if (req.method === 'POST') {
        const data = await body(req);
        return await enqueueMutation(() => {
          const db = readDb();
          const newId = data.id || crypto.randomUUID();
          const item = { ...data, id:newId };
          if (db[name].some(x => x.id === newId)) return send(res,409,{error:'ID já existe'});
          db[name].push(item);
          writeDb(db);
          return send(res,201,item);
        });
      }
      if (req.method === 'PUT') {
        if (!id) return send(res,400,{error:'ID obrigatório'});
        const patch = await body(req);
        return await enqueueMutation(() => {
          const db = readDb();
          const idx = db[name].findIndex(x => x.id === id);
          if (idx < 0) {
            const item = { ...patch, id };
            db[name].push(item);
            writeDb(db);
            return send(res,201,item);
          }
          db[name][idx] = { ...db[name][idx], ...patch, id };
          writeDb(db);
          return send(res,200,db[name][idx]);
        });
      }
      if (req.method === 'DELETE') {
        if (!id) return send(res,400,{error:'ID obrigatório'});
        return await enqueueMutation(() => {
          const db = readDb();
          const before = db[name].length;
          db[name] = db[name].filter(x => x.id !== id);
          if (db[name].length === before) return send(res,404,{error:'Registo não encontrado'});
          writeDb(db);
          return send(res,200,{ok:true,id});
        });
      }
      return send(res,405,{error:'Método não permitido'});
    }

    if (req.method === 'GET') {
      let file = safePath(url.pathname);
      if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST,'index.html');
      if (!fs.existsSync(file)) return send(res,500,{error:'Faça npm run build primeiro'});
      return send(res,200,fs.readFileSync(file),mime(file));
    }
    send(res,404,{error:'Not found'});
  } catch (e) { console.error(e); send(res,500,{error:e.message || 'Erro interno'}); }
});
ensureDb();
server.listen(PORT, HOST, () => console.log(`Servidor local: http://localhost:${PORT}`));

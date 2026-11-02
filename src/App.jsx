import React, { useState, useEffect, useRef } from 'react';
import { Dices, LogOut, Users, Plus, Save, Activity, Shield, Zap, Map, ChevronRight, Folder, Swords, MessageSquare, Trash2, CheckSquare, Key, Settings, ShoppingBag, Package, Smartphone, Monitor, DollarSign, FileText, Phone, X, Play, Square, Heart, Brain } from 'lucide-react';
import * as THREE from 'three';

const appId = 'black-wolfes-rpg';
const APP_VERSION = '1.3.4';

const createItemSerial = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `ITEM-${crypto.randomUUID()}`;
  } catch (_) {}
  return `ITEM-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
};
const ensureItemSerial = (item) => item?.serialId || item?.instanceId || createItemSerial();


const playUiSound = (kind = 'notification') => {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = window.__bwAudioContext || new AudioCtx();
    window.__bwAudioContext = ctx;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (kind === 'shot') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(125, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.13);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc.start(now); osc.stop(now + 0.17);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.08);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.start(now); osc.stop(now + 0.15);
    }
  } catch (_) {}
};
const API_BASE = (import.meta.env.VITE_API_URL || window.__API_BASE__ || '').replace(/\/$/, '');

const siteNotify = (message, type = 'info') => {
  if (typeof document === 'undefined') return;
  playUiSound('notification');
  const host = document.getElementById('bw-site-notifications') || (() => {
    const el = document.createElement('div');
    el.id = 'bw-site-notifications';
    el.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:none;';
    document.body.appendChild(el);
    return el;
  })();
  const box = document.createElement('div');
  const border = type === 'error' ? '#dc2626' : type === 'success' ? '#047857' : '#7f1d1d';
  const icon = type === 'error' ? '✕' : type === 'success' ? '✓' : '◆';
  box.style.cssText = `pointer-events:auto;width:min(420px,calc(100vw - 32px));padding:22px;border:2px solid ${border};border-radius:20px;background:rgba(9,9,11,.97);color:#f4f4f5;box-shadow:0 0 70px rgba(220,38,38,.28);text-align:center;opacity:0;transform:translateY(18px) scale(.96);transition:opacity .2s ease,transform .2s ease;`;
  box.innerHTML = `<div style="width:42px;height:42px;margin:0 auto 12px;border:1px solid ${border};border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:20px;color:${border};">${icon}</div><div style="font-size:14px;font-weight:800;line-height:1.5;white-space:pre-line;">${String(message || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div><button style="margin-top:14px;background:#18181b;color:#a1a1aa;border:1px solid #3f3f46;border-radius:9px;padding:7px 14px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;cursor:pointer;">Fechar</button>`;
  host.appendChild(box);
  const close = () => { box.style.opacity='0'; box.style.transform='translateY(18px) scale(.96)'; setTimeout(() => box.remove(), 220); };
  box.querySelector('button')?.addEventListener('click', close);
  requestAnimationFrame(() => { box.style.opacity='1'; box.style.transform='translateY(0) scale(1)'; });
  setTimeout(close, 3000);
};

const localApi = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Erro HTTP ${response.status}`);
  return body;
};

const localCollection = (name) => `/api/data/${encodeURIComponent(name)}`;
const cDoc = (colName, data) => localApi(localCollection(colName), { method: 'POST', body: JSON.stringify(data) });
const uDoc = (colName, id, data) => localApi(`${localCollection(colName)}/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
const dDoc = (colName, id) => localApi(`${localCollection(colName)}/${encodeURIComponent(id)}`, { method: 'DELETE' });
const getCollection = (name) => localApi(localCollection(name));


const GlowingCard = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-zinc-950 border border-red-900/40 rounded-xl shadow-[0_0_15px_rgba(153,27,27,0.1)] overflow-hidden relative ${onClick ? 'cursor-pointer hover:border-red-600 transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]' : ''} ${className}`}>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/10 via-transparent to-transparent pointer-events-none"></div>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = 'primary', icon: Icon, type = 'button', className = '', disabled = false }) => {
  const baseStyle = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold tracking-wider uppercase text-sm transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 shadow-[0_0_10px_rgba(153,27,27,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]",
    secondary: "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700",
    ghost: "hover:bg-red-950/30 text-zinc-500 hover:text-red-400"
  };
  
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const SpinningD20 = ({ size = 64 }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 4.2;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(size, size);
      currentMount.appendChild(renderer.domElement);
    } catch (err) {
      console.warn('WebGL indisponível; a interface continuará sem o dado 3D.', err);
      if (currentMount) currentMount.innerHTML = '<div style=\"width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:44px;color:#ef4444;font-weight:900;\">d20</div>';
      return () => { if (currentMount) currentMount.innerHTML = ''; };
    }

    const geometry = new THREE.IcosahedronGeometry(1.6, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.3,
      metalness: 0.8,
      wireframe: false
    });
    const d20 = new THREE.Mesh(geometry, material);
    scene.add(d20);

    const wireframeGeo = new THREE.WireframeGeometry(geometry);
    const wireframeMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
    const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
    d20.add(wireframe);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xff0000, 3, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      d20.rotation.x += 0.02;
      d20.rotation.y += 0.03;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (currentMount) {
        currentMount.innerHTML = '';
      }
      renderer.dispose();
    };
  }, [size]);

  return <div ref={mountRef} className="mx-auto flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(220,38,38,0.7)]" style={{ width: size, height: size }} />;
};

const rollDiceAdvanced = (attrValue, advantageNet = 0) => {
  const baseCount = Math.max(1, Number(attrValue) || 1);
  const net = Number(advantageNet) || 0;
  const count = baseCount + Math.abs(net);
  const rolls = Array.from({ length: count }, () => rollSingleDie(20));
  const result = net < 0 ? Math.min(...rolls) : Math.max(...rolls);
  return { result, rolls };
};

const skillDefinitions = {
  'Acrobacia': ['AGI'],
  'Adestramento': ['INT', 'PRE'],
  'Artes': ['INT'],
  'Atletismo': ['VIG', 'AGI'],
  'Atualidades': ['INT'],
  'Ciências': ['INT'],
  'Crime': ['INT'],
  'Diplomacia': ['INT'],
  'Enganação': ['INT'],
  'Fortitude': ['VIG'],
  'Furtividade': ['PRE'],
  'Iniciativa': ['AGI'],
  'Intimidação': ['INT', 'PRE'],
  'Intuição': ['PRE', 'INT'],
  'Investigação': ['INT'],
  'Luta': ['FOR'],
  'Medicina': ['INT'],
  'Ocultismo': ['PRE', 'INT'],
  'Percepção': ['PRE', 'INT'],
  'Pilotagem': ['INT', 'AGI'],
  'Pontaria': ['AGI'],
  'Profissão': ['INT'],
  'Reflexos': ['AGI'],
  'Religião': ['INT', 'PRE'],
  'Sobrevivência': ['INT', 'PRE'],
  'Tática': ['PRE', 'INT'],
  'Tecnologia': ['INT'],
  'Vontade': ['PRE']
};

const attributeLabels = { FOR: 'Força', AGI: 'Agilidade', INT: 'Intelecto', PRE: 'Presença', VIG: 'Vigor' };

const generateDefaultSkills = () => {
  const skills = {};
  Object.keys(skillDefinitions).forEach(s => { skills[s] = { bonus: 0, training: 'DT' }; });
  return skills;
};

const trainingMultiplier = { 'DT': 0, 'TR': 5, 'VT': 10, 'EX': 15 };
const nextTraining = { 'DT': 'TR', 'TR': 'VT', 'VT': 'EX', 'EX': 'DT' };

const diceOptions = [2, 3, 4, 6, 8, 10, 12, 20, 100];
const rollSingleDie = (sides) => Math.floor(Math.random() * sides) + 1;

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deviceMode, setDeviceMode] = useState('pc');

  const handleSubmit = (e) => {
    e.preventDefault();
    const loginError = onLogin(username, password);
    if (loginError) setError(loginError);
  };

  return (
    <div className={`min-h-screen bg-black flex flex-col items-center justify-center p-4 relative font-sans ${deviceMode === 'mobile' ? 'max-w-[420px] mx-auto border-x border-red-950 shadow-[0_0_30px_rgba(153,27,27,0.2)]' : 'w-full'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-black to-black pointer-events-none"></div>
      
      <div className="absolute top-4 right-4 z-20 flex gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
        <button onClick={() => setDeviceMode('pc')} className={`p-2 rounded transition-colors ${deviceMode === 'pc' ? 'bg-red-950 text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`} title="Modo PC"><Monitor size={18}/></button>
        <button onClick={() => setDeviceMode('mobile')} className={`p-2 rounded transition-colors ${deviceMode === 'mobile' ? 'bg-red-950 text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`} title="Modo Telemóvel"><Smartphone size={18}/></button>
      </div>

      <div className="z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-2xl bg-red-950/30 border border-red-900/50 mb-3 shadow-[0_0_20px_rgba(185,28,28,0.3)]">
            <SpinningD20 size={68} />
          </div>
          <h1 className="text-3xl font-black text-zinc-100 tracking-tighter mb-1 uppercase">Black Wolfes</h1>
          <h1 className="text-4xl font-black text-red-700 tracking-tighter mb-2 uppercase">RPG</h1>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.25em]">Versão {APP_VERSION} • Oficial</p>
          <p className="text-zinc-600 font-bold uppercase tracking-[0.3em] text-xs mt-2">Acesso Restrito</p>
        </div>
        <GlowingCard className="p-8 border-red-900/60">
          {error && <div className="bg-red-950/80 border border-red-700 text-red-300 p-3 rounded mb-6 text-sm text-center font-medium shadow-inner">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">user</label>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-red-600 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Palavra-passe</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-red-600 outline-none transition-all" />
            </div>
            <Button type="submit" className="w-full py-4 text-lg">Entrar no RPG</Button>
          </form>
        </GlowingCard>
      </div>
    </div>
  );
};

const AMMO_CATALOG = [
  ['pistol','Caixa de Munição de Pistola',20,50],['revolver','Caixa de Munição de Revólver',18,60],['50','Caixa de Munição .50',12,100],['shotgun','Caixa de Cartuchos de Espingarda',12,90],['smg','Caixa de Munição de SMG',30,100],['assault','Caixa de Munição de Rifle de Assalto',30,130],['precision','Caixa de Munição de Rifle de Precisão',10,150],['arrows','Caixa de Flechas',10,40],['bolts','Caixa de Virotes',10,50],['magnum','Caixa de Munição Magnum',12,120],['combat-shotgun','Caixa de Cartuchos de Shotgun de Combate',12,120],['military-rifle','Caixa de Munição de Rifle Militar',30,170],['military-precision','Caixa de Munição de Precisão Militar',10,220],['double-shotgun','Caixa de Cartuchos de Espingarda Cano Duplo',12,100]
].map(([key,name,pack,price])=>({key,name,pack,price}));
const getAmmoDefinition = (key) => AMMO_CATALOG.find(a => a.key === key);
const getAmmoName = (key) => getAmmoDefinition(key)?.name?.replace(/^Caixa de /i, '') || (key ? String(key) : 'Tipo de munição não definido');

const AdminDashboard = ({ currentUser, players, campaigns, stores, categories, items, onCreatePlayer, onCreateCampaign, onDeleteCampaign, onCreateStore, onCreateCategory, onCreateItem, onUpdateItem, onDeleteItem, onDeleteStore, onDeleteCategory, onDeletePlayer, onUpdatePlayerPassword, onUpdateUserCampaigns, onUpdateUserPermissions, onUpdateCampaignClasses, onLogout, onBackToGame }) => {
  const [activeTab, setActiveTab] = useState('campaigns');
  const can = (key) => currentUser.canResetPassword || !currentUser.permissions || currentUser.permissions[key] !== false;
  useEffect(() => { const needed = (activeTab === 'players') ? 'manageUsers' : ((activeTab === 'stores' || activeTab === 'catalog') ? 'manageStores' : 'manageCampaigns'); if (!can(needed)) { setActiveTab(can('manageCampaigns') ? 'campaigns' : can('manageUsers') ? 'players' : 'stores'); } }, [activeTab]);
  
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('player');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [newCanResetPassword, setNewCanResetPassword] = useState(false);
  const [newPermissions, setNewPermissions] = useState({ manageUsers:true, manageCampaigns:true, manageStores:true, manageSessions:true, manageCharacters:true, manageMoney:true });
  const [assignedCamps, setAssignedCamps] = useState([]);
  
  const [resettingUser, setResettingUser] = useState(null);
  const [newResetPassword, setNewResetPassword] = useState('');

  const [managingCampsUser, setManagingCampsUser] = useState(null);
  const [userAssignedCamps, setUserAssignedCamps] = useState([]);

  const [managingClassesCamp, setManagingClassesCamp] = useState(null);
  const [newClassInput, setNewClassInput] = useState('');

  const [storeName, setStoreName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryIsDamage, setCategoryIsDamage] = useState(false);
  
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDamage, setItemDamage] = useState('');
  const [itemExtremeDamage, setItemExtremeDamage] = useState('');
  const [itemBuff, setItemBuff] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemType, setItemType] = useState('item');
  const [itemAmmoType, setItemAmmoType] = useState('');
  const [itemAmmoPerBox, setItemAmmoPerBox] = useState('');
  const [itemMagazineSize, setItemMagazineSize] = useState('');
  const [itemUsable, setItemUsable] = useState(true);
  const [itemEffectType, setItemEffectType] = useState('cura');
  const [itemEffectDice, setItemEffectDice] = useState('');
  const [itemEffectTarget, setItemEffectTarget] = useState('');
  const [itemEffectValue, setItemEffectValue] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemStackable, setItemStackable] = useState(true);

  const [msg, setMsg] = useState({ text: '', type: '' });

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const handleToggleCamp = (id) => {
    setAssignedCamps(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleToggleUserCamp = (id) => {
    setUserAssignedCamps(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (activeTab === 'players') {
      if (!newPassword.trim()) return;
      if (players.find(p => p.username.toLowerCase() === newName.toLowerCase())) return showMsg('Este utilizador já existe.', 'error');
      try {
        await onCreatePlayer(newName, newPassword, newRole, assignedCamps, newIsAdmin, newCanResetPassword, newPermissions);
        showMsg(`Utilizador "${newName}" registado com sucesso!`, 'success');
        setNewName(''); setNewPassword(''); setAssignedCamps([]); setNewRole('player'); setNewIsAdmin(false); setNewCanResetPassword(false); setNewPermissions({manageUsers:true,manageCampaigns:true,manageStores:true,manageSessions:true,manageCharacters:true,manageMoney:true});
      } catch (err) { showMsg('Erro ao criar utilizador.', 'error'); }
    } else if (activeTab === 'campaigns') {
      if (campaigns.find(c => c.name.toLowerCase() === newName.toLowerCase())) return showMsg('Esta campanha já existe.', 'error');
      try {
        await onCreateCampaign(newName, ['Mundano']);
        showMsg(`Campanha "${newName}" iniciada com sucesso!`, 'success');
        setNewName('');
      } catch (err) { showMsg('Erro ao criar campanha.', 'error'); }
    }
  };

  const handleAddClassToCamp = (e) => {
    e.preventDefault();
    if (!managingClassesCamp || !newClassInput.trim()) return;
    const currentClasses = managingClassesCamp.classes || ['Mundano'];
    if (currentClasses.includes(newClassInput.trim())) return;
    const updated = [...currentClasses, newClassInput.trim()];
    onUpdateCampaignClasses(managingClassesCamp.id, updated);
    setManagingClassesCamp({ ...managingClassesCamp, classes: updated });
    setNewClassInput('');
  };

  const handleRemoveClassFromCamp = (className) => {
    if (!managingClassesCamp) return;
    const currentClasses = managingClassesCamp.classes || [];
    const updated = currentClasses.filter(c => c !== className);
    onUpdateCampaignClasses(managingClassesCamp.id, updated);
    setManagingClassesCamp({ ...managingClassesCamp, classes: updated });
  };

  const handleCreateStoreSubmit = async (e) => {
    e.preventDefault();
    if (!storeName.trim()) return;
    try {
      await onCreateStore({ name: storeName });
      showMsg(`Loja "${storeName}" criada!`, 'success');
      setStoreName('');
    } catch (err) { showMsg('Erro ao criar loja.', 'error'); }
  };

  const handleCreateCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    try {
      await onCreateCategory({ name: categoryName, storeId: '', isDamage: categoryIsDamage });
      showMsg(`Categoria "${categoryName}" criada!`, 'success');
      setCategoryName('');
      setCategoryIsDamage(false);
    } catch (err) { showMsg('Erro ao criar categoria.', 'error'); }
  };

  const resetItemForm = () => {
    setEditingItemId(null); setItemName(''); setSelectedStoreId(''); setSelectedCatId(''); setItemDamage(''); setItemExtremeDamage(''); setItemBuff(''); setItemDesc(''); setItemImageUrl(''); setItemPrice(''); setItemType('item'); setItemAmmoType(''); setItemAmmoPerBox(''); setItemMagazineSize(''); setItemUsable(true); setItemEffectType('cura'); setItemEffectDice(''); setItemEffectTarget(''); setItemEffectValue(''); setItemStackable(true);
  };

  const startEditItem = (it) => {
    setEditingItemId(it.id); setItemName(it.name || ''); setSelectedStoreId(it.storeId || ''); setSelectedCatId(it.categoryId || ''); setItemDamage(it.damage || ''); setItemExtremeDamage(it.extremeDamage || ''); setItemBuff(it.buff || ''); setItemDesc(it.description || ''); setItemImageUrl(it.imageUrl || ''); setItemPrice(it.price ?? ''); setItemType(it.itemType || 'item'); setItemAmmoType(it.ammoType || ''); setItemAmmoPerBox(it.itemType === 'backpack' ? (it.backpackSlots ?? '') : (it.ammoPerBox ?? '')); setItemMagazineSize(it.magazineSize ?? ''); setItemUsable(it.usable !== false); setItemEffectType(it.effectType || 'cura'); setItemEffectDice(it.effectDice || ''); setItemEffectTarget(it.effectTarget || ''); setItemEffectValue(it.effectValue ?? ''); setItemStackable(it.stackable !== false); window.scrollTo({top:0,behavior:'smooth'});
  };

  const handleCreateItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !selectedCatId) return showMsg('Seleciona uma categoria.', 'error');
    if (itemType === 'ammo_box' && (!itemAmmoType || Number(itemAmmoPerBox) < 1)) return showMsg('Indica o tipo e quantas munições a caixa contém.', 'error');
    if (itemType === 'weapon' && (!itemAmmoType || Number(itemMagazineSize) < 1)) return showMsg('Indica o tipo de munição compatível e a capacidade do carregador.', 'error');
    if (itemType === 'backpack' && Number(itemAmmoPerBox) < 1) return showMsg('Indica quantos slots a mochila dá.', 'error');
    if (itemType === 'phone') { setItemUsable(false); }
    if (itemType === 'item' && itemEffectType === 'buff') setItemUsable(true);
    const effectiveUsable = itemType === 'item' && itemEffectType === 'buff' ? true : itemUsable;
    if (itemType === 'item' && effectiveUsable && itemEffectType === 'buff' && (!itemEffectTarget || itemEffectValue === '' || Number(itemEffectValue) === 0)) return showMsg('Indica o alvo e o valor do buff.', 'error');
    try {
      const targetCat = categories.find(c => c.id === selectedCatId);
      const payload = {
        name: itemName.trim(), storeId: '', categoryId: selectedCatId, damage: targetCat?.isDamage ? itemDamage : '', extremeDamage: targetCat?.isDamage ? itemExtremeDamage : '',
        buff: itemType === 'ammo_box' || itemType === 'backpack' || itemType === 'phone' ? '' : itemBuff, description: itemDesc, imageUrl: itemImageUrl, price: Math.max(0, Number(itemPrice) || 0), itemType,
        ammoType: (itemType === 'ammo_box' || itemType === 'weapon') ? itemAmmoType : '', ammoPerBox: itemType === 'ammo_box' ? Math.max(1, Number(itemAmmoPerBox) || 0) : 0, isAmmoBox: itemType === 'ammo_box', magazineSize: itemType === 'weapon' ? Math.max(0, Number(itemMagazineSize) || 0) : 0,
        backpackSlots: itemType === 'backpack' ? Math.max(1, Number(itemAmmoPerBox) || 0) : 0, backpackOpen: false, usable: itemType === 'backpack' ? true : (itemType === 'item' ? effectiveUsable : false),
        stackable: itemType === 'weapon' || itemType === 'backpack' || itemType === 'phone' ? false : itemStackable, effectType: itemType === 'item' && effectiveUsable ? itemEffectType : '', effectDice: itemType === 'item' && effectiveUsable && itemEffectType !== 'buff' ? itemEffectDice.trim() : '',
        effectTarget: itemType === 'item' && effectiveUsable && itemEffectType === 'buff' ? itemEffectTarget : '', effectValue: itemType === 'item' && effectiveUsable && itemEffectType === 'buff' ? Number(itemEffectValue) || 0 : 0, quantity: 1
      };
      if (editingItemId) await onUpdateItem(editingItemId, payload); else await onCreateItem(payload);
      showMsg(`Item "${itemName}" ${editingItemId ? 'atualizado' : 'criado'} com sucesso!`, 'success'); resetItemForm();
    } catch (err) { showMsg('Erro ao guardar item.', 'error'); }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser.canResetPassword && currentUser.role !== 'admin') return showMsg('Não tens permissão para redefinir senhas.', 'error');
    if (!resettingUser || !newResetPassword.trim()) return;
    try {
      await onUpdatePlayerPassword(resettingUser.id, newResetPassword);
      showMsg(`Senha de "${resettingUser.username}" redefinida com sucesso!`, 'success');
      setResettingUser(null);
      setNewResetPassword('');
    } catch (err) { showMsg('Erro ao redefinir palavra-passe.', 'error'); }
  };

  const handleUserCampaignsSubmit = async (e) => {
    e.preventDefault();
    if (!managingCampsUser) return;
    try {
      await onUpdateUserCampaigns(managingCampsUser.id, userAssignedCamps);
      showMsg(`Campanhas de "${managingCampsUser.username}" atualizadas com sucesso!`, 'success');
      setManagingCampsUser(null);
    } catch (err) { showMsg('Erro ao atualizar campanhas do utilizador.', 'error'); }
  };

  // A criação de itens não depende da loja selecionada. Todas as categorias existentes devem estar disponíveis.
  const currentStoreCategories = categories;
  const selectedCatObj = categories.find(c => c.id === selectedCatId);

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans p-4 sm:p-8 w-full">
      <header className="max-w-6xl mx-auto flex items-center justify-between pb-6 mb-8 border-b border-red-950">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <SpinningD20 size={36} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-widest">Painel de Controlo</h1>
            <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">
              {currentUser.canResetPassword ? 'Admin Full' : currentUser.isAdmin ? 'Admin Limitado' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {onBackToGame && <Button variant="secondary" onClick={onBackToGame}>Voltar</Button>}
          <Button variant="ghost" onClick={onLogout} icon={LogOut}>Sair</Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-900 pb-2">
          {can('manageCampaigns') && <button onClick={() => setActiveTab('campaigns')} className={`px-4 py-2 uppercase font-bold tracking-widest text-xs rounded transition-colors ${activeTab === 'campaigns' ? 'bg-red-950 text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Map size={16} className="inline mr-2 -mt-1"/> Campanhas
          </button>}
          {can('manageUsers') && <button onClick={() => setActiveTab('players')} className={`px-4 py-2 uppercase font-bold tracking-widest text-xs rounded transition-colors ${activeTab === 'players' ? 'bg-red-950 text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Users size={16} className="inline mr-2 -mt-1"/> Utilizadores
          </button>}
          {can('manageStores') && <button onClick={() => setActiveTab('catalog')} className={`px-4 py-2 uppercase font-bold tracking-widest text-xs rounded transition-colors ${activeTab === 'catalog' ? 'bg-red-950 text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Package size={16} className="inline mr-2 -mt-1"/> Itens & Categorias
          </button>}
          {can('manageStores') && <button onClick={() => setActiveTab('stores')} className={`px-4 py-2 uppercase font-bold tracking-widest text-xs rounded transition-colors ${activeTab === 'stores' ? 'bg-red-950 text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}><ShoppingBag size={16} className="inline mr-2 -mt-1"/> Lojas</button>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <GlowingCard className="p-6">
              <h2 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Plus size={20} /> 
                {activeTab === 'campaigns' ? 'Nova Campanha' : activeTab === 'players' ? 'Novo Utilizador' : activeTab === 'catalog' ? 'Itens & Categorias' : 'Lojas'}
              </h2>
              {msg.text && <div className={`p-3 rounded mb-4 text-sm font-medium border ${msg.type === 'success' ? 'bg-green-950/30 border-green-900 text-green-400' : 'bg-red-950/30 border-red-900 text-red-400'}`}>{msg.text}</div>}
              
              {activeTab === 'catalog' ? (
                <div className="space-y-6">
                  <form onSubmit={handleCreateCategorySubmit} className="space-y-3 pb-4 border-b border-zinc-800">
                    <label className="block text-xs font-bold uppercase tracking-widest text-red-400">2. Criar Categoria</label><button type="button" onClick={async()=>{if(categories.some(c=>c.name.toLowerCase()==='mochila')) return showMsg('A categoria Mochila já existe.','error'); await onCreateCategory({name:'Mochila',storeId:'',isDamage:false}); showMsg('Categoria Mochila criada.','success');}} className="w-full text-left px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:border-red-800">+ Criar categoria padrão: Mochila</button>
                    
                    <input type="text" required placeholder="Nome da Categoria (ex: Armas de Fogo)" value={categoryName} onChange={e => setCategoryName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600 text-sm" />
                    
                    <div className="flex items-center gap-3 bg-zinc-900 p-3 rounded border border-zinc-800 cursor-pointer" onClick={() => setCategoryIsDamage(!categoryIsDamage)}>
                      <div className={`w-4 h-4 border rounded flex items-center justify-center ${categoryIsDamage ? 'bg-red-600 border-red-500 text-black' : 'border-zinc-700'}`}>
                        {categoryIsDamage && <CheckSquare size={12} />}
                      </div>
                      <span className="text-xs font-bold uppercase text-zinc-300">Categoria de Dano?</span>
                    </div>
                    <Button type="submit" className="w-full">Criar Categoria</Button>
                  </form>

                  <form onSubmit={handleCreateItemSubmit} className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-widest text-red-400">3. {editingItemId ? 'Editar Item' : 'Adicionar Item'}</label>
                    
                    <select value={selectedCatId} onChange={e => setSelectedCatId(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600 text-sm">
                      <option value="">Selecionar Categoria...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name} {c.isDamage ? '(Dano)' : '(Buff/Outro)'}</option>)}
                    </select>
                    <select value={itemType} onChange={e=>{setItemType(e.target.value); if(e.target.value==='ammo_box' || e.target.value==='backpack' || e.target.value==='phone') setItemBuff(''); if(e.target.value==='phone') setItemUsable(false);}} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 text-sm"><option value="item">Tipo: Item</option><option value="weapon">Tipo: Arma</option><option value="ammo_box">Tipo: Caixa de munições</option><option value="backpack">Tipo: Mochila</option><option value="phone">Tipo: Telemóvel</option></select>
                    {itemType==='backpack' && <input required type="number" min="1" placeholder="Quantos slots dá esta mochila?" value={itemAmmoPerBox} onChange={e=>setItemAmmoPerBox(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 text-sm"/>}
                    <input type="text" required placeholder="Nome do Item" value={itemName} onChange={e => setItemName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600 text-sm" />
                    
                    {selectedCatObj?.isDamage ? (
                      <>
                        <input type="text" placeholder="Dano Normal (ex: 2d8+3)" value={itemDamage} onChange={e => setItemDamage(e.target.value)} required
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600 text-sm font-mono" />
                        <input type="text" placeholder="Dano Extremo (ex: 4d8+6)" value={itemExtremeDamage} onChange={e => setItemExtremeDamage(e.target.value)} required
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600 text-sm font-mono" />
                      </>
                    ) : itemType !== 'ammo_box' && itemType !== 'backpack' ? (
                      <input type="text" placeholder="Buff (ex: +2 Defesa, +5 Vida)" value={itemBuff} onChange={e => setItemBuff(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600 text-sm font-mono" />
                    ) : null}

                    {itemType==='item' && <div className="space-y-2 rounded-lg border border-amber-900/50 bg-amber-950/10 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Efeito real do item</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select value={itemEffectType} onChange={e=>{setItemEffectType(e.target.value); if(e.target.value==='buff') setItemUsable(true);}} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 text-sm">
                          <option value="cura">Efeito: Cura</option><option value="dano">Efeito: Dano</option><option value="sanidade">Efeito: Sanidade</option><option value="buff">Efeito: Buff real</option>
                        </select>
                        {itemEffectType !== 'buff' ? <input type="text" placeholder="Dado (ex: 1d6, 2d4+2)" value={itemEffectDice} onChange={e=>setItemEffectDice(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 text-sm font-mono" /> : <select value={itemEffectTarget} onChange={e=>setItemEffectTarget(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 text-sm">
                          <option value="">Alvo do buff...</option><option value="defense">Defesa</option>{Object.keys(skillDefinitions).map(sk=><option key={sk} value={`skill:${sk}`}>{sk}</option>)}
                        </select>}
                      </div>
                      {itemEffectType === 'buff' && <input type="number" placeholder="Valor do buff (ex: +2 ou -1)" value={itemEffectValue} onChange={e=>setItemEffectValue(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 text-sm font-mono" />}
                      {itemEffectType === 'buff' && <p className="text-[10px] text-amber-300/70">Ao usar o item, este valor fica ativo na perícia ou Defesa escolhida.</p>}
                    </div>}

                    <input type="url" placeholder="URL da Imagem do Item (opcional)" value={itemImageUrl} onChange={e => setItemImageUrl(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600 text-sm" />

                    <input type="number" min="0" placeholder="Preço base (CR)" value={itemPrice} onChange={e => setItemPrice(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600 text-sm" />
                    
                    {itemType==='weapon' && <><input type="number" min="1" placeholder="Capacidade do carregador" value={itemMagazineSize} onChange={e=>setItemMagazineSize(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 text-sm"/><select value={itemAmmoType} onChange={e=>setItemAmmoType(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 text-sm"><option value="">Tipo de munição compatível...</option>{AMMO_CATALOG.map(a=><option key={a.key} value={a.key}>{a.name.replace(/^Caixa de /i,'')}</option>)}</select></>}
                    {itemType==='ammo_box' && <><select required value={itemAmmoType} onChange={e=>setItemAmmoType(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 text-sm"><option value="">Tipo de munição...</option>{AMMO_CATALOG.map(a=><option key={a.key} value={a.key}>{a.name.replace(/^Caixa de /i,'')}</option>)}</select><input required type="number" min="1" placeholder="Quantas munições contém esta caixa?" value={itemAmmoPerBox} onChange={e=>setItemAmmoPerBox(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 text-sm"/><p className="text-[10px] text-zinc-500">A quantidade é definida pelo Mestre ao criar a caixa.</p></>}
                    <div className="flex flex-wrap gap-4 items-center bg-zinc-900/70 border border-zinc-800 rounded p-3">
                      <label className={`flex items-center gap-2 text-xs ${itemType==='phone' ? 'text-zinc-600' : 'text-zinc-300'}`}><input type="checkbox" checked={itemUsable} disabled={itemType==='phone'} onChange={e=>setItemUsable(e.target.checked)}/> Pode ser usado</label>
                      <label className={`flex items-center gap-2 text-xs ${itemType==='weapon'||itemType==='backpack' ? 'text-zinc-600' : 'text-zinc-300'}`}><input type="checkbox" checked={itemType==='weapon'||itemType==='backpack' ? false : itemStackable} disabled={itemType==='weapon'||itemType==='backpack'} onChange={e=>setItemStackable(e.target.checked)}/> Pode acumular quantidade (Stack)</label>
                    </div>

                    <textarea placeholder="Descrição" value={itemDesc} onChange={e => setItemDesc(e.target.value)} rows={2}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600 resize-none text-sm" />
                    <Button type="submit" className="w-full">Registar Item</Button>
                  </form>
                </div>
              ) : activeTab === 'stores' ? null : (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">
                      {activeTab === 'campaigns' ? 'Nome da Campanha' : 'Nome de Utilizador'}
                    </label>
                    <input type="text" required value={newName} onChange={e => setNewName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600" />
                  </div>
                  
                  {activeTab === 'players' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Palavra-passe</label>
                        <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Permissão / Função</label>
                        <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600">
                          <option value="player">Jogador (Player)</option>
                          <option value="gm">Mestre (Game Master)</option>
                        </select>
                      </div>

                      <div className="space-y-2 bg-zinc-900 p-3 rounded border border-zinc-800">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setNewIsAdmin(!newIsAdmin)}>
                          <div className={`w-4 h-4 border rounded flex items-center justify-center ${newIsAdmin ? 'bg-red-600 border-red-500 text-black' : 'border-zinc-700'}`}>
                            {newIsAdmin && <CheckSquare size={12} />}
                          </div>
                          <span className="text-xs font-bold uppercase text-zinc-300">É Administrador?</span>
                        </div>
                        {newIsAdmin && (
                          <div className="flex items-center gap-3 cursor-pointer pl-4 pt-2 border-t border-zinc-800" onClick={() => setNewCanResetPassword(!newCanResetPassword)}>
                            <div className={`w-4 h-4 border rounded flex items-center justify-center ${newCanResetPassword ? 'bg-red-600 border-red-500 text-black' : 'border-zinc-700'}`}>
                              {newCanResetPassword && <CheckSquare size={12} />}
                            </div>
                            <span className="text-xs font-bold uppercase text-zinc-400">Pode Redefinir Senhas? (Full Admin)</span>
                          </div>
                        )}
                        {newIsAdmin && <div className="pt-3 border-t border-zinc-800 mt-2 space-y-2"><p className="text-[10px] uppercase font-bold text-zinc-500">Permissões do Administrador</p>{Object.entries({manageUsers:'Gerir utilizadores',manageCampaigns:'Gerir campanhas',manageStores:'Gerir lojas e itens',manageSessions:'Gerir sessões',manageCharacters:'Gerir personagens',manageMoney:'Gerir dinheiro'}).map(([key,label])=><label key={key} className="flex items-center gap-2 text-xs text-zinc-300"><input type="checkbox" checked={!!newPermissions[key]} onChange={e=>setNewPermissions(p=>({...p,[key]:e.target.checked}))}/>{label}</label>)}</div>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 mt-4">Campanhas Atribuídas</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar border border-zinc-800 p-2 rounded bg-zinc-900/50">
                          {campaigns.length === 0 ? <p className="text-xs text-zinc-600">Nenhuma campanha criada.</p> : 
                            campaigns.map(c => (
                              <div key={c.id} onClick={() => handleToggleCamp(c.id)} className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${assignedCamps.includes(c.id) ? 'bg-red-600 border-red-500 text-black' : 'border-zinc-700 group-hover:border-red-900'}`}>
                                  {assignedCamps.includes(c.id) && <CheckSquare size={12} />}
                                </div>
                                <span className={`text-sm ${assignedCamps.includes(c.id) ? 'text-zinc-200 font-bold' : 'text-zinc-500'}`}>{c.name}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}
                  <Button type="submit" className="w-full mt-4">Registar</Button>
                </form>
              )}
            </GlowingCard>
          </div>

          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-zinc-400 flex items-center gap-2 uppercase tracking-wide">
              {activeTab === 'campaigns' ? <Folder size={20} /> : activeTab === 'players' ? <Users size={20} /> : <ShoppingBag size={20} />} 
              {activeTab === 'campaigns' ? 'Campanhas Criadas no Sistema' : activeTab === 'players' ? 'Base de Dados de Utilizadores' : 'Lojas, Categorias e Catálogo de Itens'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeTab === 'campaigns' && campaigns.map(c => (
                <GlowingCard key={c.id} className="p-5 flex flex-col justify-between h-40">
                  <div>
                    <p className="font-black text-zinc-100 text-lg uppercase mb-1">{c.name}</p>
                    <p className="text-xs text-zinc-500">Classes: {(c.classes || ['Mundano']).join(', ')}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="secondary" onClick={() => setManagingClassesCamp(c)} className="text-xs py-1 flex-1">Gerir Classes</Button>
                    <button onClick={() => {
                      if (window.confirm(`Eliminar a campanha "${c.name}"? Esta ação também elimina fichas, rolagens, NPCs, iniciativas e negociações dessa campanha.`)) onDeleteCampaign(c.id);
                    }} className="px-3 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-900/60" title="Eliminar campanha">
                      <Trash2 size={15}/>
                    </button>
                  </div>
                </GlowingCard>
              ))}
              
              {activeTab === 'catalog' && (
                <div className="sm:col-span-2 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlowingCard className="p-5"><h3 className="font-bold text-red-400 uppercase mb-3">Categorias criadas</h3>{categories.length===0?<p className="text-xs text-zinc-600">Nenhuma categoria.</p>:categories.map(c=><div key={c.id} className="flex justify-between items-center bg-zinc-900 p-2 rounded mb-1 text-xs"><span>{c.name}</span><button onClick={()=>onDeleteCategory(c.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={14}/></button></div>)}</GlowingCard>
                    <GlowingCard className="p-5"><h3 className="font-bold text-red-400 uppercase mb-3">Itens criados</h3>{items.length===0?<p className="text-xs text-zinc-600">Nenhum item.</p>:items.map(it=><div key={it.id} className="flex justify-between items-center gap-2 bg-zinc-900 p-2 rounded mb-1 text-xs"><span className="flex-1 truncate">{it.name} <span className="text-zinc-600">({it.itemType||'item'})</span></span><div className="flex gap-2"><button onClick={()=>startEditItem(it)} className="text-blue-400 hover:text-blue-300">Editar</button><button onClick={()=>onDeleteItem(it.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={14}/></button></div></div>)}</GlowingCard>
                  </div>
                </div>
              )}

              {activeTab === 'stores' && (
                <div className="sm:col-span-2 space-y-6">
                  <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl">
                    <h3 className="text-lg font-black text-red-500 uppercase mb-3">Criar loja</h3>
                    <form onSubmit={handleCreateStoreSubmit} className="flex gap-2"><input required value={storeName} onChange={e=>setStoreName(e.target.value)} placeholder="Nome da loja" className="flex-1 bg-black border border-zinc-800 rounded p-2 text-sm text-white"/><Button type="submit">Criar</Button></form>
                  </div>
                  <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl">
                    <h3 className="text-lg font-black text-red-500 uppercase mb-3">Adicionar itens e categorias às lojas</h3>
                    <select value={selectedStoreId} onChange={e=>setSelectedStoreId(e.target.value)} className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-white mb-3"><option value="">Selecionar loja...</option>{stores.map(st=><option key={st.id} value={st.id}>{st.name}</option>)}</select>
                    {selectedStoreId && <div className="space-y-5">
                      <div><p className="text-xs font-bold uppercase text-zinc-400 mb-2">Categorias</p>{categories.map(c=><label key={c.id} className="flex items-center gap-2 p-2 bg-black rounded border border-zinc-800 text-xs mb-1"><input type="checkbox" checked={c.storeId===selectedStoreId} onChange={async e=>{await uDoc('categories',c.id,{storeId:e.target.checked?selectedStoreId:''});}}/><span>{c.name}</span></label>)}</div>
                      <div><p className="text-xs font-bold uppercase text-zinc-400 mb-2">Itens</p>{items.map(it=><label key={it.id} className="flex items-center gap-2 p-2 bg-black rounded border border-zinc-800 text-xs mb-1"><input type="checkbox" checked={it.storeId===selectedStoreId} onChange={async e=>{await uDoc('items',it.id,{storeId:e.target.checked?selectedStoreId:''});}}/><span>{it.name}</span></label>)}</div>
                    </div>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{stores.map(store=><div key={store.id} className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl"><div className="flex justify-between"><h4 className="font-bold text-zinc-100">{store.name}</h4><button onClick={()=>onDeleteStore(store.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={15}/></button></div><p className="text-[10px] text-zinc-500 mt-2">{categories.filter(c=>c.storeId===store.id).length} categorias • {items.filter(i=>i.storeId===store.id).length} itens</p></div>)}</div>
                </div>
              )}

              {activeTab === 'players' && players.map(p => (
                <div key={p.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg relative overflow-hidden flex flex-col justify-between">
                  <div className={`absolute top-0 left-0 w-1 h-full ${p.role === 'gm' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-zinc-200 text-lg">{p.username}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded inline-block ${p.role === 'gm' ? 'bg-red-950 text-red-400' : 'bg-blue-950 text-blue-400'}`}>
                            {p.role === 'gm' ? 'Mestre (GM)' : 'Jogador'}
                          </span>
                          {p.isAdmin && (
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded inline-block bg-purple-950 text-purple-300">
                              Admin {p.canResetPassword ? '(Full)' : '(Limitado)'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1">
                          {(currentUser.canResetPassword || currentUser.role === 'admin') && (
                            <button 
                              onClick={() => { setResettingUser(p); setNewResetPassword(''); }} 
                              className="flex items-center gap-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded transition-colors"
                              title="Redefinir Palavra-passe">
                              <Key size={14}/> Senha
                            </button>
                          )}
                          <button 
                            onClick={() => onDeletePlayer(p.id)} 
                            className="flex items-center gap-1 text-xs bg-red-950 hover:bg-red-900 text-red-300 px-2 py-1 rounded transition-colors border border-red-900/50"
                            title="Excluir Utilizador">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                        <button 
                          onClick={() => { setManagingCampsUser(p); setUserAssignedCamps(p.assignedCampaigns || []); }} 
                          className="flex items-center justify-center gap-1 text-xs bg-red-950/60 hover:bg-red-900 text-red-300 px-3 py-1 rounded transition-colors border border-red-900/50 w-full mt-1"
                          title="Definir Campanhas">
                          <Settings size={14}/> Campanhas
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 mt-2">
                      <strong>Campanhas:</strong> {p.assignedCampaigns?.length > 0 ? 
                        campaigns.filter(c => p.assignedCampaigns.includes(c.id)).map(c => c.name).join(', ') : 
                        'Nenhuma'
                      }
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800"><Button variant="secondary" className="text-[10px] py-1" onClick={()=>onDeletePlayer(p.id)}>Remover da interface</Button></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {resettingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <GlowingCard className="p-6 max-w-md w-full bg-zinc-950">
            <h3 className="text-lg font-bold text-red-500 mb-2 uppercase tracking-wide">Redefinir Palavra-passe</h3>
            <p className="text-xs text-zinc-400 mb-4">Nova palavra-passe para o utilizador: <strong className="text-zinc-200">{resettingUser.username}</strong></p>
            
            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Nova Palavra-passe</label>
                <input type="password" required value={newResetPassword} onChange={e => setNewResetPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600" />
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <Button variant="secondary" onClick={() => setResettingUser(null)}>Cancelar</Button>
                <Button type="submit">Confirmar Redefinição</Button>
              </div>
            </form>
          </GlowingCard>
        </div>
      )}

      {managingCampsUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <GlowingCard className="p-6 max-w-md w-full bg-zinc-950">
            <h3 className="text-lg font-bold text-red-500 mb-2 uppercase tracking-wide">Definir Campanhas Atribuídas</h3>
            <p className="text-xs text-zinc-400 mb-4">Atribuir campanhas ao utilizador: <strong className="text-zinc-200">{managingCampsUser.username}</strong></p>
            
            <form onSubmit={handleUserCampaignsSubmit} className="space-y-4">
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar border border-zinc-800 p-3 rounded bg-zinc-900/50">
                {campaigns.length === 0 ? <p className="text-xs text-zinc-600">Nenhuma campanha criada.</p> : 
                  campaigns.map(c => (
                    <div key={c.id} onClick={() => handleToggleUserCamp(c.id)} className="flex items-center gap-2 cursor-pointer group py-1">
                      <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${userAssignedCamps.includes(c.id) ? 'bg-red-600 border-red-500 text-black' : 'border-zinc-700 group-hover:border-red-900'}`}>
                        {userAssignedCamps.includes(c.id) && <CheckSquare size={12} />}
                      </div>
                      <span className={`text-sm ${userAssignedCamps.includes(c.id) ? 'text-zinc-200 font-bold' : 'text-zinc-500'}`}>{c.name}</span>
                    </div>
                  ))}
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <Button variant="secondary" onClick={() => setManagingCampsUser(null)}>Cancelar</Button>
                <Button type="submit">Guardar Campanhas</Button>
              </div>
            </form>
          </GlowingCard>
        </div>
      )}

      {managingClassesCamp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <GlowingCard className="p-6 max-w-md w-full bg-zinc-950">
            <h3 className="text-lg font-bold text-red-500 mb-2 uppercase tracking-wide">Classes da Campanha</h3>
            <p className="text-xs text-zinc-400 mb-4">Campanha: <strong className="text-zinc-200">{managingClassesCamp.name}</strong></p>
            
            <div className="space-y-3 mb-4">
              <div className="flex flex-wrap gap-2">
                {(managingClassesCamp.classes || ['Mundano']).map(cls => (
                  <div key={cls} className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs flex items-center gap-2 text-zinc-200">
                    <span>{cls}</span>
                    <button type="button" onClick={() => handleRemoveClassFromCamp(cls)} className="text-zinc-500 hover:text-red-500"><X size={14}/></button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddClassToCamp} className="flex gap-2 mt-4">
                <input type="text" placeholder="Nova Classe..." value={newClassInput} onChange={e => setNewClassInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-100 outline-none focus:border-red-600" />
                <Button type="submit">Adicionar</Button>
              </form>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button variant="secondary" onClick={() => setManagingClassesCamp(null)}>Fechar</Button>
            </div>
          </GlowingCard>
        </div>
      )}
    </div>
  );
};

const CampaignSelection = ({ player, campaigns, onSelectCampaign, onLogout, onOpenAdmin }) => {
  const allowedCampaigns = campaigns.filter(c => player.role === 'gm' || player.username.toLowerCase() === 'mitzz' || player.assignedCampaigns?.includes(c.id));

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans p-4 sm:p-8 relative w-full">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-red-950/10 via-black to-black pointer-events-none"></div>
      <header className="max-w-5xl mx-auto flex items-center justify-between pb-6 mb-12 border-b border-red-950 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <SpinningD20 size={36} />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-100 uppercase tracking-widest">Black Wolfes RPG</h1>
            <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">
              {player.role === 'gm' ? 'Mestre: ' : 'Jogador: '} {player.username}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {player.isAdmin && <Button variant="secondary" onClick={onOpenAdmin}>Painel Admin</Button>}
          <Button variant="ghost" onClick={onLogout} icon={LogOut}>Sair</Button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto relative z-10 text-center">
        <h2 className="text-3xl font-black text-zinc-100 tracking-tighter mb-2 uppercase">Selecionar Campanha</h2>
        <p className="text-zinc-500 mb-12 text-sm uppercase tracking-widest">Aceda à sua área de jogo ativa</p>
        
        {allowedCampaigns.length === 0 ? (
          <div className="bg-zinc-900 p-8 rounded-xl max-w-md mx-auto border border-zinc-800"><p className="text-zinc-400">Nenhuma campanha atribuída à sua conta.</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allowedCampaigns.map(camp => (
              <GlowingCard key={camp.id} onClick={() => onSelectCampaign(camp.id)} className="p-6 text-left flex flex-col justify-between h-40">
                <div>
                  <Folder size={24} className="text-red-700 mb-3" />
                  <h3 className="text-xl font-black text-zinc-100 uppercase tracking-wide truncate">{camp.name}</h3>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {player.role === 'gm' ? 'Abrir Painel do Mestre' : 'Entrar na Campanha'}
                  </span>
                  <ChevronRight size={16} className="text-zinc-600" />
                </div>
              </GlowingCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const GMPhoneModal = ({ campaign, npcs, characters, onBack, onGMSendMessage }) => {
  const [selectedNpc, setSelectedNpc] = useState(null);
  const [selectedPlayerPhone, setSelectedPlayerPhone] = useState(null); 
  const [chatInput, setChatInput] = useState('');
  const [chatType, setChatType] = useState('text');
  const [chatMediaUrl, setChatMediaUrl] = useState('');

  const campNpcs = (npcs || []).filter(n => n.campaignId === campaign.id && n.type === 'npc');

  const getPlayerThreads = (npcPhone) => {
    let threads = {};
    characters.forEach(ch => {
      const msgs = ch.messages?.[npcPhone] || [];
      if (ch.phoneNum) {
        threads[ch.phoneNum] = {
          playerName: ch.identity?.name || ch.id,
          phoneNum: ch.phoneNum,
          messages: msgs
        };
      }
    });
    return threads;
  };

  const playerThreads = selectedNpc ? getPlayerThreads(selectedNpc.phone) : {};
  const activeThread = selectedPlayerPhone ? playerThreads[selectedPlayerPhone] : null;

  const handleSend = (e) => {
    e.preventDefault();
    if ((!chatInput.trim() && !chatMediaUrl.trim()) || !selectedNpc || !selectedPlayerPhone) return;
    onGMSendMessage(selectedPlayerPhone, selectedNpc.phone, {
      id: crypto.randomUUID(),
      sender: selectedNpc.name,
      type: chatType,
      content: chatInput,
      mediaUrl: chatMediaUrl,
      timestamp: Date.now()
    });
    setChatInput('');
    setChatMediaUrl('');
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 border-b border-red-950 pb-4">
        <div className="flex items-center gap-3">
          <SpinningD20 size={36} />
          <h2 className="text-xl font-black text-zinc-100 uppercase tracking-widest">Telemóveis dos NPCs (Painel do Mestre)</h2>
        </div>
        <Button variant="secondary" onClick={onBack}>Voltar ao Painel</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2 max-h-[500px] overflow-y-auto">
          <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">Selecione o NPC</h3>
          {campNpcs.length === 0 ? <p className="text-xs text-zinc-600 italic">Nenhum NPC com telemóvel registado.</p> :
            campNpcs.map(npc => (
              <div key={npc.id} onClick={() => { setSelectedNpc(npc); setSelectedPlayerPhone(null); }} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedNpc?.id === npc.id ? 'bg-red-950/40 border-red-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                <p className="font-bold text-sm">{npc.name}</p>
                <p className="text-[10px] font-mono">{npc.phone}</p>
              </div>
            ))
          }
        </div>

        <div className="md:col-span-2 flex justify-center">
          {!selectedNpc ? (
            <div className="w-[340px] h-[680px] bg-black border-4 border-zinc-800 rounded-[40px] flex items-center justify-center text-zinc-600 text-xs italic p-6 text-center">
              Selecione um NPC à esquerda para abrir o telemóvel.
            </div>
          ) : (
            <div className="w-[340px] h-[680px] bg-black border-4 border-zinc-800 rounded-[40px] shadow-[0_0_30px_rgba(153,27,27,0.3)] flex flex-col overflow-hidden relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-5 bg-zinc-800 rounded-b-xl z-30"></div>
              
              <div className="pt-8 px-6 pb-4 bg-zinc-950 border-b border-zinc-900 flex justify-between items-center text-xs text-zinc-400 font-mono">
                <span>12:09</span>
                <span className="text-[10px] text-red-500 font-bold uppercase">{selectedNpc.name}</span>
                <span>5G</span>
              </div>

              <div className="flex-1 bg-zinc-950 p-4 flex flex-col justify-between overflow-hidden">
                {!selectedPlayerPhone ? (
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] font-bold uppercase text-zinc-500">Conversas com Jogadores:</p>
                    </div>
                    {Object.keys(playerThreads).length === 0 ? (
                      <p className="text-xs text-zinc-600 italic text-center mt-24">Nenhuma conversa ativa com jogadores.</p>
                    ) : (
                      Object.values(playerThreads).map(thread => {
                        return (
                          <div key={thread.phoneNum} onClick={() => setSelectedPlayerPhone(thread.phoneNum)} className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 cursor-pointer hover:border-red-600 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-zinc-200 text-xs">{thread.playerName}</p>
                              <p className="text-[10px] font-mono text-zinc-500">{thread.phoneNum}</p>
                            </div>
                            <span className="bg-red-950 text-red-300 px-2 py-0.5 rounded text-[10px] font-bold">Chat Ativo</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden space-y-2">
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                      <button onClick={() => setSelectedPlayerPhone(null)} className="text-[10px] text-red-400 font-bold uppercase">← Voltar</button>
                      <span className="text-[10px] text-zinc-400 font-mono">{activeThread?.playerName}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {activeThread?.messages.map(m => {
                        const isNpcSender = m.sender === selectedNpc.name;
                        return (
                          <div key={m.id} className={`flex ${isNpcSender ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-2.5 rounded-lg text-xs ${isNpcSender ? 'bg-red-950 text-red-200 rounded-br-none border border-red-900/55' : 'bg-zinc-900 text-zinc-200 rounded-bl-none border border-zinc-800'}`}>
                              <span className="font-bold text-[10px] block mb-0.5 opacity-70">{m.sender}</span>
                              {m.content && <p className="mb-1">{m.content}</p>}
                              {m.mediaUrl && <img src={m.mediaUrl} alt="media" className="max-h-28 rounded object-cover w-full" onError={(e)=>{e.target.style.display='none'}} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form onSubmit={handleSend} className="space-y-2 pt-2 border-t border-zinc-900">
                      <div className="flex gap-1">
                        <select value={chatType} onChange={e => setChatType(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded p-1 text-[10px] text-zinc-300">
                          <option value="text">Texto</option>
                          <option value="image">Imagem</option>
                        </select>
                        {chatType !== 'text' && (
                          <input type="url" placeholder="URL da Média..." value={chatMediaUrl} onChange={e => setChatMediaUrl(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded p-1 text-[10px] text-white" />
                        )}
                      </div>
                      <div className="flex gap-1">
                        <input type="text" placeholder={`Responder como ${selectedNpc.name}...`} value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-white outline-none" />
                        <Button type="submit" className="text-xs px-2 py-1">Enviar</Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              <div className="h-10 bg-zinc-950 border-t border-zinc-900 flex items-center justify-center">
                <div onClick={() => setSelectedNpc(null)} className="w-12 h-4 bg-zinc-700 rounded-full cursor-pointer hover:bg-zinc-600"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GMPanel = ({ campaign, characters, rolls, initiatives, npcs, stores, categories, items, negotiations, session, onBack, onAddInitiative, onDeleteInitiative, onAddNPC, onUpdateNPC, onDeleteNPC, onViewPlayerSheet, onOpenAdmin, currentUser, onSetStoreActive, onSetBankActive, onResolveNegotiation, onCounterNegotiation, onGMAddItemToChar, onGMUpdateMoney, onGMUpdateBankMoney, onOpenGMPhone, onStartSession, onEndSession, onJoinSession, onLeaveSession, onTransferMoney, onToggleSessionNPC, onClearRolls, onUpdateCharacter, onGMRemoveItemFromChar }) => {
  const [activeTab, setActiveTab] = useState('characters');
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionNameInput, setSessionNameInput] = useState('');
  const [sessionDescriptionInput, setSessionDescriptionInput] = useState('');
  
  const [initName, setInitName] = useState('');
  const [initValue, setInitValue] = useState('');
  
  const [npcName, setNpcName] = useState('');
  const [npcType, setNpcType] = useState('npc');
  const [npcVida, setNpcVida] = useState(30);
  const [npcSanidade, setNpcSanidade] = useState(15);
  const [npcPortrait, setNpcPortrait] = useState('');
  const [creatingNpc, setCreatingNpc] = useState(false);

  const campRolls = (rolls || []).filter(r => r.campaignId === campaign.id).sort((a, b) => b.timestamp - a.timestamp);
  const campInit = (initiatives || []).filter(i => i.campaignId === campaign.id).sort((a, b) => b.value - a.value);
  const campNpcs = (npcs || []).filter(n => n.campaignId === campaign.id);
  const campChars = (characters || []).filter(c => c.id.startsWith(`${campaign.id}_`));
  const campNegs = (negotiations || []).filter(n => n.campaignId === campaign.id && n.status === 'pending' && n.lastOfferBy !== 'gm');

  const [selectedCharForModal, setSelectedCharForModal] = useState(null);
  const [selectedItemForModal, setSelectedItemForModal] = useState('');

  const [selectedCharForMoney, setSelectedCharForMoney] = useState(null);
  const [moneyAmountInput, setMoneyAmountInput] = useState('');

  const [selectedCharForBank, setSelectedCharForBank] = useState(null);
  const [bankAmountInput, setBankAmountInput] = useState('');
  const [counterNegId, setCounterNegId] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  const handleAddInit = (e) => {
    e.preventDefault();
    if(initName && initValue) { onAddInitiative(campaign.id, initName, Number(initValue)); setInitName(''); setInitValue(''); }
  };

  const handleAddNPC = async (e) => {
    e.preventDefault();
    if (!npcName.trim() || creatingNpc) return;
    setCreatingNpc(true);
    try {
      const randomPhone = npcType === 'npc' ? `555-${Math.floor(1000 + Math.random() * 9000)}` : '';
      await onAddNPC(campaign.id, npcName.trim(), npcType, Number(npcVida), Number(npcSanidade), randomPhone, npcPortrait.trim());
      setNpcName('');
      setNpcPortrait('');
    } catch (err) {
      console.error('Erro ao criar NPC/monstro:', err);
      siteNotify('Não foi possível criar a entidade.', 'error');
    } finally {
      setCreatingNpc(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans p-4 sm:p-8 pb-20 w-full">
      <header className="max-w-7xl mx-auto flex items-center justify-between pb-6 mb-6 border-b border-red-950">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} icon={ChevronRight} className="rotate-180 p-2"></Button>
          <div className="flex items-center gap-3">
            <SpinningD20 size={36} />
            <div>
              <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-widest">{campaign.name}</h1>
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">Painel do Mestre • Black Wolfes RPG</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={onOpenGMPhone} icon={Smartphone}>Telemóveis NPC</Button>
          {currentUser.isAdmin && <Button variant="secondary" onClick={onOpenAdmin}>Painel Admin</Button>}
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-900 pb-2">
          {[ 
            { id: 'session', label: 'Sessão', icon: Activity },
            { id: 'characters', label: 'Personagens', icon: Users },
            { id: 'rolls', label: 'Rolagens', icon: Dices },
            { id: 'initiative', label: 'Iniciativa', icon: Swords },
            { id: 'npcs', label: 'Monstros & NPCs', icon: Zap },
            { id: 'stores', label: 'Lojas & Negociações', icon: ShoppingBag }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
              className={`flex items-center gap-2 px-4 py-2 uppercase font-bold tracking-widest text-xs rounded transition-colors ${activeTab === tab.id ? 'bg-red-950 text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <tab.icon size={16}/> {tab.label} {tab.id === 'stores' && campNegs.length > 0 && <span className="bg-red-600 text-black px-1.5 py-0.2 rounded-full text-[10px]">{campNegs.length}</span>}
            </button>
          ))}
        </div>

        <div className="bg-zinc-950/50 rounded-xl p-4 sm:p-6 border border-zinc-900 min-h-[65vh]">
          
          {activeTab === 'session' && (
            <SessionMenu campaign={campaign} characters={characters} npcs={npcs} session={session} isGM={true} onStartSession={() => { setSessionNameInput(''); setSessionDescriptionInput(''); setSessionModalOpen(true); }} onEndSession={onEndSession} onToggleNPC={onToggleSessionNPC} onUpdateCharacter={onUpdateCharacter} />
          )}

          {activeTab === 'characters' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4">Estado da Equipa (Em Direto)</h2>
              {campChars.length === 0 ? <p className="text-zinc-600 italic">Nenhum personagem guardado nesta campanha.</p> : 
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campChars.map(char => {
                    const vCur = Number(char.status?.vida?.current) || 0; const vMax = Number(char.status?.vida?.max) || 1;
                    const sCur = Number(char.status?.sanidade?.current) || 0; const sMax = Number(char.status?.sanidade?.max) || 1;
                    const money = Number(char.money) || 0;
                    const bankMoney = Number(char.bankMoney) || 0;
                    const vPct = Math.min(100, Math.max(0, (vCur / vMax) * 100));
                    const sPct = Math.min(100, Math.max(0, (sCur / sMax) * 100));
                    
                    return (
                      <GlowingCard key={char.id} className="p-5">
                        <div className="flex justify-between items-start mb-4 border-b border-zinc-800/50 pb-2">
                          <div onClick={() => onViewPlayerSheet(char)} className="cursor-pointer flex-1">
                            <h3 className="font-black text-xl text-zinc-100 uppercase truncate hover:text-red-400 transition-colors">{char.identity?.name || 'Sem Nome'}</h3>
                            <p className="text-xs text-zinc-500 font-bold uppercase">{char.identity?.class || 'Mundano'} • NEX: {char.identity?.nex}%</p>
                            <p className="text-[11px] text-green-400 font-mono mt-0.5">💰 Mão: {money} CR {campaign.activeBank ? `| 🏦 Banco: ${bankMoney} CR` : ''}</p>
                            {char.conditions && char.conditions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {char.conditions.map(cond => (
                                  <span key={cond} className="text-[9px] uppercase font-bold bg-red-950/80 text-red-300 px-2 py-0.5 rounded border border-red-900/50">{cond}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <button onClick={() => setSelectedCharForMoney(char)} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded border border-zinc-700" title="Gerir Dinheiro Mão">
                              <DollarSign size={14}/> Mão
                            </button>
                            {campaign.activeBank && (
                              <button onClick={() => setSelectedCharForBank(char)} className="text-xs bg-green-950 hover:bg-green-900 text-green-300 px-2 py-1 rounded border border-green-800" title="Gerir Dinheiro Banco">
                                <DollarSign size={14}/> Banco
                              </button>
                            )}
                            <button onClick={() => setSelectedCharForModal(char)} className="text-xs bg-red-950 hover:bg-red-900 text-red-300 px-2 py-1 rounded border border-red-900" title="Dar Item ao Jogador">
                              <Plus size={14}/>
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-4 cursor-pointer" onClick={() => onViewPlayerSheet(char)}>
                          <div>
                            <div className="flex justify-between text-xs font-bold text-red-400 mb-1 uppercase"><span>Vida</span> <span>{vCur} / {vMax}</span></div>
                            <div className="w-full bg-black border border-zinc-800 h-3 rounded-full overflow-hidden">
                              <div className="bg-red-600 h-full transition-all duration-500" style={{width: `${vPct}%`}}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs font-bold text-blue-400 mb-1 uppercase"><span>Sanidade</span> <span>{sCur} / {sMax}</span></div>
                            <div className="w-full bg-black border border-zinc-800 h-3 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full transition-all duration-500" style={{width: `${sPct}%`}}></div>
                            </div>
                          </div>
                        </div>
                      </GlowingCard>
                    )
                  })}
                </div>
              }
            </div>
          )}

          {activeTab === 'rolls' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2"><h2 className="text-lg font-bold text-red-500 uppercase tracking-widest">Log de Rolagens em Tempo Real</h2><Button variant="secondary" icon={Trash2} onClick={onClearRolls}>Limpar log</Button></div>
              <div className="space-y-2 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {campRolls.length === 0 ? <p className="text-zinc-600 italic">Nenhum dado rolado recentemente.</p> : 
                  campRolls.map(r => (
                    <div key={r.id} className="bg-zinc-900 p-3 rounded border border-zinc-800 flex justify-between items-center hover:border-red-900/50 transition-colors">
                      <div>
                        <span className="font-bold text-red-400">{r.playerName}</span> rolou <span className="text-zinc-400">{r.skillName}</span>{r.dieType && <span className="ml-2 text-[10px] text-zinc-600 font-mono">[{r.dieType}]</span>}
                      </div>
                      <div className="text-xl font-black text-zinc-100 bg-black px-4 py-1 rounded border border-red-900/50 shadow-[0_0_10px_rgba(153,27,27,0.2)]">
                        {r.result}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {activeTab === 'initiative' && (
             <div className="grid md:grid-cols-3 gap-8">
             <div className="md:col-span-1">
               <GlowingCard className="p-4">
                 <h3 className="font-bold text-red-500 uppercase tracking-widest mb-4 text-sm">Adicionar à Ordem</h3>
                 <form onSubmit={handleAddInit} className="space-y-4">
                   <select value={initName} onChange={e=>setInitName(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600"><option value="">Escolher pessoa/entidade...</option>{characters.filter(c=>c.id.startsWith(`${campaign.id}_`) && (session?.participantIds||[]).includes(c.id)).map(c=><option key={c.id} value={c.identity?.name||c.id}>{c.identity?.name||c.id} (Player)</option>)}{(session?.npcIds||[]).map(id=>npcs.find(n=>n.id===id)).filter(Boolean).map(n=><option key={n.id} value={n.name}>{n.name} ({(n.type==='monster'||n.type==='monstro')?'Monstro':'NPC'})</option>)}</select>
                   <input type="number" placeholder="Valor de Iniciativa" value={initValue} onChange={e=>setInitValue(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600" />
                   <Button type="submit" className="w-full">Inserir na Ordem</Button>
                 </form>
               </GlowingCard>
             </div>
             <div className="md:col-span-2 space-y-2">
               <h3 className="font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4 text-sm">Ordem de Combate Atual</h3>
               {campInit.length === 0 ? <p className="text-zinc-600 italic">Combate vazio.</p> : 
                 campInit.map((init, index) => (
                   <div key={init.id} className="bg-zinc-900 p-3 rounded border border-zinc-800 flex justify-between items-center group">
                     <div className="flex items-center gap-4">
                       <span className="text-2xl font-black text-red-700 w-8 text-center">{index + 1}º</span>
                       <span className="font-bold text-zinc-200 text-lg">{init.name}</span>
                     </div>
                     <div className="flex items-center gap-4">
                       <span className="font-mono text-zinc-400 bg-black px-3 py-1 rounded">Init: {init.value}</span>
                       <button onClick={() => onDeleteInitiative(init.id)} className="text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                     </div>
                   </div>
                 ))
               }
             </div>
           </div>
          )}

          {activeTab === 'npcs' && (
            <div className="grid xl:grid-cols-3 gap-8">
              <div className="xl:col-span-1">
                <GlowingCard className="p-4">
                  <h3 className="font-bold text-red-500 uppercase tracking-widest mb-4 text-sm">Criar Monstro / NPC</h3>
                  <form onSubmit={handleAddNPC} className="space-y-4">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase">Categoria</label>
                      <select value={npcType} onChange={e => setNpcType(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600 text-sm">
                        <option value="npc">NPC (Com Número de Telemóvel)</option>
                        <option value="monstro">Monstro (Sem Telemóvel)</option>
                      </select>
                    </div>
                    <input type="text" placeholder="Nome da Entidade" value={npcName} onChange={e=>setNpcName(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600" />
                    <input type="url" placeholder="URL do Retrato (opcional)" value={npcPortrait} onChange={e=>setNpcPortrait(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-600 text-xs" />
                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <label className="text-[10px] text-zinc-500 uppercase">Vida Máx</label>
                        <input type="number" value={npcVida} onChange={e=>setNpcVida(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-red-500" />
                      </div>
                      <div className="w-1/2">
                        <label className="text-[10px] text-zinc-500 uppercase">Sanidade Máx</label>
                        <input type="number" value={npcSanidade} onChange={e=>setNpcSanidade(e.target.value)} required className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 outline-none focus:border-blue-500" />
                      </div>
                    </div>
                    <Button type="submit" disabled={creatingNpc} className="w-full">{creatingNpc ? 'A criar...' : 'Criar Entidade'}</Button>
                  </form>
                </GlowingCard>
              </div>
              <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[calc(100vh-220px)] min-h-0 overflow-y-auto pr-2 custom-scrollbar items-start content-start">
                 {campNpcs.length === 0 ? <p className="text-zinc-600 italic">Nenhuma ameaça registada.</p> : 
                  campNpcs.map((npc) => (
                    <div key={npc.id} className="bg-zinc-900/80 p-5 rounded-xl border border-red-900/40 relative shadow-[0_4px_15px_rgba(0,0,0,5)]">
                      <button onClick={() => onDeleteNPC(npc.id)} className="absolute top-4 right-4 text-zinc-600 hover:text-red-500"><Trash2 size={18}/></button>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-black text-red-500 text-xl uppercase pr-6">{npc.name}</h4>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${npc.type === 'monstro' ? 'bg-red-950 text-red-400' : 'bg-blue-950 text-blue-400'}`}>
                          {npc.type === 'monstro' ? 'Monstro' : 'NPC'}
                        </span>
                      </div>
                      {npc.type !== 'monstro' && <p className="text-xs font-mono text-zinc-400 mb-4 flex items-center gap-1"><Phone size={12}/> {npc.phone || '555-0199'}</p>}
                      <input type="url" value={npc.portrait || ''} onChange={e => onUpdateNPC(npc.id, { portrait: e.target.value })} placeholder="URL do Retrato" className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-zinc-300 outline-none focus:border-red-800 mb-4" />
                      
                      <div className="flex gap-4 mb-5">
                        <div className="flex-1 bg-black px-3 py-2 rounded-lg border border-red-900/30 flex items-center justify-between">
                           <span className="text-[10px] font-bold text-red-500 uppercase">Vida</span>
                           <div className="flex items-center">
                             <input type="number" value={npc.vida} onChange={e => onUpdateNPC(npc.id, {vida: Number(e.target.value)})} className="w-12 bg-transparent text-right font-black outline-none text-zinc-200" />
                             <span className="text-zinc-600 text-sm ml-1">/ {npc.maxVida}</span>
                           </div>
                        </div>
                        <div className="flex-1 bg-black px-3 py-2 rounded-lg border border-blue-900/30 flex items-center justify-between">
                           <span className="text-[10px] font-bold text-blue-500 uppercase">Sanidade</span>
                           <div className="flex items-center">
                             <input type="number" value={npc.sanidade} onChange={e => onUpdateNPC(npc.id, {sanidade: Number(e.target.value)})} className="w-12 bg-transparent text-right font-black outline-none text-zinc-200" />
                             <span className="text-zinc-600 text-sm ml-1">/ {npc.maxSanidade}</span>
                           </div>
                        </div>
                      </div>

                      {npc.type === 'monstro' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-zinc-500">Ataques</label>
                            <textarea value={npc.attacks || ''} onChange={e => onUpdateNPC(npc.id, {attacks: e.target.value})} placeholder="Arma, dano, alcance..." className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-zinc-300 outline-none focus:border-red-800 min-h-[60px] resize-y" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-zinc-500">Habilidades / Passivas</label>
                            <textarea value={npc.abilities || ''} onChange={e => onUpdateNPC(npc.id, {abilities: e.target.value})} placeholder="Efeitos especiais..." className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-zinc-300 outline-none focus:border-red-800 min-h-[60px] resize-y" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-zinc-500">Fraquezas</label>
                            <textarea value={npc.weaknesses || ''} onChange={e => onUpdateNPC(npc.id, {weaknesses: e.target.value})} placeholder="Resistências e vulnerabilidades..." className="w-full bg-black border border-zinc-800 rounded p-2 text-sm text-zinc-300 outline-none focus:border-red-800 min-h-[60px] resize-y" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                 }
              </div>
            </div>
          )}

          {activeTab === 'stores' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-red-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Gestão de Lojas e Negociações</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                  <h3 className="text-sm font-bold text-zinc-200 uppercase mb-3">Ativar Loja para os Jogadores</h3>
                  <div className="flex flex-wrap gap-3">
                    {(stores || []).length === 0 ? <p className="text-xs text-zinc-600">Nenhuma loja criada.</p> :
                      (stores || []).map(st => {
                        const isActive = campaign.activeStoreId === st.id;
                        return (
                          <Button key={st.id} variant={isActive ? 'primary' : 'secondary'} onClick={() => onSetStoreActive(campaign.id, isActive ? null : st.id)}>
                            {st.name} {isActive ? '(Ativa)' : ''}
                          </Button>
                        );
                      })
                    }
                  </div>
                </div>

                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                  <h3 className="text-sm font-bold text-zinc-200 uppercase mb-3">Ativar Sistema de Banco</h3>
                  <div className="flex items-center gap-3">
                    <Button variant={campaign.activeBank ? 'primary' : 'secondary'} onClick={() => onSetBankActive(campaign.id, !campaign.activeBank)}>
                      {campaign.activeBank ? 'Sistema de Banco Ativo' : 'Sistema de Banco Desativado'}
                    </Button>
                    <span className="text-xs text-zinc-400">Permite aos jogadores transferirem dinheiro para o banco.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-200 uppercase">Pedidos de Compra / Negociação Pendentes</h3>
                {campNegs.length === 0 ? <p className="text-xs text-zinc-600 italic">Nenhum pedido pendente.</p> :
                  campNegs.map(neg => (
                    <div key={neg.id} className="bg-zinc-900 p-4 rounded-lg border border-red-900/50 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-zinc-100">{neg.playerName} quer: <span className="text-red-400">{neg.itemName}</span></p>
                        <p className="text-xs text-zinc-400 mt-1">Preço: <span className="text-red-400 font-mono">{Number(neg.listedPrice) || 0} CR</span> → Proposta: <span className="text-green-400 font-mono">{Number(neg.proposedPrice) || 0} CR</span></p>
                        {neg.negotiationMessage && <p className="text-xs text-zinc-500 mt-1 italic">“{neg.negotiationMessage}”</p>}
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="primary" onClick={() => onResolveNegotiation(neg.id, 'approved')} className="text-xs py-1 px-3">Aprovar</Button>
                        <Button variant="secondary" onClick={() => onResolveNegotiation(neg.id, 'rejected')} className="text-xs py-1 px-3">Recusar</Button>
                        <Button variant="secondary" onClick={() => { setCounterNegId(neg.id); setCounterPrice(String(neg.proposedPrice ?? neg.listedPrice ?? 0)); setCounterMessage(''); }} className="text-xs py-1 px-3">Contra-proposta</Button>
                      </div>
                      {counterNegId === neg.id && <div className="mt-3 pt-3 border-t border-zinc-800 grid md:grid-cols-3 gap-2">
                        <input type="number" min="0" value={counterPrice} onChange={e=>setCounterPrice(e.target.value)} placeholder="Preço CR" className="bg-black border border-zinc-700 rounded p-2 text-xs text-white"/>
                        <input type="text" value={counterMessage} onChange={e=>setCounterMessage(e.target.value)} placeholder="Mensagem" className="bg-black border border-zinc-700 rounded p-2 text-xs text-white"/>
                        <div className="flex gap-2"><Button className="text-xs py-1 px-3" onClick={async()=>{const v=Number(counterPrice); if(!Number.isFinite(v)||v<0)return siteNotify('Preço inválido.'); await onCounterNegotiation(neg.id,v,counterMessage); setCounterNegId(null); setCounterPrice(''); setCounterMessage('');}}>Enviar</Button><Button variant="ghost" className="text-xs" onClick={()=>setCounterNegId(null)}>Cancelar</Button></div>
                      </div>}
                    </div>
                  ))
                }
              </div>
            </div>
          )}

        </div>
      </main>

      {selectedCharForModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <GlowingCard className="p-6 max-w-md w-full bg-zinc-950">
            <h3 className="text-lg font-bold text-red-500 mb-2 uppercase tracking-wide">Atribuir Item ao Jogador</h3>
            <p className="text-xs text-zinc-400 mb-4">Personagem: <strong className="text-zinc-200">{selectedCharForModal.identity?.name || 'Sem Nome'}</strong></p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Selecionar Item do Catálogo:</label>
                <select value={selectedItemForModal} onChange={e => setSelectedItemForModal(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white text-sm">
                  <option value="">Selecionar item...</option>
                  {(items || []).map(it => (
                    <option key={it.id} value={it.id}>{it.name} {it.damage ? `(Dano: ${it.damage})` : it.buff ? `(Buff: ${it.buff})` : ''}</option>
                  ))}
                </select>
              </div>

              {(selectedCharForModal.inventory||[]).length>0 && <div className="bg-zinc-900 border border-zinc-800 rounded p-3 space-y-2"><p className="text-[10px] uppercase font-bold text-zinc-500">Inventário atual</p>{selectedCharForModal.inventory.map((it,idx)=><div key={idx} className="flex justify-between items-center text-xs"><span>{it.name} × {it.quantity||1}</span><button className="text-red-400" onClick={()=>onGMRemoveItemFromChar(selectedCharForModal,idx)}>Remover</button></div>)}</div>}
              <div className="flex gap-2 justify-end mt-6">
                <Button variant="secondary" onClick={() => setSelectedCharForModal(null)}>Cancelar</Button>
                <Button onClick={() => {
                  const foundItem = items.find(i => i.id === selectedItemForModal);
                  if (foundItem) {
                    onGMAddItemToChar(selectedCharForModal, foundItem);
                    setSelectedCharForModal(null);
                    setSelectedItemForModal('');
                  }
                }}>Adicionar à Ficha</Button>
              </div>
            </div>
          </GlowingCard>
        </div>
      )}

      {sessionModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setSessionModalOpen(false); }}>
          <GlowingCard className="p-6 sm:p-7 max-w-lg w-full bg-zinc-950 border-red-900/70 shadow-[0_0_60px_rgba(220,38,38,0.18)]">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-500 mb-1">Nova sessão</p>
                <h3 className="text-xl font-black text-white uppercase tracking-wide">Iniciar sessão</h3>
                <p className="text-xs text-zinc-500 mt-1">Define o título e uma breve descrição para os jogadores.</p>
              </div>
              <button onClick={() => setSessionModalOpen(false)} className="text-zinc-600 hover:text-zinc-200 transition-colors text-xl" aria-label="Fechar">×</button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Nome da sessão <span className="text-red-500">*</span></label>
                <input autoFocus value={sessionNameInput} onChange={e => setSessionNameInput(e.target.value)} maxLength={80} placeholder="Ex.: O Abandono de Santa Maria" className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-sm text-white outline-none focus:border-red-600 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Breve descrição</label>
                <textarea value={sessionDescriptionInput} onChange={e => setSessionDescriptionInput(e.target.value)} maxLength={300} rows={4} placeholder="Ex.: O grupo regressa à casa abandonada para descobrir o que aconteceu..." className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-sm text-white outline-none focus:border-red-600 transition-colors resize-none" />
                <div className="text-right text-[9px] text-zinc-600 mt-1">{sessionDescriptionInput.length}/300</div>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-7">
              <Button variant="secondary" onClick={() => setSessionModalOpen(false)}>Cancelar</Button>
              <Button disabled={!sessionNameInput.trim()} onClick={async () => {
                const name = sessionNameInput.trim();
                if (!name) return;
                await onStartSession(name, sessionDescriptionInput.trim());
                setSessionModalOpen(false);
              }} icon={Play}>Iniciar sessão</Button>
            </div>
          </GlowingCard>
        </div>
      )}

      {selectedCharForMoney && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <GlowingCard className="p-6 max-w-sm w-full bg-zinc-950">
            <h3 className="text-lg font-bold text-red-500 mb-2 uppercase">Gerir Dinheiro em Mão</h3>
            <p className="text-xs text-zinc-400 mb-4">Personagem: <strong className="text-zinc-200">{selectedCharForMoney.identity?.name || 'Sem Nome'}</strong></p>
            
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Adicionar / Remover CR em Mão (ex: +500 ou -200):</label>
              <input type="number" value={moneyAmountInput} onChange={e => setMoneyAmountInput(e.target.value)} placeholder="0"
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white text-sm outline-none focus:border-red-600 text-center font-bold font-mono" />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setSelectedCharForMoney(null)}>Cancelar</Button>
              <Button onClick={() => {
                const amt = Number(moneyAmountInput) || 0;
                const currentMoney = Number(selectedCharForMoney.money) || 0;
                onGMUpdateMoney(selectedCharForMoney, currentMoney + amt);
                setSelectedCharForMoney(null);
                setMoneyAmountInput('');
              }}>Atualizar</Button>
            </div>
          </GlowingCard>
        </div>
      )}

      {selectedCharForBank && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <GlowingCard className="p-6 max-w-sm w-full bg-zinc-950">
            <h3 className="text-lg font-bold text-green-500 mb-2 uppercase">Gerir Dinheiro no Banco</h3>
            <p className="text-xs text-zinc-400 mb-4">Personagem: <strong className="text-zinc-200">{selectedCharForBank.identity?.name || 'Sem Nome'}</strong></p>
            
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Adicionar / Remover CR no Banco (ex: +500 ou -200):</label>
              <input type="number" value={bankAmountInput} onChange={e => setBankAmountInput(e.target.value)} placeholder="0"
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white text-sm outline-none focus:border-green-600 text-center font-bold font-mono" />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setSelectedCharForBank(null)}>Cancelar</Button>
              <Button onClick={() => {
                const amt = Number(bankAmountInput) || 0;
                const currentBank = Number(selectedCharForBank.bankMoney) || 0;
                onGMUpdateBankMoney(selectedCharForBank, currentBank + amt);
                setSelectedCharForBank(null);
                setBankAmountInput('');
              }}>Atualizar Banco</Button>
            </div>
          </GlowingCard>
        </div>
      )}

    </div>
  );



};

const getCharacterPortrait = (char) => {
  const portraits = char?.portraits || {};
  const conditions = char?.conditions || [];
  if (conditions.includes('Morrendo') && portraits.dying) return portraits.dying;
  if (conditions.includes('Ferido') && conditions.includes('Louco') && portraits.injuredInsane) return portraits.injuredInsane;
  if (conditions.includes('Ferido') && portraits.injured) return portraits.injured;
  if (conditions.includes('Louco') && portraits.insane) return portraits.insane;
  return portraits.normal || char?.portrait || char?.imageUrl || '';
};

const SessionMenu = ({ campaign, characters, npcs, session, isGM, currentCharacterId, onStartSession, onEndSession, onJoinSession, onLeaveSession, onToggleNPC, onUpdateCharacter, onBack }) => {
  const active = !!session?.active;
  const activeNpcIds = session?.npcIds || [];
  const campChars = (characters || []).filter(c => c.id.startsWith(`${campaign.id}_`));
  const campNpcs = (npcs || []).filter(n => n.campaignId === campaign.id);
  const isParticipant = isGM || (session?.participantIds || []).includes(currentCharacterId);
  const activeNpcs = campNpcs.filter(n => activeNpcIds.includes(n.id));
  const latestRoll = session?.lastRoll;
  return (<div className="min-h-[65vh] space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
      <div><p className="text-[10px] uppercase tracking-widest font-bold text-red-500">Sessão</p><h2 className="text-2xl font-black text-white uppercase">{active ? (session?.name || 'Sessão em direto') : 'Sessão encerrada'}</h2><p className="text-xs text-zinc-500 mt-1">{active ? (session?.description || 'Estado sincronizado em direto para todos os jogadores.') : 'Estado sincronizado em direto para todos os jogadores.'}</p></div>
      {isGM && (active ? <Button variant="secondary" onClick={onEndSession} icon={Square}>Terminar sessão</Button> : <Button onClick={onStartSession} icon={Play}>Iniciar sessão</Button>)}{!isGM && active && ((session?.participantIds||[]).includes(currentCharacterId) ? <Button variant="secondary" onClick={onLeaveSession}>Sair da sessão</Button> : <Button onClick={onJoinSession} icon={Play}>Entrar na sessão</Button>)}
    </div>
    {!active ? <GlowingCard className="p-10 text-center"><Play size={42} className="mx-auto text-zinc-700 mb-4"/><h3 className="font-black text-zinc-300 uppercase">A sessão ainda não começou</h3><p className="text-sm text-zinc-600 mt-2">O Mestre pode iniciar a sessão neste menu.</p></GlowingCard> : <>
      {latestRoll && <GlowingCard className="p-4 border-red-700/60 bg-red-950/20"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] text-red-500 uppercase tracking-widest font-bold">Última rolagem</p><p className="text-sm text-zinc-300 font-bold">{latestRoll.playerName} • {latestRoll.skillName}</p></div><div className="text-4xl font-black text-red-400 font-mono">{latestRoll.result}</div></div></GlowingCard>}
      <section><div className="flex items-center gap-2 mb-3"><Users size={18} className="text-red-500"/><h3 className="text-sm font-black text-zinc-300 uppercase tracking-widest">Jogadores</h3></div>
        {(() => { const participantIds = session?.participantIds || []; const visibleChars = isGM ? campChars.filter(c => participantIds.includes(c.id)) : (isParticipant ? campChars.filter(c => participantIds.includes(c.id)) : []); return visibleChars.length === 0 ? <p className="text-zinc-600 italic">{!isParticipant && !isGM ? 'Entra na sessão para veres os participantes.' : 'Nenhum jogador entrou na sessão.'}</p> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{visibleChars.map(char => {
          const v=char.status?.vida||{}; const ss=char.status?.sanidade||{}; const lastIsThis=latestRoll && latestRoll.playerName===(char.identity?.name||'Sem Nome'); const portrait=getCharacterPortrait(char);
          return <GlowingCard key={char.id} className="p-4 relative overflow-visible">{lastIsThis && <div className="absolute -top-4 right-3 z-10 bg-red-600 text-black px-3 py-1 rounded-full font-black text-xl shadow-[0_0_18px_rgba(220,38,38,0.7)]">{latestRoll.result}</div>}<div className="flex gap-3 items-center mb-4"><div className="w-16 h-16 rounded-xl bg-black border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">{portrait?<img src={portrait} alt="Retrato" className="w-full h-full object-cover" onError={e=>{e.currentTarget.style.display='none'}}/>:<Users size={24} className="text-zinc-700"/>}</div><div className="min-w-0"><h4 className="font-black text-white uppercase truncate">{char.identity?.name||'Sem Nome'} {active && (session?.participantIds||[]).includes(char.id) ? <span className="text-[9px] text-green-400 ml-2">EM SESSÃO</span> : ''}</h4><p className="text-[10px] text-zinc-500 uppercase">{char.identity?.class||'Mundano'}</p></div></div><div className="grid grid-cols-3 gap-2 text-center"><div className="bg-black rounded p-2 border border-zinc-800"><Heart size={14} className="mx-auto text-red-500 mb-1"/><div className="text-sm font-black">{v.current??0}/{v.max??0}</div><div className="text-[8px] uppercase text-zinc-600">Vida</div></div><div className="bg-black rounded p-2 border border-zinc-800"><Brain size={14} className="mx-auto text-blue-500 mb-1"/><div className="text-sm font-black">{ss.current??0}/{ss.max??0}</div><div className="text-[8px] uppercase text-zinc-600">Sanidade</div></div><div className="bg-black rounded p-2 border border-zinc-800"><Shield size={14} className="mx-auto text-green-500 mb-1"/><div className="text-sm font-black">{(Number(char.status?.defense)||0)+(char.activeBuffs||[]).filter(b=>b.target==='defense').reduce((s,b)=>s+(Number(b.value)||0),0)}</div><div className="text-[8px] uppercase text-zinc-600">Defesa</div></div></div><div className="mt-3 space-y-2"><p className="text-[9px] uppercase font-bold text-zinc-600">Equipado</p>{(char.inventory||[]).filter(i=>i.equipped).map((i,ii)=><div key={ii} className="bg-black rounded p-2 border border-zinc-800 flex items-center gap-2">{i.imageUrl?<img src={i.imageUrl} className="w-8 h-8 rounded object-cover"/>:<Package size={18} className="text-zinc-600"/>}<div className="min-w-0 flex-1"><div className="text-xs font-bold truncate">{i.name}</div>{i.itemType==='weapon'&&<div className="text-[9px] text-red-400">Munição: {getAmmoName(i.ammoType)} {i.damage ? `• Dano: ${i.damage}` : ''} {i.extremeDamage ? `• Extremo: ${i.extremeDamage}` : ''} • Carregador {Number(i.ammoLoaded||0)}/{Number(i.magazineSize||0)} <button onClick={()=>onUpdateCharacter?.(char.id,{reloadWeaponIndex:(char.inventory||[]).indexOf(i)})} className="ml-2 px-1 rounded bg-red-950 text-red-300">Recarregar</button></div>}</div></div>)}</div></GlowingCard>;
        })}</div>})()}
      </section>
      <section><div className="flex flex-wrap items-center justify-between gap-3 mb-3"><div className="flex items-center gap-2"><Zap size={18} className="text-red-500"/><h3 className="text-sm font-black text-zinc-300 uppercase tracking-widest">Monstros & NPCs em cena</h3></div>{isGM&&<span className="text-[10px] uppercase text-zinc-600">Adiciona ameaças já criadas</span>}</div>
        {isGM && campNpcs.length>0 && <div className="mb-4 flex flex-wrap gap-2">{campNpcs.map(npc=>{const selected=activeNpcIds.includes(npc.id);return <button key={npc.id} onClick={()=>onToggleNPC(npc.id)} className={`px-3 py-2 rounded-lg border text-xs font-bold uppercase transition-all ${selected?'bg-red-950 text-red-300 border-red-700':'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}>{selected?'✓ ':'+ '}{npc.name}</button>})}</div>}
        {(!isParticipant && !isGM) ? <p className="text-zinc-600 italic">Entra na sessão para veres os NPCs e monstros em cena.</p> : activeNpcs.length===0?<p className="text-zinc-600 italic">Nenhum NPC ou monstro foi colocado na sessão.</p>:<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{activeNpcs.map(npc=><GlowingCard key={npc.id} className="p-4"><div className="flex gap-3 items-center mb-3"><div className="w-14 h-14 rounded-xl bg-black border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0">{npc.portrait||npc.imageUrl?<img src={npc.portrait||npc.imageUrl} alt="NPC" className="w-full h-full object-cover" onError={e=>{e.currentTarget.style.display='none'}}/>:<Zap size={22} className="text-red-800"/>}</div><div><h4 className="font-black text-white uppercase">{npc.name}</h4><p className="text-[9px] text-red-500 uppercase font-bold">{(npc.type==='monster'||npc.type==='monstro')?'Monstro':'NPC'}</p></div></div><div className="grid grid-cols-2 gap-2 text-center"><div className="bg-black rounded p-2 border border-zinc-800"><div className="text-sm font-black text-red-400">{npc.vida??0}/{npc.maxVida??0}</div><div className="text-[8px] uppercase text-zinc-600">Vida</div></div><div className="bg-black rounded p-2 border border-zinc-800"><div className="text-sm font-black text-blue-400">{npc.sanidade??0}/{npc.maxSanidade??0}</div><div className="text-[8px] uppercase text-zinc-600">Sanidade</div></div></div></GlowingCard>)}</div>}
      </section>
    </>}
    {onBack&&<div className="pt-3"><Button variant="ghost" onClick={onBack}>Voltar</Button></div>}
  </div>);
};

const PlayerSheet = ({ player, campaign, characterData, stores, categories, items, npcs, characters, session, onSave, onBack, onRollDice, isReadOnly = false, onOpenAdmin, currentUser, negotiations, onResolveNegotiation, onCreateNegotiation, onCounterNegotiation, onStartSession, onEndSession, onJoinSession, onLeaveSession, onTransferMoney, onTransferBankMoney, onTransferItem, onToggleSessionNPC, onUpdateCharacter }) => {
  const [activePlayerTab, setActivePlayerTab] = useState('ficha');
  const [phoneOpenApp, setPhoneOpenApp] = useState(null); 
  const [activeChatContactPhone, setActiveChatContactPhone] = useState(null); 
  
  const [charData, setCharData] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');
  
  const isDirtyRef = useRef(false);
  const lastLocalStateRef = useRef(null);
  const userEditedRef = useRef(false);

  const [activeSkillModal, setActiveSkillModal] = useState(null);
  const [selectedAttrForSkill, setSelectedAttrForSkill] = useState('');
  const [skillModifier, setSkillModifier] = useState('0');
  const [skillAdvantages, setSkillAdvantages] = useState(0);
  const [skillDisadvantages, setSkillDisadvantages] = useState(0);
  const [customDieSides, setCustomDieSides] = useState(20);
  const [customDieCount, setCustomDieCount] = useState(1);

  const [rollingAnimation, setRollingAnimation] = useState(null);
  const [shootModal, setShootModal] = useState(null);

  // Phone message inputs
  const [chatInput, setChatInput] = useState('');
  const [chatType, setChatType] = useState('text');
  const [chatMediaUrl, setChatMediaUrl] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactName, setNewContactName] = useState('');

  // Bank transfer inputs
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipientId, setTransferRecipientId] = useState('');
  const [bankTransferAmount, setBankTransferAmount] = useState('');
  const [bankTransferRecipientId, setBankTransferRecipientId] = useState('');
  const [inventoryRecipientId, setInventoryRecipientId] = useState('');

  // Phone settings
  const [phoneBrightness, setPhoneBrightness] = useState(100);
  const [phoneBg, setPhoneBg] = useState('bg-zinc-950');
  const [phoneCustomBgUrl, setPhoneCustomBgUrl] = useState('');
  const [activeNegotiationItem, setActiveNegotiationItem] = useState(null);
  const [negotiationPrice, setNegotiationPrice] = useState('');
  const [negotiationQuantity, setNegotiationQuantity] = useState('1');
  const [negotiationMessage, setNegotiationMessage] = useState('');
  const [counterNegotiation, setCounterNegotiation] = useState(null);
  const [playerNegotiations, setPlayerNegotiations] = useState([]);
  const [selectedBackpackIndex, setSelectedBackpackIndex] = useState(null);
  
  const [isEditingPortraits, setIsEditingPortraits] = useState(false);

  // Portraits for conditions
  const [portraits, setPortraits] = useState({ normal: '', injured: '', insane: '', injuredInsane: '', dying: '' });
  const [portraitDraft, setPortraitDraft] = useState({ normal: '', injured: '', insane: '', injuredInsane: '', dying: '' });

  const modifyCharData = (updater) => {
    if (isReadOnly) return;
    userEditedRef.current = true;
    setCharData(updater);
  };

  const modifyPortraits = (updater) => { if (isReadOnly) return; setPortraitDraft(updater); };
  const commitPortraits = () => { if (isReadOnly) return; setPortraits(portraitDraft); userEditedRef.current = true; };

  const modifyPhoneBgUrl = (val) => {
    if (isReadOnly) return;
    userEditedRef.current = true;
    setPhoneCustomBgUrl(val);
  };

  useEffect(() => {
    if (characterData) {
      // Impede o eco da base de dados (evita que o cursor salte enquanto o jogador escreve)
      if (isDirtyRef.current || userEditedRef.current) return;
      
      const incomingStr = JSON.stringify(characterData);
      if (lastLocalStateRef.current && JSON.stringify(lastLocalStateRef.current) === incomingStr) {
          return;
      }

      setCharData(characterData);
      if (characterData.portraits) { setPortraits(characterData.portraits); setPortraitDraft(characterData.portraits); }
      if (characterData.phoneCustomBgUrl !== undefined) setPhoneCustomBgUrl(characterData.phoneCustomBgUrl);
      if (characterData.phoneBg !== undefined) setPhoneBg(characterData.phoneBg);
      lastLocalStateRef.current = characterData;
    } else if (!isReadOnly && !charData) {
      const initialAttrs = { FOR: 1, AGI: 1, INT: 1, PRE: 1, VIG: 1 };
      const nexVal = 5;
      const initialVida = 8 + initialAttrs.VIG;

      const initPayload = {
        identity: { name: '', profession: '', class: (campaign.classes || ['Mundano'])[0], nex: nexVal },
        attributes: initialAttrs,
        status: {
          vida: { current: initialVida, max: initialVida },
          sanidade: { current: 8, max: 8 },
          defense: 0
        },
        conditions: [],
        skills: generateDefaultSkills(),
        inventory: [],
        money: 0,
        bankMoney: 0,
        notes: '// Escreve as tuas anotações importantes aqui...',
        contacts: [],
        messages: {},
        phoneNum: `555-${Math.floor(1000 + Math.random() * 9000)}`,
        portraits: { normal: '', injured: '', insane: '', injuredInsane: '', dying: '' },
        phoneCustomBgUrl: '',
        phoneBg: 'bg-zinc-950',
        lastUpdatedBy: player.id
      };
      
      setCharData(initPayload);
      setPortraits(initPayload.portraits); setPortraitDraft(initPayload.portraits);
      lastLocalStateRef.current = initPayload;
    }
  }, [characterData, campaign, isReadOnly, player.id]);

  // Efeito de Gravação Automática (Auto-Save)
  useEffect(() => {
    if (isReadOnly || !charData || !userEditedRef.current) return;

    const currentState = { ...charData, portraits, phoneCustomBgUrl, phoneBg, lastUpdatedBy: player.id, updatedAt: Date.now() };
    
    isDirtyRef.current = true;
    setSaveMsg('A guardar...');

    const timer = setTimeout(async () => {
        try {
            lastLocalStateRef.current = currentState;
            await onSave(campaign.id, player.id, currentState);
            setSaveMsg('Sincronizado');
            setTimeout(() => setSaveMsg((prev) => prev === 'Sincronizado' ? '' : prev), 2500);
        } catch (err) {
            setSaveMsg('Erro ao guardar');
        } finally {
            userEditedRef.current = false;
            isDirtyRef.current = false;
        }
    }, 1000);

    return () => clearTimeout(timer);
  }, [charData, portraits, phoneCustomBgUrl, phoneBg, campaign.id, player.id, onSave, isReadOnly]);

  useEffect(() => {
    setPlayerNegotiations((negotiations || []).filter(n => n.campaignId === campaign.id && n.playerId === player.id && n.status === 'pending'));
  }, [negotiations, campaign.id, player.id]);

  const inventoryCapacity = 10;
  const activeBackpacks = (charData?.inventory || []).map((item, inventoryIndex) => ({ item, inventoryIndex })).filter(x => x.item.itemType === 'backpack' && x.item.backpackOpen);
  useEffect(() => { if (activeBackpacks.length && (selectedBackpackIndex == null || selectedBackpackIndex >= activeBackpacks.length)) setSelectedBackpackIndex(0); if (!activeBackpacks.length) setSelectedBackpackIndex(null); }, [charData?.inventory, activeBackpacks.length, selectedBackpackIndex]);
  const hasPhoneItemEarly = (charData?.inventory || []).some(i => i.itemType === 'phone' && Number(i.quantity || 1) > 0) || (charData?.inventory || []).some(b => b.itemType === 'backpack' && (b.contents || []).some(i => i.itemType === 'phone' && Number(i.quantity || 1) > 0));
  useEffect(() => { if (!hasPhoneItemEarly && activePlayerTab === 'telemovel') setActivePlayerTab('ficha'); }, [hasPhoneItemEarly, activePlayerTab]);

  if (!charData) return <div className="bg-black min-h-screen text-white flex items-center justify-center">A carregar ficha...</div>;
  const selectedBackpackEntry = selectedBackpackIndex == null ? (activeBackpacks[0] || null) : (activeBackpacks[selectedBackpackIndex] || activeBackpacks[0] || null);
  const selectedBackpack = selectedBackpackEntry?.item || null;
  const backpackCapacity = activeBackpacks.reduce((sum, entry) => sum + (Number(entry.item.backpackSlots) || 0), 0);
  const backpackContents = activeBackpacks.flatMap((entry, bi) => (entry.item.contents || []).map((item, ii) => ({ ...item, __backpackIndex: bi, __contentIndex: ii })));
  const normalizeBuffTarget = (target) => {
    const raw = String(target || '').trim();
    if (!raw) return '';
    if (raw.toLowerCase() === 'defesa' || raw.toLowerCase() === 'defense') return 'defense';
    return raw.toLowerCase().startsWith('skill:') ? `skill:${raw.slice(6)}` : `skill:${raw}`;
  };
  const parseLegacyItemBuff = (item) => {
    const text = String(item?.buff || '').trim();
    const match = text.match(/^([+-]?\d+)\s*(?:pontos?\s*)?(?:de\s*)?(.+)$/i);
    if (!match) return null;
    const value = Number(match[1]);
    const targetText = String(match[2] || '').trim();
    if (!Number.isFinite(value) || !targetText) return null;
    return { target: normalizeBuffTarget(targetText), value };
  };
  const getItemBuffData = (item) => {
    if (!item) return null;
    if (item.effectType === 'buff' && item.effectTarget && Number(item.effectValue)) {
      return { target: normalizeBuffTarget(item.effectTarget), value: Number(item.effectValue) };
    }
    return parseLegacyItemBuff(item);
  };
  const getEquippedBuffs = (character = charData) => (character?.inventory || []).filter(i => i?.equipped).map(i => {
    const buff = getItemBuffData(i);
    if (!buff) return null;
    return { id: `equipped-${i.serialId || i.instanceId || i.id || i.name}`, itemId: i.id || '', name: i.name || 'Buff equipado', target: buff.target, value: buff.value, equipped: true };
  }).filter(Boolean);
  const effectiveBuffs = [...(charData?.activeBuffs || [])].map(b => ({ ...b, target: normalizeBuffTarget(b.target) })).concat(getEquippedBuffs(charData));
  const getBuffBonus = (target) => {
    const normalizedTarget = normalizeBuffTarget(target);
    return effectiveBuffs.filter(b => normalizeBuffTarget(b.target) === normalizedTarget).reduce((sum, b) => sum + (Number(b.value) || 0), 0);
  };
  const personalInventory = (charData.inventory || []);
  const personalSlotCount = personalInventory.filter(i => i.itemType !== 'backpack').length;

  const parseDamageExpression = (expression) => {
    const raw = String(expression || '').trim().replace(/\s+/g, '');
    const match = raw.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!match) return null;
    const count = Math.max(1, Number(match[1]));
    const sides = Math.max(1, Number(match[2]));
    const modifier = Number(match[3] || 0);
    return { count, sides, modifier, expression: raw };
  };

  const startShot = (item, realIdx) => {
    if (!session?.active) return siteNotify('Não podes disparar fora de uma sessão ativa.', 'error');
    if (!(session?.participantIds || []).includes(characterData?.id)) return siteNotify('Tens de entrar na sessão antes de disparar.', 'error');
    if (!item || Number(item.ammoLoaded || 0) <= 0) return siteNotify('A arma não tem munição carregada.', 'error');
    if (!item.damage) return siteNotify('Esta arma não tem dano configurado.', 'error');
    const damageSpec = parseDamageExpression(item.damage);
    if (!damageSpec) return siteNotify(`Dano inválido: ${item.damage}`, 'error');

    const participantIds = session.participantIds || [];
    const playerTargets = (characters || [])
      .filter(c => participantIds.includes(c.id))
      .map(c => ({ id: c.id, type: 'character', name: c.identity?.name || 'Jogador sem nome', vida: c.status?.vida?.current ?? 0 }));
    const npcTargets = (npcs || [])
      .filter(n => (session.npcIds || []).includes(n.id))
      .map(n => ({ id: n.id, type: 'npc', name: n.name || 'NPC', vida: n.vida ?? 0 }));

    setShootModal({ item, realIdx, damageSpec, targets: [...playerTargets, ...npcTargets], selectedTarget: 'none' });
  };

  const executeShot = () => {
    if (!shootModal) return;
    const { item, realIdx, damageSpec, targets, selectedTarget } = shootModal;
    const target = selectedTarget === 'none' ? null : targets.find(t => `${t.type}:${t.id}` === selectedTarget);
    const aimRoll = rollSingleDie(20);
    const critical = aimRoll === 20;
    const damageRolls = Array.from({ length: damageSpec.count }, () => rollSingleDie(damageSpec.sides));
    const damageResult = critical
      ? (damageSpec.count * damageSpec.sides) + damageSpec.modifier
      : damageRolls.reduce((sum, value) => sum + value, 0);

    playUiSound('shot');
    setShootModal(null);
    setRollingAnimation({
      skillName: `Pontaria • ${item.name}`,
      rolls: [aimRoll],
      result: aimRoll,
      dieType: 'D20',
      rolling: true,
      metadata: { shot: true, phase: 'aim', targetName: target?.name || 'Ninguém' }
    });

    setTimeout(() => {
      setRollingAnimation({
        skillName: `Dano • ${item.name}`,
        rolls: damageRolls,
        result: damageResult,
        dieType: damageSpec.expression,
        rolling: true,
        metadata: { shot: true, phase: 'damage', critical, targetName: target?.name || 'Ninguém' }
      });
      setTimeout(async () => {
        setRollingAnimation(prev => prev ? {
          ...prev,
          rolling: false,
          result: damageResult,
          metadata: { ...(prev.metadata || {}), critical, targetName: target?.name || 'Ninguém', aimRoll }
        } : null);
        try {
          await onUpdateCharacter?.(characterData.id, {
            shootWeaponIndex: realIdx,
            targetId: target?.id || null,
            targetType: target?.type || 'none',
            aimRoll,
            damageResult,
            damageExpression: damageSpec.expression,
            critical
          });
          if (onRollDice) {
            onRollDice(campaign.id, charData.identity.name || player.username, 'Pontaria (Disparo)', aimRoll, 'D20', {
              shot: true,
              target: target?.name || 'Ninguém',
              weapon: item.name,
              critical,
              damage: damageResult,
              damageExpression: damageSpec.expression
            });
          }
        } finally {
          setTimeout(() => setRollingAnimation(null), 3200);
        }
      }, 1700);
    }, 2200);
  };

  const rollHealingExpression = (expression) => {
    const raw = String(expression || '').trim().replace(/\s+/g, '');
    const m = raw.match(/^(\d*)d(\d+)([+-]\d+)?$/i);
    if (!m) return null;
    const count = Math.max(1, Number(m[1] || 1));
    const sides = Math.max(1, Number(m[2]));
    const modifier = Number(m[3] || 0);
    const rolls = Array.from({length: count}, () => rollSingleDie(sides));
    return { total: Math.max(0, rolls.reduce((a,b)=>a+b,0) + modifier), rolls, sides, modifier };
  };

  const showEffectRoll = (item, roll, label, changed) => {
    const parts = roll.rolls.join(' + ') + (roll.modifier ? ` ${roll.modifier>=0?'+':''}${roll.modifier}` : '');
    setRollingAnimation({ skillName: item.name, rolls: roll.rolls, result: roll.total, dieType: `${roll.rolls.length}×D${roll.sides}`, rolling: true, metadata: { effectType: item.effectType, label, changed } });
    setTimeout(() => {
      setRollingAnimation(prev => prev ? { ...prev, rolling: false, result: roll.total, metadata: { ...(prev.metadata||{}), parts, label, changed } } : null);
      setTimeout(() => setRollingAnimation(null), 2600);
    }, 1600);
  };

  const returnActiveBuff = (buff) => {
      if (!buff) return;
      const source = buff.itemData || items.find(i => i.id === buff.itemId);
      if (!source) return siteNotify('Não foi possível recuperar o item deste buff.', 'error');
      modifyCharData(p => {
        const inv = [...(p.inventory || [])];
        const stackable = source.stackable !== false && source.itemType !== 'weapon' && source.itemType !== 'backpack' && source.itemType !== 'phone';
        const existing = stackable ? inv.findIndex(i => i.id === source.id && i.stackable !== false) : -1;
        if (existing >= 0) {
          inv[existing] = { ...inv[existing], quantity: Number(inv[existing].quantity || 1) + 1 };
        } else {
          const nonBackpacks = inv.filter(i => i.itemType !== 'backpack').length;
          if (nonBackpacks >= inventoryCapacity) { siteNotify('O inventário está cheio. O buff continua ativo.', 'error'); return p; }
          inv.push({ ...source, quantity: 1, equipped: false, serialId: ensureItemSerial(source) });
        }
        const remainingBuffs = (p.activeBuffs || []).filter((b, index) => {
          if (buff.id != null && b.id != null) return b.id !== buff.id;
          return b !== buff;
        });
        return { ...p, inventory: inv, activeBuffs: remainingBuffs };
      });
      siteNotify(`${buff.name || 'Buff'} removido. O item voltou ao inventário.`, 'info');
  };
  const consumeItemAndApplyEffect = (item, sourceIndex, fromBackpack = false, backpackIndex = -1, contentIndex = -1) => {
    const effectType = item?.effectType || (item?.healDice ? 'cura' : '');
    const expression = item?.effectDice || item?.healDice || '';
    const removeOne = (p) => {
      const next = { ...p, inventory: [...(p.inventory || [])] };
      if (fromBackpack) {
        const bags = next.inventory.map((item, inventoryIndex) => ({ item, inventoryIndex })).filter(x => x.item.itemType === 'backpack' && x.item.backpackOpen);
        const entry = bags[backpackIndex]; const bag = entry?.item; if (!bag) return next;
        const real = entry.inventoryIndex; const contents = [...(bag.contents || [])]; const q = Number(contents[contentIndex]?.quantity || 1);
        if (q <= 1) contents.splice(contentIndex, 1); else contents[contentIndex] = { ...contents[contentIndex], quantity: q - 1 };
        next.inventory[real] = { ...bag, contents }; return next;
      }
      const q = Number(next.inventory[sourceIndex]?.quantity || 1); if (q <= 1) next.inventory.splice(sourceIndex, 1); else next.inventory[sourceIndex] = { ...next.inventory[sourceIndex], quantity: q - 1 }; return next;
    };
    if (effectType === 'buff') {
      const target = normalizeBuffTarget(item.effectTarget || ''); const value = Number(item.effectValue) || 0;
      if (!target || !value) return siteNotify('Este buff não tem alvo/valor configurado.', 'error');
      modifyCharData(p => {
        const buffs = [...(p.activeBuffs || []), { id: crypto.randomUUID(), itemId: item.id || '', itemData: { ...item, quantity: 1, equipped: false, serialId: ensureItemSerial(item) }, name: item.name || 'Buff', target, value, createdAt: Date.now() }];
        return removeOne({ ...p, activeBuffs: buffs });
      });
      siteNotify(`${item.name}: ${value > 0 ? '+' : ''}${value} ${target === 'defense' ? 'Defesa' : target.replace(/^skill:/,'')}. Buff ativo.`, 'info');
      return;
    }

    if (effectType && expression) {
      const roll = rollHealingExpression(expression); if (!roll) return siteNotify(`Dado inválido: ${expression}`, 'error');
      const currentVida = Number(charData.status?.vida?.current) || 0; const maxVida = Number(charData.status?.vida?.max) || currentVida; const currentSanidade = Number(charData.status?.sanidade?.current) || 0; const maxSanidade = Number(charData.status?.sanidade?.max) || currentSanidade;
      let changed = 0, label = '';
      modifyCharData(p => {
        const next = { ...p, status: { ...p.status } };
        if (effectType === 'cura') { changed = Math.min(roll.total, Math.max(0, maxVida-currentVida)); next.status.vida = { ...next.status.vida, current: Math.min(maxVida,currentVida+roll.total) }; label='Vida recuperada'; }
        else if (effectType === 'dano') { changed = Math.min(roll.total,currentVida); next.status.vida = { ...next.status.vida, current: Math.max(0,currentVida-roll.total) }; label='Dano causado'; }
        else if (effectType === 'sanidade') { changed = Math.min(roll.total,Math.max(0,maxSanidade-currentSanidade)); next.status.sanidade = { ...next.status.sanidade, current: Math.min(maxSanidade,currentSanidade+roll.total) }; label='Sanidade recuperada'; }
        return removeOne(next);
      });
      showEffectRoll(item, roll, label, changed); return;
    }
    const text = item?.useEffect || item?.buff || 'Item utilizado.'; modifyCharData(p => removeOne(p)); siteNotify(text,'info');
  };

  const moveItemToBackpack = (inventoryIndex) => modifyCharData(p => {
    const inv = [...(p.inventory || [])];
    const backpacks = inv.map((item, inventoryIndex) => ({ item, inventoryIndex })).filter(x => x.item.itemType === 'backpack' && x.item.backpackOpen);
    if (!backpacks.length) return p;
    const source = inv[inventoryIndex]; if (!source || source.itemType === 'backpack') return p;
    const total = backpacks.reduce((n,b) => n + (b.item.contents || []).length, 0);
    const capacity = backpacks.reduce((n,b) => n + (Number(b.item.backpackSlots) || 0), 0);
    const stackable = source.stackable !== false && source.itemType !== 'weapon' && source.itemType !== 'backpack';
    const targetEntry = backpacks[selectedBackpackIndex] || backpacks[0];
    const targetInventoryIndex = targetEntry.inventoryIndex;
    const targetBag = targetEntry.item;
    const existingBagContent = stackable ? (targetBag.contents || []).findIndex(x => x.name === source.name && x.itemType === source.itemType && x.stackable !== false) : -1;
    if (existingBagContent < 0 && total >= capacity) return p;
    const nextInv = [...inv];
    const sourceQty = Number(source.quantity || 1);
    if (sourceQty <= 1) nextInv.splice(inventoryIndex, 1);
    else nextInv[inventoryIndex] = { ...source, quantity: sourceQty - 1 };
    const adjustedBagIndex = inventoryIndex < targetInventoryIndex && sourceQty <= 1 ? targetInventoryIndex - 1 : targetInventoryIndex;
    const bag = nextInv[adjustedBagIndex];
    const contents = [...(bag.contents || [])];
    if (stackable && existingBagContent >= 0) contents[existingBagContent] = { ...contents[existingBagContent], quantity: Number(contents[existingBagContent].quantity || 1) + 1 };
    else contents.push({ ...source, quantity: 1, serialId: createItemSerial() });
    nextInv[adjustedBagIndex] = { ...bag, contents };
    return { ...p, inventory: nextInv };
  });

  const moveItemFromBackpack = (backpackIndex, contentIndex) => modifyCharData(p => {
    const inv = [...(p.inventory || [])];
    const backpacks = inv.map((item, inventoryIndex) => ({ item, inventoryIndex })).filter(x => x.item.itemType === 'backpack' && x.item.backpackOpen);
    const entry = backpacks[backpackIndex]; const b = entry?.item; if (!b) return p;
    const item = (b.contents || [])[contentIndex]; if (!item) return p;
    const stackable = item.stackable !== false && item.itemType !== 'weapon' && item.itemType !== 'backpack';
    const existingPersonal = stackable ? inv.findIndex(i => i.itemType !== 'backpack' && i.name === item.name && i.itemType === item.itemType && i.stackable !== false) : -1;
    if (existingPersonal < 0 && inv.filter(i => i.itemType !== 'backpack').length >= inventoryCapacity) return p;
    const real = entry.inventoryIndex;
    const contents = [...(b.contents || [])]; const itemQty = Number(item.quantity || 1);
    if (itemQty <= 1) contents.splice(contentIndex, 1); else contents[contentIndex] = { ...item, quantity: itemQty - 1 };
    inv[real] = { ...b, contents };
    if (existingPersonal >= 0) inv[existingPersonal] = { ...inv[existingPersonal], quantity: Number(inv[existingPersonal].quantity || 1) + 1 };
    else inv.push({ ...item, quantity: 1, serialId: createItemSerial() });
    return { ...p, inventory: inv };
  });

  const updateNested = (c, f, v) => modifyCharData(p => ({ ...p, [c]: { ...p[c], [f]: v } }));

  const updateStatusDirect = (t, f, val) => {
    if (t === 'defense') {
      modifyCharData(p => ({ ...p, status: { ...p.status, defense: val === '' ? '' : val } }));
      return;
    }
    if (val === '') {
      modifyCharData(p => ({ ...p, status: { ...p.status, [t]: { ...p.status[t], [f]: '' } } }));
      return;
    }
    const num = Number(val) || 0;
    modifyCharData(p => ({ ...p, status: { ...p.status, [t]: { ...p.status[t], [f]: num } } }));
  };

  const adjustStatus = (t, f, amount) => {
    modifyCharData(p => {
      const currentVal = Number(p.status[t][f]) || 0;
      const newVal = Math.max(0, currentVal + amount);
      return {
        ...p,
        status: {
          ...p.status,
          [t]: { ...p.status[t], [f]: newVal }
        }
      };
    });
  };

  const toggleCondition = (cond) => {
    modifyCharData(p => {
      const currentConds = p.conditions || [];
      const updated = currentConds.includes(cond) ? currentConds.filter(c => c !== cond) : [...currentConds, cond];
      return { ...p, conditions: updated };
    });
  };

  const toggleSkill = (s) => modifyCharData(p => ({ ...p, skills: { ...p.skills, [s]: { ...p.skills[s], training: nextTraining[p.skills[s].training] } } }));
  
  const updateSkillBonus = (s, val) => {
    if (val === '' || val === '-' || val === '+') {
      modifyCharData(p => ({ ...p, skills: { ...p.skills, [s]: { ...p.skills[s], bonus: val } } }));
      return;
    }
    const num = Number(val) || 0;
    modifyCharData(p => ({ ...p, skills: { ...p.skills, [s]: { ...p.skills[s], bonus: num } } }));
  };

  const handleAttributeChange = (attr, val) => {
    if (val === '') {
      modifyCharData(p => ({ ...p, attributes: { ...p.attributes, [attr]: '' } }));
      return;
    }
    const num = Math.min(5, Math.max(1, Number(val)));
    if (!Number.isFinite(num)) return;
    modifyCharData(p => {
      const newAttrs = { ...p.attributes, [attr]: num };
      const newVig = Number(newAttrs.VIG) || 1;
      const newMaxVida = 8 + newVig;
      return {
        ...p,
        attributes: newAttrs,
        status: {
          ...p.status,
          vida: {
            current: Math.min(p.status.vida.current, newMaxVida),
            max: newMaxVida
          }
        }
      };
    });
  };

  const handleNexChange = (val) => {
    if (val === '' || /^\d+$/.test(val)) {
      modifyCharData(p => ({
        ...p,
        identity: { ...p.identity, nex: val === '' ? '' : Number(val) }
      }));
    }
  };

  const handleNexBlur = (val) => {
    const num = Number(val);
    const clamped = (val === '' || isNaN(num)) ? 5 : Math.max(5, Math.min(100, num));
    modifyCharData(p => {
      if (p.identity.nex === clamped) return p;
      return {
        ...p,
        identity: { ...p.identity, nex: clamped }
      };
    });
  };

  const handleOpenSkillRoll = (skillName) => {
    const attrs = skillDefinitions[skillName] || ['INT'];
    setActiveSkillModal({ skillName, attrs });
    setSelectedAttrForSkill(attrs[0]);
    setSkillModifier('0');
    setSkillAdvantages(0);
    setSkillDisadvantages(0);
  };

  const revealRoll = ({ skillName, rolls, result, dieType = 'D20', logName = skillName, metadata = {} }) => {
    setRollingAnimation({ skillName, rolls, result, dieType, rolling: true, metadata });
    setTimeout(() => {
      setRollingAnimation(prev => prev ? { ...prev, rolling: false } : null);
      onRollDice(campaign.id, charData.identity.name || player.username, logName, result, dieType, metadata);
      setTimeout(() => setRollingAnimation(null), 3000);
    }, 2200);
  };

  const executeSkillRoll = (skillName, attrKey, modValInput, advantages = 0, disadvantages = 0) => {
    const modVal = modValInput === '' || modValInput === '-' || modValInput === '+' ? 0 : Number(modValInput) || 0;
    const attrVal = Number(charData.attributes[attrKey]) || 1;
    const netAdvantage = Number(advantages) - Number(disadvantages);
    const skillObj = charData.skills[skillName] || { bonus: 0, training: 'DT' };
    const trainBonus = trainingMultiplier[skillObj.training] || 0;
    const skillBonusNum = Number(skillObj.bonus) || 0;
    const buffBonus = getBuffBonus(`skill:${skillName}`);
    const totalBonus = skillBonusNum + trainBonus + buffBonus + modVal;
    const { result, rolls } = rollDiceAdvanced(attrVal, netAdvantage);
    revealRoll({
      skillName,
      rolls,
      result: result + totalBonus,
      dieType: 'D20',
      metadata: { attribute: attrKey, advantages: Number(advantages) || 0, disadvantages: Number(disadvantages) || 0, modifier: modVal, buffBonus }
    });
    setActiveSkillModal(null);
  };

  const executeSpecialTest = (testName) => {
    const result = rollSingleDie(20);
    revealRoll({ skillName: testName, rolls: [result], result, dieType: 'D20', logName: testName });
  };

  const executeCustomDiceRoll = (sides, count) => {
    const safeCount = Math.max(1, Math.min(100, Number(count) || 1));
    const rolls = Array.from({ length: safeCount }, () => rollSingleDie(Number(sides)));
    const result = Math.max(...rolls);
    revealRoll({ skillName: `${safeCount}×D${sides}`, rolls, result, dieType: `${safeCount}×D${sides}`, logName: `${safeCount}×D${sides}`, metadata: { diceCount: safeCount, sides: Number(sides), rule: 'maior resultado' } });
  };

  const activeStore = stores.find(s => s.id === campaign.activeStoreId);
  const activeStoreCategories = categories.filter(c => items.some(i => i.storeId === campaign.activeStoreId && i.categoryId === c.id));

  const vCur = Number(charData.status.vida.current) || 0; 
  const vMax = Number(charData.status.vida.max) || 1;
  const sCur = Number(charData.status.sanidade.current) || 0; 
  const sMax = Number(charData.status.sanidade.max) || 1;
  const vPct = Math.min(100, Math.max(0, (vCur / vMax) * 100));
  const sPct = Math.min(100, Math.max(0, (sCur / sMax) * 100));

  const nexVal = Number(charData.identity.nex) || 5;
  const totalAttrSum = Object.values(charData.attributes).reduce((acc, val) => acc + (Number(val) || 1), 0);
  const maxAllowedPoints = nexVal <= 25 ? 5 + 5 : 5 + 6;
  const remainingPoints = maxAllowedPoints - totalAttrSum;

  const possibleConditions = ['Ferido', 'Louco', 'Morrendo', 'Combate'];

  // Determine active portrait based on conditions
  const isFerido = (charData.conditions || []).includes('Ferido');
  const isLouco = (charData.conditions || []).includes('Louco');
  const isMorrendo = (charData.conditions || []).includes('Morrendo');

  let activePortraitUrl = portraits.normal;
  if (isMorrendo && portraits.dying) {
    activePortraitUrl = portraits.dying;
  } else if (isFerido && isLouco && portraits.injuredInsane) {
    activePortraitUrl = portraits.injuredInsane;
  } else if (isFerido && portraits.injured) {
    activePortraitUrl = portraits.injured;
  } else if (isLouco && portraits.insane) {
    activePortraitUrl = portraits.insane;
  }

  // Check unread messages per contact
  const unreadByContact = {};
  Object.keys(charData.messages || {}).forEach(phone => {
    const msgs = charData.messages[phone] || [];
    const lastMsg = msgs[msgs.length - 1];
    const lastReadAt = charData.messageReadAt?.[phone] || 0;
    if (activeChatContactPhone !== phone && lastMsg && lastMsg.sender !== (charData.identity.name || player.username) && Number(lastMsg.timestamp || 0) > Number(lastReadAt)) {
      unreadByContact[phone] = true;
    }
  });
  const hasUnreadMessages = Object.keys(unreadByContact).length > 0;
  const hasPhoneItem = hasPhoneItemEarly;

  const addContact = (e) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    const contactObj = { 
      name: newContactName.trim(), 
      phone: newContactPhone.trim() 
    };
    modifyCharData(p => ({ ...p, contacts: [...(p.contacts || []), contactObj] }));
    setNewContactName('');
    setNewContactPhone('');
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!chatInput.trim() && !chatMediaUrl.trim()) || !activeChatContactPhone) return;
    const phoneKey = activeChatContactPhone;
    const senderName = charData.identity.name || player.username;
    const newMsg = {
      id: crypto.randomUUID(),
      sender: senderName,
      type: chatType,
      content: chatInput,
      mediaUrl: chatMediaUrl,
      timestamp: Date.now()
    };
    const currentMsgs = charData.messages || {};
    const contactMsgs = currentMsgs[phoneKey] || [];
    const updatedMessages = {
      ...currentMsgs,
      [phoneKey]: [...contactMsgs, newMsg]
    };

    modifyCharData(p => ({
      ...p,
      messages: updatedMessages
    }));

    const targetChar = characters.find(ch => ch.phoneNum === phoneKey);
    if (targetChar) {
      const targetMsgs = targetChar.messages || {};
      const targetContactMsgs = targetMsgs[charData.phoneNum] || [];
      await uDoc('characters', targetChar.id, {
        messages: {
          ...targetMsgs,
          [charData.phoneNum]: [...targetContactMsgs, newMsg]
        }
      });
    }

    setChatInput('');
    setChatMediaUrl('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans p-2 sm:p-6 pb-32 relative w-full">
      <style>{`
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      <header className="max-w-6xl mx-auto flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-red-900/30 gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onBack} icon={ChevronRight} className="rotate-180 p-2"></Button>
          <div className="flex items-center gap-3">
            <SpinningD20 size={36} />
            <div>
              <h1 className="text-xl font-black text-zinc-100 uppercase tracking-widest">{campaign.name}</h1>
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">{isReadOnly ? 'Modo Visualização (Mestre)' : 'Ficha de Personagem'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {currentUser.isAdmin && <Button variant="secondary" onClick={onOpenAdmin}>Painel Admin</Button>}
          {!isReadOnly && (
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-zinc-900 shadow-inner">
               {saveMsg === 'A guardar...' ? <Activity className="animate-spin text-amber-500" size={14} /> : 
                saveMsg === 'Sincronizado' ? <CheckSquare className="text-green-500" size={14} /> : 
                saveMsg === 'Erro ao guardar' ? <X className="text-red-500" size={14} /> : <Save className="text-zinc-600" size={14} />}
               <span className={saveMsg === 'Sincronizado' ? 'text-green-500' : saveMsg === 'Erro ao guardar' ? 'text-red-500' : saveMsg === 'A guardar...' ? 'text-amber-500' : 'text-zinc-500'}>
                 {saveMsg || 'Auto-Save ON'}
               </span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto mb-6 flex gap-2 border-b border-zinc-900 pb-2 overflow-x-auto">
        <button onClick={() => setActivePlayerTab('sessao')} className={`px-6 py-2 uppercase font-bold tracking-widest text-xs rounded transition-colors whitespace-nowrap ${activePlayerTab === 'sessao' ? 'bg-red-950 text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}><Activity size={16} className="inline mr-2 -mt-1"/> Sessão</button>
        <button onClick={() => setActivePlayerTab('ficha')} className={`px-6 py-2 uppercase font-bold tracking-widest text-xs rounded transition-colors whitespace-nowrap ${activePlayerTab === 'ficha' ? 'bg-red-950 text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Users size={16} className="inline mr-2 -mt-1"/> Ficha
        </button>
        <button onClick={() => setActivePlayerTab('inventario')} className={`px-6 py-2 uppercase font-bold tracking-widest text-xs rounded transition-colors whitespace-nowrap ${activePlayerTab === 'inventario' ? 'bg-red-950 text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Package size={16} className="inline mr-2 -mt-1"/> Inventário
        </button>
        <button onClick={() => setActivePlayerTab('mundo')} className={`px-6 py-2 uppercase font-bold tracking-widest text-xs rounded transition-colors whitespace-nowrap ${activePlayerTab === 'mundo' ? 'bg-red-950 text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Map size={16} className="inline mr-2 -mt-1"/> Mundo {activeStore && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block animate-pulse"></span>}
        </button>
        {hasPhoneItem && <button onClick={() => setActivePlayerTab('telemovel')} className={`px-6 py-2 uppercase font-bold tracking-widest text-xs rounded transition-colors whitespace-nowrap relative ${activePlayerTab === 'telemovel' ? 'bg-red-950 text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Smartphone size={16} className="inline mr-2 -mt-1"/> Telemóvel {hasUnreadMessages && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>}
        </button>}
      </div>

      <main className="max-w-6xl mx-auto space-y-6">
        {activePlayerTab === 'sessao' ? (
          <SessionMenu campaign={campaign} characters={characters} npcs={npcs} session={session} isGM={false} currentCharacterId={characterData?.id} onJoinSession={onJoinSession} onLeaveSession={onLeaveSession} onStartSession={onStartSession} onEndSession={onEndSession} onToggleNPC={onToggleSessionNPC} onUpdateCharacter={onUpdateCharacter} />
        ) : activePlayerTab === 'ficha' ? (
          <>
            <GlowingCard className="p-4 sm:p-6 border-zinc-800">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-3 shrink-0 mx-auto md:mx-0">
                  <div className="w-32 h-32 rounded-full border-4 border-red-900/50 overflow-hidden relative bg-black flex items-center justify-center shadow-[0_0_20px_rgba(153,27,27,0.3)]">
                    {activePortraitUrl ? (
                      <img src={activePortraitUrl} alt="Portrait" className="w-full h-full object-cover" onError={(e)=>{e.target.style.display='none'}} />
                    ) : (
                      <Users size={40} className="text-zinc-700" />
                    )}
                    <div className="absolute bottom-0 w-full bg-black/70 text-center text-[9px] font-bold text-red-400 uppercase py-0.5 tracking-widest">
                       {isMorrendo ? 'Morrendo' : isFerido && isLouco ? 'Ferido & Louco' : isFerido ? 'Ferido' : isLouco ? 'Louco' : 'Normal'}
                    </div>
                  </div>
                  {!isReadOnly && (
                    <Button variant="secondary" className="text-[10px] py-1 px-3 h-auto w-full" onClick={() => setIsEditingPortraits(true)}>Editar Retratos</Button>
                  )}
                </div>

                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-12 border-b border-zinc-800 pb-2 mb-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-red-600 mb-1">Nome do Personagem</label>
                    <input readOnly={isReadOnly} type="text" value={charData.identity.name} onChange={e => updateNested('identity', 'name', e.target.value)} className="w-full bg-transparent text-2xl sm:text-4xl font-black text-zinc-100 py-1 outline-none uppercase placeholder-zinc-800" placeholder="INSERIR NOME..." />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Profissão</label>
                    <input readOnly={isReadOnly} type="text" value={charData.identity.profession || ''} onChange={e => updateNested('identity', 'profession', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-zinc-200 outline-none" />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Classe</label>
                    <select disabled={isReadOnly} value={charData.identity.class} onChange={e => updateNested('identity', 'class', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-zinc-200 outline-none">
                      {(campaign.classes || ['Mundano']).map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-4 bg-red-950/20 p-2 rounded border border-red-900/30 flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-red-400">NEX (Exposição)</label>
                    <div>
                      <input 
                        readOnly={isReadOnly} 
                        type="text"
                        inputMode="numeric"
                        value={charData.identity.nex} 
                        onChange={e => handleNexChange(e.target.value)} 
                        onBlur={e => handleNexBlur(e.target.value)}
                        className="w-16 bg-transparent text-xl text-red-500 font-black outline-none text-right" 
                      />
                      <span className="text-red-700 font-black">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlowingCard>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-6">
                {/* Pentagram Atributos */}
                <GlowingCard className="p-6">
                  <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                    <h3 className="text-sm font-black text-red-500 uppercase tracking-widest">Atributos (Pentagrama)</h3>
                    {!isReadOnly && <span className={`text-xs font-bold px-2 py-0.5 rounded ${remainingPoints < 0 ? 'bg-red-900 text-red-200' : 'bg-zinc-900 text-zinc-400'}`}>Pontos: {remainingPoints}</span>}
                  </div>
                  
                  <div className="relative w-64 h-64 mx-auto my-4 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full text-red-900/40 pointer-events-none" viewBox="0 0 200 200">
                      <polygon points="100,15 190,75 155,175 45,175 10,75" fill="none" stroke="currentColor" strokeWidth="2" />
                      <line x1="100" y1="15" x2="155" y2="175" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="100" y1="15" x2="45" y2="175" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="190" y1="75" x2="45" y2="175" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="190" y1="75" x2="10" y2="75" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="155" y1="175" x2="10" y2="75" stroke="currentColor" strokeWidth="1.5" />
                    </svg>

                    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-red-400 uppercase">VIG</span>
                      <input readOnly={isReadOnly} type="number" min="1" max="5" value={charData.attributes.VIG} onChange={e => handleAttributeChange('VIG', e.target.value)} className="w-10 h-10 bg-black text-center font-black text-base text-white rounded-full border border-red-900 outline-none shadow-[0_0_10px_rgba(220,38,38,0.2)]" />
                    </div>
                    <div className="absolute top-16 right-4 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-red-400 uppercase">AGI</span>
                      <input readOnly={isReadOnly} type="number" min="1" max="5" value={charData.attributes.AGI} onChange={e => handleAttributeChange('AGI', e.target.value)} className="w-10 h-10 bg-black text-center font-black text-base text-white rounded-full border border-red-900 outline-none shadow-[0_0_10px_rgba(220,38,38,0.2)]" />
                    </div>
                    <div className="absolute bottom-6 right-8 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-red-400 uppercase">PRE</span>
                      <input readOnly={isReadOnly} type="number" min="1" max="5" value={charData.attributes.PRE} onChange={e => handleAttributeChange('PRE', e.target.value)} className="w-10 h-10 bg-black text-center font-black text-base text-white rounded-full border border-red-900 outline-none shadow-[0_0_10px_rgba(220,38,38,0.2)]" />
                    </div>
                    <div className="absolute bottom-6 left-8 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-red-400 uppercase">INT</span>
                      <input readOnly={isReadOnly} type="number" min="1" max="5" value={charData.attributes.INT} onChange={e => handleAttributeChange('INT', e.target.value)} className="w-10 h-10 bg-black text-center font-black text-base text-white rounded-full border border-red-900 outline-none shadow-[0_0_10px_rgba(220,38,38,0.2)]" />
                    </div>
                    <div className="absolute top-16 left-4 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-red-400 uppercase">FOR</span>
                      <input readOnly={isReadOnly} type="number" min="1" max="5" value={charData.attributes.FOR} onChange={e => handleAttributeChange('FOR', e.target.value)} className="w-10 h-10 bg-black text-center font-black text-base text-white rounded-full border border-red-900 outline-none shadow-[0_0_10px_rgba(220,38,38,0.2)]" />
                    </div>
                  </div>
                </GlowingCard>
              </div>

              {/* Right: Vital Status & Conditions */}
              <div className="lg:col-span-6 space-y-6">
                <GlowingCard className="p-6">
                  <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                    <h3 className="text-sm font-black text-red-500 uppercase tracking-widest">Estado Vital</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-red-400 uppercase">Vida ({vCur}/{vMax})</span>
                        <div className="flex items-center gap-1">
                          {!isReadOnly && <button onClick={() => adjustStatus('vida', 'current', -1)} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-xs font-bold rounded hover:border-red-600">-</button>}
                          <input readOnly={isReadOnly} type="number" value={charData.status.vida.current} onChange={e => updateStatusDirect('vida', 'current', e.target.value)} className="w-12 bg-black text-center text-sm font-black text-white rounded border border-zinc-800" />
                          <span className="text-zinc-600">/</span>
                          <input readOnly={isReadOnly} type="number" value={charData.status.vida.max} onChange={e => updateStatusDirect('vida', 'max', e.target.value)} className="w-12 bg-black text-center text-sm font-black text-white rounded border border-zinc-800" />
                          {!isReadOnly && <button onClick={() => adjustStatus('vida', 'current', 1)} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-xs font-bold rounded hover:border-red-600">+</button>}
                        </div>
                      </div>
                      <div className="w-full bg-black border border-zinc-800 h-3 rounded-full overflow-hidden">
                        <div className="bg-red-600 h-full transition-all duration-300" style={{width: `${vPct}%`}}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-blue-400 uppercase">Sanidade ({sCur}/{sMax})</span>
                        <div className="flex items-center gap-1">
                          {!isReadOnly && <button onClick={() => adjustStatus('sanidade', 'current', -1)} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-xs font-bold rounded hover:border-blue-600">-</button>}
                          <input readOnly={isReadOnly} type="number" value={charData.status.sanidade.current} onChange={e => updateStatusDirect('sanidade', 'current', e.target.value)} className="w-12 bg-black text-center text-sm font-black text-white rounded border border-zinc-800" />
                          <span className="text-zinc-600">/</span>
                          <input readOnly={isReadOnly} type="number" value={charData.status.sanidade.max} onChange={e => updateStatusDirect('sanidade', 'max', e.target.value)} className="w-12 bg-black text-center text-sm font-black text-white rounded border border-zinc-800" />
                          {!isReadOnly && <button onClick={() => adjustStatus('sanidade', 'current', 1)} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-xs font-bold rounded hover:border-blue-600">+</button>}
                        </div>
                      </div>
                      <div className="w-full bg-black border border-zinc-800 h-3 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all duration-300" style={{width: `${sPct}%`}}></div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-zinc-900">
                      <span className="text-xs font-bold text-zinc-400 uppercase">Defesa</span>
                      <div className="flex items-center gap-2"><input readOnly={isReadOnly} type="text" inputMode="numeric" value={charData.status?.defense ?? ''} onChange={e => updateStatusDirect('defense', '', e.target.value.replace(/[^0-9]/g, ''))} className="w-20 bg-black text-center text-sm font-black text-white rounded border border-zinc-800 py-1 outline-none focus:border-red-600" /><span className="text-xs font-black text-green-400">Atual: {(Number(charData.status?.defense)||0)+getBuffBonus('defense')}</span></div>
                    </div>
                  </div>
                </GlowingCard>

                <GlowingCard className="p-6">
                  <h3 className="text-sm font-black text-red-500 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-3">Condições & Estados (Multi-seleção)</h3>
                  <div className="flex flex-wrap gap-2">
                    {possibleConditions.map(cond => {
                      const isActive = (charData.conditions || []).includes(cond);
                      return (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => toggleCondition(cond)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                            isActive 
                              ? 'bg-red-950 text-red-200 border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.4)]' 
                              : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {cond} {isActive && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </GlowingCard>
              </div>

              {/* Testes personalizados + dados */}
              <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlowingCard className="p-6">
                  <h3 className="text-sm font-black text-red-500 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4">Testes Personalizados</h3>
                  <p className="text-xs text-zinc-500 mb-4">Testes sem atributo. O resultado só é revelado no fim da rolagem.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => executeSpecialTest('Teste de Sorte')} className="w-full" icon={Dices}>Teste de Sorte</Button>
                    <Button onClick={() => executeSpecialTest('Estado de sanidade')} className="w-full" icon={Brain}>Estado de sanidade</Button>
                  </div>
                </GlowingCard>
                <GlowingCard className="p-6">
                  <h3 className="text-sm font-black text-red-500 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4">Dados Personalizados</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div><label className="text-[10px] uppercase font-bold text-zinc-500">Tipo de dado</label><select value={customDieSides} onChange={e => setCustomDieSides(Number(e.target.value))} className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white">{diceOptions.map(s => <option key={s} value={s}>D{s}</option>)}</select></div>
                    <div><label className="text-[10px] uppercase font-bold text-zinc-500">Quantidade</label><input type="number" min="1" max="100" value={customDieCount} onChange={e => setCustomDieCount(e.target.value === '' ? '' : Math.max(1, Math.min(100, Number(e.target.value) || 1)))} className="mt-1 w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white" /></div>
                  </div>
                  <Button onClick={() => executeCustomDiceRoll(customDieSides, customDieCount)} className="w-full" icon={Dices}>Rolar {customDieCount}×D{customDieSides}</Button>
                </GlowingCard>
              </div>

              {/* Bottom full width sections: Skills across both columns */}
              <div className="lg:col-span-12 space-y-6">
                <GlowingCard className="p-6">
                  <h3 className="text-sm font-black text-red-500 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4">Perícias Operacionais</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {Object.keys(skillDefinitions).map(skillName => {
                      const skill = charData.skills[skillName] || { bonus: 0, training: 'DT' };
                      return (
                        <div key={skillName} className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 flex items-center justify-between gap-2">
                          <button onClick={() => handleOpenSkillRoll(skillName)} className="flex-1 text-left font-bold text-xs text-zinc-200 uppercase hover:text-red-400 transition-colors truncate">
                            {skillName}
                          </button>
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleSkill(skillName)} className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${skill.training !== 'DT' ? 'bg-red-950 text-red-400 border border-red-900' : 'bg-zinc-800 text-zinc-500'}`}>
                              {skill.training}
                            </button>
                            <input readOnly={isReadOnly} type="number" value={skill.bonus} onChange={e => updateSkillBonus(skillName, e.target.value)} className="w-10 bg-black text-center text-xs font-bold text-white rounded border border-zinc-800 py-0.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </GlowingCard>
              </div>
            </div>

            {(charData.activeBuffs || []).length > 0 && <GlowingCard className="p-4 border-amber-900/50"><h3 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-3">Buffs ativos</h3><div className="flex flex-wrap gap-2">{(charData.activeBuffs||[]).map(b=><div key={b.id} className="px-3 py-2 rounded-lg bg-amber-950/30 border border-amber-900/50 text-xs text-amber-200 flex items-center gap-3"><div><b>{b.name}</b> • {normalizeBuffTarget(b.target)==='defense'?'Defesa':normalizeBuffTarget(b.target).replace(/^skill:/,'')} {Number(b.value)>0?'+':''}{b.value}</div><button onClick={()=>returnActiveBuff(b)} className="px-2 py-1 rounded bg-red-950 text-red-300 border border-red-900 hover:bg-red-900 font-black uppercase text-[9px]">Tirar buff</button></div>)}</div></GlowingCard>}
          </>
        ) : activePlayerTab === 'inventario' ? (
          <div className="space-y-6">
            <GlowingCard className="p-6">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-4">
                <h3 className="text-lg font-black text-red-500 uppercase tracking-widest">Dinheiro em Mão</h3>
              </div>
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-zinc-400">Dinheiro Físico</p>
                  <p className="text-2xl font-black text-white font-mono">{charData.money || 0} CR</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-950/40 border border-red-900 flex items-center justify-center text-red-400"><DollarSign size={20}/></div>
              </div>
            </GlowingCard>

            <GlowingCard className="p-6">
              <h3 className="text-lg font-black text-red-500 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4">Inventário Pessoal</h3><p className="text-[10px] text-zinc-500 mb-3">Slots: <span className="text-zinc-200 font-bold">{personalSlotCount}/{inventoryCapacity}</span> • Cada item ocupa 1 slot.</p>
              {personalInventory.length === 0 ? <p className="text-xs text-zinc-600 italic">Inventário pessoal vazio.</p> :
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {personalInventory.map((item, idx) => {
                    const qty = Number(item.quantity ?? 1) || 1;
                    const realIdx = (charData.inventory || []).findIndex(x => x === item);
                    const isWeapon = item.itemType === 'weapon' || !!item.weapon;
                    const equipped = !!item.equipped;
                    const canUse = item.usable !== false;
                    return <div key={idx} className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-2">
                      <div className="flex gap-3 items-center">
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded border border-zinc-800" onError={(e)=>{e.currentTarget.style.display='none'}} /> : <div className="w-12 h-12 bg-black rounded border border-zinc-800 flex items-center justify-center text-zinc-600"><Package size={20}/></div>}
                        <div className="flex-1"><p className="font-bold text-zinc-100 text-sm">{item.name}</p><p className="text-[10px] text-zinc-500">Qtd: {qty} {equipped && <span className="text-green-400 ml-2">EQUIPADO</span>}</p>{item.damage && <p className="text-[11px] text-red-400 font-mono">Dano: {item.damage}</p>}{getItemBuffData(item) && <p className="text-[11px] text-amber-400 font-mono">✨ Buff: {getItemBuffData(item).target === 'defense' ? 'Defesa' : getItemBuffData(item).target.replace(/^skill:/,'')} {getItemBuffData(item).value > 0 ? '+' : ''}{getItemBuffData(item).value}</p>}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => modifyCharData(p => ({ ...p, inventory: p.inventory.map((x,i)=>i===realIdx?{...x,equipped:!x.equipped}:x) }))} className="px-2 py-1 rounded bg-zinc-800 text-[10px] font-bold">{equipped?'Desequipar':'Equipar'}</button>
                        {canUse && <button onClick={() => { if(item.itemType==='backpack'){ modifyCharData(p => ({ ...p, inventory: p.inventory.map((x,i)=>i===realIdx?{...x,backpackOpen:true,lastUsedAt:Date.now()}:x) })); } else { consumeItemAndApplyEffect(item, realIdx); } }} className="px-2 py-1 rounded bg-blue-950 text-blue-300 text-[10px] font-bold">{item.itemType==='backpack' ? (item.backpackOpen ? 'Abrir mochila' : 'Usar mochila') : 'Usar'}</button>}
                        <button onClick={() => { if(qty<=1) modifyCharData(p=>({...p,inventory:p.inventory.filter((_,i)=>i!==realIdx)})); else modifyCharData(p=>({...p,inventory:p.inventory.map((x,i)=>i===realIdx?{...x,quantity:qty-1}:x)})); }} className="px-2 py-1 rounded bg-red-950 text-red-300 text-[10px] font-bold">Remover</button>{item.itemType==='ammo_box' && <button onClick={()=>modifyCharData(p=>{const inv=[...(p.inventory||[])]; const box=inv[realIdx]; const amount=Number(box.ammoPerBox||1); const existing=inv.findIndex(x=>x.itemType==='ammo' && x.ammoType===box.ammoType && !x.isAmmoBox); let next=inv.map((x,i)=>i===realIdx?{...x,quantity:Number(x.quantity||1)-1}:x).filter(x=>Number(x.quantity??1)>0); if(existing>=0){ next=next.map((x,i)=>i===existing?{...x,quantity:Number(x.quantity||1)+amount}:x); } else {next.push({...box,itemType:'ammo',isAmmoBox:false,quantity:amount,name:getAmmoName(box.ammoType),serialId:createItemSerial()});} return {...p,inventory:next};})} className="px-2 py-1 rounded bg-amber-950 text-amber-300 text-[10px] font-bold">Usar caixa (+{item.ammoPerBox||1})</button>}
                        <select value={inventoryRecipientId} onChange={e=>setInventoryRecipientId(e.target.value)} className="px-2 py-1 rounded bg-black border border-zinc-800 text-[10px] text-zinc-300"><option value="">Enviar para...</option>{characters.filter(c=>c.id!==characterData?.id && c.id.startsWith(`${campaign.id}_`)).map(c=><option key={c.id} value={c.id}>{c.identity?.name || c.id}</option>)}</select><button onClick={async ()=>{if(!inventoryRecipientId)return siteNotify('Seleciona um jogador.'); const ok=await onTransferItem(inventoryRecipientId,item,1); if(ok===false)return; modifyCharData(p=>({...p,inventory:qty<=1?p.inventory.filter((_,i)=>i!==realIdx):p.inventory.map((x,i)=>i===realIdx?{...x,quantity:qty-1}:x)})); setInventoryRecipientId('');}} className="px-2 py-1 rounded bg-purple-950 text-purple-300 text-[10px] font-bold">Transferir</button>{activeBackpacks.length>0 && item.itemType!=='backpack' && <button onClick={()=>moveItemToBackpack(realIdx)} className="px-2 py-1 rounded bg-amber-950 text-amber-300 text-[10px] font-bold">Mover para mochila</button>}
                      </div>
                      {isWeapon && <div className="bg-black/60 border border-zinc-800 rounded p-2"><div className="text-[10px] uppercase text-red-400 font-bold">Arma • Munição {getAmmoName(item.ammoType)}</div>{(item.damage || item.extremeDamage) && <div className="text-[10px] text-zinc-400">Dano: {item.damage || '—'} {item.extremeDamage ? `• Extremo: ${item.extremeDamage}` : ''}</div>}<div className="text-xs text-zinc-400">Carregador: {Number(item.ammoLoaded||0)}/{Number(item.magazineSize||0)}</div>{Number(item.ammoLoaded||0)>0 && <button onClick={() => startShot(item, realIdx)} className="mt-2 mr-2 px-2 py-1 rounded bg-zinc-900 text-zinc-200 text-[10px] font-bold">Disparar</button>}<button onClick={() => modifyCharData(p => { const weapon = p.inventory[realIdx]; if (!weapon?.ammoType) { siteNotify('Esta arma não tem um tipo de munição compatível definido.'); return p; } const cap=Number(weapon.magazineSize||0); const loaded=Number(weapon.ammoLoaded||0); const needed=Math.max(0,cap-loaded); if(needed<=0){siteNotify('O carregador já está cheio.');return p;} const idxAmmo=(p.inventory||[]).findIndex(a=>a.itemType==='ammo' && !!weapon.ammoType && a.ammoType===weapon.ammoType && Number(a.quantity||1)>0); if(idxAmmo<0){siteNotify('Não tens munição compatível.');return p;} const ammoQty=Number(p.inventory[idxAmmo].quantity||1); const use=Math.min(needed,ammoQty); const inv=p.inventory.map((x,i)=>i===idxAmmo?{...x,quantity:ammoQty-use}:i===realIdx?{...x,ammoLoaded:loaded+use}:x).filter(x=>Number(x.quantity??1)>0); return {...p,inventory:inv}; })} className="mt-2 px-2 py-1 rounded bg-red-950 text-red-300 text-[10px] font-bold">Recarregar</button></div>}
                    </div>;
                  })}
                </div>
              }
              {activeBackpacks.length > 0 && <div className="mt-5 pt-4 border-t border-zinc-800">
                <button onClick={()=>{}} className="w-full text-left px-4 py-3 rounded-t-lg bg-amber-950/30 border border-amber-900/50 text-amber-300 font-black uppercase tracking-widest text-xs">Mochila <span className="float-right text-[10px] font-normal text-zinc-500">{backpackContents.length}/{backpackCapacity} slots</span></button>
                <div className="bg-black/40 border-x border-b border-amber-900/40 rounded-b-lg p-3 space-y-3">
                  {activeBackpacks.map((entry, bi) => { const bag = entry.item; return <div key={bag.serialId || bag.instanceId || `${bag.id || bag.name}-${bi}`}  className="bg-black/50 border border-amber-900/40 rounded p-3"><div className="flex items-center justify-between mb-2"><div><p className="text-xs font-bold text-zinc-200">{bag.name} • {Number(bag.backpackSlots)||0} slots</p>{selectedBackpackIndex===bi && <span className="text-[9px] text-amber-400 uppercase font-bold">Destino selecionado</span>}</div><div className="flex gap-2"><button onClick={()=>setSelectedBackpackIndex(bi)} className={`text-[10px] px-2 py-1 rounded ${selectedBackpackIndex===bi?'bg-amber-700 text-black':'bg-zinc-900 text-amber-300'}`}>Selecionar</button><button onClick={()=>modifyCharData(p=>({...p,inventory:p.inventory.map((x,i)=>i===entry.inventoryIndex?{...x,backpackOpen:false}:x)}))} className="text-[10px] px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">Fechar</button></div></div>{(bag.contents||[]).length===0?<p className="text-[10px] text-zinc-600 italic">Mochila vazia.</p>:<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{(bag.contents||[]).map((biItem,ci)=><div key={ci} className="flex items-center justify-between bg-zinc-900 p-2 rounded border border-zinc-800"><div className="flex-1"><span className="text-xs text-zinc-200">{biItem.name} {Number(biItem.quantity||1)>1?`× ${biItem.quantity}`:''}</span>{getItemBuffData(biItem) && <p className="text-[10px] text-amber-400 font-mono">✨ Buff: {getItemBuffData(biItem).target === 'defense' ? 'Defesa' : getItemBuffData(biItem).target.replace(/^skill:/,'')} {getItemBuffData(biItem).value > 0 ? '+' : ''}{getItemBuffData(biItem).value}</p>}</div><div className="flex gap-2">{biItem.usable!==false && <button onClick={()=>consumeItemAndApplyEffect(biItem,-1,true,bi,ci)} className="text-[10px] px-2 py-1 rounded bg-blue-950 text-blue-300">Usar</button>}<button onClick={()=>moveItemFromBackpack(bi,ci)} className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-300">Mover para inventário</button></div></div>)}</div>}</div>; })}
                </div>
              </div>}
            </GlowingCard>
          </div>
        ) : activePlayerTab === 'mundo' ? (
          <div className="space-y-6">
            {activeNegotiationItem && (
              <GlowingCard className="p-6 border-red-800/70">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold">Negociação</p>
                    <h3 className="text-xl font-black text-white uppercase">{activeNegotiationItem.name}</h3>
                  </div>
                  <Button variant="ghost" onClick={() => setActiveNegotiationItem(null)}>Voltar</Button>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    {activeNegotiationItem.imageUrl ? <img src={activeNegotiationItem.imageUrl} alt={activeNegotiationItem.name} className="w-full max-h-64 object-cover rounded-xl border border-zinc-800" /> : <div className="h-48 bg-black rounded-xl border border-zinc-800 flex items-center justify-center text-zinc-700"><Package size={48}/></div>}
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                      <p className="text-xs text-zinc-500 uppercase font-bold">Preço pedido</p>
                      <p className="text-2xl font-black text-red-400 font-mono">{Number(activeNegotiationItem.price) || 0} CR / unidade</p>
                      <p className="text-xs text-zinc-500 mt-1">Escolhe a quantidade que queres comprar.</p>
                      {activeNegotiationItem.description && <p className="text-sm text-zinc-400 mt-3">{activeNegotiationItem.description}</p>}
                    </div>
                  </div>
                  <div className="bg-black/60 p-5 rounded-xl border border-zinc-800 space-y-4">
                    <h4 className="font-black text-zinc-200 uppercase tracking-widest">Fazer proposta</h4>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Quantidade</label>
                      <input type="number" min="1" step="1" value={negotiationQuantity} onChange={e => setNegotiationQuantity(e.target.value.replace(/[^0-9]/g, ''))} className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-white font-mono text-lg outline-none focus:border-red-600" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Preço que ofereces por unidade (CR)</label>
                      <input type="number" min="0" value={negotiationPrice} onChange={e => setNegotiationPrice(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-white font-mono text-lg outline-none focus:border-red-600" />
                      <p className="text-xs text-zinc-500 mt-1">Total: <span className="text-red-400 font-bold">{(Math.max(0, Number(negotiationQuantity)||0) * Math.max(0, Number(negotiationPrice)||0))} CR</span></p>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Mensagem para o Mestre (opcional)</label>
                      <textarea value={negotiationMessage} onChange={e => setNegotiationMessage(e.target.value)} rows={5} placeholder="Ex.: Faço por 80 CR?" className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-white text-sm outline-none focus:border-red-600 resize-none" />
                    </div>
                    <Button className="w-full" onClick={async () => {
                      const quantity = Math.max(1, Math.floor(Number(negotiationQuantity) || 0));
                      const unitOffer = Number(negotiationPrice);
                      const offer = quantity * unitOffer;
                      if (!Number.isFinite(unitOffer) || unitOffer < 0) return siteNotify('Indica um preço válido por unidade.');
                      if (quantity < 1) return siteNotify('Indica uma quantidade válida.');
                      if ((Number(charData.money || 0) + Number(charData.bankMoney || 0)) < offer) return siteNotify('Não tens dinheiro suficiente entre mão e banco para fazer esta proposta.');
                      await onCreateNegotiation(campaign.id, player.username, charData.identity.name || player.username, { ...activeNegotiationItem, quantity, unitPrice: unitOffer, proposedPrice: offer, negotiationMessage });
                      setActiveNegotiationItem(null);
                      setNegotiationPrice('');
                      setNegotiationQuantity('1');
                      setNegotiationMessage('');
                      siteNotify('Proposta enviada ao Mestre.');
                    }}>Enviar Proposta</Button>
                  </div>
                </div>
              </GlowingCard>
            )}

            {playerNegotiations.length > 0 && <GlowingCard className="p-6 border-purple-900/60">
              <h3 className="text-lg font-black text-purple-400 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4">Negociações</h3>
              <div className="space-y-3">{playerNegotiations.map(neg => <div key={neg.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <p className="font-bold text-white">{neg.itemName}</p><p className="text-xs text-zinc-400">Preço pedido: {Number(neg.listedPrice)||0} CR • Oferta atual: <span className="text-green-400">{Number(neg.proposedPrice)||0} CR</span></p>
                {neg.negotiationMessage && <p className="text-xs text-zinc-500 italic mt-1">“{neg.negotiationMessage}”</p>}
                {neg.lastOfferBy === 'gm' ? <div className="flex flex-wrap gap-2 mt-3"><Button onClick={()=>onResolveNegotiation?.(neg.id,'approved')} className="text-xs">Aceitar</Button><Button variant="secondary" onClick={()=>onResolveNegotiation?.(neg.id,'rejected')} className="text-xs">Recusar</Button><Button variant="secondary" onClick={()=>setCounterNegotiation({id:neg.id,price:String(neg.proposedPrice||0),message:''})} className="text-xs">Contra-proposta</Button></div> : <p className="text-[10px] text-zinc-600 uppercase mt-3">A aguardar resposta do Mestre</p>}
                {counterNegotiation?.id === neg.id && <div className="mt-3 grid gap-2"><input type="number" min="0" value={counterNegotiation.price} onChange={e=>setCounterNegotiation(x=>({...x,price:e.target.value}))} className="bg-black border border-zinc-700 rounded p-2 text-xs text-white"/><input value={counterNegotiation.message} onChange={e=>setCounterNegotiation(x=>({...x,message:e.target.value}))} placeholder="Mensagem" className="bg-black border border-zinc-700 rounded p-2 text-xs text-white"/><div className="flex gap-2"><Button className="text-xs" onClick={async()=>{const v=Number(counterNegotiation.price); if(!Number.isFinite(v)||v<0)return siteNotify('Preço inválido.'); await onCounterNegotiation?.(neg.id,v,counterNegotiation.message,'player'); setCounterNegotiation(null);}}>Enviar contra-proposta</Button><Button variant="ghost" className="text-xs" onClick={()=>setCounterNegotiation(null)}>Cancelar</Button></div></div>}
              </div>)}</div>
            </GlowingCard>}

            <GlowingCard className="p-6">
              <h3 className="text-lg font-black text-green-500 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4">Banco</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                  <p className="text-xs font-bold uppercase text-zinc-400">Saldo no Banco</p>
                  <p className="text-2xl font-black text-green-400 font-mono">{charData.bankMoney || 0} CR</p>
                </div>
                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                  <p className="text-xs font-bold uppercase text-zinc-400">Saldo em Mão</p>
                  <p className="text-2xl font-black text-white font-mono">{charData.money || 0} CR</p>
                </div>
              </div>

              {campaign.activeBank ? (
                <div className="p-4 bg-black/60 rounded-xl border border-zinc-800 space-y-3">
                  <p className="text-xs font-bold uppercase text-zinc-300">Transferir entre Mão e Banco</p>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Valor CR..." value={transferAmount} onChange={e => setTransferAmount(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded p-2 text-white text-xs outline-none" />
                    <Button variant="secondary" onClick={() => {
                      const amt = Number(transferAmount) || 0;
                      if (amt <= 0 || (charData.money || 0) < amt) return siteNotify('Valor inválido ou insuficiente em mão.');
                      modifyCharData(p => ({ ...p, money: (p.money || 0) - amt, bankMoney: (p.bankMoney || 0) + amt }));
                      setTransferAmount('');
                    }}>Depositar no Banco</Button>
                    <Button variant="secondary" onClick={() => {
                      const amt = Number(transferAmount) || 0;
                      if (amt <= 0 || (charData.bankMoney || 0) < amt) return siteNotify('Valor inválido ou insuficiente no banco.');
                      modifyCharData(p => ({ ...p, bankMoney: (p.bankMoney || 0) - amt, money: (p.money || 0) + amt }));
                      setTransferAmount('');
                    }}>Levantar para Mão</Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-black/60 rounded-xl border border-zinc-800 text-center">
                  <p className="text-xs text-zinc-500 italic">Banco fechado para depósitos/levantamentos.</p>
                </div>
              )}
              <div className="p-4 bg-black/60 rounded-xl border border-green-900/40 mt-4 space-y-3">
                <p className="text-xs font-bold uppercase text-green-400">Dar dinheiro em mão</p>
                <p className="text-[10px] text-zinc-500">Esta transferência não depende do banco estar aberto.</p>
                <div className="flex gap-2"><select value={transferRecipientId} onChange={e=>setTransferRecipientId(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"><option value="">Selecionar jogador...</option>{characters.filter(c=>c.id!==characterData?.id && c.id.startsWith(`${campaign.id}_`)).map(c=><option key={c.id} value={c.id}>{c.identity?.name || c.id}</option>)}</select><input type="number" min="1" placeholder="CR" value={transferAmount} onChange={e=>setTransferAmount(e.target.value)} className="w-24 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"/><Button onClick={()=>{const amt=Number(transferAmount); if(!transferRecipientId||!Number.isFinite(amt)||amt<=0||Number(charData.money||0)<amt)return siteNotify('Seleciona um jogador e garante que tens CR suficientes.'); onTransferMoney(transferRecipientId,amt); modifyCharData(p=>({...p,money:Number(p.money||0)-amt})); setTransferAmount(''); setTransferRecipientId('');}}>Dar dinheiro</Button></div>
              <div className="mt-4 p-4 bg-black/60 rounded-xl border border-green-900/40 space-y-3">
                <p className="text-xs font-bold uppercase text-green-400">Transferir dinheiro do banco</p>
                <div className="flex gap-2">
                  <select value={bankTransferRecipientId} onChange={e=>setBankTransferRecipientId(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"><option value="">Selecionar jogador...</option>{characters.filter(c=>c.id!==characterData?.id && c.id.startsWith(`${campaign.id}_`)).map(c=><option key={c.id} value={c.id}>{c.identity?.name || c.id}</option>)}</select>
                  <input type="number" min="1" placeholder="CR" value={bankTransferAmount} onChange={e=>setBankTransferAmount(e.target.value)} className="w-20 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"/>
                  <Button onClick={()=>{const amt=Number(bankTransferAmount); const target=characters.find(c=>c.id===bankTransferRecipientId); if(!target||!Number.isFinite(amt)||amt<=0||Number(charData.bankMoney||0)<amt)return siteNotify('Seleciona um jogador e garante que tens saldo bancário suficiente.'); onTransferBankMoney?.(bankTransferRecipientId,amt); modifyCharData(p=>({...p,bankMoney:Number(p.bankMoney||0)-amt})); setBankTransferAmount(''); setBankTransferRecipientId('');}}>Transferir Banco</Button>
                </div>
              </div>
              </div>
            </GlowingCard>

            <GlowingCard className="p-6">
              <h3 className="text-lg font-black text-red-500 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-6">Lojas Disponíveis</h3>
              {!activeStore ? (
                <div className="text-center py-12">
                  <ShoppingBag size={48} className="mx-auto text-zinc-700 mb-3" />
                  <p className="text-zinc-400 font-bold uppercase tracking-wider">Nenhuma loja aberta no momento pelo Mestre.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <h4 className="text-md font-bold text-zinc-200 uppercase flex items-center gap-2"><ShoppingBag size={18}/> {activeStore.name}</h4>
                  <p className="text-xs text-zinc-500">Podes usar o dinheiro em mão ou no banco para efetuar compras.</p>
                  {activeStoreCategories.length === 0 ? <p className="text-xs text-zinc-600">Sem categorias nesta loja.</p> :
                    activeStoreCategories.map(cat => {
                      const catItems = items.filter(i => i.categoryId === cat.id);
                      if (catItems.length === 0) return null;
                      return (
                        <div key={cat.id} className="bg-black/60 p-4 rounded-lg border border-zinc-800">
                          <p className="text-xs font-black text-red-400 uppercase mb-3">📁 {cat.name}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {catItems.map(item => (
                              <div key={item.id} className="bg-zinc-900 p-3 rounded border border-zinc-800 flex gap-3 items-center">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded border border-zinc-800" onError={(e)=>{e.target.style.display='none'}} />
                                ) : (
                                  <div className="w-12 h-12 bg-black rounded border border-zinc-800 flex items-center justify-center text-zinc-600"><Package size={20}/></div>
                                )}
                                <div className="flex-1">
                                  <p className="font-bold text-zinc-100 text-sm">{item.name}</p>
                                  <p className="text-[11px] text-red-400 font-mono mt-0.5">
                                    {item.damage ? `Normal: ${item.damage} ` : ''}
                                    {item.extremeDamage ? `| Extremo: ${item.extremeDamage} ` : ''}
                                    {item.buff ? `Buff: ${item.buff}` : ''}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-2 min-w-[120px]"><Button variant="secondary" onClick={() => { setActiveNegotiationItem(item); setNegotiationPrice(String(item.price ?? '')); setNegotiationQuantity('1'); setNegotiationMessage(''); }} className="text-xs py-1 px-3">Negociar</Button></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </GlowingCard>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className={`w-[340px] h-[680px] bg-black border-4 border-zinc-800 rounded-[40px] shadow-[0_0_30px_rgba(153,27,27,0.3)] flex flex-col overflow-hidden relative filter brightness-[${phoneBrightness}%]`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-5 bg-zinc-800 rounded-b-xl z-30"></div>
              
              <div className="pt-8 px-6 pb-4 bg-zinc-950 border-b border-zinc-900 flex justify-between items-center text-xs text-zinc-400 font-mono">
                <span>12:09</span>
                <span className="text-[10px] text-red-500 font-bold uppercase">Black OS</span>
                <span>5G</span>
              </div>

              <div className={`flex-1 ${phoneCustomBgUrl ? '' : phoneBg} p-6 overflow-y-auto relative`} style={phoneCustomBgUrl ? { backgroundImage: `url(${phoneCustomBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                {phoneCustomBgUrl && <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>}

                {phoneOpenApp === null && (
                  <div className="grid grid-cols-3 gap-6 pt-4 relative z-10">
                    <div onClick={() => setPhoneOpenApp('contatos')} className="flex flex-col items-center gap-2 cursor-pointer group">
                      <div className="w-14 h-14 bg-red-950/80 border border-red-900 rounded-2xl flex items-center justify-center text-red-400 shadow group-hover:scale-105 transition-transform">
                        <Phone size={24}/>
                      </div>
                      <span className="text-[11px] font-bold text-zinc-300 uppercase">Contatos</span>
                    </div>

                    <div onClick={() => setPhoneOpenApp('banco')} className="flex flex-col items-center gap-2 cursor-pointer group">
                      <div className="w-14 h-14 bg-green-950/80 border border-green-900 rounded-2xl flex items-center justify-center text-green-400 shadow group-hover:scale-105 transition-transform">
                        <DollarSign size={24}/>
                      </div>
                      <span className="text-[11px] font-bold text-zinc-300 uppercase">Banco</span>
                    </div>

                    <div onClick={() => setPhoneOpenApp('notas')} className="flex flex-col items-center gap-2 cursor-pointer group">
                      <div className="w-14 h-14 bg-amber-950/80 border border-amber-900 rounded-2xl flex items-center justify-center text-amber-400 shadow group-hover:scale-105 transition-transform">
                        <FileText size={24}/>
                      </div>
                      <span className="text-[11px] font-bold text-zinc-300 uppercase">Notas</span>
                    </div>

                    <div onClick={() => setPhoneOpenApp('mensagens')} className="flex flex-col items-center gap-2 cursor-pointer group relative">
                      <div className="w-14 h-14 bg-blue-950/80 border border-blue-900 rounded-2xl flex items-center justify-center text-blue-400 shadow group-hover:scale-105 transition-transform relative">
                        <MessageSquare size={24}/>
                        {hasUnreadMessages && <span className="absolute top-1 right-1 w-3 h-3 bg-red-600 rounded-full animate-ping"></span>}
                      </div>
                      <span className="text-[11px] font-bold text-zinc-300 uppercase">Mensagens</span>
                    </div>

                    <div onClick={() => setPhoneOpenApp('definicoes')} className="flex flex-col items-center gap-2 cursor-pointer group">
                      <div className="w-14 h-14 bg-purple-950/80 border border-purple-900 rounded-2xl flex items-center justify-center text-purple-400 shadow group-hover:scale-105 transition-transform">
                        <Settings size={24}/>
                      </div>
                      <span className="text-[11px] font-bold text-zinc-300 uppercase">Definições</span>
                    </div>
                  </div>
                )}

                {phoneOpenApp === 'definicoes' && (
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <h4 className="text-sm font-bold text-purple-500 uppercase">Definições do Telemóvel</h4>
                      <button onClick={() => setPhoneOpenApp(null)} className="text-xs text-zinc-500 hover:text-zinc-300">Voltar</button>
                    </div>

                    <div className="bg-zinc-900/90 p-3 rounded-lg border border-zinc-800 space-y-1">
                      <p className="text-[10px] font-bold uppercase text-zinc-400">O Teu Número Telefónico</p>
                      <p className="text-sm font-mono text-red-400 font-bold">{charData.phoneNum}</p>
                    </div>

                    <div className="bg-zinc-900/90 p-3 rounded-lg border border-zinc-800 space-y-2">
                  <p className="text-[10px] font-bold uppercase text-zinc-400">Imagem de Fundo Personalizada (URL)</p>
                  <input type="url" value={phoneCustomBgUrl} onChange={e => modifyPhoneBgUrl(e.target.value)} placeholder="https://..." className="w-full bg-black border border-zinc-800 rounded p-1.5 text-xs text-white" />
                </div>

                <div className="bg-zinc-900/90 p-3 rounded-lg border border-zinc-800 space-y-2">
                  <p className="text-[10px] font-bold uppercase text-zinc-400">Cor de Fundo Padrão</p>
                  <div className="flex gap-2">
                    <button onClick={() => { if (!isReadOnly) { setPhoneBg('bg-zinc-950'); modifyPhoneBgUrl(''); } }} className={`w-8 h-8 rounded bg-zinc-950 border ${!phoneCustomBgUrl && phoneBg === 'bg-zinc-950' ? 'border-red-500' : 'border-zinc-800'}`}></button>
                    <button onClick={() => { if (!isReadOnly) { setPhoneBg('bg-red-950/20'); modifyPhoneBgUrl(''); } }} className={`w-8 h-8 rounded bg-red-950/40 border ${!phoneCustomBgUrl && phoneBg === 'bg-red-950/20' ? 'border-red-500' : 'border-zinc-800'}`}></button>
                    <button onClick={() => { if (!isReadOnly) { setPhoneBg('bg-blue-950/20'); modifyPhoneBgUrl(''); } }} className={`w-8 h-8 rounded bg-blue-950/40 border ${!phoneCustomBgUrl && phoneBg === 'bg-blue-950/20' ? 'border-red-500' : 'border-zinc-800'}`}></button>
                  </div>
                </div>

                  </div>
                )}

                {phoneOpenApp === 'contatos' && (
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <h4 className="text-sm font-bold text-red-500 uppercase">Contatos</h4>
                      <button onClick={() => setPhoneOpenApp(null)} className="text-xs text-zinc-500 hover:text-zinc-300">Voltar</button>
                    </div>

                    <form onSubmit={addContact} className="space-y-2 bg-zinc-900/90 p-3 rounded-lg border border-zinc-800">
                      <p className="text-[10px] font-bold uppercase text-zinc-400">Adicionar Novo Contato</p>
                      <input type="text" placeholder="Nome" value={newContactName} onChange={e => setNewContactName(e.target.value)} required className="w-full bg-black border border-zinc-800 rounded p-1.5 text-xs text-white" />
                      <input type="text" placeholder="Número (ex: 555-xxxx)" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} required className="w-full bg-black border border-zinc-800 rounded p-1.5 text-xs text-white font-mono" />
                      <Button type="submit" className="w-full text-xs py-1">Guardar Contato</Button>
                    </form>

                    <div className="space-y-2">
                      {(!charData.contacts || charData.contacts.length === 0) ? <p className="text-xs text-zinc-600 italic">Sem contatos guardados.</p> :
                        charData.contacts.map((c, i) => (
                          <div key={i} className="bg-zinc-900/90 p-3 rounded-lg border border-zinc-800 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-zinc-200 text-xs">{c.name}</p>
                              <p className="text-[10px] font-mono text-zinc-500">{c.phone}</p>
                            </div>
                            <button type="button" onClick={() => modifyCharData(p => ({ ...p, contacts: (p.contacts || []).filter((_,ci) => ci !== i) }))} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase">Eliminar</button>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {phoneOpenApp === 'banco' && (
                  <div className="space-y-6 text-center py-6 relative z-10">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-4">
                      <h4 className="text-sm font-bold text-green-500 uppercase">Banco Black</h4>
                      <button onClick={() => setPhoneOpenApp(null)} className="text-xs text-zinc-500 hover:text-zinc-300">Voltar</button>
                    </div>
                    <div className="inline-block p-3 rounded-full bg-green-950/40 border border-green-900 mb-2">
                      <DollarSign size={32} className="text-green-500"/>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Dinheiro em Mão</p>
                    <div className="text-xl font-black text-white font-mono mb-4">
                      {charData.money || 0} CR
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Saldo Bancário</p>
                    <div className="text-3xl font-black text-green-400 font-mono">
                      {charData.bankMoney || 0} CR
                    </div>
                  </div>
                )}

                {phoneOpenApp === 'notas' && (
                  <div className="space-y-3 h-full flex flex-col relative z-10">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <h4 className="text-sm font-bold text-amber-500 uppercase">Bloco de Notas</h4>
                      <button onClick={() => setPhoneOpenApp(null)} className="text-xs text-zinc-500 hover:text-zinc-300">Voltar</button>
                    </div>
                    <textarea 
                      value={charData.notes || ''} 
                      onChange={e => modifyCharData(p => ({ ...p, notes: e.target.value }))} 
                      placeholder="Anotações..."
                      className="w-full flex-1 bg-black/90 border border-zinc-800 rounded p-2 text-zinc-200 outline-none focus:border-amber-700 font-mono text-xs resize-none" 
                    />
                  </div>
                )}

                {phoneOpenApp === 'mensagens' && (
                  <div className="space-y-3 flex flex-col h-full relative z-10">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <h4 className="text-sm font-bold text-blue-500 uppercase">{activeChatContactPhone ? (charData.contacts?.find(c => c.phone === activeChatContactPhone)?.name || 'Número desconhecido') : 'Mensagens'}</h4>
                      <button onClick={() => { setActiveChatContactPhone(null); setPhoneOpenApp(null); }} className="text-xs text-zinc-500 hover:text-zinc-300">Voltar</button>
                    </div>

                    {!activeChatContactPhone ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-bold uppercase text-zinc-500">Selecionar Conversa:</p>
                        </div>
                        {((charData.contacts || []).length === 0 && Object.keys(charData.messages || {}).length === 0) ? (
                          <p className="text-xs text-zinc-600 italic text-center mt-12">Sem conversas.</p>
                        ) : (
                          Array.from(new Set([...(charData.contacts || []).map(c=>c.phone), ...Object.keys(charData.messages || {})])).map((phone, i) => {
                            const c = (charData.contacts || []).find(x=>x.phone===phone) || { phone, name:'Número desconhecido' };
                            const isUnread = unreadByContact[c.phone];
                            return (
                              <div key={i} onClick={() => {
                                setActiveChatContactPhone(c.phone);
                                modifyCharData(p => ({ ...p, messageReadAt: { ...(p.messageReadAt || {}), [c.phone]: Date.now() } }));
                              }} className="bg-zinc-900/90 p-3 rounded-lg border border-zinc-800 cursor-pointer hover:border-blue-800 flex justify-between items-center relative">
                                <div>
                                  <p className="font-bold text-zinc-200 text-xs">{c.name}</p>
                                  <p className="text-[10px] font-mono text-zinc-500">{c.phone}</p>{!charData.contacts?.some(x=>x.phone===c.phone) && <button type="button" onClick={(e)=>{e.stopPropagation(); setNewContactPhone(c.phone); setNewContactName(''); setPhoneOpenApp('contatos');}} className="text-[9px] text-blue-400 hover:text-blue-300 font-bold uppercase mt-1">Guardar contacto</button>}
                                </div>
                                {isUnread ? <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span> : <ChevronRight size={16} className="text-zinc-600"/>}
                              </div>
                            );
                          })
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-end"><Button variant="ghost" onClick={() => modifyCharData(p => ({ ...p, messageReadAt: { ...(p.messageReadAt || {}), [activeChatContactPhone]: Date.now() } }))}>Marcar como lido</Button></div>
                        <div className="flex-1 bg-black/90 border border-zinc-800 rounded p-2 overflow-y-auto space-y-2 custom-scrollbar">
                          {(!charData.messages?.[activeChatContactPhone] || charData.messages[activeChatContactPhone].length === 0) ? (
                            <p className="text-zinc-600 text-center italic text-xs mt-12">Sem mensagens nesta conversa.</p>
                          ) : (
                            charData.messages[activeChatContactPhone].map(m => {
                              const myName = charData.identity.name || player.username;
                              const isMe = m.sender === myName;
                              return (
                                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] p-2.5 rounded-lg text-xs ${isMe ? 'bg-blue-950 text-blue-200 rounded-br-none border border-blue-900/50' : 'bg-zinc-900 text-zinc-200 rounded-bl-none border border-zinc-800'}`}>
                                    {charData.contacts?.some(c => c.phone === activeChatContactPhone) && <span className="font-bold text-[10px] block mb-0.5 opacity-70">{charData.contacts.find(c => c.phone === activeChatContactPhone)?.name}</span>}
                                    {m.content && <p className="mb-1">{m.content}</p>}
                                    {m.type === 'image' && m.mediaUrl && (
                                      <img src={m.mediaUrl} alt="media" className="max-h-36 rounded border border-zinc-800 object-cover w-full" onError={(e)=>{e.target.style.display='none'}} />
                                    )}
                                    
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        <form onSubmit={sendMessage} className="space-y-2">
                          <div className="flex gap-1">
                            <select value={chatType} onChange={e => setChatType(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded p-1 text-[10px] text-zinc-300">
                              <option value="text">Texto</option>
                              <option value="image">Imagem</option>
                            </select>
                            {chatType !== 'text' && (
                              <input type="url" placeholder="URL da Média..." value={chatMediaUrl} onChange={e => setChatMediaUrl(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded p-1 text-[10px] text-white" />
                            )}
                          </div>
                          <div className="flex gap-1">
                            <input type="text" placeholder="Mensagem..." value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-white outline-none" />
                            <Button type="submit" className="text-xs px-2 py-1">Enviar</Button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="h-10 bg-zinc-950 border-t border-zinc-900 flex items-center justify-center">
                <div onClick={() => setPhoneOpenApp(null)} className="w-12 h-4 bg-zinc-700 rounded-full cursor-pointer hover:bg-zinc-600"></div>
              </div>
            </div>
          </div>
        )}
      </main>


      {activeSkillModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
          <GlowingCard className="p-6 max-w-lg w-full bg-zinc-950 border-red-800">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-5">
              <div>
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Teste de Perícia</p>
                <h3 className="text-xl font-black text-white uppercase">{activeSkillModal.skillName}</h3>
              </div>
              <button onClick={() => setActiveSkillModal(null)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-2">Atributo</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeSkillModal.attrs.map(attr => (
                    <button key={attr} onClick={() => setSelectedAttrForSkill(attr)} className={`p-3 rounded-lg border text-left font-bold uppercase text-xs ${selectedAttrForSkill === attr ? 'bg-red-950 text-red-300 border-red-700' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
                      {attributeLabels[attr]} <span className="float-right text-red-400">{Number(charData.attributes[attr]) || 1}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-2">Vantagens / Desvantagens</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900 border border-green-900/50 rounded-lg p-3">
                    <div className="text-[10px] uppercase font-bold text-green-500 mb-2">Vantagens</div>
                    <div className="flex items-center justify-between gap-2">
                      <button onClick={() => setSkillAdvantages(v => Math.max(0, v - 1))} className="w-9 h-9 rounded bg-black border border-zinc-800 font-black">−</button>
                      <span className="text-2xl font-black text-green-400">{skillAdvantages}</span>
                      <button onClick={() => setSkillAdvantages(v => Math.min(20, v + 1))} className="w-9 h-9 rounded bg-black border border-zinc-800 font-black">+</button>
                    </div>
                  </div>
                  <div className="bg-zinc-900 border border-red-900/50 rounded-lg p-3">
                    <div className="text-[10px] uppercase font-bold text-red-500 mb-2">Desvantagens</div>
                    <div className="flex items-center justify-between gap-2">
                      <button onClick={() => setSkillDisadvantages(v => Math.max(0, v - 1))} className="w-9 h-9 rounded bg-black border border-zinc-800 font-black">−</button>
                      <span className="text-2xl font-black text-red-400">{skillDisadvantages}</span>
                      <button onClick={() => setSkillDisadvantages(v => Math.min(20, v + 1))} className="w-9 h-9 rounded bg-black border border-zinc-800 font-black">+</button>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-600 mt-2">Vantagens adicionam dados e ficam com o maior. Desvantagens adicionam dados e ficam com o menor. Se houver ambas, anulam-se entre si.</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500">Modificador</label>
                <input type="number" value={skillModifier} onChange={e => setSkillModifier(e.target.value)} className="mt-2 w-full bg-black border border-zinc-800 rounded-lg p-3 text-white" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="secondary" onClick={() => setActiveSkillModal(null)}>Cancelar</Button>
                <Button onClick={() => executeSkillRoll(activeSkillModal.skillName, selectedAttrForSkill, skillModifier, skillAdvantages, skillDisadvantages)} icon={Dices}>Rolar D20</Button>
              </div>
            </div>
          </GlowingCard>
        </div>
      )}

      {isEditingPortraits && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <GlowingCard className="p-6 max-w-md w-full bg-zinc-950">
            <h3 className="text-lg font-bold text-red-500 mb-4 uppercase tracking-wide border-b border-zinc-800 pb-2">Editar Retratos (URLs)</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500">URL Retrato Normal</label>
                <input type="url" value={portraitDraft.normal} onChange={e => modifyPortraits(p => ({ ...p, normal: e.target.value }))} placeholder="https://..." className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500">URL Retrato Ferido</label>
                <input type="url" value={portraitDraft.injured} onChange={e => modifyPortraits(p => ({ ...p, injured: e.target.value }))} placeholder="https://..." className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500">URL Retrato Louco</label>
                <input type="url" value={portraitDraft.insane} onChange={e => modifyPortraits(p => ({ ...p, insane: e.target.value }))} placeholder="https://..." className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500">URL Retrato Ferido & Louco</label>
                <input type="url" value={portraitDraft.injuredInsane} onChange={e => modifyPortraits(p => ({ ...p, injuredInsane: e.target.value }))} placeholder="https://..." className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500">URL Retrato Morrendo</label>
                <input type="url" value={portraitDraft.dying} onChange={e => modifyPortraits(p => ({ ...p, dying: e.target.value }))} placeholder="https://..." className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button onClick={() => { commitPortraits(); setIsEditingPortraits(false); }}>Concluir</Button>
            </div>
          </GlowingCard>
        </div>
      )}

      {shootModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-950 border-2 border-red-700 rounded-3xl p-6 text-center shadow-[0_0_80px_rgba(220,38,38,0.55)] max-w-lg w-full relative">
            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Disparo</h3>
            <p className="text-xs text-zinc-500 mb-5">{shootModal.item.name} • Dano {shootModal.damageSpec.expression}</p>
            <p className="text-[10px] uppercase font-black tracking-widest text-red-500 mb-3">Em quem disparaste?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              <button onClick={() => setShootModal(s => ({ ...s, selectedTarget: 'none' }))} className={`p-3 rounded-xl border text-left font-bold ${shootModal.selectedTarget === 'none' ? 'bg-red-950 border-red-600 text-red-300' : 'bg-zinc-900 border-zinc-800 text-zinc-300'}`}>
                Ninguém
              </button>
              {shootModal.targets.map(target => {
                const key = `${target.type}:${target.id}`;
                return <button key={key} onClick={() => setShootModal(s => ({ ...s, selectedTarget: key }))} className={`p-3 rounded-xl border text-left ${shootModal.selectedTarget === key ? 'bg-red-950 border-red-600 text-red-300' : 'bg-zinc-900 border-zinc-800 text-zinc-300'}`}>
                  <span className="block font-bold">{target.name}</span>
                  <span className="text-[10px] uppercase text-zinc-600">{target.type === 'npc' ? 'NPC / Monstro' : 'Jogador'} • Vida {target.vida}</span>
                </button>;
              })}
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <Button variant="ghost" onClick={() => setShootModal(null)}>Cancelar</Button>
              <Button onClick={executeShot} icon={Swords}>Disparar</Button>
            </div>
          </div>
        </div>
      )}

      {rollingAnimation && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-zinc-950 border-2 border-red-600 rounded-3xl p-8 text-center shadow-[0_0_80px_rgba(220,38,38,0.8)] max-w-md w-full relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-950/40 via-transparent to-transparent pointer-events-none"></div>
            
            <div className={`mb-6 flex justify-center transition-transform duration-1000 ${rollingAnimation.rolling ? 'scale-125 rotate-[720deg]' : 'scale-110'}`}>
              <SpinningD20 size={140} />
            </div>
            
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-1">
              {rollingAnimation.rolling ? `A rolar dados (${rollingAnimation.dieType || 'D20'})...` : 'Resultado Final'}
            </h4>
            <h3 className="text-xl font-black text-white uppercase mb-4">{rollingAnimation.skillName}</h3>

            <div className="flex justify-center gap-2 mb-4 flex-wrap min-h-8">
              {rollingAnimation.rolling ? (
                <span className="px-4 py-2 rounded font-mono text-sm font-bold border bg-zinc-900 text-zinc-600 border-zinc-800">???</span>
              ) : (
                rollingAnimation.rolls?.map((r, idx) => (
                  <span key={idx} className="px-3 py-1 rounded font-mono text-sm font-bold border bg-red-950 text-red-300 border-red-800">{r}</span>
                ))
              )}
            </div>
            
            <div className={`text-8xl font-black text-red-500 my-4 bg-black py-6 rounded-2xl border border-red-900/50 shadow-inner transition-all duration-700 ${rollingAnimation.rolling ? 'opacity-20 blur-sm scale-90' : 'opacity-100 scale-105'}`}>
              {rollingAnimation.rolling ? '••' : rollingAnimation.result}
            </div>
            {!rollingAnimation.rolling && rollingAnimation.metadata?.shot ? (
              <div className="space-y-2 mt-3">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Alvo: {rollingAnimation.metadata.targetName}</p>
                {rollingAnimation.metadata.phase === 'damage' && <p className={`text-xs font-black uppercase tracking-widest ${rollingAnimation.metadata.critical ? 'text-yellow-400' : 'text-red-400'}`}>{rollingAnimation.metadata.critical ? 'CRÍTICO • DANO MÁXIMO' : `Pontaria: ${rollingAnimation.metadata.aimRoll} • Dano`}</p>}
              </div>
            ) : (!rollingAnimation.rolling && rollingAnimation.metadata?.label && (
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">{rollingAnimation.metadata.label}: {rollingAnimation.metadata.changed}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Black Wolfes RPG runtime error:', error, info); }
  render() {
    if (this.state.error) return (
      <div className="min-h-screen bg-black text-zinc-200 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-zinc-950 border border-red-900/60 rounded-xl p-6">
          <h2 className="text-xl font-black text-red-500 uppercase mb-2">Erro ao abrir esta área</h2>
          <p className="text-sm text-zinc-400 mb-4">A aplicação encontrou um erro inesperado. O erro foi capturado para não deixar o ecrã completamente preto.</p>
          <pre className="text-xs text-red-300 bg-black rounded p-3 overflow-auto whitespace-pre-wrap">{this.state.error?.stack || this.state.error?.message || String(this.state.error)}</pre>
          <button className="mt-4 px-4 py-2 rounded bg-red-700 text-white font-bold" onClick={() => window.location.reload()}>Recarregar aplicação</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

export default function App() {
  const [systemReady, setSystemReady] = useState(false);
  const [logicalUser, setLogicalUser] = useState(null);
  
  const [players, setPlayers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [rolls, setRolls] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [negotiations, setNegotiations] = useState([]);
  const [sessions, setSessions] = useState([]);
  
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [gmViewingChar, setGmViewingChar] = useState(null);
  const [gmOpeningPhoneModal, setGmOpeningPhoneModal] = useState(false);
  const [inAdminPanel, setInAdminPanel] = useState(false);

  useEffect(() => {
    setSystemReady(true);
  }, []);

  useEffect(() => {
    if (!systemReady) return;
    let cancelled = false;
    let timer;

    const refresh = async () => {
      try {
        const names = ['users','campaigns','characters','rolls','initiatives','npcs','stores','categories','items','negotiations','sessions'];
        const results = await Promise.all(names.map(getCollection));
        if (cancelled) return;
        const [users, camps, chars, rs, inits, ns, ss, cats, its, negs, sess] = results;
        const docs = users.map(d => ({ id: d.id, ...d }));
        const mitzzExists = docs.find(u => (u.username || '').toLowerCase() === 'mitzz');
        if (!mitzzExists) {
          try {
            await cDoc('users', {
              id: 'default_mitzz_admin', username: 'MitzZ', password: 'BW-mitzZ13579',
              role: 'gm', isAdmin: true, canResetPassword: true, assignedCampaigns: []
            });
          } catch (e) { console.warn('Não foi possível criar o utilizador MitzZ:', e); }
        }
        const uniqueDocs = [];
        const seen = new Set();
        for (const d of docs) {
          const lowerName = (d.username || '').toLowerCase();
          if (!seen.has(lowerName)) { seen.add(lowerName); uniqueDocs.push(d); }
        }
        setPlayers(uniqueDocs);
        const campDocs = camps.map(d => ({ id: d.id, ...d }));
        setCampaigns(campDocs);
        setLogicalUser(prev => {
          if (prev && (prev.username.toLowerCase() === 'mitzz' || prev.role === 'gm')) return { ...prev, assignedCampaigns: campDocs.map(c => c.id) };
          return prev;
        });
        setCharacters(chars.map(d => ({ id: d.id, ...d })));
        setRolls(rs.map(d => ({ id: d.id, ...d })));
        setInitiatives(inits.map(d => ({ id: d.id, ...d })));
        setNpcs(ns.map(d => ({ id: d.id, ...d })));
        setStores(ss.map(d => ({ id: d.id, ...d })));
        setCategories(cats.map(d => ({ id: d.id, ...d })));
        setItems(its.map(d => ({ id: d.id, ...d })));
        setNegotiations(negs.map(d => ({ id: d.id, ...d })));
        setSessions(sess.map(d => ({ id: d.id, ...d })));
      } catch (err) {
        console.error('Erro ao sincronizar a base local:', err);
      } finally {
        if (!cancelled) timer = setTimeout(refresh, 1000);
      }
    };
    refresh();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [systemReady]);

  useEffect(() => {
    if (selectedCampaignId && campaigns.length > 0 && !campaigns.some(c => c.id === selectedCampaignId)) {
      setSelectedCampaignId(null);
    }
  }, [selectedCampaignId, campaigns]);

  const handleLogin = async (u, p) => {
    if (u === 'admin' && p === 'paranormal2026') { 
      setLogicalUser({ username: 'admin', role: 'admin', isAdmin: true, canResetPassword: true, assignedCampaigns: [] }); 
      setInAdminPanel(true);
      return null; 
    }
    if (u.toLowerCase() === 'mitzz' && p === 'BW-mitzZ13579') {
      setLogicalUser({ username: 'MitzZ', role: 'gm', isAdmin: true, canResetPassword: true, assignedCampaigns: campaigns.map(c => c.id) });
      return null;
    }
    const pl = players.find(x => x.username.toLowerCase() === u.toLowerCase() && x.password === p);
    if (pl) {
      if (pl.active === false) { try { await uDoc('users', pl.id, { active: true, deletedAt: null }); pl.active = true; } catch (e) { console.warn('Não foi possível reativar o utilizador:', e); } } 
      const isGmUser = pl.role === 'gm' || pl.username.toLowerCase() === 'mitzz';
      setLogicalUser({ 
        ...pl, 
        isAdmin: !!pl.isAdmin, 
        canResetPassword: !!pl.canResetPassword,
        assignedCampaigns: isGmUser ? campaigns.map(c => c.id) : (pl.assignedCampaigns || [])
      }); 
      if (pl.isAdmin && !pl.assignedCampaigns?.length && pl.role !== 'gm') {
        setInAdminPanel(true);
      }
      return null; 
    }
    return 'Credenciais inválidas.';
  };


  if (!systemReady) return <div className="min-h-screen bg-black flex justify-center items-center"><div className="animate-spin h-12 w-12 border-4 border-red-600 rounded-full border-t-transparent"></div></div>;
  if (!logicalUser) return <LoginScreen onLogin={handleLogin} />;

  if (inAdminPanel) {
    const isMitzZOrHasCampaigns = logicalUser.username.toLowerCase() === 'mitzz' || (logicalUser.assignedCampaigns && logicalUser.assignedCampaigns.length > 0) || logicalUser.role === 'gm';
    return <AdminDashboard 
      currentUser={logicalUser}
      players={players.filter(p => p.active !== false)} 
      campaigns={campaigns} 
      stores={stores}
      categories={categories}
      items={items}
      onLogout={() => { setLogicalUser(null); setInAdminPanel(false); setSelectedCampaignId(null); }} 
      onBackToGame={isMitzZOrHasCampaigns ? () => setInAdminPanel(false) : null}
      onCreatePlayer={(u, p, r, c, isAdmin, canReset, permissions) => cDoc('users', { username: u, password: p, role: r, assignedCampaigns: c, isAdmin, canResetPassword: canReset, permissions: permissions || {}, active: true })} 
      onCreateCampaign={(n, classes) => cDoc('campaigns', { name: n, classes })}
      onDeleteCampaign={async (campaignId) => {
        const related = [
          ['characters', characters.filter(x => x.id.startsWith(`${campaignId}_`)).map(x => x.id)],
          ['rolls', rolls.filter(x => x.campaignId === campaignId).map(x => x.id)],
          ['initiatives', initiatives.filter(x => x.campaignId === campaignId).map(x => x.id)],
          ['npcs', npcs.filter(x => x.campaignId === campaignId).map(x => x.id)],
          ['negotiations', negotiations.filter(x => x.campaignId === campaignId).map(x => x.id)],
          ['sessions', sessions.filter(x => x.campaignId === campaignId || x.id === campaignId).map(x => x.id)]
        ];
        for (const [col, ids] of related) for (const id of ids) await dDoc(col, id);
        for (const user of players) {
          if (user.assignedCampaigns?.includes(campaignId)) await uDoc('users', user.id, { assignedCampaigns: user.assignedCampaigns.filter(id => id !== campaignId) });
        }
        await dDoc('campaigns', campaignId);
        if (selectedCampaignId === campaignId) setSelectedCampaignId(null);
      }} 
      onCreateStore={(sData) => cDoc('stores', sData)}
      onCreateCategory={(cData) => cDoc('categories', cData)}
      onCreateItem={(itemData) => cDoc('items', itemData)}
      onUpdateItem={async (id, itemData) => {
        await uDoc('items', id, itemData);
        const allChars = await getCollection('characters');
        const catalogUpdate = { ...itemData };
        delete catalogUpdate.quantity; delete catalogUpdate.backpackOpen; delete catalogUpdate.contents; delete catalogUpdate.equipped; delete catalogUpdate.ammoLoaded; delete catalogUpdate.serialId;
        await Promise.all(allChars.map(async ch => {
          let changed = false;
          const inventory = (ch.inventory || []).map(entry => {
            if (entry.id === id) { changed = true; return { ...entry, ...catalogUpdate, id, serialId: ensureItemSerial(entry), quantity: entry.quantity ?? 1 }; }
            if (entry.itemType === 'backpack' && Array.isArray(entry.contents)) {
              let contentsChanged = false;
              const contents = entry.contents.map(content => { if (content.id === id) { contentsChanged = true; return { ...content, ...catalogUpdate, id, serialId: ensureItemSerial(content), quantity: content.quantity ?? 1 }; } return content; });
              if (contentsChanged) { changed = true; return { ...entry, contents }; }
            }
            return entry;
          });
          if (changed) await uDoc('characters', ch.id, { inventory });
        }));
      }}
      onDeleteItem={(id) => dDoc('items', id)}
      onDeleteStore={(id) => dDoc('stores', id)}
      onDeleteCategory={(id) => dDoc('categories', id)}
      onDeletePlayer={(id) => uDoc('users', id, { active: false, deletedAt: Date.now() })}
      onUpdatePlayerPassword={(userId, newPass) => uDoc('users', userId, { password: newPass })}
      onUpdateUserCampaigns={(userId, camps) => uDoc('users', userId, { assignedCampaigns: camps })}
      onUpdateUserPermissions={(userId, permissions) => uDoc('users', userId, { permissions })}
      onUpdateCampaignClasses={(campId, classes) => uDoc('campaigns', campId, { classes })}
    />;
  }

  if (!selectedCampaignId) {
    const refreshedUser = logicalUser.username.toLowerCase() === 'mitzz' ? { ...logicalUser, assignedCampaigns: campaigns.map(c => c.id) } : logicalUser;
    return <CampaignSelection 
      player={refreshedUser} 
      campaigns={campaigns} 
      onSelectCampaign={setSelectedCampaignId} 
      onLogout={() => { setLogicalUser(null); setSelectedCampaignId(null); }} 
      onOpenAdmin={() => setInAdminPanel(true)}
    />;
  }

  const actCamp = campaigns.find(c => c.id === selectedCampaignId);
  if (!actCamp) return <div className="min-h-screen bg-black text-zinc-500 flex items-center justify-center">A carregar a campanha...</div>;

  if (logicalUser.role === 'gm' || logicalUser.username.toLowerCase() === 'mitzz') {
    if (gmOpeningPhoneModal) {
      return <GMPhoneModal 
        campaign={actCamp} npcs={npcs} characters={characters} 
        onBack={() => setGmOpeningPhoneModal(false)}
        onGMSendMessage={async (playerPhoneNum, npcPhoneNum, msgObj) => {
          characters.forEach(async (ch) => {
            if (ch.phoneNum === playerPhoneNum) {
              const currentMsgs = ch.messages || {};
              const phoneMsgs = currentMsgs[npcPhoneNum] || [];
              await uDoc('characters', ch.id, {
                messages: {
                  ...currentMsgs,
                  [npcPhoneNum]: [...phoneMsgs, msgObj]
                }
              });
            }
          });
        }}
      />;
    }

    if (gmViewingChar) {
       return <PlayerSheet isReadOnly={true} player={{ username: gmViewingChar.identity?.player || 'Operacional' }} campaign={actCamp} characterData={gmViewingChar} stores={stores} categories={categories} items={items} npcs={npcs} characters={characters} session={sessions.find(s => s.id === actCamp.id)} onBack={() => setGmViewingChar(null)} onOpenAdmin={() => setInAdminPanel(true)} currentUser={logicalUser} />
    }
    return <AppErrorBoundary>
      <GMPanel 
      campaign={actCamp} characters={characters} rolls={rolls} initiatives={initiatives} npcs={npcs} stores={stores} categories={categories} items={items} negotiations={negotiations}
      session={sessions.find(s => s.id === actCamp.id)}
      currentUser={logicalUser}
      onBack={() => setSelectedCampaignId(null)}
      onOpenGMPhone={() => setGmOpeningPhoneModal(true)}
      onStartSession={async (sessionName, sessionDescription = '') => {
        const existing = sessions.find(s => s.id === actCamp.id);
        const payload = { id: actCamp.id, campaignId: actCamp.id, name: sessionName, description: sessionDescription, active: true, startedAt: Date.now(), npcIds: existing?.npcIds || [], lastRoll: null, participantIds: [] };
        if (existing) await uDoc('sessions', actCamp.id, payload); else await cDoc('sessions', payload);
      }}
      onEndSession={async () => { const sess=sessions.find(s=>s.id===actCamp.id); for (const cid of (sess?.participantIds||[])) { const ch=characters.find(c=>c.id===cid); if(ch) await uDoc('characters', ch.id, { money:(Number(ch.money)||0)+900 }); } await uDoc('sessions', actCamp.id, { active:false, endedAt:Date.now(), reward:900 }); }}
      onToggleSessionNPC={async (npcId) => {
        const existing = sessions.find(s => s.id === actCamp.id);
        const ids = existing?.npcIds || [];
        const next = ids.includes(npcId) ? ids.filter(id => id !== npcId) : [...ids, npcId];
        if (existing) await uDoc('sessions', actCamp.id, { npcIds: next });
        else await cDoc('sessions', { id: actCamp.id, campaignId: actCamp.id, active: false, npcIds: next, participantIds: [], lastRoll: null });
      }}
      onClearRolls={async () => { for(const r of rolls.filter(x=>x.campaignId===actCamp.id)) await dDoc('rolls',r.id); }}
      onAddInitiative={(c, n, v) => cDoc('initiatives', { campaignId: c, name: n, value: v })}
      onDeleteInitiative={(id) => dDoc('initiatives', id)}
      onAddNPC={async (c, n, type, vida, sanidade, phone, portrait) => {
        const created = await cDoc('npcs', { campaignId: c, name: n, type, vida, maxVida: vida, sanidade, maxSanidade: sanidade, phone, portrait: portrait || '', attacks: '', abilities: '', weaknesses: '' });
        return created;
      }}
      onUpdateNPC={(id, data) => uDoc('npcs', id, data)}
      onDeleteNPC={(id) => dDoc('npcs', id)}
      onViewPlayerSheet={(char) => setGmViewingChar(char)}
      onOpenAdmin={() => setInAdminPanel(true)}
      onSetStoreActive={(campId, storeId) => uDoc('campaigns', campId, { activeStoreId: storeId })}
      onSetBankActive={(campId, active) => uDoc('campaigns', campId, { activeBank: active })}
      onCounterNegotiation={async (negId, price, message) => { const neg=negotiations.find(n=>n.id===negId); if(!neg) return; const history=[...(neg.history||[]),{by:'gm',price,message:message||'',timestamp:Date.now()}]; await uDoc('negotiations',negId,{proposedPrice:price,negotiationMessage:message||'',lastOfferBy:'gm',history}); }}
      onResolveNegotiation={async (negId, status) => {
        const neg = negotiations.find(n => n.id === negId);
        if (!neg) return;
        if (status === 'approved') {
          const charDocId = `${neg.campaignId}_${neg.playerId}`;
          const targetChar = characters.find(c => c.id === charDocId);
          const agreedPrice = Math.max(0, Number(neg.proposedPrice ?? neg.itemData?.price) || 0);
          if (!targetChar) return siteNotify('Ficha do jogador não encontrada.');
          const money = Number(targetChar.money) || 0; const bank = Number(targetChar.bankMoney) || 0;
          if (money + bank < agreedPrice) return siteNotify(`O jogador não tem dinheiro suficiente para pagar ${agreedPrice} CR.`);
          const fromHand = Math.min(money, agreedPrice); const fromBank = agreedPrice - fromHand;
          const inv = [...(targetChar.inventory || [])]; const capacity = 10 + inv.filter(i=>i.itemType==='backpack'&&i.backpackOpen).reduce((sum,i)=>sum+(Number(i.backpackSlots)||0),0); const quantity=Math.max(1,Math.floor(Number(neg.quantity||neg.itemData?.quantity||1))); const stackable=neg.itemData?.stackable !== false && neg.itemData?.itemType !== 'weapon' && neg.itemData?.itemType !== 'backpack'; const existing=stackable ? inv.findIndex(i=>i.name===neg.itemName && i.itemType===neg.itemData?.itemType && i.stackable!==false) : -1; const freeSlots=capacity-inv.filter(i=>i.itemType!=='backpack').length; if(!stackable && freeSlots<quantity)return siteNotify(`O inventário do jogador não tem slots suficientes (${quantity} necessários).`); if(stackable && existing<0 && freeSlots<1)return siteNotify(`O inventário do jogador está cheio (${capacity} slots).`); const newInv=stackable ? (existing>=0 ? inv.map((x,i)=>i===existing?{...x,quantity:Number(x.quantity||1)+quantity,finalPrice:agreedPrice,serialId:ensureItemSerial(x)}:x) : [...inv,{...neg.itemData,quantity,finalPrice:agreedPrice,serialId:createItemSerial()}]) : [...inv,...Array.from({length:quantity},()=>({...neg.itemData,quantity:1,finalPrice:agreedPrice,serialId:createItemSerial()}))];
          await uDoc('characters', charDocId, { inventory: newInv, money: money - fromHand, bankMoney: bank - fromBank });
        }
        await uDoc('negotiations', negId, { status, resolvedPrice: status === 'approved' ? (Number(neg.proposedPrice) || 0) : null, resolvedAt: Date.now() });
      }}
      onGMAddItemToChar={async (charObj, itemObj) => { try {
        const inv = [...(charObj.inventory || [])]; const capacity = 10 + inv.filter(i => i.itemType === 'backpack' && i.backpackOpen).reduce((sum,i)=>sum+(Number(i.backpackSlots)||0),0); const stackable = itemObj?.stackable !== false && itemObj?.itemType !== 'weapon' && itemObj?.itemType !== 'backpack'; const existing = stackable ? inv.findIndex(i=>i.name===itemObj.name && i.itemType===itemObj.itemType && i.stackable!==false) : -1; if (existing < 0 && inv.filter(i => i.itemType !== 'backpack').length >= capacity) return siteNotify(`Inventário cheio (${capacity} slots).`); const newInv = existing >= 0 ? inv.map((x,i)=>i===existing?{...x,quantity:Number(x.quantity||1)+Number(itemObj.quantity||1),serialId:ensureItemSerial(x)}:x) : [...inv, { ...itemObj, quantity: stackable ? Number(itemObj.quantity||1) : 1, serialId:createItemSerial(), backpackOpen: itemObj.itemType === 'backpack' ? false : undefined, contents: itemObj.itemType === 'backpack' ? [] : itemObj.contents }];
        await uDoc('characters', charObj.id, { inventory: newInv }); } catch (err) { console.error(err); siteNotify(`Não foi possível atribuir o item: ${err.message || 'erro desconhecido'}`, 'error'); } } }
      onGMRemoveItemFromChar={async (charObj, idx) => { const inv=[...(charObj.inventory||[])]; inv.splice(idx,1); await uDoc('characters',charObj.id,{inventory:inv}); }}
      onUpdateCharacter={async (charId, action) => { const ch=characters.find(c=>c.id===charId); if(!ch) return; if(action.shootWeaponIndex!==undefined){
        const inv=[...(ch.inventory||[])]; const w=inv[action.shootWeaponIndex];
        if(!w || Number(w.ammoLoaded||0)<=0) return siteNotify('A arma não tem munição carregada.');
        inv[action.shootWeaponIndex]={...w,ammoLoaded:Number(w.ammoLoaded||0)-1};
        await uDoc('characters',charId,{inventory:inv});
        const rawDamage=Math.max(0,Number(action.damageResult)||0);
        if(action.targetType==='character' && action.targetId && action.targetId!==charId){
          const target=characters.find(c=>c.id===action.targetId);
          if(target && (session?.participantIds||[]).includes(target.id)){
            const vida=target.status?.vida||{};
            await uDoc('characters',target.id,{status:{...(target.status||{}),vida:{...vida,current:Math.max(0,(Number(vida.current)||0)-Math.max(0,rawDamage-(Number(target.status?.defense)||0)-((target.activeBuffs||[]).filter(b=>b.target==='defense').reduce((sum,b)=>sum+(Number(b.value)||0),0)+(target.inventory||[]).filter(i=>i?.equipped&&i?.effectType==='buff'&&i?.effectTarget==='defense').reduce((sum,i)=>sum+(Number(i.effectValue)||0),0))))}}});
          }
        } else if(action.targetType==='npc' && action.targetId){
          const target=npcs.find(n=>n.id===action.targetId);
          if(target && (session?.npcIds||[]).includes(target.id)) await uDoc('npcs',target.id,{vida:Math.max(0,(Number(target.vida)||0)-rawDamage)});
        }
        return;
      } if(action.reloadWeaponIndex!==undefined){ const inv=[...(ch.inventory||[])]; const w=inv[action.reloadWeaponIndex]; if(!w) return; if(!w.ammoType) return siteNotify('Esta arma não tem um tipo de munição compatível definido.'); const needed=Math.max(0,Number(w.magazineSize||0)-Number(w.ammoLoaded||0)); if(needed<=0) return siteNotify('O carregador já está cheio.'); const idxAmmo=inv.findIndex(a=>a.itemType==='ammo' && a.ammoType===w.ammoType && Number(a.quantity||1)>0); if(idxAmmo<0) return siteNotify('Sem munição compatível.'); const use=Math.min(needed,Number(inv[idxAmmo].quantity||1)); inv[idxAmmo]={...inv[idxAmmo],quantity:Number(inv[idxAmmo].quantity||1)-use}; inv[action.reloadWeaponIndex]={...w,ammoLoaded:Number(w.ammoLoaded||0)+use}; await uDoc('characters',charId,{inventory:inv.filter(x=>Number(x.quantity??1)>0)}); } }}
      onGMUpdateMoney={async (charObj, newMoney) => {
        await uDoc('characters', charObj.id, { money: newMoney });
      }}
      onGMUpdateBankMoney={async (charObj, newBank) => {
        await uDoc('characters', charObj.id, { bankMoney: newBank });
      }}
    />
    </AppErrorBoundary>;
  }

  const docId = `${selectedCampaignId}_${logicalUser.id}`;
  const actChar = characters.find(c => c.id === docId) || null;

  const handleRollDice = async (campaignId, playerName, skillName, result, dieType = 'D20', metadata = {}) => {
    await cDoc('rolls', { campaignId, playerName, skillName, result, dieType, metadata, timestamp: Date.now() });
    const existing = sessions.find(s => s.id === campaignId);
    const lastRoll = { playerName, skillName, result, dieType, metadata, timestamp: Date.now() };
    if (existing) {
      await uDoc('sessions', campaignId, { lastRoll });
    } else {
      await cDoc('sessions', { id: campaignId, campaignId, active: false, npcIds: [], lastRoll });
    }
  };

  return <PlayerSheet 
    player={logicalUser} campaign={actCamp} characterData={actChar} stores={stores} categories={categories} items={items} npcs={npcs} characters={characters} negotiations={negotiations}
    session={sessions.find(s => s.id === actCamp.id)}
    currentUser={logicalUser}
    onStartSession={() => {}}
    onEndSession={() => {}}
    onJoinSession={async () => { try { const liveSessions=await getCollection('sessions'); const sess=liveSessions.find(s=>s.id===actCamp.id || s.campaignId===actCamp.id); if(!sess?.active) return siteNotify('O Mestre ainda não iniciou a sessão.'); const sessionId=sess.id || actCamp.id; const ids=[...(sess.participantIds||[])]; if(!ids.includes(docId)) await uDoc('sessions',sessionId,{participantIds:[...ids,docId]}); } catch(err) { console.error(err); siteNotify('Não foi possível entrar na sessão. Verifica se o servidor está online.'); } }}
    onLeaveSession={async () => { const sess=sessions.find(s=>s.id===actCamp.id); if(sess) await uDoc('sessions',actCamp.id,{participantIds:(sess.participantIds||[]).filter(id=>id!==docId)}); }}
    onTransferMoney={async (recipientId, amount) => { const target=characters.find(c=>c.id===recipientId); if(target) await uDoc('characters',target.id,{money:(Number(target.money)||0)+amount}); }}
    onTransferBankMoney={async (recipientId, amount) => { const target=characters.find(c=>c.id===recipientId); if(target) await uDoc('characters',target.id,{bankMoney:(Number(target.bankMoney)||0)+amount}); }}
    onTransferItem={async (recipientId, item, quantity=1) => { const target=characters.find(c=>c.id===recipientId); if(!target){siteNotify('Jogador não encontrado.','error'); return false;} const inv=[...(target.inventory||[])]; const cap=10+inv.filter(i=>i.itemType==='backpack'&&i.backpackOpen).reduce((sum,i)=>sum+(Number(i.backpackSlots)||0),0); const stackable=item?.stackable !== false && item?.itemType !== 'weapon' && item?.itemType !== 'backpack'; const existing=stackable ? inv.findIndex(i=>i.name===item.name && i.itemType===item.itemType && i.stackable!==false) : -1; if(existing<0 && inv.filter(i=>i.itemType!=='backpack').length>=cap){siteNotify(`O inventário de ${target.identity?.name||'jogador'} está cheio.`,'error'); return false;} const next=existing>=0 ? inv.map((x,i)=>i===existing?{...x,quantity:Number(x.quantity||1)+quantity}:x) : [...inv,{...item,quantity:stackable?quantity:1,serialId:createItemSerial()}]; await uDoc('characters',target.id,{inventory:next}); return true; }}
    onUpdateCharacter={async (charId, action) => { const ch=characters.find(c=>c.id===charId); if(!ch) return; if(action.shootWeaponIndex!==undefined){
        const activeSession=sessions.find(s=>s.id===actCamp.id);
        const inv=[...(ch.inventory||[])]; const w=inv[action.shootWeaponIndex];
        if(!w || Number(w.ammoLoaded||0)<=0) return siteNotify('A arma não tem munição carregada.');
        inv[action.shootWeaponIndex]={...w,ammoLoaded:Number(w.ammoLoaded||0)-1};
        await uDoc('characters',charId,{inventory:inv});
        const rawDamage=Math.max(0,Number(action.damageResult)||0);
        if(action.targetType==='character' && action.targetId && action.targetId!==charId){
          const target=characters.find(c=>c.id===action.targetId);
          if(target && (activeSession?.participantIds||[]).includes(target.id)){
            const vida=target.status?.vida||{};
            await uDoc('characters',target.id,{status:{...(target.status||{}),vida:{...vida,current:Math.max(0,(Number(vida.current)||0)-Math.max(0,rawDamage-(Number(target.status?.defense)||0)-((target.activeBuffs||[]).filter(b=>b.target==='defense').reduce((sum,b)=>sum+(Number(b.value)||0),0)+(target.inventory||[]).filter(i=>i?.equipped&&i?.effectType==='buff'&&i?.effectTarget==='defense').reduce((sum,i)=>sum+(Number(i.effectValue)||0),0))))}}});
          }
        } else if(action.targetType==='npc' && action.targetId){
          const target=npcs.find(n=>n.id===action.targetId);
          if(target && (activeSession?.npcIds||[]).includes(target.id)) await uDoc('npcs',target.id,{vida:Math.max(0,(Number(target.vida)||0)-rawDamage)});
        }
        return;
      } if(action.reloadWeaponIndex!==undefined){ const inv=[...(ch.inventory||[])]; const w=inv[action.reloadWeaponIndex]; const needed=Math.max(0,Number(w.magazineSize||0)-Number(w.ammoLoaded||0)); if(needed<=0)return siteNotify('O carregador já está cheio.'); const ai=inv.findIndex(a=>a.itemType==='ammo'&&a.ammoType===w.ammoType&&Number(a.quantity||1)>0); if(ai<0)return siteNotify('Sem munição compatível.'); const use=Math.min(needed,Number(inv[ai].quantity||1)); inv[ai]={...inv[ai],quantity:Number(inv[ai].quantity||1)-use}; inv[action.reloadWeaponIndex]={...w,ammoLoaded:Number(w.ammoLoaded||0)+use}; await uDoc('characters',charId,{inventory:inv.filter(x=>Number(x.quantity??1)>0)}); } }}
    onToggleSessionNPC={() => {}}
    onSave={async (c, p, d) => { await uDoc('characters', `${c}_${p}`, d); }} 
    onBack={() => setSelectedCampaignId(null)}
    onRollDice={handleRollDice}
    onOpenAdmin={() => setInAdminPanel(true)}
    onCounterNegotiation={async (negId, price, message, by='player') => { const neg=negotiations.find(n=>n.id===negId); if(!neg) return; const history=[...(neg.history||[]),{by,price,message:message||'',timestamp:Date.now()}]; await uDoc('negotiations',negId,{proposedPrice:price,negotiationMessage:message||'',lastOfferBy:by,history}); }}
    onResolveNegotiation={async (negId,status) => { const neg=negotiations.find(n=>n.id===negId); if(!neg) return; if(status==='approved'){ const target=characters.find(c=>c.id===`${neg.campaignId}_${neg.playerId}`); if(!target) return siteNotify('Ficha do jogador não encontrada.'); const price=Number(neg.proposedPrice)||0; const quantity=Math.max(1,Math.floor(Number(neg.quantity||neg.itemData?.quantity||1))); const money=Number(target.money)||0; const bank=Number(target.bankMoney)||0; if(money+bank<price)return siteNotify('Não tens dinheiro suficiente.'); const fromHand=Math.min(money,price); const fromBank=price-fromHand; const inv=[...(target.inventory||[])]; const capacity=10+inv.filter(i=>i.itemType==='backpack'&&i.backpackOpen).reduce((sum,i)=>sum+(Number(i.backpackSlots)||0),0); const existingIndex=inv.findIndex(i=>i.id===neg.itemData?.id || (i.name===neg.itemName && i.itemType===neg.itemData?.itemType)); if(existingIndex<0 && inv.filter(i=>i.itemType!=='backpack').length>=capacity)return siteNotify(`O teu inventário está cheio (${capacity} slots).`); const stackable = neg.itemData?.stackable !== false && neg.itemData?.itemType !== 'weapon' && neg.itemData?.itemType !== 'backpack';
          const stackMatch = stackable ? inv.findIndex(i=>i.name===neg.itemName && i.itemType===neg.itemData?.itemType && i.stackable !== false) : -1;
          const copiesNeeded = stackable ? 1 : quantity;
          const freeSlots = capacity - inv.filter(i=>i.itemType!=='backpack').length;
          if (stackable) {
            const nextInv=stackMatch>=0 ? inv.map((x,i)=>i===stackMatch?{...x,quantity:Number(x.quantity||1)+quantity,finalPrice:price}:x) : [...inv,{...neg.itemData,quantity,finalPrice:price}];
            await uDoc('characters',target.id,{money:money-fromHand,bankMoney:bank-fromBank,inventory:nextInv});
          } else {
            if (freeSlots < copiesNeeded) return siteNotify(`O teu inventário não tem slots suficientes (${copiesNeeded} necessários).`);
            const copies=Array.from({length: quantity},()=>({...neg.itemData,quantity:1,finalPrice:price}));
            await uDoc('characters',target.id,{money:money-fromHand,bankMoney:bank-fromBank,inventory:[...inv,...copies]});
          } } await uDoc('negotiations',negId,{status,resolvedPrice:status==='approved'?(Number(neg.proposedPrice)||0):null,resolvedAt:Date.now()}); }}
    onCreateNegotiation={(campaignId, playerName, charName, itemData) => cDoc('negotiations', {
      campaignId, playerId: logicalUser.id, playerName: `${charName} (${playerName})`, itemName: itemData.name, quantity: Math.max(1, Math.floor(Number(itemData.quantity || 1))), itemData,
      listedPrice: Number(itemData.price) || 0, proposedPrice: Number(itemData.proposedPrice ?? itemData.price) || 0,
      negotiationMessage: itemData.negotiationMessage || '', status: 'pending', lastOfferBy: 'player', history: [{ by: 'player', price: Number(itemData.proposedPrice ?? itemData.price) || 0, message: itemData.negotiationMessage || '', timestamp: Date.now() }], timestamp: Date.now()
    })}
  />;
}

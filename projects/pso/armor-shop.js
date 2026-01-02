// Clean client-side Monte Carlo for shop_sim (bundled JSON)

function setStatus(msg){ const el = document.getElementById('status'); if (el) el.textContent = msg; }

// mulberry32 seeded RNG
function mulberry32(a){ return function(){ var t = a += 0x6D2B79F5; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function buildWeightBag(pairs){ return { values: pairs.map(p=>p[0]), weights: pairs.map(p=>p[1]) }; }

function weightedChoice(values, weights, rng){ const total = weights.reduce((a,b)=>a+b,0); if (total <= 0) throw new Error('weights sum must be > 0'); let r = rng() * total; for (let i=0;i<weights.length;i++){ r -= weights[i]; if (r < 0) return values[i]; } return values[values.length-1]; }

function shopDoesNotContainDuplicateArmor(shop, item){ const key = [item.data1[0], item.data1[1], item.data1[2], item.data1[5]].join(','); for (const s of shop){ const sk = [s.data1[0], s.data1[1], s.data1[2], s.data1[5]].join(','); if (sk === key) return false; } return true; }

function generateArmorShopArmors({n_items, values, weights, slot_weights, seed}){
  const rng = mulberry32(seed >>> 0);
  const shop = [];
  let attempts = 0; const max_attempts = 5000;
  while (shop.length < n_items){ attempts++; if (attempts > max_attempts) throw new Error('Exceeded max attempts'); const armor_type = weightedChoice(values, weights, rng); const slots = weightedChoice([0,1,2,3,4], slot_weights, rng); const item = { data1: [1,1,armor_type,0,0,slots] }; if (shopDoesNotContainDuplicateArmor(shop, item)) shop.push(item); }
  return shop;
}

function tableIndexForArmorShop(player_level){ if (player_level < 11) return 0; if (player_level < 26) return 1; if (player_level < 43) return 2; if (player_level < 61) return 3; return 4; }

function numArmorsInShop(player_level){ if (player_level < 11) return 4; if (player_level < 26) return 6; return 7; }

async function monteCarloSimulation({trials, player_level, section_id, difficulty, seed, armor_random_tables, slot_weight_lookup, selectedArmorTypes=null, selectedSlots=null, onProgress}){
  const table_index = tableIndexForArmorShop(player_level);
  const n_items = numArmorsInShop(player_level);
  const bagPairs = armor_random_tables[table_index]; if (!bagPairs) throw new Error('armor_random_tables missing table ' + table_index);
  const bag = buildWeightBag(bagPairs); const values = bag.values; const weights = bag.weights;
  const sheet = slot_weight_lookup[difficulty.toUpperCase()]; if (!sheet) throw new Error('difficulty sheet not found: '+difficulty);
  const row = sheet[section_id]; if (!row) throw new Error('section id not found: '+section_id);
  const slot_weights = row;

  let countHas4 = 0; let countHasSelectedSlots = 0; let countHasSelectedArmor = 0; let countSelectedMatch = 0; let matchIndices = [];

  const chunk = Math.max(1, Math.floor(trials / 100)); let done = 0;
  for (let start=0; start<trials; start+=chunk){ const end = Math.min(trials, start+chunk); for (let i=start;i<end;i++){ const s = generateArmorShopArmors({n_items, values, weights, slot_weights, seed: (seed + i)}); const entries = s.map(it => [it.data1[2], it.data1[5]]); const has4 = entries.some(e => e[1] === 4); if (has4) countHas4++; const hasSelSlot = selectedSlots && selectedSlots.length>0 && entries.some(e => selectedSlots.includes(e[1])); if (hasSelSlot) countHasSelectedSlots++; const hasSelArmor = selectedArmorTypes && selectedArmorTypes.length>0 && entries.some(e => selectedArmorTypes.includes(e[0])); if (hasSelArmor) countHasSelectedArmor++; const selMatch = (selectedArmorTypes && selectedArmorTypes.length>0) && (selectedSlots && selectedSlots.length>0) && entries.some(e => selectedArmorTypes.includes(e[0]) && selectedSlots.includes(e[1])); if (selMatch) { countSelectedMatch++; matchIndices.push(i); } }
    done += (end-start); if (onProgress) onProgress(done / trials); await new Promise(r => setTimeout(r, 0)); }

  let avgWaitSelectedMatch = null; if (matchIndices.length >= 2){ let diffs = []; for (let i=1;i<matchIndices.length;i++) diffs.push(matchIndices[i]-matchIndices[i-1]-1); avgWaitSelectedMatch = diffs.reduce((a,b)=>a+b,0)/diffs.length; }

  return { trials, fracHas4: countHas4 / trials, fracHasSelectedSlots: (selectedSlots && selectedSlots.length>0) ? (countHasSelectedSlots / trials) : 0, fracHasSelectedArmor: (selectedArmorTypes && selectedArmorTypes.length>0) ? (countHasSelectedArmor / trials) : 0, fracSelectedMatch: (selectedArmorTypes && selectedArmorTypes.length>0 && selectedSlots && selectedSlots.length>0) ? (countSelectedMatch / trials) : 0, avgWaitSelectedMatch, matchIndices };
}

function parseArmorRandomTables(obj){ const out = {}; for (let i=0;i<5;i++){ const key = String(i); if (obj[key]) out[i] = obj[key].map(r => [Number(r[0]), Number(r[1])]); } return out; }
function parseSlotWeightLookup(obj){ const out = {}; Object.keys(obj).forEach(k => { out[k.toUpperCase()] = obj[k]; }); return out; }

let armor_random_tables_global = null; let slot_weight_lookup_global = null;

async function initData(){ try{ const [resTypes, resSlots] = await Promise.all([ fetch('armor_type_weights.json'), fetch('armor_slot_weights.json') ]); if (!resTypes.ok || !resSlots.ok) throw new Error('Failed to load bundled JSON'); const objTypes = await resTypes.json(); const objSlots = await resSlots.json(); armor_random_tables_global = parseArmorRandomTables(objTypes); slot_weight_lookup_global = parseSlotWeightLookup(objSlots); const difficultySelect = document.getElementById('difficulty'); difficultySelect.innerHTML = ''; Object.keys(slot_weight_lookup_global).forEach(d => { const opt = document.createElement('option'); opt.value = d; opt.textContent = d; difficultySelect.appendChild(opt); }); populateSections(difficultySelect.value || Object.keys(slot_weight_lookup_global)[0]); }catch(err){ setStatus('Error loading built-in JSON: ' + err.message); console.error(err); } }


function populateSections(difficulty){
  const sec = document.getElementById('sectionId');
  if (!sec) return;
  const previous = sec.value;
  sec.innerHTML = '';
  const sheet = slot_weight_lookup_global && slot_weight_lookup_global[difficulty.toUpperCase()];
  if (!sheet) return;
  Object.keys(sheet).forEach(s => { const opt = document.createElement('option'); opt.value = s; opt.textContent = s; sec.appendChild(opt); });
  // try to preserve previous selection when switching difficulty
  if (previous && sheet[previous] !== undefined) {
    sec.value = previous;
  } else {
    sec.selectedIndex = 0;
  }
}

const armorIndexMap = { 0: 'Frame', 1: 'Armor', 2: 'Psy Armor', 3: 'Giga Frame', 4: 'Soul Frame', 5: 'Cross Armor', 6: 'Solid Frame', 7: 'Brave Armor', 8: 'Hyper Frame', 9: 'Grand Armor', 10: 'Shock Frame', 11: "King's Frame", 12: 'Dragon Frame', 13: 'Absorb Armor', 14: 'Protect Frame', 15: 'General Armor', 16: 'Perfect Frame', 17: 'Valiant Frame', 18: 'Imperial Armor', 19: 'Holiness Armor', 20: 'Guardian Armor' };

function renderArmorControls(){ const container = document.getElementById('armor-controls'); container.innerHTML = ''; const selectAll = document.createElement('button'); selectAll.textContent = 'Select All'; selectAll.type = 'button'; selectAll.addEventListener('click', ()=> container.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked = true)); const clearAll = document.createElement('button'); clearAll.textContent = 'Clear All'; clearAll.type = 'button'; clearAll.addEventListener('click', ()=> container.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked = false)); container.appendChild(selectAll); container.appendChild(clearAll); const grid = document.createElement('div'); grid.style.display = 'grid'; grid.style.gridTemplateColumns = 'repeat(4, 1fr)'; grid.style.gap = '6px'; Object.keys(armorIndexMap).forEach(k=>{ const idx = Number(k); const id = `armor-${idx}`; const label = document.createElement('label'); label.style.display='flex'; label.style.alignItems='center'; const cb = document.createElement('input'); cb.type='checkbox'; cb.id=id; cb.name='armor-type'; cb.value=String(idx); cb.checked=true; const span = document.createElement('span'); span.textContent = `${k} - ${armorIndexMap[k]}`; span.style.marginLeft='6px'; label.appendChild(cb); label.appendChild(span); grid.appendChild(label); }); container.appendChild(grid); }

function renderSlotControls(){
  const container = document.getElementById('slot-controls');
  container.innerHTML = '';
  const selectAll = document.createElement('button');
  selectAll.textContent = 'Select All';
  selectAll.type = 'button';
  selectAll.addEventListener('click', ()=> container.querySelectorAll('input[name=slot-count]').forEach(cb=>cb.checked = true));
  const clearAll = document.createElement('button');
  clearAll.textContent = 'Clear All';
  clearAll.type = 'button';
  clearAll.addEventListener('click', ()=> container.querySelectorAll('input[name=slot-count]').forEach(cb=>cb.checked = false));
  container.appendChild(selectAll);
  container.appendChild(clearAll);

  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.gap = '12px';
  for (let s = 0; s <= 4; s++){
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.name = 'slot-count';
    cb.value = String(s);
    cb.checked = (s === 3 || s === 4);
    const span = document.createElement('span');
    span.textContent = `${s} slots`;
    span.style.marginLeft = '6px';
    label.appendChild(cb);
    label.appendChild(span);
    wrapper.appendChild(label);
  }
  container.appendChild(wrapper);
}

function getSelectedArmorTypes(){ return Array.from(document.querySelectorAll('input[name=armor-type]:checked')).map(i=>Number(i.value)); }
function getSelectedSlots(){ return Array.from(document.querySelectorAll('input[name=slot-count]:checked')).map(i=>Number(i.value)); }

document.getElementById('run').addEventListener('click', async ()=>{
  if (!armor_random_tables_global || !slot_weight_lookup_global) { setStatus('Data not loaded yet.'); return; }
  try{
    const trials = Number(document.getElementById('trials').value) || 1000;
    const player_level = Number(document.getElementById('playerLevel').value) || 26;
    const section_id = document.getElementById('sectionId').value || 'Skyly';
    const difficulty = document.getElementById('difficulty').value || 'HARD';
    const seed = Number(document.getElementById('seed').value) || 0;
    const runBtn = document.getElementById('run'); runBtn.disabled = true;
    const selectedArmorTypes = getSelectedArmorTypes(); const selectedSlots = getSelectedSlots();
    if (!selectedArmorTypes || selectedArmorTypes.length === 0) { setStatus('Please select at least one armor type.'); runBtn.disabled = false; return; }
    if (!selectedSlots || selectedSlots.length === 0) { setStatus('Please select at least one slot count.'); runBtn.disabled = false; return; }
    setStatus('Running simulation...'); const progressEl = document.getElementById('status');
    const result = await monteCarloSimulation({trials, player_level, section_id, difficulty, seed, armor_random_tables: armor_random_tables_global, slot_weight_lookup: slot_weight_lookup_global, selectedArmorTypes, selectedSlots, onProgress: p => { progressEl.textContent = `Progress: ${Math.round(p*100)}%`; }});
    const metrics = document.getElementById('metrics'); metrics.innerHTML = `
      <p>Trials: ${result.trials}</p>
      <p>Fraction with at least one selected slot: ${result.fracHasSelectedSlots.toFixed(6)}</p>
      <p>Fraction with at least one selected armor: ${result.fracHasSelectedArmor.toFixed(6)}</p>
      <p>Fraction with at least one selected armor+slot: ${result.fracSelectedMatch.toFixed(6)}</p>
      <p>Average wait between shops matching selected armor+slot: ${result.avgWaitSelectedMatch===null? 'N/A' : result.avgWaitSelectedMatch.toFixed(2)}</p>
    `;
    if (result.matchIndices && result.matchIndices.length >= 2){ const diffs = []; for (let i=1;i<result.matchIndices.length;i++) diffs.push(result.matchIndices[i]-result.matchIndices[i-1]-1); drawHistogram(diffs); } else { drawHistogram([]); }
    setStatus('Done'); runBtn.disabled = false;
  }catch(err){ setStatus('Error: ' + err.message); console.error(err); const runBtn = document.getElementById('run'); if (runBtn) runBtn.disabled = false; }
});

window.addEventListener('DOMContentLoaded', ()=>{ renderArmorControls(); renderSlotControls(); initData(); document.getElementById('difficulty').addEventListener('change', (e)=> populateSections(e.target.value)); });

let chart = null;
function drawHistogram(data){ const ctx = document.getElementById('hist').getContext('2d'); const bins = 30; const max = data.length? Math.max(...data) : 1; const binWidth = Math.max(1, Math.ceil((max+1) / bins)); const counts = new Array(bins).fill(0); for (const v of data){ const b = Math.min(bins-1, Math.floor(v / binWidth)); counts[b]++; } const labels = counts.map((_,i)=>`${i*binWidth}-${(i+1)*binWidth-1}`); if (chart) chart.destroy(); chart = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Wait time frequency', data: counts }] }, options: { responsive: true } }); }


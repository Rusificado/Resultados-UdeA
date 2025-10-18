// script.js (versión con correcciones de fallback + indicación de archivo cargado)
const resultadosPath = './resultados/';

const searchForm = document.getElementById('searchForm');
const msg = document.getElementById('msg');
const previewSection = document.getElementById('previewSection');
const candidateNameEl = document.getElementById('candidateName');
const classAdmissionEl = document.getElementById('classAdmission');
const rlScoreEl = document.getElementById('rlScore');
const clScoreEl = document.getElementById('clScore');
const totalScoreEl = document.getElementById('totalScore');
const printViewBtn = document.getElementById('printViewBtn');
const clearBtn = document.getElementById('clearBtn');

let wordlist = []; // { name: normalizedName, file: filename, rawName }
let wordlistLoaded = false;
let lastCandidateFile = null; // archivo que se resolvió en la búsqueda

/* ------------------ Helpers UI ------------------ */
function ensureLoadedFileElement() {
  let el = document.getElementById('loadedFile');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loadedFile';
    el.style.marginTop = '8px';
    el.style.fontSize = '13px';
    el.style.color = '#444';
    // insert inside previewSection (if exists) below header
    const pdfPreview = document.getElementById('pdfPreview');
    if (pdfPreview) pdfPreview.appendChild(el);
    else document.body.appendChild(el);
  }
  return el;
}

function setLoadedFileUI(filename) {
  const el = ensureLoadedFileElement();
  if (filename) el.textContent = `Archivo cargado: ${filename}`;
  else el.textContent = '';
}

/* ------------------ Events ------------------ */

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';
  previewSection.classList.add('hidden');
  setLoadedFileUI('');
  lastCandidateFile = null;

  const firstRaw = document.getElementById('firstName').value.trim();
  const lastRaw = document.getElementById('lastName').value.trim();
  if (!firstRaw || !lastRaw) return;

  const fullRaw = `${firstRaw} ${lastRaw}`;
  const first = normalizeName(firstRaw);
  const last = normalizeName(lastRaw);
  const full = normalizeName(fullRaw);

  try {
    await loadWordlist();
    console.log('DEBUG: buscando ->', { firstRaw, lastRaw, fullRaw, normalized: { first, last, full } });
    const candidateFile = await findCandidateFileUsingWordlist(full, first, last, firstRaw, lastRaw, fullRaw);
    console.log('DEBUG: candidateFile resolved ->', candidateFile);

    if (!candidateFile) {
      msg.textContent = 'No se encontró un resultado para ese nombre. Si tienes un wordlist/manifest en resultados/, verifica que incluya el nombre y el archivo correcto.';
      return;
    }

    lastCandidateFile = candidateFile;
    // fetch the resolved file
    const fetched = await fetch(resultadosPath + encodeURIComponent(candidateFile));
    if (!fetched.ok) {
      throw new Error(`No se pudo leer el archivo: ${candidateFile} (status ${fetched.status})`);
    }
    const data = await fetched.text();
    const parsed = parseResultTxt(data);
    if (!parsed) {
      msg.textContent = 'El archivo encontrado no tiene el formato esperado o no contiene puntajes.';
      // show which file we tried
      setLoadedFileUI(candidateFile + ' (archivo leído, pero no contiene puntajes detectables)');
      return;
    }
    // success - show preview + file
    setLoadedFileUI(candidateFile);
    showPreview(parsed);
  } catch (err) {
    console.error(err);
    msg.textContent = 'Ocurrió un error al buscar el resultado. Revisa la consola para más detalles.';
  }
});

clearBtn.addEventListener('click', () => {
  previewSection.classList.add('hidden');
  msg.textContent = '';
  searchForm.reset();
  setLoadedFileUI('');
  lastCandidateFile = null;
});

printViewBtn.addEventListener('click', () => {
  const html = renderPrintableHTML({
    name: candidateNameEl.textContent,
    classAdmission: classAdmissionEl.textContent.replace('Clase: ', ''),
    rl: rlScoreEl.textContent,
    cl: clScoreEl.textContent,
    total: totalScoreEl.textContent,
  });
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
});

/* ------------------ Wordlist loader ------------------ */

async function loadWordlist() {
  if (wordlistLoaded) return;
  wordlist = [];

  // 1) wordlist.json
  try {
    const j = await fetch(resultadosPath + 'wordlist.json');
    if (j.ok) {
      const arr = await j.json();
      if (Array.isArray(arr)) {
        arr.forEach(it => {
          const raw = (it.name || '').trim();
          const file = (it.file || deriveFilenameFromName(raw)).trim();
          if (raw) wordlist.push({ name: normalizeName(raw), file, rawName: raw });
        });
        wordlistLoaded = true;
        console.log('DEBUG: loaded wordlist.json', wordlist);
        return;
      }
    }
  } catch (e) { /* ignore */ }

  // 2) manifest.json
  try {
    const m = await fetch(resultadosPath + 'manifest.json');
    if (m.ok) {
      const arr = await m.json();
      if (Array.isArray(arr)) {
        arr.forEach(it => {
          const raw = (it.name || '').trim();
          const file = (it.file || deriveFilenameFromName(raw)).trim();
          if (raw) wordlist.push({ name: normalizeName(raw), file, rawName: raw });
        });
        wordlistLoaded = true;
        console.log('DEBUG: loaded manifest.json', wordlist);
        return;
      }
    }
  } catch (e) { /* ignore */ }

  // 3) wordlist.txt
  try {
    const t = await fetch(resultadosPath + 'wordlist.txt');
    if (t.ok) {
      const text = await t.text();
      const lines = text.split(/\r?\n/);
      for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;
        let name = null, file = null;
        if (line.includes('|')) {
          const [a, b] = line.split('|').map(s => s.trim());
          name = a; file = b || deriveFilenameFromName(a);
        } else if (line.includes(',')) {
          const [a, b] = line.split(',').map(s => s.trim());
          name = a; file = b || deriveFilenameFromName(a);
        } else {
          name = line;
          file = deriveFilenameFromName(name);
        }
        if (name) wordlist.push({ name: normalizeName(name), file, rawName: name });
      }
      wordlistLoaded = true;
      console.log('DEBUG: loaded wordlist.txt', wordlist);
      return;
    }
  } catch (e) { /* ignore */ }

  wordlistLoaded = true;
  console.log('DEBUG: no wordlist found, continuing without it');
}

function deriveFilenameFromName(rawName) {
  if (!rawName) return '';
  const title = toTitleCase(rawName).replace(/\s+/g, ' ');
  return `${title}.txt`;
}

/* ---------- Búsqueda principal: wordlist -> fallback (CORREGIDO) ---------- */

async function findCandidateFileUsingWordlist(full, first, last, firstRaw = '', lastRaw = '', fullRaw = '') {
  // full, first, last aquí son normalizados (normalizeName)
  // 1) intentar emparejar con wordlist (si existe)
  if (wordlist.length > 0) {
    // exacto (normalizado)
    for (const item of wordlist) {
      if (item.name === full) {
        console.log('DEBUG: exact match in wordlist', item);
        return item.file;
      }
    }
    // contiene tokens first & last
    for (const item of wordlist) {
      if (item.name.includes(first) && item.name.includes(last)) {
        console.log('DEBUG: token contains first & last in wordlist', item);
        return item.file;
      }
    }
    // token intersection >= 2
    const queryTokens = full.split(' ').filter(Boolean);
    for (const item of wordlist) {
      const itemTokens = item.name.split(' ').filter(Boolean);
      const intersect = queryTokens.filter(t => itemTokens.includes(t));
      if (intersect.length >= 2) {
        console.log('DEBUG: token intersection >=2 in wordlist', item, intersect);
        return item.file;
      }
    }
    // fuzzy Levenshtein sobre nombre completo (umbral relativo)
    let best = { dist: Infinity, item: null };
    for (const item of wordlist) {
      const d = levenshteinDistance(full, item.name);
      if (d < best.dist) best = { dist: d, item };
    }
    const threshold = Math.max(2, Math.round(full.length * 0.25));
    console.log('DEBUG: fuzzy best', best, 'threshold', threshold);
    if (best.item && best.dist <= threshold) {
      console.log('DEBUG: fuzzy matched wordlist item', best.item, best.dist);
      return best.item.file;
    }

    // IMPORTANT: si existe un wordlist y no hubo match, **no** fallbacks automáticos.
    // Esto evita devolver archivos aleatorios (p. ej. Angie Melina.txt) cuando el wordlist
    // no corresponde con la búsqueda.
    console.log('DEBUG: wordlist present but no match found -> aborting fallback to avoid false positives');
    return null;
  }

  // Si no hay wordlist, usar el fallback que prueba variantes sobre los nombres.
  return await findCandidateFileFallback(first, last, firstRaw, lastRaw, fullRaw);
}

/* ---------- Fallback (solo si NO hay wordlist) ---------- */

async function findCandidateFileFallback(firstNorm, lastNorm, firstRaw, lastRaw, fullRaw) {
  const variants = buildFilenameVariants(firstRaw, lastRaw, fullRaw, firstNorm, lastNorm);

  // probar HEAD con validación
  for (const name of variants) {
    try {
      const url = resultadosPath + encodeURIComponent(name);
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) {
        const nameWithoutExt = decodeURIComponent(name).replace(/\.txt$/i, '').trim();
        const normFileName = normalizeName(nameWithoutExt);
        const fullNorm = normalizeName(fullRaw || `${firstRaw} ${lastRaw}`);
        const hasBoth = (firstNorm && lastNorm) ? (normFileName.includes(firstNorm) && normFileName.includes(lastNorm)) : false;
        const hasFull = fullNorm && normFileName.includes(fullNorm);
        if (hasBoth || hasFull) return name;
        const dist = levenshteinDistance(normFileName, fullNorm);
        const fuzzyThreshold = Math.max(2, Math.round(fullNorm.length * 0.25));
        if (dist <= fuzzyThreshold) return name;
      }
    } catch (e) { /* ignore */ }
  }

  // probar GET (por si el servidor no deja HEAD)
  for (const name of variants) {
    try {
      const url = resultadosPath + encodeURIComponent(name);
      const res = await fetch(url);
      if (res.ok) {
        const nameWithoutExt = decodeURIComponent(name).replace(/\.txt$/i, '').trim();
        const normFileName = normalizeName(nameWithoutExt);
        const fullNorm = normalizeName(fullRaw || `${firstRaw} ${lastRaw}`);
        const hasBoth = (firstNorm && lastNorm) ? (normFileName.includes(firstNorm) && normFileName.includes(lastNorm)) : false;
        const hasFull = fullNorm && normFileName.includes(fullNorm);
        if (hasBoth || hasFull) return name;
        const dist = levenshteinDistance(normFileName, fullNorm);
        const fuzzyThreshold = Math.max(2, Math.round(fullNorm.length * 0.25));
        if (dist <= fuzzyThreshold) return name;
      }
    } catch (e) { /* ignore */ }
  }

  return null;
}

/* ---------- Variants builder ---------- */

function buildFilenameVariants(firstRaw, lastRaw, fullRaw, firstNorm, lastNorm) {
  const list = [];
  const fRaw = (firstRaw || '').trim();
  const lRaw = (lastRaw || '').trim();
  const fullRawTrim = (fullRaw || '').trim();
  const fLower = fRaw.toLowerCase();
  const lLower = lRaw.toLowerCase();
  const fullLower = fullRawTrim.toLowerCase();

  if (fRaw && lRaw) list.push(`${toTitleCase(fRaw)} ${toTitleCase(lRaw)}.txt`);
  if (fullRawTrim) list.push(`${toTitleCase(fullRawTrim)}.txt`);

  if (fRaw && lRaw) list.push(`${fRaw} ${lRaw}.txt`);
  if (fullRawTrim) list.push(`${fullRawTrim}.txt`);

  if (fRaw && lRaw) list.push(`${fLower} ${lLower}.txt`);
  if (fullRawTrim) list.push(`${fullLower}.txt`);

  if (fRaw && lRaw) {
    list.push(`${toTitleCase(fRaw)}-${toTitleCase(lRaw)}.txt`);
    list.push(`${toTitleCase(fRaw)}_${toTitleCase(lRaw)}.txt`);
    list.push(`${fRaw}-${lRaw}.txt`);
    list.push(`${fRaw}_${lRaw}.txt`);
    list.push(`${(fLower + '-' + lLower)}.txt`);
    list.push(`${(fLower + '_' + lLower)}.txt`);
    list.push(`${(fLower + lLower)}.txt`);
    list.push(`${(fLower + '.' + lLower)}.txt`);
  }

  if (fRaw) {
    list.push(`${toTitleCase(fRaw)}.txt`);
    list.push(`${fRaw}.txt`);
    list.push(`${fRaw.toLowerCase()}.txt`);
  }

  if (fRaw && lRaw) {
    list.push(`${toTitleCase(lRaw)} ${toTitleCase(fRaw)}.txt`);
    list.push(`${lRaw} ${fRaw}.txt`);
    list.push(`${(lLower + ' ' + fLower)}.txt`);
    list.push(`${toTitleCase(lRaw)}-${toTitleCase(fRaw)}.txt`);
  }

  if (fullRawTrim) {
    list.push(deriveFilenameFromName(fullRawTrim));
  }

  const seen = new Set();
  return list.filter(n => {
    if (!n) return false;
    const k = n.trim();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/* ---------- Utilidades ---------- */

function normalizeName(s) {
  if (!s) return '';
  const t = s.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return t.replace(/[^a-zñ\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function toTitleCase(s) {
  if (!s) return '';
  return s.toString().toLowerCase().split(/\s+/).filter(Boolean).map(w => {
    return w[0] ? w[0].toUpperCase() + w.slice(1) : w;
  }).join(' ');
}

function levenshteinDistance(a, b) {
  if (a === b) return 0;
  const al = a.length, bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  const v0 = new Array(bl + 1).fill(0);
  const v1 = new Array(bl + 1).fill(0);
  for (let j = 0; j <= bl; j++) v0[j] = j;
  for (let i = 0; i < al; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < bl; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= bl; j++) v0[j] = v1[j];
  }
  return v1[bl];
}

/* ---------- Parsing robusto: extrae los puntajes (RL, CL, Total) ---------- */

function parseResultTxt(txt) {
  if (!txt || typeof txt !== 'string') return null;
  const raw = txt.replace(/\r/g, '\n').replace(/,/g, '.');

  const reRazonamiento = /razonamiento\s*l[oó]gico\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*40(?:\s*->\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*100)?/i;
  const reComprension   = /comprensi[oó]n\s*lectora\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*40(?:\s*->\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*100)?/i;
  const reTotal         = /total\s*:\s*([0-9]+(?:\.[0-9]+)?)(?:\s*\/\s*100)?/i;

  const result = { name: null, classAdmission: null, rl: null, cl: null, total: null };

  const mName = raw.match(/resultado\s+examen[^\n-]*-\s*(.+)/i);
  if (mName && mName[1]) {
    result.name = mName[1].split('\n')[0].trim();
    result.name = result.name.replace(/=+$/,'').trim();
  }

  const mClase = raw.match(/clase\s+de\s+admis[ií]on\s*:\s*(.+)/i);
  if (mClase && mClase[1]) {
    result.classAdmission = mClase[1].split('\n')[0].trim();
  }

  const mR = raw.match(reRazonamiento);
  if (mR) {
    if (mR[2]) result.rl = parseFloat(mR[2]);
    else {
      const rawScore = parseFloat(mR[1]);
      if (!isNaN(rawScore)) result.rl = Math.round((rawScore / 40) * 100 * 100) / 100;
    }
  }

  const mC = raw.match(reComprension);
  if (mC) {
    if (mC[2]) result.cl = parseFloat(mC[2]);
    else {
      const rawScore = parseFloat(mC[1]);
      if (!isNaN(rawScore)) result.cl = Math.round((rawScore / 40) * 100 * 100) / 100;
    }
  }

  const mT = raw.match(reTotal);
  if (mT && mT[1]) result.total = parseFloat(mT[1]);

  result.rl = (result.rl !== null && !isNaN(result.rl)) ? Math.round(result.rl * 100) / 100 : null;
  result.cl = (result.cl !== null && !isNaN(result.cl)) ? Math.round(result.cl * 100) / 100 : null;

  if ((result.total === null || isNaN(result.total)) && result.rl !== null && result.cl !== null) {
    result.total = Math.round(((result.rl + result.cl) / 2) * 100) / 100;
  }

  if (!result.name) {
    const firstLine = raw.split(/\n+/).map(s => s.trim()).find(Boolean);
    if (firstLine) result.name = firstLine;
  }

  if ((result.rl === null || isNaN(result.rl)) && (result.cl === null || isNaN(result.cl)) && (result.total === null || isNaN(result.total))) {
    return null;
  }

  return result;
}

/* ---------- Mostrar previsualización ---------- */

function showPreview(parsed) {
  candidateNameEl.textContent = parsed.name;
  classAdmissionEl.textContent = 'Clase: ' + (parsed.classAdmission || 'NUEVOS PREGRADO');
  rlScoreEl.textContent = (parsed.rl !== null ? parsed.rl : 0) + ' / 100';
  clScoreEl.textContent = (parsed.cl !== null ? parsed.cl : 0) + ' / 100';
  totalScoreEl.textContent = (parsed.total !== null ? parsed.total : 0) + ' / 100';
  previewSection.classList.remove('hidden');
  try {
    drawChart([parsed.rl || 0, parsed.cl || 0, parsed.total || 0]);
  } catch (e) {
    // ignore chart errors
  }
}

/* drawChart: si no tienes canvas/ctx globales, no rompe la búsqueda */
function drawChart(values) {
  if (typeof ctx === 'undefined' || typeof w === 'undefined' || typeof h === 'undefined') return;
  ctx.clearRect(0,0,w,h);
  const labels = ['Razonamiento','Comprensión','Total'];
  const max = 100;
  const barW = 80;
  const gap = 30;
  const startX = 40;
  ctx.font = '14px Arial';
  for (let i=0;i<values.length;i++){
    const x = startX + i*(barW+gap);
    const val = (typeof values[i] === 'number') ? values[i] : 0;
    const barH = (val / max) * (h - 40);
    ctx.fillStyle = '#0a7a3a';
    ctx.fillRect(x, h - barH - 30, barW, barH);
    ctx.fillStyle = '#000';
    ctx.fillText(labels[i], x, h-8);
    ctx.fillText((Math.round(val * 100) / 100) + '/100', x, h - barH - 40);
  }
}

function renderPrintableHTML(obj) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Imprimir - Resultado</title>
  <style>body{font-family:Arial;padding:24px} .h{color:#0a7a3a} .row{display:flex;justify-content:space-between;margin:8px 0}</style>
  </head><body>
  <h1 class="h">Resultado Examen de Admisión UdeA</h1>
  <div class="row"><strong>Nombre:</strong><span>${obj.name}</span></div>
  <div class="row"><strong>Clase:</strong><span>${obj.classAdmission}</span></div>
  <div class="row"><strong>Razonamiento Lógico:</strong><span>${obj.rl}</span></div>
  <div class="row"><strong>Comprensión Lectora:</strong><span>${obj.cl}</span></div>
  <div class="row"><strong>Total:</strong><span>${obj.total}</span></div>
  </body></html>`;
}

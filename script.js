// script.js (actualizado) - incluye lista de cortePrograms y populatePrograms(cortePrograms)
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

// enrollment elements
const enrollmentCard = document.getElementById('enrollmentCard');
const enrollBtn = document.getElementById('enrollBtn');
const enrollMsg = document.getElementById('enrollMsg');
const programSelect = document.getElementById('programSelect');

let wordlist = []; // { name: normalizedName, file: filename, rawName }
let wordlistLoaded = false;
let lastCandidateFile = null;
let lastParsedResult = null; // objeto parseado del .txt
let availablePrograms = []; // lista que populatePrograms guardará

// ------------------ Lista de programas + puntajes de corte (tomada de la imagen) ------------------
const cortePrograms = [
  { code: 'ING-SIS', name: 'INGENIERÍA DE SISTEMAS', minScore: 86.13 },
  { code: 'MED', name: 'MEDICINA', minScore: 85.383 },
  { code: 'LIC-LENG', name: 'LIC. LENG. EXT. (INGLÉS/FRANCÉS)', minScore: 82.747 },
  { code: 'QUIM-FAR', name: 'QUÍMICA FARMACÉUTICA', minScore: 81.67 },
  { code: 'ING-CIV', name: 'INGENIERÍA CIVIL', minScore: 80.295 },
  { code: 'MED-VET', name: 'MEDICINA VETERINARIA', minScore: 80.295 },
  { code: 'NUT', name: 'NUTRICIÓN Y DIETÉTICA', minScore: 79.927 },
  { code: 'PSI', name: 'PSICOLOGÍA', minScore: 79.382 },
  { code: 'TRAD', name: 'TRADUCCIÓN (ING-FR-ESP)', minScore: 79.31 },
  { code: 'INST-QUIR', name: 'INSTRUMENTACIÓN QUIRÚRGICA', minScore: 78.10 },
  { code: 'COM-AUD', name: 'COMUNICACIÓN AUDIOVISUAL Y MULTIMEDIA', minScore: 76.057 },
  { code: 'ODO', name: 'ODONTOLOGÍA', minScore: 75.818 },
  { code: 'BIOING', name: 'BIOINGENIERÍA', minScore: 75.743 },
  { code: 'PERI', name: 'PERIODISMO', minScore: 75.111 },
  { code: 'ENF', name: 'ENFERMERÍA', minScore: 74.528 },
  { code: 'ING-SIS-V', name: 'ING. SISTEMAS VIRTUAL MEDELLÍN', minScore: 74.208 },
  { code: 'ING-IND', name: 'INGENIERÍA INDUSTRIAL', minScore: 74.195 },
  { code: 'ART-PLA', name: 'ARTES PLÁSTICAS', minScore: 73.495 },
  { code: 'MICROBIO', name: 'MICROBIOLOGÍA Y BIOANÁLISIS', minScore: 73.495 },
  { code: 'DER', name: 'DERECHO', minScore: 73.245 },
  { code: 'ENT-DEP', name: 'ENTRENAMIENTO DEPORTIVO', minScore: 73.245 },
  { code: 'FILO-H', name: 'FILOLOGÍA HISPÁNICA', minScore: 72.046 },
  { code: 'ING-ELEC', name: 'INGENIERÍA ELECTRÓNICA', minScore: 72.046 },
  { code: 'ING-MEC', name: 'INGENIERÍA MECÁNICA', minScore: 69.259 },
  { code: 'ING-QUI', name: 'INGENIERÍA QUÍMICA', minScore: 69.259 },
  { code: 'BIO', name: 'BIOLOGÍA', minScore: 68.728 },
  { code: 'ADM-EMP', name: 'ADMINISTRACIÓN DE EMPRESAS', minScore: 66.686 },
  { code: 'ECO', name: 'ECONOMÍA', minScore: 66.686 },
  { code: 'COM', name: 'COMUNICACIONES', minScore: 66.54 },
  { code: 'CONT', name: 'CONTADURÍA', minScore: 66.277 },
  { code: 'ASTRO', name: 'ASTRONOMÍA', minScore: 66.194 },
  { code: 'ING-AM', name: 'INGENIERÍA AMBIENTAL', minScore: 65.784 },
  { code: 'TEC-AT-PREH', name: 'TECNOLOGÍA ATENCIÓN PREHOSPITALARIA', minScore: 65.106 },
  { code: 'LIC-LIT', name: 'LIC. EN LITERATURA (CASTELLANO)', minScore: 65.106 },
  { code: 'LIC-ART', name: 'LIC. EN ARTES PLÁSTICAS', minScore: 65.082 },
  { code: 'ZOOT', name: 'ZOOTECNIA', minScore: 63.621 },
  { code: 'LIC-EF', name: 'LIC. EN EDUCACIÓN FÍSICA', minScore: 60.821 },
  { code: 'LIC-CS', name: 'LIC. EN CIENCIAS SOCIALES', minScore: 59.229 },
  { code: 'ING-ELECTR', name: 'INGENIERÍA ELÉCTRICA', minScore: 59.075 },
  { code: 'LIC-FIL', name: 'LICENCIATURA EN FILOSOFÍA', minScore: 59.075 },
  { code: 'ADM-SAL', name: 'ADMINISTRACIÓN EN SALUD', minScore: 58.689 },
  { code: 'ING-SIS-REG', name: 'ING. DE SISTEMAS (REGIÓN)', minScore: 58.243 },
  { code: 'TRAB-SOC', name: 'TRABAJO SOCIAL', minScore: 57.523 },
  { code: 'ANT', name: 'ANTROPOLOGÍA', minScore: 57.451 },
  { code: 'LIC-INF', name: 'LIC. EN EDUCACIÓN (INFANTIL)', minScore: 56.657 },
  { code: 'CPO', name: 'CIENCIA POLÍTICA', minScore: 54.911 },
  { code: 'SOC', name: 'SOCIOLOGÍA', minScore: 54.508 },
  { code: 'MIC-IND', name: 'MICROBIOLOGÍA INDUSTRIAL-AMBIENTAL', minScore: 54.508 },
  { code: 'FIS', name: 'FÍSICA', minScore: 49.198 },
  { code: 'ING-ALIM', name: 'INGENIERÍA DE ALIMENTOS', minScore: 49.198 },
  { code: 'FIL', name: 'FILOSOFÍA', minScore: 45.969 },
  { code: 'PED', name: 'PEDAGOGÍA', minScore: 45.969 },
  { code: 'TECN-REG-FAR', name: 'TECN. REGENCIA EN FARMACIA', minScore: 41.543 },
  { code: 'ING-TEL', name: 'ING. TELECOMUNICACIONES', minScore: 38.939 },
  { code: 'ING-AM-REG', name: 'ING. AMBIENTAL (REGIÓN)', minScore: 37.209 },
  { code: 'HIS', name: 'HISTORIA', minScore: 35.982 },
  { code: 'ING-IND-REG', name: 'INGENIERÍA INDUSTRIAL (REGIÓN)', minScore: 35.280 },
  { code: 'GEST-CUL', name: 'GESTIÓN CULTURAL', minScore: 29.309 },
  { code: 'BIB', name: 'BIBLIOTECOLOGÍA', minScore: 27.251 },
  { code: 'LIC-MAT', name: 'LICENCIATURA EN MATEMÁTICAS', minScore: 19.025 },
  { code: 'EST', name: 'ESTADÍSTICA', minScore: 17.913 },
  { code: 'MAT', name: 'MATEMÁTICAS', minScore: 16.224 },
  { code: 'ADM-AMB-SAN', name: 'ADMÓN. AMBIENTAL SANITARIA', minScore: 8.283 },
  { code: 'QUIM', name: 'QUÍMICA (otras sedes/áreas)', minScore: 6.743 },
  { code: 'GEST-SIS-SAL', name: 'GESTIÓN SISTEMAS INFORMACIÓN SALUD', minScore: 0.898 }
];

// Auto-populate programs on load
function populatePrograms(list) {
  availablePrograms = Array.isArray(list) ? list.slice() : [];
  programSelect.innerHTML = '<option value="">-- Selecciona un programa --</option>';
  list.forEach(it => {
    const opt = document.createElement('option');
    // guardamos el code como value para buscar rapido; si no existe, usamos el name
    opt.value = it.code || it.name;
    opt.textContent = (it.name);
    programSelect.appendChild(opt);
  });
}

// llamar populatePrograms con nuestro listado
populatePrograms(cortePrograms);

// ------------------ Wordlist loader y búsqueda (idéntico a versiones previas) ------------------
async function loadWordlist() {
  if (wordlistLoaded) return;
  wordlist = [];

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
        return;
      }
    }
  } catch (e) { /* ignore */ }

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
        return;
      }
    }
  } catch (e) { /* ignore */ }

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
      return;
    }
  } catch (e) { /* ignore */ }

  wordlistLoaded = true;
}

function deriveFilenameFromName(rawName) {
  if (!rawName) return '';
  const title = toTitleCase(rawName).replace(/\s+/g, ' ');
  return `${title}.txt`;
}

async function findCandidateFileUsingWordlist(full, first, last, firstRaw = '', lastRaw = '', fullRaw = '') {
  if (wordlist.length > 0) {
    for (const item of wordlist) {
      if (item.name === full) return item.file;
    }
    for (const item of wordlist) {
      if (item.name.includes(first) && item.name.includes(last)) return item.file;
    }
    const queryTokens = full.split(' ').filter(Boolean);
    for (const item of wordlist) {
      const itemTokens = item.name.split(' ').filter(Boolean);
      const intersect = queryTokens.filter(t => itemTokens.includes(t));
      if (intersect.length >= 2) return item.file;
    }
    let best = { dist: Infinity, item: null };
    for (const item of wordlist) {
      const d = levenshteinDistance(full, item.name);
      if (d < best.dist) best = { dist: d, item };
    }
    const threshold = Math.max(2, Math.round(full.length * 0.25));
    if (best.item && best.dist <= threshold) return best.item.file;
    return null;
  }

  return await findCandidateFileFallback(first, last, firstRaw, lastRaw, fullRaw);
}

async function findCandidateFileFallback(firstNorm, lastNorm, firstRaw, lastRaw, fullRaw) {
  const variants = buildFilenameVariants(firstRaw, lastRaw, fullRaw, firstNorm, lastNorm);

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

/* ---------- Parsing robusto: puntajes (RL, CL, Total) y respuestas vacías ---------- */
function extractEmptyAnswers(txt) {
  if (!txt || typeof txt !== 'string') return [];
  const lines = txt.replace(/\r/g,'\n').split(/\n+/);
  const empties = [];
  const numberedRegex = /^\s*(\d{1,3})\s*[\.)\-:\t]+\s*([^\n\r]*)$/;
  let foundNumbered = false;
  for (const line of lines) {
    const m = line.match(numberedRegex);
    if (m) {
      foundNumbered = true;
      const qnum = parseInt(m[1], 10);
      const answer = (m[2] || '').trim();
      if (!answer || /^[-–—]+$/.test(answer) || /^vac(?:ía|ia)$/i.test(answer) || /^\-+$/.test(answer)) {
        empties.push(qnum);
      }
    }
  }
  if (foundNumbered) return empties.sort((a,b)=>a-b);
  const tokens = txt.split(/[\s,;\t]+/).filter(Boolean);
  const emptiesIdx = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].trim();
    if (/^[-–—]+$/.test(t) || /^vac(?:ía|ia)$/i.test(t) || t === '') emptiesIdx.push(i + 1);
  }
  if (emptiesIdx.length) return emptiesIdx;
  const dashMatches = txt.match(/(^|\s)[-–—](\s|$)/g);
  return dashMatches ? new Array(dashMatches.length).fill(0).map((_,i)=>i+1) : [];
}

function parseResultTxt(txt) {
  if (!txt || typeof txt !== 'string') return null;
  const raw = txt.replace(/\r/g, '\n').replace(/,/g, '.');
  const reRazonamiento = /razonamiento\s*l[oó]gico\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*40(?:\s*->\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*100)?/i;
  const reComprension   = /comprensi[oó]n\s*lectora\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*40(?:\s*->\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*100)?/i;
  const reTotal         = /total\s*:\s*([0-9]+(?:\.[0-9]+)?)(?:\s*\/\s*100)?/i;
  const result = { name: null, classAdmission: null, rl: null, cl: null, total: null, emptyAnswers: [] };
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
  try {
    const empties = extractEmptyAnswers(txt);
    result.emptyAnswers = Array.isArray(empties) ? empties : [];
  } catch (e) {
    result.emptyAnswers = [];
  }
  if ((result.rl === null || isNaN(result.rl)) && (result.cl === null || isNaN(result.cl)) && (result.total === null || isNaN(result.total))) {
    if (result.emptyAnswers && result.emptyAnswers.length) return result;
    return null;
  }
  return result;
}

/* ---------- Mostrar previsualización (sin mostrar nombre de archivo) ---------- */
function showPreview(parsed) {
  candidateNameEl.textContent = parsed.name || '—';
  classAdmissionEl.textContent = 'Clase: ' + (parsed.classAdmission || 'NUEVOS PREGRADO');
  rlScoreEl.textContent = (parsed.rl !== null ? parsed.rl : 0) + ' / 100';
  clScoreEl.textContent = (parsed.cl !== null ? parsed.cl : 0) + ' / 100';
  totalScoreEl.textContent = (parsed.total !== null ? parsed.total : 0) + ' / 100';
  previewSection.classList.remove('hidden');
}

/* ---------- Manejo del formulario y la inscripción ---------- */
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';
  if (previewSection) previewSection.classList.remove('hidden');
  enrollmentCard.style.display = 'none';
  enrollMsg.textContent = '';
  lastCandidateFile = null;
  lastParsedResult = null;

  const firstRaw = document.getElementById('firstName').value.trim();
  const lastRaw = document.getElementById('lastName').value.trim();
  if (!firstRaw || !lastRaw) return;

  const fullRaw = `${firstRaw} ${lastRaw}`;
  const first = normalizeName(firstRaw);
  const last = normalizeName(lastRaw);
  const full = normalizeName(fullRaw);

  try {
    await loadWordlist();
    const candidateFile = await findCandidateFileUsingWordlist(full, first, last, firstRaw, lastRaw, fullRaw);
    if (!candidateFile) {
      msg.textContent = 'No se encontró un resultado para ese nombre. O el aspirante aún no tiene respuestas subidas en el sistema.';
      return;
    }

    lastCandidateFile = candidateFile;
    const fetched = await fetch(resultadosPath + encodeURIComponent(candidateFile));
    if (!fetched.ok) {
      throw new Error(`No se pudo leer el archivo: ${candidateFile} (status ${fetched.status})`);
    }
    const data = await fetched.text();
    const parsed = parseResultTxt(data);
    if (!parsed) {
      msg.textContent = 'El archivo encontrado no tiene el formato esperado o no contiene puntajes.';
      return;
    }

    lastParsedResult = parsed;
    showPreview(parsed);

    // mostrar tarjeta de inscripción ahora que hay resultado
    enrollmentCard.style.display = 'block';
    enrollMsg.textContent = '';

    if (parsed.emptyAnswers && parsed.emptyAnswers.length) {
      console.log(`DEBUG: respuestas vacías detectadas (${parsed.emptyAnswers.length}):`, parsed.emptyAnswers);
    }

  } catch (err) {
    console.error(err);
    msg.textContent = 'Ocurrió un error al buscar el resultado. Revisa la consola para más detalles.';
  }
});

clearBtn.addEventListener('click', () => {
  if (previewSection) previewSection.classList.add('hidden');
  msg.textContent = '';
  searchForm.reset();
  lastCandidateFile = null;
  lastParsedResult = null;
  enrollmentCard.style.display = 'none';
  enrollMsg.textContent = '';
});

// Al inscribirse: comparar puntaje del aspirante con el puntaje de corte del programa seleccionado
enrollBtn.addEventListener('click', () => {
  enrollMsg.textContent = '';
  enrollMsg.style.color = '';
  const selectedValue = programSelect.value;
  if (!selectedValue) {
    enrollMsg.textContent = 'Selecciona primero un programa.';
    enrollMsg.style.color = '#b00';
    return;
  }
  if (!lastParsedResult || typeof lastParsedResult.total !== 'number' || isNaN(lastParsedResult.total)) {
    enrollMsg.textContent = 'No hay puntaje válido para comparar. Consulta tu resultado primero.';
    enrollMsg.style.color = '#b00';
    return;
  }

  // buscar programa por code o por nombre en availablePrograms
  const program = availablePrograms.find(p => (p.code === selectedValue) || (p.name === selectedValue));
  // si no se encuentra por code, intentar por name
  const programByName = availablePrograms.find(p => p.name === programSelect.options[programSelect.selectedIndex].text.split(' (Corte:')[0]);
  const chosen = program || programByName;

  if (!chosen) {
    enrollMsg.textContent = 'Programa no encontrado en la lista.';
    enrollMsg.style.color = '#b00';
    return;
  }

  const corte = parseFloat(chosen.minScore);
  const total = parseFloat(lastParsedResult.total);

  if (isNaN(corte)) {
    enrollMsg.textContent = 'Puntaje de corte inválido para el programa seleccionado.';
    enrollMsg.style.color = '#b00';
    return;
  }

  if (total >= corte) {
    enrollMsg.textContent = 'ADMITID@';
    enrollMsg.style.color = '#0a7a3a';
  } else {
    enrollMsg.textContent = 'NO ADMITID@';
    enrollMsg.style.color = '#c62828';
  }
});

/* ---------------------------------------------------------------------------------- */
/* Si quieres, puedes exponer populatePrograms globalmente para actualizar la lista desde fuera */
window.populatePrograms = populatePrograms;

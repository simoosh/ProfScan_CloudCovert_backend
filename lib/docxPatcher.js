// =============================================================================
// lib/docxPatcher.js — Chirurgie XML : injection d'OMML dans le .docx
// =============================================================================
import JSZip from 'jszip';

// Namespace mathématique Office Open XML
const MATH_NS = 'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"';

/**
 * Ouvre un Buffer .docx, localise les traceurs textuels ($$$MATH_OMML_N$$$)
 * dans word/document.xml et les remplace par le code OMML correspondant.
 */
export async function patchDocxWithOmml(docxBuffer, mathMap) {
  const placeholders = Object.keys(mathMap);
  if (placeholders.length === 0) {
    console.log('      → Aucune équation à injecter.');
    return docxBuffer;
  }

  const zip = await JSZip.loadAsync(docxBuffer);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('word/document.xml introuvable dans le .docx.');
  }

  let docXml = await docXmlFile.async('string');

  // Ajouter le namespace math s'il est absent
  if (!docXml.includes(MATH_NS)) {
    docXml = docXml.replace('<w:document ', `<w:document ${MATH_NS} `);
    console.log('      → Namespace xmlns:m ajouté.');
  }

  // Diagnostic
  console.log(`      → ${placeholders.length} traceur(s) à injecter.`);
  for (const ph of placeholders) {
    console.log(`        [${ph}] intact=${docXml.includes(ph)}`);
  }

  // Traiter paragraphe par paragraphe
  docXml = processAllParagraphs(docXml, mathMap);

  // Fallback brut pour les traceurs encore présents
  for (const [placeholder, { omml, isDisplay }] of Object.entries(mathMap)) {
    if (docXml.includes(placeholder)) {
      console.log(`      → Fallback brut pour "${placeholder}".`);
      const ommlContent = isDisplay ? `<m:oMathPara>${omml}</m:oMathPara>` : omml;
      docXml = docXml.split(placeholder).join(ommlContent);
    }
  }

  // Vérification finale
  for (const ph of placeholders) {
    if (docXml.includes(ph)) {
      console.warn(`⚠️  "${ph}" toujours présent après patching !`);
    } else {
      console.log(`      ✓ "${ph}" injecté.`);
    }
  }

  zip.file('word/document.xml', docXml);
  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

// =============================================================================
// processAllParagraphs — Itère sur chaque <w:p>
// =============================================================================
function processAllParagraphs(docXml, mathMap) {
  const parts = [];
  let lastIndex = 0;
  const paraRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let m;

  while ((m = paraRegex.exec(docXml)) !== null) {
    parts.push(docXml.substring(lastIndex, m.index));
    lastIndex = m.index + m[0].length;
    parts.push(processParagraph(m[0], mathMap));
  }

  parts.push(docXml.substring(lastIndex));
  return parts.join('');
}

// =============================================================================
// processParagraph — Traite un seul <w:p>
// =============================================================================
function processParagraph(paraXml, mathMap) {
  const fullText = extractFullText(paraXml);

  // Trouver tous les placeholders dans ce paragraphe
  const present = [];
  for (const ph of Object.keys(mathMap)) {
    if (fullText.includes(ph)) {
      present.push(ph);
    }
  }

  if (present.length === 0) return paraXml;

  console.log(`        Paragraphe contient: [${present.join(', ')}]`);

  // Vérifier si le paragraphe ne contient QUE des placeholders (pas de vrai texte)
  const nonPlaceholderText = present.reduce(
    (txt, ph) => txt.split(ph).join(''),
    fullText,
  ).trim();

  // Cas display seul : remplacer tout le paragraphe
  if (present.length === 1 && nonPlaceholderText === '') {
    const ph = present[0];
    const { omml, isDisplay } = mathMap[ph];
    if (isDisplay) {
      const pPr = extractPPr(paraXml);
      console.log(`          → Remplacement complet (display seul).`);
      return `<w:p>${pPr}<m:oMathPara>${omml}</m:oMathPara></w:p>`;
    }
  }

  // Cas mixte (texte + placeholders) : remplacement CHIRURGICAL
  return surgicalReplace(paraXml, present, mathMap, fullText);
}

// =============================================================================
// surgicalReplace — Remplace les placeholders dans un paragraphe en
// PRÉSERVANT le formatage original (rPr) de chaque run non-placeholder.
// =============================================================================
function surgicalReplace(paraXml, placeholders, mathMap, fullText) {
  const pPr = extractPPr(paraXml);

  // 1. Extraire tous les runs dans l'ordre avec leur texte et formatage
  const runs = [];
  const runRegex = /<w:r[\s>][\s\S]*?<\/w:r>/g;
  let rm;
  while ((rm = runRegex.exec(paraXml)) !== null) {
    runs.push({
      xml: rm[0],
      text: extractFullText(rm[0]),
      rPr: extractRPr(rm[0]),
    });
  }

  // 2. Construire la carte : pour chaque caractère du fullText, quel run ?
  const charToRunIdx = [];
  for (let i = 0; i < runs.length; i++) {
    for (let c = 0; c < runs[i].text.length; c++) {
      charToRunIdx.push(i);
    }
  }

  // 3. Localiser chaque placeholder dans le fullText
  const replacements = [];
  for (const ph of placeholders) {
    const idx = fullText.indexOf(ph);
    if (idx === -1) continue;
    replacements.push({
      placeholder: ph,
      startChar: idx,
      endChar: idx + ph.length,
      startRun: charToRunIdx[idx],
      endRun: charToRunIdx[idx + ph.length - 1],
    });
  }

  // Trier par position
  replacements.sort((a, b) => a.startChar - b.startChar);

  // 4. Construire la sortie en préservant les runs originaux
  const output = [];
  let currentRunIdx = 0;

  for (const repl of replacements) {
    const { omml, isDisplay } = mathMap[repl.placeholder];
    const ommlContent = isDisplay ? `<m:oMathPara>${omml}</m:oMathPara>` : omml;

    // Calculer l'offset du placeholder dans le run de début
    let charsBeforeInRun = repl.startChar;
    for (let i = 0; i < repl.startRun; i++) {
      charsBeforeInRun -= runs[i].text.length;
    }

    // Calculer l'offset de fin du placeholder dans le run de fin
    let charsConsumedInEndRun = repl.endChar;
    for (let i = 0; i < repl.endRun; i++) {
      charsConsumedInEndRun -= runs[i].text.length;
    }

    // A. Ajouter tous les runs non-modifiés AVANT le placeholder
    while (currentRunIdx < repl.startRun) {
      output.push(runs[currentRunIdx].xml);
      currentRunIdx++;
    }

    // B. Texte AVANT le placeholder dans le run de début
    const textBefore = runs[repl.startRun].text.substring(0, charsBeforeInRun);
    if (textBefore) {
      output.push(makeRun(runs[repl.startRun].rPr, textBefore));
    }

    // C. Injecter l'OMML
    console.log(`          → Injection ${isDisplay ? 'display' : 'inline'} "${repl.placeholder}"`);
    output.push(ommlContent);

    // D. Texte APRÈS le placeholder dans le run de fin
    const textAfter = runs[repl.endRun].text.substring(charsConsumedInEndRun);
    if (textAfter) {
      output.push(makeRun(runs[repl.endRun].rPr, textAfter));
    }

    currentRunIdx = repl.endRun + 1;
  }

  // 5. Ajouter les runs restants après le dernier placeholder
  while (currentRunIdx < runs.length) {
    output.push(runs[currentRunIdx].xml);
    currentRunIdx++;
  }

  return `<w:p>${pPr}${output.join('')}</w:p>`;
}

// =============================================================================
// Fonctions utilitaires
// =============================================================================

/** Créer un <w:r> avec formatage et texte */
function makeRun(rPr, text) {
  return `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

/** Extraire tout le texte visible d'un fragment XML OOXML */
function extractFullText(xml) {
  let text = '';
  xml.replace(/<w:t(?:[^>]*)>([\s\S]*?)<\/w:t>/g, (_m, t) => { text += t; });
  return text;
}

/** Extraire <w:pPr>...</w:pPr> */
function extractPPr(paraXml) {
  const match = paraXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
  return match ? match[0] : '';
}

/** Extraire <w:rPr>...</w:rPr> */
function extractRPr(runXml) {
  const match = runXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
  return match ? match[0] : '';
}

/** Échapper les caractères XML */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

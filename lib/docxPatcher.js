// =============================================================================
// lib/docxPatcher.js — Chirurgie XML : injection d'OMML dans le .docx
// =============================================================================
import JSZip from 'jszip';

// Namespace mathématique Office Open XML
const MATH_NS = 'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"';

/**
 * Ouvre un Buffer .docx, localise les traceurs textuels ($$$MATH_OMML_N$$$)
 * dans word/document.xml et les remplace par le code OMML correspondant.
 *
 * @param {Buffer} docxBuffer  — Le .docx brut retourné par CloudConvert.
 * @param {Record<string, { omml: string, isDisplay: boolean }>} mathMap
 *   — Dictionnaire traceur → { omml, isDisplay } généré par mathProcessor.
 * @returns {Promise<Buffer>} — Le Buffer du .docx modifié.
 */
export async function patchDocxWithOmml(docxBuffer, mathMap) {
  const placeholders = Object.keys(mathMap);
  if (placeholders.length === 0) {
    console.log('      → Aucune équation à injecter, le .docx est retourné tel quel.');
    return docxBuffer;
  }

  // ------------------------------------------------------------------
  // 1. Ouvrir l'archive ZIP (.docx)
  // ------------------------------------------------------------------
  const zip = await JSZip.loadAsync(docxBuffer);

  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Le fichier word/document.xml est introuvable dans le .docx.');
  }

  let docXml = await docXmlFile.async('string');

  // ------------------------------------------------------------------
  // 2. Ajouter le namespace mathématique s'il est absent
  // ------------------------------------------------------------------
  if (!docXml.includes(MATH_NS)) {
    docXml = docXml.replace('<w:document ', `<w:document ${MATH_NS} `);
    console.log('      → Namespace xmlns:m ajouté à <w:document>.');
  }

  // ------------------------------------------------------------------
  // 3. Log de diagnostic : état initial
  // ------------------------------------------------------------------
  console.log(`      → ${placeholders.length} traceur(s) à injecter.`);
  for (const ph of placeholders) {
    const intact = docXml.includes(ph);
    // Check for fragmentation ($$$, MATH, OMML, N, $$$ in separate runs)
    const hasDollars = docXml.includes('$$$');
    console.log(`        [${ph}] intact=${intact}, anyDollars=${hasDollars}`);
  }

  // ------------------------------------------------------------------
  // 4. Remplacer chaque traceur par son OMML — STRATÉGIE :
  //    On traite le document entier paragraphe par paragraphe.
  //    Pour chaque paragraphe, on reconstruit son texte complet,
  //    on identifie les placeholders présents (intacts ou fragmentés),
  //    et on les remplace en une seule passe chirurgicale.
  // ------------------------------------------------------------------
  docXml = processAllParagraphs(docXml, mathMap);

  // ------------------------------------------------------------------
  // 5. Fallback : remplacement brut pour les traceurs encore présents
  // ------------------------------------------------------------------
  for (const [placeholder, { omml, isDisplay }] of Object.entries(mathMap)) {
    const ommlContent = isDisplay ? `<m:oMathPara>${omml}</m:oMathPara>` : omml;
    if (docXml.includes(placeholder)) {
      console.log(`      → Fallback brut pour "${placeholder}".`);
      docXml = docXml.split(placeholder).join(ommlContent);
    }
  }

  // ------------------------------------------------------------------
  // 6. Vérification finale
  // ------------------------------------------------------------------
  for (const placeholder of placeholders) {
    if (docXml.includes(placeholder)) {
      console.warn(`⚠️  Traceur "${placeholder}" toujours présent après patching !`);
    } else {
      console.log(`      ✓ "${placeholder}" injecté avec succès.`);
    }
  }

  // ------------------------------------------------------------------
  // 7. Remettre le XML modifié dans l'archive et générer le Buffer final
  // ------------------------------------------------------------------
  zip.file('word/document.xml', docXml);

  const patchedBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return patchedBuffer;
}

// =============================================================================
// processAllParagraphs — Traite chaque <w:p> du document
// =============================================================================
function processAllParagraphs(docXml, mathMap) {
  // Regex non-greedy pour chaque paragraphe.
  // OOXML garantit que <w:p> ne s'imbriquent pas.
  const rewrittenParts = [];
  let lastIndex = 0;
  const paraRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let m;

  while ((m = paraRegex.exec(docXml)) !== null) {
    // Ajouter le texte avant ce paragraphe (inchangé)
    rewrittenParts.push(docXml.substring(lastIndex, m.index));
    lastIndex = m.index + m[0].length;

    // Traiter ce paragraphe
    const newPara = processParagraph(m[0], mathMap);
    rewrittenParts.push(newPara);
  }

  // Ajouter le reste du document après le dernier paragraphe
  rewrittenParts.push(docXml.substring(lastIndex));

  return rewrittenParts.join('');
}

// =============================================================================
// processParagraph — Traite un seul <w:p>
// =============================================================================
function processParagraph(paraXml, mathMap) {
  // Reconstruire le texte complet du paragraphe à partir des <w:t>
  const fullText = extractFullText(paraXml);

  // Vérifier si ce paragraphe contient au moins un placeholder
  const presentPlaceholders = [];
  for (const ph of Object.keys(mathMap)) {
    if (fullText.includes(ph)) {
      presentPlaceholders.push(ph);
    }
  }

  if (presentPlaceholders.length === 0) {
    return paraXml; // Rien à faire
  }

  console.log(`        Paragraphe contient: [${presentPlaceholders.join(', ')}]`);

  // Cas spécial : le paragraphe NE contient QUE un ou plusieurs placeholders display
  // (pas de texte réel autour) → on peut remplacer les paragraphes entiers
  const nonPlaceholderText = presentPlaceholders.reduce(
    (txt, ph) => txt.split(ph).join(''),
    fullText,
  ).trim();

  // Cas : paragraphe = exactement UN display placeholder (seul dans le paragraphe)
  if (presentPlaceholders.length === 1) {
    const ph = presentPlaceholders[0];
    const { omml, isDisplay } = mathMap[ph];
    const ommlContent = isDisplay ? `<m:oMathPara>${omml}</m:oMathPara>` : omml;

    if (nonPlaceholderText === '') {
      // Paragraphe ne contient que ce placeholder
      const pPr = extractPPr(paraXml);
      console.log(`          → Remplacement complet du paragraphe (seul placeholder).`);
      return `<w:p>${pPr}${ommlContent}</w:p>`;
    }

    // Paragraphe avec texte ET placeholder inline → reconstruction fine
    return rebuildParagraphWithPlaceholders(paraXml, presentPlaceholders, mathMap, fullText);
  }

  // Cas : paragraphe contient PLUSIEURS placeholders → reconstruction fine
  return rebuildParagraphWithPlaceholders(paraXml, presentPlaceholders, mathMap, fullText);
}

// =============================================================================
// rebuildParagraphWithPlaceholders — Reconstruit un paragraphe en remplaçant
// les placeholders par leurs OMML tout en préservant le texte environnant.
// =============================================================================
function rebuildParagraphWithPlaceholders(paraXml, placeholders, mathMap, fullText) {
  // Extraire les propriétés de paragraphe
  const pPr = extractPPr(paraXml);

  // Extraire les propriétés de run de référence d'un run avec du VRAI texte.
  // On évite les runs contenant '$$$' car ce sont les placeholders avec
  // un formatage invisible (color:transparent, font-size:1pt) qui contaminerait
  // tout le texte reconstruit.
  const allRuns = [...paraXml.matchAll(/<w:r[\s>][\s\S]*?<\/w:r>/g)];
  let refRPr = '';
  for (const runMatch of allRuns) {
    const runText = extractFullText(runMatch[0]);
    if (!runText.includes('$$$')) {
      refRPr = extractRPr(runMatch[0]);
      break;
    }
  }

  // Construire une "timeline" du texte et des substitutions
  // On part du fullText et on le découpe aux positions des placeholders
  const segments = splitTextByPlaceholders(fullText, placeholders, mathMap);

  // Construire le nouveau contenu du paragraphe
  const newContent = segments.map(seg => {
    if (seg.type === 'text') {
      if (!seg.value) return '';
      // Créer un run avec le texte
      return `<w:r>${refRPr}<w:t xml:space="preserve">${escapeXml(seg.value)}</w:t></w:r>`;
    } else if (seg.type === 'math') {
      const { omml, isDisplay } = mathMap[seg.placeholder];
      console.log(`          → Injection ${isDisplay ? 'display' : 'inline'} "${seg.placeholder}"`);
      return isDisplay ? `<m:oMathPara>${omml}</m:oMathPara>` : omml;
    }
    return '';
  }).join('');

  return `<w:p>${pPr}${newContent}</w:p>`;
}

// =============================================================================
// splitTextByPlaceholders — Découpe le texte par les placeholders présents
// Retourne un tableau de segments { type: 'text'|'math', value?, placeholder? }
// =============================================================================
function splitTextByPlaceholders(text, placeholders, mathMap) {
  // Trouver toutes les positions de placeholder dans le texte
  const positions = [];
  for (const ph of placeholders) {
    let idx = text.indexOf(ph);
    while (idx !== -1) {
      positions.push({ start: idx, end: idx + ph.length, placeholder: ph });
      idx = text.indexOf(ph, idx + 1);
    }
  }

  // Trier par position de début
  positions.sort((a, b) => a.start - b.start);

  const segments = [];
  let cursor = 0;

  for (const pos of positions) {
    // Texte avant ce placeholder
    if (pos.start > cursor) {
      segments.push({ type: 'text', value: text.substring(cursor, pos.start) });
    }
    // Le placeholder lui-même
    segments.push({ type: 'math', placeholder: pos.placeholder });
    cursor = pos.end;
  }

  // Texte restant après le dernier placeholder
  if (cursor < text.length) {
    segments.push({ type: 'text', value: text.substring(cursor) });
  }

  return segments;
}

// =============================================================================
// Fonctions utilitaires
// =============================================================================

/** Extraire tout le texte visible d'un fragment XML OOXML (tous les <w:t>) */
function extractFullText(xml) {
  let text = '';
  // Capture le contenu entre <w:t...> et </w:t>, y compris les espaces
  xml.replace(/<w:t(?:[^>]*)>([\s\S]*?)<\/w:t>/g, (_m, t) => {
    text += t;
  });
  return text;
}

/** Extraire les propriétés de paragraphe <w:pPr>...</w:pPr> */
function extractPPr(paraXml) {
  const match = paraXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
  return match ? match[0] : '';
}

/** Extraire les propriétés de run <w:rPr>...</w:rPr> depuis un run */
function extractRPr(runXml) {
  const match = runXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
  return match ? match[0] : '';
}

/** Échapper les caractères spéciaux XML dans du texte brut */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

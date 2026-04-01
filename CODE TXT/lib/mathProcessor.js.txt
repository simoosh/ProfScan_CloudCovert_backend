// =============================================================================
// lib/mathProcessor.js — Extraction MathML → OMML + remplacement par traceurs
// =============================================================================
import * as cheerio from 'cheerio';
import { mml2omml } from 'mathml2omml';

/**
 * Pré-traite le HTML pour extraire les équations MathML, les convertir en OMML,
 * et les remplacer par des traceurs textuels uniques.
 */
export function processMath(html) {
  const $ = cheerio.load(html, { xmlMode: false });

  /** @type {Record<string, { omml: string, isDisplay: boolean }>} */
  const mathMap = {};
  let index = 0;

  $('math').each((_i, el) => {
    const $math = $(el);
    let mathMlString = $.html(el);

    // ---- Pré-traitement du MathML ----
    mathMlString = preprocessMathML(mathMlString);

    // ---- Détection display vs inline ----
    const displayAttr = $math.attr('display');
    const isDisplay = displayAttr === 'block';

    // ---- Conversion MathML → OMML ----
    let omml;
    try {
      omml = mml2omml(mathMlString);
    } catch (err) {
      console.warn(
        `⚠️  Crash mml2omml sur l'équation #${index} : ${err.message}`,
      );
      const fallbackText = extractMathText(mathMlString);
      $math.replaceWith(
        `<span style="font-style:italic;">[${fallbackText}]</span>`,
      );
      index++;
      return;
    }

    // ---- POST-TRAITEMENT : sanitizer l'OMML ----
    // Corrige le cas où < ou > apparaît non-échappé dans le texte math
    // (ex: opérateur "inférieur à" dans <m:t>k⋅n<n⋅</m:t>)
    omml = sanitizeOmml(omml);

    // ---- Créer le traceur unique ----
    const placeholder = `$$$MATH_OMML_${index}$$$`;
    mathMap[placeholder] = { omml, isDisplay };

    if (isDisplay) {
      $math.replaceWith(
        `<p style="text-align:center;"><span style="color:transparent;font-size:1pt;">${placeholder}</span></p>`,
      );
    } else {
      $math.replaceWith(
        `<span style="color:transparent;font-size:1pt;">${placeholder}</span>`,
      );
    }

    console.log(`      ✓ Équation #${index} convertie (${isDisplay ? 'display' : 'inline'}, OMML: ${omml.length} chars)`);
    index++;
  });

  return {
    processedHtml: $.html(),
    mathMap,
  };
}

// =============================================================================
// sanitizeOmml — Corrige les caractères XML non-échappés dans <m:t>
// =============================================================================
/**
 * mathml2omml met parfois des caractères < ou > BRUTS dans les éléments <m:t>
 * (texte mathématique), par ex pour l'opérateur "inférieur à".
 * Ex: <m:t>k⋅n<n⋅</m:t>  →  <m:t>k⋅n&lt;n⋅</m:t>
 *
 * ATTENTION : La regex doit matcher EXACTEMENT <m:t> (texte math) et PAS
 * <m:type>, <m:tab>, ou d'autres éléments m: qui commencent par "t".
 * On utilise <m:t> ou <m:t suivi d'un espace pour les attributs.
 */
function sanitizeOmml(omml) {
  // Regex précise : <m:t> ou <m:t espace...>, PAS <m:type> <m:tab> etc.
  // (?:\s[^>]*)? = optionnellement un espace + attributs avant le >
  return omml.replace(/<m:t(\s[^>]*)?>(\s*[\s\S]*?)<\/m:t>/g, (_match, attrs, text) => {
    const attrStr = attrs || '';
    // Décoder les entités existantes pour éviter le double-encodage
    let clean = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    // Ré-encoder proprement
    clean = clean
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return `<m:t${attrStr}>${clean}</m:t>`;
  });
}

// =============================================================================
// preprocessMathML — Nettoyage du MathML avant conversion
// =============================================================================
function preprocessMathML(mathml) {
  let result = mathml;

  // 1. Supprimer les attributs style="..." sur les balises MathML
  result = result.replace(
    /(<(?:mi|mn|mo|ms|mtext|mspace|mrow|mfrac|msqrt|mroot|msub|msup|msubsup|munder|mover|munderover|mtable|mtr|mtd|mfenced|menclose|mpadded|mphantom|merror|maction|maligngroup|malignmark)(?:\s[^>]*?))\s+style="[^"]*"/gi,
    '$1',
  );

  // 2. Supprimer style sur <math>
  result = result.replace(
    /(<math\s[^>]*?)\s+style="[^"]*"/gi,
    '$1',
  );

  // 3. Remplacer <mspace> par des espaces Unicode
  result = result.replace(
    /<mspace\s+width="[^"]*"\s*\/?\s*>/gi,
    '<mo>\u2003</mo>',
  );
  result = result.replace(/<mspace\s*\/?\s*>/gi, '<mo>\u2003</mo>');

  return result;
}

/**
 * Extrait un texte lisible d'un fragment MathML (fallback si crash).
 */
function extractMathText(mathml) {
  const text = mathml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text || 'équation';
}

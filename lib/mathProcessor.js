// =============================================================================
// lib/mathProcessor.js — Extraction MathML → OMML + remplacement par traceurs
// =============================================================================
import * as cheerio from 'cheerio';
import { mml2omml } from 'mathml2omml';

/**
 * Pré-traite le HTML pour extraire les équations MathML, les convertir en OMML,
 * et les remplacer par des traceurs textuels uniques.
 *
 * @param {string} html — Le HTML brut contenant potentiellement des balises <math>.
 * @returns {{ processedHtml: string, mathMap: Record<string, { omml: string, isDisplay: boolean }> }}
 */
export function processMath(html) {
  const $ = cheerio.load(html, { xmlMode: false });

  /** @type {Record<string, { omml: string, isDisplay: boolean }>} */
  const mathMap = {};
  let index = 0;

  // Parcourir chaque balise <math> présente dans le document
  $('math').each((_i, el) => {
    const $math = $(el);
    let mathMlString = $.html(el); // Récupérer le MathML brut (outerHTML)

    // ---- Pré-traitement du MathML pour compatibilité ----
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
        `⚠️  Impossible de convertir l'équation #${index} en OMML :`,
        err.message,
      );
      console.warn(`    MathML (100 premiers chars) : ${mathMlString.substring(0, 100)}…`);
      // Fallback : remplacer par un texte lisible au lieu de laisser le MathML brut
      // (le MathML brut causerait des problèmes dans le DOCX)
      const fallbackText = extractMathText(mathMlString);
      $math.replaceWith(
        `<span style="font-style:italic;">[${fallbackText}]</span>`,
      );
      index++;
      return; // continue (.each)
    }

    // ---- Créer le traceur unique ----
    const placeholder = `$$$MATH_OMML_${index}$$$`;

    // Stocker la correspondance
    mathMap[placeholder] = { omml, isDisplay };

    // Remplacer la balise <math> par un traceur invisible.
    // IMPORTANT : pour les équations display (block), on enveloppe dans un <p>
    // pour forcer LibreOffice à créer un paragraphe séparé dans le .docx.
    // Sans cela, deux <math display="block"> adjacents seraient fusionnés dans
    // le même <w:p>, et Word ne peut afficher qu'un seul <m:oMathPara> par paragraphe.
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

/**
 * Pré-traite le MathML pour améliorer la compatibilité avec mathml2omml.
 * - Supprime les attributs style= sur les éléments MathML (invalides, causent des crashs)
 * - Remplace <mspace width="Xem"/> par <mo>&#x2003;</mo> (em space)
 * - Nettoie les attributs non-standard
 */
function preprocessMathML(mathml) {
  let result = mathml;

  // 1. Supprimer les attributs style="..." sur TOUTES les balises MathML
  //    (sauf <math> lui-même qui peut avoir xmlns et display)
  result = result.replace(
    /(<(?:mi|mn|mo|ms|mtext|mspace|mrow|mfrac|msqrt|mroot|msub|msup|msubsup|munder|mover|munderover|mtable|mtr|mtd|mfenced|menclose|mpadded|mphantom|merror|maction|maligngroup|malignmark)(?:\s[^>]*?))\s+style="[^"]*"/gi,
    '$1',
  );

  // 2. Supprimer style sur la balise <math> elle-même (garder xmlns et display)
  result = result.replace(
    /(<math\s[^>]*?)\s+style="[^"]*"/gi,
    '$1',
  );

  // 3. Remplacer <mspace width="..."/> par des espaces Unicode appropriées
  //    mspace n'est pas toujours bien géré par tous les convertisseurs
  result = result.replace(
    /<mspace\s+width="[^"]*"\s*\/?\s*>/gi,
    '<mo>\u2003</mo>', // EM SPACE (U+2003)
  );
  // Gérer aussi les mspace auto-fermantes sans attributs
  result = result.replace(/<mspace\s*\/?\s*>/gi, '<mo>\u2003</mo>');

  // 4. Supprimer les attributs stretchy="false" qui sont redondants
  //    (le comportement par défaut est souvent suffisant)
  // Note: on garde stretchy="true" car c'est parfois nécessaire

  return result;
}

/**
 * Extrait un texte lisible approximatif d'un fragment MathML (pour fallback).
 * Utilisé quand mml2omml échoue, pour au moins afficher quelque chose.
 */
function extractMathText(mathml) {
  // Extraire le contenu texte de toutes les balises MathML
  const text = mathml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text || 'équation';
}

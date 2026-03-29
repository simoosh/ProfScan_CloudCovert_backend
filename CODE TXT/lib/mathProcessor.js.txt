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
    const mathMlString = $.html(el); // Récupérer le MathML brut (outerHTML)

    // ---- Détection display vs inline ----
    // MathML utilise l'attribut display="block" pour les équations en bloc.
    const displayAttr = $math.attr('display');
    const isDisplay = displayAttr === 'block';

    // ---- Conversion MathML → OMML ----
    let omml;
    try {
      omml = mml2omml(mathMlString);
    } catch (err) {
      console.warn(
        `⚠️  Impossible de convertir l'équation #${index} en OMML, elle sera ignorée :`,
        err.message,
      );
      // On laisse le MathML original en place si la conversion échoue
      return; // continue (.each)
    }

    // ---- Créer le traceur unique ----
    const placeholder = `$$$MATH_OMML_${index}$$$`;

    // Stocker la correspondance
    mathMap[placeholder] = { omml, isDisplay };

    // Remplacer la balise <math> par un <span> invisible contenant le traceur.
    // Le style "color:transparent; font-size:1pt" le rend invisible dans le HTML
    // tout en garantissant que LibreOffice/CloudConvert le conserve dans le .docx.
    $math.replaceWith(
      `<span style="color:transparent;font-size:1pt;">${placeholder}</span>`,
    );

    index++;
  });

  return {
    processedHtml: $.html(),
    mathMap,
  };
}

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
  // Si aucun traceur, on retourne le fichier tel quel
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
    // Injecter le namespace dans la balise <w:document ...>
    docXml = docXml.replace(
      '<w:document ',
      `<w:document ${MATH_NS} `,
    );
    console.log('      → Namespace xmlns:m ajouté à <w:document>.');
  }

  // ------------------------------------------------------------------
  // 3. Remplacer chaque traceur par son OMML
  // ------------------------------------------------------------------
  // STRATÉGIE : Itérer sur chaque paragraphe <w:p> individuellement,
  // concaténer le texte de ses <w:t>, et si le texte contient un traceur,
  // remplacer ce paragraphe spécifique.
  //
  // POURQUOI : Une regex globale avec le flag 's' (dotAll) risquait de
  // matcher depuis le PREMIER <w:p> du document jusqu'au traceur,
  // supprimant tout le contenu intermédiaire.
  // ------------------------------------------------------------------

  for (const [placeholder, { omml, isDisplay }] of Object.entries(mathMap)) {
    // Wrapper OMML : <m:oMathPara> pour display, <m:oMath> pour inline
    const ommlWrapped = isDisplay
      ? `<m:oMathPara>${omml}</m:oMathPara>`
      : omml;

    let found = false;

    // --- Approche : itérer sur chaque <w:p>...</w:p> individuellement ---
    // En OOXML, les <w:p> ne s'imbriquent jamais, donc le premier </w:p>
    // après un <w:p> ferme toujours ce paragraphe.
    docXml = docXml.replace(/<w:p[\s>][\s\S]*?<\/w:p>/g, (paraMatch) => {
      if (found) return paraMatch; // Déjà traité ce placeholder

      // Extraire tout le texte visible de ce paragraphe
      // en concaténant les contenus de chaque <w:t>
      const textParts = [];
      paraMatch.replace(/<w:t[^>]*>([^<]*)<\/w:t>/g, (_match, text) => {
        textParts.push(text);
        return _match;
      });
      const fullText = textParts.join('');

      // Vérifier si ce paragraphe contient notre traceur
      if (!fullText.includes(placeholder)) {
        return paraMatch; // Pas ce paragraphe, on le garde intact
      }

      found = true;
      console.log(`      → Équation "${placeholder}" trouvée dans un paragraphe.`);

      // Si le paragraphe ne contient QUE le traceur (± espaces),
      // on remplace le paragraphe entier par l'OMML
      const trimmedText = fullText.trim();
      if (trimmedText === placeholder) {
        console.log(`        Remplacement complet du paragraphe.`);
        return `<w:p>${ommlWrapped}</w:p>`;
      }

      // Sinon, le traceur est inline avec du texte autour.
      // On essaie de remplacer uniquement le(s) <w:r> contenant le traceur.
      // D'abord, tenter un remplacement dans un seul <w:r>
      const escapedPlaceholder = placeholder.replace(/\$/g, '\\$');
      const singleRunRegex = new RegExp(
        `<w:r[^>]*>(?:<w:rPr>[\\s\\S]*?</w:rPr>)?\\s*<w:t[^>]*>[^<]*?${escapedPlaceholder}[^<]*?</w:t>\\s*</w:r>`
      );

      if (singleRunRegex.test(paraMatch)) {
        console.log(`        Remplacement au niveau run (inline).`);
        return paraMatch.replace(singleRunRegex, ommlWrapped);
      }

      // Fallback : le traceur est fragmenté sur plusieurs <w:r>.
      // On reconstruit le paragraphe en gardant les runs avant et après
      // le traceur, et en injectant l'OMML au milieu.
      console.log(`        Traceur fragmenté — reconstruction du paragraphe.`);

      // Trouver les runs qui composent le traceur et les remplacer
      // Approche : supprimer les runs contenant des fragments du traceur
      // et insérer l'OMML à la place du premier fragment trouvé.
      let reconstructed = paraMatch;
      // Supprimer tous les runs dont le texte fait partie du traceur
      // en identifiant les runs qui contiennent "$$$" (signature du traceur)
      const markerRuns = new RegExp(
        `<w:r[^>]*>(?:<w:rPr>[\\s\\S]*?</w:rPr>)?\\s*<w:t[^>]*>[^<]*\\$\\$\\$[^<]*</w:t>\\s*</w:r>`,
        'g'
      );
      let firstMatch = true;
      reconstructed = reconstructed.replace(markerRuns, (runMatch) => {
        if (firstMatch) {
          firstMatch = false;
          return ommlWrapped; // Remplacer le premier run-fragment par l'OMML
        }
        return ''; // Supprimer les runs-fragments suivants
      });

      return reconstructed;
    });

    if (!found) {
      // Dernier recours : remplacement textuel brut
      if (docXml.includes(placeholder)) {
        docXml = docXml.replace(placeholder, ommlWrapped);
        console.log(`      → Équation "${placeholder}" injectée (fallback textuel).`);
      } else {
        console.warn(
          `⚠️  Traceur "${placeholder}" introuvable dans document.xml — équation ignorée.`,
        );
      }
    }
  }

  // ------------------------------------------------------------------
  // 4. Remettre le XML modifié dans l'archive et générer le Buffer final
  // ------------------------------------------------------------------
  zip.file('word/document.xml', docXml);

  const patchedBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return patchedBuffer;
}

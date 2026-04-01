// =============================================================================
// diagnose-equations.js — Diagnostic : teste chaque équation individuellement
// =============================================================================
import * as cheerio from 'cheerio';
import { mml2omml } from 'mathml2omml';

const testHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Test</title></head>
<body>
<p>Exemple: <math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>E</mi><mo>(</mo><msub><mi>S</mi><mi>n</mi></msub><mo>⋅</mo><mi>n</mi><mo>)</mo><mo>=</mo><mn>0</mn></mrow></math></p>
<p><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow><msub><mi>F</mi><mi>n</mi></msub><mo>(</mo><mi>n</mi><mo>)</mo><mo>=</mo><munderover><mo>∑</mo><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><mi>E</mi><mo>(</mo><mi>k</mi><mo>⋅</mo><mi>n</mi><mo>)</mo></mrow></math></p>
<p><math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>k</mi><mo>⋅</mo><mi>n</mi><mo>&lt;</mo><mi>n</mi><mo>⋅</mo><mfrac><mn>1</mn><msub><mi>S</mi><mi>n</mi></msub></mfrac></mrow></math></p>
<p><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow><mo>∀</mo><mi>n</mi><mo>∈</mo><mo>]</mo><mn>0</mn><mo>;</mo><mfrac><mn>1</mn><msub><mi>S</mi><mi>n</mi></msub></mfrac><mo>[</mo></mrow></math></p>
<p><math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>n</mi><mo>=</mo><mfrac><mn>1</mn><mrow><mn>2</mn><msub><mi>S</mi><mi>n</mi></msub></mrow></mfrac></mrow></math></p>
<p><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow><msub><mi>F</mi><mi>n</mi></msub><mo>(</mo><mfrac><mn>1</mn><mrow><mn>2</mn><msub><mi>S</mi><mi>n</mi></msub></mrow></mfrac><mo>)</mo><mo>=</mo><mi>E</mi><mo>(</mo><msub><mi>S</mi><mi>n</mi></msub><mo>⋅</mo><mfrac><mn>1</mn><mrow><mn>2</mn><msub><mi>S</mi><mi>n</mi></msub></mrow></mfrac><mo>)</mo></mrow></math></p>
<p><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow><munderover><mo>∑</mo><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><mi>E</mi><mo>(</mo><mfrac><mi>k</mi><mrow><mn>2</mn><msub><mi>S</mi><mi>n</mi></msub></mrow></mfrac><mo>)</mo><mo>=</mo><mi>E</mi><mo>(</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>)</mo></mrow></math></p>
</body>
</html>
`;

// Sanitizer OMML - même code que dans mathProcessor.js (regex corrigée)
function sanitizeOmml(omml) {
  // Regex précise : <m:t> ou <m:t espace...>, PAS <m:type> <m:tab> etc.
  return omml.replace(/<m:t(\s[^>]*)?>(\s*[\s\S]*?)<\/m:t>/g, (_match, attrs, text) => {
    const attrStr = attrs || '';
    let clean = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    clean = clean
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return `<m:t${attrStr}>${clean}</m:t>`;
  });
}

// Validation XML simple par balance de balises
function isBalancedXml(xml) {
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9:]*)[^>]*\/?>/g;
  const stack = [];
  let match;
  while ((match = tagRegex.exec(xml)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    if (fullTag.endsWith('/>') || fullTag.startsWith('<?')) continue;
    if (fullTag.startsWith('</')) {
      if (stack.length === 0 || stack[stack.length - 1] !== tagName) {
        return { valid: false, error: `</` + tagName + `> inattendu (attendu: </${stack[stack.length - 1] || 'rien'}>)` };
      }
      stack.pop();
    } else {
      stack.push(tagName);
    }
  }
  if (stack.length !== 0) {
    return { valid: false, error: `${stack.length} balise(s) non fermée(s): ${stack.slice(-3).join(', ')}` };
  }
  return { valid: true };
}

// ---- Diagnostic ----
console.log('🔍 DIAGNOSTIC DES ÉQUATIONS\n');
console.log('='.repeat(70));

const $ = cheerio.load(testHtml, { xmlMode: false });
const mathElements = $('math').toArray();

console.log(`📊 ${mathElements.length} équation(s) trouvée(s)\n`);

let passed = 0;
let failed = 0;

mathElements.forEach((el, i) => {
  const rawMathML = $.html(el);
  
  console.log(`--- Équation #${i} ---`);
  console.log(`  MathML: ${rawMathML.substring(0, 80)}…`);
  
  let omml;
  try {
    omml = mml2omml(rawMathML);
  } catch (err) {
    console.log(`  ❌ CRASH mml2omml : ${err.message}`);
    failed++;
    return;
  }

  // Test AVANT sanitization
  const beforeCheck = isBalancedXml(omml);
  const hasRawLt = /<m:t[^>]*>[^<]*<[^/m][^>]*<\/m:t>/.test(omml); // raw < in m:t
  
  console.log(`  AVANT sanitize: balanced=${beforeCheck.valid}, hasRaw<=${hasRawLt}`);
  if (!beforeCheck.valid) {
    console.log(`    Problème: ${beforeCheck.error}`);
  }
  
  // Test APRÈS sanitization
  const sanitized = sanitizeOmml(omml);
  const afterCheck = isBalancedXml(sanitized);
  
  console.log(`  APRÈS sanitize: balanced=${afterCheck.valid}`);
  
  if (afterCheck.valid) {
    console.log(`  ✅ OK APRÈS SANITIZATION`);
    passed++;
  } else {
    console.log(`  ❌ TOUJOURS INVALIDE : ${afterCheck.error}`);
    console.log(`  OMML: ${sanitized.substring(0, 300)}`);
    failed++;
  }
  console.log('');
});

console.log('='.repeat(70));
console.log(`\n📊 RÉSULTAT : ${passed} OK, ${failed} ÉCHOUÉ(s) sur ${mathElements.length}`);

if (failed === 0) {
  console.log('✅ TOUTES les équations sont valides après sanitization !');
  console.log('   → Le fix sanitizeOmml() résout le problème de corruption.');
} else {
  console.log('⚠️  Des équations restent invalides même après sanitization.');
}

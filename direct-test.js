import { mml2omml } from 'mathml2omml';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'node:fs';

// Test 1: MathML direct (sans cheerio)
const directMathML = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>n</mi><mo>=</mo><mfrac><mn>1</mn><mrow><mn>2</mn><msub><mi>S</mi><mi>n</mi></msub></mrow></mfrac></mrow></math>';

let output = '=== TEST 1: mml2omml DIRECT (sans cheerio) ===\n';
output += 'Input: ' + directMathML + '\n';
const directOmml = mml2omml(directMathML);
output += 'Output:\n' + directOmml + '\n\n';

// Test 2: MathML via cheerio
const html = `<html><body><p>test <math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>n</mi><mo>=</mo><mfrac><mn>1</mn><mrow><mn>2</mn><msub><mi>S</mi><mi>n</mi></msub></mrow></mfrac></mrow></math> fin</p></body></html>`;
const $ = cheerio.load(html, { xmlMode: false });
const cheerioMathML = $.html($('math').first());

output += '=== TEST 2: MathML via cheerio ===\n';
output += 'Cheerio output: ' + cheerioMathML + '\n';
const cheerioOmml = mml2omml(cheerioMathML);
output += 'OMML:\n' + cheerioOmml + '\n\n';

// Test 3: Même chose mais avec xmlMode: true
const $xml = cheerio.load(html, { xmlMode: true });
const xmlModeMathML = $xml.html($xml('math').first());

output += '=== TEST 3: MathML via cheerio (xmlMode: true) ===\n';
output += 'Cheerio output: ' + xmlModeMathML + '\n';
const xmlOmml = mml2omml(xmlModeMathML);
output += 'OMML:\n' + xmlOmml + '\n\n';

// Test 4: MathML direct avec MFRAC + MSUB dans le dénominateur (le cas problématique)
output += '=== TEST 4: MFRAC avec MSUB dans dénominateur (cas problématique) ===\n';
const complexMathML = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac><mn>1</mn><msub><mi>S</mi><mi>n</mi></msub></mfrac></math>';
output += 'Input: ' + complexMathML + '\n';
const complexOmml = mml2omml(complexMathML);
output += 'Output:\n' + complexOmml + '\n\n';

writeFileSync('direct-test.txt', output, 'utf8');
console.log('Output written to direct-test.txt');

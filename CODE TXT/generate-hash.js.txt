// =============================================================================
// generate-hash.js — Calcule le hash MD5 du HTML PRÉ-TRAITÉ envoyé à CloudConvert
// =============================================================================
// IMPORTANT : CloudConvert calcule le MD5 sur le contenu REÇU, c'est-à-dire
// le HTML APRÈS que processMath() a remplacé les <math> par des traceurs.
// Ce script calcule donc ce hash exact.
// =============================================================================
import crypto from 'node:crypto';
import { processMath } from './lib/mathProcessor.js';

// Copiez-collez ici le même HTML que dans la variable testHtml de test.js
const rawHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Transcription</title>
</head>
<body style="font-family: 'Calibri', 'Arial', sans-serif; margin: 40px; line-height: 1.8; font-size: 12pt; color: #1a237e;">
<p>Le rayon sur laquelle la densité est maximale.</p>
<p style="text-align: center;">
<math xmlns="http://www.w3.org/1998/Math/MathML">
<mrow>
<msubsup><mi>D</mi><mi>r</mi><mo>'</mo></msubsup>
<mo>=</mo>
<mfrac>
<mrow><msup><mi>d</mi><mn>2</mn></msup><mi>P</mi></mrow>
<mrow><msup><mi>d</mi><mn>2</mn></msup><mi>r</mi></mrow>
</mfrac>
<mo>=</mo><mn>0</mn>
</mrow>
</math>
<sup style="font-size: 8pt; border: 1px solid #1a237e; padding: 0 2px;">(0,25)</sup>
<math xmlns="http://www.w3.org/1998/Math/MathML">
<mrow>
<mo>&#x21D2;</mo>
<msub><mi>D</mi><mi>r</mi></msub>
<mo>=</mo>
<mfrac>
<mrow><msup><mi>d</mi><mn>2</mn></msup><mi>P</mi></mrow>
<mrow><msup><mi>d</mi><mn>2</mn></msup><mi>r</mi></mrow>
</mfrac>
<mo>=</mo>
<mn>8</mn><mi>&#x03C0;</mi><msup><mi>N</mi><mn>2</mn></msup><mi>r</mi>
<msup><mi>e</mi><mrow><mo>-</mo><mfrac><mrow><mn>2</mn><mi>r</mi></mrow><msub><mi>a</mi><mn>0</mn></msub></mfrac></mrow></msup>
<mo>(</mo><mn>1</mn><mo>-</mo><mfrac><mi>r</mi><msub><mi>a</mi><mn>0</mn></msub></mfrac><mo>)</mo>
</mrow>
</math>
<sup style="font-size: 8pt; border: 1px solid #1a237e; padding: 0 2px;">(0,25)</sup>
</p>
<p style="text-align: center;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
<mrow>
<mi>r</mi><mo>=</mo><mn>0</mn><mo>&#x21D2;</mo>
<mrow>
<mo>{</mo>
<mtable columnalign="left">
<mtr>
<mtd>
<mrow>
<mi>r</mi><mo>=</mo><mn>0</mn><mo>&#x21D2;</mo>
<mfrac><mrow><mi>d</mi><mi>P</mi></mrow><mrow><mi>d</mi><mi>r</mi></mrow></mfrac>
<mo>=</mo><msub><mi>D</mi><mn>0</mn></msub><mo>=</mo><mn>0</mn>
</mrow>
</mtd>
</mtr>
<mtr>
<mtd>
<mrow>
<mi>r</mi><mo>=</mo><msub><mi>a</mi><mn>0</mn></msub><mo>&#x21D2;</mo>
<msub><mi>D</mi><msub><mi>a</mi><mn>0</mn></msub></msub>
<mo>=</mo><mn>4</mn><mi>&#x03C0;</mi><msubsup><mi>a</mi><mn>0</mn><mn>2</mn></msubsup><msup><mi>N</mi><mn>2</mn></msup><msup><mi>e</mi><mrow><mo>-</mo><mn>2</mn></mrow></msup>
</mrow>
</mtd>
</mtr>
<mtr>
<mtd>
<mrow>
<mi>r</mi><mo>=</mo><mi>&#x221E;</mi><mo>&#x21D2;</mo>
<mfrac><mrow><mi>d</mi><mi>P</mi></mrow><mrow><mi>d</mi><mi>r</mi></mrow></mfrac>
<mo>=</mo><msub><mi>D</mi><mi>&#x221E;</mi></msub><mo>=</mo><mn>0</mn>
</mrow>
</mtd>
</mtr>
</mtable>
</mrow>
</mrow>
</math>
<sup style="font-size: 8pt; border: 1px solid #1a237e; padding: 0 2px;">(0,25)</sup>
</p>
<p>
<math xmlns="http://www.w3.org/1998/Math/MathML"><mo>&#x21D2;</mo></math>
La densité de probabilité est maximale a.
</p>
<p style="text-align: center;">
<math xmlns="http://www.w3.org/1998/Math/MathML">
<mrow>
<mi>r</mi><mo>=</mo><msub><mi>a</mi><mn>0</mn></msub><mo>=</mo><mn>0,53</mn><mi>&#x212B;</mi>
</mrow>
</math>
<sup style="font-size: 8pt; border: 1px solid #1a237e; padding: 0 2px;">(0,25)</sup>
</p>
<p>
<span style="text-decoration: underline;">EX 03 :</span>
<sup style="font-size: 8pt; border: 1px solid #1a237e; padding: 0 2px;">(0,25)</sup>
I) Les règles de stabilité :
</p>
<p>
a) <span style="text-decoration: underline;">Klechkowski</span><sup style="font-size: 8pt; border: 1px solid #1a237e; padding: 0 2px;">(0,25)</sup> : on classe les électrons par ordre d'énergie<br>
croissant
<math xmlns="http://www.w3.org/1998/Math/MathML"><mo>&#x21D2;</mo></math>
energie des sous couches :
<math xmlns="http://www.w3.org/1998/Math/MathML">
<mrow>
<mo>(</mo><mi>n</mi><mo>+</mo><mi>l</mi><mo>)</mo><mo>&#x2197;</mo>
</mrow>
</math>
<sup style="font-size: 8pt; border: 1px solid #1a237e; padding: 0 2px;">(0,25)</sup>
<math xmlns="http://www.w3.org/1998/Math/MathML">
<mrow>
<mi>E</mi><mo>&#x2197;</mo>
</mrow>
</math>.
</p>
<p style="margin-left: 20px;">
si
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mo>(</mo><mi>n</mi><mo>+</mo><mi>l</mi><mo>)</mo></mrow></math>
est le même, on classe par
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>n</mi><mo>&#x2197;</mo></mrow></math>.
</p>
<p>
b) <span style="text-decoration: underline;">principe d'exclusion</span><sup style="font-size: 8pt; border: 1px solid #1a237e; padding: 0 2px;">(0,25)</sup> <span style="text-decoration: underline;">de pauli</span> : dans un atome<sup style="font-size: 8pt; border: 1px solid #1a237e; padding: 0 2px;">(0,25)</sup> l'état<br>
quantique des électrons est differents, si
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>n</mi><mo>,</mo><mi>l</mi></mrow></math>
et
<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>m</mi></math>
sont<br>
les mêmes
<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>s</mi></math>
doit obligatoirement être different.
<math xmlns="http://www.w3.org/1998/Math/MathML">
<mrow>
<mi>s</mi><mo>=</mo><mo>+</mo><mfrac><mn>1</mn><mn>2</mn></mfrac>
</mrow>
</math>
ou
<math xmlns="http://www.w3.org/1998/Math/MathML">
<mrow>
<mi>s</mi><mo>=</mo><mo>-</mo><mfrac><mn>1</mn><mn>2</mn></mfrac>
</mrow>
</math>.
</p>
<p>
<span style="text-decoration: underline;">règle de Hund</span><sup style="font-size: 8pt; border: 1px solid #1a237e; padding: 0 2px;">(0,25)</sup> : dans une même<sup style="font-size: 8pt; border: 1px solid #1a237e; padding: 0 2px;">(0,5)</sup> sous-couche, il<br>
faut occuper le maximum d'OA (cases quantiques).
</p>
<p style="text-align: center; margin-top: 30px;">
<span style="border: 1px solid #1a237e; padding: 3px 10px;">4</span>
</p>
</body>
</html>
`;

// Pré-traiter le HTML (remplace les <math> par des traceurs)
// C'est LE contenu exact envoyé à CloudConvert
const { processedHtml } = processMath(rawHtml);

const hash = crypto.createHash('md5').update(processedHtml).digest('hex');

console.log('='.repeat(50));
console.log('HASH MD5 DU HTML PRÉ-TRAITÉ (pour le Sandbox) :');
console.log(hash);
console.log('='.repeat(50));
console.log('\nCopiez cette valeur dans votre Dashboard CloudConvert Sandbox');
console.log('sous "MD5 Hashes for Sandbox Uploads".');
console.log(`\nHTML pré-traité : ${processedHtml.length} caractères`);

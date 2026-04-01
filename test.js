// =============================================================================
// test.js — Script de test : envoie un HTML avec CSS + MathML au serveur local
// =============================================================================

const SERVER_URL = 'http://localhost:3000/convert';
const OUTPUT_FILE = 'test-output.docx';

// ---- HTML de test ----
// Transcription fidèle du manuscrit complexe (page 3 — solutions rationnelles)
const testHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Transcription</title>
</head>
<body style="font-family: 'Calibri', 'Arial', sans-serif; margin: 40px; line-height: 1.8; font-size: 12pt; color: #1a237e;">

<p>
<span style="border: 1px solid #1a237e; border-radius: 50%; padding: 0 4px; font-weight: bold;">3</span>
Cherchons s'il existe des solutions rationnelles tel que les deux cotés de l'equation soient nuls.
</p>

<p>
pour cela :
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>E</mi><mo>(</mo><msub><mi>S</mi><mi>n</mi></msub><mo>&#x22C5;</mo><mi>n</mi><mo>)</mo><mo>=</mo><mn>0</mn></mrow></math>
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mo>&#x21D2;</mo><mn>0</mn><mo>&#x2264;</mo><msub><mi>S</mi><mi>n</mi></msub><mo>&#x22C5;</mo><mi>n</mi><mo>&lt;</mo><mn>1</mn></mrow></math>
donc
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mn>0</mn><mo>&lt;</mo><mi>n</mi><mo>&lt;</mo><mfrac><mn>1</mn><msub><mi>S</mi><mi>n</mi></msub></mfrac></mrow></math>
</p>

<p>
<span style="text-decoration: underline;">a) Pour le coté</span>
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mo>(</mo><mi>E</mi><mo>(</mo><msub><mi>S</mi><mi>n</mi></msub><mo>&#x22C5;</mo><mi>n</mi><mo>)</mo><mo>)</mo></mrow></math> :
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>n</mi><mo>&lt;</mo><mfrac><mn>1</mn><msub><mi>S</mi><mi>n</mi></msub></mfrac></mrow></math>
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mo>&#x21D2;</mo><mn>0</mn><mo>&lt;</mo><msub><mi>S</mi><mi>n</mi></msub><mo>&#x22C5;</mo><mi>n</mi><mo>&lt;</mo><mn>1</mn></mrow></math>
</p>

<p>
par conséquent :
<table style="border: 2px solid #1a237e; width: auto; border-collapse: collapse; display: inline-table;">
<tr><td style="padding: 4px 10px;">
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>E</mi><mo>(</mo><msub><mi>S</mi><mi>n</mi></msub><mo>&#x22C5;</mo><mi>n</mi><mo>)</mo><mo>=</mo><mn>0</mn></mrow></math>
</td></tr>
</table>
</p>

<p>
<span style="text-decoration: underline;">b) Pour le coté</span>
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><msub><mi>F</mi><mi>n</mi></msub><mo>(</mo><mi>n</mi><mo>)</mo></mrow></math> :
</p>

<p>
Si
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>n</mi><mo>&lt;</mo><mfrac><mn>1</mn><msub><mi>S</mi><mi>n</mi></msub></mfrac></mrow></math>
alors pour tout entier k allant de 1 à n on a :
</p>

<p style="text-align: center;">
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>k</mi><mo>&#x22C5;</mo><mi>n</mi><mo>&#x2264;</mo><mi>n</mi><mo>&#x22C5;</mo><mi>n</mi><mo>&lt;</mo><mi>n</mi><mo>&#x22C5;</mo><mfrac><mn>1</mn><msub><mi>S</mi><mi>n</mi></msub></mfrac></mrow></math>
</p>

<p>
Or pour
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>n</mi><mo>&#x2265;</mo><mn>1</mn></mrow></math>
on sait que
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><msub><mi>S</mi><mi>n</mi></msub><mo>&#x2265;</mo><mi>n</mi></mrow></math>,
donc
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mfrac><mi>n</mi><msub><mi>S</mi><mi>n</mi></msub></mfrac><mo>&lt;</mo><mn>1</mn></mrow></math>
</p>

<p>
d'où :
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>k</mi><mo>&#x22C5;</mo><mi>n</mi><mo>&lt;</mo><mn>1</mn></mrow></math>.
C'est à dire
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>E</mi><mo>(</mo><mi>k</mi><mo>&#x22C5;</mo><mi>n</mi><mo>)</mo><mo>=</mo><mn>0</mn></mrow></math>
pour tout k.
</p>

<p>
- On a :
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><msub><mi>F</mi><mi>n</mi></msub><mo>(</mo><mi>n</mi><mo>)</mo><mo>=</mo><munderover><mo>&#x2211;</mo><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><mi>E</mi><mo>(</mo><mi>k</mi><mo>&#x22C5;</mo><mi>n</mi><mo>)</mo></mrow></math>
</p>

<p>
<table style="border: 2px solid #1a237e; width: auto; border-collapse: collapse;">
<tr><td style="padding: 4px 10px;">
Si
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>n</mi><mo>&lt;</mo><mfrac><mn>1</mn><msub><mi>S</mi><mi>n</mi></msub></mfrac></mrow></math>
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mo>&#x21D2;</mo><msub><mi>F</mi><mi>n</mi></msub><mo>(</mo><mi>n</mi><mo>)</mo><mo>=</mo><mn>0</mn></mrow></math>
</td></tr>
</table>
</p>

<p style="margin-top: 20px;">
<span style="text-decoration: underline;">En conclusion :</span>
</p>

<p>
- Nous avons montré que :
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mo>&#x2200;</mo><mi>n</mi><mo>&#x2208;</mo><mo>]</mo><mn>0</mn><mo>;</mo><mfrac><mn>1</mn><msub><mi>S</mi><mi>n</mi></msub></mfrac><mo>[</mo></mrow></math>
; n est solution de l'equation (*).
</p>

<p>
Puisque l'intervalle
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mo>]</mo><mn>0</mn><mo>;</mo><mfrac><mn>1</mn><msub><mi>S</mi><mi>n</mi></msub></mfrac><mo>[</mo></mrow></math>
est non vide, il existe une infinité de solutions rationnelles non entière.
</p>

<p>
Ex :
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>n</mi><mo>=</mo><mfrac><mn>1</mn><mrow><mn>2</mn><msub><mi>S</mi><mi>n</mi></msub></mrow></mfrac></mrow></math>
</p>

<p style="text-align: center;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
<mrow>
<msub><mi>F</mi><mi>n</mi></msub><mo>(</mo><mfrac><mn>1</mn><mrow><mn>2</mn><msub><mi>S</mi><mi>n</mi></msub></mrow></mfrac><mo>)</mo>
<mo>=</mo>
<mi>E</mi><mo>(</mo><msub><mi>S</mi><mi>n</mi></msub><mo>&#x22C5;</mo><mfrac><mn>1</mn><mrow><mn>2</mn><msub><mi>S</mi><mi>n</mi></msub></mrow></mfrac><mo>)</mo>
</mrow>
</math>
</p>

<p style="text-align: center;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
<mrow>
<munderover><mo>&#x2211;</mo><mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover>
<mi>E</mi><mo>(</mo><mfrac><mi>k</mi><mrow><mn>2</mn><msub><mi>S</mi><mi>n</mi></msub></mrow></mfrac><mo>)</mo>
<mo>=</mo>
<mi>E</mi><mo>(</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>)</mo>
</mrow>
</math>
</p>

<p style="text-align: center;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
<mrow>
<mo>=</mo><mn>0</mn>
<mspace width="4em"/>
<mo>=</mo><mn>0</mn>
</mrow>
</math>
</p>

<p style="text-align: right; margin-top: 10px;">
<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>n</mi><mo>=</mo><mfrac><mn>1</mn><mrow><mn>2</mn><msub><mi>S</mi><mi>n</mi></msub></mrow></mfrac></mrow></math>
vérifie donc l'equation.
</p>

</body>
</html>
`;

// ---- Envoi de la requête ----
async function main() {
  console.log('📤 Envoi du HTML de test vers ' + SERVER_URL + '…');
  console.log('   HTML : ' + testHtml.length + ' caractères.');

  try {
    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: testHtml }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error('Serveur a répondu HTTP ' + response.status + ' : ' + errorBody);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { writeFileSync } = await import('node:fs');
    writeFileSync(OUTPUT_FILE, buffer);

    console.log('✅ Fichier sauvegardé : ' + OUTPUT_FILE + ' (' + buffer.length + ' octets)');
    console.log('   → Ouvrez-le dans Microsoft Word pour valider le résultat.');
  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  }
}

main();

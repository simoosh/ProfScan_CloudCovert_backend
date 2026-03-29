import crypto from 'node:crypto';

// Copiez-collez ici le contenu exact de votre HTML (celui envoyé à CloudConvert)
const testHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Document de test — PoC CloudConvert</title>
</head>
<body style="font-family: 'Calibri', 'Arial', sans-serif; margin: 40px; line-height: 1.6;">

  <h1 style="color: #1a237e; border-bottom: 3px solid #1a237e; padding-bottom: 8px;">
    Preuve de Concept : Conversion HTML → DOCX
  </h1>

  <p style="font-size: 14pt;">
    Ce document démontre la conversion <strong style="color: #c62828;">fidèle</strong>
    d'un fichier HTML contenant du <em>CSS inline</em> et des équations
    <span style="background-color: #fff9c4; padding: 2px 6px; border-radius: 4px;">MathML</span>
    en un fichier Microsoft Word <code>.docx</code> natif et éditable.
  </p>

  <h2 style="color: #283593;">1. Équation en bloc (display)</h2>
  <p>Voici la célèbre formule quadratique :</p>

  <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
    <mrow>
      <mi>x</mi>
      <mo>=</mo>
      <mfrac>
        <mrow>
          <mo>−</mo>
          <mi>b</mi>
          <mo>±</mo>
          <msqrt>
            <mrow>
              <msup><mi>b</mi><mn>2</mn></msup>
              <mo>−</mo>
              <mn>4</mn><mi>a</mi><mi>c</mi>
            </mrow>
          </msqrt>
        </mrow>
        <mrow>
          <mn>2</mn><mi>a</mi>
        </mrow>
      </mfrac>
    </mrow>
  </math>

  <h2 style="color: #283593;">2. Équation inline</h2>
  <p>
    En physique, l'énergie cinétique est donnée par
    <math xmlns="http://www.w3.org/1998/Math/MathML">
      <mrow>
        <mi>E</mi>
        <mo>=</mo>
        <mfrac>
          <mn>1</mn>
          <mn>2</mn>
        </mfrac>
        <mi>m</mi>
        <msup><mi>v</mi><mn>2</mn></msup>
      </mrow>
    </math>
    où <em>m</em> est la masse et <em>v</em> la vitesse.
  </p>

  <h2 style="color: #283593;">3. Tableau avec mise en forme</h2>
  <table style="border-collapse: collapse; width: 100%; margin-top: 10px;">
    <thead>
      <tr style="background-color: #1a237e; color: white;">
        <th style="padding: 10px; border: 1px solid #ccc;">Variable</th>
        <th style="padding: 10px; border: 1px solid #ccc;">Description</th>
        <th style="padding: 10px; border: 1px solid #ccc;">Valeur</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background-color: #e8eaf6;">
        <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold;">a</td>
        <td style="padding: 8px; border: 1px solid #ccc;">Coefficient quadratique</td>
        <td style="padding: 8px; border: 1px solid #ccc;">1</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold;">b</td>
        <td style="padding: 8px; border: 1px solid #ccc;">Coefficient linéaire</td>
        <td style="padding: 8px; border: 1px solid #ccc;">−5</td>
      </tr>
      <tr style="background-color: #e8eaf6;">
        <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold;">c</td>
        <td style="padding: 8px; border: 1px solid #ccc;">Terme constant</td>
        <td style="padding: 8px; border: 1px solid #ccc;">6</td>
      </tr>
    </tbody>
  </table>

  <p style="margin-top: 20px; padding: 12px; background-color: #e8f5e9; border-left: 4px solid #2e7d32; border-radius: 4px;">
    ✅ Si ce document s'affiche correctement dans Word avec les styles CSS préservés
    et les équations éditables nativement, le PoC est validé.
  </p>

</body>
</html>
`;

const hash = crypto.createHash('md5').update(testHtml).digest('hex');

console.log('='.repeat(40));
console.log('VOTRE HASH MD5 POUR LE SANDBOX :');
console.log(hash);
console.log('='.repeat(40));
console.log('\nCopiez cette valeur dans votre Dashboard CloudConvert Sandbox');
console.log('sous "MD5 Hashes for Sandbox Uploads".');

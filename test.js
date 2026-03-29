// =============================================================================
// test.js — Script de test : envoie un HTML avec CSS + MathML au serveur local
// =============================================================================

const SERVER_URL = 'http://localhost:3000/convert';
const OUTPUT_FILE = 'test-output.docx';

// ---- HTML de test ----
// Contient :
//   • Du CSS inline (gras, couleurs, fond, bordure)
//   • Une équation MathML en display (formule quadratique)
//   • Une équation MathML inline (fraction simple)
const testHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>مستند تجريبي — PoC CloudConvert</title>
</head>
<body style="font-family: 'Arial', 'Calibri', sans-serif; margin: 40px; line-height: 1.6; text-align: right;">

  <h1 style="color: #1a237e; border-bottom: 3px solid #1a237e; padding-bottom: 8px; text-align: center;">
    إثبات المفهوم : تحويل HTML → DOCX
  </h1>

  <p style="font-size: 14pt;">
    يوضح هذا المستند التحويل <strong style="color: #c62828;">الدقيق</strong>
    لملف HTML يحتوي على <em>تنسيق CSS مضمن</em> ومعادلات
    <span style="background-color: #fff9c4; padding: 2px 6px; border-radius: 4px;" dir="ltr">MathML</span>
    إلى ملف Microsoft Word <code>.docx</code> أصلي وقابل للتعديل.
  </p>

  <h2 style="color: #283593;">1. معادلة في كتلة مستقلة (Display)</h2>
  <p>إليك المعادلة التربيعية الشهيرة :</p>

  <!-- Note: Les équations restent en LTR même dans un document RTL -->
  <div dir="ltr" style="text-align: center; margin: 15px 0;">
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
  </div>

  <h2 style="color: #283593;">2. معادلة مضمنة في النص (Inline)</h2>
  <p>
    في الفيزياء، تُعطى الطاقة الحركية بالمعادلة
    <span dir="ltr">
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
    </span>
    حيث <em>m</em> هي الكتلة و <em>v</em> هي السرعة.
  </p>

  <h2 style="color: #283593;">3. جدول منسق</h2>
  <table style="border-collapse: collapse; width: 100%; margin-top: 10px;" dir="rtl">
    <thead>
      <tr style="background-color: #1a237e; color: white;">
        <th style="padding: 10px; border: 1px solid #ccc;">المتغير</th>
        <th style="padding: 10px; border: 1px solid #ccc;">الوصف</th>
        <th style="padding: 10px; border: 1px solid #ccc;">القيمة</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background-color: #e8eaf6;">
        <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; text-align: center;" dir="ltr">a</td>
        <td style="padding: 8px; border: 1px solid #ccc;">المعامل التربيعي</td>
        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;" dir="ltr">1</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; text-align: center;" dir="ltr">b</td>
        <td style="padding: 8px; border: 1px solid #ccc;">المعامل الخطي</td>
        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;" dir="ltr">−5</td>
      </tr>
      <tr style="background-color: #e8eaf6;">
        <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold; text-align: center;" dir="ltr">c</td>
        <td style="padding: 8px; border: 1px solid #ccc;">الثابت</td>
        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;" dir="ltr">6</td>
      </tr>
    </tbody>
  </table>

  <p style="margin-top: 20px; padding: 12px; background-color: #e8f5e9; border-right: 4px solid #2e7d32; border-radius: 4px;">
    ✅ إذا ظهر هذا المستندشكل صحيح في برنامج Word مع الحفاظ على تنسيقات CSS
    والمعادلات قابلة للتعديل محلياً، فإن إثبات المفهوم (PoC) ناجح.
  </p>

</body>
</html>
`;

// ---- Envoi de la requête ----
async function main() {
  console.log(`📤 Envoi du HTML de test vers ${SERVER_URL}…`);
  console.log(`   HTML : ${testHtml.length} caractères, 2 équations MathML.`);

  try {
    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: testHtml }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Serveur a répondu HTTP ${response.status} : ${errorBody}`);
    }

    // Lire la réponse en tant que Buffer et sauvegarder sur disque
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Écriture sur disque via fs (import dynamique car c'est un script simple)
    const { writeFileSync } = await import('node:fs');
    writeFileSync(OUTPUT_FILE, buffer);

    console.log(`✅ Fichier sauvegardé : ${OUTPUT_FILE} (${buffer.length} octets)`);
    console.log('   → Ouvrez-le dans Microsoft Word pour valider le résultat.');
  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  }
}

main();

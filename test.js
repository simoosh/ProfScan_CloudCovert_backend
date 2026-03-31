// =============================================================================
// test.js — Script de test : envoie un HTML avec CSS + MathML au serveur local
// =============================================================================

const SERVER_URL = 'http://localhost:3000/convert';
const OUTPUT_FILE = 'test-output.docx';

// ---- HTML de test ----
// Contient :
//   • Du CSS inline uniquement (couleurs, soulignements, tailles)
//   • Des équations MathML display (formule dérivée, système d'équations)
//   • Des équations MathML inline (fractions, variables)
//   • Aucun style sur les balises MathML (compatibilité OMML)
const testHtml = `


<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Transcription</title></head><body style="font-family: 'Calibri', 'Arial', sans-serif; margin: 40px; line-height: 1.8; font-size: 12pt;">
<p style="text-align: center; color: #C00000; font-size: 18pt; font-weight: bold;" dir="rtl">اختبار الفصيل المقابل في</p>
<p style="text-align: center; color: #C00000; font-size: 18pt; font-weight: bold; text-decoration: underline;" dir="rtl">الرياضيات</p>
<p style="text-align: right; color: #0000CD; font-size: 16pt; font-weight: bold; margin-top: 30px;" dir="rtl">التمرين الأول</p>
<p style="text-align: right; color: #0000CD;" dir="rtl">كيس غير شفاف يحتوي على كريات لا يمكن التمييز بينها باللمس.</p>
<p style="text-align: right; color: #0000CD;" dir="rtl">كرية منها تحمل الأرقام: 5, 7, 7, 2, 3.</p>
<p style="text-align: right; color: #0000CD;" dir="rtl">نسحب 3 كريات في آن واحد.</p>
<p style="text-align: right; color: #0000CD; margin-top: 20px;" dir="rtl">نعتبر الأحداث التالية:</p>
<p style="text-align: right; color: #0000CD;" dir="rtl">"A": الكرات المسحوبة بها تحمل الأرقام الزوجية.</p>
<p style="text-align: right; color: #0000CD;" dir="rtl">"B": الكرات المسحوبة بها تحمل نفس اللون.</p>
<p style="text-align: right; color: #0000CD;" dir="rtl">"C": مجموع الأرقام المسحوبة بها مضاعف لـ 3.</p>
<p style="text-align: right; color: #0000CD; margin-top: 20px;" dir="rtl">1. احسب <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>P</mi><mo>(</mo><mi>A</mi><mo>)</mo></math></span> و <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>P</mi><mo>(</mo><mi>B</mi><mo>)</mo></math></span> و <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>P</mi><mo>(</mo><mi>C</mi><mo>)</mo></math></span>.</p>
<p style="text-align: right; color: #0000CD;" dir="rtl">2. بين أن <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>P</mi><mo>(</mo><mi>A</mi><mo>∪</mo><mi>B</mi><mo>)</mo><mo>=</mo><mfrac><mrow><mn>10</mn></mrow><mrow><mn>33</mn></mrow></mfrac></math></span> ثم استنتج <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>P</mi><mo>(</mo><mi>A</mi><mo>∩</mo><mi>B</mi><mo>)</mo></math></span>.</p>
<p style="text-align: right; color: #0000CD;" dir="rtl">3. ليكن <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>X</mi></math></span> المتغير العشوائي الذي يرفق بكل عملية سحب بعدد الكرات المسحوبة التي تحمل الرقم 5.</p>
<p style="text-align: right; color: #0000CD;" dir="rtl">أ. عين مجموعة قيم <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>X</mi></math></span>.</p>
<p style="text-align: right; color: #0000CD;" dir="rtl">ب. و أن قانون الإحتمال للمتغير العشوائي <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>X</mi></math></span>.</p>
<p style="text-align: right; color: #0000CD; font-size: 16pt; font-weight: bold; margin-top: 30px;" dir="rtl">التمرين الثاني</p>
<p style="text-align: right; color: #0000CD;" dir="rtl">المتتالية <span dir="ltr">(<math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>U</mi><mi>n</mi></msub></math>)</span> معرفة على <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>&#x2115;</mi></math></span> بـ:</p>
<p style="text-align: right; color: #0000CD;" dir="rtl"><span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><msub><mi>U</mi><mn>0</mn></msub><mo>=</mo><mn>11</mn></math></span></p>
<p style="text-align: right; color: #0000CD;" dir="rtl">و</p>
<p style="text-align: right; color: #0000CD;" dir="rtl"><span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><msub><mi>U</mi><mrow><mi>n</mi><mo>+</mo><mn>1</mn></mrow></msub><mo>=</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><msub><mi>U</mi><mi>n</mi></msub><mo>+</mo><mn>3</mn></math></span></p>
<p style="text-align: right; color: #0000CD; margin-top: 20px;" dir="rtl">1. أ. احسب <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>U</mi><mn>1</mn></msub></math></span> و <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>U</mi><mn>2</mn></msub></math></span>.</p>
<p style="text-align: right; color: #0000CD;" dir="rtl">1. ب. بين أن <span dir="ltr">(<math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>U</mi><mi>n</mi></msub></math>)</span> ليست حسابية و ليست هندسية.</p>
<p style="text-align: right; color: #0000CD; margin-top: 20px;" dir="rtl">2. المتتالية <span dir="ltr">(<math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>V</mi><mi>n</mi></msub></math>)</span> معرفة على <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>&#x2115;</mi></math></span> بـ:</p>
<p style="text-align: right; color: #0000CD;" dir="rtl"><span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><msub><mi>V</mi><mi>n</mi></msub><mo>=</mo><msub><mi>U</mi><mi>n</mi></msub><mo>-</mo><mn>6</mn></math></span></p>
<p style="text-align: right; color: #0000CD;" dir="rtl">أ. بين أن <span dir="ltr">(<math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>V</mi><mi>n</mi></msub></math>)</span> متتالية هندسية أساسها <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac><mn>1</mn><mn>2</mn></mfrac></math></span> و حدها الأول <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>V</mi><mn>0</mn></msub></math></span>.</p>
<p style="text-align: right; color: #0000CD;" dir="rtl">ب. عبر عن <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><msub><mi>V</mi><mi>n</mi></msub></math></span> بدلالة <span dir="ltr"><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>n</mi></math></span>.</p>
</body></html>
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

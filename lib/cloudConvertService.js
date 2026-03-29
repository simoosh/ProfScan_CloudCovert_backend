// =============================================================================
// lib/cloudConvertService.js — Conversion HTML → DOCX via CloudConvert Sandbox
// =============================================================================
import CloudConvert from 'cloudconvert';

// ---- Initialisation du SDK en mode Sandbox ----
const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);
// Le second argument `true` active automatiquement l'URL Sandbox :
// https://api.sandbox.cloudconvert.com

/**
 * Envoie une string HTML à CloudConvert (Sandbox) et retourne le fichier .docx
 * résultant sous forme de Buffer en mémoire.
 *
 * Le Job créé comporte 3 tâches :
 *   1. import/raw   — injecte le HTML directement (pas d'upload fichier)
 *   2. convert      — html → docx via le moteur LibreOffice (engine: office)
 *   3. export/url   — génère une URL de téléchargement temporaire
 *
 * @param {string} html — Le HTML à convertir (déjà pré-traité, sans <math>).
 * @returns {Promise<Buffer>} — Le contenu binaire du fichier .docx.
 */
export async function convertHtmlToDocx(html) {
  // ------------------------------------------------------------------
  // 1. Créer le Job avec les 3 tâches
  // ------------------------------------------------------------------
  let job = await cloudConvert.jobs.create({
    tasks: {
      'import-html': {
        operation: 'import/raw',
        file: html,
        filename: 'document.html',
      },
      'convert-to-docx': {
        operation: 'convert',
        input: ['import-html'],
        input_format: 'html',
        output_format: 'docx',
        engine: 'office',  // Utilise le moteur LibreOffice côté CloudConvert
      },
      'export-result': {
        operation: 'export/url',
        input: ['convert-to-docx'],
      },
    },
  });

  // ------------------------------------------------------------------
  // 2. Attendre la fin du Job
  // ------------------------------------------------------------------
  job = await cloudConvert.jobs.wait(job.id);

  // Vérifier le statut global
  if (job.status === 'error') {
    const errorTask = job.tasks.find((t) => t.status === 'error');
    const errorMsg = errorTask?.message || 'Erreur inconnue CloudConvert';
    throw new Error(`CloudConvert Job échoué : ${errorMsg}`);
  }

  // ------------------------------------------------------------------
  // 3. Récupérer l'URL d'export et télécharger le .docx
  // ------------------------------------------------------------------
  const exportTask = job.tasks.find(
    (t) => t.operation === 'export/url' && t.status === 'finished',
  );

  if (!exportTask || !exportTask.result?.files?.length) {
    throw new Error('Aucun fichier exporté par CloudConvert.');
  }

  const fileUrl = exportTask.result.files[0].url;
  console.log(`      → Téléchargement du .docx depuis CloudConvert…`);

  // Télécharger le fichier en tant que Buffer
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(
      `Échec du téléchargement du .docx (HTTP ${response.status})`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

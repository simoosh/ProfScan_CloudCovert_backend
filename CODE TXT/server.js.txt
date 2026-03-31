// =============================================================================
// server.js — Orchestrateur Express pour le pipeline HTML → DOCX
// =============================================================================
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { processMath } from './lib/mathProcessor.js';
import { convertHtmlToDocx } from './lib/cloudConvertService.js';
import { patchDocxWithOmml } from './lib/docxPatcher.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middlewares ----------
app.use(cors());
// Augmenter la limite de taille du body pour les gros documents HTML
app.use(express.json({ limit: '10mb' }));

// ---------- Route principale ----------
/**
 * POST /convert
 * Body JSON : { "html": "<html>...</html>" }
 * Réponse   : fichier .docx (application/octet-stream)
 */
app.post('/convert', async (req, res) => {
  try {
    const { html } = req.body;

    if (!html || typeof html !== 'string') {
      return res.status(400).json({
        error: 'Le champ "html" (string) est requis dans le body JSON.',
      });
    }

    console.log('[1/4] Pré-traitement MathML → OMML + traceurs…');
    const { processedHtml, mathMap } = processMath(html);

    console.log(`      → ${Object.keys(mathMap).length} équation(s) détectée(s).`);

    // --- NOUVEAU LOG POUR LE MD5 DU SANDBOX ---
    // const md5Hash = crypto.createHash('md5').update(processedHtml).digest('hex');
    // console.log('='.repeat(50));
    // console.log(`🔑 HASH MD5 À AJOUTER DANS LE SANDBOX: ${md5Hash}`);
    //console.log('='.repeat(50));

    console.log('[2/4] Envoi à CloudConvert (Sandbox) pour conversion HTML → DOCX…');
    const rawDocxBuffer = await convertHtmlToDocx(processedHtml);

    console.log('[3/4] Chirurgie XML : injection des équations OMML dans le .docx…');
    const patchedDocxBuffer = await patchDocxWithOmml(rawDocxBuffer, mathMap);

    console.log('[4/4] Envoi de la réponse au client.');
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="resultat.docx"',
      'Content-Length': patchedDocxBuffer.length,
    });
    return res.send(patchedDocxBuffer);
  } catch (err) {
    console.error('❌ Erreur dans /convert :', err);
    return res.status(500).json({
      error: 'Erreur interne lors de la conversion.',
      details: err.message,
    });
  }
});

// ---------- Route de debug ----------
/**
 * POST /convert-debug
 * Body JSON : { "html": "<html>...</html>" }
 * Réponse   : JSON avec les détails intermédiaires du pipeline
 */
app.post('/convert-debug', async (req, res) => {
  try {
    const { html } = req.body;
    if (!html || typeof html !== 'string') {
      return res.status(400).json({ error: 'Le champ "html" est requis.' });
    }

    const { processedHtml, mathMap } = processMath(html);

    const debugInfo = {
      inputHtmlLength: html.length,
      processedHtmlLength: processedHtml.length,
      equationsFound: Object.keys(mathMap).length,
      equations: {},
      processedHtmlPreview: processedHtml.substring(0, 2000),
    };

    for (const [key, val] of Object.entries(mathMap)) {
      debugInfo.equations[key] = {
        isDisplay: val.isDisplay,
        ommlLength: val.omml.length,
        ommlPreview: val.omml.substring(0, 300),
      };
    }

    return res.json(debugInfo);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ---------- Health-check ----------
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Prof-Scanner CloudConvert PoC v2' });
});

// ---------- Démarrage ----------
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/convert  ← envoyer { "html": "..." }`);
});

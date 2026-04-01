// =============================================================================
// generate-hash.js — Calcule le hash MD5 du HTML PRÉ-TRAITÉ envoyé à CloudConvert
// =============================================================================
// IMPORTANT : CloudConvert calcule le MD5 sur le contenu REÇU, c'est-à-dire
// le HTML APRÈS que processMath() a remplacé les <math> par des traceurs.
// Ce script calcule donc ce hash exact.
// =============================================================================
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { processMath } from './lib/mathProcessor.js';

// Extraire le HTML de test.js en lisant le fichier et en isolant le template literal
const testJsContent = readFileSync('./test.js', 'utf8');

// Chercher le contenu entre les backticks de testHtml = `...`
const match = testJsContent.match(/const testHtml\s*=\s*`([\s\S]*?)`;/);
if (!match) {
  console.error('❌ Impossible de trouver testHtml dans test.js');
  process.exit(1);
}

const rawHtml = match[1];

console.log('📝 HTML brut extrait de test.js');
console.log(`   Longueur : ${rawHtml.length} caractères`);
console.log('');

// Pré-traiter (remplacer les <math> par des traceurs)
const { processedHtml, mathMap } = processMath(rawHtml);

console.log(`   Équations extraites : ${Object.keys(mathMap).length}`);
console.log('');

// Calculer le MD5 du HTML pré-traité
const md5Hash = crypto.createHash('md5').update(processedHtml).digest('hex');

console.log('='.repeat(60));
console.log(`🔑 HASH MD5 À AJOUTER DANS LE SANDBOX CLOUDCONVERT :`);
console.log(`   ${md5Hash}`);
console.log('='.repeat(60));
console.log('');
console.log('Collez ce hash dans le Dashboard CloudConvert > Sandbox > Allowed Hashes');

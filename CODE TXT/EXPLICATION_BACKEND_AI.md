# 🧩 Documentation Technique Détaillée : PoC Prof-Scanner CloudConvert

Ce document explique de manière exhaustive l'architecture et le fonctionnement interne du backend de conversion HTML vers DOCX avec support natif des équations MathML/OMML. Il est conçu pour être parfaitement interprété par une IA.

---

## 🏗️ Architecture Globale

Le projet est un microservice Node.js (ES Modules) dont l'objectif est de transformer un flux HTML complexe (contenant du CSS inline et des équations mathématiques en MathML) en un fichier Microsoft Word (`.docx`) éditable, où les équations sont converties au format natif Office Math Open XML (OMML).

### Pipeline de Données (4 Étapes)
Le point d'entrée unique est la route `POST /convert` dans `server.js`. Le flux suit ce parcours :
1. **Pré-traitement Mathématique** (`mathProcessor.js`) : Extraction des équations et remplacement par des traceurs textuels.
2. **Conversion Structurelle** (`cloudConvertService.js`) : Utilisation de l'API CloudConvert pour transformer le HTML (structure + styles) en `.docx`.
3. **Chirurgie XML (Patching)** (`docxPatcher.js`) : Ré-injection des équations OMML dans le fichier Word binaire.
4. **Réponse** : Envoi du buffer binaire final au client.

---

## 🔬 Détail des Modules

### 1. `mathProcessor.js` (L'Extracteur)
*   **Technologie** : `cheerio` (parsing HTML robuste).
*   **Rôle** : Parcourt le DOM HTML à la recherche de balises `<math>`.
*   **Processus** :
    *   Détecte si l'équation est "inline" ou "display" (via l'attribut `display="block"`).
    *   Convertit le MathML brut en OMML via la bibliothèque `mathml2omml`.
    *   Remplace l'élément `<math>` par un traceur unique : `$$$MATH_OMML_N$$$`.
    *   **Subtilité technique** : Le traceur est encapsulé dans un `<span>` avec un style `color:transparent; font-size:1pt;`. Cela garantit que le moteur de conversion (LibreOffice chez CloudConvert) conserve la chaîne de caractères dans le document Word final sans altérer le rendu visuel.
*   **Output** : Un HTML "nettoyé" de ses formules complexes et une `mathMap` (dictionnaire traceur → OMML).

### 2. `cloudConvertService.js` (Le Convertisseur)
*   **Technologie** : SDK officiel `cloudconvert`, mode **Sandbox**.
*   **Moteur** : Utilise l'option `engine: 'office'` (LibreOffice) car c'est le moteur le plus fidèle pour respecter le CSS complexe lors de l'export DOCX.
*   **Configuration du Job** :
    1.  `import/raw` : Reçoit le HTML pré-traité directement sous forme de chaîne de caractères.
    2.  `convert` : Transforme `html` → `docx`.
    3.  `export/url` : Génère un lien de téléchargement temporaire.
*   **Contrainte Sandbox** : L'environnement Sandbox exige un **hash MD5 pré-approuvé** pour tout upload de contenu. Le script `generate-hash.js` est fourni pour calculer ce hash et l'ajouter manuellement dans le dashboard CloudConvert.

### 3. `docxPatcher.js` (Le Chirurgien)
C'est le module le plus critique. Il manipule la structure interne du fichier `.docx` (qui est une archive ZIP de fichiers XML).
*   **Technologie** : `jszip` pour la manipulation de l'archive.
*   **Action sur `word/document.xml`** :
    *   **Injection de Namespace** : Ajoute l'attribut `xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"` à la racine du XML si absent, sinon Word peut ignorer les équations injectées.
    *   **Stratégie de Remplacement de Traceurs** : 
        *   Les traceurs `$$$MATH_OMML_N$$$` peuvent être fragmentés par Word dans plusieurs balises `<w:r>` (runs) (ex: `$$$` dans un run, `MATH` dans un autre).
        *   Le script itère paragraphe par paragraphe (`<w:p>`).
        *   Il reconstruit le texte complet du paragraphe pour localiser le traceur.
        *   S'il trouve un traceur, il effectue un remplacement intelligent au niveau OOXML :
            *   **Bloc (Display)** : L'OMML est wrappé dans `<m:oMathPara>`.
            *   **En ligne (Inline)** : L'OMML est injecté tel quel (format `<m:oMath>`).
        *   Il gère la reconstruction des paragraphs fragmentés pour s'assurer que l'injection ne casse pas la structure XML.

---

## 🛠️ Scripts d'Utilitaires

*   **`server.js`** : Orchestrateur Express avec gestion de la limite de taille (10mb) pour les gros documents.
*   **`test.js`** : Client de test simulant un envoi de document complexe (couleurs, bordures, tableaux, équations inline et display).
*   **`generate-hash.js`** : Calcule le hash MD5 du HTML de test pour la conformité avec la Sandbox CloudConvert.

---

## ⚠️ Notes de Robustesse
1.  **Encodage** : Tout est traité en UTF-8 pour garantir l'intégrité des caractères mathématiques spéciaux.
2.  **Performance** : Les fichiers sont manipulés en mémoire sous forme de Buffers pour éviter les accès disque lents.
3.  **Namespace Math** : Sans l'ajout manuel du namespace `xmlns:m`, Microsoft Word ouvre le fichier mais ignore silencieusement les blocs mathématiques, les considérant comme du contenu XML invalide.

Ce PoC valide la capacité à mixer une conversion graphique puissante (CloudConvert/LibreOffice) avec une manipulation structurelle précise (Injection OMML) pour obtenir des documents de qualité professionnelle.

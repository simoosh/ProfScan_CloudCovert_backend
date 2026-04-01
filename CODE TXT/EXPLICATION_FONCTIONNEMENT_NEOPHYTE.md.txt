# 🧠 Architecture du Backend & Évolution Technique du Patcher

Voici une explication technique détaillée du fonctionnement de notre pipeline de conversion HTML -> DOCX, avec un focus particulier sur la résolution du bug des "textes mangés" autour des équations.

---

## 🏗️ Vue d'ensemble du Pipeline

1. **Pré-traitement (`mathProcessor.js`)** : Intercepte le HTML brut, extrait les balises `<math>` (MathML), les convertit en OMML (langage natif Microsoft Word) via `mathml2omml`, et les remplace par des traceurs textuels invisibles (ex: `$$$MATH_OMML_0$$$`).
2. **Conversion CloudConvert** : Génère le fichier `.docx` à partir du HTML traité. Le traceur reste intact dans le texte du document Word.
3. **Post-traitement (`docxPatcher.js`)** : Décompresse le fichier `.docx` (qui est en réalité une archive ZIP), ouvre le fichier `word/document.xml`, et remplace les traceurs par le code XML OMML généré à l'étape 1.

---

## 🐛 Le Problème du "Texte Mangé" : Pourquoi ça plantait ?

Pour comprendre l'évolution du patcher, il faut comprendre comment le format Word (OOXML) structure le texte.
Dans Word, un paragraphe (`<w:p>`) n'est pas un bloc de texte simple. Il est découpé en "runs" (`<w:r>`). Chaque *run* possède son propre formatage (`<w:rPr>`) et contient un bout de texte (`<w:t>`).

Exemple pour le texte "Événement **A**" :
```xml
<w:p>
  <w:r> <w:t>Événement </w:t> </w:r>
  <w:r> <w:rPr><w:b/></w:rPr> <w:t>A</w:t> </w:r> <!-- En gras -->
</w:p>
```

Quand CloudConvert génère le DOCX, notre traceur `$$$MATH_OMML_0$$$` peut se retrouver **fragmenté** à travers plusieurs *runs* si Word décide de découper le texte (à cause de la correction orthographique, d'un changement d'espace, etc.). 
Exemple de traceur fragmenté :
```xml
<w:r><w:t>$$$MA</w:t></w:r>
<w:r><w:t>TH_OMML_0</w:t></w:r>
<w:r><w:t>$$$</w:t></w:r>
```

### V1 : L'Approche Naïve (Remplacement de chaîne simple)
Au début, on faisait un simple `docXml.replace('$$$MATH_OMML_0$$$', omml)`.
**Problème** : Ça ne marchait QUE si le traceur était parfaitement compacté dans un seul `<w:t>`. S'il était fragmenté (comme ci-dessus), le `.replace()` ne le trouvait pas, et l'équation n'apparaissait jamais.

### V2 : L'Approche Regex (Expressions Régulières)
Pour contrer la fragmentation, on a imaginé une Regex (une formule de recherche complexe) qui disait : *"Trouve-moi tout ce qui commence par `$$$` et se termine par `$$$`, peu importe les balises XML qu'il y a entre les deux"*.
**Problème** : Les Regex sont très mauvaises pour comprendre le XML. Parfois, la Regex s'emballait et englobait le traceur + du vrai texte valide qui se trouvait à côté, voire remplaçait la moitié du paragraphe. Résultat : le texte autour de l'équation disparaissait (il était "mangé" par le remplacement).

### V3 : La Reconstruction Totale
On a essayé une autre méthode : lire tout le texte d'un paragraphe, localiser le traceur, effacer **tous** les runs du paragraphe, et recréer de nouveaux runs propres de A à Z.
**Problème** : En recréant les runs "from scratch", on perdait tout le formatage d'origine. Si le paragraphe contenait du français, des maths, et de l'arabe (RTL), la reconstruction écrasait l'attribut *Right-to-Left* et les propriétés gras/souligné. Le texte arabe et les abréviations (comme A, B, C) devenaient invisibles ou mal formatés.

---

## 🎯 V4 : L'Approche "Chirurgicale" par Indexation (La Solution Actuelle)

La solution finale et robuste que l'on utilise maintenant procède à un remplacement "au scalpel". Plutôt que d'utiliser des Regex aveugles ou de tout reconstruire, le code **cartographie** la position exacte de chaque caractère.

Voici comment la V4 fonctionne techniquement (la méthode "par index") :

1. **Cartographie du Paragraphe** :  
   Le patcher prend un paragraphe et liste tous ses *runs*. Il va pointer (indexer) chaque lettre à son run d'origine.
   *Exemple simplifié :*
   Run 0 : `Soit ` (Index 0 à 3)
   Run 1 : `$$$MATH_0$$$` (Index 4 à 15)
   Run 2 : ` la solution` (Index 16 à 27)

2. **Recherche Sûre sur le Texte Brut** :  
   On assemble virtuellement tout le texte sans les balises (`Soit $$$MATH_0$$$ la solution`) et on utilise un simple `indexOf('$$$MATH_0$$$')`. Ça nous donne la position exacte de début et de fin du traceur en termes d'"index" (position des caractères). Dans notre exemple, on sait que l'équation se trouve exactement entre les caractères 4 et 15.

3. **Injection Millimétrée (Le Remplacement Chirurgical)** :  
   Puisqu'on connait les positions exactes, on reconstruit le XML final en disant :
   - Je garde intact tout le XML des runs qui sont *avant* l'index 4 (Run 0 conservé à 100%).
   - Je remplace les runs qui sont entre l'index 4 et l'index 15 par mon code OMML (Run 1 est effacé et remplacé par l'équation).
   - Je garde intact tout le XML des runs qui sont *après* l'index 15 (Run 2 conservé à 100%).

**✅ Pourquoi c'est infaillible ?**
- **Plus de fragmentation** : On cherche sur le texte pur assemblé en mémoire, donc si Word a coupé le traceur en 3 morceaux, on s'en fiche, on trouve la position quand même.
- **Plus de texte mangé** : On sait exactement dans quel(s) *run(s)* vit le traceur. On ne touche absolument pas aux *runs* adjacents.
- **Conservation à 100% du style** : Puisqu'on ne recrée pas le paragraphe, les *runs* qui contiennent du gras, de la couleur ou du texte en écriture de droite à gauche (Arabe/RTL) restent dans leur balise d'origine, totalement intacts.

C'est pour cela que les événements (A, B, C) ne disparaîtront plus, et que le texte adjacent aux petites équations ("inline") restera parfaitement formaté en taille normale.

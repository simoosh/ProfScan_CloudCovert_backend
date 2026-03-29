# 🛠️ Guide de Configuration — CloudConvert Sandbox

Ce guide explique comment configurer l'API **Sandbox** de CloudConvert pour faire fonctionner ce PoC.

---

## 1. Créer un compte CloudConvert

1. Rendez-vous sur [cloudconvert.com](https://cloudconvert.com) et créez un compte gratuit.
2. Une fois connecté, accédez au **Dashboard Sandbox** :  
   👉 [https://sandbox.cloudconvert.com/dashboard](https://sandbox.cloudconvert.com/dashboard)

> **Note :** Le mode Sandbox est un environnement de test gratuit et isolé. Aucune minute de conversion n'est débitée.

---

## 2. Récupérer la clé API Sandbox

1. Allez dans **Dashboard → API v2 → API Keys** :  
   👉 [https://sandbox.cloudconvert.com/dashboard/api/v2/keys](https://sandbox.cloudconvert.com/dashboard/api/v2/keys)
2. Cliquez sur **Create API Key**.
3. Donnez un nom à la clé (ex: `poc-prof-scanner`).
4. **Scopes requis** : cochez au minimum :
   - `task.read`
   - `task.write`
5. Copiez la clé générée.
6. Créez un fichier `.env` à la racine du projet (en copiant `.env.example`) :

```env
CLOUDCONVERT_API_KEY=votre_cle_api_sandbox_ici
PORT=3000
```

---

## 3. Configurer le Whitelisted Sandbox Hash (MD5)

> ⚠️ **C'est l'étape la plus importante et la plus souvent oubliée.**

L'API Sandbox de CloudConvert **n'accepte que des fichiers dont le hash MD5 a été pré-approuvé** (whitelisté) dans votre dashboard. Sans cela, toute tentative de conversion échouera avec une erreur.

### Comment ça fonctionne ?

Quand vous envoyez du HTML via `import/raw`, CloudConvert calcule le hash MD5 du contenu. Ce hash doit figurer dans votre liste blanche Sandbox.

### Étapes :

#### A. Calculer le hash MD5 de votre HTML

Lancez cette commande dans un terminal **à la racine du projet** pour calculer le MD5 du HTML envoyé par `test.js` :

**PowerShell (Windows) :**
```powershell
node -e "
  import('node:crypto').then(crypto => {
    // Copiez ici le même HTML que dans test.js, ou importez-le
    const html = '<votre HTML>';
    const hash = crypto.createHash('md5').update(html).digest('hex');
    console.log('MD5 :', hash);
  });
"
```

**Méthode simplifiée** — ajoutez temporairement ce code au début de `server.js` ou dans un script dédié :

```javascript
import crypto from 'node:crypto';

const html = `...votre HTML ici...`;
console.log('MD5 du HTML :', crypto.createHash('md5').update(html).digest('hex'));
```

#### B. Ajouter le hash dans le Dashboard Sandbox

1. Allez dans le Dashboard Sandbox :  
   👉 [https://sandbox.cloudconvert.com/dashboard](https://sandbox.cloudconvert.com/dashboard)
2. Cherchez la section **« MD5 Hashes for Sandbox Uploads »** (ou similaire).
3. Ajoutez le hash MD5 calculé à l'étape A.
4. Sauvegardez.

> 💡 **Astuce :** Chaque fois que vous modifiez le contenu HTML envoyé, le hash change. Vous devrez recalculer et re-whitelister le nouveau hash. Pour le développement, gardez un HTML de test stable.

---

## 4. Lancer le PoC

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur
npm start
# ou : node server.js

# 3. Dans un autre terminal, lancer le test
npm test
# ou : node test.js
```

Le fichier `test-output.docx` sera créé à la racine du projet. Ouvrez-le dans Microsoft Word pour valider :

- ✅ Les styles CSS (couleurs, gras, tableau) sont préservés
- ✅ Les équations sont éditables nativement (clic droit → « Professionnel »)
- ✅ Le document est entièrement éditable

---

## 5. Dépannage

| Problème | Cause probable | Solution |
|----------|---------------|----------|
| `403` ou `INPUT_TASK_FAILED` | Hash MD5 non whitelisté | Recalculer le MD5 et l'ajouter au dashboard |
| `401 Unauthorized` | Clé API invalide ou expirée | Vérifier `.env` et régénérer la clé si besoin |
| Équations non remplacées | Traceur introuvable dans le XML | Vérifier les logs console, le traceur a pu être fragmenté |
| Timeout | HTML trop volumineux | Augmenter le timeout ou réduire le HTML |

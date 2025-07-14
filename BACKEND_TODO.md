# 🔧 Points en Attente - Équipe Backend GooseCorp

## 📋 Endpoints Publics à Créer

### 1. **GET /api/public/staff**
**Objectif :** Récupérer la liste du personnel actif pour le formulaire d'inscription

**Spécifications :**
```javascript
// Route à ajouter
router.get('/public/staff', async (req, res) => {
  const staff = await prisma.gooseCorpStaff.findMany({
    where: { isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      department: true,
      position: true
    },
    orderBy: { firstName: 'asc' }
  });
  res.json({ staff });
});
```

**Format de réponse attendu :**
```json
{
  "staff": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "department": "IT",
      "position": "Développeur"
    }
  ]
}
```

---

### 2. **GET /api/public/formations**
**Objectif :** Récupérer la liste des formations actives pour le formulaire d'inscription

**Spécifications :**
```javascript
// Route à ajouter
router.get('/api/public/formations', async (req, res) => {
  const formations = await prisma.gooseCorpFormation.findMany({
    where: { 
      isActive: true,
      startDate: { gte: new Date() }
    },
    select: {
      id: true,
      name: true,
      description: true,
      location: true,
      startDate: true,
      endDate: true,
      instructor: true
    },
    orderBy: { startDate: 'asc' }
  });
  res.json({ formations });
});
```

**Format de réponse attendu :**
```json
{
  "formations": [
    {
      "id": 1,
      "name": "Formation Sécurité",
      "description": "Formation sur la sécurité informatique",
      "location": "Salle A",
      "startDate": "2025-02-01T09:00:00Z",
      "endDate": "2025-02-01T17:00:00Z",
      "instructor": "Expert Sécurité"
    }
  ]
}
```

---

## 🛡️ Sécurité Recommandée

### 3. **Captcha pour l'inscription publique**
**Objectif :** Protéger contre le spam sur `POST /api/visitors`

**Recommandation :**
- Ajouter un captcha simple (reCAPTCHA v2 ou similaire)
- Ou validation côté serveur plus stricte

---

## 📝 Documentation à Mettre à Jour

### 4. **Mise à jour du wiki**
**Fichier :** `FRONTEND_API_GUIDE.md`

**Ajouts nécessaires :**
```markdown
## 🌐 Endpoints Publics

### Lister le Personnel (Public)
```javascript
// GET /api/public/staff
const getPublicStaff = async () => {
  const response = await axios.get(`${API_BASE_URL}/public/staff`);
  return response.data;
};
```

### Lister les Formations (Public)
```javascript
// GET /api/public/formations
const getPublicFormations = async () => {
  const response = await axios.get(`${API_BASE_URL}/public/formations`);
  return response.data;
};
```
```

---

## ✅ Checklist Backend

- [ ] Créer `GET /api/public/staff`
- [ ] Créer `GET /api/public/formations`
- [ ] Tester les nouveaux endpoints
- [ ] Mettre à jour la documentation
- [ ] Ajouter captcha (optionnel mais recommandé)

---

## 🚀 Impact Frontend

Une fois ces endpoints créés, le frontend pourra :
- ✅ Afficher des listes déroulantes pour staff/formations
- ✅ Améliorer l'expérience utilisateur
- ✅ Réduire les erreurs de saisie
- ✅ Valider les données côté client

---

**Priorité :** 🔴 **HAUTE** - Bloque le développement frontend optimal

**Estimation :** 2-3 heures de développement backend

---

*Document créé par l'équipe Frontend - En attente de l'équipe Backend* 🏢 
import { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  getReclassementRules,
  getReclassementTargets,
  saveReclassementRule,
} from '../../api/carrieres';

function initialRule(rule) {
  return {
    ordreAcademique: rule.ordre_academique ?? '',
    classeId: rule.classe_id ? String(rule.classe_id) : '',
    echelonId: rule.echelon_id ? String(rule.echelon_id) : '',
    referenceJuridique: rule.reference_juridique || '',
    actif: rule.actif ?? true,
  };
}

export default function ReclassementRulesPage() {
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [targets, setTargets] = useState([]);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadConfiguration() {
    setLoading(true);
    setError('');
    try {
      const [ruleRows, targetRows] = await Promise.all([
        getReclassementRules(),
        getReclassementTargets(),
      ]);
      setRules(ruleRows);
      setTargets(targetRows);
      setForms(Object.fromEntries(
        ruleRows.map((rule) => [rule.niveau_id, initialRule(rule)])
      ));
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les règles de reclassement.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [ruleRows, targetRows] = await Promise.all([
          getReclassementRules(),
          getReclassementTargets(),
        ]);
        if (cancelled) return;
        setRules(ruleRows);
        setTargets(targetRows);
        setForms(Object.fromEntries(
          ruleRows.map((rule) => [rule.niveau_id, initialRule(rule)])
        ));
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || 'Impossible de charger les règles de reclassement.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateForm(niveauId, name, value) {
    setForms((current) => ({
      ...current,
      [niveauId]: { ...current[niveauId], [name]: value },
    }));
  }

  async function handleSave(niveauId) {
    const form = forms[niveauId];
    setError('');
    setSuccess('');
    if (!Number.isInteger(Number(form.ordreAcademique)) || Number(form.ordreAcademique) <= 0) {
      setError('Chaque niveau doit avoir un ordre académique entier positif.');
      return;
    }
    if (!form.classeId || !form.echelonId || !form.referenceJuridique.trim()) {
      setError('La classe, l’échelon et la référence juridique sont obligatoires.');
      return;
    }

    setSavingId(niveauId);
    try {
      await saveReclassementRule(niveauId, {
        ordreAcademique: Number(form.ordreAcademique),
        classeId: Number(form.classeId),
        echelonId: Number(form.echelonId),
        referenceJuridique: form.referenceJuridique.trim(),
        actif: Boolean(form.actif),
      });
      setSuccess('La règle de reclassement a été enregistrée.');
      await loadConfiguration();
    } catch (saveError) {
      setError(saveError.message || 'Impossible d’enregistrer cette règle.');
    } finally {
      setSavingId(null);
    }
  }

  const classes = [...new Map(targets.map((target) => [
    target.classe_id,
    { id: target.classe_id, label: target.classe },
  ])).values()];

  return (
    <div className="administration-page">
      <header className="administration-page-header">
        <div>
          <button type="button" className="administration-back-button" onClick={() => navigate('/administration')}>
            <ArrowLeft size={17} />Administration
          </button>
          <span className="administration-eyebrow">RÉFÉRENTIELS RH</span>
          <h1>Règles de reclassement</h1>
          <p>Configurez les niveaux académiques et les situations de carrière conformément aux textes réglementaires. Aucun ordre ou équivalent n’est prérempli arbitrairement.</p>
        </div>
      </header>

      {success && <div className="reclassement-config-notice success" role="status">{success}</div>}
      {error && <div className="reclassement-config-notice error" role="alert">{error}</div>}
      {loading ? <div className="administration-state">Chargement des référentiels…</div> : (
        <div className="reclassement-config-list">
          {rules.map((rule) => {
            const form = forms[rule.niveau_id] || initialRule(rule);
            const echelons = targets.filter((target) => String(target.classe_id) === String(form.classeId));
            return (
              <section className="reclassement-config-card" key={rule.niveau_id}>
                <header>
                  <div>
                    <strong>{rule.niveau}</strong>
                    <span>{rule.categorie_code} · {rule.corps_libelle || 'Corps non associé'}</span>
                  </div>
                  <span className={rule.classe_id && rule.ordre_academique ? 'reclassement-config-state configured' : 'reclassement-config-state'}>
                    {rule.classe_id && rule.ordre_academique ? 'Configuré' : 'À configurer'}
                  </span>
                </header>
                <div className="reclassement-config-fields">
                  <label>Ordre académique (plus grand = niveau supérieur)
                    <input type="number" min="1" step="1" value={form.ordreAcademique} onChange={(event) => updateForm(rule.niveau_id, 'ordreAcademique', event.target.value)} />
                  </label>
                  <label>Classe de carrière
                    <select value={form.classeId} onChange={(event) => {
                      updateForm(rule.niveau_id, 'classeId', event.target.value);
                      updateForm(rule.niveau_id, 'echelonId', '');
                    }}>
                      <option value="">Sélectionner une classe</option>
                      {classes.map((careerClass) => <option value={careerClass.id} key={careerClass.id}>{careerClass.label}</option>)}
                    </select>
                  </label>
                  <label>Échelon
                    <select value={form.echelonId} onChange={(event) => updateForm(rule.niveau_id, 'echelonId', event.target.value)}>
                      <option value="">Sélectionner un échelon</option>
                      {echelons.map((echelon) => <option value={echelon.echelon_id} key={echelon.echelon_id}>Échelon {echelon.echelon}</option>)}
                    </select>
                  </label>
                  <label className="wide">Référence juridique
                    <input maxLength="1000" value={form.referenceJuridique} onChange={(event) => updateForm(rule.niveau_id, 'referenceJuridique', event.target.value)} />
                  </label>
                  <label className="reclassement-config-checkbox">
                    <input type="checkbox" checked={Boolean(form.actif)} onChange={(event) => updateForm(rule.niveau_id, 'actif', event.target.checked)} />
                    Règle active
                  </label>
                </div>
                <div className="reclassement-config-footer">
                  {rule.classe && <span>Situation : {rule.classe}, échelon {rule.echelon}</span>}
                  <button type="button" className="administration-primary-button" disabled={savingId === rule.niveau_id} onClick={() => handleSave(rule.niveau_id)}>
                    <Save size={16} />{savingId === rule.niveau_id ? 'Enregistrement…' : 'Enregistrer cette règle'}
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

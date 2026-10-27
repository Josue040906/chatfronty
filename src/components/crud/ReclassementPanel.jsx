import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, GraduationCap, RefreshCw, ShieldCheck } from 'lucide-react';
import { COLORS, accentGradient } from '../../theme';

const API_URL = (import.meta.env.VITE_ASSISTANT_RH_API_URL || 'http://localhost:8080').replace(/\/$/, '');

async function requestJson(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const raw = await response.text();
  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }
  }

  if (!response.ok) {
    const message = data?.message || data?.detail || data?.error
      || `La requête a échoué (HTTP ${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    error.code = data?.code || data?.errorCode || null;
    throw error;
  }
  return data;
}

function formatDate(value) {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('fr-FR');
}

function labelClassification(value) {
  if (!value) return 'Non renseignée';
  const parts = [value.categorieCode, value.corpsLibelle || value.corpsCode].filter(Boolean);
  return parts.length ? parts.join(' — ') : 'Non renseignée';
}

export default function ReclassementPanel({ row, accessToken, darkMode }) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const styles = getStyles(darkMode);
  const canUseApi = Boolean(accessToken && String(row?.matricule || '').trim());

  const loadHistory = useCallback(async (employeeId) => {
    const result = await requestJson(
      `${API_URL}/api/carrieres/employes/${employeeId}/historique-reclassements`,
      accessToken
    );
    setHistory(Array.isArray(result) ? result : []);
  }, [accessToken]);

  const analyse = async () => {
    if (!canUseApi) {
      setError(!accessToken
        ? 'Votre session est absente ou expirée. Reconnectez-vous.'
        : 'Le matricule de cet agent est manquant; aucune opération ne peut être lancée.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setProposal(null);
    try {
      // La liste actuelle de l'interface est une maquette locale : on résout
      // l'identifiant réel à partir du matricule avant d'appeler les routes métier.
      const profile = await requestJson(
        `${API_URL}/api/profil/agent?query=${encodeURIComponent(String(row.matricule).trim())}`,
        accessToken
      );
      const employeeId = Number(profile?.id);
      if (!Number.isInteger(employeeId) || employeeId <= 0) {
        throw new Error("Le backend n'a pas retourné d'identifiant d'agent valide pour ce matricule.");
      }

      const result = await requestJson(
        `${API_URL}/api/carrieres/employes/${employeeId}/reclassement`,
        accessToken
      );
      setProposal({ ...result, employeeId });
      await loadHistory(employeeId);
      if (result?.eligible) {
        setMessage('Un changement de catégorie est proposé. Vérifiez le diplôme et la situation cible avant de confirmer.');
      } else {
        setMessage('Aucun changement de catégorie nécessaire selon le diplôme de référence.');
      }
    } catch (e) {
      setError(e.message || "Impossible d'analyser le reclassement.");
    } finally {
      setLoading(false);
    }
  };

  const confirmer = async () => {
    if (!proposal?.employeeId || !proposal?.eligible || confirming) return;
    const ok = window.confirm(
      `Confirmer le reclassement de ${row.prenom || ''} ${row.nom || ''} selon le diplôme de référence ? Cette action modifiera la catégorie dans SYGPERS et enregistrera l'opération dans l'historique.`
    );
    if (!ok) return;

    setConfirming(true);
    setError('');
    setMessage('');
    try {
      const result = await requestJson(
        `${API_URL}/api/carrieres/employes/${proposal.employeeId}/reclassement`,
        accessToken,
        { method: 'POST' }
      );

      if (result?.changed) {
        setMessage('Reclassement effectué et enregistré dans l’historique.');
        setProposal((previous) => previous ? {
          ...previous,
          eligible: false,
          resultCode: result.resultCode,
          situationActuelle: result.nouvelleCategorie || previous.situationProposee,
          situationProposee: result.nouvelleCategorie || previous.situationProposee,
        } : previous);
      } else {
        setMessage(result?.message || 'Aucun changement appliqué : la situation est déjà conforme.');
      }

      // L'historique est lu depuis l'API : aucune ligne n'est fabriquée côté UI.
      await loadHistory(proposal.employeeId);
      // Recalculer la proposition après confirmation pour refléter l'état réel.
      const nextProposal = await requestJson(
        `${API_URL}/api/carrieres/employes/${proposal.employeeId}/reclassement`,
        accessToken
      );
      setProposal({ ...nextProposal, employeeId: proposal.employeeId });
    } catch (e) {
      setError(e.message || "Le reclassement n'a pas pu être confirmé.");
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    setProposal(null);
    setHistory([]);
    setMessage('');
    setError('');
  }, [row?.id, row?.matricule]);

  return (
    <section style={styles.section} aria-label="Analyse du reclassement">
      <div style={styles.heading}>
        <div style={styles.headingIcon}><GraduationCap size={17} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={styles.title}>Reclassement selon le diplôme</h3>
          <p style={styles.description}>
            Analyse le diplôme valide le plus élevé. La confirmation passe par le backend RH.
          </p>
        </div>
        <ShieldCheck size={17} color={COLORS.green} />
      </div>

      <div style={styles.actions}>
        <button type="button" onClick={analyse} disabled={!canUseApi || loading || confirming} style={styles.primaryButton}>
          {loading ? <RefreshCw size={15} className="spin" /> : <GraduationCap size={15} />}
          {loading ? 'Analyse en cours…' : proposal ? 'Réanalyser' : 'Vérifier l’éligibilité'}
        </button>
        {proposal?.eligible && (
          <button type="button" onClick={confirmer} disabled={loading || confirming} style={styles.confirmButton}>
            {confirming ? 'Enregistrement…' : 'Confirmer le reclassement'}
          </button>
        )}
      </div>

      {!canUseApi && (
        <p style={styles.muted}>Une session valide et le matricule de l’agent sont nécessaires.</p>
      )}

      {error && (
        <div role="alert" style={styles.error}><AlertCircle size={16} /><span>{error}</span></div>
      )}
      {message && !error && (
        <div role="status" style={styles.notice}>
          {proposal?.resultCode === 'RECLASSIFICATION_REQUIRED'
            ? <AlertCircle size={16} />
            : <CheckCircle2 size={16} />}
          <span>{message}</span>
        </div>
      )}

      {proposal && (
        <div style={styles.proposal}>
          <div style={styles.infoRow}>
            <span style={styles.label}>Diplôme de référence</span>
            <strong>{proposal.diplomeRetenu?.intitule || 'Non renseigné'}</strong>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>Niveau</span>
            <strong>
              {proposal.diplomeRetenu?.niveau || 'Non renseigné'}
              {proposal.diplomeRetenu?.ordreAcademique != null
                ? ` (ordre académique ${proposal.diplomeRetenu.ordreAcademique})`
                : ''}
            </strong>
          </div>
          <div style={styles.compareGrid}>
            <div style={styles.compareCard}>
              <span style={styles.label}>Catégorie actuelle</span>
              <strong>{labelClassification(proposal.situationActuelle)}</strong>
            </div>
            <div style={styles.compareCard}>
              <span style={styles.label}>Catégorie proposée</span>
              <strong>{labelClassification(proposal.situationProposee)}</strong>
            </div>
          </div>
          <p style={styles.muted}>
            L’échelon et la classe ne sont pas modifiés par cette opération.
          </p>
        </div>
      )}

      <div style={styles.historyBlock}>
        <div style={styles.historyHeader}>
          <h4 style={styles.historyTitle}>Historique des reclassements</h4>
          {proposal?.employeeId && (
            <button type="button" onClick={() => loadHistory(proposal.employeeId).catch((e) => setError(e.message))} style={styles.refreshButton}>
              <RefreshCw size={13} /> Actualiser
            </button>
          )}
        </div>
        {!proposal && <p style={styles.muted}>Vérifiez d’abord l’éligibilité pour charger l’historique de cet agent.</p>}
        {proposal && history.length === 0 && <p style={styles.muted}>Aucun reclassement enregistré pour cet agent.</p>}
        {history.map((entry) => (
          <article key={entry.id} style={styles.historyItem}>
            <div style={styles.historyTop}>
              <strong>{entry.categorie || 'Catégorie non renseignée'}</strong>
              <time>{formatDate(entry.date_heure)}</time>
            </div>
            <p style={styles.historyDescription}>{entry.activite_description || 'Reclassement enregistré.'}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function getStyles(darkMode) {
  const surface = darkMode ? '#18122B' : '#f8fafc';
  const border = darkMode ? '#2d234a' : '#e2e8f0';
  const text = darkMode ? '#e2e8f0' : '#334155';
  return {
    section: { marginTop: 20, paddingTop: 18, borderTop: `1px solid ${border}` },
    heading: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
    headingIcon: { width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, color: COLORS.violet, background: darkMode ? 'rgba(124,92,250,.16)' : 'rgba(124,92,250,.10)' },
    title: { margin: 0, fontSize: 14, fontWeight: 800, color: darkMode ? '#fff' : '#0f172a' },
    description: { margin: '4px 0 0', fontSize: 12, lineHeight: 1.5, color: '#94a3b8' },
    actions: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    primaryButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 13px', border: 0, borderRadius: 10, background: accentGradient, color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', opacity: 1 },
    confirmButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 13px', border: `1px solid ${COLORS.green}`, borderRadius: 10, background: darkMode ? 'rgba(34,197,94,.12)' : 'rgba(34,197,94,.08)', color: darkMode ? '#bbf7d0' : '#166534', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' },
    error: { display: 'flex', gap: 8, alignItems: 'flex-start', padding: 11, margin: '10px 0', borderRadius: 10, background: darkMode ? 'rgba(239,68,68,.12)' : '#fef2f2', color: darkMode ? '#fecaca' : '#b91c1c', fontSize: 12.5, lineHeight: 1.5 },
    notice: { display: 'flex', gap: 8, alignItems: 'flex-start', padding: 11, margin: '10px 0', borderRadius: 10, background: darkMode ? 'rgba(124,92,250,.12)' : '#f5f3ff', color: text, fontSize: 12.5, lineHeight: 1.5 },
    proposal: { marginTop: 14, padding: 13, borderRadius: 12, border: `1px solid ${border}`, background: surface },
    infoRow: { display: 'flex', flexDirection: 'column', gap: 4, padding: '7px 0', color: text, fontSize: 12.5 },
    label: { color: '#94a3b8', fontSize: 11.5, fontWeight: 600 },
    compareGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginTop: 8 },
    compareCard: { display: 'flex', flexDirection: 'column', gap: 5, padding: 10, borderRadius: 9, background: darkMode ? '#211935' : '#fff', border: `1px solid ${border}`, color: text, fontSize: 12.5 },
    muted: { margin: '8px 0 0', color: '#94a3b8', fontSize: 12, lineHeight: 1.5 },
    historyBlock: { marginTop: 16 },
    historyHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
    historyTitle: { margin: 0, color: darkMode ? '#e2e8f0' : '#334155', fontSize: 12.5, fontWeight: 800 },
    refreshButton: { display: 'inline-flex', alignItems: 'center', gap: 5, border: 0, background: 'transparent', color: COLORS.violet, cursor: 'pointer', fontSize: 11.5, fontWeight: 700 },
    historyItem: { padding: 10, borderRadius: 9, background: surface, border: `1px solid ${border}`, marginTop: 7 },
    historyTop: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, color: text, fontSize: 12 },
    historyDescription: { margin: '6px 0 0', color: text, fontSize: 11.5, lineHeight: 1.5 },
  };
}

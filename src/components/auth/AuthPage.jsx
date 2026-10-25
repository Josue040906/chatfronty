import { useState } from 'react';
import { LockKeyhole, Mail, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

const API_URL = (import.meta.env.VITE_ASSISTANT_RH_API_URL || 'http://localhost:8080').replace(/\/$/, '');

export default function AuthPage({ onLogin, darkMode, setDarkMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/utilisateurs/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (response.status === 401) {
        throw new Error('Identifiants incorrects, ou compte non encore activé.');
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || `La connexion a échoué (HTTP ${response.status}).`);
      }
      if (!data.accessToken) {
        throw new Error('Le serveur n’a pas retourné de jeton d’accès.');
      }

      onLogin(data);
    } catch (err) {
      setError(err.message || 'Impossible de joindre le serveur RH. Vérifiez qu’il est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const isDark = darkMode;
  const colors = {
    page: isDark ? '#100d18' : '#f5f7fb',
    panel: isDark ? '#191425' : '#ffffff',
    border: isDark ? '#302640' : '#e2e8f0',
    text: isDark ? '#f8fafc' : '#172033',
    muted: isDark ? '#a69bb8' : '#64748b',
    field: isDark ? '#100d18' : '#f8fafc',
  };

  return (
    <main style={{ minHeight: '100vh', width: '100%', display: 'grid', placeItems: 'center', padding: '24px', boxSizing: 'border-box', background: colors.page, color: colors.text, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <section style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
          <button type="button" onClick={() => setDarkMode(!darkMode)} style={{ border: `1px solid ${colors.border}`, background: colors.panel, color: colors.muted, borderRadius: '10px', padding: '8px 12px', cursor: 'pointer' }}>
            {isDark ? 'Mode clair' : 'Mode sombre'}
          </button>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div style={{ width: '58px', height: '58px', margin: '0 auto 15px', borderRadius: '18px', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, letterSpacing: '1px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', boxShadow: '0 12px 32px rgba(139,92,246,.28)' }}>MEF</div>
          <p style={{ margin: '0 0 7px', fontSize: '12px', fontWeight: 800, letterSpacing: '2px', color: '#a78bfa' }}>SYGPERS · DÉMONSTRATION</p>
          <h1 style={{ margin: 0, fontSize: '28px', letterSpacing: '-.8px', lineHeight: 1.2, color: colors.text }}>Bienvenue</h1>
          <p style={{ margin: '10px 0 0', color: colors.muted, fontSize: '14px', lineHeight: 1.6 }}>Connectez-vous avec votre compte du service du personnel.</p>
        </div>

        <form onSubmit={submit} style={{ padding: '28px', border: `1px solid ${colors.border}`, borderRadius: '22px', background: colors.panel, boxShadow: isDark ? '0 24px 70px rgba(0,0,0,.2)' : '0 24px 70px rgba(15,23,42,.08)' }}>
          <label htmlFor="login-email" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700 }}>Adresse e-mail</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 13px', border: `1px solid ${colors.border}`, borderRadius: '12px', background: colors.field, marginBottom: '18px' }}>
            <Mail size={17} color={colors.muted} />
            <input id="login-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nom@exemple.mg" style={{ width: '100%', minWidth: 0, padding: '13px 0', border: 0, outline: 0, background: 'transparent', color: colors.text, fontSize: '14px' }} />
          </div>

          <label htmlFor="login-password" style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 700 }}>Mot de passe</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 13px', border: `1px solid ${colors.border}`, borderRadius: '12px', background: colors.field }}>
            <LockKeyhole size={17} color={colors.muted} />
            <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Votre mot de passe" style={{ width: '100%', minWidth: 0, padding: '13px 0', border: 0, outline: 0, background: 'transparent', color: colors.text, fontSize: '14px' }} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} style={{ display: 'grid', placeItems: 'center', border: 0, background: 'transparent', color: colors.muted, cursor: 'pointer', padding: '4px' }}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {error && <p role="alert" style={{ margin: '14px 0 0', padding: '11px 12px', borderRadius: '10px', color: isDark ? '#fecaca' : '#b91c1c', background: isDark ? 'rgba(239,68,68,.12)' : '#fef2f2', fontSize: '12.5px', lineHeight: 1.5 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', marginTop: '22px', padding: '13px 16px', border: 0, borderRadius: '12px', background: 'linear-gradient(110deg, #8b5cf6, #d946ef)', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: loading ? 'wait' : 'pointer', opacity: loading ? .7 : 1 }}>
            {loading ? 'Connexion en cours…' : 'Se connecter'} {!loading && <ArrowRight size={17} />}
          </button>

          <div style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', marginTop: '20px', paddingTop: '17px', borderTop: `1px solid ${colors.border}` }}>
            <ShieldCheck size={17} color="#a78bfa" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ margin: 0, fontSize: '11.5px', color: colors.muted, lineHeight: 1.6 }}>L’accès est réservé aux comptes actifs. Les demandes de compte doivent être validées par le chef du service du personnel.</p>
          </div>
        </form>
        <p style={{ textAlign: 'center', color: colors.muted, fontSize: '11px', marginTop: '18px' }}>Ministère de l’Économie et des Finances</p>
      </section>
    </main>
  );
}

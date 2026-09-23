import { useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, Sparkles } from 'lucide-react';


export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await onLogin({ email, password });

      if (!result.success) {
        setError(result.error || 'Échec de la connexion.');
      }
    } catch {
      setError('Une erreur est survenue lors de la connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-brand-mark">
            <Sparkles size={22} strokeWidth={2} />
          </div>

          <p className="login-eyebrow">MINISTÈRE DES BUDGETS ET FINANCES</p>

          <h1>
            La gestion RH,
            <br />
            pensée autrement.
          </h1>

          <p className="login-brand-description">
            Une plateforme centralisée pour consulter les agents,
            suivre les carrières et exploiter les données RH avec
            l'assistance de bandI'Akam.
          </p>
        </div>

        <p className="login-brand-footer">
          Assistant RH intelligent
        </p>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrapper">
          <div className="login-mobile-brand">
            <div className="login-brand-mark">
              <Sparkles size={20} strokeWidth={2} />
            </div>
            <span>bandI'Akam</span>
          </div>

          <div className="login-heading">
            <p className="login-section-label">ESPACE PROFESSIONNEL</p>
            <h2>Bienvenue</h2>
            <p>
              Connectez-vous pour accéder à votre espace de gestion RH.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <div className="login-field">
              <label htmlFor="email">Adresse e-mail</label>

              <div className="login-input-wrapper">
                <Mail size={17} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nom@exemple.mg"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Mot de passe</label>

              <div className="login-input-wrapper">
                <LockKeyhole size={17} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={isSubmitting}
            >
              <span>
                {isSubmitting ? 'Connexion...' : 'Se connecter'}
              </span>

              {!isSubmitting && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="login-note">
            Accès réservé aux utilisateurs autorisés.
          </p>
        </div>
      </section>
    </main>
  );
}
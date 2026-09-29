import { useState } from 'react';
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { inscrireUtilisateur } from '../../api/utilisateurs';

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [matricule, setMatricule] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');
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

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);

    try {
      await inscrireUtilisateur(
        matricule.trim(),
        email.trim(),
        password
      );

      setSuccess(
        'Compte créé avec succès. Vous pouvez maintenant vous connecter.'
      );

      setEmail('');
      setPassword('');
      setMatricule('');
      setConfirmPassword('');

      setTimeout(() => {
        setMode('login');
        setSuccess('');
      }, 1800);
    } catch (error) {
      setError(
        error.message ||
          'Impossible de créer le compte.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-brand-mark">
            <Sparkles size={22} strokeWidth={2} />
          </div>

          <p className="login-eyebrow">
            MINISTÈRE DES BUDGETS ET FINANCES
          </p>

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
            <p className="login-section-label">
              ESPACE PROFESSIONNEL
            </p>

            <h2>
              {isLogin ? 'Bienvenue' : 'Créer un compte'}
            </h2>

            <p>
              {isLogin
                ? 'Connectez-vous pour accéder à votre espace de gestion RH.'
                : 'Créez votre compte à partir de votre matricule professionnel.'}
            </p>
          </div>

          <div className="login-mode-switch">
            <button
              type="button"
              className={isLogin ? 'active' : ''}
              onClick={() => switchMode('login')}
            >
              Se connecter
            </button>

            <button
              type="button"
              className={!isLogin ? 'active' : ''}
              onClick={() => switchMode('register')}
            >
              Créer un compte
            </button>
          </div>

          {isLogin ? (
            <form
              onSubmit={handleLoginSubmit}
              className="login-form"
            >
              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              <div className="login-field">
                <label htmlFor="login-email">
                  Adresse e-mail
                </label>

                <div className="login-input-wrapper">
                  <Mail size={17} />

                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="nom@exemple.mg"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="login-password">
                  Mot de passe
                </label>

                <div className="login-input-wrapper">
                  <LockKeyhole size={17} />

                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
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
                  {isSubmitting
                    ? 'Connexion...'
                    : 'Se connecter'}
                </span>

                {!isSubmitting && (
                  <ArrowRight size={17} />
                )}
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleRegisterSubmit}
              className="login-form"
            >
              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              {success && (
                <div className="login-success" role="status">
                  {success}
                </div>
              )}

              <div className="login-field">
                <label htmlFor="register-matricule">
                  Matricule
                </label>

                <div className="login-input-wrapper">
                  <UserRound size={17} />

                  <input
                    id="register-matricule"
                    type="text"
                    value={matricule}
                    onChange={(event) =>
                      setMatricule(event.target.value)
                    }
                    placeholder="Ex. MEF003"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="register-email">
                  Adresse e-mail
                </label>

                <div className="login-input-wrapper">
                  <Mail size={17} />

                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="nom@exemple.mg"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="register-password">
                  Mot de passe
                </label>

                <div className="login-input-wrapper">
                  <LockKeyhole size={17} />

                  <input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Votre mot de passe"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="register-confirm-password">
                  Confirmer le mot de passe
                </label>

                <div className="login-input-wrapper">
                  <LockKeyhole size={17} />

                  <input
                    id="register-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Répétez votre mot de passe"
                    autoComplete="new-password"
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
                  {isSubmitting
                    ? 'Création...'
                    : 'Créer mon compte'}
                </span>

                {!isSubmitting && (
                  <ArrowRight size={17} />
                )}
              </button>
            </form>
          )}

          <p className="login-note">
            {isLogin
              ? 'Accès réservé aux utilisateurs autorisés.'
              : 'Le matricule permet d’identifier automatiquement votre fiche agent.'}
          </p>
        </div>
      </section>
    </main>
  );
}

import { useEffect, useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { getProfil, updateProfil } from '../../api/profil';
import { getEmployeePhotoUrl } from '../../utils/employee';

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const datePart = String(value).slice(0, 10);
  const [year, month, day] = datePart.split('-');

  if (!year || !month || !day) {
    return '—';
  }

  return `${day}/${month}/${year}`;
}

function formatName(profil) {
  return `${profil?.prenom || ''} ${profil?.nom || ''}`.trim();
}

function InfoItem({
  label,
  value,
  locked = false,
  icon: Icon,
}) {
  return (
    <div className="profil-info-item">
      <div className="profil-info-label">
        {Icon && <Icon size={15} />}
        <span>{label}</span>

        {locked && (
          <Lock
            size={13}
            className="profil-locked-icon"
            aria-label="Information en lecture seule"
          />
        )}
      </div>

      <div className="profil-info-value">
        {value || '—'}
      </div>
    </div>
  );
}

export default function ProfilPage({ user }) {
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

    const [editing, setEditing] = useState(false);
    const [adresse, setAdresse] = useState('');
    const [telephone, setTelephone] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProfil() {
      setLoading(true);
      setError('');

      try {
        const result = await getProfil(user?.userId);

        if (!cancelled) {
        setProfil(result);
        setAdresse(result.adresse || '');
        setTelephone(result.telephone || '');
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            err?.message ||
            'Impossible de charger votre profil.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (user?.userId) {
      loadProfil();
    } else {
      setLoading(false);
      setError('Utilisateur non identifié.');
    }

    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

    async function handleSaveProfil() {
    setSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
        await updateProfil(user?.userId, {
        adresse,
        telephone,
        });

        setProfil((current) => ({
        ...current,
        adresse,
        telephone,
        }));

        setEditing(false);
        setSaveMessage('Vos coordonnées ont été mises à jour.');
    } catch (err) {
        console.error(err);

        setSaveError(
        err?.message ||
        'Impossible de modifier vos coordonnées.'
        );
    } finally {
        setSaving(false);
    }
    }

    function handleCancelEdit() {
    setAdresse(profil?.adresse || '');
    setTelephone(profil?.telephone || '');

    setEditing(false);
    setSaveMessage('');
    setSaveError('');
    }
  if (loading) {
    return (
      <div className="profil-page">
        <div className="profil-loading">
          Chargement de votre profil...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profil-page">
        <section className="profil-error">
          <ShieldCheck size={24} />

          <div>
            <h1>Mon profil</h1>
            <p>{error}</p>
          </div>
        </section>
      </div>
    );
  }

  if (!profil) {
    return null;
  }

  const photoUrl = getEmployeePhotoUrl(profil.photo);
  const nomComplet = formatName(profil);

  return (
    <div className="profil-page">

      <section className="profil-heading">
        <div>
          <p className="page-eyebrow">
            MON COMPTE
          </p>

          <h1>Mon profil</h1>

          <p>
            Consultez vos informations personnelles et
            professionnelles.
          </p>
        </div>
      </section>

      <section className="profil-identity-card">

        <div className="profil-avatar">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`Photo de ${nomComplet}`}
            />
          ) : (
            <UserRound size={38} />
          )}
        </div>

        <div className="profil-identity-content">
          <h2>{nomComplet || 'Agent'}</h2>

          <p className="profil-poste">
            {profil.poste || 'Poste non renseigné'}
          </p>

          <div className="profil-identity-meta">
            <span>
              {profil.matricule || 'Matricule non renseigné'}
            </span>

            <span>
              {profil.code_service || 'Service non renseigné'}
            </span>
          </div>
        </div>

        <div className="profil-account-status">
          <ShieldCheck size={17} />
          <span>Compte actif</span>
        </div>

      </section>

      <section className="profil-section">

        <div className="profil-section-heading">
        <div>
            <p className="profil-section-eyebrow">
            INFORMATIONS PERSONNELLES
            </p>

            <h2>Identité et coordonnées</h2>
        </div>

        <div className="profil-section-actions">
            {!editing ? (
            <button
                type="button"
                className="profil-edit-button"
                onClick={() => {
                setEditing(true);
                setSaveMessage('');
                setSaveError('');
                }}
            >
                Modifier mes coordonnées
            </button>
            ) : (
            <>
                <button
                type="button"
                className="profil-cancel-button"
                onClick={handleCancelEdit}
                disabled={saving}
                >
                Annuler
                </button>

                <button
                type="button"
                className="profil-save-button"
                onClick={handleSaveProfil}
                disabled={saving}
                >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </>
            )}
        </div>
        </div>

        <div className="profil-grid">
            {saveMessage && (
            <div className="profil-save-message">
                {saveMessage}
            </div>
            )}

            {saveError && (
            <div className="profil-save-error">
                {saveError}
            </div>
            )}
          <InfoItem
            label="Nom"
            value={profil.nom}
            locked
            icon={UserRound}
          />

          <InfoItem
            label="Prénom"
            value={profil.prenom}
            locked
            icon={UserRound}
          />

          <InfoItem
            label="Sexe"
            value={profil.sexe}
            locked
          />

          <InfoItem
            label="CIN"
            value={profil.cin}
            locked
          />

          <InfoItem
            label="Date de naissance"
            value={formatDate(profil.date_naissance)}
            locked
            icon={CalendarDays}
          />

          <InfoItem
            label="Lieu de naissance"
            value={profil.lieu_naissance}
            locked
            icon={MapPin}
          />

        <div className="profil-editable-item">
        <div className="profil-info-label">
            <MapPin size={15} />
            <span>Adresse</span>
        </div>

        {editing ? (
            <input
            type="text"
            value={adresse}
            onChange={(event) => setAdresse(event.target.value)}
            className="profil-edit-input"
            maxLength={255}
            />
        ) : (
            <div className="profil-info-value">
            {profil.adresse || '—'}
            </div>
        )}
        </div>

        <div className="profil-editable-item">
        <div className="profil-info-label">
            <Phone size={15} />
            <span>Téléphone</span>
        </div>

        {editing ? (
            <input
            type="tel"
            value={telephone}
            onChange={(event) => setTelephone(event.target.value)}
            className="profil-edit-input"
            maxLength={50}
            />
        ) : (
            <div className="profil-info-value">
            {profil.telephone || '—'}
            </div>
        )}
        </div>

        </div>

      </section>

      <section className="profil-section">

        <div className="profil-section-heading">
          <div>
            <p className="profil-section-eyebrow">
              SITUATION PROFESSIONNELLE
            </p>

            <h2>Informations administratives</h2>
          </div>

          <span className="profil-readonly-badge">
            <Lock size={13} />
            Lecture seule
          </span>
        </div>

        <div className="profil-grid">

          <InfoItem
            label="Matricule"
            value={profil.matricule}
            locked
            icon={ShieldCheck}
          />

          <InfoItem
            label="Poste"
            value={profil.poste}
            locked
            icon={BriefcaseBusiness}
          />

          <InfoItem
            label="Service"
            value={profil.service}
            locked
            icon={Building2}
          />

          <InfoItem
            label="Direction"
            value={profil.direction}
            locked
            icon={Building2}
          />

          <InfoItem
            label="Type d'emploi"
            value={profil.type_emploi}
            locked
          />

          <InfoItem
            label="Catégorie"
            value={profil.categorie}
            locked
          />

          <InfoItem
            label="Diplôme"
            value={profil.diplome}
            locked
          />

          <InfoItem
            label="Grade"
            value={profil.grade}
            locked
          />

          <InfoItem
            label="Date d'embauche"
            value={formatDate(profil.date_embauche)}
            locked
            icon={CalendarDays}
          />

          <InfoItem
            label="Lieu de travail"
            value={profil.lieu_travail}
            locked
            icon={MapPin}
          />

        </div>

      </section>

      <section className="profil-section">

        <div className="profil-section-heading">
          <div>
            <p className="profil-section-eyebrow">
              COMPTE
            </p>

            <h2>Informations de connexion</h2>
          </div>
        </div>

        <div className="profil-grid">

          <InfoItem
            label="Adresse e-mail"
            value={profil.email}
            icon={Mail}
          />

        </div>

        <div className="profil-security-note">
          <ShieldCheck size={18} />

          <div>
            <strong>Sécurité du compte</strong>

            <p>
              La modification du mot de passe et des
              informations de connexion sera disponible
              dans les paramètres de sécurité du compte.
            </p>
          </div>
        </div>

      </section>

    </div>
  );
}
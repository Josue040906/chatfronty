import { useEffect, useState } from 'react';
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Upload,
  UserRound,
} from 'lucide-react';

import {
  getProfil,
  updateProfil,
  uploadProfilPhoto,
} from '../../api/profil';
import { getEmployeePhotoUrl } from '../../utils/employee';
import { changerMotDePasse } from '../../api/utilisateurs';

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

function formatSex(value) {
  if (value === 'F') return 'Féminin';
  if (value === 'M') return 'Masculin';
  return value;
}

function toDateInput(value) {
  return value ? String(value).slice(0, 10) : '';
}

function toPersonalForm(profil = {}) {
  return {
    nom: profil.nom || '',
    prenom: profil.prenom || '',
    sexe: profil.sexe || '',
    cin: profil.cin || '',
    dateNaissance: toDateInput(profil.date_naissance),
    lieuNaissance: profil.lieu_naissance || '',
    adresse: profil.adresse || '',
    telephone: profil.telephone || '',
  };
}

function InfoItem({
  label,
  value,
  locked = false,
  icon: Icon,
  editing = false,
  name,
  editValue = '',
  type = 'text',
  maxLength,
  onChange,
  disabled = false,
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
        {editing ? (
          type === 'select' ? (
            <select
              className="profil-edit-input"
              name={name}
              value={editValue}
              onChange={onChange}
              disabled={disabled}
            >
              <option value="">Sélectionner</option>
              <option value="F">Féminin</option>
              <option value="M">Masculin</option>
            </select>
          ) : (
            <input
              className="profil-edit-input"
              name={name}
              type={type}
              value={editValue}
              maxLength={maxLength}
              onChange={onChange}
              disabled={disabled}
            />
          )
        ) : (
          value || '—'
        )}
      </div>
    </div>
  );
}

export default function ProfilPage({ user, onUserUpdated }) {
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(Boolean(user?.userId));
  const [error, setError] = useState(
    user?.userId ? '' : 'Utilisateur non identifié.'
  );

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(toPersonalForm);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoSaving, setPhotoSaving] = useState(false);

  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProfil() {
      setLoading(true);
      setError('');

      try {
        const result = await getProfil(user?.userId);

        if (!cancelled) {
          setProfil(result);
          setForm(toPersonalForm(result));
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
    }

    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function handlePersonalChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      setSaveError('Format non autorisé. Utilisez JPG, PNG ou WEBP.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveError('La photo ne doit pas dépasser 5 Mo.');
      event.target.value = '';
      return;
    }

    setSaveError('');
    setSaveMessage('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    event.target.value = '';
  }

  async function handleSaveProfil() {
    setSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      await updateProfil(user?.userId, form);
      const refreshedProfil = await getProfil(user?.userId);

      setProfil(refreshedProfil);
      setForm(toPersonalForm(refreshedProfil));
      setEditing(false);
      setSaveMessage('Vos informations personnelles ont été mises à jour.');
    } catch (err) {
      console.error(err);

      setSaveError(
        err?.message ||
        'Impossible de modifier vos informations personnelles.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePhoto() {
    if (!photoFile) {
      return;
    }

    setPhotoSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      const result = await uploadProfilPhoto(user?.userId, photoFile);

      setProfil((current) => ({
        ...current,
        photo: result?.photo || current.photo,
      }));
      if (result?.photo) {
        onUserUpdated?.({ photo: result.photo });
      }
      setPhotoFile(null);
      setPhotoPreview('');
      setSaveMessage('Votre photo de profil a été mise à jour.');
    } catch (err) {
      console.error(err);

      setSaveError(
        err?.message ||
        'Impossible de modifier votre photo de profil.'
      );
    } finally {
      setPhotoSaving(false);
    }
  }

    async function handleChangePassword() {
  setPasswordSaving(true);
  setPasswordMessage('');
  setPasswordError('');

  if (!ancienMotDePasse || !nouveauMotDePasse || !confirmationMotDePasse) {
    setPasswordError(
      'Tous les champs du mot de passe sont obligatoires.'
    );
    setPasswordSaving(false);
    return;
  }

  if (nouveauMotDePasse !== confirmationMotDePasse) {
    setPasswordError(
      'La confirmation du nouveau mot de passe ne correspond pas.'
    );
    setPasswordSaving(false);
    return;
  }

  try {
    const result = await changerMotDePasse(
      user?.userId,
      ancienMotDePasse,
      nouveauMotDePasse
    );

    setPasswordMessage(
      result?.message ||
      'Mot de passe modifié avec succès.'
    );

    setAncienMotDePasse('');
    setNouveauMotDePasse('');
    setConfirmationMotDePasse('');
  } catch (err) {
    console.error(err);

    setPasswordError(
      err?.message ||
      'Impossible de modifier votre mot de passe.'
    );
  } finally {
    setPasswordSaving(false);
  }
}
  function handleCancelEdit() {
    setForm(toPersonalForm(profil));
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
  const displayedPhoto = photoPreview || photoUrl;
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

        <div className="profil-avatar-wrapper">
          <div className="profil-avatar">
            {displayedPhoto ? (
              <img
                src={displayedPhoto}
                alt={`Photo de ${nomComplet}`}
              />
            ) : (
              <UserRound size={38} />
            )}
          </div>

          <label
            htmlFor="profil-photo-input"
            className="profil-photo-button"
            aria-label="Choisir une photo de profil"
            title="Choisir une photo de profil"
          >
            <Camera size={15} />
          </label>

          <input
            id="profil-photo-input"
            className="profil-photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            disabled={photoSaving || saving}
          />
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
          <span>Compte lié</span>
        </div>

      </section>

      {photoFile && (
        <div className="profil-photo-pending">
          <span>{photoFile.name}</span>
          <div>
            <button
              type="button"
              className="profil-cancel-button"
              onClick={() => {
                setPhotoFile(null);
                setPhotoPreview('');
                setSaveError('');
              }}
              disabled={photoSaving}
            >
              Annuler
            </button>
            <button
              type="button"
              className="profil-save-button"
              onClick={handleSavePhoto}
              disabled={photoSaving}
            >
              <Upload size={14} />
              {photoSaving ? 'Envoi...' : 'Enregistrer la photo'}
            </button>
          </div>
        </div>
      )}

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
                Modifier mes informations
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
            icon={UserRound}
            editing={editing}
            name="nom"
            editValue={form.nom}
            maxLength={100}
            onChange={handlePersonalChange}
            disabled={saving}
          />

          <InfoItem
            label="Prénom"
            value={profil.prenom}
            icon={UserRound}
            editing={editing}
            name="prenom"
            editValue={form.prenom}
            maxLength={100}
            onChange={handlePersonalChange}
            disabled={saving}
          />

          <InfoItem
            label="Sexe"
            value={formatSex(profil.sexe)}
            editing={editing}
            name="sexe"
            editValue={form.sexe}
            type="select"
            onChange={handlePersonalChange}
            disabled={saving}
          />

          <InfoItem
            label="CIN"
            value={profil.cin}
            editing={editing}
            name="cin"
            editValue={form.cin}
            maxLength={30}
            onChange={handlePersonalChange}
            disabled={saving}
          />

          <InfoItem
            label="Date de naissance"
            value={formatDate(profil.date_naissance)}
            icon={CalendarDays}
            editing={editing}
            name="dateNaissance"
            editValue={form.dateNaissance}
            type="date"
            onChange={handlePersonalChange}
            disabled={saving}
          />

          <InfoItem
            label="Lieu de naissance"
            value={profil.lieu_naissance}
            icon={MapPin}
            editing={editing}
            name="lieuNaissance"
            editValue={form.lieuNaissance}
            maxLength={150}
            onChange={handlePersonalChange}
            disabled={saving}
          />

          <InfoItem
            label="Adresse"
            value={profil.adresse}
            icon={MapPin}
            editing={editing}
            name="adresse"
            editValue={form.adresse}
            maxLength={255}
            onChange={handlePersonalChange}
            disabled={saving}
          />

          <InfoItem
            label="Téléphone"
            value={profil.telephone}
            icon={Phone}
            editing={editing}
            name="telephone"
            editValue={form.telephone}
            type="tel"
            maxLength={30}
            onChange={handlePersonalChange}
            disabled={saving}
          />

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
            label="Grade"
            value={profil.grade}
            locked
          />

          <InfoItem
            label="Corps"
            value={profil.corps}
            locked
          />

          <InfoItem
            label="Classe"
            value={profil.classe}
            locked
          />

          <InfoItem
            label="Échelon"
            value={profil.echelon}
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

<div className="profil-password-section">

  <div className="profil-password-heading">
    <div>
      <strong>Modifier mon mot de passe</strong>

      <p>
        Utilisez votre mot de passe actuel pour définir
        un nouveau mot de passe.
      </p>
    </div>
  </div>

  <div className="profil-password-form">

    <div className="profil-password-field">
      <label htmlFor="ancien-mot-de-passe">
        Mot de passe actuel
      </label>

      <input
        id="ancien-mot-de-passe"
        type="password"
        value={ancienMotDePasse}
        onChange={(event) => setAncienMotDePasse(event.target.value)}
        autoComplete="current-password"
        disabled={passwordSaving}
      />
    </div>

    <div className="profil-password-field">
      <label htmlFor="nouveau-mot-de-passe">
        Nouveau mot de passe
      </label>

      <input
        id="nouveau-mot-de-passe"
        type="password"
        value={nouveauMotDePasse}
        onChange={(event) => setNouveauMotDePasse(event.target.value)}
        autoComplete="new-password"
        disabled={passwordSaving}
      />
    </div>

    <div className="profil-password-field">
      <label htmlFor="confirmation-mot-de-passe">
        Confirmer le nouveau mot de passe
      </label>

      <input
        id="confirmation-mot-de-passe"
        type="password"
        value={confirmationMotDePasse}
        onChange={(event) => setConfirmationMotDePasse(event.target.value)}
        autoComplete="new-password"
        disabled={passwordSaving}
      />
    </div>

  </div>

  {passwordMessage && (
    <div className="profil-save-message">
      {passwordMessage}
    </div>
  )}

  {passwordError && (
    <div className="profil-save-error">
      {passwordError}
    </div>
  )}

  <div className="profil-password-actions">
    <button
      type="button"
      className="profil-save-button"
      onClick={handleChangePassword}
      disabled={passwordSaving}
    >
      {passwordSaving
        ? 'Modification...'
        : 'Modifier le mot de passe'}
    </button>
  </div>

</div>

      </section>

    </div>
  );
}
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Building2,
  IdCard,
  UserRound,
  AlertCircle,
  Pencil,
  Save,
  X,
  Camera,
  Upload,
} from 'lucide-react';

import {
  getAgentById,
  updateAgent,
  uploadAgentPhoto,
} from '../../api/agents';
import {
  getEmployeePhotoUrl,
  getEmployeeInitials,
} from '../../utils/employee';
function formatName(agent) {
  return `${agent.prenom || ''} ${agent.nom || ''}`.trim();
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR').format(date);
}

export default function AgentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    sexe: '',
    adresse: '',
    cin: '',
    telephone: '',
    dateNaissance: '',
    lieuNaissance: '',
    dateEmbauche: '',
    lieuTravail: '',
    photo: '',
  });

  useEffect(() => {
    let cancelled = false;

    async function loadAgent() {
      setLoading(true);
      setError('');

      try {
        const result = await getAgentById(id);

        if (!cancelled) {
          setAgent(result);
          setForm(initializeForm(result));
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            "Impossible de charger le profil de l'agent."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAgent();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function initializeForm(data) {
    return {
      nom: data.nom || '',
      prenom: data.prenom || '',
      sexe: data.sexe || '',
      adresse: data.adresse || '',
      cin: data.cin || '',
      telephone: data.telephone || '',
      dateNaissance: data.date_naissance
        ? data.date_naissance.substring(0, 10)
        : '',
      lieuNaissance: data.lieu_naissance || '',
      dateEmbauche: data.date_embauche
        ? data.date_embauche.substring(0, 10)
        : '',
      lieuTravail: data.lieu_travail || '',
      photo: data.photo || '',
    };
  }

  function handleChange(event) {
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

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      setSaveError(
        'Format non autorisé. Utilisez JPG, PNG ou WEBP.'
      );

      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveError(
        'La photo ne doit pas dépasser 5 Mo.'
      );

      event.target.value = '';
      return;
    }

    setSaveError('');
    setPhotoFile(file);

    const previewUrl = URL.createObjectURL(file);

    setPhotoPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return previewUrl;
    });
  }

  function openEditModal() {
    setForm(initializeForm(agent));
    setPhotoFile(null);
    setPhotoPreview('');
    setSaveError('');
    setSaveSuccess('');
    setEditing(true);
  }

  function closeEditModal() {
    if (saving) return;

    setForm(initializeForm(agent));
    setPhotoFile(null);

    setPhotoPreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }

      return '';
    });

    setSaveError('');
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      /*
       * 1. On sauvegarde d'abord les informations textuelles.
       * La photo actuelle reste inchangée dans cette requête.
       */
      await updateAgent(id, {
        ...form,
        photo: agent.photo || '',
      });

      /*
       * 2. Si une nouvelle photo a été sélectionnée,
       * on l'envoie séparément au backend.
       */
      if (photoFile) {
        await uploadAgentPhoto(id, photoFile);
      }

      /*
       * 3. On recharge les données depuis PostgreSQL
       * pour avoir la photo et les informations réellement
       * enregistrées.
       */
      const refreshedAgent = await getAgentById(id);

      setAgent(refreshedAgent);
      setForm(initializeForm(refreshedAgent));

      setPhotoFile(null);

      setPhotoPreview((currentPreview) => {
        if (currentPreview) {
          URL.revokeObjectURL(currentPreview);
        }

        return '';
      });

      setEditing(false);

      setSaveSuccess(
        "Les informations de l'agent ont été enregistrées."
      );
    } catch (err) {
      console.error(err);

      setSaveError(
        err?.message ||
        "Impossible d'enregistrer les modifications."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="agent-profile-page">
        <div className="agent-profile-loading">
          Chargement du profil...
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="agent-profile-page">
        <button
          type="button"
          className="agent-profile-back"
          onClick={() => navigate('/agents')}
        >
          <ArrowLeft size={17} />
          Retour aux agents
        </button>

        <div className="agent-profile-error">
          <AlertCircle size={24} />

          <div>
            <h1>Profil introuvable</h1>

            <p>
              {error ||
                "Cet agent n'existe pas ou n'est plus disponible."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const displayedPhoto =
    photoPreview || getEmployeePhotoUrl(agent.photo);

  return (
    <div className="agent-profile-page">
      <button
        type="button"
        className="agent-profile-back"
        onClick={() => navigate('/agents')}
      >
        <ArrowLeft size={17} />
        Retour aux agents
      </button>

      {/* =====================================================
          EN-TÊTE DU PROFIL
          ===================================================== */}

      <section className="agent-profile-hero">
        <div className="agent-profile-identity">
        <div className="agent-profile-avatar">
          {getEmployeePhotoUrl(agent.photo) ? (
            <img
              src={getEmployeePhotoUrl(agent.photo)}
              alt={`Photo de ${formatName(agent)}`}
            />
          ) : (
            getEmployeeInitials(agent)
          )}
        </div>

          <div>
            <p className="page-eyebrow">
              PROFIL AGENT
            </p>

            <h1>{formatName(agent)}</h1>

            <div className="agent-profile-meta">
              <span>
                <BriefcaseBusiness size={15} />
                {agent.poste || 'Poste non renseigné'}
              </span>

              <span>
                <IdCard size={15} />
                {agent.matricule || 'Matricule non renseigné'}
              </span>
            </div>
          </div>
        </div>

        <div className="agent-profile-actions">
          <button
            type="button"
            className="agent-profile-edit-button"
            onClick={openEditModal}
          >
            <Pencil size={17} />
            Modifier
          </button>
        </div>
      </section>

      {/* =====================================================
          MESSAGE DE SUCCÈS
          ===================================================== */}

      {saveSuccess && (
        <div className="agent-profile-message agent-profile-message-success">
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* =====================================================
          INFORMATIONS PERSONNELLES
          ===================================================== */}

      <div className="agent-profile-grid">
        <section className="agent-profile-card">
          <div className="agent-profile-card-header">
            <div className="agent-profile-card-icon">
              <UserRound size={18} />
            </div>

            <div>
              <h2>Informations personnelles</h2>

              <p>
                Informations d'identification de l'agent.
              </p>
            </div>
          </div>

          <div className="agent-profile-details">
            <div className="agent-detail">
              <span>Nom</span>
              <strong>{agent.nom || '—'}</strong>
            </div>

            <div className="agent-detail">
              <span>Prénom</span>
              <strong>{agent.prenom || '—'}</strong>
            </div>

            <div className="agent-detail">
              <span>Sexe</span>
              <strong>{agent.sexe || '—'}</strong>
            </div>

            <div className="agent-detail">
              <span>Adresse</span>
              <strong>{agent.adresse || '—'}</strong>
            </div>

            <div className="agent-detail">
              <span>CIN</span>
              <strong>{agent.cin || '—'}</strong>
            </div>

            <div className="agent-detail">
              <span>Téléphone</span>
              <strong>{agent.telephone || '—'}</strong>
            </div>

            <div className="agent-detail">
              <span>Date de naissance</span>
              <strong>
                {formatDate(agent.date_naissance)}
              </strong>
            </div>

            <div className="agent-detail">
              <span>Lieu de naissance</span>
              <strong>
                {agent.lieu_naissance || '—'}
              </strong>
            </div>

            <div className="agent-detail">
              <span>Date d'embauche</span>
              <strong>
                {formatDate(agent.date_embauche)}
              </strong>
            </div>

            <div className="agent-detail">
              <span>Lieu de travail</span>
              <strong>
                {agent.lieu_travail || '—'}
              </strong>
            </div>

            <div className="agent-detail">
              <span>Photo</span>

              <strong>
                {agent.photo
                  ? 'Photo enregistrée'
                  : 'Aucune photo'}
              </strong>
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================
          PARCOURS PROFESSIONNEL
          ===================================================== */}

      <section className="agent-profile-card agent-career-preview">
        <div className="agent-profile-card-header">
          <div className="agent-profile-card-icon">
            <CalendarDays size={18} />
          </div>

          <div>
            <h2>Parcours professionnel</h2>

            <p>
              Analyse de la situation et évolution de carrière.
            </p>
          </div>
        </div>

        <div className="agent-career-content">
          <div className="agent-career-placeholder">
            <Building2 size={20} />

            <div>
              <strong>Analyse de carrière</strong>

              <p>
                L'analyse détaillée de la carrière de cet agent
                sera accessible ici.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="agent-career-button"
            onClick={() =>
              navigate(`/carrieres/${agent.id}/analyse`)
            }
          >
            Analyser la carrière
          </button>
        </div>
      </section>

      {/* =====================================================
          MODALE DE MODIFICATION
          ===================================================== */}

      {editing && (
        <div
          className="agent-profile-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeEditModal();
            }
          }}
        >
          <div
            className="agent-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-profile-modal-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* -------------------------------------------------
                EN-TÊTE DE LA MODALE
                ------------------------------------------------- */}

            <div className="agent-profile-modal-header">
              <div className="agent-profile-modal-title">
                <div className="agent-profile-modal-icon">
                  <Pencil size={18} />
                </div>

                <div>
                  <h2 id="agent-profile-modal-title">
                    Modifier les informations
                  </h2>

                  <p>
                    Modifiez les informations personnelles de
                    l'agent.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="agent-profile-modal-close"
                onClick={closeEditModal}
                disabled={saving}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* -------------------------------------------------
                ERREUR DE SAUVEGARDE
                ------------------------------------------------- */}

            {saveError && (
              <div className="agent-profile-modal-error">
                <AlertCircle size={18} />

                <span>{saveError}</span>
              </div>
            )}

            {/* -------------------------------------------------
                FORMULAIRE
                ------------------------------------------------- */}

            <div className="agent-profile-form">
              <div className="agent-form-field">
                <label htmlFor="nom">
                  Nom
                </label>

                <input
                  id="nom"
                  name="nom"
                  type="text"
                  value={form.nom}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="agent-form-field">
                <label htmlFor="prenom">
                  Prénom
                </label>

                <input
                  id="prenom"
                  name="prenom"
                  type="text"
                  value={form.prenom}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="agent-form-field">
                <label htmlFor="sexe">
                  Sexe
                </label>

                <select
                  id="sexe"
                  name="sexe"
                  value={form.sexe}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">
                    Sélectionner
                  </option>

                  <option value="F">
                    Féminin
                  </option>

                  <option value="M">
                    Masculin
                  </option>
                </select>
              </div>

              <div className="agent-form-field">
                <label htmlFor="telephone">
                  Téléphone
                </label>

                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  value={form.telephone}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="agent-form-field">
                <label htmlFor="cin">
                  CIN
                </label>

                <input
                  id="cin"
                  name="cin"
                  type="text"
                  value={form.cin}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="agent-form-field">
                <label htmlFor="dateNaissance">
                  Date de naissance
                </label>

                <input
                  id="dateNaissance"
                  name="dateNaissance"
                  type="date"
                  value={form.dateNaissance}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="agent-form-field">
                <label htmlFor="lieuNaissance">
                  Lieu de naissance
                </label>

                <input
                  id="lieuNaissance"
                  name="lieuNaissance"
                  type="text"
                  value={form.lieuNaissance}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="agent-form-field">
                <label htmlFor="dateEmbauche">
                  Date d'embauche
                </label>

                <input
                  id="dateEmbauche"
                  name="dateEmbauche"
                  type="date"
                  value={form.dateEmbauche}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="agent-form-field agent-form-field-full">
                <label htmlFor="adresse">
                  Adresse
                </label>

                <input
                  id="adresse"
                  name="adresse"
                  type="text"
                  value={form.adresse}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="agent-form-field">
                <label htmlFor="lieuTravail">
                  Lieu de travail
                </label>

                <input
                  id="lieuTravail"
                  name="lieuTravail"
                  type="text"
                  value={form.lieuTravail}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              {/* -------------------------------------------------
                  PHOTO
                  ------------------------------------------------- */}

              <div className="agent-form-field agent-form-field-full">
                <label>
                  Photo de l'agent
                </label>

                <div className="agent-photo-upload">
                  <div className="agent-photo-preview">
                    {displayedPhoto ? (
                      <img
                        src={displayedPhoto}
                        alt={`Aperçu de ${formatName(agent)}`}
                      />
                    ) : (
                      <span>
                        {getEmployeeInitials(agent)}
                      </span>
                    )}
                  </div>

                  <div className="agent-photo-upload-content">
                    <div>
                      <strong>
                        {photoFile
                          ? photoFile.name
                          : agent.photo
                            ? 'Photo actuelle'
                            : 'Aucune photo sélectionnée'}
                      </strong>

                      <p>
                        JPG, PNG ou WEBP — 5 Mo maximum
                      </p>
                    </div>

                    <label
                      htmlFor="agent-photo-input"
                      className="agent-photo-upload-button"
                    >
                      <Upload size={16} />
                      Changer la photo
                    </label>

                    <input
                      id="agent-photo-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      disabled={saving}
                      hidden
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------
                PIED DE LA MODALE
                ------------------------------------------------- */}

            <div className="agent-profile-modal-footer">
              <button
                type="button"
                className="agent-profile-cancel-button"
                onClick={closeEditModal}
                disabled={saving}
              >
                <X size={17} />
                Annuler
              </button>

              <button
                type="button"
                className="agent-profile-save-button"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={17} />

                {saving
                  ? 'Enregistrement...'
                  : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

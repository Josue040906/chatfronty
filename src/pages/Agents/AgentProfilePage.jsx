import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Building2,
  Camera,
  IdCard,
  MapPin,
  Phone,
  Users,
  UserRound,
  AlertCircle,
  Pencil,
  Check,
  X,
  ImagePlus,
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
import AgentPresence from '../../components/agents/AgentPresence';
import PersonPhoto from '../../components/agents/PersonPhoto';
import AgentDialogCard from '../../components/agents/AgentDialogCard';
import LocaliteField from '../../components/forms/LocaliteField';
import PhoneField from '../../components/forms/PhoneField';
import VilleField from '../../components/forms/VilleField';
import { isPhoneNumberValid } from '../../utils/phone';
import { applyPrefill, prefillClass, readPrefill, readPrefillScan } from '../../utils/bandyPrefill';
import { deposerPieceScannee } from '../../api/piecesScannees';
import PieceScanneeLinks from '../../components/PieceScanneeLinks';
function formatName(agent) {
  return `${agent.prenom || ''} ${agent.nom || ''}`.trim();
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default function AgentProfilePage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  // Champs proposés par Bandy et différents de la valeur actuelle.
  const [prefilled, setPrefilled] = useState([]);
  // La pièce (CIN…) d'où viennent les champs proposés par Bandy : jointe à la fiche une fois enregistrée.
  const [scan, setScan] = useState(null);
  const [scanRefresh, setScanRefresh] = useState(0);
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
    localiteResidenceId: '',
    effacerLocaliteResidence: false,
    cin: '',
    telephone: '',
    dateNaissance: '',
    lieuNaissance: '',
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
          // Tâche préparée par Bandy : le formulaire s'ouvre prérempli,
          // rien n'est enregistré avant « Enregistrer ».
          const proposition = applyPrefill(
            initializeForm(result),
            readPrefill(location.state)
          );
          setForm(proposition.form);
          setPrefilled(proposition.changed);
          setScan(proposition.changed.length > 0 ? readPrefillScan(location.state) : null);
          if (proposition.changed.length > 0) {
            setEditing(true);
          }
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
    // location.key : une nouvelle proposition de Bandy recharge la fiche,
    // même si elle était déjà ouverte.
  }, [id, location.key, location.state]);

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
      localiteResidenceId: data.localite_residence_id || '',
      effacerLocaliteResidence: false,
      cin: data.cin || '',
      telephone: data.telephone || '',
      dateNaissance: data.date_naissance
        ? data.date_naissance.substring(0, 10)
        : '',
      lieuNaissance: data.lieu_naissance || '',
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
    setPrefilled([]);
    setScan(null);
    setPhotoFile(null);
    setPhotoPreview('');
    setSaveError('');
    setSaveSuccess('');
    setEditing(true);
  }

  function closeEditModal() {
    if (saving) return;

    setForm(initializeForm(agent));
    setPrefilled([]);
    setScan(null);
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
    if (!isPhoneNumberValid(form.telephone)) {
      setSaveError(
        'Le numéro de téléphone est invalide. Vérifiez le pays, l’indicatif et le nombre de chiffres.'
      );
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      /*
       * 1. On sauvegarde d'abord les informations textuelles.
       * La photo actuelle reste inchangée dans cette requête.
       */
      await updateAgent(id, {
         acteurId: user?.userId,
        ...form,
      });

      /*
       * 2. Si une nouvelle photo a été sélectionnée,
       * on l'envoie séparément au backend.
       */
      if (photoFile) {
         await uploadAgentPhoto(id, photoFile, user?.userId);
      }

      // La pièce lue par Bandy (CIN…) est jointe à la fiche, pour qui vérifiera.
      let scanNote = '';
      if (scan) {
        try {
          await deposerPieceScannee('AGENT', id, scan);
          scanNote = ' La pièce scannée est jointe à la fiche.';
          setScanRefresh((value) => value + 1);
        } catch (scanError) {
          scanNote = ` La pièce scannée n’a pas pu être jointe : ${scanError.message || 'erreur inconnue'}.`;
        }
        setScan(null);
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
        `Les informations de l'agent ont été enregistrées.${scanNote}`
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
      <div className="rf-page">
        <p className="rf-note" role="status">Chargement du profil...</p>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="rf-page">
        <button type="button" className="rf-back" onClick={() => navigate('/agents')}>
          <ArrowLeft size={18} />
          Retour aux agents
        </button>

        <div className="rf-card agents-empty" role="alert">
          <AlertCircle size={28} />
          <h1>Profil introuvable</h1>
          <p>{error || "Cet agent n'existe pas ou n'est plus disponible."}</p>
        </div>
      </div>
    );
  }

  const photoUrl = getEmployeePhotoUrl(agent.photo);
  const displayedPhoto = photoPreview || photoUrl;
  const infoItems = [
    [UserRound, 'Nom', agent.nom],
    [UserRound, 'Prénom', agent.prenom],
    [Users, 'Sexe', agent.sexe === 'M' ? 'Masculin' : agent.sexe === 'F' ? 'Féminin' : agent.sexe],
    [IdCard, 'CIN', agent.cin, 'mono'],
    [Phone, 'Téléphone', agent.telephone],
    [MapPin, 'Adresse', agent.adresse],
    [CalendarDays, 'Date de naissance', agent.date_naissance ? formatDate(agent.date_naissance) : ''],
    [MapPin, 'Lieu de naissance', agent.lieu_naissance],
    [CalendarDays, "Date d'embauche", agent.date_embauche ? formatDate(agent.date_embauche) : ''],
    [Building2, 'Lieu de travail', agent.lieu_travail],
    [Camera, 'Photo', agent.photo ? 'Photo enregistrée' : 'Aucune photo'],
  ];
  const openCareer = () => navigate(`/carrieres/${agent.id}/analyse`);
  // Ce que la carte de carrière annonce : la situation actuelle, en bref.
  const yearsOfService = agent.date_embauche
    ? Math.floor((Date.now() - new Date(agent.date_embauche).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;
  const careerFacts = [
    agent.categorie && `Catégorie ${agent.categorie}`,
    agent.corps_libelle || agent.corps,
    agent.type_emploi,
    Number.isFinite(yearsOfService) && yearsOfService >= 0
      && `${yearsOfService} an${yearsOfService > 1 ? 's' : ''} de service`,
  ].filter(Boolean);
  const formPercent = Math.round(
    ([form.nom, form.prenom, form.sexe, form.adresse, form.cin, form.telephone,
      form.dateNaissance, form.lieuNaissance, agent.date_embauche, agent.lieu_travail,
      displayedPhoto]
      .filter((value) => value && String(value).trim() !== '').length /
      11) * 100
  );

  return (
    <div className="rf-page agent-fiche">
      <button type="button" className="rf-back" onClick={() => navigate('/agents')}>
        <ArrowLeft size={18} />
        Retour aux agents
      </button>

      {saveSuccess && (
        <p className="rf-success" role="status">
          <Check size={16} /> {saveSuccess}
        </p>
      )}

      <div className="rf-profile">
        <aside className="rf-card rf-profile-card">
          <div className="rf-profile-band" aria-hidden="true" />
          <svg
            width="300"
            height="300"
            viewBox="0 0 300 300"
            style={{ position: 'absolute', right: -100, top: -130 }}
            className="rf-hero-art"
            aria-hidden="true"
          >
            <circle cx="150" cy="150" r="130" fill="none" stroke="#B8863F" strokeOpacity=".4" strokeWidth="2" />
            <circle cx="150" cy="150" r="90" fill="none" stroke="#B8863F" strokeOpacity=".3" strokeWidth="2" />
          </svg>

          <div className="rf-profile-id">
            <div className="rf-profile-photo">
              <PersonPhoto
                src={photoUrl}
                alt={`Photo de ${formatName(agent)}`}
                initials={getEmployeeInitials(agent)}
              />
            </div>
            <p className="rf-eyebrow" style={{ marginTop: 16 }}>Profil agent</p>
            <h1>{formatName(agent)}</h1>
            <AgentPresence agent={agent} />
            <p className="rf-lead" style={{ margin: 0 }}>
              {agent.poste || 'Poste non renseigné'}
            </p>
            <p className="rf-profile-matricule">
              Matricule {agent.matricule || 'non renseigné'}
            </p>
          </div>

          <div className="rf-profile-actions">
            <button type="button" className="rf-btn" onClick={openEditModal}>
              <Pencil size={18} />
              Modifier
            </button>
          </div>
        </aside>

        <div className="rf-profile-main">
          <section className="rf-card" aria-labelledby="agent-identity">
            <p className="rf-eyebrow">Identité</p>
            <h2 id="agent-identity" className="rf-section-title">Informations personnelles</h2>
            <dl className="rf-info-grid">
              {infoItems.map(([Icon, label, value, kind]) => (
                <div className="rf-info" key={label}>
                  <span className="rf-ico"><Icon size={18} /></span>
                  <div>
                    <dt>{label}</dt>
                    <dd className={kind === 'mono' ? 'rf-mono-plain' : undefined}>
                      {value || '—'}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
            <PieceScanneeLinks cibleType="AGENT" cibleId={agent.id} refreshKey={scanRefresh} />
          </section>

          <a
            href={`/carrieres/${agent.id}/analyse`}
            className="rf-card rf-card-hover rf-career"
            onClick={(event) => {
              event.preventDefault();
              openCareer();
            }}
          >
            <div className="rf-career-bars" aria-hidden="true">
              <span style={{ height: 14 }} />
              <span style={{ height: 26 }} />
              <span style={{ height: 38 }} />
              <span style={{ height: 50 }} />
              <span style={{ height: 62 }} />
            </div>
            <div className="rf-career-text">
              <p className="rf-career-kicker">Parcours professionnel</p>
              <h2>Analyse de carrière</h2>
              {careerFacts.length > 0 ? (
                <ul className="rf-career-facts">
                  {careerFacts.map((fact) => <li key={fact}>{fact}</li>)}
                </ul>
              ) : (
                <p>Situation, diplômes et évolution possible de l’agent.</p>
              )}
            </div>
            <span className="rf-btn rf-btn-primary">
              Voir l’analyse
              <ArrowRight size={18} />
            </span>
          </a>
        </div>
      </div>

      {editing && (
        <div
          className="rf-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeEditModal();
            }
          }}
        >
          <section
            className="rf-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-profile-modal-title"
          >
            <AgentDialogCard
              kicker="Fiche en cours de modification"
              name={[form.prenom, form.nom].filter(Boolean).join(' ')}
              subtitle={agent.poste}
              tags={[agent.matricule, agent.service]}
              initials={getEmployeeInitials({ nom: form.nom, prenom: form.prenom })}
              photoUrl={displayedPhoto}
              percent={formPercent}
            />

            <div className="rf-dialog-main">
              <header className="rf-dialog-head">
                <div>
                  <span className="rf-ico"><Pencil size={20} /></span>
                  <div>
                    <h2 id="agent-profile-modal-title">Modifier les informations</h2>
                    <p>Modifiez les informations personnelles de {formatName(agent)}.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="rf-icon-btn"
                  onClick={closeEditModal}
                  disabled={saving}
                  aria-label="Fermer le formulaire"
                >
                  <X size={16} />
                </button>
              </header>

              {saveError && (
                <p className="rf-error" role="alert">{saveError}</p>
              )}

              {prefilled.length > 0 && (
                <p className="bandy-prefill-notice" role="status">
                  Bandy a prérempli les champs surlignés en vert. Vérifiez-les,
                  puis enregistrez : rien n’est modifié avant.
                  {scan && ` La pièce « ${scan.name} » sera jointe à la fiche.`}
                </p>
              )}

              <div className="rf-dialog-grid">
                <div className={prefillClass('rf-field', 'nom', prefilled)}>
                  <label htmlFor="nom">Nom</label>
                  <input id="nom" name="nom" type="text" value={form.nom} onChange={handleChange} disabled={saving} />
                </div>

                <div className={prefillClass('rf-field', 'prenom', prefilled)}>
                  <label htmlFor="prenom">Prénom</label>
                  <input id="prenom" name="prenom" type="text" value={form.prenom} onChange={handleChange} disabled={saving} />
                </div>

                <div className={prefillClass('rf-field', 'sexe', prefilled)}>
                  <label htmlFor="sexe">Sexe</label>
                  <select id="sexe" name="sexe" value={form.sexe} onChange={handleChange} disabled={saving}>
                    <option value="">Sélectionner</option>
                    <option value="F">Féminin</option>
                    <option value="M">Masculin</option>
                  </select>
                </div>

                <div className={prefillClass('rf-field', 'telephone', prefilled)}>
                  <label htmlFor="telephone">Téléphone</label>
                  <PhoneField
                    value={form.telephone}
                    onChange={(telephone) =>
                      setForm((current) => ({ ...current, telephone }))
                    }
                    disabled={saving}
                  />
                </div>

                <div className={prefillClass('rf-field', 'cin', prefilled)}>
                  <label htmlFor="cin">CIN</label>
                  <input id="cin" name="cin" type="text" value={form.cin} onChange={handleChange} disabled={saving} />
                </div>

                <div className={prefillClass('rf-field', 'dateNaissance', prefilled)}>
                  <label htmlFor="dateNaissance">Date de naissance</label>
                  <input id="dateNaissance" name="dateNaissance" type="date" value={form.dateNaissance} onChange={handleChange} disabled={saving} />
                </div>

                <div className={prefillClass('rf-field rf-field-full', 'lieuNaissance', prefilled)}>
                  <label htmlFor="lieuNaissance">Lieu de naissance</label>
                  <VilleField
                    id="lieuNaissance"
                    name="lieuNaissance"
                    value={form.lieuNaissance}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className={prefillClass('rf-field rf-field-full', 'adresse', prefilled)}>
                  <span className="rf-label">Adresse</span>
                  <LocaliteField
                    selectedId={form.localiteResidenceId}
                    currentAddress={form.adresse}
                    onChange={(localiteResidenceId, adresse) =>
                      setForm((current) => ({
                        ...current,
                        localiteResidenceId: localiteResidenceId || '',
                        effacerLocaliteResidence: !localiteResidenceId,
                        adresse,
                      }))
                    }
                    disabled={saving}
                  />
                </div>

                <div className="rf-field rf-field-full">
                  <span className="rf-label">Photo de l’agent</span>
                  <label htmlFor="agent-photo-input" className="rf-upload">
                    <span className="rf-upload-icon">
                      {displayedPhoto ? (
                        <PersonPhoto
                          src={displayedPhoto}
                          alt={`Aperçu de ${formatName(agent)}`}
                          initials={<ImagePlus size={20} />}
                        />
                      ) : (
                        <ImagePlus size={20} />
                      )}
                    </span>
                    <span>
                      <strong>
                        {photoFile ? photoFile.name : 'Choisir une image'}
                      </strong>
                      <small>JPG, PNG ou WEBP · 5 Mo maximum</small>
                    </span>
                    <input
                      id="agent-photo-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      disabled={saving}
                    />
                  </label>
                </div>
              </div>

              <footer className="rf-dialog-foot" style={{ justifyContent: 'flex-end' }}>
                <div>
                  <button type="button" className="rf-btn" onClick={closeEditModal} disabled={saving}>
                    Annuler
                  </button>
                  <button type="button" className="rf-btn rf-btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </footer>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { classeTypeEmploi } from '../../utils/typeEmploi';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BriefcaseBusiness,
  CalendarDays,
  Building2,
  Cake,
  Hourglass,
  IdCard,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Users,
  UserRound,
  AlertCircle,
  Pencil,
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
import TypeEmploiBadge from '../../components/agents/TypeEmploiBadge';
import PersonPhoto from '../../components/agents/PersonPhoto';
import AgentDialogCard from '../../components/agents/AgentDialogCard';
import LocaliteField from '../../components/forms/LocaliteField';
import PhoneField from '../../components/forms/PhoneField';
import VilleField from '../../components/forms/VilleField';
import { isPhoneNumberValid } from '../../utils/phone';
import { applyPrefill, prefillClass, readPrefill, readPrefillScan } from '../../utils/bandyPrefill';
import { deposerPieceScannee } from '../../api/piecesScannees';
import PieceScanneeLinks from '../../components/PieceScanneeLinks';
import { useToast } from '../../components/ui/toastContext';
import { getRetraiteAnalyse } from '../../api/carrieres';
import { ageAgent, delaiJusqua, dureeService, formatCin, libelleDuree } from '../../utils/agentFaits';
import useValidationImmediate from '../../hooks/useValidationImmediate';
import { erreurEmail } from '../../utils/validationAgent';
import ProfilComplementaireSection from '../../components/agents/ProfilComplementaireSection';
import { getProfilComplementaire, saveProfilComplementaire } from '../../api/profilComplementaire';
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
  const toast = useToast();

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
    email: '',
    dateNaissance: '',
    lieuNaissance: '',
    photo: '',
  });
  const [retraite, setRetraite] = useState(null);
  const { erreur, verifier, champProps } = useValidationImmediate(form, {
    email: (valeurs) => erreurEmail(valeurs.email),
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
    let actif = true;
    getRetraiteAnalyse(id)
      .then((resultat) => { if (actif) setRetraite(resultat); })
      .catch(() => { if (actif) setRetraite(null); });
    return () => { actif = false; };
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
      localiteResidenceId: data.localite_residence_id || '',
      effacerLocaliteResidence: false,
      cin: data.cin || '',
      telephone: data.telephone || '',
      email: data.email_agent || '',
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
    if (!verifier(['email'])) {
      document.getElementById('email')?.focus();
      return;
    }
    if (!isPhoneNumberValid(form.telephone)) {
      setSaveError(
        'Le numéro de téléphone est invalide. Vérifiez le pays, l’indicatif et le nombre de chiffres.'
      );
      return;
    }

    setSaving(true);
    setSaveError('');

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

      toast.succes(
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
  const age = ageAgent(agent.date_naissance);
  const service = dureeService(agent.date_embauche);
  const sexe = agent.sexe === 'M' ? 'Masculin' : agent.sexe === 'F' ? 'Féminin' : agent.sexe;
  const naissance = [agent.date_naissance && formatDate(agent.date_naissance), agent.lieu_naissance]
    .filter(Boolean).join(', ');
  const grade = agent.grade_libelle
    ? `${agent.grade_libelle}${agent.grade_code ? ` (${agent.grade_code})` : ''}`
    : agent.grade_code;
  const retraitePossible = retraite?.dateRetraite ? null : retraite?.datePossible;
  const faits = [
    { Icone: Cake, label: 'Âge', valeur: age != null ? `${age} ans` : '—' },
    { Icone: Hourglass, label: 'Service', valeur: service ? `${service.annees} an${service.annees > 1 ? 's' : ''}` : '—' },
    { Icone: Award, label: 'Indice', valeur: agent.indice ?? '—' },
  ];
  const sections = [
    {
      cle: 'identite', titre: 'Identité', Icone: UserRound,
      items: [
        [UserRound, 'Nom', agent.nom],
        [UserRound, 'Prénom', agent.prenom],
        [Users, 'Sexe', sexe],
        [CalendarDays, 'Naissance', naissance],
        [IdCard, 'CIN', formatCin(agent.cin), 'mono'],
      ],
    },
    {
      cle: 'contact', titre: 'Contact et adresse', Icone: Phone,
      items: [
        [Phone, 'Téléphone', agent.telephone],
        [Mail, 'E-mail', agent.email_agent],
        [MapPin, 'Adresse', agent.adresse, 'large'],
      ],
    },
    {
      cle: 'poste', titre: 'Poste actuel', Icone: BriefcaseBusiness,
      items: [
        [BriefcaseBusiness, 'Poste', agent.poste],
        [Building2, 'Service', agent.service],
        [Landmark, 'Direction', agent.direction],
        [MapPin, 'Lieu de travail', agent.lieu_travail],
        [CalendarDays, 'Embauche', agent.date_embauche
          && `${formatDate(agent.date_embauche)}${service ? ` · ${libelleDuree(service)} de service` : ''}`],
        [Award, 'Catégorie · grade', [agent.categorie, grade].filter(Boolean).join(' · ')],
        [Hourglass, 'Retraite possible', retraite?.dateRetraite
          ? `Partie le ${formatDate(retraite.dateRetraite)}`
          : retraitePossible && `${formatDate(retraitePossible)}${delaiJusqua(retraitePossible) ? ` · dans ${delaiJusqua(retraitePossible)}` : ''}`],
      ],
    },
  ];
  const openCareer = () => navigate(`/carrieres/${agent.id}/analyse`);
  const formPercent = Math.round(
    ([form.nom, form.prenom, form.sexe, form.adresse, form.cin, form.telephone, form.email,
      form.dateNaissance, form.lieuNaissance, agent.date_embauche, agent.lieu_travail,
      displayedPhoto]
      .filter((value) => value && String(value).trim() !== '').length /
      12) * 100
  );

  return (
    <div className="rf-page agent-fiche">
      <button type="button" className="rf-back" onClick={() => navigate('/agents')}>
        <ArrowLeft size={18} />
        Retour aux agents
      </button>

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
            <circle cx="150" cy="150" r="130" fill="none" stroke="#C99A3E" strokeOpacity=".4" strokeWidth="2" />
            <circle cx="150" cy="150" r="90" fill="none" stroke="#C99A3E" strokeOpacity=".3" strokeWidth="2" />
          </svg>

          <div className="rf-profile-id">
            <div className={`rf-profile-photo avatar-type ${classeTypeEmploi(agent.type_emploi)}`}>
              <PersonPhoto
                src={photoUrl}
                alt={`Photo de ${formatName(agent)}`}
                initials={getEmployeeInitials(agent)}
              />
            </div>
            <h1>{formatName(agent)}</h1>
            <div className="agent-profile-badges">
              <TypeEmploiBadge type={agent.type_emploi} grand />
              <AgentPresence agent={agent} />
            </div>
            <p className="profil-carte-poste">{agent.poste || 'Poste non renseigné'}</p>
            {(agent.service || agent.direction) && (
              <p className="profil-carte-service">
                {agent.service}
                {agent.service && agent.direction && <br />}
                {agent.direction}
              </p>
            )}
            <p className="rf-profile-matricule">{agent.matricule || 'Matricule non renseigné'}</p>
          </div>

          <dl className="profil-faits">
            {faits.map(({ Icone, label, valeur }) => (
              <div key={label}>
                <dt><Icone size={14} aria-hidden="true" />{label}</dt>
                <dd>{valeur}</dd>
              </div>
            ))}
          </dl>

          <div className="profil-carte-actions">
            <a
              href={`/carrieres/${agent.id}/analyse`}
              className="rf-btn rf-btn-primary"
              onClick={(event) => {
                event.preventDefault();
                openCareer();
              }}
            >
              Carrière
              <ArrowRight size={16} />
            </a>
            <button type="button" className="rf-btn" onClick={openEditModal}>
              <Pencil size={16} />
              Modifier
            </button>
          </div>
        </aside>

        <div className="rf-profile-main profil-sections">
          {sections.map(({ cle, titre, Icone, items }) => (
            <section className="rf-card profil-section" aria-labelledby={`profil-${cle}`} key={cle}>
              <h2 id={`profil-${cle}`} className="profil-section-titre">
                <span className="rf-ico"><Icone size={18} /></span>
                {titre}
              </h2>
              <dl className="profil-section-grille">
                {items.map(([IconeChamp, label, valeur, genre]) => (
                  <div className={`rf-info${genre === 'large' ? ' is-large' : ''}`} key={label}>
                    <span className="rf-ico"><IconeChamp size={17} /></span>
                    <div>
                      <dt>{label}</dt>
                      <dd className={genre === 'mono' ? 'rf-mono-plain' : undefined}>{valeur || '—'}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              {cle === 'identite' && (
                <PieceScanneeLinks cibleType="AGENT" cibleId={agent.id} refreshKey={scanRefresh} />
              )}
            </section>
          ))}
          <ProfilComplementaireSection
            cle={`agent-${agent.id}`}
            charger={() => getProfilComplementaire(agent.id)}
            enregistrer={(donnees) => saveProfilComplementaire(agent.id, donnees)}
            peutModifier={['SPERS_AGENT', 'SPERS_CHEF'].includes(user?.role)}
          />
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
                  Band’IAkam a prérempli les champs surlignés en vert. Vérifiez-les,
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

                <div className="rf-field">
                  <label htmlFor="email">E-mail</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    maxLength={150}
                    autoComplete="off"
                    placeholder="nom@mef.gov.mg"
                    disabled={saving}
                    {...champProps('email')}
                  />
                  {erreur('email') && <small id="email-erreur" className="rf-field-error">{erreur('email')}</small>}
                </div>

                <div className={prefillClass('rf-field', 'cin', prefilled)}>
                  <label htmlFor="cin">CIN</label>
                  <input id="cin" name="cin" type="text" value={form.cin} onChange={handleChange} disabled={saving} />
                </div>

                <div className={prefillClass('rf-field', 'dateNaissance', prefilled)}>
                  <label htmlFor="dateNaissance">Date de naissance</label>
                  <input id="dateNaissance" name="dateNaissance" type="date" value={form.dateNaissance} max={new Date().toISOString().slice(0, 10)} onChange={handleChange} disabled={saving} />
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

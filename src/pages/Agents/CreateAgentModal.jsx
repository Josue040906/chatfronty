import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  FileImage,
  Plus,
  X,
} from 'lucide-react';
import { createAgent, uploadAgentPhoto, getAgentReferenceData } from '../../api/agents';
import { getPostesByService } from '../../api/postes';
import { getServices } from '../../api/services';
import LocaliteField from '../../components/forms/LocaliteField';
import PhoneField from '../../components/forms/PhoneField';
import VilleField from '../../components/forms/VilleField';
import { isPhoneNumberValid } from '../../utils/phone';
import AgentDialogCard from '../../components/agents/AgentDialogCard';

const STEPS = ['Identité', 'Coordonnées', 'Affectation'];

const EMPTY_FORM = {
  matricule: '',
  nom: '',
  prenom: '',
  sexe: '',
  adresse: '',
  localiteResidenceId: '',
  cin: '',
  telephone: '',
  dateNaissance: '',
  lieuNaissance: '',
  dateEmbauche: '',
  posteId: '',
  serviceId: '',
  typeEmploiId: '',
  categorieId: '',
  lieuTravail: '',
};

export default function CreateAgentModal({ acteurId, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [services, setServices] = useState([]);
  const [postes, setPostes] = useState([]);
  const [typesEmploi, setTypesEmploi] = useState([]);
  const [categories, setCategories] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingPostes, setLoadingPostes] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [posteError, setPosteError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const formRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      setLoadingOptions(true);
      setOptionsError('');

      try {
        const [serviceData, referenceData] = await Promise.all([
          getServices(),
          getAgentReferenceData(),
        ]);

        if (!cancelled) {
          if (serviceData.length === 0) {
            setOptionsError(
              'Aucun service n’est disponible. Ajoutez un service avant de créer un agent.'
            );
          }
          setServices(serviceData);
          setTypesEmploi(referenceData.typesEmploi);
          setCategories(referenceData.categories);
        }
      } catch (error) {
        console.error('Impossible de charger les options du formulaire agent.', error);

        if (!cancelled) {
          setOptionsError(
            error?.message ||
              'Impossible de charger les services et référentiels.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!form.serviceId) {
      return undefined;
    }

    let cancelled = false;

    getPostesByService(form.serviceId)
      .then((data) => {
        if (!cancelled) {
          setPostes(data);
        }
      })
      .catch((error) => {
        console.error('Impossible de charger les postes du service.', error);

        if (!cancelled) {
          setPosteError(
            error?.message ||
              'Impossible de charger les postes de ce service.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPostes(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [form.serviceId]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'serviceId' ? { posteId: '' } : {}),
    }));

    if (name === 'serviceId') {
      setPostes([]);
      setPosteError('');
      setLoadingPostes(Boolean(value));
    }
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setPhotoFile(null);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFormError('Format de photo non autorisé. Utilisez JPG, PNG ou WEBP.');
      event.target.value = '';
      setPhotoFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('La photo ne doit pas dépasser 5 Mo.');
      event.target.value = '';
      setPhotoFile(null);
      return;
    }

    setFormError('');
    setPhotoFile(file);
  }

  function validateStep(index) {
    const fieldset = formRef.current?.querySelector(`fieldset[data-step="${index}"]`);

    if (!fieldset) {
      return true;
    }

    for (const element of fieldset.elements) {
      if (element.willValidate && !element.checkValidity()) {
        element.reportValidity();
        return false;
      }
    }

    return true;
  }

  function goToNextStep() {
    if (validateStep(step)) {
      setFormError('');
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (step < STEPS.length - 1) {
      goToNextStep();
      return;
    }

    if (!isPhoneNumberValid(form.telephone)) {
      setFormError(
        'Le numéro de téléphone est invalide. Vérifiez le pays, l’indicatif et le nombre de chiffres.'
      );
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const result = await createAgent({
        ...form,
        acteurId,
      });

      let message = 'Le nouvel agent a été créé avec succès.';
      let tone = 'success';

      if (photoFile && result?.id) {
        try {
          await uploadAgentPhoto(result.id, photoFile, acteurId);
        } catch (error) {
          console.error('L’agent a été créé, mais sa photo n’a pas été téléversée.', error);
          message = `Agent créé, mais la photo n’a pas pu être enregistrée : ${
            error?.message || 'erreur inconnue'
          }`;
          tone = 'warning';
        }
      } else if (photoFile) {
        message =
          'Agent créé. Le serveur n’a pas renvoyé son identifiant, la photo n’a donc pas pu être enregistrée.';
        tone = 'warning';
      }

      onCreated({ message, tone });
    } catch (error) {
      console.error('Impossible de créer le nouvel agent.', error);
      setFormError(
        error?.message || 'Impossible de créer le nouvel agent.'
      );
    } finally {
      setSaving(false);
    }
  }

  const serviceName = services.find((service) => String(service.id) === String(form.serviceId))?.nom;
  const posteName = postes.find((poste) => String(poste.id) === String(form.posteId))?.intitule;
  const trackedFields = [
    form.matricule, form.nom, form.prenom, form.sexe, form.cin, form.telephone,
    form.dateNaissance, form.lieuNaissance, form.adresse, form.serviceId,
    form.posteId, form.dateEmbauche, form.lieuTravail, form.typeEmploiId,
    form.categorieId, photoFile,
  ];
  const percent =
    (trackedFields.filter((value) => Boolean(value)).length / trackedFields.length) * 100;

  return (
    <div
      className="rf-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        className="rf-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-create-title"
      >
        <AgentDialogCard
          kicker="Aperçu de la carte agent"
          name={`${form.prenom} ${form.nom}`.trim()}
          subtitle={posteName}
          tags={[form.matricule, serviceName]}
          initials={`${(form.prenom || '').charAt(0)}${(form.nom || '').charAt(0)}`.toUpperCase()}
          percent={percent}
        />

        <form ref={formRef} onSubmit={handleSubmit} className="rf-dialog-main">
          <header className="rf-dialog-head">
            <div>
              <span className="rf-ico"><Plus size={20} /></span>
              <div>
                <h2 id="agent-create-title">Ajouter un agent</h2>
                <p>Renseignez les informations personnelles et professionnelles.</p>
              </div>
            </div>
            <button
              type="button"
              className="rf-icon-btn"
              onClick={onClose}
              disabled={saving}
              aria-label="Fermer le formulaire"
            >
              <X size={16} />
            </button>
          </header>

          {formError && <p className="rf-error" role="alert">{formError}</p>}
          {optionsError && <p className="rf-error" role="alert">{optionsError}</p>}

          <ol className="rf-steps" aria-label="Étapes de création">
            {STEPS.map((label, index) => (
              <li
                key={label}
                className={index < step ? 'is-done' : index === step ? 'is-current' : ''}
                aria-current={index === step ? 'step' : undefined}
              >
                <span className="rf-step-dot">
                  {index < step ? <Check size={16} strokeWidth={3} /> : index + 1}
                </span>
                <span>{label}</span>
                {index < STEPS.length - 1 && <span className="rf-step-line" />}
              </li>
            ))}
          </ol>

          <p className="rf-dialog-note">
            Les champs marqués d’un astérisque sont obligatoires.
          </p>

          <fieldset
            className="rf-fieldset"
            data-step="0"
            hidden={step !== 0}
            disabled={saving || loadingOptions}
          >
            <legend>Identité</legend>
            <div className="rf-dialog-grid">
                <label className="rf-field">
                  <span className="rf-label">Matricule <b>*</b></span>
                  <input
                    name="matricule"
                    value={form.matricule}
                    onChange={handleChange}
                    maxLength={30}
                    autoComplete="off"
                    required
                  />
                </label>
                <label className="rf-field">
                  <span className="rf-label">Nom <b>*</b></span>
                  <input
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    maxLength={100}
                    autoComplete="family-name"
                    required
                  />
                </label>
                <label className="rf-field">
                  <span className="rf-label">Prénom</span>
                  <input
                    name="prenom"
                    value={form.prenom}
                    onChange={handleChange}
                    maxLength={100}
                    autoComplete="given-name"
                  />
                </label>
                <label className="rf-field">
                  <span className="rf-label">Sexe</span>
                  <select name="sexe" value={form.sexe} onChange={handleChange}>
                    <option value="">Sélectionner</option>
                    <option value="F">Féminin</option>
                    <option value="M">Masculin</option>
                  </select>
                </label>
              </div>
            
          </fieldset>

          <fieldset
            className="rf-fieldset"
            data-step="1"
            hidden={step !== 1}
            disabled={saving || loadingOptions}
          >
            <legend>Coordonnées et naissance</legend>
            <div className="rf-dialog-grid">
                <label className="rf-field">
                  <span className="rf-label">CIN</span>
                  <input name="cin" value={form.cin} onChange={handleChange} />
                </label>
                <label className="rf-field">
                  <span className="rf-label">Téléphone</span>
                  <PhoneField
                    value={form.telephone}
                    onChange={(telephone) =>
                      setForm((current) => ({ ...current, telephone }))
                    }
                    disabled={saving}
                  />
                </label>
                <label className="rf-field">
                  <span className="rf-label">Date de naissance</span>
                  <input
                    name="dateNaissance"
                    type="date"
                    value={form.dateNaissance}
                    onChange={handleChange}
                  />
                </label>
                <label className="rf-field">
                  <span className="rf-label">Lieu de naissance</span>
                  <VilleField
                    id="lieuNaissance"
                    name="lieuNaissance"
                    value={form.lieuNaissance}
                    onChange={handleChange}
                  />
                </label>
                <div className="rf-field rf-field-full">
                  <span className="rf-label">Adresse</span>
                  <LocaliteField
                    selectedId={form.localiteResidenceId}
                    onChange={(localiteResidenceId, adresse) =>
                      setForm((current) => ({
                        ...current,
                        localiteResidenceId: localiteResidenceId || '',
                        adresse,
                      }))
                    }
                    disabled={saving}
                  />
                </div>
              </div>
            
          </fieldset>

          <fieldset
            className="rf-fieldset"
            data-step="2"
            hidden={step !== 2}
            disabled={saving || loadingOptions}
          >
            <legend>Affectation et statut</legend>
            <div className="rf-dialog-grid">
                <label className="rf-field">
                  <span className="rf-label">Service <b>*</b></span>
                  <select
                    name="serviceId"
                    value={form.serviceId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionner un service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.nom}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rf-field">
                  <span className="rf-label">Poste <b>*</b></span>
                  <select
                    name="posteId"
                    value={form.posteId}
                    onChange={handleChange}
                    disabled={!form.serviceId || loadingPostes || Boolean(posteError)}
                    required
                  >
                    <option value="">
                      {loadingPostes
                        ? 'Chargement des postes...'
                        : 'Sélectionner un poste'}
                    </option>
                    {postes.map((poste) => (
                      <option key={poste.id} value={poste.id}>
                        {poste.intitule}
                      </option>
                    ))}
                  </select>
                  {posteError && (
                    <small className="agent-create-field-error">{posteError}</small>
                  )}
                  {form.serviceId && !loadingPostes && !posteError && postes.length === 0 && (
                    <small className="agent-create-help">
                      Aucun poste n’est associé à ce service.
                    </small>
                  )}
                </label>
                <label className="rf-field">
                  <span className="rf-label">Date d’embauche <b>*</b></span>
                  <input
                    name="dateEmbauche"
                    type="date"
                    value={form.dateEmbauche}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label className="rf-field">
                  <span className="rf-label">Lieu de travail</span>
                  <VilleField
                    id="lieuTravail"
                    name="lieuTravail"
                    value={form.lieuTravail}
                    onChange={handleChange}
                  />
                </label>
                <label className="rf-field">
                  <span className="rf-label">Type d’emploi</span>
                  <select
                    name="typeEmploiId"
                    value={form.typeEmploiId}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner</option>
                    {typesEmploi.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.nom}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rf-field">
                  <span className="rf-label">Catégorie</span>
                  <select
                    name="categorieId"
                    value={form.categorieId}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner</option>
                    {categories.map((categorie) => (
                      <option key={categorie.id} value={categorie.id}>
                        {categorie.code}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rf-field rf-field-full">
          <span className="rf-label">Photo <span style={{ fontWeight: 400 }}>(facultatif)</span></span>
          <span className="rf-upload">
            <span className="rf-upload-icon"><FileImage size={20} /></span>
            <span>
              <strong>{photoFile ? photoFile.name : 'Choisir une image'}</strong>
              <small>JPEG, PNG ou WebP · 5 Mo maximum</small>
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
            />
          </span>
        </label>
      </div>

          </fieldset>

          <footer className="rf-dialog-foot">
            <button type="button" className="rf-btn rf-btn-ghost" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <div>
              {loadingOptions && (
                <span className="rf-dialog-loading">Chargement des référentiels...</span>
              )}
              {step > 0 && (
                <button
                  key="previous"
                  type="button"
                  className="rf-btn"
                  onClick={() => setStep((current) => current - 1)}
                  disabled={saving}
                >
                  Précédent
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button
                  key="next"
                  type="button"
                  className="rf-btn rf-btn-primary"
                  onClick={goToNextStep}
                  disabled={loadingOptions || Boolean(optionsError)}
                >
                  Suivant
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  key="submit"
                  type="submit"
                  className="rf-btn rf-btn-primary"
                  disabled={saving || loadingOptions || Boolean(optionsError) || Boolean(posteError)}
                >
                  {saving ? 'Création...' : 'Créer l’agent'}
                </button>
              )}
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}

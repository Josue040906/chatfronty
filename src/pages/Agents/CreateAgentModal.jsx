import { useEffect, useState } from 'react';
import {
  AlertCircle,
  FileImage,
  Plus,
  X,
} from 'lucide-react';
import { createAgent, uploadAgentPhoto, getAgentReferenceData } from '../../api/agents';
import { getPostesByService } from '../../api/postes';
import { getServices } from '../../api/services';

const EMPTY_FORM = {
  matricule: '',
  nom: '',
  prenom: '',
  sexe: '',
  adresse: '',
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

  async function handleSubmit(event) {
    event.preventDefault();
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

  return (
    <div
      className="agent-create-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        className="agent-create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-create-title"
      >
        <header className="agent-create-header">
          <div className="agent-create-heading">
            <div className="agent-create-icon">
              <Plus size={19} />
            </div>
            <div>
              <h2 id="agent-create-title">Ajouter un agent</h2>
              <p>Renseignez les informations personnelles et professionnelles.</p>
            </div>
          </div>
          <button
            type="button"
            className="agent-create-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Fermer le formulaire"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="agent-create-body">
            {formError && (
              <div className="agent-create-error" role="alert">
                <AlertCircle size={17} />
                <span>{formError}</span>
              </div>
            )}

            {optionsError && (
              <div className="agent-create-error" role="alert">
                <AlertCircle size={17} />
                <span>{optionsError}</span>
              </div>
            )}

            <p className="agent-create-required-note">
              Les champs marqués d’un astérisque sont obligatoires.
            </p>

            <fieldset className="agent-create-fieldset" disabled={saving || loadingOptions}>
              <legend>Identité</legend>
              <div className="agent-create-grid">
                <label className="agent-form-field">
                  <span>Matricule <b>*</b></span>
                  <input
                    name="matricule"
                    value={form.matricule}
                    onChange={handleChange}
                    maxLength={30}
                    autoComplete="off"
                    required
                  />
                </label>
                <label className="agent-form-field">
                  <span>Nom <b>*</b></span>
                  <input
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    maxLength={100}
                    autoComplete="family-name"
                    required
                  />
                </label>
                <label className="agent-form-field">
                  <span>Prénom <b>*</b></span>
                  <input
                    name="prenom"
                    value={form.prenom}
                    onChange={handleChange}
                    maxLength={100}
                    autoComplete="given-name"
                    required
                  />
                </label>
                <label className="agent-form-field">
                  <span>Sexe</span>
                  <select name="sexe" value={form.sexe} onChange={handleChange}>
                    <option value="">Sélectionner</option>
                    <option value="F">Féminin</option>
                    <option value="M">Masculin</option>
                  </select>
                </label>
              </div>
            </fieldset>

            <fieldset className="agent-create-fieldset" disabled={saving || loadingOptions}>
              <legend>Coordonnées et naissance</legend>
              <div className="agent-create-grid">
                <label className="agent-form-field">
                  <span>CIN</span>
                  <input name="cin" value={form.cin} onChange={handleChange} />
                </label>
                <label className="agent-form-field">
                  <span>Téléphone</span>
                  <input
                    name="telephone"
                    type="tel"
                    value={form.telephone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </label>
                <label className="agent-form-field">
                  <span>Date de naissance</span>
                  <input
                    name="dateNaissance"
                    type="date"
                    value={form.dateNaissance}
                    onChange={handleChange}
                  />
                </label>
                <label className="agent-form-field">
                  <span>Lieu de naissance</span>
                  <input
                    name="lieuNaissance"
                    value={form.lieuNaissance}
                    onChange={handleChange}
                  />
                </label>
                <label className="agent-form-field agent-create-full">
                  <span>Adresse</span>
                  <input
                    name="adresse"
                    value={form.adresse}
                    onChange={handleChange}
                    autoComplete="street-address"
                  />
                </label>
              </div>
            </fieldset>

            <fieldset className="agent-create-fieldset" disabled={saving || loadingOptions}>
              <legend>Affectation et statut</legend>
              <div className="agent-create-grid">
                <label className="agent-form-field">
                  <span>Service <b>*</b></span>
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
                <label className="agent-form-field">
                  <span>Poste <b>*</b></span>
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
                <label className="agent-form-field">
                  <span>Date d’embauche <b>*</b></span>
                  <input
                    name="dateEmbauche"
                    type="date"
                    value={form.dateEmbauche}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label className="agent-form-field">
                  <span>Lieu de travail</span>
                  <input
                    name="lieuTravail"
                    value={form.lieuTravail}
                    onChange={handleChange}
                  />
                </label>
                <label className="agent-form-field">
                  <span>Type d’emploi</span>
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
                <label className="agent-form-field">
                  <span>Catégorie</span>
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
                <label className="agent-form-field agent-create-full">
                  <span>Photo (facultatif)</span>
                  <span className="agent-create-file-field">
                    <FileImage size={17} />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                    />
                  </span>
                  <small className="agent-create-help">
                    JPG, PNG ou WEBP — 5 Mo maximum.
                  </small>
                </label>
              </div>
            </fieldset>
          </div>

          <footer className="agent-create-footer">
            {loadingOptions && (
              <span className="agent-create-loading">
                Chargement des services et référentiels...
              </span>
            )}
            <button
              type="button"
              className="agent-profile-cancel-button"
              onClick={onClose}
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="agent-profile-save-button"
              disabled={saving || loadingOptions || Boolean(optionsError) || Boolean(posteError)}
            >
              <Plus size={16} />
              {saving ? 'Création...' : 'Créer l’agent'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

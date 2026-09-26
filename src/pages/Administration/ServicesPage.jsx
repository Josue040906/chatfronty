import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  getServices,
  createService,
  updateService,
  deleteService,
} from '../../api/services';

import { getDirections } from '../../api/directions';

const EMPTY_FORM = {
  code: '',
  nom: '',
  description: '',
  directionId: '',
};

export default function ServicesPage() {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [directions, setDirections] = useState([]);

  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const [deletingId, setDeletingId] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const [servicesData, directionsData] = await Promise.all([
        getServices(),
        getDirections(),
      ]);

      setServices(servicesData);
      setDirections(directionsData);
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          'Impossible de charger les services.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreateModal() {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setSuccess('');
    setModalOpen(true);
  }

  function openEditModal(service) {
    setEditingService(service);

    setForm({
      code: service.code || service.code_service || '',
      nom: service.nom || '',
      description: service.description || '',
      directionId:
        service.direction_id !== null &&
        service.direction_id !== undefined
          ? String(service.direction_id)
          : '',
    });

    setFormError('');
    setSuccess('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingService(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function validateForm() {
    const code = form.code.trim();
    const nom = form.nom.trim();

    if (!code) {
      return 'Le code du service est obligatoire.';
    }

    if (code.length > 50) {
      return 'Le code du service ne doit pas dépasser 50 caractères.';
    }

    if (!nom) {
      return 'Le nom du service est obligatoire.';
    }

    if (nom.length > 200) {
      return 'Le nom du service ne doit pas dépasser 200 caractères.';
    }

    if (
      form.directionId &&
      !Number.isInteger(Number(form.directionId))
    ) {
      return 'La direction sélectionnée est invalide.';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError('');
    setSuccess('');

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      code: form.code.trim(),
      nom: form.nom.trim(),
      description: form.description.trim() || null,
      directionId: form.directionId
        ? Number(form.directionId)
        : null,
    };

    try {
      setSaving(true);

      if (editingService) {
        await updateService(editingService.id, payload);

        setSuccess('Service modifié avec succès.');
      } else {
        await createService(payload);

        setSuccess('Service créé avec succès.');
      }

      await loadData();

      setModalOpen(false);
      setEditingService(null);
      setForm(EMPTY_FORM);
      setFormError('');
    } catch (err) {
      console.error(err);

      setFormError(
        err?.message ||
          `Impossible de ${
            editingService ? 'modifier' : 'créer'
          } le service.`
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(service) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer le service « ${
        service.nom || service.code || 'ce service'
      } » ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(service.id);
      setError('');
      setSuccess('');

      await deleteService(service.id);

      setSuccess('Service supprimé avec succès.');

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          'Impossible de supprimer ce service.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredServices = services.filter((service) => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return (
      service.code?.toLowerCase().includes(value) ||
      service.code_service?.toLowerCase().includes(value) ||
      service.nom?.toLowerCase().includes(value) ||
      service.description?.toLowerCase().includes(value) ||
      service.direction?.toLowerCase().includes(value)
    );
  });

  return (
    <div className="administration-page">
      <header className="administration-page-header">
        <div>
          <button
            type="button"
            className="administration-back-button"
            onClick={() => navigate('/administration')}
          >
            <ArrowLeft size={17} />
            Administration
          </button>

          <span className="administration-eyebrow">
            ORGANISATION
          </span>

          <h1>Services</h1>

          <p>
            Gérez les services qui composent
            l'organisation du MEF.
          </p>
        </div>

        <div className="administration-header-icon">
          <Building2 size={24} strokeWidth={1.7} />
        </div>
      </header>

      <div className="administration-toolbar">
        <div className="administration-search">
          <Search size={17} />

          <input
            type="search"
            placeholder="Rechercher un service..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <button
          type="button"
          className="administration-primary-button"
          onClick={openCreateModal}
        >
          <Plus size={17} />
          Nouveau service
        </button>
      </div>

{success && (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '16px',
      padding: '12px 14px',
      borderRadius: '10px',
      background: '#ecfdf3',
      color: '#18794e',
      border: '1px solid #bbf7d0',
      fontSize: '14px',
    }}
  >
    <Check size={17} />
    {success}
  </div>
)}

      {loading && (
        <div className="administration-state">
          Chargement des services...
        </div>
      )}

      {!loading && error && (
        <div className="administration-state administration-state-error">
          style={{ marginBottom: '16px' }}
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        filteredServices.length === 0 && (
          <div className="administration-state">
            Aucun service trouvé.
          </div>
        )}

      {!loading &&
        !error &&
        filteredServices.length > 0 && (
          <div className="administration-list">
            {filteredServices.map((service) => (
              <article
                key={service.id}
                className="administration-list-card"
              >
                <div className="administration-list-icon">
                  <Building2
                    size={20}
                    strokeWidth={1.7}
                  />
                </div>

                <div className="administration-list-content">
                  <h2>
                    {service.code ||
                      service.code_service ||
                      'Service'}
                  </h2>

                  <p>
                    {service.nom ||
                      service.description ||
                      'Aucune description disponible.'}
                  </p>

                  {service.direction && (
                    <span className="administration-list-meta">
                      {service.direction}
                    </span>
                  )}
                </div>

                <span className="administration-list-id">
                  #{service.id}
                </span>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginLeft: '12px',
                  }}
                >
                  <button
                    type="button"
                    title="Modifier"
                    onClick={() =>
                      openEditModal(service)
                    }
                    disabled={deletingId === service.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '34px',
                      height: '34px',
                      border: '1px solid #d9dee7',
                      borderRadius: '8px',
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    title="Supprimer"
                    onClick={() =>
                      handleDelete(service)
                    }
                    disabled={deletingId === service.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '34px',
                      height: '34px',
                      border: '1px solid #d9dee7',
                      borderRadius: '8px',
                      background: '#fff',
                      cursor:
                        deletingId === service.id
                          ? 'not-allowed'
                          : 'pointer',
                      opacity:
                        deletingId === service.id
                          ? 0.6
                          : 1,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 1000,
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: '14px',
              padding: '24px',
              boxShadow:
                '0 20px 50px rgba(15, 23, 42, 0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '22px',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '20px',
                  }}
                >
                  {editingService
                    ? 'Modifier le service'
                    : 'Nouveau service'}
                </h2>

                <p
                  style={{
                    margin: '6px 0 0',
                    color: '#64748b',
                    fontSize: '14px',
                  }}
                >
                  {editingService
                    ? 'Modifiez les informations du service.'
                    : 'Renseignez les informations du nouveau service.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: saving
                    ? 'not-allowed'
                    : 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                className="administration-state administration-state-error"
                style={{
                  marginBottom: '18px',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: 'grid',
                  gap: '16px',
                }}
              >
                <label>
                  <span
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontWeight: 600,
                    }}
                  >
                    Code *
                  </span>

                  <input
                    type="text"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    maxLength={50}
                    placeholder="Ex. DRH-SERV"
                    disabled={saving}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      border: '1px solid #d9dee7',
                      borderRadius: '8px',
                    }}
                  />
                </label>

                <label>
                  <span
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontWeight: 600,
                    }}
                  >
                    Nom *
                  </span>

                  <input
                    type="text"
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    maxLength={200}
                    placeholder="Nom du service"
                    disabled={saving}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      border: '1px solid #d9dee7',
                      borderRadius: '8px',
                    }}
                  />
                </label>

                <label>
                  <span
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontWeight: 600,
                    }}
                  >
                    Direction
                  </span>

                  <select
                    name="directionId"
                    value={form.directionId}
                    onChange={handleChange}
                    disabled={saving}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      border: '1px solid #d9dee7',
                      borderRadius: '8px',
                      background: '#fff',
                    }}
                  >
                    <option value="">
                      Aucune direction
                    </option>

                    {directions.map((direction) => (
                      <option
                        key={direction.id}
                        value={direction.id}
                      >
                        {direction.nom}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontWeight: 600,
                    }}
                  >
                    Description
                  </span>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Description du service..."
                    disabled={saving}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      border: '1px solid #d9dee7',
                      borderRadius: '8px',
                      resize: 'vertical',
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '24px',
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid #d9dee7',
                    borderRadius: '8px',
                    background: '#fff',
                    cursor: saving
                      ? 'not-allowed'
                      : 'pointer',
                  }}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="administration-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Enregistrement...'
                    : editingService
                      ? 'Enregistrer les modifications'
                      : 'Créer le service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
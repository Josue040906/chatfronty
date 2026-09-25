import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  createPoste,
  deletePoste,
  getPostes,
  updatePoste,
} from '../../api/postes';

import { getServices } from '../../api/services';

const EMPTY_FORM = {
  intitule: '',
  description: '',
  serviceId: '',
};

export default function PostesPage() {
  const navigate = useNavigate();

  const [postes, setPostes] = useState([]);
  const [services, setServices] = useState([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingPoste, setEditingPoste] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const [postesData, servicesData] = await Promise.all([
        getPostes(),
        getServices(),
      ]);

      setPostes(postesData);
      setServices(servicesData);
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          'Impossible de charger les données des postes.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setFormError('');
    setEditingPoste(null);
  }

  function openCreateForm() {
    setSuccess('');
    setError('');
    resetForm();
    setShowForm(true);
  }

  function openEditForm(poste) {
    setSuccess('');
    setError('');
    setFormError('');

    setEditingPoste(poste);

    setForm({
      intitule: poste.intitule || '',
      description: poste.description || '',
      serviceId: poste.service_id
        ? String(poste.service_id)
        : '',
    });

    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    resetForm();
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError('');
    setSuccess('');
    setError('');

    const intitule = form.intitule.trim();
    const description = form.description.trim();
    const serviceId = Number(form.serviceId);

    if (!intitule) {
      setFormError("L'intitulé du poste est obligatoire.");
      return;
    }

    if (intitule.length > 150) {
      setFormError(
        "L'intitulé du poste ne doit pas dépasser 150 caractères."
      );
      return;
    }

    if (!form.serviceId || !Number.isInteger(serviceId)) {
      setFormError('Veuillez sélectionner un service.');
      return;
    }

    try {
      setSaving(true);

      if (editingPoste) {
        await updatePoste(editingPoste.id, {
          intitule,
          description,
          serviceId,
        });

        setSuccess('Le poste a été modifié avec succès.');
      } else {
        await createPoste({
          intitule,
          description,
          serviceId,
        });

        setSuccess('Le poste a été créé avec succès.');
      }

      setShowForm(false);
      resetForm();

      await loadData();
    } catch (err) {
      console.error(err);

      setFormError(
        err.message ||
          'Une erreur est survenue lors de l’enregistrement.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(poste) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer le poste « ${poste.intitule} » ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(poste.id);
      setSuccess('');
      setError('');

      await deletePoste(poste.id);

      setSuccess('Le poste a été supprimé avec succès.');

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Impossible de supprimer ce poste.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredPostes = postes.filter((poste) => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return (
      poste.intitule?.toLowerCase().includes(value) ||
      poste.description?.toLowerCase().includes(value) ||
      poste.code_service?.toLowerCase().includes(value) ||
      poste.service?.toLowerCase().includes(value) ||
      poste.direction?.toLowerCase().includes(value)
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

          <h1>Postes</h1>

          <p>
            Consultez et gérez les postes définis dans
            l'organisation du MEF.
          </p>
        </div>

        <div className="administration-header-icon">
          <BriefcaseBusiness
            size={24}
            strokeWidth={1.7}
          />
        </div>
      </header>

      <div className="administration-toolbar">
        <div className="administration-search">
          <Search size={17} />

          <input
            type="search"
            placeholder="Rechercher un poste..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <button
          type="button"
          className="administration-primary-button"
          onClick={openCreateForm}
        >
          <Plus size={17} />
          Nouveau poste
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

      {!loading && error && (
        <div
          className="administration-state administration-state-error"
          style={{ marginBottom: '16px' }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="administration-state">
          Chargement des postes...
        </div>
      )}

      {!loading &&
        !error &&
        filteredPostes.length === 0 && (
          <div className="administration-state">
            {search.trim()
              ? 'Aucun poste ne correspond à votre recherche.'
              : 'Aucun poste trouvé.'}
          </div>
        )}

      {!loading &&
        filteredPostes.length > 0 && (
          <div className="administration-list">
            {filteredPostes.map((poste) => (
              <article
                key={poste.id}
                className="administration-list-card"
              >
                <div className="administration-list-icon">
                  <BriefcaseBusiness
                    size={20}
                    strokeWidth={1.7}
                  />
                </div>

                <div className="administration-list-content">
                  <h2>
                    {poste.intitule ||
                      'Poste sans intitulé'}
                  </h2>

                  <p>
                    {poste.description ||
                      'Aucune description disponible.'}
                  </p>

                  {poste.service && (
                    <span className="administration-list-meta">
                      {poste.code_service
                        ? `${poste.code_service} — ${poste.service}`
                        : poste.service}
                    </span>
                  )}

                  {poste.direction && (
                    <span className="administration-list-meta">
                      {poste.direction}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginLeft: '16px',
                  }}
                >
                  <button
                    type="button"
                    title="Modifier"
                    onClick={() =>
                      openEditForm(poste)
                    }
                    style={{
                      width: '36px',
                      height: '36px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e5e7eb',
                      borderRadius: '9px',
                      background: '#fff',
                      color: '#4b5563',
                      cursor: 'pointer',
                    }}
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    title="Supprimer"
                    disabled={deletingId === poste.id}
                    onClick={() =>
                      handleDelete(poste)
                    }
                    style={{
                      width: '36px',
                      height: '36px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #fecaca',
                      borderRadius: '9px',
                      background: '#fff',
                      color: '#dc2626',
                      cursor:
                        deletingId === poste.id
                          ? 'wait'
                          : 'pointer',
                      opacity:
                        deletingId === poste.id
                          ? 0.5
                          : 1,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <span className="administration-list-id">
                  #{poste.id}
                </span>
              </article>
            ))}
          </div>
        )}

      {showForm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="poste-form-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'rgba(15, 23, 42, 0.42)',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: '16px',
              boxShadow:
                '0 24px 70px rgba(15, 23, 42, 0.20)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '20px',
                padding: '22px 24px',
                borderBottom: '1px solid #eef0f3',
              }}
            >
              <div>
                <span className="administration-eyebrow">
                  ORGANISATION
                </span>

                <h2
                  id="poste-form-title"
                  style={{
                    margin: '5px 0 0',
                    fontSize: '20px',
                    color: '#172033',
                  }}
                >
                  {editingPoste
                    ? 'Modifier le poste'
                    : 'Nouveau poste'}
                </h2>

                <p
                  style={{
                    margin: '6px 0 0',
                    color: '#6b7280',
                    fontSize: '14px',
                  }}
                >
                  {editingPoste
                    ? 'Modifiez les informations du poste.'
                    : 'Ajoutez un nouveau poste à l’organisation.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Fermer"
                style={{
                  width: '34px',
                  height: '34px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #e5e7eb',
                  borderRadius: '9px',
                  background: '#fff',
                  color: '#6b7280',
                  cursor: saving
                    ? 'not-allowed'
                    : 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: 'grid',
                  gap: '18px',
                  padding: '24px',
                }}
              >
                {formError && (
                  <div
                    style={{
                      padding: '11px 13px',
                      borderRadius: '9px',
                      background: '#fef2f2',
                      border:
                        '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: '14px',
                    }}
                  >
                    {formError}
                  </div>
                )}

                <label
                  style={{
                    display: 'grid',
                    gap: '7px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Intitulé du poste
                  </span>

                  <input
                    type="text"
                    name="intitule"
                    value={form.intitule}
                    onChange={handleChange}
                    maxLength={150}
                    placeholder="Ex. Gestionnaire de dossiers"
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 13px',
                      border:
                        '1px solid #dfe3e8',
                      borderRadius: '9px',
                      outline: 'none',
                      fontSize: '14px',
                      color: '#172033',
                    }}
                  />

                  <span
                    style={{
                      textAlign: 'right',
                      fontSize: '12px',
                      color: '#9ca3af',
                    }}
                  >
                    {form.intitule.length}/150
                  </span>
                </label>

                <label
                  style={{
                    display: 'grid',
                    gap: '7px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Service
                  </span>

                  <select
                    name="serviceId"
                    value={form.serviceId}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 13px',
                      border:
                        '1px solid #dfe3e8',
                      borderRadius: '9px',
                      outline: 'none',
                      background: '#fff',
                      fontSize: '14px',
                      color: '#172033',
                    }}
                  >
                    <option value="">
                      Sélectionner un service
                    </option>

                    {services.map((service) => (
                      <option
                        key={service.id}
                        value={service.id}
                      >
                        {service.code
                          ? `${service.code} — ${service.nom}`
                          : service.nom}
                      </option>
                    ))}
                  </select>
                </label>

                <label
                  style={{
                    display: 'grid',
                    gap: '7px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Description
                  </span>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Décrivez brièvement le rôle et les missions du poste..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 13px',
                      border:
                        '1px solid #dfe3e8',
                      borderRadius: '9px',
                      outline: 'none',
                      resize: 'vertical',
                      fontSize: '14px',
                      color: '#172033',
                      fontFamily: 'inherit',
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  padding: '16px 24px',
                  borderTop: '1px solid #eef0f3',
                  background: '#fafbfc',
                  borderRadius: '0 0 16px 16px',
                }}
              >
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid #dfe3e8',
                    borderRadius: '9px',
                    background: '#fff',
                    color: '#4b5563',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: saving
                      ? 'not-allowed'
                      : 'pointer',
                  }}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="administration-primary-button"
                  style={{
                    border: 'none',
                    opacity: saving ? 0.7 : 1,
                    cursor: saving
                      ? 'wait'
                      : 'pointer',
                  }}
                >
                  <Check size={17} />

                  {saving
                    ? 'Enregistrement...'
                    : editingPoste
                      ? 'Enregistrer les modifications'
                      : 'Créer le poste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

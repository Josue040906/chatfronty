
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
  createDirection,
  deleteDirection,
  getDirections,
  updateDirection,
} from '../../api/directions';

const EMPTY_FORM = {
  nom: '',
  description: '',
};

export default function DirectionsPage() {
  const navigate = useNavigate();

  const [directions, setDirections] = useState([]);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingDirection, setEditingDirection] =
    useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  async function loadDirections() {
    try {
      setLoading(true);
      setError('');

      const data = await getDirections();

      setDirections(data);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Impossible de charger les directions.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDirections();
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setFormError('');
    setEditingDirection(null);
  }

  function openCreateForm() {
    setSuccess('');
    setError('');
    setFormError('');

    resetForm();
    setShowForm(true);
  }

  function openEditForm(direction) {
    setSuccess('');
    setError('');
    setFormError('');

    setEditingDirection(direction);

    setForm({
      nom: direction.nom || '',
      description: direction.description || '',
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

    const nom = form.nom.trim();
    const description = form.description.trim();

    if (!nom) {
      setFormError(
        'Le nom de la direction est obligatoire.'
      );
      return;
    }

    if (nom.length > 200) {
      setFormError(
        'Le nom de la direction ne doit pas dépasser 200 caractères.'
      );
      return;
    }

    const data = {
      nom,
      description: description || null,
    };

    try {
      setSaving(true);

      if (editingDirection) {
        await updateDirection(
          editingDirection.id,
          data
        );

        setSuccess(
          'La direction a été modifiée avec succès.'
        );
      } else {
        await createDirection(data);

        setSuccess(
          'La direction a été créée avec succès.'
        );
      }

      setShowForm(false);
      resetForm();

      await loadDirections();
    } catch (err) {
      console.error(err);

      setFormError(
        err.message ||
          "Une erreur est survenue lors de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(direction) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer la direction « ${
        direction.nom
      } » ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(direction.id);
      setSuccess('');
      setError('');

      await deleteDirection(direction.id);

      setSuccess(
        'La direction a été supprimée avec succès.'
      );

      await loadDirections();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Impossible de supprimer cette direction.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredDirections = directions.filter(
    (direction) => {
      const value = search
        .trim()
        .toLowerCase();

      if (!value) {
        return true;
      }

      return (
        direction.nom
          ?.toLowerCase()
          .includes(value) ||
        direction.description
          ?.toLowerCase()
          .includes(value)
      );
    }
  );

  return (
    <div className="administration-page">
      <header className="administration-page-header">
        <div>
          <button
            type="button"
            className="administration-back-button"
            onClick={() =>
              navigate('/administration')
            }
          >
            <ArrowLeft size={17} />
            Administration
          </button>

          <span className="administration-eyebrow">
            ORGANISATION
          </span>

          <h1>Directions</h1>

          <p>
            Consultez et gérez les directions qui
            composent l'organisation du MEF.
          </p>
        </div>

        <div className="administration-header-icon">
          <Building2
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
            placeholder="Rechercher une direction..."
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
          Nouvelle direction
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
          Chargement des directions...
        </div>
      )}

      {!loading &&
        !error &&
        filteredDirections.length === 0 && (
          <div className="administration-state">
            {search.trim()
              ? 'Aucune direction ne correspond à votre recherche.'
              : 'Aucune direction trouvée.'}
          </div>
        )}

      {!loading &&
        !error &&
        filteredDirections.length > 0 && (
          <div className="administration-list">
            {filteredDirections.map(
              (direction) => (
                <article
                  key={direction.id}
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
                      {direction.nom}
                    </h2>

                    <p>
                      {direction.description ||
                        'Aucune description disponible.'}
                    </p>
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
                        openEditForm(direction)
                      }
                      style={{
                        width: '36px',
                        height: '36px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border:
                          '1px solid #e5e7eb',
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
                      disabled={
                        deletingId ===
                        direction.id
                      }
                      onClick={() =>
                        handleDelete(direction)
                      }
                      style={{
                        width: '36px',
                        height: '36px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border:
                          '1px solid #fecaca',
                        borderRadius: '9px',
                        background: '#fff',
                        color: '#dc2626',
                        cursor:
                          deletingId ===
                          direction.id
                            ? 'wait'
                            : 'pointer',
                        opacity:
                          deletingId ===
                          direction.id
                            ? 0.5
                            : 1,
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <span className="administration-list-id">
                    #{direction.id}
                  </span>
                </article>
              )
            )}
          </div>
        )}

      {showForm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="direction-form-title"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
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
            background:
              'rgba(15, 23, 42, 0.42)',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '600px',
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
                justifyContent:
                  'space-between',
                gap: '20px',
                padding: '22px 24px',
                borderBottom:
                  '1px solid #eef0f3',
              }}
            >
              <div>
                <span className="administration-eyebrow">
                  ORGANISATION
                </span>

                <h2
                  id="direction-form-title"
                  style={{
                    margin: '5px 0 0',
                    fontSize: '20px',
                    color: '#172033',
                  }}
                >
                  {editingDirection
                    ? 'Modifier la direction'
                    : 'Nouvelle direction'}
                </h2>

                <p
                  style={{
                    margin: '6px 0 0',
                    color: '#6b7280',
                    fontSize: '14px',
                  }}
                >
                  {editingDirection
                    ? 'Modifiez les informations de la direction.'
                    : 'Ajoutez une nouvelle direction à l’organisation.'}
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
                  justifyContent:
                    'center',
                  border:
                    '1px solid #e5e7eb',
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
                    Nom de la direction
                  </span>

                  <input
                    type="text"
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    maxLength={200}
                    placeholder="Ex. Direction des Ressources Humaines"
                    required
                    autoFocus
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
                    {form.nom.length}/200
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
                    Description
                  </span>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Description de la direction..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 13px',
                      border:
                        '1px solid #dfe3e8',
                      borderRadius: '9px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      color: '#172033',
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  gap: '10px',
                  padding: '16px 24px',
                  borderTop:
                    '1px solid #eef0f3',
                  background: '#fafbfc',
                  borderRadius:
                    '0 0 16px 16px',
                }}
              >
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  style={{
                    padding: '10px 16px',
                    border:
                      '1px solid #dfe3e8',
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
                    : editingDirection
                      ? 'Enregistrer les modifications'
                      : 'Créer la direction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

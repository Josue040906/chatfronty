import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  createStatut,
  deleteStatut,
  getStatuts,
  updateStatut,
} from '../../api/statuts';

function formatDate(value) {
  if (!value) {
    return null;
  }

  const text = String(value);

  // Les réponses PostgreSQL peuvent arriver sous forme
  // "2026-01-01T00:00:00.000Z".
  // On récupère uniquement la partie YYYY-MM-DD pour
  // éviter les décalages de fuseau horaire.
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);

  if (!match) {
    return null;
  }

  const [year, month, day] = match[1].split('-');

  return `${day}/${month}/${year}`;
}

function getDateInputValue(value) {
  if (!value) {
    return '';
  }

  const text = String(value);

  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);

  return match ? match[1] : '';
}

const EMPTY_FORM = {
  code: '',
  libelle: '',
  description: '',
  dateDebutValidite: '',
  dateFinValidite: '',
};

export default function StatutsPage() {
  const navigate = useNavigate();

  const [statuts, setStatuts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStatut, setEditingStatut] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function loadStatuts() {
    try {
      setLoading(true);
      setError('');

      const data = await getStatuts();
      setStatuts(data);
    } catch (err) {
      console.error(err);
      setError(
        err?.message || 'Impossible de charger les statuts.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatuts();
  }, []);

  function openCreateModal() {
    setEditingStatut(null);
    setForm(EMPTY_FORM);
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function openEditModal(statut) {
    setEditingStatut(statut);

    setForm({
      code: statut.code || '',
      libelle: statut.libelle || '',
      description: statut.description || '',
      dateDebutValidite: getDateInputValue(
        statut.date_debut_validite
      ),
      dateFinValidite: getDateInputValue(
        statut.date_fin_validite
      ),
    });

    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingStatut(null);
    setForm(EMPTY_FORM);
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

    setError('');
    setSuccess('');

    if (!form.code.trim()) {
      setError('Le code du statut est obligatoire.');
      return;
    }

    if (!form.libelle.trim()) {
      setError('Le libellé du statut est obligatoire.');
      return;
    }

    if (!form.dateDebutValidite) {
      setError(
        'La date de début de validité est obligatoire.'
      );
      return;
    }

    if (
      form.dateFinValidite &&
      form.dateFinValidite < form.dateDebutValidite
    ) {
      setError(
        'La date de fin ne peut pas être antérieure à la date de début.'
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        code: form.code.trim(),
        libelle: form.libelle.trim(),
        description: form.description.trim(),
        dateDebutValidite: form.dateDebutValidite,
        dateFinValidite:
          form.dateFinValidite || null,
      };

      if (editingStatut) {
        await updateStatut(
          editingStatut.id,
          payload
        );

        setSuccess(
          'Le statut a été modifié avec succès.'
        );
      } else {
        await createStatut(payload);

        setSuccess(
          'Le statut a été créé avec succès.'
        );
      }

      closeModal();
      await loadStatuts();
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          'Une erreur est survenue lors de l’enregistrement.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(statut) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer le statut « ${
        statut.libelle || statut.code
      } » ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await deleteStatut(statut.id);

      setSuccess(
        'Le statut a été supprimé avec succès.'
      );

      await loadStatuts();
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          'Impossible de supprimer ce statut.'
      );
    }
  }

  const filteredStatuts = statuts.filter((statut) => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return (
      statut.code?.toLowerCase().includes(value) ||
      statut.libelle?.toLowerCase().includes(value) ||
      statut.description
        ?.toLowerCase()
        .includes(value)
    );
  });

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
            RÉFÉRENTIELS RH
          </span>

          <h1>Statuts</h1>

          <p>
            Gérez les statuts administratifs utilisés
            dans la gestion des agents.
          </p>
        </div>

        <div className="administration-header-icon">
          <ShieldCheck
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
            placeholder="Rechercher un statut..."
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
          Nouveau statut
        </button>
      </div>

      {success && (
        <div className="administration-state administration-state-success">
          {success}
        </div>
      )}

      {loading && (
        <div className="administration-state">
          Chargement des statuts...
        </div>
      )}

      {!loading && error && (
        <div className="administration-state administration-state-error">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        filteredStatuts.length === 0 && (
          <div className="administration-state">
            Aucun statut trouvé.
          </div>
        )}

      {!loading &&
        !error &&
        filteredStatuts.length > 0 && (
          <div className="administration-list">
            {filteredStatuts.map((statut) => {
              const dateDebut = formatDate(
                statut.date_debut_validite
              );

              const dateFin = formatDate(
                statut.date_fin_validite
              );

              return (
                <article
                  key={statut.id}
                  className="administration-list-card"
                >
                  <div className="administration-list-icon">
                    <ShieldCheck
                      size={20}
                      strokeWidth={1.7}
                    />
                  </div>

                  <div className="administration-list-content">
                    <h2>
                      {statut.libelle ||
                        'Statut sans libellé'}
                    </h2>

                    <p>
                      {statut.description ||
                        'Aucune description disponible.'}
                    </p>

                    <span className="administration-list-meta">
                      {statut.code}
                    </span>

                    {(dateDebut || dateFin) && (
                      <span className="administration-list-meta">
                        Validité :{' '}
                        {dateDebut || '—'} →{' '}
                        {dateFin || 'En cours'}
                      </span>
                    )}
                  </div>

                  <span className="administration-list-id">
                    #{statut.id}
                  </span>

                  <div className="administration-list-actions">
                    <button
                      type="button"
                      className="administration-icon-button"
                      title="Modifier"
                      onClick={() =>
                        openEditModal(statut)
                      }
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      className="administration-icon-button administration-icon-button-danger"
                      title="Supprimer"
                      onClick={() =>
                        handleDelete(statut)
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      {modalOpen && (
        <div
          className="administration-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="administration-modal">
            <div className="administration-modal-header">
              <div>
                <span className="administration-eyebrow">
                  RÉFÉRENTIELS RH
                </span>

                <h2>
                  {editingStatut
                    ? 'Modifier le statut'
                    : 'Nouveau statut'}
                </h2>
              </div>

              <button
                type="button"
                className="administration-modal-close"
                onClick={closeModal}
                disabled={saving}
                title="Fermer"
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="administration-form"
              onSubmit={handleSubmit}
            >
              <div className="administration-form-grid">
                <label className="administration-form-field">
                  <span>Code *</span>

                  <input
                    type="text"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="Ex. FONCTIONNAIRE"
                    disabled={saving}
                  />
                </label>

                <label className="administration-form-field">
                  <span>Libellé *</span>

                  <input
                    type="text"
                    name="libelle"
                    value={form.libelle}
                    onChange={handleChange}
                    maxLength={255}
                    placeholder="Ex. Fonctionnaire"
                    disabled={saving}
                  />
                </label>
              </div>

              <label className="administration-form-field">
                <span>Description</span>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Description du statut..."
                  disabled={saving}
                />
              </label>

              <div className="administration-form-grid">
                <label className="administration-form-field">
                  <span>
                    Début de validité *
                  </span>

                  <input
                    type="date"
                    name="dateDebutValidite"
                    value={
                      form.dateDebutValidite
                    }
                    onChange={handleChange}
                    disabled={saving}
                  />
                </label>

                <label className="administration-form-field">
                  <span>
                    Fin de validité
                  </span>

                  <input
                    type="date"
                    name="dateFinValidite"
                    value={
                      form.dateFinValidite
                    }
                    onChange={handleChange}
                    disabled={saving}
                  />

                  <small>
                    Laisser vide si le statut est
                    toujours en vigueur.
                  </small>
                </label>
              </div>

              {error && (
                <div className="administration-form-error">
                  {error}
                </div>
              )}

              <div className="administration-form-actions">
                <button
                  type="button"
                  className="administration-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
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
                    : editingStatut
                      ? 'Enregistrer les modifications'
                      : 'Créer le statut'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

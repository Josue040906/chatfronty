
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  UserRound,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getAgents } from '../../api/agents';
import {
  createDirection,
  deleteDirection,
  getDirections,
  updateDirection,
} from '../../api/directions';
import { canManageReferentiels } from '../../utils/roles';

const EMPTY_FORM = {
  nom: '',
  description: '',
};

export default function DirectionsPage({ user }) {
  // Lecture pour tout compte SPERS actif ; écriture réservée au chef (API : 403 sinon).
  const canManage = canManageReferentiels(user);
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
  const [agentCounts, setAgentCounts] = useState({});

  async function loadDirections() {
    try {
      const data = await getDirections();

      setError('');
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
    void Promise.resolve().then(() => loadDirections());
  }, []);

  // Effectifs par direction (affichage seul : un échec n'empêche pas la page).
  useEffect(() => {
    let cancelled = false;
    getAgents()
      .then((agents) => {
        if (cancelled || !Array.isArray(agents)) return;
        const counts = {};
        agents.forEach((agent) => {
          const key = String(agent?.direction || '').trim().toLowerCase();
          if (key) counts[key] = (counts[key] || 0) + 1;
        });
        setAgentCounts(counts);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
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
    <div className="administration-page rf-page">
      <button
        type="button"
        className="rf-back"
        onClick={() => navigate('/administration')}
      >
        <ArrowLeft size={17} />
        Administration
      </button>

      <header className="rf-head">
        <div>
          <p className="rf-eyebrow">Organisation</p>
          <h1 className="rf-title">Directions</h1>
          <p className="rf-lead">
            Consultez et gérez les directions qui composent l'organisation du MEF.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            className="rf-btn rf-btn-primary"
            onClick={openCreateForm}
          >
            <Plus size={17} />
            Nouvelle direction
          </button>
        )}
      </header>

      {success && (
        <div className="adm-notice adm-notice-success" role="status">
          <Check size={17} />
          {success}
        </div>
      )}

      {!loading && error && (
        <div className="adm-notice adm-notice-error" role="alert">
          {error}
        </div>
      )}

      <label className="rf-search adm-search">
        <Search size={17} aria-hidden="true" />
        <input
          type="search"
          placeholder="Rechercher une direction..."
          aria-label="Rechercher une direction"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      {loading && <div className="adm-state">Chargement des directions...</div>}

      {!loading && !error && filteredDirections.length === 0 && (
        <div className="adm-state">
          {search.trim()
            ? 'Aucune direction ne correspond à votre recherche.'
            : 'Aucune direction trouvée.'}
        </div>
      )}

      {!loading && !error && filteredDirections.length > 0 && (
        <div className="adm-list">
          {filteredDirections.map((direction) => {
            const count = agentCounts[String(direction.nom || '').trim().toLowerCase()];
            return (
              <article key={direction.id} className="rf-row adm-row">
                <span className="adm-row-icon"><Building2 size={22} strokeWidth={1.6} /></span>
                <div className="adm-row-body">
                  <h2>{direction.nom}</h2>
                  <p>{direction.description || 'Aucune description disponible.'}</p>
                </div>
                {count !== undefined && (
                  <span className="adm-pill">
                    <UserRound size={14} />
                    {count} {count > 1 ? 'agents' : 'agent'}
                  </span>
                )}
                {canManage && (
                <div className="adm-actions">
                  <button
                    type="button"
                    className="adm-icon-btn"
                    title="Modifier"
                    aria-label={`Modifier ${direction.nom}`}
                    onClick={() => openEditForm(direction)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="adm-icon-btn adm-icon-btn-danger"
                    title="Supprimer"
                    aria-label={`Supprimer ${direction.nom}`}
                    disabled={deletingId === direction.id}
                    onClick={() => handleDelete(direction)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {showForm && (
        <div
          className="adm-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="direction-form-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div className="adm-modal">
            <div className="adm-modal-head">
              <div>
                <p className="rf-eyebrow">Organisation</p>
                <h2 id="direction-form-title">
                  {editingDirection ? 'Modifier la direction' : 'Nouvelle direction'}
                </h2>
                <p>
                  {editingDirection
                    ? 'Modifiez les informations de la direction.'
                    : 'Ajoutez une nouvelle direction à l’organisation.'}
                </p>
              </div>
              <button
                type="button"
                className="rf-icon-btn"
                onClick={closeForm}
                disabled={saving}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {formError && <div className="adm-notice adm-notice-error" role="alert">{formError}</div>}

              <div className="rf-field adm-field">
                <label htmlFor="direction-nom">Nom de la direction</label>
                <input
                  id="direction-nom"
                  type="text"
                  name="nom"
                  value={form.nom}
                  onChange={handleChange}
                  maxLength={200}
                  placeholder="Ex. Direction des Ressources Humaines"
                  required
                  autoFocus
                />
                <small className="adm-counter">{form.nom.length}/200</small>
              </div>

              <div className="rf-field adm-field">
                <label htmlFor="direction-description">Description</label>
                <textarea
                  id="direction-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Description de la direction..."
                />
              </div>

              <div className="adm-modal-foot">
                <button type="button" className="rf-btn" onClick={closeForm} disabled={saving}>
                  Annuler
                </button>
                <button type="submit" className="rf-btn rf-btn-primary" disabled={saving}>
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

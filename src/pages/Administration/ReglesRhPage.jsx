import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  FileCog,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  createRegleRh,
  deleteRegleRh,
  getReglesRh,
  getTypesReglesRh,
  updateRegleRh,
} from '../../api/reglesRh';

const EMPTY_FORM = {
  typeRegleId: '',
  code: '',
  libelle: '',
  description: '',
  populationConcernee: '',
  referenceJuridique: '',
  article: '',
  dateDebutValidite: '',
  dateFinValidite: '',
  priorite: '',
  active: true,
};

function formatDate(value) {
  if (!value) {
    return null;
  }

  /*
   * Les dates venant de PostgreSQL peuvent être converties
   * en timestamp avec décalage horaire par l'API.
   *
   * On récupère donc uniquement la partie YYYY-MM-DD
   * lorsque c'est possible.
   */
  const text = String(value);

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    const [, year, month, day] = match;

    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString('fr-FR');
}

function toDateInputValue(value) {
  if (!value) {
    return '';
  }

  const text = String(value);

  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);

  if (match) {
    return match[1];
  }

  return '';
}

export default function ReglesRhPage() {
  const navigate = useNavigate();

  const [regles, setRegles] = useState([]);
  const [typesRegles, setTypesRegles] = useState([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingRegle, setEditingRegle] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  async function loadRegles() {
    try {
      setLoading(true);
      setError('');

      const [reglesData, typesData] = await Promise.all([
        getReglesRh(),
        getTypesReglesRh(),
      ]);

      setRegles(reglesData);
      setTypesRegles(typesData);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Impossible de charger les règles RH.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegles();
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setFormError('');
    setEditingRegle(null);
  }

  function openCreateForm() {
    setSuccess('');
    setError('');
    setFormError('');

    resetForm();
    setShowForm(true);
  }

  function openEditForm(regle) {
    setSuccess('');
    setError('');
    setFormError('');

    setEditingRegle(regle);

    setForm({
      typeRegleId: regle.type_regle_id
        ? String(regle.type_regle_id)
        : '',
      code: regle.code || '',
      libelle: regle.libelle || '',
      description: regle.description || '',
      populationConcernee:
        regle.population_concernee || '',
      referenceJuridique:
        regle.reference_juridique || '',
      article: regle.article || '',
      dateDebutValidite: toDateInputValue(
        regle.date_debut_validite
      ),
      dateFinValidite: toDateInputValue(
        regle.date_fin_validite
      ),
      priorite:
        regle.priorite !== null &&
        regle.priorite !== undefined
          ? String(regle.priorite)
          : '',
      active:
        regle.active === undefined ||
        regle.active === null
          ? true
          : Boolean(regle.active),
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
    const { name, value, type, checked } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError('');
    setSuccess('');
    setError('');

    const typeRegleId = Number(form.typeRegleId);
    const code = form.code.trim();
    const libelle = form.libelle.trim();
    const description = form.description.trim();
    const populationConcernee =
      form.populationConcernee.trim();
    const referenceJuridique =
      form.referenceJuridique.trim();
    const article = form.article.trim();

    const priorite =
      form.priorite.trim() === ''
        ? null
        : Number(form.priorite);

    if (
      !form.typeRegleId ||
      !Number.isInteger(typeRegleId) ||
      typeRegleId <= 0
    ) {
      setFormError(
        'Veuillez sélectionner un type de règle.'
      );
      return;
    }

    if (!code) {
      setFormError(
        'Le code de la règle est obligatoire.'
      );
      return;
    }

    if (code.length > 100) {
      setFormError(
        'Le code ne doit pas dépasser 100 caractères.'
      );
      return;
    }

    if (!libelle) {
      setFormError(
        'Le libellé de la règle est obligatoire.'
      );
      return;
    }

    if (libelle.length > 255) {
      setFormError(
        'Le libellé ne doit pas dépasser 255 caractères.'
      );
      return;
    }

    if (populationConcernee.length > 255) {
      setFormError(
        'La population concernée ne doit pas dépasser 255 caractères.'
      );
      return;
    }

    if (article.length > 100) {
      setFormError(
        "L'article ne doit pas dépasser 100 caractères."
      );
      return;
    }

    if (
      priorite !== null &&
      (!Number.isInteger(priorite) || priorite < 0)
    ) {
      setFormError(
        'La priorité doit être un entier supérieur ou égal à 0.'
      );
      return;
    }

    if (
      form.dateDebutValidite &&
      form.dateFinValidite &&
      form.dateFinValidite <
        form.dateDebutValidite
    ) {
      setFormError(
        'La date de fin ne peut pas être antérieure à la date de début.'
      );
      return;
    }

    const data = {
      typeRegleId,
      code,
      libelle,
      description: description || null,
      populationConcernee:
        populationConcernee || null,
      referenceJuridique:
        referenceJuridique || null,
      article: article || null,
      dateDebutValidite:
        form.dateDebutValidite || null,
      dateFinValidite:
        form.dateFinValidite || null,
      priorite,
      active: Boolean(form.active),
    };

    try {
      setSaving(true);

      if (editingRegle) {
        await updateRegleRh(
          editingRegle.id,
          data
        );

        setSuccess(
          'La règle RH a été modifiée avec succès.'
        );
      } else {
        await createRegleRh(data);

        setSuccess(
          'La règle RH a été créée avec succès.'
        );
      }

      setShowForm(false);
      resetForm();

      await loadRegles();
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

  async function handleDelete(regle) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer la règle « ${
        regle.libelle || regle.code
      } » ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(regle.id);
      setSuccess('');
      setError('');

      await deleteRegleRh(regle.id);

      setSuccess(
        'La règle RH a été supprimée avec succès.'
      );

      await loadRegles();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Impossible de supprimer cette règle RH.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredRegles = regles.filter((regle) => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return (
      regle.code
        ?.toLowerCase()
        .includes(value) ||
      regle.libelle
        ?.toLowerCase()
        .includes(value) ||
      regle.description
        ?.toLowerCase()
        .includes(value) ||
      regle.type_regle_libelle
        ?.toLowerCase()
        .includes(value) ||
      regle.reference_juridique
        ?.toLowerCase()
        .includes(value) ||
      regle.population_concernee
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

          <h1>Règles RH</h1>

          <p>
            Consultez et gérez les règles utilisées
            pour l'analyse des situations
            administratives et de carrière.
          </p>
        </div>

        <div className="administration-header-icon">
          <FileCog
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
            placeholder="Rechercher une règle..."
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
          Nouvelle règle
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
          Chargement des règles RH...
        </div>
      )}

      {!loading &&
        !error &&
        filteredRegles.length === 0 && (
          <div className="administration-state">
            {search.trim()
              ? 'Aucune règle ne correspond à votre recherche.'
              : 'Aucune règle RH trouvée.'}
          </div>
        )}

      {!loading &&
        !error &&
        filteredRegles.length > 0 && (
          <div className="administration-list">
            {filteredRegles.map((regle) => {
              const dateDebut = formatDate(
                regle.date_debut_validite
              );

              const dateFin = formatDate(
                regle.date_fin_validite
              );

              return (
                <article
                  key={regle.id}
                  className="administration-list-card"
                >
                  <div className="administration-list-icon">
                    <FileCog
                      size={20}
                      strokeWidth={1.7}
                    />
                  </div>

                  <div className="administration-list-content">
                    <h2>
                      {regle.libelle ||
                        'Règle sans libellé'}
                    </h2>

                    <p>
                      {regle.description ||
                        'Aucune description disponible.'}
                    </p>

                    <span className="administration-list-meta">
                      {regle.code}
                    </span>

                    {regle.type_regle_libelle && (
                      <span className="administration-list-meta">
                        Type : {regle.type_regle_libelle}
                      </span>
                    )}

                    {regle.population_concernee && (
                      <span className="administration-list-meta">
                        Population :{' '}
                        {regle.population_concernee}
                      </span>
                    )}

                    {regle.reference_juridique && (
                      <span className="administration-list-meta">
                        Référence :{' '}
                        {regle.reference_juridique}
                        {regle.article
                          ? ` — ${regle.article}`
                          : ''}
                      </span>
                    )}

                    {(dateDebut || dateFin) && (
                      <span className="administration-list-meta">
                        Validité :{' '}
                        {dateDebut || '—'} →{' '}
                        {dateFin || 'En cours'}
                      </span>
                    )}

                    <span
                      className="administration-list-meta"
                      style={{
                        fontWeight: 600,
                        color: regle.active
                          ? '#18794e'
                          : '#b91c1c',
                      }}
                    >
                      {regle.active
                        ? 'Active'
                        : 'Inactive'}
                    </span>
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
                        openEditForm(regle)
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
                      disabled={
                        deletingId === regle.id
                      }
                      onClick={() =>
                        handleDelete(regle)
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
                          deletingId === regle.id
                            ? 'wait'
                            : 'pointer',
                        opacity:
                          deletingId === regle.id
                            ? 0.5
                            : 1,
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <span className="administration-list-id">
                    #{regle.id}
                  </span>
                </article>
              );
            })}
          </div>
        )}

      {showForm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="regle-form-title"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
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
            background: 'rgba(15, 23, 42, 0.42)',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '700px',
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
                borderBottom:
                  '1px solid #eef0f3',
              }}
            >
              <div>
                <span className="administration-eyebrow">
                  RÉFÉRENTIEL RH
                </span>

                <h2
                  id="regle-form-title"
                  style={{
                    margin: '5px 0 0',
                    fontSize: '20px',
                    color: '#172033',
                  }}
                >
                  {editingRegle
                    ? 'Modifier la règle RH'
                    : 'Nouvelle règle RH'}
                </h2>

                <p
                  style={{
                    margin: '6px 0 0',
                    color: '#6b7280',
                    fontSize: '14px',
                  }}
                >
                  {editingRegle
                    ? 'Modifiez les informations de la règle.'
                    : 'Ajoutez une nouvelle règle au référentiel RH.'}
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

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: '16px',
                  }}
                >
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
                      Type de règle
                    </span>

                    <select
                      name="typeRegleId"
                      value={form.typeRegleId}
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
                        Sélectionner un type
                      </option>

                      {typesRegles.map((type) => (
                        <option
                          key={type.id}
                          value={type.id}
                        >
                          {type.libelle ||
                            type.code ||
                            `Type #${type.id}`}
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
                      Code
                    </span>

                    <input
                      type="text"
                      name="code"
                      value={form.code}
                      onChange={handleChange}
                      maxLength={100}
                      placeholder="Ex. AVANCEMENT_ECHELON"
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
                  </label>
                </div>

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
                    Libellé
                  </span>

                  <input
                    type="text"
                    name="libelle"
                    value={form.libelle}
                    onChange={handleChange}
                    maxLength={255}
                    placeholder="Ex. Avancement d'échelon"
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
                    {form.libelle.length}/255
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
                    placeholder="Description de la règle..."
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
                    Population concernée
                  </span>

                  <input
                    type="text"
                    name="populationConcernee"
                    value={
                      form.populationConcernee
                    }
                    onChange={handleChange}
                    maxLength={255}
                    placeholder="Ex. Fonctionnaires du corps des concepteurs"
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
                </label>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: '16px',
                  }}
                >
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
                      Référence juridique
                    </span>

                    <input
                      type="text"
                      name="referenceJuridique"
                      value={
                        form.referenceJuridique
                      }
                      onChange={handleChange}
                      placeholder="Ex. Décret n° 96-746"
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
                      Article
                    </span>

                    <input
                      type="text"
                      name="article"
                      value={form.article}
                      onChange={handleChange}
                      maxLength={100}
                      placeholder="Ex. Article 9"
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
                  </label>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr 1fr',
                    gap: '16px',
                  }}
                >
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
                      Début de validité
                    </span>

                    <input
                      type="date"
                      name="dateDebutValidite"
                      value={
                        form.dateDebutValidite
                      }
                      onChange={handleChange}
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
                      Fin de validité
                    </span>

                    <input
                      type="date"
                      name="dateFinValidite"
                      value={
                        form.dateFinValidite
                      }
                      onChange={handleChange}
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
                      Priorité
                    </span>

                    <input
                      type="number"
                      name="priorite"
                      value={form.priorite}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      placeholder="Optionnel"
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
                  </label>
                </div>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    border:
                      '1px solid #e5e7eb',
                    borderRadius: '9px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    name="active"
                    checked={form.active}
                    onChange={handleChange}
                    style={{
                      width: '16px',
                      height: '16px',
                    }}
                  />

                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#374151',
                    }}
                  >
                    Règle active
                  </span>
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
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
                    : editingRegle
                      ? 'Enregistrer les modifications'
                      : 'Créer la règle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  createGrade,
  deleteGrade,
  getGrades,
  updateGrade,
} from '../../api/grades';

const TYPE_EMPLOI = [
  {
    id: 1,
    nom: 'Fonctionnaire',
  },
  {
    id: 2,
    nom: 'Agent contractuel',
  },
  {
    id: 3,
    nom: 'Agent temporaire',
  },
  {
    id: 4,
    nom: "Personnel d'appui",
  },
];

const EMPTY_FORM = {
  codeGrade: '',
  typeEmploiId: '',
};

export default function GradesPage() {
  const navigate = useNavigate();

  const [grades, setGrades] = useState([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  async function loadGrades() {
    try {
      setLoading(true);
      setError('');

      const data = await getGrades();

      setGrades(data);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Impossible de charger les grades.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGrades();
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setFormError('');
    setEditingGrade(null);
  }

  function openCreateForm() {
    setSuccess('');
    setError('');

    resetForm();
    setShowForm(true);
  }

  function openEditForm(grade) {
    setSuccess('');
    setError('');
    setFormError('');

    setEditingGrade(grade);

    setForm({
      codeGrade: grade.code_grade || '',
      typeEmploiId: grade.type_emploi_id
        ? String(grade.type_emploi_id)
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

    const codeGrade = form.codeGrade.trim();
    const typeEmploiId = Number(form.typeEmploiId);

    if (!codeGrade) {
      setFormError(
        'Le code du grade est obligatoire.'
      );
      return;
    }

    if (codeGrade.length > 100) {
      setFormError(
        'Le code du grade ne doit pas dépasser 100 caractères.'
      );
      return;
    }

    if (
      !form.typeEmploiId ||
      !Number.isInteger(typeEmploiId) ||
      typeEmploiId <= 0
    ) {
      setFormError(
        "Veuillez sélectionner un type d'emploi."
      );
      return;
    }

    try {
      setSaving(true);

      if (editingGrade) {
        await updateGrade(editingGrade.id, {
          codeGrade,
          typeEmploiId,
        });

        setSuccess(
          'Le grade a été modifié avec succès.'
        );
      } else {
        await createGrade({
          codeGrade,
          typeEmploiId,
        });

        setSuccess(
          'Le grade a été créé avec succès.'
        );
      }

      setShowForm(false);
      resetForm();

      await loadGrades();
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

  async function handleDelete(grade) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer le grade « ${grade.code_grade} » ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(grade.id);
      setSuccess('');
      setError('');

      await deleteGrade(grade.id);

      setSuccess(
        'Le grade a été supprimé avec succès.'
      );

      await loadGrades();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Impossible de supprimer ce grade.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredGrades = grades.filter((grade) => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return (
      grade.code_grade
        ?.toLowerCase()
        .includes(value) ||
      grade.type_emploi
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

          <h1>Grades</h1>

          <p>
            Consultez et gérez les grades utilisés
            dans la gestion administrative des agents.
          </p>
        </div>

        <div className="administration-header-icon">
          <GraduationCap
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
            placeholder="Rechercher un grade..."
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
          Nouveau grade
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
          Chargement des grades...
        </div>
      )}

      {!loading &&
        !error &&
        filteredGrades.length === 0 && (
          <div className="administration-state">
            {search.trim()
              ? 'Aucun grade ne correspond à votre recherche.'
              : 'Aucun grade trouvé.'}
          </div>
        )}

      {!loading &&
        filteredGrades.length > 0 && (
          <div className="administration-list">
            {filteredGrades.map((grade) => (
              <article
                key={grade.id}
                className="administration-list-card"
              >
                <div className="administration-list-icon">
                  <GraduationCap
                    size={20}
                    strokeWidth={1.7}
                  />
                </div>

                <div className="administration-list-content">
                  <h2>
                    {grade.code_grade ||
                      'Grade sans code'}
                  </h2>

                  <p>
                    {grade.type_emploi ||
                      "Type d'emploi non renseigné."}
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
                      openEditForm(grade)
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
                      deletingId === grade.id
                    }
                    onClick={() =>
                      handleDelete(grade)
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
                        deletingId === grade.id
                          ? 'wait'
                          : 'pointer',
                      opacity:
                        deletingId === grade.id
                          ? 0.5
                          : 1,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <span className="administration-list-id">
                  #{grade.id}
                </span>
              </article>
            ))}
          </div>
        )}

      {showForm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="grade-form-title"
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
              maxWidth: '520px',
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
                  id="grade-form-title"
                  style={{
                    margin: '5px 0 0',
                    fontSize: '20px',
                    color: '#172033',
                  }}
                >
                  {editingGrade
                    ? 'Modifier le grade'
                    : 'Nouveau grade'}
                </h2>

                <p
                  style={{
                    margin: '6px 0 0',
                    color: '#6b7280',
                    fontSize: '14px',
                  }}
                >
                  {editingGrade
                    ? 'Modifiez les informations du grade.'
                    : 'Ajoutez un nouveau grade au référentiel RH.'}
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
                    Code du grade
                  </span>

                  <input
                    type="text"
                    name="codeGrade"
                    value={form.codeGrade}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="Ex. GRADE-01"
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
                    {form.codeGrade.length}/100
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
                    Type d'emploi
                  </span>

                  <select
                    name="typeEmploiId"
                    value={form.typeEmploiId}
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
                      Sélectionner un type d'emploi
                    </option>

                    {TYPE_EMPLOI.map((type) => (
                      <option
                        key={type.id}
                        value={type.id}
                      >
                        {type.nom}
                      </option>
                    ))}
                  </select>
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
                    : editingGrade
                      ? 'Enregistrer les modifications'
                      : 'Créer le grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

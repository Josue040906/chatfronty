import {
  ArrowLeft,
  FilePlus2,
  Save,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDocument } from '../../api/documents';
import { getAgents } from '../../api/agents';

const initialForm = {
  type: 'DEMANDE',
  objet: '',
  contenu: '',
  agentId: '',
  auteur: '',
  dateDocument: new Date().toISOString().slice(0, 10),
};

function getAgentName(agent) {
  return `${agent.prenom || ''} ${agent.nom || ''}`.trim();
}

export default function NewDocumentPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAgents() {
      try {
        const data = await getAgents();
        setAgents(data);
      } catch (err) {
        console.error(err);
        setError(
          'Impossible de charger la liste des agents.'
        );
      } finally {
        setLoadingAgents(false);
      }
    }

    loadAgents();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.objet.trim()) {
      setError('L’objet du document est obligatoire.');
      return;
    }

    if (!form.contenu.trim()) {
      setError('Le contenu du document est obligatoire.');
      return;
    }

    if (!form.agentId) {
      setError('Veuillez sélectionner l’agent concerné.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const createdDocument = await createDocument({
        type: form.type,
        objet: form.objet.trim(),
        contenu: form.contenu.trim(),
        agentId: Number(form.agentId),
        dossierId: null,
        auteur: form.auteur.trim() || null,
        dateDocument: form.dateDocument || null,
      });

      navigate('/documents', {
        state: {
          documentCreated: createdDocument,
        },
      });
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Impossible d’enregistrer le document.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-section document-form-page">
      <button
        type="button"
        className="page-back-button"
        onClick={() => navigate('/documents')}
      >
        <ArrowLeft size={25} />
        Retour aux documents
      </button>

      <div className="page-header">
        <div>
          <span className="page-eyebrow">
            GESTION DOCUMENTAIRE
          </span>

          <h1>Nouveau document</h1>

          <p>
            Enregistrez une demande, un courrier ou un acte
            administratif RH.
          </p>
        </div>
      </div>

      <form
        className="document-form-card"
        onSubmit={handleSubmit}
      >
        <div className="document-form-heading">
          <div className="document-coming-icon">
            <FilePlus2 size={28} />
          </div>

          <div>
            <h2>Informations du document</h2>

            <p>
              Le document sera enregistré comme brouillon.
            </p>
          </div>
        </div>

        {error && (
          <div className="documents-error">
            {error}
          </div>
        )}

        <div className="document-form-grid">
          <div className="form-field">
            <label htmlFor="type">
              Type de document
            </label>

            <select
              id="type"
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              <option value="DEMANDE">
                Demande administrative
              </option>

              <option value="COURRIER">
                Courrier
              </option>

              <option value="ACTE">
                Acte administratif
              </option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="dateDocument">
              Date du document
            </label>

            <input
              id="dateDocument"
              name="dateDocument"
              type="date"
              value={form.dateDocument}
              onChange={handleChange}
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="objet">
              Objet
            </label>

            <input
              id="objet"
              name="objet"
              type="text"
              value={form.objet}
              onChange={handleChange}
              placeholder="Ex. Demande de congé annuel"
              maxLength={255}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="agentId">
              Agent concerné
            </label>

            <select
              id="agentId"
              name="agentId"
              value={form.agentId}
              onChange={handleChange}
              disabled={loadingAgents}
              required
            >
              <option value="">
                {loadingAgents
                  ? 'Chargement des agents...'
                  : 'Sélectionner un agent'}
              </option>

              {agents.map((agent) => (
                <option
                  key={agent.id}
                  value={agent.id}
                >
                  {getAgentName(agent)} — {agent.matricule}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="auteur">
              Auteur
            </label>

            <input
              id="auteur"
              name="auteur"
              type="text"
              value={form.auteur}
              onChange={handleChange}
              placeholder="Nom de l’auteur"
              maxLength={150}
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="contenu">
              Contenu
            </label>

            <textarea
              id="contenu"
              name="contenu"
              value={form.contenu}
              onChange={handleChange}
              placeholder="Saisissez le contenu du document..."
              rows={12}
              required
            />
          </div>
        </div>

        <div className="document-form-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('/documents')}
            disabled={saving}
          >
            Annuler
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            <Save size={17} />

            {saving
              ? 'Enregistrement...'
              : 'Enregistrer le brouillon'}
          </button>
        </div>
      </form>
    </section>
  );
}

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getAgents } from '../../api/agents';
import { createDocument } from '../../api/documents';

export default function NewDocumentPage() {
  const navigate = useNavigate();

  const [agents, setAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  const [formData, setFormData] = useState({
    type: 'DEMANDE',
    objet: '',
    contenu: '',
    agentId: '',
    dossierId: null,
    auteur: '',
    dateDocument: new Date()
      .toISOString()
      .slice(0, 10),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function chargerAgents() {
      try {
        setLoadingAgents(true);
        setError('');

        const data = await getAgents();

        setAgents(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
          'Impossible de charger la liste des agents.'
        );
      } finally {
        setLoadingAgents(false);
      }
    }

    chargerAgents();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError('');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');

    if (!formData.objet.trim()) {
      setError(
        "L'objet du document est obligatoire."
      );
      return;
    }

    if (!formData.contenu.trim()) {
      setError(
        'Le contenu du document est obligatoire.'
      );
      return;
    }

    if (!formData.agentId) {
      setError(
        "L'agent concerné est obligatoire."
      );
      return;
    }

    try {
      setLoading(true);

      const documentData = {
        type: formData.type,

        objet: formData.objet.trim(),

        contenu: formData.contenu.trim(),

        agentId: Number(
          formData.agentId
        ),

        dossierId: formData.dossierId
          ? Number(formData.dossierId)
          : null,

        auteur:
          formData.auteur.trim() || null,

        dateDocument:
          formData.dateDocument || null,
      };

      const document =
        await createDocument(
          documentData
        );

      navigate('/documents', {
        state: {
          successMessage:
            `Le document ${document.reference} a été créé avec succès.`,
        },
      });
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        'Une erreur est survenue lors de la création du document.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="administration-page">
      <div className="administration-header">
        <div>
          <button
            type="button"
            className="administration-back-button"
            onClick={() =>
              navigate('/documents')
            }
          >
            <ArrowLeft size={18} />
            Retour aux documents
          </button>

          <h1>
            Nouveau document
          </h1>

          <p>
            Créez un nouveau document RH
            associé à un agent.
          </p>
        </div>
      </div>

      {error && (
        <div className="administration-state-error">
          {error}
        </div>
      )}

      <form
        className="administration-form"
        onSubmit={handleSubmit}
      >
        <div className="administration-form-group">
          <label htmlFor="type">
            Type de document
          </label>

          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="DEMANDE">
              Demande
            </option>

            <option value="COURRIER">
              Courrier
            </option>

            <option value="ACTE">
              Acte
            </option>
          </select>
        </div>

        <div className="administration-form-group">
          <label htmlFor="objet">
            Objet <span>*</span>
          </label>

          <input
            id="objet"
            name="objet"
            type="text"
            value={formData.objet}
            onChange={handleChange}
            maxLength={255}
            placeholder="Ex. Demande de congé annuel"
          />
        </div>

        <div className="administration-form-group">
          <label htmlFor="agentId">
            Agent concerné <span>*</span>
          </label>

          <select
            id="agentId"
            name="agentId"
            value={formData.agentId}
            onChange={handleChange}
            disabled={loadingAgents}
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
                {agent.matricule
                  ? `${agent.matricule} — `
                  : ''}

                {agent.prenom || ''}{' '}

                {agent.nom || ''}
              </option>
            ))}
          </select>
        </div>

        <div className="administration-form-group">
          <label htmlFor="auteur">
            Auteur
          </label>

          <input
            id="auteur"
            name="auteur"
            type="text"
            value={formData.auteur}
            onChange={handleChange}
            maxLength={150}
            placeholder="Nom de l'auteur du document"
          />
        </div>

        <div className="administration-form-group">
          <label htmlFor="dateDocument">
            Date du document
          </label>

          <input
            id="dateDocument"
            name="dateDocument"
            type="date"
            value={formData.dateDocument}
            onChange={handleChange}
          />
        </div>

        <div className="administration-form-group">
          <label htmlFor="contenu">
            Contenu <span>*</span>
          </label>

          <textarea
            id="contenu"
            name="contenu"
            value={formData.contenu}
            onChange={handleChange}
            rows={10}
            placeholder="Saisissez le contenu du document..."
          />
        </div>

        <div className="administration-form-info">
          <strong>
            Statut initial :
          </strong>{' '}
          Brouillon

          <br />

          Le document sera créé comme
          brouillon. Vous pourrez ensuite
          le modifier ou l'archiver depuis
          son espace de gestion.
        </div>

        <div className="administration-form-actions">
          <button
            type="button"
            className="administration-button-secondary"
            onClick={() =>
              navigate('/documents')
            }
            disabled={loading}
          >
            Annuler
          </button>

          <button
            type="submit"
            className="administration-button-primary"
            disabled={
              loading ||
              loadingAgents
            }
          >
            <Save size={18} />

            {loading
              ? 'Création...'
              : 'Créer le document'}
          </button>
        </div>
      </form>
    </div>
  );
}
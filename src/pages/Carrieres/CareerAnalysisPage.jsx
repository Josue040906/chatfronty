import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  History,
  Pencil,
  Plus,
  Save,
  TrendingUp,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';

import {
  getAgentById,
  updateAgentAssignment,
  updateAgentPersonalDetails,
} from '../../api/agents';
import {
  addEmployeeDiploma,
  analyserCarriere,
  confirmAvancement,
  confirmReclassement,
  getAvancementProposal,
  getDiplomaOptions,
  getEmployeeDiplomas,
  getReclassementProposal,
  getReclassementHistory,
  proposeEstablishment,
} from '../../api/carrieres';
import {
  getEmployeePhotoUrl,
  getEmployeeInitials,
} from '../../utils/employee';
import EmployeePhoto from '../../components/EmployeePhoto';
import LocaliteField from '../../components/forms/LocaliteField';
import PhoneField from '../../components/forms/PhoneField';
import VilleField from '../../components/forms/VilleField';
import { isPhoneNumberValid } from '../../utils/phone';
import { getPostesByService } from '../../api/postes';
import { getServices } from '../../api/services';

const EMPTY_PERSONAL_FORM = {
  nom: '',
  prenom: '',
  sexe: '',
  adresse: '',
  localiteResidenceId: '',
  effacerLocaliteResidence: false,
  cin: '',
  telephone: '',
  dateNaissance: '',
  lieuNaissance: '',
};

const EMPTY_DIPLOMA_FORM = {
  niveauId: '',
  domaineId: '',
  etablissementId: '',
  dateObtention: '',
  mentionId: '',
  observation: '',
};

const EMPTY_ASSIGNMENT_FORM = {
  serviceId: '',
  posteId: '',
  dateEffet: todayInputValue(),
  lieuTravail: '',
  observation: '',
};

const EMPTY_DIPLOMA_OPTIONS = {
  niveaux: [],
  domaines: [],
  etablissements: [],
  mentions: [],
};

function formatName(agent) {
  return `${agent?.prenom || ''} ${agent?.nom || ''}`.trim();
}

function formatDate(value) {
  if (!value) return '—';
  const [year, month, day] = String(value).split('T')[0].split('-');
  return year && month && day ? `${day}/${month}/${year}` : String(value);
}

function dateInputValue(value) {
  return value ? String(value).split('T')[0] : '';
}

function diplomaOptionLabel(option) {
  return option.libelle || option.nom || option.intitule || option.label || option.code || '';
}

function normalizeDiplomaOptions(options) {
  return Object.fromEntries(
    Object.keys(EMPTY_DIPLOMA_OPTIONS).map((key) => [
      key,
      Array.isArray(options?.[key]) ? options[key] : [],
    ])
  );
}

function nextDateInputValue(value) {
  const date = dateInputValue(value);
  if (!date) return '';
  const nextDay = new Date(`${date}T00:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return nextDay.toISOString().slice(0, 10);
}

function formatMonths(months) {
  if (months === null || months === undefined) return '—';
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} mois`;
  if (remainingMonths === 0) return `${years} an${years > 1 ? 's' : ''}`;
  return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
}

function todayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function emptyCareerAnalysis(employeId) {
  return {
    employeId: Number(employeId),
    situationActuelle: null,
    situationSuivante: null,
    historique: [],
    ancienneteActuelle: {},
    ancienneteRequise: {},
    eligible: null,
    eligibiliteDeterminee: false,
    evolution: { type: 'AUCUNE' },
  };
}

function personalFormFromAgent(agent) {
  return {
    nom: agent?.nom || '',
    prenom: agent?.prenom || '',
    sexe: agent?.sexe || '',
    adresse: agent?.adresse || '',
    localiteResidenceId: agent?.localite_residence_id || '',
    effacerLocaliteResidence: false,
    cin: agent?.cin || '',
    telephone: agent?.telephone || '',
    dateNaissance: dateInputValue(agent?.date_naissance),
    lieuNaissance: agent?.lieu_naissance || '',
  };
}

function hasRequiredProposalData(type, proposal) {
  if (proposal?.eligible !== true) {
    return false;
  }

  if (type === 'reclassement') {
    return Boolean(
      proposal.diplomeRetenu?.intitule
      && proposal.diplomeRetenu?.niveau
      && proposal.diplomeRetenu?.ordreAcademique != null
      && proposal.situationProposee?.categorieId != null
      && proposal.situationProposee?.corpsId != null
    );
  }

  if (type === 'avancement') {
    return Boolean(
      proposal.situationActuelle?.dateDebut
      &&
      proposal.situationActuelle?.echelonOrdre != null
      && proposal.echelonSuivant?.echelonOrdre != null
    );
  }

  return false;
}

export default function CareerAnalysisPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const canManageHr = ['SPERS_AGENT', 'SPERS_CHEF'].includes(user?.role);

  const [agent, setAgent] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [reclassementHistory, setReclassementHistory] = useState([]);
  const [reclassementHistoryError, setReclassementHistoryError] = useState('');
  const [diplomas, setDiplomas] = useState([]);
  const [diplomaOptions, setDiplomaOptions] = useState(EMPTY_DIPLOMA_OPTIONS);
  const [assignmentServices, setAssignmentServices] = useState([]);
  const [assignmentPostes, setAssignmentPostes] = useState([]);
  const [assignmentOptionsLoading, setAssignmentOptionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [diplomasLoading, setDiplomasLoading] = useState(false);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [diplomaOptionsLoading, setDiplomaOptionsLoading] = useState(false);
  const [requestingEstablishment, setRequestingEstablishment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [diplomasError, setDiplomasError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [dialog, setDialog] = useState('');
  const [personalForm, setPersonalForm] = useState(EMPTY_PERSONAL_FORM);
  const [diplomaForm, setDiplomaForm] = useState(EMPTY_DIPLOMA_FORM);
  const [assignmentForm, setAssignmentForm] = useState(EMPTY_ASSIGNMENT_FORM);
  const [establishmentRequest, setEstablishmentRequest] = useState({ nom: '', ville: '' });
  const [establishmentRequestMessage, setEstablishmentRequestMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [proposal, setProposal] = useState(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [effectDate, setEffectDate] = useState(todayInputValue);
  const savingRef = useRef(false);
  const dialogRef = useRef(null);
  const diplomaOptionsRequestRef = useRef(0);
  const assignmentPostesRequestRef = useRef(0);

  async function refreshCareerData() {
    const [agentResult, analysisResult] = await Promise.all([
      getAgentById(id),
      analyserCarriere(id).catch((analysisError) => {
        if (analysisError.status === 404) return emptyCareerAnalysis(id);
        throw analysisError;
      }),
    ]);
    setAgent(agentResult);
    setAnalysis(analysisResult);
    setHistory(Array.isArray(analysisResult?.historique)
      ? analysisResult.historique
      : []);
  }

  async function refreshDiplomas() {
    if (!canManageHr) return false;
    setDiplomasLoading(true);
    setDiplomasError('');
    try {
      setDiplomas(await getEmployeeDiplomas(id));
      return true;
    } catch (loadError) {
      setDiplomasError(loadError.message || 'Impossible de charger les diplômes.');
      return false;
    } finally {
      setDiplomasLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadCareerData() {
      setLoading(true);
      setError('');
      try {
        const [agentResult, analysisResult] = await Promise.all([
          getAgentById(id),
          analyserCarriere(id).catch((analysisError) => {
            if (analysisError.status === 404) return emptyCareerAnalysis(id);
            throw analysisError;
          }),
        ]);
        if (cancelled) return;
        setAgent(agentResult);
        setAnalysis(analysisResult);
        setHistory(Array.isArray(analysisResult?.historique)
          ? analysisResult.historique
          : []);
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) {
          setError(loadError.message || "Impossible de charger l'analyse de carrière.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCareerData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function loadDiplomas() {
      if (!canManageHr) return;
      setDiplomasLoading(true);
      setDiplomasError('');
      try {
        const result = await getEmployeeDiplomas(id);
        if (!cancelled) setDiplomas(result);
      } catch (loadError) {
        if (!cancelled) {
          setDiplomasError(loadError.message || 'Impossible de charger les diplômes.');
        }
      } finally {
        if (!cancelled) setDiplomasLoading(false);
      }
    }

    loadDiplomas();
    return () => {
      cancelled = true;
    };
  }, [canManageHr, id]);

  useEffect(() => {
    let cancelled = false;

    async function loadReclassementHistory() {
      if (!canManageHr) return;
      setReclassementHistoryError('');
      try {
        const result = await getReclassementHistory(id);
        if (!cancelled) {
          setReclassementHistory(Array.isArray(result) ? result : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setReclassementHistoryError(
            loadError.message || 'Impossible de charger l’historique des reclassements.'
          );
        }
      }
    }

    loadReclassementHistory();
    return () => {
      cancelled = true;
    };
  }, [canManageHr, id]);

  async function openAddDiploma() {
    setFeedback('');
    setFormError('');
    setDiplomaForm(EMPTY_DIPLOMA_FORM);
    setDiplomaOptions(EMPTY_DIPLOMA_OPTIONS);
    setEstablishmentRequest({ nom: '', ville: '' });
    setEstablishmentRequestMessage('');
    setDialog('diploma');
    setCatalogueLoading(true);
    const requestId = ++diplomaOptionsRequestRef.current;
    try {
      const options = await getDiplomaOptions();
      if (requestId === diplomaOptionsRequestRef.current) {
        setDiplomaOptions(normalizeDiplomaOptions(options));
      }
    } catch (loadError) {
      if (requestId === diplomaOptionsRequestRef.current) {
        setFormError(loadError.message || 'Impossible de charger le catalogue des diplômes.');
      }
    } finally {
      if (requestId === diplomaOptionsRequestRef.current) setCatalogueLoading(false);
    }
  }

  async function openAssignmentDialog() {
    setFeedback('');
    setFormError('');
    setAssignmentForm({ ...EMPTY_ASSIGNMENT_FORM, dateEffet: todayInputValue() });
    setAssignmentServices([]);
    setAssignmentPostes([]);
    setDialog('mutation');
    setAssignmentOptionsLoading(true);
    try {
      setAssignmentServices(await getServices());
    } catch (loadError) {
      setFormError(loadError.message || 'Impossible de charger les services.');
    } finally {
      setAssignmentOptionsLoading(false);
    }
  }

  async function handleAssignmentServiceChange(event) {
    const serviceId = event.target.value;
    setAssignmentForm((current) => ({ ...current, serviceId, posteId: '' }));
    setAssignmentPostes([]);
    setFormError('');
    if (!serviceId) return;

    setAssignmentOptionsLoading(true);
    const requestId = ++assignmentPostesRequestRef.current;
    try {
      const postes = await getPostesByService(serviceId);
      if (requestId === assignmentPostesRequestRef.current) {
        setAssignmentPostes(postes);
      }
    } catch (loadError) {
      if (requestId === assignmentPostesRequestRef.current) {
        setFormError(loadError.message || 'Impossible de charger les postes du service.');
      }
    } finally {
      if (requestId === assignmentPostesRequestRef.current) {
        setAssignmentOptionsLoading(false);
      }
    }
  }

  async function handleDiplomaLevelChange(event) {
    const niveauId = event.target.value;
    setDiplomaForm((current) => ({
      ...current,
      niveauId,
      domaineId: '',
      etablissementId: '',
    }));
    setDiplomaOptions((current) => ({
      ...current,
      domaines: [],
      etablissements: [],
    }));
    setFormError('');
    setDiplomaOptionsLoading(true);
    const requestId = ++diplomaOptionsRequestRef.current;
    try {
      const options = await getDiplomaOptions(niveauId ? { niveauId } : {});
      if (requestId === diplomaOptionsRequestRef.current) {
        setDiplomaOptions(normalizeDiplomaOptions(options));
      }
    } catch (loadError) {
      if (requestId === diplomaOptionsRequestRef.current) {
        setFormError(loadError.message || 'Impossible de charger les domaines du niveau.');
      }
    } finally {
      if (requestId === diplomaOptionsRequestRef.current) setDiplomaOptionsLoading(false);
    }
  }

  async function handleDiplomaDomainChange(event) {
    const domaineId = event.target.value;
    setDiplomaForm((current) => ({ ...current, domaineId, etablissementId: '' }));
    setDiplomaOptions((current) => ({ ...current, etablissements: [] }));
    setFormError('');
    setDiplomaOptionsLoading(true);
    const requestId = ++diplomaOptionsRequestRef.current;
    try {
      const options = await getDiplomaOptions({
        ...(diplomaForm.niveauId ? { niveauId: diplomaForm.niveauId } : {}),
        ...(domaineId ? { domaineId } : {}),
      });
      if (requestId === diplomaOptionsRequestRef.current) {
        setDiplomaOptions(normalizeDiplomaOptions(options));
      }
    } catch (loadError) {
      if (requestId === diplomaOptionsRequestRef.current) {
        setFormError(loadError.message || 'Impossible de charger les établissements du domaine.');
      }
    } finally {
      if (requestId === diplomaOptionsRequestRef.current) setDiplomaOptionsLoading(false);
    }
  }

  async function handleEstablishmentRequest() {
    setEstablishmentRequestMessage('');
    const nom = establishmentRequest.nom.trim();
    const ville = establishmentRequest.ville.trim();
    if (!nom || !ville) return;
    setRequestingEstablishment(true);
    try {
      await proposeEstablishment({ nom, ville });
      setEstablishmentRequest({ nom: '', ville: '' });
      setEstablishmentRequestMessage(
        'La demande a été envoyée pour validation. L’établissement ne sera disponible qu’après approbation.'
      );
    } catch (requestError) {
      setEstablishmentRequestMessage(
        requestError.message || 'Impossible de proposer cet établissement.'
      );
    } finally {
      setRequestingEstablishment(false);
    }
  }

  async function openProposal(type) {
    setFeedback('');
    setFormError('');
    setProposal(null);
    setEffectDate(todayInputValue());
    setDialog(type);
    setProposalLoading(true);
    try {
      const proposalRequest = type === 'reclassement'
        ? getReclassementProposal(id)
        : getAvancementProposal(id);
      const diplomasRequest = type === 'reclassement'
        ? getEmployeeDiplomas(id).then(
          (result) => ({ result }),
          (loadError) => ({ loadError })
        )
        : Promise.resolve(null);
      const [result, diplomasResult] = await Promise.all([
        proposalRequest,
        diplomasRequest,
      ]);
      setProposal(result);
      if (diplomasResult?.result) {
        setDiplomas(diplomasResult.result);
        setDiplomasError('');
      } else if (diplomasResult?.loadError) {
        setDiplomasError(
          diplomasResult.loadError.message
            || 'Impossible de charger les diplômes.'
        );
      }
    } catch (loadError) {
      setFormError(loadError.message || 'Impossible de calculer la proposition.');
    } finally {
      setProposalLoading(false);
    }
  }

  async function handlePersonalSave(event) {
    event.preventDefault();
    setFormError('');
    if (!personalForm.nom.trim()) {
      setFormError('Le nom est obligatoire.');
      return;
    }
    if (!isPhoneNumberValid(personalForm.telephone)) {
      setFormError(
        'Le numéro de téléphone est invalide. Vérifiez le pays, l’indicatif et le nombre de chiffres.'
      );
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await updateAgentPersonalDetails(id, user?.userId, personalForm);
      setDialog('');
      setFeedback('Les informations personnelles ont été mises à jour.');
      try {
        await refreshCareerData();
      } catch (refreshError) {
        console.error(refreshError);
        setFeedback(
          'Les informations ont été enregistrées, mais la fiche n’a pas pu être actualisée. Rechargez la page.'
        );
      }
    } catch (saveError) {
      setFormError(saveError.message || 'Impossible d’enregistrer les informations personnelles.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function handleDiplomaSave(event) {
    event.preventDefault();
    setFormError('');
    if (!diplomaForm.niveauId || !diplomaForm.domaineId
      || !diplomaForm.etablissementId || !diplomaForm.dateObtention) {
      setFormError('Le niveau, le domaine, l’établissement et la date d’obtention sont obligatoires.');
      return;
    }
    if (diplomaForm.dateObtention > todayInputValue()) {
      setFormError('La date d’obtention ne peut pas être dans le futur.');
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await addEmployeeDiploma(id, {
        niveauId: Number(diplomaForm.niveauId),
        domaineId: Number(diplomaForm.domaineId),
        etablissementId: Number(diplomaForm.etablissementId),
        dateObtention: diplomaForm.dateObtention,
        mentionId: diplomaForm.mentionId ? Number(diplomaForm.mentionId) : null,
        observation: diplomaForm.observation.trim() || null,
      });
      const diplomasRefreshed = await refreshDiplomas();
      setDialog('');
      setFeedback(diplomasRefreshed
        ? 'Le diplôme a été ajouté à l’historique sans modifier la carrière.'
        : 'Le diplôme a été enregistré, mais l’historique n’a pas pu être actualisé. Rechargez la page.');
    } catch (saveError) {
      setFormError(saveError.message || 'Impossible d’ajouter le diplôme.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function handleAssignmentSave(event) {
    event.preventDefault();
    setFormError('');
    if (!assignmentForm.serviceId || !assignmentForm.posteId || !assignmentForm.dateEffet) {
      setFormError('Le service, le poste et la date d’effet sont obligatoires.');
      return;
    }
    if (assignmentForm.dateEffet > todayInputValue()) {
      setFormError('La date d’effet ne peut pas être dans le futur.');
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const result = await updateAgentAssignment(id, {
        acteurId: user?.userId,
        serviceId: assignmentForm.serviceId,
        posteId: assignmentForm.posteId,
        dateEffet: assignmentForm.dateEffet,
        lieuTravail: assignmentForm.lieuTravail,
        observation: assignmentForm.observation,
      });
      const successMessage = result?.message || 'Affectation modifiée avec succès.';
      setDialog('');
      setFeedback(successMessage);
      try {
        await refreshCareerData();
      } catch (refreshError) {
        console.error(refreshError);
        setFeedback(`${successMessage} La fiche n’a pas pu être actualisée; rechargez la page.`);
      }
    } catch (saveError) {
      setFormError(saveError.message || 'Impossible de modifier l’affectation.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function handleCareerConfirmation(event) {
    event.preventDefault();
    setFormError('');
    if (!hasRequiredProposalData(dialog, proposal)) {
      setFormError(
        'La proposition ne contient pas toutes les informations nécessaires à sa confirmation.'
      );
      return;
    }
    if (dialog === 'avancement' && !effectDate) {
      setFormError('La date d’effet est obligatoire.');
      return;
    }
    if (dialog === 'avancement'
      && effectDate <= dateInputValue(proposal.situationActuelle.dateDebut)) {
      setFormError(
        'La date d’effet doit être postérieure au début de la situation actuelle.'
      );
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      let successMessage;
      if (dialog === 'reclassement') {
        const result = await confirmReclassement(id);
        successMessage = result?.message
          || 'Le reclassement a été enregistré.';
      } else {
        await confirmAvancement(id, effectDate);
        successMessage = 'L’avancement d’échelon a été enregistré.';
      }
      setDialog('');
      setProposal(null);
      setFeedback(successMessage);
      try {
        await Promise.all([refreshCareerData(), refreshDiplomas(), getReclassementHistory(id).then((result) => setReclassementHistory(Array.isArray(result) ? result : []))]);
      } catch (refreshError) {
        console.error(refreshError);
        setFeedback(
          `${successMessage} La fiche n’a pas pu être actualisée; rechargez la page.`
        );
      }
    } catch (saveError) {
      setFormError(saveError.message || 'Impossible d’enregistrer cette opération.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function closeDialog() {
    if (saving) return;
    setDialog('');
    setFormError('');
    setProposal(null);
  }

  function handleFieldChange(setter) {
    return (event) => {
      const { name, value } = event.target;
      setter((current) => ({ ...current, [name]: value }));
    };
  }

  useEffect(() => {
    if (!dialog) return undefined;

    const previouslyFocused = document.activeElement;
    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    const focusableElements = dialogRef.current?.querySelectorAll(focusableSelector);
    focusableElements?.[0]?.focus();

    function handleDialogKeyDown(event) {
      if (event.key === 'Escape') {
        if (!savingRef.current) {
          setDialog('');
          setFormError('');
          setProposal(null);
        }
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const currentFocusable = dialogRef.current.querySelectorAll(focusableSelector);
      const firstElement = currentFocusable[0];
      const lastElement = currentFocusable[currentFocusable.length - 1];
      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [dialog]);

  if (loading) {
    return (
      <div className="career-analysis-page">
        <div className="career-analysis-loading">Chargement de l’analyse de carrière...</div>
      </div>
    );
  }

  if (error || !agent || !analysis) {
    return (
      <div className="career-analysis-page">
        <button type="button" className="career-back-button" onClick={() => navigate(`/agents/${id}`)}>
          <ArrowLeft size={17} />
          Retour au profil
        </button>
        <div className="career-analysis-error">
          <XCircle size={24} />
          <div>
            <h1>Analyse indisponible</h1>
            <p>{error || "Les données nécessaires à l'analyse ne sont pas disponibles."}</p>
          </div>
        </div>
      </div>
    );
  }

  const situation = analysis.situationActuelle || {};
  const seniority = analysis.ancienneteActuelle || {};
  const condition = analysis.ancienneteRequise || {};
  const evolution = analysis.evolution || {};
  const nextSituation = analysis.situationSuivante;
  const agentName = formatName(agent);
  const photoUrl = getEmployeePhotoUrl(agent.photo);
  const sortedDiplomas = [...diplomas].sort((left, right) => {
    const leftDate = dateInputValue(left.date_obtention);
    const rightDate = dateInputValue(right.date_obtention);
    return rightDate.localeCompare(leftDate)
      || Number(right.id || 0) - Number(left.id || 0);
  });
  const latestDiploma = sortedDiplomas.find((item) => item.date_obtention);
  const profileDetails = [
    { label: 'Adresse', value: agent.adresse || '—' },
    { label: 'Téléphone', value: agent.telephone || '—' },
    { label: 'Date de naissance', value: formatDate(agent.date_naissance) },
    { label: 'Lieu de naissance', value: agent.lieu_naissance || '—' },
    { label: 'Date d’embauche', value: formatDate(agent.date_embauche) },
    { label: 'Service', value: agent.service || '—' },
    { label: 'Direction', value: agent.direction || '—' },
  ];

  return (
    <div className="career-analysis-page">
      <button type="button" className="career-back-button" onClick={() => navigate(`/agents/${id}`)}>
        <ArrowLeft size={17} />
        Retour au profil
      </button>

      <section className="career-analysis-hero">
        <div className="career-analysis-identity">
          <div className="career-analysis-avatar">
            {photoUrl
              ? <EmployeePhoto src={photoUrl} alt={agentName ? `Photo de ${agentName}` : "Photo de l'agent"} />
              : getEmployeeInitials(agent)}
          </div>
          <div>
            <p className="page-eyebrow">ANALYSE DE CARRIÈRE</p>
            <h1>{agentName}</h1>
            <div className="career-analysis-meta">
              <span><BriefcaseBusiness size={15} />{agent.poste || 'Poste non renseigné'}</span>
              <span><FileText size={15} />{agent.matricule || '—'}</span>
            </div>
          </div>
        </div>
        {analysis.situationActuelle ? (
          <div className="career-availability available"><CheckCircle2 size={16} />Situation disponible</div>
        ) : (
          <div className="career-availability unavailable"><XCircle size={16} />Situation indisponible</div>
        )}
      </section>

      {feedback && <div className="career-feedback success" role="status">{feedback}</div>}

      {!analysis.situationActuelle && (
        <section className="career-empty-analysis">
          <div className="career-empty-icon"><History size={24} /></div>
          <h2>Aucune situation de carrière enregistrée</h2>
          <p>Aucune situation de carrière actuelle n’est enregistrée pour cet agent.</p>
        </section>
      )}

      <section className="career-panel">
        <div className="career-panel-header career-panel-header-actions">
          <div className="career-panel-icon"><UserRound size={19} /></div>
          <div>
            <h2>Profil du collaborateur</h2>
            <p>Informations personnelles et professionnelles synchronisées depuis le backend.</p>
          </div>
          {canManageHr && (
            <button
              type="button"
              className="career-action-button secondary"
              onClick={() => {
                setPersonalForm(personalFormFromAgent(agent));
                setFormError('');
                setDialog('personal');
              }}
            >
              <Pencil size={16} />Modifier les informations personnelles
            </button>
          )}
        </div>
        <div className="career-profile-grid">
          {profileDetails.map((detail) => (
            <div key={detail.label} className="career-profile-item">
              <span>{detail.label}</span><strong>{detail.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="career-section">
        <div className="career-section-heading">
          <div><p className="page-eyebrow">SITUATION ACTUELLE</p><h2>Situation professionnelle</h2></div>
          {canManageHr && (
            <div className="career-actions">
              <button type="button" className="career-action-button secondary" onClick={() => openProposal('reclassement')}>
                <GraduationCap size={16} />Reclassement
              </button>
              <button type="button" className="career-action-button secondary" onClick={openAssignmentDialog}>
                <BriefcaseBusiness size={16} />Mutation
              </button>
              <button type="button" className="career-action-button primary" onClick={() => openProposal('avancement')}>
                <TrendingUp size={16} />Avancement d’échelon
              </button>
            </div>
          )}
        </div>
        <div className="career-current-grid">
          <div className="career-current-card"><div className="career-current-icon"><UserRound size={19} /></div><span>Catégorie</span><strong>{situation.categorieCode || agent.categorie || '—'}</strong></div>
          <div className="career-current-card"><div className="career-current-icon"><BriefcaseBusiness size={19} /></div><span>Corps</span><strong>{agent.corps_libelle || agent.corps || '—'}</strong></div>
          <div className="career-current-card"><div className="career-current-icon"><TrendingUp size={19} /></div><span>Classe</span><strong>{situation.classeLibelle || '—'}</strong></div>
          <div className="career-current-card"><div className="career-current-icon"><GraduationCap size={19} /></div><span>Échelon</span><strong>{situation.echelonOrdre ?? '—'}</strong></div>
          <div className="career-current-card"><div className="career-current-icon"><CalendarDays size={19} /></div><span>Depuis</span><strong>{formatDate(situation.dateDebut)}</strong></div>
        </div>
      </section>

      <section className="career-panel">
        <div className="career-panel-header">
          <div className="career-panel-icon"><Clock3 size={19} /></div>
          <div><h2>Ancienneté</h2><p>Calcul effectué par le backend.</p></div>
        </div>
        <div className="career-seniority-value">{formatMonths(seniority.moisTotal)}</div>
        <div className="career-seniority-details">
          <div><span>Depuis</span><strong>{formatDate(seniority.dateDebut)}</strong></div>
          <div><span>Calcul au</span><strong>{formatDate(seniority.dateCalcul)}</strong></div>
          <div><span>Condition requise</span><strong>{condition.dureeMinMois == null ? 'Non renseignée' : `${condition.dureeMinMois} mois`}</strong></div>
        </div>
        <div className={`career-condition ${analysis.eligible === true ? 'satisfied' : analysis.eligible === false ? 'not-satisfied' : 'undetermined'}`}>
          {analysis.eligible === true ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <strong>{analysis.eligible === true
            ? 'Condition d’ancienneté satisfaite'
            : analysis.eligible === false
              ? 'Condition d’ancienneté non satisfaite'
              : 'Éligibilité non déterminée'}</strong>
        </div>
      </section>

      <section className="career-panel career-next-step">
        <div className="career-panel-header">
          <div className="career-panel-icon"><TrendingUp size={19} /></div>
          <div><h2>Évolution possible</h2><p>Projection indicative; un avancement doit être confirmé séparément.</p></div>
        </div>
        {evolution.type === 'ECHELON' && nextSituation ? (
          <div className="career-next-result"><CheckCircle2 size={20} /><div><span>Évolution d’échelon</span><strong>{situation.classeLibelle} — échelon {situation.echelonOrdre} → échelon {nextSituation.echelonOrdre}</strong></div></div>
        ) : evolution.type === 'CLASSE' && nextSituation ? (
          <div className="career-next-result"><CheckCircle2 size={20} /><div><span>Évolution de classe indicative</span><strong>{situation.classeLibelle} → {nextSituation.classeLibelle}</strong><p>Cette projection ne permet pas de confirmer un avancement d’échelon.</p></div></div>
        ) : (
          <div className="career-next-result neutral"><XCircle size={20} /><div><span>Évolution identifiée</span><strong>Aucune évolution suivante identifiée.</strong></div></div>
        )}
      </section>

      {canManageHr && (
        <section className="career-panel career-history-panel">
          <div className="career-panel-header">
            <div className="career-panel-icon"><History size={19} /></div>
            <div>
              <h2>Historique des reclassements</h2>
              <p>Opérations réellement enregistrées par le backend.</p>
            </div>
          </div>
          {reclassementHistoryError ? (
            <div className="career-inline-error" role="alert">{reclassementHistoryError}</div>
          ) : reclassementHistory.length === 0 ? (
            <div className="career-history-empty">Aucun reclassement enregistré pour cet agent.</div>
          ) : (
            <div className="career-timeline">
              {reclassementHistory.map((item) => (
                <div className="career-timeline-item" key={item.id}>
                  <div className="career-timeline-marker" />
                  <div className="career-timeline-content">
                    <div className="career-timeline-top">
                      <strong>{item.categorie_avant || '—'} → {item.categorie_apres || '—'}</strong>
                      <span>{formatDate(item.date_effet)}</span>
                    </div>
                    <p>{item.activite_description || 'Reclassement enregistré'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="career-history-grid">
        <section className="career-panel career-history-panel">
          <div className="career-panel-header">
            <div className="career-panel-icon"><History size={19} /></div>
            <div><h2>Historique de carrière</h2><p>Situations enregistrées pour cet agent.</p></div>
          </div>
          {history.length === 0 ? (
            <div className="career-history-empty">Aucun historique de carrière disponible.</div>
          ) : (
            <div className="career-timeline">
              {[...history].reverse().map((item) => (
                <div className="career-timeline-item" key={item.historiqueId}>
                  <div className="career-timeline-marker" />
                  <div className="career-timeline-content">
                    <div className="career-timeline-top">
                      <strong>{item.classeLibelle || '—'} · {item.echelonOrdre ?? '—'}</strong>
                      <span>{formatDate(item.dateDebut)}</span>
                    </div>
                    {item.categorieCode && <p>Catégorie {item.categorieCode}</p>}
                    {item.dateFin && <div className="career-timeline-details"><span>Fin : {formatDate(item.dateFin)}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="career-panel career-history-panel">
          <div className="career-panel-header career-panel-header-actions">
            <div className="career-panel-icon"><GraduationCap size={19} /></div>
            <div><h2>Historique des diplômes</h2><p>Diplômes enregistrés indépendamment de la carrière.</p></div>
            {canManageHr && (
              <button type="button" className="career-action-button primary" onClick={openAddDiploma}>
                <Plus size={16} />Ajouter un diplôme
              </button>
            )}
          </div>
          {!canManageHr ? (
            <div className="career-history-empty">Consultation réservée au Service du Personnel.</div>
          ) : diplomasLoading ? (
            <div className="career-history-empty">Chargement des diplômes…</div>
          ) : diplomasError ? (
            <div className="career-inline-error" role="alert">
              <span>{diplomasError}</span>
              <button type="button" onClick={refreshDiplomas}>Réessayer</button>
            </div>
          ) : diplomas.length === 0 ? (
            <div className="career-history-empty">Aucun diplôme enregistré pour cet agent.</div>
          ) : (
            <div className="career-diploma-list">
              {sortedDiplomas.map((item) => (
                <article className="career-diploma-item" key={item.id}>
                  <div className="career-diploma-heading">
                    <strong>{item.intitule || 'Diplôme sans intitulé'}</strong>
                    <span>{formatDate(item.date_obtention)}</span>
                  </div>
                  {latestDiploma?.id === item.id && (
                    <small className="career-diploma-latest">Diplôme le plus récent par date d’obtention</small>
                  )}
                  <p>{item.niveau || 'Niveau non renseigné'} · {item.etablissement || 'Établissement non renseigné'}</p>
                  {item.mention && <small>Mention : {item.mention}</small>}
                  {item.domaine && <small>Spécialité : {item.domaine}</small>}
                  {item.observation && <small>{item.observation}</small>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {dialog && (
        <div className="career-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}>
          <section
            ref={dialogRef}
            className="career-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="career-dialog-title"
            tabIndex="-1"
          >
            <header className="career-dialog-header">
              <h2 id="career-dialog-title">{dialog === 'personal' ? 'Modifier les informations personnelles'
                : dialog === 'mutation' ? `Muter ${formatName(agent) || 'cet agent'}`
                  : dialog === 'diploma' ? 'Ajouter un diplôme'
                  : dialog === 'reclassement' ? 'Préparer le reclassement'
                    : 'Vérifier l’avancement d’échelon'}</h2>
              <button type="button" aria-label="Fermer" onClick={closeDialog}><X size={18} /></button>
            </header>

            {dialog === 'mutation' && (
              <form className="career-form" onSubmit={handleAssignmentSave}>
                <p className="career-form-note">
                  Choisissez le service et un poste qui lui appartient. Si le lieu de travail reste vide, celui de l’agent sera conservé.
                </p>
                {assignmentOptionsLoading && !assignmentServices.length
                  ? <p>Chargement des services…</p>
                  : (
                    <div className="career-form-grid">
                      <label className="wide">Service de destination
                        <select
                          required
                          value={assignmentForm.serviceId}
                          onChange={handleAssignmentServiceChange}
                          disabled={saving || assignmentOptionsLoading}
                        >
                          <option value="">Sélectionner un service</option>
                          {assignmentServices.map((service) => (
                            <option key={service.id} value={service.id}>{service.nom}</option>
                          ))}
                        </select>
                      </label>
                      <label className="wide">Poste de destination
                        <select
                          required
                          value={assignmentForm.posteId}
                          onChange={(event) => setAssignmentForm((current) => ({
                            ...current,
                            posteId: event.target.value,
                          }))}
                          disabled={saving || assignmentOptionsLoading || !assignmentForm.serviceId}
                        >
                          <option value="">
                            {assignmentForm.serviceId
                              ? assignmentOptionsLoading
                                ? 'Chargement des postes…'
                                : 'Sélectionner un poste'
                              : 'Choisissez d’abord un service'}
                          </option>
                          {assignmentPostes.map((poste) => (
                            <option key={poste.id} value={poste.id}>{poste.intitule}</option>
                          ))}
                        </select>
                      </label>
                      <label>Date d’effet
                        <input
                          type="date"
                          required
                          max={todayInputValue()}
                          value={assignmentForm.dateEffet}
                          onChange={(event) => setAssignmentForm((current) => ({
                            ...current,
                            dateEffet: event.target.value,
                          }))}
                          disabled={saving}
                        />
                      </label>
                      <label>Lieu de travail (facultatif)
                        <VilleField
                          id="career-mutation-lieu-travail"
                          value={assignmentForm.lieuTravail}
                          onChange={(event) => setAssignmentForm((current) => ({
                            ...current,
                            lieuTravail: event.target.value,
                          }))}
                          disabled={saving}
                        />
                      </label>
                      <label className="wide">Observation (facultative)
                        <textarea
                          rows="3"
                          maxLength="2000"
                          value={assignmentForm.observation}
                          onChange={(event) => setAssignmentForm((current) => ({
                            ...current,
                            observation: event.target.value,
                          }))}
                          disabled={saving}
                        />
                      </label>
                    </div>
                  )}
                {formError && <p className="career-inline-error" role="alert">{formError}</p>}
                <div className="career-dialog-actions">
                  <button type="button" className="career-action-button secondary" onClick={closeDialog} disabled={saving}>Annuler</button>
                  <button type="submit" className="career-action-button primary" disabled={saving || assignmentOptionsLoading || !assignmentServices.length}>
                    <Save size={16} />{saving ? 'Mutation…' : 'Muter l’agent'}
                  </button>
                </div>
              </form>
            )}

            {dialog === 'personal' && (
              <form className="career-form" onSubmit={handlePersonalSave}>
                <div className="career-form-grid">
                  <label>Nom<input name="nom" maxLength="100" required value={personalForm.nom} onChange={handleFieldChange(setPersonalForm)} /></label>
                  <label>Prénoms<input name="prenom" maxLength="100" value={personalForm.prenom} onChange={handleFieldChange(setPersonalForm)} /></label>
                  <label>Sexe<input name="sexe" maxLength="20" value={personalForm.sexe} onChange={handleFieldChange(setPersonalForm)} /></label>
                  <label>CIN<input name="cin" maxLength="30" value={personalForm.cin} onChange={handleFieldChange(setPersonalForm)} /></label>
                  <div className="career-form-field">
                    <label htmlFor="personal-telephone">Téléphone</label>
                    <PhoneField
                      id="personal-telephone"
                      value={personalForm.telephone}
                      onChange={(telephone) => setPersonalForm((current) => ({
                        ...current,
                        telephone,
                      }))}
                      disabled={saving}
                    />
                  </div>
                  <label>Date de naissance<input name="dateNaissance" type="date" max={todayInputValue()} value={personalForm.dateNaissance} onChange={handleFieldChange(setPersonalForm)} /></label>
                  <label className="wide">Lieu de naissance<VilleField id="career-lieu-naissance" name="lieuNaissance" value={personalForm.lieuNaissance} onChange={handleFieldChange(setPersonalForm)} disabled={saving} /></label>
                  <div className="career-form-field wide">
                    <span>Adresse</span>
                    <LocaliteField
                      selectedId={personalForm.localiteResidenceId}
                      currentAddress={personalForm.adresse}
                      onChange={(localiteResidenceId, adresse) => setPersonalForm((current) => ({
                        ...current,
                        localiteResidenceId: localiteResidenceId || '',
                        effacerLocaliteResidence: !localiteResidenceId,
                        adresse,
                      }))}
                      disabled={saving}
                    />
                  </div>
                </div>
                <p className="career-form-note">Les informations de compte, le mot de passe et les rôles ne sont pas modifiés ici.</p>
                {formError && <p className="career-inline-error" role="alert">{formError}</p>}
                <div className="career-dialog-actions">
                  <button type="button" className="career-action-button secondary" onClick={closeDialog} disabled={saving}>Annuler</button>
                  <button type="submit" className="career-action-button primary" disabled={saving}><Save size={16} />{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
                </div>
              </form>
            )}

            {dialog === 'diploma' && (
              <form className="career-form" onSubmit={handleDiplomaSave}>
                {catalogueLoading ? <p>Chargement du catalogue…</p> : (
                  <div className="career-form-grid">
                    <label className="wide">Niveau
                      <select name="niveauId" required value={diplomaForm.niveauId} onChange={handleDiplomaLevelChange}>
                        <option value="">Sélectionner un niveau</option>
                        {diplomaOptions.niveaux.map((item) => (
                          <option value={item.id} key={item.id}>{diplomaOptionLabel(item)}</option>
                        ))}
                      </select>
                    </label>
                    {!diplomaOptions.niveaux.length && (
                      <p className="wide career-form-note">Aucun niveau avec une offre active n’est disponible.</p>
                    )}
                    <label className="wide">Domaine
                      <select name="domaineId" required value={diplomaForm.domaineId} onChange={handleDiplomaDomainChange} disabled={!diplomaForm.niveauId || diplomaOptionsLoading}>
                        <option value="">Sélectionner un domaine</option>
                        {diplomaOptions.domaines.map((item) => (
                          <option value={item.id} key={item.id}>{diplomaOptionLabel(item)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="wide">Établissement de délivrance
                      <select name="etablissementId" required value={diplomaForm.etablissementId} onChange={handleFieldChange(setDiplomaForm)} disabled={!diplomaForm.domaineId || diplomaOptionsLoading}>
                        <option value="">Sélectionner un établissement</option>
                        {diplomaOptions.etablissements.map((item) => (
                          <option value={item.id} key={item.id}>{diplomaOptionLabel(item)}</option>
                        ))}
                      </select>
                    </label>
                    <label>Date d’obtention
                      <input name="dateObtention" type="date" max={todayInputValue()} required value={diplomaForm.dateObtention} onChange={handleFieldChange(setDiplomaForm)} />
                    </label>
                    <label>Mention
                      <select name="mentionId" value={diplomaForm.mentionId} onChange={handleFieldChange(setDiplomaForm)}>
                        <option value="">Aucune mention</option>
                        {diplomaOptions.mentions.map((item) => (
                          <option value={item.id} key={item.id}>{diplomaOptionLabel(item)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="wide">Observation
                      <textarea name="observation" maxLength="2000" rows="2" value={diplomaForm.observation} onChange={handleFieldChange(setDiplomaForm)} />
                    </label>
                    <div className="wide">
                      <p className="career-form-note">Établissement absent de la liste ? Soumettez-le pour validation.</p>
                      <div className="career-form-grid">
                        <label>Nom de l’établissement
                          <input value={establishmentRequest.nom} maxLength="255" onChange={(event) => setEstablishmentRequest((current) => ({ ...current, nom: event.target.value }))} />
                        </label>
                        <label>Ville
                          <VilleField
                            id="career-establishment-ville"
                            value={establishmentRequest.ville}
                            onChange={(event) => setEstablishmentRequest((current) => ({
                              ...current,
                              ville: event.target.value,
                            }))}
                            disabled={requestingEstablishment}
                          />
                        </label>
                      </div>
                      <button type="button" className="career-action-button secondary" onClick={handleEstablishmentRequest} disabled={requestingEstablishment || !establishmentRequest.nom.trim() || !establishmentRequest.ville.trim()}>
                        {requestingEstablishment ? 'Envoi…' : 'Proposer cet établissement'}
                      </button>
                      {establishmentRequestMessage && <p className="career-form-note" role="status">{establishmentRequestMessage}</p>}
                    </div>
                  </div>
                )}
                {formError && <p className="career-inline-error" role="alert">{formError}</p>}
                <p className="career-form-note">L’ajout du diplôme n’entraîne aucun reclassement automatique.</p>
                <div className="career-dialog-actions">
                  <button type="button" className="career-action-button secondary" onClick={closeDialog} disabled={saving}>Annuler</button>
                  <button type="submit" className="career-action-button primary" disabled={saving || catalogueLoading || !diplomaOptions.niveaux.length}>
                    <Save size={16} />{saving ? 'Enregistrement…' : 'Enregistrer le diplôme'}
                  </button>
                </div>
              </form>
            )}

            {(dialog === 'reclassement' || dialog === 'avancement') && (
              <form className="career-form" onSubmit={handleCareerConfirmation}>
                {proposalLoading ? <p>Vérification des données de carrière et du diplôme de référence…</p> : proposal && (
                  <>
                    {dialog === 'reclassement' ? (
                      <>
                        <div className="career-proposal-block">
                          <h3>Diplôme retenu selon l’ordre académique configuré</h3>
                          {proposal.diplomeRetenu ? (
                            <p><strong>{proposal.diplomeRetenu.intitule}</strong> · {proposal.diplomeRetenu.niveau} · ordre académique {proposal.diplomeRetenu.ordreAcademique ?? 'non renseigné'} · obtenu le {formatDate(proposal.diplomeRetenu.dateObtention)}</p>
                          ) : <p>Aucun diplôme ne peut être retenu de manière fiable.</p>}
                        </div>
                        <div className="career-proposal-block">
                          <h3>Diplôme le plus récent par date d’obtention</h3>
                          {latestDiploma ? (
                            <p><strong>{latestDiploma.intitule}</strong> · {latestDiploma.niveau || 'Niveau non renseigné'} · obtenu le {formatDate(latestDiploma.date_obtention)}</p>
                          ) : (
                            <p>{diplomasError
                              ? 'L’historique des diplômes n’a pas pu être chargé pour identifier le plus récent.'
                              : 'Aucun diplôme daté n’est disponible dans l’historique.'}</p>
                          )}
                          <p className="career-form-note">Le diplôme le plus récent n’est pas nécessairement celui retenu pour le reclassement.</p>
                        </div>
                        <div className="career-proposal-comparison">
                          <div><h3>Situation actuelle</h3><p>Catégorie {proposal.situationActuelle?.categorieCode || '—'} · {proposal.situationActuelle?.corpsLibelle || agent.corps_libelle || agent.corps || 'Corps non renseigné'}</p></div>
                          <div><h3>Situation proposée</h3><p>Catégorie {proposal.situationProposee?.categorieCode || '—'} · {proposal.situationProposee?.corpsLibelle || 'Corps inconnu'}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="career-proposal-comparison">
                          <div><h3>Échelon actuel</h3><p>{proposal.situationActuelle?.classeLibelle || '—'} · échelon {proposal.situationActuelle?.echelonOrdre ?? '—'} depuis le {formatDate(proposal.situationActuelle?.dateDebut)}</p></div>
                          <div><h3>Échelon suivant</h3><p>{proposal.echelonSuivant ? `${proposal.echelonSuivant.classeLibelle} · échelon ${proposal.echelonSuivant.echelonOrdre}` : 'Aucun échelon suivant valide dans cette classe.'}</p></div>
                        </div>
                        <p className="career-proposal-summary">Ancienneté : {formatMonths(proposal.moisEcoules)}. Condition : {proposal.dureeMinMois == null ? 'durée minimale non renseignée' : `${proposal.dureeMinMois} mois`}.</p>
                      </>
                    )}
                    <div className={`career-condition ${proposal.eligible === true || proposal.resultCode === 'ALREADY_CLASSIFIED' ? 'satisfied' : 'not-satisfied'}`}>
                      {proposal.eligible === true || proposal.resultCode === 'ALREADY_CLASSIFIED' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      <strong>{proposal.resultCode === 'ALREADY_CLASSIFIED'
                        ? 'Aucun reclassement nécessaire'
                        : proposal.eligible === true
                          ? dialog === 'reclassement'
                            ? 'Catégorie et corps déterminés par le backend'
                            : 'Conditions vérifiées par le backend'
                          : 'Confirmation bloquée'}</strong>
                    </div>
                    {proposal.eligible !== true && proposal.resultCode !== 'ALREADY_CLASSIFIED' && (
                      <ul className="career-blocking-reasons">
                        {(proposal.motifs || []).length > 0
                          ? proposal.motifs.map((reason) => <li key={reason}>{reason}</li>)
                          : <li>Le backend n’a pas confirmé l’éligibilité.</li>}
                      </ul>
                    )}
                    {proposal.eligible === true && !hasRequiredProposalData(dialog, proposal) && (
                      <p className="career-inline-error" role="alert">
                        La réponse ne contient pas toutes les informations nécessaires. La confirmation est désactivée.
                      </p>
                    )}
                    {dialog === 'avancement' && hasRequiredProposalData(dialog, proposal) && (
                      <label className="career-effect-date">Date d’effet
                        <input type="date" max={todayInputValue()} min={nextDateInputValue(proposal.situationActuelle?.dateDebut)} required value={effectDate} onChange={(event) => setEffectDate(event.target.value)} />
                      </label>
                    )}
                  </>
                )}
                {formError && <p className="career-inline-error" role="alert">{formError}</p>}
                <div className="career-dialog-actions">
                  <button type="button" className="career-action-button secondary" onClick={closeDialog} disabled={saving}>Fermer</button>
                  {hasRequiredProposalData(dialog, proposal) && (
                    <button type="submit" className="career-action-button primary" disabled={saving || proposalLoading}>
                      <CheckCircle2 size={16} />{saving ? 'Confirmation…' : 'Confirmer l’opération'}
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

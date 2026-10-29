import { useEffect, useRef, useState } from 'react';
import {
  getCommunes,
  getDistricts,
  getLocaliteDetails,
  getQuartiers,
  getRegions,
} from '../../api/localites';

function findByLevel(path, level) {
  return path.find((localite) => localite.niveau === level);
}

function formatAddress(path) {
  return path.map((localite) => localite.nom).join(' / ');
}

export default function LocaliteField({
  selectedId,
  currentAddress = '',
  onChange,
  disabled = false,
}) {
  const [initialSelectedId] = useState(selectedId);
  const onChangeRef = useRef(onChange);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [quartiers, setQuartiers] = useState([]);
  const [selection, setSelection] = useState({
    regionId: '',
    districtId: '',
    communeId: '',
    quartierId: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;

    async function loadLocalites() {
      try {
        const [regionData, detail] = await Promise.all([
          getRegions(),
          initialSelectedId
            ? getLocaliteDetails(initialSelectedId)
            : Promise.resolve(null),
        ]);

        if (cancelled) return;
        setRegions(regionData);

        if (!detail) return;

        const path = detail.cheminAdministratif;
        const region = findByLevel(path, 'REGION');
        const district = findByLevel(path, 'DISTRICT');
        const commune = findByLevel(path, 'COMMUNE');
        const quartier = findByLevel(path, 'FOKONTANY');

        if (!region || !district || !commune) {
          throw new Error(
            'Le chemin administratif de cette adresse est incomplet.'
          );
        }

        const [districtData, communeData, quartierData] = await Promise.all([
          getDistricts(region.id),
          getCommunes(district.id),
          getQuartiers(commune.id),
        ]);

        if (cancelled) return;
        setDistricts(districtData);
        setCommunes(communeData);
        setQuartiers(quartierData);
        setSelection({
          regionId: String(region.id),
          districtId: String(district.id),
          communeId: String(commune.id),
          quartierId: quartier ? String(quartier.id) : '',
        });
        onChangeRef.current(detail.localite.id, formatAddress(path));
      } catch (loadError) {
        console.error('Impossible de charger les localités.', loadError);

        if (!cancelled) {
          setError(
            loadError?.message ||
              'Impossible de charger les régions, districts et quartiers.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLocalites();

    return () => {
      cancelled = true;
    };
  }, [initialSelectedId]);

  async function loadChildren(loader, id, setItems) {
    setLoading(true);
    setError('');

    try {
      const items = await loader(id);
      setItems(items);
    } catch (loadError) {
      console.error('Impossible de charger les localités.', loadError);
      setError(
        loadError?.message ||
          'Impossible de charger les localités correspondantes.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleRegionChange(event) {
    const regionId = event.target.value;
    setSelection({
      regionId,
      districtId: '',
      communeId: '',
      quartierId: '',
    });
    setDistricts([]);
    setCommunes([]);
    setQuartiers([]);
    onChangeRef.current(null, '');

    if (regionId) {
      loadChildren(getDistricts, regionId, setDistricts);
    }
  }

  function handleDistrictChange(event) {
    const districtId = event.target.value;
    setSelection((current) => ({
      ...current,
      districtId,
      communeId: '',
      quartierId: '',
    }));
    setCommunes([]);
    setQuartiers([]);
    onChangeRef.current(null, '');

    if (districtId) {
      loadChildren(getCommunes, districtId, setCommunes);
    }
  }

  function handleCommuneChange(event) {
    const communeId = event.target.value;
    setSelection((current) => ({
      ...current,
      communeId,
      quartierId: '',
    }));
    setQuartiers([]);

    const commune = communes.find(
      (localite) => String(localite.id) === communeId
    );
    const path = [selection.regionId, selection.districtId, communeId]
      .map((id, index) => {
        const options = [regions, districts, communes][index];
        return options.find((localite) => String(localite.id) === id);
      })
      .filter(Boolean);
    onChangeRef.current(commune?.id || null, formatAddress(path));

    if (communeId) {
      loadChildren(getQuartiers, communeId, setQuartiers);
    }
  }

  function handleQuartierChange(event) {
    const quartierId = event.target.value;
    setSelection((current) => ({ ...current, quartierId }));

    const path = [selection.regionId, selection.districtId, selection.communeId]
      .map((id, index) => {
        const options = [regions, districts, communes][index];
        return options.find((localite) => String(localite.id) === id);
      })
      .filter(Boolean);
    const quartier = quartiers.find(
      (localite) => String(localite.id) === quartierId
    );

    if (quartier) path.push(quartier);
    onChangeRef.current(
      quartier?.id || Number(selection.communeId),
      formatAddress(path)
    );
  }

  const fieldDisabled = disabled || loading;

  return (
    <div className="localite-field">
      <div className="localite-field-grid">
        <select
          aria-label="Région de résidence"
          value={selection.regionId}
          onChange={handleRegionChange}
          disabled={fieldDisabled}
        >
          <option value="">Sélectionner une région</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.nom}
            </option>
          ))}
        </select>

        <select
          aria-label="District de résidence"
          value={selection.districtId}
          onChange={handleDistrictChange}
          disabled={fieldDisabled || !selection.regionId}
        >
          <option value="">Sélectionner un district</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.nom}
            </option>
          ))}
        </select>

        <select
          aria-label="Commune de résidence"
          value={selection.communeId}
          onChange={handleCommuneChange}
          disabled={fieldDisabled || !selection.districtId}
        >
          <option value="">Sélectionner une commune</option>
          {communes.map((commune) => (
            <option key={commune.id} value={commune.id}>
              {commune.nom}
            </option>
          ))}
        </select>

        <select
          aria-label="Quartier ou fokontany de résidence"
          value={selection.quartierId}
          onChange={handleQuartierChange}
          disabled={fieldDisabled || !selection.communeId}
        >
          <option value="">Commune uniquement</option>
          {quartiers.map((quartier) => (
            <option key={quartier.id} value={quartier.id}>
              {quartier.nom}
            </option>
          ))}
        </select>
      </div>
      <p className="localite-field-hint">
        {loading
          ? 'Chargement des localités…'
          : 'Choisissez une commune, puis un quartier/fokontany si disponible.'}
      </p>
      {!initialSelectedId && currentAddress && !selection.regionId && (
        <p className="localite-field-hint">
          L’adresse actuelle (« {currentAddress} ») n’est pas liée au
          référentiel; elle sera conservée tant qu’aucune localité n’est
          sélectionnée.
        </p>
      )}
      {error && (
        <p className="localite-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

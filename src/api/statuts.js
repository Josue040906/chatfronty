import { apiGet } from './client';

function normalizeResponse(response) {
if (Array.isArray(response)) {
return response;
}

if (response?.value && Array.isArray(response.value)) {
return response.value;
}

return [];
}

export async function getStatuts() {
const response = await apiGet('/api/statuts');
return normalizeResponse(response);
}

export async function getStatutById(id) {
return apiGet(`/api/statuts/${id}`);
}

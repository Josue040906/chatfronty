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

export async function getReglesRhActives() {
const response = await apiGet('/api/regles-rh/actives');
return normalizeResponse(response);
}

export async function getRegleRhByCode(code) {
return apiGet(`/api/regles-rh/${encodeURIComponent(code)}`);
}

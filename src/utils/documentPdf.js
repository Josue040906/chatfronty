// Types de demande dont le serveur sait produire le PDF (un modèle par type).
// Seule liste du front : la page Documents et le nouveau document la partagent.
const PDF_TYPE_CODES = ['CONGE', 'AVANCEMENT', 'MUTATION'];

export function canOpenPdf(type) {
  return PDF_TYPE_CODES.includes(type?.code);
}

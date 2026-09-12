import React, { useState } from 'react';
import { UploadCloud, FileCheck, Table } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExcelImporter() {
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const bstr = event.target.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const workSheetName = workbook.SheetNames[0];
      const workSheet = workbook.Sheets[workSheetName];
      const parsedData = XLSX.utils.sheet_to_json(workSheet, { header: 1 });
      setData(parsedData);
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div style={styles.container}>
      <h2>Module d'Importation Rapide Excel</h2>
      <p style={{ color: '#64748b' }}>Glissez-déposez un fichier d'entreprise (.xlsx, .xls) pour prévisualiser les données RH.</p>

      <div style={styles.dropZone}>
        <UploadCloud size={48} color="#6366f1" />
        <p>Sélectionnez ou glissez un fichier Excel ici</p>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={styles.fileInput} />
      </div>

      {fileName && (
        <div style={styles.fileInfo}>
          <FileCheck color="#22c55e" size={20} />
          <span>Fichier chargé : <strong>{fileName}</strong></span>
        </div>
      )}

      {data.length > 0 && (
        <div style={styles.previewContainer}>
          <div style={styles.tableHeader}>
            <Table size={18} />
            <span>Aperçu des 5 premières lignes</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <tbody>
                {data.slice(0, 6).map((row, rowIndex) => (
                  <tr key={rowIndex} style={rowIndex === 0 ? styles.headerRow : styles.row}>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} style={styles.cell}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { flex: 1, padding: '30px', backgroundColor: '#f8fafc', overflowY: 'auto' },
  dropZone: { border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px', textAlign: 'center', backgroundColor: '#fff', position: 'relative', cursor: 'pointer', marginTop: '20px' },
  fileInput: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' },
  fileInfo: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534' },
  previewContainer: { marginTop: '24px', backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  tableHeader: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '12px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  headerRow: { backgroundColor: '#f1f5f9', fontWeight: 'bold' },
  row: { borderBottom: '1px solid #e2e8f0' },
  cell: { padding: '8px 12px', fontSize: '13px', textAlign: 'left' }
};
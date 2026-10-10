import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Download, FileText, X } from 'lucide-react';
import { api } from '../services/api';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    totalProcessed: number;
    imported: number;
    autoCategorized: number;
    skipped: number;
    totalSpent: number;
    durationMs: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const res = await api.uploadCSV(file);
      setResult(res);
      onImportComplete();
    } catch (err: any) {
      setError(err.message || 'Import failed. Check CSV headers.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = 
`Date,Merchant,Amount,Category,Description
2026-10-01,Swiggy,540,,Dinner order with friends
2026-10-01,Uber India,280,,Ride to Tech Park
2026-10-02,Zomato,720,,Biryani lunch
2026-10-02,Starbucks Coffee,410,,Vanilla latte
2026-10-02,Blinkit Instant,950,,Groceries and household items
2026-10-03,Amazon India,2499,,Wireless mechanical keyboard
2026-10-03,Netflix India,649,,Premium subscription
2026-10-03,Shell Petrol Station,1800,,Vehicle fuel refill
2026-10-03,Apollo Pharmacy,560,,Medicines and supplements
2026-10-03,Electricity Utility,3400,,Monthly electricity bill`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_bank_statement.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Import Bank Statement (CSV)</h3>
            <p className="text-xs text-slate-400">Transactions are streamed and auto-categorized via Rules Engine</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 mb-4 text-xs text-slate-300">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-200">Supported Columns:</span>
            <button
              onClick={handleDownloadSample}
              className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 underline text-[11px]"
            >
              <Download className="h-3 w-3" />
              <span>Download Sample CSV</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Date, Merchant (or Payee/Narration), Amount (or Debit), Category (optional)
          </p>
        </div>

        {/* Upload Drop Area */}
        <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 text-center transition bg-slate-800/30 mb-4">
          <input
            type="file"
            accept=".csv,text/csv"
            id="csv-file-input"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer block">
            <FileText className="h-8 w-8 text-indigo-400 mx-auto mb-2 opacity-80" />
            <span className="text-xs font-semibold text-slate-200 block">
              {file ? file.name : 'Choose a CSV file or drag here'}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Standard bank exports (.csv)'}
            </span>
          </label>
        </div>

        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center space-x-2 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-200">
            <div className="flex items-center space-x-2 font-semibold text-emerald-300 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Successfully Imported!</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px] text-slate-300">
              <div>Imported: <strong className="text-white">{result.imported}</strong></div>
              <div>Auto-Categorized: <strong className="text-emerald-400">{result.autoCategorized}</strong></div>
              <div>Total Spent: <strong className="text-white">₹{result.totalSpent.toLocaleString()}</strong></div>
              <div>Time Taken: <strong className="text-indigo-300">{result.durationMs}ms</strong></div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
          >
            {result ? 'Done' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white transition shadow-md shadow-indigo-600/20"
            >
              {uploading ? 'Processing Stream...' : 'Import & Auto-Categorize'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import toast from 'react-hot-toast';
import { submitCertificateRequest } from '../../api/sellerProfiles.api';

export default function CertificateRequestModal({ isOpen, onClose, sellerUserId }) {
  const [certificateName, setCertificateName] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!certificateName.trim() || !issuingAuthority.trim()) {
      toast.error('Certificate name and issuing authority are required.');
      return;
    }
    if (!issueDate) {
      toast.error('Issue date is required.');
      return;
    }
    if (!file) {
      toast.error('Please upload a certificate file (PDF or image).');
      return;
    }
    const fd = new FormData();
    fd.append('certificateName', certificateName.trim());
    fd.append('issuingAuthority', issuingAuthority.trim());
    fd.append('issueDate', issueDate);
    if (expiryDate) fd.append('expiryDate', expiryDate);
    if (notes.trim()) fd.append('notes', notes.trim());
    fd.append('certificateFile', file);
    setLoading(true);
    try {
      await submitCertificateRequest(sellerUserId, fd);
      toast.success(
        'Your certificate request has been submitted. The admin will review it within 24-48 hours.',
        { duration: 5000 },
      );
      onClose();
      setCertificateName('');
      setIssuingAuthority('');
      setIssueDate('');
      setExpiryDate('');
      setNotes('');
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Add new certificate</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Certificate name *</label>
            <input
              required
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
              placeholder="e.g. ISO 9001:2015"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Issuing authority *</label>
            <input
              required
              value={issuingAuthority}
              onChange={(e) => setIssuingAuthority(e.target.value)}
              placeholder="e.g. Rwanda Standards Board"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Issue date *</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expiry date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Certificate file (PDF or image) *</label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

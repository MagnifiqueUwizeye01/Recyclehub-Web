import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { createReport } from '../../api/reports.api';

const REPORT_REASONS = [
  'Suspicious or fraudulent activity',
  'Fake or misleading product listings',
  'Harassment or abusive messages',
  'Spam or unsolicited messages',
  'Selling prohibited materials',
  'Identity fraud or impersonation',
  'Other (describe below)',
];

export default function ReportModal({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  context = 'chat',
}) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason(REPORT_REASONS[0]);
      setDetails('');
    }
  }, [isOpen]);

  if (!isOpen || !reportedUserId) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const needsDetails = reason.includes('Other');
    if (needsDetails && !details.trim()) {
      toast.error('Please describe the issue.');
      return;
    }
    setSubmitting(true);
    try {
      await createReport({
        reportedUserId,
        reason,
        details: details.trim() || null,
        context,
      });
      toast.success(
        'Thank you for your report. Our team will review it within 24 hours. The reported user will not be notified that you submitted this report.',
        { duration: 4000 },
      );
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Report {reportedUserName || 'user'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-gray-700 mb-2">Reason</legend>
            {REPORT_REASONS.map((r) => (
              <label key={r} className="flex items-start gap-2 text-sm text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="reason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="mt-1"
                />
                <span>{r}</span>
              </label>
            ))}
          </fieldset>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Details</label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional details that would help our team investigate..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Submit report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

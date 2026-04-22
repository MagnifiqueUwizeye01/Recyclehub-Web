import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const PRESET_MESSAGES = [
  {
    label: 'Account warning',
    text: "Dear user, your account has received a warning due to a violation of RecycleHub's terms of service. Please review our community guidelines. Further violations may result in account suspension.",
  },
  {
    label: 'Seller verification rejected',
    text: 'Dear seller, your verification request has been reviewed and unfortunately could not be approved at this time due to insufficient or unverifiable documentation. Please re-submit with clear, valid documents.',
  },
  {
    label: 'Certificate update rejected',
    text: 'Dear seller, your request to add a new certificate to your profile has been rejected. The submitted document could not be verified. Please ensure your certificate is valid and clearly legible before resubmitting.',
  },
  {
    label: 'Listing removed',
    text: 'Dear seller, one of your material listings has been removed from the marketplace as it did not comply with our listing guidelines. Please review the guidelines and resubmit a compliant listing.',
  },
  {
    label: 'Account suspended',
    text: "Dear user, your account has been suspended due to repeated violations of RecycleHub's terms of service. If you believe this is an error, please contact our support team.",
  },
  {
    label: 'Account reactivated',
    text: 'Dear user, your account has been reviewed and successfully reactivated. You may now log in and continue using RecycleHub. Thank you for your patience.',
  },
];

export default function AdminMessageModal({
  isOpen,
  onClose,
  targetUser,
  onSend,
  initialText = '',
  presetKey = null,
}) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (initialText) setMessage(initialText);
    else if (presetKey) {
      const p = PRESET_MESSAGES.find((x) => x.label === presetKey);
      setMessage(p?.text ?? '');
    } else setMessage('');
  }, [isOpen, initialText, presetKey]);

  if (!isOpen) return null;

  const handleSend = async () => {
    const t = message.trim();
    if (!t) {
      toast.error('Please enter a message.');
      return;
    }
    try {
      await onSend(t);
      toast.success('Message sent.');
      onClose();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'Failed to send message.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Send message to {targetUser?.name || 'user'}
          </h2>
          {targetUser?.email && (
            <p className="text-xs text-gray-500 mt-1">{targetUser.email}</p>
          )}
        </div>
        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Quick responses</p>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {PRESET_MESSAGES.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setMessage(p.text)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs border border-gray-200 bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here, or select a quick response above..."
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}

export { PRESET_MESSAGES };

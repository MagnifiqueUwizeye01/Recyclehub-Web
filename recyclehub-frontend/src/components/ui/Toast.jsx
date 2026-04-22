// Toast is handled via react-hot-toast
// This component provides a helper wrapper
import toast from 'react-hot-toast';

export const showToast = {
  success: (msg) => toast.success(msg),
  error: (msg) => toast.error(msg),
  loading: (msg) => toast.loading(msg),
  dismiss: (id) => toast.dismiss(id),
};

export default showToast;

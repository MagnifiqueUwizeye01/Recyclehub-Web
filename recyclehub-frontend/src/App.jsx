import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { MessageProvider } from './context/MessageContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <MessageProvider>
              <AppRouter />
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#ffffff',
                    color: '#111827',
                    border: '1px solid #e5e7eb',
                    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                    boxShadow: '0 10px 25px rgba(16,185,129,0.12)',
                  },
                  success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
                  error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
                }}
              />
            </MessageProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

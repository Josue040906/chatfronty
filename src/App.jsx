import { BrowserRouter } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AppRouter from './app/router/AppRouter';

export default function App() {
  const {
    user,
    loading,
    login,
    logout,
  } = useAuth();

  return (
    <BrowserRouter>
      <AppRouter
        user={user}
        loading={loading}
        login={login}
        logout={logout}
      />
    </BrowserRouter>
  );
}
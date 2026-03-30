import { RouterProvider } from 'react-router';
import { router } from './routes.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

export default function App() {
  return (
    <div className="dark">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </div>
  );
}

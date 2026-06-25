// ============================================================
// features/auth — API publique
//
// Authentification admin : formulaire de connexion, session par cookie
// « se souvenir de moi », et le ProtectedRoute qui protège les pages
// /admin/*.
// ============================================================
export { useLogin } from './api/useLogin';
export { useLogout } from './api/useLogout';
export { useMe } from './api/useMe';
export { useForgotPassword } from './api/useForgotPassword';
export { useResetPassword } from './api/useResetPassword';
export { loginSchema } from './schemas/login.schema';
export { forgotPasswordSchema } from './schemas/forgotPassword.schema';
export { resetPasswordSchema } from './schemas/resetPassword.schema';

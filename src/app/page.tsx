// src/app/page.tsx
import { redirect } from 'next/navigation';

// Este componente agora é responsável por redirecionar o usuário
// para a página de login ao acessar a rota raiz ('/').
export default function RootPage() {
  // Redireciona o usuário para a rota /login
  // Isso é um redirecionamento de nível de servidor/compilação, sendo muito rápido.
  redirect('/login');
}
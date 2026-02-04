import React, { useState } from 'react';
import { X, Mail, Lock } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { error: showError, success } = useToast();

  if (!isOpen) return null;

  // Enhanced email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim().toLowerCase();
    
    // Check basic format
    if (!emailRegex.test(trimmedEmail)) {
      return false;
    }
    
    // Check for common domain patterns
    const domain = trimmedEmail.split('@')[1];
    
    // Reject domains that start with numbers only (like 601garagem.com)
    // as they are often invalid or test domains
    if (/^\d+/.test(domain)) {
      return false;
    }
    
    // Check for valid TLD (at least 2 characters)
    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    // Validate email before sending to Supabase
    if (!isValidEmail(trimmedEmail)) {
      showError(
        'Email inválido', 
        'Use um email de um provedor conhecido como Gmail, Outlook, etc.'
      );
      setLoading(false);
      return;
    }

    try {
      const { error } = await signIn(trimmedEmail, password);

      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('email_address_invalid')) {
          showError(
            'Email inválido', 
            'Este endereço de email não é válido. Tente usar um email de um provedor conhecido.'
          );
        } else if (error.message.includes('Invalid login credentials')) {
          showError(
            'Credenciais inválidas', 
            'Email ou senha incorretos. Verifique suas credenciais.'
          );
        } else {
          showError('Erro de autenticação', error.message);
        }
      } else {
        success('Login realizado', 'Bem-vindo ao sistema!');
        onClose();
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      showError('Erro inesperado', err.message || 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Login da Oficina
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="exemplo@gmail.com"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Use um email de um provedor conhecido (Gmail, Outlook, Yahoo, etc.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Sua senha"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-blue-400 font-medium mb-1">
                Acesso Restrito
              </p>
              <p className="text-xs text-gray-300">
                Contas são criadas via Supabase. Entre em contato com o administrador para obter acesso.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AuthModal;
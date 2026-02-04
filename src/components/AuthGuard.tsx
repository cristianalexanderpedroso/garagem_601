import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './AuthModal';
import Card from './Card';
import Button from './Button';
import { User, LogOut, Search, Car, ExternalLink } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400">Carregando...</div>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="p-4 bg-red-500 bg-opacity-20 rounded-full inline-block">
                <Car className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Garagem 601
            </h2>
            <p className="text-gray-400 mb-6">
              Sistema de gestão automotiva
            </p>

            {/* Botão de Consulta Pública em destaque */}
            <div className="space-y-4">
              <Button
                onClick={() => window.open('https://garagem601.com.br/consulta', '_blank')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                icon={Search}
              >
                <div className="flex items-center justify-between w-full">
                  <span>Consulta Pública</span>
                  <ExternalLink className="h-4 w-4" />
                </div>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#2e2e2e] text-gray-400">ou</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Login para Oficina
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Acesso restrito para funcionários da oficina
                </p>
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full"
                  icon={User}
                >
                  Entrar no Sistema
                </Button>
              </div>
            </div>

            {/* Informações sobre consulta pública */}
            <div className="mt-6 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-lg">
              <div className="flex items-start">
                <Search className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <h4 className="text-sm font-medium text-blue-400 mb-1">Consulta Pública</h4>
                  <p className="text-xs text-gray-300">
                    Clientes podem consultar o status dos seus veículos usando apenas a placa, sem necessidade de login.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  return (
    <div>
      {/* User info bar */}
      <div className="bg-[#1a1a1a] border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500 bg-opacity-20 rounded-full">
              <User className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user.email}</p>
              <p className="text-xs text-gray-400">Usuário autenticado</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://garagem601.com.br/consulta"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Consulta Pública</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={() => signOut()}
              className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Sair</span>
            </button>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
};

export default AuthGuard;
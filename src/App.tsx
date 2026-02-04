import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import ToastContainer from './components/ToastContainer';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Veiculos from './pages/Veiculos';
import Orcamentos from './pages/Orcamentos';
import Laudos from './pages/Laudos';
import Estoque from './pages/Estoque';
import Servicos from './pages/Servicos';
import Historico from './pages/Historico';
import Calendario from './pages/Calendario';
import Configuracoes from './pages/Configuracoes';
import ConsultaPublica from './pages/ConsultaPublica';
import { useToast } from './hooks/useToast';

function App() {
  const { toasts, removeToast } = useToast();

  return (
    <Router>
      <Routes>
        {/* Rota pública para consulta - SEMPRE acessível sem autenticação */}
        <Route path="/consulta" element={<ConsultaPublica />} />
        
        {/* Rotas protegidas para a oficina */}
        <Route path="/" element={
          <AuthGuard>
            <Layout>
              <Dashboard />
            </Layout>
          </AuthGuard>
        } />
        
        <Route path="/clientes" element={
          <AuthGuard>
            <Layout>
              <Clientes />
            </Layout>
          </AuthGuard>
        } />
        
        <Route path="/veiculos" element={
          <AuthGuard>
            <Layout>
              <Veiculos />
            </Layout>
          </AuthGuard>
        } />
        
        <Route path="/orcamentos" element={
          <AuthGuard>
            <Layout>
              <Orcamentos />
            </Layout>
          </AuthGuard>
        } />
        
        <Route path="/laudos" element={
          <AuthGuard>
            <Layout>
              <Laudos />
            </Layout>
          </AuthGuard>
        } />
        
        <Route path="/estoque" element={
          <AuthGuard>
            <Layout>
              <Estoque />
            </Layout>
          </AuthGuard>
        } />
        
        <Route path="/servicos" element={
          <AuthGuard>
            <Layout>
              <Servicos />
            </Layout>
          </AuthGuard>
        } />
        
        <Route path="/historico" element={
          <AuthGuard>
            <Layout>
              <Historico />
            </Layout>
          </AuthGuard>
        } />
        
        <Route path="/calendario" element={
          <AuthGuard>
            <Layout>
              <Calendario />
            </Layout>
          </AuthGuard>
        } />
        
        <Route path="/configuracoes" element={
          <AuthGuard>
            <Layout>
              <Configuracoes />
            </Layout>
          </AuthGuard>
        } />
      </Routes>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </Router>
  );
}

export default App;
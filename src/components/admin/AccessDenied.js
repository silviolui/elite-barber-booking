import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';

const AccessDenied = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Shield size={48} className="text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Acesso Negado
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Este email não possui permissões administrativas. 
          Apenas administradores autorizados podem acessar esta área.
        </p>
        
        <div className="space-y-4">
          <a
            href="/"
            className="inline-flex items-center justify-center w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Voltar para área do cliente
          </a>
          
          <p className="text-sm text-gray-500">
            Se você deveria ter acesso administrativo, entre em contato com o responsável do sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;

import React, { useState } from 'react';
import { Camera, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

const PhotoUpload = ({ currentPhotoUrl, onPhotoChange, profissionalNome }) => {
  const { showError, showWarning } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentPhotoUrl);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      showWarning('Por favor, selecione apenas imagens (JPG, PNG, etc.)');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showWarning('Imagem muito grande. Máximo 5MB.');
      return;
    }

    setUploading(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `profissionais/${fileName}`;

      // Upload para Supabase Storage
      const { error } = await supabase.storage
        .from('profissionais-fotos')
        .upload(filePath, file);

      if (error) {
        console.error('Erro no upload:', error);
        
        // Se bucket não existe ou políticas RLS, mostrar instruções
        if (error.message.includes('Bucket not found') || error.message.includes('StorageApiError')) {
          showError('Configure o Storage: Execute o SQL "fix-storage-policies.sql" ou crie o bucket "profissionais-fotos" manualmente no Supabase Dashboard');
        } else {
          showError(`Erro ao fazer upload: ${error.message}`);
        }
        return;
      }

      // Obter URL pública da foto
      const { data: { publicUrl } } = supabase.storage
        .from('profissionais-fotos')
        .getPublicUrl(filePath);

      // Atualizar preview e notificar componente pai
      setPreview(publicUrl);
      onPhotoChange(publicUrl);

    } catch (error) {
      console.error('Erro no upload:', error);
      showError('Erro ao fazer upload da foto.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setPreview('');
    onPhotoChange('');
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Foto do Profissional
      </label>
      
      {preview ? (
        // Mostrar apenas a foto quando há preview
        <div className="space-y-3">
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="w-24 h-24 rounded-lg object-cover border border-gray-200"
            />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X size={14} />
            </button>
          </div>
          
          <div className="flex items-center text-sm text-green-600">
            <Check size={16} className="mr-1" />
            Foto carregada com sucesso
          </div>
        </div>
      ) : (
        // Mostrar área de upload apenas quando não há foto
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id={`photo-upload-${profissionalNome}`}
          />
          
          <label
            htmlFor={`photo-upload-${profissionalNome}`}
            className={`cursor-pointer flex flex-col items-center ${uploading ? 'opacity-50' : ''}`}
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-3"></div>
            ) : (
              <Camera size={32} className="text-gray-400 mb-3" />
            )}
            
            <p className="text-sm font-medium text-gray-700 mb-1">
              {uploading ? 'Fazendo upload...' : 'Clique para escolher foto'}
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG até 5MB
            </p>
          </label>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;

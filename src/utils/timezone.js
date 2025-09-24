// Utilitário para gerenciar datas no fuso horário de Brasília (America/Sao_Paulo)

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Obtém a data/hora atual no fuso horário de Brasília
 * @returns {Date} Data atual no fuso horário de Brasília
 */
export const getBrazilDate = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: BRAZIL_TIMEZONE }));
};

/**
 * Converte uma data para o fuso horário de Brasília
 * @param {Date|string} date - Data a ser convertida
 * @returns {Date} Data convertida para o fuso horário de Brasília
 */
export const toBrazilDate = (date) => {
  const inputDate = date instanceof Date ? date : new Date(date);
  return new Date(inputDate.toLocaleString("en-US", { timeZone: BRAZIL_TIMEZONE }));
};

/**
 * Formata uma data para string no formato brasileiro (dd/MM/yyyy)
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data formatada em português brasileiro
 */
export const formatDateBR = (date) => {
  const brazilDate = toBrazilDate(date);
  return brazilDate.toLocaleDateString('pt-BR');
};

/**
 * Formata uma hora para string no formato brasileiro (HH:MM)
 * @param {Date|string} date - Data/hora a ser formatada
 * @returns {string} Hora formatada em português brasileiro
 */
export const formatTimeBR = (date) => {
  const brazilDate = toBrazilDate(date);
  return brazilDate.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: BRAZIL_TIMEZONE
  });
};

/**
 * Formata data e hora para string no formato brasileiro
 * @param {Date|string} date - Data/hora a ser formatada
 * @returns {string} Data e hora formatadas em português brasileiro
 */
export const formatDateTimeBR = (date) => {
  const brazilDate = toBrazilDate(date);
  return brazilDate.toLocaleString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Obtém o horário atual em formato ISO string no fuso horário de Brasília
 * @returns {string} Data/hora atual em formato ISO
 */
export const getBrazilISOString = () => {
  const brazilDate = getBrazilDate();
  const offset = getBrazilTimezoneOffset();
  const adjustedDate = new Date(brazilDate.getTime() + offset);
  return adjustedDate.toISOString();
};

/**
 * Obtém o offset do fuso horário de Brasília em relação ao UTC
 * @returns {number} Offset em milissegundos
 */
export const getBrazilTimezoneOffset = () => {
  const now = new Date();
  const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
  const brazil = new Date(utc.toLocaleString("en-US", { timeZone: BRAZIL_TIMEZONE }));
  return brazil.getTime() - utc.getTime();
};

/**
 * Converte uma data em string YYYY-MM-DD para o fuso horário de Brasília
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {Date} Data ajustada para o fuso horário de Brasília
 */
export const parseDateStringToBrazil = (dateString) => {
  if (!dateString) return null;
  
  // Cria a data assumindo meio-dia no fuso horário de Brasília para evitar problemas de timezone
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
  return toBrazilDate(date);
};

/**
 * Converte uma data para string no formato YYYY-MM-DD considerando o fuso horário de Brasília
 * @param {Date} date - Data a ser convertida
 * @returns {string} Data no formato YYYY-MM-DD
 */
export const dateToStringBrazil = (date) => {
  if (!date) return '';
  
  const brazilDate = toBrazilDate(date);
  const year = brazilDate.getFullYear();
  const month = String(brazilDate.getMonth() + 1).padStart(2, '0');
  const day = String(brazilDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Verifica se uma data é hoje no fuso horário de Brasília
 * @param {Date|string} date - Data a ser verificada
 * @returns {boolean} True se for hoje
 */
export const isToday = (date) => {
  const inputDate = toBrazilDate(date);
  const today = getBrazilDate();
  
  return inputDate.getFullYear() === today.getFullYear() &&
         inputDate.getMonth() === today.getMonth() &&
         inputDate.getDate() === today.getDate();
};

/**
 * Verifica se uma data é no passado no fuso horário de Brasília
 * @param {Date|string} date - Data a ser verificada
 * @returns {boolean} True se for no passado
 */
export const isPastDate = (date) => {
  const inputDate = toBrazilDate(date);
  const today = getBrazilDate();
  
  return inputDate < today;
};

/**
 * Adiciona dias a uma data mantendo o fuso horário de Brasília
 * @param {Date|string} date - Data base
 * @param {number} days - Número de dias a adicionar
 * @returns {Date} Nova data com os dias adicionados
 */
export const addDays = (date, days) => {
  const brazilDate = toBrazilDate(date);
  const newDate = new Date(brazilDate);
  newDate.setDate(newDate.getDate() + days);
  return toBrazilDate(newDate);
};

/**
 * Obtém o início do dia no fuso horário de Brasília
 * @param {Date|string} date - Data base (opcional, padrão é hoje)
 * @returns {Date} Data com horário 00:00:00 no fuso horário de Brasília
 */
export const getStartOfDay = (date) => {
  const inputDate = date ? toBrazilDate(date) : getBrazilDate();
  const startOfDay = new Date(inputDate);
  startOfDay.setHours(0, 0, 0, 0);
  return toBrazilDate(startOfDay);
};

/**
 * Obtém o fim do dia no fuso horário de Brasília
 * @param {Date|string} date - Data base (opcional, padrão é hoje)
 * @returns {Date} Data com horário 23:59:59 no fuso horário de Brasília
 */
export const getEndOfDay = (date) => {
  const inputDate = date ? toBrazilDate(date) : getBrazilDate();
  const endOfDay = new Date(inputDate);
  endOfDay.setHours(23, 59, 59, 999);
  return toBrazilDate(endOfDay);
};

/**
 * Converte um horário string (HH:MM) para Date no fuso horário de Brasília
 * @param {string} timeString - Horário no formato HH:MM
 * @param {Date|string} date - Data base (opcional, padrão é hoje)
 * @returns {Date} Data com o horário especificado
 */
export const timeStringToDate = (timeString, date) => {
  if (!timeString) return null;
  
  const baseDate = date ? toBrazilDate(date) : getBrazilDate();
  const [hours, minutes] = timeString.split(':').map(Number);
  
  const result = new Date(baseDate);
  result.setHours(hours, minutes, 0, 0);
  
  return toBrazilDate(result);
};

/**
 * Converte uma Date para string de horário (HH:MM)
 * @param {Date} date - Data a ser convertida
 * @returns {string} Horário no formato HH:MM
 */
export const dateToTimeString = (date) => {
  if (!date) return '';
  
  const brazilDate = toBrazilDate(date);
  const hours = String(brazilDate.getHours()).padStart(2, '0');
  const minutes = String(brazilDate.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

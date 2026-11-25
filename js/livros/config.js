// Configuração de acesso ao Supabase
// Os valores ficam no painel do projeto: Project Settings > Data API (URL)
// e Project Settings > API Keys (chave "anon" ou "publishable").
// A chave pública pode ficar no código porque as tabelas são protegidas por RLS.

export const SUPABASE_URL = "https://ftufrprdngowfmlnfgfl.supabase.co";
export const SUPABASE_KEY = "sb_publishable_rv4IsgqYTpprNRuhjhgelQ_gSCMgNkm";

// Avisa a página quando os valores acima ainda não foram trocados
export function configuracaoPendente() {
  return SUPABASE_URL.includes("SEU-PROJETO") || SUPABASE_KEY.startsWith("SUA-");
}

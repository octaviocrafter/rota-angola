// Adaptador simples: a interface pede à base de dados através destas funções.
const demo = { utilizadores: [], viagens: [], denuncias: [], avaliacoes: [] };
export async function guardar(tabela, registo){ demo[tabela] ??= []; demo[tabela].push(registo); return registo; }
export async function ler(tabela, filtro=()=>true){ return (demo[tabela]||[]).filter(filtro); }
export async function atualizar(tabela, id, dados){ const item=(demo[tabela]||[]).find(x=>x.id===id); if(item) Object.assign(item,dados); return item; }
export async function apagar(tabela,id){ demo[tabela]=(demo[tabela]||[]).filter(x=>x.id!==id); }

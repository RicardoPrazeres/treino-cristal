# Treino Cristal

Aplicativo web progressivo (PWA) para acompanhar fichas de treino, cargas, histórico e intervalos de descanso. Os dados são mantidos no navegador e sincronizados com o Firebase após autenticação com Google.

## Recursos

- fichas de treino editáveis e sequência do próximo treino;
- marcação de exercícios, timer e histórico de cargas;
- modo claro/escuro e instalação como PWA;
- funcionamento offline com sincronização ao reconectar;
- importação e exportação de backup em JSON.

## Executar localmente

O projeto não precisa de build. Sirva a pasta por HTTP para habilitar corretamente o service worker:

```bash
python3 -m http.server 8080
```

Depois, abra `http://localhost:8080`.

> O login exige que `localhost` esteja autorizado no Firebase Authentication do projeto.

## Validação

Os testes usam apenas recursos nativos do Node.js:

```bash
npm test
```

Eles verificam a sintaxe dos scripts, a consistência do manifesto, os arquivos usados pelo PWA e proteções contra regressões importantes.

## Estrutura

- `index.html`: interface, estado local e integração com Firebase;
- `manifest.json`: metadados de instalação da PWA;
- `service-worker.js`: cache offline e atualização dos recursos;
- `icons/`: ícones da aplicação;
- `tests/`: verificações estáticas automatizadas.

## Segurança do Firebase

A configuração web do Firebase no cliente identifica o projeto, mas não substitui controles de acesso. As regras do Firestore devem restringir cada documento ao usuário autenticado correspondente ao `uid` do caminho `users/{uid}`. Mantenha essas regras versionadas e testadas no projeto que administra o Firebase.

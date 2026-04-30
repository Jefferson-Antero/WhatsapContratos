# WhatsApp Contratos

Sistema web para gerenciamento e envio de notificações de pagamentos via WhatsApp. Permite fazer upload de planilhas Excel com dados de contratos e pagamentos, e enviar mensagens automatizadas para números especificados.

## 🎯 Funcionalidades

- ✅ Upload de planilhas Excel com dados de pagamentos
- ✅ Visualização e gerenciamento de registros de pagamentos
- ✅ Envio de mensagens via WhatsApp
- ✅ Armazenamento em banco de dados SQLite
- ✅ Interface moderna com React + Tailwind CSS
- ✅ Suporte para múltiplas operações em paralelo

## 🏗️ Arquitetura

A aplicação segue uma arquitetura de duas camadas:

### Frontend (React + Vite)
- Porta: **3000**
- Dois módulos principais:
  - `/` - Página de Upload: Gerenciamento de planilhas Excel
  - `/pagamentos` - Página de Pagamentos: Seleção e envio via WhatsApp

### Backend (Express + TypeScript)
- Porta: **3001**
- Endpoints RESTful para upload, verificação e remoção de arquivos
- Integração com Google GenAI para processamento de IA
- Banco de dados SQLite para persistência de dados

## 📋 Requisitos

- Node.js 18+ 
- npm ou yarn
- Git

## 🚀 Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/Jefferson-Antero/WhatsapContratos.git
cd WhatsapContratos
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
Crie um arquivo `.env` na raiz do projeto (opcional para funcionalidades extras):
```bash
GOOGLE_API_KEY=sua_chave_api
```

## 📖 Como Usar

### Opção 1: Execução em Paralelo (Recomendado)

Execute ambos os servidores simultaneamente:

```bash
npm run dev:all
```

Isso iniciará:
- Backend (Express) na porta **3001**
- Frontend (Vite) na porta **3000**

### Opção 2: Execução Separada

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend (novo terminal):**
```bash
npm run dev
```

## 📝 Fluxo de Uso

### 1. Upload de Planilha
- Acesse `http://localhost:3000/`
- Clique em "Upload" para selecionar uma planilha Excel
- A planilha deve conter as seguintes colunas:
  - **Contrato/Credor/Objeto**: Identificação do contrato
  - **Processo**: Número do processo
  - **Período/Valor**: Período e valor do pagamento
  - **Setor/Data**: Setor e data

### 2. Gerenciar Planilha
Após o upload, você pode:
- 🔄 **Alterar**: Remover e adicionar uma nova planilha
- 🗑️ **Remover**: Deletar a planilha atual

### 3. Enviar via WhatsApp
- Clique em "Prosseguir para Pagamentos"
- Visualize todos os registros da planilha
- Selecione os registros que deseja enviar
- Insira o número de WhatsApp do destinatário
- Clique em "Enviar via WhatsApp"

## 🛠️ Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run server` | Inicia o servidor Express |
| `npm run dev` | Inicia o servidor de desenvolvimento Vite |
| `npm run dev:all` | Inicia ambos os servidores em paralelo |
| `npm run build` | Compila o projeto para produção |
| `npm run preview` | Visualiza o build de produção localmente |
| `npm run clean` | Limpa a pasta `dist` |
| `npm run lint` | Verifica tipos TypeScript |

## 📁 Estrutura do Projeto

```
WhatsapContratos/
├── src/
│   ├── components/        # Componentes React reutilizáveis
│   │   └── Layout.tsx
│   ├── pages/             # Páginas principais
│   │   ├── UploadPage.tsx
│   │   └── PaymentPage.tsx
│   ├── lib/               # Utilitários e serviços
│   │   ├── spreadsheetParser.ts   # Parser de Excel
│   │   ├── paymentService.ts      # Serviço de pagamentos
│   │   └── utils.ts
│   ├── data/              # Dados estáticos
│   ├── App.tsx            # Componente principal
│   ├── main.tsx           # Entrada da aplicação
│   ├── database.ts        # Operações com SQLite
│   ├── types.ts           # Tipos TypeScript
│   └── index.css          # Estilos globais
├── uploads/               # Pasta para uploads de planilhas
├── data/                  # Dados do banco de dados
├── server.ts              # Servidor Express
├── vite.config.ts         # Configuração do Vite
├── tsconfig.json          # Configuração TypeScript
├── package.json
├── README.md
└── SETUP.md              # Guia de setup detalhado
```

## 🔌 Endpoints da API

### Upload de Planilha
- `POST /api/upload` - Faz upload de uma planilha Excel
- `GET /api/check-upload` - Verifica se existe planilha salva
- `GET /api/upload/planilha.xlsx` - Baixa a planilha salva
- `DELETE /api/upload/planilha.xlsx` - Remove a planilha

## 📦 Dependências Principais

### Runtime
- **react** (19.0.1) - Biblioteca UI
- **express** (4.21.2) - Framework web backend
- **vite** (6.2.3) - Build tool e dev server
- **tailwindcss** (4.1.14) - Framework CSS utilitário
- **xlsx** (0.18.5) - Parser de planilhas Excel
- **better-sqlite3** (12.9.0) - Banco de dados SQLite
- **@google/genai** (1.29.0) - Integração com Google GenAI
- **lucide-react** (0.546.0) - Ícones
- **react-router-dom** (7.14.2) - Roteamento

### Development
- **typescript** (5.8.2) - Linguagem tipada
- **tsx** (4.21.0) - Executor de TypeScript
- **concurrently** (9.2.1) - Executar múltiplos comandos

## 🗄️ Armazenamento

### Planilhas (Uploads)
- Local: `uploads/` no servidor
- Formato: `planilha.xlsx` (apenas um arquivo por vez)
- Criado automaticamente na primeira execução

### Banco de Dados
- Tipo: SQLite
- Local: `data/` 
- Tabelas: `payment_records`, `payments_sent`
- Inicializado automaticamente

## ⚙️ Variáveis de Ambiente

As seguintes variáveis podem ser configuradas em um arquivo `.env`:

```bash
# Google GenAI (opcional)
GOOGLE_API_KEY=sua_chave_de_api

# Configuração do servidor
PORT=3001
HOST=0.0.0.0
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um Fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a licença Apache 2.0. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👤 Autor

- **Jefferson Antero** - [GitHub](https://github.com/Jefferson-Antero)

## 📞 Suporte

Para reportar bugs, sugerir melhorias ou fazer perguntas, abra uma [Issue](https://github.com/Jefferson-Antero/WhatsapContratos/issues) no repositório.

## 🔄 Histórico de Mudanças

### v0.0.0
- Release inicial
- Upload de planilhas Excel
- Gerenciamento de pagamentos
- Integração com WhatsApp

---

**Desenvolvido com ❤️ usando React, Express e TypeScript**

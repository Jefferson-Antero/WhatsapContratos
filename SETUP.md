# Como Usar o Sistema

## Arquitetura da Aplicação

A aplicação agora possui **duas rotas separadas**:

1. **Rota `/` - Upload de Planilha**
   - Página para fazer upload da planilha de pagamentos
   - Armazena a planilha na pasta `uploads/` do servidor
   - Permite alterar ou remover a planilha

2. **Rota `/pagamentos` - Envio via WhatsApp**
   - Página para selecionar registros e enviar via WhatsApp
   - Alimentada automaticamente pela planilha da primeira página
   - Pode apenas ser acessada quando há uma planilha carregada

## Como Rodar o Projeto

### Opção 1: Rodando Ambos os Servidores (Recomendado)

Você precisa rodar o **servidor Express (Backend)** e o **servidor Vite (Frontend)** em paralelo:

**Terminal 1 - Backend:**
```bash
npm run server
```
Isso iniciará o servidor na porta **3001**

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Isso iniciará o Vite na porta **3000**

### Opção 2: Rodando com Concurrently (Opcional)

Se instalar `concurrently`:
```bash
npm install --save-dev concurrently
npm run dev:all
```

## Fluxo de Uso

1. **Acesse http://localhost:3000/**
2. **Faça upload de uma planilha Excel** com as seguintes colunas:
   - Contrato / Credor / Objeto
   - Processo
   - Período / Valor
   - Setor / Data

3. **Após o upload**, você terá opções para:
   - **Prosseguir para Pagamentos** - Ir para a página de envio
   - **Alterar** - Remover a planilha atual e adicionar outra
   - **Remover** - Remover a planilha

4. **Na página de Pagamentos** (/pagamentos):
   - Visualize todos os registros da planilha
   - Selecione quais registros deseja enviar
   - Insira um número de WhatsApp
   - Clique em "Enviar via WhatsApp"

## Armazenamento

- As planilhas são armazenadas na pasta **`uploads/`** no servidor
- A pasta é criada automaticamente na primeira execução
- Cada arquivo é salvo como **`planilha.xlsx`** (apenas um arquivo por vez)

## Endpoints da API

- `POST /api/upload` - Fazer upload de uma planilha
- `GET /api/check-upload` - Verificar se existe planilha salva
- `DELETE /api/upload/planilha.xlsx` - Remover a planilha
- `GET /api/upload/planilha.xlsx` - Baixar a planilha

## Notas Importantes

- O arquivo é armazenado no servidor, então persiste entre requisições
- Apenas uma planilha pode estar salva por vez
- Os registros são mostrados na página de pagamentos conforme a planilha
- Se atualizar a página de pagamentos, você precisa voltar ao upload (protação de segurança)

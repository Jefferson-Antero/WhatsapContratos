#!/bin/bash

# Script de Deploy com PM2
# ========================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== WhatsApp Contratos - Deploy Script ===${NC}\n"

# 1. Verificar se PM2 está instalado
echo -e "${YELLOW}1. Verificando PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}   PM2 não encontrado. Instalando globalmente...${NC}"
  npm install -g pm2
  pm2 startup
else
  echo -e "${GREEN}   ✓ PM2 já instalado${NC}"
fi

# 2. Instalar/Atualizar dependências
echo -e "\n${YELLOW}2. Instalando dependências...${NC}"
npm install
echo -e "${GREEN}   ✓ Dependências instaladas${NC}"

# 3. Build da aplicação
echo -e "\n${YELLOW}3. Fazendo build da aplicação...${NC}"
npm run build
if [ $? -eq 0 ]; then
  echo -e "${GREEN}   ✓ Build realizado com sucesso${NC}"
else
  echo -e "${RED}   ✗ Erro no build${NC}"
  exit 1
fi

# 4. Criar pasta de logs
echo -e "\n${YELLOW}4. Criando diretório de logs...${NC}"
mkdir -p logs
echo -e "${GREEN}   ✓ Pasta logs criada${NC}"

# 5. Parar aplicações anteriores (se existirem)
echo -e "\n${YELLOW}5. Parando aplicações anteriores...${NC}"
pm2 delete all 2>/dev/null || true
sleep 2

# 6. Iniciar aplicações com PM2
echo -e "\n${YELLOW}6. Iniciando aplicações com PM2...${NC}"
pm2 start ecosystem.config.js
echo -e "${GREEN}   ✓ Aplicações iniciadas${NC}"

# 7. Configurar PM2 para iniciar no boot
echo -e "\n${YELLOW}7. Configurando PM2 para iniciar no boot...${NC}"
pm2 startup
pm2 save
echo -e "${GREEN}   ✓ PM2 configurado para iniciar no boot${NC}"

# 8. Exibir status
echo -e "\n${YELLOW}8. Status das aplicações:${NC}"
pm2 status

# 9. Exibir logs
echo -e "\n${YELLOW}9. Logs disponíveis em:${NC}"
echo -e "   ${GREEN}logs/backend-out.log${NC}"
echo -e "   ${GREEN}logs/frontend-out.log${NC}"
echo -e "   ${GREEN}logs/backend-error.log${NC}"
echo -e "   ${GREEN}logs/frontend-error.log${NC}"

# 10. Comandos úteis
echo -e "\n${YELLOW}Comandos úteis:${NC}"
echo -e "   ${GREEN}pm2 status${NC}           - Ver status das aplicações"
echo -e "   ${GREEN}pm2 logs${NC}             - Ver logs em tempo real"
echo -e "   ${GREEN}pm2 restart all${NC}      - Reiniciar todas as aplicações"
echo -e "   ${GREEN}pm2 stop all${NC}         - Parar todas as aplicações"
echo -e "   ${GREEN}pm2 delete all${NC}       - Deletar todas as aplicações do PM2"
echo -e "   ${GREEN}pm2 save${NC}             - Salvar lista de processos"

echo -e "\n${GREEN}=== Deploy concluído! ===${NC}\n"

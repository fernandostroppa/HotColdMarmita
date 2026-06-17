# Como rodar o sistema de pedidos

## Pré-requisitos
- Node.js 18 ou superior (https://nodejs.org)
- Conta no Mercado Pago (para pagamentos reais)

---

## 1. Instalar dependências

Abra o terminal dentro da pasta `marmita` e rode:

```bash
npm install
```

---

## 2. Configurar variáveis de ambiente

Edite o arquivo `.env` com seus dados:

```
DATABASE_URL="file:./dev.db"

# Credenciais do Mercado Pago (https://www.mercadopago.com.br/developers)
MP_ACCESS_TOKEN="APP_USR-seu-token-aqui"
MP_PUBLIC_KEY="APP_USR-sua-chave-publica-aqui"

# URL base (em produção coloque o domínio real)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Senha para acessar /cozinha e /admin
ADMIN_PASSWORD="marmita123"
```

---

## 3. Criar o banco de dados

```bash
npm run db:push
npm run db:seed
```

Isso cria o banco SQLite e popula o cardápio com itens de exemplo.

---

## 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse em: http://localhost:3000

---

## Telas do sistema

| URL | Quem acessa |
|-----|------------|
| `http://localhost:3000` | Cliente — cardápio + pedido |
| `http://localhost:3000/pagamento/[id]` | Cliente — pagamento |
| `http://localhost:3000/senha/[id]` | Cliente — senha e status |
| `http://localhost:3000/cozinha` | Funcionário — fila de pedidos |
| `http://localhost:3000/admin` | Dono — gerenciar cardápio |

---

## 5. Fluxo completo

```
1. Cliente acessa /  → escolhe itens → clica "Ir para pagamento"
2. Informa nome, telefone → escolhe PIX ou Cartão → paga
3. Recebe a senha na tela (ex: 001)
4. Cozinha vê o pedido em /cozinha → clica "Iniciar preparo"
5. Cozinha termina → clica "Marcar como pronto"
6. Tela do cliente atualiza automaticamente → "Pronto para retirada!"
7. Cliente apresenta a senha → funcionário clica "Confirmar retirada"
```

---

## Para produção (Vercel)

1. Faça push do projeto para o GitHub
2. Importe no Vercel (vercel.com)
3. Configure as variáveis de ambiente no painel da Vercel
4. **Atenção:** SQLite não funciona em produção na Vercel. Migre para PostgreSQL (Supabase/Neon gratuitos) trocando `provider = "sqlite"` por `provider = "postgresql"` no `schema.prisma`

---

## Banco de dados visual

```bash
npm run db:studio
```

Abre o Prisma Studio no navegador para ver/editar todos os dados.

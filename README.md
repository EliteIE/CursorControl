# EliteControl v2.0

Sistema de gestão inteligente com IA e CRM avançado.

## Configuração

### Firebase

1. Renomeie o arquivo `js/firebase-config.example.js` para `js/firebase-config.js`
2. Substitua as configurações no arquivo com as credenciais do seu projeto Firebase:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "your-messaging-sender-id",
       appId: "your-app-id",
       measurementId: "your-measurement-id"
   };
   ```

### Usuários de Teste

O sistema inclui três perfis de teste:

1. Dono/Gerente
   - Email: admin@elitecontrol.com
   - Perfil: Dono/Gerente

2. Controlador de Estoque
   - Email: estoque@elitecontrol.com
   - Perfil: Controlador de Estoque

3. Vendedor
   - Email: vendas@elitecontrol.com
   - Perfil: Vendedor

## Estrutura do Projeto

- `js/main.js` - Arquivo principal do sistema
- `js/firebase-config.js` - Configurações do Firebase
- `js/firebase-service.js` - Serviços de dados
- `js/firebase-crm-service.js` - Serviços de CRM

## Funcionalidades

- Gestão de produtos
- Sistema de vendas
- CRM integrado
- Dashboard inteligente
- Controle de estoque
- Gestão de usuários
- Sistema de notificações

## Segurança

- Autenticação via Firebase
- Controle de acesso baseado em perfis
- Validação de dados
- Persistência offline
- Sincronização em tempo real

## Desenvolvimento

Para rodar em modo de desenvolvimento:
1. Configure o Firebase conforme instruções acima
2. Abra o projeto em um servidor local
3. O sistema detectará automaticamente o ambiente de desenvolvimento

## Produção

Para deploy em produção:
1. Configure o Firebase conforme instruções acima
2. Certifique-se de que as regras de segurança do Firestore estão configuradas
3. Deploy os arquivos para seu servidor web
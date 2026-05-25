# 🌊 Aquashow Legacy · Site de Inscrição

Site de inscrição para o Rolê Legacy ao Aquashow Park — 22 de Agosto de 2026.

## Deploy

**GitHub → Vercel** (site estático, sem backend)

Os dados vão direto para:  
📊 [Planilha de Participantes](https://docs.google.com/spreadsheets/d/13IyVio1lZykgVGG2gRlV5Xamv-Tx31ERRK6GUOy1j_o)

---

## Configuração — Google Apps Script (backend da planilha)

### 1. Criar o script
1. Acede a [script.google.com](https://script.google.com/)
2. Clica em **"Novo projecto"**
3. Apaga o conteúdo e cola o código do ficheiro `apps-script.gs`
4. Guarda (Ctrl+S)

### 2. Fazer o deploy
1. Clica em **"Implementar"** → **"Nova implementação"**
2. Tipo de implementação: **App da Web**
3. Executar como: **Eu** (o teu email Google)
4. Quem tem acesso: **Qualquer pessoa**
5. Clica em **"Implementar"**
6. Autoriza as permissões quando pedido
7. **Copia a URL** que aparece (ex: `https://script.google.com/macros/s/AKfycb.../exec`)

### 3. Ligar ao site
Abre `index.html` e substitui na linha:
```js
const APPS_SCRIPT_URL = 'SUBSTITUIR_PELA_URL_DO_APPS_SCRIPT';
```
pela URL copiada no passo anterior.

---

## Deploy no GitHub + Vercel

### GitHub
```bash
cd aquashow-legacy
git init
git add .
git commit -m "feat: site aquashow com formulário de inscrição"
gh repo create aquashow-legacy --public --push --source=.
```

### Vercel
1. Acede a [vercel.com](https://vercel.com/)
2. Clica em **"Add New Project"**
3. Importa o repositório `aquashow-legacy` do GitHub
4. Framework: **Other** (site estático)
5. Clica em **"Deploy"**
6. O site fica em `aquashow-legacy.vercel.app` (ou domínio personalizado)

---

## Fluxo de inscrição

```
Utilizador clica "Garantir minha vaga"
        ↓
Modal multi-passo abre no site
        ↓
Pergunta 1: Nome completo
Pergunta 2: WhatsApp
Pergunta 3: Email
Pergunta 4: Idade (mostra preço automaticamente)
Pergunta 5: Ministério (Legacy / Advance / Convidado)
Pergunta 6: Observações (opcional)
        ↓
Resumo + Confirmação
        ↓
Dados enviados para Google Apps Script
        ↓
Planilha preenchida automaticamente com estado "AGUARDANDO CONFIRMAÇÃO"
        ↓
Utilizador vê mensagem de sucesso
        ↓
Equipa Legacy envia link de pagamento por WhatsApp/Email
```

---

## Preços automáticos

| Idade | Valor |
|-------|-------|
| 0–10 anos | €50 |
| 11–64 anos | €60 |
| 65+ anos | €50 |

---

*Desenvolvido pela Hunt Agency 💙*

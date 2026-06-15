# 🎟️ Sistema de Bilhética + Chamada Ida/Volta — Aquashow Legacy

Sistema de validação de bilhetes por QR code com **chamada de presença ida e volta**
(garante que ninguém fica para trás no parque).

## Como funciona (visão geral)

```
   INSCRIÇÃO ──► planilha ("AGUARDANDO")
       │
   equipa marca  ESTADO = "CONFIRMADO ✅"   (controlo manual, após pagamento)
       │
   Apps Script gera TOKEN secreto (col M) ──► email com QR (token)
       │
  ───────────────── DIA DO EVENTO ─────────────────
   📱 Telemóvel /scanner  ──(valida + carimba)──►  planilha (col N ida / O volta)
   📲 iPad      /painel   ──(lê ao vivo)─────────►  mostra contadores + quem FALTA
```

- **QR contém um token secreto** (não o "AQ-001" visível) → impossível clonar/adivinhar.
- **Scanner offline-first**: descarrega a lista, valida no telemóvel mesmo sem rede,
  e sincroniza os embarques quando a rede volta. Nada se perde.
- **Validação no servidor** com `LockService` → sem entrada dupla, mesmo com vários telemóveis.

## Links (com a chave secreta)

> Chave atual: `lgcy2026` — para mudar, editar `SECRET` no topo dos dois ficheiros HTML.

- 📱 Scanner (telemóvel): `https://aquashow-legacy.vercel.app/scanner/?key=lgcy2026`
- 📲 Painel (iPad):       `https://aquashow-legacy.vercel.app/painel/?key=lgcy2026`

## Estados na planilha (coluna F)

| Estado | Significado |
|---|---|
| `AGUARDANDO CONFIRMAÇÃO` | Inscrito, ainda não pagou |
| `CONFIRMADO ✅` | **Marca isto após o pagamento** → dispara token + email com QR |
| `TICKET ENVIADO ✅` | Email de bilhete enviado (automático) |

Colunas novas: **M** TOKEN · **N** EMBARQUE IDA · **O** EMBARQUE VOLTA (preenchidas pelo scanner).

---

## ✅ ATIVAÇÃO (passos manuais — fazer uma vez, por ordem)

1. **Apps Script v14**
   - script.google.com → projeto "Aquashow Legacy" → colar `apps-script.gs` (Ctrl+A, colar) → guardar.
   - Menu da planilha **⚡ Aquashow → ▶ Instalar/Actualizar Sistema (1ª vez)** (instala triggers + colunas M/N/O).
   - **Implementar → Gerir implementações → ✏️ → Nova versão → Implementar** (a URL NÃO muda).
   - Se já houver confirmados antigos sem token: **⚡ Aquashow → 🔑 Gerar tokens em falta**.

2. **n8n — email de bilhete**
   - Abrir o workflow `Confirmar Pagamento + Ticket` (`p2keG0Jvdb6ChR4X`).
   - No nó Code, colar o conteúdo atualizado de `n8n-ticket-email-code-node.js` (QR usa o token).
   - **Ativar** o workflow.

3. **Frontend (scanner + painel)**
   - `git push` → Vercel publica `/scanner` e `/painel` automaticamente.

4. **Teste ponta-a-ponta (antes do dia)**
   - Inscrever um teste → marcar `CONFIRMADO ✅` → confirmar email com QR.
   - Abrir `/scanner` no telemóvel → modo IDA → escanear o QR → ✅ verde.
   - Escanear de novo → ⚠️ "já embarcou".
   - Abrir `/painel` no iPad → contador sobe; mudar para VOLTA → a pessoa aparece em "falta".

---

## 📋 No dia do evento

**Telemóvel (equipa que escaneia):**
1. Abrir o link do scanner. Esperar "Lista: N ✓".
2. Embarque na igreja → modo **IDA**. Aponta a câmara a cada QR.
3. No parque, antes de voltar → modo **VOLTA**. Escanear todos ao entrar no autocarro.
4. Verde = ok · Amarelo = já tinha embarcado · Vermelho = bilhete inválido.

**iPad (líder no controlo):**
- Abrir o painel. Ver os contadores ao vivo.
- Separador **VOLTA**: a lista vermelha mostra **quem ainda não está no autocarro** — com botões 💬 WhatsApp e 📞 ligar.
- Autocarro só arranca quando a lista estiver a **0**.
- No fim: **📊 Descarregar relatório (CSV)**.

## Segurança (5 camadas)
1. Token secreto no QR (não o ref visível) · 2. Links com chave · 3. Validação no servidor ·
4. Bilhete de uso único por modo (carimba a hora) · 5. `LockService` anti-duplicação simultânea.

## Notas técnicas
- Scanner/Painel falam com o Apps Script: GET (`?action=lista|painel|relatorio`) e POST `text/plain` (`action:sync`) — pedidos "simples" para evitar bloqueio CORS.
- Offline: fila guardada em `localStorage`; sincroniza a cada 5s quando há rede.
- Para mudar a chave secreta: editar `SECRET` em `scanner/index.html` e `painel/index.html`.

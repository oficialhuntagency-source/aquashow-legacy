# Workflow: Confirmar Pagamento

- **Workflow ID:** `p2keG0Jvdb6ChR4X`
- **Webhook URL:** `https://huntagency.app.n8n.cloud/webhook/aquashow-confirmar-pagamento`
- **Status:** Inactivo — activar quando tudo estiver testado

## O que faz
1. Recebe POST com os dados da pessoa
2. Monta o email de ticket com QR code (`n8n-ticket-email-code-node.js`)
3. Envia o email via `lgcylisboa@gmail.com` com assunto `🎟️ O teu bilhete — Aquashow Legacy · 22 de Agosto de 2026`

## Como usar
Fazer POST para o webhook com:
```json
{
  "num": "1",
  "nome": "Nome Completo",
  "email": "email@exemplo.com",
  "contacto": "351912345678",
  "idade": "25",
  "ministerio": "Legacy",
  "obs": "",
  "preco": "60"
}
```

## Placeholders a substituir antes de activar

### Email de inscrição (`n8n-email-code-node.js`)
| Placeholder | O que é |
|---|---|
| `LINK_PAGAMENTO_AQUI` | URL do link de pagamento online |
| `MBWAY_NUMERO_AQUI` | Número de telemóvel MBWay (ex: `912 345 678`) |
| `IBAN_AQUI` | IBAN da conta (ex: `PT50 0010 0000 1234 5678 9015 4`) |
| `TITULAR_AQUI` | Nome do titular da conta |

### Como substituir
```bash
# No ficheiro local:
sed -i '' 's/LINK_PAGAMENTO_AQUI/https://teu-link-real/g' n8n-email-code-node.js
# Depois actualizar o nó Code no n8n via a interface ou API
```

## TODOs antes de activar
- [ ] Substituir os 4 placeholders de pagamento no email de inscrição
- [ ] Testar envio do email de ticket com dados reais
- [ ] Activar o workflow na interface do n8n
- [ ] Actualizar planilha manualmente ou via Apps Script quando confirmado

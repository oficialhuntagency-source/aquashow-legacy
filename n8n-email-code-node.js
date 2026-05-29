const d        = $input.first().json.body;
const num      = d.num       || '1';
const nome     = d.nome      || '—';
const primeiro = nome.split(' ')[0];
const contacto = d.contacto  || '—';
const email    = d.email     || '—';
const idade    = d.idade     ? d.idade + ' anos' : '—';
const min      = d.ministerio || '—';
const obs      = d.obs       || '';
const preco    = (parseFloat(d.preco) || 0).toFixed(2).replace('.', ',');
const ref      = 'AQ-' + String(num).padStart(3, '0');
const metodo   = (d.metodoPagamento || 'link').toLowerCase();
const parcelas = d.parcelas || '1/1';
const numParc  = d.numParcelas || '1x';
const isParcelado = metodo === 'parcelado';
const isMBWay     = metodo === 'mbway';
const isIBAN      = metodo === 'iban';
const isLink      = metodo === 'link' || (!isMBWay && !isIBAN && !isParcelado);

// Secção de pagamento dinâmica por método
const secaoPagamento = isLink ? `
  <!-- Botão link (único para quem escolheu online) -->
  <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111827;">Pagamento Online</p>
  <p style="margin:0 0 20px;font-size:14px;color:#4B5563;line-height:1.7;">
    Clica no botão abaixo para efectuar o pagamento de <strong style="color:#111827;">€ ${preco}</strong>. Indica a referência <strong style="color:#111827;">${ref}</strong> se for pedida.
  </p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
    <tr>
      <td style="background-color:#FFB938;border-radius:8px;text-align:center;">
        <a href="LINK_PAGAMENTO_AQUI" target="_blank"
           style="display:block;padding:15px 32px;font-size:15px;font-weight:700;color:#06204D;text-decoration:none;letter-spacing:0.02em;">
          💳 &nbsp;Pagar Online →
        </a>
      </td>
    </tr>
  </table>
` : isMBWay ? `
  <!-- MBWay -->
  <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111827;">Pagamento via MBWay</p>
  <p style="margin:0 0 20px;font-size:14px;color:#4B5563;line-height:1.7;">
    Envia <strong style="color:#111827;">€ ${preco}</strong> para o número abaixo e indica a referência <strong style="color:#111827;">${ref}</strong> no campo descrição.
  </p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
    <tr>
      <td style="background:#F8F9FB;border:1px solid #E5E7EB;border-radius:8px;padding:18px 22px;">
        <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.08em;">📱 Número MBWay</p>
        <p style="margin:0 0 10px;font-size:22px;font-weight:800;color:#111827;letter-spacing:0.06em;">MBWAY_NUMERO_AQUI</p>
        <p style="margin:0;font-size:13px;color:#6B7280;">Descrição: <strong style="color:#111827;">${ref}</strong></p>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 32px;font-size:13px;color:#6B7280;">Após o pagamento, envia o comprovativo para o WhatsApp da equipa.</p>
` : isIBAN ? `
  <!-- IBAN -->
  <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111827;">Transferência Bancária</p>
  <p style="margin:0 0 20px;font-size:14px;color:#4B5563;line-height:1.7;">
    Faz uma transferência de <strong style="color:#111827;">€ ${preco}</strong> para o IBAN abaixo. É <strong>obrigatório</strong> indicar a referência <strong style="color:#111827;">${ref}</strong> no descritivo — é assim que identificamos o teu pagamento.
  </p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
    <tr>
      <td style="background:#F8F9FB;border:1px solid #E5E7EB;border-radius:8px;padding:18px 22px;">
        <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.08em;">🏦 IBAN</p>
        <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:#111827;letter-spacing:0.03em;word-break:break-all;">IBAN_AQUI</p>
        <p style="margin:0 0 10px;font-size:13px;color:#6B7280;">Titular: <strong style="color:#111827;">TITULAR_AQUI</strong></p>
        <p style="margin:0;font-size:13px;color:#111827;font-weight:600;">Descritivo obrigatório: ${ref}</p>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 32px;font-size:13px;color:#6B7280;">Após a transferência, envia o comprovativo para o WhatsApp da equipa.</p>
` : `
  <!-- Parcelado -->
  <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111827;">Pagamento Parcelado (${numParc})</p>
  <p style="margin:0 0 20px;font-size:14px;color:#4B5563;line-height:1.7;">
    O teu pagamento de <strong style="color:#111827;">€ ${preco}</strong> será dividido em <strong style="color:#111827;">${numParc}</strong>. A equipa vai entrar em contacto pelo WhatsApp para combinar as datas de cada prestação. Em cada pagamento, indica a referência <strong style="color:#111827;">${ref}</strong>.
  </p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8F9FB;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:12px;">
    <tr>
      <td style="padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#111827;">📅 Parcelas: ${parcelas.replace('1/', '0/')} → ${parcelas.split('/')[1]}/${parcelas.split('/')[1]}</p>
        <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">O bilhete só é enviado após a <strong>última parcela</strong> ser confirmada.</p>
      </td>
    </tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
    <tr>
      <td style="background-color:#FFB938;border-radius:8px;text-align:center;">
        <a href="LINK_PAGAMENTO_AQUI" target="_blank"
           style="display:block;padding:15px 32px;font-size:15px;font-weight:700;color:#06204D;text-decoration:none;">
          💳 &nbsp;Pagar 1ª Prestação →
        </a>
      </td>
    </tr>
  </table>
`;

const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inscrição Recebida — Aquashow Legacy 2026</title>
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Pre-header -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#FFFFFF;">
    ${primeiro}, a tua inscrição no Aquashow Legacy foi recebida! A vaga fica garantida após o pagamento. Ref. ${ref} · 22 de Agosto de 2026
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFFFF;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Container -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">

          <!-- ── CABEÇALHO ── -->
          <tr>
            <td align="center" style="background-color:#FFFFFF;padding:40px 40px 36px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:rgba(0,0,0,0.4);">
                Igreja Lagoinha Lisboa
              </p>
              <p style="margin:0 0 4px;font-size:34px;font-weight:800;letter-spacing:0.07em;color:#111827;line-height:1.1;">
                AQUASHOW
              </p>
              <p style="margin:0 0 18px;font-size:34px;font-weight:800;letter-spacing:0.07em;color:#E00000;line-height:1.1;">
                LEGACY
              </p>
              <p style="margin:0;font-size:13px;font-weight:500;color:rgba(0,0,0,0.45);">
                22 de Agosto de 2026 &middot; Aquashow Park, Portugal
              </p>
            </td>
          </tr>

          <!-- ── CORPO ── -->
          <tr>
            <td style="background-color:#FFFFFF;padding:40px 40px 32px;">

              <!-- Saudação -->
              <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111827;">
                Olá, ${primeiro}!
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#4B5563;line-height:1.7;">
                A tua inscrição no <strong style="color:#111827;">Aquashow Legacy 2026</strong> foi recebida com sucesso. Assim que o pagamento for confirmado pela equipa, a tua vaga fica garantida.
              </p>

              <!-- Referência + Valor -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8F9FB;border-radius:8px;margin-bottom:32px;border:1px solid #E5E7EB;">
                <tr>
                  <td style="padding:18px 22px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">Referência</p>
                          <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#111827;letter-spacing:0.04em;">${ref}</p>
                        </td>
                        <td align="right">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">Valor</p>
                          <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#111827;">€ ${preco}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divisor -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr><td style="height:1px;background-color:#E5E7EB;font-size:0;">&nbsp;</td></tr>
              </table>

              <!-- Dados da inscrição -->
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;">
                Dados da inscrição
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td width="40%" style="font-size:13px;color:#6B7280;padding:10px 0;border-bottom:1px solid #F3F4F6;">Nome</td>
                  <td width="60%" style="font-size:13px;font-weight:600;color:#111827;padding:10px 0;border-bottom:1px solid #F3F4F6;">${nome}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6B7280;padding:10px 0;border-bottom:1px solid #F3F4F6;">Ministério</td>
                  <td style="font-size:13px;font-weight:600;color:#111827;padding:10px 0;border-bottom:1px solid #F3F4F6;">${min}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6B7280;padding:10px 0;border-bottom:1px solid #F3F4F6;">Idade</td>
                  <td style="font-size:13px;font-weight:600;color:#111827;padding:10px 0;border-bottom:1px solid #F3F4F6;">${idade}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6B7280;padding:10px 0;border-bottom:1px solid #F3F4F6;">Data</td>
                  <td style="font-size:13px;font-weight:600;color:#111827;padding:10px 0;border-bottom:1px solid #F3F4F6;">22 de Agosto de 2026</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6B7280;padding:10px 0;border-bottom:1px solid #F3F4F6;">Local</td>
                  <td style="font-size:13px;font-weight:600;color:#111827;padding:10px 0;border-bottom:1px solid #F3F4F6;">Aquashow Park, Portugal</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6B7280;padding:10px 0;">Saída</td>
                  <td style="font-size:13px;font-weight:600;color:#111827;padding:10px 0;">05:45 — Igreja Lagoinha Lisboa</td>
                </tr>
              </table>

              <!-- Divisor -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr><td style="height:1px;background-color:#E5E7EB;font-size:0;">&nbsp;</td></tr>
              </table>

              <!-- ── PAGAMENTO (personalizado por método) ── -->
              ${secaoPagamento}

              <!-- Divisor -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr><td style="height:1px;background-color:#E5E7EB;font-size:0;">&nbsp;</td></tr>
              </table>

              <!-- Dúvidas WhatsApp -->
              <p style="margin:0 0 14px;font-size:14px;color:#4B5563;">
                Tens alguma dúvida? Fala com os líderes do Legacy:
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:10px;">
                    <a href="https://wa.me/351961674733?text=Ol%C3%A1%2C%20tenho%20uma%20d%C3%BAvida%20sobre%20a%20minha%20inscri%C3%A7%C3%A3o%20no%20Aquashow%20Legacy%202026." target="_blank" style="display:inline-block;padding:10px 20px;font-size:13px;font-weight:700;color:#FFFFFF;text-decoration:none;background-color:#25D366;border-radius:6px;">Tiago Sampaio</a>
                  </td>
                  <td>
                    <a href="https://wa.me/351961674724?text=Ol%C3%A1%2C%20tenho%20uma%20d%C3%BAvida%20sobre%20a%20minha%20inscri%C3%A7%C3%A3o%20no%20Aquashow%20Legacy%202026." target="_blank" style="display:inline-block;padding:10px 20px;font-size:13px;font-weight:700;color:#FFFFFF;text-decoration:none;background-color:#25D366;border-radius:6px;">Isabella</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── RODAPÉ ── -->
          <tr>
            <td style="background-color:#F8F9FB;border-top:1px solid #E5E7EB;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#374151;">
                Igreja Lagoinha Lisboa
              </p>
              <p style="margin:0 0 12px;font-size:12px;color:#9CA3AF;">
                <a href="mailto:lgcylisboa@gmail.com" style="color:#9CA3AF;text-decoration:none;">lgcylisboa@gmail.com</a>
              </p>
              <p style="margin:0;font-size:11px;color:#D1D5DB;">
                Enviado para ${email} &middot; Ref. ${ref}
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

return [{ json: { ...d, emailHtml: html } }];

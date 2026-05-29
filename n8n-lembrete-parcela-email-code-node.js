const d               = $input.first().json.body;
const num             = d.num              || '1';
const nome            = d.nome             || '—';
const primeiro        = nome.split(' ')[0];
const email           = d.email            || '—';
const preco           = (parseFloat(d.preco) || 0).toFixed(2).replace('.', ',');
const parcelasPagas   = parseInt(d.parcelasPagas)   || 0;
const parcelasTotal   = parseInt(d.parcelasTotal)   || 1;
const pendentes       = parseInt(d.parcelasPendentes) || (parcelasTotal - parcelasPagas);
const ref             = 'AQ-' + String(num).padStart(3, '0');

// Calcular valor estimado por parcela
const valorTotal   = parseFloat(d.preco) || 0;
const valorParcela = parcelasTotal > 0 ? (valorTotal / parcelasTotal).toFixed(2).replace('.', ',') : '—';
const valorRestante = parcelasTotal > 0
  ? ((valorTotal / parcelasTotal) * pendentes).toFixed(2).replace('.', ',')
  : '—';

const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lembrete de Pagamento — Aquashow Legacy 2026</title>
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Pre-header -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#FFFFFF;">
    ${primeiro}, faltam 5 dias para o Aquashow Legacy! Tens ${pendentes} parcela(s) por pagar para garantires a tua vaga.
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
                ⏰ Olá, ${primeiro}!
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#4B5563;line-height:1.7;">
                Faltam apenas <strong style="color:#111827;">5 dias</strong> para o <strong style="color:#111827;">Aquashow Legacy 2026</strong>! Ainda tens <strong style="color:#E00000;">${pendentes} parcela(s) por pagar</strong> para garantires a tua vaga e receberes o teu bilhete.
              </p>

              <!-- Card de aviso -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF3CD;border:1px solid #FBBF24;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 22px;">
                    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#92400E;">⚠️ O teu bilhete ainda não foi enviado</p>
                    <p style="margin:0;font-size:13px;color:#78350F;line-height:1.6;">
                      O bilhete com QR code só é enviado após a <strong>confirmação do pagamento total</strong>. Trata da tua parcela o quanto antes para garantires a tua entrada no evento!
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Resumo parcelas -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8F9FB;border-radius:8px;margin-bottom:32px;border:1px solid #E5E7EB;">
                <tr>
                  <td style="padding:18px 22px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">Referência</p>
                          <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#111827;letter-spacing:0.04em;">${ref}</p>
                        </td>
                        <td align="center">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">Parcelas</p>
                          <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#111827;">${parcelasPagas}/${parcelasTotal}</p>
                        </td>
                        <td align="right">
                          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">Valor em falta</p>
                          <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#E00000;">€ ${valorRestante}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divisor -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr><td style="height:1px;background-color:#E5E7EB;font-size:0;">&nbsp;</td></tr>
              </table>

              <!-- Como pagar -->
              <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111827;">Como pagar?</p>
              <p style="margin:0 0 22px;font-size:14px;color:#4B5563;line-height:1.7;">
                Efectua o pagamento de <strong style="color:#111827;">€ ${valorRestante}</strong> e indica a referência <strong style="color:#111827;">${ref}</strong> no comprovativo.
              </p>

              <!-- Botão link pagamento -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background-color:#FFB938;border-radius:8px;text-align:center;">
                    <a href="https://aquashow.inpeaceapp.com" target="_blank"
                       style="display:block;padding:15px 32px;font-size:15px;font-weight:700;color:#06204D;text-decoration:none;letter-spacing:0.02em;">
                      💳 &nbsp;Pagar Online →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Separador "ou" -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                <tr>
                  <td style="width:45%;height:1px;background-color:#E5E7EB;font-size:0;">&nbsp;</td>
                  <td style="width:10%;text-align:center;font-size:12px;color:#9CA3AF;font-weight:600;padding:0 8px;">ou</td>
                  <td style="width:45%;height:1px;background-color:#E5E7EB;font-size:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Cards MBWay + IBAN -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr valign="top">
                  <td width="48%" style="background:#F8F9FB;border:1px solid #E5E7EB;border-radius:8px;padding:16px 18px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#111827;">📱 MBWay</p>
                    <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;letter-spacing:0.08em;text-transform:uppercase;">Número</p>
                    <p style="margin:0 0 10px;font-size:15px;font-weight:800;color:#111827;letter-spacing:0.04em;">MBWAY_NUMERO_AQUI</p>
                    <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.6;">Envia o comprovativo com a ref. <strong style="color:#111827;">${ref}</strong> no campo descrição.</p>
                  </td>
                  <td width="4%">&nbsp;</td>
                  <td width="48%" style="background:#F8F9FB;border:1px solid #E5E7EB;border-radius:8px;padding:16px 18px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#111827;">🏦 Transferência</p>
                    <p style="margin:0 0 4px;font-size:11px;color:#9CA3AF;letter-spacing:0.08em;text-transform:uppercase;">IBAN</p>
                    <p style="margin:0 0 4px;font-size:12px;font-weight:800;color:#111827;letter-spacing:0.02em;word-break:break-all;">IBAN_AQUI</p>
                    <p style="margin:0 0 10px;font-size:11px;color:#6B7280;">Titular: <strong style="color:#111827;">TITULAR_AQUI</strong></p>
                    <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.6;">Indica <strong style="color:#111827;">${ref}</strong> no descritivo.</p>
                  </td>
                </tr>
              </table>

              <!-- Divisor -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr><td style="height:1px;background-color:#E5E7EB;font-size:0;">&nbsp;</td></tr>
              </table>

              <!-- Dúvidas WhatsApp -->
              <p style="margin:0 0 14px;font-size:14px;color:#4B5563;">
                Precisas de ajuda? Fala com os líderes do Legacy:
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:10px;">
                    <a href="https://wa.me/351961674733?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20pagamento%20do%20Aquashow%20Legacy%202026.%20Ref.%20${ref}" target="_blank" style="display:inline-block;padding:10px 20px;font-size:13px;font-weight:700;color:#FFFFFF;text-decoration:none;background-color:#25D366;border-radius:6px;">Tiago Sampaio</a>
                  </td>
                  <td>
                    <a href="https://wa.me/351961674724?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20pagamento%20do%20Aquashow%20Legacy%202026.%20Ref.%20${ref}" target="_blank" style="display:inline-block;padding:10px 20px;font-size:13px;font-weight:700;color:#FFFFFF;text-decoration:none;background-color:#25D366;border-radius:6px;">Isabella</a>
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

return [{ json: { ...d, lembreteHtml: html } }];

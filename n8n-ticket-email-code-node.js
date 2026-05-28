const d        = $input.first().json.body;
const num      = d.num       || '1';
const nome     = d.nome      || '—';
const primeiro = nome.split(' ')[0];
const contacto = d.contacto  || '—';
const email    = d.email     || '—';
const idade    = d.idade     ? d.idade + ' anos' : '—';
const min      = d.ministerio || '—';
const preco    = (parseFloat(d.preco) || 0).toFixed(2).replace('.', ',');
const ref      = 'AQ-' + String(num).padStart(3, '0');

const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&color=FFFFFF&bgcolor=04112B&data=${encodeURIComponent(ref)}`;

const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>O teu bilhete — Aquashow Legacy 2026</title>
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Pre-header -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#FFFFFF;">
    ${primeiro}, a tua vaga está confirmada! Guarda o teu QR code — precisas dele no dia do evento.
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
                🎉 ${primeiro}, a tua vaga está confirmada!
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#4B5563;line-height:1.7;">
                O teu pagamento foi recebido e a tua participação no <strong style="color:#111827;">Aquashow Legacy 2026</strong> está garantida. Guarda este email — precisas de mostrar o QR code à entrada no dia do evento.
              </p>

              <!-- ── BILHETE ── -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#04112B;border-radius:12px;margin-bottom:24px;overflow:hidden;">
                <tr>
                  <!-- Info lado esquerdo -->
                  <td valign="middle" style="padding:28px 24px;border-right:2px dashed rgba(255,255,255,0.2);">
                    <p style="margin:0 0 18px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.4);">
                      Bilhete de Entrada
                    </p>

                    <p style="margin:0 0 3px;font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.08em;">Referência</p>
                    <p style="margin:0 0 14px;font-size:18px;font-weight:800;color:#FFB938;letter-spacing:0.06em;">${ref}</p>

                    <p style="margin:0 0 3px;font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.08em;">Nome</p>
                    <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#FFFFFF;">${nome}</p>

                    <p style="margin:0 0 3px;font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.08em;">Data</p>
                    <p style="margin:0 0 14px;font-size:14px;font-weight:600;color:#FFFFFF;">22 de Agosto de 2026</p>

                    <p style="margin:0 0 3px;font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.08em;">Saída</p>
                    <p style="margin:0 0 14px;font-size:14px;font-weight:600;color:#FFFFFF;">05:45 — Igreja Lagoinha Lisboa</p>

                    <p style="margin:0 0 3px;font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.08em;">Ministério</p>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#FFFFFF;">${min}</p>
                  </td>

                  <!-- QR code lado direito -->
                  <td align="center" valign="middle" width="170" style="padding:28px 20px;">
                    <img src="${qrUrl}" alt="${ref}" width="130" height="130" style="display:block;border-radius:6px;" />
                    <p style="margin:10px 0 0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:0.08em;text-transform:uppercase;">Mostra à entrada</p>
                  </td>
                </tr>
              </table>

              <!-- Aviso -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF8EC;border:1px solid #FFD98A;border-radius:8px;margin-bottom:32px;">
                <tr>
                  <td style="padding:14px 18px;font-size:13px;color:#92610A;line-height:1.6;">
                    ⚠️ <strong>Este QR code é pessoal e intransmissível.</strong> Será validado à entrada do evento — não o partilhes.
                  </td>
                </tr>
              </table>

              <!-- Divisor -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr><td style="height:1px;background-color:#E5E7EB;font-size:0;">&nbsp;</td></tr>
              </table>

              <!-- Detalhes do evento -->
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;">
                Detalhes do evento
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td width="40%" style="font-size:13px;color:#6B7280;padding:10px 0;border-bottom:1px solid #F3F4F6;">📅 Data</td>
                  <td width="60%" style="font-size:13px;font-weight:600;color:#111827;padding:10px 0;border-bottom:1px solid #F3F4F6;">22 de Agosto de 2026</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6B7280;padding:10px 0;border-bottom:1px solid #F3F4F6;">📍 Local</td>
                  <td style="font-size:13px;font-weight:600;color:#111827;padding:10px 0;border-bottom:1px solid #F3F4F6;">Aquashow Park, Portugal</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6B7280;padding:10px 0;border-bottom:1px solid #F3F4F6;">🚌 Saída</td>
                  <td style="font-size:13px;font-weight:600;color:#111827;padding:10px 0;border-bottom:1px solid #F3F4F6;">05:45 — Igreja Lagoinha Lisboa</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6B7280;padding:10px 0;border-bottom:1px solid #F3F4F6;">🏠 Regresso</td>
                  <td style="font-size:13px;font-weight:600;color:#111827;padding:10px 0;border-bottom:1px solid #F3F4F6;">~22:00 — Lisboa</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6B7280;padding:10px 0;">✅ Inclui</td>
                  <td style="font-size:13px;font-weight:600;color:#111827;padding:10px 0;">Transporte · Ingresso · Pequeno-almoço</td>
                </tr>
              </table>

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
                    <a href="https://wa.me/351961674733?text=Ol%C3%A1%2C%20tenho%20uma%20d%C3%BAvida%20sobre%20o%20Aquashow%20Legacy%202026." target="_blank" style="display:inline-block;padding:10px 20px;font-size:13px;font-weight:700;color:#FFFFFF;text-decoration:none;background-color:#25D366;border-radius:6px;">Tiago Sampaio</a>
                  </td>
                  <td>
                    <a href="https://wa.me/351961674724?text=Ol%C3%A1%2C%20tenho%20uma%20d%C3%BAvida%20sobre%20o%20Aquashow%20Legacy%202026." target="_blank" style="display:inline-block;padding:10px 20px;font-size:13px;font-weight:700;color:#FFFFFF;text-decoration:none;background-color:#25D366;border-radius:6px;">Isabella</a>
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

return [{ json: { ...d, ticketHtml: html } }];

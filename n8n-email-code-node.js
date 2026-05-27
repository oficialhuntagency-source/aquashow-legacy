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

const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inscrição Confirmada — Aquashow Legacy 2026</title>
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Pre-header -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#FFFFFF;">
    ${primeiro}, a tua inscrição no Aquashow Legacy está confirmada. Ref. ${ref} · 22 de Agosto de 2026
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFFFF;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Container -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">

          <!-- ── CABEÇALHO ── -->
          <tr>
            <td align="center" style="background-color:#04112B;padding:40px 40px 36px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.5);">
                Igreja Lagoinha Lisboa
              </p>
              <p style="margin:0 0 4px;font-size:34px;font-weight:800;letter-spacing:0.07em;color:#FFFFFF;line-height:1.1;">
                AQUASHOW
              </p>
              <p style="margin:0 0 18px;font-size:34px;font-weight:800;letter-spacing:0.07em;color:#FFB938;line-height:1.1;">
                LEGACY
              </p>
              <p style="margin:0;font-size:13px;font-weight:500;color:rgba(255,255,255,0.55);">
                22 de Agosto de 2026 &middot; Aquashow Park, Portugal
              </p>
            </td>
          </tr>

          <!-- ── CORPO BRANCO ── -->
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

              <!-- Título secção -->
              <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;">
                Dados da inscrição
              </p>

              <!-- Linhas de dados -->
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

              <!-- Pagamento -->
              <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#111827;">Pagamento</p>
              <p style="margin:0 0 22px;font-size:14px;color:#4B5563;line-height:1.7;">
                Para confirmar a tua vaga, efectua o pagamento de <strong style="color:#111827;">€ ${preco}</strong> e indica a referência <strong style="color:#111827;">${ref}</strong> no comprovativo.
              </p>

              <!-- Botão pagamento -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background-color:#FFB938;border-radius:8px;">
                    <a href="LINK_PAGAMENTO_AQUI" target="_blank"
                       style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#06204D;text-decoration:none;letter-spacing:0.02em;">
                      Efectuar Pagamento →
                    </a>
                  </td>
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

/**
 * ============================================================
 *  GOOGLE APPS SCRIPT — AQUASHOW LEGACY  (v4 · n8n Webhook)
 * ============================================================
 *  COMO ATUALIZAR:
 *  1. Abre https://script.google.com/ → projeto "Aquashow Legacy"
 *  2. Seleciona tudo (Ctrl+A) e cola este código
 *  3. Guarda (Ctrl+S)
 *  4. Implementar → Gerir implementações → ✏️ editar → Nova versão → Implementar
 *  ⚠️ A URL NÃO muda — não precisas atualizar o site
 * ============================================================
 */

var SPREADSHEET_ID = '13IyVio1lZykgVGG2gRlV5Xamv-Tx31ERRK6GUOy1j_o';
var SHEET_NAME     = 'Participantes';
var N8N_WEBHOOK    = 'https://huntagency.app.n8n.cloud/webhook/aquashow-inscricao';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['#', 'NOME COMPLETO', 'CONTACTO', 'IDADE', 'MINISTÉRIO',
                       'ESTADO PAGAMENTO', 'EMAIL / LINK', 'DATA REGISTO', 'OBSERVAÇÕES']);
    }

    var hoje = Utilities.formatDate(new Date(), 'Europe/Lisbon', 'dd/MM/yyyy');

    // ── Escanear coluna B (NOME) a partir da linha 2 (ignora cabeçalho) ──
    var maxRows          = sheet.getMaxRows();
    var colB             = sheet.getRange(2, 2, maxRows - 1, 1).getValues();
    var totalInscritos   = 0;
    var ultimaPreenchida = -1;

    for (var i = 0; i < colB.length; i++) {
      var val = String(colB[i][0]).trim();
      if (val !== '' && val !== 'undefined' && val !== 'null') {
        totalInscritos++;
        ultimaPreenchida = i;
      }
    }

    var proximaLinha  = (ultimaPreenchida === -1) ? 2 : (ultimaPreenchida + 2 + 1);
    var numSequencial = totalInscritos + 1;

    // ── Forçar CONTACTO como texto — evita #ERROR! com +351 ──
    sheet.getRange(proximaLinha, 3).setNumberFormat('@STRING@');

    // ── Escrever na planilha ──
    sheet.getRange(proximaLinha, 1, 1, 9).setValues([[
      numSequencial,
      data.nome       || '',
      data.contacto   || '',
      data.idade      || '',
      data.ministerio || '',
      'AGUARDANDO CONFIRMAÇÃO',
      data.email      || '',
      hoje,
      data.obs        || ''
    ]]);

    Logger.log('✅ Inscrito #' + numSequencial + ' — ' + (data.nome || 'sem nome') + ' — linha ' + proximaLinha);

    // ── Disparar webhook n8n (email automático) ──
    try {
      var payload = JSON.stringify({
        num:        numSequencial,
        nome:       data.nome       || '',
        contacto:   data.contacto   || '',
        email:      data.email      || '',
        idade:      data.idade      || '',
        ministerio: data.ministerio || '',
        obs:        data.obs        || '',
        preco:      data.preco      || '',
        dataRegisto: hoje
      });

      var options = {
        method:      'post',
        contentType: 'application/json',
        payload:     payload,
        muteHttpExceptions: true
      };

      var response = UrlFetchApp.fetch(N8N_WEBHOOK, options);
      Logger.log('📨 Webhook n8n: ' + response.getResponseCode());
    } catch (webhookErr) {
      Logger.log('⚠️ Erro webhook n8n: ' + webhookErr.toString());
      // Não bloqueia a inscrição se o webhook falhar
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, num: numSequencial }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('❌ Erro doPost: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'OK', msg: 'Aquashow Script activo ✅ (v4 · n8n Webhook)' }))
    .setMimeType(ContentService.MimeType.JSON);
}

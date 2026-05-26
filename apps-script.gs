/**
 * ============================================================
 *  GOOGLE APPS SCRIPT — AQUASHOW LEGACY  (v3)
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
    var maxRows   = sheet.getMaxRows();
    var colB      = sheet.getRange(2, 2, maxRows - 1, 1).getValues();

    var totalInscritos  = 0;
    var ultimaPreenchida = -1; // índice (0-based) na colB

    for (var i = 0; i < colB.length; i++) {
      var val = String(colB[i][0]).trim();
      if (val !== '' && val !== 'undefined' && val !== 'null') {
        totalInscritos++;
        ultimaPreenchida = i;
      }
    }

    // Linha onde vamos escrever = logo após a última preenchida
    // Se não há inscrições, começa na linha 2 (primeiro registo)
    var proximaLinha = (ultimaPreenchida === -1) ? 2 : (ultimaPreenchida + 2 + 1);
    // Explicação: +2 porque colB começa em linha 2 do sheet, +1 para ir à próxima

    var numSequencial = totalInscritos + 1;

    // ── Forçar CONTACTO (col 3) como texto — evita #ERROR! com +351/00351 ──
    sheet.getRange(proximaLinha, 3).setNumberFormat('@STRING@');

    // ── Escrever todos os campos de uma vez ──
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
    .createTextOutput(JSON.stringify({ status: 'OK', msg: 'Aquashow Script activo ✅' }))
    .setMimeType(ContentService.MimeType.JSON);
}

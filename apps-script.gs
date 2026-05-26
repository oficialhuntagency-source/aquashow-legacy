/**
 * ============================================================
 *  GOOGLE APPS SCRIPT — AQUASHOW LEGACY
 *  Cole este código no Apps Script e faça o deploy como Web App
 * ============================================================
 *
 *  INSTRUÇÕES DE DEPLOY:
 *  1. Vai a https://script.google.com/
 *  2. Clica em "Novo projecto"
 *  3. Cola TODO este código (substituindo o que está)
 *  4. Clica em "Implementar" → "Nova implementação"
 *  5. Tipo: "App da Web"
 *  6. Executar como: "Eu (teu email)"
 *  7. Quem tem acesso: "Qualquer pessoa"
 *  8. Clica em "Implementar" e autoriza
 *  9. Copia a URL que aparece e cola no index.html (APPS_SCRIPT_URL)
 * ============================================================
 */

// ID da tua planilha (já configurado)
var SPREADSHEET_ID = '13IyVio1lZykgVGG2gRlV5Xamv-Tx31ERRK6GUOy1j_o';
var SHEET_NAME     = 'Participantes'; // nome do separador

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      // Se o separador não existir, cria com cabeçalho
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['#', 'NOME COMPLETO', 'CONTACTO', 'IDADE', 'MINISTÉRIO',
                       'ESTADO PAGAMENTO', 'EMAIL / LINK', 'DATA REGISTO', 'OBSERVAÇÕES']);
    }

    var hoje = Utilities.formatDate(new Date(), 'Europe/Lisbon', 'dd/MM/yyyy');

    // Determinar próxima linha (pula cabeçalho)
    var lastRow = sheet.getLastRow();
    var nextNum = Math.max(1, lastRow); // número sequencial
    var nextRow = lastRow + 1;

    // Escrever linha com formatação correta
    var rowData = [
      nextNum,                       // # (número sequencial)
      data.nome       || '',         // NOME COMPLETO
      data.contacto   || '',         // CONTACTO (WhatsApp)
      data.idade      || '',         // IDADE
      data.ministerio || '',         // MINISTÉRIO
      'AGUARDANDO CONFIRMAÇÃO',      // ESTADO PAGAMENTO (padrão ao inscrever)
      data.email      || '',         // EMAIL (para enviar link de pagamento)
      hoje,                          // DATA REGISTO
      data.obs        || ''          // OBSERVAÇÕES
    ];

    var range = sheet.getRange(nextRow, 1, 1, rowData.length);
    // Forçar coluna CONTACTO (col 3) como texto para evitar #ERROR! com +351
    range.getCell(1, 3).setNumberFormat('@STRING@');
    range.setValues([rowData]);

    // Resposta de sucesso
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Inscrito com sucesso!' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // Log do erro e resposta de erro
    Logger.log('Erro: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Necessário para testar no browser (GET request)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'OK', msg: 'Aquashow Script activo ✅' }))
    .setMimeType(ContentService.MimeType.JSON);
}

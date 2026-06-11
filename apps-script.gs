/**
 * ============================================================
 *  GOOGLE APPS SCRIPT — AQUASHOW LEGACY  (v13 · Auto-Triggers)
 * ============================================================
 *  COMO INSTALAR (apenas UMA VEZ):
 *  1. Abre https://script.google.com/ → projeto "Aquashow Legacy"
 *  2. Seleciona tudo (Ctrl+A) e cola este código
 *  3. Guarda (Ctrl+S)
 *  4. No menu de funções, selecciona "instalarTriggers" → clica ▶ Executar
 *  5. Aceita as permissões quando pedido
 *  6. Implementar → Gerir implementações → ✏️ editar → Nova versão → Implementar
 *  ⚠️ A URL NÃO muda — não precisas atualizar o site
 *
 *  OS TRIGGERS SÃO INSTALADOS AUTOMATICAMENTE — não precisas de ir a "Acionadores"
 * ============================================================
 *
 *  REGRAS DE NEGÓCIO:
 *  • Ticket só é enviado quando ESTADO PAGAMENTO = "CONFIRMADO ✅"
 *  • Parcelas → equipa actualiza ESTADO manualmente conforme parcelas entram
 *  • Quando equipa muda para "CONFIRMADO ✅" → ticket enviado automaticamente
 *  • 5 dias antes do evento (17/08) → lembrete a quem ainda não tem ticket
 * ============================================================
 */

var SPREADSHEET_ID     = '13IyVio1lZykgVGG2gRlV5Xamv-Tx31ERRK6GUOy1j_o';
var SHEET_NAME         = 'Participantes';
var N8N_INSCRICAO      = 'https://huntagency.app.n8n.cloud/webhook/aquashow-inscricao';
var N8N_TICKET         = 'https://huntagency.app.n8n.cloud/webhook/aquashow-confirmar-pagamento';
var N8N_LEMBRETE       = 'https://huntagency.app.n8n.cloud/webhook/aquashow-lembrete-parcela';

// Colunas da sheet (índice 1 = col A)
var COL_NUM            = 1;   // A — #
var COL_NOME           = 2;   // B — NOME COMPLETO
var COL_CONTACTO       = 3;   // C — CONTACTO
var COL_IDADE          = 4;   // D — IDADE
var COL_MINISTERIO     = 5;   // E — MINISTÉRIO
var COL_ESTADO         = 6;   // F — ESTADO PAGAMENTO
var COL_EMAIL          = 7;   // G — EMAIL / LINK
var COL_DATA           = 8;   // H — DATA REGISTO
var COL_OBS            = 9;   // I — OBSERVAÇÕES
var COL_PARCELAS       = 10;  // J — PARCELAS (ex: "1/2", "2/2", "1/1")
var COL_PRECO          = 11;  // K — PREÇO (€)
var COL_METODO         = 12;  // L — MÉTODO PAGAMENTO (mbway|iban|link|parcelado)

// ──────────────────────────────────────────────────────────────
//  INSCRIÇÃO — recebe POST do site
// ──────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['#', 'NOME COMPLETO', 'CONTACTO', 'IDADE', 'MINISTÉRIO',
                       'ESTADO PAGAMENTO', 'EMAIL / LINK', 'DATA REGISTO', 'OBSERVAÇÕES',
                       'PARCELAS', 'PREÇO']);
    }

    var hoje = Utilities.formatDate(new Date(), 'Europe/Lisbon', 'dd/MM/yyyy');

    // Calcular próxima linha
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

    // Forçar CONTACTO como texto
    sheet.getRange(proximaLinha, COL_CONTACTO).setNumberFormat('@STRING@');

    // Calcular parcelas iniciais com base no método enviado pelo site
    var parcelasInicial = data.parcelas || '1/1';

    // Escrever na planilha (com PARCELAS, PREÇO e MÉTODO)
    sheet.getRange(proximaLinha, 1, 1, 12).setValues([[
      numSequencial,
      data.nome            || '',
      data.contacto        || '',
      data.idade           || '',
      data.ministerio      || '',
      'AGUARDANDO CONFIRMAÇÃO',
      data.email           || '',
      hoje,
      data.obs             || '',
      parcelasInicial,              // ex: "1/1", "1/2", "1/3"
      data.preco           || '',
      data.metodoPagamento || 'link' // mbway | iban | link | parcelado
    ]]);

    Logger.log('💳 Método: ' + (data.metodoPagamento || 'link') + ' | Parcelas: ' + parcelasInicial);

    Logger.log('✅ Inscrito #' + numSequencial + ' — ' + (data.nome || 'sem nome'));

    // Disparar webhook n8n — email de inscrição
    _dispararWebhook(N8N_INSCRICAO, {
      num:              numSequencial,
      nome:             data.nome             || '',
      contacto:         data.contacto         || '',
      email:            data.email            || '',
      idade:            data.idade            || '',
      ministerio:       data.ministerio       || '',
      obs:              data.obs              || '',
      preco:            data.preco            || '',
      metodoPagamento:  data.metodoPagamento  || 'link',
      parcelas:         parcelasInicial,
      numParcelas:      data.numParcelas      || '1x',
      dataRegisto:      hoje
    });

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

// ──────────────────────────────────────────────────────────────
//  TRIGGER DE EDIÇÃO — instalável (não simples)
//  Detecta quando ESTADO PAGAMENTO muda para "CONFIRMADO ✅"
//  e envia o email de ticket automaticamente
// ──────────────────────────────────────────────────────────────
function onEditInstalavel(e) {
  try {
    var sheet = e.source.getActiveSheet();
    if (sheet.getName() !== SHEET_NAME) return;

    var range = e.range;
    var col   = range.getColumn();
    var row   = range.getRow();

    // Só interessa a coluna ESTADO PAGAMENTO (F) e linhas de dados (a partir da 2)
    if (col !== COL_ESTADO || row < 2) return;

    var novoEstado = String(range.getValue()).trim();

    // Só actua quando muda para CONFIRMADO ✅
    if (novoEstado !== 'CONFIRMADO ✅') return;

    // Já foi enviado antes? Evitar duplicados
    var estadoActual = sheet.getRange(row, COL_ESTADO).getValue();
    if (String(estadoActual).indexOf('TICKET') !== -1) return;

    // Ler dados da linha
    var linha = sheet.getRange(row, 1, 1, 11).getValues()[0];
    var num        = linha[COL_NUM - 1];
    var nome       = linha[COL_NOME - 1];
    var contacto   = linha[COL_CONTACTO - 1];
    var idade      = linha[COL_IDADE - 1];
    var ministerio = linha[COL_MINISTERIO - 1];
    var emailAddr  = linha[COL_EMAIL - 1];
    var obs        = linha[COL_OBS - 1];
    var parcelas   = linha[COL_PARCELAS - 1];
    var preco      = linha[COL_PRECO - 1];

    if (!emailAddr || String(emailAddr).indexOf('@') === -1) {
      Logger.log('⚠️ Email inválido para linha ' + row + ': ' + emailAddr);
      return;
    }

    Logger.log('🎟️ Confirmado! A enviar ticket para ' + nome + ' (' + emailAddr + ')');

    // Enviar ticket via n8n
    var sucesso = _dispararWebhook(N8N_TICKET, {
      num:        num,
      nome:       nome,
      contacto:   contacto,
      email:      emailAddr,
      idade:      idade,
      ministerio: ministerio,
      obs:        obs,
      preco:      preco,
      parcelas:   parcelas
    });

    if (sucesso) {
      // Actualizar estado para TICKET ENVIADO ✅
      sheet.getRange(row, COL_ESTADO).setValue('TICKET ENVIADO ✅');
      Logger.log('✅ Ticket enviado e estado actualizado — linha ' + row);
    }

  } catch (err) {
    Logger.log('❌ Erro onEditInstalavel: ' + err.toString());
  }
}

// ──────────────────────────────────────────────────────────────
//  LEMBRETE DE PARCELAS — executar 5 dias antes (17/08/2026)
//  Instalar como trigger: Time-driven → Data específica → 17/08/2026 09:00
// ──────────────────────────────────────────────────────────────
function enviarLembreteParcelas() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  var dados = sheet.getDataRange().getValues();
  var enviados = 0;

  for (var i = 1; i < dados.length; i++) {  // começa em 1 para saltar cabeçalho
    var linha      = dados[i];
    var num        = linha[COL_NUM - 1];
    var nome       = linha[COL_NOME - 1];
    var estado     = String(linha[COL_ESTADO - 1]).trim();
    var emailAddr  = String(linha[COL_EMAIL - 1]).trim();
    var contacto   = linha[COL_CONTACTO - 1];
    var idade      = linha[COL_IDADE - 1];
    var ministerio = linha[COL_MINISTERIO - 1];
    var parcelas   = String(linha[COL_PARCELAS - 1]).trim();  // ex: "1/2"
    var preco      = linha[COL_PRECO - 1];

    // Saltar linhas vazias, já confirmadas ou sem email válido
    if (!nome || !emailAddr || emailAddr.indexOf('@') === -1) continue;
    if (estado === 'CONFIRMADO ✅' || estado === 'TICKET ENVIADO ✅') continue;

    // Calcular parcelas pendentes
    var parcelasInfo = _parseParcelas(parcelas);
    var pendentes    = parcelasInfo.total - parcelasInfo.pagas;

    if (pendentes <= 0) continue;  // tudo pago, não lembrar

    Logger.log('📩 Enviando lembrete para ' + nome + ' (' + emailAddr + ') — ' + pendentes + ' parcela(s) pendente(s)');

    _dispararWebhook(N8N_LEMBRETE, {
      num:             num,
      nome:            nome,
      contacto:        contacto,
      email:           emailAddr,
      idade:           idade,
      ministerio:      ministerio,
      preco:           preco,
      parcelas:        parcelas,
      parcelasPagas:   parcelasInfo.pagas,
      parcelasTotal:   parcelasInfo.total,
      parcelasPendentes: pendentes
    });

    enviados++;
    Utilities.sleep(500);  // pequena pausa entre envios
  }

  Logger.log('✅ Lembretes enviados: ' + enviados);
}

// ──────────────────────────────────────────────────────────────
//  AUXILIARES
// ──────────────────────────────────────────────────────────────

/**
 * Faz parse de "2/3" → { pagas: 2, total: 3 }
 * Aceita também "2" → { pagas: 2, total: 2 } (interpretado como pago)
 */
function _parseParcelas(str) {
  str = String(str).trim();
  var partes = str.split('/');
  if (partes.length === 2) {
    return {
      pagas: parseInt(partes[0]) || 0,
      total: parseInt(partes[1]) || 1
    };
  }
  var n = parseInt(str) || 1;
  return { pagas: n, total: n };
}

/**
 * Dispara webhook n8n com os dados fornecidos.
 * Retorna true se HTTP 200/202, false caso contrário.
 */
function _dispararWebhook(url, dados) {
  try {
    var options = {
      method:      'post',
      contentType: 'application/json',
      payload:     JSON.stringify(dados),
      muteHttpExceptions: true
    };
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    Logger.log('📡 Webhook ' + url + ' → HTTP ' + code);
    return (code >= 200 && code < 300);
  } catch (err) {
    Logger.log('⚠️ Erro webhook ' + url + ': ' + err.toString());
    return false;
  }
}

// ──────────────────────────────────────────────────────────────
//  INSTALAÇÃO AUTOMÁTICA DE TRIGGERS
//  Correr UMA VEZ após colar o código no Apps Script
// ──────────────────────────────────────────────────────────────

/**
 * Instala todos os triggers necessários automaticamente.
 * Correr apenas UMA VEZ no editor do Apps Script.
 * Remove triggers antigos antes de criar novos (evita duplicados).
 */
function instalarTriggers() {
  // 1. Remover todos os triggers existentes deste projecto
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  Logger.log('🗑️ Triggers antigos removidos: ' + triggers.length);

  // 2. Trigger de edição — detecta CONFIRMADO ✅ e envia ticket
  ScriptApp.newTrigger('onEditInstalavel')
    .forSpreadsheet(SPREADSHEET_ID)
    .onEdit()
    .create();
  Logger.log('✅ Trigger onEdit instalado → onEditInstalavel');

  // 3. Trigger de lembrete — 17/08/2026 às 09:00 (Lisboa = UTC+1 em Agosto)
  var dataLembrete = new Date(2026, 7, 17, 9, 0, 0); // mês 7 = Agosto (0-indexed)
  ScriptApp.newTrigger('enviarLembreteParcelas')
    .timeBased()
    .at(dataLembrete)
    .create();
  Logger.log('✅ Trigger agendado para 17/08/2026 09:00 → enviarLembreteParcelas');

  // 4. Confirmar na UI
  SpreadsheetApp.getUi().alert(
    '✅ Triggers instalados com sucesso!\n\n' +
    '• onEditInstalavel — activo agora\n' +
    '  Detecta CONFIRMADO ✅ e envia ticket automaticamente\n\n' +
    '• enviarLembreteParcelas — agendado para 17/08/2026 às 09:00\n' +
    '  Envia lembrete a quem ainda tem parcelas por pagar\n\n' +
    'Podes verificar em: Extensões → Apps Script → Acionadores'
  );
}

/**
 * Mostra os triggers instalados actualmente.
 * Útil para verificar se está tudo bem.
 */
function verificarTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  var info = '📋 Triggers instalados (' + triggers.length + '):\n\n';

  if (triggers.length === 0) {
    info += '⚠️ Nenhum trigger instalado.\nCorre a função instalarTriggers()';
  } else {
    triggers.forEach(function(t) {
      var tipo = t.getEventType();
      var fn   = t.getHandlerFunction();
      info += '• ' + fn + ' → ' + tipo + '\n';
    });
  }

  SpreadsheetApp.getUi().alert(info);
  Logger.log(info);
}

/**
 * Menu personalizado na planilha — aparece ao abrir
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚡ Aquashow')
    .addItem('▶ Instalar Triggers (1ª vez)', 'instalarTriggers')
    .addItem('🔍 Verificar Triggers', 'verificarTriggers')
    .addItem('📩 Enviar Lembretes Agora', 'enviarLembreteParcelas')
    .addToUi();
}

function doGet(e) {
  // Verificar estado dos triggers para diagnóstico
  var triggers = ScriptApp.getProjectTriggers();
  var triggerInfo = triggers.map(function(t) {
    return t.getHandlerFunction() + ' (' + t.getEventType() + ')';
  });

  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'OK',
      msg: 'Aquashow Script activo ✅ (v13 · Auto-Triggers)',
      triggers_instalados: triggerInfo,
      regras: [
        'Ticket enviado automaticamente ao mudar estado para CONFIRMADO ✅',
        'Parcelas: actualizar coluna J (ex: 1/2, 2/2)',
        'Lembrete automático agendado para 17/08/2026 09:00'
      ]
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

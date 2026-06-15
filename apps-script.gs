/**
 * ============================================================
 *  GOOGLE APPS SCRIPT — AQUASHOW LEGACY  (v14 · Bilhética + Chamada Ida/Volta)
 * ============================================================
 *  COMO INSTALAR / ACTUALIZAR:
 *  1. Abre https://script.google.com/ → projeto "Aquashow Legacy"
 *  2. Seleciona tudo (Ctrl+A) e cola este código
 *  3. Guarda (Ctrl+S)
 *  4. Menu da planilha "⚡ Aquashow" → "▶ Instalar/Actualizar Sistema (1ª vez)"
 *     (instala triggers + prepara as colunas M/N/O)
 *  5. Implementar → Gerir implementações → ✏️ editar → Nova versão → Implementar
 *  ⚠️ A URL NÃO muda — não precisas atualizar o site
 * ============================================================
 *
 *  REGRAS DE NEGÓCIO:
 *  • Ticket (QR) só é enviado quando ESTADO PAGAMENTO = "CONFIRMADO ✅"
 *  • Ao confirmar → gera TOKEN secreto (col M) + envia email com QR do token
 *  • DIA DO EVENTO:
 *      - Scanner em modo IDA   → carimba "EMBARQUE IDA"   (col N)
 *      - Scanner em modo VOLTA → carimba "EMBARQUE VOLTA" (col O)
 *  • Painel da volta mostra quem ainda FALTA embarcar (segurança)
 * ============================================================
 */

var SPREADSHEET_ID     = '13IyVio1lZykgVGG2gRlV5Xamv-Tx31ERRK6GUOy1j_o';
var SHEET_NAME         = 'Participantes';
var N8N_INSCRICAO      = 'https://huntagency.app.n8n.cloud/webhook/aquashow-inscricao';
var N8N_TICKET         = 'https://huntagency.app.n8n.cloud/webhook/aquashow-confirmar-pagamento';
var N8N_LEMBRETE       = 'https://huntagency.app.n8n.cloud/webhook/aquashow-lembrete-parcela';
var TZ                 = 'Europe/Lisbon';

// Estados que contam como "tem bilhete válido"
var ESTADOS_VALIDOS    = ['CONFIRMADO ✅', 'TICKET ENVIADO ✅'];

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
var COL_METODO         = 12;  // L — MÉTODO PAGAMENTO
var COL_TOKEN          = 13;  // M — TOKEN SECRETO (QR)
var COL_EMBARQUE_IDA   = 14;  // N — EMBARQUE IDA (hora)
var COL_EMBARQUE_VOLTA = 15;  // O — EMBARQUE VOLTA (hora)
var TOTAL_COLS         = 15;

// ══════════════════════════════════════════════════════════════
//  ROTEADOR HTTP
// ══════════════════════════════════════════════════════════════

/**
 * GET — usado pelo SCANNER e PAINEL (pedidos "simples", sem preflight CORS).
 *   ?action=lista     → lista de confirmados (para o scanner guardar offline)
 *   ?action=painel    → contagens + quem falta (ida/volta)
 *   ?action=relatorio → dados completos para relatório
 *   (sem action)      → diagnóstico/estado
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action) : 'ping';
  try {
    switch (action) {
      case 'lista':     return _jsonOut(_handleLista());
      case 'painel':    return _jsonOut(_handlePainel());
      case 'relatorio': return _jsonOut(_handleRelatorio());
      default:          return _jsonOut(_handlePing());
    }
  } catch (err) {
    Logger.log('❌ doGet[' + action + ']: ' + err);
    return _jsonOut({ ok: false, action: action, error: String(err) });
  }
}

/**
 * POST — INSCRIÇÃO (site) ou SINCRONIZAÇÃO de embarques (scanner).
 * O scanner envia { action: "sync", ... } em text/plain (evita preflight CORS).
 */
function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return _jsonOut({ ok: false, error: 'JSON inválido: ' + err });
  }

  if (data && data.action === 'sync') {
    try {
      return _jsonOut(_handleSync(data));
    } catch (err) {
      Logger.log('❌ doPost[sync]: ' + err);
      return _jsonOut({ ok: false, error: String(err) });
    }
  }

  // Caso contrário → inscrição vinda do site
  return _handleInscricao(data);
}

// ══════════════════════════════════════════════════════════════
//  INSCRIÇÃO — grava na planilha + dispara email de pré-inscrição
// ══════════════════════════════════════════════════════════════
function _handleInscricao(data) {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['#', 'NOME COMPLETO', 'CONTACTO', 'IDADE', 'MINISTÉRIO',
                       'ESTADO PAGAMENTO', 'EMAIL / LINK', 'DATA REGISTO', 'OBSERVAÇÕES',
                       'PARCELAS', 'PREÇO', 'MÉTODO PAGAMENTO',
                       'TOKEN', 'EMBARQUE IDA', 'EMBARQUE VOLTA']);
    }

    var hoje = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');

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

    var parcelasInicial = data.parcelas || '1/1';

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
      parcelasInicial,
      data.preco           || '',
      data.metodoPagamento || 'link'
    ]]);

    Logger.log('✅ Inscrito #' + numSequencial + ' — ' + (data.nome || 'sem nome'));

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

    return _jsonOut({ success: true, num: numSequencial });

  } catch (err) {
    Logger.log('❌ Erro inscrição: ' + err.toString());
    return _jsonOut({ success: false, error: err.toString() });
  }
}

// ══════════════════════════════════════════════════════════════
//  CONFIRMAÇÃO DE PAGAMENTO → gera TOKEN + envia ticket (QR)
//  Trigger onEdit instalável: dispara quando ESTADO = "CONFIRMADO ✅"
// ══════════════════════════════════════════════════════════════
function onEditInstalavel(e) {
  try {
    var sheet = e.source.getActiveSheet();
    if (sheet.getName() !== SHEET_NAME) return;

    var range = e.range;
    if (range.getColumn() !== COL_ESTADO || range.getRow() < 2) return;

    var row        = range.getRow();
    var novoEstado = String(range.getValue()).trim();
    if (novoEstado !== 'CONFIRMADO ✅') return;

    // Evitar duplicados: se já tem token + estado TICKET, não reenvia
    var linha = sheet.getRange(row, 1, 1, TOTAL_COLS).getValues()[0];
    var emailAddr = linha[COL_EMAIL - 1];

    if (!emailAddr || String(emailAddr).indexOf('@') === -1) {
      Logger.log('⚠️ Email inválido na linha ' + row + ': ' + emailAddr);
      return;
    }

    // Gerar token se ainda não existir (idempotente)
    var token = String(linha[COL_TOKEN - 1]).trim();
    if (!token) {
      token = _gerarToken();
      sheet.getRange(row, COL_TOKEN).setNumberFormat('@STRING@').setValue(token);
    }

    Logger.log('🎟️ Confirmado! Token=' + token + ' → ' + linha[COL_NOME - 1] + ' (' + emailAddr + ')');

    var sucesso = _dispararWebhook(N8N_TICKET, {
      num:        linha[COL_NUM - 1],
      nome:       linha[COL_NOME - 1],
      contacto:   linha[COL_CONTACTO - 1],
      email:      emailAddr,
      idade:      linha[COL_IDADE - 1],
      ministerio: linha[COL_MINISTERIO - 1],
      obs:        linha[COL_OBS - 1],
      preco:      linha[COL_PRECO - 1],
      parcelas:   linha[COL_PARCELAS - 1],
      token:      token   // ← QR passa a conter o TOKEN secreto
    });

    if (sucesso) {
      sheet.getRange(row, COL_ESTADO).setValue('TICKET ENVIADO ✅');
      Logger.log('✅ Ticket enviado — linha ' + row);
    }

  } catch (err) {
    Logger.log('❌ Erro onEditInstalavel: ' + err.toString());
  }
}

// ══════════════════════════════════════════════════════════════
//  SCANNER / PAINEL — handlers
// ══════════════════════════════════════════════════════════════

/**
 * Lista de confirmados para o scanner guardar e validar OFFLINE.
 * Devolve apenas quem tem bilhete válido (estado confirmado + token).
 */
function _handleLista() {
  var parts = _lerParticipantes();
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    if (!p.token) continue;
    if (ESTADOS_VALIDOS.indexOf(p.estado) === -1) continue;
    out.push({
      token:      p.token,
      num:        p.num,
      nome:       p.nome,
      primeiro:   p.nome.split(' ')[0],
      ministerio: p.ministerio,
      contacto:   String(p.contacto),
      ida:        p.ida,
      volta:      p.volta
    });
  }
  return {
    ok: true,
    geradoEm: Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ss"),
    total: out.length,
    participantes: out
  };
}

/**
 * Sincroniza embarques vindos do scanner (online ou fila offline).
 * Payload: { action:"sync", dispositivo:"...", registos:[{token, modo, hora}] }
 *   modo: "ida" | "volta"  ·  hora: ISO opcional (senão usa a hora do servidor)
 * Escrita idempotente (mantém o 1º carimbo). Usa LockService (anti-corrida).
 * Devolve o estado AUTORITATIVO de cada token para o scanner reconciliar.
 */
function _handleSync(data) {
  var registos = (data && data.registos) || [];
  if (!registos.length) return { ok: true, resultados: [] };

  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // espera até 30s para evitar escritas concorrentes

  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    var dados = sheet.getDataRange().getValues(); // inclui cabeçalho (linha 0)

    // Index token → nº de linha (1-based na sheet)
    var idx = {};
    for (var r = 1; r < dados.length; r++) {
      var tk = String(dados[r][COL_TOKEN - 1]).trim();
      if (tk) idx[tk] = r + 1;
    }

    var resultados = [];

    for (var i = 0; i < registos.length; i++) {
      var reg   = registos[i] || {};
      var token = String(reg.token || '').trim();
      var modo  = String(reg.modo || '').toLowerCase();
      var horaReg = reg.hora ? new Date(reg.hora) : new Date();
      var horaStr = Utilities.formatDate(horaReg, TZ, 'dd/MM HH:mm:ss');

      if (!token || (modo !== 'ida' && modo !== 'volta')) {
        resultados.push({ token: token, status: 'ERRO', msg: 'Pedido inválido' });
        continue;
      }

      var linhaSheet = idx[token];
      if (!linhaSheet) {
        resultados.push({ token: token, status: 'INVALIDO', msg: 'Bilhete não encontrado' });
        continue;
      }

      var arr    = dados[linhaSheet - 1];
      var estado = String(arr[COL_ESTADO - 1]).trim();
      var nome   = arr[COL_NOME - 1];

      if (ESTADOS_VALIDOS.indexOf(estado) === -1) {
        resultados.push({ token: token, status: 'NAO_PAGO', nome: nome, msg: 'Pagamento não confirmado' });
        continue;
      }

      var colAlvo  = (modo === 'ida') ? COL_EMBARQUE_IDA : COL_EMBARQUE_VOLTA;
      var jaCarimbo = String(arr[colAlvo - 1]).trim();

      if (jaCarimbo) {
        // Já embarcou neste modo → duplicado (mantém o 1º registo)
        resultados.push({
          token: token, status: 'DUPLICADO', nome: nome, modo: modo,
          ida: String(arr[COL_EMBARQUE_IDA - 1]).trim(),
          volta: String(arr[COL_EMBARQUE_VOLTA - 1]).trim(),
          msg: 'Já tinha embarcado às ' + jaCarimbo
        });
        continue;
      }

      // Carimbar (1ª vez)
      sheet.getRange(linhaSheet, colAlvo).setNumberFormat('@STRING@').setValue(horaStr);
      arr[colAlvo - 1] = horaStr; // refletir no array local

      resultados.push({
        token: token, status: 'OK', nome: nome, modo: modo,
        ida: String(arr[COL_EMBARQUE_IDA - 1]).trim(),
        volta: String(arr[COL_EMBARQUE_VOLTA - 1]).trim(),
        hora: horaStr
      });
    }

    SpreadsheetApp.flush();
    return { ok: true, resultados: resultados };

  } finally {
    lock.releaseLock();
  }
}

/**
 * Painel: contagens + lista de quem FALTA embarcar (ida e volta).
 */
function _handlePainel() {
  var parts = _lerParticipantes().filter(function(p) {
    return p.token && ESTADOS_VALIDOS.indexOf(p.estado) !== -1;
  });

  var total = parts.length;
  var embIda = 0, embVolta = 0;
  var faltamIda = [], faltamVolta = [];

  parts.forEach(function(p) {
    if (p.ida) embIda++; else faltamIda.push(_resumoPessoa(p));
    if (p.volta) embVolta++; else faltamVolta.push(_resumoPessoa(p));
  });

  return {
    ok: true,
    atualizado: Utilities.formatDate(new Date(), TZ, 'HH:mm:ss'),
    total: total,
    ida:   { embarcaram: embIda,   faltam: faltamIda.length,   lista: faltamIda },
    volta: { embarcaram: embVolta, faltam: faltamVolta.length, lista: faltamVolta }
  };
}

/**
 * Relatório completo pós-evento.
 */
function _handleRelatorio() {
  var parts = _lerParticipantes();
  var linhas = parts.map(function(p) {
    return {
      num: p.num, nome: p.nome, ministerio: p.ministerio, contacto: String(p.contacto),
      estado: p.estado, ida: p.ida, volta: p.volta,
      embarcouIda: !!p.ida, embarcouVolta: !!p.volta
    };
  });
  var confirmados = parts.filter(function(p){ return ESTADOS_VALIDOS.indexOf(p.estado) !== -1; });
  return {
    ok: true,
    geradoEm: Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm'),
    totais: {
      inscritos: parts.length,
      confirmados: confirmados.length,
      embarcaramIda:   confirmados.filter(function(p){ return p.ida; }).length,
      embarcaramVolta: confirmados.filter(function(p){ return p.volta; }).length
    },
    participantes: linhas
  };
}

function _handlePing() {
  var triggers = ScriptApp.getProjectTriggers().map(function(t) {
    return t.getHandlerFunction() + ' (' + t.getEventType() + ')';
  });
  return {
    ok: true,
    status: 'Aquashow Script activo ✅ (v14 · Bilhética Ida/Volta)',
    triggers: triggers,
    endpoints: ['?action=lista', '?action=painel', '?action=relatorio', 'POST {action:"sync"}']
  };
}

// ══════════════════════════════════════════════════════════════
//  LEMBRETE DE PARCELAS — agendado para 17/08/2026 09:00
// ══════════════════════════════════════════════════════════════
function enviarLembreteParcelas() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  var dados = sheet.getDataRange().getValues();
  var enviados = 0;

  for (var i = 1; i < dados.length; i++) {
    var linha      = dados[i];
    var nome       = linha[COL_NOME - 1];
    var estado     = String(linha[COL_ESTADO - 1]).trim();
    var emailAddr  = String(linha[COL_EMAIL - 1]).trim();
    var parcelas   = String(linha[COL_PARCELAS - 1]).trim();

    if (!nome || !emailAddr || emailAddr.indexOf('@') === -1) continue;
    if (ESTADOS_VALIDOS.indexOf(estado) !== -1) continue;

    var info      = _parseParcelas(parcelas);
    var pendentes = info.total - info.pagas;
    if (pendentes <= 0) continue;

    _dispararWebhook(N8N_LEMBRETE, {
      num:               linha[COL_NUM - 1],
      nome:              nome,
      contacto:          linha[COL_CONTACTO - 1],
      email:             emailAddr,
      idade:             linha[COL_IDADE - 1],
      ministerio:        linha[COL_MINISTERIO - 1],
      preco:             linha[COL_PRECO - 1],
      parcelas:          parcelas,
      parcelasPagas:     info.pagas,
      parcelasTotal:     info.total,
      parcelasPendentes: pendentes
    });
    enviados++;
    Utilities.sleep(500);
  }
  Logger.log('✅ Lembretes enviados: ' + enviados);
}

// ══════════════════════════════════════════════════════════════
//  AUXILIARES
// ══════════════════════════════════════════════════════════════

/** Lê todos os participantes da sheet como objetos. */
function _lerParticipantes() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return [];
  var dados = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < dados.length; i++) {
    var l = dados[i];
    var nome = String(l[COL_NOME - 1]).trim();
    if (!nome) continue;
    out.push({
      num:        l[COL_NUM - 1],
      nome:       nome,
      contacto:   l[COL_CONTACTO - 1],
      idade:      l[COL_IDADE - 1],
      ministerio: l[COL_MINISTERIO - 1],
      estado:     String(l[COL_ESTADO - 1]).trim(),
      email:      l[COL_EMAIL - 1],
      token:      String(l[COL_TOKEN - 1]).trim(),
      ida:        String(l[COL_EMBARQUE_IDA - 1] || '').trim(),
      volta:      String(l[COL_EMBARQUE_VOLTA - 1] || '').trim()
    });
  }
  return out;
}

function _resumoPessoa(p) {
  return { num: p.num, nome: p.nome, primeiro: p.nome.split(' ')[0],
           ministerio: p.ministerio, contacto: String(p.contacto) };
}

/** Token secreto forte (não adivinhável). */
function _gerarToken() {
  return 'aqs' + Utilities.getUuid().replace(/-/g, '');
}

function _parseParcelas(str) {
  str = String(str).trim();
  var partes = str.split('/');
  if (partes.length === 2) {
    return { pagas: parseInt(partes[0]) || 0, total: parseInt(partes[1]) || 1 };
  }
  var n = parseInt(str) || 1;
  return { pagas: n, total: n };
}

function _jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _dispararWebhook(url, dados) {
  try {
    var response = UrlFetchApp.fetch(url, {
      method:      'post',
      contentType: 'application/json',
      payload:     JSON.stringify(dados),
      muteHttpExceptions: true
    });
    var code = response.getResponseCode();
    Logger.log('📡 Webhook ' + url + ' → HTTP ' + code);
    return (code >= 200 && code < 300);
  } catch (err) {
    Logger.log('⚠️ Erro webhook ' + url + ': ' + err.toString());
    return false;
  }
}

// ══════════════════════════════════════════════════════════════
//  INSTALAÇÃO / MANUTENÇÃO
// ══════════════════════════════════════════════════════════════

/** Instala triggers E prepara as colunas novas. Correr na 1ª vez / após actualizar. */
function instalarSistema() {
  // 1. Limpar triggers antigos
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) ScriptApp.deleteTrigger(triggers[i]);

  // 2. Trigger de edição (confirmação → ticket)
  ScriptApp.newTrigger('onEditInstalavel')
    .forSpreadsheet(SPREADSHEET_ID).onEdit().create();

  // 3. Trigger de lembrete (17/08/2026 09:00)
  ScriptApp.newTrigger('enviarLembreteParcelas')
    .timeBased().at(new Date(2026, 7, 17, 9, 0, 0)).create();

  // 4. Preparar cabeçalhos das colunas novas
  prepararColunas(true);

  _notify(
    '✅ Sistema instalado!\n\n' +
    '• Confirmação → ticket com QR (automático)\n' +
    '• Colunas M/N/O preparadas (TOKEN · EMBARQUE IDA · EMBARQUE VOLTA)\n' +
    '• Lembrete de parcelas: 17/08/2026 09:00\n\n' +
    'Não esquecer: Implementar → Nova versão → Implementar'
  );
}

/** Garante os cabeçalhos das colunas L/M/N/O. silencioso=true não mostra alerta. */
function prepararColunas(silencioso) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;
  var headers = {
    12: 'MÉTODO PAGAMENTO', 13: 'TOKEN', 14: 'EMBARQUE IDA', 15: 'EMBARQUE VOLTA'
  };
  for (var c in headers) {
    var cell = sheet.getRange(1, parseInt(c));
    if (!String(cell.getValue()).trim()) cell.setValue(headers[c]).setFontWeight('bold');
  }
  if (!silencioso) _notify('✅ Colunas preparadas (L/M/N/O).');
}

/**
 * Gera TOKEN para quem já está confirmado mas ainda não tem token.
 * NÃO reenvia email — só preenche a coluna M (para inscritos antigos).
 */
function gerarTokensConfirmados() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  var dados = sheet.getDataRange().getValues();
  var n = 0;
  for (var i = 1; i < dados.length; i++) {
    var estado = String(dados[i][COL_ESTADO - 1]).trim();
    var token  = String(dados[i][COL_TOKEN - 1]).trim();
    if (ESTADOS_VALIDOS.indexOf(estado) !== -1 && !token) {
      sheet.getRange(i + 1, COL_TOKEN).setNumberFormat('@STRING@').setValue(_gerarToken());
      n++;
    }
  }
  _notify('✅ Tokens gerados para ' + n + ' confirmado(s) sem token.');
}

function verificarTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  var info = '📋 Triggers (' + triggers.length + '):\n\n';
  if (!triggers.length) info += '⚠️ Nenhum. Corre "Instalar/Actualizar Sistema".';
  else triggers.forEach(function(t){ info += '• ' + t.getHandlerFunction() + ' → ' + t.getEventType() + '\n'; });
  _notify(info);
}

/** Mostra alerta se houver UI (script colado na planilha); senão regista no log. */
function _notify(msg){
  try { SpreadsheetApp.getUi().alert(msg); }
  catch (e) { Logger.log(msg); }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚡ Aquashow')
    .addItem('▶ Instalar/Actualizar Sistema (1ª vez)', 'instalarSistema')
    .addItem('🔑 Gerar tokens em falta', 'gerarTokensConfirmados')
    .addItem('🔍 Verificar Triggers', 'verificarTriggers')
    .addItem('📩 Enviar Lembretes Agora', 'enviarLembreteParcelas')
    .addToUi();
}

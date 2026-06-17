/**
 * ============================================================
 *  GOOGLE APPS SCRIPT — AQUASHOW LEGACY  (v17 · Reorganizar por valores (sem moveColumns))
 * ============================================================
 *  COMO INSTALAR / ACTUALIZAR:
 *  1. Abre https://script.google.com/ → projeto "Aquashow Legacy"
 *  2. Seleciona tudo (Ctrl+A) e cola este código
 *  3. Guarda (Ctrl+S)
 *  4. Menu da planilha "⚡ Aquashow" → "▶ Instalar/Actualizar Sistema (1ª vez)"
 *     (instala triggers + move/prepara as colunas; parcelas ficam em K/L/M)
 *     Depois corre "💳 Preencher colunas de parcelas" para os inscritos actuais
 *  5. Implementar → Gerir implementações → ✏️ editar → Nova versão → Implementar
 *  ⚠️ A URL NÃO muda — não precisas atualizar o site
 * ============================================================
 *
 *  ORDEM DAS COLUNAS: ... I OBSERVAÇÕES · J PARCELAS · K 1ª · L 2ª · M 3ª PARCELA ·
 *                     N PREÇO · O MÉTODO · P TOKEN · Q EMBARQUE IDA · R EMBARQUE VOLTA
 *
 *  REGRAS DE NEGÓCIO:
 *  • Ticket (QR) só é enviado quando ESTADO PAGAMENTO = "CONFIRMADO ✅"
 *  • Ao confirmar → gera TOKEN secreto (col P) + envia email com QR do token
 *  • DIA DO EVENTO:
 *      - Scanner em modo IDA   → carimba "EMBARQUE IDA"   (col Q)
 *      - Scanner em modo VOLTA → carimba "EMBARQUE VOLTA" (col R)
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
var COL_PARCELA_1      = 11;  // K — 1ª PARCELA (✅ Pago / data / ⏳ Pendente / À vista / —)
var COL_PARCELA_2      = 12;  // L — 2ª PARCELA
var COL_PARCELA_3      = 13;  // M — 3ª PARCELA
var COL_PRECO          = 14;  // N — PREÇO (€)
var COL_METODO         = 15;  // O — MÉTODO PAGAMENTO
var COL_TOKEN          = 16;  // P — TOKEN SECRETO (QR)
var COL_EMBARQUE_IDA   = 17;  // Q — EMBARQUE IDA (hora)
var COL_EMBARQUE_VOLTA = 18;  // R — EMBARQUE VOLTA (hora)
var TOTAL_COLS         = 18;

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
                       'PARCELAS', '1ª PARCELA', '2ª PARCELA', '3ª PARCELA',
                       'PREÇO', 'MÉTODO PAGAMENTO',
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

    // Colunas A..J (#, nome, ..., OBSERVAÇÕES, PARCELAS)
    sheet.getRange(proximaLinha, 1, 1, 10).setValues([[
      numSequencial,
      data.nome            || '',
      data.contacto        || '',
      data.idade           || '',
      data.ministerio      || '',
      'AGUARDANDO CONFIRMAÇÃO',
      data.email           || '',
      hoje,
      data.obs             || '',
      parcelasInicial
    ]]);

    // Colunas de controlo de parcelas (K/L/M) — logo a seguir a PARCELAS.
    //  • Parcelado → cada célula arranca em "⏳ Pendente"; a equipa substitui pela DATA de pagamento.
    //  • À vista   → "À vista" na 1ª e "—" nas restantes (identifica logo o método).
    var infoParc = _parseParcelas(parcelasInicial);
    var estParc;
    if (infoParc.total > 1) {
      estParc = [];
      for (var k = 1; k <= 3; k++) {
        estParc.push(k <= infoParc.total ? '⏳ Pendente' : '—');
      }
    } else {
      estParc = ['À vista', '—', '—'];
    }
    sheet.getRange(proximaLinha, COL_PARCELA_1, 1, 3)
         .setNumberFormat('@STRING@')
         .setValues([estParc]);

    // Colunas N/O (PREÇO, MÉTODO PAGAMENTO)
    sheet.getRange(proximaLinha, COL_PRECO, 1, 2).setValues([[
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
    status: 'Aquashow Script activo ✅ (v17 · Bilhética + Controlo de Parcelas)',
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
    if (nome.toUpperCase() === 'NOME COMPLETO') continue; // ignorar linha(s) de cabeçalho
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

  // 4. Mover (se preciso) as colunas de parcela para junto de PARCELAS, depois preparar cabeçalhos
  reorganizarColunasParcelas(true);
  prepararColunas(true);

  _notify(
    '✅ Sistema instalado!\n\n' +
    '• Confirmação → ticket com QR (automático)\n' +
    '• Parcelas movidas para K/L/M (1ª · 2ª · 3ª), logo a seguir a PARCELAS\n' +
    '• TOKEN · EMBARQUE IDA · EMBARQUE VOLTA agora em P/Q/R\n' +
    '• Lembrete de parcelas: 17/08/2026 09:00\n\n' +
    'A seguir: menu → "💳 Preencher colunas de parcelas" (preenche os inscritos actuais)\n' +
    'Não esquecer: Implementar → Nova versão → Implementar'
  );
}

/**
 * Organiza os cabeçalhos das colunas J..O na MESMA linha e com o MESMO estilo
 * dos cabeçalhos existentes. Detecta a linha de cabeçalho (onde col B = "NOME COMPLETO")
 * e limpa títulos perdidos na linha 1. silencioso=true não mostra alerta.
 */
function prepararColunas(silencioso) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  // 1. Encontrar a linha de cabeçalho real (col B == "NOME COMPLETO")
  var n = Math.min(12, sheet.getMaxRows());
  var bvals = sheet.getRange(1, 2, n, 1).getValues();
  var hrow = 0;
  for (var i = 0; i < bvals.length; i++) {
    if (String(bvals[i][0]).trim().toUpperCase() === 'NOME COMPLETO') { hrow = i + 1; break; }
  }
  if (!hrow) hrow = 1;

  // 2. Limpar títulos que ficaram perdidos na linha 1 (se o cabeçalho não for aí)
  if (hrow !== 1) sheet.getRange(1, 10, 1, 9).clearContent();

  // 3. Escrever J..R com o MESMO estilo do cabeçalho existente (modelo: coluna I)
  var labels = [['PARCELAS', '1ª PARCELA', '2ª PARCELA', '3ª PARCELA',
                 'PREÇO', 'MÉTODO PAGAMENTO', 'TOKEN', 'EMBARQUE IDA', 'EMBARQUE VOLTA']];
  var alvo   = sheet.getRange(hrow, 10, 1, 9); // J..R
  sheet.getRange(hrow, 9).copyTo(alvo, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  alvo.setValues(labels);

  if (!silencioso) _notify('✅ Cabeçalhos organizados na linha ' + hrow + ' (PARCELAS → EMBARQUE VOLTA), com o estilo dos outros.');
}

/**
 * Reordena as colunas J..R para a ordem desejada (PARCELAS · 1ª · 2ª · 3ª · PREÇO ·
 * MÉTODO · TOKEN · EMBARQUE IDA · EMBARQUE VOLTA), trocando os VALORES de sítio.
 *
 * NÃO usa moveColumns (que rebenta com o banner mesclado das linhas 1-3): em vez
 * disso lê os dados a partir da linha de cabeçalho para baixo e reescreve-os na
 * nova ordem. O banner (linhas 1-3) nunca é tocado.
 * Idempotente: se já estiver na ordem certa, não faz nada. silencioso=true → sem alerta.
 */
function reorganizarColunasParcelas(silencioso) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  // Encontrar a linha de cabeçalho real (col B == "NOME COMPLETO")
  var n = Math.min(12, sheet.getMaxRows());
  var bvals = sheet.getRange(1, 2, n, 1).getValues();
  var hrow = 0;
  for (var i = 0; i < bvals.length; i++) {
    if (String(bvals[i][0]).trim().toUpperCase() === 'NOME COMPLETO') { hrow = i + 1; break; }
  }
  if (!hrow) hrow = 1;

  // Ler os cabeçalhos dessa linha
  var lastCol = sheet.getLastColumn();
  var hdr = sheet.getRange(hrow, 1, 1, lastCol).getValues()[0];
  function colDe(nome) {
    for (var c = 0; c < hdr.length; c++) {
      if (String(hdr[c]).trim().toUpperCase() === nome) return c + 1; // 1-based
    }
    return 0;
  }

  // Ordem final pretendida para as colunas J..R (10..18)
  var desejada = ['PARCELAS', '1ª PARCELA', '2ª PARCELA', '3ª PARCELA',
                  'PREÇO', 'MÉTODO PAGAMENTO', 'TOKEN', 'EMBARQUE IDA', 'EMBARQUE VOLTA'];

  // Coluna actual (origem) de cada cabeçalho pretendido
  var srcCols = [];
  for (var d = 0; d < desejada.length; d++) {
    var c = colDe(desejada[d]);
    if (!c) {
      if (!silencioso) _notify('⚠️ Não encontrei a coluna "' + desejada[d] + '". Corre "Instalar/Actualizar Sistema" primeiro.');
      return;
    }
    srcCols.push(c);
  }

  // Já está tudo na ordem J..R?
  var jaOk = true;
  for (var k = 0; k < srcCols.length; k++) if (srcCols[k] !== 10 + k) jaOk = false;
  if (jaOk) {
    if (!silencioso) _notify('✅ As colunas já estão na ordem certa (PARCELAS · 1ª · 2ª · 3ª · PREÇO ...). Nada a fazer.');
    return;
  }

  // Ler o bloco de dados (do cabeçalho para baixo — NUNCA o banner das linhas 1-3)
  var lastRow = sheet.getLastRow();
  var numRows = lastRow - hrow + 1;
  if (numRows < 1) return;
  var bloco = sheet.getRange(hrow, 1, numRows, lastCol).getValues();

  // Reconstruir J..R na ordem desejada
  var novo = [];
  for (var r = 0; r < numRows; r++) {
    var linha = [];
    for (var j = 0; j < desejada.length; j++) linha.push(bloco[r][srcCols[j] - 1]);
    novo.push(linha);
  }

  // Escrever de volta em J..R (10..18). As colunas K/L/M e P/Q/R são texto.
  var alvo = sheet.getRange(hrow, 10, numRows, 9);
  alvo.setValues(novo);
  // Reforçar formato de texto nas colunas que guardam estados/tokens/horas
  sheet.getRange(hrow, COL_PARCELA_1, numRows, 3).setNumberFormat('@STRING@'); // K/L/M
  sheet.getRange(hrow, COL_TOKEN,    numRows, 3).setNumberFormat('@STRING@'); // P/Q/R

  if (!silencioso) _notify('✅ Colunas reorganizadas: 1ª/2ª/3ª PARCELA agora logo a seguir a PARCELAS (dados preservados).');
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

/**
 * Preenche as colunas 1ª/2ª/3ª PARCELA para os inscritos JÁ existentes, usando
 * as colunas PARCELAS e MÉTODO PAGAMENTO. Não sobrescreve células já preenchidas
 * pela equipa (ex: datas). A equipa substitui "⏳ Pendente" pela DATA quando pagar.
 *   PARCELADO (PARCELAS "x/N" com N>1, ou MÉTODO contém "parcel"):
 *     • parcelas do plano → "⏳ Pendente"  · restantes → "—"
 *   À VISTA (PARCELAS "1/1", ou MÉTODO contém "vista"):
 *     • "À vista" na 1ª · "—" na 2ª e 3ª
 *   SEM DADOS (PARCELAS e MÉTODO vazios — inscritos antigos):
 *     • DEIXA EM BRANCO (não adivinha; alguns parcelam só pelas observações)
 */
function preencherParcelasExistentes() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  var dados = sheet.getDataRange().getValues();
  var nParcelado = 0, nAvista = 0, nEmBranco = 0;

  for (var i = 1; i < dados.length; i++) {
    var l    = dados[i];
    var nome = String(l[COL_NOME - 1]).trim();
    if (!nome || nome.toUpperCase() === 'NOME COMPLETO') continue;

    var parcStr = String(l[COL_PARCELAS - 1] || '').trim();
    var metodo  = String(l[COL_METODO   - 1] || '').trim().toLowerCase();
    var info    = _parseParcelas(parcStr);

    var ehParcelado = (parcStr && info.total > 1) || metodo.indexOf('parcel') !== -1;
    var ehAvista    = (parcStr === '1/1') || metodo.indexOf('vista') !== -1;

    var modelo;
    if (ehParcelado) {
      var total = (info.total > 1) ? info.total : 3; // plano standard = 3x
      modelo = [];
      for (var k = 1; k <= 3; k++) modelo.push(k <= total ? '⏳ Pendente' : '—');
      nParcelado++;
    } else if (ehAvista) {
      modelo = ['À vista', '—', '—'];
      nAvista++;
    } else {
      nEmBranco++;        // sem dados → não toca
      continue;
    }

    // Respeita o que a equipa já escreveu (datas, etc.)
    var novos = [];
    for (var j = 0; j < 3; j++) {
      var atual = String(l[COL_PARCELA_1 - 1 + j] || '').trim();
      novos.push(atual ? atual : modelo[j]);
    }

    sheet.getRange(i + 1, COL_PARCELA_1, 1, 3)
         .setNumberFormat('@STRING@')
         .setValues([novos]);
  }
  _notify('✅ Parcelas preenchidas: ' + nParcelado + ' a parcelar · ' + nAvista +
          ' à vista · ' + nEmBranco + ' deixados em branco (antigos, sem dados — preencher à mão).');
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
    .addItem('💳 Preencher colunas de parcelas', 'preencherParcelasExistentes')
    .addItem('↔️ Reorganizar colunas de parcelas (mover p/ junto de PARCELAS)', 'reorganizarColunasParcelas')
    .addItem('🔍 Verificar Triggers', 'verificarTriggers')
    .addItem('📩 Enviar Lembretes Agora', 'enviarLembreteParcelas')
    .addToUi();
}

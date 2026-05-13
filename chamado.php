<?php
/* ═══════════════════════════════════════════
   chamado.php  —  Recebe e salva o chamado
   ═══════════════════════════════════════════

   Recebe o POST multipart do chamado.js e:
   1. Valida os dados server-side
   2. Salva o chamado no banco de dados
   3. Envia e-mail de confirmação ao cliente
   4. Retorna JSON { success, message, ticket_id }
   ═══════════════════════════════════════════ */

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido.']);
    exit;
}

/* ══════════════════════════════════════
   1. CONFIGURAÇÕES
══════════════════════════════════════ */

/* Banco de dados */
define('DB_HOST', 'localhost');
define('DB_NAME', 'nome_do_banco');
define('DB_USER', 'usuario');
define('DB_PASS', 'senha');
define('DB_PORT', '3306');

/* E-mail de suporte (recebe os chamados) */
define('SUPORTE_EMAIL', 'suporte@amtcloud.com.br');
define('SUPORTE_NOME',  'AMT Cloud Suporte');

/* Upload */
define('UPLOAD_DIR',    __DIR__ . '/uploads/chamados/');
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10 MB
define('ALLOWED_TYPES', ['image/png','image/jpeg','application/pdf','text/plain','application/zip','application/x-zip-compressed']);

/* ══════════════════════════════════════
   2. SANITIZAÇÃO E VALIDAÇÃO
══════════════════════════════════════ */
$nome      = trim(filter_input(INPUT_POST, 'nome',      FILTER_SANITIZE_SPECIAL_CHARS) ?? '');
$email     = trim(filter_input(INPUT_POST, 'email',     FILTER_SANITIZE_EMAIL) ?? '');
$empresa   = trim(filter_input(INPUT_POST, 'empresa',   FILTER_SANITIZE_SPECIAL_CHARS) ?? '');
$telefone  = trim(filter_input(INPUT_POST, 'telefone',  FILTER_SANITIZE_SPECIAL_CHARS) ?? '');
$servico   = trim(filter_input(INPUT_POST, 'servico',   FILTER_SANITIZE_SPECIAL_CHARS) ?? '');
$prioridade = trim(filter_input(INPUT_POST, 'prioridade', FILTER_SANITIZE_SPECIAL_CHARS) ?? '');
$titulo    = trim(filter_input(INPUT_POST, 'titulo',    FILTER_SANITIZE_SPECIAL_CHARS) ?? '');
$descricao = trim(filter_input(INPUT_POST, 'descricao', FILTER_SANITIZE_SPECIAL_CHARS) ?? '');

$errors = [];

if (strlen($nome) < 3)
    $errors[] = 'Nome inválido.';

if (!filter_var($email, FILTER_VALIDATE_EMAIL))
    $errors[] = 'E-mail inválido.';

if (empty($empresa))
    $errors[] = 'Empresa obrigatória.';

$servicosValidos = [
    'vm','kubernetes','serverless',
    'storage-object','storage-block','backup',
    'cdn','vpn','firewall','dns',
    'db-relacional','db-nosql',
    'monitoring','logs','outro'
];
if (!in_array($servico, $servicosValidos, true))
    $errors[] = 'Serviço inválido.';

$prioridadesValidas = ['critico','alto','medio','baixo'];
if (!in_array($prioridade, $prioridadesValidas, true))
    $errors[] = 'Prioridade inválida.';

if (empty($titulo))
    $errors[] = 'Título obrigatório.';

if (strlen($descricao) < 20)
    $errors[] = 'Descrição muito curta (mínimo 20 caracteres).';

if (!empty($errors)) {
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

/* ══════════════════════════════════════
   3. UPLOAD DO ARQUIVO (opcional)
══════════════════════════════════════ */
$anexo_path = null;
$anexo_nome = null;

if (isset($_FILES['anexo']) && $_FILES['anexo']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['anexo'];

    if ($file['size'] > MAX_FILE_SIZE) {
        echo json_encode(['success' => false, 'message' => 'Arquivo excede 10 MB.']);
        exit;
    }

    // Verificar MIME real (não apenas extensão)
    $finfo    = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);

    if (!in_array($mimeType, ALLOWED_TYPES, true)) {
        echo json_encode(['success' => false, 'message' => 'Tipo de arquivo não permitido.']);
        exit;
    }

    // Criar diretório se não existir
    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = bin2hex(random_bytes(16)) . '.' . strtolower($ext);
    $destPath = UPLOAD_DIR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        echo json_encode(['success' => false, 'message' => 'Erro ao salvar anexo.']);
        exit;
    }

    $anexo_path = 'uploads/chamados/' . $filename;
    $anexo_nome = basename($file['name']);
}

/* ══════════════════════════════════════
   4. SALVAR NO BANCO DE DADOS
   ══════════════════════════════════════
   Tabela sugerida (execute no MySQL):

   CREATE TABLE chamados (
     id          INT AUTO_INCREMENT PRIMARY KEY,
     ticket_id   VARCHAR(12) NOT NULL UNIQUE,
     nome        VARCHAR(150) NOT NULL,
     email       VARCHAR(254) NOT NULL,
     empresa     VARCHAR(150) NOT NULL,
     telefone    VARCHAR(20),
     servico     VARCHAR(50) NOT NULL,
     prioridade  ENUM('critico','alto','medio','baixo') NOT NULL,
     titulo      VARCHAR(250) NOT NULL,
     descricao   TEXT NOT NULL,
     anexo_path  VARCHAR(300),
     anexo_nome  VARCHAR(200),
     status      ENUM('aberto','em_andamento','aguardando','resolvido','fechado')
                 NOT NULL DEFAULT 'aberto',
     created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
══════════════════════════════════════ */
try {
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

} catch (PDOException $e) {
    error_log('DB Connection Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno. Tente novamente.']);
    exit;
}

/* Gerar ticket ID único (ex: AMT-2025-A3F8) */
function generateTicketId(PDO $pdo): string {
    do {
        $id = 'AMT-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(2)));
        $st = $pdo->prepare('SELECT 1 FROM chamados WHERE ticket_id = :id');
        $st->execute([':id' => $id]);
    } while ($st->fetchColumn());
    return $id;
}

try {
    $ticketId = generateTicketId($pdo);

    $stmt = $pdo->prepare('
        INSERT INTO chamados
            (ticket_id, nome, email, empresa, telefone, servico, prioridade, titulo, descricao, anexo_path, anexo_nome)
        VALUES
            (:ticket_id, :nome, :email, :empresa, :telefone, :servico, :prioridade, :titulo, :descricao, :anexo_path, :anexo_nome)
    ');

    $stmt->execute([
        ':ticket_id'  => $ticketId,
        ':nome'       => $nome,
        ':email'      => $email,
        ':empresa'    => $empresa,
        ':telefone'   => $telefone ?: null,
        ':servico'    => $servico,
        ':prioridade' => $prioridade,
        ':titulo'     => $titulo,
        ':descricao'  => $descricao,
        ':anexo_path' => $anexo_path,
        ':anexo_nome' => $anexo_nome,
    ]);

} catch (PDOException $e) {
    error_log('DB Insert Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro ao registrar chamado.']);
    exit;
}

/* ══════════════════════════════════════
   5. ENVIAR E-MAIL DE CONFIRMAÇÃO
   ══════════════════════════════════════
   Usa mail() nativo. Para produção,
   recomenda-se PHPMailer + SMTP.
══════════════════════════════════════ */
$prioridadeLabels = [
    'critico' => 'Crítico',
    'alto'    => 'Alto',
    'medio'   => 'Médio',
    'baixo'   => 'Baixo',
];

$prioridadeLabel = $prioridadeLabels[$prioridade] ?? $prioridade;

/* E-mail para o cliente */
$subjectCliente = "[{$ticketId}] Chamado recebido — AMT Cloud";
$bodyCliente    = "Olá, {$nome}!\n\n"
    . "Seu chamado foi recebido com sucesso.\n\n"
    . "Ticket: {$ticketId}\n"
    . "Serviço: {$servico}\n"
    . "Prioridade: {$prioridadeLabel}\n"
    . "Título: {$titulo}\n\n"
    . "Nossa equipe entrará em contato em breve.\n\n"
    . "Atenciosamente,\nAMT Cloud Suporte\n" . SUPORTE_EMAIL;

$headersCliente = "From: " . SUPORTE_NOME . " <" . SUPORTE_EMAIL . ">\r\n"
    . "Reply-To: " . SUPORTE_EMAIL . "\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n"
    . "X-Mailer: PHP/" . phpversion();

@mail($email, $subjectCliente, $bodyCliente, $headersCliente);

/* E-mail para o suporte interno */
$subjectSuporte = "[{$ticketId}] [{$prioridadeLabel}] {$titulo}";
$bodySuporte    = "Novo chamado aberto.\n\n"
    . "Ticket:     {$ticketId}\n"
    . "Nome:       {$nome}\n"
    . "E-mail:     {$email}\n"
    . "Empresa:    {$empresa}\n"
    . "Telefone:   " . ($telefone ?: 'Não informado') . "\n"
    . "Serviço:    {$servico}\n"
    . "Prioridade: {$prioridadeLabel}\n\n"
    . "Título:\n{$titulo}\n\n"
    . "Descrição:\n{$descricao}\n\n"
    . ($anexo_nome ? "Anexo: {$anexo_nome}\n" : '');

$headersSuporte = "From: " . SUPORTE_NOME . " <" . SUPORTE_EMAIL . ">\r\n"
    . "Reply-To: {$nome} <{$email}>\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n"
    . "X-Mailer: PHP/" . phpversion();

@mail(SUPORTE_EMAIL, $subjectSuporte, $bodySuporte, $headersSuporte);

/* ══════════════════════════════════════
   6. RESPOSTA
══════════════════════════════════════ */
echo json_encode([
    'success'   => true,
    'ticket_id' => $ticketId,
    'message'   => "Chamado {$ticketId} aberto com sucesso!",
]);
exit;

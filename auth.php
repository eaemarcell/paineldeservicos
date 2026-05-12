<?php
/* ═══════════════════════════════════════════
   auth.php  —  Autenticação de Login
   ═══════════════════════════════════════════

   Este arquivo recebe o POST do login.js via fetch()
   e retorna JSON. Adapte a conexão ao banco conforme
   seu ambiente (PDO recomendado).
   ═══════════════════════════════════════════ */

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

/* ── Apenas POST é aceito ── */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido.']);
    exit;
}

/* ══════════════════════════════════════
   1. CONFIGURAÇÃO DO BANCO DE DADOS
   ══════════════════════════════════════
   Altere as constantes abaixo com as
   credenciais do seu servidor.
══════════════════════════════════════ */
define('DB_HOST', 'localhost');
define('DB_NAME', 'nome_do_banco');
define('DB_USER', 'usuario');
define('DB_PASS', 'senha');
define('DB_PORT', '3306');

/* ══════════════════════════════════════
   2. SANITIZAÇÃO DOS DADOS
══════════════════════════════════════ */
$email    = filter_input(INPUT_POST, 'email',    FILTER_SANITIZE_EMAIL);
$password = filter_input(INPUT_POST, 'password', FILTER_DEFAULT);
$remember = filter_input(INPUT_POST, 'remember', FILTER_VALIDATE_BOOLEAN) ?? false;

/* Validação básica server-side */
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'E-mail inválido.']);
    exit;
}

if (empty($password) || strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Senha inválida.']);
    exit;
}

/* ══════════════════════════════════════
   3. CONEXÃO COM O BANCO (PDO)
══════════════════════════════════════ */
try {
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        DB_HOST, DB_PORT, DB_NAME
    );

    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

} catch (PDOException $e) {
    /* Nunca exponha detalhes do erro em produção */
    error_log('DB Connection Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno. Tente novamente.']);
    exit;
}

/* ══════════════════════════════════════
   4. BUSCAR USUÁRIO NO BANCO
   ══════════════════════════════════════
   Ajuste a query conforme o nome da sua
   tabela e colunas.
   A senha deve estar armazenada com
   password_hash() — nunca em texto puro.
══════════════════════════════════════ */
try {
    $stmt = $pdo->prepare('
        SELECT id, name, email, password, status
        FROM users
        WHERE email = :email
        LIMIT 1
    ');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

} catch (PDOException $e) {
    error_log('DB Query Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro interno. Tente novamente.']);
    exit;
}

/* ── Verificar se usuário existe e senha está correta ── */
if (!$user || !password_verify($password, $user['password'])) {
    /* Resposta genérica — não informe qual dos dois está errado */
    echo json_encode(['success' => false, 'message' => 'E-mail ou senha incorretos.']);
    exit;
}

/* ── Verificar se a conta está ativa ── */
if (isset($user['status']) && $user['status'] !== 'active') {
    echo json_encode(['success' => false, 'message' => 'Sua conta está inativa. Contate o suporte.']);
    exit;
}

/* ══════════════════════════════════════
   5. INICIAR SESSÃO
══════════════════════════════════════ */
session_start();

/* Regenerar ID de sessão para prevenir session fixation */
session_regenerate_id(true);

$_SESSION['user_id']    = $user['id'];
$_SESSION['user_name']  = $user['name'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['logged_in']  = true;

/* ── "Lembrar de mim" — cookie de 30 dias ── */
if ($remember) {
    $token   = bin2hex(random_bytes(32));
    $expires = time() + (30 * 24 * 60 * 60); // 30 dias

    /* Salvar token no banco (tabela: remember_tokens) */
    /* ------------------------------------------------
       CREATE TABLE remember_tokens (
         id         INT AUTO_INCREMENT PRIMARY KEY,
         user_id    INT NOT NULL,
         token      VARCHAR(64) NOT NULL UNIQUE,
         expires_at DATETIME NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       );
    ------------------------------------------------ */
    try {
        $stmt = $pdo->prepare('
            INSERT INTO remember_tokens (user_id, token, expires_at)
            VALUES (:uid, :token, FROM_UNIXTIME(:exp))
        ');
        $stmt->execute([
            ':uid'   => $user['id'],
            ':token' => $token,
            ':exp'   => $expires,
        ]);

        setcookie('remember_token', $token, [
            'expires'  => $expires,
            'path'     => '/',
            'secure'   => true,   // HTTPS obrigatório em produção
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

    } catch (PDOException $e) {
        error_log('Remember token error: ' . $e->getMessage());
        /* Não interrompe o login por isso */
    }
}

/* ══════════════════════════════════════
   6. RESPOSTA DE SUCESSO
══════════════════════════════════════ */
echo json_encode([
    'success'  => true,
    'redirect' => 'dashboard.php',   // ← ajuste para a sua rota
]);
exit;

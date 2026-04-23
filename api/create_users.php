<?php
use App\Domain\Users\Models\User;
use Illuminate\Support\Facades\Hash;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$isLocal  = $app->environment('local');
$isForced = isset($argv) && in_array('--force', $argv, true);

if (!$isLocal && !$isForced) {
    fwrite(STDERR, "Refusing to truncate users outside the local environment. Re-run with --force to override.\n");
    exit(1);
}

$resolvePassword = static function (string $envKey): string {
    $password = getenv($envKey);
    return ($password !== false && $password !== '') ? $password : bin2hex(random_bytes(12));
};

$adminPassword   = $resolvePassword('CREATE_USERS_ADMIN_PASSWORD');
$cashierPassword = $resolvePassword('CREATE_USERS_CAJERO1_PASSWORD');

User::truncate();

User::create([
    'name'     => 'Admin',
    'email'    => 'admin@pos.local',
    'password' => Hash::make($adminPassword),
]);

User::create([
    'name'     => 'Cajero 1',
    'email'    => 'cajero1@pos.local',
    'password' => Hash::make($cashierPassword),
]);

echo "✓ Usuarios creados exitosamente\n";
echo "Admin password:    {$adminPassword}\n";
echo "Cajero 1 password: {$cashierPassword}\n";

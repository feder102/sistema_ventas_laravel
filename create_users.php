<?php
require 'api/bootstrap/autoload.php';
$app = require_once 'api/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Domain\Users\Models\User;
use Illuminate\Support\Facades\Hash;

User::truncate();

User::create([
    'name' => 'Admin',
    'email' => 'admin@pos.local',
    'password' => Hash::make('password'),
]);

User::create([
    'name' => 'Cajero 1',
    'email' => 'cajero1@pos.local',
    'password' => Hash::make('password'),
]);

echo "✓ Usuarios creados exitosamente\n";
?>

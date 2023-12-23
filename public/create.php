<?php
// Habilitar la visualización de errores
error_reporting(E_ALL);
ini_set('display_errors', '1');

header('Access-Control-Allow-Origin: https://bestwaymedride.com');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../vendor/autoload.php';
require_once '../secrets.php';

use Stripe\Exception\ApiErrorException;
use Stripe\StripeClient;

$stripeSecretKey = 'sk_test_51NrUnGAtacPDisTvfqqW49TTwgPNTMhLDRCRnw6nGUnRfLLWXXocz9oM3HLakpLhkXLhTUKsSk7KWK0MhH8JCPGa00I75AsVRF';

$stripe = new StripeClient($stripeSecretKey);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');  // Permitir solicitudes desde cualquier origen

try {
    // Recupera la distancia desde el formulario
    $postData = json_decode(file_get_contents("php://input"), true);
    $distancia = $postData['distancia'] ?? null;

    // Verifica si la distancia se recibió correctamente
    if ($distancia === null) {
        throw new Exception('La distancia no se recibió correctamente. Asegúrate de enviarla como parte de la solicitud.');
    } else {
        $a = -1;
    }

    // Define los métodos de pago que aceptas
    $supportedPaymentMethods = ['pm_card_visa', 'pm_card_mastercard', 'pm_card_amex'];

    // Elige un método de pago aleatorio
    $selectedPaymentMethod = $supportedPaymentMethods[array_rand($supportedPaymentMethods)];

    // Crea un PaymentIntent con la cantidad y la moneda
    $paymentIntent = $stripe->paymentIntents->create([
        'amount' => calculateOrderAmount($distancia),
        'currency' => 'usd',
        'automatic_payment_methods' => [
            'enabled' => true,
        ],
    ]);

   // Confirm the PaymentIntent with the selected payment method and return URL
$stripe->paymentIntents->confirm(
    $paymentIntent->id,
    [
        'payment_method' => $selectedPaymentMethod,
        'return_url' => 'https://www.bestwaymedride.com', // Reemplaza con la URL real de la página de pago exitoso
    ]
);


    $output = [
        'clientSecret' => $paymentIntent->client_secret,
        'selectedPaymentMethod' => $selectedPaymentMethod,
    ];

    echo json_encode($output);
} catch (ApiErrorException $e) {
    http_response_code($e->getHttpStatus());
    $errorDetails = [
        'error' => 'Error en la API de Stripe',
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'type' => $e->getError()->type,
    ];
    echo json_encode($errorDetails);
} catch (Exception $e) {
    http_response_code(500);
    $errorDetails = [
        'error' => 'Error interno en el servidor',
        'message' => $e->getMessage(),
    ];
    echo json_encode($errorDetails);
}

function calculateOrderAmount($distancia): int {
    $costoDeViaje = (400 + 280 * $distancia) + ((400 + 280 * $distancia) * 0.08);
    return round($costoDeViaje, 2);
}
?>

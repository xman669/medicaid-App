// This is your test publishable API key.
const stripe = Stripe("pk_test_51NrUnGAtacPDisTvMPzu4oV1ybWNX4yUofKHwttl9VIGBihOuvlxrK6f6P4gJ44LQ9jcquuXfOvaiMRGuHYpNBbU00IMbK6zHj");

// The items the customer wants to buy
const items = [{ id: "Trip Cost" }];

let elements;
let paymentElement;

initialize();
checkStatus();

async function initialize() {
  try {
    // Obtener el clientSecret del servidor
    const { clientSecret } = await fetch("/create.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    }).then((r) => r.json());

    // Inicializar elementos de Stripe después de obtener el clientSecret
    elements = stripe.elements();

    const style = {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    };

    const options = {
      style: style,
    };

    paymentElement = elements.create("card", options);
    paymentElement.mount("#card-element");
  } catch (error) {
    console.error('Error initializing payment element:', error);
  }
}

document.querySelector("#payment-form").addEventListener("submit", handleSubmit);

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const emailAddress = document.querySelector("#email-input").value;
  // Imprimir el valor en la consola
  console.log('Correo electrónico:', emailAddress);


  try {
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: paymentElement,
      billing_details: {
        email: emailAddress,
      },
    });

    if (error) {
      showMessage(error.message);
    } else {
      const response = await fetch("create.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: paymentMethod.id,
          email: emailAddress,
          items: items,
        }),
      });

      const { success, errorMessage } = await response.json();

      if (success) {
        showMessage("Payment succeeded!");
      } else {
        showMessage(errorMessage || "Payment succeeded!");
      }
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    showMessage("An unexpected error occurred.");
  }

  setLoading(false);
}

async function checkStatus() {
  // Implementa la lógica para comprobar el estado del pago si es necesario
  // Puedes utilizar el mismo enfoque que en el código anterior
}

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add("hidden");
    messageContainer.textContent = "";
  }, 4000);
}

function setLoading(isLoading) {
  const submitButton = document.querySelector("#submit");
  const spinner = document.querySelector("#spinner");

  if (isLoading) {
    submitButton.disabled = true;
    spinner.classList.remove("hidden");
  } else {
    submitButton.disabled = false;
    spinner.classList.add("hidden");
  }
}

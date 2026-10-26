/**
 * SDK Stripe sintético para testes funcionais/E2E. Não contém cartão/chave reais.
 * A função é autossuficiente para serialização em addInitScript; nunca importar em produção.
 */
export function createStripeSdkFixture(
  settings: {
    autoReady?: boolean;
    failLoad?: boolean;
    confirm?: (input: unknown) => Promise<unknown>;
  } = {},
) {
  let currentSecret = "";
  let method = "pix";
  const elements = {
    update() {},
    create() {
      const listeners = new Map<string, (event?: unknown) => void>();
      let node: HTMLElement | null = null;
      const element = {
        on(event: string, callback: (event?: unknown) => void) {
          listeners.set(event, callback);
        },
        off(event: string) {
          listeners.delete(event);
        },
        update() {},
        destroy() {
          if (node) node.replaceChildren();
        },
        mount(target: HTMLElement) {
          node = target;
          const group = document.createElement("fieldset");
          const legend = document.createElement("legend");
          legend.textContent = "Stripe simulado";
          group.append(legend);
          for (const [value, label] of [
            ["pix", "Pix"],
            ["card", "Cartão de crédito"],
          ]) {
            const container = document.createElement("label");
            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "stripe-method";
            radio.value = value!;
            radio.checked = value === method;
            radio.addEventListener("change", () => {
              method = value!;
              listeners.get("change")?.({ value: { type: method } });
            });
            container.append(radio, document.createTextNode(label!));
            container.style.display = "block";
            container.style.padding = "12px";
            group.append(container);
          }
          for (const [name, event] of [
            ["SDK pronto", "ready"],
            ["SDK falhou", "loaderror"],
          ]) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = name!;
            button.addEventListener("click", () => listeners.get(event!)?.());
            if (settings.autoReady) button.hidden = true;
            group.append(button);
          }
          target.replaceChildren(group);
          if (settings.autoReady) setTimeout(() => listeners.get(settings.failLoad ? "loaderror" : "ready")?.(), 20);
        },
      };
      return element;
    },
  };
  return {
    elements(options: { clientSecret?: string } = {}) {
      currentSecret = options.clientSecret ?? "";
      return elements;
    },
    async confirmPayment(input: unknown) {
      if (settings.confirm) return settings.confirm(input);
      const bookingId = currentSecret.replace(/^pi_/, "").split("_secret_")[0];
      const returnUrl = (input as { confirmParams?: { return_url?: string } }).confirmParams?.return_url;
      const installmentNumber = returnUrl ? Number(new URL(returnUrl).searchParams.get("installment")) : 1;
      const response = await fetch("https://stripe.pethost.test/confirm", {
        method: "POST",
        body: JSON.stringify({ bookingId, method, installmentNumber }),
      });
      return response.json();
    },
    createToken() {},
    createPaymentMethod() {},
    confirmCardPayment() {},
    _registerWrapper() {},
    registerAppInfo() {},
  };
}

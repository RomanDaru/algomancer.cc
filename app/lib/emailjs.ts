const EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send";

export interface ActionEmailParams {
  to_email: string;
  subject: string;
  heading: string;
  user_name: string;
  message: string;
  action_text: string;
  action_url: string;
  expiry_text: string;
  footer: string;
}

function getEmailJsConfig() {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_ACTION_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error("EmailJS server configuration is incomplete");
  }

  return {
    serviceId,
    templateId,
    publicKey,
    privateKey,
  };
}

export async function sendActionEmail(templateParams: ActionEmailParams) {
  const { serviceId, templateId, publicKey, privateKey } = getEmailJsConfig();

  const payload: Record<string, unknown> = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: templateParams,
  };

  if (privateKey) {
    payload.accessToken = privateKey;
  }

  const response = await fetch(EMAILJS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `EmailJS request failed with status ${response.status}: ${errorText}`
    );
  }
}

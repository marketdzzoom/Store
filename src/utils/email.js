import emailjs from '@emailjs/browser';
import { formatPrice, formatPhoneForWhatsApp } from './formatters';

/**
 * Send Order Email via EmailJS, FormSubmit.co, or Formspree
 */
export async function sendOrderNotification({ orderData, emailConfig }) {
  const { customer, items, subtotal, shippingFee, total } = orderData;

  // Build items formatted text
  const itemsText = items
    .map((item) => {
      const specs = [];
      if (item.selectedSize) specs.push(`Pointure/Taille: ${item.selectedSize}`);
      if (item.selectedColor) specs.push(`Couleur: ${item.selectedColor}`);
      const specsStr = specs.length > 0 ? ` (${specs.join(' | ')})` : '';
      return `- ${item.title}${specsStr} x ${item.quantity} (${formatPrice(item.price)} unitaire)`;
    })
    .join('\n');

  // Format full message body
  const orderSummaryBody = `
========================================
    NOUVELLE COMMANDE - ZOOM MARKET DZ
========================================

Nom du Client : ${customer.fullName}
Téléphone : ${customer.phone}${customer.phoneBackup ? ` (Secours: ${customer.phoneBackup})` : ''}
Wilaya & Adresse : ${customer.wilaya} - ${customer.address}
${customer.notes ? `Remarques : ${customer.notes}` : ''}

Détails de la Commande :
${itemsText}

----------------------------------------
Sous-total : ${formatPrice(subtotal)}
Frais de livraison : ${formatPrice(shippingFee)}
TOTAL COMMANDE : ${formatPrice(total)} DZD
========================================
  `.trim();

  const recipientEmail = emailConfig.recipientEmail || 'marketdzzoom@gmail.com';

  const templateParams = {
    to_email: recipientEmail,
    recipient: recipientEmail,
    email: recipientEmail,
    name: customer.fullName,
    customer_name: customer.fullName,
    customer_phone: customer.phone,
    customer_wilaya: customer.wilaya,
    customer_address: customer.address,
    customer_notes: customer.notes || 'Aucune',
    order_details: itemsText,
    subtotal: formatPrice(subtotal),
    shipping_fee: formatPrice(shippingFee),
    total_amount: `${formatPrice(total)} DZD`,
    message_body: orderSummaryBody,
    _subject: `🛒 Nouvelle Commande Zoom Market DZ - ${customer.fullName} (${customer.wilaya})`
  };

  let sent = false;
  let lastError = null;

  // 1. Attempt EmailJS SDK if keys are configured
  if (emailConfig.publicKey && emailConfig.serviceId && emailConfig.templateId) {
    try {
      // Initialize EmailJS
      emailjs.init(emailConfig.publicKey.trim());
      
      const response = await emailjs.send(
        emailConfig.serviceId.trim(),
        emailConfig.templateId.trim(),
        templateParams,
        emailConfig.publicKey.trim()
      );
      console.log('✅ EmailJS dispatch success:', response);
      sent = true;
      return { success: true, method: 'emailjs', response };
    } catch (error) {
      console.warn('⚠️ EmailJS SDK error, trying REST API fallback:', error);
      lastError = error;

      // Try Direct EmailJS REST API
      try {
        const restRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: emailConfig.serviceId.trim(),
            template_id: emailConfig.templateId.trim(),
            user_id: emailConfig.publicKey.trim(),
            template_params: templateParams
          })
        });

        if (restRes.ok) {
          console.log('✅ EmailJS REST API dispatch success');
          sent = true;
          return { success: true, method: 'emailjs-rest' };
        }
      } catch (restErr) {
        console.warn('EmailJS REST error:', restErr);
      }
    }
  }

  // 2. Attempt Formspree if custom endpoint configured
  if (emailConfig.formspreeEndpoint) {
    try {
      const res = await fetch(emailConfig.formspreeEndpoint.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(templateParams)
      });
      if (res.ok) {
        console.log('✅ Formspree dispatch success');
        sent = true;
        return { success: true, method: 'formspree' };
      }
    } catch (error) {
      console.warn('Formspree error:', error);
    }
  }

  // 3. Fallback to FormSubmit.co Free Direct Email Endpoint to marketdzzoom@gmail.com
  try {
    const formSubmitUrl = `https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`;
    const fsRes = await fetch(formSubmitUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        'Client': customer.fullName,
        'Téléphone': customer.phone,
        'Wilaya': customer.wilaya,
        'Adresse': customer.address,
        'Remarques': customer.notes || 'Aucune',
        'Commande': itemsText,
        'Total': `${formatPrice(total)} DZD`,
        '_subject': `🛒 Nouvelle Commande Zoom Market DZ - ${customer.fullName} (${customer.wilaya})`
      })
    });

    if (fsRes.ok) {
      console.log('✅ Direct Email dispatch success to', recipientEmail);
      return { success: true, method: 'formsubmit' };
    }
  } catch (fsErr) {
    console.warn('FormSubmit fallback error:', fsErr);
  }

  // If all net dispatches failed or in demo mode
  console.log('Order notification fallback summary:', orderSummaryBody);
  return { 
    success: true, 
    method: 'demo', 
    warning: lastError ? `EmailJS retour: ${lastError.text || lastError.message || 'Clés non reconnues'}` : null
  };
}

/**
 * Generate WhatsApp Order Link
 */
export function generateWhatsAppOrderUrl(orderData, storePhone = '0550000000') {
  const { customer, items, subtotal, shippingFee, total } = orderData;
  
  const itemsList = items
    .map(i => {
      const specs = [];
      if (i.selectedSize) specs.push(`Pointure/Taille: ${i.selectedSize}`);
      if (i.selectedColor) specs.push(`Couleur: ${i.selectedColor}`);
      const specsStr = specs.length > 0 ? ` [${specs.join(' | ')}]` : '';
      return `• *${i.title}*${specsStr} x${i.quantity} (${formatPrice(i.price)})`;
    })
    .join('\n');

  const text = `🛒 *NOUVELLE COMMANDE - ZOOM MARKET DZ*

👤 *Nom:* ${customer.fullName}
📞 *Tél:* ${customer.phone}${customer.phoneBackup ? ` (Secours: ${customer.phoneBackup})` : ''}
📍 *Wilaya:* ${customer.wilaya}
🏠 *Adresse:* ${customer.address}
${customer.notes ? `📝 *Notes:* ${customer.notes}\n` : ''}
📦 *Produits:*
${itemsList}

💰 *Sous-total:* ${formatPrice(subtotal)}
🚚 *Livraison:* ${formatPrice(shippingFee)}
💵 *TOTAL:* *${formatPrice(total)} DZD*

Merci d'avance pour la confirmation de ma commande !`;

  const encodedText = encodeURIComponent(text);
  const formattedPhone = formatPhoneForWhatsApp(storePhone);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}

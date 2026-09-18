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
    to_name: 'Zoom Market DZ',
    from_name: customer.fullName,
    name: customer.fullName,
    customer_name: customer.fullName,
    customer_phone: customer.phone,
    phone: customer.phone,
    customer_wilaya: customer.wilaya,
    wilaya: customer.wilaya,
    customer_address: customer.address,
    address: customer.address,
    customer_notes: customer.notes || 'Aucune',
    notes: customer.notes || 'Aucune',
    order_details: itemsText,
    items_summary: itemsText,
    items: itemsText,
    subtotal: `${formatPrice(subtotal)} DZD`,
    shipping_fee: `${formatPrice(shippingFee)} DZD`,
    total_amount: `${formatPrice(total)} DZD`,
    total_price: `${formatPrice(total)} DZD`,
    total: `${formatPrice(total)} DZD`,
    message_body: orderSummaryBody,
    message: orderSummaryBody,
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
 * Generate WhatsApp Order Link with Complete Order Details
 */
export function generateWhatsAppOrderUrl(orderData, storePhone = '+213663085069', lang = 'ar') {
  const { customer, items, subtotal, shippingFee, total } = orderData;
  const isAr = lang === 'ar';
  
  const itemsList = items
    .map((i) => {
      const title = (isAr && i.titleAr) ? i.titleAr : i.title;
      const specs = [];
      if (i.selectedSize) specs.push(isAr ? `المقاس: *${i.selectedSize}*` : `Pointure: *${i.selectedSize}*`);
      if (i.selectedColor) specs.push(isAr ? `اللون: *${i.selectedColor}*` : `Couleur: *${i.selectedColor}*`);
      const specsStr = specs.length > 0 ? `\n   ${specs.join(' | ')}` : '';
      return `• *${title}*${specsStr}\n   ${isAr ? 'الكمية' : 'Qté'}: *${i.quantity}* | ${isAr ? 'السعر' : 'Prix'}: *${formatPrice(i.price * i.quantity)}*`;
    })
    .join('\n\n');

  let text = '';
  if (isAr) {
    text = `🛒 *طلب شراء جديد عبر الموقع - زوم ماركت ديزاد*

👤 *الاسم واللقب:* ${customer.fullName}
📞 *رقم الهاتف:* ${customer.phone}${customer.phoneBackup ? ` (احتياطي: ${customer.phoneBackup})` : ''}
📍 *ولاية التوصيل:* ${customer.wilaya}
🏠 *البلدية والعنوان:* ${customer.address}
${customer.notes ? `📝 *ملاحظات:* ${customer.notes}\n` : ''}
━━━━━━━━━━━━━━━━━━
📦 *تفاصيل المنتجات المطلوبة:*
${itemsList}
━━━━━━━━━━━━━━━━━━
💰 *المجموع الفرعي:* ${formatPrice(subtotal)}
🚚 *مصاريف التوصيل:* ${formatPrice(shippingFee)}
💵 *المبلغ الإجمالي عند الاستلام:* *${formatPrice(total)}*

🤝 *طريقة الاستلام والدفع:*
توصيل سريع حتى باب المنزل مع إمكانية معاينة وفحص الحذاء قبل الدفع نقداً.
يرجى تأكيد إرسال الطلبية وشكراً!`;
  } else {
    text = `🛒 *NOUVELLE COMMANDE - ZOOM MARKET DZ*

👤 *Nom & Prénom :* ${customer.fullName}
📞 *Tél :* ${customer.phone}${customer.phoneBackup ? ` (Secours: ${customer.phoneBackup})` : ''}
📍 *Wilaya :* ${customer.wilaya}
🏠 *Commune & Adresse :* ${customer.address}
${customer.notes ? `📝 *Notes :* ${customer.notes}\n` : ''}
━━━━━━━━━━━━━━━━━━
📦 *Détail des Articles Commandés :*
${itemsList}
━━━━━━━━━━━━━━━━━━
💰 *Sous-total :* ${formatPrice(subtotal)}
🚚 *Frais de Livraison :* ${formatPrice(shippingFee)}
💵 *TOTAL À PAYER À LA RÉCEPTION :* *${formatPrice(total)}*

🤝 *Paiement & Livraison :*
Livraison à domicile et paiement en espèces après vérification du colis.
Merci de bien vouloir confirmer l'expédition de ma commande !`;
  }

  const encodedText = encodeURIComponent(text);
  const formattedPhone = formatPhoneForWhatsApp(storePhone);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}

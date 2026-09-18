import React, { useState } from 'react';
import { X, Settings, Mail, Key, Phone, Check, Info, Send } from 'lucide-react';
import { sendOrderNotification } from '../utils/email';

export default function EmailSettingsModal({ isOpen, onClose, emailConfig, onSaveConfig }) {
  const [serviceId, setServiceId] = useState(emailConfig.serviceId || '');
  const [templateId, setTemplateId] = useState(emailConfig.templateId || '');
  const [publicKey, setPublicKey] = useState(emailConfig.publicKey || '');
  const [recipientEmail, setRecipientEmail] = useState(emailConfig.recipientEmail || 'marketdzzoom@gmail.com');
  const [storePhone, setStorePhone] = useState((emailConfig.storePhone && emailConfig.storePhone !== '0550000000') ? emailConfig.storePhone : '+213663085069');
  const [formspreeEndpoint, setFormspreeEndpoint] = useState(emailConfig.formspreeEndpoint || '');

  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveConfig({
      serviceId: serviceId.trim(),
      templateId: templateId.trim(),
      publicKey: publicKey.trim(),
      recipientEmail: recipientEmail.trim(),
      storePhone: storePhone.trim(),
      formspreeEndpoint: formspreeEndpoint.trim()
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setTestResult(null);

    const testConfig = {
      serviceId: serviceId.trim(),
      templateId: templateId.trim(),
      publicKey: publicKey.trim(),
      recipientEmail: recipientEmail.trim(),
      storePhone: storePhone.trim(),
      formspreeEndpoint: formspreeEndpoint.trim()
    };

    const testOrder = {
      customer: {
        fullName: "Test Zoom Market Dz",
        phone: "0550123456",
        wilaya: "16 - Alger",
        address: "Test adresse de livraison",
        notes: "Ceci est un test de vérification d'e-mail."
      },
      items: [
        { title: "Produit Test Zoom Market", quantity: 1, price: 5000 }
      ],
      subtotal: 5000,
      shippingFee: 400,
      total: 5400
    };

    const res = await sendOrderNotification({ orderData: testOrder, emailConfig: testConfig });
    setTesting(false);
    setTestResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-brand-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-brand-orange" />
            <div>
              <h2 className="font-extrabold text-base">Configuration des Emails & WhatsApp</h2>
              <p className="text-xs text-slate-300">Réception sur marketdzzoom@gmail.com</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {saved && (
            <div className="p-3 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              Paramètres enregistrés avec succès !
            </div>
          )}

          {testResult && (
            <div className={`p-3 rounded-xl text-xs font-bold ${
              testResult.success 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}>
              <p className="font-extrabold mb-1">Résultat du test d'envoi :</p>
              <p>Méthode utilisée : <strong>{testResult.method}</strong></p>
              {testResult.method === 'formsubmit' && (
                <p className="mt-1 font-normal text-[11px]">
                  📩 Un e-mail de confirmation FormSubmit a été envoyé à <strong>{recipientEmail}</strong>. Veuillez ouvrir votre boîte e-mail et cliquer sur "Activate Form" pour valider la réception automatique de vos commandes !
                </p>
              )}
            </div>
          )}

          <div className="p-3 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-xl text-xs text-blue-900 dark:text-slate-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-orange flex-shrink-0 mt-0.5" />
            <span>
              Les commandes sont adressées à <strong>{recipientEmail}</strong>. Pour lier votre compte EmailJS, saisissez vos clés ci-dessous.
            </span>
          </div>

          {/* Email Destinataire */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Adresse e-mail de réception des commandes
            </label>
            <div className="relative">
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="marketdzzoom@gmail.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Store WhatsApp Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Numéro WhatsApp de réception directe
            </label>
            <div className="relative">
              <input
                type="text"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="0550000000"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
              />
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* EmailJS Parameters */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-orange flex items-center gap-1">
              <Key className="w-3.5 h-3.5" /> Clés EmailJS.com
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Public Key (EmailJS)
              </label>
              <input
                type="text"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="Ex: user_xyz123abc"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Service ID
                </label>
                <input
                  type="text"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  placeholder="service_xyz"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Template ID
                </label>
                <input
                  type="text"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  placeholder="template_abc"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Test Email Dispatch Button */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testing}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-brand-orange" />
              <span>{testing ? 'Envoi du test...' : 'Envoyer un e-mail de test'}</span>
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3 rounded-xl font-extrabold text-sm shadow-md transition-all active:scale-95 mt-4"
          >
            Enregistrer les paramètres
          </button>
        </form>
      </div>
    </div>
  );
}

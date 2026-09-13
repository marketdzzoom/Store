import React, { useState, useEffect } from 'react';
import { X, Lock, Key, ShieldCheck, AlertCircle, Check, Clock, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { verifyAdminPin, changeAdminPin, getLockoutStatus } from '../utils/auth';
import { verifyAdminGeoLocation } from '../utils/geoSecurity';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState(getLockoutStatus);

  // Security Check State
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [isCheckingSecurity, setIsCheckingSecurity] = useState(true);
  
  // Change PIN mode
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [showChangePin, setShowChangePin] = useState(false);
  const [changeSuccess, setChangeSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsCheckingSecurity(true);
    setError('');

    verifyAdminGeoLocation().then((result) => {
      if (isMounted) {
        setIsAuthorized(result.allowed);
        setIsCheckingSecurity(false);
        if (!result.allowed) {
          setError(result.message || 'Accès non autorisé.');
        }
      }
    });

    return () => { isMounted = false; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setLockoutInfo(getLockoutStatus());

    const interval = setInterval(() => {
      const status = getLockoutStatus();
      setLockoutInfo(status);
      if (!status.isLocked && error.includes('bloqué')) {
        setError('');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, error]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!isAuthorized) {
      setError('Accès non autorisé. (Code: 403-DENIED)');
      return;
    }

    if (!pin.trim()) {
      setError('Veuillez saisir votre code PIN.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await verifyAdminPin(pin);
      setIsVerifying(false);

      if (result.success) {
        setError('');
        setPin('');
        onLoginSuccess();
      } else {
        setError(result.message || 'Authentification échouée.');
        setLockoutInfo(getLockoutStatus());
      }
    } catch (err) {
      setIsVerifying(false);
      setError('Erreur de validation.');
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();

    if (!isAuthorized) {
      setError('Action non autorisée.');
      return;
    }

    if (!currentPinInput.trim() || !newPinInput.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setIsVerifying(true);
    const verifyCurrent = await verifyAdminPin(currentPinInput);
    if (!verifyCurrent.success) {
      setIsVerifying(false);
      setError('Code PIN actuel incorrect.');
      return;
    }

    if (newPinInput.length < 4) {
      setIsVerifying(false);
      setError('Le code PIN doit comporter au moins 4 caractères.');
      return;
    }

    try {
      await changeAdminPin(newPinInput);
      setIsVerifying(false);
      setChangeSuccess(true);
      setError('');
      setTimeout(() => {
        setChangeSuccess(false);
        setIsChangingPin(false);
        setCurrentPinInput('');
        setNewPinInput('');
      }, 1500);
    } catch (err) {
      setIsVerifying(false);
      setError('Erreur lors du changement de PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 text-center relative p-6 sm:p-8 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon */}
        <div className={`w-16 h-16 ${
          !isAuthorized || lockoutInfo.isLocked
            ? 'bg-red-500/10 text-red-500 border-red-500/30'
            : 'bg-brand-orange/10 text-brand-orange border-brand-orange/20'
        } rounded-full flex items-center justify-center mx-auto mb-4 border-2 shadow-inner`}>
          {!isAuthorized || lockoutInfo.isLocked ? <ShieldAlert className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
          Espace Administrateur 🔒
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Authentification de session requise.
        </p>

        {/* Generic Opaque Error Banner if Unauthorized */}
        {!isAuthorized && !isCheckingSecurity && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 text-left border border-red-200 dark:border-red-900">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Accès non autorisé sur cet environnement. (Code: 403)</span>
          </div>
        )}

        {/* Lockout Warning Banner */}
        {lockoutInfo.isLocked && isAuthorized && (
          <div className="mb-4 p-3.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-2xl text-xs font-bold border border-red-200 dark:border-red-900 flex items-center gap-2.5 text-left">
            <Clock className="w-5 h-5 flex-shrink-0 text-red-600" />
            <div>
              <p className="font-extrabold">Accès temporairement verrouillé</p>
              <p className="text-[11px] font-normal mt-0.5">
                Veuillez patienter : <strong>{lockoutInfo.remainingMinutes} min</strong>
              </p>
            </div>
          </div>
        )}

        {error && !lockoutInfo.isLocked && isAuthorized && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {changeSuccess && (
          <div className="mb-4 p-3 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 text-left">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Code PIN administrateur mis à jour !</span>
          </div>
        )}

        {!isChangingPin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-left">
                Code PIN Administrateur
              </label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  disabled={!isAuthorized || lockoutInfo.isLocked || isVerifying || isCheckingSecurity}
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setError(''); }}
                  placeholder="Ex: DZ2026"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none font-bold text-center tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                  autoFocus
                  maxLength={12}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  aria-label={showPin ? "Masquer le code PIN" : "Afficher le code PIN"}
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isAuthorized || lockoutInfo.isLocked || isVerifying || isCheckingSecurity}
              className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white py-3.5 rounded-xl font-extrabold text-sm shadow-lg hover:shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Connexion</span>
                </>
              )}
            </button>

            {isAuthorized && (
              <button
                type="button"
                disabled={lockoutInfo.isLocked}
                onClick={() => { setIsChangingPin(true); setError(''); }}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline block mx-auto pt-2"
              >
                Modifier le code PIN
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={handleChangePin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Code PIN Actuel
              </label>
              <input
                type="password"
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value)}
                placeholder="PIN actuel"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nouveau Code PIN
              </label>
              <input
                type="password"
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                placeholder="Nouveau PIN"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-orange focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setIsChangingPin(false); setError(''); }}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl font-bold text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="flex-1 bg-brand-orange hover:bg-brand-orange-hover text-white py-2.5 rounded-xl font-bold text-xs shadow disabled:opacity-50"
              >
                {isVerifying ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

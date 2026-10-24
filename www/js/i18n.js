// Arabic, French and English. Add a key to all three.
const D = {
  ar: {
    appName: 'قطع غيار الهواتف', signin: 'تسجيل الدخول', signup: 'إنشاء حساب', phone: 'رقم الهاتف', password: 'كلمة السر', name: 'الاسم',
    phoneHint: 'مثال: 0555123456', passHint: '6 أحرف على الأقل', haveAcc: 'لديك حساب؟ سجّل الدخول', noAcc: 'ليس لديك حساب؟ أنشئ حسابًا',
    signout: 'خروج', errBadLogin: 'رقم الهاتف أو كلمة السر غير صحيحة.', errPhone: 'أدخل رقم هاتف صحيحًا.', errPass: 'كلمة السر 6 أحرف على الأقل.',
    errName: 'أدخل اسمك.', errExists: 'هذا الرقم مسجّل من قبل. سجّل الدخول.', errNet: 'لا يوجد اتصال بالإنترنت. حاول مرة أخرى.', errOther: 'حدث خطأ. حاول مرة أخرى.',
    loading: 'جارٍ التحميل…', pendingTitle: 'طلبك قيد المراجعة', pendingText: 'سيوافق صاحب المحل على حسابك قريبًا. بعد الموافقة تظهر لك القطع والأسعار وتستطيع الطلب.',
    blockedTitle: 'الحساب غير مفعّل', blockedText: 'تواصل مع المحل لتفعيل حسابك.', callShop: 'اتصل بالمحل', checkAgain: 'تحقق من جديد',
    ownerBox: 'أنا صاحب المحل', ownerHint: 'لتفعيل حسابك كصاحب محل: في Firebase افتح Firestore، أنشئ مجموعة admins، وأضف وثيقة معرّفها هو الرقم التالي، ثم اضغط تحقق من جديد.',
    yourId: 'معرّف حسابك', copy: 'نسخ', copied: 'تم النسخ.', needSetup: 'التطبيق يحتاج إعداد Firebase. اتبع ملف الإعداد.',
    createProfileTitle: 'أكمل التسجيل', createProfileText: 'أدخل اسمك ليراجع صاحب المحل حسابك.', send: 'إرسال',
    shop: 'المتجر', myOrders: 'طلباتي', search: 'ابحث عن قطعة أو موديل', all: 'الكل', inStock: 'متوفر', fewLeft: 'كمية قليلة', outStock: 'غير متوفر',
    noParts: 'لا توجد قطع بعد.', noMatch: 'لا توجد قطعة مطابقة.', basket: 'السلة', yourBasket: 'سلتك', total: 'المجموع', each: 'للقطعة',
    items: (n) => n + ' قطعة', onlyN: (n) => 'المتوفر ' + n + ' فقط.', note: 'ملاحظة (اختياري)', notePh: 'مثال: موديل الهاتف، اللون', placeOrder: 'أرسل الطلب',
    payNote: 'الدفع والاستلام في المحل. نؤكد التوفر والسعر النهائي.', emptyBasket: 'إفراغ السلة', orderSent: 'تم إرسال طلبك. سيؤكده المحل قريبًا.',
    orderFail: 'تعذر إرسال الطلب. حاول مرة أخرى.', noOrders: 'لا توجد طلبات بعد.', orderNo: 'طلب',
    st_new: 'مُرسل', st_confirmed: 'مؤكَّد', st_ready: 'جاهز للاستلام', st_picked: 'تم الاستلام', st_cancelled: 'ملغى', st_declined: 'مرفوض',
    close: 'إغلاق', save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', tapAgain: 'اضغط مرة أخرى للتأكيد', language: 'اللغة', done: 'تم',
    tabOrders: 'الطلبات', tabSell: 'بيع', tabStock: 'المخزون', tabCustomers: 'الزبائن', tabSales: 'المبيعات', settings: 'الإعدادات',
    open: 'مفتوحة', closed: 'منتهية', noOpen: 'لا توجد طلبات مفتوحة.', noClosed: 'لا شيء هنا بعد.', confirm: 'تأكيد', decline: 'رفض', ready: 'جاهز للاستلام',
    picked: 'تم الاستلام: سجّل البيع', cancelOrder: 'إلغاء الطلب', reopen: 'إعادة فتح', callCustomer: 'اتصال', newOrderFrom: (n, tot) => 'طلب جديد من ' + n + ': ' + tot,
    notInStock: (p, h) => 'المخزون من ' + p + ' هو ' + h + ' فقط. عدّل المخزون أولًا.', partGone: 'إحدى القطع لم تعد في المخزون.', saleDone: 'تم تسجيل البيع: ',
    approve: 'موافقة', block: 'حظر', unblock: 'إلغاء الحظر', remove: 'إزالة', pendingReq: 'طلبات بانتظار موافقتك', approvedList: 'زبائن معتمدون', blockedList: 'محظورون',
    limitReached: 'وصلت إلى حد 50 زبونًا في هذه التجربة.', noPending: 'لا توجد طلبات جديدة.', noCustomers: 'لا يوجد زبائن معتمدون بعد.', joined: 'سجّل في',
    addPart: '+ إضافة قطعة', editPart: 'تعديل القطعة', partName: 'اسم القطعة', compat: 'الهواتف المتوافقة', category: 'الفئة', sku: 'الرمز أو رقم الرف',
    qty: 'الكمية', alertAt: 'تنبيه عند', buy: 'سعر الشراء (DA)', sell: 'سعر البيع (DA)', margin: (m, p) => 'ربحك ' + m + ' للقطعة (' + p + '%).',
    lowOnly: 'المخزون المنخفض فقط', partsListed: 'قطع مسجلة', unitsOnShelf: 'وحدات في الرف', stockCost: 'قيمة المخزون', reorder: 'تحتاج طلبًا', partSaved: 'تم حفظ القطعة.',
    low: 'منخفض', out: 'نفد', firstPart: 'أضف أول قطعة', noPartsOwner: 'لم تضف قطعًا بعد. أضف القطع بسعر الشراء والبيع والكمية.',
    recordSale: 'سجّل البيع', discount: 'تخفيض (DA)', currentSale: 'البيع الحالي', customerNote: 'ملاحظة أو اسم الزبون',
    today: 'اليوم', days7: '7 أيام', allTime: 'الكل', revenue: 'الإيراد', profit: 'الربح', salesCount: 'عمليات البيع', partsSold: 'قطع مباعة', noSales: 'لا توجد مبيعات في هذه الفترة.',
    shopName: 'اسم المحل', shopPhone: 'هاتف المحل', saved: 'تم الحفظ.', newBadge: 'جديد', parts: 'قطع', fromCustomer: 'الزبون', phoneLabel: 'الهاتف'
  },
  fr: {
    appName: 'Pièces de téléphone', signin: 'Connexion', signup: 'Créer un compte', phone: 'Numéro de téléphone', password: 'Mot de passe', name: 'Nom',
    phoneHint: 'ex. 0555123456', passHint: '6 caractères minimum', haveAcc: 'Déjà un compte ? Connectez-vous', noAcc: 'Pas de compte ? Créez-en un',
    signout: 'Quitter', errBadLogin: 'Numéro ou mot de passe incorrect.', errPhone: 'Entrez un numéro de téléphone valide.', errPass: 'Le mot de passe doit avoir 6 caractères minimum.',
    errName: 'Entrez votre nom.', errExists: 'Ce numéro est déjà inscrit. Connectez-vous.', errNet: 'Pas de connexion internet. Réessayez.', errOther: 'Une erreur est survenue. Réessayez.',
    loading: 'Chargement…', pendingTitle: 'Demande en cours de validation', pendingText: 'Le propriétaire va approuver votre compte. Ensuite vous verrez les pièces et les prix et pourrez commander.',
    blockedTitle: 'Compte non activé', blockedText: 'Contactez la boutique pour activer votre compte.', callShop: 'Appeler la boutique', checkAgain: 'Vérifier à nouveau',
    ownerBox: 'Je suis le propriétaire', ownerHint: 'Pour activer votre compte propriétaire : dans Firebase, ouvrez Firestore, créez la collection admins et ajoutez un document dont l’identifiant est le numéro ci-dessous, puis touchez Vérifier à nouveau.',
    yourId: 'Identifiant de votre compte', copy: 'Copier', copied: 'Copié.', needSetup: 'L’application doit être configurée avec Firebase. Suivez le guide d’installation.',
    createProfileTitle: 'Terminez votre inscription', createProfileText: 'Entrez votre nom pour que le propriétaire examine votre compte.', send: 'Envoyer',
    shop: 'Boutique', myOrders: 'Mes commandes', search: 'Chercher une pièce ou un modèle', all: 'Tout', inStock: 'En stock', fewLeft: 'Dernières pièces', outStock: 'Rupture',
    noParts: 'Aucune pièce pour le moment.', noMatch: 'Aucune pièce ne correspond.', basket: 'Panier', yourBasket: 'Votre panier', total: 'Total', each: 'l’unité',
    items: (n) => n + ' article' + (n > 1 ? 's' : ''), onlyN: (n) => 'Seulement ' + n + ' disponible' + (n > 1 ? 's' : '') + '.', note: 'Remarque (facultatif)', notePh: 'ex. modèle du téléphone, couleur', placeOrder: 'Envoyer la commande',
    payNote: 'Paiement et retrait en magasin. Nous confirmons la disponibilité et le prix final.', emptyBasket: 'Vider le panier', orderSent: 'Commande envoyée. La boutique va la confirmer.',
    orderFail: 'Impossible d’envoyer la commande. Réessayez.', noOrders: 'Aucune commande pour le moment.', orderNo: 'Commande',
    st_new: 'Envoyée', st_confirmed: 'Confirmée', st_ready: 'Prête à retirer', st_picked: 'Retirée', st_cancelled: 'Annulée', st_declined: 'Refusée',
    close: 'Fermer', save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', tapAgain: 'Touchez encore pour confirmer', language: 'Langue', done: 'Terminé',
    tabOrders: 'Commandes', tabSell: 'Vente', tabStock: 'Stock', tabCustomers: 'Clients', tabSales: 'Ventes', settings: 'Réglages',
    open: 'En cours', closed: 'Terminées', noOpen: 'Aucune commande en cours.', noClosed: 'Rien pour le moment.', confirm: 'Confirmer', decline: 'Refuser', ready: 'Prête à retirer',
    picked: 'Retirée : enregistrer la vente', cancelOrder: 'Annuler la commande', reopen: 'Rouvrir', callCustomer: 'Appeler', newOrderFrom: (n, tot) => 'Nouvelle commande de ' + n + ' : ' + tot,
    notInStock: (p, h) => 'Il ne reste que ' + h + ' de ' + p + '. Corrigez d’abord le stock.', partGone: 'Une pièce n’est plus dans le stock.', saleDone: 'Vente enregistrée : ',
    approve: 'Approuver', block: 'Bloquer', unblock: 'Débloquer', remove: 'Retirer', pendingReq: 'Demandes à approuver', approvedList: 'Clients approuvés', blockedList: 'Bloqués',
    limitReached: 'Limite de 50 clients atteinte pour cet essai.', noPending: 'Aucune nouvelle demande.', noCustomers: 'Aucun client approuvé pour le moment.', joined: 'Inscrit le',
    addPart: '+ Ajouter une pièce', editPart: 'Modifier la pièce', partName: 'Nom de la pièce', compat: 'Téléphones compatibles', category: 'Catégorie', sku: 'Code ou étagère',
    qty: 'En stock', alertAt: 'Alerte à', buy: 'Prix d’achat (DA)', sell: 'Prix de vente (DA)', margin: (m, p) => 'Vous gagnez ' + m + ' par pièce (' + p + ' %).',
    lowOnly: 'Stock bas seulement', partsListed: 'Pièces listées', unitsOnShelf: 'Unités en rayon', stockCost: 'Stock au coût', reorder: 'À recommander', partSaved: 'Pièce enregistrée.',
    low: 'Bas', out: 'Rupture', firstPart: 'Ajouter la première pièce', noPartsOwner: 'Aucune pièce. Ajoutez vos pièces avec prix d’achat, prix de vente et quantité.',
    recordSale: 'Enregistrer la vente', discount: 'Remise (DA)', currentSale: 'Vente en cours', customerNote: 'Client ou remarque',
    today: 'Aujourd’hui', days7: '7 jours', allTime: 'Tout', revenue: 'Chiffre d’affaires', profit: 'Bénéfice', salesCount: 'Ventes', partsSold: 'Pièces vendues', noSales: 'Aucune vente sur cette période.',
    shopName: 'Nom de la boutique', shopPhone: 'Téléphone de la boutique', saved: 'Enregistré.', newBadge: 'Nouveau', parts: 'pièces', fromCustomer: 'Client', phoneLabel: 'Téléphone'
  },
  en: {
    appName: 'Phone parts', signin: 'Sign in', signup: 'Create account', phone: 'Phone number', password: 'Password', name: 'Name',
    phoneHint: 'e.g. 0555123456', passHint: 'At least 6 characters', haveAcc: 'Have an account? Sign in', noAcc: 'No account? Create one',
    signout: 'Sign out', errBadLogin: 'Wrong phone number or password.', errPhone: 'Enter a valid phone number.', errPass: 'Password must be at least 6 characters.',
    errName: 'Enter your name.', errExists: 'This number is already registered. Sign in.', errNet: 'No internet connection. Try again.', errOther: 'Something went wrong. Try again.',
    loading: 'Loading…', pendingTitle: 'Request under review', pendingText: 'The owner will approve your account soon. After that you can see the parts and prices and place orders.',
    blockedTitle: 'Account not active', blockedText: 'Contact the shop to activate your account.', callShop: 'Call the shop', checkAgain: 'Check again',
    ownerBox: 'I am the shop owner', ownerHint: 'To make your account the owner account: in Firebase open Firestore, create the collection admins and add a document whose ID is the number below, then tap Check again.',
    yourId: 'Your account ID', copy: 'Copy', copied: 'Copied.', needSetup: 'The app needs Firebase set up. Follow the setup guide.',
    createProfileTitle: 'Finish signing up', createProfileText: 'Enter your name so the owner can review your account.', send: 'Send',
    shop: 'Shop', myOrders: 'My orders', search: 'Search a part or phone model', all: 'All', inStock: 'In stock', fewLeft: 'Few left', outStock: 'Out of stock',
    noParts: 'No parts yet.', noMatch: 'No part matches your search.', basket: 'Basket', yourBasket: 'Your basket', total: 'Total', each: 'each',
    items: (n) => (n === 1 ? '1 item' : n + ' items'), onlyN: (n) => 'Only ' + n + ' available.', note: 'Note (optional)', notePh: 'e.g. phone model, colour', placeOrder: 'Place order',
    payNote: 'You pay and collect in the shop. We confirm availability and the final price.', emptyBasket: 'Empty basket', orderSent: 'Order sent. The shop will confirm it soon.',
    orderFail: 'Could not send the order. Try again.', noOrders: 'No orders yet.', orderNo: 'Order',
    st_new: 'Sent', st_confirmed: 'Confirmed', st_ready: 'Ready for pickup', st_picked: 'Picked up', st_cancelled: 'Cancelled', st_declined: 'Declined',
    close: 'Close', save: 'Save', cancel: 'Cancel', delete: 'Delete', tapAgain: 'Tap again to confirm', language: 'Language', done: 'Done',
    tabOrders: 'Orders', tabSell: 'Sell', tabStock: 'Stock', tabCustomers: 'Customers', tabSales: 'Sales', settings: 'Settings',
    open: 'Open', closed: 'Done', noOpen: 'No open orders.', noClosed: 'Nothing here yet.', confirm: 'Confirm', decline: 'Decline', ready: 'Ready for pickup',
    picked: 'Picked up: record sale', cancelOrder: 'Cancel order', reopen: 'Reopen', callCustomer: 'Call', newOrderFrom: (n, tot) => 'New order from ' + n + ': ' + tot,
    notInStock: (p, h) => 'Only ' + h + ' of ' + p + ' in stock. Fix the stock first.', partGone: 'A part is no longer in stock.', saleDone: 'Sale recorded: ',
    approve: 'Approve', block: 'Block', unblock: 'Unblock', remove: 'Remove', pendingReq: 'Waiting for your approval', approvedList: 'Approved customers', blockedList: 'Blocked',
    limitReached: 'You reached the limit of 50 customers for this trial.', noPending: 'No new requests.', noCustomers: 'No approved customers yet.', joined: 'Joined',
    addPart: '+ Add part', editPart: 'Edit part', partName: 'Part name', compat: 'Compatible phones', category: 'Category', sku: 'SKU or shelf code',
    qty: 'In stock', alertAt: 'Alert at', buy: 'Buy price (DA)', sell: 'Sell price (DA)', margin: (m, p) => 'You make ' + m + ' per unit (' + p + '%).',
    lowOnly: 'Low stock only', partsListed: 'Parts listed', unitsOnShelf: 'Units on shelf', stockCost: 'Stock at cost', reorder: 'Need reorder', partSaved: 'Part saved.',
    low: 'Low', out: 'Out', firstPart: 'Add your first part', noPartsOwner: 'No parts yet. Add each part with buy price, sell price and quantity.',
    recordSale: 'Record sale', discount: 'Discount (DA)', currentSale: 'Current sale', customerNote: 'Customer or note',
    today: 'Today', days7: '7 days', allTime: 'All', revenue: 'Revenue', profit: 'Profit', salesCount: 'Sales', partsSold: 'Parts sold', noSales: 'No sales in this period.',
    shopName: 'Shop name', shopPhone: 'Shop phone', saved: 'Saved.', newBadge: 'New', parts: 'parts', fromCustomer: 'Customer', phoneLabel: 'Phone'
  }
};

const nav = String((typeof navigator !== 'undefined' && navigator.language) || 'fr').slice(0, 2).toLowerCase();
let lang = 'fr';
try { lang = localStorage.getItem('lang') || (nav === 'ar' ? 'ar' : nav === 'en' ? 'en' : 'fr'); } catch (e) { /* storage blocked */ }
if (!D[lang]) lang = 'fr';

export const getLang = () => lang;
export const locale = () => (lang === 'ar' ? 'ar-DZ' : lang === 'en' ? 'en-GB' : 'fr-FR');
export function applyDir() { document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; }
export function setLang(l) { if (!D[l]) return; lang = l; try { localStorage.setItem('lang', l); } catch (e) { /* ignore */ } applyDir(); }
export function t(k, ...a) {
  const v = (D[lang] && D[lang][k] !== undefined) ? D[lang][k] : (D.fr[k] !== undefined ? D.fr[k] : k);
  return typeof v === 'function' ? v(...a) : v;
}
export const CATEGORY_SUGGESTIONS = {
  ar: ['شاشات', 'بطاريات', 'منافذ الشحن', 'أغطية خلفية', 'كاميرات', 'سماعات وميكروفونات', 'إكسسوارات'],
  fr: ['Écrans', 'Batteries', 'Ports de charge', 'Coques arrière', 'Caméras', 'Haut-parleurs et micros', 'Accessoires'],
  en: ['Screens', 'Batteries', 'Charging ports', 'Back covers', 'Cameras', 'Speakers & mics', 'Accessories']
};

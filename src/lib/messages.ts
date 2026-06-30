export const MSG = {
  common: {
    unexpected: 'حدث خطأ غير متوقع. حاول مرة أخرى',
    tryAgain: 'حاول مرة أخرى',
    networkError: 'تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مجدداً',
    forbidden: 'غير مصرح لك بهذا الإجراء',
    authRequired: 'يجب تسجيل الدخول للمتابعة',
  },

  auth: {
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    loginSuccess: 'تم تسجيل الدخول بنجاح',
    logoutSuccess: 'تم تسجيل الخروج',
    registerSuccess: 'تم إنشاء الحساب بنجاح! يرجى تأكيد حسابك',
    registerFailed: 'تعذّر إنشاء الحساب. حاول مرة أخرى',
    emailTaken: 'البريد الإلكتروني مستخدم بالفعل',
    phoneTaken: 'رقم الهاتف مستخدم بالفعل',
    resetLinkSent: 'إذا كان الحساب مسجلاً، ستصلك رسالة تحتوي على رابط إعادة التعيين',
    resetLinkInvalid: 'رابط غير صالح أو منتهي الصلاحية',
    resetSuccess: 'تم تغيير كلمة المرور بنجاح',
    passwordMismatch: 'كلمتا المرور غير متطابقتان',
    verifyPhoneSuccess: 'تم تأكيد رقم الهاتف بنجاح',
    otpResent: 'تم إعادة إرسال رمز التحقق',
    otpInvalid: 'رمز التحقق غير صحيح',
  },

  validation: {
    emailRequired: 'البريد الإلكتروني مطلوب',
    emailInvalid: 'البريد الإلكتروني غير صالح',
    passwordTooShort: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    firstNameRequired: 'الاسم الأول مطلوب',
    lastNameRequired: 'الاسم الأخير مطلوب',
    phoneInvalid: 'رقم الهاتف غير صالح',
  },

  password: {
    requirements: '8 أحرف على الأقل، حرف كبير وصغير، رقم، ورمز خاص',
  },
} as const;

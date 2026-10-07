/* =========================================================
   ENG FORGE
   LOGIN SYSTEM
========================================================= */

import {
    loginWithEmail,
    loginWithGoogle,
    resetPassword
} from "./firebase.js";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loginForm =
    document.getElementById("loginForm");

const loginBtn =
    document.getElementById("loginBtn");

const googleLoginBtn =
    document.getElementById("googleLoginBtn");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const authMessage =
    document.getElementById("authMessage");

const authLoading =
    document.getElementById("authLoading");


/* =========================================================
   FORGOT PASSWORD ELEMENTS
========================================================= */

const forgotPasswordBtn =
    document.getElementById("forgotPasswordBtn");

const forgotPasswordModal =
    document.getElementById("forgotPasswordModal");

const forgotModalOverlay =
    document.getElementById("forgotModalOverlay");

const closeForgotModal =
    document.getElementById("closeForgotModal");

const forgotPasswordForm =
    document.getElementById("forgotPasswordForm");

const forgotEmail =
    document.getElementById("forgotEmail");

const resetPasswordBtn =
    document.getElementById("resetPasswordBtn");

const forgotPasswordMessage =
    document.getElementById("forgotPasswordMessage");

const forgotPasswordLoading =
    document.getElementById("forgotPasswordLoading");


/* =========================================================
   MESSAGE HELPERS
========================================================= */

function showAuthMessage(message, type = "error") {

    if (!authMessage) return;

    authMessage.textContent = message;

    authMessage.className =
        `auth-message ${type}`;

}


function showForgotMessage(message, type = "error") {

    if (!forgotPasswordMessage) return;

    forgotPasswordMessage.textContent = message;

    forgotPasswordMessage.className =
        `forgot-password-message ${type}`;

}


/* =========================================================
   LOGIN LOADING
========================================================= */

function setLoginLoading(loading) {

    if (!loginBtn || !authLoading) return;

    loginBtn.disabled = loading;

    if (loading) {

        loginBtn.textContent =
            "جاري تسجيل الدخول...";

        authLoading.style.display =
            "block";

    } else {

        loginBtn.textContent =
            "تسجيل الدخول";

        authLoading.style.display =
            "none";

    }

}


/* =========================================================
   LOGIN
========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            /* ===============================
               VALIDATION
            ================================ */

            if (!email) {

                showAuthMessage(
                    "اكتب البريد الإلكتروني."
                );

                emailInput.focus();

                return;
            }


            if (!password) {

                showAuthMessage(
                    "اكتب كلمة المرور."
                );

                passwordInput.focus();

                return;
            }


            /* ===============================
               START LOGIN
            ================================ */

            showAuthMessage("");

            setLoginLoading(true);


            try {

                await loginWithEmail(
                    email,
                    password
                );


                /* ===============================
                   SUCCESS
                ================================ */

                window.location.href =
                    "index.html";


            } catch (error) {

                console.error(
                    "Login Error:",
                    error
                );


                let message =
                    "حدث خطأ أثناء تسجيل الدخول.";


                switch (error.code) {

                    case "auth/invalid-credential":

                    case "auth/wrong-password":

                    case "auth/user-not-found":

                        message =
                            "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

                        break;


                    case "auth/invalid-email":

                        message =
                            "البريد الإلكتروني غير صحيح.";

                        break;


                    case "auth/user-disabled":

                        message =
                            "هذا الحساب تم تعطيله.";

                        break;


                    case "auth/too-many-requests":

                        message =
                            "تمت محاولات كثيرة. حاول مرة أخرى بعد قليل.";

                        break;


                    case "auth/network-request-failed":

                        message =
                            "تأكد من اتصالك بالإنترنت.";

                        break;

                }


                showAuthMessage(
                    message,
                    "error"
                );


            } finally {

                setLoginLoading(false);

            }

        }
    );

}


/* =========================================================
   GOOGLE LOGIN
========================================================= */

if (googleLoginBtn) {

    googleLoginBtn.addEventListener(
        "click",
        async () => {

            googleLoginBtn.disabled = true;

            showAuthMessage("");

            try {

                await loginWithGoogle();

                window.location.href =
                    "index.html";

            } catch (error) {

                console.error(
                    "Google Login Error:",
                    error
                );


                let message =
                    "تعذر تسجيل الدخول باستخدام Google.";


                if (
                    error.code ===
                    "auth/popup-closed-by-user"
                ) {

                    message =
                        "تم إغلاق نافذة تسجيل الدخول.";

                }

                else if (
                    error.code ===
                    "auth/popup-blocked"
                ) {

                    message =
                        "المتصفح منع نافذة تسجيل الدخول. اسمح بالنوافذ المنبثقة.";

                }

                else if (
                    error.code ===
                    "auth/network-request-failed"
                ) {

                    message =
                        "تأكد من اتصالك بالإنترنت.";

                }


                showAuthMessage(
                    message,
                    "error"
                );


            } finally {

                googleLoginBtn.disabled = false;

            }

        }
    );

}


/* =========================================================
   OPEN FORGOT PASSWORD MODAL
========================================================= */

if (forgotPasswordBtn) {

    forgotPasswordBtn.addEventListener(
        "click",
        () => {

            showForgotMessage("");

            /*
             * لو البريد موجود بالفعل في خانة تسجيل الدخول،
             * نضعه تلقائيًا في نافذة الاستعادة.
             */

            if (emailInput.value.trim()) {

                forgotEmail.value =
                    emailInput.value.trim();

            }


            forgotPasswordModal.classList.add(
                "active"
            );

            forgotPasswordModal.setAttribute(
                "aria-hidden",
                "false"
            );


            setTimeout(() => {

                forgotEmail.focus();

            }, 100);

        }
    );

}


/* =========================================================
   CLOSE FORGOT PASSWORD MODAL
========================================================= */

function closeForgotPasswordModal() {

    if (!forgotPasswordModal) return;

    forgotPasswordModal.classList.remove(
        "active"
    );

    forgotPasswordModal.setAttribute(
        "aria-hidden",
        "true"
    );

    showForgotMessage("");

}


if (closeForgotModal) {

    closeForgotModal.addEventListener(
        "click",
        closeForgotPasswordModal
    );

}


if (forgotModalOverlay) {

    forgotModalOverlay.addEventListener(
        "click",
        closeForgotPasswordModal
    );

}


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            forgotPasswordModal &&
            forgotPasswordModal.classList.contains("active")
        ) {

            closeForgotPasswordModal();

        }

    }
);


/* =========================================================
   FORGOT PASSWORD / RESET EMAIL
========================================================= */

if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                forgotEmail.value.trim();


            /* ===============================
               VALIDATION
            ================================ */

            if (!email) {

                showForgotMessage(
                    "اكتب البريد الإلكتروني."
                );

                forgotEmail.focus();

                return;
            }


            /* ===============================
               EMAIL FORMAT
            ================================ */

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!emailPattern.test(email)) {

                showForgotMessage(
                    "اكتب بريدًا إلكترونيًا صحيحًا."
                );

                forgotEmail.focus();

                return;
            }


            /* ===============================
               LOADING
            ================================ */

            resetPasswordBtn.disabled =
                true;

            resetPasswordBtn.textContent =
                "جاري الإرسال...";

            forgotPasswordLoading.style.display =
                "block";

            showForgotMessage("");


            try {

                await resetPassword(email);


                /* ===============================
                   SUCCESS
                ================================ */

                showForgotMessage(
                    "تم إرسال رابط إعادة تعيين كلمة السر إلى بريدك الإلكتروني. راجع Gmail وصندوق الرسائل غير المرغوب فيها.",
                    "success"
                );


                resetPasswordBtn.textContent =
                    "تم إرسال الرابط ✓";


                /*
                 * لا نقفل النافذة فورًا حتى يرى
                 * الطالب رسالة النجاح.
                 */


            } catch (error) {

                console.error(
                    "Password Reset Error:",
                    error
                );


                let message =
                    "تعذر إرسال رابط إعادة تعيين كلمة السر.";


                switch (error.code) {

                    case "auth/invalid-email":

                        message =
                            "البريد الإلكتروني غير صحيح.";

                        break;


                    case "auth/user-not-found":

                        message =
                            "لا يوجد حساب مرتبط بهذا البريد الإلكتروني.";

                        break;


                    case "auth/network-request-failed":

                        message =
                            "تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى.";

                        break;


                    case "auth/too-many-requests":

                        message =
                            "تم إرسال طلبات كثيرة. حاول مرة أخرى لاحقًا.";

                        break;


                    case "auth/operation-not-allowed":

                        message =
                            "إعادة تعيين كلمة السر بالبريد الإلكتروني غير مفعلة في إعدادات Firebase.";

                        break;

                }


                showForgotMessage(
                    message,
                    "error"
                );


                resetPasswordBtn.disabled =
                    false;

                resetPasswordBtn.textContent =
                    "إرسال رابط إعادة التعيين";


            } finally {

                forgotPasswordLoading.style.display =
                    "none";

            }

        }
    );

}
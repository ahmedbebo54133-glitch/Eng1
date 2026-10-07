/* =========================================================
   ENG FORGE ⚙️
   REGISTER.JS
   إنشاء حساب جديد
   ========================================================= */

import {
    loginWithGoogle,
    registerWithEmail,
    watchAuth,
    setDocument,
    getDocument
} from "./firebase.js";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const registerForm = document.getElementById("registerForm");

const studentName = document.getElementById("studentName");
const studentId = document.getElementById("studentId");

const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const profilePhoto = document.getElementById("profilePhoto");
const profilePhotoImage = document.getElementById("profilePhotoImage");
const profilePhotoPlaceholder =
    document.getElementById("profilePhotoPlaceholder");

const removeProfilePhoto =
    document.getElementById("removeProfilePhoto");

const gender = document.getElementById("gender");
const genderOptions =
    document.querySelectorAll(".gender-option");

const terms = document.getElementById("terms");

const registerBtn =
    document.getElementById("registerBtn");

const googleRegisterBtn =
    document.getElementById("googleRegisterBtn");

const authMessage =
    document.getElementById("authMessage");

const authLoading =
    document.getElementById("authLoading");


/* =========================================================
   STATE
========================================================= */

let selectedProfilePhoto = null;


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message, type = "error") {

    if (!authMessage) return;

    authMessage.textContent = message;

    authMessage.classList.remove("error", "success", "show");

    if (type === "success") {
        authMessage.classList.add("success");
    } else {
        authMessage.classList.add("error");
    }

    authMessage.classList.add("show");
}


function hideMessage() {

    if (!authMessage) return;

    authMessage.classList.remove(
        "show",
        "error",
        "success"
    );
}


/* =========================================================
   LOADING
========================================================= */

function setLoading(loading) {

    if (authLoading) {
        authLoading.classList.toggle(
            "active",
            loading
        );
    }

    if (registerBtn) {
        registerBtn.disabled = loading;
    }

    if (googleRegisterBtn) {
        googleRegisterBtn.disabled = loading;
    }
}


/* =========================================================
   FIREBASE ERROR
========================================================= */

function getFirebaseErrorMessage(error) {

    const code = error?.code || "";

    switch (code) {

        case "auth/email-already-in-use":
            return "البريد الإلكتروني مستخدم بالفعل.";

        case "auth/invalid-email":
            return "البريد الإلكتروني غير صحيح.";

        case "auth/weak-password":
            return "كلمة المرور ضعيفة. استخدم 6 أحرف أو أكثر.";

        case "auth/network-request-failed":
            return "حدثت مشكلة في الاتصال بالإنترنت.";

        case "auth/popup-closed-by-user":
            return "تم إغلاق نافذة تسجيل الدخول.";

        case "auth/popup-blocked":
            return "المتصفح منع نافذة تسجيل الدخول.";

        case "auth/cancelled-popup-request":
            return "تم إلغاء عملية تسجيل الدخول.";

        default:
            return error?.message ||
                "حدث خطأ غير متوقع. حاول مرة أخرى.";
    }
}


/* =========================================================
   PROFILE PHOTO PREVIEW
========================================================= */

function resetProfilePhoto() {

    selectedProfilePhoto = null;

    if (profilePhoto) {
        profilePhoto.value = "";
    }

    if (profilePhotoImage) {
        profilePhotoImage.src = "";
        profilePhotoImage.classList.remove("show");
    }

    if (profilePhotoPlaceholder) {
        profilePhotoPlaceholder.classList.remove("hidden");
    }
}


function showProfilePhotoPreview(file) {

    if (!file) {
        resetProfilePhoto();
        return;
    }

    if (!file.type.startsWith("image/")) {
        showMessage("الملف المختار ليس صورة.");
        resetProfilePhoto();
        return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
        showMessage("حجم صورة البروفايل يجب ألا يتجاوز 5MB.");
        resetProfilePhoto();
        return;
    }

    selectedProfilePhoto = file;

    const reader = new FileReader();

    reader.onload = function (event) {

        if (profilePhotoImage) {
            profilePhotoImage.src = event.target.result;
            profilePhotoImage.classList.add("show");
        }

        if (profilePhotoPlaceholder) {
            profilePhotoPlaceholder.classList.add("hidden");
        }
    };

    reader.readAsDataURL(file);
}


/* =========================================================
   PROFILE PHOTO EVENTS
========================================================= */

if (profilePhoto) {

    profilePhoto.addEventListener("change", function () {

        const file = this.files?.[0];

        if (!file) {
            resetProfilePhoto();
            return;
        }

        showProfilePhotoPreview(file);
    });
}


if (removeProfilePhoto) {

    removeProfilePhoto.addEventListener(
        "click",
        function () {
            resetProfilePhoto();
        }
    );
}


/* =========================================================
   PHONE INPUT
========================================================= */

if (studentId) {

    studentId.addEventListener("input", function () {

        this.value = this.value
            .replace(/\D/g, "")
            .slice(0, 11);
    });
}


/* =========================================================
   GENDER
========================================================= */

/*
   مهم:
   الـ CSS بتاع register.css بيستخدم:

   .gender-option.male.selected
   .gender-option.female.selected

   لذلك هنا بنستخدم selected
   وليس active.
*/

genderOptions.forEach(option => {

    option.addEventListener("click", function () {

        /* إزالة التحديد من الكل */
        genderOptions.forEach(item => {
            item.classList.remove("selected");
        });

        /* تحديد الزرار الحالي */
        this.classList.add("selected");

        /* حفظ القيمة */
        if (gender) {
            gender.value = this.dataset.gender || "";
        }

        /* إزالة رسالة الخطأ لو موجودة */
        hideMessage();
    });

});


/* =========================================================
   VALIDATION
========================================================= */

function validateForm() {

    const nameValue =
        studentName?.value.trim() || "";

    const phoneValue =
        studentId?.value.trim() || "";

    const emailValue =
        email?.value.trim() || "";

    const passwordValue =
        password?.value || "";

    const confirmPasswordValue =
        confirmPassword?.value || "";

    const genderValue =
        gender?.value || "";


    /* الاسم */

    if (nameValue.length < 3) {
        showMessage(
            "اكتب اسمك بالكامل بشكل صحيح."
        );

        studentName?.focus();

        return false;
    }


    /* رقم الهاتف */

    if (!/^01\d{9}$/.test(phoneValue)) {

        showMessage(
            "اكتب رقم هاتف مصري صحيح مكون من 11 رقم."
        );

        studentId?.focus();

        return false;
    }


    /* النوع */

    if (!genderValue) {

        showMessage(
            "من فضلك اختر النوع."
        );

        return false;
    }


    /* البريد */

    if (!emailValue) {

        showMessage(
            "من فضلك اكتب البريد الإلكتروني."
        );

        email?.focus();

        return false;
    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(emailValue)) {

        showMessage(
            "اكتب بريد إلكتروني صحيح."
        );

        email?.focus();

        return false;
    }


    /* كلمة المرور */

    if (passwordValue.length < 6) {

        showMessage(
            "كلمة المرور يجب أن تكون 6 أحرف أو أكثر."
        );

        password?.focus();

        return false;
    }


    /* تأكيد كلمة المرور */

    if (passwordValue !== confirmPasswordValue) {

        showMessage(
            "كلمتا المرور غير متطابقتين."
        );

        confirmPassword?.focus();

        return false;
    }


    /* الشروط */

    if (!terms?.checked) {

        showMessage(
            "يجب الموافقة على الشروط والأحكام."
        );

        return false;
    }


    return true;
}


/* =========================================================
   SAVE USER DATA
========================================================= */

async function saveUserData(user, extraData = {}) {

    const userData = {

        uid: user.uid,

        name:
            extraData.name ||
            user.displayName ||
            "",

        studentName:
            extraData.studentName ||
            extraData.name ||
            user.displayName ||
            "",

        studentId:
            extraData.studentId ||
            "",

        phone:
            extraData.phone ||
            extraData.studentId ||
            "",

        gender:
            extraData.gender ||
            "",

        email:
            user.email ||
            extraData.email ||
            "",

        photoURL:
            extraData.photoURL ||
            user.photoURL ||
            "",

        photoPublicId:
            extraData.photoPublicId ||
            "",

        role:
            extraData.role ||
            "user",

        provider:
            extraData.provider ||
            "email",

        createdAt:
            extraData.createdAt ||
            new Date(),

        updatedAt:
            new Date()
    };


    await setDocument(
        "users",
        user.uid,
        userData
    );


    return userData;
}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function saveLocalUser(user, userData = {}) {

    try {

        localStorage.setItem(
            "user",
            JSON.stringify({
                ...userData,
                uid: user.uid,
                email: user.email || userData.email || "",
                displayName:
                    user.displayName ||
                    userData.name ||
                    "",
                photoURL:
                    user.photoURL ||
                    userData.photoURL ||
                    ""
            })
        );

        localStorage.setItem(
            "loggedIn",
            "true"
        );

        localStorage.setItem(
            "firebaseUID",
            user.uid
        );

        localStorage.setItem(
            "userUid",
            user.uid
        );

    } catch (error) {

        console.warn(
            "تعذر حفظ بيانات المستخدم محليًا:",
            error
        );
    }
}


/* =========================================================
   EMAIL REGISTER
========================================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            hideMessage();


            /* Validation */

            if (!validateForm()) {
                return;
            }


            setLoading(true);


            try {

                const nameValue =
                    studentName.value.trim();

                const phoneValue =
                    studentId.value.trim();

                const emailValue =
                    email.value.trim();

                const passwordValue =
                    password.value;

                const genderValue =
                    gender.value;


                /* إنشاء حساب Firebase */

                const result =
                    await registerWithEmail(
                        emailValue,
                        passwordValue
                    );


                const user = result.user;


                /* =========================================
                   رفع صورة البروفايل إلى Cloudinary
                ========================================= */

                let photoURL = "";
                let photoPublicId = "";


                if (selectedProfilePhoto) {

                    if (
                        typeof window.uploadProfileImage !==
                        "function"
                    ) {

                        throw new Error(
                            "خدمة رفع الصور غير متاحة. تأكد من تحميل cloudinary.js."
                        );
                    }


                    const uploadResult =
                        await window.uploadProfileImage(
                            selectedProfilePhoto,
                            function (percent) {

                                if (authLoading) {
                                    authLoading.textContent =
                                        `جاري رفع الصورة... ${percent}%`;
                                }
                            }
                        );


                    photoURL =
                        uploadResult.secure_url || "";

                    photoPublicId =
                        uploadResult.public_id || "";
                }


                /* =========================================
                   تحديث بيانات Firebase Auth
                ========================================= */

                try {

                    if (
                        user &&
                        typeof user.updateProfile ===
                        "function"
                    ) {

                        await user.updateProfile({
                            displayName: nameValue,
                            photoURL: photoURL || null
                        });
                    }

                } catch (profileError) {

                    console.warn(
                        "تعذر تحديث صورة/اسم الحساب:",
                        profileError
                    );
                }


                /* =========================================
                   حفظ البيانات في Firestore
                ========================================= */

                const userData =
                    await saveUserData(
                        user,
                        {
                            name: nameValue,
                            studentName: nameValue,
                            studentId: phoneValue,
                            phone: phoneValue,
                            gender: genderValue,
                            email: emailValue,
                            photoURL: photoURL,
                            photoPublicId: photoPublicId,
                            role: "user",
                            provider: "email"
                        }
                    );


                /* Local Storage */

                saveLocalUser(
                    user,
                    userData
                );


                /* Success */

                showMessage(
                    "تم إنشاء حسابك بنجاح 🎉",
                    "success"
                );


                /* Redirect */

                setTimeout(() => {

                    window.location.href =
                        "index.html";

                }, 1200);


            } catch (error) {

                console.error(
                    "Register Error:",
                    error
                );


                showMessage(
                    getFirebaseErrorMessage(error)
                );


                setLoading(false);
            }

        }
    );
}


/* =========================================================
   GOOGLE REGISTER / LOGIN
========================================================= */

if (googleRegisterBtn) {

    googleRegisterBtn.addEventListener(
        "click",
        async function () {

            hideMessage();

            setLoading(true);


            try {

                const result =
                    await loginWithGoogle();

                const user =
                    result.user;


                /* =========================================
                   محاولة جلب البيانات القديمة
                ========================================= */

                let existingData = {};

                try {

                    const oldData =
                        await getDocument(
                            "users",
                            user.uid
                        );

                    if (oldData) {
                        existingData = oldData;
                    }

                } catch (error) {

                    console.warn(
                        "تعذر قراءة بيانات المستخدم القديمة:",
                        error
                    );
                }


                /* =========================================
                   بيانات Google
                ========================================= */

                const userData =
                    await saveUserData(
                        user,
                        {

                            name:
                                existingData.name ||
                                user.displayName ||
                                "",

                            studentName:
                                existingData.studentName ||
                                existingData.name ||
                                user.displayName ||
                                "",

                            studentId:
                                existingData.studentId ||
                                "",

                            phone:
                                existingData.phone ||
                                "",

                            gender:
                                existingData.gender ||
                                "",

                            email:
                                user.email ||
                                existingData.email ||
                                "",

                            photoURL:
                                user.photoURL ||
                                existingData.photoURL ||
                                "",

                            photoPublicId:
                                existingData.photoPublicId ||
                                "",

                            role:
                                existingData.role ||
                                "user",

                            provider:
                                existingData.provider ||
                                "google",

                            createdAt:
                                existingData.createdAt ||
                                new Date()
                        }
                    );


                /* Local Storage */

                saveLocalUser(
                    user,
                    userData
                );


                /* Success */

                showMessage(
                    "تم تسجيل الدخول بنجاح 🎉",
                    "success"
                );


                setTimeout(() => {

                    window.location.href =
                        "index.html";

                }, 1000);


            } catch (error) {

                console.error(
                    "Google Register Error:",
                    error
                );


                showMessage(
                    getFirebaseErrorMessage(error)
                );


                setLoading(false);
            }

        }
    );
}


/* =========================================================
   AUTH STATE
========================================================= */

watchAuth(async (user) => {

    if (!user) {
        return;
    }

    /*
       لا نعمل Redirect هنا مباشرة،
       لأن Firebase ممكن يشغل listener
       أثناء عملية إنشاء الحساب.
    */

});


/* =========================================================
   INITIAL STATE
========================================================= */

setLoading(false);
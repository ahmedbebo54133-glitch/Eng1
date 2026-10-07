/* =========================================================
   ENG FORGE ⚙️
   PROFILE.JS
   عرض وتعديل بيانات الطالب + النتائج
   ========================================================= */

import {
    watchAuth,
    logoutUser,
    getDocument,
    updateDocument,
    db,
    collection,
    getDocs
} from "./firebase.js";


/* =========================================================
   DOM
========================================================= */

const profileAvatar =
    document.getElementById("profileAvatar");

const profileAvatarPlaceholder =
    document.getElementById("profileAvatarPlaceholder");

const profileName =
    document.getElementById("profileName");

const profileEmail =
    document.getElementById("profileEmail");

const studentName =
    document.getElementById("studentName");

const studentId =
    document.getElementById("studentId");

const studentEmail =
    document.getElementById("studentEmail");

const studentGender =
    document.getElementById("studentGender");

const accountType =
    document.getElementById("accountType");


/* =========================================================
   RESULTS DOM
========================================================= */

const resultsBox =
    document.getElementById("resultsBox");


/* =========================================================
   EDIT
========================================================= */

const editProfileBtn =
    document.getElementById("editProfileBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const editArea =
    document.getElementById("editArea");

const editName =
    document.getElementById("editName");

const editStudentId =
    document.getElementById("editStudentId");

const editGender =
    document.getElementById("editGender");

const editEmail =
    document.getElementById("editEmail");

const editProfilePhoto =
    document.getElementById("editProfilePhoto");

const editPhotoPreview =
    document.getElementById("editPhotoPreview");

const saveProfileBtn =
    document.getElementById("saveProfileBtn");

const cancelEditBtn =
    document.getElementById("cancelEditBtn");

const profileActions =
    document.getElementById("profileActions");

const profileMessage =
    document.getElementById("profileMessage");

const genderButtons =
    document.querySelectorAll(
        ".edit-gender-option"
    );


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let currentUserData = null;

let selectedPhoto = null;


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message,
    type = "error"
) {

    if (!profileMessage) return;

    profileMessage.textContent =
        message;

    profileMessage.classList.remove(
        "show",
        "error",
        "success"
    );

    profileMessage.classList.add(
        "show",
        type
    );
}


function hideMessage() {

    if (!profileMessage) return;

    profileMessage.classList.remove(
        "show",
        "error",
        "success"
    );
}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getErrorMessage(error) {

    console.error(
        "Profile Error:",
        error
    );

    const code =
        error?.code || "";

    switch (code) {

        case "permission-denied":

        case "firestore/permission-denied":

            return "ليس لديك صلاحية للوصول إلى بيانات الحساب.";


        case "auth/network-request-failed":

            return "تأكد من اتصال الإنترنت.";


        case "unavailable":

            return "الخدمة غير متاحة حاليًا. تأكد من الإنترنت.";


        default:

            return error?.message ||
                "حدث خطأ غير متوقع.";
    }
}


/* =========================================================
   FIRESTORE SNAPSHOT → DATA
========================================================= */

function normalizeUserData(result) {

    if (!result) {
        return null;
    }


    /* DocumentSnapshot */

    if (
        typeof result.exists === "function" &&
        typeof result.data === "function"
    ) {

        if (!result.exists()) {
            return null;
        }

        return {
            id: result.id,
            ...result.data()
        };
    }


    /* لو كانت البيانات Object بالفعل */

    if (
        typeof result === "object"
    ) {

        return {
            ...result
        };
    }


    return null;
}


/* =========================================================
   GENDER TEXT
========================================================= */

function getGenderText(value) {

    if (
        value === "male" ||
        value === "ذكر"
    ) {

        return "ذكر 👨";
    }


    if (
        value === "female" ||
        value === "أنثى"
    ) {

        return "أنثى 👩";
    }


    return "غير محدد";
}


/* =========================================================
   AVATAR
========================================================= */

function setAvatar(photoURL) {

    if (
        photoURL &&
        typeof photoURL === "string"
    ) {

        profileAvatar.src =
            photoURL;

        profileAvatar.style.display =
            "block";

        profileAvatarPlaceholder.style.display =
            "none";


        profileAvatar.onerror =
            function () {

                profileAvatar.style.display =
                    "none";

                profileAvatarPlaceholder.style.display =
                    "flex";
            };


    } else {

        profileAvatar.src = "";

        profileAvatar.style.display =
            "none";

        profileAvatarPlaceholder.style.display =
            "flex";
    }
}


/* =========================================================
   EDIT PHOTO PREVIEW
========================================================= */

function setEditPhotoPreview(
    url = ""
) {

    if (!editPhotoPreview) return;


    if (url) {

        editPhotoPreview.innerHTML = `
            <img
                src="${url}"
                alt="صورة البروفايل"
                style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    border-radius:50%;
                    display:block;
                "
            >
        `;

    } else {

        editPhotoPreview.innerHTML =
            "👤";
    }
}


/* =========================================================
   GET CURRENT VALUES
========================================================= */

function getCurrentName() {

    return (
        currentUserData?.name ||
        currentUserData?.studentName ||
        currentUser?.displayName ||
        ""
    );
}


function getCurrentPhone() {

    return (
        currentUserData?.phone ||
        currentUserData?.studentId ||
        ""
    );
}


function getCurrentEmail() {

    return (
        currentUserData?.email ||
        currentUser?.email ||
        ""
    );
}


function getCurrentGender() {

    return (
        currentUserData?.gender ||
        ""
    );
}


function getCurrentPhoto() {

    return (
        currentUserData?.photoURL ||
        currentUser?.photoURL ||
        ""
    );
}


/* =========================================================
   UPDATE GENDER BUTTONS
========================================================= */

function updateGenderButtons(
    value
) {

    genderButtons.forEach(
        button => {

            button.classList.toggle(
                "selected",
                button.dataset.gender === value
            );

        }
    );
}


/* =========================================================
   RESULTS HELPERS
========================================================= */

/*
   تحويل وقت Firestore إلى milliseconds
*/

function getTimestampMillis(value) {

    if (!value) {
        return 0;
    }


    /* Firestore Timestamp */

    if (
        typeof value.toMillis === "function"
    ) {

        return value.toMillis();
    }


    /* Firestore Timestamp قديم */

    if (
        typeof value.toDate === "function"
    ) {

        return value.toDate().getTime();
    }


    /* JavaScript Date */

    if (
        value instanceof Date
    ) {

        return value.getTime();
    }


    /* رقم */

    if (
        typeof value === "number"
    ) {

        return value;
    }


    /* String */

    if (
        typeof value === "string"
    ) {

        const time =
            new Date(value).getTime();

        return Number.isNaN(time)
            ? 0
            : time;
    }


    return 0;
}


/* =========================================================
   FORMAT RESULT DATE
========================================================= */

function formatResultDate(value) {

    const time =
        getTimestampMillis(value);


    if (!time) {

        return "غير محدد";
    }


    try {

        return new Intl.DateTimeFormat(
            "ar-EG",
            {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit"
            }
        ).format(
            new Date(time)
        );

    } catch (error) {

        return "غير محدد";
    }
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   RESULT STATUS
========================================================= */

function getResultStatus(result) {

    const status =
        String(
            result?.gradingStatus || ""
        ).toLowerCase();


    /* نتيجة مصححة تلقائيًا */

    if (
        status === "auto" ||
        status === "automatic"
    ) {

        return {
            text: "تم التصحيح تلقائيًا",
            className: "status-auto",
            final: true
        };
    }


    /* نتيجة معتمدة */

    if (
        status === "completed" ||
        status === "approved" ||
        status === "graded" ||
        status === "final"
    ) {

        return {
            text: "تم اعتماد النتيجة",
            className: "status-completed",
            final: true
        };
    }


    /* النتيجة ما زالت تحت المراجعة */

    return {
        text: "قيد المراجعة",
        className: "status-pending",
        final: false
    };
}


/* =========================================================
   GET ANSWERED COUNT
========================================================= */

function getAnsweredCount(result) {

    if (
        !Array.isArray(result?.answers)
    ) {

        return 0;
    }


    return result.answers.filter(
        answer => {

            if (!answer) {
                return false;
            }


            const value =
                answer.answer;


            if (
                value === null ||
                value === undefined
            ) {

                return false;
            }


            if (
                typeof value === "string"
            ) {

                return value.trim() !== "";
            }


            if (
                Array.isArray(value)
            ) {

                return value.length > 0;
            }


            return true;
        }
    ).length;
}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(value) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return "0";
    }


    if (
        Number.isInteger(number)
    ) {

        return String(number);
    }


    return number.toFixed(1);
}


/* =========================================================
   GET PERCENTAGE
========================================================= */

function getResultPercentage(result) {

    const savedPercentage =
        Number(result?.percentage);


    if (
        Number.isFinite(savedPercentage)
    ) {

        return savedPercentage;
    }


    const score =
        Number(result?.score);


    const totalMarks =
        Number(result?.totalMarks);


    if (
        Number.isFinite(score) &&
        Number.isFinite(totalMarks) &&
        totalMarks > 0
    ) {

        return (
            score /
            totalMarks
        ) * 100;
    }


    return 0;
}


/* =========================================================
   RENDER RESULTS
========================================================= */

function renderResults(results) {

    if (!resultsBox) {
        return;
    }


    /* لا توجد نتائج */

    if (
        !Array.isArray(results) ||
        results.length === 0
    ) {

        resultsBox.className =
            "results-placeholder";


        resultsBox.innerHTML = `

            <div class="placeholder-icon">
                📝
            </div>

            <h3>
                لا توجد نتائج حتى الآن
            </h3>

            <p>
                ستظهر نتائج الامتحانات هنا بعد اعتمادها من الإدارة.
            </p>

        `;

        return;
    }


    /* ترتيب النتائج من الأحدث للأقدم */

    const sortedResults =
        [...results].sort(
            (a, b) => {

                return (
                    getTimestampMillis(
                        b.submittedAt
                    ) -
                    getTimestampMillis(
                        a.submittedAt
                    )
                );
            }
        );


    resultsBox.className =
        "results-list";


    resultsBox.innerHTML =
        sortedResults.map(
            result => {

                const status =
                    getResultStatus(
                        result
                    );


                const examName =
                    escapeHTML(
                        result.examName ||
                        result.examTitle ||
                        "امتحان"
                    );


                const subjectName =
                    escapeHTML(
                        result.subjectName ||
                        "مادة غير محددة"
                    );


                const answeredCount =
                    getAnsweredCount(
                        result
                    );


                const totalQuestions =
                    Array.isArray(
                        result.answers
                    )
                        ? result.answers.length
                        : 0;


                const date =
                    formatResultDate(
                        result.submittedAt
                    );


                const percentage =
                    getResultPercentage(
                        result
                    );


                const score =
                    formatNumber(
                        result.score
                    );


                const totalMarks =
                    formatNumber(
                        result.totalMarks
                    );


                /* =========================================
                   النتيجة النهائية
                ========================================= */

                let scoreHTML = "";


                if (status.final) {

                    scoreHTML = `

                        <div class="result-stat">

                            <span>
                                🏆
                            </span>

                            <div>

                                <small>
                                    الدرجة
                                </small>

                                <strong>
                                    ${score}
                                    /
                                    ${totalMarks}
                                </strong>

                            </div>

                        </div>


                        <div class="result-stat">

                            <span>
                                📈
                            </span>

                            <div>

                                <small>
                                    النسبة
                                </small>

                                <strong>
                                    ${formatNumber(percentage)}%
                                </strong>

                            </div>

                        </div>

                    `;

                } else {

                    scoreHTML = `

                        <div class="result-pending-box">

                            <span>
                                ⏳
                            </span>

                            <div>

                                <strong>
                                    النتيجة قيد المراجعة
                                </strong>

                                <small>
                                    سيتم عرض الدرجة النهائية بعد اعتمادها من الإدارة.
                                </small>

                            </div>

                        </div>

                    `;
                }


                return `

                    <article class="result-card">

                        <!-- =========================
                             TOP
                        ========================== -->

                        <div class="result-card-header">

                            <div class="result-exam-info">

                                <div class="result-exam-icon">
                                    📝
                                </div>

                                <div>

                                    <h3>
                                        ${examName}
                                    </h3>

                                    <p>
                                        📚 ${subjectName}
                                    </p>

                                </div>

                            </div>


                            <span
                                class="result-status ${status.className}"
                            >
                                ${status.text}
                            </span>

                        </div>


                        <!-- =========================
                             STATS
                        ========================== -->

                        <div class="result-stats">

                            ${scoreHTML}


                            <div class="result-stat">

                                <span>
                                    ✏️
                                </span>

                                <div>

                                    <small>
                                        الإجابات
                                    </small>

                                    <strong>
                                        ${answeredCount}
                                        ${totalQuestions > 0
                                            ? ` / ${totalQuestions}`
                                            : ""}
                                    </strong>

                                </div>

                            </div>

                        </div>


                        <!-- =========================
                             FOOTER
                        ========================== -->

                        <div class="result-card-footer">

                            <span>
                                🕐 تم التسليم:
                                ${date}
                            </span>

                        </div>

                    </article>

                `;

            }
        ).join("");
}


/* =========================================================
   LOAD RESULTS
========================================================= */

async function loadResults(user) {

    if (!resultsBox) {
        return;
    }


    /* حالة التحميل */

    resultsBox.className =
        "results-placeholder";


    resultsBox.innerHTML = `

        <div class="placeholder-icon">
            ⏳
        </div>

        <h3>
            جاري تحميل النتائج...
        </h3>

        <p>
            يتم الآن البحث عن نتائج الامتحانات الخاصة بك.
        </p>

    `;


    try {

        /*
           نقرأ مجموعة results كاملة ثم
           نعرض فقط النتائج الخاصة بالطالب الحالي.

           استخدمنا هذه الطريقة حتى لا نحتاج
           إلى تعديل firebase.js لإضافة where/query.
        */

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "results"
                )
            );


        const results = [];


        snapshot.forEach(
            resultDoc => {

                const data =
                    resultDoc.data();


                if (
                    data &&
                    data.studentId === user.uid
                ) {

                    results.push({

                        id:
                            resultDoc.id,

                        ...data

                    });
                }

            }
        );


        console.log(
            "ENG Forge Student Results:",
            results
        );


        renderResults(
            results
        );


    } catch (error) {

        console.error(
            "Load Results Error:",
            error
        );


        resultsBox.className =
            "results-placeholder";


        resultsBox.innerHTML = `

            <div class="placeholder-icon">
                ⚠️
            </div>

            <h3>
                تعذر تحميل النتائج
            </h3>

            <p>
                ${escapeHTML(
                    getErrorMessage(error)
                )}
            </p>

        `;
    }
}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile(user) {

    try {

        currentUser =
            user;


        /* =========================================
           جلب users/{uid}
        ========================================= */

        const result =
            await getDocument(
                "users",
                user.uid
            );


        const data =
            normalizeUserData(result);


        if (!data) {

            showMessage(
                "لم يتم العثور على بيانات الحساب."
            );

            return;
        }


        currentUserData =
            data;


        console.log(
            "ENG Forge Profile Data:",
            data
        );


        /* =========================================
           قراءة البيانات
        ========================================= */

        const name =
            getCurrentName() ||
            "المستخدم";


        const phone =
            getCurrentPhone();


        const email =
            getCurrentEmail();


        const gender =
            getCurrentGender();


        const photoURL =
            getCurrentPhoto();


        /* =========================================
           PROFILE HEADER
        ========================================= */

        profileName.textContent =
            name;


        profileEmail.textContent =
            email ||
            "—";


        /* =========================================
           INFORMATION
        ========================================= */

        studentName.textContent =
            name ||
            "—";


        studentId.textContent =
            phone ||
            "—";


        studentEmail.textContent =
            email ||
            "—";


        studentGender.textContent =
            getGenderText(gender);


        accountType.textContent =
            data.role === "admin"
                ? "مدير"
                : "طالب";


        /* =========================================
           PHOTO
        ========================================= */

        setAvatar(
            photoURL
        );


        /* =========================================
           EDIT FORM
        ========================================= */

        editName.value =
            name;


        editStudentId.value =
            phone;


        editGender.value =
            gender;


        editEmail.value =
            email;


        setEditPhotoPreview(
            photoURL
        );


        updateGenderButtons(
            gender
        );


    } catch (error) {

        showMessage(
            getErrorMessage(error)
        );
    }
}


/* =========================================================
   GENDER BUTTONS EVENTS
========================================================= */

genderButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function () {

                const value =
                    this.dataset.gender || "";


                editGender.value =
                    value;


                updateGenderButtons(
                    value
                );


                hideMessage();
            }
        );

    }
);


/* =========================================================
   PHONE INPUT
========================================================= */

if (editStudentId) {

    editStudentId.addEventListener(
        "input",
        function () {

            this.value =
                this.value
                    .replace(/\D/g, "")
                    .slice(0, 11);

        }
    );
}


/* =========================================================
   PHOTO SELECT
========================================================= */

if (editProfilePhoto) {

    editProfilePhoto.addEventListener(
        "change",
        function () {

            const file =
                this.files?.[0];


            if (!file) {
                return;
            }


            /* نوع الملف */

            if (
                !file.type ||
                !file.type.startsWith("image/")
            ) {

                showMessage(
                    "الملف المختار ليس صورة."
                );

                this.value = "";

                return;
            }


            /* الحجم */

            if (
                file.size >
                5 * 1024 * 1024
            ) {

                showMessage(
                    "حجم الصورة يجب ألا يتجاوز 5MB."
                );

                this.value = "";

                return;
            }


            selectedPhoto =
                file;


            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    setEditPhotoPreview(
                        event.target.result
                    );
                };


            reader.readAsDataURL(
                file
            );


            hideMessage();
        }
    );
}


/* =========================================================
   OPEN EDIT
========================================================= */

if (editProfileBtn) {

    editProfileBtn.addEventListener(
        "click",
        function () {

            hideMessage();


            /* التأكد من تحميل البيانات */

            if (!currentUserData) {

                showMessage(
                    "بيانات الحساب لم يتم تحميلها بعد."
                );

                return;
            }


            /* فتح منطقة التعديل */

            editArea.hidden =
                false;


            profileActions.style.display =
                "none";


            /* إعادة تحميل القيم الحالية */

            editName.value =
                getCurrentName();


            editStudentId.value =
                getCurrentPhone();


            editGender.value =
                getCurrentGender();


            editEmail.value =
                getCurrentEmail();


            setEditPhotoPreview(
                getCurrentPhoto()
            );


            updateGenderButtons(
                getCurrentGender()
            );


            editName.focus();


            window.scrollTo({

                top:
                    editArea.offsetTop - 100,

                behavior:
                    "smooth"

            });
        }
    );
}


/* =========================================================
   CANCEL EDIT
========================================================= */

if (cancelEditBtn) {

    cancelEditBtn.addEventListener(
        "click",
        function () {

            hideMessage();


            editArea.hidden =
                true;


            profileActions.style.display =
                "flex";


            selectedPhoto =
                null;


            if (editProfilePhoto) {

                editProfilePhoto.value =
                    "";
            }


            /* إعادة البيانات الأصلية */

            editName.value =
                getCurrentName();


            editStudentId.value =
                getCurrentPhone();


            editGender.value =
                getCurrentGender();


            editEmail.value =
                getCurrentEmail();


            setEditPhotoPreview(
                getCurrentPhoto()
            );


            updateGenderButtons(
                getCurrentGender()
            );

        }
    );
}


/* =========================================================
   SAVE PROFILE
========================================================= */

if (saveProfileBtn) {

    saveProfileBtn.addEventListener(
        "click",
        async function () {

            hideMessage();


            if (!currentUser) {

                showMessage(
                    "يجب تسجيل الدخول أولًا."
                );

                return;
            }


            if (!currentUserData) {

                showMessage(
                    "لم يتم تحميل بيانات الحساب."
                );

                return;
            }


            /* =========================================
               VALUES
            ========================================= */

            const name =
                editName.value.trim();


            const phone =
                editStudentId.value
                    .replace(/\D/g, "")
                    .trim();


            const gender =
                editGender.value;


            /* =========================================
               VALIDATION
            ========================================= */

            if (name.length < 3) {

                showMessage(
                    "اكتب اسم الطالب بشكل صحيح."
                );

                editName.focus();

                return;
            }


            if (
                !/^01\d{9}$/.test(phone)
            ) {

                showMessage(
                    "رقم الهاتف يجب أن يكون رقمًا مصريًا صحيحًا من 11 رقم."
                );

                editStudentId.focus();

                return;
            }


            if (!gender) {

                showMessage(
                    "من فضلك اختر النوع."
                );

                return;
            }


            /* =========================================
               LOADING
            ========================================= */

            saveProfileBtn.disabled =
                true;

            saveProfileBtn.textContent =
                "⏳ جاري الحفظ...";


            try {

                /* =====================================
                   الصورة الحالية
                ===================================== */

                let photoURL =
                    currentUserData.photoURL ||
                    currentUser?.photoURL ||
                    "";


                let photoPublicId =
                    currentUserData.photoPublicId ||
                    "";


                /* =====================================
                   رفع صورة جديدة
                ===================================== */

                if (selectedPhoto) {

                    if (
                        typeof window.uploadProfileImage !==
                        "function"
                    ) {

                        throw new Error(
                            "خدمة Cloudinary غير متاحة. تأكد من تحميل cloudinary.js."
                        );
                    }


                    const uploadResult =
                        await window.uploadProfileImage(
                            selectedPhoto
                        );


                    if (
                        uploadResult &&
                        uploadResult.secure_url
                    ) {

                        photoURL =
                            uploadResult.secure_url;
                    }


                    if (
                        uploadResult &&
                        uploadResult.public_id
                    ) {

                        photoPublicId =
                            uploadResult.public_id;
                    }
                }


                /* =====================================
                   البيانات التي سيتم تعديلها

                   نحافظ على كل الحقول القديمة
                   ونغير فقط البيانات المطلوبة.
                ===================================== */

                const updatedData = {

                    ...currentUserData,

                    uid:
                        currentUser.uid,

                    name:
                        name,

                    studentName:
                        name,

                    studentId:
                        phone,

                    phone:
                        phone,

                    gender:
                        gender,

                    email:
                        currentUser.email ||
                        currentUserData.email ||
                        "",

                    photoURL:
                        photoURL,

                    photoPublicId:
                        photoPublicId,

                    role:
                        currentUserData.role ||
                        "user",

                    provider:
                        currentUserData.provider ||
                        "email",

                    updatedAt:
                        new Date()
                };


                /* إزالة id لو كان موجودًا */

                delete updatedData.id;


                /* =====================================
                   حفظ Firestore
                ===================================== */

                await updateDocument(
                    "users",
                    currentUser.uid,
                    updatedData
                );


                /* =====================================
                   تحديث الذاكرة الحالية
                ===================================== */

                currentUserData =
                    {
                        ...currentUserData,
                        ...updatedData
                    };


                selectedPhoto =
                    null;


                if (editProfilePhoto) {

                    editProfilePhoto.value =
                        "";
                }


                /* =====================================
                   تحديث الصفحة مباشرة
                ===================================== */

                profileName.textContent =
                    name;


                profileEmail.textContent =
                    currentUser.email ||
                    updatedData.email ||
                    "—";


                studentName.textContent =
                    name;


                studentId.textContent =
                    phone;


                studentEmail.textContent =
                    currentUser.email ||
                    updatedData.email ||
                    "—";


                studentGender.textContent =
                    getGenderText(gender);


                setAvatar(
                    photoURL
                );


                setEditPhotoPreview(
                    photoURL
                );


                updateGenderButtons(
                    gender
                );


                /* =====================================
                   Local Storage
                ===================================== */

                try {

                    const oldLocalUser =
                        JSON.parse(
                            localStorage.getItem(
                                "user"
                            ) || "{}"
                        );


                    const newLocalUser = {

                        ...oldLocalUser,

                        uid:
                            currentUser.uid,

                        name:
                            name,

                        studentName:
                            name,

                        studentId:
                            phone,

                        phone:
                            phone,

                        gender:
                            gender,

                        email:
                            currentUser.email ||
                            updatedData.email ||
                            "",

                        photoURL:
                            photoURL
                    };


                    localStorage.setItem(
                        "user",
                        JSON.stringify(
                            newLocalUser
                        )
                    );


                    localStorage.setItem(
                        "loggedIn",
                        "true"
                    );


                    localStorage.setItem(
                        "firebaseUID",
                        currentUser.uid
                    );


                    localStorage.setItem(
                        "userUid",
                        currentUser.uid
                    );

                } catch (storageError) {

                    console.warn(
                        "LocalStorage Error:",
                        storageError
                    );
                }


                /* =====================================
                   إغلاق التعديل
                ===================================== */

                editArea.hidden =
                    true;


                profileActions.style.display =
                    "flex";


                showMessage(
                    "تم حفظ بيانات الحساب بنجاح ✅",
                    "success"
                );


            } catch (error) {

                showMessage(
                    getErrorMessage(error)
                );

            } finally {

                saveProfileBtn.disabled =
                    false;

                saveProfileBtn.textContent =
                    "💾 حفظ التعديلات";
            }

        }
    );
}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function () {

            try {

                await logoutUser();


                localStorage.removeItem(
                    "user"
                );


                localStorage.removeItem(
                    "loggedIn"
                );


                localStorage.removeItem(
                    "firebaseUID"
                );


                localStorage.removeItem(
                    "userUid"
                );


                window.location.href =
                    "index.html";


            } catch (error) {

                console.error(
                    "Logout Error:",
                    error
                );


                showMessage(
                    "تعذر تسجيل الخروج. حاول مرة أخرى."
                );
            }

        }
    );
}


/* =========================================================
   AUTH STATE
========================================================= */

watchAuth(
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        await loadProfile(
            user
        );


        /* =========================================
           تحميل نتائج الطالب
        ========================================= */

        await loadResults(
            user
        );

    }
);


/* =========================================================
   END OF FILE
========================================================= */
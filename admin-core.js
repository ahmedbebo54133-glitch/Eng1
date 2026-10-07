/* =========================================================
   ENG FORGE
   ADMIN CORE
   =========================================================

   مسؤول عن:
   - التحقق من تسجيل الدخول
   - التحقق من صلاحية Admin
   - بيانات الأدمن
   - التنقل بين الأقسام
   - تسجيل الخروج
   - نظام الإشعارات
   - نظام الـ Modal
   - إحصائيات لوحة التحكم
   - البحث عن الطلاب

   لا يحتوي على:
   - نظام النتائج
   - نظام المحاضرات
   - نظام الامتحانات
   - إنشاء الأسئلة
   - بناء المحتوى التعليمي

   هذه الوظائف موجودة في:
   admin-results.js
   admin-content.js
   admin-exams.js

========================================================= */


/* =========================================================
   START OF FIREBASE IMPORTS
========================================================= */

import {
    auth,
    db,
    watchAuth,
    logoutUser,
    getCollection,
    checkAdmin,
    doc,
    getDoc
} from "./firebase.js";


/* =========================================================
   END OF FIREBASE IMPORTS
========================================================= */



/* =========================================================
   START OF STATE
========================================================= */

let currentAdmin = null;

let studentsData = [];

let currentSection = "dashboard";

let modalElement = null;


/* =========================================================
   END OF STATE
========================================================= */



/* =========================================================
   START OF DOM
========================================================= */

const adminNameElement =
    document.getElementById("adminName");

const adminAvatarElement =
    document.getElementById("adminAvatar");

const logoutButton =
    document.getElementById("logoutBtn");

const modalContainer =
    document.getElementById("modalContainer");

const notificationContainer =
    document.getElementById("notificationContainer");

const studentSearchInput =
    document.getElementById("studentSearch");

const studentSearchButton =
    document.getElementById("studentSearchBtn");

const studentsList =
    document.getElementById("studentsList");


/* =========================================================
   END OF DOM
========================================================= */



/* =========================================================
   START OF INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeAdmin
);


async function initializeAdmin() {

    try {

        setupNavigation();

        setupLogout();

        setupStudentSearch();

        setupModalSystem();

        await checkAdminSession();

    } catch (error) {

        console.error(
            "ENG Forge Admin initialization error:",
            error
        );

        showNotification(
            "حدث خطأ أثناء تشغيل لوحة الإدارة.",
            "error"
        );
    }
}


/* =========================================================
   END OF INITIALIZATION
========================================================= */



/* =========================================================
   START OF ADMIN AUTH CHECK
========================================================= */

async function checkAdminSession() {

    return new Promise((resolve) => {

        let finished = false;


        const finish = () => {

            if (finished) {
                return;
            }

            finished = true;

            resolve();

        };


        try {

            watchAuth(
                async (user) => {

                    try {

                        /* =====================================
                           USER NOT LOGGED IN
                        ===================================== */

                        if (!user) {

                            console.warn(
                                "No authenticated user."
                            );

                            redirectToLogin();

                            finish();

                            return;
                        }


                        /* =====================================
                           CHECK ADMIN ROLE
                        ===================================== */

                        let adminStatus = false;

                        try {

                            adminStatus =
                                await checkAdmin(user.uid);

                        } catch (error) {

                            console.error(
                                "Admin permission check failed:",
                                error
                            );

                            showNotification(
                                "تعذر التحقق من صلاحيات الإدارة.",
                                "error"
                            );

                            redirectToHome();

                            finish();

                            return;
                        }


                        /* =====================================
                           USER IS NOT ADMIN
                        ===================================== */

                        if (!adminStatus) {

                            console.warn(
                                "User is not an admin."
                            );

                            showNotification(
                                "ليس لديك صلاحية لدخول لوحة الإدارة.",
                                "error"
                            );

                            setTimeout(
                                () => {
                                    redirectToHome();
                                },
                                1200
                            );

                            finish();

                            return;
                        }


                        /* =====================================
                           ADMIN APPROVED
                        ===================================== */

                        currentAdmin = user;

                        await setAdminInfo(user);

                        await loadDashboardStatistics();

                        finish();


                    } catch (error) {

                        console.error(
                            "Admin session error:",
                            error
                        );

                        showNotification(
                            "حدث خطأ أثناء التحقق من الحساب.",
                            "error"
                        );

                        redirectToHome();

                        finish();
                    }

                }
            );

        } catch (error) {

            console.error(
                "watchAuth error:",
                error
            );

            redirectToHome();

            finish();
        }

    });
}


/* =========================================================
   END OF ADMIN AUTH CHECK
========================================================= */



/* =========================================================
   START OF ADMIN INFO
========================================================= */

async function setAdminInfo(user) {

    if (!user) {
        return;
    }


    /* =====================================
       DEFAULT ADMIN DATA
    ===================================== */

    let profileData = {};


    /* =====================================
       LOAD PROFILE FROM FIRESTORE
    ===================================== */

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const userSnapshot =
            await getDoc(
                userRef
            );


        if (userSnapshot.exists()) {

            profileData =
                userSnapshot.data() || {};

        }

    } catch (error) {

        console.warn(
            "Could not load admin profile from Firestore:",
            error
        );

    }


    /* =====================================
       ADMIN NAME
    ===================================== */

    const displayName =
        profileData.name ||
        profileData.displayName ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Admin";


    if (adminNameElement) {

        adminNameElement.textContent =
            displayName;

    }


    /* =====================================
       FIND ADMIN PHOTO
    ===================================== */

    /*
       بنبحث في أكثر من اسم محتمل للصورة
       حتى تكون متوافقة مع بيانات البروفايل
       الموجودة بالفعل.
    */

    const profilePhoto =
        profileData.photoURL ||
        profileData.photoUrl ||
        profileData.photo ||
        profileData.imageURL ||
        profileData.imageUrl ||
        profileData.image ||
        user.photoURL ||
        "";


    /* =====================================
       ADMIN AVATAR
    ===================================== */

    if (adminAvatarElement) {

        adminAvatarElement.innerHTML = "";

        if (profilePhoto) {

            const image =
                document.createElement("img");


            image.src =
                profilePhoto;


            image.alt =
                displayName;


            image.loading =
                "eager";


            image.referrerPolicy =
                "no-referrer";


            image.onerror =
                () => {

                    image.remove();

                    adminAvatarElement.textContent =
                        getInitial(displayName);

                };


            adminAvatarElement.appendChild(
                image
            );


        } else {

            adminAvatarElement.textContent =
                getInitial(displayName);

        }

    }


    /* =====================================
       SAVE COMPLETE PROFILE DATA
    ===================================== */

    currentAdmin = {

        ...user,

        ...profileData,

        uid: user.uid,

        email:
            profileData.email ||
            user.email ||
            "",

        photoURL:
            profilePhoto || null,

        displayName:
            displayName

    };

}


/* =========================================================
   GET INITIAL
========================================================= */

function getInitial(name) {

    if (!name) {
        return "⚙️";
    }

    const cleanName =
        String(name).trim();

    if (!cleanName) {
        return "⚙️";
    }

    return cleanName.charAt(0).toUpperCase();
}


/* =========================================================
   END OF ADMIN INFO
========================================================= */



/* =========================================================
   START OF NAVIGATION
========================================================= */

function setupNavigation() {

    const navigationItems =
        document.querySelectorAll(
            ".nav-item"
        );


    const quickActions =
        document.querySelectorAll(
            ".quick-action"
        );


    /* =====================================
       SIDEBAR
    ===================================== */

    navigationItems.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const section =
                        button.dataset.section;

                    if (!section) {
                        return;
                    }

                    showSection(section);

                }
            );

        }
    );


    /* =====================================
       QUICK ACTIONS
    ===================================== */

    quickActions.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const section =
                        button.dataset.section;

                    if (!section) {
                        return;
                    }

                    showSection(section);

                }
            );

        }
    );

}


/* =========================================================
   SHOW SECTION
========================================================= */

function showSection(sectionName) {

    if (!sectionName) {
        return;
    }


    const sections =
        document.querySelectorAll(
            ".admin-section"
        );


    const navigationItems =
        document.querySelectorAll(
            ".nav-item"
        );


    /* =====================================
       HIDE ALL SECTIONS
    ===================================== */

    sections.forEach(
        (section) => {

            section.classList.remove(
                "active"
            );

        }
    );


    /* =====================================
       SHOW SELECTED SECTION
    ===================================== */

    const targetSection =
        document.getElementById(
            `section-${sectionName}`
        );


    if (targetSection) {

        targetSection.classList.add(
            "active"
        );

    }


    /* =====================================
       UPDATE NAVIGATION
    ===================================== */

    navigationItems.forEach(
        (button) => {

            const buttonSection =
                button.dataset.section;

            button.classList.toggle(
                "active",
                buttonSection === sectionName
            );

        }
    );


    currentSection =
        sectionName;


    /* =====================================
       SCROLL TO TOP
    ===================================== */

    const main =
        document.querySelector(
            ".admin-main"
        );


    if (main) {

        main.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    /* =====================================
       SECTION EVENTS
    ===================================== */

    document.dispatchEvent(
        new CustomEvent(
            "adminSectionChanged",
            {
                detail: sectionName
            }
        )
    );

}


/* =========================================================
   END OF NAVIGATION
========================================================= */



/* =========================================================
   START OF LOGOUT
========================================================= */

function setupLogout() {

    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        async () => {

            const confirmed =
                window.confirm(
                    "هل تريد تسجيل الخروج من لوحة الإدارة؟"
                );


            if (!confirmed) {
                return;
            }


            try {

                logoutButton.disabled = true;

                logoutButton.textContent =
                    "جاري تسجيل الخروج...";


                await logoutUser();


                window.location.href =
                    "index.html";


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                logoutButton.disabled =
                    false;

                logoutButton.innerHTML =
                    "🚪 <span>تسجيل الخروج</span>";


                showNotification(
                    "تعذر تسجيل الخروج. حاول مرة أخرى.",
                    "error"
                );

            }

        }
    );

}


/* =========================================================
   END OF LOGOUT
========================================================= */



/* =========================================================
   START OF MODAL SYSTEM
========================================================= */

function setupModalSystem() {

    if (!modalContainer) {
        return;
    }


    modalContainer.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                modalContainer
            ) {

                closeModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape" &&
                modalElement
            ) {

                closeModal();

            }

        }
    );

}


/* =========================================================
   OPEN MODAL
========================================================= */

function openModal({
    title = "",
    content = "",
    size = "medium",
    closeButton = true
} = {}) {

    if (!modalContainer) {
        return null;
    }


    closeModal();


    const modal =
        document.createElement("div");

    modal.className =
        "modal active";


    const modalContent =
        document.createElement("div");

    modalContent.className =
        `modal-content modal-${size}`;


    /* =====================================
       HEADER
    ===================================== */

    const header =
        document.createElement("div");

    header.className =
        "modal-header";


    const heading =
        document.createElement("h2");

    heading.textContent =
        title;


    header.appendChild(
        heading
    );


    /* =====================================
       CLOSE BUTTON
    ===================================== */

    if (closeButton) {

        const close =
            document.createElement("button");

        close.type =
            "button";

        close.className =
            "modal-close";

        close.innerHTML =
            "×";

        close.setAttribute(
            "aria-label",
            "إغلاق"
        );


        close.addEventListener(
            "click",
            closeModal
        );


        header.appendChild(
            close
        );

    }


    /* =====================================
       BODY
    ===================================== */

    const body =
        document.createElement("div");

    body.className =
        "modal-body";


    if (
        typeof content ===
        "string"
    ) {

        body.innerHTML =
            content;

    } else if (
        content instanceof
        HTMLElement
    ) {

        body.appendChild(
            content
        );

    }


    modalContent.appendChild(
        header
    );

    modalContent.appendChild(
        body
    );

    modal.appendChild(
        modalContent
    );

    modalContainer.appendChild(
        modal
    );


    modalElement =
        modal;


    modalContainer.classList.add(
        "active"
    );


    modalContainer.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );


    return {
        modal,
        modalContent,
        body,
        close: closeModal
    };

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    if (modalElement) {

        modalElement.remove();

        modalElement =
            null;

    }


    if (modalContainer) {

        modalContainer.classList.remove(
            "active"
        );

        modalContainer.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   END OF MODAL SYSTEM
========================================================= */



/* =========================================================
   START OF NOTIFICATION SYSTEM
========================================================= */

function showNotification(
    message,
    type = "info",
    duration = 3500
) {

    if (!notificationContainer) {

        alert(message);

        return;

    }


    const notification =
        document.createElement("div");


    notification.className =
        `notification notification-${type}`;


    /* =====================================
       ICON
    ===================================== */

    const icon =
        document.createElement("span");

    icon.className =
        "notification-icon";


    const icons = {

        success: "✓",

        error: "✕",

        warning: "⚠",

        info: "ℹ"

    };


    icon.textContent =
        icons[type] ||
        icons.info;


    /* =====================================
       MESSAGE
    ===================================== */

    const text =
        document.createElement("span");

    text.className =
        "notification-message";

    text.textContent =
        message;


    /* =====================================
       CLOSE
    ===================================== */

    const close =
        document.createElement("button");

    close.type =
        "button";

    close.className =
        "notification-close";

    close.textContent =
        "×";


    close.addEventListener(
        "click",
        () => {

            removeNotification(
                notification
            );

        }
    );


    notification.appendChild(
        icon
    );

    notification.appendChild(
        text
    );

    notification.appendChild(
        close
    );


    notificationContainer.appendChild(
        notification
    );


    /* =====================================
       AUTO REMOVE
    ===================================== */

    if (duration > 0) {

        setTimeout(
            () => {

                removeNotification(
                    notification
                );

            },
            duration
        );

    }


    return notification;

}


/* =========================================================
   REMOVE NOTIFICATION
========================================================= */

function removeNotification(
    notification
) {

    if (!notification) {
        return;
    }


    notification.classList.add(
        "removing"
    );


    setTimeout(
        () => {

            notification.remove();

        },
        250
    );

}


/* =========================================================
   END OF NOTIFICATION SYSTEM
========================================================= */



/* =========================================================
   START OF DASHBOARD STATISTICS
========================================================= */

async function loadDashboardStatistics() {

    try {

        const [
            subjects,
            lectures,
            exams,
            users
        ] = await Promise.all([

            getCollection(
                "subjects"
            ),

            getCollection(
                "lectures"
            ),

            getCollection(
                "exams"
            ),

            getCollection(
                "users"
            )

        ]);


        const subjectCount =
            Array.isArray(subjects)
                ? subjects.length
                : 0;


        const lectureCount =
            Array.isArray(lectures)
                ? lectures.length
                : 0;


        const examCount =
            Array.isArray(exams)
                ? exams.length
                : 0;


        const studentCount =
            Array.isArray(users)
                ? users.filter(
                    (user) =>
                        user.role !== "admin"
                ).length
                : 0;


        setElementText(
            "subjectsCount",
            subjectCount
        );

        setElementText(
            "lecturesCount",
            lectureCount
        );

        setElementText(
            "examsCount",
            examCount
        );

        setElementText(
            "studentsCount",
            studentCount
        );


        studentsData =
            Array.isArray(users)
                ? users.filter(
                    (user) =>
                        user.role !== "admin"
                )
                : [];


    } catch (error) {

        console.error(
            "Dashboard statistics error:",
            error
        );


        setElementText(
            "subjectsCount",
            "0"
        );

        setElementText(
            "lecturesCount",
            "0"
        );

        setElementText(
            "examsCount",
            "0"
        );

        setElementText(
            "studentsCount",
            "0"
        );

    }

}


/* =========================================================
   SET ELEMENT TEXT
========================================================= */

function setElementText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    element.textContent =
        String(value);

}


/* =========================================================
   END OF DASHBOARD STATISTICS
========================================================= */



/* =========================================================
   START OF STUDENT SEARCH
========================================================= */

function setupStudentSearch() {

    if (!studentSearchInput) {
        return;
    }


    if (studentSearchButton) {

        studentSearchButton.addEventListener(
            "click",
            performStudentSearch
        );

    }


    studentSearchInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                performStudentSearch();

            }

        }
    );


    studentSearchInput.addEventListener(
        "input",
        () => {

            const value =
                studentSearchInput.value.trim();


            if (!value) {

                renderStudents(
                    studentsData
                );

            }

        }
    );

}


/* =========================================================
   PERFORM STUDENT SEARCH
========================================================= */

function performStudentSearch() {

    const searchValue =
        studentSearchInput
            ?.value
            ?.trim()
            ?.toLowerCase() ||
        "";


    if (!searchValue) {

        renderStudents(
            studentsData
        );

        return;

    }


    const filtered =
        studentsData.filter(
            (student) => {

                const name =
                    String(
                        student.name ||
                        student.displayName ||
                        ""
                    ).toLowerCase();


                const studentId =
                    String(
                        student.studentId ||
                        student.studentIdNumber ||
                        ""
                    ).toLowerCase();


                const email =
                    String(
                        student.email ||
                        ""
                    ).toLowerCase();


                return (
                    name.includes(
                        searchValue
                    ) ||

                    studentId.includes(
                        searchValue
                    ) ||

                    email.includes(
                        searchValue
                    )
                );

            }
        );


    renderStudents(
        filtered
    );

}


/* =========================================================
   RENDER STUDENTS
========================================================= */

function renderStudents(
    students
) {

    if (!studentsList) {
        return;
    }


    studentsList.innerHTML =
        "";


    if (
        !Array.isArray(students) ||
        students.length === 0
    ) {

        studentsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👨‍🎓</div>

                <h3>
                    لا يوجد طلاب
                </h3>

                <p>
                    لم يتم العثور على طلاب مطابقين للبحث.
                </p>
            </div>
        `;

        return;

    }


    students.forEach(
        (student) => {

            const card =
                createStudentCard(
                    student
                );

            studentsList.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   CREATE STUDENT CARD
========================================================= */

function createStudentCard(
    student
) {

    const card =
        document.createElement("div");

    card.className =
        "content-item student-item";


    const name =
        student.name ||
        student.displayName ||
        "طالب بدون اسم";


    const studentId =
        student.studentId ||
        student.studentIdNumber ||
        "غير مسجل";


    const email =
        student.email ||
        "لا يوجد بريد";


    const photo =
        student.photoURL ||
        student.photo ||
        student.image ||
        "";


    const avatar =
        document.createElement("div");

    avatar.className =
        "student-avatar";


    if (photo) {

        const image =
            document.createElement("img");

        image.src =
            photo;

        image.alt =
            name;

        image.loading =
            "lazy";

        image.onerror =
            () => {

                image.remove();

                avatar.textContent =
                    getInitial(name);

            };


        avatar.appendChild(
            image
        );

    } else {

        avatar.textContent =
            getInitial(name);

    }


    const info =
        document.createElement("div");

    info.className =
        "student-info";


    const title =
        document.createElement("strong");

    title.textContent =
        name;


    const idText =
        document.createElement("span");

    idText.textContent =
        `رقم الطالب: ${studentId}`;


    const emailText =
        document.createElement("small");

    emailText.textContent =
        email;


    info.appendChild(
        title
    );

    info.appendChild(
        idText
    );

    info.appendChild(
        emailText
    );


    card.appendChild(
        avatar
    );

    card.appendChild(
        info
    );


    return card;

}


/* =========================================================
   END OF STUDENT SEARCH
========================================================= */



/* =========================================================
   START OF HELPERS
========================================================= */


/* =========================================================
   REDIRECT TO LOGIN
========================================================= */

function redirectToLogin() {

    const currentPage =
        window.location.pathname;


    if (
        currentPage.includes(
            "login"
        )
    ) {

        return;

    }


    window.location.href =
        "login.html";

}


/* =========================================================
   REDIRECT TO HOME
========================================================= */

function redirectToHome() {

    window.location.href =
        "index.html";

}


/* =========================================================
   END OF HELPERS
========================================================= */



/* =========================================================
   START OF PUBLIC API
========================================================= */

window.ENGForgeAdmin = {

    get currentAdmin() {
        return currentAdmin;
    },

    get currentSection() {
        return currentSection;
    },

    get students() {
        return studentsData;
    },

    showSection,

    openModal,

    closeModal,

    showNotification,

    loadDashboardStatistics,

    renderStudents

};


/* =========================================================
   ADMIN CORE READY
========================================================= */

console.log(
    "ENG Forge Admin Core loaded successfully."
);


/* =========================================================
   END OF FILE
========================================================= */
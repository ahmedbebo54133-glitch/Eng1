
/* =========================================================
   ENG FORGE
   SUBJECT PAGE
   FIREBASE + FIRESTORE
========================================================= */

import {
    auth,
    db,
    watchAuth,
    getDocument,
    getDocs,
    collection
} from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let currentSubject = null;

let lectures = [];
let exams = [];
let sheets = [];
let news = [];


/* =========================================================
   DOM
========================================================= */

const pageLoader =
    document.getElementById("pageLoader");

const errorScreen =
    document.getElementById("errorScreen");

const errorMessage =
    document.getElementById("errorMessage");

const retryBtn =
    document.getElementById("retryBtn");

const subjectName =
    document.getElementById("subjectName");

const subjectDescription =
    document.getElementById("subjectDescription");

const subjectIcon =
    document.getElementById("subjectIcon");

const studentName =
    document.getElementById("studentName");

const studentAvatar =
    document.getElementById("studentAvatar");

const lecturesList =
    document.getElementById("lecturesList");

const examsList =
    document.getElementById("examsList");

const sheetsList =
    document.getElementById("sheetsList");

const newsList =
    document.getElementById("newsList");

const lecturesCount =
    document.getElementById("lecturesCount");

const examsCount =
    document.getElementById("examsCount");

const sheetsCount =
    document.getElementById("sheetsCount");

const newsCount =
    document.getElementById("newsCount");

const lecturesMeta =
    document.getElementById("lecturesMeta");

const examsMeta =
    document.getElementById("examsMeta");

const sheetsMeta =
    document.getElementById("sheetsMeta");


/* =========================================================
   GET SUBJECT ID
========================================================= */

function getSubjectId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");

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
   DATE FORMAT
========================================================= */

function formatDate(value) {

    if (!value) {
        return "";
    }

    try {

        let date;

        if (value?.toDate) {

            date = value.toDate();

        } else if (value instanceof Date) {

            date = value;

        } else {

            date = new Date(value);

        }

        if (isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleDateString(
            "ar-EG",
            {
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

    } catch (error) {

        return "";

    }

}


/* =========================================================
   GET CREATED TIME
========================================================= */

function getCreatedTime(item) {

    if (!item?.createdAt) {
        return 0;
    }

    try {

        if (item.createdAt.toMillis) {

            return item.createdAt.toMillis();

        }

        if (item.createdAt.toDate) {

            return item.createdAt
                .toDate()
                .getTime();

        }

        return (
            new Date(
                item.createdAt
            ).getTime() || 0
        );

    } catch {

        return 0;

    }

}


/* =========================================================
   SORT DATA
========================================================= */

function sortByCreatedAt(items) {

    return [...items].sort(
        (a, b) =>
            getCreatedTime(b) -
            getCreatedTime(a)
    );

}


/* =========================================================
   NORMALIZE VALUE
========================================================= */

function normalizeValue(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();

}


/* =========================================================
   GET ITEM SUBJECT ID
========================================================= */

function getItemSubjectId(item) {

    return normalizeValue(
        item?.subjectId
    );

}


/* =========================================================
   GET ITEM TYPE
========================================================= */

function getItemType(item) {

    return normalizeValue(
        item?.type
    ).toLowerCase();

}


/* =========================================================
   LOADING
========================================================= */

function hideLoader() {

    if (!pageLoader) {
        return;
    }

    pageLoader.classList.add("hidden");

}


function showLoader() {

    if (!pageLoader) {
        return;
    }

    pageLoader.classList.remove("hidden");

}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    hideLoader();

    if (errorMessage) {

        errorMessage.textContent =
            message;

    }

    if (errorScreen) {

        errorScreen.hidden = false;

    }

}


function hideError() {

    if (errorScreen) {

        errorScreen.hidden = true;

    }

}


/* =========================================================
   GET USER DATA
========================================================= */

async function loadCurrentUser(user) {

    if (!user) {
        return;
    }

    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const snapshot =
            await getDoc(userRef);

        let data = {};

        if (snapshot.exists()) {

            data =
                snapshot.data();

        }


        const name =
            data.name ||
            data.studentName ||
            user.displayName ||
            "طالب";


        if (studentName) {

            studentName.textContent =
                name;

        }


        const photo =
            data.photoURL ||
            data.photoUrl ||
            data.photo ||
            data.imageURL ||
            data.imageUrl ||
            user.photoURL;


        if (
            photo &&
            studentAvatar
        ) {

            studentAvatar.innerHTML = `
                <img
                    src="${escapeHTML(photo)}"
                    alt="صورة الطالب"
                >
            `;

        } else if (studentAvatar) {

            studentAvatar.textContent =
                "👤";

        }

    } catch (error) {

        console.error(
            "USER DATA ERROR:",
            error
        );

        if (studentName) {

            studentName.textContent =
                user.displayName ||
                "طالب";

        }

    }

}


/* =========================================================
   LOAD SUBJECT
========================================================= */

async function loadSubject() {

    const subjectId =
        getSubjectId();


    if (!subjectId) {

        showError(
            "رابط المادة غير صحيح. لم يتم العثور على رقم المادة."
        );

        return false;

    }


    try {

        const subjectRef =
            doc(
                db,
                "subjects",
                subjectId
            );


        const snapshot =
            await getDoc(subjectRef);


        if (!snapshot.exists()) {

            showError(
                "المادة التي تحاول الوصول إليها غير موجودة."
            );

            return false;

        }


        currentSubject = {

            id: snapshot.id,

            ...snapshot.data()

        };


        renderSubject();

        return true;

    } catch (error) {

        // التعديل: إظهار كود الخطأ ورسالة Firebase الحقيقية
        console.error(
            "SUBJECT ERROR:",
            error
        );

        showError(
            `خطأ تحميل المادة: ${error?.code || "unknown"} — ${error?.message || "سبب غير معروف"}`
        );

        return false;

    }

}


/* =========================================================
   RENDER SUBJECT
========================================================= */

function renderSubject() {

    if (!currentSubject) {
        return;
    }


    const name =
        currentSubject.name ||
        currentSubject.title ||
        "مادة بدون اسم";


    const description =
        currentSubject.description ||
        "لا يوجد وصف لهذه المادة حاليًا.";


    const icon =
        currentSubject.icon ||
        "⚙️";


    if (subjectName) {

        subjectName.textContent =
            name;

    }


    if (subjectDescription) {

        subjectDescription.textContent =
            description;

    }


    if (subjectIcon) {

        subjectIcon.textContent =
            icon;

    }


    document.title =
        `${name} | ENG Forge ⚙️`;

}


/* =========================================================
   LOAD COLLECTION
========================================================= */

async function loadCollection(
    collectionName
) {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    collectionName
                )
            );


        return snapshot.docs.map(
            item => ({

                id: item.id,

                ...item.data()

            })
        );

    } catch (error) {

        console.error(
            `LOAD ${collectionName} ERROR:`,
            error
        );

        throw error;

    }

}


/* =========================================================
   LOAD SUBJECT CONTENT
========================================================= */

async function loadSubjectContent() {

    if (!currentSubject) {
        return;
    }


    const subjectId =
        normalizeValue(
            currentSubject.id
        );


    try {

        const [
            allLectures,
            allExams,
            allSheets
        ] = await Promise.all([

            loadCollection(
                "lectures"
            ),

            loadCollection(
                "exams"
            ),

            loadCollection(
                "sheets"
            )

        ]);


        /* =====================================================
           LECTURES
        ===================================================== */

        lectures =
            sortByCreatedAt(

                allLectures.filter(
                    item => {

                        return (
                            getItemSubjectId(item) ===
                            subjectId
                        );

                    }
                )

            );


        /* =====================================================
           EXAMS
        ===================================================== */

        exams =
            sortByCreatedAt(

                allExams.filter(
                    item => {

                        return (
                            getItemSubjectId(item) ===
                            subjectId
                        );

                    }
                )

            );


        /* =====================================================
           SHEETS
        ===================================================== */

        sheets =
            sortByCreatedAt(

                allSheets.filter(
                    item => {

                        return (
                            getItemSubjectId(item) ===
                            subjectId
                        );

                    }
                )

            );


        /* =====================================================
           NEWS
        ===================================================== */

        news =
            sortByCreatedAt(

                sheets.filter(
                    item => {

                        const type =
                            getItemType(item);

                        return (
                            type === "news" ||
                            type === "announcement"
                        );

                    }
                )

            );


        console.log(
            "ENG FORGE SUBJECT ID:",
            subjectId
        );

        console.log(
            "ENG FORGE SUBJECT SHEETS:",
            sheets
        );

        console.log(
            "ENG FORGE SUBJECT NEWS:",
            news
        );


        renderAllContent();

    } catch (error) {

        console.error(
            "CONTENT ERROR:",
            error
        );

        showError(
            "تم تحميل المادة، لكن تعذر تحميل محتواها."
        );

    }

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAllContent() {

    renderLectures();

    renderExams();

    renderSheets();

    renderNews();

    updateCounters();

}


/* =========================================================
   UPDATE COUNTERS
========================================================= */

function updateCounters() {

    const normalSheets =
        sheets.filter(
            item => {

                const type =
                    getItemType(item);

                return (
                    type !== "news" &&
                    type !== "announcement"
                );

            }
        );


    if (lecturesCount) {

        lecturesCount.textContent =
            lectures.length;

    }


    if (examsCount) {

        examsCount.textContent =
            exams.length;

    }


    if (sheetsCount) {

        sheetsCount.textContent =
            normalSheets.length;

    }


    if (newsCount) {

        newsCount.textContent =
            news.length;

    }


    if (lecturesMeta) {

        lecturesMeta.textContent =
            `📚 ${lectures.length} محاضرة`;

    }


    if (examsMeta) {

        examsMeta.textContent =
            `📝 ${exams.length} امتحان`;

    }


    if (sheetsMeta) {

        sheetsMeta.textContent =
            `📄 ${normalSheets.length} ملف`;

    }

}


/* =========================================================
   EMPTY STATE
========================================================= */

function setEmptyState(
    listElement,
    emptyId,
    isEmpty
) {

    if (listElement) {

        listElement.style.display =
            isEmpty
                ? "none"
                : "";

    }


    const emptyElement =
        document.getElementById(
            emptyId
        );


    if (emptyElement) {

        emptyElement.hidden =
            !isEmpty;

    }

}


/* =========================================================
   RENDER LECTURES
========================================================= */

function renderLectures() {

    if (!lecturesList) {
        return;
    }


    if (!lectures.length) {

        lecturesList.innerHTML =
            "";

        setEmptyState(
            lecturesList,
            "lecturesEmpty",
            true
        );

        return;

    }


    setEmptyState(
        lecturesList,
        "lecturesEmpty",
        false
    );


    lecturesList.innerHTML =
        lectures.map(
            (lecture, index) => {

                const title =
                    lecture.title ||
                    `المحاضرة ${index + 1}`;


                const description =
                    lecture.description ||
                    lecture.content ||
                    "لا يوجد وصف للمحاضرة.";


                const date =
                    formatDate(
                        lecture.createdAt
                    );


                return `

                    <article
                        class="content-item lecture-item"
                    >

                        <div class="item-icon">
                            📚
                        </div>


                        <div class="item-info">

                            <h3>
                                ${escapeHTML(title)}
                            </h3>


                            <p>
                                ${escapeHTML(description)}
                            </p>


                            <div class="item-meta">

                                ${
                                    date
                                        ? `
                                            <span>
                                                📅
                                                ${escapeHTML(date)}
                                            </span>
                                          `
                                        : ""
                                }

                            </div>

                        </div>


                        <button
                            type="button"
                            class="item-action"
                            data-action="open-lecture"
                            data-id="${escapeHTML(lecture.id)}"
                            title="فتح المحاضرة"
                        >
                            ←
                        </button>

                    </article>

                `;

            }
        ).join("");

}


/* =========================================================
   RENDER EXAMS
========================================================= */

function renderExams() {

    if (!examsList) {
        return;
    }


    if (!exams.length) {

        examsList.innerHTML =
            "";

        setEmptyState(
            examsList,
            "examsEmpty",
            true
        );

        return;

    }


    setEmptyState(
        examsList,
        "examsEmpty",
        false
    );


    examsList.innerHTML =
        exams.map(
            (exam, index) => {

                const title =
                    exam.title ||
                    `امتحان ${index + 1}`;


                const description =
                    exam.description ||
                    "اختبر معلوماتك في هذه المادة.";


                const duration =
                    exam.duration
                        ? `⏱ ${exam.duration} دقيقة`
                        : "";


                const marks =
                    exam.totalMarks
                        ? `🎯 ${exam.totalMarks} درجة`
                        : "";


                return `

                    <article
                        class="content-item exam-item"
                    >

                        <div class="item-icon">
                            📝
                        </div>


                        <div class="item-info">

                            <h3>
                                ${escapeHTML(title)}
                            </h3>


                            <p>
                                ${escapeHTML(description)}
                            </p>


                            <div class="item-meta">

                                ${
                                    duration
                                        ? `
                                            <span>
                                                ${escapeHTML(duration)}
                                            </span>
                                          `
                                        : ""
                                }


                                ${
                                    marks
                                        ? `
                                            <span>
                                                ${escapeHTML(marks)}
                                            </span>
                                          `
                                        : ""
                                }

                            </div>

                        </div>


                        <button
                            type="button"
                            class="item-action"
                            data-action="open-exam"
                            data-id="${escapeHTML(exam.id)}"
                            title="فتح الامتحان"
                        >
                            ←
                        </button>

                    </article>

                `;

            }
        ).join("");

}


/* =========================================================
   RENDER SHEETS
========================================================= */

function renderSheets() {

    if (!sheetsList) {
        return;
    }


    const normalSheets =
        sheets.filter(
            item => {

                const type =
                    getItemType(item);

                return (
                    type !== "news" &&
                    type !== "announcement"
                );

            }
        );


    if (!normalSheets.length) {

        sheetsList.innerHTML =
            "";

        setEmptyState(
            sheetsList,
            "sheetsEmpty",
            true
        );

        return;

    }


    setEmptyState(
        sheetsList,
        "sheetsEmpty",
        false
    );


    sheetsList.innerHTML =
        normalSheets.map(
            (sheet, index) => {

                const title =
                    sheet.title ||
                    `ملف ${index + 1}`;


                const description =
                    sheet.description ||
                    sheet.content ||
                    "ملف دراسي للمادة.";


                const date =
                    formatDate(
                        sheet.createdAt
                    );


                const fileUrl =
                    sheet.fileUrl ||
                    sheet.url ||
                    sheet.secure_url ||
                    "";


                return `

                    <article
                        class="content-item sheet-item"
                    >

                        <div class="item-icon">
                            📄
                        </div>


                        <div class="item-info">

                            <h3>
                                ${escapeHTML(title)}
                            </h3>


                            <p>
                                ${escapeHTML(description)}
                            </p>


                            <div class="item-meta">

                                ${
                                    date
                                        ? `
                                            <span>
                                                📅
                                                ${escapeHTML(date)}
                                            </span>
                                          `
                                        : ""
                                }

                            </div>

                        </div>


                        ${
                            fileUrl
                                ? `
                                    <button
                                        type="button"
                                        class="item-action"
                                        data-action="open-sheet"
                                        data-id="${escapeHTML(sheet.id)}"
                                        title="عرض الملف"
                                    >
                                        ←
                                    </button>
                                  `
                                : `
                                    <button
                                        type="button"
                                        class="item-action"
                                        data-action="open-sheet"
                                        data-id="${escapeHTML(sheet.id)}"
                                        title="عرض الملف"
                                    >
                                        ←
                                    </button>
                                  `
                        }

                    </article>

                `;

            }
        ).join("");

}


/* =========================================================
   RENDER NEWS
========================================================= */

function renderNews() {

    if (!newsList) {
        return;
    }


    if (!news.length) {

        newsList.innerHTML =
            "";

        setEmptyState(
            newsList,
            "newsEmpty",
            true
        );

        return;

    }


    setEmptyState(
        newsList,
        "newsEmpty",
        false
    );


    newsList.innerHTML =
        news.map(
            item => {

                const title =
                    item.title ||
                    "إعلان مهم";


                const content =
                    item.content ||
                    item.description ||
                    "";


                const date =
                    formatDate(
                        item.createdAt
                    );


                return `

                    <article
                        class="content-item news-item"
                    >

                        <div class="item-icon">
                            📢
                        </div>


                        <div class="item-info">

                            <h3>
                                ${escapeHTML(title)}
                            </h3>


                            <p>
                                ${escapeHTML(content)}
                            </p>


                            ${
                                date
                                    ? `
                                        <div class="item-meta">

                                            <span>
                                                📅
                                                ${escapeHTML(date)}
                                            </span>

                                        </div>
                                      `
                                    : ""
                            }

                        </div>


                        <button
                            type="button"
                            class="item-action"
                            data-action="open-news"
                            data-id="${escapeHTML(item.id)}"
                            title="عرض الخبر"
                        >
                            ←
                        </button>

                    </article>

                `;

            }
        ).join("");

}


/* =========================================================
   TABS
========================================================= */

function setupTabs() {

    const tabs =
        document.querySelectorAll(
            ".content-tab"
        );


    const sections =
        document.querySelectorAll(
            ".content-section"
        );


    tabs.forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                const target =
                    tab.dataset.tab;


                tabs.forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });


                sections.forEach(section => {

                    section.classList.remove(
                        "active"
                    );

                });


                tab.classList.add(
                    "active"
                );


                const targetSection =
                    document.querySelector(
                        `[data-content="${target}"]`
                    );


                if (targetSection) {

                    targetSection.classList.add(
                        "active"
                    );

                }

            }
        );

    });

}


/* =========================================================
   MODAL
========================================================= */

function createModal(
    title,
    content
) {

    const oldModal =
        document.getElementById(
            "subjectContentModal"
        );


    if (oldModal) {

        oldModal.remove();

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "subjectContentModal";


    modal.innerHTML = `

        <div
            class="subject-modal-overlay"
            data-modal-close
        >

            <div
                class="subject-modal-box"
                onclick="event.stopPropagation()"
            >

                <button
                    type="button"
                    class="subject-modal-close"
                    data-modal-close
                    aria-label="إغلاق"
                >
                    ×
                </button>


                <div class="subject-modal-header">

                    <div class="subject-modal-icon">
                        📢
                    </div>


                    <h2>
                        ${escapeHTML(title)}
                    </h2>

                </div>


                <div class="subject-modal-content">

                    ${content}

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    "[data-modal-close]"
                )
            ) {

                modal.remove();

            }

        }
    );


    document.addEventListener(
        "keydown",
        function closeOnEscape(event) {

            if (
                event.key === "Escape" &&
                document.getElementById(
                    "subjectContentModal"
                )
            ) {

                modal.remove();

                document.removeEventListener(
                    "keydown",
                    closeOnEscape
                );

            }

        }
    );

}


/* =========================================================
   OPEN LECTURE
========================================================= */

function openLecture(id) {

    if (!id) {
        return;
    }


    window.location.href =
        `lecture.html?id=${encodeURIComponent(id)}`;

}


/* =========================================================
   OPEN EXAM
========================================================= */

function openExam(id) {

    if (!id) {
        return;
    }


    window.location.href =
        `exam.html?id=${encodeURIComponent(id)}`;

}


/* =========================================================
   OPEN SHEET
========================================================= */

function openSheet(id) {

    const sheet =
        sheets.find(
            item =>
                item.id === id
        );


    if (!sheet) {
        return;
    }


    const title =
        sheet.title ||
        "الملف";


    const content =
        sheet.content ||
        sheet.description ||
        "";


    const url =
        sheet.fileUrl ||
        sheet.url ||
        sheet.secure_url ||
        "";


    createModal(
        title,
        `

            ${
                content
                    ? `
                        <div class="modal-text">

                            ${escapeHTML(content)}

                        </div>
                      `
                    : `
                        <div class="modal-empty">

                            لا يوجد وصف لهذا الملف.

                        </div>
                      `
            }


            ${
                url
                    ? `
                        <a
                            href="${escapeHTML(url)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="modal-file-button"
                        >
                            📄 فتح الملف
                        </a>
                      `
                    : `
                        <div class="modal-empty">

                            لا يوجد ملف مرفق بهذا الشيت.

                        </div>
                      `
            }

        `
    );

}


/* =========================================================
   OPEN NEWS
========================================================= */

function openNews(id) {

    const item =
        news.find(
            newsItem =>
                newsItem.id === id
        );


    if (!item) {
        return;
    }


    const title =
        item.title ||
        "إعلان مهم";


    const content =
        item.content ||
        item.description ||
        "";


    const date =
        formatDate(
            item.createdAt
        );


    createModal(
        title,
        `

            ${
                date
                    ? `
                        <div class="modal-date">

                            📅 ${escapeHTML(date)}

                        </div>
                      `
                    : ""
            }


            ${
                content
                    ? `
                        <div class="modal-text">

                            ${escapeHTML(content)}

                        </div>
                      `
                    : `
                        <div class="modal-empty">

                            لا يوجد محتوى لهذا الخبر.

                        </div>
                      `
            }

        `
    );

}


/* =========================================================
   CONTENT ACTIONS
========================================================= */

function setupContentActions() {

    document.addEventListener(
        "click",
        event => {

            const element =
                event.target.closest(
                    "[data-action]"
                );


            if (!element) {
                return;
            }


            const action =
                element.dataset.action;


            const id =
                element.dataset.id;


            if (!id) {
                return;
            }


            switch (action) {

                case "open-lecture":

                    openLecture(id);

                    break;


                case "open-exam":

                    openExam(id);

                    break;


                case "open-sheet":

                    openSheet(id);

                    break;


                case "open-news":

                    openNews(id);

                    break;

            }

        }
    );

}


/* =========================================================
   RETRY
========================================================= */

if (retryBtn) {

    retryBtn.addEventListener(
        "click",
        async () => {

            hideError();

            showLoader();

            await initializePage();

        }
    );

}


/* =========================================================
   INITIALIZE PAGE
========================================================= */

async function initializePage() {

    showLoader();

    hideError();


    try {

        const subjectLoaded =
            await loadSubject();


        if (!subjectLoaded) {
            return;
        }


        await loadSubjectContent();


        hideLoader();

    } catch (error) {

        console.error(
            "PAGE INITIALIZATION ERROR:",
            error
        );


        showError(
            "حدث خطأ غير متوقع أثناء تحميل الصفحة."
        );

    }

}


/* =========================================================
   AUTH
========================================================= */

watchAuth(
    async user => {

        try {

            if (!user) {

                window.location.href =
                    "index.html";

                return;

            }


            currentUser =
                user;


            await loadCurrentUser(
                user
            );


            await initializePage();

        } catch (error) {

            console.error(
                "AUTH PAGE ERROR:",
                error
            );


            showError(
                "تعذر تحميل الصفحة."
            );

        }

    }
);


/* =========================================================
   START
========================================================= */

setupTabs();

setupContentActions();

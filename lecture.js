/* =========================================================
   ENG FORGE
   LECTURE VIEWER
   ========================================================= */


/* =========================================================
   FIREBASE
========================================================= */

import {
    auth,
    db,
    watchAuth
} from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let currentLecture = null;

/*
 * الصورة المفتوحة حاليًا
 */
let activeImageViewer = null;


/*
 * هل تم إنشاء حالة للصورة داخل history؟
 */
let imageHistoryActive = false;


/* =========================================================
   DOM
========================================================= */

const pageLoader =
    document.getElementById("pageLoader");

const errorScreen =
    document.getElementById("errorScreen");

const errorMessage =
    document.getElementById("errorMessage");

const retryButton =
    document.getElementById("retryButton");

const lecturePage =
    document.getElementById("lecturePage");

const lectureTitle =
    document.getElementById("lectureTitle");

const lectureDescription =
    document.getElementById("lectureDescription");

const lectureSubjectName =
    document.getElementById("lectureSubjectName");

const lectureContent =
    document.getElementById("lectureContent");

const lectureBlockCount =
    document.getElementById("lectureBlockCount");

const studentName =
    document.getElementById("studentName");

const studentAvatar =
    document.getElementById("studentAvatar");

const backButton =
    document.getElementById("backButton");

const bottomBackButton =
    document.getElementById("bottomBackButton");


/* =========================================================
   GET LECTURE ID
========================================================= */

function getLectureId() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");
}


/* =========================================================
   SHOW LOADER
========================================================= */

function showLoader() {

    if (pageLoader) {
        pageLoader.hidden = false;
    }

    if (errorScreen) {
        errorScreen.hidden = true;
    }

    if (lecturePage) {
        lecturePage.hidden = true;
    }

}


/* =========================================================
   SHOW ERROR
========================================================= */

function showError(message) {

    if (pageLoader) {
        pageLoader.hidden = true;
    }

    if (lecturePage) {
        lecturePage.hidden = true;
    }

    if (errorMessage) {

        errorMessage.textContent =
            message ||
            "حدث خطأ أثناء تحميل المحاضرة.";

    }

    if (errorScreen) {
        errorScreen.hidden = false;
    }

}


/* =========================================================
   SHOW LECTURE
========================================================= */

function showLecture() {

    if (pageLoader) {
        pageLoader.hidden = true;
    }

    if (errorScreen) {
        errorScreen.hidden = true;
    }

    if (lecturePage) {
        lecturePage.hidden = false;
    }

}


/* =========================================================
   AUTH
========================================================= */

watchAuth(
    async user => {

        if (!user) {

            window.location.href =
                "index.html";

            return;
        }


        currentUser = user;


        await loadStudentProfile();

        await loadLecture();

    }
);


/* =========================================================
   STUDENT PROFILE
========================================================= */

async function loadStudentProfile() {

    if (!currentUser) {
        return;
    }


    try {

        const userRef =
            doc(
                db,
                "users",
                currentUser.uid
            );


        const snapshot =
            await getDoc(
                userRef
            );


        let data = {};


        if (snapshot.exists()) {

            data =
                snapshot.data() || {};

        }


        const name =
            data.name ||
            data.displayName ||
            currentUser.displayName ||
            currentUser.email?.split("@")[0] ||
            "الطالب";


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
            currentUser.photoURL;


        if (studentAvatar) {

            if (photo) {

                studentAvatar.innerHTML = `
                    <img
                        src="${escapeAttribute(photo)}"
                        alt="صورة الطالب"
                    >
                `;

            } else {

                studentAvatar.textContent =
                    "👤";

            }

        }


    } catch (error) {

        console.error(
            "Student profile error:",
            error
        );


        if (studentName) {

            studentName.textContent =
                currentUser.displayName ||
                currentUser.email?.split("@")[0] ||
                "الطالب";

        }

    }

}


/* =========================================================
   LOAD LECTURE
========================================================= */

async function loadLecture() {

    showLoader();


    const lectureId =
        getLectureId();


    if (!lectureId) {

        showError(
            "رابط المحاضرة غير صحيح."
        );

        return;

    }


    try {

        /*
         * قراءة المحاضرة مباشرة من Firestore
         */

        const lectureRef =
            doc(
                db,
                "lectures",
                lectureId
            );


        const snapshot =
            await getDoc(
                lectureRef
            );


        if (!snapshot.exists()) {

            showError(
                "المحاضرة غير موجودة."
            );

            return;

        }


        /*
         * البيانات الحقيقية للمحاضرة
         */

        currentLecture = {

            id:
                snapshot.id,

            ...snapshot.data()

        };


        console.log(
            "Lecture loaded:",
            currentLecture
        );


        await loadSubjectName();


        renderLecture();


        showLecture();


    } catch (error) {

        console.error(
            "Lecture loading error:",
            error
        );


        showError(
            "حدث خطأ أثناء تحميل المحاضرة."
        );

    }

}


/* =========================================================
   LOAD SUBJECT NAME
========================================================= */

async function loadSubjectName() {

    if (
        !currentLecture ||
        !currentLecture.subjectId
    ) {

        if (lectureSubjectName) {

            lectureSubjectName.textContent =
                "المادة";

        }

        return;

    }


    try {

        const subjectId =
            String(
                currentLecture.subjectId
            ).trim();


        const subjectRef =
            doc(
                db,
                "subjects",
                subjectId
            );


        const snapshot =
            await getDoc(
                subjectRef
            );


        if (
            snapshot.exists()
        ) {

            const subject =
                snapshot.data() || {};


            if (lectureSubjectName) {

                lectureSubjectName.textContent =
                    subject.name ||
                    subject.title ||
                    "المادة";

            }

        } else {

            if (lectureSubjectName) {

                lectureSubjectName.textContent =
                    "المادة";

            }

        }


    } catch (error) {

        console.error(
            "Subject loading error:",
            error
        );


        if (lectureSubjectName) {

            lectureSubjectName.textContent =
                "المادة";

        }

    }

}


/* =========================================================
   RENDER LECTURE
========================================================= */

function renderLecture() {

    if (!currentLecture) {
        return;
    }


    /* =====================================================
       TITLE
    ====================================================== */

    const title =
        currentLecture.title ||
        "محاضرة بدون عنوان";


    if (lectureTitle) {

        lectureTitle.textContent =
            title;

    }


    /* =====================================================
       DESCRIPTION
    ====================================================== */

    const description =
        currentLecture.description ||
        "";


    if (lectureDescription) {

        lectureDescription.textContent =
            description;


        lectureDescription.style.display =
            description.trim()
                ? "block"
                : "none";

    }


    /* =====================================================
       BLOCKS
    ====================================================== */

    let blocks =
        currentLecture.blocks;


    /*
     * التأكد أن blocks عبارة عن Array
     */

    if (
        !Array.isArray(blocks)
    ) {

        blocks = [];

    }


    console.log(
        "Lecture blocks:",
        blocks
    );


    if (lectureBlockCount) {

        lectureBlockCount.textContent =
            String(
                blocks.length
            );

    }


    /* =====================================================
       EMPTY
    ====================================================== */

    if (
        blocks.length === 0
    ) {

        if (lectureContent) {

            lectureContent.innerHTML = `
                <div class="lecture-empty">
                    لا يوجد محتوى داخل هذه المحاضرة حتى الآن.
                </div>
            `;

        }

        return;

    }


    /* =====================================================
       RENDER BLOCKS
    ====================================================== */

    if (lectureContent) {

        lectureContent.innerHTML =
            blocks
                .map(
                    (block, index) =>
                        renderBlock(
                            block,
                            index
                        )
                )
                .join("");

    }


    setupImageViewer();

}


/* =========================================================
   RENDER BLOCK
========================================================= */

function renderBlock(
    block,
    index
) {

    if (
        !block ||
        typeof block !== "object"
    ) {

        return "";

    }


    const type =
        String(
            block.type || ""
        )
        .trim()
        .toLowerCase();


    switch (type) {

        case "heading":

            return renderHeading(
                block
            );


        case "paragraph":

            return renderParagraph(
                block
            );


        case "image":

            return renderImage(
                block
            );


        case "video":

            return renderVideo(
                block
            );


        case "note":

            return renderNote(
                block
            );


        case "important":

            return renderImportant(
                block
            );


        case "important_point":

            return renderImportant(
                block
            );


        case "list":

            return renderList(
                block
            );


        case "equation":

            return renderEquation(
                block
            );


        case "formula":

            return renderEquation(
                block
            );


        default:

            console.warn(
                "Unknown lecture block:",
                type,
                block
            );

            return renderUnknownBlock(
                block
            );

    }

}


/* =========================================================
   HEADING
========================================================= */

function renderHeading(
    block
) {

    const level =
        Number(
            block.level
        ) || 2;


    const safeLevel =
        [2, 3, 4].includes(level)
            ? level
            : 2;


    const text =
        escapeHTML(
            block.text || ""
        );


    if (!text.trim()) {
        return "";
    }


    return `
        <h${safeLevel}
            class="lecture-block-heading lecture-heading-${safeLevel}"
        >
            ${text}
        </h${safeLevel}>
    `;

}


/* =========================================================
   PARAGRAPH
========================================================= */

function renderParagraph(
    block
) {

    const text =
        escapeHTML(
            block.text || ""
        );


    if (!text.trim()) {
        return "";
    }


    return `
        <p class="lecture-paragraph">
            ${text}
        </p>
    `;

}


/* =========================================================
   IMAGE
========================================================= */

function renderImage(
    block
) {

    const url =
        String(
            block.url || ""
        ).trim();


    if (!url) {
        return "";
    }


    const caption =
        block.caption ||
        "";


    return `
        <figure class="lecture-image-block">

            <div class="lecture-image-wrapper">

                <img
                    class="lecture-image"
                    src="${escapeAttribute(url)}"
                    alt="${escapeAttribute(
                        caption ||
                        "صورة المحاضرة"
                    )}"
                    loading="lazy"
                    data-image-viewer="true"
                >

            </div>

            ${
                caption
                ? `
                    <figcaption
                        class="lecture-image-caption"
                    >
                        ${escapeHTML(caption)}
                    </figcaption>
                `
                : ""
            }

        </figure>
    `;

}


/* =========================================================
   VIDEO
========================================================= */

function renderVideo(
    block
) {

    const url =
        String(
            block.url || ""
        ).trim();


    if (!url) {
        return "";
    }


    const title =
        block.title ||
        "";


    return `
        <div class="lecture-video-block">

            ${
                title
                ? `
                    <div class="lecture-video-title">
                        ${escapeHTML(title)}
                    </div>
                `
                : ""
            }

            <div class="lecture-video-wrapper">

                <video
                    class="lecture-video"
                    controls
                    preload="metadata"
                    playsinline
                >

                    <source
                        src="${escapeAttribute(url)}"
                    >

                    متصفحك لا يدعم تشغيل الفيديو.

                </video>

            </div>

        </div>
    `;

}


/* =========================================================
   NOTE
========================================================= */

function renderNote(
    block
) {

    const title =
        block.title ||
        "ملاحظة";


    const text =
        block.text ||
        block.content ||
        "";


    if (!text.trim()) {
        return "";
    }


    return `
        <div class="lecture-note">

            <div class="lecture-note-title">
                💡 ${escapeHTML(title)}
            </div>

            <div class="lecture-note-text">
                ${escapeHTML(text)}
            </div>

        </div>
    `;

}


/* =========================================================
   IMPORTANT
========================================================= */

function renderImportant(
    block
) {

    const title =
        block.title ||
        "نقطة مهمة";


    const text =
        block.text ||
        block.content ||
        "";


    if (!text.trim()) {
        return "";
    }


    return `
        <div class="lecture-important">

            <div class="lecture-important-title">
                ⚠ ${escapeHTML(title)}
            </div>

            <div class="lecture-important-text">
                ${escapeHTML(text)}
            </div>

        </div>
    `;

}


/* =========================================================
   LIST
========================================================= */

function renderList(
    block
) {

    const items =
        Array.isArray(
            block.items
        )
        ? block.items
        : [];


    const validItems =
        items.filter(
            item =>
                String(
                    item ?? ""
                ).trim()
        );


    if (
        validItems.length === 0
    ) {

        return "";

    }


    return `
        <div class="lecture-list-block">

            <ul class="lecture-list">

                ${
                    validItems
                        .map(
                            item => `
                                <li>
                                    ${escapeHTML(item)}
                                </li>
                            `
                        )
                        .join("")
                }

            </ul>

        </div>
    `;

}


/* =========================================================
   EQUATION
========================================================= */

function renderEquation(
    block
) {

    const equation =
        block.text ||
        block.formula ||
        block.content ||
        "";


    if (
        !String(
            equation
        ).trim()
    ) {

        return "";

    }


    return `
        <div class="lecture-equation-block">

            <div class="lecture-equation">
                ${escapeHTML(equation)}
            </div>

        </div>
    `;

}


/* =========================================================
   UNKNOWN BLOCK
========================================================= */

function renderUnknownBlock(
    block
) {

    const text =
        block.text ||
        block.content ||
        "";


    if (
        !String(
            text
        ).trim()
    ) {

        return "";

    }


    return `
        <p class="lecture-paragraph">
            ${escapeHTML(text)}
        </p>
    `;

}


/* =========================================================
   IMAGE VIEWER SETUP
========================================================= */

function setupImageViewer() {

    if (!lectureContent) {
        return;
    }


    const images =
        lectureContent.querySelectorAll(
            "[data-image-viewer='true']"
        );


    images.forEach(
        image => {

            image.addEventListener(
                "click",
                () => {

                    openImageViewer(
                        image.src
                    );

                }
            );

        }
    );

}


/* =========================================================
   OPEN IMAGE VIEWER
========================================================= */

function openImageViewer(
    src
) {

    /*
     * منع فتح أكثر من Viewer
     */

    if (activeImageViewer) {
        return;
    }


    const viewer =
        document.createElement(
            "div"
        );


    viewer.className =
        "image-viewer";


    viewer.innerHTML = `

        <button
            type="button"
            class="image-viewer-close"
            aria-label="إغلاق"
        >
            ×
        </button>

        <img
            src="${escapeAttribute(src)}"
            alt="صورة مكبرة"
        >

    `;


    document.body.appendChild(
        viewer
    );


    activeImageViewer =
        viewer;


    /*
     * منع الصفحة الأساسية من التحرك
     * أثناء عرض الصورة
     */

    document.body.style.overflow =
        "hidden";


    /*
     * إنشاء History State
     *
     * هذا هو الجزء المهم جدًا:
     *
     * عند الضغط على زر الرجوع في الهاتف
     * سيتم الرجوع لهذه الحالة أولًا
     * بدل الخروج من صفحة المحاضرة.
     */

    if (!imageHistoryActive) {

        history.pushState(
            {
                imageViewer: true
            },
            "",
            window.location.href
        );


        imageHistoryActive =
            true;

    }


    const closeButton =
        viewer.querySelector(
            ".image-viewer-close"
        );


    function requestCloseViewer() {

        /*
         * لو الـViewer له History State
         * نرجع خطوة للخلف.
         *
         * popstate سيقوم بإغلاق الصورة.
         */

        if (imageHistoryActive) {

            history.back();

            return;

        }


        /*
         * احتياطي
         */

        destroyImageViewer();

    }


    closeButton?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            requestCloseViewer();

        }
    );


    viewer.addEventListener(
        "click",
        event => {

            /*
             * الضغط على الخلفية فقط
             */

            if (
                event.target === viewer
            ) {

                requestCloseViewer();

            }

        }
    );


    /*
     * حفظ الدالة داخل الـViewer
     * لاستخدامها من popstate
     */

    viewer._closeViewer =
        destroyImageViewer;


    /*
     * منع ضغط زر الرجوع أو أي أحداث
     * من الوصول للصفحة خلف الـViewer.
     */

    viewer.addEventListener(
        "touchmove",
        event => {

            /*
             * نسمح بالسحب/التكبير داخل الصورة
             * لكن لا نسمح للصفحة الخلفية بالحركة.
             */

            event.stopPropagation();

        },
        {
            passive: true
        }
    );

}


/* =========================================================
   DESTROY IMAGE VIEWER
========================================================= */

function destroyImageViewer() {

    if (!activeImageViewer) {
        return;
    }


    const viewer =
        activeImageViewer;


    activeImageViewer =
        null;


    /*
     * إعادة Scroll الصفحة
     */

    document.body.style.overflow =
        "";


    /*
     * حذف الـViewer
     */

    viewer.remove();


    /*
     * تم إغلاق حالة الصورة
     */

    imageHistoryActive =
        false;

}


/* =========================================================
   HANDLE PHONE BACK BUTTON
========================================================= */

window.addEventListener(
    "popstate",
    () => {

        /*
         * لو الصورة مفتوحة:
         *
         * زر Back في الهاتف سيصل هنا
         * بدل ما يخرج من الصفحة.
         */

        if (activeImageViewer) {

            destroyImageViewer();

        }

    }
);


/* =========================================================
   KEYBOARD ESCAPE
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            activeImageViewer
        ) {

            /*
             * استخدام history.back()
             * حتى تظل حالة الـHistory صحيحة.
             */

            if (imageHistoryActive) {

                history.back();

            } else {

                destroyImageViewer();

            }

        }

    }
);


/* =========================================================
   BACK TO SUBJECT
========================================================= */

function goBackToSubject() {

    /*
     * لو الصورة مفتوحة، اقفلها أولًا
     * بدل الانتقال للمادة.
     */

    if (activeImageViewer) {

        if (imageHistoryActive) {

            history.back();

        } else {

            destroyImageViewer();

        }

        return;

    }


    const subjectId =
        currentLecture?.subjectId;


    if (subjectId) {

        window.location.href =
            `subject.html?id=${encodeURIComponent(
                subjectId
            )}`;

        return;

    }


    window.location.href =
        "index.html";

}


/* =========================================================
   BUTTON EVENTS
========================================================= */

if (backButton) {

    backButton.addEventListener(
        "click",
        goBackToSubject
    );

}


if (bottomBackButton) {

    bottomBackButton.addEventListener(
        "click",
        goBackToSubject
    );

}


/* =========================================================
   RETRY
========================================================= */

if (retryButton) {

    retryButton.addEventListener(
        "click",
        () => {

            loadLecture();

        }
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );

}


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   END OF FILE
========================================================= */
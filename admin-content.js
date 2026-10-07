/* =========================================================
   ENG FORGE
   ADMIN CONTENT
   =========================================================
   
   مسؤول عن:
   - المواد الدراسية
   - المحاضرات
   - الشيت والأخبار
   - Lecture Builder
   - Cloudinary Uploads

   لا يحتوي على:
   - نظام الامتحانات
   - نظام النتائج
   - تسجيل الدخول

========================================================= */


/* =========================================================
   FIREBASE
========================================================= */

import {
    auth,
    db,
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    checkAdmin
} from "./firebase.js";


/* =========================================================
   CLOUDINARY
========================================================= */

const CLOUDINARY_CLOUD_NAME =
    "iir6bqt7";

const CLOUDINARY_UPLOAD_PRESET =
    "buying_upload";

const CLOUDINARY_UPLOAD_URL =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;


/* =========================================================
   STATE
========================================================= */

let subjects = [];

let lectures = [];

let sheets = [];

let lectureBlocks = [];

let editingLectureId = null;

let editingSubjectId = null;

let editingSheetId = null;


/* =========================================================
   DOM
========================================================= */

const subjectsList =
    document.getElementById("subjectsList");

const lecturesList =
    document.getElementById("lecturesList");

const sheetsList =
    document.getElementById("sheetsList");

const addSubjectBtn =
    document.getElementById("addSubjectBtn");

const addLectureBtn =
    document.getElementById("addLectureBtn");

const addSheetBtn =
    document.getElementById("addSheetBtn");


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeContent
);


async function initializeContent() {

    try {

        addSubjectBtn?.addEventListener(
            "click",
            () => openSubjectModal()
        );


        addLectureBtn?.addEventListener(
            "click",
            () => openLectureModal()
        );


        addSheetBtn?.addEventListener(
            "click",
            () => openSheetModal()
        );


        document.addEventListener(
            "adminSectionChanged",
            handleSectionChange
        );


        await loadSubjects();

        await loadLectures();

        await loadSheets();

    } catch (error) {

        console.error(
            "Admin content initialization error:",
            error
        );

    }

}


/* =========================================================
   SECTION CHANGE
========================================================= */

function handleSectionChange(event) {

    const section =
        event.detail?.section;


    if (section === "subjects") {

        loadSubjects();

    }


    if (section === "lectures") {

        loadSubjects();

        loadLectures();

    }


    if (section === "sheets") {

        loadSheets();

    }

}


/* =========================================================
   ADMIN CHECK
========================================================= */

async function ensureAdmin() {

    if (!auth.currentUser) {

        throw new Error(
            "المستخدم غير مسجل الدخول."
        );

    }


    const allowed =
        await checkAdmin(
            auth.currentUser.uid
        );


    if (!allowed) {

        throw new Error(
            "ليس لديك صلاحية."
        );

    }


    return true;

}


/* =========================================================
   UTILS
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function notify(
    message,
    type = "info"
) {

    if (
        window.ENGForgeAdmin &&
        typeof window.ENGForgeAdmin.showNotification ===
        "function"
    ) {

        window.ENGForgeAdmin.showNotification(
            message,
            type
        );

        return;

    }

    alert(message);

}


function closeModal() {

    if (
        window.ENGForgeAdmin &&
        typeof window.ENGForgeAdmin.closeModal ===
        "function"
    ) {

        window.ENGForgeAdmin.closeModal();

    }

}


function openModal(options) {

    if (
        window.ENGForgeAdmin &&
        typeof window.ENGForgeAdmin.openModal ===
        "function"
    ) {

        return window.ENGForgeAdmin.openModal(
            options
        );

    }

    return null;

}


/* =========================================================
   FIRESTORE HELPERS
========================================================= */

async function fetchCollection(
    collectionName
) {

    const reference =
        collection(
            db,
            collectionName
        );


    let snapshot;


    try {

        snapshot =
            await getDocs(
                query(
                    reference,
                    orderBy(
                        "createdAt",
                        "desc"
                    )
                )
            );

    } catch {

        snapshot =
            await getDocs(
                reference
            );

    }


    return snapshot.docs.map(
        item => ({
            id: item.id,
            ...item.data()
        })
    );

}


/* =========================================================
   SUBJECTS
========================================================= */

async function loadSubjects() {

    try {

        subjects =
            await fetchCollection(
                "subjects"
            );


        renderSubjects(
            subjects
        );


        updateSubjectCounters();

    } catch (error) {

        console.error(
            "Load subjects error:",
            error
        );

        notify(
            "تعذر تحميل المواد.",
            "error"
        );

    }

}


/* =========================================================
   RENDER SUBJECTS
========================================================= */

function renderSubjects(
    list
) {

    if (!subjectsList) {
        return;
    }


    subjectsList.innerHTML =
        "";


    if (
        !Array.isArray(list) ||
        list.length === 0
    ) {

        subjectsList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📚
                </div>

                <h3>
                    لا توجد مواد
                </h3>

                <p>
                    أضف أول مادة دراسية.
                </p>

            </div>
        `;

        return;

    }


    list.forEach(
        subject => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "content-item";


            const title =
                escapeHTML(
                    subject.name ||
                    subject.title ||
                    "مادة بدون اسم"
                );


            const description =
                escapeHTML(
                    subject.description ||
                    ""
                );


            card.innerHTML = `

                <div class="content-item-main">

                    <div class="content-item-icon">
                        📚
                    </div>

                    <div class="content-item-info">

                        <strong>
                            ${title}
                        </strong>

                        ${
                            description
                            ? `
                                <span>
                                    ${description}
                                </span>
                            `
                            : ""
                        }

                    </div>

                </div>


                <div class="content-item-actions">

                    <button
                        type="button"
                        class="secondary-btn edit-subject-btn"
                    >
                        تعديل
                    </button>

                    <button
                        type="button"
                        class="danger-btn delete-subject-btn"
                    >
                        حذف
                    </button>

                </div>

            `;


            card
                .querySelector(
                    ".edit-subject-btn"
                )
                .addEventListener(
                    "click",
                    () => openSubjectModal(
                        subject
                    )
                );


            card
                .querySelector(
                    ".delete-subject-btn"
                )
                .addEventListener(
                    "click",
                    () => deleteSubject(
                        subject
                    )
                );


            subjectsList.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   SUBJECT MODAL
========================================================= */

function openSubjectModal(
    subject = null
) {

    editingSubjectId =
        subject?.id ||
        null;


    const isEditing =
        Boolean(editingSubjectId);


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.innerHTML = `

        <div class="form-group">

            <label>
                اسم المادة
            </label>

            <input
                type="text"
                id="subjectTitleInput"
                placeholder="مثال: الرياضيات"
                value="${escapeHTML(
                    subject?.name ||
                    subject?.title ||
                    ""
                )}"
            >

        </div>


        <div class="form-group">

            <label>
                وصف المادة
            </label>

            <textarea
                id="subjectDescriptionInput"
                rows="4"
                placeholder="اكتب وصفًا مختصرًا للمادة..."
            >${escapeHTML(
                subject?.description ||
                ""
            )}</textarea>

        </div>


        <div class="form-actions">

            <button
                type="button"
                class="cancel-btn"
                id="cancelSubjectBtn"
            >
                إلغاء
            </button>

            <button
                type="button"
                class="primary-btn"
                id="saveSubjectBtn"
            >
                ${
                    isEditing
                    ? "حفظ التعديلات"
                    : "إضافة المادة"
                }
            </button>

        </div>

    `;


    const modal =
        openModal({

            title:
                isEditing
                ? "تعديل المادة"
                : "إضافة مادة جديدة",

            content:
                wrapper,

            size:
                "small"

        });


    if (!modal) {
        return;
    }


    wrapper
        .querySelector(
            "#cancelSubjectBtn"
        )
        .addEventListener(
            "click",
            closeModal
        );


    wrapper
        .querySelector(
            "#saveSubjectBtn"
        )
        .addEventListener(
            "click",
            saveSubject
        );

}


/* =========================================================
   SAVE SUBJECT
========================================================= */

async function saveSubject() {

    try {

        await ensureAdmin();


        const titleInput =
            document.getElementById(
                "subjectTitleInput"
            );


        const descriptionInput =
            document.getElementById(
                "subjectDescriptionInput"
            );


        const title =
            titleInput?.value.trim();


        const description =
            descriptionInput?.value.trim() ||
            "";


        if (!title) {

            notify(
                "اكتب اسم المادة أولًا.",
                "warning"
            );

            return;

        }


        const data = {

            name: title,

            title: title,

            description: description,

            updatedAt:
                serverTimestamp()

        };


        if (editingSubjectId) {

            await updateDoc(
                doc(
                    db,
                    "subjects",
                    editingSubjectId
                ),
                data
            );


            notify(
                "تم تعديل المادة بنجاح.",
                "success"
            );

        } else {

            await addDoc(
                collection(
                    db,
                    "subjects"
                ),
                {
                    ...data,
                    createdBy:
                        auth.currentUser.uid,
                    createdAt:
                        serverTimestamp()
                }
            );


            notify(
                "تمت إضافة المادة بنجاح.",
                "success"
            );

        }


        editingSubjectId =
            null;


        closeModal();


        await loadSubjects();

        await refreshSubjectSelects();

    } catch (error) {

        console.error(
            "Save subject error:",
            error
        );

        notify(
            "تعذر حفظ المادة.",
            "error"
        );

    }

}


/* =========================================================
   DELETE SUBJECT
========================================================= */

async function deleteSubject(
    subject
) {

    if (!subject?.id) {
        return;
    }


    const title =
        subject.name ||
        subject.title ||
        "هذه المادة";


    const confirmed =
        window.confirm(
            `هل أنت متأكد من حذف "${title}"؟`
        );


    if (!confirmed) {
        return;
    }


    try {

        await ensureAdmin();


        await deleteDoc(
            doc(
                db,
                "subjects",
                subject.id
            )
        );


        notify(
            "تم حذف المادة.",
            "success"
        );


        await loadSubjects();

    } catch (error) {

        console.error(
            "Delete subject error:",
            error
        );

        notify(
            "تعذر حذف المادة.",
            "error"
        );

    }

}


/* =========================================================
   SUBJECT COUNTER
========================================================= */

function updateSubjectCounters() {

    const counter =
        document.getElementById(
            "subjectsCount"
        );


    if (counter) {

        counter.textContent =
            String(
                subjects.length
            );

    }

}


/* =========================================================
   LECTURES
========================================================= */

async function loadLectures() {

    try {

        lectures =
            await fetchCollection(
                "lectures"
            );


        renderLectures(
            lectures
        );


        const counter =
            document.getElementById(
                "lecturesCount"
            );


        if (counter) {

            counter.textContent =
                String(
                    lectures.length
                );

        }

    } catch (error) {

        console.error(
            "Load lectures error:",
            error
        );

        notify(
            "تعذر تحميل المحاضرات.",
            "error"
        );

    }

}


/* =========================================================
   RENDER LECTURES
========================================================= */

function renderLectures(
    list
) {

    if (!lecturesList) {
        return;
    }


    lecturesList.innerHTML =
        "";


    if (
        !Array.isArray(list) ||
        list.length === 0
    ) {

        lecturesList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📖
                </div>

                <h3>
                    لا توجد محاضرات
                </h3>

                <p>
                    أنشئ أول محاضرة تعليمية.
                </p>

            </div>
        `;

        return;

    }


    list.forEach(
        lecture => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "content-item";


            const subject =
                subjects.find(
                    item =>
                        item.id ===
                        lecture.subjectId
                );


            const subjectName =
                subject?.name ||
                subject?.title ||
                "مادة غير محددة";


            const blockCount =
                Array.isArray(
                    lecture.blocks
                )
                ? lecture.blocks.length
                : 0;


            card.innerHTML = `

                <div class="content-item-main">

                    <div class="content-item-icon">
                        📖
                    </div>

                    <div class="content-item-info">

                        <strong>
                            ${escapeHTML(
                                lecture.title ||
                                "محاضرة بدون عنوان"
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                subjectName
                            )}
                        </span>

                        <small>
                            ${blockCount}
                            عنصر داخل المحاضرة
                        </small>

                    </div>

                </div>


                <div class="content-item-actions">

                    <button
                        type="button"
                        class="secondary-btn edit-lecture-btn"
                    >
                        تعديل
                    </button>

                    <button
                        type="button"
                        class="danger-btn delete-lecture-btn"
                    >
                        حذف
                    </button>

                </div>

            `;


            card
                .querySelector(
                    ".edit-lecture-btn"
                )
                .addEventListener(
                    "click",
                    () => openLectureModal(
                        lecture
                    )
                );


            card
                .querySelector(
                    ".delete-lecture-btn"
                )
                .addEventListener(
                    "click",
                    () => deleteLecture(
                        lecture
                    )
                );


            lecturesList.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   LECTURE MODAL
========================================================= */

function openLectureModal(
    lecture = null
) {

    editingLectureId =
        lecture?.id ||
        null;


    lectureBlocks =
        lecture
        ? normalizeLectureBlocks(
            lecture.blocks
        )
        : [];


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.innerHTML = `

        <div class="form-group">

            <label>
                عنوان المحاضرة
            </label>

            <input
                type="text"
                id="lectureTitleInput"
                placeholder="مثال: مقدمة في الدوائر الكهربائية"
                value="${escapeHTML(
                    lecture?.title ||
                    ""
                )}"
            >

        </div>


        <div class="form-group">

            <label>
                المادة
            </label>

            <select
                id="lectureSubjectInput"
            ></select>

        </div>


        <div class="form-group">

            <label>
                وصف المحاضرة
            </label>

            <textarea
                id="lectureDescriptionInput"
                rows="3"
                placeholder="وصف مختصر للمحاضرة..."
            >${escapeHTML(
                lecture?.description ||
                ""
            )}</textarea>

        </div>


        <div class="lecture-builder">

            <div class="builder-heading">

                <div>

                    <h3>
                        محتوى المحاضرة
                    </h3>

                    <p>
                        أضف العناصر بالترتيب الذي تريد أن تظهر به للطالب.
                    </p>

                </div>

            </div>


            <div
                id="lectureBlocksContainer"
                class="lecture-blocks-container"
            ></div>


            <div class="lecture-add-block">

                <button
                    type="button"
                    class="secondary-btn"
                    data-add-block="heading"
                >
                    + عنوان
                </button>

                <button
                    type="button"
                    class="secondary-btn"
                    data-add-block="paragraph"
                >
                    + فقرة
                </button>

                <button
                    type="button"
                    class="secondary-btn"
                    data-add-block="image"
                >
                    + صورة
                </button>

                <button
                    type="button"
                    class="secondary-btn"
                    data-add-block="video"
                >
                    + فيديو
                </button>

                <button
                    type="button"
                    class="secondary-btn"
                    data-add-block="note"
                >
                    + ملاحظة
                </button>

                <button
                    type="button"
                    class="secondary-btn"
                    data-add-block="important"
                >
                    + نقطة مهمة
                </button>

                <button
                    type="button"
                    class="secondary-btn"
                    data-add-block="list"
                >
                    + قائمة
                </button>

                <button
                    type="button"
                    class="secondary-btn"
                    data-add-block="equation"
                >
                    + معادلة
                </button>

            </div>

        </div>


        <div class="form-actions">

            <button
                type="button"
                class="cancel-btn"
                id="cancelLectureBtn"
            >
                إلغاء
            </button>

            <button
                type="button"
                class="primary-btn"
                id="saveLectureBtn"
            >
                ${
                    lecture
                    ? "حفظ التعديلات"
                    : "إنشاء المحاضرة"
                }
            </button>

        </div>

    `;


    const modal =
        openModal({

            title:
                lecture
                ? "تعديل المحاضرة"
                : "إنشاء محاضرة جديدة",

            content:
                wrapper,

            size:
                "large"

        });


    if (!modal) {
        return;
    }


    const subjectSelect =
        wrapper.querySelector(
            "#lectureSubjectInput"
        );


    fillSubjectSelect(
        subjectSelect,
        lecture?.subjectId
    );


    wrapper
        .querySelectorAll(
            "[data-add-block]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        addLectureBlock(
                            button.dataset.addBlock
                        );

                    }
                );

            }
        );


    wrapper
        .querySelector(
            "#cancelLectureBtn"
        )
        .addEventListener(
            "click",
            closeLectureModal
        );


    wrapper
        .querySelector(
            "#saveLectureBtn"
        )
        .addEventListener(
            "click",
            saveLecture
        );


    renderLectureBlocks();

}


/* =========================================================
   NORMALIZE BLOCKS
========================================================= */

function normalizeLectureBlocks(
    blocks
) {

    if (
        !Array.isArray(blocks)
    ) {

        return [];

    }


    return blocks.map(
        block => {

            if (
                !block ||
                typeof block !== "object"
            ) {

                return {
                    type:
                        "paragraph",
                    text:
                        ""
                };

            }


            return {
                ...block
            };

        }
    );

}


/* =========================================================
   ADD LECTURE BLOCK
========================================================= */

function addLectureBlock(
    type
) {

    let block;


    switch (type) {

        case "heading":

            block = {
                type:
                    "heading",
                text:
                    "",
                level:
                    2
            };

            break;


        case "paragraph":

            block = {
                type:
                    "paragraph",
                text:
                    ""
            };

            break;


        case "image":

            block = {
                type:
                    "image",
                url:
                    "",
                caption:
                    ""
            };

            break;


        case "video":

            block = {
                type:
                    "video",
                url:
                    "",
                title:
                    ""
            };

            break;


        case "note":

            block = {
                type:
                    "note",
                title:
                    "ملاحظة",
                text:
                    ""
            };

            break;


        case "important":

            block = {
                type:
                    "important",
                title:
                    "نقطة مهمة",
                text:
                    ""
            };

            break;


        case "list":

            block = {
                type:
                    "list",
                items:
                    [
                        ""
                    ]
            };

            break;


        case "equation":

            block = {
                type:
                    "equation",
                text:
                    ""
            };

            break;


        default:

            return;

    }


    lectureBlocks.push(
        block
    );


    renderLectureBlocks();


    setTimeout(
        () => {

            const container =
                document.getElementById(
                    "lectureBlocksContainer"
                );


            if (container) {

                container.lastElementChild
                    ?.scrollIntoView({
                        behavior:
                            "smooth",
                        block:
                            "center"
                    });

            }

        },
        50
    );

}


/* =========================================================
   RENDER LECTURE BLOCKS
========================================================= */

function renderLectureBlocks() {

    const container =
        document.getElementById(
            "lectureBlocksContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        lectureBlocks.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-builder">

                <div>
                    📖
                </div>

                <strong>
                    المحاضرة فارغة
                </strong>

                <span>
                    ابدأ بإضافة عنوان أو فقرة أو صورة أو أي عنصر من الأعلى.
                </span>

            </div>
        `;

        return;

    }


    lectureBlocks.forEach(
        (block, index) => {

            const element =
                createLectureBlockEditor(
                    block,
                    index
                );


            container.appendChild(
                element
            );

        }
    );

}


/* =========================================================
   CREATE BLOCK EDITOR
========================================================= */

function createLectureBlockEditor(
    block,
    index
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "lecture-block-editor";


    wrapper.dataset.index =
        String(index);


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "lecture-block-header";


    const number =
        document.createElement(
            "span"
        );


    number.className =
        "lecture-block-number";


    number.textContent =
        `#${index + 1}`;


    const typeName =
        document.createElement(
            "strong"
        );


    typeName.textContent =
        getBlockTypeName(
            block.type
        );


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "lecture-block-actions";


    const up =
        createSmallButton(
            "↑",
            "أعلى",
            index === 0
        );


    const down =
        createSmallButton(
            "↓",
            "أسفل",
            index ===
            lectureBlocks.length - 1
        );


    const remove =
        createSmallButton(
            "حذف",
            "حذف",
            false
        );


    actions.appendChild(
        up
    );

    actions.appendChild(
        down
    );

    actions.appendChild(
        remove
    );


    header.appendChild(
        number
    );

    header.appendChild(
        typeName
    );

    header.appendChild(
        actions
    );


    wrapper.appendChild(
        header
    );


    const body =
        document.createElement(
            "div"
        );


    body.className =
        "lecture-block-body";


    buildBlockEditor(
        body,
        block,
        index
    );


    wrapper.appendChild(
        body
    );


    up.addEventListener(
        "click",
        () => moveBlock(
            index,
            -1
        )
    );


    down.addEventListener(
        "click",
        () => moveBlock(
            index,
            1
        )
    );


    remove.addEventListener(
        "click",
        () => removeBlock(
            index
        )
    );


    return wrapper;

}


/* =========================================================
   SMALL BUTTON
========================================================= */

function createSmallButton(
    text,
    title,
    disabled
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "block-action-btn";


    button.textContent =
        text;


    button.title =
        title;


    button.disabled =
        disabled;


    return button;

}


/* =========================================================
   BLOCK TYPE NAME
========================================================= */

function getBlockTypeName(
    type
) {

    const names = {

        heading:
            "عنوان",

        paragraph:
            "فقرة",

        image:
            "صورة",

        video:
            "فيديو",

        note:
            "ملاحظة",

        important:
            "نقطة مهمة",

        list:
            "قائمة",

        equation:
            "معادلة"

    };


    return (
        names[type] ||
        "عنصر"
    );

}


/* =========================================================
   BUILD BLOCK EDITOR
========================================================= */

function buildBlockEditor(
    body,
    block,
    index
) {

    switch (block.type) {


        /* =============================================
           HEADING
        ============================================= */

        case "heading": {

            body.innerHTML = `

                <div class="form-group">

                    <label>
                        مستوى العنوان
                    </label>

                    <select
                        data-field="level"
                    >

                        <option value="2">
                            عنوان رئيسي
                        </option>

                        <option value="3">
                            عنوان فرعي
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        نص العنوان
                    </label>

                    <input
                        type="text"
                        data-field="text"
                        placeholder="اكتب عنوان القسم..."
                    >

                </div>

            `;


            body
                .querySelector(
                    '[data-field="level"]'
                )
                .value =
                    String(
                        block.level || 2
                    );


            body
                .querySelector(
                    '[data-field="text"]'
                )
                .value =
                    block.text || "";


            bindBlockInputs(
                body,
                block
            );

            break;

        }


        /* =============================================
           PARAGRAPH
        ============================================= */

        case "paragraph": {

            body.innerHTML = `

                <div class="form-group">

                    <label>
                        نص الفقرة
                    </label>

                    <textarea
                        rows="6"
                        data-field="text"
                        placeholder="اكتب محتوى الفقرة..."
                    ></textarea>

                </div>

            `;


            body
                .querySelector(
                    '[data-field="text"]'
                )
                .value =
                    block.text || "";


            bindBlockInputs(
                body,
                block
            );

            break;

        }


        /* =============================================
           IMAGE
        ============================================= */

        case "image": {

            body.innerHTML = `

                <div class="form-group">

                    <label>
                        صورة المحاضرة
                    </label>

                    <input
                        type="file"
                        accept="image/*"
                        data-file="image"
                    >

                </div>


                <div class="form-group">

                    <label>
                        رابط الصورة
                    </label>

                    <input
                        type="url"
                        data-field="url"
                        placeholder="سيتم وضع الرابط تلقائيًا بعد الرفع..."
                    >

                </div>


                <div class="form-group">

                    <label>
                        وصف / عنوان الشكل
                    </label>

                    <input
                        type="text"
                        data-field="caption"
                        placeholder="مثال: الشكل (أ) دائرة كهربية..."
                    >

                </div>


                <div
                    class="block-upload-status"
                    data-upload-status
                ></div>


                <div
                    class="block-image-preview"
                    data-preview
                ></div>

            `;


            const urlInput =
                body.querySelector(
                    '[data-field="url"]'
                );


            const captionInput =
                body.querySelector(
                    '[data-field="caption"]'
                );


            urlInput.value =
                block.url || "";


            captionInput.value =
                block.caption || "";


            if (block.url) {

                showImagePreview(
                    body,
                    block.url
                );

            }


            body
                .querySelector(
                    '[data-file="image"]'
                )
                .addEventListener(
                    "change",
                    async (event) => {

                        const file =
                            event.target.files?.[0];


                        if (!file) {
                            return;
                        }


                        await uploadBlockFile(
                            file,
                            block,
                            body,
                            "image"
                        );

                    }
                );


            bindBlockInputs(
                body,
                block
            );

            break;

        }


        /* =============================================
           VIDEO
        ============================================= */

        case "video": {

            body.innerHTML = `

                <div class="form-group">

                    <label>
                        فيديو المحاضرة
                    </label>

                    <input
                        type="file"
                        accept="video/*"
                        data-file="video"
                    >

                </div>


                <div class="form-group">

                    <label>
                        رابط الفيديو
                    </label>

                    <input
                        type="url"
                        data-field="url"
                        placeholder="رابط الفيديو أو رابط Cloudinary..."
                    >

                </div>


                <div class="form-group">

                    <label>
                        عنوان الفيديو
                    </label>

                    <input
                        type="text"
                        data-field="title"
                        placeholder="مثال: شرح عملي"
                    >

                </div>


                <div
                    class="block-upload-status"
                    data-upload-status
                ></div>


                <div
                    class="block-video-preview"
                    data-preview
                ></div>

            `;


            const urlInput =
                body.querySelector(
                    '[data-field="url"]'
                );


            const titleInput =
                body.querySelector(
                    '[data-field="title"]'
                );


            urlInput.value =
                block.url || "";


            titleInput.value =
                block.title || "";


            if (block.url) {

                showVideoPreview(
                    body,
                    block.url
                );

            }


            body
                .querySelector(
                    '[data-file="video"]'
                )
                .addEventListener(
                    "change",
                    async (event) => {

                        const file =
                            event.target.files?.[0];


                        if (!file) {
                            return;
                        }


                        await uploadBlockFile(
                            file,
                            block,
                            body,
                            "video"
                        );

                    }
                );


            bindBlockInputs(
                body,
                block
            );

            break;

        }


        /* =============================================
           NOTE
        ============================================= */

        case "note": {

            body.innerHTML = `

                <div class="form-group">

                    <label>
                        عنوان الملاحظة
                    </label>

                    <input
                        type="text"
                        data-field="title"
                        value="${escapeHTML(
                            block.title ||
                            "ملاحظة"
                        )}"
                    >

                </div>


                <div class="form-group">

                    <label>
                        نص الملاحظة
                    </label>

                    <textarea
                        rows="5"
                        data-field="text"
                        placeholder="اكتب الملاحظة..."
                    ></textarea>

                </div>

            `;


            body
                .querySelector(
                    '[data-field="text"]'
                )
                .value =
                    block.text || "";


            bindBlockInputs(
                body,
                block
            );

            break;

        }


        /* =============================================
           IMPORTANT
        ============================================= */

        case "important": {

            body.innerHTML = `

                <div class="form-group">

                    <label>
                        عنوان النقطة
                    </label>

                    <input
                        type="text"
                        data-field="title"
                        value="${escapeHTML(
                            block.title ||
                            "نقطة مهمة"
                        )}"
                    >

                </div>


                <div class="form-group">

                    <label>
                        النص
                    </label>

                    <textarea
                        rows="5"
                        data-field="text"
                        placeholder="اكتب النقطة المهمة..."
                    ></textarea>

                </div>

            `;


            body
                .querySelector(
                    '[data-field="text"]'
                )
                .value =
                    block.text || "";


            bindBlockInputs(
                body,
                block
            );

            break;

        }


        /* =============================================
           LIST
        ============================================= */

        case "list": {

            body.innerHTML = `

                <div class="form-group">

                    <label>
                        عناصر القائمة
                    </label>

                    <div
                        class="list-items-editor"
                        data-list-editor
                    ></div>


                    <button
                        type="button"
                        class="secondary-btn"
                        data-add-list-item
                    >
                        + إضافة عنصر
                    </button>

                </div>

            `;


            const listEditor =
                body.querySelector(
                    "[data-list-editor]"
                );


            const items =
                Array.isArray(
                    block.items
                ) &&
                block.items.length
                    ? block.items
                    : [""];


            items.forEach(
                item => {

                    addListItemInput(
                        listEditor,
                        block,
                        item
                    );

                }
            );


            body
                .querySelector(
                    "[data-add-list-item]"
                )
                .addEventListener(
                    "click",
                    () => {

                        addListItemInput(
                            listEditor,
                            block,
                            ""
                        );

                    }
                );

            break;

        }


        /* =============================================
           EQUATION
        ============================================= */

        case "equation": {

            body.innerHTML = `

                <div class="form-group">

                    <label>
                        المعادلة / القانون
                    </label>

                    <textarea
                        rows="3"
                        data-field="text"
                        placeholder="مثال: V = I × R"
                    ></textarea>

                </div>

                <small>
                    اكتب المعادلة كما تريد ظهورها للطالب.
                </small>

            `;


            body
                .querySelector(
                    '[data-field="text"]'
                )
                .value =
                    block.text || "";


            bindBlockInputs(
                body,
                block
            );

            break;

        }

    }

}


/* =========================================================
   BIND BLOCK INPUTS
========================================================= */

function bindBlockInputs(
    body,
    block
) {

    body
        .querySelectorAll(
            "[data-field]"
        )
        .forEach(
            input => {

                input.addEventListener(
                    "input",
                    () => {

                        const field =
                            input.dataset.field;


                        block[field] =
                            input.value;

                    }
                );


                input.addEventListener(
                    "change",
                    () => {

                        const field =
                            input.dataset.field;


                        block[field] =
                            input.value;

                    }
                );

            }
        );

}


/* =========================================================
   LIST ITEM
========================================================= */

function addListItemInput(
    container,
    block,
    value
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "list-item-editor";


    const input =
        document.createElement(
            "input"
        );


    input.type =
        "text";


    input.placeholder =
        "عنصر في القائمة";


    input.value =
        value || "";


    const remove =
        document.createElement(
            "button"
        );


    remove.type =
        "button";


    remove.className =
        "block-action-btn";


    remove.textContent =
        "×";


    const sync =
        () => {

            const inputs =
                container.querySelectorAll(
                    "input"
                );


            block.items =
                Array.from(
                    inputs
                ).map(
                    element =>
                        element.value
                );

        };


    input.addEventListener(
        "input",
        sync
    );


    remove.addEventListener(
        "click",
        () => {

            row.remove();

            sync();

        }
    );


    row.appendChild(
        input
    );

    row.appendChild(
        remove
    );


    container.appendChild(
        row
    );


    sync();

}


/* =========================================================
   MOVE BLOCK
========================================================= */

function moveBlock(
    index,
    direction
) {

    const newIndex =
        index + direction;


    if (
        newIndex < 0 ||
        newIndex >=
        lectureBlocks.length
    ) {

        return;

    }


    const temporary =
        lectureBlocks[index];


    lectureBlocks[index] =
        lectureBlocks[newIndex];


    lectureBlocks[newIndex] =
        temporary;


    renderLectureBlocks();

}


/* =========================================================
   REMOVE BLOCK
========================================================= */

function removeBlock(
    index
) {

    if (
        index < 0 ||
        index >=
        lectureBlocks.length
    ) {

        return;

    }


    const confirmed =
        window.confirm(
            "هل تريد حذف هذا العنصر من المحاضرة؟"
        );


    if (!confirmed) {
        return;
    }


    lectureBlocks.splice(
        index,
        1
    );


    renderLectureBlocks();

}


/* =========================================================
   IMAGE PREVIEW
========================================================= */

function showImagePreview(
    body,
    url
) {

    const preview =
        body.querySelector(
            "[data-preview]"
        );


    if (!preview) {
        return;
    }


    preview.innerHTML = `

        <img
            src="${escapeHTML(url)}"
            alt="صورة المحاضرة"
            loading="lazy"
        >

    `;

}


/* =========================================================
   VIDEO PREVIEW
========================================================= */

function showVideoPreview(
    body,
    url
) {

    const preview =
        body.querySelector(
            "[data-preview]"
        );


    if (!preview) {
        return;
    }


    preview.innerHTML = `

        <video
            src="${escapeHTML(url)}"
            controls
            preload="metadata"
        ></video>

    `;

}


/* =========================================================
   CLOUDINARY UPLOAD
========================================================= */

async function uploadToCloudinary(
    file,
    onProgress
) {

    if (!file) {

        throw new Error(
            "لم يتم اختيار ملف."
        );

    }


    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );


    return new Promise(
        (resolve, reject) => {

            const xhr =
                new XMLHttpRequest();


            xhr.open(
                "POST",
                CLOUDINARY_UPLOAD_URL
            );


            xhr.upload.addEventListener(
                "progress",
                event => {

                    if (
                        event.lengthComputable &&
                        typeof onProgress ===
                        "function"
                    ) {

                        const percent =
                            Math.round(
                                (
                                    event.loaded /
                                    event.total
                                ) * 100
                            );


                        onProgress(
                            percent
                        );

                    }

                }
            );


            xhr.addEventListener(
                "load",
                () => {

                    if (
                        xhr.status >= 200 &&
                        xhr.status < 300
                    ) {

                        try {

                            const result =
                                JSON.parse(
                                    xhr.responseText
                                );


                            if (
                                !result.secure_url
                            ) {

                                reject(
                                    new Error(
                                        "Cloudinary لم يرجع رابط الملف."
                                    )
                                );

                                return;

                            }


                            resolve(
                                result
                            );

                        } catch {

                            reject(
                                new Error(
                                    "تعذر قراءة استجابة Cloudinary."
                                )
                            );

                        }

                    } else {

                        reject(
                            new Error(
                                `Cloudinary upload failed: ${xhr.status}`
                            )
                        );

                    }

                }
            );


            xhr.addEventListener(
                "error",
                () => {

                    reject(
                        new Error(
                            "فشل الاتصال بـ Cloudinary."
                        )
                    );

                }
            );


            xhr.addEventListener(
                "abort",
                () => {

                    reject(
                        new Error(
                            "تم إلغاء الرفع."
                        )
                    );

                }
            );


            xhr.send(
                formData
            );

        }
    );

}


/* =========================================================
   UPLOAD BLOCK FILE
========================================================= */

async function uploadBlockFile(
    file,
    block,
    body,
    type
) {

    const status =
        body.querySelector(
            "[data-upload-status]"
        );


    try {

        if (status) {

            status.textContent =
                "جاري رفع الملف... 0%";

        }


        const result =
            await uploadToCloudinary(
                file,
                percent => {

                    if (status) {

                        status.textContent =
                            `جاري رفع الملف... ${percent}%`;

                    }

                }
            );


        block.url =
            result.secure_url;


        if (type === "image") {

            showImagePreview(
                body,
                result.secure_url
            );

        }


        if (type === "video") {

            showVideoPreview(
                body,
                result.secure_url
            );

        }


        const urlInput =
            body.querySelector(
                '[data-field="url"]'
            );


        if (urlInput) {

            urlInput.value =
                result.secure_url;

        }


        if (status) {

            status.textContent =
                "✓ تم رفع الملف بنجاح.";

        }


        notify(
            "تم رفع الملف بنجاح.",
            "success"
        );


    } catch (error) {

        console.error(
            "Cloudinary upload error:",
            error
        );


        if (status) {

            status.textContent =
                "تعذر رفع الملف.";

        }


        notify(
            "تعذر رفع الملف.",
            "error"
        );

    }

}


/* =========================================================
   SAVE LECTURE
========================================================= */

async function saveLecture() {

    try {

        await ensureAdmin();


        const titleInput =
            document.getElementById(
                "lectureTitleInput"
            );


        const subjectInput =
            document.getElementById(
                "lectureSubjectInput"
            );


        const descriptionInput =
            document.getElementById(
                "lectureDescriptionInput"
            );


        const title =
            titleInput?.value.trim();


        const subjectId =
            subjectInput?.value;


        const description =
            descriptionInput?.value.trim() ||
            "";


        if (!title) {

            notify(
                "اكتب عنوان المحاضرة.",
                "warning"
            );

            return;

        }


        if (!subjectId) {

            notify(
                "اختر المادة أولًا.",
                "warning"
            );

            return;

        }


        if (
            lectureBlocks.length === 0
        ) {

            notify(
                "أضف محتوى للمحاضرة أولًا.",
                "warning"
            );

            return;

        }


        const invalidImage =
            lectureBlocks.some(
                block =>
                    block.type === "image" &&
                    !block.url
            );


        if (invalidImage) {

            notify(
                "يوجد عنصر صورة بدون صورة مرفوعة.",
                "warning"
            );

            return;

        }


        const invalidVideo =
            lectureBlocks.some(
                block =>
                    block.type === "video" &&
                    !block.url
            );


        if (invalidVideo) {

            notify(
                "يوجد عنصر فيديو بدون رابط أو فيديو مرفوع.",
                "warning"
            );

            return;

        }


        const data = {

            subjectId,

            title,

            description,

            blocks:
                lectureBlocks,

            updatedAt:
                serverTimestamp()

        };


        if (editingLectureId) {

            await updateDoc(
                doc(
                    db,
                    "lectures",
                    editingLectureId
                ),
                data
            );


            notify(
                "تم تعديل المحاضرة بنجاح.",
                "success"
            );

        } else {

            await addDoc(
                collection(
                    db,
                    "lectures"
                ),
                {
                    ...data,

                    createdBy:
                        auth.currentUser.uid,

                    createdAt:
                        serverTimestamp()
                }
            );


            notify(
                "تم إنشاء المحاضرة بنجاح.",
                "success"
            );

        }


        editingLectureId =
            null;

        lectureBlocks =
            [];


        closeModal();


        await loadLectures();

    } catch (error) {

        console.error(
            "Save lecture error:",
            error
        );

        notify(
            "تعذر حفظ المحاضرة.",
            "error"
        );

    }

}


/* =========================================================
   CLOSE LECTURE MODAL
========================================================= */

function closeLectureModal() {

    lectureBlocks =
        [];

    editingLectureId =
        null;

    closeModal();

}


/* =========================================================
   DELETE LECTURE
========================================================= */

async function deleteLecture(
    lecture
) {

    if (!lecture?.id) {
        return;
    }


    const title =
        lecture.title ||
        "هذه المحاضرة";


    const confirmed =
        window.confirm(
            `هل أنت متأكد من حذف "${title}"؟`
        );


    if (!confirmed) {
        return;
    }


    try {

        await ensureAdmin();


        await deleteDoc(
            doc(
                db,
                "lectures",
                lecture.id
            )
        );


        notify(
            "تم حذف المحاضرة.",
            "success"
        );


        await loadLectures();

    } catch (error) {

        console.error(
            "Delete lecture error:",
            error
        );

        notify(
            "تعذر حذف المحاضرة.",
            "error"
        );

    }

}


/* =========================================================
   END OF PART 1
========================================================= */
/* =========================================================
   SHEETS / NEWS
========================================================= */

async function loadSheets() {

    try {

        sheets =
            await fetchCollection(
                "sheets"
            );


        renderSheets(
            sheets
        );

    } catch (error) {

        console.error(
            "Load sheets error:",
            error
        );

        notify(
            "تعذر تحميل الشيت والأخبار.",
            "error"
        );

    }

}


/* =========================================================
   RENDER SHEETS
========================================================= */

function renderSheets(
    list
) {

    if (!sheetsList) {
        return;
    }


    sheetsList.innerHTML =
        "";


    if (
        !Array.isArray(list) ||
        list.length === 0
    ) {

        sheetsList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📢
                </div>

                <h3>
                    لا يوجد محتوى
                </h3>

                <p>
                    أضف أول شيت أو خبر.
                </p>

            </div>
        `;

        return;

    }


    list.forEach(
        sheet => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "content-item";


            const type =
                sheet.type ||
                "news";


            const typeText =
                type === "sheet"
                ? "شيت"
                : type === "assignment"
                    ? "واجب"
                    : "خبر";


            const subject =
                subjects.find(
                    item =>
                        item.id ===
                        sheet.subjectId
                );


            const subjectName =
                subject?.name ||
                subject?.title ||
                "مادة غير محددة";


            card.innerHTML = `

                <div class="content-item-main">

                    <div class="content-item-icon">
                        📢
                    </div>

                    <div class="content-item-info">

                        <strong>
                            ${escapeHTML(
                                sheet.title ||
                                "محتوى بدون عنوان"
                            )}
                        </strong>

                        <span>
                            ${typeText}
                        </span>

                        <small>
                            المادة:
                            ${escapeHTML(
                                subjectName
                            )}
                        </small>

                        <small>
                            ${escapeHTML(
                                sheet.description ||
                                ""
                            )}
                        </small>

                    </div>

                </div>


                <div class="content-item-actions">

                    <button
                        type="button"
                        class="secondary-btn edit-sheet-btn"
                    >
                        تعديل
                    </button>

                    <button
                        type="button"
                        class="danger-btn delete-sheet-btn"
                    >
                        حذف
                    </button>

                </div>

            `;


            card
                .querySelector(
                    ".edit-sheet-btn"
                )
                .addEventListener(
                    "click",
                    () => openSheetModal(
                        sheet
                    )
                );


            card
                .querySelector(
                    ".delete-sheet-btn"
                )
                .addEventListener(
                    "click",
                    () => deleteSheet(
                        sheet
                    )
                );


            sheetsList.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   SHEET MODAL
========================================================= */

function openSheetModal(
    sheet = null
) {

    editingSheetId =
        sheet?.id ||
        null;


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.innerHTML = `

        <div class="form-group">

            <label>
                نوع المحتوى
            </label>

            <select
                id="sheetTypeInput"
            >

                <option
                    value="news"
                >
                    خبر
                </option>

                <option
                    value="sheet"
                >
                    شيت
                </option>

                <option
                    value="assignment"
                >
                    واجب
                </option>

            </select>

        </div>


        <div class="form-group">

            <label>
                المادة
            </label>

            <select
                id="sheetSubjectInput"
            ></select>

        </div>


        <div class="form-group">

            <label>
                العنوان
            </label>

            <input
                type="text"
                id="sheetTitleInput"
                placeholder="عنوان المحتوى..."
                value="${escapeHTML(
                    sheet?.title ||
                    ""
                )}"
            >

        </div>


        <div class="form-group">

            <label>
                الوصف
            </label>

            <textarea
                id="sheetDescriptionInput"
                rows="4"
                placeholder="اكتب تفاصيل المحتوى..."
            >${escapeHTML(
                sheet?.description ||
                ""
            )}</textarea>

        </div>


        <div class="form-group">

            <label>
                رابط المحتوى
            </label>

            <input
                type="url"
                id="sheetUrlInput"
                placeholder="رابط الشيت أو الملف..."
                value="${escapeHTML(
                    sheet?.url ||
                    ""
                )}"
            >

        </div>


        <div class="form-actions">

            <button
                type="button"
                class="cancel-btn"
                id="cancelSheetBtn"
            >
                إلغاء
            </button>

            <button
                type="button"
                class="primary-btn"
                id="saveSheetBtn"
            >
                ${
                    sheet
                    ? "حفظ التعديلات"
                    : "إضافة المحتوى"
                }
            </button>

        </div>

    `;


    const modal =
        openModal({

            title:
                sheet
                ? "تعديل المحتوى"
                : "إضافة شيت / خبر",

            content:
                wrapper,

            size:
                "medium"

        });


    if (!modal) {
        return;
    }


    const typeInput =
        wrapper.querySelector(
            "#sheetTypeInput"
        );


    if (sheet?.type) {

        typeInput.value =
            sheet.type;

    }


    const subjectInput =
        wrapper.querySelector(
            "#sheetSubjectInput"
        );


    fillSubjectSelect(
        subjectInput,
        sheet?.subjectId || ""
    );


    wrapper
        .querySelector(
            "#cancelSheetBtn"
        )
        .addEventListener(
            "click",
            () => {

                editingSheetId =
                    null;

                closeModal();

            }
        );


    wrapper
        .querySelector(
            "#saveSheetBtn"
        )
        .addEventListener(
            "click",
            saveSheet
        );

}


/* =========================================================
   SAVE SHEET
========================================================= */

async function saveSheet() {

    try {

        await ensureAdmin();


        const type =
            document.getElementById(
                "sheetTypeInput"
            )?.value ||
            "news";


        const subjectId =
            document.getElementById(
                "sheetSubjectInput"
            )?.value;


        const title =
            document.getElementById(
                "sheetTitleInput"
            )?.value.trim();


        const description =
            document.getElementById(
                "sheetDescriptionInput"
            )?.value.trim() ||
            "";


        const url =
            document.getElementById(
                "sheetUrlInput"
            )?.value.trim() ||
            "";


        if (!subjectId) {

            notify(
                "اختر المادة أولًا.",
                "warning"
            );

            return;

        }


        if (!title) {

            notify(
                "اكتب العنوان.",
                "warning"
            );

            return;

        }


        const data = {

            subjectId,

            type,

            title,

            description,

            url,

            updatedAt:
                serverTimestamp()

        };


        if (editingSheetId) {

            await updateDoc(
                doc(
                    db,
                    "sheets",
                    editingSheetId
                ),
                data
            );


            notify(
                "تم تعديل المحتوى.",
                "success"
            );

        } else {

            await addDoc(
                collection(
                    db,
                    "sheets"
                ),
                {
                    ...data,

                    createdBy:
                        auth.currentUser.uid,

                    createdAt:
                        serverTimestamp()
                }
            );


            notify(
                "تمت إضافة المحتوى.",
                "success"
            );

        }


        editingSheetId =
            null;


        closeModal();


        await loadSheets();

    } catch (error) {

        console.error(
            "Save sheet error:",
            error
        );

        notify(
            "تعذر حفظ المحتوى.",
            "error"
        );

    }

}


/* =========================================================
   DELETE SHEET
========================================================= */

async function deleteSheet(
    sheet
) {

    if (!sheet?.id) {
        return;
    }


    const confirmed =
        window.confirm(
            `هل تريد حذف "${sheet.title || "هذا المحتوى"}"؟`
        );


    if (!confirmed) {
        return;
    }


    try {

        await ensureAdmin();


        await deleteDoc(
            doc(
                db,
                "sheets",
                sheet.id
            )
        );


        notify(
            "تم حذف المحتوى.",
            "success"
        );


        await loadSheets();

    } catch (error) {

        console.error(
            "Delete sheet error:",
            error
        );

        notify(
            "تعذر حذف المحتوى.",
            "error"
        );

    }

}


/* =========================================================
   SUBJECT SELECT
========================================================= */

function fillSubjectSelect(
    select,
    selectedId = ""
) {

    if (!select) {
        return;
    }


    select.innerHTML = `

        <option value="">
            اختر المادة
        </option>

    `;


    subjects.forEach(
        subject => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                subject.id;


            option.textContent =
                subject.name ||
                subject.title ||
                "مادة";


            if (
                subject.id ===
                selectedId
            ) {

                option.selected =
                    true;

            }


            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   REFRESH SUBJECT SELECTS
========================================================= */

async function refreshSubjectSelects() {

    /*
       المحاضرة والشيت عند فتحهما
       يستخدمان أحدث قائمة للمواد.
       
       لا نفتح أي Modal هنا.
    */

}


/* =========================================================
   GLOBAL API
========================================================= */

window.ENGForgeContent = {

    get subjects() {
        return subjects;
    },

    get lectures() {
        return lectures;
    },

    get sheets() {
        return sheets;
    },

    loadSubjects,

    loadLectures,

    loadSheets,

    openSubjectModal,

    openLectureModal,

    openSheetModal,

    saveSubject,

    saveLecture,

    saveSheet

};


/* =========================================================
   READY
========================================================= */

console.log(
    "ENG Forge Admin Content loaded successfully."
);


/* =========================================================
   END OF FILE
========================================================= */
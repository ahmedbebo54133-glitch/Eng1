/*=========================================================
        ENG FORGE
        ADMIN DASHBOARD
        COMPLETE ADMIN JAVASCRIPT
        FINAL VERSION
=========================================================*/

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from
    "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


/*=========================================================
                    FIREBASE CONFIG
=========================================================*/

const firebaseConfig = {

    apiKey:
        "AIzaSyCq35ypvgrm9TtTdnnqrLOIy3P_8CKUpNA",

    authDomain:
        "eng1-5fc32.firebaseapp.com",

    projectId:
        "eng1-5fc32",

    storageBucket:
        "eng1-5fc32.firebasestorage.app",

    messagingSenderId:
        "1052679599533",

    appId:
        "1:1052679599533:web:54a45df3d87166999a1d24",

    measurementId:
        "G-NRCF4R6388"
};


/*=========================================================
                    INITIALIZE
=========================================================*/

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


/*=========================================================
                    CLOUDINARY
=========================================================*/

const CLOUDINARY_CLOUD_NAME =
    "iir6bqt7";

const CLOUDINARY_UPLOAD_PRESET =
    "buying_upload";

const CLOUDINARY_URL =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;


/*=========================================================
                    STATE
=========================================================*/

let currentUser = null;

let isAdmin = false;

let subjects = [];

let lectures = [];

let exams = [];

let sheets = [];

let students = [];

let results = [];

let editingId = null;

let currentModalType = null;


/*
 * Lecture Builder
 */

let lectureBlocks = [];


/*=========================================================
                    DOM
=========================================================*/

const adminName =
    document.getElementById("adminName");

const adminAvatar =
    document.getElementById("adminAvatar");

const logoutBtn =
    document.getElementById("logoutBtn");


const subjectsList =
    document.getElementById("subjectsList");

const lecturesList =
    document.getElementById("lecturesList");

const examsList =
    document.getElementById("examsList");

const sheetsList =
    document.getElementById("sheetsList");

const studentsList =
    document.getElementById("studentsList");

const resultsList =
    document.getElementById("resultsList");


const subjectsCount =
    document.getElementById("subjectsCount");

const lecturesCount =
    document.getElementById("lecturesCount");

const examsCount =
    document.getElementById("examsCount");

const studentsCount =
    document.getElementById("studentsCount");


const addSubjectBtn =
    document.getElementById("addSubjectBtn");

const addLectureBtn =
    document.getElementById("addLectureBtn");

const addExamBtn =
    document.getElementById("addExamBtn");

const addSheetBtn =
    document.getElementById("addSheetBtn");


const studentSearch =
    document.getElementById("studentSearch");

const studentSearchBtn =
    document.getElementById("studentSearchBtn");


/*=========================================================
                    BASIC HELPERS
=========================================================*/

function escapeHTML(value){

    if(value === null || value === undefined){
        return "";
    }

    return String(value)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}


function formatDate(value){

    if(!value){
        return "غير محدد";
    }

    try{

        let date;

        if(
            value &&
            typeof value.toDate === "function"
        ){
            date = value.toDate();
        }
        else if(
            value &&
            typeof value.seconds === "number"
        ){
            date = new Date(
                value.seconds * 1000
            );
        }
        else{
            date = new Date(value);
        }

        if(isNaN(date.getTime())){
            return "غير محدد";
        }

        return date.toLocaleDateString(
            "ar-EG",
            {
                year:"numeric",
                month:"long",
                day:"numeric"
            }
        );

    }
    catch(error){

        return "غير محدد";
    }
}


function showNotification(
    message,
    type = "success"
){

    const old =
        document.querySelector(".notification");

    if(old){
        old.remove();
    }

    const notification =
        document.createElement("div");

    notification.className =
        "notification";

    if(type === "error"){

        notification.style.borderColor =
            "rgba(255,80,80,.35)";
    }

    if(type === "warning"){

        notification.style.borderColor =
            "rgba(255,190,70,.35)";
    }

    notification.textContent =
        message;

    document.body.appendChild(
        notification
    );

    setTimeout(() => {

        if(notification.parentNode){

            notification.remove();

        }

    },3500);
}


function getUserDisplayName(userData){

    return (
        userData?.name ||
        userData?.studentName ||
        currentUser?.displayName ||
        currentUser?.email?.split("@")[0] ||
        "Admin"
    );
}


function getUserPhoto(userData){

    return (
        userData?.photoURL ||
        currentUser?.photoURL ||
        ""
    );
}


/*=========================================================
                    NAVIGATION
=========================================================*/

function showSection(sectionName){

    document
        .querySelectorAll(".admin-section")
        .forEach(section => {

            section.classList.remove(
                "active"
            );

        });


    const target =
        document.getElementById(
            `section-${sectionName}`
        );


    if(target){

        target.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section ===
                sectionName
            );

        });


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });
}


/*=========================================================
                    NAV EVENTS
=========================================================*/

document
    .querySelectorAll(".nav-item")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showSection(
                    button.dataset.section
                );

            }
        );

    });


document
    .querySelectorAll(".quick-action")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const section =
                    button.dataset.section;

                showSection(section);

                if(section === "subjects"){
                    openSubjectModal();
                }

                if(section === "lectures"){
                    openLectureModal();
                }

                if(section === "exams"){
                    openExamModal();
                }

                if(section === "sheets"){
                    openSheetModal();
                }

            }
        );

    });


/*=========================================================
                    CLOUDINARY
=========================================================*/

async function uploadToCloudinary(
    file,
    onProgress = null
){

    if(!file){
        return null;
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
        (resolve,reject) => {

            const xhr =
                new XMLHttpRequest();

            xhr.open(
                "POST",
                CLOUDINARY_URL
            );


            xhr.upload.addEventListener(
                "progress",
                event => {

                    if(
                        event.lengthComputable &&
                        typeof onProgress === "function"
                    ){

                        const percent =
                            Math.round(
                                (
                                    event.loaded /
                                    event.total
                                ) * 100
                            );

                        onProgress(percent);

                    }

                }
            );


            xhr.onload = () => {

                try{

                    const data =
                        JSON.parse(
                            xhr.responseText
                        );


                    if(
                        xhr.status >= 200 &&
                        xhr.status < 300 &&
                        data.secure_url
                    ){

                        resolve(data);

                    }
                    else{

                        reject(
                            new Error(
                                data.error?.message ||
                                "فشل رفع الملف"
                            )
                        );

                    }

                }
                catch(error){

                    reject(error);

                }

            };


            xhr.onerror = () => {

                reject(
                    new Error(
                        "تعذر الاتصال بـ Cloudinary"
                    )
                );

            };


            xhr.send(formData);

        }
    );
}


/*=========================================================
                    ADMIN VERIFICATION
=========================================================*/

async function verifyAdmin(user){

    if(!user){

        window.location.href =
            "login.html";

        return false;
    }


    try{

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        const userSnapshot =
            await getDoc(userRef);


        if(!userSnapshot.exists()){

            showNotification(
                "بيانات الحساب غير موجودة",
                "error"
            );

            await signOut(auth);

            window.location.href =
                "index.html";

            return false;
        }


        const userData =
            userSnapshot.data();


        if(userData.role !== "admin"){

            showNotification(
                "ليس لديك صلاحية دخول لوحة الإدارة",
                "error"
            );

            await signOut(auth);

            setTimeout(() => {

                window.location.href =
                    "index.html";

            },1000);

            return false;
        }


        currentUser = user;

        isAdmin = true;


        if(adminName){

            adminName.textContent =
                getUserDisplayName(
                    userData
                );

        }


        const photo =
            getUserPhoto(
                userData
            );


        if(adminAvatar){

            if(photo){

                adminAvatar.innerHTML =
                    `<img
                        src="${escapeHTML(photo)}"
                        alt="Admin"
                        style="
                            width:100%;
                            height:100%;
                            object-fit:cover;
                            border-radius:50%;
                        "
                    >`;

            }
            else{

                adminAvatar.textContent =
                    "⚙️";

            }

        }


        return true;

    }
    catch(error){

        console.error(
            "Admin verification error:",
            error
        );


        showNotification(
            "حدث خطأ أثناء التحقق من صلاحيات الأدمن",
            "error"
        );

        return false;
    }
}


/*=========================================================
                    LOAD ALL DATA
=========================================================*/

async function loadAllData(){

    if(!isAdmin){
        return;
    }


    try{

        await loadSubjects();

        await Promise.all([

            loadLectures(),

            loadExams(),

            loadSheets(),

            loadStudents(),

            loadResults()

        ]);


        updateStatistics();

    }
    catch(error){

        console.error(
            "Load data error:",
            error
        );


        showNotification(
            "حدث خطأ أثناء تحميل بيانات لوحة الإدارة",
            "error"
        );

    }
}


/*=========================================================
                    LOAD SUBJECTS
=========================================================*/

async function loadSubjects(){

    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "subjects"
                )
            );


        subjects =
            snapshot.docs.map(
                item => ({
                    id:item.id,
                    ...item.data()
                })
            );


        subjects.sort(
            (a,b) => {

                const orderA =
                    Number(a.order || 0);

                const orderB =
                    Number(b.order || 0);

                return orderA - orderB;

            }
        );


        renderSubjects();

    }
    catch(error){

        console.error(
            "Load subjects:",
            error
        );


        subjects = [];

        renderSubjects();


        showNotification(
            "تعذر تحميل المواد. تأكد من Firestore Rules.",
            "error"
        );

    }
}


/*=========================================================
                    RENDER SUBJECTS
=========================================================*/

function renderSubjects(){

    if(!subjectsList){
        return;
    }


    if(subjects.length === 0){

        subjectsList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📚
                </div>

                <h3>
                    لا توجد مواد
                </h3>

                <p>
                    ابدأ بإضافة أول مادة دراسية.
                </p>

            </div>
        `;

        return;
    }


    subjectsList.innerHTML =
        subjects.map(subject => {

            return `

                <div
                    class="content-item"
                    data-id="${escapeHTML(subject.id)}"
                >

                    <div>

                        <strong
                            style="
                                display:block;
                                font-size:16px;
                                margin-bottom:6px;
                            "
                        >
                            ${escapeHTML(
                                subject.name ||
                                "بدون اسم"
                            )}
                        </strong>

                        <span
                            style="
                                color:#7f8d9c;
                                font-size:12px;
                            "
                        >
                            ${escapeHTML(
                                subject.description ||
                                "لا يوجد وصف"
                            )}
                        </span>

                    </div>


                    <div
                        style="
                            display:flex;
                            gap:8px;
                            flex-wrap:wrap;
                        "
                    >

                        <button
                            type="button"
                            class="edit-content-btn"
                            data-type="subject"
                            data-id="${escapeHTML(subject.id)}"
                            style="
                                border:1px solid rgba(78,168,255,.2);
                                background:rgba(78,168,255,.08);
                                color:#4ea8ff;
                                padding:9px 12px;
                                border-radius:9px;
                                cursor:pointer;
                                font-family:inherit;
                            "
                        >
                            ✏️ تعديل
                        </button>

                        <button
                            type="button"
                            class="delete-content-btn"
                            data-type="subject"
                            data-id="${escapeHTML(subject.id)}"
                            style="
                                border:1px solid rgba(255,80,80,.15);
                                background:rgba(255,80,80,.06);
                                color:#ff8d8d;
                                padding:9px 12px;
                                border-radius:9px;
                                cursor:pointer;
                                font-family:inherit;
                            "
                        >
                            🗑️ حذف
                        </button>

                    </div>

                </div>

            `;

        }).join("");
}


/*=========================================================
                    SUBJECT MODAL
=========================================================*/

function openSubjectModal(
    subject = null
){

    editingId =
        subject?.id || null;

    currentModalType =
        "subject";


    createModal({

        title:
            subject
                ? "تعديل المادة"
                : "إضافة مادة جديدة",

        content: `

            <div class="form-group">

                <label>
                    اسم المادة
                </label>

                <input
                    type="text"
                    id="subjectName"
                    value="${escapeHTML(
                        subject?.name || ""
                    )}"
                    placeholder="مثال: عمليات التشغيل"
                >

            </div>


            <div class="form-group">

                <label>
                    وصف المادة
                </label>

                <textarea
                    id="subjectDescription"
                    placeholder="وصف مختصر للمادة..."
                >${escapeHTML(
                    subject?.description || ""
                )}</textarea>

            </div>


            <div class="form-group">

                <label>
                    الأيقونة
                </label>

                <input
                    type="text"
                    id="subjectIcon"
                    value="${escapeHTML(
                        subject?.icon || "📚"
                    )}"
                    placeholder="📚"
                >

            </div>


            <div class="form-group">

                <label>
                    ترتيب المادة
                </label>

                <input
                    type="number"
                    id="subjectOrder"
                    min="0"
                    value="${Number(
                        subject?.order || 0
                    )}"
                >

            </div>

        `,

        saveText:
            subject
                ? "حفظ التعديلات"
                : "إضافة المادة",

        saveHandler:
            saveSubject

    });
}


/*=========================================================
                    SAVE SUBJECT
=========================================================*/

async function saveSubject(){

    const name =
        document
            .getElementById("subjectName")
            ?.value
            .trim();


    const description =
        document
            .getElementById("subjectDescription")
            ?.value
            .trim();


    const icon =
        document
            .getElementById("subjectIcon")
            ?.value
            .trim();


    const order =
        Number(
            document
                .getElementById("subjectOrder")
                ?.value || 0
        );


    if(!name){

        showNotification(
            "اكتب اسم المادة أولًا",
            "warning"
        );

        return;
    }


    try{

        const data = {

            name,

            description,

            icon:
                icon || "📚",

            order,

            updatedAt:
                serverTimestamp()

        };


        if(editingId){

            await updateDoc(
                doc(
                    db,
                    "subjects",
                    editingId
                ),
                data
            );


            showNotification(
                "تم تعديل المادة بنجاح"
            );

        }
        else{

            await addDoc(
                collection(
                    db,
                    "subjects"
                ),
                {

                    ...data,

                    createdAt:
                        serverTimestamp(),

                    createdBy:
                        currentUser.uid

                }
            );


            showNotification(
                "تمت إضافة المادة بنجاح"
            );

        }


        closeModal();

        await loadSubjects();

        updateStatistics();

    }
    catch(error){

        console.error(
            "Save subject:",
            error
        );


        showNotification(
            "تعذر حفظ المادة: " +
            getFirebaseErrorMessage(error),
            "error"
        );

    }
}


/*=========================================================
                    LOAD LECTURES
=========================================================*/

async function loadLectures(){

    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "lectures"
                )
            );


        lectures =
            snapshot.docs.map(
                item => ({
                    id:item.id,
                    ...item.data()
                })
            );


        lectures.sort(
            (a,b) => {

                const aTime =
                    getTimestampNumber(
                        a.createdAt
                    );

                const bTime =
                    getTimestampNumber(
                        b.createdAt
                    );

                return bTime - aTime;

            }
        );


        renderLectures();

    }
    catch(error){

        console.error(
            "Load lectures:",
            error
        );


        lectures = [];

        renderLectures();


        showNotification(
            "تعذر تحميل المحاضرات",
            "error"
        );

    }
}


/*=========================================================
                    RENDER LECTURES
=========================================================*/

function renderLectures(){

    if(!lecturesList){
        return;
    }


    if(lectures.length === 0){

        lecturesList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📖
                </div>

                <h3>
                    لا توجد محاضرات
                </h3>

                <p>
                    ابدأ بإضافة أول محاضرة.
                </p>

            </div>
        `;

        return;
    }


    lecturesList.innerHTML =
        lectures.map(lecture => {

            const subject =
                findSubject(
                    lecture.subjectId
                );


            const blockCount =
                Array.isArray(lecture.blocks)
                    ? lecture.blocks.length
                    : 0;


            return `

                <div class="content-item">

                    <div>

                        <strong
                            style="
                                display:block;
                                font-size:16px;
                                margin-bottom:6px;
                            "
                        >
                            ${escapeHTML(
                                lecture.title ||
                                "بدون عنوان"
                            )}
                        </strong>

                        <span
                            style="
                                color:#4ea8ff;
                                font-size:11px;
                                display:block;
                                margin-bottom:5px;
                            "
                        >
                            ${escapeHTML(
                                subject?.name ||
                                "مادة غير معروفة"
                            )}
                        </span>

                        <span
                            style="
                                color:#7f8d9c;
                                font-size:12px;
                            "
                        >
                            ${escapeHTML(
                                lecture.description ||
                                "لا يوجد وصف"
                            )}
                        </span>

                        ${
                            blockCount
                                ? `
                                    <span
                                        style="
                                            display:block;
                                            color:#657586;
                                            font-size:11px;
                                            margin-top:7px;
                                        "
                                    >
                                        📚 ${blockCount} عنصر داخل المحاضرة
                                    </span>
                                `
                                : ""
                        }

                    </div>


                    <div
                        style="
                            display:flex;
                            gap:8px;
                            flex-wrap:wrap;
                        "
                    >

                        <button
                            type="button"
                            class="edit-content-btn"
                            data-type="lecture"
                            data-id="${escapeHTML(lecture.id)}"
                            style="
                                border:1px solid rgba(78,168,255,.2);
                                background:rgba(78,168,255,.08);
                                color:#4ea8ff;
                                padding:9px 12px;
                                border-radius:9px;
                                cursor:pointer;
                                font-family:inherit;
                            "
                        >
                            ✏️ تعديل
                        </button>

                        <button
                            type="button"
                            class="delete-content-btn"
                            data-type="lecture"
                            data-id="${escapeHTML(lecture.id)}"
                            style="
                                border:1px solid rgba(255,80,80,.15);
                                background:rgba(255,80,80,.06);
                                color:#ff8d8d;
                                padding:9px 12px;
                                border-radius:9px;
                                cursor:pointer;
                                font-family:inherit;
                            "
                        >
                            🗑️ حذف
                        </button>

                    </div>

                </div>

            `;

        }).join("");
}


/*=========================================================
                    LECTURE BUILDER
=========================================================*/

const LECTURE_BLOCK_TYPES = {

    heading: {
        label:"عنوان رئيسي",
        icon:"🔷"
    },

    subheading: {
        label:"عنوان فرعي",
        icon:"🔹"
    },

    paragraph: {
        label:"فقرة",
        icon:"📝"
    },

    image: {
        label:"صورة",
        icon:"🖼️"
    },

    note: {
        label:"ملاحظة",
        icon:"💡"
    },

    important: {
        label:"نقطة مهمة",
        icon:"⚠️"
    },

    list: {
        label:"قائمة",
        icon:"📋"
    },

    equation: {
        label:"معادلة / قانون",
        icon:"∑"
    },

    video: {
        label:"فيديو",
        icon:"🎬"
    }

};


function createLectureBlock(
    type,
    data = {}
){

    const block = {

        id:
            data.id ||
            generateBlockId(),

        type,

        text:
            data.text || "",

        title:
            data.title || "",

        caption:
            data.caption || "",

        url:
            data.url || "",

        publicId:
            data.publicId || "",

        items:
            Array.isArray(data.items)
                ? [...data.items]
                : [],

        level:
            data.level || 2,

        fileName:
            data.fileName || ""

    };


    return block;
}


function generateBlockId(){

    return (
        "block_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .slice(2,9)
    );
}


/*=========================================================
              LEGACY LECTURE MIGRATION
=========================================================*/

function convertOldLectureToBlocks(
    lecture
){

    if(
        Array.isArray(
            lecture?.blocks
        ) &&
        lecture.blocks.length > 0
    ){

        return lecture.blocks.map(
            block =>
                createLectureBlock(
                    block.type || "paragraph",
                    block
                )
        );

    }


    const blocks = [];


    if(lecture?.content){

        blocks.push(
            createLectureBlock(
                "paragraph",
                {
                    text:
                        lecture.content
                }
            )
        );

    }


    if(lecture?.imageUrl){

        blocks.push(
            createLectureBlock(
                "image",
                {
                    url:
                        lecture.imageUrl,

                    publicId:
                        lecture.imagePublicId || "",

                    caption:
                        lecture.imageCaption || ""
                }
            )
        );

    }


    if(lecture?.videoUrl){

        blocks.push(
            createLectureBlock(
                "video",
                {
                    url:
                        lecture.videoUrl,

                    publicId:
                        lecture.videoPublicId || "",

                    title:
                        lecture.videoTitle || ""
                }
            )
        );

    }


    return blocks;
}


/*=========================================================
                    LECTURE MODAL
=========================================================*/

function openLectureModal(
    lecture = null
){

    editingId =
        lecture?.id || null;

    currentModalType =
        "lecture";


    lectureBlocks =
        convertOldLectureToBlocks(
            lecture
        );


    const subjectOptions =
        subjects.map(subject => {

            const selected =
                lecture?.subjectId ===
                subject.id
                    ? "selected"
                    : "";

            return `
                <option
                    value="${escapeHTML(subject.id)}"
                    ${selected}
                >
                    ${escapeHTML(
                        subject.name
                    )}
                </option>
            `;

        }).join("");


    createModal({

        title:
            lecture
                ? "تعديل المحاضرة"
                : "إنشاء محاضرة تعليمية",

        content: `

            <div class="form-group">

                <label>
                    المادة
                </label>

                <select id="lectureSubject">

                    <option value="">
                        اختر المادة
                    </option>

                    ${subjectOptions}

                </select>

            </div>


            <div class="form-group">

                <label>
                    عنوان المحاضرة
                </label>

                <input
                    type="text"
                    id="lectureTitle"
                    value="${escapeHTML(
                        lecture?.title || ""
                    )}"
                    placeholder="مثال: مقدمة في عمليات التشغيل"
                >

            </div>


            <div class="form-group">

                <label>
                    وصف المحاضرة
                </label>

                <textarea
                    id="lectureDescription"
                    placeholder="وصف مختصر للمحاضرة..."
                >${escapeHTML(
                    lecture?.description || ""
                )}</textarea>

            </div>


            <!--
                LECTURE BUILDER
            -->

            <div
                style="
                    margin-top:20px;
                    padding:16px;
                    border:1px solid rgba(78,168,255,.15);
                    background:rgba(78,168,255,.025);
                    border-radius:14px;
                "
            >

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:10px;
                        flex-wrap:wrap;
                        margin-bottom:14px;
                    "
                >

                    <div>

                        <strong
                            style="
                                display:block;
                                font-size:16px;
                                margin-bottom:5px;
                            "
                        >
                            🏗️ محتوى المحاضرة
                        </strong>

                        <span
                            style="
                                display:block;
                                color:#7f8d9c;
                                font-size:12px;
                                line-height:1.7;
                            "
                        >
                            ابنِ المحاضرة عنصرًا وراء عنصر
                            بدون كتابة HTML.
                        </span>

                    </div>


                    <button
                        type="button"
                        id="addLectureBlockBtn"
                        style="
                            border:1px solid rgba(78,168,255,.3);
                            background:rgba(78,168,255,.1);
                            color:#4ea8ff;
                            padding:10px 14px;
                            border-radius:10px;
                            cursor:pointer;
                            font-family:inherit;
                            font-weight:700;
                        "
                    >
                        ＋ إضافة عنصر
                    </button>

                </div>


                <div
                    id="lectureBlocksContainer"
                ></div>


                <div
                    id="lectureEmptyBlocks"
                    style="
                        display:none;
                        padding:25px 10px;
                        text-align:center;
                        color:#718092;
                        font-size:13px;
                    "
                >
                    لم تتم إضافة أي عناصر بعد.
                    <br>
                    اضغط «إضافة عنصر» لبدء بناء المحاضرة.
                </div>

            </div>

        `,

        saveText:
            lecture
                ? "حفظ التعديلات"
                : "إضافة المحاضرة",

        saveHandler:
            saveLecture

    });


    renderLectureBlocks();


    const addBlockButton =
        document.getElementById(
            "addLectureBlockBtn"
        );


    if(addBlockButton){

        addBlockButton.addEventListener(
            "click",
            () => {

                openAddBlockMenu();

            }
        );

    }
}


/*=========================================================
                    ADD BLOCK MENU
=========================================================*/

function openAddBlockMenu(){

    const old =
        document.getElementById(
            "lectureBlockMenu"
        );

    if(old){
        old.remove();
    }


    const menu =
        document.createElement(
            "div"
        );


    menu.id =
        "lectureBlockMenu";


    menu.style.cssText = `
        position:fixed;
        inset:0;
        z-index:100000;
        background:rgba(0,0,0,.65);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:18px;
    `;


    const box =
        document.createElement(
            "div"
        );


    box.style.cssText = `
        width:min(520px,100%);
        max-height:85vh;
        overflow:auto;
        background:#11161d;
        border:1px solid rgba(78,168,255,.18);
        border-radius:16px;
        padding:18px;
        box-shadow:0 20px 70px rgba(0,0,0,.5);
    `;


    box.innerHTML = `

        <div
            style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:16px;
            "
        >

            <strong
                style="
                    font-size:17px;
                "
            >
                اختر نوع العنصر
            </strong>

            <button
                type="button"
                id="closeBlockMenu"
                style="
                    border:0;
                    background:transparent;
                    color:#9aa8b6;
                    font-size:28px;
                    cursor:pointer;
                "
            >
                ×
            </button>

        </div>


        <div
            style="
                display:grid;
                grid-template-columns:repeat(2,minmax(0,1fr));
                gap:10px;
            "
        >

            ${Object.entries(
                LECTURE_BLOCK_TYPES
            ).map(([type,info]) => {

                return `

                    <button
                        type="button"
                        class="lecture-type-option"
                        data-block-type="${escapeHTML(type)}"
                        style="
                            border:1px solid rgba(255,255,255,.08);
                            background:rgba(255,255,255,.025);
                            color:#e8edf2;
                            padding:15px 12px;
                            border-radius:12px;
                            cursor:pointer;
                            font-family:inherit;
                            text-align:right;
                        "
                    >

                        <span
                            style="
                                font-size:20px;
                                display:block;
                                margin-bottom:6px;
                            "
                        >
                            ${info.icon}
                        </span>

                        <span
                            style="
                                font-size:13px;
                            "
                        >
                            ${escapeHTML(info.label)}
                        </span>

                    </button>

                `;

            }).join("")}

        </div>

    `;


    menu.appendChild(box);

    document.body.appendChild(menu);


    box.querySelector(
        "#closeBlockMenu"
    ).addEventListener(
        "click",
        () => menu.remove()
    );


    menu.addEventListener(
        "click",
        event => {

            if(event.target === menu){

                menu.remove();

            }

        }
    );


    box.querySelectorAll(
        ".lecture-type-option"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const type =
                    button.dataset.blockType;

                lectureBlocks.push(
                    createLectureBlock(
                        type
                    )
                );

                renderLectureBlocks();

                menu.remove();

                setTimeout(() => {

                    const container =
                        document.getElementById(
                            "lectureBlocksContainer"
                        );

                    if(container){

                        const blocks =
                            container.querySelectorAll(
                                ".lecture-builder-block"
                            );

                        const last =
                            blocks[
                                blocks.length - 1
                            ];

                        if(last){

                            last.scrollIntoView({
                                behavior:"smooth",
                                block:"center"
                            });

                        }

                    }

                },100);

            }
        );

    });
}


/*=========================================================
                    RENDER BLOCKS
=========================================================*/

function renderLectureBlocks(){

    const container =
        document.getElementById(
            "lectureBlocksContainer"
        );

    const empty =
        document.getElementById(
            "lectureEmptyBlocks"
        );


    if(!container){
        return;
    }


    if(lectureBlocks.length === 0){

        container.innerHTML = "";

        if(empty){

            empty.style.display =
                "block";

        }

        return;
    }


    if(empty){

        empty.style.display =
            "none";

    }


    container.innerHTML =
        lectureBlocks.map(
            (block,index) =>
                renderLectureBlock(
                    block,
                    index
                )
        ).join("");


    attachLectureBlockEvents();
}


/*=========================================================
                RENDER SINGLE BLOCK
=========================================================*/

function renderLectureBlock(
    block,
    index
){

    const info =
        LECTURE_BLOCK_TYPES[
            block.type
        ] ||
        LECTURE_BLOCK_TYPES.paragraph;


    let body = "";


    /*-----------------------------------------------
            HEADING
    -----------------------------------------------*/

    if(block.type === "heading"){

        body = `

            <div class="form-group">

                <label>
                    العنوان
                </label>

                <input
                    type="text"
                    class="lecture-block-text"
                    data-field="text"
                    data-index="${index}"
                    value="${escapeHTML(block.text)}"
                    placeholder="اكتب عنوان القسم..."
                >

            </div>


            <div class="form-group">

                <label>
                    مستوى العنوان
                </label>

                <select
                    class="lecture-block-level"
                    data-field="level"
                    data-index="${index}"
                >

                    <option
                        value="2"
                        ${block.level == 2 ? "selected" : ""}
                    >
                        عنوان رئيسي
                    </option>

                    <option
                        value="3"
                        ${block.level == 3 ? "selected" : ""}
                    >
                        عنوان فرعي
                    </option>

                </select>

            </div>

        `;

    }


    /*-----------------------------------------------
            SUBHEADING
    -----------------------------------------------*/

    else if(block.type === "subheading"){

        body = `

            <div class="form-group">

                <label>
                    العنوان الفرعي
                </label>

                <input
                    type="text"
                    class="lecture-block-text"
                    data-field="text"
                    data-index="${index}"
                    value="${escapeHTML(block.text)}"
                    placeholder="اكتب العنوان الفرعي..."
                >

            </div>

        `;

    }


    /*-----------------------------------------------
            PARAGRAPH
    -----------------------------------------------*/

    else if(block.type === "paragraph"){

        body = `

            <div class="form-group">

                <label>
                    نص الفقرة
                </label>

                <textarea
                    class="lecture-block-textarea"
                    data-field="text"
                    data-index="${index}"
                    style="
                        min-height:130px;
                        line-height:1.9;
                    "
                    placeholder="اكتب شرح الفقرة هنا..."
                >${escapeHTML(block.text)}</textarea>

            </div>

        `;

    }


    /*-----------------------------------------------
            IMAGE
    -----------------------------------------------*/

    else if(block.type === "image"){

        body = `

            <div class="form-group">

                <label>
                    صورة
                </label>

                <div
                    style="
                        border:1px dashed rgba(78,168,255,.2);
                        border-radius:11px;
                        padding:12px;
                    "
                >

                    <input
                        type="file"
                        class="lecture-block-file"
                        data-field="file"
                        data-index="${index}"
                        accept="image/*"
                    >

                    ${
                        block.url
                            ? `
                                <div
                                    style="
                                        margin-top:12px;
                                    "
                                >

                                    <img
                                        src="${escapeHTML(block.url)}"
                                        alt=""
                                        style="
                                            width:100%;
                                            max-height:240px;
                                            object-fit:contain;
                                            border-radius:10px;
                                            background:#090d12;
                                            display:block;
                                        "
                                    >

                                    <small
                                        style="
                                            display:block;
                                            color:#718092;
                                            margin-top:7px;
                                        "
                                    >
                                        اترك اختيار الملف فارغًا
                                        للاحتفاظ بالصورة الحالية.
                                    </small>

                                </div>
                            `
                            : `
                                <small
                                    style="
                                        display:block;
                                        color:#718092;
                                        margin-top:7px;
                                    "
                                >
                                    اختر الصورة التي تريد وضعها
                                    في هذا المكان من المحاضرة.
                                </small>
                            `
                    }

                </div>

            </div>


            <div class="form-group">

                <label>
                    وصف الصورة / الشكل
                </label>

                <input
                    type="text"
                    class="lecture-block-caption"
                    data-field="caption"
                    data-index="${index}"
                    value="${escapeHTML(block.caption)}"
                    placeholder="مثال: الشكل (أ) ماكينة الخراطة"
                >

            </div>

        `;

    }


    /*-----------------------------------------------
            NOTE
    -----------------------------------------------*/

    else if(block.type === "note"){

        body = `

            <div class="form-group">

                <label>
                    عنوان الملاحظة
                </label>

                <input
                    type="text"
                    class="lecture-block-title"
                    data-field="title"
                    data-index="${index}"
                    value="${escapeHTML(
                        block.title || "ملاحظة"
                    )}"
                    placeholder="ملاحظة"
                >

            </div>


            <div class="form-group">

                <label>
                    نص الملاحظة
                </label>

                <textarea
                    class="lecture-block-textarea"
                    data-field="text"
                    data-index="${index}"
                    style="min-height:110px;"
                    placeholder="اكتب الملاحظة..."
                >${escapeHTML(block.text)}</textarea>

            </div>

        `;

    }


    /*-----------------------------------------------
            IMPORTANT
    -----------------------------------------------*/

    else if(block.type === "important"){

        body = `

            <div class="form-group">

                <label>
                    عنوان النقطة المهمة
                </label>

                <input
                    type="text"
                    class="lecture-block-title"
                    data-field="title"
                    data-index="${index}"
                    value="${escapeHTML(
                        block.title || "نقطة مهمة"
                    )}"
                    placeholder="نقطة مهمة"
                >

            </div>


            <div class="form-group">

                <label>
                    المحتوى
                </label>

                <textarea
                    class="lecture-block-textarea"
                    data-field="text"
                    data-index="${index}"
                    style="min-height:110px;"
                    placeholder="اكتب النقطة المهمة..."
                >${escapeHTML(block.text)}</textarea>

            </div>

        `;

    }


    /*-----------------------------------------------
            LIST
    -----------------------------------------------*/

    else if(block.type === "list"){

        body = `

            <div class="form-group">

                <label>
                    عناصر القائمة
                </label>

                <textarea
                    class="lecture-block-list"
                    data-field="items"
                    data-index="${index}"
                    style="
                        min-height:150px;
                        line-height:1.9;
                    "
                    placeholder="كل نقطة في سطر مستقل..."
                >${escapeHTML(
                    block.items.join("\n")
                )}</textarea>

                <small
                    style="
                        display:block;
                        color:#718092;
                        margin-top:6px;
                    "
                >
                    اكتب كل نقطة في سطر منفصل.
                </small>

            </div>

        `;

    }


    /*-----------------------------------------------
            EQUATION
    -----------------------------------------------*/

    else if(block.type === "equation"){

        body = `

            <div class="form-group">

                <label>
                    المعادلة / القانون
                </label>

                <input
                    type="text"
                    class="lecture-block-text"
                    data-field="text"
                    data-index="${index}"
                    value="${escapeHTML(block.text)}"
                    placeholder="مثال: V = I × R"
                    dir="ltr"
                >

                <small
                    style="
                        display:block;
                        color:#718092;
                        margin-top:6px;
                    "
                >
                    اكتب القانون كما تريد ظهوره للطالب.
                </small>

            </div>

        `;

    }


    /*-----------------------------------------------
            VIDEO
    -----------------------------------------------*/

    else if(block.type === "video"){

        body = `

            <div class="form-group">

                <label>
                    فيديو المحاضرة
                </label>

                <div
                    style="
                        border:1px dashed rgba(78,168,255,.2);
                        border-radius:11px;
                        padding:12px;
                    "
                >

                    <input
                        type="file"
                        class="lecture-block-file"
                        data-field="file"
                        data-index="${index}"
                        accept="video/*"
                    >

                    ${
                        block.url
                            ? `
                                <video
                                    controls
                                    preload="metadata"
                                    src="${escapeHTML(block.url)}"
                                    style="
                                        width:100%;
                                        max-height:260px;
                                        margin-top:12px;
                                        border-radius:10px;
                                        background:#05070a;
                                    "
                                ></video>

                                <small
                                    style="
                                        display:block;
                                        color:#718092;
                                        margin-top:7px;
                                    "
                                >
                                    اترك اختيار الملف فارغًا
                                    للاحتفاظ بالفيديو الحالي.
                                </small>
                            `
                            : `
                                <small
                                    style="
                                        display:block;
                                        color:#718092;
                                        margin-top:7px;
                                    "
                                >
                                    اختر فيديو ليظهر داخل المحاضرة.
                                </small>
                            `
                    }

                </div>

            </div>


            <div class="form-group">

                <label>
                    عنوان الفيديو
                </label>

                <input
                    type="text"
                    class="lecture-block-title"
                    data-field="title"
                    data-index="${index}"
                    value="${escapeHTML(block.title)}"
                    placeholder="مثال: شرح عملي للمحاضرة"
                >

            </div>

        `;

    }


    return `

        <div
            class="lecture-builder-block"
            data-index="${index}"
            style="
                margin-bottom:14px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(0,0,0,.12);
                border-radius:13px;
                overflow:hidden;
            "
        >

            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:8px;
                    padding:11px 12px;
                    border-bottom:1px solid rgba(255,255,255,.06);
                    background:rgba(255,255,255,.025);
                "
            >

                <div
                    style="
                        display:flex;
                        align-items:center;
                        gap:8px;
                        min-width:0;
                    "
                >

                    <span
                        style="
                            font-size:18px;
                        "
                    >
                        ${info.icon}
                    </span>

                    <strong
                        style="
                            font-size:13px;
                        "
                    >
                        ${escapeHTML(info.label)}
                    </strong>

                    <span
                        style="
                            color:#647383;
                            font-size:11px;
                        "
                    >
                        #${index + 1}
                    </span>

                </div>


                <div
                    style="
                        display:flex;
                        gap:5px;
                        flex-wrap:wrap;
                    "
                >

                    <button
                        type="button"
                        class="lecture-block-up"
                        data-index="${index}"
                        title="تحريك لأعلى"
                        style="
                            border:1px solid rgba(255,255,255,.08);
                            background:rgba(255,255,255,.03);
                            color:#dbe4ed;
                            width:34px;
                            height:32px;
                            border-radius:8px;
                            cursor:pointer;
                        "
                    >
                        ↑
                    </button>

                    <button
                        type="button"
                        class="lecture-block-down"
                        data-index="${index}"
                        title="تحريك لأسفل"
                        style="
                            border:1px solid rgba(255,255,255,.08);
                            background:rgba(255,255,255,.03);
                            color:#dbe4ed;
                            width:34px;
                            height:32px;
                            border-radius:8px;
                            cursor:pointer;
                        "
                    >
                        ↓
                    </button>

                    <button
                        type="button"
                        class="lecture-block-delete"
                        data-index="${index}"
                        title="حذف العنصر"
                        style="
                            border:1px solid rgba(255,80,80,.15);
                            background:rgba(255,80,80,.05);
                            color:#ff8d8d;
                            width:34px;
                            height:32px;
                            border-radius:8px;
                            cursor:pointer;
                        "
                    >
                        🗑️
                    </button>

                </div>

            </div>


            <div
                style="
                    padding:13px;
                "
            >

                ${body}

            </div>

        </div>

    `;
}


/*=========================================================
            ATTACH BLOCK EVENTS
=========================================================*/

function attachLectureBlockEvents(){

    const container =
        document.getElementById(
            "lectureBlocksContainer"
        );


    if(!container){
        return;
    }


    /*-----------------------------------------------
            TEXT INPUTS
    -----------------------------------------------*/

    container
        .querySelectorAll(
            "[data-field]"
        )
        .forEach(element => {

            const field =
                element.dataset.field;

            const index =
                Number(
                    element.dataset.index
                );


            if(
                field === "file"
            ){
                return;
            }


            element.addEventListener(
                "input",
                () => {

                    const block =
                        lectureBlocks[index];

                    if(!block){
                        return;
                    }


                    if(field === "items"){

                        block.items =
                            element.value
                                .split("\n")
                                .map(
                                    item =>
                                        item.trim()
                                )
                                .filter(
                                    item =>
                                        item.length > 0
                                );

                        return;
                    }


                    block[field] =
                        element.value;

                }
            );

        });


    /*-----------------------------------------------
            FILE INPUTS
    -----------------------------------------------*/

    container
        .querySelectorAll(
            ".lecture-block-file"
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    const index =
                        Number(
                            input.dataset.index
                        );

                    const block =
                        lectureBlocks[index];

                    if(!block){
                        return;
                    }


                    const file =
                        input.files?.[0];


                    if(!file){
                        return;
                    }


                    block._file =
                        file;


                    const parent =
                        input.parentElement;


                    let preview =
                        parent.querySelector(
                            ".new-file-preview"
                        );


                    if(preview){
                        preview.remove();
                    }


                    preview =
                        document.createElement(
                            "div"
                        );


                    preview.className =
                        "new-file-preview";


                    preview.style.cssText = `
                        margin-top:10px;
                        padding:9px;
                        border-radius:8px;
                        background:rgba(78,168,255,.06);
                        color:#4ea8ff;
                        font-size:12px;
                    `;


                    preview.textContent =
                        `📎 الملف الجديد: ${file.name}`;


                    parent.appendChild(
                        preview
                    );

                }
            );

        });


    /*-----------------------------------------------
            MOVE UP
    -----------------------------------------------*/

    container
        .querySelectorAll(
            ".lecture-block-up"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    if(index <= 0){
                        return;
                    }


                    const temp =
                        lectureBlocks[index - 1];


                    lectureBlocks[index - 1] =
                        lectureBlocks[index];

                    lectureBlocks[index] =
                        temp;


                    renderLectureBlocks();

                }
            );

        });


    /*-----------------------------------------------
            MOVE DOWN
    -----------------------------------------------*/

    container
        .querySelectorAll(
            ".lecture-block-down"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    if(
                        index >=
                        lectureBlocks.length - 1
                    ){
                        return;
                    }


                    const temp =
                        lectureBlocks[index + 1];


                    lectureBlocks[index + 1] =
                        lectureBlocks[index];

                    lectureBlocks[index] =
                        temp;


                    renderLectureBlocks();

                }
            );

        });


    /*-----------------------------------------------
            DELETE
    -----------------------------------------------*/

    container
        .querySelectorAll(
            ".lecture-block-delete"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    const confirmed =
                        confirm(
                            "هل تريد حذف هذا العنصر من المحاضرة؟"
                        );


                    if(!confirmed){
                        return;
                    }


                    lectureBlocks.splice(
                        index,
                        1
                    );


                    renderLectureBlocks();

                }
            );

        });

}


/*=========================================================
            SAVE LECTURE
=========================================================*/

async function saveLecture(){

    const subjectId =
        document
            .getElementById("lectureSubject")
            ?.value;


    const title =
        document
            .getElementById("lectureTitle")
            ?.value
            .trim();


    const description =
        document
            .getElementById("lectureDescription")
            ?.value
            .trim();


    if(!subjectId){

        showNotification(
            "اختر المادة",
            "warning"
        );

        return;
    }


    if(!title){

        showNotification(
            "اكتب عنوان المحاضرة",
            "warning"
        );

        return;
    }


    if(
        !Array.isArray(lectureBlocks) ||
        lectureBlocks.length === 0
    ){

        showNotification(
            "أضف عنصرًا واحدًا على الأقل إلى المحاضرة",
            "warning"
        );

        return;
    }


    const oldLecture =
        editingId
            ? lectures.find(
                item =>
                    item.id === editingId
            )
            : null;


    try{

        showNotification(
            "جاري تجهيز المحاضرة..."
        );


        /*
         * نعمل نسخة حتى لا نعدل
         * الحالة الأصلية أثناء الرفع.
         */

        const blocksToSave =
            lectureBlocks.map(
                block => ({
                    ...block
                })
            );


        /*-------------------------------------------
                UPLOAD FILES
        -------------------------------------------*/

        for(
            let index = 0;
            index < blocksToSave.length;
            index++
        ){

            const block =
                blocksToSave[index];


            if(!block._file){
                continue;
            }


            if(block.type === "image"){

                showNotification(
                    `جاري رفع صورة العنصر ${index + 1}...`
                );

            }
            else if(block.type === "video"){

                showNotification(
                    `جاري رفع فيديو العنصر ${index + 1}...`
                );

            }


            const result =
                await uploadToCloudinary(
                    block._file,
                    percent => {

                        console.log(
                            `Upload ${index + 1}: ${percent}%`
                        );

                    }
                );


            block.url =
                result.secure_url || "";

            block.publicId =
                result.public_id || "";

            block.fileName =
                block._file.name || "";


            delete block._file;

        }


        /*
         * إزالة أي بيانات مؤقتة
         */

        const cleanBlocks =
            blocksToSave.map(
                block => {

                    const clean = {
                        id:
                            block.id,

                        type:
                            block.type,

                        text:
                            block.text || "",

                        title:
                            block.title || "",

                        caption:
                            block.caption || "",

                        url:
                            block.url || "",

                        publicId:
                            block.publicId || "",

                        items:
                            Array.isArray(block.items)
                                ? block.items
                                : [],

                        level:
                            block.level || 2,

                        fileName:
                            block.fileName || ""
                    };


                    return clean;

                }
            );


        /*
         * الحقول القديمة نحافظ عليها
         * فقط حتى لا نكسر أي بيانات قديمة.
         */

        let legacyContent =
            oldLecture?.content || "";

        let legacyImageUrl =
            oldLecture?.imageUrl || "";

        let legacyImagePublicId =
            oldLecture?.imagePublicId || "";

        let legacyVideoUrl =
            oldLecture?.videoUrl || "";

        let legacyVideoPublicId =
            oldLecture?.videoPublicId || "";


        /*
         * إذا كانت محاضرة جديدة،
         * نستطيع إنشاء نسخة توافقية
         * من أول فقرة/صورة/فيديو.
         */

        if(!legacyContent){

            const paragraph =
                cleanBlocks.find(
                    block =>
                        block.type ===
                        "paragraph"
                );


            if(paragraph){

                legacyContent =
                    paragraph.text || "";

            }

        }


        if(!legacyImageUrl){

            const image =
                cleanBlocks.find(
                    block =>
                        block.type ===
                        "image" &&
                        block.url
                );


            if(image){

                legacyImageUrl =
                    image.url;

                legacyImagePublicId =
                    image.publicId || "";

            }

        }


        if(!legacyVideoUrl){

            const video =
                cleanBlocks.find(
                    block =>
                        block.type ===
                        "video" &&
                        block.url
                );


            if(video){

                legacyVideoUrl =
                    video.url;

                legacyVideoPublicId =
                    video.publicId || "";

            }

        }


        const data = {

            subjectId,

            title,

            description,

            blocks:
                cleanBlocks,

            /*
             * Legacy compatibility
             */

            content:
                legacyContent,

            imageUrl:
                legacyImageUrl,

            imagePublicId:
                legacyImagePublicId,

            videoUrl:
                legacyVideoUrl,

            videoPublicId:
                legacyVideoPublicId,

            updatedAt:
                serverTimestamp()

        };


        /*-------------------------------------------
                UPDATE
        -------------------------------------------*/

        if(editingId){

            await updateDoc(
                doc(
                    db,
                    "lectures",
                    editingId
                ),
                data
            );


            showNotification(
                "تم تعديل المحاضرة بنجاح"
            );

        }


        /*-------------------------------------------
                CREATE
        -------------------------------------------*/

        else{

            await addDoc(
                collection(
                    db,
                    "lectures"
                ),
                {

                    ...data,

                    createdAt:
                        serverTimestamp(),

                    createdBy:
                        currentUser.uid

                }
            );


            showNotification(
                "تمت إضافة المحاضرة بنجاح"
            );

        }


        closeModal();

        lectureBlocks = [];

        await loadLectures();

        updateStatistics();

    }
    catch(error){

        console.error(
            "Save lecture:",
            error
        );


        showNotification(
            "تعذر حفظ المحاضرة: " +
            getFirebaseErrorMessage(error),
            "error"
        );

    }
}


/*=========================================================
                    LOAD EXAMS
=========================================================*/

async function loadExams(){

    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "exams"
                )
            );


        exams =
            snapshot.docs.map(
                item => ({
                    id:item.id,
                    ...item.data()
                })
            );


        exams.sort(
            (a,b) => {

                return (
                    getTimestampNumber(
                        b.createdAt
                    ) -
                    getTimestampNumber(
                        a.createdAt
                    )
                );

            }
        );


        renderExams();

    }
    catch(error){

        console.error(
            "Load exams:",
            error
        );


        exams = [];

        renderExams();


        showNotification(
            "تعذر تحميل الامتحانات",
            "error"
        );

    }
}


/*=========================================================
                    RENDER EXAMS
=========================================================*/

function renderExams(){

    if(!examsList){
        return;
    }


    if(exams.length === 0){

        examsList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📝
                </div>

                <h3>
                    لا توجد امتحانات
                </h3>

                <p>
                    ابدأ بإنشاء أول امتحان.
                </p>

            </div>
        `;

        return;
    }


    examsList.innerHTML =
        exams.map(exam => {

            const subject =
                findSubject(
                    exam.subjectId
                );


            return `

                <div class="content-item">

                    <div>

                        <strong
                            style="
                                display:block;
                                font-size:16px;
                                margin-bottom:6px;
                            "
                        >
                            ${escapeHTML(
                                exam.title ||
                                "بدون عنوان"
                            )}
                        </strong>

                        <span
                            style="
                                color:#4ea8ff;
                                font-size:11px;
                                display:block;
                                margin-bottom:5px;
                            "
                        >
                            ${escapeHTML(
                                subject?.name ||
                                "مادة غير معروفة"
                            )}
                        </span>

                        <span
                            style="
                                color:#7f8d9c;
                                font-size:12px;
                            "
                        >
                            الوقت:
                            ${Number(
                                exam.duration || 0
                            )}
                            دقيقة
                            |
                            الدرجة:
                            ${Number(
                                exam.totalMarks || 0
                            )}
                        </span>

                    </div>


                    <div
                        style="
                            display:flex;
                            gap:8px;
                            flex-wrap:wrap;
                        "
                    >

                        <button
                            type="button"
                            class="edit-content-btn"
                            data-type="exam"
                            data-id="${escapeHTML(exam.id)}"
                            style="
                                border:1px solid rgba(78,168,255,.2);
                                background:rgba(78,168,255,.08);
                                color:#4ea8ff;
                                padding:9px 12px;
                                border-radius:9px;
                                cursor:pointer;
                                font-family:inherit;
                            "
                        >
                            ✏️ تعديل
                        </button>

                        <button
                            type="button"
                            class="delete-content-btn"
                            data-type="exam"
                            data-id="${escapeHTML(exam.id)}"
                            style="
                                border:1px solid rgba(255,80,80,.15);
                                background:rgba(255,80,80,.06);
                                color:#ff8d8d;
                                padding:9px 12px;
                                border-radius:9px;
                                cursor:pointer;
                                font-family:inherit;
                            "
                        >
                            🗑️ حذف
                        </button>

                    </div>

                </div>

            `;

        }).join("");
}


/*=========================================================
                    EXAM MODAL
=========================================================*/

function openExamModal(
    exam = null
){

    editingId =
        exam?.id || null;

    currentModalType =
        "exam";


    const subjectOptions =
        subjects.map(subject => {

            const selected =
                exam?.subjectId ===
                subject.id
                    ? "selected"
                    : "";

            return `
                <option
                    value="${escapeHTML(subject.id)}"
                    ${selected}
                >
                    ${escapeHTML(
                        subject.name
                    )}
                </option>
            `;

        }).join("");


    createModal({

        title:
            exam
                ? "تعديل الامتحان"
                : "إنشاء امتحان",

        content: `

            <div class="form-group">

                <label>
                    المادة
                </label>

                <select id="examSubject">

                    <option value="">
                        اختر المادة
                    </option>

                    ${subjectOptions}

                </select>

            </div>


            <div class="form-group">

                <label>
                    عنوان الامتحان
                </label>

                <input
                    type="text"
                    id="examTitle"
                    value="${escapeHTML(
                        exam?.title || ""
                    )}"
                    placeholder="مثال: امتحان الوحدة الأولى"
                >

            </div>


            <div class="form-group">

                <label>
                    وصف الامتحان
                </label>

                <textarea
                    id="examDescription"
                    placeholder="وصف الامتحان..."
                >${escapeHTML(
                    exam?.description || ""
                )}</textarea>

            </div>


            <div class="form-group">

                <label>
                    مدة الامتحان بالدقائق
                </label>

                <input
                    type="number"
                    id="examDuration"
                    min="1"
                    value="${Number(
                        exam?.duration || 30
                    )}"
                >

            </div>


            <div class="form-group">

                <label>
                    الدرجة النهائية
                </label>

                <input
                    type="number"
                    id="examTotalMarks"
                    min="1"
                    value="${Number(
                        exam?.totalMarks || 10
                    )}"
                >

            </div>


            <div class="form-group">

                <label>
                    الأسئلة
                </label>

                <textarea
                    id="examQuestions"
                    style="min-height:220px;"
                    placeholder="اكتب الأسئلة هنا..."
                >${escapeHTML(
                    exam?.questionsText || ""
                )}</textarea>

            </div>


            <div class="form-group">

                <label>
                    مفتاح الإجابات
                </label>

                <textarea
                    id="examAnswerKey"
                    style="min-height:150px;"
                    placeholder="اكتب الإجابات بالترتيب..."
                >${escapeHTML(
                    exam?.answerKey || ""
                )}</textarea>

            </div>

        `,

        saveText:
            exam
                ? "حفظ التعديلات"
                : "إنشاء الامتحان",

        saveHandler:
            saveExam

    });
}


/*=========================================================
                    SAVE EXAM
=========================================================*/

async function saveExam(){

    const subjectId =
        document
            .getElementById("examSubject")
            ?.value;


    const title =
        document
            .getElementById("examTitle")
            ?.value
            .trim();


    const description =
        document
            .getElementById("examDescription")
            ?.value
            .trim();


    const duration =
        Number(
            document
                .getElementById("examDuration")
                ?.value || 0
        );


    const totalMarks =
        Number(
            document
                .getElementById("examTotalMarks")
                ?.value || 0
        );


    const questionsText =
        document
            .getElementById("examQuestions")
            ?.value
            .trim();


    const answerKey =
        document
            .getElementById("examAnswerKey")
            ?.value
            .trim();


    if(!subjectId){

        showNotification(
            "اختر المادة",
            "warning"
        );

        return;
    }


    if(!title){

        showNotification(
            "اكتب عنوان الامتحان",
            "warning"
        );

        return;
    }


    if(duration <= 0){

        showNotification(
            "أدخل مدة صحيحة للامتحان",
            "warning"
        );

        return;
    }


    if(totalMarks <= 0){

        showNotification(
            "أدخل الدرجة النهائية",
            "warning"
        );

        return;
    }


    try{

        const data = {

            subjectId,

            title,

            description,

            duration,

            totalMarks,

            questionsText,

            answerKey,

            updatedAt:
                serverTimestamp()

        };


        if(editingId){

            await updateDoc(
                doc(
                    db,
                    "exams",
                    editingId
                ),
                data
            );


            showNotification(
                "تم تعديل الامتحان بنجاح"
            );

        }
        else{

            await addDoc(
                collection(
                    db,
                    "exams"
                ),
                {

                    ...data,

                    createdAt:
                        serverTimestamp(),

                    createdBy:
                        currentUser.uid

                }
            );


            showNotification(
                "تم إنشاء الامتحان بنجاح"
            );

        }


        closeModal();

        await loadExams();

        updateStatistics();

    }
    catch(error){

        console.error(
            "Save exam:",
            error
        );


        showNotification(
            "تعذر حفظ الامتحان: " +
            getFirebaseErrorMessage(error),
            "error"
        );

    }
}


/*=========================================================
                    LOAD SHEETS
=========================================================*/

async function loadSheets(){

    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "sheets"
                )
            );


        sheets =
            snapshot.docs.map(
                item => ({
                    id:item.id,
                    ...item.data()
                })
            );


        sheets.sort(
            (a,b) => {

                return (
                    getTimestampNumber(
                        b.createdAt
                    ) -
                    getTimestampNumber(
                        a.createdAt
                    )
                );

            }
        );


        renderSheets();

    }
    catch(error){

        console.error(
            "Load sheets:",
            error
        );


        sheets = [];

        renderSheets();


        showNotification(
            "تعذر تحميل الشيتات والأخبار",
            "error"
        );

    }
}


/*=========================================================
                    RENDER SHEETS
=========================================================*/

function renderSheets(){

    if(!sheetsList){
        return;
    }


    if(sheets.length === 0){

        sheetsList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📢
                </div>

                <h3>
                    لا يوجد محتوى
                </h3>

                <p>
                    ابدأ بإضافة شيت أو خبر.
                </p>

            </div>
        `;

        return;
    }


    sheetsList.innerHTML =
        sheets.map(sheet => {

            const subject =
                findSubject(
                    sheet.subjectId
                );


            return `

                <div class="content-item">

                    <div>

                        <strong
                            style="
                                display:block;
                                font-size:16px;
                                margin-bottom:6px;
                            "
                        >
                            ${escapeHTML(
                                sheet.title ||
                                "بدون عنوان"
                            )}
                        </strong>

                        <span
                            style="
                                color:#4ea8ff;
                                font-size:11px;
                                display:block;
                                margin-bottom:5px;
                            "
                        >
                            ${escapeHTML(
                                sheet.type ||
                                "محتوى"
                            )}

                            ${
                                subject
                                    ? " • " +
                                      escapeHTML(
                                          subject.name
                                      )
                                    : ""
                            }

                        </span>

                        <span
                            style="
                                color:#7f8d9c;
                                font-size:12px;
                            "
                        >
                            ${escapeHTML(
                                sheet.content ||
                                "لا يوجد وصف"
                            )}
                        </span>

                    </div>


                    <div
                        style="
                            display:flex;
                            gap:8px;
                            flex-wrap:wrap;
                        "
                    >

                        <button
                            type="button"
                            class="edit-content-btn"
                            data-type="sheet"
                            data-id="${escapeHTML(sheet.id)}"
                            style="
                                border:1px solid rgba(78,168,255,.2);
                                background:rgba(78,168,255,.08);
                                color:#4ea8ff;
                                padding:9px 12px;
                                border-radius:9px;
                                cursor:pointer;
                                font-family:inherit;
                            "
                        >
                            ✏️ تعديل
                        </button>

                        <button
                            type="button"
                            class="delete-content-btn"
                            data-type="sheet"
                            data-id="${escapeHTML(sheet.id)}"
                            style="
                                border:1px solid rgba(255,80,80,.15);
                                background:rgba(255,80,80,.06);
                                color:#ff8d8d;
                                padding:9px 12px;
                                border-radius:9px;
                                cursor:pointer;
                                font-family:inherit;
                            "
                        >
                            🗑️ حذف
                        </button>

                    </div>

                </div>

            `;

        }).join("");
}


/*=========================================================
                    SHEET MODAL
=========================================================*/

function openSheetModal(
    sheet = null
){

    editingId =
        sheet?.id || null;

    currentModalType =
        "sheet";


    const subjectOptions =
        subjects.map(subject => {

            const selected =
                sheet?.subjectId ===
                subject.id
                    ? "selected"
                    : "";

            return `
                <option
                    value="${escapeHTML(subject.id)}"
                    ${selected}
                >
                    ${escapeHTML(
                        subject.name
                    )}
                </option>
            `;

        }).join("");


    createModal({

        title:
            sheet
                ? "تعديل المحتوى"
                : "إضافة شيت / خبر",

        content: `

            <div class="form-group">

                <label>
                    النوع
                </label>

                <select id="sheetType">

                    <option
                        value="شيت"
                        ${
                            sheet?.type === "شيت"
                                ? "selected"
                                : ""
                        }
                    >
                        شيت
                    </option>

                    <option
                        value="واجب"
                        ${
                            sheet?.type === "واجب"
                                ? "selected"
                                : ""
                        }
                    >
                        واجب
                    </option>

                    <option
                        value="خبر"
                        ${
                            sheet?.type === "خبر"
                                ? "selected"
                                : ""
                        }
                    >
                        خبر
                    </option>

                    <option
                        value="مهم"
                        ${
                            sheet?.type === "مهم"
                                ? "selected"
                                : ""
                        }
                    >
                        مهم
                    </option>

                </select>

            </div>


            <div class="form-group">

                <label>
                    المادة
                </label>

                <select id="sheetSubject">

                    <option value="">
                        عام / بدون مادة
                    </option>

                    ${subjectOptions}

                </select>

            </div>


            <div class="form-group">

                <label>
                    العنوان
                </label>

                <input
                    type="text"
                    id="sheetTitle"
                    value="${escapeHTML(
                        sheet?.title || ""
                    )}"
                    placeholder="عنوان الشيت أو الخبر"
                >

            </div>


            <div class="form-group">

                <label>
                    المحتوى
                </label>

                <textarea
                    id="sheetContent"
                    style="min-height:180px;"
                    placeholder="اكتب المحتوى..."
                >${escapeHTML(
                    sheet?.content || ""
                )}</textarea>

            </div>


            <div class="form-group">

                <label>
                    ملف / صورة
                </label>

                <div class="upload-box">

                    <input
                        type="file"
                        id="sheetFile"
                        accept="image/*,.pdf,.doc,.docx"
                    >

                    <p>
                        ${
                            sheet?.fileUrl
                                ? "اتركه فارغًا للاحتفاظ بالملف الحالي"
                                : "اختياري"
                        }
                    </p>

                </div>

            </div>

        `,

        saveText:
            sheet
                ? "حفظ التعديلات"
                : "إضافة المحتوى",

        saveHandler:
            saveSheet

    });
}


/*=========================================================
                    SAVE SHEET
=========================================================*/

async function saveSheet(){

    const type =
        document
            .getElementById("sheetType")
            ?.value;


    const subjectId =
        document
            .getElementById("sheetSubject")
            ?.value;


    const title =
        document
            .getElementById("sheetTitle")
            ?.value
            .trim();


    const content =
        document
            .getElementById("sheetContent")
            ?.value
            .trim();


    const file =
        document
            .getElementById("sheetFile")
            ?.files?.[0];


    if(!title){

        showNotification(
            "اكتب عنوان المحتوى",
            "warning"
        );

        return;
    }


    const oldSheet =
        editingId
            ? sheets.find(
                item =>
                    item.id === editingId
            )
            : null;


    try{

        let fileUrl =
            oldSheet?.fileUrl || "";

        let filePublicId =
            oldSheet?.filePublicId || "";


        if(file){

            showNotification(
                "جاري رفع الملف..."
            );


            const result =
                await uploadToCloudinary(
                    file
                );


            fileUrl =
                result.secure_url || "";

            filePublicId =
                result.public_id || "";

        }


        const data = {

            type:
                type || "شيت",

            subjectId:
                subjectId || "",

            title,

            content,

            fileUrl,

            filePublicId,

            updatedAt:
                serverTimestamp()

        };


        if(editingId){

            await updateDoc(
                doc(
                    db,
                    "sheets",
                    editingId
                ),
                data
            );


            showNotification(
                "تم تعديل المحتوى بنجاح"
            );

        }
        else{

            await addDoc(
                collection(
                    db,
                    "sheets"
                ),
                {

                    ...data,

                    createdAt:
                        serverTimestamp(),

                    createdBy:
                        currentUser.uid

                }
            );


            showNotification(
                "تمت إضافة المحتوى بنجاح"
            );

        }


        closeModal();

        await loadSheets();

    }
    catch(error){

        console.error(
            "Save sheet:",
            error
        );


        showNotification(
            "تعذر حفظ المحتوى: " +
            getFirebaseErrorMessage(error),
            "error"
        );

    }
}


/*=========================================================
                    LOAD STUDENTS
=========================================================*/

async function loadStudents(){

    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        students =
            snapshot.docs
                .map(
                    item => ({
                        id:item.id,
                        ...item.data()
                    })
                )
                .filter(
                    student =>
                        student.role !== "admin"
                );


        renderStudents(
            students
        );


        updateStatistics();

    }
    catch(error){

        console.error(
            "Load students:",
            error
        );


        students = [];

        renderStudents([]);


        showNotification(
            "تعذر تحميل الطلاب",
            "error"
        );

    }
}


/*=========================================================
                    RENDER STUDENTS
=========================================================*/

function renderStudents(
    list
){

    if(!studentsList){
        return;
    }


    if(list.length === 0){

        studentsList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    👨‍🎓
                </div>

                <h3>
                    لا يوجد طلاب
                </h3>

                <p>
                    لا توجد نتائج مطابقة.
                </p>

            </div>
        `;

        return;
    }


    studentsList.innerHTML =
        list.map(student => {

            const name =
                student.name ||
                student.studentName ||
                "بدون اسم";


            const studentId =
                student.studentId ||
                student.studentNumber ||
                "غير مسجل";


            const phone =
                student.phone ||
                "";


            const email =
                student.email ||
                "";


            return `

                <div class="content-item">

                    <div>

                        <strong
                            style="
                                display:block;
                                font-size:16px;
                                margin-bottom:7px;
                            "
                        >
                            ${escapeHTML(name)}
                        </strong>

                        <span
                            style="
                                color:#4ea8ff;
                                display:block;
                                font-size:12px;
                                margin-bottom:5px;
                            "
                        >
                            رقم الطالب:
                            ${escapeHTML(studentId)}
                        </span>

                        ${
                            email
                                ? `
                                    <span
                                        style="
                                            color:#7f8d9c;
                                            display:block;
                                            font-size:12px;
                                        "
                                    >
                                        ${escapeHTML(email)}
                                    </span>
                                `
                                : ""
                        }

                        ${
                            phone
                                ? `
                                    <span
                                        style="
                                            color:#7f8d9c;
                                            display:block;
                                            font-size:12px;
                                            margin-top:3px;
                                        "
                                    >
                                        📱 ${escapeHTML(phone)}
                                    </span>
                                `
                                : ""
                        }

                    </div>


                    <div>

                        <span
                            style="
                                color:#697888;
                                font-size:11px;
                            "
                        >
                            ${
                                formatDate(
                                    student.createdAt
                                )
                            }
                        </span>

                    </div>

                </div>

            `;

        }).join("");
}


/*=========================================================
                    STUDENT SEARCH
=========================================================*/

function searchStudents(){

    const search =
        studentSearch
            ?.value
            .trim()
            .toLowerCase();


    if(!search){

        renderStudents(
            students
        );

        return;
    }


    const filtered =
        students.filter(student => {

            const name =
                String(
                    student.name ||
                    student.studentName ||
                    ""
                ).toLowerCase();


            const studentId =
                String(
                    student.studentId ||
                    student.studentNumber ||
                    ""
                ).toLowerCase();


            const email =
                String(
                    student.email ||
                    ""
                ).toLowerCase();


            const phone =
                String(
                    student.phone ||
                    ""
                ).toLowerCase();


            return (
                name.includes(search) ||
                studentId.includes(search) ||
                email.includes(search) ||
                phone.includes(search)
            );

        });


    renderStudents(
        filtered
    );
}


if(studentSearchBtn){

    studentSearchBtn.addEventListener(
        "click",
        searchStudents
    );

}


if(studentSearch){

    studentSearch.addEventListener(
        "input",
        searchStudents
    );


    studentSearch.addEventListener(
        "keydown",
        event => {

            if(event.key === "Enter"){

                searchStudents();

            }

        }
    );

}


/*=========================================================
                    LOAD RESULTS
=========================================================*/

async function loadResults(){

    try{

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "results"
                )
            );


        results =
            snapshot.docs.map(
                item => ({
                    id:item.id,
                    ...item.data()
                })
            );


        results.sort(
            (a,b) => {

                return (
                    getTimestampNumber(
                        b.createdAt
                    ) -
                    getTimestampNumber(
                        a.createdAt
                    )
                );

            }
        );


        renderResults();

    }
    catch(error){

        console.error(
            "Load results:",
            error
        );


        results = [];

        renderResults();


        showNotification(
            "تعذر تحميل النتائج",
            "error"
        );

    }
}


/*=========================================================
                    RENDER RESULTS
=========================================================*/

function renderResults(){

    if(!resultsList){
        return;
    }


    if(results.length === 0){

        resultsList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📊
                </div>

                <h3>
                    لا توجد نتائج
                </h3>

                <p>
                    النتائج ستظهر هنا بعد تسجيل الطلاب للامتحانات.
                </p>

            </div>
        `;

        return;
    }


    resultsList.innerHTML =
        results.map(result => {

            const student =
                students.find(
                    item =>
                        item.id ===
                        result.studentId
                );


            const exam =
                exams.find(
                    item =>
                        item.id ===
                        result.examId
                );


            const studentName =
                student?.name ||
                student?.studentName ||
                result.studentName ||
                "طالب غير معروف";


            const examTitle =
                exam?.title ||
                result.examTitle ||
                "امتحان غير معروف";


            const score =
                Number(
                    result.score || 0
                );


            const total =
                Number(
                    result.totalMarks ||
                    result.total ||
                    0
                );


            return `

                <div class="content-item">

                    <div>

                        <strong
                            style="
                                display:block;
                                font-size:16px;
                                margin-bottom:6px;
                            "
                        >
                            ${escapeHTML(
                                studentName
                            )}
                        </strong>

                        <span
                            style="
                                color:#4ea8ff;
                                display:block;
                                font-size:12px;
                                margin-bottom:5px;
                            "
                        >
                            ${escapeHTML(
                                examTitle
                            )}
                        </span>

                        <span
                            style="
                                color:#7f8d9c;
                                font-size:12px;
                            "
                        >
                            النتيجة:
                            ${score}
                            ${
                                total
                                    ? ` / ${total}`
                                    : ""
                            }
                        </span>

                    </div>


                    <div>

                        <span
                            style="
                                color:#697888;
                                font-size:11px;
                            "
                        >
                            ${formatDate(
                                result.createdAt
                            )}
                        </span>

                    </div>

                </div>

            `;

        }).join("");
}


/*=========================================================
                    STATISTICS
=========================================================*/

function updateStatistics(){

    if(subjectsCount){

        subjectsCount.textContent =
            subjects.length;

    }


    if(lecturesCount){

        lecturesCount.textContent =
            lectures.length;

    }


    if(examsCount){

        examsCount.textContent =
            exams.length;

    }


    if(studentsCount){

        studentsCount.textContent =
            students.length;

    }

}


/*=========================================================
                    FIND SUBJECT
=========================================================*/

function findSubject(
    subjectId
){

    if(!subjectId){
        return null;
    }


    return subjects.find(
        subject =>
            subject.id === subjectId
    ) || null;
}


/*=========================================================
                    TIMESTAMP
=========================================================*/

function getTimestampNumber(
    value
){

    if(!value){
        return 0;
    }


    if(
        typeof value.toMillis ===
        "function"
    ){

        return value.toMillis();

    }


    if(
        typeof value.seconds ===
        "number"
    ){

        return value.seconds * 1000;

    }


    const date =
        new Date(value);


    if(isNaN(date.getTime())){
        return 0;
    }


    return date.getTime();
}


/*=========================================================
                    MODAL SYSTEM
=========================================================*/

function createModal({

    title,
    content,
    saveText,
    saveHandler

}){

    closeModal();


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "modal active";


    modal.id =
        "adminModal";


    modal.innerHTML = `

        <div
            class="modal-content"
            role="dialog"
            aria-modal="true"
        >

            <div class="modal-header">

                <h2>
                    ${escapeHTML(title)}
                </h2>

                <button
                    type="button"
                    class="modal-close"
                    id="closeModalBtn"
                    aria-label="إغلاق"
                >
                    ×
                </button>

            </div>


            <div>

                ${content}

            </div>


            <div class="form-actions">

                <button
                    type="button"
                    class="primary-btn"
                    id="modalSaveBtn"
                >
                    ${escapeHTML(saveText)}
                </button>

                <button
                    type="button"
                    class="cancel-btn"
                    id="modalCancelBtn"
                >
                    إلغاء
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const closeButton =
        document.getElementById(
            "closeModalBtn"
        );


    const cancelButton =
        document.getElementById(
            "modalCancelBtn"
        );


    const saveButton =
        document.getElementById(
            "modalSaveBtn"
        );


    closeButton.addEventListener(
        "click",
        closeModal
    );


    cancelButton.addEventListener(
        "click",
        closeModal
    );


    modal.addEventListener(
        "click",
        event => {

            if(
                event.target ===
                modal
            ){

                closeModal();

            }

        }
    );


    saveButton.addEventListener(
        "click",
        async () => {

            saveButton.disabled =
                true;

            saveButton.style.opacity =
                ".6";

            saveButton.textContent =
                "جاري الحفظ...";


            try{

                await saveHandler();

            }
            catch(error){

                console.error(
                    "Modal save handler:",
                    error
                );

            }
            finally{

                if(
                    document.body.contains(
                        saveButton
                    )
                ){

                    saveButton.disabled =
                        false;

                    saveButton.style.opacity =
                        "1";

                    saveButton.textContent =
                        saveText;

                }

            }

        }
    );


    setTimeout(() => {

        const firstInput =
            modal.querySelector(
                "input, textarea, select"
            );


        if(firstInput){

            firstInput.focus();

        }

    },100);

}


/*=========================================================
                    CLOSE MODAL
=========================================================*/

function closeModal(){

    const modal =
        document.getElementById(
            "adminModal"
        );


    if(modal){

        modal.remove();

    }


    const blockMenu =
        document.getElementById(
            "lectureBlockMenu"
        );


    if(blockMenu){

        blockMenu.remove();

    }


    editingId = null;

    currentModalType = null;

    lectureBlocks = [];

}


/*=========================================================
                    EDIT / DELETE EVENTS
=========================================================*/

document.addEventListener(
    "click",
    async event => {

        const editButton =
            event.target.closest(
                ".edit-content-btn"
            );


        const deleteButton =
            event.target.closest(
                ".delete-content-btn"
            );


        if(editButton){

            const type =
                editButton.dataset.type;


            const id =
                editButton.dataset.id;


            handleEdit(
                type,
                id
            );

            return;

        }


        if(deleteButton){

            const type =
                deleteButton.dataset.type;


            const id =
                deleteButton.dataset.id;


            await handleDelete(
                type,
                id
            );

        }

    }
);


/*=========================================================
                    HANDLE EDIT
=========================================================*/

function handleEdit(
    type,
    id
){

    if(type === "subject"){

        const item =
            subjects.find(
                subject =>
                    subject.id === id
            );


        if(item){

            openSubjectModal(
                item
            );

        }

        return;
    }


    if(type === "lecture"){

        const item =
            lectures.find(
                lecture =>
                    lecture.id === id
            );


        if(item){

            openLectureModal(
                item
            );

        }

        return;
    }


    if(type === "exam"){

        const item =
            exams.find(
                exam =>
                    exam.id === id
            );


        if(item){

            openExamModal(
                item
            );

        }

        return;
    }


    if(type === "sheet"){

        const item =
            sheets.find(
                sheet =>
                    sheet.id === id
            );


        if(item){

            openSheetModal(
                item
            );

        }

        return;
    }

}


/*=========================================================
                    HANDLE DELETE
=========================================================*/

async function handleDelete(
    type,
    id
){

    let collectionName = "";

    let itemName = "العنصر";


    if(type === "subject"){

        collectionName =
            "subjects";

        itemName =
            "المادة";

    }


    if(type === "lecture"){

        collectionName =
            "lectures";

        itemName =
            "المحاضرة";

    }


    if(type === "exam"){

        collectionName =
            "exams";

        itemName =
            "الامتحان";

    }


    if(type === "sheet"){

        collectionName =
            "sheets";

        itemName =
            "المحتوى";

    }


    if(!collectionName){
        return;
    }


    const confirmed =
        confirm(
            `هل أنت متأكد من حذف ${itemName}؟\n\nهذا الإجراء لا يمكن التراجع عنه.`
        );


    if(!confirmed){
        return;
    }


    try{

        await deleteDoc(
            doc(
                db,
                collectionName,
                id
            )
        );


        showNotification(
            `تم حذف ${itemName} بنجاح`
        );


        if(type === "subject"){

            await loadSubjects();

        }


        if(type === "lecture"){

            await loadLectures();

        }


        if(type === "exam"){

            await loadExams();

        }


        if(type === "sheet"){

            await loadSheets();

        }


        updateStatistics();

    }
    catch(error){

        console.error(
            "Delete error:",
            error
        );


        showNotification(
            `تعذر حذف ${itemName}: ` +
            getFirebaseErrorMessage(error),
            "error"
        );

    }
}


/*=========================================================
                    ADD BUTTONS
=========================================================*/

if(addSubjectBtn){

    addSubjectBtn.addEventListener(
        "click",
        () => {

            openSubjectModal();

        }
    );

}


if(addLectureBtn){

    addLectureBtn.addEventListener(
        "click",
        () => {

            if(subjects.length === 0){

                showNotification(
                    "أضف مادة أولًا قبل إنشاء محاضرة",
                    "warning"
                );

                return;
            }


            openLectureModal();

        }
    );

}


if(addExamBtn){

    addExamBtn.addEventListener(
        "click",
        () => {

            if(subjects.length === 0){

                showNotification(
                    "أضف مادة أولًا قبل إنشاء امتحان",
                    "warning"
                );

                return;
            }


            openExamModal();

        }
    );

}


if(addSheetBtn){

    addSheetBtn.addEventListener(
        "click",
        () => {

            openSheetModal();

        }
    );

}


/*=========================================================
                    LOGOUT
=========================================================*/

if(logoutBtn){

    logoutBtn.addEventListener(
        "click",
        async () => {

            const confirmed =
                confirm(
                    "هل تريد تسجيل الخروج؟"
                );


            if(!confirmed){
                return;
            }


            try{

                await signOut(
                    auth
                );


                window.location.href =
                    "index.html";

            }
            catch(error){

                console.error(
                    "Logout:",
                    error
                );


                showNotification(
                    "تعذر تسجيل الخروج",
                    "error"
                );

            }

        }
    );

}


/*=========================================================
                    FIREBASE ERROR
=========================================================*/

function getFirebaseErrorMessage(
    error
){

    const code =
        error?.code || "";


    if(
        code.includes(
            "permission-denied"
        )
    ){

        return "لا توجد صلاحية للوصول إلى البيانات. راجع Firestore Rules.";

    }


    if(
        code.includes(
            "network-request-failed"
        )
    ){

        return "تأكد من اتصال الإنترنت.";

    }


    if(
        code.includes(
            "unauthenticated"
        )
    ){

        return "انتهت جلسة تسجيل الدخول.";

    }


    return (
        error?.message ||
        "خطأ غير معروف"
    );
}


/*=========================================================
                    AUTH STATE
=========================================================*/

onAuthStateChanged(
    auth,
    async user => {

        if(!user){

            window.location.href =
                "login.html";

            return;
        }


        const verified =
            await verifyAdmin(
                user
            );


        if(!verified){
            return;
        }


        await loadAllData();

    }
);


/*=========================================================
                    START
=========================================================*/

console.log(
    "ENG Forge Admin Dashboard loaded successfully."
);


/*=========================================================
                    END OF FILE
=========================================================*/
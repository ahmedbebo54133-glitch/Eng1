/* =========================================================
   ENG FORGE
   ADMIN RESULTS
   =========================================================

   مسؤول عن:

   - تحميل النتائج
   - عرض النتائج
   - ترتيب النتائج
   - فتح تفاصيل النتيجة
   - إغلاق تفاصيل النتيجة
   - التصحيح اليدوي
   - إضافة ملاحظات المصحح
   - إضافة الإجابة الصحيحة
   - اعتماد النتيجة
   - حساب الدرجة
   - إرسال النتيجة عبر WhatsApp
   - انتظار جاهزية الأدمن

========================================================= */


/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import {
    db,
    getCollection,
    doc,
    updateDoc
} from "./firebase.js";


/* =========================================================
   STATE
========================================================= */

let resultsData = [];

let resultsList = null;

let selectedResult = null;

let resultsLoading = false;

let gradingValues = {};


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeResults
);


async function initializeResults() {

    resultsList =
        document.getElementById(
            "resultsList"
        );


    if (!resultsList) {

        console.warn(
            "ENG Forge Results: resultsList not found."
        );

        return;
    }


    const adminReady =
        await waitForAdmin();


    if (!adminReady) {

        console.warn(
            "ENG Forge Results: Admin not ready."
        );

        return;
    }


    await loadResults();

}


/* =========================================================
   WAIT FOR ADMIN
========================================================= */

function waitForAdmin() {

    return new Promise(
        (resolve) => {

            if (
                window.ENGForgeAdmin &&
                window.ENGForgeAdmin.currentAdmin
            ) {

                resolve(true);

                return;
            }


            let attempts = 0;

            const maxAttempts = 100;


            const timer =
                setInterval(
                    () => {

                        attempts++;


                        if (
                            window.ENGForgeAdmin &&
                            window.ENGForgeAdmin.currentAdmin
                        ) {

                            clearInterval(
                                timer
                            );

                            resolve(true);

                            return;
                        }


                        if (
                            attempts >=
                            maxAttempts
                        ) {

                            clearInterval(
                                timer
                            );

                            resolve(false);

                        }

                    },
                    200
                );

        }
    );

}


/* =========================================================
   LOAD RESULTS
========================================================= */

async function loadResults() {

    if (!resultsList) {
        return;
    }


    if (resultsLoading) {
        return;
    }


    resultsLoading = true;


    resultsList.innerHTML = `
        <div class="empty-state">

            <div class="empty-icon">
                ⏳
            </div>

            <h3>
                جاري تحميل النتائج
            </h3>

            <p>
                انتظر لحظة...
            </p>

        </div>
    `;


    try {

        console.log(
            "ENG Forge Results: Loading..."
        );


        const results =
            await getCollection(
                "results"
            );


        resultsData =
            Array.isArray(results)
                ? results
                : [];


        console.log(
            "ENG Forge Results:",
            resultsData.length,
            "results loaded."
        );


        renderResults(
            resultsData
        );


    } catch (error) {

        console.error(
            "ENG Forge Results Error:",
            error
        );


        resultsData = [];


        resultsList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ⚠️
                </div>

                <h3>
                    تعذر تحميل النتائج
                </h3>

                <p>
                    حدث خطأ أثناء تحميل النتائج.
                </p>

                <button
                    type="button"
                    id="retryResultsButton"
                    class="btn btn-primary"
                    style="
                        margin-top:16px;
                        cursor:pointer;
                    "
                >
                    إعادة المحاولة
                </button>

            </div>
        `;


        const retryButton =
            document.getElementById(
                "retryResultsButton"
            );


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                loadResults
            );

        }

    } finally {

        resultsLoading = false;

    }

}


/* =========================================================
   RENDER RESULTS
========================================================= */

function renderResults(
    results
) {

    if (!resultsList) {
        return;
    }


    resultsList.innerHTML = "";


    if (
        !Array.isArray(results) ||
        results.length === 0
    ) {

        resultsList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📊
                </div>

                <h3>
                    لا توجد نتائج حتى الآن
                </h3>

                <p>
                    ستظهر نتائج الطلاب هنا بعد تسليم الامتحانات.
                </p>

            </div>
        `;

        return;

    }


    const sortedResults =
        [...results].sort(
            (a, b) => {

                return (
                    getTimestampValue(
                        b.submittedAt
                    ) -
                    getTimestampValue(
                        a.submittedAt
                    )
                );

            }
        );


    sortedResults.forEach(
        (result) => {

            const card =
                createResultCard(
                    result
                );


            resultsList.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   CREATE RESULT CARD
========================================================= */

function createResultCard(
    result
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "content-item result-item";


    const studentName =
        result.studentName ||
        "طالب";


    const examName =
        result.examName ||
        "امتحان";


    const score =
        result.score !== undefined &&
        result.score !== null
            ? result.score
            : "لم يتم التصحيح";


    const total =
        result.totalMarks !== undefined &&
        result.totalMarks !== null
            ? result.totalMarks
            : "—";


    const status =
        result.gradingStatus ||
        "pending";


    card.innerHTML = `
        <div class="result-main">

            <div class="result-icon">
                📋
            </div>

            <div class="result-info">

                <strong>
                    ${escapeHTML(
                        studentName
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        examName
                    )}
                </span>

                <small>
                    رقم الطالب:
                    ${escapeHTML(
                        result.studentIdNumber ||
                        "غير مسجل"
                    )}
                </small>

            </div>

        </div>


        <div class="result-side">

            <strong class="result-score">
                ${escapeHTML(
                    String(score)
                )}
                /
                ${escapeHTML(
                    String(total)
                )}
            </strong>

            <span class="result-status">
                ${escapeHTML(
                    getGradingStatusText(
                        status
                    )
                )}
            </span>

        </div>
    `;


    card.dataset.resultId =
        result.id || "";


    card.setAttribute(
        "role",
        "button"
    );


    card.setAttribute(
        "tabindex",
        "0"
    );


    card.style.cursor =
        "pointer";


    card.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();

            openResult(
                result
            );

        }
    );


    card.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                openResult(
                    result
                );

            }

        }
    );


    return card;

}


/* =========================================================
   OPEN RESULT
========================================================= */

function openResult(
    result
) {

    if (!result) {
        return;
    }


    selectedResult =
        result;


    prepareGradingValues(
        result
    );


    const oldPopup =
        document.getElementById(
            "engForgeResultPopup"
        );


    if (oldPopup) {

        oldPopup.remove();

    }


    const popup =
        document.createElement(
            "div"
        );


    popup.id =
        "engForgeResultPopup";


    popup.style.cssText = `
        position: fixed !important;
        inset: 0 !important;

        width: 100vw !important;
        height: 100vh !important;

        z-index: 999999 !important;

        display: flex !important;

        align-items: center !important;
        justify-content: center !important;

        padding: 20px !important;

        box-sizing: border-box !important;

        background:
            rgba(0,0,0,0.84) !important;

        opacity: 0;

        visibility: hidden;

        transition:
            opacity 0.2s ease,
            visibility 0.2s ease;

        overflow-y: auto !important;
    `;


    const manual =
        isManualGrading(
            result
        );


    popup.innerHTML = `

        <div
            class="eng-result-overlay"
            style="
                width:100%;
                min-height:100%;

                display:flex;

                align-items:center;
                justify-content:center;

                padding:20px;

                box-sizing:border-box;
            "
        >

            <div
                class="eng-result-modal"
                role="dialog"
                aria-modal="true"
                style="
                    position:relative;

                    width:100%;
                    max-width:900px;

                    max-height:90vh;

                    overflow-y:auto;

                    box-sizing:border-box;

                    background:#11161d;

                    color:#fff;

                    border:
                        1px solid
                        rgba(78,168,255,0.35);

                    border-radius:18px;

                    box-shadow:
                        0 25px 80px
                        rgba(0,0,0,0.65);

                    padding:24px;

                    direction:rtl;

                    font-family:
                        Cairo,
                        Arial,
                        sans-serif;
                "
            >

                <!-- HEADER -->

                <div
                    style="
                        display:flex;

                        align-items:center;

                        justify-content:space-between;

                        gap:15px;

                        padding-bottom:18px;

                        margin-bottom:20px;

                        border-bottom:
                            1px solid
                            rgba(255,255,255,0.08);
                    "
                >

                    <div>

                        <span
                            style="
                                display:block;

                                color:#4ea8ff;

                                font-size:12px;

                                letter-spacing:1px;

                                margin-bottom:5px;
                            "
                        >
                            RESULT DETAILS
                        </span>


                        <h2
                            style="
                                margin:0;

                                font-size:24px;

                                color:#fff;
                            "
                        >
                            تفاصيل النتيجة
                        </h2>

                    </div>


                    <button
                        type="button"
                        class="eng-result-close"
                        style="
                            width:42px;
                            height:42px;

                            border:none;

                            border-radius:50%;

                            background:
                                rgba(255,255,255,0.08);

                            color:#fff;

                            font-size:28px;

                            cursor:pointer;
                        "
                    >
                        ×
                    </button>

                </div>


                <!-- STUDENT -->

                <div
                    style="
                        display:flex;

                        align-items:center;

                        gap:14px;

                        padding:16px;

                        margin-bottom:20px;

                        background:
                            rgba(255,255,255,0.04);

                        border-radius:14px;
                    "
                >

                    <div
                        style="
                            width:52px;
                            height:52px;

                            display:flex;

                            align-items:center;
                            justify-content:center;

                            border-radius:50%;

                            background:
                                rgba(78,168,255,0.12);

                            font-size:25px;

                            flex-shrink:0;
                        "
                    >
                        👨‍🎓
                    </div>


                    <div>

                        <strong
                            style="
                                display:block;

                                font-size:18px;

                                color:#fff;
                            "
                        >
                            ${escapeHTML(
                                result.studentName ||
                                "طالب"
                            )}
                        </strong>


                        <span
                            style="
                                display:block;

                                margin-top:4px;

                                color:#aab4c0;

                                font-size:13px;
                            "
                        >
                            رقم الطالب:
                            ${escapeHTML(
                                result.studentIdNumber ||
                                "غير مسجل"
                            )}
                        </span>

                    </div>

                </div>


                <!-- INFORMATION -->

                <div
                    style="
                        display:grid;

                        grid-template-columns:
                            repeat(
                                auto-fit,
                                minmax(180px,1fr)
                            );

                        gap:12px;

                        margin-bottom:24px;
                    "
                >

                    ${createInfoBox(
                        "الامتحان",
                        result.examName ||
                        "غير محدد"
                    )}


                    ${createInfoBox(
                        "المادة",
                        result.subjectName ||
                        "غير محددة"
                    )}


                    ${createInfoBox(
                        "الدرجة",
                        `${result.score ?? "لم يتم التصحيح"} / ${result.totalMarks ?? "—"}`
                    )}


                    ${createInfoBox(
                        "النسبة",
                        formatPercentage(
                            result.percentage
                        )
                    )}


                    ${createInfoBox(
                        "الحالة",
                        getGradingStatusText(
                            result.gradingStatus
                        )
                    )}


                    ${createInfoBox(
                        "تاريخ التسليم",
                        formatDate(
                            result.submittedAt
                        )
                    )}

                </div>


                <!-- ANSWERS -->

                <div>

                    <div
                        style="
                            font-size:18px;

                            font-weight:700;

                            margin-bottom:14px;
                        "
                    >
                        ${
                            manual
                                ? "إجابات الطالب والتصحيح"
                                : "إجابات الطالب"
                        }
                    </div>


                    <div id="resultAnswersContainer">

                        ${renderAnswers(
                            result.answers,
                            manual
                        )}

                    </div>

                </div>


                <!-- ACTIONS -->

                <div
                    id="resultActions"
                    style="
                        margin-top:24px;

                        padding-top:20px;

                        border-top:
                            1px solid
                            rgba(255,255,255,0.08);
                    "
                >

                    ${
                        manual
                            ? createManualActions(
                                result
                            )
                            : createAutoActions(
                                result
                            )
                    }

                </div>

            </div>

        </div>
    `;


    document.body.appendChild(
        popup
    );


    requestAnimationFrame(
        () => {

            requestAnimationFrame(
                () => {

                    popup.style.opacity =
                        "1";

                    popup.style.visibility =
                        "visible";

                }
            );

        }
    );


    /* =====================================================
       CLOSE
    ===================================================== */

    const closeButton =
        popup.querySelector(
            ".eng-result-close"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeResult
        );

    }


    const overlay =
        popup.querySelector(
            ".eng-result-overlay"
        );


    if (overlay) {

        overlay.addEventListener(
            "click",
            function(event) {

                if (
                    event.target ===
                    overlay
                ) {

                    closeResult();

                }

            }
        );

    }


    const modal =
        popup.querySelector(
            ".eng-result-modal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

            }
        );

    }


    document.addEventListener(
        "keydown",
        handleResultEscape
    );


    document.body.style.overflow =
        "hidden";


    setupResultActions(
        result
    );

}


/* =========================================================
   CREATE INFO BOX
========================================================= */

function createInfoBox(
    title,
    value
) {

    return `
        <div
            style="
                padding:14px;

                background:
                    rgba(255,255,255,0.04);

                border:
                    1px solid
                    rgba(255,255,255,0.07);

                border-radius:12px;
            "
        >

            <span
                style="
                    display:block;

                    margin-bottom:6px;

                    color:#8d99a6;

                    font-size:12px;
                "
            >
                ${escapeHTML(title)}
            </span>


            <strong
                style="
                    display:block;

                    color:#fff;

                    font-size:14px;

                    line-height:1.6;
                "
            >
                ${escapeHTML(
                    String(value)
                )}
            </strong>

        </div>
    `;

}


/* =========================================================
   DETECT MANUAL GRADING
========================================================= */

function isManualGrading(
    result
) {

    if (!result) {
        return false;
    }


    if (
        result.gradingStatus ===
        "manual"
    ) {

        return true;

    }


    if (
        result.gradingStatus ===
        "completed"
    ) {

        return false;

    }


    const answers =
        Array.isArray(
            result.answers
        )
            ? result.answers
            : [];


    return answers.some(
        (answer) => {

            const type =
                String(
                    answer.type ||
                    answer.questionType ||
                    ""
                ).toLowerCase();


            return (
                type === "short_answer" ||
                type === "shortanswer" ||
                type === "essay" ||
                type === "long_answer"
            );

        }
    );

}


/* =========================================================
   PREPARE GRADING VALUES
========================================================= */

function prepareGradingValues(
    result
) {

    gradingValues = {};


    const answers =
        Array.isArray(
            result.answers
        )
            ? result.answers
            : [];


    answers.forEach(
        (answer, index) => {

            gradingValues[index] = {

                score:
                    answer.awardedMarks ??
                    answer.score ??
                    "",

                gradingNote:
                    answer.gradingNote ||
                    "",

                correctedAnswer:
                    answer.correctedAnswer ||
                    answer.modelAnswer ||
                    answer.correctAnswer ||
                    ""

            };

        }
    );

}


/* =========================================================
   CREATE MANUAL ACTIONS
========================================================= */

function createManualActions(
    result
) {

    return `

        <div
            style="
                padding:16px;

                margin-bottom:16px;

                background:
                    rgba(255,193,7,0.07);

                border:
                    1px solid
                    rgba(255,193,7,0.22);

                border-radius:14px;
            "
        >

            <strong
                style="
                    display:block;

                    margin-bottom:6px;

                    color:#ffc107;
                "
            >
                📝 هذا الامتحان يحتاج تصحيحًا يدويًا
            </strong>


            <span
                style="
                    color:#aab4c0;

                    font-size:13px;
                "
            >
                أدخل درجة كل سؤال، ويمكنك كتابة سبب الخطأ والإجابة الصحيحة للطالب.
            </span>

        </div>


        <div
            style="
                display:flex;

                gap:10px;

                flex-wrap:wrap;
            "
        >

            <button
                type="button"
                id="saveManualGradeButton"
                style="
                    flex:1;

                    min-width:200px;

                    padding:13px 18px;

                    border:none;

                    border-radius:10px;

                    background:#4ea8ff;

                    color:#fff;

                    font-family:inherit;

                    font-weight:700;

                    cursor:pointer;
                "
            >
                ✓ حفظ واعتماد التصحيح
            </button>


            <button
                type="button"
                id="closeResultButton"
                style="
                    padding:13px 18px;

                    border:
                        1px solid
                        rgba(255,255,255,0.12);

                    border-radius:10px;

                    background:
                        rgba(255,255,255,0.05);

                    color:#fff;

                    font-family:inherit;

                    cursor:pointer;
                "
            >
                إغلاق
            </button>

        </div>

    `;

}


/* =========================================================
   CREATE AUTO ACTIONS
========================================================= */

function createAutoActions(
    result
) {

    const canSend =
        result.gradingStatus ===
            "auto" ||
        result.gradingStatus ===
            "completed";


    return `

        <div
            style="
                display:flex;

                gap:10px;

                flex-wrap:wrap;
            "
        >

            ${
                canSend
                    ? `
                        <button
                            type="button"
                            id="sendWhatsAppButton"
                            style="
                                flex:1;

                                min-width:220px;

                                padding:13px 18px;

                                border:none;

                                border-radius:10px;

                                background:#25D366;

                                color:#fff;

                                font-family:inherit;

                                font-weight:700;

                                cursor:pointer;
                            "
                        >
                            📱 إرسال النتيجة عبر WhatsApp
                        </button>
                    `
                    : ""
            }


            <button
                type="button"
                id="closeResultButton"
                style="
                    padding:13px 18px;

                    border:
                        1px solid
                        rgba(255,255,255,0.12);

                    border-radius:10px;

                    background:
                        rgba(255,255,255,0.05);

                    color:#fff;

                    font-family:inherit;

                    cursor:pointer;
                "
            >
                إغلاق
            </button>

        </div>


        ${
            !result.studentPhone &&
            canSend
                ? `
                    <div
                        style="
                            margin-top:12px;

                            color:#ffb4b4;

                            font-size:13px;
                        "
                    >
                        ⚠️ لا يوجد رقم WhatsApp محفوظ للطالب.
                    </div>
                `
                : ""
        }

    `;

}


/* =========================================================
   SETUP RESULT ACTIONS
========================================================= */

function setupResultActions(
    result
) {

    const closeButton =
        document.getElementById(
            "closeResultButton"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeResult
        );

    }


    const whatsappButton =
        document.getElementById(
            "sendWhatsAppButton"
        );


    if (whatsappButton) {

        whatsappButton.addEventListener(
            "click",
            function() {

                sendResultWhatsApp(
                    result
                );

            }
        );

    }


    const saveButton =
        document.getElementById(
            "saveManualGradeButton"
        );


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            function() {

                saveManualGrade(
                    result
                );

            }
        );

    }


    /*
       حقول درجات الأسئلة
    */

    document
        .querySelectorAll(
            ".manual-grade-input"
        )
        .forEach(
            (input) => {

                input.addEventListener(
                    "input",
                    function() {

                        const index =
                            Number(
                                input.dataset.index
                            );


                        if (
                            !gradingValues[index]
                        ) {

                            gradingValues[index] =
                                {};

                        }


                        gradingValues[index].score =
                            input.value;

                    }
                );

            }
        );


    /*
       ملاحظات المصحح
    */

    document
        .querySelectorAll(
            ".manual-feedback-input"
        )
        .forEach(
            (input) => {

                input.addEventListener(
                    "input",
                    function() {

                        const index =
                            Number(
                                input.dataset.index
                            );


                        if (
                            !gradingValues[index]
                        ) {

                            gradingValues[index] =
                                {};

                        }


                        gradingValues[index].gradingNote =
                            input.value;

                    }
                );

            }
        );


    /*
       الإجابة الصحيحة
    */

    document
        .querySelectorAll(
            ".manual-correct-answer-input"
        )
        .forEach(
            (input) => {

                input.addEventListener(
                    "input",
                    function() {

                        const index =
                            Number(
                                input.dataset.index
                            );


                        if (
                            !gradingValues[index]
                        ) {

                            gradingValues[index] =
                                {};

                        }


                        gradingValues[index].correctedAnswer =
                            input.value;

                    }
                );

            }
        );

}


/* =========================================================
   RENDER ANSWERS
========================================================= */

function renderAnswers(
    answers,
    manual = false
) {

    if (
        !Array.isArray(answers) ||
        answers.length === 0
    ) {

        return `
            <div
                style="
                    padding:20px;

                    text-align:center;

                    background:
                        rgba(255,255,255,0.03);

                    border-radius:12px;

                    color:#8d99a6;
                "
            >
                لا توجد إجابات محفوظة.
            </div>
        `;

    }


    return answers
        .map(
            (answer, index) => {

                const question =
                    answer.question ||
                    answer.questionText ||
                    answer.text ||
                    `السؤال ${index + 1}`;


                const studentAnswer =
                    answer.answer ??
                    answer.studentAnswer ??
                    "لم تتم الإجابة";


                const correctAnswer =
                    answer.correctedAnswer ||
                    answer.modelAnswer ||
                    answer.correctAnswer ||
                    "";


                const questionMarks =
                    Number(
                        answer.marks ??
                        answer.maxMarks ??
                        1
                    );


                const gradingData =
                    gradingValues[index] ||
                    {};


                const awardedMarks =
                    gradingData.score ??
                    answer.awardedMarks ??
                    answer.score ??
                    "";


                const gradingNote =
                    gradingData.gradingNote ??
                    answer.gradingNote ??
                    "";


                const correctedAnswer =
                    gradingData.correctedAnswer ??
                    correctAnswer;


                const type =
                    String(
                        answer.type ||
                        answer.questionType ||
                        ""
                    ).toLowerCase();


                const manualQuestion =
                    (
                        type === "short_answer" ||
                        type === "shortanswer" ||
                        type === "essay" ||
                        type === "long_answer"
                    );


                return `

                    <div
                        style="
                            margin-bottom:14px;

                            padding:16px;

                            background:
                                rgba(
                                    255,
                                    255,
                                    255,
                                    0.035
                                );

                            border:
                                1px solid
                                rgba(
                                    255,
                                    255,
                                    255,
                                    0.07
                                );

                            border-radius:14px;
                        "
                    >

                        <!-- QUESTION -->

                        <div
                            style="
                                margin-bottom:14px;
                            "
                        >

                            <span
                                style="
                                    display:block;

                                    color:#4ea8ff;

                                    font-size:12px;

                                    margin-bottom:5px;
                                "
                            >
                                السؤال ${index + 1}

                                ${
                                    questionMarks
                                        ? `
                                            — الدرجة:
                                            ${questionMarks}
                                          `
                                        : ""
                                }
                            </span>


                            <strong
                                style="
                                    display:block;

                                    color:#fff;

                                    line-height:1.8;
                                "
                            >
                                ${escapeHTML(
                                    question
                                )}
                            </strong>

                        </div>


                        <!-- STUDENT ANSWER -->

                        <div
                            style="
                                padding:13px;

                                margin-bottom:12px;

                                background:
                                    rgba(
                                        255,
                                        255,
                                        255,
                                        0.03
                                    );

                                border-radius:10px;
                            "
                        >

                            <small
                                style="
                                    display:block;

                                    color:#8d99a6;

                                    margin-bottom:6px;
                                "
                            >
                                إجابة الطالب
                            </small>


                            <p
                                style="
                                    margin:0;

                                    color:#fff;

                                    line-height:1.8;

                                    white-space:pre-wrap;
                                "
                            >
                                ${escapeHTML(
                                    String(
                                        studentAnswer
                                    )
                                )}
                            </p>

                        </div>


                        <!-- CORRECT ANSWER -->

                        ${
                            !manual &&
                            correctAnswer
                                ? `
                                    <div
                                        style="
                                            padding:13px;

                                            margin-bottom:12px;

                                            background:
                                                rgba(
                                                    78,
                                                    168,
                                                    255,
                                                    0.06
                                                );

                                            border-radius:10px;
                                        "
                                    >

                                        <small
                                            style="
                                                display:block;

                                                color:#8d99a6;

                                                margin-bottom:6px;
                                            "
                                        >
                                            الإجابة النموذجية
                                        </small>


                                        <p
                                            style="
                                                margin:0;

                                                color:#fff;

                                                line-height:1.8;

                                                white-space:pre-wrap;
                                            "
                                        >
                                            ${escapeHTML(
                                                String(
                                                    correctAnswer
                                                )
                                            )}
                                        </p>

                                    </div>
                                `
                                : ""
                        }


                        <!-- MANUAL GRADING -->

                        ${
                            manual &&
                            (
                                manualQuestion ||
                                resultNeedsManualGrade(
                                    answer
                                )
                            )
                                ? `
                                    <div
                                        style="
                                            margin-top:12px;

                                            padding:14px;

                                            background:
                                                rgba(
                                                    255,
                                                    193,
                                                    7,
                                                    0.05
                                                );

                                            border:
                                                1px solid
                                                rgba(
                                                    255,
                                                    193,
                                                    7,
                                                    0.15
                                                );

                                            border-radius:10px;
                                        "
                                    >

                                        <!-- GRADE -->

                                        <div
                                            style="
                                                display:flex;

                                                align-items:center;

                                                gap:10px;

                                                flex-wrap:wrap;
                                            "
                                        >

                                            <label
                                                style="
                                                    color:#aab4c0;

                                                    font-size:13px;

                                                    font-weight:700;
                                                "
                                            >
                                                درجة الطالب:
                                            </label>


                                            <input
                                                type="number"

                                                class="manual-grade-input"

                                                data-index="${index}"

                                                min="0"

                                                max="${questionMarks}"

                                                step="0.5"

                                                value="${escapeHTML(
                                                    String(
                                                        awardedMarks
                                                    )
                                                )}"

                                                style="
                                                    width:100px;

                                                    padding:10px;

                                                    border:
                                                        1px solid
                                                        rgba(
                                                            78,
                                                            168,
                                                            255,
                                                            0.35
                                                        );

                                                    border-radius:8px;

                                                    background:#0c1117;

                                                    color:#fff;

                                                    font-family:inherit;

                                                    box-sizing:border-box;
                                                "
                                            />


                                            <span
                                                style="
                                                    color:#8d99a6;

                                                    font-size:13px;
                                                "
                                            >
                                                /
                                                ${questionMarks}
                                            </span>

                                        </div>


                                        <!-- GRADING NOTE -->

                                        <div
                                            style="
                                                margin-top:14px;
                                            "
                                        >

                                            <label
                                                style="
                                                    display:block;

                                                    color:#ffc107;

                                                    font-size:13px;

                                                    font-weight:700;

                                                    margin-bottom:7px;
                                                "
                                            >
                                                📝 سبب الخطأ / ملاحظة المصحح
                                            </label>


                                            <textarea
                                                class="manual-feedback-input"

                                                data-index="${index}"

                                                placeholder="اكتب سبب الخطأ أو ملاحظة للطالب..."
                                                style="
                                                    width:100%;

                                                    min-height:80px;

                                                    padding:11px;

                                                    box-sizing:border-box;

                                                    border:
                                                        1px solid
                                                        rgba(
                                                            255,
                                                            255,
                                                            255,
                                                            0.12
                                                        );

                                                    border-radius:9px;

                                                    background:#0c1117;

                                                    color:#fff;

                                                    font-family:inherit;

                                                    font-size:13px;

                                                    resize:vertical;
                                                "
                                            >${escapeHTML(
                                                String(
                                                    gradingNote
                                                )
                                            )}</textarea>

                                        </div>


                                        <!-- CORRECTED ANSWER -->

                                        <div
                                            style="
                                                margin-top:14px;
                                            "
                                        >

                                            <label
                                                style="
                                                    display:block;

                                                    color:#4ea8ff;

                                                    font-size:13px;

                                                    font-weight:700;

                                                    margin-bottom:7px;
                                                "
                                            >
                                                ✅ الإجابة الصحيحة
                                            </label>


                                            <textarea
                                                class="manual-correct-answer-input"

                                                data-index="${index}"

                                                placeholder="اكتب الإجابة الصحيحة للطالب..."
                                                style="
                                                    width:100%;

                                                    min-height:80px;

                                                    padding:11px;

                                                    box-sizing:border-box;

                                                    border:
                                                        1px solid
                                                        rgba(
                                                            78,
                                                            168,
                                                            255,
                                                            0.25
                                                        );

                                                    border-radius:9px;

                                                    background:#0c1117;

                                                    color:#fff;

                                                    font-family:inherit;

                                                    font-size:13px;

                                                    resize:vertical;
                                                "
                                            >${escapeHTML(
                                                String(
                                                    correctedAnswer
                                                )
                                            )}</textarea>

                                        </div>

                                    </div>
                                `
                                : ""
                        }

                    </div>

                `;

            }
        )
        .join("");

}


/* =========================================================
   CHECK IF ANSWER NEEDS MANUAL GRADE
========================================================= */

function resultNeedsManualGrade(
    answer
) {

    if (
        answer &&
        answer.modelAnswer &&
        answer.awardedMarks === undefined &&
        answer.score === undefined
    ) {

        return true;

    }


    return false;

}


/* =========================================================
   SAVE MANUAL GRADE
========================================================= */

async function saveManualGrade(
    result
) {

    if (!result || !result.id) {

        alert(
            "تعذر تحديد نتيجة الطالب."
        );

        return;

    }


    const answers =
        Array.isArray(
            result.answers
        )
            ? result.answers
            : [];


    if (answers.length === 0) {

        alert(
            "لا توجد إجابات لتصحيحها."
        );

        return;

    }


    const updatedAnswers =
        answers.map(
            (answer, index) => {

                const maxMarks =
                    Number(
                        answer.marks ??
                        answer.maxMarks ??
                        1
                    );


                const gradingData =
                    gradingValues[index] ||
                    {};


                let awarded =
                    gradingData.score;


                if (
                    awarded === undefined ||
                    awarded === ""
                ) {

                    awarded =
                        answer.awardedMarks ??
                        answer.score ??
                        0;

                }


                awarded =
                    Number(
                        awarded
                    );


                if (
                    Number.isNaN(
                        awarded
                    )
                ) {

                    awarded = 0;

                }


                awarded =
                    Math.max(
                        0,
                        Math.min(
                            awarded,
                            maxMarks
                        )
                    );


                const gradingNote =
                    gradingData.gradingNote ??
                    answer.gradingNote ??
                    "";


                const correctedAnswer =
                    gradingData.correctedAnswer ??
                    answer.correctedAnswer ??
                    answer.modelAnswer ??
                    answer.correctAnswer ??
                    "";


                return {

                    ...answer,

                    awardedMarks:
                        awarded,

                    gradingNote:
                        gradingNote,

                    correctedAnswer:
                        correctedAnswer

                };

            }
        );


    /* =====================================================
       حساب الدرجة النهائية
    ===================================================== */

    let finalScore = 0;


    updatedAnswers.forEach(
        (answer) => {

            const awarded =
                Number(
                    answer.awardedMarks ??
                    answer.score ??
                    0
                );


            if (
                !Number.isNaN(
                    awarded
                )
            ) {

                finalScore +=
                    awarded;

            }

        }
    );


    const totalMarks =
        Number(
            result.totalMarks ||
            updatedAnswers.reduce(
                (total, answer) => {

                    return total +
                        Number(
                            answer.marks ??
                            answer.maxMarks ??
                            1
                        );

                },
                0
            )
        );


    const percentage =
        totalMarks > 0
            ? Number(
                (
                    finalScore /
                    totalMarks *
                    100
                ).toFixed(2)
            )
            : 0;


    const currentAdmin =
        window.ENGForgeAdmin &&
        window.ENGForgeAdmin.currentAdmin
            ? window.ENGForgeAdmin.currentAdmin
            : null;


    const resultRef =
        doc(
            db,
            "results",
            result.id
        );


    const saveButton =
        document.getElementById(
            "saveManualGradeButton"
        );


    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
            "⏳ جاري الحفظ...";

    }


    try {

        await updateDoc(
            resultRef,
            {

                answers:
                    updatedAnswers,

                score:
                    finalScore,

                totalMarks:
                    totalMarks,

                percentage:
                    percentage,

                gradingStatus:
                    "completed",

                gradedAt:
                    new Date(),

                gradedBy:
                    currentAdmin
                        ? currentAdmin.uid
                        : null

            }
        );


        /* =================================================
           تحديث الذاكرة
        ================================================= */

        const index =
            resultsData.findIndex(
                (item) =>
                    item.id ===
                    result.id
            );


        if (index !== -1) {

            resultsData[index] = {

                ...resultsData[index],

                answers:
                    updatedAnswers,

                score:
                    finalScore,

                totalMarks:
                    totalMarks,

                percentage:
                    percentage,

                gradingStatus:
                    "completed"

            };

        }


        selectedResult = {

            ...result,

            answers:
                updatedAnswers,

            score:
                finalScore,

            totalMarks:
                totalMarks,

            percentage:
                percentage,

            gradingStatus:
                "completed"

        };


        alert(
            "تم حفظ التصحيح واعتماد النتيجة بنجاح."
        );


        closeResult();


        setTimeout(
            () => {

                openResult(
                    selectedResult
                );

            },
            250
        );


        renderResults(
            resultsData
        );


    } catch (error) {

        console.error(
            "Manual grading error:",
            error
        );


        alert(
            "حدث خطأ أثناء حفظ التصحيح."
        );


        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                "✓ حفظ واعتماد التصحيح";

        }

    }

}


/* =========================================================
   SEND RESULT TO WHATSAPP
========================================================= */

function sendResultWhatsApp(
    result
) {

    if (!result) {
        return;
    }


    let phone =
        result.studentPhone ||
        result.phone ||
        result.whatsapp ||
        result.whatsappNumber ||
        "";


    phone =
        String(
            phone
        )
        .replace(
            /[^0-9+]/g,
            ""
        );


    if (
        phone.startsWith(
            "01"
        )
    ) {

        phone =
            "20" +
            phone.substring(
                1
            );

    }


    phone =
        phone.replace(
            /^\+/,
            ""
        );


    if (!phone) {

        alert(
            "لا يوجد رقم WhatsApp محفوظ للطالب."
        );

        return;

    }


    const score =
        result.score ??
        "غير محسوبة";


    const total =
        result.totalMarks ??
        "—";


    const percentage =
        formatPercentage(
            result.percentage
        );


    const status =
        getGradingStatusText(
            result.gradingStatus
        );


    const answers =
        Array.isArray(
            result.answers
        )
            ? result.answers
            : [];


    let correctCount = 0;

    let wrongCount = 0;

    let unansweredCount = 0;


    answers.forEach(
        (answer) => {

            const studentAnswer =
                answer.answer ??
                answer.studentAnswer ??
                "";


            if (
                studentAnswer ===
                    "" ||
                studentAnswer ===
                    null
            ) {

                unansweredCount++;

                return;

            }


            const correctAnswer =
                answer.correctAnswer ||
                answer.correctedAnswer;


            if (
                correctAnswer !==
                    undefined &&
                correctAnswer !==
                    null &&
                normalizeAnswer(
                    studentAnswer
                ) ===
                normalizeAnswer(
                    correctAnswer
                )
            ) {

                correctCount++;

            } else {

                wrongCount++;

            }

        }
    );


    let message = "";


    message +=
        `السلام عليكم ${result.studentName || "الطالب"} 👋\n\n`;


    message +=
        `📚 نتيجة الامتحان\n`;


    message +=
        `━━━━━━━━━━━━━━\n`;


    message +=
        `📝 الامتحان: ${result.examName || "غير محدد"}\n`;


    message +=
        `📖 المادة: ${result.subjectName || "غير محددة"}\n`;


    message +=
        `👨‍🎓 الطالب: ${result.studentName || "غير محدد"}\n`;


    if (
        result.studentIdNumber
    ) {

        message +=
            `🆔 رقم الطالب: ${result.studentIdNumber}\n`;

    }


    message +=
        `━━━━━━━━━━━━━━\n`;


    message +=
        `🎯 الدرجة: ${score} / ${total}\n`;


    message +=
        `📊 النسبة: ${percentage}\n`;


    message +=
        `📌 الحالة: ${status}\n`;


    if (answers.length > 0) {

        message +=
            `\n📋 ملخص الإجابات:\n`;


        message +=
            `✅ الصحيحة: ${correctCount}\n`;


        message +=
            `❌ الخاطئة: ${wrongCount}\n`;


        message +=
            `⭕ بدون إجابة: ${unansweredCount}\n`;

    }


    /*
       إضافة ملاحظات التصحيح اليدوي
    */

    const gradedNotes =
        answers.filter(
            (answer) =>
                answer.gradingNote ||
                answer.correctedAnswer
        );


    if (
        gradedNotes.length > 0
    ) {

        message +=
            `\n📝 ملاحظات التصحيح:\n`;


        answers.forEach(
            (answer, index) => {

                if (
                    !answer.gradingNote &&
                    !answer.correctedAnswer
                ) {

                    return;

                }


                message +=
                    `\nالسؤال ${index + 1}:\n`;


                if (
                    answer.gradingNote
                ) {

                    message +=
                        `💬 الملاحظة: ${answer.gradingNote}\n`;

                }


                if (
                    answer.correctedAnswer
                ) {

                    message +=
                        `✅ الإجابة الصحيحة: ${answer.correctedAnswer}\n`;

                }

            }
        );

    }


    message +=
        `\n━━━━━━━━━━━━━━\n`;


    message +=
        `بالتوفيق دائمًا 🌟\n`;


    message +=
        `ENG FORGE ⚙️`;


    const whatsappURL =
        `https://wa.me/${phone}?text=${encodeURIComponent(
            message
        )}`;


    window.open(
        whatsappURL,
        "_blank"
    );

}


/* =========================================================
   NORMALIZE ANSWER
========================================================= */

function normalizeAnswer(
    value
) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        );

}


/* =========================================================
   CLOSE RESULT
========================================================= */

function closeResult() {

    const popup =
        document.getElementById(
            "engForgeResultPopup"
        );


    if (!popup) {

        selectedResult =
            null;

        document.body.style.overflow =
            "";

        return;

    }


    popup.style.opacity =
        "0";


    popup.style.visibility =
        "hidden";


    document.removeEventListener(
        "keydown",
        handleResultEscape
    );


    document.body.style.overflow =
        "";


    selectedResult =
        null;


    setTimeout(
        () => {

            if (
                popup &&
                popup.parentNode
            ) {

                popup.remove();

            }

        },
        200
    );

}


/* =========================================================
   ESCAPE
========================================================= */

function handleResultEscape(
    event
) {

    if (
        event.key ===
        "Escape"
    ) {

        closeResult();

    }

}


/* =========================================================
   GRADING STATUS
========================================================= */

function getGradingStatusText(
    status
) {

    switch (
        status
    ) {

        case "auto":
            return "تصحيح تلقائي";


        case "manual":
            return "في انتظار التصحيح";


        case "completed":
            return "تم التصحيح";


        case "pending":
            return "قيد المراجعة";


        default:
            return "قيد المراجعة";

    }

}


/* =========================================================
   TIMESTAMP
========================================================= */

function getTimestampValue(
    timestamp
) {

    if (!timestamp) {

        return 0;

    }


    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        return timestamp.toMillis();

    }


    if (
        typeof timestamp.seconds ===
        "number"
    ) {

        return timestamp.seconds *
            1000;

    }


    if (
        timestamp instanceof Date
    ) {

        return timestamp.getTime();

    }


    const parsed =
        new Date(
            timestamp
        ).getTime();


    return Number.isNaN(
        parsed
    )
        ? 0
        : parsed;

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    timestamp
) {

    const value =
        getTimestampValue(
            timestamp
        );


    if (!value) {

        return "غير محدد";

    }


    try {

        return new Intl.DateTimeFormat(
            "ar-EG",
            {
                year: "numeric",

                month: "long",

                day: "numeric",

                hour: "2-digit",

                minute: "2-digit"
            }
        ).format(
            new Date(
                value
            )
        );

    } catch {

        return new Date(
            value
        ).toLocaleString(
            "ar-EG"
        );

    }

}


/* =========================================================
   FORMAT PERCENTAGE
========================================================= */

function formatPercentage(
    percentage
) {

    if (
        percentage ===
            undefined ||
        percentage ===
            null ||
        percentage ===
            ""
    ) {

        return "غير محسوبة";

    }


    const number =
        Number(
            percentage
        );


    if (
        Number.isNaN(
            number
        )
    ) {

        return String(
            percentage
        );

    }


    return `${number}%`;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    const text =
        String(
            value ?? ""
        );


    return text
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


/* =========================================================
   PUBLIC API
========================================================= */

window.ENGForgeResults = {

    get results() {

        return resultsData;

    },


    get selectedResult() {

        return selectedResult;

    },


    loadResults,

    renderResults,

    openResult,

    closeResult

};


/* =========================================================
   READY
========================================================= */

console.log(
    "ENG Forge Admin Results loaded successfully."
);


/* =========================================================
   END OF FILE
========================================================= */
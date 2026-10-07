/* =========================================================
   ENG FORGE ⚙️
   ADMIN EXAMS
   Professional Exam Builder
   ========================================================= */

import {
    auth,
    db,
    collection,
    doc,
    getDocs,
    getDoc,
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
   STATE
========================================================= */

let exams = [];
let subjects = [];

let examQuestions = [];

let editingExamId = null;
let editingQuestionIndex = null;

/* =========================================================
   DOM
========================================================= */

const examsList = document.getElementById("examsList");
const addExamBtn = document.getElementById("addExamBtn");

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        await checkAdminAccess();

        await loadSubjects();
        await loadExams();

        setupEvents();

    } catch (error) {

        console.error("admin-exams init error:", error);

        notify(
            "حدث خطأ أثناء تشغيل إدارة الامتحانات",
            "error"
        );
    }
});

/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    if (addExamBtn) {

        addExamBtn.addEventListener("click", () => {
            openExamModal();
        });
    }

    document.addEventListener(
        "adminSectionChanged",
        async (event) => {

            if (event.detail === "exams") {

                await loadSubjects();
                await loadExams();
            }
        }
    );
}

/* =========================================================
   ADMIN ACCESS
========================================================= */

async function checkAdminAccess() {

    return new Promise((resolve) => {

        const unsubscribe = auth.onAuthStateChanged(
            async (user) => {

                if (!user) {

                    window.location.href = "index.html";
                    return;
                }

                try {

                    const isAdmin =
                        await checkAdmin(user.uid);

                    if (!isAdmin) {

                        window.location.href = "index.html";
                        return;
                    }

                    unsubscribe();
                    resolve();

                } catch (error) {

                    console.error(
                        "Admin permission error:",
                        error
                    );

                    unsubscribe();
                    resolve();
                }
            }
        );
    });
}

/* =========================================================
   SUBJECTS
========================================================= */

async function loadSubjects() {

    try {

        const snapshot = await getDocs(
            collection(db, "subjects")
        );

        subjects = snapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));

    } catch (error) {

        console.error(
            "loadSubjects error:",
            error
        );

        subjects = [];
    }
}

/* =========================================================
   EXAMS
========================================================= */

async function loadExams() {

    try {

        let snapshot;

        try {

            const q = query(
                collection(db, "exams"),
                orderBy("createdAt", "desc")
            );

            snapshot = await getDocs(q);

        } catch {

            snapshot = await getDocs(
                collection(db, "exams")
            );
        }

        exams = snapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
        }));

        renderExams();

    } catch (error) {

        console.error(
            "loadExams error:",
            error
        );

        notify(
            "تعذر تحميل الامتحانات",
            "error"
        );
    }
}

/* =========================================================
   RENDER EXAMS
========================================================= */

function renderExams() {

    if (!examsList) return;

    if (!exams.length) {

        examsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>

                <h3>لا توجد امتحانات</h3>

                <p>
                    ابدأ بإنشاء أول امتحان.
                </p>
            </div>
        `;

        return;
    }

    examsList.innerHTML = exams.map(exam => {

        const subject =
            subjects.find(
                item => item.id === exam.subjectId
            );

        const questionCount =
            Array.isArray(exam.questions)
                ? exam.questions.length
                : 0;

        const totalMarks =
            calculateTotalMarks(
                exam.questions || []
            );

        return `
            <div class="content-item exam-item">

                <div class="content-item-info">

                    <div class="content-item-title">
                        ${escapeHTML(exam.title || "بدون اسم")}
                    </div>

                    <div class="content-item-meta">

                        <span>
                            📚
                            ${escapeHTML(
                                subject?.name ||
                                exam.subjectName ||
                                "بدون مادة"
                            )}
                        </span>

                        <span>
                            📝 ${questionCount} سؤال
                        </span>

                        <span>
                            ⭐ ${totalMarks} درجة
                        </span>

                        ${
                            exam.duration
                                ? `
                                    <span>
                                        ⏱️ ${exam.duration} دقيقة
                                    </span>
                                  `
                                : ""
                        }

                    </div>

                </div>

                <div class="content-item-actions">

                    <button
                        class="action-btn view-exam-btn"
                        data-id="${exam.id}"
                        title="معاينة"
                    >
                        👁️
                    </button>

                    <button
                        class="action-btn edit-exam-btn"
                        data-id="${exam.id}"
                        title="تعديل"
                    >
                        ✏️
                    </button>

                    <button
                        class="action-btn delete-exam-btn"
                        data-id="${exam.id}"
                        title="حذف"
                    >
                        🗑️
                    </button>

                </div>

            </div>
        `;

    }).join("");

    examsList
        .querySelectorAll(".edit-exam-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const exam =
                        exams.find(
                            item =>
                                item.id ===
                                button.dataset.id
                        );

                    if (exam) {
                        openExamModal(exam);
                    }
                }
            );
        });

    examsList
        .querySelectorAll(".view-exam-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const exam =
                        exams.find(
                            item =>
                                item.id ===
                                button.dataset.id
                        );

                    if (exam) {
                        openExamPreview(exam);
                    }
                }
            );
        });

    examsList
        .querySelectorAll(".delete-exam-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const exam =
                        exams.find(
                            item =>
                                item.id ===
                                button.dataset.id
                        );

                    if (exam) {
                        await deleteExam(exam);
                    }
                }
            );
        });
}

/* =========================================================
   OPEN EXAM MODAL
========================================================= */

function openExamModal(exam = null) {

    editingExamId =
        exam?.id || null;

    examQuestions =
        exam && Array.isArray(exam.questions)
            ? normalizeQuestions(exam.questions)
            : [];

    const isEdit = Boolean(exam);

    const modal = createModal(
        isEdit
            ? "تعديل الامتحان"
            : "إنشاء امتحان جديد"
    );

    const content = modal.querySelector(
        ".exam-builder-content"
    );

    content.innerHTML = `
        <div class="exam-builder">

            <div class="exam-basic-info">

                <div class="form-group">

                    <label>
                        اسم الامتحان
                    </label>

                    <input
                        type="text"
                        id="examTitle"
                        placeholder="مثال: امتحان المحاضرة الأولى"
                        value="${escapeAttribute(
                            exam?.title || ""
                        )}"
                    >

                </div>

                <div class="form-group">

                    <label>
                        المادة
                    </label>

                    <select id="examSubject">

                        <option value="">
                            اختر المادة
                        </option>

                        ${subjects.map(subject => `
                            <option
                                value="${subject.id}"
                                ${
                                    exam?.subjectId ===
                                    subject.id
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${escapeHTML(
                                    subject.name ||
                                    "بدون اسم"
                                )}
                            </option>
                        `).join("")}

                    </select>

                </div>

                <div class="form-group">

                    <label>
                        مدة الامتحان بالدقائق
                    </label>

                    <input
                        type="number"
                        id="examDuration"
                        min="1"
                        placeholder="مثال: 60"
                        value="${escapeAttribute(
                            exam?.duration || ""
                        )}"
                    >

                </div>

                <div class="form-group">

                    <label>
                        وصف الامتحان
                    </label>

                    <textarea
                        id="examDescription"
                        rows="3"
                        placeholder="وصف مختصر للامتحان"
                    >${escapeHTML(
                        exam?.description || ""
                    )}</textarea>

                </div>

            </div>

            <div class="exam-builder-divider"></div>

            <div class="questions-header">

                <div>

                    <h3>
                        أسئلة الامتحان
                    </h3>

                    <p>
                        عدد الأسئلة:
                        <strong id="questionsCount">0</strong>
                        —
                        إجمالي الدرجات:
                        <strong id="questionsTotalMarks">0</strong>
                    </p>

                </div>

                <button
                    type="button"
                    class="primary-btn"
                    id="addQuestionBtn"
                >
                    ＋ إضافة سؤال
                </button>

            </div>

            <div
                id="examQuestionsContainer"
                class="exam-questions-container"
            ></div>

            <div
                id="examEmptyQuestions"
                class="exam-empty"
            >
                <div>
                    📝
                </div>

                <h3>
                    لم تتم إضافة أسئلة بعد
                </h3>

                <p>
                    اضغط على «إضافة سؤال» لبدء بناء الامتحان.
                </p>
            </div>

        </div>
    `;

    renderExamQuestions();

    content
        .querySelector("#addQuestionBtn")
        .addEventListener(
            "click",
            () => {

                addQuestion();

            }
        );

    const saveButton =
        modal.querySelector(".save-exam-btn");

    saveButton.addEventListener(
        "click",
        () => saveExam()
    );
}

/* =========================================================
   QUESTION NORMALIZATION
========================================================= */

function normalizeQuestions(questions) {

    return questions.map((question, index) => {

        return {

            id:
                question.id ||
                generateId(),

            type:
                question.type ||
                "mcq",

            text:
                question.text || "",

            marks:
                Number(question.marks) || 1,

            options:
                Array.isArray(question.options)
                    ? [...question.options]
                    : ["", "", "", ""],

            correctAnswer:
                question.correctAnswer ||
                "",

            modelAnswer:
                question.modelAnswer ||
                ""
        };
    });
}

/* =========================================================
   ADD QUESTION
========================================================= */

function addQuestion() {

    examQuestions.push({

        id: generateId(),

        type: "mcq",

        text: "",

        marks: 1,

        options: [
            "",
            "",
            "",
            ""
        ],

        correctAnswer: "",

        modelAnswer: ""
    });

    renderExamQuestions();

    setTimeout(() => {

        const container =
            document.getElementById(
                "examQuestionsContainer"
            );

        const cards =
            container?.querySelectorAll(
                ".question-card"
            );

        if (cards?.length) {

            cards[cards.length - 1]
                .scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
        }

    }, 50);
}

/* =========================================================
   RENDER QUESTIONS
========================================================= */

function renderExamQuestions() {

    const container =
        document.getElementById(
            "examQuestionsContainer"
        );

    const empty =
        document.getElementById(
            "examEmptyQuestions"
        );

    const count =
        document.getElementById(
            "questionsCount"
        );

    const total =
        document.getElementById(
            "questionsTotalMarks"
        );

    if (!container) return;

    if (count) {
        count.textContent =
            examQuestions.length;
    }

    if (total) {
        total.textContent =
            calculateTotalMarks(
                examQuestions
            );
    }

    if (!examQuestions.length) {

        container.innerHTML = "";

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }

    if (empty) {
        empty.style.display = "none";
    }

    container.innerHTML =
        examQuestions
            .map(
                (question, index) =>
                    renderQuestionCard(
                        question,
                        index
                    )
            )
            .join("");

    bindQuestionEvents();
}

/* =========================================================
   QUESTION CARD
========================================================= */

function renderQuestionCard(
    question,
    index
) {

    const typeLabels = {

        mcq:
            "اختيار من متعدد",

        true_false:
            "صح أم خطأ",

        fill_blank:
            "أكمل الفراغ",

        short_answer:
            "إجابة قصيرة"
    };

    return `
        <div
            class="question-card"
            data-index="${index}"
        >

            <div class="question-card-header">

                <div class="question-number">

                    <span>
                        سؤال ${index + 1}
                    </span>

                    <span class="question-type-badge">
                        ${
                            typeLabels[
                                question.type
                            ] || "سؤال"
                        }
                    </span>

                </div>

                <div class="question-actions">

                    <button
                        type="button"
                        class="question-action move-up"
                        data-index="${index}"
                        title="تحريك لأعلى"
                        ${
                            index === 0
                                ? "disabled"
                                : ""
                        }
                    >
                        ↑
                    </button>

                    <button
                        type="button"
                        class="question-action move-down"
                        data-index="${index}"
                        title="تحريك لأسفل"
                        ${
                            index ===
                            examQuestions.length - 1
                                ? "disabled"
                                : ""
                        }
                    >
                        ↓
                    </button>

                    <button
                        type="button"
                        class="question-action delete-question"
                        data-index="${index}"
                        title="حذف السؤال"
                    >
                        🗑️
                    </button>

                </div>

            </div>

            <div class="question-card-body">

                <div class="form-group">

                    <label>
                        نص السؤال
                    </label>

                    <textarea
                        class="question-text-input"
                        data-index="${index}"
                        rows="3"
                        placeholder="اكتب نص السؤال هنا..."
                    >${escapeHTML(
                        question.text
                    )}</textarea>

                </div>

                <div class="question-settings-grid">

                    <div class="form-group">

                        <label>
                            نوع السؤال
                        </label>

                        <select
                            class="question-type-input"
                            data-index="${index}"
                        >

                            <option
                                value="mcq"
                                ${
                                    question.type ===
                                    "mcq"
                                        ? "selected"
                                        : ""
                                }
                            >
                                اختيار من متعدد
                            </option>

                            <option
                                value="true_false"
                                ${
                                    question.type ===
                                    "true_false"
                                        ? "selected"
                                        : ""
                                }
                            >
                                صح أم خطأ
                            </option>

                            <option
                                value="fill_blank"
                                ${
                                    question.type ===
                                    "fill_blank"
                                        ? "selected"
                                        : ""
                                }
                            >
                                أكمل الفراغ
                            </option>

                            <option
                                value="short_answer"
                                ${
                                    question.type ===
                                    "short_answer"
                                        ? "selected"
                                        : ""
                                }
                            >
                                إجابة قصيرة
                            </option>

                        </select>

                    </div>

                    <div class="form-group">

                        <label>
                            درجة السؤال
                        </label>

                        <input
                            type="number"
                            class="question-marks-input"
                            data-index="${index}"
                            min="0.5"
                            step="0.5"
                            value="${escapeAttribute(
                                question.marks
                            )}"
                        >

                    </div>

                </div>

                ${renderQuestionAnswerArea(
                    question,
                    index
                )}

            </div>

        </div>
    `;
}

/* =========================================================
   ANSWER AREA
========================================================= */

function renderQuestionAnswerArea(
    question,
    index
) {

    if (question.type === "mcq") {

        return `
            <div class="question-answer-area">

                <div class="answer-area-title">
                    الاختيارات والإجابة الصحيحة
                </div>

                <div
                    class="mcq-options"
                    data-index="${index}"
                >

                    ${question.options
                        .map(
                            (option, optionIndex) => `
                                <div
                                    class="mcq-option-row"
                                >

                                    <input
                                        type="radio"
                                        name="correct-${question.id}"
                                        class="correct-option-input"
                                        data-index="${index}"
                                        data-option="${optionIndex}"
                                        ${
                                            question.correctAnswer ===
                                            String(
                                                optionIndex
                                            )
                                                ? "checked"
                                                : ""
                                        }
                                    >

                                    <input
                                        type="text"
                                        class="option-text-input"
                                        data-index="${index}"
                                        data-option="${optionIndex}"
                                        placeholder="الاختيار ${
                                            optionIndex + 1
                                        }"
                                        value="${escapeAttribute(
                                            option
                                        )}"
                                    >

                                    ${
                                        question.options
                                            .length > 2
                                            ? `
                                                <button
                                                    type="button"
                                                    class="remove-option-btn"
                                                    data-index="${index}"
                                                    data-option="${optionIndex}"
                                                    title="حذف الاختيار"
                                                >
                                                    ×
                                                </button>
                                              `
                                            : ""
                                    }

                                </div>
                            `
                        )
                        .join("")}

                </div>

                <button
                    type="button"
                    class="secondary-btn add-option-btn"
                    data-index="${index}"
                >
                    ＋ إضافة اختيار
                </button>

                <div class="answer-hint">
                    اختر الدائرة بجانب الإجابة الصحيحة.
                </div>

            </div>
        `;
    }

    if (question.type === "true_false") {

        return `
            <div class="question-answer-area">

                <div class="answer-area-title">
                    الإجابة الصحيحة
                </div>

                <div class="true-false-options">

                    <label class="answer-choice">

                        <input
                            type="radio"
                            name="tf-${question.id}"
                            class="true-false-input"
                            data-index="${index}"
                            value="true"
                            ${
                                question.correctAnswer ===
                                "true"
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            صح
                        </span>

                    </label>

                    <label class="answer-choice">

                        <input
                            type="radio"
                            name="tf-${question.id}"
                            class="true-false-input"
                            data-index="${index}"
                            value="false"
                            ${
                                question.correctAnswer ===
                                "false"
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            خطأ
                        </span>

                    </label>

                </div>

            </div>
        `;
    }

    if (question.type === "fill_blank") {

        return `
            <div class="question-answer-area">

                <div class="answer-area-title">
                    الإجابة النموذجية
                </div>

                <input
                    type="text"
                    class="model-answer-input"
                    data-index="${index}"
                    placeholder="اكتب الإجابة الصحيحة..."
                    value="${escapeAttribute(
                        question.correctAnswer
                    )}"
                >

                <div class="answer-hint">
                    يمكن للطالب كتابة الإجابة أثناء الامتحان.
                </div>

            </div>
        `;
    }

    return `
        <div class="question-answer-area">

            <div class="answer-area-title">
                الإجابة النموذجية
            </div>

            <textarea
                class="model-answer-textarea"
                data-index="${index}"
                rows="4"
                placeholder="اكتب الإجابة النموذجية التي سيعتمد عليها التصحيح..."
            >${escapeHTML(
                question.modelAnswer ||
                question.correctAnswer
            )}</textarea>

            <div class="answer-hint">
                هذا النوع يحتاج إلى مراجعة وتصحيح من الإدارة.
            </div>

        </div>
    `;
}

/* =========================================================
   BIND QUESTION EVENTS
========================================================= */

function bindQuestionEvents() {

    document
        .querySelectorAll(
            ".question-text-input"
        )
        .forEach(input => {

            input.addEventListener(
                "input",
                () => {

                    const index =
                        Number(
                            input.dataset.index
                        );

                    if (
                        examQuestions[index]
                    ) {

                        examQuestions[index]
                            .text =
                            input.value;
                    }
                }
            );
        });

    document
        .querySelectorAll(
            ".question-type-input"
        )
        .forEach(select => {

            select.addEventListener(
                "change",
                () => {

                    const index =
                        Number(
                            select.dataset.index
                        );

                    changeQuestionType(
                        index,
                        select.value
                    );
                }
            );
        });

    document
        .querySelectorAll(
            ".question-marks-input"
        )
        .forEach(input => {

            input.addEventListener(
                "input",
                () => {

                    const index =
                        Number(
                            input.dataset.index
                        );

                    if (
                        examQuestions[index]
                    ) {

                        let marks =
                            Number(
                                input.value
                            );

                        if (
                            !Number.isFinite(
                                marks
                            ) ||
                            marks <= 0
                        ) {
                            marks = 1;
                        }

                        examQuestions[index]
                            .marks =
                            marks;

                        updateQuestionSummary();
                    }
                }
            );
        });

    document
        .querySelectorAll(
            ".option-text-input"
        )
        .forEach(input => {

            input.addEventListener(
                "input",
                () => {

                    const index =
                        Number(
                            input.dataset.index
                        );

                    const option =
                        Number(
                            input.dataset.option
                        );

                    if (
                        examQuestions[index] &&
                        examQuestions[index]
                            .options[option] !==
                            undefined
                    ) {

                        examQuestions[index]
                            .options[option] =
                            input.value;
                    }
                }
            );
        });

    document
        .querySelectorAll(
            ".correct-option-input"
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    const index =
                        Number(
                            input.dataset.index
                        );

                    if (
                        examQuestions[index]
                    ) {

                        examQuestions[index]
                            .correctAnswer =
                            input.dataset.option;
                    }
                }
            );
        });

    document
        .querySelectorAll(
            ".true-false-input"
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    const index =
                        Number(
                            input.dataset.index
                        );

                    if (
                        examQuestions[index]
                    ) {

                        examQuestions[index]
                            .correctAnswer =
                            input.value;
                    }
                }
            );
        });

    document
        .querySelectorAll(
            ".model-answer-input"
        )
        .forEach(input => {

            input.addEventListener(
                "input",
                () => {

                    const index =
                        Number(
                            input.dataset.index
                        );

                    if (
                        examQuestions[index]
                    ) {

                        examQuestions[index]
                            .correctAnswer =
                            input.value;
                    }
                }
            );
        });

    document
        .querySelectorAll(
            ".model-answer-textarea"
        )
        .forEach(textarea => {

            textarea.addEventListener(
                "input",
                () => {

                    const index =
                        Number(
                            textarea.dataset.index
                        );

                    if (
                        examQuestions[index]
                    ) {

                        examQuestions[index]
                            .modelAnswer =
                            textarea.value;
                    }
                }
            );
        });

    document
        .querySelectorAll(
            ".add-option-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.index
                        );

                    if (
                        !examQuestions[index]
                    ) {
                        return;
                    }

                    examQuestions[index]
                        .options
                        .push("");

                    renderExamQuestions();
                }
            );
        });

    document
        .querySelectorAll(
            ".remove-option-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.index
                        );

                    const optionIndex =
                        Number(
                            button.dataset.option
                        );

                    const question =
                        examQuestions[index];

                    if (!question) return;

                    if (
                        question.options.length <=
                        2
                    ) {

                        notify(
                            "يجب أن يحتوي السؤال على اختيارين على الأقل",
                            "error"
                        );

                        return;
                    }

                    question.options
                        .splice(
                            optionIndex,
                            1
                        );

                    if (
                        question.correctAnswer ===
                        String(optionIndex)
                    ) {

                        question.correctAnswer =
                            "";

                    } else if (
                        question.correctAnswer !==
                        ""
                    ) {

                        const old =
                            Number(
                                question.correctAnswer
                            );

                        if (
                            old > optionIndex
                        ) {

                            question.correctAnswer =
                                String(
                                    old - 1
                                );
                        }
                    }

                    renderExamQuestions();
                }
            );
        });

    document
        .querySelectorAll(
            ".move-up"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    moveQuestion(
                        Number(
                            button.dataset.index
                        ),
                        -1
                    );
                }
            );
        });

    document
        .querySelectorAll(
            ".move-down"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    moveQuestion(
                        Number(
                            button.dataset.index
                        ),
                        1
                    );
                }
            );
        });

    document
        .querySelectorAll(
            ".delete-question"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteQuestion(
                        Number(
                            button.dataset.index
                        )
                    );
                }
            );
        });
}

/* =========================================================
   CHANGE QUESTION TYPE
========================================================= */

function changeQuestionType(
    index,
    type
) {

    const question =
        examQuestions[index];

    if (!question) return;

    question.type = type;

    if (type === "mcq") {

        if (
            !Array.isArray(
                question.options
            ) ||
            question.options.length < 2
        ) {

            question.options = [
                "",
                "",
                "",
                ""
            ];
        }

        question.correctAnswer =
            "";

        question.modelAnswer =
            "";
    }

    if (type === "true_false") {

        question.options = [
            "صح",
            "خطأ"
        ];

        question.correctAnswer =
            "";

        question.modelAnswer =
            "";
    }

    if (type === "fill_blank") {

        question.options = [];

        question.correctAnswer =
            "";

        question.modelAnswer =
            "";
    }

    if (type === "short_answer") {

        question.options = [];

        question.correctAnswer =
            "";

        question.modelAnswer =
            "";
    }

    renderExamQuestions();
}

/* =========================================================
   MOVE QUESTION
========================================================= */

function moveQuestion(
    index,
    direction
) {

    const newIndex =
        index + direction;

    if (
        newIndex < 0 ||
        newIndex >=
        examQuestions.length
    ) {
        return;
    }

    const temp =
        examQuestions[index];

    examQuestions[index] =
        examQuestions[newIndex];

    examQuestions[newIndex] =
        temp;

    renderExamQuestions();
}

/* =========================================================
   DELETE QUESTION
========================================================= */

function deleteQuestion(index) {

    const question =
        examQuestions[index];

    if (!question) return;

    const confirmed =
        window.confirm(
            `هل تريد حذف السؤال رقم ${
                index + 1
            }؟`
        );

    if (!confirmed) return;

    examQuestions.splice(
        index,
        1
    );

    renderExamQuestions();
}

/* =========================================================
   SAVE EXAM
========================================================= */

async function saveExam() {

    const titleInput =
        document.getElementById(
            "examTitle"
        );

    const subjectInput =
        document.getElementById(
            "examSubject"
        );

    const durationInput =
        document.getElementById(
            "examDuration"
        );

    const descriptionInput =
        document.getElementById(
            "examDescription"
        );

    const title =
        titleInput?.value.trim();

    const subjectId =
        subjectInput?.value;

    const duration =
        Number(
            durationInput?.value
        );

    const description =
        descriptionInput?.value.trim();

    if (!title) {

        notify(
            "اكتب اسم الامتحان أولاً",
            "error"
        );

        titleInput?.focus();

        return;
    }

    if (!subjectId) {

        notify(
            "اختر المادة",
            "error"
        );

        subjectInput?.focus();

        return;
    }

    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {

        notify(
            "اكتب مدة صحيحة للامتحان",
            "error"
        );

        durationInput?.focus();

        return;
    }

    if (!examQuestions.length) {

        notify(
            "أضف سؤالًا واحدًا على الأقل",
            "error"
        );

        return;
    }

    const validation =
        validateQuestions(
            examQuestions
        );

    if (!validation.valid) {

        notify(
            validation.message,
            "error"
        );

        return;
    }

    const subject =
        subjects.find(
            item =>
                item.id === subjectId
        );

    const data = {

        subjectId,

        subjectName:
            subject?.name || "",

        title,

        description,

        duration,

        totalMarks:
            calculateTotalMarks(
                examQuestions
            ),

        questions:
            cleanQuestions(
                examQuestions
            ),

        updatedAt:
            serverTimestamp()
    };

    try {

        if (editingExamId) {

            await updateDoc(
                doc(
                    db,
                    "exams",
                    editingExamId
                ),
                data
            );

            notify(
                "تم تحديث الامتحان بنجاح",
                "success"
            );

        } else {

            await addDoc(
                collection(
                    db,
                    "exams"
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
                "تم إنشاء الامتحان بنجاح",
                "success"
            );
        }

        closeModal();

        editingExamId = null;
        examQuestions = [];

        await loadExams();

    } catch (error) {

        console.error(
            "saveExam error:",
            error
        );

        notify(
            "حدث خطأ أثناء حفظ الامتحان",
            "error"
        );
    }
}

/* =========================================================
   VALIDATE QUESTIONS
========================================================= */

function validateQuestions(
    questions
) {

    for (
        let index = 0;
        index < questions.length;
        index++
    ) {

        const question =
            questions[index];

        if (
            !question.text ||
            !question.text.trim()
        ) {

            return {

                valid: false,

                message:
                    `اكتب نص السؤال رقم ${
                        index + 1
                    }`
            };
        }

        if (
            !Number.isFinite(
                Number(question.marks)
            ) ||
            Number(question.marks) <= 0
        ) {

            return {

                valid: false,

                message:
                    `حدد درجة صحيحة للسؤال رقم ${
                        index + 1
                    }`
            };
        }

        if (
            question.type ===
            "mcq"
        ) {

            const options =
                question.options || [];

            if (
                options.length < 2
            ) {

                return {

                    valid: false,

                    message:
                        `السؤال رقم ${
                            index + 1
                        } يحتاج اختيارين على الأقل`
                };
            }

            const hasEmptyOption =
                options.some(
                    option =>
                        !option ||
                        !option.trim()
                );

            if (
                hasEmptyOption
            ) {

                return {

                    valid: false,

                    message:
                        `أكمل جميع اختيارات السؤال رقم ${
                            index + 1
                        }`
                };
            }

            if (
                question.correctAnswer ===
                ""
            ) {

                return {

                    valid: false,

                    message:
                        `حدد الإجابة الصحيحة للسؤال رقم ${
                            index + 1
                        }`
                };
            }
        }

        if (
            question.type ===
            "true_false"
        ) {

            if (
                question.correctAnswer !==
                    "true" &&
                question.correctAnswer !==
                    "false"
            ) {

                return {

                    valid: false,

                    message:
                        `حدد إجابة سؤال الصح والخطأ رقم ${
                            index + 1
                        }`
                };
            }
        }

        if (
            question.type ===
            "fill_blank"
        ) {

            if (
                !question.correctAnswer ||
                !question.correctAnswer.trim()
            ) {

                return {

                    valid: false,

                    message:
                        `اكتب الإجابة الصحيحة لسؤال أكمل الفراغ رقم ${
                            index + 1
                        }`
                };
            }
        }

        if (
            question.type ===
            "short_answer"
        ) {

            if (
                !question.modelAnswer ||
                !question.modelAnswer.trim()
            ) {

                return {

                    valid: false,

                    message:
                        `اكتب الإجابة النموذجية للسؤال رقم ${
                            index + 1
                        }`
                };
            }
        }
    }

    return {
        valid: true
    };
}

/* =========================================================
   CLEAN QUESTIONS
========================================================= */

function cleanQuestions(
    questions
) {

    return questions.map(
        question => {

            const clean = {

                id: question.id,

                type: question.type,

                text:
                    question.text.trim(),

                marks:
                    Number(question.marks),

                options:
                    Array.isArray(
                        question.options
                    )
                        ? question.options.map(
                            option =>
                                String(
                                    option
                                ).trim()
                          )
                        : [],

                correctAnswer:
                    String(
                        question.correctAnswer ||
                        ""
                    ).trim(),

                modelAnswer:
                    String(
                        question.modelAnswer ||
                        ""
                    ).trim()
            };

            return clean;
        }
    );
}

/* =========================================================
   DELETE EXAM
========================================================= */

async function deleteExam(exam) {

    const confirmed =
        window.confirm(
            `هل أنت متأكد من حذف امتحان "${exam.title}"؟`
        );

    if (!confirmed) return;

    try {

        await deleteDoc(
            doc(
                db,
                "exams",
                exam.id
            )
        );

        notify(
            "تم حذف الامتحان",
            "success"
        );

        await loadExams();

    } catch (error) {

        console.error(
            "deleteExam error:",
            error
        );

        notify(
            "حدث خطأ أثناء حذف الامتحان",
            "error"
        );
    }
}

/* =========================================================
   EXAM PREVIEW
========================================================= */

function openExamPreview(exam) {

    const modal =
        createModal(
            "معاينة الامتحان"
        );

    const content =
        modal.querySelector(
            ".exam-builder-content"
        );

    const subject =
        subjects.find(
            item =>
                item.id ===
                exam.subjectId
        );

    const questions =
        exam.questions || [];

    content.innerHTML = `
        <div class="exam-preview">

            <div class="exam-preview-header">

                <div class="exam-preview-label">
                    ${escapeHTML(
                        subject?.name ||
                        exam.subjectName ||
                        "ENG Forge"
                    )}
                </div>

                <h2>
                    ${escapeHTML(
                        exam.title ||
                        "بدون اسم"
                    )}
                </h2>

                ${
                    exam.description
                        ? `
                            <p>
                                ${escapeHTML(
                                    exam.description
                                )}
                            </p>
                          `
                        : ""
                }

                <div class="exam-preview-meta">

                    <span>
                        📝
                        ${questions.length}
                        سؤال
                    </span>

                    <span>
                        ⭐
                        ${calculateTotalMarks(
                            questions
                        )}
                        درجة
                    </span>

                    ${
                        exam.duration
                            ? `
                                <span>
                                    ⏱️
                                    ${exam.duration}
                                    دقيقة
                                </span>
                              `
                            : ""
                    }

                </div>

            </div>

            <div class="preview-questions">

                ${
                    questions.length
                        ? questions
                              .map(
                                  (
                                      question,
                                      index
                                  ) =>
                                      renderPreviewQuestion(
                                          question,
                                          index
                                      )
                              )
                              .join("")
                        : `
                            <div class="exam-empty">
                                لا توجد أسئلة.
                            </div>
                          `
                }

            </div>

        </div>
    `;
}

/* =========================================================
   PREVIEW QUESTION
========================================================= */

function renderPreviewQuestion(
    question,
    index
) {

    const options =
        Array.isArray(
            question.options
        )
            ? question.options
            : [];

    if (
        question.type ===
        "true_false"
    ) {

        return `
            <div class="preview-question">

                <div class="preview-question-title">

                    <span>
                        ${index + 1}.
                    </span>

                    <span>
                        ${escapeHTML(
                            question.text
                        )}
                    </span>

                    <b>
                        ${question.marks} درجة
                    </b>

                </div>

                <div class="preview-options">

                    <label>
                        <input
                            type="radio"
                            disabled
                        >
                        صح
                    </label>

                    <label>
                        <input
                            type="radio"
                            disabled
                        >
                        خطأ
                    </label>

                </div>

            </div>
        `;
    }

    if (
        question.type ===
        "mcq"
    ) {

        return `
            <div class="preview-question">

                <div class="preview-question-title">

                    <span>
                        ${index + 1}.
                    </span>

                    <span>
                        ${escapeHTML(
                            question.text
                        )}
                    </span>

                    <b>
                        ${question.marks} درجة
                    </b>

                </div>

                <div class="preview-options">

                    ${options
                        .map(
                            option => `
                                <label>
                                    <input
                                        type="radio"
                                        disabled
                                    >

                                    ${escapeHTML(
                                        option
                                    )}
                                </label>
                            `
                        )
                        .join("")}

                </div>

            </div>
        `;
    }

    if (
        question.type ===
        "fill_blank"
    ) {

        return `
            <div class="preview-question">

                <div class="preview-question-title">

                    <span>
                        ${index + 1}.
                    </span>

                    <span>
                        ${escapeHTML(
                            question.text
                        )}
                    </span>

                    <b>
                        ${question.marks} درجة
                    </b>

                </div>

                <input
                    type="text"
                    disabled
                    placeholder="اكتب الإجابة..."
                >

            </div>
        `;
    }

    return `
        <div class="preview-question">

            <div class="preview-question-title">

                <span>
                    ${index + 1}.
                </span>

                <span>
                    ${escapeHTML(
                        question.text
                    )}
                </span>

                <b>
                    ${question.marks} درجة
                </b>

            </div>

            <textarea
                disabled
                rows="4"
                placeholder="اكتب إجابتك..."
            ></textarea>

        </div>
    `;
}

/* =========================================================
   CREATE MODAL
========================================================= */

function createModal(
    title
) {

    closeModal();

    const modal =
        document.createElement(
            "div"
        );

    modal.className =
        "modal active";

    modal.id =
        "examBuilderModal";

    modal.innerHTML = `
        <div class="modal-content exam-modal-content">

            <div class="modal-header">

                <h2>
                    ${escapeHTML(title)}
                </h2>

                <button
                    type="button"
                    class="modal-close"
                    aria-label="إغلاق"
                >
                    ×
                </button>

            </div>

            <div class="exam-builder-content"></div>

            <div class="form-actions">

                <button
                    type="button"
                    class="cancel-btn cancel-exam-btn"
                >
                    إلغاء
                </button>

                <button
                    type="button"
                    class="primary-btn save-exam-btn"
                >
                    💾 حفظ الامتحان
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    const closeButton =
        modal.querySelector(
            ".modal-close"
        );

    const cancelButton =
        modal.querySelector(
            ".cancel-exam-btn"
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

            if (
                event.target ===
                modal
            ) {
                closeModal();
            }
        }
    );

    return modal;
}

/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    document
        .querySelectorAll(
            "#examBuilderModal"
        )
        .forEach(modal => {

            modal.remove();
        });

    editingExamId = null;
    editingQuestionIndex = null;
    examQuestions = [];
}

/* =========================================================
   SUMMARY
========================================================= */

function calculateTotalMarks(
    questions
) {

    if (!Array.isArray(questions)) {
        return 0;
    }

    return questions.reduce(
        (
            total,
            question
        ) => {

            const marks =
                Number(
                    question.marks
                );

            return total +
                (
                    Number.isFinite(
                        marks
                    )
                        ? marks
                        : 0
                );
        },
        0
    );
}

function updateQuestionSummary() {

    const count =
        document.getElementById(
            "questionsCount"
        );

    const total =
        document.getElementById(
            "questionsTotalMarks"
        );

    if (count) {
        count.textContent =
            examQuestions.length;
    }

    if (total) {
        total.textContent =
            calculateTotalMarks(
                examQuestions
            );
    }
}

/* =========================================================
   HELPERS
========================================================= */

function generateId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

function escapeAttribute(value) {

    return escapeHTML(
        value
    );
}

/* =========================================================
   NOTIFICATION
========================================================= */

function notify(
    message,
    type = "success"
) {

    if (
        window.ENGForgeAdmin &&
        typeof
            window.ENGForgeAdmin
                .showNotification ===
            "function"
    ) {

        window.ENGForgeAdmin
            .showNotification(
                message,
                type
            );

        return;
    }

    let box =
        document.querySelector(
            ".notification"
        );

    if (!box) {

        box =
            document.createElement(
                "div"
            );

        box.className =
            "notification";

        document.body.appendChild(
            box
        );
    }

    box.textContent =
        message;

    box.classList.add(
        "show"
    );

    box.classList.toggle(
        "error",
        type === "error"
    );

    clearTimeout(
        box._timer
    );

    box._timer =
        setTimeout(
            () => {
                box.classList.remove(
                    "show"
                );
            },
            3000
        );
}

/* =========================================================
   GLOBAL API
========================================================= */

window.ENGForgeExams = {

    loadExams,

    loadSubjects,

    openExamModal,

    openExamPreview,

    getExams: () => exams,

    getSubjects: () => subjects

};

/* =========================================================
   END OF FILE
========================================================= */
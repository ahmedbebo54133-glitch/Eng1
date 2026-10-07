/* =========================================================
   ENG FORGE ⚙️
   STUDENT EXAM SYSTEM
   FIREBASE + FIRESTORE + TELEGRAM

   FINAL VERSION
   - Manual submit at ANY time
   - Automatic submit when timer reaches 00:00
   - Mobile submit button
   - Prevent duplicate submission
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
    serverTimestamp
} from "./firebase.js";


/* =========================================================
   TELEGRAM CONFIG
========================================================= */

const TELEGRAM_BOT_TOKEN =
    "8867025253:AAFcRnjMv_j1m1Jtmu2lcW0F7cEODhfB8bI";

const TELEGRAM_CHAT_ID =
    "7604770859";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let currentExam = null;

let currentStudent = null;

let questions = [];

let answers = {};

let currentQuestionIndex = 0;

let timerInterval = null;

let examStartedAt = null;

let examSubmitted = false;

let submittingExam = false;


/* =========================================================
   DOM
========================================================= */

const pageLoader =
    document.getElementById("examPageLoader");

const examError =
    document.getElementById("examError");

const examErrorMessage =
    document.getElementById("examErrorMessage");

const retryExamBtn =
    document.getElementById("retryExamBtn");

const errorBackBtn =
    document.getElementById("errorBackBtn");

const examContent =
    document.getElementById("examContent");

const examQuestions =
    document.getElementById("examQuestions");

const questionsEmpty =
    document.getElementById("questionsEmpty");

const examTitle =
    document.getElementById("examTitle");

const examSubject =
    document.getElementById("examSubject");

const examDescription =
    document.getElementById("examDescription");

const examDuration =
    document.getElementById("examDuration");

const examQuestionCount =
    document.getElementById("examQuestionCount");

const examTotalMarks =
    document.getElementById("examTotalMarks");

const examTimer =
    document.getElementById("examTimer");

const timerBox =
    document.getElementById("timerBox");

const answeredCount =
    document.getElementById("answeredCount");

const progressBar =
    document.getElementById("progressBar");

const questionNavigator =
    document.getElementById("questionNavigator");

const sidebarQuestionCount =
    document.getElementById("sidebarQuestionCount");

const currentQuestionNumber =
    document.getElementById("currentQuestionNumber");

const totalQuestionNumber =
    document.getElementById("totalQuestionNumber");

const previousQuestionBtn =
    document.getElementById("previousQuestionBtn");

const nextQuestionBtn =
    document.getElementById("nextQuestionBtn");

const examSubmitBtn =
    document.getElementById("sidebarSubmitBtn");

const confirmModal =
    document.getElementById("confirmModal");

const closeConfirmModal =
    document.getElementById("closeConfirmModal");

const cancelSubmitBtn =
    document.getElementById("cancelSubmitBtn");

const confirmSubmitBtn =
    document.getElementById("confirmSubmitBtn");

const modalQuestionCount =
    document.getElementById("modalQuestionCount");

const modalAnsweredCount =
    document.getElementById("modalAnsweredCount");

const modalUnansweredCount =
    document.getElementById("modalUnansweredCount");

const timeUpModal =
    document.getElementById("timeUpModal");

const timeUpSubmitBtn =
    document.getElementById("timeUpSubmitBtn");

const submissionSuccess =
    document.getElementById("submissionSuccess");

const successScore =
    document.getElementById("successScore");

const successTotalMarks =
    document.getElementById("successTotalMarks");

const successPercentage =
    document.getElementById("successPercentage");

const successStatus =
    document.getElementById("successStatus");

const successBackBtn =
    document.getElementById("successBackBtn");

const backToSubjectBtn =
    document.getElementById("backToSubjectBtn");

const examStudentName =
    document.getElementById("examStudentName");

const examStudentId =
    document.getElementById("examStudentId");

const examStudentAvatar =
    document.getElementById("examStudentAvatar");


/* =========================================================
   MOBILE SUBMIT BUTTON
========================================================= */

let mobileSubmitBtn = null;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupEvents();

        createMobileSubmitButton();

        watchAuthentication();

    }
);


/* =========================================================
   CREATE MOBILE SUBMIT BUTTON
========================================================= */

function createMobileSubmitButton() {

    const bottomActions =
        document.querySelector(
            ".bottom-actions-inner"
        );


    if (!bottomActions) {
        return;
    }


    /*
       لو الزر موجود بالفعل لا ننشئ واحدًا جديدًا
    */

    const existing =
        document.getElementById(
            "mobileSubmitBtn"
        );


    if (existing) {

        mobileSubmitBtn =
            existing;

        return;
    }


    mobileSubmitBtn =
        document.createElement("button");


    mobileSubmitBtn.type =
        "button";


    mobileSubmitBtn.id =
        "mobileSubmitBtn";


    mobileSubmitBtn.className =
        "navigation-btn primary-btn";


    mobileSubmitBtn.textContent =
        "✓ إرسال الامتحان";


    mobileSubmitBtn.style.display =
        "none";


    mobileSubmitBtn.style.width =
        "100%";


    mobileSubmitBtn.style.marginTop =
        "12px";


    mobileSubmitBtn.addEventListener(
        "click",
        openSubmitModal
    );


    /*
       نخلي الزر في سطر مستقل
    */

    const wrapper =
        document.createElement("div");


    wrapper.style.width =
        "100%";


    wrapper.style.marginTop =
        "10px";


    wrapper.appendChild(
        mobileSubmitBtn
    );


    const bottomSection =
        document.querySelector(
            ".exam-bottom-actions .exam-container"
        );


    if (bottomSection) {

        bottomSection.appendChild(
            wrapper
        );

    }

}


/* =========================================================
   MOBILE SUBMIT VISIBILITY
========================================================= */

function updateMobileSubmitVisibility() {

    if (!mobileSubmitBtn) {
        return;
    }


    if (
        examSubmitted ||
        submittingExam
    ) {

        mobileSubmitBtn.style.display =
            "none";

        return;

    }


    /*
       يظهر على الشاشات الصغيرة فقط
    */

    if (
        window.innerWidth <= 900
    ) {

        mobileSubmitBtn.style.display =
            "block";

    } else {

        mobileSubmitBtn.style.display =
            "none";

    }

}


window.addEventListener(
    "resize",
    updateMobileSubmitVisibility
);


/* =========================================================
   AUTH
========================================================= */

function watchAuthentication() {

    auth.onAuthStateChanged(
        async (user) => {

            if (!user) {

                showError(
                    "يجب تسجيل الدخول أولًا حتى تتمكن من حل الامتحان."
                );

                return;
            }


            currentUser =
                user;


            try {

                await loadStudentProfile();

                await loadExam();

            } catch (error) {

                console.error(
                    "Exam initialization error:",
                    error
                );


                showError(
                    "حدث خطأ أثناء تحميل الامتحان."
                );

            }

        }
    );

}


/* =========================================================
   URL
========================================================= */

function getExamId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get("id");

}


/* =========================================================
   LOAD STUDENT PROFILE
========================================================= */

async function loadStudentProfile() {

    currentStudent = {

        name:
            currentUser.displayName ||
            "الطالب",

        studentId:
            "",

        phone:
            "",

        photoURL:
            currentUser.photoURL ||
            ""

    };


    try {

        const userRef =
            doc(
                db,
                "users",
                currentUser.uid
            );


        const userSnap =
            await getDoc(
                userRef
            );


        if (userSnap.exists()) {

            const data =
                userSnap.data();


            currentStudent.name =
                data.name ||
                data.displayName ||
                currentUser.displayName ||
                "الطالب";


            currentStudent.studentId =
                data.studentId ||
                data.studentID ||
                data.idNumber ||
                "";


            currentStudent.phone =
                data.phone ||
                data.phoneNumber ||
                "";


            currentStudent.photoURL =
                data.photoURL ||
                data.photoUrl ||
                data.photo ||
                data.imageURL ||
                data.imageUrl ||
                currentUser.photoURL ||
                "";

        }

    } catch (error) {

        console.warn(
            "Could not load student profile:",
            error
        );

    }


    updateStudentUI();

}


/* =========================================================
   STUDENT UI
========================================================= */

function updateStudentUI() {

    if (examStudentName) {

        examStudentName.textContent =
            currentStudent.name ||
            "الطالب";

    }


    if (examStudentId) {

        examStudentId.textContent =
            currentStudent.studentId
                ? `ID: ${currentStudent.studentId}`
                : currentUser.email || "";

    }


    if (examStudentAvatar) {

        if (
            currentStudent.photoURL
        ) {

            examStudentAvatar.innerHTML = `
                <img
                    src="${escapeAttribute(
                        currentStudent.photoURL
                    )}"
                    alt="صورة الطالب"
                >
            `;

        } else {

            examStudentAvatar.textContent =
                getInitial(
                    currentStudent.name
                );

        }

    }

}


/* =========================================================
   LOAD EXAM
========================================================= */

async function loadExam() {

    const examId =
        getExamId();


    if (!examId) {

        showError(
            "رابط الامتحان غير صحيح."
        );

        return;
    }


    showLoader();


    const examRef =
        doc(
            db,
            "exams",
            examId
        );


    const examSnap =
        await getDoc(
            examRef
        );


    if (!examSnap.exists()) {

        showError(
            "الامتحان غير موجود."
        );

        return;
    }


    currentExam = {

        id:
            examSnap.id,

        ...examSnap.data()

    };


    questions =
        Array.isArray(
            currentExam.questions
        )
            ? currentExam.questions
            : [];


    if (!questions.length) {

        renderExamInfo();

        showMainPage();

        questionsEmpty.style.display =
            "block";

        examQuestions.innerHTML =
            "";

        stopTimer();

        updateMobileSubmitVisibility();

        return;
    }


    await checkPreviousSubmission();


    if (examSubmitted) {

        hideLoader();

        return;
    }


    restoreSavedAnswers();


    renderExamInfo();

    renderQuestions();

    renderNavigator();


    startTimer();


    showMainPage();


    updateMobileSubmitVisibility();

}


/* =========================================================
   EXAM INFO
========================================================= */

function renderExamInfo() {

    const duration =
        Number(
            currentExam.duration
        ) || 0;


    const totalMarks =
        Number(
            currentExam.totalMarks
        ) ||
        calculateTotalMarks();


    if (examTitle) {

        examTitle.textContent =
            currentExam.title ||
            "امتحان";

    }


    if (examSubject) {

        examSubject.textContent =
            currentExam.subjectName ||
            "المادة";

    }


    if (examDescription) {

        examDescription.textContent =
            currentExam.description ||
            "لا يوجد وصف لهذا الامتحان.";

    }


    if (examDuration) {

        examDuration.textContent =
            `${duration} دقيقة`;

    }


    if (examQuestionCount) {

        examQuestionCount.textContent =
            questions.length;

    }


    if (examTotalMarks) {

        examTotalMarks.textContent =
            totalMarks;

    }


    if (sidebarQuestionCount) {

        sidebarQuestionCount.textContent =
            questions.length;

    }


    if (totalQuestionNumber) {

        totalQuestionNumber.textContent =
            questions.length;

    }

}


/* =========================================================
   RENDER QUESTIONS
========================================================= */

function renderQuestions() {

    examQuestions.innerHTML =
        "";


    questions.forEach(
        (
            question,
            index
        ) => {

            const card =
                createQuestionCard(
                    question,
                    index
                );


            examQuestions.appendChild(
                card
            );

        }
    );


    questionsEmpty.style.display =
        questions.length
            ? "none"
            : "block";


    updateQuestionUI();

}


/* =========================================================
   CREATE QUESTION
========================================================= */

function createQuestionCard(
    question,
    index
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "question-card";


    card.dataset.index =
        index;


    const type =
        normalizeQuestionType(
            question.type
        );


    const typeLabel =
        getQuestionTypeLabel(
            type
        );


    const marks =
        Number(
            question.marks
        ) || 0;


    card.innerHTML = `

        <div class="question-card-header">

            <div class="question-number">

                <span class="question-number-badge">
                    ${index + 1}
                </span>

                <span>
                    السؤال ${index + 1}
                </span>

            </div>

            <span class="question-type">
                ${typeLabel}
            </span>

            <span class="question-marks">
                ${marks} درجة
            </span>

        </div>


        <div class="question-card-body">

            <div class="question-text">
                ${escapeHTML(
                    question.text || ""
                )}
            </div>


            <div
                class="question-answer-area"
                data-answer-area="${index}"
            ></div>

        </div>

    `;


    const answerArea =
        card.querySelector(
            `[data-answer-area="${index}"]`
        );


    renderAnswerArea(
        answerArea,
        question,
        index
    );


    return card;

}


/* =========================================================
   ANSWER AREA
========================================================= */

function renderAnswerArea(
    container,
    question,
    index
) {

    const type =
        normalizeQuestionType(
            question.type
        );


    if (
        type === "mcq"
    ) {

        renderMCQ(
            container,
            question,
            index
        );

        return;
    }


    if (
        type === "true_false"
    ) {

        renderTrueFalse(
            container,
            question,
            index
        );

        return;
    }


    if (
        type === "fill_blank"
    ) {

        renderFillBlank(
            container,
            question,
            index
        );

        return;
    }


    if (
        type === "short_answer"
    ) {

        renderShortAnswer(
            container,
            question,
            index
        );

        return;
    }


    container.innerHTML = `
        <div class="questions-empty">

            <div class="empty-icon">
                ⚠️
            </div>

            <p>
                نوع السؤال غير مدعوم.
            </p>

        </div>
    `;

}


/* =========================================================
   MCQ
========================================================= */

function renderMCQ(
    container,
    question,
    index
) {

    const options =
        Array.isArray(
            question.options
        )
            ? question.options
            : [];


    if (!options.length) {

        container.innerHTML = `
            <p class="option-text">
                لا توجد اختيارات لهذا السؤال.
            </p>
        `;

        return;
    }


    const letters = [
        "أ",
        "ب",
        "ج",
        "د",
        "هـ",
        "و",
        "ز",
        "ح"
    ];


    container.innerHTML = `

        <div class="answer-options">

            ${options.map(
                (
                    option,
                    optionIndex
                ) => {

                    const selected =
                        String(
                            answers[index] ?? ""
                        ) ===
                        String(
                            optionIndex
                        );


                    return `

                        <label
                            class="answer-option ${
                                selected
                                    ? "selected"
                                    : ""
                            }"
                        >

                            <input
                                type="radio"
                                name="question_${index}"
                                value="${optionIndex}"
                                ${
                                    selected
                                        ? "checked"
                                        : ""
                                }
                                data-question="${index}"
                                data-option="${optionIndex}"
                            >

                            <span class="custom-radio"></span>

                            <span class="option-letter">
                                ${
                                    letters[
                                        optionIndex
                                    ] ||
                                    optionIndex + 1
                                }
                            </span>

                            <span class="option-text">
                                ${escapeHTML(
                                    option
                                )}
                            </span>

                        </label>

                    `;

                }
            ).join("")}

        </div>

    `;


    const inputs =
        container.querySelectorAll(
            "input[type='radio']"
        );


    inputs.forEach(
        (input) => {

            input.addEventListener(
                "change",
                () => {

                    answers[index] =
                        input.value;


                    updateAnswerState(
                        index
                    );


                    updateMCQSelection(
                        container,
                        input.value
                    );


                    saveAnswersLocally();

                }
            );

        }
    );

}


/* =========================================================
   UPDATE MCQ SELECTION
========================================================= */

function updateMCQSelection(
    container,
    value
) {

    const labels =
        container.querySelectorAll(
            ".answer-option"
        );


    labels.forEach(
        (label) => {

            const input =
                label.querySelector(
                    "input"
                );


            label.classList.toggle(
                "selected",
                input &&
                String(
                    input.value
                ) ===
                String(value) &&
                input.checked
            );

        }
    );

}


/* =========================================================
   TRUE / FALSE
========================================================= */

function renderTrueFalse(
    container,
    question,
    index
) {

    const currentAnswer =
        String(
            answers[index] ?? ""
        ).toLowerCase();


    container.innerHTML = `

        <div class="true-false-options">

            <label
                class="
                    tf-option
                    true-option
                    ${
                        currentAnswer === "true"
                            ? "selected"
                            : ""
                    }
                "
            >

                <input
                    type="radio"
                    name="question_${index}"
                    value="true"
                    ${
                        currentAnswer === "true"
                            ? "checked"
                            : ""
                    }
                    data-question="${index}"
                >

                <span class="tf-icon">
                    ✓
                </span>

                <span class="tf-text">
                    صح
                </span>

            </label>


            <label
                class="
                    tf-option
                    false-option
                    ${
                        currentAnswer === "false"
                            ? "selected"
                            : ""
                    }
                "
            >

                <input
                    type="radio"
                    name="question_${index}"
                    value="false"
                    ${
                        currentAnswer === "false"
                            ? "checked"
                            : ""
                    }
                    data-question="${index}"
                >

                <span class="tf-icon">
                    ✕
                </span>

                <span class="tf-text">
                    خطأ
                </span>

            </label>

        </div>

    `;


    const inputs =
        container.querySelectorAll(
            "input[type='radio']"
        );


    inputs.forEach(
        (input) => {

            input.addEventListener(
                "change",
                () => {

                    answers[index] =
                        input.value;


                    const options =
                        container.querySelectorAll(
                            ".tf-option"
                        );


                    options.forEach(
                        (option) => {

                            const optionInput =
                                option.querySelector(
                                    "input"
                                );


                            option.classList.toggle(
                                "selected",
                                optionInput?.checked
                            );

                        }
                    );


                    updateAnswerState(
                        index
                    );


                    saveAnswersLocally();

                }
            );

        }
    );

}


/* =========================================================
   FILL BLANK
========================================================= */

function renderFillBlank(
    container,
    question,
    index
) {

    container.innerHTML = `

        <input
            type="text"
            class="answer-input"
            data-question="${index}"
            placeholder="اكتب إجابتك هنا..."
            value="${escapeAttribute(
                answers[index] || ""
            )}"
            autocomplete="off"
        >

    `;


    const input =
        container.querySelector(
            "input"
        );


    input.addEventListener(
        "input",
        () => {

            answers[index] =
                input.value;


            updateAnswerState(
                index
            );


            saveAnswersLocally();

        }
    );

}


/* =========================================================
   SHORT ANSWER
========================================================= */

function renderShortAnswer(
    container,
    question,
    index
) {

    container.innerHTML = `

        <textarea
            class="answer-textarea"
            data-question="${index}"
            placeholder="اكتب إجابتك بالتفصيل..."
        >${escapeHTML(
            answers[index] || ""
        )}</textarea>

    `;


    const textarea =
        container.querySelector(
            "textarea"
        );


    textarea.addEventListener(
        "input",
        () => {

            answers[index] =
                textarea.value;


            updateAnswerState(
                index
            );


            saveAnswersLocally();

        }
    );

}


/* =========================================================
   NAVIGATOR
========================================================= */

function renderNavigator() {

    questionNavigator.innerHTML =
        "";


    questions.forEach(
        (
            question,
            index
        ) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "question-nav-btn";


            button.textContent =
                index + 1;


            button.dataset.index =
                index;


            button.addEventListener(
                "click",
                () => {

                    goToQuestion(
                        index
                    );

                }
            );


            questionNavigator.appendChild(
                button
            );

        }
    );


    updateNavigator();

}


/* =========================================================
   GO TO QUESTION
========================================================= */

function goToQuestion(
    index
) {

    if (
        index < 0 ||
        index >= questions.length
    ) {
        return;
    }


    currentQuestionIndex =
        index;


    const card =
        examQuestions.querySelector(
            `.question-card[data-index="${index}"]`
        );


    if (card) {

        card.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    updateQuestionUI();

}


/* =========================================================
   NEXT
========================================================= */

function goNext() {

    if (
        currentQuestionIndex <
        questions.length - 1
    ) {

        goToQuestion(
            currentQuestionIndex + 1
        );

    }

}


/* =========================================================
   PREVIOUS
========================================================= */

function goPrevious() {

    if (
        currentQuestionIndex > 0
    ) {

        goToQuestion(
            currentQuestionIndex - 1
        );

    }

}


/* =========================================================
   QUESTION UI
========================================================= */

function updateQuestionUI() {

    const cards =
        examQuestions.querySelectorAll(
            ".question-card"
        );


    cards.forEach(
        (
            card,
            index
        ) => {

            card.classList.toggle(
                "current",
                index ===
                currentQuestionIndex
            );


            card.classList.toggle(
                "answered",
                isAnswered(
                    answers[index]
                )
            );

        }
    );


    if (currentQuestionNumber) {

        currentQuestionNumber.textContent =
            questions.length
                ? currentQuestionIndex + 1
                : 0;

    }


    if (totalQuestionNumber) {

        totalQuestionNumber.textContent =
            questions.length;

    }


    if (previousQuestionBtn) {

        previousQuestionBtn.disabled =
            currentQuestionIndex <= 0;

    }


    if (nextQuestionBtn) {

        nextQuestionBtn.disabled =
            currentQuestionIndex >=
            questions.length - 1;

    }


    updateNavigator();

    updateProgress();

}


/* =========================================================
   UPDATE NAVIGATOR
========================================================= */

function updateNavigator() {

    const buttons =
        questionNavigator.querySelectorAll(
            ".question-nav-btn"
        );


    buttons.forEach(
        (
            button,
            index
        ) => {

            button.classList.toggle(
                "current",
                index ===
                currentQuestionIndex
            );


            button.classList.toggle(
                "answered",
                isAnswered(
                    answers[index]
                )
            );

        }
    );

}


/* =========================================================
   UPDATE PROGRESS
========================================================= */

function updateProgress() {

    const total =
        questions.length;


    const answered =
        countAnswered();


    if (answeredCount) {

        answeredCount.textContent =
            `${answered} / ${total}`;

    }


    const percentage =
        total
            ? (
                answered /
                total
            ) * 100
            : 0;


    if (progressBar) {

        progressBar.style.width =
            `${percentage}%`;

    }

}


/* =========================================================
   ANSWER STATE
========================================================= */

function updateAnswerState(
    index
) {

    const card =
        examQuestions.querySelector(
            `.question-card[data-index="${index}"]`
        );


    if (card) {

        card.classList.toggle(
            "answered",
            isAnswered(
                answers[index]
            )
        );

    }


    updateNavigator();

    updateProgress();

}


/* =========================================================
   COUNT ANSWERS
========================================================= */

function countAnswered() {

    return questions.filter(
        (
            question,
            index
        ) =>
            isAnswered(
                answers[index]
            )
    ).length;

}


/* =========================================================
   IS ANSWERED
========================================================= */

function isAnswered(
    value
) {

    if (
        value === undefined ||
        value === null
    ) {

        return false;

    }


    return String(
        value
    ).trim() !== "";

}


/* =========================================================
   TIMER
========================================================= */

function startTimer() {

    stopTimer();


    const durationMinutes =
        Number(
            currentExam.duration
        ) || 0;


    if (
        durationMinutes <= 0
    ) {

        if (examTimer) {

            examTimer.textContent =
                "بدون وقت";

        }

        return;
    }


    const storageKey =
        getTimerStorageKey();


    const savedStartedAt =
        localStorage.getItem(
            storageKey
        );


    if (savedStartedAt) {

        examStartedAt =
            Number(
                savedStartedAt
            );

    } else {

        examStartedAt =
            Date.now();


        localStorage.setItem(
            storageKey,
            String(
                examStartedAt
            )
        );

    }


    updateTimer();


    if (
        !examSubmitted &&
        !submittingExam
    ) {

        timerInterval =
            setInterval(
                updateTimer,
                1000
            );

    }

}


/* =========================================================
   UPDATE TIMER
========================================================= */

function updateTimer() {

    if (
        !examStartedAt ||
        !currentExam ||
        examSubmitted ||
        submittingExam
    ) {

        return;

    }


    const durationMinutes =
        Number(
            currentExam.duration
        ) || 0;


    const totalMs =
        durationMinutes *
        60 *
        1000;


    const elapsed =
        Date.now() -
        examStartedAt;


    const remainingMs =
        totalMs -
        elapsed;


    if (
        remainingMs <= 0
    ) {

        if (examTimer) {

            examTimer.textContent =
                "00:00";

        }


        stopTimer();


        /*
           مهم:
           بمجرد وصول العداد للصفر
           يتم إرسال الامتحان تلقائيًا
           بدون انتظار ضغط الطالب على أي زر.
        */

        handleTimeUp();

        return;
    }


    const totalSeconds =
        Math.floor(
            remainingMs / 1000
        );


    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        totalSeconds % 60;


    if (examTimer) {

        examTimer.textContent =
            `${pad(minutes)}:${pad(seconds)}`;

    }


    if (timerBox) {

        timerBox.classList.remove(
            "warning",
            "danger"
        );


        if (
            totalSeconds <= 60
        ) {

            timerBox.classList.add(
                "danger"
            );

        } else if (
            totalSeconds <= 300
        ) {

            timerBox.classList.add(
                "warning"
            );

        }

    }

}


/* =========================================================
   STOP TIMER
========================================================= */

function stopTimer() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );


        timerInterval =
            null;

    }

}


/* =========================================================
   TIME UP
========================================================= */

function handleTimeUp() {

    if (
        examSubmitted ||
        submittingExam
    ) {

        return;

    }


    /*
       لا نطلب من الطالب الضغط على زر.
       الإرسال يتم مباشرة.
    */

    submitExam(
        true
    );

}


/* =========================================================
   OPEN SUBMIT MODAL
========================================================= */

function openSubmitModal() {

    if (
        examSubmitted ||
        submittingExam
    ) {

        return;

    }


    const total =
        questions.length;


    const answered =
        countAnswered();


    const unanswered =
        total -
        answered;


    if (modalQuestionCount) {

        modalQuestionCount.textContent =
            total;

    }


    if (modalAnsweredCount) {

        modalAnsweredCount.textContent =
            answered;

    }


    if (modalUnansweredCount) {

        modalUnansweredCount.textContent =
            unanswered;

    }


    if (confirmModal) {

        confirmModal.style.display =
            "flex";

    }


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE SUBMIT MODAL
========================================================= */

function closeSubmitModal() {

    if (confirmModal) {

        confirmModal.style.display =
            "none";

    }


    /*
       لو نافذة انتهاء الوقت غير موجودة
       لا يحدث أي خطأ.
    */

    if (
        !timeUpModal ||
        timeUpModal.style.display !==
            "flex"
    ) {

        document.body.style.overflow =
            "";

    }

}


/* =========================================================
   SUBMIT EXAM
========================================================= */

async function submitExam(
    automatic = false
) {

    if (
        examSubmitted ||
        submittingExam
    ) {

        return;

    }


    /*
       حماية من الضغط مرتين
    */

    submittingExam =
        true;


    closeSubmitModal();


    if (timeUpModal) {

        timeUpModal.style.display =
            "none";

    }


    stopTimer();


    document.body.style.overflow =
        "";


    /*
       قفل أزرار الإرسال
    */

    setSubmitButtonsDisabled(
        true
    );


    /*
       قفل كل إجابات الامتحان
    */

    setExamInputsDisabled(
        true
    );


    try {

        const result =
            buildResult();


        /*
           حفظ النتيجة في Firestore
        */

        const resultRef =
            await addDoc(
                collection(
                    db,
                    "results"
                ),
                result
            );


        console.log(
            "Exam result saved:",
            resultRef.id
        );


        examSubmitted =
            true;


        localStorage.setItem(
            getSubmittedStorageKey(),
            "true"
        );


        localStorage.removeItem(
            getTimerStorageKey()
        );


        localStorage.removeItem(
            getAnswersStorageKey()
        );


        updateMobileSubmitVisibility();


        /*
           عرض النجاح
        */

        showSuccess(
            result
        );


        /*
           إرسال الإجابات إلى Telegram
        */

        await sendResultToTelegram(
            result,
            automatic
        );


    } catch (error) {

        console.error(
            "Submit exam error:",
            error
        );


        submittingExam =
            false;


        setSubmitButtonsDisabled(
            false
        );


        setExamInputsDisabled(
            false
        );


        updateMobileSubmitVisibility();


        showErrorMessage(
            "حدث خطأ أثناء إرسال الامتحان. حاول مرة أخرى."
        );

    }

}


/* =========================================================
   LOCK EXAM INPUTS
========================================================= */

function setExamInputsDisabled(
    disabled
) {

    const inputs =
        examQuestions.querySelectorAll(
            "input, textarea, button"
        );


    inputs.forEach(
        (element) => {

            element.disabled =
                disabled;

        }
    );

}


/* =========================================================
   BUILD RESULT
========================================================= */

function buildResult() {

    let score =
        0;


    let hasManualQuestions =
        false;


    const resultAnswers =
        questions.map(
            (
                question,
                index
            ) => {

                const type =
                    normalizeQuestionType(
                        question.type
                    );


                const studentAnswer =
                    answers[index] ??
                    "";


                const marks =
                    Number(
                        question.marks
                    ) || 0;


                let isCorrect =
                    null;


                let marksAwarded =
                    0;


                if (
                    type === "mcq"
                ) {

                    isCorrect =
                        normalizeText(
                            studentAnswer
                        ) ===
                        normalizeText(
                            question.correctAnswer
                        );


                    if (isCorrect) {

                        marksAwarded =
                            marks;


                        score +=
                            marks;

                    }

                } else if (
                    type === "true_false"
                ) {

                    isCorrect =
                        normalizeBooleanAnswer(
                            studentAnswer
                        ) ===
                        normalizeBooleanAnswer(
                            question.correctAnswer
                        );


                    if (isCorrect) {

                        marksAwarded =
                            marks;


                        score +=
                            marks;

                    }

                } else if (
                    type === "fill_blank"
                ) {

                    isCorrect =
                        compareFillBlank(
                            studentAnswer,
                            question.correctAnswer
                        );


                    if (isCorrect) {

                        marksAwarded =
                            marks;


                        score +=
                            marks;

                    }

                } else if (
                    type === "short_answer"
                ) {

                    hasManualQuestions =
                        true;


                    isCorrect =
                        null;


                    marksAwarded =
                        0;

                } else {

                    hasManualQuestions =
                        true;

                }


                return {

                    questionId:
                        question.id ||
                        `question_${index + 1}`,

                    questionNumber:
                        index + 1,

                    type,

                    question:
                        question.text ||
                        "",

                    studentAnswer:
                        String(
                            studentAnswer
                        ),

                    isCorrect,

                    marks,

                    marksAwarded

                };

            }
        );


    const totalMarks =
        calculateTotalMarks();


    const percentage =
        totalMarks > 0
            ? Number(
                (
                    score /
                    totalMarks
                ) *
                100
            ).toFixed(2)
            : 0;


    return {

        studentId:
            currentUser.uid,

        studentName:
            currentStudent.name ||
            currentUser.displayName ||
            "الطالب",

        studentIdNumber:
            currentStudent.studentId ||
            "",

        studentPhone:
            currentStudent.phone ||
            "",

        examId:
            currentExam.id,

        examName:
            currentExam.title ||
            "",

        subjectId:
            currentExam.subjectId ||
            "",

        subjectName:
            currentExam.subjectName ||
            "",

        answers:
            resultAnswers,

        score,

        totalMarks,

        percentage,

        submittedAt:
            serverTimestamp(),

        gradingStatus:
            hasManualQuestions
                ? "manual"
                : "completed"

    };

}


/* =========================================================
   CHECK PREVIOUS SUBMISSION
========================================================= */

async function checkPreviousSubmission() {

    examSubmitted =
        false;


    const submittedKey =
        getSubmittedStorageKey();


    const locallySubmitted =
        localStorage.getItem(
            submittedKey
        ) === "true";


    if (locallySubmitted) {

        try {

            const existing =
                await findExistingResult();


            if (existing) {

                examSubmitted =
                    true;


                showAlreadySubmitted(
                    existing
                );


                return;

            }


            localStorage.removeItem(
                submittedKey
            );

        } catch (error) {

            console.warn(
                "Could not verify previous result:",
                error
            );

        }

    }


    try {

        const existing =
            await findExistingResult();


        if (existing) {

            examSubmitted =
                true;


            localStorage.setItem(
                submittedKey,
                "true"
            );


            showAlreadySubmitted(
                existing
            );

        }

    } catch (error) {

        console.warn(
            "Previous submission check failed:",
            error
        );

    }

}


/* =========================================================
   FIND EXISTING RESULT
========================================================= */

async function findExistingResult() {

    const resultsSnapshot =
        await getDocs(
            collection(
                db,
                "results"
            )
        );


    let found =
        null;


    resultsSnapshot.forEach(
        (resultDoc) => {

            if (found) {

                return;

            }


            const data =
                resultDoc.data();


            if (
                data.studentId ===
                    currentUser.uid &&
                data.examId ===
                    currentExam.id
            ) {

                found = {

                    id:
                        resultDoc.id,

                    ...data

                };

            }

        }
    );


    return found;

}


/* =========================================================
   SHOW ALREADY SUBMITTED
========================================================= */

function showAlreadySubmitted(
    result
) {

    stopTimer();


    renderExamInfo();


    showMainPage();


    examQuestions.innerHTML =
        "";


    const score =
        Number(
            result.score
        ) || 0;


    const total =
        Number(
            result.totalMarks
        ) ||
        calculateTotalMarks();


    const percentage =
        Number(
            result.percentage
        ) || 0;


    showSuccess({

        score,

        totalMarks:
            total,

        percentage,

        gradingStatus:
            result.gradingStatus ||
            "completed"

    });

}


/* =========================================================
   SUCCESS
========================================================= */

function showSuccess(
    result
) {

    if (successScore) {

        successScore.textContent =
            result.score ?? 0;

    }


    if (successTotalMarks) {

        successTotalMarks.textContent =
            result.totalMarks ??
            calculateTotalMarks();

    }


    if (successPercentage) {

        successPercentage.textContent =
            `${result.percentage ?? 0}%`;

    }


    if (successStatus) {

        successStatus.textContent =
            result.gradingStatus ===
            "manual"
                ? "تحت المراجعة"
                : "تم التصحيح";

    }


    if (submissionSuccess) {

        submissionSuccess.style.display =
            "flex";

    }


    if (examContent) {

        examContent.style.display =
            "none";

    }


    if (pageLoader) {

        pageLoader.style.display =
            "none";

    }


    updateMobileSubmitVisibility();


    document.body.style.overflow =
        "auto";

}


/* =========================================================
   TELEGRAM
========================================================= */

async function sendResultToTelegram(
    result,
    automatic
) {

    if (
        !TELEGRAM_BOT_TOKEN ||
        TELEGRAM_BOT_TOKEN ===
            "PUT_YOUR_BOT_TOKEN_HERE"
    ) {

        console.warn(
            "Telegram bot token is not configured."
        );

        return;

    }


    if (
        !TELEGRAM_CHAT_ID ||
        TELEGRAM_CHAT_ID ===
            "PUT_YOUR_CHAT_ID_HERE"
    ) {

        console.warn(
            "Telegram chat ID is not configured."
        );

        return;

    }


    const message =
        buildTelegramMessage(
            result,
            automatic
        );


    try {

        const response =
            await fetch(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                {

                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            chat_id:
                                TELEGRAM_CHAT_ID,

                            text:
                                message

                        })

                }
            );


        const data =
            await response.json();


        if (!data.ok) {

            console.error(
                "Telegram error:",
                data
            );

        }

    } catch (error) {

        console.error(
            "Telegram request failed:",
            error
        );

    }

}


/* =========================================================
   TELEGRAM MESSAGE
========================================================= */

function buildTelegramMessage(
    result,
    automatic
) {

    let message =
        "";


    message +=
        "================================\n";

    message +=
        "⚙️ ENG FORGE\n";

    message +=
        "إجابة امتحان جديدة\n";

    message +=
        "================================\n\n";


    message +=
        `👤 الطالب: ${result.studentName}\n`;

    message +=
        `🆔 رقم الطالب: ${
            result.studentIdNumber ||
            "غير مسجل"
        }\n`;

    message +=
        `📱 الهاتف: ${
            result.studentPhone ||
            "غير مسجل"
        }\n\n`;


    message +=
        `📝 الامتحان: ${
            result.examName
        }\n`;

    message +=
        `📚 المادة: ${
            result.subjectName ||
            "غير محددة"
        }\n`;


    message +=
        `🎯 الدرجة: ${
            result.score
        } / ${
            result.totalMarks
        }\n`;

    message +=
        `📊 النسبة: ${
            result.percentage
        }%\n`;

    message +=
        `📌 الحالة: ${
            result.gradingStatus ===
            "manual"
                ? "تحتاج مراجعة يدوية"
                : "تم التصحيح تلقائيًا"
        }\n`;

    message +=
        `⏰ طريقة التسليم: ${
            automatic
                ? "تلقائي - انتهى الوقت"
                : "تسليم يدوي"
        }\n\n`;


    message +=
        "================================\n";

    message +=
        "📋 إجابات الطالب\n";

    message +=
        "================================\n\n";


    result.answers.forEach(
        (answer) => {

            message +=
                `السؤال ${answer.questionNumber}:\n`;

            message +=
                `${answer.question}\n`;

            message +=
                `إجابة الطالب: ${
                    answer.studentAnswer ||
                    "بدون إجابة"
                }\n`;


            if (
                answer.isCorrect === true
            ) {

                message +=
                    `✓ صحيحة — ${
                        answer.marksAwarded
                    } درجة\n`;

            } else if (
                answer.isCorrect === false
            ) {

                message +=
                    `✕ خاطئة — 0 درجة\n`;

            } else {

                message +=
                    `◷ تحتاج مراجعة يدوية\n`;

            }


            message +=
                "\n";

        }
    );


    message +=
        "================================\n";

    message +=
        "ENG Forge ⚙️";


    return message;

}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function getStoragePrefix() {

    return `engforge_exam_${
        currentExam?.id ||
        "unknown"
    }`;

}


function getTimerStorageKey() {

    return `${
        getStoragePrefix()
    }_startedAt`;

}


function getAnswersStorageKey() {

    return `${
        getStoragePrefix()
    }_answers_${
        currentUser?.uid ||
        "unknown"
    }`;

}


function getSubmittedStorageKey() {

    return `${
        getStoragePrefix()
    }_submitted_${
        currentUser?.uid ||
        "unknown"
    }`;

}


/* =========================================================
   SAVE ANSWERS LOCALLY
========================================================= */

function saveAnswersLocally() {

    if (!currentExam) {

        return;

    }


    try {

        localStorage.setItem(
            getAnswersStorageKey(),
            JSON.stringify(
                answers
            )
        );

    } catch (error) {

        console.warn(
            "Could not save local answers:",
            error
        );

    }

}


/* =========================================================
   RESTORE ANSWERS
========================================================= */

function restoreSavedAnswers() {

    answers =
        {};


    try {

        const saved =
            localStorage.getItem(
                getAnswersStorageKey()
            );


        if (!saved) {

            return;

        }


        const parsed =
            JSON.parse(
                saved
            );


        if (
            parsed &&
            typeof parsed ===
                "object"
        ) {

            answers =
                parsed;

        }

    } catch (error) {

        console.warn(
            "Could not restore answers:",
            error
        );

    }

}


/* =========================================================
   TOTAL MARKS
========================================================= */

function calculateTotalMarks() {

    return questions.reduce(
        (
            total,
            question
        ) => {

            return total +
                (
                    Number(
                        question.marks
                    ) || 0
                );

        },
        0
    );

}


/* =========================================================
   NORMALIZE QUESTION TYPE
========================================================= */

function normalizeQuestionType(
    type
) {

    const value =
        String(
            type || ""
        ).toLowerCase();


    if (
        value === "mcq" ||
        value === "multiple_choice" ||
        value === "multiple-choice"
    ) {

        return "mcq";

    }


    if (
        value === "true_false" ||
        value === "true-false" ||
        value === "truefalse"
    ) {

        return "true_false";

    }


    if (
        value === "fill_blank" ||
        value === "fill-blank" ||
        value === "fillblank"
    ) {

        return "fill_blank";

    }


    if (
        value === "short_answer" ||
        value === "short-answer" ||
        value === "shortanswer"
    ) {

        return "short_answer";

    }


    return value;

}


/* =========================================================
   QUESTION TYPE LABEL
========================================================= */

function getQuestionTypeLabel(
    type
) {

    switch (type) {

        case "mcq":
            return "اختيار من متعدد";

        case "true_false":
            return "صح / خطأ";

        case "fill_blank":
            return "أكمل";

        case "short_answer":
            return "سؤال مقالي";

        default:
            return "سؤال";

    }

}


/* =========================================================
   FILL BLANK COMPARISON
========================================================= */

function compareFillBlank(
    studentAnswer,
    correctAnswer
) {

    const student =
        normalizeText(
            studentAnswer
        );


    const correct =
        normalizeText(
            correctAnswer
        );


    if (
        !student ||
        !correct
    ) {

        return false;

    }


    if (
        student === correct
    ) {

        return true;

    }


    const acceptedAnswers =
        correct
            .split("|")
            .map(
                value =>
                    value.trim()
            )
            .filter(Boolean);


    return acceptedAnswers.includes(
        student
    );

}


/* =========================================================
   NORMALIZE TEXT
========================================================= */

function normalizeText(
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
   NORMALIZE BOOLEAN
========================================================= */

function normalizeBooleanAnswer(
    value
) {

    const text =
        String(
            value ?? ""
        )
            .trim()
            .toLowerCase();


    if (
        text === "true" ||
        text === "صح" ||
        text === "yes" ||
        text === "1"
    ) {

        return true;

    }


    if (
        text === "false" ||
        text === "خطأ" ||
        text === "خطا" ||
        text === "no" ||
        text === "0"
    ) {

        return false;

    }


    return null;

}


/* =========================================================
   SUBMIT BUTTONS
========================================================= */

function setSubmitButtonsDisabled(
    disabled
) {

    if (examSubmitBtn) {

        examSubmitBtn.disabled =
            disabled;

    }


    if (confirmSubmitBtn) {

        confirmSubmitBtn.disabled =
            disabled;

    }


    if (timeUpSubmitBtn) {

        timeUpSubmitBtn.disabled =
            disabled;

    }


    if (mobileSubmitBtn) {

        mobileSubmitBtn.disabled =
            disabled;

    }

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {


    /* =========================================
       NEXT
    ========================================== */

    nextQuestionBtn?.addEventListener(
        "click",
        goNext
    );


    /* =========================================
       PREVIOUS
    ========================================== */

    previousQuestionBtn?.addEventListener(
        "click",
        goPrevious
    );


    /* =========================================
       SIDEBAR SUBMIT
    ========================================== */

    examSubmitBtn?.addEventListener(
        "click",
        openSubmitModal
    );


    /* =========================================
       CLOSE MODAL
    ========================================== */

    closeConfirmModal?.addEventListener(
        "click",
        closeSubmitModal
    );


    cancelSubmitBtn?.addEventListener(
        "click",
        closeSubmitModal
    );


    /* =========================================
       CONFIRM SUBMIT
    ========================================== */

    confirmSubmitBtn?.addEventListener(
        "click",
        () => {

            submitExam(
                false
            );

        }
    );


    /* =========================================
       TIME UP
    ========================================== */

    timeUpSubmitBtn?.addEventListener(
        "click",
        () => {

            /*
               احتياطي فقط.
               الإرسال أصبح تلقائيًا أصلًا
               عند وصول العداد للصفر.
            */

            submitExam(
                true
            );

        }
    );


    /* =========================================
       SUCCESS BACK
    ========================================== */

    successBackBtn?.addEventListener(
        "click",
        goBackToSubject
    );


    /* =========================================
       HEADER BACK
    ========================================== */

    backToSubjectBtn?.addEventListener(
        "click",
        goBackToSubject
    );


    /* =========================================
       ERROR BACK
    ========================================== */

    errorBackBtn?.addEventListener(
        "click",
        goBackToSubject
    );


    /* =========================================
       RETRY
    ========================================== */

    retryExamBtn?.addEventListener(
        "click",
        () => {

            hideError();


            loadExam().catch(
                error => {

                    console.error(
                        error
                    );


                    showError(
                        "تعذر تحميل الامتحان."
                    );

                }
            );

        }
    );


    /* =========================================
       MODAL BACKGROUND
    ========================================== */

    confirmModal?.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                confirmModal
            ) {

                closeSubmitModal();

            }

        }
    );


    /* =========================================
       ESC
    ========================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "Escape"
            ) {

                closeSubmitModal();

            }

        }
    );


    /* =========================================
       PREVENT ACCIDENTAL PAGE LEAVE
    ========================================== */

    window.addEventListener(
        "beforeunload",
        (event) => {

            if (
                currentExam &&
                !examSubmitted &&
                !submittingExam
            ) {

                event.preventDefault();

                event.returnValue =
                    "";

            }

        }
    );

}


/* =========================================================
   GO BACK TO SUBJECT
========================================================= */

function goBackToSubject() {

    stopTimer();


    const subjectId =
        currentExam?.subjectId;


    if (subjectId) {

        window.location.href =
            `subject.html?subjectId=${encodeURIComponent(
                subjectId
            )}`;

        return;

    }


    window.location.href =
        "index.html";

}


/* =========================================================
   LOADER
========================================================= */

function showLoader() {

    if (pageLoader) {

        pageLoader.style.display =
            "flex";

    }

}


function hideLoader() {

    if (pageLoader) {

        pageLoader.style.display =
            "none";

    }

}


/* =========================================================
   MAIN PAGE
========================================================= */

function showMainPage() {

    hideLoader();

    hideError();


    if (examContent) {

        examContent.style.display =
            "block";

    }


    updateMobileSubmitVisibility();

}


/* =========================================================
   ERROR
========================================================= */

function showError(
    message
) {

    hideLoader();


    if (examContent) {

        examContent.style.display =
            "none";

    }


    if (submissionSuccess) {

        submissionSuccess.style.display =
            "none";

    }


    if (examErrorMessage) {

        examErrorMessage.textContent =
            message;

    }


    if (examError) {

        examError.style.display =
            "flex";

    }


    document.body.style.overflow =
        "auto";

}


/* =========================================================
   ERROR MESSAGE WITHOUT HIDING PAGE
========================================================= */

function showErrorMessage(
    message
) {

    if (examErrorMessage) {

        examErrorMessage.textContent =
            message;

    }


    if (examError) {

        examError.style.display =
            "flex";

    }

}


/* =========================================================
   HIDE ERROR
========================================================= */

function hideError() {

    if (examError) {

        examError.style.display =
            "none";

    }

}


/* =========================================================
   HELPERS
========================================================= */

function pad(
    number
) {

    return String(
        number
    ).padStart(
        2,
        "0"
    );

}


function getInitial(
    name
) {

    const text =
        String(
            name || "?"
        ).trim();


    return text
        ? text.charAt(0)
        : "?";

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


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

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
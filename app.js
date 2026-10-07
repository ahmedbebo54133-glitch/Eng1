/*=========================================================
        ENG FORGE
        MAIN APP
        app.js
=========================================================*/


/*=========================================================
        FIREBASE IMPORTS
=========================================================*/

import {
    watchAuth,
    logoutUser,
    checkAdmin,
    getCollection,
    getDocument
} from "./firebase.js";


/*=========================================================
        DOM ELEMENTS
=========================================================*/

const accountBtn =
    document.getElementById("accountBtn");

const accountMenu =
    document.getElementById("accountMenu");

const guestAccount =
    document.getElementById("guestAccount");

const userAccount =
    document.getElementById("userAccount");

const userAvatarHome =
    document.getElementById("userAvatarHome");

const accountUserAvatar =
    document.getElementById("accountUserAvatar");

const accountUserName =
    document.getElementById("accountUserName");

const accountUserEmail =
    document.getElementById("accountUserEmail");

const adminLink =
    document.getElementById("adminLink");

const logoutBtn =
    document.getElementById("logoutBtn");

const subjectsContainer =
    document.getElementById("subjectsContainer");

const subjectsLoading =
    document.getElementById("subjectsLoading");

const subjectsEmpty =
    document.getElementById("subjectsEmpty");


/*=========================================================
        ACCOUNT MENU
=========================================================*/

function openAccountMenu(){

    if(!accountMenu){
        return;
    }

    accountMenu.hidden = false;

    if(accountBtn){

        accountBtn.setAttribute(
            "aria-expanded",
            "true"
        );

    }

}


function closeAccountMenu(){

    if(!accountMenu){
        return;
    }

    accountMenu.hidden = true;

    if(accountBtn){

        accountBtn.setAttribute(
            "aria-expanded",
            "false"
        );

    }

}


function toggleAccountMenu(){

    if(!accountMenu){
        return;
    }

    if(accountMenu.hidden){

        openAccountMenu();

    }else{

        closeAccountMenu();

    }

}


if(accountBtn){

    accountBtn.addEventListener(
        "click",
        function(event){

            event.stopPropagation();

            toggleAccountMenu();

        }
    );

}


/*=========================================================
        CLOSE MENU WHEN CLICK OUTSIDE
=========================================================*/

document.addEventListener(
    "click",
    function(event){

        if(!accountMenu || !accountBtn){
            return;
        }

        const clickedInsideButton =
            accountBtn.contains(event.target);

        const clickedInsideMenu =
            accountMenu.contains(event.target);

        if(
            !clickedInsideButton &&
            !clickedInsideMenu
        ){

            closeAccountMenu();

        }

    }
);


/*=========================================================
        ESC KEY
=========================================================*/

document.addEventListener(
    "keydown",
    function(event){

        if(event.key === "Escape"){

            closeAccountMenu();

        }

    }
);


/*=========================================================
        CREATE AVATAR IMAGE
=========================================================*/

function createAvatarImage(photoURL){

    const image =
        document.createElement("img");


    image.src =
        photoURL;


    image.alt =
        "صورة المستخدم";


    image.referrerPolicy =
        "no-referrer";


    image.loading =
        "lazy";


    /*
        لو الصورة فشلت في التحميل
        نرجع للأيقونة الافتراضية.
    */

    image.onerror =
        function(){

            image.remove();

        };


    return image;

}


/*=========================================================
        USER AVATAR
=========================================================*/

function setUserAvatar(
    user,
    firestoreData = {}
){

    if(!user){
        return;
    }


    /*
        الأولوية:

        1 - صورة Cloudinary الموجودة في Firestore
        2 - صورة Google الموجودة في Firebase Auth
        3 - الصورة الافتراضية
    */

    const photoURL =
        firestoreData.photoURL ||
        user.photoURL ||
        "";


    /*-----------------------------------------
        USER AVATAR - HEADER
    -----------------------------------------*/

    if(userAvatarHome){

        userAvatarHome.innerHTML = "";


        if(photoURL){

            userAvatarHome.appendChild(
                createAvatarImage(photoURL)
            );

        }else{

            userAvatarHome.textContent =
                "👤";

        }

    }


    /*-----------------------------------------
        USER AVATAR - MENU
    -----------------------------------------*/

    if(accountUserAvatar){

        accountUserAvatar.innerHTML = "";


        if(photoURL){

            accountUserAvatar.appendChild(
                createAvatarImage(photoURL)
            );

        }else{

            accountUserAvatar.textContent =
                "👤";

        }

    }

}


/*=========================================================
        USER INFORMATION
=========================================================*/

function showUserInformation(
    user,
    firestoreData = {}
){

    if(!user){
        return;
    }


    /*
        اسم Firestore أولاً
        ثم Firebase Auth
        ثم جزء البريد
    */

    const name =
        firestoreData.name ||
        firestoreData.studentName ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "المستخدم";


    const email =
        user.email ||
        firestoreData.email ||
        "بدون بريد إلكتروني";


    /*-----------------------------------------
        NAME
    -----------------------------------------*/

    if(accountUserName){

        accountUserName.textContent =
            name;

    }


    /*-----------------------------------------
        EMAIL
    -----------------------------------------*/

    if(accountUserEmail){

        accountUserEmail.textContent =
            email;

    }


    /*-----------------------------------------
        AVATAR
    -----------------------------------------*/

    setUserAvatar(
        user,
        firestoreData
    );

}


/*=========================================================
        GUEST ACCOUNT UI
=========================================================*/

function showGuestUI(){

    if(guestAccount){

        guestAccount.hidden = false;

    }


    if(userAccount){

        userAccount.hidden = true;

    }


    if(adminLink){

        adminLink.hidden = true;

    }


    if(userAvatarHome){

        userAvatarHome.innerHTML =
            "👤";

    }


    if(accountUserAvatar){

        accountUserAvatar.innerHTML =
            "👤";

    }


    if(accountUserName){

        accountUserName.textContent =
            "المستخدم";

    }


    if(accountUserEmail){

        accountUserEmail.textContent =
            "-";

    }

}


/*=========================================================
        LOGGED USER UI
=========================================================*/

async function showLoggedUserUI(user){

    if(!user){
        return;
    }


    if(guestAccount){

        guestAccount.hidden = true;

    }


    if(userAccount){

        userAccount.hidden = false;

    }


    /*-----------------------------------------
        GET USER DATA FROM FIRESTORE
    -----------------------------------------*/

    let firestoreData = {};


    try{

        const userDocument =
            await getDocument(
                "users",
                user.uid
            );


        if(userDocument.exists()){

            firestoreData =
                userDocument.data() || {};

        }

    }catch(error){

        console.error(
            "Get user profile error:",
            error
        );

    }


    /*-----------------------------------------
        SHOW USER INFORMATION
    -----------------------------------------*/

    showUserInformation(
        user,
        firestoreData
    );


    /*-----------------------------------------
        CHECK ADMIN
    -----------------------------------------*/

    try{

        const isAdmin =
            await checkAdmin(
                user.uid
            );


        if(adminLink){

            adminLink.hidden =
                !isAdmin;

        }

    }catch(error){

        console.error(
            "Admin check error:",
            error
        );


        if(adminLink){

            adminLink.hidden =
                true;

        }

    }

}


/*=========================================================
        LOGOUT
=========================================================*/

if(logoutBtn){

    logoutBtn.addEventListener(
        "click",
        async function(){

            try{

                logoutBtn.disabled =
                    true;


                logoutBtn.textContent =
                    "جاري تسجيل الخروج...";


                await logoutUser();


                closeAccountMenu();


            }catch(error){

                console.error(
                    "Logout error:",
                    error
                );


                alert(
                    "حدث خطأ أثناء تسجيل الخروج."
                );


            }finally{

                logoutBtn.disabled =
                    false;


                logoutBtn.innerHTML =
                    `
                    <span class="account-menu-icon">
                        🚪
                    </span>

                    <span>
                        تسجيل الخروج
                    </span>
                    `;

            }

        }
    );

}


/*=========================================================
        SUBJECTS
=========================================================*/

async function loadSubjects(){

    if(!subjectsContainer){
        return;
    }


    /*-----------------------------------------
        SHOW LOADING
    -----------------------------------------*/

    if(subjectsLoading){

        subjectsLoading.style.display =
            "block";

    }


    if(subjectsEmpty){

        subjectsEmpty.hidden =
            true;

    }


    try{

        const subjects =
            await getCollection(
                "subjects"
            );


        /*-----------------------------------------
            REMOVE OLD SUBJECT CARDS
        -----------------------------------------*/

        const oldCards =
            subjectsContainer.querySelectorAll(
                ".subject-card"
            );


        oldCards.forEach(
            card => card.remove()
        );


        /*-----------------------------------------
            NO SUBJECTS
        -----------------------------------------*/

        if(!subjects.length){

            if(subjectsLoading){

                subjectsLoading.style.display =
                    "none";

            }


            if(subjectsEmpty){

                subjectsEmpty.hidden =
                    false;

            }

            return;

        }


        /*-----------------------------------------
            SORT SUBJECTS
        -----------------------------------------*/

        subjects.sort(
            function(a,b){

                const orderA =
                    Number(
                        a.order ?? 999
                    );


                const orderB =
                    Number(
                        b.order ?? 999
                    );


                return orderA - orderB;

            }
        );


        /*-----------------------------------------
            CREATE SUBJECT CARDS
        -----------------------------------------*/

        subjects.forEach(
            function(subject){

                const card =
                    createSubjectCard(
                        subject
                    );


                subjectsContainer.appendChild(
                    card
                );

            }
        );


    }catch(error){

        console.error(
            "Load subjects error:",
            error
        );


        if(subjectsLoading){

            subjectsLoading.style.display =
                "none";

        }


        if(subjectsEmpty){

            subjectsEmpty.hidden =
                false;

        }

    }finally{

        if(subjectsLoading){

            subjectsLoading.style.display =
                "none";

        }

    }

}


/*=========================================================
        CREATE SUBJECT CARD
=========================================================*/

function createSubjectCard(subject){

    const card =
        document.createElement("article");


    card.className =
        "subject-card";


    /*-----------------------------------------
        SUBJECT DATA
    -----------------------------------------*/

    const name =
        subject.name ||
        subject.title ||
        "مادة بدون اسم";


    const description =
        subject.description ||
        "محاضرات وامتحانات ومحتوى المادة";


    const icon =
        subject.icon ||
        "⚙️";


    const id =
        subject.id;


    /*-----------------------------------------
        CARD CONTENT
    -----------------------------------------*/

    card.innerHTML =
        `
        <div class="subject-icon">
            ${escapeHTML(icon)}
        </div>

        <div class="subject-info">

            <h3>
                ${escapeHTML(name)}
            </h3>

            <p>
                ${escapeHTML(description)}
            </p>

        </div>

        <div class="subject-arrow">
            ←
        </div>
        `;


    /*-----------------------------------------
        OPEN SUBJECT
    -----------------------------------------*/

    card.addEventListener(
        "click",
        function(){

            openSubject(
                id,
                subject
            );

        }
    );


    return card;

}


/*=========================================================
        OPEN SUBJECT
=========================================================*/

function openSubject(
    subjectId,
    subject
){

    if(!subjectId){
        return;
    }


    /*
        سيتم لاحقًا إنشاء صفحة المادة
        وربطها بالمحاضرات والامتحانات والشيتات.

        حاليًا نستخدم:
        subject.html?id=SUBJECT_ID
    */


    window.location.href =
        `subject.html?id=${encodeURIComponent(subjectId)}`;

}


/*=========================================================
        ESCAPE HTML
=========================================================*/

function escapeHTML(value){

    const div =
        document.createElement("div");


    div.textContent =
        String(value ?? "");


    return div.innerHTML;

}


/*=========================================================
        AUTH STATE
=========================================================*/

watchAuth(
    async function(user){

        try{

            if(user){

                await showLoggedUserUI(
                    user
                );

            }else{

                showGuestUI();

            }

        }catch(error){

            console.error(
                "Auth state error:",
                error
            );

            showGuestUI();

        }

    }
);


/*=========================================================
        INITIAL LOAD
=========================================================*/

loadSubjects();


/*=========================================================
        END OF FILE
=========================================================*/
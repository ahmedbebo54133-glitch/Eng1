/*=========================================================
        ENG FORGE
        FIREBASE CONFIGURATION
=========================================================*/

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail
} from
    "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import {
    getFirestore,
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
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


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
        INITIALIZE FIREBASE
=========================================================*/

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/*=========================================================
        GOOGLE PROVIDER
=========================================================*/

const googleProvider =
    new GoogleAuthProvider();


/*=========================================================
        FIREBASE HELPERS
=========================================================*/


/* AUTH STATE */

function watchAuth(callback){

    return onAuthStateChanged(
        auth,
        callback
    );

}


/* EMAIL LOGIN */

async function loginWithEmail(
    email,
    password
){

    return await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

}


/* CREATE ACCOUNT */

async function registerWithEmail(
    email,
    password
){

    return await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

}


/* GOOGLE LOGIN */

async function loginWithGoogle(){

    return await signInWithPopup(
        auth,
        googleProvider
    );

}


/* LOGOUT */

async function logoutUser(){

    return await signOut(auth);

}


/*=========================================================
        PASSWORD RESET
=========================================================*/

/*
    إرسال رابط إعادة تعيين كلمة السر
    إلى البريد الإلكتروني الخاص بالطالب.
*/

async function resetPassword(email){

    return await sendPasswordResetEmail(
        auth,
        email
    );

}


/*=========================================================
        FIRESTORE HELPERS
=========================================================*/


/* GET DOCUMENT */

async function getDocument(
    collectionName,
    documentId
){

    const reference =
        doc(
            db,
            collectionName,
            documentId
        );

    return await getDoc(reference);

}


/* ADD DOCUMENT */

async function addDocument(
    collectionName,
    data
){

    return await addDoc(
        collection(db, collectionName),
        {
            ...data,
            createdAt:
                serverTimestamp()
        }
    );

}


/* SET DOCUMENT */

async function setDocument(
    collectionName,
    documentId,
    data
){

    return await setDoc(
        doc(
            db,
            collectionName,
            documentId
        ),
        data
    );

}


/* UPDATE DOCUMENT */

async function updateDocument(
    collectionName,
    documentId,
    data
){

    return await updateDoc(
        doc(
            db,
            collectionName,
            documentId
        ),
        {
            ...data,
            updatedAt:
                serverTimestamp()
        }
    );

}


/* DELETE DOCUMENT */

async function deleteDocument(
    collectionName,
    documentId
){

    return await deleteDoc(
        doc(
            db,
            collectionName,
            documentId
        )
    );

}


/* GET COLLECTION */

async function getCollection(
    collectionName
){

    const snapshot =
        await getDocs(
            collection(
                db,
                collectionName
            )
        );

    return snapshot.docs.map(
        document => ({
            id: document.id,
            ...document.data()
        })
    );

}


/*=========================================================
        ADMIN CHECK
=========================================================*/

async function checkAdmin(uid){

    if(!uid){
        return false;
    }


    const userDoc =
        await getDoc(
            doc(
                db,
                "users",
                uid
            )
        );


    if(!userDoc.exists()){
        return false;
    }


    const userData =
        userDoc.data();


    return userData.role === "admin";

}


/*=========================================================
        EXPORTS
=========================================================*/

export {

    app,

    auth,

    db,

    googleProvider,

    watchAuth,

    loginWithEmail,

    registerWithEmail,

    loginWithGoogle,

    logoutUser,

    resetPassword,

    getDocument,

    addDocument,

    setDocument,

    updateDocument,

    deleteDocument,

    getCollection,

    checkAdmin,

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

    serverTimestamp

};


/*=========================================================
        END OF FILE
=========================================================*/
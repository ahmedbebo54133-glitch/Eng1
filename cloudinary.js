/* =========================================================
   ENG FORGE ⚙️
   CLOUDINARY.JS
   ---------------------------------------------------------
   نفس Cloudinary المستخدم في ONE PIECE STORE
   Cloud Name:
   iir6bqt7

   Upload Preset:
   buying_upload

   لا يوجد Folder ثابت.
   ========================================================= */


/* =========================================================
   CLOUDINARY CONFIG
========================================================= */

const cloudinaryConfig = {

    cloudName:
        "iir6bqt7",

    uploadPreset:
        "buying_upload"
};


/* =========================================================
   CLOUDINARY UPLOAD URL
========================================================= */

const CLOUDINARY_IMAGE_UPLOAD_URL =
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;


/* =========================================================
   VALIDATE IMAGE
========================================================= */

function validateImageFile(
    file,
    maxSizeMB = 10
) {

    if (!file) {

        throw new Error(
            "لم يتم اختيار صورة."
        );
    }


    if (
        !file.type ||
        !file.type.startsWith("image/")
    ) {

        throw new Error(
            "الملف المختار ليس صورة."
        );
    }


    const maxBytes =
        maxSizeMB *
        1024 *
        1024;


    if (file.size > maxBytes) {

        throw new Error(
            `حجم الصورة يجب ألا يتجاوز ${maxSizeMB}MB.`
        );
    }


    return true;
}


/* =========================================================
   MAIN IMAGE UPLOAD
========================================================= */

function uploadImageToCloudinary(
    file,
    {
        maxSizeMB = 10,
        onProgress = null
    } = {}
) {

    validateImageFile(
        file,
        maxSizeMB
    );


    return new Promise(
        (resolve, reject) => {

            const formData =
                new FormData();


            formData.append(
                "file",
                file
            );


            formData.append(
                "upload_preset",
                cloudinaryConfig.uploadPreset
            );


            /* =============================================
               XHR
            ============================================= */

            const xhr =
                new XMLHttpRequest();


            xhr.open(
                "POST",
                CLOUDINARY_IMAGE_UPLOAD_URL,
                true
            );


            /* =============================================
               UPLOAD PROGRESS
            ============================================= */

            xhr.upload.addEventListener(
                "progress",
                (event) => {

                    if (
                        !event.lengthComputable
                    ) {

                        return;
                    }


                    const percent =
                        Math.round(
                            (
                                event.loaded /
                                event.total
                            ) * 100
                        );


                    if (
                        typeof onProgress ===
                        "function"
                    ) {

                        onProgress(
                            percent
                        );
                    }
                }
            );


            /* =============================================
               RESPONSE
            ============================================= */

            xhr.onload = () => {

                let result = null;


                try {

                    result =
                        JSON.parse(
                            xhr.responseText
                        );

                } catch (error) {

                    reject(
                        new Error(
                            "تعذر قراءة استجابة Cloudinary."
                        )
                    );

                    return;
                }


                if (
                    xhr.status >= 200 &&
                    xhr.status < 300
                ) {

                    resolve({

                        secure_url:
                            result.secure_url ||
                            "",

                        public_id:
                            result.public_id ||
                            "",

                        resource_type:
                            result.resource_type ||
                            "image",

                        format:
                            result.format ||
                            "",

                        width:
                            result.width ??
                            null,

                        height:
                            result.height ??
                            null,

                        bytes:
                            result.bytes ??
                            file.size,

                        original_filename:
                            result.original_filename ||
                            file.name,

                        created_at:
                            result.created_at ||
                            null
                    });

                    return;
                }


                reject(
                    new Error(
                        result?.error?.message ||
                        "فشل رفع الصورة إلى Cloudinary."
                    )
                );
            };


            /* =============================================
               NETWORK ERROR
            ============================================= */

            xhr.onerror = () => {

                reject(
                    new Error(
                        "حدث خطأ في الاتصال بـ Cloudinary."
                    )
                );
            };


            /* =============================================
               ABORT
            ============================================= */

            xhr.onabort = () => {

                reject(
                    new Error(
                        "تم إلغاء رفع الصورة."
                    )
                );
            };


            /* =============================================
               SEND
            ============================================= */

            xhr.send(
                formData
            );
        }
    );
}


/* =========================================================
   PROFILE IMAGE
========================================================= */

async function uploadProfileImage(
    file,
    onProgress = null
) {

    return uploadImageToCloudinary(
        file,
        {
            maxSizeMB: 5,
            onProgress
        }
    );
}


/* =========================================================
   GENERIC IMAGE UPLOAD
========================================================= */

async function uploadImage(
    file,
    onProgress = null
) {

    return uploadImageToCloudinary(
        file,
        {
            maxSizeMB: 10,
            onProgress
        }
    );
}


/* =========================================================
   IMAGE PREVIEW
========================================================= */

function createImagePreviewURL(
    file
) {

    if (!file) {

        return null;
    }


    return URL.createObjectURL(
        file
    );
}


/* =========================================================
   REVOKE PREVIEW URL
========================================================= */

function revokeImagePreviewURL(
    url
) {

    if (!url) {

        return;
    }


    try {

        URL.revokeObjectURL(
            url
        );

    } catch (_) {}
}


/* =========================================================
   FILE READER PREVIEW
========================================================= */

function previewImageFile(
    file,
    callback
) {

    if (!file) {

        if (
            typeof callback ===
            "function"
        ) {

            callback(null);
        }

        return;
    }


    if (
        !file.type ||
        !file.type.startsWith("image/")
    ) {

        if (
            typeof callback ===
            "function"
        ) {

            callback(null);
        }

        return;
    }


    const reader =
        new FileReader();


    reader.onload =
        (event) => {

            if (
                typeof callback ===
                "function"
            ) {

                callback(
                    event.target.result
                );
            }
        };


    reader.onerror =
        () => {

            if (
                typeof callback ===
                "function"
            ) {

                callback(null);
            }
        };


    reader.readAsDataURL(
        file
    );
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.cloudinaryConfig =
    cloudinaryConfig;

window.uploadImageToCloudinary =
    uploadImageToCloudinary;

window.uploadImage =
    uploadImage;

window.uploadProfileImage =
    uploadProfileImage;

window.validateImageFile =
    validateImageFile;

window.createImagePreviewURL =
    createImagePreviewURL;

window.revokeImagePreviewURL =
    revokeImagePreviewURL;

window.previewImageFile =
    previewImageFile;


/* =========================================================
   READY
========================================================= */

console.log(
    "ENG Forge ⚙️ — Cloudinary initialized successfully."
);
const updatePasswordForm =
    document.getElementById(
        "updatePasswordForm"
    );

const newPassword =
    document.getElementById(
        "newPassword"
    );

const confirmPassword =
    document.getElementById(
        "confirmPassword"
    );

const passwordMessage =
    document.getElementById(
        "passwordMessage"
    );


let recoveryReady =
    false;


/* =========================================
   PASSWORD RECOVERY SESSION
========================================= */

db.auth.onAuthStateChange(
    function(
        event,
        session
    ) {

        console.log(
            "Auth event:",
            event
        );


        if (
            event ===
            "PASSWORD_RECOVERY"
        ) {

            recoveryReady =
                true;


            passwordMessage.textContent =
                "Reset link verified. Enter your new password.";

        }

    }
);


/* =========================================
   UPDATE PASSWORD
========================================= */

updatePasswordForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const password =
            newPassword.value;


        const confirm =
            confirmPassword.value;


        if (
            password.length <
            8
        ) {

            passwordMessage.textContent =
                "Password must be at least 8 characters.";

            return;

        }


        if (
            password !==
            confirm
        ) {

            passwordMessage.textContent =
                "Passwords do not match.";

            return;

        }


        passwordMessage.textContent =
            "Updating password...";


        const {
            error
        } =
            await db.auth
                .updateUser(
                    {
                        password:
                            password
                    }
                );


        if (error) {

            console.error(error);

            passwordMessage.textContent =
                "ERROR: " +
                error.message;

            return;

        }


        passwordMessage.textContent =
            "Password updated successfully.";


        setTimeout(
            function() {

                window.location.href =
                    "login.html";

            },
            1500
        );

    }
);
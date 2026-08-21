const forgotPasswordForm =
    document.getElementById(
        "forgotPasswordForm"
    );

const resetEmail =
    document.getElementById(
        "resetEmail"
    );

const resetMessage =
    document.getElementById(
        "resetMessage"
    );


forgotPasswordForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        resetMessage.textContent =
            "Sending reset link...";


        const email =
            resetEmail.value
                .trim();


        if (!email) {

            resetMessage.textContent =
                "Enter your email address.";

            return;

        }


        /*
           IMPORTANT:

           Change this URL when deployed.

           Local:
           http://127.0.0.1:3000/update-password.html

           GitHub:
           https://YOUR-USERNAME.github.io/trading-journal/update-password.html
        */

        const redirectUrl =
            window.location.origin +
            window.location.pathname
                .replace(
                    "forgot-password.html",
                    "update-password.html"
                );


        const {
            error
        } =
            await db.auth
                .resetPasswordForEmail(
                    email,
                    {
                        redirectTo:
                            redirectUrl
                    }
                );


        if (error) {

            console.error(error);

            resetMessage.textContent =
                "ERROR: " +
                error.message;

            return;

        }


        resetMessage.textContent =
            "Password reset email sent. Check your inbox.";

    }
);
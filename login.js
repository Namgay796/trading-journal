const loginForm =
    document.getElementById(
        "loginForm"
    );


const loginMessage =
    document.getElementById(
        "loginMessage"
    );



/* =====================================
   IF ALREADY LOGGED IN
===================================== */

async function checkExistingSession() {

    const {
        data: {
            session
        }
    } =
        await db.auth.getSession();


    if (session) {

        window.location.href =
            "index.html";

    }

}



/* =====================================
   LOGIN
===================================== */

loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        loginMessage.textContent =
            "Signing in...";


        const email =
            document
                .getElementById(
                    "email"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "password"
                )
                .value;


        const {
            data,
            error
        } =
            await db.auth
                .signInWithPassword({

                    email:
                        email,

                    password:
                        password

                });


        if (error) {

            console.error(error);

            loginMessage.textContent =
                "ERROR: " +
                error.message;

            return;

        }


        if (
            data.session
        ) {

            loginMessage.textContent =
                "Login successful.";


            window.location.href =
                "index.html";

        }

    }
);



checkExistingSession();
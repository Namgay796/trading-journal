const signupForm =
    document.getElementById(
        "signupForm"
    );


const signupMessage =
    document.getElementById(
        "signupMessage"
    );



signupForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const email =
            document
                .getElementById(
                    "signupEmail"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "signupPassword"
                )
                .value;


        const confirmPassword =
            document
                .getElementById(
                    "confirmPassword"
                )
                .value;



        if (
            password !==
            confirmPassword
        ) {

            signupMessage.textContent =
                "Passwords do not match.";

            return;

        }



        signupMessage.textContent =
            "Creating account...";



        const {
            data,
            error
        } =
            await db.auth
                .signUp({

                    email:
                        email,

                    password:
                        password

                });



        if (error) {

            console.error(error);

            signupMessage.textContent =
                "ERROR: " +
                error.message;

            return;

        }



        /*
           If email confirmation is enabled,
           session may be null.
        */

        if (
            data.session
        ) {

            signupMessage.textContent =
                "Account created successfully!";


            setTimeout(
                () => {

                    window.location.href =
                        "accounts.html";

                },
                1000
            );

        }

        else {

            signupMessage.textContent =
                "Account created. Check your email to confirm your account, then sign in.";

        }

    }
);
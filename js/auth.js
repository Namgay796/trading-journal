async function requireLogin() {

    const {
        data: {
            session
        },
        error
    } =
        await db.auth.getSession();


    if (
        error ||
        !session
    ) {

        window.location.href =
            "login.html";

        return null;

    }


    return session.user;

}



async function logout() {

    const { error } =
        await db.auth.signOut();


    if (error) {

        alert(
            error.message
        );

        return;

    }


    window.location.href =
        "login.html";

}
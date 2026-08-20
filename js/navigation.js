/* =========================================
   ACTIVE NAVIGATION
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const navLinks =
            document.querySelectorAll(
                ".main-nav a"
            );


        /* =================================
           GET CURRENT PAGE
        ================================= */

        let currentPage =
            window.location.pathname
                .split("/")
                .pop();


        /*
           If URL ends with /
           treat it as index.html
        */

        if (
            !currentPage ||
            currentPage === ""
        ) {

            currentPage =
                "index.html";

        }


        /* =================================
           CHECK EACH NAV LINK
        ================================= */

        navLinks.forEach(
            link => {

                const href =
                    link
                        .getAttribute(
                            "href"
                        );


                /*
                   Remove active class first
                */

                link.classList.remove(
                    "active"
                );


                /*
                   Highlight current page
                */

                if (
                    href ===
                    currentPage
                ) {

                    link.classList.add(
                        "active"
                    );

                }

            }
        );

    }
);
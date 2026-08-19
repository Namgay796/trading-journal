document.addEventListener(
    "DOMContentLoaded",
    function() {

        let currentPage =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();


        if (
            currentPage === ""
        ) {

            currentPage =
                "index.html";

        }


        /*
           Edit Trade belongs to History
        */

        if (
            currentPage ===
            "edit-trade.html"
        ) {

            currentPage =
                "trades.html";

        }


        const navLinks =
            document.querySelectorAll(
                ".main-nav a"
            );


        navLinks.forEach(
            link => {

                const linkPage =
                    link
                        .getAttribute(
                            "href"
                        )
                        .split("/")
                        .pop()
                        .toLowerCase();


                link.classList.remove(
                    "active"
                );


                if (
                    currentPage ===
                    linkPage
                ) {

                    link.classList.add(
                        "active"
                    );

                }

            }
        );

    }
);
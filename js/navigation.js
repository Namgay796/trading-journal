document.addEventListener(
    "DOMContentLoaded",
    function() {

        const currentPage =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();


        const navLinks =
            document.querySelectorAll(
                ".desktop-nav a, .mobile-nav a"
            );


        navLinks.forEach(link => {

            const linkPage =
                link
                    .getAttribute("href")
                    .split("/")
                    .pop()
                    .toLowerCase();


            link.classList.remove(
                "active"
            );


            if (
                currentPage === linkPage
            ) {

                link.classList.add(
                    "active"
                );

            }


            /*
               If opening root /
               treat it as index.html
            */

            if (
                currentPage === "" &&
                linkPage === "index.html"
            ) {

                link.classList.add(
                    "active"
                );

            }

        });

    }
);
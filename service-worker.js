const CACHE_NAME =
    "trading-journal-v10";


const FILES_TO_CACHE = [

    "./",

    "./index.html",

    "./login.html",

    "./signup.html",

    "./add-trade.html",

    "./edit-trade.html",

    "./trades.html",

    "./analytics.html",

    "./calendar.html",

    "./accounts.html",

    "./css/style.css",

    "./js/config.js",

    "./js/auth.js",

    "./js/login.js",

    "./js/signup.js",

    "./js/navigation.js",

    "./js/dashboard.js",

    "./js/add-trade.js",

    "./js/edit-trade.js",

    "./js/trades.js",

    "./js/analytics.js",

    "./js/calendar.js",

    "./js/accounts.js"

];


self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(
                    cache =>
                        cache.addAll(
                            FILES_TO_CACHE
                        )
                )

        );

    }
);


self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches
                .keys()
                .then(keys => {

                    return Promise.all(

                        keys.map(key => {

                            if (
                                key !==
                                CACHE_NAME
                            ) {

                                return caches
                                    .delete(key);

                            }

                        })

                    );

                })

        );

    }
);


self.addEventListener(
    "fetch",
    event => {

        event.respondWith(

            caches
                .match(
                    event.request
                )
                .then(
                    response =>
                        response ||
                        fetch(
                            event.request
                        )
                )

        );

    }
);

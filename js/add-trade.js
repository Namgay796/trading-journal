const accountBox =
    document.getElementById("account");

const message =
    document.getElementById("message");


/* =========================================
   LOAD ACCOUNTS
========================================= */

async function loadAccounts() {

    message.textContent =
        "Connecting to Supabase...";


    const { data, error } =
        await db
            .from("accounts")
            .select("*")
            .order("id");


    if (error) {

        console.error(error);

        message.textContent =
            "ERROR: " + error.message;

        return;

    }


    if (!data || data.length === 0) {

        message.textContent =
            "No accounts found.";

        return;

    }


    accountBox.innerHTML = "";


    data.forEach(account => {

        const option =
            document.createElement("option");


        option.value =
            account.id;


        option.textContent =
            account.name +
            " ($" +
            Number(
                account.starting_balance
            ).toFixed(2) +
            ")";


        accountBox.appendChild(option);

    });


    message.textContent =
        "Connected to Supabase.";

}



/* =========================================
   CALCULATE RR
========================================= */

function calculateRR() {

    const entry =
        Number(
            document
                .getElementById("entry")
                .value
        );


    const stop =
        Number(
            document
                .getElementById("stopLoss")
                .value
        );


    const target =
        Number(
            document
                .getElementById("takeProfit")
                .value
        );


    if (
        !entry ||
        !stop ||
        !target
    ) {

        document
            .getElementById("rr")
            .textContent =
            "0";

        return;

    }


    const risk =
        Math.abs(
            entry - stop
        );


    const reward =
        Math.abs(
            target - entry
        );


    if (risk === 0) {

        document
            .getElementById("rr")
            .textContent =
            "0";

        return;

    }


    const rr =
        reward / risk;


    document
        .getElementById("rr")
        .textContent =
        "1:" +
        rr.toFixed(2);

}



/* =========================================
   UPLOAD SCREENSHOT
========================================= */

async function uploadScreenshot(
    file,
    type,
    userId
) {

    if (!file) {

        return null;

    }


    const extension =
        file.name
            .split(".")
            .pop();


    const fileName =
        `${type}_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 8)}.${extension}`;


    const filePath =
        `${userId}/trades/${fileName}`;


    const { error } =
        await db
            .storage
            .from(
                "trade-screenshots"
            )
            .upload(
                filePath,
                file
            );


    if (error) {

        console.error(error);

        throw new Error(
            "Screenshot upload failed: " +
            error.message
        );

    }


    return filePath;
}



/* =========================================
   RR EVENT LISTENERS
========================================= */

document
    .getElementById("entry")
    .addEventListener(
        "input",
        calculateRR
    );


document
    .getElementById("stopLoss")
    .addEventListener(
        "input",
        calculateRR
    );


document
    .getElementById("takeProfit")
    .addEventListener(
        "input",
        calculateRR
    );



/* =========================================
   TODAY'S DATE
========================================= */

document
    .getElementById("tradeDate")
    .value =
    new Date()
        .toISOString()
        .slice(0, 10);



/* =========================================
   SAVE TRADE
========================================= */

document
    .getElementById("tradeForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            try {

                message.textContent =
                    "Checking login...";


                /* ---------------------------------
                   GET LOGGED-IN USER
                --------------------------------- */

                const {
                    data: {
                        user
                    },
                    error: userError
                } =
                    await db.auth
                        .getUser();


                if (
                    userError ||
                    !user
                ) {

                    console.error(
                        userError
                    );


                    message.textContent =
                        "You are not logged in.";

                    return;

                }



                /* ---------------------------------
                   BASIC VALUES
                --------------------------------- */

                const entry =
                    Number(
                        document
                            .getElementById("entry")
                            .value
                    );


                const stop =
                    Number(
                        document
                            .getElementById("stopLoss")
                            .value
                    );


                const takeProfitValue =
                    document
                        .getElementById(
                            "takeProfit"
                        )
                        .value;


                const exitValue =
                    document
                        .getElementById(
                            "exitPrice"
                        )
                        .value;


                const lotSizeValue =
                    document
                        .getElementById(
                            "lotSize"
                        )
                        .value;


                const target =
                    takeProfitValue
                        ?
                        Number(
                            takeProfitValue
                        )
                        :
                        null;


                const exit =
                    exitValue
                        ?
                        Number(
                            exitValue
                        )
                        :
                        null;


                const lotSize =
                    lotSizeValue
                        ?
                        Number(
                            lotSizeValue
                        )
                        :
                        null;



                /* ---------------------------------
                   CALCULATE R MULTIPLE
                --------------------------------- */

                let rMultiple = 0;


                if (
                    entry &&
                    stop &&
                    exit !== null
                ) {

                    const risk =
                        Math.abs(
                            entry - stop
                        );


                    if (risk > 0) {

                        const direction =
                            document
                                .getElementById(
                                    "direction"
                                )
                                .value;


                        if (
                            direction ===
                            "BUY"
                        ) {

                            rMultiple =
                                (
                                    exit -
                                    entry
                                )
                                /
                                risk;

                        } else {

                            rMultiple =
                                (
                                    entry -
                                    exit
                                )
                                /
                                risk;

                        }

                    }

                }



                /* ---------------------------------
                   SCREENSHOTS
                --------------------------------- */

                const beforeInput =
                    document
                        .getElementById(
                            "beforeScreenshot"
                        );


                const afterInput =
                    document
                        .getElementById(
                            "afterScreenshot"
                        );


                const beforeFile =
                    beforeInput
                        ?
                        beforeInput.files[0]
                        :
                        null;


                const afterFile =
                    afterInput
                        ?
                        afterInput.files[0]
                        :
                        null;


                message.textContent =
                    "Uploading screenshots...";


                const beforeScreenshotURL =
                    await uploadScreenshot(
                        beforeFile,
                        "before",
                        user.id
                    );


                const afterScreenshotURL =
                    await uploadScreenshot(
                        afterFile,
                        "after",
                        user.id
                    );



                /* ---------------------------------
                   TRADE OBJECT
                --------------------------------- */

                const trade = {

                    user_id:
                        user.id,


                    account_id:
                        Number(
                            accountBox.value
                        ),


                    trade_date:
                        document
                            .getElementById(
                                "tradeDate"
                            )
                            .value,


                    symbol:
                        document
                            .getElementById(
                                "symbol"
                            )
                            .value
                            .trim()
                            .toUpperCase(),


                    direction:
                        document
                            .getElementById(
                                "direction"
                            )
                            .value,


                    entry_price:
                        entry,


                    stop_loss:
                        stop,


                    take_profit:
                        target,


                    exit_price:
                        exit,


                    lot_size:
                        lotSize,


                    risk_percent:
                        Number(
                            document
                                .getElementById(
                                    "riskPercent"
                                )
                                .value || 0
                        ),


                    profit_loss:
                        Number(
                            document
                                .getElementById(
                                    "profitLoss"
                                )
                                .value || 0
                        ),


                    r_multiple:
                        rMultiple,


                    session:
                        document
                            .getElementById(
                                "session"
                            )
                            .value,


                    setup:
                        document
                            .getElementById(
                                "setup"
                            )
                            .value,


                    result:
                        document
                            .getElementById(
                                "result"
                            )
                            .value,


                    rules_followed:
                        document
                            .getElementById(
                                "rulesFollowed"
                            )
                            .value ===
                        "true",


                    mistakes:
                        document
                            .getElementById(
                                "mistakes"
                            )
                            .value
                            .trim(),


                    notes:
                        document
                            .getElementById(
                                "notes"
                            )
                            .value
                            .trim(),


                    before_screenshot:
                        beforeScreenshotURL,


                    after_screenshot:
                        afterScreenshotURL

                };



                /* ---------------------------------
                   SAVE TO SUPABASE
                --------------------------------- */

                message.textContent =
                    "Saving trade...";


                const { error } =
                    await db
                        .from("trades")
                        .insert([
                            trade
                        ]);


                if (error) {

                    console.error(error);

                    message.textContent =
                        "ERROR: " +
                        error.message;

                    return;

                }



                /* ---------------------------------
                   SUCCESS
                --------------------------------- */

                message.textContent =
                    "Trade saved successfully!";


                if (beforeInput) {

                    beforeInput.value = "";

                }


                if (afterInput) {

                    afterInput.value = "";

                }

            }


            catch (error) {

                console.error(error);

                message.textContent =
                    "ERROR: " +
                    error.message;

            }

        }
    );



/* =========================================
   START
========================================= */

loadAccounts();

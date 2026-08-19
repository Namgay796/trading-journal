const accountBox =
    document.getElementById("account");

const message =
    document.getElementById("message");


let currentAccount = null;


/* =========================================
   LOAD ACCOUNTS
========================================= */

async function loadAccounts() {

    message.textContent =
        "Loading accounts...";


    const {
        data,
        error
    } =
        await db
            .from("accounts")
            .select("*")
            .order("id");


    if (error) {

        console.error(error);

        message.textContent =
            "ERROR: " +
            error.message;

        return;

    }


    accountBox.innerHTML = "";


    if (
        !data ||
        data.length === 0
    ) {

        message.textContent =
            "No trading accounts found.";

        return;

    }


    data.forEach(account => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            account.id;


        option.textContent =
            account.name +
            " ($" +
            Number(
                account.starting_balance || 0
            ).toFixed(2) +
            ")";


        accountBox.appendChild(
            option
        );

    });


    currentAccount =
        data[0];


    accountBox.dataset.accounts =
        JSON.stringify(data);


    message.textContent =
        "Ready.";

}


/* =========================================
   ACCOUNT CHANGE
========================================= */

accountBox.addEventListener(
    "change",
    function() {

        const accounts =
            JSON.parse(
                accountBox.dataset.accounts ||
                "[]"
            );


        currentAccount =
            accounts.find(
                account =>
                    Number(account.id) ===
                    Number(accountBox.value)
            ) || null;


        calculateTrade();

    }
);


/* =========================================
   ADD ENTRY LAYER
========================================= */

document
    .getElementById(
        "addEntryLayer"
    )
    .addEventListener(
        "click",
        function() {

            const container =
                document.getElementById(
                    "entryLayers"
                );


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "layer-row entry-layer";


            row.innerHTML = `

                <label>

                    Entry Price

                    <input
                        class="layer-entry-price"
                        type="number"
                        step="any"
                        required
                    >

                </label>


                <label>

                    Lot Size

                    <input
                        class="layer-entry-lot"
                        type="number"
                        step="0.01"
                        required
                    >

                </label>


                <button
                    type="button"
                    class="remove-layer"
                >
                    ×
                </button>

            `;


            container.appendChild(
                row
            );


            attachLayerEvents();

        }
    );


/* =========================================
   ADD EXIT LAYER
========================================= */

document
    .getElementById(
        "addExitLayer"
    )
    .addEventListener(
        "click",
        function() {

            const container =
                document.getElementById(
                    "exitLayers"
                );


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "layer-row exit-layer";


            row.innerHTML = `

                <label>

                    Exit Price

                    <input
                        class="layer-exit-price"
                        type="number"
                        step="any"
                    >

                </label>


                <label>

                    Lot Size

                    <input
                        class="layer-exit-lot"
                        type="number"
                        step="0.01"
                    >

                </label>


                <button
                    type="button"
                    class="remove-layer"
                >
                    ×
                </button>

            `;


            container.appendChild(
                row
            );


            attachLayerEvents();

        }
    );


/* =========================================
   REMOVE LAYERS + INPUT EVENTS
========================================= */

function attachLayerEvents() {

    document
        .querySelectorAll(
            ".remove-layer"
        )
        .forEach(button => {

            button.onclick =
                function() {

                    const row =
                        button.closest(
                            ".layer-row"
                        );


                    const parent =
                        row.parentElement;


                    if (
                        parent.querySelectorAll(
                            ".layer-row"
                        ).length <= 1
                    ) {

                        return;

                    }


                    row.remove();

                    calculateTrade();

                };

        });


    document
        .querySelectorAll(
            ".layer-entry-price, " +
            ".layer-entry-lot, " +
            ".layer-exit-price, " +
            ".layer-exit-lot"
        )
        .forEach(input => {

            input.oninput =
                calculateTrade;

        });

}


/* =========================================
   READ ENTRY LAYERS
========================================= */

function getEntryLayers() {

    const rows =
        document.querySelectorAll(
            ".entry-layer"
        );


    const entries = [];


    rows.forEach(row => {

        const price =
            Number(
                row.querySelector(
                    ".layer-entry-price"
                ).value
            );


        const lot =
            Number(
                row.querySelector(
                    ".layer-entry-lot"
                ).value
            );


        if (
            price > 0 &&
            lot > 0
        ) {

            entries.push({

                price:
                    price,

                lot:
                    lot

            });

        }

    });


    return entries;

}


/* =========================================
   READ EXIT LAYERS
========================================= */

function getExitLayers() {

    const rows =
        document.querySelectorAll(
            ".exit-layer"
        );


    const exits = [];


    rows.forEach(row => {

        const price =
            Number(
                row.querySelector(
                    ".layer-exit-price"
                ).value
            );


        const lot =
            Number(
                row.querySelector(
                    ".layer-exit-lot"
                ).value
            );


        if (
            price > 0 &&
            lot > 0
        ) {

            exits.push({

                price:
                    price,

                lot:
                    lot

            });

        }

    });


    return exits;

}


/* =========================================
   WEIGHTED AVERAGE
========================================= */

function weightedAverage(
    layers
) {

    const totalLots =
        layers.reduce(
            (sum, layer) =>
                sum + layer.lot,
            0
        );


    if (
        totalLots <= 0
    ) {

        return 0;

    }


    const weightedTotal =
        layers.reduce(
            (sum, layer) =>
                sum +
                (
                    layer.price *
                    layer.lot
                ),
            0
        );


    return (
        weightedTotal /
        totalLots
    );

}


/* =========================================
   CALCULATE EVERYTHING
========================================= */

function calculateTrade() {

    const entries =
        getEntryLayers();


    const exits =
        getExitLayers();


    const direction =
        document
            .getElementById(
                "direction"
            )
            .value;


    const stopLoss =
        Number(
            document
                .getElementById(
                    "stopLoss"
                )
                .value
        );


    const takeProfit =
        Number(
            document
                .getElementById(
                    "takeProfit"
                )
                .value
        );


    const contractSize =
        Number(
            document
                .getElementById(
                    "contractSize"
                )
                .value || 100
        );


    const totalEntryLots =
        entries.reduce(
            (sum, layer) =>
                sum + layer.lot,
            0
        );


    const totalExitLots =
        exits.reduce(
            (sum, layer) =>
                sum + layer.lot,
            0
        );


    const remainingLots =
        Math.max(
            totalEntryLots -
            totalExitLots,
            0
        );


    const averageEntry =
        weightedAverage(
            entries
        );


    const averageExit =
        weightedAverage(
            exits
        );


    /* =================================
       PLANNED RISK
    ================================= */

    let plannedRisk = 0;


    if (
        stopLoss > 0
    ) {

        entries.forEach(entry => {

            const priceDistance =
                direction === "BUY"
                    ?
                    entry.price -
                    stopLoss
                    :
                    stopLoss -
                    entry.price;


            if (
                priceDistance > 0
            ) {

                plannedRisk +=
                    priceDistance *
                    entry.lot *
                    contractSize;

            }

        });

    }


    /* =================================
       PLANNED REWARD
    ================================= */

    let plannedReward = 0;


    if (
        takeProfit > 0
    ) {

        entries.forEach(entry => {

            const rewardDistance =
                direction === "BUY"
                    ?
                    takeProfit -
                    entry.price
                    :
                    entry.price -
                    takeProfit;


            if (
                rewardDistance > 0
            ) {

                plannedReward +=
                    rewardDistance *
                    entry.lot *
                    contractSize;

            }

        });

    }


    const plannedRR =
        plannedRisk > 0
            ?
            plannedReward /
            plannedRisk
            :
            0;


    /* =================================
       ACTUAL P&L
       
       We match exits against entries
       using weighted average entry.
    ================================= */

    let actualPnL = 0;


    if (
        averageEntry > 0
    ) {

        exits.forEach(exit => {

            const priceDifference =
                direction === "BUY"
                    ?
                    exit.price -
                    averageEntry
                    :
                    averageEntry -
                    exit.price;


            actualPnL +=
                priceDifference *
                exit.lot *
                contractSize;

        });

    }


    const actualRR =
        plannedRisk > 0
            ?
            actualPnL /
            plannedRisk
            :
            0;


    /* =================================
       DISPLAY
    ================================= */

    document
        .getElementById(
            "totalEntryLots"
        )
        .textContent =
        totalEntryLots
            .toFixed(2);


    document
        .getElementById(
            "totalExitLots"
        )
        .textContent =
        totalExitLots
            .toFixed(2);


    document
        .getElementById(
            "remainingLots"
        )
        .textContent =
        remainingLots
            .toFixed(2);


    document
        .getElementById(
            "averageEntry"
        )
        .textContent =
        averageEntry > 0
            ?
            averageEntry.toFixed(3)
            :
            "-";


    document
        .getElementById(
            "averageExit"
        )
        .textContent =
        averageExit > 0
            ?
            averageExit.toFixed(3)
            :
            "-";


    document
        .getElementById(
            "plannedRisk"
        )
        .textContent =
        money(
            plannedRisk
        );


    document
        .getElementById(
            "plannedRR"
        )
        .textContent =
        plannedRR
            .toFixed(2) +
        "R";


    document
        .getElementById(
            "calculatedPnL"
        )
        .textContent =
        signedMoney(
            actualPnL
        );


    document
        .getElementById(
            "actualRR"
        )
        .textContent =
        actualRR
            .toFixed(2) +
        "R";


    return {

        entries:
            entries,

        exits:
            exits,

        totalEntryLots:
            totalEntryLots,

        totalExitLots:
            totalExitLots,

        remainingLots:
            remainingLots,

        averageEntry:
            averageEntry,

        averageExit:
            averageExit,

        plannedRisk:
            plannedRisk,

        plannedRR:
            plannedRR,

        actualPnL:
            actualPnL,

        actualRR:
            actualRR

    };

}


/* =========================================
   GENERAL CALCULATION EVENTS
========================================= */

[
    "stopLoss",
    "takeProfit",
    "contractSize",
    "direction"
]
.forEach(id => {

    document
        .getElementById(id)
        .addEventListener(
            "input",
            calculateTrade
        );

});


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

        throw new Error(
            "Screenshot upload failed: " +
            error.message
        );

    }


    return filePath;

}


/* =========================================
   SAVE TRADE
========================================= */

document
    .getElementById(
        "tradeForm"
    )
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            try {

                message.textContent =
                    "Saving trade...";


                const {
                    data: {
                        user
                    },
                    error:
                        userError
                } =
                    await db.auth
                        .getUser();


                if (
                    userError ||
                    !user
                ) {

                    message.textContent =
                        "You are not logged in.";

                    return;

                }


                const calculations =
                    calculateTrade();


                if (
                    calculations.entries.length ===
                    0
                ) {

                    message.textContent =
                        "Add at least one valid entry.";

                    return;

                }


                if (
                    calculations.totalExitLots >
                    calculations.totalEntryLots
                ) {

                    message.textContent =
                        "Exit lots cannot be greater than entry lots.";

                    return;

                }


                const status =
                    document
                        .getElementById(
                            "tradeStatus"
                        )
                        .value;


                if (
                    status === "CLOSED" &&
                    Math.abs(
                        calculations.totalEntryLots -
                        calculations.totalExitLots
                    ) > 0.0001
                ) {

                    message.textContent =
                        "For a CLOSED trade, entry lots and exit lots must match.";

                    return;

                }


                const beforeFile =
                    document
                        .getElementById(
                            "beforeScreenshot"
                        )
                        .files[0];


                const afterFile =
                    document
                        .getElementById(
                            "afterScreenshot"
                        )
                        .files[0];


                const beforePath =
                    await uploadScreenshot(
                        beforeFile,
                        "before",
                        user.id
                    );


                const afterPath =
                    await uploadScreenshot(
                        afterFile,
                        "after",
                        user.id
                    );


                /* =================================
                   AUTO RESULT
                ================================= */

                let result =
                    "BE";


                if (
                    calculations.actualPnL >
                    0
                ) {

                    result =
                        "Win";

                }


                if (
                    calculations.actualPnL <
                    0
                ) {

                    result =
                        "Loss";

                }


                /* =================================
                   MAIN TRADE ROW
                ================================= */

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
                        calculations.averageEntry,

                    stop_loss:
                        Number(
                            document
                                .getElementById(
                                    "stopLoss"
                                )
                                .value
                        ),

                    take_profit:
                        Number(
                            document
                                .getElementById(
                                    "takeProfit"
                                )
                                .value
                        ) || null,

                    exit_price:
                        calculations.averageExit ||
                        null,

                    lot_size:
                        calculations.totalEntryLots,

                    risk_percent:
                        Number(
                            document
                                .getElementById(
                                    "riskPercent"
                                )
                                .value ||
                            0
                        ),

                    profit_loss:
                        calculations.actualPnL,

                    r_multiple:
                        calculations.actualRR,

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
                        result,

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
                        beforePath,

                    after_screenshot:
                        afterPath,

                    contract_size:
                        Number(
                            document
                                .getElementById(
                                    "contractSize"
                                )
                                .value ||
                            100
                        ),

                    average_entry:
                        calculations.averageEntry,

                    average_exit:
                        calculations.averageExit ||
                        null,

                    planned_rr:
                        calculations.plannedRR,

                    actual_rr:
                        calculations.actualRR,

                    planned_risk:
                        calculations.plannedRisk

                };


                const {
                    data:
                        insertedTrade,
                    error:
                        tradeError
                } =
                    await db
                        .from("trades")
                        .insert([
                            trade
                        ])
                        .select()
                        .single();


                if (
                    tradeError
                ) {

                    throw new Error(
                        tradeError.message
                    );

                }


                /* =================================
                   SAVE ENTRY LAYERS
                ================================= */

                const entryRows =
                    calculations.entries.map(
                        entry => ({

                            trade_id:
                                insertedTrade.id,

                            user_id:
                                user.id,

                            entry_price:
                                entry.price,

                            lot_size:
                                entry.lot

                        })
                    );


                const {
                    error:
                        entryError
                } =
                    await db
                        .from(
                            "trade_entries"
                        )
                        .insert(
                            entryRows
                        );


                if (
                    entryError
                ) {

                    throw new Error(
                        "Entry layer error: " +
                        entryError.message
                    );

                }


                /* =================================
                   SAVE EXIT LAYERS
                ================================= */

                if (
                    calculations.exits.length >
                    0
                ) {

                    const exitRows =
                        calculations.exits.map(
                            exit => ({

                                trade_id:
                                    insertedTrade.id,

                                user_id:
                                    user.id,

                                exit_price:
                                    exit.price,

                                lot_size:
                                    exit.lot

                            })
                        );


                    const {
                        error:
                            exitError
                    } =
                        await db
                            .from(
                                "trade_exits"
                            )
                            .insert(
                                exitRows
                            );


                    if (
                        exitError
                    ) {

                        throw new Error(
                            "Exit layer error: " +
                            exitError.message
                        );

                    }

                }


                message.textContent =
                    "Trade saved successfully!";


                setTimeout(
                    function() {

                        window.location.href =
                            "index.html";

                    },
                    800
                );

            }


            catch (
                error
            ) {

                console.error(
                    error
                );


                message.textContent =
                    "ERROR: " +
                    error.message;

            }

        }
    );


/* =========================================
   MONEY HELPERS
========================================= */

function money(
    value
) {

    return "$" +
        Number(
            value || 0
        )
        .toLocaleString(
            "en-AU",
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        );

}


function signedMoney(
    value
) {

    value =
        Number(
            value || 0
        );


    if (
        value > 0
    ) {

        return "+$" +
            value
                .toLocaleString(
                    "en-AU",
                    {
                        minimumFractionDigits:
                            2,

                        maximumFractionDigits:
                            2
                    }
                );

    }


    if (
        value < 0
    ) {

        return "-$" +
            Math.abs(
                value
            )
            .toLocaleString(
                "en-AU",
                {
                    minimumFractionDigits:
                        2,

                    maximumFractionDigits:
                        2
                }
            );

    }


    return "$0.00";

}


/* =========================================
   TODAY
========================================= */

document
    .getElementById(
        "tradeDate"
    )
    .value =
    new Date()
        .toISOString()
        .slice(
            0,
            10
        );


/* =========================================
   START
========================================= */

attachLayerEvents();

loadAccounts();

calculateTrade();
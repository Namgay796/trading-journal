const accountBox =
    document.getElementById("account");

const message =
    document.getElementById("message");


let accounts = [];

let currentAccount = null;

let currentCapital = 0;


/* =========================================
   CONTRACT MULTIPLIER

   XAUUSD commonly uses:
   1.00 lot = 100 oz

   Later we can expand this for
   forex, NAS100, BTC, etc.
========================================= */

function getContractMultiplier(symbol) {

    symbol =
        String(symbol)
            .trim()
            .toUpperCase();


    if (
        symbol.includes("XAUUSD")
    ) {

        return 100;

    }


    return 1;
}


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


    accounts =
        data || [];


    accountBox.innerHTML =
        "";


    if (
        accounts.length === 0
    ) {

        message.textContent =
            "No trading accounts found.";

        return;

    }


    accounts.forEach(account => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            account.id;


        option.textContent =
            account.name;


        accountBox.appendChild(
            option
        );

    });


    currentAccount =
        accounts[0];


    await loadCurrentCapital();


    message.textContent =
        "Ready.";

}


/* =========================================
   CURRENT CAPITAL

   Starting balance
   +
   all saved P&L for selected account
========================================= */

async function loadCurrentCapital() {

    if (
        !currentAccount
    ) {

        return;

    }


    const {
        data,
        error
    } =
        await db
            .from("trades")
            .select("profit_loss")
            .eq(
                "account_id",
                currentAccount.id
            );


    if (error) {

        console.error(error);

        message.textContent =
            "Unable to calculate current capital.";

        return;

    }


    const totalPnL =
        (data || [])
            .reduce(
                (
                    total,
                    trade
                ) => {

                    return (
                        total +
                        Number(
                            trade.profit_loss ||
                            0
                        )
                    );

                },
                0
            );


    currentCapital =
        Number(
            currentAccount.starting_balance ||
            0
        )
        +
        totalPnL;


    document
        .getElementById(
            "currentCapital"
        )
        .textContent =
        money(
            currentCapital
        );


    calculateTrade();

}


/* =========================================
   ACCOUNT CHANGE
========================================= */

accountBox.addEventListener(
    "change",
    async function() {

        currentAccount =
            accounts.find(
                account =>
                    Number(
                        account.id
                    ) ===
                    Number(
                        accountBox.value
                    )
            ) || null;


        await loadCurrentCapital();

    }
);


/* =========================================
   ADD NEW ENTRY LAYER

   ORDER:
   Lot Size
   Entry Price
   Exit Price
========================================= */

document
    .getElementById(
        "addLayer"
    )
    .addEventListener(
        "click",
        function() {

            const container =
                document.getElementById(
                    "tradeLayers"
                );


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "layer-row trade-layer";


            row.innerHTML = `

                <label>

                    Lot Size

                    <input
                        class="layer-lot-size"
                        type="number"
                        step="0.01"
                        required
                    >

                </label>


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

                    Exit Price

                    <input
                        class="layer-exit-price"
                        type="number"
                        step="any"
                        required
                    >

                </label>


                <button
                    type="button"
                    class="remove-layer"
                    title="Remove layer"
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
   ATTACH LAYER EVENTS
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
                            ".trade-layer"
                        );


                    const container =
                        document.getElementById(
                            "tradeLayers"
                        );


                    const rows =
                        container
                            .querySelectorAll(
                                ".trade-layer"
                            );


                    /*
                       Keep at least one layer
                    */

                    if (
                        rows.length <= 1
                    ) {

                        return;

                    }


                    row.remove();


                    calculateTrade();

                };

        });


    document
        .querySelectorAll(
            ".layer-lot-size, " +
            ".layer-entry-price, " +
            ".layer-exit-price"
        )
        .forEach(input => {

            input.oninput =
                calculateTrade;

        });

}


/* =========================================
   READ TRADE LAYERS
========================================= */

function getLayers() {

    const rows =
        document.querySelectorAll(
            ".trade-layer"
        );


    const layers = [];


    rows.forEach(row => {

        const lot =
            Number(
                row
                    .querySelector(
                        ".layer-lot-size"
                    )
                    .value
            );


        const entry =
            Number(
                row
                    .querySelector(
                        ".layer-entry-price"
                    )
                    .value
            );


        const exit =
            Number(
                row
                    .querySelector(
                        ".layer-exit-price"
                    )
                    .value
            );


        if (
            lot > 0 &&
            entry > 0
        ) {

            layers.push({

                lot:
                    lot,

                entry:
                    entry,

                exit:
                    exit > 0
                        ?
                        exit
                        :
                        null

            });

        }

    });


    return layers;
}


/* =========================================
   WEIGHTED AVERAGE
========================================= */

function weightedAverage(
    layers,
    priceField
) {

    const validLayers =
        layers.filter(
            layer =>
                Number(
                    layer[priceField]
                ) > 0
        );


    const totalLots =
        validLayers.reduce(
            (
                total,
                layer
            ) =>
                total +
                layer.lot,
            0
        );


    if (
        totalLots <= 0
    ) {

        return 0;

    }


    const weightedTotal =
        validLayers.reduce(
            (
                total,
                layer
            ) => {

                return (
                    total +
                    (
                        Number(
                            layer[
                                priceField
                            ]
                        )
                        *
                        layer.lot
                    )
                );

            },
            0
        );


    return (
        weightedTotal /
        totalLots
    );
}


/* =========================================
   CALCULATE TRADE
========================================= */

function calculateTrade() {

    const layers =
        getLayers();


    const symbol =
        document
            .getElementById(
                "symbol"
            )
            .value;


    const multiplier =
        getContractMultiplier(
            symbol
        );


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


    const averageEntry =
        weightedAverage(
            layers,
            "entry"
        );


    const averageExit =
        weightedAverage(
            layers,
            "exit"
        );


    /* =================================
       PLANNED RISK
    ================================= */

    let plannedRisk = 0;


    if (
        stopLoss > 0
    ) {

        layers.forEach(
            layer => {

                const distance =
                    Math.abs(
                        layer.entry -
                        stopLoss
                    );


                plannedRisk +=
                    distance
                    *
                    layer.lot
                    *
                    multiplier;

            }
        );

    }


    /* =================================
       RISK %
    ================================= */

    const riskPercent =
        currentCapital > 0
            ?
            (
                plannedRisk /
                currentCapital
            ) * 100
            :
            0;


    /* =================================
       PLANNED REWARD
    ================================= */

    let plannedReward = 0;


    if (
        takeProfit > 0
    ) {

        layers.forEach(
            layer => {

                const distance =
                    Math.abs(
                        takeProfit -
                        layer.entry
                    );


                plannedReward +=
                    distance
                    *
                    layer.lot
                    *
                    multiplier;

            }
        );

    }


    /* =================================
       PLANNED RR
    ================================= */

    const plannedRR =
        plannedRisk > 0
            ?
            plannedReward /
            plannedRisk
            :
            0;


    /* =================================
       ACTUAL P&L

       Each exit is paired with its
       corresponding entry and lot size.
    ================================= */

    let actualPnL = 0;


    layers.forEach(
        layer => {

            if (
                !layer.exit
            ) {

                return;

            }


            let movement = 0;


            if (
                direction === "BUY"
            ) {

                movement =
                    layer.exit -
                    layer.entry;

            }


            if (
                direction === "SELL"
            ) {

                movement =
                    layer.entry -
                    layer.exit;

            }


            actualPnL +=
                movement
                *
                layer.lot
                *
                multiplier;

        }
    );


    /* =================================
       ACTUAL RR
    ================================= */

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
            "plannedRisk"
        )
        .textContent =
        money(
            plannedRisk
        );


    document
        .getElementById(
            "riskPercentDisplay"
        )
        .textContent =
        riskPercent
            .toFixed(2) +
        "%";


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
            "averageEntry"
        )
        .textContent =
        averageEntry > 0
            ?
            averageEntry
                .toFixed(3)
            :
            "-";


    document
        .getElementById(
            "averageExit"
        )
        .textContent =
        averageExit > 0
            ?
            averageExit
                .toFixed(3)
            :
            "-";


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

        layers:
            layers,

        multiplier:
            multiplier,

        averageEntry:
            averageEntry,

        averageExit:
            averageExit,

        plannedRisk:
            plannedRisk,

        riskPercent:
            riskPercent,

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
    "symbol",
    "direction",
    "stopLoss",
    "takeProfit"
]
.forEach(id => {

    document
        .getElementById(
            id
        )
        .addEventListener(
            "input",
            calculateTrade
        );

});


/* =========================================
   SCREENSHOT UPLOAD
========================================= */

async function uploadScreenshot(
    file,
    type,
    userId
) {

    if (
        !file
    ) {

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


    const {
        error
    } =
        await db
            .storage
            .from(
                "trade-screenshots"
            )
            .upload(
                filePath,
                file
            );


    if (
        error
    ) {

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


                /* =================================
                   LOGGED-IN USER
                ================================= */

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


                /* =================================
                   CALCULATE TRADE
                ================================= */

                const calculations =
                    calculateTrade();


                if (
                    calculations.layers.length ===
                    0
                ) {

                    message.textContent =
                        "Add at least one trade layer.";

                    return;

                }


                /*
                   Since journal entry is made
                   only after trade is closed,
                   require exit for every entry.
                */

                const missingExit =
                    calculations.layers.some(
                        layer =>
                            !layer.exit
                    );


                if (
                    missingExit
                ) {

                    message.textContent =
                        "Please enter an exit price for every entry.";

                    return;

                }


                /* =================================
                   SCREENSHOTS
                ================================= */

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
                   RESULT
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
                   TOTAL LOT SIZE
                ================================= */

                const totalLots =
                    calculations.layers
                        .reduce(
                            (
                                total,
                                layer
                            ) =>
                                total +
                                layer.lot,
                            0
                        );


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
                        ),


                    exit_price:
                        calculations.averageExit,


                    lot_size:
                        totalLots,


                    risk_percent:
                        calculations.riskPercent,


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
                        calculations.multiplier,


                    average_entry:
                        calculations.averageEntry,


                    average_exit:
                        calculations.averageExit,


                    planned_rr:
                        calculations.plannedRR,


                    actual_rr:
                        calculations.actualRR,


                    planned_risk:
                        calculations.plannedRisk

                };


                /* =================================
                   SAVE MAIN TRADE
                ================================= */

                const {
                    data:
                        insertedTrade,
                    error:
                        tradeError
                } =
                    await db
                        .from(
                            "trades"
                        )
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
                    calculations.layers
                        .map(
                            layer => ({

                                trade_id:
                                    insertedTrade.id,

                                user_id:
                                    user.id,

                                entry_price:
                                    layer.entry,

                                lot_size:
                                    layer.lot

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

                const exitRows =
                    calculations.layers
                        .map(
                            layer => ({

                                trade_id:
                                    insertedTrade.id,

                                user_id:
                                    user.id,

                                exit_price:
                                    layer.exit,

                                lot_size:
                                    layer.lot

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


                /* =================================
                   SUCCESS
                ================================= */

                message.textContent =
                    "Trade saved successfully!";


                setTimeout(
                    function() {

                        window.location.href =
                            "index.html";

                    },
                    700
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
   DEFAULT DATE
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
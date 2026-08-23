/* =========================================
   ELEMENTS
========================================= */

const accountBox =
    document.getElementById(
        "account"
    );


const message =
    document.getElementById(
        "message"
    );


const tradeForm =
    document.getElementById(
        "tradeForm"
    );


const saveTradeButton =
    document.getElementById(
        "saveTradeButton"
    );


let accounts = [];

let currentAccount = null;

let currentCapital = 0;



/* =========================================
   MESSAGE SYSTEM
========================================= */

function showTradeMessage(
    text,
    type = "error"
) {

    message.textContent =
        text;


    message.className =
        "form-message full show " +
        type;


    message.scrollIntoView(
        {
            behavior:
                "smooth",

            block:
                "nearest"
        }
    );

}


function clearTradeMessage() {

    message.textContent =
        "";


    message.className =
        "form-message full";

}



/* =========================================
   INPUT ERRORS
========================================= */

function markError(
    element
) {

    if (
        element
    ) {

        element.classList.add(
            "input-error"
        );

    }

}


function clearInputErrors() {

    document
        .querySelectorAll(
            ".input-error"
        )
        .forEach(
            element => {

                element.classList.remove(
                    "input-error"
                );

            }
        );

}



/* =========================================
   CONTRACT MULTIPLIER
========================================= */

function getContractMultiplier(
    symbol
) {

    symbol =
        String(
            symbol ||
            ""
        )
        .trim()
        .toUpperCase();


    /* GOLD */

    if (
        symbol.includes(
            "XAU"
        )
    ) {

        return 100;

    }


    /* SILVER */

    if (
        symbol.includes(
            "XAG"
        )
    ) {

        return 5000;

    }


    /* FOREX */

    if (
        /^[A-Z]{6}$/.test(
            symbol
        )
    ) {

        return 100000;

    }


    /* INDICES / CRYPTO / OTHER */

    return 1;

}



/* =========================================
   LOAD ACCOUNTS
========================================= */

async function loadAccounts() {

    accountBox.innerHTML =
        `
        <option value="">
            Loading...
        </option>
        `;


    try {

        const {
            data,
            error
        } =
            await db
                .from(
                    "accounts"
                )
                .select("*")
                .order(
                    "id"
                );


        if (
            error
        ) {

            throw error;

        }


        accounts =
            data ||
            [];


        accountBox.innerHTML =
            "";


        if (
            accounts.length ===
            0
        ) {

            accountBox.innerHTML =
                `
                <option value="">
                    No accounts found
                </option>
                `;


            showTradeMessage(
                "No trading accounts found. Add an account first.",
                "warning"
            );


            return;

        }


        accounts.forEach(
            account => {

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

            }
        );


        currentAccount =
            accounts[0];


        accountBox.value =
            currentAccount.id;


        await loadCurrentCapital();


        clearTradeMessage();

    }


    catch (
        error
    ) {

        console.error(
            error
        );


        showTradeMessage(
            "Unable to load accounts: " +
            error.message,
            "error"
        );

    }

}



/* =========================================
   CURRENT CAPITAL
========================================= */

async function loadCurrentCapital() {

    if (
        !currentAccount
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await db
                .from(
                    "trades"
                )
                .select(
                    "profit_loss"
                )
                .eq(
                    "account_id",
                    currentAccount.id
                );


        if (
            error
        ) {

            throw error;

        }


        const totalPnL =
            (
                data ||
                []
            )
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
                currentAccount
                    .starting_balance ||
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


    catch (
        error
    ) {

        console.error(
            error
        );


        showTradeMessage(
            "Unable to calculate current capital: " +
            error.message,
            "error"
        );

    }

}



/* =========================================
   ACCOUNT CHANGE
========================================= */

accountBox.addEventListener(
    "change",
    async function() {

        clearTradeMessage();

        clearInputErrors();


        currentAccount =
            accounts.find(
                account =>
                    Number(
                        account.id
                    ) ===
                    Number(
                        accountBox.value
                    )
            ) ||
            null;


        if (
            !currentAccount
        ) {

            markError(
                accountBox
            );


            showTradeMessage(
                "Please select a valid trading account.",
                "error"
            );


            return;

        }


        await loadCurrentCapital();

    }
);



/* =========================================
   ADD ENTRY LAYER
========================================= */

document
    .getElementById(
        "addLayer"
    )
    .addEventListener(
        "click",
        function() {

            clearTradeMessage();


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


            row.innerHTML =
                `

                <label>

                    Lot Size

                    <input
                        class="layer-lot-size"
                        type="number"
                        min="0.01"
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
   LAYER EVENTS
========================================= */

function attachLayerEvents() {

    document
        .querySelectorAll(
            ".remove-layer"
        )
        .forEach(
            button => {

                button.onclick =
                    function() {

                        const row =
                            button.closest(
                                ".trade-layer"
                            );


                        const rows =
                            document
                                .querySelectorAll(
                                    ".trade-layer"
                                );


                        if (
                            rows.length <=
                            1
                        ) {

                            showTradeMessage(
                                "At least one trade layer is required.",
                                "warning"
                            );


                            return;

                        }


                        row.remove();


                        clearTradeMessage();

                        calculateTrade();

                    };

            }
        );


    document
        .querySelectorAll(
            ".layer-lot-size, " +
            ".layer-entry-price, " +
            ".layer-exit-price"
        )
        .forEach(
            input => {

                input.oninput =
                    function() {

                        input.classList.remove(
                            "input-error"
                        );


                        calculateTrade();

                    };

            }
        );

}



/* =========================================
   GET LAYERS
========================================= */

function getLayers() {

    const rows =
        document.querySelectorAll(
            ".trade-layer"
        );


    const layers =
        [];


    rows.forEach(
        row => {

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
                lot >
                0 &&
                entry >
                0
            ) {

                layers.push(
                    {

                        lot:
                            lot,

                        entry:
                            entry,

                        exit:
                            exit >
                            0
                                ?
                                exit
                                :
                                null

                    }
                );

            }

        }
    );


    return layers;

}



/* =========================================
   VALIDATE LAYERS
========================================= */

function validateLayers() {

    const rows =
        [
            ...document.querySelectorAll(
                ".trade-layer"
            )
        ];


    for (
        let i = 0;
        i < rows.length;
        i++
    ) {

        const row =
            rows[i];


        const lotInput =
            row.querySelector(
                ".layer-lot-size"
            );


        const entryInput =
            row.querySelector(
                ".layer-entry-price"
            );


        const exitInput =
            row.querySelector(
                ".layer-exit-price"
            );


        const lot =
            Number(
                lotInput.value
            );


        const entry =
            Number(
                entryInput.value
            );


        const exit =
            Number(
                exitInput.value
            );


        const layerNumber =
            i +
            1;


        if (
            !Number.isFinite(lot) ||
            lot <=
            0
        ) {

            markError(
                lotInput
            );


            return {

                valid:
                    false,

                message:
                    "Layer " +
                    layerNumber +
                    ": Enter a valid Lot Size."

            };

        }


        if (
            !Number.isFinite(entry) ||
            entry <=
            0
        ) {

            markError(
                entryInput
            );


            return {

                valid:
                    false,

                message:
                    "Layer " +
                    layerNumber +
                    ": Enter a valid Entry Price."

            };

        }


        if (
            !Number.isFinite(exit) ||
            exit <=
            0
        ) {

            markError(
                exitInput
            );


            return {

                valid:
                    false,

                message:
                    "Layer " +
                    layerNumber +
                    ": Enter an Exit Price."

            };

        }

    }


    return {

        valid:
            true

    };

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
                    layer[
                        priceField
                    ]
                ) >
                0
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
        totalLots <=
        0
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
   PRE-TRADE CHECKLIST
========================================= */

function getPreTradeChecklist() {

    return {

        htf_bias:
            document
                .getElementById(
                    "checkHtfBias"
                )
                ?.checked ||
            false,


        news_checked:
            document
                .getElementById(
                    "checkNews"
                )
                ?.checked ||
            false,


        asian_sweep:
            document
                .getElementById(
                    "checkAsianSweep"
                )
                ?.checked ||
            false,


        choch_1m_close:
            document
                .getElementById(
                    "checkChoch"
                )
                ?.checked ||
            false,


        bos_formed:
            document
                .getElementById(
                    "checkBos"
                )
                ?.checked ||
            false,


        bos_ob_fvg_marked:
            document
                .getElementById(
                    "checkBosObFvg"
                )
                ?.checked ||
            false,


        no_fomo:
            document
                .getElementById(
                    "checkNoFomo"
                )
                ?.checked ||
            false,


        no_revenge:
            document
                .getElementById(
                    "checkNoRevenge"
                )
                ?.checked ||
            false,


        plan_reviewed:
            document
                .getElementById(
                    "checkPlanReviewed"
                )
                ?.checked ||
            false

    };

}



/* =========================================
   CHECKLIST SCORE
========================================= */

function calculateChecklistScore() {

    const checklist =
        getPreTradeChecklist();


    const items =
        Object.values(
            checklist
        );


    const checked =
        items.filter(
            value =>
                value ===
                true
        )
        .length;


    const total =
        items.length;


    const score =
        total >
        0
            ?
            (
                checked /
                total
            ) *
            100
            :
            0;


    return {

        checklist:
            checklist,

        checked:
            checked,

        total:
            total,

        score:
            score

    };

}



/* =========================================
   UPDATE CHECKLIST DISPLAY
========================================= */

function updateChecklistDisplay() {

    const result =
        calculateChecklistScore();


    const scoreDisplay =
        document.getElementById(
            "checklistScore"
        );


    const progressBar =
        document.getElementById(
            "checklistProgressBar"
        );


    if (
        scoreDisplay
    ) {

        scoreDisplay.textContent =
            result.checked +
            "/" +
            result.total +
            " — " +
            result.score.toFixed(
                0
            ) +
            "%";

    }


    if (
        progressBar
    ) {

        progressBar.style.width =
            result.score +
            "%";

    }

}



/* =========================================
   CHECKLIST EVENTS
========================================= */

document
    .querySelectorAll(
        ".pretrade-check"
    )
    .forEach(
        checkbox => {

            checkbox.addEventListener(
                "change",
                updateChecklistDisplay
            );

        }
    );



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


    const direction =
        document
            .getElementById(
                "direction"
            )
            .value;


    const multiplier =
        getContractMultiplier(
            symbol
        );


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


    const commissionFee =
        Number(
            document
                .getElementById(
                    "commissionFee"
                )
                .value ||
            0
        );


    const swapFee =
        Number(
            document
                .getElementById(
                    "swapFee"
                )
                .value ||
            0
        );


    const totalFees =
        commissionFee +
        swapFee;


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


    /* =====================================
       PLANNED RISK
    ===================================== */

    let plannedRisk =
        0;


    if (
        stopLoss >
        0
    ) {

        layers.forEach(
            layer => {

                const distance =
                    Math.abs(
                        layer.entry -
                        stopLoss
                    );


                plannedRisk +=
                    distance *
                    layer.lot *
                    multiplier;

            }
        );

    }


    /* =====================================
       RISK %
    ===================================== */

    const riskPercent =
        currentCapital >
        0
            ?
            (
                plannedRisk /
                currentCapital
            ) *
            100
            :
            0;


    /* =====================================
       PLANNED REWARD
    ===================================== */

    let plannedReward =
        0;


    if (
        takeProfit >
        0
    ) {

        layers.forEach(
            layer => {

                const distance =
                    Math.abs(
                        takeProfit -
                        layer.entry
                    );


                plannedReward +=
                    distance *
                    layer.lot *
                    multiplier;

            }
        );

    }


    /* =====================================
       PLANNED RR
    ===================================== */

    const plannedRR =
        plannedRisk >
        0
            ?
            plannedReward /
            plannedRisk
            :
            0;


    /* =====================================
       GROSS P&L
    ===================================== */

    let grossPnL =
        0;


    layers.forEach(
        layer => {

            if (
                !layer.exit
            ) {

                return;

            }


            let movement =
                0;


            if (
                direction ===
                "BUY"
            ) {

                movement =
                    layer.exit -
                    layer.entry;

            }


            if (
                direction ===
                "SELL"
            ) {

                movement =
                    layer.entry -
                    layer.exit;

            }


            grossPnL +=
                movement *
                layer.lot *
                multiplier;

        }
    );


    /* =====================================
       NET P&L AFTER FEES
    ===================================== */

    const actualPnL =
        grossPnL -
        totalFees;


    /* =====================================
       ACTUAL RR
    ===================================== */

    const actualRR =
        plannedRisk >
        0
            ?
            actualPnL /
            plannedRisk
            :
            0;


    /* =====================================
       DISPLAY
    ===================================== */

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
            .toFixed(
                2
            ) +
        "%";


    document
        .getElementById(
            "plannedRR"
        )
        .textContent =
        plannedRR
            .toFixed(
                2
            ) +
        "R";


    document
        .getElementById(
            "averageEntry"
        )
        .textContent =
        averageEntry >
        0
            ?
            formatTradePrice(
                averageEntry,
                symbol
            )
            :
            "-";


    document
        .getElementById(
            "averageExit"
        )
        .textContent =
        averageExit >
        0
            ?
            formatTradePrice(
                averageExit,
                symbol
            )
            :
            "-";


    document
        .getElementById(
            "grossPnLDisplay"
        )
        .textContent =
        signedMoney(
            grossPnL
        );


    document
        .getElementById(
            "totalFeesDisplay"
        )
        .textContent =
        "-" +
        money(
            totalFees
        );


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
            .toFixed(
                2
            ) +
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

        grossPnL:
            grossPnL,

        commissionFee:
            commissionFee,

        swapFee:
            swapFee,

        totalFees:
            totalFees,

        actualPnL:
            actualPnL,

        actualRR:
            actualRR

    };

}



/* =========================================
   CALCULATION EVENTS
========================================= */

[
    "symbol",
    "direction",
    "stopLoss",
    "takeProfit",
    "commissionFee",
    "swapFee"
]
.forEach(
    id => {

        const element =
            document.getElementById(
                id
            );


        element.addEventListener(
            "input",
            function() {

                element.classList.remove(
                    "input-error"
                );


                calculateTrade();

            }
        );


        element.addEventListener(
            "change",
            function() {

                element.classList.remove(
                    "input-error"
                );


                calculateTrade();

            }
        );

    }
);



/* =========================================
   FORM VALIDATION
========================================= */

function validateTradeForm() {

    clearTradeMessage();

    clearInputErrors();


    if (
        !currentAccount ||
        !accountBox.value
    ) {

        markError(
            accountBox
        );


        showTradeMessage(
            "Please select a trading account.",
            "error"
        );


        return false;

    }


    const tradeDate =
        document.getElementById(
            "tradeDate"
        );


    if (
        !tradeDate.value
    ) {

        markError(
            tradeDate
        );


        showTradeMessage(
            "Please select the trade date.",
            "error"
        );


        return false;

    }


    const symbolInput =
        document.getElementById(
            "symbol"
        );


    if (
        !symbolInput
            .value
            .trim()
    ) {

        markError(
            symbolInput
        );


        showTradeMessage(
            "Please enter the traded symbol.",
            "error"
        );


        return false;

    }


    const layerCheck =
        validateLayers();


    if (
        !layerCheck.valid
    ) {

        showTradeMessage(
            layerCheck.message,
            "error"
        );


        return false;

    }


    const layers =
        getLayers();


    const stopLossInput =
        document.getElementById(
            "stopLoss"
        );


    const takeProfitInput =
        document.getElementById(
            "takeProfit"
        );


    const stopLoss =
        Number(
            stopLossInput.value
        );


    const takeProfit =
        Number(
            takeProfitInput.value
        );


    if (
        stopLoss <=
        0
    ) {

        markError(
            stopLossInput
        );


        showTradeMessage(
            "Please enter a valid Stop Loss.",
            "error"
        );


        return false;

    }


    if (
        takeProfit <=
        0
    ) {

        markError(
            takeProfitInput
        );


        showTradeMessage(
            "Please enter a valid Take Profit.",
            "error"
        );


        return false;

    }


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

        if (
            layers.some(
                layer =>
                    stopLoss >=
                    layer.entry
            )
        ) {

            markError(
                stopLossInput
            );


            showTradeMessage(
                "Invalid BUY trade: Stop Loss must be below every Entry Price.",
                "error"
            );


            return false;

        }


        if (
            layers.some(
                layer =>
                    takeProfit <=
                    layer.entry
            )
        ) {

            markError(
                takeProfitInput
            );


            showTradeMessage(
                "Invalid BUY trade: Take Profit must be above every Entry Price.",
                "error"
            );


            return false;

        }

    }


    if (
        direction ===
        "SELL"
    ) {

        if (
            layers.some(
                layer =>
                    stopLoss <=
                    layer.entry
            )
        ) {

            markError(
                stopLossInput
            );


            showTradeMessage(
                "Invalid SELL trade: Stop Loss must be above every Entry Price.",
                "error"
            );


            return false;

        }


        if (
            layers.some(
                layer =>
                    takeProfit >=
                    layer.entry
            )
        ) {

            markError(
                takeProfitInput
            );


            showTradeMessage(
                "Invalid SELL trade: Take Profit must be below every Entry Price.",
                "error"
            );


            return false;

        }

    }


    const commissionInput =
        document.getElementById(
            "commissionFee"
        );


    const swapInput =
        document.getElementById(
            "swapFee"
        );


    const commission =
        Number(
            commissionInput.value ||
            0
        );


    const swap =
        Number(
            swapInput.value ||
            0
        );


    if (
        commission <
        0
    ) {

        markError(
            commissionInput
        );


        showTradeMessage(
            "Commission Fee cannot be negative.",
            "error"
        );


        return false;

    }


    if (
        swap <
        0
    ) {

        markError(
            swapInput
        );


        showTradeMessage(
            "Swap Fee cannot be negative.",
            "error"
        );


        return false;

    }


    return true;

}



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


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        throw new Error(
            type +
            " screenshot must be an image."
        );

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

tradeForm.addEventListener(
    "submit",
    async function(
        event
    ) {

        event.preventDefault();


        if (
            !validateTradeForm()
        ) {

            return;

        }


        saveTradeButton.disabled =
            true;


        saveTradeButton.textContent =
            "Saving...";


        showTradeMessage(
            "Saving trade...",
            "warning"
        );


        try {

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

                throw new Error(
                    "You are not logged in."
                );

            }


            const calculations =
                calculateTrade();


            /* =====================================
               CHECKLIST
            ===================================== */

            const checklistResult =
                calculateChecklistScore();


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


            /* =====================================
               RESULT IS BASED ON NET P&L
            ===================================== */

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
                    calculations
                        .averageEntry,


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
                    calculations
                        .averageExit,


                lot_size:
                    totalLots,


                risk_percent:
                    calculations
                        .riskPercent,


                gross_pnl:
                    calculations
                        .grossPnL,


                profit_loss:
                    calculations
                        .actualPnL,


                commission_fee:
                    calculations
                        .commissionFee,


                swap_fee:
                    calculations
                        .swapFee,


                r_multiple:
                    calculations
                        .actualRR,


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


                /* =====================================
                   PRE-TRADE CHECKLIST
                ===================================== */

                checklist_score:
                    checklistResult
                        .score,


                pretrade_checklist:
                    checklistResult
                        .checklist,


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
                    calculations
                        .multiplier,


                average_entry:
                    calculations
                        .averageEntry,


                average_exit:
                    calculations
                        .averageExit,


                planned_rr:
                    calculations
                        .plannedRR,


                actual_rr:
                    calculations
                        .actualRR,


                planned_risk:
                    calculations
                        .plannedRisk

            };


            /* =====================================
               SAVE TRADE
            ===================================== */

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
                    .insert(
                        [
                            trade
                        ]
                    )
                    .select()
                    .single();


            if (
                tradeError
            ) {

                throw new Error(
                    tradeError.message
                );

            }


            /* =====================================
               ENTRY LAYERS
            ===================================== */

            const entryRows =
                calculations.layers
                    .map(
                        layer => (
                            {

                                trade_id:
                                    insertedTrade.id,

                                user_id:
                                    user.id,

                                entry_price:
                                    layer.entry,

                                lot_size:
                                    layer.lot

                            }
                        )
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


            /* =====================================
               EXIT LAYERS
            ===================================== */

            const exitRows =
                calculations.layers
                    .map(
                        layer => (
                            {

                                trade_id:
                                    insertedTrade.id,

                                user_id:
                                    user.id,

                                exit_price:
                                    layer.exit,

                                lot_size:
                                    layer.lot

                            }
                        )
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


            showTradeMessage(
                "Trade saved successfully! Redirecting to Dashboard...",
                "success"
            );


            saveTradeButton.textContent =
                "Saved ✓";


            setTimeout(
                function() {

                    window.location.href =
                        "index.html";

                },
                900
            );

        }


        catch (
            error
        ) {

            console.error(
                error
            );


            showTradeMessage(
                "ERROR: " +
                error.message,
                "error"
            );


            saveTradeButton.disabled =
                false;


            saveTradeButton.textContent =
                "Save Trade";

        }

    }
);



/* =========================================
   FORMAT TRADE PRICE
========================================= */

function formatTradePrice(
    value,
    symbol
) {

    const price =
        Number(
            value
        );


    if (
        !Number.isFinite(
            price
        )
    ) {

        return "-";

    }


    const pair =
        String(
            symbol ||
            ""
        )
        .trim()
        .toUpperCase();


    /* JPY FOREX */

    if (
        pair.includes(
            "JPY"
        )
    ) {

        return price.toFixed(
            3
        );

    }


    /* STANDARD FOREX */

    if (
        /^[A-Z]{6}$/.test(
            pair
        ) &&
        !pair.startsWith(
            "XAU"
        ) &&
        !pair.startsWith(
            "XAG"
        )
    ) {

        return price.toFixed(
            5
        );

    }


    /* GOLD / SILVER */

    if (
        pair.startsWith(
            "XAU"
        ) ||
        pair.startsWith(
            "XAG"
        )
    ) {

        return price.toFixed(
            3
        );

    }


    return String(
        price
    );

}



/* =========================================
   MONEY
========================================= */

function money(
    value
) {

    return "$" +
        Number(
            value ||
            0
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



/* =========================================
   SIGNED MONEY
========================================= */

function signedMoney(
    value
) {

    value =
        Number(
            value ||
            0
        );


    if (
        value >
        0
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
        value <
        0
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

updateChecklistDisplay();
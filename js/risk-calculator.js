const riskAccount =
    document.getElementById(
        "riskAccount"
    );

const assetClass =
    document.getElementById(
        "assetClass"
    );

const riskSymbol =
    document.getElementById(
        "riskSymbol"
    );

const riskDirection =
    document.getElementById(
        "riskDirection"
    );

const riskLeverage =
    document.getElementById(
        "riskLeverage"
    );

const riskPercent =
    document.getElementById(
        "riskPercent"
    );

const riskDollars =
    document.getElementById(
        "riskDollars"
    );

const entryPrice =
    document.getElementById(
        "entryPrice"
    );

const stopLossPrice =
    document.getElementById(
        "stopLossPrice"
    );

const takeProfitPrice =
    document.getElementById(
        "takeProfitPrice"
    );

const slPips =
    document.getElementById(
        "slPips"
    );

const tpPips =
    document.getElementById(
        "tpPips"
    );

const calculateRiskButton =
    document.getElementById(
        "calculateRiskButton"
    );

const initialBalanceDisplay =
    document.getElementById(
        "initialBalanceDisplay"
    );

const leverageDisplay =
    document.getElementById(
        "leverageDisplay"
    );

const riskAmountDisplay =
    document.getElementById(
        "riskAmountDisplay"
    );

const requiredLotSize =
    document.getElementById(
        "requiredLotSize"
    );

const marginRequired =
    document.getElementById(
        "marginRequired"
    );

const lossAtStop =
    document.getElementById(
        "lossAtStop"
    );

const profitAtTp =
    document.getElementById(
        "profitAtTp"
    );

const plannedRR =
    document.getElementById(
        "plannedRR"
    );

const positionNotional =
    document.getElementById(
        "positionNotional"
    );

const riskMessage =
    document.getElementById(
        "riskMessage"
    );


let accounts = [];

let currentAccount = null;


/* =========================================
   LOAD ACCOUNTS
========================================= */

async function loadRiskAccounts() {

    riskAccount.innerHTML =
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
                .from("accounts")
                .select("*")
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );


        if (error) {

            throw error;

        }


        accounts =
            data || [];


        riskAccount.innerHTML =
            "";


        if (
            accounts.length === 0
        ) {

            riskAccount.innerHTML =
                `
                <option value="">
                    No accounts found
                </option>
                `;

            riskMessage.textContent =
                "No trading accounts found.";

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

                riskAccount.appendChild(
                    option
                );

            }
        );


        currentAccount =
            accounts[0];


        riskAccount.value =
            currentAccount.id;


        updateAccountDetails();


        riskMessage.textContent =
            "";

    }

    catch (
        error
    ) {

        console.error(
            "Unable to load accounts:",
            error
        );


        riskAccount.innerHTML =
            `
            <option value="">
                Unable to load accounts
            </option>
            `;


        riskMessage.textContent =
            "ERROR: " +
            (
                error.message ||
                "Unable to load accounts."
            );

    }

}


/* =========================================
   ACCOUNT CHANGE
========================================= */

riskAccount.addEventListener(
    "change",
    function() {

        currentAccount =
            accounts.find(
                account =>
                    Number(
                        account.id
                    ) ===
                    Number(
                        riskAccount.value
                    )
            );


        if (
            currentAccount
        ) {

            updateAccountDetails();

        }

    }
);


/* =========================================
   ACCOUNT DETAILS
========================================= */

function updateAccountDetails() {

    if (
        !currentAccount
    ) {

        return;

    }


    initialBalanceDisplay.textContent =
        money(
            currentAccount
                .starting_balance
        );


    updateLeverage();


    calculateRiskFromPercent();


    updatePipDistances();


    calculateResults();

}


/* =========================================
   ASSET CLASS CHANGE
========================================= */

assetClass.addEventListener(
    "change",
    function() {

        updateLeverage();

        updateDefaultSymbol();

        updatePipDistances();

        calculateResults();

    }
);


/* =========================================
   LEVERAGE
========================================= */

function updateLeverage() {

    if (
        !currentAccount
    ) {

        return;

    }


    let leverage =
        1;


    switch (
        assetClass.value
    ) {

        case "metals":

            leverage =
                Number(
                    currentAccount
                        .leverage_metals ||
                    20
                );

            break;


        case "forex":

            leverage =
                Number(
                    currentAccount
                        .leverage_forex ||
                    30
                );

            break;


        case "indices":

            leverage =
                Number(
                    currentAccount
                        .leverage_indices ||
                    20
                );

            break;


        case "crypto":

            leverage =
                Number(
                    currentAccount
                        .leverage_crypto ||
                    2
                );

            break;

    }


    riskLeverage.value =
        leverage;


    leverageDisplay.textContent =
        "1:" +
        leverage;

}


/* =========================================
   DEFAULT SYMBOL
========================================= */

function updateDefaultSymbol() {

    switch (
        assetClass.value
    ) {

        case "metals":

            riskSymbol.value =
                "XAUUSD";

            break;


        case "forex":

            riskSymbol.value =
                "EURUSD";

            break;


        case "indices":

            riskSymbol.value =
                "NAS100";

            break;


        case "crypto":

            riskSymbol.value =
                "BTCUSD";

            break;

    }

}


/* =========================================
   PIP SIZE
========================================= */

function getPipSize() {

    const symbol =
        String(
            riskSymbol.value ||
            ""
        )
        .trim()
        .toUpperCase();


    /* JPY FOREX PAIRS */

    if (
        assetClass.value ===
        "forex" &&
        symbol.includes(
            "JPY"
        )
    ) {

        return 0.01;

    }


    /* STANDARD FOREX */

    if (
        assetClass.value ===
        "forex"
    ) {

        return 0.0001;

    }


    /* METALS */

    if (
        assetClass.value ===
        "metals"
    ) {

        return 0.01;

    }


    /* INDICES */

    if (
        assetClass.value ===
        "indices"
    ) {

        return 1;

    }


    /* CRYPTO */

    if (
        assetClass.value ===
        "crypto"
    ) {

        return 1;

    }


    return 0.01;

}


/* =========================================
   UPDATE SL + TP PIPS
========================================= */

function updatePipDistances() {

    const entry =
        parseFloat(
            entryPrice.value
        );


    const stop =
        parseFloat(
            stopLossPrice.value
        );


    const target =
        parseFloat(
            takeProfitPrice.value
        );


    const pipSize =
        getPipSize();


    const usePoints =
        assetClass.value ===
            "indices" ||
        assetClass.value ===
            "crypto";


    /* SL */

    if (
        Number.isFinite(entry) &&
        Number.isFinite(stop) &&
        pipSize >
        0
    ) {

        const distance =
            Math.abs(
                entry -
                stop
            );


        const pips =
            distance /
            pipSize;


        slPips.textContent =
            formatPips(
                pips
            ) +
            (
                usePoints
                    ?
                    " points"
                    :
                    " pips"
            );

    }

    else {

        slPips.textContent =
            usePoints
                ?
                "0 points"
                :
                "0 pips";

    }


    /* TP */

    if (
        Number.isFinite(entry) &&
        Number.isFinite(target) &&
        pipSize >
        0
    ) {

        const distance =
            Math.abs(
                target -
                entry
            );


        const pips =
            distance /
            pipSize;


        tpPips.textContent =
            formatPips(
                pips
            ) +
            (
                usePoints
                    ?
                    " points"
                    :
                    " pips"
            );

    }

    else {

        tpPips.textContent =
            usePoints
                ?
                "0 points"
                :
                "0 pips";

    }

}


/* =========================================
   FORMAT PIPS
========================================= */

function formatPips(
    value
) {

    if (
        Number.isInteger(
            value
        )
    ) {

        return value
            .toLocaleString(
                "en-AU"
            );

    }


    return value
        .toFixed(
            1
        );

}


/* =========================================
   INTERNAL CONTRACT MULTIPLIER

   This is hidden from the user.
========================================= */

function getContractMultiplier() {

    const symbol =
        String(
            riskSymbol.value ||
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
        assetClass.value ===
        "forex"
    ) {

        return 100000;

    }


    /* INDEX CFD DEFAULT */

    if (
        assetClass.value ===
        "indices"
    ) {

        return 1;

    }


    /* CRYPTO CFD DEFAULT */

    if (
        assetClass.value ===
        "crypto"
    ) {

        return 1;

    }


    return 1;

}


/* =========================================
   LOT STEP
========================================= */

function getLotStep() {

    return 0.01;

}


/* =========================================
   RISK % -> RISK $
========================================= */

riskPercent.addEventListener(
    "input",
    function() {

        calculateRiskFromPercent();

        calculateResults();

    }
);


function calculateRiskFromPercent() {

    if (
        !currentAccount
    ) {

        return;

    }


    const balance =
        Number(
            currentAccount
                .starting_balance ||
            0
        );


    const percent =
        parseFloat(
            riskPercent.value
        );


    const safePercent =
        Number.isFinite(
            percent
        )
            ?
            percent
            :
            0;


    const dollars =
        balance *
        (
            safePercent /
            100
        );


    riskDollars.value =
        dollars.toFixed(
            2
        );


    riskAmountDisplay.textContent =
        money(
            dollars
        );

}


/* =========================================
   RISK $ -> RISK %
========================================= */

riskDollars.addEventListener(
    "input",
    function() {

        calculateRiskFromDollars();

        calculateResults();

    }
);


function calculateRiskFromDollars() {

    if (
        !currentAccount
    ) {

        return;

    }


    const balance =
        Number(
            currentAccount
                .starting_balance ||
            0
        );


    const dollars =
        parseFloat(
            riskDollars.value
        );


    const safeDollars =
        Number.isFinite(
            dollars
        )
            ?
            dollars
            :
            0;


    let percent =
        0;


    if (
        balance >
        0
    ) {

        percent =
            (
                safeDollars /
                balance
            ) *
            100;

    }


    riskPercent.value =
        percent.toFixed(
            2
        );


    riskAmountDisplay.textContent =
        money(
            safeDollars
        );

}


/* =========================================
   CALCULATE BUTTON
========================================= */

calculateRiskButton.addEventListener(
    "click",
    function() {

        updatePipDistances();

        calculateResults();

    }
);


/* =========================================
   LIVE CALCULATION
========================================= */

[
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    riskSymbol

].forEach(
    field => {

        field.addEventListener(
            "input",
            function() {

                updatePipDistances();

                calculateResults();

            }
        );


        field.addEventListener(
            "change",
            function() {

                updatePipDistances();

                calculateResults();

            }
        );

    }
);


/* =========================================
   DIRECTION CHANGE
========================================= */

riskDirection.addEventListener(
    "change",
    function() {

        updatePipDistances();

        calculateResults();

    }
);


/* =========================================
   MAIN CALCULATION
========================================= */

function calculateResults() {

    riskMessage.textContent =
        "";


    updatePipDistances();


    if (
        !currentAccount
    ) {

        resetResults();

        riskMessage.textContent =
            "Select a trading account.";

        return;

    }


    const entry =
        parseFloat(
            entryPrice.value
        );


    const stop =
        parseFloat(
            stopLossPrice.value
        );


    const target =
        parseFloat(
            takeProfitPrice.value
        );


    const riskCash =
        parseFloat(
            riskDollars.value
        );


    const leverage =
        parseFloat(
            riskLeverage.value
        );


    const multiplier =
        getContractMultiplier();


    const lotStep =
        getLotStep();


    /* =====================================
       ENTRY CHECK
    ===================================== */

    if (
        !Number.isFinite(
            entry
        ) ||
        entry <=
        0
    ) {

        resetResults();

        return;

    }


    /* =====================================
       STOP CHECK
    ===================================== */

    if (
        !Number.isFinite(
            stop
        ) ||
        stop <=
        0
    ) {

        resetResults();

        return;

    }


    /* =====================================
       RISK CHECK
    ===================================== */

    if (
        !Number.isFinite(
            riskCash
        ) ||
        riskCash <=
        0
    ) {

        resetResults();

        riskMessage.textContent =
            "Enter Risk % or Risk $.";

        return;

    }


    /* =====================================
       BUY STOP CHECK
    ===================================== */

    if (
        riskDirection.value ===
        "BUY" &&
        stop >=
        entry
    ) {

        resetResults();


        riskMessage.textContent =
            "For BUY, Stop Loss must be below Entry.";


        return;

    }


    /* =====================================
       SELL STOP CHECK
    ===================================== */

    if (
        riskDirection.value ===
        "SELL" &&
        stop <=
        entry
    ) {

        resetResults();


        riskMessage.textContent =
            "For SELL, Stop Loss must be above Entry.";


        return;

    }


    /* =====================================
       STOP DISTANCE
    ===================================== */

    const stopDistance =
        Math.abs(
            entry -
            stop
        );


    if (
        stopDistance <=
        0
    ) {

        resetResults();


        riskMessage.textContent =
            "Entry and Stop Loss cannot be the same.";


        return;

    }


    /* =====================================
       RAW LOT SIZE

       Risk $
       -----------------------------
       Price distance × multiplier
    ===================================== */

    const rawLots =
        riskCash /
        (
            stopDistance *
            multiplier
        );


    /* =====================================
       ROUND DOWN TO 0.01 LOT
    ===================================== */

    const lots =
        roundDownToStep(
            rawLots,
            lotStep
        );


    if (
        !Number.isFinite(
            lots
        ) ||
        lots <=
        0
    ) {

        resetResults();


        riskMessage.textContent =
            "Calculated lot size is below 0.01 lot.";


        return;

    }


    /* =====================================
       ACTUAL RISK
    ===================================== */

    const actualRisk =
        stopDistance *
        multiplier *
        lots;


    /* =====================================
       POSITION VALUE
    ===================================== */

    const positionValue =
        entry *
        multiplier *
        lots;


    /* =====================================
       MARGIN REQUIRED
    ===================================== */

    let margin =
        0;


    if (
        Number.isFinite(
            leverage
        ) &&
        leverage >
        0
    ) {

        margin =
            positionValue /
            leverage;

    }


    /* =====================================
       TAKE PROFIT / REWARD
    ===================================== */

    let rewardDistance =
        0;


    if (
        Number.isFinite(
            target
        ) &&
        target >
        0
    ) {

        if (
            riskDirection.value ===
            "BUY"
        ) {

            rewardDistance =
                target -
                entry;

        }


        else {

            rewardDistance =
                entry -
                target;

        }

    }


    /* =====================================
       PROFIT AT TP
    ===================================== */

    let profit =
        0;


    if (
        rewardDistance >
        0
    ) {

        profit =
            rewardDistance *
            multiplier *
            lots;

    }


    /* =====================================
       RR
    ===================================== */

    let rr =
        0;


    if (
        actualRisk >
        0 &&
        profit >
        0
    ) {

        rr =
            profit /
            actualRisk;

    }


    /* =====================================
       DISPLAY RESULTS
    ===================================== */

    requiredLotSize.textContent =
        lots.toFixed(
            2
        );


    marginRequired.textContent =
        money(
            margin
        );


    lossAtStop.textContent =
        "-" +
        money(
            actualRisk
        );


    profitAtTp.textContent =
        profit >
        0
            ?
            "+" +
            money(
                profit
            )
            :
            "$0.00";


    plannedRR.textContent =
        rr.toFixed(
            2
        ) +
        "R";


    positionNotional.textContent =
        money(
            positionValue
        );


    /* =====================================
       RESULT MESSAGE
    ===================================== */

    if (
        actualRisk <
        riskCash
    ) {

        riskMessage.textContent =
            "Selected risk: " +
            money(
                riskCash
            ) +
            " | Actual risk: " +
            money(
                actualRisk
            ) +
            " | Lot size rounded down to 0.01.";

    }


    else {

        riskMessage.textContent =
            "Calculation complete.";

    }

}


/* =========================================
   ROUND DOWN LOT SIZE
========================================= */

function roundDownToStep(
    value,
    step
) {

    if (
        !Number.isFinite(
            value
        )
    ) {

        return 0;

    }


    if (
        !Number.isFinite(
            step
        ) ||
        step <=
        0
    ) {

        return value;

    }


    const rounded =
        Math.floor(
            (
                value /
                step
            ) +
            1e-9
        ) *
        step;


    return Number(
        rounded.toFixed(
            8
        )
    );

}


/* =========================================
   RESET RESULTS
========================================= */

function resetResults() {

    requiredLotSize.textContent =
        "0.00";


    marginRequired.textContent =
        "$0.00";


    lossAtStop.textContent =
        "$0.00";


    profitAtTp.textContent =
        "$0.00";


    plannedRR.textContent =
        "0.00R";


    positionNotional.textContent =
        "$0.00";

}


/* =========================================
   MONEY FORMAT
========================================= */

function money(
    value
) {

    const amount =
        Number(
            value ||
            0
        );


    return "$" +
        amount.toLocaleString(
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
   START
========================================= */

loadRiskAccounts();
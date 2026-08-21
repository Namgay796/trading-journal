const riskAccount =
    document.getElementById("riskAccount");

const assetClass =
    document.getElementById("assetClass");

const riskSymbol =
    document.getElementById("riskSymbol");

const riskDirection =
    document.getElementById("riskDirection");

const riskLeverage =
    document.getElementById("riskLeverage");

const riskPercent =
    document.getElementById("riskPercent");

const riskDollars =
    document.getElementById("riskDollars");

const entryPrice =
    document.getElementById("entryPrice");

const stopLossPrice =
    document.getElementById("stopLossPrice");

const takeProfitPrice =
    document.getElementById("takeProfitPrice");

const slPips =
    document.getElementById("slPips");

const tpPips =
    document.getElementById("tpPips");

const calculateRiskButton =
    document.getElementById("calculateRiskButton");

const initialBalanceDisplay =
    document.getElementById("initialBalanceDisplay");

const leverageDisplay =
    document.getElementById("leverageDisplay");

const riskAmountDisplay =
    document.getElementById("riskAmountDisplay");

const requiredLotSize =
    document.getElementById("requiredLotSize");

const marginRequired =
    document.getElementById("marginRequired");

const lossAtStop =
    document.getElementById("lossAtStop");

const profitAtTp =
    document.getElementById("profitAtTp");

const plannedRR =
    document.getElementById("plannedRR");

const positionNotional =
    document.getElementById("positionNotional");

const riskMessage =
    document.getElementById("riskMessage");


let accounts = [];

let currentAccount = null;


/* =========================================
   MESSAGE SYSTEM
========================================= */

function showRiskMessage(
    message,
    type = "error"
) {

    riskMessage.textContent =
        message;

    riskMessage.className =
        "form-message show " +
        type;

}


function clearRiskMessage() {

    riskMessage.textContent =
        "";

    riskMessage.className =
        "form-message";

}


/* =========================================
   INPUT ERROR
========================================= */

function markError(
    element
) {

    if (element) {

        element.classList.add(
            "input-error"
        );

    }

}


function clearInputErrors() {

    [
        riskAccount,
        riskSymbol,
        riskPercent,
        riskDollars,
        entryPrice,
        stopLossPrice,
        takeProfitPrice

    ].forEach(
        element => {

            if (element) {

                element.classList.remove(
                    "input-error"
                );

            }

        }
    );

}


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


            showRiskMessage(
                "No trading accounts found. Add a trading account first.",
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


        clearRiskMessage();

    }


    catch (
        error
    ) {

        console.error(
            error
        );


        riskAccount.innerHTML =
            `
            <option value="">
                Unable to load accounts
            </option>
            `;


        showRiskMessage(
            "Unable to load trading accounts: " +
            (
                error.message ||
                "Unknown error."
            ),
            "error"
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
            !currentAccount
        ) {

            showRiskMessage(
                "Please select a valid trading account.",
                "error"
            );


            markError(
                riskAccount
            );


            return;

        }


        clearInputErrors();

        updateAccountDetails();

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

    calculateResults(
        false
    );

}


/* =========================================
   ASSET CLASS
========================================= */

assetClass.addEventListener(
    "change",
    function() {

        updateLeverage();

        updateDefaultSymbol();

        updatePipDistances();

        calculateResults(
            false
        );

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


    if (
        assetClass.value ===
        "forex" &&
        symbol.includes(
            "JPY"
        )
    ) {

        return 0.01;

    }


    if (
        assetClass.value ===
        "forex"
    ) {

        return 0.0001;

    }


    if (
        assetClass.value ===
        "metals"
    ) {

        return 0.01;

    }


    if (
        assetClass.value ===
        "indices"
    ) {

        return 1;

    }


    if (
        assetClass.value ===
        "crypto"
    ) {

        return 1;

    }


    return 0.01;

}


/* =========================================
   PIP DISTANCES
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


    const unit =
        usePoints
            ?
            " points"
            :
            " pips";


    if (
        Number.isFinite(entry) &&
        Number.isFinite(stop)
    ) {

        const distance =
            Math.abs(
                entry -
                stop
            );


        slPips.textContent =
            formatPips(
                distance /
                pipSize
            ) +
            unit;

    }

    else {

        slPips.textContent =
            "0" +
            unit;

    }


    if (
        Number.isFinite(entry) &&
        Number.isFinite(target)
    ) {

        const distance =
            Math.abs(
                target -
                entry
            );


        tpPips.textContent =
            formatPips(
                distance /
                pipSize
            ) +
            unit;

    }

    else {

        tpPips.textContent =
            "0" +
            unit;

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


    return value.toFixed(
        1
    );

}


/* =========================================
   INTERNAL MULTIPLIER
========================================= */

function getContractMultiplier() {

    const symbol =
        String(
            riskSymbol.value ||
            ""
        )
        .trim()
        .toUpperCase();


    if (
        symbol.includes(
            "XAU"
        )
    ) {

        return 100;

    }


    if (
        symbol.includes(
            "XAG"
        )
    ) {

        return 5000;

    }


    if (
        assetClass.value ===
        "forex"
    ) {

        return 100000;

    }


    if (
        assetClass.value ===
        "indices"
    ) {

        return 1;

    }


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
   RISK % -> $
========================================= */

riskPercent.addEventListener(
    "input",
    function() {

        calculateRiskFromPercent();

        calculateResults(
            false
        );

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
   RISK $ -> %
========================================= */

riskDollars.addEventListener(
    "input",
    function() {

        calculateRiskFromDollars();

        calculateResults(
            false
        );

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

        calculateResults(
            true
        );

    }
);


/* =========================================
   LIVE PRICE CHANGES
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

                calculateResults(
                    false
                );

            }
        );


        field.addEventListener(
            "change",
            function() {

                updatePipDistances();

                calculateResults(
                    false
                );

            }
        );

    }
);


/* =========================================
   DIRECTION
========================================= */

riskDirection.addEventListener(
    "change",
    function() {

        updatePipDistances();

        calculateResults(
            false
        );

    }
);


/* =========================================
   MAIN CALCULATION
========================================= */

function calculateResults(
    showMissingWarnings = false
) {

    clearRiskMessage();

    clearInputErrors();

    updatePipDistances();


    /* =====================================
       ACCOUNT
    ===================================== */

    if (
        !currentAccount
    ) {

        resetResults();


        if (
            showMissingWarnings
        ) {

            showRiskMessage(
                "Please select a trading account.",
                "error"
            );


            markError(
                riskAccount
            );

        }


        return;

    }


    /* =====================================
       SYMBOL
    ===================================== */

    const symbol =
        String(
            riskSymbol.value ||
            ""
        ).trim();


    if (
        !symbol
    ) {

        resetResults();


        if (
            showMissingWarnings
        ) {

            showRiskMessage(
                "Please enter a trading symbol.",
                "error"
            );


            markError(
                riskSymbol
            );

        }


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
       ENTRY
    ===================================== */

    if (
        !Number.isFinite(entry) ||
        entry <=
        0
    ) {

        resetResults();


        if (
            showMissingWarnings
        ) {

            showRiskMessage(
                "Please enter a valid Entry Price.",
                "error"
            );


            markError(
                entryPrice
            );

        }


        return;

    }


    /* =====================================
       STOP LOSS
    ===================================== */

    if (
        !Number.isFinite(stop) ||
        stop <=
        0
    ) {

        resetResults();


        if (
            showMissingWarnings
        ) {

            showRiskMessage(
                "Please enter a valid Stop Loss.",
                "error"
            );


            markError(
                stopLossPrice
            );

        }


        return;

    }


    /* =====================================
       RISK
    ===================================== */

    if (
        !Number.isFinite(riskCash) ||
        riskCash <=
        0
    ) {

        resetResults();


        showRiskMessage(
            "Risk must be greater than $0. Enter Risk % or Risk $.",
            "error"
        );


        markError(
            riskPercent
        );


        markError(
            riskDollars
        );


        return;

    }


    /* =====================================
       BUY SL
    ===================================== */

    if (
        riskDirection.value ===
            "BUY" &&
        stop >=
            entry
    ) {

        resetResults();


        showRiskMessage(
            "Invalid BUY setup: Stop Loss must be below the Entry Price.",
            "error"
        );


        markError(
            stopLossPrice
        );


        return;

    }


    /* =====================================
       SELL SL
    ===================================== */

    if (
        riskDirection.value ===
            "SELL" &&
        stop <=
            entry
    ) {

        resetResults();


        showRiskMessage(
            "Invalid SELL setup: Stop Loss must be above the Entry Price.",
            "error"
        );


        markError(
            stopLossPrice
        );


        return;

    }


    /* =====================================
       TP VALIDATION
    ===================================== */

    if (
        Number.isFinite(target) &&
        target >
        0
    ) {

        if (
            riskDirection.value ===
                "BUY" &&
            target <=
                entry
        ) {

            resetResults();


            showRiskMessage(
                "Invalid BUY setup: Take Profit must be above the Entry Price.",
                "error"
            );


            markError(
                takeProfitPrice
            );


            return;

        }


        if (
            riskDirection.value ===
                "SELL" &&
            target >=
                entry
        ) {

            resetResults();


            showRiskMessage(
                "Invalid SELL setup: Take Profit must be below the Entry Price.",
                "error"
            );


            markError(
                takeProfitPrice
            );


            return;

        }

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


        showRiskMessage(
            "Entry Price and Stop Loss cannot be the same.",
            "error"
        );


        markError(
            entryPrice
        );


        markError(
            stopLossPrice
        );


        return;

    }


    /* =====================================
       LOT SIZE
    ===================================== */

    const rawLots =
        riskCash /
        (
            stopDistance *
            multiplier
        );


    const lots =
        roundDownToStep(
            rawLots,
            lotStep
        );


    if (
        !Number.isFinite(lots) ||
        lots <=
        0
    ) {

        resetResults();


        showRiskMessage(
            "Calculated lot size is below 0.01 lot. Increase the risk amount or reduce the Stop Loss distance.",
            "warning"
        );


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
       MARGIN
    ===================================== */

    let margin =
        0;


    if (
        Number.isFinite(leverage) &&
        leverage >
        0
    ) {

        margin =
            positionValue /
            leverage;

    }


    else {

        resetResults();


        showRiskMessage(
            "Invalid leverage. Check this account's leverage settings.",
            "error"
        );


        return;

    }


    /* =====================================
       PROFIT
    ===================================== */

    let rewardDistance =
        0;


    let profit =
        0;


    if (
        Number.isFinite(target) &&
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


        if (
            rewardDistance >
            0
        ) {

            profit =
                rewardDistance *
                multiplier *
                lots;

        }

    }


    /* =====================================
       RR
    ===================================== */

    const rr =
        actualRisk >
            0 &&
        profit >
            0
            ?
            profit /
            actualRisk
            :
            0;


    /* =====================================
       OUTPUT
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
       SUCCESS / WARNING
    ===================================== */

    if (
        !Number.isFinite(target) ||
        target <=
        0
    ) {

        showRiskMessage(
            "Lot size and margin calculated. Add a Take Profit to calculate Profit and Planned RR.",
            "warning"
        );


        return;

    }


    if (
        actualRisk <
        riskCash
    ) {

        showRiskMessage(
            "Calculation complete. Lot size was rounded down to 0.01, so actual risk is " +
            money(
                actualRisk
            ) +
            " instead of " +
            money(
                riskCash
            ) +
            ".",
            "success"
        );


        return;

    }


    showRiskMessage(
        "Calculation complete.",
        "success"
    );

}


/* =========================================
   ROUND LOT SIZE DOWN
========================================= */

function roundDownToStep(
    value,
    step
) {

    if (
        !Number.isFinite(value)
    ) {

        return 0;

    }


    if (
        !Number.isFinite(step) ||
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
   MONEY
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
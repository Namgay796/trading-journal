const riskAccount =
    document.getElementById(
        "riskAccount"
    );const riskAccount =
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

        riskMessage.textContent =
            "ERROR: " +
            error.message;

        return;

    }


    accounts =
        data || [];


    riskAccount.innerHTML =
        "";


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


    if (
        accounts.length >
        0
    ) {

        currentAccount =
            accounts[0];


        updateAccountDetails();

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


    calculateResults();

}


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
   ASSET CLASS
========================================= */

assetClass.addEventListener(
    "change",
    function() {

        updateLeverage();

        updateDefaultSymbol();

        calculateResults();

    }
);


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
   INTERNAL CONTRACT MULTIPLIER

   USER DOES NOT NEED TO ENTER THIS.
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


    /*
       INDEX CFD

       1 lot = $1 per index point
       by default.
    */

    if (
        assetClass.value ===
        "indices"
    ) {

        return 1;

    }


    /*
       CRYPTO CFD

       1 lot = 1 underlying unit
       by default.
    */

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
        Number(
            riskPercent.value ||
            0
        );


    const dollars =
        balance *
        (
            percent /
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
        Number(
            riskDollars.value ||
            0
        );


    let percent =
        0;


    if (
        balance >
        0
    ) {

        percent =
            (
                dollars /
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
            dollars
        );

}


/* =========================================
   CALCULATE BUTTON
========================================= */

calculateRiskButton.addEventListener(
    "click",
    calculateResults
);


/* =========================================
   LIVE UPDATE
========================================= */

[
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    riskSymbol,
    riskDirection

].forEach(
    field => {

        field.addEventListener(
            "input",
            calculateResults
        );


        field.addEventListener(
            "change",
            calculateResults
        );

    }
);


/* =========================================
   MAIN CALCULATION
========================================= */

function calculateResults() {

    riskMessage.textContent =
        "";


    if (
        !currentAccount
    ) {

        return;

    }


    const entry =
        Number(
            entryPrice.value
        );


    const stop =
        Number(
            stopLossPrice.value
        );


    const target =
        Number(
            takeProfitPrice.value
        );


    const riskCash =
        Number(
            riskDollars.value ||
            0
        );


    const leverage =
        Number(
            riskLeverage.value ||
            1
        );


    const multiplier =
        getContractMultiplier();


    const lotStep =
        getLotStep();


    if (
        !entry ||
        !stop ||
        riskCash <=
        0
    ) {

        resetResults();

        return;

    }


    /* =====================================
       VALIDATE SL
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

        return;

    }


    /* =====================================
       LOT SIZE FROM RISK

       LOT =
       RISK MONEY
       ----------------------------
       STOP DISTANCE × MULTIPLIER
    ===================================== */

    let lots =
        riskCash /
        (
            stopDistance *
            multiplier
        );


    /*
       Round DOWN so risk never
       exceeds selected risk amount.
    */

    lots =
        roundDownToStep(
            lots,
            lotStep
        );


    if (
        lots <=
        0
    ) {

        resetResults();


        riskMessage.textContent =
            "Calculated lot size is below 0.01 lot.";


        return;

    }


    /* =====================================
       ACTUAL RISK AFTER ROUNDING
    ===================================== */

    const actualRisk =
        stopDistance *
        multiplier *
        lots;


    /* =====================================
       POSITION VALUE
    ===================================== */

    const notional =
        entry *
        multiplier *
        lots;


    /* =====================================
       MARGIN REQUIRED
    ===================================== */

    const margin =
        leverage >
        0
            ?
            notional /
            leverage
            :
            0;


    /* =====================================
       TAKE PROFIT
    ===================================== */

    let rewardDistance =
        0;


    if (
        target
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

    const rr =
        actualRisk >
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
        "-$" +
        actualRisk
            .toLocaleString(
                "en-AU",
                {

                    minimumFractionDigits:
                        2,

                    maximumFractionDigits:
                        2

                }
            );


    profitAtTp.textContent =
        profit >
        0
            ?
            "+$" +
            profit
                .toLocaleString(
                    "en-AU",
                    {

                        minimumFractionDigits:
                            2,

                        maximumFractionDigits:
                            2

                    }
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
            notional
        );


    /*
       Show if rounding causes
       actual risk to be slightly lower.
    */

    if (
        actualRisk <
        riskCash
    ) {

        riskMessage.textContent =
            "Lot size rounded down to 0.01 so actual risk does not exceed your selected risk amount.";

    }

}


/* =========================================
   ROUND DOWN LOT SIZE
========================================= */

function roundDownToStep(
    value,
    step
) {

    return (
        Math.floor(
            value /
            step +
            1e-9
        ) *
        step
    );

}


/* =========================================
   RESET
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
   START
========================================= */

loadRiskAccounts();


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


const contractSize =
    document.getElementById(
        "contractSize"
    );


const lotStep =
    document.getElementById(
        "lotStep"
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
                "id",
                {
                    ascending:
                        true
                }
            );


    if (
        error
    ) {

        console.error(
            error
        );


        riskMessage.textContent =
            "ERROR: " +
            error.message;


        return;

    }


    accounts =
        data || [];


    riskAccount.innerHTML =
        "";


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


    if (
        accounts.length >
        0
    ) {

        currentAccount =
            accounts[0];


        updateAccountDetails();

    }


    else {

        riskAccount.innerHTML =
            `
            <option>
                No accounts found
            </option>
            `;


        riskMessage.textContent =
            "Add a trading account first.";

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


        updateAccountDetails();

    }
);



/* =========================================
   UPDATE ACCOUNT DETAILS
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

}



/* =========================================
   ASSET CLASS CHANGE
========================================= */

assetClass.addEventListener(
    "change",
    function() {

        updateLeverage();

        updateContractDefaults();

        calculateResults();

    }
);



/* =========================================
   LEVERAGE FROM ACCOUNT
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
   DEFAULT CONTRACT SETTINGS
========================================= */

function updateContractDefaults() {

    switch (
        assetClass.value
    ) {

        case "metals":

            contractSize.value =
                100;

            lotStep.value =
                0.01;

            break;


        case "forex":

            contractSize.value =
                100000;

            lotStep.value =
                0.01;

            break;


        case "indices":

            contractSize.value =
                1;

            lotStep.value =
                0.01;

            break;


        case "crypto":

            contractSize.value =
                1;

            lotStep.value =
                0.01;

            break;

    }

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
        Number(
            riskPercent.value ||
            0
        );


    const dollars =
        balance *
        (
            percent /
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
        Number(
            riskDollars.value ||
            0
        );


    let percent =
        0;


    if (
        balance >
        0
    ) {

        percent =
            (
                dollars /
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
            dollars
        );

}



/* =========================================
   CALCULATE
========================================= */

calculateRiskButton.addEventListener(
    "click",
    function() {

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
    contractSize,
    lotStep,
    riskDirection

].forEach(
    field => {

        field.addEventListener(
            "input",
            calculateResults
        );


        field.addEventListener(
            "change",
            calculateResults
        );

    }
);



/* =========================================
   MAIN CALCULATION
========================================= */

function calculateResults() {

    riskMessage.textContent =
        "";


    if (
        !currentAccount
    ) {

        return;

    }


    const entry =
        Number(
            entryPrice.value
        );


    const stop =
        Number(
            stopLossPrice.value
        );


    const target =
        Number(
            takeProfitPrice.value
        );


    const riskCash =
        Number(
            riskDollars.value ||
            0
        );


    const multiplier =
        Number(
            contractSize.value ||
            0
        );


    const leverage =
        Number(
            riskLeverage.value ||
            1
        );


    const step =
        Number(
            lotStep.value ||
            0.01
        );


    if (
        !entry ||
        !stop ||
        riskCash <=
        0 ||
        multiplier <=
        0
    ) {

        resetResults();

        return;

    }


    /* =====================================
       CHECK DIRECTION
    ===================================== */

    if (
        riskDirection.value ===
        "BUY" &&
        stop >=
        entry
    ) {

        riskMessage.textContent =
            "For a BUY trade, Stop Loss should be below Entry.";


        resetResults();

        return;

    }


    if (
        riskDirection.value ===
        "SELL" &&
        stop <=
        entry
    ) {

        riskMessage.textContent =
            "For a SELL trade, Stop Loss should be above Entry.";


        resetResults();

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

        return;

    }


    /* =====================================
       REQUIRED LOT SIZE

       Risk =
       stop distance
       × contract size
       × lots
    ===================================== */

    let lots =
        riskCash /
        (
            stopDistance *
            multiplier
        );


    lots =
        roundDownToStep(
            lots,
            step
        );


    if (
        lots <=
        0
    ) {

        resetResults();

        riskMessage.textContent =
            "The calculated lot size is below your lot-size step.";

        return;

    }


    /* =====================================
       ACTUAL LOSS AFTER LOT ROUNDING
    ===================================== */

    const actualLoss =
        stopDistance *
        multiplier *
        lots;


    /* =====================================
       POSITION NOTIONAL

       Entry × Contract Size × Lots
    ===================================== */

    const notional =
        entry *
        multiplier *
        lots;


    /* =====================================
       MARGIN
    ===================================== */

    const margin =
        leverage >
        0
            ?
            notional /
            leverage
            :
            0;


    /* =====================================
       TP PROFIT
    ===================================== */

    let profit =
        0;


    let rewardDistance =
        0;


    if (
        target
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
        actualLoss >
        0 &&
        profit >
        0
    ) {

        rr =
            profit /
            actualLoss;

    }


    /* =====================================
       DISPLAY
    ===================================== */

    requiredLotSize.textContent =
        formatLots(
            lots,
            step
        );


    marginRequired.textContent =
        money(
            margin
        );


    lossAtStop.textContent =
        "-$" +
        actualLoss
            .toLocaleString(
                "en-AU",
                {
                    minimumFractionDigits:
                        2,

                    maximumFractionDigits:
                        2
                }
            );


    profitAtTp.textContent =
        profit >
        0
            ?
            "+$" +
            profit
                .toLocaleString(
                    "en-AU",
                    {
                        minimumFractionDigits:
                            2,

                        maximumFractionDigits:
                            2
                    }
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
            notional
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
   ROUND LOT SIZE DOWN
========================================= */

function roundDownToStep(
    value,
    step
) {

    if (
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
   FORMAT LOT SIZE
========================================= */

function formatLots(
    value,
    step
) {

    let decimals =
        2;


    if (
        step <
        0.01
    ) {

        decimals =
            3;

    }


    if (
        step <
        0.001
    ) {

        decimals =
            4;

    }


    return Number(
        value
    ).toFixed(
        decimals
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
   START
========================================= */

loadRiskAccounts();
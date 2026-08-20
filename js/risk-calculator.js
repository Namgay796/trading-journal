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

    console.log(
        "Loading trading accounts..."
    );


    riskAccount.innerHTML =
        `
        <option value="">
            Loading...
        </option>
        `;


    try {

        /* =====================================
           GET LOGGED-IN USER
        ===================================== */

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
            userError
        ) {

            throw userError;

        }


        if (
            !user
        ) {

            throw new Error(
                "User is not logged in."
            );

        }


        /* =====================================
           LOAD USER ACCOUNTS
        ===================================== */

        const {
            data,
            error
        } =
            await db
                .from(
                    "accounts"
                )
                .select("*")
                .eq(
                    "user_id",
                    user.id
                )
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

            throw error;

        }


        accounts =
            data || [];


        riskAccount.innerHTML =
            "";


        /* =====================================
           NO ACCOUNTS
        ===================================== */

        if (
            accounts.length ===
            0
        ) {

            riskAccount.innerHTML =
                `
                <option value="">
                    No accounts found
                </option>
                `;


            riskMessage.textContent =
                "No trading accounts found. Add an account first.";


            return;

        }


        /* =====================================
           ADD ACCOUNTS TO SELECTOR
        ===================================== */

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


        /* =====================================
           SELECT FIRST ACCOUNT
        ===================================== */

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
            "Risk calculator account error:",
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
                "Unable to load trading accounts."
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
   ASSET CLASS CHANGE
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

   The user only sees lot size.

   This is used internally to convert
   price movement into P&L per lot.
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
   CALCULATE BUTTON
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
   MAIN RISK CALCULATION
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


    /* =====================================
       WAIT UNTIL REQUIRED DATA EXISTS
    ===================================== */

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
       CHECK BUY / SELL STOP
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
       LOT SIZE

       Risk Amount
       ---------------------------
       Stop Distance × Multiplier

       Example:

       XAUUSD
       Risk = $250
       Entry = 3350
       SL = 3345

       Distance = $5

       $5 × 100 = $500 per 1 lot

       $250 / $500 = 0.50 lots
    ===================================== */

    let lots =
        riskCash /
        (
            stopDistance *
            multiplier
        );


    /*
       Round DOWN so the trade
       does not exceed selected risk.
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
       ACTUAL RISK AFTER LOT ROUNDING
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

    const margin =
        leverage >
        0
            ?
            positionValue /
            leverage
            :
            0;


    /* =====================================
       TP DISTANCE
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
       PLANNED RR
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
       ROUNDING MESSAGE
    ===================================== */

    if (
        actualRisk <
        riskCash
    ) {

        const difference =
            riskCash -
            actualRisk;


        riskMessage.textContent =
            "Lot size rounded down to 0.01. " +
            "Selected risk: " +
            money(
                riskCash
            ) +
            " | Actual risk: " +
            money(
                actualRisk
            ) +
            " | Unused risk: " +
            money(
                difference
            );

    }

}


/* =========================================
   ROUND DOWN TO LOT STEP
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
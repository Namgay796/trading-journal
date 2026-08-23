const dashboardAccount =
    document.getElementById(
        "dashboardAccount"
    );


let accounts = [];



/* =====================================
   LOAD ACCOUNTS
===================================== */

async function loadAccounts() {

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

        console.error(
            error
        );

        return;

    }


    accounts =
        data || [];


    dashboardAccount.innerHTML =
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


            dashboardAccount.appendChild(
                option
            );

        }
    );


    if (
        accounts.length ===
        0
    ) {

        return;

    }


    /* =====================================
       ACCOUNT FROM URL
    ===================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );


    const requestedAccount =
        Number(
            params.get(
                "account"
            )
        );


    let selectedAccount =
        accounts[0];


    if (
        requestedAccount
    ) {

        const found =
            accounts.find(
                account =>
                    Number(
                        account.id
                    ) ===
                    requestedAccount
            );


        if (
            found
        ) {

            selectedAccount =
                found;

        }

    }


    dashboardAccount.value =
        selectedAccount.id;


    loadDashboard(
        selectedAccount
    );

}



/* =====================================
   LOAD DASHBOARD
===================================== */

async function loadDashboard(
    account
) {

    const {
        data,
        error
    } =
        await db
            .from(
                "trades"
            )
            .select("*")
            .eq(
                "account_id",
                account.id
            )
            .order(
                "trade_date",
                {
                    ascending:
                        false
                }
            )
            .order(
                "id",
                {
                    ascending:
                        false
                }
            );


    if (
        error
    ) {

        console.error(
            error
        );

        return;

    }


    const trades =
        data || [];


    calculateMainStats(
        account,
        trades
    );


    calculatePropRisk(
        account,
        trades
    );


    showRecentTrades(
        trades.slice(
            0,
            5
        )
    );

}



/* =====================================
   MAIN STATISTICS
===================================== */

function calculateMainStats(
    account,
    trades
) {

    const startingBalance =
        Number(
            account.starting_balance ||
            0
        );


    const totalPnL =
        trades.reduce(
            (
                total,
                trade
            ) =>
                total +
                Number(
                    trade.profit_loss ||
                    0
                ),
            0
        );


    const currentBalance =
        startingBalance +
        totalPnL;


    const wins =
        trades.filter(
            trade =>
                Number(
                    trade.profit_loss ||
                    0
                ) >
                0
        );


    const totalTrades =
        trades.length;


    const winRate =
        totalTrades >
        0
            ?
            (
                wins.length /
                totalTrades
            ) *
            100
            :
            0;


    const totalR =
        trades.reduce(
            (
                total,
                trade
            ) =>
                total +
                Number(
                    trade.r_multiple ||
                    0
                ),
            0
        );


    const averageR =
        totalTrades >
        0
            ?
            totalR /
            totalTrades
            :
            0;


    const grossProfit =
        trades.reduce(
            (
                total,
                trade
            ) => {

                const pnl =
                    Number(
                        trade.profit_loss ||
                        0
                    );


                return pnl >
                    0
                    ?
                    total +
                    pnl
                    :
                    total;

            },
            0
        );


    const grossLoss =
        trades.reduce(
            (
                total,
                trade
            ) => {

                const pnl =
                    Number(
                        trade.profit_loss ||
                        0
                    );


                return pnl <
                    0
                    ?
                    total +
                    Math.abs(
                        pnl
                    )
                    :
                    total;

            },
            0
        );


    let profitFactor =
        0;


    if (
        grossLoss >
        0
    ) {

        profitFactor =
            grossProfit /
            grossLoss;

    }


    document
        .getElementById(
            "balance"
        )
        .textContent =
        money(
            currentBalance
        );


    document
        .getElementById(
            "balanceChange"
        )
        .textContent =
        signedMoney(
            totalPnL
        );


    document
        .getElementById(
            "totalPnL"
        )
        .textContent =
        signedMoney(
            totalPnL
        );


    document
        .getElementById(
            "winRate"
        )
        .textContent =
        winRate.toFixed(
            1
        ) +
        "%";


    document
        .getElementById(
            "averageR"
        )
        .textContent =
        averageR.toFixed(
            2
        ) +
        "R";


    document
        .getElementById(
            "profitFactor"
        )
        .textContent =
        grossLoss >
        0
            ?
            profitFactor.toFixed(
                2
            )
            :
            grossProfit >
            0
                ?
                "∞"
                :
                "0.00";


    document
        .getElementById(
            "totalTrades"
        )
        .textContent =
        totalTrades;

}



/* =====================================
   RISK MANAGEMENT
===================================== */

function calculatePropRisk(
    account,
    trades
) {

    const startingBalance =
        Number(
            account.starting_balance ||
            0
        );


    const totalPnL =
        trades.reduce(
            (
                sum,
                trade
            ) =>
                sum +
                Number(
                    trade.profit_loss ||
                    0
                ),
            0
        );


    const currentBalance =
        startingBalance +
        totalPnL;


    const profitTargetPercent =
        Number(
            account.profit_target ||
            0
        );


    const dailyLimitPercent =
        Number(
            account.daily_loss_limit ||
            0
        );


    const maxLimitPercent =
        Number(
            account.max_loss_limit ||
            0
        );


    const consistencyRule =
        Number(
            account.consistency_rule ||
            0
        );



    /* =================================
       ACCOUNT INFORMATION
    ================================= */

    document
        .getElementById(
            "accountInfo"
        )
        .textContent =
        `${account.firm || "Personal"} • ` +
        `${account.account_type || "Personal"} • ` +
        `${account.drawdown_type || "Static"} DD`;


    document
        .getElementById(
            "accountStatusBadge"
        )
        .textContent =
        account.status ||
        "Active";



    /* =================================
       PROFIT TARGET
    ================================= */

    const targetAmount =
        startingBalance *
        (
            profitTargetPercent /
            100
        );


    let targetProgress =
        0;


    if (
        targetAmount >
        0 &&
        totalPnL >
        0
    ) {

        targetProgress =
            (
                totalPnL /
                targetAmount
            ) *
            100;

    }


    const targetRemaining =
        Math.max(
            targetAmount -
            Math.max(
                totalPnL,
                0
            ),
            0
        );


    document
        .getElementById(
            "profitTargetPercent"
        )
        .textContent =
        targetProgress.toFixed(
            1
        ) +
        "%";


    document
        .getElementById(
            "profitTargetAmount"
        )
        .textContent =
        `${money(totalPnL)} / ${money(targetAmount)}`;


    document
        .getElementById(
            "profitTargetRemaining"
        )
        .textContent =
        "Remaining: " +
        money(
            targetRemaining
        );


    setProgress(
        "profitTargetBar",
        targetProgress
    );



    /* =================================
       DAILY LOSS LIMIT
    ================================= */

    const today =
        getLocalDateString();


    const todayTrades =
        trades.filter(
            trade =>
                trade.trade_date ===
                today
        );


    const todayPnL =
        todayTrades.reduce(
            (
                sum,
                trade
            ) =>
                sum +
                Number(
                    trade.profit_loss ||
                    0
                ),
            0
        );


    const dailyLossLimitAmount =
        startingBalance *
        (
            dailyLimitPercent /
            100
        );


    /*
       Only losses consume the allowance.

       Positive P&L does not increase
       the configured limit.
    */

    const dailyLossUsed =
        todayPnL <
        0
            ?
            Math.abs(
                todayPnL
            )
            :
            0;


    const dailyRemaining =
        Math.max(
            dailyLossLimitAmount -
            dailyLossUsed,
            0
        );


    /*
       DISPLAYED %:

       If limit = 3%
       unused = 3%
       $250 used on $25k = 2%
       fully used = 0%
    */

    const dailyLossRemainingPercent =
        startingBalance >
        0
            ?
            (
                dailyRemaining /
                startingBalance
            ) *
            100
            :
            0;


    /*
       PROGRESS BAR:

       100% full when complete
       allowance remains.

       0% when allowance is gone.
    */

    const dailyBarPercent =
        dailyLossLimitAmount >
        0
            ?
            (
                dailyRemaining /
                dailyLossLimitAmount
            ) *
            100
            :
            0;


    document
        .getElementById(
            "dailyLossPercent"
        )
        .textContent =
        dailyLossRemainingPercent
            .toFixed(
                2
            ) +
        "%";


    document
        .getElementById(
            "todayPnL"
        )
        .textContent =
        "Used today: " +
        money(
            dailyLossUsed
        );


    document
        .getElementById(
            "dailyLossRemaining"
        )
        .textContent =
        "Remaining: " +
        money(
            dailyRemaining
        );


    setProgress(
        "dailyLossBar",
        dailyBarPercent
    );



    /* =================================
       MAXIMUM LOSS
    ================================= */

    const maxLossAmount =
        startingBalance *
        (
            maxLimitPercent /
            100
        );


    /*
       STATIC DRAWDOWN
    */

    let breachLevel =
        startingBalance -
        maxLossAmount;


    /*
       BALANCE TRAILING DRAWDOWN
    */

    if (
        String(
            account.drawdown_type
        )
        .toLowerCase() ===
        "balance trailing"
    ) {

        const chronological =
            [
                ...trades
            ]
            .sort(
                (
                    a,
                    b
                ) => {

                    const dateCompare =
                        String(
                            a.trade_date
                        )
                        .localeCompare(
                            String(
                                b.trade_date
                            )
                        );


                    if (
                        dateCompare !==
                        0
                    ) {

                        return dateCompare;

                    }


                    return (
                        Number(
                            a.id
                        )
                        -
                        Number(
                            b.id
                        )
                    );

                }
            );


        let runningBalance =
            startingBalance;


        let highestBalance =
            startingBalance;


        chronological.forEach(
            trade => {

                runningBalance +=
                    Number(
                        trade.profit_loss ||
                        0
                    );


                highestBalance =
                    Math.max(
                        highestBalance,
                        runningBalance
                    );

            }
        );


        breachLevel =
            highestBalance -
            maxLossAmount;

    }


    const remainingToBreach =
        Math.max(
            currentBalance -
            breachLevel,
            0
        );


    const maxLossUsed =
        Math.max(
            maxLossAmount -
            remainingToBreach,
            0
        );


    /*
       DISPLAY %

       Example:
       limit = 6%
       used = 2%
       display = 4%
    */

    const maxLossRemainingPercent =
        startingBalance >
        0
            ?
            (
                remainingToBreach /
                startingBalance
            ) *
            100
            :
            0;


    /*
       BAR REMAINING
    */

    const maxLossBarPercent =
        maxLossAmount >
        0
            ?
            (
                remainingToBreach /
                maxLossAmount
            ) *
            100
            :
            0;


    document
        .getElementById(
            "maxLossPercent"
        )
        .textContent =
        maxLossRemainingPercent
            .toFixed(
                2
            ) +
        "%";


    document
        .getElementById(
            "maxLossUsed"
        )
        .textContent =
        "Used: " +
        money(
            maxLossUsed
        );


    document
        .getElementById(
            "maxLossRemaining"
        )
        .textContent =
        "Remaining: " +
        money(
            remainingToBreach
        );


    setProgress(
        "maxLossBar",
        maxLossBarPercent
    );



    /* =================================
       CONSISTENCY
       KEEP CURRENT LOGIC
    ================================= */

    const dailyTotals =
        {};


    trades.forEach(
        trade => {

            const date =
                trade.trade_date;


            if (
                !dailyTotals[
                    date
                ]
            ) {

                dailyTotals[
                    date
                ] =
                0;

            }


            dailyTotals[
                date
            ] +=
                Number(
                    trade.profit_loss ||
                    0
                );

        }
    );


    const profitableDays =
        Object.values(
            dailyTotals
        )
        .filter(
            pnl =>
                pnl >
                0
        );


    const highestDay =
        profitableDays.length
            ?
            Math.max(
                ...profitableDays
            )
            :
            0;


    let consistency =
        0;


    if (
        totalPnL >
        0
    ) {

        consistency =
            (
                highestDay /
                totalPnL
            ) *
            100;

    }


    document
        .getElementById(
            "consistencyPercent"
        )
        .textContent =
        consistency.toFixed(
            1
        ) +
        "%";


    document
        .getElementById(
            "highestDay"
        )
        .textContent =
        "Highest Day: " +
        money(
            highestDay
        );


    document
        .getElementById(
            "consistencyLimit"
        )
        .textContent =
        consistencyRule >
        0
            ?
            "Limit: " +
            consistencyRule
                .toFixed(
                    1
                ) +
            "%"
            :
            "No consistency rule";


    setProgress(
        "consistencyBar",
        consistencyRule >
        0
            ?
            (
                consistency /
                consistencyRule
            ) *
            100
            :
            0
    );



    /* =================================
       WARNINGS
    ================================= */

    const warnings =
        [];


    /*
       DAILY LOSS CLOSE

       20% or less remaining
    */

    if (
        dailyLimitPercent >
        0 &&
        dailyBarPercent <=
        20 &&
        dailyRemaining >
        0
    ) {

        warnings.push(
            "⚠ Daily loss limit is close."
        );

    }


    /*
       DAILY LOSS BREACHED
    */

    if (
        dailyLossLimitAmount >
        0 &&
        dailyLossUsed >=
        dailyLossLimitAmount
    ) {

        warnings.push(
            "⚠ Daily loss limit breached."
        );

    }


    /*
       MAX LOSS CLOSE
    */

    if (
        maxLimitPercent >
        0 &&
        maxLossBarPercent <=
        20 &&
        remainingToBreach >
        0
    ) {

        warnings.push(
            "⚠ Maximum loss limit is close."
        );

    }


    /*
       MAX LOSS BREACHED
    */

    if (
        currentBalance <=
        breachLevel &&
        maxLimitPercent >
        0
    ) {

        warnings.push(
            "⚠ Maximum loss level breached."
        );

    }


    /*
       CONSISTENCY
    */

    if (
        consistencyRule >
        0 &&
        consistency >
        consistencyRule
    ) {

        warnings.push(
            `⚠ Consistency is ${consistency.toFixed(1)}%. ` +
            `Your limit is ${consistencyRule.toFixed(1)}%.`
        );

    }


    /*
       PROFIT TARGET
    */

    if (
        targetAmount >
        0 &&
        totalPnL >=
        targetAmount
    ) {

        warnings.push(
            "✓ Profit target reached."
        );

    }


    showWarnings(
        warnings
    );

}



/* =====================================
   WARNINGS
===================================== */

function showWarnings(
    warnings
) {

    const box =
        document.getElementById(
            "riskWarnings"
        );


    if (
        warnings.length ===
        0
    ) {

        box.innerHTML =
            `

            <div class="risk-good">

                ✓ No risk warnings

            </div>

            `;


        return;

    }


    box.innerHTML =
        warnings
            .map(
                warning =>
                    `

                    <div class="risk-warning">

                        ${warning}

                    </div>

                    `
            )
            .join("");

}



/* =====================================
   PROGRESS BAR
===================================== */

function setProgress(
    id,
    percentage
) {

    const element =
        document.getElementById(
            id
        );


    if (
        !element
    ) {

        return;

    }


    const safeValue =
        Math.max(
            0,
            Math.min(
                Number(
                    percentage ||
                    0
                ),
                100
            )
        );


    element.style.width =
        safeValue +
        "%";

}



/* =====================================
   RECENT TRADES
===================================== */

function showRecentTrades(
    trades
) {

    const box =
        document.getElementById(
            "recentTrades"
        );


    if (
        trades.length ===
        0
    ) {

        box.innerHTML =
            `

            <p class="empty">

                No trades recorded yet.

            </p>

            `;


        return;

    }


    box.innerHTML =
        trades
            .map(
                trade => {

                    const pnl =
                        Number(
                            trade.profit_loss ||
                            0
                        );


                    const pnlClass =
                        pnl >=
                        0
                            ?
                            "profit"
                            :
                            "loss";


                    return `

                    <div class="trade-card">


                        <div>

                            <strong>

                                ${trade.symbol}

                                ${trade.direction}

                            </strong>


                            <small>

                                ${trade.trade_date}

                                •

                                ${trade.session || ""}

                                •

                                ${trade.setup || ""}

                            </small>

                        </div>


                        <div class="${pnlClass}">

                            <strong>

                                ${signedMoney(
                                    pnl
                                )}

                            </strong>


                            <small>

                                ${Number(
                                    trade.r_multiple ||
                                    0
                                ).toFixed(2)}R

                            </small>

                        </div>


                    </div>

                    `;

                }
            )
            .join("");

}



/* =====================================
   MONEY
===================================== */

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



/* =====================================
   SIGNED MONEY
===================================== */

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



/* =====================================
   LOCAL DATE
===================================== */

function getLocalDateString() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() +
            1
        )
        .padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        )
        .padStart(
            2,
            "0"
        );


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}



/* =====================================
   ACCOUNT CHANGE
===================================== */

dashboardAccount
    .addEventListener(
        "change",
        function() {

            const selected =
                accounts.find(
                    account =>
                        Number(
                            account.id
                        ) ===
                        Number(
                            dashboardAccount.value
                        )
                );


            if (
                selected
            ) {

                loadDashboard(
                    selected
                );

            }

        }
    );



/* =====================================
   START
===================================== */

loadAccounts();
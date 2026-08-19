const analyticsAccount =
    document.getElementById("analyticsAccount");

const periodFilter =
    document.getElementById("periodFilter");

const customDateRange =
    document.getElementById("customDateRange");

const customStartDate =
    document.getElementById("customStartDate");

const customEndDate =
    document.getElementById("customEndDate");

const applyCustomRange =
    document.getElementById("applyCustomRange");

const periodDescription =
    document.getElementById("periodDescription");


let analyticsAccounts = [];

let allTrades = [];

let selectedAccount = null;

let equityChart;
let sessionChart;
let setupChart;
let weekdayChart;


/* =========================================
   LOAD ACCOUNTS
========================================= */

async function loadAnalyticsAccounts() {

    const { data, error } =
        await db
            .from("accounts")
            .select("*")
            .order("id");


    if (error) {

        console.error(error);

        return;

    }


    analyticsAccounts =
        data || [];


    analyticsAccount.innerHTML =
        "";


    analyticsAccounts.forEach(account => {

        const option =
            document.createElement("option");


        option.value =
            account.id;


        option.textContent =
            account.name;


        analyticsAccount.appendChild(
            option
        );

    });


    if (
        analyticsAccounts.length > 0
    ) {

        selectedAccount =
            analyticsAccounts[0];


        await loadAnalytics(
            selectedAccount
        );

    }

}


/* =========================================
   LOAD ALL TRADES FOR ACCOUNT
========================================= */

async function loadAnalytics(
    account
) {

    selectedAccount =
        account;


    const {
        data: trades,
        error
    } =
        await db
            .from("trades")
            .select("*")
            .eq(
                "account_id",
                account.id
            )
            .order(
                "trade_date",
                {
                    ascending: true
                }
            )
            .order(
                "id",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        return;

    }


    allTrades =
        trades || [];


    applyPeriodFilter();

}


/* =========================================
   DATE HELPERS
========================================= */

function localDateString(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function parseTradeDate(
    value
) {

    return new Date(
        value + "T00:00:00"
    );

}


/* =========================================
   START OF WEEK
   Monday
========================================= */

function startOfWeek(
    date
) {

    const result =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );


    const day =
        result.getDay();


    const difference =
        day === 0
            ?
            -6
            :
            1 - day;


    result.setDate(
        result.getDate() +
        difference
    );


    return result;

}


/* =========================================
   END OF WEEK
   Sunday
========================================= */

function endOfWeek(
    date
) {

    const start =
        startOfWeek(
            date
        );


    const end =
        new Date(
            start
        );


    end.setDate(
        end.getDate() +
        6
    );


    return end;

}


/* =========================================
   DISPLAY DATE
========================================= */

function formatDisplayDate(
    date
) {

    return date.toLocaleDateString(
        "en-AU",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
    );

}


/* =========================================
   GET SELECTED PERIOD
========================================= */

function getSelectedRange() {

    const now =
        new Date();


    const mode =
        periodFilter.value;


    let startDate;
    let endDate;
    let description;


    /* =====================================
       DAILY
    ===================================== */

    if (
        mode === "daily"
    ) {

        startDate =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );


        endDate =
            new Date(
                startDate
            );


        description =
            "Today • " +
            formatDisplayDate(
                startDate
            );

    }


    /* =====================================
       WEEKLY
    ===================================== */

    else if (
        mode === "weekly"
    ) {

        startDate =
            startOfWeek(
                now
            );


        endDate =
            endOfWeek(
                now
            );


        description =
            "This week • " +
            formatDisplayDate(
                startDate
            ) +
            " – " +
            formatDisplayDate(
                endDate
            );

    }


    /* =====================================
       MONTHLY
    ===================================== */

    else if (
        mode === "monthly"
    ) {

        startDate =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );


        endDate =
            new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0
            );


        description =
            now.toLocaleDateString(
                "en-AU",
                {
                    month:
                        "long",

                    year:
                        "numeric"
                }
            );

    }


    /* =====================================
       YEARLY
    ===================================== */

    else if (
        mode === "yearly"
    ) {

        startDate =
            new Date(
                now.getFullYear(),
                0,
                1
            );


        endDate =
            new Date(
                now.getFullYear(),
                11,
                31
            );


        description =
            String(
                now.getFullYear()
            );

    }


    /* =====================================
       CUSTOM
    ===================================== */

    else {

        if (
            !customStartDate.value ||
            !customEndDate.value
        ) {

            return null;

        }


        startDate =
            parseTradeDate(
                customStartDate.value
            );


        endDate =
            parseTradeDate(
                customEndDate.value
            );


        if (
            startDate >
            endDate
        ) {

            alert(
                "Custom start date cannot be after the end date."
            );

            return null;

        }


        description =
            "Custom • " +
            formatDisplayDate(
                startDate
            ) +
            " – " +
            formatDisplayDate(
                endDate
            );

    }


    return {

        startDate:
            startDate,

        endDate:
            endDate,

        description:
            description

    };

}


/* =========================================
   APPLY PERIOD FILTER
========================================= */

function applyPeriodFilter() {

    if (
        !selectedAccount
    ) {

        return;

    }


    const range =
        getSelectedRange();


    if (
        !range
    ) {

        return;

    }


    periodDescription.textContent =
        range.description;


    const filteredTrades =
        allTrades.filter(
            trade => {

                const tradeDate =
                    parseTradeDate(
                        trade.trade_date
                    );


                return (
                    tradeDate >=
                    range.startDate
                    &&
                    tradeDate <=
                    range.endDate
                );

            }
        );


    updateSummary(
        filteredTrades
    );


    createEquityChart(
        filteredTrades,
        Number(
            selectedAccount.starting_balance ||
            0
        )
    );


    createSessionChart(
        filteredTrades
    );


    createSetupChart(
        filteredTrades
    );


    createWeekdayChart(
        filteredTrades
    );

}


/* =========================================
   SUMMARY
========================================= */

function updateSummary(
    trades
) {

    const totalTrades =
        trades.length;


    const wins =
        trades.filter(
            trade =>
                Number(
                    trade.profit_loss || 0
                ) > 0
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


    /*
       NEW TRADES:
       use actual_rr

       OLD TRADES:
       use r_multiple
    */

    const totalR =
        trades.reduce(
            (
                sum,
                trade
            ) =>
                sum +
                Number(
                    trade.actual_rr ??
                    trade.r_multiple ??
                    0
                ),
            0
        );


    const winRate =
        totalTrades > 0
            ?
            (
                wins.length /
                totalTrades
            ) * 100
            :
            0;


    const averageR =
        totalTrades > 0
            ?
            totalR /
            totalTrades
            :
            0;


    document
        .getElementById(
            "analyticsPnL"
        )
        .textContent =
        signedMoney(
            totalPnL
        );


    document
        .getElementById(
            "analyticsWinRate"
        )
        .textContent =
        winRate
            .toFixed(1) +
        "%";


    document
        .getElementById(
            "analyticsAverageR"
        )
        .textContent =
        averageR
            .toFixed(2) +
        "R";


    document
        .getElementById(
            "analyticsTrades"
        )
        .textContent =
        totalTrades;


    document
        .getElementById(
            "bestSession"
        )
        .textContent =
        getBestCategory(
            trades,
            "session"
        );


    document
        .getElementById(
            "bestSetup"
        )
        .textContent =
        getBestCategory(
            trades,
            "setup"
        );

}


/* =========================================
   BEST CATEGORY
========================================= */

function getBestCategory(
    trades,
    field
) {

    const totals = {};


    trades.forEach(trade => {

        const name =
            trade[field] ||
            "Unknown";


        if (
            totals[name] ===
            undefined
        ) {

            totals[name] =
                0;

        }


        totals[name] +=
            Number(
                trade.profit_loss ||
                0
            );

    });


    const entries =
        Object.entries(
            totals
        );


    if (
        entries.length === 0
    ) {

        return "-";

    }


    entries.sort(
        (
            a,
            b
        ) =>
            b[1] -
            a[1]
    );


    return entries[0][0];

}


/* =========================================
   EQUITY CURVE
========================================= */

function createEquityChart(
    trades,
    startingBalance
) {

    let balance =
        startingBalance;


    /*
       Calculate the balance before the
       first trade in selected period.
    */

    if (
        trades.length > 0
    ) {

        const firstDate =
            parseTradeDate(
                trades[0].trade_date
            );


        allTrades.forEach(
            trade => {

                const tradeDate =
                    parseTradeDate(
                        trade.trade_date
                    );


                if (
                    tradeDate <
                    firstDate
                ) {

                    balance +=
                        Number(
                            trade.profit_loss ||
                            0
                        );

                }

            }
        );

    }


    const labels =
        [
            "Start"
        ];


    const balances =
        [
            balance
        ];


    trades.forEach(
        (
            trade,
            index
        ) => {

            balance +=
                Number(
                    trade.profit_loss ||
                    0
                );


            labels.push(
                trade.trade_date +
                " #" +
                (
                    index +
                    1
                )
            );


            balances.push(
                balance
            );

        }
    );


    if (
        equityChart
    ) {

        equityChart.destroy();

    }


    equityChart =
        new Chart(
            document.getElementById(
                "equityChart"
            ),
            {

                type:
                    "line",

                data: {

                    labels:
                        labels,

                    datasets: [
                        {

                            label:
                                "Account Balance",

                            data:
                                balances,

                            tension:
                                0.25

                        }
                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false

                }

            }
        );

}


/* =========================================
   P&L BY SESSION
========================================= */

function createSessionChart(
    trades
) {

    const sessions = {

        "Asian":
            0,

        "London":
            0,

        "London/NY Overlap":
            0,

        "New York":
            0

    };


    trades.forEach(
        trade => {

            const session =
                trade.session ||
                "Unknown";


            if (
                sessions[
                    session
                ] ===
                undefined
            ) {

                sessions[
                    session
                ] =
                    0;

            }


            sessions[
                session
            ] +=
                Number(
                    trade.profit_loss ||
                    0
                );

        }
    );


    if (
        sessionChart
    ) {

        sessionChart.destroy();

    }


    sessionChart =
        new Chart(
            document.getElementById(
                "sessionChart"
            ),
            {

                type:
                    "bar",

                data: {

                    labels:
                        Object.keys(
                            sessions
                        ),

                    datasets: [
                        {

                            label:
                                "Net P&L ($)",

                            data:
                                Object.values(
                                    sessions
                                )

                        }
                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false

                }

            }
        );

}


/* =========================================
   WIN RATE BY SETUP
========================================= */

function createSetupChart(
    trades
) {

    const setups = {};


    trades.forEach(
        trade => {

            const setup =
                trade.setup ||
                "Unknown";


            if (
                !setups[
                    setup
                ]
            ) {

                setups[
                    setup
                ] = {

                    wins:
                        0,

                    total:
                        0

                };

            }


            setups[
                setup
            ].total++;


            if (
                Number(
                    trade.profit_loss ||
                    0
                ) > 0
            ) {

                setups[
                    setup
                ].wins++;

            }

        }
    );


    const labels =
        Object.keys(
            setups
        );


    const winRates =
        labels.map(
            setup => {

                const item =
                    setups[
                        setup
                    ];


                return (
                    item.wins /
                    item.total
                ) * 100;

            }
        );


    if (
        setupChart
    ) {

        setupChart.destroy();

    }


    setupChart =
        new Chart(
            document.getElementById(
                "setupChart"
            ),
            {

                type:
                    "bar",

                data: {

                    labels:
                        labels,

                    datasets: [
                        {

                            label:
                                "Win Rate %",

                            data:
                                winRates

                        }
                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            max:
                                100

                        }

                    }

                }

            }
        );

}


/* =========================================
   P&L BY WEEKDAY
========================================= */

function createWeekdayChart(
    trades
) {

    const weekdays = {

        Monday:
            0,

        Tuesday:
            0,

        Wednesday:
            0,

        Thursday:
            0,

        Friday:
            0,

        Saturday:
            0,

        Sunday:
            0

    };


    trades.forEach(
        trade => {

            const date =
                parseTradeDate(
                    trade.trade_date
                );


            const day =
                date.toLocaleDateString(
                    "en-US",
                    {
                        weekday:
                            "long"
                    }
                );


            weekdays[
                day
            ] +=
                Number(
                    trade.profit_loss ||
                    0
                );

        }
    );


    if (
        weekdayChart
    ) {

        weekdayChart.destroy();

    }


    weekdayChart =
        new Chart(
            document.getElementById(
                "weekdayChart"
            ),
            {

                type:
                    "bar",

                data: {

                    labels:
                        Object.keys(
                            weekdays
                        ),

                    datasets: [
                        {

                            label:
                                "Net P&L ($)",

                            data:
                                Object.values(
                                    weekdays
                                )

                        }
                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false

                }

            }
        );

}


/* =========================================
   MONEY FORMAT
========================================= */

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
   ACCOUNT CHANGE
========================================= */

analyticsAccount
    .addEventListener(
        "change",
        function() {

            const account =
                analyticsAccounts.find(
                    item =>
                        Number(
                            item.id
                        ) ===
                        Number(
                            analyticsAccount.value
                        )
                );


            if (
                account
            ) {

                loadAnalytics(
                    account
                );

            }

        }
    );


/* =========================================
   PERIOD SELECTOR
========================================= */

periodFilter
    .addEventListener(
        "change",
        function() {

            const custom =
                periodFilter.value ===
                "custom";


            customDateRange.hidden =
                !custom;


            /*
               Daily, Weekly, Monthly
               and Yearly apply immediately.
            */

            if (
                !custom
            ) {

                applyPeriodFilter();

            }

        }
    );


/* =========================================
   CUSTOM DATE APPLY
========================================= */

applyCustomRange
    .addEventListener(
        "click",
        function() {

            applyPeriodFilter();

        }
    );


/* =========================================
   START
========================================= */

loadAnalyticsAccounts();
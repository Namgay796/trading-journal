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

let pairChart;
let equityChart;
let sessionChart;
let setupChart;
let weekdayChart;
Chart.defaults.color = "#ffffff";

Chart.register(
    ChartDataLabels
);

Chart.defaults.color =
    "#ffffff";


/* =========================================
   LOAD ACCOUNTS
========================================= */

async function loadAnalyticsAccounts() {

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

        return;

    }


    analyticsAccounts =
        data || [];


    analyticsAccount.innerHTML =
        "";


    analyticsAccounts.forEach(
        account => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                account.id;


            option.textContent =
                account.name;


            analyticsAccount.appendChild(
                option
            );

        }
    );


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
   LOAD TRADES
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
                    ascending:
                        true
                }
            )
            .order(
                "id",
                {
                    ascending:
                        true
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

function parseTradeDate(
    value
) {

    return new Date(
        value +
        "T00:00:00"
    );

}


/* =========================================
   START OF WEEK
   MONDAY
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
   SUNDAY
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
   FORMAT DISPLAY DATE
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
   APPLY FILTER
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


    createPairChart(
        filteredTrades
    );


    createEquityChart(
        filteredTrades,
        Number(
            selectedAccount
                .starting_balance ||
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
   NORMALIZE SYMBOL
========================================= */

function getSymbol(
    trade
) {

    const symbol =
        String(
            trade.symbol ||
            "Unknown"
        )
        .trim()
        .toUpperCase();


    return symbol ||
        "UNKNOWN";

}


/* =========================================
   GET ALL SYMBOLS
========================================= */

function getSymbols(
    trades
) {

    return [
        ...new Set(
            trades.map(
                trade =>
                    getSymbol(
                        trade
                    )
            )
        )
    ].sort();

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
                    trade.profit_loss ||
                    0
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
       NEW layered trades:
       actual_rr

       OLD trades:
       r_multiple
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


    trades.forEach(
        trade => {

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

        }
    );


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
   TRADED PAIRS PIE CHART
========================================= */

/* =========================================
   TRADED PAIRS PIE CHART
========================================= */

function createPairChart(
    trades
) {

    const canvas =
        document.getElementById(
            "pairChart"
        );


    if (!canvas) {

        console.error(
            "pairChart canvas not found."
        );

        return;

    }


    /* =====================================
       COUNT TRADES BY PAIR
    ===================================== */

    const totals = {};


    trades.forEach(
        trade => {

            const symbol =
                getSymbol(
                    trade
                );


            if (
                !totals[symbol]
            ) {

                totals[symbol] =
                    0;

            }


            totals[symbol]++;

        }
    );


    const labels =
        Object.keys(
            totals
        );


    const values =
        Object.values(
            totals
        );


    const totalTrades =
        values.reduce(
            (
                total,
                value
            ) =>
                total +
                value,
            0
        );


    /* =====================================
       REMOVE OLD CHART
    ===================================== */

    if (
        pairChart
    ) {

        pairChart.destroy();

        pairChart =
            null;

    }


    if (
        totalTrades === 0
    ) {

        return;

    }


    /* =====================================
       PIE COLOURS
    ===================================== */

    const chartColors = [

        "#58a6ff",
        "#3fb950",
        "#d29922",
        "#f85149",
        "#a371f7",
        "#39c5cf",
        "#db61a2",
        "#8b949e",
        "#ff7b72",
        "#56d364"

    ];


    /* =====================================
       CREATE CHART
    ===================================== */

    pairChart =
        new Chart(
            canvas,
            {

                type:
                    "pie",


                data: {

                    labels:
                        labels,


                    datasets: [

                        {

                            label:
                                "Trades",


                            data:
                                values,


                            backgroundColor:
                                labels.map(
                                    (
                                        label,
                                        index
                                    ) =>
                                        chartColors[
                                            index %
                                            chartColors.length
                                        ]
                                ),


                            borderColor:
                                "#161b22",


                            borderWidth:
                                2

                        }

                    ]

                },


                options: {

                    responsive:
                        true,


                    maintainAspectRatio:
                        false,


                    plugins: {


                        /* =================================
                           TEXT DIRECTLY ON PIE
                        ================================= */

                        datalabels: {

                            color:
                                "#ffffff",


                            font: {

                                weight:
                                    "bold",

                                size:
                                    13

                            },


                            textAlign:
                                "center",


                            formatter:
                                function(
                                    value,
                                    context
                                ) {

                                    const percentage =
                                        totalTrades > 0
                                            ?
                                            (
                                                value /
                                                totalTrades
                                            ) *
                                            100
                                            :
                                            0;


                                    const symbol =
                                        context
                                            .chart
                                            .data
                                            .labels[
                                                context.dataIndex
                                            ];


                                    return (
                                        symbol +
                                        "\n" +
                                        percentage
                                            .toFixed(1) +
                                        "%"
                                    );

                                }

                        },


                        /* =================================
                           BOTTOM LEGEND
                        ================================= */

                        legend: {

    display: true,
    position: "bottom",

    labels: {

        color: "#ffffff",

        font: {
            size: 14,
            weight: "bold"
        },

        padding: 20,
        usePointStyle: true,
        pointStyle: "circle",

        generateLabels: function(chart) {

            const data = chart.data;

            return data.labels.map(
                (label, index) => {

                    const count =
                        Number(
                            data.datasets[0].data[index] || 0
                        );

                    const percentage =
                        totalTrades > 0
                            ? (count / totalTrades) * 100
                            : 0;

                    return {

                        text:
                            label +
                            "  " +
                            percentage.toFixed(1) +
                            "%",

                        fillStyle:
                            data.datasets[0]
                                .backgroundColor[index],

                        strokeStyle:
                            data.datasets[0]
                                .backgroundColor[index],

                        /* IMPORTANT */
                        fontColor: "#ffffff",

                        lineWidth: 0,
                        hidden: false,
                        index: index
                    };
                }
            );
        }
    }
},

                        /* =================================
                           HOVER TOOLTIP
                        ================================= */

                        tooltip: {

                            callbacks: {

                                label:
                                    function(
                                        context
                                    ) {

                                        const count =
                                            Number(
                                                context.raw ||
                                                0
                                            );


                                        const percentage =
                                            (
                                                count /
                                                totalTrades
                                            ) *
                                            100;


                                        return (
                                            context.label +
                                            ": " +
                                            count +
                                            (
                                                count === 1
                                                    ?
                                                    " trade"
                                                    :
                                                    " trades"
                                            ) +
                                            " (" +
                                            percentage
                                                .toFixed(
                                                    1
                                                ) +
                                            "%)"
                                        );

                                    }

                            }

                        }

                    }

                }

            }
        );

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
       Calculate balance before
       selected period
    */

    if (
        trades.length > 0
    ) {

        const firstDate =
            parseTradeDate(
                trades[0]
                    .trade_date
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
                getSymbol(
                    trade
                ) +
                " • " +
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
   P&L BY SESSION + PAIR
========================================= */

function createSessionChart(
    trades
) {

    const sessions =
        [
            "Asian",
            "London",
            "London/NY Overlap",
            "New York"
        ];


    /*
       Keep old/other session values
       if present
    */

    trades.forEach(
        trade => {

            const session =
                trade.session ||
                "Unknown";


            if (
                !sessions.includes(
                    session
                )
            ) {

                sessions.push(
                    session
                );

            }

        }
    );


    const symbols =
        getSymbols(
            trades
        );


    const datasets =
        symbols.map(
            symbol => {

                const data =
                    sessions.map(
                        session => {

                            return trades
                                .filter(
                                    trade =>
                                        getSymbol(
                                            trade
                                        ) ===
                                        symbol
                                        &&
                                        (
                                            trade.session ||
                                            "Unknown"
                                        ) ===
                                        session
                                )
                                .reduce(
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

                        }
                    );


                return {

                    label:
                        symbol,

                    data:
                        data

                };

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
                        sessions,


                    datasets:
                        datasets

                },


                options: {

                    responsive:
                        true,


                    maintainAspectRatio:
                        false,


                    interaction: {

                        mode:
                            "index",


                        intersect:
                            false

                    },


                    plugins: {

                        legend: {

                            position:
                                "bottom"

                        }

                    },


                    scales: {

                        x: {

                            stacked:
                                false

                        },


                        y: {

                            stacked:
                                false

                        }

                    }

                }

            }
        );

}


/* =========================================
   WIN RATE BY SETUP + PAIR
========================================= */

function createSetupChart(
    trades
) {

    const setups =
        [
            ...new Set(
                trades.map(
                    trade =>
                        trade.setup ||
                        "Unknown"
                )
            )
        ];


    const symbols =
        getSymbols(
            trades
        );


    const datasets =
        symbols.map(
            symbol => {

                const data =
                    setups.map(
                        setup => {

                            const pairTrades =
                                trades.filter(
                                    trade =>
                                        getSymbol(
                                            trade
                                        ) ===
                                        symbol
                                        &&
                                        (
                                            trade.setup ||
                                            "Unknown"
                                        ) ===
                                        setup
                                );


                            if (
                                pairTrades.length ===
                                0
                            ) {

                                return 0;

                            }


                            const wins =
                                pairTrades.filter(
                                    trade =>
                                        Number(
                                            trade.profit_loss ||
                                            0
                                        ) >
                                        0
                                ).length;


                            return (
                                wins /
                                pairTrades.length
                            ) * 100;

                        }
                    );


                return {

                    label:
                        symbol,

                    data:
                        data

                };

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
                        setups,


                    datasets:
                        datasets

                },


                options: {

                    responsive:
                        true,


                    maintainAspectRatio:
                        false,


                    interaction: {

                        mode:
                            "index",


                        intersect:
                            false

                    },


                    plugins: {

                        legend: {

                            position:
                                "bottom"

                        }

                    },


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
   P&L BY WEEKDAY + PAIR
========================================= */

function createWeekdayChart(
    trades
) {

    const weekdays =
        [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ];


    const symbols =
        getSymbols(
            trades
        );


    const datasets =
        symbols.map(
            symbol => {

                const data =
                    weekdays.map(
                        weekday => {

                            return trades
                                .filter(
                                    trade => {

                                        if (
                                            getSymbol(
                                                trade
                                            ) !==
                                            symbol
                                        ) {

                                            return false;

                                        }


                                        const date =
                                            parseTradeDate(
                                                trade.trade_date
                                            );


                                        const day =
                                            date
                                                .toLocaleDateString(
                                                    "en-US",
                                                    {
                                                        weekday:
                                                            "long"
                                                    }
                                                );


                                        return (
                                            day ===
                                            weekday
                                        );

                                    }
                                )
                                .reduce(
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

                        }
                    );


                return {

                    label:
                        symbol,

                    data:
                        data

                };

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
                        weekdays,


                    datasets:
                        datasets

                },


                options: {

                    responsive:
                        true,


                    maintainAspectRatio:
                        false,


                    interaction: {

                        mode:
                            "index",


                        intersect:
                            false

                    },


                    plugins: {

                        legend: {

                            position:
                                "bottom"

                        }

                    }

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

const analyticsAccount =
    document.getElementById("analyticsAccount");


let analyticsAccounts = [];

let equityChart;
let sessionChart;
let setupChart;
let weekdayChart;



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


    analyticsAccounts = data;

    analyticsAccount.innerHTML = "";


    data.forEach(account => {

        const option =
            document.createElement("option");

        option.value =
            account.id;

        option.textContent =
            account.name;

        analyticsAccount.appendChild(option);

    });


    if (data.length > 0) {

        loadAnalytics(data[0]);

    }

}



async function loadAnalytics(account) {

    const { data: trades, error } =
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


    updateSummary(trades);

    createEquityChart(
        trades,
        Number(account.starting_balance)
    );

    createSessionChart(trades);

    createSetupChart(trades);

    createWeekdayChart(trades);

}



function updateSummary(trades) {

    const totalTrades =
        trades.length;


    const wins =
        trades.filter(
            trade =>
                trade.result === "Win"
        );


    const totalPnL =
        trades.reduce(
            (sum, trade) =>
                sum +
                Number(
                    trade.profit_loss || 0
                ),
            0
        );


    const totalR =
        trades.reduce(
            (sum, trade) =>
                sum +
                Number(
                    trade.r_multiple || 0
                ),
            0
        );


    const winRate =
        totalTrades
            ?
            (
                wins.length /
                totalTrades
            ) * 100
            :
            0;


    const averageR =
        totalTrades
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
        signedMoney(totalPnL);


    document
        .getElementById(
            "analyticsWinRate"
        )
        .textContent =
        winRate.toFixed(1) + "%";


    document
        .getElementById(
            "analyticsAverageR"
        )
        .textContent =
        averageR.toFixed(2) + "R";


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



function getBestCategory(
    trades,
    field
) {

    const totals = {};


    trades.forEach(trade => {

        const name =
            trade[field] ||
            "Unknown";


        if (!totals[name]) {

            totals[name] = 0;

        }


        totals[name] +=
            Number(
                trade.profit_loss || 0
            );

    });


    const entries =
        Object.entries(totals);


    if (entries.length === 0) {

        return "-";

    }


    entries.sort(
        (a, b) =>
            b[1] - a[1]
    );


    return entries[0][0];

}



function createEquityChart(
    trades,
    startingBalance
) {

    let balance =
        startingBalance;


    const labels = [
        "Start"
    ];


    const balances = [
        balance
    ];


    trades.forEach(
        (trade, index) => {

            balance +=
                Number(
                    trade.profit_loss || 0
                );


            labels.push(
                trade.trade_date +
                " #" +
                (index + 1)
            );


            balances.push(
                balance
            );

        }
    );


    if (equityChart) {

        equityChart.destroy();

    }


    equityChart =
        new Chart(
            document.getElementById(
                "equityChart"
            ),
            {

                type: "line",

                data: {

                    labels: labels,

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



function createSessionChart(
    trades
) {

    const sessions = {
        "Asian": 0,
        "London": 0,
        "New York": 0
    };


    trades.forEach(trade => {

        if (
            sessions[
                trade.session
            ] !== undefined
        ) {

            sessions[
                trade.session
            ] +=
                Number(
                    trade.profit_loss || 0
                );

        }

    });


    if (sessionChart) {

        sessionChart.destroy();

    }


    sessionChart =
        new Chart(
            document.getElementById(
                "sessionChart"
            ),
            {

                type: "bar",

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



function createSetupChart(
    trades
) {

    const setups = {};


    trades.forEach(trade => {

        const setup =
            trade.setup ||
            "Unknown";


        if (!setups[setup]) {

            setups[setup] = {
                wins: 0,
                total: 0
            };

        }


        setups[setup].total++;


        if (
            trade.result ===
            "Win"
        ) {

            setups[setup].wins++;

        }

    });


    const labels =
        Object.keys(setups);


    const winRates =
        labels.map(setup => {

            const item =
                setups[setup];


            return (
                item.wins /
                item.total
            ) * 100;

        });


    if (setupChart) {

        setupChart.destroy();

    }


    setupChart =
        new Chart(
            document.getElementById(
                "setupChart"
            ),
            {

                type: "bar",

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



function createWeekdayChart(
    trades
) {

    const weekdays = {

        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        Sunday: 0

    };


    trades.forEach(trade => {

        const date =
            new Date(
                trade.trade_date +
                "T00:00:00"
            );


        const day =
            date.toLocaleDateString(
                "en-US",
                {
                    weekday:
                        "long"
                }
            );


        weekdays[day] +=
            Number(
                trade.profit_loss || 0
            );

    });


    if (weekdayChart) {

        weekdayChart.destroy();

    }


    weekdayChart =
        new Chart(
            document.getElementById(
                "weekdayChart"
            ),
            {

                type: "bar",

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



function signedMoney(value) {

    value =
        Number(value);


    if (value > 0) {

        return "+$" +
            value.toFixed(2);

    }


    if (value < 0) {

        return "-$" +
            Math.abs(value)
                .toFixed(2);

    }


    return "$0.00";

}



analyticsAccount
    .addEventListener(
        "change",
        function() {

            const account =
                analyticsAccounts.find(
                    item =>
                        Number(item.id) ===
                        Number(
                            analyticsAccount.value
                        )
                );


            if (account) {

                loadAnalytics(account);

            }

        }
    );



loadAnalyticsAccounts();
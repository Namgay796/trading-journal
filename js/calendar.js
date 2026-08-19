const calendarAccount =
    document.getElementById(
        "calendarAccount"
    );

const calendarGrid =
    document.getElementById(
        "calendarGrid"
    );

const calendarTitle =
    document.getElementById(
        "calendarTitle"
    );

const dayDetails =
    document.getElementById(
        "dayDetails"
    );


let calendarAccounts = [];

let calendarTrades = [];

let currentDate =
    new Date();



async function loadCalendarAccounts() {

    const { data, error } =
        await db
            .from("accounts")
            .select("*")
            .order("id");


    if (error) {

        console.error(error);
        return;

    }


    calendarAccounts =
        data;


    calendarAccount.innerHTML =
        "";


    data.forEach(account => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            account.id;


        option.textContent =
            account.name;


        calendarAccount
            .appendChild(
                option
            );

    });


    if (data.length > 0) {

        loadCalendarTrades(
            data[0].id
        );

    }

}



async function loadCalendarTrades(
    accountId
) {

    const { data, error } =
        await db
            .from("trades")
            .select("*")
            .eq(
                "account_id",
                accountId
            );


    if (error) {

        console.error(error);
        return;

    }


    calendarTrades =
        data;


    renderCalendar();

}



function renderCalendar() {

    calendarGrid.innerHTML =
        "";


    const year =
        currentDate.getFullYear();


    const month =
        currentDate.getMonth();


    const monthName =
        currentDate.toLocaleDateString(
            "en-AU",
            {
                month: "long",
                year: "numeric"
            }
        );


    calendarTitle.textContent =
        monthName;


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );


    let startDay =
        firstDay.getDay();


    if (startDay === 0) {

        startDay = 7;

    }


    for (
        let i = 1;
        i < startDay;
        i++
    ) {

        const blank =
            document.createElement(
                "div"
            );


        blank.className =
            "calendar-day empty-day";


        calendarGrid
            .appendChild(
                blank
            );

    }



    for (
        let day = 1;
        day <= lastDay.getDate();
        day++
    ) {

        const dateString =
            `${year}-${String(
                month + 1
            ).padStart(2, "0")}-${String(
                day
            ).padStart(2, "0")}`;


        const dayTrades =
            calendarTrades.filter(
                trade =>
                    trade.trade_date ===
                    dateString
            );


        const pnl =
            dayTrades.reduce(
                (sum, trade) =>
                    sum +
                    Number(
                        trade.profit_loss || 0
                    ),
                0
            );


        const totalR =
            dayTrades.reduce(
                (sum, trade) =>
                    sum +
                    Number(
                        trade.r_multiple || 0
                    ),
                0
            );


        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "calendar-day";


        if (
            dayTrades.length > 0
        ) {

            if (pnl > 0) {

                cell.classList.add(
                    "calendar-profit"
                );

            }

            else if (
                pnl < 0
            ) {

                cell.classList.add(
                    "calendar-loss"
                );

            }

            else {

                cell.classList.add(
                    "calendar-be"
                );

            }

        }


        cell.innerHTML = `

            <div class="calendar-date">
                ${day}
            </div>

            ${
                dayTrades.length
                    ?
                    `
                    <strong>
                        ${signedMoney(pnl)}
                    </strong>

                    <small>
                        ${totalR.toFixed(2)}R
                    </small>

                    <small>
                        ${dayTrades.length}
                        trade${dayTrades.length > 1 ? "s" : ""}
                    </small>
                    `
                    :
                    ""
            }

        `;


        if (
            dayTrades.length > 0
        ) {

            cell.addEventListener(
                "click",
                () =>
                    showDayDetails(
                        dateString,
                        dayTrades
                    )
            );

        }


        calendarGrid
            .appendChild(
                cell
            );

    }

}



function showDayDetails(
    date,
    trades
) {

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


    dayDetails.innerHTML = `

        <div class="section-header">

            <h2>
                ${date}
            </h2>

            <strong>
                ${signedMoney(
                    totalPnL
                )}
                /
                ${totalR.toFixed(2)}R
            </strong>

        </div>


        ${
            trades.map(
                trade => `

                    <div class="trade-card">

                        <div>

                            <strong>
                                ${trade.symbol}
                                ${trade.direction}
                            </strong>

                            <small>
                                ${trade.session || ""}
                                •
                                ${trade.setup || ""}
                            </small>

                        </div>


                        <div class="${
                            Number(
                                trade.profit_loss || 0
                            ) >= 0
                                ?
                                "profit"
                                :
                                "loss"
                        }">

                            <strong>
                                ${signedMoney(
                                    trade.profit_loss
                                )}
                            </strong>

                            <small>
                                ${Number(
                                    trade.r_multiple || 0
                                ).toFixed(2)}R
                            </small>

                        </div>

                    </div>

                `
            ).join("")
        }

    `;

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



document
    .getElementById(
        "prevMonth"
    )
    .addEventListener(
        "click",
        () => {

            currentDate =
                new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1,
                    1
                );

            renderCalendar();

        }
    );


document
    .getElementById(
        "nextMonth"
    )
    .addEventListener(
        "click",
        () => {

            currentDate =
                new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    1
                );

            renderCalendar();

        }
    );


calendarAccount
    .addEventListener(
        "change",
        () => {

            loadCalendarTrades(
                Number(
                    calendarAccount.value
                )
            );

        }
    );



loadCalendarAccounts();
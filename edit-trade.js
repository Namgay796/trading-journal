const params =
    new URLSearchParams(
        window.location.search
    );


const tradeId =
    params.get("id");


const message =
    document.getElementById(
        "message"
    );



async function loadTrade() {

    if (!tradeId) {

        message.textContent =
            "Trade ID missing.";

        return;

    }


    const { data, error } =
        await db
            .from("trades")
            .select("*")
            .eq(
                "id",
                tradeId
            )
            .single();


    if (error) {

        message.textContent =
            error.message;

        console.error(error);

        return;

    }


    document
        .getElementById(
            "tradeDate"
        )
        .value =
        data.trade_date;


    document
        .getElementById(
            "symbol"
        )
        .value =
        data.symbol || "";


    document
        .getElementById(
            "direction"
        )
        .value =
        data.direction || "BUY";


    document
        .getElementById(
            "entry"
        )
        .value =
        data.entry_price || "";


    document
        .getElementById(
            "stopLoss"
        )
        .value =
        data.stop_loss || "";


    document
        .getElementById(
            "takeProfit"
        )
        .value =
        data.take_profit || "";


    document
        .getElementById(
            "exitPrice"
        )
        .value =
        data.exit_price || "";


    document
        .getElementById(
            "lotSize"
        )
        .value =
        data.lot_size || "";


    document
        .getElementById(
            "riskPercent"
        )
        .value =
        data.risk_percent || "";


    document
        .getElementById(
            "profitLoss"
        )
        .value =
        data.profit_loss || 0;


    document
        .getElementById(
            "session"
        )
        .value =
        data.session || "Asian";


    document
        .getElementById(
            "setup"
        )
        .value =
        data.setup ||
        "Liquidity Sweep";


    document
        .getElementById(
            "result"
        )
        .value =
        data.result ||
        "Win";


    document
        .getElementById(
            "mistakes"
        )
        .value =
        data.mistakes || "";


    document
        .getElementById(
            "notes"
        )
        .value =
        data.notes || "";


    showScreenshots(data);

}



function showScreenshots(
    trade
) {

    const box =
        document.getElementById(
            "screenshots"
        );


    let html = "";


    if (
        trade.before_screenshot
    ) {

        html += `

            <div class="screenshot-box">

                <h3>
                    Before Trade
                </h3>

                <img
                    src="${trade.before_screenshot}"
                    alt="Before Trade"
                >

            </div>

        `;

    }


    if (
        trade.after_screenshot
    ) {

        html += `

            <div class="screenshot-box">

                <h3>
                    After Trade
                </h3>

                <img
                    src="${trade.after_screenshot}"
                    alt="After Trade"
                >

            </div>

        `;

    }


    box.innerHTML =
        html;

}



document
    .getElementById(
        "editTradeForm"
    )
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            message.textContent =
                "Updating...";


            const updates = {

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
                        .value,

                direction:
                    document
                        .getElementById(
                            "direction"
                        )
                        .value,

                entry_price:
                    Number(
                        document
                            .getElementById(
                                "entry"
                            )
                            .value
                    ),

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
                    )
                    || null,

                exit_price:
                    Number(
                        document
                            .getElementById(
                                "exitPrice"
                            )
                            .value
                    )
                    || null,

                lot_size:
                    Number(
                        document
                            .getElementById(
                                "lotSize"
                            )
                            .value
                    )
                    || null,

                risk_percent:
                    Number(
                        document
                            .getElementById(
                                "riskPercent"
                            )
                            .value
                    ),

                profit_loss:
                    Number(
                        document
                            .getElementById(
                                "profitLoss"
                            )
                            .value
                    ),

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

                result:
                    document
                        .getElementById(
                            "result"
                        )
                        .value,

                mistakes:
                    document
                        .getElementById(
                            "mistakes"
                        )
                        .value,

                notes:
                    document
                        .getElementById(
                            "notes"
                        )
                        .value

            };


            const { error } =
                await db
                    .from(
                        "trades"
                    )
                    .update(
                        updates
                    )
                    .eq(
                        "id",
                        tradeId
                    );


            if (error) {

                console.error(error);

                message.textContent =
                    "ERROR: " +
                    error.message;

                return;

            }


            message.textContent =
                "Trade updated successfully!";

        }
    );



loadTrade();
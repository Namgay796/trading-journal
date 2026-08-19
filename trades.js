let allTrades = [];



async function loadTrades() {

    const { data, error } =
        await db
            .from("trades")
            .select("*")
            .order(
                "trade_date",
                {
                    ascending: false
                }
            )
            .order(
                "id",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        return;

    }


    allTrades = data;


    displayTrades(
        allTrades
    );

}



function displayTrades(trades) {

    const table =
        document.getElementById(
            "tradeTable"
        );


    if (trades.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="8">

                    No trades found.

                </td>

            </tr>

        `;

        return;

    }



    table.innerHTML =
        trades.map(trade => {


            const pnl =
                Number(
                    trade.profit_loss || 0
                );


            const pnlClass =
                pnl >= 0
                    ?
                    "profit"
                    :
                    "loss";


            return `

                <tr>

                    <td>
                        ${trade.trade_date}
                    </td>

                    <td>
                        ${trade.symbol}
                    </td>

                    <td>
                        ${trade.direction}
                    </td>

                    <td>
                        ${trade.session || ""}
                    </td>

                    <td>
                        ${trade.setup || ""}
                    </td>

                    <td>
                        ${trade.result || ""}
                    </td>

                    <td class="${pnlClass}">
                        ${signedMoney(pnl)}
                    </td>

                    <td>
                        ${Number(
                            trade.r_multiple || 0
                        ).toFixed(2)}R
                    </td>
                    <td>

    <button
        class="small-button"
        onclick="editTrade(${trade.id})"
    >
        Edit
    </button>

    <button
        class="small-button danger-button"
        onclick="deleteTrade(${trade.id})"
    >
        Delete
    </button>

</td>

                </tr>

            `;

        }).join("");

}



function applyFilters() {

    const session =
        document
            .getElementById(
                "sessionFilter"
            )
            .value;


    const result =
        document
            .getElementById(
                "resultFilter"
            )
            .value;


    const symbol =
        document
            .getElementById(
                "symbolFilter"
            )
            .value
            .toUpperCase();


    const filtered =
        allTrades.filter(
            trade => {


                const sessionMatch =
                    !session ||
                    trade.session ===
                    session;


                const resultMatch =
                    !result ||
                    trade.result ===
                    result;


                const symbolMatch =
                    !symbol ||
                    trade.symbol
                        .toUpperCase()
                        .includes(
                            symbol
                        );


                return (
                    sessionMatch &&
                    resultMatch &&
                    symbolMatch
                );

            }
        );


    displayTrades(
        filtered
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



document
    .getElementById(
        "sessionFilter"
    )
    .addEventListener(
        "change",
        applyFilters
    );


document
    .getElementById(
        "resultFilter"
    )
    .addEventListener(
        "change",
        applyFilters
    );


document
    .getElementById(
        "symbolFilter"
    )
    .addEventListener(
        "input",
        applyFilters
    );

async function deleteTrade(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this trade?"
        );


    if (!confirmed) {
        return;
    }


    const { error } =
        await db
            .from("trades")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        alert(
            "Delete failed: " +
            error.message
        );

        console.error(error);

        return;

    }


    alert(
        "Trade deleted."
    );


    loadTrades();
}
function editTrade(id) {

    window.location.href =
        "edit-trade.html?id=" + id;

}


loadTrades();
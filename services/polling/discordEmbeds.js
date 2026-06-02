const { ALERT_ROLE_ID } = require("../../config");

function createTradeEmbed(trade) {
  const {
    title,
    price,
    size,
    usdcSize,
    timestamp,
    transactionHash,
    outcome,
    eventSlug,
    slug,
    side,
    orderType,
    fillType,
    isMarketOrder,
    marketOrder,
  } = trade;

  const tradeSide = String(side).toUpperCase();
  const decimalOdds = price != null && price > 0 ? (1 / price).toFixed(2) : null;
  const formattedPrice = decimalOdds != null ? `${decimalOdds}` : "N/A";

  let detectedOrderType = "UNKNOWN";
  if (orderType) {
    detectedOrderType = String(orderType).toUpperCase();
  } else if (fillType) {
    detectedOrderType = String(fillType).toUpperCase();
  } else if (isMarketOrder !== undefined) {
    detectedOrderType = isMarketOrder ? "MARKET" : "LIMIT";
  } else if (marketOrder !== undefined) {
    detectedOrderType = marketOrder ? "MARKET" : "LIMIT";
  }

  const orderTypeDisplay =
    detectedOrderType !== "UNKNOWN" ? ` (${detectedOrderType})` : "";
  const embedColor =
    tradeSide === "BUY" ? 0x00aa00 : tradeSide === "SELL" ? 0xaa0000 : 0x808080;

  const embed = {
    title: `New Polymarket ${tradeSide}${orderTypeDisplay}`,
    color: embedColor,
    fields: [
      {
        name: "Market",
        value: title ?? slug ?? "Unknown market",
        inline: false,
      },
      {
        name: "Outcome",
        value: `${outcome ?? "Unknown"} @ ${formattedPrice}`,
        inline: true,
      },
      {
        name: "Size",
        value: `${size ?? "?"} shares (~${usdcSize ?? "?"} USDC)`,
        inline: true,
      },
    ],
    timestamp: timestamp ? new Date(timestamp * 1000).toISOString() : undefined,
    footer: {
      text: "Polymarket Trade",
    },
  };

  if (transactionHash) {
    embed.fields.push({
      name: "Transaction",
      value: `[View on PolygonScan](https://polygonscan.com/tx/${transactionHash})`,
      inline: false,
    });
  }

  if (eventSlug) {
    embed.fields.push({
      name: "Market Page",
      value: `[View Market](https://polymarket.com/market/${eventSlug})`,
      inline: false,
    });
  }

  return embed;
}

function createAutoTradeSkippedEmbed(title, description, fields = []) {
  return {
    title,
    description,
    color: 0xffaa00,
    fields,
    timestamp: new Date().toISOString(),
  };
}

function createTradeSizeCappedEmbed(data) {
  return {
    title: "⚠️ Trade Size Capped",
    description:
      "Trade size reduced to avoid exceeding max bet amount per position.",
    color: 0xffaa00,
    fields: [
      {
        name: "Current Position",
        value: `$${data.currentPositionValue.toFixed(2)}`,
        inline: true,
      },
      {
        name: "Max Bet Amount",
        value: `$${data.maxBetAmount.toFixed(2)}`,
        inline: true,
      },
      {
        name: "Original Trade",
        value: `$${data.originalOrderValue.toFixed(
          2
        )} (${data.originalOrderSize.toFixed(2)} shares)`,
        inline: false,
      },
      {
        name: "Capped Trade",
        value: `$${data.orderValue.toFixed(2)} (${data.orderSize.toFixed(
          2
        )} shares)`,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
  };
}

function createOrderValueAdjustedEmbed(data) {
  return {
    title: "⚠️ Order Value Adjusted",
    description: data.description,
    color: 0xffaa00,
    fields: data.fields || [],
    timestamp: new Date().toISOString(),
  };
}

function createBuyOrderEmbed(data) {
  const embed = {
    title: data.isPaperTrading
      ? "✅ Paper Trade: BUY"
      : data.isMarketOrder
      ? "✅ Auto-placed MARKET BUY Order"
      : "✅ Auto-placed LIMIT BUY Order",
    description:
      data.description ||
      `$${data.orderValue.toFixed(2)} (${data.orderSize.toFixed(2)} shares) @ ${
        data.orderPrice
      }`,
    color: 0x00aa00,
    fields: [
      {
        name: "Market",
        value: data.market || "Unknown market",
        inline: false,
      },
      {
        name: "Outcome",
        value: data.outcome ?? "Unknown",
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
  };

  if (data.isPaperTrading) {
    embed.fields.push({
      name: "Mode",
      value: "📝 Paper Trading",
      inline: true,
    });
    if (data.paperBalance !== undefined) {
      embed.fields.push({
        name: "Paper Balance",
        value: `$${data.paperBalance.toFixed(2)}`,
        inline: true,
      });
    }
  } else {
    embed.fields.push({
      name: "Status",
      value: "Success",
      inline: true,
    });
  }

  if (data.entryPrice !== undefined && data.entryPrice > 0) {
    embed.fields.push({
      name: "Entry Price",
      value: `$${data.entryPrice.toFixed(4)} (${(data.entryPrice * 100).toFixed(
        2
      )}¢)`,
      inline: true,
    });
  }

  if (data.positionInfo) {
    if (data.positionInfo.positionsAfter !== undefined) {
      embed.fields.push({
        name: "Positions After Trade",
        value: `${data.positionInfo.positionsAfter}/${data.positionInfo.maxPositions}`,
        inline: true,
      });
    }
    if (data.positionInfo.exposureAfter !== undefined) {
      embed.fields.push({
        name: "Total Exposure",
        value: `$${data.positionInfo.exposureAfter.toFixed(2)}${
          data.positionInfo.maxExposure > 0
            ? ` / $${data.positionInfo.maxExposure.toFixed(2)}`
            : ""
        }`,
        inline: true,
      });
    }
  }

  return embed;
}

function createSellOrderEmbed(data) {
  const embed = {
    title: data.isPaperTrading
      ? "✅ Paper Trade: MARKET SELL"
      : data.isMarketOrder
      ? "✅ Auto-placed MARKET SELL Order"
      : "✅ Auto-placed LIMIT SELL Order",
    description:
      data.description ||
      `$${data.orderValue.toFixed(2)} (${data.orderSize.toFixed(2)} shares) @ ${
        data.isMarketOrder ? "market price" : data.orderPrice
      }`,
    color: 0xaa0000,
    fields: [
      {
        name: "Market",
        value: data.market || "Unknown market",
        inline: false,
      },
      {
        name: "Outcome",
        value: data.outcome ?? "Unknown",
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
  };

  if (data.isPaperTrading) {
    embed.fields.push({
      name: "Mode",
      value: "📝 Paper Trading",
      inline: true,
    });
    if (data.pnl !== undefined) {
      embed.fields.push({
        name: "PnL",
        value: `$${data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(2)}`,
        inline: true,
      });
    }
    if (data.paperBalance !== undefined) {
      embed.fields.push({
        name: "Paper Balance",
        value: `$${data.paperBalance.toFixed(2)}`,
        inline: true,
      });
    }
  } else {
    embed.fields.push({
      name: "Status",
      value: "Success",
      inline: true,
    });
  }

  if (data.positionInfo) {
    if (data.positionInfo.positionsAfter !== undefined) {
      embed.fields.push({
        name: "Positions After Trade",
        value: `${data.positionInfo.positionsAfter}/${data.positionInfo.maxPositions}`,
        inline: true,
      });
    }
    if (data.positionInfo.exposureAfter !== undefined) {
      embed.fields.push({
        name: "Total Exposure",
        value: `$${data.positionInfo.exposureAfter.toFixed(2)}${
          data.positionInfo.maxExposure > 0
            ? ` / $${data.positionInfo.maxExposure.toFixed(2)}`
            : ""
        }`,
        inline: true,
      });
    }
  }

  return embed;
}

function createErrorEmbed(title, description, fields = []) {
  return {
    title,
    description,
    color: 0xaa0000,
    fields,
    timestamp: new Date().toISOString(),
  };
}

function getMention() {
  return ALERT_ROLE_ID ? `<@&${ALERT_ROLE_ID}>` : "";
}

module.exports = {
  createTradeEmbed,
  createAutoTradeSkippedEmbed,
  createTradeSizeCappedEmbed,
  createOrderValueAdjustedEmbed,
  createBuyOrderEmbed,
  createSellOrderEmbed,
  createErrorEmbed,
  getMention,
};

namespace QuantStat.Core.Markets.Models;

public sealed record MarketCandle
{
    public required DateTimeOffset Date { get; init; }

    public required double Open { get; init; }

    public required double High { get; init; }

    public required double Low { get; init; }

    public required double Close { get; init; }

    public required double Volume { get; init; }

    public double? Vwap { get; init; }

    public long? TradeCount { get; init; }
}
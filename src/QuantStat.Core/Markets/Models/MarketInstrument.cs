namespace QuantStat.Core.Markets.Models;

public sealed record MarketInstrument
{
    public required string Symbol { get; init; }

    public required string BaseAsset { get; init; }

    public required string QuoteAsset { get; init; }

    public required string DisplayName { get; init; }

    public required string Provider { get; init; }
}
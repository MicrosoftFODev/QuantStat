namespace QuantStat.Core.Markets.Models;

public sealed record MarketMetadata
{
    public required IReadOnlyList<MarketInstrument> Markets { get; init; }

    public required IReadOnlyList<MarketInterval> Intervals { get; init; }

    public required IReadOnlyList<MarketPeriod> Periods { get; init; }

    public required IReadOnlyList<string> QuoteCurrencies { get; init; }
}
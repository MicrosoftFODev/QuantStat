using QuantStat.Core.Markets.Models;

namespace QuantStat.Core.Abstractions;

public interface IMarketDataProvider
{
    string Name { get; }

    Task<MarketMetadata> GetMetadataAsync(
        CancellationToken cancellationToken = default
    );

    Task<IReadOnlyList<MarketCandle>> GetCandlesAsync(
        string symbol,
        int intervalMinutes,
        bool includeIncompleteCandle = false,
        CancellationToken cancellationToken = default
    );
}
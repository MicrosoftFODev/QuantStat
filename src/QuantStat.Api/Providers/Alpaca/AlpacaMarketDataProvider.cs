using System.Collections.Concurrent;
using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using QuantStat.Core.Abstractions;
using QuantStat.Core.Markets.Models;

namespace QuantStat.Api.Providers.Alpaca;

public sealed class AlpacaMarketDataProvider :
    IMarketDataProvider
{
    private const int MaximumPages =
        25;

    private static readonly
        ConcurrentDictionary<string, SemaphoreSlim>
        CacheLocks =
            new(
                StringComparer.Ordinal);

    private readonly HttpClient _httpClient;

    private readonly IMemoryCache _cache;

    public AlpacaMarketDataProvider(
        HttpClient httpClient,
        IMemoryCache cache)
    {
        _httpClient =
            httpClient;

        _cache =
            cache;
    }

    public string Name =>
        "Alpaca";


    public Task<MarketMetadata> GetMetadataAsync(
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<MarketInstrument> markets =
        [
            CreateStock(
                "AAPL",
                "Apple Inc."),

            CreateStock(
                "MSFT",
                "Microsoft Corporation"),

            CreateStock(
                "NVDA",
                "NVIDIA Corporation"),

            CreateStock(
                "AMZN",
                "Amazon.com Inc."),

            CreateStock(
                "GOOGL",
                "Alphabet Inc."),

            CreateStock(
                "META",
                "Meta Platforms Inc."),

            CreateStock(
                "TSLA",
                "Tesla Inc."),

            CreateCrypto(
                "BTC/USD"),

            CreateCrypto(
                "ETH/USD"),

            CreateCrypto(
                "SOL/USD"),

            CreateCrypto(
                "AVAX/USD"),

            CreateCrypto(
                "LINK/USD")
        ];

        MarketMetadata metadata =
            new()
            {
                Markets =
                    markets,

                Intervals =
                    CreateIntervals(),

                Periods =
                    CreatePeriods(),

                QuoteCurrencies =
                [
                    "USD"
                ]
            };

        return Task.FromResult(
            metadata);
    }


    public async Task<IReadOnlyList<MarketCandle>>
        GetCandlesAsync(
            string symbol,
            int intervalMinutes,
            bool includeIncompleteCandle = false,
            CancellationToken cancellationToken = default)
    {
        string normalizedSymbol =
            NormalizeSymbol(
                symbol);

        string cacheKey =
            string.Create(
                CultureInfo.InvariantCulture,
                $"alpaca:candles:{normalizedSymbol}:{intervalMinutes}:{includeIncompleteCandle}");

        if (
            _cache.TryGetValue(
                cacheKey,
                out IReadOnlyList<MarketCandle>? cachedCandles) &&
            cachedCandles is not null)
        {
            return cachedCandles;
        }

        SemaphoreSlim cacheLock =
            CacheLocks.GetOrAdd(
                cacheKey,
                _ =>
                    new SemaphoreSlim(
                        1,
                        1));

        await cacheLock.WaitAsync(
            cancellationToken);

        try
        {
            if (
                _cache.TryGetValue(
                    cacheKey,
                    out cachedCandles) &&
                cachedCandles is not null)
            {
                return cachedCandles;
            }

            IReadOnlyList<MarketCandle> candles =
                await LoadCandlesAsync(
                    normalizedSymbol,
                    intervalMinutes,
                    includeIncompleteCandle,
                    cancellationToken);

            TimeSpan cacheDuration =
                CacheDuration(
                    intervalMinutes);

            _cache.Set(
                cacheKey,
                candles,
                new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow =
                        cacheDuration,

                    Size =
                        Math.Max(
                            1,
                            candles.Count)
                });

            return candles;
        }
        finally
        {
            cacheLock.Release();
        }
    }


    private async Task<IReadOnlyList<MarketCandle>>
        LoadCandlesAsync(
            string normalizedSymbol,
            int intervalMinutes,
            bool includeIncompleteCandle,
            CancellationToken cancellationToken)
    {
        string timeframe =
            ToAlpacaTimeframe(
                intervalMinutes);

        DateTimeOffset end =
            DateTimeOffset.UtcNow;

        DateTimeOffset start =
            CalculateStart(
                end,
                intervalMinutes);

        IReadOnlyList<MarketCandle> candles =
            IsCryptoSymbol(
                normalizedSymbol)
                ? await GetCryptoCandlesAsync(
                    normalizedSymbol,
                    timeframe,
                    start,
                    end,
                    cancellationToken)
                : await GetStockCandlesAsync(
                    normalizedSymbol,
                    timeframe,
                    start,
                    end,
                    cancellationToken);

        if (includeIncompleteCandle)
        {
            return candles;
        }

        TimeSpan interval =
            TimeSpan.FromMinutes(
                intervalMinutes);

        return candles
            .Where(
                candle =>
                    candle.Date.Add(
                        interval) <=
                    end)
            .OrderBy(
                candle =>
                    candle.Date)
            .ToArray();
    }


    private static TimeSpan CacheDuration(
        int intervalMinutes)
    {
        return intervalMinutes switch
        {
            <= 5 =>
                TimeSpan.FromSeconds(30),

            <= 60 =>
                TimeSpan.FromMinutes(1),

            <= 240 =>
                TimeSpan.FromMinutes(2),

            _ =>
                TimeSpan.FromMinutes(5)
        };
    }

    private async Task<IReadOnlyList<MarketCandle>>
        GetStockCandlesAsync(
            string symbol,
            string timeframe,
            DateTimeOffset start,
            DateTimeOffset end,
            CancellationToken cancellationToken)
    {
        var candles =
            new List<MarketCandle>();

        string? pageToken =
            null;

        for (
            int page = 0;
            page < MaximumPages;
            page++)
        {
            string requestUri =
                "v2/stocks/" +
                Uri.EscapeDataString(
                    symbol) +
                "/bars" +
                "?timeframe=" +
                Uri.EscapeDataString(
                    timeframe) +
                "&start=" +
                Uri.EscapeDataString(
                    start.ToString(
                        "O",
                        CultureInfo.InvariantCulture)) +
                "&end=" +
                Uri.EscapeDataString(
                    end.ToString(
                        "O",
                        CultureInfo.InvariantCulture)) +
                "&limit=10000" +
                "&adjustment=all" +
                "&feed=iex" +
                "&sort=asc";

            if (
                !string.IsNullOrWhiteSpace(
                    pageToken))
            {
                requestUri +=
                    "&page_token=" +
                    Uri.EscapeDataString(
                        pageToken);
            }

            using JsonDocument document =
                await GetDocumentAsync(
                    requestUri,
                    cancellationToken);

            if (
                document.RootElement.TryGetProperty(
                    "bars",
                    out JsonElement bars) &&
                bars.ValueKind ==
                    JsonValueKind.Array)
            {
                foreach (
                    JsonElement bar
                    in bars.EnumerateArray())
                {
                    candles.Add(
                        ParseCandle(
                            bar));
                }
            }

            pageToken =
                GetNextPageToken(
                    document.RootElement);

            if (
                string.IsNullOrWhiteSpace(
                    pageToken))
            {
                break;
            }
        }

        return RemoveDuplicateCandles(
            candles);
    }


    private async Task<IReadOnlyList<MarketCandle>>
        GetCryptoCandlesAsync(
            string symbol,
            string timeframe,
            DateTimeOffset start,
            DateTimeOffset end,
            CancellationToken cancellationToken)
    {
        var candles =
            new List<MarketCandle>();

        string? pageToken =
            null;

        for (
            int page = 0;
            page < MaximumPages;
            page++)
        {
            string requestUri =
                "v1beta3/crypto/us/bars" +
                "?symbols=" +
                Uri.EscapeDataString(
                    symbol) +
                "&timeframe=" +
                Uri.EscapeDataString(
                    timeframe) +
                "&start=" +
                Uri.EscapeDataString(
                    start.ToString(
                        "O",
                        CultureInfo.InvariantCulture)) +
                "&end=" +
                Uri.EscapeDataString(
                    end.ToString(
                        "O",
                        CultureInfo.InvariantCulture)) +
                "&limit=10000" +
                "&sort=asc";

            if (
                !string.IsNullOrWhiteSpace(
                    pageToken))
            {
                requestUri +=
                    "&page_token=" +
                    Uri.EscapeDataString(
                        pageToken);
            }

            using JsonDocument document =
                await GetDocumentAsync(
                    requestUri,
                    cancellationToken);

            if (
                document.RootElement.TryGetProperty(
                    "bars",
                    out JsonElement barsBySymbol) &&
                barsBySymbol.ValueKind ==
                    JsonValueKind.Object &&
                barsBySymbol.TryGetProperty(
                    symbol,
                    out JsonElement bars) &&
                bars.ValueKind ==
                    JsonValueKind.Array)
            {
                foreach (
                    JsonElement bar
                    in bars.EnumerateArray())
                {
                    candles.Add(
                        ParseCandle(
                            bar));
                }
            }

            pageToken =
                GetNextPageToken(
                    document.RootElement);

            if (
                string.IsNullOrWhiteSpace(
                    pageToken))
            {
                break;
            }
        }

        return RemoveDuplicateCandles(
            candles);
    }


    private async Task<JsonDocument>
        GetDocumentAsync(
            string requestUri,
            CancellationToken cancellationToken)
    {
        using HttpResponseMessage response =
            await _httpClient.GetAsync(
                requestUri,
                cancellationToken);

        string? requestId =
            response.Headers.TryGetValues(
                "X-Request-ID",
                out IEnumerable<string>? values)
                ? values.FirstOrDefault()
                : null;

        if (!response.IsSuccessStatusCode)
        {
            string body =
                await response.Content
                    .ReadAsStringAsync(
                        cancellationToken);

            throw new InvalidOperationException(
                "Alpaca request failed " +
                $"({(int)response.StatusCode}). " +
                (
                    string.IsNullOrWhiteSpace(
                        requestId)
                        ? string.Empty
                        : $"Request ID: {requestId}. "
                ) +
                body);
        }

        Stream stream =
            await response.Content
                .ReadAsStreamAsync(
                    cancellationToken);

        return await JsonDocument.ParseAsync(
            stream,
            cancellationToken:
                cancellationToken);
    }


    private static MarketCandle ParseCandle(
        JsonElement bar)
    {
        return new MarketCandle
        {
            Date =
                DateTimeOffset.Parse(
                    GetRequiredString(
                        bar,
                        "t"),
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.AssumeUniversal),

            Open =
                GetRequiredDouble(
                    bar,
                    "o"),

            High =
                GetRequiredDouble(
                    bar,
                    "h"),

            Low =
                GetRequiredDouble(
                    bar,
                    "l"),

            Close =
                GetRequiredDouble(
                    bar,
                    "c"),

            Volume =
                GetRequiredDouble(
                    bar,
                    "v"),

            TradeCount =
                GetOptionalLong(
                    bar,
                    "n"),

            Vwap =
                GetOptionalDouble(
                    bar,
                    "vw")
        };
    }


    private static IReadOnlyList<MarketCandle>
        RemoveDuplicateCandles(
            IEnumerable<MarketCandle> candles)
    {
        return candles
            .GroupBy(
                candle =>
                    candle.Date)
            .Select(
                group =>
                    group.Last())
            .OrderBy(
                candle =>
                    candle.Date)
            .ToArray();
    }


    private static string? GetNextPageToken(
        JsonElement root)
    {
        if (
            !root.TryGetProperty(
                "next_page_token",
                out JsonElement token) ||
            token.ValueKind ==
                JsonValueKind.Null)
        {
            return null;
        }

        return token.GetString();
    }


    private static string GetRequiredString(
        JsonElement element,
        string propertyName)
    {
        if (
            !element.TryGetProperty(
                propertyName,
                out JsonElement property))
        {
            throw new InvalidOperationException(
                $"Alpaca bar is missing '{propertyName}'.");
        }

        return property.GetString() ??
            throw new InvalidOperationException(
                $"Alpaca bar field '{propertyName}' is empty.");
    }


    private static double GetRequiredDouble(
        JsonElement element,
        string propertyName)
    {
        if (
            !element.TryGetProperty(
                propertyName,
                out JsonElement property) ||
            !property.TryGetDouble(
                out double value))
        {
            throw new InvalidOperationException(
                $"Alpaca bar field '{propertyName}' is invalid.");
        }

        return value;
    }


    private static double? GetOptionalDouble(
        JsonElement element,
        string propertyName)
    {
        if (
            !element.TryGetProperty(
                propertyName,
                out JsonElement property) ||
            property.ValueKind ==
                JsonValueKind.Null)
        {
            return null;
        }

        return property.TryGetDouble(
            out double value)
                ? value
                : null;
    }


    private static long? GetOptionalLong(
        JsonElement element,
        string propertyName)
    {
        if (
            !element.TryGetProperty(
                propertyName,
                out JsonElement property) ||
            property.ValueKind ==
                JsonValueKind.Null)
        {
            return null;
        }

        return property.TryGetInt64(
            out long value)
                ? value
                : null;
    }


    private static bool IsCryptoSymbol(
        string symbol)
    {
        return symbol.Contains(
            '/',
            StringComparison.Ordinal);
    }


    private static string NormalizeSymbol(
        string symbol)
    {
        if (
            string.IsNullOrWhiteSpace(
                symbol))
        {
            throw new ArgumentException(
                "A market symbol is required.",
                nameof(symbol));
        }

        return symbol
            .Trim()
            .ToUpperInvariant();
    }


    private static string ToAlpacaTimeframe(
        int intervalMinutes)
    {
        return intervalMinutes switch
        {
            1 =>
                "1Min",

            5 =>
                "5Min",

            15 =>
                "15Min",

            30 =>
                "30Min",

            60 =>
                "1Hour",

            240 =>
                "4Hour",

            1440 =>
                "1Day",

            10080 =>
                "1Week",

            _ =>
                throw new ArgumentOutOfRangeException(
                    nameof(intervalMinutes),
                    intervalMinutes,
                    "The selected interval is not supported by Alpaca.")
        };
    }


    private static DateTimeOffset CalculateStart(
        DateTimeOffset end,
        int intervalMinutes)
    {
        return intervalMinutes switch
        {
            <= 5 =>
                end.AddDays(-30),

            <= 30 =>
                end.AddDays(-90),

            <= 240 =>
                end.AddDays(-365),

            1440 =>
                end.AddYears(-6),

            10080 =>
                end.AddYears(-8),

            _ =>
                end.AddYears(-6)
        };
    }


    private static MarketInstrument CreateStock(
        string symbol,
        string displayName)
    {
        return new MarketInstrument
        {
            Symbol =
                symbol,

            BaseAsset =
                symbol,

            QuoteAsset =
                "USD",

            DisplayName =
                displayName,

            Provider =
                "Alpaca"
        };
    }


    private static MarketInstrument CreateCrypto(
        string symbol)
    {
        string[] parts =
            symbol.Split(
                '/',
                StringSplitOptions.RemoveEmptyEntries |
                StringSplitOptions.TrimEntries);

        return new MarketInstrument
        {
            Symbol =
                symbol,

            BaseAsset =
                parts[0],

            QuoteAsset =
                parts.Length > 1
                    ? parts[1]
                    : "USD",

            DisplayName =
                symbol,

            Provider =
                "Alpaca"
        };
    }


    private static IReadOnlyList<MarketInterval>
        CreateIntervals()
    {
        return
        [
            new()
            {
                Name = "1 Minute",
                Minutes = 1
            },

            new()
            {
                Name = "5 Minutes",
                Minutes = 5
            },

            new()
            {
                Name = "15 Minutes",
                Minutes = 15
            },

            new()
            {
                Name = "30 Minutes",
                Minutes = 30
            },

            new()
            {
                Name = "1 Hour",
                Minutes = 60
            },

            new()
            {
                Name = "4 Hours",
                Minutes = 240
            },

            new()
            {
                Name = "1 Day",
                Minutes = 1440,
                IsDefault = true
            },

            new()
            {
                Name = "1 Week",
                Minutes = 10080
            }
        ];
    }


    private static IReadOnlyList<MarketPeriod>
        CreatePeriods()
    {
        return
        [
            new()
            {
                Name = "30 Days",
                Days = 30
            },

            new()
            {
                Name = "90 Days",
                Days = 90
            },

            new()
            {
                Name = "180 Days",
                Days = 180
            },

            new()
            {
                Name = "1 Year",
                Days = 365,
                IsDefault = true
            },

            new()
            {
                Name = "3 Years",
                Days = 1095
            },

            new()
            {
                Name = "5 Years",
                Days = 1825
            }
        ];
    }
}

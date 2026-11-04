using System.Globalization;
using System.Text.Json;
using QuantStat.Core.Abstractions;
using QuantStat.Core.Markets.Models;

namespace QuantStat.Api.Providers.Coinbase;

public sealed class CoinbaseMarketDataProvider :
    IMarketDataProvider
{
    private static readonly
        IReadOnlyDictionary<int, int>
        GranularityByMinutes =
            new Dictionary<int, int>
            {
                [1] = 60,
                [5] = 300,
                [15] = 900,
                [60] = 3600,
                [360] = 21600,
                [1440] = 86400
            };

    private readonly HttpClient _httpClient;

    public CoinbaseMarketDataProvider(
        HttpClient httpClient)
    {
        _httpClient =
            httpClient;
    }

    public string Name =>
        "Coinbase";


    public async Task<MarketMetadata> GetMetadataAsync(
        CancellationToken cancellationToken = default)
    {
        using JsonDocument document =
            await GetDocumentAsync(
                "products",
                cancellationToken);

        if (
            document.RootElement.ValueKind !=
            JsonValueKind.Array)
        {
            throw new InvalidOperationException(
                "Coinbase returned an invalid products response.");
        }

        var markets =
            new List<MarketInstrument>();

        foreach (
            JsonElement product
            in document.RootElement.EnumerateArray())
        {
            string id =
                GetString(
                    product,
                    "id");

            string baseAsset =
                GetString(
                    product,
                    "base_currency")
                .Trim()
                .ToUpperInvariant();

            string quoteAsset =
                GetString(
                    product,
                    "quote_currency")
                .Trim()
                .ToUpperInvariant();

            string status =
                GetString(
                    product,
                    "status");

            bool tradingDisabled =
                GetBoolean(
                    product,
                    "trading_disabled");

            if (
                string.IsNullOrWhiteSpace(id) ||
                string.IsNullOrWhiteSpace(baseAsset) ||
                string.IsNullOrWhiteSpace(quoteAsset))
            {
                continue;
            }

            if (
                tradingDisabled ||
                (
                    !string.IsNullOrWhiteSpace(status) &&
                    !string.Equals(
                        status,
                        "online",
                        StringComparison.OrdinalIgnoreCase)
                ))
            {
                continue;
            }

            markets.Add(
                new MarketInstrument
                {
                    Symbol =
                        id
                            .Trim()
                            .ToUpperInvariant(),

                    BaseAsset =
                        baseAsset,

                    QuoteAsset =
                        quoteAsset,

                    DisplayName =
                        $"{baseAsset}/{quoteAsset}",

                    Provider =
                        Name
                });
        }

        List<MarketInstrument> uniqueMarkets =
            markets
                .GroupBy(
                    market =>
                        market.Symbol,
                    StringComparer.OrdinalIgnoreCase)
                .Select(
                    group =>
                        group.First())
                .OrderBy(
                    market =>
                        market.QuoteAsset)
                .ThenBy(
                    market =>
                        market.BaseAsset)
                .ToList();

        List<string> quoteCurrencies =
            uniqueMarkets
                .Select(
                    market =>
                        market.QuoteAsset)
                .Distinct(
                    StringComparer.OrdinalIgnoreCase)
                .OrderBy(
                    quote =>
                        quote)
                .ToList();

        return new MarketMetadata
        {
            Markets =
                uniqueMarkets,

            Intervals =
                CreateIntervals(),

            Periods =
                CreatePeriods(),

            QuoteCurrencies =
                quoteCurrencies
        };
    }


    public async Task<IReadOnlyList<MarketCandle>>
        GetCandlesAsync(
            string symbol,
            int intervalMinutes,
            bool includeIncompleteCandle = false,
            CancellationToken cancellationToken = default)
    {
        string normalizedSymbol =
            NormalizeSymbol(symbol);

        if (
            !GranularityByMinutes.TryGetValue(
                intervalMinutes,
                out int granularitySeconds))
        {
            throw new ArgumentOutOfRangeException(
                nameof(intervalMinutes),
                intervalMinutes,
                "The requested Coinbase interval is not supported.");
        }

        string requestUri =
            "products/" +
            Uri.EscapeDataString(normalizedSymbol) +
            "/candles" +
            $"?granularity={granularitySeconds}";

        using JsonDocument document =
            await GetDocumentAsync(
                requestUri,
                cancellationToken);

        if (
            document.RootElement.ValueKind !=
            JsonValueKind.Array)
        {
            throw new InvalidOperationException(
                "Coinbase returned no candle data.");
        }

        DateTimeOffset now =
            DateTimeOffset.UtcNow;

        var candles =
            new List<MarketCandle>();

        foreach (
            JsonElement row
            in document.RootElement.EnumerateArray())
        {
            if (
                row.ValueKind !=
                JsonValueKind.Array)
            {
                continue;
            }

            JsonElement[] values =
                row
                    .EnumerateArray()
                    .ToArray();

            if (values.Length < 6)
            {
                continue;
            }

            long timestamp =
                ParseLong(
                    values[0]);

            DateTimeOffset date =
                DateTimeOffset
                    .FromUnixTimeSeconds(
                        timestamp);

            if (
                !includeIncompleteCandle &&
                date.AddSeconds(
                    granularitySeconds) >
                now)
            {
                continue;
            }

            candles.Add(
                new MarketCandle
                {
                    Date =
                        date,

                    Low =
                        ParseDouble(
                            values[1]),

                    High =
                        ParseDouble(
                            values[2]),

                    Open =
                        ParseDouble(
                            values[3]),

                    Close =
                        ParseDouble(
                            values[4]),

                    Volume =
                        ParseDouble(
                            values[5]),

                    Vwap =
                        null,

                    TradeCount =
                        null
                });
        }

        return candles
            .OrderBy(
                candle =>
                    candle.Date)
            .ToList();
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

        if (!response.IsSuccessStatusCode)
        {
            string body =
                await response.Content
                    .ReadAsStringAsync(
                        cancellationToken);

            throw new InvalidOperationException(
                "Coinbase request failed " +
                $"({(int)response.StatusCode}): " +
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


    private static string NormalizeSymbol(
        string symbol)
    {
        if (string.IsNullOrWhiteSpace(symbol))
        {
            throw new ArgumentException(
                "The market symbol is required.",
                nameof(symbol));
        }

        string normalized =
            symbol
                .Trim()
                .ToUpperInvariant();

        if (normalized.Contains('-'))
        {
            return normalized;
        }

        string[] quoteCurrencies =
        [
            "USDT",
            "USDC",
            "USD",
            "EUR",
            "GBP",
            "JPY",
            "CAD",
            "AUD",
            "BTC",
            "ETH"
        ];

        string? quote =
            quoteCurrencies.FirstOrDefault(
                candidate =>
                    normalized.EndsWith(
                        candidate,
                        StringComparison.OrdinalIgnoreCase) &&
                    normalized.Length >
                        candidate.Length);

        if (quote is null)
        {
            return normalized;
        }

        string baseAsset =
            normalized[..^quote.Length];

        return $"{baseAsset}-{quote}";
    }


    private static string GetString(
        JsonElement element,
        string propertyName)
    {
        if (
            !element.TryGetProperty(
                propertyName,
                out JsonElement property))
        {
            return string.Empty;
        }

        return property.ValueKind ==
            JsonValueKind.String
                ? property.GetString() ??
                  string.Empty
                : property.ToString();
    }


    private static bool GetBoolean(
        JsonElement element,
        string propertyName)
    {
        if (
            !element.TryGetProperty(
                propertyName,
                out JsonElement property))
        {
            return false;
        }

        if (
            property.ValueKind ==
            JsonValueKind.True)
        {
            return true;
        }

        if (
            property.ValueKind ==
            JsonValueKind.False)
        {
            return false;
        }

        return bool.TryParse(
            property.ToString(),
            out bool result) &&
            result;
    }


    private static double ParseDouble(
        JsonElement element)
    {
        if (
            element.ValueKind ==
            JsonValueKind.Number &&
            element.TryGetDouble(
                out double number))
        {
            return number;
        }

        string text =
            element.ValueKind ==
            JsonValueKind.String
                ? element.GetString() ??
                  string.Empty
                : element.ToString();

        return double.Parse(
            text,
            NumberStyles.Float,
            CultureInfo.InvariantCulture);
    }


    private static long ParseLong(
        JsonElement element)
    {
        if (
            element.ValueKind ==
            JsonValueKind.Number &&
            element.TryGetInt64(
                out long number))
        {
            return number;
        }

        string text =
            element.ValueKind ==
            JsonValueKind.String
                ? element.GetString() ??
                  string.Empty
                : element.ToString();

        return long.Parse(
            text,
            NumberStyles.Integer,
            CultureInfo.InvariantCulture);
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
                Name = "1 Hour",
                Minutes = 60
            },

            new()
            {
                Name = "6 Hours",
                Minutes = 360
            },

            new()
            {
                Name = "1 Day",
                Minutes = 1440,
                IsDefault = true
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
                Name = "Maximum",
                Days = 720
            }
        ];
    }
}
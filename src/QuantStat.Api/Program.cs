using QuantStat.Api.Providers.Kraken;
using QuantStat.Core.Abstractions;
using QuantStat.Core.Dashboard;
using QuantStat.Core.Markets.Models;
using QuantStat.Core.Statistics;

var builder =
    WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient<KrakenMarketDataProvider>(
    client =>
    {
        client.BaseAddress =
            new Uri(
                "https://api.kraken.com/");

        client.Timeout =
            TimeSpan.FromSeconds(30);

        client.DefaultRequestHeaders
            .UserAgent
            .ParseAdd(
                "QuantStat/1.0");
    });

builder.Services.AddScoped<IMarketDataProvider>(
    services =>
        services.GetRequiredService<
            KrakenMarketDataProvider>());

builder.Services.AddScoped<StatisticsService>();
builder.Services.AddScoped<DashboardAnalysisService>();

builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            "QuantStatWeb",
            policy =>
            {
                policy
                    .WithOrigins(
                        "http://localhost:5173",
                        "https://localhost:5173")
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
    });

var app =
    builder.Build();

app.UseCors(
    "QuantStatWeb");

app.MapGet(
    "/api/health",
    () =>
        Results.Ok(
            new
            {
                success = true,
                service = "QuantStat.Api",
                timestamp = DateTimeOffset.UtcNow
            }));

app.MapGet(
    "/api/markets",
    async (
        IMarketDataProvider provider,
        CancellationToken cancellationToken) =>
    {
        MarketMetadata metadata =
            await provider.GetMetadataAsync(
                cancellationToken);

        return Results.Ok(metadata);
    });

app.MapGet(
    "/api/market-data",
    async (
        string symbol,
        int? interval,
        int? periodDays,
        IMarketDataProvider provider,
        CancellationToken cancellationToken) =>
    {
        int selectedInterval =
            interval ?? 1440;

        IReadOnlyList<MarketCandle> candles =
            await provider.GetCandlesAsync(
                symbol,
                selectedInterval,
                false,
                cancellationToken);

        if (periodDays is > 0)
        {
            DateTimeOffset threshold =
                DateTimeOffset.UtcNow.AddDays(
                    -periodDays.Value);

            candles =
                candles
                    .Where(
                        candle =>
                            candle.Date >= threshold)
                    .ToList();
        }

        return Results.Ok(
            new
            {
                provider = provider.Name,
                symbol,
                interval = selectedInterval,
                periodDays,
                candles
            });
    });

app.MapGet(
    "/api/dashboard",
    async (
        string? symbol,
        int? interval,
        int? periodDays,
        IMarketDataProvider provider,
        DashboardAnalysisService analysisService,
        CancellationToken cancellationToken) =>
    {
        string selectedSymbol =
            string.IsNullOrWhiteSpace(symbol)
                ? "ETHUSD"
                : symbol.Trim().ToUpperInvariant();

        int selectedInterval =
            interval ?? 1440;

        int selectedPeriod =
            periodDays ?? 365;

        IReadOnlyList<MarketCandle> candles =
            await provider.GetCandlesAsync(
                selectedSymbol,
                selectedInterval,
                false,
                cancellationToken);

        DateTimeOffset threshold =
            DateTimeOffset.UtcNow.AddDays(
                -selectedPeriod);

        MarketCandle[] selectedCandles =
            candles
                .Where(
                    candle =>
                        candle.Date >= threshold)
                .OrderBy(
                    candle =>
                        candle.Date)
                .ToArray();

        if (selectedCandles.Length < 5)
        {
            return Results.BadRequest(
                new
                {
                    error =
                        "The selected market and period do not contain enough observations."
                });
        }

        var dashboard =
            analysisService.Calculate(
                selectedSymbol,
                selectedInterval,
                selectedPeriod,
                selectedCandles);

        return Results.Ok(
            dashboard);
    });


app.MapGet(
    "/api/statistics",
    async (
        string? symbol,
        int? interval,
        int? periodDays,
        IMarketDataProvider provider,
        StatisticsService statisticsService,
        CancellationToken cancellationToken) =>
    {
        string selectedSymbol =
            string.IsNullOrWhiteSpace(symbol)
                ? "ETHUSD"
                : symbol
                    .Trim()
                    .ToUpperInvariant();

        int selectedInterval =
            interval ?? 1440;

        int selectedPeriod =
            periodDays ?? 365;

        IReadOnlyList<MarketCandle> candles =
            await provider.GetCandlesAsync(
                selectedSymbol,
                selectedInterval,
                false,
                cancellationToken);

        DateTimeOffset threshold =
            DateTimeOffset.UtcNow
                .AddDays(
                    -selectedPeriod);

        MarketCandle[] selectedCandles =
            candles
                .Where(
                    candle =>
                        candle.Date >= threshold)
                .OrderBy(
                    candle =>
                        candle.Date)
                .ToArray();

        if (selectedCandles.Length < 5)
        {
            return Results.BadRequest(
                new
                {
                    error =
                        "The selected market and period do not contain enough observations."
                });
        }

        var result =
            statisticsService.Calculate(
                selectedCandles,
                selectedInterval);

        return Results.Ok(
            new
            {
                provider =
                    provider.Name,

                symbol =
                    selectedSymbol,

                intervalMinutes =
                    selectedInterval,

                periodDays =
                    selectedPeriod,

                result
            });
    });
app.Run();

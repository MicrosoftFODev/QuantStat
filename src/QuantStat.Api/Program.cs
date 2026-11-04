using QuantStat.Api.Providers;
using QuantStat.Api.Providers.Coinbase;
using QuantStat.Api.Providers.Kraken;
using QuantStat.Core.Abstractions;
using QuantStat.Core.Dashboard;
using QuantStat.Core.Markets.Models;
using QuantStat.Core.Statistics;

var builder =
    WebApplication.CreateBuilder(args);

string port =
    Environment.GetEnvironmentVariable(
        "PORT") ?? "5094";

builder.WebHost.UseUrls(
    $"http://0.0.0.0:{port}");


builder.Services.AddHttpClient<
    KrakenMarketDataProvider>(
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


builder.Services.AddHttpClient<
    CoinbaseMarketDataProvider>(
    client =>
    {
        client.BaseAddress =
            new Uri(
                "https://api.exchange.coinbase.com/");

        client.Timeout =
            TimeSpan.FromSeconds(30);

        client.DefaultRequestHeaders
            .UserAgent
            .ParseAdd(
                "QuantStat/1.0");

        client.DefaultRequestHeaders
            .Accept
            .ParseAdd(
                "application/json");
    });


builder.Services.AddScoped<
    MarketDataProviderResolver>();

builder.Services.AddScoped<
    StatisticsService>();

builder.Services.AddScoped<
    DashboardAnalysisService>();


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
                        "https://localhost:5173",
                        "https://glittering-pegasus-87a130.netlify.app")
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
                timestamp =
                    DateTimeOffset.UtcNow
            }));


app.MapGet(
    "/api/providers",
    (
        MarketDataProviderResolver resolver) =>
    {
        return Results.Ok(
            resolver.GetProviders());
    });


app.MapGet(
    "/api/markets",
    async (
        string? provider,
        MarketDataProviderResolver resolver,
        CancellationToken cancellationToken) =>
    {
        try
        {
            IMarketDataProvider marketProvider =
                resolver.Resolve(
                    provider);

            MarketMetadata metadata =
                await marketProvider
                    .GetMetadataAsync(
                        cancellationToken);

            return Results.Ok(
                metadata);
        }
        catch (ArgumentException exception)
        {
            return Results.BadRequest(
                new
                {
                    error =
                        exception.Message
                });
        }
    });


app.MapGet(
    "/api/market-data",
    async (
        string? provider,
        string symbol,
        int? interval,
        int? periodDays,
        MarketDataProviderResolver resolver,
        CancellationToken cancellationToken) =>
    {
        try
        {
            IMarketDataProvider marketProvider =
                resolver.Resolve(
                    provider);

            int selectedInterval =
                interval ?? 1440;

            IReadOnlyList<MarketCandle> candles =
                await marketProvider
                    .GetCandlesAsync(
                        symbol,
                        selectedInterval,
                        false,
                        cancellationToken);

            if (periodDays is > 0)
            {
                DateTimeOffset threshold =
                    DateTimeOffset.UtcNow
                        .AddDays(
                            -periodDays.Value);

                candles =
                    candles
                        .Where(
                            candle =>
                                candle.Date >=
                                threshold)
                        .ToList();
            }

            return Results.Ok(
                new
                {
                    provider =
                        marketProvider.Name,

                    symbol,

                    interval =
                        selectedInterval,

                    periodDays,

                    candles
                });
        }
        catch (
            ArgumentException exception)
        {
            return Results.BadRequest(
                new
                {
                    error =
                        exception.Message
                });
        }
    });


app.MapGet(
    "/api/dashboard",
    async (
        string? provider,
        string? symbol,
        int? interval,
        int? periodDays,
        MarketDataProviderResolver resolver,
        DashboardAnalysisService analysisService,
        CancellationToken cancellationToken) =>
    {
        try
        {
            IMarketDataProvider marketProvider =
                resolver.Resolve(
                    provider);

            string selectedSymbol =
                string.IsNullOrWhiteSpace(symbol)
                    ? resolver.GetDefaultSymbol(
                        provider)
                    : symbol
                        .Trim()
                        .ToUpperInvariant();

            int selectedInterval =
                interval ?? 1440;

            int selectedPeriod =
                periodDays ?? 365;

            IReadOnlyList<MarketCandle> candles =
                await marketProvider
                    .GetCandlesAsync(
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
                            candle.Date >=
                            threshold)
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
        }
        catch (
            ArgumentException exception)
        {
            return Results.BadRequest(
                new
                {
                    error =
                        exception.Message
                });
        }
    });


app.MapGet(
    "/api/statistics",
    async (
        string? provider,
        string? symbol,
        int? interval,
        int? periodDays,
        MarketDataProviderResolver resolver,
        StatisticsService statisticsService,
        CancellationToken cancellationToken) =>
    {
        try
        {
            IMarketDataProvider marketProvider =
                resolver.Resolve(
                    provider);

            string selectedSymbol =
                string.IsNullOrWhiteSpace(symbol)
                    ? resolver.GetDefaultSymbol(
                        provider)
                    : symbol
                        .Trim()
                        .ToUpperInvariant();

            int selectedInterval =
                interval ?? 1440;

            int selectedPeriod =
                periodDays ?? 365;

            IReadOnlyList<MarketCandle> candles =
                await marketProvider
                    .GetCandlesAsync(
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
                            candle.Date >=
                            threshold)
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
                        marketProvider.Name,

                    symbol =
                        selectedSymbol,

                    intervalMinutes =
                        selectedInterval,

                    periodDays =
                        selectedPeriod,

                    result
                });
        }
        catch (
            ArgumentException exception)
        {
            return Results.BadRequest(
                new
                {
                    error =
                        exception.Message
                });
        }
    });


app.Run();
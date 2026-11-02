using QuantStat.Core.Indicators;

namespace QuantStat.Tests.Indicators;

public sealed class RsiCalculatorTests
{
    private static readonly double[] Prices =
    [
        44.34,
        44.09,
        44.15,
        43.61,
        44.33,
        44.83,
        45.10,
        45.42,
        45.84,
        46.08,
        45.89,
        46.03,
        45.61,
        46.28,
        46.28,
        46.00,
        46.03,
        46.41,
        46.22,
        45.64,
        46.21
    ];


    [Fact]
    public void Wilder_HasInitialUndefinedWindow()
    {
        double?[] rsi =
            RsiCalculator.Wilder(
                Prices,
                14);

        for (int i = 0; i < 14; i++)
        {
            Assert.Null(
                rsi[i]);
        }

        Assert.NotNull(
            rsi[14]);
    }


    [Fact]
    public void Wilder_RemainsInsideBounds()
    {
        double?[] rsi =
            RsiCalculator.Wilder(
                Prices,
                14);

        AssertValuesAreValidRsi(
            rsi);
    }


    [Fact]
    public void Cutler_HasInitialUndefinedWindow()
    {
        double?[] rsi =
            RsiCalculator.Cutler(
                Prices,
                14);

        for (int i = 0; i < 14; i++)
        {
            Assert.Null(
                rsi[i]);
        }

        Assert.NotNull(
            rsi[14]);
    }


    [Fact]
    public void Cutler_RemainsInsideBounds()
    {
        double?[] rsi =
            RsiCalculator.Cutler(
                Prices,
                14);

        AssertValuesAreValidRsi(
            rsi);
    }


    [Fact]
    public void Exponential_HasInitialUndefinedWindow()
    {
        double?[] rsi =
            RsiCalculator.Exponential(
                Prices,
                14);

        for (int i = 0; i < 14; i++)
        {
            Assert.Null(
                rsi[i]);
        }

        Assert.NotNull(
            rsi[14]);
    }


    [Fact]
    public void Exponential_RemainsInsideBounds()
    {
        double?[] rsi =
            RsiCalculator.Exponential(
                Prices,
                14);

        AssertValuesAreValidRsi(
            rsi);
    }


    [Fact]
    public void PriceStreak_TracksDirection()
    {
        double[] streak =
            RsiCalculator.PriceStreak(
                [
                    100,
                    101,
                    102,
                    101,
                    100,
                    100,
                    101
                ]);

        double[] expected =
        [
            0,
            1,
            2,
            -1,
            -2,
            0,
            1
        ];

        Assert.Equal(
            expected,
            streak);
    }


    [Fact]
    public void PercentRank_HasInitialUndefinedWindow()
    {
        double?[] result =
            RsiCalculator.PercentRank(
                [
                    1,
                    2,
                    3,
                    4,
                    5,
                    6
                ],
                3);

        Assert.Null(
            result[0]);

        Assert.Null(
            result[1]);

        Assert.Null(
            result[2]);

        Assert.NotNull(
            result[3]);
    }


    private static void AssertValuesAreValidRsi(
        IEnumerable<double?> values)
    {
        foreach (
            double value
            in values
                .Where(
                    value =>
                        value.HasValue)
                .Select(
                    value =>
                        value!.Value))
        {
            Assert.InRange(
                value,
                0.0,
                100.0);
        }
    }
}
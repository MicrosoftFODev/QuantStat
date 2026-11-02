namespace QuantStat.Core.Indicators;

public static class RsiCalculator
{
    public static double?[] Wilder(
        IReadOnlyList<double> prices,
        int period = 14)
    {
        ValidatePrices(prices, period);

        var result =
            CreateEmpty(prices.Count);

        if (prices.Count <= period)
        {
            return result;
        }

        double gainSum = 0.0;
        double lossSum = 0.0;

        for (int i = 1; i <= period; i++)
        {
            double change =
                prices[i] - prices[i - 1];

            if (change > 0.0)
            {
                gainSum += change;
            }
            else
            {
                lossSum += -change;
            }
        }

        double averageGain =
            gainSum / period;

        double averageLoss =
            lossSum / period;

        result[period] =
            CalculateRsi(
                averageGain,
                averageLoss);

        for (
            int i = period + 1;
            i < prices.Count;
            i++)
        {
            double change =
                prices[i] -
                prices[i - 1];

            double gain =
                Math.Max(
                    change,
                    0.0);

            double loss =
                Math.Max(
                    -change,
                    0.0);

            averageGain =
                (
                    averageGain *
                    (period - 1)
                    +
                    gain
                ) /
                period;

            averageLoss =
                (
                    averageLoss *
                    (period - 1)
                    +
                    loss
                ) /
                period;

            result[i] =
                CalculateRsi(
                    averageGain,
                    averageLoss);
        }

        return result;
    }


    public static double?[] Cutler(
        IReadOnlyList<double> prices,
        int period = 14)
    {
        ValidatePrices(prices, period);

        var result =
            CreateEmpty(prices.Count);

        for (
            int i = period;
            i < prices.Count;
            i++)
        {
            double gainSum = 0.0;
            double lossSum = 0.0;

            for (
                int j = i - period + 1;
                j <= i;
                j++)
            {
                double change =
                    prices[j] -
                    prices[j - 1];

                if (change > 0.0)
                {
                    gainSum += change;
                }
                else
                {
                    lossSum += -change;
                }
            }

            result[i] =
                CalculateRsi(
                    gainSum / period,
                    lossSum / period);
        }

        return result;
    }


    public static double?[] Exponential(
        IReadOnlyList<double> prices,
        int period = 14)
    {
        ValidatePrices(prices, period);

        var result =
            CreateEmpty(prices.Count);

        if (prices.Count <= period)
        {
            return result;
        }

        double gainSum = 0.0;
        double lossSum = 0.0;

        for (int i = 1; i <= period; i++)
        {
            double change =
                prices[i] -
                prices[i - 1];

            gainSum +=
                Math.Max(
                    change,
                    0.0);

            lossSum +=
                Math.Max(
                    -change,
                    0.0);
        }

        double averageGain =
            gainSum / period;

        double averageLoss =
            lossSum / period;

        result[period] =
            CalculateRsi(
                averageGain,
                averageLoss);

        double alpha =
            2.0 /
            (period + 1.0);

        for (
            int i = period + 1;
            i < prices.Count;
            i++)
        {
            double change =
                prices[i] -
                prices[i - 1];

            double gain =
                Math.Max(
                    change,
                    0.0);

            double loss =
                Math.Max(
                    -change,
                    0.0);

            averageGain =
                alpha * gain +
                (1.0 - alpha) *
                averageGain;

            averageLoss =
                alpha * loss +
                (1.0 - alpha) *
                averageLoss;

            result[i] =
                CalculateRsi(
                    averageGain,
                    averageLoss);
        }

        return result;
    }


    public static double?[] Stochastic(
        IReadOnlyList<double> prices,
        int rsiPeriod = 14,
        int stochasticPeriod = 14)
    {
        ValidatePrices(
            prices,
            rsiPeriod);

        if (stochasticPeriod <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(stochasticPeriod));
        }

        double?[] rsi =
            Wilder(
                prices,
                rsiPeriod);

        var result =
            CreateEmpty(prices.Count);

        int firstIndex =
            rsiPeriod +
            stochasticPeriod -
            1;

        for (
            int i = firstIndex;
            i < prices.Count;
            i++)
        {
            int start =
                i -
                stochasticPeriod +
                1;

            double minimum =
                double.PositiveInfinity;

            double maximum =
                double.NegativeInfinity;

            bool valid =
                true;

            for (int j = start; j <= i; j++)
            {
                if (!rsi[j].HasValue)
                {
                    valid = false;
                    break;
                }

                double value =
                    rsi[j]!.Value;

                minimum =
                    Math.Min(
                        minimum,
                        value);

                maximum =
                    Math.Max(
                        maximum,
                        value);
            }

            if (
                !valid ||
                !rsi[i].HasValue)
            {
                continue;
            }

            double range =
                maximum - minimum;

            result[i] =
                range == 0.0
                    ? 0.0
                    : 100.0 *
                      (
                          rsi[i]!.Value -
                          minimum
                      ) /
                      range;
        }

        return result;
    }


    public static double[] PriceStreak(
        IReadOnlyList<double> prices)
    {
        ArgumentNullException.ThrowIfNull(
            prices);

        var streak =
            new double[prices.Count];

        if (prices.Count == 0)
        {
            return streak;
        }

        for (int i = 1; i < prices.Count; i++)
        {
            if (prices[i] > prices[i - 1])
            {
                streak[i] =
                    streak[i - 1] > 0.0
                        ? streak[i - 1] + 1.0
                        : 1.0;
            }
            else if (
                prices[i] <
                prices[i - 1])
            {
                streak[i] =
                    streak[i - 1] < 0.0
                        ? streak[i - 1] - 1.0
                        : -1.0;
            }
            else
            {
                streak[i] = 0.0;
            }
        }

        return streak;
    }


    public static double?[] PercentRank(
        IReadOnlyList<double> values,
        int lookbackPeriod)
    {
        ArgumentNullException.ThrowIfNull(
            values);

        if (lookbackPeriod <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(lookbackPeriod));
        }

        var result =
            CreateEmpty(values.Count);

        for (
            int i = lookbackPeriod;
            i < values.Count;
            i++)
        {
            double current =
                values[i];

            int lowerCount =
                0;

            for (
                int j = i - lookbackPeriod;
                j < i;
                j++)
            {
                if (values[j] < current)
                {
                    lowerCount++;
                }
            }

            result[i] =
                100.0 *
                lowerCount /
                lookbackPeriod;
        }

        return result;
    }


    public static double?[] Connors(
        IReadOnlyList<double> prices,
        int priceRsiPeriod = 3,
        int streakRsiPeriod = 2,
        int percentRankPeriod = 100)
    {
        ValidatePrices(
            prices,
            Math.Max(
                priceRsiPeriod,
                streakRsiPeriod));

        double?[] priceRsi =
            Wilder(
                prices,
                priceRsiPeriod);

        double[] streak =
            PriceStreak(prices);

        double[] shiftedStreak =
            streak
                .Select(
                    value =>
                        value + 1000.0)
                .ToArray();

        double?[] streakRsi =
            Wilder(
                shiftedStreak,
                streakRsiPeriod);

        double[] changes =
            new double[prices.Count];

        for (int i = 1; i < prices.Count; i++)
        {
            changes[i] =
                (
                    prices[i] -
                    prices[i - 1]
                ) /
                prices[i - 1];
        }

        double?[] percentRank =
            PercentRank(
                changes,
                percentRankPeriod);

        var result =
            CreateEmpty(prices.Count);

        for (int i = 0; i < prices.Count; i++)
        {
            if (
                priceRsi[i].HasValue &&
                streakRsi[i].HasValue &&
                percentRank[i].HasValue)
            {
                result[i] =
                    (
                        priceRsi[i]!.Value +
                        streakRsi[i]!.Value +
                        percentRank[i]!.Value
                    ) /
                    3.0;
            }
        }

        return result;
    }


    private static double CalculateRsi(
        double averageGain,
        double averageLoss)
    {
        if (
            averageGain == 0.0 &&
            averageLoss == 0.0)
        {
            return 50.0;
        }

        if (averageLoss == 0.0)
        {
            return 100.0;
        }

        if (averageGain == 0.0)
        {
            return 0.0;
        }

        double relativeStrength =
            averageGain /
            averageLoss;

        return
            100.0 -
            100.0 /
            (
                1.0 +
                relativeStrength
            );
    }


    private static double?[] CreateEmpty(
        int count)
    {
        return new double?[count];
    }


    private static void ValidatePrices(
        IReadOnlyList<double> prices,
        int period)
    {
        ArgumentNullException.ThrowIfNull(
            prices);

        if (period <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(period));
        }

        for (int i = 0; i < prices.Count; i++)
        {
            if (
                !double.IsFinite(prices[i]) ||
                prices[i] <= 0.0)
            {
                throw new ArgumentException(
                    "Prices must contain positive finite values.",
                    nameof(prices));
            }
        }
    }
}
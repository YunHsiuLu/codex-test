import json
import pickle
import threading
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import pandas as pd

from charts import technical_chart
from market_data import (add_indicators, clean_history, compare_returns, history, latest_session,
                         market_status, normalize_news, previous_close, price_change, quote_summary)
from settings import load_catalog, load_preferences, save_preferences, validate_preferences


def frame(index, prices):
    return pd.DataFrame({'Open': prices, 'High': [p + 1 for p in prices],
                         'Low': [p - 1 for p in prices], 'Close': prices, 'Volume': 1000}, index=index)


def result(data):
    return {'frame': data, 'metadata': {'exchangeTimezoneName': 'America/New_York', 'currency': 'USD'},
            'fetched_at': '2026-09-05T00:00:00Z', 'error': None}


class FinancialTests(unittest.TestCase):
    def test_lazy_yahoo_metadata_is_converted_before_caching(self):
        class LazyMetadata(dict):
            pass
        metadata = LazyMetadata(currency='USD', exchangeTimezoneName='America/New_York')
        metadata.lock = threading.Lock()
        data = frame(pd.date_range('2026-01-01', periods=2, tz='America/New_York'), [100, 105])
        with patch('market_data.yf.Ticker') as ticker:
            ticker.return_value.history.return_value = data
            ticker.return_value.get_history_metadata.return_value = metadata
            actual = history.__wrapped__('CACHE_TEST')
            self.assertIsNone(actual['error'])
            self.assertEqual(type(actual['metadata']), dict)
            self.assertEqual(pickle.loads(pickle.dumps(actual))['metadata']['currency'], 'USD')

    def test_session_spans_taiwan_midnight(self):
        index = pd.date_range('2026-09-04 09:30', '2026-09-04 16:00', freq='30min', tz='America/New_York')
        data = frame(index.tz_convert('Asia/Taipei'), list(range(100, 100 + len(index))))
        actual = latest_session(data, 'America/New_York')
        self.assertEqual(len(actual), len(data))
        self.assertEqual(str(actual.index[-1].date()), '2026-09-04')
        self.assertEqual(actual.index[0].hour, 9)

    def test_latest_session_ignores_weekend_and_old_sessions(self):
        data = frame(pd.DatetimeIndex(['2026-09-03 15:59', '2026-09-04 09:30', '2026-09-04 15:59'], tz='America/New_York'), [98, 100, 105])
        actual = latest_session(data, 'America/New_York')
        self.assertEqual(len(actual), 2)
        self.assertEqual(str(actual.index[0].date()), '2026-09-04')

    def test_change_uses_previous_close_not_open(self):
        daily = frame(pd.DatetimeIndex(['2026-09-03', '2026-09-04'], tz='America/New_York'), [100, 105])
        minute = frame(pd.DatetimeIndex(['2026-09-04 09:30', '2026-09-04 15:59'], tz='America/New_York'), [110, 105])
        actual = quote_summary(result(daily), result(minute))
        self.assertEqual(actual['previous_close'], 100)
        self.assertEqual(actual['change_pct'], 5)
        self.assertEqual(price_change(105, 110)[0], -5)

    def test_daily_lags_new_intraday_session(self):
        daily = frame(pd.DatetimeIndex(['2026-09-02', '2026-09-03'], tz='America/New_York'), [98, 100])
        minute = frame(pd.DatetimeIndex(['2026-09-04 09:30', '2026-09-04 10:00'], tz='America/New_York'), [110, 105])
        actual = quote_summary(result(daily), result(minute))
        self.assertEqual(actual['previous_close'], 100)
        self.assertEqual(actual['open'], 110)
        self.assertEqual(actual['volume'], 2000)

    def test_old_minute_does_not_replace_newer_daily_quote(self):
        daily = frame(pd.DatetimeIndex(['2026-09-03', '2026-09-04'], tz='America/New_York'), [100, 105])
        minute = frame(pd.DatetimeIndex(['2026-09-03 15:59'], tz='America/New_York'), [99])
        self.assertEqual(quote_summary(result(daily), result(minute))['price'], 105)

    def test_closing_auction_quote_wins_over_last_minute_bar(self):
        daily = result(frame(pd.DatetimeIndex(['2026-09-03', '2026-09-04'], tz='America/New_York'), [100, 105]))
        daily['metadata']['regularMarketTime'] = pd.Timestamp('2026-09-04 16:00', tz='America/New_York')
        minute = result(frame(pd.DatetimeIndex(['2026-09-04 15:59'], tz='America/New_York'), [104]))
        summary = quote_summary(daily, minute)
        self.assertEqual(summary['price'], 105)
        self.assertIn('16:00:00', summary['price_time'])

    def test_missing_reference_and_bad_data(self):
        self.assertEqual(price_change(105, None), (None, None))
        self.assertEqual(price_change(105, 0), (None, None))
        self.assertIsNone(quote_summary(result(pd.DataFrame())))
        with self.assertRaises(ValueError):
            clean_history(pd.DataFrame())
        data = frame(pd.date_range('2026-01-01', periods=1), [100])
        self.assertIsNone(previous_close(data, data.index[0].date(), 'UTC'))

    def test_comparison_uses_common_dates_no_forward_fill(self):
        a = frame(pd.DatetimeIndex(['2026-01-01', '2026-01-02', '2026-01-05'], tz='Asia/Taipei'), [50, 100, 110])
        b = frame(pd.DatetimeIndex(['2026-01-02', '2026-01-05', '2026-01-06'], tz='America/New_York'), [200, 180, 300])
        actual = compare_returns({'A': a, 'B': b})
        self.assertEqual(len(actual), 2)
        self.assertTrue((actual.iloc[0] == 0).all())
        self.assertAlmostEqual(actual.A.iloc[-1], 10)
        self.assertAlmostEqual(actual.B.iloc[-1], -10)

    def test_insufficient_overlap_is_explicit(self):
        a = frame(pd.date_range('2026-01-01', periods=2), [100, 110])
        b = frame(pd.date_range('2026-02-01', periods=2), [100, 110])
        with self.assertRaisesRegex(ValueError, '共同交易日期'):
            compare_returns({'A': a, 'B': b})

    def test_short_history_does_not_crash_indicators(self):
        data = frame(pd.date_range('2026-01-01', periods=2), [100, 110])
        actual = add_indicators(data)
        self.assertTrue(actual['Signal'].isna().all())
        figure = technical_chart(actual, ['MACD', 'KD'], [5, 20, 60], 'test')
        self.assertEqual(figure.layout.xaxis.anchor, 'y4')
        self.assertTrue(all(trace.xaxis == 'x' for trace in figure.data))
        self.assertFalse(figure.layout.xaxis.rangeslider.visible)
        self.assertEqual(len(figure.layout.shapes), 2)
        self.assertTrue(all(shape.xref == 'x domain' for shape in figure.layout.shapes))
        self.assertIsInstance(figure.to_json(), str)

    def test_market_status_uses_source_session_bounds(self):
        summary = {'metadata': {'currentTradingPeriod': {'regular': {'start': 100, 'end': 200}}}}
        self.assertIn('時段內', market_status(summary, pd.Timestamp(150, unit='s', tz='UTC')))
        self.assertIn('時段外', market_status(summary, pd.Timestamp(200, unit='s', tz='UTC')))
        self.assertEqual(market_status({'metadata': {}}), '市場狀態未提供')
        summary['metadata']['currentTradingPeriod']['regular'] = {
            'start': pd.Timestamp(100, unit='s', tz='UTC'), 'end': pd.Timestamp(200, unit='s', tz='UTC')}
        self.assertIn('時段內', market_status(summary, pd.Timestamp(150, unit='s', tz='UTC')))

    def test_news_includes_attribution_and_rejects_script_url(self):
        data = [{'content': {'title': 'Example', 'canonicalUrl': {'url': 'https://example.com/story'},
                             'provider': {'displayName': 'Example News'}, 'pubDate': '2026-09-01T00:00:00Z'}},
                {'title': 'Unsafe', 'link': 'javascript:alert(1)'}]
        actual = normalize_news(data)
        self.assertEqual(len(actual), 1)
        self.assertEqual(actual[0]['來源'], 'Example News')
        self.assertEqual(actual[0]['發布時間（台灣）'], '2026-09-01 08:00')


class SettingsTests(unittest.TestCase):
    def test_preferences_roundtrip_and_atomic_failure(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1] / '.qa') as directory:
            path = Path(directory) / 'prefs.json'
            prefs = validate_preferences({'watchlist': ['aapl', 'AAPL'], 'chart_mode': '同時顯示', 'window': 900})
            save_preferences(prefs, path)
            actual, error = load_preferences(path)
            self.assertIsNone(error)
            self.assertEqual(actual['watchlist'], ['AAPL'])
            self.assertEqual(actual['window'], 500)
            original = path.read_text()
            with patch('settings.os.replace', side_effect=OSError('disk full')):
                with self.assertRaises(OSError):
                    save_preferences({**prefs, 'window': 20}, path)
            self.assertEqual(path.read_text(), original)

    def test_corrupt_preferences_preserved(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1] / '.qa') as directory:
            path = Path(directory) / 'prefs.json'
            path.write_text('{broken')
            actual, error = load_preferences(path)
            self.assertIsNotNone(error)
            self.assertEqual(path.read_text(), '{broken')
            self.assertIn('selected', actual)

    def test_catalog_empty_and_missing_fields_rejected(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1] / '.qa') as directory:
            path = Path(directory) / 'stocks.json'
            for data in ({}, {'Empty': []}, {'Bad': [{'ticker': 'AAPL'}]}):
                path.write_text(json.dumps(data))
                with self.assertRaises(ValueError):
                    load_catalog(path)


if __name__ == '__main__':
    Path('.qa').mkdir(exist_ok=True)
    unittest.main()

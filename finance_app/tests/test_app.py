"""Exercise real Streamlit widget reruns with deterministic market responses."""
from pathlib import Path
import unittest
from unittest.mock import patch

import pandas as pd
from streamlit.testing.v1 import AppTest

from settings import PAGES, validate_preferences

ROOT = Path(__file__).resolve().parents[1]


def fake_history(ticker, interval='1d', period='1mo', adjusted=False):
    if ticker == 'BAD':
        return {'frame': pd.DataFrame(), 'metadata': {}, 'fetched_at': None, 'error': '測試：無法取得行情'}
    tz = 'Asia/Taipei' if ticker.endswith('.TW') or ticker == '^TWII' else 'America/New_York'
    if interval == '1m':
        index = pd.date_range('2026-09-04 09:30', periods=60, freq='min', tz=tz)
    else:
        index = pd.date_range(end='2026-09-04', periods=80, freq='B', tz=tz)
    close = pd.Series([100 + i * 0.25 for i in range(len(index))], index=index)
    frame = pd.DataFrame({'Open': close - 1, 'High': close + 2, 'Low': close - 2,
                          'Close': close, 'Volume': 10000}, index=index)
    return {'frame': frame, 'metadata': {'exchangeTimezoneName': tz, 'currency': 'TWD' if tz == 'Asia/Taipei' else 'USD'},
            'fetched_at': '2026-09-04T08:00:00Z', 'error': None}


class AppFlowTests(unittest.TestCase):
    def setUp(self):
        self.patches = [
            patch('settings.load_preferences', return_value=(validate_preferences({}), None)),
            patch('settings.save_preferences'),
            patch('market_data.history', side_effect=fake_history),
            patch('market_data.company_events', return_value={'events': [], 'news': [], 'errors': [], 'fetched_at': '2026-09-04T08:00:00Z'}),
        ]
        for item in self.patches:
            item.start()
            self.addCleanup(item.stop)
        self.app = AppTest.from_file(str(ROOT / 'app.py'), default_timeout=30).run()
        self.assert_clean()

    def assert_clean(self):
        self.assertEqual(len(self.app.exception), 0, str(self.app.exception))

    def test_all_pages_and_return_restore_chart_settings(self):
        self.app.selectbox(key='timeframe').set_value('週線').run()
        self.app.selectbox(key='chart_mode').set_value('同時顯示').run()
        self.assert_clean()
        for page in PAGES[1:] + [PAGES[0]]:
            self.app.radio(key='page').set_value(page).run()
            self.assert_clean()
        self.assertEqual(self.app.selectbox(key='timeframe').value, '週線')
        self.assertEqual(self.app.selectbox(key='chart_mode').value, '同時顯示')

    def test_no_search_match_keeps_selected_stock(self):
        self.app.text_input[0].set_value('not-a-real-stock-name').run()
        self.assert_clean()
        self.assertEqual(self.app.session_state['selected'], '^TWII')
        self.assertTrue(any('找不到' in message.value for message in self.app.info))

    def test_empty_watchlist_and_single_comparison_are_safe(self):
        self.app.radio(key='page').set_value(PAGES[1]).run()
        self.app.multiselect(key='watch_editor').set_value([]).run()
        self.assert_clean()
        self.assertTrue(any('清單目前是空的' in message.value for message in self.app.info))
        self.app.radio(key='page').set_value(PAGES[2]).run()
        self.app.multiselect(key='compare').set_value(['^TWII']).run()
        self.assert_clean()
        self.assertTrue(any('至少兩個' in message.value for message in self.app.info))

    def test_quote_failure_preserves_last_success(self):
        with patch('market_data.history', side_effect=lambda *args, **kwargs: fake_history('BAD')):
            self.app.run()
            self.assert_clean()
            self.assertTrue(any('上次成功資料' in warning.value for warning in self.app.warning))
            self.assertGreater(len(self.app.metric), 0)

    def test_initial_failure_shows_message_not_exception(self):
        with patch('market_data.history', side_effect=lambda *args, **kwargs: fake_history('BAD')):
            self.app = AppTest.from_file(str(ROOT / 'app.py'), default_timeout=30).run()
            self.assert_clean()
            self.assertTrue(any('無法取得行情' in message.value for message in self.app.info))

    def test_reset_and_auto_refresh_widgets(self):
        reset = next(button for button in self.app.button if button.label == '重設Ｋ線縮放')
        reset.click().run()
        self.assert_clean()
        self.assertEqual(self.app.session_state['technical_reset'], 1)
        self.app.toggle(key='auto_refresh').set_value(True).run()
        self.assert_clean()
        self.assertTrue(self.app.session_state['preferences']['auto_refresh'])

    def test_direct_symbol_can_be_added_and_saved(self):
        entry = next(widget for widget in self.app.text_input if widget.label == 'Yahoo Finance 代碼')
        entry.set_value('aapl')
        submit = next(button for button in self.app.button if button.label == '驗證並加入自選')
        submit.click().run()
        self.assert_clean()
        self.assertEqual(self.app.session_state['selected'], 'AAPL')
        self.assertIn('AAPL', self.app.session_state['preferences']['watchlist'])


if __name__ == '__main__':
    unittest.main()

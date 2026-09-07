"""Read-only live Yahoo + Streamlit flow check; does not save preferences."""
from pathlib import Path
import sys
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from streamlit.testing.v1 import AppTest
from market_data import history
from settings import PAGES, validate_preferences


def report(app, stage):
    errors = [error.value for error in app.exception]
    print(stage, {'exceptions': errors, 'metrics': len(app.metric), 'tables': len(app.dataframe),
                  'charts': len(app.get('plotly_chart')), 'messages': [m.value for m in app.info]}, flush=True)
    if errors:
        raise RuntimeError(f'{stage} failed')


with patch('settings.load_preferences', return_value=(validate_preferences({'selected': '2330.TW'}), None)), patch('settings.save_preferences'):
    app = AppTest.from_file(str(ROOT / 'app.py'), default_timeout=90).run()
    report(app, 'TW daily')
    if len(app.metric) != 4:
        raise RuntimeError('Live daily quote unavailable')
    app.selectbox(key='chart_mode').set_value('同時顯示').run()
    report(app, 'TW intraday')
    app.selectbox(key='timeframe').set_value('週線').run()
    report(app, 'TW weekly')
    app.selectbox(key='timeframe').set_value('月線').run()
    report(app, 'TW monthly')
    app.selectbox(key='stock_choice').set_value('AAPL').run()
    report(app, 'US chart')
    app.radio(key='page').set_value(PAGES[1]).run()
    report(app, 'Watchlist')
    app.radio(key='page').set_value(PAGES[2]).run()
    report(app, 'Comparison')
    app.radio(key='page').set_value(PAGES[3]).run()
    report(app, 'Markets / AAPL events and news')
    print('LIVE FLOW OK', flush=True)

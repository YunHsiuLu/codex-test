"""Consistent Plotly figures, independent of Streamlit page state."""
import plotly.graph_objects as go
from plotly.subplots import make_subplots

UP, DOWN = "#FF737D", "#58D5AD"
COLORS = ["#6DCFEF", "#F2C66D", "#BCA1F7", "#FF9C70", "#92DB97"]
CHART_CONFIG = {"displayModeBar": True, "displaylogo": False, "scrollZoom": False,
                "modeBarButtonsToRemove": ["lasso2d", "select2d"],
                "toImageButtonOptions": {"format": "png", "filename": "finance-chart", "scale": 2}}


def share_time_axis(fig, rows):
    # One actual axis gives all panes the same zoom and unified hover cursor.
    fig.update_xaxes(matches=None, visible=False, showticklabels=False)
    fig.update_traces(xaxis="x")
    fig.update_yaxes(anchor="x")
    fig.update_layout(xaxis=dict(anchor=f"y{rows}", visible=True, showticklabels=True))
    for shape in fig.layout.shapes or ():
        if str(shape.xref).endswith(" domain"):
            shape.xref = "x domain"
    for annotation in fig.layout.annotations or ():
        if str(annotation.xref).endswith(" domain"):
            annotation.xref = "x domain"


def theme(fig, height=650, revision=None):
    fig.update_layout(template="plotly_dark", paper_bgcolor="#0B1018", plot_bgcolor="#0B1018",
                      font=dict(color="#E8EEF7", size=12), margin=dict(l=15, r=25, t=100, b=35),
                      height=height, hovermode="x unified", hoversubplots="axis",
                      legend=dict(orientation="h", y=1.05, x=0, yanchor="bottom", font_size=11),
                      hoverlabel=dict(bgcolor="#202C3E", font_color="#FFFFFF"),
                      uirevision=revision)
    fig.update_xaxes(gridcolor="#202C3E", showspikes=True, spikecolor="#99ADBF",
                     spikemode="across", spikesnap="cursor", rangeslider_visible=False)
    fig.update_yaxes(gridcolor="#202C3E", fixedrange=False, zerolinecolor="#53647A")
    return fig


def technical_chart(frame, indicators, averages, revision):
    rows = 2 + len(indicators)
    titles = ["Ｋ線與均線", "成交量"] + ["MACD（12／26／9）" if x == "MACD" else "Stochastic KD（14／3）" for x in indicators]
    fig = make_subplots(rows=rows, cols=1, shared_xaxes=True, vertical_spacing=0.045,
                        row_heights=[0.52, 0.16] + [0.20] * len(indicators), subplot_titles=titles)
    # Naive local timestamps preserve the exchange calendar in the browser.
    x = frame.index.strftime("%Y-%m-%d")
    fig.add_trace(go.Candlestick(x=x, open=frame.Open, high=frame.High, low=frame.Low, close=frame.Close,
                                name="Ｋ線", increasing_line_color=UP, decreasing_line_color=DOWN), row=1, col=1)
    for i, average in enumerate(averages):
        fig.add_trace(go.Scatter(x=x, y=frame[f"MA{average}"], name=f"MA{average}", line=dict(color=COLORS[i % len(COLORS)], width=1.5)), row=1, col=1)
    colors = [UP if c >= o else DOWN for c, o in zip(frame.Close, frame.Open)]
    fig.add_trace(go.Bar(x=x, y=frame.Volume, name="成交量", marker_color=colors), row=2, col=1)
    for row, indicator in enumerate(indicators, 3):
        if indicator == "MACD":
            fig.add_trace(go.Bar(x=x, y=frame.Histogram, name="DIF − Signal",
                                 marker_color=[UP if v >= 0 else DOWN for v in frame.Histogram]), row=row, col=1)
            for field, color in (("DIF", "#F2C66D"), ("Signal", "#6DCFEF")):
                fig.add_trace(go.Scatter(x=x, y=frame[field], name=field, line=dict(color=color, width=1.5)), row=row, col=1)
        else:
            for field, color in (("K", "#BCA1F7"), ("D", "#6DCFEF")):
                fig.add_trace(go.Scatter(x=x, y=frame[field], name=field, line=dict(color=color, width=1.5)), row=row, col=1)
            for level in (20, 80):
                fig.add_hline(y=level, line_dash="dot", line_color="#65778E", row=row, col=1)
            fig.update_yaxes(range=[0, 100], row=row, col=1)
    # Categorical session axis omits both weekends and exchange holidays.
    fig.update_xaxes(type="category", nticks=9)
    share_time_axis(fig, rows)
    return theme(fig, height=480 + 160 * len(indicators), revision=revision)


def intraday_chart(frame, reference, revision):
    fig = make_subplots(rows=2, cols=1, shared_xaxes=True, row_heights=[0.76, 0.24], vertical_spacing=0.05)
    x = frame.index.tz_localize(None)
    color = UP if reference is not None and frame.iloc[-1].Close >= reference else DOWN if reference is not None else COLORS[0]
    fig.add_trace(go.Scatter(x=x, y=frame.Close, name="成交價", mode="lines", line=dict(color=color, width=2),
                            hovertemplate="%{x|%H:%M}<br>價格：%{y:.2f}<extra></extra>"), row=1, col=1)
    if reference is not None:
        fig.add_hline(y=reference, line_dash="dot", line_color="#F2C66D", annotation_text="昨收", row=1, col=1)
    fig.add_hline(y=float(frame.iloc[0].Open), line_dash="dash", line_color="#65778E", annotation_text="開盤", row=1, col=1)
    fig.add_trace(go.Bar(x=x, y=frame.Volume, name="每分鐘成交量",
                         marker_color=[UP if c >= o else DOWN for c, o in zip(frame.Close, frame.Open)]), row=2, col=1)
    fig.update_xaxes(tickformat="%H:%M")
    share_time_axis(fig, 2)
    return theme(fig, height=480, revision=revision)


def comparison_chart(frame, names, revision):
    fig = go.Figure()
    for ticker in frame:
        fig.add_trace(go.Scatter(x=frame.index, y=frame[ticker], name=names.get(ticker, ticker), mode="lines",
                                hovertemplate="%{x|%Y-%m-%d}<br>%{y:+.2f}%<extra>%{fullData.name}</extra>"))
    fig.add_hline(y=0, line_color="#65778E", line_dash="dot")
    fig.update_yaxes(title="累積報酬（％）", ticksuffix="%")
    return theme(fig, height=510, revision=revision)

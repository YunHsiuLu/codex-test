#!/bin/zsh
set -eu

project_dir="${0:A:h}"
port=8501
case "$#" in
  0) ;;
  1)
    if [[ "$1" == --server.port=* ]]; then
      port="${1#--server.port=}"
    else
      port="$1"
    fi
    ;;
  2)
    if [[ "$1" != --server.port ]]; then
      print -u2 '用法：./stop.sh [連接埠] 或 ./stop.sh --server.port 8502'
      exit 1
    fi
    port="$2"
    ;;
  *)
    print -u2 '用法：./stop.sh [連接埠] 或 ./stop.sh --server.port 8502'
    exit 1
    ;;
esac
if [[ "$port" != <-> || ${#port} -gt 5 ]]; then
  print -u2 '連接埠必須是１至６５５３５的整數。'
  exit 1
fi
port=$((10#$port))
if (( port < 1 || port > 65535 )); then
  print -u2 '連接埠必須是１至６５５３５的整數。'
  exit 1
fi

for utility in lsof ps; do
  if ! command -v "$utility" >/dev/null; then
    print -u2 "缺少必要指令：$utility"
    exit 1
  fi
done

listeners=$(lsof -nP -t -iTCP:"$port" -sTCP:LISTEN) || {
  print "連接埠 $port 沒有可找到的執行中工作台。"
  exit 0
}
stopped=0
for process_id in ${(fu)listeners}; do
  # Resolve both the working directory and app command before sending a signal.
  process_cwd=$(lsof -a -p "$process_id" -d cwd -Fn) || continue
  process_command=$(ps -p "$process_id" -o command=) || continue
  if [[ "${process_cwd#*$'\nn'}" != "$project_dir" ||
        "$process_command " != *' -m streamlit run app.py '* ]]; then
    continue
  fi
  kill -TERM "$process_id"
  stopped=1
  print "已送出停止指令：Finance Desk（連接埠 $port，PID $process_id）。"
done
if (( ! stopped )); then
  print -u2 "連接埠 $port 的程序不屬於此專案，或無法確認身分；未停止任何程序。"
  exit 1
fi

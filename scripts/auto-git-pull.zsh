# Automatically fast-forward this repository when entering its root directory.

autoload -U add-zsh-hook

_codex_test_git_pull_on_enter() {
    local repo="/Users/lvyunxiu/codex test"

    [[ "$PWD" == "$repo" ]] || return 0

    print -P "%F{cyan}[codex test]%f 正在與 GitHub 同步……"
    if ! command git -C "$repo" pull --ff-only; then
        print -P "%F{red}[codex test]%f git pull 失敗，請檢查上方訊息。" >&2
        return 1
    fi
}

add-zsh-hook chpwd _codex_test_git_pull_on_enter

# chpwd does not run when a shell starts inside the repository.
_codex_test_git_pull_on_enter

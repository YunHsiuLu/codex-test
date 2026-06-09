import sys


def find_winners(a, b, c):
    parities = (a & 1, b & 1, c & 1)

    if parities[0] == parities[1] == parities[2]:
        return "A B C"

    labels = "ABC"
    for i in range(3):
        if parities[i] != parities[(i + 1) % 3] and parities[i] != parities[(i + 2) % 3]:
            return labels[i]


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    rounds = data[0]
    answers = []

    for i in range(rounds):
        a, b, c = data[3 * i + 1 : 3 * i + 4]
        answers.append(find_winners(a, b, c))

    sys.stdout.write("\n".join(answers))


if __name__ == "__main__":
    main()

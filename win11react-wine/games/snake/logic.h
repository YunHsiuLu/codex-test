#ifndef SNAKE_LOGIC_H
#define SNAKE_LOGIC_H
#define COLS 24
#define ROWS 18
#define CAPACITY (COLS * ROWS)
typedef struct { int x, y; } Cell;
typedef struct {
    Cell body[CAPACITY], food;
    int length, dx, dy, next_dx, next_dy, turned, score, over, won;
    unsigned int random;
} Snake;
static int same(Cell a, Cell b) { return a.x == b.x && a.y == b.y; }
static int occupied(const Snake *s, Cell p) {
    for (int i = 0; i < s->length; i++) if (same(s->body[i], p)) return 1;
    return 0;
}
static void place_food(Snake *s) {
    if (s->length == CAPACITY) { s->won = 1; s->over = 1; return; }
    unsigned int n = s->random;
    n ^= n << 13; n ^= n >> 17; n ^= n << 5; s->random = n;
    int target = (int)(n % (CAPACITY - s->length));
    for (int y = 0; y < ROWS; y++) for (int x = 0; x < COLS; x++) {
        Cell p = {x,y}; if (!occupied(s,p) && target-- == 0) { s->food = p; return; }
    }
}
static void reset_game(Snake *s, unsigned int seed) {
    s->length = 4; s->dx = s->next_dx = 1; s->dy = s->next_dy = 0;
    s->score = s->over = s->won = s->turned = 0; s->random = seed ? seed : 1;
    for (int i = 0; i < s->length; i++) { s->body[i].x = COLS / 2 - i; s->body[i].y = ROWS / 2; }
    place_food(s);
}
static void turn(Snake *s, int dx, int dy) {
    if (s->over || s->turned || (dx == -s->dx && dy == -s->dy)) return;
    if (dx == s->dx && dy == s->dy) return;
    s->next_dx = dx; s->next_dy = dy; s->turned = 1;
}
static void step(Snake *s) {
    if (s->over) return;
    s->dx = s->next_dx; s->dy = s->next_dy; s->turned = 0;
    Cell head = {s->body[0].x + s->dx, s->body[0].y + s->dy};
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) { s->over = 1; return; }
    int grows = same(head, s->food);
    for (int i = 0; i < s->length - (grows ? 0 : 1); i++) if (same(head, s->body[i])) { s->over = 1; return; }
    if (grows) s->length++;
    for (int i = s->length - 1; i > 0; i--) s->body[i] = s->body[i-1];
    s->body[0] = head;
    if (grows) { s->score += 10; place_food(s); }
}
#endif

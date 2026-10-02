#include <assert.h>
#include <stdio.h>
#include "logic.h"
int main(void) {
    Snake s; reset_game(&s, 123); assert(s.length == 4 && !occupied(&s,s.food));
    int start = s.body[0].x; turn(&s,-1,0); step(&s); assert(s.body[0].x == start+1);
    turn(&s,0,-1); turn(&s,-1,0); step(&s); assert(s.dx == 0 && s.dy == -1); // one turn per tick
    s.food = (Cell){s.body[0].x,s.body[0].y-1}; step(&s); assert(s.score == 10 && s.length == 5 && !occupied(&s,s.food));
    while (!s.over) step(&s); assert(s.over && !s.won); // wall
    reset_game(&s,1); s.body[0]=(Cell){5,5};s.body[1]=(Cell){5,6};s.body[2]=(Cell){6,6};s.body[3]=(Cell){6,5};s.food=(Cell){0,0};
    step(&s); assert(!s.over && same(s.body[0],(Cell){6,5})); // vacated tail is legal
    reset_game(&s,1);s.length=5;s.body[0]=(Cell){5,5};s.body[1]=(Cell){5,6};s.body[2]=(Cell){6,6};s.body[3]=(Cell){6,5};s.body[4]=(Cell){7,5};s.food=(Cell){0,0};
    step(&s);assert(s.over); // body collision
    reset_game(&s,1);s.length=CAPACITY-1;s.body[0]=(Cell){0,0};int i=1;
    for(int y=0;y<ROWS;y++)for(int x=0;x<COLS;x++)if(!(y==0 && (x==0 || x==1)))s.body[i++]=(Cell){x,y};
    s.food=(Cell){1,0};step(&s);assert(s.won && s.length==CAPACITY && s.score==10);
    puts("PASS: reverse/turn buffering, growth, food, walls, tail movement, self collision, full-board win.");
}

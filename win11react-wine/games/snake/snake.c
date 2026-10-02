/* Standalone Windows x64 Snake. Native Win32/GDI, no CRT or third-party assets. */
#include "logic.h"
typedef void *H; typedef unsigned int U; typedef unsigned long D;
typedef unsigned long long UP; typedef long long LP; typedef unsigned short W;
typedef LP (*PROC)(H,U,UP,LP);
typedef struct { U style; PROC proc; int clsExtra,wndExtra; H instance,icon,cursor,brush; const W *menu,*name; } CLASS;
typedef struct { H hwnd; U message; UP wParam; LP lParam; D time; struct {long x,y;} point; D privateData; } MSG;
typedef struct {long left,top,right,bottom;} RECT;
typedef struct {H dc;int erase;RECT rect;int restore,update;unsigned char reserved[32];} PAINT;
#define API __declspec(dllimport)
API H GetModuleHandleW(const W *); API D GetTickCount(void); API void ExitProcess(U);
API H GetStdHandle(D); API int WriteFile(H,const void *,D,D *,void *);
API unsigned short RegisterClassW(const CLASS *);
API H CreateWindowExW(D,const W *,const W *,D,int,int,int,int,H,H,H,void *);
API LP DefWindowProcW(H,U,UP,LP); API int ShowWindow(H,int); API int UpdateWindow(H);
API int GetMessageW(MSG *,H,U,U); API int TranslateMessage(const MSG *); API LP DispatchMessageW(const MSG *);
API void PostQuitMessage(int); API int DestroyWindow(H); API H LoadCursorW(H,const W *);
API H BeginPaint(H,PAINT *); API int EndPaint(H,const PAINT *); API int GetClientRect(H,RECT *);
API int InvalidateRect(H,const RECT *,int); API UP SetTimer(H,UP,U,void *); API int KillTimer(H,UP);
API int FillRect(H,const RECT *,H); API int DrawTextW(H,const W *,int,RECT *,U);
API H CreateSolidBrush(D); API H SelectObject(H,H); API int DeleteObject(H);
API D SetTextColor(H,D); API int SetBkMode(H,int);
API H CreateFontW(int,int,int,int,int,D,D,D,D,D,D,D,D,const W *);
API H CreateCompatibleDC(H); API H CreateCompatibleBitmap(H,int,int); API int DeleteDC(H);
API int BitBlt(H,int,int,int,int,H,int,int,D);
static Snake snake;
static int playing, started, best;
static H font, titleFont;
#define RGB(r,g,b) ((D)(r)|((D)(g)<<8)|((D)(b)<<16))
static void log_event(const char *s){D n=0,len=0;while(s[len])len++;WriteFile(GetStdHandle(-11),s,len,&n,0);}
static void box(H dc,int x,int y,int w,int h,D color){RECT r={x,y,x+w,y+h};H brush=CreateSolidBrush(color);FillRect(dc,&r,brush);DeleteObject(brush);}
static void text(H dc,const W *label,RECT r,D color,H face,U align){H old=SelectObject(dc,face);SetTextColor(dc,color);SetBkMode(dc,1);DrawTextW(dc,label,-1,&r,align|0x20|0x4);SelectObject(dc,old);}
static void number(W *dest,int n){W reverse[12];int i=0;do{reverse[i++]=(W)('0'+n%10);n/=10;}while(n);int j=0;while(i)dest[j++]=reverse[--i];dest[j]=0;}
static void paint(H window,H dc){
    RECT r;GetClientRect(window,&r);int w=r.right,h=r.bottom;
    box(dc,0,0,w,h,RGB(14,22,35));
    text(dc,L"S N A K E",(RECT){28,12,w-28,58},RGB(120,238,169),titleFont,0);
    W score[12],record[12];number(score,snake.score);number(record,best);
    text(dc,L"SCORE",(RECT){w-242,16,w-150,37},RGB(142,159,182),font,0);
    text(dc,score,(RECT){w-242,38,w-150,70},RGB(241,245,249),titleFont,0);
    text(dc,L"BEST",(RECT){w-116,16,w-24,37},RGB(142,159,182),font,0);
    text(dc,record,(RECT){w-116,38,w-24,70},RGB(241,245,249),titleFont,0);
    text(dc,L"Arrows / WASD   Move       Space   Start / Pause       R   Restart",(RECT){28,76,w-28,104},RGB(158,178,201),font,0);
    int cell=(w-48)/COLS,cy=(h-160)/ROWS;if(cy<cell)cell=cy;if(cell<2)return;
    int left=(w-cell*COLS)/2,top=116+(h-160-cell*ROWS)/2;
    for(int y=0;y<ROWS;y++)for(int x=0;x<COLS;x++)box(dc,left+x*cell,top+y*cell,cell,cell,(x+y)%2?RGB(24,38,54):RGB(22,35,50));
    int inset=cell>12?3:1;
    box(dc,left+snake.food.x*cell+inset,top+snake.food.y*cell+inset,cell-2*inset,cell-2*inset,RGB(255,190,83));
    for(int i=snake.length-1;i>=0;i--)box(dc,left+snake.body[i].x*cell+1,top+snake.body[i].y*cell+1,cell-2,cell-2,i?RGB(44,168,112):RGB(133,247,182));
    int hx=left+snake.body[0].x*cell,hy=top+snake.body[0].y*cell,eye=cell/7;if(eye<1)eye=1;
    int ex=snake.dx==1?cell*3/4:snake.dx==-1?cell/4:cell/3;
    int ey=snake.dy==1?cell*3/4:snake.dy==-1?cell/4:cell/3;
    box(dc,hx+ex,hy+ey,eye,eye,RGB(14,40,35));
    box(dc,hx+(snake.dx?ex:cell*2/3),hy+(snake.dy?ey:cell*2/3),eye,eye,RGB(14,40,35));
    if(!playing){
        int bw=w-100;if(bw>470)bw=470;int bx=(w-bw)/2,by=top+cell*ROWS/2-56;
        box(dc,bx-2,by-2,bw+4,116,RGB(61,91,114));box(dc,bx,by,bw,112,RGB(14,22,35));
        const W *heading=snake.over?(snake.won?L"YOU WIN!":L"GAME OVER"):started?L"PAUSED":L"READY TO PLAY?";
        const W *hint=snake.over?L"Press R to try again":L"Press Space or an arrow key";
        text(dc,heading,(RECT){bx,by+12,bx+bw,by+58},RGB(241,245,249),titleFont,1);
        text(dc,hint,(RECT){bx,by+60,bx+bw,by+96},RGB(158,178,201),font,1);
    }
    text(dc,L"Eat the gold squares. Avoid walls and your own tail.",(RECT){24,h-34,w-24,h-6},RGB(142,159,182),font,1);
}
static void restart(H hwnd){reset_game(&snake,GetTickCount());playing=started=0;SetTimer(hwnd,1,140,0);InvalidateRect(hwnd,0,0);log_event("SNAKE_READY\n");}
static LP proc(H hwnd,U msg,UP key,LP data){
    switch(msg){
    case 1: restart(hwnd);return 0;
    case 5: InvalidateRect(hwnd,0,0);return 0;
    case 8: if(playing){playing=0;InvalidateRect(hwnd,0,0);}return 0; // pause when focus leaves game
    case 0x14:return 1;
    case 0x100:
        if(key==27){DestroyWindow(hwnd);return 0;}
        if(key=='R'){restart(hwnd);return 0;}
        if(key==32){if(!(data&0x40000000)&&!snake.over){playing=!playing;started=1;InvalidateRect(hwnd,0,0);}return 0;}
        if(snake.over)return 0;
        if(key==37||key=='A')turn(&snake,-1,0);
        else if(key==38||key=='W')turn(&snake,0,-1);
        else if(key==39||key=='D')turn(&snake,1,0);
        else if(key==40||key=='S')turn(&snake,0,1);
        else return 0;
        playing=started=1;InvalidateRect(hwnd,0,0);return 0;
    case 0x113:
        if(playing){int before=snake.score;step(&snake);if(snake.score>best)best=snake.score;
            if(before!=snake.score){int speed=140-snake.score/5;if(speed<65)speed=65;SetTimer(hwnd,1,(U)speed,0);log_event("SNAKE_ATE_FOOD\n");}
            if(snake.over){playing=0;log_event(snake.won?"SNAKE_WIN\n":"SNAKE_GAME_OVER\n");}InvalidateRect(hwnd,0,0);}
        return 0;
    case 0xf:{PAINT ps;H target=BeginPaint(hwnd,&ps);RECT r;GetClientRect(hwnd,&r);
        if(r.right>0&&r.bottom>0){H dc=CreateCompatibleDC(target),bitmap=CreateCompatibleBitmap(target,r.right,r.bottom),old=SelectObject(dc,bitmap);
            paint(hwnd,dc);BitBlt(target,0,0,r.right,r.bottom,dc,0,0,0x00cc0020);SelectObject(dc,old);DeleteObject(bitmap);DeleteDC(dc);}
        EndPaint(hwnd,&ps);return 0;}
    case 2:KillTimer(hwnd,1);PostQuitMessage(0);return 0;
    }
    return DefWindowProcW(hwnd,msg,key,data);
}
void mainCRTStartup(void){
    H instance=GetModuleHandleW(0);CLASS c={0};c.proc=proc;c.instance=instance;c.name=L"Win11ReactSnake";c.cursor=LoadCursorW(0,(const W *)32512);
    font=CreateFontW(-18,0,0,0,400,0,0,0,1,0,0,5,0,L"Segoe UI");
    titleFont=CreateFontW(-30,0,0,0,700,0,0,0,1,0,0,5,0,L"Segoe UI");
    if(!RegisterClassW(&c))ExitProcess(11);
    H window=CreateWindowExW(0,c.name,L"Snake - Win11React Wine",0xcf0000,100,80,860,810,0,0,instance,0);
    if(!window)ExitProcess(12);ShowWindow(window,1);UpdateWindow(window);log_event("SNAKE_WINDOW_READY\n");
    MSG msg;int result;while((result=GetMessageW(&msg,0,0,0))>0){TranslateMessage(&msg);DispatchMessageW(&msg);}
    DeleteObject(font);DeleteObject(titleFont);log_event("SNAKE_EXIT\n");ExitProcess(result<0?13:(U)msg.wParam);
}

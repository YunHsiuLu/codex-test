/* A tiny self-authored Win32 click game, built without the Windows SDK or CRT. */
typedef void *HANDLE;
typedef unsigned int UINT;
typedef unsigned long DWORD;
typedef unsigned long long WPARAM;
typedef long long LPARAM;
typedef long long LRESULT;
typedef unsigned short WCHAR;
typedef LRESULT (*WNDPROC)(HANDLE, UINT, WPARAM, LPARAM);
typedef struct { UINT style; WNDPROC proc; int clsExtra, wndExtra; HANDLE instance, icon, cursor, brush; const WCHAR *menu, *name; } WNDCLASSW;
typedef struct { HANDLE hwnd; UINT message; WPARAM wParam; LPARAM lParam; DWORD time; struct { long x,y; } point; DWORD privateData; } MSG;
#define API __declspec(dllimport)
API HANDLE GetModuleHandleW(const WCHAR *);
API void *GetStdHandle(DWORD);
API int WriteFile(void *, const void *, DWORD, DWORD *, void *);
API __declspec(noreturn) void ExitProcess(UINT);
API unsigned short RegisterClassW(const WNDCLASSW *);
API HANDLE CreateWindowExW(DWORD,const WCHAR *,const WCHAR *,DWORD,int,int,int,int,HANDLE,HANDLE,HANDLE,void *);
API LRESULT DefWindowProcW(HANDLE,UINT,WPARAM,LPARAM);
API int ShowWindow(HANDLE,int);
API int UpdateWindow(HANDLE);
API int GetMessageW(MSG *,HANDLE,UINT,UINT);
API int TranslateMessage(const MSG *);
API LRESULT DispatchMessageW(const MSG *);
API void PostQuitMessage(int);
API int SetWindowTextW(HANDLE,const WCHAR *);
API int DestroyWindow(HANDLE);
API LRESULT SendMessageW(HANDLE,UINT,WPARAM,LPARAM);
API HANDLE GetStockObject(int);
static HANDLE scoreLabel, instance;
static unsigned int score;
static int exitCode;
static const WCHAR className[] = L"Win11ReactSelfAuthoredTest";
static void updateScore(void) {
    WCHAR label[] = L"Score: 000";
    label[7] = (WCHAR)('0' + score / 100);
    label[8] = (WCHAR)('0' + (score / 10) % 10);
    label[9] = (WCHAR)('0' + score % 10);
    SetWindowTextW(scoreLabel, label);
    char result[]="GUI_SCORE:000\n"; result[10]=(char)label[7];result[11]=(char)label[8];result[12]=(char)label[9];
    DWORD written=0;WriteFile(GetStdHandle(-11),result,sizeof(result)-1,&written,0);
}
static HANDLE child(HANDLE parent,const WCHAR *kind,const WCHAR *label,int x,int y,int w,int h,int id) {
    HANDLE result = CreateWindowExW(0,kind,label,0x50000000UL,x,y,w,h,parent,(HANDLE)(WPARAM)id,instance,0);
    SendMessageW(result,0x0030,(WPARAM)GetStockObject(17),1);
    return result;
}
static LRESULT windowProc(HANDLE hwnd,UINT message,WPARAM wParam,LPARAM lParam) {
    switch (message) {
    case 0x0001: /* WM_CREATE */
        child(hwnd,L"STATIC",L"Self-authored Windows game running via Wine",24,20,430,30,0);
        scoreLabel = child(hwnd,L"STATIC",L"Score: 000",24,62,400,36,0);
        child(hwnd,L"BUTTON",L"Click +1",24,110,410,46,101);
        child(hwnd,L"BUTTON",L"Finish successfully",24,174,198,40,102);
        child(hwnd,L"BUTTON",L"Test failure (exit 7)",236,174,198,40,103);
        return 0;
    case 0x0100: if(wParam==32){score=(score+1)%1000;updateScore();return 0;}break;
    case 0x0111: /* WM_COMMAND */
        switch (wParam & 0xffff) {
        case 101: score = (score + 1) % 1000; updateScore(); return 0;
        case 102: exitCode = 0; DestroyWindow(hwnd); return 0;
        case 103: exitCode = 7; DestroyWindow(hwnd); return 0;
        }
        break;
    case 0x0002: PostQuitMessage(exitCode); return 0; /* WM_DESTROY */
    }
    return DefWindowProcW(hwnd,message,wParam,lParam);
}
void mainCRTStartup(void) {
    instance = GetModuleHandleW(0);
    WNDCLASSW wc = {0};
    wc.proc=windowProc; wc.instance=instance; wc.brush=(HANDLE)6; wc.name=className;
    if (!RegisterClassW(&wc)) ExitProcess(11);
    HANDLE window=CreateWindowExW(0,className,L"Click Game - Win11React Wine Test",0x00cf0000UL,100,100,480,290,0,0,instance,0);
    if (!window) ExitProcess(12);
    ShowWindow(window,1); UpdateWindow(window);
    const char text[]="GUI_WINDOW_CREATED: self-authored Click Game.\r\n";
    DWORD written=0; WriteFile(GetStdHandle(-11),text,sizeof(text)-1,&written,0);
    MSG msg;
    int result;
    while ((result=GetMessageW(&msg,0,0,0)) > 0) { TranslateMessage(&msg); DispatchMessageW(&msg); }
    ExitProcess(result < 0 ? 13 : (UINT)msg.wParam);
}

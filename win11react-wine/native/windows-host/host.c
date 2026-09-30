/* Win32 GDI view host. Captures only a window owned by the launched process.
   No desktop screenshots or global input injection. No Windows SDK/CRT needed. */
typedef void *H; typedef unsigned long D; typedef unsigned int U;
typedef unsigned short W; typedef unsigned long long UP; typedef long long LP;
typedef struct { long x,y; } POINT;
typedef struct { long left,top,right,bottom; } RECT;
typedef struct { D cb; W *reserved,*desktop,*title; D x,y,w,h,xc,yc,fill,flags; unsigned short show,reserved2; void *bytes; H in,out,err; } STARTUP;
typedef struct { H process,thread; D pid,tid; } PROCESS;
typedef struct { D size; long width,height; unsigned short planes,bits; D compression,image; long xp,yp; D used,important; } BI;
#define API __declspec(dllimport)
API W *GetCommandLineW(void); API W **CommandLineToArgvW(const W *,int *);
API int CreateProcessW(const W *,W *,void *,void *,int,D,void *,const W *,STARTUP *,PROCESS *);
API H GetStdHandle(D); API D WaitForSingleObject(H,D); API int GetExitCodeProcess(H,D *);
API void Sleep(D); API void ExitProcess(U); API H GetProcessHeap(void); API void *HeapAlloc(H,D,UP); API int HeapFree(H,D,void *);
API H CreateThread(void *,UP,D (*)(void *),void *,D,D *);
API int ReadFile(H,void *,D,D *,void *); API int WriteFile(H,const void *,D,D *,void *);
API H CreateFileW(const W *,D,D,void *,D,D,H); API int CloseHandle(H); API int MoveFileExW(const W *,const W *,D);
API int EnumWindows(int (*)(H,LP),LP); API D GetWindowThreadProcessId(H,D *); API int IsWindowVisible(H);
API H GetWindow(H,U); API int GetClientRect(H,RECT *); API int PrintWindow(H,H,U);
API H GetDC(H); API int ReleaseDC(H,H); API H CreateCompatibleDC(H); API int DeleteDC(H);
API H CreateDIBSection(H,const BI *,U,void **,H,D); API H SelectObject(H,H); API int DeleteObject(H);
API int SetWindowPos(H,H,int,int,int,int,U); API int PostMessageW(H,U,UP,LP);
API H ChildWindowFromPointEx(H,POINT,U); API int MapWindowPoints(H,H,POINT *,U);
API int GdiFlush(void);
API int GetExitCodeThread(H,D *);
API D GetCurrentProcessId(void); API D GetEnvironmentVariableW(const W *,W *,D);
API int SetEnvironmentVariableW(const W *,const W *); API H GetModuleHandleW(const W *);
API void *GetProcAddress(H,const char *); API void *VirtualAllocEx(H,void *,UP,D,D);
API int WriteProcessMemory(H,void *,const void *,UP,UP *);
API H CreateRemoteThread(H,void *,UP,void *,void *,D,D *);
API D ResumeThread(H); API int TerminateProcess(H,U);
API int BitBlt(H,int,int,int,int,H,int,int,D);
API LP SendMessageTimeoutW(H,U,UP,LP,U,U,UP *);
static volatile H window; static D gamePid; static volatile int stopping;
static W framePath[32768], tempPath[32768];
static void logline(const char *s) { D n=0,len=0; while(s[len])len++; WriteFile(GetStdHandle(-11),s,len,&n,0); }
static int findWindow(H h,LP unused) {
    (void)unused; D pid=0; GetWindowThreadProcessId(h,&pid);
    if(pid==gamePid && IsWindowVisible(h) && !GetWindow(h,4)) { window=h; return 0; } return 1;
}
static int number(const char **p) { int n=0,sign=1; while(**p==' ')(*p)++; if(**p=='-'){sign=-1;(*p)++;} while(**p>='0' && **p<='9'){n=n*10+*(*p)++-'0';} return n*sign; }
static void input(const char *line) {
    H target=(H)window; if(!target)return;
    const char *p=line+1; int a=number(&p),b=number(&p),c=number(&p);
    if(line[0]=='q'){stopping=1;PostMessageW(target,0x10,0,0);return;}
    if(line[0]=='k'){PostMessageW(target,b?0x100:0x101,(UP)a,b?1:0xc0000001);return;}
    if(line[0]=='c'){PostMessageW(target,0x102,(UP)a,1);return;}
    POINT point={a,b}; H child;
    for(int depth=0;depth<16;depth++) { child=ChildWindowFromPointEx(target,point,3); if(!child||child==target)break; MapWindowPoints(target,child,&point,1);target=child; }
    U msg=line[0]=='d'?(c==2?0x204:0x201):line[0]=='u'?(c==2?0x205:0x202):0x200;
    PostMessageW(target,msg,line[0]=='d'?(c==2?2:1):0,((LP)(point.y&0xffff)<<16)|(point.x&0xffff));
}
static D inputThread(void *unused) {
    (void)unused; char line[128]; int pos=0; D n; char ch;
    while(ReadFile(GetStdHandle(-10),&ch,1,&n,0)&&n) {
        if(ch=='\n'){line[pos]=0;input(line);pos=0;}else if(pos<126)line[pos++]=ch;
    }
    stopping=1; if(window)PostMessageW((H)window,0x10,0,0); return 0;
}
static int frame(void) {
    H hwnd=(H)window; RECT r; if(!GetClientRect(hwnd,&r))return 0;
    int width=r.right,height=r.bottom; if(width<1||height<1||width>1920||height>1080)return 0;
    BI bi={0};bi.size=40;bi.width=width;bi.height=-height;bi.planes=1;bi.bits=32;bi.image=(D)(width*height*4);
    H screen=GetDC(hwnd),dc=CreateCompatibleDC(screen);void *pixels=0;
    H bitmap=CreateDIBSection(screen,&bi,0,&pixels,0,0),old=SelectObject(dc,bitmap);
    int ok=bitmap && BitBlt(dc,0,0,width,height,screen,0,0,0x00cc0020); GdiFlush();
    if(ok) {
        unsigned char header[14]={0x42,0x4d}; D length=54+bi.image; for(int i=0;i<4;i++)header[2+i]=(unsigned char)(length>>(i*8));header[10]=54;
        H file=CreateFileW(tempPath,0x40000000,0,0,2,0x80,0);D n;
        if(file!=(H)-1){ok=WriteFile(file,header,14,&n,0)&&n==14;ok=ok&&WriteFile(file,&bi,40,&n,0)&&n==40;ok=ok&&WriteFile(file,pixels,bi.image,&n,0)&&n==bi.image;CloseHandle(file);if(ok)ok=MoveFileExW(tempPath,framePath,1);}
        else ok=0;
    }
    SelectObject(dc,old);DeleteObject(bitmap);DeleteDC(dc);ReleaseDC(hwnd,screen);return ok;
}
static void paths(const W *path) {
    int i;for(i=0;path[i]&&i<32750;i++){framePath[i]=path[i];tempPath[i]=path[i];}framePath[i]=0;tempPath[i++]='.';tempPath[i++]='t';tempPath[i++]='m';tempPath[i++]='p';tempPath[i]=0;
}
#ifdef HOST_DLL
static D displayThread(void *unused) {
    (void)unused;W *path=HeapAlloc(GetProcessHeap(),8,65536);
    if(!GetEnvironmentVariableW(L"WIN11_FRAME_FILE",path,32768))return 0;
    paths(path);HeapFree(GetProcessHeap(),0,path);gamePid=GetCurrentProcessId();
    CreateThread(0,0,inputThread,0,0,0);int announced=0;D ticks=0;
    for(;;) {
        if(!window){EnumWindows(findWindow,0);if(window){SetWindowPos((H)window,0,-20000,-20000,0,0,0x15);logline("EMBEDDED_WINDOW_CONNECTED\n");}}
        if(window&&frame()&&!announced){announced=1;logline("EMBEDDED_FRAME_READY\n");}
        if(stopping&&++ticks>100)ExitProcess(123);
        Sleep(100);
    }
}
int DllMain(H module,D reason,void *reserved) {
    (void)module;(void)reserved;if(reason==1)CreateThread(0,0,displayThread,0,0,0);return 1;
}
#else
void mainCRTStartup(void) {
    int argc=0;W **argv=CommandLineToArgvW(GetCommandLineW(),&argc);if(argc!=4)ExitProcess(120);
    SetEnvironmentVariableW(L"WIN11_FRAME_FILE",argv[2]);
    W *command=HeapAlloc(GetProcessHeap(),8,65536);int i,j=0;command[j++]='"';for(i=0;argv[1][i]&&j<32760;i++)command[j++]=argv[1][i];command[j++]='"';command[j]=0;
    STARTUP si={0};PROCESS pi={0};si.cb=sizeof(si);si.flags=0x100;si.in=GetStdHandle(-10);si.out=GetStdHandle(-11);si.err=GetStdHandle(-12);
    if(!CreateProcessW(argv[1],command,0,0,1,4,0,0,&si,&pi)){logline("EMBEDDED_CREATE_PROCESS_FAILED\n");ExitProcess(121);}
    UP bytes=0;while(argv[3][bytes])bytes++;bytes=(bytes+1)*2;
    void *remote=VirtualAllocEx(pi.process,0,bytes,0x3000,4);UP written=0;
    if(!remote||!WriteProcessMemory(pi.process,remote,argv[3],bytes,&written)||written!=bytes){TerminateProcess(pi.process,124);ExitProcess(124);}
    H thread=CreateRemoteThread(pi.process,0,0,GetProcAddress(GetModuleHandleW(L"kernel32.dll"),"LoadLibraryW"),remote,0,0);
    if(!thread){TerminateProcess(pi.process,125);ExitProcess(125);}
    WaitForSingleObject(thread,10000);D loaded=0;GetExitCodeThread(thread,&loaded);CloseHandle(thread);
    if(!loaded||loaded==259){logline("EMBEDDED_COMPONENT_LOAD_FAILED\n");TerminateProcess(pi.process,126);ExitProcess(126);}
    ResumeThread(pi.thread);CloseHandle(pi.thread);WaitForSingleObject(pi.process,0xffffffff);
    D code=122;GetExitCodeProcess(pi.process,&code);CloseHandle(pi.process);ExitProcess(code);
}
#endif

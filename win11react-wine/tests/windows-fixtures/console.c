/* Self-authored Windows PE test. No C runtime or downloaded EXE required. */
__declspec(dllimport) void *GetStdHandle(unsigned long);
__declspec(dllimport) int WriteFile(void *, const void *, unsigned long, unsigned long *, void *);
__declspec(dllimport) unsigned long GetFileAttributesA(const char *);
__declspec(dllimport) __declspec(noreturn) void ExitProcess(unsigned int);
static void print(unsigned long stream, const char *text, unsigned long len) {
    unsigned long written = 0;
    WriteFile(GetStdHandle(stream), text, len, &written, 0);
}
#define PRINT(stream, text) print(stream, text, sizeof(text) - 1)
void mainCRTStartup(void) {
    if (GetFileAttributesA("fixture-data.txt") == 0xffffffffUL) {
        PRINT(-12, "FIXTURE_CWD_FAILURE: fixture-data.txt missing beside EXE.\r\n");
        ExitProcess(9);
    }
#ifdef EXPECT_FAILURE
    PRINT(-12, "FIXTURE_EXPECTED_FAILURE: self-authored Windows EXE returned 7.\r\n");
    ExitProcess(7);
#else
    PRINT(-11, "FIXTURE_SUCCESS: self-authored Windows EXE; adjacent data found; exit 0.\r\n");
    ExitProcess(0);
#endif
}
